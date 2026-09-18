(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='keygrove.v4',PREV=['keygrove.v3','keygrove.v2'];
const HAND_SRC='assets/hand.svg';
const HAND_POINTS={
 pinky:{x:242,y:320,r:360},
 ring:{x:493,y:170,r:390},
 middle:{x:780,y:92,r:410},
 index:{x:1060,y:205,r:390},
 thumb:{x:1260,y:655,r:360}
};
const LESSONS=[
{id:'home',title:'Home Row',keys:'asdfjkl;',copy:'Plant the anchors. Small motion, even rhythm.',texts:['asdf jkl; asdf jkl;','sad lad; fall ask;','a flask; a sad fall;']},
{id:'reach',title:'Center Reach',keys:'asdfghjkl;',copy:'Add G and H without losing the home-row reset.',texts:['dash flag; glass hall','flash; glad; half;','a glad lass had salad']},
{id:'top',title:'Top Row',keys:'qwertyuiopasdfjkl;',copy:'Reach up, then come straight home.',texts:['type your quiet power','we write pretty poetry','quiet typewriter power']},
{id:'bottom',title:'Bottom Row',keys:'zxcvbnm,asdfjkl;',copy:'Reach down with the same light return.',texts:['calm hands move below','mix calm moves then zoom','a brave fox can move']},
{id:'words',title:'Word Run',keys:'abcdefghijklmnopqrstuvwxyz',copy:'Turn reaches into useful rhythm.',texts:['steady hands make clear words','small habits build quiet speed','accuracy grows before speed']},
{id:'notes',title:'Full Trail',keys:'abcdefghijklmnopqrstuvwxyz,.;',copy:'Natural lines. Calm first, speed second.',texts:['take the long path home, and keep a gentle pace.','small accurate steps turn into useful speed.','good typing feels quiet before it feels fast.']}
];
const FINGERS=[
{id:'lp',anchor:'a',name:'L pinky',full:'Left pinky',keys:'qaz'},
{id:'lr',anchor:'s',name:'L ring',full:'Left ring',keys:'wsx'},
{id:'lm',anchor:'d',name:'L middle',full:'Left middle',keys:'edc'},
{id:'li',anchor:'f',name:'L index',full:'Left index',keys:'rftgvb'},
{id:'ri',anchor:'j',name:'R index',full:'Right index',keys:'yhnujm'},
{id:'rm',anchor:'k',name:'R middle',full:'Right middle',keys:'ik,'},
{id:'rr',anchor:'l',name:'R ring',full:'Right ring',keys:'ol.'},
{id:'rp',anchor:';',name:'R pinky',full:'Right pinky',keys:'p;/'}
];
const fresh=()=>({selected:'home',completed:[],focus:'all',fingerStats:{},stats:{runs:0,chars:0,attempts:0,bestWpm:0,bestAcc:0,xp:0,streak:0,bestCombo:0}});
function clean(x){
 const s=fresh();if(!x||typeof x!=='object')return s;
 s.selected=LESSONS.some(l=>l.id===x.selected)?x.selected:'home';
 s.completed=Array.isArray(x.completed)?[...new Set(x.completed.filter(id=>LESSONS.some(l=>l.id===id)))]:[];
 s.focus=x.focus==='all'||FINGERS.some(f=>f.id===x.focus)?x.focus:'all';
 const q=x.stats||{};for(const k of Object.keys(s.stats))s.stats[k]=Math.max(0,Number(q[k])||0);
 if(x.fingerStats&&typeof x.fingerStats==='object')for(const f of FINGERS){const v=x.fingerStats[f.id];if(v&&typeof v==='object')s.fingerStats[f.id]={runs:Math.max(0,Number(v.runs)||0),hits:Math.max(0,Number(v.hits)||0),attempts:Math.max(0,Number(v.attempts)||0),bestWpm:Math.max(0,Number(v.bestWpm)||0),bestAcc:Math.max(0,Number(v.bestAcc)||0)}}
 return s
}
function load(){try{const current=localStorage.getItem(KEY);if(current)return clean(JSON.parse(current));for(const k of PREV){const v=localStorage.getItem(k);if(v)return clean(JSON.parse(v))}}catch{}return fresh()}
let state=load(),run=null,toastTimer=null;
const handRefs={left:null,right:null};
const lessonIndex=()=>Math.max(0,LESSONS.findIndex(l=>l.id===state.selected));
const lesson=()=>LESSONS[lessonIndex()];
const focus=()=>FINGERS.find(f=>f.id===state.focus)||null;
const unlocked=i=>i===0||state.completed.includes(LESSONS[i-1].id);
function safeSelected(){if(unlocked(lessonIndex()))return;let i=0;while(i+1<LESSONS.length&&unlocked(i+1))i++;state.selected=LESSONS[i].id}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1400)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function fingerForKey(k){if(k===' ')return{full:'Thumbs',id:'thumb',anchor:' '};return FINGERS.find(f=>f.keys.includes(k.toLowerCase()))||null}
function fingerText(f){
 const targets=[...f.keys],parts=[];
 for(const k of targets)parts.push(f.anchor+k+f.anchor);
 for(const k of [...targets].reverse())parts.push(k+f.anchor+k);
 return parts.join(' ')
}
function makeText(){const f=focus();return f?fingerText(f):pick(lesson().texts)}
function resetRun(){
 run={text:makeText(),pos:0,status:'idle',hits:0,attempts:0,errors:0,start:0,combo:0,maxCombo:0,wrong:false,xp:0,nextLesson:null};
 $('arena').classList.remove('result-mode','focus-mode');render()
}
function route(){
 $('route').innerHTML=LESSONS.map((l,i)=>'<i class="'+(i===lessonIndex()?'current':state.completed.includes(l.id)?'done':'')+'"></i>').join('');
 $('lessonNo').textContent='Lesson '+(lessonIndex()+1)+' of '+LESSONS.length
}
function top(){$('xp').textContent=Math.round(state.stats.xp);$('streak').textContent=state.stats.streak;$('bestWpm').textContent=Math.round(state.stats.bestWpm)}
function currentChar(){return run.text[run.pos]??''}
function prompt(){
 const p=$('prompt');p.innerHTML='';
 [...run.text].forEach((c,i)=>{
   const s=document.createElement('span');
   s.textContent=c===' '?'SPACE':c;
   s.className='ch'+(c===' '?' space':'')+(i<run.pos?' done':'')+(i===run.pos?' current':'')+(i===run.pos&&run.wrong?' wrong':'');
   p.appendChild(s)
 })
}
function metrics(){
 const mins=run.start?Math.max(.01,(performance.now()-run.start)/60000):0;
 const w=mins?Math.round((run.hits/5)/mins):0,a=run.attempts?Math.round(run.hits/run.attempts*100):100,p=Math.round(run.pos/run.text.length*100);
 $('wpm').textContent=w;$('acc').textContent=a+'%';$('pct').textContent=p+'%';$('combo').textContent=run.combo;
 if($('progressFill'))$('progressFill').style.width=p+'%';
 return{w,a,p}
}
function focusGrid(){
 $('focusGrid').innerHTML=FINGERS.map(f=>'<button class="focus-key '+(state.focus===f.id?'active':'')+'" data-focus="'+f.id+'"><b>'+escapeHtml(f.anchor.toUpperCase())+'</b>'+escapeHtml(f.name)+'</button>').join('');
 $('focusGrid').querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>chooseFocus(b.dataset.focus))
}
function labels(){
 const f=focus(),l=lesson();
 $('modeLabel').textContent=f?'Finger drill':'Lesson';
 $('lessonTitle').textContent=f?f.full:l.title;
 $('lessonCopy').textContent=f?'Press the highlighted keys with your '+f.full.toLowerCase()+'. Return to '+f.anchor.toUpperCase()+' each time.':l.copy;
 $('focusName').textContent=f?f.full:'All fingers';
 $('focusInstruction').textContent=f?'Use your '+f.full.toLowerCase()+' and return to '+f.anchor.toUpperCase()+'.':'Keep all fingers anchored on the home row.';
 if(run.status==='playing'){$('message').innerHTML='<strong>Typing is live.</strong> Every letter key is typing only.'}
 else{$('message').innerHTML='<strong>Just type</strong> to begin. Enter also starts. Tab opens finger focus.'}
 $('unlockText').textContent=f?'Tab changes or clears finger focus.':'Pass at 80% and the next lesson becomes the next run.'
}
function svgNode(name,attrs){
 const n=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const k of Object.keys(attrs||{}))n.setAttribute(k,attrs[k]);
 return n
}
function installHand(side,svgText){
 const parsed=new DOMParser().parseFromString(svgText,'image/svg+xml');
 if(parsed.querySelector('parsererror'))throw new Error('Invalid hand SVG');
 const svg=document.importNode(parsed.documentElement,true);
 svg.removeAttribute('width');svg.removeAttribute('height');svg.classList.add('vector-hand');svg.setAttribute('focusable','false');svg.setAttribute('aria-hidden','true');
 const byOriginal={};
 svg.querySelectorAll('[id]').forEach(el=>{const original=el.id;byOriginal[original]=el;el.id=original+'-'+side});
 let defs=svg.querySelector('defs');
 if(!defs){defs=svgNode('defs');svg.insertBefore(defs,svg.firstChild)}
 const gradient=svgNode('radialGradient',{id:'kg-hand-gradient-'+side,gradientUnits:'userSpaceOnUse',cx:'724',cy:'543',r:'560'});
 const stopData=[['0%','#efebe7'],['34%','#ece8e3'],['68%','#e9e5df'],['100%','#e7e6e7']];
 const stops=stopData.map(([offset,color])=>{const s=svgNode('stop',{offset,'stop-color':color});gradient.appendChild(s);return s});
 defs.appendChild(gradient);
 const fill=byOriginal.fill,outline=byOriginal['base-outline'];
 if(fill){fill.style.fill='url(#kg-hand-gradient-'+side+')';fill.style.fillOpacity='1'}
 if(outline){outline.style.fill='#817e78';outline.style.fillOpacity='.32'}
 const nails={
   pinky:byOriginal['pinky-nail'],
   ring:byOriginal['ring-nail'],
   middle:byOriginal['middle-nail'],
   index:byOriginal['index-nail'],
   thumb:byOriginal.thumbnail
 };
 Object.values(nails).forEach(n=>{if(n){n.style.fill='#fbf8f3';n.style.fillOpacity='1';n.style.stroke='#d7d2ca';n.style.strokeWidth='2'}})
 const mount=$(side+'HandMount');mount.innerHTML='';mount.appendChild(svg);
 handRefs[side]={svg,gradient,stops,fill,outline,nails};
 paintHand(side,null)
}
function activeKind(side,fingerId){
 if(fingerId==='thumb')return'thumb';
 if(side==='left')return({lp:'pinky',lr:'ring',lm:'middle',li:'index'})[fingerId]||null;
 return({rp:'pinky',rr:'ring',rm:'middle',ri:'index'})[fingerId]||null
}
function paintHand(side,fingerId){
 const ref=handRefs[side];if(!ref)return;
 const kind=activeKind(side,fingerId),active=!!kind;
 const point=kind?HAND_POINTS[kind]:{x:724,y:543,r:560};
 ref.gradient.setAttribute('cx',point.x);ref.gradient.setAttribute('cy',point.y);ref.gradient.setAttribute('r',point.r);
 const colors=active?['#ff5418','#ff8a61','#f1d2c5','#e7e6e7']:['#efebe7','#ece8e3','#e9e5df','#e7e6e7'];
 ref.stops.forEach((s,i)=>s.setAttribute('stop-color',colors[i]));
 Object.keys(ref.nails).forEach(name=>{
   const n=ref.nails[name];if(!n)return;
   const hot=active&&name===kind;
   n.style.fill=hot?'#fff8f3':'#fbf8f3';
   n.style.stroke=hot?'#ff5418':'#d7d2ca';
   n.style.strokeWidth=hot?'5':'2'
 });
 const wrap=$(side+'HandWrap');if(wrap)wrap.classList.toggle('is-hot',active)
}
async function loadHands(){
 try{
   const response=await fetch(HAND_SRC,{cache:'force-cache'});
   if(!response.ok)throw new Error('Could not load hand SVG');
   const text=await response.text();
   installHand('left',text);installHand('right',text);nextVisual()
 }catch{
   ['left','right'].forEach(side=>{const m=$(side+'HandMount');if(m)m.innerHTML='<span style="font:10px var(--mono);color:var(--muted)">HAND SVG</span>'})
 }
}
function nextVisual(){
 document.querySelectorAll('[data-finger-label]').forEach(x=>x.classList.remove('active'));
 const c=currentChar(),f=fingerForKey(c);
 if(c===' '){
   paintHand('left','thumb');paintHand('right','thumb');
   $('handInstruction').innerHTML='<strong>Thumbs</strong> — press SPACEBAR.';
   $('nextCue').innerHTML='<strong>PRESS SPACEBAR</strong> · it will not hurt accuracy until you do'
 }else if(f){
   paintHand('left',f.id);paintHand('right',f.id);
   document.querySelectorAll('[data-finger-label="'+f.id+'"]').forEach(x=>x.classList.add('active'));
   $('handInstruction').innerHTML='<strong>'+escapeHtml(f.full)+'</strong> — press '+escapeHtml(c.toUpperCase())+' and return to '+escapeHtml(f.anchor.toUpperCase())+'.';
   $('nextCue').innerHTML='NEXT · <strong>'+escapeHtml(c.toUpperCase())+'</strong> · '+escapeHtml(f.full)
 }else{
   paintHand('left',null);paintHand('right',null);
   $('handInstruction').innerHTML='<strong>Hands on home row</strong> — follow the highlighted key.';
   $('nextCue').textContent=''
 }
}
function keymap(){
 const c=currentChar().toLowerCase();
 const homes=new Set('asdfjkl;');
 const rows=['qwertyuiop','asdfghjkl;','zxcvbnm,./'];
 $('keymap').innerHTML=rows.map(r=>'<div class="keyrow">'+[...r].map(k=>'<span class="keycap '+(homes.has(k)?'home ':'')+(c===k?'hot':'')+'">'+escapeHtml(k.toUpperCase())+'</span>').join('')+'</div>').join('')+
 '<div class="keyrow"><span class="keycap spacebar '+(c===' '?'hot':'')+'">SPACE</span></div>'
}
function render(){top();route();labels();prompt();metrics();focusGrid();keymap();nextVisual()}
function begin(){
 if(run.status==='playing')return;
 run.status='playing';run.pos=run.hits=run.attempts=run.errors=run.combo=run.maxCombo=0;run.wrong=false;run.start=performance.now();render()
}
function continueAfterResult(firstKey){
 if(run.nextLesson!==null){state.selected=LESSONS[run.nextLesson].id;save()}
 resetRun();begin();if(firstKey!==undefined)typeKey(firstKey)
}
function typeKey(k){
 if(run.status!=='playing'||k.length!==1)return;
 const want=currentChar();
 if(want===' '&&k!==' '){
   run.wrong=true;prompt();nextVisual();$('nextCue').innerHTML='<strong>SPACEBAR</strong> · no accuracy penalty yet';return
 }
 run.attempts++;const ok=k===want;
 if(ok){run.hits++;run.pos++;run.combo++;run.maxCombo=Math.max(run.maxCombo,run.combo);run.wrong=false;if(run.pos===run.text.length)return finish()}
 else{run.errors++;run.combo=0;run.wrong=true}
 prompt();metrics();keymap();nextVisual()
}
function abort(){if(run.status!=='playing')return;toast('Run stopped.');resetRun()}
function fingerStat(id){return state.fingerStats[id]||(state.fingerStats[id]={runs:0,hits:0,attempts:0,bestWpm:0,bestAcc:0})}
function finish(){
 run.status='complete';const m=metrics(),gain=Math.max(5,Math.round(run.hits*(m.a/100))+Math.floor(run.maxCombo/8)*2);run.xp=gain;
 state.stats.runs++;state.stats.chars+=run.hits;state.stats.attempts+=run.attempts;state.stats.xp+=gain;state.stats.bestWpm=Math.max(state.stats.bestWpm,m.w);state.stats.bestAcc=Math.max(state.stats.bestAcc,m.a);state.stats.bestCombo=Math.max(state.stats.bestCombo,run.maxCombo);state.stats.streak=m.a>=90?state.stats.streak+1:0;
 const f=focus();
 if(f){const fs=fingerStat(f.id);fs.runs++;fs.hits+=run.hits;fs.attempts+=run.attempts;fs.bestWpm=Math.max(fs.bestWpm,m.w);fs.bestAcc=Math.max(fs.bestAcc,m.a)}
 else if(m.a>=80){
   if(!state.completed.includes(state.selected))state.completed.push(state.selected);
   const next=lessonIndex()+1;if(next<LESSONS.length&&unlocked(next))run.nextLesson=next
 }
 save();
 const nextName=run.nextLesson!==null?LESSONS[run.nextLesson].title:null;
 $('resultTitle').textContent=m.a===100?'Perfect line.':m.a>=95?'Clean run.':m.a>=85?'Good rhythm.':'Try it slower.';
 $('resultCopy').textContent=f?f.full+' drill complete. Enter repeats it, or Tab changes focus.':m.a>=80?(nextName?'Next up: '+nextName+'. Enter or just start typing.':'Trail complete. Enter or just start typing again.'):'Accuracy stayed below 80%. Enter or just start typing to retry.';
 $('resultWpm').textContent=m.w;$('resultAcc').textContent=m.a+'%';$('resultXp').textContent='+'+gain;$('resultCombo').textContent=run.maxCombo;
 $('arena').classList.add('result-mode');top();route();keymap();nextVisual()
}
function openFocus(){
 if(run.status==='playing'){toast('Reset or finish the run before changing finger focus.');return}
 $('arena').classList.remove('result-mode');$('arena').classList.add('focus-mode');focusGrid()
}
function closeFocus(){$('arena').classList.remove('focus-mode');render()}
function chooseFocus(id){
 state.focus=id;save();resetRun();const f=focus();toast(f?f.full:'All fingers')
}
function handleFocusKey(e){
 if(e.key==='Escape'){e.preventDefault();closeFocus();return true}
 if(e.key===' '){e.preventDefault();chooseFocus('all');return true}
 const f=FINGERS.find(x=>x.anchor===e.key.toLowerCase());if(f){e.preventDefault();chooseFocus(f.id);return true}
 return false
}
function handleIdleOrResult(e){
 if(e.key==='Tab'){e.preventDefault();openFocus();return}
 if(e.key==='Enter'){e.preventDefault();if(run.status==='complete')continueAfterResult();else begin();return}
 if(e.key==='Escape'){e.preventDefault();if(run.status==='complete'){resetRun()}return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key.length===1){
   e.preventDefault();
   if(run.status==='complete')continueAfterResult(e.key);
   else{begin();typeKey(e.key)}
 }
}
document.addEventListener('keydown',e=>{
 if($('settingsModal').classList.contains('open')){if(e.key==='Escape'){$('settingsModal').classList.remove('open');e.preventDefault()}return}
 if($('arena').classList.contains('focus-mode')){handleFocusKey(e);return}
 if(run.status==='playing'){
   if(e.key==='Escape'){e.preventDefault();abort();return}
   if(e.key==='Tab'){e.preventDefault();toast('Finish or reset before changing finger focus.');return}
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   if(e.key.length===1){e.preventDefault();typeKey(e.key)}
   return
 }
 handleIdleOrResult(e)
});
$('prompt').onclick=()=>{if(run.status==='idle')begin()};
$('startBtn').onclick=()=>{if(run.status==='complete')continueAfterResult();else begin()};
$('focusBtn').onclick=()=>openFocus();
$('resetRunBtn').onclick=()=>{if(run.status==='playing')abort();else resetRun()};
$('guideBtn').onclick=()=>{const on=$('handsZone').classList.toggle('guide-strong');$('guideBtn').textContent=on?'Hide finger guide':'View finger guide'};
$('lessonsNav').onclick=()=>{if(run.status==='playing'){toast('Finish or reset the current run first.');return}state.focus='all';save();resetRun();toast('Lesson mode')};
$('statsNav').onclick=()=>toast('Runs '+state.stats.runs+' · Best '+Math.round(state.stats.bestWpm)+' WPM');
$('settingsTopBtn').onclick=()=>$('settingsModal').classList.add('open');
$('settingsBtn').onclick=()=>$('settingsModal').classList.add('open');
$('closeSettings').onclick=()=>$('settingsModal').classList.remove('open');
$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.remove('open')};
$('exportBtn').onclick=()=>{save();const u=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='keygrove-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;state=clean(JSON.parse(await f.text()));safeSelected();save();resetRun();$('settingsModal').classList.remove('open');toast('Progress restored.')}catch{toast('That backup could not be read.')}e.target.value=''};
$('resetBtn').onclick=()=>{if(confirm('Reset all Keygrove progress?')){state=fresh();save();resetRun();$('settingsModal').classList.remove('open');toast('Fresh grove.')}};
setInterval(()=>{if(run?.status==='playing')metrics()},450);
safeSelected();resetRun();save();loadHands();
Object.defineProperty(window,'keygrove',{value:Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({state,run})),lessons:()=>LESSONS.map(x=>({...x})),fingers:()=>FINGERS.map(x=>({...x}))})});
})();