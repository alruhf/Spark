/* Arctic 3D P3: the camp gets real places you walk to (Allen 10/19): the trader's stall (buy things for the igloo), the sled start
   (dog team hitched, the trip starts here) and a frozen lake where the child drills a hole in the ice (hold / tap the auger) and fishes.
   Plus richer camp dressing (trees with snow, drifts, campfire light, lanterns, crates, kennel). The northern lights are untouched.
   Each place has a floating icon pin over it (edge-clamped when off screen): tap it or the place itself = walk there. Zero reading. */
import {makeFish,FISH_SVG} from './fish.js?v=9';
export function places(K){
  const {THREE,S,say,log,me,save,el,btn,tap,ui,mat}=K;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const C=me.camp;
  const OBS=K.OBS=K.OBS||[];
  const add=(o,x,y,z,ry)=>{o.position.set(x,y,z);if(ry)o.rotation.y=ry;o.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true}});S.add(o);return o};
  const M=(g,m)=>new THREE.Mesh(g,m);
  const wood=mat('#9a6a3c',{map:K.T.wood,roughness:.85}),darkWood=mat('#6e4526',{map:K.T.wood,roughness:.9}),snowM=mat('#ffffff',{roughness:.9}),cloth=mat('#c94b3c',{roughness:.8}),cloth2=mat('#f4efe6',{roughness:.9});
  /* perf: bake a static group into one mesh per material look (draw calls matter on slow tablets) */
  function bake(g){g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();const by=new Map();const kill=[];
    g.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.keep) return;const m=o.material;const key=[m.type,m.color&&m.color.getHexString(),m.map&&m.map.uuid,m.emissive&&m.emissive.getHexString(),m.roughness,m.metalness,m.transparent,m.side].join('|');
      let gg=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();['color','uv1','uv2'].forEach(a=>gg.deleteAttribute&&gg.deleteAttribute(a));if(!gg.attributes.uv){gg.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count*2),2))}
      gg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!by.has(key))by.set(key,{m,list:[]});by.get(key).list.push(gg);kill.push(o)});
    kill.forEach(o=>o.parent.remove(o));
    by.forEach(({m,list})=>{let n=0;list.forEach(q=>n+=q.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let k=0;list.forEach(q=>{P.set(q.attributes.position.array,k*3);N.set(q.attributes.normal.array,k*3);U.set(q.attributes.uv.array,k*2);k+=q.attributes.position.count});
      const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(P,3));bg.setAttribute('normal',new THREE.BufferAttribute(N,3));bg.setAttribute('uv',new THREE.BufferAttribute(U,2));const mm=new THREE.Mesh(bg,m);mm.castShadow=mm.receiveShadow=true;g.add(mm)});return g}
  /* ---------------- camp dressing ---------------- */
  /* spruce ring (instanced). spark19 (Tester sw-desk-arctic-entry: "trees are flat dark cones"): each spruce is now ONE shaded crown of 5 layered
     branch tiers - every tier is a lathed skirt with a ragged, drooping rim of branch tips and a dark underside, vertex-coloured (dark inside / underside,
     lighter tips, snow lying on the upward-facing tops), plus a little per-tree colour variation. 2 draw calls for all 34 trees (was 7), ~760 vertices a tree */
  {const n=34;const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=V(1,1,1);const pos=[];let seed=5;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
   for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rr()*.15,d=27+rr()*9;const x=Math.cos(a)*d,z=Math.sin(a)*d;pos.push([x,z,.75+rr()*.6,rr()*6])}
   const crown=(()=>{const TI=[[1.75,1.25,.55],[1.45,1.15,1.35],[1.15,1.05,2.1],[.85,.95,2.8],[.5,1.05,3.4]],SEG=18;const Ps=[],Ns=[],Cs=[],Ix=[];let base=0;
     const cIn=new THREE.Color('#163126'),cOut=new THREE.Color('#2f6a4b'),cTip=new THREE.Color('#4d8a62'),cSnow=new THREE.Color('#eef5fb'),cU=new THREE.Color('#10251c'),c=new THREE.Color();
     TI.forEach(([r,h,y0],ti)=>{const pts=[[0,.28],[.4,.18],[.78,-.02],[1,-.05],[.96,.04],[.62,.38],[.28,.78],[0,1]].map(([a,b])=>new THREE.Vector2(Math.max(a*r,.001),y0+b*h));
       const g=new THREE.LatheGeometry(pts,SEG);const P=g.attributes.position,ph=ti*1.7;
       for(let k=0;k<P.count;k++){const x=P.getX(k),y=P.getY(k),z=P.getZ(k);const rad=Math.hypot(x,z);if(rad<1e-3)continue;const a=Math.atan2(z,x);const w=Math.max(0,Math.min(1,(rad/r-.45)*1.8));const st=Math.sin(a*9+ph);const kk=1+.15*st*w+.05*Math.sin(a*21+ph*3)*w;P.setXYZ(k,x*kk,y-.13*h*w*(.5+.5*st),z*kk)}
       g.computeVertexNormals();const N=g.attributes.normal;
       for(let k=0;k<P.count;k++){const x=P.getX(k),y=P.getY(k),z=P.getZ(k);const rad=Math.hypot(x,z)/r,ny=N.getY(k),a=Math.atan2(z,x);
         c.copy(cIn).lerp(cOut,Math.min(1,rad*1.1));if(rad>.8)c.lerp(cTip,(rad-.8)*2.5);if(ny<0)c.lerp(cU,Math.min(1,-ny*1.6));
         const sn=Math.max(0,Math.min(1,(ny-.5)*3.2))*(.55+.45*Math.sin(a*5+ti*2.1))*(rad<1.05?1:.6);if(sn>0)c.lerp(cSnow,Math.min(1,sn*1.15));
         Ps.push(x,y,z);Ns.push(N.getX(k),ny,N.getZ(k));Cs.push(c.r,c.g,c.b)}
       const I=g.index.array;for(let k=0;k<I.length;k++)Ix.push(I[k]+base);base+=P.count;g.dispose()});
     const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Ps,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Ns,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(Cs,3));bg.setIndex(Ix);bg.computeBoundingSphere();return bg})();
   const cm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide});const im=new THREE.InstancedMesh(crown,cm,n);im.castShadow=true;im.receiveShadow=true;im.name='spruceCrowns';const tc=new THREE.Color();
   pos.forEach((p,i)=>{q.setFromAxisAngle(V(0,1,0),p[3]);sc.setScalar(p[2]);m4.compose(V(p[0],0,p[1]),q,sc);im.setMatrixAt(i,m4);const v=.9+rr()*.18;tc.setRGB(v,v*(.97+rr()*.06),v);im.setColorAt(i,tc)});S.add(im);K.spruceN={verts:crown.attributes.position.count,tris:crown.index.count/3,trees:n};
   const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.26,1.2,8),darkWood,n);tr.castShadow=true;pos.forEach((p,i)=>{m4.compose(V(p[0],.5*p[2],p[1]),q.identity(),sc.setScalar(p[2]));tr.setMatrixAt(i,m4)});S.add(tr)}
  /* soft snow drifts (instanced flattened spheres) */
  {const spots=[[-11,10,2.2],[10,-12,2.6],[-16,-2,1.8],[18,2,2],[16,12,1.6],[-6,24,2.4],[9,26,2],[-20,14,2.2],[20,-10,2.4],[-14,-16,2.6],[9,-19,2],[-9,-24,1.8],[22,8,1.6],[-22,4,2],[12,-17,1.8],[-9,-21,2.2],[24,-2,2],[-18,20,1.8]];
   const im=new THREE.InstancedMesh(new THREE.SphereGeometry(1,14,8),mat('#f7fbff',{roughness:1}),spots.length*2);im.receiveShadow=true;const m4=new THREE.Matrix4(),q=new THREE.Quaternion();let k=0;
   spots.forEach(([x,z,r],i)=>{[[0,0,1],[r*.7,r*.4,.6]].forEach(([ox,oz,s])=>{q.setFromAxisAngle(V(0,1,0),i);m4.compose(V(x+ox,-.15,z+oz),q,V(r*s*1.6,r*s*.38,r*s));im.setMatrixAt(k++,m4)})});S.add(im)}
  /* campfire by the tent: logs, stone ring, flickering flames, warm light (no shadow) */
  const FIRE=V(-9.2,0,-5.2);const flames=[];let fireL=null;
  {const g=new THREE.Group();const st=mat('#8d96a3',{roughness:.95});for(let i=0;i<9;i++){const a=i/9*Math.PI*2,s=M(new THREE.DodecahedronGeometry(.22,1),st);s.position.set(Math.cos(a)*.62,.1,Math.sin(a)*.62);s.scale.y=.7;g.add(s)}
   for(let i=0;i<4;i++){const l=M(new THREE.CylinderGeometry(.08,.09,.9,10),darkWood);l.rotation.z=Math.PI/2;l.rotation.y=i*Math.PI/4;l.position.y=.12+i*.03;g.add(l)}
   [[.32,.85,'#ff7a2a'],[.22,.65,'#ffb347'],[.12,.45,'#fff0a0']].forEach(([r,h,c],i)=>{const f=M(new THREE.ConeGeometry(r,h,12),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.92,depthWrite:false}));f.position.y=.2+h/2;f.castShadow=false;g.add(f);flames.push(f)});
   flames.forEach(f=>f.userData.keep=1);bake(g);add(g,FIRE.x,0,FIRE.z);flames.forEach(f=>f.castShadow=false);OBS.push([FIRE.x,FIRE.z,.8]);
   /* sitting logs */[[1.4,.6],[-.4,1.5]].forEach(([dx,dz],i)=>{const l=M(new THREE.CylinderGeometry(.22,.22,1.3,12),wood);l.rotation.z=Math.PI/2;l.rotation.y=i?1.2:.3;add(l,FIRE.x+dx,.22,FIRE.z+dz)})}
  OBS.push([-12.5,-9,2.1]);
  /* glow sprite texture */
  const glowT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,230,170,1)');gr.addColorStop(.35,'rgba(255,190,110,.45)');gr.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
  const glows=[];function glow(x,y,z,s){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.75}));sp.position.set(x,y,z);sp.scale.setScalar(s);S.add(sp);glows.push(sp);return sp}
  glow(FIRE.x,.9,FIRE.z,3.2);
  /* lantern posts along the paths. spark19 (Tester sw-desk-arctic-entry: "lamp posts look like matchsticks with a flat cream disc"): a real street
     lantern - stone-grey base, tapered iron post, collar, a glowing glass lantern in a 4-bar cage, a pointed iron roof with snow on it and a finial,
     a bigger warm halo round the glass and a soft pool of light on the snow. All instanced: 9 draw calls for the 8 posts (+ their 8 halo sprites as before) */
  {const posts=[[-5,12.5],[5,12.5],[-11,8.5],[10.5,10],[-11,-1],[11,-1],[-5,-12],[6,-12]];const n=posts.length;const m4=new THREE.Matrix4();
   const iron=mat('#2f343b',{metalness:.55,roughness:.42}),stone=mat('#8f97a3',{roughness:.9});
   const glass=new THREE.MeshStandardMaterial({color:'#fff0c8',emissive:'#ffb648',emissiveIntensity:1.7,roughness:.25});
   const cage=(()=>{const parts=[];for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;const b=new THREE.BoxGeometry(.026,.36,.026);b.translate(Math.cos(a)*.128,0,Math.sin(a)*.128);parts.push(b)}const ring=(y)=>{const t=new THREE.TorusGeometry(.13,.014,4,16);t.rotateX(Math.PI/2);t.translate(0,y,0);return t};parts.push(ring(-.17),ring(.17));
     let nv=0;parts.forEach(g=>{if(g.index)g.copy(g.toNonIndexed())});const P=[],N=[];parts.forEach(g=>{P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array);g.dispose()});const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return bg})();
   const poolT=glowT;const poolM=new THREE.MeshBasicMaterial({map:poolT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.42,color:'#ffc070'});
   const pool=new THREE.PlaneGeometry(1,1);pool.rotateX(-Math.PI/2);
   const parts=[[new THREE.CylinderGeometry(.15,.2,.24,10),stone,.12,1],[new THREE.CylinderGeometry(.05,.075,1.95,10),iron,1.18,1],[new THREE.CylinderGeometry(.115,.07,.09,10),iron,2.17,1],
     [new THREE.CylinderGeometry(.115,.1,.32,10),glass,2.38,0],[cage,iron,2.38,1],[new THREE.ConeGeometry(.22,.2,8),iron,2.65,1],[new THREE.ConeGeometry(.185,.11,8),snowM,2.71,0],[new THREE.SphereGeometry(.035,8,6),iron,2.8,1],[pool,poolM,.04,-1]];
   parts.forEach(([g,m,y,sh])=>{const im=new THREE.InstancedMesh(g,m,n);im.castShadow=sh===1;im.receiveShadow=sh>=0;if(sh<0)im.renderOrder=2;posts.forEach(([x,z],i)=>{if(sh<0)m4.makeScale(3.2,1,3.2).setPosition(x,y,z);else m4.makeTranslation(x,y,z);im.setMatrixAt(i,m4)});S.add(im)});
   posts.forEach(([x,z])=>{glow(x,2.38,z,1.5);OBS.push([x,z,.25])})}
  /* husky kennel */
  {const g=new THREE.Group();g.add(K.box(1.8,1.1,1.6,wood,0,.55,0));[-1,1].forEach(sd=>{const r=K.box(1.25,.08,1.9,darkWood,sd*.45,1.35,0);r.rotation.z=-sd*.62;g.add(r)});const sn=K.box(1.1,.12,1.95,snowM,0,1.62,0);g.add(sn);const d=M(new THREE.CircleGeometry(.38,16),mat('#2a1d14'));d.position.set(0,.45,.81);g.add(d);bake(g);add(g,17.6,0,-1.2,-1.9);OBS.push([17.6,-1.2,1.2])}
  /* ---------------- PLACES ---------------- */
  const PL=[];K.places=PL;/* Allen 11/15 item 9: where the kid stands + the named spots this world already pins (read by spark-here.js for 'what is this place') */window.__sparkSpots={area:'arctic',get:()=>{try{return {walk:K.mode==='walk',x:+K.kid.position.x.toFixed(1),z:+K.kid.position.z.toFixed(1),spots:PL.map(P=>{try{const w=(P.stand||P.obj.position);return w?[P.id,+w.x.toFixed(1),+w.z.toFixed(1)]:null}catch(e){return null}}).filter(Boolean)}}catch(e){return null}}};
  function place(id,obj,stand,face,go,ico,col){const p={id,obj,stand,face,ico,col};obj.traverse(o=>o.userData.place=id);p.go=()=>{log('a3dplacego',{id});K.stopFollow&&K.stopFollow();K.walkTo(stand,()=>{K.kid.rotation.set(0,Math.atan2(face.x-K.kid.position.x,face.z-K.kid.position.z),0);/* P6D: pure yaw (lookAt could flip the Euler to x=z=PI -> sideways walking afterwards) */go()})};PL.push(p);return p}
  /* --- trader stall */
  const STALL=K.STALL=V(-13,0,3);
  {const g=new THREE.Group();g.add(K.box(3.2,1,1.2,wood,0,.5,.3));g.add(K.box(3.4,.12,1.4,darkWood,0,1.06,.3));[[-1.55,-.35],[1.55,-.35],[-1.55,1],[1.55,1]].forEach(([x,z])=>g.add(K.box(.14,2.8,.14,darkWood,x,1.4,z)));
   for(let i=0;i<6;i++){const s=K.box(3.5/6,.08,1.9,i%2?cloth2:cloth,-1.75+3.5/12+i*3.5/6,2.85,.35);s.rotation.x=-.22;g.add(s)}g.add(K.box(3.6,.18,2,snowM,0,3.05,.3));
   /* goods on the counter */const gc=['#f6d66b','#6fa8dc','#e2716f','#b5e3c2'];gc.forEach((c,i)=>{const b=K.box(.36,.3,.36,mat(c,{roughness:.6}),-1.2+i*.8,1.27,.5);b.rotation.y=i;g.add(b)});
   const lant=K.sph(.14,new THREE.MeshStandardMaterial({color:'#fff1c0',emissive:'#ffb648',emissiveIntensity:1.8}),1.4,2.45,1.05);g.add(lant);
   /* trader in a green parka */const tr=K.makeKid(true);tr.traverse(o=>o.userData.keep=1);tr.traverse(o=>{if(o.isMesh&&o.material.color&&o.material.color.getHexString()==='d9473b'){o.material=o.material.clone();o.material.color.set('#3c8d5a')}});tr.position.set(0,0,-.7);tr.scale.setScalar(1.05);g.add(tr);K._trader=tr;
   /* crates + barrel */const cr=K.box(.8,.8,.8,wood,2.4,.4,-.4);cr.rotation.y=.4;g.add(cr);g.add(K.box(.6,.6,.6,darkWood,2.5,1.1,-.35));const br=M(new THREE.CylinderGeometry(.38,.38,.9,16),darkWood);br.position.set(-2.4,.45,-.2);g.add(br);
   bake(g);g.rotation.y=Math.PI/2;add(g,STALL.x,0,STALL.z);glow(STALL.x+1.05,2.45,STALL.z-1.4,1.4);OBS.push([STALL.x,STALL.z,2.1]);
   place('trader',g,V(STALL.x+3.2,0,STALL.z),STALL,()=>K.setMode('shop'),K.shopIco,'#e2716f')}
  K.goTrader=()=>{if(K.mode!=='walk')K.setMode('walk');PL[0].go()};
  /* --- sled start: sled + hitched team of 4 + start arch */
  const SLED=V(11.5,0,6);const team=[];
  {const g=new THREE.Group();const w=wood;g.add(K.box(2.4,.12,1,w,0,.45,0));[-.45,.45].forEach(z=>{const r=K.box(2.8,.06,.08,w,0,.06,z);g.add(r);[-.9,0,.9].forEach(x=>g.add(K.box(.06,.4,.06,w,x,.25,z)))});g.add(K.box(.08,.7,1,w,-1.15,.8,0));
   const bag=K.sph(.4,cloth,.3,.75,0);bag.scale.set(1.4,.7,1);g.add(bag);
   const rope=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(1.2,.4,0),V(6.4,.55,0)]),new THREE.LineBasicMaterial({color:'#5a3a22'}));g.add(rope);
   const cols=[['#7d838e','#f2f2f2'],['#3b3f47','#f4f4f4'],['#b07a4a','#f6efe4'],['#e9e9ea','#ffffff']];
   cols.forEach((c,i)=>{const d=K.makeQuad({c:c[0],belly:c[1],s:.8,tailUp:true});d.position.set(2.6+Math.floor(i/2)*1.9,0,i%2?.55:-.55);d.rotation.y=Math.PI/2;d.traverse(o=>o.userData.keep=1);g.add(d);team.push(d)});
   /* start arch with flags */const ar=new THREE.Group();[-1.8,1.8].forEach(z=>ar.add(K.box(.16,3,.16,darkWood,0,1.5,z)));ar.add(K.box(.2,.2,3.8,darkWood,0,3,0));for(let i=0;i<7;i++){const f=M(new THREE.ConeGeometry(.16,.4,3),mat(['#e2716f','#f6d66b','#6fa8dc','#b5e3c2'][i%4]));f.rotation.x=Math.PI;f.position.set(0,2.7,-1.5+i*.5);ar.add(f)}ar.position.x=8;g.add(ar);
   const teamP=team.map(d=>d.position.clone());bake(g);add(g,SLED.x,0,SLED.z,0);OBS.push([SLED.x,SLED.z,1.3]);teamP.forEach(p=>{OBS.push([SLED.x+p.x,SLED.z+p.z,.55])});OBS.push([SLED.x+8,SLED.z-1.8,.3],[SLED.x+8,SLED.z+1.8,.3]);
   place('sled',g,V(SLED.x-2.2,0,SLED.z+1.4),SLED,()=>K.setMode('sled'),K.sledIco,'#6fa8dc')}
  K.goSled=()=>{if(K.mode!=='walk')K.setMode('walk');PL[1].go()};
  /* --- frozen lake + fishing spot */
  const LAKE=V(0,0,-17.5),SPOT=V(2.4,0,-16.8);
  {const lk=M(new THREE.CircleGeometry(6.2,48),new THREE.MeshStandardMaterial({color:'#bfe0f5',roughness:.18,metalness:.1}));lk.rotation.x=-Math.PI/2;lk.position.set(LAKE.x,.02,LAKE.z);lk.receiveShadow=true;S.add(lk);
   const rim=M(new THREE.TorusGeometry(6.2,.35,8,48),snowM);rim.rotation.x=Math.PI/2;rim.position.set(LAKE.x,.02,LAKE.z);rim.scale.z=.4;S.add(rim);
   /* cracks */const cm=new THREE.LineBasicMaterial({color:'#e8f6ff'});for(let i=0;i<6;i++){const a=i*1.1,pts=[];for(let k=0;k<5;k++)pts.push(V(LAKE.x+Math.cos(a+k*.2)*(1+k*1),.03,LAKE.z+Math.sin(a+k*.2)*(1+k*1)));S.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),cm))}}
  const F={g:new THREE.Group(),st:'ice',prog:0,hold:false,biteAt:0,biteEnd:0,caught:0};F.g.position.copy(SPOT);S.add(F.g);
  const patch=M(new THREE.CircleGeometry(.95,32),new THREE.MeshStandardMaterial({color:'#e3f3ff',roughness:.35}));patch.rotation.x=-Math.PI/2;patch.position.y=.04;F.g.add(patch);
  const flag=new THREE.Group();flag.add(K.box(.05,1.3,.05,darkWood,0,.65,0));const fl=M(new THREE.PlaneGeometry(.5,.32),new THREE.MeshStandardMaterial({color:'#ff9a3c',side:THREE.DoubleSide}));fl.position.set(.27,1.12,0);flag.add(fl);flag.position.set(1.1,0,.4);F.g.add(flag);
  const bucket=M(new THREE.CylinderGeometry(.26,.2,.42,16),mat('#2e86c1',{roughness:.5}));bucket.position.set(-1,.21,.2);F.g.add(bucket);
  const water=M(new THREE.CircleGeometry(.36,28),new THREE.MeshStandardMaterial({color:'#0f3a5c',roughness:.08,metalness:.3}));water.rotation.x=-Math.PI/2;water.position.y=.05;water.scale.setScalar(.001);F.g.add(water);
  const lip=M(new THREE.TorusGeometry(.38,.07,8,28),mat('#f4fbff',{roughness:.4}));lip.rotation.x=Math.PI/2;lip.position.y=.06;lip.scale.setScalar(.001);F.g.add(lip);
  /* auger: T handle, shaft, spiral blade */
  const aug=new THREE.Group();{const metal=mat('#aab4be',{metalness:.6,roughness:.35});aug.add(K.box(.9,.08,.08,mat('#e2716f'),0,1.25,0));aug.add(M(new THREE.CylinderGeometry(.04,.04,1.25,10),metal)).position.y=.62;
   for(let i=0;i<10;i++){const b=K.box(.3,.02,.1,metal,0,.08+i*.06,0);b.rotation.y=i*.7;aug.add(b)}aug.position.set(0,.05,0);F.g.add(aug)}
  const chipsG=new THREE.SphereGeometry(.05,6,4),chipM=mat('#ffffff');const chips=[];
  /* rod + line + bobber */
  const rod=new THREE.Group();{const r=M(new THREE.CylinderGeometry(.015,.03,1.6,8),mat('#5a3a22'));r.position.y=.8;rod.add(r);rod.position.set(-.55,.75,.75);rod.rotation.set(-.9,0,-.25);rod.visible=false;F.g.add(rod)}
  const bob=new THREE.Group();bob.add(K.sph(.07,mat('#e74c3c'),0,.06,0));bob.add(K.sph(.05,mat('#ffffff'),0,.13,0));bob.visible=false;F.g.add(bob);
  const lineG=new THREE.BufferGeometry().setFromPoints([V(),V()]);const line=new THREE.Line(lineG,new THREE.LineBasicMaterial({color:'#333'}));line.visible=false;F.g.add(line);
  const fishM=makeFish(THREE,{scale:.85});fishM.visible=false;F.g.add(fishM);let fishFly=null;
  place('fish',F.g,V(SPOT.x,0,SPOT.z+1.5),SPOT,()=>K.setMode('fish'),FISH_SVG,'#2e86c1');
  K.goFish=()=>{if(K.mode!=='walk')K.setMode('walk');PL[2].go()};
  /* fishing UI: auger (hold or tap), rod (cast), reel (when the float bobs) */
  const fu=el('div','a3d-fishui');ui.appendChild(fu);
  const ICOD='<svg viewBox="0 0 48 48"><rect x="8" y="6" width="32" height="7" rx="3" fill="#e2716f" stroke="#fff" stroke-width="2.5"/><rect x="21" y="12" width="6" height="18" fill="#cfd8e0"/><path d="M17 30h14l-3 4h-8zM18 35h12l-3 4h-6zM20 40h8l-4 5z" fill="#cfd8e0" stroke="#fff" stroke-width="1.5"/></svg>';
  const ICOR='<svg viewBox="0 0 48 48"><path d="M8 42L38 6" stroke="#a8743f" stroke-width="4" stroke-linecap="round"/><path d="M38 6c4 10 4 22 0 30" fill="none" stroke="#fff" stroke-width="2"/><circle cx="38" cy="38" r="4" fill="#e74c3c" stroke="#fff" stroke-width="2"/></svg>';
  const ICOL='<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="14" fill="#5a3a22" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="#fff"/><path d="M24 10v-4M24 6h10" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';
  const bDrill=btn('a3d-fbtn drill','Drill',ICOD+'<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" pathLength="100"/></svg>');const bCast=btn('a3d-fbtn cast','Fish',ICOR);const bReel=btn('a3d-fbtn reel','Pull',ICOL);[bDrill,bCast,bReel].forEach(b=>fu.appendChild(b));
  const ringC=bDrill.querySelector('.ring circle');
  let buzz=null;function buzzOn(on){try{const ac=K.ac||(K.ac=new (window.AudioContext||window.webkitAudioContext)());if(ac.state==='suspended')ac.resume();if(on&&!buzz){const o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.frequency.value=70;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();buzz={o,g}}else if(!on&&buzz){buzz.g.gain.setTargetAtTime(0,ac.currentTime,.05);const b=buzz;setTimeout(()=>{try{b.o.stop()}catch(e){}},200);buzz=null}}catch(e){}}
  bDrill.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(F.st!=='ice') return;F.hold=true;F.downT=performance.now();F.prog=Math.min(1,F.prog+.08);buzzOn(true);try{bDrill.setPointerCapture(e.pointerId)}catch(_){};if(!F.saidDrill){F.saidDrill=1}log('a3ddrill',{down:true,prog:+F.prog.toFixed(2)})});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>bDrill.addEventListener(ev,()=>{if(F.hold){F.hold=false;/* P6D: a quick tap/click keeps drilling a while - mouse users don't need to hold */if(performance.now()-(F.downT||0)<450)F.autoT=Math.max(F.autoT||0,1.8);buzzOn(false);log('a3ddrill',{down:false,prog:+F.prog.toFixed(2)})}}));
  function ui2(){fu.dataset.st=F.st;bDrill.style.display=F.st==='ice'?'':'none';bCast.style.display=F.st==='hole'?'':'none';bReel.style.display=(F.st==='cast'||F.st==='bite')?'':'none';bReel.classList.toggle('go',F.st==='bite');ringC.style.strokeDashoffset=100-F.prog*100}
  function holeDone(){F.st='hole';F.holeT=performance.now();F.hold=false;buzzOn(false);K.chime(880,.25);setTimeout(()=>K.chime(1320,.3),140);say('hole_done');log('a3dhole',{done:true});ui2()}
  bCast.addEventListener('pointerdown',()=>{bCast._down=1});tap(bCast,()=>{if(!bCast._down) return;bCast._down=0;if(F.st!=='hole'||performance.now()-(F.holeT||0)<300) return;F.st='cast';F.biteAt=performance.now()+1600+Math.random()*1800;bob.visible=line.visible=true;bob.position.set(0,.02,0);K.chime(520,.15);say('fish_wait');log('a3dcast',{});ui2()});
  tap(bReel,()=>{if(F.st==='cast'){say('fish_wait');bReel.classList.add('shake');setTimeout(()=>bReel.classList.remove('shake'),400);log('a3dreel',{early:true});return}
    if(F.st!=='bite') return;F.st='hole';bob.visible=line.visible=false;C.fish++;F.caught++;save();K.fishN&&K.fishN();fishFly={t0:performance.now(),side:Math.random()<.5?-1:1};fishM.visible=true;K.chime(784,.2);setTimeout(()=>K.chime(1047,.3),150);say('caught');log('a3dcatch',{fish:C.fish,n:F.caught});ui2()});
  K.modes.fish={
    enter(){fu.classList.add('on');K.kid.visible=true;rod.visible=F.st!=='ice';if(F.st==='ice'){say('drill_start')}else say('fish_cast');ui2();log('a3dfish',{st:F.st})},
    exit(){fu.classList.remove('on');F.hold=false;buzzOn(false);rod.visible=false;bob.visible=line.visible=false;if(F.st==='cast'||F.st==='bite')F.st='hole'},
    /* P6C: frame the kid AND the hole/fish from the side and a bit higher, so the flopping fish never covers the kid's face */
    cam(c){c.fov=c.aspect<1?64:50;const k=K.kid.position;const mx=(k.x+SPOT.x)/2,mz=(k.z+SPOT.z)/2;const dx=SPOT.x-k.x,dz=SPOT.z-k.z,L=Math.hypot(dx,dz)||1;const px=-dz/L,pz=dx/L;const d=c.aspect<1?7.2:5.6;c.position.set(mx+px*d,3.4,mz+pz*d);c.lookAt(mx,.7,mz)},
    back(){K.setMode('walk')}};
  /* P6C: a big, obvious Done button while ice fishing (besides the small back arrow) */
  const bDone=btn('a3d-fdone','Done fishing','<svg viewBox="0 0 48 48"><path d="M10 26l9 9 19-21" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><b>Done</b>');K.ui.appendChild(bDone);tap(bDone,()=>{log('a3dfishdone',{});K.setMode('walk')});
  {const e0=K.modes.fish.enter,x0=K.modes.fish.exit;K.modes.fish.enter=function(){bDone.classList.add('on');return e0.apply(this,arguments)};K.modes.fish.exit=function(){bDone.classList.remove('on');return x0.apply(this,arguments)}}
  /* ---------------- icon pins over places (edge-clamped off screen); tap = walk there ---------------- */
  const pins=PL.map(p=>{const b=btn('a3d-pin','Go',p.ico);b.dataset.place=p.id;b.style.setProperty('--pc',p.col);K.wrap.appendChild(b);tap(b,()=>{if(K.mode==='walk')p.go()});return b});
  K.placeAt=(x,y)=>{const h=K.pick(x,y,PL.map(p=>p.obj));if(!h.length) return null;let o=h[0].object;while(o&&!o.userData.place&&o.parent)o=o.parent;return PL.find(p=>p.id===o.userData.place)||null};
  /* ---------------- per frame ---------------- */
  let tm=0;
  K.updates.push((dtm,now)=>{const dt=Math.min(dtm,80)/1000;tm+=dt;
    /* fire flicker + glows */
    flames.forEach((f,i)=>{f.scale.set(1+Math.sin(tm*13+i)*.08,1+Math.sin(tm*9+i*2)*.18+Math.sin(tm*23)*.05,1+Math.cos(tm*11+i)*.08)});if(fireL)fireL.intensity=6.5+Math.sin(tm*17)*.8+Math.sin(tm*7)*.6;
    /* team breathing + tail wag */
    {const lv=K.Q.level;glows.forEach((g,i)=>g.visible=lv<3||i===0)}
    PL[1].obj.scale.y=1+Math.sin(tm*2.2)*.006;
    fl.rotation.y=Math.sin(tm*3)*.3;
    /* pins */
    const W=K.wrap.clientWidth,Hh=K.wrap.clientHeight,on=K.mode==='walk';const pinXY=[...K.wrap.querySelectorAll('.a3d-edge')].filter(e=>e._xy&&e.style.display!=='none').map(e=>e._xy);
    PL.forEach((p,i)=>{const b=pins[i];if(!on){b.style.display='none';return}const s=K.scr(p.obj.getWorldPosition(V(0,0,0)).add(V(0,p.id==='fish'?1.6:2.7+Math.sin(tm*2+i)*.08,0)));const d=K.kid.position.distanceTo(p.stand);
      /* P6D (Allen): pins live over their place in the world - no edge clamping; hidden when off screen, far, or over the kid/Spark; fade */
      let x=s.x,y=s.y;let show=s.vis&&d>=(p.id==='trader'?2.2:5)&&d<=45&&x>36&&x<W-36&&y>64&&y<Hh-60;/* pt2 (Allen 10:11-10:27 'there is no indicator for the trader'): the trader stall sits off to the side of camp, so its pin was off screen (or hidden 5 m out). The trader pin now also shows close up, and when the stall is off screen it waits at the screen edge on the trader's side (same pin, edge style); tap = walk to the trader */let edge=false;if(p.id==='trader'&&!show&&d>=2.2&&d<=60){const cm=K.cam||K.camera;let side=0;if(cm){const q=p.obj.getWorldPosition(V(0,0,0)).applyMatrix4(cm.matrixWorldInverse);side=q.x>=0?1:-1;if(q.z<0&&s.vis&&!(x>36&&x<W-36))side=x>W/2?1:-1}else side=s.x>W/2?1:-1;if(!s.vis||x<=36||x>=W-36){x=side>0?W-40:40;y=Math.max(150,Math.min(Hh-200,Hh*.42));show=true;edge=true}}
      if(show){const kq=K.scr(K.kid.position.clone().add(V(0,1.1,0)));if(Math.abs(kq.x-x)<70&&y>kq.y-140&&y<kq.y+90)show=false}
      if(show){const sr=K.spk&&K.spk.getBoundingClientRect();if(sr&&sr.width){const wr=K.wrap.getBoundingClientRect();if(x>sr.left-wr.left-40&&x<sr.right-wr.left+40&&y>sr.top-wr.top-40&&y<sr.bottom-wr.top+40){/* place sits behind Spark: nudge the pin just beside Spark (still at the place) */if(p.id==='trader'){/* pt2: the trader keeps its marker - edge style just right of Spark */x=Math.min(W-40,sr.right-wr.left+44);y=Math.max(70,(sr.top+sr.bottom)/2-wr.top);edge=true}else show=false}/* P6E: place is behind Spark - no pin (a pin moved beside Spark looked like it belonged to something else); the place itself stays tappable */}}
      if(show&&b._crowd&&performance.now()-b._crowd<1500)show=false;
      if(show)for(const q of pinXY){if(Math.hypot(q[0]-x,q[1]-y)<64){show=false;break}}
      b.style.display='block';b.classList.toggle('edge',edge);b.classList.toggle('pin-on',show);if(show)pinXY.push([x,y]);b.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)'});
    if(K.mode!=='fish'&&!fishFly) return;
    /* drilling */
    if(F.st==='ice'){if(F.autoT>0)F.autoT-=dt;if(F.hold||F.autoT>0){F.prog=Math.min(1,F.prog+dt/1.6);aug.rotation.y+=dt*22;if(Math.random()<.6){const c=M(chipsG,chipM);c.position.set(0,.08,0);F.g.add(c);const a=Math.random()*6.28;chips.push({c,v:V(Math.cos(a)*1.4,1.6+Math.random(),Math.sin(a)*1.4),t:0})}if(F.prog>=1)holeDone();else ui2()}
      aug.visible=true;aug.position.y=.05-F.prog*.45;water.scale.setScalar(Math.max(.001,F.prog*.8));lip.scale.setScalar(Math.max(.001,F.prog))}
    else{if(aug.visible){aug.position.y+=dt*2;aug.position.x+=dt*1.5;if(aug.position.y>1.5)aug.visible=false}water.scale.setScalar(1);lip.scale.setScalar(1)}
    for(let i=chips.length-1;i>=0;i--){const q=chips[i];q.t+=dt;q.v.y-=6*dt;q.c.position.addScaledVector(q.v,dt);if(q.c.position.y<.05){q.c.position.y=.05;q.v.set(0,0,0)}if(q.t>1.4){F.g.remove(q.c);chips.splice(i,1)}}
    /* fishing */
    rod.visible=K.mode==='fish'&&F.st!=='ice';
    if(F.st==='cast'&&now>F.biteAt){F.st='bite';F.biteEnd=now+4200;K.chime(1200,.12);say('fish_bite');log('a3dbite',{});ui2()}
    if(F.st==='bite'){bob.position.y=-.06+Math.abs(Math.sin(tm*14))*.1*-1+.02;if(now>F.biteEnd){F.st='cast';F.biteAt=now+1500+Math.random()*1500;bob.position.y=.02;ui2()}}
    else if(F.st==='cast')bob.position.y=.02+Math.sin(tm*2)*.01;
    if(line.visible){const tip=rod.localToWorld(V(0,1.6,0));F.g.worldToLocal(tip);const pa=lineG.attributes.position;pa.setXYZ(0,tip.x,tip.y,tip.z);pa.setXYZ(1,bob.position.x,bob.position.y+.1,bob.position.z);pa.needsUpdate=true}
    if(fishFly){/* P5c: out of the hole, flop flop on the ice, then up into the child's arms */const ms=now-fishFly.t0,sd=fishFly.side;fishM.userData.wag(ms*.04,.7);
      if(ms<450){const a=ms/450;fishM.position.set(sd*.7*a,Math.sin(a*Math.PI)*1.1+.05,.2*a);fishM.rotation.set(0,sd>0?0:Math.PI,Math.PI/2*(1-a)+a*.2)}
      else if(ms<1500){const a=(ms-450)/1050,hop=Math.abs(Math.sin(a*Math.PI*3))*(.32*(1-a)+.06);fishM.position.set(sd*.75+Math.sin(a*9)*.05,.13+hop,.2);fishM.rotation.set(Math.PI/2*Math.sign(Math.sin(a*Math.PI*3+.3))*.9,sd>0?0:Math.PI,Math.sin(a*20)*.25);fishFly.flops=Math.floor(a*3)+1}
      else{const a=Math.min(1,(ms-1500)/600);const to=F.g.worldToLocal(K.kid.position.clone().add(V(0,1.1,0)));const from=V(sd*.7,.1,.2);fishM.position.lerpVectors(from,to,a);fishM.position.y+=Math.sin(a*Math.PI)*1.1;fishM.rotation.set(0,Math.atan2(-(to.z-from.z),to.x-from.x),Math.sin(a*14)*.3);if(a>=1){fishFly=null;fishM.visible=false}}}
  });
  ui2();
  K.probes=Object.assign(K.probes||{},{
    places:()=>PL.map((p,i)=>{const r=pins[i].getBoundingClientRect();const s=K.scr(p.obj.getWorldPosition(V(0,0,0)).add(V(0,1,0)));return {id:p.id,pin:{x:r.left+r.width/2,y:r.top+r.height/2,vis:r.width>0&&pins[i].classList.contains('pin-on')},obj:s,dist:+K.kid.position.distanceTo(p.stand).toFixed(2)}}),
    fishShow:()=>{if(!fishM.visible) return null;const s=K.scr(fishM.getWorldPosition(V(0,0,0)));return {x:s.x,y:s.y,vis:s.vis,flops:fishFly&&fishFly.flops||0,isFish:!!fishM.userData.isFish}},
    fish:()=>({st:F.st,prog:+F.prog.toFixed(2),caught:F.caught,fish:C.fish,spot:K.scr(SPOT.clone().setY(.3)),done:bDone.classList.contains('on')}),
    bag:()=>Object.assign({},K.bag())});
}
