/** Small, familiar vocabulary for early transfer; no invented words or unexplained abbreviations. */
export const PRACTICE_WORDS = `a i ed jeff if did kid feed fed fee die died he hi him mid dim give given hive dive vivid hid hide high dig fig egg edge hedge hike keg jig free jeer red due fire refer ride duke reed deer rider fired rid fur reef dude dried led lid lie lied fell feel file fill life leaf safe sail laid said sad lad lads add all dear read real girl held hill had has her he she glad glass grass fish dish shed rush hush gull jar jug rug hug dug big bag bug mug mum my by buy try fry cry run fun turn hurt hunt burn curry hurry furry gruff murmur rhythm church truth thumb gym bunny funny hungry jury ruby cut nut but much high right bright bring low slow sow owl owls wool zoo solo loss wow papa app happy map pop paper it in sit tin ten net tent test tree street time type top pot stop stone note home room door good wood food book look moon soon noon new now how who what when where rain train light night quiet quick queen quiz fox box wax wave zip zebra jump over under the and with you your we our can will this that is are on of to for from be do go get make keep take like write little small green blue brown cup tea cake path garden window`.split(' ');

/** Authored phrases grow naturally as the taught alphabet expands; punctuation is added only when allowed. */
export const PRACTICE_PHRASES: readonly string[] = [
  'i did', 'if i did', 'kid did', 'if jeff did', 'kid fed jeff', 'he did', 'i hid her jug', 'hug her kid', 'kid hugged', 'a huge jug', 'jill has a jug', 'hug a kid', 'a kid hugs jill', 'hi kid; hi jill', 'hi you', 'you hurt it', 'they yell', 'he hid', 'i hid', 'he did dig', 'jeff hid', 'i hike high', 'he fed jeff', 'kid hid', 'dig high',
  'give him five', 'hide him', 'give me five', 'he hid him', 'if he hid', 'give him his mug', 'i met him', 'let him in', 'give her time', 'a little hint',
  'ed fed jeff', 'i fed deer', 'red fur', 'free ride', 'deer feed', 'he hurried', 'her huge rug', 'i heard her', 'he hid here',
  'i feel ill', 'i fed red deer', 'a red leaf', 'a girl held a red leaf', 'he had a glass', 'she reads',
  'his kid is ill', 'jill fills his jug', 'hi jill', 'he likes hills', 'she fell', 'his skill', 'sell his fish', 'i like his jug', 'hush kid',
  'you look ill', 'pull it up', 'jolly good', 'hold my hip', 'look up high', 'you will', 'oh hello', 'hello you', 'my puppy', 'how low', 'who is who', 'we saw owls', 'slow work',
  'move over', 'my mum', 'some milk', 'join us', 'oh no', 'you know him', 'good luck', 'hold on', 'only you', 'look, my phone', 'six of us, plus you', 'no, my box', 'lazy pup.', 'jump in.',
  'the girl held the jar', 'the sky is grey', 'they had tea', 'a little tree', 'the day is still',
  'a quiet day', 'we had tea', 'our house is quiet', 'please read', 'i read; she reads', 'yes/no', 'yes, we can', 'the quiet room is warm', 'we write a short note', 'the red fox jumps over a log',
  // CURR-50: a few phrases so each lesson's headline movement can reach its phrase (mu, ar, in, ce, ca, on, pe, be, ex, ze).
  'mum hid her mug', 'give mum her mug', 'a dark jar', 'dear sir', 'i heard a lark', 'a nice face', 'since the race', 'a thin line', 'in the rain', 'sing in time', 'call the cat', 'a cat in the car', 'i can carry it',
  'on and on', 'only one moon', 'one long song', 'open the paper', 'keep the pen', 'people hope', 'be here', 'the best book', 'be back by then',
  'the next text', 'an extra box', 'next, the box', 'a frozen prize', 'size zero', 'a dozen zebras',
  'bring the blue cup', 'my mum can make tea', 'we can meet by the gate', 'the rain falls on the garden',
  'the quick brown fox jumps over the lazy dog', 'pack my box with five dozen liquor jugs',
  'please leave the book by the window', 'write a little every day', 'take your time and let the words come',
];
/** Hand-picked awkward words and twisters for each finger pair's hard levels: dense in that pair's keys, with same-finger runs. */
export const FINGER_TWISTERS = {
  index: {
    words: ['rhythm', 'truth', 'thumb', 'hymn', 'bunny', 'funny', 'hungry', 'burnt', 'brunt', 'gruff', 'fifth', 'tuft', 'thrust', 'untrue', 'brunch', 'hurtful', 'truthful', 'humbug', 'bygone', 'tryst'],
    lines: ['Hungry bunnies hunt by the hut; truth burns, thumbs hurt.', 'Gruff Ruth brought fifty funny trumpets to brunch.', 'My rhythm: tug, bump, grunt, thump, run.'],
  },
  middle: {
    words: ['decided', 'deduced', 'kicked', 'decade', 'diced', 'iced', 'cede', 'deck', 'decked', 'indeed', 'kicker', 'dike', 'eked', 'cicada', 'decide', 'ceded', 'eddied', 'kiddie'],
    lines: ['Dee decided the kid kicked the deck, indeed.', 'Iced cider, diced dice, a decade decided.', 'Ceded, eked, decked: Eddie kicked it.'],
  },
  ring: {
    words: ['swollen', 'wool', 'slow', 'owls', 'solo', 'sows', 'wallow', 'swallow', 'follow', 'hollow', 'lowly', 'allow', 'woollen', 'loss', 'wills', 'sloop', 'woe', 'swoop'],
    lines: ['Slow owls swallow wool in hollow willows.', 'Follow the lowly sloop, swollen and slow.', 'Wool, woe, swoop, solo: allow no loss.'],
  },
  pinky: {
    words: ['pizza', 'puzzle', 'quiz', 'quip', 'papa', 'pop', 'poppy', 'zap', 'zip', 'apple', 'aqua', 'plaza', 'pizzazz', 'appal', 'quaff', 'papaya', 'zapped', 'quizzes'],
    lines: ['Papa quizzed a puzzled zebra at the plaza.', 'Pizza, papaya, poppy: zap, zip, pop.', 'A quick quip; aqua apples; pizzazz.'],
  },
} as const;

/** Keep the entire phrase intelligible; never drop characters to make a passage fit. */
export function readablePhrases(allowed: ReadonlySet<string>): string[] {
  return PRACTICE_PHRASES.filter(p => [...p].every(k => allowed.has(k))).map(p => {
    const first = allowed.has(p[0]!.toUpperCase()) ? p[0]!.toUpperCase() : p[0]!;
    return first + p.slice(1) + (allowed.has('.') && !/[.!?]$/.test(p) ? '.' : '');
  });
}
