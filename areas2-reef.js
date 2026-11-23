/* Spark areas v2 — Reef "Reef Guardian" missions (plan §8.2).
   swim     : R1 snorkel survey — drag-to-swim (or tap a spot, or auto-swim for ages 4-6) along a transect tape, tap fish to tally on the dive slate, coral flinches if touched
   nursery  : R2 coral restoration — snip fragments, clip them on a coral tree, brush algae off the frame, time-lapse growth, outplant onto rubble
   boat     : R3 captain the research boat — throttle lever + wheel (ages 4-6: tap where to go), drift, chart colours, go-slow turtle zone, pick up a public mooring
   pairs    : R4 who helps whom — guide a potato cod to the cleaner wrasse, then connect partners (drag a line or tap-tap)
   reefsim  : R5 keep the reef in balance — choose actions, run 5 years; a marine heatwave arrives that no local action can stop
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
var CSS_DONE=!!document.getElementById("ds-css");
function css(){rcss();if(CSS_DONE||document.getElementById("ds-css")) return;CSS_DONE=true;var s=document.createElement("style");s.id="ds-css";s.textContent=[
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
"@keyframes rfSwimBob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-7px) rotate(-1.5deg)}}",
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
/* reef palette on top of the shared ds-* controls */
function rcss(){if(document.getElementById("rf-css")) return;var s=document.createElement("style");s.id="rf-css";s.textContent=[
".rf .ds-btn{background:#06324ee8;border-color:#5fe3d6}.rf .ds-btn:active,.rf .ds-btn.on{background:#0d6b7a;border-color:#fff}",
".rf .ds-card{background:#04263de8;border-color:#5fe3d699}",
".rf-slate{position:absolute;z-index:7;background:#f4f7f5;color:#12324a;border-radius:16px;border:3px solid #9fb8c4;padding:8px 10px;box-shadow:0 8px 20px #0007;font-weight:900;font-size:14px;display:flex;flex-direction:column;gap:4px}",
".rf-slate .row{display:flex;align-items:center;gap:6px}.rf-slate img{width:44px;height:28px;object-fit:contain}.rf-slate b{min-width:22px;text-align:right;font-size:17px}",
".rf-fish{position:absolute;z-index:4;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none}",
".rf-fish img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 6px 6px #0006)}",
".rf-fish.got img{filter:drop-shadow(0 0 10px #ffe56a) drop-shadow(0 6px 6px #0006)}",
".rf-card,.rf-bin{font-family:inherit;font-size:15px;line-height:1.15;text-align:center;-webkit-tap-highlight-color:transparent}.rf-card span{white-space:normal;overflow-wrap:normal;hyphens:auto;max-width:100%}.rf-card.sel{outline:4px solid #ffe56a;outline-offset:2px}"+
".rf-tag{position:absolute;left:50%;top:-6px;transform:translate(-50%,-100%);background:#1f7a46;color:#fff;border-radius:999px;padding:2px 8px;font:900 13px inherit;font-family:inherit;white-space:nowrap;pointer-events:none}",
".rf-coral{position:absolute;z-index:3;transition:transform .35s,filter .5s;transform-origin:50% 100%}",
".rf-coral.flinch{transform:scale(.9,.84);filter:saturate(.45) brightness(.92)}",
".rf-exp{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:#ffb020;color:#2a1600;font:900 11px inherit;font-family:inherit;letter-spacing:.4px;vertical-align:middle}",
".rf-act{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:150px;max-width:220px;min-height:76px;padding:8px 10px;border-radius:16px;border:3px solid #ffffff55;background:#ffffff14;color:#fff;font:800 13px/1.25 inherit;font-family:inherit;cursor:pointer;text-align:left}",
".rf-act b{font-size:15px}.rf-act.on{border-color:#6af0ab;background:#1f7a4699}.rf-act[disabled]{opacity:.45}",
".ar2-bk .rf-act{min-height:84px}"
].join("\n");document.head.appendChild(s)}
function snd(f,d,type,vol){var a=actx();if(!a) return;try{var o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.value=f;g.gain.value=vol||.06;o.connect(g);g.connect(a.destination);var t=a.currentTime;g.gain.setValueAtTime(vol||.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+(d||.15));o.start(t);o.stop(t+(d||.15)+.02)}catch(e){}}
function bubbles(api,x,y,n){api.burst(x,y,n||5,["\u25CB","\u25E6"])}

/* cover layer: a 16:9 photo that covers its box like object-fit:cover, with a child layer in photo coordinates (fx,fy 0..1) */
function coverLayer(api,id,o){o=o||{};var w=api.el("div");w.style.cssText="position:absolute;inset:0;overflow:hidden;container-type:size";
  var IW="max(100cqw,177.78cqh)",IH="max(100cqh,56.25cqw)",px0=o.posX==null?.5:o.posX;
  var inn=api.el("div","rf-cover");inn.style.cssText="position:absolute;width:"+IW+";height:"+IH+";left:calc((100cqw - "+IW+") * "+px0+");top:calc((100cqh - "+IH+") * .5)"+(o.flip?";transform:scaleX(-1)":"");
  inn.innerHTML='<img src="'+api.url(id)+'" alt="" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;display:block">';w.appendChild(inn);
  w.setPos=function(p){inn.style.left="calc((100cqw - "+IW+") * "+p+")"};return {wrap:w,inner:inn}}
/* algae tufts growing on the bommie in bd_clean (photo coordinates) */
var BOMMIE=[[.66,.56],[.75,.40],[.85,.43],[.71,.76],[.86,.68],[.93,.58]];
function fishEl(api,id,w,minH){var a=api.asset(id),d=api.el("div","rf-fish");d.style.width=px(w);d.style.height=px(Math.max(minH||0,a?w*a.h/a.w:w*.6));d.appendChild(img(api,id));return d}

/* ============================================================================ R1 SNORKEL SURVEY */
var FISH={clown:{pic:"animal_clownfish",w:.085,name:"Clownfish"},tang:{pic:"animal_bluetang",w:.095,name:"Blue tang"},parrot:{pic:"animal_parrotfish",w:.13,name:"Parrotfish"},
  wrasse:{pic:"animal_wrasse",w:.2,name:"Maori wrasse"},turtle:{pic:"animal_turtle",w:.22,name:"Green turtle"}};
reg("swim",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",UT=band==="u"||band==="t";
    var root=api.el("div","rf rswim");root.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none;overflow:hidden";host.appendChild(root);
    var st={site:0,tally:[{},{}],touched:0,phase:"swim",fish:[],still:0,turtleShown:false,sx:0,sy:0,tx:0,ty:0,auto:K,dir:1,done:false,lastMove:Date.now()};
    var names=api.pick(cfg.names)||{};function nm(k){return names[k]||FISH[k].name}
    var W=0,H=0,F={};
    /* tape + corals */
    var tape=api.el("div");tape.style.cssText="position:absolute;z-index:2;height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,#ffe14d 0 28px,#2b2b2b 28px 34px);box-shadow:0 2px 6px #0007;pointer-events:none";root.appendChild(tape);
    var corals=[];
    function mkCorals(){corals.forEach(function(c){c.el.remove()});corals=[];
      var set=st.site===0?[["prop_staghorn",.1],["prop_braincoral",.32],["prop_platecoral",.55],["prop_staghorn",.78]]:[["prop_braincoral",.4]];
      set.forEach(function(s){var a=api.asset(s[0]),e=img(api,s[0]);e.className="rf-coral";root.appendChild(e);corals.push({el:e,id:s[0],x:s[1],ar:a?a.w/a.h:1,last:0,said:false})});layoutCorals()}
    function layoutCorals(){corals.forEach(function(c){var h=Math.min(H*.2,170),w=h*c.ar;c.w=w;c.h=h;c.l=F.x0+(F.x1-F.x0)*c.x-w/2;c.t=F.tapeY-h*.75;c.el.style.cssText+=";left:"+px(c.l)+";top:"+px(c.t)+";width:"+px(w)+";height:"+px(h)})}
    /* the swimmer: mask icon + view ring (the fish you can count) */
    var me=api.el("div");me.style.cssText="position:absolute;z-index:6;pointer-events:none;border-radius:50%;border:3px dashed #ffffffaa;box-shadow:0 0 0 2px #0004";root.appendChild(me);
    var mask=img(api,"gear_mask");mask.style.cssText="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:"+(K?"58%":"72px")+";filter:drop-shadow(0 4px 6px #0008)";me.appendChild(mask);
    function viewR(){return K?9999:Math.max(130,Math.min(W,H)*.3)}
    /* dive slate */
    var slate=api.el("div","rf-slate");root.appendChild(slate);
    function want(){return K?["clown"]:band==="e"?["clown","tang","parrot","wrasse","turtle"]:["clown","tang","parrot","wrasse"]}
    function drawSlate(){var t=st.tally[st.site],rows=want().map(function(k){return '<div class="row"><img src="'+api.url(FISH[k].pic)+'" alt=""><span style="flex:1">'+api.esc(nm(k))+'</span><b>'+(t[k]||0)+(K&&k==="clown"?"/3":"")+'</b></div>'}).join("");
      slate.innerHTML='<div style="font-size:12px;opacity:.7">'+api.esc(api.pick(cfg.slateTitle)+(UT?" \u00B7 "+(st.site?"B":"A"):""))+'</div>'+rows+(st.touched?'<div class="row" style="color:#b0402a;font-size:12px">'+api.esc(api.pick(cfg.touchedLabel))+' '+st.touched+'</div>':"")}
    function size(){var r=host.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;var b=box(api);F.b=b;F.top=b.top;F.x0=b.vw<900?14:b.side*.4;F.x1=W-(b.vw<900?130:b.side);F.tapeY=H-Math.max(60,H*.1);
      tape.style.left=px(F.x0);tape.style.width=px(F.x1-F.x0);tape.style.top=px(F.tapeY);layoutCorals();
      var s=K?100:84;me.style.width=me.style.height=px(K?s:Math.min(viewR()*2,320));me.style.borderStyle=K?"solid":"dashed";
      slate.style.left=px(F.x0);slate.style.top=px(b.top+(b.ph?0:4));if(b.ph||b.port&&W<500){slate.style.transform="scale(.85)";slate.style.transformOrigin="0 0"}else slate.style.transform="";
      if(!st.sx){st.sx=st.tx=F.x0+60;st.sy=st.ty=F.top+(F.tapeY-F.top)*.55}}
    /* fish: cross the scene in lanes; tap to count (once each) */
    function spawn(kind){var f=FISH[kind],w=Math.max(K?96:70,Math.min(W,1400)*f.w*(K?1.15:1)),el=fishEl(api,f.pic,w,K?80:0),dir=Math.random()<.5?1:-1,lane=R(.08,.62);
      if(kind==="turtle") lane=R(.05,.25);
      var hgt=parseFloat(el.style.height);if(hgt<76){el.style.padding=px((76-hgt)/2)+" 0";}
      el.style.left="0px";el.style.top="0px";el.style.willChange="transform";el.style.transform=dir<0?"scaleX(-1)":"";el.setAttribute("role","button");el.setAttribute("aria-label",nm(kind));el.tabIndex=0;
      root.appendChild(el);var o={kind:kind,el:el,w:w,dir:dir,x:dir>0?-w:W+w,y:F.top+(F.tapeY-F.top-80)*lane+40,v:(W+2*w)/(K?R(kind==="turtle"?30:26,kind==="turtle"?36:34):band==="e"?R(kind==="turtle"?24:14,kind==="turtle"?30:21):R(kind==="turtle"?22:11,kind==="turtle"?28:18))/60,got:false,wob:R(0,6)};
      el.addEventListener("pointerdown",function(e){e.stopPropagation();e.preventDefault();count(o)});el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();count(o)}});
      st.fish.push(o);return o}
    function pool(){if(st.site===1) return ["tang","clown","tang","clown"];return K?["clown","clown","tang","parrot","clown","wrasse"]:["clown","tang","parrot","wrasse","tang","clown","parrot"]}
    var nextSpawn=0;
    function count(o){if(!api.live()||st.phase!=="swim") return;
      if(o.got){api.say(api.pick(cfg.again),{after:"idle"});return}
      var d=Math.hypot(o.x-st.sx,o.y-st.sy);if(d>viewR()+o.w*.4){api.sfx("no");api.say(api.pick(cfg.closer),{after:"idle"});return}
      o.got=true;o.el.classList.add("got");var tg=api.el("span","rf-tag",api.esc(nm(o.kind)));o.el.appendChild(tg);if(o.dir<0) tg.style.transform="translate(-50%,-100%) scaleX(-1)";
      var t=st.tally[st.site];t[o.kind]=(t[o.kind]||0)+1;snd(660+60*(t[o.kind]%5),.12,"triangle");api.sfx("pop");var r=api.rectOf(o.el);api.burst(r.cx,r.cy,4,["\u2728"]);drawSlate();
      var line=api.pick(cfg.counted);if(line&&typeof line==="object") line=line[o.kind];if(line) api.say(line,{after:"idle"});
      check()}
    function goalMet(){var t=st.tally[st.site];
      if(K) return (t.clown||0)>=3;
      if(band==="e") return want().every(function(k){return t[k]>=1});
      if(st.site===0){var tot=0,sp=0;for(var k in t){tot+=t[k];sp++}return tot>=8&&sp>=3}
      var tb=0;for(var k2 in t) tb+=t[k2];return tb>=3}
    async function check(){if(!goalMet()||st.phase!=="swim") return;st.phase="talk";await api.sleep(600);if(!api.live()) return;
      if(UT&&st.site===0){await api.say(cfg.siteB,{after:"idle"});if(!api.live()) return;st.site=1;api.setBd({a:"bd_rubble"});st.fish.forEach(function(f){f.el.remove()});st.fish=[];mkCorals();drawSlate();st.phase="swim";api.hint(cfg.hintB);return}
      st.phase="check";st.fish.forEach(function(f){f.el.style.pointerEvents="none"});
      if(band==="e"){var t=st.tally[0],ks=want().filter(function(k){return t[k]}),mx=Math.max.apply(null,ks.map(function(k){return t[k]}));
        await choose(api,cfg.mostQ,ks.map(function(k){return {html:barHtml(k,t[k],mx),label:{e:nm(k)},ok:t[k]===mx,say:t[k]===mx?cfg.mostOk:cfg.mostNo}}))}
      if(UT){showChart();await choose(api,cfg.compareQ,[{label:cfg.siteALabel,ok:true,say:cfg.compareOk},{label:cfg.siteBLabel,ok:false,say:cfg.compareNo}]);
        if(band==="t") await choose(api,cfg.healthQ,[{label:{t:"Not healthy: very few fish, no parrotfish, mostly broken rubble"},ok:true,say:cfg.healthOk},{label:{t:"Healthy: the water is clear and blue"},ok:false,say:cfg.healthNo},{label:{t:"We can't say anything from counts"},ok:false,say:cfg.healthNo}])}
      finish()}
    function barHtml(k,n,mx){return '<div style="display:flex;align-items:flex-end;gap:6px;height:70px"><img src="'+api.url(FISH[k].pic)+'" alt="" style="width:56px;height:36px;object-fit:contain"><div style="width:22px;height:'+Math.round(16+50*n/mx)+'px;background:#6ab7ff;border-radius:4px 4px 0 0"></div><b>'+n+'</b></div>'}
    function showChart(){var a=st.tally[0],b2=st.tally[1];var ks=["clown","tang","parrot","wrasse"],mx=1;ks.forEach(function(k){mx=Math.max(mx,a[k]||0,b2[k]||0)});
      slate.innerHTML='<div style="font-size:12px;opacity:.7">'+api.esc(api.pick(cfg.chartTitle))+'</div>'+ks.map(function(k){return '<div class="row"><img src="'+api.url(FISH[k].pic)+'" alt=""><span style="display:inline-block;height:10px;width:'+Math.round(4+60*(a[k]||0)/mx)+'px;background:#2f9be0;border-radius:3px"></span><b>'+(a[k]||0)+'</b><span style="display:inline-block;height:10px;width:'+Math.round(4+60*(b2[k]||0)/mx)+'px;background:#c4793a;border-radius:3px;margin-left:6px"></span><b>'+(b2[k]||0)+'</b></div>'}).join("")+'<div style="font-size:11px"><span style="color:#2f9be0">\u25A0 A</span> <span style="color:#c4793a">\u25A0 B</span></div>'}
    async function finish(){st.phase="done";api.sfx("win");await api.fact(2);if(!api.live()) return;var nx=btn(api,T(api,{k:"Done! \u25B6",e:"Done \u25B6"}),"Done");nx.style.cssText+=";position:absolute;z-index:9;left:50%;transform:translateX(-50%);bottom:14px;background:#1f7a46;border-color:#6af0ab";root.appendChild(nx);nx.onclick=function(){nx.remove();resolve({tally:st.tally,touched:st.touched})}}
    /* swimming: drag (finger leads), tap a spot (swim there), arrows; band k swims by itself along the tape */
    var drag=null;
    root.addEventListener("pointerdown",function(e){if(e.target.closest&&e.target.closest(".ds-btn,.ds-opt,.ds-card,.rf-fish,.rf-slate")) return;
      /* 10/10 item 4: a tap NEAR a fish counts it (ages 4-6 get a big zone; it moves, so the finger lands a little behind) */
      if(st.phase==="swim"){var hr=host.getBoundingClientRect(),x=e.clientX-hr.left,y=e.clientY-hr.top,best=null,bd=1e9;
        st.fish.forEach(function(o){if(o.got) return;var d=Math.hypot(o.x-x,(o.cy||o.y)-y),lim=o.w*.5+(K?60:24);if(d<lim&&d<bd){bd=d;best=o}});
        if(best){e.preventDefault();count(best);return}}
      if(K) return;drag=e.pointerId;aim(e)});
    root.addEventListener("pointermove",function(e){if(drag===e.pointerId) aim(e)});
    root.addEventListener("pointerup",function(){drag=null});
    function aim(e){var r=host.getBoundingClientRect();st.tx=clamp(e.clientX-r.left,F.x0,F.x1);st.ty=clamp(e.clientY-r.top,F.top+30,F.tapeY+10);st.lastMove=Date.now()}
    function onKey(e){if(K) return;var d=60,m={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key];if(m){st.tx=clamp(st.sx+m[0],F.x0,F.x1);st.ty=clamp(st.sy+m[1],F.top+30,F.tapeY+10);st.lastMove=Date.now();e.preventDefault()}}
    window.addEventListener("keydown",onKey);
    var raf=0,last=performance.now();
    function frame(now){raf=requestAnimationFrame(frame);if(!api.live()) return;var dt=Math.min(50,now-last)/16.67;last=now;
      if(st.auto&&st.phase==="swim"){st.tx+=st.dir*1.4*dt;if(st.tx>F.x1-60){st.dir=-1}if(st.tx<F.x0+60){st.dir=1}st.ty=F.top+(F.tapeY-F.top)*.45+Math.sin(now/1600)*20}
      var px0=st.sx,py0=st.sy;st.sx+=(st.tx-st.sx)*.06*dt;st.sy+=(st.ty-st.sy)*.06*dt;var moving=Math.hypot(st.sx-px0,st.sy-py0)>.6;
      var ms=parseFloat(me.style.width)||100;me.style.left=px(st.sx-ms/2);me.style.top=px(st.sy-ms/2);
      if(moving&&Math.random()<.06*dt) bubbles(api,host.getBoundingClientRect().left+st.sx,host.getBoundingClientRect().top+st.sy-20,1);
      /* touching coral: it flinches (polyps pull in); Spark reminds; no score loss */
      corals.forEach(function(c){var inC=st.sx>c.l+c.w*.15&&st.sx<c.l+c.w*.85&&st.sy>c.t+c.h*.2;if(inC&&now-c.last>1800){c.last=now;c.el.classList.add("flinch");setTimeout(function(){c.el.classList.remove("flinch")},1500);st.touched++;drawSlate();api.sfx("no");if(!c.said||st.touched<3){c.said=true;api.say(api.pick(cfg.touch),{state:"concern",after:"idle"})}st.ty=Math.min(st.ty,c.t);}});
      /* stay still 3 s and a turtle glides past (a gift, never required) */
      if(!K&&!st.turtleShown&&st.phase==="swim"&&Date.now()-st.lastMove>3000&&st.site===0){st.turtleShown=true;spawn("turtle");api.say(api.pick(cfg.turtle),{after:"idle"})}
      if(st.phase==="swim"&&now>nextSpawn&&st.fish.length<(st.site?2:5)){var p=pool(),tl=st.tally[st.site],miss=st.site?[]:want().filter(function(k){return k!=="turtle"&&!tl[k]&&!st.fish.some(function(f){return f.kind===k&&!f.got})});spawn(miss.length&&Math.random()<.6?miss[Math.floor(Math.random()*miss.length)]:p[Math.floor(Math.random()*p.length)]);nextSpawn=now+(st.site?4200:1500)+Math.random()*1200}
      if(band==="e"&&st.phase==="swim"&&!st.tally[0].turtle&&!st.fish.some(function(f){return f.kind==="turtle"})&&Math.random()<.002*dt) spawn("turtle");
      st.fish=st.fish.filter(function(o){o.x+=o.dir*o.v*dt*(st.phase==="swim"?1:.3);var y=o.y+Math.sin(now/700+o.wob)*6;if(o.h==null) o.h=parseFloat(o.el.style.height)||o.w*.5;o.el.style.transform="translate3d("+(o.x-o.w/2).toFixed(1)+"px,"+(y-o.h/2).toFixed(1)+"px,0)"+(o.dir<0?" scaleX(-1)":"");o.cy=y;
        if(o.x<-o.w*1.2||o.x>W+o.w*1.2){o.el.remove();return false}return true})}
    size();mkCorals();drawSlate();var onR=function(){size()};window.addEventListener("resize",onR);
    api.onEnd(function(){cancelAnimationFrame(raf);window.removeEventListener("resize",onR);window.removeEventListener("keydown",onKey)});
    for(var i=0;i<3;i++){var o=spawn(pool()[i]);o.x=W*(.25+.25*i)}
    raf=requestAnimationFrame(frame);api.hint(K?cfg.hintK:cfg.hintE);
    host._swim={st:st,fish:function(){return st.fish},count:count,goTo:function(x,y){st.tx=x;st.ty=y;st.lastMove=Date.now()},corals:function(){return corals}};
  });
});

/* ============================================================================ R2 CORAL RESTORATION */
reg("nursery",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",UT=band==="u"||band==="t";
    var root=api.el("div","rf rnurs");root.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none;overflow:hidden";host.appendChild(root);
    var st={phase:"snip",frags:[],slots:[],algae:[],month:0,planted:0,mix:{b:0,m:0}},W=0,H=0,F={};
    function size(){var r=host.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;F.b=box(api);F.top=F.b.top;F.bot=H-F.b.bot;F.x0=F.b.vw<900?10:F.b.side*.5;F.x1=W-(F.b.vw<900?120:F.b.side);if(lay[st.phase]) lay[st.phase]()}
    var lay={};var stage=api.el("div");stage.style.cssText="position:absolute;inset:0";root.appendChild(stage);
    function clear(){stage.innerHTML=""}
    var tray=api.el("div","ds-row");tray.style.cssText+=";left:50%;transform:translateX(-50%);bottom:10px;background:#04263dcc;border:2px solid #5fe3d655;border-radius:18px;padding:6px 10px;min-height:84px;align-items:center";root.appendChild(tray);
    function hitBtn(x,y,s,label){var b=api.el("button","ds-hit");b.type="button";b.style.cssText+=";left:"+px(x-s/2)+";top:"+px(y-s/2)+";width:"+px(s)+";height:"+px(s);b.setAttribute("aria-label",label);stage.appendChild(b);return b}
    function glowAt(x,y,s){var g=api.el("div","ds-glow");g.style.cssText+=";left:"+px(x-s/2)+";top:"+px(y-s/2)+";width:"+px(s)+";height:"+px(s);stage.appendChild(g);return g}
    function fragImg(bleached,grown){var i=img(api,grown==="boulder"?"prop_braincoral":"prop_staghorn");i.style.cssText="width:100%;height:100%;object-fit:contain;pointer-events:none;filter:"+(bleached?"saturate(0) brightness(1.75) contrast(.8)":"drop-shadow(0 4px 6px #0007)");return i}
    var S=function(){return K?96:80};
    /* ---- 1. snip fragments from a broken colony (healthy only: bleached pieces are weak) */
    var tips=[];
    lay.snip=function(){clear();var cw=Math.min(W*.5,520),ch=cw*.95,cx=W/2,cy=Math.min(F.bot-140-ch/2,F.top+(F.bot-F.top-140)/2+20);cy=Math.max(cy,F.top+ch/2);
      var col=img(api,"prop_staghorn");col.style.cssText="position:absolute;left:"+px(cx-cw/2)+";top:"+px(cy-ch/2)+";width:"+px(cw)+";height:"+px(ch)+";object-fit:contain;transform:rotate(-12deg);filter:drop-shadow(0 10px 10px #0008)";stage.appendChild(col);
      var pos=[[-.36,-.3],[.34,-.34],[-.05,-.44],[.42,.05],[-.42,.08],[.1,-.1]];
      tips.forEach(function(t){if(t.el) t.el.remove()});var old=tips;tips=[];
      var n=K?3:6;for(var i=0;i<n;i++){(function(i){var p=pos[i],x=cx+p[0]*cw,y=cy+p[1]*ch,bl=!K&&(i===1||i===4),prev=old[i];if(prev&&prev.cut) {tips.push(prev);return}
        var s=S(),f=api.el("div");f.style.cssText="position:absolute;left:"+px(x-s*.4)+";top:"+px(y-s*.4)+";width:"+px(s*.8)+";height:"+px(s*.8)+";pointer-events:none";f.appendChild(fragImg(bl));stage.appendChild(f);
        var g=K?glowAt(x,y,s):null,b=hitBtn(x,y,s,(bl?"Bleached":"Healthy")+" fragment "+(i+1));var t={i:i,x:x,y:y,bl:bl,el:f,g:g,cut:false};tips.push(t);b.onclick=function(){snip(t,b)}})(i)}};
    function snip(t,b){if(!api.live()||st.phase!=="snip"||t.cut) return;
      if(t.bl){api.sfx("no");api.say(api.pick(cfg.bleachedPick),{state:"concern",after:"idle"});return}
      t.cut=true;b.remove();if(t.g) t.g.remove();snd(1200,.05,"square",.05);api.sfx("pop");var r=api.rectOf(t.el);api.burst(r.cx,r.cy,4,["\u2728"]);t.el.style.display="none";
      var fr={id:st.frags.length,el:null,slot:-1};st.frags.push(fr);var d=api.el("div","ar2-item");d.style.cssText="width:"+px(S())+";height:"+px(S())+";display:flex;align-items:center;justify-content:center;border-radius:14px;background:#ffffff1a";d.appendChild(fragImg(false));d.dataset.id="f"+fr.id;fr.el=d;tray.appendChild(d);
      var need=K?3:4;api.say(api.pick(cfg.snipped),{after:"idle"});
      if(st.frags.length>=need){st.phase="busy";setTimeout(toTree,700)}}
    /* ---- 2. clip them on the coral tree */
    var treeBox=null;
    function toTree(){if(!api.live()) return;api.setBd({a:"bd_nursery"});st.phase="clip";api.hint(K?cfg.hintClipK:cfg.hintClip);api.say(cfg.clipIntro,{after:"idle"});lay.clip();
      st.frags.forEach(function(fr){if(K){fr.el.onclick=function(){if(st.phase!=="clip"||fr.slot>=0) return;var s=st.slots.filter(function(q){return !q.f})[0];if(s) clipTo(fr,s)}}
        else api.drag(fr.el,{ok:function(){return api.live()&&st.phase==="clip"&&fr.slot<0},drop:function(x,y){var s=slotAt(x,y);if(!s||s.f) return false;clipTo(fr,s);return true}})})}
    lay.clip=lay.tend=lay.grow=function(){clear();var th=Math.min(F.bot-F.top-110,H*.62),tw=th*.75,tx=W/2-tw/2,ty=F.top+8;treeBox={l:tx,t:ty,w:tw,h:th};
      var tr=img(api,"prop_tree");tr.style.cssText="position:absolute;left:"+px(tx)+";top:"+px(ty)+";width:"+px(tw)+";height:"+px(th)+";object-fit:contain;filter:drop-shadow(0 8px 10px #0007)";stage.appendChild(tr);
      var sp=[[.22,.33],[.78,.33],[.22,.68],[.78,.68]];var a=api.asset("prop_tree"),ar=a?a.w/a.h:.75,iw=Math.min(tw,th*ar),ih=iw/ar,ox=tx+(tw-iw)/2,oy=ty+(th-ih)/2;
      if(!st.slots.length) sp.forEach(function(p,i){st.slots.push({i:i,f:null,rx:p[0],ry:p[1]})});
      st.slots.forEach(function(s){s.x=ox+s.rx*iw;s.y=oy+s.ry*ih;var sz=S();if(!s.f&&st.phase==="clip"){s.g=glowAt(s.x,s.y,sz)}if(s.f){placeOn(s.f,s)}});
      if(st.phase==="tend") drawAlgae();if(st.phase==="grow") growUI()};
    function slotAt(x,y){var hr=host.getBoundingClientRect(),best=null,bd=1e9;st.slots.forEach(function(s){var d=Math.hypot(x-hr.left-s.x,y-hr.top-s.y);if(d<Math.max(70,S())&&d<bd){bd=d;best=s}});return best}
    function placeOn(fr,s){if(!fr.hang){fr.hang=api.el("div");fr.hang.style.cssText="position:absolute;pointer-events:none;transform-origin:50% 0;transition:transform .6s";fr.hang.appendChild(fragImg(false));}
      var sz=K?70:60;fr.hang.style.left=px(s.x-sz/2);fr.hang.style.top=px(s.y);fr.hang.style.width=fr.hang.style.height=px(sz);fr.hang.style.transform="scale("+(1+st.month*.13)+")";stage.appendChild(fr.hang)}
    function clipTo(fr,s){s.f=fr;fr.slot=s.i;if(s.g){s.g.remove();s.g=null}fr.el.remove();placeOn(fr,s);snd(900,.06,"square",.05);api.sfx("ok");
      if(st.frags.every(function(f){return f.slot>=0})){st.phase="busy";api.say(api.pick(cfg.clipped),{state:"celebration",after:"idle"}).then(toTend)}}
    /* ---- 3. tend: brush algae off the FRAME (not the coral), check the water temperature */
    function toTend(){if(!api.live()) return;st.phase="tend";var pos=[[.5,.12],[.5,.48],[.32,.31],[.68,.66],[.5,.84]];
      st.algae=pos.map(function(p,i){return {rx:p[0],ry:p[1],a:1,coral:false}});if(!K){var f=st.slots[1];st.algae.push({slot:1,a:1,coral:true})}
      lay.tend();api.hint(K?cfg.hintTendK:cfg.hintTend);api.say(cfg.tendIntro,{after:"idle"})}
    function drawAlgae(){st.algae.forEach(function(g,i){if(g.a<=0) return;var x,y;if(g.coral){var s=st.slots[g.slot];x=s.x;y=s.y+30}else{x=treeBox.l+treeBox.w*g.rx;y=treeBox.t+treeBox.h*g.ry}
      var s2=Math.max(K?76:40,Math.min(S(),treeBox.h*.2)),e=api.el("button","ds-hit");e.type="button";e.style.cssText+=";left:"+px(x-s2/2)+";top:"+px(y-s2/2)+";width:"+px(s2)+";height:"+px(s2)+";z-index:"+(g.coral?9:10)+";border-radius:50%;background:url('"+api.url("prop_algae")+"') center/contain no-repeat;border:0;opacity:"+g.a;e.setAttribute("aria-label",g.coral?"Algae on a coral":"Algae on the frame");stage.appendChild(e);g.el=e;
      var rub=function(){brush(g)};e.addEventListener("click",rub)})}
    /* 10/10 item 3: scrubbing works with a mouse drag and a finger drag. Moves are hit-tested by position on the whole stage
       (a finger's pointermove stays on the first element it touched, and a mouse drag over a button never reached the next blob). */
    var scrub=null;
    function algaeAt(x,y){var best=null,bd=1e9;(st.algae||[]).forEach(function(g){if(g.a<=0||!g.el||!g.el.isConnected) return;var r=api.rectOf(g.el),d=Math.hypot(x-r.cx,y-r.cy);if(d<r.w*.6+14&&d<bd){bd=d;best=g}});return best}
    var sDown=function(e){if(st.phase!=="tend"||(e.pointerType==="mouse"&&e.button!==0)) return;scrub={x:e.clientX,y:e.clientY,id:e.pointerId};var g=algaeAt(e.clientX,e.clientY);if(g){e.preventDefault();brush(g,.34)}};
    var sMove=function(e){if(!scrub||scrub.id!==e.pointerId||st.phase!=="tend") return;var d=Math.hypot(e.clientX-scrub.x,e.clientY-scrub.y);if(d<5) return;scrub.x=e.clientX;scrub.y=e.clientY;var g=algaeAt(e.clientX,e.clientY);if(g){e.preventDefault();brush(g,Math.min(.5,.12+d/80))}};
    var sUp=function(e){if(scrub&&scrub.id===e.pointerId) scrub=null};
    host.addEventListener("pointerdown",sDown,true);window.addEventListener("pointermove",sMove,{passive:false});window.addEventListener("pointerup",sUp);window.addEventListener("pointercancel",sUp);
    api.onEnd(function(){host.removeEventListener("pointerdown",sDown,true);window.removeEventListener("pointermove",sMove);window.removeEventListener("pointerup",sUp);window.removeEventListener("pointercancel",sUp)});
    var lastBrush=0;
    function brush(g,amt){if(!api.live()||st.phase!=="tend"||g.a<=0) return;var now=Date.now();
      if(g.coral){if(now-lastBrush>1500){lastBrush=now;api.sfx("no");api.say(api.pick(cfg.notCoral),{state:"concern",after:"idle"})}return}
      g.a-=amt||1;snd(300+Math.random()*80,.05,"sawtooth",.02);if(g.a<=0){var gr=api.rectOf(g.el);g.el.remove();api.burst(gr.cx,gr.cy,3,["\u2728"])}else g.el.style.opacity=g.a;
      if(st.algae.every(function(q){return q.coral||q.a<=0})){st.phase="busy";api.sfx("ok");
        st.algae.forEach(function(q){if(q.coral&&q.el){q.el.style.transition="opacity 1.2s";q.el.style.opacity=0}});
        tempCheck()}}
    async function tempCheck(){await api.say(api.pick(cfg.cleanOk),{after:"idle"});if(!api.live()) return;
      var t=btn(api,'<span class="ico">\uD83C\uDF21\uFE0F</span>'+api.esc(T(api,cfg.tempBtn)),"Check the water temperature");t.style.cssText+=";position:absolute;z-index:8;left:"+px(F.x0)+";top:"+px(F.top+10);root.appendChild(t);t.classList.add("ds-pulse");api.hint(cfg.hintTemp);
      await new Promise(function(r){t.onclick=r});t.remove();api.sfx("ok");await api.say(api.pick(cfg.tempOk),{after:"idle"});if(!api.live()) return;toGrow()}
    /* ---- 4. time-lapse growth: drag the months slider (or tap Grow) */
    var gui=null;
    function toGrow(){st.phase="grow";lay.grow();api.hint(K?cfg.hintGrowK:cfg.hintGrow);api.say(cfg.growIntro,{after:"idle"})}
    var fishIn=[];
    function growUI(){if(gui) gui.remove();gui=api.el("div");gui.style.cssText="position:absolute;z-index:8;left:"+px(F.x0)+";right:"+px(Math.max(W-F.x1,F.b&&F.b.vw<900?130:150))+";bottom:12px;display:flex;align-items:center;gap:12px";root.appendChild(gui);
      var sl=api.el("div","ds-slider");sl.style.cssText+=";position:relative;flex:1;min-width:120px";sl.innerHTML='<div class="tr" style="background:linear-gradient(90deg,#5fe3d6,#2f9be0)"></div><div class="th">\uD83E\uDEB8</div>';gui.appendChild(sl);
      var lb=api.el("div","ds-chip");lb.style.minWidth="110px";gui.appendChild(lb);
      var gb=btn(api,T(api,cfg.growBtn),"Grow one month");gui.appendChild(gb);
      function setM(m){m=clamp(Math.round(m),0,12);if(m===st.month) return;st.month=m;sl.querySelector(".th").style.left=(m/12*100)+"%";lb.textContent=T(api,cfg.monthsLabel).replace("{n}",m);
        st.frags.forEach(function(f){if(f.hang) f.hang.style.transform="scale("+(1+m*.13)+")"});snd(500+m*30,.06,"triangle",.04);
        [[4,"animal_bluetang",.25],[8,"animal_cleaner",.7]].forEach(function(q,i){if(m>=q[0]&&!fishIn[i]){var e=fishEl(api,q[1],K?110:90,K?80:0);e.style.left=px(treeBox.l+treeBox.w*q[2]-45);e.style.top=px(treeBox.t+treeBox.h*(.45+.2*i));e.style.pointerEvents="none";e.style.transition="transform 1.2s";e.style.animation="dsBob 2.2s ease-in-out infinite";stage.appendChild(e);fishIn[i]=e;api.say(api.pick(cfg.fishCame)[i],{after:"idle"})}});
        if(m>=12) grown()}
      sl.querySelector(".th").style.left=(st.month/12*100)+"%";lb.textContent=T(api,cfg.monthsLabel).replace("{n}",st.month);
      var dn=false;function fromX(e){var r=sl.getBoundingClientRect();setM((e.clientX-r.left)/r.width*12)}
      sl.addEventListener("pointerdown",function(e){if(st.phase!=="grow") return;dn=true;try{sl.setPointerCapture(e.pointerId)}catch(_){}fromX(e)});sl.addEventListener("pointermove",function(e){if(dn&&st.phase==="grow") fromX(e)});sl.addEventListener("pointerup",function(){dn=false});
      gb.onclick=function(){if(st.phase==="grow") setM(st.month+(K?2:1))}}
    async function grown(){if(st.phase!=="grow") return;st.phase="busy";api.sfx("win");await api.say(api.pick(cfg.grownLine),{state:"celebration",after:"idle"});if(!api.live()) return;
      if(gui){gui.remove();gui=null}if(K){finish();return}toPlant()}
    /* ---- 5. outplant onto the rubble (u/t: mix branching + boulder; t: budget + heat risk) */
    async function toPlant(){if(band==="t"){var i=await choose(api,cfg.budgetQ,[{label:{t:"2 heat-tolerant + 2 regular ($90)"},ok:true,say:cfg.budgetOk},{label:{t:"4 heat-tolerant ($120)"},ok:false,say:cfg.budgetOver},{label:{t:"6 regular ($90)"},ok:false,say:cfg.budgetRisk}]);if(!api.live()) return}
      api.setBd({a:"bd_rubble"});st.phase="plant";clear();tray.innerHTML="";api.hint(UT?cfg.hintPlantU:cfg.hintPlant);api.say(UT?cfg.plantIntroU:cfg.plantIntro,{after:"idle"});
      var spots=[[.2,.62],[.4,.7],[.6,.64],[.8,.72],[.5,.52]].slice(0,4);var items=[];
      var kinds=UT?["branch","branch","boulder","boulder"]:["branch","branch","branch","branch"];
      kinds.forEach(function(k,i){var d=api.el("div","ar2-item");d.style.cssText="width:"+px(S())+";height:"+px(S())+";display:flex;align-items:center;justify-content:center;border-radius:14px;background:#ffffff1a";d.appendChild(fragImg(false,k==="boulder"?"boulder":"branch"));d.dataset.k=k;d.setAttribute("aria-label",k==="boulder"?"Boulder coral":"Branching coral");tray.appendChild(d);items.push(d)});
      var spotEls=spots.map(function(p,i){var x=F.x0+(F.x1-F.x0)*p[0],y=F.top+(F.bot-110-F.top)*p[1]+40;var g=glowAt(x,y,S()+10);g.style.border="4px dashed #ffe56a";g.style.borderRadius="50%";g.style.background="radial-gradient(circle,#ffe56a55,#ffe56a10 70%)";g.style.boxShadow="0 0 18px #ffe56acc";return {x:x,y:y,g:g,used:false}});
      items.forEach(function(d){api.drag(d,{ok:function(){return api.live()&&st.phase==="plant"&&!d._used},drop:function(x,y){var hr=host.getBoundingClientRect(),sp=null,bd=1e9;spotEls.forEach(function(s){var dd=Math.hypot(x-hr.left-s.x,y-hr.top-s.y);if(!s.used&&dd<Math.max(80,S())&&dd<bd){bd=dd;sp=s}});if(!sp) return false;
        if(UT&&d.dataset.k==="branch"&&st.mix.b>=2){api.say(api.pick(cfg.mixHint),{after:"idle"});return false}
        sp.used=true;d._used=true;d.style.visibility="hidden";sp.g.remove();var pl=api.el("div");var sz=d.dataset.k==="boulder"?S()*1.1:S()*1.4;pl.style.cssText="position:absolute;left:"+px(sp.x-sz/2)+";top:"+px(sp.y-sz*.7)+";width:"+px(sz)+";height:"+px(sz);pl.appendChild(fragImg(false,d.dataset.k==="boulder"?"boulder":"branch"));stage.appendChild(pl);
        st.planted++;st.mix[d.dataset.k==="boulder"?"m":"b"]++;api.sfx("ok");snd(700,.08,"triangle");api.burst(hr.left+sp.x,hr.top+sp.y,5,["\u2728"]);
        if(st.planted>=kinds.length){st.phase="busy";var e=fishEl(api,"animal_bluetang",90);e.style.cssText+=";left:"+px(W*.3)+";top:"+px(F.top+60)+";pointer-events:none;animation:dsBob 2.4s ease-in-out infinite";stage.appendChild(e);api.say(api.pick(UT?cfg.plantedU:cfg.planted),{state:"celebration",after:"idle"}).then(finish)}
        return true}})})}
    async function finish(){st.phase="done";tray.style.display="none";api.sfx("win");await api.fact(2);if(!api.live()) return;var nx=btn(api,T(api,{k:"Done! \u25B6",e:"Done \u25B6"}),"Done");nx.style.cssText+=";position:absolute;z-index:9;left:50%;transform:translateX(-50%);bottom:14px;background:#1f7a46;border-color:#6af0ab";root.appendChild(nx);nx.onclick=function(){nx.remove();resolve({planted:st.planted})}}
    size();lay.snip();var onR=function(){size()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    api.hint(K?cfg.hintSnipK:cfg.hintSnip);
    host._nurs={st:st,tips:function(){return tips},slots:function(){return st.slots},frags:function(){return st.frags}};
  });
});
/* ============================================================================ R3 CAPTAIN THE RESEARCH BOAT */
reg("boat",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",UT=band==="u"||band==="t";
    var root=api.el("div","rf rboat");root.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none;overflow:hidden";host.appendChild(root);
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%";root.appendChild(cv);var c=cv.getContext("2d");
    var imBoat=img(api,"prop_boat"),imBuoy=img(api,"prop_buoy"),imTurt=img(api,"animal_turtle");
    var W=0,H=0,dpr=1,L={};
    /* world in screen px; rebuilt on resize. reefs = circles (shallow coral), zone = go-slow turtle area, buoy = public mooring */
    var PH_CTRL=96+8+48;var S={x:0,y:0,h:0,v:0,thr:0,steer:0,tgt:null,bumps:0,fastZone:0,inZone:false,warned:false,moored:false,fuel:1,t:0,wind:{x:0,y:0},shifted:false,done:false,started:false,near:false};
    var VMAX=K?70:120,SLOW=K?70:45;
    function layout(){var b=box(api);W=host.clientWidth;H=host.clientHeight;dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
      var P=b.vw<600&&!b.ph,top=b.top+(b.ph?40:56),bot=H-(b.ph?96:150),lft=b.vw<900?14:b.side*.4,rgt=W-(b.vw<900?130:b.side+20);
      /* phones: Spark only sits at the bottom, so the map uses the full width; the controls get their own band at the bottom and the legend its own band at the top */
      if(P){top=b.top+(K?16:40);bot=H-(K?120:Math.max(10,b.bot)+PH_CTRL+8);rgt=W-14}
      L={top:top,bot:bot,lft:lft,rgt:rgt,u:Math.min(rgt-lft,bot-top)};var u=L.u,cx=(lft+rgt)/2,cy=(top+bot)/2,sx=(rgt-lft)/2,sy=(bot-top)/2;
      L.start={x:lft+sx*.18,y:bot-sy*(P&&!K?.3:.18)};/* phones: start clear of the fuel/speed chips */L.buoy={x:rgt-sx*.2,y:top+sy*.22};
      L.reefs=(K?/* ages 4-6: an open channel from the start to the buoy, reefs to the sides */[[cx-sx*.55,cy-sy*.1,u*.1],[cx+sx*.15,cy+sy*.52,u*.09],[cx+sx*.62,cy+sy*.2,u*.08],[cx-sx*.1,cy-sy*.58,u*.09]]:[[cx-sx*.25,cy+sy*.05,u*.11],[cx+sx*.12,cy+sy*.38,u*.09],[cx+sx*.05,cy-sy*.42,u*.1],[cx+sx*.55,cy+sy*.25,u*.08],[cx-sx*.62,cy-sy*.38,u*.09]]).map(function(r){return {x:r[0],y:r[1],r:r[2]*(P&&!K?.8:1)}});/* phones: slightly smaller reefs so the channel is not narrower than on a tablet */
      L.zone={x:(L.buoy.x+cx)/2+sx*.05,y:(L.buoy.y+cy)/2,r:u*.15};
      if(!S.started){S.x=L.start.x;S.y=L.start.y;S.h=45}
      layoutUI()}
    /* ---------- controls */
    var ui=api.el("div");ui.style.cssText="position:absolute;inset:0;z-index:6;pointer-events:none";root.appendChild(ui);
    var thrBox=null,wheel=null,stL=null,stR=null,moorB=null,legend=null,fuelEl=null,speedEl=api.el("div","ds-chip");speedEl.style.cssText+=";position:absolute;left:50%;transform:translateX(-50%);pointer-events:none";ui.appendChild(speedEl);
    var levels=api.pick(cfg.throttleLabels)||["Stop","Slow","Fast"];
    if(!K){
      thrBox=api.el("div","rf-thr");thrBox.style.cssText="position:absolute;display:flex;flex-direction:column;gap:8px;pointer-events:auto";
      [2,1,0].forEach(function(l){var b=btn(api,'<span>'+api.esc(levels[l])+'</span>',"Throttle: "+levels[l]);b.dataset.l=l;b.style.cssText+=";min-width:96px;min-height:56px";b.onclick=function(){setThr(l)};thrBox.appendChild(b)});ui.appendChild(thrBox);
      wheel=document.createElement("canvas");wheel.style.cssText="position:absolute;touch-action:none;pointer-events:auto;cursor:grab;border-radius:50%";wheel.setAttribute("aria-label","Ship's wheel");ui.appendChild(wheel);
      stL=btn(api,'<span class="ico">&#9664;</span>',"Steer left");stR=btn(api,'<span class="ico">&#9654;</span>',"Steer right");[stL,stR].forEach(function(b){b.style.cssText+=";position:absolute;pointer-events:auto;border-radius:50%";ui.appendChild(b)});
      holdBtn(stL,function(v){S.steer=v?-1:(S.steer===-1?0:S.steer)});holdBtn(stR,function(v){S.steer=v?1:(S.steer===1?0:S.steer)});
      var wDrag=null,wAng=0,wa=function(e){var r=wheel.getBoundingClientRect();return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI};
      wheel.addEventListener("pointerdown",function(e){e.preventDefault();try{wheel.setPointerCapture(e.pointerId)}catch(_){}wDrag={a0:wa(e),w0:wAng,id:e.pointerId}});
      wheel.addEventListener("pointermove",function(e){if(!wDrag||wDrag.id!==e.pointerId) return;var d=wa(e)-wDrag.a0;d=((d+540)%360)-180;wAng=clamp(wDrag.w0+d,-150,150);S.steer=wAng/150});
      ["pointerup","pointercancel","lostpointercapture"].forEach(function(t){wheel.addEventListener(t,function(){if(!wDrag) return;wDrag=null;wAng=0;S.steer=0})});
      S.wheelAng=function(){return wDrag?wAng:S.steer*150};
      legend=api.el("div","ds-card");legend.style.cssText+=";position:absolute;pointer-events:none;padding:8px 10px;font-size:13px;display:flex;flex-direction:column;gap:4px";
      var lg=api.pick(cfg.legend)||{};legend.innerHTML=[["#0b3d7a",lg.deep||"Deep water"],["#4fd1d9",lg.shallow||"Shallow"],["#b9774a",lg.reef||"Reef: keep off"],["#ffd84a",lg.zone||"Go slow: turtles"]].map(function(q){var sh={"#0b3d7a":lg.deepShort||"Deep","#4fd1d9":lg.shallowShort||"Shallow","#b9774a":lg.reefShort||"Reef","#ffd84a":lg.zoneShort?String(lg.zoneShort).charAt(0)+String(lg.zoneShort).slice(1).toLowerCase():"Go slow"}[q[0]];return '<div data-short="'+api.esc(sh)+'" style="display:flex;align-items:center;gap:6px;white-space:nowrap"><i style="width:14px;height:14px;border-radius:4px;background:'+q[0]+';display:inline-block;flex:none"></i><span>'+api.esc(q[1])+'</span></div>'}).join("");ui.appendChild(legend);
      if(band==="t"){fuelEl=api.el("div","ds-chip");fuelEl.style.cssText+=";position:absolute;pointer-events:none";ui.appendChild(fuelEl)}
    }
    moorB=btn(api,'<span class="ico rf-buoyico"><img src="'+api.url("prop_buoy")+'" alt="" style="height:1.6em;width:auto;vertical-align:middle"><svg viewBox="0 0 24 24" width="1.3em" height="1.3em" style="vertical-align:middle;margin-left:-4px" aria-hidden="true"><path d="M2 18c4-6 8 2 12-4s6-6 8-10" fill="none" stroke="#e8d3a2" stroke-width="2.6" stroke-linecap="round"/></svg></span><span>'+api.esc(api.pick(cfg.moorBtn)||"Pick up the mooring")+'</span>',"Pick up the mooring");moorB.style.cssText+=";position:absolute;pointer-events:auto;display:none;min-height:"+(K?"96px":"64px");ui.appendChild(moorB);
    /* 10/10 item 8: picking up the mooring ties a rope from the bow to the buoy; the boat settles bow-to-buoy (it never swings round backwards) */
    moorB.onclick=function(){if(S.moored) return;S.moored=true;S.v=0;S.thr=0;S.tgt=null;api.sfx("ok");moorB.style.display="none";var r=api.rectOf(moorB);api.burst(r.cx,r.cy,12);
      var hb=Math.atan2(L.buoy.x-S.x,-(L.buoy.y-S.y))*180/Math.PI,dh=((hb-S.h+540)%360)-180;dh=clamp(dh,-70,70);
      S.moor={t0:performance.now(),h0:S.h,h1:S.h+dh,x0:S.x,y0:S.y,len:Math.max(46,L.u*.085)*1.1};finish()};
    function setThr(l){S.thr=l;S.started=true;actx();api.sfx("click");if(thrBox) [].forEach.call(thrBox.children,function(b){b.classList.toggle("on",+b.dataset.l===l)})}
    function layoutUI(){var b=box(api),bot=Math.max(10,b.bot),P=b.vw<600&&!b.ph;
      if(P&&thrBox){/* phone controls: throttle row on top, then [left] wheel [right] centred and clear of Spark on the right */
        var ws=96,sw=60,gap=8,sparkR=104,avail=b.vw-sparkR-10,tot=sw+gap+ws+gap+sw,x0=Math.max(10,10+(avail-10-tot)/2);
        wheel._s=ws;wheel.width=wheel.height=Math.round(ws*dpr);wheel.style.width=wheel.style.height=px(ws);wheel.style.right="";wheel.style.left=px(x0+sw+gap);wheel.style.bottom=px(bot);
        stL.style.right="";stR.style.right="";stL.style.left=px(x0);stR.style.left=px(x0+sw+gap+ws+gap);[stL,stR].forEach(function(x){x.style.width=x.style.height=sw+"px";x.style.bottom=px(bot+ws/2-sw/2)});
        thrBox.style.flexDirection="row";thrBox.style.left=px(10);thrBox.style.bottom=px(bot+ws+8);[].forEach.call(thrBox.children,function(x){x.style.minWidth="78px";x.style.minHeight="48px"});
        legend.style.display="flex";legend.style.flexDirection="row";legend.style.flexWrap="nowrap";legend.style.justifyContent="space-between";legend.style.gap="6px";legend.style.padding="4px 8px";legend.style.fontSize="11px";legend.style.left=px(10);legend.style.right=px(10);legend.style.top=px(b.top+2);[].forEach.call(legend.querySelectorAll("[data-short]"),function(d){d.querySelector("span").textContent=d.dataset.short});
        speedEl.style.top="";speedEl.style.left="";speedEl.style.transform="";speedEl.style.right=px(10);speedEl.style.bottom=px(bot+ws+8+56);
        if(fuelEl){fuelEl.style.right="";fuelEl.style.left=px(10);fuelEl.style.top="";fuelEl.style.bottom=px(bot+ws+8+56)}
        moorB.style.left="50%";moorB.style.transform="translateX(-50%)";moorB.style.bottom=px(bot+(K?10:PH_CTRL+20));return}
      speedEl.style.top=px(b.top+(b.ph?4:10));
      if(thrBox){thrBox.style.left=px(b.vw<900?10:b.side*.3);thrBox.style.bottom=px(bot);
        var ws=Math.min(150,Math.max(96,H*.18));wheel._s=ws;wheel.width=wheel.height=Math.round(ws*dpr);wheel.style.width=wheel.style.height=px(ws);
        var wr=b.vw<900?130:b.side+20;wheel.style.right=px(wr+66);wheel.style.bottom=px(bot);stL.style.right=px(wr+66+ws+8);stR.style.right=px(wr);[stL,stR].forEach(function(x){x.style.width=x.style.height="60px";x.style.bottom=px(bot+ws/2-30)});
        legend.style.left=px(b.vw<900?10:b.side*.3);legend.style.top=px(b.top+(b.ph?4:10));if(b.ph) legend.style.display="none";else legend.style.display="flex"}
      if(fuelEl){fuelEl.style.right=px(b.vw<900?10:b.side);fuelEl.style.top=px(b.top+(b.ph?4:10))}
      moorB.style.left="50%";moorB.style.transform="translateX(-50%)";moorB.style.bottom=px(bot+(K?10:4))}
    /* k: tap the water where the boat should go (one finger, nothing timed) */
    cv.addEventListener("pointerdown",function(e){var r=host.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(!K) return;S.tgt={x:x,y:y};S.started=true;actx();api.sfx("click");if(K&&S.thr===0) S.thr=1});
    /* keys: Up/W faster, Down/S slower, Left/A Right/D steer */
    function kd(e){var k=(e.key||"").toLowerCase();if(k==="arrowup"||k==="w"){setThr(Math.min(2,S.thr+1));e.preventDefault()}else if(k==="arrowdown"||k==="s"){setThr(Math.max(0,S.thr-1));e.preventDefault()}else if(!K&&(k==="arrowleft"||k==="a")){S.steer=-1;e.preventDefault()}else if(!K&&(k==="arrowright"||k==="d")){S.steer=1;e.preventDefault()}}
    function ku(e){var k=(e.key||"").toLowerCase();if(k==="arrowleft"||k==="a"||k==="arrowright"||k==="d") S.steer=0}
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    /* ---------- physics */
    var drift=band==="k"?0:band==="e"?6:band==="u"?11:13;
    function step(dt){if(S.done||S.moored) return;S.t+=dt;
      var want=[0,SLOW,VMAX][S.thr]||0;
      if(S.tgt){var dx=S.tgt.x-S.x,dy=S.tgt.y-S.y,d=Math.hypot(dx,dy),hh=Math.atan2(dx,-dy)*180/Math.PI,dh=((hh-S.h+540)%360)-180;if(d>30) S.h+=clamp(dh,-120*dt,120*dt);if(d<(K?34:18)){S.tgt=null;if(K) S.thr=0}else if(K) want=Math.min(SLOW,d*1.2+10)}
      else S.h+=S.steer*75*dt*(S.v>4?1:.35);
      if(band==="t"){if(S.fuel<=0) want=Math.min(want,SLOW*.5);S.fuel=Math.max(0,S.fuel-dt*(S.thr===2?.02:S.thr===1?.006:0))}
      S.v+=(want-S.v)*Math.min(1,dt*1.4);
      var a=S.h*Math.PI/180;S.x+=Math.sin(a)*S.v*dt;S.y-=Math.cos(a)*S.v*dt;
      /* current (and for teens a wind shift half way): the kid has to steer against it */
      if(drift){if(band==="t"&&!S.shifted&&S.y<(L.top+L.bot)/2){S.shifted=true;api.say(cfg.windShift,{after:"idle"})}var dir=S.shifted?-1:1;S.x+=drift*dt*dir*.8;S.y+=drift*dt*.35}
      S.x=clamp(S.x,L.lft+14,L.rgt-14);S.y=clamp(S.y,L.top+14,L.bot-8);
      /* reefs: a gentle bump back into deep water (no damage, no fail) */
      L.reefs.forEach(function(r){var dx=S.x-r.x,dy=S.y-r.y,d=Math.hypot(dx,dy),rr=r.r+16;if(d<rr){var nx=dx/(d||1),ny=dy/(d||1);S.x=r.x+nx*(rr+6);S.y=r.y+ny*(rr+6);S.v*=.25;S.tgt=null;if(K){S.thr=0;S.v=0}/* ages 4-6: a bump stops the boat until the next tap (it used to keep ramming the reef) */
        if(!S.bumpT||S.t-S.bumpT>2.5){S.bumpT=S.t;S.bumps++;api.sfx("no");snd(90,.25,"triangle",.08);api.say(cfg.bump,{state:"concern",after:"idle"})}}});
      /* go-slow zone */
      var z=L.zone,inZ=Math.hypot(S.x-z.x,S.y-z.y)<z.r;
      if(inZ&&!S.inZone){S.inZone=true;api.say(cfg.slowZone,{after:"idle"})}
      if(!inZ&&S.inZone){S.inZone=false;if(!S.fastHere) api.say(cfg.slowOk,{state:"celebration",after:"idle"});S.fastHere=false}
      if(inZ&&S.v>SLOW*1.15){if(!S.fastHere){S.fastHere=true;S.fastZone++;api.sfx("no");api.say(cfg.tooFastZone,{state:"concern",after:"idle"})}}
      /* mooring */
      var dB=Math.hypot(S.x-L.buoy.x,S.y-L.buoy.y),nR=Math.max(70,L.u*.11),near=dB<(S.near?nR*1.4:nR);/* hysteresis: drifting a little does not hide Tie up */
      if(near&&S.v<=SLOW*1.1){if(!S.near){S.near=true;if(K){S.tgt=null;S.thr=0}/* ages 4-6: the boat waits at the buoy */moorB.style.display="flex";api.say(cfg.moorNear,{after:"idle"});api.hint(cfg.hintMoor)}}
      else if(S.near&&!near){S.near=false;moorB.style.display="none"}
      if(near&&S.v>SLOW*1.3&&(!S.fastMoorT||S.t-S.fastMoorT>3)){S.fastMoorT=S.t;api.say(cfg.tooFastMoor,{state:"concern",after:"idle"})}
    }
    /* ---------- draw */
    var noise=null;function mkNoise(){noise=document.createElement("canvas");noise.width=noise.height=128;var g=noise.getContext("2d"),d=g.createImageData(128,128);for(var i=0;i<d.data.length;i+=4){var v=Math.random()*30;d.data[i]=d.data[i+1]=d.data[i+2]=255;d.data[i+3]=v}g.putImageData(d,0,0)}
    function boatW(){return Math.max(innerWidth<600?32:46,L.u*.085)}
    function boatLen(){var w=boatW();return imBoat.naturalWidth?w*imBoat.naturalHeight/imBoat.naturalWidth:w*2.6}
    function draw(){c.setTransform(dpr,0,0,dpr,0,0);if(!noise) mkNoise();
      var g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,"#0a3a75");g.addColorStop(1,"#0d4f8f");c.fillStyle=g;c.fillRect(0,0,W,H);
      c.save();c.globalAlpha=.35;c.fillStyle=c.createPattern(noise,"repeat");c.translate((S.t*8)%128,(S.t*4)%128);c.fillRect(-128,-128,W+256,H+256);c.restore();
      L.reefs.forEach(function(r){var gg=c.createRadialGradient(r.x,r.y,r.r*.4,r.x,r.y,r.r*2.1);gg.addColorStop(0,"#5fe0dfcc");gg.addColorStop(1,"#5fe0df00");c.fillStyle=gg;c.beginPath();c.arc(r.x,r.y,r.r*2.1,0,7);c.fill();
        c.fillStyle="#b9774a";c.beginPath();for(var i=0;i<=14;i++){var a=i/14*Math.PI*2,rr=r.r*(.82+.18*Math.sin(i*2.7+r.x));c.lineTo(r.x+Math.cos(a)*rr,r.y+Math.sin(a)*rr)}c.closePath();c.fill();
        c.fillStyle="#e7a0b6aa";for(var j=0;j<6;j++){c.beginPath();c.arc(r.x+Math.cos(j*1.9)*r.r*.45,r.y+Math.sin(j*1.9)*r.r*.45,r.r*.12,0,7);c.fill()}});
      var z=L.zone;c.save();c.setLineDash([10,8]);c.lineWidth=4;c.strokeStyle="#ffd84a";c.beginPath();c.arc(z.x,z.y,z.r,0,7);c.stroke();c.restore();c.fillStyle="#ffd84a22";c.beginPath();c.arc(z.x,z.y,z.r,0,7);c.fill();
      if(imTurt.complete&&imTurt.naturalWidth){var tw=Math.max(46,z.r*.5),th=tw*imTurt.naturalHeight/imTurt.naturalWidth;[[-.35,-.15,1],[.3,.25,-1]].forEach(function(q,i){c.save();c.translate(z.x+q[0]*z.r,z.y+q[1]*z.r+Math.sin(S.t*1.4+i)*4);c.globalAlpha=.9;c.scale(q[2],1);c.drawImage(imTurt,-tw/2,-th/2,tw,th);c.restore()})}
      c.fillStyle="#1b1206cc";c.font="900 14px system-ui";c.textAlign="center";var zl=(api.pick(cfg.legend)||{}).zoneShort||"GO SLOW";c.fillStyle="#ffd84a";c.fillText(zl,z.x,z.y-z.r-8);
      if(imBuoy.complete&&imBuoy.naturalWidth){var bw=Math.max(40,L.u*.07),bh=bw*imBuoy.naturalHeight/imBuoy.naturalWidth;c.drawImage(imBuoy,L.buoy.x-bw/2,L.buoy.y-bh*.8+Math.sin(S.t*2)*2,bw,bh)}
      c.strokeStyle="#ffffff88";c.lineWidth=2;c.beginPath();c.arc(L.buoy.x,L.buoy.y,Math.max(70,L.u*.11),0,7);c.stroke();
      if(S.tgt&&K){c.strokeStyle="#ffffffaa";c.lineWidth=3;c.setLineDash([8,8]);c.beginPath();c.moveTo(S.x,S.y);c.lineTo(S.tgt.x,S.tgt.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(S.tgt.x,S.tgt.y,12,0,7);c.stroke()}
      if(S.moor){var mk=clamp((performance.now()-S.moor.t0)/1400,0,1),me=mk*mk*(3-2*mk);S.h=S.moor.h0+(S.moor.h1-S.moor.h0)*me;var ah=S.h*Math.PI/180,bwm=boatLen();
        var tx=L.buoy.x-Math.sin(ah)*(S.moor.len+bwm*.5),ty=L.buoy.y+Math.cos(ah)*(S.moor.len+bwm*.5);S.x=S.moor.x0+(tx-S.moor.x0)*me;S.y=S.moor.y0+(ty-S.moor.y0)*me;}
      /* wake + boat */
      if(S.v>3){c.strokeStyle="#ffffff55";c.lineWidth=2;var a=S.h*Math.PI/180;for(var k=1;k<6;k++){var bx=S.x-Math.sin(a)*k*14,by=S.y+Math.cos(a)*k*14;c.beginPath();c.arc(bx,by,4+k*2*(S.v/VMAX),0,7);c.stroke()}}
      if(imBoat.complete&&imBoat.naturalWidth){var bw2=boatW(),bh2=bw2*imBoat.naturalHeight/imBoat.naturalWidth;c.save();c.translate(S.x,S.y);c.rotate(S.h*Math.PI/180);c.shadowColor="#0008";c.shadowBlur=8;c.drawImage(imBoat,-bw2/2,-bh2/2,bw2,bh2);c.restore()}
      if(wheel&&wheel._s){var wg=wheel.getContext("2d"),s2=wheel._s,r=s2/2;wg.setTransform(dpr,0,0,dpr,0,0);wg.clearRect(0,0,s2,s2);wg.save();wg.translate(r,r);wg.rotate((S.wheelAng?S.wheelAng():0)*Math.PI/180);
        wg.strokeStyle="#5a3418";wg.lineWidth=r*.16;wg.beginPath();wg.arc(0,0,r*.66,0,7);wg.stroke();for(var q=0;q<8;q++){var aa=q*Math.PI/4;wg.lineWidth=r*.1;wg.beginPath();wg.moveTo(0,0);wg.lineTo(Math.sin(aa)*r*.95,-Math.cos(aa)*r*.95);wg.stroke()}wg.fillStyle="#c58a3d";wg.beginPath();wg.arc(0,0,r*.2,0,7);wg.fill();wg.restore()}
      if(S.moored){var ah2=S.h*Math.PI/180,bw3=boatLen(),bx2=S.x+Math.sin(ah2)*bw3*.47,by2=S.y-Math.cos(ah2)*bw3*.47,mx=(bx2+L.buoy.x)/2,my=(by2+L.buoy.y)/2+10;
        c.strokeStyle="#3b2a14";c.lineWidth=4;c.beginPath();c.moveTo(bx2,by2);c.quadraticCurveTo(mx,my,L.buoy.x,L.buoy.y);c.stroke();c.strokeStyle="#e8d3a2";c.lineWidth=2.4;c.setLineDash([5,3]);c.beginPath();c.moveTo(bx2,by2);c.quadraticCurveTo(mx,my,L.buoy.x,L.buoy.y);c.stroke();c.setLineDash([])}
      var sp=Math.round(S.v/VMAX*20);speedEl.textContent=(api.pick(cfg.speedLabel)||"Speed")+": "+sp+" kn"+(S.inZone?" \u00b7 "+((api.pick(cfg.legend)||{}).zoneShort||"GO SLOW"):"");
      if(fuelEl) fuelEl.textContent="\u26fd "+Math.round(S.fuel*100)+"%"}
    var raf=0,last=performance.now();function frame(now){raf=requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000);last=now;if(!api.live()) return;step(dt);draw()}
    async function finish(){if(S.done) return;S.done=true;api.hint(null);await api.say(S.bumps||S.fastZone?cfg.mooredOk:cfg.mooredGreat,{state:"celebration",after:"idle"});if(!api.live()) return;
      await api.fact(1);if(!api.live()) return;resolve({bumps:S.bumps,fastZone:S.fastZone})}
    layout();var onR=function(){layout()};window.addEventListener("resize",onR);raf=requestAnimationFrame(frame);
    api.onEnd(function(){cancelAnimationFrame(raf);window.removeEventListener("resize",onR);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku)});
    var sp0=api.say(cfg.start,{after:"idle"});api.hint(K?cfg.hintK:cfg.hint);
    /* the map is first measured while the long opening line fills the caption; once it ends, re-measure (only if the boat has not moved yet) */
    if(sp0&&sp0.then) sp0.then(function(){if(!api.live()||S.started) return;setTimeout(function(){if(!api.live()||S.started) return;layout();layoutUI()},350)});
    host._boat={S:S,L:function(){return L},go:function(x,y){S.tgt={x:x,y:y};S.started=true;if(S.thr===0) S.thr=1},thr:setThr,steer:function(v){S.steer=v},moor:function(){moorB.click()},moorBtn:moorB};
  });
});
/* ============================================================================ R4 WHO HELPS WHOM? (3-LS4-3 for ages 7-9) */
function ask(api,q,arr,correct,okS,noS){return choose(api,q,(arr||[]).map(function(t,i){return {label:t,ok:i===correct,say:i===correct?okS:noS}}))}
var PAIRS=[{a:"clown",pa:"animal_clownfish",b:"anemone",pb:"prop_anemone"},{a:"goby",pa:"animal_goby",b:"shrimp",pb:"animal_shrimp"},{a:"turtle",pa:"animal_turtle",b:"cleaner",pb:"animal_cleaner"}];
reg("pairs",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",UT=band==="u"||band==="t";
    var root=api.el("div","rf rpairs");root.style.cssText="position:absolute;inset:0;z-index:2;overflow:hidden";host.appendChild(root);
    var st={phase:"cod",made:[],wrong:0,sorted:0};var names=api.pick(cfg.names)||{};function nm(k){return names[k]||k}
    /* ---------- phase 1: guide the potato cod to the cleaning station */
    var station=api.el("div","rf-station");station.style.cssText="position:absolute;z-index:3;background:none;border:0;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:none";
    station.innerHTML=picImg(api,"prop_braincoral",160);root.appendChild(station);
    var wr=fishEl(api,"animal_cleaner",70);wr.style.zIndex=4;root.appendChild(wr);
    /* 10/10 item 13: fetch the partner pictures now, so the match cards never flash blank */
    var PRE=[];PAIRS.forEach(function(p){[p.pa,p.pb].forEach(function(id){var i=new Image();i.decoding="async";i.src=api.url(id);PRE.push(i)})});
    var cod=api.el("button","ds-hit rf-cod");cod.type="button";cod.setAttribute("aria-label",nm("cod"));cod.style.cssText="position:absolute;z-index:5;border:0;background:none;padding:0;cursor:grab";cod.innerHTML=picImg(api,"animal_cod",200);root.appendChild(cod);var ci0=cod.querySelector("img");if(ci0){ci0.style.animation="rfSwimBob 2.6s ease-in-out infinite";ci0.style.transformOrigin="70% 50%"}
    var stHit=api.el("button","ds-hit");stHit.type="button";stHit.setAttribute("aria-label",nm("station"));stHit.style.cssText="position:absolute;z-index:4;border-radius:50%;box-shadow:inset 0 0 0 4px #ffe56a88";root.appendChild(stHit);
    var Lc={};
    function lay1(){var b=box(api),W=host.clientWidth,H=host.clientHeight,u=Math.min(W,H);var cw=Math.max(K?150:130,Math.min(260,u*.34)),sw=Math.max(140,Math.min(240,u*.32));
      cod.querySelector("img").style.width=px(cw);cod.querySelector("img").style.height="auto";cod.style.left=px(Math.max((b.vw<900?14:b.side*.4)+10,W*.34-cw*.5));cod.style.top=px(H*.66-cw*.2);
      station.querySelector("img").style.width=px(sw);station.style.left=px(W-(b.vw<900?130:b.side+20)-sw);station.style.top=px(H*.62-sw*.5);
      Lc={sx:W-(b.vw<900?130:b.side+20)-sw/2,sy:H*.6};wr.style.left=px(Lc.sx-35);wr.style.top=px(Lc.sy-sw*.55);
      cod.style.minHeight=px(K?96:64);cod.style.minWidth=px(K?96:64);cod.style.display="flex";cod.style.alignItems="center";cod.style.justifyContent="center";
      if(W<600){cod.style.left=px(14);cod.style.top=px(H*.5-cw*.2);station.style.left=px(W-14-sw);station.style.top=px(H*.64-sw*.5);Lc={sx:W-14-sw/2,sy:H*.64};wr.style.left=px(Lc.sx-35);wr.style.top=px(Lc.sy-sw*.55)}
      var hs=Math.max(K?120:96,sw);stHit.style.width=stHit.style.height=px(hs);stHit.style.left=px(Lc.sx-hs/2);stHit.style.top=px(Lc.sy-hs/2)}
    function codTo(){if(st.phase!=="cod") return false;st.phase="clean";api.hint(null);stHit.remove();var r=api.rectOf(cod),hr=host.getBoundingClientRect();
      cod.style.transition="left 1.6s ease-in-out,top 1.6s ease-in-out";cod.style.left=px(Lc.sx-r.w*.95);cod.style.top=px(Lc.sy-r.h*.55);api.sfx("whoosh");
      setTimeout(async function(){if(!api.live()) return;var cr=api.rectOf(cod),t0=performance.now();
        wr.style.transition="none";(function an(){if(!api.live()) return;var t=(performance.now()-t0)/1000;wr.style.left=px(cr.l-hr.left+cr.w*(.72+.12*Math.sin(t*5)));wr.style.top=px(cr.t-hr.top+cr.h*(.3+.12*Math.cos(t*4)));if(t<5) requestAnimationFrame(an)})();
        bubbles(api,cr.cx,cr.cy,6);await api.say(cfg.cleanLine,{state:"celebration",after:"idle"});if(!api.live()) return;await api.fact(1);if(!api.live()) return;phase2()},1700);return true}
    api.drag(cod,{ok:function(){return st.phase==="cod"},ghost:function(){var g=document.createElement("div");g.className="ar2-ghost";g._size=150;g.style.width=g.style.height="150px";g.innerHTML='<img src="'+api.url("animal_cod")+'" alt="">';return g},
      drop:function(x,y){var r=api.rectOf(stHit);if(api.inside(x,y,r,K?90:50)) return codTo();api.say(cfg.codMiss,{after:"idle"});return false},tap:function(){return false}});
    stHit.onclick=function(){if(K||st.armed) codTo()};cod.addEventListener("click",function(){if(st.phase==="cod"){st.armed=true;stHit.classList.add("ds-pulse")}});
    /* ---------- phase 2: connect partners (drag a line, or tap one then the other) */
    var svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none";var cards={},sel=null,drawL=null;
    function card(id,pic,side){var b=api.el("button","rf-card");b.type="button";b.dataset.id=id;b.dataset.side=side;b.setAttribute("aria-label",nm(id));
      b.style.cssText="position:absolute;z-index:4;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border-radius:18px;background:#0d2c4dcc;border:3px solid #7fd6ff88;color:#fff;font-weight:800;touch-action:none;cursor:pointer";
      b.innerHTML=picImg(api,pic,96)+'<span>'+api.esc(nm(id))+'</span>';var im=b.querySelector('img');if(im&&!(im.complete&&im.naturalWidth)){b.style.opacity='0';b.style.transition='opacity .25s';var show=function(){b.style.opacity='1'};(im.decode?im.decode():Promise.reject()).then(show,function(){im.addEventListener('load',show);im.addEventListener('error',show);setTimeout(show,2500)})}root.appendChild(b);cards[id]=b;return b}
    function phase2(){st.phase="pairs";[cod,wr,station].forEach(function(x){x.style.transition="opacity .5s";x.style.opacity="0"});setTimeout(function(){[cod,wr,station].forEach(function(x){x.remove()})},520);
      root.appendChild(svg);var list=K?PAIRS.slice(0,1):PAIRS;list.forEach(function(p){card(p.a,p.pa,"a");card(p.b,p.pb,"b")});lay2();
      api.say(K?cfg.pairsIntroK:cfg.pairsIntro,{after:"idle"});api.hint(K?cfg.hintPairsK:cfg.hintPairs);
      Object.keys(cards).forEach(function(id){var b=cards[id];
        b.addEventListener("pointerdown",function(e){if(st.phase!=="pairs"||b.classList.contains("done")) return;e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}var r=api.rectOf(b),hr=host.getBoundingClientRect();drawL={id:id,pid:e.pointerId,x0:r.cx-hr.left,y0:r.cy-hr.top,moved:false,sx:e.clientX,sy:e.clientY};});
        b.addEventListener("pointermove",function(e){if(!drawL||drawL.pid!==e.pointerId) return;if(Math.hypot(e.clientX-drawL.sx,e.clientY-drawL.sy)>8) drawL.moved=true;if(!drawL.moved) return;var hr=host.getBoundingClientRect();tmpLine(drawL.x0,drawL.y0,e.clientX-hr.left,e.clientY-hr.top)});
        b.addEventListener("pointerup",function(e){if(!drawL||drawL.pid!==e.pointerId) return;var d=drawL;drawL=null;tmpLine();
          if(d.moved){var tgt=null;Object.keys(cards).forEach(function(k){if(k!==d.id&&api.inside(e.clientX,e.clientY,api.rectOf(cards[k]),12)) tgt=k});if(tgt) tryPair(d.id,tgt);return}
          /* tap-then-tap */
          if(sel&&sel!==id){var a=sel;cards[a].classList.remove("sel");sel=null;tryPair(a,id)}else{if(sel) cards[sel].classList.remove("sel");sel=id;b.classList.add("sel");api.sfx("click")}});
        b.addEventListener("pointercancel",function(){drawL=null;tmpLine()})})}
    var tmp=null;function tmpLine(x0,y0,x1,y1){if(tmp){tmp.remove();tmp=null}if(x0==null) return;tmp=line(x0,y0,x1,y1,"#ffffffcc",6,true)}
    function line(x0,y0,x1,y1,col,w,dash){var l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",x0);l.setAttribute("y1",y0);l.setAttribute("x2",x1);l.setAttribute("y2",y1);l.setAttribute("stroke",col);l.setAttribute("stroke-width",w);l.setAttribute("stroke-linecap","round");if(dash) l.setAttribute("stroke-dasharray","10 10");svg.appendChild(l);return l}
    function lay2(){var b=box(api),W=host.clientWidth,H=host.clientHeight,ids=Object.keys(cards);if(!ids.length) return;var list=K?PAIRS.slice(0,1):PAIRS,n=list.length;
      var top=b.top+(b.ph?40:70),bot=H-(b.ph?20:40),lft=(b.vw<900?14:b.side*.4)+10,rgt=W-(b.vw<900?130:b.side+20);var rowH=(bot-top)/n,cs=Math.max(K?150:104,Math.min(180,rowH*.72,(rgt-lft)*.22));
      /* partners shuffled on the right so it is not a straight across match */
      var order=K?[0]:[2,0,1];if(W<600){lft=14;rgt=W-14;bot=H-(K?120:110);rowH=(bot-top)/n;cs=Math.max(K?120:90,Math.min((W-28-40)/2,rowH*.72,170))}
      list.forEach(function(p,i){[["a",i],["b",order.indexOf(i)]].forEach(function(q){var c=cards[q[0]==="a"?p.a:p.b];c.querySelector("img").style.width=c.querySelector("img").style.height=px(cs*.72);c.style.width=px(cs);
        var x=q[0]==="a"?lft+20:rgt-cs-20,y=top+rowH*q[1]+(rowH-cs*1.15)/2;c.style.left=px(x);c.style.top=px(y)})});
      [].forEach.call(svg.querySelectorAll("line.keep"),function(l){var a=cards[l.dataset.a],bb=cards[l.dataset.b],hr=host.getBoundingClientRect(),ra=api.rectOf(a),rb=api.rectOf(bb);l.setAttribute("x1",ra.cx-hr.left);l.setAttribute("y1",ra.cy-hr.top);l.setAttribute("x2",rb.cx-hr.left);l.setAttribute("y2",rb.cy-hr.top)})}
    function tryPair(x,y){var p=PAIRS.filter(function(q){return (q.a===x&&q.b===y)||(q.a===y&&q.b===x)})[0];if(!p||st.made.indexOf(p.a)>=0){st.wrong++;api.sfx("no");api.say(cfg.pairNo,{state:"concern",after:"idle"});[x,y].forEach(function(k){var c=cards[k];c.classList.remove("nudge");void c.offsetWidth;c.classList.add("nudge")});return}
      st.made.push(p.a);api.sfx("ok");var hr=host.getBoundingClientRect(),ra=api.rectOf(cards[p.a]),rb=api.rectOf(cards[p.b]);var l=line(ra.cx-hr.left,ra.cy-hr.top,rb.cx-hr.left,rb.cy-hr.top,"#6af0ab",8);l.classList.add("keep");l.dataset.a=p.a;l.dataset.b=p.b;
      [p.a,p.b].forEach(function(k){cards[k].classList.add("done");cards[k].style.borderColor="#6af0ab"});api.burst((ra.cx+rb.cx)/2,(ra.cy+rb.cy)/2,10);
      var lines=api.pick(cfg.pairLines)||{};api.say(lines[p.a],{state:"celebration",after:"idle"}).then(function(){if(!api.live()) return;if(st.made.length===(K?1:PAIRS.length)&&st.phase==="pairs"){st.phase="after";afterPairs()}})}
    async function afterPairs(){api.hint(null);await api.fact(2);if(!api.live()) return;
      if(UT){await sortPhase();if(!api.live()) return}
      if(band==="t"){await ask(api,cfg.gobyQ,api.pick(cfg.gobyOpts),0,cfg.gobyOk,cfg.gobyNo);if(!api.live()) return}
      resolve({wrong:st.wrong})}
    /* ---------- u/t: sort the relationships: both help, or one eats the other */
    function sortPhase(){return new Promise(function(done){st.phase="sort";Object.keys(cards).forEach(function(k){cards[k].style.transition="opacity .4s";cards[k].style.opacity="0"});svg.style.opacity="0";
      setTimeout(function(){Object.keys(cards).forEach(function(k){cards[k].remove()});svg.remove()},450);
      var items=api.pick(cfg.sortItems)||[],bins=api.pick(cfg.sortBins)||["Both help","One eats the other"],binEls=[],chips=[],picked=null,binN=[0,0];
      bins.forEach(function(t,i){var b=api.el("button","rf-bin");b.type="button";b.dataset.bin=i;b.setAttribute("aria-label",t);b.style.cssText="position:absolute;z-index:4;padding:10px;border-radius:20px;border:3px dashed #ffe56a;background:#0d2c4dcc;color:#fff;font-weight:900;font-size:17px";b.textContent=t;root.appendChild(b);binEls.push(b);
        b.onclick=function(){if(picked) drop(picked,i)}});
      items.forEach(function(it,i){var c=api.el("button","rf-card");c.type="button";c.dataset.i=i;c.style.cssText="position:absolute;z-index:5;display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:16px;background:#123c63ee;border:3px solid #7fd6ff88;color:#fff;font-weight:800";
        c.innerHTML=picImg(api,it.p1,56)+picImg(api,it.p2,56)+'<span>'+api.esc(it.t)+'</span>';root.appendChild(c);chips.push(c);
        api.drag(c,{ok:function(){return !c.classList.contains("done")},drop:function(x,y){for(var j=0;j<binEls.length;j++){if(api.inside(x,y,api.rectOf(binEls[j]),20)) return drop(c,j)}return false},tap:function(){if(picked) picked.classList.remove("sel");picked=c;c.classList.add("sel");api.sfx("click");return true}})});
      function lay(){var b=box(api),W=host.clientWidth,H=host.clientHeight,top=b.top+(b.ph?40:64),lft=(b.vw<900?14:b.side*.4)+10,rgt=W-(b.vw<900?130:b.side+20);var bw=(rgt-lft-24)/2;
        binEls.forEach(function(e,i){e.style.left=px(lft+i*(bw+24));e.style.width=px(bw);e.style.top=px(H*.62);e.style.height=px(Math.max(90,H*.3-20))});
        chips.forEach(function(c,i){if(c.classList.contains("done")) return;c.style.maxWidth=px(bw);c.style.flexWrap="wrap";c.style.justifyContent="center";c.style.left=px(lft+(i%2)*(bw+24));c.style.top=px(top+Math.floor(i/2)*78)})}
      lay();var onR=function(){lay()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
      api.say(cfg.sortIntro,{after:"idle"});api.hint(cfg.hintSort);
      function drop(c,j){var it=items[+c.dataset.i];if(it.bin!==j){api.sfx("no");api.say(it.no||cfg.sortNo,{state:"concern",after:"idle"});c.classList.remove("sel");if(picked===c) picked=null;return false}
        c.classList.add("done");c.classList.remove("sel");if(picked===c) picked=null;api.sfx("ok");var r=api.rectOf(binEls[j]),hr=host.getBoundingClientRect(),n=++st.sorted;
        var kk=binN[j]=(binN[j]||0)+1,cw=c.offsetWidth||200,ch=c.offsetHeight||80,half=r.w/2,sc=Math.min(.8,(half-12)/cw,(r.h-42)/ch);c.style.left=px(r.l-hr.left+6+(kk-1)*half+Math.max(0,(half-12-cw*sc)/2));c.style.top=px(r.t-hr.top+36);c.style.transform="scale("+sc.toFixed(3)+")";c.style.transformOrigin="0 0";
        api.say(it.ok,{state:"celebration",after:"idle"});if(st.sorted>=items.length) setTimeout(function(){if(api.live()){api.hint(null);done()}},1600);return true}})}
    lay1();var onR=function(){if(st.phase==="cod") lay1();else if(st.phase==="pairs") lay2()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    api.say(cfg.start,{after:"idle"});api.hint(K?cfg.hintCodK:cfg.hintCod);
    host._pairs={st:st,cards:function(){return cards},pair:tryPair,cod:codTo};
  });
});
/* ============================================================================ R5 KEEP THE REEF IN BALANCE */
var ACTS=[{id:"protect",pic:"animal_parrotfish"},{id:"runoff",pic:"ans_algae_rock"},{id:"cots",pic:"animal_cots"},{id:"emissions",pic:"ans_warm_water",teen:true},{id:"shade",pic:"ans_bleached",teen:true,exp:true}];
/* a small, honest model: parrotfish graze algae; farm runoff feeds algae and crown-of-thorns outbreaks; crown-of-thorns eat coral;
   in year 3 a marine heatwave bleaches coral whatever we do locally. Cutting emissions is the only fix for heatwaves, but it is global and slow:
   it changes how often future heatwaves come, not this one. Shading is experimental and can only cover a tiny patch. */
function simReef(on,years){var C=45,A=30,P=50,S=20,out=[{y:0,C:C,A:A,P:P,S:S,heat:false}];
  for(var y=1;y<=years;y++){P=clamp(P+(on.protect?12:-6),5,100);var N=on.runoff?.4:1;
    A=clamp(A+18*N-.3*P,0,100);S=clamp((S+(on.runoff?2:10))*(on.cots?.4:1),0,100);
    var heat=y===3,H=heat?(on.shade?16:18):0;
    C=clamp(C+8-.12*A-.25*S-H+(A<20?4:0),0,100);out.push({y:y,C:C,A:A,P:P,S:S,heat:heat})}
  return out}
reg("reefsim",function(api,cfg){
  return new Promise(function(resolve){
    css();
    var host=api.host,band=B(api),K=band==="k",UT=band==="u"||band==="t",TEEN=band==="t";
    var root=api.el("div","rf rsim");root.style.cssText="position:absolute;inset:0;z-index:2;overflow:hidden";host.appendChild(root);
    var names=api.pick(cfg.actNames)||{},why=api.pick(cfg.actWhy)||{};
    var st={on:{},runs:[],phase:K?"k":"plan",eaten:0,picks:TEEN?2:(band==="u"?3:3)};
    if(K){kGame();return}
    /* ---------- action cards */
    var panel=api.el("div","rf-acts");panel.style.cssText="position:absolute;z-index:4;display:flex;flex-wrap:wrap;gap:10px;justify-content:center";root.appendChild(panel);
    var acts=ACTS.filter(function(a){return a.id==="shade"?TEEN:a.id==="emissions"?UT:true}),cardEl={};
    acts.forEach(function(a){var b=api.el("button","rf-act");b.type="button";b.dataset.id=a.id;b.setAttribute("aria-pressed","false");b.setAttribute("aria-label",names[a.id]||a.id);
      b.style.cssText="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;min-width:120px;max-width:170px;border-radius:18px;background:#0d2c4dcc;border:3px solid #7fd6ff66;color:#fff;font-weight:800;cursor:pointer";
      b.innerHTML=picImg(api,a.pic,72)+'<span>'+api.esc(names[a.id]||a.id)+'</span>'+(a.exp?'<span class="rf-exp">'+api.esc(api.pick(cfg.expLabel)||"Experimental")+'</span>':"")+'<small style="font-weight:600;opacity:.85;font-size:12px;line-height:1.2">'+api.esc(why[a.id]||"")+'</small>';
      b.onclick=function(){if(st.phase!=="plan") return;var on=!st.on[a.id];if(on&&count()>=st.picks){api.sfx("no");api.say((api.pick(cfg.tooMany)||"").replace("{n}",st.picks),{state:"concern",after:"idle"});return}
        st.on[a.id]=on;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false");b.style.borderColor=on?"#6af0ab":"#7fd6ff66";api.sfx(on?"ok":"click");preview();
        if(on&&cfg.actSay&&api.pick(cfg.actSay)[a.id]) api.say(api.pick(cfg.actSay)[a.id],{after:"idle"})};
      panel.appendChild(b);cardEl[a.id]=b});
    function count(){return Object.keys(st.on).filter(function(k){return st.on[k]}).length}
    var runB=btn(api,'<span class="ico">&#9654;&#65039;</span><span>'+api.esc(api.pick(cfg.runBtn)||"Run 5 years")+'</span>',"Run 5 years");runB.style.cssText+=";position:absolute;z-index:5;min-height:64px";root.appendChild(runB);
    var budget=api.el("div","ds-chip");budget.style.cssText+=";position:absolute;z-index:5";root.appendChild(budget);
    /* ---------- chart + reef picture */
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;z-index:3;border-radius:16px;background:#061b30cc;box-shadow:0 8px 24px #0008";root.appendChild(cv);
    var reef=api.el("div");reef.style.cssText="position:absolute;z-index:3;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px #0008";
    var RC=coverLayer(api,"bd_clean",{posX:.85});reef.appendChild(RC.wrap);
    var alg=api.el("div","rf-algae");alg.style.cssText="position:absolute;inset:0;opacity:.3;transition:opacity .4s;pointer-events:none";
    BOMMIE.forEach(function(q,k){var t=img(api,"prop_algae");t.style.cssText="position:absolute;width:"+(k%2?9:11)+"%;left:"+((q[0]-.05)*100)+"%;top:"+((q[1]-.04)*100)+"%;transform:rotate("+(k*37%40-20)+"deg)";alg.appendChild(t)});
    var bl=api.el("div","rf-bleach");bl.style.cssText="position:absolute;inset:0;background:#f4f1e8;mix-blend-mode:screen;opacity:0;transition:opacity .4s;clip-path:ellipse(21% 33% at 80% 63%);pointer-events:none";
    RC.inner.appendChild(bl);RC.inner.appendChild(alg);
    reef.insertAdjacentHTML("beforeend",'<div class="rf-heat" style="position:absolute;inset:0;background:radial-gradient(circle,#ff4d2e00,#ff4d2e88);opacity:0;transition:opacity .4s"></div><div class="rf-year ds-chip" style="position:absolute;left:8px;top:8px"></div>');root.appendChild(reef);
    var G={};
    function lay(){var b=box(api),W=host.clientWidth,H=host.clientHeight,top=b.top+(b.ph?36:60),lft=(b.vw<900?10:b.side*.4)+6,rgt=W-(b.vw<900?126:b.side+16),bot=H-Math.max(10,b.bot);
      var wide=W>H*1.1,pw=rgt-lft;
      if(wide){var colW=Math.min(pw*.5,560);panel.style.left=px(lft);panel.style.top=px(top);panel.style.width=px(colW);
        var gx=lft+colW+14,gw=rgt-gx,gh=Math.max(140,(bot-top-80)/2);reef.style.left=px(gx);reef.style.top=px(top);reef.style.width=px(gw);reef.style.height=px(gh);G={x:gx,y:top+gh+10,w:gw,h:gh}}
      else{panel.style.left=px(lft);panel.style.top=px(top);panel.style.width=px(pw);var ph2=panel.offsetHeight||240,gy=top+ph2+10,gh2=Math.max(110,(bot-gy-80)/2);reef.style.left=px(lft);reef.style.top=px(gy);reef.style.width=px(pw);reef.style.height=px(gh2);G={x:lft,y:gy+gh2+8,w:pw,h:gh2}}
      var d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(G.w*d);cv.height=Math.round(G.h*d);cv.style.left=px(G.x);cv.style.top=px(G.y);cv.style.width=px(G.w);cv.style.height=px(G.h);
      runB.style.right=px(b.vw<900?126:b.side+16);runB.style.bottom=px(Math.max(10,b.bot));budget.style.left=px(lft);budget.style.bottom=px(Math.max(10,b.bot)+14);drawChart(null)}
    function preview(){budget.textContent=(api.pick(cfg.picksLabel)||"Actions chosen")+": "+count()+" / "+st.picks;var r=simReef(st.on,5);drawChart(r,true)}
    function drawChart(cur,ghost,upto){var c=cv.getContext("2d"),d=Math.min(2,window.devicePixelRatio||1),w=G.w,h=G.h;if(!w) return;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);
      var l=40,r=w-12,t=26,bm=h-26;c.fillStyle="#ff4d2e33";var x3=l+(r-l)*(2.5/5),x4=l+(r-l)*(3.5/5);c.fillRect(x3,t,x4-x3,bm-t);c.fillStyle="#ffb3a0";c.font="700 11px system-ui";c.textAlign="center";c.fillText(api.pick(cfg.heatLabel)||"Heatwave",(x3+x4)/2,t-6);
      c.strokeStyle="#ffffff44";c.lineWidth=1;c.fillStyle="#cfe8ff";c.textAlign="right";[0,50,100].forEach(function(v){var y=bm-(bm-t)*v/100;c.beginPath();c.moveTo(l,y);c.lineTo(r,y);c.stroke();c.fillText(v+"%",l-4,y+4)});
      c.textAlign="center";for(var i=0;i<=5;i++) c.fillText((api.pick(cfg.yearShort)||"Y")+i,l+(r-l)*i/5,h-8);
      c.textAlign="left";c.fillText(api.pick(cfg.chartTitle)||"Living coral",l,14);
      var cols=["#7fd6ff","#ffd84a"];st.runs.forEach(function(run,k){plot(c,run,cols[k%2],1,5,l,r,t,bm)});
      if(cur) plot(c,cur,ghost?"#ffffff66":"#6af0ab",ghost?.7:1,upto==null?5:upto,l,r,t,bm,ghost)}
    function plot(c,run,col,a,upto,l,r,t,bm,dash){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=dash?2:4;if(dash) c.setLineDash([6,6]);c.beginPath();run.forEach(function(p,i){if(p.y>upto) return;var x=l+(r-l)*p.y/5,y=bm-(bm-t)*p.C/100;if(!i) c.moveTo(x,y);else c.lineTo(x,y)});c.stroke();c.restore()}
    function paintReef(p){reef.querySelector(".rf-algae").style.opacity=String(clamp(p.A/70,0,1));reef.querySelector(".rf-bleach").style.opacity=String(clamp((60-p.C)/90,0,.6));reef.querySelector(".rf-heat").style.opacity=p.heat?"1":"0";
      reef.querySelector(".rf-year").textContent=(api.pick(cfg.yearLabel)||"Year")+" "+p.y+" \u00b7 "+(api.pick(cfg.chartTitle)||"Living coral")+" "+Math.round(p.C)+"%"}
    runB.onclick=async function(){if(st.phase!=="plan") return;st.phase="run";runB.style.display="none";api.hint(null);var run=simReef(st.on,5);run.on=JSON.parse(JSON.stringify(st.on));
      for(var y=0;y<=5;y++){if(!api.live()) return;paintReef(run[y]);drawChart(run,false,y);
        if(run[y].heat){api.sfx("no");await api.say(cfg.heatwave,{state:"concern",after:"idle"});if(!api.live()) return;if(!st.bleachShown&&T(api,cfg.bleachSay)){st.bleachShown=true;await bleachCard();if(!api.live()) return}if(UT&&st.on.emissions) {await api.say(cfg.emissionsNote,{after:"idle"});if(!api.live()) return}if(TEEN&&st.on.shade){await api.say(cfg.shadeNote,{after:"idle"});if(!api.live()) return}}
        else await api.sleep(y?850:300)}
      st.runs.push(run);drawChart(null);var end=run[5].C;
      await api.say((end>=45?api.pick(cfg.endGood):api.pick(cfg.endLow)).replace("{c}",Math.round(end)),{state:end>=45?"celebration":"concern",after:"idle"});if(!api.live()) return;
      if(band==="u"&&st.runs.length<2){await api.say(cfg.tryAgain,{after:"idle"});if(!api.live()) return;st.phase="plan";runB.style.display="";api.hint(cfg.hintAgain);return}
      await api.fact(1);if(!api.live()) return;
      if(band==="u"){var a=st.runs[0][5].C,b=st.runs[1][5].C,opts=api.pick(cfg.compareOpts);var ri=a>b?0:a<b?1:2;
        await ask(api,cfg.compareQ,opts,ri,cfg.compareOk,cfg.compareNo);if(!api.live()) return}
      if(TEEN){await ask(api,cfg.teenQ,api.pick(cfg.teenOpts),0,cfg.teenOk,cfg.teenNo);if(!api.live()) return}
      resolve({runs:st.runs.length,end:Math.round(end)})};
    lay();preview();var onR=function(){lay();preview()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    api.say(TEEN?cfg.startT:cfg.start,{after:"idle"});api.hint(TEEN?cfg.hintT:cfg.hint);
    host._sim={st:st,cards:cardEl,run:function(){runB.click()},sim:simReef};
    /* 10/10 item 9: bleaching gets its own moment, healthy vs bleached coral side by side while Spark explains (no timer, no tap needed) */
    async function bleachCard(){var c=api.el("div","rf-bleachcard");var W=host.clientWidth,ph=W<600;
      c.style.cssText="position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);width:"+px(Math.min(W-24,760))+";background:#0b2a3ef2;border:2px solid #8ff2e6;border-radius:18px;padding:14px;box-shadow:0 12px 40px #000a;color:#fff;text-align:center";
      function fig(id,cap){return '<figure style="margin:0;flex:1;min-width:0"><img src="'+api.url(id)+'" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:12px;display:block"><figcaption style="font:600 '+(ph?13:15)+'px/1.3 system-ui;margin-top:6px">'+api.esc(cap)+'</figcaption></figure>'}
      c.innerHTML='<div style="font:800 '+(ph?18:22)+'px system-ui;margin-bottom:10px">'+api.esc(T(api,cfg.bleachTitle))+'</div><div style="display:flex;gap:12px;'+(ph?'flex-direction:column':'')+'">'+fig("ans_coral_polyps",T(api,cfg.bleachHealthy))+fig("ans_bleached",T(api,cfg.bleachWhite))+'</div>';
      root.appendChild(c);host._bleach=c;await api.say(cfg.bleachSay,{after:"idle"});if(!api.live()) return;
      c.style.transition="opacity .5s";c.style.opacity="0";setTimeout(function(){c.remove()},520)}
    /* ---------- ages 4-6: tap the parrotfish so they nibble the algae off the coral (nothing timed) */
    function kGame(){var KC=coverLayer(api,"bd_clean",{flip:true,posX:.5});var bg=KC.wrap;bg.style.zIndex="1";root.appendChild(bg);
      var spots=[],need=5,W0=0;
      function lay2(){var W=host.clientWidth,H=host.clientHeight,pos=W/H<1.2?.14:.5;KC.wrap.setPos(pos);W0=W;
        /* keep every tuft on screen: squeeze the coral spots into the part of the (flipped) photo that is visible, staying on the bommie */
        var IW=Math.max(W,H*16/9),left=(W-IW)*pos,m=(70)/IW,v0=1-(W-left)/IW+m,v1=1+left/IW-m,lo=Math.max(.63,v0),hi=Math.min(.95,v1);
        spots.forEach(function(sp){var q=BOMMIE[sp.i],fx=lo+(q[0]-.66)/(.86-.66)*(hi-lo);sp.el.style.left=(Math.max(lo,Math.min(hi,fx))*100)+"%"})}
      BOMMIE.slice(0,need).forEach(function(q,i){var e=api.el("button","ds-hit rf-algae-spot");e.type="button";e.setAttribute("aria-label",api.pick(cfg.algaeLabel)||"Algae on the coral");
        e.style.cssText="position:absolute;z-index:3;width:120px;height:96px;margin:-48px 0 0 -60px;left:"+(q[0]*100)+"%;top:"+(q[1]*100)+"%;border:0;background:none;padding:0;cursor:pointer;touch-action:manipulation";
        var t=img(api,"prop_algae");t.style.cssText="width:120px;height:96px;object-fit:contain;transition:opacity .35s,transform .35s;transform:rotate("+(i*37%40-20)+"deg)";e.appendChild(t);KC.inner.appendChild(e);
        var s={el:e,pic:t,i:i};spots.push(s);e.onclick=function(){if(s.done) return;s.done=true;e.disabled=true;eat(s)}});
      function eat(s){var W=host.clientWidth,r=api.rectOf(s.el),hr=host.getBoundingClientRect(),cx=r.cx,cy=r.cy;
        var fw=Math.min(150,Math.max(110,W*.12)),f=fishEl(api,"animal_parrotfish",fw);var fh=parseFloat(f.style.height)||fw*.46;
        f.className+=" rf-graze";f.style.cssText+=";position:absolute;z-index:4;left:0;top:0;pointer-events:none;will-change:transform";root.appendChild(f);
        var hx=cx-hr.left,hy=cy-hr.top,ax=hx-8,ay=hy-fh*.5,sx=W+40,sy=ay-60;
        function T(x,y,extra){return "translate3d("+x+"px,"+y+"px,0) scaleX(-1)"+(extra||"")}
        api.sfx("pop");var a1=f.animate([{transform:T(sx,sy)},{transform:T(ax+14,ay-6)}],{duration:1400,easing:"cubic-bezier(.3,.7,.4,1)",fill:"forwards"});
        a1.onfinish=function(){if(!api.live()) return;var n=0;(function bite(){if(!api.live()) return;
          var b=f.animate([{transform:T(ax+14,ay)},{transform:T(ax-4,ay+3)},{transform:T(ax+14,ay)}],{duration:420,easing:"ease-in-out",fill:"forwards"});
          b.onfinish=function(){n++;snd(520+n*70,.08);s.pic.style.opacity=String(1-n/3);s.pic.style.transform="scale("+(1-n*.18)+")";bubbles(api,cx,cy,2);
            if(n<3) return bite();
            st.eaten++;var out=f.animate([{transform:T(ax+14,ay)},{transform:T(-fw-60,ay-80)}],{duration:1800,easing:"ease-in",fill:"forwards"});out.onfinish=function(){f.remove()};
            if(st.eaten>=need) kDone();else api.say(api.pick(cfg.kNibble),{state:"celebration",after:"idle"})}})()}}
      lay2();var onR2=function(){lay2()};window.addEventListener("resize",onR2);api.onEnd(function(){window.removeEventListener("resize",onR2)});
      api.say(cfg.startK,{after:"idle"});api.hint(cfg.hintK);
      async function kDone(){api.hint(null);await api.say(cfg.kDone,{state:"celebration",after:"idle"});if(!api.live()) return;await api.fact(1);if(!api.live()) return;resolve({eaten:st.eaten})}
      host._sim={st:st,spots:function(){return spots}}}
  });
});
})();
