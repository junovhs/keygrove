/** Public course instructions, rendered in the app and as crawlable documentation pages. */
import { defineDocs, defineFacts } from 'dopedocs';
export const PRODUCT = 'Relaxed QWERTY';
export const FACTS = defineFacts({
  price: { value: 'free', reviewed: '2026-09-19' },
  storage: { value: 'this browser, or your account when signed in', reviewed: '2026-09-19' },
  account: { value: 'free and optional; it syncs progress across devices', reviewed: '2026-09-19' },
  method: { value: 'Relaxed QWERTY 1.0', reviewed: '2026-09-19' },
});
export const docs = defineDocs({
  entity: { name: PRODUCT, url: 'https://keygrove-phi.vercel.app', legalName: 'Strange Systems', notToBeConfusedWith: ['a keyboard layout', 'a keyboard remapper', 'Dvorak or Colemak'], sameAs: ['https://github.com/junovhs/keygrove'] },
  identity: { name: PRODUCT, version: '0.5.0', channel: 'Early access', maker: { name: 'Strange Systems', href: '#who-makes-this' } },
  title: 'An ordinary keyboard. A gentler approach.',
  lead: 'A complete guided course in making your hands more at home with the keyboard. Accuracy first. Time to settle. Something small to keep along the way.',
  facts: FACTS,
  sections: [
    { id: 'what-it-is', title: 'Your course', question: 'What is RQWERTY?', answer: 'RQWERTY is a free, guided touch-typing course on a standard QWERTY keyboard. Its 36 lessons cover letters, capitals, punctuation, numbers and longer mixed passages, with four optional code lessons.', keywords: ['typing course', 'touch typing', 'relaxed qwerty'], blocks: [
      { kind: 'p', text: 'Start with F, J and Space. We introduce a few new keys, mix them with familiar movements, then use them in fresh text. Continue takes you to what comes next. You do not need to plan a practice session or understand a scoring system.' },
      { kind: 'p', text: 'The seven chapters are Roots, Home, Canopy, Undergrowth, Bark, Rings and Flow. The Course book shows your place and lets you revisit earlier lessons. The optional Code chapter can be enabled in Settings after Bark.' },
      { kind: 'p', text: 'Use a physical QWERTY keyboard. Begin by typing the highlighted character, or press Enter. Spaces count too: the small dot in a passage is a space. A wrong key stays highlighted until you type the right one. There is no countdown. Escape restarts a passage; Tab moves through the interface controls.' },
    ] },
    { id: 'the-method', title: 'The method', question: 'What makes Relaxed QWERTY different?', answer: 'Relaxed QWERTY keeps the usual QWERTY layout and stable finger assignments, while allowing the hands to move. Z uses the left ring finger, X the left middle, C the left index and B the right index.', keywords: ['finger assignment', 'bottom row', 'traditional'], blocks: [
      { kind: 'p', text: 'Find the bumps on F and J with your index fingers. Use them to orient yourself. They are landmarks, not places your fingers must return to after every keystroke. Let the hand move a little toward a reach instead of holding it rigidly in place.' },
      { kind: 'p', text: 'The lower-left assignments follow the physical stagger of an ordinary keyboard: Z ring, X middle, C index. B belongs to the right index finger. For capitals and shifted symbols, use Shift with the opposite hand. Either thumb can press Space.' },
      { kind: 'p', text: 'Already comfortable with traditional touch typing? Choose it at the start or in Settings. Its assignments are Z pinky, X ring, C middle and B left index. The course, progress rules and rewards are the same. Nothing is remapped on your computer.' },
      { kind: 'p', text: 'The app shows finger assignments, but cannot see which fingers you use or whether you look down. Use the guide deliberately, give unfamiliar reaches time, and choose movements that feel comfortable. This is an opinionated teaching method, not a measured ergonomic assessment.' },
    ] },
    { id: 'progress', title: 'How you advance', question: 'How do I finish a lesson?', answer: 'Repeated accurate practice, enough experience with its keys, and a fresh passage complete a lesson. Chapter passages require 97% accuracy. Speed never unlocks or blocks a lesson.', blocks: [
      { kind: 'p', text: 'Early lessons aim for 90% accuracy. The target rises gradually to 96% in Flow. To finish a lesson, your last two attempts must meet its accuracy target, its focus keys need enough accurate practice, and you must use them in the final practice stage. A chapter passage also needs 97% accuracy.' },
      { kind: 'p', text: 'If a particular movement is getting mixed up, Continue can take you through one short practice before returning to the lesson. You can choose the passage instead. After a break, a short warm-up can help you settle back in. Your completed lessons never expire.' },
      { kind: 'p', text: 'Pace is shown in words per minute, using five characters as one word. It is information, not a requirement. Timing within words helps choose useful practice; word boundaries, retries and long interruptions do not count as rhythm evidence. A clean sequence is consecutive correct presses within the current passage, not a daily streak.' },
    ] },
    { id: 'keepsakes', title: 'Things to keep', question: 'How do keepsakes work?', answer: 'Each chapter gives you one permanent illustrated keepsake. It remembers a capability you practised and opens that chapter’s passage for replay.', blocks: [
      { kind: 'p', text: 'A little fir for your first words. A blue cup for Home. Later chapters have their own small discoveries. There are seven keepsakes on the main course and one in the optional Code chapter. Nothing is bought, lost through absence or awarded by chance.' },
      { kind: 'p', text: 'Open Keepsakes to revisit a chapter passage. When you finish, Continue returns to your unfinished course. Finishing Flow completes the course and leaves fresh practice passages and every earlier lesson available. Take the skill into messages, notes and everyday writing; learning does not stop at the last screen.' },
    ] },
    { id: 'your-data', title: 'Your progress', question: 'Where is my progress saved?', answer: `${PRODUCT} stores progress in ${FACTS.storage.value}. An account is ${FACTS.account.value}.`, blocks: [
      { kind: 'p', text: 'Guest progress stays in this browser after you close the tab. A new account carries your current work forward; signing into an existing account opens that account’s course. Your guest copy and signed-in account copy are stored separately. Clearing browser storage can remove a guest save, so export a backup for safekeeping.' },
      { kind: 'p', text: 'Settings has Export and Import for a JSON backup. Import replaces the current course with the backup. Reset clears your current progress and asks twice. When signed in, those changes sync to your account. A guest page makes no request to the account service.' },
    ] },
    { id: 'who-makes-this', title: 'Made with intention', question: 'Who makes RQWERTY?', answer: 'RQWERTY is made by Strange Systems, the studio behind CropASAP and No Ceremony.', blocks: [
      { kind: 'p', text: 'Strange Systems makes small, keyboard-first tools. This one is {fact:price}. One optional account works across the apps. The aim is a capable person at a comfortable keyboard, with a little pleasure in the practice.' },
    ] },
  ],
});
