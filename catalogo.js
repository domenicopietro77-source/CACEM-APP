// catalogo.js — Lettore dei cataloghi JSON + utility di ricerca CACEM

const NOMI = [
  'pilastri',
  'travi',
  'copertura',
  'solai',
  'coppelle',
  'mensole',
  'fondazioni',
  'pannelli'
];

let cataloghi = null;

export async function caricaCataloghi() {
  if (cataloghi) return cataloghi;
  cataloghi = {};
  const risultati = await Promise.all(
    NOMI.map(async (nome) => {
      try {
        const r = await fetch(nome + '.json');
        if (!r.ok) { console.warn('Catalogo mancante: ' + nome + '.json'); return { nome, dati: null }; }
        return { nome, dati: await r.json() };
      } catch (e) {
        console.warn('Errore ' + nome + '.json:', e.message);
        return { nome, dati: null };
      }
    })
  );
  risultati.forEach(r => { cataloghi[r.nome] = r.dati; });
  return cataloghi;
}

export function getCatalogo(nome) {
  if (!cataloghi) return null;
  return cataloghi[nome] || null;
}

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
  if (!cataloghi || !cataloghi.copertura) return null;
  return trovaIn(cataloghi.copertura, id);
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

export function getPannelli() {
  if (!cataloghi) return null;
  return cataloghi.pannelli || null;
}

export function getSpessoriPannello() {
  const p = getPannelli();
  return p ? p.spessori : [20, 24, 28];
}

export function getTolleranza(spessore) {
  const p = getPannelli();
  if (!p || !p.tolleranze) return Number(spessore) === 28 ? 2 : 1;
  return p.tolleranze[String(spessore)] || 1;
}

export function getModuloStandardPannello() {
  const p = getPannelli();
  return p ? p.moduloStandardCm : 255;
}

export const catalogo = new Proxy({}, {
  get(_t, prop) {
    if (!cataloghi) return [];
    return cataloghi[prop] !== undefined ? cataloghi[prop] : [];
  }
});