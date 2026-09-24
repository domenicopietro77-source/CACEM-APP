// ui.js — Gestione UI editor + schermata commesse

import {
  statoDefault,
  calcolaMisureInterne,
  calcolaInterasse,
  calcolaDerivati,
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

import { catalogo } from './catalogo.js';
import { aggiornaDistinta } from './distinta.js';

const $ = (id) => document.getElementById(id);

let stato = null;
let onChange = () => {};

export function getStato() {
  return stato;
}

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
    listaEl.innerHTML = lista.map(c => (
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
    )).join('');

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
  if (azione === 'apri') {
    apriCommessaE(id);
    return;
  }

  if (azione === 'rinomina') {
    const c = getCommessa(id);
    if (!c) return;
    rinominaConModale(id, c.nome);
    return;
  }

  if (azione === 'duplica') {
    duplicaCommessa(id);
    mostraSchermataCommesse();
    return;
  }

  if (azione === 'elimina') {
    const c = getCommessa(id);
    if (!c) return;
    const modale = document.getElementById('modale-elimina');
    const nomeEl = document.getElementById('modale-elimina-nome');
    const btnOk = document.getElementById('modale-elimina-ok');
    const btnAnnulla = document.getElementById('modale-elimina-annulla');

    if (!modale) return;
    if (nomeEl) nomeEl.textContent = c.nome;
    modale.style.display = 'flex';

    const chiudi = () => {
      modale.style.display = 'none';
      btnOk.onclick = null;
      btnAnnulla.onclick = null;
    };

    btnOk.onclick = () => {
      chiudi();
      eliminaCommessa(id);
      mostraSchermataCommesse();
    };
    btnAnnulla.onclick = chiudi;
    return;
  }
}

export function apriCommessaE(id) {
  const c = apriCommessa(id);
  if (!c) return;
  setStato(c.stato);

  const schermataEl = $('schermata-commesse');
  const editorEl = $('schermata-editor');
  if (schermataEl) schermataEl.style.display = 'none';
  if (editorEl) editorEl.style.display = 'flex';

  const nomeEl = $('commessa-nome');
  if (nomeEl) nomeEl.textContent = c.nome;

  renderUI();
  collegaListener();
  notificaCambio();
  window.dispatchEvent(new CustomEvent('cacem:editor-open', { detail: { stato: c.stato } }));
}

export function nuovaCommessaE() {
  const modale = document.getElementById('modale-commessa');
  const input = document.getElementById('modale-input-nome');
  const btnOk = document.getElementById('modale-btn-ok');
  const btnAnnulla = document.getElementById('modale-btn-annulla');

  if (!modale || !input) {
    console.warn('Modale commessa non trovata');
    return;
  }

  const dataOdierna = new Date().toLocaleDateString('it-IT');
  input.value = 'Capannone ' + dataOdierna;
  modale.style.display = 'flex';
  setTimeout(() => input.focus(), 50);

  const chiudi = () => {
    modale.style.display = 'none';
    btnOk.onclick = null;
    btnAnnulla.onclick = null;
    input.onkeydown = null;
  };

  const conferma = () => {
    const nome = input.value.trim();
    if (!nome) return;
    chiudi();
    creaEapri(nome);
  };

  btnOk.onclick = conferma;
  btnAnnulla.onclick = chiudi;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') conferma();
    if (e.key === 'Escape') chiudi();
  };
}

function creaEapri(nome) {
  const c = creaCommessa(nome, statoDefault());
  setStato(c.stato);

  const schermataEl = $('schermata-commesse');
  const editorEl = $('schermata-editor');
  if (schermataEl) schermataEl.style.display = 'none';
  if (editorEl) editorEl.style.display = 'flex';

  const nomeEl = $('commessa-nome');
  if (nomeEl) nomeEl.textContent = c.nome;

  renderUI();
  collegaListener();

  // Notifica al main.js di attivare l'editor
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
    importaCommessa(file).then(() => {
      mostraSchermataCommesse();
    }).catch(err => {
      alert('Errore importazione: ' + err.message);
    });
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
  // NOTIFICA TUTTI I MODULI VISIVI
  window.dispatchEvent(new CustomEvent('cacem:state-change', { detail: { stato: stato } }));
}

/* ============================================================
   RENDER UI
   ============================================================ */

export function renderUI() {
  if (!stato) return;

  const me = stato.misureEsterne;
  const mi = stato.misureInterne;
  const c = stato.campate;
  const g = stato.generale;
  const p = stato.pilastri;
  const pann = stato.pannelli;

  setVal('ext-lunghezza', me.lunghezza);
  setVal('ext-larghezza', me.larghezza);
  setSelect('ext-spessore-pannello', String(me.spessorePannello), [
    { value: '20', label: '20 + 1 cm tolleranza' },
    { value: '24', label: '24 + 1 cm tolleranza' },
    { value: '28', label: '28 + 2 cm tolleranza' }
  ]);

  setTxt('info-lung-interna', mi.lunghezza.toFixed(2));
  setTxt('info-larg-interna', mi.larghezza.toFixed(2));

  setSelect('campate-verso', c.verso, [
    { value: 'X', label: 'Lungo X (lunghezza)' },
    { value: 'Y', label: 'Lungo Y (larghezza)' }
  ]);
  setVal('campate-numero', c.numero);
  setTxt('info-interasse', c.interasse.toFixed(3));

  setSelect('copertura-tipo', stato.copertura.tipo, [
    { value: 'AL', label: 'AL — Alari' },
    { value: 'Y', label: 'Y' },
    { value: 'TT', label: 'TT' }
  ]);

  popolaSelectTravi();
  setVal('trave-banchina', stato.travi.banchina);
  setVal('trave-trasversale', stato.travi.trasversale);

  setVal('pilastro-base', p.base);
  setVal('pilastro-alt-sezione', p.altezzaSezione);
  setVal('pilastro-altezza', g.altezzaPilastro);
  setChk('pilastro-pluviale', p.pluviale);
  setVal('pilastro-pluviale-diametro', p.pluvialeDiametro);
  popolaSelectFondazioni();
  setVal('pilastro-fondazione', p.fondazione);

  setVal('pannello-finitura', pann.finitura);
  setVal('graniglia-colore-1', pann.coloriGraniglia[0]);
  setVal('graniglia-colore-2', pann.coloriGraniglia[1]);
  setVal('graniglia-perc-1', pann.percentualiGraniglia[0]);

  setChk('extra-interpiano', g.interpiano);
  setChk('extra-carroponte', g.carroponte);
  setSelect('trave-banchina', stato.travi.banchina, [
    { value: 'TU', label: 'TU — Trave a U canale' },
    { value: 'TNL', label: 'TNL — Trave T nuova linea' }
  ]);
  setSelect('trave-centrale', stato.travi.centrale, [
    { value: 'TI', label: 'TI — Trave a I' }
  ]);
  setSelect('pilastro-tipo-fondazione', stato.pilastri.tipoFondazione, [
    { value: 'bicchiere', label: 'Bicchiere' },
    { value: 'armatubo', label: 'Armatubo' }
  ]);
  setSelect('pilastro-tipo-bicchiere', stato.pilastri.tipoBicchiere, [
    { value: 'bicchiere_laterale', label: 'Laterale con pluviale' },
    { value: 'bicchiere_pluviale', label: 'Con pluviale' },
    { value: 'bicchiere_centrale', label: 'Centrale senza pluviale' }
  ]);
  setVal('extra-interpiano', stato.generale.interpiano);
  setVal('interpiano-livelli', stato.generale.interpianoLivelli);
  setVal('interpiano-h1', stato.generale.interpianoH1);
  setVal('interpiano-h2', stato.generale.interpianoH2);
  setVal('interpiano-solaio', stato.generale.interpianoSolaio);
  setVal('extra-carroponte', stato.generale.carroponte);
  setVal('carroponte-portata', stato.generale.portataCarroponte);
  setVal('carroponte-altezza', stato.generale.altezzaEstradossoCarroponte);
  setVal('pendenza-copertura', stato.generale.pendenzaCopertura);
  setVal('graniglia-tipo', stato.pannelli.granigliaTipo);
  setVal('graniglia-colore-1', stato.pannelli.coloriGraniglia[0]);
  setVal('graniglia-colore-2', stato.pannelli.coloriGraniglia[1]);
  setVal('graniglia-perc-1', stato.pannelli.percentualiGraniglia[0]);
  setVal('graniglia-perc-2', stato.pannelli.percentualiGraniglia[1]);

  const bloccoG = document.getElementById('blocco-graniglia');
  if (bloccoG) {
    bloccoG.style.display = stato.pannelli.finitura === 'GR' ? 'block' : 'none';
  }
  const labelC2 = document.getElementById('label-colore-2');
  const labelP2 = document.getElementById('label-perc-2');
  const mostra2 = stato.pannelli.granigliaTipo === 2;
  if (labelC2) labelC2.style.display = mostra2 ? 'flex' : 'none';
  if (labelP2) labelP2.style.display = mostra2 ? 'flex' : 'none';

  const l = stato.listino || {};
  setVal('listino-fondazioni', l.fondazioni);
  setVal('listino-pilastri', l.pilastri);
  setVal('listino-travi', l.travi);
  setVal('listino-tegoli', l.tegoli);
  setVal('listino-pannelli', l.pannelli);
  setVal('listino-solaio', l.solaio);
  setVal('listino-coppelle', l.coppelle);
}

function popolaSelectTravi() {
  const lista = Array.isArray(catalogo.travi) ? catalogo.travi : [];
  const opts = lista.map(t => '<option value="' + t.id + '">' + t.id + ' — ' + (t.nome || '') + '</option>').join('');
  const b = $('trave-banchina');
  const t = $('trave-trasversale');
  if (b) b.innerHTML = opts;
  if (t) t.innerHTML = opts;
}

function popolaSelectFondazioni() {
  const lista = (catalogo.fondazioni && catalogo.fondazioni.tipi) || [];
  const opts = lista.map(f => '<option value="' + f.id + '">' + f.nome + '</option>').join('');
  const s = $('pilastro-fondazione');
  if (s) s.innerHTML = opts;
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
    calcolaInterasse(stato);
    notificaCambio();
  });

  bindNum('ext-larghezza', v => {
    stato.misureEsterne.larghezza = v;
    calcolaMisureInterne(stato);
    calcolaInterasse(stato);
    notificaCambio();
  });

  bindSel('ext-spessore-pannello', v => {
    stato.misureEsterne.spessorePannello = parseInt(v, 10);
    stato.pannelli.spessore = parseInt(v, 10);
    calcolaMisureInterne(stato);
    calcolaInterasse(stato);
    notificaCambio();
  });

  bindSel('campate-verso', v => {
    stato.campate.verso = v;
    calcolaInterasse(stato);
    notificaCambio();
  });

  bindNum('campate-numero', v => {
    stato.campate.numero = Math.max(1, Math.floor(v));
    calcolaInterasse(stato);
    notificaCambio();
  });

  bindSel('copertura-tipo', v => {
    stato.copertura.tipo = v;
    stato.copertura.tegoloId = v;
    notificaCambio();
  });

  bindSel('trave-banchina', v => { stato.travi.banchina = v; notificaCambio(); });
  bindSel('trave-trasversale', v => { stato.travi.trasversale = v; notificaCambio(); });

  bindNum('pilastro-base', v => { stato.pilastri.base = v; notificaCambio(); });
  bindNum('pilastro-alt-sezione', v => { stato.pilastri.altezzaSezione = v; notificaCambio(); });
  bindNum('pilastro-altezza', v => { stato.generale.altezzaPilastro = v; notificaCambio(); });
  bindChk('pilastro-pluviale', v => { stato.pilastri.pluviale = v; notificaCambio(); });
  bindSel('pilastro-pluviale-diametro', v => { stato.pilastri.pluvialeDiametro = parseInt(v, 10); notificaCambio(); });
  bindSel('pilastro-fondazione', v => { stato.pilastri.fondazione = v; notificaCambio(); });

  bindSel('pannello-finitura', v => { stato.pannelli.finitura = v; notificaCambio(); });
  bindColor('graniglia-colore-1', v => { stato.pannelli.coloriGraniglia[0] = v; notificaCambio(); });
  bindColor('graniglia-colore-2', v => { stato.pannelli.coloriGraniglia[1] = v; notificaCambio(); });
  bindNum('graniglia-perc-1', v => {
    stato.pannelli.percentualiGraniglia[0] = v;
    stato.pannelli.percentualiGraniglia[1] = 100 - v;
    notificaCambio();
  });

  bindSel('pilastro-tipo-fondazione', v => { stato.pilastri.tipoFondazione = v; notificaCambio(); });
  bindSel('pilastro-tipo-bicchiere', v => { stato.pilastri.tipoBicchiere = v; notificaCambio(); });
  bindSel('trave-centrale', v => { stato.travi.centrale = v; notificaCambio(); });
  bindChk('trave-centrale-attiva', v => { stato.travi.centraleAttiva = v; notificaCambio(); });
  bindChk('extra-interpiano', v => { stato.generale.interpiano = v; notificaCambio(); });
  bindSel('interpiano-livelli', v => { stato.generale.interpianoLivelli = parseInt(v,10); notificaCambio(); });
  bindNum('interpiano-h1', v => { stato.generale.interpianoH1 = v; notificaCambio(); });
  bindNum('interpiano-h2', v => { stato.generale.interpianoH2 = v; notificaCambio(); });
  bindSel('interpiano-solaio', v => { stato.generale.interpianoSolaio = v; notificaCambio(); });
  bindChk('extra-carroponte', v => { stato.generale.carroponte = v; notificaCambio(); });
  bindNum('carroponte-portata', v => { stato.generale.portataCarroponte = v; notificaCambio(); });
  bindNum('carroponte-altezza', v => { stato.generale.altezzaEstradossoCarroponte = v; notificaCambio(); });
  bindNum('pendenza-copertura', v => { stato.generale.pendenzaCopertura = v; notificaCambio(); });
  bindSel('graniglia-tipo', v => { stato.pannelli.granigliaTipo = parseInt(v,10); notificaCambio(); });
  bindColor('graniglia-colore-1', v => { stato.pannelli.coloriGraniglia[0] = v; notificaCambio(); });
  bindColor('graniglia-colore-2', v => { stato.pannelli.coloriGraniglia[1] = v; notificaCambio(); });
  bindNum('graniglia-perc-1', v => {
    stato.pannelli.percentualiGraniglia[0] = v;
    stato.pannelli.percentualiGraniglia[1] = 100 - v;
    notificaCambio();
  });

  bindChk('extra-interpiano', v => { stato.generale.interpiano = v; notificaCambio(); });
  bindChk('extra-carroponte', v => { stato.generale.carroponte = v; notificaCambio(); });
  bindNum('pendenza-copertura', v => { stato.generale.pendenzaCopertura = v; notificaCambio(); });

  const btnTorna = $('btn-torna-commesse');
  if (btnTorna) {
    btnTorna.onclick = () => {
      salvaCommessaCorrente();
      mostraSchermataCommesse();
    };
  }

  if (!stato.listino) stato.listino = { fondazioni:280, pilastri:320, travi:390, tegoli:420, pannelli:350, solaio:300, coppelle:28 };
  bindNum('listino-fondazioni', v => { stato.listino.fondazioni = v; notificaCambio(); });
  bindNum('listino-pilastri', v => { stato.listino.pilastri = v; notificaCambio(); });
  bindNum('listino-travi', v => { stato.listino.travi = v; notificaCambio(); });
  bindNum('listino-tegoli', v => { stato.listino.tegoli = v; notificaCambio(); });
  bindNum('listino-pannelli', v => { stato.listino.pannelli = v; notificaCambio(); });
  bindNum('listino-solaio', v => { stato.listino.solaio = v; notificaCambio(); });
  bindNum('listino-coppelle', v => { stato.listino.coppelle = v; notificaCambio(); });
}

function rinominaConModale(id, nomeAttuale) {
  const modale = document.getElementById('modale-rinomina');
  const input = document.getElementById('modale-rinomina-input');
  const btnOk = document.getElementById('modale-rinomina-ok');
  const btnAnnulla = document.getElementById('modale-rinomina-annulla');

  if (!modale || !input) return;

  input.value = nomeAttuale;
  modale.style.display = 'flex';
  setTimeout(() => input.focus(), 50);

  const chiudi = () => {
    modale.style.display = 'none';
    btnOk.onclick = null;
    btnAnnulla.onclick = null;
  };

  const conferma = () => {
    const nuovo = input.value.trim();
    if (!nuovo) return;
    chiudi();
    rinominaCommessa(id, nuovo);
    mostraSchermataCommesse();
  };

  btnOk.onclick = conferma;
  btnAnnulla.onclick = chiudi;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') conferma();
    if (e.key === 'Escape') chiudi();
  };
}

/* ============================================================
   HELPER
   ============================================================ */

function setVal(id, v) {
  const el = $(id);
  if (el) el.value = (v !== undefined && v !== null) ? v : '';
}

function setTxt(id, v) {
  const el = $(id);
  if (el) el.textContent = v;
}

function setChk(id, v) {
  const el = $(id);
  if (el) el.checked = !!v;
}

function setSelect(id, valore, opzioni) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = opzioni.map(o => '<option value="' + o.value + '">' + o.label + '</option>').join('');
  el.value = valore;
}

function bindNum(id, setter) {
  const el = $(id);
  if (!el) return;
  el.oninput = () => {
    const v = parseFloat(el.value);
    if (isNaN(v)) return;
    setter(v);
  };
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
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function formatData(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
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
  try {
    aggiornaDistinta(s);
  } catch (e) {
    console.warn('Distinta:', e.message);
  }
}

export function mostraStatus(m) {
  const el = $('status');
  if (el) el.textContent = m;
  const f = $('footer-status');
  if (f) f.textContent = m;
}

window.addEventListener('cacem:elemento-selezionato', (e) => {
  const elemento = e.detail && e.detail.elemento;
  if (!elemento) return;

  const modale = document.getElementById('modale-elemento');
  const titolo = document.getElementById('modale-elemento-titolo');
  const info = document.getElementById('modale-elemento-info');
  const btnChiudi = document.getElementById('modale-elemento-chiudi');
  const btnElimina = document.getElementById('modale-elemento-elimina');

  if (!modale) return;

  const etichette = {
    'pilastro': 'Pilastro',
    'trave-banchina': 'Trave banchina',
    'fondazione': 'Fondazione',
    'pannello': 'Pannello tamponamento',
    'copertura': 'Falda copertura',
    'terreno': 'Terreno',
    'interpiano': 'Interpiano',
    'carroponte': 'Carroponte'
  };

  titolo.textContent = etichette[elemento.tipo] || elemento.tipo;
  info.innerHTML = 
    '<div>ID: ' + elemento.id + '</div>' +
    (elemento.lato ? '<div>Lato: ' + elemento.lato + '</div>' : '') +
    (elemento.falda ? '<div>Falda: ' + elemento.falda + '</div>' : '');

  modale.style.display = 'flex';

  const chiudi = () => {
    modale.style.display = 'none';
    // Chiama il deseleziona esterno
    if (window.CACEM_deselezionaTutto) window.CACEM_deselezionaTutto();
  };

  btnChiudi.onclick = chiudi;
  btnElimina.onclick = () => {
    if (elemento.tipo === 'terreno' || elemento.tipo === 'copertura') {
      alert('Non puoi eliminare questo elemento.');
      return;
    }
    if (confirm('Eliminare ' + (etichette[elemento.tipo] || elemento.tipo) + '?')) {
      if (window.CACEM_nascondiElemento) {
        window.CACEM_nascondiElemento(elemento.tipo, elemento.id);
      }
      chiudi();
    }
  };
});
