// renderer3d.js — Vista 3D Three.js CACEM v9

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lunghezzaTotale, luceTrasversale } from './modello.js';

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let gruppoCapannone = null;
let inizializzato = false;

const MATERIALI = {
  pilastro:   { color: 0xc9c5bd, roughness: 0.88, metalness: 0.02 },
  traveTU:    { color: 0xd0ccc4, roughness: 0.85, metalness: 0.02 },
  traveTI:    { color: 0xd4d0c8, roughness: 0.85, metalness: 0.02 },
  tegolo:     { color: 0xbfb8a8, roughness: 0.82, metalness: 0.02 },
  pannello:   { color: 0xd8d3c8, roughness: 0.92, metalness: 0.01 },
  pannelloGR: { color: 0xc8bfb0, roughness: 0.95, metalness: 0.01 },
  fondazione: { color: 0x6a6864, roughness: 0.95, metalness: 0.01 },
  terreno:    { color: 0xe8e8e4, roughness: 0.98, metalness: 0.01 },
  pluviale:   { color: 0xff0000, roughness: 1, metalness: 0, wireframe: true }
};

export function inizializzaRenderer3D() {
  if (inizializzato) return;
  const container = document.getElementById('view-3d');
  if (!container) return;

  const w = container.clientWidth || 800;
  const h = container.clientHeight || 500;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(w, h);
  renderer.setClearColor(0xf0f2f5, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f2f5);
  scene.fog = new THREE.Fog(0xf0f2f5, 200, 500);

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  camera.position.set(80, 60, 80);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7f6f, 0.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100, 150, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-80, 60, -60);
  scene.add(fill);

  gruppoCapannone = new THREE.Group();
  scene.add(gruppoCapannone);

  window.addEventListener('resize', resizeRenderer3D);
  inizializzato = true;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

export function resizeRenderer3D() {
  const container = document.getElementById('view-3d');
  if (!container || !renderer || !camera) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function svuota() {
  if (!gruppoCapannone) return;
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

function mat(config) {
  const m = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: config.roughness,
    metalness: config.metalness
  });
  if (config.wireframe) m.wireframe = true;
  return m;
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

export function aggiornaRenderer3D(stato) {
  if (!inizializzato) inizializzaRenderer3D();
  if (!gruppoCapannone || !stato) return;
  svuota();

  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = stato.altezze.altezzaPilastro;
  const pendenza = stato.copertura.pendenza / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const baseP = stato.pilastri.base / 100;
  const altP = stato.pilastri.altezzaSezione / 100;
  const spPann = stato.pannelli.spessore / 100;
  const pluvialeD = stato.pilastri.pluvialeDiametro / 1000;
  const mostraPluviale = stato.pilastri.pluviale;

  const x0 = -L / 2;
  const z0 = -W / 2;

  const numCampate = Number(stato.campateX.numero);
  const numFileY = stato.pilastri.numFileY;

  const posizioniX = [x0];
  let accX = x0;
  for (let i = 0; i < numCampate; i++) {
    accX += stato.campateX.lista[i].interasse;
    posizioniX.push(accX);
  }

  const posizioniZ = [];
  for (let k = 0; k < numFileY; k++) {
    posizioniZ.push(z0 + (k * W) / (numFileY - 1));
  }

  // TERRENO
  const matTerreno = mat(MATERIALI.terreno);
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(L + 30, W + 30), matTerreno);
  terreno.rotation.x = -Math.PI / 2;
  terreno.position.y = -0.01;
  terreno.receiveShadow = true;
  gruppoCapannone.add(terreno);

  // FONDAZIONI
  const matFond = mat(MATERIALI.fondazione);
  const largFond = Math.max(baseP * 1.8, 0.8);
  const altFond = 0.8;
  posizioniX.forEach(px => {
    posizioniZ.forEach(pz => {
      addBox(largFond, altFond, largFond, px, -altFond / 2, pz, matFond);
    });
  });

  // PILASTRI
  const matPil = mat(MATERIALI.pilastro);
  posizioniX.forEach(px => {
    posizioniZ.forEach(pz => {
      addBox(baseP, H, altP, px, H / 2, pz, matPil);

      if (mostraPluviale) {
        const geoF = new THREE.CylinderGeometry(pluvialeD / 2, pluvialeD / 2, H + 0.1, 24);
        const meshF = new THREE.Mesh(geoF, mat(MATERIALI.pluviale));
        meshF.position.set(px, H / 2, pz);
        gruppoCapannone.add(meshF);
      }
    });
  });

  // TRAVI TU (banchina laterale — Z costante, lungo X)
  const matTU = mat(MATERIALI.traveTU);
  const tuB = stato.traviTU.base / 100;
  const tuA = stato.traviTU.altezza / 100;
  const segsTU = stato.traviTU.segmenti || [];
  segsTU.forEach(s => {
    const lungSeg = s.lunghezza;
    const xCentro = x0 + (s.x1 + s.x2) / 2;
    const zCentro = z0 + s.y;
    addBox(lungSeg, tuA, tuB, xCentro, H + tuA / 2, zCentro, matTU);
  });

  // TRAVI TI (interne — Z costante, lungo X)
  const matTI = mat(MATERIALI.traveTI);
  const tiB = stato.traviTI.base / 100;
  const tiA = stato.traviTI.altezza / 100;
  const segsTI = stato.traviTI.segmenti || [];
  segsTI.forEach(s => {
    const lungSeg = s.lunghezza;
    const xCentro = x0 + (s.x1 + s.x2) / 2;
    const zCentro = z0 + s.y;
    addBox(lungSeg, tiA, tiB, xCentro, H + tuA + tiA / 2, zCentro, matTI);
  });

  // TEGOLI AL (copertura — paralleli a X)
  const matTeg = mat(MATERIALI.tegolo);
  const tegH = stato.copertura.tegolo.altezza / 100;
  const file = stato.copertura.file || [];
  const yBaseCop = H + tuA + tiA + 0.05;
  file.forEach(f => {
    const zCentro = z0 + (f.y1 + f.y2) / 2;
    const largTeg = f.larghezza;
    const yQuota = yBaseCop + (Math.abs(zCentro - z0) / W) * salita;
    addBox(L, tegH, largTeg, 0, yQuota + tegH / 2, zCentro, matTeg);
  });

  // PANNELLI (4 lati)
  const matPann = stato.pannelli.finitura === 'GR' ? mat(MATERIALI.pannelloGR) : mat(MATERIALI.pannello);
  addBox(L, H, spPann, 0, H / 2, z0 + spPann / 2, matPann);
  addBox(L, H, spPann, 0, H / 2, z0 + W - spPann / 2, matPann);
  addBox(spPann, H, W - spPann * 2, x0 + spPann / 2, H / 2, 0, matPann);
  addBox(spPann, H, W - spPann * 2, x0 + L - spPann / 2, H / 2, 0, matPann);

  // INTERPIANO
  if (stato.interpiano.attivo) {
    const matSol = mat(MATERIALI.pilastro);
    const hInt = stato.interpiano.h1;
    addBox(L - spPann * 2, 0.25, W - spPann * 2, 0, hInt + 0.125, 0, matSol);
  }

  // CARROPONTE
  if (stato.carroponte.attivo) {
    const matCar = new THREE.MeshStandardMaterial({ color: 0x4a5a7a, roughness: 0.5, metalness: 0.6 });
    const yCar = stato.carroponte.altezzaEstradosso || 5;
    addBox(L - 2, 0.4, 0.3, 0, yCar, 0, matCar);
    addBox(0.3, 0.4, W - 2, 0, yCar, 0, matCar);
  }

  fitCamera(L, W, Hcolmo);
}

function fitCamera(L, W, H) {
  if (!camera || !controls) return;
  const maxDim = Math.max(L, W, H * 2);
  const dist = maxDim * 1.7;
  camera.position.set(dist * 0.75, dist * 0.5, dist * 0.75);
  controls.target.set(0, H / 2, 0);
  controls.update();
}

export function vistaIso() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x + 80, t.y + 60, t.z + 80);
  controls.update();
}

export function vistaTop() {
  if (!camera || !controls) return;
  const t = controls.target;
  camera.position.set(t.x, 200, t.z + 0.001);
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
