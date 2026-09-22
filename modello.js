import { trovaTrave, trovaTegolo } from "./catalogo.js";

export const CHIAVE = "cacem-stato-v3";

const DEFAULT_PILASTRO_BASE = 40;
const DEFAULT_PILASTRO_ALTEZZA_SEZIONE = 60;

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
      base: DEFAULT_PILASTRO_BASE,
      altezzaSezione: DEFAULT_PILASTRO_ALTEZZA_SEZIONE,
      fondazione: "bicchiere"
    },
    travi: {
      tipoId: "TL"
    },
    copertura: {
      tegoloId: "AL"
    },
    pannelli: {
      tipo: "V",
      spessore: 20,
      finitura: "FV",
      colori: {
        A: "#d8d8d8",
        B: "#b0b0b0"
      }
    }
  };
}

function migraTipoPilastro(tipoId) {
  if (typeof tipoId !== "string") {
    return null;
  }

  const match = tipoId.match(/^(\d+)x(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    base: Number(match[1]),
    altezzaSezione: Number(match[2])
  };
}

function normalizzaStato(s) {
  const defaults = statoDefault();

  s.generale = {
    ...defaults.generale,
    ...(s.generale || {})
  };

  s.campate = Array.isArray(s.campate) && s.campate.length
    ? s.campate
    : defaults.campate;

  const legacy = migraTipoPilastro(s.pilastri?.tipoId);

  s.pilastri = {
    ...defaults.pilastri,
    ...(s.pilastri || {}),
    ...(legacy || {})
  };

  delete s.pilastri.tipoId;

  s.travi = {
    ...defaults.travi,
    ...(s.travi || {})
  };

  s.copertura = {
    ...defaults.copertura,
    ...(s.copertura || {})
  };

  s.pannelli = {
    ...defaults.pannelli,
    ...(s.pannelli || {}),
    colori: {
      ...defaults.pannelli.colori,
      ...(s.pannelli?.colori || {})
    }
  };

  return s;
}

export function calcolaDerivati(s) {
  const g = s.generale;

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(g.luce || 0);
  const numCampate = s.campate.length;
  const numPilastri = (numCampate + 1) * 2;

  const basePilastro = Number(
    s.pilastri.base || DEFAULT_PILASTRO_BASE
  );
  const altezzaSezionePilastro = Number(
    s.pilastri.altezzaSezione || DEFAULT_PILASTRO_ALTEZZA_SEZIONE
  );

  const t = trovaTrave(s.travi.tipoId) || trovaTrave("TL");
  const k = trovaTegolo(s.copertura.tegoloId) || trovaTegolo("AL");

  const altezzaPilastro = Number(g.altezzaPilastro || 0);
  const pendenza = Number(g.pendenzaCopertura || 0);

  const areaSezionePilastro =
    (basePilastro / 100) *
    (altezzaSezionePilastro / 100);

  const volumePilastri =
    areaSezionePilastro *
    altezzaPilastro *
    numPilastri;

  const volumeTraviBanchina =
    L *
    (t.base / 100) *
    (t.altezza / 100) *
    2;

  const volumeTraviTrasversali =
    numCampate *
    W *
    (t.base / 100) *
    (t.altezza / 100);

  const lunghezzaFalda =
    Math.sqrt(
      (W / 2) ** 2 +
      (W * pendenza / 200) ** 2
    );

  const numTegoli =
    Math.max(
      1,
      Math.ceil(L / (k.larghezza || 2.5))
    ) * 2;

  const areaTegolo =
    (k.larghezza || 2.5) *
    (k.altezza || 0.12);

  const volumeTegoli =
    areaTegolo *
    lunghezzaFalda *
    numTegoli;

  const spessorePannello =
    Number(s.pannelli.spessore || 0) / 100;

  const perimetro = 2 * (L + W);

  const volumePannelli =
    perimetro *
    altezzaPilastro *
    spessorePannello;

  const volumeInterpiano =
    g.interpiano
      ? L * W * 0.25
      : 0;

  const volumeFondazioni =
    numPilastri *
    0.9 *
    0.9 *
    0.8;

  const volumeStrutturale =
    volumePilastri +
    volumeTraviBanchina +
    volumeTraviTrasversali +
    volumeTegoli +
    volumePannelli;

  const total =
    volumeStrutturale +
    volumeFondazioni +
    volumeInterpiano;

  const tipoPilastro =
    String(basePilastro) +
    "x" +
    String(altezzaSezionePilastro);

  const d = [
    [
      "Fondazioni",
      "Fondazione",
      s.pilastri.fondazione,
      numPilastri,
      "0.90×0.90×0.80",
      volumeFondazioni
    ],
    [
      "Pilastri",
      "Pilastri",
      tipoPilastro,
      numPilastri,
      (basePilastro / 100).toFixed(2) +
        "×" +
        (altezzaSezionePilastro / 100).toFixed(2) +
        "×" +
        altezzaPilastro.toFixed(2),
      volumePilastri
    ],
    [
      "Travi",
      "Banchina",
      s.travi.tipoId,
      2,
      L.toFixed(2) +
        "×" +
        (t.base / 100).toFixed(2) +
        "×" +
        (t.altezza / 100).toFixed(2),
      volumeTraviBanchina
    ],
    [
      "Travi",
      "Trasversali",
      s.travi.tipoId,
      numCampate,
      W.toFixed(2) +
        "×" +
        (t.base / 100).toFixed(2) +
        "×" +
        (t.altezza / 100).toFixed(2),
      volumeTraviTrasversali
    ],
    [
      "Copertura",
      "Tegoli",
      s.copertura.tegoloId,
      numTegoli,
      (k.larghezza || 2.5).toFixed(2) +
        "×" +
        lunghezzaFalda.toFixed(2),
      volumeTegoli
    ],
    [
      "Pannelli",
      "Tamponamento",
      s.pannelli.tipo,
      1,
      perimetro.toFixed(2) +
        "×" +
        altezzaPilastro.toFixed(2) +
        "×" +
        spessorePannello.toFixed(2),
      volumePannelli
    ]
  ];

  if (g.interpiano) {
    d.push([
      "Solai",
      "Interpiano",
      "TT",
      1,
      L.toFixed(2) +
        "×" +
        W.toFixed(2),
      volumeInterpiano
    ]);
  }

  const prices = {
    Fondazioni: 280,
    Pilastri: 320,
    Travi: 390,
    Copertura: 420,
    Pannelli: 350,
    Solai: 300
  };

  return {
    lunghezza: L,
    superficie: L * W,
    volumi: {
      pilastri: volumePilastri,
      traviBanchina: volumeTraviBanchina,
      traviTrasversali: volumeTraviTrasversali,
      tegoli: volumeTegoli,
      pannelli: volumePannelli,
      interpiano: volumeInterpiano,
      fondazioni: volumeFondazioni,
      totale: total
    },
    peso: total * 2.5,
    distinta: d,
    prezzoTotale: d.reduce(
      (sum, row) =>
        sum + row[5] * (prices[row[0]] || 0),
      0
    ),
    quotaColmo:
      altezzaPilastro +
      W * pendenza / 200
  };
}
export function salvaStato(s) {
  localStorage.setItem(
    CHIAVE,
    JSON.stringify(s)
  );
}

export function caricaStato() {
  try {
    const raw = localStorage.getItem(CHIAVE);

    if (!raw) {
      return null;
    }

    return normalizzaStato(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function cancellaStato() {
  localStorage.removeItem(CHIAVE);
}

export function esportaJSON(s) {
  return JSON.stringify(s, null, 2);
}
