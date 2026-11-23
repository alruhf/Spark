/* Spark voice (Allen 11/13, spark12 11/14): SparkVoice is the ONLY speaker in Spark Studio, and Spark only ever speaks in Ava.
   - Every spoken line is a pre-recorded Ava mp3 (edge-tts en-US-AvaNeural -8% +0Hz, 24 kHz mono 48 kb/s) played on ONE shared
     audio element. Platform lines are looked up by exact text in spark-voice-index.js (voice/p_*.mp3); the areas register their own
     indexes (Egypt, Savannah, Reef) and play their clips through SparkVoice.play().
   - A new line always stops the line before it (any area, any engine). Two lines never overlap.
   - The browser voice (speechSynthesis) is NEVER used. A line with no recorded clip shows its caption only and is logged
     (SparkVoice.missing). Any old code that still calls speechSynthesis.speak is blocked and re-routed here (SparkVoice.blocked).
   - It respects the grown-ups "Spark's voice" switch (S.voice). At phone width (390px and below) the #sparkSay caption is never shown;
     desktop is unchanged. Game sound effects (AudioContext tones, the shark sting) are not voice and are not touched. */
/* spark14 (Allen 11/14): auto-written library answers are spoken from their DB Ava clip (/api/spark-clip), falling back to the baked clip, then caption. */
(function(){
  var CFG={voice:"Ava (recorded clips only)",engine:"clip"};
  var VI=window.SparkVoiceIndex||{lines:{},base:"voice/"};
  var key=function(t){return String(t||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()};
  var REG=[{name:"platform",map:VI.lines||{},base:VI.base||"voice/",key:key}];
  var log=[],missing=[],blocked=[],plays=[],cap=null,capT=0,cur=null,tok=0,primed=false;
  var A=null;function el(){if(!A){A=new Audio();A.preload="auto";A.setAttribute("data-spark-voice","1")}return A}
  function voiceOff(){return !!(window.S&&window.S.voice===false)}
  function phoneCapOff(){try{return typeof innerWidth!=="undefined"&&innerWidth<=390}catch(e){return false}}function egyptCapOff(){try{var r=document.querySelector(".eg3d-root");if(!r)return false;var st=getComputedStyle(r);return st.display!=="none"&&st.visibility!=="hidden"&&r.getClientRects().length>0}catch(e){return false}}
  function caption(text){try{
    /* spark34: kids do not read a texting window. In Egypt the short .eg3d-bub is enough; on a phone the documented policy is no #sparkSay. */
    if(phoneCapOff()||egyptCapOff())return;
    if(!cap){cap=document.createElement("div");cap.id="sparkSay";cap.className="spk-cap";cap.setAttribute("role","status");cap.setAttribute("aria-live","polite");cap.hidden=true;cap.style.zIndex="2147483000";document.body.appendChild(cap)}
    
    cap.innerHTML='<b>Spark</b><span></span>';cap.lastChild.textContent=text;cap.hidden=false;cap.style.zIndex='2147483000';/* spark35: in Arctic also fill the in-area Spark bubble so Ask me always has a visible caption at 1280 */try{var a3d=document.querySelector('.a3d');if(a3d){var bub=a3d.querySelector('.a3d-sparkbub');if(!bub){bub=document.createElement('div');bub.className='a3d-sparkbub';a3d.appendChild(bub)}bub.textContent=text;bub.classList.add('on');clearTimeout(bub._t);bub._t=setTimeout(function(){bub.classList.remove('on')},Math.min(9000,2600+text.length*55))}}catch(e){}clearTimeout(capT);capT=setTimeout(function(){cap.hidden=true},Math.min(9000,2600+text.length*55))}catch(e){}}
  function companion(st){try{var C=window.SparkCompanion;if(C&&C.setState)C.setState(st);document.querySelectorAll(".spark-companion").forEach(function(e){e.dataset.state=st})}catch(e){}}
  function emit(n,d){try{window.dispatchEvent(new CustomEvent(n,{detail:d}))}catch(e){}}
  function rawCancel(){try{if(window.speechSynthesis&&(speechSynthesis.speaking||speechSynthesis.pending)) speechSynthesis.cancel()}catch(e){}}
  function finish(c,heard){if(!c||c.done) return;c.done=true;clearTimeout(c.timer);if(cur===c){cur=null;if(c.owner==="spark") companion(c.after||"idle")}
    if(typeof c.onend==="function"){try{c.onend(!!heard)}catch(e){}}}
  /* stop the current line. owner given -> only if that owner's line is the one playing (an area closing never cuts Spark's answer) */
  function stop(owner){var c=cur;if(owner&&(!c||c.owner!==owner)) return false;rawCancel();if(A){try{A.pause()}catch(e){}}if(c) finish(c,false);return !!c}
  function lookup(text){var t=String(text||"");if(!t) return null;for(var i=REG.length-1;i>=0;i--){var r=REG[i],f=r.map&&r.map[r.key(t)];if(f) return r.base+f}return null}
  function register(name,map,base,kf){for(var i=0;i<REG.length;i++){if(REG[i].name===name){REG[i].map=map||{};REG[i].base=base;REG[i].key=kf||key;return}}REG.push({name:name,map:map||{},base:base,key:kf||key})}
  /* play one recorded clip. o: {owner, text, volume, onend(heard), onstart, after} -> the shared audio element (or null when voice is off) */
  function play(url,o){o=o||{};stop();if(!url) return null;var c=cur={tok:++tok,owner:o.owner||"spark",onend:o.onend,after:o.after,url:url,text:o.text||null,t:Date.now(),fallback:o.fallback||null};
    plays.push({t:c.t,owner:c.owner,url:String(url).split("/").pop(),text:c.text});if(plays.length>80) plays.shift();
    emit("sparkvoice:line",{text:c.text,url:url,owner:c.owner});
    if(voiceOff()){c.timer=setTimeout(function(){finish(c,true)},400);return null}
    var a=el();try{a.muted=false;a.volume=o.volume==null?1:o.volume;a.src=url;
      a.onended=function(){if(cur===c) finish(c,true)};a.onerror=function(){if(cur===c){missing.push({t:Date.now(),text:c.text,url:url,why:"clip-error"});
        /* spark14: a DB clip that fails to decode falls back to the baked clip (same Ava voice) before going silent */
        if(c.fallback){var fb=c.fallback;c.fallback=null;c.done=true;clearTimeout(c.timer);cur=null;play(fb,{owner:c.owner,text:c.text,onend:c.onend,after:c.after,volume:o.volume});return}
        finish(c,false)}};
      if(c.owner==="spark") companion("speaking");if(typeof o.onstart==="function") try{o.onstart()}catch(e){}
      var p=a.play();if(p&&p.catch) p.catch(function(){if(cur===c) finish(c,false)})}catch(e){finish(c,false)}
    return a}
  /* spark14: Ava clips stored in the answer library DB (auto-written answers). Only same-origin /api/spark-clip?h=<sha256> is accepted.
     Fetched as a blob (works on iOS/Android/desktop, no Range quirks), cached for the session (max 24), then played on the ONE shared element. */
  var CLIP_RE=/^\/api\/spark-clip\?h=[0-9a-f]{64}$/,blobs={},blobOrder=[],dbclips=[];
  function fetchClip(u){if(blobs[u]) return Promise.resolve(blobs[u]);if(!window.fetch||!window.URL||!URL.createObjectURL) return Promise.reject(new Error("no-fetch"));
    var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},4000);
    return fetch(u,{signal:ctl&&ctl.signal}).then(function(r){clearTimeout(tm);var ct=(r.headers.get("content-type")||"").toLowerCase();
      if(!r.ok||ct.indexOf("audio/mpeg")<0) throw new Error("http-"+r.status);return r.blob()}).then(function(b){if(!b||b.size<1000) throw new Error("tiny");
      var bu=URL.createObjectURL(b);blobs[u]=bu;blobOrder.push(u);if(blobOrder.length>24){var old=blobOrder.shift();try{URL.revokeObjectURL(blobs[old])}catch(e){}delete blobs[old]}return bu},function(e){clearTimeout(tm);throw e})}
  /* say a platform line: DB Ava clip (o.clip) -> baked Ava clip -> caption only. Never the browser voice. */
  function say(text,o){o=o||{};text=String(text||"").replace(/\s+/g," ").trim();if(!text) return null;
    if(o.clip&&!o.url&&CLIP_RE.test(String(o.clip))&&!voiceOff()) return sayDb(text,o);
    var rec={t:Date.now(),text:text,kind:o.kind||"line",id:o.id||null,voice:"none",clip:null};
    log.push(rec);if(log.length>60) log.shift();if(o.cap!==false) caption(text);
    emit("sparkvoice:say",rec);
    /* spark31: show the bubble in the click turn; defer clip lookup + audio.src/play so Ask me is not a 1.8s INP hit */
    setTimeout(function(){
      var url=o.url||lookup(text);
      rec.voice=url?"ava":"none";rec.clip=url?String(url).split("/").pop():null;
      if(url){play(url,{owner:o.owner||"spark",text:text,onend:o.onend,after:o.after,volume:o.volume});return}
      stop();missing.push({t:rec.t,text:text,kind:rec.kind,why:"no-clip"});if(missing.length>200) missing.shift();
      emit("sparkvoice:line",{text:text,url:null,owner:o.owner||"spark"});
      var c=cur={tok:++tok,owner:o.owner||"spark",onend:o.onend,text:text,t:rec.t,silent:true};
      c.timer=setTimeout(function(){finish(c,true)},Math.max(900,text.length*55));
    },0);return rec}
  function sayDb(text,o){var clip=String(o.clip),baked=lookup(text),t0=Date.now();
    var rec={t:t0,text:text,kind:o.kind||"line",id:o.id||null,voice:"ava",clip:"db:"+clip.slice(-12),src:"db"};
    log.push(rec);if(log.length>60) log.shift();if(o.cap!==false) caption(text);
    /* hold the line while the clip loads (busy, owns the companion); a newer line cancels it */
    stop();var c=cur={tok:++tok,owner:o.owner||"spark",text:text,t:t0,silent:true,pending:true};companion("speaking");
    emit("sparkvoice:say",rec);
    var rest=function(why){dbclips.push({t:Date.now(),h:clip.slice(-64),ok:false,why:why,ms:Date.now()-t0});if(dbclips.length>40) dbclips.shift();
      if(cur!==c) return;c.done=true;cur=null;
      if(baked){rec.src="baked";rec.clip=String(baked).split("/").pop();play(baked,{owner:o.owner||"spark",text:text,onend:o.onend,after:o.after,volume:o.volume});return}
      rec.voice="none";rec.src="caption";missing.push({t:Date.now(),text:text,kind:rec.kind,why:"no-clip"});if(missing.length>200) missing.shift();
      emit("sparkvoice:line",{text:text,url:null,owner:o.owner||"spark"});
      var s=cur={tok:++tok,owner:o.owner||"spark",onend:o.onend,text:text,t:Date.now(),silent:true};s.timer=setTimeout(function(){finish(s,true)},Math.max(900,text.length*55))};
    fetchClip(clip).then(function(bu){dbclips.push({t:Date.now(),h:clip.slice(-64),ok:true,ms:Date.now()-t0});if(dbclips.length>40) dbclips.shift();
      if(cur!==c) return;c.done=true;cur=null;play(bu,{owner:o.owner||"spark",text:text,onend:o.onend,after:o.after,volume:o.volume,fallback:baked})},function(e){rest(String(e&&e.message||e).slice(0,40))});
    return rec}
  /* iOS: the shared element must be started once inside a tap; the areas' hooks call this, and the first tap anywhere does too */
  function prime(){if(primed) return;primed=true;try{var a=el();if(a.src) return;a.muted=true;var p=a.play();if(p&&p.catch) p.catch(function(){})}catch(e){}}
  ["pointerdown","touchend","click"].forEach(function(n){document.addEventListener(n,prime,{capture:true,passive:true})});
  /* the browser voice is never used: any leftover speechSynthesis.speak is blocked and spoken through SparkVoice (Ava clip or caption) */
  function installGuard(){if(!("speechSynthesis" in window)||speechSynthesis.__sparkVoiceGuard) return;
    speechSynthesis.speak=function(u){var t=u&&u.text!=null?String(u.text):"";blocked.push({t:Date.now(),text:t.slice(0,160)});if(blocked.length>60) blocked.shift();
      try{if(typeof console!=="undefined") console.warn("SparkVoice: browser voice blocked:",t.slice(0,80))}catch(e){}
      var r=say(t,{kind:"blocked-tts",onend:function(h){try{if(u&&typeof u.onend==="function") u.onend({type:"end"})}catch(e){}}});return r?undefined:undefined};
    speechSynthesis.__sparkVoiceGuard=1}
  installGuard();
  window.SparkVoice={say:say,play:play,stop:stop,lookup:lookup,register:register,prime:prime,key:key,config:CFG,
    busy:function(owner){return !!(cur&&(!owner||cur.owner===owner)&&!cur.done&&(cur.silent||(A&&!A.paused)))},
    audio:function(){return el()},current:function(){return cur?{owner:cur.owner,text:cur.text,url:cur.url||null,silent:!!cur.silent}:null},
    get log(){return log.slice()},get dbclips(){return dbclips.slice()},get missing(){return missing.slice()},get blocked(){return blocked.slice()},get plays(){return plays.slice()},
    last:function(){return log[log.length-1]||null},hideCaption:function(){if(cap)cap.hidden=true},
    lockedVoice:function(){return "Ava"},pickVoice:function(){return null}};
})();
