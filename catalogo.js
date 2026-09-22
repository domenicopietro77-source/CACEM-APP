// catalogo.js — Caricamento cataloghi JSON e utility di lookup

let cataloghi = null;
let caricato = false;

const NOMI_CATALOGHI = [
  'pilastri',
  'fondazioni',
  'travi',
  'tegoli',
  'solai',
  'coppelle',
  'pannelli',
  'aperture',
  'halfen',
  'listino'
];

/**
 * Carica tutti i cataloghi JSON dalla root.
 * Ogni JSON viene caricato in modo indipendente: se uno manca, 
 * gli altri vengono comunque caricati.
 */
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

  risultati.forEach(r => {
    cataloghi[r.nome] = r.dati;
  });

  caricato = true;
  return cataloghi;
}

/**
 * Ritorna il catalogo per nome, o null se non caricato.
 */
export function getCatalogo(nome) {
  if (!cataloghi) return null;
  return cataloghi[nome] || null;
}

/**
 * Ricerca generica per id dentro un array.
 */
function trovaInArray(arr, id) {
  if (!Array.isArray(arr) || !id) return null;
  return arr.find(x => x && x.id === id) || null;
}

/**
 * Trova un pilastro per id.
 * Struttura: { id, nome, sezione: {l, h}, altezzeStd, pluvialeDiametro, ... }
 */
export function trovaPilastro(id) {
  if (!cataloghi || !cataloghi.pilastri) return null;
  return trovaInArray(cataloghi.pilastri, id);
}

/**
 * Trova un tipo di fondazione per id.
 * Struttura: cataloghi.fondazioni.tipi = [{ id, nome, tipo, ... }]
 */
export function trovaFondazione(id) {
  if (!cataloghi || !cataloghi.fondazioni) return null;
  return trovaInArray(cataloghi.fondazioni.tipi, id);
}

/**
 * Ritorna la lista di tutte le fondazioni disponibili.
 */
export function getFondazioni() {
  if (!cataloghi || !cataloghi.fondazioni) return [];
  return cataloghi.fondazioni.tipi || [];
}

/**
 * Trova una trave per id.
 * Struttura: { id, nome, sigla, base, altezza, luceMax, ... }
 */
export function trovaTrave(id) {
  if (!cataloghi || !cataloghi.travi) return null;
  return trovaInArray(cataloghi.travi, id);
}

/**
 * Trova un tegolo per id.
 */
export function trovaTegolo(id) {
  if (!cataloghi || !cataloghi.tegoli) return null;
  return trovaInArray(cataloghi.tegoli, id);
}

/**
 * Trova un solaio per id.
 */
export function trovaSolaio(id) {
  if (!cataloghi || !cataloghi.solai) return null;
  return trovaInArray(cataloghi.solai, id);
}

/**
 * Trova una coppella per id.
 */
export function trovaCoppella(id) {
  if (!cataloghi || !cataloghi.coppelle) return null;
  return trovaInArray(cataloghi.coppelle, id);
}

/**
 * Ritorna la lista di tutti i tipi di pannello.
 * pannelli.json struttura: { spessori, tipi, finiture, ... }
 */
export function getTipiPannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.tipi || [];
}

/**
 * Ritorna la lista di tutte le finiture pannello.
 */
export function getFiniturePannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.finiture || [];
}

/**
 * Ritorna la lista degli spessori disponibili per i pannelli.
 */
export function getSpessoriPannello() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  return cataloghi.pannelli.spessori || [20, 24, 28];
}

/**
 * Ritorna la lista dei colori disponibili per la graniglia.
 */
export function getColoriGraniglia() {
  if (!cataloghi || !cataloghi.pannelli) return [];
  if (!cataloghi.pannelli.coloriGraniglia) return [];
  return cataloghi.pannelli.coloriGraniglia.catalogo || [];
}

/**
 * Trova un tipo di apertura per id.
 * aperture.json struttura: { tipi: [{ id, nome, categoria, dimensioniStd, ... }] }
 */
export function trovaApertura(id) {
  if (!cataloghi || !cataloghi.aperture) return null;
  return trovaInArray(cataloghi.aperture.tipi, id);
}

/**
 * Ritorna tutte le aperture disponibili.
 */
export function getAperture() {
  if (!cataloghi || !cataloghi.aperture) return [];
  return cataloghi.aperture.tipi || [];
}

/**
 * Ritorna tutte le aperture filtrate per categoria (porta, finestra, 
 * portone, lucernario).
 */
export function getAperturePerCategoria(categoria) {
  return getAperture().filter(a => a.categoria === categoria);
}

/**
 * Trova un inserto HALFEN per id.
 */
export function trovaHalfen(id) {
  if (!cataloghi || !cataloghi.halfen) return null;
  return trovaInArray(cataloghi.halfen.categorie, id);
}

/**
 * Ritorna tutte le categorie HALFEN disponibili.
 */
export function getHalfenCategorie() {
  if (!cataloghi || !cataloghi.halfen) return [];
  return cataloghi.halfen.categorie || [];
}

/**
 * Ritorna il listino prezzi.
 */
export function getListino() {
  if (!cataloghi) return null;
  return cataloghi.listino || null;
}

/**
 * Ritorna il prezzo unitario al m³ per una data famiglia.
 */
export function getPrezzoM3(famiglia) {
  const listino = getListino();
  if (!listino || !listino.euro_m3) return 0;
  return listino.euro_m3[famiglia] || 0;
}

/**
 * Ritorna il prezzo unitario al metro lineare per una data voce.
 */
export function getPrezzoMl(voce) {
  const listino = getListino();
  if (!listino || !listino.euro_ml) return 0;
  return listino.euro_ml[voce] || 0;
}

/**
 * Utility: ritorna la lista di tutti gli id dei pilastri.
 */
export function getIdsPilastri() {
  if (!cataloghi || !cataloghi.pilastri) return [];
  return cataloghi.pilastri.map(p => p.id);
}

/**
 * Utility: ritorna la lista di tutti gli id delle travi.
 */
export function getIdsTravi() {
  if (!cataloghi || !cataloghi.travi) return [];
  return cataloghi.travi.map(t => t.id);
}

/**
 * Utility: ritorna la lista di tutti gli id dei tegoli.
 */
export function getIdsTegoli() {
  if (!cataloghi || !cataloghi.tegoli) return [];
  return cataloghi.tegoli.map(t => t.id);
}