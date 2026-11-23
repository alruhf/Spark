/* R22e (Allen on Android: "the goggles are messed up, the player walks on water rather than swim, the kelp planting turns up a flat graphic and no fish").
   1) swimPose: in water deeper than wading the kid swims — body pitched toward horizontal at the surface, front-crawl arm strokes and a flutter kick
      (procedural, on top of the rig's walk clip; the rig has no swim clip). Bones are aimed by direction, so it does not depend on the rig's bone axes.
   2) mask: a fitted dive mask (lens over eyes + nose, thin frame, strap) parented to the Head bone (R22g: no snorkel) (follows head turns and the swim pitch).
   3) kelp: tall swaying kelp fronds (one instanced draw call per clump, sway in the vertex shader) for planted spots. */
export function swimKit(THREE){
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);const a=V(),b=V(),c=V(),w=V(),X=V(),U=V(),F=V(),tq=new THREE.Quaternion(),bw=new THREE.Quaternion(),pq=new THREE.Quaternion(),mq=new THREE.Quaternion(),IQ=new THREE.Quaternion();
  /* rotate bone so the line bone->child points along world unit dir d (blend k) */
  function aim(bone,child,d,k){if(!bone||!child||!bone.parent)return;bone.getWorldPosition(a);child.getWorldPosition(b);c.subVectors(b,a);if(c.lengthSq()<1e-10)return;c.normalize();tq.setFromUnitVectors(c,d);if(k<1)tq.copy(IQ.identity().slerp(tq,k));bone.getWorldQuaternion(bw);bw.premultiply(tq);bone.parent.getWorldQuaternion(pq);bone.quaternion.copy(pq.invert().multiply(bw));bone.updateMatrixWorld(true)}
  function turn(bone,axis,ang){if(!bone||!bone.parent)return;tq.setFromAxisAngle(axis,ang);bone.getWorldQuaternion(bw);bw.premultiply(tq);bone.parent.getWorldQuaternion(pq);bone.quaternion.copy(pq.invert().multiply(bw));bone.updateMatrixWorld(true)}
  /* pt3 (Allen 3:55 'head still cockeyed', body twisted): the walk clip keeps playing under the swim pose, and its hip sway and spine counter-twist (a turn about the vertical while walking) become a sideways roll of the hips and shoulders once the body is pitched flat - aim() only fixes where a bone points, never its twist. detw() takes the twist out: it turns the bone about its own axis (axis = unit dir) until the bone's left-right axis (local X on this rig) lines up with the body's left-right axis. */
  const tx=V(),bx2=V();function detw(bone,axis,k){if(!bone||!bone.parent||k<=0)return 0;bone.getWorldQuaternion(bw);tx.set(1,0,0).applyQuaternion(bw);tx.addScaledVector(axis,-tx.dot(axis));bx2.copy(X).addScaledVector(axis,-X.dot(axis));if(tx.lengthSq()<1e-8||bx2.lengthSq()<1e-8)return 0;tx.normalize();bx2.normalize();const ang=Math.atan2(w.crossVectors(tx,bx2).dot(axis),tx.dot(bx2));turn(bone,axis.clone(),ang*k);return ang}
  const dir=(u,f,x)=>w.set(0,0,0).addScaledVector(U,u).addScaledVector(F,f).addScaledVector(X,x).normalize();
  const st={k:0,pitch:0,ph:0,kick:0,mode:'off'};
  /* o: {model,bones,swim,moving,near,deep,dt,root} ; root = model.rotation.x (kept by the caller) */
  const LIST=['Hips','Spine','Spine01','Spine02','neck','LeftArm','LeftForeArm','RightArm','RightForeArm','LeftUpLeg','LeftLeg','RightUpLeg','RightLeg','Head'];
  /* the pose is layered on top of the clip every frame; when no clip track rewrote a bone this frame (kid idle, mixer paused), put back what the clip left so the pose never stacks up frame after frame */
  function restore(B){LIST.forEach(n=>{const bn=B[n];if(!bn)return;const u=bn.userData;if(u._swHas&&bn.quaternion.angleTo(u._swPost)<1e-5)bn.quaternion.copy(u._swPre);(u._swPre||(u._swPre=new THREE.Quaternion())).copy(bn.quaternion);u._swHas=false})}
  function mark(B){LIST.forEach(n=>{const bn=B[n];if(!bn)return;const u=bn.userData;(u._swPost||(u._swPost=new THREE.Quaternion())).copy(bn.quaternion);u._swHas=true})}
  function swimPose(o){const B=o.bones,m=o.model;if(!B||!m||!B.Hips)return st;restore(B);const on=!!(o.swim&&o.deep);const mode=!on?'off':o.moving?'crawl':o.near?'tread':'float';st.mode=mode;
    st.k+=((on?1:0)-st.k)*Math.min(1,o.dt*5);if(st.k<.01){st.k=0;return st}
    const target=mode==='crawl'?1.36:mode==='float'?1.12:mode==='tread'?.22:0;st.pitch+=(target-st.pitch)*Math.min(1,o.dt*3.2);
    const sp=mode==='crawl'?5.2:mode==='float'?2.2:2.6;st.ph+=o.dt*sp;st.kick+=o.dt*(mode==='crawl'?9:mode==='float'?3.5:3);
    m.updateMatrixWorld(true);m.getWorldQuaternion(mq);X.set(1,0,0).applyQuaternion(mq);
    /* whole body pitch about the hips (the caller's root tilt is already in) */turn(B.Hips,X,(st.pitch-(o.root||0))*st.k);
    /* body frame after the pitch: U = spine up, F = belly, X = kid's left */B.Hips.getWorldPosition(a);(B.neck||B.Head).getWorldPosition(b);U.subVectors(b,a).normalize();F.crossVectors(X,U).normalize();
    const K=st.k;
    /* pt3: untwist hips, then each spine bone from the hips up (Spine02 -> Spine01 -> Spine on this rig), then the neck, so shoulders and hips stay level with each other and with the head */detw(B.Hips,U,K);B.Hips.getWorldPosition(a);(B.neck||B.Head).getWorldPosition(b);U.subVectors(b,a).normalize();F.crossVectors(X,U).normalize();
    const chain=[];{let c=B.Hips.children.find(o=>o.isBone&&/spine/i.test(o.name));while(c&&/spine/i.test(c.name)){chain.push(c);c=c.children.find(o=>o.isBone&&/spine|neck/i.test(o.name))}}if(!chain.length)[B.Spine02,B.Spine01,B.Spine].forEach(x=>x&&chain.push(x));
    chain.forEach(s=>{const ch=s.children.find(o=>o.isBone&&/spine|neck/i.test(o.name))||s.children.find(o=>o.isBone);if(ch){aim(s,ch,U,K*.6);s.getWorldPosition(a);ch.getWorldPosition(b);c.subVectors(b,a);if(c.lengthSq()>1e-10)detw(s,c.normalize().clone(),K)}});
    if(B.neck&&B.Head){B.neck.getWorldPosition(a);B.Head.getWorldPosition(b);c.subVectors(b,a);if(c.lengthSq()>1e-10)detw(B.neck,c.normalize().clone(),K)}
    [[1,'Left'],[-1,'Right']].forEach(([sd,n])=>{const arm=B[n+'Arm'],fa=B[n+'ForeArm'],hd=B[n+'Hand'],ul=B[n+'UpLeg'],lg=B[n+'Leg'],ft=B[n+'Foot'];
      if(mode==='crawl'||mode==='float'){const al=st.ph+(sd>0?0:Math.PI);if(mode==='crawl'){const ca=Math.cos(al),sa=Math.sin(al);aim(arm,fa,dir(ca,sa,sd*.2),K);aim(fa,hd,dir(ca+.45*Math.max(0,-sa),sa,sd*.12),K)}
        else{/* float: slow breaststroke sweep */const s2=Math.sin(st.ph);aim(arm,fa,dir(.75+.25*s2,.35,sd*(.35+.45*Math.max(0,-s2))),K);aim(fa,hd,dir(.85,.25+.2*s2,sd*(.2+.35*Math.max(0,-s2))),K)}
        const kk=Math.sin(st.kick+(sd>0?0:Math.PI))*(mode==='crawl'?.3:.18);aim(ul,lg,dir(-1,kk,sd*.08),K);aim(lg,ft,dir(-1,kk-.22,sd*.06),K)}
      else{/* tread water near the boat: sculling hands, slow bicycle legs */const s2=Math.sin(st.ph+(sd>0?0:1.4));aim(arm,fa,dir(-.45,.35+.25*s2,sd*.85),K);aim(fa,hd,dir(-.1,.75+.3*s2,sd*.6),K);const kk=Math.sin(st.kick+(sd>0?0:Math.PI));aim(ul,lg,dir(-1,.35+.3*kk,sd*.1),K);aim(lg,ft,dir(-1,-.25+.25*kk,sd*.06),K)}});
    /* head: look forward through the mask (not face-down into the sea floor). pt2 (Allen 7:45 'the head is tilted and cockeyed'): the old shortest-arc aim also twisted the head sideways; now the head only nods about the body's left-right axis, then any sideways tilt is taken out so the face stays level with the shoulders */if(B.Head&&B.head_end){if(mode!=='tread'){B.Head.getWorldPosition(a);B.head_end.getWorldPosition(b);c.subVectors(b,a);c.addScaledVector(X,-c.dot(X));if(c.lengthSq()>1e-10){c.normalize();const tg=dir(1,-.62,0).clone();tg.addScaledVector(X,-tg.dot(X)).normalize();const ang=Math.atan2(F.set(0,0,0).crossVectors(c,tg).dot(X),c.dot(tg));turn(B.Head,X,ang*K*.8);F.crossVectors(X,U).normalize()}}B.Head.getWorldPosition(a);B.head_end.getWorldPosition(b);c.subVectors(b,a);if(c.lengthSq()>1e-10){c.normalize();B.Head.getWorldQuaternion(bw);const hx=V(1,0,0).applyQuaternion(bw);hx.addScaledVector(c,-hx.dot(c));const bx=X.clone().addScaledVector(c,-X.dot(c));if(hx.lengthSq()>1e-8&&bx.lengthSq()>1e-8){hx.normalize();bx.normalize();if(hx.dot(bx)<0)hx.negate();const roll=Math.atan2(V(0,0,0).crossVectors(hx,bx).dot(c),hx.dot(bx));turn(B.Head,c.clone(),roll*K)}}}
    mark(B);return st}
  /* ---- dive mask fitted to the face (R22g, Allen: "big round teal hoop bigger than the head, hair pokes over the rim, a yellow snorkel tube beside it").
     No snorkel any more. A low-volume mask: a curved lens over both eyes and the nose, a thin frame round its edge and a strap that runs from the temples round
     the back of the head. Built in Head-bone space (measured on the kid by ray-picking the rendered face: eye centre E, face-up Uf, face-out N, crown axis U,
     front F; units = Head-local, head_end at 27.8) and parented to the Head bone, so it moves with the head on every pose and is sized from the head bones */
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.45},o||{}));
  const FACE={E:[.45,13.05,2.15],X:[1,0,0],Uf:[0,.6,-.8],N:[0,.8,.6],U:[0,.92,-.4],F:[0,.4,.92],L0:27.8};
  function fp(u,v,n,f,h){const E=FACE.E,X=FACE.X,Uf=FACE.Uf,N=FACE.N,U=FACE.U,F=FACE.F;f=f||0;h=h||0;return V(E[0]+X[0]*u+Uf[0]*v+N[0]*n+F[0]*f+U[0]*h,E[1]+X[1]*u+Uf[1]*v+N[1]*n+F[1]*f+U[1]*h,E[2]+X[2]*u+Uf[2]*v+N[2]*n+F[2]*f+U[2]*h)}
  /* lens outline in face coords (u across, v up; eye line v=0): flat top over the brows, round sides, sloping bottom with a nose pocket */
  function outline(){const P=[];const add=(u,v)=>P.push([u,v]);
    add(-5.2,2.7);add(5.2,2.7);for(let a=0;a<=6;a++){const t=Math.PI/2-a*Math.PI/2/6;add(5.2+1.35*Math.cos(t),1.35+1.35*Math.sin(t))}add(6.55,-.6);for(let a=1;a<=4;a++){const t=-a*Math.PI/2/4;add(5.0+1.55*Math.cos(t),-.6+1.4*Math.sin(t))}
    add(2.6,-2.2);add(1.6,-2.9);add(1.1,-3.9);add(.55,-4.4);add(0,-4.55);add(-.55,-4.4);add(-1.1,-3.9);add(-1.6,-2.9);add(-2.6,-2.2);
    for(let a=4;a>=1;a--){const t=-a*Math.PI/2/4;add(-5.0-1.55*Math.cos(t),-.6+1.4*Math.sin(t))}add(-6.55,-.6);for(let a=6;a>=0;a--){const t=Math.PI/2-a*Math.PI/2/6;add(-5.2-1.35*Math.cos(t),1.35+1.35*Math.sin(t))}return P}
  const depth=(u,v)=>3.3-.05*u*u+.25*Math.max(0,v)+(v<-1.8&&Math.abs(u)<2?.35*(1-Math.abs(u)/2):0);
  function mask(color){const g=new THREE.Group();g.userData.fit='mask';g.name='diveMask';const c=color||'#18a9bd';const O=outline();
    /* lens: the outline shape triangulated flat, then bent onto the face curve */const sh=new THREE.Shape();O.forEach(([u,v],k)=>k?sh.lineTo(u,v):sh.moveTo(u,v));const lg=new THREE.ShapeGeometry(sh,6);const lp=lg.attributes.position;
    for(let k=0;k<lp.count;k++){const u=lp.getX(k),v=lp.getY(k);const p=fp(u,v,depth(u,v));lp.setXYZ(k,p.x,p.y,p.z)}lg.computeVertexNormals();
    const lens=new THREE.Mesh(lg,M('#d8f4ff',{roughness:.05,metalness:.25,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false}));lens.name='maskLens';lens.renderOrder=2;g.add(lens);g.userData.lens=lens;
    /* thin frame round the lens edge */const fpts=O.map(([u,v])=>fp(u,v,depth(u,v)-.15));const fc=new THREE.CatmullRomCurve3(fpts,true,'centripetal');const frame=new THREE.Mesh(new THREE.TubeGeometry(fc,120,.42,8,true),M(c,{roughness:.35}));frame.name='maskFrame';g.add(frame);g.userData.frame=frame;
    /* a soft skirt from the frame back to the face, so the lens doesn't float off the cheeks */const sk=[];O.forEach(([u,v])=>{const d=depth(u,v);sk.push(fp(u*1.04,v*1.04,d-.2),fp(u*1.08,v*1.07,d-1.6))});const sg=new THREE.BufferGeometry().setFromPoints(sk);const ix=[];const n=O.length;for(let k=0;k<n;k++){const a=k*2,b=((k+1)%n)*2;ix.push(a,a+1,b+1,a,b+1,b)}sg.setIndex(ix);sg.computeVertexNormals();
    const skirt=new THREE.Mesh(sg,M(c,{roughness:.5,side:THREE.DoubleSide,transparent:true,opacity:.85}));skirt.name='maskSkirt';g.add(skirt);
    /* glint */const gl=new THREE.Mesh(new THREE.CircleGeometry(1,14),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.55,depthWrite:false}));const gp=fp(-3.2,1.4,depth(-3.2,1.4)+.08);gl.position.copy(gp);gl.lookAt(fp(-3.2,1.4,9));gl.scale.set(1.5,.45,1);gl.rotateZ(.35);gl.renderOrder=3;g.add(gl);
    /* strap: from the frame's sides past the temples and round the back of the head (mostly under the hair) */for(const sd of [1]){const sp=[fp(-6.6,.2,1.1),fp(-9.4,.3,-2.6),fp(-10.6,0,0,-8,1),fp(-9.4,0,0,-14.5,1.5),fp(0,0,0,-19.5,2),fp(9.4,0,0,-14.5,1.5),fp(10.6,0,0,-8,1),fp(9.4,.3,-2.6),fp(6.6,.2,1.1)];
      const st=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp,false,'centripetal'),48,.55,6,false),M('#0f5f6b',{roughness:.6}));st.name='maskStrap';g.add(st);g.userData.strap=st}
    return g}
  const hp=V(),he=V();
  /* parent the mask to the Head bone (once) and scale it from the head bones; returns fit info */
  function fitMask(g,B){const H=B.Head,E=B.head_end;if(!H||!E)return null;if(g.parent!==H||g.userData.headId!==H.uuid){H.add(g);g.position.set(0,0,0);g.quaternion.identity();E.getWorldPosition(he);H.worldToLocal(he);const L=he.length();g.scale.setScalar(L/FACE.L0);g.userData.headId=H.uuid;
      const bb=new THREE.Box3().setFromObject(g.userData.lens);const sz=V();bb.getSize(sz);g.userData.info={L:+L.toFixed(2),parented:'Head',lensW:+(13.1*L/FACE.L0).toFixed(2)}}
    return g.userData.info}
  /* ---- kelp */
  const U0={uT:{value:0}};let kmat=null;const kgeo={};
  function frondGeo(H,seed){const P=[],C=[],I=[];let s=seed||1;const r=()=>((s=(s*16807)%2147483647)/2147483647);const base=new THREE.Color('#3f5317'),tip=new THREE.Color('#a9bf3c'),blade=new THREE.Color('#7f9a2a');
    const push=(x,y,z,col)=>{P.push(x,y,z);C.push(col.r,col.g,col.b);return P.length/3-1};
    /* stipe: two crossed strips with a gentle S-curve */const N=10,sw=.03;for(const ang of [0,Math.PI/2]){const ca=Math.cos(ang),sa=Math.sin(ang);const i0=P.length/3;for(let i=0;i<=N;i++){const y=H*i/N,ox=.06*Math.sin(y*1.7),cl=base.clone().lerp(tip,i/N);const ww=sw*(1-.4*i/N);push(ox-ca*ww,y,-sa*ww,cl);push(ox+ca*ww,y,sa*ww,cl)}for(let i=0;i<N;i++){const k=i0+i*2;I.push(k,k+1,k+3,k,k+3,k+2)}}
    /* blades up the stipe, golden-angle around it, drooping a little */const nb=Math.round(H*5.5);for(let j=0;j<nb;j++){const t=.12+.85*j/nb,y=H*t,ph=j*2.4+r()*.5,L=(.26+.22*Math.sin(Math.PI*Math.min(1,t*1.1)))*(.85+r()*.3),wd=.075*(.8+r()*.4);const d=V(Math.cos(ph)*.8,.6,Math.sin(ph)*.8).normalize(),wv=V(-Math.sin(ph),0,Math.cos(ph));const ox=.06*Math.sin(y*1.7);const i0=P.length/3;const S=5;
      for(let i=0;i<=S;i++){const u=i/S;const cx=ox+d.x*L*u,cy=y+d.y*L*u-.1*u*u*L,cz=d.z*L*u;const hw=wd*Math.sin(Math.PI*(.12+.88*u))*(1-.3*u);const rf=.012*Math.sin(u*9+j);const cl=blade.clone().lerp(tip,u*.7);push(cx-wv.x*hw,cy+rf,cz-wv.z*hw,cl);push(cx+wv.x*hw,cy-rf,cz+wv.z*hw,cl)}
      for(let i=0;i<S;i++){const k=i0+i*2;I.push(k,k+1,k+3,k,k+3,k+2)}}
    /* canopy: a few long blades trailing near the top */for(let j=0;j<4;j++){const ph=j*1.57+r(),L=.55+r()*.25,wd=.09;const d=V(Math.cos(ph),.35,Math.sin(ph)).normalize(),wv=V(-Math.sin(ph),0,Math.cos(ph));const y=H*.97,ox=.06*Math.sin(y*1.7);const i0=P.length/3;const S=6;
      for(let i=0;i<=S;i++){const u=i/S;const cx=ox+d.x*L*u,cy=y+d.y*L*u-.15*u*u,cz=d.z*L*u;const hw=wd*Math.sin(Math.PI*(.1+.9*u))*(1-.25*u);const cl=blade.clone().lerp(tip,.4+u*.6);push(cx-wv.x*hw,cy,cz-wv.z*hw,cl);push(cx+wv.x*hw,cy,cz+wv.z*hw,cl)}
      for(let i=0;i<S;i++){const k=i0+i*2;I.push(k,k+1,k+3,k,k+3,k+2)}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=.6;return g}
  function kelpMat(){if(kmat)return kmat;kmat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.7,metalness:0,emissive:'#2c3a0c',emissiveIntensity:.35});
    kmat.onBeforeCompile=sh=>{sh.uniforms.uT=U0.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\n float hh=max(transformed.y,0.0);\n#ifdef USE_INSTANCING\n float kph=instanceMatrix[3].x*1.7+instanceMatrix[3].z*1.1;\n#else\n float kph=0.0;\n#endif\n float kk=hh*hh*.06;\n transformed.x+=sin(uT*1.15+kph+hh*.9)*kk;\n transformed.z+=cos(uT*.9+kph*1.3+hh*.7)*kk*.8;')};kmat.customProgramCacheKey=()=>'r3dkelp22e';return kmat}
  /* a clump of n fronds rising from y=0 (put it on the bed), as tall as the water allows (depth = metres of water above the bed) */
  function kelpClump(depth,n,seed,spread){let s=(seed|0)*7919+13;const r=()=>((s=(s*16807)%2147483647)/2147483647);const Hmax=Math.max(.9,Math.min(3.2,depth-.3));const key=Math.round(Hmax*4)/4;if(!kgeo[key])kgeo[key]=frondGeo(key,11+Object.keys(kgeo).length);
    const im=new THREE.InstancedMesh(kgeo[key],kelpMat(),n);im.frustumCulled=false;const o=new THREE.Object3D();const col=new THREE.Color();for(let i=0;i<n;i++){const a=i/n*6.28+r()*.8,d=(i?.25+r()*(spread||.8):0);o.position.set(Math.cos(a)*d,0,Math.sin(a)*d);o.rotation.set((r()-.5)*.12,r()*6.28,(r()-.5)*.12);const hs=.72+r()*.28;o.scale.set(1,hs,1);o.updateMatrix();im.setMatrixAt(i,o.matrix);col.setHSL(.2+r()*.06,.5,.55+r()*.15);im.setColorAt(i,col)}
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.userData.kelp={n,H:key};im.onBeforeRender=()=>{U0.uT.value=performance.now()/1000};return im}
  return {swimPose,swimState:st,mask,fitMask,kelpClump,kelpT:U0.uT}}
