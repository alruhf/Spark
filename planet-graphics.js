(function(){
  var assets={"space-bg.webp":["space-bg.webp.p0.bin","space-bg.webp.p1.bin","space-bg.webp.p2.bin","space-bg.webp.p3.bin","space-bg.webp.p4.bin","space-bg.webp.p5.bin"],"planet-sun.webp":["planet-sun.webp.p0.bin","planet-sun.webp.p1.bin","planet-sun.webp.p2.bin"],"planet-mercury.webp":["planet-mercury.webp.p0.bin","planet-mercury.webp.p1.bin","planet-mercury.webp.p2.bin"],"planet-venus.webp":["planet-venus.webp.p0.bin","planet-venus.webp.p1.bin"],"planet-earth.webp":["planet-earth.webp.p0.bin","planet-earth.webp.p1.bin","planet-earth.webp.p2.bin","planet-earth.webp.p3.bin","planet-earth.webp.p4.bin"],"planet-mars.webp":["planet-mars.webp.p0.bin","planet-mars.webp.p1.bin","planet-mars.webp.p2.bin","planet-mars.webp.p3.bin"],"planet-jupiter.webp":["planet-jupiter.webp.p0.bin","planet-jupiter.webp.p1.bin","planet-jupiter.webp.p2.bin","planet-jupiter.webp.p3.bin"],"planet-saturn.webp":["planet-saturn.webp.p0.bin","planet-saturn.webp.p1.bin","planet-saturn.webp.p2.bin"],"planet-uranus.webp":["planet-uranus.webp.p0.bin","planet-uranus.webp.p1.bin"],"planet-neptune.webp":["planet-neptune.webp.p0.bin","planet-neptune.webp.p1.bin"],"earth-globe.webp":["earth-globe.webp.p0.bin","earth-globe.webp.p1.bin","earth-globe.webp.p2.bin","earth-globe.webp.p3.bin","earth-globe.webp.p4.bin","earth-globe.webp.p5.bin","earth-globe.webp.p6.bin","earth-globe.webp.p7.bin","earth-globe.webp.p8.bin","earth-globe.webp.p9.bin","earth-globe.webp.p10.bin","earth-globe.webp.p11.bin","earth-globe.webp.p12.bin","earth-globe.webp.p13.bin","earth-globe.webp.p14.bin","earth-globe.webp.p15.bin","earth-globe.webp.p16.bin","earth-globe.webp.p17.bin","earth-globe.webp.p18.bin","earth-globe.webp.p19.bin"]};
  function join(files){
    return Promise.all(files.map(function(f){
      return fetch(f).then(function(r){
        if(!r.ok) throw new Error(f);
        return r.arrayBuffer();
      });
    })).then(function(parts){
      return URL.createObjectURL(new Blob(parts,{type:"image/webp"}));
    });
  }
  var rules=[];
  Promise.all(Object.keys(assets).map(function(name){
    return join(assets[name]).then(function(url){
      if(name==="space-bg.webp"){
        rules.push("#home .space{background:radial-gradient(circle at 50% 48%,#ffb44a40 0 8%,transparent 20%),url(\""+url+"\") center/cover no-repeat #02010a !important}");
      }else if(name==="earth-globe.webp"){
        rules.push("#earthMap.earthmap{background:#020914 url(\""+url+"\") center/cover no-repeat !important}");
      }else{
        rules.push("#home ."+name.slice(7,-5)+"{background-image:url(\""+url+"\") !important}");
      }
    });
  })).then(function(){
    var s=document.createElement("style");
    s.appendChild(document.createTextNode(rules.join("\n")));
    document.head.appendChild(s);
  });
})();
