// modello.js — Stato capannone (v5 - stile AutoCAD)

import { trovaPilastro, trovaTrave, trovaTegolo, trovaFondazione } from './catalogo.js';

const CHIAVE = 'cacem-stato-v5';

export function statoDefault() {
  return {
    generale: {
      luce: 30,
      altezzaPilastro: 6,
      pendenzaCopertura: 5,
      interpiano: false,
      altezzaInterpiano: 4,
      carroponte: false,
      portataCarroponte: 10,
      edificioEsistente: null
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
      fondazione: 'bicchiere_pluviale',
      sigle: []
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
        sud:  { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        est:  { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        nord: { attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] },
        ovest:{ attivo: true, posizione: 'esterno', offset: 6, altezze: [], aperture: [] }
      }
    },
    meta: {
      versione: '5.0',
      timestamp: null,
      nome: 'Nuova commessa'
    }
  };
}

export function clonaStato(s) {
  return JSON.parse(JSON.stringify(s));
}

export function lunghezzaTotale(stato) {
  return stato.campate.reduce((a, c) => a + Number(c.interasse || 0), 0);
}

/**
 * Classifica i pilastri in sigle PP1, PP2, PP3... in base a:
 * - angolo vs intermedio
 * - presenza pluviale
 * - tipo fondazione
 * - presenza mensole
 * Pilastri con stesse caratteristiche → stesso PP
 */
export function classificaPilastri(stato) {
  const L = lunghezzaTotale(stato);
  const W = stato.generale.luce;
  const numPerFila = stato.campate.length + 1;
  const pilastri = [];

  const caratteristica = (tipoPos) => {
    const car = {
      posizione: tipoPos,
      pluviale: tipoPos === 'angolo' ? stato.pilastri.pluviale : false,
      fondazione: tipoPos === 'angolo' 
        ? stato.pilastri.fondazione 
        : 'bicchiere_centrale',
      mensole: stato.generale.carroponte && tipoPos === 'intermedio_lungo' 
        ? 'carroponte' 
        : 'nessuna',
      sezione: stato.pilastri.base + 'x' + stato.pilastri.altezzaSezione
    };
    return JSON.stringify(car);
  };

  const mappaCar = new Map();
  let contatore = 1;

  const assegna = (x, y, tipoPos) => {
    const car = caratteristica(tipoPos);
    if (!mappaCar.has(car)) {
      mappaCar.set(car, 'PP' + contatore);
      contatore++;
    }
    return {
      x, y,
      sigla: mappaCar.get(car),
      tipoPos,
      caratteristica: JSON.parse(car)
    };
  };

  // Fila Sud (y=0): angolo SX, intermedi, angolo DX
  let accX = 0;
  for (let i = 0; i < numPerFila; i++) {
    const tipoPos = (i === 0 || i === numPerFila - 1) ? 'angolo' : 'intermedio_lungo';
    pilastri.push(assegna(accX, 0, tipoPos));
    if (i < stato.campate.length) accX += stato.campate[i].interasse;
  }

  // Fila Nord (y=W): stessa cosa
  accX = 0;
  for (let i = 0; i < numPerFila; i++) {
    const tipoPos = (i === 0 || i === numPerFila - 1) ? 'angolo' : 'intermedio_lungo';
    pilastri.push(assegna(accX, W, tipoPos));
    if (i < stato.campate.length) accX += stato.campate[i].interasse;
  }

  return { pilastri, mappa: Array.from(mappaCar.entries()) };
}

/**
 * Calcola derivati (volumi, pesi, distinta).
 */
export function calcolaDerivati(stato) {
  const g = stato.generale;
  const L = lunghezzaTotale(stato);
  const W = g.luce;
  const H = g.altezzaPilastro;
  const salita = (W / 2) * (g.pendenzaCopertura / 100);
  const Hcolmo = H + salita;

  const numPerFila = stato.campate.length + 1;
  const numPilastri = numPerFila * 2;

  const baseP = (stato.pilastri.base || 40) / 100;
  const altP = (stato.pilastri.altezzaSezione || 40) / 100;
  const volPilastri = baseP * altP * H * numPilastri;

  const tra = trovaTrave(stato.travi.tipoBanchina) || { base: 40, altezza: 60 };
  const altTraveM = (tra.altezza || 60) / 100;
  const baseTraveM = (tra.base || 40) / 100;
  const volTraveBanchina = L * baseTraveM * altTraveM * 2;

  const lungFalda = Math.sqrt((W / 2) ** 2 + salita ** 2);
  const numTraviTrasv = stato.campate.length * 2;
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

  const volTotale = volPilastri + volTraveBanchina + volTraviTrasv + volTegoli + volPannelli + volInterpiano + volFondazioni;
  const pesoStimato = volTotale * 2.5;

  return {
    L, W, H, Hcolmo, salita,
    numPilastri, numPerFila, numTegoli, lungFalda,
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

export function salvaStato(s) {
  const copia = clonaStato(s);
  copia.meta.timestamp = new Date().toISOString();
  localStorage.setItem(CHIAVE, JSON.stringify(copia));
  return copia;
}

export function caricaStato() {
  const raw = localStorage.getItem(CHIAVE);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p.generale || !p.campate) return null;
    return p;
  } catch { return null; }
}

export function cancellaStato() {
  localStorage.removeItem(CHIAVE);
  localStorage.removeItem('cacem-stato-v4');
  localStorage.removeItem('cacem-stato-v3');
}

export function esportaJSON(s) {
  return JSON.stringify(s, null, 2);
}