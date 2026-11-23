/* Spark Wardrobe (shared, site-wide; Allen 10/20). One player character per profile; clothes are bought ONLY with earned coins at an
   area's trading post (each area sells its own themed clothes: Arctic = arctic clothes). The backpack opens the closet in place: the
   character big in the middle, owned clothes around it; drag a piece onto the character to wear it, drag a worn piece off (or tap it) to
   take it off. No starter/free clothes. Save: localStorage sparkWardrobeV1 {profiles:{<pid>:{owned:{id:1},worn:{slot:id}}}}.
   Areas plug in with: SparkWardrobe.catalog(theme) for their shop, .own(pid,id) after a coin spend, .openCloset({...}) from their backpack,
   .worn(pid) + .on(fn) to dress their own character model. Works as a classic script and as an ES-module side-effect import.
   spark16 (Allen 11/15, character looks): EXTRA field profiles[pid].look = {skin,hair,eyes} in the SAME save (no new format, nothing else
   in the profile is touched; no field = today's exact kid). .look(pid) / .setLook(pid,part,id) / .onLook(fn); the closet shows a tap-only
   look bar (skin / hair / eyes swatches) next to the clothes. Colours + the 3D tint live in kid-look.js (window.SparkKidLook). */
(function(){"use strict";if(window.SparkWardrobe) return;
var KEY="sparkWardrobeV1",subs=[],lsubs=[];
var ROOT='';/* images are relative to the site root page */
function PIC(id){var c=CAT[id];return c.img?'<img class="swd-pic" alt="'+(c.name||id)+'" draggable="false" src="'+ROOT+c.img+'">':c.svg}
var SV=function(b){return '<svg viewBox="0 0 64 64" aria-hidden="true">'+b+'</svg>'};
var CAT={
 parka:{theme:"arctic",name:"Red parka",slot:"body",price:4,color:"#d9473b",kind:"parka",img:"arctic3d/tex/cloth/parka.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#d9473b" stroke="#fff" stroke-width="4"/>')},
 parka_blue:{theme:"arctic",name:"Blue parka",slot:"body",price:4,color:"#2f6fd0",kind:"parka",img:"arctic3d/tex/cloth/parka_blue.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#2f6fd0" stroke="#fff" stroke-width="4"/>')},
 amauti:{theme:"arctic",name:"Trimmed parka",slot:"body",price:6,color:"#1f8a8a",kind:"amauti",img:"arctic3d/tex/cloth/amauti.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#1f8a8a" stroke="#fff" stroke-width="4"/>')},
 hood:{theme:"arctic",name:"Fur hood",slot:"head",price:3,color:"#7a4a2c",kind:"hood",img:"arctic3d/tex/cloth/hood.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#7a4a2c" stroke="#fff" stroke-width="4"/>')},
 furhat:{theme:"arctic",name:"Trapper hat",slot:"head",price:3,color:"#6b4428",kind:"trapper",img:"arctic3d/tex/cloth/furhat.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#6b4428" stroke="#fff" stroke-width="4"/>')},
 beanie:{theme:"arctic",name:"Knit beanie",slot:"head",price:2,color:"#e0463e",kind:"beanie",img:"arctic3d/tex/cloth/beanie.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#e0463e" stroke="#fff" stroke-width="4"/>')},
 earmuffs:{theme:"arctic",name:"Earmuffs",slot:"head",price:2,color:"#e889b5",kind:"earmuffs",img:"arctic3d/tex/cloth/earmuffs.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#e889b5" stroke="#fff" stroke-width="4"/>')},
 goggles:{theme:"arctic",name:"Snow goggles",slot:"face",price:3,color:"#f2a93b",kind:"goggles",img:"arctic3d/tex/cloth/goggles.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#f2a93b" stroke="#fff" stroke-width="4"/>')},
 gaiter:{theme:"arctic",name:"Face warmer",slot:"face",price:2,color:"#7d4fc9",kind:"gaiter",img:"arctic3d/tex/cloth/gaiter.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#7d4fc9" stroke="#fff" stroke-width="4"/>')},
 scarf:{theme:"arctic",name:"Striped scarf",slot:"neck",price:2,color:"#2f8f6a",kind:"scarf",img:"arctic3d/tex/cloth/scarf.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#2f8f6a" stroke="#fff" stroke-width="4"/>')},
 mittens:{theme:"arctic",name:"Blue mittens",slot:"hands",price:2,color:"#3b6fd9",kind:"mittens",img:"arctic3d/tex/cloth/mittens.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#3b6fd9" stroke="#fff" stroke-width="4"/>')},
 mittens_red:{theme:"arctic",name:"Red mittens",slot:"hands",price:2,color:"#d33b3b",kind:"mittens",img:"arctic3d/tex/cloth/mittens_red.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#d33b3b" stroke="#fff" stroke-width="4"/>')},
 snowpants:{theme:"arctic",name:"Snow pants",slot:"legs",price:4,color:"#24345c",kind:"pants",img:"arctic3d/tex/cloth/snowpants.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#24345c" stroke="#fff" stroke-width="4"/>')},
 boots:{theme:"arctic",name:"Snow boots",slot:"feet",price:3,color:"#4a3426",kind:"boots",img:"arctic3d/tex/cloth/boots.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#4a3426" stroke="#fff" stroke-width="4"/>')},
 mukluks:{theme:"arctic",name:"Mukluks",slot:"feet",price:5,color:"#b98a5a",kind:"mukluks",img:"arctic3d/tex/cloth/mukluks.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#b98a5a" stroke="#fff" stroke-width="4"/>')},
 snowshoes:{theme:"arctic",name:"Snowshoes",slot:"feet",price:4,color:"#8a5a36",kind:"snowshoes",img:"arctic3d/tex/cloth/snowshoes.webp?v=3",svg:SV('<circle cx="32" cy="32" r="24" fill="#8a5a36" stroke="#fff" stroke-width="4"/>')},
 /* Reef (Allen 10/21): own reef slots so the Arctic outfit is never replaced by reef gear */
 mask_teal:{theme:"reef",name:"Snorkel mask",slot:"reefface",price:3,color:"#1fb5c9",kind:"mask",svg:SV('<path d="M10 22c0-6 6-8 22-8s22 2 22 8v10c0 6-6 9-12 9-5 0-7-4-10-4s-5 4-10 4c-6 0-12-3-12-9z" fill="#1fb5c9" stroke="#fff" stroke-width="3"/><path d="M15 23c0-3 4-4 17-4s17 1 17 4v7c0 4-4 6-8 6-4 0-6-3-9-3s-5 3-9 3c-4 0-8-2-8-6z" fill="#bfefff"/><path d="M52 12v-6h6v26" fill="none" stroke="#ffcf3a" stroke-width="5" stroke-linecap="round"/>')},
 mask_pink:{theme:"reef",name:"Pink mask",slot:"reefface",price:3,color:"#ff6fa8",kind:"mask",svg:SV('<path d="M10 22c0-6 6-8 22-8s22 2 22 8v10c0 6-6 9-12 9-5 0-7-4-10-4s-5 4-10 4c-6 0-12-3-12-9z" fill="#ff6fa8" stroke="#fff" stroke-width="3"/><path d="M15 23c0-3 4-4 17-4s17 1 17 4v7c0 4-4 6-8 6-4 0-6-3-9-3s-5 3-9 3c-4 0-8-2-8-6z" fill="#bfefff"/><path d="M52 12v-6h6v26" fill="none" stroke="#7a5cff" stroke-width="5" stroke-linecap="round"/>')},
 fins_yellow:{theme:"reef",name:"Yellow fins",slot:"reeffeet",price:3,color:"#ffcf3a",kind:"fins",svg:SV('<path d="M12 8h10l6 40-4 10H6L4 48z" fill="#ffcf3a" stroke="#fff" stroke-width="3"/><path d="M38 8h10l6 40-4 10H32l-2-10z" fill="#ffcf3a" stroke="#fff" stroke-width="3"/><path d="M8 50h18M34 50h18" stroke="#d99a00" stroke-width="3"/>')},
 fins_blue:{theme:"reef",name:"Blue fins",slot:"reeffeet",price:3,color:"#2d6fe0",kind:"fins",svg:SV('<path d="M12 8h10l6 40-4 10H6L4 48z" fill="#2d6fe0" stroke="#fff" stroke-width="3"/><path d="M38 8h10l6 40-4 10H32l-2-10z" fill="#2d6fe0" stroke="#fff" stroke-width="3"/><path d="M8 50h18M34 50h18" stroke="#9fd0ff" stroke-width="3"/>')},
 rash_coral:{theme:"reef",name:"Coral rash guard",slot:"reefbody",price:4,color:"#ff7f6e",kind:"rash",svg:SV('<path d="M20 8l-14 10 6 10 6-4v32h28V24l6 4 6-10-14-10c-2 5-6 7-12 7s-10-2-12-7z" fill="#ff7f6e" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>')},
 rash_ocean:{theme:"reef",name:"Ocean rash guard",slot:"reefbody",price:4,color:"#1f8fb3",kind:"rash",svg:SV('<path d="M20 8l-14 10 6 10 6-4v32h28V24l6 4 6-10-14-10c-2 5-6 7-12 7s-10-2-12-7z" fill="#1f8fb3" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M18 40c5-4 9 4 14 0s9 4 14 0" fill="none" stroke="#bfefff" stroke-width="3"/>')},
 rash_stripe:{theme:"reef",name:"Striped rash guard",slot:"reefbody",price:5,color:"#ffb84d",kind:"rash",stripe:"#ffffff",svg:SV('<path d="M20 8l-14 10 6 10 6-4v32h28V24l6 4 6-10-14-10c-2 5-6 7-12 7s-10-2-12-7z" fill="#ffb84d" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M18 30h28M18 38h28M18 46h28" stroke="#fff" stroke-width="4"/>')},
 sunhat:{theme:"reef",name:"Sun hat",slot:"reefhead",price:2,color:"#f3dc9a",kind:"sunhat",svg:SV('<ellipse cx="32" cy="40" rx="28" ry="9" fill="#f3dc9a" stroke="#fff" stroke-width="3"/><path d="M18 40c0-14 6-22 14-22s14 8 14 22z" fill="#f3dc9a" stroke="#fff" stroke-width="3"/><path d="M18 36h28" stroke="#2fb3c2" stroke-width="5"/>')},
 sunhat_flower:{theme:"reef",name:"Flower sun hat",slot:"reefhead",price:3,color:"#ffe1ef",kind:"sunhat",flower:"#ff5fa2",svg:SV('<ellipse cx="32" cy="40" rx="28" ry="9" fill="#ffe1ef" stroke="#fff" stroke-width="3"/><path d="M18 40c0-14 6-22 14-22s14 8 14 22z" fill="#ffe1ef" stroke="#fff" stroke-width="3"/><circle cx="42" cy="32" r="6" fill="#ff5fa2"/><circle cx="42" cy="32" r="2.5" fill="#ffcf3a"/>')},
 visor:{theme:"reef",name:"Visor cap",slot:"reefhead",price:2,color:"#2fbf71",kind:"visor",svg:SV('<path d="M12 34c0-12 9-18 20-18s20 6 20 18z" fill="#2fbf71" stroke="#fff" stroke-width="3"/><path d="M30 34h30c0 5-8 8-30 6z" fill="#1a8a4f" stroke="#fff" stroke-width="3"/>')}
};
Object.keys(CAT).forEach(function(id){CAT[id].id=id});
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&d.profiles) return d}catch(e){}return {profiles:{}}}
function store(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
function prof(d,pid){pid=pid||activePid();var p=d.profiles[pid]=d.profiles[pid]||{owned:{},worn:{}};p.owned=p.owned||{};p.worn=p.worn||{};/* P6D: slots renamed (goggles eyes->face): move any item worn under an old slot name */Object.keys(p.worn).forEach(function(k){var id=p.worn[k];if(CAT[id]&&CAT[id].slot!==k){delete p.worn[k];if(!p.worn[CAT[id].slot])p.worn[CAT[id].slot]=id}});return p}
function activePid(){try{var w=JSON.parse(localStorage.getItem("sparkWorldV1")||"null");if(w&&w.active) return w.active}catch(e){}return "p1"}
function emitLook(pid){var lk=api.look(pid);lsubs.slice().forEach(function(f){try{f(lk,pid)}catch(e){}})}
function emit(pid){var w=api.worn(pid);subs.slice().forEach(function(f){try{f(w,pid)}catch(e){}})}
var api={KEY:KEY,items:CAT,activePid:activePid,
 catalog:function(theme){return Object.keys(CAT).map(function(k){return CAT[k]}).filter(function(i){return !theme||i.theme===theme})},
 owns:function(pid,id){return !!prof(load(),pid).owned[id]},owned:function(pid){var o=prof(load(),pid).owned;return Object.keys(o).filter(function(k){return CAT[k]})},
 own:function(pid,id){if(!CAT[id]) return false;var d=load();prof(d,pid).owned[id]=1;store(d);emit(pid);return true},
 worn:function(pid){var w=prof(load(),pid).worn,o={};Object.keys(w).forEach(function(s){if(CAT[w[s]]) o[s]=w[s]});return o},
 wear:function(pid,id){var d=load(),p=prof(d,pid);if(!p.owned[id]||!CAT[id]) return false;p.worn[CAT[id].slot]=id;store(d);emit(pid);return true},
 unwear:function(pid,id){var d=load(),p=prof(d,pid),s=CAT[id]?CAT[id].slot:id;if(!p.worn[s]) return false;delete p.worn[s];store(d);emit(pid);return true},
 on:function(f){subs.push(f);return function(){var i=subs.indexOf(f);if(i>=0) subs.splice(i,1)}},
 look:function(pid){var p=prof(load(),pid),L=window.SparkKidLook;var lk=p.look&&typeof p.look==="object"?p.look:null;return L&&L.clean?L.clean(lk):lk},
 setLook:function(pid,part,id){pid=pid||activePid();if(["skin","hair","eyes"].indexOf(part)<0) return false;var L=window.SparkKidLook;if(L&&L.colorOf&&!L.colorOf(part,id)) return false;
  var d=load(),p=prof(d,pid),lk=(p.look&&typeof p.look==="object")?p.look:{};var orig=L&&L.OPTS?L.OPTS[part][0].id:null;
  if(!id||id===orig) delete lk[part];else lk[part]=id;if(Object.keys(lk).length) p.look=lk;else delete p.look;store(d);emitLook(pid);return true},
 onLook:function(f){lsubs.push(f);return function(){var i=lsubs.indexOf(f);if(i>=0) lsubs.splice(i,1)}}};
/* ---- closet overlay (in place, over the area). o={host,pid,target:()=>DOMRect of the character on screen,say(id),log(k,o),close:()=>{},theme} */
var CSS=".swd{position:absolute;inset:0;z-index:8;pointer-events:none;font-family:inherit}.swd.on{pointer-events:auto}"+
 ".swd-side{position:absolute;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:14px}.swd-l{left:max(14px,env(safe-area-inset-left,0px))}.swd-r{right:max(14px,env(safe-area-inset-right,0px))}"+
 ".swd-c{position:relative;width:96px;height:96px;border-radius:24px;border:4px solid #fff;background:#1d3a63ee;box-shadow:0 6px 18px #0006;display:grid;place-items:center;padding:8px;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}"+
 ".swd-c svg,.swd-c img{width:100%;height:100%;object-fit:contain;pointer-events:none}.swd-c{background:radial-gradient(circle at 50% 38%,#ffffff,#dfe8f3 70%,#c6d4e6)!important;padding:4px!important}.swd-c.worn{box-shadow:0 0 0 5px #2fbf71,0 6px 18px #0006!important}.swd-ghost img{width:100%;height:100%;object-fit:contain}.swd-side{display:flex!important;flex-direction:column;flex-wrap:wrap;justify-content:center;align-content:center;height:calc(100vh - 220px);max-height:620px}.swd-l{left:max(132px,env(safe-area-inset-left,0px))!important;flex-wrap:wrap-reverse}@media(max-width:700px){.swd-c{width:68px!important;height:68px!important;border-radius:18px!important;border-width:3px!important}.swd-side{gap:8px!important;height:calc(100vh - 300px)}.swd-l{left:max(8px,env(safe-area-inset-left,0px))!important;top:calc(50% + 50px)!important}.swd-r{top:calc(50% + 50px)!important}}.swd-c.worn{background:#2f8f6aee}.swd-c.worn:after{content:'';position:absolute;right:-8px;top:-8px;width:30px;height:30px;border-radius:50%;background:#2fbf71 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath d='M10 26l9 9 19-21' fill='none' stroke='white' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center/70% no-repeat;border:3px solid #fff}"+
 ".swd-c.lift{opacity:.35}.swd-ghost{position:fixed;width:110px;height:110px;margin:-55px 0 0 -55px;z-index:99;pointer-events:none;filter:drop-shadow(0 8px 14px #0008);transition:transform .15s}.swd-ghost.hot{transform:scale(1.25)}.swd-ghost svg{width:100%;height:100%}"+
 ".swd-x{position:absolute;left:max(14px,env(safe-area-inset-left,0px));top:max(14px,env(safe-area-inset-top,0px));width:88px;height:88px;border-radius:50%;border:4px solid #fff;background:#10243ecc;display:grid;place-items:center;padding:16px;cursor:pointer}.swd-x svg{width:100%;height:100%}"+
 ".swd-ring{position:fixed;border:5px dashed #ffffffaa;border-radius:40px;pointer-events:none;opacity:0;transition:opacity .2s,background .2s}.swd.drag .swd-ring{opacity:1}.swd-ring.hot{background:#ffffff33;border-color:#ffe46b}"+
 ".swd-empty{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:110px;height:110px;border-radius:26px;border:4px solid #fff;background:#e2716fee;display:grid;place-items:center;padding:14px;cursor:pointer}.swd-empty svg{width:100%;height:100%}"+
 ".swd-look{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 12px;border-radius:26px;background:#10243ecc;border:3px solid #ffffffcc;box-shadow:0 6px 18px #0006;pointer-events:auto;touch-action:manipulation}"+".swd-lt,.swd-ls{display:flex;gap:10px;justify-content:center}.swd-ltab{width:56px;height:56px;border-radius:50%;border:3px solid #ffffff88;background:#1d3a63;display:grid;place-items:center;padding:6px;cursor:pointer}.swd-ltab svg{width:100%;height:100%;pointer-events:none}.swd-ltab.on{border-color:#ffe46b;box-shadow:0 0 0 3px #ffe46b88;background:#2b5794}"+".swd-sw{width:52px;height:52px;border-radius:50%;border:4px solid #fff;cursor:pointer;box-shadow:0 3px 8px #0005;padding:0}.swd-sw.on{box-shadow:0 0 0 5px #2fbf71,0 3px 8px #0005;transform:scale(1.08)}"+".swd.haslook .swd-empty{bottom:calc(max(14px,env(safe-area-inset-bottom,0px)) + 168px)}"+".swd-look.swd-look-right{left:auto;right:max(8px,env(safe-area-inset-right,0px));transform:none}.swd-look.swd-look-compact .swd-ls{flex-wrap:wrap;justify-content:center;max-width:156px}.swd-look.swd-look-compact .swd-lt{gap:6px}@media(max-width:700px){.swd-look{gap:6px;padding:8px 8px;border-radius:22px}.swd-ltab{width:48px;height:48px}.swd-sw{width:44px;height:44px;border-width:3px}.swd-lt,.swd-ls{gap:8px}.swd.haslook .swd-side{height:calc(100vh - 420px)!important;top:calc(50% - 4px)!important}.swd.haslook .swd-empty{bottom:calc(max(14px,env(safe-area-inset-bottom,0px)) + 140px)}}"+
 "@media(max-width:700px){.swd-c{width:72px;height:72px;border-radius:18px;padding:6px}.swd-side{gap:10px}.swd-x{width:64px;height:64px;padding:12px}}";
var LICO={skin:'<svg viewBox="0 0 48 48"><path d="M14 40V20a3 3 0 0 1 6 0v8V12a3 3 0 0 1 6 0v14V10a3 3 0 0 1 6 0v16V14a3 3 0 0 1 6 0v18c0 8-5 12-12 12h-2c-5 0-10-4-10-4z" fill="CUR" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>',
 hair:'<svg viewBox="0 0 48 48"><circle cx="24" cy="27" r="12" fill="#f3cdb0" stroke="#fff" stroke-width="2"/><path d="M9 26c-2-12 6-20 15-20s17 6 15 20c-2-6-6-9-9-9-4 3-11 4-17 2-2 2-3 4-4 7z" fill="CUR" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>',
 eyes:'<svg viewBox="0 0 48 48"><path d="M4 24c6-9 13-13 20-13s14 4 20 13c-6 9-13 13-20 13S10 33 4 24z" fill="#fff" stroke="#fff" stroke-width="2"/><circle cx="24" cy="24" r="9" fill="CUR"/><circle cx="24" cy="24" r="4" fill="#111"/><circle cx="27" cy="21" r="2" fill="#fff"/></svg>'};
var BACK='<svg viewBox="0 0 48 48"><path d="M30 8 L14 24 L30 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var SHOP='<svg viewBox="0 0 48 48"><path d="M6 20l4-12h28l4 12z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="24" width="28" height="18" fill="#f4e3c8" stroke="#fff" stroke-width="3"/><circle cx="24" cy="33" r="5" fill="#f6c445"/></svg>';
api.openCloset=function(o){o=o||{};var pid=o.pid||activePid(),say=o.say||function(){},log=o.log||function(){};
 if(!document.getElementById("swdCss")){var st=document.createElement("style");st.id="swdCss";st.textContent=CSS;document.head.appendChild(st)}
 var ov=document.createElement("div");ov.className="swd on";(o.host||document.body).appendChild(ov);
 var ring=document.createElement("div");ring.className="swd-ring";ov.appendChild(ring);
 var x=document.createElement("button");x.type="button";x.className="swd-x";x.setAttribute("aria-label","Close backpack");x.innerHTML=BACK;if(!o.noClose) ov.appendChild(x);/* noClose: the area already has its own back button */
 var L=document.createElement("div");L.className="swd-side swd-l";var R=document.createElement("div");R.className="swd-side swd-r";ov.appendChild(L);ov.appendChild(R);
 function tgt(){var r=o.target&&o.target();return r||{left:innerWidth*.35,top:innerHeight*.2,width:innerWidth*.3,height:innerHeight*.6}}
 function placeRing(){var r=tgt();ring.style.left=r.left+"px";ring.style.top=r.top+"px";ring.style.width=r.width+"px";ring.style.height=r.height+"px"}
 function inT(px,py){var r=tgt(),pad=24;return px>r.left-pad&&px<r.left+r.width+pad&&py>r.top-pad&&py<r.top+r.height+pad}
 var cards=[];
 function render(){L.innerHTML="";R.innerHTML="";cards=[];var own=api.owned(pid).filter(function(id){return !o.theme||CAT[id].theme===o.theme||true}),w=api.worn(pid),wv={};Object.keys(w).forEach(function(s){wv[w[s]]=1});
  var old=ov.querySelector(".swd-empty");if(old) old.remove();
  if(!own.length){var e=document.createElement("button");e.type="button";e.className="swd-empty";e.setAttribute("aria-label","Trading post");e.innerHTML=SHOP;ov.appendChild(e);e.addEventListener("click",function(){say("closet_empty")});return}
  own.forEach(function(id,i){var c=document.createElement("div");c.className="swd-c"+(wv[id]?" worn":"");c.dataset.item=id;c.setAttribute("role","button");c.setAttribute("aria-label",id);c.innerHTML=PIC(id);(i%2?R:L).appendChild(c);cards.push(c);drag(c,id)})}
 function drag(c,id){var g=null,sx=0,sy=0,moved=false,pidp=null;
  c.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();pidp=e.pointerId;try{c.setPointerCapture(pidp)}catch(_){}sx=e.clientX;sy=e.clientY;moved=false;placeRing()});
  c.addEventListener("pointermove",function(e){if(pidp!==e.pointerId) return;if(!moved&&Math.hypot(e.clientX-sx,e.clientY-sy)<8) return;
   if(!moved){moved=true;g=document.createElement("div");g.className="swd-ghost";g.innerHTML=PIC(id);document.body.appendChild(g);c.classList.add("lift");ov.classList.add("drag")}
   g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";var h=inT(e.clientX,e.clientY);g.classList.toggle("hot",h);ring.classList.toggle("hot",h)});
  function end(e,cancel){if(pidp!==e.pointerId) return;pidp=null;var worn=!!api.worn(pid)[CAT[id].slot]&&api.worn(pid)[CAT[id].slot]===id;
   if(g){g.remove();g=null}c.classList.remove("lift");ov.classList.remove("drag");ring.classList.remove("hot");
   if(cancel) return;
   if(!moved){if(worn){api.unwear(pid,id);say("took_off");log("swdoff",{id:id,how:"tap"})}else{/* P6D (Tester): a tap on a card puts it on */api.wear(pid,id);say("worn");log("swdwear",{id:id,how:"tap"})}render();return}
   if(inT(e.clientX,e.clientY)){api.wear(pid,id);say("worn");log("swdwear",{id:id})}else if(worn){api.unwear(pid,id);say("took_off");log("swdoff",{id:id,how:"drag"})}
   render()}
  c.addEventListener("pointerup",function(e){end(e,false)});c.addEventListener("pointercancel",function(e){end(e,true)})}
 /* drag a worn piece OFF the character: press on the character, drag away -> the last-worn piece comes off */
 ov.addEventListener("pointerdown",function(e){if(e.target!==ov||!inT(e.clientX,e.clientY)) return;var w=api.worn(pid),ks=Object.keys(w);if(!ks.length) return;var sx=e.clientX,sy=e.clientY;
  var up=function(ev){ov.removeEventListener("pointerup",up);if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>60&&!inT(ev.clientX,ev.clientY)){var order=["eyes","head","neck","hands","feet","body"],s=order.filter(function(k){return w[k]})[0];if(s){api.unwear(pid,w[s]);say("took_off");log("swdoff",{id:w[s],how:"dragbody"});render()}}};ov.addEventListener("pointerup",up)});
/* spark16 look bar: tap a part (skin / hair / eyes), then tap a colour; the first colour is the kid's original. Tap only, no words. */
 var KL=window.SparkKidLook,lookBar=null,lpart="skin";
 function renderLook(){if(!KL||!KL.OPTS||o.noLook) return;if(!lookBar){lookBar=document.createElement("div");lookBar.className="swd-look";lookBar.setAttribute("role","group");lookBar.setAttribute("aria-label","My look");ov.appendChild(lookBar);ov.classList.add("haslook");
   lookBar.addEventListener("pointerdown",function(e){e.stopPropagation()});
   lookBar.addEventListener("click",function(e){e.stopPropagation();var t=e.target.closest&&e.target.closest("[data-lpart],[data-lid]");if(!t) return;
    if(t.dataset.lpart){lpart=t.dataset.lpart;log("swdlooktab",{part:lpart});renderLook();return}
    api.setLook(pid,lpart,t.dataset.lid);log("swdlook",{part:lpart,id:t.dataset.lid});renderLook()})}
  var cur=api.look(pid)||{},h='<div class="swd-lt">';["skin","hair","eyes"].forEach(function(pt){var cid=cur[pt]||KL.OPTS[pt][0].id;h+='<button type="button" class="swd-ltab'+(pt===lpart?' on':'')+'" data-lpart="'+pt+'" aria-label="'+pt+'" aria-pressed="'+(pt===lpart)+'">'+LICO[pt].replace(/CUR/g,KL.colorOf(pt,cid))+'</button>'});
  h+='</div><div class="swd-ls">';var sel=cur[lpart]||KL.OPTS[lpart][0].id;KL.OPTS[lpart].forEach(function(op){h+='<button type="button" class="swd-sw'+(op.id===sel?' on':'')+'" data-lid="'+op.id+'" aria-label="'+lpart+' '+op.id+'" aria-pressed="'+(op.id===sel)+'" style="background:'+op.c+'"></button>'});
  lookBar.innerHTML=h+'</div>'}
  function close(){ov.remove();o.close&&o.close()}
 x.addEventListener("click",function(e){e.stopPropagation();close()});
 render();renderLook();placeRing();var t=setInterval(placeRing,250);var off=api.on(function(){});
 say(api.owned(pid).length?"closet_hi":"closet_empty");log("swdopen",{owned:api.owned(pid).length});
 return {el:ov,close:function(){clearInterval(t);off();if(ov.isConnected) ov.remove()},render:render,renderLook:renderLook,
  /* spark16: an area moves the look bar out of its own bottom UI. f.above = an element the bar must sit above (wide screens, and phones unless f.phone says otherwise); f.phone = "top" (compact, top centre) or "right" (bottom, pushed right of a bottom-left button) for widths <= 600 */
  fitLook:function(f){f=f||{};if(!lookBar) return;var lb=lookBar;function fit(){if(!lb.isConnected){removeEventListener("resize",fit);return}var ph=innerWidth<=600,m=ph?f.phone:null;lb.classList.toggle("swd-look-compact",m==="top"||m==="right");lb.classList.toggle("swd-look-right",m==="right");lb.style.top="";lb.style.bottom="";
    if(m==="top"){lb.style.bottom="auto";lb.style.top="max(14px,env(safe-area-inset-top,0px))";return}
    if(f.above&&f.above.isConnected&&m!=="right"){var r=f.above.getBoundingClientRect(),H=ov.getBoundingClientRect();if(r.height) lb.style.bottom=Math.max(0,Math.round(H.bottom-r.top+10))+"px"}}
   fit();requestAnimationFrame(fit);addEventListener("resize",fit)}}};
window.SparkWardrobe=api})();
