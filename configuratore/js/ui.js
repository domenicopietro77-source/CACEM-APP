// ui.js — Binding tra input HTML e stato del modello

import { statoDefault, clonaStato, calcolaDerivati, salvaStato, caricaStato, cancellaStato, esportaJSON, importaJSON } from './modello.js';

const MAPPING = {
  'p-lunghezza': ['dimensioni', 'lunghezza'],
  'p-larghezza': ['dimensioni', 'larghezza'],
  'p-altezzaPilastro': ['dimensioni', 'altezzaPilastro'],
  'p-pendenzaCopertura': ['dimensioni', 'pendenzaCopertura'],
  'p-numeroCampate': ['dimensioni', 'numeroCampate'],
  'p-interasseCampate': ['dimensioni', 'interasseCampate'],
  'p-numeroPilastriPerFila': ['dimensioni', 'numeroPilastriPerFila'],
  'p-sezionePilastro': ['elementi', 'sezionePilastro'],
  'p-tipoTrave': ['elementi', 'tipoTrave'],
  'p-spessorePannello': ['elementi', 'spessorePannello'],
};

let statoCorrente = statoDefault();
const listeners = new Set();

export function getStato() { return clonaStato(statoCorrente); }

export function setStato(nuovo) {
  statoCorrente = clonaStato(nuovo);
  aggiornaInputDaStato();
  notifica();
}

export function onStatoChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifica() {
  listeners.forEach(cb => cb(getStato()));
}

function leggiInput(input) {
  if (input.tagName === 'SELECT') return input.value;
  if (input.type === 'number') {
    const n = parseFloat(input.value);
    return Number.isFinite(n) ? n : null;
  }
  return input.value;
}

function scriviInStato(id, valore) {
  const percorso = MAPPING[id];
  if (!percorso) return;
  const [gruppo, chiave] = percorso;
  statoCorrente[gruppo][chiave] = valore;
}

function leggiDaStato(id) {
  const percorso = MAPPING[id];
  if (!percorso) return null;
  const [gruppo, chiave] = percorso;
  return statoCorrente[gruppo][chiave];
}

function aggiornaInputDaStato() {
  Object.keys(MAPPING).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = leggiDaStato(id);
    if (val !== null && val !== undefined) el.value = val;
  });
}

export function inizializzaUI() {
  Object.keys(MAPPING).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const handler = () => {
      const val = leggiInput(el);
      if (val === null) {
        el.classList.add('invalid');
        return;
      }
      el.classList.remove('invalid');
      scriviInStato(id, val);
      notifica();
      clearTimeout(el._timer);
      el._timer = setTimeout(() => salvaStato(statoCorrente), 400);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });

  document.getElementById('btn-salva')?.addEventListener('click', () => {
    salvaStato(statoCorrente);
    mostraStatus('Stato salvato');
  });

  document.getElementById('btn-carica')?.addEventListener('click', () => {
    const caricato = caricaStato();
    if (caricato) { setStato(caricato); mostraStatus('Stato caricato'); }
    else mostraStatus('Nessun salvataggio trovato');
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (!confirm('Ripristinare i valori di default?')) return;
    cancellaStato();
    setStato(statoDefault());
    mostraStatus('Reset completato');
  });

  const salvato = caricaStato();
  if (salvato) {
    statoCorrente = salvato;
    aggiornaInputDaStato();
  }

  notifica();
}

export function aggiornaRisultati(stato) {
  const d = calcolaDerivati(stato);
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('r-superficie', d.superficieCoperta.toFixed(1) + ' m²');
  set('r-volume', d.volumeTotale.toFixed(2) + ' m³');
  set('r-peso', d.pesoStimato.toFixed(2) + ' t');
  set('r-pilastri', d.numPilastri);
  aggiornaDistinta(d.distinta);
}

function aggiornaDistinta(righe) {
  const tbody = document.querySelector('#tabella-distinta tbody');
  if (!tbody) return;
  tbody.innerHTML = righe.map(r => `<tr><td>${r.elemento}</td><td>${r.quantita}</td><td>${r.dimensioni}</td><td>${r.volume.toFixed(2)}</td><td>${r.peso.toFixed(2)}</td></tr>`).join('');
}

export function mostraStatus(msg) {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = 'Pronto'; }, 2500);
}

export function esportaProgetto() { esportaJSON(statoCorrente); }

export async function importaProgetto() {
  try {
    const nuovo = await importaJSON();
    setStato(nuovo);
    salvaStato(statoCorrente);
    mostraStatus('Progetto importato');
  } catch (err) {
    mostraStatus('Errore importazione: ' + err.message);
  }
}
