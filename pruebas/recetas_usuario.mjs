import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {crearMotorCantidades,estadoVacio,separarNecesidadesReceta} from '../planificacion.mjs';
import {calcularNutrientes} from '../motor_avanzi.mjs';
import {nuevoIdReceta,prepararRecetaUsuario,recuperarRecetasUsuario,guardarRecetasUsuario,CLAVE_RECETAS_USUARIO} from '../recetas_usuario.mjs';
import {validarArchivoFoto,fotosSinReferencias} from '../fotos_usuario.mjs';
const json=n=>JSON.parse(readFileSync(new URL(`../datos/${n}.json`,import.meta.url)));
const base=json('recetas').recetas,catalogo=json('ingredientes').ingredientes,eq=json('equivalencias_g');
const motor=crearMotorCantidades(base,catalogo,eq);
const entrada=(sobres={})=>({id:nuevoIdReceta(),nombre:'Huevos con leche',porciones:2,tiempoPreparacionMinutos:5,tiempoCoccionMinutos:7,
  esDesayuno:true,ingredientes:[{ingredienteId:'huevo',cantidad:3,unidad:'unidad',estadoAlimento:'base'},
    {ingredienteId:'leche',cantidad:100,unidad:'ml',estadoAlimento:'base'}],pasos:['Batir.','Cocinar.'],imagenId:null,...sobres});
const storage=()=>{const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};

test('IDs propios estables, formato y tiempos: 19 es rápida, 20 no',()=>{
  const r=prepararRecetaUsuario(entrada({tiempoCoccionMinutos:14}),motor,catalogo,base);
  assert.match(r.id,/^usr-/);assert.equal(r.tiempoTotalMinutos,19);assert.ok(r.categoriasAutomaticas.includes('rapidas'));
  const b=prepararRecetaUsuario(entrada({tiempoCoccionMinutos:15}),motor,catalogo,base);
  assert.equal(b.tiempoTotalMinutos,20);assert.ok(!b.categoriasAutomaticas.includes('rapidas'));
});
test('alias y tildes se conservan en catálogo; desayuno es elección, veggie exige datos',()=>{
  const r=prepararRecetaUsuario(entrada(),motor,catalogo,base);
  assert.ok(r.categoriasAutomaticas.includes('desayunos'));
  assert.ok(!r.categoriasAutomaticas.includes('veggie'));
  const v=prepararRecetaUsuario(entrada({esDesayuno:false,ingredientes:[{ingredienteId:'tomate',cantidad:100,unidad:'g',estadoAlimento:'base'}]}),motor,catalogo,base);
  assert.ok(v.categoriasAutomaticas.includes('veggie'));
});
test('nutrición del huevo usa equivalencia aportada y total/porción del mismo motor',()=>{
  const r=prepararRecetaUsuario(entrada({ingredientes:[{ingredienteId:'huevo',cantidad:3,unidad:'unidad',estadoAlimento:'base'}]}),motor,catalogo,base);
  const n=calcularNutrientes(r,catalogo);assert.equal(n.completo,true);assert.equal(r.ingredientes[0].gramosComestibles,150);
  assert.equal(n.total.kcal,214.5);assert.equal(n.porPorcion.kcal,107.3);
});
test('nutrición incompleta no se convierte en cero ni porción calculada',()=>{
  const r=prepararRecetaUsuario(entrada({ingredientes:[{ingredienteId:'huevo',cantidad:100,unidad:'g',estadoAlimento:'cocido'}]}),motor,catalogo,base);
  const n=calcularNutrientes(r,catalogo);assert.equal(n.completo,false);assert.equal(n.porPorcion,null);
});
test('rechaza duplicados, cantidades/unidades incompatibles, NaN y textos extensos',()=>{
  for(const cambios of [
    {ingredientes:[{ingredienteId:'huevo',cantidad:1,unidad:'unidad'},{ingredienteId:'huevo',cantidad:2,unidad:'unidad'}]},
    {ingredientes:[{ingredienteId:'huevo',cantidad:NaN,unidad:'unidad'}]},
    {ingredientes:[{ingredienteId:'papa',cantidad:2,unidad:'unidad'}]},
    {nombre:'x'.repeat(101)},{pasos:['x'.repeat(1201)]}
  ])assert.throws(()=>prepararRecetaUsuario(entrada(cambios),motor,catalogo,base));
});
test('crear, editar, borrar, borrador y recuperación sin modificar el catálogo',()=>{
  const s=storage(),r=prepararRecetaUsuario(entrada(),motor,catalogo,base);
  let doc={version:1,recetas:[r],borrador:null};assert.equal(guardarRecetasUsuario(s,doc,false,motor,catalogo,base).ok,true);
  let rec=recuperarRecetasUsuario(s,motor,catalogo,base);assert.equal(rec.datos.recetas[0].nombre,r.nombre);
  doc.recetas[0]=prepararRecetaUsuario({...r,nombre:'Editada'},motor,catalogo,base);
  doc.borrador={id:nuevoIdReceta(),nombre:'Borrador',ingredientes:[],pasos:[]};
  assert.equal(guardarRecetasUsuario(s,doc,false,motor,catalogo,base).ok,true);
  assert.equal(recuperarRecetasUsuario(s,motor,catalogo,base).datos.recetas[0].nombre,'Editada');
  doc.recetas=[];assert.equal(guardarRecetasUsuario(s,doc,false,motor,catalogo,base).ok,true);
  assert.equal(recuperarRecetasUsuario(s,motor,catalogo,base).datos.recetas.length,0);
  assert.equal(base.length,39);
});
test('recetas propias comparten motor de planificación, compras y parciales',()=>{
  const r=prepararRecetaUsuario(entrada({ingredientes:[{ingredienteId:'huevo',cantidad:3,unidad:'unidad',estadoAlimento:'base'}]}),motor,catalogo,base);
  const m=crearMotorCantidades([...base,r],catalogo,eq),s=estadoVacio();
  m.agregarNecesidades(s,r.id,m.requerimientos(r).map(x=>x.clave),2);
  m.ajustarInventario(s,'huevo',1,'unidad');
  assert.equal(m.resumenCompras(s).find(g=>g.id==='huevo').variantes[0].pendiente,2);
  m.confirmarCompra(s,m.requerimientos(r)[0],1,'unidad','operacion-prueba');
  assert.equal(m.resumenCompras(s).find(g=>g.id==='huevo').variantes[0].pendiente,1);
  m.cambiarPorciones(s,r.id,4);assert.equal(m.resumenCompras(s).find(g=>g.id==='huevo').variantes[0].pendiente,4);
});
test('desvincular receta propia conserva necesidades y compra parcial confirmada',()=>{
  const r=prepararRecetaUsuario(entrada({ingredientes:[{ingredienteId:'huevo',cantidad:3,unidad:'unidad',estadoAlimento:'base'}]}),motor,catalogo,base);
  const m=crearMotorCantidades([...base,r],catalogo,eq),s=estadoVacio();
  m.agregarNecesidades(s,r.id,m.requerimientos(r).map(i=>i.clave),2);
  m.confirmarCompra(s,m.requerimientos(r)[0],1,'unidad','compra-real');
  const separado=separarNecesidadesReceta(s,r,m);
  assert.equal(separado.planes.length,0);assert.equal(separado.manuales.length,1);
  assert.equal(m.resumenCompras(separado).find(g=>g.id==='huevo').variantes[0].pendiente,2);
  assert.equal(separado.comprasRealizadas[0].id,'compra-real');
  assert.equal(s.planes.length,1);
});
test('estado corrupto o almacenamiento fallido bloquean sobrescritura',()=>{
  const s=storage();s.setItem(CLAVE_RECETAS_USUARIO,'{mal');
  const rec=recuperarRecetasUsuario(s,motor,catalogo,base);assert.equal(rec.bloqueado,true);
  assert.equal(guardarRecetasUsuario(s,rec.datos,rec.bloqueado,motor,catalogo,base).ok,false);
  assert.equal(s.getItem(CLAVE_RECETAS_USUARIO),'{mal');
  const mal={getItem:()=>null,setItem:()=>{throw Error('cuota')}};
  assert.equal(guardarRecetasUsuario(mal,{version:1,recetas:[],borrador:null},false,motor,catalogo,base).ok,false);
});
test('foto rechaza tipo y tamaño antes de decodificar',()=>{
  assert.throws(()=>validarArchivoFoto({type:'image/svg+xml',size:200}));
  assert.throws(()=>validarArchivoFoto({type:'image/png',size:10*1024*1024+1}));
  assert.doesNotThrow(()=>validarArchivoFoto({type:'image/webp',size:1024}));
});
test('guardar borrador con foto nueva conserva la foto de la receta publicada',()=>{
  const doc={recetas:[{imagenId:'foto-A'}],borrador:{imagenId:'foto-B'}};
  assert.deepEqual(fotosSinReferencias(['foto-A','foto-B'],doc),[]);
  assert.deepEqual(fotosSinReferencias(['foto-A','foto-C'],doc),['foto-C']);
});
test('borrar receta respeta la foto compartida y limpia la obsoleta tras reemplazo',()=>{
  assert.deepEqual(fotosSinReferencias(['foto-A'],{recetas:[],borrador:{imagenId:'foto-A'}}),[]);
  assert.deepEqual(fotosSinReferencias(['foto-A','foto-A'],{recetas:[{imagenId:'foto-B'}],borrador:null}),['foto-A']);
});
