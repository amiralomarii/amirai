/* The Signal v10: restrained mobile reading tools and system-first sharing.
   Progressive enhancement; no tracking, framework or external dependency. */
(()=>{
 'use strict';
 if(document.body.dataset.page!=='article')return;
 const body=document.body;
 const shareUrl=body.dataset.shareUrl||location.href;
 const shareTitle=body.dataset.shareTitle||document.title;
 const options=document.querySelector('#share-options');
 const topShare=document.querySelector('#share-trigger');
 const bottomShare=document.querySelector('#v4-native-share');
 const backdrop=document.createElement('div');
 backdrop.className='signal-share-backdrop';
 backdrop.setAttribute('aria-hidden','true');
 let lastFocus=null;
 let toastTimer;
 const icon=(name)=>{
  const shapes={close:'<path d="M18 6 6 18M6 6l12 12"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',check:'<path d="m20 6-11 11-5-5"/>'};
  return `<svg class="signal-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name]}</svg>`;
 };
 const announce=document.createElement('div');
 announce.className='signal-toast';announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 document.body.appendChild(announce);
 function toast(message){
   clearTimeout(toastTimer);announce.textContent=message;announce.classList.add('is-visible');
   toastTimer=setTimeout(()=>announce.classList.remove('is-visible'),2500);
 }
 async function copyLink(){
  let ok=false;
  if(navigator.clipboard && window.isSecureContext){try{await navigator.clipboard.writeText(shareUrl);ok=true;}catch(_){}}
  if(!ok){
   const input=document.createElement('textarea');input.value=shareUrl;input.setAttribute('readonly','');
   input.style.cssText='position:fixed;left:-9999px;top:0;';document.body.appendChild(input);input.select();
   try{ok=document.execCommand('copy');}catch(_){} input.remove();
  }
  if(ok){closeSheet();toast('Link copied to clipboard');}
  else toast('Please copy the link from your address bar');
  return ok;
 }
 let closeButton=null;
 function closeSheet(){
   if(!options||!options.classList.contains('is-open'))return;
   options.classList.remove('is-open');body.classList.remove('signal-share-open');
   topShare?.setAttribute('aria-expanded','false');bottomShare?.setAttribute('aria-expanded','false');
   if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
 }
 if(options){
   const heading=document.createElement('div');heading.className='signal-share-heading';
   heading.innerHTML='<div><span class="signal-share-eyebrow">THE SIGNAL</span><h2 id="signal-share-title">Share this story</h2><p>Send this article or copy its link.</p></div>';
   closeButton=document.createElement('button');closeButton.type='button';closeButton.className='signal-share-close';
   closeButton.setAttribute('aria-label','Close sharing options');closeButton.innerHTML=icon('close');
   closeButton.addEventListener('click',closeSheet);heading.appendChild(closeButton);
   options.prepend(heading);
   const copyButton=document.createElement('button');copyButton.type='button';copyButton.className='share-button signal-share-copy';
   copyButton.innerHTML=`${icon('copy')}<span>Copy story link</span>`;copyButton.addEventListener('click',copyLink);
   options.appendChild(copyButton);
   options.setAttribute('role','dialog');options.setAttribute('aria-modal','true');options.setAttribute('aria-labelledby','signal-share-title');
   options.setAttribute('tabindex','-1');
   document.body.append(backdrop,options);
   backdrop.addEventListener('click',closeSheet);
   options.querySelectorAll('a[data-share]').forEach(a=>a.addEventListener('click',closeSheet));
 }
 function openSheet(source){
   if(!options){copyLink();return;}
   lastFocus=source||document.activeElement;
   options.classList.add('is-open');body.classList.add('signal-share-open');
   topShare?.setAttribute('aria-expanded','true');bottomShare?.setAttribute('aria-expanded','true');
   requestAnimationFrame(()=>closeButton?.focus({preventScroll:true}));
 }
 async function shareStory(source){
   if(navigator.share){
     try{await navigator.share({title:shareTitle,text:shareTitle,url:shareUrl});return;}
     catch(error){if(error?.name==='AbortError')return;}
   }
   openSheet(source);
 }
 // news.js and the mobile action bar call the same sharing routine.
 window.theSignalShare=shareStory;
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeSheet();
  if(e.key!=='Tab'||!options?.classList.contains('is-open'))return;
  const focusable=[...options.querySelectorAll('button:not([disabled]),a[href]')];
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });

 // Text preferences apply to paragraph AND explanatory copy across every article.
 const article=document.querySelector('#article-content');
 const controller=document.querySelector('.article-size');
 if(!article||!controller)return;
 const buttons=[...controller.querySelectorAll('[data-text-size]')];
 const MAX=23,MIN=15,DEFAULT=17,STEP=2;
 let size=DEFAULT;
 try{const stored=Number(localStorage.getItem('the-signal-reading-size-v2'));if(Number.isFinite(stored)&&stored>=MIN&&stored<=MAX)size=stored;}catch(_){}
 // Override the earlier v3 increments with one 2px step; capture suppresses old listeners.
 // The control supports repeated taps without triggering mobile Safari double-tap zoom.
 const meter=document.createElement('output');meter.className='signal-size-value';meter.setAttribute('aria-live','polite');
 meter.setAttribute('aria-label','Article text size');
 const group=controller.querySelector('div');
 if(group)group.insertBefore(meter,buttons[1]||null);
 const reset=document.createElement('button');reset.type='button';reset.className='signal-size-reset';
 reset.textContent='Reset';reset.setAttribute('aria-label','Reset article text size');
 controller.appendChild(reset);
 function setSize(next){
   size=Math.max(MIN,Math.min(MAX,next));
   article.style.setProperty('--reader-size',`${size}px`);
   meter.textContent=`${Math.round(size/DEFAULT*100)}%`;
   buttons.forEach(btn=>{const direction=btn.dataset.textSize;
     btn.disabled=direction==='larger'?size>=MAX:size<=MIN;
   });
   reset.disabled=size===DEFAULT;
   reset.setAttribute('aria-label',size===DEFAULT?'Article text size is default':'Reset article text size');
   try{localStorage.setItem('the-signal-reading-size-v2',String(size));}catch(_){}
 }
 buttons.forEach(btn=>btn.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   setSize(size+(btn.dataset.textSize==='larger'?STEP:-STEP));
 },true));
 reset.addEventListener('click',()=>setSize(DEFAULT));
 setSize(size);
})();
