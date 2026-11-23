const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE='http://127.0.0.1:8765/';
const SHOT='/workspace/looks/e/shots/s37/s47-local-83';
const LIVE='/workspace/p32work/spark37/proof-logs/s47-local-83b-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
async function shot(pg,n){const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p,timeout:60000});flog('SHOT',p);return p}
async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{const els=[...document.querySelectorAll(s)];let best=null,area=0;
    for(const e of els){const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}}return best},sel);
  if(!box)return null; if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y); return box;
}
async function skipOverlay(pg,touch){
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  for(const sel of ['button.ks-age','button.ks-go','.sh3d-skip','.s3d-skip']) await clickSel(pg,sel,touch).catch(()=>{});
}
async function launch(w,h,touch){
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1});
  const pg=await ctx.newPage(); pg.setDefaultTimeout(60000);
  const url=BASE+'?fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000}); await sleep(600);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(250)}
  return {br,pg};
}
async function enterEgypt(pg,touch){
  await skipOverlay(pg,touch);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{}); await sleep(200);
  await clickSel(pg,'a.body.earth',touch); await sleep(1200);
  if(!await clickSel(pg,'button[data-c="Africa"],[data-c="Africa"]',touch)) await pg.evaluate(()=>{const e=document.querySelector('[data-c="Africa"]');if(e)e.click()});
  await sleep(1200);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) await pg.evaluate(()=>{const e=document.querySelector('[data-env="Sahara"]');if(e)e.click()});
  const t0=Date.now();
  while(Date.now()-t0<60000){
    await skipOverlay(pg,touch);
    const ok=await pg.evaluate(()=>{const ld=document.querySelector('.eg3d-load');const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);return !!(window.__eg3d&&!loadOn)});
    if(ok){await sleep(400);await clickSel(pg,'.eg3d-mapx',touch).catch(()=>{});return true}
    await sleep(400);
  }
  return false;
}

async function run(tag,w,h,touch){
  flog('====',tag);
  const {br,pg}=await launch(w,h,touch);
  try{
    const ok=await enterEgypt(pg,touch); flog(tag,'entered',ok); if(!ok) return;
    /* P5 cine immediately */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-33,12);else if(G.jump)G.jump(-33,12)}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:5,st:'plague',t:Date.now(),tabs:5,need:5,painted:[],paid:[1,2,3,4],auto:0})}catch(e){}
    });
    await sleep(400); await shot(pg,tag+'-p5-cine-a');
    await sleep(600); await shot(pg,tag+'-p5-cine-b');
    const p5=await pg.evaluate(()=>{
      const G=window.__eg3d||{}; const at=G.kidAt?G.kidAt():null;
      const cs=G.cowSolids?G.cowSolids():[];
      const d=cs.map(c=>Math.hypot(c[0]-(at&&at[0]||0),c[1]-(at&&at[2]||0))).sort((a,b)=>a-b);
      const st=(G.state&&G.state().mis)||{};
      return {kid:at,st:st.st,nSolids:cs.length,minD:d[0]||null,nearest:d.slice(0,4).map(x=>+x.toFixed(2)),flag:!!G._cowCam||!!(G._fxCine&&G._fxCine.flag==='_cowCam')};
    });
    flog(tag,'p5',JSON.stringify(p5));

    /* P8 cine immediately */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-16,3);else if(G.jump)G.jump(-16,3)}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:8,st:'plague',t:Date.now(),tabs:8,need:5,painted:[],paid:[1,2,3,4,5,6,7],auto:0})}catch(e){}
    });
    await sleep(500); await shot(pg,tag+'-p8-cine-a');
    await sleep(700); await shot(pg,tag+'-p8-cine-b');
    const p8=await pg.evaluate(()=>{
      const G=window.__eg3d||{}; const at=G.kidAt?G.kidAt():null;
      const kidScr=at&&G.scrP?G.scrP(at[0],(at[1]||0)+1,at[2]):null;
      const onKid=kidScr&&kidScr.x>8&&kidScr.x<innerWidth-8&&kidScr.y>8&&kidScr.y<innerHeight-8&&(kidScr.z==null||kidScr.z<1);
      return {kid:at,onKid,kidScr,dist:G.camS&&G.camS.dist,flag:!!G._hornCam||!!(G._fxCine&&G._fxCine.flag==='_hornCam'),st:(G.state&&G.state().mis||{}).st};
    });
    flog(tag,'p8',JSON.stringify(p8));
  }catch(e){flog('ERR',tag,String(e&&e.stack||e)); try{await shot(pg,tag+'-err')}catch(_){}}
  finally{try{await br.close()}catch(_){}}
}
(async()=>{
  fs.writeFileSync(LIVE,'83b start\n');
  await run('1280',1280,715,false);
  await run('390',390,844,true);
  flog('DONE');
})();
