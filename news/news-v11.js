/* The Signal mobile section navigator — progressive enhancement, news articles only. */
(()=>{
 'use strict';
 if(!document.body.classList.contains('article-page'))return;
 const aside=document.querySelector('.article-aside');
 const toc=aside?.querySelector('.article-aside__toc');
 if(!aside||!toc)return;
 const links=[...toc.querySelectorAll('a[href^="#"]')];
 if(!links.length)return;
 const details=document.createElement('details');details.className='signal-mobile-toc';
 const icon=(kind)=>`<svg class="signal-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="${kind==='list'?'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01':'m6 9 6 6 6-6'}"/></svg>`;
 const summary=document.createElement('summary');summary.innerHTML=`<span>${icon('list')} Jump to a section</span>${icon('chevron')}`;
 details.appendChild(summary);
 const nav=document.createElement('nav');nav.className='signal-mobile-toc__links';nav.setAttribute('aria-label','Article sections');
 for(const link of links){
   // Reuse the author's existing section labels and targets verbatim.
   if(!document.getElementById(link.hash.slice(1)))continue;
   const a=link.cloneNode(true);a.removeAttribute('aria-current');a.classList.remove('is-current');
   a.addEventListener('click',()=>{details.open=false;});
   nav.appendChild(a);
 }
 if(!nav.children.length)return;
 details.appendChild(nav);
 const size=aside.querySelector('.article-size');
 // Keep Reset adjacent to A− / A+ instead of stranded on its own line.
 const reset=size?.querySelector('.signal-size-reset');
 const buttonGroup=size?.querySelector('div');
 if(reset && buttonGroup)buttonGroup.appendChild(reset);
 if(size)size.insertAdjacentElement('afterend',details);
 else aside.appendChild(details);
})();
