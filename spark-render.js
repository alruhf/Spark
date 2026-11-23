/* Spark render-quality standard (spark18, Allen 11/16: "Savannah looks grainy compared to the other worlds - match its resolution
   to Arctic, and use that same standard for future builds"). Baseline = Arctic 3D (arctic3d/a3d.js + post.js + look.js).
   Shared by the 3D worlds (Arctic, Savannah; Reef uses the DPR cap). Pure numbers + small helpers, no three.js import.
   Written down in spark18/RENDER-STANDARD.md - change the numbers HERE, not inside a world. */
export const RENDER_STD=Object.freeze({
  v:1,
  dprCap:2,                       /* start pixel ratio = min(devicePixelRatio, 2) on every device (phone, tablet, desktop) */
  ladder:Object.freeze([1.5,1,.75,.6,.5]), /* slow device: the pixel ratio comes down ONE step at a time through these caps (Arctic levels 3..7) */
  floor:.5,                       /* never below 0.5x CSS pixels */
  dropFps:28,                     /* a step down needs 2 measured windows in a row under 28 fps ... */
  dropWindows:2,
  cooldownMs:1800,                /* ... and at least 1.8 s since the last step */
  order:Object.freeze(['shadows','effects','resolution']), /* shadows go first, then effects/detail; resolution only after those */
  aa:'always',                    /* edges antialiased on every tier: MSAA (antialias:true) or a post AA pass (SMAA/FXAA) */
  anisotropy:8,                   /* image textures; small canvas textures 4 */
  toneMapping:'ACESFilmic',outputColorSpace:'srgb',shadowType:'PCFSoft'
});
/* start pixel ratio for this device (q = a test-only override such as ?a3dpr=) */
export function startPR(q){const d=(typeof window!=="undefined"&&window.devicePixelRatio)||1,n=+q;return n>0?n:Math.min(d,RENDER_STD.dprCap)}
/* the pixel-ratio rungs for a world: [start, ...standard caps below start], optional higher floor (Savannah desktop: 720 px short side) */
export function prLadder(start,o){o=o||{};const L=[+start];for(const v of RENDER_STD.ladder)if(v<L[L.length-1]-1e-3&&v>=RENDER_STD.floor-1e-3)L.push(v);
  const f=o.floorPR;if(f&&f<start-1e-3){const k=L.filter((v,i)=>i===0||v>=f-1e-3);if(k[k.length-1]>f+1e-3)k.push(+f.toFixed(3));return k}return L}
/* Arctic's step caps by quality level (level 3 -> 1.5 ... level 7 -> 0.5); levels 1-2 keep the resolution */
export function capForLevel(level){const i=level-3;return i>=0?RENDER_STD.ladder[Math.min(i,RENDER_STD.ladder.length-1)]:Infinity}
if(typeof window!=='undefined')window.SparkRender=Object.assign(window.SparkRender||{},{std:RENDER_STD,startPR,prLadder,capForLevel,worlds:(window.SparkRender&&window.SparkRender.worlds)||{}});
