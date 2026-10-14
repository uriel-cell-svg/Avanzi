'use strict';

const CLAVE_DESPENSA = 'que-cocino.despensa.v1';
const CLAVE_COMPRAS = 'que-cocino.compras.v1';
let compras = new Map();
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
    if (!receta || !texto(receta.id) || ids.has(receta.id) || !texto(receta.nombre) || receta.datosDePrueba !== true ||
        !Number.isInteger(receta.porciones) || receta.porciones <= 0 || !Number.isFinite(receta.tiempoMinutos) || receta.tiempoMinutos <= 0 ||
        !Array.isArray(receta.ingredientes) || !receta.ingredientes.length || !Array.isArray(receta.pasos) || !receta.pasos.length || !receta.pasos.every(texto)) {
      throw new Error('Formato de receta inválido.');
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
  $('aviso-guardado').textContent = mensaje;
  $('aviso-guardado').hidden = !mensaje;
}

function recuperarDespensa() {
  try {
    const guardado = localStorage.getItem(CLAVE_DESPENSA);
    if (guardado === null) return;
    const datos = JSON.parse(guardado);
    const conocidos = new Set(ingredientes.map((ingrediente) => ingrediente.id));
    if (!Array.isArray(datos) || !datos.every((id) => typeof id === 'string' && conocidos.has(id))) {
      throw new Error('Selección inválida.');
    }
    despensa = new Set(datos);
  } catch {
    despensa = new Set();
    avisarGuardado('No pudimos recuperar la despensa guardada. Empezamos con una selección vacía; podés seguir usando la app.');
  }
}

function guardarDespensa() {
  try {
    // [] es una selección válida: desmarcar todo también debe persistir.
    localStorage.setItem(CLAVE_DESPENSA, JSON.stringify([...despensa]));
    avisarGuardado('');
  } catch {
    avisarGuardado('No pudimos guardar tu despensa en este navegador. Podés seguir usándola, pero los cambios podrían perderse al recargar.');
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
  $('resultados').textContent = `${visibles.length} de ${recetas.length} recetas de prueba`;
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
  tarjeta.append(elemento('h4', receta.nombre), elemento('p', `${receta.tiempoMinutos} min · ${receta.porciones} porciones · Datos de prueba`, 'meta'),
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
  for (const id of ['aviso-compras', 'error-compras-panel']) {
    $(id).textContent = mensaje;
    $(id).hidden = !mensaje;
  }
}

function guardarCompras() {
  try {
    localStorage.setItem(CLAVE_COMPRAS, JSON.stringify([...compras].map(([id, origenes]) => ({ id, recetas: [...origenes] }))));
    avisoCompras('');
  } catch {
    avisoCompras('No pudimos guardar la lista de compras. Podés seguir usándola, pero los cambios podrían perderse al recargar.');
  }
}

function recuperarCompras() {
  try {
    const texto = localStorage.getItem(CLAVE_COMPRAS);
    if (texto === null) return;
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos)) throw new Error('Lista inválida.');
    const ids = new Set();
    const conocidos = new Set(ingredientes.map((i) => i.id));
    for (const item of datos) {
      if (!item || !conocidos.has(item.id) || ids.has(item.id) || !Array.isArray(item.recetas) || !item.recetas.length ||
          !item.recetas.every((id) => recetas.some((r) => r.id === id && r.ingredientes.some((i) => i.id === item.id)))) {
        throw new Error('Lista inválida.');
      }
      ids.add(item.id);
    }
    let reconciliar = false;
    for (const item of datos) {
      if (despensa.has(item.id)) { reconciliar = true; continue; }
      compras.set(item.id, new Set(item.recetas));
    }
    if (reconciliar) guardarCompras();
  } catch {
    compras.clear();
    avisoCompras('No pudimos recuperar la lista de compras guardada. Empezamos con una lista vacía; tu despensa se conserva.');
  }
}

function cambiarDisponible(id, disponible) {
  if (disponible) {
    despensa.add(id);
    if (compras.delete(id)) guardarCompras();
  } else despensa.delete(id);
  actualizar();
}

function agregarCompras(receta, ids) {
  for (const id of ids) {
    if (despensa.has(id)) continue;
    if (!compras.has(id)) compras.set(id, new Set());
    compras.get(id).add(receta.id);
  }
  guardarCompras();
  actualizar(false);
}

function quitarCompra(id) {
  compras.delete(id);
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
    const titulo = elemento('h2', receta.nombre);
    titulo.id = 'titulo-detalle';
    titulo.tabIndex = -1;
    const lista = elemento('ul', undefined, 'ingredientes-detalle');
    for (const ingrediente of receta.ingredientes) {
      const fila = elemento('li');
      const etiqueta = elemento('label', undefined, 'detalle-casilla');
      const casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.checked = despensa.has(ingrediente.id);
      casilla.dataset.foco = `detalle-${ingrediente.id}`;
      casilla.setAttribute('aria-label', `Tengo ${ingrediente.nombre}`);
      casilla.addEventListener('change', () => cambiarDisponible(ingrediente.id, casilla.checked));
      etiqueta.append(casilla, elemento('span', `${ingrediente.cantidad.toLocaleString('es')} ${ingrediente.unidad} · ${ingrediente.nombre} — ${despensa.has(ingrediente.id) ? 'Tenés' : 'Te falta'}`));
      fila.append(etiqueta);
      if (!despensa.has(ingrediente.id)) {
        const esta = compras.has(ingrediente.id);
        const accion = boton(esta ? 'En tu lista · Quitar' : 'Añadir a la lista de compras', () => esta ? quitarCompra(ingrediente.id) : agregarCompras(receta, [ingrediente.id]));
        accion.dataset.foco = `comprar-${ingrediente.id}`;
        accion.setAttribute('aria-label', `${esta ? 'Quitar de compras' : 'Añadir a la lista de compras'}: ${ingrediente.nombre}`);
        fila.append(accion);
        if (esta && !compras.get(ingrediente.id).has(receta.id)) {
          const asociar = boton('Añadir desde esta receta', () => agregarCompras(receta, [ingrediente.id]));
          asociar.dataset.foco = `asociar-${ingrediente.id}`;
          fila.append(asociar);
        }
      }
      lista.append(fila);
    }
    const todos = boton('Añadir todos los faltantes', () => agregarCompras(receta, faltantes(receta).map((i) => i.id)), '');
    todos.dataset.foco = 'todos-faltantes';
    todos.id = 'todos-faltantes';
    todos.disabled = faltantes(receta).length === 0;
    const pasos = elemento('ol');
    receta.pasos.forEach((paso) => pasos.append(elemento('li', paso)));
    $('contenido-detalle').replaceChildren(titulo, elemento('p', `${receta.tiempoMinutos} minutos · ${receta.porciones} porciones`, 'meta'),
      elemento('p', 'Comprobamos presencia, no cantidades suficientes ni seguridad alimentaria.'), elemento('h3', 'Ingredientes'),
      elemento('p', 'Marcá lo que tenés. Añadir a compras no marca el ingrediente como disponible.'), lista, todos,
      elemento('p', todos.disabled ? 'No falta ningún ingrediente para añadir a compras.' : 'La lista reúne ingredientes únicos. Consultá las cantidades en cada receta.', 'nota-acciones'),
      elemento('h3', 'Paso a paso'), pasos);
  });
}

function dibujarCompras() {
  conservarFoco($('items-compras'), () => {
    $('items-compras').replaceChildren();
    const ordenadas = [...compras.keys()].sort((a, b) => ingredientes.find((i) => i.id === a).nombre.localeCompare(ingredientes.find((i) => i.id === b).nombre, 'es'));
    for (const id of ordenadas) {
      const ingrediente = ingredientes.find((i) => i.id === id);
      const fila = elemento('article', undefined, 'compra-item');
      fila.append(elemento('h3', ingrediente.nombre), elemento('p', `Desde: ${[...compras.get(id)].map((r) => recetas.find((receta) => receta.id === r).nombre).join(', ')}.`, 'meta'));
      const acciones = elemento('div', undefined, 'acciones');
      const quitar = boton('Quitar', () => quitarCompra(id));
      quitar.dataset.foco = `quitar-${id}`;
      quitar.setAttribute('aria-label', `Quitar ${ingrediente.nombre} de compras`);
      const comprar = boton('Ya lo compré', () => cambiarDisponible(id, true), '');
      comprar.dataset.foco = `comprado-${id}`;
      comprar.setAttribute('aria-label', `Ya compré ${ingrediente.nombre}`);
      acciones.append(quitar, comprar);
      fila.append(acciones);
      $('items-compras').append(fila);
    }
    if (!compras.size) $('items-compras').append(elemento('p', 'Tu lista está vacía. Añadí ingredientes faltantes desde la preparación de una receta.'));
  });
  const posibles = recetas.filter((receta) => {
    const pendientes = faltantes(receta);
    return pendientes.length > 0 && pendientes.every((ingrediente) => compras.has(ingrediente.id));
  }).sort(compararRecetas);
  const listaPosibles = elemento('ul');
  posibles.forEach((receta) => listaPosibles.append(elemento('li', receta.nombre)));
  $('posibilidades-compras').replaceChildren(
    elemento('h3', 'Con tu despensa y estas compras podrías preparar…'),
    posibles.length ? listaPosibles : elemento('p', 'Todavía no hay recetas que se completen con estas compras y tu despensa.'),
    elemento('p', 'Estas posibilidades dependen de realizar las compras y revisar las cantidades. No se consideran disponibles hasta marcarlas en tu despensa.', 'nota-acciones')
  );
  $('estado-compras').textContent = `${compras.size} ingredientes únicos pendientes`;
  $('vaciar-compras').disabled = compras.size === 0;
  if (!compras.size) $('confirmar-vaciado').hidden = true;
}

function actualizar(guardar = true) {
  if (guardar) guardarDespensa();
  $('contador').textContent = `${despensa.size} de ${ingredientes.length} ingredientes`;
  const completas = recetas.filter((receta) => faltantes(receta).length === 0).length;
  $('resumen').textContent = `Tenés los ingredientes completos para ${completas} de ${recetas.length} recetas. Todavía no comprobamos cantidades.`;
  mostrarRecetas();
  document.querySelectorAll('#ingredientes input').forEach((casilla) => { casilla.checked = despensa.has(casilla.value); });
  $('contador-compras').textContent = compras.size;
  if ($('detalle').open) dibujarDetalle();
  if ($('compras').open) dibujarCompras();
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
    if (compras.size) { compras.clear(); guardarCompras(); }
    mostrarDespensa(); actualizar();
  });
  $('nada').addEventListener('click', () => {
    despensa.clear(); mostrarDespensa(); actualizar();
  });
  $('categoria').addEventListener('change', mostrarDespensa);
  $('busqueda').addEventListener('input', mostrarRecetas);
  $('filtro').addEventListener('change', mostrarRecetas);
  $('detalle').addEventListener('close', () => {
    const destino = [...document.querySelectorAll('.tarjeta')].find((nodo) => nodo.dataset.receta === recetaOrigenDetalle)?.querySelector('button');
    (destino || $('tab-recetas')).focus();
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
    prepararCategorias();
    recuperarDespensa();
    recuperarCompras();
    conectarControles();
    mostrarDespensa();
    actualizar(false);
    $('abrir-compras').disabled = false;
    $('estado').hidden = true;
    $('aplicacion').hidden = false;
  } catch {
    $('estado').textContent = origen === 'ingredientes'
      ? 'No pudimos cargar los ingredientes. Comprobá datos/ingredientes.json y que todos los ingredientes de las recetas tengan metadatos válidos. Luego recargá con Live Server. Tu despensa guardada no se modificó.'
      : 'No pudimos cargar las recetas. Abrí index.html con Live Server y comprobá que exista datos/recetas.json con un formato válido. Luego recargá la página.';
  }
}

iniciar();
