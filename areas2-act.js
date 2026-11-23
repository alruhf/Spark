/* Spark areas v2 — activity modules.  Each is  function(api, cfg) -> Promise  (resolves when the kid has finished the activity).
   build   : drag pieces onto glowing outlines to BUILD something that then comes alive      (Sahara camp, Arctic igloo, Reef garden)
   scratch : dig / scrub the cover away with a finger to reveal something, plus drag helpers (Sahara water hole, Reef clean-up)
   feed    : drag a food to an animal (Savannah's feeding), right/wrong foods, fact after every bite
   fish    : crack the ice, wait for the float to dip, tap to catch                           (Arctic)
   paint   : paint aurora ribbons in the sky with your finger, each swipe plays a note        (Arctic)
   trace   : connect the stars in order, then find the hidden animal that pops up    (Sahara)
   photo   : snorkel and tap the fish to take photos for your album                           (Reef) */
(function(){
"use strict";
var SA=window.SparkAreas;if(!SA) return;
function reg(t,f){SA.register(t,f)}
function R(a,b){return a+Math.random()*(b-a)}
function norm(spec){return !spec?{}:(typeof spec==="string"?(spec.indexOf("svg:")===0?{svg:spec.slice(4)}:{a:spec}):spec)}
function ratioOf(api,spec){var s=norm(spec),a=s.a&&api.asset(s.a);if(a) return a.w/a.h;var k=s.svg||(s.a&&s.a.replace(/^(gear|build|prop|ride)_/,""));return (window.SparkAreasArt&&SparkAreasArt.ratio(k))||1}
function px(n){return Math.round(n*10)/10+"px"}
function lvlN(api,o){return api.byLvl(o)}
function minLvlOk(api,p){var L={lo:0,mid:1,hi:2},m=p.minLvl||"lo";return L[api.lvl()]>=L[m]}
function stepHost(api){var h=api.host;return h}
function viewBox(api){var r=api.host.getBoundingClientRect();return {w:r.width||innerWidth,h:r.height||innerHeight,l:r.left,t:r.top}}
function sparkReserve(){return innerWidth<900?120:130}

/* shared: a wooden tray of pictures at the bottom (Savannah's food tray look) */
function mkTray(api,items,opt){
  var t=api.el("div","ar2-trayw");t.setAttribute("role","group");api.host.appendChild(t);
  var map={};
  items.forEach(function(it){
    var b=api.el("div","ar2-item");b.dataset.id=it.id;b.setAttribute("role","button");b.tabIndex=0;b.setAttribute("aria-label",it.label);
    b.innerHTML='<span class="ip">'+api.picInner(it.pic)+'</span><span class="il">'+api.esc(it.label)+'</span>'+(it.count?'<span class="cnt">'+it.count+'</span>':"");
    t.appendChild(b);map[it.id]={el:b,it:it};
  });
  return {el:t,map:map};
}

/* ============================================================================ BUILD */
reg("build",function(api,cfg){
  return new Promise(function(resolve){
    var host=api.host,V=viewBox(api),small=V.h<520;
    var pieces=[];
    if(cfg.rows){ // igloo-like: rows of identical blocks
      var rows=cfg.rows[api.lvl()]||cfg.rows.mid,bw=cfg.blockW,ar=ratioOf(api,cfg.block),bh=bw/ar*(cfg.padAspect||1.9); // block height in % of pad HEIGHT
      var y0=cfg.baseY;
      rows.forEach(function(n,r){
                for(var i=0;i<n;i++) pieces.push({id:"b"+r+"_"+i,kind:"block",row:r,pic:cfg.block,label:"Ice block",slot:{x:50+(i-(n-1)/2)*bw*cfg.overlapX,y:y0-r*bh*cfg.overlapY,w:bw}});
      });
      if(cfg.door){var drow=0;var dw=cfg.door.w;
        // make room: remove the middle blocks of row 0 that the door covers
        var cover=Math.round(dw/(bw*cfg.overlapX));
        var row0=pieces.filter(function(p){return p.row===0});
        var mid=Math.floor(row0.length/2),rm=[];for(var k=0;k<cover;k++) rm.push(row0[mid-Math.floor(cover/2)+k]);
        pieces=pieces.filter(function(p){return rm.indexOf(p)<0});
        pieces.push({id:"door",kind:"door",row:-1,pic:cfg.door.pic,label:"Door",slot:{x:50,y:y0+ (cfg.door.dy||0),w:dw}});
      }
    }else{
      cfg.pieces.filter(function(p){return minLvlOk(api,p)}).forEach(function(p){pieces.push({id:p.id,kind:p.id,row:p.order||0,pic:p.pic,label:p.label,slot:p.slot,say:p.say,z:p.z||1,hint:p.hint})});
    }
    /* the pad */
    var pad=api.el("div","bpad");pad.style.cssText="position:absolute;z-index:2;";host.appendChild(pad);
    var asp=cfg.padAspect||1.9;
    function layout(){
      var vw=host.clientWidth||innerWidth,vh=host.clientHeight||innerHeight;
      var topY=Math.max(vh<520?58:112,vh*.2),botReserve=(vh<520?82:Math.max(110,vh*.19));topY=Math.max(topY,api.topInset());
      var availH=vh-topY-botReserve,availW=vw-24;
      var w=Math.min(availW,availH*asp,vw<900?vw-24:vw-2*sparkReserve());var h=w/asp;
      pad.style.width=px(w);pad.style.height=px(h);pad.style.left=px((vw-w)/2);pad.style.top=px(topY+(availH-h)/2);
      pad._w=w;pad._h=h;
      pieces.forEach(function(p){place(p)});
    }
    function place(p){
      if(!p.slotEl) return;var s=p.slot,w=pad._w*s.w/100,ar=ratioOf(api,p.pic),h=w/ar;
      [p.slotEl,p.placedEl].forEach(function(n){if(!n) return;n.style.width=px(w);n.style.height=px(h);n.style.left=px(pad._w*s.x/100-w/2);n.style.top=px(pad._w*(s.y/100)*(1)-h/2)});
    }
    /* y is given in % of pad WIDTH*asp... keep simple: y in % of pad HEIGHT */
    place=function(p){
      if(!p.slotEl) return;var s=p.slot,w=pad._w*s.w/100,ar=ratioOf(api,p.pic),h=w/ar;
      [p.slotEl,p.placedEl].forEach(function(n){if(!n) return;n.style.width=px(w);n.style.height=px(h);n.style.left=px(pad._w*s.x/100-w/2);n.style.top=px(pad._h*s.y/100-h/2)});
    };
    if(cfg.padBg){var g=api.el("div","bpadbg");g.style.cssText="position:absolute;inset:-2% -3%;border-radius:26px;background:"+cfg.padBg+";box-shadow:inset 0 0 40px #0006;border:2px solid #ffffff22;";pad.appendChild(g)}
    pieces.forEach(function(p){
      var s=api.el("span","bslot");s.style.cssText="position:absolute;opacity:.0;transition:opacity .3s;pointer-events:none;z-index:"+(p.z||1);
      s.innerHTML='<span style="display:block;width:100%;height:100%;filter:brightness(0) invert(1) opacity(.55) drop-shadow(0 0 6px #ffe56a);outline:0">'+api.picInner(p.pic)+'</span>';
      var inner=s.firstChild;inner.style.cssText+=";border:0";
      pad.appendChild(s);p.slotEl=s;
      var pe=api.el("span","bplaced");pe.style.cssText="position:absolute;display:none;pointer-events:none;z-index:"+((p.z||1)+2);pe.innerHTML=api.picInner(p.pic);pad.appendChild(pe);p.placedEl=pe;
      [p.slotEl.querySelector("img,svg"),p.placedEl.querySelector("img,svg")].forEach(function(i){if(i){i.style.width="100%";i.style.height="100%";i.style.objectFit="contain";i.style.display="block"}});
    });
    layout();
    var onR=function(){layout()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    /* tray: one item per piece kind (identical blocks share one item with a count) */
    var kinds=[],byKind={};
    pieces.forEach(function(p){if(!byKind[p.kind]){byKind[p.kind]={kind:p.kind,pic:p.pic,label:p.label,list:[]};kinds.push(byKind[p.kind])}byKind[p.kind].list.push(p)});
    if(cfg.shuffleTray) kinds=api.shuffle(kinds);
    var tray=mkTray(api,kinds.map(function(k){return {id:k.kind,pic:k.pic,label:k.label,count:k.list.length>1?k.list.length:0}}));
    var placed=0,total=pieces.length,facts=cfg.factsAt||[];
    var seq=cfg.order==="seq";
    function open(kind){return byKind[kind].list.filter(function(p){return !p.done})}
    function eligible(p){
      if(p.done) return false;
      if(cfg.rows){ if(p.kind==="door") return true; var lower=pieces.filter(function(q){return q.kind==="block"&&q.row<p.row&&!q.done});return lower.length===0 }
      if(seq){var i=pieces.indexOf(p);for(var k=0;k<i;k++) if(!pieces[k].done) return false}
      return true;
    }
    function refreshHints(){
      pieces.forEach(function(p){p.slotEl.style.opacity=(!p.done&&eligible(p))?"1":(p.done?"0":".0")});
      kinds.forEach(function(k){var left=open(k.kind).length;var item=tray.map[k.kind].el;item.style.display=left?"":"none";var c=item.querySelector(".cnt");if(c){c.textContent=left}
        item.classList.toggle("good",open(k.kind).some(eligible)&&!!cfg.glowTray)});
    }
    refreshHints();
    var wrongTries=0;
    kinds.forEach(function(k){
      var item=tray.map[k.kind].el;
      api.drag(item,{
        ok:function(){return api.live()&&open(k.kind).length>0},
        drop:function(x,y){
          var pr=api.rectOf(pad),near=api.inside(x,y,pr,40);
          if(!near) return false;
          var cands=open(k.kind).filter(eligible);
          if(!cands.length){
            wrongTries++;api.sfx("no");var nx=pieces.filter(eligible)[0];
            api.say(nx?cfg.notYet&&api.pick(cfg.notYet)||"Not yet! Look for the glowing outline.":"Not yet!",{state:"concern",after:"idle"});
            if(wrongTries>=2&&nx){var gi=tray.map[nx.kind];if(gi) gi.el.classList.add("good")}
            return false;
          }
          // nearest outline to the drop point
          var best=null,bd=1e9;cands.forEach(function(p){var r=api.rectOf(p.slotEl),d=Math.hypot(x-r.cx,y-r.cy);if(d<bd){bd=d;best=p}});
          if(!seq&&!cfg.rows&&bd>pr.w*.34){api.sfx("no");api.say("Almost! Drop it on the glowing shape.",{state:"concern",after:"idle"});return false}
          putPiece(best);return true;
        },
        tap:function(){ // a tap also works: the next open outline gets the piece
          var cands=open(k.kind).filter(eligible);if(!cands.length) return false;putPiece(cands[0]);return false}
      });
    });
    function putPiece(p){
      p.done=true;placed++;api.sfx("thunk");
      p.placedEl.style.display="block";p.slotEl.style.opacity="0";
      if(p.placedEl.animate&&!api.reduced()) p.placedEl.animate([{transform:"translateY(-26px) scale(1.18)",opacity:.2},{transform:"translateY(3px) scale(.97)",opacity:1,offset:.7},{transform:"none",opacity:1}],{duration:380,easing:"ease-out"});
      var r=api.rectOf(p.placedEl);api.burst(r.cx,r.cy,6);
      tray.map[p.kind]&&0;
      refreshHints();
      if(p.say&&placed<total) api.say(p.say);
      else if(facts.indexOf(placed)>=0&&placed<total) api.fact();
      var nx=pieces.filter(eligible)[0];
      if(placed<total&&nx&&cfg.glowNext!==false){var it=tray.map[nx.kind];if(it){tray.el.querySelectorAll(".ar2-item").forEach(function(n){n.classList.remove("good")});it.el.classList.add("good")}}
      if(placed>=total) alive();
    }
    api.hint(cfg.hint);
    var nx0=pieces.filter(eligible)[0];if(nx0&&cfg.glowNext!==false&&tray.map[nx0.kind]) tray.map[nx0.kind].el.classList.add("good");
    async function alive(){
      api.hint(null);
      tray.el.style.display="none";
      pad.classList.add("alive");api.sfx("win");
      var r=api.rectOf(pad);api.burst(r.cx,r.cy,24);
      var A=cfg.alive||{};
      if(A.glow){var gl=api.el("div","bglow");gl.style.cssText="position:absolute;left:"+A.glow.x+"%;top:"+A.glow.y+"%;width:"+A.glow.w+"%;aspect-ratio:1/1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#ffd54acc,#ffb02e55 45%,#ffb02e00 70%);z-index:0;animation:bGlow 1.6s ease-in-out infinite alternate;pointer-events:none";pad.appendChild(gl);ensureCss()}
      if(A.reveal&&api.picHas(A.reveal.pic)){ // the stacked pieces melt into the finished, glowing build
        var rv=api.el("div","breveal"),rar=ratioOf(api,A.reveal.pic),rw=pad._w*A.reveal.w/100;
        rv.style.cssText="position:absolute;z-index:8;pointer-events:none;width:"+px(rw)+";left:"+px(pad._w*A.reveal.x/100-rw/2)+";top:"+px(pad._h*A.reveal.y/100-rw/rar)+";filter:drop-shadow(0 0 26px #ffd54acc)";
        rv.innerHTML=api.picInner(A.reveal.pic);var rim=rv.querySelector("img,svg");if(rim){rim.style.width="100%";rim.style.height="auto";rim.style.display="block"}
        pieces.forEach(function(p){if(p.placedEl){p.placedEl.style.transition="opacity .9s";p.placedEl.style.opacity="0"}});
        pad.appendChild(rv);
        if(rv.animate&&!api.reduced()) rv.animate([{opacity:0,transform:"scale(.82)"},{opacity:1,transform:"scale(1.04)",offset:.7},{opacity:1,transform:"scale(1)"}],{duration:1100,easing:"ease-out",fill:"backwards"});
      }
      (A.actors||[]).forEach(function(a,i){
        var im=api.el("div","bactor");im.innerHTML=api.picInner(a.pic);var w=a.w;
        var ar=ratioOf(api,a.pic);im.style.cssText="position:absolute;z-index:9;width:"+px(pad._w*w/100)+";left:"+px(pad._w*a.x/100-pad._w*w/200)+";top:"+px(pad._h*a.y/100-pad._w*w/100/ar)+";pointer-events:none";
        var inner=im.querySelector("img,svg");if(inner){inner.style.width="100%";inner.style.height="auto";inner.style.display="block"}
        if(a.flip) im.firstChild.style.transform="scaleX(-1)";
        pad.appendChild(im);
        if(im.animate&&!api.reduced()){
          var from=a.from==="left"?-pad._w*.6:a.from==="right"?pad._w*.6:0,fy=a.from==="up"?-pad._h*.7:(a.from==="down"?pad._h*.5:0);
          im.animate([{transform:"translate("+from+"px,"+fy+"px)",opacity:0},{transform:"translate(0,0)",opacity:1}],{duration:a.dur||1600,delay:i*350,easing:"ease-out",fill:"backwards"});
          if(a.loop) im.animate([{transform:"translate(0,0)"},{transform:"translate("+px(a.loop[0]*pad._w/100)+","+px(a.loop[1]*pad._h/100)+")"}],{duration:a.loopDur||3200,delay:(a.dur||1600)+i*350,iterations:Infinity,direction:"alternate",easing:"ease-in-out"});
          else im.animate([{transform:"translateY(0)"},{transform:"translateY(-6px)"}],{duration:1100,delay:(a.dur||1600)+i*350,iterations:Infinity,direction:"alternate",easing:"ease-in-out"});
        }
      });
      if(A.snow) snowfall(api,pad);
      if(A.bubbles) bubbles(api,pad);
      await api.say(A.line||"It is alive!",{state:"celebration",after:"idle"});
      if(!api.live()) return;
      await api.sleep(A.hold||1800);
      if(!api.live()) return;
      resolve({built:true});
    }
  });
});
function ensureCss(){
  if(document.getElementById("ar2-act-css")) return;
  var s=document.createElement("style");s.id="ar2-act-css";
  s.textContent="@keyframes bGlow{from{opacity:.55;transform:translate(-50%,-50%) scale(.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}"+
  "@keyframes ar2Flake{to{transform:translate3d(var(--dx),110vh,0)}}"+
  "@keyframes ar2Bub{0%{transform:translate3d(0,0,0) scale(.6);opacity:0}15%{opacity:.8}100%{transform:translate3d(var(--dx),-110vh,0) scale(1.1);opacity:0}}"+
  "@keyframes ar2Swim{from{transform:translateX(-30vw)}to{transform:translateX(130vw)}}"+
  "@keyframes ar2Munch{0%,100%{transform:scale(1)}30%{transform:scale(1.07,.92)}60%{transform:scale(.97,1.05)}}"+
  "@keyframes ar2Shake{25%{transform:translateX(-8px) rotate(-3deg)}75%{transform:translateX(8px) rotate(3deg)}}"+
  "@keyframes ar2Pulse2{50%{transform:scale(1.18)}}"+
  "@keyframes ar2Sway{from{transform:translateY(0)}to{transform:translateY(-10px)}}"+
  "@keyframes ar2Flash{0%{opacity:.95}100%{opacity:0}}"+
  "@keyframes ar2Ring{from{transform:translate(-50%,-50%) scale(.2);opacity:.9}to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}"+
  "@keyframes ar2Pop2{0%{transform:translate(-50%,-50%) scale(0)}70%{transform:translate(-50%,-50%) scale(1.15)}100%{transform:translate(-50%,-50%) scale(1)}}";
  document.head.appendChild(s);
}
function snowfall(api,host){
  ensureCss();var box=api.el("div","snowbox");box.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden";document.body.appendChild(box);
  for(var i=0;i<46;i++){var f=api.el("i");f.textContent="\u2744";f.style.cssText="position:absolute;top:-24px;left:"+R(0,100)+"vw;font-size:"+R(10,22)+"px;color:#fff;opacity:.85;--dx:"+R(-60,60)+"px;animation:ar2Flake "+R(5,9)+"s linear "+R(0,5)+"s infinite";box.appendChild(f)}
  api.onEnd(function(){box.remove()});
}
function bubbles(api,host){
  ensureCss();var box=api.el("div","bubbox");box.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden";document.body.appendChild(box);
  for(var i=0;i<26;i++){var f=api.el("i");var s=R(8,24);f.style.cssText="position:absolute;bottom:-30px;left:"+R(0,100)+"vw;width:"+s+"px;height:"+s+"px;border-radius:50%;border:2px solid #ffffffbb;background:#ffffff33;--dx:"+R(-40,40)+"px;animation:ar2Bub "+R(5,10)+"s ease-in "+R(0,6)+"s infinite";box.appendChild(f)}
  api.onEnd(function(){box.remove()});
}

/* ============================================================================ FEED: "Who eats what?" (Arctic food web)
   Hands-on matching: the kid picks a food and gives it to the animal THEY choose (drag it there, or tap the food, then tap the animal).
   Every food belongs to one animal. Right: the food flies to its mouth, the animal munches, its tag turns green. Wrong: the animal
   shakes its head, Spark says whose food it is, and the food goes back to the tray. Input is never blocked while Spark talks:
   a new drop cuts the old line, and the facts are told again later if they were cut short. */
reg("feed",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,band=api.band(),K=band==="k",fed=0,wrong=0,doneAll=false;
    var allow=function(o){return !o.bands||o.bands.indexOf(band)>=0};
    var foods=cfg.foods.filter(allow),list=cfg.animals.filter(allow);
    var need=list.length;
    var scene=api.el("div","fscene");scene.style.cssText="position:absolute;inset:0;z-index:2";host.appendChild(scene);
    var animals=[],n=list.length,trayEl=null;
    function layout(){
      var vw=host.clientWidth||innerWidth,vh=host.clientHeight||innerHeight;
      var topY=Math.max(vh<520?58:122,vh*.2),botY=vh<520?84:Math.max(124,vh*.21);topY=Math.max(topY,api.topInset());
      if(trayEl){var tr=trayEl.getBoundingClientRect(),hr=host.getBoundingClientRect();if(tr.height&&tr.top-hr.top>vh*.45)botY=Math.max(botY,vh-(tr.top-hr.top)+40)}
      var availH=vh-topY-botY,usableW=vw-(vw<900?(vh<520?24+112:24):2*sparkReserve());
      var lx0=vw<900?12:sparkReserve();
      if(trayEl&&vh<520){var t2=trayEl.getBoundingClientRect(),h2=host.getBoundingClientRect();if(t2.width&&t2.right-h2.left<vw*.62&&t2.top-h2.top>vh*.45){lx0=t2.right-h2.left+10;usableW=vw-lx0-(vw<900?170:sparkReserve());availH=vh-topY-60}}
      animals.forEach(function(a,i){
        var an=a.cfg,ar=ratioOf(api,an.pic),slot=usableW/n,h=Math.min(availH*an.h,slot/ar*.96),w=h*ar;
        var cx=lx0+slot*(i+.5);
        a.box.style.width=px(w);a.box.style.height=px(h);a.box.style.left=px(cx-w/2);a.box.style.top=px(topY+availH-h+(an.dy||0)*h/100);
        /* the tap target is at least 96 px (k) / 64 px, centred on the animal, so small animals are easy to hit */
        var tw=Math.max(w,K?110:72),th=Math.max(h+28,K?120:80);a.hit.style.width=px(tw);a.hit.style.height=px(th);a.hit.style.left=px(cx-tw/2);a.hit.style.top=px(topY+availH-th+20+(an.dy||0)*h/100);
      });
    }
    list.forEach(function(an){
      var b=api.el("div","fanimal");b.dataset.id=an.id;b.style.cssText="position:absolute;transform-origin:50% 100%;pointer-events:none;transition:filter .15s";
      b.innerHTML='<span style="display:block;width:100%;height:100%">'+api.picInner(an.pic)+'</span><span class="ftag" style="position:absolute;left:50%;bottom:-6px;transform:translate(-50%,100%);padding:4px 12px;border-radius:999px;background:#10243ecc;border:1px solid #ffffff44;font-weight:800;font-size:'+(K?16:14)+'px;white-space:nowrap">'+api.esc(an.name)+'</span>';
      var im=b.querySelector("img,svg");if(im){im.style.width="100%";im.style.height="100%";im.style.objectFit="contain";im.style.display="block";im.style.filter="drop-shadow(0 10px 8px #0008)"}
      if(an.flip&&b.firstChild) b.firstChild.style.transform="scaleX(-1)";
      var hit=api.el("button","fhit");hit.type="button";hit.dataset.id=an.id;hit.setAttribute("aria-label",an.name);hit.style.cssText="position:absolute;z-index:3;border:0;background:transparent;padding:0;border-radius:24px;cursor:pointer;touch-action:none";
      scene.appendChild(b);scene.appendChild(hit);var a={cfg:an,box:b,hit:hit,fed:false};animals.push(a);
      /* tap an animal while a food is picked up (tap-the-food, then tap-the-animal) */
      hit.addEventListener("pointerdown",function(e){if(!picked) {api.say(api.pick(cfg.pickFirst)||"Pick a food first, then give it to an animal.",{after:"idle"});return}
        e.preventDefault();e.stopPropagation();var f=picked;unpick();var r=api.rectOf(hit);give(a,f,r.cx,r.cy,null)});
    });
    var used={};
    var tray=mkTray(api,foods.map(function(f){return {id:f.id,pic:f.pic,label:api.pick(f.label)}}));trayEl=tray.el;trayEl.classList.add("ar2-feedtray");layout();setTimeout(layout,400);
    var onR=function(){layout()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    api.hint(cfg.hint);
    function animalAt(x,y){var best=null,bd=1e9;animals.forEach(function(a){var r=api.rectOf(a.hit);if(api.inside(x,y,r,K?14:4)){var d=Math.hypot(x-r.cx,y-r.cy);if(d<bd){bd=d;best=a}}});return best}
    function glowAt(a){animals.forEach(function(q){q.box.style.filter=(q===a)?"drop-shadow(0 0 16px #ffe56a) drop-shadow(0 0 5px #fff)":""})}
    /* picking a food by tapping it: it lifts and glows; the next tap on an animal gives it */
    var picked=null;
    function unpick(){if(picked){tray.map[picked.id].el.classList.remove("armed");picked=null;animals.forEach(function(q){q.hit.classList.remove("pick")})}}
    foods.forEach(function(f){
      var item=tray.map[f.id].el;
      api.drag(item,{
        ok:function(){return api.live()&&!used[f.id]&&!doneAll},
        move:function(x,y){glowAt(animalAt(x,y))},
        tap:function(){if(picked===f){unpick();return false}unpick();picked=f;item.classList.add("armed");api.sfx("click");animals.forEach(function(q){if(!q.fed) q.hit.classList.add("pick")});
          api.hint(api.pick(cfg.hintTap)||"Now tap the animal that eats it");return false},
        drop:function(x,y){glowAt(null);unpick();var a=animalAt(x,y);if(!a) return false;return give(a,f,x,y)}
      });
    });
    function line(o,id){if(!o) return "";var v=o[id]!=null?o[id]:o.any;return v==null?"":api.pick(v)}
    function give(a,f,x,y){
      api.hint(cfg.hint);
      var ok=f.ok.indexOf(a.cfg.id)>=0;
      if(a.fed){api.sfx("no");api.say(api.pick(cfg.full)||"That one has eaten. Try another animal.",{state:"concern",after:"idle"});return false}
      if(!ok){
        wrong++;api.sfx("no");
        a.box.style.animation="ar2Shake .45s";setTimeout(function(){a.box.style.animation=""},500);
        api.floatUp(x,y-20,"\u2753");
        api.say(line(f.wrong,a.cfg.id)||api.pick(cfg.wrongAny),{state:"concern",after:"idle"});
        if(wrong>=2&&K){/* gentle help for little ones: the right animal for this food glows */var right=animals.filter(function(q){return f.ok.indexOf(q.cfg.id)>=0&&!q.fed})[0];if(right){right.hit.classList.add("help");setTimeout(function(){right.hit.classList.remove("help")},2600)}}
        return false;
      }
      used[f.id]=true;a.fed=true;fed++;var it=tray.map[f.id].el;it.style.transition="opacity .3s,transform .3s";it.style.opacity="0";it.style.transform="scale(.6)";it.style.pointerEvents="none";setTimeout(function(){it.style.visibility="hidden"},320);/* keep its slot: the other foods must not jump under the child's finger */
      var r=api.rectOf(a.box);
      var gh=document.createElement("div");gh.className="ar2-ghost";gh._size=64;gh.style.width=gh.style.height="64px";gh.innerHTML=api.picInner(f.pic);document.body.appendChild(gh);
      var tx=r.cx+(a.cfg.mouth?(a.cfg.mouth[0]-50)*r.w/100:0),ty=r.t+r.h*(a.cfg.mouth?a.cfg.mouth[1]/100:.4);
      if(gh.animate){var an=gh.animate([{transform:"translate3d("+(x-32)+"px,"+(y-32)+"px,0) scale(1)",opacity:1},{transform:"translate3d("+(tx-32)+"px,"+(ty-32)+"px,0) scale(.3)",opacity:0}],{duration:420,easing:"ease-in",fill:"forwards"});an.onfinish=function(){gh.remove()}}else gh.remove();
      setTimeout(function(){a.box.style.animation="ar2Munch .6s ease-in-out 2";api.sfx("munch");api.burst(r.cx,r.t+r.h*.3,8,["\u2728","\u2B50"]);
        var tg=a.box.querySelector(".ftag");if(tg){tg.style.background="#2fbf71";tg.textContent=a.cfg.name+" \u2713"}a.hit.classList.remove("pick")},380);
      api.sfx("ok");
      var react=line(f.react,a.cfg.id)||"Yum!";
      if(fed>=need){doneAll=true;api.hint(null);
        (async function(){await api.sleep(450);await api.say(react,{state:"celebration",after:"idle"});if(!api.live()) return;var dq=(band==="u"||band==="t")&&cfg.deep?cfg.deep[band]:null;host._feedDeep=!!dq;if(dq){for(var qi=0;qi<dq.length;qi++){await quiz4(api,dq[qi]);if(!api.live()) return}}await api.sleep(300);resolve({fed:fed,wrong:wrong})})();}
      else api.fact(null,react);
      return true;
    }
    host._feed={animals:animals,foods:foods,give:function(aid,fid){var a=animals.filter(function(q){return q.cfg.id===aid})[0],f=foods.filter(function(q){return q.id===fid})[0];var r=api.rectOf(a.hit);return give(a,f,r.cx,r.cy)},state:function(){return {fed:fed,wrong:wrong,need:need,used:Object.keys(used)}}};
  });
});
/* ============================================================================ SCRATCH (dig / scrub) */
reg("scratch",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,V=viewBox(api);
    var patch=api.el("div","spatch");patch.style.cssText="position:absolute;z-index:2;border-radius:28px;overflow:hidden;box-shadow:0 14px 34px #000a,0 0 0 4px #ffffff55;background:#0b1626";host.appendChild(patch);
    var under=api.el("div","sunder");under.style.cssText="position:absolute;inset:0";under.innerHTML=api.picInner(cfg.reveal.pic);
    var ui=under.querySelector("img,svg");if(ui){ui.style.cssText="width:100%;height:100%;object-fit:cover;display:block"}
    patch.appendChild(under);
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair";patch.appendChild(cv);
    var ctx=cv.getContext("2d"),pw=0,ph=0;
    function paint(){
      var r=patch.getBoundingClientRect();pw=Math.max(200,Math.round(r.width/ (r.width>700?1.4:1)));ph=Math.max(120,Math.round(r.height/(r.width>700?1.4:1)));cv.width=pw;cv.height=ph;
      ctx.globalCompositeOperation="source-over";
      if(cfg.cover==="sand"){
        ctx.fillStyle="#dcb673";ctx.fillRect(0,0,pw,ph);
        for(var i=0;i<(pw*ph)/70;i++){ctx.fillStyle=Math.random()<.5?"rgba(120,80,30,.18)":"rgba(255,235,190,.22)";ctx.fillRect(Math.random()*pw,Math.random()*ph,1+Math.random()*2.5,1+Math.random()*2.5)}
        ctx.strokeStyle="rgba(140,95,40,.28)";ctx.lineWidth=2;for(var k=0;k<7;k++){ctx.beginPath();for(var x=0;x<=pw;x+=12){var y=ph*(.1+k*.14)+Math.sin(x/38+k)*7;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
      }else{ // murky algae film
        ctx.fillStyle="rgba(63,92,52,.94)";ctx.fillRect(0,0,pw,ph);
        for(var j=0;j<(pw*ph)/900;j++){ctx.fillStyle=Math.random()<.5?"rgba(30,60,30,.35)":"rgba(120,140,70,.3)";ctx.beginPath();ctx.arc(Math.random()*pw,Math.random()*ph,4+Math.random()*16,0,6.3);ctx.fill()}
      }
    }
    function lay(){
      var vw=host.clientWidth||innerWidth,vh=host.clientHeight||innerHeight;
      var topY=Math.max(vh<520?58:122,vh*.2),botY=vh<520?80:Math.max(120,vh*.19);topY=Math.max(topY,api.topInset());var availH=vh-topY-botY,availW=vw-(vw<900?24:2*sparkReserve());
      var w=Math.min(availW,availH*1.7),h=w/1.7;if(h>availH){h=availH;w=h*1.7}
      patch.style.width=px(w);patch.style.height=px(h);patch.style.left=px((vw-w)/2);patch.style.top=px(topY+(availH-h)/2);
    }
    lay();paint();var onR=function(){lay()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    var phase=cfg.pre?"pre":"scrub",pre=null,tray=null;
    var binEl=null;
    // ---- stage 1 (optional): pick up the litter and drop it in the bin
    if(cfg.pre){
      var left=cfg.pre.items.length;
      binEl=api.el("div","sbin");binEl.style.cssText="position:absolute;z-index:5;width:"+px(Math.max(70,Math.min(110,V.h*.16)))+";aspect-ratio:1/1";binEl.innerHTML=api.picInner(cfg.pre.bin);host.appendChild(binEl);
      var pr0=patch.getBoundingClientRect();binEl.style.left=px(Math.min(host.clientWidth-sparkReserve()-90,pr0.right-pr0.left>0?(pr0.left-host.getBoundingClientRect().left+pr0.width-10):100));
      binEl.style.top=px(pr0.top-host.getBoundingClientRect().top-8);
      var bi=binEl.querySelector("img,svg");if(bi){bi.style.cssText="width:100%;height:100%;object-fit:contain"}
      if(binEl.getBoundingClientRect().right>innerWidth-4){binEl.style.left=px(host.clientWidth-binEl.offsetWidth-8)}
      var litters=[];
      cfg.pre.items.forEach(function(it,i){
        var l=api.el("div","slitter");l.dataset.id=it.id;var sz=Math.max(64,Math.min(96,V.h*.13));
        l.style.cssText="position:absolute;z-index:6;width:"+px(sz)+";height:"+px(sz)+";cursor:grab;touch-action:none;filter:drop-shadow(0 6px 6px #000a);animation:ar2Sway 1.4s ease-in-out "+(i*.2)+"s infinite alternate";
        l.innerHTML=api.picInner(it.pic);var im=l.querySelector("img,svg");if(im){im.style.cssText="width:100%;height:100%;object-fit:contain;pointer-events:none"}
        l.setAttribute("role","button");l.setAttribute("aria-label",it.label);l.tabIndex=0;
        var pr=patch.getBoundingClientRect(),hr=host.getBoundingClientRect();
        l.style.left=px(pr.left-hr.left+pr.width*(it.x/100)-sz/2);l.style.top=px(pr.top-hr.top+pr.height*(it.y/100)-sz/2);
        host.appendChild(l);litters.push(l);
        api.drag(l,{ok:function(){return phase==="pre"&&api.live()},
          drop:function(x,y){
            var br=api.rectOf(binEl);
            if(!api.inside(x,y,br,50)){api.say(cfg.pre.wrong||"Put it in the bin!",{state:"concern",after:"idle"});return false}
            l.style.display="none";left--;api.sfx("pop");api.burst(br.cx,br.cy,6);binEl.animate&&binEl.animate([{transform:"scale(1.2)"},{transform:"scale(1)"}],{duration:300});
            if(left===1) api.fact(0);
            if(left<=0){phase="scrub";binEl.style.display="none";api.hint(cfg.hintScrub);api.say(cfg.pre.next||"Now scrub the reef clean!")}
            return true;
          }});
      });
      api.hint(cfg.pre.hint);
    }else api.hint(cfg.hint);
    // ---- scrub / dig
    var drawing=false,lx=0,ly=0,revealed=0,checkT=0,done=false,stage2=false,cnt=0;
    var small=document.createElement("canvas");small.width=36;small.height=22;var sctx=small.getContext("2d");
    function cov(){sctx.clearRect(0,0,36,22);sctx.drawImage(cv,0,0,36,22);var d=sctx.getImageData(0,0,36,22).data,c=0;for(var i=3;i<d.length;i+=4) if(d[i]<90) c++;return c/(36*22)}
    function pos(e){var r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*pw,(e.clientY-r.top)/r.height*ph]}
    cv.addEventListener("pointerdown",function(e){
      if(phase!=="scrub"||done) return;e.preventDefault();drawing=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}
      var p=pos(e);lx=p[0];ly=p[1];dot(lx,ly);
    });
    cv.addEventListener("pointermove",function(e){
      if(!drawing||done) return;var p=pos(e);ctx.globalCompositeOperation="destination-out";ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=Math.max(18,pw*.085);
      ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(p[0],p[1]);ctx.stroke();lx=p[0];ly=p[1];
      cnt++;if(cnt%7===0){api.sfx("whoosh");var rr=cv.getBoundingClientRect();api.burst(rr.left+p[0]/pw*rr.width,rr.top+p[1]/ph*rr.height,1,[cfg.cover==="sand"?"\u00B7":"\uD83E\uDEE7"])}
      if(!checkT){checkT=setTimeout(check,160)}
    });
    function dot(x,y){ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(x,y,Math.max(14,pw*.05),0,6.3);ctx.fill();if(!checkT) checkT=setTimeout(check,160)}
    function end(){drawing=false}
    cv.addEventListener("pointerup",end);cv.addEventListener("pointercancel",end);
    var factAt=[.25,.5];
    function check(){
      checkT=0;if(done||!api.live()) return;
      var c=cov();revealed=c;
      if(factAt.length&&c>=factAt[0]){factAt.shift();api.fact()}
      if(c>=(cfg.goal||.55)){
        done=true;cv.style.transition="opacity .5s";cv.style.opacity="0";cv.style.pointerEvents="none";api.hint(null);
        api.sfx("win");var r=api.rectOf(patch);api.burst(r.cx,r.cy,20);
        after();
      }
    }
    async function after(){
      await api.say(cfg.reveal.line,{state:"celebration",after:"idle"});
      if(!api.live()) return;
      if(cfg.fill){
        var r=api.rectOf(patch);
        api.hint(cfg.fill.hint);
        var tray2=mkTray(api,[{id:"fill",pic:cfg.fill.pic,label:cfg.fill.label}]);
        var it=tray2.map.fill.el;it.classList.add("good");
        // water pool target: centre of the revealed patch
        var meter=api.el("div","smeter");meter.style.cssText="position:absolute;z-index:7;width:46px;height:120px;border-radius:14px;border:3px solid #fff;background:#10243ecc;overflow:hidden;left:"+px(r.l-host.getBoundingClientRect().left+16)+";top:"+px(r.t-host.getBoundingClientRect().top+16)+";display:none";
        meter.innerHTML='<i style="position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(#6ad0ff,#2a8cd6);transition:height 1.4s ease-out"></i>';host.appendChild(meter);
        api.drag(it,{ok:function(){return api.live()&&!stage2},
          drop:function(x,y){
            var pr=api.rectOf(patch);if(!api.inside(x,y,pr,30)){api.say("Put it right on the water!",{state:"concern",after:"idle"});return false}
            stage2=true;meter.style.display="block";api.sfx("splash");requestAnimationFrame(function(){meter.firstChild.style.height="100%"});
            api.burst(x,y,12,["\uD83D\uDCA7","\u2728"]);
            (async function(){
              await api.sleep(1500);api.sfx("ok");it.style.opacity=".4";api.hint(null);
              await api.say(cfg.fill.done,{state:"celebration",after:"idle"});
              if(api.live()) resolve({dug:true});
            })();
            return true;
          }});
      }else{
        await api.sleep(500);if(api.live()) resolve({cleaned:true});
      }
    }
  });
});

/* ============================================================================ IGLOO (Arctic): a real snow-block igloo.
   Cut snow blocks are laid in a rising spiral (courses get smaller and lean in), a key block closes the top, then the entry tunnel goes on.
   Every block is a photo tile of compacted snow, projected onto the dome with a perspective (matrix3d) transform and lit from the upper left. */
reg("igloo",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,D=cfg.dome||{},PI=Math.PI;
    var COURSES=D.courses||[14,13,12,10,8,5],M=COURSES.length,TH=(D.thetaMax||84)*PI/180,HT=TH/(M+0.5),E=(D.elev||9)*PI/180,SQ=D.squash||1.06,PS=-PI/2;
    var tiles=cfg.tiles||[],nT=Math.max(1,tiles.length);
    var Lx=-0.5,Ly=0.65,Lz=0.55,Ln=Math.hypot(Lx,Ly,Lz);Lx/=Ln;Ly/=Ln;Lz/=Ln;
    /* blocks in spiral build order */
    var blocks=[];
    for(var i=0;i<M;i++){var N=COURSES[i],dp=2*PI/N,off=(i%2)*dp*.5;
      for(var j=0;j<N;j++){var p1=PS+off+j*dp;blocks.push({c:i,p1:p1,p2:p1+dp,tile:tiles[(i*5+j*3)%nT]})}}
    blocks.push({c:M,cap:true,tile:cfg.capTile||tiles[1%nT]});
    var G=Math.max(2,api.byLvl(cfg.groups)||12),T=blocks.length,pieces=[];
    for(var g=0;g<G;g++){var a=Math.round(g*T/G),b=Math.round((g+1)*T/G);pieces.push({i:g,blocks:blocks.slice(a,b),done:false})}
    function sOf(p){return Math.max(0,(p-PS)/(2*PI))}
    function th(c,p,top){if(c===0) return top?HT*(0.5+sOf(p)):0;return HT*(c-0.5+sOf(p)+(top?1:0))}
    /* the stage */
    var pad=api.el("div","igpad");pad.style.cssText="position:absolute;z-index:2;pointer-events:none";host.appendChild(pad);
    var shadow=api.el("div","igshadow");pad.appendChild(shadow);
    var glow=api.el("div","igglow");pad.appendChild(glow);
    var L={};
    function proj(t,p){var x=L.cx+L.R*Math.cos(t)*Math.sin(p),yu=L.R*SQ*Math.sin(t)*Math.cos(E)-L.R*Math.cos(t)*Math.cos(p)*Math.sin(E);return [x,L.gy-yu-L.R*Math.sin(E)]}
    function quadM(w,h,q){ // q: TL,TR,BR,BL -> CSS matrix3d for a w x h box (transform-origin 0 0)
      var x0=q[0][0],y0=q[0][1],x1=q[1][0],y1=q[1][1],x2=q[2][0],y2=q[2][1],x3=q[3][0],y3=q[3][1];
      var sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,A,B,C,Dd,Ee,F,Gg=0,Hh=0;
      if(Math.abs(sx)<1e-6&&Math.abs(sy)<1e-6){A=x1-x0;B=x3-x0;C=x0;Dd=y1-y0;Ee=y3-y0;F=y0}
      else{var dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,den=dx1*dy2-dx2*dy1;if(Math.abs(den)<1e-9) den=1e-9;
        Gg=(sx*dy2-dx2*sy)/den;Hh=(dx1*sy-sx*dy1)/den;A=x1-x0+Gg*x1;B=x3-x0+Hh*x3;C=x0;Dd=y1-y0+Gg*y1;Ee=y3-y0+Hh*y3;F=y0}
      var okp=[[0,0],[1,0],[1,1],[0,1]].every(function(u){return Gg*u[0]+Hh*u[1]+1>0.35});
      if(!okp){Gg=0;Hh=0;A=((x1-x0)+(x2-x3))/2;B=((x3-x0)+(x2-x1))/2;Dd=((y1-y0)+(y2-y3))/2;Ee=((y3-y0)+(y2-y1))/2;C=(x0+x1+x2+x3)/4-(A+B)/2;F=(y0+y1+y2+y3)/4-(Dd+Ee)/2}
      return "matrix3d("+[A/w,Dd/w,0,Gg/w,B/h,Ee/h,0,Hh/h,0,0,1,0,C,F,0,1].map(function(v){return Math.round(v*1e5)/1e5}).join(",")+")"}
    function grow(q,k){var cx=(q[0][0]+q[1][0]+q[2][0]+q[3][0])/4,cy=(q[0][1]+q[1][1]+q[2][1]+q[3][1])/4;return q.map(function(p){return [cx+(p[0]-cx)*(1+k),cy+(p[1]-cy)*(1+k)]})}
    function shade(t,p,inner){var nx=Math.cos(t)*Math.sin(p),ny=Math.sin(t),nz=Math.cos(t)*Math.cos(p),d=nx*Lx+ny*Ly+nz*Lz;
      var b=inner?0.68+0.2*Math.max(0,-d):0.86+0.26*Math.max(0,d);var tn=Math.max(0,Math.min(.38,(0.98-b)*1.3));
      return "sepia("+tn.toFixed(2)+") hue-rotate(178deg) saturate("+(1+tn).toFixed(2)+") brightness("+b.toFixed(3)+")"}
    /* every block becomes 1..3 quads (split where it turns from the front face to the inside of the back wall) */
    function c_grow(c){return .045+.012*c}
    function partsOf(bk){
      if(bk.cap) return [{cap:true}];
      var cuts=[bk.p1],out=[];[-PI/2,PI/2,3*PI/2,5*PI/2].forEach(function(c){if(c>bk.p1+1e-4&&c<bk.p2-1e-4) cuts.push(c)});cuts.push(bk.p2);
      for(var k=0;k<cuts.length-1;k++){var a=cuts[k],b=cuts[k+1],m=(a+b)/2;out.push({a:a,b:b,front:Math.cos(m)>0})}
      return out}
    pieces.forEach(function(pc){pc.els=[];pc.ghosts=[];
      pc.blocks.forEach(function(bk){partsOf(bk).forEach(function(pt){
        [0,1].forEach(function(gh){
          var im=document.createElement("img");im.alt="";im.draggable=false;im.decoding="async";im.src=api.url(bk.tile)||"";
          im.className=gh?"igghost":"igblk";im.style.display="none";pad.appendChild(im);
          var rec={el:im,bk:bk,pt:pt};(gh?pc.ghosts:pc.els).push(rec)})})})});
    var tun=api.el("div","igtun"),tunImg=document.createElement("img"),tunLit=document.createElement("img"),tunGhost=document.createElement("img");
    [tunImg,tunLit,tunGhost].forEach(function(n){n.alt="";n.draggable=false;n.decoding="async"});
    tunImg.src=api.url(norm(cfg.tunnel).a)||"";tunLit.src=api.url(norm(cfg.tunnelLit).a)||tunImg.src;tunGhost.src=tunImg.src;
    tunLit.className="lit";tunGhost.className="igghost";tun.appendChild(tunImg);tun.appendChild(tunLit);pad.appendChild(tun);pad.appendChild(tunGhost);
    tun.style.display="none";tunGhost.style.display="none";
    var BW=200,BH=100;
    function layout(){
      var vw=host.clientWidth||innerWidth,vh=host.clientHeight||innerHeight,small=vh<520;
      var topY=Math.max(small?52:96,vh*.16,api.topInset()),bot=small?86:Math.max(118,vh*.2);
      var availH=Math.max(120,vh-topY-bot),availW=vw-24,asp=vw<vh?1.3:(cfg.padAspect||1.9);
      var w=Math.min(availW,availH*asp),h=w/asp;
      pad.style.width=px(w);pad.style.height=px(h);pad.style.left=px((vw-w)/2);pad.style.top=px(topY+(availH-h)/2);
      L.w=w;L.h=h;L.R=Math.min(h*.6,w*.36);L.cx=w/2;L.gy=h*.84;
      shadow.style.cssText="position:absolute;left:"+px(L.cx-L.R*1.25)+";top:"+px(L.gy-L.R*Math.sin(E)*2.1)+";width:"+px(L.R*2.5)+";height:"+px(L.R*Math.sin(E)*2.6+L.R*.12)+";border-radius:50%;background:radial-gradient(closest-side,#2d4766aa,#2d476655 55%,#2d476600);z-index:1";
      pieces.forEach(function(pc){pc.els.concat(pc.ghosts).forEach(placeRec)});
      var ta=ratioOf(api,cfg.tunnel),tw=L.R*1.0,thh=tw/ta,tl=L.cx-tw/2,tt=L.gy+L.R*.1-thh;
      [tun,tunGhost].forEach(function(n){n.style.position="absolute";n.style.left=px(tl);n.style.top=px(tt);n.style.width=px(tw);n.style.height=px(thh)});
      tun.style.zIndex=400;tunGhost.style.zIndex=401;
      glow.style.cssText="position:absolute;left:"+px(L.cx-tw*.55)+";top:"+px(tt-thh*.15)+";width:"+px(tw*1.1)+";height:"+px(thh*1.2)+";border-radius:50%;background:radial-gradient(closest-side,#ffc36acc,#ff9f3a55 50%,#ff9f3a00);z-index:402;opacity:0;pointer-events:none;transition:opacity 1.2s;mix-blend-mode:screen";
    }
    function placeRec(r){
      var bk=r.bk,pt=r.pt,q,z,f,im=r.el;
      if(pt.cap){var t0=th(M-1,PS+PI*1.5,true)-HT*.3,fp=proj(t0,0),bp=proj(t0,PI),ha=L.R*Math.cos(t0)*.98,y0=bp[1]-L.R*.015,y1=fp[1]+L.R*.035;
        q=[[L.cx-ha,y0],[L.cx+ha,y0],[L.cx+ha,y1],[L.cx-ha,y1]];z=260;f=shade(PI/2-.25,-.2,false)}
      else{var tb1=th(bk.c,pt.a,false),tb2=th(bk.c,pt.b,false),tt1=th(bk.c,pt.a,true),tt2=th(bk.c,pt.b,true);
        q=[proj(tt1,pt.a),proj(tt2,pt.b),proj(tb2,pt.b),proj(tb1,pt.a)];q=grow(q,c_grow(bk.c));
        var tm=(tb1+tt2)/2,pm=(pt.a+pt.b)/2;z=pt.front?Math.round(150+100*Math.cos(tm)*Math.cos(pm)):Math.round(20+bk.c*4+30*Math.sin(tm));f=shade(tm,pm,!pt.front)}
      var ar=Math.abs((q[1][0]-q[3][0])*(q[2][1]-q[0][1])-(q[2][0]-q[0][0])*(q[1][1]-q[3][1]))/2;r.tiny=ar<6;if(r.tiny){im.style.visibility="hidden"}else im.style.visibility="";
      im.style.position="absolute";im.style.left="0";im.style.top="0";im.style.width=BW+"px";im.style.height=BH+"px";im.style.transformOrigin="0 0";
      im.style.transform=quadM(BW,BH,q);im.style.zIndex=r.el.className==="igghost"?String(z+500):String(z);
      if(im.className==="igblk") im.style.filter=f;
    }
    layout();
    var onR=function(){layout()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    /* tray: one snow-block card with a count, then the tunnel card */
    var tray=mkTray(api,[{id:"blk",pic:cfg.block,label:cfg.blockLabel||"Snow block",count:G},{id:"tun",pic:cfg.tunnel,label:cfg.tunnelLabel||"Tunnel"}]);
    var placed=0,facts=cfg.factsAt||[],tunDone=false;
    function nextPiece(){for(var k=0;k<pieces.length;k++) if(!pieces[k].done) return pieces[k];return null}
    function refresh(){
      var nx=nextPiece();
      pieces.forEach(function(pc){var on=pc===nx;pc.ghosts.forEach(function(r){r.el.style.display=on?"block":"none"})});
      tunGhost.style.display=(!nx&&!tunDone)?"block":"none";
      var bi=tray.map.blk.el,ti=tray.map.tun.el,left=pieces.filter(function(p){return !p.done}).length;
      bi.style.display=left?"":"none";var c=bi.querySelector(".cnt");if(c) c.textContent=left;
      ti.style.display=(!left&&!tunDone)?"":"none";
      bi.classList.toggle("good",!!left);ti.classList.toggle("good",!left&&!tunDone);
    }
    refresh();
    function puff(pc){
      if(api.reduced()) return;var pr=pad.getBoundingClientRect(),hr=host.getBoundingClientRect(),xs=[],ys=[];
      pc.els.forEach(function(r){var b=r.el.getBoundingClientRect();xs.push(b.left+b.width/2);ys.push(b.top+b.height)});
      for(var k=0;k<Math.min(10,xs.length*3);k++){var d=api.el("i","igpuff"),i=k%xs.length,s=R(5,11);
        d.style.cssText="position:absolute;z-index:700;pointer-events:none;width:"+s+"px;height:"+s+"px;border-radius:50%;background:#fff;filter:blur(1.5px);opacity:.85;left:"+px(xs[i]-hr.left)+";top:"+px(ys[i]-hr.top-6);
        host.appendChild(d);d.animate([{transform:"translate(0,0) scale(.6)",opacity:.9},{transform:"translate("+R(-26,26)+"px,"+R(-24,-6)+"px) scale(1.4)",opacity:0}],{duration:R(600,900),easing:"ease-out"}).onfinish=(function(n){return function(){n.remove()}})(d)}
    }
    function putPiece(){
      var pc=nextPiece();if(!pc) return false;pc.done=true;placed++;api.sfx("thunk");
      pc.els.forEach(function(r,k){r.el.style.display="block";
        if(r.el.animate&&!api.reduced()) r.el.animate([{translate:"0 -22px",opacity:0},{translate:"0 2px",opacity:1,offset:.75},{translate:"0 0",opacity:1}],{duration:340,delay:Math.min(k,8)*45,easing:"ease-out",fill:"backwards"})});
      setTimeout(function(){puff(pc)},260);
      refresh();
      if(!nextPiece()){api.hint(cfg.tunnelHint||"Drag or tap the tunnel to the glowing place");api.say(cfg.tunnelSay||"Now add the tunnel!",{after:"idle"})}
      else if(facts.indexOf(placed)>=0) api.fact();
      return true;
    }
    function putTunnel(){
      if(nextPiece()||tunDone) return false;tunDone=true;api.sfx("thunk");tun.style.display="block";
      if(tun.animate&&!api.reduced()) tun.animate([{translate:"0 -26px",opacity:0},{translate:"0 0",opacity:1}],{duration:420,easing:"ease-out"});
      refresh();setTimeout(alive,450);return true;
    }
    function dropOk(x,y){return api.inside(x,y,api.rectOf(pad),60)}
    api.drag(tray.map.blk.el,{ok:function(){return api.live()&&!!nextPiece()},
      drop:function(x,y){if(!dropOk(x,y)) return false;return putPiece()},tap:function(){putPiece();return false}});
    api.drag(tray.map.tun.el,{ok:function(){return api.live()&&!nextPiece()&&!tunDone},
      drop:function(x,y){if(!dropOk(x,y)) return false;return putTunnel()},tap:function(){putTunnel();return false}});
    api.hint(cfg.hint);
    async function alive(){
      api.hint(null);tray.el.style.display="none";api.sfx("win");pad.classList.add("alive");
      tunLit.style.opacity="1";glow.style.opacity="1";
      if(glow.animate&&!api.reduced()) glow.animate([{opacity:.75},{opacity:1}],{duration:1600,delay:1200,iterations:Infinity,direction:"alternate",easing:"ease-in-out"});
      var A=cfg.alive||{};
      (A.actors||[]).forEach(function(a,i){
        var im=api.el("div","bactor");im.innerHTML=api.picInner(a.pic);var ar=ratioOf(api,a.pic),w=L.w*a.w/100;
        im.style.cssText="position:absolute;z-index:500;width:"+px(w)+";left:"+px(L.w*a.x/100-w/2)+";top:"+px(L.h*a.y/100-w/ar)+";pointer-events:none;filter:drop-shadow(0 6px 6px #0005)";
        var inner=im.querySelector("img,svg");if(inner){inner.style.width="100%";inner.style.height="auto";inner.style.display="block"}
        if(a.flip) im.firstChild.style.transform="scaleX(-1)";
        pad.appendChild(im);
        if(im.animate&&!api.reduced()) im.animate([{translate:(a.from==="left"?-L.w*.5:L.w*.5)+"px 0",opacity:0},{translate:"0 0",opacity:1}],{duration:a.dur||1700,delay:500+i*350,easing:"ease-out",fill:"backwards"});
      });
      if(A.snow&&!api.reduced()) softSnow(api);
      await api.say(A.line||"The igloo is done!",{state:"celebration",after:"idle"});
      if(!api.live()) return;
      await api.sleep(A.hold||1800);
      if(!api.live()) return;
      resolve({built:true});
    }
    /* Skip: the igloo is finished on the spot (it stays in the scene), no celebration */
    api.onSkip(function(){pieces.forEach(function(pc){if(!pc.done){pc.done=true;pc.els.forEach(function(r){r.el.style.display="block"})}});if(!tunDone){tunDone=true;tun.style.display="block"}
      refresh();tray.el.style.display="none";api.hint(null);pad.classList.add("alive");tunLit.style.opacity="1";glow.style.opacity="1"});
    /* test hook */
    api.host._igloo={pieces:pieces,put:putPiece,tunnel:putTunnel};
  });
});
function softSnow(api){
  var box=api.el("div","snowbox");box.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden";document.body.appendChild(box);
  for(var i=0;i<60;i++){var f=api.el("i"),s=R(2,6);f.style.cssText="position:absolute;top:-12px;left:"+R(0,100)+"vw;width:"+s+"px;height:"+s+"px;border-radius:50%;background:#fff;filter:blur("+(s>4?1.2:.4)+"px);opacity:"+R(.55,.95).toFixed(2)+";--dx:"+R(-50,50)+"px;animation:ar2Flake "+R(7,13)+"s linear "+R(0,7)+"s infinite";box.appendChild(f)}
  api.onEnd(function(){box.remove()});
}

/* ============================================================================ FISH (Arctic) */
/* 10/10 (Arctic depth for ages 10-14): a 4-choice card inside the activity. Q={q,o:[...],a,ok,hint,fact,panel(html)} . Resolves {first:boolean, pick:index} */
function quiz4(api,Q){return new Promise(function(done){var host=api.host,top=Math.max(api.topInset()||0,70),card=api.el("div","fq4");
  /* phones: the card repeats the question, so when the space under Spark's caption is too short it goes up over the caption; bottom stays clear of the avatar */
  var narrow=innerWidth<520,botGap=narrow?104:12;
  card.style.cssText="position:absolute;z-index:60;left:50%;transform:translateX(-50%);top:"+px(top)+";width:min(560px,calc(100% - 24px));max-height:calc(100% - "+(top+botGap)+"px);overflow:auto;background:#0f2540f2;border:3px solid #f6c445;border-radius:20px;padding:14px 14px 12px;color:#fff;box-shadow:0 14px 34px #000a;font:600 17px/1.35 system-ui,sans-serif";
  card.innerHTML=(Q.tag?'<div style="font:800 13px system-ui;letter-spacing:.04em;color:#f6c445;margin-bottom:6px">'+api.esc(Q.tag)+'</div>':'')+(Q.panel||"")+'<div class="fq4q" style="margin:8px 0 10px;font-size:18px;font-weight:800">'+api.esc(Q.q)+'</div><div class="fq4o" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>';
  var box=card.querySelector(".fq4o"),first=true,busy=false;host._fq={a:Q.a,card:card};
  Q.o.forEach(function(t,i){var b=api.el("button","ar2-btn fq4b");b.type="button";b.textContent=t;b.style.cssText="min-height:56px;padding:8px 10px;border-radius:14px;font:800 16px/1.2 system-ui,sans-serif;text-align:center;white-space:normal;background:#1d3d63;color:#fff;border:2px solid #7fb3e6;cursor:pointer";
    b.onclick=function(){if(busy||!api.live()) return;if(i===Q.a){busy=true;b.style.background="#1f7a46";b.style.borderColor="#9df0bf";api.sfx("ok");api.burst(api.rectOf(b).cx,api.rectOf(b).cy,10);
        api.say(Q.ok,{state:"celebration",after:"idle"}).then(function(){if(!api.live()) return;card.remove();host._fq=null;if(Q.fact) api.fact(null,Q.fact);done({first:first,pick:i})})}
      else{first=false;b.disabled=true;b.style.opacity=".45";b.style.textDecoration="line-through";api.sfx("no");api.say(Q.hint,{state:"concern",after:"idle"})}};box.appendChild(b)});
  if(innerWidth<420&&Q.o.some(function(t){return t.length>24})) box.style.gridTemplateColumns="1fr";
  if(narrow){card.style.top="auto";card.style.bottom=px(botGap);card.style.maxHeight="calc(100% - 64px - "+botGap+"px)"}
  host.appendChild(card);api.say(Q.say||Q.q,{after:"idle"});
  if(narrow){var fit=function(){if(!card.isConnected) return;var hr=host.getBoundingClientRect(),cr=card.getBoundingClientRect(),ti=api.topInset()||0,qq=card.querySelector(".fq4q");if(qq&&cr.top-hr.top<ti+4){qq.style.display="none";cr=card.getBoundingClientRect()}card.style.maxHeight="calc(100% - "+Math.max(64,Math.round(ti+6))+"px - "+botGap+"px)"};setTimeout(fit,60);setTimeout(fit,400)}
  api.onEnd(function(){card.remove()})})}
function finderPanel(api,rows,unit){var mx=Math.max.apply(null,rows.map(function(r){return r[1]}));
  return '<div style="background:#06131f;border:2px solid #2d6c8f;border-radius:12px;padding:8px 10px;font:700 14px system-ui">'+rows.map(function(r){var w=Math.round(r[1]/mx*100);
    return '<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:52px;color:#9fd3ff">'+api.esc(r[0])+'</span><span style="flex:1;height:16px;background:#0c2638;border-radius:8px;overflow:hidden"><i style="display:block;height:100%;width:'+w+'%;background:linear-gradient(90deg,#2fd27a,#c8ff6a)"></i></span><b style="width:74px;text-align:right">'+r[1]+' '+api.esc(unit)+'</b></div>'}).join("")+'</div>'}
reg("fish",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,need=lvlN(api,cfg.need)||3,caught=0,state="crack",cracks=0,biteAt=0,bitOpen=false,biteWin=lvlN(api,cfg.biteMs)||2200,timer=0;var untimed=api.band()==="k"||cfg.untimed===true;
    var V=viewBox(api),scene=api.el("div","fiscene");scene.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none";host.appendChild(scene);
    var ice=api.el("div","fice");
    var holeW=Math.min(V.w*.46,V.h*.62,520);
    ice.style.cssText="position:absolute;left:50%;top:"+px(Math.max(V.h*.34,150))+";width:"+px(holeW)+";height:"+px(holeW*.5)+";transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 40% 35%,#ffffff,#d5ecfa 60%,#9ccae6);box-shadow:0 12px 24px #0008,inset 0 -8px 20px #6aa6cc;cursor:pointer";
    if(cfg.icePatch&&api.asset(norm(cfg.icePatch).a)){ice.style.background="url("+api.url(norm(cfg.icePatch).a)+") center/100% 100% no-repeat";ice.style.boxShadow="none";ice.style.borderRadius="0";ice.style.height=px(holeW/ratioOf(api,cfg.icePatch));ice.style.filter="drop-shadow(0 10px 14px #0006)"}
    scene.appendChild(ice);
    var crackSvg='<svg viewBox="0 0 100 50" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="#3d7ea6" stroke-width="1.3" stroke-linecap="round"><path class="c1" d="M50 25 L36 12 L28 14 M36 12 L33 4" opacity="0"/><path class="c2" d="M50 25 L66 14 L74 18 M66 14 L70 5" opacity="0"/><path class="c3" d="M50 25 L44 40 L50 46 M44 40 L34 42" opacity="0"/></svg>';
    ice.innerHTML=crackSvg;
    var hole=api.el("div","fhole");hole.style.cssText="position:absolute;inset:-4%;opacity:0;transform:scale(.4);transition:all .5s cubic-bezier(.2,1.4,.4,1);pointer-events:none";hole.innerHTML=api.picInner(cfg.hole);scene.appendChild(hole);
    var hi=hole.querySelector("img,svg");if(hi){hi.style.cssText="width:100%;height:100%;object-fit:contain;display:block"}
    // position hole image where the ice patch is
    function posHole(){var r=ice.getBoundingClientRect(),hr=host.getBoundingClientRect(),w=r.width*1.15,ar=ratioOf(api,cfg.hole),h=w/ar;hole.style.cssText+=";inset:auto;width:"+px(w)+";height:"+px(h)+";left:"+px(r.left-hr.left+r.width/2-w/2)+";top:"+px(r.top-hr.top+r.height/2-h/2)}
    posHole();
    var rod=api.el("div","frod");rod.style.cssText="position:absolute;z-index:4;width:"+px(Math.min(V.w*.3,260))+";left:"+px(Math.max(8,V.w*.06))+";top:"+px(Math.max(110,V.h*.2))+";transform-origin:90% 90%;pointer-events:none;filter:drop-shadow(0 8px 8px #0008)";
    rod.innerHTML=api.picInner(cfg.rod);var ri=rod.querySelector("img,svg");if(ri) ri.style.cssText="width:100%;height:auto;display:block";scene.appendChild(rod);rod.style.display="none";
    var flt=api.el("div","fflt");flt.style.cssText="position:absolute;z-index:5;width:"+px(Math.min(44,V.h*.07))+";pointer-events:none;display:none";flt.innerHTML=api.picInner(cfg.float);var fi=flt.querySelector("img,svg");if(fi) fi.style.cssText="width:100%;height:auto;display:block";scene.appendChild(flt);
    var bucket=api.el("div","fbucket");var bsz=Math.max(70,Math.min(120,V.h*.17));bucket.style.cssText="position:absolute;z-index:5;width:"+px(bsz)+";height:"+px(bsz)+";bottom:"+px(Math.max(14,V.h*.05))+";left:"+px(Math.max(14,V.w*.08));bucket.innerHTML=api.picInner(cfg.bucket)+'<b style="position:absolute;right:-6px;top:-8px;min-width:30px;text-align:center;padding:2px 8px;border-radius:999px;background:#f6c445;color:#1c1404;border:2px solid #fff;font-size:14px">0/'+need+'</b>';
    var bi=bucket.querySelector("img,svg");if(bi) bi.style.cssText="width:100%;height:100%;object-fit:contain";scene.appendChild(bucket);
    var deep=(api.band()==="u"||api.band()==="t")&&cfg.deep?cfg.deep[api.band()]:null,biteMul=1,depthChip=null;host._fishDeep=!!deep;
    if(deep){state="quiz";api.hint(null);(async function(){await quiz4(api,deep.ice);if(!api.live()) return;state="crack";api.hint(cfg.hintCrack)})()}else api.hint(cfg.hintCrack);
    function fltPos(){var r=ice.getBoundingClientRect(),hr=host.getBoundingClientRect();return {x:r.left-hr.left+r.width/2,y:r.top-hr.top+r.height/2}}
    scene.addEventListener("pointerdown",function(e){
      if(!api.live()) return;
      if(state==="crack"){
        var r=api.rectOf(ice);if(!api.inside(e.clientX,e.clientY,r,30)) {api.say("Tap the ice to crack it!",{after:"idle"});return}
        cracks++;api.sfx("thunk");api.burst(e.clientX,e.clientY,6,["\u2744\uFE0F","\u2728"]);
        var p=ice.querySelector(".c"+cracks);if(p) p.setAttribute("opacity","1");
        ice.animate&&ice.animate([{transform:"translateX(-50%) scale(1.05)"},{transform:"translateX(-50%) scale(1)"}],{duration:200});
        if(cracks>=3) openHole();
        return;
      }
      if(state==="fish"){
        var r2=api.rectOf(ice);if(!api.inside(e.clientX,e.clientY,r2,60)&&!api.inside(e.clientX,e.clientY,api.rectOf(flt),40)) return;
        /* a strike just after the float came back up still counts (finger reaction time) */
        if(bitOpen||performance.now()-lastClose<350){catchFish()}
        else{var now=performance.now();if(now-lastEarly>1800){lastEarly=now;api.say(api.pick(cfg.early),{state:untimed?"idle":"concern",after:"idle"})}if(!untimed) api.sfx("no")}
        /* early taps never reset or delay the bite (they used to restart the wait, so tapping often stalled it) */
      }
    });
    function openHole(){
      state="open";api.sfx("splash");hole.style.opacity="1";hole.style.transform="scale(1)";ice.style.background="transparent";ice.style.boxShadow="none";ice.innerHTML="";
      api.burst(api.rectOf(ice).cx,api.rectOf(ice).cy,16,["\u2744\uFE0F","\u2728","\uD83D\uDCA7"]);
      rod.style.display="block";rod.animate&&rod.animate([{transform:"translateX(-80px) rotate(-20deg)",opacity:0},{transform:"none",opacity:1}],{duration:500,easing:"ease-out"});
      var p=fltPos();flt.style.display="block";flt.style.left=px(p.x-flt.offsetWidth/2);flt.style.top=px(p.y-flt.offsetWidth*.9);
      /* fishing starts at once: the hint changes now and the first bite comes on its own clock, not after Spark's line */
      if(deep){state="quiz";api.hint(null);(async function(){var r=await quiz4(api,Object.assign({panel:finderPanel(api,deep.finder.rows,deep.finder.unit)},deep.finder));if(!api.live()) return;
          biteMul=r.first?1:2.2;depthChip=api.el("div","ds-chip");depthChip.style.cssText="position:absolute;z-index:6;padding:6px 12px;border-radius:999px;background:#0f2540e6;border:2px solid #f6c445;color:#fff;font:800 14px system-ui;left:50%;transform:translateX(-50%);top:"+px(api.rectOf(ice).bottom-host.getBoundingClientRect().top+8);
          depthChip.textContent=r.first?deep.finder.chipGood:deep.finder.chipSlow;scene.appendChild(depthChip);
          state="fish";api.hint(cfg.hintFish);armBite(false,true);api.say(r.first?deep.finder.good:deep.finder.slow,{after:"idle"})})();return}
      state="fish";api.hint(cfg.hintFish);api.say(cfg.opened);armBite(false,true);
    }
    function ripple(){var p=fltPos(),r=api.el("i");r.style.cssText="position:absolute;z-index:3;left:"+px(p.x)+";top:"+px(p.y)+";width:90px;height:40px;border-radius:50%;border:3px solid #ffffffcc;animation:ar2Ring 1.3s ease-out forwards;pointer-events:none";scene.appendChild(r);setTimeout(function(){r.remove()},1400)}
    var lastClose=-1e9,lastEarly=-1e9;
    function armBite(soon,first){
      clearTimeout(timer);bitOpen=false;flt.style.transform="";
      timer=setTimeout(function(){
        if(!api.live()||state!=="fish") return;
        ripple();bitOpen=true;flt.style.transition="transform .12s";flt.style.transform="translateY(26px)";api.sfx("pop");api.say(api.pick(cfg.bite),{cap:true,after:"idle"});
        if(untimed) return; /* ages 4-6: the float stays down until the kid taps (no quick reactions) */
        timer=setTimeout(function(){if(!api.live()) return;bitOpen=false;lastClose=performance.now();flt.style.transform="";api.say(api.pick(cfg.missed),{after:"idle"});armBite(false)},biteWin);
      },(first?R(2600,3600):(soon?900:R(1400,3000)))*biteMul);
    }
    ses_cleanup();
    function ses_cleanup(){api.onEnd(function(){clearTimeout(timer)})}
    function catchFish(){
      clearTimeout(timer);bitOpen=false;caught++;state="catch";flt.style.transform="";
      var p=api.rectOf(ice),f=api.el("div","ffish");var fw=Math.max(90,Math.min(180,V.h*.2));
      f.style.cssText="position:absolute;z-index:8;width:"+px(fw)+";left:"+px(p.cx-host.getBoundingClientRect().left-fw/2)+";top:"+px(p.cy-host.getBoundingClientRect().top-fw*.3);
      f.innerHTML=api.picInner(cfg.fish);var fim=f.querySelector("img,svg");if(fim) fim.style.cssText="width:100%;height:auto;display:block;filter:drop-shadow(0 6px 6px #0008)";scene.appendChild(f);
      api.sfx("splash");api.burst(p.cx,p.cy,10,["\uD83D\uDCA7","\u2728"]);
      var br=api.rectOf(bucket),hr=host.getBoundingClientRect();
      var dx=br.cx-hr.left-(p.cx-hr.left),dy=br.cy-hr.top-(p.cy-hr.top);
      if(f.animate){var a=f.animate([{transform:"translate(0,0) rotate(0)"},{transform:"translate("+dx*.5+"px,"+(Math.min(dy,0)-140)+"px) rotate(-200deg)",offset:.5},{transform:"translate("+dx+"px,"+dy+"px) rotate(-360deg) scale(.5)",opacity:.9}],{duration:900,easing:"ease-in-out",fill:"forwards"});a.onfinish=function(){f.remove();land()}}else{f.remove();land()}
      function land(){bucket.querySelector("b").textContent=caught+"/"+need;api.sfx("ok");api.burst(br.cx,br.cy,8);
        (async function(){
          var cl=api.pick(cfg.caught[Math.min(caught-1,cfg.caught.length-1)]);
          if(caught>=need){state="done";api.hint(null);await api.say(cl,{state:"celebration",after:"idle"});if(!api.live()) return;
            if(deep){if(depthChip) depthChip.remove();await quiz4(api,deep.seal);if(!api.live()) return}
            await api.sleep(200);resolve({caught:caught});return}
          /* back to fishing straight away; Spark's line and the fact run alongside */
          if(deep&&biteMul>1){biteMul=1;if(depthChip) depthChip.textContent=deep.finder.chipGood;cl=deep.finder.moved}
          state="fish";api.fact(null,cl);armBite(false);
        })();
      }
    }
  });
});

/* ============================================================================ PAINT (aurora) */
var PENTA=[262,294,330,392,440,523,587,659,784,880];
reg("paint",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,need=lvlN(api,cfg.ribbons)||4,ribbons=0,V=viewBox(api);
    var wrap=api.el("div","pwrap");wrap.style.cssText="position:absolute;inset:0;z-index:2;animation:ar2Sway 3s ease-in-out infinite alternate";host.appendChild(wrap);
    var cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair";wrap.appendChild(cv);
    var ctx=cv.getContext("2d");
    function size(){var w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;if(cv.width!==w||cv.height!==h){var old=null;cv.width=w;cv.height=h}}
    size();var onR=function(){size()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    var cols=cfg.colors,col=0;
    var pal=api.el("div","ppal");pal.style.cssText="position:absolute;z-index:6;left:50%;bottom:max(12px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:10px;padding:8px 12px;border-radius:18px;background:#10243ecc;border:2px solid #f6c445;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - "+(innerWidth<900?150:280)+"px)";
    if(innerWidth<900){pal.style.left="max(8px,env(safe-area-inset-left,0px))";pal.style.transform="none"}
    cols.forEach(function(c,i){var b=api.el("button","pcol");b.type="button";b.setAttribute("aria-label",c.name);b.style.cssText="flex:none;width:52px;height:52px;border-radius:50%;border:4px solid "+(i===0?"#fff":"#ffffff66")+";background:"+c.css+";cursor:pointer;box-shadow:0 0 14px "+c.css;
      b.onclick=function(){col=i;api.sfx("pop");[].forEach.call(pal.children,function(x,j){x.style.borderColor=j===i?"#fff":"#ffffff66"})};pal.appendChild(b)});
    host.appendChild(pal);
    api.hint(cfg.hint);
    var drawing=false,lx=0,ly=0,len=0,lastNote=0,pid=null,hueShift=0;
    var starsDone=false;
    function glow(x0,y0,x1,y1){
      var c=cols[col];
      ctx.globalCompositeOperation="lighter";ctx.lineCap="round";ctx.lineJoin="round";
      [[34,.10],[20,.18],[9,.55],[3,.9]].forEach(function(w){ctx.strokeStyle=c.css;ctx.globalAlpha=w[1];ctx.lineWidth=w[0]*(cv.width>900?1.3:1);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()});
      ctx.globalAlpha=1;
    }
    cv.addEventListener("pointerdown",function(e){
      if(!api.live()) return;e.preventDefault();drawing=true;pid=e.pointerId;try{cv.setPointerCapture(e.pointerId)}catch(_){}
      var r=cv.getBoundingClientRect();lx=e.clientX-r.left;ly=e.clientY-r.top;len=0;
      if(ribbons===0&&!starsDone){}
    });
    cv.addEventListener("pointermove",function(e){
      if(!drawing||e.pointerId!==pid) return;var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      glow(lx,ly,x,y);len+=Math.hypot(x-lx,y-ly);lx=x;ly=y;
      var now=performance.now();if(now-lastNote>150){lastNote=now;var idx=Math.min(PENTA.length-1,Math.floor(x/cv.width*PENTA.length));api.sfx("note",PENTA[idx]*(cols[col].oct||1))}
      if(Math.random()<.2) api.burst(e.clientX,e.clientY,1,["\u2728"]);
    });
    var auto=false;
    /* tap alternative (plan §6/§9): a tap anywhere in the sky paints a whole ribbon through that spot */
    function autoRibbon(tx,ty){
      auto=true;var W=cv.width,H=cv.height,x0=W*.08,x1=W*.92,amp=Math.min(H*.08,60),ph=Math.random()*6,n=40,i=0,px0=x0,py0=ty;
      (function stepR(){if(!api.live()){auto=false;return}
        for(var k=0;k<2&&i<=n;k++,i++){var t=i/n,x=x0+(x1-x0)*t,y=ty+Math.sin(t*Math.PI*2+ph)*amp*(1-Math.abs(t-(tx-x0)/(x1-x0))*.6);if(i>0) glow(px0,py0,x,y);px0=x;py0=y;
          if(i%5===0){var idx=Math.min(PENTA.length-1,Math.floor(x/W*PENTA.length));api.sfx("note",PENTA[idx]*(cols[col].oct||1))}}
        if(i<=n) requestAnimationFrame(stepR);else{auto=false;count()}})();
    }
    function count(){
        ribbons++;api.sfx("ok");
        if(ribbons===1||ribbons===3) api.fact();
        else if(ribbons<need) api.say(api.pick(cfg.praise[Math.min(ribbons-1,cfg.praise.length-1)]),{after:"idle"});
        if(ribbons>=need){ drawing=false;finish() }
    }
    function up(e){
      if(!drawing||e.pointerId!==pid) return;drawing=false;
      if(len<14&&!auto&&ribbons<need){autoRibbon(lx,ly);return}
      if(len>Math.min(cv.width,500)*.55){
        ribbons++;api.sfx("ok");
        if(ribbons===1||ribbons===3) api.fact();
        else if(ribbons<need) api.say(api.pick(cfg.praise[Math.min(ribbons-1,cfg.praise.length-1)]),{after:"idle"});
        if(ribbons>=need){ drawing=false;finish() }
      }
    }
    cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
    async function finish(){
      api.hint(null);pal.style.display="none";cv.style.pointerEvents="none";api.sfx("win");
      // the lights start to dance
      wrap.style.animation="ar2Sway 1.6s ease-in-out infinite alternate";wrap.style.filter="hue-rotate(0deg) saturate(1.3)";
      if(wrap.animate&&!api.reduced()) wrap.animate([{filter:"hue-rotate(0deg) saturate(1.3)"},{filter:"hue-rotate(60deg) saturate(1.5)"},{filter:"hue-rotate(0deg) saturate(1.3)"}],{duration:3600,iterations:Infinity});
      api.burst(innerWidth/2,innerHeight*.35,26);
      await api.say(cfg.done,{state:"celebration",after:"idle"});
      if(!api.live()) return;await api.sleep(1500);
      if(api.live()) resolve({ribbons:ribbons});
    }
  });
});

/* ============================================================================ TRACE (connect the stars, then find the hidden animal) */
reg("trace",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,V=viewBox(api),pts=(api.lvl()==="lo"&&cfg.starsLo)||cfg.stars,next=0,done=false,phase="stars";
    var sky=api.el("div","tsky");sky.style.cssText="position:absolute;inset:0;z-index:2;touch-action:none";host.appendChild(sky);
    var NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg");svg.setAttribute("style","position:absolute;inset:0;width:100%;height:100%;pointer-events:none");sky.appendChild(svg);
    var starEls=[],area;
    function lay(){
      var vw=host.clientWidth||innerWidth,vh=host.clientHeight||innerHeight;
      var topY=Math.max(vh<520?60:124,vh*.2),botY=vh<520?20:vh*.2;topY=Math.max(topY,api.topInset());
      area={x0:(vw<900?16:sparkReserve()*.6),x1:vw-(vw<900?16:sparkReserve()),y0:topY,y1:vh-botY};
      svg.setAttribute("viewBox","0 0 "+vw+" "+vh);
      starEls.forEach(function(s,i){var p=pts[i],x=area.x0+(area.x1-area.x0)*p[0]/100,y=area.y0+(area.y1-area.y0)*p[1]/100;s.x=x;s.y=y;s.el.style.left=px(x-s.sz/2);s.el.style.top=px(y-s.sz/2)});
      redrawLines();
    }
    var lines=[];
    function redrawLines(){svg.innerHTML="";for(var i=0;i<next-1;i++){var a=starEls[i],b=starEls[i+1];var l=document.createElementNS(NS,"line");l.setAttribute("x1",a.x);l.setAttribute("y1",a.y);l.setAttribute("x2",b.x);l.setAttribute("y2",b.y);l.setAttribute("stroke","#fff3b0");l.setAttribute("stroke-width","4");l.setAttribute("stroke-linecap","round");l.setAttribute("style","filter:drop-shadow(0 0 6px #ffe56a)");svg.appendChild(l)}}
    var sz=Math.max(52,Math.min(84,V.h*.12));
    pts.forEach(function(p,i){
      var b=api.el("button","tstar");b.type="button";b.setAttribute("aria-label","Star "+(i+1));
      b.style.cssText="position:absolute;width:"+px(sz)+";height:"+px(sz)+";border:0;padding:0;background:transparent;cursor:pointer;touch-action:none";
      var isP=(i===pts.length-1);
      b.innerHTML='<svg viewBox="0 0 100 100" style="width:100%;height:100%;filter:drop-shadow(0 0 10px #fff6c0)"><path d="M50 4 L61 38 L96 38 L67 59 L78 94 L50 73 L22 94 L33 59 L4 38 L39 38Z" fill="'+(isP?"#ffd84a":"#fffbe0")+'" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>'+(lvl0()==="lo"||true?'<b style="position:absolute;left:50%;top:50%;transform:translate(-50%,-44%);color:#1c1404;font-weight:900;font-size:'+Math.round(sz*.34)+'px">'+(i+1)+'</b>':"");
      sky.appendChild(b);starEls.push({el:b,sz:sz,x:0,y:0});
    });
    function lvl0(){return api.lvl()}
    lay();var onR=function(){lay()};window.addEventListener("resize",onR);api.onEnd(function(){window.removeEventListener("resize",onR)});
    function mark(){starEls.forEach(function(s,i){s.el.style.opacity=i<next?".95":(i===next?"1":".55");s.el.style.animation=i===next?"ar2Pulse2 1s ease-in-out infinite":""})}
    mark();api.hint(cfg.hint);
    function hit(x,y){var s=starEls[next];return s&&Math.hypot(x-s.x,y-s.y)<sz*.8}
    function reach(){
      var s=starEls[next];next++;api.sfx("note",PENTA[Math.min(PENTA.length-1,next+1)]);api.burst(s.x,s.y+(host.getBoundingClientRect().top),5,["\u2728"]);redrawLines();mark();
      if(next===3||next===5) api.fact();
      if(next>=pts.length) polaris();
    }
    var drawing=false;
    sky.addEventListener("pointerdown",function(e){if(phase!=="stars"||!api.live()) return;e.preventDefault();drawing=true;var r=sky.getBoundingClientRect();if(hit(e.clientX-r.left,e.clientY-r.top)) reach()});
    sky.addEventListener("pointermove",function(e){if(!drawing||phase!=="stars") return;var r=sky.getBoundingClientRect();if(hit(e.clientX-r.left,e.clientY-r.top)) reach()});
    sky.addEventListener("pointerup",function(){drawing=false});sky.addEventListener("pointercancel",function(){drawing=false});
    async function polaris(){
      phase="seek";api.hint(null);api.sfx("win");
      var s=starEls[pts.length-1];
      var lab=api.el("div","tlab");lab.textContent=cfg.polarisLabel;lab.style.cssText="position:absolute;z-index:6;left:"+px(s.x)+";top:"+px(s.y+sz*.6)+";transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:#f6c445;color:#1c1404;font-weight:900;white-space:nowrap";sky.appendChild(lab);
      await api.say(cfg.polaris,{state:"celebration",after:"idle"});
      if(!api.live()) return;
      await seek();
    }
    function seek(){
      return new Promise(function(res2){
        var spots=cfg.seek.spots,found=0,needF=lvlN(api,cfg.seek.need)||2,tries=0;
        api.hint(cfg.seek.hint);
        var fw=Math.max(110,Math.min(220,V.h*.28));
        var fx=api.el("button","tfox");fx.type="button";fx.setAttribute("aria-label",cfg.seek.name||"Hidden animal");
        fx.style.cssText="position:absolute;z-index:8;width:"+px(fw)+";border:0;background:transparent;padding:0;cursor:pointer;display:none;touch-action:manipulation";
        fx.innerHTML=api.picInner(cfg.seek.pic);var fim=fx.querySelector("img,svg");if(fim) fim.style.cssText="width:100%;height:auto;display:block;filter:drop-shadow(0 8px 8px #000a)";sky.appendChild(fx);
        var hidden=true,tmr=0,idx=0;
        function show(){
          if(!api.live()) return;var sp=spots[idx%spots.length];idx++;
          var vw=host.clientWidth,vh=host.clientHeight;
          fx.style.left=px(vw*sp[0]/100-fw/2);fx.style.top=px(vh*sp[1]/100-fw*.7);fx.style.display="block";hidden=false;
          fx.animate&&fx.animate([{transform:"translateY(80%)",opacity:0},{transform:"translateY(0)",opacity:1}],{duration:420,easing:"ease-out"});
          api.sfx("pop");
          tmr=setTimeout(function(){hide(false)},lvlN(api,cfg.seek.stayMs)||2600);
        }
        function hide(was){clearTimeout(tmr);fx.style.display="none";hidden=true;if(!was&&api.live()){tries++;setTimeout(show,900)}}
        fx.addEventListener("click",function(){
          if(hidden) return;found++;api.sfx("ok");var r=api.rectOf(fx);api.burst(r.cx,r.cy,12,["\u2764\uFE0F","\u2728"]);hide(true);
          (async function(){
            if(found>=needF){await api.say(cfg.seek.done,{state:"celebration",after:"idle"});if(api.live()) {await api.sleep(600);res2();resolve({stars:true})}return}
            await api.say(api.pick(cfg.seek.found[Math.min(found-1,cfg.seek.found.length-1)]),{state:"celebration",after:"idle"});
            if(api.live()) setTimeout(show,700);
          })();
        });
        setTimeout(show,500);
        api.onEnd(function(){clearTimeout(tmr)});
      });
    }
  });
});

/* ============================================================================ PHOTO (snorkel album) */
reg("photo",function(api,cfg){
  return new Promise(function(resolve){
    ensureCss();
    var host=api.host,V=viewBox(api),need=lvlN(api,cfg.need)||3,got={},count=0,speed=cfg.speedMul?(api.byLvl(cfg.speedMul)||1):1;
    var water=api.el("div","pwater");water.style.cssText="position:absolute;inset:0;z-index:2;overflow:hidden;touch-action:manipulation";host.appendChild(water);
    var flash=api.el("div","pflash");flash.style.cssText="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9";host.appendChild(flash);
    // viewfinder corners
    var vf=api.el("div","pvf");vf.style.cssText="position:absolute;z-index:3;inset:"+px(Math.max(70,V.h*.19))+" "+px(V.w<900?10:sparkReserve()*.8)+" "+px(Math.max(78,V.h*.2))+" 10px;border:3px solid #ffffffaa;border-radius:14px;pointer-events:none;box-shadow:0 0 0 2px #0004";
    vf.innerHTML='<i style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border:2px solid #fff9;border-radius:50%"></i><span style="position:absolute;right:10px;top:8px;color:#ff5d5d;font-weight:900;font-size:13px">\u25CF REC</span>';
    host.appendChild(vf);
    var album=api.el("div","palbum");album.style.cssText="position:absolute;z-index:7;left:50%;bottom:max(10px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:8px;padding:8px 10px;border-radius:16px;background:linear-gradient(#7a5230ee,#5a3a20f2);border:2px solid #d9a45d;max-width:calc(100vw - 280px)";
    if(innerWidth<900){album.style.left="max(8px,env(safe-area-inset-left,0px))";album.style.transform="none";album.style.maxWidth="calc(100vw - 122px)"}
    var slots=[];
    var psz=Math.max(52,Math.min(92,V.h*.12));
    for(var i=0;i<need;i++){var s=api.el("div","pslot");s.style.cssText="width:"+px(psz)+";height:"+px(psz)+";border-radius:10px;background:#ffffff26;border:2px dashed #ffffff77;display:grid;place-items:center;color:#fff9;font-size:22px;overflow:hidden";s.textContent="\uD83D\uDCF7";album.appendChild(s);slots.push(s)}
    host.appendChild(album);api.hint(cfg.hint);
    var fishes=[];
    function swimmer(sw,k){
      var b=api.el("button","pfish");b.type="button";b.setAttribute("aria-label",sw.name);b.dataset.id=sw.id;
      var h=Math.max(70,V.h*sw.size),ar=ratioOf(api,sw.pic),w=h*ar;
      var top=Math.max(V.h*.26,130)+ (V.h*.42)*sw.lane/ (cfg.lanes||3);
      var dur=(sw.dur/speed);
      b.style.cssText="position:absolute;left:0;top:"+px(top)+";width:"+px(w)+";height:"+px(h)+";border:0;background:transparent;padding:0;cursor:pointer;touch-action:manipulation;animation:ar2Swim "+dur+"s linear "+(-k*dur/ (cfg.swimmers.length+.4))+"s infinite";
      b.innerHTML='<span style="display:block;width:100%;height:100%;animation:ar2Sway 1.3s ease-in-out infinite alternate">'+api.picInner(sw.pic)+'</span>';
      var im=b.querySelector("img,svg");if(im) im.style.cssText="width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 8px 8px #0006)";
      b.addEventListener("click",function(e){snap(sw,b,e)});
      water.appendChild(b);fishes.push(b);
    }
    cfg.swimmers.forEach(swimmer);
    function snap(sw,b,e){
      if(!api.live()||count>=need) return;
      if(got[sw.id]){api.sfx("no");api.say(api.pick(cfg.again),{after:"idle"});return}
      got[sw.id]=true;var r=api.rectOf(b);
      api.sfx("shutter");flash.style.animation="none";void flash.offsetWidth;flash.style.animation="ar2Flash .45s ease-out";
      b.style.animationPlayState="paused";b.style.filter="brightness(1.4)";setTimeout(function(){b.style.animationPlayState="running";b.style.filter=""},650);
      var slot=slots[count];count++;
      slot.textContent="";slot.style.border="2px solid #fff";slot.style.background="#fff";slot.innerHTML=api.picInner(sw.pic);var si=slot.querySelector("img,svg");if(si) si.style.cssText="width:92%;height:92%;object-fit:contain";
      slot.animate&&slot.animate([{transform:"scale(0) rotate(-40deg)"},{transform:"scale(1.2) rotate(6deg)"},{transform:"scale(1) rotate(-3deg)"}],{duration:520,easing:"ease-out"});
      slot.style.transform="rotate(-3deg)";api.burst(r.cx,r.cy,10,["\uD83D\uDCF8","\u2728"]);
      (async function(){
        await api.say(api.pick(sw.say),{state:"celebration",after:"idle"});
        if(!api.live()) return;
        if(count>=need){await api.sleep(300);if(api.live()) resolve({photos:count});return}
        api.fact();
      })();
    }
  });
});
})();
