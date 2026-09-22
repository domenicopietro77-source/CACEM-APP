const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={project:null,catalog:null,items:[],selected:null,view:"3d",grid:true,snap:true,mode:"select"};
let scene,camera,renderer,controls,root,raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();

const materials={
 pillar:new THREE.MeshStandardMaterial({color:0xb8bec2,roughness:.75}),
 beam:new THREE.MeshStandardMaterial({color:0x8d969c,roughness:.72}),
 floor:new THREE.MeshStandardMaterial({color:0xcbd1d5,roughness:.85,transparent:true,opacity:.55}),
 roof:new THREE.MeshStandardMaterial({color:0x707b82,roughness:.82,transparent:true,opacity:.7}),
 selected:new THREE.MeshStandardMaterial({color:0xe31b23,roughness:.5})
};

async function loadSource(){
 const [a,b]=await Promise.all([fetch("data/cacem-project.json"),fetch("data/cacem-catalog.json")]);
 if(!a.ok||!b.ok) throw new Error("Dati CACEM non disponibili");
 state.project=await a.json(); state.catalog=await b.json();
 buildSourceModel(); populateLibrary(); updateStatus("MODELLO DA SORGENTE DXF");
}

function addSourcePillar(x,y,row){
 const id="P-"+row+"-"+x.toFixed(3);
 state.items.push({id,type:"PP?",family:"PILASTRO",x,y,z:0,source:true});
}
function buildSourceModel(){
 state.items=[];
 const p=state.project.mainPlan;
 p.pillarCenterX.forEach(x=>addSourcePillar(x,p.topRowY,"TOP"));
 p.lowerPillarCenterX.forEach(x=>addSourcePillar(x,p.bottomRowY,"BOTTOM"));
 [286.393].forEach(y=>[72.620368,81.577034,90.358145].forEach(x=>addSourcePillar(x,y,"SPECIAL")));
 [291.183].forEach(y=>[154.610368,160.400368].forEach(x=>addSourcePillar(x,y,"SPECIAL")));
 renderModel(); updateMetrics(); fit();
}
function renderModel(){
 while(root.children.length) root.remove(root.children[0]);
 state.items.forEach(it=>{
   if(it.type==="PP?"){
     const o=new THREE.Mesh(new THREE.BoxGeometry(.55,7.5,.55),materials.pillar);
     o.position.set((it.x-72.620368),3.75,(it.y-280.993));
     o.userData.id=it.id; root.add(o); it.object=o;
   }
 });
 // schematic connections derived from actual plan axes; profiles remain intentionally unresolved
 const p=state.project.mainPlan;
 const xs=[...new Set([...p.pillarCenterX,...p.lowerPillarCenterX])].sort((a,b)=>a-b);
 const makeBeam=(x1,x2,y)=>{
   const len=x2-x1; const o=new THREE.Mesh(new THREE.BoxGeometry(len,.45,.35),materials.beam);
   o.position.set((x1+x2)/2-72.620368,7.5,(y-280.993)); o.userData.id="B-"+x1+"-"+x2+"-"+y; root.add(o);
 };
 for(let i=0;i<xs.length-1;i++){ makeBeam(xs[i],xs[i+1],p.topRowY); makeBeam(xs[i],xs[i+1],p.bottomRowY); }
 makeGrid();
}
function makeGrid(){
 const old=scene.getObjectByName("sourceGrid"); if(old) scene.remove(old);
 if(!state.grid)return;
 const p=state.project.mainPlan, minX=Math.min(...p.pillarCenterX),maxX=Math.max(...p.pillarCenterX);
 const g=new THREE.GridHelper(Math.max(maxX-minX,20)*1.25,20,0x9ba5aa,0xc5cdd1);
 g.name="sourceGrid"; g.position.set((maxX-minX)/2,0,(p.bottomRowY-p.topRowY)/2); scene.add(g);
}
function updateMetrics(){
 const n=state.items.filter(x=>x.family==="PILASTRO").length;
 $("#mBays").textContent="10"; $("#mPillars").textContent=n; $("#mBeams").textContent="20"; $("#mLevels").textContent="1";
}
function populateLibrary(){
 const lib=$(".left");
 const title=lib.querySelector(".libGroup");
 const box=document.createElement("div"); box.className="libGroup";
 box.innerHTML="<label>CATALOGO DA SCHEDE</label>";
 const families=state.catalog.families;
 Object.entries(families).forEach(([family,data])=>{
   const b=document.createElement("button"); b.className="libItem";
   b.innerHTML="<span><b>"+family.replaceAll("_"," ").toUpperCase()+"</b><small>"+data.types.join(" · ")+"</small></span><i>✓</i>";
   box.appendChild(b);
 });
 lib.insertBefore(box,title);
}
function updateStatus(t){$("#status").textContent=t}
function resize(){const v=$("#viewport"),w=v.clientWidth,h=v.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
function fit(){const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z)*1.8;camera.position.set(c.x+d,c.y+d*.75,c.z+d);controls.target.copy(c);controls.update()}
function view(v){state.view=v;const c=root.getBoundingClientRect?null:null;const box=new THREE.Box3().setFromObject(root),ctr=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()),d=Math.max(sz.x,sz.y,sz.z)*1.8;
 if(v==="plan"||v==="roof"){camera.position.set(ctr.x,d,ctr.z);controls.target.set(ctr.x,0,ctr.z)}
 else if(v==="front"){camera.position.set(ctr.x,ctr.y,d);controls.target.set(ctr.x,ctr.y,ctr.z)}
 else if(v==="section"){camera.position.set(d,ctr.y,ctr.z);controls.target.copy(ctr)}
 else {camera.position.set(ctr.x+d*.8,ctr.y+d*.55,ctr.z+d*.8);controls.target.copy(ctr)}
 controls.update();$("#viewBadge").textContent=v==="3d"?"MODELLO 3D":v.toUpperCase()}
function select(id){
 state.selected=id;
 root.children.forEach(o=>o.material=o.userData.id===id?materials.selected:(o.userData.id&&o.userData.id.startsWith("B-")?materials.beam:materials.pillar));
 const it=state.items.find(x=>x.id===id);
 $("#emptySel").hidden=!!it; $("#props").hidden=!it;
 if(it){$("#selName").textContent=it.id+" · "+it.family+" · tipo da scheda";$("#px").value=it.x.toFixed(3);$("#py").value=it.y.toFixed(3);$("#pz").value=it.z||0;$("#prot").value=0;$("#pluv").checked=false}
}
function pick(e){
 if(state.mode!=="select")return;
 const r=renderer.domElement.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(root.children,false)[0];select(hit?hit.object.userData.id:null);
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0xdfe4e7);
 camera=new THREE.PerspectiveCamera(42,1,0.1,100000);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$("#viewport").appendChild(renderer.domElement);
 controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x68747c,1.8));const dl=new THREE.DirectionalLight(0xffffff,1.4);dl.position.set(5000,8000,5000);scene.add(dl);
 root=new THREE.Group();scene.add(root);resize();window.addEventListener("resize",resize);renderer.domElement.addEventListener("pointerdown",pick);
 animate();
}
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
$$("[data-view]").forEach(b=>b.onclick=()=>view(b.dataset.view));
$("#fit").onclick=fit;
$("#grid").onclick=()=>{state.grid=!state.grid;$("#grid").classList.toggle("on",state.grid);makeGrid()};
$("#modeSelect").onclick=()=>{state.mode="select";$("#modeSelect").classList.add("active");$("#modeMove").classList.remove("active")};
$("#modeMove").onclick=()=>{updateStatus("Spostamento: in sviluppo sul modello sorgente");$("#modeSelect").classList.remove("active");$("#modeMove").classList.add("active")};
$("#snap").onclick=()=>{state.snap=!state.snap;$("#snap").classList.toggle("on",state.snap)};
$("#search").oninput=e=>$$(".libItem").forEach(b=>b.style.display=b.innerText.toLowerCase().includes(e.target.value.toLowerCase())?"flex":"none");
$("#dxfInput").onchange=e=>{if(e.target.files[0])updateStatus("DXF ricevuto: la sorgente ufficiale resta il file esecutivo")};
$("#export").onclick=()=>updateStatus("Esportazione DXF: verrà collegata al modello centrale");
$("#save").onclick=()=>{localStorage.cacemSourceModel=JSON.stringify(state.items.map(x=>({...x,object:undefined})));updateStatus("Modello sorgente salvato")};
$("#applyGrid").onclick=()=>updateStatus("La maglia del progetto sorgente non viene sostituita da una maglia generica");
$("#delete").onclick=()=>updateStatus("Eliminazione disponibile dopo la definizione semantica dell'elemento");
$("#addLevel").onclick=()=>updateStatus("Interpi​ano: usare la scheda e la carpenteria sorgente");
init(); loadSource().catch(e=>updateStatus("Errore caricamento modello sorgente: "+e.message));