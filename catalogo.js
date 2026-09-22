// catalogo.js — Caricamento cataloghi JSON + utility di lookup + Proxy retrocompatibilità

let cataloghi = null;
let caricato = false;

const NOMI_CATALOGHI = [
  'pilastri', 'fondazioni', 'travi', 'tegoli', 'solai', 'coppelle',
  'pannelli', 'aperture', 'halfen', 'listino'
];

export async function caricaCataloghi() {
  if (caricato) return cataloghi;
  cataloghi = {};
  const risultati = await Promise.all(
    NOMI_CATALOGHI.map(async (nome) => {
      try {
        const r = await fetch(nome + '.json');
        if (!r.ok) {
          console.warn('Catalogo non trovato: ' + nome + '.json');
          return { nome, dati: null };
        }
        const dati = await r.json();
        return { nome, dati };
      } catch (err) {
        console.warn('Errore caricamento ' + nome + '.json:', err.message);
        return { nome, dati: null };
      }
    })
  );
  risultati.forEach(r => { cataloghi[r.nome] = r.dati; });
  caricato = true;
  return cataloghi;
}

export function getCatalogo(nome) {
  if (!cataloghi) return null;
  return cataloghi[nome] || null;
}

function trovaInArray(arr, id) {
  if (!Array.isArray(arr) || !id) return null;
  return arr.find(x => x && x.id === id) || null;
}

export function trovaPilastro(id) {
  if (!cataloghi || !cataloghi.pilastri) return null;
  return trovaInArray(cataloghi.pilastri, id);
}

export function trovaFondazione(id) {
  if (!cataloghi || !cataloghi.fondazioni) return null;
  return trovaInArray(cataloghi.fondazioni.tipi, id);
}

export function getFondazioni() {
  if (!cataloghi || !cataloghi.fondazioni) return [];
  return cataloghi.fondazioni.tipi || [];
}

export function trovaTrave(id) {
  if (!cataloghi || !cataloghi.travi) return null;
  return trovaInArray(cataloghi.travi, id);
}

export function trovaTegolo(id) {
  if (!cataloghi || !cataloghi.tegoli) return null;
  return trovaInArray(cataloghi.tegoli, id);
}

export function trovaSolaio(id) {
  if (!cataloghi || !cataloghi.solai) return null;
  return trovaInArray(cataloghi.solai, id);
}

export function trovaCoppella(id) {
  if (!cataloghi || !cataloghi.coppelle) return null;
  return trovaInArray(cataloghi.coppelle, id);
}

export function getTipiPannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.tipi || [];
}

export function getFiniturePannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.finiture || [];
}

export function getSpessoriPannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.spessori || [20, 24, 28];
}

export function getColoriGraniglia() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  if (!cataloghi.pannelli.coloriGraniglia) return [];
  return cataloghi.pannelli.coloriGraniglia.catalogo || [];
}

export function trovaApertura(id) {
  if (!cataloghi || !cataloghi.aperture) return null;
  return trovaInArray(cataloghi.aperture.tipi, id);
}

export function getAperture() {
  if (!cataloghi || !cataloghi.aperture) return [];
  return cataloghi.aperture.tipi || [];
}

export function getAperturePerCategoria(categoria) {
  return getAperture().filter(a => a.categoria === categoria);
}

export function trovaHalfen(id) {
  if (!cataloghi || !cataloghi.halfen) return null;
  return trovaInArray(cataloghi.halfen.categorie, id);
}

export function getHalfenCategorie() {
  if (!cataloghi || !cataloghi.halfen) return [];
  return cataloghi.halfen.categorie || [];
}

export function getListino() {
  if (!cataloghi) return null;
  return cataloghi.listino || null;
}

export function getPrezzoM3(famiglia) {
  const listino = getListino();
  if (!listino || !listino.euro_m3) return 0;
  return listino.euro_m3[famiglia] || 0;
}

export function getPrezzoMl(voce) {
  const listino = getListino();
  if (!listino || !listino.euro_ml) return 0;
  return listino.euro_ml[voce] || 0;
}

export function getIdsPilastri() {
  if (!cataloghi || !cataloghi.pilastri) return [];
  return cataloghi.pilastri.map(p => p.id);
}

export function getIdsTravi() {
  if (!cataloghi || !cataloghi.travi) return [];
  return cataloghi.travi.map(t => t.id);
}

export function getIdsTegoli() {
  if (!cataloghi || !cataloghi.tegoli) return [];
  return cataloghi.tegoli.map(t => t.id);
}

/**
 * Retrocompatibilità: il vecchio ui.js importa { catalogo }.
 * Espone un Proxy che legge dinamicamente da cataloghi.
 */
export const catalogo = new Proxy({}, {
  get(_target, prop) {
    if (!cataloghi) return [];
    return cataloghi[prop] !== undefined ? cataloghi[prop] : [];
  }
});