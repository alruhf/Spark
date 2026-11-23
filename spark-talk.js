/* Spark talk (Allen 11/12, 11/13, 11/15): kids talk to Spark only by TAPPING Spark itself or its "Ask me" badge / caption.
   spark15 (11/15 12:15 AM): ONE tap starts listening right away (the browser's own free speech recognition; no paid transcription;
   no audio is sent or stored - only the recognised words go to /api/spark-ask).
   spark16 (Allen 11/15 10:20 PM): NO Ask panel any more (no box, no big mic, no chips, no heard-words bubble, no x).
   Spark itself shows it is listening (companion data-state="listening") and answers in Ava with its normal caption (spark-voice.js).
   Tapping Spark again while listening stops. No speech support / mic denied / nothing heard -> Spark says a friendly Ava line. Never a text box.
   Test hooks: SparkTalk.__fake(text) (as if heard), SparkTalk.__listening(on) (listening look only). */
(function(){
  var V=window.SparkVoice;if(!V||!window.SparkAsk||!window.SparkAI) return;
  var LINES={nosr:"I can't hear on this device yet. Tap the glowing places to explore!",denied:"I need a grown-up to turn on the microphone. Then tap me and ask!",
    none:"Hmm, I didn't hear that. Tap me and try again!",busy:"Let's take a little break. Ask me again in a minute!"};
  var st={listening:false,heard:null,last:null,busy:false,mode:null,taps:0,introed:false},rec=null,stopT=0,seq=0;
  var LEAD="Hi there! I can help you find a place to play, or tell you what to do here.";
  function H(){return window.SparkHere?SparkHere.get():{tab:"home"}}
  function dev(){try{var k="sparkTalkDev",v=localStorage.getItem(k);if(!v){v=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(function(b){return ("0"+b.toString(16)).slice(-2)}).join("");localStorage.setItem(k,v)}return v}catch(e){return null}}
  function setListening(on){st.listening=!!on;
    var c=document.querySelectorAll(".spark-companion");[].forEach.call(c,function(x){if(on) x.dataset.state="listening";else if(x.dataset.state==="listening") x.dataset.state="idle"})}
  function sayLine(t){V.say(t,{kind:"answer"})}
  function SR(){return window.SpeechRecognition||window.webkitSpeechRecognition||null}
  function stop(){clearTimeout(stopT);if(rec){try{rec.stop()}catch(e){}}setListening(false)}
  /* cancel = stop AND ignore whatever the recogniser still delivers */
  function cancel(){seq++;clearTimeout(stopT);var r=rec;rec=null;if(r){try{r.abort()}catch(e){try{r.stop()}catch(e2){}}}setListening(false)}
  function listen(){var S=SR();
    if(!S){st.last={fallback:"nosr"};sayLine(LINES.nosr);return st.last}
    var my=++seq;
    try{try{V.stop()}catch(e){}rec=new S();var R=rec;R.lang="en-US";R.interimResults=false;R.maxAlternatives=1;var got=false;
      R.onresult=function(e){if(my!==seq) return;got=true;var t=e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript;stop();heard(t)};
      R.onerror=function(e){if(my!==seq) return;var er=e&&e.error;if(er==="not-allowed"||er==="service-not-allowed"||er==="audio-capture"){got=true;stop();st.last={fallback:"denied"};sayLine(LINES.denied)}};
      R.onend=function(){if(rec===R) rec=null;if(my!==seq) return;setListening(false);if(!got){st.last={fallback:"none"};sayLine(LINES.none)}};
      setListening(true);st.last={listening:true};R.start();stopT=setTimeout(stop,8000)}catch(e){setListening(false);st.last={fallback:"nosr"};sayLine(LINES.nosr)}return st.last}
  /* one question per tap -> server picks one action (off: keyword matcher) -> validated + run here */
  function heard(t){t=String(t||"").replace(/\s+/g," ").trim().slice(0,200);if(!t){st.last={fallback:"none"};sayLine(LINES.none);return Promise.resolve(st.last)}
    st.heard=t;st.busy=true;var h=H(),ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},9000);
    return fetch("/api/spark-ask",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({q:t,tab:h.tab,area:h.area||"",spot:h.spot||"",dev:dev()}),signal:ctl&&ctl.signal})
      .then(function(r){return r.json().then(function(j){return {status:r.status,j:j}})})
      .then(function(o){clearTimeout(tm);st.busy=false;st.mode=o.j&&o.j.mode;var out=SparkAI.run(o.j&&o.j.action,{clip:o.j&&o.j.clip});st.last={q:t,status:o.status,mode:st.mode,server:o.j&&o.j.action,ran:out.action,result:out.result};return st.last})
      .catch(function(){clearTimeout(tm);st.busy=false;st.mode="local";var r=SparkAsk.ask(t);st.last={q:t,mode:"local",result:r};return st.last})}
  /* spark24: first tap plays a short existing Ava lead-in and does NOT start the mic; the next tap starts listening
     (the browser mic prompt used to jump out on the first tap, before Spark could explain) */
  /* spark26: introed was session-global, so Savannah's first-tap lead-in made Egypt jump straight to the mic
     and a leftover listen/stop on Reef or Egypt phone looked like "Ask me does nothing". Reset on each area. */
  var lastHere="";function resetIntro(){try{var h=H();var k=(h.tab||"")+"|"+(h.area||"");if(k===lastHere)return;lastHere=k;cancel();st.introed=false;st.busy=false;st.last=null}catch(e){}}
  if(window.SparkHere&&SparkHere.on)SparkHere.on(function(){resetIntro()});addEventListener("sparkhere:change",function(){resetIntro()});
  var lastToggle=0;function toggle(){resetIntro();var n=typeof performance!=="undefined"?performance.now():Date.now();if(n-lastToggle<350)return;lastToggle=n;st.taps++;if(st.listening){stop();return}st.busy=false;/* spark34: do not open the #sparkSay texting window. First tap = Ava lead-in only (Egypt already has a short bubble). Second tap starts listening. busy is cleared so a countdown tap is not swallowed. */if(!st.introed){st.introed=true;st.last={lead:true};sayLine(LEAD);return}listen()}
  addEventListener("click",function(e){var t=e.target&&e.target.closest&&e.target.closest(".spark-companion,.spk-askme,#sparkSay");if(!t) return;
    if(t.id==="sparkCompanion"&&window.underlyingInteractiveAt&&underlyingInteractiveAt(e.clientX,e.clientY)) return;
    e.stopImmediatePropagation();e.preventDefault();toggle()},true);
  /* the "Ask me" tag rides next to whichever Spark is on screen */
  var tag=null;function onAsk(e){if(!e)return;e.stopImmediatePropagation();e.preventDefault();if(e.type==="click")toggle()}
    function placeTag(){var cs=[].filter.call(document.querySelectorAll(".spark-companion"),function(c){var r=c.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(c).visibility!=="hidden"&&getComputedStyle(c).display!=="none"&&!c.closest("[hidden]")});
    var c=cs[cs.length-1];if(!tag){tag=document.createElement("button");tag.type="button";tag.className="spk-askme";tag.textContent="Ask me";tag.setAttribute("aria-label","Ask Spark");
      ["pointerdown","pointerup","click"].forEach(function(ev){tag.addEventListener(ev,onAsk,true)})}
    if(!c||document.querySelector(".ks-ov")){tag.hidden=true;return}
    /* spark25: keep the badge on document.body above the area wrap (z-index 120). Inside the wrap, a desktop click on Ask me never reached toggle, so the lead-in and mic both looked like a no-op */
    if(tag.parentNode!==document.body) document.body.appendChild(tag);if(tag.style.display==="none") tag.style.display="";tag.hidden=false;
    var r=c.getBoundingClientRect(),w=tag.offsetWidth||64,hh=tag.offsetHeight||28;
    var left=Math.max(4,Math.min(innerWidth-w-4,r.left+r.width/2-w/2)),top=Math.max(4,Math.min(innerHeight-hh-4,r.bottom+6));
    var row=document.querySelector(".eg3d-chips,#eg3d-chips,.sh3d-chips");
    if(row){var cr=row.getBoundingClientRect();if(left<cr.right+10&&left+w>cr.left-10&&top<cr.bottom+10&&top+hh>cr.top-10)top=Math.max(4,Math.min(innerHeight-hh-4,Math.max(cr.bottom+8,r.bottom+8)))}
    tag.style.left=left+"px";tag.style.top=top+"px";tag.style.zIndex="2147483600";try{document.documentElement.style.setProperty("--spk-cap-top",(top+hh+8)+"px")}catch(e){}}
  setInterval(placeTag,400);addEventListener("resize",placeTag);
  function hookListen(){var C=window.SparkCompanion;if(!C||(C.listen&&C.listen.__sparkTalk)) return;
    C.listen=function(){toggle()};C.listen.__sparkTalk=1}
  hookListen();var n=0,h=setInterval(function(){hookListen();if(++n>25)clearInterval(h)},200);
  window.SparkTalk={listen:listen,stop:stop,cancel:cancel,tap:toggle,heard:heard,toggle:toggle,state:st,supported:function(){return !!SR()},__fake:function(t){return heard(t)},__listening:function(on){setListening(on)}};
})();
