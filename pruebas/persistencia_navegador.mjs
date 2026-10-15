import test from 'node:test';
import assert from 'node:assert/strict';
import {crearAlmacenamientoProtegido} from '../persistencia_navegador.mjs';
import {CLAVE_DESPENSA} from '../almacenamiento.mjs';
import {CLAVE_RECETAS_USUARIO} from '../recetas_usuario.mjs';

function ventanas(){
  const datos=new Map(),listeners=[];
  const nueva=()=>({
    localStorage:{getItem:k=>datos.get(k)??null,setItem:(k,v)=>datos.set(k,v)},
    addEventListener:(tipo,fn)=>{if(tipo==='storage')listeners.push(fn);}
  });
  return {datos,nueva,listeners};
}
test('dos pestañas no pueden pisar un snapshot obsoleto aunque falte el evento storage',()=>{
  const origen=ventanas(),a=crearAlmacenamientoProtegido(origen.nueva()),b=crearAlmacenamientoProtegido(origen.nueva());
  a.storage.getItem(CLAVE_DESPENSA);b.storage.getItem(CLAVE_DESPENSA);
  a.storage.setItem(CLAVE_DESPENSA,'nuevo inventario');
  assert.throws(()=>b.storage.setItem(CLAVE_DESPENSA,'versión antigua'),{code:'AVANZI_CONFLICTO_PESTANAS'});
  assert.equal(origen.datos.get(CLAVE_DESPENSA),'nuevo inventario');
});
test('un cambio de recetas propias bloquea también el guardado del inventario obsoleto',()=>{
  const origen=ventanas(),a=crearAlmacenamientoProtegido(origen.nueva()),b=crearAlmacenamientoProtegido(origen.nueva());
  for(const clave of [CLAVE_DESPENSA,CLAVE_RECETAS_USUARIO]){a.storage.getItem(clave);b.storage.getItem(clave);}
  a.storage.setItem(CLAVE_RECETAS_USUARIO,'receta nueva');
  assert.throws(()=>b.storage.setItem(CLAVE_DESPENSA,'estado viejo'),{code:'AVANZI_CONFLICTO_PESTANAS'});
  assert.equal(origen.datos.has(CLAVE_DESPENSA),false);
});
test('evento storage avisa y bloquea; escrituras propias consecutivas siguen válidas',()=>{
  const origen=ventanas();let avisos=0;
  const a=crearAlmacenamientoProtegido(origen.nueva(),()=>avisos++);
  a.storage.getItem(CLAVE_DESPENSA);a.storage.setItem(CLAVE_DESPENSA,'primero');a.storage.setItem(CLAVE_DESPENSA,'segundo');
  origen.listeners[0]({key:CLAVE_RECETAS_USUARIO});
  assert.equal(avisos,1);assert.equal(a.desactualizado(),true);
  assert.throws(()=>a.storage.setItem(CLAVE_DESPENSA,'tercero'),{code:'AVANZI_CONFLICTO_PESTANAS'});
  assert.equal(origen.datos.get(CLAVE_DESPENSA),'segundo');
});
