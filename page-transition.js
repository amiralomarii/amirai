// Fallback only: modern browsers handle the transition automatically.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const native = (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') && CSS.supports('view-transition-name: root');
  if (reduce || native || location.protocol === 'file:') return;
  document.addEventListener('click', e => {
    const a=e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button!==0 || e.ctrlKey||e.metaKey||e.shiftKey||e.altKey || a.target || a.hasAttribute('download')) return;
    const dest=new URL(a.href,location.href);
    if(dest.origin!==location.origin || dest.pathname===location.pathname && dest.search===location.search) return;
    e.preventDefault();
    document.documentElement.classList.add('page-leaving');
    setTimeout(()=>{location.href=dest.href;},210);
  },{capture:false});
})();
