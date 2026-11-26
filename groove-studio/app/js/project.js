// ===== Groove Studio project model: tracks, clips, undo, save/load, Agent Coco song import =====
'use strict';
// Units: time is in BEATS (quarter notes). A bar is 4 beats. Every clip loops its content every `plen` beats,
// so stretching a clip's right edge repeats the beat / melody / vocal loop.
let P=null;                 // the open project
const AUDIO={};             // audio pool: id -> {sr, d: Float32Array mono}. Clips point at these; never edited in place.
const COLORS=['#ff6b6b','#ffb347','#ffd93d','#6bcb77','#4dd4ff','#7b8cff','#c77dff','#ff7eb6'];
let NEXT_ID=1;const uid=p=>p+(NEXT_ID++).toString(36)+Math.random().toString(36).slice(2,5);

function newTrack(type,name){const n=P?P.tracks.length:0;
 const t={id:uid('t'),type,name:name||({audio:'Voice',drums:'Beat',synth:'Synth'})[type]+' '+(1+(P?P.tracks.filter(x=>x.type===type).length:0)),
  color:COLORS[n%COLORS.length],vol:.8,pan:0,mute:false,solo:false,arm:type==='audio',fx:{tone:1,rev:type==='audio'?.15:.08,dly:0},clips:[]};
 if(type==='drums'){t.kit=0;t.pads=PAD_NAMES.map(()=>({vol:1,tune:0,sample:null,name:null}));}
 if(type==='synth')t.patch=fm1Patch(1);
 return t;}
function newProject(){NEXT_ID=1;for(const k in AUDIO)delete AUDIO[k];
 P={format:'groove-studio',v:1,name:'Untitled Song',bpm:100,swing:0,key:0,scale:0,metro:true,countIn:true,
  loop:{on:true,a:0,b:16},sections:[],tracks:[],latency:0};
 const d=newTrack('drums','Beat');d.clips.push(newClip('drums',0,16,4));P.tracks.push(d);
 const s=newTrack('synth','Keys');P.tracks.push(s);
 P.tracks.push(newTrack('audio','Vocals'));
 // a starter groove so the first Play makes sound
 const c=d.clips[0];[[0,0],[1.5,0],[2.5,0],[1,1],[3,1]].forEach(([t,p])=>c.notes.push({t,p,v:1}));for(let i=0;i<8;i++)c.notes.push({t:i/2,p:3,v:i%2?.6:.9});
 return P;}
function newClip(type,start,len,plen){const c={id:uid('c'),start,len,plen:plen||len,name:''};if(type==='audio'){c.src=null;c.off=0;c.gain=1;c.pitch=0;c.rev=false;c.fin=0;c.fout=0;}else c.notes=[];return c;}
const trackById=id=>P.tracks.find(t=>t.id===id);
function clipById(id){for(const t of P.tracks){const c=t.clips.find(c=>c.id===id);if(c)return {t,c};}return null;}
function songEnd(){let e=0;for(const t of P.tracks)for(const c of t.clips)e=Math.max(e,c.start+c.len);for(const s of P.sections)e=Math.max(e,s.bar*4+s.len*4);return e;}
function audioBeats(id,off=0){const A=AUDIO[id];return A?(A.d.length/A.sr-off)*P.bpm/60:0;}

// ---------- undo / redo (audio pool is append-only, so a JSON snapshot of P is enough) ----------
const HIST={u:[],r:[],last:0};
function commit(label){HIST.u.push(JSON.stringify(P));if(HIST.u.length>150)HIST.u.shift();HIST.r=[];DIRTY=true;}
function undo(){if(!HIST.u.length)return false;HIST.r.push(JSON.stringify(P));P=JSON.parse(HIST.u.pop());DIRTY=true;return true;}
function redo(){if(!HIST.r.length)return false;HIST.u.push(JSON.stringify(P));P=JSON.parse(HIST.r.pop());DIRTY=true;return true;}
let DIRTY=false;

// ---------- save / load: one .groovestudio file with the audio inside ----------
function usedAudio(){const s=new Set();for(const t of P.tracks){for(const c of t.clips)if(c.src)s.add(c.src);if(t.pads)t.pads.forEach(p=>p.sample&&s.add(p.sample));}return s;}
function serialize(){const audio={};for(const id of usedAudio())if(AUDIO[id])audio[id]={sr:AUDIO[id].sr,b:f32ToB64(AUDIO[id].d)};
 return JSON.stringify({format:'groove-studio',v:1,project:P,audio});}
function deserialize(text){const o=JSON.parse(text);if(!o||o.format!=='groove-studio'||!o.project)throw new Error('Not a Groove Studio file');
 for(const k in AUDIO)delete AUDIO[k];for(const id in o.audio||{})AUDIO[id]={sr:o.audio[id].sr,d:b64ToF32(o.audio[id].b)};
 P=fixProject(o.project);HIST.u=[];HIST.r=[];DIRTY=false;return P;}
function fixProject(p){const D={bpm:100,swing:0,key:0,scale:0,metro:true,countIn:true,loop:{on:false,a:0,b:16},sections:[],tracks:[],latency:0,name:'Untitled Song'};
 for(const k in D)if(p[k]===undefined)p[k]=D[k];
 p.tracks.forEach(t=>{if(t.type==='synth')t.patch=fm1Fix(t.patch);if(t.type==='drums'&&!t.pads)t.pads=PAD_NAMES.map(()=>({vol:1,tune:0,sample:null,name:null}));t.fx=Object.assign({tone:1,rev:0,dly:0},t.fx);});
 return p;}

// ---------- Agent Coco song import (.cocosong.json or a COCO1: code from the game / phone Groove Studio) ----------
const G_SCALES=[[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,5,7,9,11]];
const G_PROGS=[[[0,'m9'],[0,'m9'],[5,'9'],[5,'9']],[[0,'m9'],[0,'m9'],[8,'maj7'],[7,'7s9']],[[0,'m7'],[5,'m7'],[10,'maj7'],[3,'maj7']],[[0,'m7'],[8,'maj7'],[3,'maj7'],[10,'7']],
 [[0,'m7'],[10,'M'],[8,'maj7'],[5,'m7']],[[0,'maj7'],[9,'m7'],[5,'maj7'],[7,'9']],[[0,'M'],[7,'M'],[9,'m'],[5,'M']],[[0,'maj9'],[5,'maj9'],[0,'maj9'],[5,'maj9']]];
const G_QUAL={m:[0,3,7,12],M:[0,4,7,12],m7:[0,3,7,10],m9:[3,7,10,14],m11:[3,10,14,17],7:[0,4,7,10],9:[4,7,10,14],13:[4,10,14,21],'7s9':[4,10,15],'7b9':[4,7,10,13],
 maj7:[0,4,7,11],maj9:[4,7,11,14],m6:[3,7,9,14],mM7:[0,3,7,11],dim7:[0,3,6,9],sus:[5,7,10,14],aug:[0,4,8,12],m7b5:[0,3,6,10]};
const G_BASS_IV=[-5,-3,0,2,5,7,10,12];
// game kit -> which pad its "percussion" lane uses (cowbell, shaker, tom, blips, conga)
const G_PERC_PAD=[9,10,7,14,11],G_KIT=[0,3,1,2,4];
function parseCocoSong(t){t=String(t||'').trim();const m=/COCO1:([A-Za-z0-9+/=]+)/.exec(t);let S=null;
 try{if(m)S=JSON.parse(decodeURIComponent(escape(atob(m[1]))));}catch(e){}
 if(!S)try{const j=JSON.parse(t);S=j&&j.song?j.song:j;}catch(e){}
 return S&&typeof S==='object'&&typeof S.k==='string'?S:null;}
function importCocoSong(S){
 const pad16=s=>(String(s||'')+'.'.repeat(16)).slice(0,16),patOf=L=>{const i='ABC'.indexOf(L);return i>0&&S.pats&&S.pats[i-1]?S.pats[i-1]:S;};
 const songBars=S.bars&&S.bars.length>=4?S.bars:G_PROGS[S.pr|0]||G_PROGS[0],barsOf=L=>{const Pt=patOf(L);return Pt!==S&&Pt.bars&&Pt.bars.length>=4?Pt.bars:songBars;};
 const arr=S.arr&&S.arr.length?S.arr:'A',key=S.key|0,sc=G_SCALES[S.sc|0]||G_SCALES[1];
 const leadMidi=d=>{let b=60+key;if(key>=7)b-=12;return b+sc[d%7]+12*Math.floor(d/7);};
 const dr=newTrack('drums','Beat'),bs=newTrack('synth','Bass'),ch=newTrack('synth','Chords'),ld=newTrack('synth','Lead');
 dr.kit=G_KIT[S.kit|0]||0;bs.patch=fm1Patch(3);ch.patch=fm1Patch(S.ci===2?5:S.ci===5?9:1);ld.patch=S.li===9&&S.fm?fm1Fix(JSON.parse(JSON.stringify(S.fm))):fm1Patch(0);
 ch.vol=.65;ch.fx.rev=.2;ld.fx.dly=.2;
 const sw=[0,.08,.15,.22][S.sw|0]||0;let bar=0;const sections=[];
 for(let e=0;e<arr.length;e++){const L=arr[e],Pt=patOf(L),bars=barsOf(L),nb=bars.length,st=bar*4;
  const dc=newClip('drums',st,nb*4,4),bc=newClip('synth',st,nb*4,nb*4),cc=newClip('synth',st,nb*4,nb*4),lc=newClip('synth',st,nb*4,nb*4);
  const lanes=[['k',0],['s',1],['c',2],['h',3],['O',4],['p',G_PERC_PAD[S.kit|0]||9]];
  for(const [k,pad] of lanes){const s=pad16(Pt[k]);for(let i=0;i<16;i++){const c=s[i];if(c==='.')continue;if(k==='h'&&c==='o'){dc.notes.push({t:i/4,p:4,v:.7});continue;}dc.notes.push({t:i/4,p:pad,v:c==='g'?.35:i%2&&k==='h'?.6:.9});}}
  bars.forEach(([o,q],b)=>{const root=(36+key+o)%12+36,qv=G_QUAL[q]||G_QUAL.m7;
   const bstr=pad16(Pt.bass4?Pt.bass4[b%Pt.bass4.length]:Pt.bass),cstr=pad16(Pt.ch4?Pt.ch4[b%Pt.ch4.length]:Pt.ch);
   for(let i=0;i<16;i++){const c=bstr[i];if(c==='.')continue;let iv=c==='m'?3:c==='M'?4:G_BASS_IV[+c];if(iv===undefined||isNaN(iv))continue;
    let j=i+1;while(j<16&&bstr[j]==='.'&&j-i<3)j++;bc.notes.push({t:b*4+i/4,d:Math.max(.25,(j-i)/4*.9),m:root+iv,v:.9});}
   const hold=S.ci===5?16:S.ci===7?2:4;
   for(let i=0;i<16;i++){const c=cstr[i];if(c!=='x'&&c!=='X'&&c!=='g')continue;let j=i+1;while(j<16&&cstr[j]==='.'&&j-i<hold)j++;
    qv.forEach(iv=>cc.notes.push({t:b*4+i/4,d:Math.max(.2,(j-i)/4*.92),m:root+24+iv,v:c==='g'?.35:c==='X'?1:.75}));}});
  const lead=(String(Pt.lead||'')+'.'.repeat(16*nb)).slice(0,16*nb),pos=[];for(let i=0;i<lead.length;i++)if(lead[i]!=='.')pos.push(i);
  pos.forEach((p,j)=>{const nx=j+1<pos.length?pos[j+1]:lead.length;lc.notes.push({t:p/4,d:Math.min(nx-p,S.lh||4)/4*.95,m:leadMidi(lead.charCodeAt(p)-97)+12*(S.lo||0),v:.9});});
  dr.clips.push(dc);if(bc.notes.length)bs.clips.push(bc);if(cc.notes.length)ch.clips.push(cc);if(lc.notes.length)ld.clips.push(lc);
  sections.push({id:uid('s'),bar,len:nb,name:'Part '+L});bar+=nb;}
 newProject();P.tracks=[dr,bs,ch,ld,newTrack('audio','Vocals')];P.tracks.forEach((t,i)=>t.color=COLORS[i%COLORS.length]);
 P.name=String(S.name||'Agent Coco Song').slice(0,40);P.bpm=S.bpm||100;P.swing=sw;P.key=key;P.scale=[1,2,0][S.sc|0]||0;P.sections=sections;P.loop={on:false,a:0,b:bar*4};
 HIST.u=[];HIST.r=[];return P;}
