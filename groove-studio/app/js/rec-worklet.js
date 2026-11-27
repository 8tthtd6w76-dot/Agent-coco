// mic capture: posts raw chunks stamped with the context time of their first frame.
// With {feat:true} it also posts loudness per 512-sample hop (whole signal + lows), which the Smart Guide uses to find the beat.
class Rec extends AudioWorkletProcessor{constructor(){super();this.on=false;this.feat=false;this.n=0;this.lp=0;this.lp2=0;this.eF=0;this.eL=0;this.eH=0;this.k=0;this.buf=[];this.t0=0;
 this.port.onmessage=e=>{if('on' in e.data)this.on=e.data.on;if('feat' in e.data)this.feat=e.data.feat;};}
process(inp){const ch=inp[0]&&inp[0][0];if(ch){let p=0;for(let i=0;i<ch.length;i++){const v=Math.abs(ch[i]);if(v>p)p=v;}
 this.n++;if(this.on||this.n%6===0)this.port.postMessage({t:currentTime,lvl:p,d:this.on?ch.slice():null});
 if(this.feat){const a=Math.exp(-2*Math.PI*150/sampleRate),a2=Math.exp(-2*Math.PI*2500/sampleRate);let lp=this.lp,lp2=this.lp2,eF=0,eL=0,eH=0;
  for(let i=0;i<ch.length;i++){const x=ch[i];lp=a*lp+(1-a)*x;lp2=a2*lp2+(1-a2)*x;const h=x-lp2;eF+=x*x;eL+=lp*lp;eH+=h*h;}this.lp=lp;this.lp2=lp2;
  if(this.k===0&&!this.buf.length)this.t0=currentTime;this.eF+=eF;this.eL+=eL;this.eH+=eH;
  if(++this.k===4){this.buf.push(this.eF,this.eL,this.eH);this.eF=0;this.eL=0;this.eH=0;this.k=0;
   if(this.buf.length>=24){this.port.postMessage({feat:this.buf,t0:this.t0,hop:512/sampleRate});this.buf=[];}}}}
 return true;}}registerProcessor('rec-tap',Rec);
