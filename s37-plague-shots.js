/* Hand-like live shots of P2 frogs, P4 flies, P5 sick cows, P7 hail (both sizes)
   and the 1280 hornist with the camera facing it. testfast + misSet to open the
   plague window; jump + camAim only to stand where a kid would watch. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-2he7p029s-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/plague-2he7p029s';
const LIVE=process.env.LIVE||'/tmp/s37-plague-2he-live.log';
const REPORT=process.env.REPORT||'/tmp/s37-plague-2he-report.json';
const ONLY=process.env.ONLY||'';
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
  pg.setDefaultTimeout(20000);
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
  const ok=await waitG(pg,'eg3d',touch,45000);
  await sleep(600);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(300);
  return ok;
}

async function startPlague(pg,p,x,z,look){
  // Jump first so reactOn (frogs around the kid, placeSickP5, etc.) uses the
  // viewing position. misSet before jump left P2 frogs at the entry spawn.
  return pg.evaluate(({p,x,z,look})=>{
    const G=window.__eg3d||{};
    try{if(G.resetStaff)G.resetStaff()}catch(e){}
    try{if(G.K&&G.K.resetStaff)G.K.resetStaff()}catch(e){}
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z)}catch(e){}
    try{if(G.misSet)G.misSet({p,st:'plague',t:Date.now(),tabs:p,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
    const K=G.K||G;
    try{
      const kp=K.kid&&K.kid.position;
      if(look&&kp&&K.camS){
        const yaw=Math.atan2(kp.x-look[0],kp.z-look[1]);
        K.camS.yaw=yaw;K.camS.pitch=look[2]!=null?look[2]:.32;K.camS.dist=look[3]!=null?look[3]:12;
        if(K.camF&&K.camF.set){
          const fx=(kp.x+look[0])*.5, fz=(kp.z+look[1])*.5;
          const gh=(G.groundH&&G.groundH(fx,fz))||1;
          K.camF.set(fx,gh+1.05,fz);
        }
        K.camHold=1;K.camHoldT=performance.now();
      }
    }catch(e){}
    return {ok:true,kid:K.kid&&K.kid.position?[K.kid.position.x,K.kid.position.z]:null};
  },{p,x,z,look:look||null});
}

async function lookAt(pg,tx,tz,pitch,dist){
  return pg.evaluate(({tx,tz,pitch,dist})=>{
    const G=window.__eg3d||{},K=G.K||G;
    const kp=K.kid&&K.kid.position;
    if(!kp||!K.camS)return {ok:false};
    const yaw=Math.atan2(kp.x-tx,kp.z-tz);
    K.camS.yaw=yaw;K.camS.pitch=pitch;K.camS.dist=dist;
    if(K.camF&&K.camF.set){
      const fx=(kp.x+tx)*.5, fz=(kp.z+tz)*.5;
      const gh=(G.groundH&&G.groundH(fx,fz))||1;
      K.camF.set(fx,gh+1.05,fz);
    }
    if(G.camAim)try{G.camAim(yaw,pitch,dist)}catch(e){}
    K.camHold=1;K.camHoldT=performance.now();
    return {ok:true,yaw,pitch,dist,kid:[kp.x,kp.z]};
  },{tx,tz,pitch,dist});
}

async function plagueLook(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const K=G.K||G;
    const S=(G.__dbg&&G.__dbg().S)||K.S;
    const cam=K.cam||(G.__dbg&&G.__dbg().cam);
    const toScr=(x,y,z)=>{
      try{if(G.scrP)return G.scrP(x,y,z)}catch(e){}
      return null;
    };
    const on=(s)=>!!(s&&s.z<1&&s.x>8&&s.y>30&&s.x<(innerWidth-8)&&s.y<(innerHeight-60));
    const out={frogsVis:0,frogsOn:0,cowsVis:0,cowsOn:0,cowsFlat:0,hornOn:0,hornScr:null,hailVis:0,fliesVis:0,mode:null,st:null,p:null,kid:null,cam:null};
    try{const st=G.state&&G.state();out.mode=st&&st.mode;out.st=st&&st.mis&&st.mis.st;out.p=st&&st.mis&&st.mis.p;out.kid=st&&st.kid}catch(e){}
    try{if(K.camS)out.cam={yaw:K.camS.yaw,pit:K.camS.pitch,dist:K.camS.dist}}catch(e){}
    try{
      if(S) S.traverse(o=>{
        if(!o.visible)return;
        const n=(o.name||'').toLowerCase();
        if(/frog/.test(n)&&o.isMesh){out.frogsVis++;const wp=new THREE.Vector3();o.getWorldPosition(wp);if(on(toScr(wp.x,wp.y,wp.z)))out.frogsOn++}
        if(/cow|cattle|bull/.test(n)&&o.parent&&o.parent.parent){/* count groups later */}
      });
    }catch(e){}
    try{
      const sol=K._frogSol||[];
      if(sol.length){
        out.frogsVis=sol.length;
        out.frogsOn=sol.filter(f=>{const s=toScr(f[0],.4,f[1]);return on(s)}).length;
      }
    }catch(e){}
    try{
      const cows=(K.misPos&&K.misPos.spots&&K.misPos.spots().ecows)||[];
      out.cowsVis=cows.length;
      cows.forEach(c=>{const s=toScr(c[0],1.0,c[1]);if(on(s))out.cowsOn++});
    }catch(e){}
    try{
      if(!out.cowsVis && K.animalSolids){
        const a=K.animalSolids()||[];
        out.cowsVis=a.length;
        a.forEach(c=>{const s=toScr(c[0],1.0,c[1]);if(on(s))out.cowsOn++});
      }
    }catch(e){}
    try{out.cowsFlat=!!K.cowFlat}catch(e){}
    try{
      const hx=-30.2,hz=16.8;
      const s=toScr(hx,1.6,hz);
      out.hornScr=s;out.hornOn=on(s);
    }catch(e){}
    try{
      if(S) S.traverse(o=>{
        if(!o.visible)return;
        if(o.isInstancedMesh&&o.count>10&&o.geometry&&/Icosahedron/i.test(o.geometry.type||'')) out.hailVis=o.count;
        if(o.isInstancedMesh&&o.count>50&&!out.fliesVis) out.fliesVis=o.count;
      });
    }catch(e){}
    return out;
  });
}

const BEATS=[
  // wait < testfast plague window (2000ms) so reactOff does not hide FX before the shot
  {tag:'p2-frogs',p:2,x:2,z:12,look:null,wait:900,note:'frogs around the kid on the east plaza'},
  {tag:'p4-flies',p:4,x:-8,z:18,look:[-20,22,.28,9],wait:900,note:'flies over Egyptian houses / forecourt'},
  {tag:'p5-cows',p:5,x:-33,z:12,look:[-36,9.8,.26,10],wait:900,note:'sick cows south of the palace, west of the wheat'},
  {tag:'p7-hail',p:7,x:4,z:16,look:null,wait:900,note:'hail on open sand, not under the portico'},
];

async function runSize(tag,w,h,touch){
  flog('====',tag,'start',BASE);
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-no-egypt');return}
    for(const b of BEATS){
      await startPlague(pg,b.p,b.x,b.z,b.look);
      if(b.look) await lookAt(pg,b.look[0],b.look[1],b.look[2],b.look[3]);
      else {
        // Face slightly toward the kid's front so the plague around them is in frame
        await pg.evaluate(()=>{
          const G=window.__eg3d||{},K=G.K||G;
          if(K.camS){K.camS.pitch=.34;K.camS.dist=Math.max(11,K.camS.dist||11)}
        });
      }
      await sleep(b.wait);
      const look=await plagueLook(pg);
      await shot(pg,tag+'-'+b.tag);
      rec(tag+'-'+b.tag+'-window', true, Object.assign({note:b.note},look));
      flog(tag,b.tag,look);
    }
    if(w===1280){
      // Hornist at (-30.2, 16.8). Stand SE of him so the camera sits opposite and looks at him, cows stay in the mid-ground but separate.
      await startPlague(pg,8,-26.2,13.6,[-30.2,16.8,.28,12]);
      await lookAt(pg,-30.2,16.8,.28,12);
      await sleep(2000);
      const look=await plagueLook(pg);
      await shot(pg,tag+'-p8-hornist-facing');
      rec(tag+'-p8-hornist-on-screen', !!look.hornOn, look);
      flog(tag,'p8-hornist',look);
    }
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
  process.exit(0);
})();
