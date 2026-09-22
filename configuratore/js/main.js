// main.js — Entry point del configuratore CACEM — Step 2

import { inizializzaUI, onStatoChange, aggiornaRisultati, esportaProgetto, importaProgetto } from './ui.js';

console.log('CACEM Configuratore · Step 2 caricato');

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    const view = document.getElementById('view-' + tab.dataset.view);
    if (view) view.classList.add('active');
    window.dispatchEvent(new CustomEvent('cacem:viewchange', { detail: tab.dataset.view }));
  });
});

inizializzaUI();
onStatoChange(stato => aggiornaRisultati(stato));

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === 's') { e.preventDefault(); esportaProgetto(); }
    if (e.key.toLowerCase() === 'o') { e.preventDefault(); importaProgetto(); }
  }
});
