/** Perfil voluntario, independiente del inventario y de las recetas. */
export const CLAVE_PERFIL='avanzi.perfil.v1';
const ACTIVIDADES=new Set(['sedentario','ligero','moderado','activo','muy-activo']);
const OBJETIVOS=new Set(['mantener','perder','ganar']);
const COEFICIENTES=new Set(['mas-5','menos-161']);
const ALIMENTACIONES=new Set(['omnivora','vegetariana','vegana']);
const opcional=(valor,min,max)=>valor===null||(typeof valor==='number'&&Number.isFinite(valor)&&valor>=min&&valor<=max);

export function validarPerfil(entrada) {
  if(!entrada||entrada.version!==1)throw new Error('Versión del perfil no compatible.');
  const nombre=entrada.nombre??'',edad=entrada.edad??null,pesoKg=entrada.pesoKg??null;
  const alturaCm=entrada.alturaCm??null,actividad=entrada.actividad??null;
  const objetivo=entrada.objetivo??null,coeficiente=entrada.coeficiente??null;
  const alimentacion=entrada.alimentacion??null;
  const usarEstimacion=entrada.usarEstimacion??false;
  const entrenaFuerza=entrada.entrenaFuerza??false;
  if(typeof nombre!=='string'||nombre.trim().length>60||/[\u0000-\u001f]/.test(nombre)||
    !opcional(edad,1,120)||(edad!==null&&!Number.isInteger(edad))||
    !opcional(pesoKg,1,500)||!opcional(alturaCm,1,300)||
    (actividad!==null&&!ACTIVIDADES.has(actividad))||
    (objetivo!==null&&!OBJETIVOS.has(objetivo))||
    (coeficiente!==null&&!COEFICIENTES.has(coeficiente))||(alimentacion!==null&&!ALIMENTACIONES.has(alimentacion))||typeof usarEstimacion!=='boolean'||typeof entrenaFuerza!=='boolean')throw new Error('Revisá los datos del perfil.');
  return {version:1,nombre:nombre.trim(),edad,pesoKg,alturaCm,actividad,objetivo,coeficiente,usarEstimacion,entrenaFuerza,alimentacion};
}
export function recuperarPerfil(storage) {
  try{const raw=storage.getItem(CLAVE_PERFIL);return {perfil:raw===null?null:validarPerfil(JSON.parse(raw)),bloqueado:false,mensaje:''};}
  catch(error){return {perfil:null,bloqueado:true,mensaje:`No pudimos recuperar tu perfil: ${error.message} No se sobrescribirá.`};}
}
export function guardarPerfil(storage,entrada,bloqueado=false) {
  if(bloqueado)return {ok:false,mensaje:'El perfil guardado no se pudo recuperar; no se sobrescribirá.'};
  try{const perfil=validarPerfil(entrada);storage.setItem(CLAVE_PERFIL,JSON.stringify(perfil));return {ok:true,perfil,mensaje:''};}
  catch(error){return {ok:false,mensaje:`No se guardó el perfil: ${error.message}`};}
}
export function eliminarPerfil(storage,bloqueado=false) {
  if(bloqueado)return {ok:false,mensaje:'El perfil guardado no se pudo recuperar; no se eliminará.'};
  try{storage.removeItem(CLAVE_PERFIL);return {ok:true,mensaje:''};}
  catch(error){return {ok:false,mensaje:`No se eliminó el perfil: ${error.message}`};}
}
