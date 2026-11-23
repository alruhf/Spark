/* Prove P10 door painting from the palace (the hand9 1280 failure mode)
   at 1280 and 390 on 750y9do3h. testfast+misSet+jumpP only to start each
   approach in st=paint with the kid at a known spot. Walks are pin or
   leavePalace+door lane (no teleports during the paint). One 1280 case
   replays the old harness (no leavePalace, 700ms pin) to reproduce the stall. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-750y9do3h-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/p10-proof-750y9do3h';
const LIVE=process.env.LIVE||'/tmp/s37p10-proof-live.log';
const REPORT=process.env.REPORT||'/tmp/s37p10-proof-report.json';
const ISH=[[-52,-8],[-47,-9],[-42,-9],[-37,-9],[-32,-8]];
const out={checks:[],shots:[],cases:[],err:null,url:BASE};
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
const rec=(n,ok,extra)=>{out.checks.push(Object.assign({n,ok:!!ok},extra||{}));flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};
async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p});out.shots.push(p);flog('SHOT',p);return p}

async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')continue;
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}
    }
    return best;
  },sel);
  if(!box)return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return true;
}
async function clickText(pg,re,touch){
  const box=await pg.evaluate(r=>{const rx=new RegExp(r,'i');
    const els=[...document.querySelectorAll('button,a,[data-env],[data-c],.africa-region,.continent-region,.cont,[data-name]')];
    for(const e of els){const t=(e.textContent||e.getAttribute('data-env')||e.getAttribute('data-c')||e.getAttribute('data-name')||'').trim();
      if(!rx.test(t))continue;const b=e.getBoundingClientRect();const st=getComputedStyle(e);
      if(b.width<2||b.height<2||st.display==='none'||st.visibility==='hidden')continue;
      return {x:b.left+b.width/2,y:b.top+b.height/2}}
    return null},re);
  if(!box)return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return true;
}
async function skipOverlay(pg,touch){
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"],.sh3d-shopx,.sh3d-bookx,.sh3d-closex',touch).catch(()=>{});
  const age=await pg.evaluate(()=>{const b=document.querySelector('button.ks-age');if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
  if(age){if(touch) await pg.touchscreen.tap(age.x,age.y); else await pg.mouse.click(age.x,age.y); await sleep(500)}
  const go=await pg.evaluate(()=>{const b=document.querySelector('button.ks-go');if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
  if(go){if(touch) await pg.touchscreen.tap(go.x,go.y); else await pg.mouse.click(go.x,go.y); await sleep(600)}
  for(const sel of ['.sh3d-skip','.s3d-skip','.s3d-retry button','.eg3d-retry button','.eg3d-dskip:not(.eg3d-askip)']) await clickSel(pg,sel,touch).catch(()=>{});
}
async function waitG(pg,key,touch,ms=45000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await skipOverlay(pg,touch);
    const st=await pg.evaluate(k=>{
      const ld=document.querySelector(k==='eg3d'?'.eg3d-load':'.s3d-load');
      const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);
      const g=window['__'+k];
      return {loadOn,has:!!(g&&(g.cam||g.scrP||g.K||g.kid||g.state))};
    },key);
    if(st.has&&!st.loadOn) return true;
    await sleep(400);
  }
  return false;
}
async function launch(w,h,touch){
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const hdrs=TOK&&BASE.startsWith('https')?{'x-vercel-trusted-oidc-idp-token':TOK}:{};
  const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1,extraHTTPHeaders:hdrs});
  if(TOK&&BASE.startsWith('https')){
    const root=BASE.replace(/\/$/,'');
    await ctx.route(u=>String(u.href||u).startsWith(root), r=>r.continue({headers:{...r.request().headers(),'x-vercel-trusted-oidc-idp-token':TOK}}));
  }
  const pg=await ctx.newPage();
  const jsErrors=[];
  pg.on('pageerror', e=>{const s=String(e&&e.stack||e);jsErrors.push({type:'pageerror',s});flog('PAGEERROR',s)});
  pg.on('console', msg=>{if(msg.type()!=='error')return;const s=msg.text();if(/ReferenceError|is not defined/.test(s)){jsErrors.push({type:'console',s});flog('CONSOLEERROR',s)}});
  pg.setDefaultTimeout(20000);
  const join=BASE.includes('?')?'&':'?';
  const url=BASE.replace(/\/$/,'/')+join+'fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  return {br,pg,jsErrors};
}
async function enterEgypt(pg,touch){
  await skipOverlay(pg,touch);
  await clickSel(pg,'.a3d-back,.r3d-back,.eg3d-back',touch).catch(()=>{});
  await sleep(300);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(300);
  await clickSel(pg,'a.body.earth',touch);
  await sleep(1000);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) await clickText(pg,'^Africa$',touch);
  await sleep(1000);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) await clickText(pg,'Ancient Egypt|Sahara',touch);
  const ok=await waitG(pg,'eg3d',touch,45000);
  await sleep(600);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(300);
  return ok;
}
async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let state=null,mis=null,ka=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], y=kid.length>2?+kid[1]:null, z=kid.length>2?+kid[2]:+kid[1];
    const cnt=document.querySelector('.eg3d-cnt,.eg3d-hg.eg3d-cnt');
    const ct=cnt?((cnt.textContent||'').replace(/\s+/g,' ').trim()):'';
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      painted:mis&&mis.painted,need:mis&&mis.need,
      mode:(state&&state.mode)||null,
      x,y,z,cnt:ct,
      pin:!!document.querySelector('.eg3d-pin-doors.on,[data-pin="doors"].on')
    };
  });
}
async function resetPaint(pg,x,z){
  await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[0,1,2,3,4,5,6,7,8,9],auto:0,autoT:0})}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
  },{x,z});
  await sleep(600);
  return probe(pg);
}
async function leavePalace(pg,touch){
  // Official path: east lip first (x~-29, z~22). A south beeline hits the
  // cattle packed along the palace's south face (see hand9 1280 / first proof).
  for(let i=0;i<8;i++){
    const p=await probe(pg);
    const inPal=Math.abs(p.x+40)<12 && Math.abs(p.z-22)<10;
    if(!inPal || (p.x>-31 && Math.abs(p.z-22)<4.5)) return p.x>-31;
    const dest=p.x<=-31?[-29.0,22]:[-27.5,22];
    await clickWorld(pg,touch,dest[0],dest[1]);
    if(!(Math.hypot((await probe(pg)).x-dest[0],(await probe(pg)).z-dest[1])<2.4)){
      await keyWalkTo(pg,dest[0],dest[1],2.0,8000,touch);
    }
  }
  const p=await probe(pg);
  return p.x>-31;
}
async function lookGoshen(pg){
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      const k=G.kidAt?G.kidAt():null;
      const x=k?k[0]:-40, z=k?(k[2]!=null?k[2]:k[1]):22;
      const yaw=Math.atan2(x-(-42), z-(-5));
      if(G.camAim) G.camAim(yaw,0.32,12);
    }catch(e){}
  });
  await sleep(400);
}
async function gameGoTo(pg,x,z){
  return pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{
      if(G.pinWalkTo){G.pinWalkTo(x,z);return 'pinWalkTo'}
      if(G.K&&G.K.goTo){G.K.goTo({x,z});return 'goTo'}
    }catch(e){return 'err '+String(e)}
    return 'none';
  },{x,z});
}
async function clickWorld(pg,touch,x,z){
  const scr=await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    const p=G.scrP&&G.scrP(x,0.2,z);
    if(!p) return null;
    if(!(p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-140)) return null;
    return {x:Math.min(innerWidth-24,Math.max(24,p.x)),y:Math.min(innerHeight-140,Math.max(70,p.y))};
  },{x,z});
  if(!scr) return false;
  if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y);
  return true;
}
async function keyWalkTo(pg,x,z,radius,ms,touch){
  const t0=Date.now();
  let held='';
  try{
    while(Date.now()-t0<ms){
      const p=await probe(pg);
      if(Math.hypot(p.x-x,p.z-z)<=radius) return true;
      const info=await pg.evaluate(({x,z})=>{
        const G=window.__eg3d||{};
        let pos=null,yaw=null;
        try{const k=G.kidAt?G.kidAt():null; if(k) pos={x:k[0],z:k[2]!=null?k[2]:k[1]}}catch(e){}
        try{const c=G.camP?G.camP():(typeof G.camS==='function'?G.camS():G.camS); if(c) yaw=c.yaw}catch(e){}
        if(!pos||yaw==null) return null;
        const fx=-Math.sin(yaw), fz=-Math.cos(yaw);
        const rx=-fz, rz=fx;
        const dx=x-pos.x, dz=z-pos.z;
        return {fwd:dx*fx+dz*fz, right:dx*rx+dz*rz, dist:Math.hypot(dx,dz)};
      },{x,z});
      if(!info){await sleep(300);continue}
      if(info.dist<radius) return true;
      const keys=[];
      if(info.fwd>0.8) keys.push('ArrowUp');
      else if(info.fwd<-0.8) keys.push('ArrowDown');
      if(info.right>0.8) keys.push('ArrowRight');
      else if(info.right<-0.8) keys.push('ArrowLeft');
      if(!keys.length) keys.push('ArrowUp');
      const want=keys.join('+');
      if(want!==held){
        if(held){for(const k of held.split('+')) await pg.keyboard.up(k).catch(()=>{})}
        for(const k of keys) await pg.keyboard.down(k);
        held=want;
      }
      await sleep(240);
    }
  }finally{
    if(held){for(const k of held.split('+')) await pg.keyboard.up(k).catch(()=>{})}
  }
  const p=await probe(pg);
  return Math.hypot(p.x-x,p.z-z)<=radius+2;
}
async function goDoor(pg,touch,x,z,ms=25000){
  const p=await probe(pg);
  if(Math.hypot(p.x-x,p.z-z)<=2.2) return true;
  if(await clickWorld(pg,touch,x,z)){
    const t0=Date.now();
    while(Date.now()-t0<Math.min(ms,12000)){
      const q=await probe(pg);
      if(Math.hypot(q.x-x,q.z-z)<=2.2) return true;
      if((q.painted||0)>=5||q.st!=='paint') return true;
      await sleep(400);
    }
  }
  return keyWalkTo(pg,x,z,2.2,Math.max(8000,ms-12000),touch);
}
async function waitPainted(pg,before,ms=25000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if((p.painted||0)>before || p.st!=='paint' || /5\s*\/\s*5/.test(p.cnt||'')) return p;
    await sleep(400);
  }
  return probe(pg);
}
async function approachGoshen(pg,touch){
  const start=await probe(pg);
  const inPal=Math.abs(start.x+40)<12 && Math.abs(start.z-22)<10;
  if(inPal){
    const left=await leavePalace(pg,touch);
    flog('left-palace-for-pin',left,await probe(pg));
  }
  // From the east lip, walk south along x~-29 (east of the cattle), then into the door lane.
  const p=await probe(pg);
  if((p.painted||0)>=5 || p.st!=='paint') return p;
  if(p.pin || p.z<6) return p;
  if(p.x>-31){ await goDoor(pg,touch,-29,16,20000); }
  await goDoor(pg,touch,-32,-5,40000);
  await lookGoshen(pg);
  return probe(pg);
}
async function paintByPin(pg,touch,ms=90000){
  const t0=Date.now();
  // First try the game's own pin path (routeVia east front) from wherever we are.
  await lookGoshen(pg);
  let p0=await probe(pg);
  if(!p0.pin){
    const h=ISH[p0.painted||0]||ISH[0];
    const how=await gameGoTo(pg,h[0],h[1]+3.6);
    flog('game-goto',how,h,p0);
    p0=await waitPainted(pg,p0.painted||0,25000);
    if((p0.painted||0)>=5 || p0.st!=='paint') return p0;
  }
  if((p0.painted||0)<1 && (p0.z==null||p0.z>6)) await approachGoshen(pg,touch);
  let last=-1, stalls=0;
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if((p.painted||0)>=5 || p.st!=='paint' || /5\s*\/\s*5/.test(p.cnt||'')) return p;
    if((p.painted||0)===last) stalls++; else {stalls=0;last=p.painted||0}
    await lookGoshen(pg);
    const clicked=await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"],[data-pin="doors"].on',touch);
    flog('pin-click',clicked,p);
    if(clicked) await waitPainted(pg,p.painted||0,20000);
    else {
      const i=Math.min(4,p.painted||0);
      const h=ISH[i];
      const how=await gameGoTo(pg,h[0],h[1]+3.6);
      flog('game-goto-nudge',how,h);
      const w=await waitPainted(pg,p.painted||0,18000);
      if((w.painted||0)===(p.painted||0)) await goDoor(pg,touch,h[0],h[1]+3.6,15000);
    }
    if(stalls>=3){
      const i=Math.min(4,p.painted||0);
      const h=ISH[i];
      await goDoor(pg,touch,h[0],h[1]+3.6,15000);
    }
  }
  return probe(pg);
}
async function paintByFixedWalk(pg,touch,ms=120000){
  const t0=Date.now();
  const start=await probe(pg);
  const inPal=Math.abs(start.x+40)<12 && Math.abs(start.z-22)<10;
  if(inPal){
    const left=await leavePalace(pg,touch);
    flog('left-palace',left,await probe(pg));
  }
  for(let pass=0;pass<3 && Date.now()-t0<ms;pass++){
    for(let i=0;i<ISH.length;i++){
      const p=await probe(pg);
      if((p.painted||0)>=5 || p.st!=='paint' || /5\s*\/\s*5/.test(p.cnt||'')) return p;
      const h=ISH[i];
      const reached=await goDoor(pg,touch,h[0],h[1]+3.6,25000);
      await sleep(400);
      const mid=await probe(pg);
      flog('walk-arrive',pass,i,{reached,painted:mid.painted,x:mid.x,z:mid.z});
      await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"]',touch);
      await waitPainted(pg,mid.painted||0,20000);
    }
  }
  return probe(pg);
}
async function paintByOldHarness(pg,touch){
  // Replay hand9 1280: no leavePalace when dest x<=-30, pin wait 700ms, two passes.
  for(let pass=0;pass<2;pass++){
    for(let i=0;i<ISH.length;i++){
      const p=await probe(pg);
      if((p.painted||0)>=5 || p.st!=='paint') return p;
      const h=ISH[i];
      await keyWalkTo(pg,h[0],h[1]+3.6,2.2,30000,touch);
      await sleep(400);
      await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"]',touch);
      await sleep(700);
      const mid=await probe(pg);
      flog('old-paint',pass,i,{painted:mid.painted,cnt:mid.cnt,x:mid.x,z:mid.z,st:mid.st});
    }
  }
  return probe(pg);
}

const CASES=[
  {id:'pin-from-throne-a', method:'pin', start:[-46.5,22]},
  {id:'pin-from-throne-b', method:'pin', start:[-46.5,22]},
  {id:'pin-from-throne-c', method:'pin', start:[-45,22]},
  {id:'walk-from-throne-a', method:'fixed', start:[-46.5,22]},
  {id:'walk-from-throne-b', method:'fixed', start:[-44,23]},
  {id:'pin-from-east-lip', method:'pin', start:[-29,22]},
  {id:'walk-from-mat', method:'fixed', start:[-42,-5]},
];

async function runSize(w,h,touch,tag){
  flog('SIZE',tag);
  const {br,pg,jsErrors}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered);
    if(!entered) return;
    await shot(pg,tag+'-entered');
    for(const c of CASES){
      const name=tag+'-'+c.id;
      const placed=await resetPaint(pg,c.start[0],c.start[1]);
      flog('start',name,placed);
      rec(name+'-placed', placed.st==='paint' && (placed.painted||0)===0, placed);
      await shot(pg,name+'-start');
      const t0=Date.now();
      const end=c.method==='pin'?await paintByPin(pg,touch,90000):await paintByFixedWalk(pg,touch,120000);
      const ok=(end.painted||0)>=5 || /5\s*\/\s*5/.test(end.cnt||'');
      rec(name, ok, {ms:Date.now()-t0, painted:end.painted, st:end.st, cnt:end.cnt, x:end.x, z:end.z});
      await shot(pg,name+'-end');
      out.cases.push({name,ok,end,ms:Date.now()-t0});
    }
    if(tag==='1280x715'){
      const name=tag+'-old-harness-from-throne';
      const placed=await resetPaint(pg,-46.5,22);
      rec(name+'-placed', placed.st==='paint' && (placed.painted||0)===0, placed);
      await shot(pg,name+'-start');
      const t0=Date.now();
      const end=await paintByOldHarness(pg,touch);
      const ok=(end.painted||0)>=5 || /5\s*\/\s*5/.test(end.cnt||'');
      rec(name, ok, {ms:Date.now()-t0, painted:end.painted, st:end.st, cnt:end.cnt, x:end.x, z:end.z, note:'expected-fail-if-stall-reproduced'});
      await shot(pg,name+'-end');
      out.cases.push({name,ok,end,repro:true,ms:Date.now()-t0});
    }
  }catch(e){
    out.err=(out.err||'')+String(e&&e.stack||e);
    flog('EXCEPTION',tag,String(e&&e.stack||e));
    rec(tag+'-exception',false,{err:String(e)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }
  rec(tag+'-no-js-errors', !(jsErrors&&jsErrors.length), {n:(jsErrors||[]).length, errs:jsErrors||[]});
  try{await br.close()}catch(_){}
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'s37 p10 proof start\n')}catch(e){}
  flog('START',BASE);
  const ONLY=(process.env.ONLY||'').trim();
  if(!ONLY||ONLY==='1280') await runSize(1280,715,false,'1280x715');
  if(!ONLY||ONLY==='390') await runSize(390,844,true,'390x844');
  const proof=out.checks.filter(c=>CASES.some(k=>c.n.endsWith(k.id)));
  const pass=proof.filter(c=>c.ok).length;
  flog('DONE',JSON.stringify({proofPass:pass,proofTotal:proof.length,checks:out.checks.length,fail:out.checks.filter(c=>!c.ok).length,err:out.err}));
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(1)});
