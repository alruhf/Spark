/* Spark Sandbox region: arctic (built from sbx-src/regions/arctic) */
/* ---- sbx-src/regions/arctic/00-region.js */
/* Arctic Ice Camp (Sandbox spec §8.1, §9.5). Region definition, the first-60-seconds script and the idle suggestions. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u;
var R=SB.defineRegion("arctic",{
  world:"areas/arctic/world.json",voice:"areas/arctic/voice/voice.json",
  intro:{file:"intro-8s-1080.mp4",hd:"intro-8s-4k.mp4",maxSeconds:10},
  seed:48211,
  pics:{fox:{pic:"animal_fox",label:"fox"},seal:{pic:"animal_seal",label:"seal"},husky:{pic:"sbx/husky_1",label:"husky"},walrus:{pic:"animal_walrus",label:"walrus"},bear:{pic:"animal_polarbear",label:"polar bear"}},
  badge:[{id:"igloo",c:"#7fd3ff",pic:"build_igloo_done",label:"Igloo built"},{id:"delivery",c:"#f6c445",pic:"sbx/parcel",label:"First delivery"},{id:"fox",c:"#ffffff",pic:"sbx/fox_sit",label:"Fox photo"},{id:"sale",c:"#ffb347",pic:"sbx/coin",label:"First sale"},{id:"kennel",c:"#c98b5a",pic:"sbx/kennel",label:"Cozy dog house"}],
  journal:[{id:"fox",pic:"sbx/fox_sit",slots:[{id:"peek",pic:"sbx/fox_peek",label:{k:"peeking",e:"PEEK"},word:"peek"},{id:"sit",pic:"sbx/fox_sit",label:{k:"sitting",e:"SIT"},word:"sit"},{id:"pounce",pic:"sbx/fox_pounce",label:{k:"jumping",e:"HOP"},word:"hop"}]},
           {id:"seal",pic:"animal_seal",slots:[{id:"rest",pic:"animal_seal",label:{k:"resting",e:"NAP"},word:"nap"}]},
           /* P3: unlocked by the fox-den sled trip (flags.foxKits) */
           {id:"foxkits",pic:"sbx/kits_all",slots:[{id:"one",pic:"sbx/kit_one",label:{k:"one kit",e:"KIT"},word:"kit"},{id:"two",pic:"sbx/kit_two",label:{k:"two kits",e:"TWO"},word:"two"},{id:"all",pic:"sbx/kits_all",label:{k:"all the kits",e:"ALL"},word:"all"}]}],
  types:{},
  initRegion:function(r,W){Object.keys(W.startKit||{}).forEach(function(k){if(!SB.kit.has(k)) SB.kit.add(k,W.startKit[k])});r.flags.step=U.atLeast("u")?5:0;r.order={fish:0}},
  onDay:function(r){r.day++;["husky1","husky2","husky3"].forEach(function(id,i){var e=SB.ent(id);if(!e) return;e.live.tired=false;if(i===(r.day%3)) e.live.hunger=1;e.live.mood="happy"});r.flags.traderOrder=1;SB.emit("day",{day:r.day});SB.store.save(true)}
});
/* ------------------------------------------------------------------ story steps (k and e; u and t start free with the job board) */
R.step=function(){var s=SB.session;return s&&s.reg&&s.reg.flags?(s.reg.flags.step|0):0};
R.setStep=function(n){var s=SB.session;if(!s||!s.reg||!s.reg.flags) return;if((s.reg.flags.step|0)>=n) return;s.reg.flags.step=n;SB.store.save();U.log("step",{n:n});R.refresh()};
R.refresh=function(){var s=SB.session;if(!s||!s.pano) return;Object.keys(R.types).forEach(function(t){if(R.types[t].refresh) SB.ecs.list.filter(function(e){return e.type===t}).forEach(function(e){R.types[t].refresh(e,SB.node(e.id),s)})})};
SB.on("band",function(){var s=SB.session;if(s&&!s.dead&&s.id==="arctic") R.refresh()});
R.named=function(){return ["husky1","husky2","husky3"].map(SB.ent).filter(function(e){return e&&e.live.name})[0]||null};
R.hungry=function(){return ["husky1","husky2","husky3"].map(SB.ent).filter(function(e){return e&&(e.live.hunger>0||e.live.tired)})[0]||null};
/* what Spark suggests next: {target, line, gesture, to} */
function sug(kind){var s=SB.session,n=R.named(),h=R.hungry();
  switch(kind){
    case "dogs":return {target:"husky1",line:R.step()===0?"hi_dogs":"try_dogs",kind:kind};
    case "fish":return {target:"fishhole",line:R.step()===2?"hungry_fish":"try_fish",kind:kind};
    case "feed":var d=h||n||SB.ent("husky1");return SB.kit.has("fish")?{target:"bucket",to:d.id,gesture:"drag",line:"give_fish",kind:kind}:{target:"fishhole",line:"try_fish",kind:"fish"};
    case "trade":return {target:"trader",line:R.step()===4?"trader_wants":"try_trade",kind:kind};
    case "fox":return {target:"woodpile",line:"look_fox",kind:kind};
    case "sled":return {target:"sled",line:"try_sled",kind:kind};
    case "igloo":return {target:"igloo",line:s.reg.ents.igloo&&s.reg.ents.igloo.built?"try_inside":"try_igloo",kind:kind};
    case "kennel":return {target:"kennel",line:"try_kennel",kind:kind};
    case "board":return {target:"jobboard",line:"job_board",kind:kind}}
  return null}
function plan(){var st=R.step(),s=SB.session,u=U.atLeast("u");
  if(u) return ["board","fish","sled","trade","igloo","dogs","kennel","fox"];
  if(st<=1) return ["dogs","fish","sled","trade"];if(st===2) return ["fish","dogs","sled","trade"];if(st===3) return ["feed","fish","trade","sled"];if(st===4) return ["trade","feed","fish","sled"];
  var L=["sled","igloo","trade","fish","kennel","dogs","fox"];if(R.hungry()&&SB.kit.has("fish")) L.unshift("feed");return L}
var rot=0,cur=null;
function visible(t){var p=SB.session.pano.screenOf(t);return p&&p.vis&&p.x>40&&p.x<innerWidth-40}
R.idle=function(i){var s=SB.session;if(s.overlayHint){s.overlayHint(i);return}var L=plan();
  if(i===0){cur=sug(L[0]);if(!visible(cur.target)){var alt=L.map(sug).filter(function(x){return visible(x.target)})[0];if(alt) cur=alt;else s.pano.toEnt(SB.ent(cur.target),700)}
    SB.hand.show(cur.target,{gesture:cur.gesture||"tap",to:cur.to});return}
  if(i===1){if(!cur) cur=sug(L[0]);if(!visible(cur.target)) s.pano.toEnt(SB.ent(cur.target),700);SB.voice.say(cur.line);SB.hand.show(cur.target,{gesture:cur.gesture||"tap",to:cur.to});return}
  rot++;var nx=null;for(var k=1;k<=L.length;k++){var c=sug(L[(rot+k)%L.length]);if(!cur||c.kind!==cur.kind){nx=c;break}}cur=nx||sug(L[0]);
  if(!visible(cur.target)) s.pano.toEnt(SB.ent(cur.target),700);SB.voice.say(cur.line);setTimeout(function(){SB.hand.show(cur.target,{gesture:cur.gesture||"tap",to:cur.to})},750)};
R.onSpot=function(){};
/* ------------------------------------------------------------------ first 60 seconds (§9.5) */
R.enter=function(s){var st=R.step();
  if(U.atLeast("u")&&!s.reg.flags.metU){s.reg.flags.metU=1;SB.store.save();SB.voice.say("job_board");return}
  if(st===0){SB.voice.say("hi_dogs").then(function(){if(s.dead||R.step()>0) return;woof("husky1");if(!SB.hand.visible()) SB.hand.show("husky1")});setTimeout(function(){if(R.step()===0) woof("husky1")},900);return}
  if(st===2){SB.voice.say("hungry_fish");return}
  if(st===3){SB.voice.say("give_fish");return}
  if(st===4){SB.voice.say("trader_wants");return}
  var h=R.hungry();if(h&&h.live.tired){SB.voice.say("dog_tired");return}SB.voice.say("welcome_back")};
function woof(id){var n=SB.node(id);if(!n) return;U.sfx("woof");U.anim(n.querySelector(".sbx-body"),"a-bark",700)}
R.woof=woof;
/* after a spark, the story moves on */
R.afterSpark=function(id,res,how){var s=SB.session,st=R.step();
  if(id==="fish"&&st<=2&&SB.kit.has("fish")){R.setStep(3);setTimeout(function(){if(s.spark) return;var d=R.named()||SB.ent("husky1");SB.voice.say("give_fish");s.pano.toEnt(d,500);setTimeout(function(){SB.hand.show("bucket",{gesture:"drag",to:d.id})},900)},300)}
  if(id==="post"&&st===4&&s.reg.badge.sale){R.setStep(5);setTimeout(function(){if(s.spark) return;R.foxPeek(true)},600)}
  if(id==="igloo"&&how==="done"&&R.afterIgloo) R.afterIgloo(res);
  if(id==="sled"&&how==="done"){if(res&&res.dest&&R.afterSled) R.afterSled(res);else setTimeout(function(){if(!s.spark) SB.voice.say("dog_tired")},500)}
  R.refresh()};
})();

/* review item 5: picture + gesture cue for every age-4 instruction (shown in the caption at ages 4-6) */
(function(){var V=window.SparkSandbox.voice,F="prop_fish",D="sbx/husky_1";V.cues={who_playing:["animal_fox","animal_seal","tap"],hi_dogs:[D,"tap"],hungry_fish:[D,F],tap_hole:["act_ice_hole","tap"],tap_now:[F,"tap"],order_fish:[F,"tap"],count_more:[F,"tap"],
  give_fish:[F,D,"tap"],trader_wants:["sbx/trader",F],look_fox:["sbx/fox_peek"],fox_wait:["sbx/fox_sit"],fox_photo:["sbx/camera","tap"],photo_again:["sbx/camera"],fox_shy:["sbx/fox_peek"],
  igloo_tap:["build_ice_block","tap"],photo_more2:["sbx/camera","tap"],photo_more1:["sbx/camera","tap"],photo_all:["sbx/fox_sit","sbx/lantern_fox"],dec_place:["sbx/rug_fur","tap"],dec_colour:["sbx/flag_red","tap"],bought_it:["sbx/backpack"],igloo_done:["build_igloo_done","tap"],decorate:["sbx/rug_fur","tap"],sleep_hint:["sbx/bed_platform","tap"],pick_parcel:["sbx/parcel","tap"],harness:[D,"sbx/sled_empty","tap"],
  dog_rest:["sbx/husky_sleep"],lanes:["steer"],dog_tired:["sbx/husky_sleep",F],sell_fish:[F,"sbx/trader","tap"],shop_pick:["sbx/coin","tap"],need_more:["sbx/jar","sbx/coin"],wish_ready:["sbx/jar","tap"],
  kennel:["sbx/kennel","tap"],kennel_shop:["sbx/trading_post"],brush_where:["sbx/brush",D,"tap"],brush_dog:["sbx/brush"],try_fish:["act_ice_hole","tap"],try_sled:["sbx/sled_empty","tap"],try_igloo:["build_ice_block","tap"],
  try_inside:["build_igloo_done","tap"],try_trade:["sbx/trader","tap"],try_kennel:["sbx/kennel","tap"],try_dogs:[D,"tap"],name_q:["sbx/name_snowball","sbx/name_star","tap"],name_q2:["sbx/name_cloud","sbx/name_pebble","tap"],name_q3:["tap"],
  fork_hut:["sbx/hut","steer"],sled_map:["sbx/fishcamp","sbx/pup","sbx/den_hill","tap"],fork_fish:["sbx/fishcamp","steer"],fork_pup:["sbx/pup","steer"],fork_den:["sbx/den_hill","steer"],bumpy_way:["build_snowcap"],fishcamp_sell:["prop_fish","sbx/coin"],fishcamp_none:["prop_fish"],fishcamp_rack:["sbx/fish_rack"],pup_found:["sbx/pup","tap"],pup_join:["sbx/pup"],pup_visit:["sbx/pup"],den_shy:["prop_fish","sbx/lantern_fox"],den_bring:["sbx/den_hill","tap"],den_kits:["sbx/kits_all","sbx/camera"],den_again:["sbx/kits_all"],pup_home:["sbx/pup"],kits_home:["sbx/kits_all"],rack_home:["sbx/fish_rack"],pup_happy:["sbx/pup"],fork_post:["sbx/postoffice","steer"],ride_fish:[F],sled_go:[D,"sbx/sled_empty"],job_board:["sbx/jobboard","tap"],
    fox_snap:["sbx/fox_peek","tap"],not_hungry:[D,F],igloo_grid_k:["build_ice_block","tap"],igloo_grid:["build_ice_block","tap"],igloo_more:["build_ice_block","tap"],igloo_ready:["build_igloo_done","tap"],warm_tunnel:["sbx/door_tunnel"],
    room_in:["sbx/backpack","tap"],room_place:["tap"],room_bad:["tap"],room_sel_k:["tap"],room_sel:["tap"],room_paint:["tap"],stove_vent:["sbx/stove"],igloo_in:["build_igloo_done"]}})();

/* ---- sbx-src/regions/arctic/10-huskies.js */
/* Huskies (pet, name, feed, brush), the fish bucket, the brush and the kennel. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic,T=R.types;
var NAMES={snowball:{k:"Snowball"},star:{k:"Star"},moon:{k:"Moon"},cloud:{k:"Cloud"},pebble:{k:"Pebble"},berry:{k:"Berry"}};
var PIC={snowball:"sbx/name_snowball",star:"sbx/name_star",moon:"sbx/name_moon",cloud:"sbx/name_cloud",pebble:"sbx/name_pebble",berry:"prop_berries"};
R.NAMES=NAMES;R.NPIC=PIC;
function nameText(n){return NAMES[n]?NAMES[n].k:String(n||"")}
R.nameText=nameText;
function dogName(e){return e&&e.live.name?nameText(e.live.name):"your dog"}
R.dogName=dogName;
/* ---------------------------------------------------------------- husky */
T.husky={
  make:function(e){var n=U.el("div","sbx-e-husky");n.innerHTML='<div class="sbx-body a-breathe"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"><img class="sbx-sleep" alt="" draggable="false" src="'+SB.img("sbx/husky_sleep")+'"></div><span class="sbx-tag" aria-hidden="true"></span><span class="sbx-need" aria-hidden="true"><img alt="" src="'+SB.img("prop_fish")+'"></span>';return n},
  mount:function(e,n,s){T.husky.refresh(e,n,s)},
  refresh:function(e,n){if(!n) return;var L=e.live,tag=n.querySelector(".sbx-tag"),k=U.band()==="k";
    if(L.name){var pic=PIC[L.name];tag.innerHTML=(pic?'<img alt="" src="'+SB.img(pic)+'">':"")+(k&&pic?"":'<b>'+U.esc(nameText(L.name))+'</b>');tag.classList.add("on");n.setAttribute("aria-label","Your dog "+nameText(L.name))}else{tag.innerHTML="";tag.classList.remove("on")}
    n.classList.toggle("tired",!!L.tired);/* P3 1e: the bubble shows only on a dog that is really hungry */n.classList.toggle("hungry",L.hunger>0&&(R.step()>=2||U.atLeast("u")));n.dataset.name=L.name||"";n.dataset.mood=L.mood||""},
  tap:function(e,n,ev,s){var L=e.live,b=n.querySelector(".sbx-body");L.taps=(L.taps|0)+1;
    if(L.tired){U.anim(b,"a-snore",900);U.sfx("plop");SB.voice.say("dog_tired");return}
    var an=["a-jump","a-wag","a-spin"][(L.taps-1)%3];U.anim(b,an,900);U.sfx(L.taps%2?"woof":"wag");var r=U.rect(n);U.floatUp(r.cx-14,r.t+r.h*.2,"\u2764\uFE0F",38);U.log("husky",{id:e.id,anim:an});
    if(!L.name&&!(s.reg.flags.naming)){var line=e.animal.he?"likes_you":"likes_you_f";if(R.step()===0) R.setStep(1);SB.voice.say(line).then(function(){if(!s.dead&&!L.name) R.nameDog(e)});return}
    if(L.hunger>0&&R.step()>=3&&SB.kit.has("fish")){SB.voice.say("give_fish");SB.hand.show("bucket",{gesture:"drag",to:e.id});return}
    SB.voice.say(e.animal.he?"likes_you":"likes_you_f")}
};
/* name cards (§9.5): each card lights up as its name is said; e+ shows the words, u/t can type a name */
R.nameDog=function(e){var s=SB.session;if(s.reg.flags.naming) return;s.reg.flags.naming=1;var band=U.band(),used={};["husky1","husky2","husky3"].forEach(function(id){var x=SB.ent(id);if(x&&x.live.name) used[x.live.name]=1});
  var opts=e.animal.names.filter(function(n){return !used[n]}).slice(0,3);if(opts.length<2) opts=Object.keys(NAMES).filter(function(n){return !used[n]}).slice(0,3);
  var off1=null,off2=null;var ov=U.el("div","sbx-names");ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Pick a name");s.root.appendChild(ov);var cards=[];
  function done(name){if(!s.reg.flags.naming) return;s.reg.flags.naming=0;if(off1) off1();if(off2) off2();s.overlayHint=null;SB.ecs.set(e.id,{name:name});ov.remove();SB.hand.hide();T.husky.refresh(e,SB.node(e.id));U.sfx("win");var n=SB.node(e.id),r=U.rect(n);U.burst(r.cx,r.t+r.h*.3,10);
    U.anim(n.querySelector(".sbx-body"),"a-spin",900);U.log("named",{id:e.id,name:name});var hi="hi_"+name;
    (SB.voice.has(hi)?SB.voice.say(hi):SB.voice.say({k:"Hi, {n}!"},{vars:{n:nameText(name)}})).then(function(){if(s.dead) return;if(R.step()<2&&!U.atLeast("u")){R.setStep(2);SB.ecs.set(e.id,{hunger:1});T.husky.refresh(e,SB.node(e.id));R.trot(e);SB.voice.say("hungry_fish").then(function(){if(!s.spark) SB.hand.show("fishhole")})}})}
  if(band==="u"||band==="t"){var f=U.el("form","sbx-nameform");f.innerHTML='<label>Name your dog <input type="text" maxlength="12" autocomplete="off" spellcheck="false"></label><div class="sbx-nsug"></div><button type="submit" class="sbx-ok">OK</button>';ov.appendChild(f);
    var inp=f.querySelector("input"),sg=f.querySelector(".sbx-nsug");opts.forEach(function(o){var b=U.btn("sbx-nchip",nameText(o),U.esc(nameText(o)));sg.appendChild(b);b.onclick=function(){inp.value=nameText(o)}});
    f.onsubmit=function(ev){ev.preventDefault();var v=(inp.value||"").replace(/[^A-Za-z \-']/g,"").trim().slice(0,12);if(!v) v=nameText(opts[0]);var key=Object.keys(NAMES).filter(function(k){return NAMES[k].k.toLowerCase()===v.toLowerCase()})[0];done(key||v)};
    SB.voice.say({u:"What will you call this dog? Type a name, or pick one."});setTimeout(function(){try{inp.focus()}catch(x){}},50);return}
  var row=U.el("div","sbx-ncards");ov.appendChild(row);
  opts.forEach(function(o){var c=U.btn("sbx-ncard",nameText(o),'<img alt="" draggable="false" src="'+SB.img(PIC[o])+'">'+(band==="k"?"":'<b>'+U.esc(nameText(o))+'</b>'));c.dataset.name=o;row.appendChild(c);cards.push(c);U.onTap(c,function(){SB.voice.cut();done(o)})});
  /* the question, then each name lit while it is said */
  var tok={};s.nameTok=tok;var q=e.animal.q||"name_q";
  function ask(){SB.voice.say(q).then(function(full){if(!full||s.nameTok!==tok||!ov.isConnected) return;var i=0;(function next(){if(i>=cards.length||!ov.isConnected||s.nameTok!==tok){cards.forEach(function(c){c.classList.remove("lit")});return}
      cards.forEach(function(c){c.classList.remove("lit")});var c=cards[i++];c.classList.add("lit");SB.voice.say("nm_"+c.dataset.name).then(function(ok){if(ok) next();else cards.forEach(function(c){c.classList.remove("lit")})})})()})}
  ask();s.overlayHint=function(i){if(i===1){s.nameTok=tok;ask()}SB.hand.show(cards[i%cards.length])};
  /* modal: a tap beside the cards puts the question away (the dog stays unnamed and asks again next time); a spark or scene also closes it */
  function cancel(){if(!ov.isConnected) return;s.reg.flags.naming=0;s.overlayHint=null;s.nameTok=null;ov.remove();SB.hand.hide();U.log("namecancel",{id:e.id});off1();off2()}
  U.onTap(ov,function(ev){if(ev.target===ov||ev.target===row){SB.voice.cut();cancel()}});off1=SB.on("spark:start",cancel);off2=SB.on("scene",cancel);s.cleanup.push(cancel)};
/* the dog trots to the fishing hole and back (show, don't tell) */
R.trot=function(e){var s=SB.session,h=SB.ent("fishhole");if(!h) return;var dx=(h.pos.x-e.pos.x-6)/100*SB.PANO.DW;var t0=performance.now(),D=1400;
  (function step(){var k=Math.min(1,(performance.now()-t0)/D),go=k<.5?k*2:2-k*2;e.ox=dx*(go<.5?2*go*go:1-Math.pow(-2*go+2,2)/2);s.pano.dirty=true;s.pano.kick();if(k<1&&!s.dead) requestAnimationFrame(step);else{e.ox=0;s.pano.dirty=true;s.pano.kick()}})();
  var n=SB.node(e.id);if(n) U.anim(n.querySelector(".sbx-body"),"a-trot",1400)};
/* feed and brush (drag, or tap the bucket then tap the dog) */
function feed(dog){var s=SB.session;if(!(dog.live.hunger>0)&&!dog.live.tired&&R.step()!==3){var nn=SB.node(dog.id);U.anim(nn.querySelector(".sbx-body"),"a-wag",700);SB.voice.say("not_hungry");U.log("notfed",{id:dog.id});return false}if(!SB.kit.remove("fish",1)) return false;var L=dog.live,n=SB.node(dog.id);SB.ecs.set(dog.id,{hunger:0,tired:false,mood:"happy"});U.sfx("munch");U.anim(n.querySelector(".sbx-body"),"a-eat",900);var r=U.rect(n);U.floatUp(r.cx,r.t+r.h*.3,"\u2764\uFE0F",40);
  SB.learn.moment("care.feed",{ok:true,region:"arctic"});U.log("feed",{id:dog.id,coins:SB.econ.balance()});T.husky.refresh(dog,n);T.bucket.refresh(SB.ent("bucket"),SB.node("bucket"));SB.hand.hide();
  SB.voice.say("yum").then(function(){if(R.step()===3){R.setStep(4);s.reg.flags.traderOrder=1;R.refresh();s.pano.toEnt(SB.ent("trader"),700);SB.voice.say("trader_wants").then(function(){SB.hand.show("trader")})}});return true}
function brush(dog){var n=SB.node(dog.id);if(dog.live.tired){SB.voice.say("dog_tired");return false}SB.ecs.set(dog.id,{brushed:(dog.live.brushed|0)+1,mood:"happy"});U.anim(n.querySelector(".sbx-body"),"a-shine",1200);U.sfx("wag");var r=U.rect(n);U.burst(r.cx,r.t+r.h*.4,8,["\u2728"]);
  SB.learn.moment("care.feed",{ok:true,region:"arctic"});U.log("brush",{id:dog.id});SB.voice.say("brush_dog");return true}
R.feed=feed;R.brush=brush;
function dogAt(x,y){var e=SB.entAt(x,y);if(e&&e.type==="husky") return e;
  var hb=null,hd=110;["husky1","husky2","husky3"].forEach(function(id){var d0=SB.ent(id),p=SB.session.pano.screenOf(id);if(!d0||!(d0.live.hunger>0)||!p||!p.vis) return;var d=Math.hypot(p.x-x,Math.max(0,Math.abs(p.y-y)-p.h/2));if(d<hd){hd=d;hb=d0}});if(hb) return hb;
  /* forgiving drop: the nearest dog within 90 px */
  var best=null,bd=90;["husky1","husky2","husky3"].forEach(function(id){var p=SB.session.pano.screenOf(id);if(!p||!p.vis) return;var d=Math.hypot(p.x-x,Math.max(0,Math.abs(p.y-y)-p.h/2));if(d<bd){bd=d;best=SB.ent(id)}});return best}
T.bucket={
  make:function(e){var n=U.el("div","sbx-e-bucket");n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"><span class="sbx-fishes"></span></div><span class="sbx-cnt"></span>';return n},
  mount:function(e,n,s){T.bucket.refresh(e,n);s.cleanup.push(SB.on("kit",function(){T.bucket.refresh(e,n)}));
    U.drag(n,{ok:function(){if(SB.kit.has("fish")) return true;SB.voice.say("try_fish");SB.hand.show("fishhole");return false},size:90,
      drop:function(x,y){var d=dogAt(x,y);if(d) return feed(d);var t=SB.entAt(x,y);if(t&&(t.type==="trader"||t.type==="post")){SB.openSpark("post");return true}return false}})},
  refresh:function(e,n){if(!n) return;var c=SB.kit.count("fish"),f=n.querySelector(".sbx-fishes"),h="";for(var i=0;i<Math.min(c,5);i++) h+='<img alt="" src="'+SB.img("prop_fish")+'" style="--i:'+i+'">';f.innerHTML=h;
    var k=U.band()==="k",cnt=n.querySelector(".sbx-cnt");cnt.textContent=k?"":(c?String(c):"");n.dataset.fish=c;n.setAttribute("aria-label","Fish bucket: "+c+" fish")}};
T.tool={
  make:function(e){var n=U.el("div","sbx-e-tool");n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"></div>';return n},
  mount:function(e,n){U.drag(n,{size:90,drop:function(x,y){var d=dogAt(x,y);if(d) return brush(d);return false},onArm:function(){SB.voice.say("brush_where")}})}};
/* ---------------------------------------------------------------- kennel: straw, windbreak, colour */
var KCOL={red:"#b33a2e",blue:"#2f5fa8",green:"#3c7d45"};
T.kennel={
  make:function(e){var n=U.el("div","sbx-e-kennel");n.innerHTML='<div class="sbx-body"><img class="sbx-kwind" alt="" src="'+SB.img("sbx/kennel_windbreak")+'"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"><span class="sbx-kcol"></span><img class="sbx-kstraw" alt="" src="'+SB.img("sbx/kennel_straw")+'"></div>';
    var m=n.querySelector(".sbx-kcol");m.style.webkitMaskImage=m.style.maskImage="url("+SB.img(e.sprite.asset)+")";return n},
  mount:function(e,n){T.kennel.refresh(e,n)},
  refresh:function(e,n){if(!n) return;var L=e.live;n.classList.toggle("straw",!!L.straw);n.classList.toggle("wind",!!L.wind);var m=n.querySelector(".sbx-kcol");m.style.background=L.colour?KCOL[L.colour]:"transparent";n.classList.toggle("col",!!L.colour);n.dataset.parts=[L.straw?"straw":"",L.wind?"wind":"",L.colour||""].join(",")},
  tap:function(e,n){var s=SB.session,ov=SB.panel("sbx-kpanel","The dog house"),L=e.live,k=U.band()==="k";
    var row=U.el("div","sbx-kparts");ov.body.appendChild(row);
    [["kennel_straw","straw"],["kennel_windbreak","wind"]].forEach(function(p){var have=SB.kit.has(p[0])||L[p[1]],b=U.btn("sbx-tile"+(L[p[1]]?" worn":"")+(have?"":" need"),SB.kit.name(p[0]),'<img alt="" src="'+SB.kitImg(p[0])+'">'+(have?"":'<span class="sbx-shopmark" aria-hidden="true"><img alt="" src="'+SB.img("sbx/coin")+'"></span>'));b.dataset.part=p[0];row.appendChild(b);
      U.onTap(b,function(){if(!have){SB.voice.say("kennel_shop");ov.close();SB.hand.show("trader");return}var on=!L[p[1]];var patch={};patch[p[1]]=on;SB.ecs.set(e.id,patch);if(on) SB.kit.remove(p[0],1);else SB.kit.add(p[0],1);b.classList.toggle("worn",on);T.kennel.refresh(e,SB.node(e.id));U.sfx(on?"thunk":"click");if(on){done()}})});
    var cols=U.el("div","sbx-kcols");ov.body.appendChild(cols);Object.keys(KCOL).forEach(function(c){var b=U.btn("sbx-swatch"+(L.colour===c?" on":""),c+" paint","");b.style.background=KCOL[c];b.dataset.colour=c;cols.appendChild(b);
      U.onTap(b,function(){var v=L.colour===c?null:c;SB.ecs.set(e.id,{colour:v});U.$$(".sbx-swatch",cols).forEach(function(x){x.classList.toggle("on",x.dataset.colour===v)});T.kennel.refresh(e,SB.node(e.id));U.sfx("pop");if(v) done()})});
    function done(){SB.hud.earnBadge("kennel");SB.learn.moment("care.feed",{ok:true,region:"arctic"});SB.voice.say("kennel_cozy")}
    SB.voice.say("kennel")}
};
})();

/* ---- sbx-src/regions/arctic/20-fox.js */
/* Wild animals: the Arctic fox (trust 0-100, saved) peeks from the wood pile and lives on wall 2; seals rest at the ice edge (tap only, no hunting). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic,T=R.types;
R.fox=function(){return SB.ent("fox_camp")};
R.trust=function(){var f=R.fox();return f?(f.live.trust|0):0};
R.foxPose=function(t){return t>=60?"pounce":t>=30?"sit":"peek"};
T.woodpile={make:function(e){var n=U.el("div","sbx-e-woodpile");n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"></div>';return n},
  tap:function(e,n){var f=SB.node("fox_camp");if(f&&f.classList.contains("peeking")){SB.openSpark("photo");return}U.sfx("crunch");U.anim(n.querySelector(".sbx-body"),"a-bump",400);if(R.step()>=4) R.foxPeek(true)}};
T.fox={make:function(e){var n=U.el("div","sbx-e-fox");n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img("sbx/fox_peek")+'"></div>';return n},
  mount:function(e,n){T.fox.refresh(e,n)},
  refresh:function(e,n){if(!n) return;n.classList.toggle("peeking",R.step()>=5||U.atLeast("u")||(e.live.trust|0)>0)},
  tap:function(){SB.openSpark("photo")}};
R.foxPeek=function(say){var s=SB.session,n=SB.node("fox_camp");if(!n) return;n.classList.add("peeking");U.anim(n.querySelector(".sbx-body"),"a-peek",1600);
  if(say){s.pano.toEnt(SB.ent("woodpile"),700);SB.voice.say("look_fox").then(function(){SB.hand.show("woodpile")})}};
T.foxden={make:function(e){var n=U.el("div","sbx-e-foxden");n.innerHTML='<div class="sbx-body"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"></div>';return n}};
T.seal={make:function(e){var n=U.el("div","sbx-e-seal");n.innerHTML='<div class="sbx-body a-breathe"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"></div>';return n},
  tap:function(e,n){if(n.classList.contains("away")) return;n.classList.add("away");U.sfx("splash");SB.voice.say("seal_shy");var s=SB.session,j=s.reg.journal.seal=s.reg.journal.seal||[];if(j.indexOf("rest")<0){j.push("rest");SB.store.save()}
    SB.learn.moment("sci.animal.behaviour",{ok:true,region:"arctic"});setTimeout(function(){n.classList.remove("away")},4500)}};
})();

/* ---- sbx-src/regions/arctic/30-igloo.js */
/* P3 §2 Grid igloo. A 9 x 9 snow field, up to 5 layers, seen in 3/4 (isometric) view. The child places blocks one at a time:
   tap the ground, the top of a block (stack) or the side of a block (same layer, so a dome can lean in). A block needs support
   under it or a neighbour on its layer; taking one away drops anything left hanging. Freeform shapes are fine.
   "Igloo ready" = an enclosed floor of at least 2 x 2 with a door. Saved as reg.ents.igloo.blocks = [[i,j,z,type],...].
   Palette: 4-6 snow + door; 7+ also ice window, half block, tunnel; 10+ also a vent.
   Warmth model, numbers at 10+. Sources (cited for the numbers used below):
   - Outside -30 °C is a typical Arctic winter night (Environment Canada climate normals, Iqaluit Jan mean min about -31 °C).
   - Wikipedia "Igloo": "temperatures inside may range from -7 °C to 16 °C when warmed by body heat alone" with outside as low as -45 °C;
     the entrance tunnel dug lower than the floor traps cold air (cold trap), and a vent hole lets stale air out.
   We keep the inside between about -30 °C (no shelter) and +5 °C (closed dome, low tunnel, lamp), the spec range (-5..+5 with a lamp). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic,T=R.types;
var N=9,L=5,OUT=-30;
var TYPES={s:{id:"s",h:1,label:"Snow block",min:"k"},d:{id:"d",h:1,label:"Door",min:"k"},w:{id:"w",h:1,label:"Ice window",min:"e"},h:{id:"h",h:.5,label:"Half block",min:"e"},t:{id:"t",h:.5,label:"Tunnel",min:"e"},v:{id:"v",h:1,label:"Vent",min:"u"}};
R.IGT=TYPES;
function key(i,j,z){return i+","+j+","+z}
/* ---------------------------------------------------------------- model */
function Model(list){var M={map:{}};(list||[]).forEach(function(b){if(b&&b.length>=4&&inb(b[0],b[1],b[2])) M.map[key(b[0],b[1],b[2])]=b[3]});return M}
function inb(i,j,z){return i>=0&&j>=0&&i<N&&j<N&&z>=0&&z<L}
function at(M,i,j,z){return M.map[key(i,j,z)]||null}
function list(M){return Object.keys(M.map).map(function(k){var p=k.split(",").map(Number);return [p[0],p[1],p[2],M.map[k]]})}
var NB=[[1,0],[-1,0],[0,1],[0,-1]];
/* support: everything connected to the ground through "below" or "same-layer neighbour" links stays; the rest falls */
function supported(M){var ok={},q=[];Object.keys(M.map).forEach(function(k){var z=+k.split(",")[2];if(z===0){ok[k]=1;q.push(k)}});
  while(q.length){var k=q.pop(),p=k.split(",").map(Number);var cand=[[p[0],p[1],p[2]+1]];NB.forEach(function(d){cand.push([p[0]+d[0],p[1]+d[1],p[2]])});
    cand.forEach(function(c){var kk=key(c[0],c[1],c[2]);if(M.map[kk]&&!ok[kk]){ok[kk]=1;q.push(kk)}})}return ok}
function canPlace(M,i,j,z){if(!inb(i,j,z)||at(M,i,j,z)) return false;if(z===0) return true;var b=at(M,i,j,z-1);if(b&&b!=="t") return true;
  return NB.some(function(d){return !!at(M,i+d[0],j+d[1],z)})}
/* enclosure on the floor layer: flood from outside through empty floor cells (4-way); the rest of the empty cells are inside */
function analyse(M){var occ=function(i,j){return !!at(M,i,j,0)},out={},q=[];
  for(var a=-1;a<=N;a++){[[a,-1],[a,N],[-1,a],[N,a]].forEach(function(c){var k=c[0]+","+c[1];if(!out[k]){out[k]=1;q.push(c)}})}
  while(q.length){var c=q.pop();NB.forEach(function(d){var i=c[0]+d[0],j=c[1]+d[1];if(i<0||j<0||i>=N||j>=N) return;var k=i+","+j;if(out[k]||occ(i,j)) return;out[k]=1;q.push([i,j])})}
  var seen={},rooms=[];for(var i=0;i<N;i++) for(var j=0;j<N;j++){var k=i+","+j;if(out[k]||occ(i,j)||seen[k]) continue;var comp=[],qq=[[i,j]];seen[k]=1;
      while(qq.length){var c2=qq.pop();comp.push(c2);NB.forEach(function(d){var a2=c2[0]+d[0],b2=c2[1]+d[1],k2=a2+","+b2;if(a2<0||b2<0||a2>=N||b2>=N||seen[k2]||out[k2]||occ(a2,b2)) return;seen[k2]=1;qq.push([a2,b2])})}rooms.push(comp)}
  var best=null;rooms.forEach(function(c){var set={};c.forEach(function(x){set[x[0]+","+x[1]]=1});var sq=c.some(function(x){return set[(x[0]+1)+","+x[1]]&&set[x[0]+","+(x[1]+1)]&&set[(x[0]+1)+","+(x[1]+1)]});
    var doors=[];if(sq) list(M).forEach(function(b){if(b[2]!==0||b[3]!=="d") return;var inn=NB.some(function(d){return set[(b[0]+d[0])+","+(b[1]+d[1])]}),outs=NB.filter(function(d){return out[(b[0]+d[0])+","+(b[1]+d[1])]});if(inn&&outs.length) doors.push({i:b[0],j:b[1],out:outs[0]})});
    if(sq&&(!best||doors.length>best.doors.length||(doors.length===best.doors.length&&c.length>best.cells.length))) best={cells:c,set:set,doors:doors}});
  var ready=!!(best&&best.doors.length);
  var info={ready:ready,room:best,out:out,count:Object.keys(M.map).length};
  /* warmth parts (only count once there is a closed room) */
  var w={outside:OUT,inside:OUT,parts:{}};
  if(best){var set=best.set,wall={},hs=[];best.cells.forEach(function(c){NB.forEach(function(d){var k=(c[0]+d[0])+","+(c[1]+d[1]);if(!set[k]) wall[k]=1})});
    Object.keys(wall).forEach(function(k){var p=k.split(",").map(Number),h=0;for(var z=0;z<L;z++){if(at(M,p[0],p[1],z)) h=z+1;else break}hs.push(h)});
    var avg=hs.reduce(function(a,b){return a+b},0)/Math.max(1,hs.length),gaps=hs.filter(function(h){return h<2}).length;
    var cov=best.cells.filter(function(c){for(var z=1;z<L;z++) if(at(M,c[0],c[1],z)) return true;return false}).length/best.cells.length;
    var tunnel=best.doors.some(function(d){var ti=d.i+d.out[0],tj=d.j+d.out[1];return at(M,ti,tj,0)==="t"});
    var vent=list(M).some(function(b){return b[3]==="v"});
    var P=w.parts;P.walls=12;P.height=Math.round(Math.min(Math.max(avg-1,0),2)*3);P.roof=Math.round(8*cov);P.gaps=-Math.min(gaps,6);P.draft=best.doors.length&&!tunnel?-4:0;P.tunnel=tunnel?1:0;
    w.inside=OUT+P.walls+P.height+P.roof+P.gaps+P.draft;w.vent=vent;w.tunnel=tunnel;w.roof=cov;w.avgH=avg}
  info.warm=w;return info}
R.igloo={Model:Model,analyse:analyse,list:list,at:at,N:N,L:L};
/* lamp heat from the inside decor (32-interior.js sets R.lampHeat) */
R.iglooWarmth=function(){var ig=SB.ent("igloo");var M=Model(ig&&ig.live.blocks),a=analyse(M),w=a.warm;var t=w.inside;if(a.room) t+=(R.lampHeat?R.lampHeat():0);return {outside:OUT,inside:Math.min(t,5),ready:a.ready,info:a}};
/* ---------------------------------------------------------------- iso renderer (shared by the builder, the camp sprite and the room) */
var tex=null;function snowTex(){if(tex) return tex;var c=document.createElement("canvas");c.width=c.height=96;var g=c.getContext("2d"),im=g.createImageData(96,96);
  var r=R.rng?R.rng(911):Math.random;for(var p=0;p<im.data.length;p+=4){var v=200+Math.floor((typeof r==="function"?r():Math.random())*55);im.data[p]=v;im.data[p+1]=v;im.data[p+2]=Math.min(255,v+8);im.data[p+3]=255}
  g.putImageData(im,0,0);g.globalAlpha=.5;g.filter="blur(1.2px)";g.drawImage(c,0,0);tex=c;return c}
function View(cv,o){var V={cv:cv,g:cv.getContext("2d"),rot:o&&o.rot||0,zoom:o&&o.zoom||1,W:0,H:0,S:20,cx:0,cy:0,dpr:1};V.fit=o&&o.fit;return V}
function proj(V,x,y,z){var a=V.rot*Math.PI/180+Math.PI/4*0,dx=x-N/2,dy=y-N/2,c=Math.cos(a),s=Math.sin(a),rx=dx*c-dy*s,ry=dx*s+dy*c;return [V.cx+(rx-ry)*V.S*.866,V.cy+(rx+ry)*V.S*.5-z*V.S*.92,rx+ry]}
function unproj(V,sx,sy){var u=(sx-V.cx)/(V.S*.866),v=(sy-V.cy)/(V.S*.5),rx=(u+v)/2,ry=(v-u)/2,a=V.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [rx*c+ry*s+N/2,-rx*s+ry*c+N/2]}
function size(V){var r=V.cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);V.W=r.width||300;V.H=r.height||200;V.dpr=d;if(V.cv.width!==Math.round(V.W*d)||V.cv.height!==Math.round(V.H*d)){V.cv.width=Math.round(V.W*d);V.cv.height=Math.round(V.H*d)}
  if(V.fit){V.S=Math.min(V.W/(N*1.75),V.H/(N*1.0+L*.95))*V.zoom;V.cx=V.W/2;V.cy=V.H-(N*V.S*.5)-V.S*.4}
  else{var base=Math.min(V.W/(N*1.9),(V.H-200)/(N*1.05+2.4));V.S=Math.max(14,base)*V.zoom;V.cx=V.W/2;V.cy=V.H*.56+(V.H<520?20:0)}}
function shade(hex,k){var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return "rgb("+Math.round(r*k)+","+Math.round(g*k)+","+Math.round(b*k)+")"}
var COL={s:"#f2f7fc",d:"#eef4fa",w:"#a8d8f0",h:"#eef4fa",t:"#e8f0f8",v:"#f2f7fc"};
/* faces of one block: [{n:[nx,ny]|null(top), pts:[[x,y]...], z0,z1}] */
function faces(V,M,i,j,z,t){var h=TYPES[t]?TYPES[t].h:1,z0=z,z1=z+h,out=[],a=V.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  var up=at(M,i,j,z+1);if(!(up&&h===1&&up!=="t")) out.push({n:null,pts:[proj(V,i,j,z1),proj(V,i+1,j,z1),proj(V,i+1,j+1,z1),proj(V,i,j+1,z1)]});
  [[1,0,[i+1,j],[i+1,j+1]],[0,1,[i+1,j+1],[i,j+1]],[-1,0,[i,j+1],[i,j]],[0,-1,[i,j],[i+1,j]]].forEach(function(f){var nx=f[0],ny=f[1],nrx=nx*c-ny*s,nry=nx*s+ny*c;if(nrx+nry<=0.02) return;
    var nb=at(M,i+nx,j+ny,z);if(nb&&TYPES[nb]&&TYPES[nb].h>=h&&nb!=="w"&&t!=="w") return;
    out.push({n:[nx,ny],sc:nrx-nry,pts:[proj(V,f[2][0],f[2][1],z0),proj(V,f[3][0],f[3][1],z0),proj(V,f[3][0],f[3][1],z1),proj(V,f[2][0],f[2][1],z1)]})});return out}
function poly(g,pts){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++) g.lineTo(pts[k][0],pts[k][1]);g.closePath()}
function bil(p,u,v){/* p: [b0,b1,t1,t0] bottom-left,bottom-right,top-right,top-left */var bx=p[0][0]+(p[1][0]-p[0][0])*u,by=p[0][1]+(p[1][1]-p[0][1])*u,tx=p[3][0]+(p[2][0]-p[3][0])*u,ty=p[3][1]+(p[2][1]-p[3][1])*u;return [bx+(tx-bx)*v,by+(ty-by)*v]}
function arch(g,p,w,hh){g.beginPath();var n=14;var a0=bil(p,.5-w/2,0);g.moveTo(a0[0],a0[1]);for(var k=0;k<=n;k++){var th=Math.PI-k*Math.PI/n,u=.5+Math.cos(th)*w/2,v=(hh-w*.45)+Math.sin(th)*w*.45;var q=bil(p,u,Math.min(v,hh));g.lineTo(q[0],q[1])}var a1=bil(p,.5+w/2,0);g.lineTo(a1[0],a1[1]);g.closePath()}
function drawBlock(V,M,b,o){var g=V.g,t=b[3],F=faces(V,M,b[0],b[1],b[2],t),pat=g.createPattern(snowTex(),"repeat"),ghost=o&&o.ghost;
  F.forEach(function(f){var k=f.n?(f.sc<0?.9:.76):1,base=COL[t]||COL.s;poly(g,f.pts);
    if(ghost){g.fillStyle=ghost==="bad"?"rgba(230,70,60,.38)":"rgba(80,220,120,.38)";g.fill();g.strokeStyle=ghost==="bad"?"rgba(230,70,60,.9)":"rgba(60,200,100,.95)";g.lineWidth=2;g.stroke();return}
    g.fillStyle=t==="w"?"rgba(150,205,235,"+(f.n?.72:.8)+")":shade(base,k);g.fill();
    if(t!=="w"){g.save();poly(g,f.pts);g.clip();g.globalAlpha=.22;g.fillStyle=pat;g.fill();g.globalAlpha=1;
      /* soft ambient occlusion at the bottom of side faces */
      if(f.n){var a=f.pts[0],c=f.pts[3],gr=g.createLinearGradient(a[0],a[1],c[0],c[1]);gr.addColorStop(0,"rgba(60,90,130,.22)");gr.addColorStop(.35,"rgba(60,90,130,0)");g.fillStyle=gr;poly(g,f.pts);g.fill()}g.restore()}
    else{g.save();poly(g,f.pts);g.clip();g.strokeStyle="rgba(255,255,255,.75)";g.lineWidth=Math.max(1,V.S*.06);var p0=f.n?bil(f.pts,.2,.25):f.pts[0],p1=f.n?bil(f.pts,.55,.85):f.pts[2];g.beginPath();g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1]);g.stroke();g.restore()}
    g.strokeStyle=t==="w"?"rgba(90,150,190,.8)":"rgba(120,150,180,.55)";g.lineWidth=1;poly(g,f.pts);g.stroke();
    if(f.n&&(t==="d"||t==="t")){arch(g,f.pts,t==="d"?.56:.62,t==="d"?.82:.8);g.fillStyle="#1c2a3d";g.fill();g.strokeStyle="rgba(255,255,255,.5)";g.stroke()}
    if(!f.n&&t==="v"){var cc=[0,1,2,3].map(function(n){return f.pts[n]}),mx=(cc[0][0]+cc[2][0])/2,my=(cc[0][1]+cc[2][1])/2;g.beginPath();g.ellipse(mx,my,V.S*.22,V.S*.13,0,0,Math.PI*2);g.fillStyle="#24344a";g.fill();
      g.strokeStyle="rgba(220,235,255,.8)";g.lineWidth=Math.max(1.5,V.S*.07);for(var q=-1;q<=1;q+=2){g.beginPath();g.moveTo(mx+q*V.S*.12,my-V.S*.2);g.bezierCurveTo(mx+q*V.S*.3,my-V.S*.5,mx-q*V.S*.05,my-V.S*.7,mx+q*V.S*.15,my-V.S*1.0);g.stroke()}}})}
function order(V,bl){return bl.map(function(b){var p=proj(V,b[0]+.5,b[1]+.5,0);return {b:b,d:p[2],z:b[2]}}).sort(function(a,b){return a.d-b.d||a.z-b.z})}
function render(V,M,o){o=o||{};size(V);var g=V.g;g.setTransform(V.dpr,0,0,V.dpr,0,0);g.clearRect(0,0,V.W,V.H);
  if(!o.noGround){/* the snow field */var c=[proj(V,0,0,0),proj(V,N,0,0),proj(V,N,N,0),proj(V,0,N,0)];poly(g,c);var gr=g.createLinearGradient(0,Math.min(c[0][1],c[1][1],c[2][1],c[3][1]),0,Math.max(c[0][1],c[1][1],c[2][1],c[3][1]));gr.addColorStop(0,"rgba(226,236,248,.92)");gr.addColorStop(1,"rgba(246,250,255,.96)");g.fillStyle=gr;g.fill();
    g.strokeStyle="rgba(150,175,205,.35)";g.lineWidth=1;for(var a=0;a<=N;a++){var p=proj(V,a,0,0),q=proj(V,a,N,0);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();p=proj(V,0,a,0);q=proj(V,N,a,0);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()}
    (o.guide||[]).forEach(function(cl){if(at(M,cl[0],cl[1],0)) return;var pts=[proj(V,cl[0]+.08,cl[1]+.08,0),proj(V,cl[0]+.92,cl[1]+.08,0),proj(V,cl[0]+.92,cl[1]+.92,0),proj(V,cl[0]+.08,cl[1]+.92,0)];poly(g,pts);
      var pulse=.35+.25*Math.sin(performance.now()/300);g.fillStyle=cl[2]==="d"?"rgba(255,190,60,"+pulse+")":"rgba(70,150,235,"+pulse+")";g.fill();g.setLineDash([5,4]);g.strokeStyle=cl[2]==="d"?"#d98a10":"#2f7fd0";g.lineWidth=2;g.stroke();g.setLineDash([]);
      if(cl[2]==="d"){var m=proj(V,cl[0]+.5,cl[1]+.5,0);g.fillStyle="#7a4a08";g.beginPath();g.ellipse(m[0],m[1]-V.S*.18,V.S*.18,V.S*.24,0,Math.PI,0);g.lineTo(m[0]+V.S*.18,m[1]);g.lineTo(m[0]-V.S*.18,m[1]);g.closePath();g.fill()}});
    /* contact shadows */list(M).forEach(function(b){if(b[2]!==0) return;var pts=[proj(V,b[0]-.06,b[1]-.06,0),proj(V,b[0]+1.12,b[1]-.06,0),proj(V,b[0]+1.12,b[1]+1.12,0),proj(V,b[0]-.06,b[1]+1.12,0)];poly(g,pts);g.fillStyle="rgba(70,100,140,.16)";g.fill()})}
  var bl=list(M);if(o.ghost) bl.push(o.ghost.b);order(V,bl).forEach(function(x){drawBlock(V,M,x.b,x.b===(o.ghost&&o.ghost.b)?{ghost:o.ghost.bad?"bad":"ok"}:null)})}
/* what is under a screen point: the nearest visible block face, else the ground cell */
function pick(V,M,sx,sy){var bl=order(V,list(M)).reverse();for(var n=0;n<bl.length;n++){var b=bl[n].b,F=faces(V,M,b[0],b[1],b[2],b[3]);for(var m=0;m<F.length;m++) if(inPoly(sx,sy,F[m].pts)) return {b:b,n:F[m].n}}
  var c=unproj(V,sx,sy),i=Math.floor(c[0]),j=Math.floor(c[1]);if(i>=0&&j>=0&&i<N&&j<N) return {ground:[i,j]};return null}
function inPoly(x,y,p){var ins=false;for(var a=0,b=p.length-1;a<p.length;b=a++){var xi=p[a][0],yi=p[a][1],xj=p[b][0],yj=p[b][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins}return ins}
R.iso={View:View,render:render,pick:pick,proj:proj,size:size,faces:faces,poly:poly,bil:bil,order:order,drawBlock:drawBlock};
/* ---------------------------------------------------------------- outside: the igloo in camp is drawn from its blocks */
T.igloo={
  make:function(e){var n=U.el("div","sbx-e-igloo");n.innerHTML='<div class="sbx-body"><img class="sbx-site" alt="" draggable="false" src="'+SB.img("build_ice_block")+'"><canvas class="sbx-igcv" aria-hidden="true"></canvas><span class="sbx-iglow"></span></div>';return n},
  mount:function(e,n,s){var L2=e.live;if(!Array.isArray(L2.blocks)) L2.blocks=[];T.igloo.refresh(e,n);var t=0;var f=function(){clearTimeout(t);t=setTimeout(function(){T.igloo.refresh(e,n)},120)};addEventListener("resize",f);s.cleanup.push(function(){removeEventListener("resize",f)})},
  refresh:function(e,n){if(!n) return;var bl=Array.isArray(e.live.blocks)?e.live.blocks:[],cv=n.querySelector(".sbx-igcv");n.classList.toggle("has",bl.length>0);n.classList.toggle("built",!!e.live.built);n.dataset.blocks=bl.length;
    if(!bl.length) return;var M=Model(bl),V=View(cv,{fit:true,rot:0});requestAnimationFrame(function(){var minI=N,maxI=0,minJ=N,maxJ=0;bl.forEach(function(b){minI=Math.min(minI,b[0]);maxI=Math.max(maxI,b[0]);minJ=Math.min(minJ,b[1]);maxJ=Math.max(maxJ,b[1])});
      size(V);var span=Math.max(maxI-minI,maxJ-minJ)+1;V.zoom=Math.min(2.6,N/Math.max(3,span));size(V);var mid=proj(V,(minI+maxI+1)/2,(minJ+maxJ+1)/2,0);V.cx+=V.W/2-mid[0];V.cy+=V.H*.82-mid[1];render(V,M,{noGround:true});
      var lit=SB.ent("igloo")&&R.lampHeat&&R.lampHeat()>0;n.classList.toggle("lit",!!lit)})},
  tap:function(e){if(e.live.built&&Array.isArray(e.live.blocks)&&analyse(Model(e.live.blocks)).ready) R.inside();else SB.openSpark("igloo")}
};
/* ---------------------------------------------------------------- the builder */
function guideFor(){/* a 4 x 4 ring with the door at the front (the side nearest the viewer at the start) */var g=[];for(var i=2;i<=5;i++) for(var j=2;j<=5;j++){if(i>2&&i<5&&j>2&&j<5) continue;g.push([i,j,(i===5&&j===4)?"d":"s"])}return g}
SB.defineSpark("igloo",{region:"arctic",opensFrom:"igloo",label:"Build an igloo",skills:["sci.insulation","math.count.10","math.space.3d"],
start:function(api){return new Promise(function(done){var s=SB.session,st=api.stage,band=api.band,k=band==="k",ig=SB.ent("igloo"),Lv=ig.live;if(!Array.isArray(Lv.blocks)) Lv.blocks=[];
  st.classList.add("sbx-iglsp","sbx-grid3");var bg=U.el("div","sbx-bg");st.appendChild(bg);SB.stripBg(bg,s.pano.imgs[0].src,0,30,s.cfg.strip.overlap);
  var cv=U.el("canvas","sbx-igb");cv.setAttribute("aria-label","Snow field: tap to place a block");st.appendChild(cv);
  var M=Model(Lv.blocks),V=View(cv,{rot:Lv.rot||0,zoom:1}),tool="s",last=null,ghost=null,guide=(k&&!Lv.built)?guideFor():[],spokeWarm=false,wasReady=analyse(M).ready;
  /* palette (by age) + eraser + undo */
  var pal=U.el("div","sbx-igpal");st.appendChild(pal);
  var ICON={s:'<i class="sbx-blk s"></i>',d:'<i class="sbx-blk d"></i>',w:'<i class="sbx-blk w"></i>',h:'<i class="sbx-blk h"></i>',t:'<i class="sbx-blk t"></i>',v:'<i class="sbx-blk v"></i>'};
  var avail=Object.keys(TYPES).filter(function(t){return U.atLeast(TYPES[t].min)});
  avail.forEach(function(t){var b=U.btn("sbx-igt"+(t===tool?" on":""),TYPES[t].label,ICON[t]);b.dataset.tool=t;pal.appendChild(b);U.onTap(b,function(){setTool(t)})});
  var er=U.btn("sbx-igt sbx-iger","Take a block away",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 30l16-16 12 12-12 12H16z" fill="#f4a6b8" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M8 40h32" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>');er.dataset.tool="erase";pal.appendChild(er);U.onTap(er,function(){setTool("erase")});
  var un=U.btn("sbx-igt sbx-igun","Undo",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 12L8 22l10 10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22h18a11 11 0 010 22h-6" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>');pal.appendChild(un);U.onTap(un,undo);
  function setTool(t){tool=t;U.$$(".sbx-igt",pal).forEach(function(b){b.classList.toggle("on",b.dataset.tool===t)});U.sfx("click");U.log("igtool",{tool:t})}
  /* turn buttons (big at 4-6) */
  var rl=U.btn("sbx-igrot l"+(k?" big":""),"Turn left",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 30a14 14 0 10-6 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M26 32l6 7 6-8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
      rr=U.btn("sbx-igrot r"+(k?" big":""),"Turn right",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 30a14 14 0 116 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M22 32l-6 7-6-8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  st.appendChild(rl);st.appendChild(rr);U.onTap(rl,function(){turn(-90)});U.onTap(rr,function(){turn(90)});
  /* warmth meter: outside vs inside */
  var meter=U.el("div","sbx-igmeter");meter.innerHTML='<div class="sbx-th out"><i></i><span class="sbx-thl" aria-hidden="true">\u2744\uFE0E</span><b></b></div><div class="sbx-th in"><i></i><span class="sbx-thl" aria-hidden="true"><svg viewBox="0 0 48 32"><path d="M4 30a20 20 0 0140 0z" fill="#fff"/><path d="M19 30a5 6 0 0110 0z" fill="#1c2a3d"/></svg></span><b></b></div><span class="sbx-vent" aria-hidden="true">\u223F\u223F</span>';st.appendChild(meter);
  var go=U.btn("sbx-iggo","Go inside",'<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M4 46a28 28 0 0156 0z" fill="#fff"/><path d="M24 46a8 10 0 0116 0z" fill="#1c2a3d"/></svg><span aria-hidden="true">\u2192</span>');st.appendChild(go);U.onTap(go,function(){SB.voice.cut();U.log("iggo",{});done({ok:true,inside:true})});
  var anim=0,rotT=null;
  function draw(){render(V,M,{guide:guide,ghost:ghost});cv.dataset.blocks=Object.keys(M.map).length;cv.dataset.rot=V.rot;cv.dataset.zoom=V.zoom.toFixed(2)}
  function loop(){anim=0;if(api.closed) return;if(rotT){var kk=Math.min(1,(performance.now()-rotT.t0)/rotT.d),e=kk<.5?2*kk*kk:1-Math.pow(-2*kk+2,2)/2;V.rot=rotT.a+(rotT.b-rotT.a)*e;if(kk>=1){V.rot=((rotT.b%360)+360)%360;rotT=null;Lv.rot=V.rot}}
    draw();if(rotT||guide.some(function(c){return !at(M,c[0],c[1],0)})) anim=requestAnimationFrame(loop)}
  function kick(){if(!anim) anim=requestAnimationFrame(loop)}
  function turn(d){var from=rotT?rotT.b:V.rot;rotT={a:V.rot,b:Math.round((from+d)/90)*90,t0:performance.now(),d:U.reduced()?1:420};U.sfx("whoosh");U.log("igturn",{to:rotT.b});kick()}
  function persist(){Lv.blocks=list(M);SB.ecs.set("igloo",{blocks:Lv.blocks,rot:Lv.rot||0});SB.store.save(true);T.igloo.refresh(ig,SB.node("igloo"))}
  function status(spoken){var a=analyse(M),w=R.iglooWarmth();var tin=w.inside,tout=OUT;meter.querySelector(".in i").style.height=U.clamp((tin+32)/40*100,4,100)+"%";meter.querySelector(".out i").style.height=U.clamp((tout+32)/40*100,4,100)+"%";
    meter.dataset.inside=tin;meter.dataset.outside=tout;meter.classList.toggle("warm",tin>-20);meter.classList.toggle("vent",!!a.warm.vent);var nums=U.atLeast("u");meter.classList.toggle("nums",nums);
    meter.querySelector(".in b").textContent=nums?(tin>0?"+":"")+tin+" \u00B0C":"";meter.querySelector(".out b").textContent=nums?tout+" \u00B0C":"";
    go.classList.toggle("on",a.ready);st.dataset.ready=a.ready?1:0;st.dataset.inside=tin;U.log("igstat",{n:a.count,ready:a.ready,inside:tin,tunnel:!!a.warm.tunnel,parts:a.warm.parts});
    if(a.ready&&!wasReady){wasReady=true;SB.ecs.set("igloo",{built:true});guide=[];U.sfx("win");var r=U.rect(cv);U.burst(r.cx,r.cy,18);SB.hud.earnBadge("igloo");api.learn("sci.insulation",true);
      api.say("igloo_ready").then(function(){if(!api.closed) SB.hand.show(go)})}
    else if(!a.ready&&wasReady){wasReady=false;SB.ecs.set("igloo",{built:false})}
    /* at most one spoken warmth line per build: the first time a low tunnel makes it warmer */
    if(spoken&&a.warm.tunnel&&!spokeWarm){spokeWarm=true;api.say(nums?{u:"The tunnel sits low, so cold air stays in it. Inside is now "+tin+" \u00B0C; outside is "+tout+" \u00B0C.",t:"Cold air sinks into the low tunnel: "+tin+" \u00B0C inside."}:"warm_tunnel")}
    return a}
  function placeAt(i,j,z,t){if(!canPlace(M,i,j,z)) return false;M.map[key(i,j,z)]=t;last={add:[[i,j,z,t]]};U.sfx("thunk");U.log("igplace",{i:i,j:j,z:z,t:t,n:Object.keys(M.map).length});
    persist();draw();status(t==="t");if(!wasReady&&k) SB.hand.hide();return true}
  function erase(b){delete M.map[key(b[0],b[1],b[2])];var ok=supported(M),fell=[];Object.keys(M.map).forEach(function(kk){if(!ok[kk]){var p=kk.split(",").map(Number);fell.push([p[0],p[1],p[2],M.map[kk]]);delete M.map[kk]}});
    last={rem:[b].concat(fell)};U.sfx(fell.length?"crunch":"pop");U.log("igerase",{b:b,fell:fell.length,n:Object.keys(M.map).length});persist();draw();status(false)}
  function undo(){if(!last){U.sfx("no");return}if(last.add) last.add.forEach(function(b){delete M.map[key(b[0],b[1],b[2])]});if(last.rem) last.rem.forEach(function(b){M.map[key(b[0],b[1],b[2])]=b[3]});U.log("igundo",{});last=null;U.sfx("whoosh");persist();draw();status(false)}
  /* where would a tap place, for the current tool */
  function target(px,py){var r=cv.getBoundingClientRect(),h=pick(V,M,px-r.left,py-r.top);if(!h) return null;
    if(tool==="erase") return h.b?{erase:h.b}:null;
    var t=tool;if(k&&h.ground){var gd=guide.filter(function(c){return c[0]===h.ground[0]&&c[1]===h.ground[1]})[0];if(gd&&gd[2]==="d") t="d"}
    if(h.ground){var i=h.ground[0],j=h.ground[1],z=0;while(z<L&&at(M,i,j,z)) z++;return {p:[i,j,z,t],ok:canPlace(M,i,j,z)}}
    var b=h.b;if(!h.n){return {p:[b[0],b[1],b[2]+1,t],ok:canPlace(M,b[0],b[1],b[2]+1)&&b[3]!=="t"}}
    return {p:[b[0]+h.n[0],b[1]+h.n[1],b[2],t],ok:canPlace(M,b[0]+h.n[0],b[1]+h.n[1],b[2])}}
  /* input: tap = place; one-finger drag = turn (snaps to 90 degrees); two fingers = pinch zoom; wheel = zoom */
  var pts={},drag=null,pinch=null;
  cv.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;try{cv.setPointerCapture(e.pointerId)}catch(x){}pts[e.pointerId]={x:e.clientX,y:e.clientY};var ids=Object.keys(pts);
    if(ids.length===2){var a=pts[ids[0]],b=pts[ids[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:V.zoom};drag=null}else drag={x:e.clientX,y:e.clientY,rot:V.rot,moved:false,t:performance.now()}});
  cv.addEventListener("pointermove",function(e){if(pts[e.pointerId]){pts[e.pointerId]={x:e.clientX,y:e.clientY}}
    if(pinch){var ids=Object.keys(pts);if(ids.length>=2){var a=pts[ids[0]],b=pts[ids[1]];V.zoom=U.clamp(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(10,pinch.d),.6,2.2);kick()}return}
    if(drag&&pts[e.pointerId]){var dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)>14) drag.moved=true;if(drag.moved){rotT=null;V.rot=drag.rot+dx*.45;ghost=null;kick()}return}
    if(e.pointerType==="mouse"){var tg=target(e.clientX,e.clientY);var ng=tg&&tg.p?{b:tg.p,bad:!tg.ok}:null;if(JSON.stringify(ng)!==JSON.stringify(ghost)){ghost=ng;kick()}}});
  function up(e){var was=pts[e.pointerId];delete pts[e.pointerId];if(pinch){if(Object.keys(pts).length<2){pinch=null;U.log("igzoom",{z:V.zoom})}drag=null;return}
    if(!drag||!was) return;var d=drag;drag=null;if(d.moved){turn(0);return}if(e.type==="pointercancel") return;
    var tg=target(e.clientX,e.clientY);if(!tg){U.sfx("no");return}if(tg.erase){erase(tg.erase);return}if(!tg.ok){U.sfx("no");U.log("igbad",{p:tg.p});return}placeAt(tg.p[0],tg.p[1],tg.p[2],tg.p[3])}
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);cv.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"&&ghost){ghost=null;kick()}});
  cv.addEventListener("wheel",function(e){e.preventDefault();V.zoom=U.clamp(V.zoom*(e.deltaY>0?.9:1.1),.6,2.2);U.log("igzoom",{z:V.zoom});kick()},{passive:false});
  var onR=function(){kick()};addEventListener("resize",onR);api.onCleanup(function(){removeEventListener("resize",onR);if(anim) cancelAnimationFrame(anim)});
  /* read-only probe for tests and the hand: where a cell corner / centre is on screen right now */
  R.igScreen=function(x,y,z){var r=cv.getBoundingClientRect(),q=proj(V,x,y,z||0);return {x:r.left+q[0],y:r.top+q[1]}};R.igGuide=function(){return guide.filter(function(c){return !at(M,c[0],c[1],0)}).map(function(c){return c.slice()})};
  api.onCleanup(function(){R.igScreen=null;R.igGuide=null});
  draw();kick();status(false);
  function guideNext(){var c=guide.filter(function(c){return !at(M,c[0],c[1],0)})[0];if(!c) return null;return function(){var r=cv.getBoundingClientRect(),p=proj(V,c[0]+.5,c[1]+.5,0);return {x:r.left+p[0],y:r.top+p[1]}}}
  api.hint(function(i){if(wasReady){SB.hand.show(go);return}var g=guideNext();if(g){SB.hand.show(g);if(i>0) api.say("igloo_tap")}else{SB.hand.show(pal.querySelector('[data-tool="s"]'))}});
  var intro=wasReady?"igloo_more":(Object.keys(M.map).length?"igloo_tap":(k?"igloo_grid_k":"igloo_grid"));
  api.say(U.atLeast("u")&&!Object.keys(M.map).length?{u:"Build your own igloo, one block at a time. Tap the snow, the top of a block, or its side. Close in a floor of at least 2 by 2 and add a door.",t:"Freeform build: enclose at least 2 x 2 with a door. Watch the inside temperature."}:intro).then(function(){if(api.closed) return;var g=guideNext();if(g&&!Object.keys(M.map).length) SB.hand.show(g)});
})}});
/* after the builder: straight inside when the child tapped "go inside" */
var prevAfter=null;
R.afterIgloo=function(res){if(res&&res.inside) setTimeout(function(){R.inside()},60)};
})();

/* ---- sbx-src/regions/arctic/32-interior.js */
/* P3 §3 Igloo interior. The room is the floor the child closed in (2 floor squares per igloo block, so the shape follows the build).
   Full-room 3/4 view: floor + the two back walls (which walls are "back" changes as you turn in 90 degree steps), zoom.
   Paint bucket: 8 colours (+3 patterns at 7+) for the floor and for each wall segment (one per block edge).
   Things: floor / wall / small (on the floor or on a table or shelf top). Place (tap the thing, tap the spot; or drag), move,
   turn 90 degrees, 3 colours, back to the bag. Snap grid, no overlaps, green / red ghost. Saved as reg.ents.igloo.interior. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic;
var PAINT=[["snow","#f3f7fb"],["ice","#bfe2f4"],["tan","#d8b88a"],["pink","#f2b6c6"],["green","#9fd09a"],["purple","#b9a2dc"],["red","#e27b6f"],["yellow","#f4d779"]];
var PAT=["","stripes","dots","zigzag"];
var FREE=["dec_mug","dec_flag","dec_table","dec_stool"];
R.CATALOG=function(){return Object.keys(SB.kit.items).filter(function(id){var it=SB.kit.items[id];return it.type==="decor"&&it.place})};
function I(){var ig=SB.ent("igloo");if(!ig) return null;var L=ig.live;if(!L.interior||!L.interior.items) L.interior={paint:{floor:null,segs:{}},items:[]};return L.interior}
function item(id){return SB.kit.item(id)}
function hasVent(){var ig=SB.ent("igloo");return !!(ig&&(ig.live.blocks||[]).some(function(b){return b[3]==="v"}))}
R.lampHeat=function(){var In=I();if(!In) return 0;var t=0;In.items.forEach(function(d){var it=item(d.id);if(!it||!it.warm) return;if(it.needs==="vent"&&!hasVent()) return;t+=it.warm});return Math.min(t,12)};
/* ---------------------------------------------------------------- variant pictures (3 colours), made once per picture */
var IMG={},VAR={};
function load(id){var it=item(id);if(!it) return null;if(IMG[id]) return IMG[id];var im=new Image();im.decoding="async";im.src=SB.kitImg(id);IMG[id]=im;im.onload=function(){VAR[id]=null;if(R._roomKick) R._roomKick()};return im}
function hue(r,g,b,deg){var a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);var m=[.213+c*.787-s*.213,.715-c*.715-s*.715,.072-c*.072+s*.928,.213-c*.213+s*.143,.715+c*.285+s*.140,.072-c*.072-s*.283,.213-c*.213-s*.787,.715-c*.715+s*.715,.072+c*.928+s*.072];
  return [m[0]*r+m[1]*g+m[2]*b,m[3]*r+m[4]*g+m[5]*b,m[6]*r+m[7]*g+m[8]*b]}
var TINT=[null,{deg:130,tint:[120,170,235]},{deg:250,tint:[235,120,150]}];
function variant(id,v){var im=load(id);if(!im||!im.complete||!im.naturalWidth) return null;if(!v) return im;VAR[id]=VAR[id]||{};if(VAR[id][v]) return VAR[id][v];
  var sc=Math.min(1,360/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.naturalWidth*sc));c.height=Math.max(1,Math.round(im.naturalHeight*sc));var g=c.getContext("2d");g.drawImage(im,0,0,c.width,c.height);
  try{var d=g.getImageData(0,0,c.width,c.height),p=d.data,T=TINT[v];for(var i=0;i<p.length;i+=4){if(!p[i+3]) continue;var r=p[i],gg=p[i+1],b=p[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),sat=mx?(mx-mn)/mx:0,lum=(r*.3+gg*.59+b*.11)/255;
      var h=hue(r,gg,b,T.deg),w=Math.max(0,.55-sat)*1.1;p[i]=U.clamp(h[0]*(1-w)+T.tint[0]*lum*w,0,255);p[i+1]=U.clamp(h[1]*(1-w)+T.tint[1]*lum*w,0,255);p[i+2]=U.clamp(h[2]*(1-w)+T.tint[2]*lum*w,0,255)}g.putImageData(d,0,0)}catch(e){}
  VAR[id][v]=c;return c}
R.variant=variant;
/* ---------------------------------------------------------------- room geometry */
function room(){var ig=SB.ent("igloo"),a=R.igloo.analyse(R.igloo.Model(ig.live.blocks));var cells=a.room?a.room.cells:[[3,3],[3,4],[4,3],[4,4]];var set={};cells.forEach(function(c){set[c[0]+","+c[1]]=1});
  var floor={};cells.forEach(function(c){for(var a2=0;a2<2;a2++) for(var b=0;b<2;b++) floor[(c[0]*2+a2)+","+(c[1]*2+b)]=1});
  var segs=[];cells.forEach(function(c){[[1,0,0],[0,1,1],[-1,0,2],[0,-1,3]].forEach(function(d){if(set[(c[0]+d[0])+","+(c[1]+d[1])]) return;var i=c[0],j=c[1],p0,p1;
      if(d[2]===0){p0=[2*i+2,2*j];p1=[2*i+2,2*j+2]}else if(d[2]===1){p0=[2*i,2*j+2];p1=[2*i+2,2*j+2]}else if(d[2]===2){p0=[2*i,2*j];p1=[2*i,2*j+2]}else{p0=[2*i,2*j];p1=[2*i+2,2*j]}
      var door=a.room&&a.room.doors.some(function(dd){return dd.i===i+d[0]&&dd.j===j+d[1]});segs.push({id:i+","+j+","+d[2],n:[d[0],d[1]],p0:p0,p1:p1,door:door})})});
  var xs=cells.map(function(c){return c[0]}),ys=cells.map(function(c){return c[1]});
  return {cells:cells,floor:floor,segs:segs,ready:a.ready,bx:[Math.min.apply(0,xs)*2,(Math.max.apply(0,xs)+1)*2],by:[Math.min.apply(0,ys)*2,(Math.max.apply(0,ys)+1)*2],vent:a.warm.vent}}
var WH=2.6;
function V2(cv){return {cv:cv,g:cv.getContext("2d"),rot:0,zoom:1,S:30,cx:0,cy:0,W:0,H:0,dpr:1,ox:0,oy:0}}
function pr(V,x,y,z){var a=V.rot*Math.PI/180,dx=x-V.ox,dy=y-V.oy,c=Math.cos(a),s=Math.sin(a),rx=dx*c-dy*s,ry=dx*s+dy*c;return [V.cx+(rx-ry)*V.S*.866,V.cy+(rx+ry)*V.S*.5-z*V.S*.92,rx+ry]}
function unpr(V,sx,sy){var u=(sx-V.cx)/(V.S*.866),v=(sy-V.cy)/(V.S*.5),rx=(u+v)/2,ry=(v-u)/2,a=V.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [rx*c+ry*s+V.ox,-rx*s+ry*c+V.oy]}
function back(V,sg){var a=V.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a),nrx=sg.n[0]*c-sg.n[1]*s,nry=sg.n[0]*s+sg.n[1]*c;return nrx+nry<-.02}
function fit(V,Rm,topInset,botInset){var r=V.cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);V.W=r.width;V.H=r.height;V.dpr=d;if(V.cv.width!==Math.round(V.W*d)||V.cv.height!==Math.round(V.H*d)){V.cv.width=Math.round(V.W*d);V.cv.height=Math.round(V.H*d)}
  V.ox=(Rm.bx[0]+Rm.bx[1])/2;V.oy=(Rm.by[0]+Rm.by[1])/2;var span=Math.max(Rm.bx[1]-Rm.bx[0],Rm.by[1]-Rm.by[0]);var avail=V.H-topInset-botInset;
  V.S=Math.min(V.W/(span*1.85+1),avail/(span*1.0+WH*1.0+.6))*V.zoom;V.cx=V.W/2;V.cy=topInset+avail*.5+WH*V.S*.92*.45}
function poly(g,p){g.beginPath();g.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++) g.lineTo(p[k][0],p[k][1]);g.closePath()}
function inPoly(x,y,p){var ins=false;for(var a=0,b=p.length-1;a<p.length;b=a++){var xi=p[a][0],yi=p[a][1],xj=p[b][0],yj=p[b][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins}return ins}
var patC={};function patCanvas(p){if(patC[p]) return patC[p];var c=document.createElement("canvas");c.width=c.height=24;var g=c.getContext("2d");g.strokeStyle="rgba(255,255,255,.75)";g.fillStyle="rgba(255,255,255,.75)";g.lineWidth=4;
  if(p==="stripes"){g.beginPath();g.moveTo(0,24);g.lineTo(24,0);g.moveTo(-12,12);g.lineTo(12,-12);g.moveTo(12,36);g.lineTo(36,12);g.stroke()}else if(p==="dots"){g.beginPath();g.arc(6,6,3.5,0,7);g.arc(18,18,3.5,0,7);g.fill()}else if(p==="zigzag"){g.lineWidth=3;g.beginPath();g.moveTo(0,16);g.lineTo(6,8);g.lineTo(12,16);g.lineTo(18,8);g.lineTo(24,16);g.stroke()}
  patC[p]=c;return c}
function colOf(pt,def){if(!pt) return def;var c=PAINT.filter(function(x){return x[0]===pt.c})[0];return c?c[1]:def}
function shade(hex,k){var n=parseInt(hex.slice(1),16);return "rgb("+Math.round(((n>>16)&255)*k)+","+Math.round(((n>>8)&255)*k)+","+Math.round((n&255)*k)+")"}
/* footprint of a floor thing */
function fp(d){var it=item(d.id),f=it.place==="small"?[1,1]:(it.fp||[1,1]);return (d.r|0)%2?[f[1],f[0]]:[f[0],f[1]]}
function flat(it){return it.id==="dec_rug"}
/* ---------------------------------------------------------------- placement rules */
function cellsOf(d,x,y){var f=fp(d),out=[];for(var a=0;a<f[0];a++) for(var b=0;b<f[1];b++) out.push((x+a)+","+(y+b));return out}
function valid(In,Rm,d,at,V){var it=item(d.id);if(!it) return {ok:false};
  if(it.needs==="vent"&&!hasVent()) return {ok:false,why:"vent"};
  if(at.k==="floor"){if(it.place==="wall") return {ok:false};var cs=cellsOf(d,at.x,at.y);if(!cs.every(function(c){return Rm.floor[c]})) return {ok:false};
    var me=flat(it);var busy={};In.items.forEach(function(o){if(o===d||o.u===d.u||!o.at||o.at.k!=="floor") return;if(flat(item(o.id))!==me) return;cellsOf(o,o.at.x,o.at.y).forEach(function(c){busy[c]=1})});
    if(cs.some(function(c){return busy[c]})) return {ok:false,why:"taken"};return {ok:true}}
  if(at.k==="wall"){if(it.place!=="wall") return {ok:false};var sg=Rm.segs.filter(function(s){return s.id===at.s})[0];if(!sg||sg.door) return {ok:false,why:sg&&sg.door?"door":""};if(V&&!back(V,sg)) return {ok:false};
    var need=it.top?[0,1]:[at.o];var taken=In.items.some(function(o){if(o===d||o.u===d.u||!o.at||o.at.k!=="wall"||o.at.s!==at.s) return false;var io=item(o.id),oc=io&&io.top?[0,1]:[o.at.o];return oc.some(function(q){return need.indexOf(q)>=0})});
    return taken?{ok:false,why:"taken"}:{ok:true}}
  if(at.k==="top"){if(it.place!=="small") return {ok:false};var p=In.items.filter(function(o){return o.u===at.p})[0];if(!p||p===d) return {ok:false};var pi=item(p.id);if(!pi||!pi.top||at.o>=pi.top) return {ok:false};
    var t=In.items.some(function(o){return o!==d&&o.u!==d.u&&o.at&&o.at.k==="top"&&o.at.p===at.p&&o.at.o===at.o});return t?{ok:false,why:"taken"}:{ok:true}}
  return {ok:false}}
/* ---------------------------------------------------------------- the scene */
R.inside=function(){var s=SB.session,ig=SB.ent("igloo"),band=U.band(),k=band==="k",In=I();if(!In) return;
  if(!s.reg.flags.decorGift3){s.reg.flags.decorGift3=1;FREE.forEach(function(id){if(!SB.kit.has(id)&&!In.items.some(function(d){return d.id===id})) SB.kit.add(id,1)})}
  var sc=SB.scene({id:"igloo",cls:"sbx-room",label:"Inside the igloo"});var st=sc.stage;sc.node.classList.add("sbx-room3");
  var cv=U.el("canvas","sbx-rcv");cv.setAttribute("aria-label","Inside the igloo");st.appendChild(cv);var V=V2(cv);var Rm=room();V.rot=In.rot|0;
  var tray=U.el("div","sbx-rtray");sc.node.appendChild(tray);var tools=U.el("div","sbx-rtools");sc.node.appendChild(tools);var bar=null,pal=null;
  var meter=U.el("div","sbx-rmeter");meter.innerHTML='<div class="sbx-th out"><i></i><span class="sbx-thl" aria-hidden="true">\u2744\uFE0E</span><b></b></div><div class="sbx-th in"><i></i><span class="sbx-thl" aria-hidden="true">\uD83C\uDFE0\uFE0E</span><b></b></div>';sc.node.appendChild(meter);
  var mode="look",armed=null,sel=null,ghost=null,paint={c:"pink",p:""},hits=[],anim=0,drag=null;
  function save(){In.rot=V.rot;SB.ecs.set("igloo",{interior:In});SB.store.save(true);R.refreshIgloo&&R.refreshIgloo();var c=0;U.log("room",{items:In.items.map(function(d){return d.id+":"+d.v+":"+(d.r|0)+":"+d.at.k}),paint:In.paint})}
  function kick(){if(!anim) anim=requestAnimationFrame(function(){anim=0;draw()})}R._roomKick=kick;
  /* ---- draw */
  function draw(){if(sc.closed) return;fit(V,Rm,92,k?170:150);var g=V.g;g.setTransform(V.dpr,0,0,V.dpr,0,0);g.clearRect(0,0,V.W,V.H);hits=[];
    var bgr=g.createRadialGradient(V.W/2,V.H*.45,40,V.W/2,V.H*.5,Math.max(V.W,V.H)*.7);var warm=R.lampHeat()>0;bgr.addColorStop(0,warm?"#3a3e5a":"#2b3a55");bgr.addColorStop(1,"#0d1626");g.fillStyle=bgr;g.fillRect(0,0,V.W,V.H);
    /* floor */
    var fc=colOf(In.paint.floor,"#e7edf4");Object.keys(Rm.floor).forEach(function(kk){var p=kk.split(",").map(Number),q=[pr(V,p[0],p[1],0),pr(V,p[0]+1,p[1],0),pr(V,p[0]+1,p[1]+1,0),pr(V,p[0],p[1]+1,0)];poly(g,q);g.fillStyle=fc;g.fill();g.strokeStyle="rgba(120,140,170,.22)";g.lineWidth=1;g.stroke();
      if(In.paint.floor&&In.paint.floor.p){g.save();poly(g,q);g.clip();g.fillStyle=g.createPattern(patCanvas(In.paint.floor.p),"repeat");g.globalAlpha=.55;g.fill();g.restore()}hits.push({floor:[p[0],p[1]],poly:q,z:-1})});
    /* back walls */
    var segs=Rm.segs.filter(function(sg){return back(V,sg)}).map(function(sg){var a=pr(V,sg.p0[0],sg.p0[1],0),b=pr(V,sg.p1[0],sg.p1[1],0);if(a[0]>b[0]){var t=a;a=b;b=t;sg.flip=true}else sg.flip=false;return {sg:sg,a:a,b:b,d:(a[2]+b[2])/2}}).sort(function(x,y){return x.d-y.d});
    segs.forEach(function(w){var sg=w.sg,ta=[w.a[0],w.a[1]-WH*V.S*.92],tb=[w.b[0],w.b[1]-WH*V.S*.92],q=[[w.a[0],w.a[1]],[w.b[0],w.b[1]],tb,ta];poly(g,q);var a=V.rot*Math.PI/180,sh=(sg.n[0]*Math.cos(a)-sg.n[1]*Math.sin(a))-(sg.n[0]*Math.sin(a)+sg.n[1]*Math.cos(a))<0?.95:.84;
      var pc=In.paint.segs[sg.id];g.fillStyle=shade(colOf(pc,"#eef3f9"),sh);g.fill();
      g.save();poly(g,q);g.clip();if(pc&&pc.p){g.fillStyle=g.createPattern(patCanvas(pc.p),"repeat");g.globalAlpha=.5;g.fill();g.globalAlpha=1}
      /* snow-block seams */g.strokeStyle="rgba(110,135,165,.28)";g.lineWidth=1.2;for(var r=1;r<3;r++){var y0=r/3,l=[w.a[0],w.a[1]+(ta[1]-w.a[1])*y0],rr=[w.b[0],w.b[1]+(tb[1]-w.b[1])*y0];g.beginPath();g.moveTo(l[0],l[1]);g.lineTo(rr[0],rr[1]);g.stroke();
        var off=(r%2)*.5;for(var c=off;c<=1;c+=1){var x0=w.a[0]+(w.b[0]-w.a[0])*c,y00=w.a[1]+(w.b[1]-w.a[1])*c;g.beginPath();g.moveTo(x0,y00+(ta[1]-w.a[1])*(r-1)/3);g.lineTo(x0,y00+(ta[1]-w.a[1])*r/3);g.stroke()}}
      var gr=g.createLinearGradient(0,w.a[1],0,ta[1]);gr.addColorStop(0,"rgba(40,60,90,.18)");gr.addColorStop(.3,"rgba(40,60,90,0)");g.fillStyle=gr;g.fillRect(Math.min(w.a[0],ta[0]),Math.min(ta[1],tb[1]),Math.abs(w.b[0]-w.a[0])+2,Math.abs(w.a[1]-ta[1])+Math.abs(w.b[1]-w.a[1])+4);g.restore();
      if(sg.door){var m=[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2],hw=Math.abs(w.b[0]-w.a[0])*.28,hh=WH*V.S*.92*.62;g.beginPath();g.moveTo(m[0]-hw,m[1]+(w.b[1]-w.a[1])*-.28);g.lineTo(m[0]-hw,m[1]-hh*.6);g.quadraticCurveTo(m[0],m[1]-hh*1.25,m[0]+hw,m[1]-hh*.6);g.lineTo(m[0]+hw,m[1]+(w.b[1]-w.a[1])*.28);g.closePath();g.fillStyle="#17243a";g.fill()}
      g.strokeStyle="rgba(100,125,155,.45)";g.lineWidth=1;poly(g,q);g.stroke();hits.push({wall:sg,poly:q,w:w,z:0})});
    /* wall things */
    var drawn={};In.items.forEach(function(d){if(d.at.k!=="wall") return;var w=segs.filter(function(x){return x.sg.id===d.at.s})[0];if(!w) return;drawWall(d,w,false)});
    if(ghost&&ghost.at.k==="wall"){var gw=segs.filter(function(x){return x.sg.id===ghost.at.s})[0];if(gw) drawWall(ghost.d,gw,ghost.ok?"ok":"bad",ghost.at)}
    /* flats, then floor things by depth, each followed by what stands on top of it */
    var fl=In.items.filter(function(d){return d.at.k==="floor"});fl.filter(function(d){return flat(item(d.id))}).forEach(function(d){drawFlat(d,false)});
    if(ghost&&ghost.at.k==="floor"&&flat(item(ghost.d.id))) drawFlat(ghost.d,ghost.ok?"ok":"bad",ghost.at);
    var stand=fl.filter(function(d){return !flat(item(d.id))}).map(function(d){var f=fp(d),c=pr(V,d.at.x+f[0]/2,d.at.y+f[1]/2,0);return {d:d,z:c[2]}});
    if(ghost&&ghost.at.k==="floor"&&!flat(item(ghost.d.id))){var f2=fp(ghost.d),c2=pr(V,ghost.at.x+f2[0]/2,ghost.at.y+f2[1]/2,0);stand.push({d:ghost.d,z:c2[2],ghost:ghost})}
    stand.sort(function(a,b){return a.z-b.z}).forEach(function(x){drawStand(x.d,x.ghost?(x.ghost.ok?"ok":"bad"):false,x.ghost?x.ghost.at:null)});
    cv.dataset.items=In.items.length;cv.dataset.rot=V.rot;st.dataset.mode=mode;meterUp()}
  function img(d){return variant(d.id,d.v|0)}
  function mark(g,q,how){poly(g,q);g.fillStyle=how==="bad"?"rgba(230,70,60,.35)":"rgba(70,210,110,.35)";g.fill();g.strokeStyle=how==="bad"?"#e0463c":"#2fbf62";g.lineWidth=3;g.stroke()}
  function drawWall(d,w,ghostHow,at){var g=V.g,it=item(d.id),im=img(d),a0=at||d.at,full=!!it.top,u0=full?.06:(a0.o?.54:.06),u1=full?.94:(a0.o?.94:.46);if(w.sg.flip&&!full){var t=1-u1;u1=1-u0;u0=t}
    var ar=im?(im.height||im.naturalHeight)/(im.width||im.naturalWidth):1,ww=(u1-u0)*2,hh=Math.min(WH*.62,ww*ar),z0=full?1.0:WH*.48-hh/2,z1=z0+hh;if(full){hh=Math.min(.7,ww*ar);z0=1.1;z1=z0+hh}
    var P=function(u,z){return [w.a[0]+(w.b[0]-w.a[0])*u,w.a[1]+(w.b[1]-w.a[1])*u-z*V.S*.92]},tl=P(u0,z1),tr=P(u1,z1),bl=P(u0,z0),br=P(u1,z0);
    if(im){g.save();g.globalAlpha=ghostHow?.6:1;var iw=im.width||im.naturalWidth,ih=im.height||im.naturalHeight;g.setTransform(V.dpr*(tr[0]-tl[0])/iw,V.dpr*(tr[1]-tl[1])/iw,V.dpr*(bl[0]-tl[0])/ih,V.dpr*(bl[1]-tl[1])/ih,V.dpr*tl[0],V.dpr*tl[1]);g.drawImage(im,0,0,iw,ih);g.restore()}
    var q=[tl,tr,br,bl];if(ghostHow) mark(g,q,ghostHow);else{if(sel===d) selMark(q);hits.push({item:d,poly:q,z:1})}
    if(!ghostHow&&it.top){for(var o=0;o<it.top;o++){var tops=In.items.filter(function(x){return x.at.k==="top"&&x.at.p===d.u&&x.at.o===o});var cx=u0+(u1-u0)*(o+.5)/it.top,base=P(cx,z0+hh*.42);
        tops.forEach(function(x){drawSmall(x,base,(u1-u0)*2/it.top*.8,false)});if(ghost&&ghost.at.k==="top"&&ghost.at.p===d.u&&ghost.at.o===o) drawSmall(ghost.d,base,(u1-u0)*2/it.top*.8,ghost.ok?"ok":"bad");hits.push({top:{p:d.u,o:o},poly:spot(base,(u1-u0)*V.S*.9/it.top),z:2})}}}
  function spot(b,w){return [[b[0]-w/2,b[1]-w*1.1],[b[0]+w/2,b[1]-w*1.1],[b[0]+w/2,b[1]+4],[b[0]-w/2,b[1]+4]]}
  function selMark(q){var g=V.g;poly(g,q);g.strokeStyle="#f6c445";g.lineWidth=4;g.setLineDash([8,6]);g.stroke();g.setLineDash([])}
  function drawFlat(d,how,at){var g=V.g,a=at||d.at,f=fp(d),im=img(d),r=d.r|0;var c=[pr(V,a.x,a.y,.01),pr(V,a.x+f[0],a.y,.01),pr(V,a.x+f[0],a.y+f[1],.01),pr(V,a.x,a.y+f[1],.01)];var o=[c[r%4],c[(r+1)%4],c[(r+3)%4]];
    if(im){var iw=im.width||im.naturalWidth,ih=im.height||im.naturalHeight;g.save();g.globalAlpha=how?.6:1;poly(g,c);g.clip();g.setTransform(V.dpr*(o[1][0]-o[0][0])/iw,V.dpr*(o[1][1]-o[0][1])/iw,V.dpr*(o[2][0]-o[0][0])/ih,V.dpr*(o[2][1]-o[0][1])/ih,V.dpr*o[0][0],V.dpr*o[0][1]);g.drawImage(im,0,0,iw,ih);g.restore()}
    if(how) mark(g,c,how);else{if(sel===d) selMark(c);hits.push({item:d,poly:c,z:.5})}}
  function drawStand(d,how,at){var g=V.g,a=at||d.at,f=fp(d),it=item(d.id),im=img(d);var c=[pr(V,a.x,a.y,0),pr(V,a.x+f[0],a.y,0),pr(V,a.x+f[0],a.y+f[1],0),pr(V,a.x,a.y+f[1],0)];
    var xs=c.map(function(p){return p[0]}),ys=c.map(function(p){return p[1]}),minx=Math.min.apply(0,xs),maxx=Math.max.apply(0,xs),maxy=Math.max.apply(0,ys),miny=Math.min.apply(0,ys);
    if(how) mark(g,c,how);
    /* contact shadow */poly(g,c);g.fillStyle="rgba(30,45,70,.18)";g.fill();
    var w=(maxx-minx)*(it.place==="small"?.62:.96),ar=im?(im.height||im.naturalHeight)/(im.width||im.naturalWidth):1,h=w*ar,cap=V.S*(it.place==="small"?1.1:2.2);if(h>cap){h=cap;w=h/ar}var bx=(minx+maxx)/2,by=maxy-(maxy-miny)*.3;
    if(im){g.save();g.globalAlpha=how?.6:1;if((d.r|0)%2){g.translate(bx,0);g.scale(-1,1);g.translate(-bx,0)}g.drawImage(im,bx-w/2,by-h,w,h);g.restore()}
    var q=[[bx-w/2,by-h],[bx+w/2,by-h],[bx+w/2,by],[bx-w/2,by]];if(!how){if(sel===d) selMark(q);hits.push({item:d,poly:q,z:1+(by/1e4)})}
    if(!how&&it.top){for(var o=0;o<it.top;o++){var t=(o+.5)/it.top,base=[bx-w*.42+w*.84*t,by-h*.78];In.items.filter(function(x){return x.at.k==="top"&&x.at.p===d.u&&x.at.o===o}).forEach(function(x){drawSmall(x,base,w*.42/it.top*1.6,false)});
        if(ghost&&ghost.at.k==="top"&&ghost.at.p===d.u&&ghost.at.o===o) drawSmall(ghost.d,base,w*.42/it.top*1.6,ghost.ok?"ok":"bad");hits.push({top:{p:d.u,o:o},poly:spot(base,w/it.top*.8),z:2+(by/1e4)})}}}
  function drawSmall(d,base,wu,how){var g=V.g,im=img(d);if(!im) return;var ar=(im.height||im.naturalHeight)/(im.width||im.naturalWidth),w=Math.min(wu,V.S*.9),h=w*ar;if(h>V.S*1.1){h=V.S*1.1;w=h/ar}
    g.save();g.globalAlpha=how?.6:1;if((d.r|0)%2){g.translate(base[0],0);g.scale(-1,1);g.translate(-base[0],0)}g.drawImage(im,base[0]-w/2,base[1]-h,w,h);g.restore();var q=[[base[0]-w/2,base[1]-h],[base[0]+w/2,base[1]-h],[base[0]+w/2,base[1]],[base[0]-w/2,base[1]]];
    if(how) mark(g,q,how);else{if(sel===d) selMark(q);hits.push({item:d,poly:q,z:3})}}
  function meterUp(){var w=R.iglooWarmth(),nums=U.atLeast("u");meter.querySelector(".in i").style.height=U.clamp((w.inside+32)/40*100,4,100)+"%";meter.querySelector(".out i").style.height=U.clamp((w.outside+32)/40*100,4,100)+"%";
    meter.classList.toggle("nums",nums);meter.querySelector(".in b").textContent=nums?(w.inside>0?"+":"")+w.inside+" \u00B0C":"";meter.querySelector(".out b").textContent=nums?w.outside+" \u00B0C":"";meter.dataset.inside=w.inside;sc.node.classList.toggle("lit",R.lampHeat()>0)}
  /* ---- hit test: the top-most thing under the point */
  function hitAt(px,py){var r=cv.getBoundingClientRect(),x=px-r.left,y=py-r.top,best=null;hits.forEach(function(h){if(inPoly(x,y,h.poly)&&(!best||h.z>=best.z)) best=h});return best}
  /* where would thing d go for a point */
  function spotFor(d,px,py){var it=item(d.id),h=hitAt(px,py);if(!h) return null;var r=cv.getBoundingClientRect();
    if(it.place==="wall"){var w=h.wall?h:(h.item&&h.item.at.k==="wall"?hits.filter(function(x){return x.wall&&x.wall.id===h.item.at.s})[0]:null);if(!w) w=nearestWall(px-r.left,py-r.top);if(!w) return null;
      var u=U.clamp(((px-r.left)-w.w.a[0])/Math.max(1,(w.w.b[0]-w.w.a[0])),0,1);if(w.wall.flip) u=1-u;return {k:"wall",s:w.wall.id,o:it.top?0:(u<.5?0:1)}}
    if(it.place==="small"&&h.top) return {k:"top",p:h.top.p,o:h.top.o};
    var c=unpr(V,px-r.left,py-r.top),f=fp(d);var x=Math.round(c[0]-f[0]/2),y=Math.round(c[1]-f[1]/2);return {k:"floor",x:x,y:y}}
  function nearestWall(x,y){var best=null,bd=1e9;hits.forEach(function(h){if(!h.wall) return;var cx=(h.poly[0][0]+h.poly[1][0])/2,cy=(h.poly[0][1]+h.poly[3][1])/2,d2=Math.hypot(cx-x,cy-y);if(d2<bd){bd=d2;best=h}});return bd<V.S*3?best:null}
  /* ---- actions */
  function sayCue(line,id,g){SB.voice.say(line,{cue:id?[item(id).pic.asset,g||"tap"]:null})}
  function place(id,at){var d={u:"r"+Date.now().toString(36)+Math.floor(Math.random()*99),id:id,v:0,r:0,at:at};var ok=valid(In,Rm,d,at,V);if(!ok.ok){bad(ok,id);return false}
    if(!SB.kit.remove(id,1)) return false;In.items.push(d);U.sfx("thunk");U.log("rplace",{id:id,at:at});save();armed=null;mode="look";ghost=null;renderTray();sel=null;draw();burstAt(d);SB.voice.say("looks_nice",{cue:[item(id).pic.asset]});SB.learn.moment("sci.insulation",{ok:true,region:"arctic"});return true}
  function bad(ok,id){U.sfx("no");U.log("rbad",{id:id,why:ok.why||""});if(ok.why==="vent") sayCue("stove_vent",id);else if(ok.why==="taken") sayCue("room_bad",id);else sayCue("room_bad",id)}
  function burstAt(d){var h=hits.filter(function(x){return x.item===d})[0];if(!h) return;var r=cv.getBoundingClientRect();U.burst(r.left+(h.poly[0][0]+h.poly[2][0])/2,r.top+(h.poly[0][1]+h.poly[2][1])/2,8,["\u2728"])}
  function move(d,at){var ok=valid(In,Rm,d,at,V);if(!ok.ok){bad(ok,d.id);return false}var old=d.at;d.at=at;
    /* things on its top move with it (they keep their slot) */U.sfx("thunk");U.log("rmove",{id:d.id,from:old,to:at});save();draw();SB.voice.say("room_moved",{cue:[item(d.id).pic.asset]});return true}
  function remove(d){var kids=In.items.filter(function(x){return x.at.k==="top"&&x.at.p===d.u});In.items=In.items.filter(function(x){return x!==d&&kids.indexOf(x)<0});SB.kit.add(d.id,1);kids.forEach(function(x){SB.kit.add(x.id,1)});
    U.sfx("pop");U.log("rremove",{id:d.id,with:kids.length});sel=null;hideBar();save();renderTray();draw();SB.voice.say("moved_it",{cue:["sbx/backpack"]})}
  function rotate(d){var it=item(d.id);if(it.place==="wall"){U.sfx("no");return}var nr=((d.r|0)+1)%4,old=d.r|0;d.r=nr;if(d.at.k==="floor"&&!valid(In,Rm,d,d.at,V).ok){d.r=old;U.sfx("no");sayCue("room_bad",d.id);return}U.sfx("click");U.log("rrotate",{id:d.id,r:nr});save();draw()}
  function recolour(d,v){d.v=v;U.sfx("pop");U.log("rcolour",{id:d.id,v:v});save();draw();showBar(d)}
  /* ---- selection bar */
  function hideBar(){if(bar){bar.remove();bar=null}}
  function showBar(d){hideBar();sel=d;var it=item(d.id);bar=U.el("div","sbx-rbar");sc.node.appendChild(bar);
    [0,1,2].forEach(function(v){var c=U.btn("sbx-rsw"+(v===(d.v|0)?" on":""),"Colour "+(v+1),"");var vi=variant(d.id,v);if(vi){var cc=document.createElement("canvas");cc.width=64;cc.height=64;var gg=cc.getContext("2d"),ar=(vi.height||vi.naturalHeight)/(vi.width||vi.naturalWidth),w=ar>1?64/ar:64,h=ar>1?64:64*ar;gg.drawImage(vi,(64-w)/2,(64-h)/2,w,h);c.appendChild(cc)}c.dataset.v=v;bar.appendChild(c);U.onTap(c,function(){recolour(d,v)})});
    if(it.place!=="wall"){var rt=U.btn("sbx-rsw sbx-rrot","Turn it",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 30a14 14 0 10-6 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M26 32l6 7 6-8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>');bar.appendChild(rt);U.onTap(rt,function(){rotate(d)})}
    var mv=U.btn("sbx-rsw sbx-rmove","Move it",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6v36M6 24h36M24 6l-6 6M24 6l6 6M24 42l-6-6M24 42l6-6M6 24l6-6M6 24l6 6M42 24l-6-6M42 24l-6 6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>');bar.appendChild(mv);U.onTap(mv,function(){mode="move";armed=d.id;U.sfx("click");U.log("rmovearm",{id:d.id});sayCue("room_place",d.id)});
    var bk=U.btn("sbx-rsw sbx-rbag","Back in my bag",'<img alt="" src="'+SB.img("sbx/backpack")+'">');bar.appendChild(bk);U.onTap(bk,function(){remove(d)});
    sayCue(k?"room_sel_k":"room_sel",d.id);draw()}
  /* ---- tray: what is in the bag, then the shop */
  function renderTray(){tray.innerHTML="";var own=SB.kit.list({type:"decor"}).filter(function(x){return x.item.place&&(!x.item.min||U.atLeast(x.item.min))});
    own.forEach(function(x){var t=U.btn("sbx-rtile"+(armed===x.id&&mode==="place"?" on":""),"Put in the "+SB.kit.name(x.id),'<img alt="" draggable="false" src="'+SB.kitImg(x.id)+'">');t.dataset.item=x.id;
      if(x.n>1){var c=U.el("span","sbx-cnt");if(k){var h="";for(var i=0;i<Math.min(x.n,5);i++) h+="<i></i>";c.innerHTML=h}else c.textContent="\u00d7"+x.n;t.appendChild(c)}tray.appendChild(t);bindTile(t,x.id)});
    var sh=U.btn("sbx-rtile sbx-rshop","Get more things",'<img alt="" src="'+SB.img("sbx/coin")+'"><img alt="" src="'+SB.img("sbx/trading_post")+'">');tray.appendChild(sh);U.onTap(sh,function(){shop()})}
  function bindTile(t,id){var st0=null;t.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;st0={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,fl:null};try{t.setPointerCapture(e.pointerId)}catch(x){}});
    t.addEventListener("pointermove",function(e){if(!st0||e.pointerId!==st0.id) return;if(!st0.moved&&Math.hypot(e.clientX-st0.x,e.clientY-st0.y)>12){st0.moved=true;st0.fl=U.el("img","sbx-rfly");st0.fl.src=SB.kitImg(id);document.body.appendChild(st0.fl);hideBar();sel=null}
      if(st0.moved){st0.fl.style.transform="translate3d("+(e.clientX-40)+"px,"+(e.clientY-70)+"px,0)";var d={u:"g",id:id,v:0,r:0},at=spotFor(d,e.clientX,e.clientY);ghost=at?{d:d,at:at,ok:valid(In,Rm,d,at,V).ok}:null;draw()}});
    t.addEventListener("pointerup",function(e){if(!st0||e.pointerId!==st0.id) return;var s0=st0;st0=null;if(s0.fl) s0.fl.remove();
      if(!s0.moved){SB.voice.cut();if(armed===id&&mode==="place"){armed=null;mode="look";renderTray();return}armed=id;mode="place";sel=null;hideBar();U.sfx("click");U.log("rarm",{id:id});renderTray();sayCue("room_place",id);return}
      ghost=null;var d={u:"g",id:id,v:0,r:0},at=spotFor(d,e.clientX,e.clientY);if(at) place(id,at);else draw()});
    t.addEventListener("pointercancel",function(){if(st0&&st0.fl) st0.fl.remove();st0=null;ghost=null;draw()})}
  /* ---- canvas input: tap = act for the mode; drag a placed thing = move; one-finger drag on the floor = nothing; pinch/wheel = zoom */
  var pts={},pinch=null,cd=null;
  cv.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0) return;try{cv.setPointerCapture(e.pointerId)}catch(x){}pts[e.pointerId]={x:e.clientX,y:e.clientY};var ids=Object.keys(pts);
    if(ids.length===2){var a=pts[ids[0]],b=pts[ids[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:V.zoom};cd=null;return}var h=hitAt(e.clientX,e.clientY);cd={x:e.clientX,y:e.clientY,h:h,moved:false}});
  cv.addEventListener("pointermove",function(e){if(pts[e.pointerId]) pts[e.pointerId]={x:e.clientX,y:e.clientY};
    if(pinch){var ids=Object.keys(pts);if(ids.length>=2){var a=pts[ids[0]],b=pts[ids[1]];V.zoom=U.clamp(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(10,pinch.d),.7,2.2);draw()}return}
    if(cd&&cd.h&&cd.h.item&&mode!=="paint"){if(!cd.moved&&Math.hypot(e.clientX-cd.x,e.clientY-cd.y)>12){cd.moved=true;sel=cd.h.item;hideBar()}if(cd.moved){var at=spotFor(cd.h.item,e.clientX,e.clientY);ghost=at?{d:cd.h.item,at:at,ok:valid(In,Rm,cd.h.item,at,V).ok}:null;draw()}return}
    if(!cd&&e.pointerType==="mouse"&&(mode==="place"||mode==="move")&&armed){var d=mode==="move"?sel:{u:"g",id:armed,v:0,r:0};if(!d) return;var at2=spotFor(d,e.clientX,e.clientY);var ng=at2?{d:d,at:at2,ok:valid(In,Rm,d,at2,V).ok}:null;if(JSON.stringify(ng&&ng.at)!==JSON.stringify(ghost&&ghost.at)){ghost=ng;draw()}}});
  function up(e){var had=pts[e.pointerId];delete pts[e.pointerId];if(pinch){if(Object.keys(pts).length<2){pinch=null;U.log("rzoom",{z:V.zoom})}cd=null;return}var c=cd;cd=null;if(!c||!had||e.type==="pointercancel") return;
    if(c.moved&&c.h&&c.h.item){var at=spotFor(c.h.item,e.clientX,e.clientY);ghost=null;if(at) move(c.h.item,at);else draw();return}
    tap(e.clientX,e.clientY,c.h)}
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);cv.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"&&ghost){ghost=null;draw()}});
  cv.addEventListener("wheel",function(e){e.preventDefault();V.zoom=U.clamp(V.zoom*(e.deltaY>0?.9:1.1),.7,2.2);U.log("rzoom",{z:V.zoom});draw()},{passive:false});
  function tap(px,py,h0){var h=hitAt(px,py)||h0;SB.voice.cut();
    if(mode==="paint"){if(!h) return;if(h.floor||(h.item&&h.item.at.k==="floor")){In.paint.floor={c:paint.c,p:paint.p};U.log("rpaint",{what:"floor",c:paint.c,p:paint.p})}
      else if(h.wall||(h.item&&h.item.at.k==="wall")){var sid=h.wall?h.wall.id:h.item.at.s;In.paint.segs[sid]={c:paint.c,p:paint.p};U.log("rpaint",{what:"wall",seg:sid,c:paint.c,p:paint.p})}else return;U.sfx("splash");save();draw();return}
    if(mode==="place"&&armed){var d={u:"g",id:armed,v:0,r:0},at=spotFor(d,px,py);ghost=null;if(at) place(armed,at);else bad({ok:false},armed);return}
    if(mode==="move"&&sel){var at2=spotFor(sel,px,py);ghost=null;if(at2&&move(sel,at2)){mode="look";armed=null;showBar(sel)}return}
    if(h&&h.item){U.sfx("click");showBar(h.item);return}
    if(sel){sel=null;hideBar();draw()}}
  /* ---- tools: paint bucket, turn, zoom, back to the builder, sleep */
  function tb(cls,label,html,fn){var b=U.btn("sbx-rtool "+cls,label,html);tools.appendChild(b);U.onTap(b,fn);return b}
  var BK='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18h22l-3 22H15z" fill="#e9a23b" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M14 18c0-8 18-8 18 0" fill="none" stroke="#fff" stroke-width="3"/><path d="M34 22c6 2 7 8 4 12" fill="none" stroke="#7fd0ff" stroke-width="4" stroke-linecap="round"/></svg>';
  var pb=tb("sbx-rpaint","Paint",BK,function(){if(mode==="paint"){mode="look";pb.classList.remove("on");if(pal){pal.remove();pal=null}draw();return}mode="paint";armed=null;sel=null;hideBar();pb.classList.add("on");showPal();renderTray();SB.voice.say("room_paint",{cue:["sbx/rug_fur","tap"].slice(1)})});
  function showPal(){if(pal) pal.remove();pal=U.el("div","sbx-rpal");sc.node.appendChild(pal);PAINT.forEach(function(p){var b=U.btn("sbx-rcol"+(paint.c===p[0]?" on":""),p[0]+" paint","");b.style.background=p[1];b.dataset.c=p[0];pal.appendChild(b);U.onTap(b,function(){paint.c=p[0];U.sfx("pop");U.$$(".sbx-rcol",pal).forEach(function(x){x.classList.toggle("on",x.dataset.c===p[0])});U.log("rcolpick",{c:p[0]})})});
    if(U.atLeast("e")) PAT.forEach(function(p){var b=U.btn("sbx-rpat"+(paint.p===p?" on":""),p?p+" pattern":"plain","");if(p){b.style.backgroundImage="url("+patCanvas(p).toDataURL()+")"}b.dataset.p=p;pal.appendChild(b);U.onTap(b,function(){paint.p=p;U.sfx("pop");U.$$(".sbx-rpat",pal).forEach(function(x){x.classList.toggle("on",x.dataset.p===p)})})})}
  var ROT='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 30a14 14 0 10-6 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M26 32l6 7 6-8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var tl=U.btn("sbx-rturn l"+(k?" big":""),"Turn the room left",ROT),tr=U.btn("sbx-rturn r"+(k?" big":""),"Turn the room right",ROT);sc.node.appendChild(tl);sc.node.appendChild(tr);
  U.onTap(tl,function(){V.rot=(V.rot+270)%360;U.sfx("whoosh");U.log("rturn",{rot:V.rot});ghost=null;save();draw()});U.onTap(tr,function(){V.rot=(V.rot+90)%360;U.sfx("whoosh");U.log("rturn",{rot:V.rot});ghost=null;save();draw()});
  if(!k){tb("sbx-rzin","Zoom in",'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="12" fill="none" stroke="#fff" stroke-width="4"/><path d="M30 30l10 10M15 21h12M21 15v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',function(){V.zoom=U.clamp(V.zoom*1.2,.7,2.2);draw()});
    tb("sbx-rzout","Zoom out",'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="12" fill="none" stroke="#fff" stroke-width="4"/><path d="M30 30l10 10M15 21h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',function(){V.zoom=U.clamp(V.zoom/1.2,.7,2.2);draw()})}
  tb("sbx-rbuild","Build more",'<img alt="" src="'+SB.img("build_ice_block")+'">',function(){sc.close();SB.openSpark("igloo")});
  tb("sbx-rsleep","Go to sleep",'<span aria-hidden="true">\uD83C\uDF19</span>',function(){sleep()});
  function sleep(){var dark=U.el("div","sbx-night");dark.innerHTML='<span class="sbx-moon" aria-hidden="true">\uD83C\uDF19</span>';sc.node.appendChild(dark);U.sfx("ok");SB.idle.paused=true;U.log("sleep",{day:s.reg.day});
    SB.voice.say("sleep").then(function(){return U.sleep(900)}).then(function(){s.def.onDay(s.reg);R.refresh();dark.classList.add("morning");U.sfx("happy");return SB.voice.say("morning")}).then(function(){dark.remove();SB.idle.paused=false;SB.idle.reset()})}
  /* ---- shop: 2 at a time with arrows at 4-6, a grid from 7 */
  function shop(){var ov=SB.panel("sbx-rshopp","Shop"),list2=R.CATALOG().filter(function(id){var it=item(id);return !it.reward&&FREE.indexOf(id)<0&&(!it.min||U.atLeast(it.min))}),per=k?2:list2.length,page=0;
    var body=U.el("div","sbx-rsrow"+(k?" k":""));ov.body.appendChild(body);var coins=U.el("div","sbx-rscoins");ov.body.insertBefore(coins,body);
    function show(){body.innerHTML="";coins.innerHTML='<img alt="" src="'+SB.img("sbx/coin")+'"> <b>'+(k?"":SB.econ.balance())+'</b>'+(k?dotsOf(SB.econ.balance(),99):"");var pages=Math.ceil(list2.length/per);page=U.mod(page,pages);
      if(k&&pages>1){var L2=U.btn("sbx-page sbx-pl","More things",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 8 L14 24 L30 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');body.appendChild(L2);U.onTap(L2,function(){page--;U.sfx("whoosh");show()})}
      list2.slice(page*per,page*per+per).forEach(function(id){var pr2=SB.econ.price(id,s.id),can=SB.econ.canAfford(pr2),t=U.btn("sbx-stile"+(can?"":" dear"),SB.kit.name(id)+", "+pr2+" coins",'<img alt="" draggable="false" src="'+SB.kitImg(id)+'">');t.dataset.item=id;t.dataset.price=pr2;
        var dt=U.el("span","sbx-dots");dt.innerHTML=dotsOf(pr2,SB.econ.balance())+(k?"":' <b>'+pr2+'</b>');t.appendChild(dt);if(!k) t.appendChild(U.el("b","sbx-tname",U.esc(SB.kit.name(id))));if(SB.kit.has(id)) t.appendChild(U.el("span","sbx-have","\u2713"));body.appendChild(t);
        U.onTap(t,function(){buy(id,t)})});
      if(k&&pages>1){var R2=U.btn("sbx-page sbx-pr","More things",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 8 L34 24 L18 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');body.appendChild(R2);U.onTap(R2,function(){page++;U.sfx("whoosh");show()})}
      body.dataset.page=page;body.dataset.shown=list2.slice(page*per,page*per+per).join(",")}
    function dotsOf(n,have){var h='<span class="sbx-dotrow">';for(var i=0;i<Math.min(n,12);i++) h+='<i class="'+(i<have?"on":"")+'"></i>';return h+"</span>"}
    function buy(id,t){var pr2=SB.econ.price(id,s.id);if(!SB.econ.canAfford(pr2)){U.sfx("no");U.anim(t,"a-no",500);SB.econ.wish(id);U.log("wish",{item:id,missing:pr2-SB.econ.balance(),price:pr2});SB.voice.say("need_more",{cue:["sbx/jar","sbx/coin"]});return}
      var res=SB.econ.spend(pr2,{item:id,region:s.id});if(!res.ok) return;SB.kit.add(id,1);SB.econ.unwish(id);U.sfx("win");U.log("bought",{item:id,price:pr2});SB.hud.coins(SB.econ.balance());SB.voice.say("its_yours",{cue:[item(id).pic.asset]});show();renderTray()}
    show();SB.voice.say("shop_pick")}
  var offK=SB.on("kit",function(){if(!sc.closed) renderTray()});var onR=function(){draw()};addEventListener("resize",onR);
  sc.cleanup.push(function(){offK();removeEventListener("resize",onR);hideBar();if(pal) pal.remove();R._roomKick=null});
  sc.hint=function(i){var t=tray.querySelector(".sbx-rtile:not(.sbx-rshop)");if(i===2){SB.hand.show(tools.querySelector(".sbx-rsleep"));SB.voice.say("sleep_hint");return}if(t){SB.hand.show(t);if(i>0) SB.voice.say("decorate")}else SB.hand.show(tray.querySelector(".sbx-rshop"))};
  R.CATALOG().forEach(load);renderTray();draw();SB.ecs.set("igloo",{visited:true});SB.voice.say(In.items.length?"igloo_in":"room_in");
  R.room={draw:draw,V:V,In:In,hits:function(){return hits},screenOf:function(u){var h=hits.filter(function(x){return x.item&&x.item.u===u})[0];if(!h) return null;var r=cv.getBoundingClientRect();return {x:r.left+(h.poly[0][0]+h.poly[2][0])/2,y:r.top+(h.poly[0][1]+h.poly[2][1])/2}}}};
R.refreshIgloo=function(){var ig=SB.ent("igloo");if(ig&&R.types.igloo) R.types.igloo.refresh(ig,SB.node("igloo"))};
})();

/* ---- sbx-src/regions/arctic/40-fish.js */
/* Fishing spark (§8.1). k: an order of fish pictures, count spoken as each fish lands; e: "4 FISH" word you can sound out;
   u/t: check the ice first (ruler in cm; under 10 cm Spark steers you to thicker ice, no penalty), then the fish-finder; t: notebook average. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic;
function rng(seed){var x=seed>>>0||1;return function(){x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x/4294967296}}
function shuffle(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
R.rng=rng;R.shuffle=shuffle;
SB.defineSpark("fish",{region:"arctic",opensFrom:"fishhole",label:"Ice fishing",maxSec:120,skills:["math.count.10","sci.ice.thickness","math.measure.cm","math.mean","read.decode.cvc"],
start:function(api,knobs){return new Promise(function(done){var s=SB.session,st=api.stage,band=api.band,rec=s.reg.sparks.fish||{plays:0},r=rng(s.reg.seed+s.reg.day*101+(rec.plays|0)*7);
  var first=band==="k"&&R.step()<=2&&!(rec.plays>0);var N=first?(knobs.first||1):Math.max(1,Math.min(band==="k"?5:10,knobs.order||3));
  st.classList.add("sbx-fishsp");st.dataset.phase="start";var got=0;
  /* ---- the order card */
  var card=U.el("div","sbx-order");card.dataset.need=N;card.dataset.got=0;card.setAttribute("role","button");card.setAttribute("aria-label","Order: "+N+" fish");st.appendChild(card);
  var slots=U.el("div","sbx-oslots");card.appendChild(slots);for(var i=0;i<N;i++){var sl=U.el("span","sbx-oslot");sl.innerHTML='<img alt="" src="'+SB.img("prop_fish")+'">';slots.appendChild(sl)}
  if(band!=="k"){var lab=U.el("div","sbx-olab");lab.innerHTML='<b class="sbx-onum">'+N+'</b> ';var w=U.btn("sbx-word","fish","FISH");lab.appendChild(w);card.appendChild(lab);U.onTap(w,function(){api.word("fish");api.learn("read.decode.cvc",true)})}
  U.onTap(card,function(){if(got<N){api.say("count_more").then(function(ok){if(!ok) return;var i=0;(function c(){if(i<got&&!api.closed){i++;api.count(i).then(c)}})()})}});
  var bucket=U.el("div","sbx-fbucket");bucket.innerHTML='<img alt="" src="'+SB.img("prop_bucket")+'"><span class="sbx-fishes"></span>';st.appendChild(bucket);
  function fillBucket(){var f=bucket.querySelector(".sbx-fishes"),h="";for(var i=0;i<Math.min(got,6);i++) h+='<img alt="" src="'+SB.img("prop_fish")+'" style="--i:'+i+'">';f.innerHTML=h}
  var bg=U.el("div","sbx-bg");st.insertBefore(bg,st.firstChild);
  /* ---- u/t: ice check */
  function iceCheck(){return new Promise(function(ok){st.dataset.phase="ice";SB.stripBg(bg,s.pano.imgs[0].src,3,36,s.cfg.strip.overlap);bg.classList.add("ice");
    var th=shuffle(knobs.holes||[6,14,22],r),wrap=U.el("div","sbx-icespots");st.appendChild(wrap);var ruler=U.el("div","sbx-ruler");ruler.innerHTML='<div class="sbx-rscale"></div><div class="sbx-rice"></div><b class="sbx-rval"></b>';st.appendChild(ruler);
    var sc=ruler.querySelector(".sbx-rscale"),hh="";for(var c=0;c<=30;c+=5) hh+='<i style="bottom:'+(c/30*100)+'%"><span>'+c+' cm</span></i>';sc.innerHTML=hh;
    var tested=0,spots=[];th.forEach(function(t,i){var b=U.btn("sbx-icespot","Drill here",'<img alt="" src="'+SB.img("sbx/icedrill")+'">');b.dataset.cm=t;b.style.left=(14+i*20)+"%";wrap.appendChild(b);spots.push(b);
      U.onTap(b,function(){if(b.classList.contains("done")) return;b.classList.add("drill","done");U.sfx("crunch");tested++;setTimeout(function(){if(api.closed) return;b.classList.remove("drill");
        ruler.classList.add("on");ruler.querySelector(".sbx-rice").style.height=(t/30*100)+"%";ruler.querySelector(".sbx-rval").textContent=t+" cm";ruler.dataset.cm=t;U.log("icecheck",{cm:t});
        if(t<10){b.classList.add("thin");api.learn("sci.ice.thickness",false,true);api.learn("math.measure.cm",true);api.say({u:"Only "+t+" centimetres. That's too thin to stand on safely. Let's try somewhere thicker.",t:"Only "+t+" cm. Under 10 cm is not safe to stand on, so let's find thicker ice."}).then(function(){var best=spots.filter(function(x){return !x.classList.contains("done")}).sort(function(a,b){return b.dataset.cm-a.dataset.cm})[0];if(best&&!api.closed) SB.hand.show(best)})}
        else{b.classList.add("good");api.learn("sci.ice.thickness",true);api.learn("math.measure.cm",true);api.say({u:t+" centimetres. Thick enough to stand on. Let's fish here!",t:t+" cm: well over the 10 cm safety line. Fishing here."}).then(function(){if(api.closed) return;wrap.remove();ruler.remove();bg.classList.remove("ice");ok()})}},900)})});
    api.say({u:"Before we fish, let's check the ice. Tap a spot to drill and measure it.",t:"Check the ice first: drill a test hole and read the thickness."});
    api.hint(function(i){var left=spots.filter(function(x){return !x.classList.contains("done")});var n=spots.some(function(x){return x.classList.contains("thin")})?left.sort(function(a,b){return b.dataset.cm-a.dataset.cm})[0]:left[0];if(n) SB.hand.show(n)})})}
  /* ---- fishing */
  function fishing(){st.dataset.phase="fish";bg.style.cssText="";bg.className="sbx-bg sbx-holebg";bg.style.backgroundImage="url("+SB.img("sbx/bd_fishhole")+")";
    var hole=U.el("div","sbx-hole");hole.setAttribute("role","button");hole.setAttribute("aria-label","The fishing hole");st.appendChild(hole);var bob=U.el("img","sbx-bob");bob.src=SB.img("prop_bobber");bob.alt="";hole.appendChild(bob);
    var finder=null,depth=null,want=null;if(band==="u"||band==="t"){finder=U.el("div","sbx-finder");st.appendChild(finder)}
    var state="idle",biteT=0,tapNowSaid=false,weights=[];
    function setFinder(){if(!finder) return;want=[6,3,9][got%3];finder.innerHTML='<div class="sbx-sonar"><i style="top:'+(want/10*100)+'%"></i></div><div class="sbx-depths"></div>';var d=finder.querySelector(".sbx-depths");
      [3,6,9].forEach(function(m){var b=U.btn("sbx-depth"+(depth===m?" on":""),"Drop the line to "+m+" metres",m+" m");b.dataset.m=m;d.appendChild(b);U.onTap(b,function(){depth=m;U.$$(".sbx-depth",d).forEach(function(x){x.classList.toggle("on",+x.dataset.m===m)});U.sfx("click")})})}
    setFinder();
    function cast(){if(state!=="idle"||got>=N) return;if(finder&&depth==null){api.say({u:"Pick a depth first. Where does the fish-finder show fish?"});SB.hand.show(finder.querySelector(".sbx-depth"));return}
      state="wait";hole.classList.add("cast");U.sfx("plop");st.dataset.phase="wait";
      if(finder&&depth!==want){setTimeout(function(){if(api.closed) return;state="idle";hole.classList.remove("cast");api.say({u:"No bites at "+depth+" metres. The fish-finder shows them at "+want+" metres.",t:"Nothing at "+depth+" m. The sonar marks are at "+want+" m."});api.learn("math.measure.cm",false)},1400);return}
      biteT=setTimeout(function(){if(api.closed) return;state="bite";hole.classList.add("bite");bob.dataset.bite="1";st.dataset.phase="bite";U.sfx("splash");if(!tapNowSaid||band==="k"){tapNowSaid=true;api.say("tap_now")}SB.hand.show(hole)},1200)}
    function catchFish(){state="catch";hole.classList.remove("bite","cast");delete bob.dataset.bite;SB.hand.hide();got++;card.dataset.got=got;var sl=slots.children[got-1];if(sl) sl.classList.add("got");
      var f=U.el("img","sbx-catch");f.src=SB.img("prop_fish");f.alt="";st.appendChild(f);var hr=hole.getBoundingClientRect(),br=bucket.getBoundingClientRect(),sr=st.getBoundingClientRect();
      var x0=hr.left+hr.width/2-sr.left,y0=hr.top+hr.height*.4-sr.top,x1=br.left+br.width/2-sr.left,y1=br.top+br.height*.3-sr.top;U.sfx("splash");
      var done1=function(){f.remove();fillBucket();U.sfx("plop")};
      if(f.animate&&!U.reduced()){var a=f.animate([{transform:"translate3d("+x0+"px,"+y0+"px,0) translate(-50%,-50%) rotate(-20deg) scale(.6)"},{transform:"translate3d("+((x0+x1)/2)+"px,"+(Math.min(y0,y1)-160)+"px,0) translate(-50%,-50%) rotate(10deg) scale(1.1)",offset:.5},{transform:"translate3d("+x1+"px,"+y1+"px,0) translate(-50%,-50%) rotate(30deg) scale(.5)"}],{duration:700,easing:"ease-in-out"});a.onfinish=done1}else done1();
      api.give({kit:{fish:1}});if(band==="t") weights.push([1.2,0.8,1.6,1.0,1.4][(got-1)%5]);
      setTimeout(function(){if(api.closed) return;U.log("fishland",{n:got,of:N});
        (band==="k"||band==="e"?api.count(got):Promise.resolve(true)).then(function(){if(api.closed) return;if(got>=N) finish();else{state="idle";setFinder();if(band==="k") autoCast()}})},700)}
    U.onTap(hole,function(){if(state==="idle") cast();else if(state==="bite") catchFish();else if(state==="wait"){U.anim(bob,"a-wig",400)}});
    api.hint(function(i){if(state==="bite"){SB.hand.show(hole);if(i>0) api.say("tap_now");return}if(state==="idle"){if(finder&&depth==null){SB.hand.show(finder.querySelector(".sbx-depth"));return}SB.hand.show(hole);if(i>0) api.say("tap_hole")}});
    api.onCleanup(function(){clearTimeout(biteT)});
    /* k: the line drops by itself (§9.5), the child's one action is the catch */
    function autoCast(){setTimeout(function(){if(!api.closed&&state==="idle"&&got<N) cast()},900)}
    if(band==="k"){if(first) autoCast();else api.say("order_fish").then(autoCast)}
    else if(band==="e") api.say(first?"tap_hole":"order_fish").then(function(){if(!api.closed&&state==="idle") SB.hand.show(hole)});
    else api.say({u:"The order is "+N+" fish. Use the fish-finder to pick the depth, then tap the hole.",t:"Order: "+N+" fish. Read the sonar, set the depth, and fish."});
    function finish(){st.dataset.phase="done";api.learn("math.count.10",true);
      var p=first?api.say("one_fish"):api.say("order_match");
      p.then(function(){if(api.closed) return;if(band==="t"&&weights.length) return notebook();if(!first&&!s.reg.flags.fishFact){s.reg.flags.fishFact=1;return api.fact("fish_fact_k")}}).then(function(){setTimeout(function(){if(!api.closed) done({ok:true,payout:{kit:{fish:got}}})},600)})}
    function notebook(){return new Promise(function(ok){var nb=U.el("div","sbx-note");var mean=weights.reduce(function(a,b){return a+b},0)/weights.length;
      nb.innerHTML='<b>Catch notebook</b><ul>'+weights.map(function(w,i){return '<li>Fish '+(i+1)+': '+w.toFixed(1)+' kg</li>'}).join("")+'</ul><div class="sbx-line"><i class="sbx-mean"></i></div><div class="sbx-ticks"><span>0.5</span><span>1.0</span><span>1.5</span><span>2.0</span></div>';st.appendChild(nb);
      var line=nb.querySelector(".sbx-line");api.say({t:"Tap the scale where you think the average weight is."});
      U.onTap(line,function(ev){var r=line.getBoundingClientRect(),v=0.5+1.5*U.clamp((ev.clientX-r.left)/r.width,0,1),m=nb.querySelector(".sbx-mean");m.style.left=((mean-0.5)/1.5*100)+"%";m.classList.add("on");
        var close=Math.abs(v-mean)<=0.15;api.learn("math.mean",close);api.say({t:"You marked "+v.toFixed(1)+" kg. The average is "+mean.toFixed(2)+" kg: add the weights and divide by "+weights.length+"."}).then(function(){setTimeout(ok,500)})})})}
  }
  if(band==="u"||band==="t") iceCheck().then(function(){if(!api.closed) fishing()});else fishing();
})}});
})();

/* ---- sbx-src/regions/arctic/50-sled.js */
/* Sled trips (P3 §4). Picture map (3 places) -> harness the dogs -> pseudo-3D ride on a canvas trail -> the place's own ending -> camp.
   The sled is drawn ON the projected snow surface every frame (shadow, bounce, tilt, spray); the team runs ahead on the same trail.
   Sky + horizon come from the camp's own panorama strip, so the light matches camp.
   At the fork, steering decides the branch: the wrong branch is a LONGER, BUMPIER trail with other scenery that still reaches the
   same place (no teleport, no auto-correct). Bumps only slow the team. Fish picked up on the trail are kept and counted.
   Endings: fishing camp = coins per fish + fish rack decor; lost pup = the pup comes home to camp; fox den = bring the lantern or a
   fish -> trust up, the kits come out, the "fox kits" photo set unlocks. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic;
var DOGS=["husky1","husky2","husky3"];
var DEST={
  fish:{id:"fish",pic:"sbx/fishcamp",label:"Fishing camp",rw:["sbx/coin","sbx/fish_rack"]},
  pup:{id:"pup",pic:"sbx/den_hill",scene:"sbx/pup",label:"Lost pup",rw:["sbx/pup"]},
  den:{id:"den",pic:"sbx/den_hill",scene:"sbx/fox_kits",label:"Fox den",rw:["sbx/kits_all"]}};
DEST.pup.pic="sbx/pup";
var ORDER=["fish","pup","den"];
var COIN_PER_FISH={k:2,e:2,u:3,t:3};
/* tuning per band: speed in segments/s, lane width (fraction of the half-road), pickups, bumps */
var TUNE={k:{v:13,pre:70,zone:26,good:46,bad:96,fin:30,fish:5,bumps:3,lanes:true},
          e:{v:17,pre:80,zone:26,good:56,bad:110,fin:30,fish:8,bumps:5},
          u:{v:19,pre:84,zone:26,good:60,bad:116,fin:30,fish:9,bumps:6},
          t:{v:20,pre:86,zone:26,good:62,bad:120,fin:30,fish:9,bumps:7}};
var SEG=200,ROADW=1700,CAMH=900,CAMD=0.84,DRAW=150,KM_PER_SEG=0.004;
function ease(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function imgOf(src){var i=new Image();i.decoding="async";i.src=src;return i}

R.sledState=function(){var f=SB.session.reg.flags;return {pup:!!f.pupHome,den:!!f.foxKits,fish:!!f.fishRack}};

SB.defineSpark("sled",{region:"arctic",opensFrom:"sled",label:"Sled trip",maxSec:180,skills:["math.count.10","math.time.compare","sci.force.load","geo.map.read"],
start:function(api,knobs){return new Promise(function(done){var s=SB.session,st=api.stage,band=api.band,k=band==="k",up=band==="u"||band==="t",T=TUNE[band]||TUNE.e;
  st.classList.add("sbx-sledsp");var free=DOGS.map(SB.ent).filter(function(d){return d&&!d.live.tired});
  if(!free.length){api.say("dog_tired").then(function(){done({ok:true,rest:true})});return}
  var dest=null,route="smooth",team=[];
  var bg=U.el("div","sbx-bg");st.appendChild(bg);SB.stripBg(bg,s.pano.imgs[0].src,0,76,s.cfg.strip.overlap);

  /* ---- 1. the picture map */
  function map(){st.dataset.phase="map";var m=U.el("div","sbx-smap");st.appendChild(m);var been=R.sledState();
    m.innerHTML='<svg class="sbx-smtr" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+
      ['M50 92 C 40 70, 22 60, 18 34','M50 92 C 52 70, 48 50, 50 22','M50 92 C 60 70, 80 60, 82 34'].map(function(d){return '<path d="'+d+'"/>'}).join("")+'</svg>'+
      '<div class="sbx-smcamp"><img alt="" src="'+SB.img("sbx/sled_empty")+'"></div>';
    ORDER.forEach(function(id,i){var D=DEST[id],b=U.btn("sbx-smdest sbx-smd-"+id,D.label,'<img class="sbx-smpic" alt="" draggable="false" src="'+SB.img(D.pic)+'">'+
        '<span class="sbx-smrw">'+D.rw.map(function(r){return '<img alt="" src="'+SB.img(r)+'">'}).join("")+'</span>'+(been[id]?'<i class="sbx-smdone" aria-hidden="true">\u2713</i>':"")+(k?"":'<b>'+D.label+'</b>'));
      b.dataset.dest=id;m.appendChild(b);U.onTap(b,function(){pick(id)})});
    if(up){var rt=U.el("div","sbx-smroute");rt.innerHTML='<span>Route:</span>'+[["bumpy","Short + bumpy"],["smooth","Long + smooth"]].map(function(r){return '<button type="button" class="sbx-smr'+(route===r[0]?" on":"")+'" data-route="'+r[0]+'">'+r[1]+'</button>'}).join("");m.appendChild(rt);
      U.$$(".sbx-smr",rt).forEach(function(b){U.onTap(b,function(){route=b.dataset.route;U.$$(".sbx-smr",rt).forEach(function(x){x.classList.toggle("on",x===b)});U.sfx("click");U.log("sledroute",{route:route});
        api.say(route==="bumpy"?{u:"The short way: less distance, but bumps slow the dogs.",t:"Short and bumpy: fewer kilometres, more slow-downs."}:{u:"The long way: more distance, but smooth and fast.",t:"Long and smooth: more kilometres, steady speed."})})})}
    function pick(id){if(dest) return;dest=DEST[id];U.sfx("thunk");U.log("sleddest",{dest:id,route:route});api.learn("geo.map.read",true);m.classList.add("gone");setTimeout(function(){m.remove();harness()},300)}
    api.say("sled_map");
    api.hint(function(i){var bs=U.$$(".sbx-smdest",m);if(bs.length) SB.hand.show(bs[i%bs.length]);if(i>0) api.say("sled_map")})}

  /* ---- 2. harness: tap (or drag) each dog onto the sled; counted aloud (P2, kept) */
  function harness(){st.dataset.phase="harness";var hs=U.el("div","sbx-harness");st.appendChild(hs);var sled=U.el("div","sbx-hsled");sled.innerHTML='<img alt="" src="'+SB.img("sbx/sled_empty")+'"><span class="sbx-hspots"></span>';hs.appendChild(sled);
    var spots=sled.querySelector(".sbx-hspots"),row=U.el("div","sbx-hdogs");hs.appendChild(row);var need=free.length;
    api.say("harness");
    var go=U.btn("sbx-go sbx-hgo","Go!",'<img alt="" src="'+SB.img("ride_dogs")+'">');go.classList.add("off");hs.appendChild(go);
    DOGS.forEach(function(id){var d=SB.ent(id),b=U.btn("sbx-hdog"+(d.live.tired?" tired":""),d.live.name?R.nameText(d.live.name):"A dog",'<img alt="" draggable="false" src="'+SB.img(d.live.tired?"sbx/husky_sleep":d.sprite.asset)+'">');b.dataset.dog=id;row.appendChild(b);
      function put(){if(d.live.tired){api.say("dog_rest");return}if(team.indexOf(id)>=0) return;team.push(id);b.classList.add("on");var sp=U.el("span","sbx-hspot");sp.innerHTML=b.querySelector("img").outerHTML;spots.appendChild(sp);U.anim(sp,"a-jump",500);U.sfx("pop");SB.voice.count(team.length);U.log("harness",{dog:id,n:team.length});
        if(team.length>=need){if(up){go.classList.remove("off")}else{go.classList.add("off");setTimeout(function(){if(!api.closed&&st.dataset.phase==="harness") start()},1100)}}else if(up) go.classList.remove("off")}
      U.onTap(b,function(){SB.hand.hide();put()},{slop:40});
      b.addEventListener("pointerdown",function(e){var sx=e.clientX,sy=e.clientY;function upf(ev){document.removeEventListener("pointerup",upf,true);if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<=40) return;var sl=st.querySelector(".sbx-hsled");if(sl&&U.inside(ev.clientX,ev.clientY,sl)) put()}document.addEventListener("pointerup",upf,true)})});
    U.onTap(go,function(){if(team.length) start()});
    function start(){if(st.dataset.phase!=="harness") return;api.learn("math.count.10",true);hs.remove();ride()}
    api.hint(function(i){var nx=U.$$(".sbx-hdog",row).filter(function(b){return !b.classList.contains("on")&&!b.classList.contains("tired")})[0];if(nx) SB.hand.show(nx);else if(up) SB.hand.show(go);if(i>0) api.say("harness")})}

  /* ---- 3. the ride */
  function ride(){st.dataset.phase="ride";bg.remove();
    var cv=U.el("canvas","sbx-ride3");st.appendChild(cv);var g=cv.getContext("2d");var W=0,H=0,HOR=0,dpr=Math.min(2,window.devicePixelRatio||1);
    function size(){var r=st.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+"px";cv.style.height=H+"px";g.setTransform(dpr,0,0,dpr,0,0);HOR=H*0.42}
    size();var ro=function(){size()};window.addEventListener("resize",ro);
    var IM={sky:s.pano.imgs[0],dogs:imgOf(SB.img("ride_dogs")),sled:imgOf(SB.img("sbx/sled_rear")),fish:imgOf(SB.img("prop_fish")),mound:imgOf(SB.img("build_snowcap")),
      dest:imgOf(SB.img(dest.pic)),other:imgOf(SB.img("build_snowcap")),ridge:imgOf(SB.img("build_snowcap"))};
    /* -- build the track */
    var segs=[],tune=T,bumpyRoute=up&&route==="bumpy";
    function add(n,o){for(var i=0;i<n;i++){var t=i/n;segs.push({i:segs.length,curve:(o.curve||0)*Math.sin(Math.PI*t),y:0,hill:o.hill?o.hill(t,i):0,sp:[],kind:o.kind||"main",fork:o.fork?t:null,band:o.band||0})}}
    var pre=bumpyRoute?Math.round(tune.pre*0.7):tune.pre,goodN=bumpyRoute?Math.round(tune.good*0.7):tune.good;
    var cvA=k?0.8:2.2;
    add(Math.round(pre*0.3),{});add(Math.round(pre*0.4),{curve:cvA,hill:function(t){return Math.sin(t*Math.PI)*(k?300:700)}});add(pre-Math.round(pre*0.3)-Math.round(pre*0.4),{curve:-cvA*0.8});
    var forkAt=segs.length;add(tune.zone,{fork:true});var forkEnd=segs.length;
    /* both branches are generated lazily at the fork end */
    var goodSide=((s.reg.sparks.sled&&s.reg.sparks.sled.plays)|0)%2===0?-1:1,chosen=0,isGood=null,S_END=1.25;
    var fishN=0,bumpN=0;
    function sprinkle(from,to,nf,nb,lane){for(var q=0;q<nf;q++){var at=Math.round(from+(to-from)*(q+0.5)/nf),off=lane?(q%2?0.5:-0.5):(q%3-1)*0.45;segs[at]&&segs[at].sp.push({t:"fish",off:off})}
      for(var b=0;b<nb;b++){var at2=Math.round(from+(to-from)*(b+0.8)/(nb+0.6)),f=segs[at2]&&segs[at2].sp.filter(function(x){return x.t==="fish"})[0],o2=f?-f.off:(b%2?0.5:-0.5);if(segs[at2]) segs[at2].sp.push({t:"mound",off:o2})}}
    sprinkle(8,forkAt-6,Math.ceil(tune.fish*0.6),Math.ceil(tune.bumps*(bumpyRoute?1.6:1)*0.5),tune.lanes);
    for(var pi=0;pi<segs.length;pi+=6){segs[pi].sp.push({t:"pole",off:-1.35});segs[pi].sp.push({t:"pole",off:1.35})}
    for(var pj=4;pj<segs.length;pj+=23){segs[pj].sp.push({t:"ridge",off:pj%2?-3.2:3.4,sc:1+(pj%3)*0.4})}
    segs[forkAt-8].sp.push({t:"sign",off:goodSide*1.5,pic:"dest"});segs[forkAt-8].sp.push({t:"sign",off:-goodSide*1.5,pic:"bumps"});
    var endIdx=0;
    function branch(good){var from=segs.length;
      if(good){add(goodN,{curve:goodSide*-1.2,band:1,hill:function(t){return Math.sin(t*Math.PI)*(k?200:400)}});}
      else{/* the wrong way: longer, hilly and bumpy, with ice ridges close to the trail; it still loops round to the same place */
        var n=bumpyRoute?Math.round(tune.bad*0.75):tune.bad;add(n,{curve:-goodSide*1.8,band:1,kind:"detour",hill:function(t){return Math.sin(t*Math.PI*6)*(k?260:520)}});
        for(var q=from+3;q<segs.length;q+=9){segs[q].sp.push({t:"ridge",off:(q%2?-1.9:2.0),sc:0.8})}}
      for(var pi2=from;pi2<segs.length;pi2+=6){segs[pi2].sp.push({t:"pole",off:-1.35});segs[pi2].sp.push({t:"pole",off:1.35})}
      sprinkle(from+4,segs.length-2,Math.ceil(tune.fish*(good?0.4:0.6)),Math.ceil(tune.bumps*(good?0.5:1.3)*(bumpyRoute?1.5:1)),tune.lanes);
      add(tune.fin,{band:1});segs[segs.length-1].sp.push({t:"dest",off:0});endIdx=segs.length-12;
      var y=0;segs.forEach(function(sg){sg.y=sg.hill})}
    segs.forEach(function(sg){sg.y=sg.hill});
    /* -- state */
    var pos=0,v=0,vmax=tune.v*SEG,x=0,camX=0,lane=k?-0.5:0,slowT=0,last=0,raf=0,ended=false,got=0,bumps=0,tm=0,hold=0,spray=[],decided=false,hit={},lastDir=1;
    var basket=U.el("div","sbx-basket");basket.setAttribute("aria-label","Fish on the sled");basket.innerHTML='<img alt="" src="'+SB.img("prop_fish")+'"><b>0</b>';st.appendChild(basket);
    var prog=U.el("div","sbx-prog");prog.innerHTML='<i></i><img alt="" src="'+SB.img(dest.pic)+'">';st.appendChild(prog);
    var read=null;if(up){read=U.el("div","sbx-sread");st.appendChild(read)}
    var arrowSvg=function(d){return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="'+(d<0?"M30 8 L14 24 L30 40":"M18 8 L34 24 L18 40")+'" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
    var Lb=U.btn("sbx-steer sbx-sl"+(k?" big":""),"Steer left",arrowSvg(-1)),Rb=U.btn("sbx-steer sbx-sr"+(k?" big":""),"Steer right",arrowSvg(1));st.appendChild(Lb);st.appendChild(Rb);
    function steer(d){SB.hand.hide();lastDir=d;if(tune.lanes){lane=d<0?-0.5:0.5;U.log("lane",{lane:lane})}else hold=d}
    function unsteer(){hold=0}
    [[Lb,-1],[Rb,1]].forEach(function(p){p[0].addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();steer(p[1])});["pointerup","pointercancel","pointerleave"].forEach(function(n){p[0].addEventListener(n,unsteer)})});
    cv.addEventListener("pointerdown",function(e){var r=cv.getBoundingClientRect();steer(e.clientX<r.left+r.width/2?-1:1)});cv.addEventListener("pointerup",unsteer);cv.addEventListener("pointercancel",unsteer);
    var kd=function(e){if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();if(!e.repeat) steer(e.key==="ArrowLeft"?-1:1)}},ku=function(e){if(e.key==="ArrowLeft"||e.key==="ArrowRight") unsteer()};
    document.addEventListener("keydown",kd,true);document.addEventListener("keyup",ku,true);
    api.onCleanup(function(){document.removeEventListener("keydown",kd,true);document.removeEventListener("keyup",ku,true);window.removeEventListener("resize",ro);cancelAnimationFrame(raf)});
    /* offset of the player's road centre (in half-road units) for a segment index: the fork splits, the chosen branch eases back */
    function bands(sg){var t=sg.fork;if(t!=null){var sp=ease(t)*S_END;return [{dx:-sp,side:-1},{dx:sp,side:1}]}
      if(sg.band&&chosen){var u=Math.min(1,(sg.i-forkEnd)/24);if(u<1) return [{dx:chosen*S_END*(1-ease(u)),side:chosen,main:true},{dx:-chosen*(S_END+u*2.2),side:-chosen,fade:1-u}];}
      return [{dx:0,main:true}]}
    function mainDx(p){var i=Math.floor(p/SEG),sg=segs[i],sg2=segs[i+1]||sg;if(!sg) return 0;var f=(p%SEG)/SEG,a=bands(sg).filter(function(b){return b.main})[0],b=bands(sg2).filter(function(b){return b.main})[0];return (a?a.dx:0)*(1-f)+(b?b.dx:0)*f}
    function yAt(p){var i=Math.floor(p/SEG),sg=segs[i],sg2=segs[i+1]||sg;if(!sg) return 0;var f=(p%SEG)/SEG;return sg.y*(1-f)+sg2.y*f}
    function decide(){decided=true;chosen=x<0?-1:1;isGood=chosen===goodSide;x=x-chosen*S_END;camX=x;branch(isGood);
      U.log("fork",{good:isGood,side:chosen,x:+(x+chosen*S_END).toFixed(2)});U.log("sledbranch",{branch:isGood?"main":"detour",segs:segs.length});api.learn("geo.map.read",isGood);
      api.say(isGood?(k?"fork_good":{e:"Good steering! That's the way.",u:"Right branch: the short way."}):"bumpy_way")}
    /* -- draw */
    function drawSky(){var im=IM.sky;if(!im.naturalWidth){var gr=g.createLinearGradient(0,0,0,HOR);gr.addColorStop(0,"#1b2a4a");gr.addColorStop(1,"#f2b8a0");g.fillStyle=gr;g.fillRect(0,0,W,HOR+2);return}
      /* walls 1-2 of the camp strip (no tent): x 1750..5000 of 6720, sky + horizon = the top 600 of 1080 rows; ping-pong pan with the curves */
      var kx=im.naturalWidth/6720,srcH=600*im.naturalHeight/1080,scale=(HOR+8)/srcH,sw=Math.min(3250*kx,W/scale),span=Math.max(1,3250*kx-sw),base=1750*kx;
      var off=((skyOff%(2*span))+2*span)%(2*span);if(off>span) off=2*span-off;
      g.drawImage(im,base+off,0,sw,srcH,0,0,W,HOR+8)}
    var skyOff=800;
    function quad(c,x1,y1,w1,x2,y2,w2){g.fillStyle=c;g.beginPath();g.moveTo(x1-w1,y1);g.lineTo(x2-w2,y2);g.lineTo(x2+w2,y2);g.lineTo(x1+w1,y1);g.closePath();g.fill()}
    function proj(wx,wy,cz,cx,cy){var sc=CAMD/Math.max(1,cz);return {x:W/2+sc*(wx-cx)*W/2,y:HOR-sc*(wy-cy)*H/2,w:sc*ROADW*W/2,s:sc}}
    var near=[];
    function render(dt){g.clearRect(0,0,W,H);drawSky();
      var gr=g.createLinearGradient(0,HOR,0,H);gr.addColorStop(0,"#c9d6ea");gr.addColorStop(0.25,"#e3ebf6");gr.addColorStop(1,"#f6f9fd");g.fillStyle=gr;g.fillRect(0,HOR,W,H-HOR);
      var bi=Math.floor(pos/SEG),bp=(pos%SEG)/SEG,base=segs[bi];if(!base) return;
      var camY=CAMH+yAt(pos),cxW=(camX+mainDx(pos))*ROADW;
      var dx=-(base.curve*bp),xx=0,maxy=H;near=[];
      for(var n=0;n<DRAW;n++){var sg=segs[bi+n];if(!sg) break;var z1=n*SEG-bp*SEG,z2=z1+SEG,nx=segs[bi+n+1]||sg;
        var p1x=xx,p2x=xx+dx;xx+=dx;dx+=sg.curve;
        var bs=bands(sg),bs2=bands(nx);sg.clip=maxy;
        var A=proj(0,sg.y,Math.max(z1,1),0,camY),B=proj(0,nx.y,z2,0,camY);
        sg.scr={x1:p1x,y1:A.y,s1:A.s,z1:z1,x2:p2x,y2:B.y,s2:B.s};
        if(B.y>=maxy||z1<0&&n>0){continue}
        var stripe=Math.floor((bi+n)/3)%2;
        g.fillStyle=stripe?"rgba(214,226,242,.55)":"rgba(240,245,252,.55)";g.fillRect(0,B.y,W,A.y-B.y+1);
        for(var b=0;b<bs.length;b++){var b1=bs[b],b2=bs2[Math.min(b,bs2.length-1)];var al=b1.fade!=null?b1.fade:1;if(al<=0.02) continue;g.globalAlpha=al;
          var X1=W/2+A.s*(p1x+b1.dx*ROADW-cxW)*W/2,X2=W/2+B.s*(p2x+b2.dx*ROADW-cxW)*W/2,w1=A.s*ROADW*W/2,w2=B.s*ROADW*W/2;
          var det=sg.kind==="detour";
          quad(det?(stripe?"#8f9bad":"#9aa6b8"):(stripe?"#9fb3cf":"#a9bcd6"),X1,A.y,w1*0.62,X2,B.y,w2*0.62);
                    quad(det?(stripe?"#b2bccb":"#bcc6d4"):(stripe?"#c3d2e6":"#cddaec"),X1,A.y,w1*0.55,X2,B.y,w2*0.55);
          /* two runner ruts */
          quad("#7f94b3",X1-w1*0.2,A.y,Math.max(0.6,w1*0.025),X2-w2*0.2,B.y,Math.max(0.6,w2*0.025));quad("#7f94b3",X1+w1*0.2,A.y,Math.max(0.6,w1*0.025),X2+w2*0.2,B.y,Math.max(0.6,w2*0.025));
          g.globalAlpha=1}
        if(n<3) near.push({n:n,sg:sg,A:A,B:B,p1x:p1x});
        maxy=B.y}
      /* sprites far -> near */
      for(var m=Math.min(DRAW-1,segs.length-bi-1);m>=1;m--){var sg2=segs[bi+m];if(!sg2||!sg2.scr||!sg2.sp.length) continue;var sc2=sg2.scr;if(sc2.z1<=SEG*0.2) continue;
        var main=bands(sg2).filter(function(b){return b.main})[0]||bands(sg2)[0];
        for(var q=0;q<sg2.sp.length;q++){var o=sg2.sp[q];if(o.gone) continue;var bx=(o.t==="sign")?0:(main?main.dx:0);
          if(sg2.fork!=null&&o.t==="fish") bx=0;
          var X=W/2+sc2.s1*(sc2.x1+(bx+o.off)*ROADW-cxW)*W/2,Y=sc2.y1,S=sc2.s1*W/2;
          g.save();g.beginPath();g.rect(0,0,W,sg2.clip);g.clip();drawSprite(o,X,Y,S);g.restore()}}
      /* the team runs ahead on the same trail; then the sled sits on the snow at the bottom */
      drawTeam(cxW,camY);drawSled(dt)}
    function drawImg(im,X,Y,w,aspect,a){if(!im.naturalWidth) return;var h=w*(aspect||im.naturalHeight/im.naturalWidth);if(a!=null) g.globalAlpha=a;g.drawImage(im,X-w/2,Y-h,w,h);g.globalAlpha=1}
    function drawSprite(o,X,Y,S){var u=ROADW*S/ROADW;
      if(o.t==="pole"){var h=S*900;g.fillStyle="#7a5134";g.fillRect(X-S*18,Y-h,S*36,h);g.fillStyle="#e2483d";g.fillRect(X-S*18,Y-h,S*36,h*0.18);return}
      if(o.t==="ridge"){g.fillStyle="rgba(120,150,190,.18)";g.beginPath();g.ellipse(X,Y,S*1400*(o.sc||1),S*90,0,0,7);g.fill();drawImg(IM.ridge,X,Y+S*30,S*2400*(o.sc||1));return}
      if(o.t==="mound"){g.fillStyle="rgba(110,140,180,.25)";g.beginPath();g.ellipse(X,Y,S*620,S*70,0,0,7);g.fill();drawImg(IM.mound,X,Y+S*40,S*1150);return}
      if(o.t==="fish"){var bob=Math.sin(tm*6+X)*S*40;g.fillStyle="rgba(90,120,160,.25)";g.beginPath();g.ellipse(X,Y,S*260,S*40,0,0,7);g.fill();drawImg(IM.fish,X,Y-S*120+bob,S*520);return}
      if(o.t==="sign"){var hh=S*1500;g.fillStyle="#6b4529";g.fillRect(X-S*30,Y-hh,S*60,hh);var bw=S*1200,bh=S*900;g.fillStyle="#f4e2c4";g.strokeStyle="#6b4529";g.lineWidth=Math.max(1,S*40);g.fillRect(X-bw/2,Y-hh-bh*0.6,bw,bh);g.strokeRect(X-bw/2,Y-hh-bh*0.6,bw,bh);
        var im=o.pic==="dest"?IM.dest:IM.other;drawImg(im,X,Y-hh-bh*0.6+bh*0.92,bw*0.84,bh*0.84/(bw*0.84));
        if(o.pic!=="dest"){g.strokeStyle="#c0392b";g.lineWidth=Math.max(1.5,S*55);g.beginPath();for(var zz=0;zz<5;zz++){var px=X-bw*0.4+zz*bw*0.2;g.lineTo(px,Y-hh-bh*0.6+bh*(zz%2?0.2:0.42))}g.stroke()}
        var ar=(o.off<0?-1:1);g.fillStyle="#6b4529";g.beginPath();g.moveTo(X+ar*bw*0.62,Y-hh-bh*0.1);g.lineTo(X+ar*bw*0.48,Y-hh-bh*0.32);g.lineTo(X+ar*bw*0.48,Y-hh+bh*0.12);g.fill();return}
      if(o.t==="dest"){/* the place at the end of the trail, at a believable size */if(dest.id==="pup"){drawImg(IM.mound,X-S*500,Y+S*80,S*2600);drawImg(IM.dest,X+S*700,Y+S*20,S*520)}else drawImg(IM.dest,X,Y+S*60,S*(dest.id==="den"?2600:3600),null);return}}
    function drawTeam(cxW,camY){/* dogs at fixed distances ahead of the sled, on the trail surface */
      var pts=[];[5,7.6].forEach(function(dz,idx){var zz=dz*SEG,p=pos+zz,i=Math.floor(p/SEG),sg=segs[i];if(!sg||!sg.scr) return;var f=(p%SEG)/SEG,sc=sg.scr,
          wx=sc.x1+(sc.x2-sc.x1)*f+(x+mainDx(p))*ROADW,wy=yAt(p),A=proj(wx,wy,zz,cxW,camY);pts.push(A)});
      var sledP={x:W/2+(x-camX)*W*0.18,y:H*0.97};
      g.strokeStyle="#3a2a1e";g.lineWidth=2.5;g.beginPath();g.moveTo(sledP.x,sledP.y-H*0.2);pts.forEach(function(p){g.lineTo(p.x,p.y-p.s*W/2*140)});g.stroke();
      for(var i=pts.length-1;i>=0;i--){var p=pts[i],w=p.s*W/2*600,run=Math.abs(Math.sin(tm*14+i))*p.s*W/2*50;g.fillStyle="rgba(90,110,140,.28)";g.beginPath();g.ellipse(p.x,p.y,w*0.42,w*0.07,0,0,7);g.fill();drawImg(IM.dogs,p.x,p.y-run,w)}}
    function drawSled(dt){var sw=Math.min(W*0.3,H*0.46),sx=W/2+(x-camX)*W*0.18,sy=H*0.995,b=Math.sin(tm*11)*2+(slowT>0?Math.sin(tm*40)*4:0),tilt=U.clamp((x-camX)*0.6+(hold||0)*0.05+(tune.lanes?(lane-x)*-0.25:0),-0.14,0.14);
      g.fillStyle="rgba(70,95,130,.35)";g.beginPath();g.ellipse(sx,sy-4,sw*0.46,sw*0.06,0,0,7);g.fill();
      if(v>SEG*4) for(var i=0;i<2;i++) spray.push({x:sx+(Math.random()-0.5)*sw*0.7,y:sy-6,vx:(Math.random()-0.5)*90+(tilt*-500),vy:-60-Math.random()*90,l:0.6});
      spray=spray.filter(function(p){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;return p.l>0});g.fillStyle="rgba(255,255,255,.85)";spray.forEach(function(p){g.beginPath();g.arc(p.x,p.y,2+3*p.l,0,7);g.fill()});
      if(!IM.sled.naturalWidth) return;var h=sw*IM.sled.naturalHeight/IM.sled.naturalWidth;g.save();g.translate(sx,sy+b);g.rotate(tilt);g.drawImage(IM.sled,-sw/2,-h,sw,h);
      for(var f=0;f<Math.min(got,6);f++){if(IM.fish.naturalWidth) g.drawImage(IM.fish,-sw*0.22+f*sw*0.075,-h*0.62,sw*0.13,sw*0.13*IM.fish.naturalHeight/IM.fish.naturalWidth)}g.restore();
      sledEl.style.transform="translate("+(sx-sw/2)+"px,"+(sy-h)+"px)";sledEl.style.width=sw+"px";sledEl.style.height=h+"px";sledEl.dataset.y=Math.round(sy);sledEl.dataset.snow=Math.round(sy-4)}
    /* an invisible box that tracks the drawn sled, so tests can read where it sits (S1) */
    var sledEl=U.el("i","sbx-sledbox");sledEl.setAttribute("aria-hidden","true");st.appendChild(sledEl);
    /* -- step */
    var forkSaid=false;
    function tick(ts){raf=0;if(api.closed||ended) return;var dt=last?Math.min(0.05,(ts-last)/1000):0.016;last=ts;tm+=dt;
      var target=vmax*(slowT>0?0.5:1);if(slowT>0) slowT-=dt;v+=(target-v)*Math.min(1,dt*2.2);pos+=v*dt;
      var bi=Math.floor(pos/SEG),sg=segs[bi];
      if(tune.lanes){x+=((lane+(decided?0:0))-x)*Math.min(1,dt*6)}else{x+=hold*1.5*dt;}
      if(!decided&&sg&&sg.fork!=null){/* inside the fork the two branches drift apart; x stays where the child steered it */}
      x=U.clamp(x,decided||!(sg&&sg.fork!=null)?-0.75:-0.75-S_END,decided||!(sg&&sg.fork!=null)?0.75:0.75+S_END);
      /* inside the fork the team follows whichever branch it is leaning into (the child's choice; never pulled to the "right" one) */
      if(sg&&sg.fork!=null&&!decided&&!tune.lanes&&!hold){var lean=x<0?-1:x>0?1:lastDir;x+=((lean*ease(sg.fork)*S_END)-x)*Math.min(1,dt*1.5)}
      if(sg&&sg.fork!=null&&!decided&&tune.lanes){var tl=lane<0?-1:1;x+=((tl*ease(sg.fork)*S_END+lane*0.5)-x)*Math.min(1,dt*6)}
      camX+=(x-camX)*Math.min(1,dt*3.2);
      if(sg) skyOff+=sg.curve*v*dt*0.006;
      if(!decided&&bi>=forkEnd) decide();
      if(!forkSaid&&bi>=forkAt-14){forkSaid=true;U.log("forksee",{good:goodSide});if(k){api.say("fork_"+dest.id);SB.hand.show(goodSide<0?Lb:Rb)}else api.say({e:"A fork! Follow the sign with the "+dest.label.toLowerCase()+".",u:"Fork ahead: follow the "+dest.label.toLowerCase()+" sign."})}
      /* pickups and bumps at the sled (segment just reached) */
      for(var j=Math.max(0,bi-1);j<=bi;j++){var s2=segs[j];if(!s2||hit[j]) continue;if(pos<j*SEG+SEG*0.4) continue;hit[j]=true;var md=s2.fork!=null?0:(bands(s2).filter(function(b){return b.main})[0]||{dx:0}).dx;
        s2.sp.forEach(function(o){var rel=x-(s2.fork!=null?0:0);if(o.t==="fish"&&Math.abs(rel-o.off)<0.36){o.gone=true;got++;U.sfx("pop");basket.querySelector("b").textContent=got;U.anim(basket,"a-jump",400);api.give({kit:{fish:1}});U.log("pickup",{n:got,seg:j});if(got===1) api.say(k?"ride_fish":{e:"A fish! Into the basket.",u:"Fish: "+got})}
          if(o.t==="mound"&&Math.abs(rel-o.off)<0.34){slowT=1.0;bumps++;U.sfx("bump");U.log("bump",{n:bumps,seg:j});if(bumps<=2) api.say("bumpy")}})}
      prog.querySelector("i").style.width=(U.clamp(pos/((endIdx||segs.length+tune.good+tune.fin)*SEG),0,1)*100)+"%";
      if(read){var left=Math.max(0,(endIdx||(segs.length+tune.good+tune.fin))-bi);read.innerHTML='<span>'+(left*KM_PER_SEG*10).toFixed(1)+' km to go</span><span>'+Math.floor(tm/60)+":"+("0"+Math.floor(tm%60)).slice(-2)+'</span>';read.dataset.left=left}
      render(dt);
      if(endIdx&&bi>=endIdx){ended=true;U.log("sledarrive",{dest:dest.id,good:isGood,fish:got,bumps:bumps,secs:+tm.toFixed(1),route:route});setTimeout(function(){arrive({fish:got,bumps:bumps,good:isGood,secs:tm})},500);return}
      raf=requestAnimationFrame(tick)}
    st.dataset.dest=dest.id;U.log("sledstart",{dest:dest.id,route:route,band:band});
    api.say(k?"sled_go":{e:"Mush! Hold an arrow to steer.",u:"Mush! Hold an arrow to steer.",t:"Go. Hold to steer."}).then(function(){if(k&&!api.closed) api.say("lanes")});
    U.sfx("whoosh");raf=requestAnimationFrame(tick);
    api.hint(function(){if(!k) return;var bi=Math.floor(pos/SEG);for(var j=bi+2;j<bi+30;j++){var sg=segs[j];if(!sg) break;var f=sg.sp.filter(function(o){return o.t==="fish"&&!o.gone})[0];if(f){SB.hand.show(f.off<0?Lb:Rb);return}}})}

  /* ---- 4. each place has its own ending; ✓ goes back to camp */
  function arrive(r){st.dataset.phase="arrive";U.$$(".sbx-steer,.sbx-prog,.sbx-sread",st).forEach(function(e){e.remove()});SB.hand.hide();U.sfx("win");
    var ov=U.el("div","sbx-send sbx-send-"+dest.id);st.appendChild(ov);var res={dest:dest.id,fish:r.fish,good:r.good,coins:0,reward:null};
    var ok=U.btn("sbx-send-ok off","Back to camp",'<b aria-hidden="true">\u2713</b>');
    function finish(){if(ok.classList.contains("off")||api.closed) return;U.log("sledend",res);team.forEach(function(id){SB.ecs.set(id,{tired:true,hunger:1,mood:"tired"})});
      var rec=s.reg.sparks.sled=s.reg.sparks.sled||{plays:0};rec.ends=rec.ends||{};rec.ends[dest.id]=(rec.ends[dest.id]|0)+1;SB.store.save();done(res)}
    ok.addEventListener("pointerup",function(e){e.preventDefault();finish()});ok.addEventListener("click",finish);
    function ready(){ok.classList.remove("off");ov.appendChild(ok);api.hint(function(){SB.hand.show(ok)})}
    var F=s.reg.flags;
    if(dest.id==="fish"){var per=COIN_PER_FISH[band]||2;ov.innerHTML='<img class="sbx-sendbg" alt="" src="'+SB.img("sbx/fishcamp")+'"><div class="sbx-sendrow"></div>';var row=ov.querySelector(".sbx-sendrow");
      var n=r.fish;if(n) SB.kit.remove("fish",n);var i=0;
      api.say(n?"fishcamp_sell":"fishcamp_none");
      (function next(){if(api.closed) return;if(i<n){i++;var c=U.el("span","sbx-sendfish");c.innerHTML='<img alt="" src="'+SB.img("prop_fish")+'"><i>\u2192</i>'+new Array(per+1).join('<img alt="" src="'+SB.img("sbx/coin")+'">');row.appendChild(c);U.sfx("coin");if(k) SB.voice.count(i);setTimeout(next,k?900:500);return}
        res.coins=n*per;var p=res.coins?api.give({coins:res.coins,src:"job",item:"fishcamp",from:{x:innerWidth/2,y:innerHeight*0.6}}):Promise.resolve();U.log("fishcoins",{fish:n,per:per,coins:res.coins});
        if(up&&n){var eq=U.el("div","sbx-sendeq");eq.textContent=n+" \u00d7 "+per+" = "+res.coins+" coins";ov.appendChild(eq);api.learn("math.count.10",true)}
        p.then(function(){if(api.closed) return;if(!F.fishRack){F.fishRack=true;SB.kit.add("fish_rack",1);res.reward="fish_rack";var rk=U.el("div","sbx-sendgift");rk.innerHTML='<img alt="" src="'+SB.img("sbx/fish_rack")+'">';ov.appendChild(rk);U.anim(rk,"a-jump",600);api.say("fishcamp_rack")}
          ready()})})()}
    else if(dest.id==="pup"){ov.innerHTML='<img class="sbx-sendbg" alt="" src="'+SB.img("sbx/den_hill")+'"><button type="button" class="sbx-sendpup" aria-label="The lost pup"><img alt="" src="'+SB.img("sbx/pup")+'"></button>';
      var pupB=ov.querySelector(".sbx-sendpup");
      if(F.pupHome){api.say("pup_visit");res.reward="visit";setTimeout(ready,1200)}
      else{api.say("pup_found");api.hint(function(){SB.hand.show(pupB)});var tk=false;U.onTap(pupB,function(){if(tk) return;tk=true;SB.hand.hide();U.sfx("woof");pupB.classList.add("hop");F.pupHome=true;res.reward="pup";U.log("pupjoin",{});SB.store.save();api.say("pup_join");setTimeout(ready,900)})}}
    else{ov.innerHTML='<img class="sbx-sendbg" alt="" src="'+SB.img("sbx/den_hill")+'"><div class="sbx-sendkits"><img alt="" src="'+SB.img("sbx/fox_kits")+'"></div><div class="sbx-sendgive"></div>';
      var gv=ov.querySelector(".sbx-sendgive"),kits=ov.querySelector(".sbx-sendkits");var hasL=!!(F.foxLantern||(SB.kit.has&&SB.kit.has("lantern_fox"))),hasF=!!(SB.kit.has&&SB.kit.has("fish"));
      if(!hasL&&!hasF){kits.classList.add("peek");api.say("den_shy");res.reward="none";setTimeout(ready,1500)}
      else{api.say("den_bring");var opts=[];if(hasL) opts.push(["lantern","sbx/lantern_fox","Show the fox lantern"]);if(hasF) opts.push(["fish","prop_fish","Give a fish"]);
        opts.forEach(function(o){var b=U.btn("sbx-sendopt",o[2],'<img alt="" src="'+SB.img(o[1])+'">');b.dataset.give=o[0];gv.appendChild(b);U.onTap(b,function(){if(gv.dataset.done) return;gv.dataset.done="1";SB.hand.hide();
          if(o[0]==="fish") SB.kit.remove("fish",1);var fx=R.fox();if(fx) SB.ecs.set(fx.id,{trust:Math.min(100,(fx.live.trust|0)+30)});
          var first=!F.foxKits;F.foxKits=true;res.reward=first?"kits":"kits_again";res.gave=o[0];SB.store.save();U.log("denkits",{gave:o[0],first:first});
          kits.classList.add("out");U.sfx("win");api.say(first?"den_kits":"den_again");setTimeout(ready,1400)})});
        api.hint(function(){var b=gv.querySelector(".sbx-sendopt");if(b) SB.hand.show(b)})}}}

  map();
})}});

/* camp: show the trip's reward where the child can see it */
R.afterSled=function(res){var s=SB.session;if(!res||!res.dest) return;R.refresh();
  var id=res.reward==="pup"||res.reward==="visit"?"pup_camp":(res.reward==="kits"||res.reward==="kits_again")?"kits_camp":res.reward==="fish_rack"?"rack_camp":null;
  setTimeout(function(){if(s.spark||s.dead) return;var e=id&&SB.ent(id);if(e){s.pano.toEnt(e,700);setTimeout(function(){if(!s.spark) SB.hand.show(id)},900);
      SB.voice.say(id==="pup_camp"?"pup_home":id==="kits_camp"?"kits_home":"rack_home")}else SB.voice.say("dog_tired")},500)};
})();

/* ---- sbx-src/regions/arctic/52-campgifts.js */
/* P3 §4: what the sled trips bring home, shown in camp. Hidden until earned (flags set by the sled endings). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic,T=R.types;
function mk(cls,anim){return function(e){var n=U.el("div",cls);n.innerHTML='<div class="sbx-body'+(anim?" "+anim:"")+'"><img class="sbx-spr" alt="" draggable="false" src="'+SB.img(e.sprite.asset)+'"></div>';return n}}
function show(flag){return function(e,n,s){if(!n) return;var on=!!(s||SB.session).reg.flags[flag];n.classList.toggle("sbx-hidden",!on);n.setAttribute("aria-hidden",on?"false":"true")}}
T.pup={make:mk("sbx-e-pup","a-breathe"),refresh:show("pupHome"),
  tap:function(e,n){if(!SB.session.reg.flags.pupHome) return;U.sfx("woof");U.anim(n.querySelector(".sbx-body"),"a-jump",500);SB.voice.say("pup_happy")}};
T.kits={make:mk("sbx-e-kits","a-breathe"),refresh:show("foxKits"),
  tap:function(){if(!SB.session.reg.flags.foxKits) return;SB.openSpark("photo")}};
T.rack={make:mk("sbx-e-rack"),refresh:show("fishRack"),
  tap:function(e,n){if(!SB.session.reg.flags.fishRack) return;U.sfx("pop");U.anim(n.querySelector(".sbx-body"),"a-bump",400);SB.voice.say("rack_home")}};
})();

/* ---- sbx-src/regions/arctic/60-post.js */
/* Trading post spark: sell fish (coins pop one at a time, counted at k), buy with coins (2 items at a time at k),
   a wish jar with the exact missing coins when you can't afford something. e: paying and change. u/t: set your own price. */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic;
SB.defineSpark("post",{region:"arctic",opensFrom:"trader",label:"Trading post",maxSec:120,skills:["math.count.10","math.money.count","math.money.change","econ.choice","econ.price"],
start:function(api,knobs){return new Promise(function(done){var s=SB.session,st=api.stage,band=api.band,W=s.world,k=band==="k",per=k?2:(knobs.perPage||3);
  st.classList.add("sbx-postsp");var bg=U.el("div","sbx-bg");st.appendChild(bg);SB.stripBg(bg,s.pano.imgs[0].src,0,86,s.cfg.strip.overlap);
  var trader=U.el("div","sbx-ptrader");trader.innerHTML='<img alt="" draggable="false" src="'+SB.img("sbx/trader")+'"><span class="sbx-bubble"></span>';st.appendChild(trader);
  var counter=U.el("div","sbx-counter");st.appendChild(counter);
  var sell=U.el("div","sbx-sell");counter.appendChild(sell);var shop=U.el("div","sbx-shop");counter.appendChild(shop);
  var price=SB.econ.price("fish",s.id),myPrice=price,sold=0,bought=0,visitors=null,vi=0;
  /* ---- sell */
  function priceTag(n){var h="";for(var i=0;i<n;i++) h+='<img alt="" src="'+SB.img("sbx/coin")+'">';return '<span class="sbx-ptag" data-price="'+n+'" aria-label="'+n+' coins each"><img class="sbx-pfish" alt="" src="'+SB.img("prop_fish")+'"> = '+h+(k?"":' <b>'+n+'</b>')+'</span>'}
  /* P3 1d: the row is laid out once per visit (one slot per fish, up to 16). Whichever fish is tapped, the trader always takes the
     RIGHTMOST full one; that slot stays empty for the rest of the visit, nothing re-lays out and a given fish never comes back. */
  var slotsN=Math.min(SB.kit.count("fish"),16);
  function renderSell(){var c=SB.kit.count("fish"),fish="",full=Math.min(c,slotsN);for(var i=0;i<slotsN;i++) fish+=i<full?'<button type="button" class="sbx-sfish" data-i="'+i+'" aria-label="Give a fish"><img alt="" draggable="false" src="'+SB.img("prop_fish")+'"></button>':'<span class="sbx-sfish sbx-sempty" data-i="'+i+'" aria-hidden="true"></span>';
    if(c<=0) fish="";
    sell.innerHTML='<div class="sbx-sellhead">'+priceTag(band==="u"||band==="t"?myPrice:price)+'</div><div class="sbx-sbucket">'+(fish||'<img class="sbx-nofish" alt="" src="'+SB.img("prop_bucket")+'">')+'</div>'+
      (band==="u"||band==="t"?'<div class="sbx-setprice"><button type="button" class="sbx-pm" data-d="-1" aria-label="Lower the price">\u2212</button><b>'+myPrice+'</b> coins<button type="button" class="sbx-pm" data-d="1" aria-label="Raise the price">+</button></div><div class="sbx-today">Earned today: <b>'+SB.econ.earnedToday()+'</b>'+(band==="t"?' \u00b7 Getting fish here cost the camp 1 coin each in dog food.':"")+'</div>':"");
    sell.dataset.fish=c;sell.dataset.slots=slotsN;sell.classList.toggle("many",slotsN>8);U.$$(".sbx-sfish",sell).forEach(function(b){U.onTap(b,function(){sellOne(b)})});
    U.$$(".sbx-pm",sell).forEach(function(b){U.onTap(b,function(){myPrice=U.clamp(myPrice+(+b.dataset.d),1,9);U.sfx("click");renderSell()})});
    if(!c&&!k){}trader.querySelector(".sbx-bubble").innerHTML=c?'<img alt="" src="'+SB.img("prop_fish")+'"><img alt="" src="'+SB.img("prop_fish")+'"> \u2192 <img alt="" src="'+SB.img("sbx/coin")+'">':""}
  var busy=false;
  function sellOne(tapped){if(busy||!SB.kit.has("fish")) return;var all=U.$$("button.sbx-sfish",sell),b=all[all.length-1];if(!b) return;busy=true;var r=U.rect(b),tr=U.rect(trader);SB.hand.hide();
    if(band==="u"||band==="t"){if(!visitors){var rr=R.rng(s.reg.seed+s.reg.day*31);visitors=[3,2,4,2,3,5,1,4].map(function(v){return v+(rr()<.3?1:0)})}
      var max=visitors[vi%visitors.length];vi++;if(myPrice>max){busy=false;U.log("nobuy",{price:myPrice,max:max});api.learn("econ.price",false);api.say({u:"\u201C"+myPrice+" coins is too much for me,\u201D says the visitor. They would pay "+max+".",t:"Visitor's limit: "+max+" coins. No sale at "+myPrice+"."});U.anim(trader,"a-no",500);return}}
    var each=(band==="u"||band==="t")?myPrice:price;U.sfx("pop");b.classList.add("gone");
    setTimeout(function(){var got=SB.econ.sell("fish",1,s.id,{each:each});sold++;api.run.earned.coins+=got;U.log("sold",{each:each,got:got,left:SB.kit.count("fish"),slot:+b.dataset.i});SB.hud.earnBadge("sale");if(band==="u"||band==="t") api.learn("econ.price",true);
      SB.hud.flyCoins({x:tr.cx,y:tr.cy},got).then(function(){busy=false;api.learn("math.count.10",true);renderSell();renderShop();if(!SB.kit.has("fish")&&sold) api.say("sold_all");else if(k){var a=U.$$("button.sbx-sfish",sell);if(a.length) SB.hand.show(a[a.length-1])}})},250)}
  /* ---- shop: per page items; tap to buy; unaffordable -> wish jar with the exact missing coins */
  var page=0,stock=(W.shop||[]).filter(function(id){return SB.kit.item(id)});
  function renderShop(){shop.innerHTML="";var pages=Math.ceil(stock.length/per);page=U.mod(page,pages);var items=stock.slice(page*per,page*per+per);var row=U.el("div","sbx-srow");shop.appendChild(row);
    items.forEach(function(id){var pr=SB.econ.price(id,s.id),can=SB.econ.canAfford(pr),t=U.btn("sbx-stile"+(can?"":" dear"),SB.kit.name(id)+", "+pr+" coins",'<img alt="" draggable="false" src="'+SB.kitImg(id)+'">');t.dataset.item=id;t.dataset.price=pr;
      var dots=U.el("span","sbx-dots");var h="";for(var i=0;i<pr;i++) h+='<i class="'+(i<SB.econ.balance()?"on":"")+'"></i>';dots.innerHTML=h+(k?"":' <b>'+pr+'</b>');t.appendChild(dots);if(!k) t.appendChild(U.el("b","sbx-tname",U.esc(SB.kit.name(id))));
      if(SB.kit.has(id)) t.appendChild(U.el("span","sbx-have","\u2713"));row.appendChild(t);U.onTap(t,function(){buy(id,t)})});
    if(pages>1){var L=U.btn("sbx-page sbx-pl","More things",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 8 L14 24 L30 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'),Rr=U.btn("sbx-page sbx-pr","More things",'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 8 L34 24 L18 40" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      shop.insertBefore(L,row);shop.appendChild(Rr);U.onTap(L,function(){page--;U.sfx("whoosh");renderShop()});U.onTap(Rr,function(){page++;U.sfx("whoosh");renderShop()})}
    shop.dataset.page=page;shop.dataset.shown=items.join(",")}
  var wish=null;
  function showWish(id,pr){if(wish) wish.remove();var have=SB.econ.balance(),miss=pr-have;wish=U.el("div","sbx-wishcard");wish.dataset.item=id;wish.dataset.missing=miss;wish.dataset.price=pr;
    var dots="";for(var i=0;i<pr;i++) dots+='<i class="'+(i<have?"on":"")+'"></i>';
    wish.innerHTML='<img class="sbx-wjar" alt="" src="'+SB.img("sbx/jar")+'"><img class="sbx-witem" alt="" src="'+SB.kitImg(id)+'"><span class="sbx-slots big">'+dots+'</span>'+(k?"":'<b>'+miss+' more coin'+(miss>1?"s":"")+'</b>');st.appendChild(wish);
    SB.econ.wish(id);U.log("wish",{item:id,missing:miss,price:pr,coins:have});api.learn("econ.choice",true,true);api.say("need_more");U.onTap(wish,function(){wish.remove();wish=null})}
  function buy(id,t){if(busy) return;var pr=SB.econ.price(id,s.id);SB.hand.hide();
    if(!SB.econ.canAfford(pr)){U.sfx("no");U.anim(t,"a-no",500);showWish(id,pr);return}
    if(band==="e") return payTray(id,pr,t);complete(id,pr,t)}
  function complete(id,pr,t){var res=SB.econ.spend(pr,{item:id,region:s.id});if(!res.ok){showWish(id,pr);return}SB.kit.add(id,1);bought++;SB.econ.unwish(id);if(wish){wish.remove();wish=null}
    var r=U.rect(t),bg2=U.rect(SB.hud.bag),f=U.el("img","sbx-flycoin");f.src=SB.kitImg(id);f.style.width="90px";document.body.appendChild(f);
    if(f.animate){var a=f.animate([{transform:"translate3d("+(r.cx-45)+"px,"+(r.cy-45)+"px,0)"},{transform:"translate3d("+(bg2.cx-45)+"px,"+(bg2.cy-45)+"px,0) scale(.4)"}],{duration:650,easing:"ease-in"});a.onfinish=function(){f.remove();U.anim(SB.hud.bag,"bump",300)}}else f.remove();
    U.sfx("win");api.learn("econ.choice",true);api.learn("math.money.count",true);api.say("its_yours");SB.hud.coins(SB.econ.balance());renderShop();U.log("bought",{item:id,price:pr})}
  /* e: count coins onto the tray; pay too much and the trader counts the change back */
  function payTray(id,pr,t){busy=true;var tray=U.el("div","sbx-tray");tray.innerHTML='<div class="sbx-tcoins"></div><button type="button" class="sbx-pay">Pay</button><div class="sbx-tpile"></div>';st.appendChild(tray);var n=0,pile=tray.querySelector(".sbx-tpile"),tc=tray.querySelector(".sbx-tcoins");
    for(var i=0;i<Math.min(SB.econ.balance(),12);i++){var c=U.btn("sbx-tcoin","A coin",'<img alt="" src="'+SB.img("sbx/coin")+'">');pile.appendChild(c);(function(c){U.onTap(c,function(){if(c.classList.contains("used")) return;c.classList.add("used");n++;var m=U.el("img");m.src=SB.img("sbx/coin");tc.appendChild(m);U.sfx("coin");api.count(n)})})(c)}
    api.say({e:"It costs "+pr+". Tap coins onto the tray, then tap Pay."});
    U.onTap(tray.querySelector(".sbx-pay"),function(){if(n<pr){api.say({e:"That's "+n+". We need "+pr+". Add "+(pr-n)+" more."});api.learn("math.money.count",false);return}
      var ch=n-pr;tray.remove();busy=false;complete(id,pr,t);if(ch>0){api.learn("math.money.change",true);api.say({e:"You gave "+n+". It costs "+pr+". Your change: "+ch+" back!"})}else api.learn("math.money.count",true)})}
  renderSell();renderShop();
  api.hint(function(i){var f=sell.querySelector(".sbx-sfish");if(f){SB.hand.show(f,{gesture:"drag",to:trader});if(i>0) api.say("sell_fish");return}var can=U.$$(".sbx-stile",shop).filter(function(x){return !x.classList.contains("dear")})[0];if(can){SB.hand.show(can);if(i>0) api.say("shop_pick")}else{var pg=shop.querySelector(".sbx-pr");if(pg) SB.hand.show(pg)}});
  if(SB.kit.has("fish")) api.say(band==="u"||band==="t"?{u:"Set your price with plus and minus, then offer a fish. Each visitor has a top price.",t:"Set a price. Each visitor has a limit; find the price that earns the most."}:"sell_fish").then(function(){var f=sell.querySelector(".sbx-sfish");if(f&&!api.closed) SB.hand.show(f)});
  else api.say("shop_pick");
  /* the post is open-ended: the child leaves with ✕ when done (keeps everything) */
})}});
})();

/* ---- sbx-src/regions/arctic/70-photo.js */
/* Fox photo spark (P3 1a). Tap the fox (or the camera) to take a photo. After every photo the fox moves to a NEW pose within 2.5 s,
   so the game can never stall; the slots fill left to right. After the last slot: a reward card (photos + fox lantern), and the
   ✓ closes it at once, puts the lantern in the bag and returns to camp. No auto-close (auto-advance is banned). Idle 20 s: the
   hand points at the fox. After the fox-den sled trip the kits pose set unlocks (journal "foxkits"). */
(function(){
"use strict";
var SB=window.SparkSandbox,U=SB.u,R=SB.regions.arctic;
SB.defineSpark("photo",{region:"arctic",label:"Fox photos",skills:["care.patience","sci.animal.behaviour","read.decode.cvc"],
start:function(api){return new Promise(function(done){var s=SB.session,fox=R.fox(),st=api.stage,band=api.band;
  st.classList.add("sbx-photo");var bg=U.el("div","sbx-bg");st.appendChild(bg);SB.stripBg(bg,s.pano.imgs[0].src,2,46,s.cfg.strip.overlap);
  var drift=U.el("img","sbx-drift");drift.src=SB.img("sbx/woodpile");drift.alt="";st.appendChild(drift);
  /* which pose set: the fox set until it is full, then the kits set once the den trip unlocked it */
  var sets=s.def.journal.filter(function(j){return j.id==="fox"||(j.id==="foxkits"&&s.reg.flags.foxKits)});
  var set=sets.filter(function(j){var g=s.reg.journal[j.id]||[];return g.length<j.slots.length})[0]||null,free=!set;if(!set) set=sets[sets.length-1];
  var journal=s.reg.journal[set.id]=s.reg.journal[set.id]||[];var slots=set.slots;
  var fx=U.btn("sbx-fox","The fox",'<img alt="" draggable="false">');st.appendChild(fx);var fimg=fx.querySelector("img");
  var cam=U.btn("sbx-cam","Take a photo",'<img alt="" draggable="false" src="'+SB.img("sbx/camera")+'">');st.appendChild(cam);
  var strip=U.el("div","sbx-fstrip");st.appendChild(strip);var flash=U.el("div","sbx-flash");st.appendChild(flash);
  function renderStrip(){strip.innerHTML="";slots.forEach(function(sl,i){var got=journal.indexOf(sl.id)>=0,c=U.el("div","sbx-fslot"+(got?" got":""));c.dataset.slot=sl.id;c.dataset.i=i;
    c.innerHTML=got?'<img alt="" src="'+SB.img(sl.pic)+'">':'<span aria-hidden="true">'+(i+1)+'</span>';
    if(got&&band!=="k"){var w=U.btn("sbx-word",U.pick(sl.label),U.esc(U.pick(sl.label,"e")));c.appendChild(w);U.onTap(w,function(){api.word(sl.word)})}strip.appendChild(c)})}
  /* the next empty slot, in order 1,2,3 */
  function nextSlot(){for(var i=0;i<slots.length;i++) if(journal.indexOf(slots[i].id)<0) return i;return -1}
  var cur=free?0:nextSlot(),busy=false;
  function place(anim){var W=st.clientWidth,H=st.clientHeight,k=slots.length>1?cur/(slots.length-1):1,nar=W/H<0.9;
    var h=H*(0.2+0.2*k),x=W*(nar?0.72-0.4*k:0.7-0.3*k),y=H*(0.66+0.2*k);var sl=slots[cur];fimg.src=SB.img(sl.pic);fx.dataset.pose=sl.id;fx.dataset.i=cur;
    fx.style.height=h+"px";fx.style.width=(h*1.1)+"px";fx.style.transition=anim?"transform .9s ease, height .9s ease, width .9s ease":"none";
    fx.style.transform="translate3d("+x+"px,"+(y-h)+"px,0) translateX(-50%)";
    drift.style.height=(H*.13)+"px";drift.style.transform="translate3d("+(W*.74)+"px,"+(H*.62-H*.11)+"px,0) translateX(-50%)"}
  renderStrip();place(false);var onR=function(){place(false)};addEventListener("resize",onR);api.onCleanup(function(){removeEventListener("resize",onR)});
  /* idle 20 s -> the hand points at the fox (own timer, reset by any touch) */
  var idleT=0;function idle(){clearTimeout(idleT);idleT=setTimeout(function(){if(api.closed) return;SB.hand.show(fx,{gesture:"tap"});U.log("photoidle",{});SB.voice.say("fox_snap")},20000)}
  st.addEventListener("pointerdown",function(){SB.hand.hide();idle()},true);idle();api.onCleanup(function(){clearTimeout(idleT)});
  function snap(){if(busy) return;busy=true;var sl=slots[cur];U.sfx("shutter");flash.classList.remove("go");void flash.offsetWidth;flash.classList.add("go");
    U.log("photo",{pose:sl.id,set:set.id});SB.learn.moment("sci.animal.behaviour",{ok:true,region:"arctic",spark:"photo"});
    SB.ecs.set("fox_camp",{trust:Math.min(100,(fox.live.trust|0)+10)});
    if(free){setTimeout(function(){cur=(cur+1)%slots.length;place(true);busy=false},1200);return}
    journal.push(sl.id);SB.store.save(true);renderStrip();var c=strip.querySelector('.sbx-fslot[data-i="'+cur+'"]');if(c){U.anim(c,"bump",500);var r=U.rect(c);U.burst(r.cx,r.cy,10,["\u2728"])}
    var left=slots.length-journal.length;U.log("photonew",{pose:sl.id,got:journal.length,of:slots.length,set:set.id});
    if(left<=0){finale();return}
    api.say(left===1?"photo_more1":"photo_more2");
    /* the fox moves to the next pose within 2.5 s, whatever the child does */
    setTimeout(function(){if(api.closed) return;cur=nextSlot();U.sfx("pop");place(true);U.log("foxpose",{pose:slots[cur].id});setTimeout(function(){busy=false},500)},1600)}
  U.onTap(fx,snap);U.onTap(cam,snap);
  function finale(){var first=set.id==="fox"&&!s.reg.flags.foxLantern;U.sfx("win");U.log("photoend",{set:set.id,got:journal.length,reward:first?"lantern_fox":""});clearTimeout(idleT);SB.hand.hide();
    var ov=U.el("div","sbx-fend");ov.innerHTML='<div class="sbx-fend-row">'+slots.map(function(sl){return '<img alt="" src="'+SB.img(sl.pic)+'">'}).join("")+'</div>'+(first?'<img class="sbx-fend-gift" alt="" src="'+SB.kitImg("lantern_fox")+'">':'')+'<button type="button" class="sbx-fend-ok" aria-label="Done"><span aria-hidden="true">\u2714</span></button>';st.appendChild(ov);
    var r=U.rect(ov);U.burst(r.cx,r.cy*0.7,22);var fin=false,okb=ov.querySelector(".sbx-fend-ok");
    /* ✓ works from the first frame, also while Spark is talking */
    function end(){if(fin) return;fin=true;SB.voice.cut();if(first){s.reg.flags.foxLantern=1;api.give({kit:{lantern_fox:1}})}U.log("photook",{lantern:SB.kit.has("lantern_fox")});ov.remove();done({ok:true})}
    okb.addEventListener("pointerup",function(e){e.preventDefault();e.stopPropagation();end()});okb.addEventListener("click",function(e){e.preventDefault();end()});
    api.say(first?"fox_lantern":"photo_all").then(function(){if(!fin&&!api.closed) SB.hand.show(okb,{gesture:"tap"})})}
  api.say("fox_snap");
})}});
})();

