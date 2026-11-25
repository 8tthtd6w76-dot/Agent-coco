// ===== Character select (v0.35): Coco, Sisi or Sandy =====
// Title -> 1 PLAYER / 2 PLAYER CO-OP -> this screen -> map. Player 1 picks first; in co-op Player 2 then picks one of the other two.
// Writes SAVE.p1char / SAVE.p2char. p1Char() and p2Char() (codes.js) read them, so every mode follows the picks:
// side-scroller missions (player.js), stealth, pursuit, hacking, pizza delivery, results dance, HUD faces, key hints.
// Input: left/right choose, A / Space / Enter / tap = lock in, B / Q / Backspace = back (P2 back -> P1 picks again; P1 back -> title).
// Co-op: P1 uses pad 1 / left keyboard half / touch, P2 uses pad 2 / right keyboard half (touch can also tap for P2).
// Sandy: playable sheet built by tools/build_sandy.py from assets/sandy/body.png + expression heads (assets/agent_sandy/).

// ---- Sandy as a playable hero ----
SHEETS.agent_sandy={"cell":[460,470],"anchorX":230,"padBottom":8,"scale":0.32,"frames":{}};
(function(){const N=['idle_1','idle_2','run_1','run_2','run_3','run_4','jump','fall','crouch','zap_1','zap_2','zap_3','zap_4','beam_1','beam_2','beam_3','beam_4',
 'spin_1','spin_2','spin_3','spin_4','land_1','dance_1','dance_2','dance_3','dance_4','punch_1','kick'];
 N.forEach((n,k)=>{SHEETS.agent_sandy.frames[n]={x:(k%8)*460,y:Math.floor(k/8)*470,w:460,h:470,airborne:/^(jump|fall|spin)/.test(n)};});})();
for(const f of ['happy','smirk','surprised','determined'])ASSET_LIST.push(['faces/agent_sandy_'+f,'assets/faces/agent_sandy_'+f+'.png']);
CHARS.agent_sandy={label:'SANDY',speed:165,jump:-500,doubleJump:-450,hang:.8,fallMul:.9,tag:'#bff6ff',ring:'#2de2f5',beam:'#fff27a',flipFx:'#bff6ff',
 atk:.2,atkFinisher:.3,atkWarmup:.03,lunge:80,lungeFinisher:150,
 anims:{idle:{f:['idle_1','idle_2'],fps:2.5},run:{f:['run_1','run_2','run_3','run_4'],fps:10},
  jump:{f:['jump']},fall:{f:['fall']},crouch:{f:['crouch']},
  // antenna charge -> zap -> wink
  beam:{f:['beam_1','beam_2','beam_3','beam_3','beam_3','beam_4','beam_4']},
  // zap combo: spark jab, spark jab, BIG spark
  zap1:{f:['zap_1','zap_2','zap_2','zap_2']},zap2:{f:['zap_3']},zap3:{f:['zap_3','zap_4','zap_4','zap_4']},
  // hover spin double jump and its landing
  flip:{f:['spin_1','spin_2','spin_3','spin_4','spin_1','spin_2','spin_3']},land2:{f:['land_1']},
  dance:{f:['dance_1','dance_2','dance_3','dance_4'],fps:2.3}},
 combo:['zap1','zap2','zap3'],gadget:{dur:.36,fireAt:.1,slow:.35},muzzle:[18,40]};
// Sandy has no gadget loadout of her own: she borrows the one of the agent sitting this mission out (Coco's when solo)
const AGENT_IDS=['agent_coco','agent_sisi','agent_sandy'];
function benchAgent(){const used=[p1Char()];if(NPLAYERS>1)used.push(p2Char());return ['agent_coco','agent_sisi'].find(c=>!used.includes(c))||'agent_coco';}
const _equippedCS=equipped;equipped=function(ch){return _equippedCS(ch==='agent_sandy'?benchAgent():ch);};
// top-down Sandy (pursuit scooter and pizza bike): a little orb with a cyan band and the yellow antenna
function sandyTop(c){c.lineWidth=2;c.strokeStyle='#111';c.fillStyle='#e9eef5';c.beginPath();c.arc(0,-2,10,0,7);c.fill();c.stroke();
 c.fillStyle='#2de2f5';c.fillRect(-10,0,20,3);c.fillStyle='#0b1a2a';c.beginPath();c.ellipse(0,-6,6,3.5,0,0,7);c.fill();
 c.fillStyle='#ffd23a';c.beginPath();c.arc(0,-14,2.5,0,7);c.fill();c.stroke();
 c.fillStyle='#e9eef5';c.beginPath();c.arc(-12,4,3.5,0,7);c.arc(12,4,3.5,0,7);c.fill();}
// Sandy's own character theme (plays while she is highlighted)
TR.sandy={title:'Circuit Bounce',desc:'Sandy character screen. Happy robot funk: bubbly synth bass, music-box bells and a beep-boop whistle.',
 bpm:108,swing:.12,prog:[['G','maj9'],['E','m9'],['C','maj9'],['D','9']],
 drums:{A:dr(DR.pocket,{z:R16}),F:DR.pocketF},dseq:'AAAF',
 bassI:'synth',bass:['0..o.0o.7.0.a.o.','0..o.0o.7.0.3.5.','0..o.0o.7.0.4.o.','0..o.xo.4.7.a.o.'],
 comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.5},{i:'clav',h:'..x...x...x.x...',v:.5}],
 lead:{i:'whistle',mel:'D5/1 G5/1 B5/2 A5/1 G5/1 E5/2 G5/4 D5/4  E5/1 G5/1 B5/2 A5/2 G5/2 E5/4 D5/4  C5/1 E5/1 G5/2 A5/2 B5/2 C6/4 B5/4  A5/2 F#5/2 D5/2 A5/2 G5/8'}};
MUSIC_ALIAS.char_sandy='sandy';try{MUSIC_LIST.push({name:'sandy',title:TR.sandy.title,desc:TR.sandy.desc});}catch(e){}

// ---- the select screen ----
const AGENT_CARDS=[
 {ch:'agent_coco',name:'COCO',col:'#2de2f5',bg:'rgba(11,61,88,.94)',music:'char_coco',
  perks:['Gadget wizard','Punch, punch, KICK!','Big floaty jumps']},
 {ch:'agent_sisi',name:'SISI',col:'#ff6fb5',bg:'rgba(90,18,64,.94)',music:'char_sisi',
  perks:['Fastest agent','Flip-kick combo','Cartwheel dodge']},
 {ch:'agent_sandy',name:'SANDY',col:'#bff6ff',bg:'rgba(30,48,70,.94)',music:'char_sandy',
  perks:['Hover robot orb','Zap-zap-BIG ZAP','Floatiest jumps']}];
const CS_W=184,CS_H=284,CS_Y=86,CS_X=[24,228,432];
const CharSelect={name:'charselect',phase:0,cur:[0,1],lock:[-1,-1],go:0,
 enter(){const i1=AGENT_IDS.indexOf(p1Char()),i2=AGENT_IDS.indexOf(p2Char());
  this.cur=[Math.max(0,i1),Math.max(0,i2)];this.lock=[-1,-1];this.phase=0;this.go=0;this.tapT=-9;startMusic(AGENT_CARDS[this.cur[0]].music);},
 resume(){},
 co(){return NPLAYERS>1;},
 move(d){const p=this.phase;let c=this.cur[p];for(let k=0;k<3;k++){c=(c+d+3)%3;if(c!==this.lock[0]||p===0)break;}
  if(c!==this.cur[p]){this.cur[p]=c;SFX.move();startMusic(AGENT_CARDS[c].music);}},
 pickCard(i){const p=this.phase;if(p===1&&i===this.lock[0])return;if(this.cur[p]!==i){this.cur[p]=i;SFX.move();startMusic(AGENT_CARDS[i].music);}},
 confirm(){if(this.go)return;const p=this.phase;this.lock[p]=this.cur[p];SFX.ok();
  if(p===0&&this.co()){this.phase=1;if(this.cur[1]===this.lock[0])this.cur[1]=[0,1,2].find(i=>i!==this.lock[0]);startMusic(AGENT_CARDS[this.cur[1]].music);return;}
  SAVE.p1char=AGENT_CARDS[this.lock[0]].ch;if(this.co())SAVE.p2char=AGENT_CARDS[this.lock[1]].ch;save();this.go=.001;SFX.win();},
 back(){SFX.move();if(this.phase===1){this.phase=0;this.lock=[-1,-1];startMusic(AGENT_CARDS[this.cur[0]].music);}else go(Title);},
 update(dt){
  if(this.go){this.go+=dt;if(this.go>1.2)go(MapScene);return;}
  const p=this.phase,P=b=>this.co()?pressed(p,b):anyPressed(b);
  if(P('left'))this.move(-1);if(P('right'))this.move(1);
  if(P('ok')||P('start')){this.confirm();return;}
  if(P('back')||(this.co()&&p===1&&pressed(0,'back')))this.back();},
 hit(mx,my){for(let i=0;i<3;i++)if(mx>CS_X[i]&&mx<CS_X[i]+CS_W&&my>CS_Y-16&&my<CS_Y+CS_H)return i;
  if(Math.abs(mx-W/2)<80&&Math.abs(my-392)<22)return 'go';return -1;},
 tap(mx,my){if(this.go)return;const h=this.hit(mx,my);if(h==='go'){this.confirm();return;}if(h<0)return;
  const p=this.phase;if(h===this.cur[p]&&TIME-this.tapT<3)this.confirm();else this.pickCard(h);this.tapT=TIME;},
 draw(){if(IMG['scenes/lair_map']&&IMG['scenes/lair_map'].width)img('scenes/lair_map',0,0,W,H);else{ctx.fillStyle='#120a2a';ctx.fillRect(0,0,W,H);}dim(.62);
  const co=this.co(),p=this.phase;
  text('CHOOSE YOUR AGENT',W/2,42,30,'#ffd23a','center');
  const sub=!co?'Who are you playing as tonight?':(p===0?'PLAYER 1, pick your agent!':'PLAYER 2, pick from the other two!');
  text(sub,W/2,66,15,p===1?'#ff9ae0':'#cfe','center',null);
  AGENT_CARDS.forEach((c,i)=>{const x=CS_X[i],y=CS_Y,mine1=this.lock[0]===i||(p===0&&this.cur[0]===i),mine2=co&&(this.lock[1]===i||(p===1&&this.cur[1]===i));
   const hot=(p===0&&this.cur[0]===i)||(p===1&&this.cur[1]===i),taken=p===1&&this.lock[0]===i,picked=this.go&&(this.lock[0]===i||this.lock[1]===i);
   const lit=hot||taken||picked,sc=hot&&!this.go?1+Math.sin(TIME*5)*.012:(picked?1.04:1);
   ctx.save();ctx.translate(x+CS_W/2,y+CS_H/2);ctx.scale(sc,sc);ctx.translate(-(x+CS_W/2),-(y+CS_H/2));rrect(x,y,CS_W,CS_H,16,c.bg.replace('.94)','1)'),hot?(p===1?'#ff9ae0':'#ffd23a'):c.col,hot?5:3);
   ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x+CS_W/2,y+192,50,9,0,0,7);ctx.fill();
   const anim=picked?'dance':(hot?'run':'idle');let fr=loopFrame(c.ch,anim,TIME+i*.3);if(!SHEETS[c.ch].frames[fr])fr=loopFrame(c.ch,'idle',TIME);
   const of=outfitFilter(c.ch);if(of)ctx.filter=of;
   if(picked){const [sx,sy,r,oy]=danceHop(c.ch,TIME+i*.25);drawSprite(c.ch,fr,x+CS_W/2,y+192+oy,false,1,1.2,sx,sy,r);}
   else drawSprite(c.ch,fr,x+CS_W/2,y+192,false,1,1.2);ctx.filter='none';
   const f=IMG['faces/'+c.ch+(hot||picked?'_happy':'_smirk')];if(f&&f.width)ctx.drawImage(f,x+CS_W-50,y+8,42,42);
   text(c.name,x+CS_W/2,y+222,20,c.col,'center');
   c.perks.forEach((t,k)=>text(t,x+CS_W/2,y+240+k*15,11,'#e8f4ff','center',null));
   if(!lit)rrect(x,y,CS_W,CS_H,16,'rgba(5,3,20,.55)',null);
   ctx.restore();
   const tag=(lb,col,tx,ok)=>{rrect(tx-26,y-16,52,24,8,col,'#fff',2);text(lb+(ok?' ✓':''),tx,y+2,13,'#102','center',null);};
   if(mine1&&mine2){tag('P1','#ffd23a',x+CS_W/2-30,this.lock[0]===i);tag('P2','#ff9ae0',x+CS_W/2+30,this.lock[1]===i);}
   else if(mine1)tag('P1','#ffd23a',x+CS_W/2,this.lock[0]===i);else if(mine2)tag('P2','#ff9ae0',x+CS_W/2,this.lock[1]===i);});
  if(this.go){const a=AGENT_CARDS[this.lock[0]].name+(co?' & '+AGENT_CARDS[this.lock[1]].name:'');text(a+', READY!',W/2,402,24,'#ffd23a','center');}
  else{rrect(W/2-80,372,160,38,12,p===1?'rgba(255,154,224,.95)':'rgba(255,210,58,.95)','#fff',3);text(co&&p===0?'P1 LOCK IN':'GO!',W/2,398,co&&p===0?17:20,'#1b0a3a','center',null);
   text('◀ ▶ choose     A / Enter: '+(co&&p===0?'lock in':'GO')+'     B: back',W/2,430,12,'#cfe','center',null);}}};
canvas.addEventListener('pointerdown',e=>{if(scene!==CharSelect)return;const r=canvas.getBoundingClientRect();CharSelect.tap((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);});

// ---- key labels follow the picks (Controls screen + in-mission hint pills) ----
if(typeof CTL_P!=='undefined')CTL_P.forEach((P,i)=>{const ch=()=>i?p2Char():p1Char();
 Object.defineProperty(P,'who',{get:()=>'AGENT '+CHARS[ch()].label});
 Object.defineProperty(P,'short',{get:()=>CHARS[ch()].label});});
