/* Home-sky layers only. Does not change planet links or answers. */
(function(){
  const reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function install(){
    const space=document.querySelector('#home .space');
    if(!space) return;
    if(!space.querySelector('.space-sky')){
      const sky=document.createElement('div');
      sky.className='space-sky';
      sky.setAttribute('aria-hidden','true');
      sky.innerHTML='<span class="nebula n1"></span><span class="nebula n2"></span><span class="nebula n3"></span><span class="milky"></span>';
      space.insertBefore(sky, space.firstChild);
    }
    if(!reduce && !space.querySelector('.space-fx')){
      const fx=document.createElement('div');
      fx.className='space-fx';
      fx.setAttribute('aria-hidden','true');
      for(let i=0;i<8;i++) fx.appendChild(document.createElement('i'));
      space.insertBefore(fx, space.firstChild);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
