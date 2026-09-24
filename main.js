// main.js — Orchestratore: carica cataloghi, gestisce commesse + editor

import { caricaCataloghi } from './catalogo.js';

import {
  mostraSchermataCommesse,
  nuovaCommessaE,
  salvaCommessaCorrente,
  esportaCommessaCorrente,
  importaCommessaDaFile,
  aggiornaRisultati,
  getStato,
  setStato
} from './ui.js';

import {
  inizializzaScena3D,
  aggiornaScena3D,
  resizeScena3D,
  vistaIsometrica,
  vistaTop,
  vistaFront,
  vistaLato,
  toggleWireframe,
  nascondiElemento,
  deselezionaTutto
} from './scena3d.js';

import {
  inizializzaPianta,
  aggiornaPianta,
  resetPianta
} from './pianta.js';

import {
  inizializzaProspetti,
  aggiornaProspetti,
  resetProspetto
} from './prospetti.js';

import {
  inizializzaSezioni,
  aggiornaSezioni,
  resetSezioni
} from './sezioni.js';

import { esportaCSV } from './distinta.js';

import {
  esportaPiantaDXF,
  esportaProspettiDXF,
  esportaSezioniDXF
} from './export.js';

let editorInizializzato = false;

/* ============================================================
   COLLEGAMENTO SCHERMATA COMMESSE
   ============================================================ */

function collegaSchermataCommesse() {
  const btnNuova = document.getElementById('btn-nuova-commessa');
  if (btnNuova) btnNuova.onclick = () => nuovaCommessaE();

  const btnImporta = document.getElementById('btn-importa-commessa');
  if (btnImporta) btnImporta.onclick = () => importaCommessaDaFile();

  const btnSalva = document.getElementById('btn-salva');
  if (btnSalva) btnSalva.onclick = () => salvaCommessaCorrente();

  const btnEsp = document.getElementById('btn-esporta-commessa');
  if (btnEsp) btnEsp.onclick = () => esportaCommessaCorrente();
}

/* ============================================================
   COLLEGAMENTO EDITOR
   ============================================================ */

function collegaTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
      tab.classList.add('active');
      const view = document.getElementById('view-' + tab.dataset.view);
      if (view) view.classList.add('active');
      if (view) view.style.display = 'block';

      const v = tab.dataset.view;
      const s = getStato();

      if (v === '3d') setTimeout(() => resizeScena3D(), 50);
      if (v === 'pianta' && s) setTimeout(() => aggiornaPianta(s), 50);
      if (v === 'prospetto' && s) setTimeout(() => aggiornaProspetti(s), 50);
      if (v === 'sezione' && s) setTimeout(() => aggiornaSezioni(s), 50);
      if (v === 'distinta' && s) setTimeout(() => aggiornaRisultati(s), 50);
    };
  });
}

function collegaPulsantiEditor() {
  const b = (id) => document.getElementById(id);

  if (b('btn-iso')) b('btn-iso').onclick = () => vistaIsometrica();
  if (b('btn-top')) b('btn-top').onclick = () => vistaTop();
  if (b('btn-front')) b('btn-front').onclick = () => vistaFront();
  if (b('btn-lato')) b('btn-lato').onclick = () => vistaLato();
  if (b('btn-wire')) b('btn-wire').onclick = () => toggleWireframe();
  if (b('btn-reset-pianta')) b('btn-reset-pianta').onclick = () => resetPianta();

  document.querySelectorAll('.resetCanvas').forEach(btn => {
    btn.onclick = () => {
      const canvas = btn.dataset.canvas;
      if (canvas && canvas.indexOf('prospetto') === 0) {
        resetProspetto(canvas);
      } else if (canvas && canvas.indexOf('sezione') === 0) {
        resetSezioni();
      }
    };
  });

  if (b('btn-export-csv')) b('btn-export-csv').onclick = () => {
    const s = getStato();
    if (s) esportaCSV(s);
  };
  if (b('btn-export-dxf-pianta')) b('btn-export-dxf-pianta').onclick = () => {
    const s = getStato();
    if (s) esportaPiantaDXF(s);
  };
  if (b('btn-export-dxf-prospetti')) b('btn-export-dxf-prospetti').onclick = () => {
    const s = getStato();
    if (s) esportaProspettiDXF(s);
  };
  if (b('btn-export-dxf-sezioni')) b('btn-export-dxf-sezioni').onclick = () => {
    const s = getStato();
    if (s) esportaSezioniDXF(s);
  };
  if (b('btn-export-json')) b('btn-export-json').onclick = () => {
    const s = getStato();
    if (!s) return;
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cacem-progetto.json';
    a.click();
    URL.revokeObjectURL(url);
  };
}

/* ============================================================
   ATTIVA EDITOR (quando si apre una commessa)
   ============================================================ */

export function attivaEditor(statoIniziale) {
  if (!editorInizializzato) {
    try {
      inizializzaScena3D();
    } catch (e) { console.warn('3D init:', e.message); }

    try {
      inizializzaPianta(document.getElementById('piantaCanvas'));
    } catch (e) { console.warn('Pianta init:', e.message); }

    try {
      inizializzaProspetti();
    } catch (e) { console.warn('Prospetti init:', e.message); }

    try {
      inizializzaSezioni();
    } catch (e) { console.warn('Sezioni init:', e.message); }

    editorInizializzato = true;

    collegaTabs();
    collegaPulsantiEditor();

    window.addEventListener('resize', () => {
      try { resizeScena3D(); } catch (e) { /* silent */ }
    });
  }

  const s = statoIniziale || getStato();
  if (!s) return;

  try { aggiornaScena3D(s); } catch (e) { console.warn('3D:', e.message); }
  try { aggiornaPianta(s); } catch (e) { console.warn('Pianta:', e.message); }
  try { aggiornaProspetti(s); } catch (e) { console.warn('Prospetti:', e.message); }
  try { aggiornaSezioni(s); } catch (e) { console.warn('Sezioni:', e.message); }
  try { aggiornaRisultati(s); } catch (e) { console.warn('Risultati:', e.message); }
}

/* ============================================================
   AVVIO
   ============================================================ */

async function avvia() {
  try {
    await caricaCataloghi();
  } catch (err) {
    console.error('Errore caricamento cataloghi:', err);
    alert('Errore caricamento cataloghi. Controlla la console.');
    return;
  }

  collegaSchermataCommesse();
  mostraSchermataCommesse();

  window.attivaEditor = attivaEditor;
}

window.CACEM_nascondiElemento = nascondiElemento;
window.CACEM_deselezionaTutto = deselezionaTutto;

window.addEventListener('cacem:state-change', (e) => {
  const s = e.detail && e.detail.stato;
  if (!s) return;
  try { aggiornaScena3D(s); } catch (err) { console.warn('3D:', err.message); }
  try { aggiornaPianta(s); } catch (err) { console.warn('Pianta:', err.message); }
  try { aggiornaProspetti(s); } catch (err) { console.warn('Prospetti:', err.message); }
  try { aggiornaSezioni(s); } catch (err) { console.warn('Sezioni:', err.message); }
});

window.addEventListener('cacem:editor-open', (e) => {
  const stato = e.detail && e.detail.stato;
  setTimeout(() => {
    try {
      attivaEditor(stato);
    } catch (err) {
      console.warn('Errore attivazione editor:', err.message);
    }
  }, 150);
});

avvia();