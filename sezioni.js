// sezioni.js — Sezione A-A + B-B CACEM v8 (stile AutoCAD B/N)

import { lunghezzaTotale, luceTrasversale } from './modello.js';

const canvases = {};
const viste = {};

const COLORI = {
  sfondo: '#ffffff',
  linea: '#000000',
  lineaSottile: '#333333',
  pilastro: '#000000',
  trave: '#333333',
  tegolo: '#666666',
  clsTratteggio: '#000000',
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

function getDimCss(entry) {
  const dpr = window.devicePixelRatio || 1;
  return { w: entry.canvas.width / dpr, h: entry.canvas.height / dpr };
}

function autoFit(key, stato) {
  const entry = canvases[key];
  if (!entry || !stato) return;
  adattaCanvas(entry);

  const dim = getDimCss(entry);
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro + 1.5; // margine per terreno

  const isAA = (key === 'AA');
  const larghezza = isAA ? L : W;

  const margine = 130;
  const scalaX = (dim.w - margine * 2) / larghezza;
  const scalaY = (dim.h - margine * 2) / H;
  const v = viste[key];
  v.scala = Math.min(scalaX, scalaY);
  v.offsetX = (dim.w - larghezza * v.scala) / 2;
  v.offsetY = (dim.h + H * v.scala) / 2 - 50;
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
  const v = viste[key];
  const dim = getDimCss(entry);

  ctx.fillStyle = COLORI.sfondo;
  ctx.fillRect(0, 0, dim.w, dim.h);

  const isAA = (key === 'AA');
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro;
  const larghezza = isAA ? L : W;

  // Titolo
  ctx.fillStyle = COLORI.testo;
  ctx.font = 'italic bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(isAA ? 'SEZIONE A-A — longitudinale' : 'SEZIONE B-B — trasversale', 15, 22);

  // === LINEA TERRENO ===
  const t1 = toPx(key, -1, 0);
  const t2 = toPx(key, larghezza + 1, 0);
  ctx.strokeStyle = COLORI.terreno;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(t1.px, t1.py);
  ctx.lineTo(t2.px, t2.py);
  ctx.stroke();

  // Tratteggio terreno
  ctx.strokeStyle = COLORI.terreno;
  ctx.lineWidth = 0.5;
  for (let x = -1; x < larghezza + 1; x += 0.5) {
    const a = toPx(key, x, 0);
    const b = toPx(key, x - 0.3, -0.4);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }

  // === FONDAZIONI (bicchieri sotto pilastri) ===
  if (isAA) {
    const posX = getPosX(stato);
    disegnaFondazioni(ctx, key, posX, v, COLORI);
  } else {
    // Lato corto: 2 pilastri agli angoli
    disegnaFondazioni(ctx, key, [0, W], v, COLORI);
  }

  // === PILASTRI ===
  const baseP = stato.pilastri.base / 100;
  const pluvialeD = stato.pilastri.pluvialeDiametro / 1000;
  const mostraPluviale = stato.pilastri.pluviale;

  if (isAA) {
    const posX = getPosX(stato);
    posX.forEach(x => {
      // Rettangolo pilastro
      const a = toPx(key, x - baseP / 2, H);
      const w = baseP * v.scala;
      const h = H * v.scala;
      ctx.fillStyle = COLORI.pilastro;
      ctx.fillRect(a.px, a.py, w, h);

      // Pluviale (cerchio)
      if (mostraPluviale) {
        const c = toPx(key, x, H * 0.5);
        ctx.beginPath();
        ctx.arc(c.px, c.py, (pluvialeD / 2) * v.scala, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });
  } else {
    [0, W].forEach(x => {
      const a = toPx(key, x - baseP / 2, H);
      const w = baseP * v.scala;
      const h = H * v.scala;
      ctx.fillStyle = COLORI.pilastro;
      ctx.fillRect(a.px, a.py, w, h);

      if (mostraPluviale) {
        const c = toPx(key, x, H * 0.5);
        ctx.beginPath();
        ctx.arc(c.px, c.py, (pluvialeD / 2) * v.scala, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });
  }

  // === TRAVE DI BANCHINA (TU - sopra pilastri) ===
  const tuBase = stato.traviTU.base / 100;
  const tuAlt = stato.traviTU.altezza / 100;
  ctx.fillStyle = COLORI.trave;

  if (isAA) {
    // Trave continua sopra tutti i pilastri
    const posX = getPosX(stato);
    const t0 = toPx(key, posX[0] - 0.3, H);
    const t1b = toPx(key, posX[posX.length - 1] + 0.3, H + tuAlt);
    ctx.fillRect(t0.px, t1b.py, t1b.px - t0.px, t0.py - t1b.py);
  } else {
    [0, W].forEach(x => {
      const a = toPx(key, x - tuBase / 2, H + tuAlt);
      const w = tuBase * v.scala;
      const h = tuAlt * v.scala;
      ctx.fillRect(a.px, a.py, w, h);
    });
  }

  // === TRAVI TI (interne, solo sezione A-A) ===
  if (isAA && stato.traviTI.attive) {
    const segs = stato.traviTI.segmenti || [];
    const tiBase = stato.traviTI.base / 100;
    const tiAlt = stato.traviTI.altezza / 100;
    ctx.fillStyle = COLORI.trave;

    // Le travi TI sono tagliate perpendicolarmente — si vedono come rettangoli
    segs.forEach(s => {
      const xc = (s.x1 + s.x2) / 2;
      const a = toPx(key, xc - tiBase / 2, H + tuAlt + tiAlt);
      const w = tiBase * v.scala;
      const h = tiAlt * v.scala;
      ctx.fillRect(a.px, a.py, w, h);
    });
  }

  // === TEGOLI AL (copertura) ===
  disegnaTegoliSezione(ctx, key, stato, larghezza, H, v, isAA);

  // === QUOTE ===
  disegnaQuoteSezione(ctx, key, larghezza, H, v, stato, isAA);
}

/* ============================================================
   FONDAZIONI
   ============================================================ */

function disegnaFondazioni(ctx, key, posX, v, COLORI) {
  const largFond = 0.9;
  const altFond = 0.8;

  ctx.fillStyle = COLORI.fondazione;
  ctx.strokeStyle = COLORI.fondazione;
  ctx.lineWidth = 0.8;

  posX.forEach(x => {
    const a = toPx(key, x - largFond / 2, 0);
    const b = toPx(key, x + largFond / 2, -altFond);
    ctx.fillRect(a.px, a.py, b.px - a.px, b.py - a.py);
    ctx.strokeRect(a.px, a.py, b.px - a.px, b.py - a.py);
  });
}

/* ============================================================
   TEGOLI AL
   ============================================================ */

function disegnaTegoliSezione(ctx, key, stato, larghezza, H, v, isAA) {
  const tuAlt = stato.traviTU.altezza / 100;
  const tiAlt = stato.traviTI.altezza / 100;
  const tegH = stato.copertura.tegolo.altezza / 100;
  const spTeg = stato.copertura.tegolo.spessore / 100;

  // Quota della base tegolo (sopra le travi)
  const yBase = H + tuAlt + (isAA ? tiAlt : 0);
  const yTop = yBase + tegH;

  ctx.strokeStyle = COLORI.tegolo;
  ctx.lineWidth = 1.2;

  if (isAA) {
    // Longitudinale: tegoli paralleli, si vede il profilo a calice continuo
    // Linea inferiore
    const a1 = toPx(key, 0, yBase);
    const b1 = toPx(key, larghezza, yBase);
    ctx.beginPath(); ctx.moveTo(a1.px, a1.py); ctx.lineTo(b1.px, b1.py); ctx.stroke();

    // Linea superiore (base piana del calice)
    const a2 = toPx(key, 0, yBase + spTeg);
    const b2 = toPx(key, larghezza, yBase + spTeg);
    ctx.beginPath(); ctx.moveTo(a2.px, a2.py); ctx.lineTo(b2.px, b2.py); ctx.stroke();
  } else {
    // Trasversale: si vede la sezione del tegolo a calice
    const tegLarg = stato.copertura.tegolo.larghezza / 100;
    const basePiana = stato.copertura.tegolo.basePiana / 100;
    const numFile = stato.copertura.file.length;

    // Disegna N tegoli affiancati
    for (let i = 0; i < Math.min(numFile, 8); i++) {
      const x1 = i * tegLarg;
      const x2 = Math.min((i + 1) * tegLarg, larghezza);

      // Profilo a calice: 2 linee inclinate + base piana
      const p1 = toPx(key, x1, yBase);
      const p2 = toPx(key, x1 + (tegLarg - basePiana) / 2, yTop);
      const p3 = toPx(key, x1 + (tegLarg + basePiana) / 2, yTop);
      const p4 = toPx(key, x2, yBase);

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.stroke();

      // Simbolo coppella (piccolo arco al centro)
      const c = toPx(key, (x1 + x2) / 2, yTop);
      ctx.beginPath();
      ctx.arc(c.px, c.py, 4, Math.PI, 0);
      ctx.stroke();
    }
  }
}

/* ============================================================
   QUOTE
   ============================================================ */

function disegnaQuoteSezione(ctx, key, larghezza, H, v, stato, isAA) {
  ctx.fillStyle = COLORI.quota;
  ctx.strokeStyle = COLORI.quota;
  ctx.lineWidth = 0.6;
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';

  // Quota totale larghezza (sotto)
  const yQ = -1.5;
  const aQ = toPx(key, 0, yQ);
  const bQ = toPx(key, larghezza, yQ);
  ctx.beginPath(); ctx.moveTo(aQ.px, aQ.py); ctx.lineTo(bQ.px, bQ.py); ctx.stroke();
  taccaObliqua(aQ.px, aQ.py);
  taccaObliqua(bQ.px, bQ.py);
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText((larghezza * 100).toFixed(0), (aQ.px + bQ.px) / 2, aQ.py + 14);

  // Quota altezza (sinistra)
  const xQ = -1;
  const aH1 = toPx(key, xQ, 0);
  const aH2 = toPx(key, xQ, H);
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

  // Quote parziali campate (solo A-A)
  if (isAA) {
    const posX = getPosX(stato);
    const yQC = -3;
    for (let i = 0; i < posX.length - 1; i++) {
      const a = toPx(key, posX[i], yQC);
      const b = toPx(key, posX[i + 1], yQC);
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
      taccaObliqua(a.px, a.py);
      taccaObliqua(b.px, b.py);
      ctx.font = '9px Arial, sans-serif';
      ctx.fillText((stato.campateX.lista[i].interasse * 100).toFixed(0), (a.px + b.px) / 2, a.py - 4);
    }
    ctx.font = 'bold 10px Arial, sans-serif';
  }
}

function taccaObliqua(px, py) {
  const s = 3;
  ctx.beginPath();
  ctx.moveTo(px - s, py + s);
  ctx.lineTo(px + s, py - s);
  ctx.stroke();
}

/* ============================================================
   HELPER
   ============================================================ */

function getPosX(stato) {
  const pos = [0];
  let acc = 0;
  for (let i = 0; i < stato.campateX.numero; i++) {
    acc += stato.campateX.lista[i].interasse;
    pos.push(acc);
  }
  return pos;
}

/* ============================================================
   RESET
   ============================================================ */

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