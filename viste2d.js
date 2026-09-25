// viste2d.js — Pianta + Prospetti + Sezioni CACEM v9 (stile AutoCAD B/N)

import { lunghezzaTotale, luceTrasversale } from './modello.js';

const canvases = {};
const viste = {};

const COLORI = {
  sfondo: '#ffffff',
  linea: '#000000',
  lineaSpessa: '#000000',
  pilastro: '#000000',
  traveTU: '#000000',
  traveTI: '#333333',
  tegolo: '#888888',
  pannello: '#f5f5f5',
  pannelloBordo: '#000000',
  asse: '#999999',
  quota: '#000000',
  testo: '#000000',
  sezione: '#cc0000',
  freccia: '#cc0000',
  terreno: '#888888',
  fondazione: '#666666',
  strutturaDietro: '#888888'
};

/* ============================================================
   INIZIALIZZAZIONE CANVAS
   ============================================================ */

function setupCanvas(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const ctx = el.getContext('2d');
  const entry = { canvas: el, ctx: ctx };
  canvases[id] = entry;
  viste[id] = { scala: 1, offsetX: 0, offsetY: 0, userInteracted: false };

  let drag = false, start = null;
  el.addEventListener('mousedown', (e) => {
    drag = true;
    start = { x: e.offsetX - viste[id].offsetX, y: e.offsetY - viste[id].offsetY };
    viste[id].userInteracted = true;
    el.style.cursor = 'grabbing';
  });
  el.addEventListener('mousemove', (e) => {
    if (!drag) return;
    viste[id].offsetX = e.offsetX - start.x;
    viste[id].offsetY = e.offsetY - start.y;
    ridisegna(id);
  });
  const stop = () => { drag = false; el.style.cursor = 'grab'; };
  el.addEventListener('mouseup', stop);
  el.addEventListener('mouseleave', stop);

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.1 : 0.9;
    const mx = e.offsetX, my = e.offsetY;
    viste[id].offsetX = mx - (mx - viste[id].offsetX) * f;
    viste[id].offsetY = my - (my - viste[id].offsetY) * f;
    viste[id].scala *= f;
    viste[id].userInteracted = true;
    ridisegna(id);
  }, { passive: false });

  el.style.cursor = 'grab';
  return entry;
}

function adattaCanvas(entry) {
  const dpr = window.devicePixelRatio || 1;
  const r = entry.canvas.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return;
  const w = Math.round(r.width * dpr);
  const h = Math.round(r.height * dpr);
  if (entry.canvas.width !== w || entry.canvas.height !== h) {
    entry.canvas.width = w;
    entry.canvas.height = h;
    entry.canvas.style.width = r.width + 'px';
    entry.canvas.style.height = r.height + 'px';
    entry.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function dimCss(entry) {
  const dpr = window.devicePixelRatio || 1;
  return { w: entry.canvas.width / dpr, h: entry.canvas.height / dpr };
}

function toPx(id, x, y) {
  const v = viste[id];
  return { px: v.offsetX + x * v.scala, py: v.offsetY - y * v.scala };
}

function ridisegna(id) {
  if (!window.CACEM_STATE) return;
  if (id === 'piantaCanvas') disegnaPianta(window.CACEM_STATE);
  else if (id.startsWith('prospetto')) disegnaProspetto(id, window.CACEM_STATE);
  else if (id.startsWith('sezione')) disegnaSezione(id, window.CACEM_STATE);
}

export function inizializzaViste2D() {
  setupCanvas('piantaCanvas');
  setupCanvas('prospetto1');
  setupCanvas('prospetto2');
  setupCanvas('prospetto3');
  setupCanvas('prospetto4');
  setupCanvas('sezioneAA');
  setupCanvas('sezioneBB');

  window.addEventListener('resize', () => {
    Object.keys(canvases).forEach(id => {
      if (!viste[id].userInteracted) autoFit(id, window.CACEM_STATE);
      ridisegna(id);
    });
  });
}

export function aggiornaViste2D(stato) {
  if (!stato) return;
  window.CACEM_STATE = stato;
  Object.keys(canvases).forEach(id => {
    if (!viste[id].userInteracted) autoFit(id, stato);
    ridisegna(id);
  });
}

function autoFit(id, stato) {
  const entry = canvases[id];
  if (!entry || !stato) return;
  adattaCanvas(entry);
  const dim = dimCss(entry);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro + 1.5;

  let larghezza, altezza;
  if (id === 'piantaCanvas') { larghezza = L; altezza = W; }
  else if (id.startsWith('prospetto')) {
    const n = parseInt(id.replace('prospetto', ''), 10);
    larghezza = (n === 1 || n === 3) ? L : W;
    altezza = H;
  } else {
    larghezza = id === 'sezioneAA' ? L : W;
    altezza = H;
  }

  const margine = 130;
  const scalaX = (dim.w - margine * 2) / larghezza;
  const scalaY = (dim.h - margine * 2) / altezza;
  viste[id].scala = Math.min(scalaX, scalaY);
  viste[id].offsetX = (dim.w - larghezza * viste[id].scala) / 2;
  viste[id].offsetY = (dim.h + altezza * viste[id].scala) / 2 - 30;
}

/* ============================================================
   PIANTA
   ============================================================ */

export function disegnaPianta(stato) {
  const entry = canvases['piantaCanvas'];
  if (!entry || !stato) return;
  const ctx = entry.ctx;
  const dim = dimCss(entry);
  const v = viste['piantaCanvas'];

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, dim.w, dim.h);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const pluvialeD = stato.pilastri.pluvialeDiametro / 1000;
  const mostraPluviale = stato.pilastri.pluviale;
  const numFileY = stato.pilastri.numFileY;

  // Titolo
  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PIANTA PILASTRI, TRAVI E TEGOLI', dim.w / 2, 22);

  // Contorno
  ctx.strokeStyle = COLORI.lineaSpessa;
  ctx.lineWidth = 1.5;
  const c1 = toPx('piantaCanvas', 0, 0);
  const c2 = toPx('piantaCanvas', L, W);
  ctx.strokeRect(c1.px, c1.py, c2.px - c1.px, c2.py - c1.py);

  // Assi tratteggiati
  ctx.setLineDash([12, 4, 3, 4]);
  ctx.strokeStyle = COLORI.asse;
  ctx.lineWidth = 0.5;
  const posX = [];
  let accX = 0;
  for (let i = 0; i <= stato.campateX.numero; i++) {
    posX.push(accX);
    if (i < stato.campateX.numero) accX += stato.campateX.lista[i].interasse;
  }
  posX.forEach(x => {
    const a = toPx('piantaCanvas', x, -1.5);
    const b = toPx('piantaCanvas', x, W + 1.5);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  });
  for (let k = 0; k < numFileY; k++) {
    const y = (k * W) / (numFileY - 1);
    const a = toPx('piantaCanvas', -1.5, y);
    const b = toPx('piantaCanvas', L + 1.5, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Tegoli (tratteggiati)
  const file = stato.copertura.file || [];
  ctx.strokeStyle = COLORI.tegolo;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([6, 4]);
  file.forEach(f => {
    const yc = (f.y1 + f.y2) / 2;
    const a = toPx('piantaCanvas', 0, yc);
    const b = toPx('piantaCanvas', f.lunghezza, yc);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  });
  ctx.setLineDash([]);

  // Travi TU
  const segsTU = stato.traviTU.segmenti || [];
  ctx.strokeStyle = COLORI.traveTU;
  ctx.lineWidth = 2.5;
  segsTU.forEach(s => {
    const a = toPx('piantaCanvas', s.x1, s.y);
    const b = toPx('piantaCanvas', s.x2, s.y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  });

  // Travi TI
  const segsTI = stato.traviTI.segmenti || [];
  ctx.strokeStyle = COLORI.traveTI;
  ctx.lineWidth = 1.5;
  segsTI.forEach(s => {
    const a = toPx('piantaCanvas', s.x1, s.y);
    const b = toPx('piantaCanvas', s.x2, s.y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  });

  // Pilastri
  ctx.fillStyle = COLORI.pilastro;
  posX.forEach((x, i) => {
    for (let k = 0; k < numFileY; k++) {
      const y = (k * W) / (numFileY - 1);
      const a = toPx('piantaCanvas', x - baseP / 2, y - altP / 2);
      const w = baseP * v.scala;
      const h = altP * v.scala;
      ctx.fillRect(a.px, a.py, w, h);

      if (mostraPluviale) {
        const c = toPx('piantaCanvas', x, y);
        ctx.beginPath();
        ctx.arc(c.px, c.py, (pluvialeD / 2) * v.scala, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  });

  // Quote campate
  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';

  for (let i = 0; i < posX.length - 1; i++) {
    const a = toPx('piantaCanvas', posX[i], -2);
    const b = toPx('piantaCanvas', posX[i + 1], -2);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    taccaObliqua(a.px, a.py);
    taccaObliqua(b.px, b.py);
    ctx.fillText((stato.campateX.lista[i].interasse * 100).toFixed(0), (a.px + b.px) / 2, a.py - 4);
  }

  // Quota totale
  const aT = toPx('piantaCanvas', 0, -4);
  const bT = toPx('piantaCanvas', L, -4);
  ctx.beginPath(); ctx.moveTo(aT.px, aT.py); ctx.lineTo(bT.px, bT.py); ctx.stroke();
  taccaObliqua(aT.px, aT.py);
  taccaObliqua(bT.px, bT.py);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText((L * 100).toFixed(0), (aT.px + bT.px) / 2, aT.py - 5);

  // Quota luce
  const xQ = L + 2;
  const aL = toPx('piantaCanvas', xQ, 0);
  const bL = toPx('piantaCanvas', xQ, W);
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

  // Linee sezione
  disegnaLineaSezione('piantaCanvas', 'A', 'orizzontale', L, W);
  disegnaLineaSezione('piantaCanvas', 'B', 'verticale', L, W);

  // Frecce prospetti
  disegnaFrecciaProspetto('piantaCanvas', 1, L / 2, W + 3, 'su');
  disegnaFrecciaProspetto('piantaCanvas', 2, L + 3, W / 2, 'sinistra');
  disegnaFrecciaProspetto('piantaCanvas', 3, L / 2, -3, 'giu');
  disegnaFrecciaProspetto('piantaCanvas', 4, -3, W / 2, 'destra');
}

/* ============================================================
   PROSPETTI
   ============================================================ */

export function disegnaProspetto(id, stato) {
  const entry = canvases[id];
  if (!entry || !stato) return;
  const ctx = entry.ctx;
  const dim = dimCss(entry);
  const v = viste[id];

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, dim.w, dim.h);

  const n = parseInt(id.replace('prospetto', ''), 10);
  const isLungo = (n === 1 || n === 3);
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const larghezza = isLungo ? L : W;
  const H = stato.altezze.altezzaPilastro;
  const estradosso = stato.altezze.estradossoPannello;
  const imposta = stato.altezze.impostaPannello;

  // Titolo
  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  const nomi = { 1: 'PROSPETTO 1 — Lato Sud', 2: 'PROSPETTO 2 — Lato Est',
                 3: 'PROSPETTO 3 — Lato Nord', 4: 'PROSPETTO 4 — Lato Ovest' };
  ctx.fillText(nomi[n], 12, 20);

  // Struttura dietro (tratteggiata)
  ctx.strokeStyle = COLORI.strutturaDietro;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([6, 3]);
  const yStruttura = H - 0.45;
  for (let k = 0; k < 4; k++) {
    const y = yStruttura + (k * 0.15);
    const a = toPx(id, 0, y);
    const b = toPx(id, larghezza, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Pannelli
  ctx.fillStyle = COLORI.pannello;
  const p1 = toPx(id, 0, 0);
  const p2 = toPx(id, larghezza, H);
  ctx.fillRect(p1.px, p2.py, p2.px - p1.px, p1.py - p2.py);
  ctx.strokeStyle = COLORI.pannelloBordo;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(p1.px, p2.py, p2.px - p1.px, p1.py - p2.py);

  // Moduli pannelli (linee verticali)
  const modulo = stato.pannelli.moduloStandard / 100;
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 0.5;
  const nModuli = Math.floor(larghezza / modulo);
  for (let i = 1; i < nModuli; i++) {
    const x = i * modulo;
    const a = toPx(id, x, 0);
    const b = toPx(id, x, H);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }

  // Pilastri visibili (linee verticali ai bordi)
  const baseP = stato.pilastri.base / 100;
  ctx.fillStyle = COLORI.pilastro;
  const posXPil = isLungo ? generaPosXPilastri(stato) : [0, larghezza];
  posXPil.forEach(x => {
    const a = toPx(id, x - baseP / 2, H);
    const w = baseP * v.scala;
    const h = H * v.scala;
    ctx.fillRect(a.px, a.py, w, h);
  });

  // Quote verticali
  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'right';

  const xQ = -0.8;
  const aQ1 = toPx(id, xQ, 0);
  const aQ2 = toPx(id, xQ, H);
  ctx.beginPath(); ctx.moveTo(aQ1.px, aQ1.py); ctx.lineTo(aQ2.px, aQ2.py); ctx.stroke();
  taccaObliqua(aQ1.px, aQ1.py);
  taccaObliqua(aQ2.px, aQ2.py);
  ctx.save();
  ctx.translate(aQ1.px - 8, (aQ1.py + aQ2.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText((H * 100).toFixed(0), 0, 0);
  ctx.restore();

  // Quote estradosso/imposta
  ctx.textAlign = 'center';
  const yE = H + 0.3;
  const aE = toPx(id, 0, yE);
  const bE = toPx(id, larghezza, yE);
  ctx.beginPath(); ctx.moveTo(aE.px, aE.py); ctx.lineTo(bE.px, bE.py); ctx.stroke();
  ctx.fillText('+ ' + estradosso.toFixed(2) + ' estradosso pannelli', (aE.px + bE.px) / 2, aE.py - 4);

  const yI = -0.3;
  const aI = toPx(id, 0, yI);
  const bI = toPx(id, larghezza, yI);
  ctx.beginPath(); ctx.moveTo(aI.px, aI.py); ctx.lineTo(bI.px, bI.py); ctx.stroke();
  ctx.fillText(imposta.toFixed(2) + ' imposta pannelli', (aI.px + bI.px) / 2, aI.py + 12);
}

function generaPosXPilastri(stato) {
  const pos = [0];
  let acc = 0;
  for (let i = 0; i < stato.campateX.numero; i++) {
    acc += stato.campateX.lista[i].interasse;
    pos.push(acc);
  }
  return pos;
}

/* ============================================================
   SEZIONI
   ============================================================ */

export function disegnaSezione(id, stato) {
  const entry = canvases[id];
  if (!entry || !stato) return;
  const ctx = entry.ctx;
  const dim = dimCss(entry);
  const v = viste[id];

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, dim.w, dim.h);

  const isAA = (id === 'sezioneAA');
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const larghezza = isAA ? L : W;
  const H = stato.altezze.altezzaPilastro;

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(isAA ? 'SEZIONE A-A — longitudinale' : 'SEZIONE B-B — trasversale', 12, 20);

  // Terreno
  const t1 = toPx(id, -0.5, 0);
  const t2 = toPx(id, larghezza + 0.5, 0);
  ctx.strokeStyle = COLORI.terreno;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(t1.px, t1.py); ctx.lineTo(t2.px, t2.py); ctx.stroke();

  // Tratteggio terreno
  ctx.lineWidth = 0.5;
  for (let x = -0.5; x < larghezza + 0.5; x += 0.5) {
    const a = toPx(id, x, 0);
    const b = toPx(id, x - 0.3, -0.4);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }

  // Fondazioni
  const posX = isAA ? generaPosXPilastri(stato) : [0, larghezza];
  const largFond = 0.9;
  const altFond = 0.8;
  ctx.fillStyle = COLORI.fondazione;
  ctx.strokeStyle = COLORI.fondazione;
  ctx.lineWidth = 0.8;
  posX.forEach(x => {
    const a = toPx(id, x - largFond / 2, 0);
    const b = toPx(id, x + largFond / 2, -altFond);
    ctx.fillRect(a.px, a.py, b.px - a.px, b.py - a.py);
    ctx.strokeRect(a.px, a.py, b.px - a.px, b.py - a.py);
  });

  // Pilastri
  const baseP = stato.pilastri.base / 100;
  const pluvialeD = stato.pilastri.pluvialeDiametro / 1000;
  const mostraPluviale = stato.pilastri.pluviale;
  ctx.fillStyle = COLORI.pilastro;
  posX.forEach(x => {
    const a = toPx(id, x - baseP / 2, H);
    const w = baseP * v.scala;
    const h = H * v.scala;
    ctx.fillRect(a.px, a.py, w, h);

    if (mostraPluviale) {
      const c = toPx(id, x, H / 2);
      ctx.beginPath();
      ctx.arc(c.px, c.py, (pluvialeD / 2) * v.scala, 0, Math.PI * 2);
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  });

  // Trave TU (sopra i pilastri)
  const tuB = stato.traviTU.base / 100;
  const tuA = stato.traviTU.altezza / 100;
  ctx.fillStyle = COLORI.traveTU;
  if (isAA) {
    const t0 = toPx(id, posX[0] - 0.3, H);
    const t1b = toPx(id, posX[posX.length - 1] + 0.3, H + tuA);
    ctx.fillRect(t0.px, t1b.py, t1b.px - t0.px, t0.py - t1b.py);
  } else {
    [0, larghezza].forEach(x => {
      const a = toPx(id, x - tuB / 2, H + tuA);
      const w = tuB * v.scala;
      const h = tuA * v.scala;
      ctx.fillRect(a.px, a.py, w, h);
    });
  }

  // Trave TI (in A-A, sulle file interne)
  if (isAA && stato.traviTI.attive) {
    const tiB = stato.traviTI.base / 100;
    const tiA = stato.traviTI.altezza / 100;
    const segsTI = stato.traviTI.segmenti || [];
    ctx.fillStyle = COLORI.traveTI;
    segsTI.forEach(s => {
      const xc = (s.x1 + s.x2) / 2;
      const a = toPx(id, xc - tiB / 2, H + tuA + tiA);
      const w = tiB * v.scala;
      const h = tiA * v.scala;
      ctx.fillRect(a.px, a.py, w, h);
    });
  }

  // Tegoli AL
  const tegH = stato.copertura.tegolo.altezza / 100;
  const spTeg = stato.copertura.tegolo.spessore / 100;
  const yBase = H + tuA + (isAA ? stato.traviTI.altezza / 100 : 0);
  ctx.strokeStyle = COLORI.tegolo;
  ctx.lineWidth = 1.2;

  if (isAA) {
    const a1 = toPx(id, 0, yBase);
    const b1 = toPx(id, larghezza, yBase);
    ctx.beginPath(); ctx.moveTo(a1.px, a1.py); ctx.lineTo(b1.px, b1.py); ctx.stroke();
    const a2 = toPx(id, 0, yBase + spTeg);
    const b2 = toPx(id, larghezza, yBase + spTeg);
    ctx.beginPath(); ctx.moveTo(a2.px, a2.py); ctx.lineTo(b2.px, b2.py); ctx.stroke();
  } else {
    const tegLarg = stato.copertura.tegolo.larghezza / 100;
    const basePiana = stato.copertura.tegolo.basePiana / 100;
    const numFile = stato.copertura.file.length;
    const yTop = yBase + tegH;
    for (let i = 0; i < Math.min(numFile, 8); i++) {
      const x1 = i * tegLarg;
      const x2 = Math.min((i + 1) * tegLarg, larghezza);
      const p1 = toPx(id, x1, yBase);
      const p2 = toPx(id, x1 + (tegLarg - basePiana) / 2, yTop);
      const p3 = toPx(id, x1 + (tegLarg + basePiana) / 2, yTop);
      const p4 = toPx(id, x2, yBase);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.stroke();
    }
  }

  // Quote
  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';

  // Quota totale larghezza
  const yQ = -1.5;
  const aQ = toPx(id, 0, yQ);
  const bQ = toPx(id, larghezza, yQ);
  ctx.beginPath(); ctx.moveTo(aQ.px, aQ.py); ctx.lineTo(bQ.px, bQ.py); ctx.stroke();
  taccaObliqua(aQ.px, aQ.py);
  taccaObliqua(bQ.px, bQ.py);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText((larghezza * 100).toFixed(0), (aQ.px + bQ.px) / 2, aQ.py + 14);

  // Quota altezza
  const xQ = -0.8;
  const aH1 = toPx(id, xQ, 0);
  const aH2 = toPx(id, xQ, H);
  ctx.beginPath(); ctx.moveTo(aH1.px, aH1.py); ctx.lineTo(aH2.px, aH2.py); ctx.stroke();
  taccaObliqua(aH1.px, aH1.py);
  taccaObliqua(aH2.px, aH2.py);
  ctx.save();
  ctx.translate(aH1.px - 12, (aH1.py + aH2.py) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((H * 100).toFixed(0), 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';
}

/* ============================================================
   HELPER
   ============================================================ */

function taccaObliqua(px, py) {
  const s = 3;
  ctx_draw(px, py, s);
}

let _ctxRef = null;
function ctx_draw(px, py, s) {
  const active = document.querySelector('.view.active');
  const canvas = active ? active.querySelector('canvas') : null;
  if (!canvas) return;
  const c = canvas.getContext('2d');
  c.beginPath();
  c.moveTo(px - s, py + s);
  c.lineTo(px + s, py - s);
  c.stroke();
}

function disegnaLineaSezione(canvasId, lettera, orientamento, L, W) {
  const entry = canvases[canvasId];
  if (!entry) return;
  const ctx = entry.ctx;
  ctx.strokeStyle = COLORI.sezione;
  ctx.fillStyle = COLORI.sezione;
  ctx.lineWidth = 1;
  ctx.setLineDash([16, 5, 3, 5]);
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';

  if (orientamento === 'orizzontale') {
    const y = W / 2;
    const a = toPx(canvasId, -2, y);
    const b = toPx(canvasId, L + 2, y);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(lettera, a.px - 10, a.py + 4);
    ctx.fillText(lettera, b.px + 10, b.py + 4);
  } else {
    const x = L / 2;
    const a = toPx(canvasId, x, -2);
    const b = toPx(canvasId, x, W + 2);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(lettera, a.px, a.py - 6);
    ctx.fillText(lettera, b.px, b.py + 12);
  }
}

function disegnaFrecciaProspetto(canvasId, numero, x, y, direzione) {
  const entry = canvases[canvasId];
  if (!entry) return;
  const ctx = entry.ctx;
  const p = toPx(canvasId, x, y);
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
  const tipX = p.px + Math.sin(ang) * 5;
  const tipY = p.py - Math.cos(ang) * 5;
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(p.px + Math.sin(ang + 2) * 5, p.py - Math.cos(ang + 2) * 5);
  ctx.lineTo(p.px + Math.sin(ang - 2) * 5, p.py - Math.cos(ang - 2) * 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORI.testo;
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, p.px, p.py + 1);
  ctx.textBaseline = 'alphabetic';
}