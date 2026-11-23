/* Ancient Egypt data: Spark's lines (every line has an Ava clip in egypt3d/voice), words, glyphs, districts. */
export const LINE={
 sow_how:'Let\'s plant! Drag your finger across the brown dirt to sow seeds. Follow the green ring!',
 sow_row:'A whole row! You\'re a great farmer!',
 sow_plot:'This field is all planted. Now let\'s give it a drink of water!',
 sow_check:'All planted! Tap the check button to finish.',
 bucket:'Splash! Lift another bucket. You\'re doing great!',
 grow_wait:'Your wheat is growing! While we wait, want to hunt for hidden treasure in the big pyramid? Or bake, stamp or build!',
 grow_sprout:'Look! Little green sprouts. Hooray!',
 golden:'Wow, the wheat is golden! Let\'s harvest it!',
 cut_how:'Tap or sweep across the wheat to cut it. Snip, snip!',
 field_here:'Drag on the glowing green field to plant. You can do it!',field_cut:'Swipe across the golden wheat in the glowing field.',drum_invite:'Ooh, a drum circle! Tap a drum to make music!',
 drum_first:'The Nile is flooding! Tap the field when you are ready to plant.',
 farm_go:'See the glowing sign? Tap it, and let\'s start our farm!',
 farm_next:'See the glowing sign? That\'s our next farm job. Let\'s go!',
 hi:'Hi, friend! Welcome to Ancient Egypt.',
 hi2:'Hello again, Nile builder! I\'m so happy you\'re back. Let\'s have an adventure!',
 drum_flood:'Flood time! The river rises and leaves rich black mud. Plants love it!',
 drum_grow:'Growing time! Tap the field and let\'s sow some wheat.',
 drum_harvest:'Harvest time! Tap the golden wheat to cut it.',
 sow:'Seeds in the mud!',sowall:'All sown! Now let\'s lift water with the shaduf.',
 notgrow:'Not yet! The wheat is still growing.',
 shaduf:'Hold the shaduf lever to lift water. Up it goes!',shafull:'Splash! The fields have water. Now the wheat can grow!',
 shanone:'Let\'s sow some seeds first, then lift water.',
 /* M14k T2/T3: pyramid treasure hunt *//* M14l #3: the temple sanctuary */sanct_hint:'See the big wooden doors at the back of the temple? Walk right up to them and see what happens!',sanct_open:'The doors swing open! This is the sanctuary, the temple\'s secret inner room. Only the priests went in here. Look, a golden boat!',tre_hint:'Psst! Little gold treasures are hidden all over this pyramid. Look for a twinkle, then walk right up to it!',tre_found:'Ooh, treasure! You found one. Can you find more?',tre_all:'You found every treasure in the pyramid! You are a super explorer!',dig_hint:'See the soft sand piles? You can dig here! Walk up to a pile and tap Dig.',dig_found:'Dig, dig, ta-da! You dug up a treasure!',dig_done:'You dug up every treasure in this room. Great digging!',
 cut:'Snip! A bundle of wheat. Nice!',notripe:'Not ready yet! The wheat is still growing.',
 thresh:'Stomp, stomp! The wheat turns into grain. Into the granary it goes!',gran_some:'Your grain is safe in the granary! Let\'s take it to the bakery and grind it into flour.',gran_none:'The granary is empty. Let\'s thresh some wheat to fill it!',nosheaf:'Let\'s cut some wheat first, then bring it here.',
 grind:'Grind, grind! Soft flour!',nograin:'We need grain! Let\'s thresh some wheat.',
 bake:'Into the oven! Mmm, warm bread. Yum! Want to explore the big pyramid next?',noflour:'Let\'s grind some grain into flour first.',
 sold:'Sold! Here are your coins. Great job!',sellmore:'Let\'s make some bread first!',sell5:'Five grain sacks make one coin.',
 stamp:'Someone wants a name scroll! Let\'s stamp it together.',scroll:'A beautiful scroll! Thank you!',
 shop:'Welcome to the market! Look at all the fun things!',need:'Keep saving your coins. You\'ll get there!',inbag:'It is in your backpack! Tap the hammer to build.',
 wear:'You bought it and you are wearing it!',worn:'You are wearing it!',
 build:'Pick a piece, then tap the ground to place it. Let\'s build!',buildhere:'Build here in your town.',blockhere:'Stack blocks on your pyramid site.',
 placed:'There it goes! Looking good!',bagged:'Back in your backpack.',turn:'Turn!',
 empty:'Your backpack has no pieces yet. Let\'s visit the market!',
 donkey:'Hee haw! Your donkey is at the stable. Tap the donkey button to ride.',ride:'Up you go!',off:'Down you get!',
 map:'Where shall we go next? Tap a place!',home:'Home to your town!',
 soon:'This story is coming soon. Let\'s explore somewhere else for now!',soon_hist:'This history place is coming soon!',
 sphinx:'The Sphinx has a lion\'s body and a person\'s head. Wow!',pyramid:'The Great Pyramid took about twenty years to build! Let\'s go inside. I heard there\'s hidden treasure!',
 parent:'Grown-ups panel.',capstone:'A shiny gold capstone on top!',cap_start:'Let\'s pull the gold capstone to the pyramid! Tap Pull, again and again!',cap_pull:'Heave ho! Pull!',cap_lift:'Now the workers lift it up, up, up!',cap_done:'Hooray! The gold capstone is on top. The pyramid is finished!',cap_again:'The gold capstone shines on top of the pyramid!',home_in:'Let\'s go inside your home!',
 migr:'Your desert coins came back to you. Have fun in Egypt!',
 look:'Look closely. You can do it!',again:'Good try! Let\'s try that one again.',
 sign_town:'Your town.',sign_plateau:'Pyramid plateau.',sign_market:'Market square.',sign_scribe:'Scribe school.',sign_joseph:'Joseph\'s granary city.',sign_moses:'Reed marsh.',sign_goshen:'Goshen fields.',sign_holy:'Rest house.'};
export const PRAISE=['Great job!','Wonderful!','You did it!'];
for(let n=1;n<=12;n++)LINE['row'+n]='That row has '+['','one block','two blocks','three blocks','four blocks','five blocks','six blocks','seven blocks','eight blocks','nine blocks','ten blocks','eleven blocks','twelve blocks'][n]+'!';
/* stamp words: pre-reader first letter + distractor, early pick word, reader spells with glyph stamps */
export const WORDS={sun:{L:'s',d:'m'},cat:{L:'c',d:'b'},boat:{L:'b',d:'s'},reed:{L:'r',d:'n'},map:{L:'m',d:'g'},bread:{L:'b',d:'r'},star:{L:'s',d:'c'},nile:{L:'n',d:'b',n:'Nile'},cow:{L:'c',d:'s'},grain:{L:'g',d:'m'}};
for(const w in WORDS){const n=WORDS[w].n||w;WORDS[w].n=n;LINE['pre_'+w]=n+'. Which letter starts '+n+'?';LINE['ear_'+w]='Find the word '+n+'.';LINE['spell_'+w]='Stamp the word '+n+', letter by letter.';LINE['ok_'+w]=n+'! Great stamping!';LINE['hint_'+w]=n+' starts with '+WORDS[w].L+'. Listen: '+n+'.';LINE['say_'+w]=n+'.'}
export const PICW={
 sun:'<circle cx="32" cy="32" r="13" fill="#ffcf3a"/>'+[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return `<path d="M${32+Math.cos(a)*18} ${32+Math.sin(a)*18}L${32+Math.cos(a)*27} ${32+Math.sin(a)*27}" stroke="#ffb000" stroke-width="5" stroke-linecap="round"/>`}).join(''),
 cat:'<ellipse cx="34" cy="44" rx="16" ry="12" fill="#c9a06a"/><circle cx="24" cy="26" r="11" fill="#c9a06a"/><path d="M15 20l-2-12 9 6zM33 20l2-12-9 6z" fill="#c9a06a"/><circle cx="20" cy="25" r="2" fill="#222"/><circle cx="28" cy="25" r="2" fill="#222"/><path d="M50 44q10-4 6-16" stroke="#c9a06a" stroke-width="5" fill="none" stroke-linecap="round"/>',
 boat:'<path d="M6 40h52l-8 12H14z" fill="#9a6a3a"/><path d="M32 8v32" stroke="#6b4422" stroke-width="3"/><path d="M33 10l18 26H33z" fill="#fff8e8"/><path d="M0 56q16-6 32 0t32 0" stroke="#3f8fbf" stroke-width="4" fill="none"/>',
 reed:'<path d="M20 58V14M32 58V8M44 58V16" stroke="#5a8a3a" stroke-width="4"/><ellipse cx="20" cy="12" rx="6" ry="9" fill="#7aa84a"/><ellipse cx="32" cy="6" rx="6" ry="9" fill="#7aa84a"/><ellipse cx="44" cy="14" rx="6" ry="9" fill="#7aa84a"/>',
 map:'<path d="M6 14l16-6 20 6 16-6v42l-16 6-20-6-16 6z" fill="#f4e2c0" stroke="#c0a070" stroke-width="2"/><path d="M14 40q10-20 20-8t16-14" stroke="#3f8fbf" stroke-width="4" fill="none"/><path d="M40 20l6 6M46 20l-6 6" stroke="#c0503a" stroke-width="3"/>',
 bread:'<path d="M8 40c0-16 12-24 24-24s24 8 24 24z" fill="#d99a4a"/><path d="M8 40h48v6H8z" fill="#b8762a"/><path d="M22 26l4 8M32 22l2 10M42 26l-3 8" stroke="#f4d09a" stroke-width="3" stroke-linecap="round"/>',
 star:'<path d="M32 6l7 16 17 2-13 11 4 17-15-9-15 9 4-17L8 24l17-2z" fill="#ffd23a"/>',
 nile:'<path d="M0 20q10-8 20 0t20 0 24 0M0 34q10-8 20 0t20 0 24 0M0 48q10-8 20 0t20 0 24 0" stroke="#3f8fbf" stroke-width="6" fill="none"/>',
 cow:'<ellipse cx="34" cy="38" rx="20" ry="12" fill="#f4efe4"/><ellipse cx="14" cy="30" rx="9" ry="8" fill="#f4efe4"/><circle cx="38" cy="36" r="5" fill="#5a3a22"/><path d="M8 22q-4-6 0-8M20 22q4-6 0-8" stroke="#c0a070" stroke-width="3" fill="none"/><path d="M22 48v10M46 48v10" stroke="#f4efe4" stroke-width="5"/>',
 grain:'<path d="M32 58V18" stroke="#c8962c" stroke-width="3"/>'+[0,1,2,3].map(i=>`<ellipse cx="26" cy="${20+i*9}" rx="4" ry="7" fill="#e8b84a" transform="rotate(-25 26 ${20+i*9})"/><ellipse cx="38" cy="${20+i*9}" rx="4" ry="7" fill="#e8b84a" transform="rotate(25 38 ${20+i*9})"/>`).join('')+'<ellipse cx="32" cy="12" rx="4" ry="7" fill="#e8b84a"/>'};
/* uniliteral glyph pictures (simplified, child-friendly), keyed by English letter */
const G={a:'<path d="M14 46q4-22 22-26l10-8 4 6-6 4q4 14-6 24zM20 46h20" fill="#2a5a8a"/>',b:'<path d="M10 40h36q8 0 8 6H10z" fill="#2a5a8a"/>',c:'<path d="M10 30h44q0 18-22 18T10 30z" fill="#2a5a8a"/><path d="M46 30q6-10 10-2" stroke="#2a5a8a" stroke-width="4" fill="none"/>',
 d:'<path d="M8 36h34q12 0 12 4t-12 4H8z" fill="#2a5a8a"/>',e:'<path d="M30 54V18q0-10 8-12-2 10-4 12v36z" fill="#2a5a8a"/>',g:'<path d="M18 50l6-30h16l6 30z" fill="#2a5a8a"/>',
 i:'<path d="M30 54V18q0-10 8-12-2 10-4 12v36z" fill="#2a5a8a"/>',l:'<ellipse cx="34" cy="36" rx="18" ry="9" fill="#2a5a8a"/><circle cx="14" cy="30" r="7" fill="#2a5a8a"/><path d="M50 34q8-2 6-10" stroke="#2a5a8a" stroke-width="3" fill="none"/>',
 m:'<ellipse cx="32" cy="36" rx="12" ry="16" fill="#2a5a8a"/><circle cx="27" cy="26" r="3" fill="#fff"/><circle cx="37" cy="26" r="3" fill="#fff"/>',n:'<path d="M6 34l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6" stroke="#2a5a8a" stroke-width="5" fill="none"/>',
 o:'<path d="M20 46q-2-16 10-20l6-10 6 4-4 8q6 6 2 18z" fill="#2a5a8a"/>',p:'<rect x="14" y="24" width="36" height="20" rx="3" fill="#2a5a8a"/>',r:'<path d="M8 34q12-12 24-6 12-6 24 6-12 12-24 8-12 4-24-8z" fill="#c0503a"/><path d="M10 34q22 4 44 0" stroke="#7a2a1a" stroke-width="3" fill="none"/>',
 s:'<path d="M20 50V20q0-8 8-8h6v6h-6v32z" fill="#2a5a8a"/>',t:'<path d="M14 44q0-18 18-18t18 18z" fill="#2a5a8a"/>',w:'<path d="M20 46q-2-16 10-20l6-10 6 4-4 8q6 6 2 18z" fill="#2a5a8a"/>',y:'<path d="M22 54V18q0-10 8-12-2 10-4 12v36zM38 54V18q0-10 8-12-2 10-4 12v36z" fill="#2a5a8a"/>'};
export function glyph(ch){const g=G[ch]||G.t;return '<svg viewBox="0 0 64 64" aria-hidden="true">'+g+'</svg>'}
/* M14f #23 (Allen): every stamp shows its REAL letter - the glyph picture with a big readable letter under it (Ss), so kids see glyph -> letter */
export function glyphL(ch){return '<span class="eg3d-gwrap">'+glyph(ch)+'<b class="eg3d-glt">'+ch.toUpperCase()+ch+'</b></span>'}
export const DIST={town:{at:[2,2],n:'Your Town',sign:'sign_town'},plateau:{at:[-2,-56],n:'Pyramids',sign:'sign_plateau'},market:{at:[0,40],n:'Market',sign:'sign_market'},scribe:{at:[18,-26],n:'Scribe School',sign:'sign_scribe'},
 joseph:{at:[-34,44],n:'Joseph',sign:'sign_joseph'},moses:{at:[20,82],n:'Reed Marsh',sign:'sign_moses'},goshen:{at:[-28,82],n:'Goshen',sign:'sign_goshen'},holy:{at:[20,50],n:'Rest House',sign:'sign_holy'},/* T9-3 (Tester): the map lists the Temple, the Palace and your Farm too */temple:{at:[-4,56],n:'Temple',sign:'Temple.'},palace:{at:[-28,22],n:'Palace',sign:'Pharaoh\'s palace.'},farm:{at:[12.5,-1],n:'Your Farm',sign:'Your farm.'}};
