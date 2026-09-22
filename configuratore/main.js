// CACEM Configuratore — STEP 1
console.log('CACEM Configuratore · Step 1 caricato');

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