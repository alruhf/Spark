/* Spark step 1: green rings + lockout, driven only by spark-map.js.
   - Playable entries get .spark-green wherever they show (home planet, continent pins). Locked ones look exactly as today.
   - A tap on a locked planet / continent / region opens nothing; Spark says a short "coming soon" line and points to a nearby green place.
   - A direct link (?planet=, ?continent=, ?area=, ?region=, ?go= or #hash) to a locked place is bounced to Earth (?planet=Earth) before the app reads the URL.
   - The grown-ups area (.sg-btn gate + panel) is not touched.
   Loaded right after spark-map.js, BEFORE app-loader.js, so the URL bounce wins. Wrappers are installed on DOMContentLoaded. */
(function(){
  var M=window.SparkMap;if(!M) return;
  var KEYS=["planet","continent","area","region","go"];
  /* ---- 1. direct links */
  try{var q=new URLSearchParams(location.search),bad=null;
    KEYS.forEach(function(k){var v=q.get(k);if(!v) return;var e=M.find(v);if(e&&e.status==="locked") bad=bad||e});
    var h="";try{h=decodeURIComponent((location.hash||"").slice(1))}catch(x){h=(location.hash||"").slice(1)}
    if(h){var he=M.find(h);if(he&&he.status==="locked") bad=bad||he}
    if(bad){KEYS.forEach(function(k){q.delete(k)});q.set("planet","Earth");history.replaceState(history.state,"",location.pathname+"?"+q.toString());
      window.__sparkBounced={from:bad.id,t:Date.now()}}}catch(e){}
  /* ---- 2. coming soon */
  var log=[],n=0;
  /* pt3 (Allen video2 0:12 'Forests is coming soon'): one grammatical line - "The forests are coming soon! Let's explore the Arctic." */
  var PROPER={"sahara":"the Sahara","congo rainforest":"the Congo rainforest","great rift":"the Great Rift","amazon":"the Amazon","andes":"the Andes","himalayas":"the Himalayas","outback":"the Outback","new zealand":"New Zealand","pacific islands":"the Pacific Islands"};
  function kidSub(e){var n=String(e.spoken||e.name||"").trim();var k=n.toLowerCase();if(e.kind!=="region")return {t:n,v:"is"};var t=PROPER[k]||(/^the /i.test(n)?n:"the "+k);var last=k.split(/\s+/).pop();var pl=/s$/.test(last)&&!/(ss|us)$/.test(last);return {t:t,v:pl?"are":"is"}}
  var LINES=[function(e,b){var s=kidSub(e);return s.t+" "+s.v+" coming soon! Let's explore "+b+"."}];
  function comingSoon(e,src){var g=M.nearGreen(e);var text=LINES[n++%LINES.length](e,g.spoken||g.name);text=text.charAt(0).toUpperCase()+text.slice(1);
    log.push({id:e.id,src:src||"tap",t:Date.now(),suggest:g.id,text:text});if(log.length>60) log.shift();
    try{window.dispatchEvent(new CustomEvent("sparklock:soon",{detail:{id:e.id,src:src,suggest:g.id}}))}catch(x){}
    /* Allen 11/14: Spark says the coming-soon line ONLY when the child taps the locked place (src 'tap'). Programmatic opens, Ask answers
       and the link bounce still refuse the open and glow the green place, but say nothing. */
    if(src==="tap"&&window.SparkVoice) SparkVoice.say(text,{kind:"coming-soon",id:e.id,cap:false})/* pt3: voice only - no caption strip on any screen size */;
    /* spark17 (Tester 11/16): a tapped locked place also shows its line ON SCREEN on phones, where Spark's caption is off (voice-only was silent for muted/deaf players) */
    /* pt3 (Allen video2 0:12): no on-screen banner - Spark says it (Ava voice) */
    try{window.SparkActions&&SparkActions.highlight(g.id,{navigate:false})}catch(x){}
    return text}
  var nEl=null,nT=0;/* spark20 (Tester nav-desk-locked-tap: still voice-only on desktop): the on-screen line shows on every screen size now - a centred card on wide screens, unless Spark's own caption is already showing it */function note(text,late){if(innerWidth>600&&!late){setTimeout(function(){note(text,1)},650);return}try{var wide=innerWidth>600;if(!nEl){nEl=document.createElement("div");nEl.className="spk-lock";nEl.setAttribute("role","status");nEl.setAttribute("aria-live","polite");
      nEl.style.cssText="position:fixed;left:12px;right:12px;top:150px;z-index:140;background:#0f2238f0;color:#fff;border:2px solid #3ee07a;border-radius:16px;padding:10px 14px 10px 44px;font:700 15px/1.3 system-ui,sans-serif;box-shadow:0 8px 24px #0008;pointer-events:none;transition:opacity .3s";
      nEl.innerHTML='<span aria-hidden="true" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:20px">\uD83D\uDD12</span><span></span>';document.body.appendChild(nEl)}
    if(wide){nEl.style.left="50%";nEl.style.right="auto";nEl.style.transform="translateX(-50%)";nEl.style.maxWidth="560px";nEl.style.width="max-content";nEl.style.top="110px";nEl.style.fontSize="18px"}else{nEl.style.left="12px";nEl.style.right="12px";nEl.style.transform="none";nEl.style.width="auto";nEl.style.top="150px";nEl.style.fontSize="15px"}
    if(wide){var dup=[].some.call(document.querySelectorAll("span,p,div"),function(e){return (!nEl||!nEl.contains(e))&&e.children.length<4&&e.offsetParent!==null&&(e.textContent||"").indexOf(text.slice(0,20))>=0});if(dup) return}
    nEl.lastChild.textContent=text;nEl.style.opacity="1";nEl.hidden=false;clearTimeout(nT);nT=setTimeout(function(){nEl.style.opacity="0";setTimeout(function(){nEl.hidden=true},320)},Math.min(8000,2600+text.length*50))}catch(x){}}
  /* taps: capture phase on window, so it runs before the page's own handlers (earth-init, inline onclick, areas-loader) */
  window.addEventListener("click",function(ev){var t=ev.target;if(!t||!t.closest) return;
    var el=t.closest('a.body[data-name],[data-c],[data-env]');if(!el) return;var e=M.fromElement(el);if(!e||e.status!=="locked") return;
    ev.preventDefault();ev.stopImmediatePropagation();comingSoon(e,"tap")},true);
  /* ---- 3. green rings */
  var pT=0;function paint(){pT=0;if(document.body.classList.contains("sbx-on")) return;var els=document.querySelectorAll('a.body[data-name],[data-c],[data-env]');
    for(var i=0;i<els.length;i++){var el=els[i],e=M.fromElement(el),s=e?e.status:"";if(el.getAttribute("data-spark")!==s) el.setAttribute("data-spark",s);
      var g=s==="playable";if(el.classList.contains("spark-green")!==g) el.classList.toggle("spark-green",g)}}
  function paintSoon(){if(!pT) pT=setTimeout(paint,80)}
  /* ---- 4. wrappers: programmatic opens of a locked place are refused too */
  function install(){
    var base=window.openPlanet;if(typeof base==="function"&&!base.__sparkLock){var w=function(ev,name){var e=M.find(name);
        if(e&&e.kind==="planet"&&e.status==="locked"){if(ev){try{ev.preventDefault();ev.stopPropagation()}catch(x){}}comingSoon(e,"open");return false}return base.apply(this,arguments)};
      w.__sparkLock=1;window.openPlanet=w}
    var E=window.EarthEngine;if(E&&typeof E.selectContinent==="function"&&!E.selectContinent.__sparkLock){var sc=E.selectContinent;
      var w2=function(name){var e=M.find(name);if(e&&e.kind==="continent"&&e.status==="locked"){comingSoon(e,"open");return}return sc.apply(this,arguments)};w2.__sparkLock=1;E.selectContinent=w2}
    try{new MutationObserver(paintSoon).observe(document.body,{childList:true,subtree:true})}catch(x){}paint();
    /* Allen 11/14: the bounce to Earth is silent (window.__sparkBounced stays for logs) */}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);else install();
  window.SparkLock={comingSoon:comingSoon,paint:paint,get log(){return log.slice()}};
})();
