// main.js — Entry point: orchestratore commesse + editor

import { caricaCataloghi } from './catalogo.js';
import {
  mostraSchermataCommesse,
  nuovaCommessaE,
  salvaCommessaCorrente,
  esportaCommessaCorrente,
  importaCommessaDaFile,
  aggiornaRisultati,
  mostraStatus,
  getStato
} from './ui.js';

import { inizializzaScena3D, aggiornaScena3D, resizeScena3D,
         vistaIsometrica, vistaTop, vistaFront, vistaLato, toggleWireframe } from './scena3d.js';
import { inizializzaPianta, aggiornaPianta, resetPianta } from './pianta.js';
import { inizializzaProspetti, aggiornaProspetti, resetProspetto } from './prospetti.js';
import { inizializzaSezioni, aggiornaSezioni, resetSezioni } from './sezioni.js';
import { esportaCSV } from './distinta.js';
import { esportaPiantaDXF, esportaProspettiDXF, esportaSezioniDXF } from './export.js';

let moduli3DInizializzati = false;

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

  collegaPulsantiSchermataCommesse();

  // Mostra schermata commesse all'avvio
  mostraSchermataCommesse();
}

function collegaPulsantiSchermataCommesse() {
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
   INIZIALIZZAZIONE EDITOR (dopo apertura commessa)
   ============================================================ */

export function attivaEditor(statoIniziale) {
  // Se i moduli 3D/2D non sono ancora stati inizializzati, fallo ora
  if (!moduli3DInizializzati) {
    try {
      inizializzaScena3D();
      inizializzaPianta(document.getElementById('piantaCanvas'));
      inizializzaProspetti();
      inizializzaSezioni();
      moduli3DInizializzati = true;
    } catch (e) {
      console.warn('Errore init moduli:', e.message);
    }
    collegaTabs();
    collegaPulsantiEditor();
    window.addEventListener('resize', () => {
      try { resizeScena3D(); } catch {}
    });
  }

  // Aggiorna tutti i moduli con lo stato corrente
  const s = statoIniziale || getStato();
  if (!s) return;
  try { aggiornaScena3D(s); } catch (e) { console.warn('3D:', e.message); }
  try { aggiornaPianta(s); } catch (e) { console.warn('Pianta:', e.message); }
  try { aggiornaProspetti(s); } catch (e) { console.warn('Prospetti:', e.message); }
  try { aggiornaSezioni(s); } catch (e) { console.warn('Sezioni:', e.message); }
  try { aggiornaRisultati(s); } catch (e) { console.warn('Risultati:', e.message); }
}

// Collega i tab e i pulsanti dell'editor (una sola volta)
function collegaTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      const view = document.getElementById('view-' + tab.dataset.view);
      if (view) view.classList.add('active');

      const v = tab.dataset.view;
      const s = getStato();
      if (v === '3d') setTimeout(() => resizeScena3D(), 50);
      if (v === 'pianta') setTimeout(() => { if (s) aggiornaPianta(s); }, 50);
      if (v === 'prospetto') setTimeout(() => { if (s) aggiornaProspetti(s); }, 50);
      if (v === 'sezione') setTimeout(() => { if (s) aggiornaSezioni(s); }, 50);
      if (v === 'distinta') setTimeout(() => { if (s) aggiornaRisultati(s); }, 50);
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
      if (canvas && canvas.startsWith('prospetto')) resetProspetto(canvas);
      else if (canvas && canvas.startsWith('sezione')) resetSezioni();
    };
  });

  if (b('btn-export-csv')) b('btn-export-csv').onclick = () => esportaCSV(getStato());
  if (b('btn-export-dxf-pianta')) b('btn-export-dxf-pianta').onclick = () => esportaPiantaDXF(getStato());
  if (b('btn-export-dxf-prospetti')) b('btn-export-dxf-prospetti').onclick = () => esportaProspettiDXF(getStato());
  if (b('btn-export-dxf-sezioni')) b('btn-export-dxf-sezioni').onclick = () => esportaSezioniDXF(getStato());
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
   AVVIO APP
   ============================================================ */

avvia();

window.attivaEditor = attivaEditor;