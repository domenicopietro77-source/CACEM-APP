const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={
 project:null,catalog:null,items:[],selected:null,view:"3d",grid:true,snap:true,mode:"select",
 config:{bays:6,spacing:900,depth:1500,height:800,pillarType:"PP2",pillarSize:60,drainDia:160,foundation:"BICCHIERE",
 beamLong:"TL",beamTrans:"TL",beamH:75,beamW:50,floorOn:false,floorZ:400,floorType:"TT",floorT:25,
 roofType:"AL",roofSlope:7,coping:"CURVA PICCOLA",roofT:12,panelType:"VERTICALE",panelT:24,finish:"FACCIA VISTA",gran1:50,gran2:50,
 consoles:{floor:true,beam:false,crane:false}}
};
let scene,camera,renderer,controls,root,raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),drag=null;
const MAT={
 pillar:new THREE.MeshStandardMaterial({color:0xb9bec1,roughness:.76}),
 beam:new THREE.MeshStandardMaterial({color:0x8c969c,roughness:.72}),
 floor:new THREE.MeshStandardMaterial({color:0xc6cdd1,roughness:.82}),
 roof:new THREE.MeshStandardMaterial({color:0x68747b,roughness:.82}),
 panel:new THREE.MeshStandardMaterial({color:0xd3d6d7,roughness:.9}),
 console:new THREE.MeshStandardMaterial({color:0x9ba3a8,roughness:.75}),
 foundation:new THREE.MeshStandardMaterial({color:0x777f84,roughness:.95}),
 selected:new THREE.MeshStandardMaterial({color:0xe31b23,roughness:.5}),
 line:new THREE.LineBasicMaterial({color:0x4e5960}),
 cut:new THREE.LineBasicMaterial({color:0xe31b23})
};
const familyDefs={
 "PILASTRI":[["PP1","Pilastro prefabbricato"],["PP2","Pilastro prefabbricato"],["PP4","Pilastro con mensola"],["PP5","Pilastro con mensola"],["PP6","Pilastro con mensola"],["PP7","Pilastro prefabbricato"],["PP8","Pilastro prefabbricato"],["PP9","Pilastro prefabbricato"],["PP10","Pilastro prefabbricato"]],
 "TRAVI":[["TL","Trave doppia pendenza / copertura"],["TD","Trave principale"],["TDR","Trave di bordo"],["TLR","Trave rialzata"],["R","Trave rettangolare"],["TU","Trave canale"],["TI","Trave interpiano"],["TNL","Trave terminale"]],
 "MENSOLE":[["MENSOLA SOLAIO","Mensola per solaio"],["MENSOLA TRAVE","Mensola per trave"],["MENSOLA CARROPONTE","Mensola carroponte"]],
 "SOLAI":[["TT","Solaio TT"],["LL","Solaio LL / lastra"]],
 "COPERTURA":[["AL","Tegolo AL / alare"],["TY","Tegolo TY"]],
 "COPPELLE":[["CURVA PICCOLA","Coppella curva piccola"],["CURVA GRANDE","Coppella curva grande"],["CURVA SPECIALE","Coppella curva speciale"],["LAMIERA","Coppella in lamiera"]],
 "PANNELLI":[["VERTICALE","Pannello verticale"],["ORIZZONTALE","Pannello orizzontale"]]
};
function cfgFromUI(){
 const c=state.config;
 c.bays=+$("#bays").value;c.spacing=+$("#spacing").value;c.depth=+$("#depth").value;c.height=+$("#height").value;
 c.pillarType=$("#pillarType").value;c.pillarSize=+$("#pillarSize").value;c.drainDia=+$("#drainDia").value;c.foundation=$("#foundation").value;
 c.beamLong=$("#beamLong").value;c.beamTrans=$("#beamTrans").value;c.beamH=+$("#beamH").value;c.beamW=+$("#beamW").value;
 c.floorOn=$("#floorOn").value==="SI";c.floorZ=+$("#floorZ").value;c.floorType=$("#floorType").value;c.floorT=+$("#floorT").value;
 c.roofType=$("#roofType").value;c.roofSlope=+$("#roofSlope").value;c.coping=$("#coping").value;c.roofT=+$("#roofT").value;
 c.panelType=$("#panelType").value;c.panelT=+$("#panelT").value;c.finish=$("#finish").value;c.gran1=+$("#gran1").value;c.gran2=+$("#gran2").value;
 c.consoles={floor:$("#consoleFloor").checked,beam:$("#consoleBeam").checked,crane:$("#consoleCrane").checked};
 return c;
}
function setUI(c){Object.entries({bays:c.bays,spacing:c.spacing,depth:c.depth,height:c.height,pillarType:c.pillarType,pillarSize:c.pillarSize,drainDia:c.drainDia,foundation:c.foundation,beamLong:c.beamLong,beamH:c.beamH,beamTrans:c.beamTrans,beamW:c.beamW,floorZ:c.floorZ,floorT:c.floorT,roofSlope:c.roofSlope,roofT:c.roofT,panelT:c.panelT,gran1:c.gran1,gran2:c.gran2}).forEach(([k,v])=>{const e=$("#"+k);if(e)e.value=v});
 $("#floorOn").value=c.floorOn?"SI":"NO";$("#floorType").value=c.floorType;$("#roofType").value=c.roofType;$("#coping").value=c.coping;$("#panelType").value=c.panelType;$("#finish").value=c.finish;
 $("#consoleFloor").checked=c.consoles.floor;$("#consoleBeam").checked=c.consoles.beam;$("#consoleCrane").checked=c.consoles.crane;
}
function item(id,family,type,x,y,z,dx,dy,dz,weightDensity=2.5){
 const volume=(dx*dy*dz)/1e6;return {id,family,type,x,y,z,dx,dy,dz,rot:0,volume,density:weightDensity,weight:volume*weightDensity};
}
function rebuildModel(){
 const c=cfgFromUI(); state.items=[];
 const sx=c.spacing/100, dep=c.depth/100, h=c.height/100, w=c.pillarSize/100;
 for(let i=0;i<=c.bays;i++){
   const x=i*sx;
   state.items.push(item("P"+i+"A","PILASTRI",c.pillarType,x,0,h/2,w,w,h));
   state.items.push(item("P"+i+"B","PILASTRI",c.pillarType,x,dep,h/2,w,w,h));
 }
 // longitudinal beams
 for(let i=0;i<c.bays;i++){
   const x=i*sx+sx/2;
   state.items.push(item("BL"+i,"TRAVI",c.beamLong,x,0,h,w/100, c.beamW/100,sx));
   state.items.push(item("BLB"+i,"TRAVI",c.beamLong,x,dep,h,w/100,c.beamW/100,sx));
 }
 // transverse roof beams/rafters
 for(let i=0;i<=c.bays;i++){
   state.items.push(item("BT"+i,"TRAVI",c.beamTrans,i*sx,dep/2,h,dep,c.beamW/100,c.beamH/100));
 }
 if(c.floorOn){
   state.items.push(item("FLOOR","SOLAI",c.floorType,(c.bays*sx)/2,dep/2,c.floorZ/100,c.bays*sx,dep,c.floorT/100,2.5));
 }
 // roof: one approximate sloped roof plane per bay
 const roofZ=h+Math.tan(c.roofSlope*Math.PI/180)*(dep/2);
 for(let i=0;i<c.bays;i++){
   state.items.push(item("R"+i,"COPERTURA",c.roofType,(i+.5)*sx,dep/2,roofZ,sx,dep,c.roofT/100,2.5));
 }
 // panels: perimeter walls
 const pt=c.panelT/100;
 for(let i=0;i<c.bays;i++){
   const x=(i+.5)*sx;
   state.items.push(item("PVF"+i,"PANNELLI",c.panelType,x,0,h/2,sx,pt,h,2.4));
   state.items.push(item("PVB"+i,"PANNELLI",c.panelType,x,dep,h/2,sx,pt,h,2.4));
 }
 if(c.consoles.floor) for(let i=0;i<=c.bays;i++) state.items.push(item("MS"+i,"MENSOLE","MENSOLA SOLAIO",i*sx,dep/2,c.floorZ/100,w,.35,.30,2.5));
 if(c.consoles.beam) for(let i=0;i<=c.bays;i++) state.items.push(item("MT"+i,"MENSOLE","MENSOLA TRAVE",i*sx,dep/2,h-.35,.7,.45,.35,2.5));
 if(c.consoles.crane) for(let i=0;i<=c.bays;i++) state.items.push(item("MC"+i,"MENSOLE","MENSOLA CARROPONTE",i*sx,dep/2,h*.62,.8,.45,.35,2.5));
 renderModel();updateMetrics();updateSummary();fit();updateStatus("Modello parametrico aggiornato");
}
function makeMesh(it){
 let g;
 if(it.family==="PILASTRI") g=new THREE.BoxGeometry(it.dx,it.dz,it.dy);
 else if(it.family==="TRAVI") g=new THREE.BoxGeometry(it.dx,it.dz,it.dy);
 else if(it.family==="MENSOLE") g=new THREE.BoxGeometry(it.dx,it.dz,it.dy);
 else g=new THREE.BoxGeometry(it.dx,it.dz,it.dy);
 const m=it.family==="PILASTRI"?MAT.pillar:it.family==="TRAVI"?MAT.beam:it.family==="MENSOLE"?MAT.console:it.family==="PANNELLI"?MAT.panel:it.family==="COPERTURA"?MAT.roof:MAT.floor;
 const o=new THREE.Mesh(g,m);o.position.set(it.x,it.z,it.y);o.userData.id=it.id;o.userData.type=it.type;
 if(it.family==="PANNELLI" && state.config.finish==="GRANIGLIATO"){o.material=new THREE.MeshStandardMaterial({color:0xc8c0b0,roughness:1})}
 return o;
}
function renderModel(){
 while(root.children.length)root.remove(root.children[0]);
 state.items.forEach(it=>{const o=makeMesh(it);root.add(o);it.object=o});
 // foundations / bicchieri
 if(state.config.foundation==="BICCHIERE")state.items.filter(i=>i.family==="PILASTRI").forEach((it,n)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(it.dx*1.8,.45,it.dy*1.8),MAT.foundation);o.position.set(it.x,.225,it.y);o.userData.id="F-"+n;root.add(o)});
 // drains
 state.items.filter(i=>i.family==="PILASTRI").forEach((it,n)=>{const r=Math.max(state.config.drainDia/2000,.03);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,it.dz*.8,16),MAT.beam);o.position.set(it.x,it.z*.52,it.y);o.userData.id="D-"+n;root.add(o)});
 makeGrid();
}
function makeGrid(){
 const old=scene.getObjectByName("grid");if(old)scene.remove(old);if(!state.grid)return;
 const c=state.config,sx=c.spacing/100,dep=c.depth/100,size=Math.max(c.bays*sx,dep)*1.25;
 const g=new THREE.GridHelper(size,Math.max(10,c.bays*2),0x9ba5aa,0xc7cdd1);g.name="grid";g.position.set(c.bays*sx/2,0,dep/2);scene.add(g);
}
function updateMetrics(){
 const pillars=state.items.filter(i=>i.family==="PILASTRI").length;
 const wt=state.items.reduce((s,i)=>s+i.weight,0);
 $("#mBays").textContent=state.config.bays;$("#mPillars").textContent=pillars;$("#mElements").textContent=state.items.length;$("#mWeight").textContent=wt.toFixed(1)+" t";
}
function populateLibrary(){
 const el=$("#library");el.innerHTML="";
 Object.entries(familyDefs).forEach(([family,arr])=>{
   const g=document.createElement("div");g.className="libGroup";g.innerHTML="<label>"+family+"</label>";
   arr.forEach(([type,desc])=>{const b=document.createElement("button");b.className="libItem";b.dataset.search=(family+" "+type+" "+desc).toLowerCase();b.innerHTML='<span class="icon">'+type.slice(0,3)+'</span><span><b>'+type+'</b><small>'+desc+'</small></span><i>+</i>';b.onclick=()=>addLibraryElement(family,type);g.appendChild(b)});
   el.appendChild(g);
 });
}
function addLibraryElement(family,type){
 const c=state.config,sx=c.spacing/100,dep=c.depth/100,h=c.height/100,centerX=c.bays*sx/2;
 let it;
 if(family==="PILASTRI")it=item("P"+Date.now(),"PILASTRI",type,centerX,dep/2,h/2,c.pillarSize/100,c.pillarSize/100,h);
 else if(family==="TRAVI")it=item("T"+Date.now(),"TRAVI",type,centerX,dep/2,h,c.spacing/100,c.beamW/100,c.beamH/100);
 else if(family==="MENSOLE")it=item("M"+Date.now(),"MENSOLE",type,centerX,dep/2,h*.7,.8,.45,.35);
 else if(family==="SOLAI")it=item("S"+Date.now(),"SOLAI",type,centerX,dep/2,c.floorZ/100,sx,dep,c.floorT/100);
 else if(family==="COPERTURA")it=item("C"+Date.now(),"COPERTURA",type,centerX,dep/2,h+.2,sx,dep,.12);
 else if(family==="COPPELLE")it=item("K"+Date.now(),"COPPELLE",type,centerX,dep/2,h+.35,sx,dep,.12,2.4);
 else it=item("PN"+Date.now(),"PANNELLI",type,centerX,type==="VERTICALE"?0:dep/2,h/2,sx,c.panelT/100,h,2.4);
 state.items.push(it);renderModel();updateMetrics();select(it.id);updateSummary();updateStatus("Inserito "+type+" · elemento parametrico");
}
function select(id){
 state.selected=id;root.children.forEach(o=>{if(!o.material||!o.userData.id)return;o.material=o.userData.id===id?MAT.selected:materialFor(o.userData.id)});
 const it=state.items.find(x=>x.id===id);$("#emptySel").hidden=!!it;$("#props").hidden=!it;
 if(it){$("#selName").textContent=it.id+" · "+it.family+" · "+it.type;$("#px").value=(it.x*100).toFixed(1);$("#py").value=(it.y*100).toFixed(1);$("#pz").value=(it.z*100).toFixed(1);$("#prot").value=it.rot||0}
}
function materialFor(id){const it=state.items.find(x=>x.id===id);if(!it)return MAT.beam;return it.family==="PILASTRI"?MAT.pillar:it.family==="TRAVI"?MAT.beam:it.family==="MENSOLE"?MAT.console:it.family==="PANNELLI"?MAT.panel:it.family==="COPERTURA"?MAT.roof:MAT.floor}
function pick(e){
 const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);
 const hit=raycaster.intersectObjects(root.children,false).find(h=>h.object.userData.id&&!h.object.userData.id.startsWith("F-")&&!h.object.userData.id.startsWith("D-"));
 if(hit)select(hit.object.userData.id);else select(null);
}
function startDrag(e){
 if(state.mode!=="move")return;const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);
 const hit=raycaster.intersectObjects(root.children,false).find(h=>h.object.userData.id&&state.items.some(i=>i.id===h.object.userData.id));if(hit){select(hit.object.userData.id);drag=state.items.find(i=>i.id===hit.object.userData.id);updateStatus("Sposta "+drag.type+" · trascina nel modello")}}
function moveDrag(e){
 if(!drag)return;const r=renderer.domElement.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*2-1,y=-((e.clientY-r.top)/r.height)*2+1;
 const p=new THREE.Vector3(x,y,.5).unproject(camera),dir=p.sub(camera.position).normalize(),dist=-camera.position.y/dir.y;const hit=camera.position.clone().add(dir.multiplyScalar(dist));
 const snap=state.snap?.1:0;drag.x=snap?Math.round(hit.x/snap)*snap:hit.x;drag.y=snap?Math.round(hit.z/snap)*snap:hit.z;drag.object.position.set(drag.x,drag.z,drag.y);updatePropsUI(drag);updateSummary();updateMetrics()
}
function endDrag(){if(drag){drag=null;updateStatus("Posizione aggiornata");}}
function updatePropsUI(it){$("#px").value=(it.x*100).toFixed(1);$("#py").value=(it.y*100).toFixed(1);$("#pz").value=(it.z*100).toFixed(1)}
function applyProps(){
 const it=state.items.find(x=>x.id===state.selected);if(!it)return;
 it.x=+$("#px").value/100;it.y=+$("#py").value/100;it.z=+$("#pz").value/100;it.rot=+$("#prot").value||0;
 if(it.object){it.object.position.set(it.x,it.z,it.y);it.object.rotation.y=it.rot*Math.PI/180}
 updateSummary();updateMetrics();updateStatus("Posizione applicata");
}
function deleteSelected(){
 const idx=state.items.findIndex(x=>x.id===state.selected);if(idx<0)return;state.items.splice(idx,1);state.selected=null;renderModel();updateMetrics();updateSummary();select(null);updateStatus("Elemento eliminato");
}
function fit(){
 const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z)*1.8;camera.position.set(c.x+d*.85,c.y+d*.65,c.z+d*.85);controls.target.copy(c);controls.update();
}
function view(v){
 state.view=v;const box=new THREE.Box3().setFromObject(root);const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z)*1.7;
 if(v==="plan"||v==="floor"||v==="roof"){camera.position.set(c.x,d,c.z);controls.target.set(c.x,0,c.z)}
 else if(v==="front"||v==="elev3"){camera.position.set(c.x,c.y,d);controls.target.copy(c)}
 else if(v==="elev2"||v==="elev4"){camera.position.set(d,c.y,c.z);controls.target.copy(c)}
 else if(v==="sectionLong"){camera.position.set(c.x,d*.35,d);controls.target.copy(c)}
 else if(v==="sectionTrans"){camera.position.set(d*.7,d*.35,c.z);controls.target.copy(c)}
 else if(v==="summary"){camera.position.set(c.x,d,c.z);controls.target.set(c.x,0,c.z)}
 else {camera.position.set(c.x+d*.8,c.y+d*.55,c.z+d*.8);controls.target.copy(c)}
 controls.update();
 const names={3d:"MODELLO 3D",plan:"PIANTA PILASTRI",floor:"CARPENTERIA INTERPIANO",roof:"PIANTA COPERTURA",front:"PROSPETTO 1",elev2:"PROSPETTO 2",elev3:"PROSPETTO 3",elev4:"PROSPETTO 4",sectionLong:"SEZIONE LONGITUDINALE",sectionTrans:"SEZIONE TRASVERSALE",summary:"DISTINTA ELEMENTI"};
 $("#viewBadge").textContent=names[v]||v.toUpperCase();$("#drawingInfo").textContent=drawingDescription(v);
 $$(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.view===v));
}
function drawingDescription(v){
 const c=state.config;
 if(v==="plan")return "PIANTA: assi, pilastri quotati, linee di sezione e richiami prospetti 1–2–3–4";
 if(v==="front"||v.startsWith("elev"))return "PROSPETTO ORTOGONALE "+(v==="front"?"1":v==="elev2"?"2":v==="elev3"?"3":"4")+" · nessuna prospettiva";
 if(v==="sectionLong")return "SEZIONE LONGITUDINALE · piano di taglio sul modello";
 if(v==="sectionTrans")return "SEZIONE TRASVERSALE · piano di taglio sul modello";
 if(v==="summary")return "DISTINTA: quantità, volume e peso teorico per famiglia e tipo";
 return "Modello centrale sincronizzato · "+c.bays+" campate × "+c.spacing+" cm · profondità "+c.depth+" cm";
}
function updateSummary(){
 const map={};state.items.forEach(i=>{const k=i.family+"|"+i.type;if(!map[k])map[k]={family:i.family,type:i.type,n:0,v:0,w:0};map[k].n++;map[k].v+=i.volume;map[k].w+=i.weight});
 let html='<div class="summaryPanel"><b>DISTINTA ELEMENTI</b><table><thead><tr><th>FAMIGLIA</th><th>TIPO</th><th>Q.TÀ</th><th>m³</th><th>t</th></tr></thead><tbody>';
 Object.values(map).forEach(r=>html+='<tr><td>'+r.family+'</td><td>'+r.type+'</td><td>'+r.n+'</td><td>'+r.v.toFixed(2)+'</td><td>'+r.w.toFixed(2)+'</td></tr>');
 const total=state.items.reduce((s,i)=>s+i.weight,0),vol=state.items.reduce((s,i)=>s+i.volume,0);
 html+='<tr class="total"><td colspan="2">TOTALE</td><td>'+state.items.length+'</td><td>'+vol.toFixed(2)+'</td><td>'+total.toFixed(2)+'</td></tr></tbody></table><small>Peso teorico: densità media 2.5 t/m³ per elementi cementizi. Da verificare con schede reali.</small></div>';
 $("#drawingInfo").dataset.summary=html;
}
function showSummaryOverlay(){let old=$("#summaryOverlay");if(old)old.remove();const d=document.createElement("div");d.id="summaryOverlay";d.innerHTML=$("#drawingInfo").dataset.summary||"";$("#viewport").appendChild(d)}
function resize(){const v=$("#viewport"),w=v.clientWidth,h=v.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
function save(){const data={project:$("#projectInput").value,config:state.config,items:state.items.map(({object,...x})=>x),savedAt:new Date().toISOString()};localStorage.cacemConfigurator=JSON.stringify(data);updateStatus("Configurazione salvata nel browser")}
function loadSource(){
 return Promise.all([fetch("data/cacem-project.json").then(r=>r.ok?r.json():null),fetch("data/cacem-catalog.json").then(r=>r.ok?r.json():null)]).then(([p,c])=>{state.project=p;state.catalog=c;updateStatus("Catalogo CACEM caricato · profili approssimativi")}).catch(()=>{});
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0xdfe4e7);
 camera=new THREE.PerspectiveCamera(42,1,.01,10000);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$("#viewport").appendChild(renderer.domElement);
 controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
 scene.add(new THREE.HemisphereLight(0xffffff,0x667178,1.7));const dl=new THREE.DirectionalLight(0xffffff,1.3);dl.position.set(50,100,60);scene.add(dl);
 root=new THREE.Group();scene.add(root);resize();window.addEventListener("resize",resize);renderer.domElement.addEventListener("pointerdown",e=>{if(state.mode==="move")startDrag(e);else pick(e)});renderer.domElement.addEventListener("pointermove",moveDrag);renderer.domElement.addEventListener("pointerup",endDrag);animate();
}
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
$$("[data-view]").forEach(b=>b.onclick=()=>{view(b.dataset.view);if(b.dataset.view==="summary")showSummaryOverlay();else{$("#summaryOverlay")?.remove()}});
$("#fit").onclick=fit;$("#grid").onclick=()=>{state.grid=!state.grid;$("#grid").classList.toggle("on",state.grid);makeGrid()};$("#snap").onclick=()=>{state.snap=!state.snap;$("#snap").classList.toggle("on",state.snap)};
$("#modeSelect").onclick=()=>{state.mode="select";$("#modeSelect").classList.add("active");$("#modeMove").classList.remove("active")};
$("#modeMove").onclick=()=>{state.mode="move";$("#modeMove").classList.add("active");$("#modeSelect").classList.remove("active");updateStatus("Modalità SPOSTA attiva")};
$("#delete").onclick=deleteSelected;$("#applyProps").onclick=applyProps;$("#save").onclick=save;
$("#projectInput").oninput=e=>$("#projectName").textContent=e.target.value||"Nuovo capannone";
$("#applyGrid").onclick=rebuildModel;
$("#export").onclick=()=>updateStatus("Esportazione DXF: interfaccia predisposta, collegamento al writer DXF nella fase successiva");
$("#dxfInput").onchange=e=>{if(e.target.files[0])updateStatus("DXF ricevuto: verrà usato per la verifica dei profili reali")};
$("#search").oninput=e=>{$$(".libItem").forEach(b=>b.style.display=b.dataset.search.includes(e.target.value.toLowerCase())?"flex":"none")};
$("#pillarType").onchange=()=>{state.config.pillarType=$("#pillarType").value;rebuildModel()};$("#floorOn").onchange=rebuildModel;
init();populateLibrary();loadSource().finally(()=>{setUI(state.config);rebuildModel();view("3d")});