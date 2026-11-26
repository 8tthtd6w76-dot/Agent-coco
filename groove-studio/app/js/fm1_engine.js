// ===== FM-1 engine (v0.44): a 6-operator FM synth modelled on the M-VAVE FM-1 =====
// Copied from the Agent Coco game (js/fm1_engine.js v0.44) so patches stay identical. Needs MUS, gainTo, filt, MUSIC_LITE from audio.js.
// Patch: {p preset, alg 0-7, ops:[[ratio,level,detune]x6], env:[a,d,s,r], menv:[decay,sustain], mod, tone,
//         lfo:[rate,vib,trem,delay], fx:[reverb,echo,echoTime 0-2], glide, arp:[mode,rate,oct,gate], vol}

// algorithms: which operator modulates which ([from,to], 0 = OP1). Carriers are the ones that modulate nothing.
const FM_ALGS=[
 {n:'STACK',m:[[5,4],[4,3],[3,2],[2,1],[1,0]]},
 {n:'2 + 4',m:[[1,0],[5,4],[4,3],[3,2]]},
 {n:'3 + 3',m:[[2,1],[1,0],[5,4],[4,3]]},
 {n:'3 PAIRS',m:[[1,0],[3,2],[5,4]]},
 {n:'TWIN',m:[[1,0],[2,0],[4,3],[5,3]]},
 {n:'ONE TO 3',m:[[5,0],[5,1],[5,2],[4,3]]},
 {n:'4 + 2',m:[[3,2],[2,1],[1,0],[5,4]]},
 {n:'ORGAN',m:[]}];
FM_ALGS.forEach(a=>{const src=new Set(a.m.map(x=>x[0]));a.car=[0,1,2,3,4,5].filter(i=>!src.has(i));});
const FM_PRESETS=[
 {n:'SYNC LEAD',alg:0,ops:[[1,1,0],[2,.32,0],[1,.25,3],[3,.12,0],[1,0,0],[1,0,0]],env:[.01,.3,.75,.12],menv:[.8,.7],mod:1,tone:.75,lfo:[5.5,.25,0,.25],fx:[.35,.2,1],glide:0},
 {n:'E.PIANO',alg:3,ops:[[1,1,0],[1,.3,0],[1,.55,4],[14,.07,0],[1,0,0],[1,0,0]],env:[.003,.9,.25,.3],menv:[.45,.15],mod:1,tone:.7,lfo:[4.5,0,.12,0],fx:[.35,0,1],glide:0},
 {n:'BELL',alg:3,ops:[[1,1,0],[3.5,.45,0],[1,.5,6],[7,.25,0],[.5,.3,0],[1.41,.35,0]],env:[.002,1.6,0,.9],menv:[1.2,.1],mod:1,tone:.85,lfo:[5,0,0,0],fx:[.55,.15,2],glide:0},
 {n:'FM BASS',alg:1,ops:[[.5,1,0],[.5,.55,0],[.5,.6,-4],[1,.3,0],[2,.15,0],[1,0,0]],env:[.003,.25,.6,.06],menv:[.18,.25],mod:1,tone:.55,lfo:[5,0,0,0],fx:[0,0,1],glide:0},
 {n:'BRASS',alg:6,ops:[[1,1,0],[1,.42,0],[1,.22,0],[1,.1,0],[1,.55,7],[1,.3,0]],env:[.06,.3,.8,.12],menv:[.5,.8],mod:1,tone:.6,lfo:[5.2,.2,0,.35],fx:[.4,0,1],glide:0},
 {n:'ORGAN',alg:7,ops:[[.5,.7,0],[1,.8,0],[1.5,.45,0],[2,.5,0],[3,.3,0],[4,.25,0]],env:[.008,.1,1,.08],menv:[1,1],mod:1,tone:.65,lfo:[6.5,.1,.15,0],fx:[.4,0,1],glide:0},
 {n:'MARIMBA',alg:3,ops:[[1,1,0],[4,.3,0],[1,.3,0],[10,.15,0],[1,0,0],[1,0,0]],env:[.002,.4,0,.2],menv:[.12,0],mod:1,tone:.8,lfo:[5,0,0,0],fx:[.4,0,1],glide:0},
 {n:'PLUCK',alg:2,ops:[[1,1,0],[2,.4,0],[3,.2,0],[1,.45,7],[1,.3,0],[5,.1,0]],env:[.002,.35,.05,.2],menv:[.2,.05],mod:1,tone:.75,lfo:[5,0,0,0],fx:[.3,.3,1],glide:0},
 {n:'CLAV',alg:1,ops:[[1,1,0],[3,.55,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0]],env:[.002,.2,.3,.05],menv:[.15,.3],mod:1,tone:.9,lfo:[5,0,0,0],fx:[.2,0,1],glide:0},
 {n:'GLASS PAD',alg:5,ops:[[1,.8,0],[2,.5,5],[3,.3,-5],[1,.6,3],[.5,.35,0],[4,.18,0]],env:[.35,.8,.75,.6],menv:[1.5,.6],mod:1,tone:.6,lfo:[.8,.15,.2,.2],fx:[.7,.2,2],glide:0},
 {n:'WOBBLE',alg:0,ops:[[1,1,0],[1,.5,0],[2,.3,0],[1,.2,0],[1,0,0],[1,0,0]],env:[.01,.3,.8,.1],menv:[1,.9],mod:1,tone:.5,lfo:[3,.05,.6,0],fx:[.3,.25,0],glide:.3},
 {n:'WHISTLE',alg:1,ops:[[2,1,0],[2,.08,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0]],env:[.04,.2,.85,.1],menv:[1,1],mod:1,tone:.7,lfo:[6,.35,0,.2],fx:[.45,.2,1],glide:.4}];
const FM_PAGES=['HOME','EDIT','ENV','LFO','FX','ARP','SEQ'];
const FM_RATIOS=[.5,1,1.41,2,2.5,3,3.5,4,5,6,7,8,10,12,14,16];
const FM_ARP=['OFF','UP','DOWN','UP-DOWN','RANDOM'],FM_ARPRATE=['1/8','1/16','1/32'],FM_ECHO=['1/8','3/16','1/4'];
function fm1Patch(i){const P=JSON.parse(JSON.stringify(FM_PRESETS[i]));P.p=i;delete P.n;P.arp=[0,1,1,.6];P.vol=.8;return P;}
// make sure a patch from a file or an old song has every field
function fm1Fix(P){const D=fm1Patch(P&&FM_PRESETS[P.p]?P.p:0);if(!P||typeof P!=='object')return D;for(const k in D)if(P[k]===undefined)P[k]=D[k];
 if(!Array.isArray(P.ops)||P.ops.length!==6)P.ops=D.ops;P.alg=Math.max(0,Math.min(7,P.alg|0));return P;}
function fm1Of(S){return S.fm=fm1Fix(S.fm);}

// one held note. Returns {stop(time)}. f = frequency in Hz.
function fm1Start(P,t,f,v,out,glideFrom){const A=MUS.a,al=FM_ALGS[P.alg],[a,d,s,r]=P.env,peak=.085*v*(P.vol==null?.8:P.vol);
 const vg=gainTo(out,P.fx[0]*.6);const p=vg.gain;p.setValueAtTime(0,t);p.linearRampToValueAtTime(peak,t+Math.max(.002,a));p.setTargetAtTime(peak*s,t+Math.max(.002,a),Math.max(.01,d/3));
 const lp=filt('lowpass',250+P.tone*P.tone*12000,.7,vg);let sink=lp;
 const live=[0,1,2,3,4,5].map(i=>P.ops[i][1]>.001),car=al.car.filter(i=>live[i]),csum=car.reduce((x,i)=>x+P.ops[i][1],0)||1;
 const [lr,vib,trem,ldel]=P.lfo;let lfo=null;
 if(trem>0){const tg=A.createGain();tg.gain.value=1-trem*.5;tg.connect(lp);sink=tg;lfo=A.createOscillator();lfo.frequency.value=lr;const td=A.createGain();td.gain.value=trem*.5;lfo.connect(td);td.connect(tg.gain);}
 let vd=null;if(vib>0){if(!lfo){lfo=A.createOscillator();lfo.frequency.value=lr;}vd=A.createGain();vd.gain.setValueAtTime(0,t);vd.gain.linearRampToValueAtTime(vib*45,t+ldel+.02);lfo.connect(vd);}
 const O=[],G=[];
 for(let i=0;i<6;i++){if(!live[i])continue;const [ra,lv,dt]=P.ops[i],o=A.createOscillator(),fr=f*ra;
  if(glideFrom&&P.glide>0){o.frequency.setValueAtTime(glideFrom*ra,t);o.frequency.exponentialRampToValueAtTime(fr,t+.02+P.glide*.25);}else o.frequency.setValueAtTime(fr,t);
  o.detune.value=dt;if(vd)vd.connect(o.detune);const g=A.createGain();o.connect(g);O[i]=o;G[i]=g;
  if(car.includes(i))g.gain.value=lv/csum;
  else{const pk=lv*6*P.mod*fr,[md,ms]=P.menv;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+Math.max(.002,a*.6));g.gain.setTargetAtTime(pk*ms,t+Math.max(.002,a*.6),Math.max(.01,md/3));}}
 for(const i of car)G[i].connect(sink);
 for(const [fr,to] of al.m)if(O[fr]&&O[to])G[fr].connect(O[to].frequency);
 O.forEach(o=>o&&o.start(t));if(lfo)lfo.start(t);
 return {stop(rt){rt=Math.max(rt,t+Math.max(.002,a));p.cancelScheduledValues(rt);p.setTargetAtTime(0,rt,Math.max(.01,r/4));const e=rt+r*1.6+.08;O.forEach(o=>o&&o.stop(e));if(lfo)lfo.stop(e);}};}
// one note of a set length, with the echo repeats (sd = one 16th note in seconds)
function fm1Note(P,t,f,dur,v,out,sd,glideFrom){fm1Start(P,t,f,v,out,glideFrom).stop(t+dur);
 const e=P.fx[1];if(e>0){const dt=[2,3,4][P.fx[2]|0]*(sd||.15);for(let k=1;k<=(MUSIC_LITE?1:2);k++)fm1Start(P,t+dt*k,f,v*Math.pow(e*.7,k),out).stop(t+dt*k+dur);}}
