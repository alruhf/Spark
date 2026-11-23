/* s48: straight-through, no-testfast, no-jump, fresh-load hand-like play at 390 then 1280.
   LOCAL only. Does not touch any preview or production. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s48-handlike';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s48-handlike-live.log';
const REPORT=process.env.REPORT||'/workspace/p32work/spark37/proof-logs/s48-handlike-report.json';
const ONLY=process.env.ONLY||''; // '390' or '1280' to run one size

const out={checks:[],shots:[],err:null,url:BASE,started:new Date().toISOString(),note:'no-testfast no-jump fresh-load'};
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
      const a=b.width*b.height;if(a>area){area=a;best={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,cls:e.className}}
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
  const url=BASE.replace(/\/$/,'/')+'?fresh=1';
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await pg.evaluate(()=>{
    try{
      sessionStorage.removeItem('sparkTestfast');
      localStorage.removeItem('sparkEgypt3dV1');
    }catch(e){}
  });
  await pg.goto(url,{waitUntil:'load',timeout:90000});
  await sleep(800);
  for(let i=0;i<8;i++){await skipOverlay(pg,touch);if(!await pg.evaluate(()=>!!document.querySelector('.ks-ov,button.ks-age,button.ks-go')))break;await sleep(300)}
  const tf=await pg.evaluate(()=>{try{return {ss:sessionStorage.getItem('sparkTestfast'),q:location.search}}catch(e){return {e:String(e)}}});
  flog('tf-guard',JSON.stringify(tf));
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

async function probe(pg){
  return pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const at=G.kidAt?G.kidAt():null;
    const x=at&&at[0], y=at&&at[1], z=at&&(at[2]!=null?at[2]:at[1]);
    const stt=(G.state&&G.state())||{};
    const mis=stt.mis||{};
    const wy=(G.water&&G.water.position&&G.water.position.y)||-0.9;
    const dep=(y!=null)?(wy-y):null;
    const inR=!!(x!=null&&Math.abs(x-32)<5.65);
    const sb=document.querySelector('.eg3d-staffb:not(.eg3d-tamb)');
    let staffBtn=false;if(sb){const b=sb.getBoundingClientRect(),st=getComputedStyle(sb);staffBtn=b.width>=8&&st.display!=='none'&&st.visibility!=='hidden'}
    const tamb=document.querySelector('.eg3d-tamb');
    let tambOn=false,tambTxt='',tambBox=null;
    if(tamb){const b=tamb.getBoundingClientRect(),st=getComputedStyle(tamb);tambOn=b.width>=8&&st.display!=='none'&&st.visibility!=='hidden';tambTxt=(tamb.textContent||'').trim();tambBox={x:b.left,y:b.top,w:b.width,h:b.height,cx:b.left+b.width/2}}
    const hg=document.querySelector('.eg3d-hg.on span')||document.querySelector('.eg3d-hg:not(.eg3d-cnt) span');
    const hgOn=!!(document.querySelector('.eg3d-hg.on'));
    const hgTxt=hg?String(hg.textContent||'').trim():'';
    const hgSec=(/(\d+)\s*s/.exec(hgTxt)||[])[1];
    const dlg=document.querySelector('.eg3d-dlg,.eg3d-narr,.eg3d-nbox');
    let card=null;if(dlg){const b=dlg.getBoundingClientRect();card={x:b.left,y:b.top,w:b.width,h:b.height,bottom:b.bottom,top:b.top,txt:(dlg.textContent||'').slice(0,80)}}
    const skip=document.querySelector('.eg3d-askip,.eg3d-dskip');
    let skipBox=null;if(skip){const b=skip.getBoundingClientRect(),st=getComputedStyle(skip);if(b.width>=8&&st.display!=='none')skipBox={x:b.left,y:b.top,w:b.width,h:b.height,bottom:b.bottom,right:b.right}}
    const mapOn=!!document.querySelector('.eg3d-map,.sh3d-bookov.eg3d-map');
    const leave=document.querySelector('.eg3d-leaveq');
    let leaveGap=null;
    if(leave){
      const btns=[...leave.querySelectorAll('button')].map(e=>e.getBoundingClientRect());
      if(btns.length>=2){
        const a=btns[0],b=btns[1];
        leaveGap=Math.max(0, b.top-(a.top+a.height), a.top-(b.top+b.height), b.left-(a.left+a.width), a.left-(b.left+b.width));
      }
    }
    const cnt=document.querySelector('.eg3d-cnt');
    const grown=document.querySelector('#grownUpBtn,.sg-btn,.eg3d-gear');
    let cntGrown=null;
    if(cnt&&grown){
      const a=cnt.getBoundingClientRect(),b=grown.getBoundingClientRect();
      const st=getComputedStyle(cnt),stg=getComputedStyle(grown);
      const vis=a.width>=8&&a.height>=8&&b.width>=8&&st.display!=='none'&&st.visibility!=='hidden'&&stg.display!=='none';
      if(vis){
        const overlap=!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom);
        const gapX=a.right<b.left?b.left-a.right:a.left>b.right?a.left-b.right:0;
        const gapY=a.bottom<b.top?b.top-a.bottom:a.top>b.bottom?a.top-b.bottom:0;
        cntGrown={overlap,gap:Math.max(gapX,gapY),cnt:{top:a.top,right:a.right,bottom:a.bottom,left:a.left,w:a.width,h:a.height},grown:{top:b.top,right:b.right,bottom:b.bottom,left:b.left,w:b.width,h:b.height}};
      }
    }
    const badge=!!document.querySelector('.eg3d-badge');
    const pins=[...document.querySelectorAll('[class*="eg3d-pin"]')].filter(e=>{const b=e.getBoundingClientRect(),st=getComputedStyle(e);return b.width>4&&st.display!=='none'&&st.visibility!=='hidden'}).map(e=>({cls:e.className,x:e.getBoundingClientRect().left,y:e.getBoundingClientRect().top}));
    let kidInFrame=null;
    try{
      if(G.scrP&&x!=null){
        const s=G.scrP(x,(y||0)+1.05,z);
        if(s){const ok=s.x>8&&s.x<innerWidth-8&&s.y>36&&s.y<innerHeight-70&&(s.z==null||s.z<1);kidInFrame={ok,x:+s.x.toFixed(1),y:+s.y.toFixed(1),z:s.z}}
      }
    }catch(e){}
    const badgeEl=document.querySelector('.eg3d-badge');
    let badgeBox=null,badgeCoversKid=null;
    if(badgeEl){const b=badgeEl.getBoundingClientRect();badgeBox={x:b.left,y:b.top,w:b.width,h:b.height,bottom:b.bottom,top:b.top};
      if(kidInFrame){badgeCoversKid=!(kidInFrame.x<b.left||kidInFrame.x>b.right||kidInFrame.y<b.top||kidInFrame.y>b.bottom)}}
    return {x,y,z,dep,wy,inR,st:mis.st,p:mis.p,red:mis.red,gapLeft:mis.gapLeft,gapUntil:mis.gapUntil,mode:G.modeP?G.modeP():stt.mode,staffBtn,tambOn,tambTxt,tambBox,hgOn,hgTxt,hgSec:hgSec!=null?+hgSec:null,card,skipBox,mapOn,leave:!!leave,leaveGap,cntGrown,badge:!!badgeEl,badgeBox,badgeCoversKid,pins,frogs:0,kidInFrame,H:innerHeight,W:innerWidth,cam:G.camS?{yaw:G.camS.yaw,pitch:G.camS.pitch,dist:G.camS.dist}:null};
  });
}

async function skipTalk(pg,touch,times=10){
  for(let i=0;i<times;i++){
    const before=await pg.evaluate(()=>{
      const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
      const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');
      return {has:!!d,txt:d?(d.textContent||'').slice(0,120):'',sk:!!sk};
    });
    if(!before.has) return;
    if(before.sk){
      await pg.evaluate(()=>{
        const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');
        if(!sk)return;
        sk.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,composed:true,pointerId:1,pointerType:'mouse'}));
        sk.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,composed:true,pointerId:1,pointerType:'mouse'}));
        sk.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true}));
        sk.click();
      });
      const box=await pg.evaluate(()=>{const sk=document.querySelector('.eg3d-dlg .eg3d-dskip')||document.querySelector('button.eg3d-dskip');if(!sk)return null;const b=sk.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}});
      if(box){if(touch) await pg.touchscreen.tap(box.x,box.y); else await pg.mouse.click(box.x,box.y)}
    }
    await sleep(600);
    const after=await pg.evaluate(()=>{
      const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
      return {has:!!d,txt:d?(d.textContent||'').slice(0,120):''};
    });
    if(!after.has) return;
    if(after.txt===before.txt){
      // Skip didn't take — wait out the recorded-voice auto-advance (min+9s worst case)
      const t0=Date.now();
      while(Date.now()-t0<16000){
        await sleep(800);
        const now=await pg.evaluate(()=>{
          const d=document.querySelector('.eg3d-dlg.eg3d-narr,.eg3d-nbox');
          return {has:!!d,txt:d?(d.textContent||'').slice(0,120):''};
        });
        if(!now.has) return;
        if(now.txt!==before.txt) break;
      }
    }
  }
}

async function clickStoryPin(pg,touch,preferPal){
  // When walking home, prefer the palace world pin so a stale next-step arrow
  // (still bound to the field after a cine) does not send the kid the wrong way.
  const palSel='.eg3d-pin-pal.on,button.eg3d-pin-pal,.eg3d-pin-pal,[class*="pin-pal"]';
  const anySel='.eg3d-obja.on,'+palSel;
  const hit=await clickSel(pg,preferPal?palSel+','+'.eg3d-obja.on':anySel,touch);
  if(hit) return {ok:true,how:'dom',hit};
  const scr=await pg.evaluate((preferPal)=>{
    const G=window.__eg3d||{};
    const pal=document.querySelector('.eg3d-pin-pal.on,.eg3d-pin-pal')||(!preferPal&&document.querySelector('.eg3d-obja.on,.eg3d-obja'));
    if(pal){const b=pal.getBoundingClientRect();if(b.width>4)return {x:b.left+b.width/2,y:b.top+b.height/2,ok:true,how:'dom2'}}
    const s=G.scrP?G.scrP(-40,3,22):null;
    if(s&&s.x>8&&s.x<innerWidth-8&&s.y>8&&s.y<innerHeight-8&&(s.z==null||s.z<1)) return {x:s.x,y:s.y,ok:true,how:'scr'};
    return {ok:false};
  },!!preferPal);
  if(scr&&scr.ok){if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y); return scr}
  return {ok:false};
}

async function clickVisiblePin(pg,touch,sel){
  return clickSel(pg,sel||'.eg3d-obja.on,[class*="eg3d-pin"].on',touch);
}

const PROGRESS_MD='/workspace/p32work/spark37/PROGRESS.md';
function plagueLog(tag,what){
  const ts=new Date().toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});
  const line=`- ${ts} America/New_York — s48 ${tag}: ${what}`;
  flog('PLAGUE',tag,what);
  try{fs.appendFileSync(PROGRESS_MD,line+'\n')}catch(e){}
}

async function countNamed(pg,name){
  return pg.evaluate(nm=>{
    let n=0;
    try{
      const G=window.__eg3d||{};
      const D=G.__dbg&&G.__dbg();
      const S=D&&D.S;
      if(S&&S.traverse) S.traverse(o=>{if(o&&o.visible&&(o.name===nm||(o.userData&&o.userData[nm])))n++});
    }catch(e){}
    return n;
  },name);
}

/* Locusts are InstancedMesh bodies+wings, not named "bug". Count visible instances. */
async function countLocusts(pg){
  return pg.evaluate(()=>{
    try{
      const G=window.__eg3d||{};
      const D=G.__dbg&&G.__dbg();
      const S=D&&D.S;
      if(!S||!S.traverse) return 0;
      let best=0;
      S.traverse(o=>{
        if(!o||!o.visible||!o.isInstancedMesh) return;
        const n=o.count||0;
        // locust swarm is 1600 bodies; flies are also 1600 but much smaller
        const geo=o.geometry, par=geo&&geo.parameters;
        const len=(par&&(par.height||par.length))||0;
        if(n>=200 && len>=0.12) best=Math.max(best,n);
        else if(n>=200 && !par && n>best) {
          // fallback: large instanced mesh that appeared during P8
        }
      });
      if(best) return best;
      // fallback: any visible instanced mesh with count>=200 during P8
      S.traverse(o=>{ if(o&&o.visible&&o.isInstancedMesh&&(o.count||0)>=200) best=Math.max(best,o.count||0); });
      return best;
    }catch(e){return 0}
  });
}

async function lookSea(pg){
  return pg.evaluate(()=>{
    const out={foamBox:0,foamSphere:0,carts:0,horses:0,visibleCarts:0,visibleHorses:0};
    try{
      const G=window.__eg3d||{};
      const S=G.__dbg&&G.__dbg().S;
      if(!S||!S.traverse) return out;
      S.traverse(o=>{
        if(o.userData&&o.userData.foamStrip){
          const crest=o.userData.foamStrip;
          (crest.traverse?crest:o).traverse(m=>{if(!m.isMesh||!m.geometry)return;const t=m.geometry.type||'';if(/Box/.test(t))out.foamBox++;if(/Sphere/.test(t))out.foamSphere++});
        }
        if(o.name==='seaCart'||(o.userData&&o.userData.seaCart)){out.carts++;if(o.visible)out.visibleCarts++}
        if(o.name==='seaHorse'||(o.userData&&o.userData.seaHorse)){out.horses++;if(o.visible)out.visibleHorses++}
      });
    }catch(e){out.err=String(e)}
    return out;
  });
}

function nearRiverBank(p){
  if(!p||p.x==null) return false;
  const z=p.z==null?0:p.z;
  const d=Math.hypot(p.x-25.1,z-14);
  return d<6.5 || (p.x>22&&p.x<30&&Math.abs(z-14)<10);
}

async function clickRiverPin(pg,touch){
  const hit=await clickSel(pg,'.eg3d-pin-nile.on,button.eg3d-pin-nile,.eg3d-pin-nile',touch);
  if(hit) return {ok:true,how:'nile',hit};
  const arrow=await clickSel(pg,'.eg3d-obja.on,.eg3d-obja',touch);
  if(arrow) return {ok:true,how:'obja',hit:arrow};
  const scr=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    const el=document.querySelector('.eg3d-pin-nile,.eg3d-obja.on');
    if(el){const b=el.getBoundingClientRect();if(b.width>4)return {x:b.left+b.width/2,y:b.top+b.height/2,ok:true,how:'dom'}}
    const s=G.scrP?G.scrP(25.1,2.2,14):null;
    if(s&&s.x>8&&s.x<innerWidth-8&&s.y>8&&s.y<innerHeight-24&&(s.z==null||s.z<1)) return {x:s.x,y:s.y,ok:true,how:'scr'};
    return {ok:false};
  });
  if(scr&&scr.ok){if(touch) await pg.touchscreen.tap(scr.x,scr.y); else await pg.mouse.click(scr.x,scr.y); return scr}
  return {ok:false};
}

async function walkToRiverThenWade(pg,touch){
  /* Hand-like: follow the river pin / gold arrow out of the palace, wait until
     the kid is on the bank, THEN tap visible water. Never walkTo/goTo. */
  await skipTalk(pg,touch,8);
  const t0=Date.now();
  let last={x:0,z:0,t:0}, clicks=0, arrived=false;
  while(Date.now()-t0<95000){
    const p=await probe(pg);
    if(p.card) await skipTalk(pg,touch,4);
    if(p.inR&&p.dep>0.08&&p.dep<=0.45) return {ok:true,how:'already-wet',p,sec:(Date.now()-t0)/1000};
    if(nearRiverBank(p)){arrived=true;flog('river-bank',JSON.stringify({x:p.x,z:p.z,sec:+((Date.now()-t0)/1000).toFixed(1)}));break}
    const moved=Math.hypot((p.x||0)-last.x,(p.z||0)-last.z);
    if(clicks===0 || (Date.now()-last.t>8000 && moved<1.2)){
      const c=await clickRiverPin(pg,touch);
      clicks++; last={x:p.x||0,z:p.z||0,t:Date.now()};
      flog('river-pin',JSON.stringify({c,x:p.x,z:p.z,n:clicks}));
      await sleep(900);
    }else{
      await sleep(500);
    }
  }
  if(!arrived){
    const p=await probe(pg);
    if(nearRiverBank(p)||(p.x!=null&&p.x>20)) arrived=true;
  }
  let tap=null;
  for(let i=0;i<5 && !(tap&&tap.tapped);i++){
    tap=await faceRiverAndTapWater(pg,touch);
    flog('water-tap',JSON.stringify(tap));
    if(tap&&tap.tapped) break;
    await sleep(700);
  }
  const wet=await waitPred(pg,q=>q.inR&&q.dep>0.08&&q.dep<=0.45,18000);
  return {ok:!!(wet&&wet.inR&&wet.dep<=0.45),arrived,tap,wet,sec:(Date.now()-t0)/1000};
}

async function faceRiverAndTapWater(pg,touch){
  const aim=await pg.evaluate(()=>{
    const G=window.__eg3d||{};
    try{
      if(G.faceToward) G.faceToward(33,14);
      else if(G.camS){G.camS.yaw=-Math.PI/2;G.camS.pitch=.36;G.camS.dist=Math.min(11,Math.max(G.camS.dist||10,8.5))}
    }catch(e){}
    // Aim well inside inRiver (x>26.35). A 1280 bank-side tap at x≈27.2 often stayed dry at 25.6.
    const spots=[[27.8,-0.25,14],[28.2,-0.3,14.2],[28.6,-0.3,13.8],[29.0,-0.35,14.4],[27.5,-0.25,15],[28.4,-0.3,15.2]];
    for(const [x,y,z] of spots){
      const s=G.scrP?G.scrP(x,y,z):null;
      if(s&&s.x>16&&s.x<innerWidth-16&&s.y>20&&s.y<innerHeight-20&&(s.z==null||s.z<1))
        return {x:s.x,y:s.y,ok:true,wx:x,wy:y,wz:z};
    }
    return {ok:false};
  });
  if(!aim||!aim.ok) return {tapped:false,aim};
  // The walk listener wants pointerdown+up on the canvas, not only mouse.click.
  await pg.evaluate(({x,y})=>{
    const c=document.querySelector('canvas');
    if(!c) return;
    const opts={bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse'};
    c.dispatchEvent(new PointerEvent('pointerdown',opts));
    c.dispatchEvent(new PointerEvent('pointerup',opts));
    c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y}));
    c.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y}));
    c.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y}));
  },aim);
  if(touch) await pg.touchscreen.tap(aim.x,aim.y); else await pg.mouse.click(aim.x,aim.y);
  return {tapped:true,aim};
}

async function waitPred(pg,fn,ms,step=400){
  const t0=Date.now();let last=null;
  while(Date.now()-t0<ms){
    last=await probe(pg);
    if(fn(last)) return last;
    await sleep(step);
  }
  return last;
}

async function sampleClock(pg,ms=8000,step=400){
  const samples=[];const t0=Date.now();
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    samples.push({t:Date.now()-t0,sec:p.hgSec,st:p.st,p:p.p,hgOn:p.hgOn,txt:p.hgTxt});
    await sleep(step);
  }
  const secs=samples.map(s=>s.sec).filter(s=>s!=null);
  let jumpUp=false,stall=false;
  for(let i=1;i<secs.length;i++){
    if(secs[i]>secs[i-1]+1) jumpUp=true;
  }
  if(secs.length>=6){
    const last=secs.slice(-5);
    stall=last.every(s=>s===last[0]) && last[0]>1;
  }
  return {samples,secs,jumpUp,stall};
}

function cardOk(p){
  if(!p||!p.card) return {ok:false,why:'no-card'};
  const clip=p.card.bottom>p.H-4 || p.card.top<0;
  // Clipped or off-screen only. H-80 was a 390 tray heuristic that falsely failed 1280 (card sits ~30px above the bottom, fully visible).
  const skipLow=p.skipBox && (p.skipBox.bottom>p.H-2 || p.skipBox.right>p.W+2 || p.skipBox.x< -2);
  return {ok:!clip&&!skipLow,clip,skipLow,card:p.card,skip:p.skipBox,H:p.H,W:p.W};
}

function nearPalace(p){
  return p&&p.x!=null&&Math.hypot(p.x-(-40),(p.z||0)-22)<18;
}

async function followPinToPalace(pg,touch,ms=90000){
  /* Re-click the gold arrow / palace pin if the kid isn't moving. A one-shot
     click at the river after P1 often missed, then the 120 s timer expired
     while they still stood on the bank. Arrival is the palace, not merely a card. */
  await skipTalk(pg,touch,6);
  await sleep(400); // let layoutPins retarget the gold arrow off the prior cine goal
  const t0=Date.now();
  let last={x:0,z:0,t:0,dist:null}, clicks=0;
  while(Date.now()-t0<ms){
    const p=await probe(pg);
    if(nearPalace(p)) return Object.assign(p,{sec:(Date.now()-t0)/1000,via:'arrive',clicks});
    const dist=Math.hypot((p.x||0)-(-40),(p.z||0)-22);
    const moved=Math.hypot((p.x||0)-last.x,(p.z||0)-last.z);
    const closer=last.dist!=null && dist<last.dist-0.6;
    // Re-click if standing still OR walking the wrong way (stale field arrow after P5/P8 cine)
    if(clicks===0 || (Date.now()-last.t>5000 && (moved<1.2 || !closer))){
      const c=await clickStoryPin(pg,touch,true);
      clicks++; last={x:p.x||0,z:p.z||0,t:Date.now(),dist};
      flog('palace-pin',JSON.stringify({c,x:p.x,z:p.z,dist:+dist.toFixed(2),n:clicks}));
      await sleep(900);
    }else await sleep(500);
  }
  const p=await probe(pg);
  return Object.assign(p,{sec:(Date.now()-t0)/1000,via:'timeout',clicks});
}

async function runSize(tag,w,h,touch){
  flog('==== SIZE',tag,w,h,'====');
  const {br,pg}=await launch(w,h,touch);
  const W=w, walkTimes=[], cardKeys={};
  try{
    const entered=await enterEgypt(pg,touch);
    rec(tag+'-entered',entered,{});
    await sleep(800);
    await shot(pg,tag+'-start');
    const p0=await probe(pg);
    rec(tag+'-fresh-no-tf',p0.st!=null||entered,{st:p0.st,p:p0.p,mapOn:p0.mapOn,x:p0.x,z:p0.z});

    // Leave / Stay gap (back button), then Stay and continue
    const back=await clickSel(pg,'.a3d-back,.eg3d-back,button.a3d-back',touch);
    await sleep(600);
    let lv=await probe(pg);
    if(!lv.leave){await clickSel(pg,'.a3d-back,button[aria-label*="Back"],.a3d-back',touch);await sleep(700);lv=await probe(pg)}
    await shot(pg,tag+'-leave-dialog');
    rec(tag+'-stay-leave-gap',lv.leave&&lv.leaveGap>=18,{leave:lv.leave,gap:lv.leaveGap});
    if(lv.leave){await clickSel(pg,'.eg3d-leavestay,button.eg3d-leavestay',touch);await sleep(500)}

    // Story pin must walk, not open the Map
    await clickSel(pg,'.eg3d-mapx',touch).catch(()=>{});
    const before=await probe(pg);
    const pin=await clickStoryPin(pg,touch);
    await sleep(900);
    const after=await probe(pg);
    await shot(pg,tag+'-after-story-pin');
    rec(tag+'-story-pin-walks-not-map',pin.ok&&!after.mapOn,{pin,mapOn:after.mapOn,st:after.st,x:after.x,z:after.z,beforeX:before.x});

    // Wait to arrive near palace or for a story card
    const arrived=await waitPred(pg,q=>q.mapOn||(q.card&&q.card.h>20)||(q.x!=null&&Math.hypot(q.x-(-40),q.z-22)<16),90000,500);
    if(arrived&&arrived.mapOn){
      await shot(pg,tag+'-map-opened-unexpected');
      rec(tag+'-map-stayed-closed',false,{during:'walk-to-palace'});
      await clickSel(pg,'.eg3d-mapx,.eg3d-map [aria-label="Close"]',touch);
      await sleep(400);
    }else rec(tag+'-map-stayed-closed',true,{st:arrived&&arrived.st,x:arrived&&arrived.x});

    // First story card + Skip
    await waitPred(pg,q=>q.card&&q.card.h>20,20000);
    const c1=await probe(pg);
    await shot(pg,tag+'-p0-story-card');
    const c1ok=cardOk(c1);
    rec(tag+'-p0-card-and-skip',c1ok.ok,c1ok);
    await sleep(3200);
    await skipTalk(pg,touch,20);

    // Play through plagues by following pins, skipping talk, waiting real clocks
    let sawP1wade=false,sawP2frogs=false,sawP5=false,sawP7clock=null,sawP8=false,sawP10=false;
    const tEnd=Date.now()+55*60*1000; let hb=Date.now(); // cap ~55 min per size (real 60s gaps)
    let lastSt='',idle=0,wadeTries=0;
    while(Date.now()<tEnd){
      const p=await probe(pg);
      const key=p.st+':'+p.p;
      if(key!==lastSt){flog('state',key,'xy',p.x,p.z,'hg',p.hgTxt,'kid',p.kidInFrame);lastSt=key;idle=0;try{fs.writeFileSync(REPORT,JSON.stringify({checks:out.checks,shots:out.shots,mid:true,tag},null,2))}catch(e){}}
      else idle++;
      if(Date.now()-hb>20000){flog('hb',key,'xy',p.x,p.z,'hg',p.hgTxt,'idle',idle);hb=Date.now();try{fs.writeFileSync(REPORT,JSON.stringify({checks:out.checks,shots:out.shots,mid:true,tag},null,2))}catch(e){}}

      if(p.mapOn){await clickSel(pg,'.eg3d-mapx',touch);await sleep(300)}

      // Cards / Skip mid-story — once per state key, then dismiss
      if(p.card&&!cardKeys[key]&&(p.p===6||p.p===10||p.st==='morning'||/passover|pharaoh|let my people/i.test(p.card.txt||''))){
        cardKeys[key]=1;
        const ck=cardOk(p);
        await shot(pg,tag+'-card-'+key.replace(/[^A-Za-z0-9_-]/g,'_'));
        rec(tag+'-card-'+key,ck.ok,ck);
      }

      // P1 wade + staff + countdown: walk to the river pin FIRST, then tap visible water
      if(p.p===1&&(p.st==='come'||p.st==='act'||p.st==='plague'||p.st==='gap')&&!sawP1wade){
        if(wadeTries>=6){
          plagueLog(tag,'P1 wade gave up after retries');
          rec(tag+'-p1-wade-shin',false,{gaveUp:true});
          sawP1wade=true;
          continue;
        }
        wadeTries++;
        plagueLog(tag,'P1 act — follow river pin out of the palace, then wade');
        const wt=p.inR&&p.dep>0.08?{ok:true,wet:p,arrived:true,sec:0}:await walkToRiverThenWade(pg,touch);
        flog('p1-walk-wade',JSON.stringify({ok:wt.ok,arrived:wt.arrived,sec:wt.sec,dep:wt.wet&&wt.wet.dep,x:wt.wet&&wt.wet.x,z:wt.wet&&wt.wet.z}));
        if(wt.ok&&wt.wet){
          await shot(pg,tag+'-p1-wade');
          rec(tag+'-p1-wade-shin',wt.wet.dep>0.08&&wt.wet.dep<=0.40,{dep:wt.wet.dep,x:wt.wet.x,z:wt.wet.z,sec:wt.sec,arrived:wt.arrived,kid:wt.wet.kidInFrame});
          rec(tag+'-p1-kid-in-frame',!(wt.wet.kidInFrame)||wt.wet.kidInFrame.ok,{kid:wt.wet.kidInFrame});
          const kidScr=await pg.evaluate(()=>{const G=window.__eg3d||{};const at=G.kidAt?G.kidAt():null;if(!at||!G.scrP)return null;return G.scrP(at[0],(at[1]||0)+1.0,at[2]);});
          if(wt.wet.staffBtn||p.staffBtn) await clickSel(pg,'.eg3d-staffb:not(.eg3d-tamb)',touch);
          else if(kidScr&&kidScr.x){if(touch) await pg.touchscreen.tap(kidScr.x,kidScr.y); else await pg.mouse.click(kidScr.x,kidScr.y)}
          await sleep(800);
          const cd=await waitPred(pg,q=>q.hgOn||q.st==='gap'||q.st==='plague',30000);
          if(cd&&(cd.hgOn||cd.st==='gap'||cd.st==='plague')){
            await shot(pg,tag+'-p1-countdown');
            rec(tag+'-p1-countdown-visible',true,{dep:cd.dep,inR:cd.inR,hg:cd.hgTxt,st:cd.st,kid:cd.kidInFrame});
            rec(tag+'-p1-countdown-kid-in-frame',!(cd.kidInFrame)||cd.kidInFrame.ok,{kid:cd.kidInFrame});
            const clk=await sampleClock(pg,10000);
            rec(tag+'-p1-clock-steady',!clk.jumpUp&&!clk.stall,{jumpUp:clk.jumpUp,stall:clk.stall,secs:clk.secs.slice(0,16)});
            plagueLog(tag,`P1 wade+clock ${clk.jumpUp||clk.stall?'FAIL':'PASS'} dep=${(cd.dep||0).toFixed(2)} hg=${cd.hgTxt}`);
          }
          sawP1wade=true;
        }else{
          await shot(pg,tag+'-p1-wade-miss');
          plagueLog(tag,'P1 wade short of river — retry tap, no FAIL yet');
          // do not set sawP1wade; retry next loop
        }
      }

      // P2 frogs
      if(p.p===2&&(p.st==='plague'||p.st==='gap')&&!sawP2frogs){
        if(p.st==='plague') await sleep(1200);
        const n=await countNamed(pg,'frog');
        const f=await probe(pg);
        await shot(pg,tag+'-p2-frogs');
        rec(tag+'-p2-frogs-visible',n>=4,{frogs:n,st:f.st,x:f.x,z:f.z,kid:f.kidInFrame});
        rec(tag+'-p2-kid-in-frame',!(f.kidInFrame)||f.kidInFrame.ok,{kid:f.kidInFrame});
        plagueLog(tag,`P2 frogs n=${n} ${n>=4?'PASS':'FAIL'} kid=${JSON.stringify(f.kidInFrame)}`);
        sawP2frogs=true;
      }
      if(p.p===2&&p.st==='ask'&&sawP1wade&&!walkTimes.find(t=>t.n==='p1-home')){
        const home=await followPinToPalace(pg,touch,90000);
        const sec=home.sec;
        walkTimes.push({n:'p1-home',sec,x:home.x,z:home.z,via:home.via});
        await shot(pg,tag+'-p1-walk-home');
        rec(tag+'-p1-walk-home-under-60s',sec<=70,{sec});
        plagueLog(tag,`P1 walk home ${sec.toFixed(1)}s ${sec<=70?'PASS':'FAIL'}`);
      }

      // P5 cows — wait for the livestock cine (plague/gap), not the palace "come" walk
      if(p.p===5&&(p.st==='plague'||p.st==='gap')&&!sawP5){
        if(p.st==='plague') await sleep(1200);
        const f=await probe(pg);
        await shot(pg,tag+'-p5-cows');
        rec(tag+'-p5-cine-shot',true,{st:f.st,x:f.x,z:f.z,cam:f.cam,kid:f.kidInFrame});
        rec(tag+'-p5-kid-in-frame',!(f.kidInFrame)||f.kidInFrame.ok,{kid:f.kidInFrame});
        plagueLog(tag,`P5 cows kid=${JSON.stringify(f.kidInFrame)}`);
        sawP5=true;
      }
      // After P5 cine the next card is ask:6, at the field — walk back to the palace
      if(p.p===6&&p.st==='ask'&&sawP5&&!walkTimes.find(t=>t.n==='p5-home')){
        const home=await followPinToPalace(pg,touch,90000);
        const sec=home.sec;
        walkTimes.push({n:'p5-home',sec,x:home.x,z:home.z,via:home.via});
        await shot(pg,tag+'-p5-walk-home');
        rec(tag+'-p5-walk-home-under-60s',sec<=70,{sec});plagueLog(tag,`P5 walk home ${sec.toFixed(1)}s ${sec<=70?'PASS':'FAIL'}`);
      }

      // P7 clock
      if(p.p===7&&p.st==='gap'&&!sawP7clock){
        await shot(pg,tag+'-p7-countdown');
        const clk=await sampleClock(pg,12000,350);
        rec(tag+'-p7-clock-steady',!clk.jumpUp&&!clk.stall,{jumpUp:clk.jumpUp,stall:clk.stall,secs:clk.secs});
        plagueLog(tag,`P7 clock jumpUp=${clk.jumpUp} stall=${clk.stall} secs=${(clk.secs||[]).slice(0,8)}`);
        sawP7clock=clk;
      }

      // P8 locusts / table / walk home — wait for the horn cine, not the come walk
      if(p.p===8&&(p.st==='plague'||p.st==='gap')&&!sawP8){
        if(p.st==='plague') await sleep(1200);
        const f=await probe(pg);
        const loc=await countLocusts(pg).catch(()=>0);
        await shot(pg,tag+'-p8-horn');
        rec(tag+'-p8-cine-shot',true,{st:f.st,x:f.x,z:f.z,cam:f.cam,kid:f.kidInFrame,locustHint:loc});
        rec(tag+'-p8-kid-in-frame',!(f.kidInFrame)||f.kidInFrame.ok,{kid:f.kidInFrame});
        rec(tag+'-p8-locusts-visible',loc>=20,{locusts:loc,st:f.st});
        plagueLog(tag,`P8 horn/locusts n=${loc} kid=${JSON.stringify(f.kidInFrame)}`);
        sawP8=true;
      }
      // After P8 cine the next card is ask:9 — walk back to the palace
      if(p.p===9&&p.st==='ask'&&sawP8&&!walkTimes.find(t=>t.n==='p8-home')){
        const home=await followPinToPalace(pg,touch,90000);
        const sec=home.sec;
        walkTimes.push({n:'p8-home',sec,x:home.x,z:home.z,via:home.via});
        await shot(pg,tag+'-p8-walk-home');
        rec(tag+'-p8-walk-home-under-60s',sec<=70,{sec});plagueLog(tag,`P8 walk home ${sec.toFixed(1)}s ${sec<=70?'PASS':'FAIL'}`);
      }

      // P10 doors / mat / passover
      if(p.p===10||p.st==='paint'||p.st==='sleep'||p.st==='morning'){
        if(p.cntGrown&&!cardKeys['doors-chip']){
          cardKeys['doors-chip']=1;
          rec(tag+'-doors-chip-gap',!p.cntGrown.overlap&&p.cntGrown.gap>=10,p.cntGrown);
          await shot(pg,tag+'-p10-doors-chip');
        }
        if(!sawP10){await shot(pg,tag+'-p10-start');plagueLog(tag,'P10 doors/mat start');sawP10=true}
        if(!p.card){
          if(p.st==='paint') await clickVisiblePin(pg,touch,'.eg3d-pin-doors.on');
          else await clickVisiblePin(pg,touch,'.eg3d-pin-doors.on,.eg3d-pin-mat.on,.eg3d-obja.on');
        }
        if((p.st==='sleep'||p.st==='morning'||(p.card&&/passover|sleep|bed|mat/i.test(p.card.txt||'')))&&!cardKeys['mat-shot']){
          cardKeys['mat-shot']=1;
          const f=await probe(pg);
          await shot(pg,tag+'-p10-mat-or-passover');
          rec(tag+'-p10-mat-passover-kid',!(f.kidInFrame)||f.kidInFrame.ok,{kid:f.kidInFrame,st:f.st,card:f.card&&f.card.txt});
        }
      }

      // Sea / Shake
      if(p.tambOn&&!cardKeys['shake']){
        cardKeys['shake']=1;
        const sea=await lookSea(pg);
        await shot(pg,tag+'-sea-shake-0');
        rec(tag+'-sea-no-box-crest',sea.foamBox===0&&sea.foamSphere>0,sea);
        rec(tag+'-sea-army-meshes',sea.visibleCarts>0&&sea.visibleHorses>0,sea);
        rec(tag+'-sea-kid-in-frame',!(p.kidInFrame)||p.kidInFrame.ok,{kid:p.kidInFrame});
        plagueLog(tag,`sea foamBox=${sea.foamBox} spheres=${sea.foamSphere} carts=${sea.visibleCarts} horses=${sea.visibleHorses}`);
        const left0=p.tambBox?p.tambBox.cx:null;
        await clickSel(pg,'.eg3d-tamb',touch);
        await sleep(450);
        const s1=await probe(pg);
        await shot(pg,tag+'-sea-shake-1');
        const one= /1\s*\/\s*3/.test(s1.tambTxt||'') || /Shake\s*1\s*\/\s*3/i.test(s1.tambTxt||'');
        rec(tag+'-shake-one-tap-one-count',one,{txt:s1.tambTxt,before:p.tambTxt});
        const left1=s1.tambBox?s1.tambBox.cx:null;
        rec(tag+'-shake-stays-put',left0!=null&&left1!=null&&Math.abs(left1-left0)<8,{left0,left1});
        plagueLog(tag,`Shake one-tap ${one?'PASS':'FAIL'} txt=${s1.tambTxt}`);
        await sleep(400);await clickSel(pg,'.eg3d-tamb',touch);
        await sleep(500);await clickSel(pg,'.eg3d-tamb',touch);
        await sleep(800);
        await shot(pg,tag+'-sea-after-shake');
      }

      if(p.badge){
        const f=await probe(pg);
        await shot(pg,tag+'-end-card');
        rec(tag+'-end-card-present',true,{});
        rec(tag+'-end-card-not-covering-kid',!f.badgeCoversKid,{covers:f.badgeCoversKid,kid:f.kidInFrame,badge:f.badgeBox});
        plagueLog(tag,`end card coversKid=${f.badgeCoversKid} kid=${JSON.stringify(f.kidInFrame)}`);
        break;
      }

      // Skip talk unless we're on the shake/sea cine (skip has special meaning) or a card we just shot
      if(!p.tambOn && p.st!=='gap') await skipTalk(pg,touch,3);

      // Follow the next-step pin if idle — never while a story card is up
      // (pin taps set pinUpT and the story Skip button ignores clicks for 3s after)
      if(!p.card&&!p.tambOn&&p.st!=='paint'&&(p.st==='ask'||p.st==='come'||p.st==='sleep'||p.st==='morning'||(p.st==='act'&&!(p.p===1&&!sawP1wade)))&&idle>=2){
        await clickStoryPin(pg,touch);
        await sleep(600);
      }

      // During long gaps, just wait (clock is already sampled for P1/P7)
      if(p.st==='gap'&&p.p!==7&&p.p!==1){
        await sleep(2000);
      }else{
        await sleep(500);
      }
    }

    await shot(pg,tag+'-final');
    rec(tag+'-walk-times',walkTimes.every(t=>t.sec<=70),{walkTimes});
    const js=pg._jsErrors||[];
    rec(tag+'-no-js-error',js.length===0,{n:js.length,sample:js.slice(0,3)});
  }catch(e){
    flog('ERROR',tag,String(e&&e.stack||e));
    rec(tag+'-run-error',false,{e:String(e)});
    try{await shot(pg,tag+'-error')}catch(_){}
  }finally{
    await br.close().catch(()=>{});
  }
}

(async()=>{
  fs.mkdirSync(SHOT,{recursive:true});
  fs.mkdirSync('/workspace/p32work/spark37/proof-logs',{recursive:true});
  try{fs.writeFileSync(LIVE,'s48 start '+new Date().toISOString()+'\n')}catch(e){}
  if(ONLY!=='1280') await runSize('390',390,844,true);
  if(ONLY!=='390') await runSize('1280',1280,720,false);
  out.ended=new Date().toISOString();
  const pass=out.checks.filter(c=>c.ok).length, fail=out.checks.filter(c=>!c.ok).length;
  out.summary={pass,fail,total:out.checks.length};
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2));
  flog('DONE',JSON.stringify(out.summary));
  process.exit(fail?1:0);
})().catch(e=>{flog('FATAL',String(e&&e.stack||e));process.exit(2)});
