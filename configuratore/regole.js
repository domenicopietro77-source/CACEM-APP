// Motore di validazione: regole geometriche e avvisi, non calcolo strutturale.
export class RegoleValidator{
 validate(model){
  const d=model.dimensioni,v=model.vincoli; const errors=[],warnings=[],suggestions=[];
  const campata=d.interasseCampate;
  if(d.numeroCampate<v.numeroMinCampate||d.numeroCampate>v.numeroMaxCampate)errors.push("Numero campate fuori dai limiti definiti.");
  if(d.altezzaPilastro<v.altezzaMinPilastro||d.altezzaPilastro>v.altezzaMaxPilastro)errors.push("Altezza pilastro fuori dai limiti definiti.");
  if(Math.abs(d.numeroCampate*d.interasseCampate-d.lunghezza)>0.001)errors.push("Numero campate × interasse non corrisponde alla lunghezza totale.");
  if(campata>25){suggestions.push("Luce campata > 25 m: aumentare automaticamente la sezione della trave."); model.elementi.travi.altezza=Math.max(model.elementi.travi.altezza,100); model.elementi.travi.base=Math.max(model.elementi.travi.base,60);}
  if(d.altezzaPilastro>9)warnings.push("Altezza pilastro > 9 m: valutare sezione maggiorata o controventi.");
  if(d.pendenzaCopertura<3)warnings.push("Pendenza copertura < 3%: verificare il rischio di ristagno dell'acqua.");
  return {valid:errors.length===0,errors,warnings,suggestions,model};
 }
}