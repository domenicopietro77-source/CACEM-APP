// Modello dati centrale CACEM. Tutte le viste derivano da questo stato.
export const DEFAULT_MODEL={
 dimensioni:{lunghezza:60,larghezza:30,altezzaPilastro:6,altezzaTotale:8,pendenzaCopertura:5,numeroCampate:4,interasseCampate:15,numeroPilastriPerFila:5},
 elementi:{
  pilastri:{sezione:"40x40",materiale:"C45/55",tipo:"precompresso",pesoLineare:0.4},
  travi:{tipo:"aT",altezza:80,base:50,materiale:"C45/55"},
  pannelliTamponamento:{spessore:20,altezza:6,isolamento:true,tipo:"sandwich"},
  lastreCopertura:{tipo:"tegolo",larghezza:120,spessore:25}
 },
 vincoli:{luceMaxCampata:30,altezzaMinPilastro:4,altezzaMaxPilastro:12,numeroMinCampate:1,numeroMaxCampate:10}
};
export function cloneModel(m=DEFAULT_MODEL){return JSON.parse(JSON.stringify(m));}
export function normalizeModel(m){
 const x=cloneModel(m); Object.assign(x.dimensioni,m?.dimensioni||{});
 x.elementi={...x.elementi,...(m?.elementi||{})}; x.vincoli={...x.vincoli,...(m?.vincoli||{})}; return x;
}