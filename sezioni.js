// sezioni.js — Sezione A-A longitudinale + B-B trasversale stile AutoCAD

import { lunghezzaTotale, luceTrasversale } from './modello.js';

const canvases = {};
const viste = {};

const COLORI = {
  sfondo: '#ffffff',
  linea: '#000000',
  pilastro: '#000000',
  trave: '#333333',
  tegolo: '#555555',
  pannello: '#e5e7eb',
  fondazione: '#666666',
  terreno: '#888888',
  quota: '#000000',
  testo: '#000000',
  asse: '#999999'
};

export function inizializzaSezioni() {
  const mappa = { AA: 'sezioneAA', BB: 'sezioneBB' };
  Object.keys(mappa).forEach(key => {
    const canvas = document.getElementById(mappa[key]);
    if (!canvas) return;
    canvases[key] = { canvas: canvas, ctx: canvas.getContext('2d') };
    viste[key] = { scala: 1, offsetX: 0, offsetY: 0, userInteracted: false };

    let drag = false;
    let start = null;

    canvas.addEventListener('mousedown', (e) => {
      drag = true;
      start = { x: e.offsetX - viste[key].offsetX, y: e.offsetY - viste[key].offsetY };
      viste[key].userInteracted = true;
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!drag) return;
      viste[key].offsetX = e.offsetX - start.x;
      viste[key].offsetY = e.offsetY - start.y;
      disegnaSezione(key, window.CACEM_STATE);
    });
    const stop = () => { drag = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 0.9;
      const mx = e.offsetX;
      const my = e.offsetY;
      viste[key].offsetX = mx - (mx - viste[key].offsetX) * f;
      viste[key].offsetY = my - (my - viste[key].offsetY) * f;
      viste[key].scala *= f;
      viste[key].userInteracted = true;
      disegnaSezione(key, window.CACEM_STATE);
    }, { passive: false });

    canvas.style.cursor = 'grab';
  });

  window.addEventListener('resize', () => {
    Object.keys(viste).forEach(key => {
      if (!viste[key].userInteracted) autoFit(key, window.CACEM_STATE);
      disegnaSezione(key, window.CACEM_STATE);
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

function autoFit(key, stato) {
  const entry = canvases[key];
  if (!entry || !stato) return;
  adattaCanvas(entry);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita + 0.6;

  const isAA = (key === 'AA');
  const larghezza = isAA ? L : W;
  const altezza = Hcolmo;
  const margine = 120;

  const scalaX = (entry.canvas.width - margine * 2) / larghezza;
  const scalaY = (entry.canvas.height - margine * 2) / altezza;
  const v = viste[key];
  v.scala = Math.min(scalaX, scalaY);
  v.offsetX = (entry.canvas.width - larghezza * v.scala) / 2;
  v.offsetY = (entry.canvas.height + altezza * v.scala) / 2 - 40;
}

function toPx(key, x, y) {
  const v = viste[key];
  return { px: v.offsetX + x * v.scala, py: v.offsetY - y * v.scala };
}

export function aggiornaSezioni(stato) {
  if (!stato) return;
  window.CACEM_STATE = stato;
  Object.keys(viste).forEach(key => {
    if (!viste[key].userInteracted) autoFit(key, stato);
    disegnaSezione(key, stato);
  });
}

function disegnaSezione(key, stato) {
  const entry = canvases[key];
  if (!entry || !stato) return;
  const ctx = entry.ctx;
  const canvas = entry.canvas;
  const v = viste[key];

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const isAA = (key === 'AA');
  const xF = isAA ? L : W;

  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const altTrave = 0.6;

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  const nome = isAA ? 'SEZIONE A-A - longitudinale' : 'SEZIONE B-B - trasversale';
  ctx.fillText(nome, 15, 22);

  const t1 = toPx(key, -1, 0);
  const t2 = toPx(key, xF + 1, 0);
  ctx.strokeStyle = COLORI.terreno;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t1.px, t1.py);
  ctx.lineTo(t2.px, t2.py);
  ctx.stroke();

  for (let x = -1; x < xF + 1; x += 0.5) {
    const a = toPx(key, x, 0);
    const b = toPx(key, x - 0.3, -0.4);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }

  ctx.fillStyle = COLORI.fondazione;
  ctx.strokeStyle = COLORI.fondazione;
  ctx.lineWidth = 0.8;

  const posX = posizioniX(stato);

  if (isAA) {
    posX.forEach(x => {
      const larg = Math.max(baseP * 1.8, 0.8);
      const a = toPx(key, x - larg / 2, 0);
      const b = toPx(key, x + larg / 2, -0.8);
      ctx.fillRect(a.px, a.py, b.px - a.px, b.py - a.py);
      ctx.strokeRect(a.px, a.py, b.px - a.px, b.py - a.py);
    });
  } else {
    [0, W].forEach(x => {
      const larg = Math.max(baseP * 1.8, 0.8);
      const a = toPx(key, x - larg / 2, 0);
      const b = toPx(key, x + larg / 2, -0.8);
      ctx.fillRect(a.px, a.py, b.px - a.px, b.py - a.py);
      ctx.strokeRect(a.px, a.py, b.px - a.px, b.py - a.py);
    });
  }

  ctx.fillStyle = COLORI.pilastro;

  if (isAA) {
    posX.forEach((x, i) => {
      const a = toPx(key, x - baseP / 2, H);
      const w = baseP * v.scala;
      const h = H * v.scala;
      ctx.fillRect(a.px, a.py, w, h);

      ctx.fillStyle = COLORI.testo;
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P' + (i + 1), a.px + w / 2, a.py - 4);
      ctx.fillStyle = COLORI.pilastro;
    });
  } else {
    [0, W].forEach(x => {
      const a = toPx(key, x - baseP / 2, H);
      const w = baseP * v.scala;
      const h = H * v.scala;
      ctx.fillRect(a.px, a.py, w, h);
    });
  }

  ctx.fillStyle = COLORI.trave;
  ctx.strokeStyle = COLORI.trave;
  const tSx = toPx(key, 0, H);
  const tDx = toPx(key, xF, H + altTrave);
  ctx.fillRect(tSx.px, tDx.py, tDx.px - tSx.px, tSx.py - tDx.py);
  ctx.strokeRect(tSx.px, tDx.py, tDx.px - tSx.px, tSx.py - tDx.py);

  ctx.fillStyle = COLORI.tegolo;
  ctx.strokeStyle = COLORI.tegolo;
  ctx.lineWidth = 1;
  const spTeg = 0.15;

  const yGronda = H + altTrave;
  const yColmo = Hcolmo + altTrave;

  const a1 = toPx(key, 0, yGronda + spTeg);
  const b1 = toPx(key, xF / 2, yColmo + spTeg);
  const c1 = toPx(key, xF / 2, yColmo);
  const d1 = toPx(key, 0, yGronda);

  ctx.beginPath();
  ctx.moveTo(a1.px, a1.py);
  ctx.lineTo(b1.px, b1.py);
  ctx.lineTo(c1.px, c1.py);
  ctx.lineTo(d1.px, d1.py);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const a2 = toPx(key, xF, yGronda + spTeg);
  const b2 = toPx(key, xF / 2, yColmo + spTeg);
  const c2 = toPx(key, xF / 2, yColmo);
  const d2 = toPx(key, xF, yGronda);

  ctx.beginPath();
  ctx.moveTo(a2.px, a2.py);
  ctx.lineTo(b2.px, b2.py);
  ctx.lineTo(c2.px, c2.py);
  ctx.lineTo(d2.px, d2.py);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';

  const qA1 = toPx(key, -1, 0);
  const qA2 = toPx(key, -1, H);
  ctx.beginPath();
  ctx.moveTo(qA1.px, qA1.py);
  ctx.lineTo(qA2.px, qA2.py);
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillText((H * 1000).toFixed(0), qA2.px - 6, (qA1.py + qA2.py) / 2);

  const qL1 = toPx(key, 0, -1);
  const qL2 = toPx(key, xF, -1);
  ctx.beginPath();
  ctx.moveTo(qL1.px, qL1.py);
  ctx.lineTo(qL2.px, qL2.py);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText((xF * 1000).toFixed(0), (qL1.px + qL2.px) / 2, qL1.py + 14);
}

function posizioniX(stato) {
  const pos = [0];
  let acc = 0;
  (stato.campate.lista || []).forEach(c => {
    acc += c.interasse;
    pos.push(acc);
  });
  return pos;
}

export function resetSezioni() {
  Object.keys(viste).forEach(key => {
    viste[key].scala = 1;
    viste[key].offsetX = 0;
    viste[key].offsetY = 0;
    viste[key].userInteracted = false;
    autoFit(key, window.CACEM_STATE);
    disegnaSezione(key, window.CACEM_STATE);
  });
}