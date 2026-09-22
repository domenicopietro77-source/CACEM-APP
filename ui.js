// ui.js — Binding tra input HTML, stato del modello e aggiornamento risultati

import { calcolaDerivati, salvaStato, lunghezzaTotale } from './modello.js';
import { catalogo } from './catalogo.js';
import { aggiornaDistinta } from './distinta.js';

let stato = null;
let onChange = () => {};
const $ = (id) => document.getElementById(id);

/**
 * Inizializza l'interfaccia: popola i valori e collega i listener.
 */
export function inizializzaUI(s, onCambia) {
  stato = s;
  onChange = onCambia || (() => {});
  renderUI();
  collegaListener();
}

/**
 * Rilegge lo stato e ridisegna l'interfaccia.
 */
export function renderUI() {
  if (!stato) return;
  const g = stato.generale;

  // --- Generali ---
  setVal('luce', g.luce);
  setVal('altezzaPilastro', g.altezzaPilastro);
  setVal('pendenzaCopertura', g.pendenzaCopertura);
  setVal('altezzaInterpiano', g.altezzaInterpiano);
  setVal('portataCarroponte', g.portataCarroponte);
  setChk('interpiano', g.interpiano);
  setChk('carroponte', g.carroponte);

  // --- Pilastri ---
  setVal('pilastroBase', stato.pilastri.base);
  setVal('pilastroAltezzaSezione', stato.pilastri.altezzaSezione);
  setChk('pilastroPluviale', stato.pilastri.pluviale);
  setVal('pilastroPluvialeDiametro', stato.pilastri.pluvialeDiametro);
  setSelect('pilastroFondazione', stato.pilastri.fondazione, popolaFondazioni());

  // --- Travi ---
  setSelect('traveTipo', stato.travi.tipoBanchina, popolaTravi());

  // --- Tegolo ---
  setSelect('tegoloTipo', stato.copertura.tegoloId, popolaTegoli());

  // --- Pannelli ---
  setSelect('pannelloTipo', stato.pannelli.tipo, [
    { value: 'V', label: 'V · Verticale' },
    { value: 'O', label: 'O · Orizzontale' }
  ]);
  setSelect('pannelloSpessore', stato.pannelli.spessore, [
    { value: 20, label: '20 cm' },
    { value: 24, label: '24 cm' },
    { value: 28, label: '28 cm' }
  ]);
  setSelect('pannelloFinitura', stato.pannelli.finitura, [
    { value: 'FV', label: 'FV · Faccia vista' },
    { value: 'GR', label: 'GR · Granigliato' }
  ]);

  // --- Campate ---
  renderCampate();
}

/**
 * Popola la lista campate.
 */
function renderCampate() {
  const cont = $('campateList');
  if (!cont) return;
  cont.innerHTML = stato.campate.map((c, i) => 
    '<div class="campata-row">' +
      '<label>Campata ' + (i + 1) +
        '<input type="number" data-idx="' + i + '" step="0.5" min="3" max="40" value="' + c.interasse + '">' +
      '</label>' +
      '<span>m</span>' +
    '</div>'
  ).join('');
  cont.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const idx = parseInt(inp.dataset.idx, 10);
      const val = parseFloat(inp.value);
      if (!isNaN(val) && val > 0) {
        stato.campate[idx].interasse = val;
        onChange(stato);
      }
    });
  });
}

/**
 * Collega i listener degli input.
 */
function collegaListener() {
  // Generali
  bindNum('luce', (v) => stato.generale.luce = v);
  bindNum('altezzaPilastro', (v) => stato.generale.altezzaPilastro = v);
  bindNum('pendenzaCopertura', (v) => stato.generale.pendenzaCopertura = v);
  bindNum('altezzaInterpiano', (v) => stato.generale.altezzaInterpiano = v);
  bindNum('portataCarroponte', (v) => stato.generale.portataCarroponte = v);
  bindChk('interpiano', (v) => stato.generale.interpiano = v);
  bindChk('carroponte', (v) => stato.generale.carroponte = v);

  // Pilastri
  bindNum('pilastroBase', (v) => stato.pilastri.base = v);
  bindNum('pilastroAltezzaSezione', (v) => stato.pilastri.altezzaSezione = v);
  bindChk('pilastroPluviale', (v) => stato.pilastri.pluviale = v);
  bindNum('pilastroPluvialeDiametro', (v) => stato.pilastri.pluvialeDiametro = v);
  bindSel('pilastroFondazione', (v) => stato.pilastri.fondazione = v);

  // Travi
  bindSel('traveTipo', (v) => stato.travi.tipoBanchina = v);

  // Tegolo
  bindSel('tegoloTipo', (v) => stato.copertura.tegoloId = v);

  // Pannelli
  bindSel('pannelloTipo', (v) => stato.pannelli.tipo = v);
  bindSel('pannelloSpessore', (v) => stato.pannelli.spessore = parseInt(v, 10));
  bindSel('pannelloFinitura', (v) => stato.pannelli.finitura = v);

  // Campate
  const addBtn = $('addCampata');
  if (addBtn) {
    addBtn.onclick = () => {
      const last = stato.campate[stato.campate.length - 1];
      const nuovoInterasse = last ? last.interasse : 15;
      stato.campate.push({ id: stato.campate.length + 1, interasse: nuovoInterasse });
      renderUI();
      onChange(stato);
    };
  }
  const remBtn = $('removeCampata');
  if (remBtn) {
    remBtn.onclick = () => {
      if (stato.campate.length > 1) {
        stato.campate.pop();
        renderUI();
        onChange(stato);
      }
    };
  }
}

// --- Helper ---
function setVal(id, v) {
  const el = $(id);
  if (!el) return;
  el.value = v !== undefined && v !== null ? v : '';
}

function setChk(id, v) {
  const el = $(id);
  if (!el) return;
  el.checked = !!v;
}

function setSelect(id, valore, opzioni) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = opzioni.map(o => 
    '<option value="' + o.value + '">' + o.label + '</option>'
  ).join('');
  el.value = valore;
}

function bindNum(id, setter) {
  const el = $(id);
  if (!el) return;
  el.oninput = () => {
    const v = parseFloat(el.value);
    if (isNaN(v)) return;
    setter(v);
    onChange(stato);
    salvaStato(stato);
  };
}

function bindChk(id, setter) {
  const el = $(id);
  if (!el) return;
  el.onchange = () => {
    setter(el.checked);
    onChange(stato);
    salvaStato(stato);
  };
}

function bindSel(id, setter) {
  const el = $(id);
  if (!el) return;
  el.onchange = () => {
    setter(el.value);
    onChange(stato);
    salvaStato(stato);
  };
}

function popolaFondazioni() {
  const lista = (catalogo.fondazioni && catalogo.fondazioni.tipi) || [];
  return lista.map(f => ({ value: f.id, label: f.nome }));
}

function popolaTravi() {
  const lista = Array.isArray(catalogo.travi) ? catalogo.travi : [];
  return lista.map(t => ({ value: t.id, label: t.id + ' · ' + (t.nome || '') }));
}

function popolaTegoli() {
  const lista = Array.isArray(catalogo.tegoli) ? catalogo.tegoli : [];
  return lista.map(t => ({ value: t.id, label: t.id + ' · ' + (t.nome || '') }));
}

// --- Aggiornamento risultati ---
export function aggiornaRisultati(s) {
  const d = calcolaDerivati(s);
  setVal('rLunghezza', d.L.toFixed(2) + ' m');
  setVal('rSuperficie', d.superficieCoperta.toFixed(2) + ' m²');
  setVal('rVolume', d.volumeTotale.toFixed(2) + ' m³');
  setVal('rPeso', d.pesoStimato.toFixed(2) + ' t');
  setVal('rPilastri', d.numPilastri);
  try {
    aggiornaDistinta(s);
  } catch (e) {
    console.warn('Distinta non aggiornata:', e.message);
  }
}

export function mostraStatus(m) {
  const el = $('status');
  if (!el) return;
  el.textContent = m;
}