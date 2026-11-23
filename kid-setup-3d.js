/* Big 3D preview for the new-kid "make your explorer" screen (kid-setup.js). Same kid model + the same kid-look.js tint as the worlds
   (kid.glb with the face/skin/hair mask, on every screen size: the big preview needs the detailed model). Still pose from the walk clip, slow turn. mount(el) -> {set(look), dispose()} */
import * as THREE from './arctic3d/vendor/three.module.min.js';
import {GLTFLoader} from './arctic3d/vendor/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './arctic3d/vendor/jsm/libs/meshopt_decoder.module.js';
export async function mount(host,o={}){
  const R=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});R.setPixelRatio(Math.min(2,devicePixelRatio||1));R.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(R.domElement);const S=new THREE.Scene();const cam=new THREE.PerspectiveCamera(30,1,.05,50);
  S.add(new THREE.HemisphereLight(0xffffff,0x8090a0,1.6));const dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(2,4,3);S.add(dl);
  const LD=new GLTFLoader();LD.setMeshoptDecoder(MeshoptDecoder);
  const g=await LD.loadAsync('arctic3d/models/'+(o.phone?'kid_lo':'kid')+'.glb?v=7');const model=g.scene;S.add(model);
  /* still stand: the walk frame with the feet closest together */
  const walk=g.animations.find(a=>/walk/i.test(a.name))||g.animations[0];let mx=null;
  if(walk){mx=new THREE.AnimationMixer(model);const act=mx.clipAction(walk);act.play();const lf=model.getObjectByName('LeftFoot'),rf=model.getObjectByName('RightFoot');let best=0,bd=1e9;
    if(lf&&rf){const p=new THREE.Vector3(),q=new THREE.Vector3();for(let i=0;i<24;i++){const t=walk.duration*i/24;mx.setTime(t);model.updateMatrixWorld(true);lf.getWorldPosition(p);rf.getWorldPosition(q);const d=Math.abs(p.z-q.z)+Math.abs(p.x-q.x)*.2;if(d<bd){bd=d;best=t}}}
    mx.setTime(best);act.paused=true}
  model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),sz=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
  model.position.sub(new THREE.Vector3(c.x,box.min.y,c.z));
  /* frame head to mid-thigh so the face (eyes!) is big */
  const top=sz.y*1.04,bot=sz.y*.38,mid=(top+bot)/2,hh=(top-bot)/2;
  function fit(){const w=host.clientWidth||300,h=host.clientHeight||400;R.setSize(w,h,false);cam.aspect=w/h;const d=hh/Math.tan(cam.fov*Math.PI/360)*Math.max(1,(sz.x*.75)/(hh*2*cam.aspect)+.2)*1.12;
    cam.position.set(0,mid+hh*.08,d);cam.lookAt(0,mid,0);cam.updateProjectionMatrix()}
  fit();const ro=window.ResizeObserver?new ResizeObserver(fit):null;if(ro) ro.observe(host);
  const KL=window.SparkKidLook;let alive=true,t0=performance.now();
  function frame(){if(!alive) return;const t=(performance.now()-t0)/1000;model.rotation.y=Math.sin(t*.5)*.55;R.render(S,cam);requestAnimationFrame(frame)}frame();
  return {set(look){if(KL) KL.apply(THREE,model,look)},dispose(){alive=false;try{ro&&ro.disconnect()}catch(e){}try{R.dispose();R.forceContextLoss&&R.forceContextLoss()}catch(e){}R.domElement.remove()}};
}
