// modello.js — Stato capannone CACEM v9 (logica misure esterne → interne)

import { trovaTrave, trovaTegolo } from './catalogo.js';

const CHIAVE = 'cacem-stato-v9';

export function statoDefault() {
  return {
    commessa: {
      id: null,
      nome: 'Nuova commessa',
      dataCreazione: null,
      dataModifica: null
    },

    misureEsterne: {
      lunghezza: 60,
      larghezza: 30,
      spessorePannello: 20,
      tolleranza: 1,
      spessoreTotale: 21
    },

    misureInterne: {
      lunghezza: 59.58,
      larghezza: 29.58
    },

    altezze: {
      impostaPannello: -0.10,
      estradossoPannello: 6.20,
      altezzaPilastro: 6.30,
      moduloPannelloVert: 450,
      finestraPiccola: 250,
      portaPiccola: 220
    },

    pilastri: {
      numColonneX: 4,
      numFileY: 5,
      autoFileY: true,
      interasseMaxY: 6.30,
      base: 70,
      altezzaSezione: 70,
      pluviale: true,
      pluvialeDiametro: 160,
      tipoFondazione: 'bicchiere',
      tipoBicchiere: 'bicchiere_laterale'
    },

    campateX: {
      auto: true,
      numero: 3,
      maxLuceTegolo: 25,
      lista: [
        { id: 1, interasse: 19.86 },
        { id: 2, interasse: 19.86 },
        { id: 3, interasse: 19.86 }
      ]
    },

    traviTU: {
      tipo: 'TU',
      base: 70,
      altezza: 80,
      segmenti: []
    },

    traviTI: {
      attive: true,
      tipo: 'TI',
      base: 50,
      altezza: 90,
      segmenti: []
    },

    copertura: {
      tipo: 'AL',
      tegolo: { id: 'AL', larghezza: 256, altezza: 88, basePiana: 65, spessore: 3 },
      coppella: { id: 'LAMIERA', tipo: 'lamiera', larghezza: 1000, altezza: 40 },
      pendenza: 5,
      file: []
    },

    pannelli: {
      spessore: 20,
      finitura: 'FV',
      granigliaTipo: 2,
      coloriGraniglia: ['#d9d2c5', '#b8b0a0'],
      percentualiGraniglia: [70, 30],
      moduloStandard: 255,
      lati: {
        sud:   { attivo: true, tipo: 'V', moduli: [], aperture: [] },
        est:   { attivo: true, tipo: 'V', moduli: [], aperture: [] },
        nord:  { attivo: true, tipo: 'V', moduli: [], aperture: [] },
        ovest: { attivo: true, tipo: 'V', moduli: [], aperture: [] }
      }
    },

    interpiano: { attivo: false, numLivelli: 1, h1: 4, h2: 4, tipoSolaio: 'TT80' },
    carroponte: { attivo: false, portata: 10, altezzaEstradosso: 5 },

    ancoraggi: {
      pannelloTrave: { tipo: 'halfen-baionetta', minFissaggi: 2, resistenza: 950 },
      traveTUPilastro: { tipo: 'm24-boccola-neoprene' },
      traveTIPilastro: { tipo: 'm24-boccola-neoprene' },
      tegoloALTrave: { tipo: 'scat-fisher-neoprene' }
    },

    grafica: {
      stile: 'autocad-bn',
      unitaLunghezze: 'cm',
      unitaLivelli: 'm',
      fontTitoli: 'italic-serif'
    },

    listino: {
      fondazioni: 280,
      pilastri: 320,
      traviTU: 390,
      traviTI: 400,
      tegoli: 420,
      pannelli: 350,
      solaio: 300,
      coppelle: 28,
      graniglia: 15
    },

    meta: { versione: '9.0', timestamp: null }
  };
}

export function clonaStato(s) { return JSON.parse(JSON.stringify(s)); }

export function calcolaTolleranza(sp) {
  return Number(sp) === 28 ? 2 : 1;
}

export function calcolaMisureInterne(stato) {
  const me = stato.misureEsterne;
  const toll = calcolaTolleranza(me.spessorePannello);
  const spTot = Number(me.spessorePannello) + toll;
  const spM = spTot / 100;
  me.tolleranza = toll;
  me.spessoreTotale = spTot;
  stato.misureInterne.lunghezza = Math.round((me.lunghezza - spM * 2) * 1000) / 1000;
  stato.misureInterne.larghezza = Math.round((me.larghezza - spM * 2) * 1000) / 1000;
  return stato.misureInterne;
}

export function lunghezzaTotale(stato) {
  return stato.campateX.lista.reduce((a, c) => a + Number(c.interasse), 0);
}

export function luceTrasversale(stato) {
  return stato.misureInterne.larghezza;
}

export function dividiCampateX(stato) {
  const mi = stato.misureInterne;
  let n = stato.campateX.numero;
  if (stato.campateX.auto) {
    n = Math.ceil(mi.lunghezza / stato.campateX.maxLuceTegolo);
    if (n < 1) n = 1;
    stato.campateX.numero = n;
  }
  const inter = mi.lunghezza / n;
  stato.campateX.lista = [];
  for (let i = 0; i < n; i++) {
    stato.campateX.lista.push({ id: i + 1, interasse: Math.round(inter * 1000) / 1000 });
  }
  return stato.campateX.lista;
}

export function calcolaFileY(stato) {
  if (!stato.pilastri.autoFileY) return stato.pilastri.numFileY;
  const W = stato.misureInterne.larghezza;
  const max = stato.pilastri.interasseMaxY;
  let n = Math.ceil(W / max) + 1;
  if (n < 2) n = 2;
  stato.pilastri.numFileY = n;
  return n;
}

export function calcolaTraviTU(stato) {
  const W = stato.misureInterne.larghezza;
  const n = stato.campateX.numero;
  const segs = [];
  [{ lato: 'ovest', y: 0 }, { lato: 'est', y: W }].forEach(cfg => {
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const inter = stato.campateX.lista[i].interasse;
      segs.push({
        id: 'TU-' + (cfg.lato === 'ovest' ? 'O' : 'E') + (i + 1),
        lato: cfg.lato, y: cfg.y,
        x1: acc, x2: acc + inter, lunghezza: inter
      });
      acc += inter;
    }
  });
  stato.traviTU.segmenti = segs;
  return segs;
}

export function calcolaTraviTI(stato) {
  if (!stato.traviTI.attive) { stato.traviTI.segmenti = []; return []; }
  const W = stato.misureInterne.larghezza;
  const n = stato.campateX.numero;
  const numFile = stato.pilastri.numFileY;
  const segs = [];
  for (let k = 1; k < numFile - 1; k++) {
    const y = (k * W) / (numFile - 1);
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const inter = stato.campateX.lista[i].interasse;
      segs.push({
        id: 'TI' + k + '-' + (i + 1),
        fila: k, y: y,
        x1: acc, x2: acc + inter, lunghezza: inter
      });
      acc += inter;
    }
  }
  stato.traviTI.segmenti = segs;
  return segs;
}

export function calcolaTegoli(stato) {
  const W = stato.misureInterne.larghezza;
  const L = stato.misureInterne.lunghezza;
  const largTeg = stato.copertura.tegolo.larghezza / 100;
  const numFile = Math.ceil(W / largTeg);
  const file = [];
  for (let i = 0; i < numFile; i++) {
    const y1 = i * largTeg;
    const y2 = Math.min((i + 1) * largTeg, W);
    file.push({
      id: 'AL' + (i + 1),
      y1: y1, y2: y2,
      larghezza: y2 - y1, lunghezza: L,
      halfen: 7, scat: 4
    });
  }
  stato.copertura.file = file;
  return file;
}

export function generaModuliPannelli(lunghezzaLato, moduloStd) {
  const modM = moduloStd / 100;
  const bordo = 0.21;
  const disponibile = lunghezzaLato - bordo * 2;
  const nMod = Math.max(1, Math.floor(disponibile / modM));
  const moduli = [{ id: 'B1', larghezza: 21, tipo: 'bordo' }];
  for (let i = 0; i < nMod; i++) {
    moduli.push({ id: 'M' + (i + 1), larghezza: moduloStd, tipo: 'standard' });
  }
  moduli.push({ id: 'B2', larghezza: 21, tipo: 'bordo' });
  return moduli;
}

export function calcolaDerivati(stato) {
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro;
  const numFile = stato.pilastri.numFileY;
  const numPerFila = stato.campateX.numero + 1;
  const numPilastri = numPerFila * numFile;

  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const volPil = baseP * altP * H * numPilastri;

  const segsTU = stato.traviTU.segmenti || [];
  const tuB = stato.traviTU.base / 100;
  const tuA = stato.traviTU.altezza / 100;
  const volTU = segsTU.reduce((s, x) => s + x.lunghezza, 0) * tuB * tuA;

  const segsTI = stato.traviTI.segmenti || [];
  const tiB = stato.traviTI.base / 100;
  const tiA = stato.traviTI.altezza / 100;
  const volTI = segsTI.reduce((s, x) => s + x.lunghezza, 0) * tiB * tiA;

  const tegH = stato.copertura.tegolo.altezza / 100;
  const file = stato.copertura.file || [];
  const volTeg = file.reduce((s, f) => s + f.larghezza * f.lunghezza, 0) * tegH;

  const spPann = stato.pannelli.spessore / 100;
  const perimetro = 2 * (L + W);
  const volPan = perimetro * H * spPann;

  const largFond = Math.max(baseP * 1.8, 0.8);
  const volFond = largFond * largFond * 0.8 * numPilastri;

  const volTot = volPil + volTU + volTI + volTeg + volPan + volFond;
  const peso = volTot * 2.5;

  return {
    L: L, W: W, H: H,
    numPilastri: numPilastri,
    numPerFila: numPerFila,
    numFile: numFile,
    superficieCoperta: L * W,
    volumeTotale: volTot,
    pesoStimato: peso,
    volumi: {
      pilastri: volPil,
      traviTU: volTU,
      traviTI: volTI,
      tegoli: volTeg,
      pannelli: volPan,
      fondazioni: volFond,
      totale: volTot
    }
  };
}

export function salvaStato(s) {
  const copia = clonaStato(s);
  copia.meta.timestamp = new Date().toISOString();
  localStorage.setItem(CHIAVE, JSON.stringify(copia));
  return copia;
}

export function caricaStato() {
  const raw = localStorage.getItem(CHIAVE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function cancellaStato() {
  localStorage.removeItem(CHIAVE);
}

export function esportaJSON(s) {
  return JSON.stringify(s, null, 2);
}