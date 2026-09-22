const ids=["sezioneAA","sezioneBB"];

function setupCanvas(canvas){
  if(!canvas)return null;
  const dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
  canvas.width=width*dpr;canvas.height=height*dpr;
  const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  return{ctx,width,height};
}
function dati(s){
  const L=s.campate.reduce((a,c)=>a+Number(c.interasse||0),0);
  const W=Number(s.generale.luce||0),H=Number(s.generale.altezzaPilastro||0);
  const p=Number(s.generale.pendenzaCopertura||0),rise=W*p/200;
  const trave=window.CACEM_CATALOGO?.travi?.find(x=>x.id===s.travi?.tipoId);
  return{
    L,W,H,rise,
    basePilastro:Number(s.pilastri?.base||40)/100,
    profonditaPilastro:Number(s.pilastri?.altezzaSezione||60)/100,
    baseTrave:Number(trave?.base||40)/100,
    altTrave:Number(trave?.altezza||60)/100,
    interpiano:Boolean(s.generale.interpiano),
    hInterpiano:Number(s.generale.altezzaInterpiano||0)
  };
}
function rect(ctx,x,y,w,h,fill="#87929d"){
  ctx.fillStyle=fill;ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);
}
function quotaV(ctx,x,y1,y2,label){
  ctx.strokeStyle="#dce5ee";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.moveTo(x-5,y1);ctx.lineTo(x+5,y1);ctx.moveTo(x-5,y2);ctx.lineTo(x+5,y2);ctx.stroke();
  ctx.fillStyle="#dce5ee";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText(label,x+24,(y1+y2)/2);ctx.textAlign="left";
}
function quotaH(ctx,x1,x2,y,label){
  ctx.strokeStyle="#dce5ee";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.moveTo(x1,y-5);ctx.lineTo(x1,y+5);ctx.moveTo(x2,y-5);ctx.lineTo(x2,y+5);ctx.stroke();
  ctx.fillStyle="#dce5ee";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText(label,(x1+x2)/2,y-9);ctx.textAlign="left";
}
function falda(ctx,x1,y1,x2,y2,th){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  rectPoly(ctx,[[x1,y1],[x2,y2],[x2+nx*th,y2+ny*th],[x1+nx*th,y1+ny*th]]);
}
function rectPoly(ctx,pts,fill="#9ca6af"){
  ctx.fillStyle=fill;ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();ctx.stroke();
}
function terreno(ctx,ox,base,C){
  ctx.strokeStyle="#778596";ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ox,base);ctx.lineTo(ox+C,base);ctx.stroke();ctx.setLineDash([]);
}
function sezioneAA(ctx,s,d,ox,base,sc){
  terreno(ctx,ox,base,d.L*sc);
  const xs=[0];let x=0;s.campate.forEach(c=>{x+=Number(c.interasse||0);xs.push(x);});
  xs.forEach(v=>{
    const px=ox+v*sc;
    rect(ctx,px-14,base+2,28,Math.max(14,.8*sc),"#6f7882");
    rect(ctx,px-d.basePilastro*sc/2,base-d.H*sc,d.basePilastro*sc,d.H*sc);
  });
  rect(ctx,ox,base-d.H*sc-d.altTrave*sc,d.L*sc,d.altTrave*sc,"#8f9aa3");
  const ridge=ox+d.L*sc/2,ridgeY=base-(d.H+d.rise)*sc,eaveY=base-d.H*sc-d.altTrave*sc,th=Math.max(3,.12*sc);
  falda(ctx,ox,eaveY,ridge,ridgeY,th);falda(ctx,ridge,ridgeY,ox+d.L*sc,eaveY,th);
  if(d.interpiano)rect(ctx,ox,base-d.hInterpiano*sc-Math.max(3,.25*sc)/2,d.L*sc,Math.max(3,.25*sc),"#aeb8c0");
  quotaV(ctx,ox+d.L*sc+38,base,base-d.H*sc,"h gronda "+d.H.toFixed(2)+" m");
  quotaV(ctx,ox+d.L*sc+74,base,ridgeY,"h colmo "+(d.H+d.rise).toFixed(2)+" m");
  if(d.interpiano)quotaV(ctx,ox+d.L*sc+110,base,base-d.hInterpiano*sc,"h interpiano "+d.hInterpiano.toFixed(2)+" m");
  quotaH(ctx,ox,ox+d.L*sc,base+38,"Lunghezza "+d.L.toFixed(2)+" m");
  ctx.fillStyle="#dce5ee";ctx.font="11px monospace";ctx.fillText("SEZIONE A-A · scala reale 1:1",10,20);
}
function sezioneBB(ctx,d,ox,base,sc){
  terreno(ctx,ox,base,d.W*sc);
  const yP=base-d.H*sc,mid=ox+d.W*sc/2,ridgeY=base-(d.H+d.rise)*sc;
  [ox,ox+d.W*sc].forEach(px=>{
    rect(ctx,px-d.basePilastro*sc/2-8,base+2,d.basePilastro*sc+16,Math.max(14,.8*sc),"#6f7882");
    rect(ctx,px-d.basePilastro*sc/2,yP,d.basePilastro*sc,d.H*sc);
    rect(ctx,px-d.baseTrave*sc/2,yP-d.altTrave*sc,d.baseTrave*sc,d.altTrave*sc,"#8f9aa3");
  });
  const th=Math.max(3,.12*sc);
  falda(ctx,ox,yP-d.altTrave*sc,mid,ridgeY,th);
  falda(ctx,mid,ridgeY,ox+d.W*sc,yP-d.altTrave*sc,th);
  if(d.interpiano)rect(ctx,ox,base-d.hInterpiano*sc-Math.max(3,.25*sc)/2,d.W*sc,Math.max(3,.25*sc),"#aeb8c0");
  quotaH(ctx,ox,ox+d.W*sc,base+38,"Luce "+d.W.toFixed(2)+" m");
  quotaV(ctx,ox+d.W*sc+38,base,yP,"h gronda "+d.H.toFixed(2)+" m");
  quotaV(ctx,ox+d.W*sc+74,base,ridgeY,"h colmo "+(d.H+d.rise).toFixed(2)+" m");
  if(d.interpiano)quotaV(ctx,ox+d.W*sc+110,base,base-d.hInterpiano*sc,"h interpiano "+d.hInterpiano.toFixed(2)+" m");
  ctx.fillStyle="#dce5ee";ctx.font="11px monospace";ctx.fillText("SEZIONE B-B · scala reale 1:1",10,20);
}
function sec(canvas,s,aa){
  const setup=setupCanvas(canvas);if(!setup||!s)return;
  const{ctx,width:w,height:h}=setup,d=dati(s),C=aa?d.L:d.W;
  const visual=d.H+d.rise+.8;
  const targetHeight=h*.75;
  const sc=Math.max(.05,Math.min((w-210)/Math.max(C,1),targetHeight/Math.max(visual,1)));
  const visualPx=visual*sc;
  const base=(h+visualPx)/2;
  const ox=(w-C*sc)/2;
  ctx.fillStyle="#f8fafc";ctx.fillRect(0,0,w,h);
  if(aa)sezioneAA(ctx,s,d,ox,base,sc);else sezioneBB(ctx,d,ox,base,sc);
}
export function inizializzaSezioni(){}
export function aggiornaSezioni(s){if(!s)return;sec(document.getElementById(ids[0]),s,true);sec(document.getElementById(ids[1]),s,false);}
export function resetSezioni(){aggiornaSezioni(window.CACEM_STATE);}
