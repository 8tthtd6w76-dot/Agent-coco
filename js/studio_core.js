// ===== Music Room (in the Lair): Groove Machine, My Songs, Preset Songs, Jukebox, Theme Picker =====
// Songs are tiny strings saved in SAVE.songs (max 8). songDef() turns a song into a normal music.js track
// definition, so the game's own funk band plays it, with the same sounds as every other track.
// SAVE.musicPick {screen: 'p:<presetId>' | 'u:<songId>'} swaps the music of a screen for a chosen song.

const NOTE_N=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SCALES=[{n:'MINOR',s:[0,2,3,5,7,8,10]},{n:'DORIAN',s:[0,2,3,5,7,9,10]},{n:'MAJOR',s:[0,2,4,5,7,9,11]}];
const PROGS=[
 {n:'POCKET',c:[[0,'m9'],[0,'m9'],[5,'9'],[5,'9']]},
 {n:'SPY',c:[[0,'m9'],[0,'m9'],[8,'maj7'],[7,'7s9']]},
 {n:'DISCO',c:[[0,'m7'],[5,'m7'],[10,'maj7'],[3,'maj7']]},
 {n:'NIGHT',c:[[0,'m7'],[8,'maj7'],[3,'maj7'],[10,'7']]},
 {n:'DRIFT',c:[[0,'m7'],[10,'M'],[8,'maj7'],[5,'m7']]},
 {n:'SUNNY',c:[[0,'maj7'],[9,'m7'],[5,'maj7'],[7,'9']]},
 {n:'ANTHEM',c:[[0,'M'],[7,'M'],[9,'m'],[5,'M']]},
 {n:'FLOAT',c:[[0,'maj9'],[5,'maj9'],[0,'maj9'],[5,'maj9']]}];
const KITS=[{n:'FUNK',p:'b',pn:'COWBELL'},{n:'HOUSE',p:'t',pn:'SHAKER'},{n:'PSYCH',p:'T',pn:'TOM'},{n:'ARCADE',p:'g',pn:'BLIPS'},{n:'INDIE',p:'p',pn:'CONGA'}];
// ---- studio instruments: FM-1 pocket synth (FM sounds) and the electric guitar ----
let DIST_CURVE=null;function distCurve(){if(DIST_CURVE)return DIST_CURVE;const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*3.2);}return DIST_CURVE=c;}
function fmVoice(t,f,dur,out,o){const A=MUS.a,end=t+dur+(o.r||.1)+.35,g=gainTo(out,o.send||.3);env(g,t,o.v,o.a,o.d,o.s,o.r||.1,dur);
 const c=osc('sine',f,t,end,g);const mg=A.createGain();mg.gain.setValueAtTime(f*o.idx,t);mg.gain.exponentialRampToValueAtTime(Math.max(1,f*o.idx*o.dec),t+(o.dt||Math.max(.08,dur)));
 const m=A.createOscillator();m.frequency.value=f*o.ratio;m.connect(mg);mg.connect(c.frequency);m.start(t);m.stop(end);if(o.vib)vib(c,t,dur+.2,5.5,f*.01,.2);return c;}
function fmkeys(t,ms,dur,v=1,out=MUS.music){for(const m of ms){const f=mtof(m);fmVoice(t,f,dur,out,{v:.085*v,a:.003,d:.7,s:.3,r:.25,ratio:1,idx:1.6,dec:.12,dt:.5,send:.35});
 if(!MUSIC_LITE)fmVoice(t,f,.05,out,{v:.02*v,a:.001,d:.15,s:0,r:.05,ratio:14,idx:.5,dec:.1,dt:.1});}}
function fmbass(t,m,dur,v=1,out=MUS.music){fmVoice(t,mtof(m),dur,out,{v:.3*v,a:.003,d:.18,s:.6,r:.05,ratio:1,idx:2.6,dec:.25,dt:.12,send:0});}
function fmlead(t,m,dur,v=1,out=MUS.music){fmVoice(t,mtof(m),dur,out,{v:.085*v,a:.015,d:.25,s:.7,r:.1,ratio:2,idx:1.3,dec:.6,dt:.3,send:.4,vib:true});}
function fmbell(t,m,dur,v=1,out=MUS.music){fmVoice(t,mtof(m+12),Math.max(.5,dur),out,{v:.06*v,a:.002,d:1.1,s:0,r:.3,ratio:3.5,idx:3,dec:.05,dt:.9,send:.5});}
function guitar(t,ms,dur,v=1,out=MUS.music){const short=dur<.2;GTR.hit=t;ms.forEach((m,i)=>{const tt=t+i*.011,f=mtof(m),g=gainTo(out,.22);env(g,tt,.055*v,.002,short?.09:.45,short?0:.35,.08,short?0:dur);
 const lp=filt('lowpass',short?2200:3000,1.5,g);const hp=filt('highpass',180,.7,lp);osc('sawtooth',f,tt,tt+dur+.4,hp);if(!MUSIC_LITE)osc('square',f*1.004,tt,tt+dur+.4,filt('lowpass',1400,1,g));});}
function guitarlead(t,m,dur,v=1,out=MUS.music){const A=MUS.a,f=mtof(m),g=gainTo(out,.35);env(g,t,.06*v,.005,.25,.75,.12,dur);GTR.hit=t;
 const lp=filt('lowpass',2600,1.2,g);const ws=A.createWaveShaper();ws.curve=distCurve();ws.connect(lp);const pre=A.createGain();pre.gain.value=1.8;pre.connect(ws);
 const o=osc('sawtooth',f,t,t+dur+.2,pre);o.frequency.setValueAtTime(f*.97,t);o.frequency.exponentialRampToValueAtTime(f,t+.04);if(dur>.25)vib(o,t,dur+.2,5.5,f*.012,.18);}
const GTR={hit:-9};
BASSI.fm=fmbass;COMPI.fmkeys=fmkeys;COMPI.guitar=guitar;LEADI.fm=fmlead;LEADI.fmbell=fmbell;LEADI.guitar=guitarlead;
// new sounds are appended so old saved songs keep their picks
const BASSES=['slap','synth','sub','tuba','fm'],BASS_T=['SLAP','SYNTH','SUB','TUBA','FM BASS'];
const KEYSI=['ep','clav','organ','stab','wah','pad','fmkeys','guitar'],KEYS_T=['E-PIANO','CLAV','ORGAN','STAB','WAH','PAD','FM PIANO','GUITAR'];
const LEADS=['synth','lead','brass','whistle','theremin','bell','fm','fmbell','guitar'],LEAD_T=['SYNTH','LEAD','BRASS','WHISTLE','THEREMIN','BELL','FM LEAD','FM BELL','GUITAR'];
const SWINGS=[0,.08,.15,.22],SWING_T=['NONE','LIGHT','FUNK','HEAVY'];
const SKINS=[{n:'BLUE',a:'#4fa8ff',b:'#1d4f8f',fm:0},{n:'ORANGE',a:'#4fa8ff',b:'#1d4f8f',fm:1},{n:'PINK',a:'#ff8fc8',b:'#8a2d62',fm:0},{n:'SILVER',a:'#d8e0ea',b:'#69778a',fm:1},{n:'MIDNIGHT',a:'#7a86ff',b:'#23264f',fm:0}];
// FM-1 colorways: white with blue keys, burnt orange
const FMC=[{body:'#f1eee6',edge:'#b9b4a8',strip:'#2f4f8f',key:'#4a6db8',txt:'#334',lit:'#ffd23a'},{body:'#c8582a',edge:'#8a3412',strip:'#a9461f',key:'#d06a3a',txt:'#2a0f05',lit:'#ffe08a'}];
const BASS_RAW={m:'3',M:'4'};const BASS_IV=['H','J','0','2','5','7','a','o'],BASS_L=['LOW 5','LOW 6','ROOT','2ND','4TH','5TH','7TH','OCTAVE'];
const QN={M:'',m:'m',m7:'m7',m9:'m9',maj7:'maj7',maj9:'maj9',7:'7',9:'9','7s9':'7#9',m7b5:'m7b5'};
const blank16='................';

function songNoteName(m){return NOTE_N[((m%12)+12)%12]+(Math.floor(m/12)-1);}
function leadMidi(S,d){const sc=SCALES[S.sc].s;let base=60+S.key;if(S.key>=7)base-=12;return base+sc[d%7]+12*Math.floor(d/7);}
function randSongName(){const A=['Funky','Cosmic','Sneaky','Electric','Pizza','Desert','Midnight','Robot','Neon','Turbo','Velvet','Saguaro','Rooftop','Gadget'],
 B=['Groove','Jam','Boogie','Shuffle','Strut','Drift','Disco','Bounce','Heist','Breeze','Slide','Wiggle','Getaway','Stomp'];
 return A[Math.random()*A.length|0]+' '+B[Math.random()*B.length|0];}
function blankSong(){return {name:randSongName(),bpm:100,sw:2,key:4,sc:1,pr:0,kit:0,bi:0,ci:0,li:0,pad:0,skin:0,
 k:'x.....x...x.....',s:'....x.......x...',c:blank16,h:'x.x.x.x.x.x.x.x.',O:blank16,p:blank16,bass:'2.....2...2.....',ch:blank16,lead:'.'.repeat(64)};}
function cloneSong(S){return JSON.parse(JSON.stringify(S));}

// per-bar chords: S.bars (4 x [semitones above the key, quality]) overrides the CHORDS preset when present
function songBars(S){return S.bars&&S.bars.length>=4?S.bars:PROGS[S.pr].c;}
// per-pattern chords: pattern B/C may carry its own bars (4 to 8 bars long); pattern A uses the song's
function patBars(S,L){const Pt=patOf(S,L);return Pt!==S&&Pt.bars&&Pt.bars.length>=4?Pt.bars:songBars(S);}
// which order slot a song bar falls in: {entry, barIn, nb}
function slotAt(S,bar){const arr=songArr(S);let b=bar,tot=0;for(let i=0;i<arr.length;i++)tot+=patBars(S,arr[i]).length;b=((b%tot)+tot)%tot;for(let i=0;i<arr.length;i++){const nb=patBars(S,arr[i]).length;if(b<nb)return {entry:i,barIn:b,nb};b-=nb;}return {entry:0,barIn:0,nb:4};}
const QLIST=['M','m','m7','m9','maj7','maj9','7','9','7s9','m7b5'];
// song sections: pattern A is the song's own fields; B and C live in S.pats. S.arr is the play order ('AABC'), 4 bars each.
const PAT_KEYS=['k','s','c','h','O','p','bass','ch','lead'];
function songArr(S){return S.arr&&S.arr.length?S.arr:'A';}
function patOf(S,L){const i='ABC'.indexOf(L);if(i<=0)return S;return (S.pats&&S.pats[i-1])||S;}
function makePat(S){const o={};PAT_KEYS.forEach(k=>o[k]=S[k]);return o;}
function songDef(S){const P=songBars(S),K=KITS[S.kit],arr=songArr(S);
 const prog=[];for(let a=0;a<arr.length;a++)patBars(S,arr[a]).forEach(([o,q])=>prog.push([NOTE_N[(S.key+o)%12],q]));
 const up=s=>s.replace(/x/g,'X');
 const mk=(Pt,k,s2,c)=>{let h='';for(let i=0;i<16;i++)h+=Pt.O[i]==='x'?'O':Pt.h[i]==='x'?(i%2?'o':'x'):Pt.h[i]==='o'?'o':Pt.h[i]==='g'?'g':'.';
  const d={k:up(k),s:up(s2),c:up(c),h};d[K.p]=Pt.p;return d;};
 const bstr=src=>{let b='',hold=0;for(let i=0;i<16;i++){const c=src[i];if(c!=='.'){b+=(BASS_RAW[c]||BASS_IV[+c]);hold=2;}else if(hold>0){b+='-';hold--;}else b+='.';}return b;};
 const cstr=src=>{let ch='',hold=0;for(let i=0;i<16;i++){if(src[i]==='x'){ch+='x';hold=S.ci===5?15:S.ci===7?1:3;}else if(src[i]==='X'){ch+='X';hold=S.ci===5?15:S.ci===7?1:3;}else if(src[i]==='g'){ch+='g';hold=0;}else if(hold>0){ch+='-';hold--;}else ch+='.';}return ch;};
 const drums={},bassA=[],hitsA=[];let dseq='',leadAll='';
 for(const L of arr){const Pt=patOf(S,L);
  if(!drums[L]){drums[L]=mk(Pt,Pt.k,Pt.s,Pt.c);const f=Pt.fill;if(f)drums[L.toLowerCase()]=mk(Pt,f.k||Pt.k,f.s||Pt.s,f.c||Pt.c);}
  const nb=patBars(S,L).length;
  for(let k=0;k<nb;k++){bassA.push(bstr(Pt.bass4?Pt.bass4[k%Pt.bass4.length]:Pt.bass));hitsA.push(cstr(Pt.ch4?Pt.ch4[k%Pt.ch4.length]:Pt.ch));}
  dseq+=L.repeat(nb-1)+(Pt.fill?L.toLowerCase():L);leadAll+=(Pt.lead+'.'.repeat(16*nb)).slice(0,16*nb);}
 const T=leadAll.length;
 const tok=[],pos=[];for(let i=0;i<T;i++)if(leadAll[i]!=='.')pos.push(i);
 if(pos.length){if(pos[0]>0)tok.push('r/'+pos[0]);
  pos.forEach((p,j)=>{const nx=j+1<pos.length?pos[j+1]:T,len=Math.min(nx-p,S.lh||4);tok.push(songNoteName(leadMidi(S,leadAll.charCodeAt(p)-97))+'/'+len);if(nx-p>len)tok.push('r/'+(nx-p-len));});}
 const def={title:S.name,desc:'Made in the Groove Machine',bpm:S.bpm,swing:SWINGS[S.sw],prog,drums,dseq,
  bassI:BASSES[S.bi],bass:bassA,comp:[{i:KEYSI[S.ci],h:hitsA,v:.8}],lead:tok.length?{i:LEADS[S.li]==='fm1'&&typeof fm1Inst==='function'?fm1Inst(S):LEADS[S.li],mel:tok.join(' '),v:.9,o:S.lo||0}:[],vol:.95};
 if(S.pad)def.pad={v:.6};return def;}

// ---------- preset songs (original tunes, each in the style of a band Michael likes) ----------
const PRESET_SONGS=[
 {id:'robot_disco',style:'French house robot disco',desc:'Four-on-the-floor, filtered disco stabs, a robot synth riff. Made for dancing in helmets.',
  song:{name:'Robot Pizza Disco',bpm:122,sw:0,key:5,sc:0,pr:2,kit:1,bi:1,ci:3,li:0,pad:0,skin:4,
   k:'x...x...x...x...',s:blank16,c:'....x.......x...',h:'x.x.x.x.x.x.x.x.',O:'..x...x...x...x.',p:'.x.x.x.x.x.x.x.x',
   bass:'2.7..27.2.7..275',ch:'..x..x....x..x..',
   lead:'e.g.h..g.e.d.e..'+'f.e.d..b.d......'+'g.h.i..h.g.e.g..'+'j...i...h...g.e.'}},
 {id:'saguaro_kids',style:'Big bright indie synth-pop',desc:'A huge sing-along synth hook, bouncy bass and a happy organ. Arms up!',
  song:{name:'Saguaro Kids',bpm:116,sw:1,key:2,sc:2,pr:6,kit:4,bi:4,ci:2,li:6,pad:1,skin:1,
   k:'x.....x.x.......',s:'....x.......x...',c:blank16,h:'x.x.x.x.x.x.x.x.',O:blank16,p:'..........x..x..',
   bass:'2...2.2...2.5.4.',ch:'x.......x.......',
   lead:'h.h.j.h.l...j...'+'i.i.l.i.h...g...'+'j.j.k.j.i...f...'+'k...j...i...h.f.'}},
 {id:'lagoon_drift',style:'Dreamy psychedelic groove',desc:'Slow heavy drums, a round melodic bass, a wobbly dream lead and big washy chords.',
  song:{name:'Lair Lagoon Drift',bpm:92,sw:1,key:4,sc:1,pr:4,kit:2,bi:2,ci:6,li:8,pad:1,skin:3,
   k:'x......x..x.....',s:'....x.......x...',c:blank16,h:'x.x.x.x.x.x.x...',O:'..............x.',p:'.............x.x',
   bass:'2.....2.5...6.7.',ch:'x.......x...x...',
   lead:'h.......g...e...'+'g...f...e.....d.'+'e.......g...i...'+'h...........g.e.'}},
 {id:'first_beat',style:'Agent Coco funk starter',desc:'A slap-bass spy pocket to remix. Good first song to mess with.',
  song:{name:"Coco's First Beat",bpm:104,sw:2,key:4,sc:1,pr:1,kit:0,bi:0,ci:7,li:2,pad:0,skin:0,
   k:'x.....x...x..x..',s:'....x.......x...',c:blank16,h:'x.x.x.x.x.x.x.x.',O:'..............x.',p:'..x.......x.....',
   bass:'2..7..2.5.6.7.6.',ch:'..x.x.....x.x...',
   lead:'h.......j.h.g...'+'e...g...h.......'+'h.......j.h.g...'+'k...j...h...e...'}}];

