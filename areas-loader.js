(function(){/* spark17 (Tester prod pass, 11/16): in-game Back from a 3D world returns to the continent map it belongs to (Savannah already did);
   falls back to the Solar System home when the Earth engine isn't there. Shared by Arctic (sbx.js), Reef (here) and Egypt (egypt3d/hook.js). */
  function solar(){try{var go=window.returnToSolarSystemHome||window.goPlatformHome;if(go) go({announce:false});else if(typeof window.show==="function") window.show("home")}catch(e){}}
  window.SparkBackToMap=function(continent){try{if(continent&&window.EarthEngine&&EarthEngine.selectContinent){if(typeof window.show==="function") window.show("world");EarthEngine.selectContinent(continent);return true}}catch(e){}solar();return false}})();
/* Spark Studio areas: tiny always-loaded loader. Catches a tap on an Earth [data-env] area button (capture phase, like station.js does for the
   Research Station) and, when that continent/area is in the registry, lazy-loads the area engine (areas2.css + art + engine + activities) and opens it.
   Savannah and every other area keep their normal behaviour. Nothing else downloads until a child opens an area. */
(function(){
  var REG={"Africa/Sahara":"sahara","North America/Arctic":"arctic","Australia/Reef":"reef"};
  var V="15", loading=null;
  function cont(){try{return window.EarthEngine&&window.EarthEngine.getState().continent||""}catch(e){return ""}}
  function js(src){return new Promise(function(ok,no){var s=document.createElement("script");s.src=src+"?v="+V;s.onload=ok;s.onerror=function(){no(new Error("load "+src))};document.head.appendChild(s)})}
  function css(href){if(document.querySelector('link[data-areas]'))return;var l=document.createElement("link");l.rel="stylesheet";l.href=href+"?v="+V;l.setAttribute("data-areas","1");document.head.appendChild(l)}
  function ready(){
    if(window.SparkAreas) return Promise.resolve(window.SparkAreas);
    if(!loading){css("areas2.css");loading=js("areas2-art.js").then(function(){return js("areas2.js")}).then(function(){return js("areas2-act.js")}).then(function(){return js("areas2-desert.js")}).then(function(){return js("areas2-reef.js")}).then(function(){return window.SparkAreas},function(e){loading=null;throw e})}
    return loading;
  }
  function openClassic(id){return ready().then(function(A){return A.open(id)})}
  /* Sandbox pilot (Sandbox spec §10.12): regions in SBX open the new sandbox engine; ?sbx=1 / ?sbx=0 wins, then localStorage.sparkSbxV1, then on */
  var SBX={"North America/Arctic":"arctic"},SV="11",sbxLoading=null;
  function sbxIds(){var o={};for(var k in SBX) o[SBX[k]]=1;return o}
  function sbxOn(id){if(!sbxIds()[id]) return false;var q=null;try{q=new URLSearchParams(location.search).get("sbx")}catch(e){}
    if(q==="1") return true;if(q==="0") return false;var l=null;try{l=localStorage.getItem("sparkSbxV1")}catch(e){}if(l==="0") return false;if(l==="1") return true;return true}
  function sjs(src){return new Promise(function(ok,no){var s=document.createElement("script");s.src=src+"?v="+SV;s.onload=ok;s.onerror=function(){no(new Error("load "+src))};document.head.appendChild(s)})}
  function sbxReady(id){if(window.SparkSandbox&&window.SparkSandbox.regions&&window.SparkSandbox.regions[id]) return Promise.resolve(window.SparkSandbox);
    if(!sbxLoading){if(!document.querySelector('link[data-sbx]')){var l=document.createElement("link");l.rel="stylesheet";l.href="sbx.css?v="+SV;l.setAttribute("data-sbx","1");document.head.appendChild(l)}
      sbxLoading=sjs("sbx.js").then(function(){return sjs("sbx-"+id+".js")}).then(function(){return window.SparkSandbox},function(e){sbxLoading=null;throw e})}
    return sbxLoading}
  /* iOS only lets audio start inside the tap: create/resume the shared AudioContext synchronously here */
  function unlock(){try{if(window.S&&window.S.voice===false) return;var a=window.__sbxAC;if(!a){var C=window.AudioContext||window.webkitAudioContext;if(C) a=window.__sbxAC=new C()}if(a&&a.state==="suspended") a.resume()}catch(e){}}
  /* Reef 3D (Allen 10/21, preview): the Reef tile opens the 3D reef (site/reef3d). ?reef3d=0 (or localStorage sparkReef3dOn=0) keeps the classic reef.
     Uses the sandbox store only for the active profile + shared coins (no picker). */
  function reef3dOn(){try{if(new URLSearchParams(location.search).get("reef3d")==="0"||localStorage.getItem("sparkReef3dOn")==="0") return false}catch(e){}return true}
  function reefLoad(on){var d=document.querySelector(".r3d-load");if(!on){if(d) d.remove();return}if(d) return;d=document.createElement("div");d.className="r3d-load";d.setAttribute("aria-label","Loading the reef");
    d.style.cssText="position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#7fe0ff,#1f8fb3 60%,#0d3b52);transition:opacity .5s";
    d.innerHTML='<svg viewBox="0 0 120 120" style="width:min(40vmin,220px)"><style>@keyframes r3lb{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes r3lf{from{transform:translateX(-30px)}to{transform:translateX(30px)}}.r3lb{animation:r3lb 1.6s ease-in-out infinite}.r3lf{animation:r3lf 2s ease-in-out infinite alternate}</style><g class="r3lb"><path d="M14 66h92l-14 20H28z" fill="#fff"/><rect x="40" y="44" width="30" height="22" rx="3" fill="#ffcf3a"/><path d="M60 66V24l24 30z" fill="#fff"/></g><path d="M0 92q15-8 30 0t30 0 30 0 30 0v28H0z" fill="#ffffff55"/><g class="r3lf"><path d="M50 106c6-6 16-6 22 0-6 6-16 6-22 0zm22 0l8-6v12z" fill="#ff8a3d"/></g></svg>';
    document.body.appendChild(d);d.style.setProperty("--x","1");setTimeout(function(){reefLoad(false)},25000)}
  var reefBusy=null;function openReef3d(){if(reefBusy||document.querySelector(".r3d-root")) return reefBusy||Promise.resolve(null);unlock();reefLoad(true);return reefBusy=sbxReady("arctic").then(function(SB){return window.SparkKidSetup?SparkKidSetup.gate(SB).then(function(){return SB},function(){return SB}):SB}).then(function(SB){SB.store.reload();var st=SB.store;if(!st.profile()){var ps=st.profiles();if(ps.length) st.setActive(ps[0].id);else st.newProfile(Object.keys(SB.regions.arctic.pics)[0],4)}
    var root=document.createElement("div");root.className="sbx r3d-root";root.setAttribute("role","dialog");root.setAttribute("aria-label","Coral reef");document.body.appendChild(root);document.body.classList.add("spark-area","sbx-on");
    ["arctic3d/a3d.css?v=23","reef3d/r3d.css?v=28"].forEach(function(h){if(!document.querySelector('link[href="'+h+'"]')){var l=document.createElement("link");l.rel="stylesheet";l.href=h;document.head.appendChild(l)}});
    var p=st.profile();var h=null;function close(){try{h&&h.dispose()}catch(e){}root.remove();document.body.classList.remove("spark-area","sbx-on");window.SparkBackToMap("Australia")}
    return import(new URL("reef3d/r3d.js?v=120",document.baseURI).href).then(function(m){/* spark11: a throwing mount (no WebGL) clears the reef root before the classic fallback */try{h=m.mount(root,{pid:st.doc().active,age:p.age||4,coins:function(){return SB.econ.balance()},earn:function(n,item){SB.econ.earn(n,{src:"job",region:"reef",item:item});SB.store.save(true)},spend:function(n,item){var r=SB.econ.spend(n,{item:item,region:"reef"});SB.store.save(true);return !!r.ok},onExit:close})}catch(e){reefBusy=null;reefLoad(false);try{root.remove()}catch(x){}document.body.classList.remove("spark-area","sbx-on");try{[].forEach.call(document.body.children,function(c){if(c.tagName==="SCRIPT"||c.tagName==="STYLE"||c.tagName==="LINK")return;if(c.style&&c.style.display==="none") c.style.display=""})}catch(x){}throw e}reefBusy=null;return h},function(e){reefBusy=null;reefLoad(false);root.remove();document.body.classList.remove("sbx-on");throw e})},function(e){reefBusy=null;reefLoad(false);throw e})}
  /* Ancient Egypt 3D (Allen 10/28, preview E1): egypt3d/hook.js renames the Africa > Sahara tile "Ancient Egypt" and opens site/egypt3d.
     ?egypt3d=0 / ?sah3d=0 (or localStorage sparkEgypt3dOn=0) keeps the classic Sahara. The hook loads with this file; a tap before it has loaded waits for it. */
  /* M4: a hook download that fails is fetched once more; an Egypt open that fails is tried once more before the classic camp */
  function egLoad(n){return new Promise(function(ok){if(window.SparkEgypt3d) return ok(window.SparkEgypt3d);var s=document.createElement("script");s.src="egypt3d/hook.js?v=153"+(n?"&r="+n:"");s.onload=function(){ok(window.SparkEgypt3d||null)};s.onerror=function(){s.remove();ok(null)};(document.head||document.documentElement).appendChild(s)})}
  var egHook=egLoad(0),egTry=0;function egGet(){return egHook.then(function(E){if(E||egTry) return E;egTry=1;return egHook=new Promise(function(r){setTimeout(r,700)}).then(function(){return egLoad(1)})})}
  function openEgypt(){return egGet().then(function(E){if(!E||!E.on()) return openClassic("sahara");return E.open().catch(function(e){try{console.warn("egypt3d retry",e)}catch(x){}return new Promise(function(r){setTimeout(r,1200)}).then(function(){return E.open()})}).catch(function(e){try{console.error("egypt3d failed",e)}catch(x){}return openClassic("sahara")})})}
  function open(id){if(id==="sahara") return openEgypt();if(id==="reef"&&reef3dOn()) return openReef3d().catch(function(e){try{console.error("reef3d failed",e)}catch(x){}return openClassic(id)});if(sbxOn(id)){unlock();return sbxReady(id).then(function(SB){return SB.open(id)}).catch(function(e){/* spark11 (Tester kxgap): the Arctic sandbox has no classic fallback; never leave a blank screen - same Retry box as the Savannah, back on the continent map */var C={arctic:"North America"}[id]||"Africa";if(window.SparkAreaRetry){window.SparkAreaRetry({area:id,continent:C,label:"Try again",retry:function(){return open(id)},err:e});return null}throw e})}return openClassic(id)}
  window.addEventListener("click",function(e){
    var b=e.target&&e.target.closest&&e.target.closest("[data-env]");
    if(!b) return;
    var id=REG[cont()+"/"+b.getAttribute("data-env")];
    if(!id) return;
    e.preventDefault();e.stopImmediatePropagation();
    open(id).catch(function(){});
  },true);
  window.SparkAreasLoader={open:open,openClassic:openClassic,sbxOn:sbxOn,sandbox:SBX,registry:REG,has:function(c,e){return !!REG[c+"/"+e]}};
})();
