/* Kid-only P10 approach on 750y9do3h: stand at the throne in st=paint,
   look toward Goshen if needed so the doors pin is tappable, then ONLY
   tap that pin and wait. No Arrow keys, no leavePalace, no sand clicks
   to steer the kid. The game's routeVia must take them to Goshen and
   all 5 doors must get painted (retap the pin after each arrival, the
   way a kid would, never while a walk is still running). */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-750y9do3h-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/p10-kidpin-750y9do3h';
const LIVE=process.env.LIVE||'/tmp/s37p10-kidpin-live.log';
const REPORT=process.env.REPORT||'/tmp/s37p10-kidpin-report.json';
const out={checks:[],shots:[],err:null,url:BASE};
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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,cls:e.className}}
    }
    return best;
  },sel);
  if(!box)return null;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
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
    let state=null,mis=null,ka=null,mv=null,pins=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    try{mv=G.mvP?G.mvP():null}catch(e){}
    try{pins=state&&state.pinsShown}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], y=kid.length>2?+kid[1]:null, z=kid.length>2?+kid[2]:+kid[1];
    const cnt=document.querySelector('.eg3d-cnt,.eg3d-hg.eg3d-cnt');
    const ct=cnt?((cnt.textContent||'').replace(/\s+/g,' ').trim()):'';
    const el=document.querySelector('.eg3d-pin-doors,[data-pin="doors"]');
    let pinBox=null;
    if(el){
      const b=el.getBoundingClientRect(),st=getComputedStyle(el);
      const vis=b.width>=8&&b.height>=8&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0'&&st.pointerEvents!=='none';
      if(vis) pinBox={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,on:el.classList.contains('on')};
    }
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      painted:mis&&mis.painted,need:mis&&mis.need,
      mode:(state&&state.mode)||null,
      x,y,z,cnt:ct,
      pin:!!pinBox, pinBox,
      pinsShown:pins||[],
      pathN:mv&&mv.n, path:mv&&mv.p, walking:!!(mv&&mv.n>0)
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
  await sleep(700);
  return probe(pg);
}
async function lookGoshen(pg){
  // Camera look only — does not move the kid. A kid can orbit the view toward Goshen.
  const cam=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      const k=G.kidAt?G.kidAt():null;
      const x=k?k[0]:-46.5, z=k?(k[2]!=null?k[2]:k[1]):22;
      const yaw=Math.atan2(x-(-42), z-(-5));
      if(G.camAim) return G.camAim(yaw,0.32,14);
    }catch(e){return {err:String(e)}}
    return null;
  });
  await sleep(500);
  return cam;
}
async function waitProgress(pg,painted0,x0,z0,ms){
  const t0=Date.now();
  let last=null;
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    last=p;
    const moved=Math.hypot((p.x||0)-x0,(p.z||0)-z0)>2;
    const painted=(p.painted||0)>painted0;
    const done=(p.painted||0)>=5 || p.st!=='paint' || /5\s*\/\s*5/.test(p.cnt||'');
    if(done) return p;
    if(painted && !p.walking) return p;
    if(!p.walking && moved && Date.now()-t0>2500 && (p.painted||0)===painted0){
      // arrived (or stalled) with no new paint — let the caller retap
      if(Date.now()-t0>8000) return p;
    }
    await sleep(400);
  }
  return last||probe(pg);
}

async function kidPinFromThrone(pg,touch,tag){
  const placed=await resetPaint(pg,-46.5,22);
  flog('placed',tag,placed);
  rec(tag+'-placed-at-throne', placed.st==='paint' && (placed.painted||0)===0 && placed.z>12 && placed.x<-35, placed);
  await shot(pg,tag+'-start-default-cam');
  let p=await probe(pg);
  let looked=false;
  if(!p.pin){
    const cam=await lookGoshen(pg);
    looked=true;
    flog('look-goshen',cam,await probe(pg));
    await shot(pg,tag+'-after-look-goshen');
    p=await probe(pg);
  }
  rec(tag+'-pin-visible-from-throne', !!p.pin, {pin:p.pin,pinBox:p.pinBox,looked,pinsShown:p.pinsShown,x:p.x,z:p.z});
  if(!p.pin){
    rec(tag+'-kid-pin-from-throne', false, {reason:'doors pin never tappable from the throne (even after looking toward Goshen)',x:p.x,z:p.z,pinsShown:p.pinsShown});
    await shot(pg,tag+'-no-pin');
    return p;
  }
  const t0=Date.now();
  const path=[];
  let taps=0;
  while(Date.now()-t0<150000){
    p=await probe(pg);
    path.push({t:Date.now()-t0,x:p.x,z:p.z,painted:p.painted,walking:p.walking,pin:p.pin,st:p.st});
    if((p.painted||0)>=5 || p.st!=='paint' || /5\s*\/\s*5/.test(p.cnt||'')) break;
    if(p.walking){ await sleep(500); continue; }
    const box=await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"],[data-pin="doors"].on',touch);
    taps++;
    flog('kid-pin-tap',taps,box,p);
    if(!box){
      // Pin hid mid-route; look toward Goshen again (camera only) and retry once.
      await lookGoshen(pg);
      const box2=await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"],[data-pin="doors"].on',touch);
      flog('kid-pin-tap-retry',taps,box2,await probe(pg));
      if(!box2){ await sleep(1000); continue; }
    }
    p=await waitProgress(pg,p.painted||0,p.x,p.z,45000);
    flog('after-wait',taps,p);
    if(taps===1) await shot(pg,tag+'-after-first-tap');
  }
  p=await probe(pg);
  const ok=(p.painted||0)>=5 || /5\s*\/\s*5/.test(p.cnt||'');
  const reachedGoshen=p.z<6 && p.x<-20;
  rec(tag+'-routed-to-goshen', reachedGoshen || ok, {x:p.x,z:p.z,painted:p.painted,taps,ms:Date.now()-t0});
  rec(tag+'-kid-pin-from-throne', ok, {ms:Date.now()-t0,taps,painted:p.painted,st:p.st,cnt:p.cnt,x:p.x,z:p.z,looked,path:path.filter((_,i)=>i%4===0)});
  await shot(pg,tag+'-end');
  return p;
}

async function runSize(w,h,touch,tag){
  flog('SIZE',tag);
  const {br,pg,jsErrors}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered);
    if(!entered) return;
    await shot(pg,tag+'-entered');
    await kidPinFromThrone(pg,touch,tag);
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
  try{fs.writeFileSync(LIVE,'s37 p10 kid-pin start\n')}catch(e){}
  flog('START',BASE);
  const ONLY=(process.env.ONLY||'').trim();
  if(!ONLY||ONLY==='1280') await runSize(1280,715,false,'1280x715');
  if(!ONLY||ONLY==='390') await runSize(390,844,true,'390x844');
  const key=out.checks.filter(c=>c.n.endsWith('kid-pin-from-throne'));
  flog('DONE',JSON.stringify({kidPass:key.filter(c=>c.ok).length,kidTotal:key.length,fail:out.checks.filter(c=>!c.ok).length,err:out.err}));
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(1)});
