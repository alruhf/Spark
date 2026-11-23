/* P5c (Allen 10/20: "fish look like potatoes"): one real fish model (Arctic char style) used everywhere a fish shows in 3D:
   catch, feeding flyers, fish-camp rack. Laterally flattened tapered body with a slight curve, forked tail, dorsal + adipose +
   pectoral + pelvic + anal fins, eyes, gill line, scale/spot texture, olive back fading to an orange belly. All procedural (no download).
   g.userData.wag(t,amp) swings the tail; flop() helpers live with the callers. Length ~1 unit along +x (head at +x). */
let geoCache=null;
export function fishGeos(THREE){if(geoCache) return geoCache;
  /* body: sphere with poles on x, then sculpted */
  const g=new THREE.SphereGeometry(1,40,20);g.rotateZ(-Math.PI/2);const P=g.attributes.position,col=[];const c=new THREE.Color(),back=new THREE.Color('#3f5a46'),side=new THREE.Color('#b4c2ad'),belly=new THREE.Color('#ff8a3d'),snout=new THREE.Color('#556b55');
  for(let i=0;i<P.count;i++){let x=P.getX(i),y=P.getY(i),z=P.getZ(i);/* x in [-1,1]: +1 = snout */
    const u=(x+1)/2;/* fat at 0.62 (just behind head), thin at the tail stalk */
    const r=Math.pow(Math.sin(Math.PI*Math.pow(u,.85)),.75)*(u<.12?.55+u*3.6:1);const ry=.2*r+.03,rz=.115*r+.018;
    let yy=y*ry,zz=z*rz;if(y<0)yy*=.86;/* flatter belly */
    const xx=x*.5;const bend=.07*x*x-.035;/* slight body curve (sideways) */zz+=bend;
    P.setXYZ(i,xx,yy,zz);
    const t=(y+1)/2;/* 0 belly .. 1 back */if(t>.58)c.copy(side).lerp(back,Math.min(1,(t-.58)/.3));else if(t>.3)c.copy(belly).lerp(side,Math.min(1,(t-.3)/.14));else c.copy(belly).multiplyScalar(.95+.05*t);
    if(u>.86)c.lerp(snout,(u-.86)/.14*.6);col.push(c.r,c.g,c.b)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  /* scales + pale char spots: canvas over the sphere uv (u around, v along) */
  const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,128);
  x.strokeStyle='rgba(60,70,60,.28)';x.lineWidth=1.4;for(let yy=0;yy<128;yy+=6)for(let xx=(yy/6%2)*4;xx<256;xx+=8){x.beginPath();x.arc(xx,yy,4.5,.15*Math.PI,.85*Math.PI);x.stroke()}
  let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;x.fillStyle='rgba(255,236,200,.85)';for(let i=0;i<70;i++){const px=rnd()*256,py=20+rnd()*90;x.beginPath();x.arc(px,py,1.8+rnd()*1.6,0,7);x.fill()}
  /* gill line */x.strokeStyle='rgba(40,40,40,.45)';x.lineWidth=2.5;x.beginPath();x.moveTo(0,104);x.quadraticCurveTo(128,98,256,104);x.stroke();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  /* fins (flat shapes) */
  const shp=(pts)=>{const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i+=2)s.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);return new THREE.ShapeGeometry(s,6)};
  const tail=shp([[0,0],[-.12,.08],[-.24,.22],[-.2,.1],[-.17,0],[-.2,-.1],[-.24,-.22],[-.12,-.08],[0,0]]);
  const dorsal=shp([[-.09,0],[-.04,.17],[.05,.15],[.07,.05],[.1,0]]);
  const small=shp([[-.05,0],[-.03,.07],[.03,.06],[.04,.02],[.06,0]]);
  const pect=shp([[0,0],[-.06,.05],[-.16,.03],[-.1,-.02],[0,0]]);
  geoCache={body:g,tex,tail,dorsal,small,pect};return geoCache}
export function makeFish(THREE,o={}){const G=fishGeos(THREE);const f=new THREE.Group();
  const bodyM=new THREE.MeshStandardMaterial({vertexColors:true,map:G.tex,roughness:.38,metalness:.08});
  const finM=new THREE.MeshStandardMaterial({color:'#e2713a',roughness:.6,side:THREE.DoubleSide,transparent:true,opacity:.92}),finEdge=new THREE.MeshStandardMaterial({color:'#5d6f58',roughness:.6,side:THREE.DoubleSide});
  const body=new THREE.Mesh(G.body,bodyM);body.castShadow=true;f.add(body);
  const bz=x=>.07*(2*x)*(2*x)-.035;const tailG=new THREE.Group();tailG.position.set(-.48,0,bz(-.48));const tail=new THREE.Mesh(G.tail,finEdge);tailG.add(tail);f.add(tailG);
  const d=new THREE.Mesh(G.dorsal,finEdge);d.position.set(.05,.19,bz(.05));f.add(d);
  const ad=new THREE.Mesh(G.small,finEdge);ad.scale.setScalar(.6);ad.position.set(-.27,.08,bz(-.27));f.add(ad);
  const an=new THREE.Mesh(G.small,finM);an.rotation.x=Math.PI;an.position.set(-.22,-.08,bz(-.22));f.add(an);
  [-1,1].forEach(sd=>{const p=new THREE.Mesh(G.pect,finM);p.position.set(.25,-.1,.1*sd+bz(.25));p.rotation.set(sd*.5,0,-.3);f.add(p);
    const pv=new THREE.Mesh(G.pect,finM);pv.scale.setScalar(.7);pv.position.set(-.02,-.14,.05*sd+bz(-.02));pv.rotation.set(sd*.4,0,-.2);f.add(pv);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshStandardMaterial({color:'#e9d27a',roughness:.2}));eye.position.set(.38,.04,.075*sd+bz(.38));eye.scale.z=.5;f.add(eye);
    const pu=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),new THREE.MeshStandardMaterial({color:'#0b0b0b',roughness:.05,metalness:.3}));pu.position.set(.39,.042,(.075+.012)*sd+bz(.39));pu.scale.z=.5;f.add(pu)});
  /* mouth */const m=new THREE.Mesh(new THREE.TorusGeometry(.03,.008,6,12,Math.PI),new THREE.MeshStandardMaterial({color:'#3a2a24'}));m.position.set(.485,-.03,bz(.485));m.rotation.set(Math.PI/2,0,Math.PI/2);f.add(m);
  f.userData.tail=tailG;f.userData.wag=(t,a)=>{tailG.rotation.y=Math.sin(t)*(a==null?.5:a)};f.userData.isFish=1;
  if(o.scale)f.scale.setScalar(o.scale);return f}
/* 2D icon matching the 3D fish (counter, sell, feed buttons) */
export const FISH_SVG='<svg viewBox="0 0 72 40"><path d="M28 12c2-7 9-9 14-8l-2 7z" fill="#4d6650" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M14 20 2 8c3 6 3 18 0 24z" fill="#4d6650" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 20C22 8 46 6 66 18c1 2 1 3 0 4C46 34 22 32 12 20z" fill="#a9b8a2"/><path d="M12 20C22 8 46 6 66 18c-14-5-36-6-54 2z" fill="#3f5a46"/><path d="M14 22c10 8 34 10 52 0-1 1 0 0 0 0C46 34 22 32 14 22z" fill="#ff8a3d"/><path d="M12 20C22 8 46 6 66 18c1 2 1 3 0 4C46 34 22 32 12 20z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 26l-6 7 9-3z" fill="#e2713a" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M52 12c3 4 3 12 0 16" fill="none" stroke="#2d3a2d" stroke-width="1.6" opacity=".6"/><circle cx="58" cy="17" r="3.4" fill="#e9d27a"/><circle cx="58.6" cy="17" r="2" fill="#111"/><g fill="#ffecc8"><circle cx="30" cy="17" r="1.3"/><circle cx="38" cy="15" r="1.3"/><circle cx="24" cy="19" r="1.1"/><circle cx="44" cy="18" r="1.2"/><circle cx="34" cy="21" r="1.1"/></g></svg>';
