(() => {
  'use strict';
  // Geographic projection follows Earth's renderer. Texture credit: NASA Blue Marble.
  const radians = Math.PI / 180;
  /* spark10 fix 7 (Tester 5hhz): the first Africa map stayed dark (pins floating on the background) until the 6.5 MB satellite image had
     downloaded. A 56 KB preview of the same image (africa-satellite-sm.jpg) is fetched with the page and drawn first; the full image
     replaces it as soon as it arrives. Same projection, same lighting - only the texture gets sharper. */
  const textures = {};
  function texture(src) {
    src = src || 'africa-satellite.jpg';
    if (!textures[src]) textures[src] = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    return textures[src];
  }
  texture('africa-satellite-sm.jpg').catch(() => {});
  window.mountAfricaMap = map => {
    if (!map || map.dataset.mounted) return;
    map.dataset.mounted = 'true';
    const canvas = map.querySelector('canvas');
    const markers = [...map.querySelectorAll('[data-env]')];
    let yaw = -20 * radians, pitch = 3 * radians;
    let active = false, moved = false, pointer = null, startX = 0, startY = 0;
    let lastX = 0, lastY = 0, downMarker = null, suppressUntil = 0, pending = false;
    let gl, program, image, context2d, observer, pixels, textureWidth, textureHeight;
    /* spark13: full-screen map. Portrait screens narrower than 4:5 zoom out so every pin stays on screen (same size as the old 4:5 phone map). */
    const zoomBase = 1.28; let zoom = zoomBase;
    const positions = {
      'Savannah': [-14, 30], 'Sahara': [25, 8], 'Congo Rainforest': [-3, 19],
      'Great Rift / Highlands': [4, 39], 'Rivers / Wetlands': [16, 31],
      'Coast': [5, -1], 'Towns / Cities': [-27, 25]
    };
    const vertex = 'attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a,0.,1.);}';
    const fragment = `precision highp float;
      uniform sampler2D tex;uniform float yaw,pitch,aspect,zoom;varying vec2 v;
      void main(){vec2 p=vec2(v.x*aspect,v.y)/zoom;float r=dot(p,p);
        if(r>1.){gl_FragColor=vec4(.008,.035,.078,1.);return;}
        float z=sqrt(1.-r),cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);
        float x=p.x*cy-z*sy,z1=p.x*sy+z*cy;
        float lat=asin(clamp(p.y*cp+z1*sp,-1.,1.)),lon=atan(x,-p.y*sp+z1*cp);
        vec3 color=texture2D(tex,vec2(fract(lon/6.28318530718+.5),.5+lat/3.14159265359)).rgb;
        gl_FragColor=vec4(color*(.88+.12*z),1.);}`;
    function shader(type, source) {
      const s = gl.createShader(type);gl.shaderSource(s, source);gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Africa shader');
      return s;
    }
    function boot() {
      gl = canvas.getContext('webgl', {alpha: false, antialias: true});
      if (!gl) {
        context2d = canvas.getContext('2d');
        uploaded = image;
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
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Africa projection');
      gl.useProgram(program);
      const buffer = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, 'a');
      gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      uploaded = image;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    let uploaded = null, booted = false;
    // swap in a sharper texture (preview -> full) without rebuilding the program
    function upload(next) {
      image = next;
      if (!booted) { boot(); booted = true; return; }
      if (uploaded === next) return;
      if (gl) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, next); uploaded = next; }
      else if (context2d) {
        const surface = document.createElement('canvas');
        textureWidth=surface.width=next.width;textureHeight=surface.height=next.height;
        const context=surface.getContext('2d',{willReadFrequently:true});context.drawImage(next,0,0);
        pixels=context.getImageData(0,0,textureWidth,textureHeight).data;uploaded = next;
      }
    }
    function projection(lat, lon, ratio) {
      lat *= radians;lon *= radians;
      const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
      const y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
      const z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
      return {x: .5 + (x*Math.cos(yaw)+z1*Math.sin(yaw))*zoom/(2*ratio), y: .5-y1*zoom/2};
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
            const z=Math.sqrt(1-rr),x1=x*cy-z*sy,z1=x*sy+z*cy;
            const lat=Math.asin(Math.max(-1,Math.min(1,y*cp+z1*sp))),lon=Math.atan2(x1,-y*sp+z1*cp);
            const tx=Math.min(textureWidth-1,Math.floor((lon/(2*Math.PI)+.5)*textureWidth));
            const ty=Math.min(textureHeight-1,Math.max(0,Math.floor((.5-lat/Math.PI)*textureHeight)));
            const source=(ty*textureWidth+tx)*4,shade=.88+.12*z;
            data[o]=pixels[source]*shade;data[o+1]=pixels[source+1]*shade;data[o+2]=pixels[source+2]*shade;data[o+3]=255;
          }
        }
        context2d.putImageData(frame,0,0);
      }
      markers.forEach(marker => {
        const point = positions[marker.dataset.env];
        const p = projection(...point,ratio);
        marker.style.left = `${p.x*100}%`;marker.style.top = `${p.y*100}%`;
      });
    }
    function requestDraw() {if (!pending) {pending=true;requestAnimationFrame(draw);} }
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
      yaw=Math.max(-.65,Math.min(-.08,yaw+(event.clientX-lastX)/scale));
      pitch=Math.max(-.13,Math.min(.17,pitch+(event.clientY-lastY)/scale));
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
      yaw=Math.max(-.65,Math.min(-.08,yaw+(event.key==='ArrowLeft'?-.03:event.key==='ArrowRight'?.03:0)));
      pitch=Math.max(-.13,Math.min(.17,pitch+(event.key==='ArrowUp'?-.025:event.key==='ArrowDown'?.025:0)));
      requestDraw();
    });
    observer=new ResizeObserver(requestDraw);observer.observe(map);
    requestDraw();
    let full = false;
    texture('africa-satellite-sm.jpg').then(value=>{
      if (!map.isConnected || full) return;
      try {upload(value);draw();map.dataset.ready='preview';}
      catch(error) {console.error(error);}
    }).catch(()=>{});
    texture().then(value=>{
      if (!map.isConnected) return;
      full = true;
      try {upload(value);draw();map.dataset.ready='true';}
      catch(error) {map.dataset.ready='error';console.error(error);}
    }).catch(()=>{if (map.dataset.ready!=='preview') map.dataset.ready='error';});
  };
})();
