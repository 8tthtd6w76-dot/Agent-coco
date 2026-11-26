// ===== MIDI keyboards (M-VAVE or any USB / Bluetooth MIDI keyboard) in Jam =====
// Keys play the sound picked in Jam (an FM-1 synth). Channel 10 and drum pads play the Jam drums. Knobs turn the FM-1 knobs.
'use strict';
const MIDI={acc:null,names:[],map:{},auto:['tone','mod','wob','echo','rel','vib'],learn:null,tried:false};
// common knob numbers on small keyboards; any other knob gets the next free FM-1 knob the first time you turn it
const MIDI_DEFAULT={1:'vib',7:'vol',74:'tone',71:'mod',72:'rel',93:'echo',76:'wob'};
// General MIDI drum notes -> Jam drums (pads on most keyboards send 36-51)
const MIDI_DRUM={35:0,36:0,37:8,38:1,40:1,39:2,42:3,44:3,46:4,49:4,51:4,70:5,82:5,69:5,56:6,62:7,63:7,64:7,41:9,43:9,45:9,47:9,48:9,50:9};
async function midiInit(){if(MIDI.tried||!navigator.requestMIDIAccess)return;MIDI.tried=true;
 try{const A=await Promise.race([navigator.requestMIDIAccess({sysex:false}),new Promise((_,no)=>setTimeout(()=>no(new Error('timeout')),4000))]);MIDI.acc=A;
  const hook=()=>{const ins=[...A.inputs.values()];ins.forEach(i=>i.onmidimessage=midiMsg);const was=MIDI.names.join();MIDI.names=ins.map(i=>i.name||'MIDI keyboard');
   if(MIDI.names.join()!==was){if(MIDI.names.length&&was==='')toast('🎹 '+MIDI.names[0]+' connected. Play it in Jam!');if(PANEL.tab==='quick')renderPanel();}};
  A.onstatechange=hook;hook();}catch(e){MIDI.err=true;}}
const MIDI_HELD={};
function midiMsg(e){const [st,d1,d2]=e.data,cmd=st&0xf0,ch=st&15;
 if(cmd===0x90&&d2>0){ensureAudio();const v=Math.max(.25,d2/127);
  if(ch===9||(MIDI.padsAsDrums&&MIDI_DRUM[d1]!=null)){const d=QDRUMS[MIDI_DRUM[d1]!=null?MIDI_DRUM[d1]:(d1%10)];qTap(d,0,v);glow(document.querySelector(`.qpad[data-key="${d.key}"]`),PAD_COLORS[d.p],true);return;}
  const q=qSound();MIDI_HELD[d1]=q;qTap(q,d1,v);const kb=document.querySelector(`.qpiano [data-pc="${d1%12}"]`);if(kb)glow(kb,qColor(q),true);if(GUIDE.on)GUIDE.played=performance.now();return;}
 if(cmd===0x80||(cmd===0x90&&d2===0)){const q=MIDI_HELD[d1];if(q){delete MIDI_HELD[d1];qRelease(q,d1);}return;}
 if(cmd===0xB0){if(d1>=120)return;let id=MIDI.map[d1];
  if(MIDI.learn){id=MIDI.learn;for(const c in MIDI.map)if(MIDI.map[c]===id)delete MIDI.map[c];MIDI.map[d1]=id;MIDI.learn=null;toast('Knob '+d1+' now turns '+midiParamName(id));QK.needPanel=true;}
  if(!id&&MIDI_DEFAULT[d1])id=MIDI.map[d1]=MIDI_DEFAULT[d1];
  if(!id){const used=new Set(Object.values(MIDI.map));id=MIDI.auto.find(x=>!used.has(x));if(!id)return;MIDI.map[d1]=id;toast('Knob '+d1+' now turns '+midiParamName(id));}
  const q=qSound(),tr=qTrack(q,true);if(!tr)return;const x=d2/127;
  if(id==='vol'){tr.patch.vol=x;}else{const K=QKNOBS.find(k=>k[0]===id);if(!K)return;K[6](tr.patch,K[2]+(K[3]-K[2])*x);}
  DIRTY=true;MIDI.knobT=performance.now();QK.needPanel=true;return;}}
function midiParamName(id){if(id==='vol')return 'Volume';const K=QKNOBS.find(k=>k[0]===id);return K?K[1]:id;}
function midiMenu(b){midiInit();const r=b.getBoundingClientRect();
 const items=[[MIDI.names.length?'Connected: '+MIDI.names.join(', '):'No MIDI keyboard found yet',()=>{}],null];
 if(!MIDI.names.length)items.push(['How to connect…',()=>toast('Plug the keyboard in with USB (or pair it in Audio MIDI Setup for Bluetooth), then open Jam again. It shows up here.')]);
 items.push(['Knobs: learn Brightness (turn a knob next)',()=>{MIDI.learn='tone';toast('Turn a knob on your keyboard now');}],['Knobs: learn Bite',()=>{MIDI.learn='mod';toast('Turn a knob on your keyboard now');}],
  ['Knobs: learn Wobble',()=>{MIDI.learn='wob';toast('Turn a knob on your keyboard now');}],['Knobs: learn Echo',()=>{MIDI.learn='echo';toast('Turn a knob on your keyboard now');}],
  [(MIDI.padsAsDrums?'✓ ':'')+'Low keys 35–51 play drums',()=>{MIDI.padsAsDrums=!MIDI.padsAsDrums;toast(MIDI.padsAsDrums?'Notes 35–51 now play the Jam drums':'All keys play notes again (channel 10 still plays drums)');}],
  ['Forget knob settings',()=>{MIDI.map={};toast('Knob settings cleared');}],['Look for keyboards again',()=>{MIDI.tried=false;midiInit();}]);
 menu(r.left,r.bottom+4,items);}
