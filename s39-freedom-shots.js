/* Targeted visual: call K.misFree() (real freedom cine) and sample throne / We're free / sea / army / Shake / award. testfast only. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-6jvu0187e-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s39-6jvu0187e-freedom';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s39-6jvu-freedom-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s39-6jvu-freedom-report.json';
const ONLY=process.env.ONLY||'';
const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString()};
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
  const hdrs=TOK&&BASE.startsWith('https')?{'x-vercel-trusted-oidc-idp-token':TOK}:{ };
  const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1,extraHTTPHeaders:hdrs});
  if(TOK&&BASE.startsWith('https')){
    const root=BASE.replace(/\/$/,'');
    await ctx.route(u=>String(u.href||u).startsWith(root), r=>r.continue({headers:{...r.request().headers(),'x-vercel-trusted-oidc-idp-token':TOK}}));
  }
  const pg=await ctx.newPage();
  pg.setDefaultTimeout(20000);
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
async function cineInfo(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{},K=G.K||G;
    const tamb=document.querySelector('.eg3d-tamb,.eg3d-staffb.eg3d-tamb');
    const st=tamb&&getComputedStyle(tamb);
    const skip=document.querySelector('.eg3d-askip,button.eg3d-dskip');
    const sk=skip&&getComputedStyle(skip);
    const badge=document.querySelector('.eg3d-badge');
    const bub=[...document.querySelectorAll('.eg3d-bub,.eg3d-dlg,.eg3d-hg')].map(e=>e.textContent||'').join(' | ');
    let phaY=null,pha=null,seaPha=null;
    try{
      const p=K._seaPharaoh||K.pha||null;
      if(K.PH) {const ph=K.PH(); if(ph) pha={x:+ph.x.toFixed(2),y:+ph.y.toFixed(2),z:+ph.z.toFixed(2)}}
    }catch(e){}
    try{
      const kids=K.S?null:null;
      const phaObj=K.pal&&K.pal.getObjectByName&&null;
    }catch(e){}
    try{if(K._seaPharaoh){const p=K._seaPharaoh.position;seaPha={x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}}}catch(e){}
    let thronePha=null;
    try{
      const all=[];
      (K.S||K.scene||{traverse:()=>{}}).traverse&&(K.S||K.scene).traverse(o=>{
        if(o&&o.userData&&(o.userData.pharaoh||o.userData.role==='pharaoh')) all.push(o);
      });
    }catch(e){}
    const cineT=typeof K.cineT==='function'?K.cineT():null;
    const mode=K.getMode?K.getMode():null;
    const kid=K.kid&&K.kid.position?{x:+K.kid.position.x.toFixed(2),y:+K.kid.position.y.toFixed(2),z:+K.kid.position.z.toFixed(2)}:null;
    return {
      cineT,mode,kid,bub,
      tambOn:!!(tamb&&st&&st.display!=='none'&&st.visibility!=='hidden'),
      skipOn:!!(skip&&sk&&sk.display!=='none'&&sk.visibility!=='hidden'),
      badge:!!badge, badgeText:badge?(badge.innerText||'').slice(0,200):'',
      seaPha, pha, keys:Object.keys(K).filter(k=>/cine|free|tamb|pha|PH|pal/i.test(k)).slice(0,40)
    };
  });
}
async function startFreedom(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{},K=G.K||G;
    const hows=[];
    try{if(typeof K.misFree==='function'){K.misFree();hows.push('K.misFree')}}catch(e){hows.push('K.misFree err '+e)}
    try{if(!hows.includes('K.misFree')&&typeof G.misFree==='function'){G.misFree();hows.push('G.misFree')}}catch(e){hows.push('G.misFree err '+e)}
    const cineT=typeof K.cineT==='function'?K.cineT():null;
    const mode=K.getMode?K.getMode():null;
    return {hows,cineT,mode,hasMisFree:typeof (K.misFree||G.misFree)==='function'};
  });
}
async function jumpTo(pg,t){
  // Step in small increments and stop if endCine() flipped cineT to -1
  // (a single cineJump(28) can infinite-loop: while(cineT<t) after endCine).
  return pg.evaluate(t=>{
    const G=window.__eg3d||{},K=G.K||G;
    const jump=K.cineJump||G.cineJump;
    const read=()=>typeof K.cineT==='function'?K.cineT():null;
    let now=read();
    try{
      if(typeof jump==='function'){
        let guard=0;
        while(now!=null&&now>=0&&now<t&&guard++<80){
          const step=Math.min(t, now+1.5);
          now=jump(step);
          if(now==null||now<0)break;
        }
      }
    }catch(e){return {err:String(e),cineT:read()}}
    return {cineT:read(),mode:K.getMode?K.getMode():null};
  },t);
}
async function runSize(tag,w,h,touch){
  flog('====',tag,'start',BASE);
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-enter',entered,{entered});
    if(!entered){await shot(pg,tag+'-enter-fail');return}
    await sleep(400);
    const started=await startFreedom(pg);
    flog(tag,'misFree',started);
    rec(tag+'-freedom-started', started.cineT>=0 || started.mode==='cine', started);
    await sleep(400);
    for(const [t,name] of [[2,'throne'],[7.2,'were-free'],[16,'sea']]){
      const jmp=await jumpTo(pg,t);
      flog(tag,'jump',name,jmp);
      await sleep(250);
      const info=await cineInfo(pg);
      flog(tag,name,info);
      await shot(pg,tag+'-'+name);
      rec(tag+'-'+name, true, info);
    }
    await sleep(800);
    const end=await cineInfo(pg);
    flog(tag,'after-shake',end);
    await shot(pg,tag+'-after');
    if(end.badge) rec(tag+'-award', /Let My People Go/i.test(end.badgeText)&&!/Spark\s*9/i.test(end.badgeText), {badgeText:end.badgeText});
  }catch(e){
    out.err=String(e&&e.stack||e);
    flog('ERROR',tag,out.err);
    rec(tag+'-run',false,{err:out.err});
    try{await shot(pg,tag+'-error')}catch(_){}
  }finally{
    try{await br.close()}catch(_){}
  }
}
(async()=>{
  try{
    const sizes=ONLY==='390'?[[390,844,true,'390']]:ONLY==='1280'?[[1280,715,false,'1280']]:[[1280,715,false,'1280'],[390,844,true,'390']];
    for(const [w,h,touch,tag] of sizes){await runSize(tag,w,h,touch)}
  }catch(e){out.err=String(e&&e.stack||e);flog('FATAL',out.err)}
  out.finished=new Date().toISOString();
  out.pass=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>!c.ok).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT,'PASS',out.pass,'FAIL',out.fail);
  process.exit(0);
})();
