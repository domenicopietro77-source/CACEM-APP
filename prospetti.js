const ids=["prospetto1","prospetto2","prospetto3","prospetto4"];
function setup(c){
  if(!c)return null;const dpr=devicePixelRatio||1,r=c.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
  c.width=w*dpr;c.height=h*dpr;const ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h};
}
function quota(ctx,x1,x2,y,label){
  ctx.strokeStyle="#dce5ee";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.moveTo(x1,y-5);ctx.lineTo(x1,y+5);ctx.moveTo(x2,y-5);ctx.lineTo(x2,y+5);ctx.stroke();
  ctx.fillStyle="#dce5ee";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText(label,(x1+x2)/2,y-9);ctx.textAlign="left";
}
function one(c,s,k){
  const z=setup(c);if(!z)return;const {ctx,w,h}=z,L=s.campate.reduce((a,x)=>a+Number(x.interasse||0),0),W=Number(s.generale.luce||0),H=Number(s.generale.altezzaPilastro||0),rise=W*Number(s.generale.pendenzaCopertura||0)/200,C=k<2?L:W,top=H+rise,sc=Math.max(.05,Math.min((w-150)/Math.max(C,1),(h-80)/Math.max(top,1))),ox=(w-C*sc)/2,base=h-45;
  ctx.strokeStyle="#c2ccd7";ctx.lineWidth=2;ctx.strokeRect(ox,base-H*sc,C*sc,H*sc);
  if(k<2){let xx=ox;s.campate.forEach(campata=>{ctx.strokeStyle="#858f9b";ctx.lineWidth=1.5;ctx.strokeRect(xx-4,base-H*sc,8,H*sc);xx+=Number(campata.interasse||0)*sc;});ctx.strokeRect(ox+C*sc-4,base-H*sc,8,H*sc);}
  else{const mid=ox+C*sc/2,ridge=base-(H+rise)*sc;ctx.beginPath();ctx.moveTo(ox,base-H*sc);ctx.lineTo(mid,ridge);ctx.lineTo(ox+C*sc,base-H*sc);ctx.stroke();}
  ctx.fillStyle="#dce5ee";ctx.font="10px monospace";ctx.fillText("PROSPETTO "+(k+1),10,16);ctx.fillText("H gronda "+H.toFixed(2)+" m",10,31);quota(ctx,ox,ox+C*sc,base+22,(k<2?"Larghezza ":"Luce ")+C.toFixed(2)+" m");
}
export function inizializzaProspetti(){}
export function aggiornaProspetti(s){if(!s)return;ids.forEach((id,i)=>one(document.getElementById(id),s,i));}
export function resetProspetto(){aggiornaProspetti(window.CACEM_STATE);}
