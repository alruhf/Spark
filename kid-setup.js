/* Spark new-kid flow (Allen 11/15 items 3 + 7). ONLY for a brand-new kid profile (sbx.js newProfile sets profiles[pid].setupPending;
   saves made before this never have it, so existing kids never see this and keep the backpack look bar only).
   Step 1 "How old are you?": four big picture buttons 4-6 / 7-9 / 10-12 / 13+  -> profiles[pid].ageBand (+ age = band rep).
          The kid's band overrides the device age for this kid (spark-age.js); the grown-up panel age stays the fallback.
   Step 2 "Make your explorer": big 3D preview of the shared kid (kid-setup-3d.js, same model + kid-look.js tint as every world),
          tap-only skin / hair / eye swatches (kid-look.js OPTS, saved through wardrobe.js setLook), one big "Let's go" button
          that also works as skip (nothing chosen = today's kid). Saves profiles[pid].lookDone = true and clears setupPending: never again.
   Taps only, no typing. Every spoken line is an Ava clip (SparkVoice; never the browser voice).
   SparkKidSetup.gate(SB) is called by every world opener (sbx.js Arctic, areas-loader Reef, egypt3d/savannah3d hooks, the 2D picker)
   before the world mounts; it resolves at once when there is nothing to do. */
(function(){"use strict";if(window.SparkKidSetup) return;
var LINES={age:"How old are you? Tap your age!",look:"Make your explorer! Tap the colors you like, then tap Let's go!",go:"Let's go, explorer!"};
var BANDS=[{k:"k",t:"4-6",h:.62},{k:"e",t:"7-9",h:.74},{k:"u",t:"10-12",h:.86},{k:"t",t:"13+",h:1}];
var REP={k:6,e:8,u:11,t:13};
function say(t){try{if(window.SparkVoice) SparkVoice.say(t,{owner:"setup",kind:"setup"})}catch(e){}}
function log(k,o){try{(window.__sbxLog=window.__sbxLog||[]).push(Object.assign({t:Math.round(performance.now()),kind:k},o||{}))}catch(e){}}
var css=".ks-ov{position:fixed;inset:0;z-index:2147483200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,22px);"+
 "background:radial-gradient(ellipse at 50% 30%,#2b4f7e 0%,#0b1a30 75%);color:#fff;font:700 20px/1.2 system-ui,sans-serif;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));touch-action:manipulation;-webkit-user-select:none;user-select:none}"+
 ".ks-ttl{font-size:clamp(24px,4.4vh,40px);text-align:center;text-shadow:0 2px 8px #0008}"+
 ".ks-ages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(8px,2vw,22px);width:min(920px,96vw)}"+
 "@media(max-width:600px){.ks-ages{grid-template-columns:repeat(2,minmax(0,1fr));width:min(420px,94vw)}}"+
 ".ks-age{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;aspect-ratio:3/4;min-height:150px;border:5px solid #fff;border-radius:26px;background:linear-gradient(#bfe4ff,#7cc0f2);cursor:pointer;padding:10px 6px;box-shadow:0 8px 22px #0007;color:#10243e}"+
 ".ks-age svg{width:76%;flex:1 1 auto;min-height:0}.ks-age b{font-size:clamp(26px,4.6vh,44px);line-height:1}.ks-age:active{transform:scale(.96)}"+
 ".ks-look{display:flex;align-items:center;justify-content:center;gap:clamp(12px,3vw,40px);width:min(980px,98vw);flex:1 1 auto;min-height:0}"+
 "@media(max-width:700px){.ks-look{flex-direction:column;gap:10px}}"+
 ".ks-prev{position:relative;width:min(46vw,440px);height:min(62vh,560px);border-radius:28px;background:radial-gradient(circle at 50% 35%,#fff6 0%,#ffffff12 60%,#0000 70%)}"+
 "@media(max-width:700px){.ks-prev{width:min(80vw,340px);height:min(40vh,360px)}}"+
 ".ks-prev canvas{position:absolute;inset:0;width:100%!important;height:100%!important}.ks-prev svg.ks-fb{position:absolute;inset:8%;width:84%;height:84%}"+
 ".ks-rows{display:flex;flex-direction:column;gap:clamp(8px,1.6vh,16px)}"+
 ".ks-row{display:flex;align-items:center;gap:8px;background:#ffffff1f;border-radius:999px;padding:6px 10px}"+
 ".ks-ico{width:46px;height:46px;flex:0 0 auto}.ks-sw{width:clamp(44px,6.4vh,58px);height:clamp(44px,6.4vh,58px);border-radius:50%;border:4px solid #fff8;cursor:pointer;padding:0;box-shadow:0 3px 8px #0006}"+
 ".ks-sw.on{border-color:#fff;outline:4px solid #3ee07a;outline-offset:2px}"+
 "@media(max-width:700px){.ks-sw{width:42px;height:42px;border-width:3px}.ks-ico{width:36px;height:36px}.ks-row{gap:6px;padding:5px 8px}}"+
 ".ks-go{display:flex;align-items:center;gap:12px;font:800 clamp(24px,4vh,36px)/1 system-ui,sans-serif;color:#10243e;background:#3ee07a;border:5px solid #fff;border-radius:999px;padding:14px 34px 14px 26px;cursor:pointer;box-shadow:0 8px 22px #0007;animation:ksGo 2.2s ease-in-out infinite}"+
 ".ks-go svg{width:40px;height:40px}@keyframes ksGo{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@media (prefers-reduced-motion:reduce){.ks-go{animation:none}}";
function addCss(){if(document.getElementById("ks-css")) return;var s=document.createElement("style");s.id="ks-css";s.textContent=css;document.head.appendChild(s)}
function el(t,c,h){var e=document.createElement(t);if(c) e.className=c;if(h!=null) e.innerHTML=h;return e}
function tapBtn(cls,label,html,fn){var b=el("button",cls,html);b.type="button";b.setAttribute("aria-label",label);var t=0;
  function go(e){if(e){e.preventDefault();e.stopPropagation()}if(Date.now()-t<450) return;t=Date.now();fn()}
  b.addEventListener("click",go);b.addEventListener("pointerdown",function(e){e.stopPropagation()});return b}
/* a kid figure that gets taller per band: the picture is the button (numbers are only an extra) */
function kidSvg(h){var H=150*h,y=170-H;return '<svg viewBox="0 0 120 180" aria-hidden="true"><ellipse cx="60" cy="172" rx="34" ry="6" fill="#0003"/>'+
  '<g transform="translate(60 '+y.toFixed(1)+') scale('+h.toFixed(2)+')"><circle cx="0" cy="26" r="24" fill="#f6c4a4" stroke="#10243e" stroke-width="3"/><path d="M-24 22c2-22 46-22 48 0-10-8-38-8-48 0z" fill="#723717"/>'+
  '<circle cx="-8" cy="28" r="3.4" fill="#10243e"/><circle cx="8" cy="28" r="3.4" fill="#10243e"/><path d="M-8 38q8 7 16 0" stroke="#10243e" stroke-width="3" fill="none" stroke-linecap="round"/>'+
  '<rect x="-20" y="52" width="40" height="52" rx="14" fill="#ff8a3d" stroke="#10243e" stroke-width="3"/><rect x="-18" y="102" width="14" height="46" rx="7" fill="#2f6fb3"/><rect x="4" y="102" width="14" height="46" rx="7" fill="#2f6fb3"/></g></svg>'}
var ICO={skin:'<svg class="ks-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 44V22a4 4 0 0 1 8 0v-8a4 4 0 0 1 8 0v4a4 4 0 0 1 8 0v14c0 8-5 12-12 12z" fill="#f6c4a4" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>',
 hair:'<svg class="ks-ico" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="28" r="14" fill="#f6c4a4"/><path d="M8 28C8 10 40 10 40 28c-6-8-26-10-32 0z" fill="#723717" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>',
 eyes:'<svg class="ks-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24c10-14 30-14 40 0-10 14-30 14-40 0z" fill="#fff"/><circle cx="24" cy="24" r="8" fill="#3a6fb0"/><circle cx="24" cy="24" r="3.5" fill="#10243e"/></svg>'};
var GO='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#10243e"/><path d="M18 13l13 11-13 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function store(SB){return SB&&SB.store}
function needs(SB){var st=store(SB);if(!st) return false;var p=st.profile();return !!(p&&p.setupPending&&!p.lookDone)}
function stepAge(ov){return new Promise(function(done){ov.innerHTML="";ov.appendChild(el("div","ks-ttl",'<span aria-hidden="true">?</span>'));
  var row=el("div","ks-ages");row.setAttribute("role","group");row.setAttribute("aria-label","How old are you?");
  BANDS.forEach(function(B){row.appendChild(tapBtn("ks-age","Ages "+B.t,kidSvg(B.h)+"<b>"+B.t+"</b>",function(){log("kidsetupage",{band:B.k});done(B.k)}))});
  ov.appendChild(row);say(LINES.age)})}
function fallbackSvg(look){var L=window.SparkKidLook,c=function(p){return (look&&look[p]&&L.colorOf(p,look[p]))||L.OPTS[p][0].c};
  return '<svg class="ks-fb" viewBox="0 0 200 220" aria-hidden="true"><circle cx="100" cy="100" r="74" fill="'+c("skin")+'"/><path d="M24 96C26 20 174 20 176 96c-20-30-132-34-152 0z" fill="'+c("hair")+'"/>'+
   '<ellipse cx="72" cy="108" rx="14" ry="16" fill="#fff"/><ellipse cx="128" cy="108" rx="14" ry="16" fill="#fff"/><circle cx="72" cy="110" r="9" fill="'+c("eyes")+'"/><circle cx="128" cy="110" r="9" fill="'+c("eyes")+'"/>'+
   '<path d="M78 142q22 18 44 0" stroke="#10243e" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'}
function stepLook(ov,pid){return new Promise(function(done){var L=window.SparkKidLook,W=window.SparkWardrobe;ov.innerHTML="";
  var look={},cur=W&&W.look?W.look(pid)||{}:{};["skin","hair","eyes"].forEach(function(p){if(cur[p]) look[p]=cur[p]});
  ov.appendChild(el("div","ks-ttl",'<span aria-hidden="true">&#10024;</span>'));
  var wrap=el("div","ks-look"),prev=el("div","ks-prev"),rows=el("div","ks-rows");wrap.appendChild(prev);wrap.appendChild(rows);ov.appendChild(wrap);
  var view=null,fb=null;function paint(){if(view){try{view.set(look)}catch(e){}}else{prev.innerHTML=fallbackSvg(look)}}
  ["skin","hair","eyes"].forEach(function(part){var r=el("div","ks-row");r.setAttribute("role","group");r.setAttribute("aria-label",part);r.innerHTML=ICO[part];
    L.OPTS[part].forEach(function(o,i){var sw=tapBtn("ks-sw"+(((look[part]||L.OPTS[part][0].id)===o.id)?" on":""),part+" colour "+(i+1),"",function(){look[part]=o.id;
        [].forEach.call(r.querySelectorAll(".ks-sw"),function(x){x.classList.toggle("on",x===sw)});if(W&&W.setLook) W.setLook(pid,part,o.id);log("kidsetuplook",{part:part,id:o.id});paint()});
      sw.style.background=o.c;sw.dataset.part=part;sw.dataset.lid=o.id;r.appendChild(sw)});rows.appendChild(r)});
  ov.appendChild(tapBtn("ks-go","Let's go",GO+"<span>Let's go</span>",function(){if(view){try{view.dispose()}catch(e){}}log("kidsetupgo",{look:L.clean(look)});done(look)}));
  paint();say(LINES.look);
  /* the big preview: the real 3D kid (lazy module; on any failure the picture face stays) */
  import(new URL("kid-setup-3d.js?v=1",document.baseURI).href).then(function(m){if(!prev.isConnected) return null;return m.mount(prev,{phone:false})})
   .then(function(v){if(!v) return;if(!prev.isConnected){v.dispose();return}view=v;[].forEach.call(prev.querySelectorAll("svg.ks-fb"),function(x){x.remove()});paint();log("kidsetup3d",{ok:1})},function(e){log("kidsetup3d",{ok:0,err:String(e&&e.message||e).slice(0,80)})})})}
var running=null;
/* run the flow for the ACTIVE kid of SB.store (must be a profile with setupPending) */
function run(SB){if(running) return running;var st=store(SB);var p=st&&st.profile();if(!p) return Promise.resolve(false);var pid=st.doc().active;addCss();
  var ov=el("div","ks-ov");ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Make your explorer");document.body.appendChild(ov);
  ["pointerdown","pointerup","click","keydown","touchstart"].forEach(function(t){ov.addEventListener(t,function(e){e.stopPropagation()})});
  log("kidsetup",{pid:pid,start:1});
  var wd=import(new URL("wardrobe.js?v=9",document.baseURI).href).catch(function(){return null});
  running=(p.ageBand?Promise.resolve(p.ageBand):stepAge(ov)).then(function(band){var q=st.profile();if(q&&!q.ageBand){q.ageBand=band;q.age=REP[band];st.save(true);
      try{window.SparkAge&&SparkAge.refreshKid&&SparkAge.refreshKid("kid")}catch(e){}}
    return wd}).then(function(){return stepLook(ov,pid)}).then(function(){var q=st.profile();if(q){q.lookDone=true;delete q.setupPending;st.save(true)}
    say(LINES.go);ov.remove();running=null;log("kidsetup",{pid:pid,done:1});return true},function(e){try{ov.remove()}catch(x){}running=null;
    var q=st.profile();if(q){q.lookDone=true;delete q.setupPending;st.save(true)}return false});
  return running}
/* gate(SB): a device with no kid yet makes the kid HERE (same as the world openers would, first animal, at the device age) and runs the flow;
   an active kid with setupPending runs the flow; anything else resolves at once. Never blocks a world on an error. */
function gate(SB){try{var st=store(SB);if(!st) return Promise.resolve(false);st.reload&&st.reload();
    if(!st.profile()){var ps=st.profiles();if(ps.length){st.setActive(ps[0].id)}else{var pics=SB.regions&&SB.regions.arctic&&SB.regions.arctic.pics;var A=window.SparkAge;st.newProfile(pics?Object.keys(pics)[0]:"fox",A?A.deviceAge:6)}}
    if(!needs(SB)) return Promise.resolve(false);try{var H=document.documentElement;H.classList.remove("sbx-boot")}catch(e){}return run(SB)}catch(e){return Promise.resolve(false)}}
window.SparkKidSetup={gate:gate,run:run,needs:needs,LINES:LINES,BANDS:BANDS,get running(){return !!running}};
})();
