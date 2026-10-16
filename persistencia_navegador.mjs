/** Evita sobrescribir una copia obsoleta de inventario o recetas propias. */
import {CLAVE_DESPENSA} from './almacenamiento.mjs';
import {CLAVE_RECETAS_USUARIO} from './recetas_usuario.mjs';
import {CLAVE_PERFIL} from './perfil_usuario.mjs';
import {CLAVE_FAVORITOS} from './favoritos.mjs';

const CLAVES=new Set([CLAVE_DESPENSA,CLAVE_RECETAS_USUARIO,CLAVE_PERFIL,CLAVE_FAVORITOS]);
export class ConflictoEntrePestanas extends Error {
  constructor(){super('Avanzi cambió en otra pestaña. Recargá antes de guardar para no perder esos cambios.');this.code='AVANZI_CONFLICTO_PESTANAS';}
}
export function crearAlmacenamientoProtegido(win,alDetectar=()=>{}) {
  const observados=new Map();
  let desactualizado=false;
  const marcar=()=>{if(!desactualizado){desactualizado=true;alDetectar();}};
  const comprobar=()=>{
    if(desactualizado)throw new ConflictoEntrePestanas();
    for(const [clave,valor] of observados){
      if(win.localStorage.getItem(clave)!==valor){marcar();throw new ConflictoEntrePestanas();}
    }
  };
  win.addEventListener('storage',evento=>{
    if(evento.key===null||CLAVES.has(evento.key))marcar();
  });
  const storage={
    getItem(clave){
      const valor=win.localStorage.getItem(clave);
      if(CLAVES.has(clave)&&!observados.has(clave))observados.set(clave,valor);
      return valor;
    },
    setItem(clave,valor){
      comprobar();
      win.localStorage.setItem(clave,valor);
      if(CLAVES.has(clave))observados.set(clave,valor);
    },
    removeItem(clave){
      comprobar();
      win.localStorage.removeItem(clave);
      if(CLAVES.has(clave))observados.set(clave,null);
    }
  };
  return {storage,comprobar,desactualizado:()=>desactualizado};
}
