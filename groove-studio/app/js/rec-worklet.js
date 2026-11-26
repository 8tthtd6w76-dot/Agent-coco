// mic capture: posts raw chunks stamped with the context time of their first frame
class Rec extends AudioWorkletProcessor{constructor(){super();this.on=false;this.n=0;this.port.onmessage=e=>{this.on=e.data.on;};}
process(inp){const ch=inp[0]&&inp[0][0];if(ch){let p=0;for(let i=0;i<ch.length;i++){const v=Math.abs(ch[i]);if(v>p)p=v;}
 this.n++;if(this.on||this.n%6===0)this.port.postMessage({t:currentTime,lvl:p,d:this.on?ch.slice():null});}return true;}}registerProcessor('rec-tap',Rec);
