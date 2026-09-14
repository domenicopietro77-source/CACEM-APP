/* CACEM DXF LOADER FIX v1 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const setStatus=(msg,bad=false)=>{const s=$('status');if(s)s.textContent=msg;const d=$('statusDot');if(d)d.style.color=bad?'#d33':'#19a05d'};
  const getParser=()=>window.DxfParser||window.dxfParser?.DxfParser||window.dxfParser;
  function loadParser(){
    if(getParser()) return Promise.resolve(getParser());
    return new Promise((resolve,reject)=>{
      const urls=[
        'https://cdn.jsdelivr.net/npm/dxf-parser@1.1.2/dist/dxf-parser.js',
        'https://unpkg.com/dxf-parser@1.1.2/dist/dxf-parser.js'
      ];
      let i=0;
      const next=()=>{
        if(getParser())return resolve(getParser());
        if(i>=urls.length)return reject(new Error('Libreria DXF non disponibile nel browser'));
        const s=document.createElement('script');s.src=urls[i++];s.onload=()=>getParser()?resolve(getParser()):next();s.onerror=next;document.head.appendChild(s);
      };next();
    });
  }
  function analyseFile(file){
    if(!file)return;
    if(!/\.dxf$/i.test(file.name)){setStatus('Seleziona un file DXF. Il DWG richiede il motore DWG dedicato.',true);return;}
    setStatus('Lettura DXF in corso…');
    const reader=new FileReader();
    reader.onerror=()=>setStatus('Errore nella lettura del file DXF.',true);
    reader.onload=async()=>{
      try{
        const Parser=await loadParser();
        if(typeof Parser!=='function')throw new Error('Parser DXF non inizializzato');
        const text=String(reader.result||'');
        if(!text.trim())throw new Error('Il file DXF è vuoto');
        let entities;
        if(window.CACEM?.parse){
          entities=window.CACEM.parse(text);
        }else{
          const d=new Parser().parseSync(text);
          entities=(d.entities||[]).filter(e=>String(e.type).toUpperCase()==='INSERT');
        }
        window.CACEM.E=Array.isArray(entities)?entities:[];
        window.CACEM.file=file.name;
        if(typeof window.renderCards==='function')window.renderCards();
        if(typeof window.renderAbaco==='function')window.renderAbaco();
        if(typeof window.renderParams==='function')window.renderParams();
        if(typeof window.renderSVG==='function')window.renderSVG();
        if(typeof window.render3D==='function')window.render3D();
        const mn=$('modelName');if(mn)mn.textContent=file.name;
        setStatus(`DXF caricato: ${file.name} · ${window.CACEM.E.length} elementi riconosciuti`);
      }catch(err){
        console.error('CACEM DXF:',err);
        setStatus('Errore DXF: '+(err?.message||err),true);
      }
    };
    reader.readAsText(file,'UTF-8');
  }
  function bind(){
    const fi=$('fileInput');
    if(!fi)return;
    fi.setAttribute('accept','.dxf');
    fi.onchange=ev=>{const f=ev.target.files?.[0];if(f)analyseFile(f);ev.target.value='';};
    const open=()=>fi.click();
    ['chooseBtn','loadBtn','topLoad'].forEach(id=>{const el=$(id);if(el)el.onclick=open;});
    document.querySelectorAll('[data-dxf-upload]').forEach(el=>el.onclick=open);
    const old=$('chooseBtn');if(old)old.title='Carica un file DXF';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.CACEM_LOAD_DXF=analyseFile;
})();
