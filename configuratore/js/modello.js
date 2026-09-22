// modello.js — Stato strutturale CACEM e calcoli derivati
import { trovaPilastro, trovaTrave, trovaTegolo, trovaSolaio } from './catalogo.js';

export const DEFAULT_STATO = {
  generale:{luce:30,altezzaPilastro:6,pendenzaCopertura:5,interpiano:false,altezzaInterpiano:3.5,carroponte:false,portataCarroponte:0},
  campate:[{id:1,interasse:15},{id:2,interasse:15},{id:3,interasse:15},{id:4,interasse:15}],
  pilastri:{tipoId:'P40x40',pluviale:true,fondazione:'bicchiere'},
  travi:{tipoId:'TL'},
  copertura:{tegoloId:'AL'},
  pannelli:{tipo:'V',spessore:20,finitura:'FV',coloriGraniglia:['#d9d2c5','#b8b0a0'],percentualiGraniglia:[70,30],lati:{nord:true,sud:true,est:true,ovest:true}},
  mensole:{attive:[]},
  meta:{versione:'0.3',timestamp:null}
};
export function statoDefault(){return JSON.parse(JSON.stringify(DEFAULT_STATO));}
export function clonaStato(s){return JSON.parse(JSON.stringify(s));}
export function lunghezzaTotale(stato){return stato.campate.reduce((a,c)=>a+(Number(c.interasse)||0),0);}

export function calcolaDerivati(stato){
  const g=stato.generale,L=lunghezzaTotale(stato),W=Number(g.luce)||0,H=Number(g.altezzaPilastro)||0;
  const salita=(W/2)*(Number(g.pendenzaCopertura)||0)/100,Hcolmo=H+salita;
  const pil=trovaPilastro(stato.pilastri.tipoId),tra=trovaTrave(stato.travi.tipoId),teg=trovaTegolo(stato.copertura.tegoloId);
  const numPerFila=stato.campate.length+1,numPilastri=numPerFila*2;
  const sl=pil.sezione.l/100,sh=pil.sezione.h/100,volPil=sl*sh*H*numPilastri;
  const altTr=tra.altezza/100,baseTr=tra.base/100;
  const volTrBanch=L*baseTr*altTr*2;
  const numTrFalda=stato.campate.length+1,luceFalda=W/2;
  const volTrFalda=numTrFalda*2*luceFalda*baseTr*altTr;
  const lungFalda=Math.sqrt(luceFalda**2+salita**2);
  const numTegoli=Math.max(2,Math.ceil(L/(teg.larghezza/100))*2);
  const volTegoloSingolo=(teg.larghezza/100)*(teg.altezza/100)*lungFalda;
  const volCop=numTegoli*volTegoloSingolo;
  const sp=Number(stato.pannelli.spessore)/100,perimetro=2*(L+W),volPannelli=perimetro*H*sp;
  const volInterpiano=g.interpiano?L*W*0.25:0;
  const volTot=volPil+volTrBanch+volTrFalda+volPannelli+volCop+volInterpiano;
  const densita=2.5;
  const distinta=[
    {elemento:`Pilastri ${pil.nome}`,quantita:numPilastri,dimensioni:`${pil.sezione.l}×${pil.sezione.h} cm × h ${H} m`,volume:volPil,peso:volPil*densita},
    {elemento:`Travi banchina ${tra.nome}`,quantita:2,dimensioni:`${tra.base}×${tra.altezza} cm × ${L.toFixed(2)} m`,volume:volTrBanch,peso:volTrBanch*densita},
    {elemento:`Travi trasversali ${tra.nome}`,quantita:numTrFalda*2,dimensioni:`${tra.base}×${tra.altezza} cm × ${lungFalda.toFixed(2)} m`,volume:volTrFalda,peso:volTrFalda*densita},
    {elemento:`Tegoli ${teg.nome}`,quantita:numTegoli,dimensioni:`${teg.larghezza}×${teg.altezza} cm × ${lungFalda.toFixed(2)} m`,volume:volCop,peso:volCop*densita},
    {elemento:'Pannelli tamponamento',quantita:1,dimensioni:`sp. ${stato.pannelli.spessore} cm · h ${H} m · ${perimetro.toFixed(1)} m lineari`,volume:volPannelli,peso:volPannelli*densita}
  ];
  if(g.interpiano){
    const solaio=trovaSolaio('TT');
    distinta.push({elemento:`Solaio ${solaio.nome}`,quantita:1,dimensioni:`${L.toFixed(1)}×${W.toFixed(1)} m · sp. ${solaio.altezza} cm`,volume:volInterpiano,peso:volInterpiano*densita});
  }
  return {L,W,H,Hcolmo,salita,numPilastri,numPerFila,superficieCoperta:L*W,volumeTotale:volTot,pesoStimato:volTot*densita,distinta};
}

const CHIAVE='cacem-stato-v3';
export function salvaStato(stato){const c=clonaStato(stato);c.meta.timestamp=new Date().toISOString();localStorage.setItem(CHIAVE,JSON.stringify(c));return c;}
export function caricaStato(){const raw=localStorage.getItem(CHIAVE);if(!raw)return null;try{const p=JSON.parse(raw);if(!p.generale||!p.campate)return null;return p;}catch{return null;}}
export function cancellaStato(){localStorage.removeItem(CHIAVE);}
export function esportaJSON(stato,nomeFile='cacem-progetto.json'){const blob=new Blob([JSON.stringify(stato,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=nomeFile;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
export function importaJSON(){return new Promise((resolve,reject)=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=e=>{const f=e.target.files[0];if(!f)return reject(new Error('Nessun file selezionato'));const r=new FileReader();r.onload=x=>{try{const p=JSON.parse(x.target.result);if(!p.generale||!p.campate)return reject(new Error('Formato non valido'));resolve(p);}catch(err){reject(err);}};r.readAsText(f);};input.click();});}
