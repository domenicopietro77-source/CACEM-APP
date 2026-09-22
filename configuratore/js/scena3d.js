// scena3d.js — Scena 3D STEP 4, collegata al modello strutturale e ai cataloghi
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {trovaPilastro,trovaTrave,trovaTegolo} from './catalogo.js';
import {lunghezzaTotale} from './modello.js';

let scene,camera,renderer,controls,gruppoCapannone,inizializzato=false,wireframe=false;
const C={pil:0x8a8f99,trave:0x6fa8dc,tegolo:0xd4d4d4,pannello:0xb8b8b8,griglia:0x2a2f38,terreno:0x1a1d22};

export function initScena3D(){
 if(inizializzato)return; const c=document.getElementById('view-3d');if(!c)return;
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(c.clientWidth,c.clientHeight);renderer.setClearColor(0x14171c,1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;c.appendChild(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(50,Math.max(c.clientWidth,1)/Math.max(c.clientHeight,1),.1,1000);camera.position.set(60,45,60);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(0,3,0);controls.maxPolarAngle=Math.PI/2-.02;controls.update();
 scene.add(new THREE.AmbientLight(0xffffff,.6));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(80,100,60);dl.castShadow=true;scene.add(dl);scene.add(new THREE.HemisphereLight(0x8ec7ff,0x202020,.35));
 const g=new THREE.GridHelper(300,300,C.griglia,C.griglia);g.position.y=.01;g.material.opacity=.35;g.material.transparent=true;scene.add(g);
 gruppoCapannone=new THREE.Group();scene.add(gruppoCapannone);window.addEventListener('resize',onResize);inizializzato=true;animate();
}
function animate(){requestAnimationFrame(animate);controls?.update();if(renderer&&scene&&camera)renderer.render(scene,camera)}
function onResize(){const c=document.getElementById('view-3d');if(!c||!renderer||!camera)return;const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}
export function resizeScena3D(){onResize()}
function clearGroup(){while(gruppoCapannone.children.length){const o=gruppoCapannone.children.pop();o.traverse(x=>{x.geometry?.dispose();if(x.material){const m=Array.isArray(x.material)?x.material:[x.material];m.forEach(mm=>mm.dispose())}})}}
function material(color){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.04,wireframe})}
function box(w,h,d,x,y,z,m){const q=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d)),m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;gruppoCapannone.add(q);return q}
export function aggiornaScena3D(stato){
 if(!inizializzato)initScena3D();if(!gruppoCapannone)return;clearGroup();
 const g=stato.generale,L=Math.max(1,lunghezzaTotale(stato)),W=Math.max(1,+g.luce||30),H=Math.max(1,+g.altezzaPilastro||6),salita=W/2*(+g.pendenzaCopertura||5)/100,Hc=H+salita;
 const p=trovaPilastro(stato.pilastri.tipoId),t=trovaTrave(stato.travi.tipoId),teg=trovaTegolo(stato.copertura.tegoloId);
 const sx=p.sezione.l/100,sy=p.sezione.h/100,n=stato.campate.length+1,passo=L/Math.max(1,n-1);
 const mp=material(C.pil);for(let fila=0;fila<2;fila++){const z=(fila?1:-1)*(W/2-sy/2);for(let i=0;i<n;i++)box(sx,H,sy,-L/2+i*passo,H/2,z,mp)}
 const mt=material(C.trave),bt=t.base/100,at=t.altezza/100;
 box(L,at,bt,0,H-at/2,W/2-sy/2,mt);box(L,at,bt,0,H-at/2,-W/2+sy/2,mt);
 const lf=Math.sqrt((W/2)**2+salita**2),ang=Math.atan2(salita,W/2);
 for(let i=0;i<n;i++){const x=-L/2+i*passo;for(const s of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(bt,at,lf),material(C.trave));m.position.set(x,H+(salita/2),s*W/4);m.rotation.x=s<0?ang:-ang;m.castShadow=true;gruppoCapannone.add(m)}}
 const mpan=material(C.pannello),sp=(+stato.pannelli.spessore||20)/100;
 box(L,H,sp,0,H/2,-W/2+sp/2,mpan);box(L,H,sp,0,H/2,W/2-sp/2,mpan);box(sp,H,W,-L/2+sp/2,H/2,0,mpan);box(sp,H,W,L/2-sp/2,H/2,0,mpan);
 const mc=material(C.tegolo),tc=Math.max(.2,teg.altezza/100),lc=Math.max(.6,teg.larghezza/100),numero=Math.max(1,Math.ceil(L/lc));
 for(let i=0;i<numero;i++){const x=-L/2+(i+.5)*(L/numero);for(const s of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(L/numero,tc,lf),mc);m.position.set(x,H+at+salita/2,s*W/4);m.rotation.x=s<0?ang:-ang;m.castShadow=true;gruppoCapannone.add(m)}}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(L,W),new THREE.MeshStandardMaterial({color:C.terreno,roughness:1,wireframe:false}));floor.rotation.x=-Math.PI/2;gruppoCapannone.add(floor);
}
function cam(x,y,z){if(!camera||!controls)return;const t=controls.target;camera.position.set(t.x+x,t.y+y,t.z+z);controls.update()}
export function vistaTop(){cam(0,120,.001)} export function vistaFront(){cam(0,5,120)} export function vistaLato(){cam(120,5,0)} export function vistaIsometrica(){cam(60,45,60)}
export function toggleWireframe(){wireframe=!wireframe;gruppoCapannone?.traverse(o=>{if(o.isMesh&&o.material){const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m.wireframe=wireframe)}});return wireframe}
