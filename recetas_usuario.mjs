/** Recetas personales: contrato y guardado separados del catálogo público. */
import {gramosDeIngrediente, clasificarReceta} from './motor_avanzi.mjs';

export const CLAVE_RECETAS_USUARIO = 'avanzi.recetas.usuario.v1';
export const vacioRecetasUsuario = () => ({version:1, recetas:[], borrador:null});
const uuid = /^usr-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const cadena = (v,max) => typeof v==='string' && v.trim().length>0 && v.trim().length<=max;
const entero = (v,min,max) => Number.isInteger(v) && v>=min && v<=max;
export function nuevoIdReceta(cryptoApi=crypto) {
  const a=cryptoApi.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
  const h=[...a].map(n=>n.toString(16).padStart(2,'0')).join('');
  return `usr-${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export const esPropia = r => uuid.test(r?.id||'');

function validarLinea(linea,motor) {
  if(!linea || !motor.catalogo.has(linea.ingredienteId) || !Number.isFinite(linea.cantidad) || linea.cantidad<=0 || linea.cantidad>1e7 ||
    !['base','cocido','hebras'].includes(linea.estadoAlimento||'base') ||
    !motor.opcionesUnidades(linea.ingredienteId,linea.estadoAlimento||'base').includes(linea.unidad))
    throw new Error('Revisá el ingrediente, su cantidad y una unidad compatible.');
  const c=motor.canonizar(linea.ingredienteId,linea.cantidad,linea.unidad,linea.estadoAlimento||'base');
  if(!Number.isFinite(c.cantidad)||c.cantidad<=0)throw new Error('La cantidad es demasiado pequeña o grande para esa unidad.');
  return c;
}
export function prepararRecetaUsuario(entrada,motor,ingredientes,recetasBase=[]) {
  if(!esPropia(entrada)||!cadena(entrada.nombre,100)||!entero(entrada.porciones,1,1000)||
    !entero(entrada.tiempoPreparacionMinutos,0,1440)||!entero(entrada.tiempoCoccionMinutos,0,1440)||
    entrada.tiempoPreparacionMinutos+entrada.tiempoCoccionMinutos>1440 ||
    !Array.isArray(entrada.ingredientes)||entrada.ingredientes.length<1||entrada.ingredientes.length>80||
    !Array.isArray(entrada.pasos)||entrada.pasos.length<1||entrada.pasos.length>60||!entrada.pasos.every(p=>cadena(p,1200))||
    (entrada.imagenId!=null && !/^foto-[0-9a-f-]{36}$/.test(entrada.imagenId)) || typeof entrada.esDesayuno!=='boolean')
    throw new Error('Completá nombre, porciones, tiempos, al menos un ingrediente y un paso válido.');
  const vistos=new Set();
  const perfiles=new Map();
  for(const r of recetasBase)for(const l of r.ingredientes||[])if(l.perfilNutricionalUsado&&l.noUsarValoresSecosParaCocidos===true)perfiles.set(l.ingredienteId,l.perfilNutricionalUsado);
  const lineas=entrada.ingredientes.map(l=>{
    const c=validarLinea(l,motor),id=l.ingredienteId;
    if(vistos.has(id))throw new Error('Cada ingrediente debe aparecer una sola vez; editá la cantidad de su fila.');
    vistos.add(id);
    const estado=l.estadoAlimento||'base';
    let gramos=null;
    if(estado==='cocido')gramos=c.unidad==='g'?c.cantidad:null;
    else if(estado==='base'){
      const ficha=motor.catalogo.get(id);
      gramos=c.unidad==='g'?c.cantidad:c.unidad==='ml'?gramosDeIngrediente(c.cantidad,'ml',ficha):null;
      if(gramos===null && c.unidad==='unidad'){
        const porGramo=motor.canonizar(id,1,'g');
        if(porGramo.unidad==='unidad' && porGramo.cantidad>0)gramos=c.cantidad/porGramo.cantidad;
      }
      // El motor de cantidades ya convirtió medidas documentadas a g/ml;
      // una unidad sin equivalencia no obtiene peso por inferencia.
    }
    const linea={ingredienteId:id,cantidad:l.cantidad,unidad:l.unidad,estadoAlimento:estado};
    if(Number.isFinite(gramos))linea.gramosComestibles=gramos;
    if(estado==='cocido'){
      linea.noUsarValoresSecosParaCocidos=true;
      if(perfiles.has(id))linea.perfilNutricionalUsado=perfiles.get(id);
    }
    if(estado==='hebras'&&id==='te-negro'){linea.incluidoEnCalculo=false;linea.motivoExclusion='insumo_no_ingerido';linea.gramosComestibles=0;}
    return linea;
  });
  const receta={id:entrada.id,nombre:entrada.nombre.trim(),porciones:entrada.porciones,
    tiempoPreparacionMinutos:entrada.tiempoPreparacionMinutos,tiempoCoccionMinutos:entrada.tiempoCoccionMinutos,
    tiempoTotalMinutos:entrada.tiempoPreparacionMinutos+entrada.tiempoCoccionMinutos,
    ingredientes:lineas,pasos:entrada.pasos.map(p=>p.trim()),esDesayuno:entrada.esDesayuno,
    imagenId:entrada.imagenId||null,origen:'usuario'};
  receta.categoriasAutomaticas=clasificarReceta(receta,ingredientes);
  // El resultado nutricional se deriva en el detalle con el motor existente;
  // no se guarda como un segundo valor potencialmente obsoleto.
  return receta;
}

function validarDocumento(doc,motor,ingredientes,base) {
  if(!doc||doc.version!==1||!Array.isArray(doc.recetas)||doc.recetas.length>500||
    (doc.borrador!==null&&typeof doc.borrador!=='object'))throw new Error('El archivo local de recetas propias tiene un formato desconocido.');
  const ids=new Set();
  const recetas=doc.recetas.map(r=>{
    const preparada=prepararRecetaUsuario(r,motor,ingredientes,base);
    if(ids.has(preparada.id)||base.some(b=>b.id===preparada.id))throw new Error('Hay IDs de recetas repetidos.');
    ids.add(preparada.id);return preparada;
  });
  if(doc.borrador){
    const d=doc.borrador;
    if(!esPropia(d)||typeof d.nombre!=='string'||d.nombre.length>100||
      !Array.isArray(d.ingredientes)||d.ingredientes.length>80||
      !d.ingredientes.every(l=>l&&typeof l.ingredienteId==='string'&&l.ingredienteId.length<=100&&
        (l.cantidad===null||Number.isFinite(l.cantidad))&&typeof l.unidad==='string'&&l.unidad.length<=30&&
        ['base','cocido','hebras'].includes(l.estadoAlimento))||
      !Array.isArray(d.pasos)||d.pasos.length>60||!d.pasos.every(p=>typeof p==='string'&&p.length<=1200)||
      (d.imagenId!=null&&!/^foto-[0-9a-f-]{36}$/.test(d.imagenId)))throw new Error('El borrador guardado está dañado.');
  }
  return {...doc,recetas};
}
export function recuperarRecetasUsuario(storage,motor,ingredientes,base) {
  try{
    const raw=storage.getItem(CLAVE_RECETAS_USUARIO);
    return {datos:raw===null?vacioRecetasUsuario():validarDocumento(JSON.parse(raw),motor,ingredientes,base),bloqueado:false,mensaje:''};
  }catch(error){return {datos:vacioRecetasUsuario(),bloqueado:true,mensaje:`No pudimos recuperar tus recetas propias: ${error.message} No se sobrescribirán. Conservá una copia de los datos de este navegador.`};}
}
export function guardarRecetasUsuario(storage,datos,bloqueado,motor,ingredientes,base) {
  if(bloqueado)return {ok:false,mensaje:'No se pueden guardar recetas propias porque los datos anteriores están dañados.'};
  try{
    validarDocumento(datos,motor,ingredientes,base);
    storage.setItem(CLAVE_RECETAS_USUARIO,JSON.stringify(datos));
    return {ok:true,mensaje:''};
  }catch(error){return {ok:false,mensaje:`No pudimos guardar tus recetas propias: ${error.message} Los cambios de esta receta no se conservaron.`};}
}
