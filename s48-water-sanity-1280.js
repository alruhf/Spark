/* s48 1280 water-sanity: walk to the bank by pins, then click clearly blue
   foreground water (raycast-picked, off HUD). No testfast, no walkTo/goTo/jump. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT='/workspace/looks/e/shots/s37/s48-handlike';
const LIVE='/workspace/p32work/spark37/proof-logs/s48-water-sanity-1280.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
fs.mkdirSync(SHOT,{recursive:true});
fs.writeFileSync(LIVE,'s48 water-sanity start '+new Date().toISOString()+'\n');

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
  for(const sel of ['.sh3d-skip','.s3d-skip','.s3d-retry button','.eg3d-retry button']) await clickSel(pg,sel,touch).catch(()=>{});
}
async function skipTalk(pg,touch,times=8){
  for(let i=0;i<times;i++){
    const before=await pg.evaluate(()=>{
      const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
      const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');
      return {has:!!d,txt:d?(d.textContent||'').slice(0,80):'',sk:!!sk};
    });
    if(!before.has) return;
    if(before.sk){
      await pg.evaluate(()=>{
        const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');
        if(!sk)return;
        sk.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,composed:true,pointerId:1,pointerType:'mouse'}));
        sk.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,composed:true,pointerId:1,pointerType:'mouse'}));
        sk.click();
      });
      const box=await pg.evaluate(()=>{const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');if(!sk)return null;const b=sk.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}});
      if(box) await pg.mouse.click(box.x,box.y);
    }
    await sleep(500);
    const after=await pg.evaluate(()=>{
      const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
      return {has:!!d,txt:d?(d.textContent||'').slice(0,80):''};
    });
    if(!after.has) return;
    if(after.txt===before.txt){
      const t0=Date.now();
      while(Date.now()-t0<8000){
        await sleep(600);
        const now=await pg.evaluate(()=>{
          const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
          return {has:!!d,txt:d?(d.textContent||'').slice(0,80):''};
        });
        if(!now.has || now.txt!==before.txt) break;
      }
    }
  }
}
async function waitG(pg,key,touch,ms=45000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await skipOverlay(pg,touch);
    const st=await pg.evaluate(k=>{
      const ld=document.querySelector(k==='eg3d'?'.eg3d-load':'.s3d-load');
      const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);
      const g=window['__'+k];
      return {loadOn,has:!!(g&&(g.cam||g.scrP||g.K||g.kid||g.state||g.kidAt))};
    },key);
    if(st.has&&!st.loadOn) return true;
    await sleep(400);
  }
  return false;
}
function kidProbe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const at=G.kidAt?G.kidAt():null;
    const x=at&&at[0], y=at&&at[1], z=at&&(at[2]!=null?at[2]:at[1]);
    const wy=-0.9;
    const dep=(y!=null)?(wy-y):null;
    const inR=!!(x!=null&&Math.abs(x-32)<5.65);
    const stt=(G.state&&G.state())||{};
    const mis=stt.mis||{};
    return {x,y,z,dep,inR,st:mis.st,p:mis.p,W:innerWidth,H:innerHeight};
  });
}

(async()=>{
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const ctx=await br.newContext({viewport:{width:1280,height:720},isMobile:false,hasTouch:false,deviceScaleFactor:1});
  const pg=await ctx.newPage();
  pg.setDefaultTimeout(60000);
  const url=BASE.replace(/\/$/,'/')+'?fresh=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.removeItem('sparkTestfast');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,false);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  const tf=await pg.evaluate(()=>{try{return {ss:sessionStorage.getItem('sparkTestfast'),q:location.search}}catch(e){return {e:String(e)}}});
  flog('tf-guard',JSON.stringify(tf));

  await skipOverlay(pg,false);
  await clickSel(pg,'.a3d-back,.r3d-back,.eg3d-back',false).catch(()=>{});
  await sleep(300);
  await clickSel(pg,'#homeBtn',false).catch(()=>{});
  await sleep(300);
  if(!await clickSel(pg,'a.body.earth',false)) await domClick(pg,'a.body.earth');
  await sleep(1400);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',false)) {if(!await clickText(pg,'^Africa$',false)) await domClick(pg,'[data-c="Africa"]');}
  await sleep(1400);
  if(!await clickSel(pg,'[data-env="Sahara"]',false)) {if(!await clickText(pg,'Ancient Egypt|Sahara',false)) await domClick(pg,'[data-env="Sahara"]');}
  const entered=await waitG(pg,'eg3d',false,60000);
  flog('entered',entered);
  if(!entered){
    await pg.screenshot({path:SHOT+'/1280-water-sanity-enter-fail.png',timeout:60000});
    flog('FAIL enter Egypt (age-gate/nav)');
    await br.close();
    process.exit(2);
  }
  await sleep(400);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',false).catch(()=>{});

  // Stay (dismiss leave if it appears after back)
  const back=await clickSel(pg,'.a3d-back,.eg3d-back,button.a3d-back',false);
  await sleep(600);
  const leaveOn=await pg.evaluate(()=>!!document.querySelector('.eg3d-leaveq'));
  if(leaveOn){await clickSel(pg,'.eg3d-leavestay,button.eg3d-leavestay',false);await sleep(500)}
  flog('stay',leaveOn);

  // First story pin toward the palace, then skip the talk so P1 act starts
  await clickSel(pg,'.eg3d-obja.on,.eg3d-pin-pal.on',false);
  await sleep(800);
  const arrived=await (async()=>{
    const t0=Date.now();
    while(Date.now()-t0<90000){
      const p=await kidProbe(pg);
      if(p.card) await skipTalk(pg,false,4);
      // reuse card check via evaluate
      const card=await pg.evaluate(()=>{const d=document.querySelector('.eg3d-dlg,.eg3d-narr,.eg3d-nbox');return d&&d.getBoundingClientRect().height>20});
      if(card) return true;
      if(p.x!=null&&Math.hypot(p.x-(-40),(p.z||0)-22)<16) return true;
      await clickSel(pg,'.eg3d-obja.on,.eg3d-pin-pal.on',false).catch(()=>{});
      await sleep(700);
    }
    return false;
  })();
  flog('palace-arrive',arrived,JSON.stringify(await kidProbe(pg)));
  await skipTalk(pg,false,20);
  await sleep(400);

  // Follow the river / next-step pin to the bank
  const tBank=Date.now();
  let atBank=false;
  while(Date.now()-tBank<95000){
    await skipTalk(pg,false,3);
    const p=await kidProbe(pg);
    if(p.x!=null&&p.x>22&&p.x<27){atBank=true;flog('bank',JSON.stringify(p));break}
    await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-obja.on',false).catch(()=>{});
    await sleep(800);
  }
  if(!atBank) flog('bank-timeout',JSON.stringify(await kidProbe(pg)));

  // Wait until the kid stops walking so the follow-cam is stable; click water in the natural view.
  {
    let last=await kidProbe(pg), idle=0;
    const tStop=Date.now();
    while(Date.now()-tStop<8000){
      await sleep(350);
      const now=await kidProbe(pg);
      const moved=Math.hypot((now.x||0)-(last.x||0),(now.z||0)-(last.z||0));
      if(moved<0.25) idle++; else idle=0;
      last=now;
      if(idle>=3) break;
    }
    flog('settled',JSON.stringify(last));
  }

  // Pick a clearly-blue foreground water pixel in the current view (off tight HUD only).
  const aim=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const D=G.__dbg&&G.__dbg();
    if(!D||!D.water||!D.cam||!D.THREE) return {ok:false,why:'no-dbg'};
    const {water,ground,cam,THREE}=D;
    try{cam.updateMatrixWorld(true); if(water.updateMatrixWorld) water.updateMatrixWorld(true);}catch(e){}
    const cvs=[...document.querySelectorAll('canvas')].map(c=>{const b=c.getBoundingClientRect();return {c,b,area:b.width*b.height,w:c.width,h:c.height}});
    cvs.sort((a,b)=>b.area-a.area);
    const cv=cvs[0]&&cvs[0].area>100?cvs[0].c:document.querySelector('canvas');
    const cr=cv?cv.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};
    const cvList=cvs.map(o=>({w:o.b.width,h:o.b.height,cw:o.w,ch:o.h,cls:o.c.className}));
    const ray=new THREE.Raycaster();
    const ndc=(x,y)=>new THREE.Vector3(((x-cr.left)/cr.width)*2-1,-((y-cr.top)/cr.height)*2+1,0.5);
    const hud=[];
    for(const e of document.querySelectorAll('button,.eg3d-staffb,#grownUpBtn,.sg-btn,.spark-companion,.eg3d-tabs')){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.pointerEvents==='none')continue;
      // Ignore full-width / huge transparent wrappers that would swallow the river strip.
      if(b.width>innerWidth*0.45 && b.height>120) continue;
      hud.push({l:b.left,r:b.right,t:b.top,b:b.bottom,w:+b.width.toFixed(0),h:+b.height.toFixed(0),cls:String(e.className||e.id||e.tagName).slice(0,40)});
    }
    const inHud=(x,y)=>hud.some(h=>x>=h.l-2&&x<=h.r+2&&y>=h.t-2&&y<=h.b+2);
    const hits=[], raw=[];
    let nWater=0,nInR=0,nHudSkip=0;
    for(let y=Math.floor(innerHeight*0.12); y<innerHeight-4; y+=8){
      for(let x=4; x<innerWidth-4; x+=8){
        ray.setFromCamera(ndc(x,y),cam);
        const wh=water?ray.intersectObject(water,true)[0]:null;
        if(!wh) continue;
        nWater++;
        const wx=wh.point.x, wz=wh.point.z;
        const inR=Math.abs(wx-32)<5.65;
        if(inR) nInR++;
        if(raw.length<8) raw.push({x,y,wx:+wx.toFixed(2),wz:+wz.toFixed(2),inR});
        if(!inR) continue;
        if(inHud(x,y)){nHudSkip++; continue}
        const gh=ground?ray.intersectObject(ground,true)[0]:null;
        const gd=gh?gh.distance:1e9;
        const steal=gh && Math.abs(gh.point.x-32)>(5.5-1.2) && Math.abs(gh.point.x-32)<(5.5+2.8);
        const wet=gh && Math.abs(gh.point.x-32)<5.65;
        const wouldSteal=(!gh||wet||steal)&&wh.distance<gd+8;
        hits.push({x,y,wx:+wx.toFixed(2),wz:+wz.toFixed(2),wd:+wh.distance.toFixed(2),gd:gd===1e9?null:+gd.toFixed(2),gx:gh?+gh.point.x.toFixed(2):null,wouldSteal,inR});
      }
    }
    const info={nWater,nInR,nHudSkip,nHits:hits.length,hud,raw,cv:{x:cr.left,y:cr.top,w:cr.width,h:cr.height,list:cvList},cam:[+cam.position.x.toFixed(2),+cam.position.y.toFixed(2),+cam.position.z.toFixed(2)],W:innerWidth,H:innerHeight,waterVis:!!(water&&water.visible)};
    if(!hits.length) return Object.assign({ok:false,why:'no-water-pixels'},info);
    // Prefer clearly-interior river water, not a 4px screen-edge sliver (a prior click at 4,710 was inconclusive).
    const W=innerWidth,H=innerHeight;
    const open=hits.filter(h=>h.wouldSteal&&h.wx>=27.4&&h.x>=200&&h.x<=400&&h.y>=80&&h.y<=H-36);
    const interior=hits.filter(h=>h.wouldSteal&&h.wx>=27.4&&h.wx<=31&&h.x>=80&&h.x<=W-80&&h.y>=80&&h.y<=H-36);
    const pool=open.length?open:interior.length?interior:hits.filter(h=>h.wouldSteal&&h.x>=48&&h.x<=W-48&&h.y<=H-28);
    pool.sort((a,b)=> (Math.abs(a.wx-29)-Math.abs(b.wx-29)) || (b.y-a.y));
    const pick=pool[0]||hits[0];
    return Object.assign({ok:true,pick,nOpen:open.length,nInterior:interior.length,sample:pool.slice(0,5)},info);
  });

  flog('aim',JSON.stringify(aim));
  await pg.screenshot({path:SHOT+'/1280-water-sanity-before.png'});
  flog('SHOT',SHOT+'/1280-water-sanity-before.png');
  const before=await kidProbe(pg);
  flog('before',JSON.stringify(before));

  if(!aim||!aim.ok){
    flog('FAIL no water pixel to click');
    await pg.screenshot({path:SHOT+'/1280-water-sanity-after.png'});
    await br.close();
    process.exit(2);
  }
  const {x,y}=aim.pick;
  const pre=await pg.evaluate(({x,y})=>{
    const e=document.elementFromPoint(x,y);
    const stack=[];let n=e;
    while(n&&stack.length<8){stack.push({tag:n.tagName,cls:String(n.className||n.id||'').slice(0,60),pe:getComputedStyle(n).pointerEvents});n=n.parentElement}
    const logs=(window.__sbxLog||[]).slice(-8);
    return {stack,logs,logN:(window.__sbxLog||[]).length};
  },{x,y});
  flog('preClick',JSON.stringify(pre));
  // One real desktop mouse click on the visible water.
  await pg.mouse.move(x,y);
  await sleep(120);
  await pg.mouse.down();
  await sleep(60);
  await pg.mouse.up();
  flog('clicked',x,y,JSON.stringify(aim.pick));
  await sleep(400);
  const post=await pg.evaluate(()=>{
    const logs=(window.__sbxLog||[]).slice(-16);
    return {logs,logN:(window.__sbxLog||[]).length,kid:(window.__eg3d&&window.__eg3d.kidAt)?window.__eg3d.kidAt():null};
  });
  flog('postClick',JSON.stringify(post));

  const t0=Date.now();
  let after=before;
  while(Date.now()-t0<12000){
    await sleep(400);
    after=await kidProbe(pg);
    if(after.inR&&after.dep>0.08&&after.dep<=0.45) break;
  }
  await pg.screenshot({path:SHOT+'/1280-water-sanity-after.png'});
  flog('SHOT',SHOT+'/1280-water-sanity-after.png');
  flog('after',JSON.stringify(after));
  const ok=!!(after.inR&&after.dep>0.08&&after.dep<=0.45);
  flog(ok?'PASS':'FAIL','1280-visible-water-click-wades',JSON.stringify({before,after,pick:aim.pick,sec:+((Date.now()-t0)/1000).toFixed(2)}));
  await br.close();
  process.exit(ok?0:1);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(2)});
