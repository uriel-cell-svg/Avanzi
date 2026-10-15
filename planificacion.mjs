/** Cantidades, inventario y necesidades. Funciones locales sin DOM ni almacenamiento. */
import { gramosDeIngrediente } from './motor_avanzi.mjs';
export const VERSION_ESTADO = 3;
export const EPSILON = 1e-8;
export const copiar = (valor) => structuredClone(valor);
export function estadoVacio() {
  return { version: VERSION_ESTADO, inventario: [], planes: [], manuales: [], comprasRealizadas: [],
    transiciones: [], porRevisar: [] };
}
const limpiar = (n) => Math.round(n * 1e8) / 1e8;
const positivo = (n) => Number.isFinite(n) && n > 0;
const unidades = { unidades:'unidad', un:'unidad', gramos:'g', gr:'g', kilogramos:'kg', litros:'l', litro:'l', cucharada:'cucharadas', cucharaditas:'cucharadita', tazas:'taza' };
export const normalizarUnidad = (u) => unidades[u] || u;
export const claveCantidad = (id, estado, unidad) => `${id}|${estado}|${unidad}`;
export const estadoLinea = (linea) => linea.motivoExclusion === 'insumo_no_ingerido' && (linea.ingredienteId || linea.id) === 'te-negro'
  ? 'hebras' : (linea.noUsarValoresSecosParaCocidos === true || /cocido/.test(linea.estadoAlimento || '')) ? 'cocido' : 'base';

export function crearMotorCantidades(recetas, ingredientes, equivalencias = {}) {
  const catalogo = new Map(ingredientes.map(i => [i.id, i]));
  const recetario = new Map(recetas.map(r => [r.id, r]));
  // Dos entradas del paquete son medidas editoriales, no pesos de una unidad alimentaria.
  const pesoUnidad = id => ['carne-picada-vacuna', 'azucar-negra'].includes(id) ? undefined : equivalencias.pesoUnidadG?.[id];
  const unidadBase = (id, estado = 'base') => estado === 'hebras' ? 'cucharadas'
    : estado === 'cocido' ? 'g' : id === 'huevo' && positivo(pesoUnidad(id)) ? 'unidad'
    : catalogo.get(id)?.unidadPreferida === 'ml' && positivo(catalogo.get(id)?.densidadGPorMl) ? 'ml' : 'g';
  function canonizar(id, cantidad, unidad, estado = 'base') {
    const ficha = catalogo.get(id);
    if (!ficha) throw new Error('Ingrediente desconocido.');
    if (![ 'base', 'cocido', 'hebras' ].includes(estado)) throw new Error('Estado de alimento inválido.');
    unidad = normalizarUnidad(unidad);
    if (!['g','kg','ml','l','unidad','cucharadas','cucharadita','taza'].includes(unidad)) throw new Error('Unidad no admitida.');
    if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0)) throw new Error('La cantidad debe ser un número válido, mayor o igual a cero.');
    const base = unidadBase(id, estado);
    let cantidadFinal = cantidad, unidadFinal = unidad;
    if (cantidad === null) { unidadFinal = base; }
    else if (estado === 'hebras') {
      // El té seco no se convierte usando el perfil de té preparado ni los 0 g ingeridos.
      if (unidad === 'cucharadita') { cantidadFinal = cantidad / 3; unidadFinal = 'cucharadas'; }
    } else {
      let gramos = gramosDeIngrediente(cantidad, unidad, estado === 'cocido' ? {} : ficha);
      if (gramos === null && estado === 'base') {
        const peso = unidad === 'unidad' ? pesoUnidad(id)
          : unidad === 'taza' ? equivalencias.cupG?.[id]
          : unidad === 'cucharadita' ? equivalencias.tspG?.[id]
          : unidad === 'cucharadas' ? (equivalencias.tspG?.[id] ? equivalencias.tspG[id] * 3 : undefined) : undefined;
        if (positivo(peso)) gramos = cantidad * peso;
        if (gramos === null && positivo(ficha.densidadGPorMl)) {
          const ml = unidad === 'cucharadas' ? equivalencias.cucharadaMl
            : unidad === 'cucharadita' ? equivalencias.cucharaditaMl
            : unidad === 'taza' ? equivalencias.tazaVolumenMl : undefined;
          if (positivo(ml)) gramos = cantidad * ml * ficha.densidadGPorMl;
        }
      }
      if (gramos !== null) {
        cantidadFinal = base === 'unidad' ? gramos / pesoUnidad(id) : base === 'ml' ? gramos / ficha.densidadGPorMl : gramos;
        unidadFinal = base;
      } else if (unidad === 'l') { cantidadFinal = cantidad * 1000; unidadFinal = 'ml'; }
    }
    if (cantidadFinal !== null && !Number.isFinite(cantidadFinal)) throw new Error('La cantidad es demasiado grande.');
    return { ingredienteId:id, estado, cantidad:cantidadFinal === null ? null : limpiar(cantidadFinal), unidad:unidadFinal,
      clave:claveCantidad(id, estado, unidadFinal) };
  }
  function opcionesUnidades(id, estado = 'base') {
    if (estado === 'hebras') return ['cucharadas','cucharadita','g'];
    if (estado === 'cocido') return ['g','kg'];
    const ficha = catalogo.get(id);
    const opciones = [unidadBase(id), 'g','kg'];
    if (positivo(ficha?.densidadGPorMl)) opciones.push('ml','l');
    if (positivo(pesoUnidad(id))) opciones.push('unidad');
    if (positivo(equivalencias.tspG?.[id]) || positivo(ficha?.densidadGPorMl)) opciones.push('cucharadita','cucharadas');
    if (positivo(equivalencias.cupG?.[id]) || positivo(ficha?.densidadGPorMl)) opciones.push('taza');
    return [...new Set(opciones)];
  }
  function nombreCantidad(item) {
    let nombre = catalogo.get(item.ingredienteId)?.nombreEs || catalogo.get(item.ingredienteId)?.nombre || item.ingredienteId;
    if (item.estado === 'cocido') nombre = nombre.replace(/\s+secos?\b/i, '') + ' (cocidos)';
    if (item.estado === 'hebras') nombre = 'Té negro en hebras';
    return nombre;
  }
  function requerimientos(receta, porciones = receta.porciones, veces = 1) {
    if (!positivo(porciones) || !Number.isInteger(veces) || veces < 1 || veces > 100) throw new Error('Indicá porciones positivas y entre 1 y 100 preparaciones.');
    const factor = porciones / receta.porciones * veces;
    const grupos = new Map();
    for (const linea of receta.ingredientes) {
      const id = linea.ingredienteId || linea.id;
      const item = canonizar(id, Number.isFinite(linea.cantidad) ? linea.cantidad * factor : null, linea.unidad || unidadBase(id), estadoLinea(linea));
      const actual = grupos.get(item.clave);
      if (actual) { actual.cantidad = actual.cantidad === null || item.cantidad === null ? null : limpiar(actual.cantidad + item.cantidad); actual.lineas.push(linea); }
      else grupos.set(item.clave, {...item, nombre:nombreCantidad(item), lineas:[linea]});
    }
    return [...grupos.values()];
  }
  function requerimientosPlan(plan, soloElegidos = true) {
    const receta = recetario.get(plan.recetaId);
    if (!receta) return [];
    return requerimientos(receta,plan.porciones,plan.veces).filter(r => !soloElegidos || plan.ingredientes.some(i => i.clave === r.clave)).map(r => {
      const enlace = plan.ingredientes.find(i => i.clave === r.clave);
      return enlace?.cantidadBase !== undefined ? {...r, cantidad:limpiar(enlace.cantidadBase * plan.porciones / receta.porciones * plan.veces)} : r;
    });
  }
  const existencias = (estado, clave) => estado.inventario.find(i => i.clave === clave);
  const cantidadDisponible = (estado, clave) => existencias(estado,clave)?.cantidad ?? 0;
  function ajustarInventario(estado, id, cantidad, unidad, alimento = 'base', fecha = new Date().toISOString(), manual = true) {
    const item = canonizar(id, cantidad, unidad, alimento);
    const anterior = existencias(estado,item.clave);
    const revisionManual = (anterior?.revisionManual || 0) + (manual ? 1 : 0);
    estado.inventario = estado.inventario.filter(i => i.clave !== item.clave);
    // Se conserva cero y su revisión para que deshacer una compra no borre una edición manual.
    estado.inventario.push({...item, actualizadoEn:fecha, revisionManual});
    return item;
  }
  function quitarInventario(estado,id) {
    estado.inventario.filter(i => i.ingredienteId===id).forEach(i => ajustarInventario(estado,id,0,i.unidad,i.estado));
  }
  function agregarNecesidades(estado, recetaId, claves, porciones, veces = 1) {
    const receta=recetario.get(recetaId);
    if(!receta) throw new Error('La receta ya no existe.');
    let plan=estado.planes.find(p=>p.recetaId===recetaId);
    if(!plan) { plan={recetaId,porciones:porciones??receta.porciones,veces,ingredientes:[]}; estado.planes.push(plan); }
    if(porciones!==undefined) { plan.porciones=porciones;plan.veces=veces; }
    const permitidos=new Set(requerimientos(receta,plan.porciones,plan.veces).map(i=>i.clave));
    for(const clave of claves) {
      if(!permitidos.has(clave)) throw new Error('Ingrediente ajeno a la receta.');
      if(!plan.ingredientes.some(i=>i.clave===clave)) plan.ingredientes.push({clave});
    }
  }
  function cambiarPorciones(estado, recetaId, porciones, veces = 1) {
    const plan=estado.planes.find(p=>p.recetaId===recetaId);
    requerimientos(recetario.get(recetaId),porciones,veces);
    if(plan) {plan.porciones=porciones;plan.veces=veces;}
  }
  function quitarVinculo(estado, recetaId, clave) {
    const plan=estado.planes.find(p=>p.recetaId===recetaId);
    if(plan) plan.ingredientes=plan.ingredientes.filter(i=>i.clave!==clave);
    estado.planes=estado.planes.filter(p=>p.ingredientes.length);
  }
  function quitarReceta(estado,recetaId) { estado.planes=estado.planes.filter(p=>p.recetaId!==recetaId); }
  function editarNecesidad(estado,recetaId,clave,cantidad) {
    if(!positivo(cantidad)) throw new Error('La necesidad debe ser mayor que cero.');
    const plan=estado.planes.find(p=>p.recetaId===recetaId);
    const enlace=plan?.ingredientes.find(i=>i.clave===clave);
    if(!enlace) throw new Error('Esa asociación ya no existe.');
    enlace.cantidadBase=cantidad/(plan.porciones/recetario.get(recetaId).porciones*plan.veces);
  }
  function resumenCompras(estado) {
    const variantes=new Map();
    const sumar=(r,origen)=>{
      let grupo=variantes.get(r.clave);
      if(!grupo) {grupo={...r,total:0,desconocida:false,origenes:[]};variantes.set(r.clave,grupo);}
      if(r.cantidad===null) grupo.desconocida=true; else grupo.total=limpiar(grupo.total+r.cantidad);
      grupo.origenes.push(origen);
    };
    for(const p of estado.planes) for(const r of requerimientosPlan(p)) sumar(r,{recetaId:p.recetaId,nombre:recetario.get(p.recetaId).nombre,cantidad:r.cantidad});
    for(const r of estado.manuales) sumar(r,{recetaId:null,nombre:r.nombreOrigen||'Lista anterior',cantidad:r.cantidad,manualId:r.id});
    const grupos=new Map();
    for(const v of variantes.values()) {
      v.disponible=cantidadDisponible(estado,v.clave);
      v.sinCantidadConfirmada=existencias(estado,v.clave)?.cantidad===null;
      v.pendiente=limpiar(Math.max(0,v.total-v.disponible));
      v.completo=!v.desconocida && v.pendiente<=EPSILON;
      let g=grupos.get(v.ingredienteId);
      if(!g){g={id:v.ingredienteId,nombre:catalogo.get(v.ingredienteId).nombreEs||catalogo.get(v.ingredienteId).nombre,variantes:[]};grupos.set(v.ingredienteId,g);}
      g.variantes.push(v);
    }
    return [...grupos.values()].map(g=>({...g,completo:g.variantes.every(v=>v.completo)})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
  }
  function quitarCompra(estado,id) {
    for(const plan of estado.planes) plan.ingredientes=plan.ingredientes.filter(i=>!i.clave.startsWith(id+'|'));
    estado.planes=estado.planes.filter(p=>p.ingredientes.length);
    estado.manuales=estado.manuales.filter(i=>i.ingredienteId!==id);
    // La compra realizada y el inventario no se eliminan con una necesidad.
  }
  function confirmarCompra(estado, item, cantidad, unidad, operacionId, fecha = new Date().toISOString()) {
    if(estado.comprasRealizadas.some(x=>x.id===operacionId)) return false;
    if(!positivo(cantidad)) throw new Error('Indicá cuánto compraste, mayor que cero.');
    const comprada=canonizar(item.ingredienteId,cantidad,unidad,item.estado);
    if(comprada.clave!==item.clave) throw new Error('No hay una equivalencia fiable para sumar estas unidades.');
    const stock=existencias(estado,item.clave);
    if(stock?.cantidad===null) throw new Error('Confirmá primero la cantidad que ya tenés en Lo que tengo.');
    ajustarInventario(estado,item.ingredienteId,(stock?.cantidad||0)+comprada.cantidad,item.unidad,item.estado,fecha,false);
    estado.comprasRealizadas.push({id:operacionId,clave:item.clave,ingredienteId:item.ingredienteId,estado:item.estado,
      cantidad:comprada.cantidad,unidad:item.unidad,fecha,revisionManual:stock?.revisionManual||0,deshecha:false});
    return true;
  }
  function deshacerCompra(estado,id) {
    const compra=estado.comprasRealizadas.find(x=>x.id===id);
    if(!compra || compra.deshecha) return false;
    const actual=existencias(estado,compra.clave);
    if(actual && (actual.revisionManual||0)===compra.revisionManual) ajustarInventario(estado,compra.ingredienteId,Math.max(0,(actual.cantidad||0)-compra.cantidad),compra.unidad,compra.estado,undefined,false);
    compra.deshecha=true;
    return true;
  }
  function disponibilidad(receta, estado, porciones = receta.porciones, veces = 1, reservarPlan = true) {
    const plan=estado.planes.find(p=>p.recetaId===receta.id);
    const requeridos=requerimientos(receta,plan?.porciones??porciones,plan?.veces??veces);
    const reservado=new Map();
    // Orden de incorporación explícito: una existencia no se asigna a dos recetas planeadas.
    if(reservarPlan && plan) {
      for(const anterior of estado.planes) {
        if(anterior.recetaId===receta.id)break;
        for(const r of requerimientos(recetario.get(anterior.recetaId),anterior.porciones,anterior.veces)) reservado.set(r.clave,(reservado.get(r.clave)||0)+(r.cantidad||0));
      }
    }
    const lineas=requeridos.map(r=>{
      const real=cantidadDisponible(estado,r.clave);
      const disponible=Math.max(0,real-(reservado.get(r.clave)||0));
      const pendiente=r.cantidad===null?null:limpiar(Math.max(0,r.cantidad-disponible));
      return {...r,disponible,real,reservado:reservado.get(r.clave)||0,pendiente,
        desconocida:r.cantidad===null || existencias(estado,r.clave)?.cantidad===null,completo:r.cantidad!==null&&pendiente<=EPSILON};
    });
    const faltantes=lineas.filter(i=>!i.completo);
    return {lineas,faltantes,completa:!faltantes.length,estado:!faltantes.length?'suficiente':lineas.some(i=>i.disponible>0)?'parcial':'sin-ingredientes'};
  }
  function posibilidades(estado) {
    const futuro=copiar(estado);
    for(const g of resumenCompras(estado))for(const v of g.variantes)if(!v.desconocida && v.pendiente>EPSILON && !v.sinCantidadConfirmada) ajustarInventario(futuro,v.ingredienteId,v.disponible+v.pendiente,v.unidad,v.estado,undefined,false);
    return recetas.filter(r=>!disponibilidad(r,estado).completa && disponibilidad(r,futuro).completa);
  }
  function detectarTransiciones(antes,despues,fecha = new Date().toISOString()) {
    const registradas=new Set(despues.transiciones.map(t=>t.recetaId));
    const nuevas=recetas.filter(r=>!registradas.has(r.id) && !disponibilidad(r,antes).completa && disponibilidad(r,despues).completa)
      .map(r=>({id:`disponible:${r.id}`,recetaId:r.id,fecha,tipo:'ingredientes_suficientes'}));
    despues.transiciones.push(...nuevas);
    return nuevas;
  }
  return {catalogo,recetario,canonizar,unidadBase,opcionesUnidades,nombreCantidad,requerimientos,requerimientosPlan,existencias,cantidadDisponible,
    ajustarInventario,quitarInventario,agregarNecesidades,cambiarPorciones,quitarVinculo,quitarReceta,editarNecesidad,resumenCompras,quitarCompra,
    confirmarCompra,deshacerCompra,disponibilidad,posibilidades,detectarTransiciones};
}
/** Retira un plan sin perder sus necesidades ni las compras ya confirmadas. No guarda. */
export function separarNecesidadesReceta(estado,receta,motor) {
  const copia=copiar(estado),plan=copia.planes.find(p=>p.recetaId===receta.id);
  if(!plan)return copia;
  for(const necesidad of motor.requerimientosPlan(plan)){
    copia.manuales.push({
      ...motor.canonizar(necesidad.ingredienteId,necesidad.cantidad,necesidad.unidad,necesidad.estado),
      id:`receta-retirada:${receta.id}:${necesidad.clave}`,
      nombreOrigen:`Receta anterior: ${receta.nombre}`
    });
  }
  copia.planes=copia.planes.filter(p=>p.recetaId!==receta.id);
  return copia;
}
export function cantidadLegible(cantidad, unidad) {
  if(cantidad===null || !Number.isFinite(cantidad)) return 'Cantidad por confirmar';
  let valor=cantidad,medida=unidad;
  if(unidad==='g' && cantidad>=1000) {valor=cantidad/1000;medida='kg';}
  if(unidad==='ml' && cantidad>=1000) {valor=cantidad/1000;medida='l';}
  if(medida==='unidad')medida=Math.abs(cantidad-1)<EPSILON?'unidad':'unidades';
  const redondeado=Number(valor.toFixed(2));
  const marca=Math.abs(redondeado-valor)>EPSILON?'≈ ':'';
  if(valor>0&&redondeado===0)return `< 0,01 ${medida}`;
  return `${marca}${valor.toLocaleString('es-AR',{maximumFractionDigits:2})} ${medida}`;
}
