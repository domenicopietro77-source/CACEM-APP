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

/*
 * Coordinate system:
 * X = longitudinal axis
 * Y = vertical height
 * Z = transverse axis
 */
function box(
  x,
  y,
  z,
  sizeX,
  sizeY,
  sizeZ,
  material = 0x87929d
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
    new THREE.MeshStandardMaterial({
      color: material,
      wireframe: wire
    })
  );

  mesh.position.set(x, y, z);
  group.add(mesh);
}

function addRoofBeam(x, z1, y1, z2, y2) {
  const dz = z2 - z1;
  const dy = y2 - y1;
  const length = Math.hypot(dz, dy);
  const angle = Math.atan2(dy, dz);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, length, 0.35),
    new THREE.MeshStandardMaterial({
      color: 0x9ca6af,
      wireframe: wire
    })
  );

  mesh.position.set(
    x,
    (y1 + y2) / 2,
    (z1 + z2) / 2
  );

  mesh.rotation.x = -angle;
  group.add(mesh);
}

export function aggiornaScena3D(s) {
  if (!group) return;

  while (group.children.length) {
    group.remove(group.children[0]);
  }

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);
  const pendenza = Number(s.generale.pendenzaCopertura || 0);

  const basePilastro = Number(s.pilastri.base || 40) / 100;
  const profonditaPilastro =
    Number(s.pilastri.altezzaSezione || 60) / 100;

  const rise = W * pendenza / 200;
  const ridgeY = H + rise;

  const xs = [0];
  let x = 0;

  s.campate.forEach(campata => {
    x += Number(campata.interasse || 0);
    xs.push(x);
  });

  // Pilastri: sezione in X/Z, altezza verticale lungo Y.
  xs.forEach(px => {
    box(
      px,
      H / 2,
      0,
      basePilastro,
      H,
      profonditaPilastro
    );

    box(
      px,
      H / 2,
      W,
      basePilastro,
      H,
      profonditaPilastro
    );
  });

  // Travi di banchina: asse longitudinale X, quota superiore Y=H.
  const traveH = 0.6;

  box(
    L / 2,
    H - traveH / 2,
    0,
    L,
    traveH,
    0.5
  );

  box(
    L / 2,
    H - traveH / 2,
    W,
    L,
    traveH,
    0.5
  );

  // Travi trasversali inclinate nel piano Y/Z.
  xs.forEach((px, index) => {
    if (index >= s.campate.length) return;

    const span = Number(s.campate[index].interasse || 0);
    const midX = px + span / 2;

    addRoofBeam(midX, 0, H, W / 2, ridgeY);
    addRoofBeam(midX, W, H, W / 2, ridgeY);
  });

  const envelopeMaterial = 0x607080;

  // Tamponamenti laterali: piani verticali X/Y.
  box(
    L / 2,
    H / 2,
    0,
    L,
    H,
    0.2,
    envelopeMaterial
  );

  box(
    L / 2,
    H / 2,
    W,
    L,
    H,
    0.2,
    envelopeMaterial
  );

  // Testate: piani verticali Y/Z.
  box(
    0,
    H / 2,
    W / 2,
    0.2,
    H,
    W,
    envelopeMaterial
  );

  box(
    L,
    H / 2,
    W / 2,
    0.2,
    H,
    W,
    envelopeMaterial
  );

  // Pavimento: piano X/Z con quota superiore Y=0.
  box(
    L / 2,
    -0.1,
    W / 2,
    L,
    0.2,
    W,
    envelopeMaterial
  );

  fit(s);
}

function fit(s) {
  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
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
    (sum, campata) => sum + Number(campata.interasse || 0),
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
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);

  camera.position.set(
    L / 2,
    Math.max(L, W) * 1.5,
    W / 2
  );

  controls.target.set(L / 2, 0, W / 2);
  controls.update();
}

export function vistaFront() {
  const s = window.CACEM_STATE;
  if (!s) return;

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const H = Number(s.generale.altezzaPilastro || 0);

  camera.position.set(
    L / 2,
    H / 2,
    -Math.max(L, H) * 1.5
  );

  controls.target.set(L / 2, H / 2, 0);
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

  controls.target.set(0, H / 2, W / 2);
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
