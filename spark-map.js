/* Spark step 1 (Allen 11/12): the ONE shared site map. Spark, the green "playable" rings and the lockout all read this file.
   Opening a new area later = change its status here to "playable" (and give it at least one challenge).
   status: "playable" = built, green ring, opens normally.
           "path"     = not a play area itself, but the way to a playable one (Africa, North America, Australia); opens normally, no green.
           "locked"   = visible exactly as today, no green, does not open; a tap gets Spark's "coming soon" line.
   sel = CSS selector of the element Spark highlights; it is only on screen inside its parent's view.
   challenges (step 2): subject = what Spark may say it is ("story", "math", "reading", "science"); fit = which learning ladder decides the fit
           ("reading" | "math" | "science" | "egypt-stamp"); lv = [lo, hi] ladder levels it suits (0 Explorer, 1 Clue Solver, 2 Investigator,
           3 Systems Analyst; fractions = steps inside a level; egypt-stamp uses its own 0 Pre-reader, 1 Early reader, 2 Reader). Grown-up/Allen tunable.
   open = what "open a tab" does: {planet}, {continent} or {area} (area = SparkAreasLoader / Savannah 3D id). */
(function(){
  var E=[];
  function add(o){o.aliases=o.aliases||[];o.challenges=o.challenges||[];E.push(o);return o}
  /* ---------- planets (home / solar system view) */
  var PL=[["sun","the Sun","Sun",["sun","the sun"]],["mercury","Mercury","Mercury",["mercury","mercurey"]],["venus","Venus","Venus",["venus","venis"]],
    ["earth","Earth","Earth",["earth","erth","eath","the earth","planet earth","world","globe"]],["mars","Mars","Mars",["mars","marz","red planet"]],
    ["jupiter","Jupiter","Jupiter",["jupiter","jupitor","jupiter"]],["saturn","Saturn","Saturn",["saturn","saturne","satern"]],
    ["uranus","Uranus","Uranus",["uranus","uranis"]],["neptune","Neptune","Neptune",["neptune","neptun"]]];
  PL.forEach(function(p){add({id:p[0],kind:"planet",name:p[1],parent:"solar-system",sel:'a.body[data-name="'+p[2]+'"]',open:{planet:p[2]},
    status:p[0]==="earth"?"playable":"locked",near:"earth",aliases:p[3]})});
  /* ---------- continents (Earth globe view, #earthMap .cont[data-c]) */
  var CO=[["africa","Africa","path",["africa","afrika","affrica"]],["north-america","North America","path",["north america","n america","northamerica"]],
    ["south-america","South America","locked",["south america","s america","southamerica"]],["europe","Europe","locked",["europe","urope","eurpoe","europ"]],
    ["asia","Asia","locked",["asia","asha"]],["australia","Australia","path",["australia","austrailia","australa","oceania"]],
    ["antarctica","Antarctica","locked",["antarctica","antartica","antarctic","antartic","south pole"]]];
  var NEAR={"south-america":"savannah",europe:"egypt",asia:"egypt",antarctica:"arctic",africa:"savannah","north-america":"arctic",australia:"reef"};
  CO.forEach(function(c){add({id:c[0],kind:"continent",name:c[1],parent:"earth",sel:'#earthMap .cont[data-c="'+c[1]+'"]',open:{continent:c[1]},status:c[2],near:NEAR[c[0]],aliases:c[3]})});
  /* ---------- regions (continent views; pins come from earth-data.js tree, ids below) */
  var PLAY={
    "Africa/Savannah":{id:"savannah",name:"Savannah",spoken:"the Savannah",open:{area:"savannah"},aliases:["savannah","savanna","savana","savanah","savvanah","safari","the savannah"],
      challenges:[
        {id:"rescue",act:"rescue",subject:"science",fit:"science",lv:[0,2],name:"animal rescue",line:"Be a rescue ranger! Listen for the radio, find the animal that needs help, and drive it to the animal hospital."},
        {id:"read",act:"read",subject:"reading",fit:"reading",lv:[0,1.67],name:"animal cards",line:"Find an animal card and read it with me."},
        {id:"observe",act:"observe",subject:"science",fit:"science",lv:[0,1],name:"animal watching",line:"Watch the animals. Can you spot where they go to drink?"}]},
    "Africa/Sahara":{id:"egypt",name:"Ancient Egypt",open:{area:"sahara"},aliases:["egypt","ancient egypt","egipt","eygpt","egyp","egpyt","egypt's","pyramid","pyramids","sahara","pharaoh","nile"],
      challenges:[
        {id:"moses",act:"moses",subject:"story",fit:"reading",lv:[0,1],name:"Moses coin challenge",line:"Try the Moses coin challenge! Help Moses tell Pharaoh, Let my people go. You earn a coin for every plague you help with."},
        {id:"pyramid",act:"pyramid-rows",subject:"math",fit:"math",lv:[0.5,2],name:"pyramid build",line:"Build a stepped pyramid. Make each row smaller than the one below, then put the capstone on top."},
        {id:"shaduf",act:"shaduf",subject:"science",fit:"science",lv:[0.5,2.5],name:"shaduf",line:"Use the shaduf to lift water from the Nile and water the fields."},
        {id:"stamp",act:"stamp",subject:"reading",fit:"egypt-stamp",lv:[0.5,2],name:"stamp booth",line:"Visit the Scribe School stamp booth and stamp the words."}]},
    "North America/Arctic":{id:"arctic",name:"Arctic",spoken:"the Arctic",open:{area:"arctic"},aliases:["arctic","artic","arctik","arktic","the arctic","north pole","igloo","polar bear"],
      challenges:[
        {id:"igloo",act:"igloo",subject:"math",fit:"math",lv:[0,1.67],name:"igloo build",line:"Build an igloo, one snow block at a time. Count your blocks as you go!"},
        {id:"fish",act:"fish",subject:"math",fit:"math",lv:[0,1],name:"ice fishing",line:"Go ice fishing and count the fish you catch."},
        {id:"sled",act:"sled",subject:"math",fit:"math",lv:[1,3],name:"dog sled",line:"Take the dog sled for a ride across the snow."}]},
    "Australia/Reef":{id:"reef",name:"Reef",spoken:"the Reef",open:{area:"reef"},aliases:["reef","coral reef","coral","reaf","reeef","great barrier reef","barrier reef"],
      challenges:[
        {id:"trash",act:"trash",subject:"science",fit:"science",lv:[0,1],name:"trash pickup",line:"Help clean the reef! Pick up the trash floating in the water so the fish stay safe."},
        {id:"shark-letters",act:"shark-letters",subject:"reading",fit:"reading",lv:[0,3],name:"shark letters",line:"Find the shark and trace its letters."},
        {id:"survey",act:"survey",subject:"math",fit:"math",lv:[1.5,3],name:"fish count",line:"Count the fish on the reef for the reef survey."}]}
  };
  var REG={"Africa":["Savannah","Sahara","Congo Rainforest","Great Rift / Highlands","Rivers / Wetlands","Coast","Towns / Cities"],
    "North America":["Arctic","Forests","Mountains","Plains","Deserts","Wetlands","Cities","Coasts"],
    "South America":["Amazon","Andes","Grasslands","Rivers","Wetlands","Coasts","Cities / Communities"],
    "Europe":["Cities","Countryside","Mountains","Rivers","Coasts","Ports","Railways","Historical Environments"],
    "Asia":["Himalayas","Forests","Deserts / Steppes","Tropical Environments","Rivers","Coasts / Islands","Farms","Major Cities"],
    "Australia":["Australian Environments","Rainforest","Dry Interior","Reef","Coast","New Zealand","Pacific Islands"],
    "Antarctica":["Ice Shelf","Penguin Colony","Research Station","Glacier","Ocean Edge","Mountains","Expedition Vehicles"]};
  function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
  var KIDNAME={"Great Rift / Highlands":"Great Rift","Rivers / Wetlands":"Rivers and Wetlands","Towns / Cities":"Towns and Cities","Congo Rainforest":"Congo Rainforest",
    "Deserts / Steppes":"Deserts and Steppes","Coasts / Islands":"Coasts and Islands","Cities / Communities":"Cities","Australian Environments":"Outback","Historical Environments":"Old Towns"};
  CO.forEach(function(c){var cn=c[1],cid=c[0];(REG[cn]||[]).forEach(function(env){var key=cn+"/"+env,p=PLAY[key];
    var o={kind:"region",parent:cid,continent:cn,env:env,sel:'[data-env="'+env.replace(/"/g,'\\"')+'"]'};
    if(p){o.id=p.id;o.name=p.name;o.status="playable";o.open=p.open;o.aliases=p.aliases;o.challenges=p.challenges;o.spoken=p.spoken}
    else{o.id=cid+"-"+slug(env);o.name=KIDNAME[env]||env;o.status="locked";o.open={continent:cn,env:env};
      var a=[env.toLowerCase()];if(KIDNAME[env]) a.push(KIDNAME[env].toLowerCase());env.split(" / ").forEach(function(x){a.push(x.toLowerCase())});o.aliases=a;o.near=NEAR[cid]}
    add(o)})});
  /* ---------- grown-ups area: not part of kid view, never locked by this map */
  add({id:"parent",kind:"grownups",name:"Grown-ups",parent:null,sel:".sg-btn",open:null,status:"grownups",aliases:[]});
  var BY={};E.forEach(function(e){BY[e.id]=e});
  function norm(s){return String(s||"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim()}
  /* exact lookup (URLs / hashes): id, name or alias */
  function find(v){var n=norm(String(v).replace(/[-_+]/g," "));if(!n) return null;var hit=null;
    E.forEach(function(e){if(hit) return;if(norm(e.id.replace(/-/g," "))===n||norm(e.name)===n||(e.env&&norm(e.env)===n)||e.aliases.indexOf(n)>=0) hit=e});return hit}
  function region(cont,env){for(var i=0;i<E.length;i++){var e=E[i];if(e.kind==="region"&&e.continent===cont&&e.env===env) return e}return null}
  function curCont(){try{return window.EarthEngine&&EarthEngine.getState().continent||null}catch(x){return null}}
  /* which map entry is this on-screen element? */
  function fromElement(el){if(!el||!el.getAttribute) return null;
    if(el.matches("a.body[data-name]")) return find(el.getAttribute("data-name"));
    if(el.hasAttribute("data-c")) return find(el.getAttribute("data-c"));
    if(el.hasAttribute("data-env")){var c=curCont();return c?region(c,el.getAttribute("data-env")):null}return null}
  function playable(){return E.filter(function(e){return e.status==="playable"})}
  function chain(e){var out=[];while(e){out.unshift(e);e=e.parent?BY[e.parent]:null}return out}
  /* nearest green place for a locked one */
  function nearGreen(e){if(!e) return BY.earth;if(e.status==="playable") return e;var n=e.near&&BY[e.near];if(n&&n.status==="playable") return n;
    if(e.kind==="region"){var sib=E.filter(function(x){return x.kind==="region"&&x.parent===e.parent&&x.status==="playable"});if(sib.length) return sib[0]}return BY.earth}
  window.SparkMap={entries:E,byId:BY,get:function(id){return BY[id]||null},find:find,region:region,fromElement:fromElement,playable:playable,chain:chain,nearGreen:nearGreen,norm:norm,
    isLocked:function(e){return !!e&&e.status==="locked"},version:"spark-map-v2"};
})();
