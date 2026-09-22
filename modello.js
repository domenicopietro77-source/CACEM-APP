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
  const n = s.campate.length + 1;

  const basePilastro = Number(
    s.pilastri.base || DEFAULT_PILASTRO_BASE
  );
  const altezzaSezionePilastro = Number(
    s.pilastri.altezzaSezione || DEFAULT_PILASTRO_ALTEZZA_SEZIONE
  );

  const t =
    trovaTrave(s.travi.tipoId) ||
    trovaTrave("TL");

  const k =
    trovaTegolo(s.copertura.tegoloId) ||
    trovaTegolo("AL");

  const vp =
    (basePilastro * altezzaSezionePilastro / 10000) *
    g.altezzaPilastro *
    2 *
    n;

  const vb =
    2 *
    L *
    t.base *
    t.altezza /
    10000;

  const vt =
    s.campate.length *
    W *
    t.base *
    t.altezza /
    10000 *
    2;

  const f =
    Math.sqrt(
      (W / 2) ** 2 +
      (W * g.pendenzaCopertura / 200) ** 2
    );

  const q =
    Math.max(
      1,
      Math.ceil(L / (k.larghezza || 2.5))
    ) * 2;

  const vc =
    q *
    (k.larghezza || 2.5) *
    (k.altezza || 0.12) *
    f;

  const vpan =
    2 *
    (L + W) *
    g.altezzaPilastro *
    s.pannelli.spessore /
    100;

  const vi =
    g.interpiano
      ? L * W * 0.25
      : 0;

  const vf =
    2 *
    n *
    0.9 *
    0.9 *
    0.8;

  const total =
    vp +
    vb +
    vt +
    vc +
    vpan +
    vi +
    vf;

  const tipoPilastro =
    String(basePilastro) +
    "x" +
    String(altezzaSezionePilastro);

  const d = [
    [
      "Fondazioni",
      "Fondazione",
      s.pilastri.fondazione,
      2 * n,
      "0.90×0.90×0.80",
      vf
    ],
    [
      "Pilastri",
      "Pilastri",
      tipoPilastro,
      2 * n,
      (basePilastro / 100).toFixed(2) +
        "×" +
        (altezzaSezionePilastro / 100).toFixed(2) +
        "×" +
        g.altezzaPilastro.toFixed(2),
      vp
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
      vb
    ],
    [
      "Travi",
      "Trasversali",
      s.travi.tipoId,
      2 * s.campate.length,
      W.toFixed(2) +
        "×" +
        (t.base / 100).toFixed(2) +
        "×" +
        (t.altezza / 100).toFixed(2),
      vt
    ],
    [
      "Copertura",
      "Tegoli",
      s.copertura.tegoloId,
      q,
      (k.larghezza || 2.5).toFixed(2) +
        "×" +
        f.toFixed(2),
      vc
    ],
    [
      "Pannelli",
      "Tamponamento",
      s.pannelli.tipo,
      1,
      s.pannelli.spessore + " cm",
      vpan
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
      vi
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
      pilastri: vp,
      traviBanchina: vb,
      traviTrasversali: vt,
      tegoli: vc,
      pannelli: vpan,
      interpiano: vi,
      fondazioni: vf,
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
      g.altezzaPilastro +
      W * g.pendenzaCopertura / 200
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
