/* Arctic 3D P4 (Allen 10/20 "at least somewhat realistic"): believable animal models with fur-like shading.
   Same rig contract as P3 (group origin on the snow, facing +z; userData {legs[] hip pivots, tail pivot, head group at y .98*s, z .62*s})
   so camp / sled / stall code and the play are unchanged. Fur = strand texture (map + normal map, generated once) + soft rim sheen. */
import * as THREE from './vendor/three.module.min.js';
let FUR=null;export const FURS=[];
function furTex(){if(FUR) return FUR;const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');let s=99;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
  g.fillStyle='#d8d8d8';g.fillRect(0,0,S,S);
  for(let i=0;i<5200;i++){const x=r()*S,y=r()*S,l=4+r()*9,a=Math.PI/2+(r()-.5)*.5,v=150+r()*105|0;g.strokeStyle=`rgba(${v},${v},${v},${.35+r()*.4})`;g.lineWidth=.6+r()*1.1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  const d=g.getImageData(0,0,S,S).data,n=document.createElement('canvas');n.width=n.height=S;const ng=n.getContext('2d'),nd=ng.createImageData(S,S);const L=(x,y)=>d[(((y+S)%S)*S+((x+S)%S))*4]/255;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=(L(x+1,y)-L(x-1,y))*2.2,dy=(L(x,y+1)-L(x,y-1))*2.2;const k=1/Math.hypot(dx,dy,1),o=(y*S+x)*4;nd.data[o]=(-dx*k*.5+.5)*255;nd.data[o+1]=(dy*k*.5+.5)*255;nd.data[o+2]=k*255;nd.data[o+3]=255}ng.putImageData(nd,0,0);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const nor=new THREE.CanvasTexture(n);[map,nor].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=4});return FUR={map,nor}}
/* soft fur look: strands + a rim of light at grazing angles (cheap stand-in for real fur scattering) */
export function furMat(col,o){o=o||{};const T=furTex();const m=new THREE.MeshStandardMaterial({color:new THREE.Color(col).multiplyScalar(1.12),map:T.map,normalMap:T.nor,normalScale:new THREE.Vector2(o.ns||.9,o.ns||.9),roughness:o.rough||.95,metalness:0});
  const sheen=new THREE.Color(o.sheen||col).lerp(new THREE.Color('#ffffff'),.5);
  m.onBeforeCompile=sh=>{sh.uniforms.furSheen={value:sheen};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 furSheen;').replace('#include <opaque_fragment>','{float rim=pow(1.-saturate(dot(normalize(normal),normalize(vViewPosition))),2.6);outgoingLight+=furSheen*rim*'+(o.rim||.32).toFixed(2)+'*(.35+.65*diffuseColor.rgb);}\n#include <opaque_fragment>')};m.customProgramCacheKey=()=>'fur'+(o.rim||.32);(FURS.push(m));return m}
const sm=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)};
function mesh(geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=true;o.receiveShadow=true;return o}
/* a tapered, slightly organic body: lathe profile along z */
function lathe(prof,seg){const pts=prof.map(([r,z])=>new THREE.Vector2(r,z));const g=new THREE.LatheGeometry(pts,seg||16);g.rotateX(Math.PI/2);return g}
/* husky / fox: deep chest, tucked waist, long legs with paws, wedge muzzle, upright ears, curled (husky) or long brush (fox) tail */
export function quadModel(o){const s=o.s||1,fox=!!o.tip,g=new THREE.Group();const B=furMat(o.c),L=furMat(o.belly||o.c,{rim:.4}),Dk=new THREE.MeshStandardMaterial({color:o.dark||'#1d1b1a',roughness:.45}),Eye=new THREE.MeshStandardMaterial({color:fox?'#3a2a12':'#5b8cc4',roughness:.15,metalness:.1});
  /* torso: lathe from rump (z -.55) to chest (z .42) */
  const tor=mesh(lathe([[0,-.6],[.17,-.56],[.24,-.42],[.25,-.2],[.24,0],[.28,.2],[.3,.34],[.25,.46],[0,.52]].map(([r,z])=>[r*s,z*s]),18),B,0,.66*s,0);tor.scale.set(fox?.9:1,1.12,1);g.add(tor);
  /* pale underside + chest bib */
  const bel=mesh(lathe([[0,-.45],[.16,-.38],[.2,-.1],[.24,.2],[.24,.36],[0,.48]].map(([r,z])=>[r*s,z*s]),14),L,0,.6*s,.02*s);bel.scale.set(.86,1.0,1);g.add(bel);
  /* neck */const nk=mesh(new THREE.CylinderGeometry(.15*s,.2*s,.42*s,14),B,0,.84*s,.45*s);nk.rotation.x=.75;g.add(nk);
  const ruff=mesh(new THREE.SphereGeometry(.21*s,14,10),L,0,.74*s,.5*s);ruff.scale.set(1,1.1,.8);g.add(ruff);
  /* head */const head=new THREE.Group();head.position.set(0,.98*s,.62*s);g.add(head);
  const sk=mesh(new THREE.SphereGeometry(.19*s,18,14),B,0,.02*s,-.02*s);sk.scale.set(1.05,.92,1.08);head.add(sk);
  const face=mesh(new THREE.SphereGeometry(.16*s,16,12),L,0,-.04*s,.06*s);face.scale.set(1.08,.82,.9);head.add(face);
  const mz=mesh(new THREE.CylinderGeometry(.055*s,.1*s,.24*s,14),L,0,-.07*s,.22*s);mz.rotation.x=Math.PI/2;mz.scale.set(1,1,.8);head.add(mz);
  if(!fox){const brow=mesh(new THREE.SphereGeometry(.08*s,12,8),B,0,.06*s,.16*s);brow.scale.set(.6,.5,1.4);head.add(brow)}
  head.add(mesh(new THREE.SphereGeometry(.035*s,12,8),Dk,0,-.06*s,.34*s));
  [-1,1].forEach(sd=>{const e=mesh(new THREE.SphereGeometry(.026*s,10,8),Eye,sd*.085*s,.035*s,.17*s);head.add(e);const pu=mesh(new THREE.SphereGeometry(.013*s,8,6),Dk,sd*.088*s,.037*s,.193*s);head.add(pu);
    const ear=mesh(new THREE.ConeGeometry(.07*s,(fox?.2:.17)*s,4),B,sd*.1*s,.2*s,-.04*s);ear.rotation.set(-.15,Math.PI/4,sd*-.28);ear.scale.set(1,1,.45);head.add(ear);
    const ein=mesh(new THREE.ConeGeometry(.04*s,.11*s,4),new THREE.MeshStandardMaterial({color:'#d8a8a0',roughness:.9}),sd*.1*s,.19*s,-.025*s);ein.rotation.copy(ear.rotation);ein.scale.set(1,1,.3);head.add(ein)});
  /* legs: hip pivot at y .5s; tapered leg + paw */
  const lc=o.legc?furMat(o.legc):B;
  const legs=[[-.15,.3],[.15,.3],[-.15,-.36],[.15,-.36]].map((q,i)=>{const p=new THREE.Group();p.position.set(q[0]*s,.5*s,q[1]*s);const back=i>1;
    const up=mesh(new THREE.CylinderGeometry((back?.085:.07)*s,.052*s,.3*s,10),back?B:lc,0,-.13*s,back?-.02*s:0);p.add(up);
    const lo=mesh(new THREE.CylinderGeometry(.048*s,.04*s,.24*s,10),lc,0,-.37*s,back?-.035*s:0);p.add(lo);
    const paw=mesh(new THREE.SphereGeometry(.058*s,10,8),o.legc?lc:L,0,-.48*s,.025*s);paw.scale.set(1,.55,1.35);p.add(paw);g.add(p);return p});
  /* tail */const tail=new THREE.Group();tail.position.set(0,.75*s,-.58*s);g.add(tail);
  if(fox){const tg=lathe([[0,0],[.08,-.08],[.14,-.3],[.15,-.5],[.11,-.68],[0,-.78]].map(([r,z])=>[r*s,z*s]),12);const t=mesh(tg,B,0,0,0);t.rotation.x=.55;tail.add(t);const tp=mesh(new THREE.SphereGeometry(.1*s,12,8),furMat(o.tip),0,0,-.7*s);tp.scale.set(1,1,1.5);t.add(tp)}
  else{const tg=new THREE.TorusGeometry(.17*s,.075*s,10,18,Math.PI*1.35);const t=mesh(tg,B,0,.16*s,-.06*s);t.rotation.set(0,Math.PI/2,-.6);tail.add(t)}
  g.userData={legs,tail,head};return g}
/* ringed seal: smooth spindle body, round head with whiskered muzzle, fore flippers, hind flippers; spotted short fur */
let SPOT=null;function spotTex(){if(SPOT) return SPOT;const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#b7bcc3';g.fillRect(0,0,512,512);let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
  /* spark24: sharper, darker ringed-seal spots (the old 256px strokes read as a soft grey smear) */for(let i=0;i<90;i++){const x=r()*512,y=r()*512,R=6+r()*16,rot=r()*3;g.fillStyle=`rgba(28,30,36,${.55+r()*.35})`;g.beginPath();g.ellipse(x,y,R,R*(.55+r()*.25),rot,0,7);g.fill();g.strokeStyle='rgba(18,20,24,.85)';g.lineWidth=1.6;g.stroke();if(r()>.45){g.fillStyle='rgba(18,20,24,.55)';g.beginPath();g.ellipse(x+R*.15,y,R*.35,R*.22,rot,0,7);g.fill()}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.2,1.6);t.anisotropy=8;return SPOT=t}
export function sealModel(){const g=new THREE.Group();const B=furMat('#5c646c',{rim:.16,ns:.85,rough:.78});B.map=spotTex();const Dk=new THREE.MeshStandardMaterial({color:'#101114',roughness:.2,metalness:.15});
  const body=mesh(lathe([[0,-1.05],[.12,-.95],[.28,-.7],[.42,-.35],[.5,0],[.48,.35],[.38,.62],[.24,.8],[0,.86]],32),B,0,.4,0);body.scale.set(1,.78,1);g.add(body);
  const head=new THREE.Group();head.position.set(0,.72,.8);g.add(head);head.add(mesh(new THREE.SphereGeometry(.3,28,22),B,0,0,0));
  const mz=mesh(new THREE.SphereGeometry(.15,20,16),furMat('#8b9198',{rim:.14,ns:.55,rough:.75}),0,-.08,.24);mz.scale.set(1.2,.8,1);head.add(mz);
  [-1,1].forEach(sd=>{const ey=mesh(new THREE.SphereGeometry(.055,16,12),Dk,sd*.13,.08,.23);ey.scale.z=.7;head.add(ey);const gl=mesh(new THREE.SphereGeometry(.016,10,8),new THREE.MeshBasicMaterial({color:'#ffffff'}),sd*.145,.1,.268);head.add(gl);const wm=new THREE.MeshBasicMaterial({color:'#f2f2f2'});for(let k=0;k<3;k++){const w=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.22,3),wm);w.position.set(sd*.16,-.08-k*.025,.3);w.rotation.z=sd*(1.35+k*.12);head.add(w)}
    const f=mesh(new THREE.SphereGeometry(.13,16,12),B,sd*.42,.18,.35);f.scale.set(1.8,.3,1);f.rotation.z=sd*.5;g.add(f)});
  head.add(mesh(new THREE.SphereGeometry(.045,12,10),Dk,0,-.03,.38));
  const mouth=mesh(new THREE.SphereGeometry(.03,10,8),Dk,0,-.07,.36);mouth.scale.set(1.4,.35,1);head.add(mouth);
  const tail=new THREE.Group();tail.position.set(0,.25,-.95);g.add(tail);[-1,1].forEach(sd=>{const f=mesh(new THREE.SphereGeometry(.14,16,12),B,sd*.12,0,-.12);f.scale.set(1.4,.25,1.5);f.rotation.y=sd*.4;tail.add(f)});
  g.userData={legs:[],tail,head,seal:true};return g}

/* the child in a real parka: quilted shell, fur-trimmed hood around the face, mittens, snow pants, boots. Same rig as P3
   (legs = hip pivots at y .55, arms = shoulder pivots at y 1.25, x -/+.4); the parka material keeps colour #d9473b (the trader recolours it) */
let QUILT=null;function quiltTex(){if(QUILT) return QUILT;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,128,128);
  for(let y=0;y<4;y++){const gr=g.createLinearGradient(0,y*32,0,y*32+32);gr.addColorStop(0,'#5a5a5a');gr.addColorStop(.5,'#c8c8c8');gr.addColorStop(1,'#5a5a5a');g.fillStyle=gr;g.fillRect(0,y*32,128,32)}
  const d=g.getImageData(0,0,128,128).data,n=g.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=d[(((y+127)%128)*128+x)*4],b=d[(((y+1)%128)*128+x)*4];const dy=(b-a)/255*2.5,k=1/Math.hypot(dy,1),o=(y*128+x)*4;n.data[o]=128;n.data[o+1]=(dy*k*.5+.5)*255;n.data[o+2]=k*255;n.data[o+3]=255}
  g.putImageData(n,0,0);QUILT=new THREE.CanvasTexture(c);QUILT.wrapS=QUILT.wrapT=THREE.RepeatWrapping;QUILT.repeat.set(2,3);return QUILT}
export function kidModel(){const g=new THREE.Group();const P=new THREE.MeshStandardMaterial({color:'#d9473b',roughness:.62,normalMap:quiltTex(),normalScale:new THREE.Vector2(.9,.9)}),Fur=furMat('#efe6d6',{rim:.5}),Sk=new THREE.MeshStandardMaterial({color:'#f1c7a5',roughness:.7}),D=new THREE.MeshStandardMaterial({color:'#2c3550',roughness:.8}),Bt=new THREE.MeshStandardMaterial({color:'#4a3022',roughness:.55}),Mt=new THREE.MeshStandardMaterial({color:'#3a6fb0',roughness:.9}),Dk=new THREE.MeshStandardMaterial({color:'#1a1a1a',roughness:.3});
  const body=mesh(lathe([[0,-.46],[.36,-.44],[.42,-.3],[.38,0],[.33,.25],[.27,.4],[0,.44]],22),P,0,.98,0);body.rotation.x=-Math.PI/2;g.add(body);
  const hem=mesh(new THREE.TorusGeometry(.38,.05,8,24),Fur,0,.55,0);hem.rotation.x=Math.PI/2;g.add(hem);
  const zip=mesh(new THREE.BoxGeometry(.03,.75,.02),new THREE.MeshStandardMaterial({color:'#2a2a2a',roughness:.4,metalness:.5}),0,.95,.39);zip.rotation.x=-.12;g.add(zip);
  const hood=mesh(new THREE.SphereGeometry(.31,22,16),P,0,1.56,-.03);hood.scale.set(1,1.04,1);g.add(hood);
  const ring=mesh(new THREE.TorusGeometry(.22,.085,10,22),Fur,0,1.55,.17);g.add(ring);
  g.add(mesh(new THREE.SphereGeometry(.19,18,14),Sk,0,1.55,.13));[-.07,.07].forEach(x=>{const e=mesh(new THREE.SphereGeometry(.028,10,8),Dk,x,1.59,.3);g.add(e)});
  const ch=new THREE.MeshStandardMaterial({color:'#ef9a8a',roughness:.8});[-.11,.11].forEach(x=>{const c=mesh(new THREE.SphereGeometry(.04,10,8),ch,x,1.52,.27);c.scale.z=.4;g.add(c)});g.add(mesh(new THREE.SphereGeometry(.03,10,8),Sk,0,1.54,.31));
  const legs=[-.13,.13].map(x=>{const p=new THREE.Group();p.position.set(x,.55,0);p.add(mesh(new THREE.CylinderGeometry(.12,.11,.42,12),D,0,-.2,0));const b=mesh(new THREE.CylinderGeometry(.11,.12,.18,12),Bt,0,-.43,.02);p.add(b);const t=mesh(new THREE.SphereGeometry(.12,12,8),Bt,0,-.5,.08);t.scale.set(1,.55,1.4);p.add(t);const cuff=mesh(new THREE.TorusGeometry(.11,.035,6,14),Fur,0,-.34,0);cuff.rotation.x=Math.PI/2;p.add(cuff);g.add(p);return p});
  const arms=[-.4,.4].map(x=>{const p=new THREE.Group();p.position.set(x,1.25,0);const a=mesh(new THREE.CylinderGeometry(.1,.085,.52,12),P,0,-.26,0);p.add(a);p.add(mesh(new THREE.SphereGeometry(.1,12,10),P,0,0,0));const cf=mesh(new THREE.TorusGeometry(.08,.03,6,14),Fur,0,-.5,0);cf.rotation.x=Math.PI/2;p.add(cf);const m=mesh(new THREE.SphereGeometry(.095,12,10),Mt,0,-.58,0);m.scale.set(.9,1.1,.8);p.add(m);p.rotation.z=x<0?-.15:.15;g.add(p);return p});
  g.userData={legs,arms};return g}
