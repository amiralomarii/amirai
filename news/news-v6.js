/* The Signal v6: hide the floating news navigation while reading downwards;
   reveal on upward scrolling, keyboard focus and near the top. The portfolio
   navigation is intentionally left untouched. */
(()=>{
  'use strict';
  const header=document.querySelector('.site-header');
  if(!header||!document.body.classList.contains('news-page'))return;
  let last=window.scrollY, pending=false;
  function update(){
    pending=false;
    const current=Math.max(0,window.scrollY);
    const goingDown=current>last+6, goingUp=current<last-6;
    const menuOpen=document.body.classList.contains('menu-open')||header.contains(document.activeElement);
    if(current<120||menuOpen||goingUp){header.classList.remove('is-hidden');}
    else if(goingDown&&current>220){header.classList.add('is-hidden');}
    last=current;
  }
  addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update);}},{passive:true});
  header.addEventListener('focusin',()=>header.classList.remove('is-hidden'));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'||event.key==='Tab')header.classList.remove('is-hidden');});
})();
