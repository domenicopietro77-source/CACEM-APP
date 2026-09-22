// catalogo.js — Lettore dei cataloghi JSON + utility di ricerca

const NOMI = [
  'pilastri',
  'fondazioni',
  'travi',
  'tegoli',
  'solai',
  'coppelle',
  'mensole',
  'pannelli',
  'aperture',
  'halfen',
  'listino'
];

let cataloghi = null;

/**
 * Carica tutti i cataloghi JSON dalla root.
 * Ogni file viene caricato in modo indipendente.
 */
export async function caricaCataloghi() {
  if (cataloghi) return cataloghi;
  cataloghi = {};

  const risultati = await Promise.all(
    NOMI.map(async (nome) => {
      try {
        const r = await fetch(nome + '.json');
        if (!r.ok) {
          console.warn('Catalogo mancante: ' + nome + '.json');
          return { nome, dati: null };
        }
        const dati = await r.json();
        return { nome, dati };
      } catch (e) {
        console.warn('Errore ' + nome + '.json:', e.message);
        return { nome, dati: null };
      }
    })
  );

  risultati.forEach(r => { cataloghi[r.nome] = r.dati; });
  return cataloghi;
}

/**
 * Ritorna il catalogo richiesto (o null).
 */
export function getCatalogo(nome) {
  if (!cataloghi) return null;
  return cataloghi[nome] || null;
}

/**
 * Ricerca per id dentro un array.
 */
function trovaIn(arr, id) {
  if (!Array.isArray(arr) || !id) return null;
  return arr.find(x => x && x.id === id) || null;
}

export function trovaPilastro(id) {
  if (!cataloghi || !cataloghi.pilastri) return null;
  return trovaIn(cataloghi.pilastri, id);
}

export function trovaTrave(id) {
  if (!cataloghi || !cataloghi.travi) return null;
  return trovaIn(cataloghi.travi, id);
}

export function trovaTegolo(id) {
  if (!cataloghi || !cataloghi.tegoli) return null;
  return trovaIn(cataloghi.tegoli, id);
}

export function trovaSolaio(id) {
  if (!cataloghi || !cataloghi.solai) return null;
  return trovaIn(cataloghi.solai, id);
}

export function trovaCoppella(id) {
  if (!cataloghi || !cataloghi.coppelle) return null;
  return trovaIn(cataloghi.coppelle, id);
}

export function trovaMensola(id) {
  if (!cataloghi || !cataloghi.mensole) return null;
  return trovaIn(cataloghi.mensole, id);
}

export function trovaFondazione(id) {
  if (!cataloghi || !cataloghi.fondazioni) return null;
  const t = cataloghi.fondazioni.tipi || [];
  return trovaIn(t, id);
}

export function trovaApertura(id) {
  if (!cataloghi || !cataloghi.aperture) return null;
  const t = cataloghi.aperture.tipi || [];
  return trovaIn(t, id);
}

export function getListino() {
  if (!cataloghi) return null;
  return cataloghi.listino || null;
}

export function getPrezzoM3(famiglia) {
  const l = getListino();
  if (!l || !l.euro_m3) return 0;
  return l.euro_m3[famiglia] || 0;
}

export function getPrezzoMl(voce) {
  const l = getListino();
  if (!l || !l.euro_ml) return 0;
  return l.euro_ml[voce] || 0;
}

/**
 * Proxy retrocompatibilità: chi fa "catalogo.pilastri" riceve l'array.
 */
export const catalogo = new Proxy({}, {
  get(_t, prop) {
    if (!cataloghi) return [];
    return cataloghi[prop] !== undefined ? cataloghi[prop] : [];
  }
});