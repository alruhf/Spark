/* spark37 390 bakery walk-away RECAPTURE.
   Default camera, hand-like walk (sand clicks + keyboard). No testfast / jump / camAim / camHold.
   Swiftshader only. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-1h1ucwguq-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/bakery-after';
const LIVE='/tmp/s37bake-away390-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/s36-${n}.png`;await pg.screenshot({path:p});out.shots.push(p);console.log('SHOT',p);return p}


async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')continue;
      const a=b.width*b.height;
      if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height}}
    }
    return best;
  },sel);
  if(!box)return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return true;
}

async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')continue;
      const a=b.width*b.height;
      if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height}}
    }
    return best;
  },sel);
  if(!box)return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return true;
}

async function clickPalacePin(pg,touch){
  // Prefer a visible world pin (largest on-screen .eg3d-pin-pal / data-pin=palace). Also try __eg3d.pinRects.
  let hit=await clickSel(pg,'.eg3d-pin-pal.on,.eg3d-pin-pal,[data-pin="palace"].on,[data-pin="palace"]',touch);
  if(hit) return true;
  const box=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let rects=null;
    try{rects=G.pinRects?G.pinRects():null}catch(e){}
    if(rects&&rects.length){
      const p=rects.find(r=>r.id==='palace')||rects.find(r=>/pal/i.test(r.id||''));
      if(p&&p.x) return {x:p.x,y:p.y};
    }
    return null;
  });
  if(!box) return false;
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

async function launch(w,h,touch,qs=''){
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const hdrs=TOK&&BASE.startsWith('https')?{'x-vercel-trusted-oidc-idp-token':TOK}:{};
  const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1,extraHTTPHeaders:hdrs});
  if(TOK&&BASE.startsWith('https')){
    const root=BASE.replace(/\/$/,'');
    await ctx.route(u=>String(u.href||u).startsWith(root), r=>r.continue({headers:{...r.request().headers(),'x-vercel-trusted-oidc-idp-token':TOK}}));
  }
  const pg=await ctx.newPage();
  pg.setDefaultTimeout(20000);
  const url=BASE.replace(/\/$/,'/')+(qs?((BASE.includes('?')?'&':'?')+qs.replace(/^\?/,'')):'');
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{localStorage.removeItem('sparkEgypt3dV1');localStorage.removeItem('sparkSahara3dV1');localStorage.removeItem('sparkWardrobeV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(1000);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  return {br,pg};
}


async function goEarth(pg,touch){
  await skipOverlay(pg,touch);
  await clickSel(pg,'.a3d-back,.r3d-back,.eg3d-back',touch).catch(()=>{});
  await sleep(400);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(400);
  await clickSel(pg,'a.body.earth',touch);
  await sleep(1200);
}


async function enterAfrica(pg,env,touch){
  await goEarth(pg,touch);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) await clickText(pg,'^Africa$',touch);
  await sleep(1200);
  const sel=env==='Savannah'?'[data-env="Savannah"]':'[data-env="Sahara"]';
  if(!await clickSel(pg,sel,touch)) await clickText(pg,env==='Savannah'?'Savannah':'Ancient Egypt|Sahara',touch);
  return waitG(pg,env==='Savannah'?'s3d':'eg3d',touch,45000);
}


async function enterEgypt(pg,touch){
  const ok=await enterAfrica(pg,'Sahara',touch);
  await sleep(800);
  await closeMap(pg,touch);
  await sleep(400);
  return ok;
}

async function tapScr(pg,x,y,z,touch){
  const box=await pg.evaluate(({x,y,z})=>{
    const G=window.__eg3d||{};
    const scr=G.scrP;
    let p=null;
    if(typeof scr==='function') p=scr(x,y,z);
    if(p&&p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-8) return {x:p.x,y:p.y,via:'scrP',on:true};
    return {x:innerWidth*.5,y:innerHeight*.62,via:'fallback',on:false};
  },{x,y,z});
  if(!box.on) return box;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
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
    if(!hit) return !(await pg.evaluate(()=>!!document.querySelector('.eg3d-map,.sh3d-shop.on,div.sh3d-shop.on')));
    if(touch) await pg.touchscreen.tap(hit.x,hit.y); else await pg.mouse.click(hit.x,hit.y);
    await sleep(400);
  }
  return true;
}


async function onScr(pg,x,y,z){
  return pg.evaluate(({x,y,z})=>{
    try{
      const p=window.__eg3d&&window.__eg3d.scrP&&window.__eg3d.scrP(x,y,z);
      return !!(p&&p.x>12&&p.x<innerWidth-12&&p.y>12&&p.y<innerHeight-12);
    }catch(e){return false}
  },{x,y,z});
}



async function orbitDrag(pg,dx,touch=false){
  const box=await pg.evaluate(()=>{
    const c=document.querySelector('canvas');
    const r=c.getBoundingClientRect();
    return {x:r.left+r.width*.58,y:r.top+r.height*.42};
  });
  // camS.yaw = drag.yaw - dx*0.006  (mouse left increases yaw)
  await pg.mouse.move(box.x,box.y);
  await pg.mouse.down();
  await pg.mouse.move(box.x-dx,box.y,{steps:18});
  await pg.mouse.up();
  await sleep(280);
}


async function faceToward(pg,touch,x,z,tries=10){
  for(let i=0;i<tries;i++){
    const info=await pg.evaluate(({x,z})=>{
      const G=window.__eg3d||{};
      let p=null,yaw=null;
      try{const k=G.kidAt?G.kidAt():(G.state&&G.state().kid); if(k) p={x:k[0],z:(k[2]!=null?k[2]:k[1])}}catch(e){}
      try{const c=G.camP?G.camP():(typeof G.camS==='function'?G.camS():G.camS); if(c) yaw=c.yaw}catch(e){}
      if(!p||yaw==null) return null;
      const want=Math.atan2(p.x-x, p.z-z);
      let d=want-yaw;
      while(d>Math.PI)d-=Math.PI*2;
      while(d<-Math.PI)d+=Math.PI*2;
      return {d,yaw,want,kx:p.x,kz:p.z};
    },{x,z});
    if(!info){await sleep(200);continue}
    if(Math.abs(info.d)<0.22) return true;
    const px=Math.max(36, Math.min(240, Math.abs(info.d)/0.006));
    await orbitDrag(pg, (info.d>0?1:-1)*px, touch);
  }
  return false;
}


async function waitWalk(pg,ms=8000){
  const t0=Date.now();
  let seen=false;
  while(Date.now()-t0<ms){
    const n=await pg.evaluate(()=>{try{const m=window.__eg3d&&window.__eg3d.mvP&&window.__eg3d.mvP();return m&&m.n?m.n:0}catch(e){return 0}});
    if(n) seen=true;
    else if(seen) return;
    else if(Date.now()-t0>2500&&!seen) return;
    await sleep(300);
  }
}



async function st(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let stand=null,mis=null,state=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{stand=G.misPos&&G.misPos('stand')}catch(e){}
    const ka=G.kidAt?G.kidAt():null;
    const mode=(state&&state.mode)||(G.modeP?G.modeP():null);
    const dlg=document.querySelector('.eg3d-dlg,.eg3d-narr');
    const bub=document.querySelector('.eg3d-bub.spark');
    const badge=!!document.querySelector('.eg3d-badge');
    let cine=-1;try{cine=(mis&&mis.cine!=null)?mis.cine:(G.cineT?G.cineT():-1)}catch(e){}
    const shown=(state&&state.pinsShown)||[];
    const pin={
      pal:shown.includes('palace')||!!document.querySelector('.eg3d-pin-pal.on,[data-pin="palace"].on'),
      doors:shown.includes('doors')||!!document.querySelector('.eg3d-pin-doors.on,[data-pin="doors"].on'),
      bed:shown.includes('bed')||!!document.querySelector('.eg3d-pin-bed.on,[data-pin="bed"].on'),
      watch:shown.includes('watch')||!!document.querySelector('.eg3d-pin-act.on,[data-pin="watch"].on'),
      nile:shown.includes('nile')||!!document.querySelector('.eg3d-pin-nile.on,[data-pin="nile"].on'),
      staff:!!document.querySelector('.eg3d-staffb')
    };
    return {
      st:(mis&&mis.st)||(stand&&stand[6])||null,
      p:(mis&&mis.p)!=null?mis.p:(stand?stand[7]:null),
      tabs:(mis&&mis.tabs)!=null?mis.tabs:(stand?stand[8]:null),
      painted:mis&&mis.painted,need:mis&&mis.need,
      kid:ka,mode,cine,badge,pin,pinsShown:shown,
      dlg:dlg?(dlg.textContent||'').replace(/\s+/g,' ').trim().slice(0,160):'',
      bub:bub?(bub.textContent||'').replace(/\s+/g,' ').trim().slice(0,160):'',
      field:mode==='field'||!!document.querySelector('.eg3d-sowcue.on,.eg3d-fdone.on'),
      sowcue:(()=>{const e=document.querySelector('.eg3d-sowcue');return e&&e.classList.contains('on')?(e.textContent||'').trim():''})(),
      portico:(()=>{try{return !!(G.onPortico?G.onPortico():(window.__eg3d&&false))}catch(e){return false}})(),
      kidY:ka?ka[1]:null
    };
  });
}



async function kidNear(pg,x,z,r){
  const s=await st(pg);const k=s.kid||[0,0,0];
  return Math.hypot((k[0]||0)-x,(k[2]||0)-z)<r;
}



async function exitHome(pg,touch){
  const s=await st(pg);
  if(s.mode!=='home') return false;
  await clickSel(pg,'.eg3d-homeleave,.eg3d-home-out',touch);
  await sleep(1200);
  return true;
}

async function releaseKeys(pg){
  for(const k of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D']){
    try{await pg.keyboard.up(k)}catch(e){}
  }
}

async function atPalace(pg){
  const s=await st(pg);
  const k=s.kid||[0,0,0];
  const x=k[0]||0, z=k[2]||0;
  const near=(Math.abs(x+40)<9.5 && Math.abs(z-22)<7.5)
    || (x>-32.4 && x<-27.4 && Math.abs(z-22)<3.4);
  if(near) return true;
  // Dialog alone is not enough — the Passover mat prompt is morning+dlg at (-42,-5).
  if(s.dlg && (s.st==='ask'||s.st==='come'||s.st==='morning') && Math.abs(z-22)<10 && x>-55 && x<-20) return true;
  return false;
}

async function keyWalkTo(pg,x,z,radius=5,ms=40000,touch=false){
  const t0=Date.now();
  let held='';
  let lastFace=0;
  try{
    await faceToward(pg,touch,x,z,6);
    while(Date.now()-t0<ms){
      if(await kidNear(pg,x,z,radius)) return true;
      const info=await pg.evaluate(({x,z})=>{
        const G=window.__eg3d||{};
        let p=null,yaw=null;
        try{const k=G.kidAt?G.kidAt():(G.state&&G.state().kid); if(k) p={x:k[0],z:k[2]!=null?k[2]:k[1]}}catch(e){}
        try{const c=G.camP?G.camP():(typeof G.camS==='function'?G.camS():G.camS); if(c) yaw=c.yaw}catch(e){}
        if(!p||yaw==null||p.x==null) return null;
        const fx=-Math.sin(yaw), fz=-Math.cos(yaw);
        const rx=-fz, rz=fx;
        const dx=x-p.x, dz=z-p.z;
        return {fwd:dx*fx+dz*fz, right:dx*rx+dz*rz, dist:Math.hypot(dx,dz), kx:p.x, kz:p.z, yaw};
      },{x,z});
      if(!info){await sleep(300);continue}
      if(info.dist<radius) return true;
      // If we are walking sideways or backward, turn to face the goal first (hand-like).
      if((info.fwd<1.2 || Math.abs(info.right)>2.2) && Date.now()-lastFace>900){
        await releaseKeys(pg); held='';
        await faceToward(pg,touch,x,z,5);
        lastFace=Date.now();
        continue;
      }
      const keys=[];
      if(info.fwd>0.8) keys.push('ArrowUp');
      else if(info.fwd<-0.8) keys.push('ArrowDown');
      if(info.right>0.8) keys.push('ArrowRight');
      else if(info.right<-0.8) keys.push('ArrowLeft');
      if(!keys.length) keys.push('ArrowUp');
      const want=keys.join('+');
      if(want!==held){
        await releaseKeys(pg);
        for(const k of keys) await pg.keyboard.down(k);
        held=want;
      }
      await sleep(240);
    }
  }finally{
    await releaseKeys(pg);
  }
  return kidNear(pg,x,z,radius+2);
}

async function sandWalkTo(pg,touch,x,z,radius=5,ms=40000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await exitHome(pg,touch);
    if(await kidNear(pg,x,z,radius)) return true;
    const s=await st(pg);
    const k=s.kid||[0,0,0];
    const mx=k[0]+(x-k[0])*0.55, mz=(typeof k[2]==='number'?k[2]:k[1])+(z-(typeof k[2]==='number'?k[2]:k[1]))*0.55;
    const clickPt=async (px,pz)=>{
      const scr=await pg.evaluate(({px,pz})=>{
        const G=window.__eg3d||{};
        const p=G.scrP&&G.scrP(px,0.12,pz);
        if(!p) return null;
        if(!(p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-140)) return null;
        const x=Math.min(innerWidth-24,Math.max(24,p.x));
        const y=Math.min(innerHeight-140,Math.max(70,p.y));
        const el=document.elementFromPoint(x,y);
        if(el&&el.closest&&el.closest('.eg3d-goods,.eg3d-dock,button,.sh3d-shop,.eg3d-pin,.eg3d-pin-pyr,.eg3d-pyrgo,.eg3d-tombleave,[data-pin="plateau"],#grownUpBtn,.spk-askme,.spark-companion,#sparkSay,.eg3d-map')) return null;
        return {x,y,on:true};
      },{px,pz});
      if(!scr) return false;
      if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y);
      return true;
    };
    if(await onScr(pg,x,0.15,z)) await clickPt(x,z);
    else if(await onScr(pg,mx,0.15,mz)) await clickPt(mx,mz);
    else {
      // Never click a clamped off-screen projection (that walks the wrong way).
      await faceToward(pg,touch,x,z,6);
      if(await onScr(pg,x,0.15,z)) await clickPt(x,z);
      else { await keyWalkTo(pg,x,z,radius,8000,touch); continue; }
    }
    await waitWalk(pg,14000);
    await sleep(150);
  }
  return kidNear(pg,x,z,radius+2);
}


async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p,fullPage:false});flog('SHOT',p);return p}

async function bakeryInfo(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let kid=null,cam=null,oven=null,mill=null,bake=null;
    try{const k=G.kidAt?G.kidAt():(G.state&&G.state().kid); if(k) kid={x:k[0],y:k[1],z:k[2]!=null?k[2]:k[1]}}catch(e){}
    try{const c=G.camP?G.camP():(typeof G.camS==='function'?G.camS():G.camS); if(c) cam={yaw:c.yaw,pitch:c.pitch,dist:c.dist,x:c.x,y:c.y,z:c.z}}catch(e){}
    try{if(G.obj){oven=G.obj('oven');mill=G.obj('mill');bake=G.obj('bakery')}}catch(e){}
    return {kid,cam,oven,mill,bake,wh:[innerWidth,innerHeight]};
  });
}

async function runSize(w,h,touch,tag){
  flog('START',tag,w,h);
  const {br,pg}=await launch(w,h,touch,'fresh=1');
  try{
    const ok=await enterEgypt(pg,touch);
    flog('entered',tag,ok);
    if(!ok) throw new Error('enter egypt failed '+tag);
    // Walk into the yard first, then leave south and walk freely away.
    const atIn=await sandWalkTo(pg,touch,3,17.2,2.6,90000);
    flog('at-yard',tag,atIn,await bakeryInfo(pg));
    try{await faceToward(pg,touch,0.2,16.6,6)}catch(e){flog('face-oven',tag,String(e))}
    await sleep(500);
    await shot(pg,tag+'-yard-recap');
    // Exit due south down the clear door lane (x=3), not east toward the quern.
    try{await faceToward(pg,touch,3,8,8)}catch(e){flog('face-south',tag,String(e))}
    const ex1=await keyWalkTo(pg,3,13,2.4,40000,touch);
    flog('at-south-lip',tag,ex1,await bakeryInfo(pg));
    const ex2=await keyWalkTo(pg,3,11.2,2.2,40000,touch);
    flog('at-exit',tag,ex2,await bakeryInfo(pg));
    try{await faceToward(pg,touch,3,6,6)}catch(e){}
    await sleep(500);
    await shot(pg,tag+'-exit-recap');
    // Continue freely away along the south path toward the threshing floor / Nile.
    try{await faceToward(pg,touch,12,12,8)}catch(e){flog('face-away',tag,String(e))}
    const away=await keyWalkTo(pg,12,12,3.0,70000,touch);
    const info=await bakeryInfo(pg);
    const kx=info.kid&&info.kid.x, kz=info.kid&&info.kid.z;
    const free=!!(away && kx!=null && kz!=null && kz<13.2 && !(kx>-2 && kx<10 && kz>14.5 && kz<22));
    flog('at-away',tag,away,{free,kx,kz},info);
    try{await faceToward(pg,touch,18,8,6)}catch(e){}
    await sleep(600);
    await shot(pg,tag+'-away-recap');
    flog(free?'PASS':'FAIL','390-walk-away-free',{away,free,kx,kz});
    flog('DONE',tag,await bakeryInfo(pg));
  }finally{
    await br.close().catch(()=>{});
  }
}

(async()=>{
  try{
    fs.writeFileSync(LIVE,'');
    await runSize(390,844,true,'390');
    flog('ALL_DONE');
  }catch(e){
    flog('ERR',String(e&&e.stack||e));
    process.exitCode=1;
  }
})();
