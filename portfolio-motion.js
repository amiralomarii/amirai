/* Edition 9: visibility-aware project and section choreography.
   Does not modify the continuous workflow, AI behavior, routes or layout. */
(() => {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const entryTargets = [
    ...document.querySelectorAll('.work-header, .showcase-text, .showcase-visual, .intro-layout, .about-copy, .news-teaser-layout')
  ];
  if (!entryTargets.length) return;
  /* Set starting states only where an observer can reliably complete them. */
  entryTargets.forEach(node => node.classList.add('motion-prep'));
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if(isIntersecting) target.classList.add('motion-in');
    });
  }, {threshold:.06,rootMargin:'0px 0px -22px 0px'});
  entryTargets.forEach(el => entrance.observe(el));

  let resetPending=false;
  const resetExited=()=>{
    resetPending=false;
    const bottom=innerHeight+110;
    for(const target of entryTargets){
      if(!target.classList.contains('motion-in'))continue;
      const r=target.getBoundingClientRect();
      if(r.bottom < -110 || r.top > bottom)target.classList.remove('motion-in');
    }
  };
  const onScroll=()=>{
    if(!resetPending){resetPending=true;requestAnimationFrame(resetExited);}
  };
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});

  /* Pause ambient mockup movement outside its viewport to reduce CPU work. */
  const webShowcase = document.querySelector('.showcase-web');
  if (webShowcase) {
    const ambient = new IntersectionObserver(entries => {
      entries.forEach(entry => webShowcase.classList.toggle('motion-ambient', entry.isIntersecting));
    }, {rootMargin:'90px 0px 90px 0px', threshold:0});
    ambient.observe(webShowcase);
  }
})();
