/* Savannah 3D data: animals, reading words (spec §6.6, phase 1 set) and every line Spark says (all pre-made Ava clips, voice/). */
export const ANIMALS={
 elephant:{n:'elephant',L:'e',snd:'eh',dis:'t',feed:1,pet:'splash',rare:3,fact:'Elephants use their trunks like hands.',phrase:'big grey elephant'},
 zebra:{n:'zebra',L:'z',snd:'zzz',dis:'m',feed:1,pet:'brush',rare:2,fact:'Every zebra has its own stripes.',phrase:'a zebra has stripes'},
 giraffe:{n:'giraffe',L:'g',snd:'j',dis:'r',feed:0,rare:3,fact:'Giraffes have the same number of neck bones as you.',phrase:'tall giraffe eats leaves'},
 hippo:{n:'hippo',L:'h',snd:'hhh',dis:'s',feed:0,rare:3,fact:'Hippos stay cool in the water all day.',phrase:'hippo in the mud'},
 warthog:{n:'warthog',L:'w',snd:'wuh',dis:'o',feed:1,rare:2,fact:'Warthogs kneel down to eat grass.',phrase:'warthog with a tail up'},
 bird:{n:'bird',L:'b',snd:'buh',dis:'s',feed:0,rare:2,fact:'Little birds ride on the hippo and clean its skin.',phrase:'a bird on a hippo'}};
export const ORDER=['zebra','hippo','elephant','bird','warthog','giraffe'];
export const SPELL=['bird','hippo','zebra'];/* reader: short names spelled with blocks (only the right letters, shuffled) */
const cap=s=>s[0].toUpperCase()+s.slice(1);
export const LINE={
 hi:'Welcome to Ranger Camp! Let us go see the animals.',hi2:'Hello again, ranger!',
 walkpond:'The watering hole is that way. Everyone comes to drink.',
 shop:'Welcome to the ranger shop!',need:'Keep saving your coins!',bought:'You bought it!',wear:'You bought it, and you are wearing it!',inbag:'It is in your bag. Build with it at your hut!',
 closet_hi:'Tap clothes to put them on!',closet_empty:'Your backpack is empty. Buy clothes at the trader!',worn:'You are wearing it!',took_off:'Off it comes!',
 feed:'Yum! Thank you for the snack.',full:'This one is full and sleepy. Try again later.',pet:'Gentle brushing. It likes that!',splash:'Splash! The elephant splashes back!',
 photo:'Click! What a great photo.',photonew:'A new photo for your book!',desk:'Hello, ranger! Tap a photo to sell it.',ride:'Pick a ride! Tap one to buy it.',rideon:'Off we go! Tap the ride button to hop off.',rideoff:'Back on foot.',desksold:'What a great photo! Here are your coins.',deskempty:'Take photos of animals, then bring them to me.',photodesk:'A new photo! Take it to the ranger desk.',
 book:'Your Animal Book. Name an animal to get its sticker.',sticker:'A new sticker for your book!',
 litter:'Litter picked up! Good ranger, here is a coin.',bin:'Five pieces in the bin. The animals are safer!',binmore:'Pick up more litter, then bring it to the bin.',
 hut:'Your hut! Pick a piece, then tap Place here.',hutempty:'You need hut pieces. Buy them at the trader!',placed:'Ooh, nice!',tall:'Ooh, a tall one!',
 cot:'Time to rest. Good night, savannah.',night:'Look at all the stars!',morning:'Good morning, ranger!',
 parent:'Grown-ups: choose the reading level.',
 hint2:'Try this one.',again:'Try again.',look:'Look at the picture. Try again.',
 rdphrase:'Find the words that match the picture.',
 tricky:'Want trickier words?',
 p0:'Great job!',p1:'You did it!',p2:'Wonderful!',p3:'Yes!',p4:'Super reading!',p5:'Well done, ranger!',p6:'Amazing!',p7:'That is right!'};
for(const k in ANIMALS){const a=ANIMALS[k],N=cap(a.n);
 LINE['meet_'+k]=a.fact;
 LINE['pre_'+k]=k==='giraffe'?'Giraffe. Giraffe starts with g. It sounds like j. Which letter is g?':N+'. '+a.snd+', '+a.n+'. Which letter makes '+a.snd+'?';
 LINE['ear_'+k]='Find the word '+a.n+'.';
 LINE['spell_'+k]='Spell '+a.n+'. Tap the letters in order.';
 LINE['ok_'+k]=N+'! '+a.L.toUpperCase()+', '+a.n+'.';
 LINE['hintp_'+k]='That is '+a.dis+'. '+N+' starts with '+(k==='giraffe'?'g':a.snd)+'.';
 LINE['hinte_'+k]=N+' starts with '+a.L+'. Look for '+a.L+'.';
 LINE['say_'+k]=N+'!';}
export const PRAISE=['p0','p1','p2','p3','p4','p5','p6','p7'];
