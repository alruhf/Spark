/* Spark step 1: the "where am I" signal. window.SparkHere.set({tab, area}) is called from the Earth view, continent views and the
   five play areas (through small wrappers + a DOM watcher below, so no area file is edited).
   SparkHere.get() = {tab:"home"|"earth"|"continent"|"area"|"parent", area:<SparkMap id>, continent, ladders, finished, tried, since, spot}.
   Ladders/finished come from spark-progress.js (read only; levels are never shown to the child). */
(function(){
  var st={tab:"home",area:null,continent:null,since:Date.now()},fns=[];
  function same(a,b){return a.tab===b.tab&&a.area===b.area&&a.continent===b.continent}
  function set(o){o=o||{};var n={tab:o.tab||st.tab,area:o.area!==undefined?o.area:st.area,continent:o.continent!==undefined?o.continent:null,since:Date.now()};
    if(same(n,st)) return st;st=n;try{document.documentElement.setAttribute("data-spark-here",st.tab+(st.area?":"+st.area:""))}catch(e){}
    fns.forEach(function(f){try{f(get())}catch(e){}});try{window.dispatchEvent(new CustomEvent("sparkhere:change",{detail:get()}))}catch(e){}return st}
  function on(id){var e=document.getElementById(id);return !!(e&&e.classList.contains("on"))}
  function slug(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
  function detect(){var b=document.body;if(!b) return null;
    if(document.querySelector(".eg3d-root")) return {tab:"area",area:"egypt",continent:"Africa"};
    if(document.querySelector(".r3d-root")) return {tab:"area",area:"reef",continent:"Australia"};
    if(document.querySelector(".s3d-root")) return {tab:"area",area:"savannah",continent:"Africa"};
    if(b.classList.contains("sbx-on")) return {tab:"area",area:"arctic",continent:"North America"};
    if(b.classList.contains("spark-area")) return st.tab==="area"?{tab:"area",area:st.area,continent:st.continent}:null;
    if(b.classList.contains("spark-savannah")||document.querySelector(".station-view")) return {tab:"area",area:"savannah",continent:"Africa"};
    if(on("parent")) return {tab:"parent",area:"parent",continent:null};
    if(on("world")){var c=null;try{c=window.EarthEngine&&EarthEngine.getState().continent}catch(e){}
      var t=document.getElementById("worldTitle");if(t&&t.textContent.trim()!=="Earth") return {tab:"planet",area:slug(t.textContent),continent:null};
      var g=document.getElementById("earthGame");if(c&&g&&!g.classList.contains("hidden")) return {tab:"continent",area:slug(c),continent:c};return {tab:"earth",area:"earth",continent:null}}
    return {tab:"home",area:null,continent:null}}
  function refresh(){var d=detect();if(d) set(d)}
  var qT=0;function soon(){clearTimeout(qT);qT=setTimeout(refresh,60)}
  function childId(){try{var d=window.SB&&SB.store&&SB.store.doc&&SB.store.doc();if(d&&d.active) return String(d.active)}catch(e){}return "p1"}
  function ladders(){var P=window.SparkProgress,o={};if(!P) return o;["reading","math","science","egypt-stamp"].forEach(function(id){try{var v=P.get(id);if(v) o[id]={level:v.level,levelName:v.levelName,step:v.step,subject:v.subject}}catch(e){}});return o}
  function acts(){try{var d=window.SparkProgress._data(),k=d.kids&&d.kids[childId()];return k&&k.acts||{}}catch(e){return {}}}
  /* Allen 11/15 item 9: the nearest NAMED spot the kid is standing by, from the pins each 3D world already has (window.__sparkSpots,
     set by eg3d.js / s3d.js / r3d.js / arctic3d/places.js). Only these ids count as landmarks; none near (or not walking) = null. */
  var NAMED={egypt:["plateau","shaduf","stable","stamp","farm","grind","bake","map"],savannah:["radio","catalog","clinic","lodge","truck"],
    reef:["nursery","shop","cabin","boats","bunk"],arctic:["trader","sled","fish"]},NEAR=7;
  function spot(){try{var W=window.__sparkSpots;if(!W||st.tab!=="area"||W.area!==st.area||!NAMED[st.area]) return null;var g=W.get();if(!g||!g.walk) return null;
      var best=null,bd=NEAR;(g.spots||[]).forEach(function(s){if(NAMED[st.area].indexOf(s[0])<0) return;var d=Math.hypot(s[1]-g.x,s[2]-g.z);if(d<bd){bd=d;best=s[0]}});return best}catch(e){return null}}
  function get(){var a=acts(),fin=[],tried=[];Object.keys(a).forEach(function(k){if(a[k].ok>0) fin.push(k);if(a[k].n>0) tried.push(k)});
    return {tab:st.tab,area:st.area,continent:st.continent,since:st.since,ladders:ladders(),finished:fin,tried:tried,spot:spot()}}
  window.SparkHere={NAMED:NAMED,set:set,get:get,refresh:refresh,detect:detect,on:function(f){fns.push(f);return function(){fns=fns.filter(function(x){return x!==f})}}};
  /* calls from the views: wrap (never rewrite) the Earth engine, planet opener and area openers */
  function wrap(obj,name,after){if(!obj||typeof obj[name]!=="function"||obj[name].__sparkHere) return;var f=obj[name];var w=function(){var r=f.apply(this,arguments);try{after.apply(this,arguments)}catch(e){}return r};w.__sparkHere=1;obj[name]=w}
  function install(){var E=window.EarthEngine;
    wrap(E,"openEarth",function(){set({tab:"earth",area:"earth",continent:null})});
    wrap(E,"worldMap",function(){set({tab:"earth",area:"earth",continent:null})});
    wrap(E,"selectContinent",function(n){if(window.EarthData&&EarthData.tree[n]) set({tab:"continent",area:slug(n),continent:n})});
    wrap(E,"enterSavannah",function(){set({tab:"area",area:"savannah",continent:"Africa"})});
    var AREA={sahara:"egypt",reef:"reef",arctic:"arctic"};
    wrap(window.SparkAreasLoader,"open",function(id){if(AREA[id]) set({tab:"area",area:AREA[id],continent:null})});
    wrap(window.SparkSavannah3d,"open",function(){set({tab:"area",area:"savannah",continent:"Africa"})});
    ["returnToSolarSystemHome","goPlatformHome"].forEach(function(n){wrap(window,n,function(){soon()})});
    try{var mo=new MutationObserver(soon);mo.observe(document.body,{attributes:true,attributeFilter:["class"],childList:true});
      ["home","world","parent","earthGame"].forEach(function(id){var e=document.getElementById(id);if(e) mo.observe(e,{attributes:true,attributeFilter:["class"]})})}catch(e){}
    refresh()}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);else install();
})();
