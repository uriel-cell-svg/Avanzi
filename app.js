import {calcularNutrientes,clasificarReceta} from './motor_avanzi.mjs';
import {crearMotorCantidades,estadoVacio,copiar,cantidadLegible,separarNecesidadesReceta} from './planificacion.mjs';
import {recuperarEstado,guardarEstado} from './almacenamiento.mjs';
import {crearEditorRecetas} from './editor_recetas.mjs';
import {vacioRecetasUsuario,nuevoIdReceta,esPropia,prepararRecetaUsuario,recuperarRecetasUsuario,guardarRecetasUsuario} from './recetas_usuario.mjs';
import {optimizarFoto,guardarFoto,obtenerFoto,borrarFoto,fotosSinReferencias} from './fotos_usuario.mjs';
import {crearAlmacenamientoProtegido} from './persistencia_navegador.mjs';
import {recuperarPerfil,guardarPerfil,eliminarPerfil} from './perfil_usuario.mjs';
import {estimarPerfil} from './estimaciones_perfil.mjs';
import {recomendarRecetas} from './recomendaciones.mjs';
import {recuperarFavoritos,guardarFavoritos,cambiarFavorito,quitarFavorito} from './favoritos.mjs';
import {iniciarSesion,cancelarSesion,finalizarSesion,registrarCambiosCompras,invalidarRecetas,saldoMonedas,diaLocal} from './recompensas.mjs';
import {validarRecetas,validarIngredientes,prepararIngredientes,CATEGORIAS} from './catalogo_avanzi.mjs';

const $=id=>document.getElementById(id);
const avisoOtraPestana='Avanzi cambió en otra pestaña. Recargá antes de guardar para no perder esos cambios.';
function avisarOtraPestana(){const aviso=$('aviso-recuperacion');aviso.hidden=false;aviso.textContent=avisoOtraPestana;}
const almacenamientoSeguro=crearAlmacenamientoProtegido(window,avisarOtraPestana);
const almacenamientoLocal=almacenamientoSeguro.storage;
const normalizar=texto=>texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const IMAGEN_RECETA_POR_DEFECTO='./imagenes/por-defecto/receta.svg';
const IMAGEN_INGREDIENTE_POR_DEFECTO='./imagenes/por-defecto/ingrediente.svg';
let recetas=[],recetasBase=[],ingredientes=[],equivalencias,motor,estado=estadoVacio(),bloqueado=false,recuperacion=[],sinGuardar=false;
let recetasUsuario=vacioRecetasUsuario(),recetasUsuarioBloqueadas=false,editor;
let perfil=null,perfilBloqueado=false,origenDetalle='recetas';
let favoritos={version:1,ids:[]},favoritosBloqueados=false;
let ingredientePorAgotar=null;
let focoAntesDeAgotar=null;
const urlsFotos=new Map();
const fotosPendientes=new Map();
window.addEventListener('pagehide',()=>{for(const url of urlsFotos.values())URL.revokeObjectURL(url);urlsFotos.clear();});
function urlFotoLocal(id){
  if(urlsFotos.has(id))return Promise.resolve(urlsFotos.get(id));
  if(fotosPendientes.has(id))return fotosPendientes.get(id);
  const tarea=obtenerFoto(id).then(blob=>{
    if(!(blob instanceof Blob))return null;
    const url=URL.createObjectURL(blob);urlsFotos.set(id,url);return url;
  }).finally(()=>fotosPendientes.delete(id));
  fotosPendientes.set(id,tarea);return tarea;
}
function liberarFotoLocal(id){
  const url=urlsFotos.get(id);if(url)URL.revokeObjectURL(url);urlsFotos.delete(id);
  fotosPendientes.get(id)?.then(()=>{const tardia=urlsFotos.get(id);if(tardia)URL.revokeObjectURL(tardia);urlsFotos.delete(id);}).catch(()=>{});
}
let recetaDetalle=null,recetaOrigenDetalle=null,opcionesDetalle=null;
let vistaCompras='ingrediente';
let comprasAgrupadas=false,recetaDestacadaIds=null;
const seleccionados=()=>new Set(ingredientes.filter(i=>motor.tieneIngrediente(estado,i.id)).map(i=>i.id));
const planDe=id=>estado.planes.find(p=>p.recetaId===id);
const disponibilidad=r=>motor.disponibilidad(r,estado);
const faltantes=r=>disponibilidad(r).faltantes;
const numeroFaltantes=r=>new Set(faltantes(r).map(i=>i.ingredienteId)).size;
const tiempo=r=>r.tiempoTotalMinutos??r.tiempoMinutos??null;
const textoTiempo=r=>tiempo(r)===null?'Tiempo sin informar':`${tiempo(r)} min`;
function prepararCategorias() {
  for (const categoria of CATEGORIAS) {
    if (!ingredientes.some((ingrediente) => ingrediente.categoria === categoria)) continue;
    const opcion = elemento('option', categoria);
    opcion.value = categoria;
    $('categoria').append(opcion);
  }
  for (const opcion of $('categoria').options) {
    const control = boton(opcion.textContent, () => {
      $('categoria').value = opcion.value;
      // La nueva presentación conserva el filtro y su evento existentes.
      $('categoria').dispatchEvent(new Event('change'));
    }, 'categoria-inicio');
    control.dataset.categoria = opcion.value;
    control.setAttribute('aria-pressed', String(opcion.selected));
    $('categorias-inicio').append(control);
  }
}
function prepararCategoriasRecetas() {
  for(const opcion of $('categoria-recetas').options){
    const control=boton(opcion.textContent,()=>{
      $('categoria-recetas').value=opcion.value;
      $('categoria-recetas').dispatchEvent(new Event('change'));
      control.scrollIntoView({block:'nearest',inline:'nearest'});
    },'categoria-receta');
    control.dataset.categoria=opcion.value;
    control.setAttribute('aria-pressed',String(opcion.selected));
    $('categorias-recetas').append(control);
  }
}


function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}


function imagenConRespaldo(rutas, respaldo, opciones = {}) {
  const imagen = document.createElement('img');
  imagen.width = 100;
  imagen.height = 100;
  // Sin rutas vacías ni duplicadas: cada candidata se intenta una sola vez.
  const candidatas = [...new Set([...rutas, respaldo].filter((ruta) => typeof ruta === 'string' && ruta.trim()))];
  let siguiente = 0;
  const intentar = () => {
    const ruta = candidatas[siguiente++];
    const estado = !ruta ? 'sin-imagen' : ruta === respaldo ? 'respaldo' : 'propia';
    imagen.dataset.estadoImagen = estado;
    if (!ruta) {
      imagen.removeEventListener('error', intentar);
      imagen.classList.add('imagen-no-disponible');
      imagen.alt = '';
      imagen.removeAttribute('src');
    } else {
      imagen.alt = estado === 'respaldo' ? (opciones.altRespaldo || '') : (opciones.alt || '');
      imagen.src = ruta;
    }
    opciones.alCambiarEstado?.(estado);
  };
  imagen.addEventListener('error', intentar);
  intentar();
  imagen.usarFotoUsuario=(url,alt)=>{
    imagen.removeEventListener('error',intentar);
    let fallo=false;
    imagen.onerror=()=>{
      if(!fallo){fallo=true;imagen.src=respaldo;imagen.alt=opciones.altRespaldo||'';opciones.alCambiarEstado?.('respaldo');}
      else {imagen.onerror=null;imagen.classList.add('imagen-no-disponible');imagen.removeAttribute('src');opciones.alCambiarEstado?.('sin-imagen');}
    };
    imagen.classList.remove('imagen-no-disponible');imagen.alt=alt;imagen.src=url;
  };
  return imagen;
}


function dibujoIngredienteInicio(ingrediente) {
  // Se conserva también la ruta original para ingredientes sin variante coloreada.
  return imagenConRespaldo([
    ingrediente.dibujo?.replace('./imagenes/despensa/', './imagenes/lo-que-tengo/'),
    ingrediente.dibujo
  ], IMAGEN_INGREDIENTE_POR_DEFECTO);
}
function metadatosReceta(r,porciones,veces=1) {
  const meta=elemento('div',undefined,'meta meta-receta');
  for(const [ruta,valor] of [['reloj',textoTiempo(r)],['porciones',`${porciones} porciones${veces>1?` × ${veces} preparaciones`:''}`]]){
    const dato=elemento('span',undefined,'meta-dato'),icono=document.createElement('img');icono.src=`./imagenes/${ruta}.svg`;icono.alt='';icono.width=18;icono.height=18;
    dato.append(icono,elemento('span',valor));meta.append(dato);
  }
  if(r.datosDePrueba===true)meta.append(elemento('span','Datos de prueba'));
  return meta;
}


function cambiarSeccion(seccion) {
  for (const nombre of ['despensa', 'recetas', 'perfil']) {
    $(nombre).hidden = nombre !== seccion;
    $(`tab-${nombre}`).setAttribute('aria-pressed', String(nombre === seccion));
  }
  $(`tab-${seccion}`).scrollIntoView({block:'nearest',inline:'center'});
}


function boton(texto, accion, clase = 'secundario') {
  const nodo = elemento('button', texto, clase);
  nodo.type = 'button';
  nodo.addEventListener('click', accion);
  return nodo;
}

function mensajeGuardado(mensaje) {
  for(const id of ['aviso-guardado','error-despensa-detalle','error-despensa-panel']){
    $(id).textContent=mensaje;$(id).hidden=!mensaje;
  }
  $('reintentar-guardado').hidden=!sinGuardar||bloqueado||almacenamientoSeguro.desactualizado();
}
function guardar() {
  const resultado=guardarEstado(almacenamientoLocal,estado,motor,bloqueado);
  sinGuardar=!resultado.ok;mensajeGuardado(resultado.mensaje);
  return resultado.ok;
}
function cambiar(accion) {
  try{almacenamientoSeguro.comprobar();}catch(error){mensajeGuardado(error.message);return false;}
  const antes=copiar(estado);
  try{accion(estado);registrarCambiosCompras(antes,estado,motor);motor.detectarTransiciones(antes,estado);}catch(error){estado=antes;mensajeGuardado(error.message);return false;}
  const ok=guardar();if(!ok&&almacenamientoSeguro.desactualizado())estado=antes;
  actualizar();return ok;
}
function cambiarSeguro(accion) {
  const anterior=copiar(estado);
  if(cambiar(accion))return true;
  estado=anterior;actualizar();return false;
}
function conservarFoco(contenedor,dibujar) {
  const activo=document.activeElement;
  const clave=contenedor.contains(activo)?activo.dataset.foco:null;
  dibujar();
  if(clave){const destino=[...contenedor.querySelectorAll('[data-foco]')].find(i=>i.dataset.foco===clave);(destino||contenedor.querySelector('h2')||$('titulo-compras')).focus({preventScroll:true});}
}
function comprasCompletadasDe(id) {
  return estado.planes.some(p=>p.ingredientes.some(i=>i.clave.startsWith(`${id}|`)&&i.completado===true))||
    estado.manuales.some(i=>i.ingredienteId===id&&i.completado===true);
}
function agotarDesdeDespensa(id) {
  if((estado.fijados||[]).includes(id))return false;
  return cambiarSeguro(s=>{
    const afectadas=s.planes.filter(p=>motor.recetario.get(p.recetaId)?.ingredientes.some(i=>(i.ingredienteId||i.id)===id)).map(p=>p.recetaId);
    if(motor.agotarIngrediente(s,id))invalidarRecetas(s,afectadas);
  });
}
function solicitarAgotamiento(ingrediente,origen) {
  const id=ingrediente.id;
  if(!motor.tieneIngrediente(estado,id)){actualizar();return;}
  if((estado.fijados||[]).includes(id)){
    ingredientePorAgotar=null;focoAntesDeAgotar=null;$('confirmar-agotado').hidden=true;
    $('aviso-agotado').textContent=`Desfijá ${ingrediente.nombre} con la chincheta antes de marcarlo como agotado.`;
    $('aviso-agotado').hidden=false;
    [...$('ingredientes').querySelectorAll('.fijar-ingrediente')].find(b=>b.dataset.foco===`fijar-${id}`)?.focus();
    return;
  }
  $('aviso-agotado').hidden=true;
  if(comprasCompletadasDe(id)){
    ingredientePorAgotar=id;focoAntesDeAgotar=origen;
    $('texto-confirmar-agotado').textContent=`¿Se agotó ${ingrediente.nombre}? Sus compras completadas pasarán al historial. Las recetas planificadas recibirán nuevas necesidades.`;
    $('confirmar-agotado').hidden=false;
    $('cancelar-agotado').focus();
    return;
  }
  $('confirmar-agotado').hidden=true;ingredientePorAgotar=null;focoAntesDeAgotar=null;
  if(agotarDesdeDespensa(id)){
    [...$('ingredientes').querySelectorAll('[data-foco]')].find(n=>n.dataset.foco===`stock-${id}`)?.focus({preventScroll:true});
  }
}
function mostrarDespensa() {
  conservarFoco($('ingredientes'),()=>{
    $('ingredientes').replaceChildren();
    const categoria=$('categoria').value,consulta=normalizar($('buscar-ingredientes').value.trim());
    $('categorias-inicio').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoria===categoria)));
    const visibles=ingredientes.filter(i=>(categoria==='Todos'||i.categoria===categoria)&&normalizar([i.nombre,...(i.aliasEs||[])].join(' ')).includes(consulta));
    if(recetaDestacadaIds)visibles.sort((a,b)=>Number(recetaDestacadaIds.has(b.id))-Number(recetaDestacadaIds.has(a.id))||a.nombre.localeCompare(b.nombre,'es'));
    $('cantidad-visible').textContent=`${visibles.length} ingredientes visibles de ${ingredientes.length}`;
    const seleccion=seleccionados();
    for(const i of visibles){
      const tarjeta=elemento('div',undefined,'tarjeta-ingrediente');
      if(recetaDestacadaIds?.has(i.id)){tarjeta.classList.add('ingrediente-de-receta');tarjeta.append(elemento('span','Ingrediente de esta receta','solo-lectores'));}
      const etiqueta=elemento('label',undefined,'ingrediente');
      const casilla=document.createElement('input');casilla.type='checkbox';casilla.value=i.id;casilla.checked=seleccion.has(i.id);casilla.dataset.foco=`stock-${i.id}`;
      casilla.addEventListener('change',()=>{
        if(casilla.checked){
          $('aviso-agotado').hidden=true;$('confirmar-agotado').hidden=true;
          ingredientePorAgotar=null;focoAntesDeAgotar=null;
          cambiar(s=>motor.establecerPresencia(s,i.id,true));
        }else{
          casilla.checked=true;
          solicitarAgotamiento(i,casilla);
        }
      });
      const marca=elemento('span','✓','marca-seleccion');marca.setAttribute('aria-hidden','true');
      etiqueta.append(casilla,marca,dibujoIngredienteInicio(i),elemento('span',i.nombre,'nombre-ingrediente'));
      const fijado=(estado.fijados||[]).includes(i.id);
      const fijar=boton('',()=>cambiar(s=>motor.fijarIngrediente(s,i.id,!fijado)),'fijar-ingrediente');
      fijar.dataset.foco=`fijar-${i.id}`;fijar.setAttribute('aria-pressed',String(fijado));
      fijar.setAttribute('aria-label',`${fijado?'Desfijar':'Fijar'} ${i.nombre}`);
      const icono=document.createElement('img');icono.src='./imagenes/chincheta.svg';icono.alt='';fijar.append(icono);
      tarjeta.append(etiqueta,fijar);
      $('ingredientes').append(tarjeta);
    }
    if(!visibles.length)$('ingredientes').append(elemento('p','Sin coincidencias','vacio'));
  });
}
function mostrarReferenciasAntiguas() {
  const referencias=estado.porRevisar||[],panel=$('referencias-antiguas'),lista=$('lista-referencias-antiguas');
  panel.hidden=!referencias.length;lista.replaceChildren();
  panel.querySelector('summary').textContent=`Referencias anteriores (${referencias.length})`;
  for(const ref of referencias)lista.append(elemento('li',`${ref.nombre} · ${ref.tipo==='inventario'?'Lo que tengo':'Compras'}`));
}
function mostrarSeleccion() {
  const seleccion=seleccionados(),list=$('seleccion-lista');
  const idFoco=list.contains(document.activeElement)?document.activeElement.dataset.ingrediente:null;
  const antes=[...list.querySelectorAll('button')].map(n=>n.dataset.ingrediente),pos=antes.indexOf(idFoco);
  list.replaceChildren();list.hidden=!seleccion.size;
  $('cantidad-seleccion').textContent=seleccion.size;$('cantidad-seleccion-pie').textContent=`${seleccion.size} seleccionados`;
  for(const i of ingredientes.filter(i=>seleccion.has(i.id))){
    const li=elemento('li',undefined,'seleccion-item');const quitar=boton('×',()=>solicitarAgotamiento(i,quitar),'quitar-seleccion');
    quitar.dataset.ingrediente=i.id;quitar.setAttribute('aria-label',`Desmarcar ${i.nombre}`);
    li.append(quitar,dibujoIngredienteInicio(i),elemento('span',i.nombre));list.append(li);
  }
  if(idFoco){const botones=[...list.querySelectorAll('button')];(botones.find(b=>b.dataset.ingrediente===idFoco)||botones[Math.min(Math.max(0,pos),botones.length-1)]||$('buscar-ingredientes')).focus({preventScroll:true});}
}
function compararRecetas(a,b) {return numeroFaltantes(a)-numeroFaltantes(b)||(tiempo(a)??Infinity)-(tiempo(b)??Infinity)||a.nombre.localeCompare(b.nombre,'es');}
function mostrarRecetas() {
  const consulta=normalizar($('busqueda').value.trim()),filtro=$('filtro').value,categoria=$('categoria-recetas').value;
  $('categorias-recetas').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoria===categoria)));
  const panel=$('estado-categoria-recetas');panel.replaceChildren();panel.hidden=true;
  $('lista-recetas').replaceChildren();
  if(categoria==='para-vos'&&!perfil?.objetivo){
    panel.append(elemento('p','Completá tu objetivo en Mi perfil para descubrir recetas para vos.'));
    panel.append(boton('Ir a Mi perfil',()=>{cambiarSeccion('perfil');$('perfil-nombre').focus();}));panel.hidden=false;
    $('resultados').textContent='';return;
  }
  const recomendadas=categoria==='para-vos'?recomendarRecetas(recetas,ingredientes,perfil,disponibilidad):null;
  const motivos=new Map(recomendadas?.items.map(item=>[item.receta.id,item.razones])??[]);
  const base=recomendadas?recomendadas.items.map(item=>item.receta):recetas;
  const visibles=base.filter(r=>(normalizar(r.nombre).includes(consulta)||r.ingredientes.some(i=>normalizar(motor.catalogo.get(i.ingredienteId||i.id).nombre).includes(consulta)))&&
    (categoria==='todas'||categoria==='para-vos'||categoria==='favoritos'&&favoritos.ids.includes(r.id)||r.categoriasAutomaticas.includes(categoria))&&(filtro==='todas'||(filtro==='completas')===disponibilidad(r).completa));
  if(!recomendadas)visibles.sort(compararRecetas);
  $('resultados').textContent=`${visibles.length} de ${recetas.length} recetas`;
  if(categoria==='favoritos'&&!visibles.length&&!consulta&&filtro==='todas'){
    panel.append(elemento('p','Todavía no guardaste recetas favoritas. Tocá la estrella de una tarjeta para empezar.'));panel.hidden=false;return;
  }
  if(recomendadas){
    const saludo=perfil.nombre?`¡Hola, ${perfil.nombre}! `:'';
    panel.append(elemento('p',`${saludo}${recomendadas.tipo==='objetivo'?'Estas recetas pueden ayudarte con tu objetivo.':'Opciones generales según tus ingredientes y el tiempo.'}`));panel.hidden=false;
    const lista=elemento('div',undefined,'tarjetas');
    for(const r of visibles)lista.append(tarjetaReceta(r,motivos.get(r.id)||[]));
    if(!visibles.length)lista.append(elemento('p','No encontramos recetas que cumplan estos criterios.','vacio'));
    $('lista-recetas').append(lista);return;
  }
  const grupos=[['Ya tenés todo, ¡a cocinar!',n=>n===0],['Ya casi',n=>n>=1&&n<=3],['Con algunas compras más',n=>n>3]];
  grupos.forEach(([nombre,incluye],indice)=>{
    const grupo=elemento('section',undefined,'grupo-recetas');grupo.dataset.grupo=indice;
    const items=visibles.filter(r=>incluye(numeroFaltantes(r)));const titulo=elemento('h3',nombre);titulo.id=`grupo-${indice}`;
    const contador=elemento('span',String(items.length),'contador-grupo');contador.setAttribute('aria-label',`${items.length} recetas`);titulo.append(document.createTextNode(' '),contador);grupo.setAttribute('aria-labelledby',titulo.id);
    const lista=elemento('div',undefined,'tarjetas');
    if(!items.length)lista.append(elemento('p',consulta||filtro!=='todas'||categoria!=='todas'?'Sin coincidencias':['Ninguna receta completa todavía.','Sin recetas con pocos faltantes.','Sin recetas con más de tres faltantes.'][indice],'vacio'));
    items.forEach(r=>lista.append(tarjetaReceta(r)));grupo.append(titulo,lista);$('lista-recetas').append(grupo);
  });
}
function imagenReceta(receta,pie) {
  const propia=receta.imagen?.ruta;
  const img=imagenConRespaldo([propia?`./${propia.replace(/^\.\//,'')}`:undefined,propia||esPropia(receta)?undefined:`./imagenes/detalle/${receta.id}.svg`],IMAGEN_RECETA_POR_DEFECTO,{
    alt:propia?`Imagen ilustrativa generada con IA de ${receta.nombre}`:`Ilustración de ingredientes de ${receta.nombre}; no es una fotografía`,
    altRespaldo:'Ilustración genérica de cocina; no representa el plato',
    alCambiarEstado:estadoImagen=>{if(pie)pie.textContent=estadoImagen==='sin-imagen'?'Sin ilustración':estadoImagen==='respaldo'?'Ilustración genérica de cocina':propia?'Imagen ilustrativa generada con IA':'Ilustración de ingredientes';}
  });
  if(receta.imagenId){
    const id=receta.imagenId;
    const aplicar=url=>{if(!url||!img.isConnected)return;img.usarFotoUsuario(url,`Foto aportada por el usuario de ${receta.nombre}`);if(pie)pie.textContent='Imagen aportada por el usuario';};
    urlFotoLocal(id).then(url=>{if(url)aplicar(url);else if(pie)pie.textContent='Foto no disponible; ilustración genérica';}).catch(()=>{if(pie)pie.textContent='Foto no disponible; ilustración genérica';});
  }
  return img;
}
function tarjetaReceta(r,razones=[]) {
  const info=disponibilidad(r),n=numeroFaltantes(r),p=planDe(r.id);
  const tarjeta=elemento('article',undefined,`tarjeta ${info.completa?'completa':'incompleta'}`);tarjeta.dataset.receta=r.id;
  const estrella=boton(favoritos.ids.includes(r.id)?'★':'☆',()=>{
    const guardado=guardarFavoritos(almacenamientoLocal,cambiarFavorito(favoritos,r.id),favoritosBloqueados);
    if(!guardado.ok){mensajeGuardado(guardado.mensaje);return;}
    favoritos=guardado.datos;mostrarRecetas();
    const actual=[...document.querySelectorAll('.tarjeta')].find(t=>t.dataset.receta===r.id);
    (actual?.querySelector('.favorito-receta')||$('categorias-recetas').querySelector('[data-categoria=favoritos]'))?.focus({preventScroll:true});
  },'favorito-receta');
  estrella.setAttribute('aria-label',`${favoritos.ids.includes(r.id)?'Quitar de favoritos':'Añadir a favoritos'}: ${r.nombre}`);
  estrella.setAttribute('aria-pressed',String(favoritos.ids.includes(r.id)));
  tarjeta.append(estrella);
  const etiquetaFoto=r.imagenId?elemento('p','Cargando foto local…','meta'):null;
  const figura=elemento('figure',undefined,`visual-receta ${r.imagen||r.imagenId?'con-imagen-local':''}`),img=imagenReceta(r,etiquetaFoto);img.loading='lazy';
  if(n)figura.append(elemento('span',`Falta${n===1?'':'n'} ${n} ingrediente${n===1?'':'s'}`,'franja-faltantes'));
  figura.append(img);tarjeta.append(figura);
  if(info.completa)tarjeta.append(elemento('span','Ingredientes disponibles','etiqueta'));
  tarjeta.append(elemento('h4',r.nombre),metadatosReceta(r,p?.porciones??r.porciones,p?.veces??1));
  if(n)tarjeta.append(elemento('p',`Te falta: ${info.faltantes.map(i=>i.nombre).join(', ')}.`,'faltantes'));
  if(r.imagen)tarjeta.append(elemento('p','Imagen ilustrativa IA','meta'));
  if(etiquetaFoto)tarjeta.append(etiquetaFoto);
  if(razones.length)tarjeta.append(elemento('p',razones.slice(0,2).join(' · '),'razones-receta'));
  const ver=boton('Ver preparación',()=>mostrarDetalle(r),'ver-receta');ver.setAttribute('aria-label',`Ver preparación: ${r.nombre}`);tarjeta.append(ver);return tarjeta;
}
function mostrarDetalle(receta) {
  origenDetalle='recetas';
  recetaDetalle=receta;recetaOrigenDetalle=receta.id;const p=planDe(receta.id);
  opcionesDetalle={porciones:p?.porciones??receta.porciones,veces:p?.veces??1};
  dibujarDetalle();$('detalle').showModal();$('detalle').scrollTop=0;
}
function formPorciones(receta,porciones,veces,accion) {
  const form=elemento('form',undefined,'form-porciones');
  const crear=(nombre,valor,min,paso)=>{const label=elemento('label',nombre);const input=document.createElement('input');input.type='number';input.min=min;input.step=paso;input.required=true;input.value=valor;input.setAttribute('aria-label',`${nombre} de ${receta.nombre}`);input.dataset.foco=`${nombre}-${receta.id}`;label.append(input);form.append(label);return input;};
  const por=crear('Porciones',porciones,0.1,'any'),v=crear('Preparaciones',veces,1,1);v.max=100;
  const aplicar=elemento('button','Aplicar','secundario');aplicar.type='submit';aplicar.dataset.foco=`porciones-${receta.id}`;form.append(aplicar);
  form.addEventListener('submit',e=>{e.preventDefault();if(form.reportValidity()){try{motor.requerimientos(receta,por.valueAsNumber,v.valueAsNumber);accion(por.valueAsNumber,v.valueAsNumber);}catch(error){mensajeGuardado(error.message);}}});return form;
}
function dibujarDetalle() {
  if(!recetaDetalle)return;
  conservarFoco($('contenido-detalle'),()=>{
    const r=recetaDetalle,op=opcionesDetalle,info=motor.disponibilidad(r,estado,op.porciones,op.veces),p=planDe(r.id);
    $('etiqueta-prueba-detalle').hidden=r.datosDePrueba!==true;
    const titulo=elemento('h2',r.nombre);titulo.id='titulo-detalle';titulo.tabIndex=-1;
    const arriba=elemento('div',undefined,'detalle-arriba'),general=elemento('section',undefined,'detalle-informacion');
    general.append(titulo,metadatosReceta(r,op.porciones,op.veces));
    arriba.append(general,formPorciones(r,op.porciones,op.veces,(porciones,veces)=>{
      opcionesDetalle={porciones,veces};if(planDe(r.id))cambiar(s=>motor.cambiarPorciones(s,r.id,porciones,veces));else dibujarDetalle();
    }));
    const panel=elemento('section',undefined,'detalle-ingredientes-panel'),lista=elemento('ul',undefined,'ingredientes-detalle');
    for(const i of info.lineas){
      const fila=elemento('li');fila.dataset.disponible=String(i.completo);const desc=elemento('div',undefined,'detalle-ingrediente-texto');
      const simbolo=elemento('span',i.completo?'✓':'+','simbolo-estado');simbolo.setAttribute('aria-hidden','true');
      const nombre=elemento('span',`${cantidadLegible(i.cantidad,i.unidad)} · ${i.nombre}`);
      desc.append(simbolo,dibujoIngredienteInicio(motor.catalogo.get(i.ingredienteId)),nombre);fila.append(desc);
      const esta=p?.ingredientes.some(x=>x.clave===i.clave);
      const acciones=elemento('div',undefined,'acciones-ingrediente');
      if(esta)acciones.append(elemento('span','En tu lista','estado-compras-ingrediente'));
      if(!i.completo||esta){
        const accion=boton(esta?'Quitar':'+',()=>cambiar(s=>esta?motor.quitarVinculo(s,r.id,i.clave):motor.agregarNecesidades(s,r.id,[i.clave],op.porciones,op.veces)));
        if(!esta){const icono=document.createElement('img');icono.src='./imagenes/carrito.svg';icono.alt='';icono.width=18;icono.height=18;accion.prepend(icono);}
        accion.dataset.foco=`comprar-${i.clave}`;accion.setAttribute('aria-label',`${esta?'Quitar de compras':'Añadir a compras'}: ${i.nombre}`);
        acciones.append(accion);fila.append(acciones);
      }
      lista.append(fila);
    }
    const pie=elemento('div',undefined,'pie-ingredientes');
    if(info.completa)pie.append(elemento('p','Tenés todos los ingredientes','todos-disponibles'));
    if(!p||info.lineas.some(i=>!p.ingredientes.some(x=>x.clave===i.clave))){
      const todos=boton('Añadir receta a compras',()=>cambiar(s=>motor.agregarNecesidades(s,r.id,info.lineas.map(i=>i.clave),op.porciones,op.veces)),'');todos.id='todos-faltantes';todos.dataset.foco='todos-faltantes';const carrito=document.createElement('img');carrito.src='./imagenes/carrito.svg';carrito.alt='';carrito.width=18;carrito.height=18;todos.prepend(carrito);pie.append(todos);
    }else pie.append(elemento('p','Receta incluida en compras','nota-acciones'));
    const editar=boton('Editar lo que tengo',()=>{$('detalle').dataset.editarDespensa='true';$('detalle').close();});editar.id='editar-despensa-detalle';editar.dataset.foco='editar-despensa';pie.append(editar);
    if(esPropia(r)){
      const accionesPropias=elemento('div',undefined,'editor-acciones');
      accionesPropias.append(boton('Editar receta',()=>{$('detalle').close();setTimeout(()=>editor.abrir(r),0)}));
      pie.append(accionesPropias);
    }
    const sobre=elemento('details',undefined,'sobre-datos');sobre.append(elemento('summary','Sobre estos datos'),elemento('p',`${r.datosDePrueba===true?'Receta de prueba. ':''}Las cantidades y equivalencias nutricionales pueden ser aproximadas. La disponibilidad usa presencia de ingredientes. No se garantiza seguridad alimentaria.`));
    if(r.fuente){const fuente=elemento('p',`Fuente: ${r.fuente.sitio || r.fuente.autor || 'Paquete aportado'}. `);if(/^https:\/\//.test(r.fuente.url||'')){const enlace=elemento('a','Consultar receta original');enlace.href=r.fuente.url;enlace.target='_blank';enlace.rel='noopener noreferrer';fuente.append(enlace);}sobre.append(fuente);}
    panel.append(elemento('h3','Ingredientes'),elemento('p','✓ Lo tenés · + Te falta','leyenda-ingredientes'),lista,pie,sobre);arriba.append(panel);
    const figura=elemento('figure',undefined,`detalle-imagen ${r.imagen||r.imagenId?'con-imagen-local':''}`),leyenda=elemento('figcaption');figura.append(imagenReceta(r,leyenda),leyenda);
    const preparacion=elemento('section',undefined,'detalle-preparacion'),pasos=elemento('ol');r.pasos.forEach(paso=>pasos.append(elemento('li',paso)));preparacion.append(elemento('h3','Preparación'),pasos);
    const factor=op.porciones/r.porciones*op.veces;
    const escalada={...r,porciones:op.porciones*op.veces,ingredientes:r.ingredientes.map(i=>({...i,cantidad:i.cantidad*factor,gramosComestibles:Number.isFinite(i.gramosComestibles)?i.gramosComestibles*factor:i.gramosComestibles}))};
    const calculo=calcularNutrientes(escalada,ingredientes),nutricion=elemento('section',undefined,'nutricion');nutricion.append(elemento('h3','Estimación nutricional'));
    if(calculo.completo){
      const tabla=elemento('table');const head=elemento('tr');['','Receta completa'+(op.veces>1?` × ${op.veces}`:''),'Por porción'].forEach(t=>{const th=elemento('th',t);th.scope='col';head.append(th);});const thead=elemento('thead');thead.append(head);tabla.append(thead);const body=elemento('tbody');
      for(const [key,nombre,unidad] of [['kcal','Energía','kcal'],['proteinasG','Proteínas','g'],['carbohidratosG','Carbohidratos','g'],['grasasG','Grasas','g']]){const tr=elemento('tr'),th=elemento('th',nombre);th.scope='row';tr.append(th,elemento('td',`${calculo.total[key]} ${unidad}`),elemento('td',`${calculo.porPorcion[key]} ${unidad}`));body.append(tr);}tabla.append(body);nutricion.append(tabla);
    }else nutricion.append(elemento('p','Estimación incompleta: faltan cantidades o perfiles. Los valores desconocidos no son cero.'));
    const notas=elemento('details');notas.append(elemento('summary','Cómo se estima'),elemento('p','Se usa el motor del paquete con perfiles por 100 g, cantidades y equivalencias aportadas. No ajusta pérdidas de cocción ni absorción. Las hojas de té coladas no se cuentan como alimento ingerido.'));
    if(r.rendimientoEstimado)notas.append(elemento('p','El rendimiento de esta receta incluye una adaptación editorial del paquete.'));
    nutricion.append(notas);$('contenido-detalle').replaceChildren(arriba,figura,preparacion,nutricion);
  });
}
function actualizarRecetario() {
  recetas=[...recetasBase,...recetasUsuario.recetas];
  recetas.forEach(r=>{r.categoriasAutomaticas=clasificarReceta(r,ingredientes);});
  motor=crearMotorCantidades(recetas,ingredientes,equivalencias);
  recetas.forEach(r=>motor.requerimientos(r));
  $('continuar-borrador').hidden=!recetasUsuario.borrador;
  actualizar();
}
function desconectarPlanPropio(receta) {
  const copia=separarNecesidadesReceta(estado,receta,motor);
  invalidarRecetas(copia,[receta.id]);
  const guardado=guardarEstado(almacenamientoLocal,copia,motor,bloqueado);
  return {ok:guardado.ok,copia,mensaje:guardado.mensaje};
}
function restaurarTrasFalloReceta(anterior,fallo) {
  if(!anterior)return fallo;
  const restaurado=guardarEstado(almacenamientoLocal,anterior,motor,bloqueado);
  if(restaurado.ok){estado=anterior;return fallo;}
  // El snapshot desconectado conserva necesidades y compras. No fingir que
  // volvió la asociación: bloquear nuevas escrituras hasta recargar.
  bloqueado=true;
  actualizar();
  const mensaje='No se pudo completar la receta ni confirmar la restauración del vínculo anterior. Recargá Avanzi antes de seguir; las necesidades anteriores se guardaron como compras sin asociación antes del fallo.';
  mensajeGuardado(mensaje);
  return {ok:false,mensaje};
}
async function guardarRecetaPropia(datos,archivo,quitarImagen,esBorrador,duplicar) {
  if(recetasUsuarioBloqueadas)return {ok:false,mensaje:'Tus recetas guardadas no se pudieron recuperar. No se sobrescribirán.'};
  try{almacenamientoSeguro.comprobar();}catch(error){return {ok:false,mensaje:error.message};}
  if(esBorrador&&recetasUsuario.borrador&&recetasUsuario.borrador.id!==datos.id&&datos.id&&
    !confirm('Ya hay un borrador distinto. ¿Querés reemplazarlo al guardar este?'))return {ok:false,mensaje:'El borrador anterior se conservó.'};
  const id=duplicar||!datos.id?nuevoIdReceta():datos.id;
  const anterior=recetasUsuario.recetas.find(r=>r.id===id);
  const entrada={...datos,id,imagenId:duplicar?null:datos.imagenId};
  if(quitarImagen)entrada.imagenId=null;
  if(!esBorrador){
    try{prepararRecetaUsuario(entrada,motor,ingredientes,recetasBase);}catch(error){return {ok:false,mensaje:error.message};}
  }else if(typeof entrada.nombre!=='string'||entrada.nombre.length>100||entrada.ingredientes.length>80||entrada.pasos.length>60){return {ok:false,mensaje:'El borrador contiene textos o filas demasiado largos.'};}
  let fotoNueva=null;
  try{
    if(archivo){const blob=await optimizarFoto(archivo);fotoNueva=`foto-${nuevoIdReceta().slice(4)}`;await guardarFoto(fotoNueva,blob);entrada.imagenId=fotoNueva;}
  }catch(error){return {ok:false,mensaje:`No se guardó la foto: ${error.message} Podés quitarla y conservar el resto de la receta.`};}
  let preparada;
  if(!esBorrador){try{preparada=prepararRecetaUsuario(entrada,motor,ingredientes,recetasBase);}catch(error){if(fotoNueva)await borrarFoto(fotoNueva).catch(()=>{});return {ok:false,mensaje:error.message};}}
  const borradorAnterior=recetasUsuario.borrador;
  const doc=copiar(recetasUsuario);
  if(esBorrador)doc.borrador=entrada;
  else {doc.recetas=doc.recetas.filter(r=>r.id!==id);doc.recetas.push(preparada);if(!datos.id||doc.borrador?.id===id)doc.borrador=null;}
  let anteriorEstado=null;
  if(!esBorrador&&anterior&&planDe(id)){
    const clavesAntes=new Set(motor.requerimientos(anterior).map(n=>n.clave));
    const clavesDespues=new Set(motor.requerimientos(preparada).map(n=>n.clave));
    if([...clavesAntes].some(k=>!clavesDespues.has(k))){
      if(!confirm('La receta incluida en compras cambia sus ingredientes. Sus necesidades actuales quedarán en la lista sin asociación. ¿Continuar?')){if(fotoNueva)await borrarFoto(fotoNueva).catch(()=>{});return {ok:false,mensaje:'Edición cancelada.'};}
      anteriorEstado=copiar(estado);const separado=desconectarPlanPropio(anterior);
      if(!separado.ok){if(fotoNueva)await borrarFoto(fotoNueva).catch(()=>{});return {ok:false,mensaje:separado.mensaje};}
      estado=separado.copia;
    }
  }
  const guardado=guardarRecetasUsuario(almacenamientoLocal,doc,recetasUsuarioBloqueadas,motor,ingredientes,recetasBase);
  if(!guardado.ok){
    if(fotoNueva)await borrarFoto(fotoNueva).catch(()=>{});
    return restaurarTrasFalloReceta(anteriorEstado,guardado);
  }
  recetasUsuario=doc;
  for(const idFoto of fotosSinReferencias([anterior?.imagenId,datos.imagenId,borradorAnterior?.imagenId],doc)){
    liberarFotoLocal(idFoto);
    await borrarFoto(idFoto).catch(()=>{mensajeGuardado('La receta se guardó, pero no se pudo limpiar una foto obsoleta.');});
  }
  actualizarRecetario();
  return {ok:true};
}
async function borrarRecetaPropia(receta) {
  if(recetasUsuarioBloqueadas)return {ok:false,mensaje:'Los datos locales de recetas propias están bloqueados.'};
  try{almacenamientoSeguro.comprobar();}catch(error){return {ok:false,mensaje:error.message};}
  const anteriorEstado=planDe(receta.id)?copiar(estado):null;
  if(anteriorEstado){const separado=desconectarPlanPropio(receta);if(!separado.ok)return separado;estado=separado.copia;}
  const doc=copiar(recetasUsuario);doc.recetas=doc.recetas.filter(r=>r.id!==receta.id);
  const r=guardarRecetasUsuario(almacenamientoLocal,doc,false,motor,ingredientes,recetasBase);
  if(!r.ok)return restaurarTrasFalloReceta(anteriorEstado,r);
  recetasUsuario=doc;
  if(favoritos.ids.includes(receta.id)){
    const limpio=guardarFavoritos(almacenamientoLocal,quitarFavorito(favoritos,receta.id),favoritosBloqueados);
    if(limpio.ok)favoritos=limpio.datos;
    else mensajeGuardado(`La receta se eliminó, pero no se pudo limpiar su favorito. ${limpio.mensaje}`);
  }
  actualizarRecetario();
  for(const idFoto of fotosSinReferencias([receta.imagenId],doc)){
    liberarFotoLocal(idFoto);
    await borrarFoto(idFoto).catch(()=>{mensajeGuardado('La receta se borró; no se pudo limpiar su foto anterior.');});
  }
  return {ok:true};
}
async function descartarBorrador() {
  if(recetasUsuarioBloqueadas)return {ok:false,mensaje:'Los datos locales de recetas propias están bloqueados.'};
  try{almacenamientoSeguro.comprobar();}catch(error){return {ok:false,mensaje:error.message};}
  const anterior=recetasUsuario.borrador,doc={...recetasUsuario,borrador:null};
  const guardado=guardarRecetasUsuario(almacenamientoLocal,doc,false,motor,ingredientes,recetasBase);
  if(!guardado.ok)return guardado;
  recetasUsuario=doc;actualizarRecetario();
  for(const foto of fotosSinReferencias([anterior?.imagenId],doc)){liberarFotoLocal(foto);await borrarFoto(foto).catch(()=>mensajeGuardado('El borrador se descartó; no se pudo limpiar su foto.'));}
  return {ok:true};
}
function filaCompra(grupo) {
  const contenedor=elemento('article',undefined,grupo.completo?'compra-completada':'');contenedor.dataset.ingrediente=grupo.id;
  const fila=elemento('div',undefined,'compra-fila'),etiqueta=elemento('label',undefined,'compra-etiqueta');
  const check=document.createElement('input');check.type='checkbox';check.checked=grupo.completo;check.dataset.foco=`compra-${grupo.id}`;check.setAttribute('aria-label',`${grupo.completo?'Reabrir todas las subtareas de':'Completar todas las subtareas de'} ${grupo.nombre}`);
  check.addEventListener('change',()=>cambiar(s=>motor.marcarIngrediente(s,grupo.id,check.checked)));
  const nombre=elemento('span',grupo.nombre);
  const pendientes=grupo.variantes.filter(v=>!v.completo).map(v=>cantidadLegible(v.desconocida?null:v.pendiente,v.unidad));
  nombre.append(elemento('small',grupo.completo?'Todo completado':`Pendiente: ${pendientes.join(' · ')}`,'cantidad-compra'));
  etiqueta.append(check,dibujoIngredienteInicio(motor.catalogo.get(grupo.id)),nombre);
  const eliminar=boton('×',()=>cambiar(s=>motor.quitarCompra(s,grupo.id)),'eliminar-compra');eliminar.setAttribute('aria-label',`Eliminar ${grupo.nombre} de compras`);eliminar.dataset.foco=`eliminar-${grupo.id}`;fila.append(etiqueta,eliminar);
  const detalles=elemento('div',undefined,'subtareas-compra');
  for(const v of grupo.variantes){
    for(const origen of v.origenes){
      const sub=elemento('label',undefined,`subtarea-compra${origen.completado?' subtarea-completada':''}`),casilla=document.createElement('input');
      casilla.type='checkbox';casilla.checked=origen.completado;casilla.dataset.foco=`sub-${origen.id}`;
      casilla.setAttribute('aria-label',`${origen.completado?'Reabrir':'Completar'} ${cantidadLegible(origen.cantidad,v.unidad)} de ${grupo.nombre} para ${origen.nombre}`);
      casilla.addEventListener('change',()=>cambiar(s=>motor.marcarSubtarea(s,grupo.id,origen.id,casilla.checked)));
      sub.append(casilla,elemento('span',`${origen.nombre} · ${cantidadLegible(origen.cantidad,v.unidad)}`));detalles.append(sub);
    }
  }
  contenedor.append(fila,detalles);return contenedor;
}
function agregarFilasCompras(contenedor,grupos) {
  if(!comprasAgrupadas){grupos.forEach(g=>contenedor.append(filaCompra(g)));return;}
  for(const categoria of CATEGORIAS){
    const items=grupos.filter(g=>motor.catalogo.get(g.id).categoria===categoria);
    if(!items.length)continue;
    const seccion=elemento('section',undefined,'grupo-compras');
    seccion.append(elemento('h3',categoria));items.forEach(g=>seccion.append(filaCompra(g)));contenedor.append(seccion);
  }
}
function subtareaReceta(grupo,variante,origen) {
  const fila=elemento('label',undefined,`subtarea-compra receta-ingrediente${origen.completado?' subtarea-completada':''}`);
  const casilla=document.createElement('input');casilla.type='checkbox';casilla.checked=origen.completado;
  casilla.dataset.foco=`sub-${origen.id}`;
  casilla.setAttribute('aria-label',`${origen.completado?'Reabrir':'Completar'} ${grupo.nombre} para ${origen.nombre}`);
  casilla.addEventListener('change',()=>cambiar(s=>motor.marcarSubtarea(s,grupo.id,origen.id,casilla.checked)));
  fila.append(casilla,dibujoIngredienteInicio(motor.catalogo.get(grupo.id)));
  const texto=elemento('span',grupo.nombre);texto.append(elemento('small',cantidadLegible(origen.cantidad,variante.unidad),'cantidad-compra'));
  fila.append(texto);return fila;
}
function dibujarComprasPorReceta(grupos) {
  const cont=$('items-recetas'),abiertos=new Map([...cont.querySelectorAll('details[data-receta]')].map(d=>[d.dataset.receta,d.open]));
  const origenes=new Map();
  for(const grupo of grupos)for(const variante of grupo.variantes)for(const origen of variante.origenes){
    const clave=origen.recetaId||'sin-receta';
    if(!origenes.has(clave))origenes.set(clave,[]);
    origenes.get(clave).push({grupo,variante,origen});
  }
  const frag=document.createDocumentFragment();
  for(const plan of estado.planes){
    const receta=motor.recetario.get(plan.recetaId);if(!receta)continue;
    const detalle=elemento('details',undefined,'compra-receta');detalle.dataset.receta=plan.recetaId;detalle.open=abiertos.get(plan.recetaId)??true;
    const lineas=origenes.get(plan.recetaId)||[];
    detalle.append(elemento('summary',`${receta.nombre} · ${lineas.filter(x=>!x.origen.completado).length} pendientes`));
    const interior=elemento('div',undefined,'compra-receta-interior');
    for(const {grupo,variante,origen} of lineas)interior.append(subtareaReceta(grupo,variante,origen));
    const acciones=elemento('div',undefined,'compra-receta-acciones');
    const todas=plan.ingredientes.every(i=>i.completado===true);
    const marcar=boton(todas?'Reabrir todos':'Marcar todos',()=>cambiar(s=>motor.marcarReceta(s,plan.recetaId,!todas)),'secundario');
    marcar.dataset.foco=`marcar-receta-${plan.recetaId}`;
    const quitar=boton('Eliminar receta',()=>cambiar(s=>{invalidarRecetas(s,[plan.recetaId]);motor.quitarReceta(s,plan.recetaId);}),'secundario');
    quitar.dataset.foco=`quitar-receta-${plan.recetaId}`;
    acciones.append(marcar,quitar);interior.append(acciones);detalle.append(interior);frag.append(detalle);
  }
  const sueltas=origenes.get('sin-receta');
  if(sueltas?.length){
    const detalle=elemento('details',undefined,'compra-receta');detalle.dataset.receta='sin-receta';detalle.open=abiertos.get('sin-receta')??true;
    detalle.append(elemento('summary',`Sin receta · ${sueltas.filter(x=>!x.origen.completado).length} pendientes`));
    const interior=elemento('div',undefined,'compra-receta-interior');
    for(const {grupo,variante,origen} of sueltas)interior.append(subtareaReceta(grupo,variante,origen));
    detalle.append(interior);frag.append(detalle);
  }
  if(!frag.childNodes.length)frag.append(elemento('p','No tenés recetas en compras.','compras-vacias'));
  cont.replaceChildren(frag);
}
function dibujarCompras() {
  const focoAnterior=$('compras').contains(document.activeElement)?document.activeElement.dataset.foco:null;
  const compradoAbierto=$('comprados')?.open;
  const grupos=motor.resumenCompras(estado);
  conservarFoco($('items-compras'),()=>{
    const pendientes=grupos.filter(g=>!g.completo),completas=grupos.filter(g=>g.completo);
    const frag=document.createDocumentFragment();
    agregarFilasCompras(frag,pendientes);
    if(!pendientes.length)frag.append(elemento('p','No tenés compras pendientes.','compras-vacias'));
    if(completas.length){const comprado=elemento('details');comprado.id='comprados';comprado.open=compradoAbierto||false;comprado.append(elemento('summary',`Compras completadas (${completas.length})`));agregarFilasCompras(comprado,completas);frag.append(comprado);}
    $('items-compras').replaceChildren(frag);
    const foco=document.activeElement?.dataset.foco;if(foco){const id=foco.replace(/^compra-/,'');if(completas.some(g=>g.id===id))$('comprados').open=true;}
  });
  // Si el control enfocado pasó a Comprados, abrirlo antes de devolverle foco.
  if(document.activeElement?.closest('#comprados'))$('comprados').open=true;
  dibujarComprasPorReceta(grupos);
  $('items-compras').hidden=vistaCompras!=='ingrediente';$('items-recetas').hidden=vistaCompras!=='receta';
  $('agrupar-compras').hidden=vistaCompras!=='ingrediente';$('agrupar-compras').setAttribute('aria-pressed',String(comprasAgrupadas));
  $('vista-ingrediente').setAttribute('aria-pressed',String(vistaCompras==='ingrediente'));
  $('vista-receta').setAttribute('aria-pressed',String(vistaCompras==='receta'));
  const posibles=motor.posibilidades(estado),lista=elemento('ul');posibles.forEach(r=>lista.append(elemento('li',r.nombre)));
  $('posibilidades-compras').replaceChildren(elemento('h3','Después de comprar'),posibles.length?lista:elemento('p','Todavía no hay recetas que se completen con las compras pendientes.'));
  if(focoAnterior){const destino=[...$('compras').querySelectorAll('[data-foco]')].find(n=>n.dataset.foco===focoAnterior&&!n.closest('[hidden]'));if(destino?.closest('#comprados'))$('comprados').open=true;if(destino?.closest('details[data-receta]'))destino.closest('details[data-receta]').open=true;(destino||$('titulo-compras')).focus({preventScroll:true});}
  $('estado-compras').textContent=`Pendientes · ${motor.resumenCompras(estado).filter(g=>!g.completo).length}`;
  $('vaciar-compras').disabled=!estado.planes.length&&!estado.manuales.length;if($('vaciar-compras').disabled)$('confirmar-vaciado').hidden=true;
  const recompensas=estado.recompensas,sesion=recompensas?.sesion,dia=diaLocal(new Date().toISOString());
  const premiadaHoy=recompensas?.movimientos.some(m=>m.tipo==='premio'&&m.dia===dia);
  $('iniciar-sesion').hidden=!!sesion;$('iniciar-sesion').disabled=!!premiadaHoy;
  $('finalizar-sesion').hidden=!sesion;$('cancelar-sesion').hidden=!sesion;
  $('resumen-sesion').textContent=sesion
    ?`Jornada en curso · ${sesion.candidatos.length} recetas con faltantes al comenzar.`
    :premiadaHoy?'Ya recibiste monedas por una jornada hoy. Podés seguir usando la lista normalmente.'
    :'Iniciá una jornada para recibir monedas por recetas que completes con compras nuevas.';
  const historicas=estado.historialSubtareas||[],historial=$('historial-compras'),listaHistorial=$('lista-historial-compras');
  historial.hidden=!historicas.length;listaHistorial.replaceChildren();
  historial.querySelector('summary').textContent=`Compras anteriores (${historicas.length})`;
  for(const h of [...historicas].reverse()){
    const nombre=ingredientes.find(i=>i.id===h.ingredienteId)?.nombre||h.ingredienteId;
    listaHistorial.append(elemento('li',`${nombre} · ${cantidadLegible(h.cantidad,h.unidad)} · ${h.nombreReceta} · agotado ${new Date(h.fechaAgotamiento).toLocaleDateString('es-AR')}`));
  }
}
function avisoPerfil(texto,error=false) {
  const aviso=$('error-perfil');aviso.textContent=texto;aviso.hidden=!texto;aviso.dataset.error=String(error);
}
function rellenarPerfil() {
  const campos={nombre:perfil?.nombre??'',edad:perfil?.edad??'',peso:perfil?.pesoKg??'',altura:perfil?.alturaCm??'',
    actividad:perfil?.actividad??'',objetivo:perfil?.objetivo??'',coeficiente:perfil?.coeficiente??'',alimentacion:perfil?.alimentacion??''};
  for(const [id,valor] of Object.entries(campos))$(`perfil-${id}`).value=valor;
  $('perfil-usar-estimacion').checked=perfil?.usarEstimacion===true;
  $('perfil-fuerza').checked=perfil?.entrenaFuerza===true;
}
function mostrarEstimaciones() {
  const panel=$('estimaciones-perfil');panel.replaceChildren();
  if(!perfil)return;
  const datos=estimarPerfil(perfil);
  panel.append(elemento('h3','Estimaciones orientativas'));
  if(datos.energia){
    panel.append(elemento('p',`Gasto diario estimado · aprox. ${datos.energia.diario} kcal/día`,'energia-perfil'));
    panel.append(elemento('p',`En reposo: aprox. ${datos.energia.reposo} kcal/día.`,'nota-perfil'));
  }else panel.append(elemento('p','No hay estimación energética. Podés completar los datos más adelante; las recetas siguen disponibles.'));
  const macros=elemento('div',undefined,'macros-perfil');
  const macro=(nombre,valor,clase)=>{const item=elemento('p',undefined,clase);item.append(elemento('strong',nombre),document.createTextNode(`Aprox. ${valor} g/día`));macros.append(item);};
  if(datos.proteinas)macro('Proteínas',`${datos.proteinas.min}${datos.proteinas.max!==datos.proteinas.min?`–${datos.proteinas.max}`:''}`,'macro-proteinas');
  if(datos.carbohidratos)macro('Carbohidratos',`${datos.carbohidratos.min}–${datos.carbohidratos.max}`,'macro-carbohidratos');
  if(datos.grasas)macro('Grasas',`${datos.grasas.min}–${datos.grasas.max}`,'macro-grasas');
  panel.append(macros);
}
function actualizar() {
  mostrarDespensa();mostrarSeleccion();mostrarRecetas();
  mostrarEstimaciones();$('eliminar-perfil').hidden=!perfil||perfilBloqueado;
  $('contador-compras').textContent=motor.resumenCompras(estado).filter(g=>!g.completo).length;
  const monedas=saldoMonedas(estado);$('contador-monedas').textContent=`✦ ${monedas}`;$('contador-monedas').setAttribute('aria-label',`Monedas: ${monedas}`);
  $('resumen').textContent=`${recetas.filter(r=>disponibilidad(r).completa).length} recetas con todos sus ingredientes. Las compras pendientes no cuentan como disponibles.`;
  if($('detalle').open)dibujarDetalle();if($('compras').open)dibujarCompras();
}
function conectarControles() {
  $('crear-receta').addEventListener('click',()=>{
    if(recetasUsuario.borrador&&!confirm('Ya tenés un borrador. ¿Querés reemplazarlo? El borrador anterior solo se descarta cuando guardes el nuevo.'))return;
    editor.abrir();
  });
  $('continuar-borrador').addEventListener('click',()=>editor.abrir(recetasUsuario.borrador,{borrador:true}));
  for(const seccion of ['despensa','recetas','perfil'])$(`tab-${seccion}`).addEventListener('click',()=>{recetaDestacadaIds=null;cambiarSeccion(seccion);if(seccion==='despensa')mostrarDespensa();});
  $('form-perfil').addEventListener('submit',evento=>{
    evento.preventDefault();if(!$('form-perfil').reportValidity())return;
    const numero=id=>$(id).value.trim()===''?null:$(id).valueAsNumber;
    const entrada={version:1,nombre:$('perfil-nombre').value,objetivo:$('perfil-objetivo').value||null,
      edad:numero('perfil-edad'),pesoKg:numero('perfil-peso'),alturaCm:numero('perfil-altura'),
      actividad:$('perfil-actividad').value||null,coeficiente:$('perfil-coeficiente').value||null,alimentacion:$('perfil-alimentacion').value||null,
      usarEstimacion:$('perfil-usar-estimacion').checked,entrenaFuerza:$('perfil-fuerza').checked};
    const resultado=guardarPerfil(almacenamientoLocal,entrada,perfilBloqueado);
    if(!resultado.ok){avisoPerfil(resultado.mensaje,true);return;}
    perfil=resultado.perfil;avisoPerfil('Perfil guardado. Solo se conserva en este navegador.');actualizar();
  });
  $('eliminar-perfil').addEventListener('click',()=>{$('confirmar-eliminar-perfil').hidden=false;$('cancelar-eliminar-perfil').focus();});
  $('cancelar-eliminar-perfil').addEventListener('click',()=>{$('confirmar-eliminar-perfil').hidden=true;$('eliminar-perfil').focus();});
  $('aceptar-eliminar-perfil').addEventListener('click',()=>{
    const resultado=eliminarPerfil(almacenamientoLocal,perfilBloqueado);
    if(!resultado.ok){avisoPerfil(resultado.mensaje,true);return;}
    perfil=null;$('confirmar-eliminar-perfil').hidden=true;rellenarPerfil();
    avisoPerfil('Perfil eliminado. Tus recetas, despensa y compras se conservaron.');actualizar();$('perfil-nombre').focus();
  });
  $('ver-cocinar').addEventListener('click',()=>{cambiarSeccion('recetas');$('titulo-recetas').tabIndex=-1;$('titulo-recetas').focus();$('titulo-recetas').scrollIntoView({block:'start'});});
  $('buscar-ingredientes').addEventListener('input',mostrarDespensa);$('categoria').addEventListener('change',mostrarDespensa);
  for(const id of ['busqueda','filtro','categoria-recetas'])$(id).addEventListener(id==='busqueda'?'input':'change',mostrarRecetas);
  const cerrarAcciones=()=>{$('acciones-despensa').open=false;$('acciones-despensa').querySelector('summary').focus();};
  $('todo').addEventListener('click',()=>{cambiar(s=>{for(const i of ingredientes)motor.establecerPresencia(s,i.id,true);});cerrarAcciones();});
  $('nada').addEventListener('click',()=>{$('confirmar-vaciar-despensa').hidden=false;$('aceptar-vaciar-despensa').focus();});
  $('cancelar-vaciar-despensa').addEventListener('click',()=>{$('confirmar-vaciar-despensa').hidden=true;$('nada').focus();});
  $('aceptar-vaciar-despensa').addEventListener('click',()=>{
    if(!cambiar(s=>motor.vaciarDespensa(s)))return;
    $('confirmar-vaciar-despensa').hidden=true;
    const fijados=estado.fijados?.length||0;
    const porCompra=ingredientes.filter(i=>!(estado.fijados||[]).includes(i.id)&&motor.tieneIngrediente(estado,i.id)).length;
    $('estado-vaciado-despensa').textContent=`Lo que tengo se vació. Permanecen ${fijados} fijados y ${porCompra} disponibles por compras completadas.`;
    $('estado-vaciado-despensa').hidden=false;$('estado-vaciado-despensa').focus();
  });
  $('cancelar-agotado').addEventListener('click',()=>{
    ingredientePorAgotar=null;$('confirmar-agotado').hidden=true;
    focoAntesDeAgotar?.focus({preventScroll:true});focoAntesDeAgotar=null;
  });
  $('confirmar-agotado').addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();$('cancelar-agotado').click();}
  });
  $('aceptar-agotado').addEventListener('click',()=>{
    const id=ingredientePorAgotar;if(!id)return;
    if((estado.fijados||[]).includes(id)){
      $('confirmar-agotado').hidden=true;ingredientePorAgotar=null;focoAntesDeAgotar=null;
      $('aviso-agotado').textContent='Primero desfijá el ingrediente con la chincheta.';$('aviso-agotado').hidden=false;
      return;
    }
    if(!agotarDesdeDespensa(id))return;
    ingredientePorAgotar=null;focoAntesDeAgotar=null;$('confirmar-agotado').hidden=true;
    [...$('ingredientes').querySelectorAll('[data-foco]')].find(n=>n.dataset.foco===`stock-${id}`)?.focus({preventScroll:true});
  });
  $('acciones-despensa').addEventListener('keydown',e=>{if(e.key==='Escape'&&$('acciones-despensa').open){e.preventDefault();cerrarAcciones();}});
  document.addEventListener('click',e=>{if(!$('acciones-despensa').contains(e.target))$('acciones-despensa').open=false;});
  $('cerrar-detalle').addEventListener('click',()=>$('detalle').close());
  $('detalle').addEventListener('close',()=>{
    if($('detalle').dataset.editarDespensa==='true'){
      delete $('detalle').dataset.editarDespensa;
      recetaDestacadaIds=new Set(recetaDetalle.ingredientes.map(i=>i.ingredienteId||i.id));
      $('categoria').value='Todos';$('buscar-ingredientes').value='';
      cambiarSeccion('despensa');mostrarDespensa();$('buscar-ingredientes').focus();$('titulo-despensa').scrollIntoView({block:'start'});
    }
    else ($(origenDetalle).querySelector(`.tarjeta[data-receta="${recetaOrigenDetalle}"] .ver-receta`)||$(`tab-${origenDetalle}`)).focus();recetaDetalle=null;
  });
  $('abrir-compras').addEventListener('click',()=>{$('confirmar-vaciado').hidden=true;dibujarCompras();$('compras').showModal();$('compras').scrollTop=0;});
  $('iniciar-sesion').addEventListener('click',()=>{
    if(!cambiarSeguro(s=>iniciarSesion(s,motor)))return;
    $('premio-sesion').hidden=true;$('finalizar-sesion').focus();
  });
  $('cancelar-sesion').addEventListener('click',()=>{
    if(!cambiarSeguro(s=>cancelarSesion(s)))return;
    $('premio-sesion').hidden=true;$('iniciar-sesion').focus();
  });
  $('finalizar-sesion').addEventListener('click',()=>{
    let resultado;
    if(!cambiarSeguro(s=>{resultado=finalizarSesion(s,motor);}))return;
    const panel=$('premio-sesion');panel.replaceChildren();
    if(resultado.monedas){
      panel.append(elemento('strong',`¡Bien hecho! Ganaste ${resultado.monedas} monedas.`));
      panel.append(elemento('p',`Ahora podés preparar: ${resultado.recetas.join(', ')}.`));
    }else panel.append(elemento('p','Jornada finalizada sin nuevas recetas disponibles. Tus compras se conservaron.'));
    panel.hidden=false;panel.focus();
  });
  for(const [vista,id] of [['ingrediente','vista-ingrediente'],['receta','vista-receta']])$(id).addEventListener('click',()=>{vistaCompras=vista;dibujarCompras();$(id).focus();});
  $('agrupar-compras').addEventListener('click',()=>{comprasAgrupadas=!comprasAgrupadas;dibujarCompras();$('agrupar-compras').focus();});
  $('cerrar-compras').addEventListener('click',()=>$('compras').close());$('compras').addEventListener('close',()=>$('abrir-compras').focus());
  $('vaciar-compras').addEventListener('click',()=>{$('confirmar-vaciado').hidden=false;$('cancelar-vaciar').focus();});
  $('cancelar-vaciar').addEventListener('click',()=>{$('confirmar-vaciado').hidden=true;$('vaciar-compras').focus();});
  $('confirmar-vaciar').addEventListener('click',()=>{cambiar(s=>{invalidarRecetas(s,s.planes.map(p=>p.recetaId));s.planes=[];s.manuales=[];});$('titulo-compras').focus();});
  $('reintentar-guardado').addEventListener('click',guardar);
}
async function iniciar() {
  try{
    const cargar=async ruta=>{const r=await fetch(ruta);if(!r.ok)throw new Error(`No se pudo cargar ${ruta} (HTTP ${r.status}).`);return r.json();};
    // Todos los catálogos y equivalencias se validan antes de acceder al estado persistente.
    const [r,i,eq,compat]=await Promise.all([cargar('./datos/recetas.json'),cargar('./datos/ingredientes.json'),cargar('./datos/equivalencias_g.json'),cargar('./datos/compatibilidad.json')]);
    recetas=validarRecetas(r);ingredientes=validarIngredientes(i,recetas);
    if(!eq||!eq.pesoUnidadG||!eq.tspG||!eq.cupG||!compat?.dibujos||!compat.clasificacion)throw new Error('Equivalencias o referencias locales inválidas.');
    ingredientes=prepararIngredientes(ingredientes,compat);
    recetasBase=recetas.map(r=>({...r,categoriasAutomaticas:clasificarReceta(r,ingredientes)}));equivalencias=eq;
    motor=crearMotorCantidades(recetasBase,ingredientes,eq);
    const propias=recuperarRecetasUsuario(almacenamientoLocal,motor,ingredientes,recetasBase);
    recetasUsuario=propias.datos;recetasUsuarioBloqueadas=propias.bloqueado;
    recetas=[...recetasBase,...recetasUsuario.recetas];
    recetas.forEach(r=>{r.categoriasAutomaticas=clasificarReceta(r,ingredientes);});
    motor=crearMotorCantidades(recetas,ingredientes,eq);
    recetas.forEach(r=>motor.requerimientos(r));
    const rec=recuperarEstado(almacenamientoLocal,motor);estado=rec.estado;bloqueado=rec.bloqueado||propias.bloqueado;
    const perfilRecuperado=recuperarPerfil(almacenamientoLocal);perfil=perfilRecuperado.perfil;perfilBloqueado=perfilRecuperado.bloqueado;
    const favoritosRecuperados=recuperarFavoritos(almacenamientoLocal);favoritos=favoritosRecuperados.datos;favoritosBloqueados=favoritosRecuperados.bloqueado;
    recuperacion=rec.avisos.filter(aviso=>!aviso.includes('referencias antiguas sin coincidencia segura'));
    if(propias.mensaje)recuperacion.push(propias.mensaje);
    if(favoritosRecuperados.mensaje)recuperacion.push(favoritosRecuperados.mensaje);
    $('aviso-recuperacion').textContent=recuperacion.join(' ');$('aviso-recuperacion').hidden=!recuperacion.length;
    const prueba=recetas.filter(r=>r.datosDePrueba===true).length;
    for(const id of ['etiqueta-prueba-inicio','etiqueta-prueba-recetas','etiqueta-prueba-compras']){$(id).hidden=prueba===0;$(id).textContent=prueba===recetas.length?'Datos de prueba':'Incluye datos de prueba';}
    $('aviso-catalogo').textContent=`${prueba?`${prueba} recetas de prueba. `:''}Las cantidades y la nutrición son estimaciones del paquete aportado; algunas requieren revisión editorial. Las imágenes son ilustrativas generadas con IA.`;
    $('ayuda-catalogo').textContent='Registrá cantidades para comprobar suficiencia. Tengo todo conserva presencia sin inventar cantidades: confirmalas para cocinar.';
    editor=crearEditorRecetas({dialog:$('receta-propia-dialogo'),catalogo:ingredientes,motor,dibujoIngrediente:dibujoIngredienteInicio,guardar:guardarRecetaPropia,borrar:borrarRecetaPropia,descartar:descartarBorrador});
    prepararCategorias();prepararCategoriasRecetas();mostrarReferenciasAntiguas();conectarControles();rellenarPerfil();
    if(perfilRecuperado.mensaje)avisoPerfil(perfilRecuperado.mensaje,true);
    $('continuar-borrador').hidden=!recetasUsuario.borrador;actualizar();$('estado').hidden=true;$('aplicacion').hidden=false;$('abrir-compras').disabled=false;
  }catch(error){$('estado').textContent=`No pudimos cargar Avanzi: ${error.message} Revisá los archivos con Live Server. No se modificaron tus datos guardados.`;}
}
iniciar();
