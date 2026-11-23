(function(){
  var files=["app.p0.txt?v=2", "app.p1.txt?v=2", "app.p2.txt", "app.p3a.txt", "app.p3b.txt?v=9", "app.p4.txt?v=8", "app.p5.txt?v=2"];
  var code="";
  for(var i=0;i<files.length;i++){
    var xhr=new XMLHttpRequest();
    xhr.open("GET",files[i],false);
    xhr.send(null);
    if(xhr.status!==200) throw new Error("missing "+files[i]);
    code+=xhr.responseText;
  }
  (0,eval)(code);
})();
