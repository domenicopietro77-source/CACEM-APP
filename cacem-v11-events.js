(()=>{
const C=CACEM,$=id=>document.getElementById(id),q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const css=`
.cacem-side{display:none!important}.cacem-brand img{content:url('cacem-logo.svg')!important;width:58px!important;height:58px!important;object-fit:contain}.cacem-top-actions{gap:18px!important}.cac-extra-side{position:fixed;left:0;top:58px;bottom:0;width:190px;background:linear-gradient(180deg,#16253a,#111d2e);z-index:50;padding:16px 9px;box-sizing:border-box;color:#fff}.cac-extra-side .side-title{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#8fa4bb;padding:8px 10px}.cac-extra-side button{display:block;width:100%;height:39px;border:0;border-radius:7px;background:transparent;color:#eef5ff;text-align:left;padding:0 12px;font-weight:700;cursor:pointer;font-size:12px;margin:3px 0}.cac-extra-side button:hover,.cac-extra-side button.active{background:#1877f2}.cac-extra-side .side-foot{position:absolute;bottom:18px;left:12px;color:#91a4b9;font-size:10px}.wrap{margin-left:190px!important}.cac-tools{position:absolute;right:12px;top:12px;z-index:12;display:flex;gap:5px;background:rgba(255,255,255,.94);padding:5px;border-radius:8px;box-shadow:0 2px 9px #20364a22}.cac-tools button{width:32px;height:30px;border:1px solid #d5dfeb;background:#fff;border-radius:5px;cursor:pointer;color:#2c4967;font-weight:700}.cac-tools button:hover{background:#e9f2ff}.cac-help{position:absolute;right:12px;top:54px;z-index:13;background:#fff;border:1px solid #d5dfeb;border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.5;box-shadow:0 5px 18px #20364a22;display:none}.cac-help.on{display:block}.cac-hit{cursor:pointer}.cac-hit:hover{filter:brightness(.92)}.cac-selected{stroke:#ff8a00!important;stroke-width:.09!important}.cat-panel{margin-top:8px;border:1px solid #d9e2ee;border-radius:8px;background:#fff;padding:10px}.cat-panel h4{margin:0 0 7px;font-size:12px}.cat-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eef2f6;font-size:11px}.cat-row:last-child{border-bottom:0}.cat-row b{font-weight:800}.height-note{font-size:10px;color:#72869d;margin-top:8px}.height-table{width:100%;border-collapse:collapse;font-size:11px}.height-table td{padding:5px;border-bottom:1px solid #edf1f5}.height-table input{width:62px;padding:5px;border:1px solid #cfd9e5;border-radius:5px}.sec-note{font-size:10px;color:#63788e;margin-top:5px}.threeBox canvas{display:block;width:100%;height:100%}
@media(max-width:1050px){.cac-extra-side{width:64px}.cac-extra-side .side-title,.cac-extra-side .side-foot{display:none}.cac-extra-side button{font-size:0;text-align:center;padding:0}.wrap{margin-left:64px!important}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
function status(t,b=false){const s=$('status');if(s)s.textContent=t;const d=$('statusDot');if(d)d.style.color=b?'#d33':'#19a05d'}
function makeSidebar(){
 if(q('.cac-extra-side'))return;
 const a=document.createElement('aside');a.className='cac-extra-side';a.innerHTML=`<div class="side-title">CATEGORIE ELEMENTI</div><button data-cat="all" class="active">▦ &nbsp; Tutti gli elementi</button><button data-cat="Pilastri">▣ &nbsp; Pilastri</button><button data-cat="Travi">━ &nbsp; Travi</button><button data-cat="Mensole">▰ &nbsp; Mensole trave</button><button data-cat="Mensole solaio">▰ &nbsp; Mensole solaio</button><button data-cat="Solai">▤ &nbsp; Solai</button><button data-cat="Muri">▥ &nbsp; Muri</button><button data-cat="Fondazioni">⌂ &nbsp; Fondazioni</button><button data-cat="anom">⚠ &nbsp; Anomalie ID</button><div class="side-foot">CACEM APP · CAD STRUCTURAL</div>`;document.body.appendChild(a);
 a.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{a.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterCategory(b.dataset.cat)});
}
function filterCategory(cat){
 const es=C.E||[];let list=cat==='all'?es:cat==='anom'?es.filter((e,i)=>e.id&&es.filter(x=>x.id===e.id).length>1):es.filter(e=>e.type===cat);
 $('selected').innerHTML=`<b>${cat==='all'?'Tutti gli elementi':cat}</b><small>${list.length} elementi riconosciuti</small>`;
 renderSVG(list); status((cat==='all'?'Visualizzazione completa':`Categoria ${cat}: ${list.length} elementi`));
}
function analyze(f){if(!f)return; if(/\.dwg$/i.test(f.name)){status('DWG: per la geometria completa serve un motore DWG server. Il DXF viene interpretato direttamente nel browser.',true);return} const r=new FileReader();r.onload=()=>{try{C.E=C.parse(String(r.result||''));C.file=f.name;renderCards();renderAbaco();renderParams();renderSVG();render3D();$('modelName').textContent=f.name;status(`Analisi DXF completata automaticamente · ${C.E.length} entità strutturali riconosciute · ${f.name}`)}catch(e){console.error(e);status('Errore DXF: '+e.message,true)}};r.onerror=()=>status('Errore nella lettura del file DXF',true);r.readAsText(f)}
function sectionsFile(f){if(!f)return;const r=new FileReader();r.onload=()=>{try{C.sections(String(r.result||''));renderSections();render3D();status('SEZIONI associate e memorizzate nel browser. Le quote delle travi e mensole non sono più parametri manuali.')}catch(e){status('Errore SEZIONI: '+e.message,true)}};r.readAsText(f)}
function bindFileInputs(){const fi=$('fileInput'),si=$('secInput');if(fi){fi.onchange=e=>{const f=e.target.files&&e.target.files[0];analyze(f);fi.value=''}}if(si){si.onchange=e=>{const f=e.target.files&&e.target.files[0];sectionsFile(f);si.value=''}};['chooseBtn','loadBtn','topLoad'].forEach(id=>$(id)?.addEventListener('click',()=>fi?.click()));$('secBtn')?.addEventListener('click',()=>si?.click());}
function setupTools(){
 const wrap=$('canvasWrap');if(!wrap||q('.cac-tools'))return;
 const tools=document.createElement('div');tools.className='cac-tools';tools.innerHTML=`<button id="tHome" title="Vista iniziale">⌂</button><button id="tReset" title="Reset">↻</button><button id="tIn" title="Zoom +">＋</button><button id="tOut" title="Zoom −">−</button><button id="tFit" title="Zoom a finestra">⛶</button><button id="tFull" title="Schermo intero">↗</button>`;wrap.appendChild(tools);
 const help=document.createElement('div');help.className='cac-help';help.innerHTML='<b>Controlli 3D</b><br>Mouse sinistro: ruota<br>Rotella: zoom<br>Tasto destro: pan<br>⛶: inquadra tutto';wrap.appendChild(help);
 const home=()=>{if(C.scene)C.scene.home()};
 $('tHome').onclick=home;$('tReset').onclick=()=>{if(C.scene)C.scene.reset()};$('tIn').onclick=()=>{if(C.scene){C.scene.c.position.sub(C.scene.o.target).multiplyScalar(.8).add(C.scene.o.target);C.scene.o.update()}};$('tOut').onclick=()=>{if(C.scene){C.scene.c.position.sub(C.scene.o.target).multiplyScalar(1.25).add(C.scene.o.target);C.scene.o.update()}};$('tFit').onclick=()=>{if(C.scene)C.scene.fit()};$('tFull').onclick=()=>wrap.requestFullscreen?.();$('controlBtn').onclick=()=>help.classList.toggle('on');$('navBtn').onclick=()=>{if(C.scene){C.scene.o.enabled=!C.scene.o.enabled;status(C.scene.o.enabled?'Navigazione 3D attiva':'Navigazione 3D bloccata')}};
 ['home3d','reset3d','zin3d','zout3d','fit3d','full3d'].forEach(id=>$(id)?.remove());
}
function view(v){$('svg2d')?.classList.toggle('on',v==='2d');$('threeBox')?.classList.toggle('on',v==='3d');qa('.vm button').forEach(b=>b.classList.toggle('on',(v==='2d'&&b.id==='v2d2')||(v==='3d'&&b.id==='v3d2')));$('v2d')?.classList.toggle('on',v==='2d');$('v3d')?.classList.toggle('on',v==='3d');if(v==='3d'){render3D();setTimeout(()=>{if(C.scene){const b=$('threeBox').getBoundingClientRect();C.scene.r.setSize(Math.max(10,b.width),Math.max(10,b.height));C.scene.c.aspect=b.width/b.height;C.scene.c.updateProjectionMatrix();C.scene.fit()}},80)}}
function makeSelection(){document.querySelectorAll('#svg2d [data-index]').forEach(n=>n.addEventListener('click',ev=>{ev.stopPropagation();const e=C.E[Number(n.dataset.index)];window.select?.(e);document.querySelectorAll('#svg2d .cac-selected').forEach(x=>x.classList.remove('cac-selected'));n.classList.add('cac-selected');status(`${e.id||'Senza ID'} · ${e.type} selezionato`)}));}
function renderSVG(list=C.E||[]){const svg=$('svg2d');if(!svg)return;if(!C.E.length){svg.innerHTML='<text x="50" y="50" text-anchor="middle" fill="#8796a8">Carica un DXF per iniziare</text>';return}const all=[];C.E.forEach(e=>e.g?.forEach(g=>g.k==='l'?all.push(g.a,g.b):all.push(...g.v)));if(!all.length){svg.innerHTML='';return}const bb={a:Math.min(...all.map(p=>p.x)),b:Math.max(...all.map(p=>p.x)),c:Math.min(...all.map(p=>p.y)),d:Math.max(...all.map(p=>p.y))};svg.setAttribute('viewBox',`${bb.a-1} ${bb.c-1} ${bb.b-bb.a+2} ${bb.d-bb.c+2}`);let out='';const arr=list||C.E;arr.forEach(e=>{const idx=C.E.indexOf(e),hit=`data-index="${idx}" class="cac-hit"`;
 if(e.type==='Pilastri'){const X=e.cx??e.x,Y=e.cy??e.y,w=e.b||.6,h=e.d||.6;out+=`<rect ${hit} x="${X-w/2}" y="${Y-h/2}" width="${w}" height="${h}" rx=".03" fill="#444d58" stroke="#26303b"/><text x="${X}" y="${Y-h/2-.15}" text-anchor="middle" font-size=".25" fill="#155fd1" font-weight="700">${e.id||'—'}</text>`}
 else if(e.type==='Travi'&&e.a){out+=`<line ${hit} x1="${e.a.x}" y1="${e.a.y}" x2="${e.z.x}" y2="${e.z.y}" stroke="#aeb4b8" stroke-width=".22"/><text x="${e.x}" y="${e.y-.15}" text-anchor="middle" font-size=".25" fill="#39804f" font-weight="700">${e.id||'—'}</text>`}
 else if(e.type==='Solai'){const pts=[];e.g?.forEach(g=>g.k==='l'&&pts.push(g.a,g.b));if(pts.length){const x=Math.min(...pts.map(p=>p.x)),X=Math.max(...pts.map(p=>p.x)),y=Math.min(...pts.map(p=>p.y)),Y=Math.max(...pts.map(p=>p.y));out+=`<rect ${hit} x="${x}" y="${y}" width="${X-x}" height="${Y-y}" fill="#d9eef8" opacity=".45" stroke="#63a6c7" stroke-dasharray=".08,.08"/>`}}
 else if(e.type==='Mensole'||e.type==='Mensole solaio'){const g=e.g?.find(y=>y.k==='p');if(g)out+=`<polygon ${hit} points="${g.v.map(z=>z.x+','+z.y).join(' ')}" fill="${e.type==='Mensole'?'#4169d1':'#3098d5'}" opacity=".95"/>`}
 });svg.innerHTML=out;makeSelection()}
window.renderSVG=renderSVG;
function improve3D(){
 if(!C.E.length)return;const b=$('threeBox');if(!b)return;
 if(!C.scene){const s=new THREE.Scene();s.background=new THREE.Color(0xf4f8fc);const c=new THREE.PerspectiveCamera(42,1,.01,10000);const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio));b.innerHTML='';b.appendChild(r.domElement);const o=new THREE.OrbitControls(c,r.domElement);o.enableDamping=true;o.enablePan=true;s.add(new THREE.HemisphereLight(0xffffff,0x7b8796,1.55));const dl=new THREE.DirectionalLight(0xffffff,1.4);dl.position.set(10,15,18);s.add(dl);s.add(new THREE.GridHelper(40,40,0xcbd6e2,0xe3e9ef));const g=new THREE.Group();s.add(g);C.scene={s,c,r,o,g,home(){this.fit(true)},reset(){this.fit(true)},fit(){fitCamera(true)}};(function loop(){requestAnimationFrame(loop);if(C.scene){o.update();r.render(s,c)}})()}
 const {g}=C.scene;while(g.children.length)g.remove(g.children[0]);const s=C.S;const cols=C.E.filter(e=>e.type==='Pilastri');const top=Math.max(3.2,...cols.map(e=>Number(C.H[e.id])||3));
 function label(t,col,scale=1){const cv=document.createElement('canvas');cv.width=360;cv.height=80;const x=cv.getContext('2d');x.font='bold 30px Arial';x.textAlign='center';x.lineWidth=9;x.strokeStyle='#fff';x.strokeText(t,180,51);x.fillStyle=col;x.fillText(t,180,51);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false}));sp.scale.set(3*scale,.67*scale,1);return sp}
 function extrude(poly,depth,mat,ang=0){const z=new THREE.Shape();poly.forEach((p,i)=>i?z.lineTo(p[0],p[1]):z.moveTo(p[0],p[1]));z.closePath();const ge=new THREE.ExtrudeGeometry(z,{depth:depth,bevelEnabled:false});ge.translate(0,0,-depth/2);const m=new THREE.Mesh(ge,mat);const dir=new THREE.Vector3(Math.cos(ang),Math.sin(ang),0),up=new THREE.Vector3(0,0,1),perp=new THREE.Vector3(-Math.sin(ang),Math.cos(ang),0);m.setRotationFromMatrix(new THREE.Matrix4().makeBasis(perp,up,dir));return m}
 cols.forEach(e=>{const h=Number(C.H[e.id])||3,m=new THREE.Mesh(new THREE.BoxGeometry(e.b||.6,e.d||.6,h),new THREE.MeshStandardMaterial({color:0x747c84,roughness:.82}));m.position.set(e.cx??e.x,e.cy??e.y,h/2);m.userData.index=C.E.indexOf(e);g.add(m);const l=label(e.id||'—','#155fd1');l.position.set(e.cx??e.x,e.cy??e.y,h+.2);g.add(l)});
 const beams=C.E.filter(e=>e.type==='Travi'&&e.L);beams.forEach(e=>{const m=extrude(s.TL.poly,e.L,new THREE.MeshStandardMaterial({color:0xb5b8bb,roughness:.72}),e.ang||0);m.position.set(e.x,e.y,top-s.TL.h/2);m.userData.index=C.E.indexOf(e);g.add(m);const l=label(`${e.id||'—'}  ${e.L.toFixed(2)} m`,'#3d8250',.9);l.position.set(e.x,e.y,top+.22);g.add(l)});
 C.E.filter(e=>e.type==='Mensole').forEach(e=>{const m=extrude(s.M.poly,s.M.d,new THREE.MeshStandardMaterial({color:0x4169d1,roughness:.55}),e.ang||0);m.position.set(e.x,e.y,top-s.M.h/2-.01);m.userData.index=C.E.indexOf(e);g.add(m);const l=label(e.id||'M','#6841bd',.7);l.position.set(e.x,e.y,top+.05);g.add(l)});
 C.E.filter(e=>e.type==='Mensole solaio').forEach(e=>{const m=extrude(s.MT.poly,s.MT.d,new THREE.MeshStandardMaterial({color:0x3098d5,roughness:.55}),e.ang||0);m.position.set(e.x,e.y,top-s.MT.h-.12);m.userData.index=C.E.indexOf(e);g.add(m);const l=label(e.id||'MT','#137aa5',.7);l.position.set(e.x,e.y,top-s.MT.h-.02);g.add(l)});
 C.E.filter(e=>e.type==='Solai').forEach(e=>{const w=e.w||1.2,L=e.L||9.96;const m=new THREE.Mesh(new THREE.BoxGeometry(w,L,.30),new THREE.MeshStandardMaterial({color:0x7bbce0,transparent:true,opacity:.28,side:THREE.DoubleSide}));m.position.set(e.cx??e.x,e.cy??e.y,top+.15);m.userData.index=C.E.indexOf(e);g.add(m);});
 // slab is 30 cm high, above the low TL; MT is below slab and M below beams
 fitCamera(false);
 // direct 3D picking
 if(!C.scene.pickBound){C.scene.pickBound=true;C.scene.r.domElement.addEventListener('click',ev=>{const rect=C.scene.r.domElement.getBoundingClientRect(),mouse=new THREE.Vector2((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,C.scene.c);const hits=ray.intersectObjects(C.scene.g.children,true).filter(h=>h.object.userData.index!==undefined);if(hits.length){const e=C.E[hits[0].object.userData.index];window.select?.(e);status(`${e.id||'—'} · ${e.type} selezionato`)}})}
}
function fitCamera(){if(!C.scene||!C.E.length)return;let pts=[];C.E.forEach(e=>{if(e.type==='Pilastri')pts.push({x:e.cx??e.x,y:e.cy??e.y});else if(e.type==='Travi'&&e.a)pts.push(e.a,e.z);else pts.push({x:e.x,y:e.y})});const a=Math.min(...pts.map(p=>p.x)),bb=Math.max(...pts.map(p=>p.x)),c=Math.min(...pts.map(p=>p.y)),d=Math.max(...pts.map(p=>p.y)),cx=(a+bb)/2,cy=(c+d)/2,span=Math.max(bb-a,d-c,4);C.scene.c.position.set(cx+span*1.05,cy-span*1.05,span*.9);C.scene.c.lookAt(cx,cy,1.35);C.scene.o.target.set(cx,cy,1.35);C.scene.o.update();const r=$('threeBox').getBoundingClientRect();C.scene.r.setSize(Math.max(10,r.width),Math.max(10,r.height));C.scene.c.aspect=Math.max(10,r.width)/Math.max(10,r.height);C.scene.c.updateProjectionMatrix()}
window.render3D=improve3D;C.fit=fitCamera;
function sectionsUI(){if(window.renderSections)window.renderSections();const s=C.S;const grid=$('sectionGrid');if(grid){grid.innerHTML=[['TL',s.TL,'Trave'],['M',s.M,'Mensola trave'],['MT',s.MT,'Mensola solaio']].map(x=>`<div class="sc"><b>${x[2]} · ${x[0]}</b><strong>${x[1].b.toFixed(2)} × ${x[1].h.toFixed(2)} m</strong><small>Sezione CAD memorizzata</small></div>`).join('')}}
function paramsUI(){const ids=[...new Set(C.E.filter(e=>e.type==='Pilastri'&&e.id).map(e=>e.id))],p=$('params');if(!p)return;p.innerHTML=`<table class="height-table"><tbody>${ids.map(id=>{const e=C.E.find(x=>x.id===id);return`<tr><td><b>${id}</b><br><span style="color:#71859b">${(e.b||.6).toFixed(2)} × ${(e.d||.6).toFixed(2)} m</span></td><td>H <input class="hi" data-id="${id}" value="${C.H[id]??3}" type="number" min=".1" step=".1"> m</td></tr>`}).join('')}</tbody></table><div class="height-note">L'altezza è l'unico parametro manuale dei pilastri. Le sezioni di travi e mensole provengono dal file SEZIONI.</div>`||'<span class="muted">Nessun pilastro.</span>';p.querySelectorAll('.hi').forEach(i=>i.onchange=()=>{C.H[i.dataset.id]=Number(i.value)||3;localStorage.cacemHeights=JSON.stringify(C.H);render3D()})}
window.renderParams=paramsUI;
function categoryInfo(){let c=document.querySelector('.right');if(!c||q('.cat-panel'))return;const x=document.createElement('div');x.className='cat-panel';x.innerHTML='<h4>Informazioni per categoria</h4>'+['Pilastri','Travi','Mensole','Mensole solaio','Solai','Muri','Fondazioni'].map(t=>`<div class="cat-row"><b>${t}</b><span>${C.E.filter(e=>e.type===t).length}</span></div>`).join('');c.appendChild(x)}
// initialize after all original scripts
makeSidebar();bindFileInputs();setupTools();sectionsUI();paramsUI();categoryInfo();
qa('.cac-extra-side [data-cat]').forEach(()=>{});
$('v2d')?.addEventListener('click',()=>view('2d'));$('v3d')?.addEventListener('click',()=>view('3d'));$('v2d2')?.addEventListener('click',()=>view('2d'));$('v3d2')?.addEventListener('click',()=>view('3d'));
qa('[data-tab]').forEach(b=>b.onclick=()=>{const t=b.dataset.tab;if(t==='three')view('3d');else if(t==='plan'||t==='analysis')view('2d');else if(t==='abaco')$('abacoBody')?.scrollIntoView({behavior:'smooth'});else if(t==='settings')$('params')?.scrollIntoView({behavior:'smooth'})});
qa('.cac-extra-side [data-cat]').forEach(b=>b.onclick=()=>{qa('.cac-extra-side button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterCategory(b.dataset.cat)});
// fix top actions
$('topLoad')?.addEventListener('click',()=>$('fileInput')?.click());$('topCsv')?.addEventListener('click',()=>$('exportBtn')?.click());$('topParams')?.addEventListener('click',()=>$('params')?.scrollIntoView({behavior:'smooth'}));
renderCards?.();renderAbaco?.();renderSVG();sectionsUI();paramsUI();categoryInfo();
})();

/* CACEM_DXF_EVENTS_FIX */
(function(){
  function st(m,b){var x=document.getElementById('status');if(x)x.textContent=m;var d=document.getElementById('statusDot');if(d)d.style.color=b?'#d33':'#19a05d'}
  function inp(){return document.getElementById('fileInput')||document.getElementById('file')}
  function open(){var f=inp();if(f){f.setAttribute('accept','.dxf,.dwg');f.click()}else{st('Controllo caricamento DXF non disponibile: input file mancante.',true)}}
  function wire(){
    var f=inp(); if(!f)return;
    ['chooseBtn','loadBtn','topLoad','cacLoad'].forEach(function(id){var b=document.getElementById(id);if(b){b.onclick=function(e){e.preventDefault();open()}}});
    if(!f.dataset.cacemDxfFix){
      f.dataset.cacemDxfFix='1';
      f.onchange=function(e){
        var file=e.target.files&&e.target.files[0];if(!file)return;
        if(!/\\.dxf$/i.test(file.name)){st('Seleziona un file DXF. Il DWG richiede un motore DWG dedicato.',true);return}
        st('Lettura DXF in corso: '+file.name+' …');
        var r=new FileReader();
        r.onerror=function(){st('Errore nella lettura del file DXF.',true)};
        r.onload=function(){try{
          if(typeof window.DxfParser!=='function')throw new Error('Libreria DXF non disponibile');
          var text=String(r.result||'');if(!text.trim())throw new Error('Il file DXF è vuoto');
          if(window.CACEM&&typeof window.CACEM.parse==='function'){
            window.CACEM.E=window.CACEM.parse(text);window.CACEM.file=file.name;
            if(typeof window.renderCards==='function')window.renderCards();if(typeof window.renderAbaco==='function')window.renderAbaco();if(typeof window.renderParams==='function')window.renderParams();if(typeof window.renderSVG==='function')window.renderSVG();if(typeof window.render3D==='function')window.render3D();
            var mn=document.getElementById('modelName');if(mn)mn.textContent=file.name;
            st('DXF caricato: '+file.name+' · '+window.CACEM.E.length+' elementi riconosciuti');
          }else throw new Error('Motore CACEM non disponibile');
        }catch(err){console.error(err);st('Errore DXF: '+(err.message||err),true)}finally{e.target.value=''}};
        r.readAsText(file,'UTF-8');
      };
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  window.addEventListener('load',function(){wire();setTimeout(wire,300)});
})();

