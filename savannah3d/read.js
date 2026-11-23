/* Savannah reading layer (spec §6; Allen 10/21: reading in the Savannah ONLY). Spark says a name; the kid taps the first letter
   (Pre-reader), the right word (Early reader) or the matching phrase / spells it with blocks (Reader). No fail state: a wrong tap only
   wiggles + Spark sounds it out + the right tile glows; Skip ("just tell me", the ear) is always visible and still gives the sticker.
   No score, no timer, no counts shown to the kid; nothing in the game is gated on reading. Tier per child: age default, grown-up override. */
import {ANIMALS,ORDER,SPELL} from './data.js?v=3';
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const SV=b=>'<svg viewBox="0 0 48 48" aria-hidden="true">'+b+'</svg>';
const TIERI={pre:SV('<text x="24" y="36" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="Andika,Lexend,system-ui">A</text>'),
 early:SV('<ellipse cx="24" cy="30" rx="13" ry="11" fill="#ffb84d"/><path d="M13 24l-2-14 9 8zM35 24l2-14-9 8z" fill="#ffb84d"/><circle cx="19" cy="28" r="2" fill="#222"/><circle cx="29" cy="28" r="2" fill="#222"/><path d="M22 33q2 2 4 0" stroke="#222" stroke-width="2" fill="none"/>'),
 reader:SV('<path d="M24 12c-6-4-12-4-18-2v28c6-2 12-2 18 2 6-4 12-4 18-2V10c-6-2-12-2-18 2z" fill="#7fd6c8" stroke="#fff" stroke-width="3"/><path d="M24 12v28" stroke="#fff" stroke-width="3"/>'),
 off:SV('<circle cx="24" cy="24" r="16" fill="none" stroke="#fff" stroke-width="5"/><path d="M13 35L35 13" stroke="#fff" stroke-width="5"/>')};
export function reading(K){const {el,btn,tap,say,chime,earn,me,save,log,ICO,PIC}=K;
  const tierOf=()=>me.tier||(K.age<=5?'pre':K.age===6?'early':'reader');
  const pic=(id,cls)=>PIC[id]?'<img class="'+(cls||'')+'" alt="" draggable="false" src="'+PIC[id]+'">':'<div class="'+(cls||'')+' s3d-nopic">'+ICO.paw+'</div>';
  let ov=null;
  function close(){if(ov){ov.remove();ov=null}}
  /* ---------- one reading moment (under 10 s) ---------- */
  K.readMoment=(id,done)=>{close();const A=ANIMALS[id];const tier=tierOf();const t0=performance.now();let miss=0,firstTry=true,fin=false;
    ov=el('div','s3d-read');ov.dataset.tier=tier;K.ui.appendChild(ov);
    const card=el('div','s3d-rcard',pic(id,'s3d-rpic'));ov.appendChild(card);
    const skip=btn('s3d-rskip','Just tell me',ICO.ear);ov.appendChild(skip);
    const tiles=el('div','s3d-tiles');ov.appendChild(tiles);
    const hand=el('div','s3d-hand','<svg viewBox="0 0 48 48"><path d="M18 44V22c0-3 4-3 4 0v-10c0-3 4-3 4 0v8c0-3 4-3 4 0v2c0-3 4-3 4 0v12c0 6-3 10-8 10h-4c-3 0-5-2-6-4l-6-8c-2-3 1-5 3-3z" fill="#fff" stroke="#333" stroke-width="2"/></svg>');ov.appendChild(hand);
    function finish(how){if(fin)return;fin=true;const ms=Math.round(performance.now()-t0);const first=!me.book[id];me.book[id]=1;
      if(how==='right'){me.right=(me.right|0)+1;me.run=firstTry?(me.run|0)+1:0}save();
      const r=card.getBoundingClientRect();if(first&&how!=='skip')earn(1,'savannah_name_'+id,{x:r.left+r.width/2,y:r.top+r.height/2});
      card.classList.add('stick');if(first)setTimeout(()=>chime(1180,.3),200);log('s3dread',{id,tier,how,ms,first,miss,coins:K.coins()});
      const offer=how==='right'&&me.run>=15&&tierOf()!=='reader'&&!me.offered;
      setTimeout(()=>{if(offer){me.offered=1;me.run=0;save();trickier(done)}else{close();done&&done()}},how==='skip'?1600:2300)}
    tap(skip,()=>{say('say_'+id);log('s3dreadskip',{id});finish('skip')});
    if(me.off){/* reading prompts off for this child: show the picture, Spark says the name, sticker */tiles.innerHTML='<div class="s3d-rword big">'+A.n+'</div>';say('say_'+id);setTimeout(()=>finish('off'),900);return}
    const right=()=>{chime(990,.18);setTimeout(()=>chime(1320,.25),120);say(['ok_'+id][0]);finish('right')};
    function wrong(b,hintK,good){firstTry=false;miss++;b.classList.remove('wig');void b.offsetWidth;b.classList.add('wig');say(hintK);if(good){good.classList.add('glow');if(miss>=2){good.classList.add('pulse');const r=good.getBoundingClientRect(),o=ov.getBoundingClientRect();hand.style.left=(r.left-o.left+r.width*.55)+'px';hand.style.top=(r.top-o.top+r.height*.5)+'px';hand.classList.add('on')}}log('s3dreadmiss',{id,miss})}
    if(tier==='pre'){/* 2 big letter tiles (lowercase), picture shown; Spark: "Zebra. zzz, zebra. Which letter makes zzz?" */
      say('pre_'+id);const ch=shuffle([A.L,A.dis]);let good=null;ch.forEach(c=>{const b=btn('s3d-tile','Letter '+c,'<span>'+c+'</span>');b.dataset.v=c;if(c===A.L)good=b;tap(b,()=>{if(fin)return;if(c===A.L)right();else wrong(b,'hintp_'+id,good)});tiles.appendChild(b)})}
    else if(tier==='early'){/* pick the word: 2 choices, 3 after 10 correct; distractors are other animals (same picture category) */
      say('ear_'+id);const n=(me.right|0)>=10?3:2;const others=shuffle(ORDER.filter(x=>x!==id)).slice(0,n-1);const ch=shuffle([id].concat(others));let good=null;ch.forEach(w=>{const b=btn('s3d-tile s3d-word',w,'<span>'+ANIMALS[w].n+'</span>');b.dataset.v=w;if(w===id)good=b;tap(b,()=>{if(fin)return;if(w===id)right();else wrong(b,'hinte_'+id,good)});tiles.appendChild(b)});ov.dataset.n=n}
    else{const spell=SPELL.includes(id)&&(me.rs=(me.rs|0)+1)%2===0;save();
      if(!spell){/* match the phrase to the picture (3 phrases) */say('rdphrase');const others=shuffle(ORDER.filter(x=>x!==id)).slice(0,2);const ch=shuffle([id].concat(others));let good=null;ch.forEach(w=>{const b=btn('s3d-tile s3d-phrase',ANIMALS[w].phrase,'<span>'+ANIMALS[w].phrase+'</span>');b.dataset.v=w;if(w===id)good=b;tap(b,()=>{if(fin)return;if(w===id)right();else wrong(b,'look',good)});tiles.appendChild(b)});ov.dataset.kind='phrase'}
      else{/* spell with letter blocks: only the needed letters, shuffled; tap them in order */say('spell_'+id);ov.dataset.kind='spell';const word=A.n;const slots=el('div','s3d-slots');tiles.before(slots);const sl=[...word].map(()=>{const s=el('i','');slots.appendChild(s);return s});let k=0;
        const blocks=shuffle([...word].map((c,i)=>({c,i})));const bs=blocks.map(o=>{const b=btn('s3d-tile s3d-block','Letter '+o.c,'<span>'+o.c+'</span>');b.dataset.v=o.c;tiles.appendChild(b);return {b,o}});
        bs.forEach(({b,o})=>tap(b,()=>{if(fin||b.classList.contains('used'))return;if(o.c===word[k]){b.classList.add('used');sl[k].textContent=o.c;sl[k].classList.add('on');k++;chime(700+k*80,.12);bs.forEach(x=>x.b.classList.remove('glow','pulse'));hand.classList.remove('on');miss=0;if(k===word.length)right()}else{const good=bs.find(x=>!x.b.classList.contains('used')&&x.o.c===word[k]);wrong(b,'again',good&&good.b)}}))}}
    log('s3dreadopen',{id,tier,kind:ov.dataset.kind||tier})};
  function trickier(done){ov.innerHTML='';const box=el('div','s3d-tricky');ov.appendChild(box);say('tricky');const up=btn('s3d-tile s3d-thumb','Yes',SV('<path d="M14 44V22h-6v22zM18 22l8-16c4 0 6 3 5 7l-2 7h11c3 0 5 3 4 6l-4 14c-1 3-3 4-6 4H18z" fill="#5fbf6a" stroke="#fff" stroke-width="3"/>'));const dn=btn('s3d-tile s3d-thumb','No',SV('<g transform="rotate(180 24 24)"><path d="M14 44V22h-6v22zM18 22l8-16c4 0 6 3 5 7l-2 7h11c3 0 5 3 4 6l-4 14c-1 3-3 4-6 4H18z" fill="#ff8a7a" stroke="#fff" stroke-width="3"/></g>'));
    tap(up,()=>{me.tier=tierOf()==='pre'?'early':'reader';save();log('s3dtierup',{tier:me.tier});close();done&&done()});tap(dn,()=>{close();done&&done()});box.append(up,dn)}
  /* ---------- the Animal Book: a picture album; empty pages show the animal's shadow. No counts at k. ---------- */
  let bookFromVisit=false;function openBook(){bookFromVisit=K.getMode()==='visit'&&K.suspendVisit();if(K.getMode()!=='walk'&&!bookFromVisit)return;K.setMode('book');close();ov=el('div','s3d-bookov');K.ui.appendChild(ov);const grid=el('div','s3d-pages');ov.appendChild(grid);say('book');
    me.bseen=me.bseen||{};ORDER.forEach(id=>{const has=!!(me.book[id]||(me.met||{})[id]||(me.photos||{})[id]);const fresh=has&&!me.bseen[id];if(has)me.bseen[id]=1;const p=btn('s3d-page'+(has?' has':'')+(fresh?' fresh':'')+(me.book[id]?' named':''),has?ANIMALS[id].n:'Not yet',pic(id,'s3d-ppic'+(has?'':' shadow'))+(me.photos[id]?'<b class="s3d-pcam">'+ICO.cam+'</b>':'')+(fresh?'<i class="s3d-sprk"></i><i class="s3d-sprk s2"></i><i class="s3d-sprk s3"></i>':''));p.dataset.id=id;tap(p,()=>{if(has)say('say_'+id);else chime(500,.1)});grid.appendChild(p)});
    if(K.age>=6){const n=ORDER.filter(id=>me.book[id]).length;ov.appendChild(el('div','s3d-pcount',n+' / '+ORDER.length))}
    K.save();const x=btn('s3d-rskip s3d-bookx','Close',ICO.x);tap(x,()=>{close();backFromBook()});ov.appendChild(x);log('s3dbook',{has:Object.keys(me.book),coloured:ORDER.filter(id=>me.bseen[id])})}
  const backFromBook=()=>{if(bookFromVisit){bookFromVisit=false;K.resumeVisit()}else K.setMode('walk')};tap(K.bookB,()=>{if(K.getMode()==='book'){close();backFromBook();return}openBook()});
  /* ---------- grown-up panel: Reading row per child (A / cat / book / off) ---------- */
  K.openParent=()=>{if(K.getMode()!=='walk')K.endMode();K.setMode('parent');close();ov=el('div','s3d-parent');K.ui.appendChild(ov);say('parent');const row=el('div','s3d-prow');ov.appendChild(row);
    const cur=()=>me.off?'off':tierOf();const draw=()=>{row.querySelectorAll('button').forEach(b=>b.classList.toggle('sel',b.dataset.t===cur()))};
    ['pre','early','reader','off'].forEach(t=>{const b=btn('s3d-tile s3d-ptier','Reading '+t,TIERI[t]+'<em class="s3d-plab">'+({pre:'Letters',early:'Words',reader:'Sentences',off:'Reading off'})[t]+'</em>');b.dataset.t=t;tap(b,()=>{if(t==='off')me.off=true;else{me.off=false;me.tier=t}save();draw();chime(880,.1);log('s3dtier',{t,pid:K.pid})});row.appendChild(b)});draw();
    const x=btn('s3d-rskip s3d-bookx','Close',ICO.x);const shut=()=>{if(!ov||!ov.classList.contains('s3d-parent'))return;close();K.setMode('walk');try{window.dispatchEvent(new CustomEvent('spark:parentpanel',{detail:{open:false}}))}catch(e){}};tap(x,shut);ov.appendChild(x);
    const onEsc=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();removeEventListener('keydown',onEsc,true);shut()}};addEventListener('keydown',onEsc,true);log('s3dparent',{tier:cur()})};
  const prevDispose=K.dispose;K.dispose=()=>{close();prevDispose&&prevDispose()};K.tierOf=tierOf;
}
