/* Spark Sandbox engine v1 (built 2026-10-20T01:02Z from sbx-src/core) */
/* ---- sbx-src/core/00-boot.js */
/* Spark Sandbox engine (window.SparkSandbox). Phase 1 pilot (Arctic). Spec: Spark-Sandbox-Redesign.md §10.
   Plain concatenated IIFEs, no bundler (tool/build-sbx.sh -> site/sbx.js). Nothing here touches areas2.js or its storage keys. */
(function(){
"use strict";
if(window.SparkSandbox&&window.SparkSandbox.v) return;
var SB=window.SparkSandbox={v:1,V:"1",BASE:"areas/",regions:{},sparkDefs:{},session:null,_ev:{}};
var U=SB.u={};
U.$=function(s,e){return (e||document).querySelector(s)};
U.$$=function(s,e){return [].slice.call((e||document).querySelectorAll(s))};
U.el=function(tag,cls,html){var e=document.createElement(tag);if(cls) e.className=cls;if(html!=null) e.innerHTML=html;return e};
U.btn=function(cls,label,html){var b=U.el("button",cls,html);b.type="button";b.setAttribute("aria-label",label);return b};
U.sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
U.clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
U.mod=function(a,n){return ((a%n)+n)%n};
U.esc=function(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
U.reduced=function(){return !!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)};
U.SA=function(){return window.SparkAge&&window.SparkAge.v>=2?window.SparkAge:null};
U.age=function(){var A=U.SA();return A?A.age:(Number(localStorage.getItem("sparkAge"))||6)};
U.bandOf=function(a){return a<=6?"k":a<=9?"e":a<=12?"u":"t"};
U.band=function(){var A=U.SA();return A?A.keyFor(A.age):U.bandOf(U.age())};
U.rules=function(b){var A=U.SA();b=b||U.band();if(A) return A.rules(b);var k=b==="k";return {band:b,minTargetPx:k?76:38,maxChoices:k?2:b==="e"?3:4,scary:k?"none":"told",autoAssist:k,timed:!k,readingNeeded:!k}};
U.atLeast=function(b){var O=["k","e","u","t"];return O.indexOf(U.band())>=O.indexOf(b)};
U.pick=function(o,b){if(o==null) return "";if(typeof o!=="object") return o;b=b||U.band();var F={k:"keut",e:"ekut",u:"uetk",t:"tuek"}[b];
  for(var i=0;i<4;i++){var v=o[F[i]];if(v!=null) return v}return ""};
U.fill=function(s,vars){return String(s).replace(/\{(\w+)\}/g,function(m,k){return vars&&vars[k]!=null?vars[k]:m})};
U.dev=function(){try{return localStorage.getItem("sparkSbxDev")==="1"||/[?&]sbxdev=1/.test(location.search)}catch(e){return false}};
/* test/evidence log: every spoken line, sound, coin and learning moment, with page time */
window.__sbxLog=window.__sbxLog||[];
U.log=function(kind,d){var o={t:Math.round(performance.now()),kind:kind};if(d) for(var k in d) o[k]=d[k];window.__sbxLog.push(o);if(window.__sbxLog.length>3000) window.__sbxLog.splice(0,500);return o};
SB.on=function(e,f){(SB._ev[e]=SB._ev[e]||[]).push(f);return function(){SB._ev[e]=(SB._ev[e]||[]).filter(function(g){return g!==f})}};
SB.emit=function(e,d){(SB._ev[e]||[]).slice().forEach(function(f){try{f(d)}catch(err){try{console.error(err)}catch(x){}}})};
U.rect=function(n){var r=n.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2}};
U.inside=function(x,y,r,p){p=p||0;return x>=r.l-p&&x<=r.r+p&&y>=r.t-p&&y<=r.b+p};
/* one AudioContext for clips and sounds (unlocked by the tap that opened the region; iOS needs that) */
SB.ac=function(){if(window.S&&window.S.voice===false) return null;var a=window.__sbxAC;
  if(!a){try{a=window.__sbxAC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){window.__sbxAC=a=null}}
  if(a&&a.state==="suspended"){try{a.resume()}catch(e){}}return a||null};
function tone(fr,dur,type,vol,gap,slide){var a=SB.ac();if(!a) return;var t=a.currentTime;gap=gap||.09;
  fr.forEach(function(f,i){var o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t+i*gap);if(slide) o.frequency.exponentialRampToValueAtTime(f*slide,t+i*gap+dur);
    g.gain.setValueAtTime(0,t+i*gap);g.gain.linearRampToValueAtTime(vol||.07,t+i*gap+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*gap+dur);
    o.connect(g);g.connect(a.destination);o.start(t+i*gap);o.stop(t+i*gap+dur+.05)})}
function noise(dur,f0,f1,vol){var a=SB.ac();if(!a) return;var n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  var s=a.createBufferSource();s.buffer=b;var fl=a.createBiquadFilter();fl.type="bandpass";fl.Q.value=1.2;fl.frequency.setValueAtTime(f0,a.currentTime);fl.frequency.exponentialRampToValueAtTime(f1,a.currentTime+dur);
  var g=a.createGain();g.gain.value=vol||.25;s.connect(fl);fl.connect(g);g.connect(a.destination);s.start()}
U.sfx=function(n){U.log("sfx",{n:n});try{
  if(n==="ok") tone([523,659,784],.35,"sine",.07);
  else if(n==="happy") tone([660,880,990],.22,"sine",.06,.07);
  else if(n==="woof"){tone([210],.16,"sawtooth",.05,0,.55);noise(.16,900,300,.18)}
  else if(n==="wag") tone([520,620,520,620],.08,"triangle",.035,.07);
  else if(n==="coin") tone([1318,1760],.16,"sine",.07,.06);
  else if(n==="win") tone([523,659,784,1047],.45,"sine",.08,.11);
  else if(n==="pop") tone([700,990],.12,"sine",.05);
  else if(n==="click") tone([1400,900],.06,"square",.025);
  else if(n==="splash"){noise(.35,2400,300,.3);tone([420,260],.2,"sine",.04,.06)}
  else if(n==="plop") tone([300,180],.15,"sine",.06,.05);
  else if(n==="thunk") tone([160,110],.18,"triangle",.09,.05);
  else if(n==="crunch") noise(.18,3000,1200,.2);
  else if(n==="shutter"){noise(.05,4000,3000,.25);tone([1800,900],.06,"square",.03,.05)}
  else if(n==="munch") tone([300,240,300,240],.08,"square",.03,.08);
  else if(n==="whoosh") noise(.4,500,1800,.15);
  else if(n==="bump") tone([140,90],.2,"triangle",.1,.05);
  else if(n==="no") tone([300,240],.2,"triangle",.04,.08);
}catch(e){}};
/* fx */
U.floatUp=function(x,y,glyph,size){var s=U.el("i","sbx-fx",glyph||"\u2764\uFE0F");s.style.fontSize=(size||34)+"px";document.body.appendChild(s);
  if(!s.animate||U.reduced()){setTimeout(function(){s.remove()},600);return}
  var an=s.animate([{transform:"translate3d("+x+"px,"+y+"px,0) scale(.5)",opacity:0},{transform:"translate3d("+x+"px,"+(y-40)+"px,0) scale(1.15)",opacity:1,offset:.3},{transform:"translate3d("+x+"px,"+(y-130)+"px,0) scale(1)",opacity:0}],{duration:1300,easing:"ease-out"});an.onfinish=function(){s.remove()}};
U.burst=function(x,y,n,glyphs){n=n||10;glyphs=glyphs||["\u2728","\u2B50","\u2728"];if(U.reduced()) return;
  for(var i=0;i<n;i++){var s=U.el("i","sbx-fx",glyphs[i%glyphs.length]);document.body.appendChild(s);var a=Math.random()*6.283,d=40+Math.random()*90,tx=Math.cos(a)*d,ty=Math.sin(a)*d-30;
    var an=s.animate([{transform:"translate3d("+x+"px,"+y+"px,0) scale(.3)",opacity:1},{transform:"translate3d("+(x+tx)+"px,"+(y+ty)+"px,0) scale(1.2)",opacity:1,offset:.6},{transform:"translate3d("+(x+tx*1.2)+"px,"+(y+ty+40)+"px,0) scale(.6)",opacity:0}],{duration:900+Math.random()*400,easing:"ease-out"});
    an.onfinish=(function(q){return function(){q.remove()}})(s)}};
U.anim=function(node,name,ms){if(!node) return;node.classList.remove(name);void node.offsetWidth;node.classList.add(name);clearTimeout(node["_t"+name]);node["_t"+name]=setTimeout(function(){node.classList.remove(name)},ms||900)};
})();

/* ---- sbx-src/core/10-store.js */
/* World state: localStorage.sparkWorldV1 (spec §10.4). One versioned document; per-child profiles; never keyed by age band.
   No timestamp drives gameplay: savedAt/created are for backups only. Old keys (sparkAreasV3, sparkSafariV1, sparkStationPackV1) are only read. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,KEY="sparkWorldV1",BAK="sparkWorldV1.bak",CUR=1,MAXB=200*1024;
var MIGRATIONS=[null]; /* MIGRATIONS[n] upgrades v n -> n+1; none yet (v1 is the first) */
var doc=null,saveT=0;
function blank(){return {schema:"sparkWorld",v:CUR,savedAt:0,active:null,profiles:{},legacy:{imported:[],at:0}}}
function read(){try{var t=localStorage.getItem(KEY);return t?JSON.parse(t):null}catch(e){return null}}
function migrate(d){if(!d||d.schema!=="sparkWorld") return blank();
  if((d.v|0)<CUR){try{localStorage.setItem(BAK,JSON.stringify(d))}catch(e){}
    for(var v=d.v|0;v<CUR;v++){if(MIGRATIONS[v]) d=MIGRATIONS[v](d)||d;d.v=v+1}}
  d.profiles=d.profiles||{};d.legacy=d.legacy||{imported:[],at:0};return d}
var Store=SB.store={
  KEY:KEY,
  load:function(){if(!doc) doc=migrate(read())||blank();return doc},
  doc:function(){return Store.load()},
  reload:function(){doc=null;return Store.load()},
  profiles:function(){var d=Store.load();return Object.keys(d.profiles).map(function(id){var p=d.profiles[id];return {id:id,pic:p.pic,age:p.age}})},
  profile:function(){var d=Store.load();return d.active&&d.profiles[d.active]||null},
  newProfile:function(pic,age){var d=Store.load(),n=1;while(d.profiles["p"+n]) n++;var id="p"+n;
    d.profiles[id]={pic:pic,age:age,created:Date.now(),wallet:{coins:0,ledger:[]},kit:{},wear:[],wishes:[],regions:{},learn:{skills:{}}};
    /* Allen 11/15 items 3+7: a brand-new kid gets the new-kid flow (age band + make your explorer) once; existing saves never have this flag */
    d.profiles[id].setupPending=1;d.active=id;Store.save(true);try{window.SparkAge&&SparkAge.refreshKid&&SparkAge.refreshKid("kid")}catch(e){}return id},
  setActive:function(id){var d=Store.load();if(d.profiles[id]){d.active=id;Store.save(true);try{window.SparkAge&&SparkAge.refreshKid&&SparkAge.refreshKid("kid")}catch(e){}}},
  region:function(id,init){var p=Store.profile();if(!p) return null;var r=p.regions[id];
    if(!r){r=p.regions[id]={v:1,seed:0,day:1,season:"winter",introSeen:false,spot:0,ents:{},journal:{},badge:{},sparks:{},flags:{}};if(init) init(r,p)}
    r.ents=r.ents||{};r.journal=r.journal||{};r.badge=r.badge||{};r.sparks=r.sparks||{};r.flags=r.flags||{};return r},
  /* debounced 500 ms after any change (spec: save system) */
  save:function(now){clearTimeout(saveT);if(now) return write();saveT=setTimeout(write,500)},
  flush:function(){clearTimeout(saveT);write()},
  _size:function(){try{return (localStorage.getItem(KEY)||"").length}catch(e){return 0}}
};
function guard(d){ /* size guard: trim each ledger to the last 50 entries and drop journal duplicates, nothing else */
  Object.keys(d.profiles).forEach(function(id){var p=d.profiles[id];if(p.wallet&&p.wallet.ledger&&p.wallet.ledger.length>50) p.wallet.ledger=p.wallet.ledger.slice(-50);
    Object.keys(p.regions||{}).forEach(function(r){var j=p.regions[r].journal||{};Object.keys(j).forEach(function(k){j[k]=j[k].filter(function(x,i,a){return a.indexOf(x)===i})})})})}
function write(){if(!doc) return;doc.savedAt=Date.now();var t=JSON.stringify(doc);
  if(t.length>MAXB){guard(doc);t=JSON.stringify(doc)}
  try{localStorage.setItem(KEY,t)}catch(e){guard(doc);try{localStorage.setItem(KEY,JSON.stringify(doc))}catch(e2){}}
  SB.emit("saved",{bytes:t.length})}
window.addEventListener("pagehide",function(){if(doc) Store.flush()});
document.addEventListener("visibilitychange",function(){if(document.hidden&&doc) Store.flush()});
})();

/* ---- sbx-src/core/20-ecs.js */
/* Entities and systems (spec §10.3): an entity is a plain object from world.json; live state from the save is overlaid by id.
   Systems run in one rAF loop that pauses when the tab is hidden or a spark is open. Small on purpose (tens of entities). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
var E=SB.ecs={list:[],byId:{},systems:[],raf:0,last:0,acc:{}};
E.reset=function(){E.list=[];E.byId={};E.systems=[];E.acc={};E.stop()};
E.add=function(ent,saved){var e=JSON.parse(JSON.stringify(ent));e.live=saved||{};E.list.push(e);E.byId[e.id]=e;return e};
E.get=function(id){return E.byId[id]||null};
E.with=function(comp){return E.list.filter(function(e){return e[comp]!=null})};
E.state=function(id){var e=E.byId[id];return e?e.live:null};
/* change live state; the region save mirrors it (ents[id]) */
E.set=function(id,patch){var e=E.byId[id];if(!e) return;for(var k in patch) e.live[k]=patch[k];var r=SB.session&&SB.session.reg;if(r){r.ents[id]=e.live}SB.store.save();SB.emit("ent",{id:id,patch:patch})};
E.system=function(name,fn,hz){E.systems.push({name:name,fn:fn,hz:hz||0,acc:0})};
function tick(ts){E.raf=0;var s=SB.session;if(!s||s.dead) return;
  var dt=E.last?Math.min(64,ts-E.last):16;E.last=ts;
  if(!document.hidden&&!s.spark&&!s.paused){E.systems.forEach(function(sy){if(sy.hz){sy.acc+=dt;if(sy.acc<1000/sy.hz) return;var d=sy.acc;sy.acc=0;try{sy.fn(d)}catch(e){console.error(e)}}else{try{sy.fn(dt)}catch(e){console.error(e)}}})}
  E.raf=requestAnimationFrame(tick)}
E.start=function(){if(!E.raf){E.last=0;E.raf=requestAnimationFrame(tick)}};
E.stop=function(){if(E.raf){cancelAnimationFrame(E.raf);E.raf=0}};
})();

/* ---- sbx-src/core/30-pano.js */
/* 360 panorama: a COPY of the strip maths in areas2.js showCamp/campRender (STEP 1680, LOOP 6720, wall width 1920, height 1080),
   so areas2.js stays byte-identical. Entities are absolutely positioned over the strip and move with it. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,STEP=1680,DW=1920,DH=1080,LOOP=6720;
function Pano(host,o){var P=this;P.o=o;P.host=host;P.items=[];P.center=o.center!=null?o.center:DW/2;P.vel=0;P.tween=null;P.dirty=true;P.raf=0;P.drag=false;
  P.view=U.el("div","sbx-view");P.view.setAttribute("role","application");P.view.setAttribute("aria-label",o.label||"Look around");P.view.tabIndex=0;
  P.strip=U.el("div","sbx-strip");P.layer=U.el("div","sbx-layer");
  P.imgs=[0,1].map(function(){var i=new Image();i.alt="";i.draggable=false;i.decoding="async";i.src=o.src;P.strip.appendChild(i);return i});
  P.view.appendChild(P.strip);P.view.appendChild(P.layer);host.appendChild(P.view);
  P.ready=P.imgs[0].decode?P.imgs[0].decode().catch(function(){}):Promise.resolve();
  P.layout();P.bind();
  P.onR=function(){P.layout()};window.addEventListener("resize",P.onR);
}
Pano.prototype.layout=function(){var P=this,r=P.view.getBoundingClientRect();P.vw=r.width||innerWidth;P.vh=r.height||innerHeight;
  P.H=Math.max(1,Math.round(P.vh));P.Ww=Math.max(1,Math.round(LOOP*P.H/DH));P.sc=P.Ww/LOOP;P.dpr=window.devicePixelRatio||1;
  P.strip.style.width=(P.Ww*2)+"px";P.strip.style.height=P.H+"px";
  P.imgs.forEach(function(im,i){im.style.left=(i*P.Ww)+"px";im.style.width=P.Ww+"px";im.style.height=P.H+"px"});
  P.narrow=P.vw/P.vh<0.9;P.items.forEach(function(it){it.sized=false});P.dirty=true;P.kick()};
Pano.prototype.wx=function(e){var p=e.pos,x=this.narrow&&p.xn!=null?p.xn:p.x;return p.spot*STEP+(x/100)*DW+(e.live&&e.live.ox||0)+(e.ox||0)};
Pano.prototype.add=function(ent,node){var it={e:ent,n:node,sized:false};node.classList.add("sbx-ent");node.dataset.ent=ent.id;this.layer.appendChild(node);this.items.push(it);this.dirty=true;this.kick();return it};
Pano.prototype.remove=function(id){this.items=this.items.filter(function(it){if(it.e.id===id){it.n.remove();return false}return true})};
Pano.prototype.size=function(it){var P=this,e=it.e,h=Math.round((P.narrow?(e.pos.hn||(e.pos.h||.2)*.75):(e.pos.h||.2))*P.H*(e.live&&e.live.sc||1)),a=e.aspect||1,w=Math.round(h*a),min=U.rules().minTargetPx;
  it.w=w;it.h=h;it.n.style.width=w+"px";it.n.style.height=h+"px";
  /* hit pad: at k every tappable thing is at least 76 x 76 px */
  var pad=it.n.querySelector(".sbx-hit");if(pad){var pw=Math.max(w,min),ph=Math.max(h,min);pad.style.width=pw+"px";pad.style.height=ph+"px";pad.style.left=((w-pw)/2)+"px";pad.style.top=((h-ph)/2)+"px"}
  it.sized=true;this.padsDirty=true};
/* P3 1c: hit pads never overlap. Pads start as the sprite box grown to >= minTargetPx; any two that overlap are cut at the middle of the
   overlap along the shorter axis (never below minTargetPx); only the pad takes pointer input (CSS), so a tap goes to exactly one thing. */
Pano.prototype.resolvePads=function(){var P=this,min=U.rules().minTargetPx||76,sc=P.sc,L=[];this.padsDirty=false;
  P.items.forEach(function(it){var pad=it.n.querySelector(".sbx-hit");if(!pad||!it.sized) return;var cx=P.wx(it.e)*sc,base=(it.e.pos.y/100)*P.H+(it.e.live&&it.e.live.oy||0),pw=Math.max(it.w,min),ph=Math.max(it.h,min);
    L.push({it:it,pad:pad,l:cx-pw/2,r:cx+pw/2,t:base-it.h/2-ph/2,b:base-it.h/2+ph/2,cx:cx,cy:base-it.h/2})});
  for(var pass=0;pass<4;pass++) for(var i=0;i<L.length;i++) for(var j=i+1;j<L.length;j++){var a=L[i],b=L[j],ox=Math.min(a.r,b.r)-Math.max(a.l,b.l),oy=Math.min(a.b,b.b)-Math.max(a.t,b.t);if(ox<=0||oy<=0) continue;
    var A=a.cx<=b.cx?a:b,B=A===a?b:a,U2=a.cy<=b.cy?a:b,D=U2===a?b:a;
    var xok=Math.min((A.r-A.l)-ox/2,(B.r-B.l)-ox/2)>=min,yok=Math.min((U2.b-U2.t)-oy/2,(D.b-D.t)-oy/2)>=min;
    if(xok&&(ox<=oy||!yok)){var m=(Math.max(A.l,B.l)+Math.min(A.r,B.r))/2;A.r=m;B.l=m}
    else if(yok){var m2=(Math.max(U2.t,D.t)+Math.min(U2.b,D.b))/2;U2.b=m2;D.t=m2}
    else{/* both too small to split: give the overlap to the one drawn in front */var F=(a.it.e.pos.y>b.it.e.pos.y)?a:b,K=F===a?b:a;if(ox<=oy){if(K.cx<F.cx) K.r=F.l;else K.l=F.r}else{if(K.cy<F.cy) K.b=F.t;else K.t=F.b}}}
  L.forEach(function(o){var x0=o.cx-o.it.w/2,y0=(o.it.e.pos.y/100)*P.H+(o.it.e.live&&o.it.e.live.oy||0)-o.it.h;o.pad.style.left=(o.l-x0)+"px";o.pad.style.top=(o.t-y0)+"px";o.pad.style.width=(o.r-o.l)+"px";o.pad.style.height=(o.b-o.t)+"px"})};
Pano.prototype.render=function(){var P=this;P.center=U.mod(P.center,LOOP);var sc=P.sc,Wt=P.Ww,off=P.center*sc-P.vw/2;off=Math.round(off*P.dpr)/P.dpr;var o=U.mod(off,Wt);
  P.strip.style.transform="translate3d("+(-o)+"px,0,0)";var M=Math.max(260,P.vw*.35);
  var lim=P.narrow?P.H-(U.rules().minTargetPx||76)-22:1e9;P.items.forEach(function(it){if(!it.sized) P.size(it)});if(P.padsDirty) P.resolvePads();P.items.forEach(function(it){var e=it.e,wx=P.wx(e)*sc,sx=U.mod(wx-o+M,Wt)-M,base=(e.pos.y/100)*P.H+(e.live&&e.live.oy||0)+(e.oy||0);if(base>lim) base=lim;
    it.sx=sx;it.sy=base;var x=sx-it.w/2,y=base-it.h;it.n.style.transform="translate3d("+(Math.round(x*10)/10)+"px,"+(Math.round(y*10)/10)+"px,0)";
    it.n.style.zIndex=String(10+Math.round(e.pos.y*10)+(e.pos.z||0));
    var vis=sx+it.w/2>-20&&sx-it.w/2<P.vw+20;if(vis!==it.vis){it.vis=vis;it.n.classList.toggle("off",!vis)}});
  var wi=U.mod(Math.round((P.center-DW/2)/STEP),4);if(wi!==P.spot){P.spot=wi;SB.emit("spot",{spot:wi})}};
Pano.prototype.kick=function(){var P=this;if(P.raf||P.dead) return;P.last=0;P.raf=requestAnimationFrame(function t(ts){P.raf=0;if(P.dead) return;var dt=P.last?Math.min(48,ts-P.last):16;P.last=ts;var busy=false;
  if(P.tween){var k=Math.min(1,(ts-P.tween.t0)/P.tween.dur),ez=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;P.center=P.tween.from+P.tween.delta*ez;P.dirty=true;if(k>=1) P.tween=null;else busy=true}
  else if(!P.drag&&Math.abs(P.vel)>0.004){P.center+=P.vel*dt;P.vel*=Math.exp(-dt/200);P.dirty=true;busy=true}
  if(P.dirty||P.always){P.dirty=false;P.render()}
  if(busy||P.drag||P.always) P.kick()})};
function shortest(a,b){return U.mod(b-a+LOOP/2,LOOP)-LOOP/2}
Pano.prototype.turnTo=function(target,dur){var P=this,d=shortest(P.center,target);P.vel=0;if(U.reduced()||!dur){P.tween=null;P.center+=d;P.dirty=true;P.kick();return}P.tween={from:P.center,delta:d,t0:performance.now(),dur:dur};P.kick()};
/* one look-around step: a whole wall on a wide screen, about 70 % of the screen on a narrow one (so nothing is skipped) */
Pano.prototype.snap=function(dir){var P=this,b=P.tween?P.tween.from+P.tween.delta:P.center,vis=P.vw/P.sc;
  if(vis>=STEP*.8){var idx=Math.round((b-DW/2)/STEP)+dir;P.turnTo(idx*STEP+DW/2,560)}else P.turnTo(b+dir*vis*.7,520);U.sfx("whoosh")};
Pano.prototype.toSpot=function(s,dur){this.turnTo(s*STEP+DW/2,dur==null?560:dur)};
/* automatic camera turns (P3 1c): never while the child is touching. A turn waits until 1.2 s after the last touch; while it
   runs, and for 400 ms after, taps on the world are ignored, so a tap aimed at the fox can never land on the trader that slid in. */
Pano.prototype.toEnt=function(e,dur,user){var P=this;if(user){P.turnTo(P.wx(e),dur==null?560:dur);return}clearTimeout(P.autoW);var t0=performance.now();
  (function go(){if(P.dead) return;var q=performance.now()-(P.lastTouch||0);if(P.drag||q<1200){if(performance.now()-t0<8000) P.autoW=setTimeout(go,1250-Math.min(q,1200));return}
    var d=Math.abs(shortest(P.center,P.wx(e)));if(d<4) return;var ms=U.reduced()?0:(dur==null?560:dur);P.turnTo(P.wx(e),ms);P.autoUntil=performance.now()+ms+400;U.log("autoturn",{to:e.id})})()};
Pano.prototype.autoBusy=function(){return performance.now()<(this.autoUntil||0)};
Pano.prototype.item=function(id){return this.items.filter(function(it){return it.e.id===id})[0]||null};
Pano.prototype.screenOf=function(id){var it=this.item(id);if(!it) return null;if(this.dirty) this.render();var r=it.n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,l:r.left,t:r.top,vis:!!it.vis&&r.right>0&&r.left<innerWidth}};
Pano.prototype.bind=function(){var P=this,v=P.view,sx=0,lx=0,lt=0,pid=null,moved=false;
  v.addEventListener("pointerdown",function(){P.lastTouch=performance.now()},true);
  v.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;if(pid!==null) return;if(e.target.closest&&e.target.closest(".sbx-drag")) return;pid=e.pointerId;sx=lx=e.clientX;lt=e.timeStamp;moved=false;P.vel=0;P.tween=null});
  v.addEventListener("pointermove",function(e){if(e.pointerId!==pid) return;if(e.pointerType==="mouse"&&!e.buttons){up(e);return}
    if(!moved){if(Math.abs(e.clientX-sx)<8) return;moved=true;P.drag=true;v.classList.add("grab");try{v.setPointerCapture(pid)}catch(err){}}
    var dx=e.clientX-lx,dt=Math.max(1,e.timeStamp-lt);lx=e.clientX;lt=e.timeStamp;P.center-=dx/P.sc;var inst=-(dx/P.sc)/dt;P.vel=U.clamp(P.vel*.6+inst*.4,-3,3);P.dirty=true;P.kick()});
  function up(e){if(e.pointerId!==pid) return;pid=null;if(moved){P.drag=false;v.classList.remove("grab");P.suppress=true;setTimeout(function(){P.suppress=false},60);if(U.reduced()||(e.timeStamp-lt)>90) P.vel=0;try{v.releasePointerCapture(e.pointerId)}catch(err){}P.kick()}moved=false}
  /* window capture: a tappable inside the view stops propagation of its pointerup, which must still end the drag gesture */
  addEventListener("pointerup",up,true);addEventListener("pointercancel",up,true);P.unbind=function(){removeEventListener("pointerup",up,true);removeEventListener("pointercancel",up,true)};
  v.addEventListener("click",function(e){if(P.suppress){e.stopPropagation();e.preventDefault()}},true);
  v.addEventListener("wheel",function(e){e.preventDefault();var d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;P.tween=null;P.vel=0;P.center+=d/P.sc*.9;P.dirty=true;P.kick()},{passive:false})};
Pano.prototype.destroy=function(){this.dead=true;if(this.unbind) this.unbind();window.removeEventListener("resize",this.onR);if(this.raf) cancelAnimationFrame(this.raf);this.view.remove()};
SB.Pano=Pano;SB.PANO={STEP:STEP,DW:DW,DH:DH,LOOP:LOOP};
/* a still backdrop of one wall's clean middle (same rule as areas2 stripBg) for spark scenes */
SB.stripBg=function(node,src,wall,xPct,overlap){var r=node.getBoundingClientRect(),W=r.width||innerWidth,H=r.height||innerHeight,sc=H/DH,c=wall*STEP+((xPct==null?50:xPct)/100)*DW;
  var ov=(overlap||240)+20,c0=wall*STEP+ov,c1=wall*STEP+DW-ov,z=1;if(W/sc>c1-c0) z=(W/sc)/(c1-c0);
  var s2=sc*z,half=W/s2/2;c=Math.max(c0+half,Math.min(c1-half,c));
  node.style.backgroundImage="url("+src+")";node.style.backgroundSize="auto "+(100*z).toFixed(2)+"%";node.style.backgroundRepeat="repeat-x";node.style.backgroundPosition=(W/2-c*s2)+"px "+((H-H*z)*.62)+"px"};
})();

/* ---- sbx-src/core/40-input.js */
/* Input: tap and drag with a tap alternative for every drag (tap the item, then tap where it goes), the same pattern as areas2 drag().
   Any tap on the world cuts Spark's current line (the fast-tap rule). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
/* a tap acts on pointerup; the browser's follow-up click (a "ghost click" on phones) must not land on whatever the tap revealed, e.g. the Back button under a spark's close button */
var eat=null;document.addEventListener("click",function(e){if(!eat) return;var n=eat.n,old=performance.now()-eat.t>600;eat=null;if(old||(n.isConnected&&n.contains(e.target))) return;e.preventDefault();e.stopPropagation()},true);
U.onTap=function(node,fn,o){o=o||{};var st=null;node.style.touchAction=o.touch||"manipulation";
  node.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;st={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};if(o.down) o.down(e)});
  node.addEventListener("pointerup",function(e){if(!st||e.pointerId!==st.id) return;var d=Math.hypot(e.clientX-st.x,e.clientY-st.y),dt=performance.now()-st.t;st=null;
    if(d>(o.slop||12)) return;var pano=SB.session&&SB.session.pano;if(pano&&pano.suppress) return;e.stopPropagation();eat={t:performance.now(),n:node};fn(e,dt)});
  node.addEventListener("pointercancel",function(){st=null});
  node.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();fn(e,0)}})};
/* long press (tap and hold) */
U.onHold=function(node,ms,fn){var t=0,sx=0,sy=0;node.addEventListener("pointerdown",function(e){sx=e.clientX;sy=e.clientY;clearTimeout(t);t=setTimeout(function(){node._held=performance.now();fn(e)},ms)});
  ["pointerup","pointercancel","pointerleave"].forEach(function(n){node.addEventListener(n,function(){clearTimeout(t)})});
  node.addEventListener("pointermove",function(e){if(Math.hypot(e.clientX-sx,e.clientY-sy)>12) clearTimeout(t)})};
function ghostOf(src,size){var g=U.el("div","sbx-ghost");var im=src.querySelector("img");g.innerHTML=im?im.outerHTML:src.innerHTML;var r=src.getBoundingClientRect();size=size||Math.max(Math.min(r.width,r.height),70)*1.1;g.style.width=g.style.height=size+"px";g._s=size;return g}
function place(g,x,y,l){g.style.transform="translate3d("+(x-g._s/2)+"px,"+(y-g._s/2-(l||0))+"px,0)"}
var armed=null;
function disarm(){if(!armed) return;armed.src.classList.remove("armed");document.removeEventListener("pointerdown",armed.fn,true);armed=null}
U.disarm=disarm;
/* o: {drop(x,y,st)->bool, move(x,y), ok(), size, onArm} */
U.drag=function(src,o){src.classList.add("sbx-drag");src.style.touchAction="none";
  src.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;if(o.ok&&!o.ok()) return;e.preventDefault();e.stopPropagation();SB.voice&&SB.voice.cut();
    var g=ghostOf(src,o.size);document.body.appendChild(g);g.style.opacity="0";var st={g:g,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false,id:e.pointerId};place(g,st.x,st.y);
    try{src.setPointerCapture(e.pointerId)}catch(_){}U.sfx("click");var rq=0;
    function paint(){rq=0;if(!st.moved) return;place(g,st.x,st.y,14);if(o.move) o.move(st.x,st.y,st)}
    function mv(ev){if(ev.pointerId!==st.id) return;st.x=ev.clientX;st.y=ev.clientY;if(!st.moved&&Math.hypot(st.x-st.sx,st.y-st.sy)>6){st.moved=true;g.style.opacity="1";src.classList.add("held")}if(st.moved&&!rq) rq=requestAnimationFrame(paint)}
    function up(ev){if(ev.pointerId!==st.id) return;src.removeEventListener("pointermove",mv);src.removeEventListener("pointerup",up);src.removeEventListener("pointercancel",up);
      try{src.releasePointerCapture(st.id)}catch(_){}src.classList.remove("held");if(rq){cancelAnimationFrame(rq);rq=0}
      if(!st.moved){g.remove();arm(src,o);return}
      var used=o.drop?o.drop(st.x,st.y,st):false;
      if(used===true){if(g.animate){var a=g.animate([{opacity:1},{transform:g.style.transform+" scale(.5)",opacity:0}],{duration:220,fill:"forwards"});a.onfinish=function(){g.remove()}}else g.remove();return}
      var r=src.getBoundingClientRect();if(g.animate){var an=g.animate([{opacity:1},{transform:"translate3d("+(r.left+r.width/2-g._s/2)+"px,"+(r.top+r.height/2-g._s/2)+"px,0) scale(.6)",opacity:.1}],{duration:360,easing:"ease-in"});an.onfinish=function(){g.remove()}}else g.remove()}
    src.addEventListener("pointermove",mv);src.addEventListener("pointerup",up);src.addEventListener("pointercancel",up)});
  src.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();arm(src,o)}})};
function arm(src,o){disarm();if(o.ok&&!o.ok()) return;src.classList.add("armed");U.sfx("click");if(o.onArm) o.onArm();
  var fn=function(ev){if(!armed) return;if(src.contains(ev.target)){ev.preventDefault();ev.stopPropagation();disarm();return}
    if(ev.target.closest&&ev.target.closest(".sbx-ar,.sbx-al,.sbx-dbar")) return;/* panning keeps the picked-up item, so a phone child can scroll to the dog */
    if(ev.target.closest&&ev.target.closest(".sbx-hudb,.sg-btn,.sg-ov,.sbx-x")){disarm();return}
    ev.preventDefault();ev.stopPropagation();var x=ev.clientX,y=ev.clientY;disarm();
    var g=ghostOf(src,o.size);document.body.appendChild(g);place(g,x,y);var st={g:g,x:x,y:y,moved:true,tapDest:true};
    var used=o.drop?o.drop(x,y,st):false;if(used===true){g.remove();return}var r=src.getBoundingClientRect();
    if(g.animate){var an=g.animate([{opacity:1},{transform:"translate3d("+(r.left+r.width/2-g._s/2)+"px,"+(r.top+r.height/2-g._s/2)+"px,0) scale(.6)",opacity:.1}],{duration:360});an.onfinish=function(){g.remove()}}else g.remove()};
  armed={src:src,fn:fn};document.addEventListener("pointerdown",fn,true)}
/* what is under a point, ignoring the dragged ghost */
U.hitEnt=function(x,y,sel){var n=document.elementsFromPoint(x,y);for(var i=0;i<n.length;i++){var e=n[i].closest&&n[i].closest(sel||".sbx-ent");if(e) return e}return null};
})();

/* ---- sbx-src/core/50-hud.js */
/* HUD (spec §7.6/§9): back arrow top-left (held 1 s at k so a stray tap can't leave), backpack bottom-left, coin jar bottom-right
   (coin pictures at k, numbers from e), Spark "hear again" top-right next to the grown-up gear, caption, badge with 5 corners,
   big look-around arrows at k. Every button has an icon and an aria-label; nothing needs reading. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
var H=SB.hud={};
var BACK='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/></svg>';
var SPK='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h8l10-8v26l-10-8H8z" fill="#fff"/><path d="M31 17c3 3 3 11 0 14M35 13c6 6 6 16 0 22" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>';
var ARL='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 8 L14 24 L30 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var ARR='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 8 L34 24 L18 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
H.build=function(s){var root=s.root,ui=U.el("div","sbx-hud");root.appendChild(ui);H.ui=ui;H.s=s;
  var back=H.back=U.btn("sbx-hudb sbx-back","Back to the map",BACK);ui.appendChild(back);
  var holdT=0;function goBack(){U.log("back",{});SB.back()}
  back.addEventListener("pointerdown",function(e){e.stopPropagation();if(U.band()!=="k"||s.scene||s.spark) return;back.classList.add("holding");clearTimeout(holdT);holdT=setTimeout(function(){back.classList.remove("holding");back._held=1;goBack()},1000)});
  ["pointerup","pointercancel","pointerleave"].forEach(function(n){back.addEventListener(n,function(){clearTimeout(holdT);back.classList.remove("holding")})});
  back.addEventListener("click",function(e){e.stopPropagation();if(back._held){back._held=0;return}if(U.band()==="k"&&!s.scene&&!s.spark){U.anim(back,"wig",600);return}goBack()});
  var again=H.again=U.btn("sbx-hudb sbx-again","Hear Spark again",'<span class="sbx-sparkface" aria-hidden="true"></span>'+SPK);ui.appendChild(again);
  U.onTap(again,function(){SB.voice.again()});
  var bag=H.bag=U.btn("sbx-hudb sbx-bag","Open my backpack",'<img alt="" draggable="false" src="'+SB.img("sbx/backpack")+'">');ui.appendChild(bag);
  U.onTap(bag,function(){SB.voice.cut();SB.kitPanel&&SB.kitPanel()});
  var jar=H.jar=U.btn("sbx-hudb sbx-jar","My coins",'<img class="sbx-jarimg" alt="" draggable="false" src="'+SB.img("sbx/jar")+'"><span class="sbx-coinpics" aria-hidden="true"></span><b class="sbx-coinnum"></b><span class="sbx-wish" aria-hidden="true"></span>');ui.appendChild(jar);
  U.onTap(jar,function(){SB.voice.cut();H.showWish()});
  var badge=H.badgeB=U.btn("sbx-hudb sbx-badge","My Arctic badge",'<svg viewBox="0 0 60 60" aria-hidden="true"></svg>');ui.appendChild(badge);
  U.onTap(badge,function(){H.showBadge()});
  var L=H.left=U.btn("sbx-hudb sbx-arrow sbx-al","Look left",ARL),R=H.right=U.btn("sbx-hudb sbx-arrow sbx-ar","Look right",ARR);ui.appendChild(L);ui.appendChild(R);
  U.onTap(L,function(){SB.voice.cut();s.pano&&s.pano.snap(-1)});U.onTap(R,function(){SB.voice.cut();s.pano&&s.pano.snap(1)});
  var cap=U.el("div","sbx-cap off",'<span class="sbx-captxt"></span>');cap.setAttribute("aria-live","polite");root.appendChild(cap);SB.voice.cap=cap;
  H.coins(SB.econ.balance());H.badge();
  SB.on("coins",function(){if(!H.flying) H.coins(SB.econ.balance())});
};
H.coins=function(n){var j=H.jar;if(!j) return;var k=U.band()==="k",pics=j.querySelector(".sbx-coinpics"),num=j.querySelector(".sbx-coinnum");
  j.dataset.coins=n;j.setAttribute("aria-label","My coins: "+n);
  var show=Math.min(n,k?20:0),h="";for(var i=0;i<show;i++) h+='<i style="--i:'+i+'"></i>';pics.innerHTML=h;pics.style.setProperty("--coin","url("+SB.img("sbx/coin")+")");
  num.textContent=k?(n>20?"+":""):String(n);num.classList.toggle("off",k&&n<=20);H.wishRender()};
H.jarPt=function(){var r=U.rect(H.jar);return {x:r.cx,y:r.cy}};
/* coins fly to the jar one at a time; at k each lands with a spoken count (spec §10.5) */
H.flyCoins=function(from,n){var k=U.band()==="k",b0=SB.econ.balance()-n;H.flying=true;var i=0,to=H.jarPt(),img=SB.img("sbx/coin");
  return new Promise(function(done){function one(){if(i>=n||(SB.session&&SB.session.dead)){H.flying=false;H.coins(SB.econ.balance());done();return}i++;
    var c=U.el("img","sbx-flycoin");c.src=img;c.alt="";document.body.appendChild(c);var sx=from.x+(Math.random()*30-15),sy=from.y;
    var dur=k?520:300;if(c.animate&&!U.reduced()){var a=c.animate([{transform:"translate3d("+sx+"px,"+sy+"px,0) scale(.6)",opacity:0},{transform:"translate3d("+(sx+(to.x-sx)*.4)+"px,"+(Math.min(sy,to.y)-90)+"px,0) scale(1.15)",opacity:1,offset:.4},{transform:"translate3d("+to.x+"px,"+to.y+"px,0) scale(.7)",opacity:1}],{duration:dur,easing:"ease-in"});a.onfinish=land}else setTimeout(land,60);
    function land(){c.remove();U.sfx("coin");H.coins(b0+i);U.anim(H.jar,"bump",300);U.log("coinland",{i:i,of:n});
      if(k){SB.voice.count(i).then(function(){setTimeout(one,120)})}else setTimeout(one,120)}}
    one()})};
H.badge=function(){var s=H.s,b=H.badgeB;if(!b||!s||!s.reg) return;var parts=(s.def.badge||[]),got=s.reg.badge||{},svg="",n=parts.length;
  parts.forEach(function(p,i){var a0=-Math.PI/2+i*2*Math.PI/n,a1=a0+2*Math.PI/n-.08,R=27,r=12,f=function(a,rr){return (30+Math.cos(a)*rr).toFixed(1)+","+(30+Math.sin(a)*rr).toFixed(1)};
    svg+='<path d="M'+f(a0,r)+" L"+f(a0,R)+" A"+R+","+R+" 0 0 1 "+f(a1,R)+" L"+f(a1,r)+" A"+r+","+r+' 0 0 0 '+f(a0,r)+'Z" fill="'+(got[p.id]?p.c:"#ffffff22")+'" stroke="#fff" stroke-width="1.5"/>'});
  svg+='<circle cx="30" cy="30" r="10" fill="#3a8fd6" stroke="#fff" stroke-width="2"/><path d="M30 23v14M24 26.5l12 7M24 33.5l12-7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
  b.querySelector("svg").innerHTML=svg;b.dataset.got=Object.keys(got).filter(function(k){return got[k]}).length};
H.earnBadge=function(id){var s=H.s;if(!s.reg.badge[id]){s.reg.badge[id]=true;SB.store.save();H.badge();var r=U.rect(H.badgeB);U.burst(r.cx,r.cy,12);U.sfx("win");U.log("badge",{id:id})}};
H.showBadge=function(){var s=H.s,ov=SB.panel("sbx-badgeov","My badge");var big=U.el("div","sbx-bigbadge");big.innerHTML=H.badgeB.innerHTML;ov.body.appendChild(big);
  var row=U.el("div","sbx-badgerow");(s.def.badge||[]).forEach(function(p){var c=U.el("div","sbx-bpart"+(s.reg.badge[p.id]?" got":""),'<img alt="" src="'+SB.img(p.pic)+'">');c.setAttribute("aria-label",p.label);row.appendChild(c)});ov.body.appendChild(row);
  SB.voice.say("badge_look")};
/* wish jar: the wished item with empty slots for the exact missing coins (dots at k, number from e) */
H.wishRender=function(){var j=H.jar;if(!j) return;var w=SB.econ.wishes()[0],box=j.querySelector(".sbx-wish");if(!w){box.innerHTML="";box.classList.add("off");return}box.classList.remove("off");
  var miss=Math.max(0,w.price-w.have),k=U.band()==="k",dots="";if(k){for(var i=0;i<w.price;i++) dots+='<i class="'+(i<w.have?"on":"")+'"></i>'}
  box.innerHTML='<img alt="" src="'+SB.kitImg(w.item)+'">'+(k?'<span class="sbx-slots">'+dots+'</span>':'<b>'+(miss>0?miss+" more":"\u2713")+'</b>');box.dataset.missing=miss};
/* jar = my coins + wish + a small shop (P2 item 8). Ages 4-6 (k/e): 2 picture items with coin-picture prices, no numbers;
   the wished item fills coin by coin toward its price. Tap an item: buy it if you have enough, else it becomes the wish. */
function coinRow(n,have,cls){var h="";for(var i=0;i<n;i++) h+='<img class="'+(have!=null&&i>=have?"sbx-cempty":"")+'" alt="" src="'+SB.img("sbx/coin")+'">';return '<span class="sbx-cprice '+(cls||"")+'" data-price="'+n+'" aria-label="'+n+' coins">'+h+'</span>'}
H.showWish=function(){var s=SB.session,ov=SB.panel("sbx-wishov sbx-jshop","My coins and shop"),band=U.band(),k=band==="k",small=k||band==="e",per=small?2:4,page=0;
  var c=U.el("div","sbx-wcoins");ov.body.appendChild(c);var wrow=U.el("div","sbx-wrow2");ov.body.appendChild(wrow);var grid=U.el("div","sbx-jgrid");ov.body.appendChild(grid);
  function stock(){var W=(s&&s.world&&s.world.shop)||[],ws=SB.econ.wishes().map(function(w){return w.item});
    var L=W.filter(function(id){var it=SB.kit.item(id);return it&&(it.type==="decor"||it.type==="part")&&!it.reward});
    /* the wish first, then things not owned yet, then the rest */
    L.sort(function(a,b){function sc(id){return ws.indexOf(id)>=0?0:(SB.kit.has(id)?2:1)}return sc(a)-sc(b)});return L}
  function render(){var n=SB.econ.balance();
    if(k){var h="";for(var i=0;i<Math.min(n,20);i++) h+='<img class="sbx-wc" alt="" src="'+SB.img("sbx/coin")+'">';c.innerHTML=h||'<img class="sbx-wc sbx-cempty" alt="" src="'+SB.img("sbx/coin")+'">'}else c.innerHTML='<img class="sbx-wc" alt="" src="'+SB.img("sbx/coin")+'"> <b>'+n+'</b>';c.dataset.coins=n;
    var w=SB.econ.wishes()[0];wrow.innerHTML="";wrow.classList.toggle("off",!w);
    if(w){var miss=Math.max(0,w.price-w.have);wrow.dataset.item=w.item;wrow.dataset.have=w.have;wrow.dataset.price=w.price;
      wrow.innerHTML='<span class="sbx-wstar" aria-hidden="true">\u2B50</span><img class="sbx-wimg" alt="" src="'+SB.kitImg(w.item)+'"><span class="sbx-wfill"><i style="width:'+(w.have/w.price*100).toFixed(0)+'%"></i></span>'+coinRow(w.price,w.have,"big")+(small?"":'<b>'+(miss?miss+" more":"Ready!")+'</b>');
      if(!miss){var bb=U.btn("sbx-wbuy","Buy it",'<img alt="" src="'+SB.kitImg(w.item)+'"><span class="sbx-wbuyok" aria-hidden="true">\u2714</span>');wrow.appendChild(bb);U.onTap(bb,function(){buy(w.item,bb)})}}
    var L=stock(),pages=Math.max(1,Math.ceil(L.length/per));page=U.mod(page,pages);var items=L.slice(page*per,page*per+per);grid.innerHTML="";grid.dataset.shown=items.join(",");
    if(pages>1){var pv=U.btn("sbx-jpg sbx-jprev","More things",'<span aria-hidden="true">\u276E</span>');grid.appendChild(pv);U.onTap(pv,function(){page--;U.sfx("whoosh");render()})}
    items.forEach(function(id){var pr=SB.econ.price(id,s&&s.id),can=SB.econ.canAfford(pr),t=U.btn("sbx-jitem"+(can?"":" dear"),SB.kit.name(id)+(small?"":", "+pr+" coins"),'<img class="sbx-jpic" alt="" draggable="false" src="'+SB.kitImg(id)+'">'+coinRow(pr,small?Math.min(pr,n):null)+(small?"":'<b class="sbx-jnum">'+pr+'</b>'));
      t.dataset.item=id;t.dataset.price=pr;if(SB.kit.has(id)) t.appendChild(U.el("span","sbx-have","\u2713"));grid.appendChild(t);U.onTap(t,function(){buy(id,t)})});
    if(pages>1){var nx=U.btn("sbx-jpg sbx-jnext","More things",'<span aria-hidden="true">\u276F</span>');grid.appendChild(nx);U.onTap(nx,function(){page++;U.sfx("whoosh");render()})}}
  function buy(id,t){var pr=SB.econ.price(id,s&&s.id);SB.voice.cut();
    if(!SB.econ.canAfford(pr)){SB.econ.wish(id);U.log("wish",{item:id,price:pr,coins:SB.econ.balance(),from:"jar"});U.sfx("click");render();U.anim(wrow,"bump",400);SB.voice.say("need_more");return}
    var res=SB.econ.spend(pr,{item:id,region:s&&s.id});if(!res.ok) return;SB.kit.add(id,1);SB.econ.unwish(id);SB.store.save(true);U.log("buy",{item:id,price:pr,from:"jar"});U.sfx("win");
    var r=U.rect(t);U.burst(r.cx,r.cy,10,["\u2728"]);var f=U.el("img","sbx-flybuy");f.src=SB.kitImg(id);f.alt="";document.body.appendChild(f);var bg=U.rect(H.bag||H.jar);
    if(f.animate){var an=f.animate([{transform:"translate3d("+(r.cx-45)+"px,"+(r.cy-45)+"px,0)"},{transform:"translate3d("+(bg.cx-45)+"px,"+(bg.cy-45)+"px,0) scale(.4)"}],{duration:700,easing:"ease-in"});an.onfinish=function(){f.remove()}}else f.remove();
    H.coins(SB.econ.balance());render();SB.voice.say("bought_it")}
  render();var w0=SB.econ.wishes()[0];if(w0){SB.voice.say(w0.price-w0.have>0?"need_more":"wish_ready")}else SB.voice.say("shop_pick");
  if(k) setTimeout(function(){var t=grid.querySelector(".sbx-jitem:not(.dear)")||grid.querySelector(".sbx-jitem");if(t&&ov.isConnected) SB.hand.show(t,{gesture:"tap"})},1800);
  U.log("jarshop",{shown:grid.dataset.shown,coins:SB.econ.balance()});return ov};
SB.openShop=function(){return H.showWish()};
/* generic picture panel with a big ✕ */
SB.panel=function(cls,label){var s=SB.session,ov=U.el("div","sbx-panel "+(cls||""));ov.setAttribute("role","dialog");ov.setAttribute("aria-label",label||"");
  var x=U.btn("sbx-x","Close",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14L34 34M34 14L14 34" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>');
  var body=U.el("div","sbx-pbody");ov.appendChild(body);ov.appendChild(x);s.root.appendChild(ov);var o={node:ov,body:body,close:function(){if(o.closed) return;o.closed=true;ov.remove();s.panel=null;if(o.onClose) o.onClose()}};
  if(s.panel) s.panel.close();s.panel=o;U.onTap(x,function(){SB.voice.cut();o.close()});ov.addEventListener("pointerdown",function(e){if(e.target===ov){o.close()}});return o};
})();
(function(){var SB=window.SparkSandbox,U=SB.u,H=SB.hud;
/* who is playing: the child's animal photo; tap it to switch player (another child's save) */
H.player=function(){var s=SB.session,p=SB.store.profile();if(!p||!H.ui) return;var P=s.def.pics[p.pic]||{};var b=H.playerB||(H.playerB=U.btn("sbx-hudb sbx-player","Switch player",""));
  b.innerHTML=SB.avaHtml(p.pic,SB.img(P.pic));b.setAttribute("aria-label","Playing as the "+(P.label||p.pic)+". Tap to switch player");if(!b.isConnected){H.ui.appendChild(b);U.onTap(b,function(){SB.switchPlayer()})}};
})();

/* ---- sbx-src/core/60-econ.js */
/* SparkEcon (spec §10.5). Coins come ONLY from job, sell or tip. No earn source exists for learning, login, daily or answers. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,SRC={job:1,sell:1,tip:1};
function W(){var p=SB.store.profile();if(!p) return {coins:0,ledger:[]};p.wallet=p.wallet||{coins:0,ledger:[]};return p.wallet}
function day(){var s=SB.session;return s&&s.reg?s.reg.day:0}
var E=window.SparkEcon=SB.econ={
  balance:function(){return W().coins|0},
  earn:function(n,o){o=o||{};n=Math.round(n);
    if(!SRC[o.src]){var msg="SparkEcon.earn: banned coin source "+o.src;U.log("earnbanned",{src:o.src,n:n});if(U.dev()) throw new Error(msg);try{console.error(msg)}catch(e){}return E.balance()}
    if(!(n>0)) return E.balance();var w=W();w.coins=(w.coins|0)+n;w.ledger.push({day:day(),r:o.region||(SB.session&&SB.session.id)||"",d:n,src:o.src,item:o.item||o.spark||""});
    U.log("earn",{n:n,src:o.src,item:o.item||"",spark:o.spark||""});SB.store.save();SB.emit("coins",{d:n,src:o.src});return w.coins},
  canAfford:function(n){return E.balance()>=n},
  spend:function(n,o){o=o||{};var w=W();if(w.coins<n){U.log("spendshort",{n:n,short:n-w.coins,item:o.item});return {ok:false,short:n-w.coins}}
    w.coins-=n;w.ledger.push({day:day(),r:o.region||"",d:-n,src:"buy",item:o.item||""});U.log("spend",{n:n,item:o.item});SB.store.save();SB.emit("coins",{d:-n});return {ok:true}},
  price:function(itemId,regionId){var it=SB.kit.item(itemId);if(!it) return 0;var s=SB.session,pr=(s&&s.world&&s.world.prices)||{local:1},f=pr[it.origin]!=null?pr[it.origin]:(it.origin===regionId?pr.local||1:1);return Math.max(1,Math.round((it.base||1)*f))},
  sell:function(itemId,qty,regionId,o){qty=qty||1;var have=SB.kit.count(itemId);qty=Math.min(qty,have);if(!qty) return 0;var each=(o&&o.each)||E.price(itemId,regionId);SB.kit.remove(itemId,qty);E.earn(each*qty,{src:"sell",region:regionId,item:itemId});return each*qty},
  wish:function(id){var p=SB.store.profile();if(p.wishes.indexOf(id)<0){p.wishes.unshift(id);p.wishes=p.wishes.slice(0,3);SB.store.save();SB.emit("coins",{})}},
  unwish:function(id){var p=SB.store.profile();p.wishes=p.wishes.filter(function(x){return x!==id});SB.store.save();SB.emit("coins",{})},
  wishes:function(){var p=SB.store.profile();if(!p) return [];var b=E.balance(),rid=SB.session&&SB.session.id;return (p.wishes||[]).map(function(id){var pr=E.price(id,rid);return {item:id,price:pr,have:Math.min(b,pr)}})},
  ledger:function(n){return W().ledger.slice(-(n||10))},
  earnedToday:function(){var d=day();return W().ledger.filter(function(l){return l.day===d&&l.d>0}).reduce(function(a,l){return a+l.d},0)}
};
})();

/* ---- sbx-src/core/70-kit.js */
/* SparkKit (spec §10.6): one kit per profile, so what a child carries leaves with them. Items come from sbx/items.json. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
function P(){return SB.store.profile()}
var K=window.SparkKit=SB.kit={items:{},
  setItems:function(list){K.items={};(list.items||list).forEach(function(it){K.items[it.id]=it})},
  item:function(id){return K.items[id]||null},
  add:function(id,q){q=q==null?1:q;var p=P();if(!p||!K.items[id]) return 0;p.kit[id]=(p.kit[id]|0)+q;U.log("kit",{id:id,d:q});SB.store.save();SB.emit("kit",{id:id,d:q});return p.kit[id]},
  remove:function(id,q){q=q==null?1:q;var p=P();if(!p||(p.kit[id]|0)<q) return false;p.kit[id]-=q;if(!p.kit[id]) delete p.kit[id];U.log("kit",{id:id,d:-q});SB.store.save();SB.emit("kit",{id:id,d:-q});return true},
  count:function(id){var p=P();return p?(p.kit[id]|0):0},
  has:function(id){return K.count(id)>0},
  list:function(o){var p=P();if(!p) return [];var t=o&&o.type;return Object.keys(p.kit).filter(function(id){var it=K.items[id];return it&&(!t||it.type===t)&&p.kit[id]>0}).map(function(id){return {id:id,n:p.kit[id],item:K.items[id]}})},
  usesIn:function(id,r){var it=K.items[id];return it&&it.uses&&it.uses[r]||[]},
  name:function(id){var it=K.items[id];return it?U.pick(it.name):id},
  wearing:function(id){var p=P();return !!(p&&p.wear.indexOf(id)>=0)},
  toggleWear:function(id){var p=P();var i=p.wear.indexOf(id);if(i>=0) p.wear.splice(i,1);else p.wear.push(id);SB.store.save();SB.emit("kit",{wear:id});return i<0}
};
SB.kitImg=function(id){var it=K.items[id];if(!it) return "";return SB.img(it.pic.asset,it.pic.region)};
var TABS=[{id:"good",pic:"prop_fish",label:"Goods"},{id:"part",pic:"sbx/rug_fur",label:"Igloo things"},{id:"decor",pic:"sbx/flag_red",label:"Decorations"},{id:"tool",pic:"sbx/brush",label:"Tools"},{id:"wear",pic:"gear_parka",label:"Clothes"},{id:"journal",pic:"sbx/camera",label:"Animal journal"}];
SB.kitPanel=function(tab){var s=SB.session,ov=SB.panel("sbx-kit","My backpack"),k=U.band()==="k";tab=tab||"good";
  var tabs=U.el("div","sbx-tabs"),grid=U.el("div","sbx-grid");ov.body.appendChild(tabs);ov.body.appendChild(grid);
  TABS.forEach(function(t){var b=U.btn("sbx-tab"+(t.id===tab?" on":""),t.label,'<img alt="" src="'+SB.img(t.pic)+'">');b.dataset.tab=t.id;tabs.appendChild(b);U.onTap(b,function(){SB.voice.cut();show(t.id)})});
  function show(id){tab=id;U.$$(".sbx-tab",tabs).forEach(function(b){b.classList.toggle("on",b.dataset.tab===id)});grid.innerHTML="";
    if(id==="journal"){(s.def.journal||[]).filter(function(sp){return sp.id!=="foxkits"||s.reg.flags.foxKits}).forEach(function(sp){var row=U.el("div","sbx-jrow");row.dataset.species=sp.id;row.appendChild(U.el("img","sbx-jsp")).src=SB.img(sp.pic);
      var got=(s.reg.journal[sp.id]||[]);sp.slots.forEach(function(sl){var c=U.el("div","sbx-jslot"+(got.indexOf(sl.id)>=0?" got":""));c.dataset.slot=sl.id;if(got.indexOf(sl.id)>=0){c.innerHTML='<img alt="" src="'+SB.img(sl.pic)+'">'+(U.band()!=="k"?'<b>'+U.esc(U.pick(sl.label))+'</b>':"")}else c.innerHTML='<span aria-hidden="true">?</span>';c.setAttribute("aria-label",(got.indexOf(sl.id)>=0?"":"Not found yet: ")+U.pick(sl.label));row.appendChild(c)});grid.appendChild(row)});
      SB.voice.say("journal_look");return}
    var L=K.list({type:id});if(!L.length){grid.appendChild(U.el("div","sbx-empty",'<img alt="" src="'+SB.img(TABS.filter(function(t){return t.id===id})[0].pic)+'">'));SB.voice.say("bag_empty");return}
    L.forEach(function(x){var t=U.btn("sbx-tile"+(id==="wear"&&K.wearing(x.id)?" worn":""),K.name(x.id),'<img alt="" src="'+SB.kitImg(x.id)+'">');t.dataset.item=x.id;
      var c=U.el("span","sbx-cnt");if(k){var d="";for(var i=0;i<Math.min(x.n,10);i++) d+="<i></i>";c.innerHTML=d}else c.textContent=x.n>1?"\u00d7"+x.n:"";t.appendChild(c);
      if(!k) t.appendChild(U.el("b","sbx-tname",U.esc(K.name(x.id))));grid.appendChild(t);
      U.onTap(t,function(){if(id==="wear"){var on=K.toggleWear(x.id);t.classList.toggle("worn",on);U.sfx(on?"pop":"click")}else U.sfx("pop");U.anim(t,"bump",300);SB.voice.say(K.name(x.id)+"!",{kind:"name"})})})}
  show(tab);return ov};
})();

/* ---- sbx-src/core/80-learn.js */
/* SparkLearn (spec §10.8): silent skill log. Children never see scores; the grown-up panel gets "What [name] practised". */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
function P(){return SB.store.profile()}
var L=window.SparkLearn=SB.learn={skills:{},subjects:{},
  setSkills:function(j){L.skills=j.skills||{};L.subjects=j.subjects||{}},
  moment:function(id,o){o=o||{};var p=P();if(!p) return;var s=p.learn.skills[id]||(p.learn.skills[id]={n:0,ok:0,assisted:0,lastDay:0});s.n++;if(o.ok) s.ok++;if(o.assisted) s.assisted++;s.lastDay=SB.session&&SB.session.reg?SB.session.reg.day:0;
    U.log("learn",{skill:id,ok:!!o.ok,assisted:!!o.assisted,spark:o.spark||""});SB.store.save()},
  level:function(id){var p=P(),s=p&&p.learn.skills[id];if(!s||s.n<3) return 0;return (s.ok/s.n>=.8&&s.n>=8)?2:1},
  summary:function(){var p=P();if(!p) return [];return Object.keys(p.learn.skills).map(function(id){var s=p.learn.skills[id],d=L.skills[id]||{};return {subject:d.subject||id.split(".")[0],skill:id,label:d.label||id,std:d.std||"",n:s.n,okRate:s.n?s.ok/s.n:0,lastDay:s.lastDay}})},
  chatIdea:function(r){var s=SB.session,ideas=(s&&s.world&&s.world.chatIdeas)||[],sum=L.summary();if(!ideas.length) return "";
    var hit=ideas.filter(function(i){return sum.some(function(x){return x.skill===i.skill})});var pool=hit.length?hit:ideas;var n=sum.reduce(function(a,x){return a+x.n},0);return pool[n%pool.length].text}
};
function words(x){var r=x.okRate>=.8?"mostly right":x.okRate>=.5?"getting there":"just starting";return x.n+(x.n===1?" time":" times")+", "+r}
function sectionHtml(){var s=SB.session;if(!s||!s.root) return "";var p=P();if(!p) return "";var name=(s.def.pics[p.pic]||{}).label||"your child",sum=L.summary(),by={};
  sum.forEach(function(x){(by[x.subject]=by[x.subject]||[]).push(x)});
  var h='<div class="sg-sbx" data-sbx-panel="1"><div class="sg-h2">What the '+U.esc(name)+' player practised</div>';
  if(!sum.length) h+='<p class="sg-note">Nothing yet. Skills show up here as your child plays (counting fish, sounding out signs, keeping the igloo warm). Children never see scores.</p>';
  Object.keys(by).forEach(function(sub){h+='<div class="sg-sub"><b>'+U.esc((L.subjects[sub]||{}).label||sub)+'</b><ul>'+by[sub].map(function(x){return '<li data-skill="'+x.skill+'">'+U.esc(x.label)+' \u2014 '+words(x)+(x.std?' <small>('+U.esc(x.std)+')</small>':"")+'</li>'}).join("")+'</ul></div>'});
  var idea=L.chatIdea(s.id);if(idea) h+='<p class="sg-idea"><b>Chat idea:</b> '+U.esc(idea)+'</p>';
  h+='<p class="sg-note">Coins: '+SB.econ.balance()+' (earned today: '+SB.econ.earnedToday()+'). Coins only come from jobs, selling and tips.</p>';
  h+='<div class="sg-sbxacts"><button type="button" id="sgSbxMovie">\u25B6 Play the Arctic movie</button><button type="button" id="sgSbxSwitch">Switch player</button><button type="button" id="sgSbxClassic">Use Classic Arctic</button></div></div>';return h}
function bind(close){var b=document.getElementById("sgSbxClassic");if(!b) return;
  b.onclick=function(){if(close) close();SB.close();setTimeout(function(){window.SparkAreasLoader&&SparkAreasLoader.openClassic&&SparkAreasLoader.openClassic("arctic")},50)};
  document.getElementById("sgSbxSwitch").onclick=function(){if(close) close();SB.switchPlayer()};
  document.getElementById("sgSbxMovie").onclick=function(){if(close) close();SB.playIntro(true)}}
L.hookPanel=function(){var A=U.SA();if(!A||!A.addPanelSection||L._hooked) return;L._hooked=true;A.addPanelSection(sectionHtml,bind)};
})();

/* ---- sbx-src/core/90-voice.js */
/* Sandbox voice (spec §10.11; spark12: routed through window.SparkVoice - Ava clips only, caption when a line has no clip, never the browser voice).
   voice.json maps a line id -> {k:{file,text}, e:{text}, u:{text}, t:{text}}. Captions and "hear again" as today. Any world tap cuts the line. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
var V=SB.voice={lines:{},base:"",last:null,cur:null,buf:{},tok:0};
function voiceOn(){var A=U.SA();return A?A.prefs().voice:!(window.S&&window.S.voice===false)}
function sv(){return null}/* spark12: no browser voice */
V.load=function(url,base){V.base=base;return fetch(url).then(function(r){return r.json()}).then(function(j){V.lines=j.lines||j;return V.lines}).catch(function(){V.lines={};return V.lines})};
V.has=function(id){return !!V.lines[id]};
V.clipFor=function(id,band){var l=V.lines[id];band=band||U.band();if(!l||band!=="k"||!l.k||!l.k.file) return null;return V.base+l.k.file};
V.text=function(id,band,vars){var l=V.lines[id];if(!l) return "";var o={};["k","e","u","t"].forEach(function(b){if(l[b]&&l[b].text!=null) o[b]=l[b].text});return U.fill(U.pick(o,band),vars)};
V.preload=function(ids){ids.forEach(function(id){var u=V.clipFor(id,"k");if(u&&!V.buf[u]) V.buf[u]=fetch(u).then(function(){return true}).catch(function(){return null})})};/* spark12: warm the cache; SparkVoice plays the clip */
V.cap=null;
/* review item 5: at ages 4-6 every instruction carries a picture cue (what) and a gesture icon (tap / steer) beside the voiced caption.
   V.cues[lineId] = [asset, asset, "tap"|"steer"]; set by the region. */
V.cues={};
var GEST={tap:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M20 26V9a3 3 0 0 1 6 0v12l9 2a4 4 0 0 1 3 4.5L36 41H21l-8-9a3 3 0 0 1 4-4.4z" fill="#fff" stroke="#10243e" stroke-width="2.5" stroke-linejoin="round"/><circle cx="23" cy="8" r="6" fill="none" stroke="#f6c445" stroke-width="2.5"/></svg>',
  steer:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 10L5 24l12 14M31 10l12 14-12 14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
/* P3 1f: a call may pass its own cue (o.cue) so the picture always matches the thing the child is using right now */
function cueHtml(id,cue){var c=cue||(id&&V.cues[id]);if(!c||U.band()!=="k") return "";return c.map(function(x){return GEST[x]?'<i class="sbx-cuei">'+GEST[x]+'</i>':'<img class="sbx-cuep" alt="" src="'+SB.img(x)+'">'}).join("")}
V.setCap=function(t,id,cue){var c=V.cap;if(!c) return;var q=c.querySelector(".sbx-capcue");if(!q){q=U.el("span","sbx-capcue");c.insertBefore(q,c.firstChild)}var h=cueHtml(id,cue);q.innerHTML=h;c.classList.toggle("cued",!!h);c.querySelector(".sbx-captxt").textContent=t||"";c.classList.toggle("off",!t);if(t){c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop")}};
function spark(state){var C=window.SparkCompanion;if(C&&C.setState){try{C.setState(state);return}catch(e){}}var e=document.getElementById("sparkCompanion");if(e) e.dataset.state=state}
/* say(lineId | {k,e,u,t} | "text", {vars, kind:"fact"|"line", interrupt}) -> Promise<heardToEnd> */
V.say=function(line,o){o=o||{};var id=typeof line==="string"&&V.lines[line]?line:null,band=U.band();
  var text=id?V.text(id,band,o.vars):(typeof line==="object"?U.fill(U.pick(line,band),o.vars):String(line||""));
  var clip=id&&!o.vars?V.clipFor(id,band):(id&&o.vars&&V.lines[id].k&&V.lines[id].k.file&&!/\{/.test(V.lines[id].k.text||"")?V.clipFor(id,band):null);
  if(/\[object Object\]|\bundefined\b|\bNaN\b|\{\w+\}/.test(text)) try{console.error("Spark line has a template bug: "+text)}catch(e){}
  V.cut(true);var tok=++V.tok;V.last={line:line,o:o};if(text&&o.cap!==false) V.setCap(text,id,o.cue);
  var rec=U.log("say",{id:id,text:text,clip:!!clip,vkind:o.kind||"line",band:band});
  return new Promise(function(res){var done=false,wd=0;
    function end(heard){if(done) return;done=true;clearTimeout(wd);/* review item 13: a finished line's caption goes away after 3 s (nothing stale stays on screen) */clearTimeout(V.capT);if(!heard&&tok!==V.tok){V.setCap("")}else V.capT=setTimeout(function(){if(tok===V.tok&&!V.cur) V.setCap("")},3000);if(V.cur&&V.cur.tok===tok) V.cur=null;rec.dur=Math.round(performance.now()-rec.t);rec.heard=heard;if(tok===V.tok) spark("idle");U.log("sayend",{id:id,heard:heard,dur:rec.dur,vkind:rec.vkind});res(heard)}
    V.cur={tok:tok,end:end,src:null};if(!text){end(true);return}spark("speaking");
    if(!voiceOn()){wd=setTimeout(function(){end(true)},Math.max(900,text.length*55));return}
    /* spark12: one voice path. k-band clip -> SparkVoice.play; other bands -> SparkVoice.say (Ava clip or caption only). Never the browser voice. */
    if(!window.SparkVoice){wd=setTimeout(function(){end(true)},Math.max(900,text.length*55));return}
    if(clip){SparkVoice.play(clip,{owner:"sbx",text:text,onend:function(h){end(h)}});wd=setTimeout(function(){end(true)},Math.max(4000,text.length*120));return}
    SparkVoice.say(text,{owner:"sbx",kind:"sbx",cap:false,onend:function(h){end(h)}});wd=setTimeout(function(){end(true)},Math.max(1500,text.length*95+900));
  })};
V.cut=function(silent){var c=V.cur;V.cur=null;V.tok++;if(c){try{window.SparkVoice&&SparkVoice.stop("sbx")}catch(e){}c.end(false)}else if(!silent){try{window.SparkVoice&&SparkVoice.stop("sbx")}catch(e){}}};
/* P3 1e: once a line has finished, the child's next action (any tap or drop) clears its caption within 0.4 s */
document.addEventListener("pointerup",function(){if(V.cur) return;var t=V.tok;clearTimeout(V.capT2);V.capT2=setTimeout(function(){if(t===V.tok&&!V.cur) V.setCap("")},400)},true);
V.again=function(){if(V.last) return V.say(V.last.line,V.last.o)};
V.speaking=function(){return !!V.cur};
/* count aloud in step with an animation: one call per number */
V.count=function(n){var id="count_"+n;if(V.lines[id]) return V.say(id,{kind:"count"});return V.say(String(n),{kind:"count"})};
/* decodable word, sound by sound, then whole: "h... u... t... hut!" */
var SND={a:"ah",b:"buh",c:"kuh",d:"duh",e:"eh",f:"fff",g:"guh",h:"hhh",i:"ih",j:"juh",k:"kuh",l:"lll",m:"mmm",n:"nnn",o:"oh",p:"puh",r:"rrr",s:"sss",t:"tuh",u:"uh",v:"vvv",w:"wuh",x:"ks",y:"yuh",z:"zzz"};
V.word=function(w){w=String(w).toLowerCase();var parts=w.split("").map(function(c){return SND[c]||c});U.log("word",{word:w,sounds:parts});
  var line=parts.join("... ")+"... "+w+"!";return V.say(line,{kind:"word"})};
})();

/* ---- sbx-src/core/95-hand.js */
/* SparkHand + SparkIdle (spec §10.11, §9.3): a big white cartoon hand that taps or drags on the next useful thing,
   and the idle ladder: 5 s hand, 15 s Spark repeats, 30 s a new suggestion. Never a timer that ends anything. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
var SVG='<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M38 8c6 0 10 4 10 10v34l3-1V40c0-5 4-9 9-9s9 4 9 9v14l2-1c0-5 4-8 8-8 5 0 9 4 9 9v8c4-2 10 0 10 7v20c0 16-12 29-30 29H58c-11 0-19-5-25-14L13 78c-3-5-1-11 4-13 4-2 9-1 12 3l5 6V18c0-6 2-10 4-10z" fill="#fff" stroke="#1d2b3a" stroke-width="5" stroke-linejoin="round"/><path d="M48 52v20M69 54v18M89 61v12" stroke="#1d2b3a" stroke-width="3.5" stroke-linecap="round"/></svg>';
var Hd=window.SparkHand=SB.hand={node:null,t:null,raf:0};
function pt(t){if(!t) return null;if(typeof t==="function") t=t();if(!t) return null;if(t.nodeType){if(!t.isConnected) return null;var r=t.getBoundingClientRect();if(!r.width&&!r.height) return null;return {x:r.left+r.width/2,y:r.top+r.height*.55}}
  if(typeof t==="string"){var p=SB.session&&SB.session.pano&&SB.session.pano.screenOf(t);if(p) return {x:p.x,y:p.y+p.h*.05};var n=document.querySelector(t);return n?pt(n):null}return t}
Hd.show=function(target,o){o=o||{};Hd.hide();var n=Hd.node=U.el("div","sbx-hand "+(o.gesture==="drag"?"drag":"tap"),SVG);n.setAttribute("aria-hidden","true");document.body.appendChild(n);Hd.t={target:target,o:o,t0:performance.now()};
  U.log("hand",{gesture:o.gesture||"tap",target:typeof target==="string"?target:(target&&target.nodeType?(target.dataset&&(target.dataset.ent||target.dataset.item)||target.className):"pt")});
  function loop(){Hd.raf=0;if(!Hd.node||Hd.node!==n) return;var a=pt(target);if(!a){n.style.opacity="0"}else{n.style.opacity="1";var x=a.x,y=a.y;
      if(o.gesture==="drag"&&o.to){var b=pt(o.to);if(b){var k=((performance.now()-Hd.t.t0)%1800)/1800,e=k<.15?0:k>.85?1:(k-.15)/.7;e=e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2;x=a.x+(b.x-a.x)*e;y=a.y+(b.y-a.y)*e}}
      n.style.transform="translate3d("+(x-18)+"px,"+(y-6)+"px,0)";n.dataset.x=Math.round(x);n.dataset.y=Math.round(y)}
    Hd.raf=requestAnimationFrame(loop)}loop()};
Hd.hide=function(){if(Hd.raf) cancelAnimationFrame(Hd.raf);Hd.raf=0;if(Hd.node){Hd.node.remove();Hd.node=null}Hd.t=null};
Hd.visible=function(){return !!Hd.node};
var I=window.SparkIdle=SB.idle={steps:[5000,15000,30000],timers:[],on:null,cycle:0};
function clear(){I.timers.forEach(clearTimeout);I.timers=[]}
I.watch=function(o){o=o||{};I.steps=o.steps||I.steps;I.on=o.onStep||I.on;I.reset()};
I.reset=function(){clear();Hd.hide();if(!I.on||I.stopped) return;var s=SB.session;if(!s||s.dead) return;
  I.steps.forEach(function(ms,i){I.timers.push(setTimeout(function(){if(SB.voice.speaking()&&i===0){/* wait for Spark to finish talking */}fire(i)},ms))});
  /* after the 3rd step keep offering, every 15 s, never ending anything */
  I.timers.push(setTimeout(function rep(){fire(3);I.timers.push(setTimeout(rep,15000))},I.steps[2]+15000))};
function fire(i){var s=SB.session;if(!s||s.dead||I.paused||document.hidden) return;U.log("idle",{step:i});try{I.on(i)}catch(e){console.error(e)}}
I.stop=function(){I.stopped=true;clear();Hd.hide()};
I.start=function(){I.stopped=false;I.reset()};
I.poke=function(){I.reset()};
var bound=false;I.bind=function(root){if(bound) return;bound=true;
  ["pointerdown","keydown","wheel"].forEach(function(t){document.addEventListener(t,function(e){var s=SB.session;if(!s||s.dead) return;
    /* any tap cuts Spark's line (fast-tap rule), except the hear-again button itself */
    if(t==="pointerdown"&&!(e.target.closest&&e.target.closest(".sbx-again,.sg-btn,.sg-ov"))) SB.voice.cut();
    if(e.target.closest&&e.target.closest(".sg-btn,.sg-ov")) return;I.reset()},true)})};
})();

/* ---- sbx-src/core/97-sparks.js */
/* Sparks (spec §10.9): short optional activities. Every spark has a ✕ that keeps what was earned so far. No quiz step, no fact list:
   at most one spoken fact per run (api.fact), cut off by the next tap. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
SB.defineSpark=function(id,def){def.id=id;SB.sparkDefs[id]=def};
var X='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14L34 34M34 14L14 34" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>';
SB.openSpark=function(id,opts){var s=SB.session,def=SB.sparkDefs[id];if(!s||!def||s.spark) return Promise.resolve(null);opts=opts||{};
  SB.voice.cut();U.disarm();if(s.panel) s.panel.close();
  var A=U.SA(),band=U.band(),blk=s.world.sparks&&s.world.sparks[id]||{},knobs=A?A.difficulty(blk.difficulty||blk,band,window.SparkProgress?SparkProgress.tierFor(s.id,id,undefined):undefined):(U.pick(blk.difficulty||blk,band)||{});
  var node=U.el("div","sbx-spark sbx-sp-"+id);node.dataset.spark=id;node.dataset.band=band;node.setAttribute("role","dialog");node.setAttribute("aria-label",def.label||id);
  var stage=U.el("div","sbx-stage");node.appendChild(stage);var x=U.btn("sbx-x sbx-sparkx","Leave",X);node.appendChild(x);s.root.appendChild(node);
  var run={id:id,t0:performance.now(),wrong:0,hints:0,firstTry:true,facts:0,closed:false,earned:{coins:0,kit:{}},cleanup:[],node:node,stage:stage,band:band};
  s.spark=run;s.root.classList.add("sparking");SB.idle.paused=false;U.log("spark:start",{id:id,band:band});SB.emit("spark:start",{id:id});
  var rec=s.reg.sparks[id]||(s.reg.sparks[id]={plays:0,lastDay:0});
  var finish;var done=new Promise(function(r){finish=r});
  function end(res,how){if(run.closed) return;run.closed=true;run.cleanup.forEach(function(f){try{f()}catch(e){}});SB.voice.cut();SB.hand.hide();U.disarm();
    var ms=Math.round(performance.now()-run.t0);node.remove();s.spark=null;s.root.classList.remove("sparking");rec.plays++;rec.lastDay=s.reg.day;SB.store.save();
    res=res||{};if(A&&how!=="left") try{A.record(s.id,id,{firstTry:run.firstTry,wrong:run.wrong,hints:run.hints,ms:ms})}catch(e){}
    U.log("spark:end",{id:id,how:how,ms:ms,coins:run.earned.coins,kit:run.earned.kit});SB.emit("spark:end",{id:id,how:how,res:res,ms:ms});SB.idle.reset();
    if(s.def.afterSpark) try{s.def.afterSpark(id,res,how)}catch(e){console.error(e)}finish({how:how,res:res,ms:ms})}
  U.onTap(x,function(){U.log("sparkx",{id:id});end(null,"left")});
  var api={
    band:band,knobs:knobs,stage:stage,node:node,run:run,region:s.id,world:s.world,reg:s.reg,rules:U.rules(band),
    say:function(l,o){if(run.closed) return Promise.resolve(false);return SB.voice.say(l,o)},
    count:function(n){return SB.voice.count(n)},word:function(w){return SB.voice.word(w)},
    fact:function(l){if(run.closed||run.facts>=1){U.log("factblocked",{id:id});return Promise.resolve(false)}run.facts++;return SB.voice.say(l,{kind:"fact"})},
    drag:U.drag,onTap:U.onTap,burst:U.burst,floatUp:U.floatUp,el:U.el,btn:U.btn,$:function(q){return stage.querySelector(q)},$$:function(q){return U.$$(q,stage)},
    sleep:function(ms){return new Promise(function(r){setTimeout(r,ms)})},pick:U.pick,reduced:U.reduced,sfx:U.sfx,anim:U.anim,img:SB.img,
    topInset:function(){return 86},
    hand:function(t,g,to){SB.hand.show(t,{gesture:g||"tap",to:to})},unhand:function(){SB.hand.hide()},
    hint:function(fn){run.hint=fn;SB.idle.reset()},
    learn:function(skill,ok,assisted){SB.learn.moment(skill,{ok:ok,assisted:!!assisted,region:s.id,spark:id});if(!ok){run.wrong++;run.firstTry=false}},
    give:function(g){g=g||{};var p=Promise.resolve();if(g.kit) Object.keys(g.kit).forEach(function(k){SB.kit.add(k,g.kit[k]);run.earned.kit[k]=(run.earned.kit[k]|0)+g.kit[k]});
      if(g.coins){SB.econ.earn(g.coins,{src:g.src||"job",region:s.id,spark:id,item:g.item});run.earned.coins+=g.coins;p=SB.hud.flyCoins(g.from||{x:innerWidth/2,y:innerHeight/2},g.coins)}return p},
    onCleanup:function(f){run.cleanup.push(f)},
    get closed(){return run.closed},
    close:function(res){end(res,"done")}
  };
  run.api=api;run.end=end;
  setTimeout(function(){try{var p=def.start(api,knobs,opts);if(p&&p.then) p.then(function(r){if(!run.closed) end(r,"done")},function(e){console.error(e);end(null,"error")})}catch(e){console.error(e);end(null,"error")}},0);
  return done};
SB.closeSpark=function(){var s=SB.session;if(s&&s.spark) s.spark.end(null,"left")};
/* restart an open spark at the new band when the age changes; the world stays */
window.addEventListener("spark:agechange",function(){var s=SB.session;if(!s||s.dead) return;var sp=s.spark;
  var p=SB.store.profile();if(p){p.age=U.age();SB.store.save()}
  if(sp){var id=sp.id;sp.cleanup.forEach(function(f){try{f()}catch(e){}});sp.cleanup=[];sp.closed=true;sp.node.remove();s.spark=null;s.root.classList.remove("sparking");SB.openSpark(id)}
  SB.emit("band",{band:U.band()})});
})();

/* ---- sbx-src/core/99-region.js */
/* Regions (spec §10.3): defineRegion / open / close. Open = loader -> player picker (tap your animal) -> 8 s intro with Skip
   (first visit per player only) -> the world, where everything can be started from the first frame. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,BASE=SB.BASE;
var SNOW='<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"><path d="M32 6v52M9.5 19l45 26M9.5 45l45-26"/><path d="M26 10l6 6 6-6M26 54l6-6 6 6M8 26l8 0-2 8M56 38l-8 0 2-8M8 38l8 0-2-8M56 26l-8 0 2 8"/></g></svg>';
var SKIP='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10l16 14-16 14zM24 10l16 14-16 14z" fill="#fff"/></svg>';
var cache={};
function j(u){return cache[u]||(cache[u]=fetch(u).then(function(r){if(!r.ok) throw new Error(u+" "+r.status);return r.json()}).catch(function(e){delete cache[u];throw e}))}
function wantHD(){if(wantHD.r!=null) return wantHD.r;var d=window.devicePixelRatio||1,c=navigator.connection||{},L=Math.max(screen.width||0,screen.height||0,innerWidth||0),w=L*d;
  return wantHD.r=!!(L>=1280&&w>=2400&&!c.saveData&&!(c.effectiveType&&/2g|3g/.test(c.effectiveType))&&!(navigator.deviceMemory&&navigator.deviceMemory<4))}
function bigScreen(){var dpr=window.devicePixelRatio||1,sw=Math.max(screen.width||0,innerWidth||0)*dpr,c=navigator.connection||{};
  if(sw<2500||c.saveData||(c.effectiveType&&c.effectiveType!=="4g")||(navigator.deviceMemory&&navigator.deviceMemory<=4)) return false;if(/iPhone|iPad|Android/i.test(navigator.userAgent)) return false;return true}
SB.wantHD=wantHD;
/* asset url: "sbx/x" = new sandbox cut-outs (img/sbx/manifest.json); otherwise the classic Arctic art with its .4k.webp choice */
SB.avaHtml=function(id,src){id=id||"fox";if(window.SparkAva&&SparkAva.html) return SparkAva.html(id);
  return '<span class="sf-ava sf-ava-'+id+'" data-ava="'+id+'"><img alt="" draggable="false" src="'+(src||"")+'"><span class="sf-ava-spark" aria-hidden="true"><i></i><i></i></span></span>'};
SB.img=function(a,region){var s=SB.session,r=region||(s&&s.id)||"arctic",m=SB.meta[r]||{};if(!a) return "";
  if(a.indexOf("avatars/")===0) return BASE+r+"/img/"+a+(a.indexOf("?")>=0?"":"?v=2");
  if(a.indexOf("sbx/")===0){var n=a.slice(4),e=(m.man||{})[n];return BASE+r+"/img/sbx/"+n+".webp"+(e?"?v="+e.v:"")}
  var c=(m.cfg&&m.cfg.assets||{})[a];if(c&&c.hd&&c.hd.file&&wantHD()) return BASE+r+"/img/"+c.hd.file+"?v="+c.hd.v;return BASE+r+"/img/"+a+".webp"+(c&&c.v?"?v="+c.v:"")};
SB.dims=function(a,region){var s=SB.session,r=region||(s&&s.id),m=SB.meta[r]||{};if(!a) return null;if(a.indexOf("sbx/")===0){var e=(m.man||{})[a.slice(4)];return e?{w:e.w,h:e.h}:null}var c=(m.cfg&&m.cfg.assets||{})[a];return c?{w:c.w,h:c.h}:null};
SB.meta={};
SB.defineRegion=function(id,def){def.id=id;def.types=def.types||{};SB.regions[id]=def;return def};
function loadMeta(id,def){var b=BASE+id+"/";return Promise.all([j(b+"config.json"),j(b+"img/sbx/manifest.json"),j(b+"world.json"),j("sbx/items.json"),j("sbx/skills.json"),SB.voice.load(b+"voice/voice.json",b+"voice/")]).then(function(a){
  SB.meta[id]={cfg:a[0],man:a[1]};SB.kit.setItems(a[3]);SB.learn.setSkills(a[4]);return {cfg:a[0],world:a[2]}})}
function hold(root){var h=U.el("div","sbx-load",'<span class="sbx-flake">'+SNOW+'</span>');h.setAttribute("role","status");h.setAttribute("aria-label","Loading");root.appendChild(h);return h}
var opening=null;
SB.open=function(id,o){o=o||{};var def=SB.regions[id];if(!def) return Promise.reject(new Error("no sandbox region "+id));if(opening) return opening;
  if(SB.session) SB.close(true);SB.ac();
  var s=SB.session={id:id,def:def,root:U.el("div","sbx"),dead:false,cleanup:[],spark:null,scene:null,panel:null,paused:false,t0:performance.now()};
  s.root.setAttribute("role","dialog");s.root.setAttribute("aria-label","Arctic ice camp");s.root.dataset.region=id;document.body.appendChild(s.root);document.body.classList.add("spark-area","sbx-on");
  var ld=hold(s.root);U.log("open",{id:id});SB.store.reload();
  var picked=false;
  return opening=loadMeta(id,def).then(function(m){s.cfg=m.cfg;s.world=m.world;s.root.dataset.band=U.band();
    if(!A3D(id))ld.remove();var st=SB.store,profs=st.profiles();
    /* Arctic 3D (Allen 4:20 PM): no picker on the Arctic path; the child is already in their own account, so use the active profile
       (a device with no save yet gets one quietly, at the parent-set age) */
    if(A3D(id)){var ap=st.profile();if(!ap){if(profs.length) st.setActive(profs[0].id);else st.newProfile(Object.keys(def.pics)[0],U.age())}/* items 3+7: a brand-new kid picks an age + makes an explorer first */return window.SparkKidSetup?SparkKidSetup.gate(SB):null}
    if(!o.picker&&profs.length===1){st.setActive(profs[0].id);return null}
    if(!o.picker&&st.profile()&&profs.length>1&&o.keepActive) return null;
    picked=true;return picker(s)}).then(function(){if(s.dead) return;opening=null;var p=SB.store.profile();var A=U.SA();
    /* age only changes when a grown-up picks it (parent panel, or the player picker). Auto-entry never overwrites sparkAge. */
    if(picked&&A&&A.setProfileAge&&p.age&&!p.ageBand&&p.age!==U.age()) A.setProfileAge(p.age);/* a kid with its own ageBand never rewrites the device age */
    else if(p&&p.age!==U.age()){p.age=U.age();SB.store.save(true)}
    legacyImport(s,p);s.profile=p;p.lastRegion=id;s.reg=SB.store.region(id,function(r){r.seed=def.seed||48211;if(def.initRegion) def.initRegion(r,s.world)});SB.store.save();
    s.root.dataset.band=U.band();
    /* the world is built behind the intro, so camp is ready the moment the film ends or Skip is tapped (review item 4) */
    /* P3 1g: the intro film plays once per device (a second player or a reload never replays it) */
    var dd=SB.store.doc();dd.introSeen=dd.introSeen||{};if(s.reg.introSeen) dd.introSeen[id]=1;if(dd.introSeen[id]) s.reg.introSeen=true;
    if(A3D(id)) return mount3d(s,p);
    if(!s.reg.introSeen&&!o.noIntro){dd.introSeen[id]=1;var ip=intro(s);return world(s,ip)}return world(s)}).then(function(){opening=null;return s},function(e){opening=null;try{console.error("sandbox failed",e)}catch(x){}SB.close(true);throw e})};
/* ---------------------------------------------------------------- Arctic 3D: isolated ES module (site/arctic3d), own save key. ?a3d=0 keeps the 2D sandbox */
function A3D(id){if(id!=="arctic") return false;try{if(new URLSearchParams(location.search).get("a3d")==="0"||localStorage.getItem("sparkA3dV1")==="0") return false}catch(e){}return true}
function mount3d(s,p){H().classList.remove("sbx-boot");if(!document.querySelector("link[data-a3d]")){var l=document.createElement("link");l.rel="stylesheet";l.href="arctic3d/a3d.css?v=23";l.setAttribute("data-a3d","1");document.head.appendChild(l)}
  var ld=s.root.querySelector(".sbx-load")||hold(s.root);return import(new URL("arctic3d/a3d.js?v=44",document.baseURI).href).then(function(m){
    if(s.dead){if(ld&&ld.parentNode)ld.remove();return}
    var h=m.mount(s.root,{pid:SB.store.doc().active,age:U.age(),coins:function(){return SB.econ.balance()},earn:function(n,item){SB.econ.earn(n,{src:"job",region:"arctic",item:item});SB.store.save(true)},spend:function(n,item){var r=SB.econ.spend(n,{item:item,region:"arctic"});SB.store.save(true);return !!r.ok},onExit:function(){SB.close();/* spark17 (Tester 11/16, replaces P6C): back from the Arctic goes to the North America map, like Savannah -> Africa */if(window.SparkBackToMap) SparkBackToMap("North America");else{try{var go=window.returnToSolarSystemHome||window.goPlatformHome;if(go) go({announce:false});else if(typeof window.show==='function') window.show('home')}catch(e){}}}});s.cleanup.push(function(){h.dispose()});U.log("world",{a3d:true});
    /* spark35: keep the loader until a few frames have painted (avoids a white first frame on swiftshader) */
    var n=0;function tick(){n++;if(n<5){requestAnimationFrame(tick);return}if(ld&&ld.parentNode)ld.remove()}requestAnimationFrame(tick)})}
/* ---------------------------------------------------------------- player picker: one save per child, chosen by an animal photo */
function H(){return document.documentElement}
function picker(s,po){po=po||{};return new Promise(function(done0){/* items 3+7: a NEW player made here goes through the new-kid flow before playing */var done=function(){var K=window.SparkKidSetup;(K?K.gate(SB):Promise.resolve()).then(function(){done0()},function(){done0()})};var def=s.def,ov=U.el("div","sbx-picker");ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Who is playing?");
  var row=U.el("div","sbx-pics");ov.appendChild(row);s.root.appendChild(ov);var used={};SB.store.profiles().forEach(function(p){used[p.pic]=p.id});
  var back=U.btn("sbx-hudb sbx-back sbx-pback","Back to the map",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>');ov.appendChild(back);U.onTap(back,function(){idle.stop();if(po.onBack){ov.remove();po.onBack();return}SB.close()});
  /* Skip from the first frame (review item 4): keeps the last player, or makes a new one with the first free animal */
  var skip=U.btn("sbx-hudb sbx-skip sbx-pskip","Skip",SKIP);ov.appendChild(skip);
  U.onTap(skip,function(){SB.voice.cut();var d=SB.store.doc(),a=d.active&&d.profiles[d.active];if(a){U.log("pick",{pic:a.pic,existing:true,skip:true})}else{var k=Object.keys(def.pics).filter(function(k){return !used[k]})[0]||Object.keys(def.pics)[0];if(used[k]) SB.store.setActive(used[k]);else SB.store.newProfile(k,newAge);U.log("pick",{pic:k,existing:!!used[k],skip:true,age:newAge})}
    idle.stop();ov.remove();done()});
  var first=null;Object.keys(def.pics).forEach(function(k){var P=def.pics[k],b=U.btn("sbx-pic"+(used[k]?" used":""),(used[k]?"Keep playing as the ":"Play as the ")+P.label,SB.avaHtml(k,SB.img(P.pic))+(used[k]?'<span class="sbx-mine" aria-hidden="true">'+SNOW+'</span>':""));b.dataset.pic=k;row.appendChild(b);if(!first||(used[k]&&!used[first.dataset.pic])) first=b;
    U.onTap(b,function(){SB.voice.cut();U.sfx("happy");U.anim(b,"a-jump",500);if(window.SparkAva) SparkAva.pop(b);U.log("pick",{pic:k,existing:!!used[k]});
      if(used[k]) SB.store.setActive(used[k]);else SB.store.newProfile(k,newAge);U.log("newage",{age:used[k]?null:newAge});setTimeout(function(){SB.hand.hide();idle.stop();ov.remove();done()},350)})});
  /* grown-ups: hold the small age chip 1 s to choose the age for a NEW save; the default is the parent-set age. Ages are kept per save. */
  var newAge=U.age(),chip=U.btn("sbx-agechip","Age for a new player (grown-ups: hold)",'<span>'+newAge+'</span>');ov.appendChild(chip);var ht=0;
  chip.addEventListener("pointerdown",function(e){e.stopPropagation();clearTimeout(ht);ht=setTimeout(function(){var row2=U.el("div","sbx-agerow");for(var a=4;a<=14;a++){(function(a){var b=U.btn("sbx-agebtn"+(a===newAge?" on":""),"Age "+a,String(a));row2.appendChild(b);U.onTap(b,function(){newAge=a;chip.querySelector("span").textContent=a;row2.remove();U.log("pickage",{age:a})})})(a)}ov.appendChild(row2)},1000)});
  chip.addEventListener("pointerup",function(){clearTimeout(ht)});chip.addEventListener("pointerleave",function(){clearTimeout(ht)});
  SB.voice.say("who_playing");var idle=pickIdle(U.$$(".sbx-pic",row));s.cleanup.push(function(){idle.stop()})})}
/* idle: the voice says "tap your animal", so the hand visits every animal in turn rather than pointing at one (review item 16) */
function pickIdle(all){var tm=[],sw=0,i=0;function sweep(){clearInterval(sw);i=0;SB.hand.show(all[0]);sw=setInterval(function(){i=(i+1)%all.length;SB.hand.show(all[i])},1300)}
  function arm(){tm.forEach(clearTimeout);clearInterval(sw);SB.hand.hide();tm=[setTimeout(sweep,5000),setTimeout(function(){SB.voice.say("who_playing")},15000)]}
  var f=function(){arm()};document.addEventListener("pointerdown",f,true);arm();return {stop:function(){tm.forEach(clearTimeout);clearInterval(sw);document.removeEventListener("pointerdown",f,true);SB.hand.hide()}}}
/* boot (sbx-boot.js): picker on a first visit or with 2+ players, then straight into the player's last region (or the Arctic) */
SB.boot=function(b){var id=b.region||"arctic",def=SB.regions[id];if(!def){H().classList.remove("sbx-boot");return Promise.resolve(null)}SB.store.reload();
  if(b.mode==="resume") return SB.open(id,{keepActive:true,boot:true});
  var root=U.el("div","sbx sbx-bootpick");root.dataset.region=id;document.body.appendChild(root);document.body.classList.add("sbx-on");var s={root:root,def:def,cleanup:[],id:id};
  U.log("boot",{mode:b.mode});
  return loadMeta(id,def).then(function(m){preload(id,m);var left=false;
    return picker(s,{onBack:function(){left=true}}).then(function(){s.cleanup.forEach(function(f){try{f()}catch(e){}});root.remove();
      if(left){document.body.classList.remove("sbx-on");H().classList.remove("sbx-boot");return null}
      var p=SB.store.profile();var to=p&&p.lastRegion&&SB.regions[p.lastRegion]?p.lastRegion:id;return SB.open(to,{keepActive:true,boot:true})})})};
/* warm the cache while the child is choosing: intro film, panorama strip */
function preload(id,m){try{var I=SB.regions[id].intro,vn=bigScreen()&&I.hd?I.hd:I.file,meta=(m.world.video||{})[vn]||{};var v=document.createElement("video");v.preload="auto";v.muted=true;v.src=BASE+id+"/"+vn+(meta.v?"?v="+meta.v:"");v.load();preload.v=v;
  var st=m.cfg.strip,src=BASE+id+"/"+(st.hd&&st.hd.file&&wantHD()?st.hd.file+"?v="+st.hd.v:st.file+"?v="+st.v);var im=new Image();im.src=src;preload.im=im}catch(e){}}
SB.switchPlayer=function(){var s=SB.session;if(!s) return;var id=s.id;SB.close(true);SB.open(id,{picker:true})};
/* ---------------------------------------------------------------- one-time import of the classic Arctic save (read only; never written) */
function legacyImport(s,p){var d=SB.store.doc(),tag="sparkAreasV3:"+s.id;if(d.legacy.imported.indexOf(tag)>=0||!p) return;var raw=null;try{raw=localStorage.getItem("sparkAreasV3")}catch(e){}
  d.legacy.imported.push(tag);d.legacy.at=Date.now();d.legacy.to=d.active;var v=null;try{v=raw?JSON.parse(raw):null}catch(e){}var a=v&&v[s.id];
  if(a){var badge=!!a.badge,gear={};Object.keys(a.bands||{}).forEach(function(b){var x=a.bands[b]||{};if(x.badge) badge=true;(x.gear||[]).forEach(function(g){gear[g]=1})});
    Object.keys(gear).forEach(function(g){var it=SB.kit.item(g);if(it&&(it.type==="wear"||it.type==="tool")){SB.kit.add(g,1);if(it.type==="wear"&&p.wear.indexOf(g)<0) p.wear.push(g)}});
    if(badge){SB.kit.add("flag_explorer",1)}U.log("legacy",{badge:badge,gear:Object.keys(gear)})}
  SB.store.save()}
/* ---------------------------------------------------------------- intro: <= 10 s, Skip from the first frame, first visit per player only */
function intro(s,replay){return new Promise(function(done){var I=s.def.intro,vids=s.cfg.video||{},vn=bigScreen()&&I.hd?I.hd:I.file,ov=U.el("div","sbx-intro");
  var meta=(s.world.video||{})[vn]||{};var v=document.createElement("video");v.className="sbx-film";v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("muted","");v.autoplay=true;v.preload="auto";v.disablePictureInPicture=true;
  var ld=U.el("span","sbx-flake",SNOW);var skip=U.btn("sbx-hudb sbx-skip","Skip the movie",SKIP);ov.appendChild(v);ov.appendChild(ld);ov.appendChild(skip);s.root.appendChild(ov);U.log("intro",{file:vn});
  var fin=false,wd=0;function end(how){if(fin) return;fin=true;clearTimeout(wd);U.log("introend",{how:how,t:v.currentTime});try{v.pause();v.removeAttribute("src");v.load()}catch(e){}ov.remove();if(!replay){s.reg.introSeen=true;SB.store.save(true)}done()}
  U.onTap(skip,function(){end("skip")});v.addEventListener("ended",function(){end("ended")});v.addEventListener("error",function(){end("error")});
  v.addEventListener("playing",function(){ld.remove()});v.addEventListener("loadedmetadata",function(){U.log("introdur",{d:v.duration})});
  /* hard caps (review item 4): the whole intro ends by 8 s, and a film that has not started within 1.5 s is dropped (slow network) */
  var started=false;v.addEventListener("playing",function(){started=true});wd=setTimeout(function(){end("cap")},(I.capSeconds||8)*1000);setTimeout(function(){if(!started) end("slow")},1500);
  v.src=BASE+s.id+"/"+vn+(meta.v?"?v="+meta.v:"");var p=v.play();if(p&&p.catch) p.catch(function(){})})}
SB.playIntro=function(){var s=SB.session;if(!s||!s.world) return;if(SB.idle) SB.idle.paused=true;intro(s,true).then(function(){SB.idle.paused=false;SB.idle.reset()})};
/* ---------------------------------------------------------------- the world */
function world(s,gate){var def=s.def,W=s.world,root=s.root;SB.ecs.reset();
  var strip=s.cfg.strip,src=BASE+s.id+"/"+(strip.hd&&strip.hd.file&&wantHD()?strip.hd.file+"?v="+strip.hd.v:strip.file+"?v="+strip.v);
  var start=W.start||{spot:0,x:50},sp=s.reg.spot!=null&&s.reg.flags.moved?s.reg.spot:start.spot;
  var pano=s.pano=new SB.Pano(root,{src:src,center:sp*SB.PANO.STEP+((sp===start.spot?start.x:50)/100)*SB.PANO.DW,label:"The ice camp. Drag to look around."});
  s.cleanup.push(SB.on("spot",function(e){if(s.reg.spot!==e.spot){s.reg.spot=e.spot;s.reg.flags.moved=1;SB.store.save()}if(def.onSpot) def.onSpot(e.spot)}));
  root.classList.toggle("sbx-k",U.band()==="k");
  W.ents.forEach(function(e){addEnt(s,e)});
  SB.hud.build(s);SB.hud.player();SB.learn.hookPanel();
  SB.idle.bind(root);SB.idle.paused=!!gate;SB.idle.watch({steps:[5000,15000,30000],onStep:function(i){if(s.spark){if(s.spark.hint) s.spark.hint(i);return}if(s.scene&&s.scene.hint){s.scene.hint(i);return}if(s.panel) return;if(def.idle) def.idle(i)}});
  s.keys=function(e){if(s.spark||s.panel) return;if(e.key==="ArrowLeft"){e.preventDefault();pano.snap(-1)}else if(e.key==="ArrowRight"){e.preventDefault();pano.snap(1)}};document.addEventListener("keydown",s.keys);
  if(def.systems) def.systems(SB.ecs);SB.ecs.start();
  s.cleanup.push(SB.on("band",function(){root.dataset.band=U.band();root.classList.toggle("sbx-k",U.band()==="k");pano.layout();SB.hud.coins(SB.econ.balance());if(def.onBand) def.onBand(U.band())}));
  return Promise.all([pano.ready,gate]).then(function(){if(s.dead) return;H().classList.remove("sbx-boot");if(gate){SB.idle.paused=false;SB.idle.reset()}U.log("world",{band:U.band()});s.worldAt=performance.now();if(def.enter) def.enter(s)})}
SB.ent=function(id){return SB.ecs.get(id)};
SB.node=function(id){var s=SB.session,it=s&&s.pano&&s.pano.item(id);return it?it.n:null};
function addEnt(s,e){var def=s.def,saved=s.reg.ents[e.id];if(!saved){saved=JSON.parse(JSON.stringify(e.init||{}));s.reg.ents[e.id]=saved}var ent=SB.ecs.add(e,saved);ent.live=saved;
  var T=def.types[e.type]||{};var a=e.sprite&&e.sprite.asset,d=SB.dims(a);ent.aspect=e.aspect||(d?d.w/d.h:1);
  var n=T.make?T.make(ent,s):null;if(!n){n=U.el("div","sbx-e-"+e.type);n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" decoding="async" src="'+SB.img(a)+'"></div>'}
  if(!n.querySelector(".sbx-hit")) n.insertBefore(U.el("span","sbx-hit"),n.firstChild);
  if(e.label){n.setAttribute("role","button");n.setAttribute("aria-label",U.pick(e.label));n.tabIndex=0}n.dataset.type=e.type;
  s.pano.add(ent,n);if(T.mount) T.mount(ent,n,s);
  var downBusy=false;if(T.tap||e.tap) U.onTap(n,function(ev){if(s.spark||s.scene) return;if(downBusy||(s.pano&&s.pano.autoBusy())){U.log("tapblocked",{ent:e.id});return}SB.voice.cut();U.disarm();U.log("tap",{ent:e.id});SB.emit("tap",{id:e.id});if(T.tap) T.tap(ent,n,ev,s);else genericTap(ent,n,s)},{down:function(){downBusy=!!(s.pano&&s.pano.autoBusy())}});
  return ent}
SB.addEnt=function(e){return addEnt(SB.session,e)};
function genericTap(ent,n,s){var t=ent.tap||{};if(t.anim) U.anim(n.querySelector(".sbx-body")||n,"a-"+t.anim,900);if(t.sfx) U.sfx(t.sfx);if(t.opens) SB.openSpark(t.opens,{from:ent.id});else if(t.line) SB.voice.say(t.line)}
/* drops: what world entity is under a point */
SB.entAt=function(x,y){var n=U.hitEnt(x,y,".sbx-ent");return n?SB.ecs.get(n.dataset.ent):null};
/* ---------------------------------------------------------------- scenes (inside the igloo, the fox den): a second backdrop over the world */
SB.scene=function(o){var s=SB.session;if(s.scene) s.scene.close();var n=U.el("div","sbx-scene "+(o.cls||""));n.setAttribute("role","dialog");n.setAttribute("aria-label",o.label||"");
  if(o.bg) n.style.backgroundImage="url("+o.bg+")";var st=U.el("div","sbx-sstage");n.appendChild(st);s.root.insertBefore(n,SB.hud.ui);s.root.classList.add("inscene");
  var sc={node:n,stage:st,hint:o.hint||null,cleanup:[],close:function(){if(sc.closed) return;sc.closed=true;sc.cleanup.forEach(function(f){try{f()}catch(e){}});n.remove();s.scene=null;s.root.classList.remove("inscene");SB.hand.hide();SB.hud.back.setAttribute("aria-label","Back to the map");U.log("scene:end",{id:o.id});if(o.onClose) o.onClose();SB.idle.reset()}};
  s.scene=sc;SB.hud.back.setAttribute("aria-label","Back outside");U.log("scene",{id:o.id});SB.emit("scene",{id:o.id});SB.idle.reset();return sc};
SB.back=function(){var s=SB.session;if(!s) return;SB.voice.cut();if(s.panel){s.panel.close();return}if(s.spark){s.spark.end(null,"left");return}if(s.scene){s.scene.close();return}SB.close()};
SB.close=function(silent){var s=SB.session;if(!s) return;s.dead=true;opening=null;try{if(s.spark) s.spark.cleanup.forEach(function(f){f()})}catch(e){}SB.voice.cut();SB.hand.hide();SB.idle.stop();SB.ecs.stop();U.disarm();
  if(!silent){var pr=SB.store.profile();if(pr&&pr.lastRegion===s.id){pr.lastRegion=null;SB.store.save(true)}}H().classList.remove("sbx-boot");
  s.cleanup.forEach(function(f){try{f()}catch(e){}});if(s.keys) document.removeEventListener("keydown",s.keys);if(s.pano) s.pano.destroy();
  U.$$("video",s.root).forEach(function(v){try{v.pause();v.removeAttribute("src");v.load()}catch(e){}});SB.store.flush();s.root.remove();SB.session=null;
  document.body.classList.remove("spark-area","sbx-on");U.$$(".sbx-ghost,.sbx-fx,.sbx-flycoin,.sbx-hand").forEach(function(n){n.remove()});SB.voice.cap=null;
  var C=document.getElementById("sparkCompanion");if(C) C.dataset.state="idle";U.log("close",{});if(!silent){window.dispatchEvent(new Event("resize"));
    /* P3 1g: Back from camp lands on the Earth globe with the big Arctic picture, never on the Solar System page */
    try{var m=document.getElementById("earthMap"),on=m&&m.getBoundingClientRect().width>0&&getComputedStyle(m).display!=="none";if(!on&&window.openPlanet){window.openPlanet({preventDefault:function(){},stopPropagation:function(){}},"Earth");U.log("toearth",{})}}catch(e){try{console.error(e)}catch(x){}}}};
/* test + evidence hook */
SB._state=function(){var s=SB.session;if(!s) return null;var p=SB.store.profile();return {id:s.id,band:U.band(),age:U.age(),profile:SB.store.doc().active,pic:p&&p.pic,coins:SB.econ.balance(),kit:p?JSON.parse(JSON.stringify(p.kit)):{},wear:p?p.wear.slice():[],wishes:p?p.wishes.slice():[],
  spark:s.spark?s.spark.id:null,scene:s.scene?true:false,panel:!!s.panel,center:s.pano?s.pano.center:null,spot:s.pano?s.pano.spot:null,day:s.reg?s.reg.day:null,reg:s.reg?JSON.parse(JSON.stringify(s.reg)):null,world:!!s.worldAt,
  ents:s.reg?JSON.parse(JSON.stringify(s.reg.ents)):{},learn:SB.learn.summary(),ledger:SB.econ.ledger(50)}};
})();

