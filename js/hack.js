// ===== Hacking mission: turn circuit tiles so power flows from the plug (left) to the lock (right) =====
// LEVEL_DEFS entry with type:'hack' and boards:[{cols,rows,time,seed,clue}]. Each board solved = one clue.
// Tile = 4-bit connection mask: N=1 E=2 S=4 W=8. Turning clockwise rotates the bits.
const HN=1,HE=2,HS=4,HW=8;
const hRot=m=>((m<<1)|(m>>3))&15;
const hOpp={1:4,2:8,4:1,8:2};
function hRng(seed){let a=seed*9301+49297;return ()=>{a=(a*1103515245+12345)%2147483648;return a/2147483648;};}
// Build a board with a guaranteed path, then scramble the rotations
function hackBoard(B){const C=B.cols,R=B.rows,r=hRng(B.seed);
 for(let tries=0;tries<50;tries++){const sr=Math.floor(r()*R),tr=Math.floor(r()*R);
  // random self-avoiding walk from (0,sr) to (C-1,tr), favouring right
  const seen=new Set(),path=[];
  const dfs=(x,y)=>{seen.add(x+','+y);path.push([x,y]);if(x===C-1&&y===tr)return true;
   const ds=[[1,0],[0,-1],[0,1],[-1,0]];for(let i=3;i>0;i--){const j=Math.floor(r()*(i+1));[ds[i],ds[j]]=[ds[j],ds[i]];}if(r()<.45)ds.sort((a,b)=>b[0]-a[0]);
   for(const [dx,dy] of ds){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=C||ny>=R||seen.has(nx+','+ny))continue;if(dfs(nx,ny))return true;}
   path.pop();return false;};
  if(!dfs(0,sr))continue;if(path.length<C+1&&tries<40)continue;
  const g=[];for(let y=0;y<R;y++){g.push([]);for(let x=0;x<C;x++){const k=r();g[y].push({m:k<.4?(HN|HE):k<.75?(HN|HS):(HN|HE|HS),va:0,path:false});}}
  path.forEach(([x,y],i)=>{const dir=(a,b)=>b[0]>a[0]?HE:b[0]<a[0]?HW:b[1]>a[1]?HS:HN;
   const into=i?hOpp[dir(path[i-1],path[i])]:HW,out=i<path.length-1?dir(path[i],path[i+1]):HE;g[y][x].m=into|out;g[y][x].sol=into|out;g[y][x].path=true;});
  for(const row of g)for(const t of row){const n=Math.floor(r()*4);for(let k=0;k<n;k++)t.m=hRot(t.m);}
  const bd={C,R,g,sr,tr};if(hackFlow(bd).solved){const t=g[sr][0];t.m=hRot(t.m);}
  return bd;}
 return null;}
// Which tiles have power. Power enters tile (0,sr) from the West.
function hackFlow(bd){const lit=new Set(),q=[];const {g,C,R}=bd;
 if(g[bd.sr][0].m&HW){q.push([0,bd.sr]);lit.add('0,'+bd.sr);}
 while(q.length){const [x,y]=q.shift(),m=g[y][x].m;
  for(const [d,dx,dy] of [[HN,0,-1],[HE,1,0],[HS,0,1],[HW,-1,0]]){if(!(m&d))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=C||ny>=R)continue;
   if(!(g[ny][nx].m&hOpp[d]))continue;const k=nx+','+ny;if(!lit.has(k)){lit.add(k);q.push([nx,ny]);}}}
 const solved=lit.has((C-1)+','+bd.tr)&&!!(g[bd.tr][C-1].m&HE);
 return {lit,solved};}

function makeHack(def,np){
 const H_={name:'hack',def,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,bi:0,bd:null,time:0,lives:def.lives||3,clues:[],flow:null,clearT:0,endT:0,alarm:0,floats:[],
  cur:[{x:0,y:0},{x:0,y:0}],np};
 let TS=56;
 // painted tablet + tile atlas (Sequence 48) when loaded; the screen inside the frame is about x 112-533, y 130-363
 const ART=()=>{const f=kitImg('hack_frame'),a=kitImg(def.hackArt||'hack_gilbert');return f&&a&&SETTINGS.paintedBg!==false?{f,a}:null;};
 function load(){const B=def.boards[H_.bi];H_.bd=hackBoard(B);H_.time=B.time;H_.cur[0]={x:0,y:H_.bd.sr};H_.cur[1]={x:H_.bd.C-1,y:H_.bd.tr};H_.flow=hackFlow(H_.bd);TS=Math.min(56,Math.floor(380/(H_.bd.C+2)),Math.floor(222/H_.bd.R));}
 load();
 const ox=()=>Math.round((ART()?322:W/2)-H_.bd.C*TS/2),oy=()=>Math.round((ART()?246:250)-H_.bd.R*TS/2);
 H_.enter=function(){startMusic(levelMusic(def));};
 H_.resume=function(){};
 function turn(i,dir){const c=H_.cur[i],t=H_.bd.g[c.y][c.x];t.m=dir>0?hRot(t.m):hRot(hRot(hRot(t.m)));t.va=-dir*Math.PI/2;SFX.move();
  H_.flow=hackFlow(H_.bd);if(H_.flow.solved){H_.state='clear';H_.clearT=0;const cl=def.boards[H_.bi].clue;if(cl!=null){H_.clues.push(cl);}playStinger('unlock');const RP=def.part;if(RP&&RP.board===H_.bi&&H_.time>=RP.minTime&&giveRare(RP.id)){H_.rareNew=RP.id;H_.floats.push({x:W/2,y:280,t:'RARE PART: '+partDef(RP.id).n.toUpperCase()+'!',c:'#ffd23a',life:2.5});}}}
 function finish(win){H_.state='end';H_.win=win;H_.endT=0;stopMusic();playStinger(win?'win':'lose');}
 H_.update=function(dt){H_.t+=dt;
  for(const f of H_.floats){f.life-=dt;f.y-=24*dt;}H_.floats=H_.floats.filter(f=>f.life>0);
  if(H_.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();H_.introIdx++;if(H_.introIdx>=def.intro.length)H_.state='play';}return;}
  if(H_.state==='outro'){H_.endT+=dt;if(H_.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();H_.outroIdx++;H_.endT=0;if(H_.outroIdx>=def.outro.lines.length)payout();}return;}
  if(H_.paused)return;
  if(H_.state==='end'){H_.endT+=dt;if(H_.endT>2.2){if(H_.win&&def.outro){H_.state='outro';H_.outroIdx=0;H_.endT=0;startMusic(def.outro.music||'cutscene');}else if(H_.win)payout();else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  for(const row of H_.bd.g)for(const t of row)t.va*=Math.pow(.0005,dt);
  if(H_.state==='clear'){H_.clearT+=dt;if(H_.clearT>1.8){H_.bi++;if(H_.bi>=def.boards.length)finish(true);else{load();H_.state='play';}}return;}
  if(anyPressed('start')){H_.paused=true;push(Watch.make('level'));return;}
  H_.alarm-=dt;H_.time-=dt;
  if(H_.time<=0){H_.lives--;H_.alarm=1.2;SFX.hurt();H_.floats.push({x:W/2,y:200,t:'ALARM!',c:'#ff5a5a',life:1.4});
   if(H_.lives<=0){finish(false);return;}load();H_.alarm=1.2;}
  for(let i=0;i<np;i++){const c=H_.cur[i],b=H_.bd;
   if(pressed(i,'left'))c.x=(c.x+b.C-1)%b.C;if(pressed(i,'right'))c.x=(c.x+1)%b.C;if(pressed(i,'up'))c.y=(c.y+b.R-1)%b.R;if(pressed(i,'down'))c.y=(c.y+1)%b.R;
   if(pressed(i,'attack')||pressed(i,'jump')){turn(i,1);if(H_.state!=='play')break;}else if(pressed(i,'gadget')){turn(i,-1);if(H_.state!=='play')break;}}
 };
 function payout(){missionPayout(def,np,{clues:H_.clues,coins:0,kills:0,total:def.boards.length,rare:H_.rareNew});}
 // ---------- drawing ----------
 function bg(){const A=ART();if(A){ctx.drawImage(A.f,0,0,W,H);if(H_.alarm>0&&Math.floor(TIME*8)%2){ctx.fillStyle='rgba(255,0,0,.18)';ctx.fillRect(0,0,W,H);}return;}
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#14102e');g.addColorStop(1,'#2a1a3a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // office window with the crane yard outside, blinds, a desk
  ctx.fillStyle='#1a0f40';ctx.fillRect(30,40,170,120);ctx.fillStyle='#ffb81a';ctx.fillRect(60,80,4,80);ctx.fillRect(40,80,90,5);ctx.fillStyle='#ff3030';if(Math.floor(TIME*1.5)%2)ctx.fillRect(59,74,6,6);
  ctx.fillStyle='rgba(200,190,170,.35)';for(let y=44;y<160;y+=10)ctx.fillRect(30,y,170,3);ctx.strokeStyle='#5a4a3a';ctx.lineWidth=6;ctx.strokeRect(30,40,170,120);
  ctx.fillStyle='#4a3020';ctx.fillRect(0,420,W,60);ctx.fillStyle='#3a2418';ctx.fillRect(0,420,W,6);
  ctx.fillStyle='#c8a46a';ctx.fillRect(470,60,120,80);ctx.fillStyle='#8a6a3a';text('PERMITS',530,90,12,'#5a3a1a','center',null);for(let i=0;i<3;i++)ctx.fillRect(482,100+i*10,96,3);
  // big monitor
  const b=H_.bd,x0=ox()-26,y0=oy()-44,w=b.C*TS+52,h=b.R*TS+70;rrect(x0,y0,w,h,14,'#20242e','#0a0a12',4);ctx.fillStyle='#03121c';ctx.fillRect(x0+12,y0+34,w-24,h-46);
  ctx.fillStyle='#5a5a6a';ctx.fillRect(W/2-20,y0+h,40,18);
  // scan lines
  ctx.fillStyle='rgba(45,226,245,.04)';for(let y=y0+34;y<y0+h-12;y+=4)ctx.fillRect(x0+12,y,w-24,1);
  if(H_.alarm>0&&Math.floor(TIME*8)%2){ctx.fillStyle='rgba(255,0,0,.18)';ctx.fillRect(0,0,W,H);}}
 // atlas cells: [cell index, rotation steps clockwise] for each connection mask, two looks where the sheet has them
 const ATL={5:[[0,0],[2,0]],10:[[1,0],[3,0]],6:[[4,0],[6,0]],12:[[5,0]],9:[[7,0]],3:[[7,1],[5,2]],11:[[8,0]],7:[[9,0]],14:[[10,0]],13:[[11,0]],15:[[12,0]]};
 function cell(a,i,x,y,rot){const s=a.width/4;ctx.save();ctx.translate(x+TS/2,y+TS/2);if(rot)ctx.rotate(rot);ctx.drawImage(a,(i%4)*s,Math.floor(i/4)*s,s,s,-TS/2,-TS/2,TS,TS);ctx.restore();}
 function glow(m,x,y,rot,col){ctx.save();ctx.translate(x+TS/2,y+TS/2);if(rot)ctx.rotate(rot);ctx.lineCap='round';
  for(const pass of [0,1]){ctx.strokeStyle=pass?'#dffcff':col;ctx.globalAlpha=pass?1:.55;ctx.lineWidth=pass?TS*.07:TS*.2;ctx.beginPath();
   for(const [d,dx,dy] of [[HN,0,-1],[HE,1,0],[HS,0,1],[HW,-1,0]])if(m&d){ctx.moveTo(0,0);ctx.lineTo(dx*TS/2,dy*TS/2);}ctx.stroke();}ctx.restore();}
 function artTile(A,t,x,y,lit,gx,gy){const opts=ATL[t.m]||ATL[15],[i,k]=opts[(gx*7+gy*3)%opts.length];cell(A.a,i,x,y,k*Math.PI/2+t.va);
  if(lit)glow(t.m,x,y,t.va,'#2de2f5');}
 function tile(t,x,y,lit,sel,col){ctx.fillStyle=sel?'rgba(255,210,58,.18)':'rgba(30,60,90,.35)';ctx.fillRect(x+2,y+2,TS-4,TS-4);ctx.strokeStyle='rgba(45,226,245,.25)';ctx.lineWidth=1;ctx.strokeRect(x+2,y+2,TS-4,TS-4);
  ctx.save();ctx.translate(x+TS/2,y+TS/2);ctx.rotate(t.va);ctx.lineCap='round';
  for(const pass of [0,1]){ctx.strokeStyle=pass?(lit?'#bff8ff':'#8a96a8'):(lit?'#2de2f5':'#3a4458');ctx.lineWidth=pass?4:12;if(lit&&!pass){ctx.shadowColor='#2de2f5';ctx.shadowBlur=10;}
   ctx.beginPath();for(const [d,dx,dy] of [[HN,0,-1],[HE,1,0],[HS,0,1],[HW,-1,0]])if(t.m&d){ctx.moveTo(0,0);ctx.lineTo(dx*TS/2,dy*TS/2);}ctx.stroke();ctx.shadowBlur=0;}
  ctx.fillStyle=lit?'#fff':'#6a7488';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.restore();}
 H_.draw=function(){bg();const b=H_.bd,X=ox(),Y=oy();
  const done=H_.state==='clear'||H_.state==='end'||H_.state==='outro';const A0=ART(),lx=A0?150:X-12,ly=A0?120:Y-18,rx=A0?500:X+b.C*TS+12;if(A0){rrect(140,104,190,24,10,'rgba(6,14,30,.85)',null);rrect(420,104,92,24,10,'rgba(6,14,30,.85)',null);}text('FILE '+Math.min(H_.bi+1,def.boards.length)+' / '+def.boards.length+(done?'  UNLOCKED!':'  LOCKED'),lx,ly,14,H_.state==='clear'?'#9fb':'#2de2f5','left',null);
  const tm=Math.max(0,Math.ceil(H_.time));text('TIME '+tm,rx,ly,14,tm<=10&&Math.floor(TIME*4)%2?'#ff5a5a':'#ffd23a','right',null);
  const A=ART();
  if(A){for(let y=0;y<b.R;y++)for(let x=0;x<b.C;x++)artTile(A,b.g[y][x],X+x*TS,Y+y*TS,H_.flow.lit.has(x+','+y),x,y);
   const open=H_.state==='clear',pl=H_.flow.lit.size>0;cell(A.a,13,X-TS,Y+b.sr*TS,0);if(pl)glow(HE,X-TS,Y+b.sr*TS,0,'#2de2f5');
   cell(A.a,14,X+b.C*TS,Y+b.tr*TS,0);if(open){glow(HW,X+b.C*TS,Y+b.tr*TS,0,'#2de2f5');ctx.globalAlpha=.35+.25*Math.sin(TIME*10);ctx.fillStyle='#2de2f5';ctx.fillRect(X+b.C*TS,Y+b.tr*TS,TS,TS);ctx.globalAlpha=1;}}
  else{for(let y=0;y<b.R;y++)for(let x=0;x<b.C;x++){const sel=H_.cur.slice(0,np).some(c=>c.x===x&&c.y===y);tile(b.g[y][x],X+x*TS,Y+y*TS,H_.flow.lit.has(x+','+y),sel);}
  // plug and lock
  const py=Y+b.sr*TS+TS/2,ty=Y+b.tr*TS+TS/2;ctx.fillStyle='#ffd23a';ctx.fillRect(X-22,py-8,20,16);ctx.fillStyle='#2de2f5';ctx.fillRect(X-6,py-6,8,12);text('PWR',X-12,py-14,9,'#ffd23a','center',null);
  const open=H_.state==='clear';rrect(X+b.C*TS+2,ty-14,22,28,4,open?'#2de2f5':'#7a2a3a','#fff',2);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(X+b.C*TS+13,ty-14-(open?6:0),7,Math.PI,0);ctx.stroke();}
  // cursors
  for(let i=0;i<np;i++){const c=H_.cur[i],x=X+c.x*TS,y=Y+c.y*TS,col=i?'#ff5ae0':'#ffd23a',pu=Math.sin(TIME*8)*2;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.strokeRect(x+1-pu/2+i*3,y+1-pu/2+i*3,TS-2+pu-i*6,TS-2+pu-i*6);text('P'+(i+1),x+(i?TS-10:10),y+14,10,col,'center');}
  // agents at the desk
  const dance=H_.state==='clear'||(H_.state==='end'&&H_.win);
  const ag=[p1Char(),p2Char()];
  for(let i=0;i<np;i++){const ch=ag[i],x=i?W-60:60,fr=dance?loopFrame(ch,'dance',TIME+i*.25):loopFrame(ch,'idle',TIME+i*.3);const of=outfitFilter(ch);if(of)ctx.filter=of;drawSprite(ch,fr,x,452,i===1,1,1.1);if(of)ctx.filter='none';}
  // HUD: alarms left, clues
  for(let i=0;i<(def.lives||3);i++){ctx.fillStyle=i<H_.lives?'#ff3a3a':'#3a1a2a';ctx.beginPath();ctx.arc(W-30-i*24,24,8,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();}
  text('ALARMS LEFT',W-30-(def.lives||3)*24,29,11,'#fff','right');
  rrect(10,8,110,32,10,'rgba(6,20,36,.75)','#ffd23a',2);imgC('markers/clue',30,24,22);text(H_.clues.length+'/'+def.boards.length,48,30,15,'#ffd23a','left',null);
  if(H_.state==='play'&&H_.t<9&&def.goal&&H_.bi===0){ctx.globalAlpha=Math.min(1,9-H_.t);text(def.goal,W/2,H-12,13,'#fff','center');ctx.globalAlpha=1;}
  else if(H_.state==='play')text('Move: D-pad   Turn: attack/jump   Turn back: gadget',W/2,H-12,11,'#9fb','center',null);
  if(H_.state==='clear'){const cl=def.boards[H_.bi].clue;rrect(W/2-170,180,340,64,12,'rgba(6,20,36,.95)','#ffd23a',3);text('FILE CRACKED!',W/2,206,20,'#9fb','center');if(cl!=null)text('CLUE: '+CLUES[cl].name,W/2,230,14,'#ffd23a','center',null);}
  for(const f of H_.floats){ctx.globalAlpha=Math.min(1,f.life);text(f.t,f.x,f.y,28,f.c,'center');ctx.globalAlpha=1;}
  if(SAVE.testing)text('TESTING MODE',W/2,54,10,'#ff5ae0','center');
  if(H_.state==='intro'){dim(.45);text(def.title,W/2,70,20,'#ffd23a','center');text(def.sub||'',W/2,96,13,'#cfe','center');const ex=def.introExpr||['happy'];sandyBox(def.intro,ex[H_.introIdx%ex.length],Math.min(H_.introIdx,def.intro.length-1));}
  if(H_.state==='outro'){dim(.55);const ex=def.outro.expr||['happy'];sandyBox(def.outro.lines,ex[H_.outroIdx%ex.length],Math.min(H_.outroIdx,def.outro.lines.length-1));}
  if(H_.state==='end'){ctx.fillStyle='rgba(5,3,20,'+Math.min(.6,H_.endT*.4)+')';ctx.fillRect(0,0,W,H);if(H_.win)text(def.winText||'MISSION COMPLETE!',W/2,H/2,32,'#ffd23a','center');else text('ALARM! RUN!',W/2,H/2,32,'#ff5a8a','center');}
 };
 return H_;
}
