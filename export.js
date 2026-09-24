// export.js — Esportazione DXF di pianta, prospetti, sezioni

import { lunghezzaTotale, luceTrasversale, classificaPilastri } from './modello.js';

function getDXF() {
  return window.DXF;
}

function scaricaBlob(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}

export function esportaPiantaDXF(stato, nomeFile) {
  const DXF = getDXF();
  if (!DXF) { console.warn('DXF library non disponibile'); return; }

  const d = new DXF.Drawing();
  d.addLayer('CONTORNO', DXF.colors.Blue);
  d.addLayer('PILASTRI', DXF.colors.White);
  d.addLayer('ASSI', DXF.colors.Grey);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;

  // Contorno
  d.setActiveLayer('CONTORNO');
  d.drawLine(0, 0, L, 0);
  d.drawLine(L, 0, L, W);
  d.drawLine(L, W, 0, W);
  d.drawLine(0, W, 0, 0);

  // Pilastri
  d.setActiveLayer('PILASTRI');
  const classif = classificaPilastri(stato);
  classif.pilastri.forEach(p => {
    const x1 = p.x - baseP / 2;
    const y1 = p.y - altP / 2;
    const x2 = p.x + baseP / 2;
    const y2 = p.y + altP / 2;
    d.drawLine(x1, y1, x2, y1);
    d.drawLine(x2, y1, x2, y2);
    d.drawLine(x2, y2, x1, y2);
    d.drawLine(x1, y2, x1, y1);
  });

  // Assi
  d.setActiveLayer('ASSI');
  const posX = posizioniX(stato);
  posX.forEach(x => {
    d.drawLine(x, -1, x, W + 1);
  });

  const blob = new Blob([d.toDxfString()], { type: 'application/dxf' });
  scaricaBlob(blob, nomeFile || 'cacem-pianta.dxf');
}

export function esportaProspettiDXF(stato, nomeFile) {
  const DXF = getDXF();
  if (!DXF) { console.warn('DXF library non disponibile'); return; }

  const d = new DXF.Drawing();
  d.addLayer('PROSPETTI', DXF.colors.White);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;
  const baseP = stato.pilastri.base / 100;

  const altezzaSlot = Hcolmo + 3;
  const posX = posizioniX(stato);

  for (let n = 1; n <= 4; n++) {
    const isLungo = (n === 1 || n === 3);
    const larg = isLungo ? L : W;
    const offsetY = -(n - 1) * altezzaSlot;

    // Contorno
    d.drawLine(0, offsetY, larg, offsetY);
    d.drawLine(larg, offsetY, larg, offsetY + H);
    d.drawLine(larg, offsetY + H, 0, offsetY + H);
    d.drawLine(0, offsetY + H, 0, offsetY);

    // Copertura
    d.drawLine(0, offsetY + H, larg / 2, offsetY + Hcolmo);
    d.drawLine(larg / 2, offsetY + Hcolmo, larg, offsetY + H);

    // Pilastri
    if (isLungo) {
      posX.forEach(x => {
        d.drawLine(x - baseP / 2, offsetY, x + baseP / 2, offsetY);
        d.drawLine(x + baseP / 2, offsetY, x + baseP / 2, offsetY + H);
        d.drawLine(x + baseP / 2, offsetY + H, x - baseP / 2, offsetY + H);
        d.drawLine(x - baseP / 2, offsetY + H, x - baseP / 2, offsetY);
      });
    } else {
      [0, larg].forEach(x => {
        d.drawLine(x - baseP / 2, offsetY, x + baseP / 2, offsetY);
        d.drawLine(x + baseP / 2, offsetY, x + baseP / 2, offsetY + H);
        d.drawLine(x + baseP / 2, offsetY + H, x - baseP / 2, offsetY + H);
        d.drawLine(x - baseP / 2, offsetY + H, x - baseP / 2, offsetY);
      });
    }
  }

  const blob = new Blob([d.toDxfString()], { type: 'application/dxf' });
  scaricaBlob(blob, nomeFile || 'cacem-prospetti.dxf');
}

export function esportaSezioniDXF(stato, nomeFile) {
  const DXF = getDXF();
  if (!DXF) { console.warn('DXF library non disponibile'); return; }

  const d = new DXF.Drawing();
  d.addLayer('SEZIONI', DXF.colors.White);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.generale.altezzaPilastro;
  const pendenza = stato.generale.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  // Sezione A-A (in basso)
  const offsetAA = 0;
  d.drawLine(0, offsetAA, L, offsetAA);
  d.drawLine(L, offsetAA, L, offsetAA + H);
  d.drawLine(L, offsetAA + H, 0, offsetAA + H);
  d.drawLine(0, offsetAA + H, 0, offsetAA);
  d.drawLine(0, offsetAA + H, L / 2, offsetAA + Hcolmo);
  d.drawLine(L / 2, offsetAA + Hcolmo, L, offsetAA + H);

  // Sezione B-B (in alto)
  const offsetBB = Hcolmo + 4;
  d.drawLine(0, offsetBB, W, offsetBB);
  d.drawLine(W, offsetBB, W, offsetBB + H);
  d.drawLine(W, offsetBB + H, 0, offsetBB + H);
  d.drawLine(0, offsetBB + H, 0, offsetBB);
  d.drawLine(0, offsetBB + H, W / 2, offsetBB + Hcolmo);
  d.drawLine(W / 2, offsetBB + Hcolmo, W, offsetBB + H);

  const blob = new Blob([d.toDxfString()], { type: 'application/dxf' });
  scaricaBlob(blob, nomeFile || 'cacem-sezioni.dxf');
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