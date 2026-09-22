import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene;
let camera;
let renderer;
let controls;
let group;
let wire = false;

export function inizializzaScena3D() {
  const container = document.getElementById("threeView");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a3240);
  scene.fog = new THREE.Fog(0x2a3240, 80, 260);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 1.7));

  const directional = new THREE.DirectionalLight(0xffffff, 1.1);
  directional.position.set(30, 50, 30);
  scene.add(directional);

  scene.add(new THREE.GridHelper(100, 100, 0x607080, 0x3b4654));

  group = new THREE.Group();
  scene.add(group);

  resizeScena3D();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls?.update();

  if (renderer) {
    renderer.render(scene, camera);
  }
}

function creaMateriale(colore) {
  return new THREE.MeshStandardMaterial({
    color: colore,
    wireframe: wire
  });
}

/*
 * Sistema di coordinate:
 * X = lunghezza del capannone
 * Y = altezza verticale
 * Z = luce trasversale
 */

function creaBox(
  sizeX,
  sizeY,
  sizeZ,
  x,
  y,
  z,
  colore = 0x87929d
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
    creaMateriale(colore)
  );

  mesh.position.set(x, y, z);
  group.add(mesh);

  return mesh;
}

function creaFalda(
  L,
  W,
  H,
  pendenza,
  lato
) {
  const rise = W * pendenza / 200;
  const halfW = W / 2;
  const lunghezzaFalda = Math.sqrt(
    halfW ** 2 +
    rise ** 2
  );

  const mesh = creaBox(
    L,
    0.20,
    lunghezzaFalda,
    L / 2,
    H + rise / 2,
    lato === "sud"
      ? halfW / 2
      : halfW + halfW / 2,
    0x9ca6af
  );

  /*
   * BoxGeometry local Z follows the sloped falda.
   * Rotation around X changes local Z direction in the Y/Z plane.
   */
  const angle =
    Math.atan2(rise, halfW);

  mesh.rotation.x =
    lato === "sud"
      ? angle
      : -angle;

  return mesh;
}

function creaParete(
  sizeX,
  sizeY,
  sizeZ,
  x,
  y,
  z
) {
  return creaBox(
    sizeX,
    sizeY,
    sizeZ,
    x,
    y,
    z,
    0x607080
  );
}

export function aggiornaScena3D(s) {
  if (!group) return;

  while (group.children.length) {
    group.remove(group.children[0]);
  }

  const L = s.campate.reduce(
    (sum, campata) =>
      sum + Number(campata.interasse || 0),
    0
  );

  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);
  const pendenza = Number(
    s.generale.pendenzaCopertura || 0
  );

  const basePilastro =
    Number(s.pilastri.base || 40) / 100;

  const altezzaSezionePilastro =
    Number(s.pilastri.altezzaSezione || 60) / 100;

  const rise = W * pendenza / 200;
  const halfW = W / 2;
  const Hcolmo = H + rise;

  const xs = [0];
  let x = 0;

  s.campate.forEach(campata => {
    x += Number(campata.interasse || 0);
    xs.push(x);
  });

  /*
   * PILASTRI
   * Entrambe le file hanno esattamente la stessa altezza H.
   */
  xs.forEach(px => {
    creaBox(
      basePilastro,
      H,
      altezzaSezionePilastro,
      px,
      H / 2,
      0
    );

    creaBox(
      basePilastro,
      H,
      altezzaSezionePilastro,
      px,
      H / 2,
      W
    );
  });

  /*
   * TRAVI DI BANCHINA
   * Due travi continue, parallele all'asse X, appoggiate a Y=H.
   */
  const traveBase =
    Number(trovaDimensioneTrave(s, "base", 30)) / 100;

  const traveAltezza =
    Number(trovaDimensioneTrave(s, "altezza", 60)) / 100;

  creaBox(
    L,
    traveAltezza,
    traveBase,
    L / 2,
    H - traveAltezza / 2,
    0
  );

  creaBox(
    L,
    traveAltezza,
    traveBase,
    L / 2,
    H - traveAltezza / 2,
    W
  );

  /*
   * TRAVI TRASVERSALI
   * Una coppia per ogni campata, inclinata nel piano Y/Z.
   */
  xs.forEach((px, index) => {
    if (index >= s.campate.length) return;

    const span = Number(
      s.campate[index].interasse || 0
    );

    const midX = px + span / 2;

    creaTraveTrasversale(
      midX,
      W,
      H,
      rise,
      s
    );
  });

  /*
   * COPERTURA
   * Esattamente due falde continue, senza strisce per campata.
   */
  creaFalda(
    L,
    W,
    H,
    pendenza,
    "sud"
  );

  creaFalda(
    L,
    W,
    H,
    pendenza,
    "nord"
  );

  /*
   * PARETI CONTINUE PERIMETRALI.
   */
  const spessorePannello =
    Number(s.pannelli.spessore || 0) / 100;

  creaParete(
    L,
    H,
    spessorePannello,
    L / 2,
    H / 2,
    0
  );

  creaParete(
    L,
    H,
    spessorePannello,
    L / 2,
    H / 2,
    W
  );

  creaParete(
    spessorePannello,
    H,
    W,
    0,
    H / 2,
    W / 2
  );

  creaParete(
    spessorePannello,
    H,
    W,
    L,
    H / 2,
    W / 2
  );

  /*
   * PAVIMENTO: piano X/Z con quota superiore Y=0.
   */
  creaBox(
    L,
    0.20,
    W,
    L / 2,
    -0.10,
    W / 2,
    0x607080
  );

  fit(s);
}

function trovaDimensioneTrave(s, campo, fallbackCm) {
  const catalogo = window.CACEM_CATALOGO;

  const trave =
    catalogo?.travi?.find(
      item => item.id === s.travi.tipoId
    );

  return Number(
    trave?.[campo] ??
    fallbackCm
  );
}

function creaTraveTrasversale(
  x,
  W,
  H,
  rise,
  s
) {
  const catalogo = window.CACEM_CATALOGO;

  const trave =
    catalogo?.travi?.find(
      item => item.id === s.travi.tipoId
    );

  const base =
    Number(trave?.base ?? 30) / 100;

  const altezza =
    Number(trave?.altezza ?? 60) / 100;

  const halfW = W / 2;

  const length =
    Math.sqrt(
      halfW ** 2 +
      rise ** 2
    );

  const angle =
    Math.atan2(rise, halfW);

  const makeHalf = (
    zCenter,
    rotation
  ) => {
    const mesh = creaBox(
      base,
      altezza,
      length,
      x,
      H + rise / 2,
      zCenter,
      0x9ca6af
    );

    mesh.rotation.x = rotation;
  };

  makeHalf(
    halfW / 2,
    angle
  );

  makeHalf(
    halfW + halfW / 2,
    -angle
  );
}

function fit(s) {
  const L = s.campate.reduce(
    (sum, campata) =>
      sum + Number(campata.interasse || 0),
    0
  );

  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);

  camera.position.set(
    L * 0.95,
    H * 1.1,
    -W * 1.25
  );

  controls.target.set(
    L / 2,
    H / 2,
    W / 2
  );

  controls.update();
}

export function vistaIsometrica() {
  const s = window.CACEM_STATE;
  if (!s) return;

  const L = s.campate.reduce(
    (sum, campata) =>
      sum + Number(campata.interasse || 0),
    0
  );

  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);

  camera.position.set(
    L * 0.9,
    H,
    -W * 1.1
  );

  controls.target.set(
    L / 2,
    H / 2,
    W / 2
  );

  controls.update();
}

export function vistaTop() {
  const s = window.CACEM_STATE;
  if (!s) return;

  const L = s.campate.reduce(
    (sum, campata) =>
      sum + Number(campata.interasse || 0),
    0
  );

  const W = Number(s.generale.luce || 0);

  camera.position.set(
    L / 2,
    Math.max(L, W) * 1.5,
    W / 2
  );

  controls.target.set(
    L / 2,
    0,
    W / 2
  );

  controls.update();
}

export function vistaFront() {
  const s = window.CACEM_STATE;
  if (!s) return;

  const L = s.campate.reduce(
    (sum, campata) =>
      sum + Number(campata.interasse || 0),
    0
  );

  const H = Number(s.generale.altezzaPilastro || 0);

  camera.position.set(
    L / 2,
    H / 2,
    -Math.max(L, H) * 1.5
  );

  controls.target.set(
    L / 2,
    H / 2,
    0
  );

  controls.update();
}

export function vistaLato() {
  const s = window.CACEM_STATE;
  if (!s) return;

  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);

  camera.position.set(
    Math.max(W, H) * 1.5,
    H / 2,
    W / 2
  );

  controls.target.set(
    0,
    H / 2,
    W / 2
  );

  controls.update();
}

export function toggleWireframe() {
  wire = !wire;
  aggiornaScena3D(window.CACEM_STATE);
}

export function resizeScena3D() {
  const container = document.getElementById("threeView");

  if (!renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) return;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
