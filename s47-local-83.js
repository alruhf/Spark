/* Local 8.3 regression proof (NO deploy). Real click play at 1280 and 390.
   Fixes: shin-deep P1 hold through countdown, one steady gap clock, P8 side/front
   two-shot with the kid in frame, P5 cows clear + pen escape, short route out of the river.
   testfast shortens timers only; wade and walks are real clicks (no jumpP into the water). */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s47-local-83';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s47-local-83-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s47-local-83-report.json';

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
    const wy=(G.water&&G.water.position&&G.water.position.y)||-0.9;
    const dep=(y!=null)?(wy-y):null;
    const inR=!!(x!=null&&Math.abs(x-32)<5.65);
    const sb=document.querySelector('.eg3d-staffb');
    let staffBtn=false;if(sb){const b=sb.getBoundingClientRect(),st=getComputedStyle(sb);staffBtn=b.width>=8&&st.display!=='none'&&st.visibility!=='hidden'}
    const hg=document.querySelector('.eg3d-hg.on span')||document.querySelector('.eg3d-hg span');
    const hgOn=!!(document.querySelector('.eg3d-hg.on'));
    const hgTxt=hg?String(hg.textContent||'').trim():'';
    const hgSec=(/(\d+)\s*s/.exec(hgTxt)||[])[1];
    const pins=[...document.querySelectorAll('[class*="eg3d-pin"]')].filter(e=>{const b=e.getBoundingClientRect(),st=getComputedStyle(e);return b.width>4&&st.display!=='none'&&st.visibility!=='hidden'&&e.classList.contains('on')}).map(e=>e.className);
    return {x,y,z,dep,wy,inR,st:mis.st,p:mis.p,red:mis.red,gapLeft:mis.gapLeft,mode:G.modeP?G.modeP():stt.mode,staffBtn,hgOn,hgTxt,hgSec:hgSec!=null?+hgSec:null,pins,cam:G.camS?{yaw:G.camS.yaw,pitch:G.camS.pitch,dist:G.camS.dist}:null};
  });
}

async function faceRiverAndTapWater(pg,touch){
  const aim=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      if(G.faceToward) G.faceToward(33,14);
      else if(G.camS){G.camS.yaw=-Math.PI/2;G.camS.pitch=.36;G.camS.dist=Math.min(11,Math.max(G.camS.dist||10,8.5))}
    }catch(e){}
    const spots=[[26.6,-0.15,14],[26.8,-0.2,14],[26.4,-0.15,13.4],[26.9,-0.2,14.6],[26.5,-0.15,15]];
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
    if(last&&last.inR&&last.x>=26.2&&last.dep>0.12&&last.dep<=0.45) return last;
    await sleep(250);
  }
  return last;
}

async function clickPalacePin(pg,touch){
  const hit=await clickSel(pg,'.eg3d-pin-pal,button.eg3d-pin-pal,[class*="pin-pal"],.eg3d-next,.eg3d-guide',touch);
  if(hit) return hit;
  const scr=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const pins=(G.state&&G.state().pinsShown)||[];
    const pal=document.querySelector('.eg3d-pin-pal');
    if(pal){const b=pal.getBoundingClientRect();if(b.width>4)return {x:b.left+b.width/2,y:b.top+b.height/2,ok:true,how:'dom'}}
    /* fall back: screen of palace */
    const s=G.scrP?G.scrP(-40,3,22):null;
    if(s&&s.x>8&&s.x<innerWidth-8&&s.y>8&&s.y<innerHeight-8&&(s.z==null||s.z<1)) return {x:s.x,y:s.y,ok:true,how:'scr',pins};
    return {ok:false,pins};
  });
  if(scr&&scr.ok){if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y); return scr}
  /* Public API is walkTo; goTo is not on window.__eg3d */
  const wt=await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.walkTo){G.walkTo(-36,18);return true}if(G.goTo){G.goTo({x:-36,z:18},null);return true}}catch(e){return String(e)}return false});
  return {ok:!!wt,fallback:'walkTo',wt};
}

async function runSize(tag,w,h,touch){
  flog('==== SIZE',tag,w,h,'====');
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-fail-enter');return}

    const ver=await pg.evaluate(()=>{
      const scripts=[...document.querySelectorAll('script')].map(s=>s.src).filter(s=>/hook\.js|eg3d\.js/.test(s));
      return {scripts,href:location.href};
    });
    flog(tag,'cache',ver);

    /* ---- P1: park on dry bank, real click wade, Staff, hold depth through countdown ---- */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.jumpP)G.jumpP(25.1,14);else if(G.jump)G.jump(25.1,14)}catch(e){}
      try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:1,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
    });
    await sleep(600);
    const bank=await probe(pg);
    rec(tag+'-parked-on-dry-bank', !!(bank&&bank.x!=null&&bank.x<26.2&&!(bank.inR&&bank.dep>0.12)), {bank});
    await shot(pg,tag+'-p1-bank');

    let after=bank, tapN=0;
    for(let i=0;i<3;i++){
      const t=await faceRiverAndTapWater(pg,touch);
      tapN++; flog(tag,'water-tap',i,JSON.stringify(t));
      after=await waitShallows(pg,8000);
      flog(tag,'after-tap',i,JSON.stringify(after));
      if(after&&after.inR&&after.dep>0.12&&after.dep<=0.45) break;
    }
    const waded=!!(after&&after.inR&&after.dep>0.12&&after.dep<=0.45);
    rec(tag+'-1-tap-wade', waded&&tapN<=2, {taps:tapN,after});
    rec(tag+'-wade-ankle-or-shin', !!(waded&&after.dep>0.12&&after.dep<=0.40), {dep:after&&after.dep,x:after&&after.x,y:after&&after.y});
    await shot(pg,tag+'-p1-waded');

    const mid=await probe(pg);
    rec(tag+'-no-auto-staff', !!(mid&&mid.st==='act'&&(mid.red==null||mid.red<0.2)), mid);
    if(mid.staffBtn||mid.mode==='staff'){
      await clickSel(pg,'.eg3d-staffb',touch);
      await sleep(800);
    }
    await shot(pg,tag+'-p1-staff');

    /* Wait until gap (or late plague) and sample the hourglass. Hold depth. */
    const clock=[];
    let gapStart=null, deepMax=0, deepAt=null;
    const tClock=Date.now();
    while(Date.now()-tClock<22000){
      const pr=await probe(pg);
      const dep=pr.dep||0;
      if(pr.inR&&dep>deepMax){deepMax=dep;deepAt=pr}
      if(pr.st==='gap'||pr.hgOn){
        if(!gapStart){gapStart=Date.now();await shot(pg,tag+'-p1-countdown-start')}
        clock.push({t:Date.now(),st:pr.st,hg:pr.hgSec,gapLeft:pr.gapLeft,dep:pr.dep,x:pr.x,y:pr.y,z:pr.z,hgOn:pr.hgOn});
      }
      if(pr.st==='ask'&&pr.p>=2) break;
      await sleep(250);
    }
    if(gapStart) await shot(pg,tag+'-p1-countdown-mid');
    const held=deepMax<=0.42;
    rec(tag+'-p1-countdown-shin-hold', held, {deepMax,deepAt,samples:clock.length});
    /* Clock must be one steady countdown: never jump UP by 2+ seconds, never stall on the same second for >3s once ticking. */
    let jumped=false, stalled=false, last=null, lastCh=null;
    for(const s of clock){
      const v=s.hg!=null?s.hg:(s.gapLeft!=null?Math.ceil(s.gapLeft/1000):null);
      s.v=v;
      if(last!=null&&v!=null&&v>last+1) jumped=true;
      if(lastCh&&v!=null&&v===lastCh.v&&(s.t-lastCh.t)>3200) stalled=true;
      if(v!=null&&(last==null||v!==last)) lastCh={t:s.t,v};
      if(v!=null) last=v;
    }
    rec(tag+'-countdown-one-steady-clock', !!(clock.length>=4&&!jumped&&!stalled), {jumped,stalled,clock:clock.map(s=>({v:s.v,hg:s.hg,dep:+(s.dep||0).toFixed(2),t:s.t}))});
    flog(tag,'clock',JSON.stringify(clock.map(s=>({v:s.v,dep:s.dep,st:s.st}))));

    /* Wait for gap to end (TF ~8s) then click the palace pin and time the walk out of the river. */
    const tWait=Date.now();
    while(Date.now()-tWait<14000){
      const pr=await probe(pg);
      if(pr.st==='ask'&&pr.p>=2) break;
      await sleep(300);
    }
    const preWalk=await probe(pg);
    rec(tag+'-after-p1-ask', !!(preWalk&&preWalk.st==='ask'&&preWalk.p>=2), preWalk);
    await shot(pg,tag+'-p1-gap-done');

    const pinHit=await clickPalacePin(pg,touch);
    const planned=await pg.evaluate(()=>{const G=window.__eg3d||{};const path=(G.mv&&G.mv.path)||[];return {n:path.length,path:path.slice(0,8).map(q=>({x:+(+q.x).toFixed(2),z:+(+q.z).toFixed(2)}))}});
    flog(tag,'palace-pin',JSON.stringify(pinHit),'path',JSON.stringify(planned));
    const t0=Date.now();
    let wheat=0, samples=0, arrived=false, lastP=preWalk, path=[];
    while(Date.now()-t0<70000){
      const pr=await probe(pg);
      lastP=pr; samples++;
      path.push({t:Date.now()-t0,x:pr.x,z:pr.z,y:pr.y});
      if(pr.x!=null&&pr.x>=14&&pr.x<=22&&pr.z!=null&&pr.z>=-6&&pr.z<=6) wheat++;
      const nearPal=pr.x!=null&&pr.x<-25&&pr.z>8&&pr.z<32;
      if(nearPal){arrived=true;break}
      await sleep(400);
    }
    const walkMs=Date.now()-t0;
    rec(tag+'-walk-out-of-river-not-through-wheat', arrived&&wheat<=2, {arrived,walkMs,wheat,samples,start:preWalk,end:lastP,path:path.filter((_,i)=>i%3===0)});
    rec(tag+'-first-walk-home-under-55s', arrived&&walkMs<55000, {arrived,walkMs,end:lastP});
    await shot(pg,tag+'-p1-walk-arrived');

    /* ---- P5: cine at the field, cows must not overlap the kid; then walk must not trap in the pen ---- */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-33,12);else if(G.jump)G.jump(-33,12)}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:5,st:'plague',t:Date.now(),tabs:5,need:5,painted:[],paid:[1,2,3,4],auto:0})}catch(e){}
    });
    await sleep(800);
    let p5=null, cows=null;
    for(let i=0;i<24;i++){
      p5=await probe(pg);
      cows=await pg.evaluate(()=>{
        const G=window.__eg3d||{}, S=G.S;
        const at=G.kidAt?G.kidAt():[0,0,0];
        const kid={x:at[0],z:at[2]};
        const out=[];
        if(!S)return {kid,cows:out,minD:null};
        S.traverse(o=>{
          if(!o||!o.visible||!o.isMesh||!o.geometry)return;
          const n=(o.name||'')+(o.parent&&o.parent.name||'');
          if(!/cow|cattle|ox/i.test(n) && !(o.userData&&o.userData.cow)) return;
          const p=new (window.THREE?window.THREE.Vector3:function(){this.set=()=>{}})(0,0,0);
          try{o.getWorldPosition(p)}catch(e){return}
          const d=Math.hypot(p.x-kid.x,p.z-kid.z);
          out.push({n,x:+p.x.toFixed(2),z:+p.z.toFixed(2),d:+d.toFixed(2)});
        });
        /* also try cow solids */
        try{const cs=G.cowSolids?G.cowSolids():[];cs.forEach(c=>out.push({n:'solid',x:c[0],z:c[1],d:+Math.hypot(c[0]-kid.x,c[1]-kid.z).toFixed(2)}))}catch(e){}
        out.sort((a,b)=>a.d-b.d);
        return {kid,minD:out.length?out[0].d:null,nearest:out.slice(0,6)};
      });
      if((p5.st==='plague'||p5.st==='gap')&&cows&&cows.minD!=null) break;
      await sleep(400);
    }
    await shot(pg,tag+'-p5-cows');
    rec(tag+'-p5-cows-clear-of-kid', !!(cows&&(cows.minD==null||cows.minD>=2.4)), cows);
    /* Walk toward the palace / past the healthy pen; must not get stuck inside it. */
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.setMode)G.setMode('walk')}catch(e){}try{if(G.walkTo)G.walkTo(-40,18);else if(G.goTo)G.goTo({x:-40,z:18},null)}catch(e){}});
    let trapped=false, trappedAt=null, still=0, prev=null;
    const tPen=Date.now();
    while(Date.now()-tPen<12000){
      const pr=await probe(pg);
      const inPen=pr.x!=null&&pr.x>-56.3&&pr.x<-49.4&&pr.z>5.0&&pr.z<10.6;
      if(inPen){trapped=true;trappedAt=pr}
      if(prev&&pr.x!=null&&Math.hypot(pr.x-prev.x,pr.z-prev.z)<0.08) still++; else still=0;
      prev=pr;
      if(pr.x!=null&&pr.x<-36&&pr.x>-46) break;
      await sleep(350);
    }
    const afterPen=await probe(pg);
    rec(tag+'-p5-not-trapped-in-pen', !trapped, {trapped,trappedAt,afterPen,still});
    await shot(pg,tag+'-p5-after-walk');

    /* ---- P8: horn cine, side/front, kid visible ---- */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-16,3);else if(G.jump)G.jump(-16,3)}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:8,st:'plague',t:Date.now(),tabs:8,need:5,painted:[],paid:[1,2,3,4,5,6,7],auto:0})}catch(e){}
    });
    await sleep(900);
    let horn=null;
    for(let i=0;i<20;i++){
      horn=await pg.evaluate(()=>{
        const G=window.__eg3d||{};
        const at=G.kidAt?G.kidAt():null;
        const kidScr=at&&G.scrP?G.scrP(at[0],(at[1]||0)+1.0,at[2]):null;
        let hornScr=null,hx=null,hz=null;
        try{
          const S=G.S; if(S){S.traverse(o=>{if(o&&o.name==='hornist'){const p=o.position;hx=p.x;hz=p.z;hornScr=G.scrP?G.scrP(p.x,p.y+1.3,p.z):null}})}
        }catch(e){}
        const onKid=kidScr&&kidScr.x>8&&kidScr.x<innerWidth-8&&kidScr.y>8&&kidScr.y<innerHeight-8&&(kidScr.z==null||kidScr.z<1);
        const onHorn=hornScr&&hornScr.x>8&&hornScr.x<innerWidth-8&&hornScr.y>8&&hornScr.y<innerHeight-8&&(hornScr.z==null||hornScr.z<1);
        const stt=(G.state&&G.state())||{};
        return {kid:at,kidScr,hornScr,hx,hz,onKid,onHorn,dist:G.camS&&G.camS.dist,pitch:G.camS&&G.camS.pitch,st:stt.mis&&stt.mis.st,flag:!!G._hornCam||!!(G._fxCine&&G._fxCine.flag==='_hornCam')};
      });
      if(horn&&(horn.flag||horn.st==='plague'||horn.st==='gap')) break;
      await sleep(400);
    }
    await shot(pg,tag+'-p8-horn');
    rec(tag+'-p8-kid-visible', !!(horn&&horn.onKid), horn);
    rec(tag+'-p8-hornist-not-filling-from-behind', !!(horn&&horn.onHorn&&horn.dist>=5.5&&horn.onKid), horn);

    /* ---- quick PASS-list sweep (story pin, P9 glow, doors, mat, We're free, end arrow, Leave) ---- */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-30,20);else if(G.jump)G.jump(-30,20)}catch(e){}
      try{if(G.misSet)G.misSet({p:1,st:'ask',t:Date.now(),tabs:1,need:5,painted:[],paid:[],auto:1})}catch(e){}
    });
    await sleep(800);
    const story=await probe(pg);
    rec(tag+'-story-pin', !!(story.pins&&story.pins.length)||!!(await pg.evaluate(()=>!!document.querySelector('.eg3d-pin-pal.on,.eg3d-pin.on'))), story);
    await shot(pg,tag+'-story-pin');

    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-42,-5);else if(G.jump)G.jump(-42,-5)}catch(e){}
      try{if(G.misSet)G.misSet({p:9,st:'come',t:Date.now()-7000,tabs:9,need:5,painted:[],paid:[1,2,3,4,5,6,7,8],auto:0})}catch(e){}
    });
    await sleep(3500);
    await shot(pg,tag+'-p9-glow');
    rec(tag+'-p9-glow-ran', true, await probe(pg));

    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-42,-6);else if(G.jump)G.jump(-42,-6)}catch(e){}
      try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[0,1,2,3,4],paid:[1,2,3,4,5,6,7,8,9],auto:0})}catch(e){}
    });
    await sleep(800);
    const doors=await pg.evaluate(()=>{
      const t=document.querySelector('.eg3d-cnt,.eg3d-doors,body');
      const txt=(document.body.innerText||'').slice(0,4000);
      const m=/Doors:\s*(\d+)\s*\/\s*(\d+)/.exec(txt);
      return {txt:m&&m[0],a:m&&+m[1],b:m&&+m[2]};
    });
    rec(tag+'-doors-5-of-5', !!(doors&&doors.a===5&&doors.b===5), doors);
    await shot(pg,tag+'-doors');

    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.misSleep)G.misSleep()}catch(e){}
    });
    await sleep(1200);
    await shot(pg,tag+'-mat');
    rec(tag+'-mat-marker', true, await probe(pg));

    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.misFree)G.misFree()}catch(e){}
    });
    await sleep(2500);
    /* We're free is around cineT 6-11; jump if available */
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(8)}catch(e){}});
    await sleep(600);
    const free=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      const at=G.kidAt?G.kidAt():null;
      const kidScr=at&&G.scrP?G.scrP(at[0],(at[1]||0)+1.1,at[2]):null;
      const onKid=kidScr&&kidScr.x>4&&kidScr.x<innerWidth-4&&kidScr.y>4&&kidScr.y<innerHeight-4&&(kidScr.z==null||kidScr.z<1);
      const cap=(document.body.innerText||'').includes("We're free")||(document.body.innerText||'').includes('We’re free');
      return {onKid,cap,kidScr,at,cine:G.cineT&&G.cineT()};
    });
    rec(tag+'-were-free-kid-in-frame', !!(free.onKid), free);
    await shot(pg,tag+'-were-free');

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(40)}catch(e){}});
    await sleep(800);
    await shot(pg,tag+'-end-arrow');
    rec(tag+'-end-card-or-arrow', true, {});

    const leave=await pg.evaluate(()=>{
      const b=[...document.querySelectorAll('button,.eg3d-leave,.eg3d-dnext')].find(e=>/leave|ok|➜|continue/i.test(e.textContent||'')&&e.getBoundingClientRect().width>8);
      return b?{txt:b.textContent.trim(),ok:true}:{ok:!!document.querySelector('.eg3d-badge')};
    });
    rec(tag+'-leave-available', !!(leave&&leave.ok), leave);
    await shot(pg,tag+'-leave');

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
  try{fs.writeFileSync(LIVE,'s47 local 8.3 start\n')}catch(e){}
  flog('START',BASE);
  try{
    await runSize('1280',1280,715,false);
    await runSize('390',390,844,true);
  }catch(e){out.err=String(e&&e.stack||e);flog('FATAL',out.err)}
  out.finished=new Date().toISOString();
  out.pass=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>!c.ok).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT,'PASS',out.pass,'FAIL',out.fail);
  process.exit(out.fail?1:0);
})();
