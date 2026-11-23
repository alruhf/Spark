/* P28 perf: split big instanced sets (grass) into spatial chunks so the renderer frustum-culls them,
   hide far chunks, and thin them on slow devices (fps-adaptive). Savannah only. */
export function makeChunker(THREE,S,{cell=28}={}){
  const all=[];let thin=1;const tagK={};
  function build(geo,mat,items,{maxD=90,tag='g'}={}){/* items: [{m:Matrix4,c?:Color,x,z}] */
    const cells=new Map();items.forEach(it=>{const k=Math.floor(it.x/cell)+','+Math.floor(it.z/cell);let a=cells.get(k);if(!a)cells.set(k,a=[]);a.push(it)});
    const grp=new THREE.Group();grp.name='chunks-'+tag;
    cells.forEach(a=>{/* shuffle so a truncated .count thins evenly */for(let i=a.length-1;i>0;i--){const j=(i*7919+13)%(i+1);const t=a[i];a[i]=a[j];a[j]=t}
      const im=new THREE.InstancedMesh(geo,mat,a.length);let cx=0,cz=0;const hasC=a.some(it=>it.c);
      a.forEach((it,i)=>{im.setMatrixAt(i,it.m);if(hasC)im.setColorAt(i,it.c||new THREE.Color(1,1,1));cx+=it.x;cz+=it.z});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();im.frustumCulled=true;
      im.userData.ch={n:a.length,x:cx/a.length,z:cz/a.length,maxD,tag};all.push(im);grp.add(im)});
    S.add(grp);return grp}
  let f=0;const cp=new THREE.Vector3();
  function tick(cam){if((f++&7)!==0)return;cam.getWorldPosition(cp);all.forEach(im=>{const u=im.userData.ch;const d=Math.hypot(u.x-cp.x,u.z-cp.z);const vis=d<u.maxD*(tagK[u.tag]??1)+cell*.75&&(tagK[u.tag]??1)>0;im.visible=vis;if(vis){/* far chunks sparser */const k=d<30?1:d<55?.7:.45;im.count=Math.max(1,Math.floor(u.n*k*thin))}})}
  function setThin(v){thin=v}
  /* P30: per-tag distance scale (0 hides the set) for low-gfx */function setTag(tag,k){tagK[tag]=k;f=0}
  function stats(){let vis=0,inst=0;all.forEach(im=>{if(im.visible){vis++;inst+=im.count}});return {chunks:all.length,vis,inst,thin}}
  return {build,tick,setThin,setTag,stats}
}

/* P30 perf: per-instance view culling for static decoration InstancedMeshes (trees, rocks, mounds).
   Keeps one draw call per set but only feeds the GPU the instances near/in front of the camera. */
export function makeInstCull(THREE){
  const sets=[];const fr=new THREE.Frustum(),pm=new THREE.Matrix4(),cp=new THREE.Vector3(),sp=new THREE.Sphere(),m4=new THREE.Matrix4();let f=0,maxD=210;
  function add(im){if(!im||!im.isInstancedMesh||im.userData.icull)return;const n=im.count;if(n<8)return;const g=im.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
    const M=new Float32Array(im.instanceMatrix.array.slice(0,n*16));const C=im.instanceColor?new Float32Array(im.instanceColor.array.slice(0,n*3)):null;const P=new Float32Array(n*4);
    for(let i=0;i<n;i++){m4.fromArray(M,i*16);sp.copy(g.boundingSphere).applyMatrix4(m4);P[i*4]=sp.center.x;P[i*4+1]=sp.center.y;P[i*4+2]=sp.center.z;P[i*4+3]=sp.radius}
    im.userData.icull={n,M,C,P};im.frustumCulled=false;sets.push(im)}
  function tick(cam,every=2){if((f++%every)!==0)return;cam.updateMatrixWorld();pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pm);cam.getWorldPosition(cp);
    for(const im of sets){const u=im.userData.icull;const A=im.instanceMatrix.array,AC=im.instanceColor&&u.C?im.instanceColor.array:null;let k=0;
      for(let i=0;i<u.n;i++){const x=u.P[i*4],y=u.P[i*4+1],z=u.P[i*4+2],r=u.P[i*4+3];const d=Math.hypot(x-cp.x,z-cp.z);if(d-r>maxD)continue;
        sp.center.set(x,y,z);sp.radius=r+6+d*.22;/* generous margin so a turning camera never shows a gap between refreshes */if(!fr.intersectsSphere(sp))continue;
        for(let j=0;j<16;j++)A[k*16+j]=u.M[i*16+j];if(AC)for(let j=0;j<3;j++)AC[k*3+j]=u.C[i*3+j];k++}
      im.count=k;im.instanceMatrix.needsUpdate=true;if(AC)im.instanceColor.needsUpdate=true}}
  function setMax(d){maxD=d;f=0}
  function stats(){return sets.map(im=>[im.count,im.userData.icull.n])}
  return {add,tick,setMax,stats,sets}
}
