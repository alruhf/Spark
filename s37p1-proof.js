/* Prove ≥10 P1 hand approaches at 1280 and 390 on the fixed build.
   testfast+misSet+jumpP only to start each approach in act on the sand.
   The walk is pin, tile, or keys; staff must start on arrival with no
   extra tap; then a staff + river tap must complete the beat. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/p1-proof';
const LIVE=process.env.LIVE||'/tmp/s37p1-proof-live.log';
const REPORT=process.env.REPORT||'/tmp/s37p1-proof-report.json';
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
async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let state=null,mis=null,ka=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], y=kid.length>2?+kid[1]:null, z=kid.length>2?+kid[2]:+kid[1];
    const nile=(G.misPos&&G.misPos.nile&&G.misPos.nile())||[25.1,14];
    const sb=document.querySelector('.eg3d-staffb');
    const bub=document.querySelector('.eg3d-bub.spark');
    let onBank=false;try{onBank=!!(G.K&&G.K.onP1Bank&&G.K.onP1Bank({x,z}))}catch(e){}
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      mode:(state&&state.mode)||null,
      x,y,z,dNile:+Math.hypot(x-nile[0],z-nile[1]).toFixed(2),
      hasStaff:!!sb, staffUsed:!!(sb&&sb.classList.contains('used')),
      kstaff:!!(G.K&&G.K.kstaff&&G.K.kstaff.visible),
      bub:bub?(bub.textContent||'').replace(/\s+/g,' ').trim().slice(0,140):'',
      nilePin:!!document.querySelector('.eg3d-pin-nile.on,[data-pin="nile"].on'),
      onBank
    };
  });
}
async function resetAct(pg,x,z){
  await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.K&&G.K.resetStaff)G.K.resetStaff()}catch(e){}
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:1,paid:[],auto:0,autoT:0})}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
    try{if(G.camAim)G.camAim(-Math.PI/2-.35,.32,12)}catch(e){}
  },{x,z});
  await sleep(500);
}
async function faceRiver(pg){
  await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.camAim)G.camAim(-Math.PI/2-.35,.32,12)}catch(e){}});
  await sleep(200);
}
async function clickBank(pg,touch,x,z){
  const scr=await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    const p=G.scrP&&G.scrP(x,0.12,z);
    if(!p) return null;
    if(!(p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-140)) return null;
    const sx=Math.min(innerWidth-24,Math.max(24,p.x));
    const sy=Math.min(innerHeight-140,Math.max(70,p.y));
    const el=document.elementFromPoint(sx,sy);
    if(el&&el.closest&&el.closest('.eg3d-goods,.eg3d-dock,button,.eg3d-pin,.spk-askme,.spark-companion,#grownUpBtn,.eg3d-map')) return null;
    return {x:sx,y:sy};
  },{x,z});
  if(!scr) return false;
  if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y);
  return true;
}
async function walkTile(pg,touch,ms=20000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if(p.onBank||p.hasStaff||p.mode==='staff'||p.st==='come'||p.st==='plague') return p;
    await faceRiver(pg);
    const hit=await clickBank(pg,touch,23.1,14)||await clickBank(pg,touch,22,14)||await clickBank(pg,touch,24,12);
    flog('tile',hit,p);
    await sleep(1800);
  }
  return probe(pg);
}
async function walkKeys(pg,ms=20000){
  const t0=Date.now();
  await faceRiver(pg);
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if(p.onBank||p.hasStaff||p.mode==='staff'||p.st==='come') return p;
    await pg.keyboard.down('ArrowUp');await sleep(280);await pg.keyboard.up('ArrowUp');
    await sleep(80);
  }
  return probe(pg);
}
async function walkPin(pg,touch,ms=22000){
  await faceRiver(pg);
  await sleep(400);
  const hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
  flog('pin',hit);
  const t0=Date.now();
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if(p.onBank||p.hasStaff||p.mode==='staff'||p.st==='come') return p;
    await sleep(400);
  }
  return probe(pg);
}
async function finishStaff(pg,touch){
  // Staff should already be up. Tap staff (if needed) then the water.
  const t0=Date.now();
  while(Date.now()-t0<12000){
    const p=await probe(pg);
    if(p.st==='come'||p.st==='plague'||p.st==='gap'||(p.p||0)>=2) return p;
    if(p.hasStaff&&!p.staffUsed) await clickSel(pg,'.eg3d-staffb',touch);
    await faceRiver(pg);
    await clickBank(pg,touch,28,14)||await clickBank(pg,touch,26.5,14)||await clickBank(pg,touch,25.5,14);
    await sleep(500);
  }
  return probe(pg);
}

const CASES=[
  {id:'pin-from-granary', start:[14.8,11.84], how:'pin'},
  {id:'tile-from-granary', start:[14.8,11.84], how:'tile'},
  {id:'keys-from-granary', start:[14.8,11.84], how:'keys'},
  {id:'pin-from-farm', start:[2,2], how:'pin'},
  {id:'tile-from-farm', start:[2,2], how:'tile'},
  {id:'keys-from-farm', start:[8,14], how:'keys'},
  {id:'pin-from-north', start:[18,28], how:'pin'},
  {id:'tile-from-south', start:[16,4], how:'tile'},
  {id:'keys-from-nw', start:[12,22], how:'keys'},
  {id:'pin-from-se', start:[20,6], how:'pin'},
  {id:'tile-from-quay', start:[22,22], how:'tile'},
  {id:'keys-from-sw', start:[12,6], how:'keys'}
];

async function runCase(pg,touch,tag,c){
  const id=tag+'-'+c.id;
  await resetAct(pg,c.start[0],c.start[1]);
  const before=await probe(pg);
  flog('start',id,before);
  // must begin in walk/act with no leftover staff
  if(before.mode==='staff'||before.hasStaff){
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.K&&G.K.resetStaff&&G.K.resetStaff()}catch(e){}try{G.setMode&&G.setMode('walk')}catch(e){}});
    await sleep(200);
  }
  await shot(pg,id+'-start');
  let mid;
  if(c.how==='pin') mid=await walkPin(pg,touch);
  else if(c.how==='tile') mid=await walkTile(pg,touch);
  else mid=await walkKeys(pg);
  // arrival wait: no extra commanded tap; presence should start the staff
  const t0=Date.now();
  let arrived=mid;
  while(Date.now()-t0<6000){
    arrived=await probe(pg);
    if(arrived.hasStaff||arrived.mode==='staff'||arrived.st==='come') break;
    await sleep(300);
  }
  flog('arrived',id,arrived);
  await shot(pg,id+'-arrived');
  const staffOn=arrived.mode==='staff'||arrived.hasStaff||arrived.kstaff;
  const atBank=arrived.onBank||(arrived.x>19&&arrived.dNile<10);
  rec(id+'-staff-on-arrival', staffOn||arrived.st==='come'||arrived.st==='plague', {st:arrived.st,mode:arrived.mode,hasStaff:arrived.hasStaff,x:arrived.x,z:arrived.z,dNile:arrived.dNile,onBank:arrived.onBank,bub:arrived.bub});
  let done=arrived;
  if(!(arrived.st==='come'||arrived.st==='plague'||arrived.st==='gap')){
    done=await finishStaff(pg,touch);
  }
  flog('done',id,done);
  await shot(pg,id+'-done');
  const progressed=done.st==='come'||done.st==='plague'||done.st==='gap'||(done.p||0)>=2;
  rec(id+'-river-completes', progressed, {st:done.st,p:done.p,mode:done.mode,hasStaff:done.hasStaff,x:done.x,z:done.z});
  const row={id,how:c.how,before,arrived,done,staffOn,atBank,progressed};
  out.cases.push(row);
  return row;
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'')}catch(e){}
  flog('P1 proof',BASE);
  const sizes=[[1280,715,false],[390,844,true]];
  for(const [w,h,touch] of sizes){
    const tag=w+'x'+h;
    const {br,pg}=await launch(w,h,touch);
    try{
      const ent=await enterEgypt(pg,touch);
      rec(tag+'-enter',ent,await probe(pg));
      if(!ent){await shot(pg,tag+'-enter-fail');continue}
      for(const c of CASES){
        try{await runCase(pg,touch,tag,c)}
        catch(e){flog('case-err',tag,c.id,String(e&&e.stack||e));rec(tag+'-'+c.id+'-exception',false,{err:String(e)})}
      }
    }finally{await br.close().catch(()=>{})}
  }
  const need=out.checks.filter(c=>/-staff-on-arrival$|-river-completes$/.test(c.n));
  const pass=need.filter(c=>c.ok).length;
  out.summary={cases:out.cases.length,need:need.length,pass,fail:need.length-pass};
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',JSON.stringify(out.summary));
  console.log('REPORT',REPORT);
  if(out.summary.fail) process.exit(1);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));try{fs.writeFileSync(REPORT,JSON.stringify({err:String(e),cases:out.cases},null,2))}catch(_){};process.exit(1)});
