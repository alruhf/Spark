/* Spark areas v2 (lazy-loaded by areas-loader.js).  Same SHAPE as the Savannah safari, one engine, three data files (areas/<id>/game.json + config.json):
   intro FILM -> base camp 360 (Spark right, backpack left of Spark; earn gear with small picture challenges, drag it into the pack) -> Go bubble ->
   journey of 4 stops (short ride, then a hands-on activity with Spark fun facts while you play, ONE picture question, a sticker) -> badge finale.
   Patterns reused from station.js / safari.js (not their code): pre-blended wrap-around strip, Spark's speechSynthesis voice, fly-to-pack, picture question card, Next-stop button. */
(function(){
"use strict";
if(window.SparkAreas) return;
var STORE="sparkAreasV3",OLDSTORE="sparkAreasV2", BASE="areas/", V="8", STEP=1680, DW=1920, DH=1080, LOOP=6720;
var ART=window.SparkAreasArt||{svg:function(){return ""},has:function(){return false}};
var cfgs={}, ses=null, mods={}, narrTok=0, curEnd=null, lastLine="", AC=null, opening=false, tokSeq=0;

/* ------------------------------------------------------------ helpers */
function SA(){return window.SparkAge&&window.SparkAge.v>=2?window.SparkAge:null}
function age(){if(SA()) return SA().age;return Number(window.S&&window.S.age)||Number(localStorage.getItem("sparkAge"))||Number(document.getElementById("age")&&document.getElementById("age").value)||6}
function liveBand(){var a=age();return SA()?SA().keyFor(a):(a<=6?"k":a<=9?"e":a<=12?"u":"t")}
function band(){return (ses&&ses.band)||liveBand()}
function snapBand(){if(ses){ses.band=liveBand();ses.lastAge=age();ses.tier=SA()?SA().tier:1;if(ses.root){ses.root.classList.toggle("ar2-bk",ses.band==="k");ses.root.dataset.band=ses.band}}}
function lvl(){return {k:"lo",e:"mid",u:"hi",t:"hi"}[band()]}
function pick(o){if(o==null) return "";if(typeof o==="string"||typeof o==="number") return o;if(SA()&&SA().hasBands(o)){var v=SA().pick(o,band());return v==null?"":v}return o[lvl()]!=null?o[lvl()]:(o.mid!=null?o.mid:o.lo)}
function $(s,e){return (e||document).querySelector(s)}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function mod(a,n){return ((a%n)+n)%n}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function reduced(){return window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE)||"{}")||{}}catch(e){return {}}}
function saveStore(o){try{localStorage.setItem(STORE,JSON.stringify(o))}catch(e){}}
function blank(){return {gear:[],stops:{},stickers:[]}}
function areaRec(s){var r=s[ses.id];if(!r||!r.bands){r=s[ses.id]={bands:{},badge:r&&r.badge||null};try{var old=JSON.parse(localStorage.getItem(OLDSTORE)||"{}")||{};if(old[ses.id]){r.bands[band()]=old[ses.id];if(old[ses.id].badge) r.badge=old[ses.id].badge}}catch(e){}}return r}
function prog(){var s=loadStore(),r=areaRec(s),p=r.bands[band()]||blank();if(r.badge&&!p.badge) p.badge=r.badge;return p}
function mut(fn){var s=loadStore(),r=areaRec(s),p=r.bands[band()]||(r.bands[band()]=blank());if(r.badge&&!p.badge) p.badge=r.badge;fn(p);if(p.badge&&!r.badge) r.badge=p.badge;saveStore(s);return p}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function newTok(){return ses?(ses.tok=++tokSeq):0}
function live(t){return !!ses&&!ses.dead&&(t==null||ses.tok===t)}
function byLvl(o){var v=pick(o);return typeof v==="number"?v:Number(v)||0}

/* ------------------------------------------------------------ Spark's voice (same mechanism as station.js / safari.js) */
function voiceOn(){return !(window.S&&window.S.voice===false)&&!!window.SparkVoice}
function sparkVoice(){return null}/* spark12: no browser voice */
function setSpark(s){var C=window.SparkCompanion;if(C&&C.setState){try{C.setState(s);return}catch(e){}}var e=document.getElementById("sparkCompanion");if(e) e.dataset.state=s}
function setCap(t){if(!ses||!ses.cap) return;ses.capText.textContent=t||"";ses.cap.classList.toggle("off",!t);if(t){ses.cap.classList.remove("pop");void ses.cap.offsetWidth;ses.cap.classList.add("pop")}}
function say(line,o){
  o=o||{};var text=pick(line);if(typeof text!=="string") text=text==null?"":String(text);
  if(/\[object Object\]|\bundefined\b|\bNaN\b/.test(text)) try{console.error("Spark line has a template bug: "+text)}catch(e){}
  var tok=++narrTok;if(o.cap!==false&&text){lastLine=text;setCap(text)}
  if(ses) ses.spoken.push(text);
  return new Promise(function(res){
    var done=false,wd=0;
    /* resolves true when the line was heard to the end, false when a newer line or hush() cut it short */
    function end(skip){if(done) return;done=true;clearTimeout(wd);if(tok===narrTok&&skip!==true) setSpark(o.after||"idle");res(skip!==true)}
    var prev=curEnd;curEnd=end;if(prev) prev(true);
    if(!text){end();return}
    setSpark(o.state||"speaking");
    if(!voiceOn()){wd=setTimeout(end,Math.max(o.gap||700,text.length*(o.cps||40)));return}
    /* spark12: one voice path - SparkVoice plays the Ava clip when one is recorded; otherwise the caption shows and the line keeps its timing */
    wd=setTimeout(end,Math.max(1500,text.length*95+900));
    try{SparkVoice.say(text,{owner:"classic",kind:"classic",cap:false,onend:function(h){if(h!==false) end()}})}catch(err){end()}
  });
}
function hush(){narrTok++;if(curEnd){var c=curEnd;curEnd=null;c(true)}try{window.SparkVoice&&SparkVoice.stop("classic")}catch(e){}setSpark("idle")}

/* ------------------------------------------------------------ sounds (WebAudio, off when Spark's voice is off) */
function ac(){
  if(window.S&&window.S.voice===false) return null;
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=false}}
  if(AC&&AC.state==="suspended"){try{AC.resume()}catch(e){}}
  return AC||null;
}
function tone(freqs,dur,type,vol,gap){
  var a=ac();if(!a) return;var t=a.currentTime;gap=gap||.09;
  freqs.forEach(function(f,i){var o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*gap);g.gain.linearRampToValueAtTime(vol||.07,t+i*gap+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*gap+dur);
    o.connect(g);g.connect(a.destination);o.start(t+i*gap);o.stop(t+i*gap+dur+.05)});
}
function sfx(n,f){if(n==="no"&&ses&&ses.st&&ses.mode==="stop") ses.st.wrong++;
  try{
    if(n==="ok") tone([523,659,784],.35,"sine",.07);
    else if(n==="no") tone([260,200],.28,"triangle",.05);
    else if(n==="win") tone([523,659,784,1047,1319],.5,"sine",.08,.11);
    else if(n==="click") tone([1400,900],.08,"square",.03);
    else if(n==="pop") tone([700,990],.12,"sine",.05);
    else if(n==="thunk") tone([180,120],.18,"triangle",.09,.05);
    else if(n==="splash") tone([420,260,180],.22,"sine",.06,.06);
    else if(n==="note") tone([f||440],.6,"sine",.07);
    else if(n==="shutter") tone([1800,900],.07,"square",.04,.05);
    else if(n==="munch") tone([300,240,300,240],.09,"square",.03,.08);
    else if(n==="whoosh") tone([220,330,440],.2,"sine",.03,.05);
  }catch(e){}
}

/* ------------------------------------------------------------ pictures: real asset first, drawn placeholder second */
function asset(id){return ses&&ses.cfg.assets&&ses.cfg.assets[id]||null}
function wantHD(){if(wantHD.r!=null) return wantHD.r;var d=window.devicePixelRatio||1,c=navigator.connection||{},L=Math.max(screen.width||0,screen.height||0,innerWidth||0),w=L*d;
  return wantHD.r=!!(L>=1280&&w>=2400&&!c.saveData&&!(c.effectiveType&&/2g|3g/.test(c.effectiveType))&&!(navigator.deviceMemory&&navigator.deviceMemory<4))}
function aurl(id){var a=asset(id);if(!a) return "";if(a.hd&&a.hd.file&&wantHD()) return BASE+ses.id+"/img/"+a.hd.file+"?v="+a.hd.v;return BASE+ses.id+"/img/"+id+".webp?v="+a.v}
function surl(){var st=ses.cfg.strip;if(st.hd&&st.hd.file&&wantHD()) return BASE+ses.id+"/"+st.hd.file+"?v="+st.hd.v;return BASE+ses.id+"/"+st.file+"?v="+st.v}
function norm(spec){ // "asset_id" | "svg:key" | {a:"asset_id",svg:"key"}
  if(!spec) return {};
  if(typeof spec==="string") return spec.indexOf("svg:")===0?{svg:spec.slice(4)}:{a:spec};
  return spec;
}
function picInner(spec){
  var s=norm(spec);
  if(s.a&&asset(s.a)) return '<img alt="" draggable="false" decoding="async" src="'+aurl(s.a)+'">';
  var k=s.svg||(s.a&&s.a.replace(/^(gear|build|prop|ride)_/,""));
  return ART.svg(k,"ar2-svg")||"";
}
function picHas(spec){var s=norm(spec);return !!((s.a&&asset(s.a))||(s.svg&&ART.has(s.svg)))}
function picEl(spec,cls){return el("span",cls||"pic",picInner(spec))}
function stripBg(node,wall,xPct){
  var st=ses.cfg.strip,r=node.getBoundingClientRect(),W=r.width||innerWidth,H=r.height||innerHeight,sc=H/DH,c=wall*STEP+((xPct==null?50:xPct)/100)*DW;
  /* a still stop backdrop only shows the clean middle of one wall: never a blend zone between walls or the 360 loop join.
     When the screen is wider than that clean part, the picture is zoomed a little (the 4K strip keeps it sharp). */
  var ov=(st.overlap||240)+20,c0=wall*STEP+ov,c1=wall*STEP+DW-ov,z=1;
  if(W/sc>c1-c0) z=(W/sc)/(c1-c0);
  var s2=sc*z,half=W/s2/2;c=Math.max(c0+half,Math.min(c1-half,c));
  node.style.backgroundImage="url("+surl()+")";
  node.style.backgroundSize="auto "+(100*z).toFixed(2)+"%";node.style.backgroundRepeat="repeat-x";
  node.style.backgroundPosition=(W/2-c*s2)+"px "+((H-H*z)*.62)+"px";
}
function setBd(node,spec){
  if(spec&&spec.a&&asset(spec.a)){node.classList.add("cover");node.style.backgroundImage="url("+aurl(spec.a)+")";node.style.backgroundPosition="center";return}
  node.classList.remove("cover");stripBg(node,spec&&spec.wall||0,spec&&spec.x);
}

/* ------------------------------------------------------------ fx: sparkles, hearts, confetti, drag */
function burst(x,y,n,glyphs){
  n=n||10;glyphs=glyphs||["\u2728","\u2B50","\uD83C\uDF1F","\u2728"];
  if(reduced()) return;
  for(var i=0;i<n;i++){
    var s=el("i","ar2-spark",glyphs[i%glyphs.length]);document.body.appendChild(s);
    var a=Math.random()*Math.PI*2,d=40+Math.random()*90,tx=Math.cos(a)*d,ty=Math.sin(a)*d-30;
    var an=s.animate?s.animate([{transform:"translate3d("+x+"px,"+y+"px,0) scale(.3)",opacity:1},{transform:"translate3d("+(x+tx)+"px,"+(y+ty)+"px,0) scale(1.2)",opacity:1,offset:.6},{transform:"translate3d("+(x+tx*1.2)+"px,"+(y+ty+40)+"px,0) scale(.6)",opacity:0}],{duration:900+Math.random()*400,easing:"ease-out"}):null;
    if(an){an.onfinish=an.oncancel=(function(n2){return function(){n2.remove()}})(s)}else s.remove();
  }
}
function floatUp(x,y,glyph){
  var s=el("i","ar2-spark",glyph||"\u2764\uFE0F");s.style.fontSize="30px";document.body.appendChild(s);
  var an=s.animate?s.animate([{transform:"translate3d("+x+"px,"+y+"px,0) scale(.5)",opacity:0},{transform:"translate3d("+x+"px,"+(y-40)+"px,0) scale(1.1)",opacity:1,offset:.3},{transform:"translate3d("+x+"px,"+(y-120)+"px,0) scale(1)",opacity:0}],{duration:1200,easing:"ease-out"}):null;
  if(an) an.onfinish=an.oncancel=function(){s.remove()};else s.remove();
}
function cloneGhost(src,size){
  var g=el("div","ar2-ghost");var ip=src.querySelector(".ip,.pic,svg,img");g.innerHTML=ip?(ip.matches("svg,img")?ip.outerHTML:ip.innerHTML):src.innerHTML;
  var r=src.getBoundingClientRect();size=size||Math.max(Math.min(r.width,r.height),64)*1.25;g.style.width=g.style.height=size+"px";g._size=size;return g;
}
function placeGhost(g,x,y,lift){g.style.transform="translate3d("+(x-g._size/2)+"px,"+(y-g._size/2-(lift||0))+"px,0)"}
function drag(src,o){
  src.style.touchAction="none";
  src.addEventListener("pointerdown",function(e){
    if(e.pointerType==="mouse"&&e.button!==0) return;
    if(o.ok&&!o.ok()) return;
    e.preventDefault();e.stopPropagation();
    var g=o.ghost?o.ghost(src,e):cloneGhost(src,o.size);document.body.appendChild(g);g.style.opacity="0";
    var st={g:g,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false,src:src,id:e.pointerId};
    placeGhost(g,st.x,st.y,0);
    try{src.setPointerCapture(e.pointerId)}catch(_){}
    if(o.start) o.start(st);
    sfx("click");
    /* smooth drag: the ghost shows as soon as the finger moves and is drawn once per frame (no layout work per event) */
    var rq=0;function paint(){rq=0;if(!st.moved) return;placeGhost(g,st.x,st.y,14);if(o.move) o.move(st.x,st.y,st)}
    function mv(ev){
      if(ev.pointerId!==st.id) return;
      st.x=ev.clientX;st.y=ev.clientY;
      if(!st.moved&&Math.hypot(st.x-st.sx,st.y-st.sy)>5){st.moved=true;g.style.opacity="1";src.classList.add("held")}
      if(st.moved&&!rq) rq=requestAnimationFrame(paint);
    }
    function up(ev){
      if(ev.pointerId!==st.id) return;
      src.removeEventListener("pointermove",mv);src.removeEventListener("pointerup",up);src.removeEventListener("pointercancel",up);
      try{src.releasePointerCapture(st.id)}catch(_){}
      src.classList.remove("held");if(rq){cancelAnimationFrame(rq);rq=0}
      var used=false;
      if(st.moved){ if(o.drop) used=o.drop(st.x,st.y,st) }
      else if(o.tap){ used=o.tap(st) }
      else if(o.drop&&o.tapDest!==false){ g.remove();armTap(src,o);return }
      if(used===true){if(g.animate&&st.moved&&!reduced()){var a2=g.animate([{opacity:1},{transform:g.style.transform+" scale(.55)",opacity:0}],{duration:220,easing:"ease-out",fill:"forwards"});a2.onfinish=a2.oncancel=function(){g.remove()}}else g.remove();return}
      var r=src.getBoundingClientRect();
      if(g.animate&&st.moved){var an=g.animate([{opacity:1},{transform:"translate3d("+(r.left+r.width/2-g._size/2)+"px,"+(r.top+r.height/2-g._size/2)+"px,0) scale(.6)",opacity:.1}],{duration:380,easing:"ease-in"});an.onfinish=an.oncancel=function(){g.remove()}}
      else g.remove();
    }
    src.addEventListener("pointermove",mv);src.addEventListener("pointerup",up);src.addEventListener("pointercancel",up);
  });
}
/* tap-the-destination: every drag also works as "tap the item, then tap where it goes" (plan §6 / §9, NN/g) */
var armed=null;
function disarm(){if(!armed) return;armed.src.classList.remove("armed");document.removeEventListener("pointerdown",armed.fn,true);armed=null}
function armTap(src,o){
  disarm();if(o.ok&&!o.ok()) return;
  src.classList.add("armed");sfx("click");
  var fn=function(ev){
    if(!armed) return;
    if(src.contains(ev.target)){ev.preventDefault();ev.stopPropagation();disarm();return}
    if(ev.target.closest&&ev.target.closest(".ar2-back,.ar2-skip,.sg-btn,.sg-ov,.ar2-cap,.ar2-q")){disarm();return}
    ev.preventDefault();ev.stopPropagation();
    var x=ev.clientX,y=ev.clientY;disarm();
    if(o.ok&&!o.ok()) return;
    var g=o.ghost?o.ghost(src,ev):cloneGhost(src,o.size);document.body.appendChild(g);
    var r=src.getBoundingClientRect(),st={g:g,x:x,y:y,sx:r.left+r.width/2,sy:r.top+r.height/2,moved:true,src:src,id:-1,tapDest:true};
    placeGhost(g,x,y,0);g.style.opacity="1";if(o.start) o.start(st);if(o.move) o.move(x,y,st);
    var used=o.drop(x,y,st);
    if(used===true){g.remove();return}
    if(g.animate){var an=g.animate([{opacity:1},{transform:"translate3d("+(st.sx-g._size/2)+"px,"+(st.sy-g._size/2)+"px,0) scale(.6)",opacity:.1}],{duration:380,easing:"ease-in"});an.onfinish=an.oncancel=function(){g.remove()}}else g.remove();
  };
  armed={src:src,fn:fn};document.addEventListener("pointerdown",fn,true);
}
function confetti(host){
  if(reduced()) return;
  var w=el("div","ar2-confetti"),cols=["#ffd36b","#6af0ab","#6ab7ff","#ff8fa3","#c79bff"];
  for(var i=0;i<70;i++){var p=el("i");p.style.left=Math.random()*100+"%";p.style.background=cols[i%5];p.style.setProperty("--dx",(Math.random()*160-80)+"px");p.style.animationDuration=(2.2+Math.random()*2.2)+"s";p.style.animationDelay=(Math.random()*.9)+"s";w.appendChild(p)}
  host.appendChild(w);setTimeout(function(){w.remove()},5600);
}
function rectOf(n){var r=n.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,cx:r.left+r.width/2,cy:r.top+r.height/2,w:r.width,h:r.height}}
function inside(x,y,r,pad){pad=pad||0;return x>=r.l-pad&&x<=r.r+pad&&y>=r.t-pad&&y<=r.b+pad}

/* ------------------------------------------------------------ module api */
function makeApi(host,stage,stop,tok){
  var api={host:host,stage:stage,cfg:ses.cfg,game:ses.cfg.game,stop:stop,tok:tok,lvl:lvl,pick:pick,byLvl:byLvl,say:say,hush:hush,sfx:sfx,el:el,$:$,clamp:clamp,sleep:sleep,shuffle:shuffle,esc:esc,
    asset:asset,url:aurl,pic:picEl,picInner:picInner,picHas:picHas,drag:drag,burst:burst,floatUp:floatUp,rectOf:rectOf,inside:inside,reduced:reduced,setBd:function(s){setBd(stage.querySelector(".ar2-bd"),s)},
    live:function(){return live(tok)},cleanup:[],band:band,tier:function(){return ses.tier==null?1:ses.tier},difficulty:function(){return ses.diff||{}},
    onEnd:function(f){api.cleanup.push(f)},onSkip:function(f){api._skip=f},
    hint:function(t){var h=$(".ar2-hint",host);if(!t){if(h) h.remove();return}if(!h){h=el("div","ar2-hint");host.appendChild(h)}h.textContent=pick(t);placeHint(h)},
    fact:function(i,pre){return stopFact(api,i,pre)},factsHeard:function(){return ses.stopFacts},
    topInset:function(){ // bottom edge of Spark's caption (+ Facts chip when shown), in this host's coordinates, so activities never sit under the HUD
      var hb=host.getBoundingClientRect(),m=0;
      [".ar2-cap:not(.off)",".ar2-chips"].forEach(function(sel){var n=document.querySelector(".ar2 "+sel);if(n&&getComputedStyle(n).display!=="none"){var r=n.getBoundingClientRect();if(r.height>0) m=Math.max(m,r.bottom-hb.top)}});
      return m?m+6:0},
    stripBg:stripBg,
    tray:function(items,onDrag){ // food/piece tray at the bottom (Savannah's wooden tray)
      var t=el("div","ar2-trayw");t.setAttribute("role","group");host.appendChild(t);return t}
  };
  return api;
}
/* the hint chip always sits just under Spark's caption (the caption grows with long lines and big band-k buttons) */
function placeHint(h){if(!h||!h.parentNode) return;h.style.top="";var host=h.parentNode,hb=host.getBoundingClientRect(),m=0;
  [".ar2-cap:not(.off)",".ar2-chips"].forEach(function(sel){var n=document.querySelector(".ar2 "+sel);if(n&&getComputedStyle(n).display!=="none"){var r=n.getBoundingClientRect();if(r.height>0) m=Math.max(m,r.bottom-hb.top)}});
  var cur=h.getBoundingClientRect().top-hb.top;if(m&&cur<m+6) h.style.top=Math.round(m+6)+"px"}
/* a fact pip fills only once that fact was heard to the end; a fact cut short by the kid's next action is told again later
   (every stop ends by telling the facts not yet heard). pre: an optional line said just before the fact, in the same breath. */
function stopFact(api,i,pre){
  var s=api.stop,list=s.facts||[];if(!list.length) return pre?say(pre):Promise.resolve(true);
  var heard=ses.factHeard||(ses.factHeard={}),k=i;
  if(k==null){k=-1;for(var j=0;j<list.length;j++){if(!heard[j]){k=j;break}}}
  if(k<0||k>=list.length||heard[k]) return pre?say(pre):Promise.resolve(true);
  var tk=ses.tok;
  return say([pre?pick(pre):"","Did you know?",pick(list[k])].join(" ").trim()).then(function(full){
    if(full&&ses&&ses.tok===tk&&!heard[k]){heard[k]=true;ses.stopFacts=Object.keys(heard).length;updateChips()}return full});
}

/* ------------------------------------------------------------ opening / closing */
function loadCfg(id){
  if(cfgs[id]) return Promise.resolve(cfgs[id]);
  function j(u){return fetch(u).then(function(r){if(!r.ok) throw new Error(u+" "+r.status);return r.json()})}
  return Promise.all([j(BASE+id+"/config.json?v="+V),j(BASE+id+"/game.json?v="+V)]).then(function(a){var c=a[0];c.game=a[1];cfgs[id]=c;return c});
}
function open(id){
  if(opening||(ses&&ses.id===id&&!ses.dead&&Date.now()-ses.t0<1500)) return Promise.resolve(ses);
  opening=true;
  if(ses) close(true);
  var hold=el("div","ar2");hold.innerHTML='<div class="ar2-load">Loading\u2026</div>';
  document.body.appendChild(hold);document.body.classList.add("spark-area");
  return loadCfg(id).then(function(cfg){
    hold.remove();opening=false;
    ses={t0:Date.now(),id:id,cfg:cfg,game:cfg.game,root:el("div","ar2"),mode:"intro",cleanup:[],dead:false,spoken:[],tok:0,stopIdx:0,stopFacts:0,camp:null};try{if(SA()&&SA().registerRegion) SA().registerRegion(id,{name:cfg.game.area&&(cfg.game.area.title||cfg.game.area.name),missions:(cfg.game.stops||[]).length})}catch(e){}
    ses.root.setAttribute("role","dialog");ses.root.setAttribute("aria-label",cfg.area.title);ses.root.dataset.area=id;ses.root.dataset.mode="intro";
    document.body.appendChild(ses.root);
    snapBand();buildChrome();
    ses.keys=function(e){onKey(e)};document.addEventListener("keydown",ses.keys,true);
    showIntro();
    return ses;
  }).catch(function(err){opening=false;hold.remove();document.body.classList.remove("spark-area");try{console.warn("area failed",err)}catch(e){}});
}
function close(silent){
  if(!ses) return;
  ses.dead=true;hush();
  if(ses.destroyMod){try{ses.destroyMod()}catch(e){}}
  if(ses.raf) cancelAnimationFrame(ses.raf);
  ses.cleanup.forEach(function(f){try{f()}catch(e){}});
  document.removeEventListener("keydown",ses.keys,true);
  var v=$("video",ses.root);if(v){try{v.pause();v.removeAttribute("src");v.load()}catch(e){}}
  ses.root.remove();ses=null;
  document.body.classList.remove("spark-area");
  [].forEach.call(document.querySelectorAll(".ar2,.ar2-ghost,.ar2-fly,.ar2-spark,.ar2-fx"),function(n){n.remove()});
  setSpark("idle");
  if(!silent) window.dispatchEvent(new Event("resize"));
}
function setMode(m){ses.mode=m;ses.root.dataset.mode=m;
  var up=(m==="ride"||m==="stop"||m==="q"),lab=up?"Camp":"Map",aria=up?"Back to the camp":"Back to the map";
  [].forEach.call(ses.root.querySelectorAll(".ar2-back"),function(b){var t=b.querySelector(".ar2-bl");if(!t){b.innerHTML='<span aria-hidden="true">&#8592;</span> <span class="ar2-bl"></span>';t=b.querySelector(".ar2-bl")}t.textContent=lab;b.setAttribute("aria-label",aria)})}
function buildChrome(){
  var r=ses.root,g=ses.game;
  ses.scr=el("div","ar2-scr");r.appendChild(ses.scr);
  var ui=el("div","ar2-ui");
  var back=el("button","ar2-btn ar2-back");back.type="button";back.innerHTML="<span aria-hidden=\"true\">&#8592;</span> Map";back.setAttribute("aria-label","Back to the map");back.onclick=onBack;
  var skip=el("button","ar2-btn ar2-skip");skip.type="button";skip.innerHTML="Skip <span aria-hidden=\"true\">&#9193;</span>";skip.onclick=onSkip;
  var pg=el("div","ar2-prog");pg.setAttribute("aria-live","polite");var pt=el("div","ar2-progtxt"),dots=el("div","ar2-dots");pg.appendChild(pt);pg.appendChild(dots);
  var top2=el("div","ar2-top2"),cap=el("div","ar2-cap off");cap.setAttribute("aria-live","polite");
  cap.innerHTML='<span class="ar2-capwho">Spark</span><span class="ar2-captxt"></span>';
  var sb=el("button","ar2-speak","\uD83D\uDD0A");sb.type="button";sb.setAttribute("aria-label","Hear Spark again");sb.onclick=function(e){e.stopPropagation();if(lastLine) say(lastLine)};cap.appendChild(sb);
  var chips=el("div","ar2-chips");chips.innerHTML='<span class="ar2-chip ar2-factchip"><b>Facts</b><i></i><i></i><i></i></span>';
  top2.appendChild(cap);top2.appendChild(chips);
  if(window.ResizeObserver){var hro=new ResizeObserver(function(){var h=document.querySelector(".ar2 .ar2-act .ar2-hint");if(h) placeHint(h)});hro.observe(top2);ses.cleanup.push(function(){hro.disconnect()})}
  var kit=el("div","ar2-kit");kit.hidden=true;
  ui.appendChild(back);ui.appendChild(skip);ui.appendChild(pg);ui.appendChild(top2);ui.appendChild(kit);
  r.appendChild(ui);
  ses.ui=ui;ses.back=back;ses.skipBtn=skip;ses.progtxt=pt;ses.dots=dots;ses.cap=cap;ses.capText=$(".ar2-captxt",cap);ses.chips=chips;ses.kit=kit;
  g.stops.forEach(function(s){var d=el("i");d.title=s.name;dots.appendChild(d)});
  updateProgress();
}
function updateChips(){
  if(!ses||!ses.chips) return;
  var f=ses.chips.querySelectorAll(".ar2-factchip i");for(var i=0;i<f.length;i++) f[i].className=i<ses.stopFacts?"on":"";
}
function updateProgress(){
  if(!ses) return;var g=ses.game,p=prog(),m=ses.mode;
  var txt="";
  if(m==="camp") txt=g.camp.title+" \u00B7 "+p.gear.length+"/"+g.camp.gear.length;
  else if(m==="ride"||m==="stop"||m==="q") txt="Stop "+(ses.stopIdx+1)+"/"+g.stops.length+" \u00B7 "+g.stops[ses.stopIdx].name;
  else if(m==="end") txt=g.area.title+" complete!";
  ses.progtxt.textContent=txt;
  var d=ses.dots.children;
  for(var i=0;i<d.length;i++){
    var inJourney=(m==="ride"||m==="stop"||m==="q"||m==="end");
    d[i].className=(p.stops[g.stops[i].id]?"done":"")+(inJourney&&i===ses.stopIdx&&m!=="end"?" cur":"");
  }
  ses.skipBtn.hidden=!(m==="ride"||m==="stop"||m==="q");
  updateKit();
}
function updateKit(){
  var g=ses.game,p=prog(),m=ses.mode;
  ses.kit.hidden=!(m==="ride"||m==="stop"||m==="q");
  if(ses.kit.hidden) return;
  ses.kit.innerHTML="";ses.kit.classList.toggle("many",g.camp.gear.length>6);
  g.camp.gear.forEach(function(it){if(p.gear.indexOf(it.id)>=0){var k=el("span","k",picInner(it.pic));k.title=it.word;ses.kit.appendChild(k)}});
}
/* Back and Skip mean the same thing in every region (and match the Savannah safari):
   Back = one level up (a stop, ride or question goes back to the camp; camp, intro and end card go back to the map).
   Skip = move on (ride -> arrive; a stop or its question -> the next stop, marked as skipped). Skip is hidden where there is nothing to skip. */
function onBack(){ if(!ses) return;
  var m=ses.mode;
  if(m==="ride"||m==="stop"||m==="q"){var sq=ses.skipQ;ses.skipQ=null;newTok();if(sq){try{sq()}catch(e){}}
    [].forEach.call(ses.root.querySelectorAll(".ar2-q,.ar2-next,.ar2-stoppt"),function(n){n.remove()});ses.campCenter=null;showCamp();return}
  close() }
function onSkip(){
  if(!ses) return;
  if(ses.mode==="ride"){ses.tok++;hush();arrive(ses.stopIdx,newTok())}
  else if(ses.mode==="stop"){ses.skippedAct=true;ses.skipStop=true;var A=ses.api;if(A&&A._skip){try{A._skip()}catch(e){}}hush();if(ses.endAct) ses.endAct()}
  else if(ses.mode==="q"){if(ses.qOpen) ses.skipStop=true;ses.skipQ&&ses.skipQ()}
}
function onKey(e){
  if(!ses) return;
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();onBack();return}
  if(ses.mode==="camp"&&ses.camp){
    if(e.key==="ArrowLeft"){e.preventDefault();campTurnBy(-320)}
    else if(e.key==="ArrowRight"){e.preventDefault();campTurnBy(320)}
  }
}
function clearScr(){
  disarm();
  hush();if(ses.destroyMod){try{ses.destroyMod()}catch(e){}ses.destroyMod=null}
  if(ses.raf){cancelAnimationFrame(ses.raf);ses.raf=0}
  if(ses.campCleanup){ses.campCleanup();ses.campCleanup=null}
  if(ses.rideCleanup){try{ses.rideCleanup()}catch(e){}ses.rideCleanup=null}
  ses.scr.innerHTML="";ses.camp=null;ses.endAct=null;ses.skipQ=null;
  [].forEach.call(document.querySelectorAll(".ar2-ghost,.ar2-fly"),function(n){n.remove()});
}

/* ------------------------------------------------------------ INTRO FILM (muted, playsinline, visible from the first frame; never auto-skips) */
function bigScreen(){
  var dpr=window.devicePixelRatio||1,sw=Math.max(screen.width||0,window.innerWidth||0)*dpr,c=navigator.connection||{};
  if(sw<2500||c.saveData||(c.effectiveType&&c.effectiveType!=="4g")||(navigator.deviceMemory&&navigator.deviceMemory<=4)) return false;
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)) return false;
  var v=document.createElement("video");return !!(v.canPlayType&&v.canPlayType('video/mp4; codecs="avc1.640033"'));
}
function showIntro(){
  if(ses.game.intro&&ses.game.intro.style==="film") return showFilm();
  clearScr();setMode("intro");updateProgress();
  var cfg=ses.cfg,s=el("div","ar2-screen ar2-intro"),vids=cfg.video||{};
  var posterU=vids["poster.jpg"]?BASE+ses.id+"/poster.jpg?v="+vids["poster.jpg"].v:"";
  var vn=(bigScreen()&&vids["intro-4k.mp4"])?"intro-4k.mp4":(vids["intro-1080.mp4"]?"intro-1080.mp4":(vids["intro-4k.mp4"]?"intro-4k.mp4":""));
  ses.videoName=vn;
  var skip=el("button","ar2-btn ar2-introskip");skip.type="button";skip.innerHTML="Skip <span aria-hidden=\"true\">&#9193;</span>";
  var finished=false;
  function finish(){if(finished||!ses||ses.dead) return;finished=true;mut(function(p){p.intro=true});showCamp()}
  skip.onclick=finish;ses.endIntro=finish;
  var back=el("button","ar2-btn ar2-introback");back.type="button";back.innerHTML="<span aria-hidden=\"true\">&#8592;</span> Map";back.setAttribute("aria-label","Back to the map");back.onclick=onBack;
  var v=document.createElement("video");
  v.className="ar2-film";v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");
  v.setAttribute("muted","");v.autoplay=true;v.preload="auto";v.loop=false;v.controls=false;v.disablePictureInPicture=true;
  if(posterU) v.poster=posterU;
  s.appendChild(v);
  var load=el("div","ar2-introload",'<span class="ar2-spin"></span><span>Loading the movie\u2026</span>');s.appendChild(load);
  var tap=el("button","ar2-tap","\u25B6 Tap to play");tap.type="button";tap.hidden=true;s.appendChild(tap);
  s.appendChild(back);s.appendChild(skip);ses.scr.appendChild(s);
  ses.film={v:v,name:vn,playing:false,tapShown:false,autoplayBlocked:false,errored:false};
  var F=ses.film;
  function showTap(){if(finished) return;F.tapShown=true;tap.hidden=false;load.hidden=true}
  function started(){F.playing=true;tap.hidden=true;load.hidden=true}
  function attempt(){var p;try{p=v.play()}catch(e){showTap();return}if(p&&p.then) p.then(started,function(){F.autoplayBlocked=true;showTap()})}
  tap.onclick=function(){tap.hidden=true;load.hidden=false;try{v.muted=true}catch(e){}var p=v.play();if(p&&p.catch) p.catch(function(){showTap()})};
  v.addEventListener("playing",started);v.addEventListener("timeupdate",function(){if(v.currentTime>0.05&&!F.playing) started()});
  v.addEventListener("waiting",function(){if(!v.paused&&tap.hidden) load.hidden=false});
  v.addEventListener("ended",finish);
  v.addEventListener("error",function(){F.errored=true;load.hidden=false;load.innerHTML="The movie could not load. Tap Skip to start!"});
  if(!vn||reduced()){setTimeout(finish,reduced()?1200:300);return}
  v.src=BASE+ses.id+"/"+vn+"?v="+vids[vn].v;
  /* start as soon as the first frames are there; if the browser blocks it, show the big Tap-to-play button */
  var kicked=false;function kick(){if(kicked) return;kicked=true;attempt()}
  v.addEventListener("loadeddata",kick);v.addEventListener("canplay",kick);
  setTimeout(kick,50);
  /* if nothing has started after a few seconds and the browser is idle, offer the button (never skip on our own) */
  var t1=setTimeout(function(){if(!F.playing&&v.paused&&!finished) showTap()},3500);
  ses.cleanup.push(function(){clearTimeout(t1)});
  document.addEventListener("pointerdown",function once(){document.removeEventListener("pointerdown",once,true);if(ses&&!ses.dead&&v.isConnected&&v.paused&&!finished){var p=v.play();if(p&&p.catch) p.catch(function(){})}},true);
}

/* ------------------------------------------------------------ INTRO FILM, Savannah style (game.intro.style="film"):
   one continuous clip, autoplay, muted, inline, no Skip, no text on screen; the camp opens by itself when it ends.
   Same player behaviour as savannah-film.js: reduced motion parks on the last frame and opens the camp; a blocked autoplay starts on the first tap. */
function showFilm(){
  clearScr();setMode("intro");updateProgress();
  var cfg=ses.cfg,vids=cfg.video||{},s=el("div","ar2-screen ar2-intro ar2-filmonly");
  var vn=(bigScreen()&&vids["intro-4k.mp4"])?"intro-4k.mp4":(vids["intro-1080.mp4"]?"intro-1080.mp4":(vids["intro-4k.mp4"]?"intro-4k.mp4":""));
  ses.videoName=vn;
  var back=el("button","ar2-btn ar2-introback");back.type="button";back.innerHTML="<span aria-hidden=\"true\">&#8592;</span> Map";back.setAttribute("aria-label","Back to the map");back.onclick=onBack;
  var v=document.createElement("video");
  v.className="ar2-film";v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");
  v.setAttribute("muted","");v.preload="auto";v.loop=false;v.controls=false;v.disablePictureInPicture=true;
  if(vids["poster.jpg"]) v.poster=BASE+ses.id+"/poster.jpg?v="+vids["poster.jpg"].v;
  s.appendChild(v);s.appendChild(back);ses.scr.appendChild(s);
  var F=ses.film={v:v,name:vn,playing:false,tapShown:false,autoplayBlocked:false,errored:false};
  var finished=false,tok=ses.tok;
  function finish(){if(finished||!ses||ses.dead||ses.film!==F) return;finished=true;mut(function(p){p.intro=true});showCamp()}
  ses.endIntro=finish;
  if(!vn){setTimeout(finish,300);return}
  v.addEventListener("loadeddata",function(){v.classList.add("is-ready")});
  v.addEventListener("playing",function(){F.playing=true});
  v.addEventListener("timeupdate",function(){if(v.currentTime>0.05) F.playing=true});
  v.addEventListener("error",function(){F.errored=true;setTimeout(finish,700)}); /* no Skip button: never leave a child stuck on a broken clip */
  v.src=BASE+ses.id+"/"+vn+"?v="+vids[vn].v;
  if(reduced()){
    var park=function(){var d=v.duration;if(d>0){try{v.currentTime=Math.max(0,d-0.08)}catch(e){}}v.pause()};
    if(v.readyState>=1) park();else v.addEventListener("loadedmetadata",park);
    setTimeout(finish,500);return;
  }
  v.addEventListener("ended",finish);
  function tryPlay(){
    var p;try{p=v.play()}catch(e){p=null}
    if(p&&p.catch) p.catch(function(){
      F.autoplayBlocked=true;F.tapShown=true;
      document.addEventListener("pointerdown",function once(){document.removeEventListener("pointerdown",once,true);if(!finished&&v.isConnected) v.play().catch(function(){})},true);
    });
  }
  var started=false;function start(){if(started) return;started=true;try{v.currentTime=0}catch(e){}tryPlay()}
  if(v.readyState>=1) start();else v.addEventListener("loadedmetadata",start);
}

/* ------------------------------------------------------------ BASE CAMP (360 strip, gear -> backpack) */
function showCamp(){
  snapBand();
  var tok=newTok();clearScr();setMode("camp");updateProgress();
  var g=ses.game,C=g.camp,st=ses.cfg.strip,p=prog();
  var scr=el("div","ar2-screen");
  var view=el("div","ar2-view");view.tabIndex=0;view.setAttribute("role","application");view.setAttribute("aria-label",g.area.title+" base camp. Drag, or use the left and right arrow keys, to look all the way around.");
  var strip=el("div","ar2-strip"),marks=el("div","ar2-marks");
  var imgs=[0,1].map(function(){var i=new Image();i.alt="";i.draggable=false;i.src=surl();strip.appendChild(i);return i});
  view.appendChild(strip);view.appendChild(marks);scr.appendChild(view);
  var load=el("div","ar2-load","Opening the camp\u2026");scr.appendChild(load);
  function reveal(){load.classList.add("off");setTimeout(function(){load.remove()},320)}
  if(imgs[0].decode) imgs[0].decode().catch(function(){}).then(reveal);setTimeout(reveal,6000);
  var prompt=el("p","ar2-prompt");prompt.setAttribute("role","status");scr.appendChild(prompt);
  /* 10/10 item 14: the number to find is shown big on screen as well as spoken (ages 4-6 number packing) */
  var fnum=el("div","ar2-findnum");fnum.setAttribute("aria-hidden","true");scr.appendChild(fnum);
  try{new MutationObserver(function(){var m=/Tap number (\d+)/.exec(prompt.textContent||"");if(m){if(fnum.dataset.n!==m[1]){fnum.dataset.n=m[1];fnum.innerHTML='<span>Find</span><b>'+m[1]+'</b>';fnum.classList.remove("pop");void fnum.offsetWidth;fnum.classList.add("pop")}fnum.classList.add("on")}else fnum.classList.remove("on")}).observe(prompt,{childList:true,characterData:true,subtree:true})}catch(e){}
  var ctl=el("div","ar2-ctl");ctl.innerHTML='<button type="button" class="ar2-turn" data-turn="-1" aria-label="Turn left">\u25C0</button><span class="ar2-where" aria-hidden="true"></span><button type="button" class="ar2-turn" data-turn="1" aria-label="Turn right">\u25B6</button>';scr.appendChild(ctl);
  var dock=el("div","ar2-dock");var pack=el("div","ar2-pack",'\uD83C\uDF92<b>0/'+C.gear.length+'</b>');pack.setAttribute("role","img");dock.appendChild(pack);scr.appendChild(dock);
  var bub=el("div","ar2-bubble");bub.setAttribute("role","dialog");bub.innerHTML='<button type="button" class="ar2-go">Go</button><span></span>';/* Go on the side away from Spark (item 18) */scr.appendChild(bub);
  ses.scr.appendChild(scr);
  var S2=ses.camp={scr:scr,view:view,strip:strip,imgs:imgs,marks:marks,prompt:prompt,pack:pack,packB:$("b",pack),dock:dock,bub:bub,gear:[],center:(ses.campCenter!=null?ses.campCenter:DW/2),vel:0,dragging:false,tween:null,dirty:true,raf:0,vw:innerWidth,vh:innerHeight,H:1080,Ww:LOOP,sc:1,busy:false,keep:[],wallIdx:-1,tok:tok};
  var PACK=C.style==="pack",NUM=PACK&&lvl()==="lo",S2fixed=false;
  if(NUM){ /* numbers must stay in order (like the Research Station): keep only the in-order prefix */
    var pre=[];for(var q0=0;q0<C.gear.length;q0++){if(p.gear.indexOf(C.gear[q0].id)>=0) pre.push(C.gear[q0].id);else break}
    if(pre.length!==p.gear.length){mut(function(q){q.gear=pre});p=prog()}
  }
  scr.classList.toggle("ar2-packmode",PACK);S2fixed=PACK&&C.layout!=="world";scr.dataset.pack=PACK?(NUM?"numbers":"words"):"";
  S2.fixed=S2fixed;
  C.gear.forEach(function(it,i){
    var b=el("button","ar2-gear");b.type="button";b.dataset.id=it.id;b.dataset.n=i+1;b.setAttribute("aria-label",NUM?("Number "+(i+1)+", "+it.word):it.word);
    var wordH='<span class="word">'+esc(it.word)+'</span>'; /* ages 7+ see the plain word: no letter tiles, nothing spelled out */
    b.innerHTML='<span class="pic">'+picInner(it.pic)+'</span><b>'+(i+1)+'</b>'+(lvl()==="lo"?"":wordH);
    var o={it:it,el:b,n:i+1,i:i,sx:0,sy:0,w:0,h:0,blocked:false,flying:false,packed:p.gear.indexOf(it.id)>=0};
    if(o.packed) b.classList.add("gone");
    b.addEventListener("pointerdown",function(e){if(e.button>0) return;o._pd=performance.now();if(PACK) onPack(o);else onGear(o)});
    b.addEventListener("click",function(){if(o._pd&&performance.now()-o._pd<1500) return;if(PACK) onPack(o);else onGear(o)});
    b.addEventListener("focus",function(){if(!S2.fixed&&(o.sx<0||o.sx>S2.vw)) campTurnTo(it.wall*STEP+it.x/100*DW,420)});
    marks.appendChild(b);S2.gear.push(o);
  });
  ctl.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-turn]");if(b) campSnap(+b.dataset.turn)});
  $(".ar2-go",bub).addEventListener("click",function(){onGo()});
  bindCampInput();campLayout();
  var onR=function(){campLayout()};window.addEventListener("resize",onR);
  var ro=window.ResizeObserver?new ResizeObserver(function(){campLayout()}):null;if(ro){ro.observe(view);var sp=document.getElementById("sparkCompanion");if(sp) ro.observe(sp);var cp=document.querySelector(".ar2 .ar2-cap");if(PACK&&cp) ro.observe(cp)}
  ses.campCleanup=function(){window.removeEventListener("resize",onR);if(ro) ro.disconnect()};
  setTimeout(campLayout,80);setTimeout(campLayout,500);
  updatePack(false);
  if(p.gear.length>=C.gear.length){prompt.textContent=pick(C.readyPrompt);showGo(true);say(C.readyAgain)}
  else if(PACK){
    var nx0=S2.gear.filter(function(x){return !x.packed})[0];
    prompt.textContent=NUM?"Tap number "+nx0.n:pick(C.prompt);
    if(NUM&&p.gear.length) say(pick(C.back)+" Number "+nx0.n+" is the "+nx0.it.word.toLowerCase()+".");
    else say(p.gear.length?C.back:(p.welcomed?C.welcomeAgain:C.welcome));
    mut(function(q){q.welcomed=true});
  }
  else{
    prompt.textContent=pick(C.prompt);
    say(p.gear.length?C.back:(p.welcomed?C.welcomeAgain:C.welcome));
    mut(function(q){q.welcomed=true});
  }
  S2.dirty=true;campKick();
}
function campLayout(){
  var S2=ses&&ses.camp;if(!S2) return;
  var r=S2.view.getBoundingClientRect();S2.vw=r.width||innerWidth;S2.vh=r.height||innerHeight;
  S2.H=Math.max(1,Math.round(S2.vh));S2.Ww=Math.max(1,Math.round(LOOP*S2.H/DH));S2.sc=S2.Ww/LOOP;
  S2.strip.style.width=(S2.Ww*2)+"px";S2.strip.style.height=S2.H+"px";
  S2.imgs.forEach(function(im,i){im.style.left=(i*S2.Ww)+"px";im.style.width=S2.Ww+"px";im.style.height=S2.H+"px"});
  var gs=clamp(S2.H*.2,84,190);
  if(S2.fixed){gs=packSlots(S2);S2.gear.forEach(function(g){g.w=0})}
  S2.marks.style.setProperty("--gs",gs+"px");
  S2.dpr=window.devicePixelRatio||1;
  var sp=document.getElementById("sparkCompanion");
  if(sp){
    var rr=sp.getBoundingClientRect();
    if(rr.width){
      var half=Math.max(sp.offsetWidth||94,rr.width)*1.25/2,cx=rr.left+rr.width/2,cy=rr.top+rr.height/2,base=(sp.offsetWidth||94)/2;
      S2.sparkBox={l:cx-half,t:cy-half,r:cx+half,b:cy+half};
      S2.dock.style.right=Math.max(10,Math.round(S2.vw-(cx-half)+6))+"px";S2.dock.style.bottom=Math.max(10,Math.round(S2.vh-(cy+base)+4))+"px";
      /* item 18: Go bubble centred and well above Spark, never on top of the avatar */S2.bub.classList.add("away");S2.bub.style.right="";S2.bub.style.bottom=Math.max(10,Math.round(S2.vh-(cy-half)+84))+"px";
    }
  }else{S2.dock.style.right="110px";S2.dock.style.bottom="14px";S2.bub.style.right="10px";S2.bub.style.bottom="110px"}
  campKeep();S2.dirty=true;campKick();
  if(S2.fixed&&!S2.relaid){S2.relaid=true;setTimeout(function(){if(ses&&ses.camp===S2){S2.relaid=false;var g0=S2.slotsFor;packSlots(S2);if(S2.slotsFor!==g0){S2.marks.style.setProperty("--gs",S2.slotSize+"px");S2.gear.forEach(function(g){g.w=0});S2.dirty=true;campKick()}}},0)}
}
/* Arctic pack mode: all gear sits in one tidy grid on the snow (number order, reading order), in screen space, so every item is
   on screen and tappable at once on any phone, tablet or desktop. Nothing is hidden around the 360 view. The camp still turns behind it. */
function packSlots(S2){
  var W=S2.vw,H=S2.vh,n=S2.gear.length||10,short=W>H&&H<560,sr=S2.scr.getBoundingClientRect();
  var pe=S2.scr.querySelector(".ar2-prompt"),ce=S2.scr.querySelector(".ar2-ctl");
  if(pe){if(short&&ce){var cr=ce.getBoundingClientRect();pe.style.left=Math.round(cr.right-sr.left+10)+"px";pe.style.bottom=Math.round(sr.bottom-cr.bottom+(cr.height-pe.offsetHeight)/2)+"px"}else{pe.style.left="";pe.style.bottom=""}}
  var L=[],R=[];
  [".ar2-ctl",".ar2-prompt"].forEach(function(sel){var e=S2.scr.querySelector(sel);if(e){var r=e.getBoundingClientRect();if(r.height) L.push({t:r.top-sr.top,l:r.left-sr.left})}});
  var pk=S2.scr.querySelector(".ar2-pack");if(pk){var r=pk.getBoundingClientRect();if(r.height) R.push({t:r.top-sr.top,l:r.left-sr.left})}
  if(S2.sparkBox) R.push({t:S2.sparkBox.t,l:S2.sparkBox.l});
  var top=short?Math.max(H*.3,124):Math.max(H*(W<H?.34:.3),118);
  var be=document.querySelector(".ar2 .ar2-cap:not(.off)"),bb=be&&be.getBoundingClientRect();if(S2.capKey!==W+"x"+H){S2.capKey=W+"x"+H;S2.capMax=0}
  if(bb&&bb.height&&bb.bottom-sr.top<H*.6) S2.capMax=Math.max(S2.capMax,bb.bottom-sr.top+(short?10:16));top=Math.max(top,S2.capMax);
  var mt=function(a){return a.length?Math.min.apply(null,a.map(function(q){return q.t})):H-80},ml=function(a){return a.length?Math.min.apply(null,a.map(function(q){return q.l})):W};
  var x0=Math.max(10,W*.04),zones=[{x1:W-x0,bot:Math.min(mt(L),mt(R))-10}];
  if(R.length) zones.push({x1:Math.min(W-x0,ml(R)-12),bot:mt(L)-10});
  var best=null;
  zones.forEach(function(z){if(z.bot-top<60||z.x1-x0<200) return;
    [2,3,4,5,10].forEach(function(cols){var rows=Math.ceil(n/cols),cw=(z.x1-x0)/cols,ch=(z.bot-top)/rows,sz=Math.min(cw-22,ch-34,190);if(!best||sz>best.sz) best={cols:cols,rows:rows,cw:cw,ch:ch,sz:sz,x1:z.x1,bot:z.bot}})});
  if(!best){var bt=Math.min(H-8,top+H*.3),cw=(W-2*x0)/5;best={cols:5,rows:2,cw:cw,ch:(bt-top)/2,sz:Math.min(cw-22,(bt-top)/2-34),x1:W-x0,bot:bt}}
  var b=best,sz=Math.max(band()==="k"?80:48,Math.floor(b.sz));S2.slots=[];
  for(var i=0;i<n;i++){var r=Math.floor(i/b.cols),c=i%b.cols,inRow=Math.min(b.cols,n-r*b.cols),off=(b.cols-inRow)*b.cw/2;
    S2.slots.push({x:x0+off+(c+.5)*b.cw,y:top+(r+.5)*b.ch-6})}
  S2.slotSize=sz;S2.slotsFor=W+"x"+H+":"+Math.round(top)+":"+Math.round(b.bot)+":"+Math.round(b.x1);return sz;
}
function campKeep(){
  var S2=ses.camp;if(!S2) return;var out=[];
  [".ar2-back",".ar2-prog",".ar2-cap:not(.off)",".ar2-ctl",".ar2-pack",".ar2-bubble.on",".ar2-prompt"].forEach(function(sel){
    var n=document.querySelector(".ar2 "+sel);if(!n) return;var r=n.getBoundingClientRect();if(r.width>0&&r.height>0) out.push({l:r.left-8,t:r.top-8,r:r.right+8,b:r.bottom+8});
  });
  if(S2.sparkBox){var q=S2.sparkBox;out.push({l:q.l-8,t:q.t-8,r:q.r+8,b:q.b+8})}
  S2.keep=out;
}
function campRender(){
  var S2=ses&&ses.camp;if(!S2) return;
  S2.center=mod(S2.center,LOOP);
  var sc=S2.sc,Wt=S2.Ww,off=S2.center*sc-S2.vw/2;off=Math.round(off*S2.dpr)/S2.dpr;var o=mod(off,Wt);
  S2.strip.style.transform="translate3d("+(-o)+"px,0,0)";
  var M=140;
  S2.gear.forEach(function(g){
    if(g.packed&&!g.flying) return;
    var it=g.it,wx=(it.wall*STEP+it.x/100*DW)*sc,sx=mod(wx-o+M,Wt)-M,sy=it.y/100*S2.H;
    if(S2.fixed&&S2.slots&&S2.slots[g.i]){sx=S2.slots[g.i].x;sy=S2.slots[g.i].y;g.el.classList.toggle("sm",S2.slotSize<100)}
    g.sx=sx;g.sy=sy;if(!g.w&&g.el.offsetWidth){g.w=g.el.offsetWidth;g.h=g.el.offsetHeight}
    var hw=(g.w||100)/2,hh=(g.h||100)/2;
    g.el.style.transform="translate3d("+(Math.round((sx-hw)*10)/10)+"px,"+(Math.round((sy-hh)*10)/10)+"px,0)";
    var blocked=false;if(!S2.fixed) for(var k=0;k<S2.keep.length;k++){var q=S2.keep[k];if(sx+hw>q.l&&sx-hw<q.r&&sy+hh>q.t&&sy-hh<q.b){blocked=true;break}}
    if(blocked!==g.blocked){g.blocked=blocked;g.el.classList.toggle("hide",blocked);g.el.tabIndex=blocked?-1:0}
  });
  var wi=mod(Math.round((S2.center-DW/2)/STEP),4);
  if(wi!==S2.wallIdx){S2.wallIdx=wi;var w=$(".ar2-where",S2.scr),nm=ses.game.camp.walls&&ses.game.camp.walls[wi];if(w) w.textContent=nm||("Wall "+(wi+1))}
}
function campKick(){var S2=ses&&ses.camp;if(!S2||S2.raf) return;S2.last=0;S2.raf=requestAnimationFrame(campTick)}
function campTick(ts){
  var S2=ses&&ses.camp;if(!S2) return;S2.raf=0;
  var dt=S2.last?Math.min(48,ts-S2.last):16;S2.last=ts;var busy=false;
  if(S2.tween){var t=Math.min(1,(ts-S2.tween.t0)/S2.tween.dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;S2.center=S2.tween.from+S2.tween.delta*e;S2.dirty=true;if(t>=1) S2.tween=null;else busy=true}
  else if(!S2.dragging&&Math.abs(S2.vel)>0.004){S2.center+=S2.vel*dt;S2.vel*=Math.exp(-dt/200);S2.dirty=true;busy=true}
  if(S2.dirty){S2.dirty=false;campRender()}
  if(busy||S2.dragging) campKick();
}
function shortest(a,b){return mod(b-a+LOOP/2,LOOP)-LOOP/2}
function campTurnTo(target,dur){
  var S2=ses.camp;if(!S2) return;var d=shortest(S2.center,target);S2.vel=0;
  if(reduced()||!dur){S2.center+=d;S2.dirty=true;campKick();return}
  S2.tween={from:S2.center,delta:d,t0:performance.now(),dur:dur};campKick();
}
function campTurnBy(px){var S2=ses.camp;if(!S2) return;var b=S2.tween?S2.tween.from+S2.tween.delta:S2.center;campTurnTo(b+px,360)}
function campSnap(dir){var S2=ses.camp;if(!S2) return;var b=S2.tween?S2.tween.from+S2.tween.delta:S2.center,idx=Math.round((b-DW/2)/STEP)+dir;campTurnTo(idx*STEP+DW/2,520)}
function bindCampInput(){
  var S2=ses.camp,v=S2.view,sx=0,lx=0,lt=0,pid=null,moved=false;
  v.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;if(pid!==null) return;pid=e.pointerId;sx=lx=e.clientX;lt=e.timeStamp;moved=false;S2.vel=0;S2.tween=null});
  v.addEventListener("pointermove",function(e){
    if(e.pointerId!==pid) return;
    if(!moved){if(Math.abs(e.clientX-sx)<6) return;moved=true;S2.dragging=true;v.classList.add("grab");try{v.setPointerCapture(pid)}catch(err){}}
    var dx=e.clientX-lx,dt=Math.max(1,e.timeStamp-lt);lx=e.clientX;lt=e.timeStamp;
    S2.center-=dx/S2.sc;var inst=-(dx/S2.sc)/dt;S2.vel=Math.max(-3,Math.min(3,S2.vel*.6+inst*.4));S2.dirty=true;campKick();
  });
  function up(e){
    if(e.pointerId!==pid) return;pid=null;
    if(moved){S2.dragging=false;v.classList.remove("grab");S2.suppress=true;setTimeout(function(){if(S2)S2.suppress=false},60);if(reduced()||(e.timeStamp-lt)>90) S2.vel=0;try{v.releasePointerCapture(e.pointerId)}catch(err){}campKick()}
    moved=false;
  }
  v.addEventListener("pointerup",up);v.addEventListener("pointercancel",up);
  v.addEventListener("click",function(e){if(S2.suppress){e.stopPropagation();e.preventDefault()}},true);
  v.addEventListener("wheel",function(e){e.preventDefault();var d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;S2.tween=null;S2.vel=0;S2.center+=d/S2.sc*.9;S2.dirty=true;campKick()},{passive:false});
}
function updatePack(bump){
  var S2=ses.camp;if(!S2) return;var n=prog().gear.length,N=ses.game.camp.gear.length;
  S2.packB.textContent=n+"/"+N;S2.pack.setAttribute("aria-label","Backpack: "+n+" of "+N+" packed");
  if(bump){S2.pack.classList.remove("bump");void S2.pack.offsetWidth;S2.pack.classList.add("bump")}
  updateProgress();
}
function showGo(quiet){
  var S2=ses.camp;if(!S2) return;
  $("span",S2.bub).textContent=pick(ses.game.camp.goBubble);
  S2.bub.classList.add("on");campLayout();
  if(!quiet){var b=$(".ar2-go",S2.bub);try{b.focus({preventScroll:true})}catch(e){}}
}

/* Savannah-style packing (game.camp.style="pack"), copied from the Research Station:
   age 6 and under tap the numbers in order and Spark spells the word (letter-by-letter spelling is for ages 4-6 only);
   older kids tap any item and it packs at once while Spark says its name. No questions.
   Fast taps are never dropped or queued: every tap registers at once and a new tap cuts Spark's last line short. */
function packWord(w){return w.toLowerCase()}
function spellLine(w){return w.toUpperCase().replace(/[^A-Z]/g,"").split("").join(", ")}
async function onPack(g){
  var S2=ses.camp;if(!S2||g.packed||g.flying) return;
  var C=ses.game.camp,tok=S2.tok,NUM=lvl()==="lo";
  S2.gear.forEach(function(x){x.el.classList.remove("next")});
  var line;
  if(NUM){
    var next=S2.gear.filter(function(x){return !x.packed})[0];
    if(next&&g!==next){
      sfx("no");g.el.classList.remove("nudge");void g.el.offsetWidth;g.el.classList.add("nudge");next.el.classList.add("next");
      say(pick(C.wrongNum||"Not yet! Find number {n}, the {w}.").replace("{n}",next.n).replace("{w}",packWord(next.it.word)),{state:"concern",after:"idle"});
      return;
    }
    var nx=S2.gear.filter(function(x){return !x.packed&&x!==g})[0];
    line=["Yes! "+g.it.word+". "+spellLine(g.it.word)+". "+g.it.word+"!"];
    if(nx){line.push("Number "+nx.n+" is the "+packWord(nx.it.word)+".");S2.prompt.textContent="Tap number "+nx.n}
    else S2.prompt.textContent=g.it.word.toUpperCase().split("").join(" - ");
    line=line.join(" ");
  }else{
    var left0=S2.gear.filter(function(x){return !x.packed&&x!==g}).length;
    line=g.it.word+"! "+pick(g.it.line);
    S2.prompt.textContent=left0?pick(C.prompt):pick(C.readyPrompt);
  }
  sfx("pop");
  say(line,{state:"celebration",after:"idle"});
  S2.flyN=(S2.flyN||0)+1;
  var f=flyPack(g,tok);updatePack(false);
  await f;S2.flyN--;
  if(!live(tok)||!ses.camp) return;
  if(!S2.gear.some(function(x){return !x.packed})&&!S2.flyN&&!S2.doneFired){S2.doneFired=true;packDone(tok)}
}
function flyPack(g,tok){
  return new Promise(function(done){
    var S2=ses.camp,it=g.it;g.flying=true;
    var r=g.el.getBoundingClientRect(),pr=rectOf(S2.pack),size=clamp(Math.min(r.width,r.height)||120,80,170);
    var sx=clamp(r.left+r.width/2,20,innerWidth-20),sy=clamp(r.top+r.height/2,20,innerHeight-20);
    var c=el("div","ar2-fly");c.innerHTML=picInner(it.pic);c.style.width=c.style.height=size+"px";document.body.appendChild(c);
    g.packed=true;mut(function(p){if(p.gear.indexOf(it.id)<0) p.gear.push(it.id)});
    g.el.classList.add("gone");
    var fin=function(){c.remove();g.flying=false;if(!live(tok)||!ses.camp){done();return}sfx("thunk");updatePack(true);burst(pr.cx,pr.cy,8);done()};
    if(c.animate&&!reduced()){
      var a=c.animate([{transform:"translate3d("+(sx-size/2)+"px,"+(sy-size/2)+"px,0) scale(1)",opacity:1},{transform:"translate3d("+((sx+pr.cx)/2-size/2)+"px,"+(Math.min(sy,pr.cy)-80-size/2)+"px,0) scale(1.1)",opacity:1,offset:.45},{transform:"translate3d("+(pr.cx-size/2)+"px,"+(pr.cy-size/2)+"px,0) scale(.24)",opacity:.3}],{duration:780,easing:"cubic-bezier(.4,.1,.3,1)",fill:"forwards"});
      a.onfinish=a.oncancel=fin;
    }else fin();
  });
}
async function packDone(tok){
  var S2=ses.camp;if(!S2) return;
  S2.prompt.textContent=pick(ses.game.camp.readyPrompt);showGo();
  sfx("win");var pr=rectOf(S2.pack);burst(pr.cx,pr.cy,16);
  await say(ses.game.camp.finish,{state:"celebration",after:"celebration"});
}

/* tap on a gear item: Spark says what it is, ONE picture question earns it, then the kid drags it into the backpack */
async function onGear(g){
  var S2=ses.camp;if(!S2||S2.busy||g.packed||g.flying) return;
  S2.busy=true;var tok=S2.tok;
  var it=g.it;
  S2.prompt.textContent=it.word;
  sfx("pop");
  var intro=say(it.intro);
  var res=await ask(it.q,{tag:"Earn the "+it.word+"!",tagPic:it.pic,lead:intro,sticky:true});
  if(!live(tok)||!ses.camp) return;
  /* carry the earned item: drag it into the backpack (or tap it / the pack) */
  await carryToPack(g,tok);
  if(!live(tok)||!ses.camp) return;
  var left=ses.game.camp.gear.length-prog().gear.length;
  S2.busy=false;
  S2.prompt.textContent=left?pick(ses.game.camp.prompt):pick(ses.game.camp.readyPrompt);
  if(left){await say([it.word+" is packed!",pick(it.fact)].join(" "))}
  else{await say([it.word+" is packed!",pick(it.fact)].join(" "));if(!live(tok)) return;showGo();await say(ses.game.camp.finish,{state:"celebration",after:"celebration"})}
}
function carryToPack(g,tok){
  return new Promise(function(done){
    var S2=ses.camp,it=g.it,size=clamp(Math.min(innerWidth,innerHeight)*.3,110,200);
    var c=el("div","ar2-ghost");c._size=size;c.style.width=c.style.height=size+"px";c.innerHTML=picInner(it.pic);c.style.pointerEvents="auto";c.style.cursor="grab";c.style.touchAction="none";
    c.style.filter="drop-shadow(0 0 18px #ffe56a) drop-shadow(0 10px 8px #0008)";
    document.body.appendChild(c);
    var cx=innerWidth/2,cy=innerHeight*.5;placeGhost(c,cx,cy,0);
    if(c.animate&&!reduced()) c.animate([{transform:c.style.transform+" scale(.2)",opacity:0},{transform:c.style.transform+" scale(1.15)",opacity:1,offset:.6},{transform:c.style.transform+" scale(1)",opacity:1}],{duration:500,easing:"ease-out"});
    burst(cx,cy,10);sfx("win");
    S2.prompt.textContent="Drag or tap it into your backpack!";
    S2.pack.classList.add("glow");
    var finished=false,idle=setTimeout(function(){go(false)},14000);
    function go(){
      if(finished) return;finished=true;clearTimeout(idle);S2.pack.classList.remove("glow");
      if(!live(tok)){c.remove();done();return}
      g.packed=true;mut(function(p){if(p.gear.indexOf(it.id)<0) p.gear.push(it.id)});
      var pr=rectOf(S2.pack),r=c.getBoundingClientRect();
      var fin=function(){c.remove();g.el.classList.add("gone");sfx("thunk");updatePack(true);var r2=rectOf(S2.pack);burst(r2.cx,r2.cy,8);done()};
      if(c.animate&&!reduced()){
        var a=c.animate([{transform:"translate3d("+r.left+"px,"+r.top+"px,0) scale(1)",opacity:1},{transform:"translate3d("+((r.left+pr.cx)/2-size/2)+"px,"+(Math.min(r.top,pr.cy)-60)+"px,0) scale(.7)",opacity:1,offset:.5},{transform:"translate3d("+(pr.cx-size/2)+"px,"+(pr.cy-size/2)+"px,0) scale(.22)",opacity:.3}],{duration:620,easing:"cubic-bezier(.4,.1,.3,1)",fill:"forwards"});
        a.onfinish=a.oncancel=fin;
      }else fin();
    }
    var st={moved:false,sx:0,sy:0};
    c.addEventListener("pointerdown",function(e){
      e.preventDefault();e.stopPropagation();st.sx=e.clientX;st.sy=e.clientY;st.moved=false;try{c.setPointerCapture(e.pointerId)}catch(_){}
      function mv(ev){if(ev.pointerId!==e.pointerId) return;if(Math.hypot(ev.clientX-st.sx,ev.clientY-st.sy)>7) st.moved=true;if(st.moved) placeGhost(c,ev.clientX,ev.clientY,0)}
      function up(ev){
        if(ev.pointerId!==e.pointerId) return;c.removeEventListener("pointermove",mv);c.removeEventListener("pointerup",up);c.removeEventListener("pointercancel",up);
        var pr=rectOf(S2.pack);
        if(!st.moved||inside(ev.clientX,ev.clientY,pr,46)) go();
        else{ // dropped elsewhere: float back to the middle, gently
          if(c.animate) c.animate([{transform:c.style.transform},{transform:"translate3d("+(innerWidth/2-size/2)+"px,"+(innerHeight*.5-size/2)+"px,0)"}],{duration:300,fill:"forwards"});
          placeGhost(c,innerWidth/2,innerHeight*.5,0);say("Almost! Drag it to the backpack, or just tap the backpack, right next to me.",{cap:true,after:"idle"});
        }
      }
      c.addEventListener("pointermove",mv);c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
    });
    S2.pack.style.pointerEvents="auto";S2.pack.style.cursor="pointer";
    S2.pack.onclick=function(){go()};
    var ds=ses.cleanup;ds.push(function(){clearTimeout(idle)});
  });
}
function onGo(){
  var S2=ses.camp;if(!S2) return;S2.bub.classList.remove("on");sfx("win");
  ses.campCenter=S2.center;
  var p=prog();var all=ses.game.stops.every(function(s){return p.stops[s.id]});
  if(all) mut(function(q){q.stops={}});
  var first=0;p=prog();for(var i=0;i<ses.game.stops.length;i++){if(!p.stops[ses.game.stops[i].id]){first=i;break}}
  ses.stopIdx=first;startRide(first);
}

/* ------------------------------------------------------------ question card (Savannah's card: picture + words, every choice read aloud) */
function lq(q){var L=q.levels||q;if(SA()&&SA().hasBands(L)) return SA().pick(L,band())||q;return L[lvl()]||L.mid||L.lo||q}
function ask(Qraw,o){
  o=o||{};var tok=ses.tok,Q=lq(Qraw);
  return new Promise(function(resolve){
    var q=el("div","ar2-q");ses.root.appendChild(q);var qb=el("button","ar2-btn ar2-back ar2-qback");qb.type="button";qb.innerHTML="<span aria-hidden=\"true\">&#8592;</span> <span class=\"ar2-bl\">Camp</span>";qb.setAttribute("aria-label","Back to the camp");qb.onclick=onBack;var prevMode=ses.mode;
    var order=Q.o.map(function(x,i){return i});if(Qraw.shuffle!==false&&ses.game.shuffleOptions!==false) order=shuffle(order);
    /* 10/10 item 24: never show more choices than the age allows (4-6: 2, 7-9: 3, 10+: 4); the right answer is always kept */
    var mx=0;try{mx=SA()&&SA().rules?+(SA().rules(band())||{}).maxChoices||0:0}catch(e){mx=0}
    if(mx>=2&&order.length>mx){var keep=[Q.a],rest=order.filter(function(i){return i!==Q.a});keep=keep.concat(rest.slice(0,mx-1));order=order.filter(function(i){return keep.indexOf(i)>=0})}
    var tagPic=o.tagPic?'<span class="tp">'+picInner(o.tagPic)+'</span>':"";
    q.innerHTML='<div class="ar2-qcard"><div class="ar2-qtag">'+tagPic+'<span>'+esc(o.tag||"Quick question!")+'</span></div><div class="ar2-qtxt"></div><div class="ar2-qopts"></div></div>';q.appendChild(qb);
    $(".ar2-qtxt",q).textContent=Q.q;
    var box=$(".ar2-qopts",q);box.dataset.n=order.length;box.style.gridTemplateColumns="repeat("+order.length+",minmax(0,1fr))";
    var wrong=0,done=false,rtok=0,cards=[];
    order.forEach(function(oi){
      var op=Q.o[oi],cell=el("div","ar2-ocard"),b=el("button","ar2-opt");b.type="button";b.dataset.i=oi;b.setAttribute("aria-label",op.label);
      var ph=norm(op.pic),pa=ph.a&&asset(ph.a),pic=el("span","ar2-oimg"+((ph.svg||ph.contain||(pa&&pa.alpha&&ph.cover!==true))?" contain":""),picInner(op.pic));/* cut-out animals show whole, never cropped */
      b.appendChild(pic);var lab=el("span","ar2-olab");lab.textContent=op.label;b.appendChild(lab);
      var sp=el("button","ar2-spk","\uD83D\uDD0A");sp.type="button";sp.dataset.i=oi;sp.setAttribute("aria-label","Hear: "+op.label);
      cell.appendChild(b);cell.appendChild(sp);box.appendChild(cell);cards.push({oi:oi,b:b,cell:cell});
    });
    function mark(oi,on){cards.forEach(function(c){c.b.classList.toggle("say",on&&c.oi===oi)})}
    async function readAll(){
      var my=++rtok;
      if(o.lead) await o.lead;
      if(my!==rtok||done||!live(tok)) return;
      await say(Q.q);
      for(var i=0;i<order.length;i++){
        if(my!==rtok||done||!live(tok)) return;
        mark(order[i],true);await say(Q.o[order[i]].label,{cap:false,gap:500});mark(order[i],false);
      }
    }
    q.addEventListener("click",function(e){
      var sk=e.target.closest(".ar2-spk");
      if(sk&&!done){rtok++;hush();var si=+sk.dataset.i;mark(si,true);say(Q.o[si].label,{cap:false,gap:600}).then(function(){mark(si,false)});return}
      var b=e.target.closest(".ar2-opt");if(!b||b.disabled||done) return;
      rtok++;mark(-1,false);var i=+b.dataset.i;
      if(i===Q.a){
        done=true;[].forEach.call(box.querySelectorAll("button"),function(x){x.disabled=true});b.classList.add("ok");sfx("win");
        var r=rectOf(b);burst(r.cx,r.cy,14);
        (async function(){
          await say(Q.ok||"Yes!",{state:"celebration",after:"idle"});
          if(!live(tok)){q.remove();resolve({wrong:wrong});return}
          q.remove();resolve({wrong:wrong});
        })();
      }else{
        wrong++;b.classList.add("no");b.disabled=true;sfx("no");
        cards.forEach(function(c){c.b.classList.remove("hint")});
        var line=wrong>=2?(Q.hint?"Here is a clue. "+Q.hint:"Look at the glowing one."):(lvl()==="lo"?"Oops, not that one. Try another!":"Not quite. Have another look!");
        say(line,{state:"concern",after:"idle"});
        if(wrong>=2){var right=cards.filter(function(c){return c.oi===Q.a})[0];if(right) right.b.classList.add("hint")}
      }
    });
    ses.skipQ=function(){if(done) return;done=true;rtok++;hush();q.remove();resolve({wrong:wrong,skipped:true})};
    ses.destroyMod=function(){done=true;rtok++;q.remove()};
    ses.qOpen=true;
    readAll();
  }).then(function(r){ses.qOpen=false;return r});
}

/* ------------------------------------------------------------ journey: ride -> stop (activity, facts, one question, sticker) */
function bdFor(i){return ses.game.stops[i].bd||{wall:i%4,x:50}}
function startRide(i){
  if(ses.game.ride&&ses.game.ride.view==="pov") return startRidePov(i);
  var tok=newTok();clearScr();setMode("ride");ses.stopIdx=i;ses.stopFacts=0;ses.factHeard={};ses.skippedAct=false;ses.skipStop=false;updateProgress();updateChips();
  var g=ses.game,s=g.stops[i],scr=el("div","ar2-screen ar2-ride");
  var bands=[{f:0,t:.56,sp:34},{f:.56,t:1,sp:150}];
  var inners=bands.map(function(b){var d=el("div","ar2-rb");d.style.top=(b.f*100)+"%";d.style.height=((b.t-b.f)*100)+"%";var inn=el("div","ar2-rbi");d.appendChild(inn);scr.appendChild(d);return inn});
  var veh=el("div","ar2-veh");veh.innerHTML=picInner(g.ride.veh);
  scr.appendChild(el("div","ar2-streaks"));scr.appendChild(veh);
  var chip=el("div","ar2-nextchip");chip.textContent=(i===0?"First stop: ":"Next stop: ")+s.name;scr.appendChild(chip);
  ses.scr.appendChild(scr);
  var st=ses.cfg.strip,vh=innerHeight,Ww=Math.round(LOOP*vh/DH);
  var b0=bdFor(i),c0=b0.wall*STEP+((b0.x==null?50:b0.x)/100)*DW;
  inners.forEach(function(inn,k){
    var b=bands[k];inn.style.width="100%";inn.style.height=vh+"px";inn.style.top=(-b.f*vh)+"px";
    inn.style.backgroundImage="url("+surl()+")";inn.style.backgroundSize="auto "+vh+"px";inn.style.backgroundRepeat="repeat-x";
  });
  var t0=performance.now(),x0=c0*vh/DH-innerWidth/2;
  function frame(ts){
    if(!live(tok)||ses.mode!=="ride") return;
    var t=(ts-t0)/1000;
    inners.forEach(function(inn,k){inn.style.backgroundPositionX=(-(x0+(reduced()?0:t*bands[k].sp)))+"px"});
    ses.raf=requestAnimationFrame(frame);
  }
  ses.raf=requestAnimationFrame(frame);
  (async function(){
    var lines=s.ride||g.ride.lines;
    var t00=Date.now();
    await say(lines[0],{state:"speaking"});
    if(!live(tok)) return;
    var rest=Math.max(0,3200-(Date.now()-t00));if(rest) await sleep(rest);
    if(!live(tok)) return;
    if(lines[1]) await say(lines[1]);
    if(!live(tok)) return;
    arrive(i,tok);
  })();
}
/* ------------------------------------------------------------ RIDE, rider's-eye view (game.ride.view="pov"), like Savannah's windshield:
   we sit in the sled basket; the husky team runs ahead, the snow streams toward us in true perspective (ground plane drawn row by row
   with mip levels), ice blocks pass by on both sides, snow sprays from the runners. Sky + horizon come from the area's 360 strip. */
/* ------------------------------------------------------------ RIDE as real video (game.ride.video / stop.rideVideo = "<name>"; files <name>-1080.mp4, <name>-4k.mp4, <name>.jpg):
   a photoreal first-person sled clip, muted, inline, looped (the loop is baked seamless). The sled speeds up and slows down by easing playbackRate;
   it is paused on the poster frame for reduced motion. Same timing, lines, chip and arrive() as the drawn ride. */
function startRideVideo(i,tok,vb){
  var g=ses.game,s=g.stops[i],R=g.ride,vids=ses.cfg.video||{};
  var scr=el("div","ar2-screen ar2-ride ar2-pov ar2-pvidride"),chip=el("div","ar2-nextchip");chip.textContent=(i===0?"First stop: ":"Next stop: ")+s.name;
  var hd=bigScreen()&&vids[vb+"-4k.mp4"],fn=vb+(hd?"-4k.mp4":"-1080.mp4"),pj=vids[vb+".jpg"],rm=reduced();
  var v=document.createElement("video");v.className="ar2-pvid";v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");v.setAttribute("muted","");
  v.loop=true;v.preload="auto";v.controls=false;v.disablePictureInPicture=true;v.setAttribute("aria-hidden","true");
  if(pj){v.poster=BASE+ses.id+"/"+vb+".jpg?v="+pj.v;scr.style.backgroundImage="url("+v.poster+")"}
  var shade=el("div","ar2-pvshade");
  scr.appendChild(v);scr.appendChild(shade);scr.appendChild(chip);ses.scr.appendChild(scr);
  v.src=BASE+ses.id+"/"+fn+"?v="+vids[fn].v;
  var F=ses.rideFilm={v:v,name:fn,playing:false,stalls:0};
  v.addEventListener("playing",function(){F.playing=true});v.addEventListener("waiting",function(){if(F.playing) F.stalls++});
  function tryPlay(){if(rm) return;var p;try{p=v.play()}catch(e){p=null}if(p&&p.catch) p.catch(function(){})}
  if(!rm){tryPlay();v.addEventListener("canplay",tryPlay,{once:true})}
  var once=function(){if(v.isConnected&&v.paused&&!rm&&phase!=="stop") tryPlay()};document.addEventListener("pointerdown",once,true);
  ses.rideCleanup=function(){document.removeEventListener("pointerdown",once,true);try{v.pause();v.removeAttribute("src");v.load()}catch(e){}};
  var V=rm?0:9,sp=0,t0=performance.now(),last=t0,phase="go",dec0=0,rate=-1;
  function frame(ts){
    if(!live(tok)||ses.mode!=="ride") return;
    var t=(ts-t0)/1000,dt=Math.min(.05,(ts-last)/1000);last=ts;
    var vt=phase==="go"?V*clamp(t/1.1,0,1):(phase==="slow"?V*(1-clamp((ts-dec0)/1300,0,1)):0);
    sp+=(vt-sp)*Math.min(1,dt*6);
    if(!rm){var r=Math.round(clamp(.3+.7*sp/9,.3,1)*20)/20;
      if(phase==="stop"||sp<.5){if(!v.paused&&phase==="stop") v.pause()}
      else if(r!==rate){rate=r;try{v.playbackRate=r}catch(e){}}}
    scr.classList.toggle("moving",sp>1.2);
    ses.raf=requestAnimationFrame(frame);
  }
  ses.raf=requestAnimationFrame(frame);
  ses.ridePov={get v(){return sp},get phase(){return phase},film:F};
  (async function(){
    var lines=s.ride||R.lines,t00=Date.now();
    await say(lines[0],{state:"speaking"});
    if(!live(tok)) return;
    var rest=Math.max(0,3600-(Date.now()-t00));if(rest) await sleep(rest);
    if(!live(tok)) return;
    var p1=lines[1]?say(lines[1]):Promise.resolve();
    phase="slow";dec0=performance.now();
    await Promise.all([p1,sleep(rm?200:1400)]);
    if(!live(tok)) return;
    phase="stop";try{v.pause()}catch(e){}
    arrive(i,tok);
  })();
}
function startRidePov(i){
  var tok=newTok();clearScr();setMode("ride");ses.stopIdx=i;ses.stopFacts=0;ses.factHeard={};ses.skippedAct=false;ses.skipStop=false;updateProgress();updateChips();
  var g=ses.game,s=g.stops[i],R=g.ride,st=ses.cfg.strip;
  var vbase=s.rideVideo||R.video,vids=ses.cfg.video||{};
  if(vbase&&vids[vbase+"-1080.mp4"]) return startRideVideo(i,tok,vbase);
  var scr=el("div","ar2-screen ar2-ride ar2-pov"),sky=el("div","ar2-psky"),cv=el("canvas","ar2-pgnd"),dogs=el("div","ar2-pdogs",picInner(R.dogs)),fg=el("div","ar2-pfg",picInner(R.fg));
  var chip=el("div","ar2-nextchip");chip.textContent=(i===0?"First stop: ":"Next stop: ")+s.name;
  scr.appendChild(sky);scr.appendChild(cv);scr.appendChild(dogs);scr.appendChild(fg);scr.appendChild(chip);ses.scr.appendChild(scr);
  var ctx=cv.getContext("2d");
  var b0=bdFor(i),c0=b0.wall*STEP+((b0.x==null?50:b0.x)/100)*DW,HZ=(s.bd&&s.bd.hz)||R.hz||.6;
  sky.style.backgroundImage="url("+surl()+")";
  var L={},mips=[],tint="#d6e2f0",props=[],spray=[],rm=reduced();
  var tex=new Image();tex.decoding="async";tex.src=aurl(R.ground);
  tex.onload=function(){var src=tex,w=tex.naturalWidth;for(var k=0;k<6&&w>=64;k++){var c=document.createElement("canvas");c.width=c.height=w;c.getContext("2d").drawImage(src,0,0,w,w);mips.push({p:ctx.createPattern(c,"repeat"),f:Math.pow(2,k)});src=c;w=w>>1}};
  var prop=new Image();prop.decoding="async";if(R.prop&&asset(R.prop)) prop.src=aurl(R.prop);
  /* fog / tint colour = the strip's snow just under the horizon at this stop */
  var stripImg=new Image();stripImg.onload=function(){try{var c=document.createElement("canvas");c.width=c.height=1;var x=c.getContext("2d");x.drawImage(stripImg,mod(c0,LOOP)-40,HZ*DH+6,80,24,0,0,1,1);var d=x.getImageData(0,0,1,1).data;tint="rgb("+d[0]+","+d[1]+","+d[2]+")"}catch(e){}};stripImg.src=BASE+ses.id+"/"+st.file+"?v="+st.v;
  function layout(){
    var W=scr.clientWidth||innerWidth,H=scr.clientHeight||innerHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
    var sh=H*1.25,top=H*.47-HZ*sh;
    var fw=Math.max(W,H*.8),fh=fw*9/16,ft=Math.max(H*.76-.54*fh,H-fh),rim=ft+.54*fh;
    L={W:W,H:H,sh:sh,sc:sh/DH,top:top,gy:top+HZ*sh,rim:rim,F:H*.8,dpr:dpr};
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    sky.style.height=sh+"px";sky.style.top=top+"px";sky.style.backgroundSize="auto "+sh+"px";
    fg.style.width=fw+"px";fg.style.height=fh+"px";fg.style.top=ft+"px";fg.style.left=((W-fw)/2)+"px";
    var dh=Math.max(60,(rim-L.gy)*1.05);dogs.style.height=dh+"px";dogs.style.width=(dh*1.03)+"px";dogs.style.top=(rim-dh*.93)+"px";
  }
  layout();var onR=function(){layout()};window.addEventListener("resize",onR);ses.cleanup.push(function(){window.removeEventListener("resize",onR)});
  for(var k=0;k<14;k++) props.push({x:(Math.random()<.5?-1:1)*(1.8+Math.random()*6),z:4+Math.random()*60,s:.5+Math.random()*.9});
  var V=rm?0:9,v=0,dist=0,t0=performance.now(),last=t0,phase="go",dec0=0,K=170,CH=1;
  function draw(t,dt){
    var W=L.W,H=L.H,gy=L.gy,F=L.F,dpr=L.dpr;
    var camX=rm?0:Math.sin(t*.45)*.35+Math.sin(t*1.3)*.08,yaw=camX*90;
    sky.style.backgroundPosition=(W/2-(c0+yaw/L.sc+(rm?0:t*6))*L.sc)+"px 0";
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    if(mips.length){
      var y0=Math.ceil(gy),y1=Math.ceil(H);
      for(var y=y0;y<y1;y++){
        var dy=y-gy+.5,z=CH*F/dy,sc0=dy/(CH*K),lv=clamp(Math.floor(Math.log2(1/sc0)),0,mips.length-1),m=mips[lv],sc=sc0*m.f;
        m.p.setTransform(new DOMMatrix([sc,0,0,sc,W/2-sc*(camX*K/m.f),y+.5+sc*((dist+z)*K/m.f)]));
        ctx.fillStyle=m.p;ctx.fillRect(0,y,W,1);
      }
      /* packed trail where the dogs run */
      ctx.save();ctx.globalAlpha=.16;ctx.fillStyle="#5c7fa8";ctx.beginPath();
      var bw=1.1,bh=(H-gy)/CH;ctx.moveTo(W/2,gy);ctx.lineTo(W/2+(-bw-camX)*bh,H);ctx.lineTo(W/2+(bw-camX)*bh,H);ctx.closePath();ctx.fill();ctx.restore();
      /* tint the plane toward this stop's light, fog the far part into the horizon */
      ctx.save();ctx.globalCompositeOperation="multiply";ctx.globalAlpha=.55;ctx.fillStyle=tint;ctx.fillRect(0,gy,W,H-gy);ctx.restore();
      var fogH=(H-gy)*.45,gr=ctx.createLinearGradient(0,gy-2,0,gy+fogH);gr.addColorStop(0,tint);gr.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=gr;ctx.globalAlpha=.92;ctx.fillRect(0,gy-2,W,fogH+2);ctx.globalAlpha=1;
    }
    /* ice blocks passing on both sides (far to near) */
    if(prop.complete&&prop.naturalWidth){
      var ar=prop.naturalWidth/prop.naturalHeight;
      props.sort(function(a,b){return b.z-a.z}).forEach(function(o){
        if(o.z<.6) return;var px=F*o.s/o.z,sx=W/2+(o.x-camX)*F/o.z,sy=gy+CH*F/o.z;
        if(sx+px*ar<-50||sx-px*ar>W+50) return;
        ctx.globalAlpha=clamp((60-o.z)/14,0,1);ctx.drawImage(prop,sx-px*ar/2,sy-px*.92,px*ar,px);
      });ctx.globalAlpha=1;
    }
    /* snow spray from the runners */
    if(!rm&&v>1){for(var n=0;n<2;n++) spray.push({x:W*(n?.86:.14)+(Math.random()-.5)*30,y:L.rim+20,vx:(n?1:-1)*(80+Math.random()*160),vy:-(120+Math.random()*160),l:0,r:2+Math.random()*3})}
    ctx.fillStyle="#fff";
    spray=spray.filter(function(p){p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=420*dt;if(p.l>.9) return false;ctx.globalAlpha=.8*(1-p.l/.9);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();return true});
    ctx.globalAlpha=1;
  }
  function frame(ts){
    if(!live(tok)||ses.mode!=="ride") return;
    var t=(ts-t0)/1000,dt=Math.min(.05,(ts-last)/1000);last=ts;
    var vt=phase==="go"?V*clamp(t/1.1,0,1):(phase==="slow"?V*(1-clamp((ts-dec0)/1300,0,1)):0);
    v+=(vt-v)*Math.min(1,dt*6);dist+=v*dt;
    props.forEach(function(o){o.z-=v*dt;if(o.z<.6){o.z=55+Math.random()*10;o.x=(Math.random()<.5?-1:1)*(1.8+Math.random()*6);o.s=.5+Math.random()*.9}});
    scr.classList.toggle("moving",v>1.2);
    draw(t,dt);
    ses.raf=requestAnimationFrame(frame);
  }
  ses.raf=requestAnimationFrame(frame);
  ses.ridePov={get v(){return v},get phase(){return phase}};
  (async function(){
    var lines=s.ride||R.lines,t00=Date.now();
    await say(lines[0],{state:"speaking"});
    if(!live(tok)) return;
    var rest=Math.max(0,3600-(Date.now()-t00));if(rest) await sleep(rest);
    if(!live(tok)) return;
    var p1=lines[1]?say(lines[1]):Promise.resolve();
    phase="slow";dec0=performance.now();
    await Promise.all([p1,sleep(rm?200:1400)]);
    if(!live(tok)) return;
    phase="stop";
    arrive(i,tok);
  })();
}

async function arrive(i,tok){
  if(!live(tok)) return;
  tok=newTok();clearScr();snapBand();setMode("stop");ses.stopIdx=i;ses.stopFacts=0;ses.factHeard={};ses.skippedAct=false;ses.skipStop=false;updateProgress();updateChips();
  var g=ses.game,s=g.stops[i];
  var scr=el("div","ar2-screen ar2-stage"),bd=el("div","ar2-bd"),act=el("div","ar2-act");
  scr.appendChild(bd);scr.appendChild(act);ses.scr.appendChild(scr);
  setBd(bd,s.bd||bdFor(i));
  var onR=function(){if(ses&&ses.mode==="stop") setBd(bd,s.bd||bdFor(i))};window.addEventListener("resize",onR);ses.cleanup.push(function(){window.removeEventListener("resize",onR)});
  var api=makeApi(act,scr,s,tok);ses.api=api;
  var fin=null,endP=new Promise(function(r){fin=r});ses.endAct=function(){fin({skipped:true})};
  ses.destroyMod=function(){api.cleanup.forEach(function(f){try{f()}catch(e){}});api.cleanup=[]};
  var M=mods[s.act.type],actCfg=s.act;ses.diff={};ses.st={wrong:0,hints:0,t0:Date.now()};
  if(s.act.difficulty&&SA()){ses.diff=SA().difficulty(s.act.difficulty,ses.band,window.SparkProgress?SparkProgress.tierFor(ses.id,s.id,ses.tier):ses.tier);/* progression: ladder step read */actCfg={};for(var k in s.act) actCfg[k]=s.act[k];for(var k2 in ses.diff) if(k2.charAt(0)!=="_") actCfg[k2]=ses.diff[k2];}
  if(SA()&&SA().takeGhost()) ses.diff._ghost=true;
  say(s.intro);
  var modP=M?M(api,actCfg).then(function(r){return r||{}},function(e){try{console.warn("activity failed",e)}catch(x){}return {error:true}}):Promise.resolve({error:true});
  await Promise.race([modP,endP]);
  if(!live(tok)) return;
  ses.destroyMod();api.hint(null); /* no stale activity hint under the question / next-stop line */
  /* every stop finishes with all its facts told, so the Facts pips always end full (3/3) */
  if(!ses.skippedAct){var fl=(s.facts||[]).length,gd=0;while(ses.stopFacts<fl&&live(tok)&&gd++<fl*3) await stopFact(api)}
  if(!live(tok)) return;
  /* the little win: sparkle + Spark cheers, then sticker, then the ONE question */
  sfx("win");setSpark("celebration");
  if(!ses.skippedAct) await say(s.done||"Great job!",{state:"celebration",after:"idle"});
  if(!live(tok)) return;
  var res=null;
  if(!ses.skipStop){setMode("q");updateProgress();res=await ask(s.q,{tag:"Quick question!",tagPic:s.sticker});if(!live(tok)) return}
  if(ses.skipStop){var actSk=ses.skippedAct;ses.skipStop=false;mut(function(p){p.stops[s.id]=true;p.skipped=p.skipped||{};if(actSk) p.skipped[s.id]=true;else delete p.skipped[s.id]});updateProgress();
    if(i>=g.stops.length-1){showEnd();return}
    if(SA()&&SA().sessionDue()&&!ses.stopShown){ses.stopShown=true;var okp=await stoppingPoint(tok);if(!live(tok)||!okp) return}
    startRide(i+1);return}
  await awardSticker(s,tok);
  if(!live(tok)) return;
  mut(function(p){p.stops[s.id]=true;if(p.stickers.indexOf(s.id)<0) p.stickers.push(s.id);p.skipped=p.skipped||{};if(ses.skippedAct) p.skipped[s.id]=true;else delete p.skipped[s.id]});
  updateProgress();
  var rec=null;if(SA()&&!ses.skippedAct&&!(res&&res.skipped)) rec=SA().record(ses.id,s.id,{firstTry:!!res&&!res.wrong,wrong:(res&&res.wrong||0)+ses.st.wrong,hints:ses.st.hints,ms:Date.now()-ses.st.t0});ses.lastRec=rec;
  if(i>=g.stops.length-1){showEnd();return}
  if(SA()&&SA().sessionDue()&&!ses.stopShown){ses.stopShown=true;var ok=await stoppingPoint(tok);if(!live(tok)||!ok) return}
  var nxt=g.stops[i+1];if(rec&&rec.change>0&&nxt&&nxt.act&&nxt.act.difficulty&&nxt.act.difficulty.tierScale) await say({k:"You are a pro! Let's try a trickier one.",e:"You're a pro! Let's try the trickier version.",u:"Nice work. The next one will be a bit harder.",t:"Strong run. Stepping up the difficulty."});
  var nx=el("button","ar2-next","Next stop \u25B6");nx.type="button";nx.setAttribute("aria-label","Next stop");
  ses.scr.appendChild(nx);
  say(s.after||"Ready for the next stop?");
  nx.onclick=function(){nx.remove();ses.skipQ=null;startRide(i+1)};
  ses.skipQ=function(){nx.click()};
}
/* gentle stopping point (parent session length). No guilt, no countdown: Home or keep going. */
function stoppingPoint(tok){return new Promise(function(done){
  var c=el("div","ar2-stoppt");c.setAttribute("role","dialog");c.setAttribute("aria-label","Good place to stop");
  c.innerHTML='<div class="ar2-stopcard"><div class="ar2-stopico" aria-hidden="true">&#127775;</div><h2>Good place to stop!</h2><p>Your stars are saved. You can come back to the next stop any time.</p><div class="ar2-endbtns"><button type="button" class="ar2-btn big" data-a="home">Home</button><button type="button" class="ar2-btn" data-a="more">Keep going</button></div></div>';
  ses.root.appendChild(c);say({k:"Good place to stop! Your stars are saved.",e:"This is a good place to stop. Your stars are saved.",u:"Good stopping point. Your progress is saved.",t:"Good stopping point. Progress saved."});
  c.addEventListener("click",function(e){var b=e.target.closest("button");if(!b) return;c.remove();hush();if(b.dataset.a==="home"){if(SA()) SA().resetSession();done(false);close()}else{if(SA()) SA().resetSession();done(true)}});
})}
function awardSticker(s,tok){
  return new Promise(function(done){
    var box=el("div","ar2-stkpop");var st=el("div","ar2-sticker new",picInner(s.sticker));st.style.setProperty("--r","-6deg");box.appendChild(st);box.appendChild(el("span","","New sticker!"));
    ses.root.appendChild(box);sfx("win");burst(innerWidth/2,innerHeight*.38,16);
    setTimeout(function(){if(box.animate){var a=box.animate([{opacity:1},{opacity:0,transform:"translate(-50%,-50%) scale(.7)"}],{duration:420});a.onfinish=function(){box.remove();done()}}else{box.remove();done()}},reduced()?600:1700);
  });
}

/* ------------------------------------------------------------ finale: badge + stickers + confetti */
function showEnd(){
  var tok=newTok();clearScr();setMode("end");updateProgress();
  var g=ses.game,b=g.area.badge,p=prog();
  mut(function(q){q.badge=q.badge||Date.now()});
  var scr=el("div","ar2-screen ar2-stage"),bd=el("div","ar2-bd"),end=el("div","ar2-end");scr.appendChild(bd);scr.appendChild(end);ses.scr.appendChild(scr);setBd(bd,g.finaleBd||bdFor(g.stops.length-1));
  var badge='<svg class="ar2-badge" viewBox="0 0 200 220" aria-hidden="true"><defs><linearGradient id="ar2b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+b.c1+'"/><stop offset="1" stop-color="'+b.c2+'"/></linearGradient></defs><path d="M60 150 L40 214 L80 196 L100 214 L100 150Z" fill="#d94a4a"/><path d="M140 150 L160 214 L120 196 L100 214 L100 150Z" fill="#b83a3a"/><circle cx="100" cy="94" r="82" fill="url(#ar2b)" stroke="#fff6c8" stroke-width="6"/><circle cx="100" cy="94" r="64" fill="none" stroke="#7a4a10" stroke-width="3" stroke-dasharray="3 7"/><g transform="translate(100 94)"><path d="M0 -42 L12 -14 L42 -12 L19 8 L27 38 L0 22 L-27 38 L-19 8 L-42 -12 L-12 -14Z" fill="#fff" stroke="#b9780f" stroke-width="3" stroke-linejoin="round"/></g></svg>';
  if(b.pic&&asset(b.pic)) badge='<img class="ar2-badge ar2-badgepic" src="'+aurl(b.pic)+'" alt="" draggable="false">';
  var stk=g.stops.map(function(s,i){return '<span class="ar2-sticker new" style="--r:'+((i%2?5:-5))+'deg;animation-delay:'+(0.4+i*.25)+'s">'+picInner(s.sticker)+'</span>'}).join("");
  end.innerHTML='<div class="ar2-endcard">'+badge+'<h2>'+esc(b.name)+'!</h2><p class="ar2-endtxt"></p><div class="ar2-stickers">'+stk+'</div><div class="ar2-endbtns"><button type="button" class="ar2-btn big" data-a="back">Back to the map</button><button type="button" class="ar2-btn" data-a="home">Home</button><button type="button" class="ar2-btn" data-a="again">Play again</button></div></div>';
  /* the finale lists what the child did; if a stop was skipped, never claim it was done */
  var skipped=g.stops.filter(function(s){return p.skipped&&p.skipped[s.id]}),fin=g.finale;
  if(skipped.length){var nm=skipped.map(function(s){return String(pick(s.name)||"").replace(/[?!.]+$/,"")}).filter(Boolean),lst=nm.length>1?nm.slice(0,-1).join(", ")+" and "+nm[nm.length-1]:nm[0];
    var one=nm.length===1;fin=g.finaleSkip?g.finaleSkip:{k:"You earned the "+b.name+" badge! Next time, come back to play: "+lst+".",e:"You earned the "+b.name+" badge! Next time, come back to play: "+lst+".",u:"You earned the "+b.name+" badge. "+(one?"One stop":"Some stops")+" to come back to: "+lst+".",t:"Badge earned: "+b.name+". Still open: "+lst+"."}}
  $(".ar2-endtxt",end).textContent=pick(fin);
  end.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-a]");if(!a) return;
    if(a.dataset.a==="back") close();
    else if(a.dataset.a==="home"){close();var h=document.getElementById("homeBtn");if(h) h.click()}
    else if(a.dataset.a==="again"){mut(function(q){q.stops={};q.gear=[];q.skipped={}});ses.campCenter=null;showCamp()}});
  sfx("win");confetti(scr);setTimeout(function(){var r=$(".ar2-badge",end);if(r){var rr=rectOf(r);burst(rr.cx,rr.cy,18)}},600);
  say(fin,{state:"celebration",after:"celebration"});
}

/* ------------------------------------------------------------ public */
/* age changed in the parent panel: stop speech, take the new band, and re-render whatever is on screen (hub, stop, end) */
function onAgeChange(){if(!ses||ses.dead) return;if(age()===ses.lastAge&&liveBand()===ses.band) return;hush();var oldB=ses.band,oldP=prog(),oldG=(oldP.gear||[]).slice(),oldW=!!oldP.welcomed;snapBand();
  if(ses.band!==oldB&&oldG.length){try{var CG=((ses.game&&ses.game.camp&&ses.game.camp.gear)||[]).map(function(x){return x.id});mut(function(q){var have=q.gear||(q.gear=[]);CG.forEach(function(id){if(oldG.indexOf(id)>=0&&have.indexOf(id)<0) have.push(id)});q.gear=CG.filter(function(id){return have.indexOf(id)>=0}).concat(have.filter(function(id){return CG.indexOf(id)<0}));if(oldW) q.welcomed=true})}catch(e){console.warn("carry gear",e)}}
  ses.ageChanges=(ses.ageChanges||0)+1;
  try{var m=ses.mode;if(m==="camp") showCamp();else if(m==="stop"||m==="q") arrive(ses.stopIdx,ses.tok);else if(m==="end") showEnd()}catch(e){console.warn("age re-render",e)}}
window.addEventListener("spark:agechange",function(){setTimeout(onAgeChange,0)});
window.addEventListener("storage",function(e){if(e.key==="sparkAge") setTimeout(onAgeChange,0)});
window.SparkAreas={open:open,close:close,register:function(type,fn){mods[type]=fn},modules:mods,
  _state:function(){if(!ses) return null;var p=prog();return {id:ses.id,mode:ses.mode,stopIdx:ses.stopIdx,gear:p.gear.slice(),stops:Object.keys(p.stops),skipped:Object.keys(p.skipped||{}),stickers:p.stickers.slice(),badge:!!p.badge,band:band(),tier:ses.tier,diff:ses.diff||null,lastRec:ses.lastRec||null,facts:ses.stopFacts,lvl:lvl(),
    film:ses.film&&{t:ses.film.v.currentTime,paused:ses.film.v.paused,playing:ses.film.playing,tap:ses.film.tapShown,blocked:ses.film.autoplayBlocked,name:ses.film.name,w:ses.film.v.videoWidth,muted:ses.film.v.muted,rs:ses.film.v.readyState},
    center:ses.camp&&ses.camp.center,ride:ses.ridePov&&ses.mode==="ride"?{v:ses.ridePov.v,phase:ses.ridePov.phase,film:ses.ridePov.film?{name:ses.ridePov.film.name,stalls:ses.ridePov.film.stalls,playing:ses.ridePov.film.playing}:null}:null,spoken:ses.spoken.slice(-30),qOpen:!!ses.qOpen}},
  _look:function(c){var S2=ses&&ses.camp;if(!S2) return;S2.tween=null;S2.vel=0;S2.center=c;S2.dirty=false;campRender()},
  _lookAtGear:function(id){var S2=ses&&ses.camp;if(!S2) return;var g=S2.gear.filter(function(x){return x.it.id===id})[0];if(g){S2.tween=null;S2.vel=0;S2.center=g.it.wall*STEP+g.it.x/100*DW;S2.dirty=false;campRender()}},
  _skipIntro:function(){if(ses&&ses.endIntro) ses.endIntro()},
  _goto:function(i){if(ses){ses.stopIdx=i;startRide(i)}},
  _lvl:lvl,_api:function(){return ses&&ses.api}};
})();
