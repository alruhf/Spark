/* Spark's fixed action list (Allen 11/12). The ONLY things Spark (keyword matcher or, later, the AI) may do.
   Every action is validated here before it runs; anything unknown or invalid becomes a safe "say a line".
   highlight(place) | open(place) | point(challenge?) | say(line) | start(challenge) | hint | back | cheer | idea(text)
   Places: only the 5 green playable ones. Challenges: only the current area's (spark-map.js). Spark never builds anything:
   "idea" thanks the child and saves the idea as text only (api/spark-idea), if the grown-up's data sharing is on. */
(function(){
  /* Pages migration (11/22): API base from config.js; "" = same origin (unchanged); cross-origin posts are text/plain (no CORS preflight) */
  function apiBase(){var a=window.SPARK_CONFIG&&window.SPARK_CONFIG.api;return typeof a==="string"&&/^https:\/\/[a-z0-9.-]+(:[0-9]+)?$/i.test(a)?a:""}
  var M=window.SparkMap,V=window.SparkVoice;if(!M||!V) return;
  var PLAY=["earth","egypt","savannah","reef","arctic"],NAME={earth:"Earth",egypt:"Egypt",savannah:"Savannah",reef:"Reef",arctic:"Arctic"};
  var TYPES={highlight:1,open:1,point:1,say:1,start:1,hint:1,back:1,cheer:1,idea:1};
  var SAFE="Hmm, I'm not sure. Ask me what to do, and I'll pick something fun!";
  var IDEA_THANKS="Great idea! I'll tell the grown-ups who build Spark Studio. Thank you!";
  var CHEERS=["You did it! Super job, explorer!","Hooray! That was awesome!","Way to go! I'm so proud of you!"];
  function H(){return window.SparkHere?SparkHere.get():{tab:"home"}}
  function cleanLine(t){return String(t||"").replace(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/gi,"").replace(/[<>{}\[\]`*_#]/g,"").replace(/\s+/g," ").trim().slice(0,160)}
  function hereArea(){var h=H();return h.tab==="area"&&h.area&&M.get(h.area)?M.get(h.area):null}
  function validate(a){
    if(!a||typeof a!=="object"||!TYPES[a.type]) return {type:"say",line:SAFE,why:"invalid"};
    var o={type:a.type},l=cleanLine(a.line);if(l) o.line=l;
    if(a.type==="highlight"||a.type==="open"){if(PLAY.indexOf(a.place)<0) return {type:"say",line:SAFE,why:"bad-place"};o.place=a.place}
    if(a.type==="point"||a.type==="start"){var ar=hereArea();if(a.challenge){if(ar&&ar.challenges.some(function(c){return c.id===a.challenge})) o.challenge=a.challenge;else if(a.type==="start") return {type:"say",line:SAFE,why:"bad-challenge"}}
      if(a.type==="start"&&!o.challenge) return {type:"say",line:SAFE,why:"bad-challenge"}}
    if(a.type==="idea"){o.idea=String(a.idea||"").replace(/\s+/g," ").trim().slice(0,200);if(!o.idea) return {type:"say",line:SAFE,why:"empty-idea"};o.line=IDEA_THANKS}
    if(a.type==="say"&&!o.line) o.line=SAFE;
    return o}
  var CLIP_RE=/^\/api\/spark-clip\?h=[0-9a-f]{64}$/;
  function say(t,k,clip){V.say(t,{kind:k||"answer",clip:clip&&CLIP_RE.test(String(clip))?String(clip):undefined})}
  function ideaTag(){try{return (navigator.webdriver||/[?&]sparktest=1\b/.test(location.search)||/^(localhost|127\.)/.test(location.hostname))?"test":"live"}catch(e){return "live"}}
  var lastIdea=null;
  function saveIdea(text){var h=H(),area=h.tab==="area"?h.area:(h.tab||"home");
    var ok=!(window.SparkProgress&&SparkProgress.collect&&SparkProgress.collect()===false);lastIdea={text:text,area:area,tag:ideaTag(),sent:ok,status:null};
    if(!ok) return Promise.resolve(lastIdea);
    return fetch(apiBase()+"/api/spark-idea",{method:"POST",headers:{"content-type":apiBase()?"text/plain":"application/json"},body:JSON.stringify({idea:text,area:area,tag:lastIdea.tag}),keepalive:true})
      .then(function(r){lastIdea.status=r.status;return lastIdea}).catch(function(){lastIdea.status=0;return lastIdea})}
  function glowChallenge(ar,id,lead){var c=ar.challenges.filter(function(x){return x.id===id})[0];if(!c) return null;
    var g=window.SparkActions&&SparkActions.glow?SparkActions.glow(ar.id,id):null;say((lead?lead+" ":"")+c.line+(g&&g.found!==false?" Look for the sparkle!":""),"challenge");return {area:ar.id,challenge:id,glow:g}}
  /* run ONE validated action */
  /* extra.clip (spark14): the DB Ava clip for an auto-written library answer; used only for a plain "say" */
  function run(raw,extra){var a=validate(raw),r=null,clip=extra&&extra.clip;
    switch(a.type){
      case "highlight":r=window.SparkAsk?SparkAsk.ask("help me find "+NAME[a.place]):null;break;
      case "open":/* spark11: Ask never navigates - same as highlight (glow + tap directions) */r=window.SparkAsk?SparkAsk.ask("help me find "+NAME[a.place]):null;break;
      case "point":{var ar=hereArea();if(a.challenge&&ar) r=glowChallenge(ar,a.challenge);else r=window.SparkAsk?SparkAsk.ask("what can I do"):null;break}
      case "start":r=glowChallenge(hereArea(),a.challenge,"Let's start! Walk to the sparkle.");break;
      case "hint":{var st=window.SparkLevel&&SparkLevel.state&&SparkLevel.state.glow;if(st&&st.found&&!st.reason){say("Follow the sparkle! Walk to it and tap.");r={hint:"sparkle"}}
        else if(window.SparkAsk){r=SparkAsk.ask("what can I do");r.hint="point"}break}
      case "back":{/* spark11: the child taps Back themselves */say("Tap the back arrow at the top to go back.");r={back:false};break}
      case "cheer":{say(a.line||CHEERS[Math.floor(Math.random()*CHEERS.length)],"cheer");[].forEach.call(document.querySelectorAll(".spark-companion"),function(c){c.classList.remove("spk-cheer");void c.offsetWidth;c.classList.add("spk-cheer");setTimeout(function(){c.classList.remove("spk-cheer")},1400)});r={cheer:1};break}
      case "idea":say(IDEA_THANKS,"idea");r={idea:a.idea,saving:saveIdea(a.idea)};break;
      default:say(a.line||SAFE,"answer",a.type==="say"&&a.line&&!a.why?clip:null)}
    return {action:a,result:r}}
  window.SparkAI={TYPES:Object.keys(TYPES),PLACES:PLAY.slice(),validate:validate,run:run,saveIdea:saveIdea,lastIdea:function(){return lastIdea},SAFE:SAFE};
})();
