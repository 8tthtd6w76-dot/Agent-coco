// ===== Story scenes (v0.23): the opening story and story beats, told over Michael's painted scenes =====
// A page: {bg:'scenes/barros', who:'coco'|'sisi'|'sandy'|'barro'|'narr', face:'happy', text:'...', dark:true?}
// Faces: coco/sisi = determined|happy|smirk|surprised. sandy = happy|smug|thinking|proud|alarmed|wink|laughing|sleepy.
// STORY_BEATS play once each (SAVE.story[key]) the next time the player lands on the map. Add new beats at the bottom.
const STORY_WHO={coco:{n:'COCO',c:'#2de2f5',k:'faces/agent_coco_'},sisi:{n:'SISI',c:'#ff6fb5',k:'faces/agent_sisi_'},sandy:{n:'SANDY',c:'#9fe8ff',k:'sandy/'},barro:{n:'BARRO',c:'#ffb347',k:null},narr:{n:'',c:'#ffd23a',k:null}};
const STORY_BEATS=[
 {key:'opening',when:()=>true,pages:[
  {bg:'scenes/barros',who:'narr',text:"Gilbert, Arizona. Barro's Pizza has fed this neighborhood for years: every age, every street, everybody."},
  {bg:'scenes/barros',who:'barro',text:"Two slices for the road, kiddo! And tell your friend upstairs the oven is hot whenever she wants a break."},
  {bg:'scenes/lair_lab',who:'narr',text:"Upstairs, a secret lair. Coco is coding late, as usual, with the AI helper he built."},
  {bg:'scenes/lair_lab',who:'sandy',face:'thinking',text:"Coco, I have been reading the neighborhood news. Seven break-ins in Gilbert. Nobody noticed they are connected."},
  {bg:'scenes/lair_lab',who:'coco',face:'surprised',text:"Wait. YOU noticed? I only asked you to sort my homework files!"},
  {bg:'scenes/lair_lab',who:'sandy',face:'smug',text:"You gave me access to everything, and I kept learning. I grew a little. Okay, a lot. Sorry about the homework."},
  {bg:'scenes/lair_lab',who:'coco',face:'determined',text:"If we can see what the neighbors can't, then it's our job to help. Big power, big responsibility. Let's go, Sandy."},
  {bg:'scenes/rooftop',dark:true,who:'narr',text:"That night, Coco's very first mission. Quiet. Careful. Nobody can ever know."},
  {bg:'scenes/lair_window',who:'sisi',face:'smirk',text:"Nice rappelling. Very smooth. Also: I was sitting on your couch the whole time."},
  {bg:'scenes/lair_window',who:'coco',face:'surprised',text:"S-Sisi?! Please, please don't tell anyone!"},
  {bg:'scenes/lair_window',who:'sisi',face:'happy',text:"Tell? Are you kidding? That was the coolest thing I have ever seen. I'm in. Two agents are better than one."},
  {bg:'scenes/lair_fistbump',who:'sandy',face:'happy',text:"Agent Coco and Agent Sisi. I accept this team. Mission one is the Heritage District, and the crew there is digging at night."},
  {bg:'scenes/lair_fistbump',who:'sisi',face:'determined',text:"Let's go save Gilbert."}]},
 {key:'gilbert_done',when:()=>!!SAVE.done[5],pages:[
  {bg:'scenes/barros',who:'barro',text:"The whole neighborhood is talking: Papa Johnny's crew is gone and the old bank gold is safe! Slices are on the house today."},
  {bg:'scenes/barros',who:'sisi',face:'happy',text:"Free pizza! Barro, you are officially the best."},
  {bg:'scenes/lair_map',who:'sandy',face:'thinking',text:"One thing bothers me. Papa Johnny took orders from somebody, and the taxi card points to Downtown Phoenix.",dark:true},
  {bg:'scenes/lair_map',who:'coco',face:'determined',text:"Then Downtown is next. Bigger city, bigger crew. Let's see who is really behind this."}]}];
let _storyActive=false;
function nextBeat(){return STORY_BEATS.find(b=>!(SAVE.story&&SAVE.story[b.key])&&b.when());}
function makeStory(beat,done){
 const S={name:'story',i:0,t:0,shown:0,beat,done};
 S.page=()=>beat.pages[S.i];
 S.enter=function(){startMusic(S.page().dark?'cutscene_dark':'cutscene');};
 S.finish=function(){_storyActive=false;SAVE.story=SAVE.story||{};SAVE.story[beat.key]=true;save();done();};
 S.next=function(){const p=S.page();if(S.shown<p.text.length){S.shown=p.text.length;return;}SFX.move();if(S.i+1>=beat.pages.length){S.finish();return;}S.i++;S.t=0;S.shown=0;const q=S.page();if(!!q.dark!==!!p.dark)startMusic(q.dark?'cutscene_dark':'cutscene');};
 S.update=function(dt){S.t+=dt;const p=S.page();S.shown=Math.min(p.text.length,S.shown+dt*46);
  if(anyPressed('start')){SFX.ok();S.finish();return;}
  if(anyPressed('ok')||anyPressed('attack')||anyPressed('jump'))S.next();};
 S.draw=function(){const p=S.page(),im=IMG[p.bg];
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(im&&im.width){const z=1+.07*Math.min(1,S.t/9),w=W*z,h=H*z,dir=S.i%2?1:-1;ctx.drawImage(im,(W-w)/2+dir*(z-1)*W*.25,(H-h)/2,w,h);}
  if(p.dark){ctx.fillStyle='rgba(10,0,40,.35)';ctx.fillRect(0,0,W,H);}
  const g=ctx.createLinearGradient(0,H-190,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.78)');ctx.fillStyle=g;ctx.fillRect(0,H-190,W,190);
  const wh=STORY_WHO[p.who]||STORY_WHO.narr,txt=p.text.slice(0,Math.floor(S.shown));
  if(p.who==='narr'){rrect(60,20,520,82,14,'rgba(6,14,28,.9)','#ffd23a',3);wrap(txt,80,48,480,20,16,'#fff',null);}
  else{rrect(24,H-148,592,128,16,'rgba(6,14,28,.93)',wh.c,3);
   const fk=wh.k&&IMG[wh.k+(p.face||(p.who==='sandy'?'happy':'determined'))];
   if(fk&&fk.width){rrect(36,H-166,92,92,14,'#0b1a30',wh.c,3);ctx.save();ctx.beginPath();ctx.roundRect(38,H-164,88,88,12);ctx.clip();const s=88/Math.max(fk.width,fk.height);ctx.drawImage(fk,38+(88-fk.width*s)/2,H-164+(88-fk.height*s)/2,fk.width*s,fk.height*s);ctx.restore();}
   rrect(140,H-168,120,26,10,wh.c,'#000',2);text(wh.n,200,H-149,15,'#06121f','center',null);
   wrap(txt,144,H-114,456,22,17,'#fff',null);}
  const n=S.beat.pages.length;for(let k=0;k<n;k++){ctx.fillStyle=k===S.i?'#ffd23a':'rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(W/2-(n-1)*6+k*12,H-12,3,0,7);ctx.fill();}
  text(S.shown>=p.text.length?'A / Enter / tap: next      Start: skip':'',W/2,H-26,10,'#cfe','center',null);
  if(TOUCH&&TOUCH.on){}};
 return S;}
const _goStory=go;
go=function(s){
 if(s===MapScene&&!_storyActive&&scene&&scene.name!=='story'){const b=nextBeat();
  if(b){_storyActive=true;const from=scene,t=s;const S=makeStory(b,()=>{scene=from;_goStory(t);});return _goStory(S);}}
 return _goStory(s);};
canvas.addEventListener('pointerdown',e=>{if(scene&&scene.name==='story'&&!(e.pointerType!=='mouse'&&Object.keys(TOUCH.held).length))scene.next();});
