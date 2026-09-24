// prospetti.js — 4 prospetti tecnici stile AutoCAD

import { lunghezzaTotale, luceTrasversale } from './modello.js';

const canvases = {};
const viste = {};

const COLORI = {
  sfondo: '#ffffff',
  linea: '#000000',
  pilastro: '#000000',
  trave: '#333333',
  pannello: '#e5e7eb',
  pannelloBordo: '#000000',
  quota: '#000000',
  testo: '#000000',
  copertura: '#333333'
};

const NUMERI = [1, 2, 3, 4];

export function inizializzaProspetti() {
  NUMERI.forEach(n => {
    const canvas = document.getElementById('prospetto' + n);
    if (!canvas) return;
    canvases[n] = { canvas: canvas, ctx: canvas.getContext('2d') };
    viste[n] = { scala: 1, offsetX: 0, offsetY: 0, userInteracted: false };

    let drag = false;
    let start = null;

    canvas.addEventListener('mousedown', (e) => {
      drag = true;
      start = { x: e.offsetX - viste[n].offsetX, y: e.offsetY - viste[n].offsetY };
      viste[n].userInteracted = true;
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!drag) return;
      viste[n].offsetX = e.offsetX - start.x;
      viste[n].offsetY = e.offsetY - start.y;
      disegnaProspetto(n, window.CACEM_STATE);
    });
    const stop = () => { drag = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 0.9;
      const mx = e.offsetX;
      const my = e.offsetY;
      viste[n].offsetX = mx - (mx - viste[n].offsetX) * f;
      viste[n].offsetY = my - (my - viste[n].offsetY) * f;
      viste[n].scala *= f;
      viste[n].userInteracted = true;
      disegnaProspetto(n, window.CACEM_STATE);
    }, { passive: false });

    canvas.style.cursor = 'grab';
  });

  window.addEventListener('resize', () => {
    NUMERI.forEach(n => {
      if (!viste[n].userInteracted) autoFit(n, window.CACEM_STATE);
      disegnaProspetto(n, window.CACEM_STATE);
    });
  });
}

function adattaCanvas(entry) {
  const r = entry.canvas.getBoundingClientRect();
  if (r.width > 0 && r.height > 0 && (entry.canvas.width !== r.width || entry.canvas.height !== r.height)) {
    entry.canvas.width = r.width;
    entry.canvas.height = r.height;
  }
}

function autoFit(n, stato) {
  const entry = canvases[n];
  if (!entry || !stato) return;
  adattaCanvas(entry);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const isLungo = (n === 1 || n === 3);
  const larghezza = isLungo ? L : W;
  const altezza = Hcolmo;
  const margine = 110;

  const scalaX = (entry.canvas.width - margine * 2) / larghezza;
  const scalaY = (entry.canvas.height - margine * 2) / altezza;
  const v = viste[n];
  v.scala = Math.min(scalaX, scalaY);
  v.offsetX = (entry.canvas.width - larghezza * v.scala) / 2;
  v.offsetY = (entry.canvas.height + altezza * v.scala) / 2 - 40;
}

function toPx(n, x, y) {
  const v = viste[n];
  return { px: v.offsetX + x * v.scala, py: v.offsetY - y * v.scala };
}

export function aggiornaProspetti(stato) {
  if (!stato) return;
  window.CACEM_STATE = stato;
  NUMERI.forEach(n => {
    if (!viste[n].userInteracted) autoFit(n, stato);
    disegnaProspetto(n, stato);
  });
}

function disegnaProspetto(n, stato) {
  const entry = canvases[n];
  if (!entry || !stato) return;
  const ctx = entry.ctx;
  const canvas = entry.canvas;
  const v = viste[n];

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const isLungo = (n === 1 || n === 3);
  const xF = isLungo ? L : W;

  const baseP = stato.pilastri.base / 100;

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  const nomi = ['', 'Lato Sud (lunga)', 'Lato Est (corta)', 'Lato Nord (lunga)', 'Lato Ovest (corta)'];
  ctx.fillText('PROSPETTO ' + n + ' - ' + nomi[n], 15, 22);

  const p1 = toPx(n, 0, 0);
  const p2 = toPx(n, xF, H);
  ctx.fillStyle = COLORI.pannello;
  ctx.fillRect(p1.px, p1.py, p2.px - p1.px, p2.py - p1.py);
  ctx.strokeStyle = COLORI.pannelloBordo;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(p1.px, p1.py, p2.px - p1.px, p2.py - p1.py);

  const altTrave = 0.6;
  ctx.fillStyle = COLORI.trave;
  const t1 = toPx(n, 0, H);
  const t2 = toPx(n, xF, H + altTrave);
  ctx.fillRect(t1.px, t2.py, t2.px - t1.px, t1.py - t2.py);
  ctx.strokeRect(t1.px, t2.py, t2.px - t1.px, t1.py - t2.py);

  ctx.fillStyle = COLORI.pilastro;
  ctx.strokeStyle = COLORI.pilastro;
  ctx.lineWidth = 1;

  if (isLungo) {
    const posX = posizioniXProspetto(stato);
    posX.forEach((x, i) => {
      const a = toPx(n, x - baseP / 2, 0);
      const w = baseP * v.scala;
      const h = H * v.scala;
      ctx.fillRect(a.px, a.py - h, w, h);

      ctx.fillStyle = COLORI.testo;
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P' + (i + 1), a.px + w / 2, a.py - h - 4);
      ctx.fillStyle = COLORI.pilastro;
    });
  } else {
    const a1 = toPx(n, 0, 0);
    const a2 = toPx(n, xF, 0);
    const w = baseP * v.scala;
    const h = H * v.scala;
    ctx.fillRect(a1.px - w / 2, a1.py - h, w, h);
    ctx.fillRect(a2.px - w / 2, a2.py - h, w, h);
  }

  ctx.strokeStyle = COLORI.copertura;
  ctx.lineWidth = 1.5;
  const yGronda = H + altTrave;
  const yColmo = Hcolmo + altTrave;
  const gSx = toPx(n, 0, yGronda);
  const gC = toPx(n, xF / 2, yColmo);
  const gDx = toPx(n, xF, yGronda);
  ctx.beginPath();
  ctx.moveTo(gSx.px, gSx.py);
  ctx.lineTo(gC.px, gC.py);
  ctx.lineTo(gDx.px, gDx.py);
  ctx.stroke();

  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';

  const qA1 = toPx(n, -1, 0);
  const qA2 = toPx(n, -1, H);
  ctx.beginPath();
  ctx.moveTo(qA1.px, qA1.py);
  ctx.lineTo(qA2.px, qA2.py);
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillText((H * 1000).toFixed(0), qA2.px - 6, (qA1.py + qA2.py) / 2);

  const qL1 = toPx(n, 0, -1);
  const qL2 = toPx(n, xF, -1);
  ctx.beginPath();
  ctx.moveTo(qL1.px, qL1.py);
  ctx.lineTo(qL2.px, qL2.py);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText((xF * 1000).toFixed(0), (qL1.px + qL2.px) / 2, qL1.py + 14);
}

function posizioniXProspetto(stato) {
  const pos = [0];
  let acc = 0;
  (stato.campate.lista || []).forEach(c => {
    acc += c.interasse;
    pos.push(acc);
  });
  return pos;
}

export function resetProspetto(id) {
  const n = parseInt(String(id).replace('prospetto', ''), 10);
  if (!viste[n]) return;
  viste[n].scala = 1;
  viste[n].offsetX = 0;
  viste[n].offsetY = 0;
  viste[n].userInteracted = false;
  autoFit(n, window.CACEM_STATE);
  disegnaProspetto(n, window.CACEM_STATE);
}

export function resetTuttiProspetti() {
  NUMERI.forEach(n => {
    viste[n].scala = 1;
    viste[n].offsetX = 0;
    viste[n].offsetY = 0;
    viste[n].userInteracted = false;
    autoFit(n, window.CACEM_STATE);
    disegnaProspetto(n, window.CACEM_STATE);
  });
}