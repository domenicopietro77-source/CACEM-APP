// modellatore.js — Modellatore parametrico CACEM (v1)

let chili = null;
const viewport = document.getElementById('viewport-modellatore');

/**
 * Inizializza Chili3D se disponibile, altrimenti fallback Three.js base.
 */
async function inizializzaModellatore() {
  try {
    const mod = await import('./vendor/chili3d/index.js');
    chili = new mod.Chili3D(viewport);
    console.log('Chili3D inizializzato');
  } catch (e) {
    console.warn('Chili3D non trovato, uso fallback Three.js base');
    await inizializzaFallbackThree();
  }
}

async function inizializzaFallbackThree() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f2f5);

  const camera = new THREE.PerspectiveCamera(45, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
  camera.position.set(150, 100, 150);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  viewport.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(100, 150, 100);
  scene.add(dir);

  const grid = new THREE.GridHelper(500, 50, 0x999999, 0xcccccc);
  scene.add(grid);

  window._cacemScene = scene;
  window._cacemCamera = camera;
  window._cacemRenderer = renderer;
  window._cacemControls = controls;
  window._cacemTHREE = THREE;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  });
}

/**
 * Genera il modello 3D in base al tipo e ai parametri.
 */
function generaModello() {
  const tipo = document.getElementById('tipo-elemento').value;
  const base = parseFloat(document.getElementById('p-base').value);
  const altezza = parseFloat(document.getElementById('p-altezza').value);
  const lunghezza = parseFloat(document.getElementById('p-lunghezza').value);
  const pluviale = document.getElementById('p-pluviale').checked;
  const pluvialeDiam = parseFloat(document.getElementById('p-pluviale-diam').value);
  const halfen = document.getElementById('p-halfen').checked;
  const halfenPasso = parseFloat(document.getElementById('p-halfen-passo').value);

  const params = { tipo, base, altezza, lunghezza, pluviale, pluvialeDiam, halfen, halfenPasso };
  console.log('Generazione modello:', params);

  // Fallback Three.js
  if (window._cacemScene) {
    disegnaConThree(params);
  }
}

function disegnaConThree(params) {
  const THREE = window._cacemTHREE;
  const scene = window._cacemScene;

  // Rimuovi mesh precedenti
  scene.children = scene.children.filter(c => !c.userData.cacemMesh);

  const baseM = params.base / 100;
  const altM = params.altezza / 100;
  const lunM = params.lunghezza / 100;

  const mat = new THREE.MeshStandardMaterial({ color: 0xc9c5bd, roughness: 0.85 });

  if (params.tipo === 'pilastro') {
    const geo = new THREE.BoxGeometry(baseM, lunM, altM);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, lunM / 2, 0);
    mesh.userData.cacemMesh = true;
    mesh.castShadow = true;
    scene.add(mesh);

    if (params.pluviale) {
      const raggioM = (params.pluvialeDiam / 1000) / 2;
      const geoF = new THREE.CylinderGeometry(raggioM, raggioM, lunM + 0.1, 32);
      const matF = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
      const foro = new THREE.Mesh(geoF, matF);
      foro.position.set(0, lunM / 2, 0);
      foro.userData.cacemMesh = true;
      scene.add(foro);
    }
  } else if (params.tipo === 'trave-TU') {
    const geo = new THREE.BoxGeometry(baseM, altM, lunM);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, altM / 2, 0);
    mesh.userData.cacemMesh = true;
    scene.add(mesh);
  } else if (params.tipo === 'trave-TI') {
    const geo = new THREE.BoxGeometry(0.5, 0.9, lunM);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.45, 0);
    mesh.userData.cacemMesh = true;
    scene.add(mesh);
  } else if (params.tipo === 'tegolo-AL') {
    const geo = new THREE.BoxGeometry(2.56, 0.88, lunM);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.44, 0);
    mesh.userData.cacemMesh = true;
    scene.add(mesh);
  } else if (params.tipo === 'pannello') {
    const geo = new THREE.BoxGeometry(baseM, altM, 0.2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, altM / 2, 0);
    mesh.userData.cacemMesh = true;
    scene.add(mesh);
  }
}

function salvaInLibreria() {
  const tipo = document.getElementById('tipo-elemento').value;
  const libreria = JSON.parse(localStorage.getItem('cacem-libreria-v9') || '[]');

  const componente = {
    id: 'comp-' + Date.now(),
    tipo: tipo,
    parametri: {
      base: parseFloat(document.getElementById('p-base').value),
      altezza: parseFloat(document.getElementById('p-altezza').value),
      lunghezza: parseFloat(document.getElementById('p-lunghezza').value),
      pluviale: document.getElementById('p-pluviale').checked,
      pluvialeDiam: parseFloat(document.getElementById('p-pluviale-diam').value),
      halfen: document.getElementById('p-halfen').checked,
      halfenPasso: parseFloat(document.getElementById('p-halfen-passo').value)
    },
    data: new Date().toISOString()
  };

  libreria.push(componente);
  localStorage.setItem('cacem-libreria-v9', JSON.stringify(libreria));
  alert('Componente salvato in libreria! Totale: ' + libreria.length);
}

// Collega pulsanti
document.getElementById('btn-genera').onclick = generaModello;
document.getElementById('btn-salva').onclick = salvaInLibreria;
document.getElementById('btn-esporta').onclick = () => {
  alert('Export IFC: sarà implementato nella Fase 2 con That Open Engine');
};

// Avvia
inizializzaModellatore();