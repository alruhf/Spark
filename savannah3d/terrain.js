/* P28 Savannah: natural dirt tracks (worn tyre ruts, soft grassy edges, gentle curves that hug the ground),
   termite mounds and loose stones. Savannah-only module. */
import {TRACK_LINES,offRoad,routeDist,trackDist,fbm,vnoise,BIG,RIVER,riverZ,HOLE,CRATER,KOPJES,DISC,isWater} from './world.js?v=6';
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
/* procedural track texture: transparent ragged edges, dusty compacted earth, two darker worn ruts with streaks, grassy centre hump */
function trackTex(THREE,ruts){const W=128,H=512;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');const id=c.createImageData(W,H);const D=id.data;
  for(let y=0;y<H;y++){const v=y/H;const e0=.08+.07*vnoise(v*9,1.3)+.04*vnoise(v*31,7),e1=.92-.07*vnoise(v*9,4.1)-.04*vnoise(v*31,9);
    for(let x=0;x<W;x++){const u=x/W;const i=(y*W+x)*4;
      const rg=.05*(vnoise(v*70,u*3)-.5);let a=ss(e0-.07+rg,e0+.17+rg,u)*(1-ss(e1-.17-rg,e1+.07-rg,u));
      const n=vnoise(u*16,v*64),n2=vnoise(u*48+3,v*190),gr=vnoise(u*30+11,v*120);
      /* spark10 fix 5: softer road noise (fine speckle halved) */let r=176+20*(n-.5)+7*(n2-.5),g=136+16*(n-.5)+5*(n2-.5),b=88+11*(n-.5)+4*(n2-.5);
      if(ruts){for(const rc of [.3,.7]){const dd=Math.abs(u-rc-.015*(vnoise(v*6,rc*9)-.5));const k=1-ss(.04,.11,dd);const berm=ss(.07,.11,dd)*(1-ss(.11,.17,dd));const tread=.9+.1*Math.sin(v*H*1.6+u*40);const streak=(.85+.15*vnoise(u*90,v*12))*tread;r-=58*k*streak;g-=48*k*streak;b-=30*k*streak;r+=16*berm;g+=13*berm;b+=8*berm}/* P29: deeper tyre ruts with tread marks and a lighter pushed-up berm */
        /* grassy centre hump */const ch=1-ss(.05,.12,Math.abs(u-.5));if(gr>.42){const kk=ch*ss(.42,.7,gr);r+=(196-r)*kk;g+=(178-g)*kk;b+=(104-b)*kk}}
      /* edge: dusty soil fades into straw */const ek=1-ss(.0,.3,Math.min(u-e0,e1-u));r+=(200-r)*ek*.55;g+=(178-g)*ek*.55;b+=(110-b)*ek*.55;/* scattered grass tufts creeping in */if(gr>.62&&ek>.3){const kk=ss(.62,.8,gr)*ek;r+=(150-r)*kk*.6;g+=(150-g)*kk*.6;b+=(80-b)*kk*.6}
      /* pebbles */if(n2>.9){r-=12;g-=11;b-=8}
      D[i]=r;D[i+1]=g;D[i+2]=b;D[i+3]=Math.round(255*a*(.93+.07*n))}}
  c.putImageData(id,0,0);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
/* one merged ribbon geometry for many centre-lines: follows the ground, fades in at both ends */
function ribbon(THREE,lines,groundH,lift,vRep,cols){const P=[],U=[],C=[],I=[];let base=0;cols=cols||6;
  for(const {line,w,fadeA=1,fadeB=1} of lines){const n=line.length;if(n<2)continue;let acc=0;const len=[0];for(let i=1;i<n;i++){acc+=Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1]);len.push(acc)}
    for(let i=0;i<n;i++){const a=line[Math.max(0,i-1)],b=line[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;const nx=-tz,nz=tx;
      /* slight natural width breathing */const ww=w*(1+.1*(vnoise(len[i]*.12,w)-.5));
      const al=Math.min(fadeA?ss(0,5,len[i]):1,fadeB?ss(0,5,acc-len[i]):1);
      for(let k=0;k<=cols;k++){const u=k/cols;const x=line[i][0]+nx*(u-.5)*ww,z=line[i][1]+nz*(u-.5)*ww;P.push(x,groundH(x,z)+lift,z);U.push(u,len[i]/vRep);C.push(1,1,1,al)}}
    for(let i=0;i<n-1;i++)for(let k=0;k<cols;k++){const a=base+i*(cols+1)+k,b=a+1,c2=a+cols+1,d=c2+1;I.push(a,b,c2,b,d,c2)}base+=n*(cols+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,4));g.setIndex(I);g.computeVertexNormals();return g}
const roadMat=(THREE,map)=>new THREE.MeshStandardMaterial({map,transparent:true,vertexColors:true,depthWrite:false,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
/* gentle curve between two points (quadratic bend) sampled every ~0.8 m */
export function bend(ax,az,bx,bz,k){const L=Math.hypot(bx-ax,bz-az)||1;const mx=(ax+bx)/2-(bz-az)/L*k*L,mz=(az+bz)/2+(bx-ax)/L*k*L;const n=Math.max(3,Math.ceil(L/.8));const out=[];for(let i=0;i<=n;i++){const t=i/n,o=1-t;out.push([o*o*ax+2*o*t*mx+t*t*bx,o*o*az+2*o*t*mz+t*t*bz])}return out}
export function buildTracks(K){const {THREE,S,groundH}=K;
  const tT=trackTex(THREE,true);const g=ribbon(THREE,TRACK_LINES.map(T=>({line:T.line,w:T.w*1.18,fadeA:T.id!=='yard',fadeB:!/^(yard|south)$/.test(T.id)})),groundH,.07,7);
  const m=new THREE.Mesh(g,roadMat(THREE,tT));m.receiveShadow=true;m.renderOrder=2;S.add(m);return m}
export function buildFootpaths(K,list){const {THREE,S,groundH}=K;const fT=trackTex(THREE,false);
  const g=ribbon(THREE,list.map(([ax,az,bx,bz,w],i)=>({line:bend(ax,az,bx,bz,(i%2?.06:-.06)),w:w*1.25})),groundH,.06,4);
  const m=new THREE.Mesh(g,roadMat(THREE,fT));m.receiveShadow=true;m.renderOrder=2;S.add(m);return m}
/* termite mounds (solid) + loose stones (visual) — never on tracks or auto-drive legs, water, rescue sites or test lanes */
export function buildMounds(K){const {THREE,S,groundH,solid}=K;let s0=9173;const rnd=()=>{s0=(s0*16807)%2147483647;return s0/2147483647};
  const SITES=[[-72,24],[62,55],[-52,-28],[6,52]];
  const clear=(x,z,m)=>{if(!offRoad(x,z,m))return false;if(isWater(x,z)||Math.abs(z-riverZ(x))<RIVER.w*1.8+m)return false;if(Math.hypot(x-HOLE.x,z-HOLE.z)<HOLE.r+8||Math.hypot(x-CRATER.x,z-CRATER.z)<CRATER.R+8)return false;
    for(const k of KOPJES)if(Math.hypot(x-k.x,z-k.z)<k.r+4)return false;for(const d of DISC)if(Math.hypot(x-d.x,z-d.z)<13)return false;for(const s of SITES)if(Math.hypot(x-s[0],z-s[1])<13)return false;
    if(x>-17&&x<22&&z>-26&&z<16)return false;if(Math.hypot(x-17,z-14)<13)return false;const r=Math.hypot(x,z-8);if(r>BIG-22)return false;
    /* keep the straight test/explore lanes free */if(Math.abs(x)<9&&Math.abs(z)>60)return false;if(Math.abs(z-8)<9&&Math.abs(x)>60)return false;if(x>60&&Math.abs(x-z)<12)return false;if(Math.abs(x-60)<9&&z<-40&&z>-120)return false;
    for(const s of solid)if(Math.hypot(x-s[0],z-s[1])<(s[2]||1)+3)return false;return true};
  /* mound geometry: lumpy cone with a side chimney, earthy ochre with darker base */
  const mk=(seed,tall)=>{const prof=[];const N=9;for(let i=0;i<=N;i++){const t=i/N;const r=(1-Math.pow(t,tall?.55:.8))*(1+.12*Math.sin(t*9+seed))*(1+.5*Math.pow(1-t,5));/* P29: weathered flared base */prof.push(new THREE.Vector2(Math.max(.02,r),t))}const g=new THREE.LatheGeometry(prof,14);const p=g.attributes.position;const col=[];
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const a=Math.atan2(z,x);const k=1+.16*Math.sin(a*3+seed+y*5)+.1*Math.sin(a*7-seed*2+y*11);p.setXYZ(i,x*k,y,z*k);const d=.82+.18*y+.06*Math.sin(a*5+y*20);col.push(d,d*.97,d*.93)}
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g};
  const mM=new THREE.MeshStandardMaterial({color:'#a07a5a',roughness:1,vertexColors:true});
  const geos=[mk(1.3,true),mk(4.1,false)];const spots=[[],[]];
  for(let i=0;i<2600&&spots[0].length+spots[1].length<58;i++){const near=i<900;const a=rnd()*6.283,d=near?24+rnd()*40:64+rnd()*(BIG-86);const x=Math.cos(a)*d,z=8+Math.sin(a)*d;if(!clear(x,z,3))continue;
    const tall=rnd()<.55;const h=tall?1.4+rnd()*1.5:.7+rnd()*.6,r=tall?.55+rnd()*.35:.9+rnd()*.5;spots[tall?0:1].push([x,z,h,r,rnd()*6.28]);solid.push([x,z,r*.95+.25])}
  geos.forEach((g,gi)=>{const L=spots[gi];if(!L.length)return;const im=new THREE.InstancedMesh(g,mM,L.length);const q=new THREE.Object3D();const c=new THREE.Color();L.forEach(([x,z,h,r,ry],i)=>{q.position.set(x,groundH(x,z)-.12,z);q.scale.set(r,h,r);q.rotation.set(0,ry,0);q.updateMatrix();im.setMatrixAt(i,q.matrix);c.setHSL(.07+rnd()*.025,.26+rnd()*.1,.5+rnd()*.08);im.setColorAt(i,c)});im.castShadow=true;im.receiveShadow=true;S.add(im)});
  /* P29: weathered granite boulder clusters (solid), off every route */
  {const bg=new THREE.DodecahedronGeometry(1,1);const p=bg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+.14*Math.sin(x*3.1+z*2.3)+.08*Math.cos(y*4.7+x);p.setXYZ(i,x*k*1.15,Math.max(-.3,y*k*.72),z*k)}bg.computeVertexNormals();
   const bl=[];for(let i=0;i<1600&&bl.length<70;i++){const a=rnd()*6.283,d=30+rnd()*(BIG-55);const cx=Math.cos(a)*d,cz=8+Math.sin(a)*d;if(!clear(cx,cz,5))continue;const n=1+Math.floor(rnd()*3);for(let j=0;j<n;j++){const x=cx+(rnd()-.5)*3.2,z=cz+(rnd()-.5)*3.2;const s=j?.35+rnd()*.4:.6+rnd()*.6;bl.push([x,z,s,rnd()*6.28]);if(s>.45)solid.push([x,z,s*1.05])}}
   const im=new THREE.InstancedMesh(bg,new THREE.MeshStandardMaterial({color:'#b3a894',roughness:.92}),bl.length);const q=new THREE.Object3D();const c=new THREE.Color();bl.forEach(([x,z,s,r],i)=>{q.position.set(x,groundH(x,z)-s*.12,z);q.scale.set(s,s,s*(.8+rnd()*.4));q.rotation.set(rnd()*.3,r,rnd()*.3);q.updateMatrix();im.setMatrixAt(i,q.matrix);c.setHSL(.08+rnd()*.03,.08+rnd()*.08,.5+rnd()*.12);im.setColorAt(i,c)});im.castShadow=true;im.receiveShadow=true;S.add(im);K.boulders=bl.length}
  /* loose stones & pebble clusters (visual only, small) near camp and along the plain */
  const sg=new THREE.IcosahedronGeometry(1,1);{const p=sg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+.18*Math.sin(x*4+z*3)+.1*Math.cos(y*5);p.setXYZ(i,x*k,Math.max(-.2,y*k*.6),z*k)}sg.computeVertexNormals()}
  const st=[];for(let i=0;i<1400&&st.length<220;i++){const a=rnd()*6.283,d=19+Math.pow(rnd(),.8)*(BIG-40);const cx=Math.cos(a)*d,cz=8+Math.sin(a)*d;if(!clear(cx,cz,0))continue;const n=1+Math.floor(rnd()*4);for(let j=0;j<n;j++){const x=cx+(rnd()-.5)*2.4,z=cz+(rnd()-.5)*2.4;const s=.12+rnd()*(d<60?.28:.45);st.push([x,z,s,rnd()*6.28])}}
  {const im=new THREE.InstancedMesh(sg,new THREE.MeshStandardMaterial({color:'#c4b29a',roughness:.95}),st.length);const q=new THREE.Object3D();const c=new THREE.Color();st.forEach(([x,z,s,r],i)=>{q.position.set(x,groundH(x,z)-s*.15,z);q.scale.set(s*1.2,s,s);q.rotation.set(0,r,0);q.updateMatrix();im.setMatrixAt(i,q.matrix);c.setHSL(.075+rnd()*.03,.12+rnd()*.12,.55+rnd()*.15);im.setColorAt(i,c)});im.castShadow=true;im.receiveShadow=true;S.add(im)}
  K.log&&K.log('s3dmounds',{mounds:spots[0].length+spots[1].length,stones:st.length});return {mounds:spots,stones:st.length}}
/* ground tint helper: soft dusty halo round the tracks + patchy dry/green/bare earth (r,g,b multipliers applied in the ground loop) */
export function groundTint(x,z,c,THREE,far){const pn=fbm(x/16+3,z/16-7),bn=fbm(x/5.5-11,z/5.5+2);
  const dry=ss(.48,.66,pn),grn=1-ss(.3,.46,pn),bare=ss(.64,.78,bn);
  c.r*=1+.12*dry-.1*grn;c.g*=1+.06*dry+.04*grn;c.b*=1-.08*dry-.08*grn;
  c.lerp(new THREE.Color(1.02,.8,.56),bare*.5*far);
  const td=trackDist(x,z);const k=1-ss(td.w*.4,td.w*.5+2.2,td.d);c.lerp(new THREE.Color(1.06,.84,.58),k*.55);return td}
