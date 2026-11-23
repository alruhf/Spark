/* LOCAL CHECK ONLY (testfast + cineJump allowed here). Not the official proof. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/local-pharaoh';
const LIVE='/tmp/s37pharaoh-local.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};

async function clickSel(pg,sel,touch){
  const box=await pg.evaluate(s=>{
    const els=[...document.querySelectorAll(s)];
    let best=null,area=0;
    for(const e of els){
      const b=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(b.width<8||b.height<8||st.display==='none'||st.visibility==='hidden'||st.opacity==='0'||st.pointerEvents==='none')continue;
      const a=b.width*b.height;
      if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}
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
async function waitG(pg,key,touch,ms=60000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    await skipOverlay(pg,touch);
    const st=await pg.evaluate(k=>{
      const ld=document.querySelector(k==='eg3d'?'.eg3d-load':'.s3d-load');
      const loadOn=!!(ld&&getComputedStyle(ld).opacity!=='0'&&ld.getBoundingClientRect().height>80);
      const g=window['__'+k];
      return {loadOn,has:!!(g&&(g.cam||g.scrP||g.K||g.kid||g.misSet))};
    },key);
    if(st.has&&!st.loadOn) return true;
    await sleep(400);
  }
  return false;
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
    if(!hit) return true;
    if(touch) await pg.touchscreen.tap(hit.x,hit.y); else await pg.mouse.click(hit.x,hit.y);
    await sleep(400);
  }
}

async function enterEgypt(pg,touch){
  await skipOverlay(pg,touch);
  await clickSel(pg,'#homeBtn',touch).catch(()=>{});
  await sleep(400);
  await clickSel(pg,'a.body.earth',touch);
  await sleep(1200);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) await clickText(pg,'^Africa$',touch);
  await sleep(1200);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) await clickText(pg,'Ancient Egypt|Sahara',touch);
  const ok=await waitG(pg,'eg3d',touch,60000);
  await closeMap(pg,touch);
  return ok;
}

async function look(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg?G.__dbg():{};
    const S=dbg.S, THREE=dbg.THREE, cam=dbg.cam;
    const info={pharaoh:0,pharaohInView:0,army:0,armyInView:0,names:[],mode:G.modeP&&G.modeP(),cine:G.cineT&&G.cineT(),cam:G.camP&&G.camP(),foc:null};
    try{info.foc=!!(G.state&&false)}catch(e){}
    try{const st=G.state&&G.state(); if(st) info.mode=st.mode||info.mode}catch(e){}
    const bub=document.querySelector('.eg3d-bub,.eg3d-dlg,.eg3d-narr');
    info.cap=((bub&&bub.textContent)||'').replace(/\s+/g,' ').trim().slice(0,200);
    if(!S||!cam||!THREE) return info;
    const frustum=new THREE.Frustum();
    const m=new THREE.Matrix4();
    cam.updateMatrixWorld();
    frustum.setFromProjectionMatrix(m.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
    const named=o=>{const n=[];let p=o;while(p){if(p.name)n.push(p.name);p=p.parent}return n.join('/')};
    S.traverse(o=>{
      if(!o.visible) return;
      const nm=named(o);
      const isPh=/seaPharaoh/i.test(nm);
      const isAr=/seaArmy/i.test(nm);
      if(!isPh&&!isAr) return;
      if(isPh) info.pharaoh++;
      if(isAr) info.army++;
      if(isPh && info.names.length<12) info.names.push(nm+(o.isMesh?'#mesh':'#grp'));
      if(frustum&&o.isMesh){
        try{
          if(frustum.intersectsObject(o)){
            if(isPh) info.pharaohInView++;
            if(isAr) info.armyInView++;
          }
        }catch(e){}
      }
    });
    try{
      const ph=S.getObjectByName('seaPharaoh');
      if(ph&&cam){
        const p=ph.getWorldPosition(new THREE.Vector3());
        info.phPos=[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)];
        info.camPos=[+cam.position.x.toFixed(2),+cam.position.y.toFixed(2),+cam.position.z.toFixed(2)];
        const d=cam.position.distanceTo(p);
        info.camToPh=+d.toFixed(2);
      }
    }catch(e){info.phErr=String(e)}
    return info;
  });
}

async function runTag(w,h,touch,tag){
  fs.mkdirSync(SHOT,{recursive:true});
  const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
  const pg=await ctx.newPage();
  const url=BASE.replace(/\/$/,'/')+'?fresh=1&testfast=1&r='+Date.now();
  flog(tag,'goto',url);
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  const entered=await enterEgypt(pg,touch);
  flog(tag,'entered',entered);
  if(!entered){await pg.screenshot({path:`${SHOT}/${tag}-fail-enter.png`});await br.close();return {ok:false,reason:'no egypt'};}

  const primed=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{G.misFree&&G.misFree()}catch(e){return {err:'misFree '+e}}
    let cine0=null, mid=null, cine=null, mode=null;
    try{cine0=G.cineT&&G.cineT()}catch(e){}
    try{mid=G.cineJump&&G.cineJump(12.5)}catch(e){return {err:'cineJump sea '+e,cine0}}
    return {cine0,mid,mode:G.modeP&&G.modeP()};
  });
  flog(tag,'sea12.5',primed);
  await sleep(2000); // settle the parted-sea camera, as official skip does
  const jumped=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{return {cine:G.cineJump&&G.cineJump(27.3),mode:G.modeP&&G.modeP()}}catch(e){return {err:String(e)}}
  });
  flog(tag,'jump27.3',jumped);
  let info=null;
  for(let i=0;i<20;i++){
    await sleep(400);
    info=await look(pg);
    flog(tag,'poll',i,'camToPh',info.camToPh,'cine',info.cine);
    if(info.camToPh!=null && info.camToPh<12) break;
  }

  flog(tag,'look@27.3',info);
  const p1=`${SHOT}/${tag}-pharaoh-273.png`;
  await pg.screenshot({path:p1,fullPage:false});
  flog('SHOT',p1);

  const capOk=/Pharaoh'?s army stopped at the water/i.test(info.cap||'');
  const closeOk=(info.camToPh!=null && info.camToPh<12) && (info.pharaohInView||0)>=1;
  flog(tag, closeOk&&capOk?'PASS':'FAIL', {capOk,closeOk,camToPh:info.camToPh,pharaohInView:info.pharaohInView,cap:info.cap,mode:info.mode,cine:info.cine,cam:info.cam});
  const p2=p1;
  await br.close().catch(()=>{});
  return {ok:!!(closeOk&&capOk),info,shots:[p1,p2]};
}

(async()=>{
  fs.writeFileSync(LIVE,'s37 pharaoh local start\n');
  const a=await runTag(1280,715,false,'1280x715');
  const b=await runTag(390,844,true,'390x844');
  const report={a,b};
  fs.writeFileSync('/tmp/s37pharaoh-local-report.json',JSON.stringify(report,null,2));
  flog('DONE',{ok1280:a.ok,ok390:b.ok});
  process.exit(a.ok&&b.ok?0:1);
})().catch(e=>{flog('EXC',e&&e.stack||e);process.exit(2)});
