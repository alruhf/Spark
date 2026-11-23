/* Big savanna (explore by truck): pure layout + height functions shared by the engine and explore.js.
   Refuge sits in the middle (walkable r 44 round (0,8)); the truck may roam to r BIG round the same centre. */
export const BIG=230,WALK_C={x:0,z:8};
export const RIVER={z0:-96,amp:20,k:.018,w:8};
export const riverZ=x=>RIVER.z0+RIVER.amp*Math.sin(x*RIVER.k)+6*Math.sin(x*.047+1.3);
/* bridge spans the river at x≈0 — only legal truck crossing */
export const BRIDGE={x:0,z:riverZ(0),halfW:5.5,halfL:RIVER.w*1.15+3};
export const HOLE={x:96,z:72,r:15};
export const CRATER={x:30,z:190,R:40};
export const KOPJES=[{x:-112,z:58,r:15,h:6},{x:132,z:-38,r:13,h:5},{x:-62,z:150,r:12,h:5},{x:-160,z:-30,r:11,h:4}];
export const BAOBABS=[{x:150,z:40},{x:-30,z:-60},{x:-150,z:120},{x:80,z:140},{x:180,z:-120},{x:-90,z:-150}];
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
/* extra height for everything outside the refuge (0 inside r 48) */
export function farH(x,z){const rc=Math.hypot(x-WALK_C.x,z-WALK_C.z);const out=ss(40,78,rc);if(out<=0)return 0;/* gentler playable↔far blend */
  let y=(Math.sin(x*.021+.7)*1.6+Math.cos(z*.017)*1.4+Math.sin((x-z)*.011)*2.2)*out;
  /* river bed */const dz=Math.abs(z-riverZ(x));y-=3.2*(1-ss(RIVER.w*.45,RIVER.w*1.6,dz))*out;
  /* big watering hole bowl */const dh=Math.hypot(x-HOLE.x,z-HOLE.z);y-=2.4*(1-ss(HOLE.r-4,HOLE.r+5,dh));
  /* crater: raised rim, sunken floor */const dc=Math.hypot(x-CRATER.x,z-CRATER.z);y+=11*Math.exp(-Math.pow((dc-CRATER.R)/9,2))-4*(1-ss(CRATER.R-14,CRATER.R-4,dc));
  /* kopjes: granite hills */for(const k of KOPJES){const d=Math.hypot(x-k.x,z-k.z);y+=k.h*(1-ss(k.r*.3,k.r,d))}
  /* far edge: hills close the world softly */y+=Math.max(0,rc-BIG+10)*.35;return y}
export const isRiver=(x,z)=>Math.abs(z-riverZ(x))<RIVER.w*.6;
export function onBridge(x,z){return Math.abs(x-BRIDGE.x)<BRIDGE.halfW&&Math.abs(z-BRIDGE.z)<BRIDGE.halfL;}
export const isWater=(x,z)=>isRiver(x,z)||Math.hypot(x-HOLE.x,z-HOLE.z)<HOLE.r-1||Math.hypot(x-CRATER.x,z-CRATER.z)<CRATER.R-22;
/* discovery spots (kid finds them by driving close, or by binoculars for the far-only ones) */
export const DISC=[
 {id:'zebraherd',x:-78,z:20,n:'Zebra herd',far:false},
 {id:'giraffes',x:-38,z:112,n:'Giraffe group',far:false},
 {id:'elephants',x:HOLE.x-10,z:HOLE.z-14,n:'Elephants at the water',far:false},
 {id:'hippos',x:-55,z:0,n:'Hippos in the river',far:false},
 {id:'warthogs',x:70,z:-30,n:'Warthog family',far:false},
 {id:'birds',x:CRATER.x,z:CRATER.z,n:'Pink birds in the crater',far:false},
 {id:'baobab',x:150,z:40,n:'Giant baobab',far:false},
 {id:'lions',x:132,z:-38,n:'Lions on the rocks',far:true},
 {id:'crocs',x:-120,z:0,n:'Crocodiles by the river',far:true}];
DISC.find(d=>d.id==='hippos').z=riverZ(-55);DISC.find(d=>d.id==='crocs').z=riverZ(-120)+5;
/* ===== P28 natural terrain + dirt tracks (pure data/functions; Savannah only) ===== */
const hsh=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295};
export function vnoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j;const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hsh(i,j),b=hsh(i+1,j),c=hsh(i,j+1),d=hsh(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
export const fbm=(x,z)=>vnoise(x,z)*.55+vnoise(x*2.03+17,z*2.03-9)*.3+vnoise(x*4.1-31,z*4.1+5)*.15;
/* gentle natural undulation (0 inside the camp yard, full on the open plain, eased off at the river bed) */
export function undul(x,z){const r=Math.hypot(x,z);const out=ss(13,26,r);if(out<=0)return 0;const rv=ss(RIVER.w*.6,RIVER.w*2.6,Math.abs(z-riverZ(x)));const br=ss(6,16,Math.hypot(x-BRIDGE.x,z-BRIDGE.z))*ss(HOLE.r+2,HOLE.r+12,Math.hypot(x-HOLE.x,z-HOLE.z))*ss(CRATER.R+2,CRATER.R+12,Math.hypot(x-CRATER.x,z-CRATER.z));return((fbm(x/22,z/22)-.5)*1.5+(vnoise(x/7+40,z/7-12)-.5)*.35)*out*rv*br}
/* dirt tracks (control points, xz). They follow the real auto-drive legs (arch → fence corners → rescue sites) with gentle curves */
const GZ=-18;
export const TRACKS=[
 {id:'yard',w:3.2,pts:[[-2.5,-12.5],[-1.2,-15.2],[0,-18],[0,-23.5]]},
 {id:'west',w:3.4,pts:[[0,-23.5],[-7.5,-23.4],[-14.6,-22.2],[-16.2,-12],[-15.4,0],[-16,9],[-15.5,14.8],[-26,18.4],[-40,19.6],[-56,22.6],[-72,24]]},
 {id:'east',w:3.4,pts:[[0,-23.5],[8,-23.4],[19.6,-22.2],[21.2,-10],[20.4,2],[21,10],[20.5,14.8],[32,26],[44,38],[54,47],[62,55],[78,61],[88,66]]},
 {id:'hippo',w:3.0,pts:[[-7.5,-23.4],[-18,-25.6],[-30,-26],[-41,-28.2],[-52,-28]]},
 {id:'south',w:3.6,pts:[[0,-23.5],[1.8,-36],[-1.6,-52],[1.2,-64],[0,-71],[0,-77.6]]},/* P34: straight run-in onto the deck axis */
 {id:'south2',w:3.6,pts:[[0,-102.8],[0,-109.5],[2.4,-118],[-3,-136],[3,-158],[-2,-185]]}];
const cr=(p0,p1,p2,p3,t)=>{const t2=t*t,t3=t2*t;return[.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]};
/* dense centre-line samples (~1 m) for each track */
export const TRACK_LINES=TRACKS.map(T=>{const P=T.pts,out=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];const L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]);const n=Math.max(2,Math.ceil(L/1));for(let k=0;k<n;k++)out.push(cr(p0,p1,p2,p3,k/n))}out.push(P[P.length-1]);return{id:T.id,w:T.w,line:out}});
/* real auto-drive legs (straight), used to keep props off the routes */
export const ROUTE_LEGS=[[[0,-23.5],[-15.5,-22.5]],[[-15.5,-22.5],[-15.5,14.8]],[[-15.5,14.8],[-72,24]],[[0,-23.5],[20.5,-22.5]],[[20.5,-22.5],[20.5,14.8]],[[20.5,14.8],[62,55]],[[0,-23.5],[-52,-28]],[[0,-23.5],[0,-77]],[[0,-12],[0,-23.5]]];
const segD=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz||1;const u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/L2));return Math.hypot(x-a[0]-dx*u,z-a[1]-dz*u)};
/* distance to the nearest track centre-line (returns {d, w}) */
/* bucketed segments (8 m cells) so per-vertex lookups stay cheap on phones; distances beyond ~12 m report as 99 */
const TB=new Map(),CS=8;TRACK_LINES.forEach(T=>{const L=T.line;for(let i=0;i<L.length-1;i++){const a=L[i],b=L[i+1];const x0=Math.floor((Math.min(a[0],b[0])-12)/CS),x1=Math.floor((Math.max(a[0],b[0])+12)/CS),z0=Math.floor((Math.min(a[1],b[1])-12)/CS),z1=Math.floor((Math.max(a[1],b[1])+12)/CS);for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){const k=cx*4096+cz;let v=TB.get(k);if(!v)TB.set(k,v=[]);v.push([a,b,T.w])}}});
export function trackDist(x,z){const v=TB.get(Math.floor(x/CS)*4096+Math.floor(z/CS));let d=99,w=3.4;if(v)for(const [a,b,tw] of v){const e=segD(x,z,a,b);if(e<d){d=e;w=tw}}return{d,w}}
export function routeDist(x,z){let d=1e9;for(const [a,b] of ROUTE_LEGS)d=Math.min(d,segD(x,z,a,b));return d}
/* keep props off tracks and auto-drive legs */
export const offRoad=(x,z,m)=>{m=m||0;return trackDist(x,z).d>3.2+m&&routeDist(x,z)>3.6+m};
