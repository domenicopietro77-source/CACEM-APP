// distinta.js — Computo metrico con volumi, pesi, prezzi

import { calcolaDerivati, lunghezzaTotale, luceTrasversale } from './modello.js';

const DENSITA_CLS = 2.5;

export function costruisciDistinta(stato) {
  const d = calcolaDerivati(stato);
  const L = d.L;
  const W = d.W;
  const H = d.H;
  const listino = stato.listino || {};

  const righe = [];

  // 1. Fondazioni
  const volFon = d.volumi.fondazioni;
  righe.push({
    famiglia: 'Fondazioni',
    elemento: stato.pilastri.tipoFondazione || 'bicchiere',
    tipo: stato.pilastri.tipoBicchiere || '-',
    quantita: d.numPilastri,
    dimensioni: '0.90×0.90×0.80 m',
    volume: volFon,
    peso: volFon * DENSITA_CLS,
    prezzo: volFon * (listino.fondazioni || 280)
  });

  // 2. Pilastri
  const volPil = d.volumi.pilastri;
  righe.push({
    famiglia: 'Pilastri',
    elemento: 'Pilastri prefabbricati',
    tipo: stato.pilastri.base + '×' + stato.pilastri.altezzaSezione,
    quantita: d.numPilastri,
    dimensioni: stato.pilastri.base + '×' + stato.pilastri.altezzaSezione + ' cm · h ' + H + ' m',
    volume: volPil,
    peso: volPil * DENSITA_CLS,
    prezzo: volPil * (listino.pilastri || 320)
  });

  // 3. Travi TU
  const volTU = d.volumi.traviTU;
  righe.push({
    famiglia: 'Travi',
    elemento: 'Travi banchina TU',
    tipo: 'TU',
    quantita: (stato.traviTU.segmenti || []).length,
    dimensioni: stato.traviTU.base + '×' + stato.traviTU.altezza + ' cm',
    volume: volTU,
    peso: volTU * DENSITA_CLS,
    prezzo: volTU * (listino.traviTU || 390)
  });

  // 4. Travi TI
  const volTI = d.volumi.traviTI;
  if (volTI > 0) {
    righe.push({
      famiglia: 'Travi',
      elemento: 'Travi interne TI',
      tipo: 'TI',
      quantita: (stato.traviTI.segmenti || []).length,
      dimensioni: stato.traviTI.base + '×' + stato.traviTI.altezza + ' cm',
      volume: volTI,
      peso: volTI * DENSITA_CLS,
      prezzo: volTI * (listino.traviTI || 400)
    });
  }

  // 5. Tegoli AL
  const volTeg = d.volumi.tegoli;
  righe.push({
    famiglia: 'Copertura',
    elemento: 'Tegoli AL',
    tipo: 'AL',
    quantita: (stato.copertura.file || []).length,
    dimensioni: stato.copertura.tegolo.larghezza + '×' + stato.copertura.tegolo.altezza + ' cm',
    volume: volTeg,
    peso: volTeg * DENSITA_CLS,
    prezzo: volTeg * (listino.tegoli || 420)
  });

  // 6. Coppelle
  const numCop = Math.ceil((stato.copertura.file || []).length * 1.1);
  righe.push({
    famiglia: 'Copertura',
    elemento: 'Coppelle',
    tipo: stato.copertura.coppella.id || 'LAMIERA',
    quantita: numCop,
    dimensioni: 'passo variabile',
    volume: 0,
    peso: numCop * 0.05,
    prezzo: numCop * (listino.coppelle || 28)
  });

  // 7. Pannelli tamponamento
  const volPan = d.volumi.pannelli;
  righe.push({
    famiglia: 'Pannelli',
    elemento: 'Tamponamento ' + (stato.pannelli.finitura || 'FV'),
    tipo: stato.pannelli.spessore + ' cm',
    quantita: 4,
    dimensioni: 'sp. ' + stato.pannelli.spessore + ' cm · h ' + H + ' m',
    volume: volPan,
    peso: volPan * DENSITA_CLS,
    prezzo: volPan * (listino.pannelli || 350)
  });

  // 8. Interpiano (opzionale)
  if (stato.interpiano.attivo) {
    const volInt = L * W * 0.25;
    righe.push({
      famiglia: 'Solai',
      elemento: 'Interpiano',
      tipo: stato.interpiano.tipoSolaio || 'TT80',
      quantita: 1,
      dimensioni: L.toFixed(2) + '×' + W.toFixed(2) + ' m · sp. 25 cm',
      volume: volInt,
      peso: volInt * DENSITA_CLS,
      prezzo: volInt * (listino.solaio || 300)
    });
  }

  const volTot = righe.reduce((a, r) => a + r.volume, 0);
  const pesoTot = righe.reduce((a, r) => a + r.peso, 0);
  const prezzoTot = righe.reduce((a, r) => a + r.prezzo, 0);

  return { righe, totali: { volume: volTot, peso: pesoTot, prezzo: prezzoTot } };
}

export function aggiornaDistinta(stato) {
  const { righe, totali } = costruisciDistinta(stato);
  const tbody = document.getElementById('distintaBody');
  if (!tbody) return;

  tbody.innerHTML = righe.map(r =>
    '<tr>' +
      '<td>' + r.famiglia + '</td>' +
      '<td>' + r.elemento + '</td>' +
      '<td>' + r.tipo + '</td>' +
      '<td>' + r.quantita + '</td>' +
      '<td>' + r.dimensioni + '</td>' +
      '<td class="num">' + r.volume.toFixed(2) + '</td>' +
      '<td class="num">' + r.peso.toFixed(2) + '</td>' +
      '<td class="num">€ ' + r.prezzo.toFixed(2) + '</td>' +
    '</tr>'
  ).join('') +
  '<tr class="totale">' +
    '<td colspan="5"><strong>TOTALE</strong></td>' +
    '<td class="num"><strong>' + totali.volume.toFixed(2) + ' m³</strong></td>' +
    '<td class="num"><strong>' + totali.peso.toFixed(2) + ' t</strong></td>' +
    '<td class="num"><strong>€ ' + totali.prezzo.toFixed(2) + '</strong></td>' +
  '</tr>';
}

export function esportaCSV(stato) {
  const { righe, totali } = costruisciDistinta(stato);
  const sep = ';';
  const lines = [
    ['Famiglia','Elemento','Tipo','Qtà','Dimensioni','Volume m³','Peso t','Prezzo €'].join(sep),
    ...righe.map(r => [
      r.famiglia, r.elemento, r.tipo, r.quantita, r.dimensioni,
      r.volume.toFixed(3).replace('.', ','),
      r.peso.toFixed(2).replace('.', ','),
      r.prezzo.toFixed(2).replace('.', ',')
    ].join(sep)),
    ['','','','','TOTALE',
      totali.volume.toFixed(3).replace('.', ','),
      totali.peso.toFixed(2).replace('.', ','),
      totali.prezzo.toFixed(2).replace('.', ',')
    ].join(sep)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cacem-distinta.csv';
  a.click();
  URL.revokeObjectURL(url);
}
