// catalogo.js — Caricamento cataloghi JSON e utility di lookup
let cataloghi = null;

export async function caricaCataloghi() {
  if (cataloghi) return cataloghi;
  const files = ['pilastri','travi','mensole','solai','copertura','coppelle','pannelli'];
  const risultati = await Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => {
    if (!r.ok) throw new Error(`Errore caricamento data/${f}.json`);
    return r.json();
  })));
  cataloghi = {};
  files.forEach((nome,i) => { cataloghi[nome] = risultati[i]; });
  return cataloghi;
}
export function getCatalogo(nome) {
  if (!cataloghi) throw new Error('Cataloghi non ancora caricati');
  return cataloghi[nome];
}
export function trovaPilastro(id) { return getCatalogo('pilastri').pilastri.find(p => p.id === id); }
export function trovaTrave(id) { return getCatalogo('travi').travi.find(t => t.id === id); }
export function trovaMensola(id) { return getCatalogo('mensole').mensole.find(m => m.id === id); }
export function trovaSolaio(id) { return getCatalogo('solai').solai.find(s => s.id === id); }
export function trovaTegolo(id) { return getCatalogo('copertura').tegoli.find(t => t.id === id); }
