// ===== FM-1 view of the Home Studio (v0.44) =====
// Tab (or the view tabs top-left) flips the Home Studio between the laptop grid and a big playable FM-1.
// Both views edit the same song: the FM-1 plays and records the song's LEAD, and its sound is saved in the song (S.fm).
// Laptop keys: A W S E D F T G Y H U J K O L P ; ' play notes, Z/X octave, R record, Space play/stop, Tab grid view.
// Mouse: click/drag across the keys, click or scroll knobs, click buttons. Gamepad: left/right pick a key, A plays it,
// up/down change preset, Y/X octave, Start play/stop, B menu.
const FMV_BASE=53;   // lowest key = F3, 27 keys up to G5, like the real FM-1
const FMV_KEYS=(()=>{const K=[];let w=0;for(let s=0;s<27;s++){const pc=(FMV_BASE+s)%12,blk=[1,3,6,8,10].includes(pc);K.push(blk?{s,blk,x:168+w*28.5-9.5,w:19}:{s,blk,x:168+w*28.5+1.5,w:25.5});if(!blk)w++;}
 const lab=['OP1','OP2','OP3','OP4','OP5','OP6','PIT','GLO','MONO','POLY',''];K.filter(k=>k.blk).forEach((k,i)=>k.lab=lab[i]);return K;})();
const FMV_CODE={};['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon','Quote'].forEach((c,i)=>FMV_CODE[c]=i+7);  // A = C
const FMV_T=[.002,.005,.01,.02,.04,.07,.1,.15,.25,.35,.5,.8,1.2,1.6,2.5],FMV_RATE=[.2,.5,1,2,3,4,5,5.5,6,7,8,10,12];
const near=(L,v)=>{let b=0;L.forEach((x,i)=>{if(Math.abs(x-v)<Math.abs(L[b]-v))b=i;});return b;};
const stepL=(L,v,d)=>L[Math.max(0,Math.min(L.length-1,near(L,v)+d))];
const clamp01=(v,d,st=.05)=>Math.round(Math.max(0,Math.min(1,v+d*st))*100)/100;
const pct=v=>Math.round(v*99);
const tms=v=>v<1?Math.round(v*1000)+'ms':v.toFixed(1)+'s';
// the four KNOB1-4 jobs on each screen page
function fmvParams(G){const P=fm1Of(G.S),V=G.fmv,o=P.ops[V.op];return [
 [{n:'MOD',t:()=>P.mod.toFixed(1),c:d=>P.mod=Math.max(0,Math.min(2,Math.round((P.mod+d*.1)*10)/10))},{n:'TONE',t:()=>pct(P.tone),c:d=>P.tone=clamp01(P.tone,d)},
  {n:'ATTACK',t:()=>tms(P.env[0]),c:d=>P.env[0]=stepL(FMV_T,P.env[0],d)},{n:'RELEASE',t:()=>tms(P.env[3]),c:d=>P.env[3]=stepL(FMV_T,P.env[3],d)}],
 [{n:'OP',t:()=>V.op+1,c:d=>{V.op=(V.op+d+6)%6;},ui:1},{n:'RATIO',t:()=>o[0],c:d=>o[0]=stepL(FM_RATIOS,o[0],d)},{n:'LEVEL',t:()=>pct(o[1]),c:d=>o[1]=clamp01(o[1],d)},{n:'DETUNE',t:()=>(o[2]>0?'+':'')+o[2],c:d=>o[2]=Math.max(-20,Math.min(20,o[2]+d))}],
 ['ATTACK','DECAY','SUSTAIN','RELEASE'].map((n,i)=>i===2?{n,t:()=>pct(P.env[2]),c:d=>P.env[2]=clamp01(P.env[2],d)}:{n,t:()=>tms(P.env[i]),c:d=>P.env[i]=stepL(FMV_T,P.env[i],d)}),
 [{n:'RATE',t:()=>P.lfo[0]+'Hz',c:d=>P.lfo[0]=stepL(FMV_RATE,P.lfo[0],d)},{n:'VIBRATO',t:()=>pct(P.lfo[1]),c:d=>P.lfo[1]=clamp01(P.lfo[1],d)},
  {n:'TREMOLO',t:()=>pct(P.lfo[2]),c:d=>P.lfo[2]=clamp01(P.lfo[2],d)},{n:'DELAY',t:()=>tms(P.lfo[3]),c:d=>P.lfo[3]=stepL(FMV_T,P.lfo[3],d)}],
 [{n:'REVERB',t:()=>pct(P.fx[0]),c:d=>P.fx[0]=clamp01(P.fx[0],d)},{n:'ECHO',t:()=>pct(P.fx[1]),c:d=>P.fx[1]=clamp01(P.fx[1],d)},
  {n:'ECHO TIME',t:()=>FM_ECHO[P.fx[2]],c:d=>P.fx[2]=Math.max(0,Math.min(2,P.fx[2]+d))},{n:'GLIDE',t:()=>P.glide?pct(P.glide):'OFF',c:d=>P.glide=clamp01(P.glide,d,.1)}],
 [{n:'MODE',t:()=>FM_ARP[P.arp[0]],c:d=>P.arp[0]=(P.arp[0]+d+5)%5},{n:'RATE',t:()=>FM_ARPRATE[P.arp[1]],c:d=>P.arp[1]=Math.max(0,Math.min(2,P.arp[1]+d))},
  {n:'OCTAVES',t:()=>P.arp[2],c:d=>P.arp[2]=Math.max(1,Math.min(3,P.arp[2]+d))},{n:'GATE',t:()=>pct(P.arp[3]),c:d=>P.arp[3]=Math.max(.1,clamp01(P.arp[3],d,.1))}],
 [{n:'BAR',t:()=>Math.floor(V.pos/16)+1,c:d=>{const n=G.nbars()*16;V.pos=(V.pos+d*16+n)%n;},ui:1},{n:'STEP',t:()=>V.pos%16+1,c:d=>{const n=G.nbars()*16;V.pos=(V.pos+d+n)%n;},ui:1},
  {n:'NOTE',t:()=>{const c=G.pat().lead[V.pos];return c==='.'?'--':songNoteName(leadMidi(G.S,c.charCodeAt(0)-97));},c:d=>{const Pt=G.pat(),c=Pt.lead[V.pos],v=c==='.'?G.lastLead:Math.max(0,Math.min(14,c.charCodeAt(0)-97+d));G.lastLead=v;Pt.lead=setCh(Pt.lead,V.pos,String.fromCharCode(97+v));G.refresh();fmvPlay(G,leadMidi(G.S,v),.25);},ui:1},
  {n:'LENGTH',t:()=>(G.S.lh||4)+'/16',c:d=>{G.S.lh=Math.max(1,Math.min(8,(G.S.lh||4)+d));G.refresh();},ui:1}]][V.page];}

function fmvInit(G){if(!G.fmv)G.fmv={page:0,op:0,oct:0,cur:7,pos:0,rec:false,held:new Map(),arp:[],arpNext:0,arpI:0,lastF:0,lit:new Map(),gp:-1};return G.fmv;}
// the FM-1 is the song's LEAD sound as soon as you play or tweak it
function fmvOwn(G){if(G.S.li!==FM1_LI){G.S.li=FM1_LI;G.refresh();toast('LEAD sound is now the FM-1 (change it with the LEAD knob)','#ffd23a');}}
function fmvOut(G){unlockAudio();if(muted||!AC||AC.state!=='running')return null;return G.previewGain();}
function fmvPlay(G,m,dur){const g=fmvOut(G);if(!g)return;fm1Note(fm1Of(G.S),AC.currentTime+.005,mtof(m),dur,.9,g,60/G.S.bpm/4);}
function fmvMidi(G,s){return FMV_BASE+s+12*G.fmv.oct;}
function fmvTouch(G){const P=fm1Of(G.S);P.ed=1;fmvOwn(G);G.refresh();}
function fmvOn(G,s){const V=fmvInit(G),P=fm1Of(G.S),m=fmvMidi(G,s);if(V.held.has(s))return;fmvOwn(G);V.lit.set(s,TIME+.15);
 if(P.arp[0]){V.held.set(s,null);V.arp.push(m);return;}
 const g=fmvOut(G),t=AC?AC.currentTime+.005:0;let vo=null;if(g){vo=fm1Start(P,t,mtof(m),.9,g,V.lastF);V.lastF=mtof(m);}V.held.set(s,{vo,t,m});fmvRecord(G,m);}
function fmvOff(G,s){const V=G.fmv;if(!V||!V.held.has(s))return;const h=V.held.get(s);V.held.delete(s);
 if(!h){const m=fmvMidi(G,s),i=V.arp.indexOf(m);if(i>=0)V.arp.splice(i,1);else V.arp=V.arp.filter(x=>(x-FMV_BASE)%12!==s%12);return;}
 if(!h.vo||!AC)return;const P=fm1Of(G.S),now=AC.currentTime;h.vo.stop(now);const e=P.fx[1],g=G.previewGain();
 if(e>0&&g){const dt=[2,3,4][P.fx[2]]*60/G.S.bpm/4,dur=Math.max(.05,now-h.t);for(let k=1;k<=2;k++)fm1Start(P,h.t+dt*k,mtof(h.m),.9*Math.pow(e*.7,k),g).stop(h.t+dt*k+dur);}}
function fmvAllOff(G){const V=G.fmv;if(!V)return;[...V.held.keys()].forEach(s=>fmvOff(G,s));V.arp=[];}
// REC: while the song plays, a note lands on the nearest 16th; while stopped it goes at the SEQ cursor and the cursor moves on
function fmvRecord(G,m){const V=G.fmv;if(!V.rec)return;const S=G.S;while(m<leadMidi(S,0)-1)m+=12;while(m>leadMidi(S,14)+1)m-=12;const deg=grooveKeyDeg(S,m);G.lastLead=deg;
 if(G.playing&&MT.track&&AC&&MT.name==='__studio'){const T=MT.track,cur=Math.round(MT.pos-(MT.next-AC.currentTime)/T.sd),idx=((cur%T.N)+T.N)%T.N,
   sl=slotAt(S,Math.floor(idx/16)),Pt=patOf(S,songArr(S)[sl.entry]),i=sl.barIn*16+idx%16;
  if(Pt.lead.length<16*sl.nb)Pt.lead+='.'.repeat(16*sl.nb-Pt.lead.length);Pt.lead=setCh(Pt.lead,i,String.fromCharCode(97+deg));V.flash=TIME;G.refresh();}
 else{const Pt=G.pat(),n=16*G.nbars();Pt.lead=setCh(Pt.lead,V.pos,String.fromCharCode(97+deg));V.pos=(V.pos+1)%n;V.flash=TIME;G.refresh();}}
function fmvPreset(G,d){const P=fm1Of(G.S),i=((P.p||0)+d+FM_PRESETS.length)%FM_PRESETS.length,N=fm1Patch(i);N.arp=P.arp;N.vol=P.vol;G.S.fm=N;fmvOwn(G);G.refresh();fmvPlay(G,leadMidi(G.S,7),.35);}
function fmvKnob(G,k,d){const V=G.fmv,P=fm1Of(G.S);
 if(k==='MASTER'){P.vol=clamp01(P.vol,d);fmvTouch(G);return;}if(k==='SELECT'){V.page=(V.page+d+FM_PAGES.length)%FM_PAGES.length;SFX.move();return;}
 if(k==='PRESETS'){fmvPreset(G,d);return;}if(k==='ALGORITHM'){P.alg=(P.alg+d+8)%8;fmvTouch(G);return;}
 const p=fmvParams(G)[k];p.c(d);if(!p.ui)fmvTouch(G);else G.dirty=G.dirty||V.page===6;SFX.move();}
function fmvButton(G,b){const V=G.fmv,P=fm1Of(G.S);SFX.move();
 const pg={FX:4,ENV:2,LFO:3,EDIT:1,HOME:0,SEQ:6}[b];if(pg!=null){V.page=pg;return;}
 if(b==='SEL')V.page=(V.page+1)%FM_PAGES.length;else if(b==='GLO'){P.glide=P.glide?0:.4;fmvTouch(G);toast('Glide '+(P.glide?'ON':'OFF'),'#2de2f5');}
 else if(b==='ARP'){if(V.page!==5){V.page=5;if(!P.arp[0])P.arp[0]=1;}else P.arp[0]=P.arp[0]?0:1;fmvTouch(G);fmvAllOff(G);toast('ARP '+FM_ARP[P.arp[0]]+(P.arp[0]?': hold keys':''),'#2de2f5');}
 else if(b==='SAVE')G.save();else if(b==='PLAY'){if(G.playing)G.stop();else G.play();}
 else if(b==='REC'){V.rec=!V.rec;if(V.rec)fmvOwn(G);toast(V.rec?(G.playing?'REC: play along, notes land on the beat':'REC: each note goes at the SEQ cursor'):'REC off',V.rec?'#ff5a8a':'#9fb');}
 else if(b==='OCT-'||b==='OCT+'){fmvAllOff(G);V.oct=Math.max(-2,Math.min(2,V.oct+(b==='OCT+'?1:-1)));}}
function fmvArp(G){const V=G.fmv,P=fm1Of(G.S);if(!P.arp[0]||!V.arp.length||!AC){V.arpNext=0;V.arpI=0;return;}
 const sd=60/G.S.bpm/4,st=sd*[2,1,.5][P.arp[1]],now=AC.currentTime,g=fmvOut(G);if(!V.arpNext||V.arpNext<now)V.arpNext=now+.01;
 const base=[...V.arp].sort((a,b)=>a-b),L=[];for(let o=0;o<P.arp[2];o++)base.forEach(m=>L.push(m+12*o));
 while(V.arpNext<now+.06){const n=L.length,i=V.arpI++,mode=P.arp[0];let j=mode===1?i%n:mode===2?n-1-i%n:mode===3?(n<2?0:(i%(2*n-2)<n?i%(2*n-2):2*n-2-i%(2*n-2))):Math.random()*n|0;
  const m=L[j];if(g)fm1Note(P,V.arpNext,mtof(m),st*P.arp[3],.85,g,sd);const s=m-FMV_BASE-12*V.oct;if(s>=0&&s<27)V.lit.set(s,TIME+st);fmvRecord(G,m);V.arpNext+=st;}}

function fmvUpdate(G){const V=fmvInit(G);
 if(backPressed()||MUI.esc){fmvAllOff(G);G.menu={sel:0};SFX.move();return;}
 if(anyPressed('start')){if(G.playing)G.stop();else G.play();SFX.move();}
 if(anyPressed('left')){V.cur=(V.cur+26)%27;SFX.move();}if(anyPressed('right')){V.cur=(V.cur+1)%27;SFX.move();}
 if(anyPressed('up'))fmvPreset(G,1);if(anyPressed('down'))fmvPreset(G,-1);
 if(anyPressed('gadget'))fmvButton(G,'OCT+');if(anyPressed('attack'))fmvButton(G,'OCT-');
 if(anyPressed('ok')){V.gp=V.cur;fmvOn(G,V.cur);}
 if(V.gp>=0&&!(INPUT[0].ok||INPUT[1].ok)){fmvOff(G,V.gp);V.gp=-1;}
 fmvArp(G);}

// ---------- drawing ----------
function fmvKnobDraw(G,cx,cy,lab,fr,col,k,r=11){const FC=FMC[SKINS[G.S.skin].fm];text(lab,cx,cy-r-5,8,FC.txt,'center',null);
 ctx.fillStyle='#151515';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
 const an=Math.PI*.75+Math.max(0,Math.min(1,fr))*Math.PI*1.5;ctx.strokeStyle=col||'#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx+Math.cos(an)*3,cy+Math.sin(an)*3);ctx.lineTo(cx+Math.cos(an)*(r-2),cy+Math.sin(an)*(r-2));ctx.stroke();
 const turn=d=>fmvKnob(G,k,d);MUI.add(cx-r-14,cy-r-12,2*r+28,2*r+16,{arrows:true,click:mx=>turn(mx<cx?-1:1),right:()=>turn(-1),wheel:d=>turn(d)});}
function fmvAlgDraw(P,x,y,w,h,selOp){const al=FM_ALGS[P.alg],pos=[],used={};const put=(i,c,r)=>{while(used[c+','+r])c++;used[c+','+r]=1;pos[i]=[c,r];};
 let col=0;al.car.forEach(i=>{put(i,col,0);col++;});
 for(let pass=0;pass<6;pass++)al.m.forEach(([f,t])=>{if(pos[t]&&!pos[f])put(f,pos[t][0],pos[t][1]+1);});
 const cols=Math.max(...pos.map(p=>p[0]))+1,rows=Math.max(...pos.map(p=>p[1]))+1,cw=Math.min(22,w/cols),rh=Math.min(16,h/rows),ox=x+(w-cols*cw)/2;
 const at=i=>[ox+pos[i][0]*cw+cw/2,y+h-pos[i][1]*rh-rh/2];ctx.strokeStyle='#5fd3ff';ctx.lineWidth=1.2;
 al.m.forEach(([f,t])=>{const [a,b]=at(f),[c,d]=at(t);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();});
 for(let i=0;i<6;i++){const [a,b]=at(i),on=P.ops[i][1]>.001;rrect(a-7,b-5,14,10,2,i===selOp?'#ffd23a':al.car.includes(i)?'#2de2f5':'#1d4f8f',null);text(i+1,a,b+3.5,8,on?'#012':'#557','center',null);}}
function fmvScreen(G,x,y,w,h){const P=fm1Of(G.S),V=G.fmv,pg=FM_PAGES[V.page],ps=fmvParams(G);
 rrect(x,y,w,h,4,'#0b1a2c',null);rrect(x,y,w,14,4,'#16365a',null);
 text(String(P.p+1).padStart(3,'0')+' '+FM_PRESETS[P.p].n+(P.ed?'*':''),x+4,y+10,8,'#fff','left',null);text(pg,x+w-4,y+10,8,'#ffd23a','right',null);
 const ay=y+17,ah=h-17-30;
 if(pg==='HOME'||pg==='EDIT'){fmvAlgDraw(P,x+4,ay,w-8,ah-10,pg==='EDIT'?V.op:-1);text('ALG '+(P.alg+1)+' '+FM_ALGS[P.alg].n+'   OCT '+(V.oct>0?'+':'')+V.oct,x+w/2,ay+ah-1,7,'#9fd','center',null);}
 else if(pg==='ENV'){const [a,d,s,r]=P.env,tt=a+d+.6+r,sx=(w-16)/tt;ctx.strokeStyle='#ffd23a';ctx.lineWidth=2;ctx.beginPath();let px=x+8,b=ay+ah-4,top=ay+6;ctx.moveTo(px,b);px+=a*sx;ctx.lineTo(px,top);px+=d*sx;ctx.lineTo(px,b-(b-top)*s);px+=.6*sx;ctx.lineTo(px,b-(b-top)*s);px+=r*sx;ctx.lineTo(px,b);ctx.stroke();}
 else if(pg==='LFO'){ctx.strokeStyle='#7cf07c';ctx.lineWidth=2;ctx.beginPath();const amp=4+(P.lfo[1]+P.lfo[2])*12,cy=ay+ah/2;for(let i=0;i<=w-16;i+=2){const yy=cy-Math.sin(i/(w-16)*Math.PI*2*Math.max(1,P.lfo[0]/2)+TIME*P.lfo[0])*amp;i?ctx.lineTo(x+8+i,yy):ctx.moveTo(x+8,yy);}ctx.stroke();}
 else if(pg==='FX'){[P.fx[0],P.fx[1],P.glide].forEach((v,i)=>{const bx=x+10+i*((w-20)/3);rrect(bx,ay+4,(w-20)/3-8,ah-8,3,'#1c2a44',null);rrect(bx,ay+4+(ah-8)*(1-v),(w-20)/3-8,(ah-8)*v,3,['#2de2f5','#b98cff','#ffd23a'][i],null);});}
 else if(pg==='ARP'){text(P.arp[0]?'ARP '+FM_ARP[P.arp[0]]:'ARP OFF',x+w/2,ay+18,12,P.arp[0]?'#ffd23a':'#789','center',null);text(P.arp[0]?'hold keys to arpeggiate':'press ARP to turn on',x+w/2,ay+34,7,'#9fd','center',null);
  for(let i=0;i<8;i++){const on=P.arp[0]&&V.arp.length&&(V.arpI-1)%8===i;rrect(x+10+i*((w-20)/8),ay+42,(w-20)/8-3,8,2,on?'#ffd23a':'#1c2a44',null);}}
 else if(pg==='SEQ'){const Pt=G.pat(),b=Math.floor(V.pos/16),cw=(w-8)/16,st=G.step();
  for(let i=0;i<16;i++){const c=Pt.lead[b*16+i],cx=x+4+i*cw;rrect(cx+.5,ay+2,cw-1,ah-6,2,i===V.pos%16?'#3a3010':'#14233a',null);
   if(c&&c!=='.'){const v=c.charCodeAt(0)-97;rrect(cx+1,ay+ah-6-(v+1)*(ah-8)/15,cw-2,4,1,'#ffd23a',null);}
   if(st>=0&&G.pat()===patOf(G.S,songArr(G.S)[slotAt(G.S,Math.floor(st/16)).entry])&&slotAt(G.S,Math.floor(st/16)).barIn===b&&st%16===i){ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(cx,ay+2,cw,ah-6);}}}
 // the four knob readouts along the bottom, like the real screen
 ps.forEach((p,i)=>{const bx=x+2+i*(w-4)/4,bw=(w-4)/4-2;rrect(bx,y+h-28,bw,26,3,'#132a46',null);text(p.n,bx+bw/2,y+h-18,7,'#8fd0ff','center',null);text(String(p.t()),bx+bw/2,y+h-6,9,'#fff','center',null);});
 if(V.rec){ctx.fillStyle=Math.floor(TIME*3)%2?'#ff2a5a':'#801';ctx.beginPath();ctx.arc(x+w-30,y+7,3.5,0,7);ctx.fill();}}

function grooveViewTabs(G){const fm=G.view==='fm';[['LAPTOP GRID',false],['FM-1 SYNTH',true]].forEach(([t,v],i)=>{const x=8,y=10+i*44,w=136,h=38,on=fm===v;
 rrect(x,y,w,h,9,on?'#ffd23a':'#141a30',on?'#fff':'#2de2f5',on?2.5:1.5);text(t,x+w/2,y+18,12,on?'#102':'#fff','center',null);text(on?'showing':'Tab to switch',x+w/2,y+31,8,on?'#334':'#8fa0d0','center',null);
 if(!G.menu&&!G.fileMenu&&G.naming==null&&!G.rec)MUI.add(x,y,w,h,{hl:false,click:()=>{if(!on)grooveSetView(G,v?'fm':'grid');}});});}
function grooveSetView(G,v){fmvAllOff(G);G.view=v;GROOVE_VIEW=v;SFX.move();}
let GROOVE_VIEW='grid';

function fmvDraw(G){const S=G.S,SK=SKINS[S.skin],FC=FMC[SK.fm],V=fmvInit(G),P=fm1Of(S),open=!G.menu&&!G.fileMenu&&G.naming==null&&!G.rec;
 roomBg();ctx.fillStyle='#4a2a14';ctx.fillRect(0,438,W,42);ctx.fillStyle='#7a4a22';ctx.fillRect(0,434,W,8);
 grooveRail(G);grooveViewTabs(G);
 // body
 rrect(152,8,482,322,18,FC.body,'#000',3);rrect(157,13,472,312,14,null,FC.edge,1.5);
 text('FM-1',166,30,11,FC.txt,'left',null);
 const kc=FC.lit;
 if(open){fmvKnobDraw(G,184,62,'MASTER',P.vol,kc,'MASTER');fmvKnobDraw(G,232,62,'SELECT',V.page/6,kc,'SELECT');fmvKnobDraw(G,184,110,'PRESETS',P.p/(FM_PRESETS.length-1),kc,'PRESETS');fmvKnobDraw(G,232,110,'ALGORITHM',P.alg/7,kc,'ALGORITHM');}
 else[[184,62,'MASTER'],[232,62,'SELECT'],[184,110,'PRESETS'],[232,110,'ALGORITHM']].forEach(([x,y,n])=>{text(n,x,y-16,8,FC.txt,'center',null);ctx.fillStyle='#151515';ctx.beginPath();ctx.arc(x,y,11,0,7);ctx.fill();});
 ['OCT-','OCT+'].forEach((b,i)=>{const x=164+i*46,y=134;rrect(x,y,42,16,4,'#222','#000',1.5);text(b,x+21,y+12,8,'#ddd','center',null);if(open)MUI.add(x,y,42,16,{click:()=>fmvButton(G,b)});});
 // screen
 rrect(262,16,140,140,10,'#111','#000',2);fmvScreen(G,268,22,128,128);
 // KNOB1-4 (their jobs change with the screen page)
 const ps=fmvParams(G);ps.forEach((p,i)=>{const cx=432+i*52,fr=(()=>{const v=parseFloat(p.t());return isNaN(v)?.5:v>1?Math.min(1,v/99):v;})();
  if(open)fmvKnobDraw(G,cx,42,'KNOB'+(i+1),fr,kc,i,12);text(p.n,cx,66,7,FC.txt,'center',null);});
 // button grid
 rrect(412,76,214,74,9,FC.strip,'#000',1.5);
 const BT=[['FX','SEL','ENV','LFO','EDIT','GLO'],['HOME','SAVE','ARP','SEQ','PLAY','REC']],pgOf={FX:4,ENV:2,LFO:3,EDIT:1,HOME:0,SEQ:6};
 BT.forEach((row,r)=>row.forEach((b,c)=>{const x=417+c*34.5,y=81+r*34,lit=pgOf[b]===V.page||b==='GLO'&&P.glide>0||b==='ARP'&&P.arp[0]>0||b==='PLAY'&&G.playing||b==='REC'&&V.rec;
  rrect(x,y,31,30,6,b==='REC'&&V.rec?'#ff5a8a':lit?FC.lit:FC.key,'rgba(0,0,0,.5)',1.2);
  if(b==='PLAY'){text('PLAY',x+15.5,y+13,7,lit?'#102':'#fff','center',null);text('STOP',x+15.5,y+23,7,lit?'#102':'#fff','center',null);}else text(b,x+15.5,y+19,b.length>3?7:8,lit?'#102':'#fff','center',null);
  if(open)MUI.add(x,y,31,30,{click:()=>fmvButton(G,b)});}));
 // keys
 rrect(160,160,466,162,14,FC.strip,'#000',1.5);
 const lm=G.playing?G.curLead(G.step()):-1,ox=0;
 const keyHit=(mx,my)=>{for(const k of FMV_KEYS)if(k.blk&&mx>=k.x+ox&&mx<k.x+ox+k.w&&my>=166&&my<228)return k.s;for(const k of FMV_KEYS)if(!k.blk&&mx>=k.x+ox-2&&mx<k.x+ox+k.w+2&&my>=166&&my<318)return k.s;return -1;};
 for(const blk of [false,true])for(const k of FMV_KEYS){if(k.blk!==blk)continue;const x=k.x+ox,y=blk?168:236,h=blk?56:78,m=fmvMidi(G,k.s),held=V.held.has(k.s)||(V.lit.get(k.s)||0)>TIME,song=lm===m;
  rrect(x,y,k.w,h,9,held?FC.lit:song?'#9ff0ff':FC.key,'rgba(0,0,0,.45)',1.2);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(x+k.w/2-1,y+8,2,h-16);
  if(k.lab)text(k.lab,x+k.w/2,y+h+8,6,'#fff','center',null);
  if(!MUI.mouseRecent()&&V.cur===k.s)rrect(x-2,y-2,k.w+4,h+4,10,null,'#ffd23a',2.5);
  if(k.s%12===7&&!blk)text('C'+(Math.floor(m/12)-1),x+k.w/2,y+h-6,7,'rgba(255,255,255,.7)','center',null);}
 if(open)MUI.add(160,160,466,162,{hl:false,down:(mx,my)=>{let cur=keyHit(mx,my);if(cur<0)return null;fmvOn(G,cur);
   return {move:(x,y)=>{const k=keyHit(x,y);if(k!==cur){fmvOff(G,cur);cur=k;if(k>=0)fmvOn(G,k);}},up:()=>{if(cur>=0)fmvOff(G,cur);}};}});
 // lead lane: the whole LEAD of this pattern, with the SEQ/REC cursor
 const Pt=G.pat(),NB=G.nbars(),n=16*NB,lx=152,lw=482,ly=336,lh=76,cw=(lw-16)/n,st=G.step(),sl=st>=0?slotAt(S,Math.floor(st/16)):null,same=sl&&patOf(S,songArr(S)[sl.entry])===Pt;
 rrect(lx,ly,lw,lh,10,'#0d1020','#2de2f5',1.5);
 text('LEAD  pattern '+'ABC'[G.pi]+'  '+(LEADS[S.li]==='fm1'?'FM-1 sound':LEAD_T[S.li]+' sound (play a key to use FM-1)'),lx+10,ly+13,9,'#ffd23a','left',null);
 text(V.rec?(G.playing?'REC: play along':'REC: step mode, cursor moves on'):'REC off',lx+lw-10,ly+13,9,V.rec?'#ff5a8a':'#8fa0d0','right',null);
 const ry=ly+18,rh=lh-24;
 for(let b=0;b<NB;b++){ctx.fillStyle=b%2?'#151a30':'#1a2040';ctx.fillRect(lx+8+b*16*cw,ry,16*cw,rh);}
 for(let i=0;i<n;i++){const c=Pt.lead[i];if(c&&c!=='.'){const v=c.charCodeAt(0)-97;rrect(lx+8+i*cw,ry+rh-3-(v+1)*(rh-4)/15,Math.max(2,cw*Math.min(S.lh||4,4)-1),3.5,1,'#ffd23a',null);}}
 if(same){const x=lx+8+(sl.barIn*16+st%16)*cw;ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(x,ry,Math.max(1.5,cw),rh);}
 {const x=lx+8+V.pos*cw;rrect(x-1,ry-1,Math.max(4,cw+2),rh+2,2,null,(V.flash&&TIME-V.flash<.2)?'#fff':'#ff5a8a',1.5);}
 if(open)MUI.add(lx+8,ry,lw-16,rh,{hl:false,click:mx=>{V.pos=Math.max(0,Math.min(n-1,Math.floor((mx-lx-8)/cw)));V.page=6;SFX.move();},
  right:()=>{const i=Math.max(0,Math.min(n-1,Math.floor((MUI.mx-lx-8)/cw)));if(Pt.lead[i]!=='.'){Pt.lead=setCh(Pt.lead,i,'.');G.refresh();SFX.hurt();}}});
 text(MUI.mouseRecent()?'Click or drag the keys. Click a knob side or scroll it. Click the lane to move the REC cursor, right-click a note to remove it.':
  'Keys: A W S E D F T G Y H U J K O L P ; play   Z/X octave   R record   Space play   Tab grid view   Esc menu',W/2,428,MUI.mouseRecent()?8:8,'#cfe','center',null);
 if(open)MUI.chips([{t:G.playing?'Stop':'Play',fn:()=>fmvButton(G,'PLAY')},{t:V.rec?'REC on':'REC',fn:()=>fmvButton(G,'REC')},{t:'Octave -',fn:()=>fmvButton(G,'OCT-')},{t:'Octave +',fn:()=>fmvButton(G,'OCT+')},{t:'B  Menu',b:'back'},{t:'Grid view',fn:()=>grooveSetView(G,'grid')}],446,20);
 grooveOverlays(G);drawToast();}

// ---------- hook into the Home Studio ----------
{const _mk=Groove.make,_up=Groove.update,_dr=Groove.draw,_mi=Groove.menuItems,_st=Groove.stop;
 Groove.make=function(S,id){const r=_mk.call(this,S,id);this.fmv=null;this.view=GROOVE_VIEW;fmvInit(this);fm1Of(S);return r;};
 Groove.update=function(){if(this.view==='fm'&&!this.menu&&!this.fileMenu&&this.naming==null&&!this.rec){grooveTrack(this);if(this.naming!=null||this.rec||this.fileMenu)return;fmvUpdate(this);return;}_up.call(this);};
 Groove.draw=function(){if(this.view==='fm')fmvDraw(this);else _dr.call(this);};
 Groove.menuItems=function(){const I=_mi.call(this);I.splice(1,0,{n:this.view==='fm'?'Switch to the laptop grid':'Switch to the FM-1 synth',go:()=>{this.menu=null;grooveSetView(this,this.view==='fm'?'grid':'fm');}});return I;};}
// laptop keys in the FM-1 view (and Tab in both views)
addEventListener('keydown',e=>{if(typeof scene==='undefined'||scene!==Groove)return;const G=Groove;if(G.naming!=null||G.menu||G.fileMenu||G.rec||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.code==='Tab'){e.preventDefault();e.stopImmediatePropagation();KEYS.Tab=false;if(!e.repeat)grooveSetView(G,G.view==='fm'?'grid':'fm');return;}
 if(G.view!=='fm')return;const s=FMV_CODE[e.code];let used=true;
 if(s!=null){if(!e.repeat)fmvOn(G,s);}
 else if(e.code==='KeyZ'){if(!e.repeat)fmvButton(G,'OCT-');}else if(e.code==='KeyX'){if(!e.repeat)fmvButton(G,'OCT+');}
 else if(e.code==='KeyR'){if(!e.repeat)fmvButton(G,'REC');}else if(e.code==='Space'){if(!e.repeat)fmvButton(G,'PLAY');}
 else used=false;
 if(used){e.preventDefault();e.stopImmediatePropagation();KEYS[e.code]=false;}},true);
addEventListener('keyup',e=>{if(typeof scene==='undefined'||scene!==Groove||Groove.view!=='fm')return;const s=FMV_CODE[e.code];if(s!=null){KEYS[e.code]=false;fmvOff(Groove,s);}});
addEventListener('blur',()=>{if(typeof scene!=='undefined'&&scene===Groove)fmvAllOff(Groove);});
