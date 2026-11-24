/* Spark Studio: site-wide progression + hidden play signals (progression plan, Allen 11/12).
   Loaded right after spark-age.js and before app-loader.js. One core for every area tab:
   - subject ladders: reading, math, science (one per subject, per child; subjects never affect each other)
   - automatic up/down movement (rules in CFG), parent overrides, lock, reset to the age start
   - parent-only readout (SparkAge parent panel section); kids never see levels, steps, scores or drops
   - anonymous play signals, batched to /api/signals (no names, no recordings), parent can switch it off
   Tabs plug in with SparkProgress.tag(...)/report(...)/tierFor(...); 3D tabs are also read from window.__sbxLog. */
(function(){
"use strict";
if(window.SparkProgress) return;
/* ---------------------------------------------------------------- rules (one place) */
var CFG={
  steps:3,            /* steps inside each level */
  startStep:2,        /* age start = the middle step (same as the old "core" setting) */
  win:10,             /* step window */
  upRight:8,upFirst:5,/* step up: 8 of last 10 right, at least 5 first-try */
  downMissRow:3,      /* step down: 3 misses in a row ... */
  downBelow:5,        /* ... or fewer than 5 of the last 10 right */
  hold:5,             /* no bouncing: hold at least 5 rounds after any change */
  lvWin:20,           /* level window */
  lvUpRight:16,lvUpFirst:12, /* level up (at the top step): 16 of last 20 right, 12 first-try */
  lvDownBelow:8,      /* level down (at the bottom step): fewer than 8 of last 20 right */
  lvDays:2,           /* level changes need answers from 2 separate play days */
  keep:40,            /* answers kept per ladder */
  moves:12,           /* recent ups and downs kept per ladder */
  batchMs:30000,maxQueue:400,maxBatch:150,
  idleStuckMs:75000,  /* no progress inside an activity this long = stuck (idle) */
  deadTapMs:1200,lowFps:18
};
var SUBJECTS=["reading","math","science"];
var SUBJ_NAME={reading:"Reading",math:"Math",science:"Science"};
var BAND_ORDER=["k","e","u","t"],BAND_NAME={k:"Explorer",e:"Clue Solver",u:"Investigator",t:"Systems Analyst"};
/* ladders: the 3 subject ladders, plus tab ladders that keep their own fixed levels (Egypt stamp booth) */
var LADDERS={
  reading:{subject:"reading",levels:BAND_ORDER,names:BAND_NAME},
  math:{subject:"math",levels:BAND_ORDER,names:BAND_NAME},
  science:{subject:"science",levels:BAND_ORDER,names:BAND_NAME},
  "egypt-stamp":{subject:"reading",own:true,label:"Egypt stamp booth (reading)",levels:["pre","early","reader"],
    names:{pre:"Pre-reader",early:"Early reader",reader:"Reader"},startStep:1,
    start:function(age){return age<=5?0:age===6?1:2}}
};
/* ---------------------------------------------------------------- activity tags: "area/activity" -> subject */
var TAGS={
  /* Sahara 2D area engine (areas2) */
  "sahara/tent":"math","sahara/buggy":"science","sahara/skynav":"science","sahara/tracks":"science",
  /* Reef 2D area engine */
  "reef/survey":"math","reef/nursery":"science","reef/boat":"science","reef/pairs":"science","reef/reefsim":"science",
  /* Arctic 2D area engine (+ Arctic sandbox sparks, also auto-tagged from their skills list) */
  "arctic/igloo":"math","arctic/fish":"math","arctic/feed":"math","arctic/aurora":"science",
  "arctic/sled":"math","arctic/post":"math","arctic/photo":"science",
  /* 3D tabs read from the shared log */
  "egypt/stamp":"reading","savannah/read":"reading","reef/shark-letters":"reading",
  /* 2D Savannah */
  "savannah/safari-feed":"science","savannah/observe":"science"
};
/* ---------------------------------------------------------------- storage */
var KEY="sparkProgressV1";
function now(){return Date.now()}
function day(t){var d=new Date(t||now());return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function rid(){var a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<12;i++)a[i]=Math.random()*256|0}return Array.prototype.map.call(a,function(x){return("0"+x.toString(16)).slice(-2)}).join("")}
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&d.kids) return d}catch(e){}return {v:1,dev:rid(),collect:true,kids:{}}}
var D=load();if(!D.dev) D.dev=rid();if(D.collect==null) D.collect=true;
var saveT=0;function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,250)}
function saveNow(){clearTimeout(saveT);try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
function SA(){return window.SparkAge}
function age(){try{return SA()?SA().age:6}catch(e){return 6}}
function ageBandIdx(){try{return BAND_ORDER.indexOf(SA().keyFor(age()))}catch(e){return 0}}
function childId(){try{var d=window.SB&&SB.store&&SB.store.doc&&SB.store.doc();if(d&&d.active) return String(d.active)}catch(e){}return "p1"}
function kid(){var id=childId();var k=D.kids[id];if(!k) k=D.kids[id]={ladders:{},acts:{},stuck:{}};return k}
/* ---------------------------------------------------------------- ladder engine (pure; also used by the test sim) */
function startOf(def,a){var lv=def.start?def.start(a):Math.max(0,BAND_ORDER.indexOf(SA()?SA().keyFor(a):"k"));return {level:lv,step:def.startStep||CFG.startStep}}
function newLadder(def,a){var s=startOf(def,a);return {level:s.level,step:s.step,hist:[],n:0,since:0,miss:0,hold:0,auto:true,lock:false,manual:false,moves:[],tabs:{}}}
function cnt(arr,f){var n=0;for(var i=0;i<arr.length;i++) if(f(arr[i])) n++;return n}
function days(arr){var o={};arr.forEach(function(h){o[h.d]=1});return Object.keys(o).length}
/* r={c:correct(0/1), f:firstTry(0/1), d:"day"}; returns the move or null */
function apply(L,r,C,maxLevel){C=C||CFG;L.n++;r.n=L.n;L.hist.push(r);if(L.hist.length>C.keep) L.hist.splice(0,L.hist.length-C.keep);
  L.miss=r.c?0:(L.miss|0)+1;var held=L.hold>0;if(held) L.hold--;
  if(!L.auto||L.lock||held) return null;
  var h10=L.hist.slice(-C.win),h20=L.hist.slice(-C.lvWin),fresh=L.hist.filter(function(h){return h.n>L.since}),f10=fresh.slice(-C.win);
  var right10=cnt(h10,function(h){return h.c}),right20=cnt(h20,function(h){return h.c}),first20=cnt(h20,function(h){return h.c&&h.f});
  var mv=null,from={level:L.level,step:L.step};
  /* down first */
  if(L.miss>=C.downMissRow||(h10.length>=C.win&&right10<C.downBelow)){
    if(L.step>1) mv={kind:"stepdown",level:L.level,step:L.step-1};
    else if(L.level>0&&h20.length>=C.lvWin&&right20<C.lvDownBelow&&days(h20)>=C.lvDays) mv={kind:"leveldown",level:L.level-1,step:C.steps};
  }
  if(!mv){
    if(L.step<C.steps){if(f10.length>=C.win&&cnt(f10,function(h){return h.c})>=C.upRight&&cnt(f10,function(h){return h.c&&h.f})>=C.upFirst) mv={kind:"stepup",level:L.level,step:L.step+1}}
    else if(L.level<maxLevel&&h20.length>=C.lvWin&&right20>=C.lvUpRight&&first20>=C.lvUpFirst&&days(h20)>=C.lvDays) mv={kind:"levelup",level:L.level+1,step:1};
  }
  if(!mv) return null;
  L.level=mv.level;L.step=mv.step;L.hold=C.hold;L.miss=0;L.since=L.n;if(mv.kind==="levelup"||mv.kind==="leveldown") L.hist=[];
  mv.from=from;mv.t=r.t||now();L.moves.push({t:mv.t,k:mv.kind,from:from.level+"."+from.step,to:mv.level+"."+mv.step});if(L.moves.length>C.moves) L.moves.splice(0,L.moves.length-C.moves);
  return mv}
/* ---------------------------------------------------------------- public ladder API */
var listeners=[];
/* anonymous ladder snapshot: where each ladder stands now (level index + step), so Insights can show the level distribution */
function snapshot(lid){var def=LADDERS[lid],L=lid&&kid().ladders[lid];if(!def||!L) return;signal("snapshot",{subject:def.subject,spot:lid,level:L.level,step:L.step,kind:L.lock?"locked":L.auto?"auto":"manual",area:"site"})}
function snapshotAll(){SUBJECTS.forEach(function(s){ladder(s)});Object.keys(kid().ladders).forEach(snapshot)}
function emit(d){try{snapshot(d.ladder)}catch(e){}listeners.slice().forEach(function(f){try{f(d)}catch(e){}});try{window.dispatchEvent(new CustomEvent("spark:progress",{detail:d}))}catch(e){}renderPanelSoon()}
function ladder(id,seed){var def=LADDERS[id];if(!def) return null;var k=kid();var L=k.ladders[id];
  if(!L){L=k.ladders[id]=newLadder(def,age());if(seed&&seed.level!=null) L.level=Math.max(0,Math.min(def.levels.length-1,seed.level|0));if(seed&&seed.step) L.step=Math.max(1,Math.min(CFG.steps,seed.step));save()}return L}
function view(id){var def=LADDERS[id],L=ladder(id);if(!L) return null;var lv=def.levels[L.level];
  return {id:id,subject:def.subject,level:L.level,levelKey:lv,levelName:def.names[lv],step:L.step,steps:CFG.steps,auto:L.auto,lock:L.lock,manual:L.manual,
    text:(def.label||SUBJ_NAME[id])+": "+def.names[lv]+", step "+L.step+" of "+CFG.steps}}
function subjectOf(area,act){if(!act) return null;var t=TAGS[area+"/"+act];if(t) return t;
  /* sandbox sparks declare skills: the most common sci./math./read. prefix is the subject */
  try{var d=window.SB&&SB.sparkDefs&&SB.sparkDefs[act];if(d&&d.skills){var c={reading:0,math:0,science:0};d.skills.forEach(function(s){var p=String(s).split(".")[0];if(p==="read")c.reading++;else if(p==="math")c.math++;else if(p==="sci")c.science++});
    var best=null;SUBJECTS.forEach(function(sb){if(c[sb]&&(!best||c[sb]>c[best])) best=sb});if(best){TAGS[area+"/"+act]=best;return best}}}catch(e){}
  return null}
function report(subject,o){o=o||{};if(!LADDERS[subject]) return null;if(o.skipped){signal("skip",{area:o.area,act:o.activity,subject:subject});return null}
  var id=o.ladder&&LADDERS[o.ladder]?o.ladder:subject;var res=null,pos=null;
  [subject].concat(id!==subject?[id]:[]).forEach(function(lid){var def=LADDERS[lid],L=ladder(lid);if(o.area) L.tabs[o.area]=(L.tabs[o.area]|0)+1;
    var mv=apply(L,{c:o.correct?1:0,f:o.correct&&o.firstTry!==false?1:0,d:day(),t:now()},CFG,def.levels.length-1);
    if(lid===subject) pos={level:L.level,step:L.step};
    if(mv){signal("ladder",{subject:def.subject,act:o.activity,area:o.area,kind:mv.kind,spot:lid,level:mv.level,step:mv.step});emit({ladder:lid,subject:def.subject,kind:mv.kind,from:mv.from,to:{level:mv.level,step:mv.step},view:view(lid)})}
    if(lid===id) res=view(lid)});
  save();if(!o.silent) signal("result",{area:o.area,act:o.activity,subject:subject,ok:o.correct?1:0,first:o.firstTry?1:0,hint:o.hint?1:0,stuck:o.stuck?1:0,level:pos&&pos.level,step:pos&&pos.step});
  markProgress(o.area,o.activity);return res}
function set(id,lvl,step){var def=LADDERS[id],L=ladder(id);if(!L) return;var from={level:L.level,step:L.step};
  if(lvl!=null) L.level=Math.max(0,Math.min(def.levels.length-1,lvl|0));if(step!=null) L.step=Math.max(1,Math.min(CFG.steps,step|0));
  L.manual=true;L.hold=CFG.hold;L.miss=0;L.since=L.n;L.moves.push({t:now(),k:"parent",from:from.level+"."+from.step,to:L.level+"."+L.step});if(L.moves.length>CFG.moves) L.moves.shift();
  save();emit({ladder:id,subject:def.subject,kind:"parent",from:from,to:{level:L.level,step:L.step},view:view(id)})}
function reset(id){var def=LADDERS[id];if(!def) return;var k=kid();k.ladders[id]=newLadder(def,age());save();emit({ladder:id,subject:def.subject,kind:"reset",view:view(id)})}
/* difficulty read for tabs that already have an easier/core/stretch setting (tier 0..2):
   ladder position relative to the child's age start; parent lock in the age panel keeps the old setting */
function tierFor(area,act,fallback){try{var sub=subjectOf(area,act);if(!sub) return fallback;if(SA()&&SA().locked) return fallback;
  var L=ladder(sub);var eff=(L.level-ageBandIdx())*CFG.steps+(L.step-1);return Math.max(0,Math.min(2,eff))}catch(e){return fallback}}
/* ---------------------------------------------------------------- hidden play signals */
var Q=[],SID=rid().slice(0,12),cur=null,lastProg=now(),area0=null;
function areaNow(){if(cur&&cur.area) return cur.area;if(area0) return area0;var b=document.body&&document.body.className||"";
  if(/eg3d/.test(b)) return "egypt";if(/a3d|arctic/.test(b)) return "arctic";if(/r3d|reef/.test(b)) return "reef";if(/s3d|safari|savannah/.test(b)) return "savannah";
  try{var p=new URLSearchParams(location.search).get("planet");if(p) return p.toLowerCase()}catch(e){}return "home"}
function signal(type,o){o=o||{};var e={t:now(),type:type,area:String(o.area||areaNow()).slice(0,24),act:o.act?String(o.act).slice(0,40):(cur&&cur.act)||null,spot:o.spot?String(o.spot).slice(0,24):null};
  ["subject","ok","first","hint","stuck","ms","kind","msg","src","n","mid","fps","level","step"].forEach(function(k){if(o[k]!=null) e[k]=typeof o[k]==="string"?o[k].slice(0,120):o[k]});
  local(e);if(!D.collect) return e;Q.push(e);if(Q.length>CFG.maxQueue) Q.splice(0,Q.length-CFG.maxQueue);return e}
/* this child's own favourites and stuck spots, kept on the device for the parent panel */
function local(e){if(!e.act) return;var k=kid(),key=e.area+"/"+e.act,a=k.acts[key]||(k.acts[key]={n:0,ms:0,ok:0,bad:0,stuck:0,replay:0});
  if(e.type==="enter") a.n++;else if(e.type==="leave"&&e.ms) a.ms+=Math.min(e.ms,3600000);else if(e.type==="result"){if(e.ok) a.ok++;else a.bad++}
  else if(e.type==="stuck") a.stuck++;else if(e.type==="replay") a.replay++;save()}
function enter(area,act,spot){if(cur&&cur.act===act&&cur.area===area) return;if(cur) leave(true);
  var k=kid(),key=area+"/"+act,again=k.acts[key]&&k.acts[key].n>0;cur={area:area,act:act,t0:now(),wrongRow:0,stuck:false,done:false};lastProg=now();
  signal("enter",{area:area,act:act,spot:spot});if(again) signal("replay",{area:area,act:act})}
function leave(mid,how){if(!cur) return;var c=cur;cur=null;var ms=now()-c.t0;var midTask=!!mid&&!c.done;
  signal("leave",{area:c.area,act:c.act,ms:ms,mid:midTask?1:0,kind:how});
  if(midTask&&ms>8000&&subjectOf(c.area,c.act)) signal("stuck",{area:c.area,act:c.act,kind:"left-mid-task"})}
function markProgress(area,act){lastProg=now();if(cur&&(!act||cur.act===act)){cur.done=true;cur.wrongRow=0}}
function wrongTap(area,act){if(!cur||cur.act!==act) enter(area,act);cur.wrongRow++;signal("wrong",{area:area,act:act});
  if(cur.wrongRow===3) signal("stuck",{area:area,act:act,kind:"3-wrong",subject:subjectOf(area,act)})}
/* ---- 3D tabs: every tab logs to window.__sbxLog; watch it without touching the tabs */
var PREFIX=[["eg3d","egypt"],["a3d","arctic"],["r3d","reef"],["s3d","savannah"],["rf","savannah"],["ex","savannah"]];
function areaOfKind(k){for(var i=0;i<PREFIX.length;i++) if(k.indexOf(PREFIX[i][0])===0) return PREFIX[i][1];return null}
function onLog(o){if(!o||!o.kind) return;var k=String(o.kind),ar=areaOfKind(k);if(ar) area0=ar;
  try{
  if(/err$/.test(k)&&k!=="eg3dhomeserr") {signal("error",{area:ar,kind:k,msg:o.e||o.n||""});return}
  if(k==="eg3dstampopen") return enter("egypt","stamp");
  if(k==="eg3dbuild") return enter("egypt","pyramid-build");
  if(k==="eg3dshaduf") return enter("egypt","shaduf");
  if(k==="eg3dwatered"){if(cur&&cur.act==="shaduf"){cur.done=true;leave(false,"watered")}return}
  if(k==="eg3ddrum"){signal("enter",{area:"egypt",act:"nile-seasons"});lastProg=now();return}
  if(k==="eg3dstampmiss") return wrongTap("egypt","stamp");
  if(k==="eg3dstamp"){if(!cur||cur.act!=="stamp") enter("egypt","stamp");
    if(o.how==="right"||o.how==="skip"){report("reading",{correct:o.how==="right",firstTry:!o.miss,skipped:o.how==="skip",area:"egypt",activity:"stamp",ladder:"egypt-stamp"})}
    markProgress("egypt","stamp");leave(false,o.how);return}
  if(k==="s3dreadmiss") return wrongTap("savannah","read");
  if(k==="s3dread"){if(!cur||cur.act!=="read") enter("savannah","read");if(o.how==="right"||o.how==="skip") report("reading",{correct:o.how==="right",firstTry:!o.miss,skipped:o.how==="skip",area:"savannah",activity:"read"});markProgress("savannah","read");leave(false,o.how);return}
  if(k==="r3dsharkjudge"){if(o.verdict==="win") report("reading",{correct:true,firstTry:(o.lift|0)<=1,area:"reef",activity:"shark-letters"});else if(o.verdict==="retry") wrongTap("reef","shark-letters");return}
  if(k==="spark:start"){var sa=(window.SB&&SB.session&&SB.session.id)||area0||"sandbox";return enter(sa,o.id)}
  if(k==="spark:end"){if(cur&&cur.act===o.id){if(o.how!=="left") cur.done=true;leave(o.how==="left",o.how)}return}
  if(/skip$/.test(k)) return signal("skip",{area:ar,kind:k});
  if(k==="sparkreplay") return signal("replay",{area:ar,kind:k});
  if(o.x!=null&&o.z!=null) lastSpot=Math.round(o.x/20)+","+Math.round(o.z/20);
  lastProg=now();
  }catch(e){}}
var lastSpot=null;
(function hookLog(){var arr=window.__sbxLog||[];var orig=Array.prototype.push;
  arr.push=function(){for(var i=0;i<arguments.length;i++) onLog(arguments[i]);return orig.apply(this,arguments)};
  window.__sbxLog=arr;
  /* if a tab replaces the array, re-hook it */
  setInterval(function(){var a=window.__sbxLog;if(a&&a.push===Array.prototype.push){var p=Array.prototype.push;a.push=function(){for(var i=0;i<arguments.length;i++) onLog(arguments[i]);return p.apply(this,arguments)}}},2000)})();
/* ---- the 2D area engine and the sandbox both call SparkAge.record once per finished mission */
function wrapRecord(){var A=SA();if(!A||A.__spWrapped||!A.record) return;var orig=A.record;A.__spWrapped=true;
  A.record=function(region,mission,s){var out=orig.apply(A,arguments);try{s=s||{};var sub=subjectOf(region,mission);
    if(sub) report(sub,{correct:(s.wrong|0)<2&&(s.hints|0)<3,firstTry:!!s.firstTry,hint:(s.hints|0)>0,area:region,activity:mission});
    else signal("result",{area:region,act:mission,ok:(s.wrong|0)<2?1:0,first:s.firstTry?1:0})}catch(e){}return out}}
wrapRecord();
/* ---- possibly broken: JS errors, taps that do nothing, low frame rate */
function base(u){try{return String(u||"").split("?")[0].split("/").pop().slice(0,40)}catch(e){return ""}}
window.addEventListener("error",function(ev){try{if(ev&&ev.target&&ev.target!==window&&ev.target.tagName){signal("error",{kind:"load",src:base(ev.target.src||ev.target.href)});return}
  signal("error",{kind:"js",msg:String(ev.message||"").slice(0,120),src:base(ev.filename)+":"+(ev.lineno|0)})}catch(e){}},true);
window.addEventListener("unhandledrejection",function(ev){try{signal("error",{kind:"promise",msg:String(ev.reason&&ev.reason.message||ev.reason||"").slice(0,120)})}catch(e){}});
var lastMut=0;try{new MutationObserver(function(){lastMut=now()}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true})}catch(e){}
document.addEventListener("pointerdown",function(ev){var t=ev.target&&ev.target.closest&&ev.target.closest("button,a,[role=button],.cont,.body");if(!t||t.disabled) return;
  if(t.id==="grownUpBtn"||t.closest(".sg-ov")) return;var t0=now(),logN=(window.__sbxLog||[]).length,href=location.href;
  setTimeout(function(){if(lastMut>=t0||location.href!==href||(window.__sbxLog||[]).length!==logN) return;
    var lbl=(t.getAttribute("aria-label")||t.dataset.name||t.id||t.className||t.tagName).toString().slice(0,40);signal("deadtap",{spot:lbl})},CFG.deadTapMs)},true);
(function fps(){var n=0,t0=performance.now(),low=0,lastSent=0;function f(){n++;var t=performance.now();if(t-t0>=5000){var v=n*1000/(t-t0);n=0;t0=t;
    if(!document.hidden&&v<CFG.lowFps){low++;if(low>=2&&now()-lastSent>60000){lastSent=now();signal("lowfps",{fps:Math.round(v),spot:lastSpot})}}else low=0}requestAnimationFrame(f)}requestAnimationFrame(f)})();
/* ---- stuck by idling: inside a learning activity it counts toward the ladder; anywhere else it only earns a gentle hint */
var hintEl=null,hintT=0;
function gentleHint(){if(document.querySelector(".sg-ov")) return;if(!hintEl){hintEl=document.createElement("div");hintEl.className="spg-hint";hintEl.setAttribute("role","status");
  hintEl.style.cssText="position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482000;background:#10243ee6;color:#fff;border:1px solid #f6c445;border-radius:14px;padding:8px 14px;font:600 15px/1.3 system-ui,sans-serif;pointer-events:none;max-width:80vw;text-align:center";document.body.appendChild(hintEl)}
  hintEl.textContent="Need a hand? Try tapping something that glows, or pick a new place to explore.";hintEl.hidden=false;clearTimeout(hintT);hintT=setTimeout(function(){hintEl.hidden=true},5000)}
var idleSent=0;
setInterval(function(){if(document.hidden) return;var idle=now()-lastProg;if(idle<CFG.idleStuckMs||now()-idleSent<CFG.idleStuckMs) return;idleSent=now();
  if(cur&&subjectOf(cur.area,cur.act)&&!cur.stuck){cur.stuck=true;var sub=subjectOf(cur.area,cur.act);signal("stuck",{kind:"idle",subject:sub});
    report(sub,{correct:false,firstTry:false,stuck:true,area:cur.area,activity:cur.act,silent:true})}
  else if(cur||document.querySelector("canvas")){signal("stuck",{kind:"idle-nav",spot:lastSpot});gentleHint()}},5000);
["pointerdown","keydown"].forEach(function(t){document.addEventListener(t,function(){if(!cur) lastProg=now()},true)});
/* ---- batching: every 30 s, and on pagehide with sendBeacon */
function apiBase(){var a=window.SPARK_CONFIG&&window.SPARK_CONFIG.api;return typeof a==="string"&&/^https:\/\/[a-z0-9.-]+(:[0-9]+)?$/i.test(a)?a:""}
/* Pages migration (11/22): same-origin as before when SPARK_CONFIG.api is ""/unset; cross-origin posts go as text/plain (a CORS "simple" request, no preflight; the server parses the body as JSON either way) */
var URL_=apiBase()+"/api/signals",CT=apiBase()?"text/plain":"application/json";
function payload(evts){return JSON.stringify({v:1,dev:D.dev,sid:SID,age:ageBandIdx(),ua:innerWidth<700?"phone":"wide",events:evts})}
function flush(beacon){if(!D.collect){Q=[];return Promise.resolve(0)}if(!Q.length) return Promise.resolve(0);var evts=Q.splice(0,CFG.maxBatch),body=payload(evts);
  if(beacon&&navigator.sendBeacon){try{if(navigator.sendBeacon(URL_,new Blob([body],{type:CT}))) return Promise.resolve(204)}catch(e){}}
  try{return fetch(URL_,{method:"POST",headers:{"content-type":CT},body:body,keepalive:true}).then(function(r){SP.lastStatus=r.status;return r.status}).catch(function(){return 0})}catch(e){return Promise.resolve(0)}}
setInterval(function(){flush(false)},CFG.batchMs);
window.addEventListener("pagehide",function(){if(cur) leave(true,"pagehide");saveNow();flush(true)});
document.addEventListener("visibilitychange",function(){if(document.hidden){saveNow();flush(true)}});
/* Allen 11/15 item 8: a kid's OWN age band raised (new-kid pick changed later, or a grown-up in the panel) -> any of that kid's ladders
   below the new band's start goes up to that start; nothing is ever lowered by this. Untouched ladders follow the age as before. */
window.addEventListener("spark:agechange",function(e){var dt=e&&e.detail||{},k=kid();Object.keys(k.ladders).forEach(function(id){var L=k.ladders[id],def=LADDERS[id];if(!def) return;var s=startOf(def,age());
    if(!L.manual&&!L.moves.length&&!L.n){L.level=s.level;L.step=s.step;return}
    if(dt.bandRaised&&(L.level<s.level)){L.level=s.level;L.step=s.step;L.raised=(L.raised||0)+1}});save();renderPanelSoon()});
/* ---------------------------------------------------------------- parent panel section (behind the existing hold-to-open gate) */
function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var AREA_NAME={egypt:"Egypt",sahara:"Sahara",reef:"Reef",arctic:"Arctic",savannah:"Savannah",sandbox:"Sandbox"};
var MOVE_TXT={stepup:"\u25B2 step up",stepdown:"\u25BC step down",levelup:"\u25B2 level up",leveldown:"\u25BC level down",parent:"set by grown-up"};
function ago(t){var m=Math.round((now()-t)/60000);return m<1?"just now":m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" d ago"}
function ladderHtml(id){var def=LADDERS[id],v=view(id),L=ladder(id);var tabs=Object.keys(L.tabs).map(function(a){return esc(AREA_NAME[a]||a)}).join(", ")||"none yet";
  var mv=L.moves.slice(-3).reverse().map(function(m){return esc(MOVE_TXT[m.k]||m.k)+" ("+ago(m.t)+")"}).join(" · ")||"no changes yet";
  var lvOpts=def.levels.map(function(k,i){return '<option value="'+i+'"'+(i===L.level?" selected":"")+'>'+esc(def.names[k])+'</option>'}).join("");
  var stOpts=[1,2,3].map(function(s){return '<option value="'+s+'"'+(s===L.step?" selected":"")+'>Step '+s+'</option>'}).join("");
  return '<div class="spg-lad" data-lad="'+id+'"><div class="sg-band"><b>'+esc(v.text)+'</b>'+(L.lock?' · locked':L.auto?' · automatic':' · manual')+
   '<br><span class="sg-note">Fed by: '+tabs+' · '+(L.n|0)+' answers<br>Recent: '+mv+'</span></div>'+
   '<div class="sg-row"><label>Level</label><select data-k="level" aria-label="'+esc(SUBJ_NAME[id]||def.label)+' level">'+lvOpts+'</select><select data-k="step" aria-label="'+esc(SUBJ_NAME[id]||def.label)+' step">'+stOpts+'</select></div>'+
   '<div class="sg-row"><label>Automatic up and down</label><input class="sg-sw" type="checkbox" data-k="auto"'+(L.auto?" checked":"")+'></div>'+
   '<div class="sg-row"><label>Lock level and step</label><input class="sg-sw" type="checkbox" data-k="lock"'+(L.lock?" checked":"")+'></div>'+
   '<div class="sg-row"><span class="sg-lbl sg-note">Start again from the age-based level</span><button type="button" class="sg-b alt" data-k="reset">Reset</button></div></div>'}
function topList(k,f,n){return Object.keys(k.acts).map(function(key){return {key:key,a:k.acts[key]}}).filter(function(x){return f(x.a)>0}).sort(function(x,y){return f(y.a)-f(x.a)}).slice(0,n)}
function nameAct(key){var p=key.split("/");return esc((AREA_NAME[p[0]]||p[0])+": "+p.slice(1).join("/"))}
function sectionHtml(){var k=kid();
  var fav=topList(k,function(a){return a.n*2+a.replay*3+Math.round(a.ms/60000)},4),stk=topList(k,function(a){return a.stuck},4);
  return '<h3>Learning ladders</h3><div class="sg-note">Only grown-ups see this. Each subject moves up or down by itself, a step at a time, based on recent answers. Children never see levels, steps or scores.</div>'+
   SUBJECTS.map(ladderHtml).join("")+(kid().ladders["egypt-stamp"]?ladderHtml("egypt-stamp"):"")+
   '<h3>Play notes (this device only)</h3><div class="sg-note"><b>Favorites:</b> '+(fav.length?fav.map(function(x){return nameAct(x.key)}).join(", "):"none yet")+
   '<br><b>Stuck spots:</b> '+(stk.length?stk.map(function(x){return nameAct(x.key)+" ("+x.a.stuck+")"}).join(", "):"none yet")+'</div>'+
   '<div class="sg-row"><label for="spgCollect">Share anonymous play data <span class="sg-note">(counts and timings only, no names or recordings; helps find stuck spots and bugs)</span></label><input id="spgCollect" class="sg-sw" type="checkbox"'+(D.collect?" checked":"")+'></div>'}
function sectionBind(){var c=document.getElementById("spgCollect");if(c) c.onchange=function(e){D.collect=!!e.target.checked;if(!D.collect) Q=[];saveNow()};
  Array.prototype.forEach.call(document.querySelectorAll(".spg-lad"),function(box){var id=box.dataset.lad;
    box.addEventListener("change",function(e){var k=e.target.dataset.k,L=ladder(id);if(k==="level") set(id,+e.target.value,null);else if(k==="step") set(id,null,+e.target.value);
      else if(k==="auto"){L.auto=!!e.target.checked;save();renderPanelSoon()}else if(k==="lock"){L.lock=!!e.target.checked;save();renderPanelSoon()}});
    box.addEventListener("click",function(e){if(e.target.dataset&&e.target.dataset.k==="reset") reset(id)})})}
var panelHooked=false,rpT=0;
function hookPanel(){var A=SA();if(panelHooked||!A||!A.addPanelSection) return;panelHooked=true;A.addPanelSection(sectionHtml,sectionBind)}
function renderPanelSoon(){clearTimeout(rpT);rpT=setTimeout(function(){if(!document.querySelector(".sg-ov .spg-lad")) return;
  /* SparkAge re-renders its whole panel (with this section) when a setting is re-applied; adaptive(same value) changes nothing else */
  try{var A=SA();A.adaptive(A._profile().adaptive)}catch(e){}},60)}
/* ---------------------------------------------------------------- export */
var SP={v:1,cfg:CFG,subjects:SUBJECTS.slice(),ladders:LADDERS,tags:TAGS,
  tag:function(activity,subject){if(SUBJECTS.indexOf(subject)>=0) TAGS[activity]=subject},
  subjectOf:subjectOf,report:report,get:view,set:set,reset:reset,
  auto:function(id,v){var L=ladder(id);if(L){L.auto=!!v;save();renderPanelSoon()}},
  lock:function(id,v){var L=ladder(id);if(L){L.lock=!!v;save();renderPanelSoon()}},
  ensure:function(id,seed){ladder(id,seed);return view(id)},
  tierFor:tierFor,on:function(f){listeners.push(f);return function(){listeners=listeners.filter(function(x){return x!==f})}},
  enter:enter,snapshot:snapshotAll,leave:function(how){leave(how==="left",how)},signal:signal,flush:flush,
  collect:function(v){if(v==null) return !!D.collect;D.collect=!!v;if(!D.collect) Q=[];saveNow()},
  get queue(){return Q.slice()},get device(){return D.dev},
  _engine:{apply:apply,newLadder:newLadder,CFG:CFG},_data:function(){return JSON.parse(JSON.stringify(D))}};
window.SparkProgress=SP;
function boot(){wrapRecord();hookPanel()}
setTimeout(function(){try{snapshotAll()}catch(e){}},4000);
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);boot();
})();
