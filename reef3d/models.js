/* R7 (Allen 10/21): real CC0 glTF models (see models/LICENSE.txt) replace the code-built fish, ray, coral and decor.
   Everything is an UPGRADE: the code-built shape stays until the model has loaded, so nothing breaks if a file is slow or missing. */
import * as THREE from '../arctic3d/vendor/three.module.min.js';
import {GLTFLoader} from '../arctic3d/vendor/jsm/loaders/GLTFLoader.js';
import * as SU from '../arctic3d/vendor/jsm/utils/SkeletonUtils.js';
import {MeshoptDecoder} from '../arctic3d/vendor/jsm/libs/meshopt_decoder.module.js';
const BASE=new URL('./models/',import.meta.url).href,ABASE=new URL('../arctic3d/models/',import.meta.url).href;const LD=new GLTFLoader();LD.setMeshoptDecoder(MeshoptDecoder);const C={};
export function gl(n,arctic){const k=(arctic?'a:':'')+n;return C[k]||(C[k]=LD.loadAsync((arctic?ABASE:BASE)+n+'.glb?v=2').then(g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.metalness!==undefined)m.metalness=Math.min(m.metalness,.1);if(m.roughness!==undefined)m.roughness=Math.max(m.roughness,.55)})}});return g}))}
/* fit a clone: longest side (or height when byH) = size, sitting on y=0 (or centred when mid) */
export function fit(obj,size,{byH=false,mid=false,ry=0}={}){const w=new THREE.Group();obj.rotation.y=ry;w.add(obj);w.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj,true);const sz=b.getSize(new THREE.Vector3());const s=size/(byH?sz.y:Math.max(sz.x,sz.y,sz.z)||1);obj.scale.multiplyScalar(s);w.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(obj,true);const c=b2.getCenter(new THREE.Vector3());obj.position.x-=c.x;obj.position.z-=c.z;obj.position.y-=mid?c.y:b2.min.y;return w}
/* swap the children of a code-built group for the model, once it is ready */
export function upgrade(g,n,size,opt={},onReady){gl(n,opt.arctic).then(G=>{const src=opt.pick?opt.pick(G.scene):G.scene;const o=opt.skinned?SU.clone(src):src.clone(true);const w=fit(o,size,opt);g.children.slice().forEach(c=>{if(c.userData.keep)return;c.visible=false});w.userData.model=n;g.add(w);if(onReady)onReady(w,G)}).catch(e=>{try{(window.__sbxLog=window.__sbxLog||[]).push({kind:'r3dmodelerr',n,e:String(e).slice(0,80)})}catch(_){}})}
export const FISH={clown:'fish_clown',tang:'fish_tang',yellow:'fish_yellow',parrot:'fish_zebra',angel:'fish_mandarin',butter:'fish_butter'};
