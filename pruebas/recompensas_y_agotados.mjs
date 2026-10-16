import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {crearMotorCantidades,estadoVacio,copiar} from '../planificacion.mjs';
import {iniciarSesion,registrarCambiosCompras,finalizarSesion,cancelarSesion,invalidarRecetas,saldoMonedas,monedasPorRecetas} from '../recompensas.mjs';
import {guardarEstado,recuperarEstado,CLAVE_DESPENSA} from '../almacenamiento.mjs';
import {crearAlmacenamientoProtegido} from '../persistencia_navegador.mjs';

const leer=n=>JSON.parse(fs.readFileSync(new URL(`../datos/${n}.json`,import.meta.url)));
const ingredientes=leer('ingredientes').ingredientes,eq=leer('equivalencias_g');
const linea=id=>({ingredienteId:id,cantidad:100,unidad:'g'});
const receta=(id,ids)=>({id,nombre:id,porciones:2,ingredientes:ids.map(linea),pasos:['Preparar.']});
const recetas=[receta('huevos-tomate',['huevo','tomate']),receta('huevos-papa',['huevo','papa']),receta('varios',['huevo','tomate','papa'])];
const motor=crearMotorCantidades(recetas,ingredientes,eq);
const fecha=(dia,hora=10)=>new Date(2026,9,dia,hora).toISOString();
const memoria=()=>{const datos=new Map();return {datos,getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)};};
function planificar(s,r){motor.agregarNecesidades(s,r.id,motor.requerimientos(r).map(i=>i.clave));}
function marcar(s,accion,dia=16,modo='real'){const antes=copiar(s);accion();registrarCambiosCompras(antes,s,motor,fecha(dia),modo);}

test('huevos compartidos: un agotamiento crea dos IDs y una compra completa dos recetas',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);planificar(s,recetas[1]);
  motor.establecerPresencia(s,'tomate',true);motor.establecerPresencia(s,'papa',true);
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  const antiguos=s.planes.map(p=>p.ingredientes.find(i=>i.clave.startsWith('huevo|')).necesidadId);
  assert.equal(motor.disponibilidad(recetas[0],s).completa,true);
  assert.equal(motor.agotarIngrediente(s,'huevo',false,fecha(16)),true);
  assert.equal(motor.agotarIngrediente(s,'huevo',false,fecha(16)),false);
  assert.equal(s.historialSubtareas.length,2);
  assert.deepEqual(s.historialSubtareas.map(h=>h.id),antiguos);
  assert.ok(s.historialSubtareas.every(h=>h.completado&&h.cantidad>0&&h.nombreReceta&&h.registro));
  const nuevos=s.planes.map(p=>p.ingredientes.find(i=>i.clave.startsWith('huevo|')).necesidadId);
  assert.equal(new Set(nuevos).size,2);assert.ok(nuevos.every(id=>!antiguos.includes(id)));
  assert.equal(motor.disponibilidad(recetas[0],s).completa,false);
  iniciarSesion(s,motor,fecha(16),'ses-compartida');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  const premio=finalizarSesion(s,motor,fecha(16));
  assert.deepEqual(premio,{monedas:15,recetas:['huevos-tomate','huevos-papa']});
  assert.equal(saldoMonedas(s),15);
  assert.equal(s.historialSubtareas.length,2);
});

test('agotamiento respeta fijados, selección manual y compras anteriores',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);
  motor.establecerPresencia(s,'huevo',true);motor.fijarIngrediente(s,'huevo',true);
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  const inventario=copiar(s.inventario),idAntiguo=s.planes[0].ingredientes[0].necesidadId;
  assert.throws(()=>motor.agotarIngrediente(s,'huevo'),/Desfijá/);
  assert.deepEqual(s.fijados,['huevo']);
  assert.equal(motor.agotarIngrediente(s,'huevo',true,fecha(16)),true);
  assert.deepEqual(s.fijados,[]);assert.deepEqual(s.inventario,inventario);
  assert.ok(s.presenciaManualOculta.includes('huevo'));
  assert.equal(motor.tieneIngrediente(s,'huevo'),false);
  assert.equal(s.historialSubtareas[0].id,idAntiguo);
  assert.equal(s.historialSubtareas[0].completado,true);
});

test('varios faltantes requieren compras nuevas; la selección manual no premia',()=>{
  const s=estadoVacio();planificar(s,recetas[2]);
  iniciarSesion(s,motor,fecha(16),'ses-varios');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  marcar(s,()=>motor.establecerPresencia(s,'tomate',true));
  marcar(s,()=>motor.establecerPresencia(s,'papa',true));
  assert.equal(motor.disponibilidad(recetas[2],s).completa,true);
  assert.deepEqual(finalizarSesion(s,motor,fecha(16)),{monedas:0,recetas:[]});
  assert.equal(saldoMonedas(s),0);
});

test('cancelar conserva compras pero no permite reutilizar la misma subtarea',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-cancelada');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  assert.equal(cancelarSesion(s),true);assert.equal(saldoMonedas(s),0);
  assert.equal(motor.tieneIngrediente(s,'huevo'),true);
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',false));
  iniciarSesion(s,motor,fecha(16),'ses-otra');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,0);
});

test('misma receta puede cobrar en jornadas del mismo día solo tras nuevas necesidades',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-dia-1');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true),16);
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,5);
  motor.agotarIngrediente(s,'huevo',false,fecha(16));
  iniciarSesion(s,motor,fecha(16),'ses-mismo-dia');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true),16);
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,5);
  assert.equal(saldoMonedas(s),10);
  motor.agotarIngrediente(s,'huevo',false,fecha(17));
  iniciarSesion(s,motor,fecha(17),'ses-dia-2');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true),17);
  assert.equal(finalizarSesion(s,motor,fecha(17)).monedas,5);
  assert.equal(saldoMonedas(s),15);
  assert.equal(s.recompensas.movimientos.length,3);
  assert.deepEqual([1,2,3,4,5,6,7].map(monedasPorRecetas),[5,15,30,50,75,90,105]);
});

test('eliminar o modificar una receta invalida la candidatura sin borrar historial',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-invalida');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  invalidarRecetas(s,['huevos-tomate']);
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,0);
  motor.agotarIngrediente(s,'huevo',false,fecha(16));
  iniciarSesion(s,motor,fecha(16),'ses-borrada');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  motor.quitarReceta(s,'huevos-tomate');
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,0);
  assert.equal(s.historialSubtareas.length,1);
});

test('snapshot anterior, recarga y fallo de guardado conservan historial y saldo',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-persistida');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  const storage=memoria();assert.equal(guardarEstado(storage,s,motor).ok,true);
  const recargado=recuperarEstado(storage,motor);assert.equal(recargado.bloqueado,false);
  assert.equal(recargado.estado.recompensas.sesion.id,'ses-persistida');
  assert.equal(finalizarSesion(recargado.estado,motor,fecha(16)).monedas,5);
  assert.equal(guardarEstado(storage,recargado.estado,motor).ok,true);
  assert.equal(saldoMonedas(recuperarEstado(storage,motor).estado),5);
  const previo=storage.getItem(CLAVE_DESPENSA);
  const falla={getItem:k=>storage.getItem(k),setItem:()=>{throw Error('cuota')}};
  assert.equal(guardarEstado(falla,recargado.estado,motor).ok,false);
  assert.equal(storage.getItem(CLAVE_DESPENSA),previo);
  const antiguo=estadoVacio();delete antiguo.recompensas;delete antiguo.historialSubtareas;
  storage.setItem(CLAVE_DESPENSA,JSON.stringify(antiguo));
  assert.equal(recuperarEstado(storage,motor).bloqueado,false);
});

test('pestaña obsoleta no sobrescribe compras ni monedas',()=>{
  const datos=new Map(),listeners=[];
  const win=()=>({localStorage:{getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)},addEventListener:(tipo,fn)=>{if(tipo==='storage')listeners.push(fn)}});
  const a=crearAlmacenamientoProtegido(win()),b=crearAlmacenamientoProtegido(win());
  a.storage.getItem(CLAVE_DESPENSA);b.storage.getItem(CLAVE_DESPENSA);
  const s=estadoVacio();planificar(s,recetas[0]);
  assert.equal(guardarEstado(a.storage,s,motor).ok,true);
  const anterior=datos.get(CLAVE_DESPENSA);
  assert.equal(guardarEstado(b.storage,s,motor).ok,false);
  assert.equal(datos.get(CLAVE_DESPENSA),anterior);
});

test('una necesidad pendiente anterior recibe ID estable al iniciar, pero una compra antigua no se reutiliza',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  const huevo=s.planes[0].ingredientes.find(i=>i.clave.startsWith('huevo|'));
  const tomate=s.planes[0].ingredientes.find(i=>i.clave.startsWith('tomate|'));
  delete huevo.necesidadId;delete tomate.necesidadId;
  tomate.completado=true;
  iniciarSesion(s,motor,fecha(16),'ses-legado');
  assert.match(huevo.necesidadId,/^nec-/);
  assert.equal(tomate.necesidadId,undefined);
  const id=huevo.necesidadId;
  marcar(s,()=>motor.marcarSubtarea(s,'huevo',`planid:${id}`,true));
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,5);
});

test('una jornada que cruza de día termina sin premio y permite comenzar otra',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-cruce');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true),16);
  assert.deepEqual(finalizarSesion(s,motor,fecha(17)),{monedas:0,recetas:[]});
  assert.equal(s.recompensas.sesion,null);
  assert.equal(saldoMonedas(s),0);
  assert.equal(motor.tieneIngrediente(s,'huevo'),true);
  motor.agotarIngrediente(s,'huevo',false,fecha(17));
  assert.doesNotThrow(()=>iniciarSesion(s,motor,fecha(17),'ses-otro-dia'));
});

test('agotamiento sin plan no crea compras y el historial sigue inactivo tras recargar',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  motor.quitarReceta(s,'huevos-tomate');
  const historicasAntes=s.manuales.filter(i=>i.ingredienteId==='huevo'&&i.completado).length;
  assert.ok(historicasAntes>0);
  assert.equal(motor.agotarIngrediente(s,'huevo',false,fecha(16)),true);
  assert.equal(s.planes.length,0);
  assert.equal(s.manuales.filter(i=>i.ingredienteId==='huevo').length,0);
  assert.equal(s.historialSubtareas.length,historicasAntes);
  const storage=memoria();assert.equal(guardarEstado(storage,s,motor).ok,true);
  const recuperado=recuperarEstado(storage,motor);
  assert.equal(recuperado.bloqueado,false);
  assert.equal(recuperado.estado.historialSubtareas.length,historicasAntes);
  assert.equal(motor.tieneIngrediente(recuperado.estado,'huevo'),false);
  assert.equal(motor.agotarIngrediente(recuperado.estado,'huevo'),false);
  assert.equal(recuperado.estado.historialSubtareas.length,historicasAntes);
});

test('alternar disponibilidad manual no duplica necesidades ni concede monedas',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  motor.establecerPresencia(s,'huevo',true);
  motor.fijarIngrediente(s,'huevo',true);
  motor.fijarIngrediente(s,'huevo',false);
  assert.equal(motor.tieneIngrediente(s,'huevo'),true);
  assert.equal(motor.agotarIngrediente(s,'huevo',false,fecha(16)),true);
  const primera=s.planes[0].ingredientes.find(i=>i.clave.startsWith('huevo|')).necesidadId;
  motor.establecerPresencia(s,'huevo',true);
  assert.equal(motor.agotarIngrediente(s,'huevo',false,fecha(16)),true);
  assert.equal(s.planes[0].ingredientes.find(i=>i.clave.startsWith('huevo|')).necesidadId,primera);
  assert.equal(s.historialSubtareas.length,0);
  iniciarSesion(s,motor,fecha(16),'ses-alternar');
  marcar(s,()=>motor.establecerPresencia(s,'huevo',true));
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,0);
  assert.equal(saldoMonedas(s),0);
});

test('la jornada de prueba acredita solo monedas ficticias y no reutiliza su compra en modo real',()=>{
  const s=estadoVacio();planificar(s,recetas[0]);motor.establecerPresencia(s,'tomate',true);
  iniciarSesion(s,motor,fecha(16),'ses-demo', 'demo');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true),16,'demo');
  assert.equal(finalizarSesion(s,motor,fecha(16),'demo').monedas,5);
  assert.equal(saldoMonedas(s),0);
  assert.equal(saldoMonedas(s,'demo'),1000004);
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',false));
  iniciarSesion(s,motor,fecha(16),'ses-real');
  marcar(s,()=>motor.marcarIngrediente(s,'huevo',true));
  assert.equal(finalizarSesion(s,motor,fecha(16)).monedas,0);
  assert.equal(saldoMonedas(s),0);
});
