/* 1280 follow-up: after P10 throne, can the kid walk out to Goshen by door arrow, goTo, and keys? Also first-screen map pin must walk. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE='http://127.0.0.1:8765/';
const SHOT='/workspace/looks/e/shots/s37/s44-p10-cam';
const LIVE='/workspace/p32work/spark37/proof-logs/s44-p10-walkout-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
async function shot(pg,n){const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p,timeout:60000});flog('SHOT',p);return p}
async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<4||b.height<4||st.display==='none'||st.visibility==='hidden'||st.opacity==='0')continue;
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,id:e.className,pe:st.pointerEvents}}
    }
    return best;
  },sel);
  if(!box)return null;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
}
async function clickText(pg,re){
  const box=await pg.evaluate(r=>{const rx=new RegExp(r,'i');
    const els=[...document.querySelectorAll('button,a,[data-env],[data-c],.cont,[data-name]')];
    for(const e of els){const t=(e.textContent||e.getAttribute('data-env')||e.getAttribute('data-c')||e.getAttribute('data-name')||'').trim();
      if(!rx.test(t))continue;const b=e.getBoundingClientRect();if(b.width<2||b.height<2)continue;
      return {x:b.left+b.width/2,y:b.top+b.height/2}}
    return null},re);
  if(!box)return false;
  await pg.mouse.click(box.x,box.y);return true;
}
async function skipOverlay(pg){
  await clickSel(pg,'.eg3d-mapx,.sh3d-bookx,.sh3d-shopx,.sh3d-rskip',false).catch(()=>{});
  for(const sel of ['button.ks-age','button.ks-go','.sh3d-skip']) await clickSel(pg,sel,false).catch(()=>{});
}
async function waitG(pg,ms=60000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await skipOverlay(pg);
    const st=await pg.evaluate(()=>{
      const ld=document.querySelector('.eg3d-load');
      const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);
      const g=window.__eg3d;
      return {loadOn,has:!!(g&&(g.cam||g.scrP||g.state))};
    });
    if(st.has&&!st.loadOn) return true;
    await sleep(400);
  }
  return false;
}
function kidOf(st){if(!st||!st.kid)return null;return {x:st.kid[0],z:st.kid[st.kid.length>2?2:1]}}
async function state(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{},st=G.state?G.state():{};
    const k=st.kid||null;
    let path=null,goal=null,entry=null,route=null;
    try{entry=G.palEntry?G.palEntry():null}catch(e){}
    try{
      const dbg=G.__dbg&&G.__dbg();
      // no mv exposed; log walkTo existence
    }catch(e){}
    return {mode:G.modeP?G.modeP():st.mode,mis:st.mis,kid:k,pins:st.pins,pinsShown:st.pinsShown,entry,hasWalkTo:typeof G.walkTo==='function',hasGoTo:typeof G.goTo==='function',mapOn:!!document.querySelector('.eg3d-map'),arrowOn:!!(document.querySelector('.eg3d-obja')&&getComputedStyle(document.querySelector('.eg3d-obja')).display!=='none'&&document.querySelector('.eg3d-obja').classList.contains('on'))};
  });
}

(async()=>{
  fs.writeFileSync(LIVE,'walkout '+new Date().toISOString()+'\n');
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy-no-user-gesture-required','--autoplay-policy=no-user-gesture-required']});
  const ctx=await br.newContext({viewport:{width:1280,height:715},deviceScaleFactor:1});
  const pg=await ctx.newPage();
  const url=BASE+'?fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(600);
  for(let i=0;i<8;i++){await skipOverlay(pg);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(250)}
  await clickSel(pg,'#homeBtn',false).catch(()=>{});
  await sleep(300);
  await clickSel(pg,'a.body.earth',false);
  await sleep(800);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',false)) await clickText(pg,'^Africa$');
  await sleep(800);
  if(!await clickSel(pg,'[data-env="Sahara"]',false)) await clickText(pg,'Ancient Egypt|Sahara');
  const ok=await waitG(pg);
  flog('entered',ok);
  await clickSel(pg,'.eg3d-mapx',false).catch(()=>{});
  await sleep(500);
  const start=await state(pg);
  flog('start',start);
  // click the visible map pin (first-screen book/map)
  const mapPin=await pg.evaluate(()=>{
    const b=document.querySelector('.sh3d-pin[data-pin="map"],[data-pin="map"].on,.eg3d-pin-map.on');
    const els=[...document.querySelectorAll('.sh3d-pin,.eg3d-pin')].filter(e=>e.classList.contains('on')||(e.getBoundingClientRect().width>8&&getComputedStyle(e).opacity!=='0'));
    const info=els.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.pin,cls:e.className,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,on:e.classList.contains('on')}});
    let hit=null;
    if(b){const r=b.getBoundingClientRect();hit={x:r.left+r.width/2,y:r.top+r.height/2,id:b.dataset.pin}}
    else {const m=info.find(p=>p.id==='map'||p.id==='map2');if(m)hit=m}
    return {hit,info};
  });
  flog('mapPin',mapPin);
  const k0=kidOf(start);
  if(mapPin.hit){
    await pg.mouse.click(mapPin.hit.x,mapPin.hit.y);
    await sleep(400);
    const mid=await state(pg);
    await sleep(1600);
    const later=await state(pg);
    const k1=kidOf(mid),k2=kidOf(later);
    const moved=k0&&k2&&Math.hypot(k2.x-k0.x,k2.z-k0.z)>0.25;
    flog(moved&&!later.mapOn?'PASS map-pin-walked-not-instant-map':'FAIL map-pin-walk',{moved,mapOnMid:mid.mapOn,mapOnLater:later.mapOn,k0,k1,k2,mode:later.mode});
    await shot(pg,'1280-map-pin-after');
    await clickSel(pg,'.eg3d-mapx,.sh3d-bookx,.sh3d-rskip',false).catch(()=>{});
    await sleep(300);
  }

  // jump to P10 paint in the hall
  const jumped=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jump)G.jump(-37.44,22)}catch(e){}
    try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[9],auto:0,autoT:0})}catch(e){}
    return {entry:G.palEntry&&G.palEntry(),walkTo:typeof G.walkTo,goTo:typeof G.goTo,mode:G.modeP&&G.modeP()};
  });
  flog('jumped',jumped);
  await sleep(800);
  await shot(pg,'1280-walkout-start');
  const a=await state(pg);
  flog('before-walk',a);

  // try goTo palEntry then Goshen, log whether walkTo runs
  const went=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const entry=G.palEntry?G.palEntry():[-32,22];
    const out={entry,used:null,err:null};
    try{
      if(G.walkTo){G.walkTo(entry[0],entry[1]);out.used='walkTo-entry'}
      else out.used='none';
    }catch(e){out.err=String(e)}
    return out;
  });
  flog('go-entry',went);
  await sleep(3500);
  const b=await state(pg);
  flog('after-entry-walk',b);
  await shot(pg,'1280-walkout-entry');

  // then Goshen
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{if(G.walkTo)G.walkTo(-42,-5)}catch(e){}
  });
  await sleep(6000);
  const c=await state(pg);
  flog('after-goshen-walkTo',c);
  await shot(pg,'1280-walkout-goto-goshen');

  // if still in hall, click the door arrow
  const k=kidOf(c);
  const inHall=k&&Math.abs(k.z-22)<8&&k.x<-28;
  flog('inHall?',inHall,k);
  const arrow=await pg.evaluate(()=>{
    const a=document.querySelector('.eg3d-obja');
    if(!a)return null;
    const r=a.getBoundingClientRect(),st=getComputedStyle(a);
    return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,on:a.classList.contains('on'),disp:st.display,op:st.opacity,vis:st.visibility,pin:a._P&&a._P.id};
  });
  flog('arrow',arrow);
  if(arrow&&arrow.w>4){
    await pg.mouse.click(arrow.x,arrow.y);
    flog('clicked-arrow');
    await sleep(7000);
    const d=await state(pg);
    flog('after-arrow',d);
    await shot(pg,'1280-walkout-after-arrow');
  }
  // keys toward entry if still stuck
  const e0=await state(pg);
  const ke=kidOf(e0);
  if(ke&&ke.z>-1){
    flog('keydown ArrowRight/KeyD + ArrowDown');
    await pg.keyboard.down('KeyD');
    await pg.keyboard.down('ArrowRight');
    await sleep(2500);
    await pg.keyboard.up('KeyD');
    await pg.keyboard.up('ArrowRight');
    await pg.keyboard.down('KeyS');
    await pg.keyboard.down('ArrowDown');
    await sleep(2500);
    await pg.keyboard.up('KeyS');
    await pg.keyboard.up('ArrowDown');
    const e1=await state(pg);
    flog('after-keys',e1);
    await shot(pg,'1280-walkout-after-keys');
  }
  const fin=await state(pg);
  const kf=kidOf(fin);
  const reached=kf&&kf.z<8&&kf.x<-28;
  flog(reached?'PASS walked-to-goshen':'FAIL still-not-goshen',kf,fin);
  await br.close();
  process.exit(reached?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
