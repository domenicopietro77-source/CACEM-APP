// ui.js — Gestione UI editor + schermata commesse (CACEM v8)

import {
  statoDefault,
  calcolaMisureInterne,
  dividiCampateX,
  calcolaFileY,
  calcolaTraviTU,
  calcolaTraviTI,
  calcolaTegoli,
  generaModuliPannelli,
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

import { aggiornaDistinta } from './distinta.js';

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
  // Calcola subito tutto
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
  const cop = stato.copertura;

  // Misure esterne
  setVal('ext-lunghezza', me.lunghezza);
  setVal('ext-larghezza', me.larghezza);
  setSelect('ext-spessore-pannello', String(me.spessorePannello), [
    { value: '20', label: '20 + 1 cm' },
    { value: '24', label: '24 + 1 cm' },
    { value: '28', label: '28 + 2 cm' }
  ]);
  setTxt('info-lung-interna', mi.lunghezza.toFixed(2));
  setTxt('info-larg-interna', mi.larghezza.toFixed(2));

  // Campate X
  setSelect('campate-verso', 'X', [
    { value: 'X', label: 'Lungo X (lunghezza)' }
  ]);
  setVal('campate-numero', cx.numero);
  setTxt('info-interasse', cx.lista[0] ? cx.lista[0].interasse.toFixed(3) : '—');

  // Copertura
  setSelect('copertura-tipo', cop.tipo, [
    { value: 'AL', label: 'AL — Alari' }
  ]);
  setSelect('trave-banchina', 'TU', [
    { value: 'TU', label: 'TU — Trave a U (banchina)' }
  ]);
  setVal('pendenza-copertura', cop.pendenza);

  // Altezze
  setVal('altezza-pilastro', a.altezzaPilastro);
  setVal('modulo-pannello-vert', a.moduloPannelloVert);
  setVal('finestra-piccola', a.finestraPiccola);
  setVal('porta-piccola', a.portaPiccola);

  // Pilastri
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

  // Pannelli
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
  setVal('modulo-pannello-std', pan.moduloStandard);

  // Visibilità blocchi
  const blocG = $('blocco-graniglia');
  if (blocG) blocG.style.display = (pan.finitura === 'GR') ? 'block' : 'none';
  const labelC2 = $('label-colore-2');
  const labelP2 = $('label-perc-2');
  const mostra2 = pan.granigliaTipo === 2;
  if (labelC2) labelC2.style.display = mostra2 ? 'flex' : 'none';
  if (labelP2) labelP2.style.display = mostra2 ? 'flex' : 'none';

  // Interpiano
  setChk('extra-interpiano', stato.interpiano.attivo);
  setVal('interpiano-livelli', stato.interpiano.numLivelli);
  setVal('interpiano-h1', stato.interpiano.h1);
  setVal('interpiano-h2', stato.interpiano.h2);
  setVal('interpiano-solaio', stato.interpiano.tipoSolaio);

  // Carroponte
  setChk('extra-carroponte', stato.carroponte.attivo);
  setVal('carroponte-portata', stato.carroponte.portata);
  setVal('carroponte-altezza', stato.carroponte.altezzaEstradosso);
}

/* ============================================================
   LISTENER
   ============================================================ */

let listenerCollegati = false;

function collegaListener() {
  if (listenerCollegati) return;
  listenerCollegati = true;

  // Misure esterne
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

  // Campate
  bindNum('campate-numero', v => {
    stato.campateX.numero = Math.max(1, Math.floor(v));
    stato.campateX.auto = false;
    dividiCampateX(stato);
    calcolaTraviTU(stato);
    calcolaTraviTI(stato);
    notificaCambio();
  });

  // Copertura
  bindNum('pendenza-copertura', v => { stato.copertura.pendenza = v; notificaCambio(); });

  // Altezze
  bindNum('altezza-pilastro', v => { stato.altezze.altezzaPilastro = v; notificaCambio(); });
  bindNum('modulo-pannello-vert', v => { stato.altezze.moduloPannelloVert = v; notificaCambio(); });
  bindNum('finestra-piccola', v => { stato.altezze.finestraPiccola = v; notificaCambio(); });
  bindNum('porta-piccola', v => { stato.altezze.portaPiccola = v; notificaCambio(); });

  // Pilastri
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
  bindNum('pilastro-pluviale-diametro', v => { stato.pilastri.pluvialeDiametro = v; notificaCambio(); });
  bindSel('pilastro-tipo-fondazione', v => { stato.pilastri.tipoFondazione = v; notificaCambio(); });
  bindSel('pilastro-tipo-bicchiere', v => { stato.pilastri.tipoBicchiere = v; notificaCambio(); });

  // Pannelli
  bindSel('pannello-finitura', v => { stato.pannelli.finitura = v; notificaCambio(); });
  bindSel('graniglia-tipo', v => { stato.pannelli.granigliaTipo = parseInt(v, 10); notificaCambio(); });
  bindColor('graniglia-colore-1', v => { stato.pannelli.coloriGraniglia[0] = v; notificaCambio(); });
  bindColor('graniglia-colore-2', v => { stato.pannelli.coloriGraniglia[1] = v; notificaCambio(); });
  bindNum('graniglia-perc-1', v => {
    stato.pannelli.percentualiGraniglia[0] = v;
    stato.pannelli.percentualiGraniglia[1] = 100 - v;
    notificaCambio();
  });
  bindNum('graniglia-perc-2', v => {
    stato.pannelli.percentualiGraniglia[1] = v;
    stato.pannelli.percentualiGraniglia[0] = 100 - v;
    notificaCambio();
  });
  bindNum('modulo-pannello-std', v => { stato.pannelli.moduloStandard = v; notificaCambio(); });

  // Interpiano
  bindChk('extra-interpiano', v => { stato.interpiano.attivo = v; notificaCambio(); });
  bindSel('interpiano-livelli', v => { stato.interpiano.numLivelli = parseInt(v, 10); notificaCambio(); });
  bindNum('interpiano-h1', v => { stato.interpiano.h1 = v; notificaCambio(); });
  bindNum('interpiano-h2', v => { stato.interpiano.h2 = v; notificaCambio(); });
  bindSel('interpiano-solaio', v => { stato.interpiano.tipoSolaio = v; notificaCambio(); });

  // Carroponte
  bindChk('extra-carroponte', v => { stato.carroponte.attivo = v; notificaCambio(); });
  bindNum('carroponte-portata', v => { stato.carroponte.portata = v; notificaCambio(); });
  bindNum('carroponte-altezza', v => { stato.carroponte.altezzaEstradosso = v; notificaCambio(); });

  // Torna a commesse
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

/* ============================================================
   RISULTATI
   ============================================================ */

export function aggiornaRisultati(s) {
  const d = calcolaDerivati(s);
  setTxt('rLunghezza', d.L.toFixed(2) + ' m');
  setTxt('rSuperficie', d.superficieCoperta.toFixed(2) + ' m²');
  setTxt('rVolume', d.volumeTotale.toFixed(2) + ' m³');
  setTxt('rPeso', d.pesoStimato.toFixed(2) + ' t');
  setTxt('rPilastri', d.numPilastri);
  try { aggiornaDistinta(s); } catch (e) { console.warn('Distinta:', e.message); }
}
