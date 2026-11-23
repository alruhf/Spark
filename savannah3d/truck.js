/* P29 Savannah rescue vehicle: a believable dark-olive 4x4 rescue SUV (LC76-style five-door wagon).
   Rescue crate rides in the cargo bay behind clear rear glass; side-hinged rear door with spare swings open on release.
   Rounded panels, dusty lower body, tinted glass, black steel bull bar, snorkel, roof rack + light bar, real tyres.
   Static parts are merged per material (≈12 draw calls + 4 wheels) so it stays light on phones. */
import {mergeGeometries} from '../arctic3d/vendor/jsm/utils/BufferGeometryUtils.js';
export function buildTruck(THREE,truck,tParts){
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  /* rounded box with analytic normals (m segments in each rounded edge) */
  const rb=(w,h,d,r,m=3)=>{const S=2*m+1;const g=new THREE.BoxGeometry(w,h,d,S,S,S);const p=g.attributes.position,n=g.attributes.normal;const H=[w/2,h/2,d/2];r=Math.min(r,w/2-1e-3,h/2-1e-3,d/2-1e-3);
    const map=(c,hw)=>{const i=Math.round((c/hw*.5+.5)*S);if(i<=m)return -hw+r*(i/m);if(i>=S-m)return hw-r*((S-i)/m);return c};
    for(let i=0;i<p.count;i++){const q=[map(p.getX(i),H[0]),map(p.getY(i),H[1]),map(p.getZ(i),H[2])];const inn=q.map((c,k)=>Math.max(-(H[k]-r),Math.min(H[k]-r,c)));const dv=q.map((c,k)=>c-inn[k]);const L=Math.hypot(...dv);
      if(L>1e-6){const u=dv.map(c=>c/L);p.setXYZ(i,inn[0]+u[0]*r,inn[1]+u[1]*r,inn[2]+u[2]*r);n.setXYZ(i,u[0],u[1],u[2])}else p.setXYZ(i,q[0],q[1],q[2])}return g};
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.1},o||{}));
  const MAT={paint:M('#566139',{roughness:.5,metalness:.22,vertexColors:true}),steel:M('#1f211d',{roughness:.55,metalness:.45}),plastic:M('#262622',{roughness:.82,metalness:0}),
    bright:M('#cfcbbf',{roughness:.3,metalness:.75}),glass:M('#4f6a74',{roughness:.06,metalness:.2,transparent:true,opacity:.5})/* P38 #27: lighter tint so the cab interior reads */,glass2:M('#3a4a50',{roughness:.05,metalness:.2,transparent:true,opacity:.38,depthWrite:false}),
    lamp:M('#fff7df',{emissive:'#ffe7a6',emissiveIntensity:.85,roughness:.15}),amber:M('#ffa524',{emissive:'#ff8a00',emissiveIntensity:.45,roughness:.3}),red:M('#d3241c',{emissive:'#b0120a',emissiveIntensity:.45,roughness:.3}),
    tray:M('#3d3f37',{roughness:.7,metalness:.35}),canvas:M('#6d6a52',{roughness:.95}),jerry:M('#5c6a3a',{roughness:.55,metalness:.2}),seat:M('#b8925e',{roughness:.9}),dashF:M('#4a4a42',{roughness:.7})};
  const parts={};const add=(g,mk,x,y,z,rx,ry,rz)=>{g=g.index?g.toNonIndexed():g;const o=new THREE.Object3D();o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);o.updateMatrix();g.applyMatrix4(o.matrix);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(g.attributes.uv1)g.deleteAttribute('uv1');(parts[mk]=parts[mk]||[]).push(g);return g};
  const cyl=(r1,r2,h,s=12)=>new THREE.CylinderGeometry(r1,r2,h,s);
  const tube=(a,b,r,mk)=>{const A=V(...a),B=V(...b);const d=B.clone().sub(A);const g=cyl(r,r,d.length(),10);const q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.clone().normalize());const e=new THREE.Euler().setFromQuaternion(q);const c=A.add(B).multiplyScalar(.5);add(g,mk,c.x,c.y,c.z,e.x,e.y,e.z)};
  /* ---- chassis + running gear (mostly hidden, gives depth from low angles) */
  add(new THREE.BoxGeometry(1.0,.16,4.1),'steel',0,.5,0);add(cyl(.13,.13,1.5,10),'steel',0,.42,1.52,0,0,Math.PI/2);add(cyl(.13,.13,1.5,10),'steel',0,.42,-1.48,0,0,Math.PI/2);add(new THREE.BoxGeometry(.5,.28,.7),'steel',.45,.52,-.25);
  /* ---- body panels (olive paint) */
  add(rb(1.46,.4,1.3,.09),'paint',0,1.03,1.64);                       /* bonnet */
  [-1,1].forEach(s=>{add(rb(.28,.34,1.34,.08),'paint',s*.84,1.0,1.63);/* front guards */add(rb(.06,.3,1.0,.03),'paint',s*.86,.82,1.63)});
  add(rb(1.8,.7,3.18,.08),'paint',0,1.03,-.59);                        /* wagon body tub + doors */
  add(rb(1.78,.1,3.08,.05),'paint',0,1.945,-.62);                      /* full-length roof */
  [-1,1].forEach(s=>{[-.2,-1.04].forEach(z=>add(new THREE.BoxGeometry(.012,.6,.014),'plastic',s*.903,1.02,z));/* door shut lines */add(new THREE.BoxGeometry(.012,.02,3.0),'plastic',s*.903,.74,-.6);/* sill line */});
  [-1,1].forEach(s=>{tube([s*.86,1.36,.97],[s*.85,1.92,.74],.045,'paint');/* A pillar; B,C,D pillars */[-.2,-1.04].forEach(z=>add(rb(.09,.58,.12,.03),'paint',s*.85,1.64,z));add(rb(.1,.58,.16,.04),'paint',s*.85,1.64,-2.06);/* beltline */add(rb(.06,.07,3.0,.02),'paint',s*.875,1.4,-.6)});
  add(rb(1.62,.07,.08,.02),'paint',0,1.39,.97);                        /* scuttle under windscreen */
  /* cargo floor (crate sits here) */
  add(new THREE.BoxGeometry(1.66,.06,1.9),'tray',0,.72,-1.2);
  /* ---- black steel: bull bar, bumpers, steps, flares */
  add(rb(1.9,.22,.22,.05),'steel',0,.62,2.36);add(new THREE.BoxGeometry(.5,.12,.1),'steel',0,.64,2.48);add(cyl(.07,.07,.42,10),'steel',0,.64,2.43,0,0,Math.PI/2);/* winch drum */
  [-.42,.42].forEach(x=>tube([x,.72,2.44],[x,1.2,2.38],.042,'steel'));tube([-.42,1.2,2.38],[.42,1.2,2.38],.042,'steel');
  [-1,1].forEach(s=>{tube([s*.42,.72,2.44],[s*.86,.72,2.38],.04,'steel');tube([s*.86,.72,2.38],[s*.9,1.12,2.25],.036,'steel')});
  add(rb(1.9,.15,.2,.04),'steel',0,.6,-2.25);add(new THREE.BoxGeometry(.14,.1,.3),'steel',0,.5,-2.38);add(new THREE.SphereGeometry(.05,10,8),'bright',0,.6,-2.5);/* tow ball */
  [-1,1].forEach(s=>{add(new THREE.BoxGeometry(.18,.05,1.12),'steel',s*.98,.58,.3);/* side step */
    for(const z of [1.52,-1.48]){const t=new THREE.TorusGeometry(.5,.055,8,20,Math.PI);add(t,'plastic',s*.97,.42,z,0,s>0?Math.PI/2:-Math.PI/2,0);}});
  /* grille + lamps */
  add(new THREE.BoxGeometry(1.08,.32,.04),'plastic',0,1.0,2.29);for(let i=0;i<4;i++)add(new THREE.BoxGeometry(1.0,.03,.03),'steel',0,.9+i*.065,2.315);
  [-1,1].forEach(s=>{add(cyl(.115,.115,.05,18),'lamp',s*.62,1.02,2.3,Math.PI/2,0,0);add(new THREE.TorusGeometry(.12,.022,8,20),'bright',s*.62,1.02,2.325);add(new THREE.BoxGeometry(.14,.06,.04),'amber',s*.62,.86,2.3);add(new THREE.BoxGeometry(.03,.05,.1),'amber',s*.985,1.02,1.9);
    add(new THREE.BoxGeometry(.1,.24,.04),'red',s*.8,.9,-2.2);add(new THREE.BoxGeometry(.1,.06,.041),'amber',s*.8,1.05,-2.2);add(new THREE.BoxGeometry(.1,.05,.041),'lamp',s*.8,.76,-2.2)});
  /* simple interior seen through the glass: dash, wheel, seats (rear row folded for the crate) */
  /* P38 #27: the cab read as an empty dark box - lighter tan seats with headrests, a dash face with gauges, a proper wheel on its column, gear stick and floor */
  add(new THREE.BoxGeometry(1.6,.18,.32),'plastic',0,1.3,.78);add(new THREE.BoxGeometry(1.56,.26,.04),'dashF',0,1.18,.62);
  [.3,.52].forEach(x=>{add(new THREE.TorusGeometry(.055,.012,6,14),'bright',x,1.22,.598);add(cyl(.05,.05,.01,12),'lamp',x,1.22,.6,Math.PI/2,0,0)});add(new THREE.BoxGeometry(.3,.1,.02),'amber',-.1,1.22,.598);
  add(cyl(.025,.03,.36,8),'plastic',.42,1.33,.5,-1.0,0,0);add(new THREE.TorusGeometry(.19,.028,7,20),'plastic',.42,1.43,.42,-1.0,0,0);add(new THREE.BoxGeometry(.3,.03,.04),'plastic',.42,1.43,.42,-1.0,0,0);add(cyl(.045,.045,.05,10),'bright',.42,1.43,.42,-1.0+Math.PI/2,0,0);
  add(new THREE.BoxGeometry(1.5,.03,1.1),'tray',0,.86,.25);add(cyl(.018,.018,.28,6),'plastic',0,1.05,.42,-.25,0,0);add(new THREE.SphereGeometry(.04,8,6),'bright',0,1.19,.46);
  [-.42,.42].forEach(x=>{add(rb(.5,.14,.5,.04),'seat',x,1.0,.2);add(rb(.48,.6,.12,.04),'seat',x,1.3,-.04,.12,0,0);add(rb(.28,.16,.1,.04),'seat',x,1.72,-.1,.12,0,0)});
  /* ---- glass (tinted, slightly reflective) + rubber surrounds */
  add(new THREE.BoxGeometry(1.6,.6,.02),'glass',0,1.66,.86,-.4,0,0);
  [-1,1].forEach(s=>{add(new THREE.BoxGeometry(.02,.5,.98),'glass',s*.885,1.65,.33);add(new THREE.BoxGeometry(.025,.05,1.0),'plastic',s*.887,1.9,.33)});
  /* rear doors + cargo windows (lighter tint so the rescued animal shows) */
  [-1,1].forEach(s=>{add(new THREE.BoxGeometry(.02,.5,.7),'glass2',s*.885,1.65,-.62);add(new THREE.BoxGeometry(.02,.48,.9),'glass2',s*.885,1.65,-1.55);add(new THREE.BoxGeometry(.025,.05,3.0),'plastic',s*.887,1.9,-.6)});
  /* mirrors, handles, wipers, antenna, snorkel */
  [-1,1].forEach(s=>{add(new THREE.BoxGeometry(.18,.03,.04),'plastic',s*.97,1.45,.92);add(rb(.06,.17,.22,.025),'plastic',s*1.06,1.5,.92);add(new THREE.BoxGeometry(.02,.14,.19),'glass',s*1.092,1.5,.92);add(new THREE.BoxGeometry(.02,.04,.14),'bright',s*.905,1.25,.05);
    add(new THREE.BoxGeometry(.6,.02,.02),'plastic',s*.33,1.41,1.02,0,0,s*.25)});
  tube([-.86,1.2,1.05],[-.86,2.55,1.05],.008,'plastic');
  tube([.95,1.0,1.25],[.95,1.25,1.05],.055,'plastic');tube([.95,1.25,1.05],[.92,2.02,.82],.055,'plastic');add(rb(.12,.12,.2,.03),'plastic',.92,2.07,.86);
  /* ---- roof rack, light bar, jerry cans, spare */
  const RY=2.06;[[-.8,-1.95,-.8,.78],[.8,-1.95,.8,.78],[-.8,-1.95,.8,-1.95],[-.8,.78,.8,.78]].forEach(([x0,z0,x1,z1])=>tube([x0,RY,z0],[x1,RY,z1],.024,'steel'));
  for(let z=-1.75;z<.7;z+=.27)tube([-.8,RY+.005,z],[.8,RY+.005,z],.014,'steel');[[-.8,-1.95],[.8,-1.95],[-.8,-.6],[.8,-.6],[-.8,.78],[.8,.78]].forEach(([x,z])=>add(new THREE.BoxGeometry(.05,.09,.06),'steel',x,1.99+.04,z));
  add(new THREE.BoxGeometry(1.12,.08,.08),'steel',0,RY+.06,.82);for(let i=0;i<4;i++)add(cyl(.032,.032,.02,12),'lamp',-.42+i*.28,RY+.06,.865,Math.PI/2,0,0);
  [-.55,-.33].forEach(x=>{add(rb(.18,.34,.5,.03),'jerry',x,RY+.19,-.1);add(new THREE.BoxGeometry(.04,.04,.06),'steel',x,RY+.38,.08)});
  add(rb(.9,.12,.5,.05),'canvas',.3,RY+.08,.25);/* rolled tarp */add(rb(1.2,.07,.9,.02),'tray',0,RY+.04,-1.3);/* rack deck */add(rb(.55,.2,.4,.04),'canvas',-.25,RY+.17,-1.4);/* gear bag */
  /* body dust: paint vertex colours fade to dusty tan low down + faint speckle (subtle wear) */
  {const tint=new THREE.Color(),dust=new THREE.Color(2.25,1.85,1.75);for(const g of parts.paint){const p=g.attributes.position;const col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const k=Math.max(0,Math.min(1,(1.12-y)/.5))*.55+Math.max(0,(Math.abs(z)-1.9)*1.2)*.2;const sp=1+.06*Math.sin(x*41+z*37)*Math.sin(y*53);tint.setRGB(1,1,1).lerp(dust,k);col[i*3]=tint.r*sp;col[i*3+1]=tint.g*sp;col[i*3+2]=tint.b*sp}g.setAttribute('color',new THREE.BufferAttribute(col,3))}}
  for(const [k,list] of Object.entries(parts)){const norm=list.map(g=>{if(k!=='paint'&&g.attributes.color)g.deleteAttribute('color');return g});const mg=mergeGeometries(norm,false);if(!mg)continue;const m=new THREE.Mesh(mg,MAT[k]);m.castShadow=k!=='glass';m.receiveShadow=true;m.name='truck-'+k;truck.add(m)}
  /* door decal: ranger rescue badge (paw + cross) */
  {const cv=document.createElement('canvas');cv.width=256;cv.height=128;const c=cv.getContext('2d');c.fillStyle='rgba(240,232,208,.92)';c.beginPath();c.roundRect?c.roundRect(6,10,244,108,22):c.rect(6,10,244,108);c.fill();
    c.fillStyle='#2f6b3a';c.beginPath();c.arc(62,64,40,0,6.283);c.fill();c.fillStyle='#f0e8d0';c.beginPath();c.ellipse(62,74,15,12,0,0,6.283);c.fill();[[42,52],[54,42],[70,42],[82,52]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,6.5,8,0,0,6.283);c.fill()});
    c.fillStyle='#2f3a22';c.font='bold 34px system-ui,sans-serif';c.textBaseline='middle';c.fillText('RESCUE',112,52);c.font='bold 20px system-ui,sans-serif';c.fillStyle='#6a5a3a';c.fillText('WILDLIFE',116,88);
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const dm=new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1});
    [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.62,.31),dm);m.position.set(s*.903,1.08,.36);m.rotation.y=s*Math.PI/2;truck.add(m)})}
  /* ---- wheels: rounded tyre with tread blocks + steel rim, nuts and cap */
  const tyreG=(()=>{const pr=[[.25,-.14],[.35,-.152],[.395,-.14],[.418,-.112],[.428,-.06],[.428,.06],[.418,.112],[.395,.14],[.35,.152],[.25,.14]].map(([r,x])=>new THREE.Vector2(r,x));const g=new THREE.LatheGeometry(pr,32).toNonIndexed();g.rotateZ(Math.PI/2);const list=[g];
    for(let i=0;i<30;i++){const a=i/30*Math.PI*2;for(const sx of [-.065,.065]){const b=new THREE.BoxGeometry(.11,.035,.06).toNonIndexed();b.translate(sx+(i%2?.02:-.02),.435,0);b.rotateX(a);list.push(b)}}
    list.forEach(q=>{if(q.attributes.uv1)q.deleteAttribute('uv1')});return mergeGeometries(list,false)})();
  const rimG=(()=>{const pr=[[.001,.135],[.07,.135],[.1,.12],[.2,.105],[.235,.13],[.262,.125],[.262,-.11],[.24,-.125]].map(([r,x])=>new THREE.Vector2(r,x));const g=new THREE.LatheGeometry(pr,24).toNonIndexed();g.rotateZ(-Math.PI/2);const list=[g];
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const n=new THREE.CylinderGeometry(.018,.018,.03,6).toNonIndexed();n.rotateZ(Math.PI/2);n.translate(.14,Math.cos(a)*.11,Math.sin(a)*.11);list.push(n)}
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const h=new THREE.CylinderGeometry(.022,.022,.02,8).toNonIndexed();h.rotateZ(Math.PI/2);h.translate(.11,Math.cos(a)*.18,Math.sin(a)*.18);list.push(h)}
    list.forEach(q=>{if(q.attributes.uv1)q.deleteAttribute('uv1')});return mergeGeometries(list,false)})();
  const tyreM=new THREE.MeshStandardMaterial({color:'#1b1a18',roughness:.95}),rimM=new THREE.MeshStandardMaterial({color:'#bdb8a6',roughness:.42,metalness:.55});
  const mkWheel=(x,z,par,flip)=>{const w=new THREE.Group();w.position.set(x,.43,z);par.add(w);const inner=new THREE.Group();inner.rotation.y=flip?Math.PI:0;w.add(inner);const t=new THREE.Mesh(tyreG,tyreM),r=new THREE.Mesh(rimG,rimM);[t,r].forEach(m=>{m.castShadow=true;m.receiveShadow=true;inner.add(m)});return w};
  [[-.84,1.52],[.84,1.52],[-.84,-1.48],[.84,-1.48]].forEach(([x,z])=>tParts.wheels.push(mkWheel(x,z,truck,x<0)));
  /* side-hinged rear door (hinge on the left) with glass + spare wheel; swings with the crate door on release */
  {const hinge=new THREE.Group();hinge.position.set(-.86,0,-2.2);truck.add(hinge);const white=g=>{g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(.93),3));return g};
    const dp=new THREE.Mesh(white(rb(1.74,.72,.06,.03)),MAT.paint);dp.position.set(.86,1.03,0);dp.castShadow=true;hinge.add(dp);
    const dt=new THREE.Mesh(white(rb(1.74,.1,.06,.03)),MAT.paint);dt.position.set(.86,1.9,0);hinge.add(dt);
    [.04,1.68].forEach(x=>{const m=new THREE.Mesh(white(rb(.1,.52,.06,.02)),MAT.paint);m.position.set(x,1.64,0);hinge.add(m)});
    const dg=new THREE.Mesh(new THREE.BoxGeometry(1.56,.5,.02),MAT.glass2);dg.position.set(.86,1.64,0);hinge.add(dg);
    const hdl=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,.03),MAT.bright);hdl.position.set(1.55,1.18,-.04);hinge.add(hdl);
    const sp=new THREE.Group();sp.position.set(.86,1.02,-.2);sp.rotation.y=Math.PI/2;sp.scale.setScalar(.84);hinge.add(sp);sp.add(new THREE.Mesh(tyreG,tyreM),new THREE.Mesh(rimG,rimM));sp.children.forEach(m=>m.castShadow=true);
    const cov=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.05,24),MAT.canvas);cov.rotation.x=Math.PI/2;cov.position.set(.86,1.02,-.33);hinge.add(cov);
    dp.onBeforeRender=()=>{const d=tParts.door;const k=d?Math.min(1,Math.max(0,-d.rotation.x/1.1)):0;hinge.rotation.y=-k*1.7}}
  return MAT}
