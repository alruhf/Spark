/* Spark family accounts (acc2, Allen 11/13-11/21). PREVIEW ONLY: turns on only when /api/accounts-config says so (that endpoint
   answers {on:false} on production, which has no SB_* variables), so production and signed-out guest play run exactly as before.
   Supabase project spark-accounts (migration 20261115100000_spark_accounts.sql, applied by Allen 11/16). Plain fetch, no SDK.
   Grown-up area (reached only by press-and-hold): sign in / create account (email + password), consent checkboxes with Review
   buttons, family list (max 5 kids, enforced by the DB trigger), add a player (grown-up types an optional nickname, taps a picture),
   clear a PIN, remove a player, sign out.
   Kid screens (TAP ONLY, never typing): one-time age picker + one-time explorer look at creation (stored on kid_profiles: age_band,
   look, look_done; start age also in the save and in start_age when the follow-up SQL is applied), the kid picks their own secret code
   (tap pad: shapes for 4-9, numbers for 10+; set once via a 2-minute kid-scoped token from /api/kid-token; checked server-side by
   spark_check_kid_pin, 5 wrong tries lock it for 5 minutes), "Who's playing?" picker.
   Progress: every per-kid save key (localStorage spark* {profiles:{pid}} / {kids:{pid}}) is snapshotted into kid_progress via
   spark_save_progress (newer save wins) a few seconds after any change and when the page hides; loaded on profile pick; failed saves
   stay marked and retry when the device is back online. Every spoken line is an Ava clip (SparkVoice). */
(function(){"use strict";if(window.SparkAccounts) return;
var AUTH="sparkAuthV1",ACC="sparkAccountsV1",SKEY="sparkFamKid",WKEY="sparkWorldV1",CONSENT_VERSION="v1-2026-11-21";
var LINES={pick:"Pick your secret code!",again:"Tap it again to be sure!",saved:"That's your secret code!",oops:"Oops! Let's try that again.",enter:"Tap your secret code!",
  locked:"Let's wait a little, then try again.",who:"Who's playing? Tap your picture!",age:"How old are you? Tap your age!",look:"Make your explorer! Tap the colors you like, then tap Let's go!",go:"Let's go, explorer!"};
var PICS={fox:{img:"animal_fox",label:"Fox"},seal:{img:"animal_seal",label:"Seal"},husky:{img:"sbx/husky_1",label:"Husky"},walrus:{img:"animal_walrus",label:"Walrus"},bear:{img:"animal_polarbear",label:"Polar bear"}};
var SKIP=/^(sparkAuthV1|sparkAccountsV1|sparkFamKid|sparkTestfast.*|.*\.bak|sparkSbxDev|sparkEgypt3dOn|sparkReef3dOn)$/;
var C=null,_si=Storage.prototype.setItem,quiet=0;
function log(k,o){try{(window.__sbxLog=window.__sbxLog||[]).push(Object.assign({t:Math.round(performance.now()),kind:"acc_"+k},o||{}))}catch(e){}}
function say(t){try{window.SparkVoice&&SparkVoice.say(t,{owner:"accounts",kind:"accounts"})}catch(e){}}
function J(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
function W(k,v){quiet++;try{_si.call(localStorage,k,JSON.stringify(v))}catch(e){}finally{quiet--}}
function acc(){var a=J(ACC);if(!a||typeof a!=="object") a={};a.kids=a.kids||{};return a}
function picSrc(p){return "areas/arctic/img/"+((PICS[p]&&PICS[p].img)||"animal_fox")+".webp"}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
/* ------------------------------------------------------------------ auth (Supabase GoTrue over fetch) */
function sess(){var s=J(AUTH);return s&&s.access_token&&s.refresh_token?s:null}
function keepSess(j){var s={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||(Math.floor(Date.now()/1000)+(j.expires_in||3600)),user:{id:j.user&&j.user.id,email:j.user&&j.user.email}};W(AUTH,s);return s}
function authCall(path,body){return fetch(C.url+"/auth/v1/"+path,{method:"POST",headers:{"content-type":"application/json",apikey:C.key},body:JSON.stringify(body)})
  .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok) throw new Error(j.msg||j.error_description||j.message||("http "+r.status));return j})})}
var refreshing=null;
function token(){var s=sess();if(!s) return Promise.reject(new Error("not signed in"));if(s.expires_at-90>Date.now()/1000) return Promise.resolve(s.access_token);
  if(!refreshing) refreshing=authCall("token?grant_type=refresh_token",{refresh_token:s.refresh_token}).then(function(j){refreshing=null;return keepSess(j).access_token},
    function(e){refreshing=null;if(/invalid|not found|revoked|expired/i.test(String(e.message))){localStorage.removeItem(AUTH);if(C) requireSignIn("Your sign-in expired. Please sign in again.")}throw e});return refreshing}
function signIn(email,pw){return authCall("token?grant_type=password",{email:email,password:pw}).then(keepSess)}
function signUp(email,pw){return authCall("signup",{email:email,password:pw}).then(function(j){if(j&&j.access_token){keepSess(j);return {session:true}}return {confirm:true}})}
/* ------------------------------------------------------------------ REST + RPC (every call carries the parent's token; RLS decides) */
function rest(method,path,body,extra,tok){return (tok?Promise.resolve(tok):token()).then(function(t){var h={"content-type":"application/json",apikey:C.key,authorization:"Bearer "+t};for(var k in extra||{}) h[k]=extra[k];
  return fetch(C.url+"/rest/v1/"+path,{method:method,headers:h,body:body==null?undefined:JSON.stringify(body),keepalive:!!(extra&&extra._ka)})}).then(function(r){
  return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null}catch(e){}if(!r.ok){var er=new Error((j&&j.message)||("http "+r.status));er.code=j&&j.code;er.status=r.status;throw er}return j})})}
function rpc(name,args,tok,ka){return rest("POST","rpc/"+name,args||{},ka?{_ka:1}:null,tok)}
function listKids(){return rpc("spark_list_kids").then(function(r){return Array.isArray(r)?r:[]})}
function parentRow(){return rest("GET","parents?select=id,consent_at,consent_version").then(function(r){return r&&r[0]||null})}
/* ------------------------------------------------------------------ local per-kid saves */
function world(){var d=J(WKEY);if(!d||d.schema!=="sparkWorld"){d={schema:"sparkWorld",v:1,savedAt:0,active:null,profiles:{},legacy:{imported:[],at:0}}}d.profiles=d.profiles||{};return d}
function snapshot(pid){var keys={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(!/^spark[A-Z]/.test(k)||SKIP.test(k)) continue;var o=J(k);if(!o||typeof o!=="object") continue;
    var top={};for(var f in o){if(f!=="profiles"&&f!=="kids"&&(typeof o[f]!=="object"||o[f]===null)) top[f]=o[f]}
    if(o.profiles&&o.profiles[pid]) keys[k]={m:"profiles",v:o.profiles[pid],t:top};else if(o.kids&&o.kids[pid]) keys[k]={m:"kids",v:o.kids[pid],t:top}}
  return keys}
function applySnap(pid,keys){quiet++;try{Object.keys(keys||{}).forEach(function(k){if(SKIP.test(k)||!/^spark[A-Z]/.test(k)) return;var e=keys[k];if(!e||!e.m) return;var o=J(k);
    if(!o||typeof o!=="object"){o={};var t=e.t||{};for(var f in t) o[f]=t[f]}o[e.m]=o[e.m]||{};o[e.m][pid]=e.v;_si.call(localStorage,k,JSON.stringify(o))})}finally{quiet--}}
function dropLocal(pid){quiet++;try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(!/^spark[A-Z]/.test(k)||SKIP.test(k)) continue;var o=J(k);if(!o||typeof o!=="object") continue;var ch=false;
    if(o.profiles&&o.profiles[pid]){delete o.profiles[pid];ch=true}if(o.kids&&o.kids[pid]){delete o.kids[pid];ch=true}if(o.active===pid){o.active=null;ch=true}if(ch) _si.call(localStorage,k,JSON.stringify(o))}}finally{quiet--}}
var REP={k:6,e:8,u:11,t:13};
function bandOf(a){a=Math.round(Number(a)||6);return a<=6?"k":a<=9?"e":a<=12?"u":"t"}
/* make sure the local kid for a remote kid exists, carries the one-time age + look, and never shows the guest new-kid flow */
function ensureLocal(kid,startAge){var a=acc(),m=a.kids[kid.id]||{};var d=world();var pid=m.pid;
  if(!pid||!d.profiles[pid]){if(!pid){var n=1;while(d.profiles["p"+n]||Object.keys(a.kids).some(function(r){return a.kids[r].pid==="p"+n})) n++;pid="p"+n}
    var age=startAge||REP[kid.age_band]||6;d.profiles[pid]={pic:PICS[kid.avatar]?kid.avatar:"fox",age:age,created:Date.now(),wallet:{coins:0,ledger:[]},kit:{},wear:[],wishes:[],regions:{},learn:{skills:{}}}}
  var p=d.profiles[pid];if(kid.age_band){p.ageBand=kid.age_band;if(!p.age||bandOf(p.age)!==kid.age_band) p.age=startAge||REP[kid.age_band]}
  p.lookDone=true;delete p.setupPending;p.family=1;d.savedAt=Date.now();W(WKEY,d);
  if(kid.look&&typeof kid.look==="object"){var wd=J("sparkWardrobeV1")||{v:1,profiles:{}};wd.profiles=wd.profiles||{};var wp=wd.profiles[pid]=wd.profiles[pid]||{owned:{},worn:{}};wp.look=kid.look;W("sparkWardrobeV1",wd)}
  m.pid=pid;a.kids[kid.id]=m;W(ACC,a);return pid}
function setActive(pid){var d=world(),a=acc();if(d.active&&!Object.keys(a.kids).some(function(r){return a.kids[r].pid===d.active})) {a.guestActive=d.active;W(ACC,a)}d.active=pid;W(WKEY,d);
  try{window.SparkAge&&SparkAge.refreshKid&&SparkAge.refreshKid("kid")}catch(e){}}
/* ------------------------------------------------------------------ progress sync */
function activeRemote(){var r=null;try{r=sessionStorage.getItem(SKEY)}catch(e){}var a=acc();return r&&a.kids[r]&&a.kids[r].pid?r:null}
var timers={},inflight={};
function markDirty(){var r=activeRemote();if(!r||!sess()) return;var a=acc(),m=a.kids[r];m.changedAt=Date.now();m.dirty=true;W(ACC,a);schedule(r)}
function schedule(r,ms){clearTimeout(timers[r]);timers[r]=setTimeout(function(){push(r)},ms==null?4000:ms)}
function payload(r){var a=acc(),m=a.kids[r];if(!m||!m.pid) return null;var keys=snapshot(m.pid);if(!keys[WKEY]) return null;
  return {data:{v:2,keys:keys,startAge:m.startAge||null,startAgeAt:m.startAgeAt||null,pid:m.pid},saved_at:new Date(m.changedAt||Date.now()).toISOString()}}
function push(r,ka){if(!C||!sess()) return Promise.resolve(false);if(inflight[r]) {schedule(r,3000);return inflight[r]}var a=acc(),m=a.kids[r];if(!m||m.needsPull) return Promise.resolve(false);var x=payload(r);if(!x) return Promise.resolve(false);
  var stamp=m.changedAt||Date.now();var big=JSON.stringify(x.data).length>60000;
  inflight[r]=rpc("spark_save_progress",{p_kid:r,p_data:x.data,p_saved_at:x.saved_at},null,ka&&!big).then(function(res){var row=Array.isArray(res)?res[0]:res;var b=acc(),n=b.kids[r];if(n){n.syncedAt=Date.parse(row&&row.updated_at)||stamp;if((n.changedAt||0)<=stamp) n.dirty=false;W(ACC,b)}
      inflight[r]=null;log("push",{ok:1,applied:!!(row&&row.applied)});return true},function(e){inflight[r]=null;log("push",{ok:0,err:String(e.message).slice(0,60)});return false});return inflight[r]}
function pushAll(ka){var a=acc();return Promise.all(Object.keys(a.kids).filter(function(r){return a.kids[r].dirty}).map(function(r){return push(r,ka)}))}
function pull(r){return rest("GET","kid_progress?select=data,updated_at&kid_id=eq."+r).then(function(rows){return rows&&rows[0]||null})}
/* load-on-pick, newer save wins: the server copy replaces the local one unless this device has newer unsaved play */
function loadKid(kid){var a=acc(),m=a.kids[kid.id]||{};return pull(kid.id).then(function(row){var b=acc(),n=b.kids[kid.id]||{},sAt=row?Date.parse(row.updated_at):0;
    var start=row&&row.data&&row.data.startAge||n.startAge||null;var pid=ensureLocal(kid,start);b=acc();n=b.kids[kid.id];
    if(row&&row.data&&row.data.keys&&(!n.dirty||n.needsPull||sAt>=(n.changedAt||0))){applySnap(pid,row.data.keys);ensureLocal(kid,start);b=acc();n=b.kids[kid.id];n.changedAt=sAt;n.syncedAt=sAt;n.dirty=false;
      if(row.data.startAge){n.startAge=row.data.startAge;n.startAgeAt=row.data.startAgeAt}log("restore",{at:row.updated_at})}
    else if(!row){n.dirty=true;n.changedAt=n.changedAt||Date.now()}
    delete n.needsPull;W(ACC,b);if(n.dirty) schedule(kid.id,500);return {pid:pid,restored:!!row,offline:false}},
  function(e){var pid=ensureLocal(kid,m.startAge);if(!m.pid){var b=acc();b.kids[kid.id].needsPull=true;W(ACC,b)}log("pullfail",{err:String(e.message).slice(0,60)});return {pid:pid,restored:false,offline:true}})}
/* ------------------------------------------------------------------ UI */
var css="body.sf-open .spk-askme,body.sf-open #sparkCompanion,body.sf-open .sf-chip{visibility:hidden!important}.sf-ov>:first-child{margin-top:auto}.sf-ov>:last-child{margin-bottom:auto}"+
 ".sf-ov{position:fixed;inset:0;z-index:2147483300;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:clamp(10px,2.2vh,22px);overflow:auto;"+
 "background:radial-gradient(ellipse at 50% 30%,#2b4f7e 0%,#0b1a30 75%);color:#fff;font:700 20px/1.25 system-ui,sans-serif;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));touch-action:manipulation;-webkit-user-select:none;user-select:none}"+
 ".sf-ttl{font-size:clamp(26px,4.4vh,42px);text-align:center;text-shadow:0 2px 8px #0008;margin:0}.sf-sub{font-size:clamp(16px,2.2vh,20px);font-weight:600;opacity:.9;text-align:center;max-width:36em;margin:0}"+
 ".sf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(clamp(130px,20vw,200px),260px));justify-content:center;gap:clamp(10px,2vw,24px);width:min(1100px,96vw)}"+
 ".sf-kid{display:flex;flex-direction:column;align-items:center;gap:8px;border:5px solid #fff;border-radius:28px;background:linear-gradient(#bfe4ff,#7cc0f2);color:#10243e;padding:14px 8px;cursor:pointer;box-shadow:0 8px 22px #0007;min-height:170px;font:800 clamp(20px,3vh,28px)/1.1 system-ui}"+
 ".sf-kid img{width:clamp(90px,14vh,150px);height:clamp(90px,14vh,150px);object-fit:cover;border-radius:50%;background:#fff;border:4px solid #10243e}.sf-kid:active{transform:scale(.96)}.sf-kid[disabled]{opacity:.35;cursor:default}"+
 ".sf-kid.on{outline:6px solid #3ee07a;outline-offset:3px}"+
 ".sf-ages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(10px,2vw,22px);width:min(860px,94vw)}@media(max-width:560px){.sf-ages{grid-template-columns:repeat(3,minmax(0,1fr))}}"+
 ".sf-age{min-height:clamp(84px,11vh,130px);border:5px solid #fff;border-radius:26px;background:linear-gradient(#ffe7a3,#ffc23a);color:#10243e;font:900 clamp(36px,6vh,60px)/1 system-ui;cursor:pointer;box-shadow:0 8px 22px #0007}.sf-age:active{transform:scale(.95)}"+
 ".sf-go{font:800 clamp(22px,3.4vh,32px)/1 system-ui,sans-serif;color:#10243e;background:#3ee07a;border:5px solid #fff;border-radius:999px;padding:16px 34px;cursor:pointer;box-shadow:0 8px 22px #0007;min-height:64px}"+
 ".sf-go[disabled]{opacity:.45;cursor:default}.sf-alt{font:700 18px/1 system-ui;color:#fff;background:#ffffff26;border:3px solid #fff8;border-radius:999px;padding:12px 22px;cursor:pointer;min-height:52px}"+
 ".sf-look{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,40px);flex-wrap:wrap}.sf-prev{width:clamp(130px,26vh,320px);height:clamp(140px,28vh,340px)}@media(orientation:portrait){.sf-look{flex-direction:column}}"+
 ".sf-rows{display:flex;flex-direction:column;gap:14px}.sf-row{display:flex;align-items:center;gap:clamp(6px,1.4vw,10px);background:#ffffff1f;border-radius:999px;padding:8px 12px}"+
 ".sf-sw{width:clamp(44px,min(6.4vh,12.5vw),62px);height:clamp(44px,min(6.4vh,12.5vw),62px);flex:0 0 auto;border-radius:50%;border:4px solid #fff8;cursor:pointer;padding:0;box-shadow:0 3px 8px #0006}.sf-sw.on{border-color:#fff;outline:5px solid #3ee07a;outline-offset:2px}"+
 ".sf-card{background:#f4f8fc;color:#10243e;border-radius:22px;padding:clamp(16px,3vw,28px);width:min(620px,94vw);box-shadow:0 10px 30px #0008;font:600 18px/1.35 system-ui;display:flex;flex-direction:column;gap:14px;-webkit-user-select:text;user-select:text}"+
 ".sf-card h2{margin:0;font-size:26px}.sf-card input[type=email],.sf-card input[type=password],.sf-card input[type=text]{font:600 20px system-ui;padding:12px 14px;border-radius:12px;border:2px solid #9fb2c8;width:100%;box-sizing:border-box}"+
 ".sf-card .sf-btn{font:800 20px system-ui;padding:14px 20px;border-radius:14px;border:0;background:#1d6fd6;color:#fff;cursor:pointer;min-height:56px}.sf-card .sf-btn.alt{background:#e3ebf5;color:#10243e}.sf-card .sf-btn.warn{background:#fde2e2;color:#8a1c1c}.sf-card .sf-btn[disabled]{opacity:.45;cursor:default}"+
 ".sf-btns{display:flex;gap:10px;flex-wrap:wrap}.sf-btns>*{flex:1 1 auto}.sf-msg{min-height:1.3em;color:#a3261f;font-weight:700}.sf-msg.ok{color:#18794e}"+
 ".sf-chk{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:#fff;border:2px solid #d5e0ec}.sf-chk input{width:34px;height:34px;flex:0 0 auto;accent-color:#1d6fd6}.sf-chk label{flex:1 1 auto}"+
 ".sf-chk .sf-btn{min-height:48px;padding:10px 16px;font-size:17px}.sf-fam{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:#fff;border:2px solid #d5e0ec;flex-wrap:wrap}"+
 ".sf-fam img{width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid #10243e}.sf-fam .sf-n{flex:1 1 8em;font-weight:800}.sf-fam .sf-btn{min-height:48px;padding:8px 14px;font-size:16px}"+
 ".sf-pics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}@media(max-width:520px){.sf-pics{grid-template-columns:repeat(3,minmax(0,1fr))}}"+
 ".sf-pic{border:4px solid #d5e0ec;border-radius:18px;background:#fff;padding:6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font:700 15px system-ui;color:#10243e;min-height:96px}"+
 ".sf-pic img{width:64px;height:64px;border-radius:50%;object-fit:cover}.sf-pic.on{border-color:#3ee07a;box-shadow:0 0 0 4px #3ee07a55}.sf-pic[disabled]{opacity:.3;cursor:default}"+
 ".sf-rev{position:fixed;inset:0;z-index:2147483400;background:#0009;display:flex;align-items:center;justify-content:center;padding:14px}.sf-rev .sf-card{max-height:86vh;overflow:auto}"+
 ".sf-hold{position:relative;overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}.sf-hold *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;pointer-events:none}.top .tools,.top .tools *,.sf-chip,.sf-chip *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.sf-chip.sf-chip-r{left:auto;right:max(8px,env(safe-area-inset-right))}.sf-chip.sf-chip-up{bottom:calc(max(8px,env(safe-area-inset-bottom)) + 118px)}.sf-hold i{position:absolute;left:0;bottom:0;height:5px;width:0;background:#3ee07a}.sf-hold.holding i{width:100%;transition:width 3s linear}"+
 ".sf-chip{position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));z-index:2147482000;display:flex;align-items:center;gap:8px;background:#10243ee6;color:#fff;border:3px solid #fff;border-radius:999px;padding:4px 14px 4px 4px;font:800 16px system-ui;cursor:pointer;min-height:52px;box-shadow:0 4px 14px #0007}"+
 ".sf-chip img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#fff}body.spark-safari .sf-chip,html.sbx-boot .sf-chip{display:none}"+
 ".sf-pad{display:grid;gap:clamp(10px,1.6vh,16px)}.sf-pad button{width:clamp(70px,10vh,96px);height:clamp(70px,10vh,96px);border-radius:20px;border:4px solid #fff;background:#10243e;color:#fff;font:800 clamp(30px,5vh,44px) system-ui;cursor:pointer}.sf-pad button:active{transform:scale(.94)}.sf-pad6{gap:clamp(14px,2.4vh,24px)}.sf-pad6 button{width:clamp(96px,min(15vh,27vw),150px);height:clamp(96px,min(15vh,27vw),150px);border-radius:28px;border-width:5px}"+
 ".sf-dots{display:flex;gap:14px;min-height:64px;align-items:center}";
function addCss(){if(document.getElementById("sf-css")) return;var s=document.createElement("style");s.id="sf-css";s.textContent=css;document.head.appendChild(s)}
function el(t,c,h){var e=document.createElement(t);if(c) e.className=c;if(h!=null) e.innerHTML=h;return e}
function tap(b,fn,gap){var t=0;gap=gap==null?400:gap;b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(Date.now()-t<gap) return;t=Date.now();fn(e)});return b}
function btn(cls,html,fn,label,gap){var b=el("button",cls,html);b.type="button";if(label) b.setAttribute("aria-label",label);return tap(b,fn,gap)}
var OV=null;function overlay(name){addCss();document.body.classList.add("sf-open");if(!OV){OV=el("div","sf-ov");OV.setAttribute("role","dialog");document.body.appendChild(OV);
    ["pointerdown","pointerup","click","keydown","touchstart","wheel"].forEach(function(t){OV.addEventListener(t,function(e){e.stopPropagation()})})}
  OV.innerHTML="";OV.dataset.screen=name;OV.setAttribute("aria-label",name);log("screen",{s:name});return OV}
function closeOv(){if(OV){OV.remove();OV=null}document.body.classList.remove("sf-open")}
/* press-and-hold 3 s (grown-ups only, same rule as the grown-up button) */
function holdBtn(cls,html,fn){var b=el("button",cls+" sf-hold",html+"<i></i>");b.type="button";var t=null;
  function stop(){clearTimeout(t);b.classList.remove("holding")}
  b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();b.classList.add("holding");t=setTimeout(function(){stop();fn()},3000)});
  ["pointerup","pointerleave","pointercancel"].forEach(function(n){b.addEventListener(n,stop)});/* video fix (Allen 2:58): a long press on Android opened the copy/select bubble on the word and the screen got stuck - no text selection, no callout, no context menu on the hold button */["contextmenu","selectstart","dragstart"].forEach(function(n){b.addEventListener(n,function(e){e.preventDefault()})});b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation()});
  b.setAttribute("aria-label","Grown-ups: press and hold");return b}
/* ---- grown-up: sign in */
function screenSignIn(note,required){var ov=overlay("signin"),c=el("div","sf-card");ov.dataset.required=required?"1":"";
  c.innerHTML='<h2>Grown-ups: family account</h2><div>Sign in to save each child\u2019s progress on any device. Kids never type: you set things up here, they tap.</div>'+
   '<label>Email<input type="email" autocomplete="username" data-f="email"></label><label>Password<input type="password" autocomplete="current-password" data-f="pw" minlength="8"></label><div class="sf-msg">'+esc(note||"")+'</div>';
  var bs=el("div","sf-btns"),msg=c.querySelector(".sf-msg");function v(f){return c.querySelector('[data-f="'+f+'"]').value.trim()}
  function busy(on){[].forEach.call(bs.querySelectorAll("button"),function(b){b.disabled=on})}
  bs.appendChild(btn("sf-btn","Sign in",function(){var e=v("email"),p=c.querySelector('[data-f="pw"]').value;if(!e||!p){msg.textContent="Enter your email and password.";return}busy(true);msg.className="sf-msg";msg.textContent="Signing in\u2026";
    signIn(e,p).then(function(){log("signin",{ok:1});afterSignIn()},function(er){busy(false);msg.textContent=/confirm/i.test(er.message)?"Please confirm your email first (check your inbox), then sign in.":"That email and password didn\u2019t match. Try again."})}));
  bs.appendChild(btn("sf-btn alt","Create account",function(){var e=v("email"),p=c.querySelector('[data-f="pw"]').value;if(!/^\S+@\S+\.\S+$/.test(e)||p.length<8){msg.textContent="Use a real email and a password of at least 8 characters.";return}busy(true);msg.textContent="Creating\u2026";
    signUp(e,p).then(function(r){busy(false);if(r.session){afterSignIn();return}msg.className="sf-msg ok";msg.textContent="Almost done: we sent a confirmation email. Tap the link in it, then come back and sign in."},function(er){busy(false);msg.textContent=String(er.message||"Could not create the account.")})}));
  c.appendChild(bs);if(!required) c.appendChild(btn("sf-btn alt","Back to playing",function(){closeOv()}));ov.appendChild(c)}
/* Allen 11/21 6:38 PM: on the accounts preview a grown-up MUST sign in first: no close, no skip, no guest play */
function requireSignIn(note){try{sessionStorage.removeItem(SKEY)}catch(e){}var x=document.querySelector(".sf-chip");if(x) x.remove();screenSignIn(note,true)}
function afterSignIn(){parentRow().then(function(p){if(!p||!p.consent_at) screenConsent();else screenFamily()},function(){screenFamily()})}
/* ---- grown-up: consent (in-app checkboxes + Review buttons; DRAFT wording until Allen supplies final text) */
var CONSENT=[{id:"guardian",label:"I am this child\u2019s parent or legal guardian, and I am 18 or older.",review:"Spark Studio accounts belong to a grown-up. Only a parent or legal guardian who is 18 or older may create one and add children to it. Children never create accounts, sign in, or type anything."},
 {id:"data",label:"I agree Spark Studio may save, for each child I add: a nickname I choose, an age, a character look, a secret code (stored scrambled) and game progress.",review:"What we keep for each child: the nickname you type (optional), the age your child taps once, the character colors they pick, their secret code stored only as a one-way scramble, and their game progress (areas, missions, coins, treasures). We do not collect a child\u2019s real name, email, photo, voice recording, or location. Up to 5 children per family. You can clear a secret code or remove a child at any time from this grown-ups area, which deletes that child\u2019s saved progress."},
 {id:"privacy",label:"I have read the Privacy notice and Terms.",review:"Privacy notice (draft): your family\u2019s data is visible only to your account. It is stored with our database provider (Supabase) and used only to run Spark Studio and save progress. We never sell it or show ads based on it. To delete your account and all data, contact Spark Studio. Terms (draft): Spark Studio is provided as is for family learning and play. Final wording to be supplied before launch."}];
function screenConsent(){var ov=overlay("consent"),c=el("div","sf-card");c.innerHTML='<h2>Before you add your kids</h2><div>Please tick all three. Tap Review to read each one.</div>';
  var go=btn("sf-btn","Agree and continue",function(){go.disabled=true;var ver=CONSENT_VERSION+"|"+CONSENT.map(function(x){return x.id}).join("+");
    rpc("spark_set_consent",{p_version:ver}).then(function(){log("consent",{ok:1});
      rest("POST","parent_consents",CONSENT.map(function(x){return {item:x.id,version:CONSENT_VERSION}}),{prefer:"return=minimal"}).catch(function(){}); /* only after the follow-up SQL; ignored until then */
      screenFamily()},function(e){go.disabled=false;msg.textContent="Could not save. Check the connection and try again."})});go.disabled=true;
  CONSENT.forEach(function(x){var r=el("div","sf-chk");r.innerHTML='<input type="checkbox" id="sfc-'+x.id+'"><label for="sfc-'+x.id+'">'+esc(x.label)+'</label>';
    r.appendChild(btn("sf-btn alt","Review",function(){review(x)}));c.appendChild(r)});
  var msg=el("div","sf-msg");c.appendChild(msg);
  c.addEventListener("change",function(){go.disabled=CONSENT.some(function(x){return !c.querySelector("#sfc-"+x.id).checked})});
  var bs=el("div","sf-btns");bs.appendChild(go);bs.appendChild(btn("sf-btn alt","Sign out",function(){signOut()}));c.appendChild(bs);ov.appendChild(c)}
function review(x){var r=el("div","sf-rev"),c=el("div","sf-card");c.innerHTML='<h2>Review</h2><div><b>'+esc(x.label)+'</b></div><div>'+esc(x.review)+'</div>';
  c.appendChild(btn("sf-btn","Close",function(){r.remove()}));r.appendChild(c);r.dataset.review=x.id;(OV||document.body).appendChild(r)}
/* ---- grown-up: family list */
function screenFamily(){var ov=overlay("family"),c=el("div","sf-card"),s=sess();c.innerHTML='<h2>Your family</h2><div class="sf-sub" style="color:#3b4f66">Signed in as '+esc(s&&s.user&&s.user.email)+'</div><div class="sf-list">Loading\u2026</div><div class="sf-msg"></div>';ov.appendChild(c);
  var list=c.querySelector(".sf-list"),msg=c.querySelector(".sf-msg");
  listKids().then(function(kids){list.innerHTML="";if(!kids.length) list.appendChild(el("div","","No players yet. Add up to 5."));
    kids.forEach(function(k){var r=el("div","sf-fam");r.dataset.kid=k.id;r.innerHTML='<img alt="" src="'+picSrc(k.avatar)+'"><span class="sf-n">'+esc(k.nickname||PICS[k.avatar]&&PICS[k.avatar].label||k.avatar)+
        '<br><small style="font-weight:600">'+(k.age_band?"Ages "+({k:"4-6",e:"7-9",u:"10-12",t:"13+"})[k.age_band]:"")+' \u00b7 '+(k.has_pin?"secret code set":"no secret code")+'</small></span>';
      if(k.has_pin) r.appendChild(btn("sf-btn alt","Clear code",function(){rpc("spark_clear_kid_pin",{p_kid:k.id}).then(screenFamily)}));
      else r.appendChild(btn("sf-btn alt","Kid picks a code",function(){kidPickPin(k).then(screenFamily)}));
      r.appendChild(btn("sf-btn warn","Remove",function(){if(!confirm("Remove "+(k.nickname||k.avatar)+" and all of their saved progress? This can\u2019t be undone.")) return;
        rest("DELETE","kid_profiles?id=eq."+k.id) /* kid_progress goes with it (ON DELETE CASCADE) */.then(function(){var a=acc();if(a.kids[k.id]){dropLocal(a.kids[k.id].pid);delete a.kids[k.id];W(ACC,a)}screenFamily()},function(){msg.textContent="Could not remove. Try again."})}));
      list.appendChild(r)});
    var bs=el("div","sf-btns"),add=btn("sf-btn","Add a player",function(){screenAddKid(kids)});if(kids.length>=5){add.disabled=true;msg.className="sf-msg ok";msg.textContent="5 players is the most for one family."}
    bs.appendChild(add);var play=btn("sf-btn","Who\u2019s playing? \u2192",function(){screenPicker()});if(!kids.length) play.disabled=true;bs.appendChild(play);c.appendChild(bs);
    var b2=el("div","sf-btns");b2.appendChild(btn("sf-btn alt","Sign out",function(){signOut()}));c.appendChild(b2)},
   function(e){list.textContent="Could not load your family. Check the connection.";var b2=el("div","sf-btns");b2.appendChild(btn("sf-btn alt","Sign out",function(){signOut()}));b2.appendChild(btn("sf-btn alt","Try again",screenFamily));c.appendChild(b2)})}
/* ---- grown-up: add a player (types an optional nickname, taps a picture) -> then the kid's one-time age + look + code */
function screenAddKid(kids){var used={};kids.forEach(function(k){used[k.avatar]=1});var ov=overlay("addkid"),c=el("div","sf-card"),pick=null;
  c.innerHTML='<h2>Add a player</h2><label>Nickname (optional, grown-up types it)<input type="text" maxlength="16" data-f="nick" placeholder="e.g. Sam"></label><div>Tap a picture for this player:</div>';
  var g=el("div","sf-pics");Object.keys(PICS).forEach(function(p){var b=btn("sf-pic",'<img alt="" src="'+picSrc(p)+'"><span>'+PICS[p].label+'</span>',function(){pick=p;[].forEach.call(g.children,function(x){x.classList.toggle("on",x===b)});next.disabled=false},PICS[p].label);
    b.dataset.pic=p;if(used[p]) b.disabled=true;g.appendChild(b)});c.appendChild(g);var msg=el("div","sf-msg");c.appendChild(msg);
  var next=btn("sf-btn","Next: hand it to your child",function(){var nick=c.querySelector('[data-f="nick"]').value.trim();if(nick&&!/^[A-Za-z0-9][A-Za-z0-9 .'-]{0,15}$/.test(nick)){msg.textContent="Nickname: letters and numbers only, up to 16.";return}
    next.disabled=true;var s=sess();rest("POST","kid_profiles",{parent_id:s.user.id,avatar:pick,nickname:nick||null},{prefer:"return=minimal"}).then(listKids).then(function(ks){var k=ks.filter(function(x){return x.avatar===pick})[0];log("addkid",{ok:1});kidCreate(k)},
      function(e){next.disabled=false;msg.textContent=/kid_limit/.test(e.message)?"5 players is the most for one family.":"Could not add the player. Try again."})});next.disabled=true;
  var bs=el("div","sf-btns");bs.appendChild(next);bs.appendChild(btn("sf-btn alt","Back",screenFamily));c.appendChild(bs);ov.appendChild(c)}
/* ---- KID (tap only): one-time age, one-time look, own secret code */
function kidCreate(k){var ov=overlay("handoff");ov.innerHTML='<img alt="" src="'+picSrc(k.avatar)+'" style="width:clamp(120px,22vh,200px);height:clamp(120px,22vh,200px);border-radius:50%;border:6px solid #fff;background:#fff;object-fit:cover">'+
   '<p class="sf-ttl">'+esc(k.nickname||"Hi, explorer!")+'</p>';ov.appendChild(btn("sf-go","\u25B6 Let\u2019s start",function(){stepAge(k)},"Let's start"))}
function stepAge(k){var ov=overlay("age");ov.appendChild(el("p","sf-ttl",'How old are you?'));var g=el("div","sf-ages");g.setAttribute("role","group");
  [3,4,5,6,7,8,9,10,11,12,13].forEach(function(a){g.appendChild(btn("sf-age",a===13?"13+":String(a),function(){var a2=acc(),m=a2.kids[k.id]||{};m.startAge=a;m.startAgeAt=new Date().toISOString();a2.kids[k.id]=m;W(ACC,a2);
    k.age_band=bandOf(a);log("age",{age:a,band:k.age_band});rest("PATCH","kid_profiles?id=eq."+k.id,{age_band:k.age_band},{prefer:"return=minimal"}).catch(function(){});
    rest("PATCH","kid_profiles?id=eq."+k.id,{start_age:a,start_age_set_at:m.startAgeAt},{prefer:"return=minimal"}).catch(function(){}); /* only after the follow-up SQL */
    stepLook(k)},"Age "+(a===13?"13 or more":a))).dataset.age=a});ov.appendChild(g);say(LINES.age)}
function face(look){var L=window.SparkKidLook,c=function(p){return (L&&look&&look[p]&&L.colorOf(p,look[p]))||(L?L.OPTS[p][0].c:"#c88")};
  return '<svg class="sf-prev" viewBox="0 0 200 220" aria-hidden="true"><circle cx="100" cy="100" r="74" fill="'+c("skin")+'"/><path d="M24 96C26 20 174 20 176 96c-20-30-132-34-152 0z" fill="'+c("hair")+'"/>'+
   '<ellipse cx="72" cy="108" rx="14" ry="16" fill="#fff"/><ellipse cx="128" cy="108" rx="14" ry="16" fill="#fff"/><circle cx="72" cy="110" r="9" fill="'+c("eyes")+'"/><circle cx="128" cy="110" r="9" fill="'+c("eyes")+'"/>'+
   '<path d="M78 142q22 18 44 0" stroke="#10243e" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'}
function stepLook(k){var L=window.SparkKidLook,ov=overlay("look"),look={};if(!L){finishCreate(k,null);return}["skin","hair","eyes"].forEach(function(p){look[p]=L.OPTS[p][0].id});
  ov.appendChild(el("p","sf-ttl","Make your explorer!"));var wrap=el("div","sf-look"),prev=el("div","",face(look)),rows=el("div","sf-rows");wrap.appendChild(prev);wrap.appendChild(rows);ov.appendChild(wrap);
  ["skin","hair","eyes"].forEach(function(part){var r=el("div","sf-row");r.setAttribute("aria-label",part);L.OPTS[part].forEach(function(o,i){var sw=btn("sf-sw"+(look[part]===o.id?" on":""),"",function(){look[part]=o.id;
      [].forEach.call(r.children,function(x){x.classList.toggle("on",x===sw)});prev.innerHTML=face(look);log("look",{part:part,id:o.id})},part+" colour "+(i+1));sw.style.background=o.c;sw.dataset.part=part;sw.dataset.lid=o.id;r.appendChild(sw)});rows.appendChild(r)});
  ov.appendChild(btn("sf-go","Let\u2019s go \u2192",function(){finishCreate(k,L.clean?L.clean(look):look)},"Let's go"));say(LINES.look)}
function finishCreate(k,look){k.look=look;k.look_done=true;var f={look_done:true};if(look) f.look=look;if(k.age_band) f.age_band=k.age_band;
  rest("PATCH","kid_profiles?id=eq."+k.id,f,{prefer:"return=minimal"}).catch(function(){}).then(function(){var a=acc();ensureLocal(k,a.kids[k.id]&&a.kids[k.id].startAge);return kidPickPin(k)}).then(function(){say(LINES.go);screenPicker()})}
function kidPickPin(k){return fetch("/api/kid-token",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+(sess()||{}).access_token},body:JSON.stringify({kid:k.id})}).then(function(r){return r.ok?r.json():null})
   .catch(function(){return null}).then(function(j){if(!j||!j.token) return false;return pinPad({mode:"set",band:k.age_band,skip:true,set:function(code,kind){return rpc("spark_kid_set_pin",{p_kid:k.id,p_pin:code,p_kind:kind},j.token).then(function(r){log("pinset",{ok:r===true});return r===true})}})})}
/* the kid's tap-only code pad. band k/e -> shapes+colours; u/t -> numbers. resolves true (set/ok) or false (skipped/back/locked) */
var SH={c:'<circle cx="24" cy="24" r="17"/>',s:'<rect x="8" y="8" width="32" height="32" rx="4"/>',t:'<path d="M24 6l19 34H5z"/>',h:'<path d="M24 42S6 30 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 25-18 25z"/>'};
var COL={1:"#ff5a5f",2:"#2fb3ff",3:"#3ee07a",4:"#ffd23a"};
/* Allen 11/21 8:24 PM: younger kids get 6 big picture tiles (still a 4-tap code). Each tile = one unique picture + one unique colour.
   Keys stay inside the server's shape alphabet ([csth][1-4], spark_kid_set_pin p_kind 'shapes'), so no SQL change: the key is only an id. */
var TILES=[{k:"c1",n:"red circle",c:"#ff4b4b",p:SH.c},{k:"s2",n:"blue square",c:"#2f8cff",p:SH.s},{k:"t3",n:"green triangle",c:"#2fd15f",p:SH.t},
 {k:"h4",n:"yellow heart",c:"#ffd23a",p:SH.h},{k:"c2",n:"purple star",c:"#b45cff",p:'<path d="M24 4l5.6 12.6 13.7 1.4-10.3 9.2 3 13.5L24 33.8 12 40.7l3-13.5L4.7 18l13.7-1.4z"/>'},
 {k:"s3",n:"orange moon",c:"#ff8a1f",p:'<path d="M30 5a19 19 0 1 0 13 30A16 16 0 0 1 30 5z"/>'}];
var TILE={};TILES.forEach(function(t){TILE[t.k]=t});
function tileSvg(k,size){var t=TILE[k];return t?'<svg width="'+size+'" height="'+size+'" viewBox="0 0 48 48" fill="'+t.c+'" aria-hidden="true">'+t.p+'</svg>':""}
function pinPad(o){o=o||{};var band=o.band||(window.SparkAge?SparkAge.band:"k"),shapes=band==="k"||band==="e",kind=shapes?"shapes":"digits";
  return new Promise(function(done){var ov=overlay(o.mode==="check"?"pincheck":"pinset");if(o.pic) ov.appendChild(el("div","",'<img alt="" src="'+picSrc(o.pic)+'" style="width:clamp(80px,12vh,120px);height:clamp(80px,12vh,120px);border-radius:50%;border:5px solid #fff;background:#fff;object-fit:cover">'));
    var ttl=el("p","sf-ttl",o.mode==="check"?"Tap your secret code":"Pick your secret code");ov.appendChild(ttl);var dots=el("div","sf-dots"),grid=el("div","sf-pad");ov.appendChild(dots);ov.appendChild(grid);
    var info=el("p","sf-sub","");ov.appendChild(info);var cur=[],first=null,busy=false;
    function draw(){dots.innerHTML=cur.map(function(x){return shapes?tileSvg(x,54):'<b style="font-size:46px">\u25CF</b>'}).join("")+
      new Array(5-cur.length).join('<b style="font-size:46px;opacity:.3">\u25CB</b>')}
    var list=shapes?TILES.map(function(t){return t.k}):["1","2","3","4","5","6","7","8","9","0"];
    grid.style.gridTemplateColumns="repeat(3,auto)";if(shapes) grid.classList.add("sf-pad6");
    list.forEach(function(k,i){var b=btn("",shapes?tileSvg(k,"72%"):k,function(){press(k)},shapes?TILE[k].n:"number "+k,80); /* the same key twice in a row (e.g. 1-1-2-2) must count */b.dataset.key=k;if(!shapes&&k==="0") b.style.gridColumn="2";grid.appendChild(b)});
    function finish(v){done(v)}
    function press(k){if(busy||cur.length>=4) return;cur.push(k);draw();if(cur.length<4) return;var code=cur.join("");busy=true;setTimeout(function(){cur=[];draw();busy=false},450);
      if(o.mode==="check"){busy=true;(o.check?o.check(code):Promise.resolve(null)).then(function(r){busy=false;if(r&&r.ok){finish(true);return}
          if(r&&r.locked_until){say(LINES.locked);info.textContent="\u23F3 Let\u2019s wait a little, then try again.";ov.dataset.locked="1";setTimeout(function(){finish(false)},1600)}else{say(LINES.oops);info.textContent="\u274C Oops! Try again.";ov.dataset.wrong=String((+ov.dataset.wrong||0)+1)}},
        function(){busy=false;info.textContent="No connection. Try again.";});return}
      if(first===null){first=code;ttl.textContent="Tap it again to be sure";say(LINES.again);return}
      if(code!==first){first=null;ttl.textContent="Pick your secret code";say(LINES.oops);info.textContent="\u274C Oops! Let\u2019s try that again.";return}
      (o.set?o.set(code,kind):Promise.resolve(false)).then(function(ok){if(ok){say(LINES.saved);info.textContent="\u2705 That\u2019s your secret code!";setTimeout(function(){finish(true)},900)}else finish(false)},function(){finish(false)})}
    var bs=el("div","sf-btns");bs.appendChild(btn("sf-alt",o.mode==="check"?"\u2190 Back":"No code for now",function(){finish(false)},o.mode==="check"?"Back":"No code for now"));ov.appendChild(bs);
    draw();say(o.mode==="check"?LINES.enter:LINES.pick)})}
/* ---- KID: who's playing? */
var reloadOnPick=true;
function screenPicker(fromBoot){reloadOnPick=!fromBoot;var ov=overlay("picker");ov.appendChild(el("p","sf-ttl","Who\u2019s playing?"));var g=el("div","sf-grid");ov.appendChild(g);
  var gb=holdBtn("sf-alt","Grown-ups (hold)",function(){screenFamily()});
  listKids().then(function(kids){if(!kids.length){screenFamily();return}kids.forEach(function(k){var b=btn("sf-kid",'<img alt="" src="'+picSrc(k.avatar)+'"><span>'+esc(k.nickname||PICS[k.avatar]&&PICS[k.avatar].label||"Explorer")+'</span>',function(){pickKid(k)},k.nickname||k.avatar);b.dataset.kid=k.id;g.appendChild(b)});
    say(LINES.who)},function(){g.appendChild(el("p","sf-sub","Can\u2019t reach the family list right now."));var a=acc(),d=world();Object.keys(a.kids).forEach(function(r){var p=d.profiles[a.kids[r].pid];if(!p) return;
      g.appendChild(btn("sf-kid",'<img alt="" src="'+picSrc(p.pic)+'"><span>'+esc(a.kids[r].name||"Explorer")+'</span>',function(){startKid(r,a.kids[r].pid)}))})});
  var bs=el("div","sf-btns");bs.appendChild(gb);ov.appendChild(bs)}
function pickKid(k){var go=function(){loadKid(k).then(function(r){var a=acc();a.kids[k.id].name=k.nickname||(PICS[k.avatar]&&PICS[k.avatar].label);W(ACC,a);startKid(k.id,r.pid)})};
  if(!k.has_pin){go();return}
  pinPad({mode:"check",band:k.age_band,pic:k.avatar,check:function(code){return rpc("spark_check_kid_pin",{p_kid:k.id,p_pin:code}).then(function(r){r=Array.isArray(r)?r[0]:r;log("pincheck",{ok:!!(r&&r.ok),locked:!!(r&&r.locked_until)});return r})}})
   .then(function(ok){if(ok) go();else screenPicker()})}
function startKid(remote,pid){try{sessionStorage.setItem(SKEY,remote)}catch(e){}setActive(pid);log("start",{pid:pid});
  if(reloadOnPick){quiet++;location.reload();return}closeOv();say(LINES.go);chip()}
function chip(){var r=activeRemote();var old=document.querySelector(".sf-chip");if(old) old.remove();if(!r) return;var a=acc(),m=a.kids[r],p=world().profiles[m.pid];if(!p) return;addCss();
  var b=btn("sf-chip",'<img alt="" src="'+picSrc(p.pic)+'"><span>'+esc(m.name||"Explorer")+' \u00b7 switch</span>',function(){pushAll().then(screenPicker)},"Switch player");document.body.appendChild(b);placeChip();if(!chipT)chipT=setInterval(placeChip,800)}
/* video fix (Allen 2:45): Spark and "Ask me" sit bottom-left on the world map and covered the switch chip - when they overlap, the chip moves to the right (or up) */
var chipT=0;function placeChip(){var b=document.querySelector(".sf-chip");if(!b) return;var hit=function(){var A=b.getBoundingClientRect();return [].slice.call(document.querySelectorAll("#sparkCompanion,.spk-askme")).some(function(e){var r=e.getBoundingClientRect(),st=getComputedStyle(e);if(r.width<2||st.visibility==="hidden"||st.display==="none"||st.opacity==="0") return false;return !(r.right<=A.left||r.left>=A.right||r.bottom<=A.top||r.top>=A.bottom)})};
  b.classList.remove("sf-chip-r","sf-chip-up");if(!hit()) return;b.classList.add("sf-chip-r");if(!hit()) return;b.classList.add("sf-chip-up");if(!hit()) return;b.classList.remove("sf-chip-r")}
function signOut(){return pushAll().then(function(){var a=acc(),d=world();if(Object.keys(a.kids).some(function(r){return a.kids[r].dirty})&&!confirm("Some play hasn\u2019t reached the cloud yet (no connection). Sign out anyway and lose it on this device?")) return;Object.keys(a.kids).forEach(function(r){dropLocal(a.kids[r].pid)});var g=a.guestActive;W(ACC,{kids:{}});
    var d2=world();if(g&&d2.profiles[g]){d2.active=g;W(WKEY,d2)}var s=sess();try{sessionStorage.removeItem(SKEY)}catch(e){}
    if(s) fetch(C.url+"/auth/v1/logout",{method:"POST",headers:{apikey:C.key,authorization:"Bearer "+s.access_token}}).catch(function(){});localStorage.removeItem(AUTH);log("signout",{});location.reload()})}
/* ------------------------------------------------------------------ boot */
function openFamily(){if(!C) return;if(!sess()) requireSignIn();else afterSignIn()}
window.SparkAccounts={enabled:function(){return !!C},openFamily:openFamily,picker:function(){return C&&sess()?screenPicker():null},pushAll:pushAll,snapshot:snapshot,pinPad:pinPad,LINES:LINES,
  _state:function(){var a=acc();return {on:!!C,signedIn:!!sess(),active:activeRemote(),kids:Object.keys(a.kids).length}}};
function panelHtml(){if(!C) return "";var s=sess();return '<h3>Family account</h3><div class="sg-row"><span class="sg-lbl">'+(s?"Signed in: "+esc(s.user&&s.user.email):"Save each kid\u2019s progress on any device")+
  '</span><button type="button" class="sg-b" data-sf-open="1">'+(s?"Manage family":"Sign in")+'</button></div>'}
function bind(){[].forEach.call(document.querySelectorAll("[data-sf-open]"),function(b){b.addEventListener("click",function(){try{SparkAge.closePanel()}catch(e){}openFamily()})})}
function familyBtn(){if(document.getElementById("sfFamilyBtn")) return;var tools=document.querySelector(".top .tools");if(!tools) return;addCss();
  var b=holdBtn("","\uD83D\uDC6A Family",function(){openFamily()});b.id="sfFamilyBtn";b.title="Grown-ups: press and hold";tools.appendChild(b)}
function boot(){fetch("/api/accounts-config",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(j){
  if(!j||!j.on||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(j.url||"")||!j.key) return; /* production / guest: nothing changes */
  C={url:j.url,key:j.key};log("on",{});
  Storage.prototype.setItem=function(k,v){var r=_si.apply(this,arguments);try{if(this===window.localStorage&&!quiet&&/^spark[A-Z]/.test(k)&&!SKIP.test(k)) markDirty()}catch(e){}return r};
  try{window.SparkAge&&SparkAge.addPanelSection(panelHtml,bind)}catch(e){}familyBtn();
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden") pushAll(true)});window.addEventListener("pagehide",function(){pushAll(true)});
  window.addEventListener("online",function(){var a=acc(),r=activeRemote();if(r&&a.kids[r]&&a.kids[r].needsPull){listKids().then(function(ks){var k=ks.filter(function(x){return x.id===r})[0];if(k) loadKid(k)})}else pushAll()});
  setInterval(function(){if(navigator.onLine!==false) pushAll()},60000);
  if(!sess()){requireSignIn();return}
  token().then(function(){if(activeRemote()){chip();var a=acc();if(Object.keys(a.kids).some(function(r){return a.kids[r].dirty})) pushAll();return}screenPicker(true)},function(){/* expired or unusable sign-in: sign in again (never guest play) */requireSignIn("Please sign in again.")})})}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);else boot();
})();
