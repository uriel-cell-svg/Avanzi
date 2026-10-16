import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CLAVE_PERFIL,recuperarPerfil,guardarPerfil,eliminarPerfil} from '../perfil_usuario.mjs';
import {estimarPerfil} from '../estimaciones_perfil.mjs';
import {recomendarRecetas} from '../recomendaciones.mjs';
import {compatibleAlimentacion} from '../recomendaciones.mjs';
import {calcularNutrientes} from '../motor_avanzi.mjs';
import {crearMotorCantidades,estadoVacio} from '../planificacion.mjs';

const leer=nombre=>JSON.parse(fs.readFileSync(new URL(`../datos/${nombre}`,import.meta.url)));
const recetas=leer('recetas.json').recetas,ingredientes=leer('ingredientes.json').ingredientes,eq=leer('equivalencias_g.json');
const motor=crearMotorCantidades(recetas,ingredientes,eq);
const memoria=()=>{const datos=new Map();return {datos,getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)};};
const base={version:1,nombre:'Martín',edad:null,pesoKg:null,alturaCm:null,actividad:null,objetivo:'ganar',coeficiente:null,usarEstimacion:false,entrenaFuerza:false};

test('perfil progresivo se guarda, edita y elimina sin tocar las otras claves',()=>{
  const storage=memoria();storage.setItem('que-cocino.despensa.v1','inventario');storage.setItem('avanzi.recetas.usuario.v1','recetas');
  assert.equal(recuperarPerfil(storage).perfil,null);
  assert.equal(guardarPerfil(storage,base).ok,true);
  assert.deepEqual(recuperarPerfil(storage).perfil,{...base,alimentacion:null});
  const editado={...base,nombre:'Mar',objetivo:'mantener',edad:30};
  assert.equal(guardarPerfil(storage,editado).ok,true);
  assert.deepEqual(recuperarPerfil(storage).perfil,{...editado,alimentacion:null});
  assert.equal(eliminarPerfil(storage).ok,true);
  assert.equal(recuperarPerfil(storage).perfil,null);
  assert.equal(storage.getItem('que-cocino.despensa.v1'),'inventario');
  assert.equal(storage.getItem('avanzi.recetas.usuario.v1'),'recetas');
});
test('perfiles anteriores conservan sus datos sin inferir alimentación ni sexo',()=>{
  const storage=memoria();storage.setItem(CLAVE_PERFIL,JSON.stringify(base));
  const anterior=recuperarPerfil(storage);
  assert.equal(anterior.bloqueado,false);
  assert.equal(anterior.perfil.alimentacion,null);
  assert.equal(anterior.perfil.coeficiente,null);
  assert.equal(guardarPerfil(storage,{...anterior.perfil,alimentacion:'vegana'}).ok,true);
  assert.equal(recuperarPerfil(storage).perfil.alimentacion,'vegana');
});
test('vegetariana y vegana comprueban ingredientes por ID también en recetas propias',()=>{
  const por=id=>({id:`propia-${id}`,ingredientes:[{ingredienteId:id,cantidad:1,unidad:'g'}]});
  const efectivos=ingredientes.map(i=>i.id==='dashi'?{...i,esDeOrigenAnimal:null}:i);
  for(const id of ['pollo','pescado','camarones','caldo-pollo','salsa-inglesa','parmesano']){
    assert.equal(compatibleAlimentacion(por(id),efectivos,'vegetariana'),false,id);
    assert.equal(compatibleAlimentacion(por(id),efectivos,'vegana'),false,id);
  }
  for(const id of ['huevo','leche']){
    assert.equal(compatibleAlimentacion(por(id),efectivos,'vegetariana'),true,id);
    assert.equal(compatibleAlimentacion(por(id),efectivos,'vegana'),false,id);
  }
  assert.equal(compatibleAlimentacion(por('zanahoria'),efectivos,'vegana'),true);
  assert.equal(compatibleAlimentacion(por('dashi'),efectivos,'vegetariana'),false);
  assert.equal(compatibleAlimentacion(por('dashi'),efectivos,'vegana'),false);
  assert.equal(compatibleAlimentacion(por('sin-catalogo'),efectivos,'vegana'),false);
  assert.equal(compatibleAlimentacion(por('pollo'),efectivos,'omnivora'),true);
  const candidata=recetas.find(r=>r.ingredientes.some(i=>efectivos.find(meta=>meta.id===(i.ingredienteId||i.id))?.esDeOrigenAnimal===true));
  const vegetal=recetas.find(r=>compatibleAlimentacion(r,efectivos,'vegana'));
  const resultado=recomendarRecetas([candidata,vegetal],efectivos,{...base,alimentacion:'vegana'},()=>({faltantes:[]}));
  assert.ok(resultado.items.every(i=>i.receta.id!==candidata.id));
});
test('perfil dañado bloquea su sobrescritura y borrado',()=>{
  const storage=memoria();storage.setItem(CLAVE_PERFIL,'{dañado');
  const recuperado=recuperarPerfil(storage);
  assert.equal(recuperado.bloqueado,true);
  assert.equal(guardarPerfil(storage,base,recuperado.bloqueado).ok,false);
  assert.equal(eliminarPerfil(storage,recuperado.bloqueado).ok,false);
  assert.equal(storage.getItem(CLAVE_PERFIL),'{dañado');
});
test('datos inválidos no sustituyen un perfil válido',()=>{
  const storage=memoria();assert.equal(guardarPerfil(storage,base).ok,true);
  const previo=storage.getItem(CLAVE_PERFIL);
  for(const cambio of [{edad:18.5},{pesoKg:-1},{actividad:'intensa'},{alimentacion:'pescetariana'},{nombre:'x'.repeat(61)},{usarEstimacion:'sí'}])
    assert.equal(guardarPerfil(storage,{...base,...cambio}).ok,false);
  assert.equal(storage.getItem(CLAVE_PERFIL),previo);
});
test('Mifflin–St Jeor requiere edad adulta, datos, coeficiente y aceptación',()=>{
  const completo={...base,edad:30,pesoKg:70,alturaCm:175,actividad:'ligero',coeficiente:'mas-5',usarEstimacion:true};
  const estimado=estimarPerfil(completo);
  assert.equal(estimado.energia.reposo,1649);
  assert.equal(estimado.energia.diario,2523);
  assert.ok(estimado.carbohidratos.min<estimado.carbohidratos.max);
  assert.ok(estimado.grasas.min<estimado.grasas.max);
  for(const parcial of [{...completo,edad:18},{...completo,edad:79},{...completo,coeficiente:null},{...completo,usarEstimacion:false},{...completo,alturaCm:null}])
    assert.equal(estimarPerfil(parcial).energia,null);
  assert.equal(estimarPerfil({...completo,edad:18}).proteinas,null);
  assert.equal(estimarPerfil({...completo,coeficiente:'menos-161'}).energia.reposo,1483);
});
test('proteína para entrenamiento requiere datos y actividad compatibles',()=>{
  const entrenar=estimarPerfil({...base,edad:25,pesoKg:70,actividad:'moderado',entrenaFuerza:true});
  assert.deepEqual(entrenar.proteinas,{min:98,max:140,tipo:'ejercicio'});
  assert.equal(entrenar.energia,null);
  assert.deepEqual(estimarPerfil({...base,edad:25,pesoKg:70,actividad:'sedentario'}).proteinas,{min:56,max:56,tipo:'general'});
});
test('recomendaciones usan disponibilidad y nutrientes sin alterar datos',()=>{
  const estado=estadoVacio(),subset=recetas.slice(0,12);
  const antes=structuredClone(estado),recetasAntes=structuredClone(subset);
  const general=recomendarRecetas(subset,ingredientes,null,r=>motor.disponibilidad(r,estado));
  assert.equal(general.tipo,'general');
  assert.ok(general.items.length>0);
  assert.ok(general.items.every(i=>i.razones.some(r=>r.includes('ingrediente'))));
  const ganar=recomendarRecetas(recetas,ingredientes,base,r=>motor.disponibilidad(r,estado));
  assert.equal(ganar.tipo,'objetivo');
  assert.ok(ganar.items.every(i=>i.nutricion.completo&&4*i.nutricion.porPorcion.proteinasG/i.nutricion.porPorcion.kcal>=.20&&i.nutricion.porPorcion.proteinasG>=20));
  assert.ok(ganar.items.every(i=>i.razones.some(r=>r.includes('proteínas'))));
  assert.deepEqual(estado,antes);assert.deepEqual(subset,recetasAntes);
});
test('objetivo de perder peso combina energía relativa y proporción proteica',()=>{
  const estado=estadoVacio();
  const resultado=recomendarRecetas(recetas,ingredientes,{...base,objetivo:'perder'},r=>motor.disponibilidad(r,estado));
  const energias=recetas.map(r=>calcularNutrientes(r,ingredientes).porPorcion.kcal).sort((a,b)=>a-b);
  const mediana=energias[Math.floor((energias.length-1)/2)];
  assert.equal(resultado.tipo,'objetivo');
  assert.ok(resultado.items.every(i=>i.nutricion.porPorcion.kcal<=mediana&&
    4*i.nutricion.porPorcion.proteinasG/i.nutricion.porPorcion.kcal>=.12));
});
test('un perfil menor de edad recibe solo opciones generales',()=>{
  const resultado=recomendarRecetas(recetas,ingredientes,{...base,edad:17,objetivo:'perder'},r=>motor.disponibilidad(r,estadoVacio()));
  assert.equal(resultado.tipo,'general');
  assert.ok(resultado.items.every(i=>!i.razones.some(r=>r.includes('proteínas'))));
});
test('sin coincidencia nutricional o con nutrición incompleta ofrece opciones generales',()=>{
  const noAjustadas=recetas.filter(r=>{
    const n=calcularNutrientes(r,ingredientes).porPorcion;
    return 4*n.proteinasG/n.kcal<.20;
  }).slice(0,2);
  const incompleta={...recetas[0],id:'sin-peso',ingredientes:recetas[0].ingredientes.map(l=>({...l,gramosComestibles:undefined,cantidad:1,unidad:'unidad'}))};
  const disponibilidad=()=>({faltantes:[]});
  const resultado=recomendarRecetas([...noAjustadas,incompleta],ingredientes,base,disponibilidad);
  assert.equal(resultado.tipo,'general');
  assert.ok(resultado.items.every(i=>!i.razones.some(r=>r.includes('proteínas'))));
});
