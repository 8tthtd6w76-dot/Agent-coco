// ===== Wire Cut: bomb-defuse wire-tracing puzzle mode (v0.24) =====
// LEVEL_DEFS entry with type:'wirecut' and modules:[{wires, time, rule:'shape'|'light'|'all', clue:index|null, seed}].
// Each module is a gadget box: wires run from numbered plugs on the LEFT to symbol terminals on the RIGHT, tangled.
// The screen says which wire to cut ("the wire that goes to the STAR"). Trace it by eye, pick its LEFT plug, press A.
//  Wrong cut = strike (-8 seconds, sparks). 3 strikes on one module = it pops (cartoon confetti), lose a heart, module resets.
//  TRACE (GADGET): highlights one wire, starting from the RIGHT side cursor (Left/Right picks the terminal while held... see below).
// Controls: Up/Down pick a plug, A/ATTACK cut. GADGET + Up/Down moves the TRACE light on the right terminals: it lights up the
//  wire that ends there (costs 3 seconds in solo; free for Player 2 in co-op, who drives the trace light with their own D-pad).
const WC_COLS=['#ff4a4a','#3a8aff','#ffd23a','#3ad07a','#ff8ad8','#ff9a2a','#b07aff','#e8e8f0'];
const WC_CN=['RED','BLUE','YELLOW','GREEN','PINK','ORANGE','PURPLE','WHITE'];
const WC_SH=['star','circle','square','tri','diamond','hex'];
const WC_SHN={star:'STAR',circle:'CIRCLE',square:'SQUARE',tri:'TRIANGLE',diamond:'DIAMOND',hex:'HEXAGON'};
// Silly gadget boxes (Michael's pick): each module is a goofy villain gadget with its own look and its own funny pop.
// Set modules[i].gadget to one of these keys; without one, the boxes cycle honk, glitter, pie, bubble, stink.
const WC_GADGETS={
 honk:{n:'HONK BOMB',body:'#c8a020',in:'#3a3018',pop:'HONNNNK! Everybody jumps!',ok:'Horn silenced!',fx:'notes',cols:['#ffd23a','#fff','#ff9a2a']},
 glitter:{n:'GLITTER CANNON',body:'#a040c0',in:'#2a1838',pop:'FWOOMP! Glitter EVERYWHERE!',ok:'Glitter contained!',fx:'sparkle',cols:['#ff9ae0','#9ff','#ffd23a','#fff']},
 pie:{n:'PIE LAUNCHER',body:'#d06030',in:'#38201a',pop:'SPLAT! Pie in the face!',ok:'Pies saved for dessert!',fx:'splat',cols:['#fff8e0','#ff6a8a']},
 bubble:{n:'BUBBLE BLASTER',body:'#3a8ad0',in:'#182838',pop:'BLOOP! A million bubbles!',ok:'Bubbles bottled!',fx:'bubble',cols:['#bff','#fff']},
 stink:{n:'STINK BOMB',body:'#4a8a3a',in:'#1a2a18',pop:'PEE-YOO! Stink cloud!',ok:'Stink stopped!',fx:'cloud',cols:['#9ad04a','#6a9a3a','#c8e070']},
 slime:{n:'SLIME SPRINKLER',body:'#2aa070',in:'#122a20',pop:'SPLORCH! Slime shower!',ok:'Slime sealed!',fx:'splat',cols:['#7ff0a0','#3ad07a']},
 confetti:{n:'CONFETTI CRATE',body:'#3a3f52',in:'#262a38',pop:'POP! Confetti everywhere!',ok:'DEFUSED!',fx:'confetti',cols:['#ff4a4a','#3a8aff','#ffd23a','#3ad07a','#ff8ad8']}};
const WC_CYCLE=['honk','glitter','pie','bubble','stink'];
function wcIcon(k,x,y,c){ctx.save();ctx.translate(x,y);ctx.fillStyle=c;ctx.strokeStyle='#0b0b14';ctx.lineWidth=2;ctx.beginPath();
 if(k==='honk'){ctx.moveTo(-10,-4);ctx.lineTo(4,-10);ctx.lineTo(4,10);ctx.lineTo(-10,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(-12,0,5,0,7);}
 else if(k==='glitter'){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?4:11;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();}
 else if(k==='pie'){ctx.ellipse(0,2,12,7,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.fillStyle='#fff8e0';ctx.ellipse(0,-2,10,5,0,0,7);}
 else if(k==='bubble'){ctx.arc(-4,2,7,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(6,-5,5,0,7);}
 else if(k==='stink'||k==='slime'){ctx.arc(-6,2,6,0,7);ctx.arc(2,-3,7,0,7);ctx.arc(8,3,6,0,7);}
 else ctx.rect(-9,-9,18,18);
 ctx.fill();ctx.stroke();ctx.restore();}
function wcRng(seed){let s=seed*7919+13;return ()=>((s=(s*48271)%2147483647)/2147483647);}
function wcShape(k,x,y,r,fill){if(typeof drawShape==='function'){drawShape(k,x,y,r,fill);return;}ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
// Build one module: wire i goes from left plug i to right terminal perm[i], through 2 random bends
function wcModule(M){const r=wcRng(M.seed||1),n=M.wires,perm=[...Array(n).keys()];
 for(let tries=0;tries<20;tries++){for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}if(perm.filter((p,i)=>p===i).length<=1)break;}
 const nc=Math.min(WC_COLS.length,Math.max(2,M.colors||Math.ceil(n*.6)));
 const wires=perm.map((t,i)=>({from:i,to:t,col:Math.floor(r()*nc),b1:r(),b2:r(),cut:false}));
 const shapes=[...Array(n)].map((_,i)=>WC_SH[i%WC_SH.length]);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[shapes[i],shapes[j]]=[shapes[j],shapes[i]];}
 const lights=[...Array(n)].map(()=>['#3ad07a','#ff4a4a','#ffd23a'][Math.floor(r()*3)]);
 const rule=M.rule||'shape';let targets=[],text='';
 if(rule==='shape'){const t=Math.floor(r()*n);const sh=shapes[t];const same=shapes.map((s,i)=>s===sh?i:-1).filter(i=>i>=0);
  if(same.length>1){text='Cut the wire going to the TOP '+WC_SHN[sh]+'.';targets=[wires.find(w=>w.to===same[0]).from];}else{text='Cut the wire going to the '+WC_SHN[sh]+'.';targets=[wires.find(w=>w.to===t).from];}}
 else if(rule==='light'){let t=Math.floor(r()*n);const col=lights[t],idx=lights.map((c,i)=>c===col?i:-1).filter(i=>i>=0);
  const nm={'#3ad07a':'GREEN','#ff4a4a':'RED','#ffd23a':'YELLOW'}[col];
  if(idx.length>1){t=idx[idx.length-1];text='Cut the wire going to the BOTTOM '+nm+' light.';}else text='Cut the wire going to the '+nm+' light.';targets=[wires.find(w=>w.to===t).from];}
 else{const sh=shapes[Math.floor(r()*n)];const T=shapes.map((s,i)=>s===sh?i:-1).filter(i=>i>=0);text='Cut EVERY wire going to a '+WC_SHN[sh]+'.';targets=T.map(t=>wires.find(w=>w.to===t).from);}
 return {n,wires,shapes,lights,text,targets,time:M.time||40,clue:M.clue,strikes:0,gk:M.gadget};}

function makeWireCut(def,np){
 const Z={name:'wirecut',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,mi:0,hearts:3,clues:[],floats:[],cur:0,trace:-1,traceT:0,
  sparks:[],boom:0,clearT:0,endT:0,strikesTotal:0,traces:0,fast:0};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};Z.R=R;
 const BX=70,BY=96,BW=500,BH=300,LX=BX+54,RX=BX+BW-54;
 function load(){const M=def.modules[Z.mi];Z.m=wcModule(M);Z.m.gk=Z.m.gk||WC_CYCLE[Z.mi%WC_CYCLE.length];Z.g=WC_GADGETS[Z.m.gk]||WC_GADGETS.confetti;Z.left=Z.m.time;Z.cur=0;Z.trace=-1;Z.traceT=0;Z.done=[];}
 load();
 const py=(i,n)=>BY+46+i*((BH-80)/Math.max(1,n-1));
 function path(w){const n=Z.m.n,y1=py(w.from,n),y2=py(w.to,n),xa=LX+(RX-LX)*(.25+w.b1*.15),xb=LX+(RX-LX)*(.6+w.b2*.15),ya=BY+30+w.b2*(BH-60),yb=BY+30+w.b1*(BH-60);
  return [[LX,y1],[xa,ya],[xb,yb],[RX,y2]];}
 function strokePath(P){ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);ctx.bezierCurveTo(P[1][0],P[1][1],P[2][0],P[2][1],P[3][0],P[3][1]);ctx.stroke();}
 const float=(x,y,t,c='#fff')=>Z.floats.push({x,y,t,c,life:1.4});
 function finish(win){Z.state='end';Z.win=win;Z.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){R.coinTotal=0;R.coinsGot=0;R.kos=0;R.oops=0;if(typeof lv==='function'){const V=lv(def.id);if(Z.strikesTotal===0)V.cleanCut=1;if(Z.traces===0)V.noTrace=1;}
  Z.players=[{hp:Z.hearts,down:false}];missionPayout(def,np,{clues:Z.clues,coins:0,kills:0,total:def.modules.filter(m=>m.clue!=null).length});}
 function strike(why){const m=Z.m;m.strikes++;Z.strikesTotal++;R.hits=(R.hits||0)+1;Z.left=Math.max(1,Z.left-8);SFX.hurt();float(W/2,BY+BH+20,why||'WRONG WIRE! -8s','#ff5a5a');
  for(let i=0;i<14;i++)Z.sparks.push({x:LX+40,y:py(Z.cur,m.n),vx:rand(-120,160),vy:rand(-160,40),t:rand(.3,.7)});
  if(m.strikes>=3)pop();}
 function pop(){Z.hearts--;Z.boom=1.2;Z.fx=Z.g.fx;Z.fxCols=Z.g.cols;SFX.smash();float(W/2,BY+BH/2,Z.g.pop,'#ff9ae0');
  if(Z.fx==='splat'){Z.splats=[...Array(7)].map((_,i)=>({x:rand(60,W-60),y:rand(80,H-60),r:rand(26,60),c:Z.g.cols[i%Z.g.cols.length]}));Z.splatT=2.6;}if(Z.hearts<=0){Z.hearts=0;finish(false);return;}setTimeout(()=>{},0);Z.resetT=1.2;}
 function cut(i){const m=Z.m,w=m.wires.find(x=>x.from===i);if(!w||w.cut)return;w.cut=true;SFX.smash();
  if(m.targets.includes(i)){Z.done.push(i);bump&&bump('wiresCut');if(m.targets.every(t=>Z.done.includes(t))){Z.state='clear';Z.clearT=0;playStinger('unlock');if(Z.left>=m.time*.6)Z.fast++;
    if(m.clue!=null){Z.clues.push(m.clue);float(W/2,BY-10,'CLUE: '+CLUES[m.clue].name,'#ffd23a');}else float(W/2,BY-10,Z.g.ok,'#7f7');}
   else float(W/2,BY+BH+20,'Good! Keep cutting...','#7f7');}
  else{strike();if(Z.state!=='play')return;}}
 Z.enter=function(){startMusic(def.music||'wirecut');};Z.resume=function(){};
 Z.update=function(dt){Z.t+=dt;for(const f of Z.floats){f.life-=dt;f.y-=20*dt;}Z.floats=Z.floats.filter(f=>f.life>0);
  for(const s of Z.sparks){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=500*dt;}Z.sparks=Z.sparks.filter(s=>s.t>0);if(Z.boom>0)Z.boom-=dt;if(Z.splatT>0)Z.splatT-=dt;
  if(Z.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();Z.introIdx++;if(Z.introIdx>=def.intro.length)Z.state='play';}return;}
  if(Z.state==='outro'){Z.endT+=dt;if(Z.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();Z.outroIdx++;Z.endT=0;if(Z.outroIdx>=def.outro.lines.length)payout();}return;}
  if(Z.paused)return;
  if(Z.state==='end'){Z.endT+=dt;if(Z.endT>2.2){if(Z.win){Z.state='outro';Z.outroIdx=0;Z.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(Z.state==='clear'){Z.clearT+=dt;if(Z.clearT>1.6){if(Z.mi+1>=def.modules.length)finish(true);else{Z.mi++;load();Z.state='play';}}return;}
  if(anyPressed('start')){Z.paused=true;push(Watch.make('level'));return;}
  if(Z.resetT>0){Z.resetT-=dt;if(Z.resetT<=0){const keep=Z.mi;load();}return;}
  R.t=(R.t||0)+dt;const m=Z.m;Z.left-=dt;if(Z.left<=0){Z.left=0;pop();return;}
  // P1 (and solo): pick a plug and cut. Holding GADGET in solo moves the trace light instead.
  const tracer=np>1?1:0,holdG=INPUT[0].gadget&&np===1;
  if(!holdG){if(pressed(0,'down')||(np===1&&pressed(1,'down'))){Z.cur=(Z.cur+1)%m.n;SFX.move();}if(pressed(0,'up')||(np===1&&pressed(1,'up'))){Z.cur=(Z.cur+m.n-1)%m.n;SFX.move();}
   if(pressed(0,'attack')||pressed(0,'jump')||(np===1&&(pressed(1,'attack')||pressed(1,'jump'))))cut(Z.cur);}
  // trace light: P2 in co-op (free), or solo while holding GADGET (costs 3 seconds per new terminal)
  if(np>1||holdG){const p=np>1?1:0;let mv=0;if(pressed(p,'down'))mv=1;if(pressed(p,'up'))mv=-1;if(np===1&&pressed(0,'gadget')&&Z.trace<0)mv=1;
   if(mv){Z.trace=Z.trace<0?0:(Z.trace+mv+m.n)%m.n;Z.traceT=2.5;SFX.move();if(np===1){Z.left=Math.max(1,Z.left-3);float(RX,py(Z.trace,m.n)-20,'-3s','#9cf');}Z.traces++;}}
  if(Z.traceT>0)Z.traceT-=dt;else if(np===1)Z.trace=-1;};
 Z.draw=function(){ctx.fillStyle='#14102a';ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W/2,H/2,40,W/2,H/2,420);g.addColorStop(0,'rgba(80,60,140,.5)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const m=Z.m,shake=Z.boom>0?Math.sin(Z.t*60)*6*Z.boom:0;ctx.save();ctx.translate(shake,0);
  const G=Z.g||WC_GADGETS.confetti;rrect(BX,BY,BW,BH,18,G.body,'#0b0b14',4);rrect(BX+10,BY+10,BW-20,BH-20,12,G.in,null);
  rrect(W/2-90,BY-6,180,22,8,G.body,'#0b0b14',2);wcIcon(m.gk,W/2-74,BY+5,G.cols[0]);text(G.n,W/2+8,BY+10,12,'#fff','center',null);
  for(const [x,y] of [[BX+16,BY+16],[BX+BW-16,BY+16],[BX+16,BY+BH-16],[BX+BW-16,BY+BH-16]]){ctx.fillStyle='#889';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();}
  // wires (traced one drawn last and glowing)
  const tw=Z.trace>=0?m.wires.find(w=>w.to===Z.trace):null;
  for(const w of m.wires){if(w===tw)continue;const P=path(w);ctx.lineCap='round';
   if(w.cut){ctx.globalAlpha=.35;}ctx.strokeStyle='#0b0b14';ctx.lineWidth=10;strokePath(P);ctx.strokeStyle=WC_COLS[w.col];ctx.lineWidth=6;strokePath(P);ctx.globalAlpha=1;
   if(w.cut){const x=LX+34,y=py(w.from,m.n);ctx.fillStyle='#262a38';ctx.fillRect(x-6,y-9,12,18);}}
  if(tw){const P=path(tw);ctx.strokeStyle='rgba(120,240,255,.55)';ctx.lineWidth=18;strokePath(P);ctx.strokeStyle='#0b0b14';ctx.lineWidth=10;strokePath(P);ctx.strokeStyle=WC_COLS[tw.col];ctx.lineWidth=6;strokePath(P);}
  for(let i=0;i<m.n;i++){const y=py(i,m.n),s=i===Z.cur&&Z.state==='play';
   rrect(BX+14,y-13,32,26,6,s?'#ffd23a':'#596079','#0b0b14',2);text(String(i+1),BX+30,y+6,15,s?'#102':'#fff','center',null);
   if(s){ctx.strokeStyle='#ffd23a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BX+4,y);ctx.lineTo(BX-12,y-8);ctx.lineTo(BX-12,y+8);ctx.closePath();ctx.stroke();}
   rrect(RX+2,y-15,40,30,6,i===Z.trace?'#2a6a7a':'#596079','#0b0b14',2);wcShape(m.shapes[i],RX+22,y,10,'#f4f0e0');
   ctx.fillStyle=m.lights[i];ctx.beginPath();ctx.arc(RX+52,y,6,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();}
  for(const s of Z.sparks){ctx.fillStyle=Math.random()<.5?'#ffd23a':'#fff';ctx.fillRect(s.x,s.y,3,3);}
  ctx.restore();
  if(Z.boom>0){const C=Z.fxCols||WC_COLS,k=1.2-Z.boom;
   for(let i=0;i<34;i++){ctx.fillStyle=C[i%C.length];const a=i*2.4+Z.t*(Z.fx==='cloud'?.3:1),r=k*320*(.4+(i%5)/6),x=W/2+Math.cos(a)*r,y=BY+BH/2+Math.sin(a)*r-(Z.fx==='bubble'?k*120:0);
    if(Z.fx==='notes')text(i%2?'\u266A':'!',x,y,18,C[i%C.length],'center',null);
    else if(Z.fx==='sparkle'){ctx.fillRect(x-1,y-6,3,12);ctx.fillRect(x-6,y-1,12,3);}
    else if(Z.fx==='bubble'){ctx.strokeStyle=C[i%C.length];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5+(i%4)*3,0,7);ctx.stroke();}
    else if(Z.fx==='cloud'){ctx.globalAlpha=Math.min(.6,Z.boom);ctx.beginPath();ctx.arc(x,y,14+(i%3)*6,0,7);ctx.fill();ctx.globalAlpha=1;}
    else ctx.fillRect(x,y,6,6);}}
  if(Z.splatT>0&&Z.splats){ctx.globalAlpha=Math.min(1,Z.splatT);for(const p of Z.splats){ctx.fillStyle=p.c;ctx.beginPath();for(let j=0;j<12;j++){const a=j*Math.PI/6,rr=p.r*(j%2?.7:1);ctx.lineTo(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr);}ctx.closePath();ctx.fill();}ctx.globalAlpha=1;}
  // rule screen + timer
  rrect(BX,46,BW,40,10,'#0a2a1a','#3ad07a',2);text(m.text,W/2,72,15,'#7fffa0','center',null);
  const tl=Math.ceil(Z.left);rrect(BX+BW-96,BY+BH+8,96,34,8,'#200','#f44',2);text(Math.floor(tl/60)+':'+String(tl%60).padStart(2,'0'),BX+BW-48,BY+BH+32,20,tl<=10&&Math.floor(Z.t*4)%2?'#fff':'#ff5a5a','center',null);
  for(let i=0;i<3;i++){ctx.fillStyle=i<m.strikes?'#ff3a3a':'#333';ctx.beginPath();ctx.arc(BX+20+i*22,BY+BH+25,8,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();}text('STRIKES',BX+90,BY+BH+30,11,'#cfe','left',null);
  rrect(4,2,W-8,34,8,'rgba(6,20,36,.92)','#2de2f5',2);for(let i=0;i<3;i++)heart(16+i*22,14,i<Z.hearts);
  text('DEVICE '+(Z.mi+1)+' / '+def.modules.length,120,25,13,'#ffd23a','left',null);imgC('markers/clue',262,18,20);text(Z.clues.length+'/'+def.modules.filter(m=>m.clue!=null).length,276,24,13,'#ffd23a','left',null);
  text(np>1?'P1: Up/Down + A cut   P2: Up/Down trace light':'Up/Down + A: cut   Hold GADGET + Up/Down: trace (-3s)',W-14,25,10,'#9fb','right',null);
  for(const f of Z.floats)text(f.t,W/2,f.y,14,f.c,'center');
  if(Z.state==='clear'){rrect(W/2-110,BY+BH/2-24,220,48,12,'rgba(6,30,16,.95)','#7f7',3);text('DEFUSED!',W/2,BY+BH/2+9,24,'#7f7','center',null);}
  if(Z.state==='intro'){dim(.45);text(def.title,W/2,80,20,'#ffd23a','center');text(def.sub,W/2,104,13,'#cfe','center');const ex=def.introExpr||['happy'];sandyBox(def.intro,ex[Z.introIdx%ex.length],Math.min(Z.introIdx,def.intro.length-1));}
  if(Z.state==='end'){dim(Math.min(.6,Z.endT*.4));text(Z.win?def.winText||'ALL DEFUSED!':'MISSION FAILED',W/2,H/2,32,Z.win?'#ffd23a':'#ff5a8a','center');}
  if(Z.state==='outro'){dim(.55);const ex=def.outro.expr||['happy'];sandyBox(def.outro.lines,ex[Z.outroIdx%ex.length],Math.min(Z.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,H-6,10,'#ff5ae0','center');};
 return Z;}
