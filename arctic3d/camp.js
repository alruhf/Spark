/* Arctic 3D camp hub: the child walks (tap the snow = walk there, drag = look), meets huskies, a seal and a fox, and can feed, pet and
   lead them. The fox photo game is played here in 3D. Coins only from jobs (feeding hungry animals, fox photos for the photo board).
   Zero reading: icons + voice. Save: me.camp {fish, photos, foxDone} inside sparkArctic3dV1. */
import {quadModel,sealModel,kidModel} from './models.js?v=10';import {makeFish,FISH_SVG} from './fish.js?v=9';
export function camp(K){
  const {THREE,S,cam,say,log,me,save,el,btn,tap,ui,mat}=K;
  K.start='walk';
  const C=me.camp=Object.assign({fish:3,foxDone:false,foxRuns:0,jobs:0},me.camp||{});
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const sph=(r,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);o.position.set(x,y,z);if(sx)o.scale.set(sx,sy,sz);o.castShadow=true;return o};
  const cyl=(a,b,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,12),m);o.position.set(x,y,z);o.castShadow=true;return o};
  const cone=(r,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.ConeGeometry(r,h,8),m);o.position.set(x,y,z);o.castShadow=true;return o};
  /* ---------- sound helpers (WebAudio, no files) */
  function chime(f,d){K.sfx&&0;try{const ac=K.ac||(K.ac=new (window.AudioContext||window.webkitAudioContext)());if(ac.state==='suspended')ac.resume();const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+(d||.3));o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+(d||.3)+.05)}catch(e){}}
  K.chime=chime;
  /* ---------- coins: jobs only (SparkEcon source 'job'), coins fly to the jar chip */
  K.earn=function(n,item,from){if(!(n>0)) return;try{K.opt.earn&&K.opt.earn(n,item)}catch(e){}C.jobs++;save();log('a3dearn',{n,item});
    const chip=document.querySelector('.a3d-coins');const to=chip?chip.getBoundingClientRect():{left:innerWidth-80,top:20,width:40,height:40};from=from||{x:innerWidth/2,y:innerHeight/2};
    for(let i=0;i<n;i++)setTimeout(()=>{const c=el('img','a3d-flycoin');c.src=K.IMG+'coin.webp';c.style.left=from.x+'px';c.style.top=from.y+'px';K.wrap.appendChild(c);requestAnimationFrame(()=>{c.style.left=(to.left+to.width/2)+'px';c.style.top=(to.top+to.height/2)+'px';c.style.transform='scale(.6)'});chime(880+i*110,.25);setTimeout(()=>{c.remove();K.coinN()},650)},i*260)};
  K.spend=function(n,item){let ok=false;try{ok=K.opt.spend?K.opt.spend(n,item):false}catch(e){}K.coinN();log('a3dspend',{n,item,ok});return ok};
  K.coins=()=>{try{return K.opt.coins?+K.opt.coins():0}catch(e){return 0}};
  /* ---------- the child */
  function makeKid(tr){const g0=kidModel();K.glbSwap&&K.glbSwap(g0,tr?'trader':'kid');return g0;const g=new THREE.Group(),P=mat('#d9473b',{roughness:.85}),W=mat('#f4efe6',{roughness:1}),Sk=mat('#f1c7a5'),D=mat('#2c3550'),Bt=mat('#5a3a22');
    const body=cyl(.32,.42,.85,P,0,.95,0);g.add(body);const hood=sph(.3,P,0,1.55,-.02);g.add(hood);const ring=new THREE.Mesh(new THREE.TorusGeometry(.22,.07,6,14),W);ring.position.set(0,1.55,.16);g.add(ring);
    g.add(sph(.19,Sk,0,1.55,.12));[-.07,.07].forEach(x=>g.add(sph(.03,mat('#222'),x,1.59,.29)));g.add(sph(.035,mat('#e98b7b'),0,1.52,.3));
    const legs=[-.13,.13].map(x=>{const p=new THREE.Group();p.position.set(x,.55,0);p.add(cyl(.11,.1,.5,D,0,-.25,0));p.add(sph(.13,Bt,0,-.5,.05,1,.7,1.4));g.add(p);return p});
    const arms=[-.4,.4].map(x=>{const p=new THREE.Group();p.position.set(x,1.25,0);p.add(cyl(.09,.08,.55,P,0,-.27,0));p.add(sph(.09,mat('#3a6fb0'),0,-.56,0));p.rotation.z=x<0?-.15:.15;g.add(p);return p});
    g.userData={legs,arms};return g}
  K.makeKid=makeKid;
  const kid=makeKid();kid.position.set(0,0,13.5);kid.rotation.y=Math.PI;S.add(kid);
  const goal={p:null,then:null};const ringM=new THREE.Mesh(new THREE.RingGeometry(.42,.66,32),new THREE.MeshBasicMaterial({color:'#ffd84a',transparent:true,opacity:.95,depthWrite:false}));ringM.rotation.x=-Math.PI/2;ringM.visible=false;S.add(ringM);
  /* ---------- animals (low-poly, animated) */
  function quad(o){const g0=quadModel(o);K.glbSwap&&K.glbSwap(g0,o.tip?'fox':'husky',o);return g0;const g=new THREE.Group(),B=mat(o.c,{roughness:.95}),L=mat(o.belly||o.c,{roughness:.95}),Dk=mat(o.dark||'#333');
    const body=sph(.42*o.s,B,0,.62*o.s,0,1,.85,1.6);g.add(body);g.add(sph(.36*o.s,L,0,.55*o.s,.1*o.s,.9,.7,1.3));
    const head=new THREE.Group();head.position.set(0,.98*o.s,.62*o.s);g.add(head);head.add(sph(.27*o.s,B,0,0,0));head.add(sph(.2*o.s,L,0,-.05*o.s,.12*o.s,1,.85,1));
    const sn=cone(.11*o.s,.32*o.s,L,0,-.07*o.s,.32*o.s);sn.rotation.x=Math.PI/2;head.add(sn);head.add(sph(.045*o.s,Dk,0,-.06*o.s,.48*o.s));
    [-.1,.1].forEach(x=>head.add(sph(.035*o.s,mat('#1b1b1b'),x*o.s,.07*o.s,.22*o.s)));[-.13,.13].forEach(x=>{const e=cone(.08*o.s,.22*o.s,B,x*o.s,.25*o.s,-.02);e.rotation.z=-x*1.2;head.add(e)});
    const legs=[[-.18,.32],[.18,.32],[-.18,-.32],[.18,-.32]].map(q=>{const p=new THREE.Group();p.position.set(q[0]*o.s,.5*o.s,q[1]*o.s);p.add(cyl(.07*o.s,.06*o.s,.5*o.s,o.legc?mat(o.legc):B,0,-.25*o.s,0));g.add(p);return p});
    const tail=new THREE.Group();tail.position.set(0,.75*o.s,-.6*o.s);g.add(tail);const tl=sph(.13*o.s,B,0,.1*o.s,-.25*o.s,1,1,o.tailL||2.4);tl.rotation.x=o.tailUp?-.9:.5;tail.add(tl);if(o.tip){tail.add(sph(.09*o.s,mat(o.tip),0,o.tailUp?.36*o.s:-.05*o.s,-.5*o.s))}
    g.userData={legs,tail,head};return g}
  function seal(){return sealModel();const g=new THREE.Group(),B=mat('#8a8e96',{roughness:.6}),Dk=mat('#222');const b=sph(.5,B,0,.38,0,1,.75,2);g.add(b);const head=new THREE.Group();head.position.set(0,.72,.8);g.add(head);head.add(sph(.32,B,0,0,0));head.add(sph(.15,mat('#a3a7ae'),0,-.08,.25,1.2,.8,1));
    [-.12,.12].forEach(x=>head.add(sph(.06,Dk,x,.07,.27)));head.add(sph(.05,Dk,0,-.04,.38));[-1,1].forEach(sd=>{const f=sph(.12,B,sd*.42,.18,.35,1.8,.35,1);f.rotation.z=sd*.5;g.add(f)});const tail=new THREE.Group();tail.position.set(0,.25,-.95);g.add(tail);tail.add(sph(.14,B,0,0,-.1,2.2,.3,1));
    g.userData={legs:[],tail,head,seal:true};return g}
  K.makeQuad=quad;
  const A=[];
  function addAnimal(id,kind,g,x,z,ry,extra){g.position.set(x,0,z);g.rotation.y=ry;S.add(g);const a=Object.assign({id,kind,g,home:V(x,0,z),hungry:kind!=='fox',follow:false,act:null,actT:0,wander:null,hungerT:0,pose:'idle'},extra||{});g.traverse(o=>{o.userData.animal=id});A.push(a);return a}
  addAnimal('husky1','husky',quad({c:'#7d838e',belly:'#f2f2f2',s:1,tailUp:true}),14.5,-3.5,-2.2);
  addAnimal('husky2','husky',quad({c:'#3b3f47',belly:'#f4f4f4',s:.95,tailUp:true}),16.2,-6,-2.6);
  addAnimal('husky3','husky',quad({c:'#b07a4a',belly:'#f6efe4',s:.9,tailUp:true}),12.8,-1.4,-1.8);
  /* ice hole + seal */
  {/* P5c (Tester phone: dark blob at the left edge = this hole): one group so the near-camera fade catches it, and lighter water */const hg=new THREE.Group();hg.name='sealHole';hg.position.set(-3,0,18.5);const h=new THREE.Mesh(new THREE.CircleGeometry(1.3,24),new THREE.MeshStandardMaterial({color:'#3f7fae',roughness:.12,metalness:.1}));h.rotation.x=-Math.PI/2;h.position.y=.03;hg.add(h);const r=new THREE.Mesh(new THREE.RingGeometry(1.3,1.7,24),new THREE.MeshStandardMaterial({color:'#e6f3ff',roughness:.4}));r.rotation.x=-Math.PI/2;r.position.y=.035;hg.add(r);S.add(hg);K.sealHole=hg}
  addAnimal('seal','seal',seal(),-.6,17.6,-1.4);
  /* fox den rocks + fox */
  {const rk=mat('#b9c6d3',{roughness:.9,flatShading:true});[[-17,6,1.4],[-18.6,4.2,1],[-15.6,3.6,.8]].forEach(q=>{const m=new THREE.Mesh(new THREE.DodecahedronGeometry(q[2],0),rk);m.position.set(q[0],q[2]*.5,q[1]);m.castShadow=m.receiveShadow=true;S.add(m)})}
  const fox=addAnimal('fox','fox',quad({c:'#e0782f',belly:'#fbf3ea',legc:'#2a2320',s:.8,tip:'#ffffff',tailL:3}),-15.5,6.8,1.2,{hungry:false});
  /* spark24: crisp paw prints on the snow so the trails read (the snow albedo marks were almost invisible) */
  {const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    const pad=(px,py,rx,ry,a)=>{x.save();x.translate(px,py);x.rotate(a||0);x.beginPath();x.ellipse(0,0,rx,ry,0,0,7);x.fill();x.restore()};
    x.fillStyle='rgba(28,40,58,.82)';pad(64,78,22,26,0);[[38,36],[52,24],[76,24],[90,36]].forEach(([px,py],i)=>pad(px,py,11,13,(i-1.5)*.12));
    x.fillStyle='rgba(18,26,36,.35)';pad(64,82,14,16,0);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
    const pm=new THREE.MeshStandardMaterial({map:tx,transparent:true,depthWrite:false,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
    const pg=new THREE.PlaneGeometry(.55,.65);pg.rotateX(-Math.PI/2);
    const trails=[[14.5,-3.5,12.5,-8],[16.2,-6,12.5,-8],[12.8,-1.4,8,-2],[8,2,2,8],[2,8,-2,16],[-.6,17.6,-3,18.5],[0,0,-8,4],[-8,4,-15,6.5],[4,-2,10,-6],[-1,12,4,6]];
    let sd=13;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    const hole=[-3,18.5];
    trails.forEach(([x0,z0,x1,z1])=>{
      const L=Math.hypot(x1-x0,z1-z0),n=Math.max(4,Math.round(L/.7));
      const ang=Math.atan2(x1-x0,z1-z0);
      for(let i=0;i<=n;i++){const u=i/n;const x=x0+(x1-x0)*u+(rr()-.5)*.28,z=z0+(z1-z0)*u+(rr()-.5)*.28;
        if(Math.hypot(x-hole[0],z-hole[1])<2.1)continue;
        const m=new THREE.Mesh(pg,pm);const side=(i%2?1:-1)*.11;
        const px=x+Math.cos(ang)*side,pz=z-Math.sin(ang)*side;
        m.position.set(px,.02,pz);m.rotation.y=ang+(rr()-.5)*.2;m.receiveShadow=true;S.add(m)}
    });
  }
  /* camp sled (the trip starts here) is in the base scene at (12.5,-8); dog bowl sits next to it (sled.js uses it) */
  /* ---------- action bubble (icons only) */
  const ICON={fish:FISH_SVG,
    pet:'<svg viewBox="0 0 48 48"><path d="M12 26V14a3 3 0 016 0v8V10a3 3 0 016 0v12V12a3 3 0 016 0v12-6a3 3 0 016 0v12c0 8-6 14-14 14s-12-4-14-10l-4-8a3 3 0 015-3z" fill="#f6d2b8" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    follow:'<svg viewBox="0 0 48 48"><g fill="#fff"><ellipse cx="16" cy="30" rx="6" ry="7"/><circle cx="9" cy="20" r="3"/><circle cx="14" cy="15" r="3"/><circle cx="20" cy="15" r="3"/><circle cx="25" cy="20" r="3"/><ellipse cx="34" cy="20" rx="5" ry="6" opacity=".7"/></g></svg>',
    stay:'<svg viewBox="0 0 48 48"><rect x="11" y="11" width="26" height="26" rx="6" fill="#fff"/></svg>',
    camera:'<img alt="" src="'+K.IMG+'camera.webp">'};
  K.ICON=ICON;
  const bub=el('div','a3d-bub');ui.appendChild(bub);let bubFor=null;
  const bFeed=btn('a3d-act feed','Feed',ICON.fish),bPet=btn('a3d-act pet','Pet',ICON.pet),bFol=btn('a3d-act follow','Follow me',ICON.follow),bCam=btn('a3d-act camera','Take photos',ICON.camera);[bFeed,bPet,bFol,bCam].forEach(b=>bub.appendChild(b));
  function openBub(a){bubFor=a;bub.classList.add('on');bFeed.style.display=a.kind==='fox'?'none':'';bCam.style.display=a.kind==='fox'?'':'none';bPet.style.display=a.kind==='fox'?'none':'';bFol.innerHTML=a.follow?ICON.stay:ICON.follow;bFeed.classList.toggle('empty',C.fish<=0);log('a3dbub',{a:a.id})}
  function closeBub(){if(bubFor){bubFor.stayT=performance.now()+1500;bubFor.frozen=false}bubFor=null;bub.classList.remove('on')}
  /* fish counter chip */
  const fishChip=el('div','a3d-fishchip',ICON.fish+'<b></b>');ui.appendChild(fishChip);const fishN=()=>{fishChip.querySelector('b').textContent=C.fish};fishN();K.fishN=fishN;
  const hearts=[];function heart(p){const h=el('div','a3d-heart','\u2665');K.wrap.appendChild(h);hearts.push({h,p:p.clone(),t0:performance.now()})}
  const FACT={husky:['f_husky1','f_husky2','f_husky3'],seal:['f_seal1','f_seal2'],fox:['f_fox1','f_fox2']};const factI={};
  function fact(kind){const l=FACT[kind];factI[kind]=((factI[kind]??-1)+1)%l.length;say(l[factI[kind]])}
  /* flying fish (visual feed) */
  const flyers=[];const fishGeo=new THREE.SphereGeometry(.12,10,8);const fishM=mat('#ff9a3c',{roughness:.5});
  tap(bFeed,()=>{const a=bubFor;if(!a) return;if(C.fish<=0){say('nofish');bFeed.classList.add('shake');setTimeout(()=>bFeed.classList.remove('shake'),500);log('a3dfeed',{a:a.id,ok:false,why:'nofish'});return}
    if(!a.hungry){/* P6K (Tester): a full animal doesn't take the fish (feeding = 1 coin when hungry; never a lost fish) */say('full');a.act='happy';a.actT=performance.now();heart(a.g.position.clone().add(V(0,1.6,0)));log('a3dfeed',{a:a.id,ok:false,why:'full'});return}
    C.fish--;fishN();save();const f=makeFish(THREE,{scale:.6});S.add(f);flyers.push({f,a,p0:kid.position.clone().add(V(0,1.2,0)),t0:performance.now()});chime(660,.2);log('a3dfeed',{a:a.id,ok:true,fish:C.fish})});
  function fed(a){a.act='eat';a.actT=performance.now();heart(a.g.position.clone().add(V(0,1.6,0)));chime(990,.3);
    if(a.hungry){a.hungry=false;a.hungerT=0;say('yum');setTimeout(()=>{K.earn(1,'feed_'+a.kind,K.scr(a.g.position.clone().add(V(0,1.4,0))))},900)}else say('full');log('a3dfed',{a:a.id})}
  tap(bPet,()=>{const a=bubFor;if(!a) return;a.act='happy';a.actT=performance.now();for(let i=0;i<3;i++)setTimeout(()=>heart(a.g.position.clone().add(V((Math.random()-.5)*.6,1.5,0))),i*200);chime(740,.3);setTimeout(()=>fact(a.kind),300);log('a3dpet',{a:a.id})});
  tap(bFol,()=>{const a=bubFor;if(!a) return;const on=!a.follow;A.forEach(x=>x.follow=false);a.follow=on;bFol.innerHTML=on?ICON.stay:ICON.follow;say(on?'follow':'stay');log('a3dfollow',{a:a.id,on})});
  tap(bCam,()=>{closeBub();K.setMode('photo')});
  /* ---------- hub bar (walk mode) */
  const hub=el('div','a3d-hub');ui.appendChild(hub);
  K.hubAdd=(id,label,ico,fn)=>{const b=btn('a3d-h',label,ico);b.dataset.go=id;hub.appendChild(b);tap(b,fn);return b};
  K.hubAdd('build','Build',K.ICO.snow,()=>{K.setMode('build');say('build',true)});
  /* ---------- walk mode */
  const wc={yaw:Math.PI*0+.0,yawT:0,pitch:.42,dist:8.5};
  const steps=el('div','a3d-steps','<svg viewBox="0 0 48 48"><ellipse cx="16" cy="30" rx="6" ry="9" fill="#fff"/><ellipse cx="32" cy="18" rx="6" ry="9" fill="#fff"/></svg>');ui.appendChild(steps);
  /* P6C: tap ripple on pins / paw bubbles / place icons so a tap always shows it was heard */
  K.wrap.addEventListener('pointerdown',e=>{const t=e.target.closest&&e.target.closest('.a3d-pin,.a3d-act,.a3d-edge,.a3d-bub button');if(!t)return;const r=K.wrap.getBoundingClientRect();const rp=el('i','a3d-ripple');rp.style.left=(e.clientX-r.left)+'px';rp.style.top=(e.clientY-r.top)+'px';K.wrap.appendChild(rp);setTimeout(()=>rp.remove(),650)},true);
  function walkTo(p,then){goal.side=0;goal.stuck=0;p=p.clone();(K.OBS||[]).forEach(o=>{const dx=p.x-o[0],dz=p.z-o[1],d=Math.hypot(dx,dz),m=o[2]+.5;if(d<m){p.x=o[0]+dx/(d||1e-3)*m;p.z=o[1]+dz/(d||1e-3)*m}});goal.p=p.setY(0);goal.then=then||null;ringM.position.set(goal.p.x,.05,goal.p.z);ringM.visible=true;ringM.scale.setScalar(1);log('a3dwalk',{x:+p.x.toFixed(1),z:+p.z.toFixed(1)})}
  /* P5b: walking animals always face where they are actually going (incl. being nudged apart), turning smoothly */
  K.updates.push(dtm=>{const dt=Math.min(dtm,80)/1000;if(!dt)return;A.forEach(a=>{const g=a.g;if(!a._lp){a._lp=g.position.clone();return}const dx=g.position.x-a._lp.x,dz=g.position.z-a._lp.z;a._lp.copy(g.position);const sp=Math.hypot(dx,dz)/dt;a._vx=(a._vx||0)*.6+dx*.4;a._vz=(a._vz||0)*.6+dz*.4;if(sp>.35&&Math.hypot(a._vx,a._vz)>1e-4){const ry=Math.atan2(a._vx,a._vz);let dr=ry-g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));g.rotation.y+=dr*Math.min(1,dt*12)}})});
  K.walkTo=walkTo;K.kid=kid;K.animals=A;K.stopFollow=()=>A.forEach(x=>{x.follow=false;x.wander=null});
  function approach(a){const dir=kid.position.clone().sub(a.g.position).setY(0);const L=dir.length()||1;const stop=a.g.position.clone().addScaledVector(dir,Math.min(L,2.2)/L);closeBub();K._approach=a;/* P6F (Tester): the animal waits for the kid, and arrival ALWAYS shows the choices + reaction (even if the walk ends early / far approach) */a.wander=null;a.stayT=performance.now()+1e9;a.frozen=true;/* P6K: frozen from paw tap until the visit ends */let done=false,lp=kid.position.clone(),still=0;const iv=setInterval(()=>{if(done||K._approach!==a){clearInterval(iv);return}const mv=kid.position.distanceTo(lp);lp.copy(kid.position);still=mv<.02?still+1:0;const d=kid.position.distanceTo(a.g.position);if(d<3.2||(still>=4&&d<9)){arrive()}else if(still>=4){walkTo(stop,arrive);still=0}},300);setTimeout(()=>{if(!done&&K._approach===a)arrive()},25000);walkTo(stop,()=>arrive());function arrive(){if(done)return;done=true;clearInterval(iv);if(K.stopWalk)K.stopWalk();K._approach=null;/* face the animal: camera swings behind the child (shortest turn) */{let y=Math.atan2(stop.x-a.g.position.x,stop.z-a.g.position.z);y=y+.55;/* P6D: a bit to the side so the kid doesn't hide the animal */y=wc.yaw+Math.atan2(Math.sin(y-wc.yaw),Math.cos(y-wc.yaw));wc.yawT=y}a.wander=null;a.stayT=performance.now()+1e9;a.act='happy';a.actT=performance.now();heart(a.g.position.clone().add(V(0,1.5,0)));openBub(a);bub.classList.remove('pop');void bub.offsetWidth;bub.classList.add('pop');kid.rotation.set(0,Math.atan2(a.g.position.x-kid.position.x,a.g.position.z-kid.position.z),0);if(a.kind!=='fox'&&a.hungry)say('hungry_'+(a.kind==='seal'?'seal':'dog'));else if(a.kind==='fox')say('fox_hi')}}
  /* phone: an animal out of view gets an edge chip (its colour + paw); tap it to walk there */
  const EDGE={husky:'#7d838e',seal:'#4a5560',fox:'#e07a2e'};const edges={};
  Object.keys(EDGE).forEach(k=>{const b=K.btn('a3d-edge','',`<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="${EDGE[k]}"/><g fill="#fff"><ellipse cx="24" cy="30" rx="7" ry="6"/><circle cx="15" cy="21" r="3.5"/><circle cx="21" cy="15" r="3.5"/><circle cx="28" cy="15" r="3.5"/><circle cx="34" cy="21" r="3.5"/></g></svg>`);b.dataset.kind=k;K.wrap.appendChild(b);edges[k]=b;const go=()=>{const a=b._a;if(!a||performance.now()-(b._t||0)<600)return;b._t=performance.now();closeBub();a.wander=null;a.stayT=performance.now()+30000;b.style.display='none';approach(a)};/* P6G (Tester): react on press (the paw moves with the animal, a click could miss it) */b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();go()});K.tap(b,go)});
  K.updates.push(()=>{const on=K.mode==='walk';const W=K.wrap.clientWidth,Hh=K.wrap.clientHeight;Object.keys(EDGE).forEach(k=>{const b=edges[k];if(!on){b.style.display='none';b._xy=null;return}
    /* P6E (Tester/Allen): a small paw floats over an animal that is ON screen, from farther away - never pinned to screen edges */
    let best=null,bd=1e9;A.forEach(a=>{if(a.kind!==k||a.follow||bubFor===a)return;/* spark19 (Tester: a paw pin floated over empty snow): no paw over an animal the near-camera rule has hidden */if(!a.g.visible||a.g.userData._nearHid)return;const d=kid.position.distanceTo(a.g.position);if(d<3.5||d>32)return;const s=K.scr(a.g.position.clone().add(V(0,a.kind==='seal'?1.3:1.6,0)));if(!(s.vis&&s.x>34&&s.x<W-34&&s.y>70&&s.y<Hh-130))return;/* never cover a place (fish hole, trader...) or its button: a paw there would steal the tap */if((K.places||[]).some(q=>{const w=new THREE.Vector3();q.obj.getWorldPosition(w);const t=K.scr(w.add(V(0,1,0)));return t.vis&&Math.hypot(t.x-s.x,t.y-s.y)<90}))return;if([...K.wrap.querySelectorAll('.a3d-pin.pin-on')].some(e=>{const r=e.getBoundingClientRect(),o=K.wrap.getBoundingClientRect();return Math.hypot(r.left+r.width/2-o.left-s.x,r.top+r.height/2-o.top-s.y)<75}))return;if(d<bd){bd=d;best={a,s}}});
    if(best){const kq=K.scr(kid.position.clone().add(V(0,1.1,0)));if(Math.abs(kq.x-best.s.x)<60&&Math.abs(kq.y-best.s.y)<110)best=null}
    if(best){const sr=K.spk&&K.spk.getBoundingClientRect(),wr=K.wrap.getBoundingClientRect();if(sr&&sr.width&&best.s.x>sr.left-wr.left-30&&best.s.x<sr.right-wr.left+30&&best.s.y>sr.top-wr.top-30&&best.s.y<sr.bottom-wr.top+30)best=null}
    const now=performance.now();if(!best&&b._a&&b._xy&&now-(b._seen||0)<1500&&b._a!==bubFor&&K._approach!==b._a&&b._a.g.visible&&!b._a.g.userData._nearHid){/* P6G: keep the paw on the same animal for a moment (no flicker) if it is still on screen */const s=K.scr(b._a.g.position.clone().add(V(0,b._a.kind==='seal'?1.3:1.6,0)));if(s.vis&&s.x>20&&s.x<W-20&&s.y>40&&s.y<Hh-100)best={a:b._a,s}}else if(best)b._seen=now;
    if(best&&b._a&&best.a!==b._a&&now-(b._seen0||0)<1500){const s=K.scr(b._a.g.position.clone().add(V(0,b._a.kind==='seal'?1.3:1.6,0)));if(s.vis&&s.x>34&&s.x<W-34)best={a:b._a,s}}
    if(!best||K._approach===best.a){b.style.display='none';b._xy=null;b._a=null;return}if(best.a!==b._a){b._seen0=now;b._xy=null}b._a=best.a;b.style.display='block';const q=b._xy?[b._xy[0]+(best.s.x-b._xy[0])*.35,b._xy[1]+(best.s.y-b._xy[1])*.35]:[best.s.x,best.s.y];b._xy=q;b.style.transform='translate('+q[0]+'px,'+q[1]+'px) translate(-50%,-100%)'})});
  function animalAt(x,y){const objs=[];A.forEach(a=>objs.push(a.g));const h=K.pick(x,y,objs);if(!h.length){/* forgiving tap: an animal within ~48 px on screen counts */let best=null,bd=48;A.forEach(a=>{const q=K.scr(a.g.position.clone().add(V(0,.6,0)));if(!q.vis) return;const d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=a}});return best}const id=h[0].object.userData.animal;return A.find(a=>a.id===id)}
  function blocked(x,z){const i=Math.round(x+K.HALF),k=Math.round(z+K.HALF);return i>=0&&k>=0&&i<K.N&&k<K.N&&K.B.has(K.key(i,0,k))}
  K.modes.walk={turn:true,
    enter(){hub.style.display='';fishChip.style.display='';kid.visible=true;if(K.grid)K.grid.visible=false;if(K.lookUp){K.lookUp=false;wc.pitch=-.1;wc.dist=Math.max(wc.dist,11);wc.yaw=wc.yawT=0}if(!K._walked){K._walked=1;setTimeout(()=>say('walk',true),700)}},
    exit(m){hub.style.display='none';closeBub();ringM.visible=false;if(K.grid)K.grid.visible=m==='build'},
    cam(c){const pk=c.aspect<1?1.45:1;const t=kid.position.clone().add(V(0,1.1,0));const d=wc.dist*pk;c.fov=55;const pp=Math.max(wc.pitch,.12);c.position.set(t.x+Math.sin(wc.yaw)*Math.cos(pp)*d,t.y+Math.sin(pp)*d,t.z+Math.cos(wc.yaw)*Math.cos(pp)*d);/* drag up below the lowest camera angle = look up at the sky */c.lookAt(t.clone().add(V(0,Math.max(0,.12-wc.pitch)*11,0)))},
    drag(dx,dy){wc.yaw-=dx*.006;wc.yawT=wc.yaw;wc.pitch=Math.max(-.55,Math.min(1.2,wc.pitch+dy*.004));K.placeCam()},
    zoom(f){wc.dist=Math.max(4,Math.min(20,wc.dist*f));K.placeCam()},
    turn(d){wc.yawT+=d*Math.PI/4},
    tap(x,y){const a=animalAt(x,y);if(a){approach(a);return}if(K.placeAt){const pl=K.placeAt(x,y);if(pl){closeBub();pl.go();return}}
      const c=K.cellAt(x,y);if(c&&c.hit){if(c.door&&K.A.ready){const d=K.A.door,dw=K.wpos(d.x,0,d.z),iw=K.wpos(d.ix,0,d.iz),out=dw.clone().sub(iw).setY(0).normalize();walkTo(dw.clone().addScaledVector(out,1.4),()=>K.goInside());closeBub();return}}
      const h=K.pick(x,y,[K.ground]);if(h.length){closeBub();const p=h[0].point;if(p.length()<60)walkTo(p)}}};
  /* ---------- photo mode: fox poses, child presses the shutter on a NEW pose (3 photos) */
  const pv=el('div','a3d-photo');ui.appendChild(pv);pv.innerHTML='<div class="a3d-vf"></div><div class="a3d-strip"><i></i><i></i><i></i></div>';const shut=btn('a3d-shutter','Take a photo',ICON.camera);pv.appendChild(shut);
  const ph={shots:[],poses:new Set(),cur:'peek',nextT:0,newT:0};
  const POSES=['peek','sit','pounce','curl'];
  K.modes.photo={
    enter(){pv.classList.add('on');ph.shots=[];ph.poses=new Set();[...pv.querySelectorAll('.a3d-strip i')].forEach(i=>{i.style.backgroundImage='';i.classList.remove('on')});ph.cur='peek';ph.nextT=performance.now()+2500;ph.newT=performance.now();fox.g.position.copy(fox.home);fox.follow=false;kid.visible=false;say('photo_start');log('a3dphoto',{start:true})},
    exit(){pv.classList.remove('on');fox.pose='idle';kid.visible=true},
    cam(c){c.fov=40;const t=fox.g.position.clone().add(V(0,.6,0));const from=kid.position.clone().add(V(0,1.4,0));const dir=from.clone().sub(t).setY(0).normalize();c.position.copy(t).addScaledVector(dir,4.6).setY(1.5);c.lookAt(t)},
    back(){K.setMode('walk')}};
  tap(shut,()=>{const now=performance.now();chime(1200,.08);pv.classList.add('flash');setTimeout(()=>pv.classList.remove('flash'),180);
    const fresh=!ph.poses.has(ph.cur)&&ph.cur!=='idle';if(!fresh){say('photo_same');log('a3dshot',{pose:ph.cur,ok:false});return}
    K.R.render(K.S,cam);let url='';try{const c2=document.createElement('canvas');c2.width=160;c2.height=110;c2.getContext('2d').drawImage(K.cv,0,0,160,110);url=c2.toDataURL('image/jpeg',.7)}catch(e){}
    ph.poses.add(ph.cur);const slot=pv.querySelectorAll('.a3d-strip i')[ph.shots.length];ph.shots.push(ph.cur);if(slot){slot.style.backgroundImage='url('+url+')';slot.classList.add('on')}say('photo_ok');log('a3dshot',{pose:ph.cur,ok:true,n:ph.shots.length});
    if(ph.shots.length>=3){C.foxRuns++;const first=!C.foxDone;C.foxDone=true;me.owned=me.owned||{};me.owned.foxpic=1;if(first){const bg=K.bag();bg.foxpic=(bg.foxpic|0)+1}save();K.refreshTray&&setTimeout(()=>{try{K.refreshTray()}catch(e){}},50);
      setTimeout(()=>{say('photo_done');K.earn(2,'fox_photos',{x:innerWidth/2,y:innerHeight/2});log('a3dfoxdone',{first})},700);setTimeout(()=>{if(K.mode==='photo')K.setMode('walk')},3600)}});
  /* ---------- per-frame */
  let tm=0;
  K.updates.push((dt,now)=>{dt=Math.min(dt,80)/1000;tm+=dt;if(K.skyU)K.skyU.time.value=tm;
    /* walking */
    const kd=kid.userData;let moving=false;
    /* P6C: walking feedback - pulsing target ring + footsteps over the kid while auto-walking */
    if(ringM.visible){const ps=1+.18*Math.sin(tm*8);ringM.scale.set(ps,ps,ps)}
    {const on=!!goal.p&&K.mode==='walk';steps.classList.toggle('on',on);if(on){const q=K.scr(kid.position.clone().add(V(0,2.25,0)));steps.style.transform='translate('+q.x+'px,'+q.y+'px) translate(-50%,-100%)'}}
    if(goal.p&&K.mode==='walk'){const d=goal.p.clone().sub(kid.position).setY(0),L=d.length();if(L<.12){kid.position.copy(goal.p);const th=goal.then;goal.p=null;ringM.visible=false;if(th)th()}
      else{let st=Math.min(L,3.4*dt);{/* P6D: turn in place first on big direction changes - never walk sideways/backwards */if(kid.rotation.x||kid.rotation.z){const f=V(0,0,1).applyQuaternion(kid.quaternion);kid.rotation.set(0,Math.atan2(f.x,f.z),0)}let d0=Math.atan2(d.x,d.z)-kid.rotation.y;d0=Math.abs(Math.atan2(Math.sin(d0),Math.cos(d0)));if(d0>.5)st=0}const nx=kid.position.x+d.x/L*st,nz=kid.position.z+d.z/L*st;let dx=d.x/L,dz=d.z/L;/* P6K: keep a slide direction for a moment (no left-right flicker along the stall/igloo -> kid faces where it walks) */if(goal.sl&&performance.now()<goal.sl.t&&!blocked(kid.position.x+goal.sl.x*st,kid.position.z+goal.sl.z*st)&&(goal.sl.x*dx+goal.sl.z*dz)>-.2){kid.position.x+=goal.sl.x*st;kid.position.z+=goal.sl.z*st;moving=true;dx=goal.sl.x;dz=goal.sl.z}else if(blocked(nx,nz)){/* slide around igloo walls: try turning the step left/right */let ok=false;const pref=goal.side||1;for(const an of [.6,1.1,1.57,2.1]){for(const sd of [pref,-pref]){const c=Math.cos(an*sd),sn=Math.sin(an*sd);const ex=dx*c-dz*sn,ez=dx*sn+dz*c;if(!blocked(kid.position.x+ex*st,kid.position.z+ez*st)){dx=ex;dz=ez;goal.side=sd;ok=true;goal.sl={x:ex,z:ez,t:performance.now()+350};break}}if(ok)break}goal.stuck=(goal.stuck||0)+(ok?dt*.3:dt);if(!ok||goal.stuck>6){goal.p=null;goal.stuck=0;ringM.visible=false}else{kid.position.x+=dx*st;kid.position.z+=dz*st;moving=true}}else{kid.position.x=nx;kid.position.z=nz;moving=true;goal.stuck=Math.max(0,(goal.stuck||0)-dt*.1)}{/* P5b: turn smoothly to face the way the kid is actually stepping (incl. sliding round igloo walls) */const ry=Math.atan2(dx,dz);if(kid.rotation.x||kid.rotation.z){const f=V(0,0,1).applyQuaternion(kid.quaternion);kid.rotation.set(0,Math.atan2(f.x,f.z),0)}let dr=ry-kid.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));kid.rotation.y+=dr*Math.min(1,dt*14)}}
      if(K.mode==='walk')K.placeCam()}
    const sw=moving?Math.sin(tm*11)*.6:0;kd.legs[0].rotation.x=sw;kd.legs[1].rotation.x=-sw;kd.arms[0].rotation.x=-sw*.8;kd.arms[1].rotation.x=sw*.8;kid.position.y=moving?Math.abs(Math.sin(tm*11))*.05:0;
    if(ringM.visible){ringM.scale.setScalar(1+.15*Math.sin(tm*6))}
    if(Math.abs(wc.yawT-wc.yaw)>1e-3&&K.mode==='walk'){wc.yaw+=(wc.yawT-wc.yaw)*Math.min(1,dt*10);K.placeCam()}
    /* animals */
    A.forEach(a=>{const g=a.g,u=g.userData;let mv=false;a.hungerT+=dt;if(!a.hungry&&a.kind!=='fox'&&a.hungerT>150){a.hungry=true}
      let tgt=null;if(a.follow){const back=kid.position.clone().add(V(Math.sin(kid.rotation.y+Math.PI)*1.6+(a.kind==='seal'?.8:0),0,Math.cos(kid.rotation.y+Math.PI)*1.6));if(back.distanceTo(g.position)>.6)tgt=back}
      else if(!(a===fox&&K.mode==='photo')&&bubFor!==a&&!(a.stayT>now)){if(!a.wander||now>a.wander.t){a.wander={t:now+3000+Math.random()*4000,p:a.home.clone().add(V((Math.random()-.5)*(a.kind==='seal'?1.5:4),0,(Math.random()-.5)*(a.kind==='seal'?1.5:4)))}}if(a.wander.p.distanceTo(g.position)>.3&&a.act==null&&bubFor!==a&&K._approach!==a)tgt=a.wander.p}
      if(tgt){const d=tgt.clone().sub(g.position).setY(0),L=d.length();const sp=(a.follow?3.6:1.1)*(a.kind==='seal'?.6:1);const st=Math.min(L,sp*dt);if(!blocked(g.position.x+d.x/L*st,g.position.z+d.z/L*st)){g.position.addScaledVector(d,st/L);mv=true}const ry=Math.atan2(d.x,d.z);let dr=ry-g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));g.rotation.y+=dr*Math.min(1,dt*10)}
      else if(bubFor===a){const ry=Math.atan2(kid.position.x-g.position.x,kid.position.z-g.position.z);let dr=ry-g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));g.rotation.y+=dr*Math.min(1,dt*4)}
      const stepD=a._lp?Math.hypot(g.position.x-a._lp.x,g.position.z-a._lp.z):0;a._lp=(a._lp||g.position.clone()).copy(g.position);a.spd=(a.spd||0)*.8+(stepD/Math.max(dt,1e-3))*.2;const walking=a.spd>.15;a.gait=(a.gait||0)+stepD*(a.kind==='fox'?7.5:a.kind==='seal'?3:5.5);a.amp=(a.amp||0)+((walking?1:0)-(a.amp||0))*Math.min(1,dt*8);u.legs.forEach((l,i)=>l.rotation.x=Math.sin(a.gait+((i===0||i===3)?0:Math.PI))*.75*a.amp);u._bob=Math.abs(Math.sin(a.gait))*(a.kind==='fox'?.07:.05)*a.amp;if(u.seal)u._bob=Math.abs(Math.sin(a.gait))*.12*a.amp;
      if(u.tail)u.tail.rotation.y=Math.sin(tm*(a.act==='happy'?18:4)+a.home.z)*(a.act==='happy'?.8:.3);
      let hy=0,by=0;if(a.act==='eat'){const t=(now-a.actT)/1000;hy=-Math.abs(Math.sin(t*9))*.25;if(t>1.6)a.act=null}else if(a.act==='happy'){const t=(now-a.actT)/1000;by=Math.abs(Math.sin(t*7))*.35;if(t>1.8)a.act=null}
      if(u.seal&&!mv)hy+=Math.sin(tm*1.5)*.05;u.head.position.y=(u.seal?.72:(.98*(a.kind==='fox'?.8:a.id==='husky2'?.95:a.id==='husky3'?.9:1)))+hy+(u._bob||0)*.5;g.position.y=by+(u._bob||0);
      /* fox poses in photo mode */
      if(a===fox&&K.mode==='photo'){if(now>ph.nextT){const opts=POSES.filter(p=>p!==ph.cur);ph.cur=opts[Math.floor(Math.random()*opts.length)];ph.nextT=now+3200+Math.random()*1200;ph.newT=now;chime(520,.15);log('a3dfoxpose',{pose:ph.cur})}
        const t=(now-ph.newT)/1000;g.rotation.y=Math.atan2(cam.position.x-g.position.x,cam.position.z-g.position.z);
        if(ph.cur==='peek'){g.position.y=-.35;u.head.position.y=.78+.05*Math.sin(tm*3)}else if(ph.cur==='sit'){g.rotation.x=-.35;g.position.y=.05}else if(ph.cur==='pounce'){g.rotation.x=0;g.position.y=Math.max(0,Math.sin(Math.min(1,t/.9)*Math.PI))*1.1}else if(ph.cur==='curl'){g.rotation.x=0;g.position.y=-.2;u.tail.rotation.y=1.2}
        if(ph.cur!=='sit')g.rotation.x=0}
      else if(a===fox)g.rotation.x=0});
    /* no clipping: animals keep apart from the child, each other and camp props (simple circle push-out) */
    for(let it=0;it<3;it++){const RAD={husky:.75,seal:.95,fox:.55};const kr=.45;for(let i=0;i<A.length;i++){const p=A[i],gp=p.g.position;if(p===fox&&K.mode==='photo')continue;const ri=RAD[p.kind];
      {const dx=gp.x-kid.position.x,dz=gp.z-kid.position.z,d=Math.hypot(dx,dz),m=ri+kr;if(d<m){const k=(m-d)/(d||1e-3);gp.x+=dx*k;gp.z+=dz*k;if(d<1e-3)gp.x+=m}}
      for(let j=i+1;j<A.length;j++){const q=A[j],gq=q.g.position;if(q===fox&&K.mode==='photo')continue;const dx=gp.x-gq.x,dz=gp.z-gq.z,d=Math.hypot(dx,dz),m=ri+RAD[q.kind];if(d<m){const k=(m-d)/(d||1e-3)*.5;gp.x+=dx*k;gp.z+=dz*k;gq.x-=dx*k;gq.z-=dz*k;if(d<1e-3){gp.x+=m*.5;gq.x-=m*.5}}}
      (K.OBS||[]).forEach(o=>{const dx=gp.x-o[0],dz=gp.z-o[1],d=Math.hypot(dx,dz),m=ri+o[2];if(d<m){const k=(m-d)/(d||1e-3);gp.x+=dx*k;gp.z+=dz*k}})}
     {let pushed=false;(K.OBS||[]).forEach(o=>{const kp=kid.position,dx=kp.x-o[0],dz=kp.z-o[1],d=Math.hypot(dx,dz),m=kr+o[2];if(d<m){const k=(m-d)/(d||1e-3);kp.x+=dx*k;kp.z+=dz*k;pushed=true}});/* P6K (Tester facing): pushed round a post / the stall -> face the way the kid really moves */const kp=kid.position,lp=K._lkp||(K._lkp=kp.clone());const mx=kp.x-lp.x,mz=kp.z-lp.z;if(pushed&&Math.hypot(mx,mz)>.004){let dr=Math.atan2(mx,mz)-kid.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));kid.rotation.y+=dr*.35}lp.copy(kp)}}
    /* flying fish */
    for(let i=flyers.length-1;i>=0;i--){const q=flyers[i],t=(now-q.t0)/600;const to=q.a.g.position.clone().add(V(0,.9,0));if(t>=1){S.remove(q.f);flyers.splice(i,1);fed(q.a);continue}q.f.position.lerpVectors(q.p0,to,t);q.f.position.y+=Math.sin(t*Math.PI)*1.2;q.f.rotation.set(0,Math.atan2(-(to.z-q.p0.z),to.x-q.p0.x),Math.sin(t*18)*.4);q.f.userData.wag(t*40,.6)}
    /* hearts + bubble follow */
    for(let i=hearts.length-1;i>=0;i--){const q=hearts[i],t=(now-q.t0)/1200;if(t>=1){q.h.remove();hearts.splice(i,1);continue}const s=K.scr(q.p.clone().add(V(0,t*1.2,0)));q.h.style.transform='translate('+s.x+'px,'+s.y+'px) scale('+(1+t*.5)+')';q.h.style.opacity=1-t}
    if(bubFor){if(K.mode!=='walk'||bubFor.g.position.distanceTo(kid.position)>7)closeBub();else{const s=K.scr(bubFor.g.position.clone().add(V(0,bubFor.kind==='seal'?1.6:1.9,0)));/* P6D: keep the pet/feed/follow choices on screen */const bw=bub.offsetWidth||240,bh=bub.offsetHeight||90,Wd=K.wrap.clientWidth,Hd=K.wrap.clientHeight;const x=Math.min(Wd-bw/2-10,Math.max(bw/2+10,s.vis?s.x:Wd/2)),y=Math.min(Hd-150,Math.max(bh*1.15+70,s.vis?s.y:Hd/2));bub.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-115%)'}}
  });
  hub.style.display='none';fishChip.style.display='none';
  /* read-only probes for tests */
  K.probes=Object.assign(K.probes||{},{
    kid:()=>Object.assign(K.scr(kid.position.clone().add(V(0,1,0))),{wx:kid.position.x,wz:kid.position.z,moving:!!goal.p,ring:ringM.visible,steps:steps.classList.contains('on')}),
    animal:id=>{const a=A.find(q=>q.id===id);if(!a) return null;return Object.assign(K.scr(a.g.position.clone().add(V(0,.7,0))),{id,hungry:a.hungry,follow:a.follow,dist:a.g.position.distanceTo(kid.position),wx:a.g.position.x,wz:a.g.position.z})},
    groundAt:(x,z)=>K.scr(V(x,0,z)),overlaps:()=>{const RAD={husky:.75,seal:.95,fox:.55};let worst=0;const pts=A.map(a=>[a.g.position.x,a.g.position.z,RAD[a.kind]]).concat([[kid.position.x,kid.position.z,.45]]);for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);worst=Math.max(worst,pts[i][2]+pts[j][2]-d)}return +worst.toFixed(3)},foxGait:()=>({gait:+(fox.gait||0).toFixed(2),amp:+(fox.amp||0).toFixed(2),spd:+(fox.spd||0).toFixed(2)}),camp:()=>({fish:C.fish,foxDone:C.foxDone,jobs:C.jobs,bub:bubFor&&bubFor.id,photos:ph.shots.slice(),pose:ph.cur,coins:K.coins()})});
}
