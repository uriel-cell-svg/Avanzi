/** Avanzi: motor unificado local, sin red ni APIs. Datos por 100 g de porcion comestible. */
export const CATEGORIAS_RECETA = ['todas', 'rapidas', 'veggie', 'pastas', 'carnes', 'desayunos'];
export const CATEGORIAS_INGREDIENTE = ['legumbres', 'cereales', 'verduras', 'frutas', 'carnes', 'otros'];
const CAMPOS = ['kcal', 'proteinasG', 'carbohidratosG', 'grasasG'];
const REDONDEAR = n => Math.round((n + Number.EPSILON) * 10) / 10;

/** Estos perfiles de legumbres cocidas proceden de la calculadora de las 39 recetas;
 * no sustituirlos por la ficha para legumbres secas. Revisar fuente antes de publicar. */
const PERFILES_COCIDOS = Object.freeze({
  garbanzos_cocidos: {kcal:164, proteinasG:8.86, carbohidratosG:27.42, grasasG:2.59},
  porotos_cocidos: {kcal:127, proteinasG:8.67, carbohidratosG:22.8, grasasG:0.5}
});

export function gramosAMililitros(gramos, densidadGPorMl) {
  if (!Number.isFinite(gramos) || gramos < 0 || !Number.isFinite(densidadGPorMl) || densidadGPorMl <= 0) return null;
  return gramos / densidadGPorMl;
}
export function mililitrosAGramos(ml, densidadGPorMl) {
  if (!Number.isFinite(ml) || ml < 0 || !Number.isFinite(densidadGPorMl) || densidadGPorMl <= 0) return null;
  return ml * densidadGPorMl;
}
export function mostrarCantidad(cantidad, unidad, ingrediente) {
  if (!Number.isFinite(cantidad)) return 'Cantidad a confirmar';
  if (unidad === 'g' && ingrediente?.unidadPreferida === 'ml' && ingrediente?.densidadGPorMl) {
    const ml=gramosAMililitros(cantidad, ingrediente.densidadGPorMl);
    return ml==null ? 'Cantidad a confirmar' : `${Math.round(ml)} ml aprox.`;
  }
  return `${cantidad} ${unidad ?? ''}`.trim();
}
export function gramosDeIngrediente(cantidad, unidad, ingrediente) {
  if (!Number.isFinite(cantidad) || cantidad < 0) return null;
  if (unidad === 'g') return cantidad;
  if (unidad === 'kg') return cantidad * 1000;
  if (unidad === 'ml') return ingrediente?.densidadGPorMl ? mililitrosAGramos(cantidad, ingrediente.densidadGPorMl) : null;
  if (unidad === 'l') return ingrediente?.densidadGPorMl ? mililitrosAGramos(cantidad*1000, ingrediente.densidadGPorMl) : null;
  return null; // No inferir huevos, tazas ni cucharadas sin equivalencia específica.
}
function esPerfilValido(perfil) {
  return !!perfil && CAMPOS.every(c => Number.isFinite(perfil[c]) && perfil[c]>=0);
}
function catalogoIndice(ingredientesCatalogo) {
  if (Array.isArray(ingredientesCatalogo)) return new Map(ingredientesCatalogo.map(i=>[i.id,i]));
  if (ingredientesCatalogo?.ingredientes && Array.isArray(ingredientesCatalogo.ingredientes)) return catalogoIndice(ingredientesCatalogo.ingredientes);
  if (ingredientesCatalogo && typeof ingredientesCatalogo==='object') return new Map(Object.entries(ingredientesCatalogo));
  return new Map();
}

/** Motor canónico: nunca convierte valores desconocidos en cero.
 * Devuelve total válido solo para ingredientes calculables; si hay pendientes,
 * es subtotal, NO nutrición completa. No se entrega porPorcion si está incompleto.
 */
export function calcularNutrientes(receta, ingredientesCatalogo) {
  const indice = catalogoIndice(ingredientesCatalogo);
  const totales = {kcal:0, proteinasG:0, carbohidratosG:0, grasasG:0};
  const pendientes=[];
  for (const [pos,linea] of (receta?.ingredientes ?? []).entries()) {
    const id=linea?.ingredienteId ?? linea?.id;
    if (linea?.incluidoEnCalculo === false) {
      // Insumos no ingeridos (ej.: hojas de té coladas) no son ingredientes nutricionales.
      // Omitir otros ingredientes obligatorios sigue dejando la receta incompleta.
      if (linea.esOpcional !== true && linea.motivoExclusion !== 'insumo_no_ingerido') {
        pendientes.push({pos,id,motivo:'excluido_del_calculo'});
      }
      continue;
    }
    const ingrediente=indice.get(id);
    if (!ingrediente) { pendientes.push({pos,id,motivo:'ingrediente_desconocido'}); continue; }
    const gramos = Number.isFinite(linea.gramosComestibles)
      ? linea.gramosComestibles
      : gramosDeIngrediente(linea.cantidad,linea.unidad,ingrediente);
    if (gramos===null || !Number.isFinite(gramos) || gramos<0) {
      pendientes.push({pos,id,motivo:'peso_desconocido'}); continue;
    }
    const perfil = linea.perfilNutricionalUsado && Object.hasOwn(PERFILES_COCIDOS,linea.perfilNutricionalUsado)
      ? PERFILES_COCIDOS[linea.perfilNutricionalUsado]
      : ingrediente.por100g;
    if (linea.noUsarValoresSecosParaCocidos === true && !Object.hasOwn(PERFILES_COCIDOS,linea.perfilNutricionalUsado ?? '')) {
      pendientes.push({pos,id,motivo:'requiere_perfil_cocido'}); continue;
    }
    if (!esPerfilValido(perfil)) { pendientes.push({pos,id,motivo:'perfil_nutricional_incompleto'}); continue; }
    for (const campo of CAMPOS) totales[campo]+=perfil[campo]*gramos/100;
  }
  const porciones=receta?.porciones;
  if (!Number.isFinite(porciones) || porciones<=0) pendientes.push({pos:null,id:'porciones',motivo:'porciones_sin_definir'});
  if (!Array.isArray(receta?.ingredientes) || receta.ingredientes.length===0) pendientes.push({pos:null,id:'ingredientes',motivo:'sin_ingredientes'});
  const completo = pendientes.length===0;
  return {
    completo, estado:completo?'estimacion':'parcial',
    total:Object.fromEntries(CAMPOS.map(c=>[c,REDONDEAR(totales[c])])),
    totalEsParcial:pendientes.some(x=>x.id!=='porciones'),
    porPorcion:completo?Object.fromEntries(CAMPOS.map(c=>[c,REDONDEAR(totales[c]/porciones)])):null,
    pendientes,
    advertencia:completo?'Valor nutricional aproximado':'Cálculo incompleto: no mostrar subtotales como resultados definitivos'
  };
}

/** Adaptador opcional para código existente que usaba calcularReceta. */
export function calcularReceta(receta, ingredientesPorId) {
  const res=calcularNutrientes(receta,ingredientesPorId);
  return {estado:res.estado,excluidos:res.pendientes.map(p=>p.id),total:res.total,porPorcion:res.porPorcion,
          completo:res.completo,pendientes:res.pendientes,totalEsParcial:res.totalEsParcial};
}

/** Clasificación automática conservadora para nuevas recetas.
 * No sobrescribir etiquetas editoriales existentes sin aprobación del usuario.
 */
export function clasificarReceta(receta, ingredientesCatalogo) {
  const indice=catalogoIndice(ingredientesCatalogo);
  const filas=(receta?.ingredientes??[]).map(x=>indice.get(x.ingredienteId??x.id));
  const categorias=[];
  const total=receta?.tiempoTotalMinutos ?? receta?.tiempoMinutos;
  if (Number.isFinite(total) && total<20 && total>=0) categorias.push('rapidas');
  if (filas.length>0 && filas.every(x=>x && x.esDeOrigenAnimal===false)) categorias.push('veggie');
  if (filas.some(x=>x && (x.esPasta === true || (x.esPasta !== false && /(?:^pasta-seca$|^fideos(?:-huevo)?$|espagueti|mostaccioli)/i.test(x.id))))) categorias.push('pastas');
  if (filas.some(x=>x && x.grupo==='carnes')) categorias.push('carnes');
  if (receta?.esDesayuno===true || (receta?.categorias??[]).includes('desayunos')) categorias.push('desayunos');
  return categorias;
}
