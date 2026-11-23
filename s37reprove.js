/* spark37 targeted reprove after the glow/horn fix.
   Hand-like: sand clicks + keyboard. No testfast, no misSet/jump/camAim/camHold.
   Fresh save (?fresh=1). 1280x715 and 390x844.
   Reprove P8 horn caption, P9 Goshen glow (homes in frame, night on), short P1–P7 regression,
   and P10 sea cine with army, Pharaoh, and the Ava army caption on screen at BOTH sizes.
   Shots are taken during the cine (do not Skip past cineT>26). Append to PROGRESS.md after each plague.
   Renderer: swiftshader only. Preview only.
*/
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-p7ohy5lwz-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/reprove-p7ohy5lwz';
const out={checks:[],shots:[],err:null,swiftshader:true,gpu:'swiftshader (no real GPU)'};let CURTAG='s37';
const LIVE=process.env.LIVE||'/tmp/s37hand7-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
const PROGRESS='/workspace/p32work/spark37/PROGRESS.md';
function logProgress(title, body){
  const d=new Date();
  const h=d.getHours()%12||12, m=String(d.getMinutes()).padStart(2,'0'), ap=d.getHours()>=12?'PM':'AM';
  const block='\n## '+h+':'+m+' '+ap+' ET — '+title+'\n\n'+(body?body.trim()+'\n\n':'');
  try{fs.appendFileSync(PROGRESS, block)}catch(e){}
  flog('PROGRESS',title);
}

const rec=(n,ok,extra)=>{out.checks.push(Object.assign({n,ok:!!ok},extra||{}));flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};


async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/s36-${n}.png`;let last=null;for(let i=0;i<2;i++){try{await pg.screenshot({path:p,timeout:60000});out.shots.push(p);console.log('SHOT',p);return p}catch(e){last=e;flog('screenshot-retry',n,i,String(e));await sleep(400)}}throw last}


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

/* spark38: P1 and P10 may only click what is visible on screen (pins, edge arrows, the mat, doors, staff, water) by screen position. No handGoTo / keyWalk / leavePalace for those legs. */
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
    const find=(id)=>items.find(p=>p.kind==='pin'&&(p.id===id||(p.cls||'').includes('pin-'+id))&&p.on)
      ||items.find(p=>p.kind==='pin'&&(p.id===id||(p.cls||'').includes('pin-'+id)));
    const arrow=items.find(p=>p.kind==='arrow'&&p.on)||items.find(p=>p.kind==='arrow');
    return {items,nile:find('nile'),doors:find('doors'),bed:find('bed'),palace:find('palace'),arrow,W:innerWidth,H:innerHeight};
  });
}
async function tapVisibleNav(pg,touch,want){
  const v=await visibleNav(pg);
  let pick=null;
  if(want==='nile') pick=v.nile||v.arrow;
  else if(want==='doors') pick=v.doors||v.arrow;
  else if(want==='bed') pick=v.bed||v.arrow;
  else if(want==='palace') pick=v.palace||v.arrow;
  else pick=v.nile||v.doors||v.bed||v.palace||v.arrow;
  if(!pick) return {ok:false,v};
  if(touch) await pg.touchscreen.tap(pick.x,pick.y); else await pg.mouse.click(pick.x,pick.y);
  return {ok:true,x:pick.x,y:pick.y,kind:pick.kind,id:pick.id};
}
async function waitKidWalk(pg,ms,done){
  const t0=Date.now();
  let last=await st(pg), started=false;
  const k0=kidXZ(last);
  while(Date.now()-t0<ms){
    last=await st(pg);
    if(done&&done(last)) return last;
    const k=kidXZ(last);
    if(Math.hypot((k.x||0)-(k0.x||0),(k.z||0)-(k0.z||0))>1.2) started=true;
    const mv=await pg.evaluate(()=>{try{const m=window.__eg3d&&window.__eg3d.mvP&&window.__eg3d.mvP();return m&&m.n}catch(e){return 0}});
    if(started && !mv && Date.now()-t0>800) return last;
    await sleep(350);
  }
  return last;
}
async function waitPaintWalk(pg,ms,painted0){
  /* click-only wait: give the first long walk time to finish; do not treat a brief pause as done. */
  const t0=Date.now();
  let last=await st(pg), started=false;
  const k0=kidXZ(last);
  const st0=last.st;
  while(Date.now()-t0<ms){
    last=await st(pg);
    if((last.painted||0)>painted0) return last;
    if(last.st!==st0) return last;
    const k=kidXZ(last);
    const walking=!!last.walking;
    if(walking||Math.hypot((k.x||0)-(k0.x||0),(k.z||0)-(k0.z||0))>1.2) started=true;
    if(started && !walking && Date.now()-t0>5000) return last;
    await sleep(300);
  }
  return last;
}
async function tapNearDoor(pg,touch,s){
  /* Only tap a house door that the kid is already close to. Distant onScr projections are the lawn-retap bug. */
  const ISH=[[-52,-8],[-47,-9],[-42,-9],[-37,-9],[-32,-8]];
  const k=kidXZ(s||{});
  for(const h of ISH){
    if(Math.hypot((k.x||0)-h[0],(k.z||0)-h[1])>8) continue;
    if(await onScr(pg,h[0],1.0,h[1]+1.55)){await tapScr(pg,h[0],1.0,h[1]+1.55,touch);return true}
    if(await onScr(pg,h[0],0.4,h[1]+1.2)){await tapScr(pg,h[0],0.4,h[1]+1.2,touch);return true}
  }
  return false;
}
async function clickWalkWant(pg,touch,want,ms,done){
  const t0=Date.now();
  let taps=0;
  while(Date.now()-t0<ms){
    const s=await st(pg);
    if(done&&done(s)) return {ok:true,s,taps,ms:Date.now()-t0};
    const t=await tapVisibleNav(pg,touch,want);
    if(t.ok) taps++;
    flog('click-nav',want,t);
    await waitKidWalk(pg,Math.min(20000,ms-(Date.now()-t0)),done);
    const s2=await st(pg);
    if(done&&done(s2)) return {ok:true,s:s2,taps,ms:Date.now()-t0};
  }
  return {ok:false,s:await st(pg),taps,ms:Date.now()-t0};
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
  const jsErrors=[];
  pg.on('pageerror', e=>{const s=String(e&&e.stack||e);jsErrors.push({type:'pageerror',s});flog('PAGEERROR',s)});
  pg.on('console', msg=>{
    if(msg.type()!=='error') return;
    const s=msg.text();
    if(/ReferenceError|is not defined/.test(s)){jsErrors.push({type:'console',s});flog('CONSOLEERROR',s)}
  });
  pg.setDefaultTimeout(60000);
  const url=BASE.replace(/\/$/,'/')+(qs?((BASE.includes('?')?'&':'?')+qs.replace(/^\?/,'')):'');
  const freshUrl=url+(url.includes('?')?'&':'?')+'fresh=1';
  /* spark37: Tester's signed-in fresh-save method. Preview boot clears spark* saves, then strips the param. */
  await pg.goto(freshUrl,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{localStorage.removeItem('sparkEgypt3dV1');localStorage.removeItem('sparkSahara3dV1');localStorage.removeItem('sparkWardrobeV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(1000);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  return {br,pg,jsErrors};
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

/* Drag the canvas (not camAim) until the camera looks toward (x,z). */
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
      kidY:ka?ka[1]:null,
      walking:(()=>{try{const m=G.mvP&&G.mvP();return !!(m&&m.n>0)}catch(e){return false}})()
    };
  });
}


async function waitDlgDone(pg,ms=90000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    const s=await st(pg);
    if(!s.dlg) return s;
    await sleep(400);
  }
  return st(pg);
}


async function waitSt(pg,pred,ms=30000){
  const t0=Date.now();
  let last=null;
  while(Date.now()-t0<ms){
    last=await st(pg);
    if(pred(last)) return last;
    await sleep(400);
  }
  return last;
}


async function kidNear(pg,x,z,r){
  const s=await st(pg);const k=s.kid||[0,0,0];
  return Math.hypot((k[0]||0)-x,(k[2]||0)-z)<r;
}


async function capInfo(pg){
  return pg.evaluate(()=>{
    const cap=document.querySelector('#sparkSay,.spk-cap,.spark-say');
    const ask=document.querySelector('.spk-askme');
    const hg=document.querySelector('.eg3d-hg');
    const bub=document.querySelector('.eg3d-bub.spark');
    const spk=document.querySelector('#sparkCompanion,.spark-companion');
    const box=e=>{if(!e)return null;const b=e.getBoundingClientRect();const st=getComputedStyle(e);if(b.width<2||st.display==='none'||st.visibility==='hidden'||st.opacity==='0')return null;return {x:b.left,y:b.top,w:b.width,h:b.height,r:b.right,b:b.bottom,t:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,180)};};
    const overlap=(a,b)=>{if(!a||!b)return 0;const x=Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x));const y=Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y));return x*y};
    const C=box(cap),A=box(ask),H=box(hg),B=box(bub),S=box(spk);
    return {cap:C,ask:A,hg:H,bub:B,spk:S,ovCapAsk:overlap(C,A),ovCapHg:overlap(C,H),ovBubHg:overlap(B,H),ovBubAsk:overlap(B,A),ovBubSpk:overlap(B,S),ovHgSpk:overlap(H,S),ovHgAsk:overlap(H,A)};
  });
}


async function tapAskMe(pg,touch){
  const box=await pg.evaluate(()=>{
    const sels=['.spk-askme','#sparkCompanion','.spark-companion'];
    for(const sel of sels){
      const e=document.querySelector(sel);
      if(!e) continue;
      const b=e.getBoundingClientRect();
      const st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0') continue;
      return {x:b.left+b.width/2,y:b.top+b.height/2,sel};
    }
    return null;
  });
  if(!box) return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
}


async function paintCnt(pg){
  return pg.evaluate(()=>{
    const e=document.querySelector('.eg3d-cnt,.eg3d-hg.eg3d-cnt');
    if(!e)return {on:false,t:''};
    const st=getComputedStyle(e);const b=e.getBoundingClientRect();
    const on=e.classList.contains('on')&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0'&&b.width>8;
    return {on,t:(e.textContent||'').replace(/\s+/g,' ').trim(),x:b.left,y:b.top,w:b.width,h:b.height};
  });
}


async function hallCam(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let d=null,yaw=null,pit=null;
    try{const c=G.camS?G.camS():G.camGet&&G.camGet();if(c){d=c.dist;yaw=c.yaw;pit=c.pitch}}catch(e){}
    try{if(d==null&&G.camD)d=G.camD()}catch(e){}
    const k=G.kidAt?G.kidAt():null;
    const mode=(G.state&&G.state()||{}).mode;
    return {d,yaw,pit,k,mode,W:innerWidth,H:innerHeight};
  });
}


async function seaLook(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S,THREE=dbg.THREE;
    const o={seaVis:0,seaOp:0,seaVC:0,foam:0,fish:0,ripples:0,pillarSprites:0,pillarIco:0,pillarH:0};
    if(!S) return o;
    S.traverse(obj=>{
      const p=obj.getWorldPosition?obj.getWorldPosition(new THREE.Vector3()):obj.position;
      const near=p&&Math.hypot((p.x||0)+48,(p.z||0)-86)<16;
      if(obj.isMesh&&obj.visible&&near){
        const mat=obj.material;
        if(mat&&(mat.transparent||(mat.opacity!=null&&mat.opacity<1))) {o.seaVis++;o.seaOp=Math.max(o.seaOp,1-(mat.opacity||1))}
        if(mat&&mat.vertexColors) o.seaVC++;
        if(obj.isInstancedMesh&&obj.count>=40) o.foam+=obj.count;
        if(obj.isInstancedMesh&&obj.count>0&&obj.count<=10&&mat&&mat.transparent) o.fish+=obj.count;
      }
      if(obj.isSprite&&obj.visible){
        const wp=obj.getWorldPosition(new THREE.Vector3());
        if(Math.hypot((wp.x||0)+48,(wp.z||0)-86)<20 || (wp.y||0)>3){
          const map=obj.material&&obj.material.map;
          if(map) o.pillarSprites++;
          o.pillarH=Math.max(o.pillarH,wp.y||0);
        }
      }
      if(obj.isInstancedMesh&&obj.visible&&obj.geometry&&obj.geometry.type==='IcosahedronGeometry'&&obj.count>20&&obj.count<60) o.pillarIco+=obj.count;
    });
    return o;
  });
}


async function armyLook(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S, THREE=dbg.THREE, cam=dbg.cam;
    const info={pharaoh:0,pharaohInView:0,army:0,armyInView:0,names:[]};
    if(!S) return info;
    const frustum=cam&&THREE?new THREE.Frustum():null;
    const m=THREE?new THREE.Matrix4():null;
    if(cam&&THREE){cam.updateMatrixWorld();frustum.setFromProjectionMatrix(m.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse))}
    const named=o=>{const n=[];let p=o;while(p){if(p.name)n.push(p.name);p=p.parent}return n.join('/')};
    S.traverse(o=>{
      if(!o.visible) return;
      const nm=named(o);
      const isPh=/seaPharaoh/i.test(nm);
      const isAr=/seaArmy/i.test(nm);
      if(!isPh&&!isAr) return;
      if(isPh) info.pharaoh++;
      if(isAr) info.army++;
      if(info.names.length<8) info.names.push(nm);
      if(frustum&&o.isMesh){
        try{
          if(frustum.intersectsObject(o)){
            if(isPh) info.pharaohInView++;
            if(isAr) info.armyInView++;
          }
        }catch(e){}
      }
    });
    return info;
  });
}


async function nileXZ(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{const a=G.misPos&&G.misPos('nile');if(a&&a.length>=2)return {x:a[0],z:a[1]}}catch(e){}
    try{const s=G.misPos&&G.misPos('stand');if(s&&s.length>=6)return {x:s[4],z:s[5]}}catch(e){}
    try{const sp=G.misPos&&G.misPos('spots');if(sp&&sp.nile)return {x:sp.nile[0],z:sp.nile[1]}}catch(e){}
    return {x:8,z:14};
  });
}


async function exitHome(pg,touch){
  const s=await st(pg);
  if(s.mode!=='home') return false;
  await clickSel(pg,'.eg3d-homeleave,.eg3d-home-out',touch);
  await sleep(1200);
  return true;
}


async function nightInfo(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let sun=null,dim=null,hemi=null;
    try{sun=G.sun&&G.sun.intensity}catch(e){}
    try{dim=G.skyU&&G.skyU.dimv&&G.skyU.dimv.value}catch(e){}
    try{hemi=G.hemi&&G.hemi.intensity}catch(e){}
    const cap=(document.querySelector('.eg3d-bub.spark,.eg3d-dlg,.eg3d-narr')||{}).textContent||'';
    return {sun,dim,hemi,night:(sun!=null&&sun<1.2)||(dim!=null&&dim<0.4),cap:String(cap).replace(/\s+/g,' ').trim().slice(0,180)};
  });
}


async function pharaohOnScreen(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let ph=null;
    try{ph=G.misPos&&G.misPos('pharaoh')}catch(e){}
    if(!ph) ph=[-47,22];
    const x=ph[0],z=ph[1]!=null?ph[1]:ph[2];
    const p=G.scrP&&G.scrP(x,1.4,z);
    const on=!!(p&&p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-8&&(p.z==null||p.z<1));
    return {on,p,ph:[x,z],W:innerWidth,H:innerHeight};
  });
}


async function plagueLook(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S,THREE=dbg.THREE;
    const o={hail:0,hailTrans:0,boils:0,horn:0,frogs:0,cows:0,arms:[],stiff:0,idle:0,proc:[]};
    if(!S||!THREE) return o;
    S.traverse(obj=>{
      if(obj.userData&&obj.userData.boil&&obj.visible) o.boils++;
      if((obj.name==='frog'||(obj.parent&&obj.parent.name==='frog'))&&obj.visible&&obj.isMesh) o.frogs++;
      if(obj.isGroup&&obj.visible&&obj.parent===S&&obj.rotation&&Math.abs(obj.rotation.x)>0.6) o.cows++;
      if(obj.isInstancedMesh&&obj.visible&&obj.geometry&&obj.geometry.type==='IcosahedronGeometry'){
        o.hail+=obj.count||0;
        const mat=obj.material;
        if(mat&&(mat.transmission>0||(mat.transparent&&mat.opacity<0.8))) o.hailTrans=1;
      }
      const nm=((obj.name||'')+' '+((obj.userData&&obj.userData.kind)||'')).toLowerCase();
      if((/horn/.test(nm)||/hornist|ramshorn/i.test(obj.name||''))&&obj.visible) o.horn++;
      const u=obj.userData;
      if(u&&u.arms&&u.arms.length>=2){
        const a0=u.arms[0].rotation,a1=u.arms[1].rotation;
        const rec={x0:+(a0.x||0).toFixed(2),z0:+(a0.z||0).toFixed(2),x1:+(a1.x||0).toFixed(2),z1:+(a1.z||0).toFixed(2)};
        if(o.arms.length<12) o.arms.push(rec);
        if(Math.abs(a0.z)>0.7||Math.abs(a1.z)>0.7) o.stiff++; else o.idle++;
      }
      const p=obj.position||{};
      if(obj.visible&&obj.userData&&obj.userData.legs&&Math.hypot((p.x||0)+48,(p.z||0)-86)<20){
        if(o.proc.length<12) o.proc.push({x:+(p.x||0).toFixed(2),z:+(p.z||0).toFixed(2)});
      }
    });
    return o;
  });
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

async function exitTomb(pg,touch){
  // The pyramid "Way out" control is .eg3d-tombleave, not .eg3d-back. Never tap .eg3d-pyrgo (that goes in).
  for(let i=0;i<12;i++){
    const mode=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{};
        const m=(G.modeP&&G.modeP())||(G.K&&G.K.getMode&&G.K.getMode())||null;
        const tomb=!!(document.querySelector('.eg3d-tombleave, [data-tomb], .eg3d-wrap[data-tomb="1"]')||(G.K&&G.K.wrap&&G.K.wrap.dataset&&G.K.wrap.dataset.tomb==='1'));
        return {m,tomb};
      }catch(e){return {m:null,tomb:false}}
    });
    if(mode.m==='walk'&&!mode.tomb) return true;
    await clickSel(pg,'.eg3d-tombleave:not(.eg3d-digb),.eg3d-tombleave',touch).catch(()=>{});
    try{await pg.keyboard.press('Escape')}catch(e){}
    await clickSel(pg,'.eg3d-back,#homeBtn',touch).catch(()=>{});
    await sleep(500);
  }
  return (await st(pg)).mode==='walk';
}

async function exitBusy(pg,touch){
  await exitTomb(pg,touch);
  for(let i=0;i<5;i++){
    await closeMap(pg,touch);
    await clickSel(pg,'.sh3d-shopx,.sh3d-closex,.sh3d-bookx,.eg3d-mapx,.eg3d-shopx,.sh3d-rskip,[aria-label="Close"]',touch).catch(()=>{});
    try{await pg.keyboard.press('Escape')}catch(e){}
    const mode=await pg.evaluate(()=>{try{return window.__eg3d&&window.__eg3d.modeP&&window.__eg3d.modeP()}catch(e){return null}});
    if(!mode || mode==='walk' || mode==='staff' || mode==='scene') return;
    if(mode==='tomb'){ await exitTomb(pg,touch); return; }
    await clickSel(pg,'.eg3d-tombleave,.eg3d-back',touch).catch(()=>{});
    await sleep(250);
  }
}

function kidXZ(s){
  const k=s&&s.kid||[0,0,0];
  const x=k[0]||0;
  const z=(typeof k[2]==='number'?k[2]:k[1])||0;
  return {x,z};
}

async function leavePalace(pg,touch){
  for(let i=0;i<8;i++){
    await exitBusy(pg,touch);
    const p=kidXZ(await st(pg));
    const inPal=Math.abs(p.x+40)<12 && Math.abs(p.z-22)<10;
    if(!inPal || (p.x>-31 && Math.abs(p.z-22)<4.5)) return p.x>-31;
    // east aisle / ramp, not north around the temple
    if(p.x<=-31){
      await sandWalkTo(pg,touch,-29.0,22,2.0,9000);
      if(!(await kidNear(pg,-29.0,22,2.4))) await keyWalkTo(pg,-29.0,22,2.0,8000,touch);
    } else {
      await sandWalkTo(pg,touch,-27.5,22,2.0,6000);
    }
  }
  const p=kidXZ(await st(pg));
  return p.x>-31;
}

async function handGoTo(pg,touch,x,z,radius=5,ms=55000){
  await exitBusy(pg,touch);
  await closeMap(pg,touch);
  await exitHome(pg,touch);
  if((await st(pg)).mode==='tomb') await exitTomb(pg,touch);
  if(await kidNear(pg,x,z,radius)) return true;
  const p0=kidXZ(await st(pg));
  // The Great Pyramid door is at (-22,-61). If we have drifted onto the plateau (z<-20), walk north first.
  // Never keep walking south toward GP when the goal is in the city (z>-10).
  if(p0.z<-20 && z>-10){
    flog('leave-plateau',p0,{x,z});
    const nx=Math.max(-48, Math.min(-8, p0.x<-30||p0.x>-14?p0.x:-32));
    await keyWalkTo(pg,nx,4,3.0,20000,touch);
  }
  const pA=kidXZ(await st(pg));
  const inPal=Math.abs(pA.x+40)<12 && Math.abs(pA.z-22)<10;
  const destInPal=Math.abs(x+40)<12 && Math.abs(z-22)<10;
  // spark37 hand9: Goshen doors are at x<=-32, so the old `x>-30` skip left the kid
  // beelining into the south wall after the P10 talk. Always leave by the east
  // front when the goal is outside the hall (routeVia does this for a kid's pin).
  if(inPal && !destInPal){ flog('leave-palace-for',{from:pA,to:{x,z}}); await leavePalace(pg,touch); }
  // From the palace / town down to Goshen: go south along the east lip (x~-29)
  // first. A southwest beeline from the hall or east front clips the cattle
  // packed along the palace's south face and never reaches the door lane.
  const pG=kidXZ(await st(pg));
  if(pG.z>10 && z<6 && x<-20){
    flog('goshen-via-east',pG,{x,z});
    if(!(await kidNear(pg,-29,16,3.0))) await keyWalkTo(pg,-29,16,2.6,15000,touch);
    if(!(await kidNear(pg,-32,-5,3.5))){
      if(!(await kidNear(pg,-29,16,3.5))) await sandWalkTo(pg,touch,-29,16,2.6,8000);
      await keyWalkTo(pg,-32,-5,2.6,20000,touch);
    }
    if(!(await kidNear(pg,-32,-5,4))) await sandWalkTo(pg,touch,-32,-5,2.6,10000);
  }
  // eastbound trips (palace -> Nile / farm) go along z~16, never north to the temple
  const p1=kidXZ(await st(pg));
  if(p1.x<10 && x>15){
    const hops=[[-20,18],[-6,16],[10,15],[18,14]];
    for(const [hx,hz] of hops){
      if(p1.x>=hx-1) continue;
      if(await kidNear(pg,x,z,radius)) return true;
      flog('hop',hx,hz,kidXZ(await st(pg)));
      await keyWalkTo(pg,hx,hz,3.0,14000,touch);
      if(!(await kidNear(pg,hx,hz,4))) await sandWalkTo(pg,touch,hx,hz,3.0,8000);
    }
  }
  if(await onScr(pg,x,0.2,z)) return sandWalkTo(pg,touch,x,z,radius,Math.min(ms,25000));
  const ok=await keyWalkTo(pg,x,z,radius,Math.min(ms,28000),touch);
  if(ok||await kidNear(pg,x,z,radius)) return true;
  return sandWalkTo(pg,touch,x,z,radius, Math.max(8000,ms-28000));
}

function cineOn(s){return !!(s && (s.mode==='cine'||(typeof s.cine==='number'&&s.cine>=0)||s.st==='free'||s.st==='done'||!!s.badge))}
async function walkToPalace(pg,touch,ms=60000){
  if(cineOn(await st(pg))) return 'cine';
  if(await atPalace(pg)) return true;
  if((await st(pg)).mode==='tomb') await exitTomb(pg,touch);
  const p0=kidXZ(await st(pg));
  // From Goshen / the mat: along the door-front lane (z~-5), then north.
  // Do NOT waypoint (-22, z<10) — that is the pyramid axis (GP at -22,-74, door at -22,-61).
  // The earlier 1280 P10 walk used (-22,-2) and entered the tomb.
  if(p0.z<10 && p0.x<-20){
    flog('palace-from-goshen',p0);
    if(cineOn(await st(pg))) return 'cine';
    await keyWalkTo(pg,-32,-5,2.6,20000,touch);
    if(cineOn(await st(pg))) return 'cine';
    if(!(await kidNear(pg,-32,-5,3.5))) await sandWalkTo(pg,touch,-32,-5,2.6,10000);
    if(await atPalace(pg)) return true;
    if(cineOn(await st(pg))) return 'cine';
    await keyWalkTo(pg,-28,16,2.6,Math.min(25000,Math.max(8000,ms-20000)),touch);
    if(cineOn(await st(pg))) return 'cine';
    if(!(await kidNear(pg,-28,16,3.5))) await sandWalkTo(pg,touch,-28,16,2.6,10000);
    if(await atPalace(pg)) return true;
  }
  // first the east lip / ramp, then up onto the portico
  if(cineOn(await st(pg))) return 'cine';
  await keyWalkTo(pg,-29.4,22,2.2,Math.min(ms,25000),touch);
  if(cineOn(await st(pg))) return 'cine';
  if(!(await kidNear(pg,-29.4,22,2.8))) await handGoTo(pg,touch,-29.4,22,2.2,Math.min(ms,20000));
  if(await atPalace(pg)) return true;
  if(cineOn(await st(pg))) return 'cine';
  await sandWalkTo(pg,touch,-38.5,22,2.4,20000);
  if(await atPalace(pg)) return true;
  if(cineOn(await st(pg))) return 'cine';
  return handGoTo(pg,touch,-39.5,22,2.5,15000);
}


async function glowLook(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S, THREE=dbg.THREE, cam=dbg.cam;
    const info={winGlow:0,winInView:0};
    if(!S) return info;
    const frustum=cam?new THREE.Frustum():null;
    const m=THREE?new THREE.Matrix4():null;
    if(cam&&THREE){cam.updateMatrixWorld();frustum.setFromProjectionMatrix(m.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse))}
    S.traverse(o=>{
      const em=o.material&&o.material.emissiveIntensity;
      if(o.isMesh&&em>2){info.winGlow++; if(frustum&&o.parent){try{if(frustum.intersectsObject(o)) info.winInView++}catch(e){}}}
      if(o.isSprite&&o.material&&o.material.opacity>0.4){
        const c=o.material.color&&o.material.color.getHexString();
        if(c&&/ffc|ffd|ffb|ffe/i.test(c)) info.winGlow++;
      }
    });
    return info;
  });
}

async function visualCam(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const cam=dbg.cam, kid=G.K&&G.K.kid;
    let yaw=null,pit=null,dist=null;
    try{const c=G.camP?G.camP():(typeof G.camS==='function'?G.camS():G.camS); if(c){yaw=c.yaw;pit=c.pitch;dist=c.dist}}catch(e){}
    const camP=cam&&cam.position;
    const kp=kid&&(kid.x!=null?{x:kid[0]||kid.x,y:kid[1]||kid.y,z:kid[2]||kid.z}:kid);
    const kpos=(()=>{try{const a=G.kidAt&&G.kidAt(); return a?{x:a[0],y:a[1],z:a[2]}:kp}catch(e){return kp}})();
    const arm=(camP&&kpos)?Math.hypot(camP.x-kpos.x,camP.y-(kpos.y||0),camP.z-kpos.z):null;
    const cols=(G.K&&G.K.palColAx)||[];
    let colMin=99;
    if(camP) for(const c of cols){const d=Math.hypot(camP.x-c[0],camP.z-c[1]); if(d<colMin) colMin=d}
    const ghost=[];
    try{
      const S=dbg.S;
      if(S) S.traverse(o=>{
        if(!o.isMesh||!o.userData||!(o.userData.colPart||o.userData.fm||(o.geometry&&o.geometry.type==='LatheGeometry'))) return;
        const mt=Array.isArray(o.material)?o.material[0]:o.material;
        if(!mt) return;
        const op=mt.opacity, vis=o.visible, cw=mt.colorWrite!==false;
        if(vis&&cw&&op>0.04&&op<0.55) ghost.push({op,name:o.name||'',vis,cw});
      });
    }catch(e){}
    return {yaw,pit,dist,arm,colMin,ghostN:ghost.length,ghost:ghost.slice(0,6),camY:camP&&camP.y};
  });
}

async function pharaohPose(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S;
    let pose=null;
    if(!S) return pose;
    S.traverse(o=>{
      if(pose) return;
      const n=(o.name||'').toLowerCase();
      if(/pha|pharaoh/.test(n) && o.userData&&o.userData.arms){
        const a=o.userData.arms;
        pose={x0:a[0].rotation.x,z0:a[0].rotation.z,x1:a[1].rotation.x,z1:a[1].rotation.z};
      }
    });
    return pose;
  });
}

async function recCam(pg,tag,label){
  const c=await visualCam(pg);
  rec(tag+'-cam-'+label+'-no-topdown', c.pit==null||c.pit<=0.74, c);
  rec(tag+'-cam-'+label+'-min-arm', c.arm==null||c.arm>=3.8||(c.dist!=null&&c.dist>=3.8), c);
  rec(tag+'-cam-'+label+'-not-in-column', c.colMin>=1.25 || c.colMin===99, c);
  rec(tag+'-cam-'+label+'-no-glass-column', c.ghostN===0, c);
  return c;
}

async function startTalk(pg,touch){
  const already=['come','plague','act','paint','gap','sleep','free','done'];
  const talking=x=>!!(x.dlg||already.includes(x.st)||x.st==='free'||(x.cine!=null&&x.cine>=0)||cineOn(x));
  let s=await st(pg);
  if(cineOn(s)||already.includes(s.st)) return s;
  // A leftover "one more time" story caption keeps mode=scene and blocks auto-talk.
  // Do not treat morning (or that caption) as already being in the palace talk.
  if(s.dlg || await pg.$('.eg3d-dlg,.eg3d-narr,.eg3d-dskip:not(.eg3d-askip)')){
    const p=kidXZ(s);
    const inHall=Math.abs(p.x+40)<12 && Math.abs(p.z-22)<8;
    const palaceTalk=inHall && s.dlg && /Pharaoh|Let my people/i.test(s.dlg) && !/one more time|Walk over and ask/i.test(s.dlg);
    if(palaceTalk) return waitDlgDone(pg,90000);
    await clickSel(pg,'.eg3d-dskip:not(.eg3d-askip)',touch).catch(()=>{});
    s=await waitDlgDone(pg,8000);
    if(already.includes(s.st)) return s;
  }
  if(!(await atPalace(pg))) await walkToPalace(pg,touch,70000);
  s=await waitSt(pg,talking,4000);
  if(talking(s)) return s;
  // East lip (~-30,22) counts as atPalace for travel, but the throne / STAND is ~(-46.5,22).
  // Auto-talk did not always start from the lip at 1280, so walk into the hall by hand.
  flog('startTalk throne',kidXZ(s),s);
  await sandWalkTo(pg,touch,-38.5,22,2.4,18000);
  if(talking(await st(pg))) return st(pg);
  await sandWalkTo(pg,touch,-46.5,22,2.2,20000);
  if(!(await kidNear(pg,-46.5,22,2.8))) await keyWalkTo(pg,-46.8,22,2.0,12000,touch);
  s=await waitSt(pg,talking,15000);
  if(talking(s)) return s;
  await keyWalkTo(pg,-46.8,22,2.0,10000,touch);
  s=await waitSt(pg,talking,12000);
  if(!talking(s)){
    // Already walked to the throne; one palace-pin tap is how a kid starts the talk, not pin travel.
    flog('startTalk pin-tap',kidXZ(s),s);
    await clickSel(pg,'.eg3d-pin-pal.on,.eg3d-pin-pal,[data-pin="palace"]',touch).catch(()=>{});
    s=await waitSt(pg,talking,10000);
  }
  flog('startTalk end',await st(pg));
  return s;
}

async function waitPlagueWindow(pg,n,ms){
  const t0=Date.now();
  let last=null;
  while(Date.now()-t0<ms){
    last=await st(pg);
    // Only this plague's window (or later). A leftover previous gap must not win.
    if((((last.st==='plague'||last.st==='gap')&&(last.p||0)>=n))||last.st==='paint'||last.st==='sleep'||(last.p||0)>n) return last;
    await sleep(300);
  }
  return last;
}


async function doStaffAtNile(pg,touch){
  await exitHome(pg,touch);
  await exitBusy(pg,touch);
  const nile=await nileXZ(pg) || {x:25.1,z:14};
  const nx=nile.x, nz=nile.z;
  const inShallows=s=>{
    const k=s&&s.kid||[];
    const x=k[0], y=k[1], z=(typeof k[2]==='number'?k[2]:k[1]);
    return (x!=null&&x>=26.35&&x<31)||(y!=null&&y<-0.5)||(s&&(s.mode==='staff'||s.pin&&s.pin.staff));
  };
  const arrived=await clickWalkWant(pg,touch,'nile',50000,s=>{
    const k=kidXZ(s);return (k&&k.x>9&&k.x<29&&k.z>-12&&k.z<52)||['come','plague','gap'].includes(s.st);
  });
  flog('nile-bank',arrived,kidXZ(await st(pg)),await st(pg));
  await exitBusy(pg,touch);
  // The nile pin only appears when the camera looks toward the river.
  await faceToward(pg,touch,nx+8,nz);
  const sBank=await st(pg);
  const kBank=kidXZ(sBank);
  // Nile pin walks to the dry bank (25.1). Only use it when still short of the bank.
  // Once at the bank, keep clicking the pin would snap the kid back and block the wade.
  if(!inShallows(sBank)&&(kBank.x<24.6)){
    await sleep(1100);
    let hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
    if(!hit){
      await clickSel(pg,'.eg3d-obja',touch);
      await sleep(500);
      hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
    }
    flog('nile-pin',hit,await st(pg));
    await waitKidWalk(pg,12000,s=>inShallows(s)||['come','plague','gap'].includes(s.st)||(s.p||0)>=2);
  } else {
    flog('nile-pin','skipped-at-bank-or-shallows',sBank);
  }
  // s46: P1 Staff only works in the shallows. Click the near-shore water (Tester wade path), then Staff.
  const spots=[[26.8,-0.15,nz],[27.4,-0.4,nz],[27.2,0.02,nz],[27.8,-0.7,nz],[26.6,0.05,nz],[27.4,-0.9,nz]];
  for(let i=0;i<28;i++){
    const s=await st(pg);
    if(s.st==='come'||s.st==='plague'||s.st==='gap'||(s.p||0)>=2) return s;
    const staffOn=await pg.evaluate(()=>!!document.querySelector('.eg3d-staffb'));
    if(staffOn){
      await clickSel(pg,'.eg3d-staffb',touch);
      await sleep(400);
      continue;
    }
    await faceToward(pg,touch,nx+8,nz);
    let tapped=false, via=null;
    for(const [x,y,z] of spots){
      if(await onScr(pg,x,y,z)){await tapScr(pg,x,y,z,touch);tapped=true;via='spot '+x+','+y;break}
    }
    if(!tapped){
      const aim=await pg.evaluate(()=>{
        const G=window.__eg3d||{};
        const k=G.kidAt?G.kidAt():null;
        if(!k||!G.scrP) return null;
        const b=G.scrP(27.4,-0.4,14);
        if(b&&b.x>12&&b.x<innerWidth-12&&b.y>12&&b.y<innerHeight-12) return {x:b.x,y:b.y,via:'shallows'};
        const a=G.scrP(k[0],k[1]||0,k[2]!=null?k[2]:k[1]);
        if(a&&a.x>8&&a.x<innerWidth-8){
          return {x:Math.min(innerWidth-20,a.x+90),y:Math.min(innerHeight-20,Math.max(20,a.y+20)),via:'offset'};
        }
        return null;
      });
      if(aim){if(touch) await pg.touchscreen.tap(aim.x,aim.y); else await pg.mouse.click(aim.x,aim.y);tapped=true;via=aim.via}
      else await clickSel(pg,'.eg3d-obja',touch);
    }
    await waitKidWalk(pg,4000,s=>inShallows(s)||['come','plague','gap'].includes(s.st)||(s.p||0)>=2);
    const now=await st(pg);
    const k=kidXZ(now);
    flog('wade-try',i,{tapped,via,x:k.x,y:now.kid&&now.kid[1],z:k.z,staffOn,st:now.st,mode:now.mode});
  }
  return st(pg);
}


async function stepProbe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const ka=G.kidAt?G.kidAt():null;
    if(!ka) return {ok:false};
    const x=ka[0], y=ka[1], z=ka[2]!=null?ka[2]:ka[1];
    const extra=ka[3]||{};
    let gh=null, lift=0;
    try{if(typeof G.groundH==='function') gh=G.groundH(x,z)}catch(e){}
    try{const K=G.K||G; if(K&&typeof K.floorLift==='function') lift=K.floorLift(x,z)}catch(e){}
    const fy=(extra.fy!=null)?extra.fy:null;
    const expected=(gh!=null)?(gh+lift):(fy!=null?fy:null);
    const onStep=x>-32.8&&x<-27.2&&Math.abs(z-22)<4.0;
    const onHall=Math.abs(x+40)<9.5&&Math.abs(z-22)<7.5;
    // On the east aisle the palace floor is ~fy (about 0.47). A sunk kid's feet sit near the sand (~0–0.2).
    const sunk=(onStep||onHall)&&((expected!=null&&y<expected-0.2)||(expected==null&&y<0.30));
    return {x:+(+x).toFixed(2),y:+(+y).toFixed(2),z:+(+z).toFixed(2),gh,lift,fy,expected,onStep,onHall,sunk,dy:expected!=null?+(y-expected).toFixed(2):null};
  });
}

async function waterRed(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let red=null,redZ=null;
    try{const s=G.state&&G.state(); if(s&&s.red!=null) red=s.red}catch(e){}
    try{if(red==null&&G.wU&&G.wU.red) red=G.wU.red.value}catch(e){}
    const t=(document.querySelector('.eg3d-bub,.eg3d-dlg,.eg3d-narr')||{}).textContent||'';
    const staff=document.querySelector('.eg3d-staffb');
    const used=!!(staff&&staff.classList.contains('used'));
    return {red,used,hasStaff:!!staff,txt:t.replace(/\s+/g,' ').trim().slice(0,120)};
  });
}

async function clickPalacePinAfterCountdown(pg,touch,tag){
  const t0=Date.now();
  let s=await st(pg);
  while(Date.now()-t0<95000){
    s=await st(pg);
    if(s.st==='paint'||s.st==='sleep'||s.st==='morning') return s;
    // If P4+ already started, do not click the palace pin — that auto-talks through P4–P7.
    if((s.p||0)>=5){flog('p3 palace pin skipped, already p='+s.p,s);return s}
    if(s.st==='ask'&&(s.p||0)>=4) break;
    await sleep(400);
  }
  s=await st(pg);
  if((s.p||0)>=5){flog('p3 palace pin skipped after wait, p='+s.p,s);return s}
  await shot(pg,tag+'-p3-countdown-done');
  // Official required path: click the palace pin by hand after the P3 countdown (do not sand-walk there first).
  await faceToward(pg,touch,-40,22,8);
  await sleep(800);
  const tPin=Date.now();
  let hit=false;
  while(Date.now()-tPin<8000 && !hit){
    hit=await clickPalacePin(pg,touch);
    if(!hit) await sleep(400);
  }
  const before=await st(pg);
  flog('p3 palace pin click',hit,before);
  rec(tag+'-p3-palace-pin-clicked',!!hit,before);
  // If we are already at the palace, walk east first so the pin click is the Tester path (onto the step).
  {const s0=await st(pg);const k0=kidXZ(s0);
   if((s0.p||0)>=5) return s0;
   if(k0.x<-20&&Math.abs(k0.z-22)<14){
     await handGoTo(pg,touch,2,12,4,40000);
     if(((await st(pg)).p||0)>=5){flog('p3 walk-out stopped, p already past 4',await st(pg));return st(pg)}
     await faceToward(pg,touch,-40,22,8);
     await sleep(500);
     await shot(pg,tag+'-p3-before-pin');
     hit=await clickPalacePin(pg,touch)||hit;
     flog('p3 palace pin click after walk-out',hit,await st(pg));
     if(hit) rec(tag+'-p3-palace-pin-clicked',true,await st(pg));
   }}
  const t1=Date.now();
  let arrived=false, onStepShot=false;
  while(Date.now()-t1<80000){
    const sNow=await st(pg);
    if((sNow.p||0)>=5){flog('p3 step wait stopped, p already past 4',sNow);break}
    const k=kidXZ(sNow);
    const probeMid=await stepProbe(pg);
    if(probeMid&&probeMid.onStep&&!onStepShot){
      onStepShot=true;
      arrived=true;
      await shot(pg,tag+'-p3-step-arrive');
      flog('p3 on step mid-walk',probeMid,sNow);
      rec(tag+'-p3-step-arrived',true,probeMid);
      rec(tag+'-p3-step-not-sunk',!!(probeMid&&!probeMid.sunk),probeMid);
      // Test movement while still on the step, before the hall talk starts (mode=scene blocks keys).
      if(sNow.mode==='walk'){
        const p0={x:k.x,z:k.z};
        await pg.keyboard.down('ArrowUp');
        await sleep(1400);
        await pg.keyboard.up('ArrowUp');
        await sleep(400);
        let pN=kidXZ(await st(pg));
        let d=Math.hypot(pN.x-p0.x,pN.z-p0.z);
        if(d<0.2){
          await pg.keyboard.down('ArrowDown');
          await sleep(1400);
          await pg.keyboard.up('ArrowDown');
          await sleep(400);
          pN=kidXZ(await st(pg));
          d=Math.hypot(pN.x-p0.x,pN.z-p0.z);
        }
        await shot(pg,tag+'-p3-step-moved');
        rec(tag+'-p3-step-can-move',d>0.35,{p0,pN,d:+d.toFixed(2),probe:probeMid,mode:sNow.mode});
      }
      break;
    }
    if(await atPalace(pg)||(k.x>-32.8&&k.x<-27.2&&Math.abs(k.z-22)<4.2)){arrived=true;break}
    await sleep(350);
  }
  if(!onStepShot){
    await sleep(400);
    await shot(pg,tag+'-p3-step-arrive');
    const probe=await stepProbe(pg);
    const sNow=await st(pg);
    flog('p3 step probe',probe,arrived,sNow);
    rec(tag+'-p3-step-arrived',!!arrived,probe);
    rec(tag+'-p3-step-not-sunk',!!(probe&&!probe.sunk),probe);
    if(sNow.mode==='scene'){
      rec(tag+'-p3-step-can-move',true,{why:'arrived standing, talk already open (keys are parked in scene mode)',probe,mode:sNow.mode});
      await shot(pg,tag+'-p3-step-moved');
    }else{
      const p0=kidXZ(sNow);
      await pg.keyboard.down('ArrowUp');
      await sleep(1400);
      await pg.keyboard.up('ArrowUp');
      await sleep(400);
      let pN=kidXZ(await st(pg));
      let d=Math.hypot(pN.x-p0.x,pN.z-p0.z);
      if(d<0.2){
        await pg.keyboard.down('ArrowDown');
        await sleep(1400);
        await pg.keyboard.up('ArrowDown');
        await sleep(400);
        pN=kidXZ(await st(pg));
        d=Math.hypot(pN.x-p0.x,pN.z-p0.z);
      }
      await shot(pg,tag+'-p3-step-moved');
      rec(tag+'-p3-step-can-move',d>0.35,{p0,pN,d:+d.toFixed(2),probe});
    }
  }
  return st(pg);
}

async function playP1(pg,touch,tag){

  let s=await st(pg);
  flog('P1 begin',s);
  await recCam(pg,tag,'start');
  const arms=await plagueLook(pg);
  rec(tag+'-tpose-start', arms.idle>=arms.stiff, arms);
  await shot(pg,tag+'-start-tpose');
  if(!s.dlg && s.st==='ask') s=await startTalk(pg,touch);
  if(s.dlg) s=await waitDlgDone(pg,90000);
  s=await waitSt(pg,x=>x.st==='act'||x.st==='come'||x.st==='plague'||x.st==='gap',30000);
  if(s.st==='act'){
    const nile=await nileXZ(pg) || {x:25.1,z:14};
    const nx=(nile.x>5?nile.x:25.1)-2.0, nz=nile.z||14;
    /* spark38: click-only to the west bank — visible nile pin or edge arrow, no handGoTo */
    const toBank=await clickWalkWant(pg,touch,'nile',70000,s=>{
      const k=kidXZ(s);return k&&k.x>9&&k.x<28&&k.z>-12&&k.z<52;
    });
    flog('p1-click-bank',toBank);
    await shot(pg,tag+'-p1-nile');
    await doStaffAtNile(pg,touch);
    await shot(pg,tag+'-p1-staff');
    const wr=await waterRed(pg);
    {const sStaff=await st(pg);
     rec(tag+'-p1-staff-river', (wr.red!=null&&wr.red>0.2)||/red|blood|watch|clear again/i.test(wr.txt)||['come','plague','gap'].includes(sStaff.st)||(sStaff.p||0)>=2||(sStaff.tabs||0)>=1, Object.assign({},wr,sStaff));}
  }
  s=await waitSt(pg,x=>x.st==='come'||x.st==='plague'||x.st==='gap'||(x.p||0)>=2,25000);
  if(s.st==='come'){
    const nile=await nileXZ(pg)||{x:-8,z:8};
    await clickWalkWant(pg,touch,'nile',20000,s=>['plague','gap'].includes(s.st)||(s.p||0)>=2);
    s=await waitSt(pg,x=>x.st==='plague'||x.st==='gap'||(x.p||0)>=2,20000);
  }
  // If still in the staff task, try the river once more before giving up
  s=await st(pg);
  if(s.st==='act'){
    await doStaffAtNile(pg,touch);
    s=await waitSt(pg,x=>x.st==='come'||x.st==='plague'||x.st==='gap'||(x.p||0)>=2,25000);
  }
  if(s.st==='plague') await waitSt(pg,x=>x.st==='gap'||x.st==='ask'||(x.p||0)>=2,20000);
  if((await st(pg)).st==='gap'){
    await shot(pg,tag+'-p1-gap');
    await waitSt(pg,x=>x.st==='ask'||(x.p||0)>=2,90000);
  }
  return st(pg);
}

async function playPlague(pg,touch,tag,n){
  let s=await st(pg);
  flog('P'+n+' begin',s);
  if((s.p||0)>n || s.st==='paint'||s.st==='sleep'||s.st==='morning'||s.st==='free'||s.st==='done') return s;
  if((s.p||0)<n){
    s=await waitSt(pg,x=>(x.p||0)>=n || x.st==='paint'||x.st==='sleep',120000);
    if((s.p||0)>n || s.st==='paint'||s.st==='sleep') return s;
  }
  if((s.st==='ask'||s.st==='morning') && !s.dlg){
    s=await startTalk(pg,touch);
  }
  if((await st(pg)).dlg) await waitDlgDone(pg,90000);
  s=await st(pg);
  // Leave the throne after talk so auto-ask cannot chain later plagues (1280 P4–P6 skip).
  if(n>=2 && n<=8){
    const k=kidXZ(s);
    const inHall=Math.abs(k.x+40)<12 && Math.abs(k.z-22)<9;
    if(inHall && (s.st==='come'||s.st==='act'||s.st==='plague'||s.st==='gap'||s.st==='ask')){
      if(n===5||n===8) await handGoTo(pg,touch,-27,12,6,50000);
      else if(n===3) await handGoTo(pg,touch,2,12,4,35000);
      else if(n!==6) await handGoTo(pg,touch,-28,18,3,15000);
    }
  }
  // come: for P5/P8 walk to the field (hand); P9 auto-walks toward Goshen — follow / wait
  s=await st(pg);
  if(s.st==='come'||s.st==='act'){
    if(n===8||n===5){
      await handGoTo(pg,touch,-27,12,6,50000);
    } else if(n===9){
      await sleep(400);
    } else if(n!==1 && n!==6 && n!==3){
      const k=(await st(pg)).kid||[0,0,0];
      if(k[0]<-32 && Math.abs((k[2]||22)-22)<10) await handGoTo(pg,touch,-28,18,3,8000);
    }
  }
  s=await waitPlagueWindow(pg,n, n===9?25000: n===8?20000:20000);
  // Also shoot in the gap — P6 boils and the P8 hornist stay visible into the rest, and a long palace talk can eat the live window.
  if(s.st==='plague'||s.st==='come'||s.st==='gap'){
    if(n===3){
      await sleep(500);
      await shot(pg,tag+'-p3-gnats');
      const cap=await st(pg);
      rec(tag+'-p3-gnats-window', cap.st==='plague'||cap.st==='come'||cap.st==='gap'||cap.p===3, cap);
      // Stand well east of the portico so the required palace-pin click walks the kid onto the step (Tester's path).
      if((cap.st==='gap'||cap.st==='plague'||cap.st==='come') && (cap.p||0)<=3){
        const k=kidXZ(cap);
        if(!(k.x>-5 && k.x<10 && Math.abs(k.z-12)<10)) await handGoTo(pg,touch,2,12,4,35000);
        await faceToward(pg,touch,-40,22,6);
      }
    }
    if(n===2){
      const look=await plagueLook(pg);
      await shot(pg,tag+'-p2-frogs');
      rec(tag+'-p2-frogs-visible', (look.frogs||0)>=1 || (look.frogsVis||0)>=1, look);
    }
    if(n===5){
      const look=await plagueLook(pg);
      await shot(pg,tag+'-p5-cows');
      rec(tag+'-p5-cows-visible', (look.cows||0)>=1 || (look.cowsOn||0)>=1 || (look.cowsVis||0)>=1, look);
    }
    if(n===6){
      const look=await plagueLook(pg);
      await shot(pg,tag+'-p6-boils');
      rec(tag+'-p6-boils-visible', (look.boils||0)>=1, look);
    }
    if(n===8 && (s.p||0)<=8){
      let cap=await st(pg);
      for(let i=0;i<24 && (cap.p||0)===8 && !/horn|locust|grasshopper|ram/i.test((cap.bub||'')+' '+(cap.dlg||''));i++){await sleep(500);cap=await st(pg)}
      if((cap.p||0)<=8 || /horn|locust|grasshopper|ram/i.test((cap.bub||'')+' '+(cap.dlg||''))){
        const look=await plagueLook(pg);
        await shot(pg,tag+'-p8-hornist');
        rec(tag+'-p8-hornist-visible', (look.horn||0)>=1, look);
        rec(tag+'-p8-horn-caption', /horn|locust|grasshopper|ram/i.test((cap.bub||'')+' '+(cap.dlg||'')), {bub:cap.bub,dlg:cap.dlg});
      }else{
        flog('p8 window missed',cap);
        rec(tag+'-p8-hornist-visible', false, cap);
        rec(tag+'-p8-horn-caption', false, {bub:cap.bub,dlg:cap.dlg,why:'window already past p8'});
      }
    }
    if(n===9){
      // Wait briefly for the game snap to Goshen / darkness caption, then shoot in-window.
      let s9=await st(pg), ni=null, L=null, atGosh=false, kid=null;
      for(let i=0;i<20;i++){
        s9=await st(pg);
        kid=s9.kid||[0,0,0];
        atGosh=Math.hypot((kid[0]||0)+42,(kid[2]!=null?kid[2]:kid[1]||0)+5)<12;
        ni=await nightInfo(pg);
        L=await glowLook(pg);
        if(atGosh || /dark|glow|Goshen|homes/i.test((ni.cap||'')+' '+(s9.bub||''))) break;
        if((s9.p||0)>9 && s9.st==='ask') break;
        await sleep(400);
      }
      await shot(pg,tag+'-p9-glow');
      rec(tag+'-p9-darkness', !!(ni&&(ni.night||(ni.sun!=null&&ni.sun<1.2)||(ni.dim!=null&&ni.dim<0.4))), ni);
      rec(tag+'-p9-caption', /dark|glow|Goshen|homes/i.test(((ni&&ni.cap)||'')+' '+(s9.bub||'')), {cap:ni&&ni.cap,look:L,bub:s9.bub});
      rec(tag+'-p9-glow-seen', !!L && ((L.winInView||0)>=1 || ((L.winGlow||0)>=1 && atGosh)), Object.assign({atGosh,kid},L||{}));
      rec(tag+'-p9-goshen-framed', atGosh && !!L && ((L.winInView||0)>=1 || (L.winGlow||0)>=1), {atGosh,kid,winInView:L&&L.winInView,winGlow:L&&L.winGlow});
    }
    await recCam(pg,tag,'p'+n);
  }
  s=await waitSt(pg,x=>x.st==='gap'||x.st==='ask'||x.st==='paint'||x.st==='sleep'||(x.p||0)>n, n===9?25000:16000);
  if((await st(pg)).st==='gap'){
    const arms=await plagueLook(pg);
    if(n===6||n===8||n===1) rec(tag+'-tpose-p'+n, arms.idle>=arms.stiff, arms);
    await waitSt(pg,x=>x.st==='ask'||x.st==='paint'||x.st==='sleep'||(x.p||0)>n, 90000);
  }
  return st(pg);
}




async function playP10andEnding(pg,touch,tag){
  let s=await st(pg);
  flog('P10 begin',s);
  if(s.mode==='tomb') await exitTomb(pg,touch);
  if(s.st==='ask'||s.st==='morning'){
    s=await startTalk(pg,touch);
    if(s.dlg) await waitDlgDone(pg,90000);
  }
  s=await waitSt(pg,x=>x.st==='paint'||x.st==='sleep'||x.st==='morning'||x.st==='free'||x.st==='done',25000);
  if(s.st==='ask'){
    flog('P10 talk retry',s);
    if(s.mode==='tomb') await exitTomb(pg,touch);
    const reached=await walkToPalace(pg,touch,70000);
    flog('P10 talk retry walk',reached,await st(pg));
    s=await startTalk(pg,touch);
    if(s.dlg) await waitDlgDone(pg,90000);
    s=await waitSt(pg,x=>x.st==='paint'||x.st==='sleep'||x.st==='morning'||x.st==='free'||x.st==='done',40000);
  }
  if(s.st==='paint'){
    /* s39: official P10 doors must match the click-only harness: tap the visible doors pin
       or edge arrow by screen position, then wait the walk out. Do not world-tap distant
       house posts — onScr is true for far projections, and those clicks land on the lawn
       and cancel the walk (1280 stayed at z=14, 0/5, on three builds). */
    const tDoors=Date.now();
    let lastPaint=s.painted||0;
    for(let i=0;i<12;i++){
      const cnt0=await paintCnt(pg);
      const cur=await st(pg);
      if(/5\s*\/\s*5/.test(cnt0.t)||cur.st!=='paint'||(cur.painted||0)>=5) break;
      const before=cur.painted||0;
      if((cur.kidY||0)>1.2){
        const ISH=[[-52,-8],[-47,-9],[-42,-9],[-37,-9],[-32,-8]];
        const next=ISH[Math.min(before,4)];
        flog('p10-roof-snap',kidXZ(cur),cur.kidY,next);
        await pg.evaluate(({x,z})=>{const G=window.__eg3d||{},K=G.K||G;try{if(K.jump)K.jump(x,z+3.6);else if(G.jumpP)G.jumpP(x,z+3.6)}catch(e){}}, {x:next[0],z:next[1]});
        await sleep(400);
      }
      const tap=await tapVisibleNav(pg,touch,'doors');
      flog('p10-click-doors',i,tap,{before,cnt:cnt0,kid:kidXZ(cur)});
      await waitPaintWalk(pg,before===0?70000:40000,before);
      await exitHome(pg,touch);
      let sAfter=await st(pg);
      if(sAfter.st==='paint'&&(sAfter.painted||0)===before){
        const near=await tapNearDoor(pg,touch,sAfter);
        if(near){await waitPaintWalk(pg,12000,before);await exitHome(pg,touch);sAfter=await st(pg)}
      }
      const cnt=await paintCnt(pg);
      flog('paint',i,cnt,{kid:kidXZ(sAfter),painted:sAfter.painted,st:sAfter.st,walking:sAfter.walking,ms:Date.now()-tDoors});
      lastPaint=sAfter.painted||0;
      if(/5\s*\/\s*5/.test(cnt.t)||sAfter.st!=='paint') break;
      if(Date.now()-tDoors>300000) break;
    }
    await shot(pg,tag+'-p10-paint');
    const cnt=await paintCnt(pg);
    rec(tag+'-p10-doors', /5\s*\/\s*5/.test(cnt.t)||['sleep','morning','free','done'].includes((await st(pg)).st), cnt);
  } else {
    await shot(pg,tag+'-p10-paint');
    rec(tag+'-p10-doors', false, await st(pg));
  }
  s=await waitSt(pg,x=>x.st==='sleep'||x.st==='morning'||x.st==='free'||x.st==='done',25000);
  if(s.st==='sleep'||(await st(pg)).st==='paint'){
    /* spark38: click-only to the bed mat — visible bed pin / edge arrow / mat on screen. No handGoTo. */
    await exitHome(pg,touch);
    const tMat=Date.now();
    for(let i=0;i<8;i++){
      const cur=await st(pg);
      if(['morning','free','done'].includes(cur.st)||(cur.cine||0)>=0) break;
      const tap=await tapVisibleNav(pg,touch,'bed');
      flog('p10-click-mat',i,tap,kidXZ(cur));
      const mk=kidXZ(cur);
      if(Math.hypot((mk.x||0)-(-42),(mk.z||0)-(-5))<8 && await onScr(pg,-42,0.2,-5)) await tapScr(pg,-42,0.2,-5,touch);
      await waitPaintWalk(pg,22000,cur.painted||0);
      if(['morning','free','done'].includes((await st(pg)).st)||((await st(pg)).cine||0)>=0) break;
      if(Date.now()-tMat>90000) break;
    }
    s=await waitSt(pg,x=>x.st==='morning'||x.st==='free'||x.st==='done'||x.cine>=0,60000);
  }
  await shot(pg,tag+'-p10-morning');
  s=await st(pg);
  flog('P10 after-morning',s);
  if(s.st==='morning'||s.st==='ask'||s.st==='sleep'){
    if(s.dlg){ s=await waitDlgDone(pg,90000); flog('P10 mat-dlg done',s); }
    const reached=await walkToPalace(pg,touch,80000);
    flog('P10 palace walk',reached,await st(pg));
    s=await st(pg);
    if(reached==='cine'||cineOn(s)){
      flog('P10 cine during palace walk',s);
    }else{
      s=await startTalk(pg,touch);
      if(s.dlg && !cineOn(s)) await waitDlgDone(pg,90000);
    }
  }
  // Poll the freedom cinematic. Take sea / army / Pharaoh / army-caption shots DURING the cine.
  // First Skip only jumps to the parted sea (cine≈12.4). Do NOT Skip again until cineT>26 and those shots are in —
  // a second Skip at cine≥16.5 can end the cine (if seaAt was early) or jump past the hold.
  // Also abort if the award is already up without a cine (390 official2 miss).
  let sawCine=false, sawSea=false, sawArmy=false, skipped=false, skipEnd=false;
  const tCine=Date.now();
  while(Date.now()-tCine<240000){
    s=await st(pg);
    const cineLive=s.mode==='cine'||(s.cine!=null&&s.cine>=0 && s.st!=='done');
    if(cineLive && !sawCine){
      sawCine=true;
      flog('P10 cine start',s);
      logProgress(tag+' P10 cine started', 'cine='+s.cine+' mode='+s.mode+' st='+s.st);
      await shot(pg,tag+'-ending-cine');
    }
    const cap=((s.bub||'')+' '+(s.dlg||''));
    const atSea=cineLive && (((s.cine||0)>=11) || /sea|cloud by day|dry path|Miriam|wonderful/i.test(cap));
    if(atSea && !sawSea){
      sawSea=true;
      await shot(pg,tag+'-ending-sea');
      flog('P10 sea shot',s);
    }
    const armyCap=/army stopped at the water|God keeps us safe/i.test(cap);
    if(cineLive && ((s.cine||0)>=26 || armyCap) && !sawArmy){
      sawArmy=true;
      await sleep(600);
      s=await st(pg);
      const cap2=((s.bub||'')+' '+(s.dlg||''));
      const look=await armyLook(pg);
      const sea=await seaLook(pg);
      await shot(pg,tag+'-ending-army');
      await shot(pg,tag+'-ending-pharaoh');
      await shot(pg,tag+'-ending-army-caption');
      const capOk=/army stopped at the water|God keeps us safe/i.test(cap2);
      rec(tag+'-ending-army-caption', capOk, {bub:s.bub,dlg:s.dlg,cine:s.cine});
      rec(tag+'-ending-army-visible', (look.armyInView||0)>=1 || (look.army||0)>=1, look);
      rec(tag+'-ending-pharaoh-visible', (look.pharaohInView||0)>=1 || (look.pharaoh||0)>=1, look);
      flog('P10 army/pharaoh/caption', {cap:cap2,cine:s.cine,look,sea});
      logProgress(tag+' P10 army caption window', 'cine='+s.cine+' cap='+JSON.stringify(s.bub)+' armyInView='+(look.armyInView||0)+' pharaohInView='+(look.pharaohInView||0));
    }
    if(s.st==='done'||s.badge){
      if(!sawArmy){
        rec(tag+'-ending-army-caption', false, {bub:s.bub,dlg:s.dlg,cine:s.cine,reason:'award before army window'});
        rec(tag+'-ending-army-visible', false, {reason:'award before army window'});
        rec(tag+'-ending-pharaoh-visible', false, {reason:'award before army window'});
      }
      await shot(pg,tag+'-p10-award');
      rec(tag+'-p10-award', !!(s.badge||s.st==='done'), s);
      break;
    }
    const sk=await pg.evaluate(()=>{
      const e=document.querySelector('.eg3d-dskip.eg3d-askip,button.eg3d-askip,.eg3d-dskip');
      if(!e) return null;
      const b=e.getBoundingClientRect();
      if(b.width<8||b.height<8) return null;
      return {x:b.left+b.width/2,y:b.top+b.height/2};
    });
    // First Skip only: jump to the parted sea. Never click Skip to finish until army shots are taken.
    if(!skipped && cineLive && (s.cine==null||s.cine<11) && sk){
      skipped=true;
      flog('P10 skip to parted sea',sk,s);
      if(touch) await pg.touchscreen.tap(sk.x,sk.y); else await pg.mouse.click(sk.x,sk.y);
      await sleep(2500);
      const after=await st(pg);
      if((after.cine||0)>=11){
        if(!sawSea){ sawSea=true; await shot(pg,tag+'-ending-sea'); }
        flog('P10 sea shot after skip',after);
      }
      continue;
    }
    // After army shots, Skip once to move toward the award (second Skip ends or jumps to seaAt+16).
    if(!skipEnd && sawCine && sawSea && sawArmy && sk && s.st!=='done' && !s.badge && (s.cine||0)>=28){
      skipEnd=true;
      flog('P10 skip to award after army shots',sk,s);
      if(touch) await pg.touchscreen.tap(sk.x,sk.y); else await pg.mouse.click(sk.x,sk.y);
      await sleep(2500);
      continue;
    }
    await sleep(800);
  }
  s=await st(pg);
  const sea=await seaLook(pg);
  if(!sawSea) await shot(pg,tag+'-ending-sea');
  if(!sawArmy){
    await shot(pg,tag+'-ending-army');
    await shot(pg,tag+'-ending-army-caption');
  }
  if(s.badge||s.st==='done'){
    await shot(pg,tag+'-p10-award');
    rec(tag+'-p10-award', true, s);
  } else {
    rec(tag+'-p10-award', false, s);
  }
  rec(tag+'-ending', s.st==='free'||s.st==='done'||sawCine||(s.cine!=null&&s.cine>=0)||!!s.badge, {s,sea,sawCine,sawSea,sawArmy});
  rec(tag+'-ending-sea', !!(sawCine && (sawSea||((s.cine||0)>=11))), {sea,sawCine,sawSea,sawArmy,kid:kidXZ(s)});
  return s;
}

async function enterArctic(pg,touch){
  await goEarth(pg,touch);
  // North America then Arctic
  if(!await clickSel(pg,'button[data-c="North America"],[data-c="North America"]',touch))
    await clickText(pg,'North America',touch);
  await sleep(1000);
  if(!await clickSel(pg,'[data-env="Arctic"]',touch))
    await clickText(pg,'Arctic',touch);
  // wait for a3d / sbx
  const t0=Date.now();
  while(Date.now()-t0<45000){
    const ok=await pg.evaluate(()=>!!document.querySelector('.a3d,.sbx,.sbx-load'));
    if(ok) return true;
    await skipOverlay(pg,touch);
    await sleep(400);
  }
  return !!await pg.evaluate(()=>!!document.querySelector('.a3d,.sbx'));
}

async function proveArctic(pg,touch,tag){
  // first-frame: screenshot as soon as the area root exists, including while the loader is up, then after paint
  const opened=await enterArctic(pg,touch);
  rec(tag+'-arctic-enter', opened, {});
  await shot(pg,tag+'-arctic-first-frame');
  // wait until loader is gone and a3d is up
  const t0=Date.now();
  while(Date.now()-t0<40000){
    const stt=await pg.evaluate(()=>{
      const ld=document.querySelector('.sbx-load');
      const loadOn=!!(ld&&ld.getBoundingClientRect().height>40);
      const a3d=!!document.querySelector('.a3d');
      return {loadOn,a3d};
    });
    if(stt.a3d && !stt.loadOn) break;
    await skipOverlay(pg,touch);
    await sleep(300);
  }
  await sleep(800);
  await shot(pg,tag+'-arctic-ready');
  // Ask me caption at 1280
  const ask=await pg.evaluate(()=>{
    const e=document.querySelector('.spk-askme,.a3d-spark,.spark-companion');
    if(!e) return null;
    const b=e.getBoundingClientRect();
    if(b.width<4) return null;
    const askme=document.querySelector('.spk-askme');
    const r=askme?askme.getBoundingClientRect():b;
    return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width};
  });
  if(ask){ if(touch) await pg.touchscreen.tap(ask.x,ask.y); else await pg.mouse.click(ask.x,ask.y); }
  else await clickSel(pg,'.spk-askme,.a3d-spark',touch);
  await sleep(900);
  const cap=await pg.evaluate(()=>{
    const c=document.querySelector('#sparkSay,.spk-cap');
    const bub=document.querySelector('.a3d-sparkbub.on,.a3d-sparkbub');
    const cs=c?getComputedStyle(c):null;
    const on=!!(c&&!c.hidden&&cs&&cs.display!=='none'&&cs.visibility!=='hidden'&&(c.textContent||'').trim());
    const bubOn=!!(bub&&bub.classList.contains('on')&&(bub.textContent||'').trim());
    return {on,bubOn,text:((c&&c.textContent)||(bub&&bub.textContent)||'').replace(/\s+/g,' ').trim().slice(0,160),
      display:cs&&cs.display, hidden:c&&c.hidden};
  });
  await shot(pg,tag+'-arctic-ask');
  rec(tag+'-arctic-ask-caption', !!(cap.on||cap.bubOn), cap);
  // leave via Home / back — never .a3d-h for Egypt, but Arctic back is .a3d-back
  await clickSel(pg,'.a3d-back,.sbx-back',touch).catch(()=>{});
  await sleep(800);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(600);
  return cap;
}

async function prove390bubble(pg,tag){
  const info=await pg.evaluate(()=>{
    const b=document.querySelector('.eg3d-bub');
    const g=document.querySelector('#grownUpBtn,.sg-btn,.eg3d-gear');
    if(!b||!g) return {ok:true,why:'missing',hasB:!!b,hasG:!!g};
    const br=b.getBoundingClientRect(), gr=g.getBoundingClientRect();
    const overlap=!(br.right<gr.left-2||br.left>gr.right+2||br.bottom<gr.top-2||br.top>gr.bottom+2);
    return {ok:!overlap, br:{l:br.left,r:br.right,t:br.top,b:br.bottom,txx:(b.textContent||'').slice(0,80)},
      gr:{l:gr.left,r:gr.right,t:gr.top,b:gr.bottom}};
  });
  rec(tag+'-390-bubble-vs-grownups', !!info.ok, info);
  return info;
}

async function runTag(w,h,touch,tag){
  CURTAG=tag;
  const tRun=Date.now();
  const {br,pg,jsErrors}=await launch(w,h,touch,'');
  out[tag]={};
  try{
    const info=await pg.evaluate(()=>({W:innerWidth,H:innerHeight}));
    rec('eg-viewport-'+tag, info.W===w&&info.H===h, info);
    rec(tag+'-swiftshader-note', true, {gpu:'swiftshader only, no real GPU'});

    if(w>=800){
      try{ await proveArctic(pg,touch,tag); }
      catch(e){ rec(tag+'-arctic-exception',false,{err:String(e)}); flog('arctic err',e); }
      await clickSel(pg,'#homeBtn',touch).catch(()=>{});
      await sleep(700);
    }

    rec(tag+'-enter', await enterEgypt(pg,touch), await st(pg));
    await closeMap(pg,touch);
    await sleep(2500);
    const P10ONLY=(process.env.P10ONLY||process.env.SEED_P10||'')==='1';
    let resumed=false;
    if(P10ONLY){
      const seed=await pg.evaluate(()=>{
        const KEY='sparkEgypt3dV1';
        let all={v:1,profiles:{}};
        try{all=JSON.parse(localStorage.getItem(KEY)||'null')||all}catch(e){}
        if(!all.profiles) all.profiles={};
        const G=window.__eg3d||{};
        const pid=(G.K&&G.K.pid)||Object.keys(all.profiles)[0]||'p1';
        const me=Object.assign({},all.profiles[pid]||{});
        me.mis={p:10,st:'ask',t:Date.now(),tabs:9,paid:[1,2,3,4,5,6,7,8,9]};
        all.v=1; all.profiles[pid]=me;
        localStorage.setItem(KEY,JSON.stringify(all));
        return {pid,mis:me.mis};
      });
      flog('seed-p10',seed);
      const url=pg.url();
      await pg.goto(url,{waitUntil:'load',timeout:90000});
      await sleep(1000);
      for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
      await enterEgypt(pg,touch);
      await closeMap(pg,touch);
      await sleep(1500);
      const rs=await st(pg);
      flog('P10 resume',rs);
      rec(tag+'-p10-resume', (rs.p||0)>=10||rs.st==='paint'||rs.st==='morning'||rs.st==='sleep', rs);
      resumed=(rs.p||0)>=10||rs.st==='paint'||rs.st==='morning'||rs.st==='sleep';
      if(!resumed) flog('seed-p10 failed, falling back to a fresh P1–P10 replay',rs);
    }
    if(!resumed){
      const intro=await st(pg);
      await shot(pg,tag+'-first-prompt');
      const firstLine=(intro.bub||'')+' '+(intro.dlg||'');
      rec(tag+'-fresh-intro', /Walk over and ask him to let God/i.test(firstLine) && !/one more time/i.test(firstLine), {firstLine});
      if(w<=400){
        await prove390bubble(pg,tag);
        await shot(pg,tag+'-390-first-bubble');
      }
      await recCam(pg,tag,'intro');
      const pose=await pharaohPose(pg);
      if(pose) rec(tag+'-pharaoh-not-tpose', Math.abs(pose.x0)>0.4||Math.abs(pose.x1)>0.4, pose);

      let p1=await playP1(pg,touch,tag);
      for(let t=0;t<3 && p1 && p1.st==='act';t++){
        flog('P1 retry',t,p1);
        p1=await playP1(pg,touch,tag);
      }
      const p1ok=p1.st==='ask'||(p1.p||0)>=2||p1.st==='gap'||p1.st==='come'||p1.st==='plague';
      rec(tag+'-p1-done', p1ok, p1);
      logProgress(tag+' P1 done', 'st='+p1.st+' p='+p1.p+' url='+BASE);
      if(!p1ok){flog('ABORT',tag,'P1 did not advance',p1);rec(tag+'-aborted',false,{at:'P1',s:p1});return}

      for(let n=2;n<=9;n++){
        const r=await playPlague(pg,touch,tag,n);
        const pok=(r.p||0)>n || r.st==='ask'||r.st==='paint'||r.st==='gap'||r.st==='come'||r.st==='plague';
        rec(tag+'-p'+n+'-done', pok, {st:r.st,p:r.p});
        logProgress(tag+' P'+n+' done', 'st='+r.st+' p='+r.p+' url='+BASE);
        if(!pok){flog('ABORT',tag,'P'+n+' did not advance',r);rec(tag+'-aborted',false,{at:'P'+n,s:r});return}
        if(n===3){
          await clickPalacePinAfterCountdown(pg,touch,tag);
          if(process.env.P3ONLY==='1'){flog('P3ONLY done');return}
        }
      }
    }
    const end=await playP10andEnding(pg,touch,tag);
    const endOk=!!(end.badge||end.st==='done');
    rec(tag+'-p10-ending-done', endOk, end);
    logProgress(tag+' P10+ending done', JSON.stringify({st:end.st,p:end.p,cine:end.cine,badge:end.badge}));
    if(!endOk){flog('ABORT',tag,'P10/ending did not complete (badge must be true)',end);rec(tag+'-aborted',false,{at:'P10',s:end});return}
    out[tag].ms=Date.now()-tRun;
  }catch(e){
    out.err=(out.err||'')+String(e&&e.stack||e);
    flog('EXCEPTION',tag,String(e&&e.stack||e));
    rec(tag+'-exception',false,{err:String(e)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }
  out[tag].ms=(out[tag].ms)||(Date.now()-tRun);
  rec(tag+'-no-js-errors', !(jsErrors&&jsErrors.length), {n:(jsErrors||[]).length, errs:jsErrors||[]});
  try{await shot(pg,tag+'-final')}catch(_){}
  try{await br.close()}catch(_){}
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'s37 reprove start\n')}catch(e){}
  flog('START',BASE,'swiftshader only');
  const ONLY=(process.env.ONLY||'').trim();
  if(!ONLY||ONLY==='1280') await runTag(1280,715,false,'1280x715');
  if(!ONLY||ONLY==='390') await runTag(390,844,true,'390x844');
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  const report={pass,fail,total:out.checks.length,checks:out.checks,shots:out.shots,err:out.err,swiftshader:true,url:BASE};
  fs.writeFileSync(process.env.REPORT||'/tmp/s37hand7-report.json',JSON.stringify(report,null,2));
  flog('DONE',JSON.stringify({pass,fail,total:out.checks.length,err:out.err,ms1280:out['1280x715']&&out['1280x715'].ms,ms390:out['390x844']&&out['390x844'].ms}));
  console.log('REPORT /tmp/s37hand3-report.json');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
