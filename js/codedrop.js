// ===== Code Drop: falling-block decrypt puzzle mode (v0.24) =====
// LEVEL_DEFS entry with type:'codedrop' and files:[{name, lines (to clear), speed (seconds per row), virus (garbage rows at start), clue}].
// Data blocks fall into the 10x16 server well. Fill a whole row to clear it; each cleared row decrypts part of the file.
// Clear the file's line target to crack it. Blocks reach the top = firewall crash: lose a heart, the file restarts.
// Controls: Left/Right move, Down soft drop, JUMP/A rotate, ATTACK rotate the other way, GADGET hard drop.
// POWER-UP BLOCKS (Michael's pick): about 1 piece in 6 carries a glowing block. When it lands it fires:
//  PIZZA BOMB clears the 3x3 around it, SANDY BEAM clears its whole column. Each one also adds +1 decrypt line.
//  files[i].power sets the chance (0 turns them off).
//  Co-op: both players steer the same falling block (talk to each other!). P2 can also rotate.
const CD_W=10,CD_H=16,CD_S=24;
const CD_P=[{c:'#2de2f5',b:[[0,1],[1,1],[2,1],[3,1]]},{c:'#ffd23a',b:[[1,0],[2,0],[1,1],[2,1]]},{c:'#c86bff',b:[[1,0],[0,1],[1,1],[2,1]]},
 {c:'#3ad07a',b:[[1,0],[2,0],[0,1],[1,1]]},{c:'#ff4a4a',b:[[0,0],[1,0],[1,1],[2,1]]},{c:'#3a6aff',b:[[0,0],[0,1],[1,1],[2,1]]},{c:'#ff9a2a',b:[[2,0],[0,1],[1,1],[2,1]]}];
function cdPow(k,x,y,t){const g=.6+.4*Math.sin(t*10);ctx.save();ctx.translate(x,y);ctx.shadowColor=k==='bomb'?'#ffb347':'#9ff';ctx.shadowBlur=12*g;
 if(k==='bomb'){ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(9,8);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.strokeStyle='#b0602a';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#d23a2a';for(const [a,b] of [[-3,3],[3,4],[0,-1]]){ctx.beginPath();ctx.arc(a,b,2,0,7);ctx.fill();}}
 else{ctx.fillStyle='#bff';ctx.fillRect(-3,-10,6,20);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();}
 ctx.restore();}
function makeCodeDrop(def,np){
 const C={name:'codedrop',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,fi:0,hearts:3,clues:[],floats:[],endT:0,clearT:0,lines:0,tetris:0,fall:0,lock:0,flashRows:[],flashT:0,bag:[],das:{},totalLines:0,crashes:0};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};C.R=R;
 const OX=W/2-CD_W*CD_S/2-60,OY=56;
 function nextKind(){if(!C.bag.length){C.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[C.bag[i],C.bag[j]]=[C.bag[j],C.bag[i]];}}return C.bag.pop();}
 function cells(p){return p.b.map(([x,y])=>{let a=x,b=y;for(let r=0;r<p.r;r++){const t=a;a=(p.k===0?3:2)-b;b=t;}return [p.x+a,p.y+b];});}
 const fits=p=>cells(p).every(([x,y])=>x>=0&&x<CD_W&&y<CD_H&&(y<0||!C.g[y][x]));
 function spawn(){const k=C.next!=null?C.next:nextKind();C.next=nextKind();C.p={k,b:CD_P[k].b,c:CD_P[k].c,x:3,y:-1,r:0};{const F=def.files[C.fi],ch=F.power!=null?F.power:.16;C.spawns=(C.spawns||0)+1;if(C.spawns>2&&Math.random()<ch)C.p.pw={i:Math.floor(Math.random()*4),k:Math.random()<.55?'bomb':'beam'};}if(!fits(C.p)){crash();}}
 function load(){const F=def.files[C.fi];C.g=[...Array(CD_H)].map(()=>Array(CD_W).fill(null));C.lines=0;C.fall=0;
  for(let v=0;v<(F.virus||0);v++){const y=CD_H-1-v,hole=Math.floor(Math.random()*CD_W);for(let x=0;x<CD_W;x++)if(x!==hole)C.g[y][x]='#6a4a7a';}
  C.next=null;spawn();}
 load();
 const float=(x,y,t,c='#fff')=>C.floats.push({x,y,t,c,life:1.3});
 function crash(){C.hearts--;C.crashes++;R.hits=(R.hits||0)+1;SFX.hurt();float(W/2,200,'FIREWALL CRASH!','#ff5a5a');if(C.hearts<=0){C.hearts=0;finish(false);return;}C.resetT=1.2;}
 function finish(win){C.state='end';C.win=win;C.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){R.coinTotal=0;R.coinsGot=0;R.kos=0;R.oops=0;if(typeof lv==='function'){const V=lv(def.id);if(C.tetris>0)V.quad=1;}
  C.players=[{hp:C.hearts,down:false}];missionPayout(def,np,{clues:C.clues,coins:0,kills:0,total:def.files.filter(f=>f.clue!=null).length});}
 function lockPiece(){const cs=cells(C.p);for(const [x,y] of cs){if(y<0){crash();return;}C.g[y][x]=C.p.c;}SFX.hit();
  if(C.p.pw){const [px,py]=cs[C.p.pw.i],k=C.p.pw.k;C.boom={k,x:px,y:py,t:.5};
   if(k==='bomb'){for(let yy=py-1;yy<=py+1;yy++)for(let xx=px-1;xx<=px+1;xx++)if(yy>=0&&yy<CD_H&&xx>=0&&xx<CD_W)C.g[yy][xx]=null;float(OX+px*CD_S,OY+py*CD_S,'PIZZA BOMB!','#ffb347');}
   else{for(let yy=0;yy<CD_H;yy++)C.g[yy][px]=null;float(OX+px*CD_S,OY+py*CD_S,'SANDY BEAM!','#7ff');}
   SFX.smash();C.lines++;C.powers=(C.powers||0)+1;bump&&bump('cdPowers');
   const F=def.files[C.fi];if(C.lines>=F.lines){C.state='clear';C.clearT=0;if(F.clue!=null){C.clues.push(F.clue);float(W/2,120,'CLUE: '+CLUES[F.clue].name,'#ffd23a');}return;}}
  const full=[];for(let y=0;y<CD_H;y++)if(C.g[y].every(v=>v))full.push(y);
  if(full.length){C.flashRows=full;C.flashT=.25;for(const y of full){C.g.splice(y,1);C.g.unshift(Array(CD_W).fill(null));}
   C.lines+=full.length;C.totalLines+=full.length;bump&&bump('linesCleared',full.length);if(full.length>=4){C.tetris++;float(OX+CD_W*CD_S/2,200,'MEGA DECRYPT!','#ff5ae0');playStinger('unlock');}else{playStinger('clue');float(OX+CD_W*CD_S/2,200,full.length>1?full.length+' LINES!':'LINE!','#7ff');}
   const F=def.files[C.fi];if(C.lines>=F.lines){C.state='clear';C.clearT=0;if(F.clue!=null){C.clues.push(F.clue);float(W/2,120,'CLUE: '+CLUES[F.clue].name,'#ffd23a');}return;}}
  spawn();}
 function tryMove(dx,dy,dr){const p=Object.assign({},C.p,{x:C.p.x+dx,y:C.p.y+dy,r:(C.p.r+(dr||0)+4)%4});
  if(fits(p)){C.p=p;return true;}if(dr){for(const k of [1,-1,2,-2]){const q=Object.assign({},p,{x:p.x+k});if(fits(q)){C.p=q;return true;}}}return false;}
 const any=(b,f)=>{for(let i=0;i<(np>1?2:2);i++)if(f(i,b))return true;return false;};
 C.enter=function(){startMusic(def.music||'codedrop');};C.resume=function(){};
 C.update=function(dt){C.t+=dt;for(const f of C.floats){f.life-=dt;f.y-=24*dt;}C.floats=C.floats.filter(f=>f.life>0);if(C.flashT>0)C.flashT-=dt;if(C.boom){C.boom.t-=dt;if(C.boom.t<=0)C.boom=null;}
  if(C.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();C.introIdx++;if(C.introIdx>=def.intro.length)C.state='play';}return;}
  if(C.state==='outro'){C.endT+=dt;if(C.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();C.outroIdx++;C.endT=0;if(C.outroIdx>=def.outro.lines.length)payout();}return;}
  if(C.paused)return;
  if(C.state==='end'){C.endT+=dt;if(C.endT>2.2){if(C.win){C.state='outro';C.outroIdx=0;C.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(C.state==='clear'){C.clearT+=dt;if(C.clearT>1.8){if(C.fi+1>=def.files.length)finish(true);else{C.fi++;load();C.state='play';}}return;}
  if(anyPressed('start')){C.paused=true;push(Watch.make('level'));return;}
  if(C.resetT>0){C.resetT-=dt;if(C.resetT<=0)load();return;}
  R.t=(R.t||0)+dt;
  // auto-repeat left/right (DAS) for held buttons
  for(const d of ['left','right']){const h=anyHeld(d);if(anyPressed(d)){tryMove(d==='left'?-1:1,0);C.das[d]=.17;SFX.move();}else if(h){C.das[d]-=dt;if(C.das[d]<=0){tryMove(d==='left'?-1:1,0);C.das[d]=.05;}}}
  if(anyPressed('jump')||anyPressed('up'))tryMove(0,0,1);if(anyPressed('attack'))tryMove(0,0,-1);
  if(anyPressed('gadget')){let n=0;while(tryMove(0,1))n++;lockPiece();return;}
  const F=def.files[C.fi],sp=anyHeld('down')?.035:F.speed;C.fall+=dt;
  if(C.fall>=sp){C.fall=0;if(!tryMove(0,1)){C.lock+=sp;if(C.lock>=.3||anyHeld('down')){C.lock=0;lockPiece();}}else C.lock=0;}};
 function cell(x,y,col,a=1){const px=OX+x*CD_S,py=OY+y*CD_S;ctx.globalAlpha=a;ctx.fillStyle=col;ctx.fillRect(px+1,py+1,CD_S-2,CD_S-2);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(px+3,py+3,CD_S-10,4);
  ctx.strokeStyle='#0a0618';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,CD_S-2,CD_S-2);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(px+6,py+12,4,4);ctx.fillRect(px+14,py+12,4,4);ctx.globalAlpha=1;}
 C.draw=function(){const F=def.files[Math.min(C.fi,def.files.length-1)];ctx.fillStyle='#08061a';ctx.fillRect(0,0,W,H);
  for(let i=0;i<40;i++){ctx.fillStyle='rgba(45,226,245,'+(.05+.05*Math.sin(C.t*2+i))+')';text(((i*7919+Math.floor(C.t*3))%2)?'1':'0',(i*53)%W,(i*97+C.t*40)%H,12,ctx.fillStyle,'left',null);}
  rrect(OX-8,OY-8,CD_W*CD_S+16,CD_H*CD_S+16,10,'#121030','#2de2f5',3);
  for(let y=0;y<CD_H;y++)for(let x=0;x<CD_W;x++){if(C.g[y][x])cell(x,y,C.g[y][x]);else{ctx.fillStyle=(x+y)%2?'#151238':'#18153f';ctx.fillRect(OX+x*CD_S,OY+y*CD_S,CD_S,CD_S);}}
  if(C.state==='play'&&C.p&&!(C.resetT>0)){const g=Object.assign({},C.p);while(fits(Object.assign({},g,{y:g.y+1})))g.y++;for(const [x,y] of cells(g))if(y>=0)cell(x,y,C.p.c,.22);cells(C.p).forEach(([x,y],i)=>{if(y<0)return;cell(x,y,C.p.c);if(C.p.pw&&C.p.pw.i===i)cdPow(C.p.pw.k,OX+x*CD_S+CD_S/2,OY+y*CD_S+CD_S/2,C.t);});}
  if(C.boom){const b=C.boom,a=b.t/.5;ctx.globalAlpha=a;if(b.k==='bomb'){ctx.fillStyle='#ffb347';ctx.beginPath();ctx.arc(OX+b.x*CD_S+CD_S/2,OY+b.y*CD_S+CD_S/2,CD_S*1.8*(1.4-a),0,7);ctx.fill();}
   else{ctx.fillStyle='#9ff';ctx.fillRect(OX+b.x*CD_S-4,OY,CD_S+8,CD_H*CD_S);}ctx.globalAlpha=1;}
  if(C.flashT>0){ctx.fillStyle='rgba(255,255,255,'+C.flashT*3+')';ctx.fillRect(OX,OY,CD_W*CD_S,CD_H*CD_S);}
  // side panel
  const PX=OX+CD_W*CD_S+30;rrect(PX,OY,200,120,10,'rgba(6,20,36,.92)','#ffd23a',2);text('FILE '+(C.fi+1)+'/'+def.files.length,PX+12,OY+24,14,'#ffd23a','left',null);
  wrap(F.name,PX+12,OY+46,180,16,13,'#fff',null);text('DECRYPTED',PX+12,OY+96,11,'#cfe','left',null);rrect(PX+86,OY+86,100,12,6,'#1a2240',null);rrect(PX+86,OY+86,Math.max(6,100*Math.min(1,C.lines/F.lines)),12,6,'#3ad07a',null);
  text(C.lines+' / '+F.lines+' lines',PX+186,OY+113,11,'#9fb','right',null);
  rrect(PX,OY+134,200,100,10,'rgba(6,20,36,.92)','#2de2f5',2);text('NEXT',PX+12,OY+156,12,'#2de2f5','left',null);
  if(C.next!=null){const n=CD_P[C.next];for(const [x,y] of n.b){ctx.fillStyle=n.c;ctx.fillRect(PX+70+x*20,OY+170+y*20,18,18);ctx.strokeStyle='#000';ctx.strokeRect(PX+70+x*20,OY+170+y*20,18,18);}}
  rrect(PX,OY+248,200,140,10,'rgba(6,20,36,.92)','#456',2);['Left/Right: move','Down: drop faster','A / Up: rotate','ATTACK: rotate back','GADGET: slam down',np>1?'Both players steer!':''].forEach((t,i)=>text(t,PX+12,OY+270+i*20,12,'#cfe','left',null));
  rrect(4,2,W-8,30,8,'rgba(6,20,36,.92)','#2de2f5',2);for(let i=0;i<3;i++)heart(16+i*22,13,i<C.hearts);imgC('markers/clue',100,16,18);text(C.clues.length+'/'+def.files.filter(f=>f.clue!=null).length,112,21,12,'#ffd23a','left',null);
  text(def.title,W-12,21,11,'#cfe','right',null);
  for(const f of C.floats)text(f.t,f.x,f.y,15,f.c,'center');
  if(C.state==='clear'){rrect(W/2-130,200,260,52,12,'rgba(6,30,16,.95)','#7f7',3);text('FILE CRACKED!',W/2,234,22,'#7f7','center',null);}
  if(C.state==='intro'){dim(.5);text(def.title,W/2,110,20,'#ffd23a','center');text(def.sub,W/2,134,13,'#cfe','center');const ex=def.introExpr||['happy'];sandyBox(def.intro,ex[C.introIdx%ex.length],Math.min(C.introIdx,def.intro.length-1));}
  if(C.state==='end'){dim(Math.min(.6,C.endT*.4));text(C.win?def.winText||'ALL FILES CRACKED!':'MISSION FAILED',W/2,H/2,32,C.win?'#ffd23a':'#ff5a8a','center');}
  if(C.state==='outro'){dim(.55);const ex=def.outro.expr||['happy'];sandyBox(def.outro.lines,ex[C.outroIdx%ex.length],Math.min(C.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,H-6,10,'#ff5ae0','center');};
 return C;}
