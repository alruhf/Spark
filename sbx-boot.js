/* Spark Sandbox boot (pilot P2, Tester review items 2, 3, 4, 15).
   Runs in <head> before anything draws. A first visit, or a device with 2+ players, starts on the "tap your animal" picker;
   a returning single player goes straight back to the region they were last in. The cover class stops the Solar System
   from flashing first. ?sbx=0 or localStorage.sparkSbxV1="0" turns all of this off (classic site). */
(function(){
"use strict";
/* spark37: ?fresh=1 on preview hosts only (localhost or *-ruhf.vercel.app).
   Clears Spark saves on this load, then drops the param so a mid-play refresh is safe.
   No on-screen UI (kid-invisible). Never runs on production. */
(function(){
  try{
    var host=location.hostname||"";
    if(!/^(localhost|127\.0\.0\.1)$|-ruhf\.vercel\.app$/.test(host)) return;
    if(!/[?&]fresh=1(?:&|$)/.test(location.search||"")) return;
    var keep=/^(sparkSbxV1|sparkA3dV1)$/;
    var i,k,keys=[];
    for(i=localStorage.length-1;i>=0;i--){k=localStorage.key(i);if(k&&/^spark/i.test(k)&&!keep.test(k))keys.push(k)}
    keys.forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});
    try{sessionStorage.removeItem("sparkTestfast");sessionStorage.removeItem("sparkS3dTestfast")}catch(e){}
    var u=new URL(location.href);
    u.searchParams.delete("fresh");
    var q=u.search||"";
    history.replaceState({}, "", u.pathname+q+u.hash);
  }catch(e){}
})();
var V="15",REGIONS={arctic:1};
function q(){try{return new URLSearchParams(location.search).get("sbx")}catch(e){return null}}
function ls(k){try{return localStorage.getItem(k)}catch(e){return null}}
if(q()==="0"||ls("sparkSbxV1")==="0") return;
try{if(new URLSearchParams(location.search).get("planet")) return}catch(e){}
/* a big Arctic picture on the Earth globe (review item 2): one tap from Earth into camp, no small bubble to find */
/* lives on <body>, not inside #earthMap: the globe redraws that box on pointerdown, which removed the tile mid-tap */
function mapOn(){var m=document.getElementById("earthMap"),w=document.getElementById("world");if(!m||!w) return false;if(document.body.classList.contains("sbx-on")) return false;var r=m.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(m).display!=="none"&&getComputedStyle(w).display!=="none"}
function tile(){if(document.querySelector(".sbx-arctile")) return;var m=document.body;var b=document.createElement("button");b.type="button";b.className="sbx-arctile";b.setAttribute("aria-label","Go to the Arctic");
  b.innerHTML='<img alt="" draggable="false" src="areas/arctic/img/sbx/tile_arctic.webp?v=1">';var go=function(e){e.preventDefault();e.stopPropagation();if(go.t&&Date.now()-go.t<1500) return;go.t=Date.now();if(window.SparkAreasLoader) window.SparkAreasLoader.open("arctic")};
  /* pointerup, not click: the globe redraws its map on pointerdown, which can swallow the click */
  b.addEventListener("pointerup",go);b.addEventListener("click",go);b.addEventListener("pointerdown",function(e){e.stopPropagation()});m.appendChild(b)}
var tcss=document.createElement("style");tcss.textContent=".sbx-arctile{position:fixed;left:14px;bottom:14px;z-index:50;width:clamp(120px,24vmin,220px);height:clamp(120px,24vmin,220px);padding:0;border:4px solid #fff;border-radius:22px;overflow:hidden;background:#cfe3f5;box-shadow:0 8px 24px #0008;cursor:pointer;animation:sbxTile 2.4s ease-in-out infinite}"+
  ".sbx-arctile img{width:100%;height:100%;object-fit:cover;display:block}@keyframes sbxTile{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}";
(document.head||document.documentElement).appendChild(tcss);
function tiles(){tile();var t=document.querySelector(".sbx-arctile");setInterval(function(){var on=mapOn();if(t.style.display!==(on?"block":"none")) t.style.display=on?"block":"none"},300);t.style.display=mapOn()?"block":"none"}
/* P6 (Allen 10/20): the square Arctic tile is gone; the Arctic opens from its own pin (Earth > North America > Arctic). ?arctile=1 brings the tile back for testing */
var wantTile=false;try{wantTile=new URLSearchParams(location.search).get("arctile")==="1"}catch(e){}
if(wantTile){if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",tiles);else tiles()}
var doc=null;try{doc=JSON.parse(ls("sparkWorldV1")||"null")}catch(e){}
var profs=doc&&doc.profiles?Object.keys(doc.profiles):[],act=doc&&doc.active&&doc.profiles&&doc.profiles[doc.active],last=act&&act.lastRegion;
var mode=null;
/* Arctic 3D (spec 10/19 + Allen 4:20 PM): the game opens on the Solar System as before and there is no animal picker; the Arctic tile
   opens the 3D Arctic with the active profile. ?a3d=0 (or sparkA3dV1="0") restores the P3 boot (picker / resume). */
var a3d=true;try{a3d=new URLSearchParams(location.search).get("a3d")!=="0"&&ls("sparkA3dV1")!=="0"}catch(e){}
/* Allen 11/15 items 3+7: the new-kid flow (age + make your explorer, kid-setup.js) runs right after a NEW kid is made: after this
   picker (?a3d=0 path, sbx.js picker -> SparkKidSetup.gate) and, on the default 3D path that has no picker since 10/19, when a world
   opener makes the device's first kid. Existing kids never see it. */
if(!a3d){if(profs.length===0||profs.length>=2) mode="picker";else if(last&&REGIONS[last]) mode="resume"}
window.SparkSbxBoot={mode:mode,region:(mode==="resume"&&last)||"arctic",V:V};
if(!mode) return;
var H=document.documentElement;H.classList.add("sbx-boot");
var css=document.createElement("style");css.id="sbxBootCss";
css.textContent="html.sbx-boot,html.sbx-boot body{background:#0b1a30!important}html.sbx-boot body>*:not(.sbx):not(.sg-ov):not(.sg-btn):not(.sg-tip):not(.sbx-ghost):not(.sbx-hand):not(.sbx-flycoin):not(.sbx-fx){visibility:hidden!important}"+
  "html.sbx-boot body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,#2b4f7e 0%,#0b1a30 70%);z-index:0}";
(document.head||H).appendChild(css);
function js(src){return new Promise(function(ok,no){var s=document.createElement("script");s.src=src+"?v="+V;s.onload=ok;s.onerror=function(){no(new Error("load "+src))};document.head.appendChild(s)})}
function cssl(){if(document.querySelector("link[data-sbx]")) return;var l=document.createElement("link");l.rel="stylesheet";l.href="sbx.css?v="+V;l.setAttribute("data-sbx","1");document.head.appendChild(l)}
cssl();
var ready=js("sbx.js").then(function(){return js("sbx-"+window.SparkSbxBoot.region+".js")});
function uncover(){H.classList.remove("sbx-boot")}
window.SparkSbxBoot.uncover=uncover;
function go(){ready.then(function(){return window.SparkSandbox.boot(window.SparkSbxBoot)}).catch(function(e){try{console.error("sandbox boot failed",e)}catch(x){}uncover()})}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",go);else go();
})();
