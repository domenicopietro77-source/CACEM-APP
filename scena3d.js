// scena3d.js — Scena 3D con Three.js, materiali PBR, illuminazione realistica

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lunghezzaTotale } from './modello.js';

let scene, camera, renderer, controls;
let gruppoCapannone;
let griglia, assi;
let inizializzato = false;
let wireframeAttivo = false;

const COLORI = {
  pilastri:        0xbcb8b0,
  traveBanchina:   0xc8c4bc,
  traviTrasv:      0xd0ccc4,
  tegoli:          0xbfb8a8,
  coppelle:        0xa8a29a,
  pannelliFV:      0xd0cbc0,
  pannelliGR:      0xc8c0b0,
  fondazione:      0x6a6a6a,
  solaio:          0xb8b4a8,
  carroponte:      0x4a5a7a,
  terreno:         0x4a5058,
  sfondo:          0x2a2f3a,
  griglia:         0x4a5560,
  selezione:       0x4a9eff
};

/**
 * Inizializza la scena 3D.
 */
export function inizializzaScena3D() {
  if (inizializzato) return;

  const container = document.getElementById('threeView');
  if (!container) {
    console.warn('Container threeView non trovato');
    return;
  }

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 500);
  renderer.setClearColor(COLORI.sfondo, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // --- Scena ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORI.sfondo);
  scene.fog = new THREE.Fog(COLORI.sfondo, 150, 400);

  // --- Camera ---
  camera = new THREE.PerspectiveCamera(
    45,
    (container.clientWidth || 800) / (container.clientHeight || 500),
    0.1,
    2000
  );
  camera.position.set(60, 45, 60);

  // --- Controls ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 3, 0);
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 500;
  controls.update();

  // --- Luci ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xaaccff, 0x4a5058, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-60, 40, -40);
  scene.add(fill);

  // --- Griglia terra ---
  griglia = new THREE.GridHelper(300, 300, COLORI.griglia, COLORI.griglia);
  griglia.position.y = 0.01;
  griglia.material.opacity = 0.3;
  griglia.material.transparent = true;
  scene.add(griglia);

  // --- Assi ---
  assi = new THREE.AxesHelper(10);
  assi.position.set(-1, 0.02, -1);
  scene.add(assi);

  // --- Gruppo capannone ---
  gruppoCapannone = new THREE.Group();
  scene.add(gruppoCapannone);

  window.addEventListener('resize', resizeScena3D);
  inizializzato = true;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

export function resizeScena3D() {
  const container = document.getElementById('threeView');
  if (!container || !renderer || !camera) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function svuotaGruppo() {
  while (gruppoCapannone.children.length > 0) {
    const obj = gruppoCapannone.children.pop();
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness !== undefined ? opts.roughness : 0.85,
    metalness: opts.metalness !== undefined ? opts.metalness : 0.05,
    ...opts
  });
}

function addBox(w, h, d, x, y, z, material) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  gruppoCapannone.add(mesh);
  return mesh;
}

/**
 * Aggiorna la scena 3D dallo stato.
 */
export function aggiornaScena3D(stato) {
  if (!inizializzato) inizializzaScena3D();
  if (!gruppoCapannone || !stato) return;

  svuotaGruppo();

  const g = stato.generale;
  const L = lunghezzaTotale(stato);
  const W = g.luce;
  const H = g.altezzaPilastro;
  const pendenza = g.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const baseP = (stato.pilastri.base || 40) / 100;
  const altP = (stato.pilastri.altezzaSezione || 40) / 100;
  const spPann = stato.pannelli.spessore / 100;

  // Origine al centro della pianta
  const x0 = -L / 2;
  const z0 = -W / 2;

  // --- FONDAZIONI ---
  const largFond = Math.max(baseP * 1.8, 0.8);
  const altFond = 0.8;
  const matFond = mat(COLORI.fondazione, { roughness: 0.95 });
  const numPerFila = stato.campate.length + 1;
  const passoX = L / (numPerFila - 1);

  for (let i = 0; i < numPerFila; i++) {
    const x = x0 + i * passoX;
    for (const z of [z0, z0 + W]) {
      addBox(largFond, altFond, largFond, x, -altFond / 2, z, matFond);
    }
  }

  // --- PILASTRI ---
  const matPilastro = mat(COLORI.pilastri, { roughness: 0.9 });
  for (let i = 0; i < numPerFila; i++) {
    const x = x0 + i * passoX;
    for (const z of [z0, z0 + W]) {
      addBox(baseP, H, altP, x, H / 2, z, matPilastro);
    }
  }

  // --- TRAVI DI BANCHINA (parallele a X, sopra i pilastri) ---
  const tra = stato.travi.tipoBanchina;
  const baseTrave = 0.40;
  const altTrave = 0.60;
  const matTrave = mat(COLORI.traveBanchina, { roughness: 0.85 });

  for (const z of [z0, z0 + W]) {
    addBox(L, altTrave, baseTrave, 0, H + altTrave / 2, z, matTrave);
  }

  // --- TRAVI TRASVERSALI (inclinate, una per campata, per falda) ---
  const lungFalda = Math.sqrt((W / 2) ** 2 + salita ** 2);
  const angoloFalda = Math.atan2(salita, W / 2);
  const matTraveTrasv = mat(COLORI.traviTrasv, { roughness: 0.85 });

  for (let i = 0; i < stato.campate.length; i++) {
    const x = x0 + (i + 0.5) * passoX * (stato.campate[i].interasse / 15);
    const xPos = x0 + i * (L / stato.campate.length) + stato.campate[i].interasse / 2;

    for (const segno of [-1, 1]) {
      const zInizio = segno * W / 2;
      const zMedio = zInizio / 2;
      const yMedio = H + altTrave + salita / 2;

      const geo = new THREE.BoxGeometry(baseTrave, altTrave, lungFalda);
      const mesh = new THREE.Mesh(geo, matTraveTrasv);
      mesh.position.set(xPos, yMedio, zMedio);
      mesh.rotation.x = segno === -1 ? angoloFalda : -angoloFalda;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      gruppoCapannone.add(mesh);
    }
  }

  // --- COPERTURA (due falde continue) ---
  const matTegolo = mat(COLORI.tegoli, { roughness: 0.9 });
  const spTegolo = 0.15;

  for (const segno of [-1, 1]) {
    const zInizio = segno * W / 2;
    const zMedio = zInizio / 2;
    const yMedio = H + altTrave + salita / 2 + altTrave / 2 + spTegolo / 2;

    const geo = new THREE.BoxGeometry(L, spTegolo, lungFalda);
    const mesh = new THREE.Mesh(geo, matTegolo);
    mesh.position.set(0, yMedio, zMedio);
    mesh.rotation.x = segno === -1 ? angoloFalda : -angoloFalda;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    gruppoCapannone.add(mesh);
  }

  // --- PANNELLI TAMPONAMENTO (4 pareti continue) ---
  const matPannello = mat(
    stato.pannelli.finitura === 'GR' ? COLORI.pannelliGR : COLORI.pannelliFV,
    { roughness: 0.95 }
  );

  const perimetroPareti = [
    { w: L, d: spPann, x: 0, z: z0 + spPann / 2 },
    { w: L, d: spPann, x: 0, z: z0 + W - spPann / 2 },
    { w: spPann, d: W - spPann * 2, x: x0 + spPann / 2, z: 0 },
    { w: spPann, d: W - spPann * 2, x: x0 + L - spPann / 2, z: 0 }
  ];

  perimetroPareti.forEach(p => {
    addBox(p.w, H, p.d, p.x, H / 2, p.z, matPannello);
  });

  // --- INTERPIANO (se attivo) ---
  if (g.interpiano) {
    const matSolaio = mat(COLORI.solaio, { roughness: 0.9 });
    addBox(L - spPann * 2, 0.25, W - spPann * 2, 0, g.altezzaInterpiano + 0.125, 0, matSolaio);
  }

  // --- CARROPONTE (se attivo) ---
  if (g.carroponte) {
    const matCarroponte = mat(COLORI.carroponte, { roughness: 0.5, metalness: 0.6 });
    const yCarroponte = H - 1.5;
    addBox(L - 2, 0.4, 0.3, 0, yCarroponte, 0, matCarroponte);
    addBox(0.3, 0.4, W - 2, 0, yCarroponte, 0, matCarroponte);
  }

  // --- PAVIMENTO ---
  const matPavimento = new THREE.MeshStandardMaterial({
    color: COLORI.terreno,
    roughness: 1,
    metalness: 0
  });
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(L + 4, W + 4), matPavimento);
  pav.rotation.x = -Math.PI / 2;
  pav.position.y = 0;
  pav.receiveShadow = true;
  gruppoCapannone.add(pav);

  // --- CAMERA AUTO-FIT ---
  fitCamera(L, W, Hcolmo);
}

function fitCamera(L, W, H) {
  if (!camera || !controls) return;
  const maxDim = Math.max(L, W, H * 2);
  const distanza = maxDim * 1.6;

  camera.position.set(
    distanza * 0.7,
    distanza * 0.55,
    distanza * 0.7
  );
  controls.target.set(0, H / 2, 0);
  controls.update();
}

// --- VISTE PREDEFINITE ---
export function vistaIsometrica() {
  if (!camera || !controls) return;
  const t = controls.target;
  const dist = 100;
  camera.position.set(t.x + dist * 0.7, t.y + dist * 0.55, t.z + dist * 0.7);
  controls.update();
}

export function vistaTop() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x, 150, t.z + 0.001);
  controls.update();
}

export function vistaFront() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x, t.y + 10, t.z + 150);
  controls.update();
}

export function vistaLato() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x + 150, t.y + 10, t.z);
  controls.update();
}

export function toggleWireframe() {
  wireframeAttivo = !wireframeAttivo;
  gruppoCapannone.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { m.wireframe = wireframeAttivo; });
    }
  });
  return wireframeAttivo;
}