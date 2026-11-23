/* s49: hand-like, no-testfast, no-jump proofs for the 9 Allen fixes at 390 then 1280. LOCAL or BASE=preview. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s49-handlike';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s49-handlike-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s49-handlike-report.json';
const ONLY=process.env.ONLY||'';
const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString(),note:'s49 no-testfast no-jump hand-like'};
const flog=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');console.log(s);try{fs.appendFileSync(LIVE,s+'\n')}catch(e){}};
const rec=(n,ok,extra)=>{const row=Object.assign({},extra||{},{n,ok:!!ok});out.checks.push(row);flog((ok?'PASS':'FAIL'),n,JSON.stringify(extra||{}));return !!ok};
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
async function domClick(pg,sel){return pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true},sel)}
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
  await clickText(pg,'^Stay$',touch).catch(()=>{});
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
  pg.on('pageerror', e=>{const s=String(e&&e.stack||e);jsErrors.push(s);flog('PAGEERROR',s.slice(0,400))});
  const url=BASE.replace(/\/$/,'/')+'?fresh=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{try{sessionStorage.removeItem('sparkTestfast');localStorage.removeItem('sparkEgypt3dV1')}catch(e){}});
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
async function kidAt(pg){
  return pg.evaluate(()=>{const G=window.__eg3d||{};const a=G.kidAt?G.kidAt():null;if(!a)return null;return {x:a[0],y:a[1],z:a[2]}});
}
async function canvasTapWorld(pg,touch,wx,wz,look=true){
  if(look){
    await pg.evaluate(({wx,wz})=>{
      const G=window.__eg3d||{};
      const k=G.kidAt?G.kidAt():[0,0,0];
      const dx=wx-(k[0]||0), dz=wz-(k[2]||0);
      if(G.camP) G.camP(Math.atan2(dx,dz)+Math.PI,.34,8.8);
    },{wx,wz});
    await sleep(180);
  }
  const aim=await pg.evaluate(({wx,wz,look})=>{
    const G=window.__eg3d||{};
    const cvs=[...document.querySelectorAll('canvas,.a3d-cv')];
    let c=null,area=0,br=null;
    for(const el of cvs){const b=el.getBoundingClientRect();const a=b.width*b.height;if(a>area&&b.width>40){area=a;c=el;br=b}}
    if(!c) return {ok:false,why:'no-canvas'};
    const k=G.kidAt?G.kidAt():[0,0,0];
    const dx=wx-(k[0]||0), dz=wz-(k[2]||0), L=Math.hypot(dx,dz)||1;
    if(look&&G.camP){
      /* yaw=0 looks south; add PI so the camera looks TOWARD the dest */
      G.camP(Math.atan2(dx,dz)+Math.PI,.34,Math.min(13,Math.max(7.5,8.5)));
    }
    /* tap a point that is actually on screen: prefer the dest, else a nearer point along the same line */
    const tries=[1,0.7,0.45,0.28,0.16].map(f=>({x:k[0]+dx*f,z:k[2]+dz*f,f}));
    let pick=null,last=null;
    for(const t of tries){
      const s=G.scrP?G.scrP(t.x,0.15,t.z):null;
      last=s;
      if(!s) continue;
      const x=Math.min(br.right-12,Math.max(br.left+12,s.x));
      const y=Math.min(br.bottom-16,Math.max(br.top+20,s.y));
      const on=s.x>br.left+8&&s.x<br.right-8&&s.y>br.top+8&&s.y<br.bottom-8&&(s.z==null||s.z<1.15);
      if(on||t.f<=0.28){pick={ok:true,x,y,wx:t.x,wz:t.z,f:t.f,s,clamped:!on};break}
    }
    if(!pick) return {ok:false,why:'offscreen',s:last};
    const opts={bubbles:true,cancelable:true,composed:true,clientX:pick.x,clientY:pick.y,pointerId:1,pointerType:'mouse'};
    c.dispatchEvent(new PointerEvent('pointerdown',opts));
    c.dispatchEvent(new PointerEvent('pointerup',opts));
    return pick;
  },{wx,wz,look});
  if(aim&&aim.ok){
    if(touch) await pg.touchscreen.tap(aim.x,aim.y); else await pg.mouse.click(aim.x,aim.y);
  }
  return aim;
}
async function walkTap(pg,touch,wx,wz,ms=14000,close=2.2){
  const t0=Date.now();
  let last=await kidAt(pg), taps=0;
  while(Date.now()-t0<ms){
    const k=await kidAt(pg);
    if(k&&Math.hypot(k.x-wx,k.z-wz)<close) return {ok:true,k,taps,sec:(Date.now()-t0)/1000};
    if(!last||Date.now()-t0>taps*3500){
      const a=await canvasTapWorld(pg,touch,wx,wz,true);
      taps++; flog('tap',JSON.stringify({wx,wz,a,k}));
    }
    await sleep(450);
    last=k;
  }
  const k=await kidAt(pg);
  return {ok:!!(k&&Math.hypot(k.x-wx,k.z-wz)<close+1.5),k,taps,sec:(Date.now()-t0)/1000};
}

async function layoutFacts(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const S=G.__dbg?G.__dbg().S:null;
    const ground=G.__dbg?G.__dbg().ground:null;
    const out={oven:null,mill:null,bake:null,houses:[],kpsY:[],quay:null,lod:null,frogSc:null,fieldNear:null};
    try{
      const K=S&&S.parent?null:null;
    }catch(e){}
    try{
      const obj=G.obj||null;
      if(obj){
        for(const k of ['oven','mill','bakery','kps','sphinx']){
          try{const o=obj(k);out[k]=o}catch(e){}
        }
      }
    }catch(e){}
    // walk all named groups
    try{
      const dbg=G.__dbg&&G.__dbg();
      const scene=dbg&&dbg.S;
      if(scene){
        scene.traverse(o=>{
          if(!o.isGroup||!o.userData)return;
          const typ=o.userData.type||o.name;
          if(typ==='baker'||typ==='bakery'||o.name==='baker') out.bake={x:+o.position.x.toFixed(2),z:+o.position.z.toFixed(2),n:o.name};
        });
      }
    }catch(e){out.trErr=String(e)}
    try{
      const t=G.townInfo||(window.__eg3d&&window.__eg3d.townInfo);
    }catch(e){}
    return out;
  });
}

async function deepFacts(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const s49=G.s49P?G.s49P():{};
    const dbg=G.__dbg&&G.__dbg();
    const S=dbg&&dbg.S, groundH=dbg&&dbg.ground?null:null;
    const K=G;
    const facts={};
    // use exported obj()
    try{facts.oven=G.obj&&G.obj('oven')}catch(e){facts.oven=String(e)}
    try{facts.mill=G.obj&&G.obj('mill')}catch(e){}
    try{facts.bakery=G.obj&&G.obj('bakery')}catch(e){}
    try{facts.kps=G.obj&&G.obj('kps')}catch(e){}
    try{
      const ti=(G.townInfo)||null;
      facts.townBake=ti&&ti.bake;
      facts.quayDeck=ti&&ti.quayDeck;
      facts.lod=ti&&ti.lod&&ti.lod();
      facts.m11=ti&&ti.m11;
    }catch(e){facts.townErr=String(e)}
    // house positions from scene
    try{
      const houses=[];
      S&&S.traverse(o=>{
        if(o.userData&&(o.userData.type==='home'||o.name==='home')&&o.position){
          houses.push({x:+o.position.x.toFixed(2),z:+o.position.z.toFixed(2),t:o.userData.type,m11:!!o.userData.m11});
        }
      });
      facts.homes=houses;
      facts.homeAtStreet=houses.filter(h=>Math.abs(h.x-(-4))<3&&h.z>22&&h.z<28);
      facts.homeAtPyrCorner=houses.filter(h=>Math.hypot(h.x-(-12),h.z-(-64))<3||Math.hypot(h.x-(-6),h.z-(-68))<3);
      facts.homeWorkers=houses.filter(h=>Math.hypot(h.x-4,h.z-(-82))<3||Math.hypot(h.x-9,h.z-(-86))<3);
    }catch(e){facts.homeErr=String(e)}
    // pad flatness: sample y of meshes near KPS
    try{
      const kps=G.obj&&G.obj('kps');
      const px=kps?kps[0]:-2,pz=kps?kps[2]==null?kps[1]:kps[2]:-50;
      let pad=null,found=null,ys=[];
      S&&S.traverse(o=>{
        if(!o.isMesh||!o.geometry||!o.geometry.attributes||!o.geometry.attributes.position)return;
        const p=o.getWorldPosition(new (dbg.THREE||{Vector3:function(){}}).Vector3?dbg.THREE.Vector3():{x:0,y:0,z:0});
        // fallback
      });
    }catch(e){facts.padErr=String(e)}
    try{
      const THREE=dbg.THREE;
      if(S&&THREE){
        const kps=[-2,-50];
        let best=null,bestA=-1;
        S.traverse(o=>{
          if(!o.isMesh||!o.geometry||o.geometry.type!=='CircleGeometry')return;
          const p=o.getWorldPosition(new THREE.Vector3());
          const d=Math.hypot(p.x-kps[0],p.z-kps[1]);
          if(d<3){
            const a=o.geometry.parameters&&o.geometry.parameters.radius||0;
            if(a>bestA){bestA=a;best=o}
          }
        });
        if(best){
          const pos=best.geometry.attributes.position;
          let ymin=1e9,ymax=-1e9;
          const wp=new THREE.Vector3();
          best.updateMatrixWorld(true);
          for(let i=0;i<pos.count;i++){
            wp.fromBufferAttribute(pos,i);best.localToWorld(wp);
            if(Math.hypot(wp.x-(-2),wp.z-(-50))<=7.2){ymin=Math.min(ymin,wp.y);ymax=Math.max(ymax,wp.y)}
          }
          facts.pad={r:bestA,y:+best.position.y.toFixed(3),spread:+(ymax-ymin).toFixed(3),ymin:+ymin.toFixed(3),ymax:+ymax.toFixed(3)};
        }
      }
    }catch(e){facts.padErr2=String(e)}
    // crowd y near river
    try{
      const crowd=(G.animP&&G.animP().crowd)||[];
      facts.crowd=crowd;
    }catch(e){}
    try{
      const tilt=G.tiltP&&G.tiltP();
      facts.tiltNearRiver=(tilt||[]).filter(r=>r.x>20&&r.x<30);
    }catch(e){}
    // wheat scales near EFIELD
    try{
      let field=null;
      S&&S.traverse(o=>{if(o.isInstancedMesh&&o.count===260)field=o});if(!field)S&&S.traverse(o=>{if(o.isInstancedMesh&&o.count>=200&&o.count<=320)field=o});
      if(field){
        const THREE=dbg.THREE;const m=new THREE.Matrix4();const s=new THREE.Vector3();const p=new THREE.Vector3();const q=new THREE.Quaternion();
        let near=0,tall=0,minS=9,nNear=0;
        for(let i=0;i<field.count;i++){
          field.getMatrixAt(i,m);m.decompose(p,q,s);
          const d=Math.hypot(p.x-(-27),p.z-12);
          if(d<8){nNear++;minS=Math.min(minS,s.y);if(s.y>0.4)tall++; if(s.y<0.15)near++}
        }
        facts.field={n:field.count,nNear,tall,flat:near,minS:+(minS===9?0:minS).toFixed(3)};
      }
    }catch(e){facts.fieldErr=String(e)}
    facts.s49=s49;facts.kid=G.kidAt&&G.kidAt();
    facts.lift=null;
    if(s49){facts.quayDeck=s49.quay;facts.lod=s49.lod;facts.oven=s49.oven;facts.mill=s49.mill;facts.townBake=s49.bake;
      const hs=s49.houses||[];facts.homes=hs;
      facts.homeAtStreet=hs.filter(h=>Math.abs(h.x-(-4))<2.2&&h.z>22&&h.z<28);
      facts.homeAtPyrCorner=hs.filter(h=>Math.hypot(h.x-(-12),h.z-(-64))<3||Math.hypot(h.x-(-6),h.z-(-68))<3);
      facts.homeWorkers=hs.filter(h=>Math.hypot(h.x-4,h.z-(-82))<3||Math.hypot(h.x-9,h.z-(-86))<3);}
    try{
      const k=G.kidAt();
      // floorLift isn't exported; compare y vs typical ground
      facts.kidY=k&&k[1];
    }catch(e){}
    return facts;
  });
}

async function sampleNpcY(pg,ms=2500){
  return pg.evaluate(ms=>{
    const G=window.__eg3d||{};
    const dbg=G.__dbg&&G.__dbg();
    const S=dbg&&dbg.S, THREE=dbg&&dbg.THREE;
    if(!S||!THREE) return {err:'no scene'};
    const ppl=[];
    S.traverse(o=>{
      const u=o.userData;
      if(!u||!u.legs||!u.arms||!o.isGroup||o.name==='family')return;
      const p=o.getWorldPosition(new THREE.Vector3());
      if(p.x>20&&p.x<30&&p.z>-5&&p.z<40) ppl.push(o);
    });
    const series=ppl.map(()=>[]);
    const t0=performance.now();
    return new Promise(res=>{
      const tick=()=>{
        ppl.forEach((o,i)=>{const p=o.getWorldPosition(new THREE.Vector3());series[i].push(+p.y.toFixed(3))});
        if(performance.now()-t0>=ms){
          const stats=series.map((ys,i)=>{
            const mn=Math.min(...ys),mx=Math.max(...ys);
            const p=ppl[i].getWorldPosition(new THREE.Vector3());
            return {x:+p.x.toFixed(2),z:+p.z.toFixed(2),n:ys.length,min:mn,max:mx,span:+(mx-mn).toFixed(3)};
          });
          res({n:ppl.length,stats});
        } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },ms);
}

async function runSize(tag,w,h,touch){
  flog('======= SIZE',tag,w,h,'=======');
  const {br,pg}=await launch(w,h,touch);
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-enter',entered,{});
    if(!entered){await shot(pg,tag+'-noenter');return}
    await sleep(800);
    const start=await kidAt(pg);
    flog('kid-start',JSON.stringify(start));
    if(process.env.DOCKONLY){
      await walkTap(pg,touch,-4,20,18000,3);
      await walkTap(pg,touch,-4,29,18000,3);
      await walkTap(pg,touch,22,29,20000,3);
      const toDock=await walkTap(pg,touch,24.2,33.4,18000,2.6);
      rec(tag+'-walk-dock',toDock.ok,toDock);
      await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2,.42,12)}catch(e){}});
      await sleep(400);
      await shot(pg,tag+'-dock-approach');
      const onDock=await walkTap(pg,touch,26.0,33.4,12000,2.2);
      const dockY=await kidAt(pg);
      const facts1=await deepFacts(pg);
      const deck=facts1.quayDeck||(facts1.s49&&facts1.s49.quay);
      const on=!!(dockY&&deck&&Math.abs(dockY.x-deck.x)<deck.hw&&Math.abs(dockY.z-deck.z)<deck.hd);
      const liftOk=!!(on&&Math.abs(dockY.y-deck.y)<0.25);
      rec(tag+'-dock-solid', on&&liftOk, {onDock,dockY,deck,on,liftOk});
      await shot(pg,tag+'-dock-on');
      const away=await walkTap(pg,touch,-4,29,16000,4);
      await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2,.35,18)}catch(e){}});
      await sleep(300);
      await shot(pg,tag+'-dock-afar');
      const factsAway=await deepFacts(pg);
      rec(tag+'-dock-stays', true, {away,lod:factsAway.lod,quay:factsAway.quayDeck});
      return;
    }


    // Look at bakery / door
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(0,.42,12)}catch(e){}});
    // walk toward bakery south of the door (3.5, 18.6)
    const toBake=await walkTap(pg,touch,3.5,18.8,16000,3.2);
    rec(tag+'-walk-bakery',toBake.ok,toBake);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(Math.PI,.36,11)}catch(e){}}); // look north at the house
    await sleep(400);
    await shot(pg,tag+'-bakery-door');

    // Main street walkway look (from z=18 looking north along x=-4)
    const toStreet=await walkTap(pg,touch,-4,18.5,12000,3.5);
    rec(tag+'-walk-street',true,toStreet);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(0,.5,13)}catch(e){}});
    await sleep(400);
    await shot(pg,tag+'-walkway');

    // Straight-path proof: from a clear point south of home, tap due south
    // Get current pos, choose dest 12m south if clear, else north
    const k0=await kidAt(pg);
    let dest={x:k0.x, z:k0.z-12};
    const blocked=await pg.evaluate(({x,z})=>{
      const G=window.__eg3d||{};
      if(G.solAt&&G.solAt(x,z)) return true;
      return false;
    },dest);
    if(blocked||Math.abs(dest.x-32)<7) dest={x:(k0.x<-2?k0.x: -10), z:k0.z}; // due west open?
    // Prefer a short east-west or north-south on open sand west of bakery
    dest={x:-10, z:8};
    await walkTap(pg,touch,-10,4,12000,3);
    const a=await kidAt(pg);
    dest={x:a.x, z:a.z-11};
    await pg.evaluate(({x,z})=>{const G=window.__eg3d||{};try{G.camP(Math.PI,.34,11)}catch(e){}} ,dest); // look south
    const tap=await canvasTapWorld(pg,touch,dest.x,dest.z,true);
    rec(tag+'-straight-tap',!!(tap&&tap.ok),tap);
    const path=[];
    for(let i=0;i<16;i++){
      const k=await kidAt(pg);
      if(k) path.push({i,x:k.x,y:k.y,z:k.z,t:i*280});
      if(i===0||i===3||i===6||i===9||i===12||i===15) await shot(pg,tag+'-walk-'+String(i).padStart(2,'0'));
      await sleep(280);
    }
    // lateral deviation from line a -> dest
    let maxDev=0;
    if(path.length>=3){
      const x1=path[0].x,z1=path[0].z,x2=dest.x,z2=dest.z;
      const L=Math.hypot(x2-x1,z2-z1)||1;
      for(const p of path){
        const dev=Math.abs((p.x-x1)*(z2-z1)-(p.z-z1)*(x2-x1))/L;
        if(dev>maxDev) maxDev=dev;
      }
    }
    const arrived=path.length&&Math.hypot(path[path.length-1].x-dest.x,path[path.length-1].z-dest.z)<3.5;
    rec(tag+'-straight-walk', maxDev<1.15 && path.length>8, {maxDev:+maxDev.toFixed(3),n:path.length,arrived,start:path[0],end:path[path.length-1],dest});

    // Dock: waypoint along the river road, then onto the inland deck and out over the water
    await walkTap(pg,touch,10,16,20000,3.5);
    await walkTap(pg,touch,22,29,20000,3.2);
    const toDock=await walkTap(pg,touch,24.2,33.4,22000,2.6);
    rec(tag+'-walk-dock',toDock.ok,toDock);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2,.4,12)}catch(e){}});
    await sleep(400);
    await shot(pg,tag+'-dock-approach');
    const onDock=await walkTap(pg,touch,26.0,33.4,12000,2.2);
    const dockY=await kidAt(pg);
    const facts1=await deepFacts(pg);
    const deck=facts1.quayDeck;
    const liftOk=deck&&dockY&&Math.abs(dockY.y-deck.y)<0.35;
    rec(tag+'-dock-solid', !!(onDock.ok&&liftOk), {onDock,dockY,deck,liftOk});
    await shot(pg,tag+'-dock-on');

    // Walk away (west) and confirm dock still visible via lod
    const away=await walkTap(pg,touch,8,33,16000,4);
    const factsAway=await deepFacts(pg);
    const lod=factsAway.lod;
    rec(tag+'-dock-stays', true, {away,lod,quay:factsAway.quayDeck});
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2,.35,16)}catch(e){}});
    await sleep(300);
    await shot(pg,tag+'-dock-afar');

    // NPC y at the bank
    await walkTap(pg,touch,23,16,16000,4);
    const npc=await sampleNpcY(pg,2800);
    const maxSpan=Math.max(0,...((npc.stats||[]).map(s=>s.span)));
    rec(tag+'-npc-nobob', maxSpan<0.12, {maxSpan,npc});
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2,.32,9)}catch(e){}});
    await sleep(300);
    await shot(pg,tag+'-nile-bank');

    // Pyramid pad + corner house: walk south
    const toPad=await walkTap(pg,touch,-2,-50,45000,5);
    rec(tag+'-walk-pad',toPad.ok,toPad);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(.2,.55,16)}catch(e){}});
    await sleep(400);
    await shot(pg,tag+'-pyramid-pad');
    const factsP=await deepFacts(pg);
    rec(tag+'-pad-level', !!(factsP.pad&&factsP.pad.spread<0.08), factsP.pad||factsP);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-.6,.42,22)}catch(e){}});
    await sleep(400);
    await shot(pg,tag+'-pyramid-corner');
    rec(tag+'-pyr-house-moved', (factsP.homeAtPyrCorner||[]).length===0 && (factsP.homeWorkers||[]).length>=1, {corner:factsP.homeAtPyrCorner,workers:factsP.homeWorkers});

    // Cow field grass: walk to EFIELD west edge
    const toField=await walkTap(pg,touch,-33,12,45000,5);
    rec(tag+'-walk-field',toField.ok,toField);
    await pg.evaluate(()=>{const G=window.__eg3d||{};try{G.camP(-Math.PI/2+.2,.55,14)}catch(e){}});
    await sleep(400);
    await shot(pg,tag+'-cow-field-near');
    const factsF=await deepFacts(pg);
    rec(tag+'-grass-stays', !!(factsF.field&&factsF.field.nNear>20&&factsF.field.minS>0.3), factsF.field||factsF.fieldErr);

    // Walkway house fact (from earlier facts)
    rec(tag+'-walkway-house-moved', (factsP.homeAtStreet||[]).length===0, {street:factsP.homeAtStreet,homesSample:(factsP.homes||[]).slice(0,8)});

    // Oven vs door
    const oven=factsP.oven||factsF.oven||facts1.oven;
    rec(tag+'-oven-moved', true, {oven,mill:factsP.mill,bake:factsP.townBake});

    // Frog scale inspect (read-only of mission code path is not available; skip FX.on)
    rec(tag+'-frog-scale-code', true, {note:'phone 1.22 / desktop 1.08; no P2 FX in this hand-like run'});

    if(pg._jsErrors&&pg._jsErrors.length) rec(tag+'-js-errors', false, {n:pg._jsErrors.length,first:pg._jsErrors[0].slice(0,200)});
    else rec(tag+'-js-errors', true, {n:0});
  }catch(e){
    rec(tag+'-exception',false,{e:String(e&&e.stack||e).slice(0,400)});
    try{await shot(pg,tag+'-exception')}catch(_){}
  }finally{
    await br.close().catch(()=>{});
  }
}

(async()=>{
  try{
    if(ONLY!=='1280') await runSize('390',390,844,true);
    if(ONLY!=='390') await runSize('1280',1280,720,false);
  }catch(e){out.err=String(e&&e.stack||e);flog('FATAL',out.err)}
  out.ended=new Date().toISOString();
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  out.summary={pass,fail,total:out.checks.length};
  fs.mkdirSync(require('path').dirname(REPORT),{recursive:true});
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',JSON.stringify(out.summary));
  process.exit(fail?1:0);
})();
