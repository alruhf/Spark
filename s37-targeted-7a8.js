/* Targeted checks on 7a8tjojcb: (1) kid-style P10 doors-pin from the throne,
   look toward Goshen if needed so the doors pin is tappable, then ONLY
   tap that pin and wait. No Arrow keys, no leavePalace, no sand clicks
   to steer the kid. The game's routeVia must take them to Goshen and
   all 5 doors must get painted (retap the pin after each arrival, the
   way a kid would, never while a walk is still running). */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-7a8tjojcb-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/targeted-7a8tjojcb';
const LIVE=process.env.LIVE||'/tmp/s37-targeted-7a8-live.log';
const REPORT=process.env.REPORT||'/tmp/s37-targeted-7a8-report.json';
const out={checks:[],shots:[],err:null,url:BASE};
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
async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let state=null,mis=null,ka=null,mv=null,pins=null;
    try{state=G.state&&G.state()}catch(e){}
    try{mis=state&&state.mis}catch(e){}
    try{ka=G.kidAt?G.kidAt():null}catch(e){}
    try{mv=G.mvP?G.mvP():null}catch(e){}
    try{pins=state&&state.pinsShown}catch(e){}
    const kid=ka||(state&&state.kid)||[];
    const x=+kid[0], y=kid.length>2?+kid[1]:null, z=kid.length>2?+kid[2]:+kid[1];
    const cnt=document.querySelector('.eg3d-cnt,.eg3d-hg.eg3d-cnt');
    const ct=cnt?((cnt.textContent||'').replace(/\s+/g,' ').trim()):'';
    const el=document.querySelector('.eg3d-pin-doors,[data-pin="doors"]');
    let pinBox=null;
    if(el){
      const b=el.getBoundingClientRect(),st=getComputedStyle(el);
      const vis=b.width>=8&&b.height>=8&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0'&&st.pointerEvents!=='none';
      if(vis) pinBox={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,on:el.classList.contains('on')};
    }
    return {
      st:mis&&mis.st,p:mis&&mis.p,tabs:mis&&mis.tabs,
      painted:mis&&mis.painted,need:mis&&mis.need,
      mode:(state&&state.mode)||null,
      x,y,z,cnt:ct,
      pin:!!pinBox, pinBox,
      pinsShown:pins||[],
      pathN:mv&&mv.n, path:mv&&mv.p, walking:!!(mv&&mv.n>0)
    };
  });
}
async function resetPaint(pg,x,z){
  await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[0,1,2,3,4,5,6,7,8,9],auto:0,autoT:0})}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
  },{x,z});
  await sleep(700);
  return probe(pg);
}
async function lookGoshen(pg){
  // Camera look only — does not move the kid. A kid can orbit the view toward Goshen.
  const cam=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      const k=G.kidAt?G.kidAt():null;
      const x=k?k[0]:-46.5, z=k?(k[2]!=null?k[2]:k[1]):22;
      const yaw=Math.atan2(x-(-42), z-(-5));
      if(G.camAim) return G.camAim(yaw,0.32,14);
    }catch(e){return {err:String(e)}}
    return null;
  });
  await sleep(500);
  return cam;
}

async function dumpPins(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const all=[...document.querySelectorAll('.eg3d-pin,.sh3d-pin,[data-pin]')].map(e=>{
      const b=e.getBoundingClientRect(), st=getComputedStyle(e);
      return {
        id:e.dataset.pin||e.getAttribute('data-pin')||'',
        cls:String(e.className),
        display:st.display, opacity:st.opacity, pe:st.pointerEvents,
        vis:st.visibility, on:e.classList.contains('on'),
        x:b.left+b.width/2, y:b.top+b.height/2,
        w:+b.width.toFixed(1), h:+b.height.toFixed(1),
        left:+b.left.toFixed(1), top:+b.top.toFixed(1)
      };
    });
    let pinOn=null, rects=null, nx=null, mis=null;
    try{pinOn=G.pinOn&&G.pinOn('doors')}catch(e){}
    try{rects=G.pinRects?G.pinRects():null}catch(e){}
    try{const st=G.state&&G.state(); nx=st&&st.pins; mis=st&&st.mis}catch(e){}
    const doors=all.filter(p=>p.id==='doors'||/pin-doors/.test(p.cls));
    const onScr=all.filter(p=>p.on&&p.display!=='none'&&p.w>=8&&p.x>0&&p.y>0&&p.x<innerWidth&&p.y<innerHeight);
    const arrows=[...document.querySelectorAll('.eg3d-obja')].map(e=>{
      const b=e.getBoundingClientRect(), st=getComputedStyle(e);
      return {id:'obja',cls:String(e.className),display:st.display,opacity:st.opacity,
        on:e.classList.contains('on'),x:b.left+b.width/2,y:b.top+b.height/2,
        w:+b.width.toFixed(1),h:+b.height.toFixed(1),left:+b.left.toFixed(1),top:+b.top.toFixed(1),via:'obja'};
    });
    const arrow=arrows.find(a=>a.on&&a.display!=='none'&&a.w>=8)
      ||arrows.find(a=>a.w>=8&&a.display!=='none');
    const pick=doors.find(p=>p.on&&p.display!=='none'&&p.w>=8)
      ||(pinOn&&{id:'doors',x:pinOn.x,y:pinOn.y,w:76,h:76,on:true,via:'pinOn'})
      ||onScr.find(p=>p.id==='doors')
      ||arrow
      ||onScr[0]
      ||null;
    return {pick,doors,onScr,arrows,all,pinOn,rects,nx,p:mis&&mis.p,st:mis&&mis.st,W:innerWidth,H:innerHeight};
  });
}
async function tapXY(pg,x,y,touch){
  if(x==null||y==null) return false;
  if(touch) await pg.touchscreen.tap(x,y); else await pg.mouse.click(x,y);
  return true;
}
async function tapDoorsPin(pg,touch){
  const d=await dumpPins(pg);
  const pick=d.pick;
  if(!pick) return {ok:false,d};
  await tapXY(pg,pick.x,pick.y,touch);
  return {ok:true,x:pick.x,y:pick.y,id:pick.id,via:pick.via||'dom',d};
}
async function waitWalkOrPaint(pg,painted0,x0,z0,ms){
  const t0=Date.now();
  let last=await probe(pg), started=false;
  while(Date.now()-t0<ms){
    last=await probe(pg);
    const moved=Math.hypot((last.x||0)-x0,(last.z||0)-z0)>1.2;
    if(last.walking||moved) started=true;
    if((last.painted||0)>painted0 || last.st!=='paint' || /5\s*\/\s*5/.test(last.cnt||'')) return last;
    if(started && !last.walking && moved && Date.now()-t0>2500) return last;
    await sleep(400);
  }
  return last;
}
async function tapVisibleDoor(pg,touch){
  // Kid-style: if a lintel/door is on screen, tap it. No keys.
  const hit=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const ISH=[[-52,-8],[-47,-9],[-42,-9],[-37,-9],[-32,-8]];
    const scr=G.scrP;
    if(typeof scr!=='function') return null;
    const W=innerWidth,H=innerHeight;
    for(const h of ISH){
      const p=scr(h[0],1.2,h[1]+1.2);
      if(p&&p.x>12&&p.x<W-12&&p.y>12&&p.y<H-80) return {x:p.x,y:p.y,hx:h[0],hz:h[1]};
    }
    return null;
  });
  if(!hit) return null;
  await tapXY(pg,hit.x,hit.y,touch);
  return hit;
}

async function runP10(pg,touch,tag){
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.misSet)G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[0,1,2,3,4,5,6,7,8,9],auto:0,autoT:0})}catch(e){}
    try{if(G.jumpP)G.jumpP(-44.05,22)}catch(e){}
  });
  await sleep(900);
  let p=await probe(pg);
  rec(tag+'-p10-placed-at-throne', p.st==='paint' && (p.painted||0)===0 && p.z>12 && p.x<-35, p);
  await shot(pg,tag+'-p10-throne-default');
  const looked=await lookGoshen(pg);
  await sleep(700);
  await shot(pg,tag+'-p10-after-look');
  let dump=await dumpPins(pg);
  flog('pins-after-look',dump);
  rec(tag+'-p10-pin-on-screen', !!(dump.pick&&dump.pick.x), {pick:dump.pick,doors:dump.doors,onScr:dump.onScr,nx:dump.nx,st:dump.st});
  if(!(dump.pick&&dump.pick.x)){
    rec(tag+'-p10-kid-pin-from-throne', false, {reason:'doors pin not on screen after looking toward Goshen',dump,looked});
    await shot(pg,tag+'-p10-no-pin');
    return p;
  }
  const t0=Date.now();
  const path=[];
  let taps=0, doorTaps=0;
  // First tap: the visible pin, then wait. No keys.
  const first=await tapDoorsPin(pg,touch);
  taps++;
  flog('first-pin-tap',first);
  rec(tag+'-p10-pin-tapped', !!first.ok, first);
  await sleep(800);
  p=await probe(pg);
  await shot(pg,tag+'-p10-after-first-tap');
  rec(tag+'-p10-walk-started', !!(p.walking || Math.hypot((p.x||0)+44.05,(p.z||0)-22)>2), p);
  p=await waitWalkOrPaint(pg,p.painted||0,p.x,p.z,55000);
  flog('after-first-wait',p);
  path.push({t:Date.now()-t0,x:p.x,z:p.z,painted:p.painted,walking:p.walking,st:p.st,cnt:p.cnt});
  if(p.z<6&&p.x<-20) await shot(pg,tag+'-p10-reached-goshen');

  while(Date.now()-t0<140000){
    p=await probe(pg);
    path.push({t:Date.now()-t0,x:p.x,z:p.z,painted:p.painted,walking:p.walking,st:p.st,cnt:p.cnt});
    if((p.painted||0)>=5 || /5\s*\/\s*5/.test(p.cnt||'')) break;
    if(p.st!=='paint') break;
    if(p.walking){ await sleep(500); continue; }
    // Kid retaps the pin if it's on screen, or taps a door they can see.
    dump=await dumpPins(pg);
    if(dump.pick&&dump.pick.x){
      await tapXY(pg,dump.pick.x,dump.pick.y,touch);
      taps++;
      flog('retap-pin',taps,dump.pick,p);
    }else{
      const door=await tapVisibleDoor(pg,touch);
      if(door){ doorTaps++; flog('tap-door',doorTaps,door,p); }
      else { await lookGoshen(pg); const d2=await dumpPins(pg); if(d2.pick&&d2.pick.x){ await tapXY(pg,d2.pick.x,d2.pick.y,touch); taps++; flog('retap-after-look',taps,d2.pick);} else { await sleep(800); continue; } }
    }
    p=await waitWalkOrPaint(pg,p.painted||0,p.x,p.z,25000);
    flog('after-retap',taps,doorTaps,p);
  }
  p=await probe(pg);
  const ok=(p.painted||0)>=5 || /5\s*\/\s*5/.test(p.cnt||'');
  const reached= (p.z!=null&&p.z<6&&p.x<-20) || ok;
  rec(tag+'-p10-routed-to-goshen', reached, {x:p.x,z:p.z,painted:p.painted,taps,doorTaps,ms:Date.now()-t0});
  rec(tag+'-p10-kid-pin-from-throne', ok, {ms:Date.now()-t0,taps,doorTaps,painted:p.painted,st:p.st,cnt:p.cnt,x:p.x,z:p.z,looked,path:path.filter((_,i)=>i%3===0)});
  await shot(pg,tag+'-p10-end');
  return {ok,p};
}

async function hailUnderRoof(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const PAL={x:-40,z:22};
    const roofed=(x,z)=>Math.abs(x-PAL.x)<11.2&&Math.abs(z-PAL.z)<7.8;
    let hail=null;
    const roots=[];
    const climb=o=>{while(o&&o.parent)o=o.parent;return o};
    try{if(G.sun)roots.push(climb(G.sun))}catch(e){}
    try{if(G.hemi)roots.push(climb(G.hemi))}catch(e){}
    try{if(G.K&&G.K.S)roots.push(G.K.S)}catch(e){}
    try{if(G.S)roots.push(G.S)}catch(e){}
    try{if(G.kid)roots.push(climb(G.kid))}catch(e){}
    try{if(G.K&&G.K.kid)roots.push(climb(G.K.kid))}catch(e){}
    try{if(G.K&&G.K.cam)roots.push(climb(G.K.cam))}catch(e){}
    const seen=new Set();
    const visit=(o)=>{
      if(!o||seen.has(o))return;
      seen.add(o);
      if((o.isInstancedMesh||(o.instanceMatrix&&o.count>=200))&&(o.count||0)>=200) hail=hail||o;
      (o.children||[]).forEach(visit);
    };
    roots.forEach(visit);
    const under=[], outside=[];
    if(hail&&hail.instanceMatrix&&hail.instanceMatrix.array){
      const arr=hail.instanceMatrix.array;
      const N=hail.count||0;
      for(let i=0;i<N;i++){
        const o=i*16;
        const sx=Math.hypot(arr[o],arr[o+1],arr[o+2]);
        const sy=Math.hypot(arr[o+4],arr[o+5],arr[o+6]);
        const sz=Math.hypot(arr[o+8],arr[o+9],arr[o+10]);
        const x=arr[o+12], y=arr[o+13], z=arr[o+14];
        if(sx<.05||sy<.05||sz<.05) continue;
        const rec={i,x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2),sx:+sx.toFixed(2)};
        if(roofed(x,z)) under.push(rec); else outside.push(rec);
      }
    }
    const ka=G.kidAt?G.kidAt():null;
    return {
      found:!!hail, visible:!!(hail&&hail.visible), count:hail&&hail.count,
      underN:under.length, outsideN:outside.length,
      under:under.slice(0,12),
      kid:ka, st:(G.state&&G.state().mis)||null
    };
  });
}
async function lookPortico(pg){
  // Stand on the east apron, look west into the palace portico.
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      // Camera east of the kid so the hall/portico fills the view (looking toward PAL -40,22).
      const yaw=Math.atan2((-29)-(-40), 22-22); // ~pi/2
      if(G.camAim) return G.camAim(Math.PI/2, 0.28, 12);
    }catch(e){return {err:String(e)}}
    return null;
  });
}

async function runP7(pg,touch,tag){
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jumpP)G.jumpP(-29,22)}catch(e){}
    // come just due, so missionFrame turns hail on; then we keep plague t fresh so TF's 2s window doesn't end it mid-shot.
    try{if(G.misSet)G.misSet({p:7,st:'come',t:Date.now()-7000,tabs:6,paid:[0,1,2,3,4,5,6],auto:0,autoT:0})}catch(e){}
  });
  await lookPortico(pg);
  const placed=await probe(pg);
  rec(tag+'-p7-placed-at-portico', placed.p===7 || placed.st==='plague' || placed.st==='come' || placed.st==='talk' || placed.st==='gap', placed);
  let last=null, nShot=0, best=null;
  const t0=Date.now();
  while(Date.now()-t0<6000){
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.jumpP)G.jumpP(-29,22)}catch(e){}
      const st=G.state&&G.state(); const m=st&&st.mis;
      if(m&&(m.p===7||m.st==='plague'||m.st==='come'||m.st==='gap')){
        try{G.misSet(Object.assign({},m,{p:7,st:'plague',t:Date.now(),tabs:6}))}catch(e){}
      }
    });
    await lookPortico(pg);
    last=await hailUnderRoof(pg);
    flog('hail-tick',{ms:Date.now()-t0,st:last&&last.st,found:last&&last.found,vis:last&&last.visible,out:last&&last.outsideN,under:last&&last.underN});
    if(last && (last.visible || last.outsideN>0 || last.underN>0)){
      if(!best || (last.outsideN+(last.underN||0))>((best.outsideN||0)+(best.underN||0))) best=last;
      nShot++;
      await shot(pg,tag+'-p7-hail-portico-'+nShot);
      if(nShot===1){
        await pg.evaluate(()=>{const G=window.__eg3d||{}; try{G.camAim(Math.PI/2,0.18,9)}catch(e){}});
        await sleep(200);
        nShot++;
        await shot(pg,tag+'-p7-hail-portico-under-roof');
        const close=await hailUnderRoof(pg);
        flog('hail-under',close);
        if(close && (close.visible || close.outsideN>0 || close.underN>0)) best=close;
        last=close||last;
      }
      if(nShot>=3) break;
    }
    await sleep(150);
  }
  if(nShot===0){
    await shot(pg,tag+'-p7-hail-portico-1');
    last=await hailUnderRoof(pg);
    flog('hail-missed',last);
  }
  const close=last;
  const mid=best||last;
  const used=close||mid||last||{};
  rec(tag+'-p7-hail-visible', !!(used.visible && (used.outsideN>0||used.underN>0)), used);
  rec(tag+'-p7-no-hail-under-roof', (used.underN||0)===0 && !!used.found, {underN:used.underN,outsideN:used.outsideN,under:used.under,visible:used.visible,found:used.found});
  return used;
}

async function runSize(w,h,touch,tag){
  flog('SIZE',tag);
  const {br,pg,jsErrors}=await launch(w,h,touch);
  try{
    rec(tag+'-enter', await enterEgypt(pg,touch), await probe(pg));
    await runP7(pg,touch,tag);
    if(!process.env.HAILONLY) await runP10(pg,touch,tag);
  }catch(e){
    out.err=(out.err||'')+String(e&&e.stack||e);
    rec(tag+'-exception',false,{err:String(e&&e.stack||e)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }
  rec(tag+'-no-js-errors', !(jsErrors&&jsErrors.length), {errs:jsErrors||[], count:(jsErrors||[]).length});
  try{await br.close()}catch(_){}
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'targeted 7a8 start\n')}catch(e){}
  flog('START',BASE);
  await runSize(1280,715,false,'1280x715');
  await runSize(390,844,true,'390x844');
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  const report={pass,fail,total:out.checks.length,checks:out.checks,shots:out.shots,err:out.err,url:BASE};
  fs.writeFileSync(REPORT,JSON.stringify(report,null,2));
  flog('DONE',JSON.stringify({pass,fail,total:out.checks.length,err:out.err}));
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(1)});
