// pianta.js — Pianta tecnica 2D con quote, assi, sezioni e prospetti
import { lunghezzaTotale } from './modello.js';
import { trovaPilastro } from './catalogo.js';

let canvas,ctx,scala=1,offsetX=0,offsetY=0,drag=false,start=null;
export function initPianta(){
  canvas=document.getElementById('canvas-pianta'); if(!canvas)return; ctx=canvas.getContext('2d');
  canvas.addEventListener('mousedown',e=>{drag=true;start={x:e.offsetX-offsetX,y:e.offsetY-offsetY};});
  canvas.addEventListener('mousemove',e=>{if(!drag)return;offsetX=e.offsetX-start.x;offsetY=e.offsetY-start.y;disegnaPianta(window._statoCorrente);});
  canvas.addEventListener('mouseup',()=>drag=false);canvas.addEventListener('mouseleave',()=>drag=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY<0?1.1:0.9,mx=e.offsetX,my=e.offsetY;offsetX=mx-(mx-offsetX)*f;offsetY=my-(my-offsetY)*f;scala*=f;disegnaPianta(window._statoCorrente);},{passive:false});
  window.addEventListener('resize',()=>{if(canvas) disegnaPianta(window._statoCorrente);});
}
function adattaCanvas(){const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width));canvas.height=Math.max(1,Math.round(r.height));}
function autoFit(stato){adattaCanvas();const L=lunghezzaTotale(stato),W=stato.generale.luce,m=100;scala=Math.min((canvas.width-2*m)/Math.max(L,1),(canvas.height-2*m)/Math.max(W,1));offsetX=(canvas.width-L*scala)/2;offsetY=(canvas.height-W*scala)/2;}
function toPx(x,y){return{px:offsetX+x*scala,py:offsetY+y*scala};}
export function disegnaPianta(stato){
  if(!canvas||!ctx||!stato)return;
  if(canvas.width<2||canvas.height<2)autoFit(stato);
  const L=lunghezzaTotale(stato),W=stato.generale.luce,x0=-L/2,y0=-W/2,pil=trovaPilastro(stato.pilastri.tipoId);
  ctx.fillStyle='#14171c';ctx.fillRect(0,0,canvas.width,canvas.height);
  const p1=toPx(x0,y0),p2=toPx(x0+L,y0+W);ctx.strokeStyle='#4a9eff';ctx.lineWidth=2;ctx.strokeRect(p1.px,p1.py,p2.px-p1.px,p2.py-p1.py);
  const pos=[x0];let x=x0;for(const c of stato.campate){x+=c.interasse;pos.push(x);}
  ctx.setLineDash([6,6]);ctx.strokeStyle='#3a4250';ctx.lineWidth=1;for(const xx of pos){const a=toPx(xx,y0-2),b=toPx(xx,y0+W+2);ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();}ctx.setLineDash([]);
  const sx=pil.sezione.l/100,sy=pil.sezione.h/100;ctx.fillStyle='#8a8f99';ctx.strokeStyle='#e6e9ef';ctx.lineWidth=1;let n=1;
  for(const xx of pos)for(const yy of [y0,y0+W]){const p=toPx(xx-sx/2,yy-sy/2),w=sx*scala,h=sy*scala;ctx.fillRect(p.px,p.py,w,h);ctx.strokeRect(p.px,p.py,w,h);ctx.fillStyle='#e6e9ef';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(`P${n++}`,p.px+w/2,p.py-6);ctx.fillStyle='#8a8f99';}
  ctx.fillStyle='#9aa3b2';ctx.font='12px monospace';ctx.textAlign='center';ctx.strokeStyle='#9aa3b2';ctx.lineWidth=1;
  const yq=y0-1.5;
  for(let i=0;i<pos.length-1;i++){const a=toPx(pos[i],yq),b=toPx(pos[i+1],yq);ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();for(const q of [a,b]){ctx.beginPath();ctx.moveTo(q.px,q.py-5);ctx.lineTo(q.px,q.py+5);ctx.stroke();}ctx.fillText(`${stato.campate[i].interasse} m`,(a.px+b.px)/2,a.py-8);}
  const yt=yq-1.5,aT=toPx(x0,yt),bT=toPx(x0+L,yt);ctx.beginPath();ctx.moveTo(aT.px,aT.py);ctx.lineTo(bT.px,bT.py);ctx.stroke();ctx.fillText(`L tot = ${L.toFixed(2)} m`,(aT.px+bT.px)/2,aT.py-8);
  const xq=x0+L+1.5,aW=toPx(xq,y0),bW=toPx(xq,y0+W);ctx.beginPath();ctx.moveTo(aW.px,aW.py);ctx.lineTo(bW.px,bW.py);ctx.stroke();ctx.save();ctx.translate(aW.px+12,(aW.py+bW.py)/2);ctx.rotate(-Math.PI/2);ctx.fillText(`Luce = ${W} m`,0,0);ctx.restore();
  disegnaLineaSezione('A',0,y0-3,0,y0+W+3);disegnaLineaSezione('B',x0-3,0,x0+L+3,0);
  disegnaFreccia('1',x0+L/2,y0+W+4);disegnaFreccia('2',x0+L+4,y0+W/2);disegnaFreccia('3',x0+L/2,y0-4);disegnaFreccia('4',x0-4,y0+W/2);
  disegnaBussola(canvas.width-60,60);
}
function disegnaLineaSezione(e,x1,y1,x2,y2){const a=toPx(x1,y1),b=toPx(x2,y2);ctx.strokeStyle='#e05555';ctx.lineWidth=1.5;ctx.setLineDash([12,6]);ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#e05555';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(e,a.px,a.py-12);ctx.fillText(e,b.px,b.py+12);}
function disegnaFreccia(n,x,y){const p=toPx(x,y);ctx.strokeStyle='#fbbf24';ctx.fillStyle='#fbbf24';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.px,p.py,14,0,Math.PI*2);ctx.stroke();ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,p.px,p.py+1);ctx.textBaseline='alphabetic';}
function disegnaBussola(cx,cy){ctx.strokeStyle='#9aa3b2';ctx.fillStyle='#9aa3b2';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,18,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+12);ctx.lineTo(cx,cy-12);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy-16);ctx.lineTo(cx-4,cy-8);ctx.lineTo(cx+4,cy-8);ctx.closePath();ctx.fill();ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('N',cx,cy-22);}
export function resetVistaPianta(stato){scala=1;offsetX=0;offsetY=0;autoFit(stato);disegnaPianta(stato);}
