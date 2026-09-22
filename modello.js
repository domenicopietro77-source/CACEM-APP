// modello.js — Stato del capannone, calcoli derivati, persistenza

import { trovaPilastro, trovaTrave, trovaTegolo, trovaFondazione } from './catalogo.js';

const CHIAVE = 'cacem-stato-v4';

/**
 * Stato di default del capannone.
 */
export function statoDefault() {
  return {
    generale: {
      luce: 30,
      altezzaPilastro: 6,
      pendenzaCopertura: 5,
      interpiano: false,
      altezzaInterpiano: 4,
      carroponte: false,
      portataCarroponte: 10
    },
    campate: [
      { id: 1, interasse: 15 },
      { id: 2, interasse: 15 },
      { id: 3, interasse: 15 },
      { id: 4, interasse: 15 }
    ],
    pilastri: {
      base: 40,
      altezzaSezione: 40,
      pluviale: true,
      pluvialeDiametro: 100,
      fondazione: 'bicchiere_pluviale'
    },
    travi: {
      tipoBanchina: 'TL',
      tipoTrasversale: 'TD'
    },
    copertura: {
      tegoloId: 'AL',
      coppellaId: 'CC332'
    },
    solai: {
      tipoId: 'TT80'
    },
    pannelli: {
      tipo: 'V',
      spessore: 20,
      finitura: 'FV',
      coloriGraniglia: ['#d9d2c5', '#b8b0a0'],
      percentualiGraniglia: [70, 30],
      lati: {
        sud:  { attivo: true, apertura: [] },
        est:  { attivo: true, apertura: [] },
        nord: { attivo: true, apertura: [] },
        ovest:{ attivo: true, apertura: [] }
      }
    },
    meta: {
      versione: '4.0',
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
 * Lunghezza totale del capannone (somma interassi).
 */
export function lunghezzaTotale(stato) {
  return stato.campate.reduce((a, c) => a + Number(c.interasse || 0), 0);
}

/**
 * Calcolo derivati: geometria, volumi, pesi, distinta.
 * Retrocompatibile con la struttura precedente.
 */
export function calcolaDerivati(stato) {
  const g = stato.generale;
  const L = lunghezzaTotale(stato);
  const W = g.luce;
  const H = g.altezzaPilastro;
  const salita = (W / 2) * (g.pendenzaCopertura / 100);
  const Hcolmo = H + salita;

  // --- Pilastri ---
  const numPerFila = stato.campate.length + 1;
  const numPilastri = numPerFila * 2;
  const baseP = (stato.pilastri.base || 40) / 100;
  const altP = (stato.pilastri.altezzaSezione || 40) / 100;
  const volPilSingolo = baseP * altP * H;
  const volPilastri = volPilSingolo * numPilastri;

  // --- Travi di banchina (2, una per lato) ---
  const tra = trovaTrave(stato.travi.tipoBanchina) || trovaTrave('TL');
  const altTraveM = (tra ? tra.altezza : 60) / 100;
  const baseTraveM = (tra ? tra.base : 40) / 100;
  const volTraveBanchina = L * baseTraveM * altTraveM * 2;

  // --- Travi trasversali (per campata, due falde) ---
  const numTraviTrasv = stato.campate.length * 2;
  const lungTraveTrasv = Math.sqrt((W / 2) ** 2 + salita ** 2);
  const volTraveTrasvSingola = lungTraveTrasv * baseTraveM * altTraveM;
  const volTraviTrasv = volTraveTrasvSingola * numTraviTrasv;

  // --- Tegoli copertura ---
  const teg = trovaTegolo(stato.copertura.tegoloId) || trovaTegolo('AL');
  const numTegoliPerFalda = Math.ceil(L / ((teg ? teg.larghezza : 250) / 100));
  const numTegoli = numTegoliPerFalda * 2;
  const lungFalda = Math.sqrt((W / 2) ** 2 + salita ** 2);
  const volTegoloSingolo = ((teg ? teg.larghezza : 250) / 100) * 
                           ((teg ? teg.altezza : 12) / 100) * lungFalda;
  const volTegoli = volTegoloSingolo * numTegoli;

  // --- Pannelli tamponamento (4 lati) ---
  const spPannM = stato.pannelli.spessore / 100;
  const perimetro = 2 * (L + W);
  const volPannelli = perimetro * H * spPannM;

  // --- Interpiano (se attivo) ---
  let volInterpiano = 0;
  if (g.interpiano) {
    const spSolaio = 0.25;
    volInterpiano = L * W * spSolaio;
  }

  // --- Fondazioni (stima) ---
  const largFond = Math.max(baseP * 1.8, 0.8);
  const altFond = 0.8;
  const volFondSingolo = largFond * largFond * altFond;
  const volFondazioni = volFondSingolo * numPilastri;

  // --- Volume totale ---
  const volTotale = volPilastri + volTraveBanchina + volTraviTrasv + 
                    volTegoli + volPannelli + volInterpiano + volFondazioni;
  const densita = 2.5;
  const pesoStimato = volTotale * densita;

  return {
    L, W, H, Hcolmo, salita,
    numPilastri,
    numPerFila,
    numTegoli,
    lungFalda,
    superficieCoperta: L * W,
    volumeTotale: volTotale,
    pesoStimato,
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
 * Salva lo stato in localStorage.
 */
export function salvaStato(s) {
  const copia = clonaStato(s);
  copia.meta.timestamp = new Date().toISOString();
  localStorage.setItem(CHIAVE, JSON.stringify(copia));
  return copia;
}

/**
 * Carica lo stato da localStorage, con migrazione da versioni vecchie.
 */
export function caricaStato() {
  const raw = localStorage.getItem(CHIAVE);
  if (!raw) {
    // Prova a migrare da vecchie versioni
    const vecchio = localStorage.getItem('cacem-stato-v3');
    if (vecchio) {
      try {
        const v3 = JSON.parse(vecchio);
        return migraV3aV4(v3);
      } catch { return null; }
    }
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.generale || !parsed.campate) return null;
    return parsed;
  } catch { return null; }
}

/**
 * Migrazione da versione 3 a versione 4.
 */
function migraV3aV4(v3) {
  const nuovo = statoDefault();
  if (v3.generale) {
    Object.assign(nuovo.generale, v3.generale);
  }
  if (v3.campate && Array.isArray(v3.campate)) {
    nuovo.campate = v3.campate;
  }
  if (v3.pilastri) {
    if (v3.pilastri.base) nuovo.pilastri.base = v3.pilastri.base;
    if (v3.pilastri.altezzaSezione) nuovo.pilastri.altezzaSezione = v3.pilastri.altezzaSezione;
  }
  if (v3.travi && v3.travi.tipoId) {
    nuovo.travi.tipoBanchina = v3.travi.tipoId;
  }
  if (v3.copertura && v3.copertura.tegoloId) {
    nuovo.copertura.tegoloId = v3.copertura.tegoloId;
  }
  return nuovo;
}

export function cancellaStato() {
  localStorage.removeItem(CHIAVE);
  localStorage.removeItem('cacem-stato-v3');
}

export function esportaJSON(s) {
  return JSON.stringify(s, null, 2);
}