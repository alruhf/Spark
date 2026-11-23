/* Spark areas v2 — Sahara "Desert Navigator" missions (plan §8.1).
   tent   : S1 pitch the nomad tent — build, rotate against the sun and wind, wall layers, time-of-day slider with inside/outside thermometers
   buggy  : S2 dune buggy — side-view physics drive (gas / brake, lean, tyre pressure), gentle windward side vs 30-34° slip face, read the ripples
   skynav : S3 find north — shadow stick (u/t), Big Dipper pointer stars to Polaris (real star positions), time-lapse, star compass
   tracks : S4 night tracker — torch over moonlit sand, follow prints, forks, stride ruler, track story, eyes in the beam
   Ages 4-6 (band k): every drag also works as tap-then-tap, nothing is timed, targets >= 76 px, no two-handed controls, nothing auto-advances. */
(function(){
"use strict";
var SA=window.SparkAreas;if(!SA) return;
function reg(t,f){SA.register(t,f)}
function px(n){return Math.round(n*10)/10+"px"}
function R(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function sparkReserve(){return innerWidth<900?120:130}
function isK(api){return api.band()==="k"}
function B(api){return api.band()}
function T(api,o){return api.pick(o)}
/* layout box for an activity: below Spark's caption, clear of Spark (bottom-right) */
function box(api){var h=api.host,vw=h.clientWidth||innerWidth,vh=h.clientHeight||innerHeight,ph=vh<520;
  var top=Math.max(ph?50:100,vh*.15,api.topInset()),bot=ph?8:Math.max(12,vh*.025),side=vw<900?10:sparkReserve();
  return {vw:vw,vh:vh,top:top,bot:bot,side:side,ph:ph,port:vh>vw,K:isK(api)}}
var CSS_DONE=false;
function css(){if(CSS_DONE) return;CSS_DONE=true;var s=document.createElement("style");s.id="ds-css";s.textContent=[
".ds-btn{min-width:64px;min-height:64px;padding:8px 16px;border-radius:20px;border:3px solid #f6c445;background:#3b2412e8;color:#fff;font:900 17px/1.1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 6px 16px #0008;touch-action:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;-webkit-user-select:none;user-select:none}",
".ds-btn:active,.ds-btn.on{transform:translateY(2px) scale(.97);background:#7a4a10;border-color:#fff}",
".ds-btn[disabled]{opacity:.4;pointer-events:none}",
".ar2-bk .ds-btn{min-width:84px;min-height:84px;font-size:19px}",
".ds-btn .ico{font-size:1.5em;line-height:1}",
".ds-row{position:absolute;display:flex;gap:10px;z-index:7;flex-wrap:wrap;justify-content:center}",
".ds-card{position:absolute;z-index:8;background:#1b120ae6;border:2px solid #f6c44599;border-radius:18px;padding:10px 12px;color:#fff;box-shadow:0 10px 28px #000a;font-weight:800}",
".ds-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#0008;border:2px solid #ffffff44;font-weight:900;font-size:14px}",
".ds-chip.ok{background:#1f7a46cc;border-color:#6af0ab}",
".ds-pulse{animation:dsPulse 1.1s ease-in-out infinite}",
"@keyframes dsPulse{0%,100%{box-shadow:0 0 0 0 #ffe56aaa}50%{box-shadow:0 0 0 14px #ffe56a00}}",
"@keyframes dsBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}",
".ds-therm{position:absolute;z-index:6;display:flex;gap:12px;padding:8px 10px;border-radius:16px;background:#0009;border:2px solid #ffffff33}",
".ds-therm .t{display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:900;font-size:13px;color:#fff;min-width:54px}",
".ds-therm .t b{font-size:18px}",
".ds-slider{position:absolute;z-index:7;height:76px;touch-action:none;cursor:pointer}",
".ds-slider .tr{position:absolute;left:0;right:0;top:50%;height:14px;margin-top:-7px;border-radius:7px;background:linear-gradient(90deg,#ffb347,#fff3b0 35%,#ffb347 65%,#3a3f7a 82%,#10143a)}",
".ds-slider .th{position:absolute;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:#fff6d6;border:4px solid #f6c445;box-shadow:0 4px 12px #0008;display:flex;align-items:center;justify-content:center;font-size:30px}",
".ar2-bk .ds-slider .th{width:84px;height:84px;margin:-42px 0 0 -42px}",
".ds-slider .lb{position:absolute;bottom:-4px;font:900 12px inherit;font-family:inherit;color:#fff;text-shadow:0 1px 3px #000;transform:translateX(-50%)}",
".ds-hit{position:absolute;z-index:9;border:0;padding:0;background:transparent;cursor:pointer;border-radius:50%;touch-action:none}",
".ds-hit:focus-visible{outline:4px solid #ffe56a}",
".ds-glow{position:absolute;border-radius:50%;pointer-events:none;z-index:8;box-shadow:0 0 18px 8px #ffd84a88,inset 0 0 14px 4px #ffd84a66;animation:dsPulse 1.2s ease-in-out infinite}",
".ds-pick{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;background:#0006}",
".ds-pick .ds-card{position:relative;max-width:min(680px,94vw);text-align:center}",
".ds-pick h3{margin:2px 0 10px;font-size:19px}",
".ds-opts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}",
".ds-opt{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:120px;min-height:84px;padding:8px 10px;border-radius:16px;border:3px solid #ffffff55;background:#ffffff1a;color:#fff;font:900 15px inherit;font-family:inherit;cursor:pointer}",
".ds-opt:hover{background:#ffffff33}.ds-opt.ok{border-color:#6af0ab;background:#1f7a4699}.ds-opt.no{border-color:#ff8a8a;animation:ar2Shake .45s}",
".ds-opt canvas,.ds-opt img{display:block;border-radius:10px;max-width:100%}"
].join("\n");document.head.appendChild(s)}
function btn(api,html,label,cls){var b=api.el("button","ds-btn"+(cls?" "+cls:""),html);b.type="button";if(label) b.setAttribute("aria-label",label);return b}
/* press-and-hold button (pedals): works by touch, mouse and keyboard (Enter/Space). Only one needed at a time. */
function holdBtn(b,onChange){var on=false;function set(v){if(v===on) return;on=v;b.classList.toggle("on",v);onChange(v)}
  b.addEventListener("pointerdown",function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}set(true)});
  ["pointerup","pointercancel","lostpointercapture"].forEach(function(t){b.addEventListener(t,function(){set(false)})});
  b.addEventListener("keydown",function(e){if(e.key===" "||e.key==="Enter"){e.preventDefault();set(true)}});
  b.addEventListener("keyup",function(e){if(e.key===" "||e.key==="Enter") set(false)});
  return {get on(){return on},set:set}}
/* a picker card (choice-with-consequence or in-mission check). opts:[{html,label,ok}] -> resolves index once the right one is chosen (or any if free) */
function choose(api,title,opts,o){o=o||{};return new Promise(function(done){
  var ov=api.el("div","ds-pick"),c=api.el("div","ds-card");ov.appendChild(c);c.innerHTML='<h3></h3><div class="ds-opts"></div>';c.querySelector("h3").textContent=T(api,title);
  var row=c.querySelector(".ds-opts"),wrong=0;
  opts.forEach(function(op,i){var b=api.el("button","ds-opt");b.type="button";b.innerHTML=(op.html||"")+'<span>'+api.esc(T(api,op.label))+'</span>';b.setAttribute("aria-label",T(api,op.label));
    b.onclick=function(){if(!api.live()) return;
      if(o.free||op.ok){api.sfx("ok");b.classList.add("ok");if(op.say) api.say(op.say,{after:"idle"});setTimeout(function(){ov.remove();done(i)},o.free?250:650)}
      else{wrong++;api.sfx("no");b.classList.add("no");setTimeout(function(){b.classList.remove("no")},500);api.say(op.say||o.hint||"Not quite. Try again!",{state:"concern",after:"idle"});
        if(wrong>=2){[].forEach.call(row.children,function(x,j){if(opts[j].ok) x.classList.add("ds-pulse")})}}};
    row.appendChild(b)});
  api.host.appendChild(ov);api.onEnd(function(){ov.remove()});
})}
function picImg(api,id,w){var a=api.asset(id);if(!a) return "";return '<img src="'+api.url(id)+'" alt="" draggable="false" style="width:'+w+'px;height:'+Math.round(w*a.h/a.w)+'px;object-fit:contain">'}
function img(api,id){var i=new Image();i.decoding="async";i.src=api.url(id);i.draggable=false;i.alt="";return i}
var AUD=null;function actx(){try{if(!AUD){var C=window.AudioContext||window.webkitAudioContext;if(C) AUD=new C()}if(AUD&&AUD.state==="suspended") AUD.resume()}catch(e){}return AUD}

/* ============================================================================ S1 TENT */
/* temperature model (°C), a clear spring day in the central Sahara (~23°N). Outside: max ~38 at 3 pm, min ~8 before dawn.
   Inside depends on orientation q (1 = closed back faces the hot afternoon sun and wind), side walls and (band t) materials. */
var HOT_AZ=250; /* WSW: the hot afternoon sun and the dusty wind */
function outT(h){return 23+15*Math.cos(2*Math.PI*(h-15)/24)}
function sunF(h){return Math.max(0,Math.sin(Math.PI*(h-6)/12))}
function nightF(h){return h<=18?0:h>=20?1:(h-18)/2}
function qOf(back){var d=Math.abs(((back-HOT_AZ)%360+540)%360-180);return (1+Math.cos(d*Math.PI/180))/2}
var COVERS={mat:{shade:9,breeze:0,night:0,cost:3},hide:{shade:10,breeze:1,night:2,cost:5},plastic:{shade:6,breeze:3,night:1,cost:2}};
function insideT(h,P){var o=outT(h),s=sunF(h),n=nightF(h),q=P.q,c=COVERS[P.cover||"mat"];
  var day=-s*(c.shade*q)+s*3*(1-q)+s*(c.breeze)+(P.sidesUp?-2*s:2*s)+(P.vent?-2*s:0);
  var night=n*((P.wallsDown&&P.wool!==false?6:1)+c.night);
  return o+day+night}
reg("tent",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",tok=api.tok;
    var st={phase:"build",placed:{},back:cfg.startBack!=null?cfg.startBack:70,h:13,sidesUp:true,wallsDown:false,cover:"mat",vent:false,wool:true,goals:{},fox:false,predict:null};
    if(band==="t"){st.cover=null;st.wool=false}
    var scene=api.el("div","dtent");scene.style.cssText="position:absolute;inset:0;z-index:2";host.appendChild(scene);
    var pad=api.el("div","dtpad");pad.style.cssText="position:absolute";scene.appendChild(pad);
    var shade=api.el("div","dtshade");shade.style.cssText="position:absolute;border-radius:50%;background:radial-gradient(closest-side,#2a1606aa,#2a160600);pointer-events:none;transition:opacity .4s";pad.appendChild(shade);
    var rug=img(api,"build_rug");rug.style.cssText="position:absolute;opacity:0;transition:opacity .4s;pointer-events:none";pad.appendChild(rug);
    var tentI=img(api,"tent_frame");tentI.style.cssText="position:absolute;opacity:0;transition:opacity .35s;pointer-events:none;filter:drop-shadow(0 10px 10px #0007)";pad.appendChild(tentI);["tent_frame","tent_open","tent_closed"].forEach(function(id){try{var im0=new Image();im0.src=api.url(id);if(im0.decode) im0.decode().catch(function(){})}catch(e){}});/* decode the tent stages up front so placing a piece never stalls */
    var glare=api.el("div","dtglare");glare.style.cssText="position:absolute;pointer-events:none;border-radius:40% 40% 10% 10%;background:radial-gradient(ellipse at 50% 60%,#fff2a8cc,#ffcf5a55 55%,#0000 75%);mix-blend-mode:screen;opacity:0;transition:opacity .4s";pad.appendChild(glare);
    var ropes=document.createElementNS("http://www.w3.org/2000/svg","svg");ropes.setAttribute("viewBox","0 0 100 40");ropes.setAttribute("preserveAspectRatio","none");ropes.style.cssText="position:absolute;opacity:0;transition:opacity .4s;pointer-events:none;overflow:visible";
    ropes.innerHTML='<g stroke="#e8d3a2" stroke-width=".5" fill="none"><path d="M12 8 L0 38"/><path d="M88 8 L100 38"/><path d="M30 4 L18 38"/><path d="M70 4 L82 38"/></g><g fill="#5a3a1c"><rect x="-1" y="36.5" width="2" height="3"/><rect x="99" y="36.5" width="2" height="3"/><rect x="17" y="36.5" width="2" height="3"/><rect x="81" y="36.5" width="2" height="3"/></g>';pad.appendChild(ropes);
    var outline=api.el("div","dtoutline");outline.style.cssText="position:absolute;border:4px dashed #ffe56acc;border-radius:22px;pointer-events:none;animation:dsPulse 1.4s infinite";pad.appendChild(outline);
    var sun=api.el("div","dtsun");sun.style.cssText="position:absolute;z-index:3;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;background:radial-gradient(circle,#fffbe6,#ffe27a 45%,#ffb34766 70%,#0000 72%);pointer-events:none";scene.appendChild(sun);
    var night=api.el("div","dtnight");night.style.cssText="position:absolute;inset:0;z-index:1;background:linear-gradient(#060a24f0,#101a3ad0 60%,#1a1a2ab0);opacity:0;pointer-events:none;transition:opacity .3s";host.insertBefore(night,scene);
    var fox=img(api,"animal_fennec");fox.style.cssText="position:absolute;z-index:4;pointer-events:none;transition:left .9s ease-in-out,top .9s ease-in-out,opacity .4s;opacity:0;filter:drop-shadow(0 6px 6px #0008)";scene.appendChild(fox);
    var foxRest=img(api,"animal_fennec_rest");foxRest.style.cssText="position:absolute;z-index:4;pointer-events:none;opacity:0;transition:opacity .6s;filter:drop-shadow(0 4px 5px #0008)";scene.appendChild(foxRest);
    /* right-hand panel: compass plate (top-down), thermometers, walls, slider */
    var plate=document.createElement("canvas");plate.className="dtplate";plate.style.cssText="position:absolute;z-index:6;touch-action:none;cursor:grab;border-radius:50%;box-shadow:0 8px 24px #000a;display:none";scene.appendChild(plate);
    var rotL=btn(api,'<span class="ico">&#8634;</span>',"Turn the tent left"),rotR=btn(api,'<span class="ico">&#8635;</span>',"Turn the tent right");
    var rotRow=api.el("div","ds-row");rotRow.appendChild(rotL);rotRow.appendChild(rotR);rotRow.style.display="none";scene.appendChild(rotRow);
    var therm=api.el("div","ds-therm");therm.style.display="none";therm.innerHTML='<div class="t"><svg width="26" height="74" viewBox="0 0 26 74"><rect x="8" y="2" width="10" height="56" rx="5" fill="#fff" opacity=".9"/><rect class="lq" x="10" y="20" width="6" height="38" fill="#e8452c"/><circle cx="13" cy="62" r="10" fill="#e8452c"/></svg><span>Outside</span><b class="v">--</b></div><div class="t"><svg width="26" height="74" viewBox="0 0 26 74"><rect x="8" y="2" width="10" height="56" rx="5" fill="#fff" opacity=".9"/><rect class="lq" x="10" y="20" width="6" height="38" fill="#3aa0e8"/><circle class="bl" cx="13" cy="62" r="10" fill="#3aa0e8"/></svg><span>In the tent</span><b class="v">--</b></div>';scene.appendChild(therm);
    var wallBtn=btn(api,"","Side walls");wallBtn.style.cssText="position:absolute;z-index:7;display:none";scene.appendChild(wallBtn);
    var goalRow=api.el("div","ds-row");goalRow.style.display="none";scene.appendChild(goalRow);
    var slider=api.el("div","ds-slider");slider.setAttribute("role","slider");slider.setAttribute("aria-label","Time of day");slider.tabIndex=0;slider.innerHTML='<div class="tr"></div><div class="th">&#9728;&#65039;</div><span class="lb" style="left:0%">6 am</span><span class="lb" style="left:33%">noon</span><span class="lb" style="left:67%">6 pm</span><span class="lb" style="left:100%">midnight</span>';slider.style.display="none";scene.appendChild(slider);
    var graph=document.createElement("canvas");graph.style.cssText="position:absolute;z-index:6;display:none;border-radius:12px;background:#000a;border:2px solid #ffffff33";scene.appendChild(graph);
    var L={};
    function layout(){
      var b=box(api),side=b.vw<900?10:b.side;L.b=b;
      var wide=!b.port,panelW=wide?Math.min(300,b.vw*.3):b.vw-20;
      var availW=wide?b.vw-side-panelW-30:b.vw-20, availH=(wide?b.vh-b.top-(K?130:118):(b.vh-b.top)*.46);
      var w=Math.min(availW,availH*1.9,760),h=w/1.9;
      var left=wide?Math.max(side,10)+(availW-w)/2:(b.vw-w)/2,top=b.top+(wide?Math.max(0,(availH-h)*.55):0);
      pad.style.cssText+=";left:"+px(left)+";top:"+px(top)+";width:"+px(w)+";height:"+px(h);L.pad={l:left,t:top,w:w,h:h};
      var tw=w*.86,th=tw*406/1080;tentI.style.width=px(tw);tentI.style.left=px((w-tw)/2);tentI.style.top=px(h-th-h*.04);L.tent={l:(w-tw)/2,t:h-th-h*.04,w:tw,h:th};
      glare.style.cssText+=";left:"+px(w*.2)+";top:"+px(h-th*.82)+";width:"+px(w*.6)+";height:"+px(th*.62);
      ropes.style.left=px(w*.02);ropes.style.top=px(h-th*1.02);ropes.style.width=px(w*.96);ropes.style.height=px(th*1.02);
      var rw=w*.6;rug.style.width=px(rw);rug.style.left=px((w-rw)/2);rug.style.top=px(h-rw*306/1000-h*.02);
      outline.style.left=px((w-tw)/2-6);outline.style.top=px(h-th-h*.06);outline.style.width=px(tw+12);outline.style.height=px(th+h*.06);
      /* panel */
      var ps=Math.min(wide?panelW:b.vw*.42,b.ph?170:230,(wide?b.vh-b.top-180:b.vh*.24));ps=Math.max(ps,120);
      /* phones: plate + walls button + slider must stack without overlapping (the slider used to cover the walls button) */
      if(!wide){var room=b.vh-8-(top+h+12)-(12+64+12+44);if(ps>room) ps=Math.max(96,room)}
      var dpr=Math.min(2,window.devicePixelRatio||1);plate.width=Math.round(ps*dpr);plate.height=Math.round(ps*dpr);plate.style.width=plate.style.height=px(ps);plate._s=ps;plate._d=dpr;
      var pl,pt;if(wide){pl=b.vw-side-panelW+(panelW-ps)/2;pt=b.top}else{pl=12;pt=top+h+12}
      plate.style.left=px(pl);plate.style.top=px(pt);L.plate={l:pl,t:pt,s:ps};
      rotRow.style.left=px(wide?pl+ps/2-((K?84:64)+5):pl+ps+12);rotRow.style.top=px(wide?pt+ps+10:pt+ps/2-(K?42:32));rotRow.style.width="auto";
      var tl=wide?b.vw-side-panelW+(panelW-150)/2:Math.min(b.vw-170,pl+ps+12+(K?190:150)),tt=wide?pt+ps+(K?104:84):pt;
      if(!wide){tl=b.vw-162;tt=pt}
      therm.style.left=px(tl);therm.style.top=px(tt);
      wallBtn.style.left=px(wide?b.vw-side-panelW+(panelW-170)/2:12);wallBtn.style.top=px(wide?tt+(therm.offsetHeight||112)+10:pt+ps+12);
      var sw=wide?Math.min(w,620):b.vw-60;slider.style.left=px(wide?left+(w-sw)/2:30);slider.style.width=px(sw);var sTop=wide?top+h+14:Math.max(pt+ps+12+64+12,Math.min(b.vh-90,pt+ps+(K?100:84)));
      /* phones: the slider must never run under Spark (the night end was unreachable) */
      if(!wide){var spk=document.getElementById("sparkCompanion"),hr=scene.getBoundingClientRect();if(spk){var sr=spk.getBoundingClientRect();if(sr.width&&sr.left-hr.left<30+sw&&sTop+48>sr.top-hr.top){var sw2=sr.left-hr.left-12-30;if(sw2>=220){sw=sw2;slider.style.width=px(sw)}else sTop=sr.top-hr.top-60}}}
      slider.style.top=px(sTop);
      goalRow.style.left=px(wide?left:12);goalRow.style.top=px(wide?Math.max(b.top-6,top-46):top-44);
      graph.width=Math.round(220*dpr);graph.height=Math.round(110*dpr);graph.style.width="220px";graph.style.height="110px";graph.style.left=px(wide?Math.max(10,side*.3):b.vw-232);graph.style.top=px(wide?Math.max(b.top+40,top-120):tt+150);graph._d=dpr;
      if(wide&&b.ph) shortLayout(b);
      render();
    }
    /* short landscape phones (height < 520): dial top-right, turn buttons + walls to its left, thermometers bottom-left,
       the tent in the middle, so nothing sits under Spark (bottom-right) and nothing falls off the bottom */
    function shortLayout(b){var bs=K?84:64,ps=Math.max(84,Math.min(120,b.vh-b.top-24));
      var pl=b.vw-10-ps,pt=b.top;var dpr=Math.min(2,window.devicePixelRatio||1);plate.width=plate.height=Math.round(ps*dpr);plate.style.width=plate.style.height=px(ps);plate._s=ps;plate._d=dpr;
      plate.style.left=px(pl);plate.style.top=px(pt);L.plate={l:pl,t:pt,s:ps};
      var rl=pl-(2*bs+10)-10;rotRow.style.left=px(rl);rotRow.style.top=px(pt);
      wallBtn.style.left=px(Math.min(rl,pl-(wallBtn.offsetWidth||176)-8));wallBtn.style.top=px(pt+bs+8);
      var thH=therm.offsetHeight||112;therm.style.left="10px";therm.style.top=px(b.vh-thH-8);
      var gw=220,gh=110;graph.width=Math.round(gw*dpr);graph.height=Math.round(gh*dpr);graph.style.width=gw+"px";graph.style.height=gh+"px";graph.style.left="10px";graph.style.top=px(b.top);graph._d=dpr;
      var x0=Math.max(200,10+170),x1=rl-12,availW=x1-x0,availH=b.vh-b.top-(K?20:84);
      var w=Math.max(200,Math.min(availW,availH*1.9)),h=w/1.9,left=x0+(availW-w)/2,top=b.top+Math.max(0,(availH-h)*.5);
      pad.style.left=px(left);pad.style.top=px(top);pad.style.width=px(w);pad.style.height=px(h);L.pad={l:left,t:top,w:w,h:h};
      var tw=w*.86,th=tw*406/1080;tentI.style.width=px(tw);tentI.style.left=px((w-tw)/2);tentI.style.top=px(h-th-h*.04);L.tent={l:(w-tw)/2,t:h-th-h*.04,w:tw,h:th};
      glare.style.left=px(w*.2);glare.style.top=px(h-th*.82);glare.style.width=px(w*.6);glare.style.height=px(th*.62);
      ropes.style.left=px(w*.02);ropes.style.top=px(h-th*1.02);ropes.style.width=px(w*.96);ropes.style.height=px(th*1.02);
      var rw=w*.6;rug.style.width=px(rw);rug.style.left=px((w-rw)/2);rug.style.top=px(h-rw*306/1000-h*.02);
      outline.style.left=px((w-tw)/2-6);outline.style.top=px(h-th-h*.06);outline.style.width=px(tw+12);outline.style.height=px(th+h*.06);
      var sw=Math.min(x1-x0,520);slider.style.left=px(x0+(x1-x0-sw)/2);slider.style.width=px(sw);slider.style.top=px(Math.min(b.vh-70,top+h+8));
      goalRow.style.left=px(Math.max(x0,242));goalRow.style.top=px(Math.max(b.top-6,top-40))}
    function sunPos(h){var hr=host.getBoundingClientRect();var p=L.pad;if(!p) return {x:0,y:0};var t=clamp((h-6)/12,0,1);
      return {x:p.l+p.w*(1-t),y:Math.max(L.b.top*.6,p.t+p.h*.15)-Math.sin(Math.PI*t)*Math.min(p.h*.25,90)+(h>18?1000:0)}}
    function P(){return {q:qOf(st.back),sidesUp:st.sidesUp,wallsDown:st.wallsDown,cover:st.cover||"mat",vent:st.vent,wool:st.wool}}
    function temps(){return {o:outT(st.h),i:insideT(st.h,P())}}
    function render(){
      if(!L.pad) return;var p=L.pad,q=qOf(st.back);
      var built=st.placed.cover;
      tentI.src=api.url(!st.placed.poles?"tent_frame":(!built?"tent_frame":(st.wallsDown?"tent_closed":"tent_open")));
      tentI.style.opacity=st.placed.poles?"1":"0";rug.style.opacity=st.placed.rug?"1":"0";ropes.style.opacity=st.placed.rope?"1":"0";
      outline.style.display=st.phase==="build"?"block":"none";
      var sp=sunPos(st.h);sun.style.left=px(sp.x);sun.style.top=px(sp.y);sun.style.opacity=st.h>18.3?"0":"1";
      night.style.opacity=String(clamp(nightF(st.h)*.9+(st.h>17?(st.h-17)*.08:0),0,.9));
      var s=sunF(st.h);
      if(built){var dx=(st.h<12.5?-1:1)*p.w*.18*(1-s*.6);shade.style.opacity=String(.25+.6*q*(s>0?1:0));shade.style.left=px(p.w*.12+dx*q);shade.style.top=px(p.h*.72);shade.style.width=px(p.w*.76);shade.style.height=px(p.h*.34);
        glare.style.opacity=String(s>0&&!st.wallsDown?(1-q)*.9*s:0)}else{shade.style.opacity="0";glare.style.opacity="0"}
      /* 10/10 item 11: the big tent turns with the compass (yaw follows the tent's back vs the hot sun), not only the little plate */
      var dA=((st.back-HOT_AZ)%360+540)%360-180,yaw=Math.max(-42,Math.min(42,dA*.45));
      if(st.placed.poles){pad.style.transformOrigin="50% 85%";pad.style.transition="transform .45s cubic-bezier(.3,.7,.3,1)";pad.style.transform="perspective(1300px) rotateY("+yaw.toFixed(1)+"deg)";pad.dataset.yaw=yaw.toFixed(1)}
      drawPlate();
      var t=temps();var vs=therm.querySelectorAll(".v"),lq=therm.querySelectorAll(".lq");
      [t.o,t.i].forEach(function(v,i){vs[i].textContent=Math.round(v)+" \u00B0C";var hh=clamp((v-0)/45,0,1)*54;lq[i].setAttribute("y",String(58-hh));lq[i].setAttribute("height",String(hh))});
      var ic=t.i>32?"#e8452c":t.i<15?"#7a7ff0":"#3aa0e8";lq[1].setAttribute("fill",ic);therm.querySelector(".bl").setAttribute("fill",ic);
      var th=slider.querySelector(".th");th.style.left=((st.h-6)/18*100)+"%";th.innerHTML=st.h>=19?"&#127769;":"&#9728;&#65039;";slider.setAttribute("aria-valuenow",String(Math.round(st.h)));
      wallBtn.innerHTML=st.wallsDown?'<span class="ico">&#129521;</span> '+T(api,{k:"Walls down",e:"Wool walls: down",u:"Wool walls: down"}):'<span class="ico">&#127788;&#65039;</span> '+T(api,{k:"Sides up",e:"Sides: rolled up",u:"Sides: rolled up"});
      drawGraph();
    }
    function drawPlate(){var c=plate.getContext("2d"),d=plate._d||1,s=plate._s||200;if(!s) return;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,s,s);
      var r=s/2,cx=r,cy=r;/* 10/10 item 11: a compass instrument in the same dark-glass style as the other panels (the flat sand disc looked pasted on the photo) */
      var g=c.createRadialGradient(cx,cy*.8,r*.1,cx,cy,r);g.addColorStop(0,"#1d3b5cf2");g.addColorStop(1,"#0b1a2ef2");c.fillStyle=g;c.beginPath();c.arc(cx,cy,r-2,0,7);c.fill();
      c.strokeStyle="#ffd54acc";c.lineWidth=3;c.stroke();c.strokeStyle="#ffffff40";c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,r*.72,0,7);c.stroke();
      for(var tk=0;tk<36;tk++){var ta=tk*Math.PI/18,l1=tk%9===0?r*.66:r*.7;c.beginPath();c.moveTo(cx+Math.sin(ta)*l1,cy-Math.cos(ta)*l1);c.lineTo(cx+Math.sin(ta)*r*.74,cy-Math.cos(ta)*r*.74);c.stroke()}
      c.fillStyle="#ffffff";c.font="900 "+Math.round(s*.09)+"px system-ui,sans-serif";c.textAlign="center";c.textBaseline="middle";
      [["N",0],["E",90],["S",180],["W",270]].forEach(function(a){var t=a[1]*Math.PI/180;c.fillText(a[0],cx+Math.sin(t)*r*.84,cy-Math.cos(t)*r*.84)});
      /* hot sun + wind (fixed) */
      var t=HOT_AZ*Math.PI/180,sx=cx+Math.sin(t)*r*.62,sy=cy-Math.cos(t)*r*.62;
      c.fillStyle="#ffd84a";c.beginPath();c.arc(sx,sy,s*.075,0,7);c.fill();c.strokeStyle="#ffb000";c.lineWidth=2;for(var k=0;k<8;k++){var a=k*Math.PI/4;c.beginPath();c.moveTo(sx+Math.cos(a)*s*.09,sy+Math.sin(a)*s*.09);c.lineTo(sx+Math.cos(a)*s*.12,sy+Math.sin(a)*s*.12);c.stroke()}
      c.strokeStyle="#fffc";c.lineWidth=2.4;for(var w=-1;w<=1;w++){var ox=Math.cos(t)*w*s*.07,oy=Math.sin(t)*w*s*.07;var x0=cx+Math.sin(t)*r*.42+ox,y0=cy-Math.cos(t)*r*.42+oy,x1=cx+Math.sin(t)*r*.24+ox,y1=cy-Math.cos(t)*r*.24+oy;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2+oy*.4,(y0+y1)/2-ox*.4,x1,y1);c.stroke()}
      /* tent from above: back wall thick, open front dashed */
      c.save();c.translate(cx,cy);c.rotate((st.back+180)*Math.PI/180);var tw=s*.38,td=s*.24;
      c.fillStyle=qOf(st.back)>.85?"#7a5a34":"#8a6a40";c.fillRect(-tw/2,-td/2,tw,td);
      c.fillStyle="#3b2412";c.fillRect(-tw/2,td/2-s*.035,tw,s*.035);/* back (toward st.back) */
      c.setLineDash([5,4]);c.strokeStyle="#fff";c.lineWidth=2;c.beginPath();c.moveTo(-tw/2,-td/2);c.lineTo(tw/2,-td/2);c.stroke();c.setLineDash([]);
      c.restore();
      var ok=qOf(st.back)>.85;c.strokeStyle=ok?"#6af0ab":"#ffffff55";c.lineWidth=ok?6:3;c.beginPath();c.arc(cx,cy,r-4,0,7);c.stroke();
    }
    function drawGraph(){if(graph.style.display==="none") return;var c=graph.getContext("2d"),d=graph._d||1,W=220,H=110;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,W,H);
      var y=function(v){return H-12-(v-0)/45*(H-24)},x=function(h){return 10+(h-6)/18*(W-20)};
      if(cfg.goalHi){c.fillStyle="#2fbf7133";c.fillRect(10,y(cfg.goalHi[0]),W-20,y(0)-y(cfg.goalHi[0]))}
      [[outT,"#ff8a5a"],[function(h){return insideT(h,P())},"#6ac8ff"]].forEach(function(f){c.strokeStyle=f[1];c.lineWidth=3;c.beginPath();for(var h=6;h<=24;h+=.25){var X=x(h),Y=y(f[0](h));if(h===6)c.moveTo(X,Y);else c.lineTo(X,Y)}c.stroke()});
      c.strokeStyle="#fff";c.lineWidth=1.5;c.beginPath();c.moveTo(x(st.h),6);c.lineTo(x(st.h),H-8);c.stroke();
      c.fillStyle="#fff";c.font="800 10px system-ui";c.fillText("outside",W-60,14);c.fillStyle="#6ac8ff";c.fillText("inside",W-60,26)}
    layout();var onR=function(){layout()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    /* ---------------- phase 1: build */
    var pieces=[{id:"poles",pic:"build_tent_poles",label:T(api,{k:"Poles",e:"Tent poles"})},{id:"cover",pic:"build_tent_cloth",label:T(api,{k:"Cover",e:"Woven cover"})},{id:"rope",pic:"gear_rope",label:T(api,{k:"Rope",e:"Guy ropes"})},{id:"rug",pic:"build_rug",label:T(api,{k:"Rug",e:"Floor rug"})}];
    var tray=api.el("div","ar2-trayw");tray.setAttribute("role","group");host.appendChild(tray);
    var items={};
    pieces.forEach(function(pc){var it=api.el("div","ar2-item");it.dataset.id=pc.id;it.setAttribute("role","button");it.tabIndex=0;it.setAttribute("aria-label",pc.label);
      it.innerHTML='<span class="ip">'+api.picInner(pc.pic)+'</span><span class="il">'+api.esc(pc.label)+'</span>';tray.appendChild(it);items[pc.id]=it;
      api.drag(it,{ok:function(){return api.live()&&st.phase==="build"&&!st.placed[pc.id]},drop:function(x,y){return place(pc.id,x,y)}});
      it.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();var r=api.rectOf(pad);place(pc.id,r.cx,r.cy)}});
    });
    api.hint(cfg.hintBuild);
    function place(id,x,y){
      if(st.phase!=="build"||st.placed[id]) return false;
      var r=api.rectOf(pad);if(!api.inside(x,y,r,K?90:40)){api.say(cfg.dropHere||"Put it on the glowing spot.",{after:"idle"});return false}
      if(id!=="poles"&&!st.placed.poles){api.sfx("no");api.say(cfg.polesFirst,{state:"concern",after:"idle"});items.poles.classList.add("good");return false}
      st.placed[id]=true;items[id].style.opacity=".25";items[id].style.pointerEvents="none";items.poles.classList.remove("good");
      api.sfx("thunk");api.burst(x,y,10,["\u2728","\u{1F7EB}"]);render();
      var line=cfg.placedLine&&cfg.placedLine[id];if(line) api.say(line,{after:"idle"});
      if(id==="cover"&&tentI.animate) tentI.animate([{transform:"scaleY(.94) skewX(2deg)"},{transform:"scaleY(1.02) skewX(-1deg)"},{transform:"none"}],{duration:900,easing:"ease-out"});
      if(Object.keys(st.placed).length>=4) setTimeout(function(){if(api.live()) startOrient()},900);
      return true;
    }
    /* ---------------- phase 2: orient (dial) */
    var dragA=null;
    function angAt(e){var r=plate.getBoundingClientRect();return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI}
    plate.addEventListener("pointerdown",function(e){if(st.phase!=="orient"&&st.phase!=="free") return;if(orientDone&&st.phase==="orient") return;e.preventDefault();try{plate.setPointerCapture(e.pointerId)}catch(_){}dragA={a0:angAt(e),b0:st.back,id:e.pointerId,moved:false}});
    plate.addEventListener("pointermove",function(e){if(!dragA||e.pointerId!==dragA.id) return;var d=angAt(e)-dragA.a0;if(Math.abs(d)>3) dragA.moved=true;setBack(dragA.b0+d,false)});
    plate.addEventListener("pointerup",function(e){if(!dragA) return;var m=dragA.moved;dragA=null;if(!m){/* a tap on the plate turns the back toward that spot */var a=angAt(e);setBack(a,true)}else checkOrient()});
    var step=K?45:15;
    rotL.onclick=function(){if(orientDone&&st.phase==="orient")return;setBack(st.back-step,true)};rotR.onclick=function(){if(orientDone&&st.phase==="orient")return;setBack(st.back+step,true)};
    plate.tabIndex=0;plate.setAttribute("role","slider");plate.setAttribute("aria-label","Turn the tent");
    plate.addEventListener("keydown",function(e){if(e.key==="ArrowLeft"){e.preventDefault();setBack(st.back-step,true)}if(e.key==="ArrowRight"){e.preventDefault();setBack(st.back+step,true)}});
    function setBack(a,check){st.back=((a%360)+360)%360;api.sfx("click");render();if(check) checkOrient()}
    var orientDone=false;
    function checkOrient(){if(st.phase!=="orient"||orientDone) return;var q=qOf(st.back);
      if(q>.85){orientDone=true;rotRow.style.opacity=".45";rotRow.style.pointerEvents="none";st.back=HOT_AZ;render();api.sfx("ok");api.burst(api.rectOf(plate).cx,api.rectOf(plate).cy,12);
        (async function(){await api.say(cfg.orientOk,{state:"celebration",after:"idle"});if(!api.live()) return;await api.fact(0);if(!api.live()) return;next()})()}
      else if(q<.3) api.say(cfg.orientHot,{after:"idle"})}
    function startOrient(){st.phase="orient";tray.remove();plate.style.display="block";rotRow.style.display="flex";therm.style.display="flex";api.hint(cfg.hintOrient);
      if(K){fox.style.opacity="1";placeFox("sun")}
      layout();api.say(cfg.orientIntro,{after:"idle"})}
    function placeFox(where){var p=L.pad,hr=host.getBoundingClientRect();if(!p) return;var fw=Math.max(K?110:90,p.w*.2),fh=fw*772/1080;fox.style.width=px(fw);
      if(where==="sun"){fox.style.left=px(p.l+p.w*.02);fox.style.top=px(p.t+p.h-fh*1.02)}
      else{fox.style.left=px(p.l+p.w/2-fw/2);fox.style.top=px(p.t+p.h-fh*1.02)}}
    /* ---------------- phase 3 (k): help the fox into the shade = the action check */
    function foxCheck(){st.phase="fox";api.hint(cfg.hintFox);api.say(cfg.foxIntro,{after:"idle"});
      var hit=api.el("button","ds-hit");hit.type="button";hit.setAttribute("aria-label","Fennec fox");var fr=fox.getBoundingClientRect(),hr=host.getBoundingClientRect();
      var hs=Math.max(96,fr.width);hit.style.cssText+=";left:"+px(fr.left-hr.left+fr.width/2-hs/2)+";top:"+px(fr.top-hr.top+fr.height/2-hs/2)+";width:"+px(hs)+";height:"+px(hs);scene.appendChild(hit);
      var gl=api.el("div","ds-glow");gl.style.left=px(L.pad.l+L.pad.w*.3);gl.style.top=px(L.pad.t+L.pad.h*.62);gl.style.width=px(L.pad.w*.4);gl.style.height=px(L.pad.h*.3);gl.style.opacity="0";scene.appendChild(gl);
      api.drag(hit,{ok:function(){return api.live()&&st.phase==="fox"},ghost:function(){var g=document.createElement("div");g.className="ar2-ghost";g._size=110;g.style.width=g.style.height="110px";g.innerHTML='<img src="'+api.url("animal_fennec")+'" alt="" style="width:100%;height:100%;object-fit:contain">';return g},
        start:function(){gl.style.opacity="1"},
        drop:function(x,y){gl.style.opacity="0";var r=api.rectOf(gl);if(api.inside(x,y,r,40)){hit.remove();gl.remove();settle();return true}
          api.sfx("no");api.say(cfg.foxSun,{state:"concern",after:"idle"});gl.style.opacity="1";return false}});
    }
    function settle(){st.phase="settled";st.fox=true;placeFox("shade");api.sfx("ok");
      setTimeout(function(){fox.style.opacity="0";var p=L.pad,fw=Math.max(110,p.w*.2);foxRest.style.width=px(fw);foxRest.style.left=px(p.l+p.w/2-fw/2);foxRest.style.top=px(p.t+p.h-fw*693/1080*1.0);foxRest.style.opacity="1"},950);
      (async function(){await api.sleep(1100);await api.say(cfg.foxOk,{state:"celebration",after:"idle"});if(!api.live()) return;await api.fact(1);if(!api.live()) return;finish()})()}
    /* ---------------- phase 4 (e+): time of day + walls (+ predict, graph, materials) */
    function setH(h){st.h=clamp(h,6,24);render();checkGoals()}
    var sdrag=null;
    function hAt(e){var r=slider.getBoundingClientRect();return 6+clamp((e.clientX-r.left)/r.width,0,1)*18}
    slider.addEventListener("pointerdown",function(e){if(st.phase!=="time"&&st.phase!=="free") return;e.preventDefault();try{slider.setPointerCapture(e.pointerId)}catch(_){}sdrag=e.pointerId;setH(hAt(e));api.sfx("click")});
    slider.addEventListener("pointermove",function(e){if(sdrag!==e.pointerId) return;setH(hAt(e))});
    slider.addEventListener("pointerup",function(){sdrag=null});slider.addEventListener("pointercancel",function(){sdrag=null});
    slider.addEventListener("keydown",function(e){if(e.key==="ArrowLeft"){e.preventDefault();setH(st.h-1)}if(e.key==="ArrowRight"){e.preventDefault();setH(st.h+1)}});
    wallBtn.onclick=function(){if(st.phase!=="time"&&st.phase!=="free") return;if(band==="t"&&!st.wool&&!st.wallsDown){api.say(cfg.noWool,{after:"idle"});return}st.wallsDown=!st.wallsDown;st.sidesUp=!st.wallsDown;api.sfx("thunk");
      if(tentI.animate) tentI.animate([{transform:"scaleY(.96)"},{transform:"none"}],{duration:500});render();checkGoals()};
    var gNoon=cfg.goalNoon||31,gNight=cfg.goalNight||16;
    if(band==="t"){gNoon=cfg.goalNoonT||30;gNight=cfg.goalNightT||17}
    function goalChip(id,txt){var c=api.el("span","ds-chip",txt);c.dataset.g=id;goalRow.appendChild(c);return c}
    var chips={};
    function checkGoals(){if(st.phase!=="time") return;var t=temps();
      if(st.h>=12&&st.h<=15.5&&t.i<=gNoon&&!st.goals.noon){st.goals.noon=true;chips.noon.classList.add("ok");api.sfx("ok");api.say(cfg.goalNoonOk,{state:"celebration",after:"idle"})}
      if(st.h>=23&&t.i>=gNight&&!st.goals.night){st.goals.night=true;chips.night.classList.add("ok");api.sfx("ok");api.say(cfg.goalNightOk,{state:"celebration",after:"idle"})}
      if(st.h>=12&&st.h<=15.5&&t.i>gNoon&&!st.warnNoon){st.warnNoon=true;api.say(st.wallsDown?cfg.hotWalls:cfg.hotNoon,{after:"idle"})}
      if(st.h>=23&&t.i<gNight&&!st.warnNight){st.warnNight=true;api.say(cfg.coldNight,{after:"idle"})}
      if(st.h<12||st.h>15.5) st.warnNoon=false;if(st.h<23) st.warnNight=false;
      if(st.goals.noon&&st.goals.night&&!st.goalsDone){st.goalsDone=true;setTimeout(function(){if(api.live()) finish()},1400)}}
    async function startTime(){
      if(band==="u"||band==="t"){st.h=14;render();
        var i=await choose(api,cfg.predictQ,[{label:{u:"Cooler than outside"},ok:true},{label:{u:"About the same"},ok:false},{label:{u:"Hotter than outside"},ok:false}],{free:true});
        st.predict=i;if(!api.live()) return;var t=temps();await api.say(T(api,i===0?cfg.predictRight:cfg.predictWrong)+" "+Math.round(t.o)+" \u00B0C outside, "+Math.round(t.i)+" \u00B0C in the shade of the tent.",{after:"idle"});if(!api.live()) return}
      if(band==="t"){await materials();if(!api.live()) return}
      st.phase="time";st.h=7;slider.style.display="block";wallBtn.style.display="inline-flex";goalRow.style.display="flex";
      chips.noon=goalChip("noon",T(api,cfg.chipNoon)+" \u2264 "+gNoon+" \u00B0C");chips.night=goalChip("night",T(api,cfg.chipNight)+" \u2265 "+gNight+" \u00B0C");
      if(band==="u"||band==="t"){graph.style.display="block";cfg.goalHi=[gNoon]}
      layout();api.hint(cfg.hintTime);api.say(cfg.timeIntro,{after:"idle"});
    }
    async function materials(){
      var budget=cfg.budget||10;
      var c=await choose(api,{t:"Budget "+budget+" coins. Pick the tent cover."},[
        {label:{t:"Woven palm mat (3)"},ok:true},{label:{t:"Goat-hide cover (5)"},ok:true},{label:{t:"Plastic sheet (2)"},ok:true}],{free:true});
      st.cover=["mat","hide","plastic"][c];var left=budget-COVERS[st.cover].cost;
      var v=await choose(api,{t:"Coins left: "+left+". Add air vents (2)? Hot air rises out, a breeze flows through."},[{label:{t:"Add vents"},ok:true},{label:{t:"No vents"},ok:true}],{free:true});
      if(v===0&&left>=2){st.vent=true;left-=2}
      var w=await choose(api,{t:"Coins left: "+left+". Buy wool walls (4) for the night?"},[{label:{t:"Buy wool walls"},ok:true},{label:{t:"Skip them"},ok:true}],{free:true});
      if(w===0&&left>=4){st.wool=true;left-=4}else st.wool=false;
      if(w===0&&left<0){st.wool=false}
      st.coins=left;render();
      await api.say({t:"Now test it. Drag or tap along the time slider through the day and night, and see if your choices meet both targets. You can change the walls, and Back lets you rethink the shopping."},{after:"idle"});
    }
    /* free sandbox after the goal: keep turning, sliding and toggling until Next */
    function finish(){if(st.done) return;st.done=true;st.phase="free";api.hint(null);api.sfx("win");api.burst(innerWidth/2,innerHeight*.4,20);
      var nx=btn(api,T(api,{k:"Done! \u25B6",e:"Done \u25B6"}),"Done");nx.style.cssText="position:absolute;z-index:9;left:50%;transform:translateX(-50%);bottom:"+px(Math.max(12,L.b.bot))+";background:#1f7a46;border-color:#6af0ab";if(L.b.ph&&!L.b.port){var bs=K?84:64;nx.style.left="auto";nx.style.transform="none";nx.style.right="120px";nx.style.bottom="auto";nx.style.top=px(L.plate.t+2*bs+24)}
      if(st.goalsDone||band!=="k"){slider.style.display=band==="k"?"none":"block"}
      scene.appendChild(nx);api.say(cfg.free,{after:"idle"});nx.onclick=function(){nx.remove();resolve({back:st.back,goals:st.goals})}}
    function next(){rotRow.style.opacity="";rotRow.style.pointerEvents="";if(K){rotRow.style.display="none";foxCheck()}else{rotRow.style.display="flex";startTime()}}
    /* test hook (QA): temperature model + state */
    host._tent={st:st,temps:temps,model:function(h,back,o){o=o||{};return insideT(h,{q:qOf(back),sidesUp:o.sidesUp!==false,wallsDown:!!o.wallsDown,cover:o.cover||"mat",vent:!!o.vent,wool:o.wool!==false})},out:outT,
      place:function(id){var r=api.rectOf(pad);return place(id,r.cx,r.cy)},setBack:setBack,setH:setH,toggle:function(){wallBtn.click()},foxHit:function(){return scene.querySelector(".ds-hit")},shadeRect:function(){var g=scene.querySelector(".ds-glow");return g&&api.rectOf(g)}};
  });
});

/* ============================================================================ S2 DUNE BUGGY (driving) */
/* World units: 1 u ≈ 1 cm of a toy-scale dune... we only need consistent numbers. y is UP. Slip faces at 32° (sand's resting angle, 30-34°),
   windward sides 10-12°. The buggy is always ON the profile (it is placed at y(x)), so it can never fall or roll through the ground. */
var DEG=Math.PI/180;
function duneSpec(kind){ /* returns list of [length, angleDeg] pieces after a flat lead-in */
  if(kind==="gentle") return [[260,0],[620,11],[70,0],[150,-32],[60,-6],[220,0]];    /* windward up, slip face down */
  if(kind==="steepUp") return [[260,0],[150,32],[70,0],[620,-11],[220,0]];           /* the slip face faces you: too steep to climb */
  if(kind==="horn") return [[300,0],[520,7],[80,0],[420,-9],[220,0]];                /* round the low horn of the crescent: longer, gentle */
  if(kind==="soft") return [[260,0],[540,10],[70,0],[150,-31],[60,-6],[220,0]];
  return [[400,0]]}
function buildProfile(list){var pts=[[0,0]],x=0,y=0,marks=[];
  list.forEach(function(d,di){marks.push({dune:di,x0:x,kind:d.kind});duneSpec(d.kind).forEach(function(s){var dx=s[0]*Math.cos(s[1]*DEG),dy=s[0]*Math.sin(s[1]*DEG);x+=dx;y+=dy;pts.push([x,y,s[1],di,d.kind])})});
  pts.push([x+1300,y,0]);return {pts:pts,end:x+260,marks:marks}}
function yAt(P,x){var p=P.pts;for(var i=1;i<p.length;i++){if(x<=p[i][0]){var a=p[i-1],b=p[i],t=(x-a[0])/((b[0]-a[0])||1);
  /* round the joints a little (crest brink stays fairly sharp) */
  return a[1]+(b[1]-a[1])*t}}return p[p.length-1][1]}
function slopeAt(P,x){var e=6;return Math.atan2(yAt(P,x+e)-yAt(P,x-e),2*e)}
function segAt(P,x){var p=P.pts;for(var i=1;i<p.length;i++) if(x<=p[i][0]) return {i:i,ang:p[i][2]||0,dune:p[i][3],kind:p[i][4]};return {i:p.length-1,ang:0}}
reg("buggy",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k";
    /* course per band: k one gentle dune (auto-steer, gas/brake only); e 2 dunes + choose a line; u 3 dunes + wind reading + tyres; t + fuel */
    var course=cfg.course||{k:["gentle","fork"],e:["gentle","fork"],u:["gentle","fork","soft"],t:["gentle","fork","soft"]}[band]||["gentle"];
    var D=course.map(function(k,i){return {kind:k==="fork"?"steepUp":k,fork:k==="fork",chosen:null,hornSide:k==="fork"?-1:(i%2?-1:1),locked:false}});
    /* 10/10 items 2+29 (redo): both ways are real lanes on screen from the start. Far lane (up the screen, the driver's LEFT) = the long low horn,
       near lane (the driver's RIGHT, where the buggy starts) = straight at the slip face. Each lane is its own profile; the buggy drives the one it is in. */
    var PH=buildProfile(D.map(function(d){return {kind:d.fork?"horn":d.kind}})),PS=buildProfile(D.map(function(d){return {kind:d.fork?"steepUp":d.kind}}));
    var P=PS,CAM=.15;function depOf(z){return CAM-z*.75}
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:2;touch-action:none";host.appendChild(cv);
    var ctx=cv.getContext("2d");
    var imSky=img(api,"bd_sky"),imSand=img(api,"sand_tex"),imBug=img(api,"buggy"),imOasis=img(api,"prop_oasis");var sandPat=null;
    imSand.onload=function(){sandPat=null};
    var S={dep:.15,bdep:-.6,forkVis:-1,z:1,steer:0,tz:null,x:60,v:0,gas:false,brake:false,lean:0,tyre:"high",fuel:1,tip:0,tipping:false,done:false,stuckT:0,lastX:60,check:60,checkFuel:1,wheel:0,bounce:0,bv:0,camX:0,camY:0,parts:[],t:0,forkAsked:{},wrongTips:0,assist:K,started:false,speedMax:0,minClear:1e9};
    var W=0,H=0,dpr=1,scale=1;
    function size(){var r=host.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
      scale=Math.max(.38,Math.min(1.05,H/760,W/1300))*(W<600?1.05:1);layoutUI()}
    /* ---------- controls: two big pedals; lean (e+), tyre pressure (u+) */
    var brake=btn(api,'<span class="ico">&#9208;&#65039;</span><span>'+T(api,{k:"Slow",e:"Brake"})+'</span>',"Brake"),gas=btn(api,'<span class="ico">&#9654;&#65039;</span><span>'+T(api,{k:"Go",e:"Gas"})+'</span>',"Gas");
    [brake,gas].forEach(function(b){b.style.cssText+=";position:absolute;z-index:7;flex-direction:column;border-radius:26px;font-size:16px"});
    gas.style.background="#1f7a46ee";gas.style.borderColor="#6af0ab";brake.style.background="#7a2a1aee";brake.style.borderColor="#ffb08a";
    host.appendChild(brake);host.appendChild(gas);
    var hg=holdBtn(gas,function(v){S.gas=v;if(v){actx();startSound();S.started=true}}),hb=holdBtn(brake,function(v){S.brake=v;if(v) actx()});
    /* steering: turn the wheel (drag) or hold the arrow buttons; keys A/D or Left/Right. Ages 4-6: tap a side to move over (one finger) */
    /* every press moves the buggy a clear step across at once (3 taps = the other lane); holding keeps it sliding */
    function nudge(d){S.z=clamp(S.z+d*.36,-1,1)}
    var stL=btn(api,'<span class="ico">&#9664;</span>',"Steer left"),stR=btn(api,'<span class="ico">&#9654;</span>',"Steer right");
    var wheel=document.createElement("canvas");wheel.style.cssText="position:absolute;z-index:7;touch-action:none;cursor:grab;border-radius:50%";wheel.setAttribute("aria-label","Steering wheel");
    [stL,stR].forEach(function(b){b.style.cssText+=";position:absolute;z-index:7;border-radius:50%"});host.appendChild(stL);host.appendChild(stR);if(!K) host.appendChild(wheel);
    var wAng=0,wDrag=null;
    if(K){stL.onclick=function(){S.tz=-1;api.sfx("click")};stR.onclick=function(){S.tz=1;api.sfx("click")}}
    else{holdBtn(stL,function(v){if(v) nudge(-1);S.steer=v?-1:(S.steer===-1?0:S.steer)});holdBtn(stR,function(v){if(v) nudge(1);S.steer=v?1:(S.steer===1?0:S.steer)});
      var wa=function(e){var r=wheel.getBoundingClientRect();return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI};
      wheel.addEventListener("pointerdown",function(e){e.preventDefault();try{wheel.setPointerCapture(e.pointerId)}catch(_){}wDrag={a0:wa(e),w0:wAng,id:e.pointerId}});
      wheel.addEventListener("pointermove",function(e){if(!wDrag||wDrag.id!==e.pointerId) return;var d=wa(e)-wDrag.a0;d=((d+540)%360)-180;wAng=clamp(wDrag.w0+d,-120,120);S.steer=wAng/120});
      ["pointerup","pointercancel","lostpointercapture"].forEach(function(t){wheel.addEventListener(t,function(){if(!wDrag) return;wDrag=null;wAng=0;S.steer=0})})}
    function drawWheel(){if(K||!wheel._s) return;var g=wheel.getContext("2d"),s2=wheel._s,d2=Math.min(2,window.devicePixelRatio||1),r=s2/2;g.setTransform(d2,0,0,d2,0,0);g.clearRect(0,0,s2,s2);g.save();g.translate(r,r);g.rotate((wDrag?wAng:S.steer*120)*DEG);
      g.strokeStyle="#2b1a0c";g.lineWidth=r*.2;g.beginPath();g.arc(0,0,r*.78,0,7);g.stroke();g.strokeStyle="#f6c445";g.lineWidth=r*.08;g.beginPath();g.arc(0,0,r*.78,0,7);g.stroke();
      g.strokeStyle="#2b1a0c";g.lineWidth=r*.14;[0,2.09,4.19].forEach(function(a){g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(a)*r*.72,-Math.cos(a)*r*.72);g.stroke()});g.fillStyle="#f6c445";g.beginPath();g.arc(0,0,r*.18,0,7);g.fill();g.fillStyle="#c0392b";g.fillRect(-r*.06,-r*.98,r*.12,r*.2);g.restore()}
    /* scout map: the next dune from above, its ripples, the wind, and the line your buggy is on */
    var map=document.createElement("canvas");map.className="ds-map";map.style.cssText="position:absolute;z-index:6;border-radius:16px;border:3px solid #f6c44599;box-shadow:0 8px 20px #0008;touch-action:none";map.setAttribute("aria-label","Map of the next dune");host.appendChild(map);
    map.addEventListener("pointerdown",function(e){if(!K) return;var r=map.getBoundingClientRect();S.tz=clamp(((e.clientX-r.left)/r.width-.5)*2.4,-1,1);api.sfx("click")});
    var leanB=null,leanF=null,tyreB=null,fuelEl=null;
    if(!K){leanB=btn(api,'<span class="ico">&#8630;</span>',"Lean back");leanF=btn(api,'<span class="ico">&#8631;</span>',"Lean forward");[leanB,leanF].forEach(function(b){b.style.cssText+=";position:absolute;z-index:7"});host.appendChild(leanB);host.appendChild(leanF);
      holdBtn(leanB,function(v){S.lean=v?-1:(S.lean===-1?0:S.lean)});holdBtn(leanF,function(v){S.lean=v?1:(S.lean===1?0:S.lean)})}
    if(band==="u"||band==="t"){tyreB=btn(api,"","Tyre pressure");tyreB.style.cssText+=";position:absolute;z-index:7";host.appendChild(tyreB);
      tyreB.onclick=function(){S.tyre=S.tyre==="high"?"low":"high";api.sfx(S.tyre==="low"?"whoosh":"click");tyreLabel();if(S.tyre==="low") api.say(cfg.tyreLow,{after:"idle"})};tyreLabel()}
    function tyreLabel(){if(tyreB) tyreB.innerHTML='<span class="ico">&#128168;</span> '+(S.tyre==="high"?T(api,{u:"Tyres: hard"}):T(api,{u:"Tyres: soft for sand"}))}
    if(band==="t"){fuelEl=api.el("div","ds-chip");fuelEl.style.cssText+=";position:absolute;z-index:7";host.appendChild(fuelEl)}
    var bar=api.el("div","ds-chip");bar.style.cssText+=";position:absolute;z-index:7;left:50%;transform:translateX(-50%)";host.appendChild(bar);
    function layoutUI(){var b=box(api),ps=K?Math.min(118,Math.max(96,H*.16)):Math.min(104,Math.max(80,H*.15));
      [brake,gas].forEach(function(x){x.style.width=x.style.height=px(ps)});
      var bot=Math.max(10,b.bot);brake.style.left=px(Math.max(10,b.vw<900?10:b.side*.3));brake.style.bottom=px(bot);
      gas.style.right=px(b.vw<900?118:b.side+10);gas.style.bottom=px(bot);
      if(leanB){leanB.style.left=px(Math.max(10,b.vw<900?10:b.side*.3)+ps+12);leanB.style.bottom=px(bot+ps*.15);leanF.style.right=px((b.vw<900?118:b.side+10)+ps+12);leanF.style.bottom=px(bot+ps*.15)}
      if(tyreB){tyreB.style.left=px(Math.max(10,b.vw<900?10:b.side*.3));tyreB.style.top=px(b.top+4)}
      if(fuelEl){fuelEl.style.right=px(b.vw<900?10:b.side);fuelEl.style.top=px(b.top+4)}
      bar.style.top=px(b.top+(b.ph?40:48));
      var ss=K?Math.max(88,ps*.8):Math.max(64,ps*.66),midL=Math.max(10,b.vw<900?10:b.side*.3)+ps+(leanB?ps+24:12),midR=(b.vw<900?118:b.side+10)+ps+(leanF?ps+24:12);
      var ws=K?0:Math.min(150,W-midL-midR-2*ss-24);
      stL.style.width=stL.style.height=stR.style.width=stR.style.height=px(ss);
      if(!K&&ws>=90){wheel._s=ws;var d2=Math.min(2,window.devicePixelRatio||1);wheel.width=wheel.height=Math.round(ws*d2);wheel.style.width=wheel.style.height=px(ws);wheel.style.display="block";
        var cxw=midL+(W-midL-midR)/2;wheel.style.left=px(cxw-ws/2);wheel.style.bottom=px(bot);stL.style.left=px(cxw-ws/2-ss-6);stR.style.right="";stR.style.left=px(cxw+ws/2+6);stL.style.bottom=stR.style.bottom=px(bot+ws/2-ss/2)}
      else{wheel._s=0;wheel.style.display="none";var lift=bot+ps+14;stL.style.left=px(Math.max(10,b.vw<900?10:b.side*.3));stR.style.left="";stR.style.right=px(b.vw<900?118:b.side+10);stL.style.bottom=stR.style.bottom=px(lift)}
      /* narrow screens (phones, 7+): one row above the pedals: [lean back][<]  ...  [>][lean fwd], so nothing overlaps Brake/Gas */
      if(leanB&&!wheel._s&&(W-midL-midR)<2*ss+24){var ls=Math.max(52,Math.min(64,ss*.85)),rowB=bot+ps+12;[leanB,leanF].forEach(function(x){x.style.width=x.style.height=px(ls);x.style.minWidth=px(ls)});
        leanB.style.left=px(10);leanB.style.bottom=px(rowB+(ss-ls)/2);leanF.style.right=px(10);leanF.style.bottom=px(rowB+(ss-ls)/2);
        stL.style.left=px(10+ls+10);stR.style.left="";stR.style.right=px(10+ls+10);stL.style.bottom=stR.style.bottom=px(rowB)}
      if(tyreB&&W<600){var gapL=parseFloat(stL.style.left)+ss+8,gapR=W-parseFloat(stR.style.right)-ss-8;if(gapR-gapL>=70){tyreB.style.top="";tyreB.style.left=px(gapL);tyreB.style.width=px(gapR-gapL);tyreB.style.bottom=stL.style.bottom;tyreB.style.minHeight=px(ss);tyreB.style.padding="2px 4px";tyreB.style.fontSize="13px";tyreB.style.whiteSpace="normal";tyreB.style.lineHeight="1.1"}}
      var mw=Math.round(Math.min(240,Math.max(150,W*.22))),mh=Math.round(mw*.66),d3=Math.min(2,window.devicePixelRatio||1);map._w=mw;map._h=mh;map.width=mw*d3;map.height=mh*d3;map.style.width=px(mw);map.style.height=px(mh);
      map.style.right=px(b.vw<900?10:b.side);map.style.top=px(b.top+(fuelEl?44:4));
      if(W<600){mw=Math.min(mw,Math.round(W*.4));mh=Math.round(mw*.66);map._w=mw;map._h=mh;map.width=mw*d3;map.height=mh*d3;map.style.width=px(mw);map.style.height=px(mh);
        map.style.top=px(b.top+4);map.style.right=px(10);bar.style.top=px(b.top+4);bar.style.left=px(10);bar.style.transform="none";bar.style.maxWidth=px(W-mw-34);bar.style.fontSize="12px";
        if(fuelEl){fuelEl.style.right="";fuelEl.style.left=px(10);fuelEl.style.top=px(b.top+4+(bar.offsetHeight||30)+6);fuelEl.style.fontSize="12px"}}}
    size();var onR=function(){size()};window.addEventListener("resize",onR);
    /* keys: Up/W = gas, Down/S = brake, Left/A + Right/D = steer, Q/E = lean back/forward */
    function kk(e){var k=(e.key||"").toLowerCase();return k==="arrowup"||k==="w"?"gas":k==="arrowdown"||k==="s"?"brake":k==="arrowleft"||k==="a"?"left":k==="arrowright"||k==="d"?"right":k==="q"?"lb":k==="e"?"lf":""}
    function kd(e){var k=kk(e);if(!k) return;if(e.repeat&&!(k==="gas"&&!S.gas&&!S.tipping&&!S.paused)){e.preventDefault();return}e.preventDefault();if(k==="gas") hg.set(true);else if(k==="brake") hb.set(true);else if(k==="left"){if(K) stL.onclick();else{nudge(-1);S.steer=-1}}else if(k==="right"){if(K) stR.onclick();else{nudge(1);S.steer=1}}else if(!K&&k==="lb") S.lean=-1;else if(!K&&k==="lf") S.lean=1}
    function ku(e){var k=kk(e);if(k==="gas") hg.set(false);else if(k==="brake") hb.set(false);else if(k==="left"||k==="right"){if(!K) S.steer=0}else if(k==="lb"||k==="lf") S.lean=0}
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    /* ---------- sound: engine pitch tied to the throttle + sand hiss */
    var snd=null;
    function startSound(){var A=actx();if(!A||snd) return;try{var o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();o.type="sawtooth";o.frequency.value=55;f.type="lowpass";f.frequency.value=420;g.gain.value=0;o.connect(f);f.connect(g);g.connect(A.destination);o.start();
      var nb=A.createBuffer(1,A.sampleRate,A.sampleRate),d=nb.getChannelData(0);for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1;var ns=A.createBufferSource();ns.buffer=nb;ns.loop=true;var nf=A.createBiquadFilter();nf.type="bandpass";nf.frequency.value=2600;nf.Q.value=.7;var ng=A.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(A.destination);ns.start();
      snd={o:o,g:g,ng:ng,ns:ns,A:A}}catch(e){}}
    function sound(){if(!snd) return;var t=snd.A.currentTime,sp=Math.abs(S.v);snd.o.frequency.setTargetAtTime(48+sp*.22+(S.gas?38:0),t,.08);snd.g.gain.setTargetAtTime(S.done?0:.035+(S.gas?.035:0),t,.1);snd.ng.gain.setTargetAtTime(S.done?0:Math.min(.05,sp/4000),t,.1)}
    api.onEnd(function(){window.removeEventListener("resize",onR);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);cancelAnimationFrame(raf);[stL,stR,wheel,map].forEach(function(x){x.remove()});if(snd){try{snd.o.stop();snd.ns.stop()}catch(e){}snd=null}});
    /* ---------- physics */
    var G=600,FENG=430,BRK=760,VMAX=360,VCREST=175,VTIP=235;
    function grip(ang,dir){var g=1;if(dir>0&&ang>24*DEG) g=.32;           /* loose sand at the slip-face angle: wheels just dig */
      return g}
    function softZone(x){var s=segAt(P,x);return s.kind==="soft"&&s.ang>5}
    function step(dt){
      if(S.done||S.tipping||S.paused) return;
      if(S.tz!=null){S.z+=clamp(S.tz-S.z,-1,1)*Math.min(1,dt*5.5);if(Math.abs(S.tz-S.z)<.02) S.z=S.tz}else S.z=clamp(S.z+S.steer*dt*1.3,-1,1);
      var lk=lockedLane();if(lk!=null){S.z=clamp(S.z,lk<0?-1:.6,lk<0?-.6:1);if(S.tz!=null) S.tz=clamp(S.tz,lk<0?-1:.6,lk<0?-.6:1)}
      route();
      var th=slopeAt(P,S.x),sAng=segAt(P,S.x).ang,soft=softZone(S.x);
      var lowT=S.tyre==="low",roll=soft?(lowT?55:270):(lowT?40:60);
      var dig=soft&&!lowT&&S.gas;               /* flooring it on soft sand with hard tyres: wheel-spin dig-in */
      var a=(S.gas&&S.fuel>0?FENG*grip(th,1)*(dig?.55:1):0)-G*Math.sin(th);
      if(Math.abs(S.v)>2) a-=roll*Math.sign(S.v);else if(!S.gas) {a=Math.abs(a)<roll?0:a-roll*Math.sign(a)}
      if(S.brake){if(Math.abs(S.v)>4) a-=BRK*Math.sign(S.v);else if(Math.abs(th)<26*DEG){S.v=0;a=0}}
      a-=S.v*Math.abs(S.v)*.0016;
      S.v=clamp(S.v+a*dt,-VMAX,VMAX);
      if(th>24*DEG&&S.v>0) S.v*=Math.exp(-dt*3.4);   /* loose sand at the angle of repose: wheels sink and momentum dies, so no run-up can climb a slip face */
      if(S.assist&&!S.gas&&th>3*DEG&&S.v<=0) S.v=0;   /* k: the buggy waits on the slope instead of rolling back */
      /* band k: Spark's helping hand: speed is held gentle over the crest and down the slope (no tip-overs, no timing) */
      if(S.assist){var ahead=segAt(P,S.x+90).ang;if((ahead<-20||sAng<-20)&&S.v>VCREST*.7) S.v=VCREST*.7;if(sAng<-4&&S.v>VCREST*.8) S.v=VCREST*.8}
      S.x+=S.v*Math.cos(th)*dt;if(S.x<20){S.x=20;S.v=Math.max(0,S.v)}
      if(S.gas&&S.fuel>0&&band==="t") S.fuel=Math.max(0,S.fuel-dt*(cfg.fuelRate||.04)*(dig?2:1));
      S.speedMax=Math.max(S.speedMax,Math.abs(S.v));S.wheel+=S.v*dt/34;
      /* suspension bounce over slope changes */
      var th2=slopeAt(P,S.x+30);S.bv+=(-(S.bounce)*90-(S.bv)*9+(th2-th)*S.v*1.6)*dt;S.bounce+=S.bv*dt;
      /* sand plumes */
      if(Math.abs(S.v)>30||dig){var n=dig?3:(Math.abs(S.v)>150?2:1);for(var i=0;i<n;i++) S.parts.push({x:S.x-34,y:yAt(P,S.x-34)+4,vx:-S.v*R(.1,.35)+R(-30,30),vy:R(30,dig?160:110),life:R(.6,1.2),t:0,r:R(4,dig?14:9)})}
      S.parts=S.parts.filter(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=120*dt;return p.t<p.life});
      /* tip-over: going over the brink / down the slip face head-on too fast (lean back gives a little margin) */
      var lm=S.lean<0?1.15:S.lean>0?.88:1;
      if(!S.assist&&(sAng<-25&&S.v>VTIP*lm||(segAt(P,S.x+40).ang<-25&&sAng>=-1&&S.v>VCREST*lm*1.25))){tipOver();return}
      if(K){if(th>22*DEG&&S.gas&&S.v<30) S.wob=Math.min(1,(S.wob||0)+dt*2);else S.wob=Math.max(0,(S.wob||0)-dt*1.5)}
      S.zv=((S.z-(S.zPrev==null?S.z:S.zPrev))/Math.max(dt,.001));S.zPrev=S.z;if(Math.abs(S.zv)>.25&&Math.random()<dt*20&&S.parts) S.parts.push({x:S.x-30,y:yAt(P,S.x-30),r:6+Math.random()*6,t:0,life:.7});
      if(!S.trail) S.trail=[];if(!S.trail.length||S.x-S.trail[S.trail.length-1].x>25){S.trail.push({x:S.x,z:S.z});if(S.trail.length>80) S.trail.shift()}
      /* stuck (spinning on a slope that is too steep, or bogged) -> auto-recover within 3 s */
      if(S.gas&&(Math.abs(S.x-S.lastX)<.6*dt*60||(th>24*DEG&&S.v<20))) S.stuckT+=dt;else if(!S.gas&&S.v<=0&&th>20*DEG) S.stuckT+=dt;else S.stuckT=Math.max(0,S.stuckT-dt);
      S.lastX=S.x;
      /* trying to climb a slip face: the wheels dig and it slides back. Count the time spent trying (does not reset on the little slide back) */
      if(S.gas&&(sAng>24||(segAt(P,S.x+50).ang>24&&S.v<60))) S.steepT=(S.steepT||0)+dt;else if(sAng>=0&&sAng<=24&&!S.gas) S.steepT=Math.max(0,(S.steepT||0)-dt*.3);
      if(S.steepT>2.5){S.steepT=0;recover("steep");return}
      if(S.stuckT>2.4) recover(soft&&!lowT?"bog":"steep");
      if(band==="t"&&S.fuel<=0&&Math.abs(S.v)<5&&!S.fuelMsg){S.fuelMsg=true;recover("fuel")}
      /* turning on the steep slip face is how buggies roll: go straight down it */
      if(!S.assist&&sAng<-25&&Math.abs(S.steer)>.3&&Math.abs(S.v)>40){S.turnTip=true;tipOver();return}
      /* checkpoints */
      D.forEach(function(d,i){var m=P.marks[i];if(S.x>m.x0+40&&S.x<m.x0+260&&S.check<m.x0){S.check=m.x0+40;S.checkFuel=S.fuel}});
      if(S.x>=P.end){win()}
    }
    async function tipOver(){S.tipping=true;S.wrongTips++;api.sfx("thunk");hg.set(false);hb.set(false);
      var t0=performance.now();S.tipA=0;await new Promise(function(r){(function an(){var k=(performance.now()-t0)/900;S.tipA=Math.min(1,k)*55*DEG;if(k<1&&api.live()) requestAnimationFrame(an);else r()})()});
      for(var i=0;i<24;i++) S.parts.push({x:S.x+R(-30,40),y:yAt(P,S.x)+R(0,20),vx:R(-80,80),vy:R(40,180),life:R(.8,1.5),t:0,r:R(6,16)});
      await api.say(S.turnTip&&cfg.tippedTurn?cfg.tippedTurn:cfg.tipped,{state:"concern",after:"idle"});S.turnTip=false;if(!api.live()) return;
      S.x=Math.max(60,crestBefore(S.x)-120);S.v=0;S.tipA=0;S.tipping=false;S.stuckT=0;api.hint(cfg.hintSlow)}
    function crestBefore(x){var p=P.pts,best=60;for(var i=1;i<p.length;i++){if(p[i][0]>x) break;if((p[i][2]||0)===0&&(p[i-1][2]||0)>5) best=p[i-1][0]}return best}
    async function recover(why){S.paused=true;S.stuckT=0;hg.set(false);if(why!=="fuel") S.bogT=performance.now();
      await api.say(why==="bog"?cfg.bogged:why==="fuel"?cfg.fuelOut:cfg.tooSteep,{state:"concern",after:"idle"});if(!api.live()) return;
      if(why==="steep"){var i=P.marks.findIndex(function(m,j){return D[j].fork&&S.x>m.x0&&S.x<m.x0+900});if(i>=0){D[i].chosen=null;D[i].locked=false;S.forkAsked[i]=true;S.x=P.marks[i].x0-120;api.hint(cfg.hintSteer||{e:"Steer round the long low end of the dune"})}else S.x=Math.max(60,S.x-160)}
      else if(why==="fuel"){S.x=S.check;S.fuel=Math.max(S.checkFuel,.45);S.fuelMsg=false}
      else S.x=Math.max(60,S.x-120);
      S.v=0;S.bogT=0;S.paused=false}
    /* choose a line at a fork: a top-down sketch of the crescent dune with its ripples; the ripples lie ACROSS the wind */
    function duneSketch(w,h,line){var c=document.createElement("canvas"),d=Math.min(2,window.devicePixelRatio||1);c.width=w*d;c.height=h*d;c.style.width=w+"px";c.style.height=h+"px";var g=c.getContext("2d");g.scale(d,d);
      g.fillStyle="#e2b979";g.fillRect(0,0,w,h);
      /* ripples: short wavy lines running top-to-bottom (across a wind that blows right-to-left) */
      g.strokeStyle="#b98a4c";g.lineWidth=1.4;for(var x=8;x<w;x+=11){g.beginPath();for(var y=0;y<=h;y+=4){var X=x+Math.sin(y*.18+x)*2;if(y===0)g.moveTo(X,y);else g.lineTo(X,y)}g.stroke()}
      /* barchan: horns point downwind (left); steep slip face on the downwind (left) side, shaded */
      g.fillStyle="#d9a862";g.beginPath();g.moveTo(w*.62,h*.5);g.bezierCurveTo(w*.66,h*.12,w*.38,h*.02,w*.2,h*.1);g.bezierCurveTo(w*.36,h*.24,w*.36,h*.76,w*.2,h*.9);g.bezierCurveTo(w*.38,h*.98,w*.66,h*.88,w*.62,h*.5);g.fill();
      g.fillStyle="#8a5a2a";g.beginPath();g.moveTo(w*.2,h*.1);g.bezierCurveTo(w*.36,h*.24,w*.36,h*.76,w*.2,h*.9);g.bezierCurveTo(w*.42,h*.66,w*.42,h*.34,w*.2,h*.1);g.fill();
      g.lineWidth=4;g.setLineDash([8,6]);g.strokeStyle=line==="straight"?"#ff6a4a":"#2fbf71";g.beginPath();
      if(line==="straight"){g.moveTo(4,h*.5);g.lineTo(w-4,h*.5)}else{g.moveTo(4,h*.5);g.bezierCurveTo(w*.12,h*.5,w*.14,h*.96,w*.3,h*.97);g.bezierCurveTo(w*.6,h*.98,w*.8,h*.6,w-4,h*.5)}g.stroke();g.setLineDash([]);
      g.fillStyle="#1b120a";g.beginPath();g.arc(8,h*.5,6,0,7);g.fill();return c}
    /* the line you steer decides the dune you meet: round the long low horn = gentle; straight at it = the steep slip face that faces you */
    function lockedLane(){for(var i=0;i<D.length;i++) if(D[i].fork&&D[i].locked) {var m=P.marks[i];if(S.x<m.x0+1400) return D[i].kind==="horn"?-1:1}return null}
    function route(){D.forEach(function(d,i){if(!d.fork||d.locked) return;var m=P.marks[i];
      if(S.x>m.x0-700&&!S.forkAsked[i]){S.forkAsked[i]=true;api.say(cfg.forkQ,{after:"idle"});map.classList.add("ds-pulse");setTimeout(function(){map.classList.remove("ds-pulse")},2600)}
      var want=S.z<0?"horn":"steepUp";if(want!==d.kind){d.kind=want;P=want==="horn"?PH:PS}
      /* the way is decided at the foot of the dune (both lanes are the same sand before it) */
      if(S.x>m.x0-80){d.locked=true;d.chosen=want==="horn"?"horn":"straight";S.tz=null;api.say(want==="horn"?cfg.forkHorn:cfg.forkStraight,{after:"idle"})}})}
    function nextDune(){for(var i=0;i<D.length;i++){var e=(P.marks[i+1]?P.marks[i+1].x0:P.end);if(S.x<e-470) return i}return D.length-1}
    function drawMap(){var g=map.getContext("2d"),w=map._w,h=map._h;if(!w) return;var d3=Math.min(2,window.devicePixelRatio||1);g.setTransform(d3,0,0,d3,0,0);
      var i=nextDune(),d=D[i],toward=d.fork;/* fork dunes: wind blows toward you, horns point at you; other dunes: wind at your back, you meet the gentle windward side */
      g.fillStyle="#e2b979";g.fillRect(0,0,w,h);
      g.strokeStyle="#b98a4c";g.lineWidth=1.3;var roff=(S.x*.04)%9;for(var y=6-9+roff;y<h;y+=9){g.beginPath();for(var x=0;x<=w;x+=4){var Y=y+Math.sin(x*.16+y-roff)*1.6;if(x===0)g.moveTo(x,Y);else g.lineTo(x,Y)}g.stroke()}
      var mk=P.marks[i],prog=mk?clamp(1-(mk.x0-S.x)/1100,0,1.15):1,dy=(prog-1)*h*.38,ds=.62+.38*Math.min(1,prog);var top=h*.12,bot=h*.6,hs=d.hornSide||1;g.save();g.translate(w/2,dy+h*.6*(1-ds));g.scale(ds,ds);if(!toward){g.translate(0,h*.72);g.scale(1,-1)}
      /* crescent (barchan): horns point downwind; the dark slip face is on the inside of the curve. hs = side of the long low horn */
      var tl=hs<0?[-w*.46,bot+h*.27]:[-w*.31,bot+h*.08],tr=hs>0?[w*.46,bot+h*.27]:[w*.31,bot+h*.08];
      g.fillStyle="#d9a862";g.beginPath();g.moveTo(tl[0],tl[1]);g.bezierCurveTo(-w*.42,top-h*.02,w*.42,top-h*.02,tr[0],tr[1]);
      g.bezierCurveTo(w*.2,bot-h*.02,-w*.2,bot-h*.02,tl[0],tl[1]);g.closePath();g.fill();
      g.fillStyle="#8a5a2a";g.beginPath();g.moveTo(-w*.25,bot-h*.03);g.bezierCurveTo(-w*.12,bot-h*.2,w*.12,bot-h*.2,w*.25,bot-h*.03);g.bezierCurveTo(w*.12,bot-h*.07,-w*.12,bot-h*.07,-w*.25,bot-h*.03);g.closePath();g.fill();
      g.strokeStyle="#f3d79a";g.lineWidth=1.5;g.beginPath();g.moveTo(-w*.25,bot-h*.03);g.bezierCurveTo(-w*.12,bot-h*.2,w*.12,bot-h*.2,w*.25,bot-h*.03);g.stroke();
      g.restore();
      if(band==="k"||band==="e"){g.fillStyle="#1b5fa8";g.strokeStyle="#1b5fa8";g.lineWidth=3;var ax=w*.09,a0=toward?h*.1:h*.66,a1=toward?h*.36:h*.4,dr=toward?1:-1;g.beginPath();g.moveTo(ax,a0);g.lineTo(ax,a1);g.stroke();g.beginPath();g.moveTo(ax-7,a1-6*dr);g.lineTo(ax+7,a1-6*dr);g.lineTo(ax,a1+5*dr);g.closePath();g.fill()}
      var good=!d.fork||(d.locked?d.kind==="horn":S.z<0),bx=w/2+S.z*w*.42;g.strokeStyle=good?"#2fbf71":"#ff6a4a";g.lineWidth=3;g.setLineDash([6,5]);g.beginPath();g.moveTo(bx,h-8);g.lineTo(bx,h*.06);g.stroke();g.setLineDash([]);
      if(d.fork){var lab=d.locked?(d.kind==="horn"?T(api,{k:"Easy way \u2713",e:"Horn way \u2713",u:"You took the horn \u2713"}):T(api,{k:"Steep way!",e:"Slip face way \u2717",u:"You took the slip face \u2717"})):(S.z<0?T(api,{k:"Easy way",e:"Horn way",u:"Lane: horn"}):T(api,{k:"Steep way",e:"Slip face way",u:"Lane: slip face"}));
        g.font="800 12px system-ui,sans-serif";var lw=g.measureText(lab).width+12;g.fillStyle=good?"rgba(31,122,70,.92)":"rgba(140,40,20,.92)";g.fillRect(w-lw-4,4,lw,18);g.fillStyle="#fff";g.textBaseline="middle";g.fillText(lab,w-lw+2,13);g.textBaseline="alphabetic"}
      if(S.trail&&S.trail.length>1){g.strokeStyle="#5a3a1acc";g.lineWidth=2.5;g.beginPath();S.trail.forEach(function(q,j){var ty=h-10+(S.x-q.x)*.05;var tx=w/2+q.z*w*.42;if(!j) g.moveTo(tx,ty);else g.lineTo(tx,ty)});g.lineTo(bx,h-10);g.stroke()}
      g.fillStyle="#1b120a";g.beginPath();g.arc(bx,h-10,7,0,7);g.fill();g.fillStyle="#f6c445";g.beginPath();g.arc(bx,h-10,3,0,7);g.fill()}
    async function askFork(i){S.paused=true;hg.set(false);hb.set(false);var w=Math.min(240,(innerWidth-80)/2),h=Math.round(w*.62);
      var c1=duneSketch(w,h,"straight"),c2=duneSketch(w,h,"horn");
      var o=[{html:"",label:cfg.lineStraight,ok:true},{html:"",label:cfg.lineHorn,ok:true}];
      var pr=choose(api,cfg.forkQ,o,{free:true});
      var cards=host.querySelectorAll(".ds-pick .ds-opt");if(cards.length===2){cards[0].insertBefore(c1,cards[0].firstChild);cards[1].insertBefore(c2,cards[1].firstChild)}
      var k=await pr;if(!api.live()) return;
      D[i].chosen=k===0?"straight":"horn";D[i].kind=k===0?"steepUp":"horn";var keepX=S.x;P=buildProfile(D);S.x=keepX;
      await api.say(k===0?cfg.forkStraight:cfg.forkHorn,{after:"idle"});S.paused=false}
    async function win(){if(S.done) return;S.done=true;hg.set(false);hb.set(false);api.sfx("win");api.burst(innerWidth*.6,innerHeight*.45,22,["\u{1F334}","\u2728","\u{1F4A7}"]);sound();
      await api.say(cfg.arrived,{state:"celebration",after:"idle"});if(!api.live()) return;
      await api.fact(1);if(!api.live()) return;
      if(K){await kCheck();if(!api.live()) return}
      resolve({tips:S.wrongTips,fuel:S.fuel})}
    /* band k action check: "which side is easy to climb?" tap the gentle side of a dune */
    function kCheck(){return new Promise(function(done){S.check2=true;S.paused=true;
      var b=box(api),w=Math.min(b.vw-40,620),h=Math.min(260,b.vh*.36),c=document.createElement("canvas"),d=Math.min(2,window.devicePixelRatio||1);c.width=w*d;c.height=h*d;c.style.cssText="position:absolute;z-index:9;left:"+px((b.vw-w)/2)+";top:"+px(b.top+20)+";width:"+px(w)+";height:"+px(h)+";border-radius:18px;box-shadow:0 10px 30px #000a";host.appendChild(c);
      var g=c.getContext("2d");g.scale(d,d);var sk=g.createLinearGradient(0,0,0,h);sk.addColorStop(0,"#7fb6e6");sk.addColorStop(1,"#f3dcb0");g.fillStyle=sk;g.fillRect(0,0,w,h);
      var tw=w*.86,ls=tw/(1+Math.tan(32*DEG)/Math.tan(11*DEG)),lx=w*.07,rx=lx+tw,cx=rx-ls,top=h*.2,base=h*.9;
      g.fillStyle="#e8c27e";g.fillRect(0,base,w,h-base);
      var gw=g.createLinearGradient(lx,0,cx,0);gw.addColorStop(0,"#e3b46e");gw.addColorStop(1,"#d39c55");g.fillStyle=gw;g.beginPath();g.moveTo(lx,base);g.lineTo(cx,top);g.lineTo(cx,base);g.closePath();g.fill();
      g.fillStyle="#8f5f2e";g.beginPath();g.moveTo(cx,top);g.lineTo(rx,base);g.lineTo(cx,base);g.closePath();g.fill();
      g.strokeStyle="#ffffff55";g.lineWidth=1.2;for(var q=1;q<7;q++){var f=q/7;g.beginPath();g.moveTo(lx+(cx-lx)*f,base-(base-top)*f+4);g.lineTo(lx+(cx-lx)*f+10,base-(base-top)*f+2);g.stroke()}
      var L1=api.el("button","ds-hit"),R1=api.el("button","ds-hit");[L1,R1].forEach(function(x){x.type="button";x.style.borderRadius="18px";x.style.boxShadow="inset 0 0 0 4px #ffe56a88"});
      L1.setAttribute("aria-label","Long gentle side");R1.setAttribute("aria-label","Short steep side");
      var cl=(b.vw-w)/2,ct=b.top+20;var hh=Math.max(80,Math.min(h*.5,h-16)),lw=Math.max(80,cx-lx-16),rw=Math.max(80,Math.min(rx-cx+6,w-(cx-cl*0)-4)),rl=Math.min(cx+4,w-rw-4);L1.style.left=px(cl+lx+6);L1.style.top=px(ct+h*.42);L1.style.width=px(Math.min(lw,rl-lx-12));L1.style.height=px(hh);
      R1.style.left=px(cl+rl);R1.style.top=px(ct+h*.42);R1.style.width=px(rw);R1.style.height=px(hh);host.appendChild(L1);host.appendChild(R1);
      api.say(cfg.kCheckQ,{after:"idle"});api.hint(cfg.kCheckHint);
      L1.onclick=function(){api.sfx("ok");api.burst(api.rectOf(L1).cx,api.rectOf(L1).cy,12);[c,L1,R1].forEach(function(x){x.remove()});api.hint(null);api.say(cfg.kCheckOk,{state:"celebration",after:"idle"}).then(done)};
      R1.onclick=function(){api.sfx("no");api.say(cfg.kCheckNo,{state:"concern",after:"idle"});L1.classList.add("ds-pulse")};
      api.onEnd(function(){[c,L1,R1].forEach(function(x){x.remove()})})})}
    /* lanes at a fork: the horn lane lies on the hornSide of the dune (far = up the screen when hornSide matches steering sign) */
    function laneDep(kind){return kind==="horn"?.9:-.6}
    var altCache={};
    function forkInView(x0,x1){for(var i=0;i<D.length;i++){var d=D[i];if(!d.fork) continue;var m=P.marks[i],len=1200;if(x1<m.x0-200||x0>m.x0+len) continue;
        var ak=d.kind==="horn"?"steepUp":"horn",key=i+":"+ak+":"+D.map(function(q){return q.kind}).join(",");
        if(!altCache[key]){var D2=D.map(function(q,j){return j===i?{kind:ak}:{kind:q.kind}});altCache={};altCache[key]=buildProfile(D2)}
        return {i:i,d:d,m:m,alt:altCache[key],altKind:ak}}return null}
    /* the camera depth: follows the steering while an open fork is on screen, otherwise it rests on the buggy's lane */
    function depTarget(){var i=S.forkVis;if(i==null||i<0||D[i].locked) return S.bdep;var q=S.z*D[i].hornSide;
      return q>=.45?.9-(1-q)/.55*.3:-.6+(q+1)/1.45*.3}
    /* ---------- render */
    var raf=0,last=performance.now();
    function frame(now){raf=requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000);last=now;if(!api.live()) return;S.t+=dt;step(dt);sound();draw();drawMap();drawWheel();hud()}
    function hud(){var sp=Math.round(Math.abs(S.v)/VMAX*60);bar.textContent=T(api,{k:"\u{1F334} Drive to the oasis!",e:"\u{1F334} Oasis ahead \u00B7 speed "+sp}) ;
      if(fuelEl) fuelEl.textContent="\u26FD Fuel "+Math.round(S.fuel*100)+"%"}
    function draw(){var c=ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
      var by=yAt(P,S.x);var tx=S.x+W*.12/scale,ty=by+H*.05/scale;var look=slopeAt(P,S.x+160);S.camX+=(tx-S.camX)*.12;S.camY+=(ty+look*120-S.camY)*.08;if(!S.init){S.init=1;S.camX=tx;S.camY=ty}
      var gy=H*.62;function sx(x){return W/2+(x-S.camX)*scale}function sy(y){return gy-(y-S.camY)*scale}
      /* keep the buggy in clear view in EITHER lane: below the top chips/map, above the controls under it. On short free bands (phones) the lanes move closer. */
      (function(){var bw2=105*scale,bh=190*scale*.5,bxS=sx(S.x),lim=H-14,topC=0,hr=host.getBoundingClientRect(),bb=box(api);topC=Math.max(0,bb.top);
        function ov(e){if(!e||e.style.display==="none"||!e.offsetWidth) return null;var r=e.getBoundingClientRect(),l=r.left-hr.left,rr=r.right-hr.left;return (rr>bxS-bw2&&l<bxS+bw2)?{t:r.top-hr.top,b:r.bottom-hr.top}:null}
        [brake,gas,stL,stR,leanB,leanF,wheel,tyreB].forEach(function(e){var o=ov(e);if(o&&o.t>H*.45) lim=Math.min(lim,o.t-10)});
        [bar,map,fuelEl,tyreB].forEach(function(e){var o=ov(e);if(o&&o.b<H*.75) topC=Math.max(topC,o.b+6)});
        var full=Math.min(H*.16,110),fit=(lim-topC-bh-8)/1.5;S.LANE=Math.max(36,Math.min(full,fit));
        var base=sy(by),hi=lim-.75*S.LANE,lo=topC+bh+.75*S.LANE;if(lo>hi) lo=hi;
        if(base>hi) S.camY-=(base-hi)/scale;else if(base<lo) S.camY+=(lo-base)/scale})();
      /* sky photo, parallax */
      if(imSky.complete&&imSky.naturalWidth){var iw=imSky.naturalWidth,ih=imSky.naturalHeight,s2=Math.max(W/iw,H/ih)*1.15,dw=iw*s2,dh=ih*s2,ox=-((S.camX*.04)%(dw-W>0?dw-W:1));c.drawImage(imSky,ox,Math.min(0,(H-dh)*.5-S.camY*.03),dw,dh)}else{c.fillStyle="#9cc6ea";c.fillRect(0,0,W,H)}
      /* 10/10 items 2+29: at a fork the main view shows BOTH ways as two lanes of sand: the steep slip face and the long low horn.
         Steering moves the buggy across into the other lane (the camera follows it), and the lane it is in is the dune it really drives. */
      var x0=S.camX-W/2/scale-40,x1=S.camX+W/2/scale+40;
      function ground(PP,yo,haze,tag,xFrom){var yoF=typeof yo==="function"?yo:function(){return yo};function sy2(y,x){return sy(y)+yoF(x)}
      var x0=Math.max(S.camX-W/2/scale-40,xFrom==null?-1e9:xFrom),x1=S.camX+W/2/scale+40;if(x1<=x0) return;
      if(!sandPat&&imSand.complete&&imSand.naturalWidth){try{sandPat=c.createPattern(imSand,"repeat")}catch(e){}}  /* sand_tex is made seamless offline */
      c.beginPath();c.moveTo(sx(x0),H+10);for(var x=x0;x<=x1;x+=8) c.lineTo(sx(x),sy2(yAt(PP,x),x));c.lineTo(sx(x1),H+10);c.closePath();
      if(sandPat){c.save();c.clip();c.translate(sx(0)%(imSand.naturalWidth*.5),0);c.scale(.5*Math.max(.6,scale),.5*Math.max(.6,scale));c.fillStyle=sandPat;c.fillRect(-4000,-400,12000,8000);c.restore()}else{c.fillStyle="#d9a862";c.fill()}
      /* light: windward faces lit, slip faces in shade */
      for(var i=1;i<PP.pts.length;i++){var a=PP.pts[i-1],b=PP.pts[i],ang=b[2]||0;if(b[0]<x0||a[0]>x1) continue;
        if(ang<-20){c.fillStyle="rgba(70,35,10,.38)";c.beginPath();c.moveTo(sx(a[0]),sy2(a[1],a[0]));c.lineTo(sx(b[0]),sy2(b[1],b[0]));c.lineTo(sx(b[0]),H+10);c.lineTo(sx(a[0]),H+10);c.closePath();c.fill()}
        else if(ang>5){var gr=c.createLinearGradient(0,sy2(b[1],b[0]),0,sy2(a[1],a[0])+60);gr.addColorStop(0,"rgba(255,236,190,.28)");gr.addColorStop(1,"rgba(255,236,190,0)");c.fillStyle=gr;c.beginPath();c.moveTo(sx(a[0]),sy2(a[1],a[0]));c.lineTo(sx(b[0]),sy2(b[1],b[0]));c.lineTo(sx(b[0]),sy2(b[1],b[0])+80*scale);c.lineTo(sx(a[0]),sy2(a[1],a[0])+80*scale);c.closePath();c.fill();
          /* ripples on the windward side */
          c.strokeStyle="rgba(120,74,30,.45)";c.lineWidth=1.3;for(var rx=a[0]+10;rx<b[0];rx+=26){var ry=yAt(PP,rx);for(var dd=10;dd<70;dd+=17){c.beginPath();c.moveTo(sx(rx)-6*scale,sy2(ry,rx)+dd*scale);c.quadraticCurveTo(sx(rx),sy2(ry,rx)+(dd-4)*scale,sx(rx)+6*scale,sy2(ry,rx)+dd*scale);c.stroke()}}}}
      c.strokeStyle="rgba(255,240,205,.7)";c.lineWidth=2;c.beginPath();for(var x2=x0;x2<=x1;x2+=8){var Y=sy2(yAt(PP,x2),x2);if(x2===x0)c.moveTo(sx(x2),Y);else c.lineTo(sx(x2),Y)}c.stroke();
      /* "slow down" flags at each crest (where a slip face starts) */
      for(var j=1;j<PP.pts.length;j++){var q0=PP.pts[j-1],q1=PP.pts[j];if((q1[2]||0)<-25&&q0[0]>x0&&q0[0]<x1){var fx=sx(q0[0]-40),fy=sy2(yAt(PP,q0[0]-40),q0[0]-40);c.strokeStyle="#5a3a1c";c.lineWidth=3*Math.max(.6,scale);c.beginPath();c.moveTo(fx,fy);c.lineTo(fx,fy-70*scale);c.stroke();c.fillStyle="#ffd23a";c.beginPath();c.moveTo(fx,fy-70*scale);c.lineTo(fx+36*scale,fy-58*scale);c.lineTo(fx,fy-46*scale);c.closePath();c.fill()}}
        if(haze){c.fillStyle="rgba(248,226,190,"+haze+")";c.beginPath();c.moveTo(sx(x0),H+10);for(var xh=x0;xh<=x1;xh+=8) c.lineTo(sx(xh),sy2(yAt(PP,xh),xh));c.lineTo(sx(x1),H+10);c.closePath();c.fill()}
        if(tag){var tx2=sx(tag.x),ty2=sy2(yAt(PP,tag.x),tag.x)-18*Math.max(.7,scale);{c.font="800 "+Math.round(15*Math.max(.8,scale))+"px system-ui,sans-serif";var tw2=c.measureText(tag.t).width+22,th3=28*Math.max(.8,scale);tx2=clamp(tx2,tw2/2+12,Math.max(tw2/2+12,W*.66-tw2/2));c.fillStyle=tag.ok?"rgba(31,122,70,.92)":"rgba(140,40,20,.92)";c.beginPath();if(c.roundRect) c.roundRect(tx2-tw2/2,ty2-th3,tw2,th3,th3/2);else c.rect(tx2-tw2/2,ty2-th3,tw2,th3);c.fill();c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";c.fillText(tag.t,tx2,ty2-th3/2);c.textAlign="start";c.textBaseline="alphabetic"}}
      }
      var LANE=S.LANE||Math.min(H*.16,110),fk=forkInView(x0,x1);S.forkVis=fk?fk.i:-1;S.bdep=depOf(S.z);S.dep=CAM;
      /* two lanes the whole drive: far = the long low horn (steer LEFT), near = straight at the slip face (steer RIGHT). The camera does not chase the lane,
         so steering visibly moves the buggy up/down the screen between them, even when stopped. */
      var onFar=S.z<0,fd=fk&&fk.d,tags={horn:T(api,cfg.laneHorn||{k:"Easy way \u2713",e:"Gentle horn \u2713",u:"Horn: gentle windward slope",t:"Horn: windward slope ~10\u00B0"}),steep:T(api,cfg.laneSteep||{k:"Too steep!",e:"Steep slip face",u:"Slip face: about 32\u00B0",t:"Slip face ~32\u00B0 (angle of repose)"})};
      var showTag=fd&&!fd.locked;
      ground(PH,-(.9-CAM)*LANE,fd&&fd.locked?(fd.kind==="horn"?0:.42):(onFar?.06:.26),showTag?{x:fk.m.x0+420,t:tags.horn,ok:true}:null);
      if(!onFar) drawBuggy();
      ground(PS,-(-.6-CAM)*LANE,fd&&fd.locked&&fd.kind==="horn"?.3:0,showTag?{x:fk.m.x0+300,t:tags.steep,ok:false}:null);
      if(onFar) drawBuggy();
      /* oasis at the finish */
      if(imOasis.complete&&imOasis.naturalWidth){var ow=520*scale,oh=ow*imOasis.naturalHeight/imOasis.naturalWidth;var ox=P.end+70+260;c.drawImage(imOasis,sx(ox)-ow/2,sy(yAt(P,ox))-((P===PH?.9:-.6)-CAM)*LANE-oh*.9,ow,oh)} /* 10/10 item 11: the oasis starts past the finish line, so the buggy parks in front of the palms instead of driving through them */
      /* particles */
      S.parts.forEach(function(p){var k=p.t/p.life;c.fillStyle="rgba(222,184,128,"+(.55*(1-k))+")";c.beginPath();c.arc(sx(p.x),sy(p.y)-(S.bdep-CAM)*LANE,p.r*scale*(1+k*1.5),0,7);c.fill()});
      /* the buggy: sits on the sand along the slope, suspension bounce, lean, tip; on the slip face it digs in and sinks (bogged) */
      function drawBuggy(){if(imBug.complete&&imBug.naturalWidth){var bw=190*scale,bh=bw*imBug.naturalHeight/imBug.naturalWidth,th=slopeAt(P,S.x);
        var sink=Math.max((th>20*DEG&&S.stuckT>0)?Math.min(1,S.stuckT/1.4):0,S.bogT?Math.min(1,(performance.now()-S.bogT)/500):0);
        var zs=1+S.z*.1,bxS=sx(S.x),byS=sy(by)-(S.bdep-S.dep)*LANE+sink*bh*.22;S.scr={x:bxS,y:byS,lane:onFar?"far":"near",sink:sink};
        if(sink>0&&Math.random()<.6) S.parts.push({x:S.x-40,y:by+10,r:6+Math.random()*6,t:0,life:.7});
        c.save();c.translate(bxS,byS);c.rotate(-th+(S.lean*5*DEG)+(S.tipA||0)+clamp(S.zv||0,-1.5,1.5)*4*DEG+(S.wob?Math.sin(S.t*18)*S.wob*4*DEG:0));c.scale(zs,zs);c.translate(0,-S.bounce*scale*.6);
        c.drawImage(imBug,-bw/2,-bh*.98,bw,bh);
        /* spinning wheel blur */
        c.strokeStyle="rgba(30,30,30,.55)";c.lineWidth=2;[-.33,.31].forEach(function(f){var wx=bw*f,wy=-bh*.22,wr=bh*.2;for(var k=0;k<3;k++){var a2=S.wheel+k*2.09;c.beginPath();c.moveTo(wx+Math.cos(a2)*wr*.3,wy+Math.sin(a2)*wr*.3);c.lineTo(wx+Math.cos(a2)*wr*.85,wy+Math.sin(a2)*wr*.85);c.stroke()}});
        c.restore()}}
    }
    raf=requestAnimationFrame(frame);
    api.hint(cfg.hint);api.say(cfg.start,{after:"idle"});
    host._buggy={S:S,get P(){return P},yAt:function(x){return yAt(P,x)},slope:function(x){return slopeAt(P,x)*180/Math.PI},gas:function(v){hg.set(v)},steer:function(v){S.steer=v},steerTo:function(z){S.tz=z},brake:function(v){hb.set(v)},lean:function(v){S.lean=v},tyre:function(){if(tyreB) tyreB.click()},D:D,
      seg:function(x){return segAt(P,x)},lane:function(){var f=null;for(var i=0;i<D.length;i++) if(D[i].fork){f=D[i];break}return {dep:S.dep,bdep:S.bdep,kind:f&&f.kind,locked:f&&f.locked,z:S.z,scr:S.scr}},pedals:{gas:gas,brake:brake}};
  });
});

/* ============================================================================ S3 SKY NAVIGATION */
/* Real J2000 positions (RA deg, Dec deg). Projection: azimuthal equidistant about the north celestial pole, as seen facing north
   (east to the right). Angular distances from the pole are exact, so the Dipper's shape and the pointer-star line are true. */
var STARS={Dubhe:[165.932,61.751,1.8],Merak:[165.460,56.383,2.3],Phecda:[178.457,53.695,2.4],Megrez:[183.857,57.033,3.3],Alioth:[193.507,55.960,1.8],Mizar:[200.981,54.925,2.2],Alkaid:[206.885,49.313,1.9],
  Polaris:[37.954,89.264,2.0],Kochab:[222.676,74.156,2.1],Pherkad:[230.182,71.834,3.0],Yildun:[263.054,86.586,4.4],EpsUMi:[251.493,82.037,4.2],ZetaUMi:[236.015,77.795,4.3],EtaUMi:[244.376,75.755,5.0],
  Thuban:[211.097,64.376,3.7],Muscida:[127.566,60.718,3.4],TalithaUMa:[134.802,48.042,3.1],Tania:[154.274,42.915,3.0],Alula:[169.620,33.094,3.5]};
var DIPPER=["Dubhe","Merak","Phecda","Megrez","Alioth","Mizar","Alkaid"],DIPPER_LINES=[["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Megrez"],["Megrez","Dubhe"],["Megrez","Alioth"],["Alioth","Mizar"],["Mizar","Alkaid"]];
var LITTLE_LINES=[["Polaris","Yildun"],["Yildun","EpsUMi"],["EpsUMi","ZetaUMi"],["ZetaUMi","Kochab"],["Kochab","Pherkad"],["Pherkad","EtaUMi"],["EtaUMi","ZetaUMi"]];
function proj(ra,dec,lst){var r=90-dec,a=(ra-lst)*Math.PI/180;return {x:r*Math.sin(a),y:r*Math.cos(a)}} /* degrees; y up */
function sepDeg(a,b){var r=Math.PI/180,A=STARS[a],Bs=STARS[b];var c=Math.sin(A[1]*r)*Math.sin(Bs[1]*r)+Math.cos(A[1]*r)*Math.cos(Bs[1]*r)*Math.cos((A[0]-Bs[0])*r);return Math.acos(clamp(c,-1,1))/r}
/* sun for the shadow stick: equinox, latitude 23°N (Sahara, near the Tropic of Cancer). returns altitude + azimuth (deg from north, clockwise) */
function sunAt(h,lat){var r=Math.PI/180,H=(h-12)*15*r,phi=lat*r;var alt=Math.asin(Math.cos(phi)*Math.cos(H));var az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(phi))/r+180;return {alt:alt/r,az:(az+360)%360}}
reg("skynav",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",LAT=cfg.lat||23;
    var st={phase:"",lst:cfg.lst!=null?cfg.lst:120,spin:0,marks:[],found:[],compass:cfg.compassStart!=null?cfg.compassStart:130,done:false,wrong:0};
    var root=api.el("div","dsky");root.style.cssText="position:absolute;inset:0;z-index:2";host.appendChild(root);
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;touch-action:none";root.appendChild(cv);var ctx=cv.getContext("2d");
    var imDune=img(api,"bd_night"),imCamel=img(api,"animal_camel"),imDay=img(api,"bd_tent");
    var W=0,H=0,dpr=1,M={};
    /* deterministic faint background stars (seeded), kept away from the named stars so they never confuse the shape */
    var bg=[];(function(){var s=7;function rnd(){s=(s*16807)%2147483647;return s/2147483647}
      for(var i=0;i<520;i++){var s10=Math.sin(5*Math.PI/180),ra=rnd()*360,dec=Math.asin(s10+rnd()*(1-s10))*180/Math.PI;var mag=4.4+rnd()*2;
        var near=false;for(var k in STARS){if(Math.abs(STARS[k][1]-dec)<2.2&&sepDeg2(ra,dec,STARS[k][0],STARS[k][1])<2.2){near=true;break}}if(!near) bg.push([ra,dec,mag,rnd()])}})();
    function sepDeg2(ra1,d1,ra2,d2){var r=Math.PI/180,c=Math.sin(d1*r)*Math.sin(d2*r)+Math.cos(d1*r)*Math.cos(d2*r)*Math.cos((ra1-ra2)*r);return Math.acos(clamp(c,-1,1))/r}
    function size(){var r=host.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
      var b=box(api);M.b=b;M.hor=H*(b.port?.8:.84);  /* horizon line */
      /* fit: Polaris sits LAT degrees above the horizon; show up to ~44° above Polaris */
      /* fit every named star over the whole time-lapse into the free sky (between the caption and the horizon, clear of the edges) */
      var x0=1e9,x1=-1e9,y1=-1e9,y0=1e9,lap=cfg.lapseDeg||50;/* 10/10 item 11: ages 4-6 only trace the Dipper to Polaris, so zoom the sky to those stars (the bowl was ~40 px wide and the numbered targets overlapped) */
      var FIT=K?DIPPER.concat(["Polaris"]):null;for(var nm in STARS){if(STARS[nm][1]<45||(FIT&&FIT.indexOf(nm)<0)) continue;for(var sp=0;sp<=(K&&!st.kWide?0:lap);sp+=5){var q=proj(STARS[nm][0],STARS[nm][1],st.lst+sp);x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);y0=Math.min(y0,q.y)}}
      var mg=b.vw<900?30:b.side+20,avail=M.hor-b.top-34;M.s=Math.min(avail/(LAT+y1),(W-2*mg)/(x1-x0));M.px=W/2-(x0+x1)/2*M.s;M.py=M.hor-LAT*M.s;if(K){var top0=b.top+34+(b.ph?40:70),bot0=M.hor-50,av2=bot0-top0;M.s=Math.min(av2/((y1-y0)||1),(W-2*mg-60)/((x1-x0)||1));M.px=W/2-(x0+x1)/2*M.s;M.py=top0+y1*M.s}layoutUI();place()}
    function S2(name,spin){var a=STARS[name],p=proj(a[0],a[1],st.lst+(spin||st.spin));return {x:M.px+p.x*M.s,y:M.py-p.y*M.s}}
    /* ---------- star buttons (tap targets) */
    var stEl={},order=K?(cfg.kOrder||["Megrez","Phecda","Merak","Dubhe","Polaris"]):null;
    function mkStar(name,label){var b=api.el("button","ds-hit");b.type="button";b.setAttribute("aria-label",label||name);b.dataset.star=name;root.appendChild(b);stEl[name]=b;
      b.onclick=function(e){tapStar(resolveStar(name,e))};return b}
    /* stars close together have overlapping 84 px targets (ages 4-6): the star that is right to tap now wins, then the nearest */
    function rightNow(n){if(st.phase==="still") return n==="Polaris";if(st.phase!=="night") return false;if(K) return n===order[st.found.length];
      var need=st.found.indexOf("Merak")<0||st.found.indexOf("Dubhe")<0;return need?((n==="Merak"||n==="Dubhe")&&st.found.indexOf(n)<0):n==="Polaris"}
    function resolveStar(name,e){if(!e||e.clientX==null) return name;var cx=e.clientX,cy=e.clientY,c=[];
      for(var n in stEl){var r=stEl[n].getBoundingClientRect();if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom) c.push({n:n,d:Math.hypot(r.left+r.width/2-cx,r.top+r.height/2-cy)})}
      if(c.length<2) return name;var ok=K?c.filter(function(q){return rightNow(q.n)}):[];if(ok.length) return ok[0].n;c.sort(function(a,b){return a.d-b.d});return c[0].n}
    function place(){for(var n in stEl){var p=S2(n),z=K?84:58;var b=stEl[n];b.style.width=b.style.height=px(z);b.style.left=px(p.x-z/2);b.style.top=px(p.y-z/2)}}
    /* ---------- UI */
    var ff=btn(api,'<span class="ico">&#9193;</span> '+T(api,{k:"Speed up time",e:"Speed up time"}),"Speed up time");ff.style.cssText+=";position:absolute;z-index:7;display:none";root.appendChild(ff);
    var cmp=document.createElement("canvas");cmp.style.cssText="position:absolute;z-index:7;touch-action:none;display:none;cursor:grab;border-radius:50%";root.appendChild(cmp);
    var cl=btn(api,'<span class="ico">&#8634;</span>',"Turn the compass left"),cr=btn(api,'<span class="ico">&#8635;</span>',"Turn the compass right");var crow=api.el("div","ds-row");crow.appendChild(cl);crow.appendChild(cr);crow.style.display="none";root.appendChild(crow);
    var latRow=null;
    function layoutUI(){var b=M.b;var cs=Math.max(120,Math.min(b.ph?130:190,H*.24));cmp._s=cs;cmp.width=cmp.height=Math.round(cs*dpr);cmp.style.width=cmp.style.height=px(cs);
      var left=b.vw<900?12:b.side*.4;cmp.style.left=px(left);cmp.style.top=px(Math.min(M.hor-cs*.55,H-cs-12));crow.style.left=px(left+cs+10);crow.style.top=px(Math.min(M.hor-cs*.55,H-cs-12)+cs/2-(K?42:32));
      ff.style.left=px(W/2-90);ff.style.top=px(Math.min(H-(K?96:76),M.hor+12))}
    size();var onR=function(){size()};window.addEventListener("resize",onR);
    /* ---------- draw */
    var raf=0,last=performance.now(),trails=[];
    function frame(now){raf=requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000);last=now;if(!api.live()) return;
      if(st.spinning){var k=Math.min(1,(now-st.sp0)/st.spDur);st.spin=st.spFrom+(st.spTo-st.spFrom)*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);if(k>=1){st.spinning=false;st.onSpun&&st.onSpun()}place()}
      draw()}
    function star(c,x,y,mag,tw){var r=Math.max(.6,(5.4-mag)*1.15)*(M.s>9?1.15:1);var g=c.createRadialGradient(x,y,0,x,y,r*3.2);g.addColorStop(0,"rgba(255,252,240,"+(.95*tw)+")");g.addColorStop(.3,"rgba(255,246,220,"+(.5*tw)+")");g.addColorStop(1,"rgba(255,246,220,0)");c.fillStyle=g;c.beginPath();c.arc(x,y,r*3.2,0,7);c.fill()}
    function draw(){var c=ctx;c.setTransform(dpr,0,0,dpr,0,0);
      if(st.phase==="day"||st.phase==="dayN"){drawDay(c);return}
      var g=c.createLinearGradient(0,0,0,M.hor);g.addColorStop(0,"#02040e");g.addColorStop(.7,"#081332");g.addColorStop(1,"#1a2a55");c.fillStyle=g;c.fillRect(0,0,W,H);
      var t=performance.now()/1000;
      /* trails during the time-lapse: every star circles Polaris */
      if(st.spin!==0||st.spinning){c.lineWidth=1.2;for(var i=0;i<bg.length;i+=3){var a=bg[i];drawArc(c,a[0],a[1],"rgba(190,210,255,.18)")}DIPPER.concat(["Kochab","Pherkad"]).forEach(function(n){var a=STARS[n];drawArc(c,a[0],a[1],"rgba(255,240,190,.38)")})}
      bg.forEach(function(a){var p=proj(a[0],a[1],st.lst+st.spin),x=M.px+p.x*M.s,y=M.py-p.y*M.s;if(y<M.hor) star(c,x,y,a[2],.6+.4*Math.sin(t*1.3+a[3]*20))});
      /* constellation lines that have been traced */
      c.lineCap="round";st.lines&&st.lines.forEach(function(l){var A=S2(l[0]),Bp=S2(l[1]);c.strokeStyle="rgba(255,236,150,.85)";c.lineWidth=3;c.shadowColor="#ffe56a";c.shadowBlur=10;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(Bp.x,Bp.y);c.stroke();c.shadowBlur=0});
      if(st.pointer){var A=S2("Merak"),Bq=S2("Dubhe"),dx=Bq.x-A.x,dy=Bq.y-A.y,k=st.pointer;c.setLineDash([10,8]);c.strokeStyle="rgba(150,230,255,.9)";c.lineWidth=3;c.beginPath();c.moveTo(Bq.x,Bq.y);c.lineTo(Bq.x+dx*5.6*k,Bq.y+dy*5.6*k);c.stroke();c.setLineDash([])}
      for(var n in STARS){var a=STARS[n],p=S2(n);if(p.y>=M.hor) continue;star(c,p.x,p.y,a[2]-.5,1);
        if(K&&order&&order.indexOf(n)>=0){var idx=order.indexOf(n),done=st.found.indexOf(n)>=0,nx=st.found.length===idx;c.fillStyle=done?"#6af0ab":nx?"#ffe56a":"#ffffffcc";c.font="900 22px system-ui";c.textAlign="center";c.textBaseline="middle";
          c.beginPath();c.arc(p.x+26,p.y-24,15,0,7);c.fillStyle=done?"#1f7a46":nx?"#7a5a10":"#10243e";c.fill();c.fillStyle="#fff";c.fillText(String(idx+1),p.x+26,p.y-23);
          if(nx){c.strokeStyle="rgba(255,229,106,"+(.5+.5*Math.sin(t*5))+")";c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,24,0,7);c.stroke()}}}
      if(st.found.indexOf("Polaris")>=0){var pp=S2("Polaris");c.strokeStyle="rgba(150,230,255,"+(.6+.4*Math.sin(t*3))+")";c.lineWidth=3;c.beginPath();c.arc(pp.x,pp.y,30,0,7);c.stroke()}
      /* latitude arc (t): Polaris' height above the horizon */
      if(st.latArc){var pp2=S2("Polaris");c.strokeStyle="#9ef";c.lineWidth=2.5;c.setLineDash([6,5]);c.beginPath();c.moveTo(pp2.x,pp2.y);c.lineTo(pp2.x,M.hor);c.stroke();c.setLineDash([]);c.fillStyle="#9ef";c.font="900 16px system-ui";c.textAlign="left";c.fillText("? \u00B0",pp2.x+10,(pp2.y+M.hor)/2)}
      /* the dunes at the horizon (moonlit photo, bottom strip) */
      if(imDune.complete&&imDune.naturalWidth){var iw=imDune.naturalWidth,ih=imDune.naturalHeight,sc=W/iw,dh=ih*sc,srcY=ih*.52;c.drawImage(imDune,0,srcY,iw,ih-srcY,0,M.hor-12,W,(ih-srcY)*sc*Math.max(1,(H-M.hor+12)/((ih-srcY)*sc)))}
      else{c.fillStyle="#0e1426";c.fillRect(0,M.hor,W,H-M.hor)}
      /* the caravan: one camel walking north (toward the star) once the compass is set */
      if(st.camel){var cw=Math.max(110,Math.min(220,W*.2))*(1-st.camel*.55),ch=cw*imCamel.naturalHeight/(imCamel.naturalWidth||1);var cx=lerp(W*.7,M.px,st.camel),cy=lerp(H-12,M.hor+8,st.camel);c.globalAlpha=.92;if(imCamel.complete) c.drawImage(imCamel,cx-cw/2,cy-ch,cw,ch);c.globalAlpha=1}
      if(st.phase==="compass"&&band!=="t"&&cmp._s){var pq=S2("Polaris"),ccx=parseFloat(cmp.style.left)+cmp._s/2,ccy=parseFloat(cmp.style.top)+cmp._s/2;c.save();c.strokeStyle="#ffe56a99";c.lineWidth=3;c.setLineDash([8,8]);c.beginPath();c.moveTo(ccx,ccy);c.lineTo(pq.x,pq.y);c.stroke();c.restore()}
      drawCompass()}
    function drawArc(c,ra,dec,col){var r=(90-dec)*M.s,a0=(ra-st.lst)*Math.PI/180,a1=(ra-st.lst-st.spin)*Math.PI/180;c.strokeStyle=col;c.beginPath();var n=18;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;var x=M.px+r*Math.sin(a),y=M.py-r*Math.cos(a);if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke()}
    function drawCompass(){if(cmp.style.display==="none") return;var c=cmp.getContext("2d"),s=cmp._s,d=dpr;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,s,s);var r=s/2;
      c.fillStyle="#e9d3a6";c.beginPath();c.arc(r,r,r-2,0,7);c.fill();c.strokeStyle="#7a5a34";c.lineWidth=4;c.stroke();
      c.save();c.translate(r,r);c.rotate(st.compass*Math.PI/180);
      for(var i=0;i<16;i++){c.save();c.rotate(i*Math.PI/8);c.fillStyle=i%4===0?"#3b2412":"#7a5a34";c.beginPath();c.moveTo(0,-r*(i%4===0?.78:.5));c.lineTo(r*.08,0);c.lineTo(-r*.08,0);c.closePath();c.fill();c.restore()}
      c.fillStyle="#c0392b";c.beginPath();c.moveTo(0,-r*.8);c.lineTo(r*.11,-r*.1);c.lineTo(-r*.11,-r*.1);c.closePath();c.fill();
      c.fillStyle="#fff";c.font="900 "+Math.round(s*.14)+"px system-ui";c.textAlign="center";c.textBaseline="middle";c.fillText("N",0,-r*.56);c.restore();
      var ok=Math.abs(norm180(st.compass-cTarget()))<cTol();c.strokeStyle=ok?"#6af0ab":"#ffffff66";c.lineWidth=ok?6:3;c.beginPath();c.arc(r,r,r-3,0,7);c.stroke()}
    function norm180(a){return ((a%360)+540)%360-180}
    /* ---------- DAY: shadow stick (u, t) */
    var dayEl=null;
    function gpt(gx,gy){var b=M.b,cx=W*.5,cy=H*(b.port?.7:.68),s=Math.min(W,H)*.0042;return {x:cx+gx*s*60,y:cy-gy*s*60*.42}}
    function shadowTip(h){var s=sunAt(h,LAT),L=1/Math.tan(Math.max(4,s.alt)*Math.PI/180),dir=(s.az+180)*Math.PI/180;return {gx:Math.sin(dir)*L,gy:Math.cos(dir)*L,alt:s.alt,az:s.az}}
    function drawDay(c){if(imDay.complete&&imDay.naturalWidth){var iw=imDay.naturalWidth,ih=imDay.naturalHeight,sc=Math.max(W/iw,H/ih);c.drawImage(imDay,(W-iw*sc)/2,(H-ih*sc)/2,iw*sc,ih*sc)}else{c.fillStyle="#e8c48a";c.fillRect(0,0,W,H)}
      var base=gpt(0,0),hs=Math.min(W,H)*.2;
      if(st.stick){var tp=shadowTip(st.h),e=gpt(tp.gx,tp.gy);c.strokeStyle="rgba(60,35,15,.55)";c.lineWidth=7;c.lineCap="round";c.beginPath();c.moveTo(base.x,base.y);c.lineTo(e.x,e.y);c.stroke();
        c.strokeStyle="#5a3a1c";c.lineWidth=8;c.beginPath();c.moveTo(base.x,base.y);c.lineTo(base.x,base.y-hs);c.stroke();st.tipPx=e}
      st.marks.forEach(function(m,i){var p=gpt(m.gx,m.gy);c.fillStyle="#fff";c.beginPath();c.arc(p.x,p.y,9,0,7);c.fill();c.fillStyle="#c0392b";c.beginPath();c.arc(p.x,p.y,6,0,7);c.fill()});
      if(st.marks.length===2){var a=gpt(st.marks[0].gx,st.marks[0].gy),b=gpt(st.marks[1].gx,st.marks[1].gy),dx=b.x-a.x,dy=b.y-a.y;c.strokeStyle="#fff";c.lineWidth=3;c.setLineDash([10,6]);c.beginPath();c.moveTo(a.x-dx*1.5,a.y-dy*1.5);c.lineTo(b.x+dx*1.5,b.y+dy*1.5);c.stroke();c.setLineDash([]);
        c.fillStyle="#fff";c.font="900 18px system-ui";c.textAlign="center";c.fillText("W",a.x-dx*1.7,a.y-dy*1.7-12);c.fillText("E",b.x+dx*1.7,b.y+dy*1.7-12)}
      /* clock */
      c.fillStyle="#0009";c.fillRect(W/2-60,M.b.top+2,120,34);c.fillStyle="#fff";c.font="900 18px system-ui";c.textAlign="center";c.textBaseline="middle";var hh=Math.floor(st.h),mm=Math.round((st.h-hh)*60);c.fillText((hh>12?hh-12:hh)+":"+(mm<10?"0":"")+mm+(st.h>=12?" pm":" am"),W/2,M.b.top+19)}
    function startDay(){return new Promise(function(done){st.phase="day";st.h=cfg.dayStart||10;st.stick=false;
      var planted=api.el("button","ds-hit");planted.type="button";planted.setAttribute("aria-label","Plant the stick here");root.appendChild(planted);
      var base=gpt(0,0);planted.style.cssText+=";left:"+px(base.x-60)+";top:"+px(base.y-60)+";width:120px;height:120px;box-shadow:inset 0 0 0 4px #ffe56a99";planted.classList.add("ds-pulse");
      api.hint(cfg.hintStick);api.say(cfg.stickIntro,{after:"idle"});
      planted.onclick=function(){planted.remove();st.stick=true;api.sfx("thunk");api.burst(base.x,base.y,8,["\u2728"]);api.say(cfg.markIntro,{after:"idle"});api.hint(cfg.hintMark);markBtn()};
      function markBtn(){var tp=shadowTip(st.h),e=gpt(tp.gx,tp.gy);var m=api.el("button","ds-hit");m.type="button";m.setAttribute("aria-label","Mark the shadow tip");m.style.cssText+=";left:"+px(e.x-48)+";top:"+px(e.y-48)+";width:96px;height:96px;min-width:96px;min-height:96px";m.classList.add("ds-tipring");
        /* 10/10: the noon shadow-tip target must be easy to see: a bold pulsing ring + dot on the tip, 96px hit area */
        if(!document.getElementById("dsTipCss")){var cs=document.createElement("style");cs.id="dsTipCss";cs.textContent=".ds-tipring{border-radius:50%!important;background:radial-gradient(circle,#ffd23a 0 9px,#5a3a1c 9px 11px,rgba(255,210,58,.22) 11px 100%)!important;border:5px solid #ffd23a!important;box-shadow:0 0 0 3px rgba(90,58,28,.75),0 0 18px rgba(255,210,58,.9)!important;padding:0!important}.ds-tipring::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:4px solid #ffd23a;animation:dsTipP 1.3s ease-out infinite;pointer-events:none}@keyframes dsTipP{0%{transform:scale(.85);opacity:1}100%{transform:scale(1.45);opacity:0}}@media (prefers-reduced-motion:reduce){.ds-tipring::after{animation:none}}";document.head.appendChild(cs)}
        root.appendChild(m);
        m.onclick=function(){m.remove();st.marks.push({gx:tp.gx,gy:tp.gy,h:st.h});api.sfx("pop");
          if(st.marks.length===1){api.say(cfg.waitIntro,{after:"idle"});ff.style.display="inline-flex";ff.onclick=function(){ff.style.display="none";var h0=st.h,t0=performance.now();(function an(){var k=Math.min(1,(performance.now()-t0)/1800);st.h=h0+(cfg.dayStep||2)*k;if(k<1&&api.live()) requestAnimationFrame(an);else{api.say(cfg.markAgain,{after:"idle"});markBtn()}})()}}
          else{api.sfx("ok");api.say(cfg.lineDone,{after:"idle"}).then(function(){if(!api.live()) return;chooseNorth()})}}}
      function chooseNorth(){/* the line runs west-east; north is at right angles, on the side away from the sun (shadows point north at noon here) */
        var a=gpt(st.marks[0].gx,st.marks[0].gy),b=gpt(st.marks[1].gx,st.marks[1].gy),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        var dirs=[["N",0,-1],["S",0,1],["E",1,0],["W",-1,0]];var wrong=0;
        dirs.forEach(function(d){var q=api.el("button","ds-btn",'<span class="ico">'+({N:"&#11014;",S:"&#11015;",E:"&#10145;",W:"&#11013;"})[d[0]]+'</span>');q.type="button";q.setAttribute("aria-label",d[0]);q.style.cssText+=";position:absolute;z-index:9;left:"+px(mx+d[1]*130-34)+";top:"+px(my+d[2]*80-34);root.appendChild(q);
          q.onclick=function(){if(d[0]==="N"){api.sfx("ok");root.querySelectorAll(".ds-btn[aria-label]").forEach(function(x){if(x.getAttribute("aria-label").length===1) x.remove()});api.say(cfg.northOk,{state:"celebration",after:"idle"}).then(done)}
            else{wrong++;api.sfx("no");api.say(cfg.northHint,{state:"concern",after:"idle"})}}})}
    })}
    /* ---------- NIGHT: the stars */
    function startNight(){st.phase="night";api.hint(K?cfg.hintK:cfg.hintE);
      if(K){order.forEach(function(n,i){mkStar(n,"Star "+(i+1))});place();api.say(cfg.kIntro,{after:"idle"})}
      else{["Dubhe","Merak","Phecda","Megrez","Alioth","Mizar","Alkaid","Polaris","Kochab","Pherkad","Thuban","Muscida","Tania"].forEach(function(n){mkStar(n,{Tania:"Tania Borealis",Muscida:"Muscida"}[n])});place();api.say(cfg.eIntro,{after:"idle"})}}
    st.lines=[];
    function tapStar(n){if(!api.live()) return;
      if(st.phase==="still"){if(n==="Polaris"){api.sfx("ok");st.phase="";api.say(cfg.stillOk,{state:"celebration",after:"idle"}).then(function(){if(api.live()) startCompass()})}else{api.sfx("no");api.say(cfg.stillNo,{state:"concern",after:"idle"})}return}
      if(st.phase!=="night") return;
      if(K){var want=order[st.found.length];if(n!==want){api.sfx("no");api.say(cfg.kWrong,{after:"idle"});return}
        if(st.found.length) st.lines.push([order[st.found.length-1],n]);st.found.push(n);api.sfx("note",[392,440,523,587,659][st.found.length-1]);api.burst(api.rectOf(stEl[n]).cx,api.rectOf(stEl[n]).cy,8,["\u2728","\u2B50"]);
        if(st.found.length===order.length){api.say(cfg.kTraced,{state:"celebration",after:"idle"}).then(function(){if(api.live()) timeLapse()})}return}
      /* e/u/t: two pointer stars (any order), then follow the line to Polaris */
      var need=st.found.indexOf("Merak")<0||st.found.indexOf("Dubhe")<0;
      if(need){if(n==="Merak"||n==="Dubhe"){if(st.found.indexOf(n)<0){st.found.push(n);api.sfx("note",n==="Merak"?440:523);api.burst(api.rectOf(stEl[n]).cx,api.rectOf(stEl[n]).cy,8,["\u2728"])}
          if(st.found.indexOf("Merak")>=0&&st.found.indexOf("Dubhe")>=0){st.lines=DIPPER_LINES.slice();api.sfx("ok");api.say(cfg.pointersOk,{after:"idle"});var t0=performance.now();(function an(){st.pointer=Math.min(1,(performance.now()-t0)/1600);if(st.pointer<1&&api.live()) requestAnimationFrame(an)})()}}
        else{st.wrong++;api.sfx("no");api.say(DIPPER.indexOf(n)>=0?cfg.notPointer:cfg.notDipper,{state:"concern",after:"idle"});if(st.wrong>=2) [stEl.Merak,stEl.Dubhe].forEach(function(x){x.classList.add("ds-pulse")})}
        return}
      if(n==="Polaris"){st.found.push("Polaris");api.sfx("note",659);st.lines=st.lines.concat(LITTLE_LINES);api.say(cfg.polarisOk,{state:"celebration",after:"idle"}).then(function(){if(!api.live()) return;timeLapse()})}
      else{st.wrong++;api.sfx("no");api.say(cfg.followLine,{state:"concern",after:"idle"});if(st.wrong>=3) stEl.Polaris.classList.add("ds-pulse")}}
    function timeLapse(){if(K&&!st.kWide){var o={s:M.s,px:M.px,py:M.py};st.kWide=true;size();var n={s:M.s,px:M.px,py:M.py},t0=performance.now();(function zo(){var k=Math.min(1,(performance.now()-t0)/900);k=k*k*(3-2*k);M.s=o.s+(n.s-o.s)*k;M.px=o.px+(n.px-o.px)*k;M.py=o.py+(n.py-o.py)*k;place();if(k<1&&api.live()) requestAnimationFrame(zo)})()}
      st.phase="lapse";ff.style.display="inline-flex";api.hint(cfg.hintLapse);api.say(cfg.lapseIntro,{after:"idle"});
      ff.onclick=function(){ff.style.display="none";api.sfx("whoosh");st.spinning=true;st.sp0=performance.now();st.spDur=api.reduced()?600:4200;st.spFrom=st.spin;st.spTo=st.spin+(cfg.lapseDeg||50);
        st.onSpun=function(){st.onSpun=null;if(!api.live()) return;
          if(K){st.phase="still";["Dubhe","Merak","Alkaid","Mizar"].forEach(function(n){if(!stEl[n]) mkStar(n)});place();api.hint(cfg.hintStill);api.say(cfg.stillQ,{after:"idle"})}
          else api.say(cfg.lapseDone,{after:"idle"}).then(function(){if(!api.live()) return;if(band==="t") latitude();else startCompass()})}}}
    function latitude(){st.latArc=true;choose(api,cfg.latQ,[{label:{t:"About 23\u00B0 (we are near 23\u00B0 N)"},ok:true,say:cfg.latOk},{label:{t:"About 45\u00B0"},ok:false,say:cfg.latNo},{label:{t:"About 0\u00B0, on the horizon"},ok:false,say:cfg.latNo}]).then(function(){st.latArc=false;if(api.live()) startCompass()})}
    /* ---------- star compass */
    var cdrag=null;
    function cAng(e){var r=cmp.getBoundingClientRect();return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI}
    cmp.addEventListener("pointerdown",function(e){if(st.phase!=="compass") return;e.preventDefault();try{cmp.setPointerCapture(e.pointerId)}catch(_){}cdrag={a0:cAng(e),c0:st.compass,id:e.pointerId}});
    cmp.addEventListener("pointermove",function(e){if(!cdrag||cdrag.id!==e.pointerId) return;st.compass=cdrag.c0+(cAng(e)-cdrag.a0);if(Math.abs(norm180(st.compass-cTarget()))<cTol()*.5){cdrag=null;checkCompass()}});
    cmp.addEventListener("pointercancel",function(){if(!cdrag) return;cdrag=null;checkCompass()});
    /* N has to point AT the North Star as seen from the compass (the star is not straight above it); generous for young kids, then it snaps */
    function cTarget(){var p=S2("Polaris"),cs=cmp._s||150,cx=parseFloat(cmp.style.left)+cs/2,cy=parseFloat(cmp.style.top)+cs/2;return Math.atan2(p.x-cx,-(p.y-cy))*180/Math.PI}
    function cTol(){return {k:30,e:28,u:22,t:18}[band]||25}
    cmp.addEventListener("pointerup",function(){if(!cdrag) return;cdrag=null;checkCompass()});
    var cstep=15;cl.onclick=function(){st.compass-=cstep;api.sfx("click");checkCompass()};cr.onclick=function(){st.compass+=cstep;api.sfx("click");checkCompass()};
    cmp.tabIndex=0;cmp.setAttribute("role","slider");cmp.setAttribute("aria-label","Star compass");cmp.addEventListener("keydown",function(e){if(e.key==="ArrowLeft"){st.compass-=cstep;checkCompass()}if(e.key==="ArrowRight"){st.compass+=cstep;checkCompass()}});
    function startCompass(){st.phase="compass";for(var n in stEl){if(n!=="Polaris") stEl[n].style.pointerEvents="none"}cmp.style.display="block";crow.style.display="flex";api.hint(cfg.hintCompass);api.say(cfg.compassIntro,{after:"idle"})}
    function checkCompass(){if(st.phase!=="compass") return;if(Math.abs(norm180(st.compass-cTarget()))<cTol()){st.compass=cTarget();st.phase="walk";api.sfx("ok");crow.style.display="none";
      api.say(cfg.compassOk,{state:"celebration",after:"idle"});var t0=performance.now();(function an(){st.camel=Math.min(1,(performance.now()-t0)/(api.reduced()?300:3200));if(st.camel<1&&api.live()) requestAnimationFrame(an);else finish()})()}}
    async function finish(){if(st.done) return;st.done=true;api.sfx("win");await api.fact(1);if(!api.live()) return;
      var nx=btn(api,T(api,{k:"Done! \u25B6",e:"Done \u25B6"}),"Done");nx.style.cssText+=";position:absolute;z-index:9;left:50%;transform:translateX(-50%);bottom:14px;background:#1f7a46;border-color:#6af0ab";root.appendChild(nx);
      nx.onclick=function(){nx.remove();resolve({wrong:st.wrong})}}
    raf=requestAnimationFrame(frame);api.onEnd(function(){cancelAnimationFrame(raf);window.removeEventListener("resize",onR)});
    (async function(){if(band==="u"||band==="t"){await startDay();if(!api.live()) return;st.phase="";await api.say(cfg.toNight,{after:"idle"});if(!api.live()) return}
      startNight()})();
    host._sky={st:st,S2:S2,stars:stEl,sep:sepDeg,proj:proj,tap:tapStar,M:M,sunAt:sunAt,shadowTip:shadowTip,ff:ff,cmp:cmp,crow:crow,checkCompass:checkCompass,tgt:function(){return cTarget()},tol:function(){return cTol()}};
  });
});

/* ============================================================================ S4 NIGHT TRACKER */
var PRINTS={fennec:{pic:"print_fox",size:.9,gap:62,pair:false,side:9,name:"fennec fox"},
  jerboa:{pic:"print_jerboa",size:.9,gap:120,pair:true,side:0,name:"jerboa"},
  monitor:{pic:"print_lizard",size:1.15,gap:80,pair:false,side:0,drag:true,name:"desert monitor"},
  camel:{pic:"print_camel",size:1.35,gap:100,pair:false,side:16,name:"camel"}};
var ANIM={fennec:"animal_fennec",jerboa:"animal_jerboa",monitor:"animal_monitor",camel:"animal_camel"};
reg("tracks",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k";
    var plan=(cfg.trails&&api.pick(cfg.trails))||{k:[{who:"fennec"}],e:[{who:"jerboa",decoy:"fennec"},{who:"camel",decoy:"monitor"}],u:[{who:"jerboa",decoy:"fennec"},{who:"monitor",decoy:"camel"}],t:[{who:"jerboa",decoy:"fennec"},{who:"monitor",decoy:"camel"}]}[band];
    var st={trail:0,next:0,torch:{x:0,y:0},tx:0,ty:0,found:[],wrong:0,phase:"",prints:[]};
    var root=api.el("div","dtrk");root.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none;overflow:hidden";host.appendChild(root);
    /* floor = warm sand (seen in the torch) with the prints on it; a dark moonlit overlay with the torch cut out sits above */
    var floor=api.el("div","dtfloor");floor.style.cssText="position:absolute;left:0;right:0;bottom:0;background-size:cover;background-position:center;-webkit-mask-image:linear-gradient(transparent,#000 14%);mask-image:linear-gradient(transparent,#000 14%)";
    floor.style.backgroundImage="url("+api.url("sand_tex")+")";root.appendChild(floor);
    var prLayer=api.el("div","dtprints");prLayer.style.cssText="position:absolute;inset:0";floor.appendChild(prLayer);
    var dark=document.createElement("canvas");dark.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3";root.appendChild(dark);
    var hits=api.el("div","dthits");hits.style.cssText="position:absolute;inset:0;z-index:5;pointer-events:none";root.appendChild(hits);
    var guide=null;
    var W=0,H=0,dpr=1,F={};
    function size(){var r=host.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;dpr=1;last="";dark.width=Math.round(W*dpr);dark.height=Math.round(H*dpr);
      var b=box(api);F.b=b;F.top=Math.max(b.top+(b.ph?0:20),H*.3);floor.style.top=px(F.top-H*.06);F.ft=F.top-H*.06;F.u=Math.max(.62,Math.min(1.25,Math.min(W/1100,H/760)))*(K?1.12:1);
      if(st.prints.length) layoutTrail();layoutGuide()}
    /* ---------- trail geometry: a gentle S-curve across the floor; a fork splits it in two (e+) */
    function curve(t,bend,fork){var x0=(F.b.vw<900?24:F.b.side*.5),x1=W-(F.b.vw<900?130:F.b.side+20),y0=H-60,y1=F.top+40;
      var x=lerp(x0,x1,t),y=lerp(y0,y1,t)+Math.sin(t*Math.PI*2+bend)*Math.min(70,H*.07);
      if(fork&&t>.5){var k=(t-.5)/.5;y+=fork*k*k*Math.min(H*.22,170)}return {x:x,y:y}}
    function mkTrail(who,fork,t0,t1,bend,role){var P=PRINTS[who],u=F.u,len=0,pts=[],N=120;for(var i=0;i<=N;i++) pts.push(curve(lerp(t0,t1,i/N),bend,fork));
      var segs=[];for(var j=1;j<pts.length;j++){var d=Math.hypot(pts[j].x-pts[j-1].x,pts[j].y-pts[j-1].y);segs.push(d);len+=d}
      var gap=P.gap*u*(role&&role.fast?2.2:1),groups=[],at=gap*.5,side=1;
      function ptAt(s){var acc=0;for(var k=0;k<segs.length;k++){if(acc+segs[k]>=s){var f=(s-acc)/segs[k],a=pts[k],b=pts[k+1];return {x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f),ang:Math.atan2(b.y-a.y,b.x-a.x)}}acc+=segs[k]}var l=pts[pts.length-1],m=pts[pts.length-2];return {x:l.x,y:l.y,ang:Math.atan2(l.y-m.y,l.x-m.x)}}
      while(at<len-10){var p=ptAt(at);groups.push(p);at+=gap}
      return {who:who,P:P,groups:groups,role:role||{},fork:fork,end:ptAt(len)}}
    var trails=[];
    function layoutTrail(){/* rebuild prints for the current trail plan on resize */setupTrail(st.trail,true)}
    function clearPrints(){prLayer.innerHTML="";hits.innerHTML="";st.prints=[]}
    function addPrint(tr,g,gi,ti){var P=tr.P,sz=Math.round(64*P.size*F.u*(K?1.15:1));var els=[];
      function one(dx,dy){var im=document.createElement("img");im.src=api.url(P.pic);im.alt="";im.draggable=false;im.style.cssText="position:absolute;width:"+px(sz)+";height:"+px(sz)+";left:"+px(g.x+dx-sz/2)+";top:"+px(g.y-F.ft+dy-sz/2)+";transform:rotate("+(g.ang*180/Math.PI+90)+"deg);mix-blend-mode:multiply;opacity:.95;transition:transform .5s,opacity .5s";prLayer.appendChild(im);els.push(im)}
      var nx=-Math.sin(g.ang),ny=Math.cos(g.ang);
      if(P.pair){one(nx*sz*.22,ny*sz*.22);one(-nx*sz*.22,-ny*sz*.22)}
      else{var s=(gi%2?1:-1)*P.side*F.u;one(nx*s,ny*s)}
      if(P.drag&&gi>0){/* a monitor drags its tail: a wavy line between footprints */var pv=tr.groups[gi-1];var sv=document.createElementNS("http://www.w3.org/2000/svg","svg");sv.setAttribute("style","position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;mix-blend-mode:multiply;opacity:.55");
        sv.innerHTML='<path d="M'+pv.x+" "+(pv.y-F.ft)+" Q"+((pv.x+g.x)/2+6)+" "+((pv.y+g.y)/2-F.ft-6)+" "+g.x+" "+(g.y-F.ft)+'" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/>';prLayer.appendChild(sv)}
      var hb=api.el("button","ds-hit");hb.type="button";var hs=Math.max(K?96:64,sz*1.25);hb.style.cssText+=";left:"+px(g.x-hs/2)+";top:"+px(g.y-hs/2)+";width:"+px(hs)+";height:"+px(hs)+";pointer-events:auto";hb.setAttribute("aria-label",(tr.role.decoy?"Other ":"")+"print "+(gi+1));hits.appendChild(hb);
      var rec={tr:tr,ti:ti,gi:gi,els:els,hit:hb,x:g.x,y:g.y,done:false};st.prints.push(rec);/* count on pointerdown: a click is cancelled by the browser when a quick tap slides a few px, which dropped fast taps; click stays for keyboard */
      hb.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;e.preventDefault();rec._pd=performance.now();tapPrint(rec,e)});
      hb.onclick=function(e){if(rec._pd&&performance.now()-rec._pd<1500){rec._pd=0;return}if(!e.detail||!e.clientX){var r=hb.getBoundingClientRect();e={clientX:r.left+r.width/2,clientY:r.top+r.height/2}}tapPrint(rec,e)};return rec}
    function setupTrail(i,re){clearPrints();var pl=plan[i];if(!pl) return;trails=[];
      if(pl.decoy){var a=mkTrail(pl.who,i%2?-1:1,0,1,i*1.7,{}),b=mkTrail(pl.decoy,i%2?1:-1,.5,1,i*1.7,{decoy:true});
        /* the shared start: only the first half of the target trail (prints before the fork are the target's) */
        trails=[a,b];a.groups.forEach(function(g,gi){addPrint(a,g,gi,0)});b.groups.forEach(function(g,gi){if(gi>0) addPrint(b,g,gi,1)})}
      else{var c=mkTrail(pl.who,0,0,1,i*1.7,{});trails=[c];c.groups.forEach(function(g,gi){addPrint(c,g,gi,0)})}
      if(!re){st.next=0}else{st.prints.forEach(function(p){if(p.ti===0&&p.gi<st.next){p.done=true;mark(p,true)}})}
      if(K) glowNext()}
    var glow=null;
    function glowNext(){if(glow) glow.remove();var p=st.prints.filter(function(q){return q.ti===0&&q.gi===st.next})[0];if(!p) return;glow=api.el("div","ds-glow");var s=K?96:70;glow.style.cssText+=";left:"+px(p.x-s/2)+";top:"+px(p.y-s/2)+";width:"+px(s)+";height:"+px(s)+";z-index:4";root.appendChild(glow)}
    function mark(p,quiet){p.done=true;p.els.forEach(function(e){e.style.opacity=".7";e.style.transform+=" scale(.94)"});if(!quiet){var r=api.rectOf(p.hit);api.burst(r.cx,r.cy,5,["\u2728"])}}
    /* ---------- torch: follows a finger / mouse; a tap moves it there (no fine drag needed) */
    var tdown=null;
    root.addEventListener("pointerdown",function(e){if(e.target.closest&&e.target.closest(".ds-btn,.ds-opt,.ds-card")) return;tdown={id:e.pointerId};aim(e.clientX,e.clientY,false)});
    root.addEventListener("pointermove",function(e){if(e.pointerType==="mouse"||tdown&&tdown.id===e.pointerId) aim(e.clientX,e.clientY,e.pointerType!=="mouse")});
    root.addEventListener("pointerup",function(){tdown=null});
    function aim(x,y,direct){var r=host.getBoundingClientRect();st.tx=x-r.left;st.ty=y-r.top;if(direct){st.torch.x=st.tx;st.torch.y=st.ty}}
    function lit(p){return Math.hypot(p.x-st.torch.x,p.y-st.torch.y)<torchR()*1.05}
    function torchR(){return Math.max(K?150:115,Math.min(W,H)*(K?.22:.17))}
    function tapPrint(p,e){if(!api.live()||st.phase!=="follow") return;
      /* hit boxes can overlap where two trails meet: the print you need wins, then the nearest one */
      var cx=e.clientX,cy=e.clientY,inR=st.prints.filter(function(q){var r=q.hit.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom});
      var want=K?inR.filter(function(q){return q.ti===0&&q.gi===st.next})[0]:null;
      if(want) p=want;else if(inR.length>1){var hr=host.getBoundingClientRect();inR.sort(function(a,b){return Math.hypot(a.x+hr.left-cx,a.y+hr.top-cy)-Math.hypot(b.x+hr.left-cx,b.y+hr.top-cy)});p=inR[0]}
      /* the beam jumps straight to where you tap and the tap counts at once (fast taps are never dropped) */
      aim(e.clientX,e.clientY,true);
      if(p.tr.role.decoy){st.wrong++;api.sfx("no");var nm=PRINTS[p.tr.who].name,want=PRINTS[plan[st.trail].who].name;api.say(api.pick(cfg.decoy).replace("{x}",nm).replace("{y}",want),{state:"concern",after:"idle"});
        if(st.wrong>=2) showGuide(true);return}
      if(p.done) return;
      if(p.gi!==st.next){if(p.gi>st.next){api.say(cfg.skipAhead,{after:"idle"})}return}
      st.next++;mark(p);api.sfx("note",[392,440,494,523,587,659,698,784][Math.min(7,st.next%8)]);
      var tr=trails[0];if(K) glowNext();
      if(st.next===Math.ceil(tr.groups.length*.5)&&plan[st.trail].decoy){api.say(cfg.forkLine,{after:"idle"});showGuide(false)}
      if(st.next>=tr.groups.length) reveal(tr)}
    /* ---------- field guide (e+): the four print shapes */
    function layoutGuide(){if(!guide) return;var b=F.b;guide.style.left=px(b.vw<900?8:b.side*.3);guide.style.top=px(b.top+(b.ph?0:6))}
    function showGuide(pulse){if(K) return;if(!guide){guide=api.el("div","ds-card");guide.style.cssText+=";display:flex;gap:8px;padding:8px;z-index:8;max-width:calc(100vw - 30px);flex-wrap:wrap;pointer-events:none";var sm=innerWidth<600;/* a reference card only: taps go through it to the prints underneath */
        guide.innerHTML=["fennec","jerboa","monitor","camel"].map(function(k){return '<div style="display:flex;flex-direction:column;align-items:center;font-size:'+(sm?11:12)+'px;gap:2px;width:'+(sm?60:72)+'px"><img src="'+api.url(PRINTS[k].pic)+'" alt="" style="width:'+(sm?40:56)+'px;height:'+(sm?40:56)+'px;border-radius:50%;filter:brightness(1.05)"><span>'+api.esc(api.pick(cfg.guideNames)[k])+'</span></div>'}).join("");root.appendChild(guide);layoutGuide()}
      if(pulse){guide.classList.add("ds-pulse");setTimeout(function(){guide&&guide.classList.remove("ds-pulse")},2600)}}
    /* ---------- the animal: eyes shine in the beam first, then the reveal */
    async function reveal(tr){st.phase="reveal";if(glow){glow.remove();glow=null}var e=tr.end,who=tr.who,id=ANIM[who],a=api.asset(id);
      st.torch.x=st.tx=e.x;st.torch.y=st.ty=e.y-40;
      var eyes=api.el("div");eyes.style.cssText="position:absolute;z-index:6;left:"+px(e.x-22)+";top:"+px(e.y-70)+";width:44px;height:12px;pointer-events:none";eyes.innerHTML='<i style="position:absolute;left:0;width:12px;height:12px;border-radius:50%;background:#fff6b0;box-shadow:0 0 12px 4px #ffe56a"></i><i style="position:absolute;right:0;width:12px;height:12px;border-radius:50%;background:#fff6b0;box-shadow:0 0 12px 4px #ffe56a"></i>';root.appendChild(eyes);
      api.sfx("pop");await api.say(cfg.eyes,{after:"idle"});if(!api.live()) return;eyes.remove();
      var w=Math.min(W*.42,(who==="camel"?340:who==="monitor"?360:250)*F.u),h=a?w*a.h/a.w:w*.7;var im=img(api,id);im.style.cssText="position:absolute;z-index:6;left:"+px(clamp(e.x-w/2,8,W-w-8))+";top:"+px(clamp(e.y-h*.9,F.top-h*.3,H-h-8))+";width:"+px(w)+";opacity:0;transition:opacity .8s,transform .8s;transform:scale(.9);pointer-events:none;filter:drop-shadow(0 8px 10px #000a)";root.appendChild(im);
      requestAnimationFrame(function(){im.style.opacity="1";im.style.transform="none"});api.sfx("ok");api.burst(e.x,e.y-h/2,12,["\u2728","\u2B50"]);
      st.found.push(who);await api.say(api.pick(cfg.found)[who],{state:"celebration",after:"idle"});if(!api.live()) return;
      if((band==="u"||band==="t")&&st.trail===0){await strideRuler();if(!api.live()) return}
      st.trail++;
      if(st.trail<plan.length){await api.sleep(400);im.remove();setupTrail(st.trail);st.phase="follow";api.say(api.pick(cfg.nextTrail)[plan[st.trail].who],{after:"idle"});return}
      if(band==="t"){im.remove();await story();if(!api.live()) return}
      finish()}
    /* u+: stride ruler. Two jerboa trails: short hops (walking) and long leaps (racing away). Longer gap = faster. */
    async function strideRuler(){clearPrints();st.phase="ruler";
      var a=mkTrail("jerboa",0,0,1,.3,{}),b=mkTrail("jerboa",0,0,1,2.2,{fast:true});
      [[a,-1],[b,1]].forEach(function(z){z[0].groups.forEach(function(g){g.y+=z[1]*Math.min(90,H*.1)})});
      a.groups.forEach(function(g,gi){addPrint(a,g,gi,0)});b.groups.forEach(function(g,gi){addPrint(b,g,gi,1)});
      st.torch.x=W/2;st.torch.y=(F.top+H)/2;st.big=true;
      var i=await choose(api,cfg.rulerQ,[{label:{u:"Trail A: short gaps (about 20 cm)"},ok:false,say:cfg.rulerNo},{label:{u:"Trail B: long gaps (about 90 cm)"},ok:true,say:cfg.rulerOk}]);
      st.big=false;clearPrints()}
    /* t: a track story. The fox trail and the jerboa trail meet; the fox's steps get longer (it ran); the jerboa's leaps zig-zag and carry on. */
    async function story(){clearPrints();st.phase="story";var a=mkTrail("fennec",0,0,.72,1,{fast:true}),b=mkTrail("jerboa",0,.25,1,2.6,{fast:true});
      a.groups.forEach(function(g,gi){addPrint(a,g,gi,0)});b.groups.forEach(function(g,gi){g.x+=(gi%2?1:-1)*20;addPrint(b,g,gi,1)});st.big=true;st.torch.x=W*.6;st.torch.y=(F.top+H)/2;
      await choose(api,cfg.storyQ,[{label:{t:"The jerboa escaped: its leaps carry on after the fox's trail stops"},ok:true,say:cfg.storyOk},{label:{t:"The fox caught it: the trails end together"},ok:false,say:cfg.storyNo},{label:{t:"We can't tell anything from tracks"},ok:false,say:cfg.storyNo}]);st.big=false}
    async function finish(){st.phase="done";api.sfx("win");await api.fact(2);if(!api.live()) return;var nx=btn(api,T(api,{k:"Done! \u25B6",e:"Done \u25B6"}),"Done");nx.style.cssText+=";position:absolute;z-index:9;left:50%;transform:translateX(-50%);bottom:14px;background:#1f7a46;border-color:#6af0ab";root.appendChild(nx);nx.onclick=function(){nx.remove();resolve({found:st.found,wrong:st.wrong})}}
    /* ---------- render darkness + beam */
    var raf=0,last="";function frame(){raf=requestAnimationFrame(frame);if(!api.live()) return;st.torch.x+=(st.tx-st.torch.x)*.22;st.torch.y+=(st.ty-st.torch.y)*.22;
      /* 10/10 item 1: only repaint the darkness when the beam actually moved (a full-screen repaint every frame starved taps on phones) */
      var key=Math.round(st.torch.x*2)+","+Math.round(st.torch.y*2)+","+(st.big?1:0)+","+W+","+H;if(key===last) return;last=key;
      var c=dark.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.globalCompositeOperation="source-over";
      var g0=c.createLinearGradient(0,0,0,H);g0.addColorStop(0,"rgba(4,8,24,.0)");g0.addColorStop(Math.max(.01,(F.top-H*.08)/H),"rgba(4,8,24,.25)");g0.addColorStop(Math.min(.99,F.top/H+.04),"rgba(6,10,28,.86)");g0.addColorStop(1,"rgba(6,10,28,.9)");c.fillStyle=g0;c.fillRect(0,0,W,H);
      c.globalCompositeOperation="destination-out";var R0=st.big?Math.max(W,H):torchR(),tx=st.torch.x,ty=st.torch.y;if(st.big){c.fillStyle="rgba(0,0,0,.8)";c.fillRect(0,F.top,W,H)}else{var g=c.createRadialGradient(tx,ty,R0*.15,tx,ty,R0);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.6,"rgba(0,0,0,.85)");g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.beginPath();c.arc(tx,ty,R0,0,7);c.fill()}
      c.globalCompositeOperation="source-over";if(!st.big){var g2=c.createRadialGradient(tx,ty,0,tx,ty,R0);g2.addColorStop(0,"rgba(255,214,140,.16)");g2.addColorStop(1,"rgba(255,214,140,0)");c.fillStyle=g2;c.beginPath();c.arc(tx,ty,R0,0,7);c.fill()}}
    size();var onR=function(){size()};window.addEventListener("resize",onR);api.onEnd(function(){cancelAnimationFrame(raf);window.removeEventListener("resize",onR)});
    setupTrail(0);var f0=st.prints[0];st.tx=st.torch.x=f0?f0.x:W*.3;st.ty=st.torch.y=f0?f0.y-20:H*.7;st.phase="follow";raf=requestAnimationFrame(frame);
    api.hint(K?cfg.hintK:cfg.hintE);api.say(K?cfg.introK:api.pick(cfg.nextTrail)[plan[0].who],{after:"idle"});if(!K) showGuide(false);
    host._trk={st:st,plan:plan,prints:function(){return st.prints},trails:function(){return trails},tap:function(p){var r=api.rectOf(p.hit);tapPrint(p,{clientX:r.cx,clientY:r.cy})}};
  });
});
})();
