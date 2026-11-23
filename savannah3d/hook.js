/* Savannah 3D (Allen 10/21, preview): the Africa > Savannah tile opens the 3D Savannah "Ranger Camp" (site/savannah3d).
   Self-contained hook (no edits to areas-loader.js): a capture-phase click listener on window catches [data-env="Savannah"] before
   earth-core's own onclick. The classic 2D Savannah is gone (spark7). ?savannah3d=0 / sav3d=0 / sparkSavannah3dOn=0 no longer
   route to 2D. A 3D load failure shows a retry and returns to the Africa continent view. */
(function(){
  if(window.__sav3dHook) return;window.__sav3dHook=1;
  function on(){return true}/* 2D flags ignored — 3D is the only Savannah */
  var SV="7",busy=null;
  function childAge(){try{var A=window.SparkAge;if(A&&A.age)return A.age}catch(e){}try{var n=+localStorage.getItem("sparkAge");if(n>=3&&n<=15)return n}catch(e){}return 6}
  /* P19: latch testfast/qa/s3dpr on first script load so Solar→Earth→Africa redirects that drop share params keep play flags */
  try{var _q0=new URLSearchParams(location.search);
    if(_q0.get("testfast")==="1"){sessionStorage.setItem("sparkTestfast","1");sessionStorage.setItem("sparkS3dTestfast","1");localStorage.setItem("sparkTestfastLatch","1")}
    if(_q0.get("qa"))sessionStorage.setItem("sparkS3dQa",_q0.get("qa"));
    /* P30 test-only teleport: latch ?tp for this one page load (refuge.js uses it once, then clears it) */if(_q0.get("tp"))sessionStorage.setItem("sparkS3dTp",_q0.get("tp"));
    if(_q0.get("s3dpr"))sessionStorage.setItem("sparkS3dPr",_q0.get("s3dpr"));
  }catch(e){}
  function sjs(src){return new Promise(function(ok,no){if(document.querySelector('script[data-s3d="'+src+'"]')) return ok();var s=document.createElement("script");s.src=src+"?v="+SV;s.setAttribute("data-s3d",src);s.onload=ok;s.onerror=function(){no(new Error("load "+src))};document.head.appendChild(s)})}
  function sbx(){if(window.SparkSandbox&&window.SparkSandbox.regions&&window.SparkSandbox.regions.arctic) return Promise.resolve(window.SparkSandbox);
    if(!document.querySelector('link[data-sbx]')){var l=document.createElement("link");l.rel="stylesheet";l.href="sbx.css?v="+SV;l.setAttribute("data-sbx","1");document.head.appendChild(l)}
    return sjs("sbx.js").then(function(){return sjs("sbx-arctic.js")}).then(function(){return window.SparkSandbox})}
  function unlock(){try{var a=window.__sbxAC;if(!a){var C=window.AudioContext||window.webkitAudioContext;if(C) a=window.__sbxAC=new C()}if(a&&a.state==="suspended") a.resume()}catch(e){}
    /* iOS: prime one audio element inside the tap so Spark's clips can play *//* spark12: prime SparkVoice's shared element */try{if(window.SparkVoice) SparkVoice.prime()}catch(e){}}
  /* P19: fail-open loading — never block pointer forever; prefer play over infinite hyena/paw wait */
  function load(v){var d=document.querySelector(".s3d-load");
    if(!v){if(d){d.style.pointerEvents="none";d.style.opacity="0";d.classList.add("out");setTimeout(function(){try{d.remove()}catch(e){}},450)}return}
    if(d) return;d=document.createElement("div");d.className="s3d-load";window.__s3dSawLoad=1;d.setAttribute("aria-label","Loading the savannah");
    d.style.cssText="position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:auto;background:linear-gradient(#ffb86b,#ffd98a 45%,#e9b864 62%,#b98a3e);transition:opacity .45s";
    /* P38 (Allen): ONE Savannah loader on every entry path: an inline-SVG sunset savannah scene (acacia, elephant, giraffe, zebra, river + bridge) + the paw-print bar.
       No network image (the old <img spark-guide.webp> only showed when it had downloaded before the fade = Spark 'sometimes'). */
    d.setAttribute('data-scene','savannah-sunset');
    d.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;width:100%">'+'<svg class="s3d-load-scene" viewBox="0 0 400 300" style="width:min(96vw,620px);max-height:62vh;overflow:visible" role="img" aria-label="Sunset over the savannah">'+
      '<defs><radialGradient id="s3lsun"><stop offset="0" stop-color="#fff6d2"/><stop offset=".55" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb86b" stop-opacity="0"/></radialGradient><linearGradient id="s3lriv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a6"/><stop offset=".45" stop-color="#7fb2bf"/><stop offset="1" stop-color="#7fb2bf" stop-opacity="0"/></linearGradient></defs>'+
      '<circle cx="200" cy="150" r="110" fill="url(#s3lsun)"/><circle cx="200" cy="152" r="52" fill="#fff3c4"/>'+
      '<path d="M-2400 168 H0 Q50 150 105 160 T210 156 T320 152 T400 160 H2800 V2600 H-2400z" fill="#c98a3c" opacity=".55"/><path d="M-2400 176 H0 Q80 166 170 172 T400 170 H2800 V2600 H-2400z" fill="#b27a30"/>'+
      '<path d="M196 172 Q186 190 204 206 Q226 228 196 252 Q170 276 176 300 Q150 360 110 430 H350 Q290 360 272 300 Q246 276 266 252 Q290 226 250 204 Q226 190 212 172z" fill="url(#s3lriv)" opacity=".95"/>'+
      '<g fill="#4a2c12" stroke="#4a2c12">'+
      /* bridge over the river */'<path d="M160 226 Q228 198 300 226" fill="none" stroke-width="7"/><path d="M160 216 Q228 188 300 216" fill="none" stroke-width="2.5"/>'+[0,1,2,3,4,5,6].map(function(i){var x=166+i*21,y=226-Math.sin((x-160)/140*Math.PI)*21;return '<path d="M'+x+' '+(y-10)+'V'+y+'" stroke-width="2.2"/>'}).join('')+
      /* acacia */'<path d="M74 214 L80 168 Q66 152 50 150 M80 170 Q92 152 110 148 M79 186 Q70 176 60 172" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M22 152 Q40 132 82 134 Q126 130 142 148 Q118 156 82 154 Q46 158 22 152z" stroke="none"/>'+
      /* elephant */'<g stroke="none"><ellipse cx="124" cy="196" rx="21" ry="14"/><rect x="107" y="200" width="7" height="17" rx="2"/><rect x="118" y="202" width="7" height="15" rx="2"/><rect x="128" y="202" width="7" height="15" rx="2"/><rect x="137" y="200" width="7" height="17" rx="2"/><circle cx="104" cy="190" r="10"/><ellipse cx="110" cy="190" rx="7" ry="10" fill="#5e3a14"/><path d="M96 192 Q92 204 94 214 L98 214 Q97 204 101 196z"/><path d="M145 192 q6 4 5 12" fill="none" stroke="#4a2c12" stroke-width="1.5"/></g>'+
      /* zebra */'<g stroke="none"><ellipse cx="330" cy="200" rx="13" ry="6.5"/><rect x="319" y="202" width="2.6" height="14"/><rect x="323.5" y="203" width="2.6" height="13"/><rect x="335" y="203" width="2.6" height="13"/><rect x="339.5" y="202" width="2.6" height="14"/><path d="M318 199 L311 186 L306 184 L304 190 L310 192 L314 202z"/><path d="M311 184 l2-4 2 4" /><path d="M343 198 q4 4 3 10" fill="none" stroke="#4a2c12" stroke-width="1.2"/></g>'+
      '<g stroke="#b27a30" stroke-width="1.3" opacity=".8"><path d="M324 195v10M329 194v11M334 194v11M339 195v9M313 190l3 3M310 188l3 3"/></g>'+
      /* giraffe */'<g stroke="none"><ellipse cx="282" cy="170" rx="16" ry="8" transform="rotate(-8 282 170)"/><rect x="270" y="172" width="3" height="30"/><rect x="276" y="174" width="3" height="28"/><rect x="287" y="172" width="3" height="30"/><rect x="293" y="170" width="3" height="32"/><path d="M268 168 L262 124 L268 122 L278 164z"/><path d="M259 122 Q262 115 271 118 L272 124 Q266 126 259 125z"/><path d="M265 117l-1-6M269 117l1-6" stroke="#4a2c12" stroke-width="1.5"/><path d="M297 168 q4 6 2 14" fill="none" stroke="#4a2c12" stroke-width="1.3"/></g>'+
      '</g><path d="M-2400 214 H0 Q100 206 200 214 T400 212 H2800 V2600 H-2400z" fill="#8a5a24" opacity=".35"/><path d="M-2400 330 Q-200 300 200 318 T2800 312 V2600 H-2400z" fill="#7a4c1c" opacity=".45"/></svg>'+
      '<svg viewBox="0 0 200 30" style="width:min(60vw,320px);margin-top:1.5vh" aria-hidden="true"><style>@keyframes s3lp{from{opacity:.15}to{opacity:1}}.s3lp{opacity:.15;animation:s3lp .6s forwards}</style>'+
      [0,1,2,3,4].map(function(i){return '<g class="s3lp" style="animation-delay:'+(i*1.1)+'s"><circle cx="'+(44+i*28)+'" cy="20" r="5" fill="#fff"/><circle cx="'+(38+i*28)+'" cy="12" r="2.4" fill="#fff"/><circle cx="'+(44+i*28)+'" cy="9" r="2.4" fill="#fff"/><circle cx="'+(50+i*28)+'" cy="12" r="2.4" fill="#fff"/></g>'}).join('')+'</svg>'+'</div>';
    document.body.appendChild(d);
    /* P19: 8s stop eating clicks; 12s hard-hide (was 25s) — fail-open over infinite wait */
    setTimeout(function(){var x=document.querySelector(".s3d-load");if(x){x.style.pointerEvents="none"}},8000);
    setTimeout(function(){load(false)},12000)}
  function goAfrica(){goCont("Africa")}
  function goCont(c){try{if(window.EarthEngine&&EarthEngine.selectContinent) EarthEngine.selectContinent(c)}catch(e){}}
  /* spark11 (Tester kxgap): ONE failure path for every 3D area and every entry route (pin tap, Retry).
     Clears any half-built 3D root/loader, puts the continent map back right away, and shows "Let's try that again" + Retry. */
  var ROOTS=".s3d-root,.s3d-load,.eg3d-root,.eg3d-load,.r3d-root,.r3d-load,.a3d-root";
  function areaRetry(o){o=o||{};var cont=o.continent||"Africa",retry=o.retry||open,err=o.err;
    try{document.querySelectorAll(ROOTS).forEach(function(r){r.remove()})}catch(e){}
    try{document.body.classList.remove("spark-area","sbx-on")}catch(e){}
    try{[].forEach.call(document.body.children,function(c){if(c.tagName==="SCRIPT"||c.tagName==="STYLE"||c.tagName==="LINK")return;if(c.classList&&c.classList.contains("s3d-retry"))return;if(c.style&&c.style.display==="none") c.style.display=""})}catch(e){}
    try{if(typeof show==="function") show("world")}catch(e){}
    goCont(cont);
    try{var old=document.querySelector(".s3d-retry");if(old) old.remove()}catch(e){}
    var box=document.createElement("div");box.className="s3d-retry";box.setAttribute("role","dialog");box.setAttribute("aria-label",o.label||"Try again");box.setAttribute("data-area",o.area||"savannah");
    box.style.cssText="position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:2147483600;max-width:min(420px,90vw);background:#10243ef2;color:#fff;border:2px solid #ffd46a;border-radius:20px;padding:18px 20px;text-align:center;box-shadow:0 18px 40px #0008;font:700 18px/1.35 system-ui,sans-serif";
    box.innerHTML='<p style="margin:0 0 14px">Let\'s try that again</p><button type="button" style="min-height:44px;padding:8px 18px;border-radius:999px;border:2px solid #fff;background:#1f9d5c;color:#fff;font:800 16px system-ui;cursor:pointer">Retry</button>';
    document.body.appendChild(box);
    /* spark11: tapping anything else (Back, another pin) dismisses the Retry box */setTimeout(function(){function f(ev){if(!box.isConnected||!box.contains(ev.target)){try{box.remove()}catch(x){}document.removeEventListener("pointerdown",f,true)}}document.addEventListener("pointerdown",f,true)},0);
    try{if(window.SparkVoice&&SparkVoice.say) SparkVoice.say("Let's try that again",{kind:"line",id:"savannah-retry"})}catch(e){}
    box.querySelector("button").addEventListener("click",function(){try{box.remove()}catch(e){}try{Promise.resolve(retry()).catch(function(){})}catch(e){}});
    try{if(err&&String(err.message||err)!=="forced-fail")console.error((o.area||"savannah")+"3d failed",err||"")}catch(e){}
    window.__areaFail={area:o.area||"savannah",continent:cont,at:Date.now()}}
  function showRetry(err){
    try{load(false)}catch(e){}
    /* dispose restores main/.top that s3d hid (display:none). Do not use hook close()/onExit — that goes to Solar home. */
    try{if(window.__s3dHandle&&typeof window.__s3dHandle.dispose==="function") window.__s3dHandle.dispose()}catch(e){}
    areaRetry({area:"savannah",continent:"Africa",label:"Try the Savannah again",retry:open,err:err});
  }
  /* spark10 fix 1 (Tester 5hhz, prod too): in-game Back returns to the Africa map the child came from, not the Solar System.
     The Africa intro is once-per-session (earth-core), so it is not spoken again here. Falls back to Solar home if Earth isn't available. */
  function backToAfrica(){try{if(window.EarthEngine&&EarthEngine.selectContinent){if(typeof window.show==="function") window.show("world");EarthEngine.selectContinent("Africa");return}}catch(e){}home()}
  function home(){try{var go=window.returnToSolarSystemHome||window.goPlatformHome;if(go) go({announce:false});else if(typeof window.show==="function") window.show("home")}catch(e){}}
  function open(){if(window.__s3dForceFail){showRetry(new Error("forced-fail"));return Promise.resolve(null)}if(busy||document.querySelector(".s3d-root")) return busy||Promise.resolve(null);unlock();load(true);
    return busy=sbx().then(function(SB){return window.SparkKidSetup?SparkKidSetup.gate(SB).then(function(){return SB},function(){return SB}):SB}).then(function(SB){SB.store.reload();var st=SB.store,cur=childAge();if(!st.profile()){var ps=st.profiles();if(ps.length) st.setActive(ps[0].id);else st.newProfile(Object.keys(SB.regions.arctic.pics)[0],cur)}
      var root=document.createElement("div");root.className="sbx s3d-root";root.setAttribute("role","dialog");root.setAttribute("aria-label","Savannah");document.body.appendChild(root);document.body.classList.add("spark-area","sbx-on");
      ["arctic3d/a3d.css?v=23","savannah3d/s3d.css?v=46"].forEach(function(h){if(!document.querySelector('link[href="'+h+'"]')){var l=document.createElement("link");l.rel="stylesheet";l.href=h;document.head.appendChild(l)}});
      var p=st.profile(),h=null;function close(){try{h&&h.dispose()}catch(e){}try{root.remove()}catch(e){}try{document.querySelectorAll(".s3d-root").forEach(function(n){n.remove()})}catch(e){}try{load(false)}catch(e){}document.body.classList.remove("spark-area","sbx-on");busy=null;backToAfrica()}
      /* P19: import timeout — never hang forever on module fetch under GPU/network pressure */
      var imp=import(new URL("savannah3d/s3d.js?v=177",document.baseURI).href);
      var timed=new Promise(function(_,no){setTimeout(function(){no(new Error("savannah3d import timeout"))},20000)});
      return Promise.race([imp,timed]).then(function(m){
        /* TEST-ONLY: keep ?testfast=1 across Savannah entry — session+local latch survives Back→Solar and Egypt hop. */
        var TF=/[?&]testfast=1(&|$)/.test(location.search);try{if(TF){sessionStorage.setItem("sparkTestfast","1");sessionStorage.setItem("sparkS3dTestfast","1");localStorage.setItem("sparkTestfastLatch","1")}else TF=sessionStorage.getItem("sparkTestfast")==="1"||sessionStorage.getItem("sparkS3dTestfast")==="1"||localStorage.getItem("sparkTestfastLatch")==="1";if(TF){sessionStorage.setItem("sparkTestfast","1");sessionStorage.setItem("sparkS3dTestfast","1");localStorage.setItem("sparkTestfastLatch","1")}}catch(e){}
        var tfc=200;var o=TF?{coins:function(){return tfc},earn:function(n){tfc+=n},spend:function(n){if(tfc<n)return false;tfc-=n;return true},testfast:1}:{coins:function(){return SB.econ.balance()},
          earn:function(n,item){SB.econ.earn(n,{src:"job",region:"savannah",item:item});SB.store.save(true)},spend:function(n,item){var r=SB.econ.spend(n,{item:item,region:"savannah"});SB.store.save(true);return !!r.ok}};
        o.pid=st.doc().active;o.age=cur;if(p&&p.age!==cur){p.age=cur;st.save(true)}o.onExit=close;
        return Promise.resolve().then(function(){return m.mount(root,o)}).then(function(handle){h=handle;busy=null;window.__s3dHandle=h;try{load(false)}catch(e){}return h})})
        /* spark11: a failed import OR a failed mount (e.g. no WebGL) lands here for every caller, so no route is left on a half-built navy root */
        .catch(function(e){busy=null;try{h&&h.dispose()}catch(x){}try{root.remove()}catch(x){}showRetry(e);return null})},function(e){busy=null;showRetry(e);return null})}
  window.addEventListener("click",function(e){if(!on()) return;var b=e.target&&e.target.closest&&e.target.closest('[data-env="Savannah"]');if(!b) return;
    e.preventDefault();e.stopImmediatePropagation();open().catch(function(err){showRetry(err)})},true);
  window.SparkSavannah3d={open:open,on:on,showRetry:showRetry};
  window.SparkAreaRetry=areaRetry;
})();
