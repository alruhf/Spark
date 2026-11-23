/* Jump to P9 come on the new preview, let darkness fire frameGoshenGlow, assert zero ReferenceErrors. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-7a8tjojcb-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/p9-glow-7a8tjojcb';
const LIVE=process.env.LIVE||'/tmp/s37p9-glow-live.log';
const REPORT=process.env.REPORT||'/tmp/s37p9-glow-report.json';
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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}
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
    let state=null,mis=null,ka=null,fx=null,fnType=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    try{fx=!!(G.K&&G.K.FX&&G.K.FX.darkness)}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], z=kid.length>2?+kid[2]:+kid[1];
    const bub=document.querySelector('.eg3d-bub,.eg3d-say,.eg3d-cap,.ks-say');
    const cap=[...document.querySelectorAll('.eg3d-bub,.eg3d-say,.eg3d-cap,.eg3d-line,p,h2')].map(e=>(e.textContent||'').trim()).filter(t=>/Goshen|dark over Egypt|still glow/i.test(t)).slice(0,3);
    return {st:mis&&mis.st,p:mis&&mis.p,x,z,fx,cap,missionV:document.querySelector('script[src*="mission.js"]')&&null,
      bub:(bub&&(bub.textContent||'').trim())||''};
  });
}
async function runTag(w,h,touch,tag){
  const {br,pg,jsErrors}=await launch(w,h,touch);
  try{
    rec(tag+'-enter', await enterEgypt(pg,touch), await probe(pg));
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      // t in the past so missionFrame immediately treats come as due (COME=6.5s, TF or not)
      try{if(G.misSet)G.misSet({p:9,st:'come',t:Date.now()-20000,tabs:9,paid:[0,1,2,3,4,5,6,7,8],auto:0,autoT:0})}catch(e){}
    });
    await sleep(400);
    const placed=await probe(pg);
    rec(tag+'-p9-placed', placed.p===9 && (placed.st==='come'||placed.st==='plague'||placed.st==='talk'), placed);
    let last=placed, glow=false;
    const t0=Date.now();
    while(Date.now()-t0<20000){
      last=await probe(pg);
      const text=(last.cap||[]).join(' ')+' '+(last.bub||'');
      if(/Goshen|dark over Egypt|still glow/i.test(text) || (last.z!=null && last.z<8 && last.x<-20) || last.st==='plague'||last.st==='talk'){
        if(/Goshen|dark over Egypt|still glow/i.test(text) || (last.z!=null && last.z<8)) glow=true;
        if(last.st==='plague'||last.st==='talk'||glow) break;
      }
      await sleep(400);
    }
    await shot(pg,tag+'-p9-darkness');
    rec(tag+'-p9-darkness-fired', last.st==='plague'||last.st==='talk'||glow, last);
    rec(tag+'-goshen-framed', !!(last.z!=null && last.z<8 && last.x<-20), last);
    const refs=(jsErrors||[]).filter(e=>/ReferenceError|frameGoshenGlow|is not defined/i.test(e.s||''));
    rec(tag+'-no-frameGoshenGlow-error', refs.length===0, {refs, all:jsErrors});
    rec(tag+'-no-js-errors', !(jsErrors&&jsErrors.length), {n:(jsErrors||[]).length, errs:jsErrors||[]});
  }catch(e){
    out.err=(out.err||'')+String(e&&e.stack||e);
    rec(tag+'-exception',false,{err:String(e&&e.stack||e)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }
  try{await br.close()}catch(_){}
}
(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'p9 glow smoke start\n')}catch(e){}
  flog('START',BASE);
  await runTag(1280,715,false,'1280x715');
  await runTag(390,844,true,'390x844');
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  const report={pass,fail,total:out.checks.length,checks:out.checks,shots:out.shots,err:out.err,url:BASE};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  flog('DONE',JSON.stringify({pass,fail,total:out.checks.length,err:out.err}));
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(1)});
