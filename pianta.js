// pianta.js — Disegno pianta tecnica 2D con quote, pilastri, linee sezione

import { lunghezzaTotale } from './modello.js';

let canvas, ctx;
let scala = 1, offsetX = 0, offsetY = 0;
let dragAttivo = false, dragStart = null;
let userInteracted = false;
let statoCorrente = null;

const COLORI = {
  sfondo:       '#e8eaed',
  contorno:     '#2563eb',
  pilastro:     '#6b7280',
  pilastroBordo:'#1a1d24',
  asse:         '#9aa3b2',
  quota:        '#4b5563',
  quotaLinea:   '#4b5563',
  testo:        '#1a1d24',
  sezioneA:     '#e05555',
  sezioneB:     '#e05555',
  freccia:      '#f59e0b',
  terreno:      '#d1d5db'
};

/**
 * Inizializza il canvas della pianta.
 */
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

  const stopDrag = () => {
    dragAttivo = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('mouseup', stopDrag);
  canvas.addEventListener('mouseleave', stopDrag);

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
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
}

function autoFit(stato) {
  if (!stato || !canvas) return;
  const L = lunghezzaTotale(stato);
  const W = stato.generale.luce;
  const margine = 100;
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
  const L = lunghezzaTotale(stato);
  const pos = [0];
  let acc = 0;
  for (const c of stato.campate) {
    acc += c.interasse;
    pos.push(acc);
  }
  return pos;
}

/**
 * Aggiorna la pianta dallo stato.
 */
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

  // Sfondo
  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Contorno capannone
  const c1 = toPx(0, 0);
  const c2 = toPx(L, W);
  ctx.strokeStyle = COLORI.contorno;
  ctx.lineWidth = 2;
  ctx.strokeRect(c1.px, c1.py, c2.px - c1.px, c2.py - c1.py);

  // Assi tratteggiati
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = COLORI.asse;
  ctx.lineWidth = 1;
  const posX = posizioniX(stato);
  for (const x of posX) {
    const a = toPx(x, -2);
    const b = toPx(x, W + 2);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }
  // Assi orizzontali (2 file)
  for (const y of [0, W]) {
    const a = toPx(-2, y);
    const b = toPx(L + 2, y);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Pilastri (rettangoli pieni)
  ctx.fillStyle = COLORI.pilastro;
  ctx.strokeStyle = COLORI.pilastroBordo;
  ctx.lineWidth = 1.5;

  let numPil = 1;
  for (const x of posX) {
    for (const y of [0, W]) {
      const p = toPx(x - baseP / 2, y - altP / 2);
      const w = baseP * scala;
      const h = altP * scala;
      ctx.fillRect(p.px, p.py, w, h);
      ctx.strokeRect(p.px, p.py, w, h);

      // Numerazione
      ctx.fillStyle = COLORI.testo;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('P' + numPil, p.px + w / 2, p.py - 6);
      ctx.fillStyle = COLORI.pilastro;
      numPil++;
    }
  }

  // Quote parziali campate (sopra)
  ctx.fillStyle = COLORI.quota;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = COLORI.quotaLinea;
  ctx.lineWidth = 1;

  const yQuota = -1.5;
  for (let i = 0; i < posX.length - 1; i++) {
    const a = toPx(posX[i], yQuota);
    const b = toPx(posX[i + 1], yQuota);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.px, a.py - 4); ctx.lineTo(a.px, a.py + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.px, b.py - 4); ctx.lineTo(b.px, b.py + 4); ctx.stroke();
    ctx.fillText(stato.campate[i].interasse + ' m', (a.px + b.px) / 2, a.py - 8);
  }

  // Quota totale lunghezza (ancora sopra)
  const yTot = -3.2;
  const aTot = toPx(0, yTot);
  const bTot = toPx(L, yTot);
  ctx.beginPath(); ctx.moveTo(aTot.px, aTot.py); ctx.lineTo(bTot.px, bTot.py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(aTot.px, aTot.py - 4); ctx.lineTo(aTot.px, aTot.py + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bTot.px, bTot.py - 4); ctx.lineTo(bTot.px, bTot.py + 4); ctx.stroke();
  ctx.font = 'bold 12px monospace';
  ctx.fillText('Lunghezza ' + L.toFixed(2) + ' m', (aTot.px + bTot.px) / 2, aTot.py - 8);

  // Quota luce (destra)
  const xQuota = L + 1.8;
  const aLuc = toPx(xQuota, 0);
  const bLuc = toPx(xQuota, W);
  ctx.beginPath(); ctx.moveTo(aLuc.px, aLuc.py); ctx.lineTo(bLuc.px, bLuc.py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(aLuc.px - 4, aLuc.py); ctx.lineTo(aLuc.px + 4, aLuc.py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bLuc.px - 4, bLuc.py); ctx.lineTo(bLuc.px + 4, bLuc.py); ctx.stroke();
  ctx.font = 'bold 12px monospace';
  ctx.save();
  ctx.translate(bLuc.px + 20, (aLuc.py + bLuc.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Luce ' + W.toFixed(2) + ' m', 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';

  // Linee di sezione A-A (orizzontale, in mezzeria luce)
  const yAA = W / 2;
  const aAA1 = toPx(-3, yAA);
  const aAA2 = toPx(L + 3, yAA);
  ctx.strokeStyle = COLORI.sezioneA;
  ctx.setLineDash([12, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(aAA1.px, aAA1.py);
  ctx.lineTo(aAA2.px, aAA2.py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORI.sezioneA;
  ctx.font = 'bold 14px monospace';
  ctx.fillText('A', aAA1.px + 8, aAA1.py - 6);
  ctx.fillText('A', aAA2.px - 8, aAA2.py - 6);

  // Linea di sezione B-B (verticale, in mezzeria lunghezza)
  const xBB = L / 2;
  const bBB1 = toPx(xBB, -3);
  const bBB2 = toPx(xBB, W + 3);
  ctx.strokeStyle = COLORI.sezioneB;
  ctx.setLineDash([12, 6]);
  ctx.beginPath();
  ctx.moveTo(bBB1.px, bBB1.py);
  ctx.lineTo(bBB2.px, bBB2.py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORI.sezioneB;
  ctx.fillText('B', bBB1.px + 8, bBB1.py + 16);
  ctx.fillText('B', bBB2.px + 8, bBB2.py - 6);

  // Frecce direzione prospetti
  disegnaFreccia(1, L / 2, W + 4, COLORI.freccia);
  disegnaFreccia(2, L + 4, W / 2, COLORI.freccia);
  disegnaFreccia(3, L / 2, -4, COLORI.freccia);
  disegnaFreccia(4, -4, W / 2, COLORI.freccia);

  // Bussola nord (in alto a destra)
  disegnaBussola(canvas.width - 60, 60);
}

function disegnaFreccia(numero, x, y, colore) {
  const p = toPx(x, y);
  ctx.fillStyle = colore;
  ctx.strokeStyle = colore;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, p.px, p.py + 1);
  ctx.textBaseline = 'alphabetic';
}

function disegnaBussola(cx, cy) {
  ctx.strokeStyle = COLORI.quota;
  ctx.fillStyle = COLORI.quota;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 12);
  ctx.lineTo(cx, cy - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 16);
  ctx.lineTo(cx - 4, cy - 8);
  ctx.lineTo(cx + 4, cy - 8);
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - 22);
}

/**
 * Reset vista pianta.
 */
export function resetPianta() {
  userInteracted = false;
  scala = 1;
  offsetX = 0;
  offsetY = 0;
  autoFit(statoCorrente);
  disegna(statoCorrente);
}
