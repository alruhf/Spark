/* spark12 (Allen 11/14, voice plan #3): the old Arctic ask (own mic, own /api/spark-ask call, browser-voice answers) is removed.
   Tapping Spark starts the site-wide SparkTalk listening (spark-talk.js); answers are spoken by SparkVoice in Ava. The small replay button
   says the last recorded Arctic line again. Nothing here speaks with the browser voice. */
export function sparkGuide(K){
  const {spk,spkRe,say,log}=K;if(!spk) return;
  K.tap(spk,()=>{if(window.SparkTalk) return;/* SparkTalk owns tap-to-ask */const id=K.lastSay();say(id||'walk')});
  K.tap(spkRe,()=>{const id=K.lastSay();say(id||'walk');log&&log('sparkreplay',{id:id||'walk'})});
  K.probes=Object.assign(K.probes||{},{spark:()=>{const r=spk.getBoundingClientRect(),q=spkRe.getBoundingClientRect();return {state:spk.dataset.state,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,re:{x:q.left+q.width/2,y:q.top+q.height/2},box:false,sr:false,lastAns:null}}});
}
