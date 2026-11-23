/* Earth globe (Earth page). spark13 (Allen, Nov 14 call): full-screen, more realistic Earth.
   How it renders (unchanged idea): a real sphere, ray-cast per pixel in a WebGL fragment shader from the equirectangular
   texture earth-map.webp (1536x768, 64 chunks), with procedural drifting clouds. It is NOT a bent 2D picture.
   Why it clipped before: the sphere's radius was exactly half the square canvas, so the globe touched every edge of its box,
   the atmosphere ring (radius 1.028) fell outside the canvas and was never drawn, and the square box (aspect 1:1, wider than
   the screen is tall) pushed the bottom of the globe below the screen.
   Now: the canvas covers the whole screen at the screen's own shape; the globe is a circle sized to fit with room for a
   glowing atmosphere, lit by a sun (soft day/terminator shading, ocean glint, blue limb haze) over a starfield.
   Kept exactly: drag to turn (same feel), tap a continent label or the land itself, labels only on the front side,
   the 2D canvas fallback when WebGL is missing, reduced-motion (no cloud drift). */
(function(){
  var map=document.getElementById('earthMap');
  if(!map) return;
  var CHUNKS=[];
  for(var i=0;i<64;i++) CHUNKS.push('earth-map.webp.p'+i+'.bin');
  var ANCHORS={
    'North America':[40,-98],
    'South America':[-14,-61],
    'Europe':[50,10],
    'Africa':[7,16],
    'Asia':[36,90],
    'Australia':[-25,134],
    'Antarctica':[-74,0]
  };
  /* pt2 (Allen video 0:20 'mention how many continents there are and how many oceans, and educational information about Earth'):
     the five oceans are labelled on the globe like the continents (tap one: Spark says a line about it), and an
     "Earth facts" button cycles kid-friendly facts. Tap only - nothing plays by itself beyond the existing hello. */
  var OCEANS={
    'Pacific Ocean':[[2,-150],[5,165]],
    'Atlantic Ocean':[[8,-35]],
    'Indian Ocean':[[-22,78]],
    'Arctic Ocean':[[76,-30],[78,150]],
    'Southern Ocean':[[-56,-25],[-56,110]]
  };
  var OCEAN_LINE={
    'Pacific Ocean':"The Pacific Ocean! It is the biggest and deepest ocean on Earth.",
    'Atlantic Ocean':"The Atlantic Ocean! It lies between the Americas and Europe and Africa.",
    'Indian Ocean':"The Indian Ocean! It is the warmest ocean on Earth.",
    'Arctic Ocean':"The Arctic Ocean! It is the smallest ocean, and it is very icy.",
    'Southern Ocean':"The Southern Ocean! It goes all the way around Antarctica."
  };
  var FACTS=[
    "Earth has seven continents: North America, South America, Europe, Africa, Asia, Australia and Antarctica.",
    "Earth has five oceans: the Pacific, the Atlantic, the Indian, the Arctic and the Southern Ocean.",
    "Most of Earth is covered by water. That's why it looks blue from space!",
    "The Pacific is the biggest ocean. It is bigger than all the land put together!",
    "Asia is the biggest continent. Australia is the smallest.",
    "Earth spins around once every day. That's why we have day and night.",
    "Earth travels all the way around the Sun once every year.",
    "Antarctica is the coldest place on Earth. It is covered in ice!"
  ];
  var factI=0;
  function teach(text,id){
    var tag=document.getElementById('worldTag'); if(tag) tag.textContent=text;
    if(window.SparkVoice&&typeof SparkVoice.say==='function') SparkVoice.say(text,{kind:'line',id:id});
    try{ if(window.SparkLog) SparkLog('earthfact',{id:id}); }catch(err){}
  }
  var oceanBtns=Object.keys(OCEANS).map(function(n){
    var b=document.createElement('button');b.type='button';b.className='ocean';b.dataset.o=n;b.textContent=n;
    b.style.cssText='position:absolute;z-index:3;transform:translate(-50%,-50%);padding:3px 7px;border:0;border-radius:10px;background:rgba(10,60,120,.55);color:#bfe6ff;font:italic 600 11px system-ui,sans-serif;white-space:nowrap;touch-action:none;display:none;';
    b.addEventListener('click',function(){ teach(OCEAN_LINE[n],'ocean:'+n); });
    map.appendChild(b); return b;
  });
  var factBtn=document.createElement('button');factBtn.type='button';factBtn.className='earth-facts';factBtn.textContent='\u2B50 Earth facts';
  factBtn.setAttribute('aria-label','Earth facts');
  factBtn.style.cssText='position:absolute;z-index:5;right:12px;top:62px;padding:8px 13px;border:2px solid rgba(255,255,255,.85);border-radius:18px;background:#1f8f5a;color:#fff;font:700 14px system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.35);touch-action:none;';
  factBtn.addEventListener('click',function(){ var t=FACTS[factI%FACTS.length]; factI++; teach(t,'earth-fact'); });
  map.appendChild(factBtn);
  var yaw=0.72, pitch=-0.08;
  var canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
  map.insertBefore(canvas, map.firstChild);
  var hint=map.querySelector('h3');
  if(hint){
    hint.textContent='DRAG TO TURN • TAP A CONTINENT';
    hint.style.pointerEvents='none';
  }
  map.style.touchAction='none';
  map.style.cursor='grab';
  var buttons=[].slice.call(map.querySelectorAll('[data-c]'));
  buttons.forEach(function(b){
    b.style.setProperty('z-index','4','important');
    b.style.setProperty('clip-path','none','important');
    b.style.setProperty('width','auto','important');
    b.style.setProperty('height','auto','important');
    b.style.setProperty('transform','translate(-50%,-50%)','important');
    b.style.setProperty('padding','5px 8px','important');
    b.style.setProperty('white-space','nowrap','important');
    b.style.setProperty('font-size','12px','important');
    b.style.touchAction='none';
  });

  /* Globe placement inside the map box (CSS px): centered below the 52 px top bar, radius fits the screen with a margin
     for the atmosphere glow and the labels. */
  var TOP=52;
  function geom(){
    var rect=map.getBoundingClientRect(), w=rect.width, h=rect.height;
    var top=h>TOP*4?TOP:0, avail=h-top;
    var R=Math.max(4,Math.min(w*0.465, avail*0.43));
    return {rect:rect,w:w,h:h,cx:w/2,cy:top+avail/2,R:R};
  }

  function project(latd,lond){
    var lat=latd*Math.PI/180, lon=lond*Math.PI/180;
    var x=Math.cos(lat)*Math.sin(lon), y=Math.sin(lat), z=Math.cos(lat)*Math.cos(lon);
    var cp=Math.cos(pitch), sp=Math.sin(pitch);
    var y1=y*cp-z*sp, z1=y*sp+z*cp, x1=x;
    var cy=Math.cos(yaw), sy=Math.sin(yaw);
    return {x:x1*cy+z1*sy, y:y1, z:-x1*sy+z1*cy};
  }
  function placeLabels(){
    var g=geom();
    if(g.w<8) return;
    factBtn.style.top=(g.h>TOP*4?TOP+10:10)+'px';
    var shown=[];
    oceanBtns.forEach(function(b){
      var best=null;
      OCEANS[b.dataset.o].forEach(function(a){ var p=project(a[0],a[1]); if(p.z>0.3&&(!best||p.z>best.z)) best=p; });
      b.style.display=best?'block':'none';
      if(!best) return;
      var bw=b.offsetWidth||80, bh=b.offsetHeight||20, m=6;
      var x=Math.max(bw/2+m, Math.min(g.w-bw/2-m, g.cx+best.x*g.R)), y=Math.max(TOP+bh/2+m, Math.min(g.h-bh/2-m, g.cy-best.y*g.R));
      b.style.left=(x/g.w*100)+'%'; b.style.top=(y/g.h*100)+'%';
      shown.push([b,x,y,bw,bh]);
    });
    buttons.forEach(function(b){
      var a=ANCHORS[b.dataset.c];
      if(!a) return;
      var p=project(a[0],a[1]);
      var show=p.z>0.16;
      b.style.setProperty('display', show?'block':'none','important');
      b.style.setProperty('pointer-events', show?'auto':'none','important');
      if(!show) return;
      /* keep every label fully on screen (no clipped names at the globe's edge) */
      var bw=b.offsetWidth||90, bh=b.offsetHeight||24, m=6;
      var x=g.cx+p.x*g.R, y=g.cy-p.y*g.R;
      x=Math.max(bw/2+m, Math.min(g.w-bw/2-m, x));
      y=Math.max(TOP+bh/2+m, Math.min(g.h-bh/2-m, y));
      b.style.setProperty('left',(x/g.w*100)+'%','important');
      b.style.setProperty('top',(y/g.h*100)+'%','important');
      shown.forEach(function(o){ if(Math.abs(o[1]-x)<(o[3]+bw)/2+4&&Math.abs(o[2]-y)<(o[4]+bh)/2+4) o[0].style.display='none'; });
    });
  }

  var gl=null, program=null, buf=null, aloc=-1, U={}, ready=false;
  var ctx2=null, tex=null, tw=0, th=0, use2d=false, cloudT=0, bgCleared=false;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var VSRC='attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  var FSRC=[
  '#ifdef GL_FRAGMENT_PRECISION_HIGH','precision highp float;','#else','precision mediump float;','#endif',
  'uniform sampler2D tex;uniform float yaw,pitch,cloud,rad,px;uniform vec2 ctr;',
  'const vec3 SPACE=vec3(0.008,0.035,0.078);const vec3 ATM=vec3(0.36,0.64,1.0);',
  'float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
  'float fbm(vec2 p){float v=0.0;v+=0.50*noise(p);p=p*2.03+vec2(1.7,9.2);v+=0.25*noise(p);p=p*2.03+vec2(1.7,9.2);v+=0.125*noise(p);p=p*2.03+vec2(1.7,9.2);v+=0.0625*noise(p);return v;}',
  'vec3 outside(vec2 v,float rr,vec3 L){',
  '  vec2 cell=floor(gl_FragCoord.xy/(2.0*px));float s=hash(cell*0.731+7.3);',
  '  vec3 col=SPACE+vec3(0.85,0.9,1.0)*step(0.9965,s)*(0.35+0.65*hash(cell+3.1));',
  '  float h=max(rr-1.0,0.0);float glow=exp(-h*16.0);',
  '  float lit=0.45+0.55*clamp(dot(v/max(rr,1e-4),normalize(L.xy))*0.5+0.5,0.0,1.0);',
  '  return mix(col,ATM,clamp(glow*lit*0.85,0.0,1.0));}',
  'void main(){',
  '  vec2 v=(gl_FragCoord.xy-ctr)/rad;float r2=dot(v,v);float rr=sqrt(r2);',
  '  vec3 L=normalize(vec3(-0.42,0.36,0.83));',
  '  if(rr>1.0){gl_FragColor=vec4(outside(v,rr,L),1.0);return;}',
  '  float vz=sqrt(max(1.0-r2,0.0));vec3 n=vec3(v,vz);',
  '  float cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);',
  '  float x1=v.x*cy-vz*sy;float z1=v.x*sy+vz*cy;float y1=v.y;',
  '  float oy=clamp(y1*cp+z1*sp,-1.0,1.0);float ox=x1;float oz=-y1*sp+z1*cp;',
  '  float lat=asin(oy);float lon=atan(ox,oz);float u=fract(lon/6.28318530718+0.5);float tv=0.5+lat/3.14159265359;',
  '  vec3 col=texture2D(tex,vec2(u,tv)).rgb;',
  '  float pw=smoothstep(1.25,1.42,abs(lat));if(pw>0.0){vec3 acc=vec3(0.0);float s2=0.00035*(1.0/max(cos(lat),0.03)-1.0);for(int i=0;i<9;i++){acc+=texture2D(tex,vec2(fract(u+(float(i)-4.0)*s2),tv)).rgb;}col=mix(col,acc/9.0,pw);}',
  '  vec3 cap=vec3(0.0);float tp=lat>0.0?0.988:0.012;for(int i=0;i<12;i++){cap+=texture2D(tex,vec2((float(i)+0.5)/12.0,tp)).rgb;}cap/=12.0;col=mix(col,cap,smoothstep(1.43,1.54,abs(lat)));',
  '  float water=smoothstep(0.03,0.14,col.b-max(col.r,col.g)*0.85);',
  '  float w=fbm(vec2(lon*1.2+cloud,lat*1.4));float nn=fbm(vec2(lon*2.2+cloud+w*1.3,lat*2.5+w*0.5));float puff=smoothstep(0.50,0.72,nn);puff*=smoothstep(1.02,0.40,abs(lat));',
  '  col=mix(col,max(col,vec3(0.96,0.97,1.0)),puff*0.5);',
  '  float d=dot(n,L);float day=smoothstep(-0.30,0.55,d);',
  '  vec3 c=col*(0.40+0.68*day);',
  '  vec3 H=normalize(L+vec3(0.0,0.0,1.0));float spec=pow(max(dot(n,H),0.0),70.0)*0.55*water*(1.0-puff);',
  '  c+=vec3(1.0,0.96,0.86)*spec;',
  '  float fr=pow(1.0-vz,2.2);c=mix(c,ATM*(0.55+0.6*day),clamp(fr*0.6,0.0,1.0));',
  '  float a=smoothstep(1.0,1.0-1.6/rad,rr);',
  '  gl_FragColor=vec4(mix(outside(v,1.0,L),c,a),1.0);',
  '}'].join('\n');
  function shader(type,src){
    var s=gl.createShader(type);
    gl.shaderSource(s,src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) return null;
    return s;
  }
  function bootGL(img){
    var opts={alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false};
    gl=canvas.getContext('webgl2',opts)||canvas.getContext('webgl',opts)||canvas.getContext('experimental-webgl',opts);
    if(!gl) return false;
    var vs=shader(gl.VERTEX_SHADER,VSRC), fs=shader(gl.FRAGMENT_SHADER,FSRC);
    if(!vs||!fs) return false;
    var prog=gl.createProgram();
    gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) return false;
    program=prog;
    gl.useProgram(prog);
    buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    aloc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(aloc);
    gl.vertexAttribPointer(aloc,2,gl.FLOAT,false,0,0);
    ['yaw','pitch','cloud','rad','px','ctr'].forEach(function(k){U[k]=gl.getUniformLocation(prog,k)});
    var t=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.clearColor(0.008,0.035,0.078,1);
    return true;
  }
  function sample(u,v){
    u%=tw; if(u<0) u+=tw;
    if(v<0) v=0; if(v>th-1.001) v=th-1.001;
    var x0=u|0, y0=v|0, x1=(x0+1)%tw, y1=y0+1<th?y0+1:th-1;
    var fx=u-x0, fy=v-y0;
    var i00=(y0*tw+x0)*4, i10=(y0*tw+x1)*4, i01=(y1*tw+x0)*4, i11=(y1*tw+x1)*4;
    var w00=(1-fx)*(1-fy), w10=fx*(1-fy), w01=(1-fx)*fy, w11=fx*fy;
    return [
      tex[i00]*w00+tex[i10]*w10+tex[i01]*w01+tex[i11]*w11,
      tex[i00+1]*w00+tex[i10+1]*w10+tex[i01+1]*w01+tex[i11+1]*w11,
      tex[i00+2]*w00+tex[i10+2]*w10+tex[i01+2]*w01+tex[i11+2]*w11
    ];
  }
  /* 2D fallback (no WebGL): same sphere, sun shading and atmosphere glow, at a capped resolution */
  function draw2d(g){
    if(!ctx2) ctx2=canvas.getContext('2d',{willReadFrequently:true});
    var s=Math.min(1, 720/Math.max(g.w,g.h)), W=Math.max(2,Math.round(g.w*s)), Hh=Math.max(2,Math.round(g.h*s));
    if(canvas.width!==W||canvas.height!==Hh){ canvas.width=W; canvas.height=Hh; }
    var img=ctx2.createImageData(W,Hh), data=img.data, R=g.R*s, cx=g.cx*s, cyy=g.cy*s;
    var cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    var L=[-0.42,0.36,0.83], ll=Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2]); L=[L[0]/ll,L[1]/ll,L[2]/ll];
    for(var j=0;j<Hh;j++){
      var vy=(cyy-j)/R;
      for(var i=0;i<W;i++){
        var vx=(i-cx)/R, r2=vx*vx+vy*vy, o=(j*W+i)*4, c;
        if(r2>1){
          var gl0=Math.exp(-(Math.sqrt(r2)-1)*16)*0.7;
          c=[2+gl0*90,9+gl0*160,20+gl0*235];
        }else{
          var vz=Math.sqrt(1-r2);
          var x1=vx*cy-vz*sy, z1=vx*sy+vz*cy, y1=vy;
          var oy=y1*cp+z1*sp; if(oy>1) oy=1; if(oy<-1) oy=-1;
          var lat=Math.asin(oy), lon=Math.atan2(x1,-y1*sp+z1*cp);
          c=sample((lon/(Math.PI*2)+0.5)*tw,(0.5-lat/Math.PI)*th);
          var d=vx*L[0]+vy*L[1]+vz*L[2], t=Math.max(0,Math.min(1,(d+0.3)/0.85)), day=t*t*(3-2*t), sh=0.40+0.68*day;
          var fr=Math.pow(1-vz,2.2)*0.6;
          c=[c[0]*sh*(1-fr)+92*fr,c[1]*sh*(1-fr)+163*fr,c[2]*sh*(1-fr)+255*fr];
        }
        data[o]=c[0]; data[o+1]=c[1]; data[o+2]=c[2]; data[o+3]=255;
      }
    }
    ctx2.putImageData(img,0,0);
  }
  var pending=false;
  function clearPhoto(){
    if(bgCleared) return;
    bgCleared=true;
    map.style.setProperty('background-image','none','important');
    map.style.setProperty('background-color','#020914','important');
  }
  function renderGlobe(){
    if(!ready) return;
    var g=geom();
    if(g.w<8||g.h<8) return;
    if(!use2d && gl && program){
      var dpr=Math.min(window.devicePixelRatio||1, 2);
      var k=Math.min(dpr, Math.sqrt(2600000/(g.w*g.h)));
      var W=Math.max(2,Math.round(g.w*k)), Hh=Math.max(2,Math.round(g.h*k));
      if(canvas.width!==W||canvas.height!==Hh){ canvas.width=W; canvas.height=Hh; }
      gl.viewport(0,0,W,Hh);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.enableVertexAttribArray(aloc);
      gl.vertexAttribPointer(aloc,2,gl.FLOAT,false,0,0);
      gl.uniform1f(U.yaw,yaw);
      gl.uniform1f(U.pitch,pitch);
      gl.uniform1f(U.cloud,cloudT);
      gl.uniform1f(U.rad,g.R*k);
      gl.uniform1f(U.px,k);
      gl.uniform2f(U.ctr,g.cx*k,Hh-g.cy*k);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }else{
      draw2d(g);
    }
    clearPhoto();
  }
  function draw(){
    pending=false;
    renderGlobe();
    placeLabels();
  }
  function requestDraw(){
    if(pending) return;
    pending=true;
    requestAnimationFrame(draw);
  }
  function loadTex(blob){
    var url=URL.createObjectURL(blob);
    var img=new Image();
    img.onload=function(){
      if(!bootGL(img)){
        if(gl){
          var neu=canvas.cloneNode(false);
          canvas.replaceWith(neu);
          canvas=neu;
          gl=null;
          program=null;
        }
        use2d=true;
        tw=img.naturalWidth; th=img.naturalHeight;
        var c=document.createElement('canvas');
        c.width=tw; c.height=th;
        var g=c.getContext('2d',{willReadFrequently:true});
        g.drawImage(img,0,0);
        tex=g.getImageData(0,0,tw,th).data;
      }
      URL.revokeObjectURL(url);
      ready=true;
      requestDraw();
    };
    img.src=url;
  }
  Promise.all(CHUNKS.map(function(f){
    return fetch(f).then(function(r){ if(!r.ok) throw new Error(f); return r.arrayBuffer(); });
  })).then(function(parts){
    loadTex(new Blob(parts,{type:'image/webp'}));
  }).catch(function(){});
  placeLabels();

  var active=false, moved=false, lx=0, ly=0, pid=null, downBtn=null, blockClick=false;
  map.addEventListener('click', function(e){
    if(blockClick){ e.preventDefault(); e.stopPropagation(); }
  }, true);
  function hitContinent(ev){
    var g=geom();
    if(g.w<8) return null;
    var vx=(ev.clientX-g.rect.left-g.cx)/g.R;
    var vy=-(ev.clientY-g.rect.top-g.cy)/g.R;
    if(vx*vx+vy*vy>1) return null;
    var vz=Math.sqrt(1-vx*vx-vy*vy);
    var cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    var x1=vx*cy-vz*sy, z1=vx*sy+vz*cy, y1=vy;
    var oy=y1*cp+z1*sp; if(oy>1) oy=1; if(oy<-1) oy=-1;
    var ox=x1, oz=-y1*sp+z1*cp;
    var best=null, bestD=0.52;
    buttons.forEach(function(b){
      var a=ANCHORS[b.dataset.c]; if(!a) return;
      var p=project(a[0],a[1]); if(p.z<=0.16) return;
      var la=a[0]*Math.PI/180, lo=a[1]*Math.PI/180;
      var bx=Math.cos(la)*Math.sin(lo), by=Math.sin(la), bz=Math.cos(la)*Math.cos(lo);
      var d=Math.acos(Math.max(-1,Math.min(1, ox*bx+oy*by+oz*bz)));
      if(d<bestD){ bestD=d; best=b; }
    });
    return best;
  }
  map.addEventListener('pointerdown', function(e){
    if(e.pointerType==='mouse' && e.button!==0) return;
    active=true; moved=false; pid=e.pointerId; lx=e.clientX; ly=e.clientY;
    downBtn=(e.target.closest&&e.target.closest('[data-c],[data-o],.earth-facts'))||null;
    try{ map.setPointerCapture(e.pointerId); }catch(err){}
    map.style.cursor='grabbing';
    e.preventDefault();
  }, true);
  map.addEventListener('pointermove', function(e){
    if(!active || e.pointerId!==pid) return;
    var dx=e.clientX-lx, dy=e.clientY-ly;
    if(dx*dx+dy*dy<64 && !moved) return;
    moved=true;
    /* same turn per finger pixel as before: the globe's radius sets the speed */
    var R=geom().R||150;
    yaw+=dx/R;
    pitch+=dy/R;
    if(pitch>1.05) pitch=1.05;
    if(pitch<-1.05) pitch=-1.05;
    lx=e.clientX; ly=e.clientY;
    requestDraw();
    e.preventDefault();
  }, true);
  function end(e){
    if(!active || (e && e.pointerId!==pid && e.type!=='pointercancel')) return;
    active=false;
    map.style.cursor='grab';
    if(!moved){
      var btn=downBtn || (e?hitContinent(e):null);
      if(btn) btn.click();
    }
    downBtn=null;
    blockClick=true;
    setTimeout(function(){ blockClick=false; }, 400);
    requestDraw();
  }
  map.addEventListener('pointerup', end, true);
  map.addEventListener('pointercancel', end, true);
  if(window.ResizeObserver){
    new ResizeObserver(function(){ if(!map.classList.contains('hidden')) requestDraw(); }).observe(map);
  }
  new MutationObserver(function(){ if(!map.classList.contains('hidden')) requestDraw(); }).observe(map,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize', function(){ requestDraw(); });
  var lastT=0;
  function frame(now){
    var hidden=document.hidden||map.classList.contains('hidden');
    if(!reduceMotion && ready && !hidden && !use2d){
      var dt=lastT?Math.min(0.05,(now-lastT)/1000):0.016;
      cloudT+=dt*0.1;
      renderGlobe();
    }
    lastT=now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
