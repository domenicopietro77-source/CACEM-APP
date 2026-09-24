// pianta.js — Pianta tecnica in stile AutoCAD (sfondo bianco, linee nere)

import { lunghezzaTotale, luceTrasversale, classificaPilastri } from './modello.js';

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
  sfondo:       '#ffffff',
  linea:        '#000000',
  pilastro:     '#000000',
  asse:         '#666666',
  quota:        '#000000',
  testo:        '#000000',
  sezione:      '#cc0000',
  freccia:      '#cc0000',
  pannello:     '#000000'
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

  const stop = () => {
    dragAttivo = false;
    canvas.style.cursor = 'grab';
  };
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
  const r = canvas.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    canvas.width = r.width;
    canvas.height = r.height;
  }
}

function autoFit(stato) {
  if (!stato || !canvas) return;
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const offsetP = (stato.pannelli.lati.sud.offset || 6) / 100;
  const totaleL = L + offsetP * 2;
  const totaleW = W + offsetP * 2;
  const margine = 140;

  const scalaX = (canvas.width - margine * 2) / totaleL;
  const scalaY = (canvas.height - margine * 2) / totaleW;
  scala = Math.min(scalaX, scalaY);

  offsetX = (canvas.width - totaleL * scala) / 2 + offsetP * scala;
  offsetY = (canvas.height - totaleW * scala) / 2 + offsetP * scala;
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

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const offsetP = (stato.pannelli.lati.sud.offset || 6) / 100;

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Titolo
  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PIANTA PILASTRI E PANNELLI', canvas.width / 2, 30);

  // Pannelli (linee doppie)
  disegnaPannelli(stato, L, W, offsetP);

  // Contorno
  ctx.strokeStyle = COLORI.linea;
  ctx.lineWidth = 1.5;
  const c1 = toPx(0, 0);
  const c2 = toPx(L, W);
  ctx.strokeRect(c1.px, c1.py, c2.px - c1.px, c2.py - c1.py);

  // Assi tratteggiati
  ctx.setLineDash([15, 4, 3, 4]);
  ctx.strokeStyle = COLORI.asse;
  ctx.lineWidth = 0.5;
  const posX = posizioniX(stato);
  posX.forEach(x => {
    const a = toPx(x, -3);
    const b = toPx(x, W + 3);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
  [0, W].forEach(y => {
    const a = toPx(-3, y);
    const b = toPx(L + 3, y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Pilastri con sigle PP
  const classif = classificaPilastri(stato);
  classif.pilastri.forEach(p => {
    const px = p.x - baseP / 2;
    const py = p.y - altP / 2;
    const a = toPx(px, py);
    const w = Math.max(4, baseP * scala);
    const h = Math.max(4, altP * scala);

    ctx.fillStyle = COLORI.pilastro;
    ctx.fillRect(a.px, a.py, w, h);

    ctx.fillStyle = COLORI.testo;
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';
    const yLabel = p.y === 0 ? a.py - 3 : a.py + h + 11;
    ctx.fillText(p.sigla, a.px + w / 2, yLabel);
    ctx.textBaseline = 'alphabetic';
  });

  // Quote campate (sopra)
  ctx.fillStyle = COLORI.testo;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;

  const yQ1 = -2;
  for (let i = 0; i < posX.length - 1; i++) {
    const a = toPx(posX[i], yQ1);
    const b = toPx(posX[i + 1], yQ1);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    freccia(a.px, a.py);
    freccia(b.px, b.py);
    ctx.fillText((stato.campate.lista[i].interasse * 1000).toFixed(0), (a.px + b.px) / 2, a.py - 4);
  }

  // Quota totale
  const yQT = -4;
  const aT = toPx(0, yQT);
  const bT = toPx(L, yQT);
  ctx.beginPath();
  ctx.moveTo(aT.px, aT.py);
  ctx.lineTo(bT.px, bT.py);
  ctx.stroke();
  freccia(aT.px, aT.py);
  freccia(bT.px, bT.py);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText((L * 1000).toFixed(0), (aT.px + bT.px) / 2, aT.py - 4);

  // Quota luce
  const xQ = L + 2.5;
  const aL = toPx(xQ, 0);
  const bL = toPx(xQ, W);
  ctx.beginPath();
  ctx.moveTo(aL.px, aL.py);
  ctx.lineTo(bL.px, bL.py);
  ctx.stroke();
  freccia(aL.px, aL.py);
  freccia(bL.px, bL.py);
  ctx.save();
  ctx.translate(bL.px + 12, (aL.py + bL.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((W * 1000).toFixed(0), 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';

  // Linee sezione A-A e B-B
  disegnaLineaSezione('A', 'orizzontale', L, W);
  disegnaLineaSezione('B', 'verticale', L, W);

  // Frecce prospetti 1-2-3-4
  const pad = offsetP + 2;
  disegnaFrecciaProspetto(1, L / 2, W + pad, 'su');
  disegnaFrecciaProspetto(2, L + pad, W / 2, 'sinistra');
  disegnaFrecciaProspetto(3, L / 2, -pad, 'giu');
  disegnaFrecciaProspetto(4, -pad, W / 2, 'destra');

  // Bussola nord
  disegnaBussola(canvas.width - 60, 60);
}

function posizioniX(stato) {
  const pos = [0];
  let acc = 0;
  const lista = stato.campate.lista || [];
  lista.forEach(c => {
    acc += c.interasse;
    pos.push(acc);
  });
  return pos;
}

function disegnaPannelli(stato, L, W, offsetP) {
  const spP = stato.pannelli.spessore / 100;
  ctx.strokeStyle = COLORI.pannello;
  ctx.lineWidth = 0.7;
  const lati = stato.pannelli.lati;

  const linee = [];
  if (lati.sud && lati.sud.attivo) {
    linee.push([0, -offsetP, L, -offsetP]);
    linee.push([0, -offsetP - spP, L, -offsetP - spP]);
  }
  if (lati.nord && lati.nord.attivo) {
    linee.push([0, W + offsetP, L, W + offsetP]);
    linee.push([0, W + offsetP + spP, L, W + offsetP + spP]);
  }
  if (lati.ovest && lati.ovest.attivo) {
    linee.push([-offsetP, 0, -offsetP, W]);
    linee.push([-offsetP - spP, 0, -offsetP - spP, W]);
  }
  if (lati.est && lati.est.attivo) {
    linee.push([L + offsetP, 0, L + offsetP, W]);
    linee.push([L + offsetP + spP, 0, L + offsetP + spP, W]);
  }

  linee.forEach(l => {
    const a = toPx(l[0], l[1]);
    const b = toPx(l[2], l[3]);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  });
}

function freccia(px, py) {
  const s = 3;
  ctx.beginPath();
  ctx.moveTo(px - s, py + s);
  ctx.lineTo(px + s, py - s);
  ctx.stroke();
}

function disegnaLineaSezione(lettera, orientamento, L, W) {
  ctx.strokeStyle = COLORI.sezione;
  ctx.fillStyle = COLORI.sezione;
  ctx.lineWidth = 0.9;
  ctx.setLineDash([20, 6, 3, 6]);
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';

  if (orientamento === 'orizzontale') {
    const y = W / 2;
    const a = toPx(-2, y);
    const b = toPx(L + 2, y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    ctx.setLineDash([]);
    triangolino(a.px, a.py, 'destra');
    triangolino(b.px, b.py, 'sinistra');
    ctx.fillText(lettera, a.px - 10, a.py + 4);
    ctx.fillText(lettera, b.px + 10, b.py + 4);
  } else {
    const x = L / 2;
    const a = toPx(x, -2);
    const b = toPx(x, W + 2);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    ctx.setLineDash([]);
    triangolino(a.px, a.py, 'giu');
    triangolino(b.px, b.py, 'su');
    ctx.fillText(lettera, a.px, a.py - 6);
    ctx.fillText(lettera, b.px, b.py + 12);
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
  const r = 9;

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
  const tipX = cx + Math.sin(ang) * 4;
  const tipY = cy - Math.cos(ang) * 4;
  const b1X = cx + Math.sin(ang + 2) * 4;
  const b1Y = cy - Math.cos(ang + 2) * 4;
  const b2X = cx + Math.sin(ang - 2) * 4;
  const b2Y = cy - Math.cos(ang - 2) * 4;
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(b1X, b1Y);
  ctx.lineTo(b2X, b2Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, p.px + 1, p.py + r + 8);
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