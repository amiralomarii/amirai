/* Lightweight anticipatory image loading for a small, static editorial archive.
   Intentionally scoped to /news/, preserving the original portfolio scripts. */
(()=>{
 'use strict';
 // Never leave an unloaded photograph blank or make the layout jump.
 const visualImages=[...document.querySelectorAll('.news-card__image img,.news-lead__media img,.article-cover img,.news-pick img')];
 visualImages.forEach(img=>{
   img.classList.add('v8-progressive-image');
   const ready=()=>img.classList.add('v8-image-ready');
   if(img.complete)ready();
   else{img.addEventListener('load',ready,{once:true});img.addEventListener('error',ready,{once:true});}
 });
 if(document.body.dataset.page!=='news-index')return;
 const images=[...document.querySelectorAll('#story-grid .news-card__image img')];
 const prefetched=new Set();
 function prefetch(img){
  if(!img||prefetched.has(img.src))return;
  prefetched.add(img.src);
  img.loading='eager';img.fetchPriority='low';
  // Setting loading=eager starts requests for hidden image cards without layout changes.
 }
 function warm(){
  images.slice(9).forEach((img,i)=>{
   if(i<9)prefetch(img);
  });
  const rest=images.slice(18);
  const fill=()=>rest.forEach(prefetch);
  if('requestIdleCallback' in window)requestIdleCallback(fill,{timeout:4000});
  else setTimeout(fill,1800);
 }
 if(document.readyState==='complete')setTimeout(warm,200);
 else window.addEventListener('load',()=>setTimeout(warm,200),{once:true});
})();
