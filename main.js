// main.js — Orchestratore CACEM v9

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

let editorInizializzato = false;

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
      window.dispatchEvent(new CustomEvent('cacem:view-change', { detail: { view: tab.dataset.view } }));
    };
  });
}

function collegaPulsantiEditor() {
  const b = (id) => document.getElementById(id);
  if (b('btn-export-csv')) b('btn-export-csv').onclick = () => {
    const s = getStato();
    if (s) console.log('Export CSV:', s);
    alert('Export CSV: in arrivo nella Fase 7');
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

export function attivaEditor(statoIniziale) {
  if (!editorInizializzato) {
    collegaTabs();
    collegaPulsantiEditor();
    editorInizializzato = true;
  }
  const s = statoIniziale || getStato();
  if (!s) return;
  try { aggiornaRisultati(s); } catch (e) { console.warn('Risultati:', e.message); }
}

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
    setTimeout(() => attivaEditor(stato), 100);
  });

  window.addEventListener('cacem:state-change', (e) => {
    const s = e.detail && e.detail.stato;
    if (!s) return;
    try { aggiornaRisultati(s); } catch (err) { console.warn(err.message); }
  });

  window.attivaEditor = attivaEditor;
}

avvia();