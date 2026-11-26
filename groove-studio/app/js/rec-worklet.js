// mic capture: posts raw chunks stamped with the context time of their first frame.
// With {feat:true} it also posts loudness per 512-sample hop (whole signal + lows), which the Smart Guide uses to find the beat.
class Rec extends AudioWorkletProcessor{constructor(){super();this.on=false;this.feat=false;this.n=0;this.lp=0;this.eF=0;this.eL=0;this.k=0;this.buf=[];this.t0=0;
 this.port.onmessage=e=>{if('on' in e.data)this.on=e.data.on;if('feat' in e.data)this.feat=e.data.feat;};}
process(inp){const ch=inp[0]&&inp[0][0];if(ch){let p=0;for(let i=0;i<ch.length;i++){const v=Math.abs(ch[i]);if(v>p)p=v;}
 this.n++;if(this.on||this.n%6===0)this.port.postMessage({t:currentTime,lvl:p,d:this.on?ch.slice():null});
 if(this.feat){const a=Math.exp(-2*Math.PI*150/sampleRate);let lp=this.lp,eF=0,eL=0;
  for(let i=0;i<ch.length;i++){const x=ch[i];lp=a*lp+(1-a)*x;eF+=x*x;eL+=lp*lp;}this.lp=lp;
  if(this.k===0&&!this.buf.length)this.t0=currentTime;this.eF+=eF;this.eL+=eL;
  if(++this.k===4){this.buf.push(this.eF,this.eL);this.eF=0;this.eL=0;this.k=0;
   if(this.buf.length>=16){this.port.postMessage({feat:this.buf,t0:this.t0,hop:512/sampleRate});this.buf=[];}}}}
 return true;}}registerProcessor('rec-tap',Rec);
