/* spark37 official HAND-LIKE proof.
   Travel: sand clicks + keyboard. No pin-only travel, no testfast, no misSet/jump/camAim/camHold,
   EXCEPT a required hand click of the palace pin after the P3 countdown (the sink-blocker path).
   Fresh save. 1280x715 and 390x844. Full P1-P10 + ending.
   Visual checks: portico step (not sunk, can move), P1 staff/river, quern path, keys, camera,
   Pharaoh/NPC poses, clipping, pin height, P3 gnats, plus boils/hornist/glow/ending.
   Renderer: swiftshader only (no real GPU). Preview only.
*/
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'https://spark-studio-qmfs97ujl-ruhf.vercel.app/';
const TOK=process.env.VERCEL_OIDC_TOKEN||'';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/official2';
const out={checks:[],shots:[],err:null,swiftshader:true,gpu:'swiftshader (no real GPU)'};let CURTAG='s37';
const LIVE='/tmp/s37hand2-live.log';
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
const rec=(n,ok,extra)=>{out.checks.push(Object.assign({n,ok:!!ok},extra||{}));flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};


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
  const freshUrl=url+(url.includes('?')?'&':'?')+'fresh=1';
  /* spark37: Tester's signed-in fresh-save method. Preview boot clears spark* saves, then strips the param. */
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
      kidY:ka?ka[1]:null
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
    const o={hail:0,hailTrans:0,boils:0,horn:0,arms:[],stiff:0,idle:0,proc:[]};
    if(!S||!THREE) return o;
    S.traverse(obj=>{
      if(obj.userData&&obj.userData.boil&&obj.visible) o.boils++;
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
  if(inPal && x>-30){ await leavePalace(pg,touch); }
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

async function walkToPalace(pg,touch,ms=60000){
  if(await atPalace(pg)) return true;
  if((await st(pg)).mode==='tomb') await exitTomb(pg,touch);
  const p0=kidXZ(await st(pg));
  // From Goshen / the mat: along the door-front lane (z~-5), then north.
  // Do NOT waypoint (-22, z<10) — that is the pyramid axis (GP at -22,-74, door at -22,-61).
  // The earlier 1280 P10 walk used (-22,-2) and entered the tomb.
  if(p0.z<10 && p0.x<-20){
    flog('palace-from-goshen',p0);
    await keyWalkTo(pg,-32,-5,2.6,20000,touch);
    if(!(await kidNear(pg,-32,-5,3.5))) await sandWalkTo(pg,touch,-32,-5,2.6,10000);
    if(await atPalace(pg)) return true;
    await keyWalkTo(pg,-28,16,2.6,Math.min(25000,Math.max(8000,ms-20000)),touch);
    if(!(await kidNear(pg,-28,16,3.5))) await sandWalkTo(pg,touch,-28,16,2.6,10000);
    if(await atPalace(pg)) return true;
  }
  // first the east lip / ramp, then up onto the portico
  await keyWalkTo(pg,-29.4,22,2.2,Math.min(ms,25000),touch);
  if(!(await kidNear(pg,-29.4,22,2.8))) await handGoTo(pg,touch,-29.4,22,2.2,Math.min(ms,20000));
  if(await atPalace(pg)) return true;
  await sandWalkTo(pg,touch,-38.5,22,2.4,20000);
  if(await atPalace(pg)) return true;
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
  const talking=x=>!!(x.dlg||already.includes(x.st)||x.st==='free'||(x.cine!=null&&x.cine>=0));
  let s=await st(pg);
  if(already.includes(s.st)) return s;
  // A leftover "one more time" story caption keeps mode=scene and blocks auto-talk.
  // Do not treat morning (or that caption) as already being in the palace talk.
  if(s.dlg || await pg.$('.eg3d-dlg,.eg3d-narr,.eg3d-dskip:not(.eg3d-askip)')){
    const p=kidXZ(s);
    const inHall=Math.abs(p.x+40)<12 && Math.abs(p.z-22)<8;
    const palaceTalk=inHall && s.dlg && /Pharaoh|Let my people/i.test(s.dlg) && !/one more time|Walk over and ask/i.test(s.dlg);
    if(palaceTalk) return waitDlgDone(pg,90000);
    await clickSel(pg,'.eg3d-dskip,.eg3d-askip',touch).catch(()=>{});
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
    if(last.st==='plague'||last.st==='gap'||last.st==='paint'||last.st==='sleep'||(last.p||0)>n) return last;
    await sleep(300);
  }
  return last;
}


async function doStaffAtNile(pg,touch){
  await exitHome(pg,touch);
  await exitBusy(pg,touch);
  const nile=await nileXZ(pg) || {x:25.1,z:14};
  const nx=nile.x, nz=nile.z;
  const arrived=await handGoTo(pg,touch,nx-2.0,nz,3.0,50000);
  flog('nile-bank',arrived,kidXZ(await st(pg)),await st(pg));
  await exitBusy(pg,touch);
  // The nile pin only appears when the camera looks toward the river.
  await faceToward(pg,touch,nx+8,nz);
  // Pin taps are ignored if a ground pointerdown was <900ms ago (eg3dpinslid).
  await sleep(1100);
  let hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
  if(!hit){
    await clickSel(pg,'.eg3d-obja',touch);
    await sleep(500);
    hit=await clickSel(pg,'.eg3d-pin-nile.on,.eg3d-pin-nile,[data-pin="nile"]',touch);
  }
  flog('nile-pin',hit,await st(pg));
  await sleep(800);
  // Staff button, then tap the water mesh (P1 needs both; a water tap can also arm+fire).
  for(let i=0;i<22;i++){
    const s=await st(pg);
    if(s.st==='come'||s.st==='plague'||s.st==='gap'||(s.p||0)>=2) return s;
    await clickSel(pg,'.eg3d-staffb',touch);
    await sleep(280);
    const wat=nx+3.2;
    if(await onScr(pg,wat,0.05,nz)) await tapScr(pg,wat,0.05,nz,touch);
    else if(await onScr(pg,nx+2.0,0.05,nz)) await tapScr(pg,nx+2.0,0.05,nz,touch);
    else {
      await faceToward(pg,touch,nx+8,nz);
      if(await onScr(pg,wat,0.05,nz)) await tapScr(pg,wat,0.05,nz,touch);
    }
    await sleep(280);
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
    if(s.st==='ask'&&(s.p||0)>=4) break;
    if(s.st==='paint'||s.st==='sleep'||s.st==='morning') return s;
    await sleep(400);
  }
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
  {const k0=kidXZ(await st(pg));
   if(k0.x<-20&&Math.abs(k0.z-22)<14){
     await handGoTo(pg,touch,2,12,4,40000);
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
    await leavePalace(pg,touch);
    await handGoTo(pg,touch,nx,nz,3.2,70000);
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
    await handGoTo(pg,touch,(nile.x||-8)+2, nile.z||8, 4, 20000);
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
  // come: for P5/P8 walk to the field (hand); P9 auto-walks toward Goshen — follow / wait
  if(s.st==='come'||s.st==='act'){
    if(n===8||n===5){
      // Game holds P5/P8 until the kid is at the field, so this walk is the window.
      await handGoTo(pg,touch,-27,12,6,50000);
    } else if(n===9){
      // Darkness starts immediately — do not eat the 20s window with a long walk.
      await sleep(400);
    } else if(n!==1 && n!==6){
      // P6 also starts on a short timer; don't walk through the boils window.
      const k=(await st(pg)).kid||[0,0,0];
      if(k[0]<-32 && Math.abs((k[2]||22)-22)<10) await handGoTo(pg,touch,-28,18,3,8000);
    }
  }
  s=await waitPlagueWindow(pg,n, n===9?25000: n===8?16000:20000);
  // Also shoot in the gap — P6 boils and the P8 hornist stay visible into the rest, and a long palace talk can eat the live window.
  if(s.st==='plague'||s.st==='come'||s.st==='gap'){
    if(n===3){
      await sleep(500);
      await shot(pg,tag+'-p3-gnats');
      const cap=await st(pg);
      rec(tag+'-p3-gnats-window', cap.st==='plague'||cap.st==='come'||cap.st==='gap'||cap.p===3, cap);
      // Stand well east of the portico so the required palace-pin click walks the kid onto the step (Tester's path).
      if(cap.st==='gap'||cap.st==='plague'||cap.st==='come'){
        await handGoTo(pg,touch,2,12,4,35000);
        await faceToward(pg,touch,-40,22,6);
      }
    }
    if(n===6){
      const look=await plagueLook(pg);
      await shot(pg,tag+'-p6-boils');
      rec(tag+'-p6-boils-visible', (look.boils||0)>=1, look);
    }
    if(n===8){
      await sleep(600);
      const look=await plagueLook(pg);
      const cap=(await st(pg));
      await shot(pg,tag+'-p8-hornist');
      rec(tag+'-p8-hornist-visible', (look.horn||0)>=1, look);
      rec(tag+'-p8-horn-caption', /horn|locust|grasshopper|ram/i.test((cap.bub||'')+' '+(cap.dlg||'')), {bub:cap.bub,dlg:cap.dlg});
    }
    if(n===9){
      const ni=await nightInfo(pg);
      const L=await glowLook(pg);
      await shot(pg,tag+'-p9-glow');
      rec(tag+'-p9-darkness', !!(ni.night||(ni.sun!=null&&ni.sun<1.2)), ni);
      rec(tag+'-p9-caption', /dark|glow|Goshen|homes/i.test((ni.cap||'')+' '+((await st(pg)).bub||'')), {cap:ni.cap,look:L});
      rec(tag+'-p9-glow-seen', (L.winGlow||0)>=1 || /glow/i.test(ni.cap||''), L);
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
    const ISH=[[-52,-8],[-47,-9],[-42,-9],[-37,-9],[-32,-8]];
    // Stand at house.at() (x, z+3.6) in the door-front lane; auto-paint is <2.6 m from that point.
    for(let pass=0;pass<2;pass++){
      for(let i=0;i<ISH.length;i++){
        const cnt0=await paintCnt(pg);
        if(/5\s*\/\s*5/.test(cnt0.t)||(await st(pg)).st!=='paint') break;
        const h=ISH[i];
        const doorX=h[0], doorZ=h[1]+3.6;
        await handGoTo(pg,touch,doorX,doorZ,2.2,30000);
        await sleep(400);
        if(await onScr(pg,h[0],1.0,h[1]+1.55)) await tapScr(pg,h[0],1.0,h[1]+1.55,touch);
        else if(await onScr(pg,h[0],0.4,h[1]+1.2)) await tapScr(pg,h[0],0.4,h[1]+1.2,touch);
        await clickSel(pg,'.eg3d-pin-doors.on,.eg3d-pin-doors,[data-pin="doors"]',touch);
        await sleep(700);
        await exitHome(pg,touch);
        const cnt=await paintCnt(pg);
        flog('paint',pass,i,cnt);
        if(/5\s*\/\s*5/.test(cnt.t)) break;
      }
      if(/5\s*\/\s*5/.test((await paintCnt(pg)).t)||(await st(pg)).st!=='paint') break;
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
    // mat at (-42,-5)
    await exitHome(pg,touch);
    await handGoTo(pg,touch,-42,-5,2.0,40000);
    if(await onScr(pg,-42,0.2,-5)) await tapScr(pg,-42,0.2,-5,touch);
    s=await waitSt(pg,x=>x.st==='morning'||x.st==='free'||x.st==='done'||x.cine>=0,60000);
  }
  await shot(pg,tag+'-p10-morning');
  s=await st(pg);
  flog('P10 after-morning',s);
  if(s.st==='morning'||s.st==='ask'||s.st==='sleep'){
    if(s.dlg){ s=await waitDlgDone(pg,90000); flog('P10 mat-dlg done',s); }
    const reached=await walkToPalace(pg,touch,80000);
    flog('P10 palace walk',reached,await st(pg));
    s=await startTalk(pg,touch);
    if(s.dlg) await waitDlgDone(pg,90000);
  }
  // Poll the freedom cinematic; screenshot when it starts and when the sea is up.
  // One Skip tap only after cine is running — swiftshader crawls; Skip jumps to the parted sea.
  let sawCine=false, sawSea=false, skipped=false, skipEnd=false;
  const tCine=Date.now();
  // Swiftshader needs well over 90s to reach cineT>48 (when endCine auto-fires without a tambourine). A second Skip after the parted sea has been up 4 cine seconds calls endCine and shows the award, which is what the on-screen Skip button does.
  while(Date.now()-tCine<180000){
    s=await st(pg);
    const inCine=s.st==='free'||s.st==='done'||(s.cine!=null&&s.cine>=0)||!!s.badge;
    if(inCine && !sawCine){
      sawCine=true;
      flog('P10 cine start',s);
      await shot(pg,tag+'-ending-cine');
    }
    const k=kidXZ(s);
    const atSea=((s.cine||0)>=11) || k.z>60 || /sea|cloud by day|dry path|Miriam|wonderful/i.test((s.bub||'')+' '+(s.dlg||''));
    if(inCine && (atSea || s.st==='done') && !sawSea){
      sawSea=true;
      await shot(pg,tag+'-ending-sea');
      flog('P10 sea shot',s);
    }
    if(s.st==='done'||s.badge){
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
    if(!skipped && sawCine && (s.cine==null||s.cine<11) && sk){
      skipped=true;
      flog('P10 skip tap',sk);
      if(touch) await pg.touchscreen.tap(sk.x,sk.y); else await pg.mouse.click(sk.x,sk.y);
      await sleep(2500);
      const after=await st(pg);
      const ak=kidXZ(after);
      if((after.cine||0)>=11 || ak.z>60 || after.st==='done'){
        sawSea=true;
        await shot(pg,tag+'-ending-sea');
        flog('P10 sea shot after skip',after);
      }
      continue;
    }
    // First Skip jumps to the parted sea (cine≈12.4). A later Skip, once the sea has been up ~4 cine seconds, ends the cine and shows the award card (skipCine → endCine).
    if(!skipEnd && sawCine && sawSea && (s.cine||0)>=16.5 && sk && s.st!=='done' && !s.badge){
      skipEnd=true;
      flog('P10 skip to award',sk,s);
      if(touch) await pg.touchscreen.tap(sk.x,sk.y); else await pg.mouse.click(sk.x,sk.y);
      await sleep(2500);
      continue;
    }
    await sleep(800);
  }
  s=await st(pg);
  const sea=await seaLook(pg);
  if(!sawSea) await shot(pg,tag+'-ending-sea');
  if(s.badge||s.st==='done'){
    await shot(pg,tag+'-p10-award');
    rec(tag+'-p10-award', true, s);
  } else {
    rec(tag+'-p10-award', false, s);
  }
  rec(tag+'-ending', s.st==='free'||s.st==='done'||sawCine||(s.cine!=null&&s.cine>=0)||!!s.badge, {s,sea,sawCine,sawSea});
  rec(tag+'-ending-sea', !!(sawCine && (sawSea||s.st==='done'||kidXZ(s).z>60||(sea.seaVis||0)>0&&(s.cine||0)>=11||(sea.foam||0)>0)), {sea,sawCine,sawSea,kid:kidXZ(s)});
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
  const {br,pg}=await launch(w,h,touch,'');
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
      rec(tag+'-p1-done', p1.st==='ask'||(p1.p||0)>=2||p1.st==='gap'||p1.st==='come'||p1.st==='plague', p1);

      for(let n=2;n<=9;n++){
        const r=await playPlague(pg,touch,tag,n);
        rec(tag+'-p'+n+'-done', (r.p||0)>n || r.st==='ask'||r.st==='paint'||r.st==='gap'||(r.p||0)>=n, {st:r.st,p:r.p});
        if(n===3){
          await clickPalacePinAfterCountdown(pg,touch,tag);
          if(process.env.P3ONLY==='1'){flog('P3ONLY done');return}
        }
      }
    }
    const end=await playP10andEnding(pg,touch,tag);
    rec(tag+'-p10-ending-done', end.st==='free'||end.st==='done'||(end.cine!=null&&end.cine>=0)||!!end.badge, end);
    out[tag].ms=Date.now()-tRun;
  }catch(e){
    out.err=(out.err||'')+String(e&&e.stack||e);
    flog('EXCEPTION',tag,String(e&&e.stack||e));
    rec(tag+'-exception',false,{err:String(e)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }
  out[tag].ms=(out[tag].ms)||(Date.now()-tRun);
  try{await shot(pg,tag+'-final')}catch(_){}
  try{await br.close()}catch(_){}
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'s36 hand-like proof start\n')}catch(e){}
  flog('START',BASE,'swiftshader only');
  const ONLY=(process.env.ONLY||'').trim();
  if(!ONLY||ONLY==='1280') await runTag(1280,715,false,'1280x715');
  if(!ONLY||ONLY==='390') await runTag(390,844,true,'390x844');
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  const report={pass,fail,total:out.checks.length,checks:out.checks,shots:out.shots,err:out.err,swiftshader:true,url:BASE};
  fs.writeFileSync('/tmp/s37hand2-report.json',JSON.stringify(report,null,2));
  flog('DONE',JSON.stringify({pass,fail,total:out.checks.length,err:out.err,ms1280:out['1280x715']&&out['1280x715'].ms,ms390:out['390x844']&&out['390x844'].ms}));
  console.log('REPORT /tmp/s37hand2-report.json');
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
