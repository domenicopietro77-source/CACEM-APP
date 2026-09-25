// ui.js — Gestione UI editor + schermata commesse (CACEM v9)

import {
  statoDefault,
  calcolaMisureInterne,
  dividiCampateX,
  calcolaFileY,
  calcolaTraviTU,
  calcolaTraviTI,
  calcolaTegoli,
  calcolaDerivati,
  lunghezzaTotale,
  luceTrasversale,
  salvaStato
} from './modello.js';

import {
  caricaCommesse,
  getListaCommesse,
  getCommessa,
  creaCommessa,
  eliminaCommessa,
  duplicaCommessa,
  rinominaCommessa,
  apriCommessa,
  getCommessaCorrente,
  aggiornaStatoCommessa,
  esportaCommessa,
  importaCommessa
} from './commesse.js';

const $ = (id) => document.getElementById(id);

let stato = null;
let onChange = () => {};

export function getStato() { return stato; }
export function setStato(s) {
  stato = s;
  window.CACEM_STATE = s;
}

/* ============================================================
   SCHERMATA COMMESSE
   ============================================================ */

export function mostraSchermataCommesse() {
  const lista = getListaCommesse();
  const listaEl = $('commesse-lista');
  const vuoteEl = $('commesse-vuote');
  const schermataEl = $('schermata-commesse');
  const editorEl = $('schermata-editor');

  if (schermataEl) schermataEl.style.display = 'flex';
  if (editorEl) editorEl.style.display = 'none';

  if (!lista || lista.length === 0) {
    if (listaEl) listaEl.innerHTML = '';
    if (vuoteEl) vuoteEl.style.display = 'flex';
    return;
  }

  if (vuoteEl) vuoteEl.style.display = 'none';

  if (listaEl) {
    listaEl.innerHTML = lista.map(c =>
      '<div class="commessa-card" data-id="' + c.id + '">' +
        '<h3>' + escapeHtml(c.nome) + '</h3>' +
        '<div class="meta">Modificata: ' + formatData(c.dataModifica) + '</div>' +
        '<div class="actions">' +
          '<button class="btn btn-primary" data-action="apri" data-id="' + c.id + '">Apri</button>' +
          '<button class="btn" data-action="rinomina" data-id="' + c.id + '">Rinomina</button>' +
          '<button class="btn" data-action="duplica" data-id="' + c.id + '">Duplica</button>' +
          '<button class="btn btn-danger" data-action="elimina" data-id="' + c.id + '">Elimina</button>' +
        '</div>' +
      '</div>'
    ).join('');

    listaEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        gestisciAzione(btn.dataset.action, btn.dataset.id);
      });
    });

    listaEl.querySelectorAll('.commessa-card').forEach(card => {
      card.addEventListener('click', () => apriCommessaE(card.dataset.id));
    });
  }
}

function gestisciAzione(azione, id) {
  if (azione === 'apri') { apriCommessaE(id); return; }
  if (azione === 'rinomina') {
    const c = getCommessa(id);
    if (!c) return;
    const nuovo = prompt('Nuovo nome:', c.nome);
    if (nuovo && nuovo.trim()) { rinominaCommessa(id, nuovo.trim()); mostraSchermataCommesse(); }
    return;
  }
  if (azione === 'duplica') { duplicaCommessa(id); mostraSchermataCommesse(); return; }
  if (azione === 'elimina') {
    if (confirm('Eliminare questa commessa?')) { eliminaCommessa(id); mostraSchermataCommesse(); }
    return;
  }
}

export function apriCommessaE(id) {
  const c = apriCommessa(id);
  if (!c) return;
  setStato(c.stato);
  $('schermata-commesse').style.display = 'none';
  $('schermata-editor').style.display = 'flex';
  $('commessa-nome').textContent = c.nome;
  renderUI();
  collegaListener();
  notificaCambio();
  window.dispatchEvent(new CustomEvent('cacem:editor-open', { detail: { stato: c.stato } }));
}

export function nuovaCommessaE() {
  const nome = prompt('Nome nuova commessa:', 'Capannone ' + new Date().toLocaleDateString('it-IT'));
  if (!nome || !nome.trim()) return;
  const c = creaCommessa(nome.trim(), statoDefault());
  setStato(c.stato);
  $('schermata-commesse').style.display = 'none';
  $('schermata-editor').style.display = 'flex';
  $('commessa-nome').textContent = c.nome;
  calcolaMisureInterne(stato);
  dividiCampateX(stato);
  calcolaFileY(stato);
  calcolaTraviTU(stato);
  calcolaTraviTI(stato);
  calcolaTegoli(stato);
  renderUI();
  collegaListener();
  notificaCambio();
  window.dispatchEvent(new CustomEvent('cacem:editor-open', { detail: { stato: c.stato } }));
}

export function salvaCommessaCorrente() {
  if (!stato) return;
  aggiornaStatoCommessa(stato);
  salvaStato(stato);
  mostraStatus('Commessa salvata');
}

export function esportaCommessaCorrente() {
  const c = getCommessaCorrente();
  if (c) esportaCommessa(c.id);
}

export function importaCommessaDaFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importaCommessa(file).then(() => mostraSchermataCommesse())
      .catch(err => alert('Errore: ' + err.message));
  };
  input.click();
}

/* ============================================================
   INIZIALIZZAZIONE EDITOR
   ============================================================ */

export function inizializzaUI(s, callback) {
  stato = s;
  onChange = callback || (() => {});
  window.CACEM_STATE = s;
  renderUI();
  collegaListener();
}

function notificaCambio() {
  renderUI();
  aggiornaRisultati(stato);
  if (typeof onChange === 'function') onChange(stato);
  salvaStato(stato);
  aggiornaStatoCommessa(stato);
  window.dispatchEvent(new CustomEvent('cacem:state-change', { detail: { stato: stato } }));
}

/* ============================================================
   RENDER UI
   ============================================================ */

export function renderUI() {
  if (!stato) return;
  const me = stato.misureEsterne;
  const mi = stato.misureInterne;
  const cx = stato.campateX;
  const p = stato.pilastri;
  const a = stato.altezze;
  const pan = stato.pannelli;

  setVal('ext-lunghezza', me.lunghezza);
  setVal('ext-larghezza', me.larghezza);
  setSelect('ext-spessore-pannello', String(me.spessorePannello), [
    { value: '20', label: '20 + 1 cm' },
    { value: '24', label: '24 + 1 cm' },
    { value: '28', label: '28 + 2 cm' }
  ]);
  setTxt('info-lung-interna', mi.lunghezza.toFixed(2));
  setTxt('info-larg-interna', mi.larghezza.toFixed(2));

  setVal('campate-numero', cx.numero);
  setTxt('info-interasse', cx.lista[0] ? cx.lista[0].interasse.toFixed(3) : '—');

  setVal('pendenza-copertura', stato.copertura.pendenza);
  setVal('altezza-pilastro', a.altezzaPilastro);
  setVal('modulo-pannello-vert', a.moduloPannelloVert);

  setVal('pilastro-base', p.base);
  setVal('pilastro-alt-sezione', p.altezzaSezione);
  setVal('pilastro-file-y', p.numFileY);
  setChk('pilastro-auto-file-y', p.autoFileY);
  setVal('pilastro-interasse-max', p.interasseMaxY);
  setChk('pilastro-pluviale', p.pluviale);
  setVal('pilastro-pluviale-diametro', p.pluvialeDiametro);
  setSelect('pilastro-tipo-fondazione', p.tipoFondazione, [
    { value: 'bicchiere', label: 'Bicchiere' },
    { value: 'armatubo', label: 'Armatubo' }
  ]);
  setSelect('pilastro-tipo-bicchiere', p.tipoBicchiere, [
    { value: 'bicchiere_laterale', label: 'Laterale con pluviale' },
    { value: 'bicchiere_pluviale', label: 'Con pluviale' },
    { value: 'bicchiere_centrale', label: 'Centrale senza pluviale' }
  ]);

  setSelect('pannello-finitura', pan.finitura, [
    { value: 'FV', label: 'Faccia vista' },
    { value: 'GR', label: 'Granigliato' }
  ]);
  setSelect('graniglia-tipo', String(pan.granigliaTipo), [
    { value: '1', label: '1 colore' },
    { value: '2', label: '2 colori miscelati' }
  ]);
  setVal('graniglia-colore-1', pan.coloriGraniglia[0]);
  setVal('graniglia-colore-2', pan.coloriGraniglia[1]);
  setVal('graniglia-perc-1', pan.percentualiGraniglia[0]);
  setVal('graniglia-perc-2', pan.percentualiGraniglia[1]);

  const blocG = $('blocco-graniglia');
  if (blocG) blocG.style.display = (pan.finitura === 'GR') ? 'block' : 'none';
  const labelC2 = $('label-colore-2');
  const labelP2 = $('label-perc-2');
  const mostra2 = pan.granigliaTipo === 2;
  if (labelC2) labelC2.style.display = mostra2 ? 'flex' : 'none';
  if (labelP2) labelP2.style.display = mostra2 ? 'flex' : 'none';

  setChk('extra-interpiano', stato.interpiano.attivo);
  setSelect('interpiano-livelli', String(stato.interpiano.numLivelli), [
    { value: '1', label: '1 livello' },
    { value: '2', label: '2 livelli' },
    { value: '3', label: '3 livelli' }
  ]);
  setVal('interpiano-h1', stato.interpiano.h1);

  setChk('extra-carroponte', stato.carroponte.attivo);
  setVal('carroponte-portata', stato.carroponte.portata);
}

/* ============================================================
   LISTENER
   ============================================================ */

let listenerCollegati = false;

function collegaListener() {
  if (listenerCollegati) return;
  listenerCollegati = true;

  bindNum('ext-lunghezza', v => {
    stato.misureEsterne.lunghezza = v;
    calcolaMisureInterne(stato);
    dividiCampateX(stato);
    calcolaFileY(stato);
    calcolaTraviTU(stato);
    calcolaTraviTI(stato);
    calcolaTegoli(stato);
    notificaCambio();
  });
  bindNum('ext-larghezza', v => {
    stato.misureEsterne.larghezza = v;
    calcolaMisureInterne(stato);
    calcolaFileY(stato);
    calcolaTraviTU(stato);
    calcolaTraviTI(stato);
    calcolaTegoli(stato);
    notificaCambio();
  });
  bindSel('ext-spessore-pannello', v => {
    stato.misureEsterne.spessorePannello = parseInt(v, 10);
    stato.pannelli.spessore = parseInt(v, 10);
    calcolaMisureInterne(stato);
    dividiCampateX(stato);
    notificaCambio();
  });

  bindNum('campate-numero', v => {
    stato.campateX.numero = Math.max(1, Math.floor(v));
    stato.campateX.auto = false;
    dividiCampateX(stato);
    calcolaTraviTU(stato);
    calcolaTraviTI(stato);
    notificaCambio();
  });

  bindNum('pendenza-copertura', v => { stato.copertura.pendenza = v; notificaCambio(); });
  bindNum('altezza-pilastro', v => { stato.altezze.altezzaPilastro = v; notificaCambio(); });
  bindNum('modulo-pannello-vert', v => { stato.altezze.moduloPannelloVert = v; notificaCambio(); });

  bindNum('pilastro-base', v => { stato.pilastri.base = v; notificaCambio(); });
  bindNum('pilastro-alt-sezione', v => { stato.pilastri.altezzaSezione = v; notificaCambio(); });
  bindNum('pilastro-file-y', v => {
    stato.pilastri.numFileY = Math.max(2, Math.floor(v));
    stato.pilastri.autoFileY = false;
    calcolaTraviTI(stato);
    notificaCambio();
  });
  bindChk('pilastro-auto-file-y', v => {
    stato.pilastri.autoFileY = v;
    if (v) { calcolaFileY(stato); calcolaTraviTI(stato); }
    notificaCambio();
  });
  bindNum('pilastro-interasse-max', v => {
    stato.pilastri.interasseMaxY = v;
    if (stato.pilastri.autoFileY) { calcolaFileY(stato); calcolaTraviTI(stato); }
    notificaCambio();
  });
  bindChk('pilastro-pluviale', v => { stato.pilastri.pluviale = v; notificaCambio(); });
  bindSel('pilastro-pluviale-diametro', v => { stato.pilastri.pluvialeDiametro = parseInt(v, 10); notificaCambio(); });
  bindSel('pilastro-tipo-fondazione', v => { stato.pilastri.tipoFondazione = v; notificaCambio(); });
  bindSel('pilastro-tipo-bicchiere', v => { stato.pilastri.tipoBicchiere = v; notificaCambio(); });

  bindSel('pannello-finitura', v => { stato.pannelli.finitura = v; notificaCambio(); });
  bindSel('graniglia-tipo', v => { stato.pannelli.granigliaTipo = parseInt(v, 10); notificaCambio(); });
  bindColor('graniglia-colore-1', v => { stato.pannelli.coloriGraniglia[0] = v; notificaCambio(); });
  bindColor('graniglia-colore-2', v => { stato.pannelli.coloriGraniglia[1] = v; notificaCambio(); });
  bindNum('graniglia-perc-1', v => {
    stato.pannelli.percentualiGraniglia[0] = v;
    stato.pannelli.percentualiGraniglia[1] = 100 - v;
    notificaCambio();
  });

  bindChk('extra-interpiano', v => { stato.interpiano.attivo = v; notificaCambio(); });
  bindSel('interpiano-livelli', v => { stato.interpiano.numLivelli = parseInt(v, 10); notificaCambio(); });
  bindNum('interpiano-h1', v => { stato.interpiano.h1 = v; notificaCambio(); });

  bindChk('extra-carroponte', v => { stato.carroponte.attivo = v; notificaCambio(); });
  bindNum('carroponte-portata', v => { stato.carroponte.portata = v; notificaCambio(); });

  const btnTorna = $('btn-torna-commesse');
  if (btnTorna) {
    btnTorna.onclick = () => {
      salvaCommessaCorrente();
      mostraSchermataCommesse();
    };
  }
}

/* ============================================================
   HELPER
   ============================================================ */

function setVal(id, v) { const el = $(id); if (el) el.value = (v !== undefined && v !== null) ? v : ''; }
function setTxt(id, v) { const el = $(id); if (el) el.textContent = v; }
function setChk(id, v) { const el = $(id); if (el) el.checked = !!v; }
function setSelect(id, valore, opzioni) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = opzioni.map(o => '<option value="' + o.value + '">' + o.label + '</option>').join('');
  el.value = valore;
}
function bindNum(id, setter) {
  const el = $(id);
  if (!el) return;
  el.oninput = () => { const v = parseFloat(el.value); if (!isNaN(v)) setter(v); };
}
function bindChk(id, setter) {
  const el = $(id);
  if (!el) return;
  el.onchange = () => setter(el.checked);
}
function bindSel(id, setter) {
  const el = $(id);
  if (!el) return;
  el.onchange = () => setter(el.value);
}
function bindColor(id, setter) {
  const el = $(id);
  if (!el) return;
  el.oninput = () => setter(el.value);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatData(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export function aggiornaRisultati(s) {
  const d = calcolaDerivati(s);
  setTxt('rLunghezza', d.L.toFixed(2) + ' m');
  setTxt('rSuperficie', d.superficieCoperta.toFixed(2) + ' m²');
  setTxt('rVolume', d.volumeTotale.toFixed(2) + ' m³');
  setTxt('rPeso', d.pesoStimato.toFixed(2) + ' t');
  setTxt('rPilastri', d.numPilastri);
}

export function mostraStatus(m) {
  const el = $('status');
  if (el) el.textContent = m;
  const f = $('footer-status');
  if (f) f.textContent = m;
}