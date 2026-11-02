/* Edition 10: reliable refresh position and accessible desktop scroll rail. */
(() => {
  'use strict';
  const navigation=performance.getEntriesByType?.('navigation')?.[0];
  const isReload=navigation?.type === 'reload';
  // Keep ordinary back/forward history natural. Only refresh resets to the top.
  try { history.scrollRestoration = isReload ? 'manual' : 'auto'; } catch (_) {}
  if(isReload){
    // A refresh should not restore the previous vertical position.
    const top=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
    top();
    document.addEventListener('DOMContentLoaded',top,{once:true});
    window.addEventListener('load',()=>requestAnimationFrame(top),{once:true});
    window.addEventListener('pageshow',top);
    try {sessionStorage.removeItem('amir-site-destination');}catch(_){}
  }

  const breakpoint=matchMedia('(min-width: 900px) and (pointer: fine)');
  let rail=null,thumb=null,drag=null,raf=0;
  const doc=document.documentElement;
  function maxScroll(){return Math.max(0,doc.scrollHeight-innerHeight);}
  function update(){
    raf=0;
    if(!rail)return;
    const max=maxScroll();
    const h=rail.clientHeight;
    if(!h || max<60){rail.hidden=true;return;}
    rail.hidden=false;
    const height=Math.max(42,Math.round(h*innerHeight/doc.scrollHeight));
    const travel=h-height;
    const percent=Math.max(0,Math.min(1,scrollY/max));
    thumb.style.height=height+'px';
    thumb.style.transform=`translate3d(0,${Math.round(travel*percent)}px,0)`;
    rail.setAttribute('aria-valuenow',String(Math.round(percent*100)));
    rail.setAttribute('aria-valuetext',`${Math.round(percent*100)}% scrolled`);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  function scrollFromPoint(clientY,offset=0){
    if(!rail||!thumb)return;
    const h=rail.clientHeight;
    const span=Math.max(1,h-thumb.offsetHeight);
    const y=clientY-rail.getBoundingClientRect().top-offset;
    const ratio=Math.min(1,Math.max(0,y/span));
    window.scrollTo({top:ratio*maxScroll(),behavior:'instant'});
  }
  function pointerDown(e){
    if(e.button!==0)return;
    e.preventDefault();
    const r=thumb.getBoundingClientRect();
    const onThumb=e.target===thumb;
    const offset=onThumb?e.clientY-r.top:thumb.offsetHeight/2;
    drag={offset};
    rail.classList.add('is-dragging');
    rail.focus({preventScroll:true});
    rail.setPointerCapture(e.pointerId);
    scrollFromPoint(e.clientY,offset);
  }
  function pointerMove(e){if(drag)scrollFromPoint(e.clientY,drag.offset);}
  function pointerEnd(){drag=null;rail?.classList.remove('is-dragging');}
  function keydown(e){
    const keys={ArrowUp:-60,ArrowDown:60,PageUp:-innerHeight*.85,PageDown:innerHeight*.85};
    if(Object.hasOwn(keys,e.key)){
      e.preventDefault();window.scrollBy({top:keys[e.key],behavior:'instant'});
    }else if(e.key==='Home'||e.key==='End'){
      e.preventDefault();window.scrollTo({top:e.key==='Home'?0:maxScroll(),behavior:'instant'});
    }
  }
  function activate(){
    if(!breakpoint.matches||maxScroll()<60){deactivate();return;}
    if(!rail){
      rail=document.createElement('div');
      rail.className='site-scroll-rail';
      rail.setAttribute('role','scrollbar');
      rail.setAttribute('aria-label','Page scroll position');
      rail.setAttribute('aria-orientation','vertical');
      rail.setAttribute('aria-valuemin','0');
      rail.setAttribute('aria-valuemax','100');
      rail.setAttribute('tabindex','0');
      rail.innerHTML='<span class="site-scroll-thumb" aria-hidden="true"></span>';
      thumb=rail.firstElementChild;
      document.body.appendChild(rail);
      rail.addEventListener('pointerdown',pointerDown);
      rail.addEventListener('pointermove',pointerMove);
      rail.addEventListener('pointerup',pointerEnd);
      rail.addEventListener('pointercancel',pointerEnd);
      rail.addEventListener('lostpointercapture',pointerEnd);
      rail.addEventListener('keydown',keydown);
    }
    doc.classList.add('has-custom-scroll');
    schedule();
  }
  function deactivate(){
    doc.classList.remove('has-custom-scroll');
    if(rail)rail.hidden=true;
  }
  function onResize(){
    if(breakpoint.matches)activate();else deactivate();
    schedule();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    activate();
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',onResize,{passive:true});
    breakpoint.addEventListener?.('change',onResize);
    // Covers late-loading images and dynamic news content.
    addEventListener('load',onResize);
    if('ResizeObserver' in window){new ResizeObserver(schedule).observe(doc);}
  },{once:true});
})();
