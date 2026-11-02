/* V7 framing: the same uncropped full source is displayed in front of its subtle ambient backdrop. */
(()=>{
 'use strict';
 document.querySelectorAll('.news-card__image img,.news-lead__media img').forEach(img=>{
   const frame=img.closest('.news-card__image,.news-lead__media');
   if(!frame)return;
   const update=()=>{if(!img.src)return;frame.style.setProperty('--v7-image',`url("${img.src.replaceAll('"','%22')}")`);};
   img.addEventListener('load',update);img.addEventListener('error',update);update();
 });
})();
