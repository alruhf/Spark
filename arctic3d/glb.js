/* Arctic 3D P5 (Allen 10/20 "improve graphic quality"): real rigged glTF models replace the primitive kid, huskies, fox and trader.
   The play is untouched: every model keeps its old group, pivots, tap areas and positions. The old primitive meshes stay as invisible
   pick proxies (raycasts still hit them, so taps work exactly as before); the glTF is fitted into the same box and driven by an
   AnimationMixer (idle / walk / run / eat / sit picked from how the old rig moves). Assets are local + meshopt-compressed (models/).
   ?a3dglb=0 turns the swap off (old look). Licenses: models/LICENSE.txt */
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/jsm/libs/meshopt_decoder.module.js';
import * as SU from './vendor/jsm/utils/SkeletonUtils.js';
const LD=new GLTFLoader();LD.setMeshoptDecoder(MeshoptDecoder);const CACHE={};
export function loadGlb(base,n){return CACHE[n]||(CACHE[n]=LD.loadAsync(base+'models/'+n+'.glb?v=7'))}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
/* clips: drop drifting root motion (x/z) so the game keeps moving the group */
function clean(clip){clip=clip.clone();clip.tracks.forEach(t=>{if(!t.name.endsWith('.position'))return;const v=t.values;let drift=0;for(let i=3;i<v.length;i+=3)drift=Math.max(drift,Math.abs(v[i]-v[0]),Math.abs(v[i+2]-v[2]));if(drift>1e-3){for(let i=0;i<v.length;i+=3){v[i]=v[0];v[i+2]=v[2]}}});return clip}
/* a still "stand" pose from the walk cycle: the frame where the feet are closest together, plus slow breathing on the spine */
function standClip(model,walk){const mx=new THREE.AnimationMixer(model);const a=mx.clipAction(walk).play();let best=0,bd=1e9;const lf=model.getObjectByName('LeftFoot'),rf=model.getObjectByName('RightFoot');if(!lf||!rf) return null;const p=V(),q=V();
  for(let i=0;i<24;i++){const t=walk.duration*i/24;mx.setTime(t);model.updateMatrixWorld(true);lf.getWorldPosition(p);rf.getWorldPosition(q);const d=Math.abs(p.z-q.z)+Math.abs(p.x-q.x)*.2;if(d<bd){bd=d;best=t}}
  mx.stopAllAction();mx.uncacheRoot(model);
  const tracks=walk.tracks.map(tr=>{const n=tr.getValueSize();const it=tr.createInterpolant();const v=Array.from(it.evaluate(best));return new tr.constructor(tr.name,[0,2],v.concat(v))});
  const sp=model.getObjectByName('Spine01')||model.getObjectByName('Spine');if(sp){const q0=sp.quaternion.clone();}
  return new THREE.AnimationClip('Stand',2,tracks)}
const FADE=new Map();function fadedOf(m){if(Array.isArray(m)) return m.map(fadedOf);let f=FADE.get(m.uuid);if(!f){f=m.clone();f.transparent=true;f.opacity=.22;f.depthWrite=false;FADE.set(m.uuid,f)}return f}
export function setFaded(root,on){root.traverse(o=>{if(!o.isMesh||!o.visible)return;if(on){if(!o.userData.m0){o.userData.m0=o.material;o.material=fadedOf(o.material)}}else if(o.userData.m0){o.material=o.userData.m0;o.userData.m0=null}})}
/* fur-ish shading for the low-poly animals: fine world-space grain + a soft rim of light (no UVs needed) */
function furify(m,col){m=m.clone();if(col)m.color.set(col);m.roughness=.9;m.metalness=0;
  m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFW;').replace('#include <project_vertex>','#include <project_vertex>\nvFW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFW;float fh(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}')
      .replace('#include <map_fragment>','#include <map_fragment>\n{float g=fh(vFW*vec3(90.,26.,90.))*.6+fh(vFW*vec3(37.,11.,37.))*.4;diffuseColor.rgb*=.82+.3*g;}')
      .replace('#include <opaque_fragment>','{float rim=pow(1.-saturate(dot(normalize(normal),normalize(vViewPosition))),2.4);outgoingLight+=mix(diffuseColor.rgb,vec3(1.),.45)*rim*.35;}\n#include <opaque_fragment>')};
  m.customProgramCacheKey=()=>'glbfur';return m}
export function glb(K){
  const OFF=new URLSearchParams(location.search).get('a3dglb')==='0';const LIVE=[];K.glbLive=LIVE;
  const SPEC={kid:{fit:'h',walk:'walk',run:'run',ts:1.1,lo:'kid_lo'},trader:{fit:'h',walk:'walk',run:'run',lo:'trader_lo'},
    husky:{fit:'z',idle:'Idle',walk:'Walk',run:'Gallop',eat:'Eating',fur:1},fox:{fit:'z',idle:'Idle',walk:'Walk',run:'Gallop',fur:1}};
  const ONLY=(new URLSearchParams(location.search).get('a3dglbonly')||'').split(',').filter(Boolean);
  K.glbSwap=(root,name,o)=>{if(OFF||!SPEC[name]||(ONLY.length&&!ONLY.includes(name)))return root;const rec={root,name,o:o||{},ready:false,spd:0,lp:null,st:''};LIVE.push(rec);
    rec.lo=SPEC[name].lo&&K.Q.level>=2;rec.p=loadGlb(K.BASE,rec.lo?SPEC[name].lo:name).then(gl=>{try{attach(rec,gl)}catch(e){console.error(e);K.log('a3dglberr',{name,e:String(e)})}}).catch(e=>{rec.failed=true;K.log('a3dglberr',{name,e:String(e)})});return root};
  /* P5b: the camp stays under a snowy cover until every model has loaded (or failed -> the old shapes stay as the fallback) */
  K.glbReady=()=>Promise.all(LIVE.map(r=>r.p));
  function attach(rec,gl){const {root,name,o}=rec,sp=SPEC[name];
    root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();const bb=rec.bb||new THREE.Box3(),tmp=new THREE.Box3();
    if(rec.model){try{rec.model.userData.kidLookUnbind&&rec.model.userData.kidLookUnbind()}catch(e){}root.remove(rec.model);rec.mx&&rec.mx.stopAllAction();rec.st=''}
    if(!rec.bb)root.traverse(m=>{if(m.isMesh&&!m.userData.glb&&m.visible){m.geometry.computeBoundingBox();tmp.copy(m.geometry.boundingBox).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld));bb.union(tmp)}});
    const model=SU.clone(gl.scene);model.updateMatrixWorld(true);const mb=new THREE.Box3().setFromObject(model,true);
    rec.bb=bb;    const os=bb.getSize(V()),ns=mb.getSize(V());const s=sp.fit==='h'?os.y/ns.y:os.z/ns.z;model.scale.multiplyScalar(s);
    const nc=mb.getCenter(V()).multiplyScalar(s),oc=bb.getCenter(V());model.position.set(oc.x-nc.x,bb.min.y-mb.min.y*s,oc.z-nc.z);
    const ud={};['animal','place'].forEach(k=>{if(root.userData[k]!=null)ud[k]=root.userData[k]});
    root.traverse(m=>{if(m.isMesh)m.visible=false});
    model.traverse(m=>{Object.assign(m.userData,ud,{glb:true});if(m.isMesh){m.castShadow=true;m.receiveShadow=true;
      if(sp.fur){const nm=(m.material.name||'');const c=m.material.color;const lum=c.r+c.g+c.b;let col=null;if(name==='husky'&&o.c&&(nm==='Material.001'))col=o.c;if(name==='husky'&&o.belly&&nm==='Material.003')col=o.belly;const plain=m.material.clone();if(col)plain.color.set(col);m.userData.plain=plain;m.userData.fur=lum<.15?plain:furify(m.material,col);m.material=K.Q.level>=3?plain:m.userData.fur}
      else{m.material=m.material.clone();m.material.envMapIntensity=.7}}});
    root.add(model);rec.model=model;
    if(name==='kid'&&window.SparkKidLook)window.SparkKidLook.bind(THREE,model,{pid:(K.opt&&K.opt.pid)||(window.SparkWardrobe&&SparkWardrobe.activePid()),log:K.log,slot:'arctic'+LIVE.indexOf(rec)});
    const mx=new THREE.AnimationMixer(model);rec.mx=mx;const A={};const clip=n=>n&&gl.animations.find(c=>c.name===n);
    ['idle','walk','run','eat'].forEach(k=>{const c=clip(sp[k]);if(c)A[k]=mx.clipAction(clean(c))});
    if(!A.idle&&A.walk){const st=standClip(model,clean(clip(sp.walk)));if(st)A.idle=mx.clipAction(st)}
    rec.A=A;rec.bones={lu:model.getObjectByName('LeftUpLeg'),ru:model.getObjectByName('RightUpLeg'),ll:model.getObjectByName('LeftLeg'),rl:model.getObjectByName('RightLeg')};
    rec.ready=true;go(rec,'idle',0);rec.mx.update(Math.random()*2);
    model.updateMatrixWorld(true);model.traverse(m=>{if(m.isSkinnedMesh){m.computeBoundingSphere();m.boundingSphere.radius*=1.6}});const ws=new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());rec.rad=ws.radius/Math.max(1e-6,root.getWorldScale(V()).x);
    /* P5 perf: the trader only stands - freeze him into a plain (non-skinned) mesh once, so no per-frame skinning cost */
    if(name==='trader'){model.updateMatrixWorld(true);const sks=[];model.traverse(m=>{if(m.isSkinnedMesh)sks.push(m)});sks.forEach(m=>{const g=m.geometry,P=g.attributes.position,N=g.attributes.normal,n=P.count;const pa=new Float32Array(n*3),na=new Float32Array(n*3);const v=V(),w=V();
      for(let i=0;i<n;i++){v.fromBufferAttribute(P,i);m.applyBoneTransform(i,v);pa.set([v.x,v.y,v.z],i*3);if(N){w.fromBufferAttribute(N,i);const b=V().fromBufferAttribute(P,i).add(w.multiplyScalar(.01));m.applyBoneTransform(i,b);b.sub(v).normalize();na.set([b.x,b.y,b.z],i*3)}}
      const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.BufferAttribute(pa,3));if(N)ng.setAttribute('normal',new THREE.BufferAttribute(na,3));['uv','uv1','color'].forEach(k=>{if(g.attributes[k])ng.setAttribute(k,g.attributes[k])});if(g.index)ng.setIndex(g.index);
      const sm=new THREE.Mesh(ng,m.material);sm.castShadow=sm.receiveShadow=true;Object.assign(sm.userData,m.userData);
      /* bake bind-space -> model space: positions from applyBoneTransform are in the mesh's bind space; put the mesh at the skin's bind matrix */
      sm.matrixAutoUpdate=false;sm.matrix.copy(m.matrixWorld).premultiply(new THREE.Matrix4().copy(model.matrixWorld).invert());m.parent.remove(m);model.add(sm)});rec.mx.stopAllAction();rec.static=true}K.log('a3dglb',{name,s:+s.toFixed(4)})}
  function go(rec,st,fade){if(rec.st===st)return;const A=rec.A,nx=A[st]||A.idle;const cur=A[rec.st];rec.st=st;if(st==='sit'){rec.mx.stopAllAction();return}
    if(!nx) return;nx.reset().setEffectiveWeight(1).play();if(cur&&cur!==nx&&fade)cur.crossFadeTo(nx,fade,false);else if(cur&&cur!==nx)cur.stop()}
  function topOf(o){while(o.parent)o=o.parent;return o}
  const wp=V(),FR=new THREE.Frustum(),PM=new THREE.Matrix4(),SP=new THREE.Sphere();
  K.updates.push((dtm)=>{const dt=Math.min(dtm,80)/1000;if(!dt)return;const scn=(K.modes[K.mode]&&K.modes[K.mode].scene&&K.modes[K.mode].scene())||(K.mode==='room'?K.SI:K.S);
    if(!K.coverUp&&K.mode!=='aurora'){K.vis0=(K.vis0||0)+1;for(const r of LIVE)if(!r.ready&&!r.failed&&topOf(r.root)===scn&&r.root.visible){K.primFrames=(K.primFrames||0)+1;(K.primWho=K.primWho||{})[r.name]=1}}
    for(const r of LIVE){if(!r.ready||r.static)continue;if(topOf(r.root)!==scn||!r.root.visible){r.lp=null;r.vx=r.vz=0;continue}
      r.root.getWorldPosition(wp);if(r.lp){const vx=wp.x-r.lp.x,vz=wp.z-r.lp.z;r.vx=(r.vx||0)*.7+vx/dt*.3;r.vz=(r.vz||0)*.7+vz/dt*.3}const d=r.lp?wp.distanceTo(r.lp):0;r.lp=(r.lp||V()).copy(wp);r.spd=r.spd*.75+(d/dt)*.25;
      const u=r.root.userData;let sw=0;(u.legs||[]).forEach(l=>sw=Math.max(sw,Math.abs(l.rotation.x)));
      const sit=u.legs&&u.legs[0]&&u.legs[0].rotation.x<-1;const eat=r.A.eat&&u.head&&u.head.rotation.x>.3;
      const sc=r.root.getWorldScale(V()).x||1;const sp=r.spd/sc;
      const st=sit?'sit':eat?'eat':(sp>5.5)?'run':(sp>.25||sw>.2)?'walk':'idle';go(r,st,.25);
      const a=r.A[r.st];if(a&&r.st==='walk')a.timeScale=Math.max(.7,Math.min(1.8,sp/(r.name==='kid'?2.6:1.6)))*(SPEC[r.name].ts||1);if(a&&r.st==='run')a.timeScale=Math.max(.8,Math.min(1.6,sp/9));
      /* perf: animate only what the camera can see; far ones at half rate */
      r.acc=(r.acc||0)+dt;FR.setFromProjectionMatrix(PM.multiplyMatrices(K.cam.projectionMatrix,K.cam.matrixWorldInverse));SP.center.copy(wp);SP.radius=(r.rad||2)*(r.root.getWorldScale(V()).x||1);
      if(!FR.intersectsSphere(SP))continue;const lv=K.Q.level,far=wp.distanceTo(K.cam.position)>14;const every=(lv>=5?3:lv>=3?2:1)*(far?2:1);if(((r.tick=(r.tick||0)+1)%every))continue;r.mx.update(r.acc);r.acc=0;
      if(r.st==='sit'&&r.bones.lu){[r.bones.lu,r.bones.ru].forEach(b=>{b.rotation.set(-Math.PI/2-.1,0,0);b.rotation.z=b===r.bones.lu?-.05:.05});[r.bones.ll,r.bones.rl].forEach(b=>b&&b.rotation.set(1.5,0,0))}}});
  /* lower tiers: the child and trader switch to a light version (12k tris, colours baked into the vertices, no textures) */
  K.onQuality=(K.onQuality||[]);K.onQuality.push(()=>{LIVE.forEach(r=>{if(r.model&&SPEC[r.name].fur)r.model.traverse(m=>{if(m.userData.fur&&!m.userData.m0)m.material=K.Q.level>=3?m.userData.plain:m.userData.fur})});if(K.Q.level<2)return;LIVE.forEach(r=>{const lo=SPEC[r.name].lo;if(!lo||r.lo||!r.ready)return;r.lo=true;loadGlb(K.BASE,lo).then(gl=>{try{r.static=false;attach(r,gl);K.log('a3dglblo',{n:r.name})}catch(e){console.error(e)}})})});
  K.probes=Object.assign(K.probes||{},{glb:()=>LIVE.map(r=>({n:r.name,ready:r.ready,st:r.st})),facing:()=>LIVE.filter(r=>r.ready&&r.root.visible).map(r=>{const q=new THREE.Quaternion();(r.model||r.root).getWorldQuaternion(q);const f=V(0,0,1).applyQuaternion(q);const fh=Math.atan2(f.x,f.z);const sp=Math.hypot(r.vx||0,r.vz||0);const vh=Math.atan2(r.vx||0,r.vz||0);let e=(fh-vh)*180/Math.PI;e=((e+540)%360)-180;return {n:r.name,sp:+sp.toFixed(2),err:Math.round(e)}}),prim:()=>({cover:!!K.coverUp,frames:K.vis0||0,primFrames:K.primFrames||0,who:Object.keys(K.primWho||{}),ready:LIVE.filter(r=>r.ready).length,n:LIVE.length})});
}
