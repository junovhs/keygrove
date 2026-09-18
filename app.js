(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='keygrove.v3',OLD='keygrove.v2';
const LESSONS=[
{id:'home',title:'Home Row',keys:'asdfjkl;',copy:'Plant the anchors. Small motion, even rhythm.',texts:['asdf jkl; asdf jkl;','sad lad; fall ask;','a flask; a sad fall;']},
{id:'reach',title:'Center Reach',keys:'asdfghjkl;',copy:'Add g and h without losing the home-row reset.',texts:['dash flag; glass hall','flash; glad; half;','a glad lass had salad']},
{id:'top',title:'Top Row',keys:'qwertyuiopasdfjkl;',copy:'Reach up, then come straight home.',texts:['type your quiet power','we write pretty poetry','quiet typewriter power']},
{id:'bottom',title:'Bottom Row',keys:'zxcvbnm,asdfjkl;',copy:'Reach down with the same light return.',texts:['calm hands move below','mix calm moves then zoom','a brave fox can move']},
{id:'words',title:'Word Run',keys:'abcdefghijklmnopqrstuvwxyz',copy:'Turn reaches into useful rhythm.',texts:['steady hands make clear words','small habits build quiet speed','accuracy grows before speed']},
{id:'notes',title:'Full Trail',keys:'abcdefghijklmnopqrstuvwxyz,.;',copy:'Natural lines. Calm first, speed second.',texts:['take the long path home, and keep a gentle pace.','small accurate steps turn into useful speed.','good typing feels quiet before it feels fast.']}
];
const FINGERS=[
{id:'lp',anchor:'a',name:'L pinky',full:'Left pinky',keys:'qaz',side:'left'},
{id:'lr',anchor:'s',name:'L ring',full:'Left ring',keys:'wsx',side:'left'},
{id:'lm',anchor:'d',name:'L middle',full:'Left middle',keys:'edc',side:'left'},
{id:'li',anchor:'f',name:'L index',full:'Left index',keys:'rftgvb',side:'left'},
{id:'ri',anchor:'j',name:'R index',full:'Right index',keys:'yhnujm',side:'right'},
{id:'rm',anchor:'k',name:'R middle',full:'Right middle',keys:'ik,',side:'right'},
{id:'rr',anchor:'l',name:'R ring',full:'Right ring',keys:'ol.',side:'right'},
{id:'rp',anchor:';',name:'R pinky',full:'Right pinky',keys:'p;/',side:'right'}
];
const fresh=()=>({selected:'home',completed:[],focus:'all',fingerStats:{},stats:{runs:0,chars:0,attempts:0,bestWpm:0,bestAcc:0,xp:0,streak:0,bestCombo:0}});
function clean(x){
 const s=fresh(); if(!x||typeof x!=='object') return s;
 s.selected=LESSONS.some(l=>l.id===x.selected)?x.selected:'home';
 s.completed=Array.isArray(x.completed)?[...new Set(x.completed.filter(id=>LESSONS.some(l=>l.id===id)))]:[];
 s.focus=x.focus==='all'||FINGERS.some(f=>f.id===x.focus)?x.focus:'all';
 const q=x.stats||{}; for(const k of Object.keys(s.stats)) s.stats[k]=Math.max(0,Number(q[k])||0);
 if(x.fingerStats&&typeof x.fingerStats==='object') for(const f of FINGERS){const v=x.fingerStats[f.id];if(v&&typeof v==='object')s.fingerStats[f.id]={runs:Math.max(0,Number(v.runs)||0),hits:Math.max(0,Number(v.hits)||0),attempts:Math.max(0,Number(v.attempts)||0),bestWpm:Math.max(0,Number(v.bestWpm)||0),bestAcc:Math.max(0,Number(v.bestAcc)||0)}}
 return s
}
function load(){try{const v=localStorage.getItem(KEY);if(v)return clean(JSON.parse(v));const old=localStorage.getItem(OLD);return old?clean(JSON.parse(old)):fresh()}catch{return fresh()}}
let state=load(),run=null,toastTimer=null;
const lessonIndex=()=>Math.max(0,LESSONS.findIndex(l=>l.id===state.selected));
const lesson=()=>LESSONS[lessonIndex()];
const focus=()=>FINGERS.find(f=>f.id===state.focus)||null;
const unlocked=i=>i===0||state.completed.includes(LESSONS[i-1].id);
function safeSelected(){if(unlocked(lessonIndex()))return;let i=0;while(i+1<LESSONS.length&&unlocked(i+1))i++;state.selected=LESSONS[i].id}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1500)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function fingerText(f){
 const home=f.anchor,support=f.side==='left'?'j':'f',targets=[...f.keys].filter(k=>k!==home);
 const out=[];
 targets.forEach(k=>out.push(home+k+home,support));
 [...targets].reverse().forEach(k=>out.push(k+home+k,support));
 return out.join(' ');
}
function makeText(){const f=focus();return f?fingerText(f):pick(lesson().texts)}
function resetRun(){run={text:makeText(),pos:0,status:'idle',hits:0,attempts:0,errors:0,start:0,combo:0,maxCombo:0,wrong:false,xp:0};$('capture').value='';$('arena').classList.remove('result-mode');render()}
function route(){
 $('route').innerHTML=LESSONS.map((l,i)=>'<i class="'+(i===lessonIndex()?'current':state.completed.includes(l.id)?'done':'')+'"></i>').join('');
 $('lessonNo').textContent=String(lessonIndex()+1).padStart(2,'0')+' / '+String(LESSONS.length).padStart(2,'0')
}
function top(){
 $('xp').textContent=Math.round(state.stats.xp);
 $('streak').textContent=state.stats.streak;
 $('bestWpm').textContent=Math.round(state.stats.bestWpm)
}
function prompt(){
 const p=$('prompt');p.innerHTML='';
 [...run.text].forEach((c,i)=>{const s=document.createElement('span');s.textContent=c;s.className='ch'+(i<run.pos?' done':'')+(i===run.pos?' current':'')+(i===run.pos&&run.wrong?' wrong':'');p.appendChild(s)})
}
function metrics(){
 const mins=run.start?Math.max(.01,(performance.now()-run.start)/60000):0;
 const w=mins?Math.round((run.hits/5)/mins):0;
 const a=run.attempts?Math.round(run.hits/run.attempts*100):100;
 const p=Math.round(run.pos/run.text.length*100);
 $('wpm').textContent=w;$('acc').textContent=a+'%';$('pct').textContent=p+'%';$('combo').textContent=run.combo;
 return{w,a,p}
}
function fingerbar(){
 const parts=[{id:'all',anchor:'SPC',name:'All',full:'All fingers'},...FINGERS];
 $('fingerbar').innerHTML=parts.map(f=>'<button class="finger '+(f.id==='all'?'all ':'')+(state.focus===f.id?'active':'')+'" data-focus="'+f.id+'"><b>'+escapeHtml(f.anchor.toUpperCase())+'</b><small>'+escapeHtml(f.name)+'</small></button>').join('');
 $('fingerbar').querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>setFocus(b.dataset.focus))
}
function keymap(){
 const hot=new Set(focus()?focus().keys:lesson().keys);
 const homes=new Set('asdfjkl;');
 $('keymap').innerHTML=['qwertyuiop','asdfghjkl;','zxcvbnm,./'].map(r=>'<div class="keyrow">'+[...r].map(k=>'<span class="keycap '+(homes.has(k)?'home ':'')+(hot.has(k)?'hot':'')+'">'+escapeHtml(k)+'</span>').join('')+'</div>').join('')
}
function labels(){
 const f=focus(),l=lesson();
 $('modeLabel').textContent=f?'Finger run':'Trail run';
 $('lessonTitle').textContent=f?f.full:l.title;
 $('lessonCopy').textContent=f?'Isolate '+f.keys.toUpperCase().split('').join(' · ')+' and return to '+f.anchor.toUpperCase()+' between reaches.':l.copy;
 $('focusName').textContent=f?f.full:'All fingers';
 if(run.status==='playing'){$('message').innerHTML='<strong>LIVE</strong> Type the line. Esc stops the run.'}
 else if(f){$('message').innerHTML='<strong>'+f.anchor.toUpperCase()+'</strong> selected · Enter starts a '+f.full.toLowerCase()+' drill.'}
 else{$('message').innerHTML='<strong>Enter</strong> to start. G/H changes lesson. Home-row anchors choose a finger.'}
 $('unlockText').textContent=f?'Finger runs build XP without moving the trail.':'80% accuracy unlocks the next run.'
}
function render(){top();route();labels();prompt();metrics();fingerbar();keymap()}
function start(){
 if(run.status==='playing')return;
 if(run.status==='complete')resetRun();
 run.status='playing';run.pos=run.hits=run.attempts=run.errors=run.combo=run.maxCombo=0;run.wrong=false;run.start=performance.now();
 render();$('capture').focus({preventScroll:true})
}
function typeKey(k){
 if(run.status!=='playing'||k.length!==1)return;
 const want=run.text[run.pos],ok=k===want;run.attempts++;
 if(ok){run.hits++;run.pos++;run.combo++;run.maxCombo=Math.max(run.maxCombo,run.combo);run.wrong=false;if(run.pos===run.text.length)return finish()}
 else{run.errors++;run.combo=0;run.wrong=true}
 prompt();metrics()
}
function abort(){
 if(run.status!=='playing')return;
 run.status='idle';run.start=0;run.combo=0;run.wrong=false;
 toast('Run stopped. Enter restarts.');resetRun()
}
function fingerStat(id){return state.fingerStats[id]||(state.fingerStats[id]={runs:0,hits:0,attempts:0,bestWpm:0,bestAcc:0})}
function finish(){
 run.status='complete';const m=metrics();
 const gain=Math.max(5,Math.round(run.hits*(m.a/100))+Math.floor(run.maxCombo/8)*2);run.xp=gain;
 state.stats.runs++;state.stats.chars+=run.hits;state.stats.attempts+=run.attempts;state.stats.xp+=gain;
 state.stats.bestWpm=Math.max(state.stats.bestWpm,m.w);state.stats.bestAcc=Math.max(state.stats.bestAcc,m.a);state.stats.bestCombo=Math.max(state.stats.bestCombo,run.maxCombo);
 state.stats.streak=m.a>=90?state.stats.streak+1:0;
 const f=focus();
 if(f){const fs=fingerStat(f.id);fs.runs++;fs.hits+=run.hits;fs.attempts+=run.attempts;fs.bestWpm=Math.max(fs.bestWpm,m.w);fs.bestAcc=Math.max(fs.bestAcc,m.a)}
 else if(m.a>=80&&!state.completed.includes(state.selected)){state.completed.push(state.selected);const i=lessonIndex();if(i<LESSONS.length-1)toast(LESSONS[i+1].title+' unlocked')}
 save();
 $('resultTitle').textContent=m.a===100?'Perfect line.':m.a>=95?'Clean run.':m.a>=85?'Good rhythm.':'Keep it light.';
 $('resultCopy').textContent=f?f.full+' drill complete. '+f.keys.toUpperCase().split('').join(' · ')+' stays in the rotation.':m.a>=80?'Trail progress saved. Enter keeps the rhythm going.':'Accuracy missed the 80% unlock mark. Retry without rushing.';
 $('resultWpm').textContent=m.w;$('resultAcc').textContent=m.a+'%';$('resultXp').textContent='+'+gain;$('resultCombo').textContent=run.maxCombo;
 $('arena').classList.add('result-mode');top();route();fingerbar();keymap()
}
function setLesson(delta){
 let i=lessonIndex(),n=i+delta;if(n<0||n>=LESSONS.length||!unlocked(n)){toast(delta>0?'Next run is still locked.':'You are at the first run.');return}
 state.selected=LESSONS[n].id;save();resetRun();toast(LESSONS[n].title)
}
function setFocus(id){
 if(id!=='all'&&!FINGERS.some(f=>f.id===id))return;
 state.focus=id;save();resetRun();
 const f=focus();toast(f?f.full+' · '+f.keys.toUpperCase().split('').join(' '):'All fingers')
}
function handleIdleKey(e){
 if(e.key==='Enter'){e.preventDefault();start();return}
 if(e.key==='g'||e.key==='G'){e.preventDefault();setLesson(-1);return}
 if(e.key==='h'||e.key==='H'){e.preventDefault();setLesson(1);return}
 if(e.key===' '){e.preventDefault();setFocus('all');return}
 const f=FINGERS.find(x=>x.anchor===e.key.toLowerCase());if(f){e.preventDefault();setFocus(f.id)}
}
document.addEventListener('keydown',e=>{
 if($('settingsModal').classList.contains('open')){if(e.key==='Escape')$('settingsModal').classList.remove('open');return}
 if(run.status==='playing'){if(e.key==='Escape'){e.preventDefault();abort();return}if(e.key.length===1){e.preventDefault();typeKey(e.key)}return}
 if(e.key==='Escape'&&$('arena').classList.contains('result-mode')){$('arena').classList.remove('result-mode');run.status='idle';render();return}
 handleIdleKey(e)
});
$('capture').addEventListener('keydown',e=>{if(run.status==='playing'){if(e.key==='Escape'){e.preventDefault();abort()}else if(e.key.length===1){e.preventDefault();typeKey(e.key)}}});
$('prompt').onclick=()=>run.status==='idle'&&start();
$('settingsBtn').onclick=()=>$('settingsModal').classList.add('open');
$('closeSettings').onclick=()=>$('settingsModal').classList.remove('open');
$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.remove('open')};
$('exportBtn').onclick=()=>{save();const u=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='keygrove-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;state=clean(JSON.parse(await f.text()));safeSelected();save();resetRun();$('settingsModal').classList.remove('open');toast('Progress restored.')}catch{toast('That backup could not be read.')}e.target.value=''};
$('resetBtn').onclick=()=>{if(confirm('Reset all Keygrove progress?')){state=fresh();save();resetRun();$('settingsModal').classList.remove('open');toast('Fresh grove.')}};
setInterval(()=>{if(run?.status==='playing')metrics()},450);
safeSelected();resetRun();save();
Object.defineProperty(window,'keygrove',{value:Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({state,run})),lessons:()=>LESSONS.map(x=>({...x})),fingers:()=>FINGERS.map(x=>({...x}))})});
})();