/** Sesiones y monedas: lógica pura sobre el snapshot conjunto de compras. */
export const recompensasVacias=()=>({version:1,sesion:null,vistos:[],movimientos:[]});
export const diaLocal=fecha=>{
  const d=new Date(fecha);
  if(Number.isNaN(d.getTime()))throw new Error('Fecha de compra inválida.');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export const monedasPorRecetas=n=>n<=0?0:n<=5?5*n*(n+1)/2:75+15*(n-5);
export const saldoMonedas=estado=>(estado.recompensas??recompensasVacias()).movimientos.reduce((total,m)=>total+m.monedas,0);
const idEnlace=(plan,enlace)=>enlace.necesidadId??`legado:${JSON.stringify([plan.recetaId,enlace.clave])}`;
const idManual=item=>`manual:${item.id}`;
const nuevo=id=>typeof id==='string'&&id.startsWith('nec-');
const firma=(receta,plan)=>JSON.stringify({ingredientes:receta.ingredientes.map(i=>[i.ingredienteId||i.id,i.cantidad,i.unidad,i.estadoAlimento]),porciones:plan.porciones,veces:plan.veces});
function enlaces(estado) {
  return [
    ...estado.planes.flatMap(p=>p.ingredientes.map(i=>({id:idEnlace(p,i),ingredienteId:i.clave.split('|')[0],completado:i.completado===true}))),
    ...estado.manuales.map(i=>({id:idManual(i),ingredienteId:i.ingredienteId,completado:i.completado===true}))
  ];
}
export function validarRecompensas(entrada) {
  if(entrada===undefined)return recompensasVacias();
  if(!entrada||entrada.version!==1||!Array.isArray(entrada.vistos)||!Array.isArray(entrada.movimientos)||
    entrada.vistos.some(id=>typeof id!=='string'||!id)||new Set(entrada.vistos).size!==entrada.vistos.length)throw new Error('Datos de recompensas inválidos.');
  const ids=new Set(),dias=new Set();
  for(const m of entrada.movimientos){
    if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||!['premio','canje'].includes(m.tipo)||
      !Number.isInteger(m.monedas)||(m.tipo==='premio'&&m.monedas<=0)||(m.tipo==='canje'&&m.monedas>=0)||
      typeof m.fecha!=='string'||!m.fecha||typeof m.dia!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(m.dia)||
      (m.tipo==='premio'&&(!Array.isArray(m.recetaIds)||!m.recetaIds.length||m.recetaIds.some(id=>typeof id!=='string'||!id)||dias.has(m.dia))))throw new Error('Movimiento de monedas inválido.');
    ids.add(m.id);if(m.tipo==='premio')dias.add(m.dia);
  }
  const s=entrada.sesion;
  if(s!==null){
    if(!s||typeof s.id!=='string'||!s.id||typeof s.fechaInicio!=='string'||!s.fechaInicio||
      typeof s.dia!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.dia)||!Array.isArray(s.candidatos)||
      !Array.isArray(s.compras)||!Array.isArray(s.conseguidas)||!Array.isArray(s.invalidadas)||
      s.compras.some(c=>!c||typeof c.id!=='string'||!nuevo(c.id)||typeof c.ingredienteId!=='string')||
      s.candidatos.some(c=>!c||typeof c.recetaId!=='string'||typeof c.firma!=='string'||!Array.isArray(c.faltantes)||c.faltantes.some(id=>typeof id!=='string'))||
      [...s.conseguidas,...s.invalidadas].some(id=>typeof id!=='string'))throw new Error('Sesión de compras inválida.');
  }
  return entrada;
}
export function iniciarSesion(estado,motor,fecha=new Date().toISOString(),id=`ses-${crypto.randomUUID()}`) {
  const r=estado.recompensas??(estado.recompensas=recompensasVacias()),dia=diaLocal(fecha);
  if(r.sesion)throw new Error('Ya hay una jornada de compras en curso.');
  if(r.movimientos.some(m=>m.tipo==='premio'&&m.dia===dia))throw new Error('Ya recibiste monedas por una jornada de compras hoy.');
  // Los vínculos pendientes anteriores a los IDs de necesidad reciben uno al iniciar
  // una jornada; las compras ya completadas siguen siendo anteriores y no se premian.
  for(const plan of estado.planes)for(const enlace of plan.ingredientes)
    if(!enlace.completado&&!enlace.necesidadId)enlace.necesidadId=`nec-${crypto.randomUUID()}`;
  const candidatos=estado.planes.map(plan=>{
    const receta=motor.recetario.get(plan.recetaId);
    if(!receta)return null;
    const faltantes=[...new Set(motor.disponibilidad(receta,estado).faltantes.map(i=>i.ingredienteId))];
    return faltantes.length?{recetaId:receta.id,nombre:receta.nombre,firma:firma(receta,plan),faltantes}:null;
  }).filter(Boolean);
  for(const enlace of enlaces(estado))if(enlace.completado&&!r.vistos.includes(enlace.id))r.vistos.push(enlace.id);
  r.sesion={id,fechaInicio:fecha,dia,candidatos,compras:[],conseguidas:[],invalidadas:[]};
  return r.sesion;
}
export function invalidarRecetas(estado,recetaIds) {
  const s=estado.recompensas?.sesion;if(!s)return;
  for(const id of recetaIds)if(!s.invalidadas.includes(id))s.invalidadas.push(id);
}
/** Se llama en la misma mutación que cambia una casilla; no premia todavía. */
export function registrarCambiosCompras(antes,despues,motor,fecha=new Date().toISOString()) {
  const r=despues.recompensas??(despues.recompensas=recompensasVacias());
  const anteriores=new Map(enlaces(antes).map(i=>[i.id,i]));
  const nuevas=enlaces(despues).filter(i=>i.completado&&!anteriores.get(i.id)?.completado&&!r.vistos.includes(i.id));
  for(const enlace of nuevas)r.vistos.push(enlace.id);
  const s=r.sesion;
  if(!s||s.dia!==diaLocal(fecha))return;
  for(const enlace of nuevas)if(nuevo(enlace.id))s.compras.push({id:enlace.id,ingredienteId:enlace.ingredienteId});
  if(!nuevas.some(i=>nuevo(i.id)))return;
  const comprados=new Set(s.compras.map(i=>i.ingredienteId));
  for(const c of s.candidatos){
    if(s.invalidadas.includes(c.recetaId)||s.conseguidas.includes(c.recetaId)||!c.faltantes.every(id=>comprados.has(id)))continue;
    const receta=motor.recetario.get(c.recetaId),plan=despues.planes.find(p=>p.recetaId===c.recetaId);
    if(!receta||!plan||firma(receta,plan)!==c.firma)continue;
    if(!motor.disponibilidad(receta,antes).completa&&motor.disponibilidad(receta,despues).completa)s.conseguidas.push(c.recetaId);
  }
}
export function cancelarSesion(estado) {
  const s=estado.recompensas?.sesion;if(!s)return false;
  estado.recompensas.sesion=null;return true;
}
export function finalizarSesion(estado,motor,fecha=new Date().toISOString()) {
  const r=estado.recompensas??(estado.recompensas=recompensasVacias()),s=r.sesion;
  if(!s)throw new Error('No hay una jornada de compras en curso.');
  if(s.dia!==diaLocal(fecha)){
    r.sesion=null;
    return {monedas:0,recetas:[]};
  }
  if(r.movimientos.some(m=>m.tipo==='premio'&&m.dia===s.dia))throw new Error('Esta jornada ya recibió monedas.');
  const vigentes=enlaces(estado).filter(i=>i.completado),compras=new Set(s.compras.map(i=>i.id));
  const comprados=new Set(vigentes.filter(i=>compras.has(i.id)).map(i=>i.ingredienteId));
  const recetas=s.candidatos.filter(c=>{
    const receta=motor.recetario.get(c.recetaId),plan=estado.planes.find(p=>p.recetaId===c.recetaId);
    return s.conseguidas.includes(c.recetaId)&&!s.invalidadas.includes(c.recetaId)&&receta&&plan&&
      firma(receta,plan)===c.firma&&c.faltantes.every(id=>comprados.has(id))&&motor.disponibilidad(receta,estado).completa;
  });
  const monedas=monedasPorRecetas(recetas.length);
  if(monedas)r.movimientos.push({id:`premio:${s.id}`,tipo:'premio',monedas,fecha,dia:s.dia,recetaIds:recetas.map(c=>c.recetaId),nombres:recetas.map(c=>c.nombre)});
  r.sesion=null;
  return {monedas,recetas:recetas.map(c=>c.nombre)};
}
