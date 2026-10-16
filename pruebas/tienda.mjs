import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {crearMotorCantidades,estadoVacio} from '../planificacion.mjs';
import {recompensasVacias,saldoMonedas} from '../recompensas.mjs';
import {validarCatalogoMascotas,validarTienda,comprarMascota,elegirMascota,modoDesdePerfil} from '../tienda.mjs';
import {guardarEstado,recuperarEstado} from '../almacenamiento.mjs';

const datos=n=>JSON.parse(fs.readFileSync(new URL(`../datos/${n}.json`,import.meta.url)));
const mascotas=validarCatalogoMascotas(datos('mascotas'));
const gato=mascotas[0],perro=mascotas[1];
const ingredientes=datos('ingredientes').ingredientes;
const motor=crearMotorCantidades([],ingredientes,datos('equivalencias_g'));
const fecha='2026-10-16T12:00:00.000Z';
const memoria=()=>{const datos=new Map();return {getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)};};
const estadoConMonedas=n=>{
  const s=estadoVacio();s.recompensas=recompensasVacias();
  if(n)s.recompensas.movimientos.push({id:'premio:inicial',tipo:'premio',monedas:n,fecha,dia:'2026-10-16',recetaIds:['receta']});
  return s;
};

test('catálogo local contiene cuatro mascotas con IDs y precios aprobados',()=>{
  assert.deepEqual(mascotas.map(m=>[m.id,m.precio]),[['gato',30],['perro',40],['conejo',50],['zorro',60]]);
});
test('saldo suficiente, compra única y selección de mascota activa',()=>{
  const s=estadoConMonedas(50);
  assert.equal(comprarMascota(s,gato,'real',fecha),20);
  assert.deepEqual(s.tienda.real.ids,['gato']);
  assert.equal(s.recompensas.movimientos.at(-1).monedas,-30);
  assert.throws(()=>comprarMascota(s,gato,'real',fecha),/Ya tenés/);
  assert.throws(()=>comprarMascota(s,perro,'real',fecha),/suficientes/);
  assert.equal(saldoMonedas(s),20);
  elegirMascota(s,'gato');assert.equal(s.tienda.real.activa,'gato');
  elegirMascota(s,null);assert.equal(s.tienda.real.activa,null);
  assert.deepEqual(s.tienda.real.ids,['gato']);
  assert.throws(()=>elegirMascota(s,'perro'),/desbloqueá/);
});
test('admin exacto utiliza movimientos y desbloqueos separados; desactivación conserva progreso real',()=>{
  const s=estadoConMonedas(50),config={modoPruebaDisponible:true};
  comprarMascota(s,gato,'real',fecha);elegirMascota(s,'gato','real');
  assert.equal(modoDesdePerfil({nombre:'admin'},config),'demo');
  assert.equal(modoDesdePerfil({nombre:'Admin'},config),'real');
  assert.equal(modoDesdePerfil({nombre:'admin'},{modoPruebaDisponible:false}),'real');
  assert.equal(comprarMascota(s,perro,'demo',fecha),999959);
  elegirMascota(s,'perro','demo');
  assert.equal(saldoMonedas(s),20);
  assert.deepEqual(s.tienda.real,{ids:['gato'],activa:'gato'});
  assert.deepEqual(s.tienda.demo,{ids:['perro'],activa:'perro'});
  assert.equal(s.recompensas.movimientosDemo.length,1);
  assert.throws(()=>comprarMascota(s,perro,'demo',fecha),/Ya tenés/);
});
test('recarga conserva canje y mascota activa en el mismo snapshot',()=>{
  const s=estadoConMonedas(50);comprarMascota(s,gato,'real',fecha);elegirMascota(s,'gato');
  const storage=memoria();assert.equal(guardarEstado(storage,s,motor).ok,true);
  const vuelta=recuperarEstado(storage,motor);
  assert.equal(vuelta.bloqueado,false);
  assert.deepEqual(vuelta.estado.tienda.real,{ids:['gato'],activa:'gato'});
  assert.equal(saldoMonedas(vuelta.estado),20);
  assert.equal(validarTienda(vuelta.estado.tienda,vuelta.estado.recompensas),vuelta.estado.tienda);
});
test('fallo de guardado conserva el snapshot anterior y datos previos sin tienda siguen válidos',()=>{
  const s=estadoConMonedas(50),storage=memoria();assert.equal(guardarEstado(storage,s,motor).ok,true);
  const previo=storage.getItem('que-cocino.despensa.v1');
  comprarMascota(s,gato,'real',fecha);
  const falla={getItem:k=>storage.getItem(k),setItem:()=>{throw Error('cuota')}};
  assert.equal(guardarEstado(falla,s,motor).ok,false);
  assert.equal(storage.getItem('que-cocino.despensa.v1'),previo);
  assert.equal(recuperarEstado(storage,motor).estado.tienda.real.ids.length,0);
});
