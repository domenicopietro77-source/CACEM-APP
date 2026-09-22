// scena3d.js — Scena 3D del capannone con Three.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseSezione } from './modello.js';

let scene, camera, renderer, controls;
let gruppoCapannone;
let griglia, assi;
let inizializzato = false;

const COLORI = {
  pilastri: 0x8a8f99,
  traveColmo: 0x6fa8dc,
  traviTrasv: 0x9ec5e8,
  pannelli: 0xb8b8b8,
  copertura: 0xd4d4d4,
  griglia: 0x2a2f38,
  terreno: 0x1a1d22,
};

export function initScena3D() {
  if (inizializzato) return;

  const container = document.getElementById('view-3d');
  if (!container) return;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x14171c, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x14171c, 80, 250);

  camera = new THREE.PerspectiveCamera(
    50,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    1000
  );
  camera.position.set(60, 45, 60);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 3, 0);
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(80, 100, 60);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -120;
  dir.shadow.camera.right = 120;
  dir.shadow.camera.top = 120;
  dir.shadow.camera.bottom = -120;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 300;
  scene.add(dir);

  scene.add(new THREE.HemisphereLight(0x8ec7ff, 0x202020, 0.35));

  griglia = new THREE.GridHelper(300, 300, COLORI.griglia, COLORI.griglia);
  griglia.position.y = 0.01;
  griglia.material.opacity = 0.35;
  griglia.material.transparent = true;
  scene.add(griglia);

  assi = new THREE.AxesHelper(8);
  assi.position.set(-1, 0.02, -1);
  scene.add(assi);

  gruppoCapannone = new THREE.Group();
  scene.add(gruppoCapannone);

  window.addEventListener('resize', onResize);
  inizializzato = true;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onResize() {
  const container = document.getElementById('view-3d');
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
    roughness: 0.75,
    metalness: 0.05,
    ...opts,
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

export function aggiornaScena3D(stato) {
  if (!inizializzato) initScena3D();
  if (!gruppoCapannone) return;

  svuotaGruppo();

  const d = stato.dimensioni;
  const e = stato.elementi;

  const L = Math.max(1, Number(d.lunghezza) || 60);
  const W = Math.max(1, Number(d.larghezza) || 30);
  const H = Math.max(1, Number(d.altezzaPilastro) || 6);
  const pendenza = (Number(d.pendenzaCopertura) || 5) / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const sezione = parseSezione(e.sezionePilastro);
  const spPannello = (Number(e.spessorePannello) || 20) / 100;

  const numPerFila = Math.max(2, Math.round(Number(d.numeroPilastriPerFila) || 5));
  const passoX = L / (numPerFila - 1);

  const matPilastro = mat(COLORI.pilastri, { roughness: 0.85 });
  for (let f = 0; f < 2; f++) {
    const z = f === 0 ? -W / 2 + sezione.h / 2 : W / 2 - sezione.h / 2;
    for (let i = 0; i < numPerFila; i++) {
      const x = -L / 2 + i * passoX;
      addBox(sezione.l, H, sezione.h, x, H / 2, z, matPilastro);
    }
  }

  const altTrave = 0.8;
  const larTrave = 0.5;
  addBox(L, altTrave, larTrave, 0, Hcolmo - altTrave / 2, 0, mat(COLORI.traveColmo));

  const numTraviPerFila = Math.max(2, Math.round(Number(d.numeroCampate) || 4) + 1);
  const passoTraveX = L / (numTraviPerFila - 1);
  const lunghezzaTraveFalda = Math.sqrt((W / 2) ** 2 + salita ** 2);
  const angoloFalda = Math.atan2(salita, W / 2);

  const matTraveTrasv = mat(COLORI.traviTrasv);
  for (let i = 0; i < numTraviPerFila; i++) {
    const x = -L / 2 + i * passoTraveX;
    for (const segno of [-1, 1]) {
      const zInizio = segno * W / 2;
      const zMedio = zInizio / 2;
      const yMedio = (H + Hcolmo) / 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(larTrave, altTrave, lunghezzaTraveFalda),
        matTraveTrasv
      );
      mesh.position.set(x, yMedio, zMedio);
      mesh.rotation.x = segno === -1 ? angoloFalda : -angoloFalda;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      gruppoCapannone.add(mesh);
    }
  }

  const matPannello = mat(COLORI.pannelli, { roughness: 0.9 });
  addBox(L, H, spPannello, 0, H / 2, -W / 2 + spPannello / 2, matPannello);
  addBox(L, H, spPannello, 0, H / 2, W / 2 - spPannello / 2, matPannello);
  addBox(spPannello, H, Math.max(0.1, W - 2 * spPannello), -L / 2 + spPannello / 2, H / 2, 0, matPannello);
  addBox(spPannello, H, Math.max(0.1, W - 2 * spPannello), L / 2 - spPannello / 2, H / 2, 0, matPannello);

  const matCopertura = mat(COLORI.copertura, { roughness: 0.95 });
  const spCopertura = 0.25;
  for (const segno of [-1, 1]) {
    const zMedio = (segno * W / 2) / 2;
    const yMedio = (H + Hcolmo) / 2 + altTrave + spCopertura / 2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(L, spCopertura, lunghezzaTraveFalda),
      matCopertura
    );
    mesh.position.set(0, yMedio, zMedio);
    mesh.rotation.x = segno === -1 ? angoloFalda : -angoloFalda;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    gruppoCapannone.add(mesh);
  }

  const pavimento = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W),
    new THREE.MeshStandardMaterial({ color: COLORI.terreno, roughness: 1, metalness: 0 })
  );
  pavimento.rotation.x = -Math.PI / 2;
  pavimento.position.y = 0;
  pavimento.receiveShadow = true;
  gruppoCapannone.add(pavimento);
}

export function vistaTop() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x, 120, t.z + 0.001);
  controls.update();
}

export function vistaFront() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x, t.y + 5, t.z + 120);
  controls.update();
}

export function vistaLato() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x + 120, t.y + 5, t.z);
  controls.update();
}

export function vistaIsometrica() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x + 60, t.y + 45, t.z + 60);
  controls.update();
}

export function resizeScena3D() {
  onResize();
}

let wireframeAttivo = false;
export function toggleWireframe() {
  wireframeAttivo = !wireframeAttivo;
  if (!gruppoCapannone) return wireframeAttivo;
  gruppoCapannone.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { m.wireframe = wireframeAttivo; });
    }
  });
  return wireframeAttivo;
}
