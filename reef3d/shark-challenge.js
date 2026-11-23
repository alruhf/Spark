/* Age-banded shark reading challenges for Reef floating coins. Soft UI only. */
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(L=>!'QXYZ'.includes(L));
const WORDS=['FISH','BOAT','CORAL','WAVE','CRAB','SAND','SHELL','REEF','STAR','FIN'];
const CAPTIONS=[
  {id:'c1',emoji:'🐠',ok:'A fish is swimming',bad:['A rocket is flying','A snowman is melting']},
  {id:'c2',emoji:'🐢',ok:'A turtle on the reef',bad:['A cat in a tree','A plane in the sky']},
  {id:'c3',emoji:'🪸',ok:'Bright coral grows here',bad:['Ice covers the lake','Cars race on a road']},
  {id:'c4',emoji:'🚤',ok:'A boat on the water',bad:['A train in a tunnel','A kite in the attic']}
];
const WORD_SCENES=[
  {id:'w1',emoji:'🐠',word:'FISH'},
  {id:'w2',emoji:'🚤',word:'BOAT'},
  {id:'w3',emoji:'🪸',word:'CORAL'},
  {id:'w4',emoji:'🌊',word:'WAVE'},
  {id:'w5',emoji:'🦀',word:'CRAB'},
  {id:'w6',emoji:'⭐',word:'STAR'}
];

const used={k35:new Set(),e57:new Set(),u710:new Set(),t10:new Set()};
let cardEl=null,wrongN=0;

export function bandForAge(age){
  const a=+(age||4);
  if(a<=5)return 'k35';
  if(a<=7)return 'e57';
  if(a<=10)return 'u710';
  return 't10';
}

function shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}

function pickUnused(pool,key,idFn){
  let avail=pool.filter(p=>!used[key].has(idFn(p)));
  if(!avail.length){used[key].clear();avail=pool.slice()}
  const pick=avail[Math.floor(Math.random()*avail.length)];
  used[key].add(idFn(pick));
  return pick;
}

/* TEST-ONLY (testfast): force the next trace letter */let FORCE_L=null;export function forceLetter(L){FORCE_L=L&&LETTERS.includes(L)?L:null;return FORCE_L}export const TRACE_LETTERS=LETTERS;
export function nextPrompt(band){
  if(band==='k35'){const L=FORCE_L||pickUnused(LETTERS,'k35',x=>x);return {kind:'trace',id:L,letter:L}}
  if(band==='e57'){const W=pickUnused(WORDS,'e57',x=>x);const first=W[0];const distractors=shuffle(LETTERS.filter(L=>L!==first)).slice(0,2);return {kind:'first',id:W,word:W,choices:shuffle([first,...distractors]),ok:first}}
  if(band==='u710'){const sc=pickUnused(WORD_SCENES,'u710',s=>s.id);const distractors=shuffle(WORDS.filter(w=>w!==sc.word)).slice(0,2);return {kind:'word',id:sc.id,emoji:sc.emoji,choices:shuffle([sc.word,...distractors]),ok:sc.word}}
  const sc=pickUnused(CAPTIONS,'t10',s=>s.id);return {kind:'caption',id:sc.id,emoji:sc.emoji,choices:shuffle([sc.ok,...sc.bad]),ok:sc.ok};
}

function ensureCss(){
  if(document.getElementById('r3d-shark-css'))return;
  const l=document.createElement('link');l.id='r3d-shark-css';l.rel='stylesheet';
  l.href=new URL('shark-challenge.css?v=7',import.meta.url).href;
  document.head.appendChild(l);
}

let AC=null;function happy(){try{AC=AC||window.__sbxAC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime;[659,784,988,1319].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.08);g.gain.exponentialRampToValueAtTime(.14,t+i*.08+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.08+.35);o.connect(g).connect(AC.destination);o.start(t+i*.08);o.stop(t+i*.08+.38)})}catch(e){}}
function closeChallenge(){
  if(cardEl){cardEl.remove();cardEl=null}
  wrongN=0;
}

export {closeChallenge};

export function openChallenge({band,root,onWin,onFail,say,log}){
  ensureCss();
  closeChallenge();
  wrongN=0;
  const b=band||'k35';
  const prompt=nextPrompt(b);
  if(log)log('r3dsharkcard',{band:b,kind:prompt.kind,id:prompt.id});
  const host=root||document.body;
  const card=document.createElement('div');card.className='r3d-shark-card';card.setAttribute('role','dialog');
  const panel=document.createElement('div');panel.className='r3d-shark-panel';
  const title=document.createElement('div');title.className='r3d-shark-title';title.textContent='Shark challenge!';
  const promptEl=document.createElement('div');promptEl.className='r3d-shark-prompt';
  panel.appendChild(title);panel.appendChild(promptEl);

  /* R22b (tester: no success cue): a win shows a big "Well done!" with sparkles and a happy chime on the card, the coin is paid at once, the card closes after ~1.8 s */
  let won=false;
  function win(){if(won)return;won=true;card.classList.add('won');
    const wd=document.createElement('div');wd.className='r3d-shark-welldone';wd.textContent='Well done!';
    for(let i=0;i<14;i++){const sp=document.createElement('i');sp.className='r3d-shark-sparkle';const a=i/14*Math.PI*2,r=90+Math.random()*60;sp.style.setProperty('--dx',(Math.cos(a)*r).toFixed(0)+'px');sp.style.setProperty('--dy',(Math.sin(a)*r).toFixed(0)+'px');sp.style.animationDelay=(Math.random()*.15).toFixed(2)+'s';wd.appendChild(sp)}
    panel.appendChild(wd);happy();if(say)say('Well done!');if(log)log('r3dsharkwelldone',{pk:prompt.kind,id:prompt.id});
    onWin&&onWin(prompt);
    const me=card;setTimeout(()=>{if(cardEl===me)closeChallenge();else me.remove()},(/[?&]testfast=1/.test(location.search)&&/[?&]wdhold=1/.test(location.search))?6000:1800/* TEST-ONLY wdhold: keeps the cue up long enough for a slow headless screenshot */)}
  function fail(why){if(won)return;closeChallenge();onFail&&onFail(why||'wrong')}
  function onWrong(btn){
    wrongN++;
    if(btn){btn.classList.remove('shake');void btn.offsetWidth;btn.classList.add('shake')}
    if(wrongN>=2)fail('wrong');
  }

  if(prompt.kind==='trace'){
    promptEl.textContent='Trace the letter with your finger!';
    if(say)say('Trace the letter '+prompt.letter+'!');
    const wrap=document.createElement('div');wrap.className='r3d-shark-trace-wrap';
    const big=document.createElement('div');big.className='r3d-shark-letter-big';big.textContent=prompt.letter;
    /* R22c (Tester: on 'B' only the stem inked, curves never did, no win): Chrome hands out one pointermove per animation frame, and with the
       3D reef rendering slowly the old code joined those few samples with straight chords - B's bowls start and end on the stem, so their chords
       lay on the stem. Now every coalesced sample is drawn, the pointer is captured, and the win checks how much of the real glyph the ink covers. */
    const guide=document.createElement('canvas');guide.className='r3d-shark-guide';guide.width=260;guide.height=260;
    const cv=document.createElement('canvas');cv.className='r3d-shark-trace';cv.width=260;cv.height=260;
    wrap.appendChild(guide);wrap.appendChild(big);wrap.appendChild(cv);panel.appendChild(wrap);let hintEl=null;
    const ctx=cv.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';
    /* the faint guide letter is drawn on its own canvas so the glyph mask used for scoring is exactly what the child sees */
    const FONT='900 150px system-ui,"Segoe UI",Arial,sans-serif';const gx=guide.getContext('2d');gx.font=FONT;const mt=gx.measureText(prompt.letter);
    const asc=mt.actualBoundingBoxAscent||105,des=mt.actualBoundingBoxDescent||0,lft=mt.actualBoundingBoxLeft||0,rgt=mt.actualBoundingBoxRight||mt.width;
    const ox=130-(rgt-lft)/2+lft,oy=130+(asc-des)/2;gx.fillStyle='rgba(26,74,110,.2)';gx.fillText(prompt.letter,ox,oy);
    const mk=document.createElement('canvas');mk.width=mk.height=260;const mx=mk.getContext('2d');mx.font=FONT;mx.fillStyle='#000';mx.fillText(prompt.letter,ox,oy);
    const md=mx.getImageData(0,0,260,260).data;const GP=[];for(let y=1;y<260;y+=4)for(let x=1;x<260;x+=4)if(md[(y*260+x)*4+3]>128)GP.push([x,y]);
    /* R22j: the letter's inner band (8 px in from its edges; a stroke covers it within 32 px); a finished letter leaves no sizeable untouched piece of it */const INm=(x,y)=>x>=0&&y>=0&&x<260&&y<260&&md[(y*260+x)*4+3]>128;const GI=GP.filter(([x,y])=>{for(let a=0;a<16;a++){const t=a/16*6.2832;if(!INm(Math.round(x+Math.cos(t)*8),Math.round(y+Math.sin(t)*8)))return false}return true});const covI=new Uint8Array(GI.length);const RI2=32*32;
    const gapI=()=>{const key=new Map();GI.forEach((p,k)=>{if(!covI[k])key.set(p[0]*1000+p[1],1)});const seen=new Set();let big=0;for(const [kk] of key){if(seen.has(kk))continue;let n=0;const st=[kk];seen.add(kk);while(st.length){const q=st.pop();n++;const x=Math.floor(q/1000),y=q%1000;for(const dx of [-4,0,4])for(const dy of [-4,0,4]){const nk=(x+dx)*1000+(y+dy);if(key.has(nk)&&!seen.has(nk)){seen.add(nk);st.push(nk)}}}if(n>big)big=n}return big};
    const HIT=30,HIT2=HIT*HIT;const cov=new Uint8Array(GP.length);let covN=0,inkN=0,inkNear=0;
    const near=(x,y)=>{/* ink sample: mark glyph points within HIT px; count whether the sample itself is near the glyph */let any=false;for(let k=0;k<GP.length;k++){const dx=GP[k][0]-x,dy=GP[k][1]-y;const d2=dx*dx+dy*dy;if(d2<HIT2){any=true;if(!cov[k]){cov[k]=1;covN++}}else if(!any&&d2<(HIT+12)*(HIT+12))any=true}for(let k=0;k<GI.length;k++){if(covI[k])continue;const dx=GI[k][0]-x,dy=GI[k][1]-y;if(dx*dx+dy*dy<RI2)covI[k]=1}inkN++;if(any)inkNear++};
    const seg=(a,b)=>{ctx.strokeStyle='#ff5a1f';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/5));for(let k=1;k<=n;k++)near(a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n)};
    let drawing=false,pts=0,last=null,pid=null;
    const score=()=>({cover:GP.length?covN/GP.length:0,prec:inkN?inkNear/inkN:0,len:pts,gap:gapI()});
    /* R22j (Allen: the player should have to finish drawing the letter before it is checked): the old code judged on every pointermove and won as soon as 60% of the glyph was inked, so the card said Well done! mid-stroke (and after the first stroke of A, the stem+bowl of B...). Now nothing is judged while the finger is down; ~0.9 s after a lift (a new stroke cancels it) the trace is judged once: the whole letter covered (>=80% of the glyph, no untouched piece of its inner band, ink mostly on it) wins, a partial letter gets "Keep going!", ink mostly off the letter is wiped with "Try again" */
    const good=()=>{const s=score();return s.cover>=.8&&s.prec>=.5&&s.gap<=12};let lifts=0,judgeT=0;const SETTLE=900;
    const hint=document.createElement('div');hint.className='r3d-shark-tracehint';hint.setAttribute('aria-live','polite');/* R22l (tester R22k: the red line pushed the card ~8 px when it first appeared): the (empty, hidden) line is placed under the letter box as soon as the card is built, so its space is always reserved */requestAnimationFrame(()=>{if(!hintEl&&wrap.parentNode){hintEl=hint;wrap.after(hint)}});
    function pos(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*(cv.width/r.width),y:(e.clientY-r.top)*(cv.height/r.height)}}
    function start(e){if(won||drawing)return;e.preventDefault();drawing=true;if(judgeT){clearTimeout(judgeT);judgeT=0}cv.dataset.verdict='';pid=e.pointerId;try{cv.setPointerCapture(pid)}catch(_){}last=pos(e);ctx.fillStyle='#ff5a1f';ctx.beginPath();ctx.arc(last.x,last.y,8,0,Math.PI*2);ctx.fill();near(last.x,last.y);if(log&&!pts)log('r3dsharkink',{start:1})}
    function move(e){if(!drawing||won||e.pointerId!==pid)return;e.preventDefault();const evs=(e.getCoalescedEvents&&e.getCoalescedEvents())||[];const list=evs.length?evs:[e];
      for(const ev of list){const p=pos(ev);const d=Math.hypot(p.x-last.x,p.y-last.y);if(d<.5)continue;seg(last,p);pts+=d;last=p}
      cv.dataset.ink=Math.round(pts);cv.dataset.cover=Math.round(score().cover*100)}
    function end(e){if(!drawing||(e&&e.pointerId!==pid))return;drawing=false;try{cv.releasePointerCapture(pid)}catch(_){}const s=score();cv.dataset.cover=Math.round(s.cover*100);if(log)log('r3dsharktrace',{letter:prompt.letter,cover:+s.cover.toFixed(2),prec:+s.prec.toFixed(2),len:Math.round(pts)});cv.dataset.verdict='wait';if(judgeT)clearTimeout(judgeT);/* judge once the finger has stayed up a moment (a child lifting between strokes of A, E, H... just carries on) */judgeT=setTimeout(judge,SETTLE)}
    function judge(){judgeT=0;if(won||drawing||!cv.isConnected)return;const s=score();lifts++;
      const v=good()?'win':(s.prec<.5&&pts>250)?'retry':'more';cv.dataset.verdict=v;cv.dataset.lifts=lifts;if(log)log('r3dsharkjudge',{letter:prompt.letter,verdict:v,lift:lifts,cover:+s.cover.toFixed(2),prec:+s.prec.toFixed(2),gap:s.gap});
      if(!hintEl){hintEl=hint;wrap.after(hint)}
      if(v==='win'){hint.textContent='';win()}
      else if(v==='retry'){hint.textContent='Oops! Follow the letter. Try again!';if(say)say('Oops! Try again!');ctx.clearRect(0,0,cv.width,cv.height);cov.fill(0);covI.fill(0);covN=0;inkN=0;inkNear=0;pts=0;cv.dataset.ink=0;cv.dataset.cover=0}
      else hint.textContent='Keep going! Trace all of the '+prompt.letter+'.'}
    cv.addEventListener('pointerdown',start);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('lostpointercapture',end);
    cv.addEventListener('mousedown',e=>e.preventDefault());cv.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});cv.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    if(typeof window!=='undefined'&&/[?&]testfast=1/.test(location.search))window.__r3dTrace={score,letter:prompt.letter,glyphN:GP.length};
  }else if(prompt.kind==='first'){
    promptEl.textContent='Tap the first letter of '+prompt.word;
    if(say)say('What is the first letter of '+prompt.word+'?');
    const row=document.createElement('div');row.className='r3d-shark-choices';
    prompt.choices.forEach(ch=>{
      const b=document.createElement('button');b.type='button';b.className='r3d-shark-choice';
      b.style.cssText='background:#ffe8a8;color:#0a2a44;-webkit-text-fill-color:#0a2a44;font:900 40px/1 system-ui,Arial,sans-serif';
      b.textContent='';const spn=document.createElement('span');spn.className='r3d-shark-letter';spn.textContent=ch;b.appendChild(spn);b.setAttribute('aria-label',ch);b.dataset.ch=ch;
      b.addEventListener('click',()=>{if(ch===prompt.ok)win();else onWrong(b)});
      row.appendChild(b);
    });
    panel.appendChild(row);
  }else if(prompt.kind==='word'){
    promptEl.textContent='Tap the word that matches the picture';
    if(say)say('Which word matches this picture?');
    const pic=document.createElement('div');pic.className='r3d-shark-pic';pic.textContent=prompt.emoji;panel.appendChild(pic);
    const row=document.createElement('div');row.className='r3d-shark-choices';
    prompt.choices.forEach(ch=>{
      const b=document.createElement('button');b.type='button';b.className='r3d-shark-choice word';
      b.style.cssText='background:#ffe8a8;color:#0a2a44;-webkit-text-fill-color:#0a2a44;font:900 20px/1.1 system-ui,Arial,sans-serif';
      b.textContent='';const spn=document.createElement('span');spn.className='r3d-shark-letter';spn.textContent=ch;b.appendChild(spn);b.setAttribute('aria-label',ch);b.dataset.ch=ch;
      b.addEventListener('click',()=>{if(ch===prompt.ok)win();else onWrong(b)});
      row.appendChild(b);
    });
    panel.appendChild(row);
  }else{
    promptEl.textContent="What's wrong? Pick the true caption";
    if(say)say("What's going on in this picture?");
    const pic=document.createElement('div');pic.className='r3d-shark-pic';pic.textContent=prompt.emoji;panel.appendChild(pic);
    const row=document.createElement('div');row.className='r3d-shark-choices';
    prompt.choices.forEach(ch=>{
      const b=document.createElement('button');b.type='button';b.className='r3d-shark-choice caption';
      b.style.cssText='background:#ffe8a8;color:#0a2a44;-webkit-text-fill-color:#0a2a44;font:800 15px/1.25 system-ui,Arial,sans-serif;text-align:left';
      b.textContent='';const spn=document.createElement('span');spn.className='r3d-shark-letter';spn.textContent=ch;b.appendChild(spn);b.setAttribute('aria-label',ch);b.dataset.ch=ch;
      b.addEventListener('click',()=>{if(ch===prompt.ok)win();else onWrong(b)});
      row.appendChild(b);
    });
    panel.appendChild(row);
  }

  const skip=document.createElement('button');skip.type='button';skip.className='r3d-shark-skip';skip.textContent='Skip';
  skip.addEventListener('click',()=>fail('skip'));
  panel.appendChild(skip);
  const hint=document.createElement('div');hint.className='r3d-shark-hint';hint.textContent='Skip loses a few coins';
  panel.appendChild(hint);
  card.appendChild(panel);host.appendChild(card);cardEl=card;
  return {band:b,prompt,close:closeChallenge};
}
