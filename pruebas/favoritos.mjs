import test from 'node:test';
import assert from 'node:assert/strict';
import {CLAVE_FAVORITOS,recuperarFavoritos,guardarFavoritos,cambiarFavorito,quitarFavorito} from '../favoritos.mjs';
import {crearAlmacenamientoProtegido} from '../persistencia_navegador.mjs';

const memoria=()=>{const datos=new Map();return {datos,getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)};};
test('favoritos por ID se alternan y recuperan después de recargar',()=>{
  const storage=memoria();storage.setItem('que-cocino.despensa.v1','despensa');
  let actual=recuperarFavoritos(storage).datos;
  actual=guardarFavoritos(storage,cambiarFavorito(actual,'receta-original')).datos;
  actual=guardarFavoritos(storage,cambiarFavorito(actual,'usuario-receta-1')).datos;
  assert.deepEqual(recuperarFavoritos(storage).datos.ids,['receta-original','usuario-receta-1']);
  actual=guardarFavoritos(storage,cambiarFavorito(actual,'receta-original')).datos;
  assert.deepEqual(actual.ids,['usuario-receta-1']);
  assert.equal(storage.getItem('que-cocino.despensa.v1'),'despensa');
});
test('eliminar receta propia limpia solo su favorito',()=>{
  const storage=memoria(),actual={version:1,ids:['receta-original','usuario-receta-1']};
  assert.equal(guardarFavoritos(storage,quitarFavorito(actual,'usuario-receta-1')).ok,true);
  assert.deepEqual(recuperarFavoritos(storage).datos.ids,['receta-original']);
});
test('favoritos inválidos bloquean sobrescritura',()=>{
  const storage=memoria();storage.setItem(CLAVE_FAVORITOS,'{dañado');
  const recuperado=recuperarFavoritos(storage);assert.equal(recuperado.bloqueado,true);
  assert.equal(guardarFavoritos(storage,{version:1,ids:[]},recuperado.bloqueado).ok,false);
  assert.equal(storage.getItem(CLAVE_FAVORITOS),'{dañado');
});
test('una pestaña obsoleta no pisa favoritos recientes',()=>{
  const datos=new Map(),listeners=[];
  const win=()=>({localStorage:{getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v),removeItem:k=>datos.delete(k)},addEventListener:(tipo,fn)=>{if(tipo==='storage')listeners.push(fn)}});
  const a=crearAlmacenamientoProtegido(win()),b=crearAlmacenamientoProtegido(win());
  a.storage.getItem(CLAVE_FAVORITOS);b.storage.getItem(CLAVE_FAVORITOS);
  a.storage.setItem(CLAVE_FAVORITOS,JSON.stringify({version:1,ids:['a']}));
  assert.throws(()=>b.storage.setItem(CLAVE_FAVORITOS,JSON.stringify({version:1,ids:['b']})),{code:'AVANZI_CONFLICTO_PESTANAS'});
  assert.deepEqual(JSON.parse(datos.get(CLAVE_FAVORITOS)).ids,['a']);
});
