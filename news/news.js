/* The Signal v3: no framework, account, network API or cookies required. */
(()=>{'use strict';
  // GitHub Pages serves each directory's index.html at its clean trailing-slash URL.
  // Normalize old bookmarks and direct links without reloading the article.
  try {
    const { pathname, search, hash } = window.location;
    if (/\/index\.html$/i.test(pathname)) {
      window.history.replaceState(window.history.state, '',
        pathname.slice(0, -'index.html'.length) + search + hash);
    }
  } catch (_) { /* navigation stays usable if history is restricted */ }
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const toggle=$('.menu-toggle'),nav=$('.mobile-nav');
  const closeNav=()=>{
    toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open navigation');
    nav?.classList.remove('is-open');nav?.setAttribute('aria-hidden','true');
    document.body.classList.remove('menu-open');
  };
  toggle?.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')!=='true';
    toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    nav?.classList.toggle('is-open',open);nav?.setAttribute('aria-hidden',String(!open));
    document.body.classList.toggle('menu-open',open);
  });
  $('.mobile-nav__backdrop')?.addEventListener('click',closeNav);
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
  $$('[data-year]').forEach(el=>el.textContent=String(new Date().getFullYear()));


  // Editorial jump links: smooth, header-aware motion with reduced-motion support.
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  $$('.news-hero-links a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href'),target=id&&document.querySelector(id);
    if(!target)return;
    e.preventDefault();
    const top=Math.max(0,target.getBoundingClientRect().top+window.scrollY-105);
    window.scrollTo({top,behavior:reduced.matches?'instant':'smooth'});
    try{history.pushState(null,'',id);}catch(_){location.hash=id;}
  }));
  // A lightweight, accessible reading guide to the section currently in view.
  const toc=$$('.article-aside__toc a[href^="#"]');
  if(toc.length&&'IntersectionObserver' in window){
    const sections=toc.map(a=>document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const observer=new IntersectionObserver(entries=>{
      const seen=entries.filter(en=>en.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(!seen.length)return;
      const id=seen[0].target.id;
      toc.forEach(a=>{const active=a.getAttribute('href')==='#'+id;a.classList.toggle('is-current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    },{rootMargin:'-120px 0px -62% 0px',threshold:0});
    sections.forEach(section=>observer.observe(section));
  }

  // Bookmarks are strictly local to this browser and can be cleared with browser storage.
  let saved=[];
  try{const val=JSON.parse(localStorage.getItem('the-signal-saved-v2')||'[]');if(Array.isArray(val))saved=val.filter(v=>typeof v==='string');}catch(_){/* storage blocked */}
  const syncSaved=()=>{
    $$('[data-bookmark]').forEach(b=>{
      const has=saved.includes(b.dataset.bookmark);b.setAttribute('aria-pressed',String(has));
      b.classList.toggle('is-saved',has);
      const label=b.querySelector('.signal-button-label');
      if(label)label.textContent=has?'Saved':'Save story';
      else if(!b.classList.contains('news-bookmark'))b.textContent=has?'Saved':'Save story';
    });
    const count=$('#saved-count');if(count)count.textContent=String(saved.length);
  };
  $$('[data-bookmark]').forEach(b=>b.addEventListener('click',()=>{
    const slug=b.dataset.bookmark;
    saved=saved.includes(slug)?saved.filter(x=>x!==slug):[...saved,slug];
    try{localStorage.setItem('the-signal-saved-v2',JSON.stringify(saved));}catch(_){/* continue without persistence */}
    syncSaved();
    if($('#story-grid'))render();
  }));
  syncSaved();

  const grid=$('#story-grid'),cards=$$('#story-grid .news-card'),search=$('#news-search'),sort=$('#news-sort'),filters=$$('[data-filter]');
  let category='All',visible=9;
  function render(options={}){
    if(!grid)return;
    const term=(search?.value||'').trim().toLocaleLowerCase();
    const matches=cards.filter(c=>(category==='All'||(category==='Saved'?saved.includes(c.dataset.slug):c.dataset.topic===category))&&c.dataset.search.includes(term));
    const mode=sort?.value||'newest';
    matches.sort((a,b)=>mode==='az'?a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent):mode==='oldest'?a.dataset.date.localeCompare(b.dataset.date):b.dataset.date.localeCompare(a.dataset.date));
    const ordered=[...matches,...cards.filter(c=>!matches.includes(c))];
    ordered.forEach(c=>grid.appendChild(c));
    matches.forEach((c,i)=>{c.hidden=i>=visible;});
    cards.filter(c=>!matches.includes(c)).forEach(c=>{c.hidden=true;});
    const count=$('#news-results');if(count)count.textContent=`Showing ${Math.min(visible,matches.length)} of ${matches.length} ${matches.length===1?'story':'stories'}`;
    $('#news-empty')?.classList.toggle('is-visible',matches.length===0);
    const more=$('#news-load-more');if(more)more.hidden=visible>=matches.length;
    const clear=$('#clear-news');if(clear)clear.hidden=!(term||category!=='All'||mode!=='newest');
    if(options.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const start=options.newStart||0;
      matches.slice(start,visible).forEach((card,index)=>{
        card.classList.remove('v7-reveal');void card.offsetWidth;
        card.style.setProperty('--v7-delay',`${Math.min(index*42,420)}ms`);
        card.classList.add('v7-reveal');
      });
    }
  }
  function activate(value){
    category=value;visible=9;
    filters.forEach(b=>{const on=b.dataset.filter===value;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
    render({animate:true});
  }
  filters.forEach(button=>button.addEventListener('click',()=>activate(button.dataset.filter)));
  search?.addEventListener('input',()=>{visible=9;render({animate:true});});
  sort?.addEventListener('change',()=>{visible=9;render({animate:true});});
  $('#news-load-more')?.addEventListener('click',async()=>{
    const button=$('#news-load-more');
    if(button.disabled)return;
    const previous=visible;
    // Warm the next nine images BEFORE revealing the row. Never hold the reader indefinitely
    // on a slow or inaccessible third-party image host.
    const term=(search?.value||'').trim().toLocaleLowerCase();
    const candidates=[...grid.querySelectorAll('.news-card[hidden]')].filter(c=>
      (category==='All'||(category==='Saved'?saved.includes(c.dataset.slug):c.dataset.topic===category))&&c.dataset.search.includes(term)).slice(0,9);
    button.disabled=true;button.classList.add('is-preparing');
    const oldLabel=button.innerHTML;button.innerHTML='Preparing next stories <span aria-hidden="true">…</span>';
    const loading=candidates.map(c=>{
      const img=c.querySelector('img');if(!img)return Promise.resolve();
      img.loading='eager';img.fetchPriority='low';
      if(img.complete&&img.naturalWidth)return Promise.resolve();
      return typeof img.decode==='function'?img.decode().catch(()=>{}):new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});
      });
    });
    await Promise.race([Promise.all(loading),new Promise(r=>setTimeout(r,1800))]);
    visible+=9;render({animate:true,newStart:previous});
    button.disabled=false;button.classList.remove('is-preparing');button.innerHTML=oldLabel;
    const firstNew=[...grid.querySelectorAll('.news-card:not([hidden])')][previous];
    if(firstNew){
      const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const header=document.querySelector('.site-header');
        const offset=Math.max(82,Math.min(145,(header?.offsetHeight||90)+30));
        const top=Math.max(0,firstNew.getBoundingClientRect().top+window.scrollY-offset);
        window.scrollTo({top,behavior:motion});
      }));
    }
  });
  const reset=()=>{if(search)search.value='';if(sort)sort.value='newest';activate('All');};
  $('#reset-empty')?.addEventListener('click',reset);
  $('#clear-news')?.addEventListener('click',reset);
  render();

  const shareUrl=document.body.dataset.shareUrl,shareTitle=document.body.dataset.shareTitle;
  if(shareUrl&&shareTitle){
    const shareText=`${shareTitle} — The Signal by Amir Alomari\n${shareUrl}`;
    const encodedUrl=encodeURIComponent(shareUrl);
    const links={whatsapp:`https://wa.me/?text=${encodeURIComponent(shareText)}`,
      linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      x:`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle+' — The Signal')}&url=${encodedUrl}`,
      telegram:`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareTitle)}`};
    $$('[data-share]').forEach(a=>{if(Object.prototype.hasOwnProperty.call(links,a.dataset.share))a.href=links[a.dataset.share];});
    const opts=$('#share-options'),trigger=$('#share-trigger');
    trigger?.addEventListener('click',()=>{
      if(window.theSignalShare)window.theSignalShare(trigger);
      else if(navigator.share)navigator.share({title:shareTitle,url:shareUrl}).catch(()=>{});
    });
    async function copy(button){
      let success=false;
      if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(shareUrl);success=true;}catch(_){}}
      if(!success){const t=document.createElement('textarea');t.value=shareUrl;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{success=document.execCommand('copy');}catch(_){}t.remove();}
      const label=button.querySelector('.signal-button-label')||button;
      const prior=label.textContent;
      label.textContent=success?'Link copied':'Copy the address bar URL';
      window.setTimeout(()=>{label.textContent=prior;},2600);
    }
    const copyTop=$('#copy-trigger');copyTop?.addEventListener('click',()=>copy(copyTop));
    const copyBottom=$('[data-copy-bottom]');copyBottom?.addEventListener('click',()=>copy(copyBottom));
    const content=$('#article-content');
    let size=17;try{size=Number(localStorage.getItem('the-signal-reading-size-v2'))||17;}catch(_){}
    size=Math.max(15,Math.min(21,size));
    const adjust=()=>{if(content)content.style.setProperty('--reader-size',size+'px');};adjust();
    $$('[data-text-size]').forEach(b=>b.addEventListener('click',()=>{size=Math.max(15,Math.min(21,size+(b.dataset.textSize==='larger'?1:-1)));adjust();try{localStorage.setItem('the-signal-reading-size-v2',String(size));}catch(_){}}));
    const progress=$('#reading-progress');let pending=false;
    function update(){const max=document.documentElement.scrollHeight-window.innerHeight;if(progress)progress.style.width=`${max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0}%`;pending=false;}
    window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update);}},{passive:true});update();
  }
})();

/* v4 progressive enhancements: external photo fallback and one-tap native mobile sharing. */
(()=>{
  document.querySelectorAll('img.editorial-photo[data-fallback]').forEach(img=>{
    const fallback=()=>{if(img.dataset.fallback && !img.dataset.didFallback){img.dataset.didFallback='true';img.removeAttribute('referrerpolicy');img.src=img.dataset.fallback;}};
    img.addEventListener('error',fallback,{once:true});
    if(img.complete&&img.naturalWidth===0)fallback();
  });
  const share=document.querySelector('#v4-native-share');
  share?.addEventListener('click',()=>{
    if(window.theSignalShare)window.theSignalShare(share);
    else if(navigator.share)navigator.share({title:document.body.dataset.shareTitle||document.title,url:document.body.dataset.shareUrl||location.href}).catch(()=>{});
  });
  document.querySelector('#v4-back-top')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
})();
