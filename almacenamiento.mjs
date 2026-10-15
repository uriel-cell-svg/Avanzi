/** Un único snapshot evita escrituras parciales entre inventario, planes y compras. */
import {estadoVacio,copiar,VERSION_ESTADO} from './planificacion.mjs';
export const CLAVE_DESPENSA='que-cocino.despensa.v1';
export const CLAVE_COMPRAS='que-cocino.compras.v1';
const texto=x=>typeof x==='string'&&x.trim().length>0;
const iguales=(a,b)=>new Set(a).size===new Set(b).size&&a.every(x=>b.includes(x));
const normalizar=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim().replace(/\s+/g,' ');
const ambiguos=new Set(['aceite','arroz','pasta']);
function resolverReferencias(estado,motor) {
  if(!estado.porRevisar.length)return;
  const indice=new Map();
  for(const ingrediente of motor.catalogo.values())for(const nombre of [ingrediente.nombreEs,ingrediente.nombre,...(ingrediente.aliasEs||[])]){
    if(!texto(nombre))continue;
    const clave=normalizar(nombre),ids=indice.get(clave)||new Set();ids.add(ingrediente.id);indice.set(clave,ids);
  }
  const pendientes=[];
  for(const ref of estado.porRevisar){
    const clave=normalizar(ref.id),coincidencias=indice.get(clave);
    const id=motor.catalogo.has(ref.id)?ref.id:!ambiguos.has(clave)&&coincidencias?.size===1?[...coincidencias][0]:null;
    if(!id||!['inventario','compras'].includes(ref.tipo)){pendientes.push(ref);continue;}
    if(ref.tipo==='inventario'){
      if(!estado.inventario.some(i=>i.ingredienteId===id))motor.ajustarInventario(estado,id,null,motor.unidadBase(id));
    }else if(!estado.manuales.some(i=>i.id===`legado:${id}`)){
      const item=motor.canonizar(id,null,motor.unidadBase(id));
      const recetas=Array.isArray(ref.original?.recetas)?ref.original.recetas:[];
      estado.manuales.push({...item,id:`legado:${id}`,nombreOrigen:recetas.length?`Recetas anteriores: ${recetas.join(', ')}`:'Lista anterior',origenesLegados:[...recetas]});
    }
    (estado.referenciasResueltas??=[]).push({...ref,ingredienteId:id});
  }
  estado.porRevisar=pendientes;
}
function validarListaAntigua(items) {
  if(!Array.isArray(items))throw new Error('Lista de compras anterior inválida.');
  const ids=new Set();
  for(const i of items){
    if(!i || !texto(i.id)||ids.has(i.id)||!Array.isArray(i.recetas)||!i.recetas.every(texto)||
      (i.comprado!==undefined&&typeof i.comprado!=='boolean')||
      (i.incorporadoPorCompra!==undefined&&typeof i.incorporadoPorCompra!=='boolean')||
      (i.incorporadoPorCompra===true&&i.comprado!==true))throw new Error('Lista de compras anterior inválida.');
    ids.add(i.id);
  }
  return items;
}
export function validarEstado(datos,motor) {
  if(!datos||datos.version!==VERSION_ESTADO)throw new Error('Versión de datos guardados no compatible.');
  for(const key of ['inventario','planes','manuales','comprasRealizadas','transiciones','porRevisar'])if(!Array.isArray(datos[key]))throw new Error(`Datos guardados inválidos: ${key}.`);
  const s=copiar(datos),avisos=[];
  const comprobarItem=i=>{
    if(!i||!texto(i.ingredienteId)||!texto(i.unidad)||!['base','cocido','hebras'].includes(i.estado)||
      (i.cantidad!==null&&(!Number.isFinite(i.cantidad)||i.cantidad<0)))throw new Error('Cantidad guardada inválida.');
    if(!motor.catalogo.has(i.ingredienteId))return false;
    const c=motor.canonizar(i.ingredienteId,i.cantidad,i.unidad,i.estado);
    if(i.clave!==c.clave||i.cantidad!==c.cantidad||i.unidad!==c.unidad)throw new Error('Unidad guardada inconsistente.');
    return true;
  };
  const keys=new Set();
  s.inventario=s.inventario.filter(i=>{
    const conocida=comprobarItem(i);
    if(!conocida){avisos.push('Se omitió un ingrediente antiguo; se conservaron los vigentes.');return false;}
    if(keys.has(i.clave)||!Number.isInteger(i.revisionManual)||i.revisionManual<0||!texto(i.actualizadoEn))throw new Error('Inventario guardado inválido.');
    keys.add(i.clave);return true;
  });
  const planes=new Set();
  s.planes=s.planes.filter(p=>{
    if(!p||!texto(p.recetaId)||planes.has(p.recetaId)||!Array.isArray(p.ingredientes)||!Number.isFinite(p.porciones)||p.porciones<=0||!Number.isInteger(p.veces)||p.veces<1||p.veces>100)throw new Error('Planificación guardada inválida.');
    planes.add(p.recetaId);
    if(!motor.recetario.has(p.recetaId)) {
      // Las necesidades guardadas mantienen una copia de su definición para poder recuperar una receta retirada.
      for(const i of p.ingredientes)if(i.respaldo&&comprobarItem(i.respaldo)) s.manuales.push({...i.respaldo,id:`retirada:${p.recetaId}:${i.clave}`,nombreOrigen:`Receta retirada: ${p.recetaId}`});
      avisos.push('Una receta retirada se conservó como necesidad sin asociación activa.');return false;
    }
    const permitidos=new Set(motor.requerimientos(motor.recetario.get(p.recetaId),p.porciones,p.veces).map(i=>i.clave)),enlaces=new Set();
    p.ingredientes=p.ingredientes.filter(i=>{
      if(!i||!texto(i.clave)||enlaces.has(i.clave)||(i.completado!==undefined&&typeof i.completado!=='boolean')||(i.cantidadBase!==undefined&&(!Number.isFinite(i.cantidadBase)||i.cantidadBase<=0)))throw new Error('Asociación guardada inválida.');
      enlaces.add(i.clave);
      if(!permitidos.has(i.clave)){avisos.push('Se descartó una asociación antigua; las restantes se conservaron.');return false;}
      return true;
    });
    return p.ingredientes.length>0;
  });
  const manualIds=new Set();
  s.manuales=s.manuales.filter(i=>{
    if(!texto(i?.id)||manualIds.has(i.id)||!texto(i.nombreOrigen)||(i.completado!==undefined&&typeof i.completado!=='boolean'))throw new Error('Necesidad manual inválida.');
    manualIds.add(i.id);
    if(!comprobarItem(i)){avisos.push('Se omitió una compra de un ingrediente retirado.');return false;}
    return true;
  });
  const recibos=new Set();
  s.comprasRealizadas=s.comprasRealizadas.filter(i=>{
    if(!texto(i?.id)||recibos.has(i.id)||typeof i.deshecha!=='boolean'||!Number.isInteger(i.revisionManual)||i.revisionManual<0||!texto(i.fecha)||!Number.isFinite(i.cantidad)||i.cantidad<=0)throw new Error('Registro de compra inválido.');
    recibos.add(i.id);return comprobarItem(i);
  });
  const transiciones=new Set();
  for(const t of s.transiciones){if(!texto(t?.recetaId)||!texto(t.id)||!texto(t.fecha)||transiciones.has(t.recetaId))throw new Error('Registro de transición inválido.');transiciones.add(t.recetaId);}
  for(const item of s.porRevisar)if(!item||!texto(item.id)||!texto(item.nombre)||!texto(item.tipo))throw new Error('Referencia anterior inválida.');
  if(s.referenciasResueltas!==undefined){
    if(!Array.isArray(s.referenciasResueltas)||s.referenciasResueltas.some(i=>!i||!texto(i.id)||!texto(i.nombre)||!texto(i.tipo)||!texto(i.ingredienteId)))throw new Error('Referencias resueltas inválidas.');
  }
  if(s.comprasRealizadas.some(i=>!i.deshecha)&&s.planes.some(p=>p.ingredientes.some(i=>i.completado===undefined)))
    avisos.push('Tus compras anteriores se conservaron. Revisá sus subtareas: no se marcaron como completadas automáticamente.');
  return {estado:s,avisos:[...new Set(avisos)]};
}
export function recuperarEstado(storage,motor) {
  try {
    const textoDespensa=storage.getItem(CLAVE_DESPENSA);
    const d=textoDespensa===null?null:JSON.parse(textoDespensa);
    if(d && !Array.isArray(d)) {
      const resultado=validarEstado(d,motor);
      resolverReferencias(resultado.estado,motor);
      if(resultado.estado.porRevisar.length)resultado.avisos.push(`${resultado.estado.porRevisar.length} referencias antiguas sin coincidencia segura se conservan en tus datos.`);
      return {...resultado,bloqueado:false,migrado:false};
    }
    const despensa=d??[];
    if(!Array.isArray(despensa)||!despensa.every(texto))throw new Error('La selección anterior es inválida.');
    const textoCompras=storage.getItem(CLAVE_COMPRAS);
    const compras=textoCompras===null?[]:JSON.parse(textoCompras);
    if(!Array.isArray(compras)&&(!compras||compras.version!==2))throw new Error('La versión de compras anterior no es válida.');
    let items=validarListaAntigua(Array.isArray(compras)?compras:compras.items);
    if(!Array.isArray(compras)&&compras.operacion!==undefined){
      const op=compras.operacion;
      if(!op||!Array.isArray(op.despensaAntes)||!Array.isArray(op.despensaDespues)||![...op.despensaAntes,...op.despensaDespues].every(texto))throw new Error('La operación anterior está dañada.');
      validarListaAntigua(op.itemsDespues);
      if(iguales(despensa,op.despensaDespues))items=op.itemsDespues;
    }
    const s=estadoVacio();
    const fecha=new Date().toISOString();
    // Sin inferir que la presencia equivale a una unidad o a una receta completa.
    for(const id of new Set(despensa)){
      if(motor.catalogo.has(id))motor.ajustarInventario(s,id,null,motor.unidadBase(id),'base',fecha);
      else s.porRevisar.push({tipo:'inventario',id,nombre:id,original:{id}});
    }
    for(const i of items){
      if(motor.catalogo.has(i.id)){
        const item=motor.canonizar(i.id,null,motor.unidadBase(i.id));
        s.manuales.push({...item,id:`legado:${i.id}`,nombreOrigen:i.recetas.length?`Recetas anteriores: ${i.recetas.join(', ')}`:'Lista anterior',origenesLegados:[...i.recetas]});
      }else s.porRevisar.push({tipo:'compras',id:i.id,nombre:i.id,original:i});
    }
    if(textoDespensa!==null||textoCompras!==null)s.legado={despensa:textoDespensa,compras:textoCompras};
    const tiene=despensa.length||items.length;
    resolverReferencias(s,motor);
    const avisos=tiene?['Se conservaron tus datos anteriores. Confirmá las cantidades: antes solo se guardaba presencia.']:[];
    if(s.porRevisar.length)avisos.push(`${s.porRevisar.length} referencias antiguas sin coincidencia segura se conservan en tus datos.`);
    return {estado:s,avisos,bloqueado:false,migrado:!!tiene};
  } catch(error) {
    return {estado:estadoVacio(),avisos:[`No pudimos recuperar los datos: ${error.message} No se sobrescribirán. Podés explorar las recetas; conservá una copia de tus datos antes de reparar el guardado.`],bloqueado:true,migrado:false};
  }
}
export function guardarEstado(storage,estado,motor,bloqueado=false) {
  if(bloqueado)return {ok:false,mensaje:'No se guardaron cambios porque los datos anteriores no pudieron recuperarse. Recargá o recuperá una copia válida.'};
  try {
    const copia=copiar(estado);
    // Copia de requisitos (no de faltantes) solo para preservar compras si se retira una receta del catálogo.
    for(const plan of copia.planes)for(const enlace of plan.ingredientes){
      const r=motor.requerimientosPlan(plan).find(i=>i.clave===enlace.clave);
      enlace.respaldo={ingredienteId:r.ingredienteId,estado:r.estado,cantidad:r.cantidad,unidad:r.unidad,clave:r.clave};
    }
    validarEstado(copia,motor);
    storage.setItem(CLAVE_DESPENSA,JSON.stringify(copia));
    return {ok:true,mensaje:''};
  }catch(error){return {ok:false,mensaje:error.code==='AVANZI_CONFLICTO_PESTANAS'?error.message:'Cambios solo en esta sesión: no pudimos guardar. Al recargar volverá el inventario y la lista guardados antes de esta acción. Podés reintentar.',detalle:error.message};}
}
