// main.js — Entry point del configuratore CACEM — Step 3

import { getStato, inizializzaUI, onStatoChange, aggiornaRisultati, esportaProgetto, importaProgetto } from './ui.js';
import {
  initScena3D,
  aggiornaScena3D,
  resizeScena3D,
  vistaTop,
  vistaFront,
  vistaLato,
  vistaIsometrica,
  toggleWireframe,
} from './scena3d.js';

console.log('CACEM Configuratore · Step 3 caricato');

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    const view = document.getElementById('view-' + tab.dataset.view);
    if (view) view.classList.add('active');

    if (tab.dataset.view === '3d') {
      setTimeout(() => resizeScena3D(), 50);
    }

    window.dispatchEvent(new CustomEvent('cacem:viewchange', { detail: tab.dataset.view }));
  });
});

inizializzaUI();
initScena3D();

onStatoChange(stato => {
  aggiornaRisultati(stato);
  aggiornaScena3D(stato);
});

document.getElementById('btn-iso')?.addEventListener('click', vistaIsometrica);
document.getElementById('btn-top')?.addEventListener('click', vistaTop);
document.getElementById('btn-front')?.addEventListener('click', vistaFront);
document.getElementById('btn-lato')?.addEventListener('click', vistaLato);
document.getElementById('btn-wire')?.addEventListener('click', () => toggleWireframe());

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === 's') { e.preventDefault(); esportaProgetto(); }
    if (e.key.toLowerCase() === 'o') { e.preventDefault(); importaProgetto(); }
    return;
  }

  if (e.key === '1') vistaIsometrica();
  if (e.key === '2') vistaTop();
  if (e.key === '3') vistaFront();
  if (e.key === '4') vistaLato();
  if (e.key.toLowerCase() === 'w') toggleWireframe();
});

setTimeout(() => {
  aggiornaScena3D(getStato());
  vistaIsometrica();
  resizeScena3D();
}, 100);
