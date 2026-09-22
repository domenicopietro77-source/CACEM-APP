// pianta.js — Pianta tecnica stile AutoCAD (sfondo bianco, linee nere)

import { lunghezzaTotale, classificaPilastri } from './modello.js';

let canvas, ctx;
let scala = 1, offsetX = 0, offsetY = 0;
let dragAttivo = false, dragStart = null;
let userInteracted = false;
let statoCorrente = null;

const C = {
  sfondo:        '#ffffff',
  linea:         '#000000',
  lineaSottile:  '#333333',
  pilastro:      '#1a1a1a',
  pilastroFill:  '#d0d0d0',
  asse:          '#666666',
  quota:         '#000000',
  testo:         '#000000',
  testoQuota:    '#000000',
  sezione:       '#cc0000',
  freccia:       '#cc0000',
  pannello:      '#000000',
  pannelloFill:  '#f0f0f0',
  terreno:       '#808080'
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
    const mx = e.offsetX, my = e.offsetY;
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
  const W = stato.generale.luce;
  const margine = 140;
  const scalaX = (canvas.width - margine * 2) / L;
  const scalaY = (canvas.height - margine * 2) / W;
  scala = Math.min(scalaX, scalaY);
  offsetX = (canvas.width - L * scala) / 2;
  offsetY = (canvas.height - W * scala) / 2;
}

function toPx(x, y) {
  return { px: offsetX + x * scala, py: offsetY + y * scala };
}

function posizioniX(stato) {
  const pos = [0];
  let acc = 0;
  for (const c of stato.campate) { acc += c.interasse; pos.push(acc); }
  return pos;
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
  const W = stato.generale.luce;
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;

  const offsetPannello = (stato.pannelli.lati.sud.offset || 6) / 100;

  // Sfondo BIANCO
  ctx.fillStyle = C.sfondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // === PANNELLI ESTERNI (perimetro esterno ai pilastri) ===
  const hasPannello = stato.pannelli.lati;
  const spP = stato.pannelli.spessore / 100;

  // Sud: y = -offsetPannello
  if (hasPannello.sud && hasPannello.sud.attivo) {
    disegnaPannelloLinea(0, -offsetPannello, L, -offsetPannello, spP);
  }
  // Nord: y = W + offsetPannello
  if (hasPannello.nord && hasPannello.nord.attivo) {
    disegnaPannelloLinea(0, W + offsetPannello, L, W + offsetPannello, spP);
  }
  // Ovest: x = -offsetPannello
  if (hasPannello.ovest && hasPannello.ovest.attivo) {
    disegnaPannelloLinea(-offsetPannello, 0, -offsetPannello, W, spP);
  }
  // Est: x = L + offsetPannello
  if (hasPannello.est && hasPannello.est.attivo) {
    disegnaPannelloLinea(L + offsetPannello, 0, L + offsetPannello, W, spP);
  }

  // === CONTORNO CAPANNONE (assi pilastri) ===
  ctx.strokeStyle = C.linea;
  ctx.lineWidth = 1;
  const c1 = toPx(0, 0), c2 = toPx(L, W);
  ctx.strokeRect(c1.px, c1.py, c2.px - c1.px, c2.py - c1.py);

  // === ASSI TRATTEGGIATI ===
  ctx.setLineDash([10, 4, 3, 4]);
  ctx.strokeStyle = C.asse;
  ctx.lineWidth = 0.5;
  const posX = posizioniX(stato);
  for (const x of posX) {
    const a = toPx(x, -2.5), b = toPx(x, W + 2.5);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  for (const y of [0, W]) {
    const a = toPx(-2.5, y), b = toPx(L + 2.5, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  ctx.setLineDash([]);

  // === PILASTRI (rettangoli con tratteggio leggero) ===
  const classificazione = classificaPilastri(stato);

  classificazione.pilastri.forEach(p => {
    const px = p.x - baseP / 2;
    const py = p.y - altP / 2;
    const a = toPx(px, py);
    const w = baseP * scala;
    const h = altP * scala;

    ctx.fillStyle = C.pilastroFill;
    ctx.fillRect(a.px, a.py, w, h);
    ctx.strokeStyle = C.linea;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(a.px, a.py, w, h);

    // Sigla PP# accanto al pilastro
    ctx.fillStyle = C.testo;
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // Sud: sopra il pilastro. Nord: sotto.
    const yLabel = p.y === 0 ? a.py - 3 : a.py + h + 12;
    ctx.fillText(p.sigla, a.px + w / 2, yLabel);
    ctx.textBaseline = 'alphabetic';
  });

  // === QUOTE PARZIALI CAMPATE ===
  ctx.fillStyle = C.testoQuota;
  ctx.font = '11px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = C.quota;
  ctx.lineWidth = 0.8;

  const yQ = -2;
  for (let i = 0; i < posX.length - 1; i++) {
    const a = toPx(posX[i], yQ);
    const b = toPx(posX[i + 1], yQ);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    taccaObliqua(a.px, a.py);
    taccaObliqua(b.px, b.py);
    ctx.fillText(stato.campate[i].interasse.toFixed(2), (a.px + b.px) / 2, a.py - 5);
  }

  // === QUOTA TOTALE LUNGHEZZA ===
  const yQT = -4;
  const aT = toPx(0, yQT), bT = toPx(L, yQT);
  ctx.beginPath(); ctx.moveTo(aT.px, aT.py); ctx.lineTo(bT.px, bT.py); ctx.stroke();
  taccaObliqua(aT.px, aT.py);
  taccaObliqua(bT.px, bT.py);
  ctx.font = 'bold 12px Consolas, monospace';
  ctx.fillText(L.toFixed(2), (aT.px + bT.px) / 2, aT.py - 5);

  // === QUOTA LUCE (destra) ===
  const xQ = L + 2;
  const aL = toPx(xQ, 0), bL = toPx(xQ, W);
  ctx.beginPath(); ctx.moveTo(aL.px, aL.py); ctx.lineTo(bL.px, bL.py); ctx.stroke();
  taccaObliqua(aL.px, aL.py);
  taccaObliqua(bL.px, bL.py);
  ctx.save();
  ctx.translate(bL.px + 18, (aL.py + bL.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 12px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(W.toFixed(2), 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';

  // === LINEE DI SEZIONE A-A e B-B ===
  disegnaSezione(stato, 'A', L, W);
  disegnaSezione(stato, 'B', L, W);

  // === FRECCE PROSPETTI 1-2-3-4 (stile DXF: cerchio + triangolo) ===
  disegnaFrecciaProspetto(1, L / 2, W + offsetPannello + 3, 'sud');
  disegnaFrecciaProspetto(2, L + offsetPannello + 3, W / 2, 'est');
  disegnaFrecciaProspetto(3, L / 2, -offsetPannello - 3, 'nord');
  disegnaFrecciaProspetto(4, -offsetPannello - 3, W / 2, 'ovest');

  // === BUSSOLA NORD ===
  disegnaBussola(canvas.width - 80, 80);

  // === LATO EDIFICIO ESISTENTE (opzionale) ===
  if (stato.generale.edificioEsistente) {
    disegnaEdificioEsistente(stato, L, W, offsetPannello);
  }
}

function disegnaPannelloLinea(x1, y1, x2, y2, spessore) {
  const a = toPx(x1, y1);
  const b = toPx(x2, y2);
  ctx.strokeStyle = C.pannello;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();

  // Linea spessore (offset di spessore/2)
  const nx = (y2 - y1) === 0 ? 0 : spessore / 2 * scala;
  const ny = (x2 - x1) === 0 ? 0 : spessore / 2 * scala;

  if (y1 === y2) {
    const a2 = toPx(x1, y1 + (y1 < 0 ? -spessore : spessore));
    const b2 = toPx(x2, y2 + (y1 < 0 ? -spessore : spessore));
    ctx.beginPath(); ctx.moveTo(a2.px, a2.py); ctx.lineTo(b2.px, b2.py); ctx.stroke();
  } else {
    const a2 = toPx(x1 + (x1 < 0 ? -spessore : spessore), y1);
    const b2 = toPx(x2 + (x1 < 0 ? -spessore : spessore), y2);
    ctx.beginPath(); ctx.moveTo(a2.px, a2.py); ctx.lineTo(b2.px, b2.py); ctx.stroke();
  }
}

function taccaObliqua(px, py) {
  const s = 4;
  ctx.beginPath();
  ctx.moveTo(px - s, py + s);
  ctx.lineTo(px + s, py - s);
  ctx.stroke();
}

function disegnaSezione(stato, lettera, L, W) {
  ctx.strokeStyle = C.sezione;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([12, 5]);
  ctx.fillStyle = C.sezione;
  ctx.font = 'bold 14px Consolas, monospace';
  ctx.textAlign = 'center';

  if (lettera === 'A') {
    // A-A orizzontale in mezzeria luce
    const y = W / 2;
    const a = toPx(-3, y), b = toPx(L + 3, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('A', a.px + 10, a.py + 5);
    ctx.fillText('A', b.px - 10, b.py + 5);
  } else {
    // B-B verticale in mezzeria lunghezza
    const x = L / 2;
    const a = toPx(x, -3), b = toPx(x, W + 3);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('B', a.px + 12, a.py + 5);
    ctx.fillText('B', b.px + 12, b.py - 5);
  }
  ctx.textAlign = 'center';
}

function disegnaFrecciaProspetto(numero, x, y, direzione) {
  const p = toPx(x, y);
  const r = 16;

  // Cerchio
  ctx.strokeStyle = C.freccia;
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Triangolo direzionale
  ctx.fillStyle = C.freccia;
  ctx.beginPath();
  const dirMap = { sud: 0, est: Math.PI/2, nord: Math.PI, ovest: -Math.PI/2 };
  const ang = dirMap[direzione];
  const tipX = p.px + Math.sin(ang) * r * 0.7;
  const tipY = p.py + Math.cos(ang) * r * 0.7;
  const baseX = p.px + Math.sin(ang + 2.5) * r * 0.5;
  const baseY = p.py + Math.cos(ang + 2.5) * r * 0.5;
  const base2X = p.px + Math.sin(ang - 2.5) * r * 0.5;
  const base2Y = p.py + Math.cos(ang - 2.5) * r * 0.5;
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX, baseY);
  ctx.lineTo(base2X, base2Y);
  ctx.closePath();
  ctx.fill();

  // Numero al centro
  ctx.fillStyle = C.testo;
  ctx.font = 'bold 12px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, p.px, p.py + 1);
  ctx.textBaseline = 'alphabetic';
}

function disegnaBussola(cx, cy) {
  const r = 24;
  ctx.strokeStyle = C.linea;
  ctx.fillStyle = C.linea;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Freccia nord
  ctx.beginPath();
  ctx.moveTo(cx, cy + 14);
  ctx.lineTo(cx, cy - 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18);
  ctx.lineTo(cx - 5, cy - 8);
  ctx.lineTo(cx + 5, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Lettera N
  ctx.fillStyle = C.testo;
  ctx.font = 'bold 12px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy + r + 14);
}

function disegnaEdificioEsistente(stato, L, W, offsetP) {
  const lato = stato.generale.edificioEsistente;
  if (!lato) return;
  ctx.save();
  ctx.fillStyle = 'rgba(120, 120, 120, 0.15)';
  ctx.strokeStyle = '#666';
  ctx.setLineDash([8, 4]);
  ctx.lineWidth = 1;

  let x, y, w, h;
  const dist = 8;
  if (lato === 'nord') {
    x = -offsetP - 3; y = W + offsetP + dist; w = L + offsetP * 2 + 6; h = 6;
  } else if (lato === 'sud') {
    x = -offsetP - 3; y = -offsetP - dist - 6; w = L + offsetP * 2 + 6; h = 6;
  } else if (lato === 'est') {
    x = L + offsetP + dist; y = -offsetP - 3; w = 6; h = W + offsetP * 2 + 6;
  } else if (lato === 'ovest') {
    x = -offsetP - dist - 6; y = -offsetP - 3; w = 6; h = W + offsetP * 2 + 6;
  } else return;

  const a = toPx(x, y);
  ctx.fillRect(a.px, a.py, w * scala, h * scala);
  ctx.strokeRect(a.px, a.py, w * scala, h * scala);

  // Testo
  ctx.fillStyle = '#444';
  ctx.font = 'italic 11px Consolas, monospace';
  ctx.textAlign = 'center';
  const cx = a.px + (w * scala) / 2;
  const cy = a.py + (h * scala) / 2 + 4;
  ctx.fillText('EDIFICIO ESISTENTE', cx, cy);

  ctx.restore();
}

export function resetPianta() {
  userInteracted = false;
  scala = 1; offsetX = 0; offsetY = 0;
  autoFit(statoCorrente);
  disegna(statoCorrente);
}