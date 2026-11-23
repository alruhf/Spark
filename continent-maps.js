(() => {
  'use strict';
  // Geographic projection follows Earth's renderer. Texture credit: NASA Blue Marble.
  const radians = Math.PI / 180;
  let texturePromise;
  function texture() {
    if (!texturePromise) texturePromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = 'africa-satellite.jpg';
    });
    return texturePromise;
  }
  window.ContinentMaps = {"North America": {"center": [43, -105], "zoom": 1.22, "regions": [["Arctic", 72, -110, 0], ["Forests", 52, -125, 1], ["Mountains", 41, -112, 2], ["Plains", 45, -98, 3], ["Deserts", 30, -113, 4], ["Wetlands", 26, -81, 5], ["Cities", 41, -74, 6], ["Coasts", 21, -100, 7]]}, "South America": {"center": [-20, -60], "zoom": 1.32, "regions": [["Amazon", -5, -63, 8], ["Andes", -20, -72, 2], ["Grasslands", -36, -62, 3], ["Rivers", -12, -52, 9], ["Wetlands", -20, -56, 5], ["Coasts", -8, -35, 7], ["Cities / Communities", -34, -58, 6]]}, "Europe": {"center": [50, 16], "zoom": 1.9, "regions": [["Cities", 49, 2, 6], ["Countryside", 55, -4, 12], ["Mountains", 46, 10, 2], ["Rivers", 48, 24, 9], ["Coasts", 40, -8, 7], ["Ports", 53, 7, 14], ["Railways", 54, 26, 15], ["Historical Environments", 40, 20, 13]]}, "Asia": {"center": [35, 90], "zoom": 1.16, "regions": [["Himalayas", 29, 86, 16], ["Forests", 58, 105, 1], ["Deserts / Steppes", 45, 67, 17], ["Tropical Environments", 9, 101, 8], ["Rivers", 32, 114, 9], ["Coasts / Islands", 38, 139, 20], ["Farms", 21, 77, 10], ["Major Cities", 42, 118, 6]]}, "Australia": {"center": [-22, 147], "zoom": 1.28, "regions": [["Australian Environments", -32, 120, 18], ["Rainforest", -16, 145, 8], ["Dry Interior", -23, 133, 18], ["Reef", -20, 149, 11], ["Coast", -34, 152, 7], ["New Zealand", -43, 172, 19], ["Pacific Islands", -17, 177, 20]]}, "Antarctica": {"center": [-90, 0], "zoom": 2.0, "regions": [["Ice Shelf", -81, -170, 0], ["Penguin Colony", -66, -64, 21], ["Research Station", -78, 165, 22], ["Glacier", -76, 100, 0], ["Ocean Edge", -67, 25, 0], ["Mountains", -82, 45, 16], ["Expedition Vehicles", -77, -50, 23]]}};
  window.mountContinentMap = (map, name) => {
    const config = window.ContinentMaps[name];
    if (!config) return;
    if (!map || map.dataset.mounted) return;
    map.dataset.mounted = 'true';
    const canvas = map.querySelector('canvas');
    const markers = [...map.querySelectorAll('[data-env]')];
    let yaw = -config.center[1] * radians, pitch = config.center[0] * radians;
    const initialYaw=yaw, initialPitch=pitch;
    let active = false, moved = false, pointer = null, startX = 0, startY = 0;
    let lastX = 0, lastY = 0, downMarker = null, suppressUntil = 0, pending = false;
    let gl, program, image, context2d, observer, pixels, textureWidth, textureHeight;
    /* spark13: full-screen map. Portrait screens narrower than 4:5 zoom out so every pin stays on screen (same size as the old 4:5 phone map). */
    const zoomBase = config.zoom; let zoom = zoomBase;
    const positions = Object.fromEntries(config.regions.map(([name,lat,lon])=>[name,[lat,lon]]));
    const connectors=map.querySelector('svg');
    const lines=markers.map(()=>{const line=document.createElementNS('http://www.w3.org/2000/svg','line');connectors.appendChild(line);return line;});
    function clampView() {
      yaw=Math.max(initialYaw-.38,Math.min(initialYaw+.38,yaw));
      pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,Math.max(initialPitch-.17,Math.min(initialPitch+.17,pitch))));
    }
    const vertex = 'attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a,0.,1.);}';
    const fragment = `precision highp float;
      uniform sampler2D tex;uniform float yaw,pitch,aspect,zoom;varying vec2 v;
      void main(){vec2 p=vec2(v.x*aspect,v.y)/zoom;float r=dot(p,p);
        if(r>1.){gl_FragColor=vec4(.008,.035,.078,1.);return;}
        float z=sqrt(1.-r),cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);
        float y=p.y*cp+z*sp,z1=-p.y*sp+z*cp;
        float x=p.x*cy-z1*sy,z2=p.x*sy+z1*cy;
        float lat=asin(clamp(y,-1.,1.)),lon=atan(x,z2);
        vec3 color=texture2D(tex,vec2(fract(lon/6.28318530718+.5),.5+lat/3.14159265359)).rgb;
        gl_FragColor=vec4(color*(.88+.12*z),1.);}`;
    function shader(type, source) {
      const s = gl.createShader(type);gl.shaderSource(s, source);gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Continent shader');
      return s;
    }
    function boot() {
      gl = canvas.getContext('webgl', {alpha: false, antialias: true});
      if (!gl) {
        context2d = canvas.getContext('2d');
        const surface = document.createElement('canvas');
        textureWidth=surface.width=image.width;textureHeight=surface.height=image.height;
        const context=surface.getContext('2d',{willReadFrequently:true});
        context.drawImage(image,0,0);
        pixels=context.getImageData(0,0,textureWidth,textureHeight).data;
        return;
      }
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Continent projection');
      gl.useProgram(program);
      const buffer = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, 'a');
      gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    function projection(lat, lon, ratio) {
      lat *= radians;lon *= radians;
      const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
      const x1=x*Math.cos(yaw)+z*Math.sin(yaw),z1=-x*Math.sin(yaw)+z*Math.cos(yaw);
      const y1=y*Math.cos(pitch)-z1*Math.sin(pitch);
      return {x: .5+x1*zoom/(2*ratio), y: .5-y1*zoom/2};
    }

    function draw() {
      pending = false;
      if (!map.isConnected) { observer?.disconnect();return; }
      const rect = map.getBoundingClientRect();if (!rect.width || !rect.height) return;
      const ratio = rect.width / rect.height;
      zoom = zoomBase*Math.min(1, ratio/0.8);
      const width = moved && active ? 960 : ratio<1 ? 1080 : Math.max(1920, Math.round(1080 * ratio));
      const height = Math.round(width / ratio);
      if (canvas.width !== width || canvas.height !== height) {canvas.width = width;canvas.height = height;}
      if (image && gl) {
        gl.viewport(0,0,width,height);gl.useProgram(program);
        for (const [name,value] of Object.entries({yaw,pitch,aspect:ratio,zoom})) gl.uniform1f(gl.getUniformLocation(program,name),value);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      } else if (image && context2d) {
        // The same spherical projection at full resolution without WebGL.
        const frame=context2d.createImageData(width,height),data=frame.data;
        const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
        for(let row=0;row<height;row++){
          const y=(1-2*(row+.5)/height)/zoom;
          for(let col=0;col<width;col++){
            const x=(2*(col+.5)/width-1)*ratio/zoom,rr=x*x+y*y,o=(row*width+col)*4;
            if(rr>1){data[o]=2;data[o+1]=9;data[o+2]=20;data[o+3]=255;continue;}
            const z=Math.sqrt(1-rr),y1=y*cp+z*sp,z1=-y*sp+z*cp;
            const x1=x*cy-z1*sy,z2=x*sy+z1*cy;
            const lat=Math.asin(Math.max(-1,Math.min(1,y1))),lon=Math.atan2(x1,z2);
            const tx=Math.min(textureWidth-1,Math.floor((lon/(2*Math.PI)+.5)*textureWidth));
            const ty=Math.min(textureHeight-1,Math.max(0,Math.floor((.5-lat/Math.PI)*textureHeight)));
            const source=(ty*textureWidth+tx)*4,shade=.88+.12*z;
            data[o]=pixels[source]*shade;data[o+1]=pixels[source+1]*shade;data[o+2]=pixels[source+2]*shade;data[o+3]=255;
          }
        }
        context2d.putImageData(frame,0,0);
      }
      // Photo labels remain separate on small screens; leaders retain the geographic anchor.
      const nodes=markers.map(marker=>{
        const p=projection(...positions[marker.dataset.env],ratio),r=marker.getBoundingClientRect();
        /* spark20: phones keep a wider gap. spark22: also use layout size (not a clipped client rect) + min box so the Pacific Islands pin cannot measure as a sliver and get clamped to the map edge */const gp=rect.width<500?24:10;const mw=Math.max(r.width,marker.offsetWidth||0,88),mh=Math.max(r.height,marker.offsetHeight||0,64);return {marker,ax:p.x*rect.width,ay:p.y*rect.height,x:p.x*rect.width,y:p.y*rect.height,w:mw+gp,h:mh+gp};
      });
      const edge=rect.width<500?16:6;const clamp=n=>{n.x=Math.max(n.w/2+edge,Math.min(rect.width-n.w/2-edge,n.x));n.y=Math.max(n.h/2+28,Math.min(rect.height-n.h/2-edge,n.y));};
      for(let iteration=0;iteration<60;iteration++){
        nodes.forEach(clamp);
        for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y;
          const ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);
          if(ox>0&&oy>0){
            if(ox<oy){const shift=(ox+.5)/2*(dx>=0?1:-1);a.x-=shift;b.x+=shift;}
            else{const shift=(oy+.5)/2*(dy>=0?1:-1);a.y-=shift;b.y+=shift;}
          }
        }
      }
      connectors.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
      nodes.forEach((n,i)=>{
        clamp(n);n.marker.style.left=`${n.x/rect.width*100}%`;n.marker.style.top=`${n.y/rect.height*100}%`;
        for(const [key,value] of Object.entries({x1:n.ax,y1:n.ay,x2:n.x,y2:n.y}))lines[i].setAttribute(key,value);
        lines[i].style.display=Math.hypot(n.x-n.ax,n.y-n.ay)>10?'':'none';
      });
    }

    function requestDraw() {if (!pending) {pending=true;requestAnimationFrame(draw);} }
    setTimeout(requestDraw, 250);/* spark22: second layout after pin photos/labels so clamp uses final sizes */
    map.addEventListener('click', event => {
      if (performance.now() < suppressUntil) {event.preventDefault();event.stopPropagation();}
    },true);
    map.addEventListener('pointerdown', event => {
      if (event.pointerType==='mouse' && event.button!==0) return;
      active=true;moved=false;pointer=event.pointerId;
      startX=lastX=event.clientX;startY=lastY=event.clientY;
      downMarker=event.target.closest('[data-env]');
      map.setPointerCapture(pointer);map.classList.add('dragging');event.preventDefault();
    });
    map.addEventListener('pointermove', event => {
      if (!active || event.pointerId!==pointer) return;
      if (!moved && Math.hypot(event.clientX-startX,event.clientY-startY)<8) return;
      moved=true;
      const scale=map.clientHeight*.7;
      yaw+=(event.clientX-lastX)/scale;
      pitch+=(event.clientY-lastY)/scale;clampView();
      lastX=event.clientX;lastY=event.clientY;requestDraw();event.preventDefault();
    });
    function end(event) {
      if (!active || event.pointerId!==pointer) return;
      active=false;map.classList.remove('dragging');
      if (event.type==='pointerup' && !moved) {
        const target=downMarker || markers.find(marker=>{
          const r=marker.getBoundingClientRect();
          return event.clientX>=r.left && event.clientX<=r.right && event.clientY>=r.top && event.clientY<=r.bottom;
        });
        target?.click();
      }
      suppressUntil=performance.now()+400;downMarker=null;requestDraw();
    }
    map.addEventListener('pointerup',end);map.addEventListener('pointercancel',end);
    map.addEventListener('keydown',event=>{
      if (event.target!==map || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      yaw+=(event.key==='ArrowLeft'?-.03:event.key==='ArrowRight'?.03:0);
      pitch+=(event.key==='ArrowUp'?-.025:event.key==='ArrowDown'?.025:0);clampView();
      requestDraw();
    });
    observer=new ResizeObserver(requestDraw);observer.observe(map);
    requestDraw();
    texture().then(value=>{
      if (!map.isConnected) return;
      image=value;
      try {boot();draw();map.dataset.ready='true';}
      catch(error) {map.dataset.ready='error';console.error(error);}
    }).catch(()=>{map.dataset.ready='error';});
  };
})();
