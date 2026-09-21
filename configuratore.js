const V=document.querySelector('#viewport');
const state={bays:4,spacing:600,depth:1800,height:750,pluviale:true,selected:'PP2-01'};
let scene,camera,renderer,controls,model;
function init(){
  scene=new THREE.Scene(); scene.background=new THREE.Color(0xe9edf0);
  camera=new THREE.PerspectiveCamera(38,1,1,20000); renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); V.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x75808a,1.8));
  const light=new THREE.DirectionalLight(0xffffff,2.3); light.position.set(2500,4000,1800); scene.add(light);
  model=new THREE.Group(); scene.add(model);
  controls=new THREE.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.08;
  window.addEventListener('resize',resize); resize(); rebuild(); animate();
}
function mat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.62,metalness:.06})}
function pillar(x,z,id){
  const g=new THREE.Group(); g.userData={id,type:'PP2'};
  const body=new THREE.Mesh(new THREE.BoxGeometry(60,60,state.height),mat(0x9da5ab)); body.position.y=state.height/2; g.add(body);
  if(state.pluviale){const p=new THREE.Mesh(new THREE.CylinderGeometry(6,6,state.height*.9,14),mat(0x30373d));p.position.set(0, state.height*.45, 26);g.add(p)}
  g.position.set(x,0,z); return g;
}
function beam(x,z){
  const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(state.spacing,55,65),mat(0x5e6871)); b.position.set(state.spacing/2,state.height,0); g.add(b); g.position.set(x,0,z); return g;
}
function rebuild(){
  while(model.children.length)model.remove(model.children[0]);
  for(let i=0;i<=state.bays;i++)model.add(pillar(i*state.spacing,0,'PP2-'+String(i+1).padStart(2,'0')));
  for(let i=0;i<state.bays;i++)model.add(beam(i*state.spacing,0));
  model.rotation.y=-.52; model.rotation.x=-.05; fit();
  document.querySelector('#baysOut').textContent=state.bays;
  document.querySelector('#pillarsOut').textContent=state.bays+1;
  document.querySelector('#beamsOut').textContent=state.bays;
}
function fit(){
  const box=new THREE.Box3().setFromObject(model), c=box.getCenter(new THREE.Vector3()), s=box.getSize(new THREE.Vector3()), m=Math.max(s.x,s.y,s.z,1);
  camera.position.set(c.x+m*1.7,c.y+m*1.35,c.z+m*1.55); controls.target.copy(c); controls.update();
}
function resize(){const r=V.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
function view(kind){
  if(kind==='top'){camera.position.set(0,Math.max(1500,state.depth*1.1),1);controls.target.set(state.bays*state.spacing/2,0,0)}
  if(kind==='front'){camera.position.set(state.bays*state.spacing*1.2,Math.max(450,state.height*.75),state.bays*state.spacing*1.8);controls.target.set(state.bays*state.spacing/2,state.height/2,0)}
  if(kind==='side'){camera.position.set(1,Math.max(500,state.height*.7),state.depth*1.4);controls.target.set(0,state.height/2,0)}
  if(kind==='orbit'){camera.position.set(state.bays*state.spacing*1.1,state.height*1.9,state.depth*.9)}
  controls.update()
}
document.querySelector('#bays').oninput=e=>{state.bays=Math.max(1,Math.min(20,+e.target.value||1));rebuild()};
document.querySelector('#spacing').oninput=e=>{state.spacing=Math.max(100,+e.target.value||600);rebuild()};
document.querySelector('#depth').oninput=e=>{state.depth=Math.max(500,+e.target.value||1800);rebuild()};
document.querySelector('#height').oninput=e=>{state.height=Math.max(100,+e.target.value||750);rebuild()};
document.querySelector('#pluviale').onclick=e=>{state.pluviale=!state.pluviale;e.currentTarget.classList.toggle('on',state.pluviale);rebuild()};
document.querySelector('#fit').onclick=fit;document.querySelector('#home').onclick=fit;document.querySelector('#zoomIn').onclick=()=>camera.position.multiplyScalar(.82);document.querySelector('#zoomOut').onclick=()=>camera.position.multiplyScalar(1.22);
document.querySelector('#orbit').onclick=()=>view('orbit');document.querySelector('#top').onclick=()=>view('top');document.querySelector('#front').onclick=()=>view('front');document.querySelector('#side').onclick=()=>view('side');
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-mode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#viewName').textContent={model:'Assonometria',plan:'Pianta',section:'Sezione',elevation:'Prospetto',render:'Render'}[b.dataset.mode]||'Assonometria'});
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{document.querySelector('#selectedId').textContent=b.dataset.add+'-NUOVO';document.querySelector('#selectedName').textContent=b.dataset.add+(b.dataset.add==='PP2'?' · Pilastro':' · Trave');document.querySelector('#selectedIcon').textContent=b.dataset.add});
init();