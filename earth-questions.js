
(() => {
  'use strict';
  const D=window.EarthData,E=()=>window.EarthEngine;
  const norm=v=>String(v??'').trim().toLowerCase().replace(/[^\w\s.-]/g,'').replace(/\s+/g,' ');
  function resolve(id){return D.questions[id]?JSON.parse(JSON.stringify(D.questions[id])):null}
  function evaluate(id,value){
    const q=resolve(id); if(!q) return {known:false,match:false};
    const n=norm(value),c=norm(q.correct),accepted=(q.accepted||[]).map(norm);
    let match=n===c||accepted.includes(n);
    if(!match && n){match=accepted.some(a=>a.length>3 && (n.includes(a)||a.includes(n)));}
    const result={known:true,match,value,q};
    const e=E(); if(e){e.state.answers[id]={value,correct:match,at:Date.now()};e.save();e.setActive(q);e.update({childAnswer:value,answerCorrect:match,challengeData:q});}
    return result;
  }
  function answer(id,value,button){
    const r=evaluate(id,value),fb=document.getElementById('earthFeedback');
    if(button){button.classList.add(r.match?'correct':'wrong');setTimeout(()=>button.classList.remove('wrong'),800)}
    if(fb){fb.className='feedback '+(r.match?'good':'bad');fb.textContent=r.match?`Nice observation. ${r.q.explanation}`:`That does not fit the evidence yet. ${r.q.hint}`;}
    if(r.match){window.SparkCompanion?.celebrate?.(`That fits the evidence. ${r.q.explanation}`)}else{window.SparkCompanion?.setState?.('unsure');window.SparkCompanion?.speak?.(`Let's check the evidence again. ${r.q.hint}`,{after:'unsure'})}
    return r;
  }
  window.EarthQuestions={resolve,evaluate,answer};
})();
