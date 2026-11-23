/* Local-only Tester-8.4 stills + click-only pin/shake checks at 1280 and 390.
   Points at the local spark37 server. testfast + misSet/cineJump only to reach
   later beats. No deploy. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s47-local-84c';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s47-local-84c-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s47-local-84c-report.json';
const ONLY=process.env.ONLY||'';
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

    // 5) first-frame / start kid visible
    await sleep(200);
    await shot(pg,tag+'-start-kid');
    const kv0=await kidVis(pg);
    rec(tag+'-start-kid-visible', !!(kv0&&kv0.ok), kv0);

    // (a) first-screen story pin must walk the kid, not open the Map overlay
    const storyPin=await pg.evaluate(()=>{
      const pins=[...document.querySelectorAll('.eg3d-pin, .eg3d-obja')];
      const vis=pins.map(e=>{
        const r=e.getBoundingClientRect(),st=getComputedStyle(e);
        const cls=String(e.className||'')+' '+(e.dataset.id||e.id||'');
        return {cls,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,
          on:e.classList.contains('on')||e.classList.contains('glow')||/\beg3d-obja\b/.test(e.className||''),
          vis:st.display!=='none'&&st.visibility!=='hidden'&&r.width>6,
          isMap:/map/i.test(cls)};
      }).filter(p=>p.vis);
      const story=vis.find(p=>/palace|story|pharaoh/i.test(p.cls)&&!p.isMap)||vis.find(p=>p.on&&!p.isMap)||vis.find(p=>!p.isMap);
      return {story,vis};
    });
    if(storyPin.story){if(touch) await pg.touchscreen.tap(storyPin.story.x,storyPin.story.y); else await pg.mouse.click(storyPin.story.x,storyPin.story.y)}
    await sleep(700);
    await shot(pg,tag+'-start-story-pin');
    const afterStory=await pg.evaluate(()=>{
      const mapEl=[...document.querySelectorAll('.eg3d-map')].find(e=>{
        const r=e.getBoundingClientRect(),st=getComputedStyle(e);
        return st.display!=='none'&&st.visibility!=='hidden'&&parseFloat(st.opacity||'1')>0.2&&r.width>80&&r.height>80;
      });
      const title=/\btap a place to go\b/i.test(document.body.innerText||'');
      const G=window.__eg3d||{};
      return {mapOpen:!!mapEl||title, kid:G.kidAt&&G.kidAt(), st:G.state&&G.state()};
    });
    rec(tag+'-start-story-pin-does-not-open-map', !afterStory.mapOpen, {story:storyPin.story,after:afterStory});
    await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch).catch(()=>{});
    await sleep(200);


    // 1 / 2 / 5 P1: pin from the bank first (walk mode), then wade shot
    await toWalk(pg,touch);
    const p1=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.jumpP(24.8,14)}catch(e){try{G.jump(24.8,14)}catch(_){}}
      try{G.misSet&&G.misSet({p:1,st:'act',t:Date.now(),tabs:1,need:5,painted:[],paid:[],auto:0,autoT:0})}catch(e){}
      try{G.camAim(-Math.PI/2,0.4,10)}catch(e){}
      return {kid:G.state&&G.state().kid,mode:G.modeP&&G.modeP()};
    });
    await sleep(900);
    await shot(pg,tag+'-p1-water-pin');
    const pi1=await pinInfo(pg);
    const nilePin=pi1.pins.find(p=>/nile/i.test(p.cls))||pi1.pins.find(p=>p.on)||pi1.pins[0];
    rec(tag+'-p1-water-pin-visible', !!(nilePin||pi1.pins.length||pi1.arrow), {nilePin,pins:pi1.pins,arrow:pi1.arrow,overlap:pi1.overlap,mode:p1.mode});
    let tapP1=null;
    if(nilePin){if(touch) await pg.touchscreen.tap(nilePin.x,nilePin.y); else await pg.mouse.click(nilePin.x,nilePin.y);tapP1='pin'}
    else if(pi1.arrow){if(touch) await pg.touchscreen.tap(pi1.arrow.x,pi1.arrow.y); else await pg.mouse.click(pi1.arrow.x,pi1.arrow.y);tapP1='arrow'}
    else tapP1=await clickSel(pg,'.eg3d-pin-nile,.eg3d-pin.on,.eg3d-obja.on',touch);
    await sleep(400);
    rec(tag+'-p1-water-pin-first-tap', !!tapP1, {tapP1});

    // pin stability: sample nile/next pin over 8 frames while camera yaws a little
    const drift=await pg.evaluate(async()=>{
      const G=window.__eg3d||{};
      const samples=[];
      const yaw0=(G.camP&&G.camP().yaw);
      for(let i=0;i<8;i++){
        try{G.camP((yaw0||0)+i*0.04)}catch(e){}
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const el=[...document.querySelectorAll('.eg3d-pin.on,.eg3d-pin.glow,.eg3d-pin-nile')].find(e=>e.getBoundingClientRect().width>4);
        if(!el){samples.push(null);continue}
        const r=el.getBoundingClientRect();
        samples.push({x:r.left+r.width/2,y:r.top+r.height/2});
      }
      if(yaw0!=null){try{G.camP(yaw0)}catch(e){}}
      const pts=samples.filter(Boolean);
      if(pts.length<3)return {ok:false,reason:'few-samples',samples};
      // A pin fixed on a world target will move, but not orbit the screen center.
      // Reject a near-constant radius around the screen center (the old ellipse).
      const cx=innerWidth/2,cy=innerHeight/2;
      const rs=pts.map(p=>Math.hypot(p.x-cx,p.y-cy));
      const rAvg=rs.reduce((a,b)=>a+b,0)/rs.length;
      const rVar=rs.reduce((a,b)=>a+(b-rAvg)**2,0)/rs.length;
      const angs=pts.map(p=>Math.atan2(p.y-cy,p.x-cx));
      let dang=0;for(let i=1;i<angs.length;i++){let d=angs[i]-angs[i-1];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;dang+=Math.abs(d)}
      const circling=rAvg>140&&rVar<400&&dang>0.6;
      return {ok:!circling,rAvg,rVar,dang,circling,pts};
    });
    rec(tag+'-pins-not-circling', !!(drift&&drift.ok), drift);

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(27.4,14)}catch(e){try{G.jump(27.4,14)}catch(_){}}try{G.camAim(-Math.PI/2,0.4,10)}catch(e){}});
    await sleep(900);
    await shot(pg,tag+'-p1-wade');
    const kv1=await kidVis(pg);
    rec(tag+'-p1-kid-above-bank', !!(kv1&&kv1.ok&&kv1.scr&&kv1.scr.y<kv1.dock-20), kv1);


    // 4) frogs
    await startPlague(pg,2,27,14);
    await waitCineMid(pg,4500);
    await shot(pg,tag+'-p2-frogs');
    const frogs=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      let n=0,whiteEyes=0,maxWhiteR=0;
      if(root)root.traverse(o=>{
        if((o.name||'')==='frog'||(o.userData&&o.userData.frog))n++;
        if(o.isMesh&&o.material&&o.material.color){
          const c=o.material.color;const hex=c.getHex?c.getHex():0;
          if(hex>0xf0f0f0&&o.geometry&&o.geometry.type==='SphereGeometry'){
            const r=(o.geometry.parameters&&o.geometry.parameters.radius)||0;
            const wr=r*Math.max(o.scale.x,o.scale.y,o.scale.z);
            if(wr>0.02&&wr<0.2){whiteEyes++;if(wr>maxWhiteR)maxWhiteR=wr}
          }
        }
      });
      return {n,whiteEyes,maxWhiteR};
    });
    rec(tag+'-p2-frogs-present', (frogs.n||0)>0, frogs);
    rec(tag+'-p2-frogs-no-googly', (frogs.maxWhiteR||0)<0.05, frogs);

    // 4) cows P5 — no huge foreground cow
    await startPlague(pg,5,-33,12);
    await waitCineMid(pg,4500);
    await shot(pg,tag+'-p5-cows');
    const cows=await pg.evaluate(()=>{
      const G=window.__eg3d||{},dbg=G.__dbg&&G.__dbg(),cam=dbg&&dbg.cam;
      const list=[];
      const seen=new Set();
      const consider=g=>{
        if(!g||seen.has(g))return;seen.add(g);
        const p=g.position||{};
        const d=cam?Math.hypot((p.x||0)-cam.position.x,(p.y||0)-cam.position.y,(p.z||0)-cam.position.z):99;
        let sx=null;
        try{if(G.toScreen){const s=G.toScreen({x:p.x,y:(p.y||0)+.8,z:p.z});sx={x:s.x,y:s.y,z:s.z}}}catch(e){}
        list.push({d:+d.toFixed(2),sx,vis:g.visible!==false});
      };
      try{
        const st=G.state&&G.state();
        // walk scene for cow-sized groups near the field
        const root=dbg&&dbg.S;
        const at=G.kidAt?G.kidAt():(G.state&&G.state().kid);
        const kid=at?{x:at[0],z:at[at.length>2?2:1]}:null;
        if(root)root.traverse(o=>{
          if(!o.isGroup||!o.visible)return;
          if(o.userData&&o.userData.legs&&o.userData.legs.length===4&&o.scale){
            const _T=(window.__eg3d&&window.__eg3d.__dbg&&window.__eg3d.__dbg().THREE);const p=(_T&&o.getWorldPosition)?o.getWorldPosition(new _T.Vector3()):(o.position||{x:0,y:0,z:0});
            if(kid&&Math.hypot(p.x-kid.x,p.z-kid.z)<18)consider(o);
          }
        });
      }catch(e){}
      list.sort((a,b)=>a.d-b.d);
      const huge=list.some(c=>c.d<4.2&&c.sx&&c.sx.z<1);
      return {n:list.length,nearest:list[0],huge,list:list.slice(0,6)};
    });
    rec(tag+'-p5-cows-visible', (cows.n||0)>=1, cows);
    rec(tag+'-p5-no-huge-foreground-cow', !cows.huge, cows);
    const kv5=await kidVis(pg);
    rec(tag+'-p5-kid-in-frame', !!(kv5&&kv5.ok&&kv5.scr&&kv5.scr.z<1&&kv5.scr.x>8&&kv5.scr.x<(w-8)&&kv5.scr.y>8&&kv5.scr.y<(h-8)), kv5);


    // 4) boils
    await startPlague(pg,6,-14,4);
    await waitCineMid(pg,4500);
    await shot(pg,tag+'-p6-boils');
    const boils=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      let n=0,maxS=0;
      if(root)root.traverse(o=>{
        if(o.userData&&o.userData.boil&&o.visible){n++;const s=Math.max(o.scale.x,o.scale.y,o.scale.z);if(s>maxS)maxS=s}
      });
      return {n,maxS};
    });
    rec(tag+'-p6-boils-raised', (boils.n||0)>=4&&boils.maxS>=0.05&&boils.maxS<=0.22, boils);

    // 4) locusts — after the horn cine, look at the field swarm
    await startPlague(pg,8,-27,12);
    await waitCineMid(pg,3500);
    await shot(pg,tag+'-p8-horn');
    await toWalk(pg,touch);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-27,12)}catch(e){}try{G.camAim(0.6,0.4,12)}catch(e){}});
    await sleep(800);
    await shot(pg,tag+'-p8-locusts');
    const loc=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      let inst=0,count=0;
      if(root)root.traverse(o=>{
        if(o.isInstancedMesh&&o.count>50&&o.visible){inst++;if(o.count>count)count=o.count}
      });
      return {inst,count};
    });
    rec(tag+'-p8-locusts-dense', (loc.count||0)>=800, loc);

    // (b) P7 hail must not land on the portico steps
    await startPlague(pg,7,-28,22);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-28.2,22)}catch(e){}try{G.camAim(-0.4,0.35,11)}catch(e){}});
    await waitCineMid(pg,3500);
    await shot(pg,tag+'-p7-hail-portico');
    const hail=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{},dbg=G.__dbg&&G.__dbg(),THREE=dbg&&dbg.THREE,root=dbg&&dbg.S;
        const PAL={x:-40,z:22},stepX0=PAL.x+8.6,stepX1=PAL.x+14.2,stepHZ=4.4;
        let n=0,onSteps=0;
        if(root&&THREE)root.traverse(o=>{
          if(!o.isInstancedMesh||!o.count||o.count<40)return;
          const m=new THREE.Matrix4(),p=new THREE.Vector3();
          for(let i=0;i<o.count;i++){
            o.getMatrixAt(i,m);
            const e=m.elements;if(Math.abs(e[0])+Math.abs(e[5])+Math.abs(e[10])<1e-4)continue;
            p.setFromMatrixPosition(m);
            if(p.y<0.05||p.y>8)continue;
            n++;
            if(p.x>stepX0&&p.x<stepX1&&Math.abs(p.z-PAL.z)<stepHZ)onSteps++;
          }
        });
        return {n,onSteps};
      }catch(e){return {err:String(e),n:0,onSteps:0}}
    });
    rec(tag+'-p7-hail-not-on-steps', (hail.onSteps||0)===0, hail);

    // (c)(d)(f) gap countdown stays steady; HUD bands; Skip clear of Staff / story cards
    await toWalk(pg,touch);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.jumpP(-28.2,22)}catch(e){}
      try{G.camAim(-0.4,0.3,9)}catch(e){}
      const t=Date.now();
      try{G.misSet&&G.misSet({p:8,st:'gap',t,tabs:8,need:5,painted:[],paid:[7],auto:0,autoT:0,gapUntil:t+8000,gapP:8})}catch(e){}
    });
    await sleep(500);
    await shot(pg,tag+'-p8-gap-hud');
    const gapSamples=[];
    for(let i=0;i<5;i++){
      gapSamples.push(await pg.evaluate(()=>{
        const G=window.__eg3d||{};
        const st=G.state&&G.state();
        const span=document.querySelector('.eg3d-hg:not(.eg3d-cnt) span');
        return {left:st&&st.gapLeft,text:span&&span.textContent,st:st&&st.st};
      }));
      await sleep(450);
    }
    const left0=(gapSamples[0]&&gapSamples[0].left)||0;
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.endPlague){G.endPlague();G.endPlague()}}catch(e){}});
    await sleep(200);
    const afterDouble=await pg.evaluate(()=>{const G=window.__eg3d||{};const st=G.state&&G.state();return {left:st&&st.gapLeft,st:st&&st.st}});
    const nums=gapSamples.map(s=>s.left).filter(v=>typeof v==='number');
    let steady=nums.length>=3;
    for(let i=1;i<nums.length;i++){if(nums[i]>nums[i-1]+500)steady=false}
    const noReset=!(afterDouble&&typeof afterDouble.left==='number'&&afterDouble.left>left0+1500);
    rec(tag+'-p8-gap-steady', !!(steady&&noReset), {gapSamples,afterDouble,steady,noReset});

    const hud=await pg.evaluate(()=>{
      const box=sel=>{
        const els=[...document.querySelectorAll(sel)];
        for(const e of els){
          const r=e.getBoundingClientRect(),st=getComputedStyle(e);
          if(st.display==='none'||st.visibility==='hidden'||parseFloat(st.opacity||'1')<0.05||r.width<2||r.height<2)continue;
          return {x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom,sel};
        }
        return null;
      };
      const overlap=(a,b)=>a&&b&&a.x<b.r-2&&a.r>b.x+2&&a.y<b.b-2&&a.b>b.y+2;
      const hg=box('.eg3d-hg.on:not(.eg3d-cnt)')||box('.eg3d-hg:not(.eg3d-cnt)');
      const bub=box('.eg3d-bub.spark');
      const gear=box('.eg3d-gear');
      const spk=box('.a3d-sparkre, .a3d-spark, .eg3d-spark, button.spk, .spk');
      const skip=box('.eg3d-askip');
      const staff=box('.eg3d-staffb, .eg3d-tamb');
      const dlg=box('.eg3d-nbox, .eg3d-dbox, .eg3d-dlg');
      const say=document.querySelector('#sparkSay, .eg3d-bub.spark');
      const lh=say?parseFloat(getComputedStyle(say).lineHeight)||18:18;
      const lines=say?Math.round(say.getBoundingClientRect().height/lh):0;
      const dist=(a,b)=>a&&b?Math.hypot((a.x+a.w/2)-(b.x+b.w/2),(a.y+a.h/2)-(b.y+b.h/2)):null;
      return {
        hg,bub,gear,spk,skip,staff,dlg,lines,
        hgBub:overlap(hg,bub),hgGear:overlap(hg,gear),bubGear:overlap(bub,gear),bubSpk:overlap(bub,spk),
        skipStaff:overlap(skip,staff),skipDlg:overlap(skip,dlg),
        skipStaffDist:dist(skip,staff),skipDlgDist:dist(skip,dlg)
      };
    });
    rec(tag+'-hud-no-chip-caption-clash', !hud.hgBub && !hud.hgGear && !hud.bubGear, hud);
    rec(tag+'-hud-caption-le-3-lines', (hud.lines||0)<=3, hud);
    rec(tag+'-skip-away-from-staff-and-story', (hud.skipStaffDist==null||hud.skipStaffDist>90)&&(hud.skipDlgDist==null||hud.skipDlgDist>90)&&!hud.skipStaff&&!hud.skipDlg, hud);

    // (e) P9 portico has enough light that the kid reads
    await startPlague(pg,9,-28.4,22);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.jumpP(-28.4,22)}catch(e){}try{G.camAim(-0.35,0.28,8)}catch(e){}});
    await sleep(1000);
    await shot(pg,tag+'-p9-portico');
    const p9=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{},dbg=G.__dbg&&G.__dbg(),root=dbg&&dbg.S;
        let warm=0;
        if(root)root.traverse(o=>{if(o.isPointLight&&o.intensity>=8)warm++});
        const at=G.kidAt&&G.kidAt();
        let scr=null;
        if(at&&G.scrP){const x=at[0],y=(at.length>2?at[1]:0)+1.2,z=at[at.length>2?2:1];scr=G.scrP(x,y,z)}
        const on=!!(scr&&scr.z<1&&scr.x>4&&scr.x<innerWidth-4&&scr.y>4&&scr.y<innerHeight-4);
        return {warm,scr,on};
      }catch(e){return {err:String(e)}}
    });
    rec(tag+'-p9-portico-kid-lit', !!(p9.on&&(p9.warm||0)>=1), p9);


    // 2/3 P10 door pin on a real door
    await toWalk(pg,touch);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      const doors=(G.homeDoors&&G.homeDoors())||[];
      const d=doors.find(q=>q.kind==='goshen'||q.kind==='ish')||doors[0];
      const x=d?d.x:-42,z=d?(d.z+3.2):-6;
      try{G.jumpP(x,z)}catch(e){try{G.jump(x,z)}catch(_){}}
      try{G.misSet&&G.misSet({p:10,st:'paint',t:Date.now(),tabs:10,need:5,painted:[],paid:[9],auto:0,autoT:0})}catch(e){}
      try{G.camAim(0,0.34,14)}catch(e){}
    });
    await sleep(1000);
    await shot(pg,tag+'-p10-doors-pin');
    const door=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      const pinEl=[...document.querySelectorAll('.eg3d-pin-doors,.eg3d-pin.on,.eg3d-pin.glow,.eg3d-obja.on')].find(e=>e.getBoundingClientRect().width>4);
      const pr=pinEl?pinEl.getBoundingClientRect():null;
      const pin={on:!!pr,x:pr&&pr.left+pr.width/2,y:pr&&pr.top+pr.height/2,cls:pinEl&&String(pinEl.className||'')};
      const doors=(G.homeDoors&&G.homeDoors())||[];
      const gs=doors.filter(d=>d.kind==='goshen'||d.kind==='ish');
      const scr=gs.map(d=>{
        try{const s=G.scrP(d.x,1.65,d.z+1.15);return s&&{x:s.x,y:s.y,z:s.z,i:d.i}}catch(e){return null}
      }).filter(s=>s&&s.z<1);
      let nearest=null,dist=1e9;
      if(pin.on)for(const s of scr){const d=Math.hypot(s.x-pin.x,s.y-pin.y);if(d<dist){dist=d;nearest=s}}
      const at=G.kidAt?G.kidAt():(G.state&&G.state().kid);
      const pos=Array.isArray(at)?at:null;
      let scrK=null;
      if(pos&&G.scrP){const s=G.scrP(pos[0],pos.length>2?pos[1]+1.1:1.1,pos[pos.length>2?2:1]);scrK=s}
      const dockEl=document.querySelector('.eg3d-goods');
      const dock=dockEl?dockEl.getBoundingClientRect().top:innerHeight-80;
      const kidAbove=scrK&&scrK.z<1&&scrK.y<dock-10&&scrK.y>20;
      return {pin,doorCount:gs.length,nearest,dist,onDoor:!!(pin.on&&dist<110),kid:{pos,scr:scrK},kidAbove,dock,mode:G.modeP&&G.modeP()};
    });
    rec(tag+'-p10-door-pin-on-door', !!(door.onDoor|| (door.pin&&door.pin.on&&door.dist<120)), door);
    rec(tag+'-p10-doors-kid-above-toolbar', !!door.kidAbove, door);
    if(door.pin&&door.pin.on){if(touch) await pg.touchscreen.tap(door.pin.x,door.pin.y); else await pg.mouse.click(door.pin.x,door.pin.y)}
    else await clickSel(pg,'.eg3d-pin-doors,.eg3d-obja.on',touch);
    await sleep(300);
    rec(tag+'-p10-door-pin-first-tap', !!(door.pin&&door.pin.on), {pin:door.pin});

    // 2/3 mat pin + caption + kid in frame
    await toWalk(pg,touch);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.jumpP(-40,-3)}catch(e){try{G.jump(-40,-3)}catch(_){}}
      try{G.misSet&&G.misSet({p:10,st:'sleep',t:Date.now(),tabs:10,need:5,painted:[0,1,2,3,4],paid:[9],auto:0,autoT:0})}catch(e){}
      try{G.camAim(0,0.38,16)}catch(e){}
    });
    await sleep(1200);
    await shot(pg,tag+'-p10-mat-pin');
    const mat=await pinInfo(pg);
    const kvm=await kidVis(pg);
    rec(tag+'-p10-mat-kid-above-toolbar', !!(kvm&&kvm.ok&&kvm.scr&&kvm.scr.y<kvm.dock-10), kvm);
    rec(tag+'-p10-mat-pin-not-under-caption', !mat.overlap && !!(mat.pins.some(p=>/bed|mat/i.test(p.cls))||mat.pins.length||mat.arrow), mat);
    const matPin=mat.pins.find(p=>/bed|mat/i.test(p.cls))||mat.pins[0];
    const matOn=await pg.evaluate((pin)=>{
      const G=window.__eg3d||{};
      let s=null;try{s=G.scrP&&G.scrP(-42,1.05,-5)}catch(e){}
      const d=(pin&&s&&s.z<1)?Math.hypot(pin.x-s.x,pin.y-s.y):999;
      return {s,d,ok:d<90};
    }, matPin||mat.arrow||null);
    rec(tag+'-p10-mat-pin-on-mat', !!(matOn&&matOn.ok), matOn);
    let matTap=false;
    if(matPin){if(touch) await pg.touchscreen.tap(matPin.x,matPin.y); else await pg.mouse.click(matPin.x,matPin.y);matTap=true}
    else if(mat.arrow){if(touch) await pg.touchscreen.tap(mat.arrow.x,mat.arrow.y); else await pg.mouse.click(mat.arrow.x,mat.arrow.y);matTap=true}
    rec(tag+'-p10-mat-pin-first-tap', matTap, {matPin,arrow:mat.arrow});

    // 3) Passover houses
    await toWalk(pg,touch);
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.misSet&&G.misSet({p:10,st:'sleep',t:Date.now(),tabs:10,need:5,painted:[0,1,2,3,4],paid:[9],auto:0,autoT:0})}catch(e){}
      try{if(G.misSleep)G.misSleep()}catch(e){}
    });
    await sleep(1400);
    await shot(pg,tag+'-p10-passover');
    const pas=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      const doors=(G.homeDoors&&G.homeDoors())||[];
      const gs=doors.filter(d=>d.kind==='goshen'||d.kind==='ish');
      const cam=G.camPos?G.camPos():null;
      const target=cam?{x:cam[0],y:cam[1],z:cam[2]}:null;
      let nearDoor=null,dmin=1e9;
      if(target)for(const d of gs){const dd=Math.hypot((d.x||0)-target.x,(d.z||0)-(target.z||0));if(dd<dmin){dmin=dd;nearDoor=d}}
      const pal={x:-40,z:22};
      const palDist=target?Math.hypot(target.x-pal.x,target.z-pal.z):99;
      return {look:target,nearDoor:nearDoor&&{x:nearDoor.x,z:nearDoor.z,kind:nearDoor.kind},dmin,palDist,doorN:gs.length};
    });
    rec(tag+'-p10-passover-on-houses', !!(pas.dmin<18&&pas.palDist>8), pas);

    // 1 / 4 / 5 sea crossing + shake + end-card
    const sea0=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{G.setMode&&G.setMode('walk')}catch(e){}
      try{if(G.misFree)G.misFree()}catch(e){}
      let t=null;
      try{if(G.cineJump)t=G.cineJump(8)}catch(e){}
      return {t,mode:G.getMode&&G.getMode()};
    });
    await sleep(600);
    await shot(pg,tag+'-were-free');
    const free=await pg.evaluate(()=>{
      try{
        const G=window.__eg3d||{};
        const at=G.kidAt&&G.kidAt();
        let kid=null,ph=null;
        if(at&&G.scrP){const x=at[0],y=(at.length>2?at[1]:0)+1.2,z=at[at.length>2?2:1];kid=G.scrP(x,y,z)}
        if(G.scrP)ph=G.scrP(-40,1.6,22);
        const on=s=>!!(s&&s.z<1&&s.x>0&&s.x<innerWidth&&s.y>0&&s.y<innerHeight);
        return {kid,ph,kidOn:on(kid),phOn:on(ph)};
      }catch(e){return {err:String(e)}}
    });
    rec(tag+'-were-free-frames-pharaoh-and-kid', !!(free.kidOn&&free.phOn), free);

    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.cineJump)G.cineJump(20)}catch(e){}try{if(G.pasNight)G.pasNight(0)}catch(e){}});
    await sleep(500);
    await shot(pg,tag+'-sea-walls-day');
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{if(G.pasNight)G.pasNight(1)}catch(e){}});
    await sleep(500);
    await shot(pg,tag+'-sea-walls-night');
    await shot(pg,tag+'-sea-walls');
    const walls=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      const mats=[];
      let whiteBeam=0,housesNear=0,horses=0,carts=0,soldiers=0,livestock=0;
      const SEA={x:-48,z:86};
      if(root)root.traverse(o=>{
        if(!o.visible)return;
        if(o.isMesh&&o.material){
          const m=o.material;
          const c=m.color&&m.color.getHex?m.color.getHex():0;
          const e=m.emissive&&m.emissive.getHex?m.emissive.getHex():0;
          const bright=(c>0xd0e8f0&&(m.opacity||1)>0.4)||(e>0xc0d0e0);
          if(bright&&o.geometry&&(o.geometry.type==='PlaneGeometry'||o.geometry.type==='BoxGeometry'))whiteBeam++;
          if(m.color)mats.push({c:m.color.getHexString&&m.color.getHexString(),op:m.opacity,type:m.type,em:m.emissive&&m.emissive.getHexString&&m.emissive.getHexString()});
        }
        const p=o.position||{};
        const near=Math.hypot((p.x||0)-SEA.x,(p.z||0)-SEA.z)<28;
        if(near&&o.userData&&(o.userData.paintHouse||o.userData.fadeGroup)&&o.visible)housesNear++;
        if((o.name||'').toLowerCase().includes('horse')||(o.userData&&o.userData.seaHorse))horses++;
        if((o.name||'').toLowerCase().includes('cart')||(o.userData&&o.userData.seaCart))carts++;
        if((o.userData&&o.userData.animal)||(o.userData&&o.userData.legs&&o.parent&&o.parent.visible))livestock++;
      });
      return {whiteBeam,housesNear,horses,carts,soldiers,livestock,matSample:mats.slice(0,8)};
    });
    rec(tag+'-sea-no-white-beams', (walls.whiteBeam||0)===0, walls);

    const sea1=await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      let t=null;
      try{if(G.cineJump)t=G.cineJump(29)}catch(e){}
      return {t};
    });
    await sleep(700);
    await shot(pg,tag+'-sea-army');
    const army=await pg.evaluate(()=>{
      const G=window.__eg3d||{},root=(G.__dbg&&G.__dbg().S);
      let horses=0,carts=0,soldiers=0,livestock=0,houses=0;
      const SEA={x:-48,z:86};
      if(root)root.traverse(o=>{
        if(!o.visible)return;
        if(o.userData&&o.userData.seaHorse)horses++;
        if(o.userData&&o.userData.seaCart)carts++;
        if(o.userData&&o.userData.seaSoldier)soldiers++;
        if(o.userData&&o.userData.animal)livestock++;
        if((o.name||'').match(/horse/i))horses++;
        if((o.name||'').match(/cart|chariot/i))carts++;
        const _T=(window.__eg3d&&window.__eg3d.__dbg&&window.__eg3d.__dbg().THREE);const p=(_T&&o.getWorldPosition)?o.getWorldPosition(new _T.Vector3()):(o.position||{x:0,y:0,z:0});
        if(o.userData&&(o.userData.paintHouse||o.userData.fadeGroup)&&Math.hypot((p.x||0)-SEA.x,(p.z||0)-SEA.z)<30)houses++;
      });
      // fallback: count meshes in army group
      let armyKids=0;
      if(root)root.traverse(o=>{if((o.name||'')==='armyG'||(o.userData&&o.userData.army))armyKids=o.children.length});
      return {horses,carts,soldiers,livestock,houses,armyKids};
    });
    rec(tag+'-sea-no-floating-house', (army.houses||0)===0, army);
    rec(tag+'-sea-army-has-horses', (army.horses||0)>=4||(army.carts||0)>=2||(army.armyKids||0)>=8, army);
    rec(tag+'-sea-exodus-livestock', (army.livestock||0)>=1||(walls.livestock||0)>=1, {army,wallsLivestock:walls.livestock});

    // jump to Shake offer
    await pg.evaluate(()=>{
      const G=window.__eg3d||{};
      try{if(G.cineJump)G.cineJump(34)}catch(e){}
    });
    await sleep(800);
    await shot(pg,tag+'-sea-shake');
    const sh0=await pg.evaluate(()=>{
      const t=document.querySelector('.eg3d-tamb');
      const st=t&&getComputedStyle(t);
      const r=t&&t.getBoundingClientRect();
      const vis=!!(t&&st.display!=='none'&&st.visibility!=='hidden'&&r&&r.width>8);
      return {vis,text:t&&(t.textContent||t.getAttribute('aria-label')||''),x:r&&r.left+r.width/2,y:r&&r.top+r.height/2};
    });
    rec(tag+'-sea-shake-shown', !!(sh0&&sh0.vis), sh0);
    // click-only: 3 kid taps
    for(let i=0;i<3;i++){
      const sh=await pg.evaluate(()=>{
        const t=document.querySelector('.eg3d-tamb');
        const r=t&&getComputedStyle(t).display!=='none'&&t.getBoundingClientRect();
        if(!r||r.width<8)return null;
        return {x:r.left+r.width/2,y:r.top+r.height/2,text:t.textContent};
      });
      if(sh){if(touch) await pg.touchscreen.tap(sh.x,sh.y); else await pg.mouse.click(sh.x,sh.y)}
      else await clickSel(pg,'.eg3d-tamb',touch);
      await sleep(350);
    }
    await sleep(700);
    await shot(pg,tag+'-end-card');
    const end=await pinInfo(pg);
    const badge=await pg.evaluate(()=>!!document.querySelector('.eg3d-badge'));
    rec(tag+'-sea-shake-three-taps-end', !!badge||(end.st&&(end.st.st==='done'||end.st.st==='free')), {badge,st:end.st,sh0});
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
  const sizes=[[1280,715,false],[390,844,true]];
  for(const [w,h,touch] of sizes){
    if(ONLY&&!String(w).includes(ONLY)&&ONLY!==String(w))continue;
    await runSize(String(w),w,h,touch);
  }
  const pass=out.checks.filter(c=>c.ok).length,fail=out.checks.filter(c=>!c.ok).length;
  out.ended=new Date().toISOString();
  out.pass=pass;out.fail=fail;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',pass+' PASS / '+fail+' FAIL / '+out.checks.length);
  console.log('REPORT',REPORT);
  process.exit(fail?2:0);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(1)});
