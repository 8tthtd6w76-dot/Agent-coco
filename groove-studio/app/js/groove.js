// ===== Groove Studio: 🎲 random groove generator + starter presets =====
// Both build a whole loop (beat, bass, chords, melody) from a small recipe, always in key so it sounds right.
'use strict';
// drum lanes are 16-step strings per bar: x = hit, o = soft hit, . = rest. Pads: 0 kick 1 snare 2 clap 3 hat 4 open hat 5 rim 9 cowbell 10 shaker 11 conga 13 snap
const STYLES=[
 {n:'Funk',bpm:[96,108],kit:0,swing:.18,scale:2,drums:[{0:'x.....x...x..x..',1:'....x..o.o..x...',3:'x.x.x.x.x.x.x.x.',4:'..............x.',9:'..x.......x.....'},{0:'x..x..x...x.....',1:'....x.......x..o',3:'xoxoxoxoxoxoxoxo'}],
  bass:['x..x..x.x.x..x..','x.....xx..x.x...'],chords:'..x.x.....x.x...',bassP:3,chordP:8,leadP:0},
 {n:'Boom Bap',bpm:[84,94],kit:1,swing:.3,scale:1,drums:[{0:'x.......x.x.....',1:'....x.......x...',3:'x.x.x.x.x.x.x.x.'},{0:'x......xx.......',1:'....x.......x...',3:'x.xox.x.x.xox.x.',5:'.......o......o.'}],
  bass:['x.......x.x.....','x......xx.......'],chords:'x.......x.......',bassP:3,chordP:1,leadP:6},
 {n:'House',bpm:[120,126],kit:3,swing:0,scale:1,drums:[{0:'x...x...x...x...',2:'....x.......x...',4:'..x...x...x...x.',10:'xxxxxxxxxxxxxxxx'},{0:'x...x...x...x...',1:'....x.......x...',3:'x.x.x.x.x.x.x.x.',4:'..x...x...x...x.'}],
  bass:['..x...x...x...x.','x.xx..x.x.xx..x.'],chords:'..x..x....x..x..',bassP:3,chordP:9,leadP:2},
 {n:'Lo-Fi',bpm:[72,84],kit:4,swing:.35,scale:3,drums:[{0:'x......x..x.....',1:'....x.......x...',3:'x.x.x.x.x.x.x.x.',10:'..o...o...o...o.'}],
  bass:['x.......x.....x.','x.....x...x.....'],chords:'x.......x.......',bassP:3,chordP:1,leadP:2},
 {n:'Disco',bpm:[112,120],kit:0,swing:.05,scale:0,drums:[{0:'x...x...x...x...',1:'....x.......x...',4:'..x...x...x...x.',3:'x.x.x.x.x.x.x.x.',9:'x...x...x...x...'}],
  bass:['x.x.x.x.x.x.x.x.','x..xx..xx..xx..x'],chords:'.x.x.x.x.x.x.x.x',bassP:3,chordP:8,leadP:4},
 {n:'Trap',bpm:[136,150],kit:2,swing:0,scale:1,drums:[{0:'x......x..x.....',2:'........x.......',3:'x.x.x.xxx.x.x.xx',5:'..............x.'}],
  bass:['x......x..x.....','x.........x..x..'],chords:'x...............',bassP:3,chordP:9,leadP:2},
 {n:'Reggaeton',bpm:[88,98],kit:3,swing:0,scale:1,drums:[{0:'x...x...x...x...',1:'...x..x....x..x.',3:'x.x.x.x.x.x.x.x.'}],
  bass:['x..x..x.x..x..x.'],chords:'x..x..x.x..x..x.',bassP:3,chordP:7,leadP:6}];
// progressions as scale degrees (0 = the key's root chord)
const PROGS4=[[0,5,3,4],[0,3,4,3],[0,4,5,3],[5,3,0,4],[0,0,3,4],[0,6,5,4],[0,3,0,4],[1,4,0,0],[0,2,3,4]];
const SC7=[[0,2,4,5,7,9,11],[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,5,7,9,10]]; // matches SCALES 0-3
function degNote(deg,base){const sc=SC7[Math.min(3,P.scale)]||SC7[0];return base+P.key+sc[((deg%7)+7)%7]+12*Math.floor(deg/7);}
function chordOf(deg,base){return [0,2,4,6].map(i=>degNote(deg+i,base));}   // a 7th chord built from the scale
const R=()=>Math.random(),pick=a=>a[Math.floor(R()*a.length)];
function lane(str,bar,cb){for(let i=0;i<16;i++){const c=str[i];if(c&&c!=='.')cb(bar*4+i/4,c==='o'?.5:.9);}}

// build a song from a recipe. r: {name,bpm,key,scale,kit,swing,style(drums,bass,chords,...),prog,mel:[{t,d,deg}]}
function buildGroove(r){const st=r.style,bars=4,len=16;
 P.name=r.name;P.bpm=r.bpm;P.key=r.key;P.scale=r.scale;P.swing=r.swing;P.loop={on:true,a:0,b:len};P.sections=[{id:uid('s'),bar:0,len:4,name:'Groove'}];
 const D=newTrack('drums','Drums');D.kit=r.kit;const dc=newClip('drums',0,len,len);dc.name=st.n+' beat';
 for(let b=0;b<bars;b++){const pat=b===3&&st.drums[1]?st.drums[1]:st.drums[0];for(const p in pat)lane(pat[p],b,(t,v)=>dc.notes.push({t,p:+p,v}));}
 // a little fill at the end of bar 4
 if(R()<.7)[13.5,14,14.5,15,15.5].forEach((t,i)=>{if(R()<.7)dc.notes.push({t,p:[1,6,7,8,1][i],v:.5+i*.1});});
 dc.notes.sort((a,b)=>a.t-b.t);D.clips.push(dc);
 const B=newTrack('synth','Bass');B.patch=fm1Patch(st.bassP);B.color='#ff922b';const bc=newClip('synth',0,len,len);bc.name='Bass';
 const C=newTrack('synth','Chords');C.patch=fm1Patch(st.chordP);C.color='#4dabf7';C.vol=.6;C.fx.rev=.25;const cc=newClip('synth',0,len,len);cc.name='Chords';
 r.prog.forEach((deg,b)=>{const root=degNote(deg,36);const br=b%2&&st.bass[1]?st.bass[1]:st.bass[0];
  lane(br,b,(t,v)=>{const oct=R()<.15&&b>0?12:0,fifth=R()<.12?7:0;bc.notes.push({t,d:.4,m:root+oct+fifth,v});});
  lane(st.chords,b,(t,v)=>chordOf(deg,60).forEach(m=>cc.notes.push({t,d:.45,m:m>76?m-12:m,v:v*.8})));});
 B.clips.push(bc);C.clips.push(cc);
 const L=newTrack('synth','Melody');L.patch=fm1Patch(st.leadP);L.color='#e599f7';L.fx.dly=.2;L.vol=.7;const lc=newClip('synth',0,len,len);lc.name='Melody';
 r.mel.forEach(n=>lc.notes.push({t:n.t,d:n.d,m:degNote(n.deg,60),v:.8}));L.clips.push(lc);
 const V=newTrack('audio','Vocals');
 P.tracks=[D,B,C,L,V];[D,B,C,L,V].forEach((t,i)=>{if(i===0)t.color='#ff5d5d';if(i===4)t.color='#ffd93d';});}
// a 2-bar melody motif, repeated with a changed ending: catchy because it repeats
function makeMelody(prog){const out=[];let deg=pick([2,4,7]);const rhythm=[];
 for(let s=0;s<32;s+=pick([2,2,2,4,1,3]))if(R()<.72)rhythm.push(s);
 const motif=rhythm.map((s,i)=>{deg+=pick([-2,-1,-1,0,1,1,2]);deg=Math.max(0,Math.min(9,deg));const nx=rhythm[i+1]??32;return {s,deg,d:Math.min(nx-s,4)/4*.9};});
 for(const rep of [0,32])motif.forEach((n,i)=>{let d=n.deg;if(rep&&i>=motif.length-3)d=Math.max(0,d+pick([-2,-1,1,2]));if(rep&&i===motif.length-1)d=0;out.push({t:(rep+n.s)/4,d:n.d,deg:d});});
 return out;}
function randomGroove(){const st=pick(STYLES),names1=['Midnight','Velvet','Neon','Sunny','Cosmic','Golden','Lazy','Electric','Desert','Rooftop'],names2=['Groove','Strut','Drift','Bounce','Jam','Shuffle','Glow','Ride','Stomp','Breeze'];
 stop();commit();const key=Math.floor(R()*12),bpm=st.bpm[0]+Math.floor(R()*(st.bpm[1]-st.bpm[0]+1)),prog=pick(PROGS4);
 P.scale=st.scale;P.key=key;   // so degNote uses them while building
 buildGroove({name:pick(names1)+' '+pick(names2),bpm,key,scale:st.scale,kit:st.kit,swing:st.swing,style:st,prog,mel:makeMelody(prog)});
 BUFC.clear();T.head=0;UI.sel={track:P.tracks[0].id,clip:null,sec:null};refreshAll();
 toast(`🎲 ${st.n} groove in ${NOTE_NAMES[key]} ${SCALES[P.scale].n}, ${bpm} BPM. Roll again, or Undo to go back.`);play(0).then(syncTop);}

// ---------- presets: hand-made starting points ----------
const PRESETS=[
 {n:'Funk Pocket',d:'Slap-style bass, tight hats, a cowbell. Classic groove to jam over.',s:0,key:4,bpm:102,prog:[0,0,3,4],mel:[[0,.4,4],[.75,.2,5],[1,.9,4],[2.5,.4,2],[3,.9,0],[8,.4,4],[8.75,.2,5],[9,.9,7],[10.5,.4,5],[11,.9,4]]},
 {n:'Boom Bap Nod',d:'Dusty head-nod beat, lazy swing, mellow keys.',s:1,key:9,bpm:90,prog:[0,5,3,4],mel:[[0,1.4,4],[2,.9,2],[3,.4,1],[4,1.9,0],[8,1.4,4],[10,.9,5],[11,.4,4],[12,1.9,2]]},
 {n:'House Party',d:'Four on the floor, offbeat open hats, a bouncy bass.',s:2,key:5,bpm:124,prog:[0,3,4,3],mel:[[0,.4,7],[.5,.4,7],[1.5,.4,6],[2,.9,4],[4,.4,7],[4.5,.4,7],[5.5,.4,8],[6,.9,7],[8,.4,7],[8.5,.4,7],[9.5,.4,6],[10,.9,4],[12,.4,4],[12.5,.4,5],[13.5,.4,4],[14,1.4,2]]},
 {n:'Lo-Fi Study',d:'Slow, warm and swingy. Great for recording vocals over.',s:3,key:2,bpm:78,prog:[0,3,2,5],mel:[[0,.9,4],[1.5,.4,5],[2,1.9,4],[8,.9,2],[9.5,.4,4],[10,1.9,1]]},
 {n:'Disco Lights',d:'Octave bass, open hats, string-like stabs on every offbeat.',s:4,key:0,bpm:116,prog:[0,5,3,4],mel:[[0,.4,4],[.5,.4,4],[1,.4,5],[1.5,.9,4],[4,.4,2],[4.5,.4,2],[5,.4,4],[5.5,.9,2],[8,.4,4],[8.5,.4,4],[9,.4,5],[9.5,.9,7],[12,1.9,4]]},
 {n:'Trap Night',d:'Booming 808 kick, rolling hats, dark bells.',s:5,key:7,bpm:142,prog:[0,0,5,4],mel:[[0,.9,7],[1,.4,6],[1.5,.4,4],[2,1.9,2],[8,.9,7],[9,.4,8],[9.5,.4,7],[10,1.9,4]]},
 {n:'Reggaeton Wave',d:'The dembow rhythm with plucky chords.',s:6,key:11,bpm:94,prog:[0,5,3,4],mel:[[0,.4,4],[.75,.4,4],[1.5,.4,5],[2,.9,4],[4,.4,2],[4.75,.4,2],[5.5,.4,4],[6,.9,2]]}];
function loadPreset(i){const pr=PRESETS[i],st=STYLES[pr.s];stop();commit();P.key=pr.key;P.scale=st.scale;
 buildGroove({name:pr.n,bpm:pr.bpm,key:pr.key,scale:st.scale,kit:st.kit,swing:st.swing,style:st,prog:pr.prog,mel:pr.mel.map(([t,d,deg])=>({t,d,deg}))});
 BUFC.clear();T.head=0;UI.sel={track:P.tracks[0].id,clip:null,sec:null};refreshAll();toast('Loaded preset: '+pr.n+'. Press Play, or jump into ⚡ Jam to add layers.');}
function presetMenu(x,y){const my=coverList();menu(x,y,[...my.slice(0,12).map((c,i)=>['⭐ '+c.n,()=>coverLoad(i),'mine']),...(my.length?[['Delete one of my presets…',()=>menu(x,y,my.map((c,i)=>['🗑 '+c.n,()=>coverDelete(i)]))]]:[]),['⭐ Save this song as a preset',()=>prompt2('Preset name',P.name,n=>coverSave(n||P.name))],['🎙 Make a lo-fi cover of a song playing nearby…',()=>{openJam();coverStart();}],null,...PRESETS.map((p,i)=>[p.n+'  ·  '+STYLES[p.s].n,()=>loadPreset(i),p.bpm+' BPM']),null,
 ...[['Robot Pizza Disco','robot'],['Saguaro Kids','kids'],['Lair Lagoon Drift','lagoon'],["Coco's First Beat",'first']].map(([n,k])=>['Agent Coco: '+n,()=>loadCocoPreset(k)])]);}
// the four Agent Coco Music Room presets, through the normal song import
const COCO_PRESETS={robot:{name:'Robot Pizza Disco',bpm:122,sw:0,key:5,sc:0,pr:2,kit:1,bi:1,ci:3,li:0,k:'x...x...x...x...',s:'................',c:'....x.......x...',h:'x.x.x.x.x.x.x.x.',O:'..x...x...x...x.',p:'.x.x.x.x.x.x.x.x',bass:'2.7..27.2.7..275',ch:'..x..x....x..x..',lead:'e.g.h..g.e.d.e..f.e.d..b.d......g.h.i..h.g.e.g..j...i...h...g.e.'},
 kids:{name:'Saguaro Kids',bpm:116,sw:1,key:2,sc:2,pr:6,kit:4,bi:4,ci:2,li:6,k:'x.....x.x.......',s:'....x.......x...',c:'................',h:'x.x.x.x.x.x.x.x.',O:'................',p:'..........x..x..',bass:'2...2.2...2.5.4.',ch:'x.......x.......',lead:'h.h.j.h.l...j...i.i.l.i.h...g...j.j.k.j.i...f...k...j...i...h.f.'},
 lagoon:{name:'Lair Lagoon Drift',bpm:92,sw:1,key:4,sc:1,pr:4,kit:2,bi:2,ci:6,li:8,k:'x......x..x.....',s:'....x.......x...',c:'................',h:'x.x.x.x.x.x.x...',O:'..............x.',p:'.............x.x',bass:'2.....2.5...6.7.',ch:'x.......x...x...',lead:'h.......g...e...g...f...e.....d.e.......g...i...h...........g.e.'},
 first:{name:"Coco's First Beat",bpm:104,sw:2,key:4,sc:1,pr:1,kit:0,bi:0,ci:7,li:2,k:'x.....x...x..x..',s:'....x.......x...',c:'................',h:'x.x.x.x.x.x.x.x.',O:'..............x.',p:'..x.......x.....',bass:'2..7..2.5.6.7.6.',ch:'..x.x.....x.x...',lead:'h.......j.h.g...e...g...h.......h.......j.h.g...k...j...h...e...'}};
function loadCocoPreset(k){stop();commit();const keep=HIST.u.slice();importCocoSong(JSON.parse(JSON.stringify(COCO_PRESETS[k])));HIST.u=keep;P.loop={on:true,a:0,b:16};
 BUFC.clear();T.head=0;UI.sel={track:P.tracks[0].id,clip:null,sec:null};refreshAll();toast('Loaded '+P.name+' from Agent Coco');}
