
(() => {
  'use strict';
  const E=window.EarthEngine,D=window.EarthData,S=window.SparkCompanion,$=id=>document.getElementById(id);
  const baseOpen=window.openPlanet;
  window.openPlanet=function(e,name){
    if(name!=='Earth'){E.exitEarth();return baseOpen(e,name)}
    const r=baseOpen(e,name);E.openEarth();return r;
  };
  document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>E.selectContinent(b.dataset.c));
  const home=$('homeBtn'),parent=$('parentBtn');
  if(home){home.onclick=()=>window.returnToSolarSystemHome?.({announce:false})}
  if(parent){const f=parent.onclick;parent.onclick=e=>{E.exitEarth();f?.call(parent,e)}}
  const oldRespond=S?.respond;
  if(S){
    S.respond=function(raw=''){
      const text=String(raw).trim().toLowerCase();
      if(S.context?.planet==='Earth'){
        const active=E.getActive();
        if(active&&text&&!/\b(help|hint|why|where|stop|quiet|cancel|build|make a solution|can i build)\b/.test(text)){
          const r=window.EarthQuestions?.evaluate(active.id,raw);if(r?.known){window.EarthQuestions.answer(active.id,raw);return true}
        }
        if(/\b(build|make a solution|can i build)\b/.test(text)){E.tryBuild();return true}
      }
      return oldRespond(raw);
    };
  }
  if(new URLSearchParams(location.search).get('planet')==='Earth')E.openEarth();
})();
