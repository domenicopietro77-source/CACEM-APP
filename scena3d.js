// scena3d.js — Scena 3D con Three.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lunghezzaTotale, luceTrasversale } from './modello.js';

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let gruppoCapannone = null;
let inizializzato = false;
let wireframeAttivo = false;

const COLORI = {
  pilastro: 0xbcb8b0,
  trave: 0xc8c4bc,
  traveTrasv: 0xd0ccc4,
  tegolo: 0xbfb8a8,
  pannello: 0xd0cbc0,
  fondazione: 0x6a6a6a,
  solaio: 0xb8b4a8,
  carroponte: 0x4a5a7a,
  terreno: 0x4a5058,
  sfondo: 0xe8eaed,
  griglia: 0x4a5560
};

export function inizializzaScena3D() {
  if (inizializzato) return;

  const container = document.getElementById('view-3d');
  if (!container) {
    console.warn('Container view-3d non trovato');
    return;
  }

  const w = container.clientWidth || 800;
  const h = container.clientHeight || 500;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(w, h);
  renderer.setClearColor(COLORI.sfondo, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORI.sfondo);
  scene.fog = new THREE.Fog(COLORI.sfondo, 150, 400);

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  camera.position.set(60, 45, 60);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xaaccff, 0x4a5058, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-60, 40, -40);
  scene.add(fill);

  const griglia = new THREE.GridHelper(400, 400, COLORI.griglia, COLORI.griglia);
  griglia.position.y = 0.01;
  griglia.material.opacity = 0.3;
  griglia.material.transparent = true;
  scene.add(griglia);

  const assi = new THREE.AxesHelper(10);
  assi.position.set(-1, 0.02, -1);
  scene.add(assi);

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
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: opts.roughness !== undefined ? opts.roughness : 0.85,
    metalness: opts.metalness !== undefined ? opts.metalness : 0.05,
    wireframe: wireframeAttivo
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
  if (!inizializzato) inizializzaScena3D();
  if (!gruppoCapannone || !stato) return;

  svuota();

  const g = stato.generale;
  const L = lunghezzaTotale(stato);
  const W = luceTrasversale(stato);
  const H = g.altezzaPilastro;
  const pendenza = g.pendenzaCopertura / 100;
  const salita = (W / 2) * pendenza;
  const Hcolmo = H + salita;

  const baseP = (stato.pilastri.base || 40) / 100;
  const altP = (stato.pilastri.altezzaSezione || 40) / 100;
  const spPann = stato.pannelli.spessore / 100;

  const x0 = -L / 2;
  const z0 = -W / 2;

  // Fondazioni
  const largFond = Math.max(baseP * 1.8, 0.8);
  const altFond = 0.8;
  const matFond = mat(COLORI.fondazione, { roughness: 0.95 });

  const numPerFila = Number(stato.campate.numero) + 1;
  const numCampate = Number(stato.campate.numero);

  // Calcola posizioni X dei pilastri
  const posizioniX = [x0];
  let acc = x0;
  for (let i = 0; i < numCampate; i++) {
    acc += stato.campate.lista[i].interasse;
    posizioniX.push(acc);
  }

  // Fila Sud (z = z0) e Nord (z = z0 + W)
  posizioniX.forEach(px => {
    addBox(largFond, altFond, largFond, px, -altFond / 2, z0, matFond);
    addBox(largFond, altFond, largFond, px, -altFond / 2, z0 + W, matFond);
  });

  // Pilastri
  const matPil = mat(COLORI.pilastro, { roughness: 0.9 });
  posizioniX.forEach(px => {
    addBox(baseP, H, altP, px, H / 2, z0, matPil);
    addBox(baseP, H, altP, px, H / 2, z0 + W, matPil);
  });

  // Travi di banchina (2 lati)
  const baseTrave = 0.40;
  const altTrave = 0.60;
  const matTrave = mat(COLORI.trave, { roughness: 0.85 });

  addBox(L, altTrave, baseTrave, 0, H + altTrave / 2, z0, matTrave);
  addBox(L, altTrave, baseTrave, 0, H + altTrave / 2, z0 + W, matTrave);

  // Travi trasversali (una per campata, per lato)
  const lungFalda = Math.sqrt(Math.pow(W / 2, 2) + Math.pow(salita, 2));
  const angoloFalda = Math.atan2(salita, W / 2);
  const matTraveTrasv = mat(COLORI.traveTrasv, { roughness: 0.85 });

  for (let i = 0; i < numCampate; i++) {
    const cx = x0 + stato.campate.lista[i].interasse / 2;
    for (let j = 0; j < numCampate; j++) {
      // no-op loop placeholder
    }
    // Posiziona ad ogni pilastro, non al centro
    // (saltiamo per ora questa complessità)
  }

  // Travi trasversali sui pilastri
  for (let i = 0; i < numPerFila; i++) {
    const px = posizioniX[i];
    // Falda Sud
    const meshS = new THREE.Mesh(
      new THREE.BoxGeometry(baseTrave, altTrave, lungFalda),
      matTraveTrasv
    );
    meshS.position.set(px, H + altTrave + salita / 2, z0 + W / 4);
    meshS.rotation.x = angoloFalda;
    meshS.castShadow = true;
    gruppoCapannone.add(meshS);

    // Falda Nord
    const meshN = new THREE.Mesh(
      new THREE.BoxGeometry(baseTrave, altTrave, lungFalda),
      matTraveTrasv
    );
    meshN.position.set(px, H + altTrave + salita / 2, z0 + 3 * W / 4);
    meshN.rotation.x = -angoloFalda;
    meshN.castShadow = true;
    gruppoCapannone.add(meshN);
  }

  // Copertura (2 falde continue)
  const matTeg = mat(COLORI.tegolo, { roughness: 0.9 });
  const spTeg = 0.15;

  const meshFaldaS = new THREE.Mesh(
    new THREE.BoxGeometry(L, spTeg, lungFalda),
    matTeg
  );
  meshFaldaS.position.set(0, H + altTrave + altTrave + salita / 2 + spTeg / 2, z0 + W / 4);
  meshFaldaS.rotation.x = angoloFalda;
  meshFaldaS.castShadow = true;
  meshFaldaS.receiveShadow = true;
  gruppoCapannone.add(meshFaldaS);

  const meshFaldaN = new THREE.Mesh(
    new THREE.BoxGeometry(L, spTeg, lungFalda),
    matTeg
  );
  meshFaldaN.position.set(0, H + altTrave + altTrave + salita / 2 + spTeg / 2, z0 + 3 * W / 4);
  meshFaldaN.rotation.x = -angoloFalda;
  meshFaldaN.castShadow = true;
  meshFaldaN.receiveShadow = true;
  gruppoCapannone.add(meshFaldaN);

  // Pannelli tamponamento (4 lati)
  const matPann = mat(COLORI.pannello, { roughness: 0.95 });
  addBox(L, H, spPann, 0, H / 2, z0 + spPann / 2, matPann);
  addBox(L, H, spPann, 0, H / 2, z0 + W - spPann / 2, matPann);
  addBox(spPann, H, W - spPann * 2, x0 + spPann / 2, H / 2, 0, matPann);
  addBox(spPann, H, W - spPann * 2, x0 + L - spPann / 2, H / 2, 0, matPann);

  // Interpiano
  if (g.interpiano) {
    const matSol = mat(COLORI.solaio, { roughness: 0.9 });
    addBox(L - spPann * 2, 0.25, W - spPann * 2, 0, g.altezzaInterpiano + 0.125, 0, matSol);
  }

  // Carroponte
  if (g.carroponte) {
    const matCar = mat(COLORI.carroponte, { roughness: 0.5, metalness: 0.6 });
    const yCar = H - 1.5;
    addBox(L - 2, 0.4, 0.3, 0, yCar, 0, matCar);
    addBox(0.3, 0.4, W - 2, 0, yCar, 0, matCar);
  }

  // Pavimento
  const matPav = new THREE.MeshStandardMaterial({
    color: COLORI.terreno,
    roughness: 1,
    metalness: 0,
    wireframe: wireframeAttivo
  });
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(L + 4, W + 4), matPav);
  pav.rotation.x = -Math.PI / 2;
  pav.position.y = 0;
  pav.receiveShadow = true;
  gruppoCapannone.add(pav);

  fitCamera(L, W, Hcolmo);
}

function fitCamera(L, W, H) {
  if (!camera || !controls) return;
  const maxDim = Math.max(L, W, H * 2);
  const dist = maxDim * 1.6;
  camera.position.set(dist * 0.7, dist * 0.55, dist * 0.7);
  controls.target.set(0, H / 2, 0);
  controls.update();
}

export function vistaIsometrica() {
  if (!camera || !controls) return;
  const t = controls.target;
  const d = 100;
  camera.position.set(t.x + d * 0.7, t.y + d * 0.55, t.z + d * 0.7);
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
  if (!gruppoCapannone) return wireframeAttivo;
  gruppoCapannone.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { m.wireframe = wireframeAttivo; });
    }
  });
  return wireframeAttivo;
}