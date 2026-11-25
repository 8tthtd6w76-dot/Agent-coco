// ===== GROOVE randomizer (v0.32): one press = a brand-new, musically sensible song =====
// Picks a vibe (tempo range, swing, kit, sounds), a key + scale, a diatonic chord progression,
// then writes drums, bass, chord hits and a call-and-answer lead hook for patterns A (groove),
// B (hook) and sometimes C (breakdown), plus a play ORDER. Shared by the game's Home Studio
// and the phone studio page. Output is a normal studio song object (see studio_core.js).
const GROOVE_VIBES=[
 {n:'Funk Pocket',bpm:[96,112],sw:[2,2,1,3],sc:[1,1,0],kit:[0,0,4],bi:[0,0,4,1],ci:[1,4,7,0,6],li:[0,2,6,8,1],pad:[0,0,1],jazz:1,
  kick:['x.....x...x..x..','x..x..x...x.....','x.x...x..x......','x......x..x..x..','x.....x.x.....x.'],
  hat:['x.x.x.x.x.x.x.x.','xxxxxxxxxxxxxxxx','x.xxx.xxx.xxx.xx'],open:['..............x.','......x.......x.',''],
  ch:['..x.x.....x.x...','.x..x..x..x.....','..x...x...x...x.','x..x..x...x..x..'],bassBusy:3},
 {n:'Disco Strut',bpm:[116,126],sw:[0,1],sc:[0,1],kit:[1],bi:[1,0,4],ci:[3,2,0,7],li:[0,1,7,6],pad:[0,1],jazz:1,disco:1,
  kick:['x...x...x...x...','x...x...x...x.x.'],hat:['xgxgxgxgxgxgxgxg','x.x.x.x.x.x.x.x.'],open:['..x...x...x...x.'],
  ch:['..x...x...x...x.','x..x..x..x..x...','.x.x.x.x.x.x.x.x'],bassBusy:2},
 {n:'Lo-Fi Strut',bpm:[80,94],sw:[2,3],sc:[1,0,2],kit:[0,4],bi:[2,0],ci:[0,6,5],li:[5,7,3,6],pad:[1,1,0],jazz:1,
  kick:['x......x..x.....','x.........x..x..','x..x......x.....','x......xx.....x.'],hat:['x.x.x.x.x.x.x.x.','x.xxx.x.x.xxx.x.'],open:['','..............x.'],
  ch:['x.......x.......','x.........x.....','x.....x.........'],bassBusy:1},
 {n:'Psych Drift',bpm:[88,104],sw:[1,1,2],sc:[1,0],kit:[2],bi:[2,1,4],ci:[5,6,2,7],li:[4,8,6,3],pad:[1],
  kick:['x......x..x.....','x.....x...x.....','x..x....x.x.....'],hat:['x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x...'],open:['..............x.',''],
  ch:['x.......x.......','x...........x...','x.......x...x...'],bassBusy:1},
 {n:'Synth Pop',bpm:[108,122],sw:[0,1],sc:[2,0,2],kit:[4,3,1],bi:[1,4,0],ci:[2,3,6],li:[6,0,1,7],pad:[1,0],triad:1,
  kick:['x.....x.x.......','x...x...x...x...','x.....x...x.....'],hat:['x.x.x.x.x.x.x.x.','xxxxxxxxxxxxxxxx'],open:['..x...x...x...x.',''],
  ch:['x..x..x.x..x..x.','x.......x.......','x.x.x.x.x.x.x.x.'],bassBusy:2},
 {n:'Spy Chase',bpm:[100,116],sw:[1,2],sc:[0,1],kit:[3,0],bi:[1,4,0],ci:[1,3,6],li:[6,0,5,2],pad:[0,1],
  kick:['x..x..x...x..x..','x.....x.x.x.....','x..x..x...x.....'],hat:['xxxxxxxxxxxxxxxx','x.x.x.x.x.x.x.x.'],open:['','......x.......x.'],
  ch:['..x...x...x...x.','x..x..x...x.....'],bassBusy:3},
 {n:'Sunset Soul',bpm:[86,100],sw:[1,2],sc:[2,1],kit:[4,0],bi:[0,2,4],ci:[0,6,7],li:[7,3,1,6],pad:[0,1],jazz:1,
  kick:['x......x..x.....','x.....x...x..x..','x..x......x.....'],hat:['x.x.x.x.x.x.x.x.','x.xxx.x.x.xxx.x.'],open:['..............x.',''],
  ch:['x..x......x.....','x.....x...x.....','..x...x.....x...'],bassBusy:2}];
// diatonic progressions (semitones above the key) for each scale: SCALES 0 minor, 1 dorian, 2 major
const GROOVE_PROGS=[
 [[0,8,3,10],[0,5,10,3],[0,0,8,7],[0,10,8,10],[0,3,8,7],[0,5,0,7],[0,8,10,0],[0,8,5,7],[0,3,10,5]],
 [[0,5,0,5],[0,2,3,5],[0,10,5,0],[0,7,10,5],[0,3,10,5],[0,5,10,0],[0,2,0,5]],
 [[0,9,5,7],[0,5,0,5],[2,7,0,9],[0,4,9,5],[5,7,4,9],[0,9,2,7],[5,0,2,7]]];
// chord quality per scale degree: [jazzy, jazzier, plain triad]
const GROOVE_Q=[
 {0:['m7','m9','m'],2:['m7b5','m7b5','m7b5'],3:['maj7','maj9','M'],5:['m7','m9','m'],7:['m7','7s9','m'],8:['maj7','maj9','M'],10:['7','9','M']},
 {0:['m7','m9','m'],2:['m7','m9','m'],3:['maj7','maj9','M'],5:['9','7','M'],7:['m7','m9','m'],10:['maj7','maj9','M']},
 {0:['maj7','maj9','M'],2:['m7','m9','m'],4:['m7','m7','m'],5:['maj7','maj9','M'],7:['9','7','M'],9:['m7','m9','m']}];
const GROOVE_RHY=['x.x...x.x.x.....','x..x..x...x.....','..x.x...x..x.x..','x...x.x.....x...','x.....x.x...x.x.','.x.x..x...x.....','x.x.x.....x.x...','..x..x..x.....x.'];
const GROOVE_ORDERS=['AB','AABB','AABA','ABAB','AABBCB','ABAC','AABBACBB','AABB'];
let GROOVE_LAST='';
function gSet(s,i,c){return s.slice(0,i)+c+s.slice(i+1);}
function grooveRandom(prev){
 const R=a=>a[Math.random()*a.length|0],chance=p=>Math.random()<p,ri=(a,b)=>a+(Math.random()*(b-a+1)|0);
 const V=R(GROOVE_VIBES),S=blankSong();
 S.name=randSongName();S.skin=prev&&prev.skin!==undefined?prev.skin:0;
 S.bpm=Math.round(ri(V.bpm[0],V.bpm[1])/2)*2;S.sw=R(V.sw);S.key=ri(0,11);S.sc=R(V.sc);S.kit=R(V.kit);
 S.bi=R(V.bi);S.ci=R(V.ci);S.li=R(V.li);S.pad=R(V.pad);S.pr=0;
 const qi=()=>V.triad?2:V.jazz?(chance(.5)?0:1):(chance(.65)?0:2);
 const QI=qi(),mkBars=tpl=>tpl.map(o=>[o,(GROOVE_Q[S.sc][o]||['m7'])[chance(.15)?qi():QI]]);
 const progA=R(GROOVE_PROGS[S.sc]);S.bars=mkBars(progA);
 // ---- drums ----
 const scatter=(base,cands,n)=>{let s=base;for(let i=0;i<n;i++){const p=R(cands);s=gSet(s,p,'x');}return s;};
 const drums=(busy)=>{const D={};
  D.k=R(V.kick);if(!V.disco&&chance(.35))D.k=gSet(D.k,R([7,9,13,15]),'x');
  D.s='....x.......x...';D.c=V.disco||V.n==='Synth Pop'?(chance(.7)?'....x.......x...':blank16):(busy&&chance(.5)?'............x...':blank16);
  if(V.disco&&chance(.4))D.s=blank16;
  D.h=R(V.hat);if(busy&&D.h.indexOf('.')>=0&&chance(.5))D.h='xxxxxxxxxxxxxxxx';
  D.O=R(V.open)||blank16;if(busy&&D.O===blank16&&chance(.6))D.O='..............x.';
  D.p=scatter(blank16,[2,3,6,10,11,14,15],ri(busy?2:1,busy?4:2));return D;};
 // ---- bass: follows the kick, plus funky syncopations ----
 const hasMaj=bars=>bars.some(b=>/maj/.test(b[1]));
 const bassPat=(k,bars)=>{let b=blank16;const pool=hasMaj(bars)?[2,2,2,7,7,5,0,1]:[2,2,2,7,7,5,6,0];
  if(V.disco&&chance(.6)){for(let i=0;i<16;i+=2)b=gSet(b,i,i%4===0?'2':'7');return b;}
  for(let i=0;i<16;i++)if(k[i]==='x')b=gSet(b,i,i===0?'2':String(R(pool)));
  const extra=[3,7,11,14,15,5,9];for(let n=0;n<ri(1,V.bassBusy);n++){const p=R(extra);if(b[p]==='.')b=gSet(b,p,String(R(pool)));}
  if(chance(.35)&&b[15]==='.')b=gSet(b,15,String(R([4,7,1])));return b;};
 // ---- chord hits ----
 const chordPat=()=>S.ci===5?'x.......x.......':S.ci===7&&!V.disco?R(['..x.x.g...x.x.g.','x..x..x.g.x...g.','.x..x..x..x.....']):R(V.ch);
 // ---- lead: call (bar 1), answer (bar 2), call again (bar 3), landing (bar 4) ----
 const sc=SCALES[S.sc].s,penta=S.sc===2?[0,1,2,4,5]:[0,2,3,4,6];
 const degs=[];for(let d=3;d<=12;d++)if(penta.includes(d%7))degs.push(d);
 const pcOf=d=>(sc[d%7])%12;
 const chordTone=(bar,near)=>{const [o,q]=bar,tones=(QUAL[q]||QUAL.m7).map(i=>(o+i)%12);
  const c=degs.filter(d=>tones.includes(pcOf(d)));const L=c.length?c:degs;return L.reduce((a,d)=>Math.abs(d-near)<Math.abs(a-near)?d:a,L[0]);};
 const walk=(from,steps)=>{let i=Math.max(0,degs.indexOf(from));const out=[];for(let n=0;n<steps;n++){i=Math.max(0,Math.min(degs.length-1,i+R([-1,-1,1,1,0,2,-2])));out.push(degs[i]);}return out;};
 const fillBar=(rhy,notes)=>{let s='',j=0;for(let i=0;i<16;i++)s+=rhy[i]==='x'?String.fromCharCode(97+notes[Math.min(j++,notes.length-1)]):'.';return s;};
 const leadHook=(bars,sparse)=>{const rA=R(GROOVE_RHY),rB=chance(.5)?rA:R(GROOVE_RHY),nA=rA.split('x').length-1,nB=rB.split('x').length-1;
  const start=chordTone(bars[0],ri(6,9)),call=[start].concat(walk(start,nA-1));
  const ans0=chordTone(bars[1%bars.length],call[call.length-1]),answer=[ans0].concat(walk(ans0,nB-1));
  const land=chordTone(bars[3%bars.length],7),endR=R(['x...x...x.......','x.x...x.........','..x.x...x.......']);
  const nE=endR.split('x').length-1,ending=walk(land,nE-1);ending[nE-1]=land;
  const b1=fillBar(rA,call),b2=fillBar(rB,answer),b3=chance(.5)?b1:fillBar(rA,[chordTone(bars[2%bars.length],start)].concat(walk(start,nA-1))),b4=fillBar(endR,ending);
  return sparse?blank16+b2+blank16+b4:b1+b2+b3+b4;};
 // ---- pattern A: the groove ----
 const A=drums(false);Object.assign(S,A);S.bass=bassPat(S.k,S.bars);S.ch=chordPat();
 const sparseA=chance(.55);S.lead=leadHook(S.bars,sparseA);
 if(chance(.6))S.fill={s:R(['....x.......xxxx','....x.....x.x.xx','....x.......x.xx']),k:S.k};
 // ---- pattern B: the hook (busier drums, full lead, maybe its own chords) ----
 const B=drums(true),Bb=chance(.45)?mkBars(R(GROOVE_PROGS[S.sc])):null;
 B.bass=bassPat(B.k,Bb||S.bars);B.ch=chance(.5)?S.ch:chordPat();B.lead=leadHook(Bb||S.bars,false);
 if(Bb)B.bars=Bb;if(chance(.6))B.fill={s:'....x.......xxxx',k:B.k};
 // ---- pattern C: the breakdown (half-time drums, chords ring out) ----
 const C={k:'x.........x.....',s:'........x.......',c:blank16,h:chance(.5)?'x.x.x.x.x.x.x.x.':blank16,O:blank16,p:blank16,
  bass:'2.........2.....',ch:'x.......x.......',lead:sparseA?S.lead:blank16+blank16+blank16+blank16};
 let order=R(GROOVE_ORDERS);
 S.pats=[B,C];S.arr=order;if(order.indexOf('C')<0)S.pats=[B];
 GROOVE_LAST=V.n;S.vibe=V.n;return S;}
function grooveSummary(S){return (S.vibe||'Groove')+' in '+NOTE_N[S.key]+' '+SCALES[S.sc].n.toLowerCase()+', '+S.bpm+' BPM';}
