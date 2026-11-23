/* Northern lights: the child paints glowing ribbons on the night sky (ported from the classic Arctic "paint" game: glow strokes,
   pentatonic notes, a tap paints a whole ribbon), then the painting becomes a shimmering aurora in the 3D sky over the camp + igloo.
   Saved in sparkArctic3dV1 as a small image (me.aurora) + me.night. Zero reading. */
export function aurora(K){
  const {THREE,S,cam,say,log,me,save,el,btn,tap,ui}=K;
  const PENTA=[262,294,330,392,440,523,587,659,784,880];
  const COLS=[['green','#5dff9e'],['teal','#4de8ff'],['pink','#ff6ad5'],['violet','#a77bff'],['gold','#ffd65a']];
  const need=(K.opt.age||4)<=6?3:4;
  /* night look */
  let hemi=null;S.traverse(o=>{if(o.isHemisphereLight)hemi=o});const dayFog=S.fog.color.clone(),nightFog=new THREE.Color('#0d1a33');
  let night=me.night?1:0,nightT=night;
  function applyNight(){K.skyU.night.value=night;S.fog.color.copy(dayFog).lerp(nightFog,night);if(hemi)hemi.intensity=1.1-night*.75;if(K.sun)K.sun.intensity=2.2-night*1.85;if(band)band.material.uniforms.night.value=night;if(K._dn)K._dn.innerHTML=nightT>.5?K._icoSun:K._icoMoon}
  /* the aurora band in the sky */
  let band=null;
  function makeBand(tex,geo){if(band){S.remove(band);band.geometry.dispose();band.material.uniforms.map.value.dispose()}
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{map:{value:tex},time:{value:0},night:{value:night}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform sampler2D map;uniform float time,night;varying vec2 vUv;void main(){vec2 uv=vec2(1.-vUv.x+sin(vUv.y*5.+time*.7)*.012,vUv.y+sin(vUv.x*9.+time*.5)*.015);vec3 c=texture2D(map,uv).rgb*.55;for(int k=1;k<14;k++){float f=float(k);c+=texture2D(map,uv+vec2(0.,f*.016)).rgb*(.24-f*.016);}c+=texture2D(map,uv-vec2(0.,.02)).rgb*.25;float sh=.72+.28*sin(vUv.x*70.+time*1.6+sin(vUv.y*3.)*2.);float cur=.85+.15*sin(vUv.x*260.);c*=sh*cur*1.5;gl_FragColor=vec4(c*night,1.);}'});
    band=new THREE.Mesh(geo,m);band.renderOrder=-1;band.frustumCulled=false;S.add(band)}
  function bandGeo(g){return new THREE.CylinderGeometry(g.r,g.r,g.h,48,1,true,g.t0,g.tl).translate(0,g.y,0)}
  if(me.aurora&&me.aurora.img&&me.aurora.geo){const im=new Image();im.onload=()=>{const t=new THREE.Texture(im);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;makeBand(t,bandGeo(me.aurora.geo))};im.src=me.aurora.img}
  applyNight();
  /* paint overlay */
  const ov=el('div','a3d-aur');ui.appendChild(ov);const cv=el('canvas','a3d-aurcv');ov.appendChild(cv);const ctx=cv.getContext('2d');
  const pal=el('div','a3d-aurpal');ov.appendChild(pal);let col=0;
  COLS.forEach(([n,c],i)=>{const b=btn('a3d-aurcol'+(i?'':' on'),n,'');b.style.background=c;b.dataset.c=n;pal.appendChild(b);tap(b,()=>{col=i;[...pal.children].forEach(x=>x.classList.toggle('on',x===b));K.chime(PENTA[i*2],.15)})});
  const dots=el('div','a3d-aurdots');ov.appendChild(dots);
  let ribbons=0,drawing=false,lx=0,ly=0,len=0,lastNote=0,pid=null,busy=false;
  function sizeCv(){const r=ov.getBoundingClientRect();cv.width=Math.max(2,r.width|0);cv.height=Math.max(2,r.height|0)}
  function glow(x0,y0,x1,y1){const c=COLS[col][1];ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';[[38,.08],[22,.16],[10,.5],[3,.9]].forEach(w=>{ctx.strokeStyle=c;ctx.globalAlpha=w[1];ctx.lineWidth=w[0]*(cv.width>900?1.3:1);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()});ctx.globalAlpha=1}
  function note(x){const i=Math.min(PENTA.length-1,Math.floor(x/cv.width*PENTA.length));K.chime(PENTA[i],.35)}
  function renderDots(){dots.innerHTML='';for(let i=0;i<need;i++){const d=el('i',i<ribbons?'on':'');dots.appendChild(d)}}
  function count(){ribbons++;renderDots();K.chime(1046,.4);log('a3dribbon',{n:ribbons});if(ribbons===1)say('aur_more');if(ribbons>=need)finish()}
  function autoRibbon(tx,ty){busy=true;const Wd=cv.width,x0=Wd*.06,x1=Wd*.94,amp=Math.min(cv.height*.07,55),phs=Math.random()*6,n=40;let i=0,px=x0,py=ty;
    (function st(){for(let k=0;k<2&&i<=n;k++,i++){const t=i/n,x=x0+(x1-x0)*t,y=ty+Math.sin(t*Math.PI*2+phs)*amp;if(i>0)glow(px,py,x,y);px=x;py=y;if(i%5===0)note(x)}if(i<=n)requestAnimationFrame(st);else{busy=false;count()}})()}
  cv.addEventListener('pointerdown',e=>{if(busy||ribbons>=need) return;e.preventDefault();e.stopPropagation();drawing=true;pid=e.pointerId;try{cv.setPointerCapture(pid)}catch(_){}const r=cv.getBoundingClientRect();lx=e.clientX-r.left;ly=e.clientY-r.top;len=0});
  cv.addEventListener('pointermove',e=>{if(!drawing||e.pointerId!==pid) return;const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;glow(lx,ly,x,y);len+=Math.hypot(x-lx,y-ly);lx=x;ly=y;const now=performance.now();if(now-lastNote>150){lastNote=now;note(x)}});
  function up(e){if(!drawing||e.pointerId!==pid) return;drawing=false;if(len<14){autoRibbon(lx,ly);return}if(len>Math.min(cv.width,500)*.45)count();else log('a3dribbonshort',{len:Math.round(len)})}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  /* night camera: from behind the camp, looking up over the igloo */
  const ac={p:new THREE.Vector3(0,3.2,25),t:new THREE.Vector3(0,13,-20)};let pull=null;
  function finish(){busy=true;say('aur_done');
    /* map the painted screen onto a sky band that covers exactly what the camera saw */
    const W=cv.width,H=cv.height,r=85;const dir=(sx,sy)=>{const v=new THREE.Vector3(sx/W*2-1,-(sy/H)*2+1,.5).unproject(cam).sub(cam.position).normalize();return v};
    const dl=dir(0,H*.5),dr=dir(W,H*.5),dt=dir(W*.5,0),db=dir(W*.5,H*.82);
    const az=v=>Math.atan2(v.x,v.z);let a0=az(dr),a1=az(dl);if(a1<a0)a1+=Math.PI*2;
    const yAt=v=>cam.position.y+v.y/Math.hypot(v.x,v.z)*r;const yTop=yAt(dt),yBot=yAt(db);
    const geo={r,h:yTop-yBot,y:(yTop+yBot)/2,t0:a0,tl:a1-a0};
    const off=document.createElement('canvas');off.width=1024;off.height=512;const o2=off.getContext('2d');o2.fillStyle='#000';o2.fillRect(0,0,1024,512);o2.drawImage(cv,0,0,W,H*.82,0,0,1024,512);
    const tex=new THREE.CanvasTexture(off);tex.colorSpace=THREE.SRGBColorSpace;makeBand(tex,bandGeo(geo));
    let img='';try{img=off.toDataURL('image/jpeg',.82)}catch(e){}me.aurora={img,geo,at:Date.now()};me.night=true;save();log('a3dauroradone',{ribbons,geo:{h:+geo.h.toFixed(1),tl:+geo.tl.toFixed(2)}});
    ov.classList.add('fade');setTimeout(()=>{ov.classList.remove('on','fade');ctx.clearRect(0,0,W,H)},1200);
    pull={t0:performance.now(),p0:ac.p.clone(),p1:new THREE.Vector3(0,5,34),t1:new THREE.Vector3(0,8,-10)};
    setTimeout(()=>{say('f_aurora');},2600);setTimeout(()=>{busy=false;pull=null;if(K.mode==='aurora'){K.lookUp=true;K.setMode('walk')}},6500)}
  K.modes.aurora={
    enter(){night=1;nightT=1;applyNight();ribbons=0;busy=false;pull=null;renderDots();ov.classList.add('on');requestAnimationFrame(()=>{sizeCv();ctx.clearRect(0,0,cv.width,cv.height)});say('aur_start');log('a3daurora',{start:true})},
    exit(){ov.classList.remove('on')},
    cam(c){c.fov=58;if(pull){const a=Math.min(1,(performance.now()-pull.t0)/3500),e=a*a*(3-2*a);c.position.lerpVectors(pull.p0,pull.p1,e);c.lookAt(ac.t.clone().lerp(pull.t1,e))}else{c.position.copy(ac.p);c.lookAt(ac.t)}},
    back(){K.setMode('walk')}};
  /* hub buttons: aurora (paint the lights), day/night */
  const ICO_A='<svg viewBox="0 0 48 48"><path d="M4 30c8-14 14 2 22-10s14-6 18-12" fill="none" stroke="#5dff9e" stroke-width="6" stroke-linecap="round"/><path d="M4 38c8-10 16 0 24-8s12-4 16-8" fill="none" stroke="#ff6ad5" stroke-width="4" stroke-linecap="round" opacity=".9"/><circle cx="38" cy="10" r="2" fill="#fff"/><circle cx="12" cy="8" r="1.6" fill="#fff"/></svg>';
  const ICO_SUN='<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="9" fill="#ffd65a"/><g stroke="#ffd65a" stroke-width="4" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></g></svg>';
  const ICO_MOON='<svg viewBox="0 0 48 48"><circle cx="22" cy="25" r="15" fill="#f4f1c8"/><circle cx="31" cy="18" r="13" fill="#2e86c1"/><circle cx="40" cy="34" r="2" fill="#fff"/></svg>';
  K.hubAdd&&K.hubAdd('aurora','Northern lights',ICO_A,()=>K.setMode('aurora'));
  K._icoSun=ICO_SUN;K._icoMoon=ICO_MOON;const dn=K._dn=K.hubAdd&&K.hubAdd('day','Day or night',night?ICO_SUN:ICO_MOON,()=>{nightT=nightT>.5?0:1;me.night=nightT>.5;save();dn.innerHTML=nightT>.5?ICO_SUN:ICO_MOON;log('a3dnight',{on:me.night})});
  K.updates.push((dt,now)=>{if(Math.abs(night-nightT)>.001){night+=(nightT-night)*Math.min(1,dt*.004);if(Math.abs(night-nightT)<.01)night=nightT;applyNight();if(dn)dn.innerHTML=nightT>.5?ICO_SUN:ICO_MOON}
    if(band)band.material.uniforms.time.value=now/1000;if(K.mode==='aurora'&&pull)K.placeCam()});
  K.probes=Object.assign(K.probes||{},{aurora:()=>{let vis=false,cx=0,cy=0;if(band){const g=me.aurora.geo,mid=g.t0+g.tl/2;const v=new THREE.Vector3(Math.sin(mid)*g.r,g.y,Math.cos(mid)*g.r);const s=K.scr(v);vis=s.vis;cx=s.x;cy=s.y}
    return {band:!!band,night:+night.toFixed(2),ribbons,need,saved:!!(me.aurora&&me.aurora.img),vis,x:cx,y:cy}},skyRect:()=>{const r=cv.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}}});
}
