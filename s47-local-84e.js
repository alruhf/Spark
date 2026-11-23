/* Local-only Tester-8.4 stills + click-only pin/shake checks at 1280 and 390.
   Points at the local spark37 server. testfast + misSet/cineJump only to reach
   later beats. No deploy. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s47-local-84e';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s47-local-84e-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s47-local-84e-report.json';

const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString(),sizes:[]};
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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,cls:String(e.className||'')}}
    }
    return best;
  },sel);
  if(!box)return null;
  if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y);
  return box;
}
async function domClick(pg,sel){
  return pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true},sel);
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
async function dismissLeave(pg,touch){
  const stay=await pg.evaluate(()=>{
    const els=[...document.querySelectorAll('button,.eg3d-stay,[data-stay]')];
    for(const e of els){
      if(!/^\s*Stay\s*$/i.test((e.textContent||'').trim()))continue;
      const r=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(r.width<8||st.display==='none'||st.visibility==='hidden')continue;
      return {x:r.left+r.width/2,y:r.top+r.height/2};
    }
    return null;
  });
  if(stay){if(touch) await pg.touchscreen.tap(stay.x,stay.y); else await pg.mouse.click(stay.x,stay.y);await sleep(400);return true}
  return false;
}
async function skipOverlay(pg,touch){
  await dismissLeave(pg,touch);
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
  const jsErrors=[];
  pg.on('pageerror', e=>{const s=String(e&&e.stack||e);jsErrors.push(s);flog('PAGEERROR',s)});
  const join=BASE.includes('?')?'&':'?';
  const url=BASE.replace(/\/$/,'/')+join+'fresh=1&testfast=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.setItem('sparkTestfast','1');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  pg._jsErrors=jsErrors;
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
  await sleep(400);
  await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
  await sleep(200);
  return ok;
}


async function toWalk(pg,touch){
  await dismissLeave(pg,touch);
  const mode=await pg.evaluate(()=>{const G=window.__eg3d||{};return G.modeP?G.modeP():null});
  /* s47c: only leave staff/home/shaduf. Back during the ending confirms Leave Egypt and covers the stills. */
  if(mode==='staff'||mode==='home'||mode==='shaduf'){
    await clickSel(pg,'.a3d-back,.r3d-back,.eg3d-back',touch).catch(()=>{});
    await sleep(450);
    await dismissLeave(pg,touch);
  }
  const mode2=await pg.evaluate(()=>{const G=window.__eg3d||{};return G.modeP?G.modeP():null});
  return mode2;
}

async function startPlague(pg,p,x,z){
  return pg.evaluate(({p,x,z})=>{
    const G=window.__eg3d||{};
    try{if(G.resetStaff)G.resetStaff()}catch(e){}
    try{if(G.setMode)G.setMode('walk')}catch(e){}
    try{if(G.jumpP)G.jumpP(x,z);else if(G.jump)G.jump(x,z)}catch(e){}
    try{if(G.misSet)G.misSet({p,st:'plague',t:Date.now(),tabs:p,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
    const K=G.K||G;
    return {ok:true,kid:K.kid&&K.kid.position?[+K.kid.position.x.toFixed(2),+K.kid.position.z.toFixed(2)]:null,mode:G.getMode?G.getMode():null};
  },{p,x,z});
}

async function pinInfo(pg){
  return pg.evaluate(()=>{
    const pins=[...document.querySelectorAll('.eg3d-pin, [class*="eg3d-pin"]')];
    const list=pins.map(e=>{
      const r=e.getBoundingClientRect(),st=getComputedStyle(e);
      return {cls:String(e.className||''),on:e.classList.contains('on')||e.classList.contains('glow'),
        x:+(r.left+r.width/2).toFixed(1),y:+(r.top+r.height/2).toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
        vis:st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0'&&r.width>4};
    }).filter(p=>p.vis);
    const arrow=document.querySelector('.eg3d-obja');
    const ar=arrow&&getComputedStyle(arrow).display!=='none'?arrow.getBoundingClientRect():null;
    const caps=[...document.querySelectorAll('.eg3d-bub,.eg3d-narr,.eg3d-dlg,#sparkSay,.spk-cap')].map(e=>{
      const r=e.getBoundingClientRect(),st=getComputedStyle(e);
      if(r.width<8||st.display==='none'||st.visibility==='hidden')return null;
      return {cls:String(e.className||e.id),l:r.left,t:r.top,r:r.right,b:r.bottom};
    }).filter(Boolean);
    const overlap=list.some(p=>caps.some(c=>p.x>c.l&&p.x<c.r&&p.y>c.t&&p.y<c.b));
    const goods=document.querySelector('.eg3d-goods');
    const dock=goods?goods.getBoundingClientRect().top:innerHeight-80;
    const G=window.__eg3d||{},K=G.K||G,kid=K.kid&&K.kid.position;
    let kidScr=null;
    try{if(G.toScreen&&kid){const s=G.toScreen({x:kid.x,y:(kid.y||0)+1.1,z:kid.z});kidScr={x:s.x,y:s.y,z:s.z}}}catch(e){}
    const st=(G.misProbe&&G.misProbe())||(G.state&&G.state().mis)||{};
    return {pins:list,arrow:ar&&arrow.classList.contains('on')?{x:ar.left+ar.width/2,y:ar.top+ar.height/2,on:true}:null,caps,overlap,dock,kidScr,st:{st:st.st,p:st.p},W:innerWidth,H:innerHeight};
  });
}

async function kidVis(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg&&G.__dbg();
    const kid=dbg&&dbg.S&&(function(){let k=null;dbg.S.traverse(o=>{if(o.name==='kidStandIn'||(o.parent&&o.name==='kid'))k=k||o});return k})();
    const at=G.kidAt?G.kidAt():(G.state&&G.state().kid);
    const pos=Array.isArray(at)?at:(at&&at.length)?at:null;
    let scr=null,standIn=false,meshes=0,vis=0,proxyVis=false;
    if(pos&&G.scrP){
      const s=G.scrP(pos[0], (pos.length>2?pos[1]+1:1.0), pos[pos.length>2?2:1]);
      if(s)scr={x:+s.x.toFixed(1),y:+s.y.toFixed(1),z:+(s.z!=null?s.z:0).toFixed(2)};
    }
    if(dbg&&dbg.S){
      dbg.S.traverse(o=>{
        if(o.name==='kidStandIn'){standIn=true;proxyVis=!!o.visible}
      });
    }
    const dockEl=document.querySelector('.eg3d-goods');
    const dock=dockEl?dockEl.getBoundingClientRect().top:innerHeight-80;
    const onScreen=scr&&scr.z<1&&scr.x>10&&scr.x<innerWidth-10&&scr.y>20&&scr.y<dock-8;
    const ok=!!(pos&&onScreen);
    return {ok,meshes,vis,standIn,proxyVis,scr,dock,pos,mode:G.modeP&&G.modeP()};
  });
}

async function waitCineMid(pg,ms=5000){
  const t0=Date.now();
  let dbg=null;
  while(Date.now()-t0<ms){
    dbg=await pg.evaluate(()=>window.__fxDbg||null);
    if(dbg&&dbg.hook&&dbg.mode==='cine'&&dbg.left!=null&&dbg.left<=3800&&dbg.left>=900)break;
    await sleep(80);
  }
  return dbg;
}


async function runSize(tag,w,h,touch){
  flog('==== SIZE',tag,w,h,'====');
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    if(!entered){await shot(pg,tag+'-fail-enter');return}
    await dismissLeave(pg,touch);

    // P5 cows + kid in frame
    await startPlague(pg,5,-33,12);
    for(let i=0;i<25;i++){
      const mid=await pg.evaluate(()=>window.__fxDbg||null);
      if(mid&&mid.mode==='cine')break;
      await sleep(120);
    }
    await sleep(700);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p5-cows');
    const kv5=await kidVis(pg);
    rec(tag+'-p5-kid-in-frame', !!(kv5&&kv5.scr&&kv5.scr.z<1&&kv5.scr.x>20&&kv5.scr.x<(w-20)&&kv5.scr.y>40&&kv5.scr.y<(h-40)), kv5);

    // Boils as small raised sores
    await startPlague(pg,6,-14,4);
    for(let i=0;i<25;i++){
      const mid=await pg.evaluate(()=>window.__fxDbg||null);
      if(mid&&mid.mode==='cine')break;
      await sleep(120);
    }
    await sleep(600);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p6-boils');

    // Held hornist close-up
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.holdHorn&&G.holdHorn()}catch(e){}});
    await sleep(800);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p8-horn');
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.releaseHorn&&G.releaseHorn()}catch(e){}});

    // Hail on the portico steps
    await startPlague(pg,7,-28.2,22);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-28.2,22)}catch(e){}try{G.camAim(-0.15,0.42,9)}catch(e){}});
    await sleep(1400);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p7-hail-portico');
    const hail=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{},dbg=G.__dbg&&G.__dbg(),THREE=dbg&&dbg.THREE,root=dbg&&dbg.S;
        const PAL={x:-40,z:22},stepX0=PAL.x+8.6,stepX1=PAL.x+14.2,stepHZ=4.4;
        let n=0,onSteps=0;
        if(root&&THREE)root.traverse(o=>{
          if(!o.isInstancedMesh||!o.userData||!o.userData.hail)return;
          const m=new THREE.Matrix4(),p=new THREE.Vector3();
          for(let i=0;i<o.count;i++){
            o.getMatrixAt(i,m);
            const e=m.elements;if(Math.abs(e[0])+Math.abs(e[5])+Math.abs(e[10])<1e-4)continue;
            p.setFromMatrixPosition(m);
            if(p.y<0.2||p.y>2.8)continue;
            n++;
            if(p.x>stepX0&&p.x<stepX1&&Math.abs(p.z-PAL.z)<stepHZ)onSteps++;
          }
        });
        return {n,onSteps};
      }catch(e){return {err:String(e)}}
    });
    rec(tag+'-p7-hail-not-on-steps', (hail.onSteps||0)===0, hail);

    // P9 portico, after cine, kid on the steps
    await startPlague(pg,9,-28.4,22);
    await sleep(2000);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.jumpP(-28.4,22)}catch(e){}
      try{G.camAim(-0.2,0.22,7.4)}catch(e){}
    });
    await sleep(800);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p9-portico');
    const p9=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{},dbg=G.__dbg&&G.__dbg(),root=dbg&&dbg.S;
        let warm=0;if(root)root.traverse(o=>{if(o.isPointLight&&o.intensity>=8)warm++});
        const at=G.kidAt&&G.kidAt();
        let scr=null;if(at&&G.scrP)scr=G.scrP(at[0],(at.length>2?at[1]:0)+1.2,at[at.length>2?2:1]);
        const on=!!(scr&&scr.z<1&&scr.x>4&&scr.x<innerWidth-4&&scr.y>4&&scr.y<innerHeight-4);
        return {warm,scr,on};
      }catch(e){return {err:String(e)}}
    });
    rec(tag+'-p9-portico-kid-lit', !!(p9.on&&(p9.warm||0)>=1), p9);

    // Front-on door pin
    await toWalk(pg,touch);
    await dismissLeave(pg,touch);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      const doors=(G.homeDoors&&G.homeDoors())||[];
      const d=doors.find(q=>q.kind==='goshen'||q.kind==='ish')||doors[0];
      const x=d?d.x:-42,z=d?(d.z+3.2):-6;
      try{G.jumpP(x,z)}catch(e){}
      try{G.misSet&&G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[9],auto:0,autoT:0})}catch(e){}
      try{G.camAim(0,0.34,14)}catch(e){}
    });
    await sleep(1000);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p10-doors-pin');

    // Mat pin on the mat
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.jumpP(-40,-3)}catch(e){}
      try{G.misSet&&G.misSet({p:10,st:'sleep',t:Date.now(),tabs:10,need:5,painted:[0,1,2,3,4],paid:[9],auto:0,autoT:0})}catch(e){}
      try{G.camAim(0,0.38,16)}catch(e){}
    });
    await sleep(1000);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p10-mat-pin');
    const mat=await pinInfo(pg);
    const matPin=mat.pins.find(p=>/bed|mat/i.test(p.cls))||mat.pins[0];
    const matOn=await pg.evaluate((pin)=>{
      const G=window.__eg3d||{};
      let s=null;try{s=G.scrP&&G.scrP(-42,.62,-5)}catch(e){}
      const d=(pin&&s&&s.z<1)?Math.hypot(pin.x-s.x,pin.y-s.y):999;
      const caps=[...document.querySelectorAll('.eg3d-bub.spark')].map(e=>e.getBoundingClientRect());
      const overlap=!!(pin&&caps.some(r=>pin.x+pin.w/2>r.left&&pin.x-pin.w/2<r.right&&pin.y+20>r.top&&pin.y-40<r.bottom));
      return {s,d,ok:d<80,overlap,pin};
    }, matPin?{x:matPin.x,y:matPin.y,w:matPin.w,h:matPin.h}:null);
    rec(tag+'-p10-mat-pin-on-mat', !!(matOn&&matOn.ok&&!matOn.overlap), matOn);

    // Passover house fronts
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.misSet&&G.misSet({p:10,st:'sleep',t:Date.now(),tabs:10,need:5,painted:[0,1,2,3,4],paid:[9],auto:0,autoT:0})}catch(e){}
      try{if(G.misSleep)G.misSleep()}catch(e){}
    });
    await sleep(1600);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-p10-passover');

    // We're free two-shot, then sea day/night/army/shake/end
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.misFree)G.misFree()}catch(e){}
      try{if(G.cineJump)G.cineJump(8)}catch(e){}
    });
    await sleep(700);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-were-free');
    const free=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{};
        const at=G.kidAt&&G.kidAt();
        let kid=null,ph=null;
        if(at&&G.scrP)kid=G.scrP(at[0],(at.length>2?at[1]:0)+1.2,at[at.length>2?2:1]);
        if(G.scrP)ph=G.scrP(-40,1.6,22);
        const on=s=>!!(s&&s.z<1&&s.x>0&&s.x<innerWidth&&s.y>0&&s.y<innerHeight);
        return {kid,ph,kidOn:on(kid),phOn:on(ph)};
      }catch(e){return {err:String(e)}}
    });
    rec(tag+'-were-free-frames-pharaoh-and-kid', !!(free.kidOn&&free.phOn), free);

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(20)}catch(e){}try{if(G.pasNight)G.pasNight(0)}catch(e){}});
    await sleep(500);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-sea-walls-day');
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.pasNight)G.pasNight(1)}catch(e){}});
    await sleep(500);
    await shot(pg,tag+'-sea-walls-night');

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(29)}catch(e){}});
    await sleep(700);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-sea-army');
    const army=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      let horses=0,carts=0,soldiers=0,houses=0;
      if(root)root.traverse(o=>{
        if(!o.visible)return;
        if(o.userData&&o.userData.seaHorse)horses++;
        if(o.userData&&o.userData.seaCart)carts++;
        if(o.userData&&o.userData.seaSoldier)soldiers++;
      });
      return {horses,carts,soldiers,houses};
    });
    rec(tag+'-sea-army-has-horses', (army.horses||0)>=4||(army.carts||0)>=2, army);

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(34)}catch(e){}});
    await sleep(800);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-sea-shake');
    const shLay=await pg.evaluate(()=>{
      const box=sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect(),st=getComputedStyle(e);
        if(st.display==='none'||r.width<4)return null;return {x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom,cy:r.top+r.height/2};};
      const sh=box('.eg3d-tamb'),home=box('.eg3d-hub .a3d-h, .sh3d-homeb, .eg3d .a3d-h'),skip=box('.eg3d-askip'),tray=box('.eg3d-tray, .sh3d-tray');
      const overlap=(a,b)=>a&&b&&a.x<b.r-2&&a.r>b.x+2&&a.y<b.b-2&&a.b>b.y+2;
      return {sh,home,skip,tray,shHome:overlap(sh,home),shTray:overlap(sh,tray),shSkip:overlap(sh,skip),
        shHomeDist:sh&&home?Math.hypot((sh.x+sh.w/2)-(home.x+home.w/2),(sh.y+sh.h/2)-(home.y+home.h/2)):null};
    });
    rec(tag+'-shake-clear-of-home', !shLay.shHome && (shLay.shHomeDist==null||shLay.shHomeDist>80), shLay);
    for(let i=0;i<3;i++){
      const sh=await pg.evaluate(()=>{
        const t=document.querySelector('.eg3d-tamb');
        const r=t&&getComputedStyle(t).display!=='none'&&t.getBoundingClientRect();
        if(!r||r.width<8)return null;
        return {x:r.left+r.width/2,y:r.top+r.height/2};
      });
      if(sh){if(touch) await pg.touchscreen.tap(sh.x,sh.y); else await pg.mouse.click(sh.x,sh.y)}
      await sleep(350);
    }
    await sleep(700);
    await dismissLeave(pg,touch);
    await shot(pg,tag+'-end-card');
    const badge=await pg.evaluate(()=>!!document.querySelector('.eg3d-badge'));
    const end=await pinInfo(pg);
    rec(tag+'-sea-shake-three-taps-end', !!badge||(end.st&&(end.st.st==='done'||end.st.st==='free')), {badge,st:end.st});
    rec(tag+'-end-card-no-stale-pin', !(end.arrow&&end.arrow.on)&&!end.pins.some(p=>p.on), end);
    rec(tag+'-no-pageerror', (pg._jsErrors||[]).length===0, {errs:pg._jsErrors||[]});
  }catch(e){
    flog('SIZE-ERR',tag,String(e&&e.stack||e));
    rec(tag+'-run',false,{err:String(e&&e.stack||e)});
    try{await shot(pg,tag+'-error')}catch(_){}
  }finally{
    try{await br.close()}catch(_){}
  }
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  try{fs.writeFileSync(LIVE,'')}catch(_){}
  flog('START',BASE,new Date().toISOString());
  for(const [w,h,touch] of [[1280,715,false],[390,844,true]]){
    await runSize(String(w),w,h,touch);
  }
  out.ended=new Date().toISOString();
  const pass=out.checks.filter(c=>c.ok).length,fail=out.checks.filter(c=>!c.ok).length;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',pass+' PASS / '+fail+' FAIL / '+out.checks.length);
  process.exit(fail?2:0);
})().catch(e=>{console.error(e);process.exit(1)});
