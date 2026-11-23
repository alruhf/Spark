/* Spark Studio: one shared age system (Earth plan §5.3). Loaded first, before app-loader.js.
   Bands: k 4-6 · e 7-9 · u 10-12 · t 13+ (age 3 -> k, tap only). Source of truth for the age stays localStorage "sparkAge" + window.S.age,
   so the hand-built Savannah (station.js, safari.js) and the area engine keep reading it as before.
   Also: grown-up button (press and hold 3 s) + parent panel, per-band tiers (adaptive), session stopping point, read-aloud speed. */
(function(){
"use strict";
var PKEY="sparkProfileV1",AKEY="sparkAge",ORDER=["k","e","u","t"];
var BANDS={
  k:{key:"k",ages:"4-6",grades:"PreK–1",label:"Explorer",legacy:"lo",rep:6,min:3,max:6},
  e:{key:"e",ages:"7-9",grades:"2–4",label:"Clue Solver",legacy:"mid",rep:8,min:7,max:9},
  u:{key:"u",ages:"10-12",grades:"5–7",label:"Investigator",legacy:"hi",rep:11,min:10,max:12},
  t:{key:"t",ages:"13+",grades:"8+",label:"Systems Analyst",legacy:"hi",rep:13,min:13,max:15}};
var FALL={k:["k","e","u","t"],e:["e","k","u","t"],u:["u","e","t","k"],t:["t","u","e","k"]};
var LEG={k:"lo",e:"mid",u:"hi",t:"hi"};
var RATES={slow:.85,normal:1,fast:1.15};
var listeners=[];
function ls(k,v){try{if(arguments.length>1){localStorage.setItem(k,String(v));return v}return localStorage.getItem(k)}catch(e){return null}}
function clampAge(a){a=Math.round(Number(a));if(!isFinite(a)) a=6;return Math.max(3,Math.min(15,a))}
function keyFor(a){a=clampAge(a);return a<=6?"k":a<=9?"e":a<=12?"u":"t"}
function loadP(){var d={v:1,tiers:{k:1,e:1,u:1,t:1},lock:false,adaptive:true,sessionMin:0,rate:"normal",streak:{},ghostNext:{},stats:{}};
  try{var p=JSON.parse(ls(PKEY)||"null");if(p&&typeof p==="object"){for(var k in d) if(p[k]==null) p[k]=d[k];return p}}catch(e){}return d}
var P=loadP();
function saveP(){ls(PKEY,JSON.stringify(P))}
/* Allen 11/15 items 7+8: per-kid age + per-kid tiers/streaks/ghostNext.
   The active kid = sparkWorldV1.active (the sandbox save; read straight from storage because this file loads first).
   A kid with profiles[pid].ageBand ('k'|'e'|'u'|'t', picked at new-profile creation or by a grown-up) plays at that band's age;
   kids without one, and play with no kid at all, use the device age (sparkAge, the grown-up panel) exactly as before. */
var WKEY="sparkWorldV1",kidC={raw:null,v:null};
function activeKid(){var raw=ls(WKEY);if(raw===kidC.raw) return kidC.v;var v=null;try{var d=JSON.parse(raw||"null");var id=d&&d.active,p=id&&d.profiles&&d.profiles[id];if(p) v={id:String(id),band:BANDS[p.ageBand]?p.ageBand:null}}catch(e){}kidC={raw:raw,v:v};return v}
function devAge(){var s=window.S;var a=(s&&s.age)||Number(ls(AKEY))||6;return clampAge(a)}
function kidAge(){var k=activeKid();if(!k||!k.band) return null;var d=devAge();return keyFor(d)===k.band?d:BANDS[k.band].rep}
function curAge(){var k=kidAge();return k!=null?k:devAge()}
/* tiers/streak/ghostNext live per kid in P.kids[pid]; the device values move to the first kid seen (once), later kids start fresh */
function KT(){var k=activeKid();if(!k) return P;P.kids=P.kids||{};var t=P.kids[k.id];
  if(!t){if(!P.kidsMigrated){t={tiers:JSON.parse(JSON.stringify(P.tiers||{k:1,e:1,u:1,t:1})),streak:JSON.parse(JSON.stringify(P.streak||{})),ghostNext:JSON.parse(JSON.stringify(P.ghostNext||{})),from:"device"};P.kidsMigrated=k.id}
    else t={tiers:{k:1,e:1,u:1,t:1},streak:{},ghostNext:{}};P.kids[k.id]=t;saveP()}
  t.tiers=t.tiers||{k:1,e:1,u:1,t:1};t.streak=t.streak||{};t.ghostNext=t.ghostNext||{};return t}
var lastKid=null;
function emit(source,extra){var b=keyFor(curAge()),d={age:curAge(),band:b,ages:BANDS[b].ages,label:BANDS[b].label,tier:KT().tiers[b],source:source||"parent"};
  if(extra) for(var k in extra) d[k]=extra[k];
  try{window.dispatchEvent(new CustomEvent("spark:agechange",{detail:d}))}catch(e){}
  listeners.slice().forEach(function(fn){try{fn(d)}catch(e){}});applyCaps();renderPanel();return d}
function setAge(a,o){o=o||{};a=clampAge(a);var before=curAge();ls(AKEY,a);if(window.S) window.S.age=a;
  var sel=document.getElementById("age");if(sel&&+sel.value!==a) sel.value=String(a);
  try{if(typeof window.__renderAgeProfile==="function") window.__renderAgeProfile()}catch(e){}
  if(before!==curAge()||o.force) return emit(o.source||"parent",{from:before});renderPanel();return null}
/* ---- QA / teacher URL switches (applied before the app reads sparkAge) */
var Q={};try{Q=Object.fromEntries(new URLSearchParams(location.search))}catch(e){}
if(Q.band&&BANDS[Q.band]) ls(AKEY,BANDS[Q.band].rep);
if(Q.age&&isFinite(+Q.age)) ls(AKEY,clampAge(Q.age));
if(Q.tier!=null&&/^[012]$/.test(Q.tier)){KT().tiers[keyFor(curAge())]=+Q.tier;saveP()}
var TEACHER=!!Q["class"];
/* ---- session clock (stopping point only between missions) */
var T0=Number(sessionStorage.getItem("sparkSessionT0"))||Date.now();try{sessionStorage.setItem("sparkSessionT0",T0)}catch(e){}
var SA={
  v:2,bands:BANDS,order:ORDER,keyFor:keyFor,
  bandFor:function(a){var b=BANDS[keyFor(a)];return b.key==="t"?"13-15":b.ages},
  get age(){return curAge()},get band(){return keyFor(curAge())},get ages(){return BANDS[keyFor(curAge())].ages},
  get info(){return BANDS[keyFor(curAge())]},get legacy(){return LEG[keyFor(curAge())]},
  get tier(){return KT().tiers[keyFor(curAge())]},get tapOnly(){return curAge()<=3},
  get locked(){return !!P.lock},get adaptiveOn(){return !!P.adaptive&&!P.lock},get teacher(){return TEACHER},
  setAge:setAge,
  set:function(b,o){if(!BANDS[b]) return null;if(keyFor(curAge())===b) return null;return setAge(BANDS[b].rep,o)},
  setTier:function(t,o){var b=keyFor(curAge());t=Math.max(0,Math.min(2,t|0));if(KT().tiers[b]===t) return;KT().tiers[b]=t;saveP();emit((o&&o.source)||"adaptive")},
  lock:function(v){P.lock=!!v;saveP();renderPanel()},
  adaptive:function(v){P.adaptive=!!v;saveP();renderPanel()},
  onChange:function(fn){listeners.push(fn);return function(){listeners=listeners.filter(function(f){return f!==fn})}},
  /* text/knob resolver: {k,e,u,t} with fallback, also legacy {lo,mid,hi} */
  pick:function(o,band){if(o==null||typeof o!=="object"||Array.isArray(o)) return o;band=band||keyFor(curAge());
    var f=FALL[band];for(var i=0;i<f.length;i++) if(o[f[i]]!=null) return o[f[i]];
    var l=LEG[band];if(o[l]!=null) return o[l];if(o.mid!=null) return o.mid;if(o.lo!=null) return o.lo;return o.hi},
  hasBands:function(o){return !!o&&typeof o==="object"&&ORDER.some(function(k){return o[k]!=null})},
  /* global per-band play rules (main plan QA + batch 2): every region reads these instead of hard-coding ages */
  rules:function(band){band=band||keyFor(curAge());var k=band==="k";
    return {band:band,tapAlternative:true,twoHanded:!k,timed:!k,beatTiming:!k,minTargetPx:k?76:38,scary:k?"none":band==="e"?"distant":"told",
      autoAssist:k,maxChoices:k?2:band==="e"?3:4,readingNeeded:!k,autoAdvance:false,dailyRewards:false}},
  /* band order helpers: SparkAge.atLeast("u"); content gate: SparkAge.allows({minBand:"u"}) or {bands:["k","e"]} */
  atLeast:function(b,band){band=band||keyFor(curAge());return ORDER.indexOf(band)>=ORDER.indexOf(b)},
  allows:function(o,band){if(!o) return true;band=band||keyFor(curAge());if(o.bands&&o.bands.indexOf(band)<0) return false;
    if(o.minBand&&ORDER.indexOf(band)<ORDER.indexOf(o.minBand)) return false;if(o.maxBand&&ORDER.indexOf(band)>ORDER.indexOf(o.maxBand)) return false;return true},
  /* regions announce themselves (id, name, mission count) so the parent panel needs no hard-coded list */
  registerRegion:function(id,info){if(!id) return;var R=regs();var o=R[id]||{};info=info||{};if(info.name) o.name=info.name;if(info.missions) o.n=info.missions;R[id]=o;try{localStorage.setItem("sparkRegionsV1",JSON.stringify(R))}catch(e){}},
  regions:function(){return regs()},
  /* one difficulty block per mission: {k:{...},e:{...},u:{...},t:{...},tierScale:{easy,stretch,knobs:[...]}} */
  difficulty:function(block,band,tier){if(!block) return {};band=band||keyFor(curAge());tier=tier==null?KT().tiers[band]:tier;
    var base=SA.pick(block,band)||{},out={};for(var k in base) out[k]=base[k];
    var ts=block.tierScale;if(ts&&tier!==1){var m=tier===0?(ts.easy||.75):(ts.stretch||1.25),knobs=ts.knobs||["targets","timeWindowMs"];
      knobs.forEach(function(k){if(typeof out[k]==="number"){var tm=/Ms$|S$/.test(k)?1/m:m;out[k]=Math.max(1,Math.round(out[k]*tm))}})}
    out._band=band;out._tier=tier;out._rules=SA.rules(band);out._scaled=!!(ts&&tier!==1);return out},
  /* adaptive: call once per finished mission */
  record:function(region,mission,s){s=s||{};var b=keyFor(curAge());P.stats[b]=P.stats[b]||{};var R=P.stats[b][region]=P.stats[b][region]||{};
    var m=R[mission]=R[mission]||{plays:0};m.plays++;m.firstTry=!!s.firstTry;m.hints=s.hints|0;m.wrong=s.wrong|0;m.ms=s.ms|0;m.at=Date.now();
    var strong=s.firstTry&&!(s.hints>0)&&!(s.wrong>0),struggle=(s.hints|0)>=3||(s.wrong|0)>=2,res={band:b,tier:KT().tiers[b],change:0,strong:strong,struggle:struggle};
    if(SA.adaptiveOn){
      if(strong){KT().streak[b]=(KT().streak[b]||0)+1;if(KT().streak[b]>=2&&KT().tiers[b]<2){KT().tiers[b]++;KT().streak[b]=0;res.change=1}}
      else{KT().streak[b]=0;if(struggle&&KT().tiers[b]>0){KT().tiers[b]--;res.change=-1;KT().ghostNext[b]=true}}
    }
    res.tier=KT().tiers[b];saveP();if(res.change) emit("adaptive",{change:res.change});return res},
  takeGhost:function(){var b=keyFor(curAge());if(KT().ghostNext[b]){KT().ghostNext[b]=false;saveP();return true}return false},
  rate:function(){return RATES[P.rate]||1},
  prefs:function(){return {rate:P.rate,sessionMin:P.sessionMin,mic:P.mic===true,captions:P.capOn!==false,capSize:P.capSize||"normal",voice:!(window.S&&window.S.voice===false)&&ls("sparkVoice")!=="false"}},
  setPref:function(k,v){if(k==="voice"){var on=!!v;ls("sparkVoice",on);if(window.S) window.S.voice=on;try{if(!on&&window.SparkVoice) SparkVoice.stop()}catch(e){}}
    else{P[k]=v;saveP()}applyCaps();renderPanel()},
  sessionMinutes:function(){return (Date.now()-T0)/60000},
  sessionDue:function(){return P.sessionMin>0&&SA.sessionMinutes()>=P.sessionMin},
  resetSession:function(){T0=Date.now();try{sessionStorage.setItem("sparkSessionT0",T0)}catch(e){}},
  _profile:function(){return JSON.parse(JSON.stringify(P))},
  _reset:function(){P=loadP();P.tiers={k:1,e:1,u:1,t:1};P.streak={};P.stats={};P.ghostNext={};P.kids={};P.kidsMigrated=null;saveP()},
  openPanel:function(){openPanel()},closePanel:function(){closePanel()},
  /* sandbox hooks (Sandbox spec §10.12): extra parent-panel sections, and the per-child age switch when a player is picked */
  addPanelSection:function(htmlFn,bindFn){SECTIONS.push({html:htmlFn,bind:bindFn});renderPanel()},
  setProfileAge:function(a){return setAge(a,{source:"profile"})},
  /* items 7+8: per-kid age. deviceAge = the grown-up panel / signed-out fallback; kid = {id, band} of the active kid (or null) */
  get deviceAge(){return devAge()},kid:function(){var k=activeKid();return k?{id:k.id,band:k.band}:null},kidAge:function(){return kidAge()},
  /* call after the active kid changes or a kid's ageBand is saved: fires spark:agechange when the effective age/band changed */
  refreshKid:function(src){kidC.raw=null;var k=activeKid(),key=(k?k.id:"-")+"|"+curAge();if(key===lastKid) return null;var prev=lastKid;lastKid=key;if(prev===null) return null;
    var b=keyFor(curAge()),pb=prev.split("|");return emit(src||"kid",{kid:k&&k.id,from:+pb[1],fromKid:pb[0],bandRaised:pb[0]===(k?k.id:"-")&&ORDER.indexOf(b)>ORDER.indexOf(keyFor(+pb[1]))})},
  setKidBand:function(band,o){if(!BANDS[band]) return null;var k=activeKid();if(!k) return null;
    try{if(window.SB&&SB.store&&SB.store.profile){var p=SB.store.profile();if(p){p.ageBand=band;p.age=BANDS[band].rep;SB.store.save(true)}}
      else{var d=JSON.parse(ls(WKEY)||"null");if(d&&d.profiles&&d.profiles[k.id]){d.profiles[k.id].ageBand=band;d.profiles[k.id].age=BANDS[band].rep;ls(WKEY,JSON.stringify(d))}}}catch(e){return null}
    var r=SA.refreshKid((o&&o.source)||"kid");renderPanel();return r},
  _kt:function(){return JSON.parse(JSON.stringify(KT()))}
};
(function(){var k=activeKid();lastKid=(k?k.id:"-")+"|"+curAge()})();
/* another tab (or the sandbox store) switching kids / saving a band */
window.addEventListener("storage",function(e){if(e.key===WKEY) SA.refreshKid("kid")});
var SECTIONS=[];
window.SparkAge=SA;

/* ============================================================ grown-up button + parent panel */
var css=""+
"body.spark-safari .sg-btn{display:none!important}"+
".top{padding-right:calc(10px + 80px + env(safe-area-inset-right,0px))!important}"+
".sg-btn>span{top:-12px}.sg-btn{position:fixed;top:max(0px,env(safe-area-inset-top,0px));right:max(2px,env(safe-area-inset-right,0px));z-index:2147483000;width:76px;height:76px;border-radius:50%;border:0;background:transparent;color:#fff;font:600 19px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}"+
".sg-btn:before{content:'';position:absolute;left:16px;top:4px;width:44px;height:44px;border-radius:50%;border:1px solid #ffffff55;background:#10243ecc;box-shadow:0 2px 8px #0005;pointer-events:none}.sg-btn>span{position:relative}"+
".sg-btn svg.ring{position:absolute;left:13px;top:1px;width:50px;height:50px;transform:rotate(-90deg);pointer-events:none}"+
".sg-btn svg.ring circle{fill:none;stroke:#f6c445;stroke-width:4;stroke-dasharray:132;stroke-dashoffset:132}"+
".sg-btn.holding svg.ring circle{transition:stroke-dashoffset 3s linear;stroke-dashoffset:0}"+
".sg-tip{position:fixed;top:calc(max(8px,env(safe-area-inset-top,0px)) + 72px);right:8px;z-index:2147483000;background:#10243e;color:#fff;border:1px solid #f6c445;border-radius:10px;padding:6px 10px;font:600 13px/1.3 system-ui,sans-serif;pointer-events:none;max-width:220px}"+
".sg-ov{position:fixed;inset:0;z-index:2147483001;background:#0009;display:flex;align-items:center;justify-content:center;padding:12px}"+
".sg-pan{background:#fff;color:#10243e;border-radius:16px;max-width:560px;width:100%;max-height:calc(100% - 8px);overflow:auto;padding:18px 18px 14px;font:15px/1.4 system-ui,sans-serif;box-shadow:0 10px 40px #0008}"+
".sg-pan h2{margin:0 0 4px;font-size:21px}.sg-pan h3{margin:14px 0 6px;font-size:15px;color:#3a5a80;text-transform:uppercase;letter-spacing:.04em}"+
".sg-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #e3e9f1}"+
".sg-row label,.sg-row .sg-lbl{flex:1}.sg-agerow{flex-wrap:wrap}.sg-ages{display:flex;flex-wrap:wrap;gap:6px;flex:2 1 260px}.sg-agec{min-width:44px;height:44px;border-radius:10px;border:1px solid #9fb2c8;background:#fff;color:#123;font:600 17px/1 system-ui,sans-serif;cursor:pointer}.sg-agec.on{background:#1f6feb;border-color:#1f6feb;color:#fff}.sg-agec:focus-visible{outline:3px solid #f5b400;outline-offset:2px}.sg-pan select{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid #9fb2c8;min-width:120px}"+
".sg-band{background:#eef4fb;border-radius:10px;padding:8px 10px;margin:6px 0}.sg-band b{color:#10243e}"+
".sg-pan .sg-note{font-size:13px;color:#4c6480}.sg-sw{width:46px;height:28px;accent-color:#2fbf71}"+
".sg-prog{width:100%;border-collapse:collapse;font-size:14px}.sg-prog td,.sg-prog th{padding:4px 6px;border-bottom:1px solid #e3e9f1;text-align:left}"+
".sg-acts{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:14px}"+
".sg-b{font:600 15px system-ui,sans-serif;border-radius:10px;border:0;padding:10px 14px;cursor:pointer;background:#10243e;color:#fff}.sg-b.alt{background:#e3e9f1;color:#10243e}.sg-b.warn{background:#c0392b}"+
"body.sg-capoff .ar2-cap,body.sg-capoff .sf-cap{visibility:hidden!important}"+
"body.sg-capl .ar2-cap,body.sg-capl .sf-cap{font-size:clamp(17px,2.9vh,26px)!important}body.sg-capxl .ar2-cap,body.sg-capxl .sf-cap{font-size:clamp(20px,3.5vh,31px)!important}"+
".ar2-skip{right:calc(max(2px,env(safe-area-inset-right,0px)) + 80px)!important}";
function addCss(){if(document.getElementById("sg-css")) return;var s=document.createElement("style");s.id="sg-css";s.textContent=css;document.head.appendChild(s)}
var btn=null,tip=null,ov=null,holdT=0,tipT=0,closedAt=0;
function mkBtn(){if(btn||!document.body) return;addCss();
  btn=document.createElement("button");btn.type="button";btn.className="sg-btn";btn.id="grownUpBtn";
  btn.setAttribute("aria-label","Grown-ups: press and hold for 3 seconds to open Parent Settings");
  btn.innerHTML='<span aria-hidden="true">&#9881;</span><svg class="ring" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="21"/></svg>';
  /* the hold is measured by the clock, not only by a timer: a busy page can delay setTimeout, so a release
     after 3 s always opens the panel; the finger is captured so a small wobble does not cancel the hold */
  var t0=0,HOLD=3000;
  function start(e){if(performance.now()-closedAt<900) return;if(e&&e.pointerType==="mouse"&&e.button!==0) return;if(e) e.preventDefault();if(TEACHER){openPanel();return}
    if(e&&e.pointerId!=null) try{btn.setPointerCapture(e.pointerId)}catch(err){}
    clearTimeout(holdT);clearTimeout(tipT);btn.classList.remove("holding");void btn.offsetWidth;btn.classList.add("holding");showTip("Grown-ups: keep holding\u2026");t0=performance.now();
    holdT=setTimeout(done,HOLD)}
  function done(){if(!btn.classList.contains("holding")) return;clearTimeout(holdT);btn.classList.remove("holding");clearTimeout(tipT);hideTip();openPanel()}
  function stop(){if(!btn.classList.contains("holding")) return;if(performance.now()-t0>=HOLD-60){done();return}
    clearTimeout(holdT);btn.classList.remove("holding");showTip("Grown-ups: press and hold for 3 seconds",1800)}
  btn.addEventListener("pointerdown",start);btn.addEventListener("pointerup",stop);
  /* a phone may cancel the pointer mid-hold (gesture takeover); the finger is still down, so keep timing and end on touchend instead */
  btn.addEventListener("pointercancel",function(e){if(e&&e.pointerType==="touch") return;stop()});
  btn.addEventListener("touchend",function(){stop()});btn.addEventListener("touchcancel",function(){stop()});
  window.addEventListener("pointerup",function(e){if(e.target!==btn&&!btn.contains(e.target)) stop()},true);
  btn.addEventListener("contextmenu",function(e){e.preventDefault()});
  btn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation()},true);
  var kd=false;btn.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&!kd){kd=true;e.preventDefault();start(null)}});
  btn.addEventListener("keyup",function(e){if(e.key==="Enter"||e.key===" "){kd=false;e.preventDefault();stop()}});
  document.body.appendChild(btn)}
function showTip(t,ms){if(!tip){tip=document.createElement("div");tip.className="sg-tip";tip.setAttribute("role","status");document.body.appendChild(tip)}tip.textContent=t;tip.hidden=false;clearTimeout(tipT);if(ms) tipT=setTimeout(hideTip,ms)}
function hideTip(){if(tip) tip.hidden=true}
var REGION_NAMES={arctic:"Arctic",sahara:"Sahara",reef:"Reef",congo:"Congo Rainforest",amazon:"Amazon",antarctica:"Antarctica",himalayas:"Himalayas",everglades:"Everglades",northwoods:"Northwoods",steppe:"Mongolian Steppe",pacific:"Pacific Islands",rhine:"Rhine River",rift:"Great Rift Valley"};
function regs(){try{return JSON.parse(localStorage.getItem("sparkRegionsV1")||"{}")||{}}catch(e){return {}}}
function regionProgress(){var rows=[],v3={},v2={};try{v3=JSON.parse(ls("sparkAreasV3")||"{}")||{}}catch(e){}try{v2=JSON.parse(ls("sparkAreasV2")||"{}")||{}}catch(e){}
  var RG=regs(),names={};for(var nk in REGION_NAMES) names[nk]=REGION_NAMES[nk];for(var rk in RG) if(RG[rk].name) names[rk]=RG[rk].name;var ids={};Object.keys(v3).concat(Object.keys(v2)).forEach(function(k){ids[k]=1});
  Object.keys(ids).forEach(function(id){var r=v3[id]||{},cells=ORDER.map(function(b){var x=r.bands&&r.bands[b];return x?Object.keys(x.stops||{}).length+"/"+((RG[id]&&RG[id].n)||4):"–"});
    if(!r.bands&&v2[id]) cells=ORDER.map(function(b){return b===keyFor(curAge())?Object.keys(v2[id].stops||{}).length+"/"+((RG[id]&&RG[id].n)||4):"–"});
    rows.push({name:names[id]||id,cells:cells,badge:!!(r.badge||(v2[id]&&v2[id].badge))})});
  try{var sv=JSON.parse(ls("sparkSafariV1")||"null");if(sv) rows.unshift({name:"Savannah",cells:ORDER.map(function(b){return b===keyFor(curAge())?Object.keys(sv.done||{}).length+"/4":"·"}),badge:!!sv.badge,shared:true})}catch(e){}
  return rows}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
/* what each level/setting means, so the line in the panel always says something true for the chosen level */
function tierWhat(k,t){var r=SA.rules(k),base={k:"tap or drag, no timers, at most "+r.maxChoices+" picture choices, targets "+r.minTargetPx+" px or more",
  e:"short readings, gentle timers, "+r.maxChoices+" choices",u:"predict-then-test, real numbers, "+r.maxChoices+" choices",t:"data, trade-offs and models, "+r.maxChoices+" choices"}[k];
  return base+(k==="k"?(t===0?"; fewer things to find":t===2?"; a few more things to find":"; the standard mix"):(t===0?"; fewer targets and more time":t===2?"; more targets and less time":"; the standard mix"))+"."}
function panelHtml(){var a=curAge(),da=devAge(),kk=activeKid(),b=BANDS[keyFor(a)],pr=SA.prefs(),rows=regionProgress(),opts="";
  for(var i=3;i<=15;i++) opts+='<button type="button" role="radio" class="sg-agec'+(i===da?" on":"")+'" data-age="'+i+'" aria-checked="'+(i===da)+'" tabindex="'+(i===da?0:-1)+'">'+i+'</button>';
  var tiers=["easier","core","stretch"];
  return '<div class="sg-pan" role="dialog" aria-modal="true" aria-labelledby="sgTitle">'+
  '<h2 id="sgTitle">Parent Settings</h2><div class="sg-note">For grown-ups. Changes apply right away: Spark restarts the current step at the new level, and nothing already done is lost.</div>'+
  '<h3>Child</h3><div class="sg-row sg-agerow"><span class="sg-lbl" id="sgAgeL">Child age'+(kk&&kk.band?' <span class="sg-note">(this device; players without their own age)</span>':'')+'</span><div id="sgAge" class="sg-ages" role="radiogroup" aria-labelledby="sgAgeL">'+opts+'</div></div>'+
  (kk&&kk.band?'<div class="sg-row sg-kidage"><span class="sg-lbl">This player\'s age <span class="sg-note">(picked when this player was made; it is used instead of the device age for this player)</span></span><div class="sg-ages" id="sgKidAge">'+ORDER.map(function(k){return '<button type="button" class="sg-agec'+(k===kk.band?' on':'')+'" data-band="'+k+'" style="min-width:64px">'+BANDS[k].ages+'</button>'}).join('')+'</div></div>':'')+'<div class="sg-band" id="sgBand">Level: <b>'+esc(b.label)+'</b> · ages '+esc(b.ages)+' · grades '+esc(b.grades)+(a<=3?' · tap-only play':'')+'<br><span class="sg-note" id="sgTierLine">Inside '+esc(b.label)+' (ages '+esc(b.ages)+') Spark is on the <b>'+tiers[KT().tiers[b.key]]+'</b> setting: '+esc(tierWhat(b.key,KT().tiers[b.key]))+'</span></div>'+
  '<div class="sg-row"><label for="sgTier">Difficulty inside this level</label><select id="sgTier">'+tiers.map(function(t,i){return '<option value="'+i+'"'+(KT().tiers[b.key]===i?" selected":"")+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>'}).join("")+'</select></div>'+
  '<div class="sg-row"><label for="sgAd">Adaptive difficulty <span class="sg-note">(easier or harder inside this level, based on how missions go)</span></label><input id="sgAd" class="sg-sw" type="checkbox"'+(P.adaptive?" checked":"")+'></div>'+
  '<div class="sg-row"><label for="sgLock">Lock level <span class="sg-note">(no automatic changes)</span></label><input id="sgLock" class="sg-sw" type="checkbox"'+(P.lock?" checked":"")+'></div>'+
  '<h3>Voice and reading</h3><div class="sg-row"><label for="sgVoice">Spark\'s voice</label><input id="sgVoice" class="sg-sw" type="checkbox"'+(pr.voice?" checked":"")+'></div>'+
  '<div class="sg-row"><label for="sgMic">Talk to Spark <small>(tap Spark to speak; uses the microphone)</small></label><input id="sgMic" class="sg-sw" type="checkbox"'+(pr.mic?" checked":"")+'></div>'+
  '<div class="sg-row"><label for="sgRate">Read-aloud speed</label><select id="sgRate"><option value="slow"'+(P.rate==="slow"?" selected":"")+'>Slower</option><option value="normal"'+(P.rate==="normal"?" selected":"")+'>Normal</option><option value="fast"'+(P.rate==="fast"?" selected":"")+'>Faster</option></select></div>'+
    '<div class="sg-row"><label for="sgCap">Captions <span class="sg-note">(Spark\'s words on screen; always shown when the voice is off)</span></label><input id="sgCap" class="sg-sw" type="checkbox"'+(pr.captions?" checked":"")+'></div>'+
  '<div class="sg-row"><label for="sgCapSz">Caption size</label><select id="sgCapSz"><option value="normal"'+(pr.capSize==="normal"?" selected":"")+'>Normal</option><option value="large"'+(pr.capSize==="large"?" selected":"")+'>Large</option><option value="xlarge"'+(pr.capSize==="xlarge"?" selected":"")+'>Extra large</option></select></div>'+
  '<h3>Session</h3><div class="sg-row"><label for="sgSess">Suggest a stopping point after</label><select id="sgSess">'+[0,10,15,20,30].map(function(m){return '<option value="'+m+'"'+(+P.sessionMin===m?" selected":"")+'>'+(m?m+" minutes":"Off")+'</option>'}).join("")+'</select></div>'+
  '<div class="sg-note">The stopping point only appears between missions. Progress is always saved.</div>'+
  '<h3>Progress</h3><table class="sg-prog"><tr><th>Region</th>'+ORDER.map(function(k){return '<th>'+BANDS[k].ages+'</th>'}).join("")+'<th>Badge</th></tr>'+
  (rows.length?rows.map(function(r){return '<tr><td>'+esc(r.name)+'</td>'+r.cells.map(function(c){return '<td>'+c+'</td>'}).join("")+'<td>'+(r.badge?"&#11088;":"–")+'</td></tr>'}).join(""):'<tr><td colspan="6" class="sg-note">No missions played yet.</td></tr>')+'</table>'+
  SECTIONS.map(function(x){try{return x.html()||""}catch(e){return ""}}).join("")+
  '<div class="sg-acts"><button type="button" class="sg-b alt" id="sgReset">Reset progress</button><button type="button" class="sg-b" id="sgClose">Done</button></div></div>'}
function bindPanel(){var $=function(id){return document.getElementById(id)};
  /* age picker: real buttons (a native <select> popup ignored mouse picks in some browsers) */
  var ag=$("sgAge");ag.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".sg-agec");if(!b) return;e.preventDefault();var v=+b.dataset.age;setAge(v,{source:"parent"});var nb=document.querySelector('#sgAge .sg-agec[data-age="'+v+'"]');if(nb) nb.focus()});
  ag.addEventListener("keydown",function(e){var d=(e.key==="ArrowRight"||e.key==="ArrowDown")?1:(e.key==="ArrowLeft"||e.key==="ArrowUp")?-1:0;if(!d) return;e.preventDefault();var v=clampAge(curAge()+d);setAge(v,{source:"parent"});var nb=document.querySelector('#sgAge .sg-agec[data-age="'+v+'"]');if(nb) nb.focus()});
  var ka=$("sgKidAge");if(ka) ka.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-band]");if(!b) return;e.preventDefault();SA.setKidBand(b.dataset.band,{source:"parent"})});
  $("sgAd").onchange=function(e){SA.adaptive(e.target.checked)};
  $("sgTier").onchange=function(e){SA.setTier(+e.target.value,{source:"parent"})};
  $("sgLock").onchange=function(e){SA.lock(e.target.checked)};
  $("sgVoice").onchange=function(e){SA.setPref("voice",e.target.checked)};$("sgMic").onchange=function(e){SA.setPref("mic",e.target.checked)};
  $("sgRate").onchange=function(e){SA.setPref("rate",e.target.value)};
  $("sgCap").onchange=function(e){SA.setPref("capOn",e.target.checked)};$("sgCapSz").onchange=function(e){SA.setPref("capSize",e.target.value)};
  $("sgSess").onchange=function(e){SA.setPref("sessionMin",+e.target.value);SA.resetSession()};
  $("sgClose").onclick=closePanel;SECTIONS.forEach(function(x){try{if(x.bind) x.bind(closePanel)}catch(e){}});
  var armed=false;$("sgReset").onclick=function(){var b=$("sgReset");if(!armed){armed=true;b.textContent="Tap again to reset all progress";b.classList.add("warn");return}
    ["sparkAreasV2","sparkAreasV3","sparkSafariV1","sparkStationPackV1","sparkWorldV1"].forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});SA._reset();renderPanel()}}
function openPanel(){if(performance.now()-closedAt<900) return;mkBtn();if(ov) return;ov=document.createElement("div");ov.className="sg-ov";ov.innerHTML=panelHtml();document.body.appendChild(ov);bindPanel();
  ov.addEventListener("pointerdown",function(e){if(e.target===ov) closePanel()});
  ov.addEventListener("keydown",function(e){if(e.key==="Escape"){e.stopPropagation();closePanel()}},true);
  ["pointerdown","pointerup","click","keydown"].forEach(function(t){ov.addEventListener(t,function(e){e.stopPropagation()})});
  var f=document.querySelector("#sgAge .sg-agec.on")||document.getElementById("sgAge");if(f) f.focus();try{window.dispatchEvent(new CustomEvent("spark:parentpanel",{detail:{open:true}}))}catch(e){}}
function closePanel(){if(!ov) return;ov.remove();ov=null;closedAt=performance.now();if(btn){try{btn.blur()}catch(e){}}try{window.dispatchEvent(new CustomEvent("spark:parentpanel",{detail:{open:false}}))}catch(e){}}
function renderPanel(){if(!ov) return;var y=ov.firstChild&&ov.firstChild.scrollTop;ov.innerHTML=panelHtml();bindPanel();if(ov.firstChild) ov.firstChild.scrollTop=y||0}
window.addEventListener("keydown",function(e){if(!ov) return;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();closePanel();return}
  if(!ov.contains(e.target)){e.stopImmediatePropagation()}else e.stopPropagation()},true);
/* captions: on by default; a grown-up can hide them (only while Spark's voice is on) or make them bigger */
function applyCaps(){var b=document.body;if(!b) return;var pr=SA.prefs();b.classList.toggle("sg-bk",keyFor(curAge())==="k");b.classList.toggle("sg-capoff",!pr.captions&&pr.voice);b.classList.toggle("sg-capl",pr.capSize==="large");b.classList.toggle("sg-capxl",pr.capSize==="xlarge")}
function boot(){mkBtn();applyCaps()}
if(document.body) boot();else document.addEventListener("DOMContentLoaded",boot);
})();
