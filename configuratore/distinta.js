export function buildBOM(model){
 const d=model.dimensioni,e=model.elementi,r=[];
 const nP=2*(d.numeroCampate+1), h=d.altezzaPilastro, s=e.pilastri.sezione.split("x").map(Number);
 const volP=nP*(s[0]/100)*(s[1]/100)*h;
 r.push({elemento:"Pilastri",quantita:nP,dimensioni:e.pilastri.sezione+" × "+h+" m",volume:volP,peso:volP*2.5});
 const nT=2*d.numeroCampate, volT=nT*(d.interasseCampate)*(e.travi.base/10000)*(e.travi.altezza/100)/100; r.push({elemento:"Travi",quantita:nT,dimensioni:d.interasseCampate+" × "+e.travi.base+" × "+e.travi.altezza+" cm",volume:volT,peso:volT*2.5});
 const nPan=2*d.numeroCampate,volPan=nPan*d.interasseCampate*d.altezzaPilastro*(e.pannelliTamponamento.spessore/10000);r.push({elemento:"Pannelli",quantita:nPan,dimensioni:e.pannelliTamponamento.spessore+" cm",volume:volPan,peso:volPan*2.5});
 const nCop=d.numeroCampate*Math.ceil(d.larghezza/(e.lastreCopertura.larghezza/100));const volCop=nCop*(e.lastreCopertura.larghezza/100)*(d.interasseCampate)*(e.lastreCopertura.spessore/100)/100; r.push({elemento:"Lastre copertura",quantita:nCop,dimensioni:e.lastreCopertura.larghezza+" × "+e.lastreCopertura.spessore+" cm",volume:volCop,peso:volCop*2.5});
 return r;
}