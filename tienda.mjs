import {saldoMonedas,recompensasVacias} from './recompensas.mjs';

export const tiendaVacia=()=>({version:1,real:{ids:[],activa:null},demo:{ids:[],activa:null}});
export const modoDesdePerfil=(perfil,config)=>config?.modoPruebaDisponible===true&&perfil?.nombre==='admin'?'demo':'real';
export function validarCatalogoMascotas(datos){
  const mascotas=datos?.mascotas,ids=new Set();
  if(!Array.isArray(mascotas)||mascotas.length!==4)throw new Error('Catálogo de mascotas inválido.');
  for(const m of mascotas){
    if(!m||typeof m.id!=='string'||!/^[a-z-]+$/.test(m.id)||ids.has(m.id)||
      typeof m.nombre!=='string'||!m.nombre||!Number.isInteger(m.precio)||m.precio<=0||
      typeof m.imagen!=='string'||!/^\.\/imagenes\/mascotas\/[a-z-]+\.svg$/.test(m.imagen))throw new Error('Mascota inválida.');
    ids.add(m.id);
  }
  return mascotas;
}
export function validarTienda(entrada,recompensas){
  if(entrada===undefined)entrada=tiendaVacia();
  if(!entrada||entrada.version!==1)throw new Error('Tienda guardada inválida.');
  for(const modo of ['real','demo']){
    const datos=entrada[modo];
    if(!datos||!Array.isArray(datos.ids)||datos.ids.some(id=>typeof id!=='string'||!id)||
      new Set(datos.ids).size!==datos.ids.length||
      (datos.activa!==null&&!datos.ids.includes(datos.activa)))throw new Error('Mascotas guardadas inválidas.');
    const canjes=(modo==='real'?recompensas.movimientos:recompensas.movimientosDemo).filter(m=>m.tipo==='canje');
    if(canjes.length!==datos.ids.length||canjes.some(m=>!datos.ids.includes(m.mascotaId))||
      new Set(canjes.map(m=>m.mascotaId)).size!==canjes.length)throw new Error('Compras de mascotas inconsistentes.');
    if(saldoMonedas({recompensas},modo)<0)throw new Error('Saldo de monedas inválido.');
  }
  return entrada;
}
export function comprarMascota(estado,mascota,modo='real',fecha=new Date().toISOString()){
  if(!['real','demo'].includes(modo)||!mascota||!Number.isInteger(mascota.precio)||mascota.precio<=0)throw new Error('Mascota inválida.');
  const tienda=estado.tienda??(estado.tienda=tiendaVacia());
  estado.recompensas??=recompensasVacias();
  const propia=tienda[modo];
  if(propia.ids.includes(mascota.id))throw new Error('Ya tenés esta mascota.');
  if(saldoMonedas(estado,modo)<mascota.precio)throw new Error('No tenés monedas suficientes.');
  const movimientos=estado.recompensas[modo==='demo'?'movimientosDemo':'movimientos'];
  const id=`canje:${modo}:${mascota.id}`;
  if(movimientos.some(m=>m.id===id))throw new Error('Esta compra ya fue registrada.');
  movimientos.push({id,tipo:'canje',mascotaId:mascota.id,monedas:-mascota.precio,fecha,dia:fecha.slice(0,10)});
  propia.ids.push(mascota.id);
  return saldoMonedas(estado,modo);
}
export function elegirMascota(estado,id,modo='real'){
  const propia=(estado.tienda??(estado.tienda=tiendaVacia()))[modo];
  if(!propia||(id!==null&&!propia.ids.includes(id)))throw new Error('Primero desbloqueá esta mascota.');
  propia.activa=id;
}
