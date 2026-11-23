/* Spark step 1: Spark's four actions + keyword understanding (no Ask panel since 11/15: tap Spark to talk).
   Actions: highlight(place) (glow only, never navigates), pointChallenge(), say(line). The child navigates only by tapping.
   Understanding = keyword matching only (no AI / network): "find", "where's", "where is", "show me", "what can I do",
   plus place names and common misspellings matched against spark-map.js. Look/size/position/animation of the guide are open design choices. */
(function(){
  var M=window.SparkMap,V=window.SparkVoice,H=function(){return window.SparkHere?SparkHere.get():{tab:"home"}};if(!M||!V) return;
  function curCont(){try{return window.EarthEngine&&EarthEngine.getState().continent||null}catch(e){return null}}
  function shown(el){if(!el||!el.isConnected) return false;if(el.closest(".hidden,[hidden]")) return false;var r=el.getBoundingClientRect();return r.width>0&&r.height>0}
  function elFor(e){if(!e||!e.sel) return null;if(e.kind==="region"){if(curCont()!==e.continent) return null;var g=document.getElementById("earthGame");return g&&!g.classList.contains("hidden")?g.querySelector(e.sel):null}return document.querySelector(e.sel)}
  function onWorld(){var w=document.getElementById("world");return !!(w&&w.classList.contains("on"))&&((document.getElementById("worldTitle")||{}).textContent||"").trim()==="Earth"}
  function canNav(){var t=H().tab;return t==="home"||t==="earth"||t==="continent"||t==="planet"}
  var lit=[];
  function glow(el,ms){el.classList.remove("spark-glow");void el.offsetWidth;el.classList.add("spark-glow");lit.push(el);clearTimeout(el.__spkG);el.__spkG=setTimeout(function(){el.classList.remove("spark-glow")},ms||8000);
    try{var r=el.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight) el.scrollIntoView({block:"center",inline:"nearest"})}catch(x){}}
  function clearGlow(){lit.forEach(function(el){el.classList.remove("spark-glow")});lit=[]}
  /* ACTION 1: highlight a place (glow + name-tag pulse). spark11 (Allen 10:23 PM): never navigates - if the place is not on screen,
     the nearest thing on screen that leads to it glows (Earth, then the continent) and Spark says what to tap. */
  function highlight(id,o){var e=M.get(id);if(!e) return null;clearGlow();var el=elFor(e);
    if(shown(el)){glow(el);return {id:e.id,how:"direct"}}
    var ch=M.chain(e);for(var i=ch.length-2;i>=0;i--){var a=elFor(ch[i]);if(shown(a)){glow(a);return {id:ch[i].id,how:"ancestor"}}}return null}
  /* ACTION 4: say a line (always through the one Spark voice module) */
  function say(text,o){return V.say(text,o)}
  function nm(e){return e.spoken||e.name}
  function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
  /* spark11: tap-by-tap directions (the child always navigates by tapping) */
  function directions(e,r){var tab=H().tab,direct=r&&r.how==="direct";
    if(e.kind==="region"){if(direct) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      if(tab==="home") return cap(nm(e))+" is in "+e.continent+", on Earth. Tap Earth, then tap "+e.continent+"!";
      if(tab==="area") return cap(nm(e))+" is in "+e.continent+". Tap Back, then tap "+e.continent+" on Earth!";
      if(tab==="continent"&&curCont()===e.continent) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      return cap(nm(e))+" is in "+e.continent+". Tap "+e.continent+" on Earth!"}
    if(e.kind==="continent"){if(direct) return "Here's "+e.name+"! Tap it to see the green places inside.";
      if(tab==="home") return e.name+" is on Earth. Tap Earth, then tap "+e.name+"!";
      if(tab==="area") return e.name+" is on Earth. Tap Back to get to the map, then tap "+e.name+"!";
      return e.name+" is on Earth. Tap Back to see the whole Earth, then tap "+e.name+"!"}
    if(direct) return "There's "+e.name+"! Tap the glowing planet.";
    return e.id==="earth"?"Tap Back to fly out to space, then tap Earth!":"Tap Back to fly out to space, then look for "+e.name+"!"}
  function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
  /* spark11: tap-by-tap directions (the child always navigates by tapping) */
  function directions(e,r){var tab=H().tab,direct=r&&r.how==="direct";
    if(e.kind==="region"){if(direct) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      if(tab==="home") return cap(nm(e))+" is in "+e.continent+", on Earth. Tap Earth, then tap "+e.continent+"!";
      if(tab==="area") return cap(nm(e))+" is in "+e.continent+". Tap Back, then tap "+e.continent+" on Earth!";
      if(tab==="continent"&&curCont()===e.continent) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      return cap(nm(e))+" is in "+e.continent+". Tap "+e.continent+" on Earth!"}
    if(e.kind==="continent"){if(direct) return "Here's "+e.name+"! Tap it to see the green places inside.";
      if(tab==="home") return e.name+" is on Earth. Tap Earth, then tap "+e.name+"!";
      if(tab==="area") return e.name+" is on Earth. Tap Back to get to the map, then tap "+e.name+"!";
      return e.name+" is on Earth. Tap Back to see the whole Earth, then tap "+e.name+"!"}
    if(direct) return "There's "+e.name+"! Tap the glowing planet.";
    return e.id==="earth"?"Tap Back to fly out to space, then tap Earth!":"Tap Back to fly out to space, then look for "+e.name+"!"}
  function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
  /* spark11: tap-by-tap directions (the child always navigates by tapping) */
  function directions(e,r){var tab=H().tab,direct=r&&r.how==="direct";
    if(e.kind==="region"){if(direct) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      if(tab==="home") return cap(nm(e))+" is in "+e.continent+", on Earth. Tap Earth, then tap "+e.continent+"!";
      if(tab==="area") return cap(nm(e))+" is in "+e.continent+". Tap Back, then tap "+e.continent+" on Earth!";
      if(tab==="continent"&&curCont()===e.continent) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      return cap(nm(e))+" is in "+e.continent+". Tap "+e.continent+" on Earth!"}
    if(e.kind==="continent"){if(direct) return "Here's "+e.name+"! Tap it to see the green places inside.";
      if(tab==="home") return e.name+" is on Earth. Tap Earth, then tap "+e.name+"!";
      if(tab==="area") return e.name+" is on Earth. Tap Back to get to the map, then tap "+e.name+"!";
      return e.name+" is on Earth. Tap Back to see the whole Earth, then tap "+e.name+"!"}
    if(direct) return "There's "+e.name+"! Tap the glowing planet.";
    return e.id==="earth"?"Tap Back to fly out to space, then tap Earth!":"Tap Back to fly out to space, then look for "+e.name+"!"}
  function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
  /* spark11: tap-by-tap directions (the child always navigates by tapping) */
  function directions(e,r){var tab=H().tab,direct=r&&r.how==="direct";
    if(e.kind==="region"){if(direct) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      if(tab==="home") return cap(nm(e))+" is in "+e.continent+", on Earth. Tap Earth, then tap "+e.continent+"!";
      if(tab==="area") return cap(nm(e))+" is in "+e.continent+". Tap Back, then tap "+e.continent+" on Earth!";
      if(tab==="continent"&&curCont()===e.continent) return "Here's "+nm(e)+"! Tap the glowing circle to go in.";
      return cap(nm(e))+" is in "+e.continent+". Tap "+e.continent+" on Earth!"}
    if(e.kind==="continent"){if(direct) return "Here's "+e.name+"! Tap it to see the green places inside.";
      if(tab==="home") return e.name+" is on Earth. Tap Earth, then tap "+e.name+"!";
      if(tab==="area") return e.name+" is on Earth. Tap Back to get to the map, then tap "+e.name+"!";
      return e.name+" is on Earth. Tap Back to see the whole Earth, then tap "+e.name+"!"}
    if(direct) return "There's "+e.name+"! Tap the glowing planet.";
    return e.id==="earth"?"Tap Back to fly out to space, then tap Earth!":"Tap Back to fly out to space, then look for "+e.name+"!"}
  /* ACTION 3: point to a challenge that fits where the child is */
  var asked={};
  function pointChallenge(){var h=H(),here=h.area&&M.get(h.area);
    if(h.tab==="area"&&here&&here.challenges.length){var fin={};(h.finished||[]).forEach(function(k){fin[k]=1});
      var open=here.challenges.filter(function(c){return !fin[here.id+"/"+c.act]});if(!open.length) open=here.challenges;
      var n=asked[here.id]=(asked[here.id]||0)+1;var c=open[(n-1)%open.length];say(c.line,{kind:"challenge",id:here.id+"/"+c.id});return {area:here.id,challenge:c.id}}
    var green=M.playable().filter(function(e){return e.kind==="region"});
    if(h.tab==="home"){highlight("earth",{navigate:false});say("Tap the glowing Earth to start exploring!",{kind:"challenge"});return {area:"earth",challenge:null,point:"earth"}}
    if(h.tab==="continent"){var mine=green.filter(function(e){return e.continent===h.continent});
      if(mine.length){var k=(asked[h.area]=(asked[h.area]||0)+1);var t=mine[(k-1)%mine.length];var rt=highlight(t.id);say(rt&&rt.how==="direct"?"Try "+nm(t)+"! Tap the glowing circle to go in.":"Try "+nm(t)+"! "+directions(t,rt),{kind:"challenge"});return {area:t.id,challenge:null,point:t.id}}}
    var j=(asked.earth=(asked.earth||0)+1);var g=green[(j-1)%green.length];var rg=highlight(g.id);say(rg&&rg.how==="direct"?"Let's visit "+nm(g)+"! Tap the glowing circle to go in.":"Let's visit "+nm(g)+"! "+directions(g,rg),{kind:"challenge"});return {area:g.id,challenge:null,point:g.id}}
  window.SparkActions={highlight:highlight,pointChallenge:pointChallenge,say:say,clear:clearGlow,directions:function(id){var e=M.get(id);return e?directions(e,null):""}};

  /* ---------------- keyword understanding */
  var FIND=/\b(help me find|find|where'?s|where is|where are|take me to|take me|show me|go to|bring me to|looking for)\b/;
  var WHAT=/\b(what can i do|what do i do|what should i do|what should we do|what should we try|what do we do|what can we do|what to do|what now|i'?m bored|i am bored|something to do)\b/;
  var WHEREAMI=/\bwhere am i\b/;
  function lev(a,b){if(Math.abs(a.length-b.length)>2) return 9;var d=[],i,j;for(i=0;i<=a.length;i++){d[i]=[i]}for(j=1;j<=b.length;j++)d[0][j]=j;
    for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
  var STOP={find:1,where:1,show:1,take:1,help:1,there:1,what:1,they:1,this:1,that:1,place:1,please:1,going:1};
  function matchPlace(text){var t=" "+M.norm(text)+" ",best=null,bs=-1,toks=M.norm(text).split(" ");
    M.entries.forEach(function(e){if(e.kind==="grownups") return;var names=[M.norm(e.name)].concat(e.aliases);
      names.forEach(function(a){if(!a) return;var sc=-1;if(t.indexOf(" "+a+" ")>=0) sc=200+a.length;
        else if(a.indexOf(" ")<0&&a.length>=4) toks.forEach(function(w){if(w.length>=4&&!STOP[w]){var d=lev(w,a);if(d<=(a.length>=7?2:1)) sc=Math.max(sc,100+a.length-d*5)}});
        if(sc<0) return;sc+=e.kind==="region"?30:e.kind==="continent"?20:0;if(e.status==="playable") sc+=5;if(sc>bs){bs=sc;best=e}})});return best}
  function hereName(){var h=H();var e=h.area&&M.get(h.area);if(h.tab==="home") return "in space, looking at the planets";if(h.tab==="parent") return "in the grown-ups area";if(e) return (h.tab==="area"?"in ":"on the map of ")+nm(e);return "on Earth"}
  function choices(){var h=H();return M.playable().filter(function(e){return e.kind==="region"&&e.id!==h.area}).slice(0,3)}
  function ask(raw){var text=M.norm(raw),h=H(),res={q:raw,intent:null,target:null,status:null,action:null,choices:null};
    if(!text){res.intent="empty";return res}
    if(WHEREAMI.test(text)){res.intent="where-am-i";say("You're "+hereName()+".",{kind:"answer"});res.action="say";return res}
    if(WHAT.test(text)){res.intent="what";res.action="point-challenge";res.point=(window.SparkActions&&SparkActions.pointChallenge||pointChallenge)();return res}
    var e=matchPlace(text),f=FIND.test(text);
    if(!e){res.intent=f?"find-unknown":"unknown";var cs=choices();res.choices=cs.map(function(x){return x.id});res.action="say";
      say((f?"Which place should we find? ":"Hmm, I'm not sure yet. ")+"I can help you find "+cs.map(function(x){return nm(x)}).join(", ").replace(/, ([^,]*)$/," or $1")+", or ask me what to do.",{kind:"choices"});return res}
    res.intent="find";res.target=e.id;res.status=e.status;
    if(e.status==="locked"){res.action="coming-soon";window.SparkLock&&SparkLock.comingSoon(e,"ask");return res}
    if(h.tab==="area"&&h.area===e.id){res.action="say";say("You're in "+nm(e)+" right now! Ask me what you can do here.",{kind:"answer"});return res}
    if(e.id==="earth"&&(h.tab==="earth"||h.tab==="continent")){res.action="say";say("You're on Earth right now! Look for the green circles.",{kind:"answer"});return res}
    /* spark11 (Allen 10:23 PM): never navigate - glow what is on screen and say what to tap */
    var r=highlight(e.id);res.action="highlight";res.how=r&&r.how;res.lit=r&&r.id;say(directions(e,r),{kind:"answer"});return res}

  /* ---------------- no Ask panel (Allen 11/15 10:20 PM: the Ask Spark box, its mic, chips and heard-words bubble are gone).
     Kids tap Spark / "Ask me" (spark-talk.js listens right away); Spark answers in Ava with its normal caption (spark-voice.js). */
  function run(q){var r=ask(q);window.__sparkAskLast=r;return r}
  /* the 3D areas hide every other <body> child while they are open, so Spark's caption rides inside the open area's root and comes back to <body> after */
  function build(){var leftover=document.getElementById("sparkAskBtn");if(leftover) leftover.remove();
    var qT=0;function place(){qT=0;var drop=document.getElementById("sparkAskBtn");if(drop) drop.remove();
      var roots=[].filter.call(document.body.children,function(c){return c.classList&&c.classList.contains("sbx")&&c.style.display!=="none"});
      var host=roots.length?roots[roots.length-1]:document.body,el=document.getElementById("sparkSay");if(!el) return;
      if(el.parentNode!==host){host.appendChild(el)}if(el.style.display==="none") el.style.display=""}
    try{var mo=new MutationObserver(function(){if(!qT) qT=setTimeout(place,50)});mo.observe(document.body,{childList:true,attributes:true,attributeFilter:["class"]})}catch(e){}place()}
  window.SparkAsk={ask:function(q){return run(q)},understand:function(q){return {place:(matchPlace(q)||{}).id||null,find:FIND.test(M.norm(q)),what:WHAT.test(M.norm(q))}}};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);else build();
})();
