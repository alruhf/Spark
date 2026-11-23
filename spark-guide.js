/* P6C (Allen 10/20): "the way spark is in the artic is the way spark should be in the whole game".
   ONE shared Spark component: markup + blink + replay. Used by the site-wide #sparkCompanion and by arctic3d/a3d.js.
   Talking mouth / swirl speed follow data-state (set by every area as before). Voices are unchanged per area. */
(function(){
  var REPLAY='<svg viewBox="0 0 48 48"><path d="M24 8a16 16 0 1 1-15 10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M6 8v12h12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function markup(src){return '<span class="sg-swirl"></span><span class="sg-swirl b"></span><span class="sg-dots"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="sg-body"><img alt="" draggable="false" src="'+src+'"><i class="sg-lid l"></i><i class="sg-lid r"></i><i class="sg-mouth"></i></span>'}
  function blink(el){(function b(){if(!el.isConnected)return;el.classList.add('blink');setTimeout(function(){el.classList.remove('blink')},170);setTimeout(b,2600+Math.random()*3200)})()}
  /* remember the last thing Spark said (SparkVoice) so the replay button can say it again in the same Ava voice */
  var last=null;
  /* spark12: the last line comes from SparkVoice (every line goes through it) */addEventListener('sparkvoice:line',function(e){var d=e.detail||{};if(d.text&&!d.replay)last={text:d.text,url:d.url||null}});
  function replay(){if(!last||!window.SparkVoice)return false;try{if(last.url)SparkVoice.play(last.url,{text:last.text});else SparkVoice.say(last.text,{kind:'replay'});return true}catch(e){return false}}
  function upgrade(){var c=document.getElementById('sparkCompanion');if(!c||c.classList.contains('sg-guide'))return;
    var st=document.getElementById('sparkStatus');c.classList.add('sg-guide');c.insertAdjacentHTML('afterbegin',markup('spark-guide.webp?v=1'));if(st)c.appendChild(st);blink(c);
    var re=document.createElement('button');re.type='button';re.className='sg-replay';re.id='sparkReplay';re.setAttribute('aria-label','Hear Spark again');re.innerHTML=REPLAY;re.hidden=true;document.body.appendChild(re);
    re.addEventListener('click',function(e){e.stopPropagation();replay()});re.addEventListener('pointerdown',function(e){e.stopPropagation()});/* don't make Spark hop away when the replay button is tapped */
    /* like the Arctic: tap Spark = hear the last line again (Spark's question/mic flow is parked for now). */
    c.addEventListener('click',function(e){var b=document.body.classList;if(window.SparkVoice&&SparkVoice.busy())return;if(!last)return;if(window.underlyingInteractiveAt&&underlyingInteractiveAt(e.clientX,e.clientY))return;e.stopImmediatePropagation();e.preventDefault();replay()},true);
    /* P6D (Tester): taps on Spark stay on Spark - they must not count as taps on the scene behind it (Savannah opened the station) */c.addEventListener('click',function(e){if(window.underlyingInteractiveAt&&underlyingInteractiveAt(e.clientX,e.clientY))return;e.stopPropagation()});['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'].forEach(function(t){c.addEventListener(t,function(e){if(!document.body.classList.contains('spark-safari'))e.stopPropagation()},{passive:true})});
    /* replay sits at Spark's top-left shoulder and follows Spark (left/right flip, hidden when Spark is hidden) */
    function place(){var r=c.getBoundingClientRect(),vis=r.width>0&&getComputedStyle(c).display!=='none'&&getComputedStyle(c).visibility!=='hidden'&&!!last;re.hidden=!vis;if(!vis)return;var z=parseInt(getComputedStyle(c).zIndex,10);re.style.zIndex=isNaN(z)?151:z+1;var s=re.offsetWidth||40;var left=c.classList.contains('spark-left')?r.right-s*.35:r.left-s*.65;re.style.left=Math.max(4,Math.min(innerWidth-s-4,left))+'px';re.style.top=Math.max(4,r.top+4)+'px'}
    /* P6D: keep the whole Spark (incl. the swirl sweep) on the VISIBLE screen, even when a page overflows sideways on phones */
    function keepIn(){var vv=window.visualViewport,W=vv?vv.width:innerWidth,H=vv?vv.height:innerHeight,ox=vv?vv.offsetLeft:0,oy=vv?vv.offsetTop:0;var cur=(c.style.translate||'0px 0px').split(' ').map(parseFloat);var r=c.getBoundingClientRect();if(!r.width)return;var m=Math.max(18,(r.height*.96-r.width)/2+20);var bx=r.left-(cur[0]||0),by=r.top-(cur[1]||0),bw=r.width,bh=r.height;var dx=0,dy=0;if(bx+bw+m>ox+W)dx=ox+W-m-(bx+bw);if(bx+dx-m<ox)dx=ox+m-bx;if(by+bh+16>oy+H)dy=oy+H-16-(by+bh);if(by+dy<oy+8)dy=oy+8-by;var t=Math.round(dx)+'px '+Math.round(dy)+'px';if(c.style.translate!==t)c.style.translate=(dx||dy)?t:''}
    setInterval(function(){keepIn();place()},400);if(window.visualViewport)visualViewport.addEventListener('resize',keepIn);addEventListener('resize',place);place()}
  window.SparkGuide={markup:markup,blink:blink,replay:replay,last:function(){return last&&last.text},upgrade:upgrade,REPLAY:REPLAY};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upgrade);else upgrade();
})();
