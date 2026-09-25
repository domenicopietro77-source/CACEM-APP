// export.js — Export DXF pianta, prospetti, sezioni

import { lunghezzaTotale, luceTrasversale } from './modello.js';

function getDXF() { return window.DXF; }

function scaricaBlob(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}

export function esportaPiantaDXF(stato) {
  const DXF = getDXF();
  if (!DXF) { alert('Libreria DXF non disponibile'); return; }

  const d = new DXF.Drawing();
  d.addLayer('CONTORNO', DXF.colors.Blue);
  d.addLayer('PILASTRI', DXF.colors.White);
  d.addLayer('ASSI', DXF.colors.Grey);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const numFileY = stato.pilastri.numFileY;

  d.setActiveLayer('CONTORNO');
  d.drawLine(0, 0, L, 0);
  d.drawLine(L, 0, L, W);
  d.drawLine(L, W, 0, W);
  d.drawLine(0, W, 0, 0);

  d.setActiveLayer('PILASTRI');
  const posX = [0];
  let acc = 0;
  for (let i = 0; i < stato.campateX.numero; i++) {
    acc += stato.campateX.lista[i].interasse;
    posX.push(acc);
  }

  posX.forEach(x => {
    for (let k = 0; k < numFileY; k++) {
      const y = (k * W) / (numFileY - 1);
      const x1 = x - baseP / 2, y1 = y - altP / 2;
      const x2 = x + baseP / 2, y2 = y + altP / 2;
      d.drawLine(x1, y1, x2, y1);
      d.drawLine(x2, y1, x2, y2);
      d.drawLine(x2, y2, x1, y2);
      d.drawLine(x1, y2, x1, y1);
    }
  });

  d.setActiveLayer('ASSI');
  posX.forEach(x => d.drawLine(x, -1, x, W + 1));

  scaricaBlob(new Blob([d.toDxfString()], { type: 'application/dxf' }), 'cacem-pianta.dxf');
}

export function esportaSezioniDXF(stato) {
  const DXF = getDXF();
  if (!DXF) { alert('Libreria DXF non disponibile'); return; }

  const d = new DXF.Drawing();
  d.addLayer('SEZIONI', DXF.colors.White);

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro;

  // A-A
  const oAA = 0;
  d.drawLine(0, oAA, L, oAA);
  d.drawLine(L, oAA, L, oAA + H);
  d.drawLine(L, oAA + H, 0, oAA + H);
  d.drawLine(0, oAA + H, 0, oAA);

  // B-B
  const oBB = H + 4;
  d.drawLine(0, oBB, W, oBB);
  d.drawLine(W, oBB, W, oBB + H);
  d.drawLine(W, oBB + H, 0, oBB + H);
  d.drawLine(0, oBB + H, 0, oBB);

  scaricaBlob(new Blob([d.toDxfString()], { type: 'application/dxf' }), 'cacem-sezioni.dxf');
}

export function esportaJSON(stato) {
  const blob = new Blob([JSON.stringify(stato, null, 2)], { type: 'application/json' });
  scaricaBlob(blob, 'cacem-progetto.json');
}
