(function(){
  'use strict';
  function setStatus(msg,bad){
    var s=document.getElementById('status'); if(s) s.textContent=msg;
    var d=document.getElementById('statusDot'); if(d) d.style.color=bad?'#d33':'#19a05d';
  }
  function ensureParser(done){
    if(typeof window.DxfParser==='function'){done();return;}
    var urls=['https://cdn.jsdelivr.net/npm/dxf-parser@1.1.2/dist/dxf-parser.js','https://unpkg.com/dxf-parser@1.1.2/dist/dxf-parser.js'];
    var i=0;
    function next(){
      if(typeof window.DxfParser==='function'){done();return;}
      if(i>=urls.length){setStatus('Impossibile caricare la libreria DXF. Controlla la connessione e ricarica la pagina.',true);return;}
      var sc=document.createElement('script'); sc.src=urls[i++]; sc.onload=function(){if(typeof window.DxfParser==='function')done();else next()}; sc.onerror=next; document.head.appendChild(sc);
    }
    next();
  }
  function input(){
    var el=document.getElementById('fileInput')||document.getElementById('file');
    if(el)return el;
    el=document.createElement('input'); el.type='file'; el.id='fileInput'; el.accept='.dxf,.dwg'; el.style.display='none'; document.body.appendChild(el);
    return el;
  }
  function open(){ input().click(); }
  function wire(){
    var fi=input();
    fi.setAttribute('accept','.dxf,.dwg');
    if(!fi.dataset.cacemFix){
      fi.dataset.cacemFix='1';
      fi.addEventListener('change',function(ev){
        var f=ev.target.files&&ev.target.files[0]; if(!f)return;
        if(!/\.dxf$/i.test(f.name)){
          setStatus('Per ora il caricamento geometrico automatico è disponibile per DXF. Il DWG richiede il motore DWG dedicato.',true);
          return;
        }
        setStatus('Lettura DXF in corso: '+f.name+' …');
        var r=new FileReader();
        r.onerror=function(){setStatus('Errore nella lettura del file DXF.',true)};
        r.onload=function(){
          try{
            if(typeof window.DxfParser!=='function')throw new Error('Parser DXF non disponibile');
            var text=String(r.result||''); if(!text.trim())throw new Error('Il file DXF è vuoto');
            var parsed=new window.DxfParser().parseSync(text);
            if(!parsed||!parsed.entities)throw new Error('DXF non interpretabile');
            window.CACEM_LAST_DXF={name:f.name,text:text,parsed:parsed};
            if(window.CACEM&&typeof window.CACEM.parse==='function'){
              window.CACEM.E=window.CACEM.parse(text);
              window.CACEM.file=f.name;
              if(typeof window.renderCards==='function')window.renderCards();
              if(typeof window.renderAbaco==='function')window.renderAbaco();
              if(typeof window.renderParams==='function')window.renderParams();
              if(typeof window.renderSections==='function')window.renderSections();
              if(typeof window.renderSVG==='function')window.renderSVG();
              if(typeof window.render3D==='function')window.render3D();
              var mn=document.getElementById('modelName');if(mn)mn.textContent=f.name;
              setStatus('DXF caricato correttamente: '+f.name+' · '+window.CACEM.E.length+' elementi strutturali riconosciuti');
            }else{
              setStatus('DXF letto correttamente, ma il motore CACEM non è disponibile.',true);
            }
          }catch(e){console.error(e);setStatus('Errore DXF: '+(e&&e.message?e.message:e),true)}
          fi.value='';
        };
        r.readAsText(f,'UTF-8');
      });
    }
    ['chooseBtn','loadBtn','topLoad','cacLoad'].forEach(function(id){
      var b=document.getElementById(id); if(b&&!b.dataset.cacemUploadFix){b.dataset.cacemUploadFix='1';b.onclick=function(ev){ev.preventDefault();open()};}
    });
    document.querySelectorAll('[data-cac-upload]').forEach(function(b){if(!b.dataset.cacemUploadFix){b.dataset.cacemUploadFix='1';b.onclick=function(ev){ev.preventDefault();open()}}});
  }
  function start(){ensureParser(function(){wire();setTimeout(wire,100);setTimeout(wire,500);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('load',function(){setTimeout(start,50)});
})();
