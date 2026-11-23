/* 3D sled ride. Feed the dogs (tap each bowl: visual, unlimited dog food, never blocks), then GO. Real terrain: valleys between ice ridges.
   Destination with a clear reason: the fish camp (fish flag, arrow) - load 3 fish, bring them home for the camp animals + coins (job).
   Steering matters: at the fork the right-hand valley is a dead end at an ice wall (thin ice slows you, dogs get tired); you must
   really turn around and drive back - no teleport. Another trip is always one tap away. Zero reading: icons + voice. */
import {makeFish} from './fish.js?v=9';
export function sledRide(K){
  const {THREE,say,log,me,save,el,btn,tap,ui,mat}=K;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const C=me.camp;C.trips=C.trips||0;
  /* ---------- route (metres; camp at origin, sled starts facing -z) */
  const TR={main:[[0,10],[0,-40],[8,-80],[5,-110]],good:[[5,-110],[-20,-140],[-45,-170],[-58,-186],[-82,-160],[-92,-110],[-76,-60],[-48,-24],[-20,4],[0,10]],bad:[[5,-110],[35,-140],[55,-168],[60,-184]]};
  const SEG=[];Object.values(TR).forEach(l=>{for(let i=0;i<l.length-1;i++)SEG.push([l[i][0],l[i][1],l[i+1][0],l[i+1][1]])});
  const D=V(-60,0,-188),HOME=V(-6,0,6),END=V(60,0,-184),FORK=V(5,0,-110);
  function dTrack(x,z){let m=1e9;for(const s of SEG){const dx=s[2]-s[0],dz=s[3]-s[1],L=dx*dx+dz*dz;let t=((x-s[0])*dx+(z-s[1])*dz)/L;t=Math.max(0,Math.min(1,t));const ex=s[0]+dx*t-x,ez=s[1]+dz*t-z;const d=ex*ex+ez*ez;if(d<m)m=d}return Math.sqrt(m)}
  const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  function H(x,z,d){d=d==null?dTrack(x,z):d;const dunes=Math.sin(x*.05)*Math.cos(z*.04)*1.3+Math.sin(x*.13+z*.07)*.45;return dunes*(.35+.65*sm(4,12,d))+sm(8,24,d)*(9+Math.sin(x*.07)*3+Math.cos(z*.05)*2)}
  /* ---------- scene */
  const SL=new THREE.Scene();K.scenes.push(SL);SL.fog=new THREE.Fog(K.skyC.clone(),60,190);const slSky=K.sky.clone();slSky.scale.setScalar(1.4);SL.add(slSky);K.slSky=slSky;
  const hemi=new THREE.HemisphereLight('#dbe9ff','#b9c6d8',1.15);SL.add(hemi);const sun=new THREE.DirectionalLight('#ffd9b0',2.1);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);const sc=sun.shadow.camera;sc.left=sc.bottom=-16;sc.right=sc.top=16;sc.near=1;sc.far=80;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;SL.add(sun);SL.add(sun.target);
  const SZ=360,SEGN=128;const g=new THREE.PlaneGeometry(SZ,SZ,SEGN,SEGN);g.rotateX(-Math.PI/2);g.translate(-40,0,-90);
  {const p=g.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=dTrack(x,z);p.setY(i,H(x,z,d));const tr=1-sm(3.5,6.5,d);const groove=tr*(.5+.5*Math.cos(d*2.6));const c=[1-.08*tr-.05*groove*tr,1-.05*tr-.04*groove*tr,1-.01*tr];col.set(c,i*3)}g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals()}
  const terr=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:K.T.snow,vertexColors:true,roughness:.92}));terr.receiveShadow=true;SL.add(terr);
  /* props: rocks, ice spikes, spruce on the ridges (instanced), flags along the good route, fork sign, dead-end ice wall + thin ice */
  const OB=[];let seed=11;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  function inst(geo,m,n,place){const im=new THREE.InstancedMesh(geo,m,n);im.castShadow=true;im.receiveShadow=true;const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=V(1,1,1);let k=0;for(let tries=0;tries<n*8&&k<n;tries++){const r=place();if(!r) continue;q.setFromEuler(new THREE.Euler(r.rx||0,r.ry||0,0));s.setScalar(r.s);m4.compose(V(r.x,r.y,r.z),q,s);im.setMatrixAt(k++,m4);if(r.r)OB.push([r.x,r.z,r.r])}im.count=k;SL.add(im);return im}
  const rock=new THREE.DodecahedronGeometry(1,0),rockM=new THREE.MeshStandardMaterial({color:'#b8c4d2',roughness:.9,flatShading:true});
  inst(rock,rockM,70,()=>{const x=-40+(rr()-.5)*SZ*.9,z=-90+(rr()-.5)*SZ*.9,d=dTrack(x,z);if(d<9||d>40) return null;const s=.8+rr()*2.2;return {x,z,y:H(x,z,d)+s*.3,s,ry:rr()*6,r:d<26?s*.9:0}});
  const spike=new THREE.ConeGeometry(1,1,5),iceM=new THREE.MeshStandardMaterial({color:'#cfe9fb',roughness:.25,metalness:.05,flatShading:true});
  inst(spike,iceM,50,()=>{const x=-40+(rr()-.5)*SZ*.9,z=-90+(rr()-.5)*SZ*.9,d=dTrack(x,z);if(d<11||d>45) return null;const s=1+rr()*2.5;return {x,z,y:H(x,z,d)+s*1.2,s,rx:(rr()-.5)*.3}});
  const tree=new THREE.ConeGeometry(1.4,4.5,7);tree.translate(0,2.6,0);const treeM=new THREE.MeshStandardMaterial({color:'#2f5d4a',roughness:.9,flatShading:true});
  inst(tree,treeM,90,()=>{const x=-40+(rr()-.5)*SZ*.9,z=-90+(rr()-.5)*SZ*.9,d=dTrack(x,z);if(d<10||d>38) return null;return {x,z,y:H(x,z,d)-.3,s:.7+rr()*.7,ry:rr()*6,r:d<24?1:0}});
  const flagTex=K.T.flag;const fpole=mat('#7a4b26'),fcloth=new THREE.MeshStandardMaterial({color:'#2e86c1',side:THREE.DoubleSide});
  function flagAt(x,z,c){const gq=new THREE.Group();gq.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.6,6),fpole),{castShadow:true}));gq.children[0].position.y=1.3;const f=new THREE.Mesh(new THREE.PlaneGeometry(.9,.6),c?new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide}):fcloth);f.position.set(.46,2.25,0);gq.add(f);gq.position.set(x,H(x,z),z);SL.add(gq);return gq}
  /* route flags: instanced (2 draw calls for all of them) */
  {const pts=[...TR.main,...TR.good],F=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<L;t+=26){const x=a[0]+(b[0]-a[0])*t/L,z=a[1]+(b[1]-a[1])*t/L;const nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;F.push([x+nx*5.2,z+nz*5.2])}}
   const pg=new THREE.CylinderGeometry(.06,.06,2.6,6);pg.translate(0,1.3,0);const cg=new THREE.PlaneGeometry(.9,.6);cg.translate(.46,2.25,0);const P=new THREE.InstancedMesh(pg,fpole,F.length),Cl=new THREE.InstancedMesh(cg,fcloth,F.length);const m4=new THREE.Matrix4();
   F.forEach((f,i)=>{m4.makeTranslation(f[0],H(f[0],f[1]),f[1]);P.setMatrixAt(i,m4);Cl.setMatrixAt(i,m4)});P.castShadow=true;SL.add(P);SL.add(Cl)}
  /* fish sign at the fork (points left, to the fish camp) and an ice-crack sign on the right */
  function signTex(draw){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#f4e3c8';x.fillRect(0,0,128,128);x.strokeStyle='#7a4b26';x.lineWidth=10;x.strokeRect(5,5,118,118);draw(x);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  const fishSign=signTex(x=>{x.fillStyle='#ff9a3c';x.beginPath();x.ellipse(58,64,34,20,0,0,7);x.fill();x.beginPath();x.moveTo(88,64);x.lineTo(112,44);x.lineTo(112,84);x.fill();x.fillStyle='#222';x.beginPath();x.arc(40,58,5,0,7);x.fill();x.strokeStyle='#2e7d4f';x.lineWidth=9;x.beginPath();x.moveTo(60,108);x.lineTo(22,108);x.lineTo(34,96);x.moveTo(22,108);x.lineTo(34,120);x.stroke()});
  const crackSign=signTex(x=>{x.strokeStyle='#c0392b';x.lineWidth=14;x.beginPath();x.moveTo(30,30);x.lineTo(98,98);x.moveTo(98,30);x.lineTo(30,98);x.stroke();x.strokeStyle='#5b8db8';x.lineWidth=4;x.beginPath();x.moveTo(64,10);x.lineTo(54,40);x.lineTo(72,66);x.lineTo(58,118);x.stroke()});
  function sign(x,z,tex,ry){const gq=new THREE.Group();gq.add(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.4,6),fpole));gq.children[0].position.y=1.2;const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,.1),[mat('#7a4b26'),mat('#7a4b26'),mat('#7a4b26'),mat('#7a4b26'),new THREE.MeshStandardMaterial({map:tex}),mat('#7a4b26')]);b.position.y=2.6;gq.add(b);gq.position.set(x,H(x,z),z);gq.rotation.y=ry;gq.traverse(o=>{if(o.isMesh)o.castShadow=true});SL.add(gq)}
  sign(-1.5,-98,fishSign,0);sign(11,-99,crackSign,0);
  /* dead end: ice wall + thin cracked ice */
  {const wallM=new THREE.MeshStandardMaterial({color:'#bfe3ff',roughness:.2,metalness:.05,flatShading:true,transparent:true,opacity:.95});for(let i=0;i<7;i++){const a=-1.1+i*.37,x=END.x+Math.sin(a)*9,z=END.z-Math.cos(a)*9+2;const m=new THREE.Mesh(new THREE.ConeGeometry(2.2,7+((i*7)%3)*2,5),wallM);m.position.set(x,H(x,z)+3,z);m.castShadow=true;SL.add(m);OB.push([x,z,2.3])}
   const ct=document.createElement('canvas');ct.width=ct.height=256;const x=ct.getContext('2d');x.fillStyle='#9fd0f2';x.fillRect(0,0,256,256);x.strokeStyle='#e8f6ff';x.lineWidth=3;for(let i=0;i<14;i++){x.beginPath();x.moveTo(128,128);let px=128,py=128;for(let k=0;k<5;k++){px+=Math.cos(i*.45+k*.3)*24+(k%2?8:-8);py+=Math.sin(i*.45+k*.3)*24;x.lineTo(px,py)}x.stroke()}
   const tt=new THREE.CanvasTexture(ct);tt.colorSpace=THREE.SRGBColorSpace;const thin=new THREE.Mesh(new THREE.CircleGeometry(10,32),new THREE.MeshStandardMaterial({map:tt,roughness:.15,metalness:.1,transparent:true,opacity:.9}));thin.rotation.x=-Math.PI/2;thin.position.set(54,H(54,-170)+.08,-170);SL.add(thin)}
  const THIN=V(54,0,-170);
  /* fish camp: hut, ice holes, rack with 3 fish */
  const rackFish=[];{const hut=new THREE.Group();hut.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(4,2.6,3.2),mat('#a8743f',{map:K.T.wood})),{castShadow:true}));hut.children[0].position.y=1.3;const roof=new THREE.Mesh(new THREE.ConeGeometry(3.4,1.6,4),mat('#7a3b2e'));roof.position.y=3.4;roof.rotation.y=Math.PI/4;roof.castShadow=true;hut.add(roof);hut.position.set(D.x-7,H(D.x-7,D.z-4),D.z-4);SL.add(hut);OB.push([D.x-7,D.z-4,2.6]);
   [[-2,5],[3,6]].forEach(q=>{const h=new THREE.Mesh(new THREE.CircleGeometry(.9,20),new THREE.MeshStandardMaterial({color:'#1d4f7a',roughness:.1}));h.rotation.x=-Math.PI/2;h.position.set(D.x+q[0],H(D.x+q[0],D.z+q[1])+.05,D.z+q[1]);SL.add(h)});
   const rack=new THREE.Group();const w=mat('#7a4b26');[-1.6,1.6].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.4,6),w);p.position.set(x,1.2,0);p.castShadow=true;rack.add(p)});const bar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.4,6),w);bar.rotation.z=Math.PI/2;bar.position.y=2.3;rack.add(bar);
   for(let i=0;i<3;i++){const f=new THREE.Group();const fm=makeFish(THREE,{scale:.9});fm.rotation.z=-Math.PI/2;f.add(fm);f.position.set(-1+i,1.6,0);f.userData.fish=i;f.traverse(o=>o.userData.fish=i);rack.add(f);rackFish.push(f)}
   rack.position.set(D.x+4,H(D.x+4,D.z-3),D.z-3);rack.rotation.y=.5;SL.add(rack)}
  /* ---------- sled, kid, dogs */
  const sled=new THREE.Group();{const w=mat('#a8743f',{map:K.T.wood});const bx=(a,b,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),w);m.position.set(x,y,z);m.castShadow=true;sled.add(m)};bx(1,.1,2.4,0,.45,0);[-.45,.45].forEach(x=>{bx(.08,.06,2.8,x,.06,0);[-.9,0,.9].forEach(z=>bx(.06,.4,.06,x,.25,z))});bx(1,.7,.08,0,.8,1.15);
   const load=new THREE.Group();load.position.set(0,.55,-.2);sled.add(load);sled.userData.load=load}
  SL.add(sled);const rider=K.makeKid();rider.scale.setScalar(.9);rider.position.set(0,.45,.55);rider.userData.legs.forEach(l=>l.rotation.x=-1.3);sled.add(rider);
  const dogs=[];const DC=[{c:'#7d838e'},{c:'#3b3f47'},{c:'#b07a4a'},{c:'#9aa0aa'}];
  DC.forEach((o,i)=>{const d=K.makeQuad({c:o.c,belly:'#f4f4f4',s:.85,tailUp:true});SL.add(d);dogs.push({g:d,off:[i%2?.55:-.55,i<2?5.4:3.6],fed:false,eat:0})});
  const ropeM=new THREE.LineBasicMaterial({color:'#5a3a22'});const rope=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0,0,0),V(0,0,0)]),ropeM);SL.add(rope);
  const bowls=dogs.map(()=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.32,.22,.18,14),mat('#c0392b',{roughness:.5}));b.castShadow=true;SL.add(b);return b});
  const kib=[];const kibG=new THREE.SphereGeometry(.07,6,5),kibM=mat('#8a5a32');
  /* ---------- state */
  const R={phase:'hitch',x:0,z:6,h:Math.PI,v:0,E:1,loaded:0,steer:0,t0:0,dist:0,wrong:false,thinT:0,trail:[],bumps:0,reward:null,deadT:0};
  function place(){sled.position.set(R.x,H(R.x,R.z),R.z);const fx=Math.sin(R.h),fz=Math.cos(R.h);const hf=H(R.x+fx*1.2,R.z+fz*1.2),hb=H(R.x-fx*1.2,R.z-fz*1.2);sled.rotation.set(0,R.h,0);sled.rotateX(-Math.atan2(hf-hb,2.4));
    dogs.forEach((d,i)=>{const lx=d.off[0],lz=d.off[1];const x=R.x+fx*lz+Math.cos(R.h)*lx,z=R.z+fz*lz-Math.sin(R.h)*lx;d.g.position.set(x,H(x,z),z);d.g.rotation.y=R.h;
      const bx=x+Math.cos(R.h)*(lx<0?-.9:.9)+fx*.3,bz=z-Math.sin(R.h)*(lx<0?-.9:.9)+fz*.3;bowls[i].position.set(bx,H(bx,bz)+.09,bz);bowls[i].visible=R.phase==='hitch'});
    const a=sled.position.clone().add(V(fx*1.3,.5,fz*1.3)),b=dogs[0].g.position.clone().lerp(dogs[1].g.position,.5).add(V(0,.5,0));rope.geometry.setFromPoints([a,b]);
    sun.position.set(R.x-14,40,R.z+10);sun.target.position.set(R.x,0,R.z)}
  /* ---------- UI */
  const hud=el('div','a3d-sled');ui.appendChild(hud);
  const go=btn('a3d-go','Go','<svg viewBox="0 0 64 48"><path d="M6 34h34l6-8M6 34l4 6h30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M44 22h14M52 14l8 8-8 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>');hud.appendChild(go);
  const stL=btn('a3d-steer l','Left','<svg viewBox="0 0 48 48"><path d="M30 8L12 24l18 16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'),stR=btn('a3d-steer r','Right','<svg viewBox="0 0 48 48"><path d="M18 8l18 16-18 16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');hud.appendChild(stL);hud.appendChild(stR);
  const arrow=el('div','a3d-arrow','<svg viewBox="0 0 48 48"><path d="M24 4l14 22H28v18h-8V26H10z" fill="#ffd65a" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg><span></span>');hud.appendChild(arrow);
  const paws=el('div','a3d-paws');hud.appendChild(paws);const fishL=el('div','a3d-load');hud.appendChild(fishL);
  const bowlBtns=dogs.map((d,i)=>{const b=btn('a3d-bowl','Feed dog','<svg viewBox="0 0 48 48"><path d="M6 22h36c0 10-8 18-18 18S6 32 6 22z" fill="#c0392b" stroke="#fff" stroke-width="3"/><ellipse cx="24" cy="22" rx="18" ry="5" fill="#5a3a22"/></svg>');b.dataset.dog=i;hud.appendChild(b);return b});
  const rew=el('div','a3d-rew');ui.appendChild(rew);const again=btn('a3d-again','Again',go.innerHTML),home=btn('a3d-tocamp','Camp','<svg viewBox="0 0 48 48"><path d="M24 6L4 40h40z" fill="#e67e22" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M20 40l4-12 4 12z" fill="#5a2a10"/></svg>');
  ['a3d-rewfish','a3d-rewbtns'].forEach(c=>rew.appendChild(el('div',c)));rew.lastChild.appendChild(again);rew.lastChild.appendChild(home);
  function renderPaws(){paws.innerHTML='';const n=Math.round(R.E*4);for(let i=0;i<4;i++)paws.appendChild(el('i',i<n?'on':''))}
  function renderLoad(){fishL.innerHTML='';for(let i=0;i<3;i++){const f=el('i',i<R.loaded?'on':'',K.ICON.fish);fishL.appendChild(f)}}
  bowlBtns.forEach((b,i)=>tap(b,()=>{const d=dogs[i];if(d.fed){say('full');return}d.fed=true;d.eat=performance.now();b.classList.add('done');
    for(let k=0;k<6;k++){const m=new THREE.Mesh(kibG,kibM);SL.add(m);kib.push({m,to:bowls[i].position.clone(),p0:sled.position.clone().add(V(0,1.4,0)),t0:performance.now()+k*60})}
    K.chime(700+i*90,.25);const n=dogs.filter(x=>x.fed).length;R.E=Math.min(1,.55+.45*n/4);renderPaws();say(n===4?'dogs_ready':'crunch'+(n%2?'':'2'),false);go.classList.toggle('ready',n===4);log('a3ddogfed',{dog:i,n})}));
  let holdL=false,holdR=false;
  function hold(b,set){b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();set(true);try{b.setPointerCapture(e.pointerId)}catch(_){}});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>set(false)))}
  hold(stL,v=>holdL=v);hold(stR,v=>holdR=v);
  const keys={};const kd=e=>{if(K.mode!=='sled') return;if(e.key==='ArrowLeft')holdL=e.type==='keydown';if(e.key==='ArrowRight')holdR=e.type==='keydown'};addEventListener('keydown',kd);addEventListener('keyup',kd);(K.disposers=K.disposers||[]).push(()=>{removeEventListener('keydown',kd);removeEventListener('keyup',kd)});
  function startTrip(){R.phase='hitch';R.x=0;R.z=6;R.h=Math.PI;R.v=0;R.loaded=0;R.wrong=false;R.trail=[];R.dist=0;R.bumps=0;R.reward=null;R.deadT=0;
    dogs.forEach(d=>d.fed=false);bowlBtns.forEach(b=>b.classList.remove('done'));R.E=.55;go.classList.remove('ready');rackFish.forEach(f=>f.visible=true);sled.userData.load.clear();renderPaws();renderLoad();rew.classList.remove('on');hud.dataset.phase='hitch';place();say('sled_feed');log('a3dsled',{phase:'hitch',trip:C.trips+1})}
  tap(go,()=>{if(R.phase!=='hitch') return;R.phase='ride';hud.dataset.phase='ride';R.t0=performance.now();if(dogs.some(d=>!d.fed))say('dogs_slow');else say('mush');K.chime(523,.2);setTimeout(()=>K.chime(784,.3),150);log('a3dsled',{phase:'ride',fed:dogs.filter(d=>d.fed).length,E:+R.E.toFixed(2)})});
  tap(again,()=>{startTrip()});tap(home,()=>{K.setMode('walk')});
  /* tap fish on the rack to load (counting) */
  function tapLoad(x,y){if(R.phase!=='load') return;const h=K.pick(x,y,rackFish.filter(f=>f.visible));if(!h.length) return;let o=h[0].object;const i=o.userData.fish;const f=rackFish[i];f.visible=false;R.loaded++;renderLoad();
    const m=makeFish(THREE,{scale:.6});m.rotation.set(Math.PI/2,Math.PI/2,0);m.position.set((R.loaded-2)*.3,.1,0);sled.userData.load.add(m);say('n'+R.loaded);K.chime(600+R.loaded*120,.25);log('a3dload',{n:R.loaded});
    if(R.loaded>=3){setTimeout(()=>{say('fish_home');R.phase='ride';hud.dataset.phase='ride'},900)}}
  /* ---------- mode */
  const cc={p:V(0,4,14),t:V(0,1,0)};
  K.modes.sled={
    enter(){hud.classList.add('on');startTrip();cc.p.set(R.x+6,3.5,R.z+5)},
    exit(){hud.classList.remove('on');rew.classList.remove('on');holdL=holdR=false},
    scene(){return SL},
    cam(c){c.fov=c.aspect<1?70:58},
    tap(x,y){tapLoad(x,y)},
    drag(dx){if(R.phase==='ride'){R.h-=dx*.004}},
    back(){K.setMode('walk')}};
  K.sledIco=go.innerHTML;
  /* ---------- simulation */
  let lastSay=0,arrowSaid=false;
  function blockedAt(x,z){const d=dTrack(x,z);if(d>20.5) return true;for(const o of OB){const dx=x-o[0],dz=z-o[1];if(dx*dx+dz*dz<(o[2]+.9)*(o[2]+.9)) return true}return false}
  K.updates.push((dtm,now)=>{if(K.mode!=='sled') return;slSky.position.copy(K.cam.position);const dt=Math.min(dtm,60)/1000;
    if(R.phase==='ride'){const st=(holdL?1:0)-(holdR?1:0);
      const d=dTrack(R.x,R.z);let terr=1-.62*sm(5,13,d);if(Math.hypot(R.x-THIN.x,R.z-THIN.z)<10){terr*=.45;R.thinT+=dt}
      const target=10*(.5+.5*R.E)*terr;R.v+=(target-R.v)*Math.min(1,dt*1.8);
      R.h+=st*(R.v>1.5?1.55:1.25)*dt;
      const fx=Math.sin(R.h),fz=Math.cos(R.h),step=R.v*dt;const nx=R.x+fx*step,nz=R.z+fz*step;
      if(blockedAt(nx,nz)){R.v=0;if(now-lastSay>2500){lastSay=now;K.chime(160,.3);if(Math.hypot(R.x-END.x,R.z-END.z)<26)say('turn_around');R.bumps++;log('a3dbump',{x:+R.x.toFixed(1),z:+R.z.toFixed(1)})}}
      else{R.x=nx;R.z=nz;R.dist+=step}
      R.E=Math.max(.2,R.E-dt*.0022);
      if(!R.wrong&&Math.hypot(R.x-END.x,R.z-END.z)<34){R.wrong=true;R.E=Math.max(.2,R.E-.15);say('wrong_way');log('a3dwrong',{t:Math.round((now-R.t0)/1000)})}
      if(!R.loaded&&Math.hypot(R.x-D.x,R.z-D.z)<11){R.phase='load';hud.dataset.phase='load';R.v=0;say('load_fish');log('a3dsled',{phase:'load',t:Math.round((now-R.t0)/1000)})}
      if(R.loaded>=3&&Math.hypot(R.x-HOME.x,R.z-HOME.z)<11){R.phase='done';hud.dataset.phase='done';R.v=0;const secs=Math.round((now-R.t0)/1000);C.trips++;C.fish+=3;save();K.fishN&&K.fishN();
        R.reward={coins:3,fish:3,secs,wrong:R.wrong,dist:Math.round(R.dist)};log('a3dtripdone',R.reward);rew.classList.add('on');const rf=rew.querySelector('.a3d-rewfish');rf.innerHTML='';for(let i=0;i<3;i++)setTimeout(()=>{rf.appendChild(el('i','',K.ICON.fish));say('n'+(i+1))},400+i*700);
        setTimeout(()=>{say('trip_done');K.earn(3,'sled_fish',{x:innerWidth/2,y:innerHeight*.4})},2600)}
      if(R.trail.length===0||now-R.trail[R.trail.length-1][2]>200){R.trail.push([+R.x.toFixed(2),+R.z.toFixed(2),Math.round(now)]);if(R.trail.length>2000)R.trail.shift()}
      if(Math.floor(now/1000)!==Math.floor((now-dtm)/1000))renderPaws()}
    place();
    /* dogs run / eat */
    const run=R.phase==='ride'&&R.v>.5,tm=now/1000;dogs.forEach((d,i)=>{const u=d.g.userData;const ph=tm*(run?14:2)+i;u.legs.forEach((l,j)=>l.rotation.x=run?Math.sin(ph+(j%2?Math.PI:0)+(j>1?Math.PI/2:0))*.7:0);u.tail.rotation.y=Math.sin(tm*6+i)*.4;
      if(R.phase==='hitch'&&d.eat&&now-d.eat<1600){u.head.position.y=.83-Math.abs(Math.sin((now-d.eat)/110))*.25;d.g.rotation.y=R.h+(d.off[0]<0?-1:1)*.9}else u.head.position.y=.83});
    for(let i=kib.length-1;i>=0;i--){const q=kib[i];const t=(now-q.t0)/450;if(t<0) continue;if(t>=1){SL.remove(q.m);kib.splice(i,1);continue}q.m.position.lerpVectors(q.p0,q.to,t);q.m.position.y+=Math.sin(t*Math.PI)*1}
    /* chase camera */
    const fx=Math.sin(R.h),fz=Math.cos(R.h);const pk=K.cam.aspect<1?1.5:1;let want,look;
    if(R.phase==='hitch'){want=V(R.x+Math.cos(R.h)*7*pk+fx*2,H(R.x,R.z)+3.2*pk,R.z-Math.sin(R.h)*7*pk+fz*2);look=V(R.x+fx*2.5,H(R.x,R.z)+.6,R.z+fz*2.5)}
    else if(R.phase==='load'){want=V(D.x+10,H(D.x+10,D.z+6)+4.5*pk,D.z+7);look=V(D.x+3,H(D.x,D.z)+1.2,D.z-3)}
    else{want=V(R.x-fx*8.5*pk,H(R.x-fx*8,R.z-fz*8)+4.6*pk+1.4,R.z-fz*8.5*pk);look=V(R.x+fx*5,H(R.x,R.z)+1.2,R.z+fz*5)}
    cc.p.lerp(want,Math.min(1,dt*3.5));cc.t.lerp(look,Math.min(1,dt*5));K.cam.position.copy(cc.p);K.cam.lookAt(cc.t);
    /* objective arrow (screen icon, rotates to the fish camp, then home) */
    const obj=R.loaded>=3?HOME:D;const ang=Math.atan2(obj.x-R.x,obj.z-R.z)-R.h;arrow.style.transform='translateX(-50%) rotate('+(-ang*180/Math.PI)+'deg)';arrow.dataset.obj=R.loaded>=3?'home':'fish';
    SL.fog.color.copy(K.S.fog.color)});
  K.probes=Object.assign(K.probes||{},{sled:()=>({phase:R.phase,x:R.x,z:R.z,h:R.h,v:R.v,E:R.E,loaded:R.loaded,wrong:R.wrong,dTrack:dTrack(R.x,R.z),dEnd:Math.hypot(R.x-END.x,R.z-END.z),dDest:Math.hypot(R.x-D.x,R.z-D.z),dHome:Math.hypot(R.x-HOME.x,R.z-HOME.z),fed:dogs.filter(d=>d.fed).length,bumps:R.bumps,reward:R.reward,trail:R.trail.slice(-1500),trips:C.trips,fish:C.fish}),
    sledRoute:()=>TR,rackFish:()=>rackFish.filter(f=>f.visible).map(f=>{const p=f.getWorldPosition(V(0,0,0));return K.scr(p)}),bowl:i=>{const b=bowlBtns[i].getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,vis:b.width>0}}});
  /* bowl buttons follow their dogs */
  K.updates.push(()=>{if(K.mode!=='sled'||R.phase!=='hitch') return;const W=K.wrap.clientWidth,Hh=K.wrap.clientHeight,m=W<500?44:54;const P=bowls.map(b=>{const s=K.scr(b.position.clone().add(V(0,.9,0)));return [Math.min(W-m,Math.max(m,s.x)),Math.min(Hh-m-140,Math.max(m+90,s.y))]});/* keep the 4 bowls on screen and apart */for(let it=0;it<4;it++)for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const dx=P[j][0]-P[i][0],dy=P[j][1]-P[i][1],d=Math.hypot(dx,dy)||1,need=2*m+6;if(d<need){const k=(need-d)/2/d;P[i][0]-=dx*k;P[i][1]-=dy*k;P[j][0]+=dx*k;P[j][1]+=dy*k}P.forEach(q=>{q[0]=Math.min(W-m,Math.max(m,q[0]))})}bowlBtns.forEach((b,i)=>{b.style.transform='translate('+P[i][0]+'px,'+P[i][1]+'px) translate(-50%,-50%)'})});
}
