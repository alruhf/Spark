/* Spark step 2 (Allen, 5:31 PM ET call 11/12; PREVIEW): level-aware "what can I do" + 3D glow on the suggested challenge.
   WRAPS SparkActions.pointChallenge (spark-helper.js); the areas' own code is not edited.
   1) Pick: each challenge in spark-map.js carries fit (which ladder) + lv [lo,hi] (ladder level range, 0 = Explorer .. 3 = Systems Analyst;
      egypt-stamp uses its own 0 = Pre-reader .. 2 = Reader). Kid level L = level + (step-1)/3 from SparkHere.get().ladders (read only).
      Order: unfinished at-level > unfinished one level up > finished at-level > finished one level up > below level > far above (avoided).
      Inside a group: closest to the middle of its range, then map order. Asking again rotates down that list (far-above ones are skipped).
      No ladder data (SparkProgress/ladders missing) -> the step 1 fixed order, unchanged. Kids never see or hear levels or numbers.
   2) Glow: a soft gold beacon (ground ring + light column + bobbing sparkle) anchored to the challenge's 3D spot. It is positioned every frame
      from the area's own read-only probes (__eg3d / __s3d + __rf / __r3d / __a3d: world point -> screen through the area's own camera), so it
      sits on the object and moves with the camera. Off screen it rides the screen edge with an arrow. It stops when the kid gets there, starts
      the challenge (area log events / mode), leaves the area, or after 20 s. If the object can't be found, Spark only speaks (no glow). */
(function(){
  var M=window.SparkMap,A=window.SparkActions,V=window.SparkVoice;if(!M||!A||!V||A.__level) return;
  var GLOW_MS=20000;
  function H(){return window.SparkHere?SparkHere.get():{tab:"home"}}
  /* ------------------------------------------------------------ 1. level-aware pick */
  function lvOf(lads,id){var v=lads&&lads[id];if(!v||typeof v.level!=="number") return null;return v.level+((v.step||1)-1)/3}
  function hasData(h){return !!(window.SparkProgress&&h.ladders&&Object.keys(h.ladders).length)}
  var SAYS={math:"Here's a number game!",reading:"Here's a reading game!",science:"Here's a science job!",story:"Here's a story to play!"};
  function rank(here,h){var fin={};(h.finished||[]).forEach(function(k){fin[k]=1});
    return here.challenges.map(function(c,i){var L=lvOf(h.ladders,c.fit||c.subject),lo=c.lv?c.lv[0]:0,hi=c.lv?c.lv[1]:3,g;
      if(L==null) g="at";else if(L>=lo&&L<=hi) g="at";else if(L<lo&&L>=lo-1) g="up";else if(L>hi) g="below";else g="far";
      var done=!!fin[here.id+"/"+c.act];
      var grp=g==="at"?(done?2:0):g==="up"?(done?3:1):g==="below"?(done?5:4):6;
      return {c:c,i:i,L:L,fit:g,done:done,grp:grp,d:L==null?0.5:Math.abs(L-(lo+hi)/2)}}).sort(function(a,b){return a.grp-b.grp||a.d-b.d||a.i-b.i})}
  /* rotation: best fits first, then the easier ones; challenges far above the kid are left out unless nothing else is there */
  function goodList(r){var g=r.filter(function(x){return x.grp<6});return g.length?g:r}
  var asked={};
  var orig=A.pointChallenge;
  function point(){var h=H(),here=h.area&&M.get(h.area);
    if(!(h.tab==="area"&&here&&here.challenges&&here.challenges.length)) return orig.apply(this,arguments);
    if(!hasData(h)){var r0=orig.apply(this,arguments);if(r0&&r0.challenge){var c0=here.challenges.filter(function(c){return c.id===r0.challenge})[0];
        var g0=glowFor(here.id,c0);r0.mode="fixed";r0.glow=!!g0;if(g0) r0.point="glow:"+here.id+"/"+c0.id}return r0}
    var r=rank(here,h),good=goodList(r),n=asked[here.id]=(asked[here.id]||0)+1,pick=good[(n-1)%good.length],c=pick.c;
    var gl=glowFor(here.id,c);
    var line=(SAYS[c.subject]?SAYS[c.subject]+" ":"")+c.line+(gl?" Look for the sparkle!":"");
    A.say(line,{kind:"challenge",id:here.id+"/"+c.id});
    var out={area:here.id,challenge:c.id,mode:"level",fit:pick.fit,done:pick.done,glow:!!gl,order:good.map(function(x){return x.c.id})};
    if(gl) out.point="glow:"+here.id+"/"+c.id;   /* makes the Ask box close so the glow is in view (same as the map highlights) */
    last.pick=out;return out}
  /* ------------------------------------------------------------ 2. glow: targets per area, read through each area's own probes */
  function W(){return innerWidth}function Hh(){return innerHeight}
  function g(o,k){try{return o&&o[k]}catch(e){return null}}
  function d2(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
  var EGY={moses:{w:function(E){return E.pinAt("palace")||(E.misPos&&E.misPos("spots")&&E.misPos("spots").palace)}  ,r:12,up:4,kinds:{eg3dmis:1,eg3dstaff:1},pins:{palace:1,nile:1,act:1},modes:{story:1}},
    pyramid:{w:function(E){return E.obj("kps")},r:8,up:3,kinds:{eg3dplateau:1,eg3dplace:1,eg3dbuild:1},pins:{plateau:1}},
    shaduf:{w:function(E){return E.obj("shaduf")},r:4,up:3.4,kinds:{eg3dshaduf:1},pins:{shaduf:1},modes:{shaduf:1}},
    stamp:{w:function(E){return E.obj("stamp")},r:4,up:3,kinds:{eg3dstampopen:1},pins:{stamp:1},modes:{read:1}}};
  function egypt(cid){var E=window.__eg3d,t=EGY[cid];if(!E||!t||typeof E.screenW!=="function") return null;var w=null;try{w=t.w(E)}catch(e){}
    if(!w||!isFinite(w[0])) return null;var x=+w[0],z=+w[1];
    return {where:[x,z],obj:"egypt:"+cid,r:t.r,proj:function(px,pz){var s=E.screenW(px,pz,null);return {x:s.x,y:s.y,behind:!(s.z<1)}},
      screen:function(){var s=E.screenW(x,z,null);return {x:s.x,y:s.y,behind:!(s.z<1)}},
      kid:function(){var m=E.mvP();return m&&m.k},
      hide:function(){var m=E.mvP();return !!(m&&m.mode&&m.mode!=="walk"&&m.mode!=="field")},
      started:function(ev){if(t.kinds[ev.kind]) return true;if(ev.kind==="eg3dpin"&&t.pins[ev.id]) return true;return false},
      startedNow:function(){var m=E.mvP();return !!(m&&t.modes&&t.modes[m.mode])}}}
  function savannah(cid){var S=window.__s3d,RF=window.__rf;if(!S||typeof S.screenW!=="function") return null;
    var kid=function(){var p=S.kid&&S.kid.position;return p?[p.x,p.z]:null},proj=function(px,pz){var s=S.screenW(px,pz,null);return {x:s.x,y:s.y,behind:!(s.z<1)}};
    if(cid==="observe"){try{var so=S.screenOf("pond");if(!so) return null}catch(e){return null}
      /* the water hole (s3d.js POND, 6,0,52) only for the edge arrow direction; reaching it uses the area's own distance */
      return {where:[6,52],obj:"savannah:pond",r:9,proj:proj,screen:function(){var s=S.screenOf("pond");return {x:s.x,y:s.y,behind:!(s.z<1)}},kid:kid,dist:function(){return S.screenOf("pond").dist},
        hide:function(){return false},started:function(){return false}}}
    if(cid==="rescue"){var st=null;try{st=RF&&RF.state().call}catch(e){}
      if(st&&(st.st==="call"||st.st==="spot")&&RF.scr("site")) return {where:null,obj:"savannah:rescue-animal",r:0,screen:function(){var s=RF.scr("site");return s?{x:s.x,y:s.y,behind:!(s.z<1)}:null},kid:kid,
        hide:function(){return false},started:function(ev){return ev.kind==="rfspotted"||ev.kind==="rfdrive"||ev.kind==="rfrescue"||ev.kind==="rfbinoc"}};
      var rw=S.world("radio");if(!rw) return null;var x=rw[0],z=rw[1];
      return {where:[x,z],obj:"savannah:radio",r:3.5,proj:proj,screen:function(){var s=S.screenW(x,z,null);return {x:s.x,y:s.y,behind:!(s.z<1)}},kid:kid,hide:function(){return false},
        started:function(ev){return ev.kind==="rfcall"||ev.kind==="rfbinoc"||ev.kind==="rfspotted"}}}
    if(cid==="read"){var cw=S.world("clinic");if(!cw) return null;var cx=cw[0],cz=cw[1];
      return {where:[cx,cz],obj:"savannah:clinic",r:9,proj:proj,screen:function(){var s=S.screenW(cx,cz,null);return {x:s.x,y:s.y,behind:!(s.z<1)}},kid:kid,hide:function(){return false},
        started:function(ev){return ev.kind==="s3dreadopen"||ev.kind==="rftag"||ev.kind==="rfclinicin"}}}
    return null}
  function reef(cid){var R=window.__r3d;if(!R||typeof R.screenOf!=="function") return null;
    var kc=null,kt=0,kid=function(){var n=performance.now();if(!kc||n-kt>250){kt=n;var s=R.state();kc=s&&s.kid?[s.kid.x,s.kid.z]:null}return kc},k0=null;try{k0=kid()}catch(e){}if(!k0) return null;
    function nearest(list){var b=null,bd=1e9;(list||[]).forEach(function(p){var d=d2([p.x,p.z],k0);if(d<bd){bd=d;b=p}});return b}
    var tgt=null,obj,r=2.5,gone=null,kinds={};
    if(cid==="trash"){tgt=nearest(window.__r3dTrash&&__r3dTrash());obj="reef:trash";kinds={r3dtrash:1};
      var id=tgt&&tgt.id;gone=function(){return !(__r3dTrash()||[]).some(function(t){return t.id===id})}}
    else if(cid==="shark-letters"){tgt=nearest(window.__r3dFloatCoins&&__r3dFloatCoins());obj="reef:shark-coin";kinds={r3dsharkstart:1,r3dsharkcard:1}}
    else if(cid==="survey"){var sc=(R.schools()||[]).map(function(s){return {x:s.c[0],z:s.c[1]}});tgt=nearest(sc);obj="reef:fish-school";r=5;kinds={r3dphoto:1}}
    if(!tgt) return null;var x=tgt.x,z=tgt.z;
    return {where:[x,z],obj:obj,r:r,proj:function(px,pz){var q=R.screenOf("wp:"+px+","+pz);return {x:q.x,y:q.y,behind:false}},screen:function(){var s=R.screenOf("wp:"+x+","+z),c=R.cam(),k=kid();
        /* r3d's projection has no depth: call it behind when it is on the far side of the camera from the kid */
        var behind=!!(c&&k&&((x-c.x)*(k[0]-c.x)+(z-c.z)*(k[1]-c.z))<0);return {x:s.x,y:s.y,behind:behind}},
      kid:kid,hide:function(){return false},gone:gone,started:function(ev){return !!kinds[ev.kind]}}}
  function arctic(cid){var A3=window.__a3d;if(!A3||typeof A3.groundAt!=="function") return null;
    var kid=function(){var k=A3.kid&&A3.kid();return k?[k.wx,k.wz]:null};
    if(cid==="igloo") return {where:[0,0],obj:"arctic:igloo",r:3.5,proj:function(px,pz){var q=A3.groundAt(px,pz);return {x:q.x,y:q.y,behind:false,vis:q.vis}},screen:function(){var s=A3.groundAt(0,0);return {x:s.x,y:s.y,behind:false,vis:s.vis}},kid:kid,
      hide:function(){return A3.mode&&A3.mode!=="walk"},startedNow:function(){return A3.mode==="build"},started:function(){return false},btn:'[data-go="build"]'};
    if(cid==="fish"||cid==="sled"){var pl=(A3.places&&A3.places()||[]).filter(function(p){return p.id===cid})[0];if(!pl) return null;
      return {where:null,obj:"arctic:"+cid,r:0,screen:function(){var p=(A3.places()||[]).filter(function(q){return q.id===cid})[0];return p?{x:p.obj.x,y:p.obj.y,behind:false,vis:p.obj.vis}:null},
        kid:kid,dist:function(){var p=(A3.places()||[]).filter(function(q){return q.id===cid})[0];return p?p.dist:99},r2:2.5,hide:function(){return A3.mode&&A3.mode!=="walk"},
        started:function(ev){return (ev.kind==="a3dplacego"&&ev.id===cid)||ev.kind==="a3ddrill"}}}
    return null}
  var RES={egypt:egypt,savannah:savannah,reef:reef,arctic:arctic};
  /* ------------------------------------------------------------ beacon element + loop */
  var cur=null,last={pick:null,glow:null,history:[]};
  function host(){var roots=[].filter.call(document.body.children,function(c){return c.classList&&c.classList.contains("sbx")&&c.style.display!=="none"});return roots.length?roots[roots.length-1]:document.body}
  function mk(){var b=document.createElement("div");b.className="spk-beacon";b.setAttribute("aria-hidden","true");
    b.innerHTML='<div class="spk-bcol"></div><div class="spk-bring"></div><div class="spk-bring r2"></div><div class="spk-bstar">\u2728</div><div class="spk-barrow"></div>';return b}
  function stop(reason){if(!cur) return;var c=cur;cur=null;cancelAnimationFrame(c.raf);clearInterval(c.iv);try{c.el.remove()}catch(e){}
    if(c.btnEl) c.btnEl.classList.remove("spk-hubglow");
    c.rec.ended=Date.now();c.rec.reason=reason;c.rec.ms=c.rec.ended-c.rec.t;last.glow=c.rec;
    try{window.dispatchEvent(new CustomEvent("sparkglow:end",{detail:c.rec}))}catch(e){}}
  function glowFor(area,c){stop("replaced");if(!c) return null;var f=RES[area],t=null;try{t=f&&f(c.id)}catch(e){t=null}
    var rec={t:Date.now(),area:area,challenge:c.id,obj:t?t.obj:null,where:t&&t.where?t.where.map(function(v){return +(+v).toFixed(1)}):null,found:!!t,reason:null,shown:0,edge:0,frames:0};last.history.push(rec);if(last.history.length>20) last.history.shift();
    if(!t){rec.reason="not-found";last.glow=rec;return null}
    var s0=null;try{s0=t.screen()}catch(e){}if(!s0||!isFinite(s0.x)||!isFinite(s0.y)){rec.found=false;rec.reason="not-found";last.glow=rec;return null}
    var el=mk(),log=window.__sbxLog||[],li=log.length,kd0=null;try{var k=t.kid();if(t.dist) kd0=t.dist();else if(k&&t.where) kd0=d2(k,t.where)}catch(e){}
    rec.dist0=kd0==null?null:+kd0.toFixed(1);
    cur={el:el,t:t,rec:rec,t0:performance.now(),far0:kd0==null||kd0>(t.r||t.r2||0)};host().appendChild(el);
    if(t.btn){var be=document.querySelector(t.btn);if(be){be.classList.add("spk-hubglow");cur.btnEl=be}}
    var me=cur;
    function frame(){if(cur!==me) return;me.raf=requestAnimationFrame(frame);rec.frames++;
      if(el.parentNode!==host()) host().appendChild(el);
      var s=null,hid=false;try{hid=t.hide&&t.hide();s=t.screen()}catch(e){s=null}
      if(!s||hid){el.style.display="none";return}
      var w=W(),h=Hh(),x=s.x,y=s.y,edge=false;
      /* behind the camera or past its far plane: aim the edge arrow at a point 12 m from the kid toward the spot */
      if(s.behind&&t.proj&&t.where){var kk=null;try{kk=t.kid()}catch(e){}if(kk){var vx=t.where[0]-kk[0],vz=t.where[1]-kk[1],L=Math.hypot(vx,vz)||1,q=null;try{q=t.proj(kk[0]+vx/L*Math.min(12,L),kk[1]+vz/L*Math.min(12,L))}catch(e){}
        if(q&&!q.behind&&isFinite(q.x)){x=q.x;y=q.y;s={x:x,y:y,behind:false,vis:false}}}}
      if(s.behind){x=w-x;y=h+40}
      /* in view = the spot itself is on screen; otherwise a disc rides the edge (kept clear of the top bar and the bottom tool bar) */
      var inView=!s.behind&&x>=8&&x<=w-8&&y>=56&&y<=h-8&&s.vis!==false;
      if(!inView){edge=true;var mx=w<=480?58:72,top=w<=480?120:110,bot=h-(w<=480?190:130),cx=w/2,cy=(top+bot)/2,dx=x-cx,dy=y-cy,k2=Math.min((w/2-mx)/Math.max(1,Math.abs(dx)),((bot-top)/2)/Math.max(1,Math.abs(dy)));if(k2<1){x=cx+dx*k2;y=cy+dy*k2}
        el.style.setProperty("--ang",(Math.atan2(dy,dx)*57.3+90).toFixed(0)+"deg")}
      el.classList.toggle("edge",edge);el.style.display="";el.style.transform="translate("+x.toFixed(1)+"px,"+y.toFixed(1)+"px)";
      if(edge) rec.edge++;else rec.shown++;rec.lastXY=[Math.round(x),Math.round(y)]}
    me.raf=requestAnimationFrame(frame);
    me.iv=setInterval(function(){if(cur!==me) return;
      if(performance.now()-me.t0>=GLOW_MS) return stop("timeout");
      var hh=H();if(hh.tab!=="area"||hh.area!==area) return stop("left-area");
      try{var L=window.__sbxLog||[];if(L!==log){log=L;li=0}for(;li<L.length;li++){var ev=L[li];if(ev&&ev.t!=null&&t.started&&t.started(ev)) return stop("started:"+ev.kind)}}catch(e){}
      try{if(t.startedNow&&t.startedNow()) return stop("started:mode")}catch(e){}
      try{if(t.gone&&t.gone()) return stop("reached:picked")}catch(e){}
      try{var d=null;if(t.dist) d=t.dist();else{var k=t.kid();if(k&&t.where) d=d2(k,t.where)}rec.dist=d==null?null:+d.toFixed(1);
        var R=t.r||t.r2||0;if(d!=null&&R&&d<=R){if(me.far0) return stop("reached")}else if(d!=null&&R&&d>R) me.far0=true}catch(e){}},200);
    return rec}
  A.pointChallenge=point;A.__level=1;A.glow=function(area,id){var e=M.get(area),c=e&&e.challenges.filter(function(x){return x.id===id})[0];return glowFor(area,c)};
  window.SparkLevel={rank:function(){var h=H(),e=h.area&&M.get(h.area);return e&&e.challenges.length?rank(e,h).map(function(x){return {id:x.c.id,fit:x.fit,done:x.done,grp:x.grp}}):null},
    point:point,stop:function(){stop("manual")},get state(){return {pick:last.pick,glow:cur?cur.rec:last.glow,active:!!cur,history:last.history.slice()}},GLOW_MS:GLOW_MS,
    resetAsked:function(){asked={}}};
})();
