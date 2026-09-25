// commesse.js — Gestione archivio commesse su localStorage

const CHIAVE = 'cacem-commesse-v9';

function generaId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'commessa-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

export function caricaCommesse() {
  const raw = localStorage.getItem(CHIAVE);
  if (!raw) return { commesse: [], commessaCorrente: null };
  try {
    const dati = JSON.parse(raw);
    if (!dati || !Array.isArray(dati.commesse)) return { commesse: [], commessaCorrente: null };
    return dati;
  } catch {
    return { commesse: [], commessaCorrente: null };
  }
}

export function salvaCommesse(archivio) {
  localStorage.setItem(CHIAVE, JSON.stringify(archivio));
  return archivio;
}

export function getListaCommesse() {
  return caricaCommesse().commesse || [];
}

export function getCommessa(id) {
  return getListaCommesse().find(c => c.id === id) || null;
}

export function creaCommessa(nome, statoIniziale) {
  const archivio = caricaCommesse();
  const now = new Date().toISOString();
  const id = generaId();

  const stato = statoIniziale ? JSON.parse(JSON.stringify(statoIniziale)) : {};
  stato.commessa = { id, nome, dataCreazione: now, dataModifica: now };

  const commessa = { id, nome, dataCreazione: now, dataModifica: now, stato };

  archivio.commesse.push(commessa);
  archivio.commessaCorrente = id;
  salvaCommesse(archivio);

  return commessa;
}

export function eliminaCommessa(id) {
  const archivio = caricaCommesse();
  archivio.commesse = archivio.commesse.filter(c => c.id !== id);
  if (archivio.commessaCorrente === id) {
    archivio.commessaCorrente = archivio.commesse.length > 0 ? archivio.commesse[0].id : null;
  }
  salvaCommesse(archivio);
  return archivio;
}

export function duplicaCommessa(id) {
  const archivio = caricaCommesse();
  const originale = archivio.commesse.find(c => c.id === id);
  if (!originale) return null;

  const now = new Date().toISOString();
  const nuovoId = generaId();
  const nuovoNome = 'Copia di ' + originale.nome;

  const stato = JSON.parse(JSON.stringify(originale.stato));
  stato.commessa = { id: nuovoId, nome: nuovoNome, dataCreazione: now, dataModifica: now };

  const copia = { id: nuovoId, nome: nuovoNome, dataCreazione: now, dataModifica: now, stato };
  archivio.commesse.push(copia);
  archivio.commessaCorrente = nuovoId;
  salvaCommesse(archivio);

  return copia;
}

export function rinominaCommessa(id, nuovoNome) {
  const archivio = caricaCommesse();
  const c = archivio.commesse.find(x => x.id === id);
  if (!c) return null;

  const now = new Date().toISOString();
  c.nome = nuovoNome;
  c.dataModifica = now;

  if (c.stato && c.stato.commessa) {
    c.stato.commessa.nome = nuovoNome;
    c.stato.commessa.dataModifica = now;
  }

  salvaCommesse(archivio);
  return c;
}

export function apriCommessa(id) {
  const archivio = caricaCommesse();
  const c = archivio.commesse.find(x => x.id === id);
  if (!c) return null;
  archivio.commessaCorrente = id;
  salvaCommesse(archivio);
  return c;
}

export function getCommessaCorrente() {
  const archivio = caricaCommesse();
  if (!archivio.commessaCorrente) return null;
  return archivio.commesse.find(c => c.id === archivio.commessaCorrente) || null;
}

export function aggiornaStatoCommessa(stato) {
  const archivio = caricaCommesse();
  if (!archivio.commessaCorrente) return null;
  const c = archivio.commesse.find(x => x.id === archivio.commessaCorrente);
  if (!c) return null;

  const now = new Date().toISOString();
  c.stato = stato;
  c.dataModifica = now;
  if (c.stato.commessa) c.stato.commessa.dataModifica = now;

  salvaCommesse(archivio);
  return c;
}

export function esportaCommessa(id) {
  const c = getCommessa(id);
  if (!c) return null;

  const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = c.nome.replace(/[\\/:*?"<>|]/g, '_') + '.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return c;
}

export function importaCommessa(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Nessun file selezionato')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const c = JSON.parse(reader.result);
        if (!c || !c.id || !c.nome || !c.stato) throw new Error('File non valido');
        const archivio = caricaCommesse();
        const idx = archivio.commesse.findIndex(x => x.id === c.id);
        if (idx >= 0) archivio.commesse[idx] = c;
        else archivio.commesse.push(c);
        archivio.commessaCorrente = c.id;
        salvaCommesse(archivio);
        resolve(c);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('Errore lettura file'));
    reader.readAsText(file);
  });
}