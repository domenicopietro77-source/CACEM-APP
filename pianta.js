let cv;
let ctx;

let scala = 1;
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

let fitScale = 1;
let fitOffsetX = 0;
let fitOffsetY = 0;

function dimensioniCanvas() {
  if (!cv) return { width: 0, height: 0 };

  const rect = cv.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;

  if (
    cv.width !== Math.round(width * dpr) ||
    cv.height !== Math.round(height * dpr)
  ) {
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
  }

  return { width, height };
}

function applicaAutoFit(s) {
  if (!cv || !s) return;

  const { width, height } = dimensioniCanvas();

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);

  if (!L || !W || !width || !height) return;

  fitScale = Math.min(
    (width - 100) / L,
    (height - 100) / W
  );

  fitScale = Math.max(0.05, fitScale);

  fitOffsetX = (width - L * fitScale) / 2;
  fitOffsetY = (height - W * fitScale) / 2;

  scala = fitScale;
  offsetX = fitOffsetX;
  offsetY = fitOffsetY;
}

export function inizializzaPianta(c) {
  cv = c;
  ctx = c.getContext("2d");

  cv.style.cursor = "grab";
  cv.style.touchAction = "none";

  cv.addEventListener(
    "mousedown",
    e => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startOffsetX = offsetX;
      startOffsetY = offsetY;
      cv.style.cursor = "grabbing";
    }
  );

  window.addEventListener("mousemove", e => {
    if (!dragging) return;

    offsetX = startOffsetX + (e.clientX - dragStartX);
    offsetY = startOffsetY + (e.clientY - dragStartY);

    draw(window.CACEM_STATE);
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;
    cv.style.cursor = "grab";
    draw(window.CACEM_STATE);
  });

  cv.addEventListener(
    "mouseleave",
    () => {
      if (!dragging) {
        cv.style.cursor = "grab";
      }
    }
  );

  cv.addEventListener(
    "wheel",
    e => {
      e.preventDefault();

      const rect = cv.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = scala;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(
        Math.max(oldScale * factor, fitScale * 0.25),
        fitScale * 12
      );

      /*
       * Keep the model point under the cursor fixed:
       * screen = world * scale + offset.
       */
      offsetX = mouseX - (mouseX - offsetX) * (newScale / oldScale);
      offsetY = mouseY - (mouseY - offsetY) * (newScale / oldScale);
      scala = newScale;

      draw(window.CACEM_STATE);
    },
    { passive: false }
  );

  requestAnimationFrame(() => {
    applicaAutoFit(window.CACEM_STATE);
    draw(window.CACEM_STATE);
  });
}

export function resetPianta() {
  applicaAutoFit(window.CACEM_STATE);
  draw(window.CACEM_STATE);
}

function disegnaPilastro(x,z,label,ox,oy,sc,s){
  const base=Number(s.pilastri?.base||40)/100;
  const profondita=Number(s.pilastri?.altezzaSezione||60)/100;
  const w=Math.max(3,base*sc);
  const h=Math.max(3,profondita*sc);
  ctx.fillStyle="#87929d";
  ctx.strokeStyle="#ffffff";
  ctx.lineWidth=1.5;
  ctx.fillRect(ox+x*sc-w/2,oy+z*sc-h/2,w,h);
  ctx.strokeRect(ox+x*sc-w/2,oy+z*sc-h/2,w,h);
  ctx.fillStyle="#26333f";
  ctx.font="10px monospace";
  ctx.fillText(label,ox+x*sc+w/2+6,oy+z*sc-h/2-7);
}

function draw(s){
  if(!ctx||!s)return;
  const {width:w,height:h}=dimensioniCanvas();
  if(!w||!h)return;
  const dpr=window.devicePixelRatio||1;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  const L=s.campate.reduce((sum,c)=>sum+Number(c.interasse||0),0);
  const W=Number(s.generale.luce||0);
  if(!L||!W)return;

  const sc=scala,ox=offsetX,oy=offsetY;
  ctx.strokeStyle="#a9b8c8";
  ctx.lineWidth=2;
  ctx.strokeRect(ox,oy,L*sc,W*sc);

  function quota(x1,y1,x2,y2,label){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len,t=7;
    ctx.strokeStyle="#dce5ee";ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.moveTo(x1-nx*t,y1-ny*t);ctx.lineTo(x1+nx*t,y1+ny*t);
    ctx.moveTo(x2-nx*t,y2-ny*t);ctx.lineTo(x2+nx*t,y2+ny*t);
    ctx.stroke();
    ctx.fillStyle="#dce5ee";ctx.font="11px monospace";ctx.textAlign="center";
    ctx.fillText(label,(x1+x2)/2+nx*12,(y1+y2)/2+ny*12);
    ctx.textAlign="left";
  }
  function freccia(x,y,dx,dy){
    const len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,px=-uy,py=ux,n=9;
    ctx.beginPath();
    ctx.moveTo(x,y);ctx.lineTo(x-ux*n+px*n*.55,y-uy*n+py*n*.55);
    ctx.moveTo(x,y);ctx.lineTo(x-ux*n-px*n*.55,y-uy*n-py*n*.55);
    ctx.stroke();
  }

  let x=0;
  s.campate.forEach((campata,index)=>{
    const span=Number(campata.interasse||0);
    disegnaPilastro(x,0,"P"+(index*2+1),ox,oy,sc,s);
    disegnaPilastro(x,W,"P"+(index*2+2),ox,oy,sc,s);
    ctx.strokeStyle="#56687c";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ox+x*sc,oy-8);ctx.lineTo(ox+x*sc,oy+W*sc+8);ctx.stroke();
    quota(ox+x*sc,oy-28,ox+(x+span)*sc,oy-28,span.toFixed(2)+" m");
    x+=span;
  });

  disegnaPilastro(L,0,"P"+(s.campate.length*2+1),ox,oy,sc,s);
  disegnaPilastro(L,W,"P"+(s.campate.length*2+2),ox,oy,sc,s);
  quota(ox,oy-58,ox+L*sc,oy-58,"Lunghezza "+L.toFixed(2)+" m");
  quota(ox+L*sc+42,oy,ox+L*sc+42,oy+W*sc,W.toFixed(2)+" m");

  const yAA=oy+W*sc/2,xBB=ox+L*sc/2;
  ctx.setLineDash([9,6]);ctx.strokeStyle="#e55b5b";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(ox,yAA);ctx.lineTo(ox+L*sc,yAA);ctx.stroke();
  freccia(ox+2,yAA,1,0);freccia(ox+L*sc-2,yAA,-1,0);
  ctx.beginPath();ctx.moveTo(xBB,oy);ctx.lineTo(xBB,oy+W*sc);ctx.stroke();
  freccia(xBB,oy+2,0,1);freccia(xBB,oy+W*sc-2,0,-1);
  ctx.setLineDash([]);

  ctx.fillStyle="#ff7070";ctx.font="12px monospace";ctx.textAlign="center";
  ctx.fillText("A",ox-16,yAA);ctx.fillText("A",ox+L*sc+16,yAA);
  ctx.fillText("B",xBB,oy-16);ctx.fillText("B",xBB,oy+W*sc+16);
  ctx.textAlign="left";
  ctx.fillStyle="#e9eef5";ctx.font="12px monospace";ctx.fillText("N!‘",ox+10,oy+18);
}

export function aggiornaPianta(s) {
  if (!s) return;

  const rect = cv?.getBoundingClientRect();

  /*
   * If the Pianta tab was hidden when the first render happened,
   * its canvas can have a zero-sized layout box. Re-fit as soon
   * as a real visible size becomes available.
   */
  if (rect && rect.width > 0 && rect.height > 0) {
    if (!fitScale || cv.width === 0 || cv.height === 0) {
      applicaAutoFit(s);
    }

    draw(s);
  }
}
