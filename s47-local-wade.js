/* Local proof: a real screen tap on visible Nile water walks the kid
   ankle/shin deep. No jumpP into the river. Staff is a separate tap.
   1280 and 390 against the local spark37 server. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s47-local-wade';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s47-local-wade-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s47-local-wade-report.json';

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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height}}
    }
    return best;
  },sel);
  if(!box)return null;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
}
async function domClick(pg,sel){return pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true},sel)}
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
  const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1});
  const pg=await ctx.newPage();
  pg.setDefaultTimeout(60000);
  const jsErrors=[];
  pg.on('pageerror', e=>{const s=String(e&&e.stack||e);jsErrors.push(s);flog('PAGEERROR',s)});
  const join=BASE.includes('?')?'&':'?';
  const url=BASE.replace(/\/$/,'/')+join+'fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  pg._jsErrors=jsErrors;
  return {br,pg};
}
async function enterEgypt(pg,touch){
  await skipOverlay(pg,touch);
  await clickSel(pg,'.a3d-back,.r3d-back,.eg3d-back',touch).catch(()=>{});
  await sleep(300);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(300);
  if(!await clickSel(pg,'a.body.earth',touch)) await domClick(pg,'a.body.earth');
  await sleep(1400);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) {if(!await clickText(pg,'^Africa$',touch)) await domClick(pg,'[data-c="Africa"]');}
  await sleep(1400);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) {if(!await clickText(pg,'Ancient Egypt|Sahara',touch)) await domClick(pg,'[data-env="Sahara"]');}
  const ok=await waitG(pg,'eg3d',touch,60000);
  await sleep(400);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(200);
  return ok;
}

async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const at=G.kidAt?G.kidAt():null;
    const x=at&&at[0], y=at&&at[1], z=at&&(at[2]!=null?at[2]:null);
    const stt=(G.state&&G.state())||{};
    const mis=stt.mis||{};
    const wy=-0.9;
    const dep=(y!=null)?(wy-y):null;
    const inR=!!(x!=null&&Math.abs(x-32)<5.65);
    const sb=document.querySelector('.eg3d-staffb');
    let staffBtn=false,staffUsed=false;if(sb){const b=sb.getBoundingClientRect(),st=getComputedStyle(sb);staffBtn=b.width>=8&&st.display!=='none'&&st.visibility!=='hidden';staffUsed=sb.classList.contains('used')}
    return {x,y,z,dep,inR,st:mis.st,p:mis.p,red:mis.red,mode:G.modeP?G.modeP():stt.mode,staffBtn,staffUsed};
  });
}

async function faceRiverAndTapWater(pg,touch){
  /* Look at the river, then screen-click the projection of a shallows point. No jumpP. */
  const aim=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      if(G.faceToward) G.faceToward(33,14);
      else if(G.camS){G.camS.yaw=-Math.PI/2;G.camS.pitch=.38;G.camS.dist=Math.max(G.camS.dist||10,9)}
    }catch(e){}
    const spots=[[26.8,-0.15,14],[27.2,-0.2,14],[27.4,-0.4,14],[26.6,-0.1,13.2],[27.0,-0.25,15]];
    for(const [x,y,z] of spots){
      const s=G.scrP?G.scrP(x,y,z):null;
      if(s&&s.x>16&&s.x<innerWidth-16&&s.y>20&&s.y<innerHeight-20&&(s.z==null||s.z<1))
        return {x:s.x,y:s.y,wx:x,wy:y,wz:z,ok:true};
    }
    return {ok:false};
  });
  if(!aim||!aim.ok) return {tapped:false,aim};
  if(touch) await pg.touchscreen.tap(aim.x,aim.y); else await pg.mouse.click(aim.x,aim.y);
  return {tapped:true,aim};
}

async function waitShallows(pg,ms=10000){
  const t0=Date.now();
  let last=null;
  while(Date.now()-t0<ms){
    last=await probe(pg);
    if(last&&last.inR&&last.x>=26.35&&last.dep>0.12&&last.dep<=0.85) return last;
    await sleep(250);
  }
  return last;
}

async function runSize(tag,w,h,touch){
  flog('==== SIZE',tag,w,h,'====');
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-fail-enter');return}

    const cache=await pg.evaluate(()=>{
      const hooks=[...document.querySelectorAll('script')].map(s=>s.src).filter(s=>/hook\.js/.test(s));
      return hooks;
    });
    flog(tag,'hooks',cache);

    /* Stand on the DRY bank only. misSet so Staff can appear after a real wade. */
    const parked=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.jumpP)G.jumpP(25.1,14);else if(G.jump)G.jump(25.1,14)}catch(e){}
      try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:0,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
      const at=G.kidAt?G.kidAt():null;
      return {x:at&&at[0],y:at&&at[1],z:at&&at[2],mode:G.getMode&&G.getMode()};
    });
    await sleep(700);
    const bank=await probe(pg);
    rec(tag+'-parked-on-dry-bank', !!(bank&&bank.x!=null&&bank.x<26.2&&!(bank.inR&&bank.dep>0.12)), {parked,bank});
    await shot(pg,tag+'-bank-before-tap');

    /* Real click-walk into the water. Up to 3 taps, same as a player retrying. */
    let after=bank, tapN=0, taps=[];
    for(let i=0;i<3;i++){
      const t=await faceRiverAndTapWater(pg,touch);
      tapN++;
      taps.push(t);
      flog(tag,'water-tap',i,JSON.stringify(t));
      after=await waitShallows(pg,8000);
      flog(tag,'after-tap',i,JSON.stringify(after));
      if(after&&after.inR&&after.x>=26.35&&after.dep>0.12&&after.dep<=0.85) break;
    }
    const waded=!!(after&&after.inR&&after.x>=26.35&&after.dep>0.12&&after.dep<=0.85);
    rec(tag+'-click-water-wades-shallows', waded, {taps:tapN,after,firstTap:taps[0]&&taps[0].aim});
    rec(tag+'-ankle-or-shin-deep', !!(waded&&after.dep>0.12&&after.dep<=0.85), {dep:after&&after.dep,x:after&&after.x,y:after&&after.y});
    await shot(pg,tag+'-after-water-tap');

    const mid=await probe(pg);
    rec(tag+'-no-auto-staff-use', !!(mid&&mid.st==='act'&&(mid.red==null||mid.red<0.2)&&mid.mode!=='cine'), mid);
    rec(tag+'-staff-ready-in-shallows', !!(waded&&(mid.staffBtn||mid.mode==='staff')), mid);

    if(mid.staffBtn||mid.mode==='staff'){
      const hit=await clickSel(pg,'.eg3d-staffb',touch);
      flog(tag,'staff-click',hit);
      await sleep(2800);
    }
    const used=await probe(pg);
    rec(tag+'-staff-tap-starts', !!(used&&(used.st==='come'||used.st==='plague'||used.st==='gap'||(used.red!=null&&used.red>0.2)||used.st!=='act')), used);
    await shot(pg,tag+'-after-staff');
    rec(tag+'-no-js-errors', (pg._jsErrors||[]).length===0, {errCount:(pg._jsErrors||[]).length,jsErrors:pg._jsErrors||[]});
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
  try{fs.writeFileSync(LIVE,'s47 local wade start\n')}catch(e){}
  flog('START',BASE);
  try{
    await runSize('1280',1280,715,false);
    await runSize('390',390,844,true);
  }catch(e){out.err=String(e&&e.stack||e);flog('FATAL',out.err)}
  out.finished=new Date().toISOString();
  out.pass=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>!c.ok).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT,'PASS',out.pass,'FAIL',out.fail);
  process.exit(out.fail?1:0);
})();
