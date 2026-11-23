/* Arctic 3D P4 look pass (Allen 10/20: "graphics must be much more, at least somewhat realistic"; play unchanged; northern lights
   untouched). Runs after the other world modules and only changes how things look:
   - real CC0 PBR textures (Poly Haven snow_02 / brown_planks_05 / rock_boulder_dry, stored in ./tex): snow with normal + roughness maps
     and sun glints, wood grain, rock; cut-snow block faces
   - image-based light: the sky is captured once into an environment map (reflections on ice, water, metal); dimmed at night
   - translucent blue lake ice, dark live water in the drilled hole, spruce with branch tiers, snowfall, softer + sharper shadows
   - quality tiers: snowfall/glints/2k shadows are dropped by the existing auto-quality steps on slow devices (?a3dq=0..4 forces one) */
import {FURS} from './models.js?v=10';
export function look(K){
  const {THREE,S,SI,R,cam,T,sun,skyU,log}=K;const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const DBG=(new URLSearchParams(location.search).get('a3dlk')||'').split(',');
  const TL=new THREE.TextureLoader(),TX={};/* P5: 1024px textures on capable screens (or when the top tier is forced with ?a3dq=0); 512px otherwise */
  const QS=new URLSearchParams(location.search).get('a3dq');const HI=QS!=null?(+QS===0):(Math.min(screen.width,screen.height)>=600&&(navigator.hardwareConcurrency||4)>2);
  const tex=(n,rep,srgb)=>{const t=TL.load(K.BASE+'tex/'+(HI?'hi/':'')+n+'.webp');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.anisotropy=8;ALLT.push(t);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t};
  /* P5b (Allen ok'd): falling snow removed for speed/loading; ?a3dsnow=1 brings it back */const OLDG=new URLSearchParams(location.search).get('a3dgrainold')==='1';/* evidence only: P5 grain settings for before/after stills */const SNOWF=OLDG||new URLSearchParams(location.search).get('a3dsnow')==='1';
  const NM=[],SN=[],ALLT=[];/* [material, normal map, tier at which it is dropped] */
  const G={time:{value:0},spark:{value:1},sunDir:{value:V(-14,18,10).normalize()}};
  /* ---- snow: albedo + normal + roughness, macro tone variation, glints that twinkle as the view moves */
  function snowify(m,rep,o){o=o||{};m.map=tex('snow_diff',rep,true);m.normalMap=tex('snow_nor',rep);m.normalScale=new THREE.Vector2(o.ns||(OLDG?.8:.35),o.ns||(OLDG?.8:.35));m.roughness=.88;m.metalness=0;NM.push([m,m.normalMap,3]);SN.push(m);m.defines=Object.assign(m.defines||{},{SNOWHQ:''});if(!m.vertexColors)m.color.set(o.col||'#ffffff');
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{gTime:G.time,gSpark:G.spark,gSun:G.sunDir});
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>','#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform float gTime,gSpark;uniform vec3 gSun;float gh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}float gn(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);float a=gh(vec3(i,0.)),b=gh(vec3(i+vec2(1,0),0.)),c=gh(vec3(i+vec2(0,1),0.)),d=gh(vec3(i+vec2(1,1),0.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}')
        .replace('#include <map_fragment>','#include <map_fragment>\n#ifdef SNOWHQ\n{diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.33))),.5);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.975,1.),.5);float mv=texture2D(map,vWP.xz*.011).g*1.6-.35;diffuseColor.rgb*=mix(vec3(.9,.94,1.),vec3(1.03,1.02,1.),mv);}\n#else\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.975,1.),.55);\n#endif')
        .replace('#include <opaque_fragment>','#ifdef SNOWHQ\nif(gSpark>.5){vec3 c=floor(vWP*38.);float h=gh(c);/* P5b: fewer, softer glints (less grain) */vec3 vd=normalize(cameraPosition-vWP);float tw=gh(c+floor(vd*9.));float gl=step('+(OLDG?'.9935':'.9975')+',h)*step(.6,tw)*pow(max(dot(normalize(vd+gSun),vec3(0.,1.,0.)),0.),2.)*smoothstep(40.,8.,length(cameraPosition-vWP));outgoingLight+=vec3(1.,.97,.92)*gl*'+(OLDG?'2.2':'1.1')+';}\n#endif\n#include <opaque_fragment>')};
    m.customProgramCacheKey=()=>'snow4'+(m.vertexColors?'v':'');m.needsUpdate=true;return m}
  const woodD=tex('wood_diff',[1,1],true),woodN=tex('wood_nor',[1,1]),woodR=tex('wood_rough',[1,1]);
  const wallN=tex('snow_nor',[1.5,1.5]),floorD=tex('wood_diff',[1,1],true),floorN=tex('wood_nor',[1,1]);
  const rockD=tex('rock_diff',[1,1],true),rockN=tex('rock_nor',[1,1]),rockR=tex('rock_rough',[1,1]);
  /* the shared canvas wood texture is swapped for the real one, so every wooden thing (made now or later: decor, sled, stall) gets it */
  {const img=new Image();img.onload=()=>{T.wood.image=img;T.wood.needsUpdate=true};img.src=K.BASE+'tex/wood_diff.webp'}
  /* ---- snow-block faces: the cut texture keeps its shading; the real snow normal map gives the carved grain */
  {const bm=K.IS.material;bm.normalMap=tex('snow_nor',[.5,.5]);bm.normalScale=new THREE.Vector2(.55,.55);bm.roughness=.9;bm.emissiveIntensity=.06;bm.needsUpdate=true}
  /* ---- environment map from the sky (one-time capture; reflections + soft ambient). Night dims it so the aurora sky stays as it was */
  let envT=null;if(!DBG.includes('noenv'))try{const pm=new THREE.PMREMGenerator(R);const es=new THREE.Scene();const sk=K.sky.clone();sk.material=K.sky.material;es.add(sk);
    const gnd=new THREE.Mesh(new THREE.CircleGeometry(100,24),new THREE.MeshBasicMaterial({color:'#e9eef5'}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-2;es.add(gnd);
    const n0=skyU.night.value;skyU.night.value=0;envT=pm.fromScene(es,.02,.1,200).texture;skyU.night.value=n0;pm.dispose()}catch(e){log('a3dlookerr',{e:String(e)})}
  const scenes=K.scenes;
  /* ---- per-material upgrades across all scenes (camp, igloo room, sled valley) */
  const done=new WeakSet();
  function upgrade(root){root.traverse(o=>{if(!o.isMesh||!o.material) return;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(done.has(m)||!m.isMeshStandardMaterial) return;done.add(m);
    const hex=m.color?m.color.getHexString():'';
    if(m.map===T.snow&&!DBG.includes('nosnow')){snowify(m,m===K.ground.material?[26,26]:[60,60],{ns:.55});return}
    if(m.flatShading&&/^(b8c4d2|b9c6d3|dfe8f3|8d96a3)$/.test(hex)){m.map=rockD;m.normalMap=rockN;NM.push([m,rockN,4]);m.roughness=1;m.color.set(hex==='dfe8f3'?'#eef3f8':'#c9cfd6');m.needsUpdate=true;return}
    if(m.map===T.wall){/* igloo inside: packed-snow block walls with real grain, warm lamp light picks it up */m.normalMap=wallN;m.normalScale=new THREE.Vector2(.7,.7);NM.push([m,wallN,4]);m.roughness=.9;m.needsUpdate=true;return}
    if(m.map===T.floor){/* floor: real wooden planks (paint still tints it) */m.map=floorD;m.normalMap=floorN;NM.push([m,floorN,4]);m.roughness=.8;m.color.lerp(new THREE.Color('#ffffff'),.35);m.needsUpdate=true;return}
    if(m.map===T.wood){m.normalMap=woodN;NM.push([m,woodN,4]);m.roughness=1;m.color.lerp(new THREE.Color('#ffffff'),.45);m.needsUpdate=true;return}
    if(/^(ffffff|f7fbff|f4fbff|e6f3ff|e3f3ff)$/.test(hex)&&!m.map&&!m.transparent&&m.roughness>=.35&&root!==SI){snowify(m,[2,2],{ns:.6});return}
    if(hex==='bfe0f5'){/* lake ice: clear blue, glossy, with frozen bubbles + cracks */m.map=iceTex();m.color.set('#a9d6f2');m.roughness=.12;m.metalness=0;fresnel(m,'#cfe3f7',.75);m.needsUpdate=true;return}
    if(hex==='cfe9fb'||hex==='cfe6f7'){m.color.set('#b6def7');m.roughness=.15;fresnel(m,'#eef7ff',.6);m.needsUpdate=true;return}
    if(hex==='0f3a5c'){/* open water in the hole: dark, mirror-like, rippling */m.color.set('#072235');m.roughness=.02;m.metalness=0;m.envMap=envT;m.envMapIntensity=1.8;m.normalMap=waterTex();m.normalScale=new THREE.Vector2(.12,.12);m.normalMap.repeat.set(1,1);m.needsUpdate=true;water.push(m);return}
    if(hex==='2f5d4a'){m.color.set('#27463a');m.roughness=.95;m.needsUpdate=true;return}
    if(m.metalness>=.4){m.envMap=envT;m.envMapIntensity=1.3;m.roughness=Math.min(m.roughness,.35);m.needsUpdate=true}
  })})}
  /* cheap reflection: grazing angles pick up the sky colour (no environment-map lookups: those cost too much on slow tablets) */
  function fresnel(m,col,k){const c=new THREE.Color(col);const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{sh.uniforms.frC={value:c};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 frC;').replace('#include <opaque_fragment>','{float f=pow(1.-saturate(dot(normalize(normal),normalize(vViewPosition))),3.);outgoingLight=mix(outgoingLight,frC*1.05,f*'+k.toFixed(2)+');}\n#include <opaque_fragment>')};m.customProgramCacheKey=()=>'fr'+k}
  let ICE=null;function iceTex(){if(ICE) return ICE;const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');const gr=g.createRadialGradient(256,256,30,256,256,256);gr.addColorStop(0,'#6fa9d4');gr.addColorStop(.7,'#9ccbe9');gr.addColorStop(1,'#e8f5ff');g.fillStyle=gr;g.fillRect(0,0,512,512);
    let s=3;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${.15+r()*.35})`;g.beginPath();g.arc(r()*512,r()*512,1+r()*3.5,0,7);g.fill()}
    g.strokeStyle='rgba(255,255,255,.55)';for(let i=0;i<14;i++){let x=256+(r()-.5)*300,y=256+(r()-.5)*300;g.lineWidth=.6+r()*1.4;g.beginPath();g.moveTo(x,y);for(let k=0;k<7;k++){x+=(r()-.5)*90;y+=(r()-.5)*90;g.lineTo(x,y)}g.stroke()}
    ICE=new THREE.CanvasTexture(c);ICE.colorSpace=THREE.SRGBColorSpace;return ICE}
  let WN=null;const water=[];function waterTex(){if(WN) return WN;const S2=128,c=document.createElement('canvas');c.width=c.height=S2;const g=c.getContext('2d'),im=g.createImageData(S2,S2);
    for(let y=0;y<S2;y++)for(let x=0;x<S2;x++){const a=x/S2*Math.PI*2,b=y/S2*Math.PI*2;const dx=Math.cos(a*3+b)*.5+Math.cos(a*5-b*2)*.3,dy=Math.cos(b*4+a)*.5+Math.sin(b*2-a*3)*.3;const o=(y*S2+x)*4;im.data[o]=(dx*.5+.5)*255;im.data[o+1]=(dy*.5+.5)*255;im.data[o+2]=230;im.data[o+3]=255}
    g.putImageData(im,0,0);WN=new THREE.CanvasTexture(c);WN.wrapS=WN.wrapT=THREE.RepeatWrapping;WN.repeat.set(2,2);return WN}

  /* ---- far mountains: real ridgelines (noisy, high-res) with rock on the steep faces and snow on the rest */
  S.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='ConeGeometry'&&o.count===26).forEach(mi=>{const g=new THREE.ConeGeometry(1,1,40,14);const P=g.attributes.position;const col=new Float32Array(P.count*3);const nz=(a,b)=>Math.sin(a*5.1+b*2.3)*.5+Math.sin(a*11.7-b*4.1)*.25+Math.sin(a*23.3+b*9.7)*.12;
    for(let i=0;i<P.count;i++){let x=P.getX(i),y=P.getY(i),z=P.getZ(i);const r=Math.hypot(x,z),a=Math.atan2(z,x),h=y+.5;if(r>1e-4){const k=1+.28*nz(a,h*3)*(1-h*.6);x*=k;z*=k}y+=.06*nz(a*2,h*7)*(1-h);P.setXYZ(i,x,y,z)}
    g.computeVertexNormals();const Nn=g.attributes.normal;for(let i=0;i<P.count;i++){const h=P.getY(i)+.5,ny=Nn.getY(i),a=Math.atan2(P.getZ(i),P.getX(i));const steep=ny<.42+.12*Math.sin(a*17+h*9);const snow=!steep||h>.82;const c=snow?[.93,.95,.98]:[.42+.06*Math.sin(a*31),.45,.5];col.set(c,i*3)}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));mi.geometry=g;mi.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true});done.add(mi.material)});
  /* ---- tent: canvas bell tent with seams, guy ropes, a dark doorway (replaces the orange cone; same spot, same footprint) */
  {const old=S.children.filter(o=>o.isMesh&&((o.geometry.type==='ConeGeometry'&&o.geometry.parameters.radius===2)||(o.geometry.type==='PlaneGeometry'&&o.position.distanceTo(V(-11.6,.7,-7.9))<.01)));
   if(old.length){old.forEach(o=>o.visible=false);const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#d8c7a4';g.fillRect(0,0,512,256);let sd=4;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    for(let i=0;i<5000;i++){g.fillStyle=`rgba(${120+r()*60|0},${100+r()*50|0},70,${r()*.08})`;g.fillRect(r()*512,r()*256,2,1)}g.strokeStyle='rgba(90,70,40,.45)';g.lineWidth=2;for(let i=0;i<12;i++){g.beginPath();g.moveTo(i*512/12,0);g.lineTo(i*512/12,256);g.stroke()}
    const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(60,40,20,.25)');gr.addColorStop(.3,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(80,60,40,.25)');g.fillStyle=gr;g.fillRect(0,0,512,256);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=THREE.RepeatWrapping;const cm=new THREE.MeshStandardMaterial({map:tx,roughness:.92,side:THREE.DoubleSide});done.add(cm);
    const T0=new THREE.Group();const wall=new THREE.Mesh(new THREE.CylinderGeometry(2.05,2.15,1,24,1,true),cm);wall.position.y=.5;T0.add(wall);const roof=new THREE.Mesh(new THREE.ConeGeometry(2.3,2,24,3,true),cm);roof.position.y=2;T0.add(roof);
    {const P=roof.geometry.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);if(y<.99&&y>-.99){const k=.94;P.setX(i,P.getX(i)*k);P.setZ(i,P.getZ(i)*k)}}roof.geometry.computeVertexNormals()}
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.5,8),new THREE.MeshStandardMaterial({color:'#6e4526',roughness:.8}));pole.position.y=3.15;T0.add(pole);
    const door=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.25),new THREE.MeshStandardMaterial({color:'#2a1f16',roughness:1}));door.position.set(0,.62,2.1);T0.add(door);
    const flap=new THREE.Mesh(new THREE.PlaneGeometry(.5,1.3),cm);flap.position.set(.6,.65,2.08);flap.rotation.y=-.5;T0.add(flap);
    const rope=new THREE.LineBasicMaterial({color:'#8a7a60'});for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;const pts=[V(Math.cos(a)*2.15,1.02,Math.sin(a)*2.15),V(Math.cos(a)*3.4,0,Math.sin(a)*3.4)];T0.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),rope));const pg=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.25,6),pole.material);pg.position.set(Math.cos(a)*3.4,.1,Math.sin(a)*3.4);T0.add(pg)}
    T0.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});T0.position.set(-12.5,0,-9);T0.lookAt(-8.5,0,-4);S.add(T0)}}
  /* ---- spruce: tier cones get drooping, ragged branch tips (same instances, same draw calls) */
  /* spark20 (Tester: Arctic trees 'very toy-like'): each spruce tier is a finer, shaggier cone - 28 branch tips that droop at the rim, a layered skirt, and baked colour: dark needles inside, lighter tips, and snow lying on the upper side of every tier */function spruceGeo(src,base){const p=src.parameters;const g=new THREE.ConeGeometry(p.radius,p.height,28,4,true);const P=g.attributes.position;const C=new Float32Array(P.count*3);const gC=new THREE.Color(base||'#2f5d4a'),dk=gC.clone().multiplyScalar(.62),lt=gC.clone().lerp(new THREE.Color('#6f9a5a'),.35),sn=new THREE.Color('#f1f6fb'),c=new THREE.Color();for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);const r=Math.hypot(x,z);const a=Math.atan2(z,x);const h=(y+p.height/2)/p.height;/* 0 rim .. 1 top */if(r>1e-4){const tipBand=h<.22?1:0;const k=1+.2*Math.sin(a*14)*(.35+tipBand*.65)+.07*Math.sin(a*31+y*5)+.05*Math.sin(h*18)*(1-h);P.setXYZ(i,x*k,y-(tipBand?(.14*p.height*(.5+.5*Math.sin(a*14))):0),z*k)}
      c.copy(dk).lerp(lt,Math.min(1,(1-h)*.9+.1*Math.sin(a*14)));const snow=Math.max(0,Math.min(1,(h-.25)*1.8))*(.55+.45*Math.sin(a*5+h*9))+(h>.9?.4:0);if(snow>.35)c.lerp(sn,Math.min(.92,snow));C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeVertexNormals();return g}const treeMats=new Map();
  function trees(root){root.traverse(o=>{if(!o.isMesh||!o.geometry||o.geometry.type!=='ConeGeometry'||done.has(o.geometry)) return;const hex=o.material&&o.material.color&&o.material.color.getHexString();if(!/^(2f5d4a|27463a)$/.test(hex||'')) return;const p=o.geometry.parameters;if(p.radialSegments>12) return;
    const old=o.geometry;const g=spruceGeo(old,'#'+hex);{const om=o.material;if(!treeMats.has(om)){const nm=om.clone();nm.color.set('#ffffff');nm.vertexColors=true;nm.roughness=.92;treeMats.set(om,nm)}o.material=treeMats.get(om)}/* keep any pre-translate (sled trees are shifted up) */old.computeBoundingBox();g.computeBoundingBox();g.translate(0,old.boundingBox.min.y-g.boundingBox.min.y-(old.boundingBox.min.y===-p.height/2?0:0),0);o.geometry=g;done.add(g);
    })}
  /* ---- snowfall: a box of flakes that follows the camera, wrapped in the vertex shader (one draw call) */
  const NF=1400;const fg=new THREE.BufferGeometry();{const a=new Float32Array(NF*3),r=new Float32Array(NF);for(let i=0;i<NF;i++){a[i*3]=Math.random()*40-20;a[i*3+1]=Math.random()*22;a[i*3+2]=Math.random()*40-20;r[i]=Math.random()}fg.setAttribute('position',new THREE.BufferAttribute(a,3));fg.setAttribute('rnd',new THREE.BufferAttribute(r,1))}
  const fU={t:G.time,cp:{value:V()},pr:{value:R.getPixelRatio()},night:skyU.night};
  const fm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:fU,vertexShader:'attribute float rnd;uniform float t,pr;uniform vec3 cp;varying float a;void main(){vec3 p=position;p.y=mod(p.y-t*(0.9+rnd*.7),22.)-6.;p.x+=sin(t*.7+rnd*30.)*.6+t*.25;p.z+=cos(t*.5+rnd*20.)*.5;vec3 w=cp+mod(p-cp+20.,40.)-20.;w.y=cp.y+p.y-4.;vec4 mv=viewMatrix*vec4(w,1.);gl_Position=projectionMatrix*mv;float d=-mv.z;gl_PointSize=clamp((2.2+rnd*2.6)*pr*30./d,1.,8.*pr);a=smoothstep(1.,3.,d)*smoothstep(30.,14.,d);}',
    fragmentShader:'uniform float night;varying float a;void main(){vec2 q=gl_PointCoord-.5;float r=dot(q,q);if(r>.25)discard;gl_FragColor=vec4(mix(vec3(1.),vec3(.75,.85,1.),night),a*(1.-r*4.)*.85);}'});
  const flakes=new THREE.Points(fg,fm);flakes.frustumCulled=false;flakes.renderOrder=5;S.add(flakes);const flakes2=flakes.clone();
  /* ---- shadows: sharper, wider-res at the top tier */
  const suns=[];scenes.forEach(sc=>sc.traverse(o=>{if(o.isDirectionalLight&&o.castShadow)suns.push(o)}));const sunSz=n=>{suns.forEach(L=>{if(L.shadow.mapSize.x!==n){L.shadow.mapSize.set(n,n);if(L.shadow.map){L.shadow.map.dispose();L.shadow.map=null}}})};
  /* ---- quality tiers: hooked to the existing auto-quality steps */
  FURS.forEach(m=>NM.push([m,m.normalMap,4]));
  function tier(){const lv=K.Q.level;flakes.visible=flakes2.visible=SNOWF&&lv<2;G.spark.value=lv<2?1:0;sunSz(lv===0?2048:1024);ALLT.forEach(t=>{const a=OLDG?(lv>=3?1:lv>=1?4:8):lv>=5?2:lv>=4?4:8;/* P5b: keep anisotropic filtering high on every tier (less shimmer/grain) */if(t.anisotropy!==a){t.anisotropy=a;t.needsUpdate=true}});SN.forEach(m=>{const hq=lv<3;if(('SNOWHQ' in m.defines)!==hq){if(hq)m.defines.SNOWHQ='';else delete m.defines.SNOWHQ;m.needsUpdate=true}});NM.forEach(([m,n,t])=>{const want=lv>=t?null:n;if(m.normalMap!==want){m.normalMap=want;m.needsUpdate=true}});fU.pr.value=R.getPixelRatio()}
  K.onQuality=(K.onQuality||[]);K.onQuality.push(tier);
  const fq=new URLSearchParams(location.search).get('a3dq');if(fq!=null){const n=Math.max(0,Math.min(7,+fq|0));while(K.Q.level<n&&K.qualityDown)K.qualityDown()}
  /* first visit on a weak device (2 cores or less): start one tier down instead of waiting for the frame counter */
  if(fq==null&&(navigator.hardwareConcurrency||4)<=2&&K.qualityDown)K.qualityDown();
  /* ---- apply now and whenever things are added later (rooms, decor, sled props) */
  scenes.forEach(sc=>{if(!DBG.includes('noup'))upgrade(sc);trees(sc)});const sled=scenes.find(sc=>sc!==S&&sc!==SI&&sc.fog);if(sled){sled.add(flakes2)}
  let n0=0;K.updates.push((dt,now)=>{G.time.value=now/1000;fU.cp.value.copy(cam.position);const night=skyU.night.value;/* night = the northern lights view: no snowfall or glints there, so the aurora looks exactly as before */flakes.visible=flakes2.visible=SNOWF&&K.Q.level<2&&night<.05;G.spark.value=K.Q.level<2&&night<.05?1:0;
    water.forEach(m=>{m.normalMap.offset.set(now*.00004,now*.00003)});G.sunDir.value.copy(sun.position).normalize();
    if(++n0%120===0&&!DBG.includes('noup')){scenes.forEach(sc=>upgrade(sc))}});
  K.afterBuild=r=>{upgrade(r)};
  tier();log('a3dlook',{env:!!envT,tier:K.Q.level});
  K.probes=Object.assign(K.probes||{},{look:()=>({env:!!envT,flakes:flakes.visible,spark:G.spark.value,shadow:sun.shadow.mapSize.x,level:K.Q.level})});
}
