import {calcularNutrientes} from './motor_avanzi.mjs';

const tiempo=r=>r.tiempoTotalMinutos??r.tiempoMinutos??null;
// Solo huevos y lácteos identificados por ID se aceptan como ingredientes
// animales en una sugerencia vegetariana. Los derivados ambiguos se excluyen.
const HUEVOS_LACTEOS=new Set(['huevo','huevo-yema','huevo-clara','manteca','leche','crema-leche','crema-acida','yogur','suero-leche','yogur-griego','leche-evaporada','fideos-huevo']);
export function compatibleAlimentacion(receta,ingredientes,tipo) {
  if(!tipo||tipo==='omnivora')return true;
  const catalogo=new Map(ingredientes.map(i=>[i.id,i]));
  return receta.ingredientes.every(linea=>{
    const id=linea.ingredienteId||linea.id,i=catalogo.get(id);
    if(!i||typeof i.esDeOrigenAnimal!=='boolean')return false;
    if(tipo==='vegana')return i.esDeOrigenAnimal===false;
    return tipo==='vegetariana'&&i.grupo!=='carnes'&&(!i.esDeOrigenAnimal||HUEVOS_LACTEOS.has(id));
  });
}
const distancia=(v,min,max)=>v<min?min-v:v>max?v-max:0;
const balance=n=>{
  const e=n.kcal;
  return distancia(4*n.carbohidratosG/e,.45,.65)+distancia(9*n.grasasG/e,.20,.35);
};
const ordenarGeneral=(a,b)=>a.faltantes-b.faltantes||(a.tiempo??Infinity)-(b.tiempo??Infinity)||a.receta.nombre.localeCompare(b.receta.nombre,'es');
function ordenarObjetivo(objetivo,a,b) {
  if(a.faltantes!==b.faltantes)return a.faltantes-b.faltantes;
  const x=a.nutricion.porPorcion,y=b.nutricion.porPorcion;
  if(objetivo==='ganar'){
    if(x.proteinasG!==y.proteinasG)return y.proteinasG-x.proteinasG;
    if(x.carbohidratosG!==y.carbohidratosG)return y.carbohidratosG-x.carbohidratosG;
  }else if(objetivo==='perder'){
    const px=4*x.proteinasG/x.kcal,py=4*y.proteinasG/y.kcal;
    if(px!==py)return py-px;
    if(x.grasasG!==y.grasasG)return x.grasasG-y.grasasG;
    if(x.kcal!==y.kcal)return x.kcal-y.kcal;
  }else {
    const bx=balance(x),by=balance(y);
    if(bx!==by)return bx-by;
  }
  return (a.tiempo??Infinity)-(b.tiempo??Infinity)||a.receta.nombre.localeCompare(b.receta.nombre,'es');
}
function razones(item,objetivo) {
  if(objetivo&&item.nutricion.completo){
    const n=item.nutricion.porPorcion;
    return [`Aporta aprox. ${n.proteinasG} g de proteínas por porción`];
  }
  if(item.faltantes===0)return ['Podés prepararla con tus ingredientes'];
  if(item.faltantes===1)return ['Solo te falta un ingrediente'];
  return ['Entre las opciones con menos ingredientes faltantes'];
}
/** Orden editorial orientativo: nunca altera recetas, compras ni disponibilidad. */
export function recomendarRecetas(recetas,ingredientes,perfil,disponibilidad,limite=6) {
  const items=recetas.filter(receta=>compatibleAlimentacion(receta,ingredientes,perfil?.alimentacion)).map(receta=>{
    const faltantes=new Set(disponibilidad(receta).faltantes.map(i=>i.ingredienteId)).size;
    return {receta,nutricion:calcularNutrientes(receta,ingredientes),faltantes,tiempo:tiempo(receta)};
  });
  const energias=items.filter(i=>i.nutricion.completo&&i.nutricion.porPorcion.kcal>0)
    .map(i=>i.nutricion.porPorcion.kcal).sort((a,b)=>a-b);
  const medianaEnergia=energias.length?energias[Math.floor((energias.length-1)/2)]:null;
  const objetivo=perfil?.edad!=null&&perfil.edad<19?null:perfil?.objetivo??null;
  let candidatos=[];
  if(objetivo){
    candidatos=items.filter(item=>{
      if(!item.nutricion.completo||item.nutricion.porPorcion.kcal<=0)return false;
      if(objetivo==='mantener')return true;
      const n=item.nutricion.porPorcion,fraccion=4*n.proteinasG/n.kcal;
      return objetivo==='ganar'
        ?fraccion>=.20&&n.proteinasG>=20
        :fraccion>=.12&&n.kcal<=medianaEnergia;
    }).sort((a,b)=>ordenarObjetivo(objetivo,a,b));
  }
  const personalizado=objetivo&&candidatos.length>0;
  const elegidos=(personalizado?candidatos:items.sort(ordenarGeneral)).slice(0,limite);
  return {tipo:personalizado?'objetivo':'general',items:elegidos.map(item=>({...item,razones:razones(item,personalizado?objetivo:null)}))};
}
