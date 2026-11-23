
(() => {
  'use strict';
  const S=window.SparkCompanion,D=window.EarthData;
  if(!S)return;
  const base=S.respond;
  S.respond=function(raw=''){
    const text=String(raw).trim().toLowerCase(),ctx=S.context||{},active=ctx.challengeData;
    if(ctx.planet==='Earth'){
      if(/\b(where|where are we|what place)\b/.test(text))return S.speak(`We are on Earth${ctx.continent?' in '+ctx.continent:''}${ctx.environment?' in the '+ctx.environment:''}.`);
      if(/\b(help|hint|stuck)\b/.test(text)){if(active?.hint)return S.speak(active.hint,{after:'thinking'});const e=window.EarthEngine?.state?.evidence||[];if(!e.length)return S.speak('Explore something that looks interesting. The watering area, stream, elephants, tracks, plants, birds, research station, and ranger vehicle can all teach us something.');return S.speak('Compare two clues you already found. Do they tell the same story, or something different?')}
      if(/\b(why)\b/.test(text)){if(active?.explanation)return S.speak(active.explanation,{after:'realisation'});return S.speak('Let’s use the evidence we collected before deciding why.')}
      if(active&&text){const r=window.EarthQuestions?.evaluate(active.id,raw);if(r?.known)return window.EarthQuestions.answer(active.id,raw)}
      if(/\b(build|make a solution|can i build)\b/.test(text)){window.EarthEngine?.tryBuild?.();return true}
    }
    return base(raw);
  };
})();
