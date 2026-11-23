/* Reproduce the palace-step treadmill on qozocmbub BEFORE any fix.
   Hand-like approaches: palace pin + sand/tile clicks. No arrow-key rescues.
   testfast+misSet+jumpP are used only to place the kid at start points and
   to stand after each countdown P1–P9. The walk onto the step is pin or tile.
*/
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-qozocmbub-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/step-repro-qozocmbub';
const LIVE=process.env.LIVE||'/tmp/s37step-repro-live.log';
const REPORT=process.env.REPORT||'/tmp/s37step-repro-report.json';
const PROGRESS='/workspace/p32work/spark37/PROGRESS.md';
const out={checks:[],shots:[],approaches:[],probe:null,err:null,url:BASE};
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
function logProgress(title,body){
  const d=new Date();
  const h=d.getHours()%12||12,m=String(d.getMinutes()).padStart(2,'0'),ap=d.getHours()>=12?'PM':'AM';
  const block='\n## '+h+':'+m+' '+ap+' ET — '+title+'\n\n'+(body?body.trim()+'\n\n':'');
  try{fs.appendFileSync(PROGRESS,block)}catch(e){}
  flog('PROGRESS',title);
}
const rec=(n,ok,extra)=>{out.checks.push(Object.assign({n,ok:!!ok},extra||{}));flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};
async function shot(pg,n){fs.mkdirSync(SHOT,{recursive:true});const p=`${SHOT}/${n}.png`;await pg.screenshot({path:p});out.shots.push(p);flog('SHOT',p);return p}

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
      return {x:b.left+b.width/2,y:b.top+b.height/2,t}}
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
  const freshUrl=url+(url.includes('?')?'&':'?')+'fresh=1';
  await pg.goto(freshUrl,{waitUntil:'load',timeout:90000});
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
async function enterEgypt(pg,touch){
  await goEarth(pg,touch);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) await clickText(pg,'^Africa$',touch);
  await sleep(1200);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) await clickText(pg,'Ancient Egypt|Sahara',touch);
  const ok=await waitG(pg,'eg3d',touch,45000);
  await sleep(800);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(400);
  return ok;
}

async function kidState(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let st=null,mis=null;
    try{st=G.state?G.state():null}catch(e){}
    try{mis=G.misProbe?G.misProbe():(st&&st.mis)}catch(e){}
    const kid=st&&st.kid?st.kid:null;
    const x=kid?kid[0]:null,z=kid?+kid[2]||+kid[1]:null,y=kid&&kid.length>2?+kid[1]:null;
    // state.kid is [x,z] or [x,y,z]? hook said kid:[+kid.position.x,+kid.position.z]
    const kx=kid?+kid[0]:null, kz=kid?+kid[1]:null;
    let y2=null,lift=null,gh=null,pathN=0,goal=null,mode=st&&st.mode,inSolid=null;
    try{
      const dbg=G.__dbg?G.__dbg():{};
      const p=dbg.ground||null;
    }catch(e){}
    try{if(G.gap){}}catch(e){}
    try{
      // prefer live mesh
      const d=G.__dbg?G.__dbg():null;
    }catch(e){}
    return {kx,kz,y,mode,mis,pins:st&&st.pins,pathHint:null};
  });
}

async function liveKid(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const st=G.state?G.state():{};
    const kid=st.kid||[];
    const kx=+kid[0], kz=+kid[1];
    let y=null,lift=null,gh=null,inSolid=null,pal=null,unclipD=null;
    try{
      const dbg=G.__dbg&&G.__dbg();
      const THREE=dbg&&dbg.THREE;
      // jumpP/camP exist; try misPos and palProbe
      pal=G.palProbe?G.palProbe():null;
    }catch(e){}
    try{inSolid=G.inSolid?G.inSolid(kx,kz):null}catch(e){}
    let pathN=0,goal=null,kb=false;
    try{
      const d=JSON.stringify(st).slice(0,200);
    }catch(e){}
    // walk path isn't always on state; watch position only
    return {kx,kz,mode:st.mode,mis:st.mis||null,pins:st.pins||[],inSolid,pal,fps:st.fps};
  });
}

async function place(pg,x,z,yaw){
  await pg.evaluate(({x,z,yaw})=>{
    const G=window.__eg3d||{};
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
    try{if(G.camAim)G.camAim(yaw!=null?yaw:Math.atan2(x-(-40),z-22),.28,14)}catch(e){}
  },{x,z,yaw});
  await sleep(300);
}

async function facePalace(pg){
  await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const st=G.state?G.state():{};
    const kx=st.kid?st.kid[0]:-20, kz=st.kid?st.kid[1]:22;
    try{if(G.camAim)G.camAim(Math.atan2(kx-(-40),kz-22),.28,Math.max(12, (G.state&&0)||14))}catch(e){}
  });
  await sleep(250);
}

async function clickPalacePin(pg,touch){
  await facePalace(pg);
  let hit=await clickSel(pg,'.eg3d-pin-pal.on,.eg3d-pin-pal,[data-pin="palace"].on,[data-pin="palace"]',touch);
  if(hit) return 'pin';
  const box=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    let rects=null;
    try{rects=G.pinRects?G.pinRects():null}catch(e){}
    if(rects&&rects.length){
      const p=rects.find(r=>r.id==='palace')||rects.find(r=>/pal/i.test(r.id||''));
      if(p&&p.x>0&&p.y>0) return {x:p.x,y:p.y};
    }
    return null;
  });
  if(box){if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);return 'pinRects'}
  return false;
}

async function tileClickWorld(pg,x,z,touch){
  const box=await pg.evaluate(({x,z})=>{
    const G=window.__eg3d||{};
    let p=null;
    try{if(G.scrP)p=G.scrP(x,null,z)}catch(e){try{p=G.scrP(x,0,z)}catch(e2){}}
    if(p&&p.x>8&&p.x<innerWidth-8&&p.y>8&&p.y<innerHeight-8) return {x:p.x,y:p.y,on:true};
    return {on:false};
  },{x,z});
  if(!box.on) return false;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return true;
}

function inLip(k){
  if(!k||k.kx==null) return false;
  return k.kx>-33.2&&k.kx<-26.2&&k.kz>14.2&&k.kz<30;
}
function inHall(k){
  if(!k||k.kx==null) return false;
  return k.kx<=-32.0&&Math.abs(k.kz-22)<7.6;
}

async function watchApproach(pg,name,ms){
  const t0=Date.now();
  const trail=[];
  let stallMs=0,stallAt=null,maxYDip=0,baseY=null;
  let last=await liveKid(pg);
  let lastMoveT=Date.now();
  let lastPos={x:last.kx,z:last.kz};
  let entered=false, leftLipIntoHall=false, hitLip=false;
  trail.push(Object.assign({t:0},last));
  while(Date.now()-t0<ms){
    await sleep(250);
    const k=await liveKid(pg);
    const t=Date.now()-t0;
    if(inLip(k)) hitLip=true;
    if(inHall(k)) {entered=true; if(hitLip) leftLipIntoHall=true;}
    const d=Math.hypot((k.kx-lastPos.x)||0,(k.kz-lastPos.z)||0);
    if(d>0.18){lastMoveT=Date.now();lastPos={x:k.kx,z:k.kz};}
    const frozen=Date.now()-lastMoveT;
    // stall = on/near the lip, almost no xz progress for >=3s, and not already in the hall
    if(hitLip && !inHall(k) && frozen>=3000 && (inLip(k) || (lastPos.x>-34 && lastPos.x<-25))){
      stallMs=frozen;
      if(!stallAt) stallAt={t,kx:k.kx,kz:k.kz,frozen};
    }
    if(t- (trail[trail.length-1].t||0) >= 800) trail.push(Object.assign({t},k));
    last=k;
    if(entered && t>2000) break; // made it in
    // if reached STAND-ish
    if(k.kx!=null && Math.hypot(k.kx-(-39.2),k.kz-22)<3) {entered=true;break;}
  }
  const end=await liveKid(pg);
  const dt=Date.now()-t0;
  const start=trail[0];
  const travel=start&&end?Math.hypot(end.kx-start.kx,end.kz-start.kz):0;
  const stalled=!!stallAt && !entered && stallMs>=3000;
  const rec={name,ms:dt,start,end,travel:+travel.toFixed(2),hitLip,entered,leftLipIntoHall,stalled,stallMs,stallAt,trail:trail.slice(0,24)};
  out.approaches.push(rec);
  flog('APPROACH',name,JSON.stringify({ms:dt,travel,hitLip,entered,stalled,stallMs,stallAt,end}));
  return rec;
}

async function physicsProbe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const PAL={x:-40,z:22};
    const samples=[];
    const wanted=[];
    // grid across sand, lip, step top, threshold, hall
    for(let x=-26;x>=-34;x-=0.4){
      for(const z of [22,20,24,18.5,25.5,16,13.5,28]){
        wanted.push([+x.toFixed(2),+z.toFixed(2)]);
      }
    }
    const orig=G.state().kid;
    const ox=orig[0], oz=orig[1];
    for(const [x,z] of wanted){
      try{G.jumpP(x,z)}catch(e){}
      const st=G.state().kid;
      const ax=+st[0].toFixed(3), az=+st[1].toFixed(3);
      const dx=ax-x, dz=az-z, d=Math.hypot(dx,dz);
      let ins=null;
      try{ins=G.inSolid?G.inSolid(x,z):null}catch(e){}
      let insA=null;
      try{insA=G.inSolid?G.inSolid(ax,az):null}catch(e){}
      if(d>0.12 || ins || x<-27.9&&x>-32.2){
        samples.push({want:[x,z],got:[ax,az],d:+d.toFixed(3),push:[+dx.toFixed(3),+dz.toFixed(3)],ins,insA});
      }
    }
    try{G.jumpP(ox,oz)}catch(e){}
    // also query pal solids / roof if exposed
    let pal=null,roof=null,solids=null;
    try{pal=G.palProbe?G.palProbe():null}catch(e){}
    try{roof=G.palRoofProbe?G.palRoofProbe():null}catch(e){}
    try{solids=G.pplSolids?G.pplSolids():null}catch(e){}
    const pushed=samples.filter(s=>s.d>0.25);
    return {n:wanted.length, pushedN:pushed.length, pushed:pushed.slice(0,40), interesting:samples.filter(s=>s.d>0.12||s.ins).slice(0,60), pal, roof, orig:[ox,oz]};
  });
}

async function ensureAsk(pg,p){
  await pg.evaluate(p=>{
    const G=window.__eg3d||{};
    try{if(G.misSet)G.misSet({p,st:'ask',t:Date.now()})}catch(e){}
    try{if(G.misFree)G.misFree()}catch(e){}
  },p);
  await sleep(200);
  // skip any leftover dialog
  for(let i=0;i<4;i++){if(!await clickSel(pg,'.eg3d-dskip',false)) break; await sleep(200)}
}

(async()=>{
  try{
    fs.mkdirSync(SHOT,{recursive:true});
    flog('START',new Date().toISOString(),BASE);
    logProgress('qozocmbub step-stall reproduction started','BASE '+BASE+' shots '+SHOT);
    const {br,pg}=await launch(1280,715,false,'testfast=1');
    const entered=await enterEgypt(pg,false);
    rec('entered-egypt',entered,{});
    if(!entered) throw new Error('failed to enter Egypt');
    await sleep(1500);
    await skipOverlay(pg,false);
    for(let i=0;i<6;i++){await clickSel(pg,'.eg3d-dskip',false);await sleep(200)}

    // Physics probe first (jumpP samples; diagnosis only)
    flog('PROBE begin');
    out.probe=await physicsProbe(pg);
    flog('PROBE',JSON.stringify({n:out.probe.n,pushedN:out.probe.pushedN,pal:out.probe.pal,roof:out.probe.roof,pushed:out.probe.pushed.slice(0,15)}));
    rec('probe-push-on-step', out.probe.pushedN>0, {pushedN:out.probe.pushedN, sample:out.probe.pushed[0]||null});
    await shot(pg,'probe-restore');

    const starts=[
      {name:'pin-from-east', x:-20, z:22, via:'pin'},
      {name:'pin-from-se', x:-20, z:12, via:'pin'},
      {name:'pin-from-ne', x:-20, z:32, via:'pin'},
      {name:'pin-from-goshen-south', x:-42, z:-5, via:'pin'},
      {name:'pin-from-north', x:-28, z:40, via:'pin'},
      {name:'tile-from-sand-east', x:-22, z:22, via:'tile', taps:[[-29.2,22],[-36,22]]},
      {name:'tile-from-se-onto-step', x:-22, z:16, via:'tile', taps:[[-29.2,20],[-36,22]]},
    ];

    async function runOne(spec, tag){
      await ensureAsk(pg, spec.p||1);
      await place(pg, spec.x, spec.z);
      await facePalace(pg);
      await sleep(200);
      await shot(pg, tag+'-start');
      let how=spec.via;
      if(spec.via==='pin'){
        const c=await clickPalacePin(pg,false);
        rec(tag+'-pin-clicked', !!c, {how:c});
        how=c||'pin-miss';
        if(!c){
          // one more try after a sand click toward the palace so the pin comes on-screen
          await tileClickWorld(pg, (spec.x-40)/2, (spec.z+22)/2, false);
          await sleep(2500);
          const c2=await clickPalacePin(pg,false);
          rec(tag+'-pin-retry', !!c2, {how:c2});
          how=c2||how;
        }
      }else{
        for(const [tx,tz] of (spec.taps||[])){
          const ok=await tileClickWorld(pg,tx,tz,false);
          rec(tag+'-tile-'+tx+','+tz, ok, {});
          await sleep(400);
        }
      }
      const r=await watchApproach(pg, tag, spec.wait||22000);
      await shot(pg, tag+(r.stalled?'-STALL':(r.entered?'-in':'-end')));
      rec(tag+'-stalled', r.stalled, {entered:r.entered,hitLip:r.hitLip,stallMs:r.stallMs,stallAt:r.stallAt,end:r.end,travel:r.travel,how});
      return r;
    }

    for(const spec of starts){
      await runOne(spec, spec.name);
    }

    // After every countdown P1–P9: stand in ask (post-gap), typical return spots, palace pin
    const afterStarts=[
      {x:-22,z:22,label:'east-sand'},
      {x:-42,z:-5,label:'goshen'}, // P9 glow plant
    ];
    for(let p=1;p<=9;p++){
      const sp=p===9?afterStarts[1]:afterStarts[0];
      const r=await runOne({name:'after-P'+p, x:sp.x, z:sp.z, via:'pin', p, wait:22000}, 'after-P'+p+'-from-'+sp.label);
    }

    const stalls=out.approaches.filter(a=>a.stalled);
    const enteredN=out.approaches.filter(a=>a.entered).length;
    flog('SUMMARY',JSON.stringify({n:out.approaches.length,stalls:stalls.length,entered:enteredN,names:stalls.map(s=>s.name)}));
    rec('stall-reproduced', stalls.length>0, {stalls:stalls.length, of:out.approaches.length, names:stalls.map(s=>s.name), entered:enteredN});
    logProgress('qozocmbub step-stall repro result',
      'Approaches '+out.approaches.length+', stalls '+stalls.length+', entered hall '+enteredN+'.\n'+
      (stalls.length?('STALLS: '+stalls.map(s=>s.name+' @ '+(s.stallAt&&JSON.stringify(s.stallAt))).join('; ')):('No stall captured this pass (intermittent?). Probe pushedN='+(out.probe&&out.probe.pushedN)))+
      '\nShots '+SHOT
    );

    fs.writeFileSync(REPORT, JSON.stringify(out,null,2));
    flog('WROTE',REPORT);
    await br.close();
  }catch(e){
    out.err=String(e&&e.stack||e);
    flog('ERROR',out.err);
    try{fs.writeFileSync(REPORT,JSON.stringify(out,null,2))}catch(e2){}
    try{logProgress('qozocmbub step-stall repro ERROR', out.err.slice(0,800))}catch(e3){}
    process.exitCode=1;
  }
})();
