/** Favoritos locales por ID de receta, independientes del perfil. */
export const CLAVE_FAVORITOS='avanzi.favoritos.v1';
const idValido=id=>typeof id==='string'&&id.length>0&&id.length<=120;
export function validarFavoritos(datos) {
  if(!datos||datos.version!==1||!Array.isArray(datos.ids)||!datos.ids.every(idValido)||new Set(datos.ids).size!==datos.ids.length)
    throw new Error('Formato de favoritos no compatible.');
  return {version:1,ids:[...datos.ids]};
}
export function recuperarFavoritos(storage) {
  try{const raw=storage.getItem(CLAVE_FAVORITOS);return {datos:raw===null?{version:1,ids:[]}:validarFavoritos(JSON.parse(raw)),bloqueado:false,mensaje:''};}
  catch(error){return {datos:{version:1,ids:[]},bloqueado:true,mensaje:`No pudimos recuperar tus favoritos: ${error.message} No se sobrescribirán.`};}
}
export function guardarFavoritos(storage,datos,bloqueado=false) {
  if(bloqueado)return {ok:false,mensaje:'Los favoritos guardados no se pudieron recuperar; no se sobrescribirán.'};
  try{const validos=validarFavoritos(datos);storage.setItem(CLAVE_FAVORITOS,JSON.stringify(validos));return {ok:true,datos:validos};}
  catch(error){return {ok:false,mensaje:`No se guardaron los favoritos: ${error.message}`};}
}
export function cambiarFavorito(datos,id) {
  if(!idValido(id))throw new Error('ID de receta inválido.');
  return {version:1,ids:datos.ids.includes(id)?datos.ids.filter(actual=>actual!==id):[...datos.ids,id]};
}
export function quitarFavorito(datos,id) {return {version:1,ids:datos.ids.filter(actual=>actual!==id)};}
