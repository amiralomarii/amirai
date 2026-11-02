/* Edition 9: editorial story entrance, preserving existing search/filter controls. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const items = [...document.querySelectorAll('.news-top__intro, .news-lead, .news-card')];
  if (!items.length) return;
  items.forEach(el => el.classList.add('motion-prep'));
  document.body.classList.add('news-motion-ready');
  const observer = new IntersectionObserver(entries => {
    for(const entry of entries){
      if(entry.isIntersecting) entry.target.classList.add('motion-in');
    }
  },{rootMargin:'0px 0px -15px 0px',threshold:.05});
  items.forEach(el => observer.observe(el));
  let queued=false;
  const reset=()=>{
    queued=false;
    for(const el of items){
      if(!el.classList.contains('motion-in'))continue;
      const r=el.getBoundingClientRect();
      if(r.bottom < -90 || r.top > innerHeight+90)el.classList.remove('motion-in');
    }
  };
  const schedule=()=>{
    if(!queued){queued=true;requestAnimationFrame(reset);}
  };
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
})();
