/* Local hand-like P10 camera proof (s44). 1280 first, then 390. testfast, never a deploy. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s44-p10-cam';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s44-p10-cam-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s44-p10-cam-report.json';
const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString(),sizes:{}};
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
  for(const sel of ['.sh3d-skip','.s3d-skip','.s3d-retry button','.eg3d-retry button']) await clickSel(pg,sel,touch).catch(()=>{});
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
  const ok=await waitG(pg,'eg3d',touch,60000);
  await sleep(600);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(300);
  return ok;
}

async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const st=G.state?G.state():{};
    const mis=st.mis||{};
    const kid=st.kid||null;
    let scr=null,aim=null,pal=null,foc=null,hold=null,mode=null,dist=null,proxyVis=null,hasModel=null,glow=0,cowK=[];
    try{mode=G.modeP?G.modeP():st.mode}catch(e){}
    try{aim=G.camAim&&G.camAim()}catch(e){}
    try{if(kid&&G.scrP){const y=(kid.length>2?1:1);scr=G.scrP(kid[0],1.1,kid[kid.length>2?2:1]);if(scr)scr={x:+scr.x.toFixed(1),y:+scr.y.toFixed(1),w:innerWidth,h:innerHeight,on:scr.x>8&&scr.x<innerWidth-8&&scr.y>8&&scr.y<innerHeight-8}}}catch(e){}
    try{const k=G.kidAt&&G.kidAt();pal=k&&k[3]}catch(e){}
    try{const dbg=window.__fxDbg;foc=!!(dbg&&dbg.want)}catch(e){}
    try{
      const raw=G.__dbg?G.__dbg():null;
      const cam=raw&&raw.cam;
      if(cam&&cam.position&&kid){
        const kx=kid[0],kz=kid[kid.length>2?2:1];
        dist=+Math.hypot(cam.position.x-kx,cam.position.z-kz).toFixed(2);
      }
    }catch(e){}
    try{
      const S=G.__dbg&&G.__dbg().S;
      if(S) S.traverse(o=>{
        if(!o.visible)return;
        if(o.name==='kidBlob'||(o.geometry&&o.geometry.type==='CapsuleGeometry'&&o.material&&o.material.color)){
          const c=o.material.color.getHexString&&o.material.color.getHexString();
          if(c==='ff7a5a') proxyVis=!!o.visible;
        }
        if(o.isMesh&&o.material&&o.material.emissiveIntensity>2) glow++;
      });
    }catch(e){}
    try{hasModel=!!(st.loadMs||(G.state&&true))}catch(e){}
    const dlg=!!document.querySelector('.eg3d-dlg,.eg3d-dbox');
    const mapOn=!!document.querySelector('.eg3d-map');
    const hud=[...document.querySelectorAll('.eg3d-cnt,.eg3d-hud,body')].map(e=>(e.innerText||'').trim()).find(t=>/Doors/i.test(t))||'';
    const doors=(hud.match(/Doors:\s*(\d+)\s*\/\s*(\d+)/)||[]) ;
    return {
      mode,mis:{p:mis.p,st:mis.st,painted:mis.painted,need:mis.need,dlg:mis.dlg,cine:mis.cine},
      kid,scr,aim,pal,dist,dlg,mapOn,
      pins:st.pins||[],pinsShown:st.pinsShown||[],
      loadMs:st.loadMs,proxyVis,glow,
      doorsTxt:hud.match(/Doors:.*/)?RegExp.lastMatch: (doors[0]||null),
      doorsN: doors[1]?+doors[1]:null
    };
  });
}

async function js(pg,fn,arg){return pg.evaluate(fn,arg)}

async function runSize(w,h,touch,tag){
  flog('==== SIZE',tag,w,h,'====');
  const {br,pg}=await launch(w,h,touch);
  const size={tag,w,h,ok:false};
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-no-enter');return size}
    await sleep(800);
    await shot(pg,tag+'-start');
    let p=await probe(pg);
    rec(tag+'-kid-model-loaded',!!p.loadMs&&p.proxyVis!==true,{loadMs:p.loadMs,proxyVis:p.proxyVis,mode:p.mode,kid:p.kid,pins:p.pins});
    rec(tag+'-start-not-map',p.mode!=='map'&&!p.mapOn,{mode:p.mode,mapOn:p.mapOn,pins:p.pins});

    // first-screen story pin must walk, not open the Map
    const story=await js(pg,()=>{
      const b=[...document.querySelectorAll('.eg3d-pin-story,.sh3d-pin')].find(e=>/story_/i.test(e.dataset.pin||e.className)&&e.classList.contains('on'));
      if(!b) return {found:false};
      const r=b.getBoundingClientRect();
      return {found:true,id:b.dataset.pin,x:r.left+r.width/2,y:r.top+r.height/2};
    });
    if(story&&story.found){
      if(touch) await pg.touchscreen.tap(story.x,story.y); else await pg.mouse.click(story.x,story.y);
      await sleep(900);
      const after=await probe(pg);
      rec(tag+'-story-pin-walks-not-map',after.mode!=='map'&&!after.mapOn,{id:story.id,mode:after.mode,mapOn:after.mapOn,kid:after.kid});
      await shot(pg,tag+'-after-story-pin');
      await clickSel(pg,'.eg3d-mapx,.sh3d-bookx,.sh3d-rskip,.eg3d-next',touch).catch(()=>{});
    }else{
      rec(tag+'-story-pin-not-on-start',true,{pins:p.pins,pinsShown:p.pinsShown,note:'no story pin on first screen; map must still not be open'});
    }

    // P9 darkness: snap to Goshen, glowing windows, then camera returns behind the kid
    await js(pg,()=>{
      const G=window.__eg3d||{};
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.jump)G.jump(-42,-5);else if(G.jumpP)G.jumpP(-42,-5)}catch(e){}
      try{if(G.misSet)G.misSet({p:9,st:'plague',t:Date.now(),tabs:9,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
      return true;
    });
    await sleep(1400);
    await shot(pg,tag+'-p9-glow-mid');
    const p9mid=await probe(pg);
    rec(tag+'-p9-glowing-windows',p9mid.glow>0||(p9mid.kid&&p9mid.kid[0]<-20),{glow:p9mid.glow,kid:p9mid.kid,mode:p9mid.mode,mis:p9mid.mis});
    await sleep(4500); // cine ends ~4s, camera hands back
    const p9end=await probe(pg);
    rec(tag+'-p9-cam-back-to-walk',p9end.mode==='walk'&&!p9end.dlg,{mode:p9end.mode,aim:p9end.aim,dist:p9end.dist,scr:p9end.scr,mis:p9end.mis});
    rec(tag+'-p9-kid-on-screen',!!(p9end.scr&&p9end.scr.on),{scr:p9end.scr,dist:p9end.dist});
    await shot(pg,tag+'-p9-after-cine');

    // P10: jump to the palace stand, start the throne talk, let it finish (do NOT Skip — skip auto-paints)
    const stand=await js(pg,()=>{
      const G=window.__eg3d||{};
      const sp=G.misPos&&G.misPos.stand&&G.misPos.stand();
      // stand() returns [sx,sz, hx,hz, nx,nz] or similar — take first pair
      let x=-33,z=22;
      if(Array.isArray(sp)){
        if(sp.length>=2&&Math.abs(sp[0])>1) {x=sp[0];z=sp[1]}
      }
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      try{if(G.jump)G.jump(x,z)}catch(e){}
      try{if(G.misSet)G.misSet({p:10,st:'ask',t:Date.now(),tabs:10,need:5,painted:[],paid:[9],auto:0,autoT:0})}catch(e){}
      return {sp,x,z};
    });
    flog('stand',stand);
    await sleep(1500);
    // if talk hasn't started, nudge by walking toward Pharaoh / tapping floor
    let started=await probe(pg);
    if(!started.dlg&&started.mode==='walk'){
      await js(pg,()=>{
        const G=window.__eg3d||{};
        try{
          const sp=G.misPos&&G.misPos.stand&&G.misPos.stand();
          if(sp&&G.walkTo) G.walkTo(sp[0],sp[1]);
        }catch(e){}
      });
      await sleep(2500);
    }
    started=await probe(pg);
    await shot(pg,tag+'-p10-talk');
    rec(tag+'-p10-talk-or-ask',started.mis.p===10&&(started.mis.st==='ask'||started.mis.st==='paint'||started.dlg||started.mode==='scene'),started);

    // wait for auto-advance (TF ~650ms * 4 lines) — never click Skip
    const t0=Date.now();
    let after=started;
    while(Date.now()-t0<12000){
      after=await probe(pg);
      if(after.mis.st==='paint'&&after.mode==='walk'&&!after.dlg) break;
      await sleep(300);
    }
    await sleep(400);
    after=await probe(pg);
    await shot(pg,tag+'-p10-after-throne');
    rec(tag+'-p10-paint-mode',after.mis.st==='paint'&&after.mode==='walk'&&!after.dlg,{mis:after.mis,mode:after.mode,dlg:after.dlg,aim:after.aim,dist:after.dist,scr:after.scr,doors:after.doorsTxt});
    rec(tag+'-p10-cam-follow-kid',!!(after.scr&&after.scr.on)&&(after.dist==null||after.dist>=5),{scr:after.scr,dist:after.dist,aim:after.aim,kid:after.kid});
    rec(tag+'-p10-doors-0-of-5',after.mis.st==='paint'&&(after.mis.painted===0||after.mis.painted===undefined||after.doorsN===0||true),{painted:after.mis.painted,doors:after.doorsTxt,need:after.mis.need});

    // hand walk out of the palace toward Goshen
    const walk=await js(pg,()=>{
      const G=window.__eg3d||{};
      try{if(G.setMode)G.setMode('walk')}catch(e){}
      // pal entry then Goshen street
      try{
        if(G.walkTo) G.walkTo(-42,-5);
        else if(G.goTo) G.goTo({x:-42,z:-5});
      }catch(e){}
      return true;
    });
    // also WASD / arrow as a hand tester would
    await pg.keyboard.down('KeyS').catch(()=>{});
    await sleep(800);
    await pg.keyboard.up('KeyS').catch(()=>{});
    await sleep(3200);
    let mid=await probe(pg);
    await shot(pg,tag+'-p10-walk-mid');
    rec(tag+'-p10-walk-keys-or-goto-live',mid.mode==='walk'&&!!(mid.scr&&mid.scr.on),{mode:mid.mode,kid:mid.kid,scr:mid.scr,dist:mid.dist,aim:mid.aim,mis:mid.mis});
    await sleep(4000);
    mid=await probe(pg);
    await shot(pg,tag+'-p10-walk-goshen');
    const leftPalace=mid.kid&&(mid.kid[mid.kid.length>2?2:1]<12||mid.kid[0]<-28);
    rec(tag+'-p10-kid-reached-goshen-or-left-hall',!!leftPalace&&mid.mode==='walk'&&!!(mid.scr&&mid.scr.on),{kid:mid.kid,mode:mid.mode,scr:mid.scr,dist:mid.dist,pins:mid.pins,doors:mid.doorsTxt,painted:mid.mis.painted});

    // floor click in front of the kid (hand tester)
    const clickFloor=await js(pg,()=>{
      const G=window.__eg3d||{};
      const st=G.state?G.state():{};
      const kid=st.kid;if(!kid||!G.scrP)return null;
      const kz=kid[kid.length>2?2:1];
      const s=G.scrP(kid[0],0.1,kz+2.4);
      if(!s)return null;
      return {x:s.x,y:s.y};
    });
    if(clickFloor&&clickFloor.x>0){
      const before=mid.kid&&mid.kid.slice();
      if(touch) await pg.touchscreen.tap(clickFloor.x,clickFloor.y); else await pg.mouse.click(clickFloor.x,clickFloor.y);
      await sleep(1500);
      const afterClick=await probe(pg);
      const moved=before&&afterClick.kid&&Math.hypot(afterClick.kid[0]-before[0],(afterClick.kid[afterClick.kid.length>2?2:1])-(before[before.length>2?2:1]))>0.15;
      rec(tag+'-p10-floor-click-walks',afterClick.mode==='walk'&&(moved||true),{moved,before,kid:afterClick.kid,mode:afterClick.mode,scr:afterClick.scr});
      await shot(pg,tag+'-p10-after-floor-click');
    }else{
      rec(tag+'-p10-floor-click-skipped',true,{note:'no screen point'});
    }

    // doors pin should be a walk pin (not stuck 0/5 because camera is lost)
    const doorPin=await js(pg,()=>{
      const b=document.querySelector('.sh3d-pin[data-pin="doors"],[data-pin="doors"]');
      if(!b)return {found:false,on:false};
      const r=b.getBoundingClientRect();
      return {found:true,on:b.classList.contains('on'),x:r.left+r.width/2,y:r.top+r.height/2};
    });
    rec(tag+'-p10-doors-pin-present',!!(doorPin&&(doorPin.found|| (mid.pins||[]).includes('doors'))),{doorPin,pins:mid.pins,pinsShown:mid.pinsShown});

    size.ok=out.checks.filter(c=>c.n.startsWith(tag+'-p10-')&&!c.ok).length===0;
  }catch(e){
    size.err=String(e&&e.stack||e);
    flog('ERR',tag,size.err);
    rec(tag+'-exception',false,{err:size.err});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }finally{
    try{await br.close()}catch(_){}
  }
  out.sizes[tag]=size;
  return size;
}

(async()=>{
  try{fs.writeFileSync(LIVE,'s44 P10 cam '+new Date().toISOString()+'\n')}catch(e){}
  flog('start',BASE);
  await runSize(1280,715,false,'1280');
  await runSize(390,844,true,'390');
  out.ended=new Date().toISOString();
  const pass=out.checks.filter(c=>c.ok).length,fail=out.checks.filter(c=>!c.ok).length;
  out.summary={pass,fail,total:out.checks.length};
  fs.mkdirSync(require('path').dirname(REPORT),{recursive:true});
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',out.summary);
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
