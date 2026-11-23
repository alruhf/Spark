/* Local-only stills of the s43 cine beats: P5 cows, P6 boils, P8 hornist at 1280 and 390.
   testfast + misSet. Points at a local server, never a deploy. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s43-local-fx';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s43-local-fx-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s43-local-fx-report.json';
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

async function runSize(tag,w,h,touch){
  flog('====',tag,'start',BASE);
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered) return;
    // P1: jump into west shallows (x = RX-RW+0.9), wait until Staff is up, shoot wade, tap, mid-dip, then red
    const p1=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{G.setMode&&G.setMode('walk')}catch(e){}
      const x=32-5.5+0.9,z=14; // ~27.4, inside the 1.35 m shallows clamp (lo=27.85 allows up to there)
      try{if(G.jumpP)G.jumpP(x,z);else if(G.jump)G.jump(x,z)}catch(e){}
      try{if(G.misSet)G.misSet({p:1,st:'act',t:Date.now(),tabs:1,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
      return {ok:true,x,z};
    });
    flog(tag,'p1-setup',p1);
    let p1info=null;
    for(let i=0;i<12;i++){
      await sleep(250);
      p1info=await pg.evaluate(()=>{
        const G=window.__eg3d||{},st=G.state&&G.state();
        const btn=document.querySelector('.eg3d-staffb');
        const swim=st&&st.swim;
        return {mode:G.modeP&&G.modeP(),mis:st&&st.mis,kid:st&&st.kid,swim:swim||null,staffBtn:!!(btn&&btn.getBoundingClientRect().height>8),cam:G.camP&&G.camP()};
      });
      if(p1info&&p1info.staffBtn&&p1info.mode==='staff')break;
    }
    flog(tag,'p1-wade-info',p1info);
    await shot(pg,tag+'-p1-wade');
    rec(tag+'-p1-wade', !!(p1info&&p1info.staffBtn), p1info);
    const staff=await clickSel(pg,'.eg3d-staffb',touch);
    flog(tag,'p1-staff-click',!!staff);
    await sleep(500);
    const dipInfo=await pg.evaluate(()=>{
      const G=window.__eg3d||{},st=G.state&&G.state();
      return {mode:G.modeP&&G.modeP(),mis:st&&st.mis,kid:st&&st.kid};
    });
    flog(tag,'p1-dip-info',dipInfo);
    await shot(pg,tag+'-p1-dip');
    rec(tag+'-p1-dip', !!staff, dipInfo);
    // redT starts at fire (~0.7s + 0.28s after tap); lerp needs a moment to read as red
    await sleep(1800);
    const redInfo=await pg.evaluate(()=>{
      const G=window.__eg3d||{},st=G.state&&G.state();
      let red=null;try{red=G.wU?G.wU.red&&G.wU.red.value:null}catch(e){}
      return {mode:G.modeP&&G.modeP(),mis:st&&st.mis,kid:st&&st.kid,red};
    });
    flog(tag,'p1-red-info',redInfo);
    await shot(pg,tag+'-p1-red');
    rec(tag+'-p1-red', true, redInfo);
    try{await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.resetStaff)G.resetStaff()}catch(e){}try{G.setMode&&G.setMode('walk')}catch(e){}})}catch(e){}
    const beats=[
      {tag:'p5-cows',p:5,x:-14,z:4,wait:1500},
      {tag:'p6-boils',p:6,x:-14,z:4,wait:1500},
      {tag:'p8-hornist',p:8,x:-16,z:3,wait:1500}
    ];
    for(const b of beats){
      const st=await startPlague(pg,b.p,b.x,b.z);
      flog(tag,b.tag,'start',st);
      let dbg=null;
      for(let i=0;i<20;i++){
        await sleep(150);
        dbg=await pg.evaluate(()=>window.__fxDbg||null);
        if(dbg&&dbg.hook&&dbg.left!=null&&dbg.left<3400&&dbg.left>600)break;
      }
      if(dbg&&!(dbg.hook&&dbg.left<3400)) await sleep(Math.max(0,(b.wait||1500)-3000));
      // shot first — capInfo's scene traverse can stall long enough for the cine to end
      await shot(pg,tag+'-'+b.tag);
      const info=await capInfo(pg);
      info._waitDbg=dbg;
      flog(tag,b.tag,'dbg',dbg);
      rec(tag+'-'+b.tag, true, info);
    }

    // ---- bakery / stations / animals / characters ----
    const bake=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.resetStaff)G.resetStaff()}catch(e){}
      try{G.setMode&&G.setMode('walk')}catch(e){}
      const town=G.town&&G.town();
      const doors=(G.homeDoors&&G.homeDoors())||[];
      const bakerDoor=doors.find(d=>Math.hypot((d.x||0)-3,(d.z||0)-19)<4)||null;
      const obj=k=>{try{return G.obj?G.obj(k):null}catch(e){return null}};
      return {bakerDoor,stations:{mill:obj('mill'),oven:obj('oven'),thresh:obj('thresh'),bakery:obj('bakery')},doorsN:doors.length,kid:G.state&&G.state().kid};
    });
    flog(tag,'bake-probe',bake);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(3.5,16.2)}catch(e){try{G.jump(3.5,16.2)}catch(_){}}try{if(G.camAim)G.camAim(0,0.35,11)}catch(e){}});
    await sleep(800);
    await shot(pg,tag+'-bakery-front');
    rec(tag+'-bakery-front', true, bake);

    const door=bake.bakerDoor;
    const bakeEntered=await pg.evaluate(d=>{
      const G=window.__eg3d||{};
      if(!d) return {ok:false};
      try{if(G.enterHome)G.enterHome(d.i);return {ok:true,mode:G.modeP&&G.modeP()}}catch(e){return {ok:false,err:String(e)}}
    },door);
    flog(tag,'bakery-enter',bakeEntered);
    await sleep(700);
    await shot(pg,tag+'-bakery-inside');
    const left=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.leaveHome)G.leaveHome()}catch(e){}
      const st=G.state&&G.state();
      return {mode:G.modeP&&G.modeP(),kid:st&&st.kid,leaveBtn:!!document.querySelector('.eg3d-homeleave'),rot:st&&st.rot};
    });
    flog(tag,'bakery-leave',left);
    await sleep(500);
    await shot(pg,tag+'-bakery-after-leave');
    rec(tag+'-bakery-after-leave', !!(left&&left.kid&&left.mode==='walk'&&!left.leaveBtn), left);

    const dirs=[['away',3.5,13.4],['east',0.4,17.45],['west',6.4,17.45],['behind',3.5,23.5]];
    for(const [name,x,z] of dirs){
      await pg.evaluate(({x,z,kid})=>{
        const G=window.__eg3d||{};
        const k=kid||[3.5,17.45];
        try{G.jumpP(k[0],k[1])}catch(e){try{G.jump(k[0],k[1])}catch(_){}}
        try{if(G.walkTo)G.walkTo(x,z);else if(G.goTo)G.goTo({x,z})}catch(e){}
      },{x,z,kid:left&&left.kid});
      await sleep(2800);
      const end=await pg.evaluate(()=>{const G=window.__eg3d||{},st=G.state&&G.state();return {kid:st&&st.kid,mode:G.modeP&&G.modeP(),inside:!!document.querySelector('.eg3d-homeleave')}});
      flog(tag,'bakery-dir-'+name,end);
      await shot(pg,tag+'-bakery-dir-'+name);
      rec(tag+'-bakery-dir-'+name, !end.inside, end);
    }

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(3.5,16.4)}catch(e){try{G.jump(3.5,16.4)}catch(_){}}});
    await sleep(400);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.goTo)G.goTo({x:3,z:19.1})}catch(e){}});
    await sleep(2200);
    const afterTap=await pg.evaluate(()=>{const G=window.__eg3d||{};return {mode:G.modeP&&G.modeP(),leaveBtn:!!document.querySelector('.eg3d-homeleave'),kid:G.state&&G.state().kid}});
    flog(tag,'bakery-wall-tap',afterTap);
    await shot(pg,tag+'-bakery-wall-tap');
    rec(tag+'-bakery-wall-tap', afterTap.mode==='walk'&&!afterTap.leaveBtn, afterTap);

    const stn=await pg.evaluate(()=>{
      const G=window.__eg3d||{},o=k=>{try{return G.obj?G.obj(k):null}catch(e){return null}};
      return {mill:o('mill'),oven:o('oven'),thresh:o('thresh'),bakery:o('bakery')};
    });
    flog(tag,'stations',stn);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(3.5,14.8)}catch(e){try{G.jump(3.5,14.8)}catch(_){}}try{if(G.camAim)G.camAim(0,0.42,12)}catch(e){}});
    await sleep(700);
    await shot(pg,tag+'-bakery-stations');
    rec(tag+'-bakery-stations', true, stn);

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-6,8)}catch(e){try{G.jump(-6,8)}catch(_){}}try{if(G.camAim)G.camAim(0.4,0.28,8)}catch(e){}});
    await sleep(600);
    for(let i=0;i<4;i++){await shot(pg,tag+'-animals-goats-f'+i);await sleep(180)}
    rec(tag+'-animals-goats', true, {});
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-50,7)}catch(e){try{G.jump(-50,7)}catch(_){}}try{if(G.camAim)G.camAim(1.2,0.25,10)}catch(e){}});
    await sleep(700);
    await shot(pg,tag+'-animals-cattle');
    rec(tag+'-animals-cattle', true, {});

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-6,2)}catch(e){try{G.jump(-6,2)}catch(_){}}try{if(G.camAim)G.camAim(0.2,0.22,8)}catch(e){}});
    await sleep(700);
    await shot(pg,tag+'-chars-town');
    rec(tag+'-chars-town', true, {});
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-40,18)}catch(e){try{G.jump(-40,18)}catch(_){}}try{if(G.camAim)G.camAim(-0.4,0.2,9)}catch(e){}});
    await sleep(800);
    await shot(pg,tag+'-chars-palace');
    rec(tag+'-chars-palace', true, {});
  }finally{

    try{await br.close()}catch(e){}
  }
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'')}catch(e){}
  try{
    for(const [w,h,touch,tag] of [[1280,715,false,'1280'],[390,844,true,'390']]){
      await runSize(tag,w,h,touch);
    }
  }catch(e){out.err=String(e&&e.stack||e);flog('ERR',out.err)}
  out.ended=new Date().toISOString();
  out.pass=out.checks.filter(c=>c.ok).length;
  out.fail=out.checks.filter(c=>c.ok===false).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('REPORT',REPORT,'PASS',out.pass,'FAIL',out.fail);
  process.exit(out.err?1:0);
})();
