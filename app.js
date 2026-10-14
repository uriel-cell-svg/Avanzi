'use strict';

const CLAVE_DESPENSA = 'que-cocino.despensa.v1';
const CLAVE_COMPRAS = 'que-cocino.compras.v1';
let compras = new Map();
let estadosCompras = new Map();
let comprasGuardadas = null;
let despensaGuardada = null;
const esComprado = (id) => estadosCompras.get(id)?.comprado === true;
const comprasPendientes = () => [...compras.keys()].filter((id) => !esComprado(id));
const comprasPendientesIncluyen = (id) => compras.has(id) && !esComprado(id);

function serializarCompras() {
  return [...compras].map(([id, origenes]) => ({ id, recetas: [...origenes],
    comprado: esComprado(id), incorporadoPorCompra: estadosCompras.get(id)?.incorporadoPorCompra === true }));
}

function mismaSeleccion(a, b) {
  const conocidos = new Set(ingredientes.map((i) => i.id));
  const uno = new Set(a.filter((id) => conocidos.has(id)));
  const otro = new Set(b.filter((id) => conocidos.has(id)));
  return uno.size === otro.size && [...uno].every((id) => otro.has(id));
}

function validarItemsCompras(items) {
  if (!Array.isArray(items)) throw new Error('Lista inválida.');
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) || !Array.isArray(item.recetas) ||
        !item.recetas.every((id) => typeof id === 'string') ||
        (Object.prototype.hasOwnProperty.call(item, 'comprado') && typeof item.comprado !== 'boolean') ||
        (Object.prototype.hasOwnProperty.call(item, 'incorporadoPorCompra') && typeof item.incorporadoPorCompra !== 'boolean') ||
        (item.incorporadoPorCompra === true && item.comprado !== true)) throw new Error('Lista inválida.');
    ids.add(item.id);
  }
  return items;
}

// El registro provisional conserva ambas versiones hasta confirmar la despensa.
function guardarEstadoCoordinado() {
  if (comprasGuardadas === null || despensaGuardada === null) {
    avisoCompras('Cambios temporales: no podemos coordinar el guardado porque no se recuperaron los datos anteriores. Recargá para reintentar.');
    return false;
  }
  const destino = serializarCompras();
  const operacion = { despensaAntes: [...despensaGuardada], despensaDespues: [...despensa], itemsDespues: destino };
  try {
    localStorage.setItem(CLAVE_COMPRAS, JSON.stringify({ version: 2, items: comprasGuardadas, operacion }));
  } catch {
    avisoCompras('Cambios solo en esta sesión: no se pudo guardar la operación. La despensa y la lista guardadas siguen iguales.');
    return false;
  }
  if (!guardarDespensa()) return false;
  // Aunque falle la última escritura, el registro provisional recupera este estado.
  comprasGuardadas = destino;
  try {
    localStorage.setItem(CLAVE_COMPRAS, JSON.stringify({ version: 2, items: destino }));
    comprasRequierenDespensa = false;
    avisoCompras('');
    return true;
  } catch {
    avisoCompras('La despensa quedó guardada. La lista se recuperará desde la operación pendiente al recargar; no pudimos finalizar su guardado.');
    return false;
  }
}
// Una retirada temporal no puede persistirse antes que su disponibilidad.
let comprasRequierenDespensa = false;
let recetaDetalle = null;
let recetaOrigenDetalle = null;
const $ = (id) => document.getElementById(id);
let recetas = [];
let ingredientes = [];
let despensa = new Set();
let botonDetalle = null;
const CATEGORIAS = ['Verduras', 'Frutas', 'Carnes y pescados', 'Huevos y lácteos', 'Legumbres', 'Cereales y derivados', 'Aceites y condimentos'];

function validarIngredientes(datos) {
  if (!Array.isArray(datos) || !datos.length) throw new Error('Catálogo vacío.');
  const ids = new Set();
  for (const ingrediente of datos) {
    if (!ingrediente || typeof ingrediente.id !== 'string' || !ingrediente.id.trim() || ids.has(ingrediente.id) ||
        typeof ingrediente.nombre !== 'string' || !ingrediente.nombre.trim() || !CATEGORIAS.includes(ingrediente.categoria) ||
        typeof ingrediente.dibujo !== 'string' || !/^\.\/imagenes\/despensa\/[a-z0-9-]+\.svg$/.test(ingrediente.dibujo)) {
      throw new Error('Metadatos inválidos.');
    }
    ids.add(ingrediente.id);
  }
  for (const receta of recetas) {
    for (const ingrediente of receta.ingredientes) {
      if (!ids.has(ingrediente.id)) throw new Error('Ingrediente sin metadatos.');
    }
  }
  return datos;
}

function prepararCategorias() {
  for (const categoria of CATEGORIAS) {
    if (!ingredientes.some((ingrediente) => ingrediente.categoria === categoria)) continue;
    const opcion = elemento('option', categoria);
    opcion.value = categoria;
    $('categoria').append(opcion);
  }
}

const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
const unicos = (receta) => [...new Map(receta.ingredientes.map((ingrediente) => [ingrediente.id, ingrediente])).values()];
const faltantes = (receta) => unicos(receta).filter((ingrediente) => !despensa.has(ingrediente.id));

// Todos los textos del JSON se insertan como texto, nunca como HTML.
function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}

function validarRecetas(datos) {
  if (!Array.isArray(datos) || datos.length === 0) throw new Error('No hay recetas válidas.');
  const ids = new Set();
  const nombres = new Map();
  const texto = (valor) => typeof valor === 'string' && valor.trim().length > 0;
  for (const receta of datos) {
    if (!receta || !texto(receta.id) || ids.has(receta.id) || !texto(receta.nombre) ||
        !Number.isInteger(receta.porciones) || receta.porciones <= 0 || !Number.isFinite(receta.tiempoMinutos) || receta.tiempoMinutos <= 0 ||
        !Array.isArray(receta.ingredientes) || !receta.ingredientes.length || !Array.isArray(receta.pasos) || !receta.pasos.length || !receta.pasos.every(texto)) {
      throw new Error('Formato de receta inválido.');
    }
    if (Object.prototype.hasOwnProperty.call(receta, 'datosDePrueba') && typeof receta.datosDePrueba !== 'boolean') {
      const error = new Error(`El campo datosDePrueba de la receta «${receta.nombre}» debe ser true o false, o no incluirse.`);
      error.campo = 'datosDePrueba';
      throw error;
    }
    ids.add(receta.id);
    const idsIngredientes = new Set();
    for (const ingrediente of receta.ingredientes) {
      if (!ingrediente || !texto(ingrediente.id) || !texto(ingrediente.nombre) ||
          !Number.isFinite(ingrediente.cantidad) || ingrediente.cantidad <= 0 || !texto(ingrediente.unidad) ||
          (nombres.has(ingrediente.id) && nombres.get(ingrediente.id) !== ingrediente.nombre)) {
        throw new Error('Formato de ingrediente inválido.');
      }
      idsIngredientes.add(ingrediente.id);
      nombres.set(ingrediente.id, ingrediente.nombre);
    }
  }
  return datos;
}

function avisarGuardado(mensaje) {
  for (const id of ['aviso-guardado', 'error-despensa-detalle', 'error-despensa-panel']) {
    $(id).textContent = mensaje;
    $(id).hidden = !mensaje;
    if (mensaje && $(id).closest('dialog')?.open) $(id).scrollIntoView({ block: 'nearest' });
  }
}

function recuperarDespensa() {
  try {
    const guardado = localStorage.getItem(CLAVE_DESPENSA);
    if (guardado === null) { despensaGuardada = new Set(); return; }
    const datos = JSON.parse(guardado);
    const conocidos = new Set(ingredientes.map((ingrediente) => ingrediente.id));
    if (!Array.isArray(datos) || !datos.every((id) => typeof id === 'string')) {
      throw new Error('Selección inválida.');
    }
    const vigentes = datos.filter((id) => conocidos.has(id));
    despensa = new Set(vigentes);
    despensaGuardada = new Set(vigentes);
    if (vigentes.length !== datos.length) {
      const guardada = guardarDespensa();
      const aviso = 'Se descartaron ingredientes antiguos de la despensa; tu selección vigente se conservó.';
      avisarGuardado(guardada ? aviso : `${aviso} No pudimos guardar esta limpieza; los datos almacenados anteriores se conservan.`);
    }
  } catch {
    despensa = new Set();
    avisarGuardado('No pudimos recuperar la despensa guardada. Empezamos con una selección vacía; podés seguir usando la app.');
  }
}

function guardarDespensa() {
  try {
    // [] es una selección válida: desmarcar todo también debe persistir.
    localStorage.setItem(CLAVE_DESPENSA, JSON.stringify([...despensa]));
    despensaGuardada = new Set(despensa);
    avisarGuardado('');
    return true;
  } catch {
    avisarGuardado('Cambio aplicado solo en esta sesión: no pudimos guardar la despensa. La selección guardada no cambió y la operación de compras conserva el estado anterior para recuperarlo al recargar. Al recargar volverán los datos anteriores.');
    return false;
  }
}

function mostrarDespensa() {
  $('ingredientes').replaceChildren();
  const categoria = $('categoria').value;
  const consulta = normalizar($('buscar-ingredientes').value.trim());
  const visibles = ingredientes.filter((ingrediente) => (categoria === 'Todos' || ingrediente.categoria === categoria) && normalizar(ingrediente.nombre).includes(consulta));
  $('cantidad-visible').textContent = `${visibles.length} ingredientes visibles de ${ingredientes.length} en total`;
  for (const ingrediente of visibles) {
    const etiqueta = elemento('label', undefined, 'ingrediente');
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.value = ingrediente.id;
    casilla.checked = despensa.has(ingrediente.id);
    casilla.addEventListener('change', () => {
      cambiarDisponible(ingrediente.id, casilla.checked);
    });
    const dibujo = document.createElement('img');
    dibujo.src = ingrediente.dibujo;
    dibujo.alt = '';
    dibujo.width = 36;
    dibujo.height = 42;
    etiqueta.append(casilla, dibujo, elemento('span', ingrediente.nombre));
    $('ingredientes').append(etiqueta);
  }
}

function compararRecetas(a, b) {
  return faltantes(a).length - faltantes(b).length || a.tiempoMinutos - b.tiempoMinutos || a.nombre.localeCompare(b.nombre, 'es');
}

function mostrarRecetas() {
  const consulta = normalizar($('busqueda').value.trim());
  const filtro = $('filtro').value;
  const visibles = recetas.filter((receta) => {
    const coincide = normalizar(receta.nombre).includes(consulta) || receta.ingredientes.some((ingrediente) => normalizar(ingrediente.nombre).includes(consulta));
    const completa = faltantes(receta).length === 0;
    return coincide && (filtro === 'todas' || (filtro === 'completas' && completa) || (filtro === 'faltantes' && !completa));
  }).sort(compararRecetas);
  $('resultados').textContent = `${visibles.length} de ${recetas.length} recetas${recetas.every((receta) => receta.datosDePrueba === true) ? ' de prueba' : ''}`;
  $('lista-recetas').replaceChildren();
  const grupos = [
    ['Ya tenés todo, ¡a cocinar!', (n) => n === 0],
    ['Ya casi', (n) => n >= 1 && n <= 3],
    ['Con algunas compras más', (n) => n > 3]
  ];
  grupos.forEach(([nombre, incluye], indice) => {
    const grupo = elemento('section', undefined, 'grupo-recetas');
    grupo.dataset.grupo = indice;
    const items = visibles.filter((receta) => incluye(faltantes(receta).length));
    const titulo = elemento('h3', `${nombre} · ${items.length}`);
    titulo.id = `grupo-${indice}`;
    grupo.setAttribute('aria-labelledby', titulo.id);
    grupo.append(titulo);
    const lista = elemento('div', undefined, 'tarjetas');
    if (!items.length) lista.append(elemento('p', 'No hay recetas en esta sección con tu despensa y los filtros actuales.', 'vacio'));
    items.forEach((receta) => lista.append(tarjetaReceta(receta)));
    grupo.append(lista);
    $('lista-recetas').append(grupo);
  });
}

function tarjetaReceta(receta) {
  const pendientes = faltantes(receta);
  const tarjeta = elemento('article', undefined, `tarjeta ${pendientes.length ? 'incompleta' : 'completa'}`);
  tarjeta.dataset.receta = receta.id;
  const figura = elemento('figure', undefined, 'visual-receta');
  const imagen = document.createElement('img');
  imagen.src = `./imagenes/${receta.id}.svg`;
  imagen.alt = '';
  imagen.loading = 'lazy';
  if (pendientes.length) figura.append(elemento('span', textoFaltantes(pendientes.length), 'franja-faltantes'));
  figura.append(imagen);
  tarjeta.append(figura);
  if (!pendientes.length) tarjeta.append(elemento('span', 'Tenés todo', 'etiqueta'));
  tarjeta.append(elemento('h4', receta.nombre), elemento('p', `${receta.tiempoMinutos} min · ${receta.porciones} porciones${receta.datosDePrueba === true ? ' · Datos de prueba' : ''}`, 'meta'),
    elemento('p', pendientes.length ? `Te falta: ${pendientes.map((i) => i.nombre).join(', ')}.` : 'Tenés todos los ingredientes. Revisá las cantidades en el detalle.', 'faltantes'));
  const boton = elemento('button', 'Ver preparación');
  boton.type = 'button';
  boton.setAttribute('aria-label', `Ver preparación: ${receta.nombre}`);
  boton.addEventListener('click', () => { botonDetalle = boton; mostrarDetalle(receta); });
  tarjeta.append(boton);
  return tarjeta;
}

function textoFaltantes(n) {
  return n === 1 ? 'Falta 1 ingrediente' : `Faltan ${n} ingredientes`;
}

function cambiarSeccion(seccion) {
  for (const nombre of ['despensa', 'recetas']) {
    $(nombre).hidden = nombre !== seccion;
    $(`tab-${nombre}`).setAttribute('aria-pressed', String(nombre === seccion));
  }
}

function boton(texto, accion, clase = 'secundario') {
  const nodo = elemento('button', texto, clase);
  nodo.type = 'button';
  nodo.addEventListener('click', accion);
  return nodo;
}

function avisoCompras(mensaje) {
  for (const id of ['aviso-compras', 'error-compras-panel', 'error-compras-detalle']) {
    $(id).textContent = mensaje;
    $(id).hidden = !mensaje;
    if (mensaje && $(id).closest('dialog')?.open) $(id).scrollIntoView({ block: 'nearest' });
  }
}

function guardarCompras() {
  if (comprasRequierenDespensa) return guardarEstadoCoordinado();
  try {
    const items = serializarCompras();
    localStorage.setItem(CLAVE_COMPRAS, JSON.stringify({ version: 2, items }));
    comprasGuardadas = items;
    avisoCompras('');
    return true;
  } catch {
    avisoCompras('Los cambios de compras son temporales: no pudimos guardar la lista. Al recargar se recuperarán los datos guardados anteriores.');
    return false;
  }
}

function recuperarCompras() {
  try {
    const texto = localStorage.getItem(CLAVE_COMPRAS);
    if (texto === null) { comprasGuardadas = []; return; }
    const datos = JSON.parse(texto);
    const legado = Array.isArray(datos);
    if (!legado && (!datos || datos.version !== 2)) throw new Error('Versión de compras inválida.');
    let items = validarItemsCompras(legado ? datos : datos.items);
    let cerrarOperacion = false;
    if (!legado && datos.operacion !== undefined) {
      const op = datos.operacion;
      if (!op || !Array.isArray(op.despensaAntes) || !Array.isArray(op.despensaDespues) ||
          ![...op.despensaAntes, ...op.despensaDespues].every((id) => typeof id === 'string')) throw new Error('Operación inválida.');
      validarItemsCompras(op.itemsDespues);
      if (despensaGuardada === null) throw new Error('No se pudo recuperar la despensa para resolver la operación.');
      // Si la despensa no confirmó el cambio, conservar la lista anterior.
      if (mismaSeleccion([...despensaGuardada], op.despensaDespues)) items = op.itemsDespues;
      cerrarOperacion = true;
    }
    const conocidos = new Set(ingredientes.map((i) => i.id));
    let reconciliar = false;
    let referenciasAntiguas = false;
    for (const item of items) {
      if (!conocidos.has(item.id)) { referenciasAntiguas = true; continue; }
      const origenes = item.recetas.filter((id) => recetas.some((receta) => receta.id === id));
      if (origenes.length !== item.recetas.length) referenciasAntiguas = true;
      let comprado = item.comprado === true;
      let incorporadoPorCompra = item.incorporadoPorCompra === true;
      if (item.comprado === undefined && despensa.has(item.id)) {
        comprado = true; incorporadoPorCompra = false; reconciliar = true;
      } else if (comprado && !despensa.has(item.id)) {
        comprado = false; incorporadoPorCompra = false; reconciliar = true;
      }
      compras.set(item.id, new Set(origenes));
      estadosCompras.set(item.id, { comprado, incorporadoPorCompra });
    }
    comprasGuardadas = serializarCompras();
    if (cerrarOperacion || reconciliar || referenciasAntiguas) {
      const guardada = guardarCompras();
      if (referenciasAntiguas) {
        const aviso = 'Se descartaron referencias antiguas de compras; los ingredientes vigentes se conservaron.';
        avisoCompras(guardada ? aviso : `${aviso} No pudimos guardar esta limpieza; los datos almacenados anteriores se conservan.`);
      }
    }
  } catch {
    compras.clear();
    estadosCompras.clear();
    comprasGuardadas = null;
    avisoCompras('No pudimos recuperar la lista de compras guardada. La lista de esta sesión empieza vacía; los datos almacenados y tu despensa se conservan.');
  }
}

function cambiarDisponible(id, disponible) {
  if (disponible) despensa.add(id);
  else despensa.delete(id);
  if (compras.has(id)) {
    // Una edición manual toma prioridad: deshacer la compra no retira esa elección.
    estadosCompras.set(id, { comprado: disponible, incorporadoPorCompra: false });
    comprasRequierenDespensa = true;
  }
  actualizar();
}

function marcarCompra(id, comprado) {
  if (!compras.has(id)) return;
  const estado = estadosCompras.get(id);
  if (comprado) {
    const estabaDisponible = despensa.has(id);
    despensa.add(id);
    estadosCompras.set(id, { comprado: true, incorporadoPorCompra: !estabaDisponible });
  } else {
    if (estado?.incorporadoPorCompra) despensa.delete(id);
    estadosCompras.set(id, { comprado: false, incorporadoPorCompra: false });
  }
  comprasRequierenDespensa = true;
  actualizar();
}

function agregarCompras(receta, ids) {
  for (const id of ids) {
    if (despensa.has(id)) continue;
    if (!compras.has(id)) compras.set(id, new Set());
    estadosCompras.set(id, { comprado: false, incorporadoPorCompra: false });
    compras.get(id).add(receta.id);
  }
  guardarCompras();
  actualizar(false);
}

function quitarCompra(id) {
  compras.delete(id);
  estadosCompras.delete(id);
  guardarCompras();
  actualizar(false);
}

// Al reconstruir un diálogo, conservar el foco del control que inició el cambio.
function conservarFoco(contenedor, dibujar) {
  const clave = contenedor.contains(document.activeElement) ? document.activeElement.dataset.foco : null;
  dibujar();
  if (clave) {
    const destino = [...contenedor.querySelectorAll('[data-foco]')].find((nodo) => nodo.dataset.foco === clave);
    (destino || contenedor.querySelector('h2') || $('titulo-compras')).focus();
  }
}

function mostrarDetalle(receta) {
  recetaDetalle = receta;
  recetaOrigenDetalle = receta.id;
  dibujarDetalle();
  $('detalle').showModal();
}

function dibujarDetalle() {
  if (!recetaDetalle) return;
  conservarFoco($('contenido-detalle'), () => {
    const receta = recetaDetalle;
    $('etiqueta-prueba-detalle').hidden = receta.datosDePrueba !== true;
    const titulo = elemento('h2', receta.nombre);
    titulo.id = 'titulo-detalle';
    titulo.tabIndex = -1;
    const lista = elemento('ul', undefined, 'ingredientes-detalle');
    for (const ingrediente of receta.ingredientes) {
      const fila = elemento('li');
      fila.dataset.disponible = String(despensa.has(ingrediente.id));
      const disponible = despensa.has(ingrediente.id);
      const descripcion = elemento('div', undefined, 'detalle-ingrediente-texto');
      const simbolo = elemento('span', disponible ? '✓' : '+', 'simbolo-estado');
      simbolo.setAttribute('aria-hidden', 'true');
      const estadoAccesible = elemento('span', disponible ? 'En tu despensa: ' : 'Te falta: ', 'solo-lectores');
      descripcion.append(simbolo, estadoAccesible,
        elemento('span', `${ingrediente.cantidad.toLocaleString('es')} ${ingrediente.unidad} · ${ingrediente.nombre}`));
      fila.append(descripcion);
      if (!disponible) {
        const acciones = elemento('div', undefined, 'acciones-ingrediente');
        const esta = comprasPendientesIncluyen(ingrediente.id);
        if (esta) acciones.append(elemento('span', 'En tu lista', 'estado-compras-ingrediente'));
        const accion = boton(esta ? 'Quitar' : 'Añadir a compras', () => esta ? quitarCompra(ingrediente.id) : agregarCompras(receta, [ingrediente.id]));
        accion.dataset.foco = `comprar-${ingrediente.id}`;
        accion.setAttribute('aria-label', `${esta ? 'Quitar de compras' : 'Añadir a compras'}: ${ingrediente.nombre}`);
        if (!esta) {
          const bolsa = document.createElement('img');
          bolsa.src = './imagenes/bolsa.svg';
          bolsa.alt = '';
          bolsa.width = 16;
          bolsa.height = 16;
          accion.prepend(bolsa);
        }
        acciones.append(accion);
        fila.append(acciones);
      }
      lista.append(fila);
    }
    const todos = boton('Añadir todos los faltantes', () => agregarCompras(receta, faltantes(receta).map((i) => i.id)), '');
    todos.dataset.foco = 'todos-faltantes';
    todos.id = 'todos-faltantes';
    const pendientes = faltantes(receta);
    const pendientesDeAnadir = pendientes.filter((ingrediente) => !comprasPendientesIncluyen(ingrediente.id));
    const pasos = elemento('ol');
    receta.pasos.forEach((paso) => pasos.append(elemento('li', paso)));
    // El detalle muestra disponibilidad; su edición sigue en Mi despensa.
    const arriba = elemento('div', undefined, 'detalle-arriba');
    const informacion = elemento('section', undefined, 'detalle-informacion');
    informacion.append(titulo, elemento('p', `${receta.tiempoMinutos} minutos · ${receta.porciones} porciones`, 'meta'),
      elemento('p', 'Revisá las cantidades antes de cocinar', 'detalle-aclaracion'));
    const ingredientesPanel = elemento('section', undefined, 'detalle-ingredientes-panel');
    const editar = boton('Editar mi despensa', () => {
      $('detalle').dataset.editarDespensa = 'true';
      $('detalle').close();
    });
    editar.id = 'editar-despensa-detalle';
    editar.dataset.foco = 'editar-despensa';
    const pieIngredientes = elemento('div', undefined, 'pie-ingredientes');
    if (!pendientes.length) pieIngredientes.append(elemento('p', 'Tenés todos los ingredientes', 'todos-disponibles'));
    else if (pendientesDeAnadir.length) pieIngredientes.append(todos);
    else pieIngredientes.append(elemento('p', 'Todos los faltantes están en tu lista de compras', 'nota-acciones'));
    pieIngredientes.append(editar);
    const sobre = elemento('details', undefined, 'sobre-datos');
    sobre.append(elemento('summary', 'Sobre estos datos'),
      elemento('p', `${receta.datosDePrueba === true ? 'Receta de prueba. ' : ''}Comprobamos presencia de ingredientes, no cantidades suficientes ni seguridad alimentaria. Añadir a compras no marca disponibilidad. La lista reúne ingredientes únicos, sin sumar cantidades. La ausencia de etiqueta de prueba no implica verificación nutricional, de seguridad ni de derechos de reutilización.`));
    ingredientesPanel.append(elemento('h3', 'Ingredientes'),
      elemento('p', '✓ En tu despensa · + Te falta', 'leyenda-ingredientes'), lista, pieIngredientes, sobre);
    arriba.append(informacion, ingredientesPanel);
    const figura = elemento('figure', undefined, 'detalle-imagen');
    const imagen = document.createElement('img');
    imagen.src = `./imagenes/detalle/${receta.id}.svg`;
    figura.dataset.receta = receta.id;
    imagen.alt = `Ilustración de ingredientes de ${receta.nombre}; no es una fotografía del plato`;
    figura.append(imagen, elemento('figcaption', 'Ilustración de ingredientes · Foto del plato pendiente.'));
    const preparacion = elemento('section', undefined, 'detalle-preparacion');
    preparacion.append(elemento('h3', 'Preparación'), pasos);
    $('contenido-detalle').replaceChildren(arriba, figura, preparacion);
  });
}

function filaCompra(id) {
  const ingrediente = ingredientes.find((i) => i.id === id);
  const comprado = esComprado(id);
  const fila = elemento('div', undefined, `compra-fila${comprado ? ' compra-completada' : ''}`);
  fila.dataset.ingrediente = id;
  const etiqueta = elemento('label', undefined, 'compra-etiqueta');
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = comprado;
  casilla.dataset.foco = `comprado-${id}`;
  casilla.setAttribute('aria-label', `${comprado ? 'Devolver a pendientes' : 'Marcar como comprado'}: ${ingrediente.nombre}`);
  casilla.addEventListener('change', () => marcarCompra(id, casilla.checked));
  const dibujo = document.createElement('img');
  dibujo.src = ingrediente.dibujo;
  dibujo.alt = '';
  dibujo.width = 32;
  dibujo.height = 36;
  etiqueta.append(casilla, dibujo, elemento('span', ingrediente.nombre));
  const eliminar = boton('×', () => quitarCompra(id), 'eliminar-compra');
  eliminar.dataset.foco = `eliminar-${id}`;
  eliminar.setAttribute('aria-label', `Eliminar ${ingrediente.nombre} de la lista de compras`);
  fila.append(etiqueta, eliminar);
  return fila;
}

function dibujarCompras() {
  const abierto = $('comprados')?.open === true;
  const foco = document.activeElement?.dataset.foco;
  conservarFoco($('items-compras'), () => {
    $('items-compras').replaceChildren();
    const ordenadas = [...compras.keys()].sort((a, b) => ingredientes.find((i) => i.id === a).nombre.localeCompare(ingredientes.find((i) => i.id === b).nombre, 'es'));
    const pendientes = ordenadas.filter((id) => !esComprado(id));
    const comprados = ordenadas.filter(esComprado);
    const lista = elemento('div', undefined, 'compras-pendientes');
    lista.id = 'compras-pendientes';
    pendientes.forEach((id) => lista.append(filaCompra(id)));
    if (!pendientes.length) lista.append(elemento('p', compras.size ? 'No quedan ingredientes pendientes.' : 'Tu lista está vacía. Añadí faltantes desde una receta.', 'compras-vacias'));
    const completados = elemento('details');
    completados.id = 'comprados';
    const summary = elemento('summary', `Comprados (${comprados.length})`);
    summary.dataset.foco = 'comprados-desplegable';
    completados.append(summary);
    completados.open = abierto || comprados.some((id) => foco === `comprado-${id}`);
    comprados.forEach((id) => completados.append(filaCompra(id)));
    if (!comprados.length) completados.append(elemento('p', 'Todavía no hay ingredientes comprados.', 'compras-vacias'));
    $('items-compras').append(lista, completados);
  });
  const posibles = recetas.filter((receta) => {
    const pendientes = faltantes(receta);
    return pendientes.length > 0 && pendientes.every((ingrediente) => comprasPendientesIncluyen(ingrediente.id));
  }).sort(compararRecetas);
  const listaPosibles = elemento('ul');
  posibles.forEach((receta) => listaPosibles.append(elemento('li', receta.nombre)));
  $('posibilidades-compras').replaceChildren(
    elemento('h3', 'Con tu despensa y estas compras podrías preparar…'),
    posibles.length ? listaPosibles : elemento('p', 'Todavía no hay recetas que se completen con las compras pendientes.')
  );
  $('estado-compras').textContent = `${comprasPendientes().length} pendientes`;
  $('vaciar-compras').disabled = compras.size === 0;
  if (!compras.size) $('confirmar-vaciado').hidden = true;
}

function actualizar(guardar = true) {
  if (guardar) {
    if (comprasRequierenDespensa) guardarEstadoCoordinado();
    else guardarDespensa();
  }
  $('contador').textContent = `${despensa.size} de ${ingredientes.length} ingredientes`;
  const completas = recetas.filter((receta) => faltantes(receta).length === 0).length;
  $('resumen').textContent = `Tenés los ingredientes completos para ${completas} de ${recetas.length} recetas. Todavía no comprobamos cantidades.`;
  mostrarRecetas();
  document.querySelectorAll('#ingredientes input').forEach((casilla) => { casilla.checked = despensa.has(casilla.value); });
  $('contador-compras').textContent = comprasPendientes().length;
  if ($('detalle').open) dibujarDetalle();
  if ($('compras').open) {
    dibujarCompras();
    const aviso = ['error-despensa-panel', 'error-compras-panel'].map($).find((nodo) => !nodo.hidden);
    if (aviso) aviso.scrollIntoView({ block: 'nearest' });
  }
}

function conectarControles() {
  for (const seccion of ['despensa', 'recetas']) {
    $(`tab-${seccion}`).addEventListener('click', () => cambiarSeccion(seccion));
  }
  $('ver-cocinar').addEventListener('click', () => {
    cambiarSeccion('recetas');
    $('titulo-recetas').tabIndex = -1;
    $('titulo-recetas').focus();
    $('titulo-recetas').scrollIntoView({ block: 'start' });
  });
  $('buscar-ingredientes').addEventListener('input', mostrarDespensa);
  $('todo').addEventListener('click', () => {
    despensa = new Set(ingredientes.map((ingrediente) => ingrediente.id));
    for (const id of compras.keys()) estadosCompras.set(id, { comprado: true, incorporadoPorCompra: false });
    if (compras.size) comprasRequierenDespensa = true;
    mostrarDespensa(); actualizar();
  });
  $('nada').addEventListener('click', () => {
    despensa.clear();
    for (const id of compras.keys()) estadosCompras.set(id, { comprado: false, incorporadoPorCompra: false });
    if (compras.size) comprasRequierenDespensa = true;
    mostrarDespensa(); actualizar();
  });
  $('categoria').addEventListener('change', mostrarDespensa);
  $('busqueda').addEventListener('input', mostrarRecetas);
  $('filtro').addEventListener('change', mostrarRecetas);
  $('detalle').addEventListener('close', () => {
    const destino = [...document.querySelectorAll('.tarjeta')].find((nodo) => nodo.dataset.receta === recetaOrigenDetalle)?.querySelector('button');
    if ($('detalle').dataset.editarDespensa === 'true') {
      delete $('detalle').dataset.editarDespensa;
      cambiarSeccion('despensa');
      $('buscar-ingredientes').focus();
      $('titulo-despensa').scrollIntoView({ block: 'start' });
    } else (destino || $('tab-recetas')).focus();
    botonDetalle = null;
    recetaDetalle = null;
  });
  $('abrir-compras').addEventListener('click', () => {
    $('confirmar-vaciado').hidden = true;
    dibujarCompras();
    $('compras').showModal();
  });
  $('compras').addEventListener('close', () => $('abrir-compras').focus());
  $('cerrar-compras').addEventListener('click', () => $('compras').close());
  $('vaciar-compras').addEventListener('click', () => {
    $('confirmar-vaciado').hidden = false;
    $('cancelar-vaciar').focus();
  });
  $('cancelar-vaciar').addEventListener('click', () => {
    $('confirmar-vaciado').hidden = true;
    $('vaciar-compras').focus();
  });
  $('confirmar-vaciar').addEventListener('click', () => {
    compras.clear();
    estadosCompras.clear();
    guardarCompras();
    actualizar(false);
    $('titulo-compras').focus();
  });
  $('cerrar-detalle').addEventListener('click', () => $('detalle').close());
}

async function iniciar() {
  let origen = 'recetas';
  try {
    const respuesta = await fetch('./datos/recetas.json');
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    recetas = validarRecetas(await respuesta.json());
    origen = 'ingredientes';
    const respuestaIngredientes = await fetch('./datos/ingredientes.json');
    if (!respuestaIngredientes.ok) throw new Error(`HTTP ${respuestaIngredientes.status}`);
    ingredientes = validarIngredientes(await respuestaIngredientes.json()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    // Los nombres de receta se resuelven desde el catálogo por el identificador.
    const catalogo = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));
    recetas = recetas.map((receta) => ({ ...receta, ingredientes: receta.ingredientes.map((ingrediente) => ({ ...ingrediente, nombre: catalogo.get(ingrediente.id).nombre })) }));
    const cantidadPrueba = recetas.filter((receta) => receta.datosDePrueba === true).length;
    const avisoPrueba = cantidadPrueba === recetas.length
      ? 'Todas las recetas son datos de prueba. '
      : cantidadPrueba > 0 ? `${cantidadPrueba} de ${recetas.length} recetas están marcadas como datos de prueba. ` : '';
    $('aviso-catalogo').textContent = `Versión 1 · ${avisoPrueba}Comprobamos presencia de ingredientes, no cantidades suficientes ni seguridad alimentaria.`;
    prepararCategorias();
    recuperarDespensa();
    recuperarCompras();
    conectarControles();
    mostrarDespensa();
    actualizar(false);
    $('abrir-compras').disabled = false;
    $('estado').hidden = true;
    $('aplicacion').hidden = false;
  } catch (error) {
    if (error.campo === 'datosDePrueba') {
      $('estado').textContent = `No pudimos cargar las recetas: ${error.message} Revisá datos/recetas.json y recargá.`;
      return;
    }
    $('estado').textContent = origen === 'ingredientes'
      ? 'No pudimos cargar los ingredientes. Comprobá datos/ingredientes.json y que todos los ingredientes de las recetas tengan metadatos válidos. Luego recargá con Live Server. Tu despensa guardada no se modificó.'
      : 'No pudimos cargar las recetas. Abrí index.html con Live Server y comprobá que exista datos/recetas.json con un formato válido. Luego recargá la página.';
  }
}

iniciar();
