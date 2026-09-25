// pianta.js — Pianta tecnica CACEM (stile AutoCAD B/N, quote in cm)

import {
  lunghezzaTotale,
  luceTrasversale
} from './modello.js';

let canvas = null;
let ctx = null;
let scala = 1;
let offsetX = 0;
let offsetY = 0;
let dragAttivo = false;
let dragStart = null;
let userInteracted = false;
let statoCorrente = null;

const COLORI = {
  sfondo: '#ffffff',
  linea: '#000000',
  lineaSpessa: '#000000',
  pilastro: '#000000',
  traveTU: '#000000',
  traveTI: '#333333',
  tegolo: '#666666',
  asse: '#999999',
  quota: '#000000',
  testo: '#000000',
  sezione: '#cc0000',
  freccia: '#cc0000',
  terreno: '#888888'
};

export function inizializzaPianta(canvasEl) {
  canvas = canvasEl || document.getElementById('piantaCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  adattaCanvas();

  canvas.addEventListener('mousedown', (e) => {
    dragAttivo = true;
    dragStart = { x: e.offsetX - offsetX, y: e.offsetY - offsetY };
    userInteracted = true;
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!dragAttivo) return;
    offsetX = e.offsetX - dragStart.x;
    offsetY = e.offsetY - dragStart.y;
    disegna(statoCorrente);
  });
  const stop = () => { dragAttivo = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.1 : 0.9;
    const mx = e.offsetX;
    const my = e.offsetY;
    offsetX = mx - (mx - offsetX) * f;
    offsetY = my - (my - offsetY) * f;
    scala *= f;
    userInteracted = true;
    disegna(statoCorrente);
  }, { passive: false });

  canvas.style.cursor = 'grab';

  window.addEventListener('resize', () => {
    adattaCanvas();
    if (!userInteracted) autoFit(statoCorrente);
    disegna(statoCorrente);
  });
}

function adattaCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return;
  const larghezzaPx = Math.round(r.width * dpr);
  const altezzaPx = Math.round(r.height * dpr);
  if (canvas.width !== larghezzaPx || canvas.height !== altezzaPx) {
    canvas.width = larghezzaPx;
    canvas.height = altezzaPx;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function getDimCss() {
  const dpr = window.devicePixelRatio || 1;
  return { w: canvas.width / dpr, h: canvas.height / dpr };
}

function autoFit(stato) {
  if (!stato || !canvas) return;
  const dim = getDimCss();
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const margine = 160;
  const scalaX = (dim.w - margine * 2) / L;
  const scalaY = (dim.h - margine * 2) / W;
  scala = Math.min(scalaX, scalaY);
  offsetX = (dim.w - L * scala) / 2;
  offsetY = (dim.h - W * scala) / 2 + 20;
}

function toPx(x, y) {
  return { px: offsetX + x * scala, py: offsetY + y * scala };
}

export function aggiornaPianta(stato) {
  statoCorrente = stato;
  if (!canvas || !ctx) return;
  if (!userInteracted) autoFit(stato);
  disegna(stato);
}

function disegna(stato) {
  if (!canvas || !ctx || !stato) return;
  const dim = getDimCss();
  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, dim.w, dim.h);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PIANTA PILASTRI, TRAVI E TEGOLI', dim.w / 2, 28);

  ctx.strokeStyle = COLORI.lineaSpessa;
  ctx.lineWidth = 1.5;
  const c1 = toPx(0, 0);
  const c2 = toPx(L, W);
  ctx.strokeRect(c1.px, c1.py, c2.px - c1.px, c2.py - c1.py);

  disegnaAssi(stato, L, W);
  disegnaTraviTU(stato);
  disegnaTraviTI(stato);
  disegnaTegoli(stato);
  disegnaPilastri(stato, L, W);
  disegnaQuote(stato, L, W);
  disegnaLineaSezione('A', 'orizzontale', L, W);
  disegnaLineaSezione('B', 'verticale', L, W);

  const pad = 3;
  disegnaFrecciaProspetto(1, L / 2, W + pad, 'su');
  disegnaFrecciaProspetto(2, L + pad, W / 2, 'sinistra');
  disegnaFrecciaProspetto(3, L / 2, -pad, 'giu');
  disegnaFrecciaProspetto(4, -pad, W / 2, 'destra');
  disegnaBussola(dim.w - 50, 50);
}

function disegnaAssi(stato, L, W) {
  ctx.setLineDash([15, 4, 3, 4]);
  ctx.strokeStyle = COLORI.asse;
  ctx.lineWidth = 0.5;

  const numPerFila = stato.campateX.numero + 1;
  let accX = 0;
  for (let i = 0; i < numPerFila; i++) {
    const a = toPx(accX, -2);
    const b = toPx(accX, W + 2);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    if (i < stato.campateX.numero) accX += stato.campateX.lista[i].interasse;
  }

  const numFileY = stato.pilastri.numFileY;
  for (let k = 0; k < numFileY; k++) {
    const y = (k * W) / (numFileY - 1);
    const a = toPx(-2, y);
    const b = toPx(L + 2, y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function disegnaTraviTU(stato) {
  const segs = stato.traviTU.segmenti || [];
  ctx.strokeStyle = COLORI.traveTU;
  ctx.lineWidth = 2.5;
  segs.forEach(s => {
    const a = toPx(s.x1, s.y);
    const b = toPx(s.x2, s.y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
}

function disegnaTraviTI(stato) {
  const segs = stato.traviTI.segmenti || [];
  ctx.strokeStyle = COLORI.traveTI;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  segs.forEach(s => {
    const a = toPx(s.x1, s.y);
    const b = toPx(s.x2, s.y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
}

function disegnaTegoli(stato) {
  const file = stato.copertura.file || [];
  ctx.strokeStyle = COLORI.tegolo;
  ctx.lineWidth = 0.6;
  ctx.setLineDash([8, 4]);
  file.forEach(f => {
    const yc = (f.y1 + f.y2) / 2;
    const a = toPx(0, yc);
    const b = toPx(f.lunghezza, yc);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

function disegnaPilastri(stato, L, W) {
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const numFileY = stato.pilastri.numFileY;
  const numPerFila = stato.campateX.numero + 1;
  const pluvialeD = stato.pilastri.pluvialeDiametro / 1000;
  const mostraPluviale = stato.pilastri.pluviale;

  const posX = [0];
  let acc = 0;
  for (let i = 0; i < stato.campateX.numero; i++) {
    acc += stato.campateX.lista[i].interasse;
    posX.push(acc);
  }

  for (let k = 0; k < numFileY; k++) {
    const y = (k * W) / (numFileY - 1);
    for (let i = 0; i < numPerFila; i++) {
      const x = posX[i];
      const a = toPx(x - baseP / 2, y - altP / 2);
      const w = baseP * scala;
      const h = altP * scala;

      ctx.fillStyle = COLORI.pilastro;
      ctx.fillRect(a.px, a.py, w, h);

      if (mostraPluviale) {
        const c = toPx(x, y);
        ctx.beginPath();
        ctx.arc(c.px, c.py, (pluvialeD / 2) * scala, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const sigla = assegnaSiglaPP(k, i, numFileY, numPerFila);
      ctx.fillStyle = COLORI.testo;
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(sigla, a.px + w / 2, a.py - 4);
      ctx.textBaseline = 'alphabetic';
    }
  }
}

function assegnaSiglaPP(fila, colonna, numFileY, numPerFila) {
  const isSud = fila === 0;
  const isNord = fila === numFileY - 1;
  const isOvest = colonna === 0;
  const isEst = colonna === numPerFila - 1;

  if (isSud && isOvest) return 'PP1';
  if (isSud && isEst) return 'PP3';
  if (isNord && isOvest) return 'PP3';
  if (isNord && isEst) return 'PP1';
  if (isSud) return 'PP6';
  if (isNord) return 'PP4';
  if (isOvest || isEst) return 'PP2';
  return 'PP5';
}

function disegnaQuote(stato, L, W) {
  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';

  const yQ1 = -2;
  let accX = 0;
  for (let i = 0; i < stato.campateX.numero; i++) {
    const inter = stato.campateX.lista[i].interasse;
    const a = toPx(accX, yQ1);
    const b = toPx(accX + inter, yQ1);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    taccaObliqua(a.px, a.py);
    taccaObliqua(b.px, b.py);
    ctx.fillText((inter * 100).toFixed(0), (a.px + b.px) / 2, a.py - 4);
    accX += inter;
  }

  const yQT = -4;
  const aT = toPx(0, yQT);
  const bT = toPx(L, yQT);
  ctx.beginPath(); ctx.moveTo(aT.px, aT.py); ctx.lineTo(bT.px, bT.py); ctx.stroke();
  taccaObliqua(aT.px, aT.py);
  taccaObliqua(bT.px, bT.py);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText((L * 100).toFixed(0), (aT.px + bT.px) / 2, aT.py - 5);

  const xQ = L + 2;
  const aL = toPx(xQ, 0);
  const bL = toPx(xQ, W);
  ctx.beginPath(); ctx.moveTo(aL.px, aL.py); ctx.lineTo(bL.px, bL.py); ctx.stroke();
  taccaObliqua(aL.px, aL.py);
  taccaObliqua(bL.px, bL.py);
  ctx.save();
  ctx.translate(bL.px + 14, (aL.py + bL.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((W * 100).toFixed(0), 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';

  const xQY = -2;
  const numFileY = stato.pilastri.numFileY;
  for (let k = 0; k < numFileY - 1; k++) {
    const y1 = (k * W) / (numFileY - 1);
    const y2 = ((k + 1) * W) / (numFileY - 1);
    const a = toPx(xQY, y1);
    const b = toPx(xQY, y2);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    taccaObliqua(a.px, a.py);
    taccaObliqua(b.px, b.py);
    ctx.save();
    ctx.translate(a.px - 8, (a.py + b.py) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText(((y2 - y1) * 100).toFixed(0), 0, 0);
    ctx.restore();
  }
}

function taccaObliqua(px, py) {
  const s = 3;
  ctx.beginPath();
  ctx.moveTo(px - s, py + s);
  ctx.lineTo(px + s, py - s);
  ctx.stroke();
}

function disegnaLineaSezione(lettera, orientamento, L, W) {
  ctx.strokeStyle = COLORI.sezione;
  ctx.fillStyle = COLORI.sezione;
  ctx.lineWidth = 1;
  ctx.setLineDash([20, 6, 3, 6]);
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';

  if (orientamento === 'orizzontale') {
    const y = W / 2;
    const a = toPx(-3, y);
    const b = toPx(L + 3, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    triangolino(a.px, a.py, 'destra');
    triangolino(b.px, b.py, 'sinistra');
    ctx.fillText(lettera, a.px - 12, a.py + 4);
    ctx.fillText(lettera, b.px + 12, b.py + 4);
  } else {
    const x = L / 2;
    const a = toPx(x, -3);
    const b = toPx(x, W + 3);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    triangolino(a.px, a.py, 'giu');
    triangolino(b.px, b.py, 'su');
    ctx.fillText(lettera, a.px, a.py - 6);
    ctx.fillText(lettera, b.px, b.py + 14);
  }
  ctx.textAlign = 'center';
}

function triangolino(px, py, direzione) {
  const s = 6;
  ctx.fillStyle = COLORI.sezione;
  ctx.beginPath();
  if (direzione === 'destra') {
    ctx.moveTo(px, py);
    ctx.lineTo(px - s, py - s / 2);
    ctx.lineTo(px - s, py + s / 2);
  } else if (direzione === 'sinistra') {
    ctx.moveTo(px, py);
    ctx.lineTo(px + s, py - s / 2);
    ctx.lineTo(px + s, py + s / 2);
  } else if (direzione === 'giu') {
    ctx.moveTo(px, py);
    ctx.lineTo(px - s / 2, py - s);
    ctx.lineTo(px + s / 2, py - s);
  } else {
    ctx.moveTo(px, py);
    ctx.lineTo(px - s / 2, py + s);
    ctx.lineTo(px + s / 2, py + s);
  }
  ctx.closePath();
  ctx.fill();
}

function disegnaFrecciaProspetto(numero, x, y, direzione) {
  const p = toPx(x, y);
  const r = 10;

  ctx.strokeStyle = COLORI.freccia;
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORI.freccia;
  ctx.beginPath();
  const dirMap = { su: 0, sinistra: Math.PI / 2, giu: Math.PI, destra: -Math.PI / 2 };
  const ang = dirMap[direzione];
  const cx = p.px;
  const cy = p.py;
  const tipX = cx + Math.sin(ang) * 5;
  const tipY = cy - Math.cos(ang) * 5;
  const b1X = cx + Math.sin(ang + 2) * 5;
  const b1Y = cy - Math.cos(ang + 2) * 5;
  const b2X = cx + Math.sin(ang - 2) * 5;
  const b2Y = cy - Math.cos(ang - 2) * 5;
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(b1X, b1Y);
  ctx.lineTo(b2X, b2Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, p.px, p.py + 1);
  ctx.textBaseline = 'alphabetic';
}

function disegnaBussola(cx, cy) {
  const r = 18;
  ctx.strokeStyle = COLORI.linea;
  ctx.fillStyle = COLORI.linea;
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy + 10);
  ctx.lineTo(cx, cy - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13);
  ctx.lineTo(cx - 4, cy - 6);
  ctx.lineTo(cx + 4, cy - 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy + r + 11);
}

export function resetPianta() {
  userInteracted = false;
  scala = 1;
  offsetX = 0;
  offsetY = 0;
  autoFit(statoCorrente);
  disegna(statoCorrente);
}