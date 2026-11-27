// ===== Lair Defense menus (v0.47): mode menu, night select, endless, Workshop (upgrade screen), scoreboard, music, codes =====
// Title > LAIR DEFENSE (also Lair menu > Lair Defense). Players: picks 1P/2P right here. Workshop tabs: GUNS, AGENTS, FORTRESS,
// SPECIALS. In GUNS/AGENTS: A = unlock with stars, Y = research (+10% dmg, -5% price per level) with main-game cash + parts.
// FORTRESS: A = next level for 1 star, Y = next level for cash + parts. SPECIALS: A = unlock with stars.
const LD_RES_CASH=[60,120,200],LD_FORT_CASH=[100,200,350];
function ldTakeParts(n){const P=PARTS.filter(p=>p.id!=='tape');const have=P.reduce((a,p)=>a+(SAVE.parts[p.id]||0),0);if(have<n)return false;
 for(let i=0;i<n;i++){const b=P.reduce((a,p)=>(SAVE.parts[p.id]||0)>(SAVE.parts[a.id]||0)?p:a);SAVE.parts[b.id]--;}return true;}
function ldPartsHave(){SAVE.parts=SAVE.parts||{};return PARTS.filter(p=>p.id!=='tape').reduce((a,p)=>a+(SAVE.parts[p.id]||0),0);}
let LD_FROM=null;
const LDMenu={name:'ldmenu',sel:0,np:1,sub:null,ssel:0,msg:'',msgT:0,
 items(){return [{t:'Players: '+(this.np>1?'2 (co-op)':'1'),d:'Press A to switch between 1 player and 2 player co-op.',fn:()=>{this.np=this.np>1?1:2;SFX.move();}},
  {t:'Campaign: 10 Nights',d:'Protect the Lair night by night, from the alley to the roof to the last stand inside. Ends with Baldey.',fn:()=>{this.sub='nights';this.ssel=Math.max(0,LD_NIGHTS.findIndex(n=>!ldSave().stars[n.n]&&ldNightOpen(n.n)));if(this.ssel<0)this.ssel=0;}},
  {t:'Endless',d:'Waves that never stop. A boss every 10 waves, a star every 10 waves (5 per map). Top 10 scoreboard.',fn:()=>{this.sub='endless';this.ssel=0;}},
  {t:'Workshop (upgrades)',d:'Unlock guns, agents, specials and fortress upgrades with stars. Research and armor with your cash and parts.',fn:()=>push(LDShop.make())},
  {t:'Scoreboard',d:'Best scores for every night and the Endless top 10s.',fn:()=>{this.sub='scores';this.ssel=0;}},
  {t:'Back',d:'',fn:()=>this.leave()}];},
 enter(){sceneStack.length=0;this.np=NPLAYERS||1;this.sub=null;startMusic('ld_menu');ldSave();},resume(){startMusic('ld_menu');},
 leave(){SFX.move();if(LD_FROM==='lair'){LD_FROM=null;go(MapScene);push(LairMenu);}else go(Title);},
 start(opt){NPLAYERS=this.np;opt.np=this.np;go(makeLairDefense(opt));},
 update(dt){this.msgT-=dt;
  if(this.sub==='nights'){const n=LD_NIGHTS.length;if(anyPressed('down')||anyPressed('right')){this.ssel=(this.ssel+1)%n;SFX.move();}if(anyPressed('up')||anyPressed('left')){this.ssel=(this.ssel+n-1)%n;SFX.move();}
   if(anyPressed('ok')||anyPressed('jump')){const N=LD_NIGHTS[this.ssel];if(ldNightOpen(N.n)){SFX.ok();this.start({night:N.n});}else{SFX.hurt();this.msg='Clear Night '+(N.n-1)+' first (or enter its code).';this.msgT=2;}}
   if(anyPressed('back')){this.sub=null;SFX.move();}return;}
  if(this.sub==='endless'){if(anyPressed('down')||anyPressed('right')){this.ssel=(this.ssel+1)%3;SFX.move();}if(anyPressed('up')||anyPressed('left')){this.ssel=(this.ssel+2)%3;SFX.move();}
   if(anyPressed('ok')||anyPressed('jump')){if(ldMapOpen(this.ssel)){SFX.ok();this.start({endless:this.ssel});}else{SFX.hurt();this.msg='Reach this map in the campaign first.';this.msgT=2;}}
   if(anyPressed('back')){this.sub=null;SFX.move();}return;}
  if(this.sub==='scores'){if(anyPressed('left')){this.ssel=(this.ssel+3)%4;SFX.move();}if(anyPressed('right')){this.ssel=(this.ssel+1)%4;SFX.move();}if(anyPressed('back')||anyPressed('ok')){this.sub=null;SFX.move();}return;}
  const I=this.items();navList(this,I.length);if(anyPressed('ok')||anyPressed('jump')){SFX.ok();I[this.sel].fn();return;}
  if(anyPressed('left')||anyPressed('right')){if(this.sel===0){I[0].fn();}}
  if(backPressed()){this.leave();}},
 draw(){ldMenuBg();text('LAIR DEFENSE',W/2,58,40,'#ffd23a','center','#1b0a3a');text('Protect Sandy and the Lair from Baldey\'s crew',W/2,82,13,'#2de2f5','center','#1b0a3a');
  text('★ '+ldStarsFree()+' to spend  ('+ldStarsTotal()+' earned)',W-16,24,12,'#ffd23a','right');
  if(this.sub==='nights')return this.drawNights();if(this.sub==='endless')return this.drawEndless();if(this.sub==='scores')return this.drawScores();
  const I=this.items();I.forEach((it,i)=>{const y=110+i*44,s=i===this.sel;rrect(150,y,340,36,12,s?'#ffd23a':'rgba(10,8,40,.86)',s?'#fff':'#2de2f5',3);text(it.t,W/2,y+24,17,s?'#1b0a3a':'#fff','center',null);
   MUI.add(150,y,340,36,{hover:()=>{this.sel=i;},click:()=>{this.sel=i;SFX.ok();it.fn();}});});
  const d=I[this.sel].d;if(d){rrect(80,378,480,56,10,'rgba(6,20,36,.9)','#2de2f5',2);wrap(d,96,400,450,17,13,'#dfe',null);}
  text('Up/Down choose   A select   B back',W/2,462,11,'#9fb','center',null);mBack();},
 drawNights(){const L=ldSave();LD_NIGHTS.forEach((N,i)=>{const c=i%2,r=Math.floor(i/2),x=40+c*284,y=104+r*58,s=i===this.ssel,open=ldNightOpen(N.n);
   rrect(x,y,276,50,10,s?'#ffd23a':open?'rgba(10,8,40,.88)':'rgba(30,30,40,.8)',s?'#fff':['#7a7a8a','#c88a4a','#2de2f5'][N.map],2.5);
   text('Night '+N.n+(N.boss?'  BOSS':''),x+12,y+19,11,s?'#1b0a3a':'#9cf','left',null);text(open?N.name:'Locked',x+12,y+40,16,s?'#1b0a3a':open?'#fff':'#889','left',null);
   for(let k=0;k<3;k++)text('★',x+214+k*20,y+32,18,k<(L.stars[N.n]||0)?'#ffd23a':s?'#7a6a3a':'#334','center',null);
   MUI.add(x,y,276,50,{hover:()=>{this.ssel=i;},click:()=>{this.ssel=i;MUI.btn('ok');}});});
  const N=LD_NIGHTS[this.ssel];text(LD_MAPS[N.map].n+'  •  '+N.waves+' waves'+(L.best[N.n]?'  •  best '+L.best[N.n]:''),W/2,404,12,'#cde','center',null);
  if(this.msgT>0)text(this.msg,W/2,428,13,'#ff8a8a','center');text('A start   B back',W/2,462,11,'#9fb','center',null);mBack();},
 drawEndless(){const L=ldSave();LD_MAPS.forEach((M,i)=>{const x=40+i*192,y=120,s=i===this.ssel,open=ldMapOpen(i);rrect(x,y,176,220,14,s?'#ffd23a':'rgba(10,8,40,.88)',s?'#fff':'#2de2f5',3);
   text(open?M.n:'Locked',x+88,y+30,16,s?'#1b0a3a':'#fff','center',null);const best=(L.endless[i]||[])[0];text(best?'Best: wave '+best.w:'No runs yet',x+88,y+60,13,s?'#1b0a3a':'#cde','center',null);
   if(best)text(best.s+' pts',x+88,y+80,12,s?'#1b0a3a':'#ffd23a','center',null);for(let k=0;k<5;k++)text('★',x+40+k*24,y+120,18,k<(L.estars[i]||0)?'#ffd23a':'#334','center',null);
   text('Stars at waves 10-50',x+88,y+146,10,s?'#1b0a3a':'#9ab','center',null);MUI.add(x,y,176,220,{hover:()=>{this.ssel=i;},click:()=>{this.ssel=i;MUI.btn('ok');}});});
  if(this.msgT>0)text(this.msg,W/2,380,13,'#ff8a8a','center');text('A start   B back',W/2,462,11,'#9fb','center',null);mBack();},
 drawScores(){const L=ldSave();rrect(60,100,520,330,14,'rgba(6,20,36,.94)','#2de2f5',3);const tabs=['Nights',...LD_MAPS.map(m=>m.n)];
  tabs.forEach((t,i)=>{const x=70+i*128,s=i===this.ssel;rrect(x,108,120,24,8,s?'#ffd23a':'rgba(255,255,255,.08)',null);text(t,x+60,125,11,s?'#102':'#fff','center',null);MUI.add(x,108,120,24,{click:()=>{this.ssel=i;}});});
  if(this.ssel===0)LD_NIGHTS.forEach((N,i)=>{const y=156+i*26;text('Night '+N.n+': '+N.name,90,y,13,'#fff','left',null);text('★'.repeat(L.stars[N.n]||0),400,y,13,'#ffd23a','left',null);text(L.best[N.n]?String(L.best[N.n]):'-',560,y,13,'#7ff','right',null);});
  else{const list=L.endless[this.ssel-1]||[];if(!list.length)text('No Endless runs on this map yet.',W/2,240,14,'#cde','center',null);
   list.forEach((r,i)=>{const y=160+i*25;text('#'+(i+1),90,y,13,i<3?'#ffd23a':'#fff','left',null);text(r.who,130,y,13,'#fff','left',null);text('wave '+r.w,380,y,13,'#cde','left',null);text(String(r.s),560,y,13,'#7ff','right',null);});}
  text('Left/Right switch   B back',W/2,462,11,'#9fb','center',null);mBack();}};
function ldMenuBg(){ctx.fillStyle='#0d0a24';ctx.fillRect(0,0,W,H);if(IMG['scenes/rooftop']&&IMG['scenes/rooftop'].width){img('scenes/rooftop',0,0,W,H);dim(.62);}
 else if(IMG['scenes/lair_window']&&IMG['scenes/lair_window'].width){img('scenes/lair_window',0,0,W,H);dim(.62);}}

// ---------- Workshop: the big upgrade screen
const LDShop={name:'ldshop',make(){this.tab=0;this.sel=0;this.scroll=0;this.msg='';this.msgT=0;return this;},
 tabs:['GUNS','AGENTS','FORTRESS','SPECIALS'],
 rows(){const L=ldSave();if(this.tab===0||this.tab===1)return (this.tab?LD_AGENTS:LD_GUNS).map(U=>({U,n:U.n,d:U.d,col:U.col,lock:!ldUnlocked(U),star:U.star,res:ldRes(U.id),
   info:'$'+ldBuyCost(U)+'  dmg '+U.dmg+'  range '+U.range+(U.air?'  hits flyers':'')}));
  if(this.tab===2)return LD_FORT.map(F=>({F,n:F.n,d:F.d,col:'#c8a46a',lvl:L.fort[F.id]||0}));
  return LD_SPECIALS.map(S=>({S,n:S.n,d:S.d,col:S.col,lock:!ldUnlocked(S),star:S.star,info:'Recharge '+S.cd+'s'}));},
 toast(t){this.msg=t;this.msgT=2.2;},
 buyStar(r){const L=ldSave();
  if(r.F){if(r.lvl>=3)return this.toast('Already max level.');if(ldStarsFree()<1)return this.toast('Need 1 star. Clear nights to earn more!');L.spent++;L.fort[r.F.id]=r.lvl+1;save();SFX.pick();return this.toast(r.n+' is now level '+(r.lvl+1)+'!');}
  const it=r.U||r.S;if(!r.lock)return this.toast(r.U?'Already unlocked. Y = research with cash + parts.':'Already unlocked.');
  if(ldStarsFree()<it.star)return this.toast('Need '+it.star+' stars. You have '+ldStarsFree()+'.');L.spent+=it.star;L.unlock[it.id]=1;save();SFX.win();this.toast(it.n+' UNLOCKED!');},
 buyCash(r){const L=ldSave();
  if(r.F){if(r.lvl>=3)return this.toast('Already max level.');const c=LD_FORT_CASH[r.lvl],n=r.lvl+1;if(SAVE.coins<c)return this.toast('Need $'+c+' (you have $'+SAVE.coins+').');if(ldPartsHave()<n)return this.toast('Need '+n+' crafting part'+(n>1?'s':'')+' (buy some at Barro\'s Shop).');
   SAVE.coins-=c;ldTakeParts(n);L.fort[r.F.id]=r.lvl+1;save();SFX.pick();return this.toast(r.n+' is now level '+(r.lvl+1)+'!');}
  if(!r.U)return this.toast('Specials unlock with stars (A).');if(r.lock)return this.toast('Unlock it first (A, '+r.star+' stars).');if(r.res>=3)return this.toast('Research is maxed.');
  const c=LD_RES_CASH[r.res],n=r.res+1;if(SAVE.coins<c)return this.toast('Need $'+c+' (you have $'+SAVE.coins+').');if(ldPartsHave()<n)return this.toast('Need '+n+' crafting part'+(n>1?'s':'')+'.');
  SAVE.coins-=c;ldTakeParts(n);L.res[r.U.id]=r.res+1;save();SFX.pick();this.toast(r.n+' research level '+(r.res+1)+': +10% damage, -5% price.');},
 update(dt){this.msgT-=dt;const R=this.rows();
  if(anyPressed('left')){this.tab=(this.tab+3)%4;this.sel=0;this.scroll=0;SFX.move();}if(anyPressed('right')){this.tab=(this.tab+1)%4;this.sel=0;this.scroll=0;SFX.move();}
  navList(this,R.length);if(this.sel<this.scroll)this.scroll=this.sel;if(this.sel>=this.scroll+7)this.scroll=this.sel-6;
  if(anyPressed('ok')||anyPressed('jump'))this.buyStar(R[this.sel]);if(anyPressed('gadget'))this.buyCash(R[this.sel]);
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){ldMenuBg();dim(.2);text('THE WORKSHOP',W/2,40,28,'#ffd23a','center','#1b0a3a');
  text('★ '+ldStarsFree(),24,30,18,'#ffd23a','left');text('$'+SAVE.coins+'   parts '+ldPartsHave(),W-24,30,15,'#7f7','right');
  this.tabs.forEach((t,i)=>{const x=40+i*142,s=i===this.tab;rrect(x,56,134,28,9,s?'#ffd23a':'rgba(10,8,40,.9)',s?'#fff':'#2de2f5',2);text(t,x+67,75,13,s?'#102':'#fff','center',null);
   MUI.add(x,56,134,28,{click:()=>{this.tab=i;this.sel=0;this.scroll=0;SFX.move();}});});
  const R=this.rows();panel(24,92,360,330);
  R.slice(this.scroll,this.scroll+7).forEach((r,k)=>{const i=k+this.scroll,y=100+k*45,s=i===this.sel;rrect(32,y,344,40,9,s?'rgba(255,210,58,.95)':'rgba(255,255,255,.05)',null);
   if(!(typeof ldRowArt==='function'&&ldRowArt(r,52,y+20))){ctx.fillStyle=r.col;ctx.beginPath();ctx.arc(52,y+20,11,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();}
   text(r.n,72,y+17,14,s?'#102':r.lock?'#99a':'#fff','left',null);
   const sub=r.F?'Level '+r.lvl+' / 3':r.lock?'LOCKED  •  '+r.star+' ★':(r.U?'Research '+r.res+' / 3':'Unlocked');text(sub,72,y+33,10,s?'#3a2a10':r.lock?'#ffb36a':'#9cf','left',null);
   if(r.F){for(let q=0;q<3;q++){rrect(320+q*16,y+14,12,12,3,q<r.lvl?'#3aff8a':'#223','#000',1);}}
   MUI.add(32,y,344,40,{hover:()=>{this.sel=i;},click:()=>{if(this.sel===i)this.buyStar(r);this.sel=i;},right:()=>{this.sel=i;this.buyCash(r);},wheel:d=>{this.scroll=Math.max(0,Math.min(R.length-7,this.scroll-d));}});});
  if(R.length>7)text((this.scroll+1)+'-'+Math.min(R.length,this.scroll+7)+' of '+R.length,204,418,10,'#9ab','center',null);
  const r=R[this.sel];panel(396,92,220,330);if(r){text(r.n,506,122,15,'#ffd23a','center',null);wrap(r.d,410,148,196,16,12,'#dfe',null);if(r.info)wrap(r.info,410,230,196,15,11,'#9cf',null);
   let y=290;const line=(t,c)=>{wrap(t,410,y,196,15,11,c,null);y+=34;};
   if(r.F){if(r.lvl<3){line('A: level '+(r.lvl+1)+' for 1 star','#ffd23a');line('Y: level '+(r.lvl+1)+' for $'+LD_FORT_CASH[r.lvl]+' + '+(r.lvl+1)+' part'+(r.lvl?'s':''),'#7f7');}else line('MAX LEVEL','#3aff8a');}
   else if(r.lock)line('A: unlock for '+r.star+' star'+(r.star>1?'s':''),'#ffd23a');
   else if(r.U){if(r.res<3)line('Y: research for $'+LD_RES_CASH[r.res]+' + '+(r.res+1)+' part'+(r.res?'s':''),'#7f7');else line('Research maxed','#3aff8a');}}
  if(this.msgT>0){rrect(100,428,440,26,9,'rgba(6,20,36,.95)','#ffd23a',2);text(this.msg,W/2,446,12,'#fff','center',null);}
  else text('Left/Right tabs   A stars   Y cash + parts   B back',W/2,446,11,'#9fb','center',null);
  if(MUI.mouseRecent())text('Click = pick, click again = A, right-click = Y',W/2,468,10,'#789','center',null);mBack();}};

// ---------- music: every map, boss and menu gets its own funky track
if(typeof track==='function'){
 track('ld_menu','Fortress Funk','Lair Defense menu. A proud, strutting groove: clav, horn hits and a bass that marches.',
  {bpm:104,swing:.12,prog:[['D','m9'],['G','13'],['D','m9'],['A','7s9']],drums:{A:dr(DR.drive,{}),F:DR.driveF},dseq:'AAAF',
   bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.6},{i:'stab',o:12,h:['x.......x.......','................']}],
   lead:{i:'brass',at:4,mel:'D5/2 F5/2 G5/4 A5/2 G5/2 F5/4  D5/2 C5/2 A4/4 C5/8  D5/2 F5/2 A5/4 C6/2 A5/2 G5/4  E5/4 G5/4 A5/8'}});
 track('ld_alley','Alley Cat Shuffle','Lair Defense: the alley. Sneaky, bouncy funk with a muted wah and rimshots.',
  {bpm:98,swing:.18,prog:[['E','m9'],['E','m9'],['A','9'],['B','7s9']],drums:{A:dr(DR.sneak,{}),F:DR.sneakF},dseq:'AAAF',bassI:'sub',
   bass:['0-..o..0..7.a.o.','0-..o..0..7.3.5.','0-..o..0..7.a.o.','0-..o.x0..4.7.a.'],comp:[{i:'wah',h:'..x...x...x.x...',v:.5},{i:'ep',h:'x-......x-......',v:.4}],
   lead:{i:'whistle',at:4,mel:'E5/2 G5/2 A5/2 B5/2 A5/4 G5/4  E5/2 D5/2 B4/4 D5/8  E5/2 G5/2 B5/2 D6/2 B5/4 A5/4  F#5/4 A5/4 B5/8'}});
 track('ld_roof','Rooftop Rumble','Lair Defense: Barro\'s roof. Fast, bright funk under the city lights.',
  {bpm:112,swing:.1,prog:[['G','m9'],['C','9'],['G','m9'],['D','7s9']],drums:{A:dr(DR.drive,{n:'....x.......x...'}),F:DR.driveF},dseq:'AAAF',
   bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.65},{i:'stab',o:12,h:['........x..x....','................']}],
   lead:{i:'brass',at:4,mel:'G5/2 Bb5/2 C6/4 D6/2 C6/2 Bb5/4  G5/2 F5/2 D5/4 F5/8  G5/2 Bb5/2 D6/4 F6/2 D6/2 C6/4  A5/4 C6/4 D6/8'}});
 track('ld_lair','Last Stand Strut','Lair Defense: inside the Lair. Darker and slower, still catchy: organ, sub bass and a spooky whistle.',
  {bpm:94,swing:.14,prog:[['C','m9'],['Ab','maj7'],['F','m9'],['G','7s9']],drums:{A:dr(DR.heavy,{}),F:DR.heavyF},dseq:'AAAF',bassI:'sub',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],comp:[{i:'organ',h:'x-..x-..x-..x-..',v:.45},{i:'wah',h:'..x...x...x.x...',v:.4}],
   lead:{i:'whistle',at:4,mel:'C5/2 Eb5/2 G5/4 Ab5/2 G5/2 F5/4  Eb5/2 D5/2 C5/4 D5/8  C5/2 Eb5/2 G5/4 Bb5/2 Ab5/2 G5/4  F5/4 D5/4 C5/8'}});
 track('ld_boss','Boss at the Door','Lair Defense boss waves. Stompy, heavy funk with horn hits and a growly bass.',
  {bpm:118,swing:.08,prog:[['A','m9'],['A','m9'],['F','maj7'],['E','7s9']],drums:{A:dr(DR.heavy,{}),F:DR.heavyF},dseq:'AAAF',bassI:'sub',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],comp:[{i:'stab',h:'x..x..x.....x.x-',v:.7},{i:'organ',h:'..x-......x-....',v:.5}],
   lead:{i:'brass',at:2,mel:'A5/2 C6/2 D6/2 E6/2 G6/4 E6/4  F6/2 E6/2 D6/2 C6/2 B5/8'}});
 track('ld_baldey','Bigg Buff Bounce','Lair Defense finale: Bigg Buff Baldey. The biggest, baddest, funkiest boss groove in the Valley.',
  {bpm:108,swing:.12,prog:[['F','m9'],['Db','maj7'],['Bb','m9'],['C','7s9']],drums:{A:dr(DR.heavy,{n:'..............x.'}),F:DR.heavyF},dseq:'AAAF',bassI:'sub',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],comp:[{i:'stab',h:'x..x..x.....x.x-',v:.75},{i:'clav',h:'..x.g.x...x.g.x.',v:.55}],
   lead:{i:'brass',at:2,mel:'F5/2 Ab5/2 Bb5/2 C6/2 Eb6/4 C6/4  Db6/2 C6/2 Bb5/2 Ab5/2 G5/8  F5/2 Ab5/2 C6/4 F6/4 E6/8'}});
}

// ---------- codes: night codes + cheats
CHEATS.push({code:'BUTTBOMB',key:'buttbomb',kind:'unlock',name:'Atomic Butt Bomb',d:'Lair Defense special: Agent Coco jetpacks off his perch and butt-slams 12 goons!'},
 {code:'FORTKNOX',key:'fortknox',kind:'toggle',name:'Fort Knox',d:'Lair Defense: +$500 starting cash and +25% tower damage.'});
(function(){const _ec=enterCode;enterCode=function(raw){const c=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 for(const n in LD_NIGHT_CODES)if(LD_NIGHT_CODES[n]===c){ldSave().unlock['night'+n]=1;save();return {ok:true,title:'LAIR DEFENSE NIGHT '+n+' UNLOCKED',text:'"'+LD_NIGHTS[n-1].name+'" is open in Lair Defense.'};}
 return _ec(raw);};})();

// ---------- hook into the Title menu and the Lair menu
(function(){const _li=LairMenu.items;LairMenu.items=function(){const I=_li.apply(this,arguments);const i=I.findIndex(x=>x.n==='Gadget Watch');
 I.splice(i<0?I.length-1:i,0,{n:'Lair Defense',d:'Tower defense! Protect Sandy and the Lair from Baldey\'s crew, night after night.',go:()=>{LD_FROM='lair';go(LDMenu);}});return I;};
 if(typeof LAIR_ROOMS!=='undefined')LAIR_ROOMS['Lair Defense']=['lair_roof','THE ROOF'];})();
// mouse: the menus draw their own boxes; the game draws its boxes in ldDrawHud
if(typeof MH!=='undefined'){MH.ldmenu=null;MH.ldshop=null;MH.ld=null;}
