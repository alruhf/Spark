/* Trading post: coins (from trips and jobs) buy things for the igloo. Ages 4-6 see 2 things at a time; price = a row of coins to count
   (voice counts them), not a number to read. Not enough coins: the missing coins show empty and the voice says so - no pressure, no timers. */
import {FISH_SVG} from './fish.js?v=9';
export function shop(K){
  const {THREE,say,log,me,save,el,btn,tap,ui}=K;
  let per=2;const perNow=()=>2;/* P5 (Allen 10/20): always 2 things per page, desktop and phone */
  /* P6 (Allen 10/20): the trader also sells Arctic clothes (shared wardrobe, ../wardrobe.js). One of each; bought only with earned coins; no free clothes. */
  const WD=window.SparkWardrobe,wpid=(K.opt&&K.opt.pid)||(WD&&WD.activePid());const CL=WD?WD.catalog('arctic').map(c=>({id:'w:'+c.id,wid:c.id,shop:c.price,cloth:true,svg:c.svg,img:c.img,name:c.name})):[];
  const HOME=K.ITEMS.filter(i=>i.shop).sort((a,b)=>a.shop-b.shop);let tab='cloth';let items=CL;/* P6I (Tester/Allen): big Clothes / Home tabs - home things are still bought here at the trader */
  me.owned=me.owned||{};
  const ov=el('div','a3d-shop');ui.appendChild(ov);const row=el('div','a3d-shoprow');ov.appendChild(row);
  const prev=btn('a3d-pg prev','Back','<svg viewBox="0 0 48 48"><path d="M30 8L12 24l18 16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'),next=btn('a3d-pg next','More','<svg viewBox="0 0 48 48"><path d="M18 8l18 16-18 16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');ov.appendChild(prev);ov.appendChild(next);
  const close=btn('a3d-shopx','Close',K.ICO.back);ov.appendChild(close);const tabs=el('div','a3d-tabs');ov.appendChild(tabs);const tC=btn('a3d-tab cloth','Clothes','<svg viewBox="0 0 48 48"><path d="M16 6l-10 8 5 8 4-3v23h18V19l4 3 5-8-10-8c-1 4-4 6-8 6s-7-2-8-6z" fill="#f6c445" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>'),tH=btn('a3d-tab home','Home','<svg viewBox="0 0 48 48"><path d="M6 24L24 8l18 16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 22v18h26V22" fill="#7fd3ff" stroke="#fff" stroke-width="3"/><rect x="20" y="28" width="8" height="12" fill="#e2716f"/></svg>');tabs.appendChild(tC);tabs.appendChild(tH);
  function setTab(t){tab=t;items=t==='home'?HOME:CL;page=0;tC.classList.toggle('on',t==='cloth');tH.classList.toggle('on',t==='home');log('a3dshoptab',{tab:t});render()}
  /* P5 (Allen 10/20): sell fish to the trader - icon only (fish -> one coin), voiced, fish flies to the trader, coin pops to the purse.
     Price: 1 coin per fish (a fish costs a whole ice-fishing round; items cost 1-6, so 1 fish = 1 coin keeps buying a short, fair goal).
     Feeding still works: it uses the same fish count; with 0 fish the sell button just shakes and says there are no fish. */
  const FISHI=FISH_SVG;
  const sell=btn('a3d-sell','Sell fish','<span class="a3d-sellf">'+FISHI+'</span><svg class="a3d-sella" viewBox="0 0 48 48"><path d="M8 24h28M26 12l12 12-12 12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="a3d-sellc"><img alt="" src="'+K.IMG+'coin.webp"></span>');ov.appendChild(sell);
  const C=me.camp||(me.camp={fish:0});let sellBusy=0;
  function sellFish(){/* P6D: every tap sells (fast taps no longer swallowed) */const c=me.camp;if(!c||(c.fish|0)<=0){say('nofish');sell.classList.add('shake');setTimeout(()=>sell.classList.remove('shake'),500);log('a3dsell',{ok:false,fish:0});return}
    sellBusy++;c.fish--;save();K.fishN&&K.fishN();const r=sell.getBoundingClientRect();const f=el('div','a3d-sellfly',FISHI);f.style.left=(r.left+r.width*.2)+'px';f.style.top=(r.top+r.height/2)+'px';document.body.appendChild(f);
    requestAnimationFrame(()=>{f.style.transform='translate(0,-140px) rotate(-25deg) scale(.6)';f.style.opacity='0'});setTimeout(()=>f.remove(),800);K.chime&&K.chime(880,.2);
    setTimeout(()=>{K.earn(1,'sell_fish',{x:r.left+r.width*.8,y:r.top+r.height/2});say('sold');log('a3dsell',{ok:true,price:1,fish:c.fish});sellBusy=Math.max(0,sellBusy-1);render()},650)}
  tap(sell,sellFish);
  let page=0;const thumbs={};
  function thumb(id){if(thumbs[id]) return thumbs[id];const ci=CL.find(c=>c.id===id);if(ci&&ci.img) return thumbs[id]=ci.img;if(ci) return thumbs[id]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ci.svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));const R=K.R,rt=new THREE.WebGLRenderTarget(192,192,{colorSpace:THREE.SRGBColorSpace});const ts=new THREE.Scene();ts.add(new THREE.HemisphereLight('#fff','#99a',2.2));const dl=new THREE.DirectionalLight('#fff',1.6);dl.position.set(2,3,4);ts.add(dl);
    const m=K.model(id,0);ts.add(m);const bb=new THREE.Box3().setFromObject(m),c=bb.getCenter(new THREE.Vector3()),s=bb.getSize(new THREE.Vector3()).length();const tc=new THREE.PerspectiveCamera(30,1,.05,50);tc.position.copy(c).add(new THREE.Vector3(s*.9,s*.7,s*1.6));tc.lookAt(c);
    const sh=R.shadowMap.enabled;R.shadowMap.enabled=false;R.setRenderTarget(rt);R.setClearColor(0,0);R.clear();R.render(ts,tc);const px=new Uint8Array(192*192*4);R.readRenderTargetPixels(rt,0,0,192,192,px);R.setRenderTarget(null);R.shadowMap.enabled=sh;rt.dispose();
    const cv=document.createElement('canvas');cv.width=cv.height=192;const g=cv.getContext('2d'),im=g.createImageData(192,192);for(let y=0;y<192;y++)im.data.set(px.subarray((191-y)*768,(192-y)*768),y*768);g.putImageData(im,0,0);return thumbs[id]=cv.toDataURL()}
  const coinImg='<img alt="" src="'+K.IMG+'coin.webp">';
  function render(){per=perNow();row.innerHTML='';const have=K.coins();const pg=items.slice(page*per,page*per+per);
    pg.forEach(it=>{const card=el('div','a3d-card'+(/^w:/.test(it.id)?' cloth':''));card.dataset.item=it.id;const owned=!!(it.cloth&&WD.owns(wpid,it.wid));const n=it.cloth?0:(K.bag()[it.id]|0)+((me.room&&me.room.items)||[]).filter(d=>d.id===it.id).length;if(it.cloth)card.classList.add('cloth');card.classList.toggle('owned',n>0);card.classList.toggle('poor',!owned&&have<it.shop);/* P6K: can't afford yet -> dimmed */if(n>0)card.insertAdjacentHTML('beforeend','<b class="a3d-n">'+n+'</b>');
      card.appendChild(el('img','a3d-cardimg')).src=thumb(it.id);const pr=el('div','a3d-price');for(let i=0;i<it.shop;i++)pr.appendChild(el('i',owned||i<have?'on':'',coinImg));card.appendChild(pr);
      const b=btn('a3d-buy'+(owned?' got':''),'Buy',owned?'<svg viewBox="0 0 48 48"><path d="M10 26l9 9 19-21" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>':coinImg+'<svg viewBox="0 0 48 48"><path d="M10 30c6 0 8-6 14-6h10a4 4 0 010 8H26M10 30v10h22l10-10" fill="#f6d2b8" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>');card.appendChild(b);
      const wearIt=()=>{WD.wear(wpid,it.wid);say('worn');log('a3dshopwear',{id:it.wid});render()};tap(b,()=>{if(owned){wearIt();return}buy(it,card)});card.addEventListener('click',()=>{if(owned&&it.cloth){wearIt();return}if(!owned)say('cost'+it.shop)});row.appendChild(card)});
    sell.classList.toggle('none',!((me.camp&&me.camp.fish)|0));prev.style.visibility=page>0?'':'hidden';next.style.visibility=(page+1)*per<items.length?'':'hidden';log('a3dshoppage',{page,shown:pg.map(i=>i.id),coins:have})}
  function buy(it,card){if(card._busy) return;const have=K.coins();
    if(have<it.shop){say('need_more');card.classList.add('shake');setTimeout(()=>card.classList.remove('shake'),500);log('a3dbuyshort',{id:it.id,price:it.shop,have});return}
    const coins=[...card.querySelectorAll('.a3d-price i')];coins.forEach((c,i)=>setTimeout(()=>{c.classList.add('pay');K.chime(660+i*90,.2)},i*420));card._busy=1;say('count'+it.shop);
    setTimeout(()=>{card._busy=0;if(!K.spend(it.shop,'a3d_'+it.id)){say('need_more');render();return}if(it.cloth){WD.own(wpid,it.wid);WD.wear(wpid,it.wid);/* P6E: bought = put on straight away */save();say('clothes_got');log('a3dbuy',{id:it.id,price:it.shop,cloth:1});render();return}me.owned[it.id]=1;const bg=K.bag();bg[it.id]=(bg[it.id]|0)+1;save();K.flyToBag&&K.flyToBag(card);try{K.refreshTray()}catch(e){}say('bought');log('a3dbuy',{id:it.id,price:it.shop});render()},it.shop*420+300)}
  tap(tC,()=>setTab('cloth'));tap(tH,()=>setTab('home'));tap(prev,()=>{page=Math.max(0,page-1);render()});tap(next,()=>{page=Math.min(Math.ceil(items.length/per)-1,page+1);render()});tap(close,()=>K.setMode('walk'));
  K.modes.shop={enter(){ov.classList.add('on');const w=K.shopWant;const t=(w&&performance.now()-w.t<120000)?w.tab:(K.shopTab||'cloth');K.shopTab=null;K.shopWant=null;setTab(t);setTimeout(()=>{if(K.mode==='shop'&&tab!==t)setTab(t)},400);say('shop_hi')},exit(){ov.classList.remove('on')},back(){K.setMode('walk')},
    cam(c){c.fov=50;const t=K.STALL||K.kid.position;const k=K.kid.position;const dx=k.x-t.x,dz=k.z-t.z,L=Math.hypot(dx,dz)||1;c.position.set(k.x+dx/L*3.2+1.2,2.4,k.z+dz/L*3.2);c.lookAt(t.x,1.4,t.z)}};
  const ICO='<svg viewBox="0 0 48 48"><path d="M6 20l4-12h28l4 12z" fill="#e2716f" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M6 20c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0" fill="#fff"/><rect x="10" y="24" width="28" height="18" fill="#f4e3c8" stroke="#fff" stroke-width="3"/><circle cx="24" cy="33" r="5" fill="#f6c445"/></svg>';
  K.shopIco=ICO;
  K.probes=Object.assign(K.probes||{},{shop:()=>({tab,page,per,shown:[...row.querySelectorAll('.a3d-card')].map(c=>c.dataset.item),owned:Object.keys(me.owned),clothes:WD?WD.owned(wpid):[],bag:Object.assign({},K.bag()),coins:K.coins()})});
}
