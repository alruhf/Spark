/* Targeted stills of P4 flies, P5 cows, P6 boils, P8 hornist, P9 Goshen glow at both sizes.
   testfast + misSet only. Do not override the game camera — we want the
   cam holds from FX.on (cow/boil/horn/darkness). */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-bjk9pamfu-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s40-fx-bjk9pamfu';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s40-bjk9-fx-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s40-bjk9-fx-report.json';
const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString()};
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
const rec=(n,ok,extra)=>{out.checks.push(Object.assign({n,ok:!!ok},extra||{}));flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};
async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p,timeout:60000});out.shots.push(p);flog('SHOT',p);return p}

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
    await ctx.route(u=>String(u.href||u).startsWith(root), r=>r.continue({headers:{...r.request().headers(),'x-vercel-trusted-oidc-token':TOK,'x-vercel-trusted-oidc-idp-token':TOK}}));
  }
  const pg=await ctx.newPage();
  pg.setDefaultTimeout(60000);
  const join=BASE.includes('?')?'&':'?';
  const url=BASE.replace(/\/$/,'/')+join+'fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  return {br,pg};
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

// Jump first, then misSet, and leave the game's FX cam hold alone.
async function startPlague(pg,p,x,z){
  return pg.evaluate(({p,x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.resetStaff)G.resetStaff()}catch(e){}
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
    try{if(G.misSet)G.misSet({p,st:'plague',t:Date.now(),tabs:p,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
    const K=G.K||G;
    return {ok:true,kid:K.kid&&K.kid.position?[K.kid.position.x,K.kid.position.z]:null,hold:!!K.camHold,st:(G.state&&G.state().mis&&G.state().mis.st)||null,p:(G.state&&G.state().mis&&G.state().mis.p)||null};
  },{p,x,z});
}

async function capInfo(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{},K=G.K||G,S=(G.__dbg&&G.__dbg().S)||K.S;
    const bub=[...document.querySelectorAll('.eg3d-bub,.eg3d-cap,.eg3d-say, [class*="bub"]')].map(e=>(e.innerText||e.textContent||'').trim()).filter(Boolean);
    const lines=(bub[0]||'').split(/\n/).filter(Boolean).length;
    let boils=0,horn=0,frogs=0,hornPos=null;
    try{if(S) S.traverse(o=>{
      if(!o.visible)return;
      if(o.userData&&o.userData.boil) boils++;
      if((o.name||'')==='hornist'||(o.name||'')==='ramshorn') {horn++; try{const p=o.getWorldPosition(new THREE.Vector3());if((o.name||'')==='hornist')hornPos=[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)]}catch(e){}}
      if((o.name||'')==='frog') frogs++;
    })}catch(e){}
    const st=G.state&&G.state();
    return {bub:bub[0]||'',bubAll:bub.slice(0,4),lines,boils,horn,frogs,hornPos,st:st&&st.mis&&st.mis.st,p:st&&st.mis&&st.mis.p,hold:!!K.camHold,dist:K.camS&&K.camS.dist,pit:K.camS&&K.camS.pitch,kid:K.kid&&[K.kid.position.x,K.kid.position.z]};
  });
}

async function runSize(tag,w,h,touch){
  flog('====',tag,'start',BASE);
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered) return;
    const beats=[
      {tag:'p4-flies',p:4,x:-14,z:4,wait:900},
      {tag:'p5-cows',p:5,x:-14,z:4,wait:1100},
      {tag:'p6-boils',p:6,x:-14,z:4,wait:1100},
      {tag:'p8-hornist',p:8,x:-16,z:3,wait:1100},
      {tag:'p9-goshen',p:9,x:-42,z:-5,wait:1500}
    ];
    for(const b of beats){
      const st=await startPlague(pg,b.p,b.x,b.z);
      flog(tag,b.tag,'start',st);
      await sleep(b.wait);
      const info=await capInfo(pg);
      await shot(pg,tag+'-'+b.tag);
      rec(tag+'-'+b.tag, true, info);
    }
  }finally{
    try{await br.close()}catch(e){}
  }
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{
    for(const [w,h,touch,tag] of [[1280,715,false,'1280'],[390,844,true,'390']]){
      await runSize(tag,w,h,touch);
    }
  }catch(e){out.err=String(e&&e.stack||e);flog('ERR',out.err)}
  out.ended=new Date().toISOString();
  out.pass=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>!c.ok).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT,'PASS',out.pass,'FAIL',out.fail);
  process.exit(out.err||out.fail?1:0);
})();
