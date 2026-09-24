// distinta.js — Computo metrico con volumi, pesi, prezzi + export CSV

import { calcolaDerivati, lunghezzaTotale, luceTrasversale } from './modello.js';
import { trovaTrave, trovaTegolo } from './catalogo.js';

const DENSITA_CLS = 2.5;

export function costruisciDistinta(stato) {
  const d = calcolaDerivati(stato);
  const tra = trovaTrave(stato.travi.banchina) || { base: 40, altezza: 60, id: 'TL' };
  const teg = trovaTegolo(stato.copertura.tegoloId) || { larghezza: 250, altezza: 12, id: 'AL' };
  const L = d.L;
  const W = d.W;
  const H = d.H;

  const listino = stato.listino || {};
  const prezzoPil = listino.pilastri || 320;
  const prezzoTra = listino.travi || 390;
  const prezzoTeg = listino.tegoli || 420;
  const prezzoPan = listino.pannelli || 350;
  const prezzoSol = listino.solaio || 300;
  const prezzoFon = listino.fondazioni || 280;
  const prezzoCop = listino.coppelle || 28;

  const righe = [];

  // 1. Fondazioni
  const volFon = d.volumi.fondazioni;
  righe.push({
    famiglia: 'Fondazioni',
    elemento: stato.pilastri.fondazione || 'bicchiere',
    tipo: '-',
    quantita: d.numPilastri,
    dimensioni: '0.90×0.90×0.80 m',
    volume: volFon,
    peso: volFon * DENSITA_CLS,
    prezzoUnit: prezzoFon,
    prezzoTot: volFon * prezzoFon
  });

  // 2. Pilastri
  const volPil = d.volumi.pilastri;
  righe.push({
    famiglia: 'Pilastri',
    elemento: 'Pilastri prefabbricati',
    tipo: 'precompresso',
    quantita: d.numPilastri,
    dimensioni: stato.pilastri.base + '×' + stato.pilastri.altezzaSezione + ' cm · h ' + H + ' m',
    volume: volPil,
    peso: volPil * DENSITA_CLS,
    prezzoUnit: prezzoPil,
    prezzoTot: volPil * prezzoPil
  });

  // 3. Travi banchina
  const volBan = d.volumi.traveBanchina;
  righe.push({
    famiglia: 'Travi',
    elemento: 'Banchina ' + (tra.id || 'TL'),
    tipo: tra.id || 'TL',
    quantita: 2,
    dimensioni: tra.base + '×' + tra.altezza + ' cm · ' + L.toFixed(2) + ' m',
    volume: volBan,
    peso: volBan * DENSITA_CLS,
    prezzoUnit: prezzoTra,
    prezzoTot: volBan * prezzoTra
  });

  // 4. Travi trasversali
  const volTrv = d.volumi.traviTrasversali;
  righe.push({
    famiglia: 'Travi',
    elemento: 'Trasversali ' + (tra.id || 'TL'),
    tipo: tra.id || 'TL',
    quantita: Number(stato.campate.numero) * 2,
    dimensioni: tra.base + '×' + tra.altezza + ' cm · ' + d.lungFalda.toFixed(2) + ' m',
    volume: volTrv,
    peso: volTrv * DENSITA_CLS,
    prezzoUnit: prezzoTra,
    prezzoTot: volTrv * prezzoTra
  });

  // 5. Tegoli
  const volTeg = d.volumi.tegoli;
  righe.push({
    famiglia: 'Copertura',
    elemento: 'Tegoli ' + (teg.id || 'AL'),
    tipo: teg.id || 'AL',
    quantita: d.numTegoli,
    dimensioni: teg.larghezza + '×' + teg.altezza + ' cm · ' + d.lungFalda.toFixed(2) + ' m',
    volume: volTeg,
    peso: volTeg * DENSITA_CLS,
    prezzoUnit: prezzoTeg,
    prezzoTot: volTeg * prezzoTeg
  });

  // 6. Coppelle
  const numCop = Math.ceil(d.numTegoli * 1.1);
  righe.push({
    famiglia: 'Copertura',
    elemento: 'Coppelle',
    tipo: stato.copertura.coppellaId || 'GRANDE',
    quantita: numCop,
    dimensioni: 'passo variabile',
    volume: 0,
    peso: numCop * 0.05,
    prezzoUnit: prezzoCop,
    prezzoTot: numCop * prezzoCop
  });

  // 7. Pannelli
  const volPan = d.volumi.pannelli;
  righe.push({
    famiglia: 'Pannelli',
    elemento: 'Tamponamento ' + (stato.pannelli.finitura || 'FV'),
    tipo: stato.pannelli.tipo || 'V',
    quantita: 4,
    dimensioni: 'sp. ' + stato.pannelli.spessore + ' cm · h ' + H + ' m',
    volume: volPan,
    peso: volPan * DENSITA_CLS,
    prezzoUnit: prezzoPan,
    prezzoTot: volPan * prezzoPan
  });

  // 8. Interpiano (opzionale)
  if (stato.generale.interpiano) {
    const volInt = d.volumi.interpiano;
    righe.push({
      famiglia: 'Solai',
      elemento: 'Interpiano',
      tipo: 'TT80',
      quantita: 1,
      dimensioni: L.toFixed(2) + '×' + W.toFixed(2) + ' m · sp. 25 cm',
      volume: volInt,
      peso: volInt * DENSITA_CLS,
      prezzoUnit: prezzoSol,
      prezzoTot: volInt * prezzoSol
    });
  }

  const volTot = righe.reduce((a, r) => a + r.volume, 0);
  const pesoTot = righe.reduce((a, r) => a + r.peso, 0);
  const prezzoTot = righe.reduce((a, r) => a + r.prezzoTot, 0);

  return {
    righe: righe,
    totali: { volume: volTot, peso: pesoTot, prezzo: prezzoTot }
  };
}

export function aggiornaDistinta(stato) {
  const risultato = costruisciDistinta(stato);
  const righe = risultato.righe;
  const totali = risultato.totali;

  const tbody = document.getElementById('distintaBody')
             || document.querySelector('#tabella-distinta tbody');
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
      '<td class="num">' + r.prezzoTot.toFixed(2) + '</td>' +
    '</tr>'
  ).join('') +
  '<tr class="totale">' +
    '<td colspan="5"><strong>TOTALE</strong></td>' +
    '<td class="num"><strong>' + totali.volume.toFixed(2) + ' m³</strong></td>' +
    '<td class="num"><strong>' + totali.peso.toFixed(2) + ' t</strong></td>' +
    '<td class="num"><strong>€ ' + totali.prezzo.toFixed(2) + '</strong></td>' +
  '</tr>';
}

export function esportaCSV(stato, nomeFile) {
  const risultato = costruisciDistinta(stato);
  const righe = risultato.righe;
  const totali = risultato.totali;
  const sep = ';';

  const lines = [
    ['Famiglia','Elemento','Tipo','Qta','Dimensioni','Volume m3','Peso t','Prezzo EUR'].join(sep)
  ];

  righe.forEach(r => {
    lines.push([
      r.famiglia,
      r.elemento,
      r.tipo,
      r.quantita,
      r.dimensioni,
      r.volume.toFixed(3).replace('.', ','),
      r.peso.toFixed(2).replace('.', ','),
      r.prezzoTot.toFixed(2).replace('.', ',')
    ].join(sep));
  });

  lines.push([
    '','','','','TOTALE',
    totali.volume.toFixed(3).replace('.', ','),
    totali.peso.toFixed(2).replace('.', ','),
    totali.prezzo.toFixed(2).replace('.', ',')
  ].join(sep));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile || 'cacem-distinta.csv';
  a.click();
  URL.revokeObjectURL(url);
}