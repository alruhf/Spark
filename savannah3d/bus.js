/* P45 plan item 4: a real-looking safari bus (Coaster-style tour bus with a pop-up viewing roof) + tourist dressing for the visitors.
   Bus long axis = local +x (front at +x), wheels on the ground at y=0, ~7.6 m x 2.4 m x 3.3 m. Built from rounded boxes; static parts merged per material (light on phones). */
import {mergeGeometries} from '../arctic3d/vendor/jsm/utils/BufferGeometryUtils.js';
function rbox(THREE,w,h,d,r,m=2){const S=2*m+1;const g=new THREE.BoxGeometry(w,h,d,S,S,S);const p=g.attributes.position,n=g.attributes.normal;const H=[w/2,h/2,d/2];r=Math.min(r,w/2-1e-3,h/2-1e-3,d/2-1e-3);
  const map=(c,hw)=>{const i=Math.round((c/hw*.5+.5)*S);if(i<=m)return -hw+r*(i/m);if(i>=S-m)return hw-r*((S-i)/m);return c};
  for(let i=0;i<p.count;i++){const q=[map(p.getX(i),H[0]),map(p.getY(i),H[1]),map(p.getZ(i),H[2])];const inn=q.map((c,k)=>Math.max(-(H[k]-r),Math.min(H[k]-r,c)));const dv=q.map((c,k)=>c-inn[k]);const L=Math.hypot(...dv);
    if(L>1e-6){const u=dv.map(c=>c/L);p.setXYZ(i,inn[0]+u[0]*r,inn[1]+u[1]*r,inn[2]+u[2]*r);n.setXYZ(i,u[0],u[1],u[2])}else p.setXYZ(i,q[0],q[1],q[2])}g.deleteAttribute('uv');return g}
function signTex(THREE){const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');x.fillStyle='#2f6b3a';x.fillRect(0,0,512,96);x.fillStyle='#f6efd9';x.font='900 58px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('SAFARI TOURS',256,52);
  x.fillStyle='#e8a93a';for(let i=0;i<5;i++){x.beginPath();x.arc(28+i*0,48,0,0,7);x.fill()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
export function buildBus(THREE,bus){
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.08},o||{}));
  const MAT={paint:M('#efe6cf',{roughness:.42,metalness:.15}),skirt:M('#5d6b3a',{roughness:.6}),stripe:M('#2f6b3a',{roughness:.45}),glass:M('#3d5560',{roughness:.06,metalness:.3}),
    dark:M('#222420',{roughness:.8}),chrome:M('#cfcbbf',{roughness:.28,metalness:.8}),lamp:M('#fff7df',{emissive:'#ffe7a6',emissiveIntensity:.7,roughness:.15}),red:M('#c2261c',{emissive:'#7a0d08',emissiveIntensity:.4}),
    amber:M('#ffa524',{emissive:'#ff8a00',emissiveIntensity:.35}),canvas:M('#c9b382',{roughness:.95,side:THREE.DoubleSide}),tyre:M('#1c1c1a',{roughness:.92}),hub:M('#b9b4a6',{roughness:.35,metalness:.7})};
  const parts={};const add=(k,g,x,y,z,rx,ry,rz)=>{g=g.clone();if(g.attributes.uv)g.deleteAttribute('uv');if(!g.index)g=g;if(rx||ry||rz)g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)));g.translate(x,y,z);(parts[k]=parts[k]||[]).push(g)};
  const L=7.4,W=2.36;
  /* body: olive skirt, cream sides, green belt stripe, cream upper, roof */
  add('skirt',rbox(THREE,L,.55,W,.18),0,.78,0);
  add('paint',rbox(THREE,L-.04,.75,W-.02,.2),0,1.38,0);
  add('stripe',rbox(THREE,L+.02,.16,W+.03,.06),0,1.62,0);
  add('paint',rbox(THREE,L-.25,.95,W-.08,.22),-.05,2.2,0);
  add('paint',rbox(THREE,L-.2,.16,W,.08),-.05,2.74,0);
  /* side windows: glass band + cream pillars */
  [-1,1].forEach(sd=>{add('glass',new THREE.BoxGeometry(L-1.2,.62,.04),-.35,2.22,sd*(W/2-.03));for(let i=0;i<7;i++)add('paint',new THREE.BoxGeometry(.12,.66,.07),-3.35+i*.98,2.22,sd*(W/2-.02));
    /* wheel arches */[-2.35,2.35].forEach(x=>add('dark',new THREE.CylinderGeometry(.62,.62,.08,20,1,false,0,Math.PI),x,.6,sd*(W/2+.0),Math.PI/2*sd,0,0))});
  /* windscreen (raked) + rear window, door on the +z side */
  add('glass',new THREE.BoxGeometry(.05,.85,W-.3),L/2-.02,2.18,0,0,0,-.18);add('glass',new THREE.BoxGeometry(.05,.6,W-.4),-L/2+.08,2.22,0);
  add('glass',new THREE.BoxGeometry(.7,1.5,.05),L/2-1.1,1.6,W/2+.01);add('chrome',new THREE.BoxGeometry(.04,.32,.05),L/2-1.42,1.45,W/2+.04);
  /* front: grille, bumpers, lamps, mirrors; rear: spare wheel, ladder, tail lamps */
  add('dark',rbox(THREE,.12,.38,1.2,.05),L/2+.02,1.1,0);for(let i=0;i<4;i++)add('chrome',new THREE.BoxGeometry(.03,.03,1.1),L/2+.09,.96+i*.09,0);
  add('dark',rbox(THREE,.25,.22,W+.05,.08),L/2+.05,.62,0);add('dark',rbox(THREE,.25,.22,W+.05,.08),-L/2-.05,.62,0);
  [-1,1].forEach(sd=>{add('lamp',new THREE.CylinderGeometry(.13,.13,.06,16),L/2+.04,1.12,sd*.85,0,0,Math.PI/2);add('amber',new THREE.BoxGeometry(.05,.1,.18),L/2+.03,.9,sd*.95);add('red',new THREE.BoxGeometry(.05,.3,.14),-L/2-.01,1.25,sd*1.0);
    add('dark',new THREE.BoxGeometry(.05,.3,.04),L/2-.1,2.25,sd*(W/2+.32));add('dark',new THREE.BoxGeometry(.05,.05,.32),L/2-.1,2.38,sd*(W/2+.16))});
  add('tyre',new THREE.TorusGeometry(.33,.14,10,20),-L/2-.18,1.45,.35,0,Math.PI/2,0);add('hub',new THREE.CylinderGeometry(.2,.2,.1,14),-L/2-.18,1.45,.35,0,0,Math.PI/2);
  for(let i=0;i<6;i++)add('dark',new THREE.BoxGeometry(.04,.04,.42),-L/2-.06,1.7+i*.2,-.6);[-.8,-.4].forEach(z=>add('dark',new THREE.BoxGeometry(.04,1.3,.04),-L/2-.06,2.2,z));
  /* pop-up viewing roof: raised canvas canopy on posts over an open hatch */
  add('canvas',rbox(THREE,L-1.4,.1,W-.3,.04),-.4,3.32,0);[-3.6,-.4,2.8].forEach(x=>[-1,1].forEach(sd=>add('dark',new THREE.CylinderGeometry(.035,.035,.52,8),x,3.05,sd*(W/2-.2))));
  add('dark',new THREE.BoxGeometry(L-1.6,.06,.06),-.4,2.85,W/2-.18);add('dark',new THREE.BoxGeometry(L-1.6,.06,.06),-.4,2.85,-(W/2-.18));
  /* merge per material */
  for(const k in parts){const g=mergeGeometries(parts[k]);const m=new THREE.Mesh(g,MAT[k]);m.castShadow=true;m.receiveShadow=k!=='glass';bus.add(m)}
  /* SAFARI TOURS sign on both sides (below the windows) */
  const tx=signTex(THREE);[-1,1].forEach(sd=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.6),new THREE.MeshStandardMaterial({map:tx,roughness:.5}));s.position.set(-.6,1.32,sd*(W/2+.012));s.rotation.y=sd>0?0:Math.PI;bus.add(s)});
  /* wheels (separate so they can spin) */
  const wg=new THREE.CylinderGeometry(.5,.5,.34,22);wg.rotateX(Math.PI/2);const hg=new THREE.CylinderGeometry(.26,.26,.36,14);hg.rotateX(Math.PI/2);const wheels=[];
  [-2.35,2.35].forEach(x=>[-1,1].forEach(sd=>{const w=new THREE.Group();w.add(new THREE.Mesh(wg,MAT.tyre));w.add(new THREE.Mesh(hg,MAT.hub));w.position.set(x,.5,sd*(W/2-.12));w.children.forEach(c=>c.castShadow=true);bus.add(w);wheels.push(w)}));
  bus.userData.wheels=wheels;bus.userData.safari=1;return bus}
/* tourists (P45): the Quaternius base character (tourist.glb) in holiday clothes - recoloured shirt/shorts/hair/skin, a sun hat on the Head bone,
   a camera on the chest, a small backpack. Accessories sit on bones (world-scale compensated) so they move with the walk. */
const TOUR=[{top:'#3fa7d6',bot:'#c9b48a',leg:'shorts',boot:'#5a3b22',sock:'#efe9dc',hair:'#3b2416',skin:'#8d5524',hat:'#f3e7c4',band:'#2f6b3a',bag:'#e2483b',kind:'brim'},
  {top:'#f28c28',bot:'#6b7445',leg:'trousers',boot:'#3a2c20',sock:'#3a2c20',hair:'#d9b56b',skin:'#f1c27d',hat:'#ffffff',band:'#c0392b',bag:'#3f6fa8',kind:'cap'},
  {top:'#e9e4d4',bot:'#b89a66',leg:'shorts',boot:'#2f2a26',sock:'#6b5a40',hair:'#1b1b1b',skin:'#c68642',hat:'#c8a96b',band:'#3a2a1a',bag:'#5b8c3a',kind:'bucket'},
  {top:'#e85d9a',bot:'#d8c49a',leg:'trousers',boot:'#f4f4f4',sock:'#f4f4f4',hair:'#7a3b1d',skin:'#e0ac69',hat:'#f6c64a',band:'#2c5d8f',bag:'#7a4fa0',kind:'brim'},
  {top:'#6abf69',bot:'#8a7a55',leg:'shorts',boot:'#6b4a2b',sock:'#ffffff',hair:'#4a3020',skin:'#5c3a21',hat:'#7c9a5a',band:'#2e2e22',bag:'#d07a2c',kind:'bucket'}];
/* legs (P45b): the base body is one skinned mesh; we hide the long skirt and paint the body's legs per vertex by dominant bone:
   pelvis/thigh -> shorts/trousers, calf -> skin (shorts) or trousers, ankle (foot weight>.25) -> sock/boot top, foot/ball -> boot.
   One painted geometry per style is cached and shared, so phones pay nothing per extra visitor. */
const LEGCACHE=new Map();
function legGeo(THREE,o,t,key){if(LEGCACHE.has(key))return LEGCACHE.get(key);const g=o.geometry.clone();const n=g.attributes.position.count,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;const names=o.skeleton.bones.map(b=>b.name);
  const c=new Float32Array(n*3),C=x=>new THREE.Color(x),sk=C(t.skin),bo=C(t.bot),bt=C(t.boot),so=C(t.sock);
  for(let i=0;i<n;i++){let best=-1,bw=0,foot=0;for(let k=0;k<4;k++){const w=SW.getComponent(i,k),nm=names[SI.getComponent(i,k)]||'';if(/foot|ball/.test(nm))foot+=w;if(w>bw){bw=w;best=k}}const nm=names[SI.getComponent(i,best)]||'';
    let col=sk;if(/foot|ball/.test(nm))col=bt;else if(foot>.25)col=t.leg==='shorts'?so:bt;else if(/calf/.test(nm))col=t.leg==='shorts'?sk:bo;else if(/thigh|pelvis|spine_01/.test(nm))col=bo;else if(/spine_02/.test(nm))col=C(t.top);c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));LEGCACHE.set(key,g);return g}
export function dressTourist(THREE,m,i){const t=TOUR[i%TOUR.length];const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.75},o||{}));
  const col={ClothTop:t.top,ClothBottom:t.bot,Hair:t.hair,Skin:t.skin};
  col.Eyebrows=t.hair;const ti=i%TOUR.length;m.traverse(o=>{if(!o.isMesh||!o.material)return;o.castShadow=true;const k=(o.material.name||'')+'|'+(o.name||'');if(/ClothBottom/.test(k)){o.visible=false;return}if(o.isSkinnedMesh&&/Superhero|Body/.test(o.name)){o.geometry=legGeo(THREE,o,t,ti);o.material=o.material.clone();o.material.vertexColors=true;o.material.map=null;o.material.color.set('#ffffff');o.material.roughness=.75;o.material.metalness=0;o.material.needsUpdate=true;return}const c=/ClothTop/.test(k)?col.ClothTop:/ClothBottom/.test(k)?col.ClothBottom:/Hair/.test(k)?col.Hair:/Eyebrow/.test(k)?col.Eyebrows:/Skin|Superhero|Body/.test(k)?col.Skin:null;if(c){o.material=o.material.clone();o.material.vertexColors=false;o.material.map=null;o.material.color.set(c);o.material.roughness=.7;o.material.metalness=0;o.material.needsUpdate=true}});
  m.updateMatrixWorld(true);const bone=n=>{let b=null;m.traverse(o=>{if(!b&&o.isBone&&o.name===n)b=o});return b};const ws=new THREE.Vector3();
  const head=bone('Head'),chest=bone('spine_03');
  if(head){head.getWorldScale(ws);const hat=new THREE.Group();hat.name='touristHat';const hm=M(t.hat,{side:THREE.DoubleSide}),bm=M(t.band);
    if(t.kind==='cap'){const c=new THREE.Mesh(new THREE.SphereGeometry(.125,16,8,0,Math.PI*2,0,Math.PI/2),hm);const v=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.012,16,1,false,-Math.PI/2,Math.PI),bm);v.position.set(0,.005,.08);v.scale.z=1.3;hat.add(c,v)}
    else{const br=t.kind==='brim'?.28:.2;const b=new THREE.Mesh(new THREE.CylinderGeometry(br,br,.015,24),hm);const c=new THREE.Mesh(new THREE.CylinderGeometry(.12,.145,.13,18),hm);c.position.y=.07;const bd=new THREE.Mesh(new THREE.CylinderGeometry(.147,.147,.035,18),bm);bd.position.y=.03;hat.add(b,c,bd)}
    hat.scale.setScalar(1/ws.x);hat.position.set(0,.2/ws.y,0);head.add(hat)}
  if(chest){chest.getWorldScale(ws);const cam=new THREE.Group();cam.name='touristCam';const cb=new THREE.Mesh(new THREE.BoxGeometry(.15,.09,.07),M('#22262c',{roughness:.4}));const ln=new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,.07,14),M('#111',{roughness:.2,metalness:.5}));ln.rotation.x=Math.PI/2;ln.position.z=.06;cam.add(cb,ln);
    cam.scale.setScalar(1/ws.x);cam.position.set(0,.02/ws.y,.15/ws.z);chest.add(cam);
    const bp=new THREE.Mesh(new THREE.BoxGeometry(.28,.34,.15),M(t.bag,{roughness:.85}));bp.name='touristBag';bp.scale.setScalar(1/ws.x);bp.position.set(0,-.02/ws.y,-.2/ws.z);chest.add(bp)}
  m.traverse(o=>{if(o.isMesh)o.castShadow=true});return {head:!!head,chest:!!chest}}
