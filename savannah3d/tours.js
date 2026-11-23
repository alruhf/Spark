/* P45 plan item 5: Spark-led tours for the bus visitors. Each species has 6 short facts; R.tourIx[species] moves on after every tour,
   so every bus visit hears a new fact. Lines are Arctic-tone (short, warm, kid words) and every one has a pre-made Ava clip in voice/. */
export const TOUR_FACTS={
 zebra:['Every zebra has its own stripes, just like your fingerprint!','Zebras can sleep standing up!','A baby zebra can stand up just minutes after it is born!','Zebras live in herds and keep watch together.','Zebras talk with barks, snorts and whinnies.','Zebras turn their ears to show how they feel.'],
 elephant:['Elephants use their trunks like a hand and a nose!','Elephants spray water with their trunks to cool down.','Elephants flap their big ears to keep cool.','A baby elephant sometimes sucks its trunk, like a thumb!','Elephants can feel rumbles through their feet!','Elephants are the biggest animals that live on land.'],
 hippo:['A hippo can hold its breath under water for minutes!','Hippos make their own red sunscreen!','Baby hippos can drink milk under water.','Hippos rest in the water by day and eat grass at night.','Hippos can not really swim. They walk on the river bottom!','The name hippo means river horse.']};
export const TOUR_CUE={zebra:'the one with stripes',elephant:'the one with a long trunk',hippo:'the one with a big wide mouth'};
export const TOUR_LINES={tour_ok:'Click! Great photo! The visitors love it.',tour_end:'Thank you for visiting our refuge!'};
['zebra','elephant','hippo'].forEach(s=>{TOUR_LINES['tour_intro_'+s]='Look, everyone! This is our '+s+'.';TOUR_LINES['tour_q_'+s]='Can you tap the '+s+' so the visitors can take a photo?';
  TOUR_LINES['tour_hint_'+s]='Not that one. Find '+TOUR_CUE[s]+'.';TOUR_LINES['tour_self_'+s]='Here it is! Say cheese, '+s+'!';TOUR_FACTS[s].forEach((f,i)=>TOUR_LINES['tour_f_'+s+'_'+i]=f)});
/* line kind -> Spark gesture (s3d.js reads K.GEST) */
export function tourGest(k){return /^tour_f_/.test(k)?'wow':/^tour_intro/.test(k)?'point':/^tour_q|^tour_hint/.test(k)?'think':/^tour_ok|^tour_self/.test(k)?'cheer':/^tour_end/.test(k)?'wave':null}
