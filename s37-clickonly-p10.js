/* Click-only P10 proof: from the throne, tap only visible pins / edge arrows /
   doors / the bed mat by screen position. No handGoTo, keyWalk, or auto-walk.
   REPRO=1 against 7a8 documents the mat blocker. Otherwise used as the new-build proof. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-7a8tjojcb-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/clickonly-7a8tjojcb';
const LIVE=process.env.LIVE||'/tmp/s37-clickonly-live.log';
const REPORT=process.env.REPORT||'/tmp/s37-clickonly-report.json';
const ONLY=process.env.ONLY||''; // e.g. 1280 or 390
const DOORS_MS=+(process.env.DOORS_MS||60000);
const MAT_MS=+(process.env.MAT_MS||60000);
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
function classify(x,z){
  const tags=[];
  if(x>20) tags.push('river');
  if(Math.hypot(x-10,z-8)<8) tags.push('threshing');
  if(Math.hypot(x-8,z-16.4)<6||Math.hypot(x-0.2,z-16.6)<6) tags.push('bakery');
  if(x>-32&&x<-22&&z>8&&z<16) tags.push('crops');
  if(x<-20&&z<8) tags.push('goshen');
  if(Math.abs(x+40)<12&&Math.abs(z-22)<10) tags.push('palace');
  return tags;
}
async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let state=null,mis=null,ka=null,mv=null,pins=null,matScr=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    try{mv=G.mvP?G.mvP():null}catch(e){}
    try{pins=state&&state.pinsShown}catch(e){}
    try{if(G.scrP) matScr=G.scrP(-42,0.4,-5)}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], y=kid.length>2?+kid[1]:null, z=kid.length>2?+kid[2]:+kid[1];
    const cnt=document.querySelector('.eg3d-cnt,.eg3d-hg.eg3d-cnt');
    const ct=cnt?((cnt.textContent||'').replace(/\s+/g,' ').trim()):'';
    const cap=document.querySelector('.eg3d-cap,.eg3d-bubble,.eg3d-say,p.eg3d-nl');
    const capT=cap?((cap.textContent||'').replace(/\s+/g,' ').trim()):'';
    const matOn=!!(matScr&&matScr.z<1&&matScr.x>40&&matScr.y>50&&matScr.x<innerWidth-40&&matScr.y<innerHeight-90);
    const bedEl=[...document.querySelectorAll('.eg3d-pin-bed,.eg3d-pin[data-pin="bed"],[data-pin="bed"]')].map(e=>{
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      const vis=b.width>=8&&b.height>=8&&st.display!=='none'&&st.visibility!=='hidden'&&e.classList.contains('on');
      return vis?{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height}:null;
    }).find(Boolean);
    const sb=document.querySelector('.eg3d-staffb');
    let staffBtn=false;if(sb){const b=sb.getBoundingClientRect(),st=getComputedStyle(sb);staffBtn=b.width>=8&&st.display!=='none'&&st.visibility!=='hidden'}
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      painted:mis&&mis.painted,need:mis&&mis.need,
      mode:(state&&state.mode)||null,
      x,y,z,cnt:ct,cap:capT.slice(0,140),
      pinsShown:pins||[],
      pathN:mv&&mv.n, path:mv&&mv.p, walking:!!(mv&&mv.n>0),
      matScr, matOn, bedPin:bedEl||null, staffBtn, mode:(state&&state.mode)||null
    };
  });
}
async function visibleNav(pg){
  return pg.evaluate(()=>{
    const items=[];
    const push=(e,kind,id)=>{
      if(!e)return;
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')return;
      if(b.right<0||b.bottom<0||b.left>innerWidth||b.top>innerHeight)return;
      items.push({kind,id:id||e.dataset.pin||e.getAttribute('data-pin')||'',cls:String(e.className),
        x:b.left+b.width/2,y:b.top+b.height/2,w:+b.width.toFixed(1),h:+b.height.toFixed(1),on:e.classList.contains('on')});
    };
    [...document.querySelectorAll('.eg3d-obja')].forEach(e=>push(e,'arrow','obja'));
    [...document.querySelectorAll('.eg3d-pin,.sh3d-pin,[data-pin]')].forEach(e=>push(e,'pin',e.dataset.pin||''));
    // prefer next-step: bed pin, doors pin, then edge arrow, then any on-screen pin
    const bed=items.find(p=>p.kind==='pin'&&(p.id==='bed'||/pin-bed/.test(p.cls))&&p.on)
      ||items.find(p=>p.kind==='pin'&&(p.id==='bed'||/pin-bed/.test(p.cls)));
    const doors=items.find(p=>p.kind==='pin'&&(p.id==='doors'||/pin-doors/.test(p.cls))&&p.on)
      ||items.find(p=>p.kind==='pin'&&(p.id==='doors'||/pin-doors/.test(p.cls)));
    const arrow=items.find(p=>p.kind==='arrow'&&p.on)||items.find(p=>p.kind==='arrow');
    return {items,bed,doors,arrow,W:innerWidth,H:innerHeight};
  });
}
async function tapXY(pg,x,y,touch){
  if(x==null||y==null) return false;
  if(touch) await pg.touchscreen.tap(x,y); else await pg.mouse.click(x,y);
  return true;
}
async function tapVisible(pg,touch,want){
  const v=await visibleNav(pg);
  let pick=null;
  if(want==='bed') pick=v.bed||v.arrow;
  else if(want==='doors') pick=v.doors||v.arrow;
  else pick=v.bed||v.doors||v.arrow;
  if(!pick) return {ok:false,v};
  await tapXY(pg,pick.x,pick.y,touch);
  return {ok:true,x:pick.x,y:pick.y,kind:pick.kind,id:pick.id,v};
}
async function waitWalk(pg,ms){
  const t0=Date.now();
  let last=await probe(pg);
  const x0=last.x,z0=last.z,p0=last.painted||0,st0=last.st;
  let started=false;
  while(Date.now()-t0<ms){
    last=await probe(pg);
    if(last.walking||Math.hypot((last.x||0)-x0,(last.z||0)-z0)>1.2) started=true;
    if(started && !last.walking && Date.now()-t0>800) return last;
    if((last.painted||0)>p0) return last;
    if(last.st!==st0) return last;
    await sleep(300);
  }
  return last;
}

async function runSize(tag,w,h,touch){
  flog('====',tag,'start',BASE);
  const {br,pg,jsErrors}=await launch(w,h,touch);
  const notes={path:[],bad:[],taps:0,doorTaps:0,matTaps:0};
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-no-egypt');return}

    /* P1 bank: stand where Tester stood (west-bank sand, dock-to-wall) and wait — no tap. Staff must NOT auto-start (Allen: staff only in shallows, no auto-act). */
    const bankSpots=[[16,10],[18,8],[22,14],[14,16]];
    const bankHits=[];
    for(const [bx,bz] of bankSpots){
      await pg.evaluate(({x,z})=>{
        const G=window.__eg3d||{};
        try{if(G.setMode)G.setMode('walk')}catch(e){}
        try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:0,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
        try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
      },{x:bx,z:bz});
      let started=false, last=null;
      const t0=Date.now();
      while(Date.now()-t0<8000){
        last=await probe(pg);
        if(last.staffBtn || last.mode==='staff' || last.st==='come' || last.st==='plague' || /staff/i.test(last.cap||'')){started=true;break}
        await sleep(400);
      }
      bankHits.push({bx,bz,started,ms:Date.now()-t0,st:last&&last.st,mode:last&&last.mode,staffBtn:last&&last.staffBtn,x:last&&last.x,z:last&&last.z});
      await shot(pg,tag+'-p1-bank-'+bx+'-'+bz);
      if(started) break;
    }
    rec(tag+'-p1-bank-no-autostart', bankHits.every(h=>!h.started), {hits:bankHits});

    /* Then wade into the shallows and tap Staff — the intended Tester path. */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:0,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
      try{if(G.jumpP)G.jumpP(27.4,14)}catch(e){}
    });
    await sleep(800);
    let wade=await probe(pg);
    if(!(wade.staffBtn||wade.mode==='staff')){
      for(let i=0;i<8;i++){await sleep(300);wade=await probe(pg);if(wade.staffBtn||wade.mode==='staff')break}
    }
    await shot(pg,tag+'-p1-wade');
    rec(tag+'-p1-wade-staff-ready', !!(wade.staffBtn||wade.mode==='staff'), wade);
    if(wade.staffBtn||wade.mode==='staff'){
      await clickSel(pg,'.eg3d-staffb',touch).catch(()=>{});
      await sleep(1500);
    }
    const afterStaff=await probe(pg);
    await shot(pg,tag+'-p1-staff');
    rec(tag+'-p1-staff-click', !!(afterStaff.st==='come'||afterStaff.st==='plague'||afterStaff.st==='gap'||(afterStaff.mode==='staff')||(afterStaff.st&&afterStaff.st!=='act')), afterStaff);

    /* Leave staff mode before the P10 throne leg. setMode('walk') alone leaves the Staff/Skip chrome and a tight staff camera, which hides the doors pin. */
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{if(G.K&&G.K.resetStaff)G.K.resetStaff()}catch(e){}
      try{if(G.endMode)G.endMode()}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
    });
    await clickSel(pg,'.eg3d-askip,.eg3d-dskip.eg3d-askip',touch).catch(()=>{});
    await clickSel(pg,'.eg3d-dskip',touch).catch(()=>{});
    await sleep(400);

    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[0,1,2,3,4,5,6,7,8,9],auto:0,autoT:0})}catch(e){}
      try{if(G.jumpP)G.jumpP(-44.05,22)}catch(e){}
    });
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{if(G.K&&G.K.resetStaff)G.K.resetStaff()}catch(e){}
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.camS){G.camS.yaw=.85;G.camS.pitch=.32;G.camS.dist=Math.max(10,G.camS.dist||10)}}catch(e){}
      try{if(G.camAim)G.camAim(.85,.32,11)}catch(e){}
    });
    await clickSel(pg,'.eg3d-askip,.eg3d-dskip',touch).catch(()=>{});
    await sleep(1000);
    let p=await probe(pg);
    rec(tag+'-at-throne', p.st==='paint' && (p.painted||0)===0 && p.z>12 && p.x<-35, {x:p.x,z:p.z,st:p.st,painted:p.painted,mode:p.mode,staffBtn:p.staffBtn});
    await shot(pg,tag+'-throne');

    // ---- doors, click-only ----
    const tDoors=Date.now();
    let lastPaint=p.painted||0;
    let firstDoorMs=null;
    for(let i=0;i<12 && (p.painted||0)<5 && p.st==='paint';i++){
      const t=await tapVisible(pg,touch,'doors');
      notes.taps++;
      flog(tag,'tap-doors',t.ok,t.kind,t.id,t.x,t.y,'painted',p.painted);
      if(t.ok) notes.doorTaps++;
      p=await waitWalk(pg,lastPaint===0?70000:40000);
      notes.path.push({ph:'doors',t:Date.now()-tDoors,x:p.x,z:p.z,painted:p.painted,st:p.st,tags:classify(p.x,p.z),walking:p.walking});
      classify(p.x,p.z).forEach(k=>{if(['crops','bakery','threshing','river'].includes(k)&&!notes.bad.includes(k+'@doors'))notes.bad.push(k+'@doors')});
      if((p.painted||0)>lastPaint){if(lastPaint===0&&(p.painted||0)>=1) firstDoorMs=Date.now()-tDoors;lastPaint=p.painted;await shot(pg,tag+'-doors-'+p.painted)}
      if((p.painted||0)>=5) break;
      if(Date.now()-tDoors>240000) break;
    }
    const doorsMs=Date.now()-tDoors;
    const doorsOk=(p.painted||0)>=5 && doorsMs<=DOORS_MS+5000;
    rec(tag+'-first-door-in-60s', firstDoorMs!=null && firstDoorMs<=60000, {ms:firstDoorMs,painted:p.painted,limit:60000});
    rec(tag+'-doors-in-60s', (p.painted||0)>=5 && doorsMs<=DOORS_MS, {ms:doorsMs,painted:p.painted,st:p.st,x:p.x,z:p.z,taps:notes.doorTaps,firstDoorMs,bad:notes.bad.slice(),limit:DOORS_MS});
    rec(tag+'-doors-no-crop-bakery-loop', !notes.bad.some(b=>/@doors$/.test(b)), {bad:notes.bad,path:notes.path});
    await shot(pg,tag+'-after-doors');

    // If not yet sleep, wait for afterPaint
    const tWait=Date.now();
    while(p.st==='paint' && (p.painted||0)>=5 && Date.now()-tWait<8000){await sleep(400);p=await probe(pg)}
    await sleep(1600);
    p=await probe(pg);
    rec(tag+'-sleep-prompt', p.st==='sleep' || /bed mat/i.test(p.cap||'') || /bed mat/i.test(p.cnt||''), {st:p.st,cap:p.cap,cnt:p.cnt,matOn:p.matOn,matScr:p.matScr,bedPin:p.bedPin,x:p.x,z:p.z});
    rec(tag+'-mat-framed', !!(p.matOn && p.bedPin), {matOn:p.matOn,matScr:p.matScr,bedPin:p.bedPin,cap:p.cap,x:p.x,z:p.z});
    await shot(pg,tag+'-sleep-prompt');

    // ---- mat, click-only ----
    const tMat=Date.now();
    const matStart={x:p.x,z:p.z};
    let reached=false, slept=false;
    for(let i=0;i<10;i++){
      p=await probe(pg);
      if(p.st==='morning'||p.st==='free'||p.st==='done'||p.st==='end') {slept=true;reached=true;break}
      if(Math.hypot((p.x||0)+42,(p.z||0)+5)<2.6) reached=true;
      if(reached && p.st!=='sleep') {slept=true;break}
      const t=await tapVisible(pg,touch,'bed');
      notes.taps++;
      if(t.ok) notes.matTaps++;
      flog(tag,'tap-mat',t.ok,t.kind,t.id,t.x,t.y,'st',p.st,'at',p.x,p.z,'matOn',p.matOn);
      // also try tapping the mat itself if it's on screen
      if(p.matOn&&p.matScr){await tapXY(pg,p.matScr.x,p.matScr.y,touch);notes.matTaps++}
      p=await waitWalk(pg,18000);
      const tags=classify(p.x,p.z);
      notes.path.push({ph:'mat',t:Date.now()-tMat,x:p.x,z:p.z,st:p.st,tags,walking:p.walking,matOn:p.matOn});
      tags.forEach(k=>{if(['crops','bakery','threshing','river'].includes(k)&&!notes.bad.includes(k+'@mat'))notes.bad.push(k+'@mat')});
      if(Math.hypot((p.x||0)+42,(p.z||0)+5)<2.6) reached=true;
      if(p.st==='morning'||p.st==='free'||p.st==='done') {slept=true;reached=true;break}
      await shot(pg,tag+'-mat-'+i);
      if(Date.now()-tMat>MAT_MS+20000) break;
    }
    const matMs=Date.now()-tMat;
    rec(tag+'-mat-in-60s', reached && matMs<=MAT_MS && !notes.bad.some(b=>/@mat$/.test(b)), {ms:matMs,reached,slept,st:p.st,x:p.x,z:p.z,from:matStart,taps:notes.matTaps,bad:notes.bad.filter(b=>/@mat$/.test(b)),limit:MAT_MS});
    rec(tag+'-mat-no-river-bakery-loop', !notes.bad.some(b=>/@mat$/.test(b)), {bad:notes.bad,path:notes.path.filter(s=>s.ph==='mat')});
    rec(tag+'-no-js-errors', jsErrors.length===0, {errCount:jsErrors.length,jsErrors});
    await shot(pg,tag+'-final');
    flog(tag,'done',JSON.stringify({doorsMs,matMs,painted:p.painted,st:p.st,x:p.x,z:p.z,bad:notes.bad,reached,slept}));
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
  process.exit(out.fail?1:0);
})();
