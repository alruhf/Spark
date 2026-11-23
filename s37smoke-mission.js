/* spark37 smoke: confirm mission() inits after the az-scope fix. Swiftshader only. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-qmfs97ujl-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/smoke';
const LIVE='/tmp/s37smoke-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};

async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')continue;
      const a=b.width*b.height;
      if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}
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
      return {x:b.left+b.width/2,y:b.top+b.height/2,t}}
    return null},re);
  if(!box)return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box.t;
}
async function skipOverlay(pg,touch){
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"],.sh3d-shopx,.sh3d-bookx,.sh3d-closex',touch).catch(()=>{});
  const age=await pg.evaluate(()=>{const b=document.querySelector('button.ks-age');if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
  if(age){if(touch) await pg.touchscreen.tap(age.x,age.y); else await pg.mouse.click(age.x,age.y); await sleep(500)}
  const go=await pg.evaluate(()=>{const b=document.querySelector('button.ks-go');if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
  if(go){if(touch) await pg.touchscreen.tap(go.x,go.y); else await pg.mouse.click(go.x,go.y); await sleep(600)}
  for(const sel of ['.sh3d-skip','.s3d-skip','.s3d-retry button','.eg3d-retry button']) await clickSel(pg,sel,touch).catch(()=>{});
}
async function waitG(pg,key,touch,ms=45000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await skipOverlay(pg,touch);
    const st=await pg.evaluate(k=>{
      const ld=document.querySelector(k==='r3d'?'.r3d-load':k==='eg3d'?'.eg3d-load':'.s3d-load');
      const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);
      const g=window['__'+k];
      return {loadOn,has:!!(g&&(g.cam||g.scrP||g.K||g.kid))};
    },key);
    if(st.has&&!st.loadOn) return true;
    await sleep(400);
  }
  return false;
}
async function closeMap(pg,touch){
  for(let i=0;i<5;i++){
    const hit=await pg.evaluate(()=>{
      const xs=[...document.querySelectorAll('.sh3d-shopx,.sh3d-bookx,.eg3d-mapx,.sh3d-closex,.sh3d-rskip,[aria-label="Close"]')];
      for(const x of xs){
        const b=x.getBoundingClientRect();
        const st=getComputedStyle(x);
        if(b.width>4&&b.height>4&&st.visibility!=='hidden'&&st.display!=='none'&&st.opacity!=='0')
          return {x:b.left+b.width/2,y:b.top+b.height/2};
      }
      return null;
    });
    if(!hit) return true;
    if(touch) await pg.touchscreen.tap(hit.x,hit.y); else await pg.mouse.click(hit.x,hit.y);
    await sleep(400);
  }
}
(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  fs.writeFileSync(LIVE,'');
  const errs=[];
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const hdrs=TOK&&BASE.startsWith('https')?{'x-vercel-trusted-oidc-idp-token':TOK}:{};
  const ctx=await br.newContext({viewport:{width:1280,height:715},deviceScaleFactor:1,extraHTTPHeaders:hdrs});
  if(TOK&&BASE.startsWith('https')){
    const root=BASE.replace(/\/$/,'');
    await ctx.route(u=>String(u.href||u).startsWith(root), r=>r.continue({headers:{...r.request().headers(),'x-vercel-trusted-oidc-idp-token':TOK}}));
  }
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e)));
  pg.on('console',msg=>{if(msg.type()==='error') errs.push('console:'+msg.text())});
  const url=BASE.replace(/\/$/,'/')+'?fresh=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  const touch=false;
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(400);
  await clickSel(pg,'a.body.earth',touch);
  await sleep(1200);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) await clickText(pg,'^Africa$',touch);
  await sleep(1200);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) await clickText(pg,'Ancient Egypt|Sahara',touch);
  const ok=await waitG(pg,'eg3d',touch,45000);
  flog('entered',ok);
  await closeMap(pg,touch);
  await sleep(5000);
  const info=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let state=null,probe=null,kid=null,logs=null;
    try{state=G.state&&G.state()}catch(e){state={err:String(e)}}
    try{probe=G.misProbe?G.misProbe():(state&&state.mis)}catch(e){probe={err:String(e)}}
    try{kid=G.kidAt?G.kidAt():null}catch(e){}
    try{logs=(window.__eg3dLog||[]).filter(x=>/miserr|storyintro|loaded/i.test(JSON.stringify(x))).slice(-8)}catch(e){}
    const bub=document.querySelector('.eg3d-bub.spark,.eg3d-bub');
    const dlg=document.querySelector('.eg3d-dlg,.eg3d-narr');
    return {
      probe, kid,
      mis:state&&state.mis,
      mode:state&&state.mode,
      pinsShown:state&&state.pinsShown,
      bub:(bub&&(bub.textContent||'').replace(/\s+/g,' ').trim().slice(0,180))||'',
      dlg:(dlg&&(dlg.textContent||'').replace(/\s+/g,' ').trim().slice(0,180))||'',
      logs
    };
  });
  fs.mkdirSync(SHOT,{recursive:true});
  const shot=SHOT+'/1280-mission-init.png';
  await pg.screenshot({path:shot,fullPage:false});
  flog('INFO',info);
  flog('ERRS',errs.filter(x=>!/favicon|oidc|vercel/i.test(x)).slice(0,12));
  const st=info.probe&&info.probe.st, p=info.probe&&info.probe.p;
  const cap=(info.bub||'')+' '+(info.dlg||'');
  const pass=st==='ask'&&p===1 && /Walk over and ask him to let God|see Pharaoh/i.test(cap);
  flog(pass?'PASS':'FAIL','mission-init',{st,p,cap:cap.trim(),shot});
  await br.close().catch(()=>{});
  process.exit(pass?0:1);
})().catch(e=>{flog('EXC',String(e&&e.stack||e));process.exit(2)});
