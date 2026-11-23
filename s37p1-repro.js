/* Reproduce P1 act-stuck on pwk6un865: after Pharaoh, walking/tapping to the
   river bank does not start the staff, so a kid can sit in st=act forever.
   testfast+misSet+jumpP only to reach act and place start points. The
   approach itself is pin, sand/tile, or keyboard — then we WAIT with no
   extra tap to see whether startAct fires on arrival. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-pwk6un865-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/p1-repro-pwk6un865';
const LIVE=process.env.LIVE||'/tmp/s37p1-repro-live.log';
const REPORT=process.env.REPORT||'/tmp/s37p1-repro-report.json';
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
  for(const sel of ['.sh3d-skip','.s3d-skip','.s3d-retry button','.eg3d-retry button','.eg3d-dskip']) await clickSel(pg,sel,touch).catch(()=>{});
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
  const url=BASE.replace(/\/$/,'/')+'?fresh=1&testfast=1';
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
    const nx=nile[0],nz=nile[1];
    const sb=document.querySelector('.eg3d-staffb');
    const bub=document.querySelector('.eg3d-bub.spark');
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      mode:(state&&state.mode)||null,
      x,y,z,dNile:+Math.hypot(x-nx,z-nz).toFixed(2),
      nile:[nx,nz],
      hasStaff:!!sb, staffUsed:!!(sb&&sb.classList.contains('used')),
      kstaff:!!(G.K&&G.K.kstaff&&G.K.kstaff.visible),
      bub:bub?(bub.textContent||'').replace(/\s+/g,' ').trim().slice(0,140):'',
      nilePin:!!document.querySelector('.eg3d-pin-nile.on,[data-pin="nile"].on')
    };
  });
}
async function seedAct(pg,x,z){
  await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:1,paid:[],auto:0,autoT:0})}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
    try{if(G.camAim)G.camAim(-Math.PI/2-.35,.32,12)}catch(e){}
  },{x,z});
  await sleep(400);
}
async function faceRiver(pg){
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{if(G.camAim)G.camAim(-Math.PI/2-.35,.32,12)}catch(e){}
  });
  await sleep(250);
}
async function worldTap(pg,x,z,touch){
  const scr=await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{
      if(G.toScreen){const s=G.toScreen(x,0.1,z);if(s&&s.x>8&&s.y>8)return {x:s.x,y:s.y,ok:true}}
    }catch(e){}
    return {ok:false};
  },{x,z});
  if(!scr.ok)return false;
  if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y);
  return true;
}
async function waitArrive(pg,ms){
  const t0=Date.now();
  let last=null;
  while(Date.now()-t0<ms){
    last=await probe(pg);
    if(last.hasStaff||last.mode==='staff'||last.st==='come'||last.st==='plague'||last.st==='gap') return last;
    // at the bank: west of water, within ~8 m of the river spot
    if(last.x>17.2&&last.dNile<8) return last;
    await sleep(400);
  }
  return last;
}

const CASES=[
  {id:'tile-from-granary', start:[14.8,11.84], how:'tile'},
  {id:'pin-from-granary', start:[14.8,11.84], how:'pin'},
  {id:'keys-from-granary', start:[14.8,11.84], how:'keys'},
  {id:'tile-from-farm', start:[2,2], how:'tile'},
  {id:'pin-from-farm', start:[2,2], how:'pin'},
  {id:'tile-from-north', start:[18,28], how:'tile'},
  {id:'pin-from-south', start:[16,4], how:'pin'},
  {id:'keys-from-west', start:[8,14], how:'keys'}
];

async function doApproach(pg,touch,c){
  await seedAct(pg,c.start[0],c.start[1]);
  await faceRiver(pg);
  const before=await probe(pg);
  flog('start',c.id,before);
  await shot(pg,c.id+'-start');
  if(c.how==='pin'){
    await sleep(400);
    const hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
    flog('pin-click',c.id,hit);
  }else if(c.how==='tile'){
    // one sand/tile click onto the bank (not a second tap after arrival)
    const bankX=23.1, bankZ=14;
    const tapped=await worldTap(pg,bankX,bankZ,touch)||await worldTap(pg,22,14,touch);
    flog('tile-click',c.id,tapped);
  }else{
    // camera-relative: yaw ~ -pi/2 looks east (+X). Up is camera-forward = east.
    for(let i=0;i<18;i++){await pg.keyboard.down('ArrowUp');await sleep(220);await pg.keyboard.up('ArrowUp');await sleep(40);
      const p=await probe(pg);if(p.x>17.2&&p.dNile<8)break;}
  }
  const arrived=await waitArrive(pg,22000);
  flog('arrived',c.id,arrived);
  await shot(pg,c.id+'-arrived');
  // Kid-like wait: no more taps. Does the staff start on its own?
  await sleep(8000);
  const after=await probe(pg);
  flog('waited',c.id,after);
  await shot(pg,c.id+'-waited');
  const atBank=after.x>17.2&&after.dNile<10;
  const staffOn=after.mode==='staff'||after.hasStaff||after.kstaff;
  const progressed=after.st==='come'||after.st==='plague'||after.st==='gap'||(after.p||0)>=2;
  const stalled=after.st==='act'&&!staffOn;
  const row={id:c.id,how:c.how,before,arrived,after,atBank,staffOn,progressed,stalled};
  out.cases.push(row);
  rec(c.id+'-reached-bank', atBank||progressed||staffOn, {x:after.x,z:after.z,dNile:after.dNile,st:after.st,mode:after.mode});
  rec(c.id+'-staff-or-done', staffOn||progressed, {st:after.st,mode:after.mode,hasStaff:after.hasStaff,bub:after.bub});
  rec(c.id+'-STALL', stalled&&atBank, {stalled,atBank,staffOn,st:after.st,mode:after.mode,x:after.x,z:after.z});
  return row;
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'')}catch(e){}
  flog('P1 act-stall repro',BASE);
  const sizes=[[1280,715,false],[390,844,true]];
  for(const [w,h,touch] of sizes){
    const tag=w+'x'+h;
    const {br,pg}=await launch(w,h,touch);
    try{
      const ent=await enterEgypt(pg,touch);
      rec(tag+'-enter',ent,await probe(pg));
      if(!ent){await shot(pg,tag+'-enter-fail');continue}
      for(const c of CASES){
        try{await doApproach(pg,touch,Object.assign({id:tag+'-'+c.id},c))}
        catch(e){flog('case-err',tag,c.id,String(e&&e.stack||e));rec(tag+'-'+c.id+'-exception',false,{err:String(e)})}
      }
    }finally{await br.close().catch(()=>{})}
  }
  const stalls=out.cases.filter(c=>c.stalled&&c.atBank);
  out.summary={n:out.cases.length,stalls:stalls.length,ids:stalls.map(c=>c.id)};
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',JSON.stringify(out.summary));
  console.log('REPORT',REPORT);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));try{fs.writeFileSync(REPORT,JSON.stringify({err:String(e),cases:out.cases},null,2))}catch(_){};process.exit(1)});
