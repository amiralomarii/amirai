(() => {
  'use strict';
  document.documentElement.classList.add('has-js');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobile = document.getElementById('mobile-menu');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    if (!toggle || !mobile) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    mobile.classList.remove('is-open');
    mobile.inert = true;
  }
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const opening = toggle.getAttribute('aria-expanded') !== 'true';
      if (!opening) return closeMenu();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      mobile.inert = false;
      mobile.classList.add('is-open');
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', e => { if (header && !header.contains(e.target)) closeMenu(); });
  }

  // Keep a stable homepage URL while moving smoothly between sections.
  function moveTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = id === 'top' ? 0 : target.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0) + 1;
    scrollTo({top, behavior: reduceMotion ? 'instant' : 'smooth'});
    closeMenu();
  }
  document.querySelectorAll('a[data-scroll]').forEach(a => a.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    moveTo(a.dataset.scroll);
  }));
  // Legacy bookmarks and news-page navigation can still deep-link to an anchor,
  // then return the browser to the clean, canonical homepage URL.
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (document.getElementById(id)) {
      history.replaceState(history.state, '', location.pathname + location.search);
      addEventListener('load', () => moveTo(id), {once:true});
    }
  }
  try {
    const requested = sessionStorage.getItem('amir-site-destination');
    if (requested && document.getElementById(requested)) {
      sessionStorage.removeItem('amir-site-destination');
      addEventListener('load', () => moveTo(requested), {once:true});
    }
  } catch (_) { /* restricted storage does not affect navigation */ }

  // Replay reveals when visitors revisit sections, but reset only once content
  // is completely offscreen. This avoids flickering during normal reading.
  const items = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, {threshold:.08,rootMargin:'0px 0px -30px 0px'});
    items.forEach(el => observer.observe(el));
    let replayTick=false;
    const resetDeparted=()=>{
      replayTick=false;
      const lower=innerHeight+100;
      for(const el of items){
        if(!el.classList.contains('is-visible'))continue;
        const rect=el.getBoundingClientRect();
        if(rect.bottom < -100 || rect.top > lower) el.classList.remove('is-visible');
      }
    };
    const scheduleReplay=()=>{
      if(!replayTick){replayTick=true;requestAnimationFrame(resetDeparted);}
    };
    addEventListener('scroll',scheduleReplay,{passive:true});
    addEventListener('resize',scheduleReplay,{passive:true});
  } else items.forEach(el => el.classList.add('is-visible'));

  const navLinks = [...document.querySelectorAll('.desktop-nav a[data-scroll]')];
  const secIds = ['work','expertise','assistant','about'];
  const skillCards = [...document.querySelectorAll('[data-expertise]')];
  let ticking=false;
  function scrollUpdate() {
    ticking=false;
    const max = document.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle('has-scrolled',scrollY > 12);
    const threshold = (header?.offsetHeight || 0) + innerHeight * .27;
    let current = '';
    for (const id of secIds) {
      const node = document.getElementById(id);
      if (node && node.getBoundingClientRect().top < threshold) current = id;
    }
    navLinks.forEach(a => a.classList.toggle('is-current',a.dataset.scroll === current));
    if (skillCards.length) {
      let best=0, bestDist=Infinity;
      skillCards.forEach((el,i) => {
        const r=el.getBoundingClientRect();
        const mid=(r.top+r.bottom)/2;
        const distance=Math.abs(mid-innerHeight*.52);
        if(distance<bestDist){bestDist=distance;best=i;}
      });
      skillCards.forEach((el,i)=>el.classList.toggle('is-active',i===best));
      const n=document.getElementById('expertise-current');
      const bar=document.getElementById('expertise-progress');
      if(n)n.textContent=String(best+1).padStart(2,'0');
      if(bar)bar.style.width=((best+1)/skillCards.length*100)+'%';
    }
  }
  function scheduleScroll() {if (!ticking) {ticking=true;requestAnimationFrame(scrollUpdate);}}
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});
  scrollUpdate();

  // The conceptual workflow runs continuously, with seamless CSS motion.
  // The optional control pauses and resumes the same animation playhead;
  // it never clears nodes, restarts a sequence, or schedules a reset.
  const run = document.getElementById('play-workflow');
  const workflow = document.querySelector('.automation-visual');
  const status = document.getElementById('flow-status');
  const btnText = document.getElementById('flow-button-text');
  const playIcon = run?.querySelector('.play-icon');
  if (run && workflow) {
    const updatePlayback = paused => {
      workflow.classList.toggle('workflow-paused', paused);
      workflow.classList.toggle('workflow-opt-in-motion', !paused && reduceMotion);
      run.setAttribute('aria-pressed', String(paused));
      run.setAttribute('aria-label', paused ? 'Resume workflow animation' : 'Pause workflow animation');
      if (btnText) btnText.textContent = paused ? 'Resume animation' : 'Pause animation';
      if (playIcon) playIcon.textContent = paused ? '▶' : 'Ⅱ';
      if (status) status.textContent = paused ? 'Workflow paused' : 'Workflow in motion';
    };
    updatePlayback(reduceMotion);
    run.addEventListener('click', () => {
      updatePlayback(!workflow.classList.contains('workflow-paused'));
    });
  }

  // Interface switch changes the artwork's entire visual theme.
  const websiteVisual = document.querySelector('.web-visual');
  document.querySelectorAll('[data-preview-theme]').forEach(b => b.addEventListener('click', () => {
    const dark = b.dataset.previewTheme === 'dark';
    websiteVisual?.classList.toggle('is-dark',dark);
    document.querySelectorAll('[data-preview-theme]').forEach(other=>{
      other.classList.toggle('is-selected',other===b);
      other.setAttribute('aria-pressed',String(other===b));
    });
  }));

  // Three genuinely different illustrated interface states, not copies of one answer.
  const aiTabs=[...document.querySelectorAll('[data-ai-demo]')];
  const aiPanels=[...document.querySelectorAll('.ai-panel[role="tabpanel"]')];
  function showAiPanel(index, focus=false) {
    aiTabs.forEach((tab,i)=>{
      const active=i===index;
      tab.classList.toggle('is-selected',active);
      tab.setAttribute('aria-selected',String(active));
      tab.setAttribute('tabindex',active?'0':'-1');
      if(active&&focus)tab.focus();
    });
    aiPanels.forEach((panel,i)=>{
      const active=i===index;
      panel.hidden=!active;
      panel.classList.toggle('is-current',active);
    });
  }
  aiTabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>showAiPanel(i));
    tab.addEventListener('keydown',e=>{
      if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
      e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?aiTabs.length-1:
         (i+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)+aiTabs.length)%aiTabs.length;
      showAiPanel(next,true);
    });
  });

  // The assistant is immediately interactive. No click-to-activate layer, no
  // mouseleave shutdown, no simulated interaction mode.
  // Browsers do not propagate cross-origin iframe wheel events to the parent.
  // For scrolling already begun on the page, temporarily prevent the iframe
  // from interrupting the ongoing scroll gesture; release quickly afterward.
  const assistantIframe=document.getElementById('assistant-iframe');
  let wheelRelease;
  document.addEventListener('wheel', (event) => {
    if (!assistantIframe || Math.abs(event.deltaY) < 1) return;
    document.documentElement.classList.add('is-page-wheeling');
    clearTimeout(wheelRelease);
    wheelRelease=setTimeout(() => document.documentElement.classList.remove('is-page-wheeling'), 280);
  }, {passive:true});

  // For double-click file previews, point folder links to the actual index file.
  // On a web server / GitHub Pages, URLs remain clean /news/ routes.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(a => {
      const raw=a.getAttribute('href');
      if(raw && /^news\/$/.test(raw))a.setAttribute('href','news/index.html');
    });
  }
})();
