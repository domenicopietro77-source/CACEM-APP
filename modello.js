// modello.js — Stato capannone CACEM (v8 - struttura reale)

const CHIAVE = 'cacem-stato-v8';

export function statoDefault() {
  return {
    commessa: {
      id: null,
      nome: 'Nuova commessa',
      dataCreazione: null,
      dataModifica: null
    },

    // ============================================================
    // MISURE ESTERNE (input utente)
    // ============================================================
    misureEsterne: {
      lunghezza: 60,          // m
      larghezza: 30,          // m
      spessorePannello: 20,   // cm (20, 24, 28)
      tolleranza: 1,          // cm (1 per 20/24, 2 per 28)
      spessoreTotale: 21      // cm
    },

    // ============================================================
    // MISURE INTERNE (calcolate)
    // ============================================================
    misureInterne: {
      lunghezza: 59.58,       // m (60 - 0.42)
      larghezza: 29.58        // m (30 - 0.42)
    },

    // ============================================================
    // ALTEZZE (in cm, quote in m per livelli)
    // ============================================================
    altezze: {
      impostaPannello: -0.10, // m
      estradossoPannello: 6.20, // m
      altezzaPilastro: 6.30,  // m
      moduloPannelloVert: 450, // cm
      finestraPiccola: 250,   // cm
      portaPiccola: 220       // cm
    },

    // ============================================================
    // GRIGLIA PILASTRI (file X e Y)
    // ============================================================
    pilastri: {
      // Numero colonne lungo X (in base a campate)
      numColonneX: 4,
      // Numero file lungo Y (auto in base a interasse max 6.30 m)
      numFileY: 5,
      autoFileY: true,
      interasseMaxY: 6.30,    // m

      // Dimensioni pilastro
      base: 70,               // cm
      altezzaSezione: 70,     // cm

      // Pluviale
      pluviale: true,
      pluvialeDiametro: 160,  // mm

      // Fondazione
      tipoFondazione: 'bicchiere',
      tipoBicchiere: 'bicchiere_laterale',

      // Boccole M24 (dipendono dalla trave in testa - calcolate per pilastro)
      boccolePerPilastro: 'auto'
    },

    // ============================================================
    // CAMPATE LUNGO X (divise per tegolo AL max 25 m)
    // ============================================================
    campateX: {
      auto: true,
      numero: 3,
      maxLuceTegolo: 25,      // m
      lista: [
        { id: 1, interasse: 19.86 },  // m
        { id: 2, interasse: 19.86 },
        { id: 3, interasse: 19.86 }
      ]
    },

    // ============================================================
    // TRAVI BANCHINA (TU) — laterali
    // ============================================================
    traviTU: {
      tipo: 'TU',
      base: 70,               // cm
      altezza: 80,            // cm
      // Segmenti calcolati automaticamente (uno per campata X)
      segmenti: []
    },

    // ============================================================
    // TRAVI INTERNE (TI) — file interne
    // ============================================================
    traviTI: {
      attive: true,
      tipo: 'TI',
      base: 50,               // cm (anima centrale 10 + ali 20+20)
      altezza: 90,            // cm
      segmenti: []
    },

    // ============================================================
    // COPERTURA — TEGOLI AL
    // ============================================================
    copertura: {
      tipo: 'AL',
      tegolo: {
        id: 'AL',
        larghezza: 256,       // cm
        altezza: 88,          // cm
        basePiana: 65,        // cm
        spessore: 3           // cm
      },
      coppella: {
        id: 'LAMIERA',
        tipo: 'lamiera',
        larghezza: 100,       // mm
        altezza: 40           // mm
      },
      pendenza: 5,            // %
      // File tegoli calcolate automaticamente
      file: []
    },

    // ============================================================
    // PANNELLI TAMPONAMENTO (moduli configurabili)
    // ============================================================
    pannelli: {
      spessore: 20,           // cm
      finitura: 'FV',         // FV | GR
      granigliaTipo: 2,       // 1 | 2
      coloriGraniglia: ['#d9d2c5', '#b8b0a0'],
      percentualiGraniglia: [70, 30],
      moduloStandard: 255,    // cm

      lati: {
        sud: {
          attivo: true,
          tipo: 'V',
          // I moduli si inseriscono come array (dal tecnico)
          moduli: [
            { id: 'M1', larghezza: 21, tipo: 'bordo' },
            { id: 'M2', larghezza: 255, tipo: 'standard' },
            { id: 'M3', larghezza: 255, tipo: 'standard' }
          ],
          aperture: []
        },
        est: { attivo: true, tipo: 'V', moduli: [], aperture: [] },
        nord: { attivo: true, tipo: 'V', moduli: [], aperture: [] },
        ovest: { attivo: true, tipo: 'V', moduli: [], aperture: [] }
      }
    },

    // ============================================================
    // INTERPIANO
    // ============================================================
    interpiano: {
      attivo: false,
      numLivelli: 1,
      h1: 4,                  // m
      h2: 4,                  // m
      tipoSolaio: 'TT80'
    },

    // ============================================================
    // CARROPONTE
    // ============================================================
    carroponte: {
      attivo: false,
      portata: 10,            // t
      altezzaEstradosso: 5    // m
    },

    // ============================================================
    // ANCORAGGI CACEM
    // ============================================================
    ancoraggi: {
      pannelloTrave: {
        tipo: 'halfen-baionetta',
        elementi: [
          'Halfen nel pannello',
          'Halfen nella trave/tegolo',
          'Gruppo fissaggio (baionetta 35x8)',
          'CP 50x35x8 foro 17',
          'Dado M16',
          'Rondella Grower 17',
          'Vite HS 40/22 M16x50'
        ],
        minFissaggi: 2,
        resistenza: 950         // daN
      },
      traveTUPilastro: {
        tipo: 'm24-boccola-neoprene',
        elementi: ['Barre M24 cl. 8.8', 'Getto cemento', 'Neoprene']
      },
      traveTIPilastro: {
        tipo: 'm24-boccola-neoprene',
        elementi: ['Barre M24 cl. 8.8', 'Boccola ancorata', 'Neoprene']
      },
      tegoloALTrave: {
        tipo: 'scat-fisher-neoprene',
        elementi: ['SCAT 60x30', 'Fisher in opera', 'Neoprene']
      }
    },

    // ============================================================
    // GRAFICA
    // ============================================================
    grafica: {
      stile: 'autocad-bn',    // nero su bianco
      unitaLunghezze: 'cm',   // quote in cm
      unitaLivelli: 'm',      // livelli in m
      fontTitoli: 'italic-serif',
      tratteggioCls: 'incrociato',
      strutturaDietroPannelli: 'tratteggiata'
    },

    // ============================================================
    // LISTINO PREZZI
    // ============================================================
    listino: {
      fondazioni: 280,        // €/m³
      pilastri: 320,
      traviTU: 390,
      traviTI: 400,
      tegoli: 420,
      pannelli: 350,
      solaio: 300,
      coppelle: 28,           // €/ml
      graniglia: 15           // €/m²
    },

    meta: { versione: '8.0', timestamp: null }
  };
}

export function clonaStato(s) { return JSON.parse(JSON.stringify(s)); }

// ----------------------------------------------------------------
// CALCOLI
// ----------------------------------------------------------------

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

// Divide campate X in N uguali (o auto in base a tegolo AL max 25 m)
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
    stato.campateX.lista.push({
      id: i + 1,
      interasse: Math.round(inter * 1000) / 1000
    });
  }
  return stato.campateX.lista;
}

// Calcola file pilastri Y in base a larghezza / interasse max
export function calcolaFileY(stato) {
  if (!stato.pilastri.autoFileY) return stato.pilastri.numFileY;
  const W = stato.misureInterne.larghezza;
  const max = stato.pilastri.interasseMaxY;
  let n = Math.ceil(W / max) + 1;
  if (n < 2) n = 2;
  stato.pilastri.numFileY = n;
  return n;
}

// ----------------------------------------------------------------
// TRAVI
// ----------------------------------------------------------------

// Segmenti travi TU (2 lati, uno per campata X)
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
        lato: cfg.lato,
        y: cfg.y,
        x1: acc,
        x2: acc + inter,
        lunghezza: inter
      });
      acc += inter;
    }
  });
  stato.traviTU.segmenti = segs;
  return segs;
}

// Segmenti travi TI (file interne, uno per campata X)
export function calcolaTraviTI(stato) {
  if (!stato.traviTI.attive) { stato.traviTI.segmenti = []; return []; }
  const W = stato.misureInterne.larghezza;
  const n = stato.campateX.numero;
  const numFile = stato.pilastri.numFileY;
  const segs = [];

  // File interne (escludi y=0 e y=W)
  for (let k = 1; k < numFile - 1; k++) {
    const y = (k * W) / (numFile - 1);
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const inter = stato.campateX.lista[i].interasse;
      segs.push({
        id: 'TI' + k + '-' + (i + 1),
        fila: k,
        y: y,
        x1: acc,
        x2: acc + inter,
        lunghezza: inter
      });
      acc += inter;
    }
  }
  stato.traviTI.segmenti = segs;
  return segs;
}

// ----------------------------------------------------------------
// TEGOLI AL
// ----------------------------------------------------------------

// File tegoli paralleli a X (uno per ogni interasse tra travi)
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
      y1: y1,
      y2: y2,
      larghezza: y2 - y1,
      lunghezza: L,
      halfen: 7,
      scat: 4
    });
  }
  stato.copertura.file = file;
  return file;
}

// ----------------------------------------------------------------
// PANNELLI — utility
// ----------------------------------------------------------------

// Genera moduli pannelli per un lato (modulo standard 255 cm)
export function generaModuliPannelli(lunghezzaLato, moduloStd) {
  const modM = moduloStd / 100;
  const nMod = Math.floor(lunghezzaLato / modM);
  const resto = lunghezzaLato - nMod * modM;
  const moduli = [];

  // Bordo iniziale
  moduli.push({ id: 'B1', larghezza: 21, tipo: 'bordo' });

  // Moduli standard
  for (let i = 0; i < nMod; i++) {
    moduli.push({ id: 'M' + (i + 1), larghezza: moduloStd, tipo: 'standard' });
  }

  // Bordo finale
  moduli.push({ id: 'B2', larghezza: 21, tipo: 'bordo' });

  return moduli;
}

// ----------------------------------------------------------------
// CALCOLO DERIVATI (volumi, pesi)
// ----------------------------------------------------------------

export function calcolaDerivati(stato) {
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro;
  const numFile = stato.pilastri.numFileY;
  const numPerFila = stato.campateX.numero + 1;
  const numPilastri = numPerFila * numFile;

  // Pilastri
  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const volPil = baseP * altP * H * numPilastri;

  // Travi TU
  const segsTU = stato.traviTU.segmenti;
  const tuB = stato.traviTU.base / 100;
  const tuA = stato.traviTU.altezza / 100;
  const volTU = segsTU.reduce((s, x) => s + x.lunghezza, 0) * tuB * tuA;

  // Travi TI
  const segsTI = stato.traviTI.segmenti;
  const tiB = stato.traviTI.base / 100;
  const tiA = stato.traviTI.altezza / 100;
  const volTI = segsTI.reduce((s, x) => s + x.lunghezza, 0) * tiB * tiA;

  // Tegoli
  const tegH = stato.copertura.tegolo.altezza / 100;
  const file = stato.copertura.file;
  const volTeg = file.reduce((s, f) => s + f.larghezza * f.lunghezza, 0) * tegH;

  // Pannelli
  const spPann = stato.pannelli.spessore / 100;
  const perimetro = 2 * (L + W);
  const volPan = perimetro * H * spPann;

  // Fondazioni
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

// ----------------------------------------------------------------
// SALVATAGGIO
// ----------------------------------------------------------------

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