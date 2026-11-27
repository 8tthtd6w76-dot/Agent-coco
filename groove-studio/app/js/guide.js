// ===== 🎧 Smart Guide: listens to music in the room through the mic while you jam =====
// It works out the tempo (from the beat it hears) and the key (from the notes it hears), all on this Mac, no internet needed.
// Then it can match your song to that music, start your loop in time with it, light up keys that fit, and give tips.
'use strict';
const GUIDE={lock:false,err:0,on:false,on2:false,o:[],ot:[],pF:0,pL:0,hop:512/48000,chroma:new Float32Array(12),frames:0,bpm:0,bpmConf:0,bpmHist:[],beatT:0,period:0,
 key:-1,minor:false,keyConf:0,heard:[],tip:'',lastTempo:0,lastKey:0,an:null,fbuf:null,pulse:0};
const KK_MAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],KK_MIN=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
async function guideOn(){try{await micOn();}catch(e){toast('Smart Guide needs the microphone. Allow it in System Settings > Privacy & Security > Microphone.',true);return;}
 Object.assign(GUIDE,{on:true,o:[],ot:[],chroma:new Float32Array(12),frames:0,bpm:0,bpmConf:0,bpmHist:[],key:-1,keyConf:0,heard:[],beatT:0,period:0});
 if(!GUIDE.an){const an=AC.createAnalyser();an.fftSize=8192;an.smoothingTimeConstant=0;MIC.src.connect(an);GUIDE.an=an;GUIDE.fbuf=new Float32Array(an.frequencyBinCount);}
 MIC.onFeat=guideFeat;MIC.node.port.postMessage({feat:true});
 clearInterval(GUIDE.timer);GUIDE.timer=setInterval(guideThink,400);GUIDE.ktimer&&clearInterval(GUIDE.ktimer);GUIDE.ktimer=setInterval(guideChroma,120);
 renderPanel();toast('🎧 Smart Guide is listening. Play some music near your Mac.');}
function guideOff(){GUIDE.on=false;clearInterval(GUIDE.timer);clearInterval(GUIDE.ktimer);if(MIC){MIC.node.port.postMessage({feat:false});MIC.onFeat=null;}renderPanel();}
// loudness per hop -> "onset strength": how much louder it just got (kicks and snares make big jumps)
function guideFeat(m){const f=m.feat;GUIDE.hop=m.hop;if(typeof coverFeat==='function')coverFeat(m);
 for(let i=0;i<f.length;i+=2){const lf=Math.log(1e-7+f[i]),ll=Math.log(1e-7+f[i+1]);
  const o=Math.max(0,lf-GUIDE.pF)+1.4*Math.max(0,ll-GUIDE.pL);GUIDE.pF=lf;GUIDE.pL=ll;
  GUIDE.o.push(f[i]<1e-6?0:o);GUIDE.ot.push(m.t0+(i/2)*m.hop);}
 const keep=Math.round(10/m.hop);if(GUIDE.o.length>keep){GUIDE.o.splice(0,GUIDE.o.length-keep);GUIDE.ot.splice(0,GUIDE.ot.length-keep);}}
// tempo: autocorrelation of the onset strength, favoring 80-140 BPM; phase: where the beats line up best
function guideTempo(){const o=GUIDE.o,n=o.length,hop=GUIDE.hop;if(n<Math.round(4/hop))return;
 let mean=0;for(const v of o)mean+=v;mean/=n;const x=o.map(v=>v-mean);let e0=0;for(const v of x)e0+=v*v;if(e0<1e-9)return;
 const lag=b=>60/(b*hop),lo=Math.floor(lag(180)),hi=Math.ceil(lag(60));const r=new Float32Array(hi+2);
 for(let L=lo;L<=hi+1;L++){let s=0;for(let i=0;i+L<n;i++)s+=x[i]*x[i+L];r[L]=s/(n-L);}
 let best=-1,bl=0;for(let L=lo+1;L<=hi;L++){const b=60/(L*hop),w=Math.exp(-.5*Math.pow(Math.log2(b/112)/.55,2));
  const sc=(r[L]+.5*(2*L<=hi+1?r[2*L]:0))*w;if(sc>best&&r[L]>=r[L-1]&&r[L]>=r[L+1]){best=sc;bl=L;}}
 if(!bl)return;const a=r[bl-1],b=r[bl],c=r[bl+1],d=(a-2*b+c)?.5*(a-c)/(a-2*b+c):0,Lf=bl+Math.max(-.5,Math.min(.5,d));
 const bpm=60/(Lf*hop),raw=r[bl]/(e0/n),conf=Math.max(0,Math.min(1,(raw-.08)*2.5));
 // phase: try every offset inside one beat, sum the onsets that land on the beat grid
 let bp=0,bs=-1;const step=Math.max(1,Math.round(Lf/40));for(let ph=0;ph<Lf;ph+=step){let s=0;for(let k=n-1-ph;k>=0;k-=Lf){const i=Math.round(k);s+=x[i]+.5*((x[i-1]||0)+(x[i+1]||0));}if(s>bs){bs=s;bp=ph;}}
 GUIDE.period=Lf*hop;GUIDE.beatT=GUIDE.ot[n-1]-bp*hop;
 GUIDE.bpmHist.push(bpm);if(GUIDE.bpmHist.length>7)GUIDE.bpmHist.shift();const h=[...GUIDE.bpmHist].sort((a,b)=>a-b);const med=h[h.length>>1];
 const agree=GUIDE.bpmHist.filter(v=>Math.abs(v-med)<2.5).length/GUIDE.bpmHist.length;
 if(T.playing&&!GUIDE.phones&&GUIDE.bpm>0)return;   // while our song plays through the speakers the mic hears it too: hold the reading
 GUIDE.bpm=med;GUIDE.bpmConf=conf*agree;GUIDE.raw=raw;}
// key: which notes ring out the most (a running "chroma"), matched to the 24 major and minor keys
function guideChroma(){if(!GUIDE.on||!GUIDE.an||!MIC||MIC.lvl<.01)return;const an=GUIDE.an,F=GUIDE.fbuf;an.getFloatFrequencyData(F);
 const sr=AC.sampleRate,bw=sr/an.fftSize,fr=new Float32Array(12);let tot=0;
 for(let i=Math.ceil(65/bw);i<Math.min(F.length-1,2100/bw);i++){const v=F[i];if(v<-85||v<F[i-1]||v<F[i+1])continue;const mag=Math.pow(10,v/20),f=i*bw,midi=69+12*Math.log2(f/440),pc=((Math.round(midi)%12)+12)%12;
  const w=mag*mag*(f<200?.6:1);fr[pc]+=w;tot+=w;}
 if(tot<=0)return;let mx=0;for(let i=0;i<12;i++){fr[i]/=tot;GUIDE.chroma[i]=GUIDE.chroma[i]*.985+fr[i];if(fr[i]>mx)mx=fr[i];}
 GUIDE.heard=[];for(let i=0;i<12;i++)if(fr[i]>Math.max(.18,mx*.55))GUIDE.heard.push(i);GUIDE.frames++;}
function guideKey(){if(GUIDE.frames<15||(T.playing&&!GUIDE.phones&&GUIDE.key>=0))return;const C=GUIDE.chroma;const corr=(prof,r)=>{let ma=0,mb=0;for(let i=0;i<12;i++){ma+=C[(i+r)%12];mb+=prof[i];}ma/=12;mb/=12;
  let n=0,da=0,db=0;for(let i=0;i<12;i++){const a=C[(i+r)%12]-ma,b=prof[i]-mb;n+=a*b;da+=a*a;db+=b*b;}return n/Math.sqrt(da*db||1);};
 const all=[];for(let r=0;r<12;r++){all.push([corr(KK_MAJ,r),r,false]);all.push([corr(KK_MIN,r),r,true]);}all.sort((a,b)=>b[0]-a[0]);
 let m=0,v=0;for(let i=0;i<12;i++)m+=C[i]/12;for(let i=0;i<12;i++)v+=(C[i]-m)*(C[i]-m)/12;const cv=Math.sqrt(v)/(m||1);GUIDE.cv=cv;
 GUIDE.key=all[0][1];GUIDE.minor=all[0][2];GUIDE.keyConf=Math.max(0,Math.min(1,(all[0][0]-.35)*1.6+(all[0][0]-all[1][0])*2))*Math.max(0,Math.min(1,(cv-.45)/.4));}
const guideKeyName=()=>GUIDE.key<0?'…':NOTE_NAMES[GUIDE.key]+(GUIDE.minor?' minor':' major');
function guideThink(){if(!GUIDE.on)return;guideTempo();guideKey();guideLock();GUIDE.tip=guideTip();guideUpdateStrip();}
function guideTip(){const lvl=MIC?MIC.lvl:0,hasT=GUIDE.bpmConf>.35&&GUIDE.bpm>0,hasK=GUIDE.keyConf>.3&&GUIDE.key>=0;
 if(!GUIDE.o.length||GUIDE.o.length*GUIDE.hop<3&&!hasT)return 'Listening… give me about 5 seconds of music.';
 if(lvl<.004&&!hasT)return 'I can\'t hear much yet. Play music near your Mac or turn it up a little.';
 if(!hasT&&!hasK)return 'Listening… keep the music going.';
 const bpm=Math.round(GUIDE.bpm),song=P.bpm;
 if(hasT&&Math.abs(bpm-song)>2&&Math.abs(bpm*2-song)>3&&Math.abs(bpm/2-song)>2)return `The music is about ${bpm} BPM. Press Match so your loop fits it.`;
 if(hasK&&(GUIDE.key!==P.key||(SCALES[P.scale].s[2]===3)!==GUIDE.minor))return `It sounds like ${guideKeyName()}. Press Match, and the colored keys will fit the music.`;
 const has=f=>P.tracks.some(t=>t.clips.some(c=>t.type==='audio'?c.src:c.notes.length)&&f(t));
 const root=NOTE_NAMES[P.key],sc=SCALES[P.scale].s,third=NOTE_NAMES[(P.key+sc[2%sc.length])%12],fifth=NOTE_NAMES[(P.key+sc[4%sc.length])%12];
 if(!T.playing)return 'You\'re matched! Press "Start in time" and your loop starts right on the beat.';
 if(!has(t=>t.type==='drums'))return 'Try a Kick on every beat: press 1 each time you hear the beat.';
 if(!has(t=>t.quick==='bass'||/bass/i.test(t.name)))return `Pick 🎸 Bass and play ${root} (the key with the ring) on beat 1.`;
 if(!has(t=>['keys','organ','pad'].includes(t.quick)||/chord|piano|organ/i.test(t.name)))return `Pick 🎹 Piano and hold ${root}, ${third} and ${fifth} together.`;
 if(!has(t=>t.quick==='lead'||t.quick==='bell'||t.quick==='pluck'))return 'Pick 🛎️ Bells or 🪕 Pluck and copy a few notes you hear: the keys with dots are sounding now.';
 return 'Sounds great! Try 🎤 Voice to sing over it, or a Shaker (6) on the off-beats.';}
// Match: song tempo + key follow the music; notes already in the song move to the new key
function guideMatch(){const bpm=Math.round(GUIDE.bpm),okT=GUIDE.bpmConf>.25&&bpm>=50&&bpm<=220,okK=GUIDE.keyConf>.2&&GUIDE.key>=0;
 if(!okT&&!okK){toast('Still listening. Give it a few more seconds of music.');return;}
 commit();const msg=[];
 if(okK){let d=((GUIDE.key-P.key)%12+12)%12;if(d>6)d-=12;if(d)P.tracks.forEach(t=>{if(t.type==='synth')t.clips.forEach(c=>c.notes.forEach(n=>n.m+=d));});
  P.key=GUIDE.key;P.scale=GUIDE.minor?1:0;msg.push(guideKeyName());}
 if(okT){let b=bpm;while(b<70)b*=2;while(b>170)b/=2;b=Math.round(b);msg.push(b+' BPM');setBpm(b,true);}
 BUFC.clear();syncTop();renderTimeline();renderPanel();toast('Matched the music: '+msg.join(', '));}
// start the loop exactly on the next beat the guide hears
async function guideSync(){if(!(GUIDE.period>0)||GUIDE.bpmConf<.25){toast('I need to hear a steady beat first.');return;}
 qEnsureLoop();if(T.playing)stop(true);await ensureAudio();
 // the song's beat may be the music's half or double time
 const sp=60/P.bpm,ratio=Math.max(1,Math.round(sp/GUIDE.period)),lat=(AC.outputLatency||0)+(AC.baseLatency||0);
 let t=GUIDE.beatT;const now=AC.currentTime+.12;while(t-lat<now)t+=GUIDE.period*ratio;
 await play(P.loop.a,t-lat);syncTop();renderPanel();toast('Started in time with the music');}
function guideStrip(){const s=el('div','qguide');s.id='qguide';
 s.innerHTML=`<span class="gear">🎧</span><div class="gvu"><i id="gVu"></i></div><span class="gpulse" id="gPulse"></span>
 <div class="gval"><small>Tempo</small><b id="gBpm">…</b></div><div class="gval"><small>Key</small><b id="gKey">…</b></div>`;
 s.append(btn('Match',guideMatch,'Set your song to the tempo and key of the music (notes already in your song move to the new key)','gbtn'),
  btn(COVER?'✓ Make my cover':'🎙 Listen & cover',()=>COVER?coverFinish():coverStart(),COVER?'Turns what it heard into your own lo-fi cover':'Learns a song playing near your Mac (chords, bass, melody, beat) and makes a lo-fi cover of it','gbtn'+(COVER?' on':'')),btn('Start in time',guideSync,'Starts your loop exactly on the next beat of the music','gbtn'),btn(GUIDE.lock?'Stay locked: on':'Stay locked: off',()=>{GUIDE.lock=!GUIDE.lock;renderPanel();},'Keeps nudging your loop so it stays on the music\'s beat, even if the music drifts a little','gbtn'+(GUIDE.lock?' on':'')),btn(GUIDE.phones?'🎧 Headphones: yes':'🎧 Headphones?',()=>{GUIDE.phones=!GUIDE.phones;renderPanel();},'Tell it you use headphones. Then it keeps listening while your song plays. On speakers it holds its reading while your song plays, so it does not hear itself','gbtn'+(GUIDE.phones?' on':'')),el('span','gtip',''));if(COVER){const x=btn('Cancel',coverCancel,'','gbtn');s.append(x);s.querySelector('.gtip').id='cvStatus';}
 setTimeout(guideUpdateStrip,0);return s;}
function guideUpdateStrip(){const b=document.getElementById('gBpm');if(!b)return;const hasT=GUIDE.bpmConf>.25&&GUIDE.bpm>0,hasK=GUIDE.keyConf>.2&&GUIDE.key>=0;
 b.textContent=hasT?Math.round(GUIDE.bpm)+' BPM':'…';b.parentNode.classList.toggle('sure',GUIDE.bpmConf>.5);
 const k=document.getElementById('gKey');k.textContent=hasK?guideKeyName():'…';k.parentNode.classList.toggle('sure',GUIDE.keyConf>.5);
 const t=document.querySelector('#qguide .gtip');if(t&&!COVER)t.textContent=GUIDE.tip;}
// every frame: mic meter, beat pulse, and dots on the keys that are sounding in the room right now
function guideFrame(){const v=document.getElementById('gVu');if(v&&MIC)v.style.width=Math.min(100,MIC.lvl*140)+'%';
 if(GUIDE.period>0&&AC&&GUIDE.bpmConf>.25){const ph=((AC.currentTime-GUIDE.beatT)/GUIDE.period)%1;const p=document.getElementById('gPulse');if(p)p.style.opacity=ph<.15||ph>.97?1:.15;}
 const now=performance.now();if(now-GUIDE.pulse<150)return;GUIDE.pulse=now;
 document.querySelectorAll('.qpiano [data-pc]').forEach(k=>k.classList.toggle('heard',GUIDE.heard.includes(+k.dataset.pc)));}
// Stay locked: keeps your loop from drifting away from the music in the room.
// It only fixes DRIFT: the first readings after the loop starts set the reference offset (that also soaks up speaker->mic delay),
// then it nudges by at most 4 ms at a time. If the mic is just hearing the app's own speakers it measures no drift and does nothing.
// If the corrections keep piling up one way (a feedback loop), it switches itself off instead of chasing.
function guideLock(){if(!T.playing||T.rec||GUIDE.bpmConf<.35||!(GUIDE.period>0))return;const sp=spb(),unit=Math.min(sp,GUIDE.period);
 const big=Math.max(sp,GUIDE.period)/unit;if(Math.abs(big-Math.round(big))>.04)return;
 const lat=(AC.outputLatency||0)+(AC.baseLatency||0),now=AC.currentTime,Lnow=(now-T.t0)/sp,tb=T.t0+Math.round(Lnow)*sp,aud=tb+lat;
 const k=Math.round((aud-GUIDE.beatT)/unit),e=aud-(GUIDE.beatT+k*unit);GUIDE.err=e;
 if(GUIDE.lockKey!==T.lockKey){GUIDE.lockKey=T.lockKey;GUIDE.lockRef=[];GUIDE.lockSum=0;}
 if(GUIDE.lockRef.length<6){GUIDE.lockRef.push(e);return;}
 const ref=[...GUIDE.lockRef].sort((a,b)=>a-b)[3],d=e-ref;GUIDE.drift=d;
 if(!GUIDE.lock||Math.abs(d)<.012||Math.abs(d)>unit*.3)return;
 const step=Math.max(-.004,Math.min(.004,d*.25));T.t0-=step;GUIDE.lockSum+=step;
 if(Math.abs(GUIDE.lockSum)>unit*.25){GUIDE.lock=false;GUIDE.lockSum=0;toast('Stay locked switched off: the mic seems to be hearing Groove Studio itself. Headphones fix that.');renderPanel();}}
