/* Arctic 3D P5: picture quality + two Tester fixes. Runs last; changes how things look / where UI sits, never the play.
   - post-processing on the top tiers: subtle bloom (fire, lamps, lantern, sparkle), gentle colour grade + vignette, SMAA edges.
     Off in the northern-lights view (night sky stays exactly as before) and off on lower tiers (auto quality / ?a3dq=N).
   - camera occlusion: anything (animals, sled team, stall, sled) between the camera and the child fades out while it is in the way.
   - phone: the animal action bubble never sits on the turn arrows; pins / edge chips under it are hidden while it is open. */
import {EffectComposer} from './vendor/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from './vendor/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import {SMAAPass} from './vendor/jsm/postprocessing/SMAAPass.js';
import {OutputPass} from './vendor/jsm/postprocessing/OutputPass.js';
import {FXAAShader} from './vendor/jsm/shaders/FXAAShader.js';
import {setFaded} from './glb.js?v=11';
export function post(K){
  const {THREE,R,cam,log}=K;const V=(x,y,z)=>new THREE.Vector3(x,y,z);const QS=new URLSearchParams(location.search);const OFF=QS.get('a3dpost')==='0';
  let C=null,rp,bloom,grade,smaa,out,W0=0,H0=0;
  const GradeShader={uniforms:{tDiffuse:{value:null},amt:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D tDiffuse;uniform float amt;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 x=c.rgb;float l=dot(x,vec3(.2126,.7152,.0722));'+
      /* cool shadows, warm highlights, a touch more saturation and contrast (linear HDR, before tone mapping) */
      'vec3 g=mix(x*vec3(.96,.99,1.05),x*vec3(1.04,1.0,.95),smoothstep(.05,.9,l));g=mix(vec3(l),g,1.12);g=pow(max(g,0.),vec3(1.04));'+
      'vec2 d=vUv-.5;float v=1.-dot(d,d)*.55;gl_FragColor=vec4(mix(x,g*v,amt),c.a);}'};
  function build(){const sz=R.getDrawingBufferSize(new THREE.Vector2());C=new EffectComposer(R,new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,samples:0}));C.setPixelRatio(1);C.setSize(sz.x,sz.y);
    rp=new RenderPass(K.S,cam);C.addPass(rp);bloom=new UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.32,.45,1.05);C.addPass(bloom);grade=new ShaderPass(GradeShader);C.addPass(grade);out=new OutputPass();C.addPass(out);smaa=new SMAAPass(sz.x,sz.y);C.addPass(smaa);W0=sz.x;H0=sz.y;log('a3dpost',{w:sz.x,h:sz.y})}
  const on=()=>!OFF&&K.Q.level===0&&K.mode!=='aurora'&&!(K.skyU&&K.skyU.night&&K.skyU.night.value>.05);
  /* P5b: lower tiers keep cheap FXAA edges (no bloom / grade / SMAA); never in the northern-lights view */
  let C2=null,rp2,fx,W2=0,H2=0;const NOFX=QS.get('a3dfxaa')==='0';
  const on2=()=>!OFF&&!NOFX&&K.Q.level>=1&&K.Q.level<=4&&K.mode!=='aurora'&&!(K.skyU&&K.skyU.night&&K.skyU.night.value>.05);
  function lite(scene,camera){const sz=R.getDrawingBufferSize(new THREE.Vector2());if(!C2){C2=new EffectComposer(R,new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,samples:0}));C2.setPixelRatio(1);rp2=new RenderPass(scene,camera);C2.addPass(rp2);C2.addPass(new OutputPass());fx=new ShaderPass(FXAAShader);C2.addPass(fx);W2=0}
    if(sz.x!==W2||sz.y!==H2){C2.setSize(sz.x,sz.y);fx.material.uniforms.resolution.value.set(1/sz.x,1/sz.y);W2=sz.x;H2=sz.y}rp2.scene=scene;rp2.camera=camera;C2.render();return true}
  K.probes=Object.assign(K.probes||{},{fxaa:()=>on2()});
  K.post=(scene,camera)=>{if(on2())return lite(scene,camera);if(!on())return false;if(!C)build();const sz=R.getDrawingBufferSize(new THREE.Vector2());if(sz.x!==W0||sz.y!==H0){C.setSize(sz.x,sz.y);W0=sz.x;H0=sz.y}
    rp.scene=scene;rp.camera=camera;bloom.enabled=K.Q.level===0;smaa.enabled=true;C.render();return true};
  K.probes=Object.assign(K.probes||{},{occ:()=>{let bad=0;const fl=[];(K.animals||[]).forEach(a=>fl.push(a.g));(K.places||[]).forEach(p=>{if(p.id!=='fish')fl.push(p.obj)});return {blocking:(K._occ||{}).want||0,faded:[...faded].length}}});
  K.probes=Object.assign(K.probes||{},{post:()=>({on:on(),bloom:!!(bloom&&bloom.enabled)})});
  /* ---- camera occlusion fade */
  const seg=new THREE.Vector3(),tmp=V(),bs=new THREE.Sphere();const faded=new Set();const sph=new Map();
  function sphereOf(o){let s=sph.get(o);if(!s){const b=new THREE.Box3();o.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(o.matrixWorld).invert();o.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh){m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld)))}});s=b.isEmpty()?null:b.getBoundingSphere(new THREE.Sphere());sph.set(o,s)}return s}
  function fadeList(){const L=[];(K.animals||[]).forEach(a=>L.push(a.g));(K.places||[]).forEach(p=>{if(p.id!=='fish')L.push(p.obj)});return L}
  K.updates.push(()=>{const want=new Set();const m=K.mode;
    if((m==='walk'||m==='photo'||m==='fish')&&K.kid){const T=K.kid.getWorldPosition(V()).add(V(0,1,0));const Cp=cam.position;seg.subVectors(T,Cp);const L2=seg.lengthSq();
      for(const o of fadeList()){if(!o.visible)continue;const s=sphereOf(o);if(!s)continue;bs.copy(s).applyMatrix4(o.matrixWorld);const t=tmp.subVectors(bs.center,Cp).dot(seg)/L2;if(t<=0||t>=1)continue;
        const cl=Cp.clone().addScaledVector(seg,t);const d=cl.distanceTo(bs.center);const dT=bs.center.distanceTo(T);if(d<bs.radius*.8&&dT>bs.radius*.5+.4)want.add(o)}}
    K._occ={want:want.size,faded:0};
    faded.forEach(o=>{if(!want.has(o)){setFaded(o,false);faded.delete(o)}});want.forEach(o=>{if(!faded.has(o)){setFaded(o,true);faded.add(o)}});
    /* ---- phone layout: action bubble vs turn arrows / pins */
    const bub=K.wrap.querySelector('.a3d-bub.on');const hid=K.wrap.querySelectorAll('.a3d-hid');
    if(!bub){hid.forEach(e=>e.classList.remove('a3d-hid'));return}
    const wr=K.wrap.getBoundingClientRect();let r=bub.getBoundingClientRect();let dx=0,dy=0;const M=8;
    if(r.left<wr.left+M)dx=wr.left+M-r.left;else if(r.right>wr.right-M)dx=wr.right-M-r.right;
    if(r.top+dy<wr.top+70)dy=wr.top+70-r.top;
    const arrows=[K.turnL,K.turnR].filter(b=>b&&b.offsetParent&&getComputedStyle(b).display!=='none').map(b=>b.getBoundingClientRect());
    const hit=(a,b,ox,oy,p)=>a.left+ox<b.right+p&&a.right+ox>b.left-p&&a.top+oy<b.bottom+p&&a.bottom+oy>b.top-p;
    for(const a of arrows){if(hit(r,a,dx,dy,10)){const up=a.top-10-(r.bottom+dy),down=a.bottom+10-(r.top+dy);dy+=(Math.abs(up)<=Math.abs(down)&&r.top+dy+up>wr.top+60)?up:down}}
    if(dx||dy)bub.style.transform+=' translate('+dx.toFixed(0)+'px,'+dy.toFixed(0)+'px)';const acts=[...bub.querySelectorAll('.a3d-act')].filter(b=>b.style.display!=='none').map(b=>b.getBoundingClientRect());
    K.wrap.querySelectorAll('.a3d-pin,.a3d-edge').forEach(e=>{const q=e.getBoundingClientRect();e.classList.toggle('a3d-hid',q.width>0&&acts.some(a=>hit(a,q,0,0,4)))})});
  /* ---- P5b near-field: ANY animal, sled, stall or camp prop within a few metres of the camera fades out (Tester: seal / dark blob at the bottom-left) */
  let props=[],propsN=0;const NOLAY=QS.get('a3dnolay')==='1';const NEAR=+(QS.get('a3dnear')||5.5);
  function propList(){const L=new Set(fadeList());K.S.children.forEach(o=>{if(o===K.kid||o.isLight||o.isInstancedMesh||!o.visible)return;let inst=false,mesh=false;o.traverse(m=>{if(m.isInstancedMesh)inst=true;if(m.isMesh)mesh=true});if(inst||!mesh)return;const s=sphereOf(o);if(s&&s.radius<4.5&&s.radius>.15)L.add(o)});(K.places||[]).forEach(p=>{if(p.id==='fish')L.delete(p.obj)});return [...L]}
  const nearSet=new Set();
  /* P5c: near = within NEAR m, OR (phone fix) in front of the child by 1.5 m+ and on screen - on a tall phone the camera sits farther back, so the seal at the bottom of the view was 6-7 m away and never faded */
  const pj=V();function isNear(b,Cp,dK){const d=b.center.distanceTo(Cp);if(d-b.radius<NEAR)return true;if(m0()!=='photo'&&d<dK-1.5-b.radius*.3){pj.copy(b.center).project(cam);if(pj.z<1&&Math.abs(pj.x)<1.25&&Math.abs(pj.y)<1.25)return true}return false}const m0=()=>K.mode;
  K.probes=Object.assign(K.probes||{},{near:()=>{const Cp=cam.position;const out=[];for(const o of props){if(!o.visible)continue;const s=sphereOf(o);if(!s)continue;bs.copy(s).applyMatrix4(o.matrixWorld);const dK=K.kid?K.kid.getWorldPosition(V()).distanceTo(Cp):1e9;const d=bs.center.distanceTo(Cp)-bs.radius;if(isNear(bs,Cp,dK))out.push({name:o.name||o.type,d:+d.toFixed(2),faded:nearSet.has(o)})}return {near:out.length,faded:out.filter(x=>x.faded).length,list:out}}});
  K.updates.push(()=>{const m=K.mode;if(propsN++%90===0)props=propList();const want=new Set();
    if(m==='walk'||m==='photo'||m==='fish'){const Cp=cam.position;const dK=K.kid?K.kid.getWorldPosition(V()).distanceTo(Cp):1e9;for(const o of props){if(!o.visible&&!o.userData._nearHid)continue;const s=sphereOf(o);if(!s)continue;bs.copy(s).applyMatrix4(o.matrixWorld);const an=(K.animals||[]).some(a=>a.g===o);/* spark24 (Tester: seal looked soft / vanished up close): animals are only hidden when they clip the lens, not whenever they are on screen or within 5.5 m */if(an?(bs.center.distanceTo(Cp)-bs.radius<1.8&&bs.center.distanceTo(Cp)<dK-.4):isNear(bs,Cp,dK))want.add(o)}}
    /* spark19 (Tester sw-desk-arctic-entry: "large blurry grey paw-print decals + a blurry blue patch at the bottom edge"): those were see-through GHOSTS lying on the snow - the seal (fixed in spark17: hidden outright) and its ice hole, which was still faded to a pale translucent disc + ring whenever the seal was near the camera. The hole is flat on the ground and can never block the view, so it is never faded or hidden now: it stays a crisp, solid blue hole with its snow rim (the seal has simply dived in) */if(K.sealHole)want.delete(K.sealHole);
    /* spark17 (Tester: phone Arctic seal at the bottom-left read as a blurry see-through grey blob): an ANIMAL right by the camera is hidden outright instead of ghosted (comes back as soon as it is clear) */const isAn=o=>(K.animals||[]).some(an=>an.g===o);
    nearSet.forEach(o=>{if(!want.has(o)){nearSet.delete(o);if(o.userData._nearHid){o.userData._nearHid=0;o.visible=true}if(!faded.has(o))setFaded(o,false)}});want.forEach(o=>{if(!nearSet.has(o)){nearSet.add(o);if(isAn(o)){o.userData._nearHid=1;o.visible=false}else setFaded(o,true)}});
    /* line-of-sight fades must not undo near fades */nearSet.forEach(o=>{if(!o.userData._nearHid)setFaded(o,true)});
    if(!NOLAY)layout()});
  /* ---- P5b phone/desktop layout: place pins + paw edge chips keep a guaranteed gap from the turn arrows / buttons, from each other, and stay off every animal / place they could cover */
  const GAP=16,GAP2=12;
  function vis(e){return e.offsetParent&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'}
  function subj(){const out=[];const fov=cam.fov*Math.PI/180;const ch=K.wrap.clientHeight;const wr=K.wrap.getBoundingClientRect();const L=[];if(K.kid&&K.kid.visible)L.push(K.kid);(K.animals||[]).forEach(a=>L.push(a.g));(K.places||[]).forEach(p=>{if(p.id==='fish')return;/* a place is many parts (sled + dog team, stall + trader): check each part, not one giant circle */p.obj.children.forEach(c=>{if(c.visible)L.push(c)})});for(const o of L){if(!o.visible)continue;const s=sphereOf(o);if(!s)continue;bs.copy(s).applyMatrix4(o.matrixWorld);if(o!==K.kid&&!(K.animals||[]).some(an=>an.g===o)){let q=o,fd=false;while(q){if(faded.has(q)||nearSet.has(q)){fd=true;break}q=q.parent}if(fd)continue}/* faded things are see-through: a chip may sit over them */const d=bs.center.distanceTo(cam.position);if(d<bs.radius*1.5)continue;const pz=bs.center.clone().project(cam).z;if(pz>1)continue;
      /* P5c: projected box of the real model (tighter than the old circle, so phone views keep a free spot); kid + animals always count */
      const bb=boxOf(o);let l=1e9,r=-1e9,t=1e9,b=-1e9;for(let c=0;c<8;c++){pj.set(c&1?bb.max.x:bb.min.x,c&2?bb.max.y:bb.min.y,c&4?bb.max.z:bb.min.z);const q=K.scr(pj);if(pj.clone().project(cam).z>1){l=NaN;break}l=Math.min(l,q.x);r=Math.max(r,q.x);t=Math.min(t,q.y);b=Math.max(b,q.y)}
      if(isNaN(l))continue;const ix=.12*(r-l),iy=.06*(b-t);l+=ix;r-=ix;t+=iy;b-=iy;if(r<wr.left||l>wr.right||b<wr.top||t>wr.bottom)continue;if((r-l)>wr.width*.92&&(b-t)>wr.height*.6)continue;/* truly fills the view */out.push({left:l,right:r,top:t,bottom:b,o})}return out}
  const _bx=new THREE.Box3();function boxOf(o){const s=sphereOf(o);const lb=o.userData._lb||(o.userData._lb=(()=>{const b=new THREE.Box3();o.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(o.matrixWorld).invert();o.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh){m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld)))}});return b})());return _bx.copy(lb).applyMatrix4(o.matrixWorld)}
  const ov=(a,b,p)=>a.left<b.right+p&&a.right>b.left-p&&a.top<b.bottom+p&&a.bottom>b.top-p;
  const sh=(r,dx,dy)=>({left:r.left+dx,right:r.right+dx,top:r.top+dy,bottom:r.bottom+dy});
  let lastLay=null;
  function layout(){if(K.mode!=='walk'){lastLay=null;return}const wr=K.wrap.getBoundingClientRect();const items=[...K.wrap.querySelectorAll('.a3d-pin,.a3d-edge')].filter(e=>e.style.display==='block'&&!e.classList.contains('a3d-hid')&&(!e.classList.contains('a3d-pin')||e.classList.contains('pin-on')));if(!items.length){lastLay={items:0};return}
    const hard=[...K.wrap.querySelectorAll('.a3d-turn,.a3d-h,.a3d-b,.a3d-act,.a3d-coins,.a3d-fishchip,.a3d-hub,.a3d-count')].filter(e=>!e.classList.contains('a3d-pin')&&!e.classList.contains('a3d-edge')&&vis(e)).map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
    const soft=subj();const placed=[];const rep=[];
    for(const e of items){const r=e.getBoundingClientRect();let best=null;
      const ok=(q)=>q.left>=wr.left+6&&q.right<=wr.right-6&&q.top>=wr.top+6&&q.bottom<=wr.bottom-6&&!hard.some(h=>ov(q,h,GAP))&&!placed.some(h=>ov(q,h,GAP2))&&!soft.some(h=>ov(q,h,14));
      outer:for(let ring=0;ring<=3;ring++){const st=ring*18,h=st>>1;const cand=ring===0?[[0,0]]:[[0,-st],[0,st],[-st,0],[st,0],[-h,-st],[h,-st],[-st,-h],[st,-h],[-st,h],[st,h],[-h,st],[h,st],[-st,-st],[st,-st],[-st,st],[st,st]];for(const [dx,dy] of cand){if(ok(sh(r,dx,dy))){best=[dx,dy];break outer}}}
      if(!best&&e.classList.contains('a3d-pin')&&!e.classList.contains('edge')){/* pt2: an edge-style marker (the trader's) is not at its place anyway - it may slide to a free spot instead of vanishing */e.classList.remove('pin-on');e._crowd=performance.now();continue}/* P6D: pins stay on their place - hide instead of wandering */if(!best){/* no fully free spot: relax animals but never the arrows/buttons */for(let ring=0;ring<=22&&!best;ring++){const st=ring*18;for(const [dx,dy] of (ring===0?[[0,0]]:[[0,-st],[0,st],[-st,0],[st,0],[-st,-st],[st,-st],[-st,st],[st,st]])){const q=sh(r,dx,dy);if(q.left>=wr.left+6&&q.right<=wr.right-6&&q.top>=wr.top+6&&q.bottom<=wr.bottom-6&&!hard.some(h=>ov(q,h,GAP))&&!placed.some(h=>ov(q,h,GAP2))){best=[dx,dy];break}}}}
      if(!best)best=[0,0];if(best[0]||best[1])e.style.transform+=' translate('+best[0]+'px,'+best[1]+'px)';placed.push(sh(r,best[0],best[1]));rep.push({cls:e.className,id:e.dataset.place||e.dataset.kind,dx:best[0],dy:best[1]})}
    lastLay={items:items.length,rep}}
  K.probes=Object.assign(K.probes||{},{whatAt:(x,y)=>{const r=K.cv.getBoundingClientRect();const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1),cam);return rc.intersectObjects(K.S.children,true).slice(0,4).map(h=>{let o=h.object;while(o.parent&&o.parent!==K.S)o=o.parent;const an=(K.animals||[]).find(a=>a.g===o);return {top:o.name||o.type,an:an&&an.id,mesh:h.object.name||h.object.type,d:+h.distance.toFixed(2),inst:!!h.object.isInstancedMesh,pos:o.position.toArray().map(v=>+v.toFixed(1)),near:nearSet.has(o),col:h.object.material&&h.object.material.color&&h.object.material.color.getHexString()}})},lastLay:()=>lastLay,lay:()=>{const wr=K.wrap.getBoundingClientRect();const items=[...K.wrap.querySelectorAll('.a3d-pin,.a3d-edge')].filter(e=>e.style.display==='block'&&!e.classList.contains('a3d-hid')&&(!e.classList.contains('a3d-pin')||e.classList.contains('pin-on'))).map(e=>({id:e.dataset.place||e.dataset.kind,r:e.getBoundingClientRect()}));
    const hard=[...K.wrap.querySelectorAll('.a3d-turn,.a3d-h,.a3d-b,.a3d-act,.a3d-coins,.a3d-fishchip,.a3d-hub,.a3d-count')].filter(e=>!e.classList.contains('a3d-pin')&&!e.classList.contains('a3d-edge')&&vis(e)).map(e=>({c:e.className,r:e.getBoundingClientRect()}));const soft=subj();const bad=[];
    const gap=(a,b)=>Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom);
    items.forEach((it,i)=>{hard.forEach(h=>{const g=gap(it.r,h.r);if(g<GAP-1)bad.push({it:it.id,vs:h.c,gap:Math.round(g)})});items.forEach((j,k)=>{if(k>i){const g=gap(it.r,j.r);if(g<GAP2-1)bad.push({it:it.id,vs:j.id,gap:Math.round(g)})}});soft.forEach(s=>{const ox=Math.min(it.r.right,s.right)-Math.max(it.r.left,s.left),oy=Math.min(it.r.bottom,s.bottom)-Math.max(it.r.top,s.top);if(ov(it.r,s,0)&&ox>12&&oy>12){const an=(K.animals||[]).find(a=>a.g===s.o),pl=(K.places||[]).find(p=>p.obj===s.o||p.obj===s.o.parent);bad.push({it:it.id,vs:'subject',name:an?an.id:pl?'place:'+pl.id:'prop',sz:Math.round(s.right-s.left),ovl:Math.round(Math.min(it.r.right,s.right)-Math.max(it.r.left,s.left))+'x'+Math.round(Math.min(it.r.bottom,s.bottom)-Math.max(it.r.top,s.top))})}})});
    return {n:items.length,minSize:Math.min(...items.map(i=>Math.min(i.r.width,i.r.height)),999),bad,items:items.map(i=>({id:i.id,x:Math.round(i.r.left),y:Math.round(i.r.top),w:Math.round(i.r.width)}))}}});
  const st=document.createElement('style');st.textContent='.a3d .a3d-hid{visibility:hidden!important;pointer-events:none!important}@media (max-width:520px){.a3d .a3d-edge{width:76px;height:76px}.a3d .a3d-pin.edge{width:72px;height:72px}.a3d-bub{gap:10px}.a3d-act{width:78px;height:78px;padding:14px}}';document.head.appendChild(st);K.disposers=(K.disposers||[]).concat([()=>st.remove()]);
}
