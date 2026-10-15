/** Contrato del catálogo público y adaptación de metadatos para la interfaz. */
import {CATEGORIAS_INGREDIENTE} from './motor_avanzi.mjs';

const GRUPOS={legumbres:'Legumbres',cereales:'Cereales',verduras:'Verduras',frutas:'Frutas',carnes:'Carnes',otros:'Otros'};
export const CATEGORIAS=Object.values(GRUPOS);
const texto=x=>typeof x==='string'&&x.trim().length>0;
const rutaImagen=x=>typeof x==='string'&&/^(?:\.\/)?imagenes\/[a-z0-9/-]+\.(?:svg|webp|png|jpg)$/.test(x)&&!x.includes('..');
const tiempo=r=>r.tiempoTotalMinutos??r.tiempoMinutos??null;

export function validarRecetas(datos) {
  datos=Array.isArray(datos)?datos:datos?.recetas;
  if(!Array.isArray(datos)||!datos.length)throw new Error('No hay recetas válidas.');
  const ids=new Set();
  for(const r of datos){
    if(!r||!texto(r.id)||ids.has(r.id)||!texto(r.nombre)||!Number.isInteger(r.porciones)||r.porciones<=0||
      (tiempo(r)!==null&&(!Number.isFinite(tiempo(r))||tiempo(r)<=0))||!Array.isArray(r.ingredientes)||!r.ingredientes.length||!Array.isArray(r.pasos)||!r.pasos.length||!r.pasos.every(texto))throw new Error('Formato de receta inválido.');
    ids.add(r.id);
    if(Object.hasOwn(r,'datosDePrueba')&&typeof r.datosDePrueba!=='boolean')throw new Error(`datosDePrueba de «${r.nombre}» debe ser true o false, o no incluirse.`);
    if(r.imagen!==undefined&&(!r.imagen||!rutaImagen(r.imagen.ruta)))throw new Error(`Imagen local inválida: ${r.nombre}.`);
    for(const i of r.ingredientes)if(!i||!texto(i.ingredienteId||i.id)||(!Number.isFinite(i.cantidad)||i.cantidad<=0)||!texto(i.unidad))throw new Error(`Cantidad o ingrediente inválido en «${r.nombre}».`);
  }
  return datos;
}
export function validarIngredientes(datos,recetas) {
  datos=Array.isArray(datos)?datos:datos?.ingredientes;
  if(!Array.isArray(datos)||!datos.length)throw new Error('Catálogo de ingredientes vacío.');
  const ids=new Set();
  for(const i of datos){
    if(!i||!texto(i.id)||ids.has(i.id)||!texto(i.nombreEs||i.nombre)||!CATEGORIAS_INGREDIENTE.includes(i.grupo)||
      (i.dibujo!==undefined&&(typeof i.dibujo!=='string'||!/^\.\/imagenes\/despensa\/[a-z0-9-]+\.svg$/.test(i.dibujo))))throw new Error('Metadatos de ingredientes inválidos.');
    if(i.densidadGPorMl!=null&&(!Number.isFinite(i.densidadGPorMl)||i.densidadGPorMl<=0))throw new Error('Densidad inválida.');
    if(i.por100g!=null)for(const campo of ['kcal','proteinasG','carbohidratosG','grasasG'])if(i.por100g[campo]!=null&&(!Number.isFinite(i.por100g[campo])||i.por100g[campo]<0))throw new Error('Perfil nutricional inválido.');
    ids.add(i.id);
  }
  for(const r of recetas)for(const i of r.ingredientes)if(!ids.has(i.ingredienteId||i.id))throw new Error(`Faltan metadatos del ingrediente ${i.ingredienteId||i.id}.`);
  return datos;
}
export function prepararIngredientes(ingredientes,compat) {
  if(!compat?.dibujos||!compat.clasificacion)throw new Error('Referencias locales inválidas.');
  return ingredientes.map(i=>({...i,...compat.clasificacion[i.id],nombre:i.nombreEs||i.nombre,
    categoria:GRUPOS[compat.clasificacion[i.id]?.grupo||i.grupo],dibujo:compat.dibujos[i.id]??i.dibujo}))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
}
