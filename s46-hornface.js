/* Local-only stills of the s45 voice-call local proof (cine mid-beat, bakery, gait, occluders): P5 cows, P6 boils, P8 hornist at 1280 and 390.
   testfast + misSet. Points at a local server, never a deploy. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s46-hornface';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s46-hornface-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s46-hornface-report.json';
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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2}}
    }
    return best;
  },sel);
  if(!box)return null;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
}
async function domClick(pg,sel){
  return pg.evaluate(s=>{
    const e=document.querySelector(s);
    if(!e)return false;
    e.click();
    return true;
  },sel);
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
  if(!await clickSel(pg,'a.body.earth',touch)) await domClick(pg,'a.body.earth');
  await sleep(1400);
  if(!await clickSel(pg,'button[data-c="Africa"],.cont.af,[data-c="Africa"]',touch)) {if(!await clickText(pg,'^Africa$',touch)) await domClick(pg,'[data-c="Africa"]');}
  await sleep(1400);
  if(!await clickSel(pg,'[data-env="Sahara"]',touch)) {if(!await clickText(pg,'Ancient Egypt|Sahara',touch)) await domClick(pg,'[data-env="Sahara"]');}
  const ok=await waitG(pg,'eg3d',touch,60000);
  await sleep(600);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(300);
  return ok;
}

async function startPlague(pg,p,x,z){
  return pg.evaluate(({p,x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.resetStaff)G.resetStaff()}catch(e){}
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z);else if(G.jump)G.jump(x,z)}catch(e){}
    try{if(G.misSet)G.misSet({p,st:'plague',t:Date.now(),tabs:p,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
    const K=G.K||G;
    return {ok:true,kid:K.kid&&K.kid.position?[+K.kid.position.x.toFixed(2),+K.kid.position.z.toFixed(2)]:null,mode:G.getMode?G.getMode():(K.getMode&&K.getMode()),hold:!!K.camHold,fxCine:!!K._fxCine,st:(G.state&&G.state().mis&&G.state().mis.st)||null,p:(G.state&&G.state().mis&&G.state().mis.p)||null};
  },{p,x,z});
}

async function capInfo(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{},K=G.K||G,S=(G.__dbg&&G.__dbg().S)||K.S;
    const THREE=K.THREE||window.THREE;
    const bub=[...document.querySelectorAll('.eg3d-bub,.eg3d-cap,.eg3d-say, [class*="bub"]')].map(e=>(e.innerText||e.textContent||'').trim()).filter(Boolean);
    const lines=(bub[0]||'').split(/\n/).filter(Boolean).length;
    let boils=0,horn=0,frogs=0,hornPos=null,hornVis=null,cows=[];
    try{if(S) S.traverse(o=>{
      if(!o.visible)return;
      if(o.userData&&o.userData.boil) boils++;
      if((o.name||'')==='hornist'||(o.name||'')==='ramshorn'){
        horn++;
        try{
          const p=o.getWorldPosition(THREE?new THREE.Vector3():{set(x,y,z){this.x=x;this.y=y;this.z=z}});
          if((o.name||'')==='hornist'){hornPos=[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)];hornVis=!!o.visible}
        }catch(e){}
      }
      if((o.name||'')==='frog') frogs++;
    })}catch(e){}
    try{
      const list=K.ecows||[];
      (list.slice?list.slice(0,3):[]).forEach((c,i)=>{
        const g=c.g||c;
        const p=g&&g.position;
        cows.push({i,vis:!!(g&&g.visible),k:+((c.k||0).toFixed?c.k.toFixed(2):c.k||0),x:p?+p.x.toFixed(2):null,z:p?+p.z.toFixed(2):null,rx:g&&g.rotation?+g.rotation.x.toFixed(2):null});
      });
    }catch(e){}
    const st=G.state&&G.state();
    const mode=G.getMode?G.getMode():(K.getMode&&K.getMode());
    const fc=K._fxCine;
    const dbg=window.__fxDbg||null;
    return {
      dbg,bub:bub[0]||'',bubAll:bub.slice(0,4),lines,boils,horn,frogs,hornPos,hornVis,cows,
      st:st&&st.mis&&st.mis.st,p:st&&st.mis&&st.mis.p,
      hold:!!K.camHold,mode,fxCine:!!fc,fxFlag:fc&&fc.flag,fxLeft:fc?Math.round(fc.until-performance.now()):0,
      dist:K.camS&&+K.camS.dist.toFixed(2),pit:K.camS&&+K.camS.pitch.toFixed(2),yaw:K.camS&&+K.camS.yaw.toFixed(2),
      kid:K.kid&&[+K.kid.position.x.toFixed(2),+K.kid.position.y.toFixed(2),+K.kid.position.z.toFixed(2)]
    };
  });
}



(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  const {br,pg}=await launch(1280,715,false);
  try{
    const ok=await enterEgypt(pg,false);
    flog('entered',ok);
    if(!ok){process.exit(1)}
    await startPlague(pg,8,-16,3);
    for(let i=0;i<50;i++){await sleep(80);const d=await pg.evaluate(()=>window.__fxDbg||null);if(d&&d.hook&&d.mode==='cine'&&d.left>2000)break;}
    const info=await pg.evaluate(()=>{
      const G=window.__eg3d||{},D=G.__dbg&&G.__dbg(),S=D&&D.S,cam=D&&D.cam,THREE=D&&D.THREE;
      let h=null; if(S) S.traverse(o=>{if(!h&&o.name==='hornist')h=o});
      if(!h||!cam) return {err:'no hornist or cam'};
      const hx=h.position.x,hz=h.position.z,hy=h.position.y;
      const cx=cam.position.x,cz=cam.position.z,cy=cam.position.y;
      const faceCam=Math.atan2(cx-hx,cz-hz);
      let nose=null;
      h.traverse(o=>{if(!nose&&o.isMesh&&o.geometry&&o.geometry.type==='ConeGeometry'){const p=o.getWorldPosition(new THREE.Vector3());nose=[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)]}});
      return {ry:+h.rotation.y.toFixed(3),faceCam:+faceCam.toFixed(3),cam:[+cx.toFixed(2),+cy.toFixed(2),+cz.toFixed(2)],hornist:[+hx.toFixed(2),+hy.toFixed(2),+hz.toFixed(2)],nose,yawDbg:(window.__fxDbg||{}).yaw};
    });
    flog('facing',info);
    await shot(pg,'horn-as-is');
    // face the camera (nose toward cam)
    await pg.evaluate(()=>{
      const G=window.__eg3d||{},D=G.__dbg&&G.__dbg(),S=D&&D.S,cam=D&&D.cam;
      let h=null; if(S) S.traverse(o=>{if(!h&&o.name==='hornist')h=o});
      if(!h||!cam)return;
      h.rotation.y=Math.atan2(cam.position.x-h.position.x,cam.position.z-h.position.z);
    });
    await sleep(200);
    await shot(pg,'horn-faceCam');
    // plus PI
    await pg.evaluate(()=>{
      const G=window.__eg3d||{},D=G.__dbg&&G.__dbg(),S=D&&D.S,cam=D&&D.cam;
      let h=null; if(S) S.traverse(o=>{if(!h&&o.name==='hornist')h=o});
      if(!h||!cam)return;
      h.rotation.y=Math.atan2(cam.position.x-h.position.x,cam.position.z-h.position.z)+Math.PI;
    });
    await sleep(200);
    await shot(pg,'horn-faceCam-plusPI');
    // rotation 0, camera stays
    await pg.evaluate(()=>{const G=window.__eg3d||{},D=G.__dbg&&G.__dbg(),S=D&&D.S;let h=null;if(S)S.traverse(o=>{if(!h&&o.name==='hornist')h=o});if(h)h.rotation.y=0});
    await sleep(200);
    await shot(pg,'horn-rot0');
  }finally{try{await br.close()}catch(e){}}
  process.exit(0);
})();
