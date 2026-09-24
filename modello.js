// modello.js — Stato capannone + logica misure esterne → interne

import { trovaTrave, trovaTegolo } from './catalogo.js';

const CHIAVE = 'cacem-stato-v7';

/**
 * Stato di default.
 */
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
    campate: {
      verso: 'X',
      numero: 4,
      interasse: 14.895,
      lista: [
        { id: 1, interasse: 14.895 },
        { id: 2, interasse: 14.895 },
        { id: 3, interasse: 14.895 },
        { id: 4, interasse: 14.895 }
      ]
    },
    copertura: {
      tipo: 'AL',
      tegoloId: 'AL'
    },
    travi: {
      banchina: 'TL',
      trasversale: 'TD'
    },
    generale: {
      altezzaPilastro: 6,
      pendenzaCopertura: 5,
      interpiano: false,
      altezzaInterpiano: 4,
      carroponte: false,
      portataCarroponte: 10,
      edificioEsistente: null
    },
    pilastri: {
      base: 40,
      altezzaSezione: 40,
      pluviale: true,
      pluvialeDiametro: 100,
      fondazione: 'bicchiere_pluviale'
    },
    listino: {
      fondazioni: 280,
      pilastri: 320,
      travi: 390,
      tegoli: 420,
      pannelli: 350,
      solaio: 300,
      coppelle: 28
    },
    pannelli: {
      tipo: 'V',
      spessore: 20,
      finitura: 'FV',
      coloriGraniglia: ['#d9d2c5', '#b8b0a0'],
      percentualiGraniglia: [70, 30],
      lati: {
        sud:   { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        est:   { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        nord:  { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        ovest: { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] }
      }
    },
    meta: {
      versione: '7.0',
      timestamp: null
    }
  };
}

/**
 * Clona stato in modo profondo.
 */
export function clonaStato(s) {
  return JSON.parse(JSON.stringify(s));
}

/**
 * Calcola la tolleranza in base allo spessore pannello:
 * - 20 cm → 1 cm
 * - 24 cm → 1 cm
 * - 28 cm → 2 cm
 */
export function calcolaTolleranza(spessorePannello) {
  if (Number(spessorePannello) === 28) return 2;
  return 1;
}

/**
 * Calcola le misure interne dall'esterno e dai pannelli.
 * Modifica lo stato in-place e ritorna le misure interne.
 */
export function calcolaMisureInterne(stato) {
  const me = stato.misureEsterne;
  const tolleranza = calcolaTolleranza(me.spessorePannello);
  const spessoreTotale = Number(me.spessorePannello) + tolleranza;
  const spessoreTotaleM = spessoreTotale / 100;

  const lunghezzaInterna = Number(me.lunghezza) - (spessoreTotaleM * 2);
  const larghezzaInterna = Number(me.larghezza) - (spessoreTotaleM * 2);

  me.tolleranza = tolleranza;
  me.spessoreTotale = spessoreTotale;

  stato.misureInterne.lunghezza = Math.round(lunghezzaInterna * 1000) / 1000;
  stato.misureInterne.larghezza = Math.round(larghezzaInterna * 1000) / 1000;

  return stato.misureInterne;
}

/**
 * Calcola l'interasse delle campate in base al verso.
 */
export function calcolaInterasse(stato) {
  const mi = stato.misureInterne;
  const c = stato.campate;
  const dimensione = c.verso === 'Y' ? mi.larghezza : mi.lunghezza;
  const interasse = dimensione / Number(c.numero);

  c.interasse = Math.round(interasse * 1000) / 1000;
  c.lista = [];
  for (let i = 0; i < Number(c.numero); i++) {
    c.lista.push({ id: i + 1, interasse: c.interasse });
  }

  return c.interasse;
}

/**
 * Lunghezza totale del capannone lungo l'asse delle campate.
 */
export function lunghezzaTotale(stato) {
  return stato.campate.lista.reduce((a, c) => a + Number(c.interasse || 0), 0);
}

/**
 * Luce trasversale (larghezza dell'arcareccio).
 */
export function luceTrasversale(stato) {
  return stato.campate.verso === 'Y'
    ? stato.misureInterne.lunghezza
    : stato.misureInterne.larghezza;
}

/**
 * Calcolo derivati: geometria, volumi, pesi.
 */
export function calcolaDerivati(stato) {
  const g = stato.generale;
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = g.altezzaPilastro;
  const salita = (W / 2) * (g.pendenzaCopertura / 100);
  const Hcolmo = H + salita;

  const numPerFila = Number(stato.campate.numero) + 1;
  const numPilastri = numPerFila * 2;

  const baseP = (stato.pilastri.base || 40) / 100;
  const altP = (stato.pilastri.altezzaSezione || 40) / 100;
  const volPilastri = baseP * altP * H * numPilastri;

  const tra = trovaTrave(stato.travi.banchina) || { base: 40, altezza: 60 };
  const altTraveM = (tra.altezza || 60) / 100;
  const baseTraveM = (tra.base || 40) / 100;
  const volTraveBanchina = L * baseTraveM * altTraveM * 2;

  const lungFalda = Math.sqrt(Math.pow(W / 2, 2) + Math.pow(salita, 2));
  const numTraviTrasv = Number(stato.campate.numero) * 2;
  const volTraviTrasv = lungFalda * baseTraveM * altTraveM * numTraviTrasv;

  const teg = trovaTegolo(stato.copertura.tegoloId) || { larghezza: 250, altezza: 12 };
  const numTegoliPerFalda = Math.ceil(L / ((teg.larghezza || 250) / 100));
  const numTegoli = numTegoliPerFalda * 2;
  const volTegoli = ((teg.larghezza || 250) / 100) * ((teg.altezza || 12) / 100) * lungFalda * numTegoli;

  const spPannM = stato.pannelli.spessore / 100;
  const perimetro = 2 * (L + W);
  const volPannelli = perimetro * H * spPannM;

  let volInterpiano = 0;
  if (g.interpiano) volInterpiano = L * W * 0.25;

  const largFond = Math.max(baseP * 1.8, 0.8);
  const volFondazioni = largFond * largFond * 0.8 * numPilastri;

  const volTotale = volPilastri + volTraveBanchina + volTraviTrasv +
                    volTegoli + volPannelli + volInterpiano + volFondazioni;
  const pesoStimato = volTotale * 2.5;

  return {
    L: L, W: W, H: H, Hcolmo: Hcolmo, salita: salita,
    numPilastri: numPilastri,
    numPerFila: numPerFila,
    numTegoli: numTegoli,
    lungFalda: lungFalda,
    superficieCoperta: L * W,
    volumeTotale: volTotale,
    pesoStimato: pesoStimato,
    volumi: {
      pilastri: volPilastri,
      traveBanchina: volTraveBanchina,
      traviTrasversali: volTraviTrasv,
      tegoli: volTegoli,
      pannelli: volPannelli,
      interpiano: volInterpiano,
      fondazioni: volFondazioni,
      totale: volTotale
    }
  };
}

/**
 * Classifica i pilastri in sigle PP1, PP2, PP3...
 * Pilastri con stesse caratteristiche → stesso PP.
 */
export function classificaPilastri(stato) {
  const W = stato.misureInterne.larghezza;
  const c = stato.campate;
  const pilastri = [];

  const car = (tipoPos) => JSON.stringify({
    posizione: tipoPos,
    pluviale: tipoPos === 'angolo' ? stato.pilastri.pluviale : false,
    fondazione: tipoPos === 'angolo' ? stato.pilastri.fondazione : 'bicchiere_centrale',
    mensole: (stato.generale.carroponte && tipoPos === 'intermedio_lungo') ? 'carroponte' : 'nessuna',
    sezione: stato.pilastri.base + 'x' + stato.pilastri.altezzaSezione
  });

  const mappa = new Map();
  let contatore = 1;

  const assegna = (x, y, tipoPos) => {
    const chiave = car(tipoPos);
    if (!mappa.has(chiave)) {
      mappa.set(chiave, 'PP' + contatore);
      contatore++;
    }
    return { x: x, y: y, sigla: mappa.get(chiave), tipoPos: tipoPos };
  };

  const numPerFila = Number(c.numero) + 1;

  let accX = 0;
  for (let i = 0; i < numPerFila; i++) {
    const tipoPos = (i === 0 || i === numPerFila - 1) ? 'angolo' : 'intermedio_lungo';
    pilastri.push(assegna(accX, 0, tipoPos));
    if (i < Number(c.numero)) accX += c.lista[i].interasse;
  }

  accX = 0;
  for (let i = 0; i < numPerFila; i++) {
    const tipoPos = (i === 0 || i === numPerFila - 1) ? 'angolo' : 'intermedio_lungo';
    pilastri.push(assegna(accX, W, tipoPos));
    if (i < Number(c.numero)) accX += c.lista[i].interasse;
  }

  return {
    pilastri: pilastri,
    mappa: Array.from(mappa.entries())
  };
}

/**
 * Salva lo stato su localStorage.
 */
export function salvaStato(s) {
  const copia = clonaStato(s);
  copia.meta.timestamp = new Date().toISOString();
  localStorage.setItem(CHIAVE, JSON.stringify(copia));
  return copia;
}

/**
 * Carica lo stato da localStorage.
 */
export function caricaStato() {
  const raw = localStorage.getItem(CHIAVE);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p.misureEsterne || !p.campate) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Cancella lo stato salvato (per reset).
 */
export function cancellaStato() {
  localStorage.removeItem(CHIAVE);
  localStorage.removeItem('cacem-stato-v6');
  localStorage.removeItem('cacem-stato-v5');
}

/**
 * Esporta lo stato in JSON stringa.
 */
export function esportaJSON(s) {
  return JSON.stringify(s, null, 2);
}
