
(() => {
  'use strict';
  const $=id=>document.getElementById(id),D=window.EarthData;
  const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch{return d}},set(k,v){try{localStorage.setItem(k,String(v))}catch{}}};
  const fresh=()=>({
    continent:null,environment:null,phase:'map',selected:null,discovered:[],evidence:[],answers:{},journal:[],
    buildUnlocked:false,world:{elephantsWater:false,downstreamIssue:false,balanced:false,wildlifeShare:60},buildParts:[]
  });
  let state=fresh(),active=null;
  try{state=Object.assign(fresh(),JSON.parse(store.get('sparkEarthState','{}')||'{}'));state.world=Object.assign(fresh().world,state.world||{})}catch{state=fresh()}
  const spark=()=>window.SparkCompanion;
  const root=()=>$('earthGame');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const age=()=>window.S?.age||+($('age')?.value||6)||6;
  function save(){store.set('sparkEarthState',JSON.stringify(state))}
  function update(extra={}){spark()?.updateContext?.({
    view:'world',planet:'Earth',continent:state.continent,environment:state.environment,selectedObject:state.selected,
    challenge:active?.id||null,challengeData:active||null,evidence:[...state.evidence],worldState:{...state.world},
    hypothesis:state.answers.blockage_evidence?.value||null,build:state.phase==='build'?{parts:state.buildParts}:null,...extra
  })}
  function setActive(q){active=q;update({challenge:q?.id||null,challengeData:q||null})}
  function clearChallenge(){active=null;update({challenge:null,challengeData:null,childAnswer:null,answerCorrect:null})}
  function setSelected(v){state.selected=v;update({selectedObject:v});save()}
  function addJournal(text){if(text&&!state.journal.includes(text)){state.journal.unshift(text);state.journal=state.journal.slice(0,12);save()}}
  function addEvidence(id,label,data={}){
    if(!state.evidence.some(e=>e.id===id)){state.evidence.push({id,label,...data});addJournal(label);}
    update();save();
  }
  function legacy(on){$('legacyMission')?.classList.toggle('hidden',!on)}
  function showGame(on=true){root()?.classList.toggle('hidden',!on)}
  function setSavannahMode(on){/* 2D Savannah retired; never apply .spark-savannah */document.body.classList.remove('spark-savannah');setBubble('',true)}
  function setBubble(text,hide=false){
    const el=$('earthSparkBubble'); if(!el)return;
    if(hide){el.classList.add('hidden');return}
    el.classList.remove('hidden');el.innerHTML=`<strong>Spark ✦</strong><p>${esc(text)}</p>`;
  }
  let introFor=null;
  function clearIntro(){introFor=null}
  /* spark10 fix 4 (Tester 5hhz): a playable continent's intro (Africa, North America, Australia) is spoken ONCE PER SESSION,
     not again after Back to Earth > Africa or Savannah Back. Locked continents keep the per-visit coming-soon line. */
  function speakIntro(key,text,perSession){
    if(introFor===key) return;
    introFor=key;
    if(perSession){try{const k='sparkIntroSaid:'+key;if(sessionStorage.getItem(k)) return;sessionStorage.setItem(k,'1')}catch(e){}}
    say(text,{kind:'intro',id:'continent:'+key});
  }
  function say(text,opts={}){
    setBubble(String(text||''));
    if(window.SparkVoice&&typeof SparkVoice.say==='function') return SparkVoice.say(text,Object.assign({kind:opts.kind||'line'},opts));
    return spark()?.speak?.(text,opts);
  }
  function crumb(extra=''){return `<div class="earth-breadcrumb">🌍 Earth${state.continent?' <span>›</span> '+esc(state.continent):''}${state.environment?' <span>›</span> <b>'+esc(state.environment)+'</b>':''}${extra?' <span>›</span> '+esc(extra):''}</div>`}
  function toolbar(){return `<div class="earth-toolbar"><button class="earth-back" data-earth-action="back">← Back</button></div>`}
  function goBack(){
    if(state.environment==='Savannah' || state.phase==='savannah') return selectContinent('Africa');
    if(state.continent) return worldMap();
    return exitEarth();
  }
  function bindActions(){
    root()?.querySelectorAll('[data-earth-action]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.earthAction;
      if(a==='back')return goBack();
      if(a==='savannah')return enterSavannah(false);
      if(a==='book')return;
      if(a==='menu'){setSavannahMode(false);root()?.classList.add('hidden');$('earthMap')?.classList.add('hidden');legacy(true);goPlatformHome();spark()?.updateContext?.({view:'home',planet:null,continent:null,environment:null,selectedObject:null,challenge:null,challengeData:null});return}
      if(a==='build')return;
    });
  }
  function openEarth(){clearIntro();setSavannahMode(false);legacy(false);$('earthMap')?.classList.remove('hidden');showGame(false);state.phase='map';state.continent=null;state.environment=null;state.selected=null;clearChallenge();save();update({view:'world'})}
  function exitEarth(){clearIntro();setSavannahMode(false);showGame(false);legacy(true);clearChallenge()}
  function worldMap(){clearIntro();setSavannahMode(false);state.continent=null;state.environment=null;state.phase='map';state.selected=null;clearChallenge();save();$('earthMap')?.classList.remove('hidden');showGame(false);legacy(false);$('worldTag').textContent='Tap a continent, then look for a green circle to play.';document.querySelectorAll('[data-c]').forEach(x=>x.classList.remove('sel'));update()}
  function enterSavannah(welcome=true){
    /* spark7: 2D Savannah is gone. Always open 3D Ranger Camp; on failure the hook shows retry and returns to Africa. */
    setSavannahMode(false);
    if(window.SparkSavannah3d&&typeof SparkSavannah3d.open==='function'){
      return SparkSavannah3d.open();
    }
    selectContinent('Africa');
    if(window.SparkVoice&&SparkVoice.say) SparkVoice.say("Let's try that again",{kind:'line',id:'savannah-retry'});
  }
  function continentLine(name){
    if(name==='Africa') return "Africa! The green circles are the Savannah and Egypt. Tap one to go in.";
    if(name==='North America') return "North America! The green circle is the Arctic. Tap it to go in.";
    if(name==='Australia') return "Australia! The green circle is the Reef. Tap it to go in.";
    return lockedContinentLine(name);
  }
  function lockedContinentLine(name){
    const near=name==='Africa'?'the Savannah or Egypt':name==='North America'?'the Arctic':name==='Australia'?'the Reef':'a green circle on Earth';
    return name+" is coming soon! Look for the green circle — that's "+near+".";
  }
  function selectContinent(name){
    setSavannahMode(false);
    const info=D.tree[name];if(!info)return;state.continent=name;state.environment=null;state.phase='continent';state.selected=null;clearChallenge();
    document.querySelectorAll('[data-c]').forEach(b=>b.classList.toggle('sel',b.dataset.c===name));
    $('worldTag').textContent=`Earth. ${info.fact}`;showGame(true);legacy(false);$('earthMap')?.classList.add('hidden');
    if(name==='Africa'){renderAfricaMap(info);return}
    if(window.ContinentMaps?.[name]){renderContinentMap(name,info);return}
    root().innerHTML=`${toolbar()}<div class="earth-panel"><h3>${esc(name)}</h3><p>${esc(info.fact)}</p><div class="env-grid">${info.environments.map(env=>{const play=false;return `<button class="env-card ${play?'playable':'tree-only'}" data-env="${esc(env)}"><strong>${play?'▶ ':''}${esc(env)}</strong><span>${play?'Tap to go in':'Coming soon'}</span></button>`}).join('')}</div><div class="tree-summary"><strong>Look for a green circle.</strong> Other places are coming soon.</div></div>`;
    root().querySelectorAll('[data-env]').forEach(b=>b.onclick=()=>chooseEnvironment(b.dataset.env));bindActions();update();save();
    speakIntro(name, lockedContinentLine(name));
  }
  function renderContinentMap(name,info){
    const config=window.ContinentMaps[name];
    const photos=Object.fromEntries(config.regions.map(([env,lat,lon,photo])=>[env,photo]));
    root().innerHTML=`${toolbar()}<div class="earth-panel continent-panel"><h3>${esc(name)}</h3><p>${esc(info.fact)}</p><div class="continent-map" role="group" tabindex="0" aria-label="Map of ${esc(name)} with ${info.environments.length} areas. Drag to turn, or use arrow keys. Tap a green circle to go in.">
      <canvas width="1920" height="1080" aria-hidden="true"></canvas><svg class="continent-connectors" aria-hidden="true"></svg><div class="continent-map-hint">DRAG TO TURN • TAP A REGION</div>
      ${info.environments.map(env=>{const photo=photos[env];return `<button class="continent-region" data-env="${esc(env)}" style="--photo-x:${photo%6*20}%;--photo-y:${Math.floor(photo/6)*100/3}%"><span class="continent-region-icon" aria-hidden="true"></span><strong>${esc(env)}</strong></button>`}).join('')}
    </div><div class="tree-summary"><strong>Tap a green circle to go in.</strong> Other places are coming soon.</div></div>`;
    root().querySelectorAll('[data-env]').forEach(b=>b.onclick=()=>chooseEnvironment(b.dataset.env));bindActions();update();save();
    window.mountContinentMap(root().querySelector('.continent-map'),name);
    speakIntro(name, continentLine(name), true);
  }
  function renderAfricaMap(info){
    const regions=[
      {env:'Savannah',cls:'savannah',note:'Open the grassland world'},
      {env:'Sahara',cls:'sahara egypt',note:'Open Ancient Egypt',label:'Ancient Egypt',playable:true},
      {env:'Congo Rainforest',cls:'congo',note:'Dense forest at the center'},
      {env:'Great Rift / Highlands',cls:'rift',note:'High land along the east'},
      {env:'Rivers / Wetlands',cls:'rivers',note:'Rivers and wet places'},
      {env:'Coast',cls:'coast',note:'Shores around the continent'},
      {env:'Towns / Cities',cls:'towns',note:'Places where people live'}
    ];
    root().innerHTML=`${toolbar()}<div class="earth-panel africa-panel"><h3>Africa</h3><p>${esc(info.fact)}</p><div class="africa-map-wrap"><div class="africa-continent-map" role="group" tabindex="0" aria-label="Map of Africa with seven regions. Drag to turn, or use arrow keys. Tap a green circle to go in.">
      <canvas width="1920" height="1080" aria-hidden="true"></canvas><div class="africa-map-hint">DRAG TO TURN • TAP A REGION</div>
      ${regions.map(r=>`<button class="africa-region ${r.cls}${r.playable||r.env==='Savannah'?' playable':''}" data-env="${esc(r.env)}" title="${esc(r.note)}"><span class="africa-region-icon" aria-hidden="true"></span><strong>${esc(r.label||r.env)}</strong></button>`).join('')}
    </div></div><div class="tree-summary"><strong>Tap a green circle to go in.</strong> The Savannah and Egypt are ready. Other places are coming soon.</div></div>`;
    root().querySelectorAll('[data-env]').forEach(b=>b.onclick=()=>chooseEnvironment(b.dataset.env));bindActions();update();save();
    window.mountAfricaMap?.(root().querySelector('.africa-continent-map'));
    speakIntro('Africa', continentLine('Africa'), true);
  }
  function chooseEnvironment(env){
    if(state.continent==='Africa'&&env==='Savannah') return enterSavannah(true);
    const loader=window.SparkAreasLoader;
    if(loader&&typeof loader.has==='function'&&loader.has(state.continent,env)&&loader.open){
      const id=(loader.registry&&loader.registry[state.continent+'/'+env])||null;
      if(id){setTimeout(function(){loader.open(id)},0);return}
    }
    const e=window.SparkMap&&((SparkMap.region&&SparkMap.region(state.continent,env))||SparkMap.find&&SparkMap.find(env));
    if(e&&window.SparkLock&&SparkLock.comingSoon) return SparkLock.comingSoon(e,'open');
    const near=state.continent==='Africa'?'the Savannah or Egypt':state.continent==='North America'?'the Arctic':state.continent==='Australia'?'the Reef':'a green circle';
    if(window.SparkVoice&&SparkVoice.say) setTimeout(function(){SparkVoice.say((e&&(e.spoken||e.name)||env)+' is coming soon! Look for the green circle — that\'s '+near+'.',{kind:'coming-soon'})},0);
  }
  function renderSavannah(){return enterSavannah(false)}
  function tryBuild(){return null}
  function showDiscoveryBook(){return null}
  function showConsequence(){return null}
  function showWorldChanged(){return null}
  window.EarthEngine={
    state,getState:()=>JSON.parse(JSON.stringify(state)),getActive:()=>active?JSON.parse(JSON.stringify(active)):null,
    setActive,save,update,say,root,toolbar,bindActions,clearChallenge,openEarth,exitEarth,worldMap,selectContinent,
    enterSavannah,renderSavannah,showConsequence,showWorldChanged,tryBuild,chooseEnvironment
  };
})();
