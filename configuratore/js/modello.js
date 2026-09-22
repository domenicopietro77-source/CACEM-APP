// modello.js — Definizione dello stato del configuratore e utilità di calcolo

export const DEFAULT_STATO = {
  dimensioni: {
    lunghezza: 60,
    larghezza: 30,
    altezzaPilastro: 6,
    pendenzaCopertura: 5,
    numeroCampate: 4,
    interasseCampate: 15,
    numeroPilastriPerFila: 5,
  },
  elementi: {
    sezionePilastro: '40x40',
    tipoTrave: 'aT',
    spessorePannello: 20,
  },
  meta: { versione: '0.2', timestamp: null },
};

export function statoDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_STATO));
}

export function clonaStato(stato) {
  return JSON.parse(JSON.stringify(stato));
}

export function parseSezione(sezione) {
  const [l, h] = sezione.split('x').map(v => parseInt(v, 10) / 100);
  return { l, h };
}

export function calcolaDerivati(stato) {
  const d = stato.dimensioni;
  const e = stato.elementi;
  const superficieCoperta = d.lunghezza * d.larghezza;
  const altezzaTotale = d.altezzaPilastro + (d.larghezza / 2) * (d.pendenzaCopertura / 100);
  const numPilastri = d.numeroPilastriPerFila * 2 * d.numeroCampate;
  const sezione = parseSezione(e.sezionePilastro);
  const volumePilastroSingolo = sezione.l * sezione.h * d.altezzaPilastro;
  const volumePilastri = volumePilastroSingolo * numPilastri;

  const lunghezzaTraveColmo = d.lunghezza;
  const altezzaTrave = 0.8;
  const baseTrave = 0.5;
  const numTraviTrasversali = (d.numeroCampate + 1) * 2;
  const lunghezzaTraveTrasversale = d.larghezza / 2;
  const volumeTraveColmo = lunghezzaTraveColmo * baseTrave * altezzaTrave;
  const volumeTraviTrasversali = numTraviTrasversali * lunghezzaTraveTrasversale * baseTrave * altezzaTrave;
  const volumeTravi = volumeTraveColmo + volumeTraviTrasversali;

  const perimetro = 2 * (d.lunghezza + d.larghezza);
  const spessorePannelloM = e.spessorePannello / 100;
  const volumePannelli = perimetro * d.altezzaPilastro * spessorePannelloM;

  const spessoreCoperturaM = 0.25;
  const lunghezzaFalda = Math.sqrt((d.larghezza / 2) ** 2 + ((d.larghezza / 2) * (d.pendenzaCopertura / 100)) ** 2);
  const superficieCopertura = 2 * d.lunghezza * lunghezzaFalda;
  const volumeCopertura = superficieCopertura * spessoreCoperturaM;

  const volumeTotale = volumePilastri + volumeTravi + volumePannelli + volumeCopertura;
  const densitaCalcestruzzo = 2.5;
  const pesoStimato = volumeTotale * densitaCalcestruzzo;

  const distinta = [
    { elemento: 'Pilastri', quantita: numPilastri, dimensioni: `${e.sezionePilastro} cm × ${d.altezzaPilastro} m`, volume: volumePilastri, peso: volumePilastri * densitaCalcestruzzo },
    { elemento: 'Trave di colmo', quantita: 1, dimensioni: `${baseTrave * 100}×${altezzaTrave * 100} cm × ${lunghezzaTraveColmo} m`, volume: volumeTraveColmo, peso: volumeTraveColmo * densitaCalcestruzzo },
    { elemento: 'Travi trasversali', quantita: numTraviTrasversali, dimensioni: `${baseTrave * 100}×${altezzaTrave * 100} cm × ${lunghezzaTraveTrasversale} m`, volume: volumeTraviTrasversali, peso: volumeTraviTrasversali * densitaCalcestruzzo },
    { elemento: 'Pannelli tamponamento', quantita: 1, dimensioni: `sp. ${e.spessorePannello} cm · h ${d.altezzaPilastro} m`, volume: volumePannelli, peso: volumePannelli * densitaCalcestruzzo },
    { elemento: 'Copertura', quantita: 1, dimensioni: `sp. 25 cm · sup. ${superficieCopertura.toFixed(1)} m²`, volume: volumeCopertura, peso: volumeCopertura * densitaCalcestruzzo },
  ];

  return { superficieCoperta, altezzaTotale, numPilastri, volumeTotale, pesoStimato, distinta };
}

export function salvaStato(stato, chiave = 'cacem-stato') {
  const copia = clonaStato(stato);
  copia.meta.timestamp = new Date().toISOString();
  localStorage.setItem(chiave, JSON.stringify(copia));
  return copia;
}

export function caricaStato(chiave = 'cacem-stato') {
  const raw = localStorage.getItem(chiave);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.dimensioni || !parsed.elementi) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cancellaStato(chiave = 'cacem-stato') {
  localStorage.removeItem(chiave);
}

export function esportaJSON(stato, nomeFile = 'cacem-progetto.json') {
  const blob = new Blob([JSON.stringify(stato, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function importaJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = ev => {
      const file = ev.target.files[0];
      if (!file) return reject(new Error('Nessun file selezionato'));
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.dimensioni || !parsed.elementi) return reject(new Error('Formato non valido'));
          resolve(parsed);
        } catch (err) { reject(err); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
