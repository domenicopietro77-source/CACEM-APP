// main.js — Orchestratore CACEM v9 (integrato)

import { caricaCataloghi } from './catalogo.js';
import {
  mostraSchermataCommesse,
  nuovaCommessaE,
  salvaCommessaCorrente,
  esportaCommessaCorrente,
  importaCommessaDaFile,
  aggiornaRisultati,
  getStato
} from './ui.js';

import {
  inizializzaRenderer3D,
  aggiornaRenderer3D,
  resizeRenderer3D,
  vistaIso,
  vistaTop,
  vistaFront,
  vistaLato
} from './renderer3d.js';

import {
  inizializzaViste2D,
  aggiornaViste2D
} from './viste2d.js';

import { aggiornaDistinta, esportaCSV } from './distinta.js';
import { esportaPiantaDXF, esportaSezioniDXF, esportaJSON } from './export.js';

let editorInizializzato = false;

/* ============================================================
   COLLEGAMENTI
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

function collegaTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
      });
      tab.classList.add('active');
      const view = document.getElementById('view-' + tab.dataset.view);
      if (view) {
        view.classList.add('active');
        view.style.display = 'block';
      }
      const s = getStato();
      const v = tab.dataset.view;
      if (v === '3d') setTimeout(() => { try { resizeRenderer3D(); if (s) aggiornaRenderer3D(s); } catch(e){ console.warn(e); } }, 50);
      if (v === 'pianta' && s) setTimeout(() => aggiornaViste2D(s), 50);
      if (v === 'prospetto' && s) setTimeout(() => aggiornaViste2D(s), 50);
      if (v === 'sezione' && s) setTimeout(() => aggiornaViste2D(s), 50);
      if (v === 'distinta' && s) setTimeout(() => aggiornaDistinta(s), 50);
    };
  });
}

function collegaPulsantiEditor() {
  const b = (id) => document.getElementById(id);

  if (b('btn-iso')) b('btn-iso').onclick = () => vistaIso();
  if (b('btn-top')) b('btn-top').onclick = () => vistaTop();
  if (b('btn-front')) b('btn-front').onclick = () => vistaFront();
  if (b('btn-lato')) b('btn-lato').onclick = () => vistaLato();

  if (b('btn-export-csv')) b('btn-export-csv').onclick = () => {
    const s = getStato();
    if (s) esportaCSV(s);
  };
  if (b('btn-export-json')) b('btn-export-json').onclick = () => {
    const s = getStato();
    if (s) esportaJSON(s);
  };
  if (b('btn-export-dxf-pianta')) b('btn-export-dxf-pianta').onclick = () => {
    const s = getStato();
    if (s) esportaPiantaDXF(s);
  };
  if (b('btn-export-dxf-sezioni')) b('btn-export-dxf-sezioni').onclick = () => {
    const s = getStato();
    if (s) esportaSezioniDXF(s);
  };
}

/* ============================================================
   ATTIVA EDITOR
   ============================================================ */

export function attivaEditor(statoIniziale) {
  if (!editorInizializzato) {
    try { inizializzaRenderer3D(); } catch (e) { console.warn('3D init:', e.message); }
    try { inizializzaViste2D(); } catch (e) { console.warn('2D init:', e.message); }
    collegaTabs();
    collegaPulsantiEditor();
    window.addEventListener('resize', () => {
      try { resizeRenderer3D(); } catch (e) {}
    });
    editorInizializzato = true;
  }

  const s = statoIniziale || getStato();
  if (!s) return;

  try { aggiornaRenderer3D(s); } catch (e) { console.warn('3D:', e.message); }
  try { aggiornaViste2D(s); } catch (e) { console.warn('2D:', e.message); }
  try { aggiornaRisultati(s); } catch (e) { console.warn('Risultati:', e.message); }
  try { aggiornaDistinta(s); } catch (e) { console.warn('Distinta:', e.message); }
}

/* ============================================================
   AVVIO
   ============================================================ */

async function avvia() {
  try {
    await caricaCataloghi();
  } catch (err) {
    console.error('Errore caricamento cataloghi:', err);
  }

  collegaSchermataCommesse();
  mostraSchermataCommesse();

  window.addEventListener('cacem:editor-open', (e) => {
    const stato = e.detail && e.detail.stato;
    setTimeout(() => attivaEditor(stato), 150);
  });

  window.addEventListener('cacem:state-change', (e) => {
    const s = e.detail && e.detail.stato;
    if (!s) return;
    try { aggiornaRenderer3D(s); } catch (err) {}
    try { aggiornaViste2D(s); } catch (err) {}
    try { aggiornaRisultati(s); } catch (err) {}
    try { aggiornaDistinta(s); } catch (err) {}
  });

  window.attivaEditor = attivaEditor;
}

avvia();