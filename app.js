import {calcularNutrientes,clasificarReceta} from './motor_avanzi.mjs';
import {crearMotorCantidades,estadoVacio,copiar,cantidadLegible,separarNecesidadesReceta} from './planificacion.mjs';
import {recuperarEstado,guardarEstado} from './almacenamiento.mjs';
import {crearEditorRecetas} from './editor_recetas.mjs';
import {vacioRecetasUsuario,nuevoIdReceta,esPropia,prepararRecetaUsuario,recuperarRecetasUsuario,guardarRecetasUsuario} from './recetas_usuario.mjs';
import {optimizarFoto,guardarFoto,obtenerFoto,borrarFoto,fotosSinReferencias} from './fotos_usuario.mjs';
import {crearAlmacenamientoProtegido} from './persistencia_navegador.mjs';
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
  try{accion(estado);motor.detectarTransiciones(antes,estado);}catch(error){estado=antes;mensajeGuardado(error.message);return false;}
  const ok=guardar();if(!ok&&almacenamientoSeguro.desactualizado())estado=antes;
  actualizar();return ok;
}
function conservarFoco(contenedor,dibujar) {
  const activo=document.activeElement;
  const clave=contenedor.contains(activo)?activo.dataset.foco:null;
  dibujar();
  if(clave){const destino=[...contenedor.querySelectorAll('[data-foco]')].find(i=>i.dataset.foco===clave);(destino||contenedor.querySelector('h2')||$('titulo-compras')).focus({preventScroll:true});}
}
function mostrarDespensa() {
  conservarFoco($('ingredientes'),()=>{
    $('ingredientes').replaceChildren();
    const categoria=$('categoria').value,consulta=normalizar($('buscar-ingredientes').value.trim());
    $('categorias-inicio').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoria===categoria)));
    const visibles=ingredientes.filter(i=>(categoria==='Todos'||i.categoria===categoria)&&normalizar([i.nombre,...(i.aliasEs||[])].join(' ')).includes(consulta));
    $('cantidad-visible').textContent=`${visibles.length} ingredientes visibles de ${ingredientes.length}`;
    const seleccion=seleccionados();
    for(const i of visibles){
      const tarjeta=elemento('div',undefined,'tarjeta-ingrediente');
      const etiqueta=elemento('label',undefined,'ingrediente');
      const casilla=document.createElement('input');casilla.type='checkbox';casilla.value=i.id;casilla.checked=seleccion.has(i.id);casilla.dataset.foco=`stock-${i.id}`;
      casilla.addEventListener('change',()=>cambiar(s=>motor.establecerPresencia(s,i.id,casilla.checked)));
      const marca=elemento('span','✓','marca-seleccion');marca.setAttribute('aria-hidden','true');
      etiqueta.append(casilla,marca,dibujoIngredienteInicio(i),elemento('span',i.nombre,'nombre-ingrediente'));
      tarjeta.append(etiqueta);$('ingredientes').append(tarjeta);
    }
    if(!visibles.length)$('ingredientes').append(elemento('p','Sin coincidencias','vacio'));
  });
}
function mostrarSeleccion() {
  const seleccion=seleccionados(),list=$('seleccion-lista');
  const idFoco=list.contains(document.activeElement)?document.activeElement.dataset.ingrediente:null;
  const antes=[...list.querySelectorAll('button')].map(n=>n.dataset.ingrediente),pos=antes.indexOf(idFoco);
  list.replaceChildren();list.hidden=!seleccion.size;
  $('cantidad-seleccion').textContent=seleccion.size;$('cantidad-seleccion-pie').textContent=`${seleccion.size} seleccionados`;
  for(const i of ingredientes.filter(i=>seleccion.has(i.id))){
    const li=elemento('li',undefined,'seleccion-item');const quitar=boton('×',()=>cambiar(s=>motor.establecerPresencia(s,i.id,false)),'quitar-seleccion');
    quitar.dataset.ingrediente=i.id;quitar.setAttribute('aria-label',`Desmarcar ${i.nombre}`);
    li.append(quitar,dibujoIngredienteInicio(i),elemento('span',i.nombre));list.append(li);
  }
  if(idFoco){const botones=[...list.querySelectorAll('button')];(botones.find(b=>b.dataset.ingrediente===idFoco)||botones[Math.min(Math.max(0,pos),botones.length-1)]||$('buscar-ingredientes')).focus({preventScroll:true});}
}
function compararRecetas(a,b) {return numeroFaltantes(a)-numeroFaltantes(b)||(tiempo(a)??Infinity)-(tiempo(b)??Infinity)||a.nombre.localeCompare(b.nombre,'es');}
function mostrarRecetas() {
  const consulta=normalizar($('busqueda').value.trim()),filtro=$('filtro').value,categoria=$('categoria-recetas').value;
  const visibles=recetas.filter(r=>(normalizar(r.nombre).includes(consulta)||r.ingredientes.some(i=>normalizar(motor.catalogo.get(i.ingredienteId||i.id).nombre).includes(consulta)))&&
    (categoria==='todas'||r.categoriasAutomaticas.includes(categoria))&&(filtro==='todas'||(filtro==='completas')===disponibilidad(r).completa)).sort(compararRecetas);
  $('resultados').textContent=`${visibles.length} de ${recetas.length} recetas`;
  $('lista-recetas').replaceChildren();
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
function tarjetaReceta(r) {
  const info=disponibilidad(r),n=numeroFaltantes(r),p=planDe(r.id);
  const tarjeta=elemento('article',undefined,`tarjeta ${info.completa?'completa':'incompleta'}`);tarjeta.dataset.receta=r.id;
  const etiquetaFoto=r.imagenId?elemento('p','Cargando foto local…','meta'):null;
  const figura=elemento('figure',undefined,`visual-receta ${r.imagen||r.imagenId?'con-imagen-local':''}`),img=imagenReceta(r,etiquetaFoto);img.loading='lazy';
  if(n)figura.append(elemento('span',`Falta${n===1?'':'n'} ${n} ingrediente${n===1?'':'s'}`,'franja-faltantes'));
  figura.append(img);tarjeta.append(figura);
  if(info.completa)tarjeta.append(elemento('span','Ingredientes disponibles','etiqueta'));
  tarjeta.append(elemento('h4',r.nombre),elemento('p',`${textoTiempo(r)} · ${p?.porciones??r.porciones} porciones${p?.veces>1?` × ${p.veces}`:''}${r.datosDePrueba===true?' · Datos de prueba':''}`,'meta'));
  if(n)tarjeta.append(elemento('p',`Te falta: ${info.faltantes.map(i=>i.nombre).join(', ')}.`,'faltantes'));
  if(r.imagen)tarjeta.append(elemento('p','Imagen ilustrativa IA','meta'));
  if(etiquetaFoto)tarjeta.append(etiquetaFoto);
  const ver=boton('Ver preparación',()=>mostrarDetalle(r));ver.setAttribute('aria-label',`Ver preparación: ${r.nombre}`);tarjeta.append(ver);return tarjeta;
}
function mostrarDetalle(receta) {
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
    general.append(titulo,elemento('p',`${textoTiempo(r)} · ${op.porciones} porciones${op.veces>1?` × ${op.veces} preparaciones`:''}`,'meta'));
    arriba.append(general,formPorciones(r,op.porciones,op.veces,(porciones,veces)=>{
      opcionesDetalle={porciones,veces};if(planDe(r.id))cambiar(s=>motor.cambiarPorciones(s,r.id,porciones,veces));else dibujarDetalle();
    }));
    const panel=elemento('section',undefined,'detalle-ingredientes-panel'),lista=elemento('ul',undefined,'ingredientes-detalle');
    for(const i of info.lineas){
      const fila=elemento('li');fila.dataset.disponible=String(i.completo);const desc=elemento('div',undefined,'detalle-ingrediente-texto');
      const simbolo=elemento('span',i.completo?'✓':'+','simbolo-estado');simbolo.setAttribute('aria-hidden','true');
      const nombre=elemento('span',`${cantidadLegible(i.cantidad,i.unidad)} · ${i.nombre}`);
      desc.append(simbolo,nombre);fila.append(desc);
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
      const todos=boton('Añadir receta a compras',()=>cambiar(s=>motor.agregarNecesidades(s,r.id,info.lineas.map(i=>i.clave),op.porciones,op.veces)),'');todos.id='todos-faltantes';todos.dataset.foco='todos-faltantes';pie.append(todos);
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
  recetasUsuario=doc;actualizarRecetario();
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
function dibujarCompras() {
  const focoAnterior=$('compras').contains(document.activeElement)?document.activeElement.dataset.foco:null;
  const compradoAbierto=$('comprados')?.open;
  conservarFoco($('items-compras'),()=>{
    const grupos=motor.resumenCompras(estado),pendientes=grupos.filter(g=>!g.completo),completas=grupos.filter(g=>g.completo);
    const frag=document.createDocumentFragment();
    pendientes.forEach(g=>frag.append(filaCompra(g)));
    if(!pendientes.length)frag.append(elemento('p','No tenés compras pendientes.','compras-vacias'));
    if(completas.length){const comprado=elemento('details');comprado.id='comprados';comprado.open=compradoAbierto||false;comprado.append(elemento('summary',`Compras completadas (${completas.length})`));completas.forEach(g=>comprado.append(filaCompra(g)));frag.append(comprado);}
    $('items-compras').replaceChildren(frag);
    const foco=document.activeElement?.dataset.foco;if(foco){const id=foco.replace(/^compra-/,'');if(completas.some(g=>g.id===id))$('comprados').open=true;}
  });
  // Si el control enfocado pasó a Comprados, abrirlo antes de devolverle foco.
  if(document.activeElement?.closest('#comprados'))$('comprados').open=true;
  const planCont=$('plan-compras'),open=planCont.open;planCont.replaceChildren(elemento('summary',`Recetas incluidas (${estado.planes.length})`));planCont.open=open;
  for(const p of estado.planes){const r=motor.recetario.get(p.recetaId),bloque=elemento('div',undefined,'plan-receta');bloque.append(elemento('h3',r.nombre),formPorciones(r,p.porciones,p.veces,(por,veces)=>cambiar(s=>motor.cambiarPorciones(s,r.id,por,veces))),boton('Quitar receta',()=>cambiar(s=>motor.quitarReceta(s,r.id))));planCont.append(bloque);}
  const posibles=motor.posibilidades(estado),lista=elemento('ul');posibles.forEach(r=>lista.append(elemento('li',r.nombre)));
  $('posibilidades-compras').replaceChildren(elemento('h3','Después de comprar'),posibles.length?lista:elemento('p','Todavía no hay recetas que se completen con las compras pendientes.'));
  if(focoAnterior){const destino=[...$('compras').querySelectorAll('[data-foco]')].find(n=>n.dataset.foco===focoAnterior);if(destino?.closest('#comprados'))$('comprados').open=true;(destino||$('titulo-compras')).focus({preventScroll:true});}
  $('estado-compras').textContent=`Pendientes · ${motor.resumenCompras(estado).filter(g=>!g.completo).length}`;
  $('vaciar-compras').disabled=!estado.planes.length&&!estado.manuales.length;if($('vaciar-compras').disabled)$('confirmar-vaciado').hidden=true;
}
function mostrarReferencias() {
  const panel=$('referencias-anteriores');panel.hidden=!estado.porRevisar.length;panel.replaceChildren(elemento('summary',`Referencias anteriores (${estado.porRevisar.length})`));
  for(const item of estado.porRevisar){
    const bloque=elemento('div',undefined,'referencia-anterior');bloque.append(elemento('p',`${item.nombre} · ${item.tipo==='inventario'?'Lo que tengo':'Compras'}`));
    const label=elemento('label','Relacionar con ingrediente actual'),select=document.createElement('select');const vacio=elemento('option','Elegí una correspondencia');vacio.value='';select.append(vacio);ingredientes.forEach(i=>{const op=elemento('option',i.nombre);op.value=i.id;select.append(op);});label.append(select);
    const resolver=boton('Confirmar correspondencia',()=>{
      if(!select.value){select.focus();return;}
      cambiar(s=>{
        const id=select.value;
        if(item.tipo==='inventario'){if(!s.inventario.some(i=>i.ingredienteId===id))motor.ajustarInventario(s,id,null,motor.unidadBase(id));}
        else if(!s.manuales.some(m=>m.id===`legado:${id}`))s.manuales.push({...motor.canonizar(id,null,motor.unidadBase(id)),id:`legado:${id}`,nombreOrigen:'Lista anterior',origenesLegados:item.original?.recetas||[]});
        s.porRevisar=s.porRevisar.filter(x=>x!==item);
      });
    });bloque.append(label,resolver);panel.append(bloque);
  }
}
function actualizar() {
  mostrarDespensa();mostrarSeleccion();mostrarRecetas();mostrarReferencias();
  $('contador-compras').textContent=motor.resumenCompras(estado).filter(g=>!g.completo).length;
  $('resumen').textContent=`${recetas.filter(r=>disponibilidad(r).completa).length} recetas con todos sus ingredientes. Las compras pendientes no cuentan como disponibles.`;
  if($('detalle').open)dibujarDetalle();if($('compras').open)dibujarCompras();
}
function conectarControles() {
  $('crear-receta').addEventListener('click',()=>{
    if(recetasUsuario.borrador&&!confirm('Ya tenés un borrador. ¿Querés reemplazarlo? El borrador anterior solo se descarta cuando guardes el nuevo.'))return;
    editor.abrir();
  });
  $('continuar-borrador').addEventListener('click',()=>editor.abrir(recetasUsuario.borrador,{borrador:true}));
  for(const seccion of ['despensa','recetas'])$(`tab-${seccion}`).addEventListener('click',()=>cambiarSeccion(seccion));
  $('ver-cocinar').addEventListener('click',()=>{cambiarSeccion('recetas');$('titulo-recetas').tabIndex=-1;$('titulo-recetas').focus();$('titulo-recetas').scrollIntoView({block:'start'});});
  $('buscar-ingredientes').addEventListener('input',mostrarDespensa);$('categoria').addEventListener('change',mostrarDespensa);
  for(const id of ['busqueda','filtro','categoria-recetas'])$(id).addEventListener(id==='busqueda'?'input':'change',mostrarRecetas);
  const cerrarAcciones=()=>{$('acciones-despensa').open=false;$('acciones-despensa').querySelector('summary').focus();};
  $('todo').addEventListener('click',()=>{cambiar(s=>{for(const i of ingredientes)motor.establecerPresencia(s,i.id,true);});cerrarAcciones();});
  $('nada').addEventListener('click',()=>{cambiar(s=>{for(const i of ingredientes)motor.establecerPresencia(s,i.id,false);});cerrarAcciones();});
  $('acciones-despensa').addEventListener('keydown',e=>{if(e.key==='Escape'&&$('acciones-despensa').open){e.preventDefault();cerrarAcciones();}});
  document.addEventListener('click',e=>{if(!$('acciones-despensa').contains(e.target))$('acciones-despensa').open=false;});
  $('cerrar-detalle').addEventListener('click',()=>$('detalle').close());
  $('detalle').addEventListener('close',()=>{
    if($('detalle').dataset.editarDespensa==='true'){delete $('detalle').dataset.editarDespensa;cambiarSeccion('despensa');$('buscar-ingredientes').focus();$('titulo-despensa').scrollIntoView({block:'start'});}
    else ([...document.querySelectorAll('.tarjeta')].find(n=>n.dataset.receta===recetaOrigenDetalle)?.querySelector('button')||$('tab-recetas')).focus();recetaDetalle=null;
  });
  $('abrir-compras').addEventListener('click',()=>{$('confirmar-vaciado').hidden=true;dibujarCompras();$('compras').showModal();$('compras').scrollTop=0;});
  $('cerrar-compras').addEventListener('click',()=>$('compras').close());$('compras').addEventListener('close',()=>$('abrir-compras').focus());
  $('vaciar-compras').addEventListener('click',()=>{$('confirmar-vaciado').hidden=false;$('cancelar-vaciar').focus();});
  $('cancelar-vaciar').addEventListener('click',()=>{$('confirmar-vaciado').hidden=true;$('vaciar-compras').focus();});
  $('confirmar-vaciar').addEventListener('click',()=>{cambiar(s=>{s.planes=[];s.manuales=[];});$('titulo-compras').focus();});
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
    const rec=recuperarEstado(almacenamientoLocal,motor);estado=rec.estado;bloqueado=rec.bloqueado||propias.bloqueado;recuperacion=rec.avisos;
    if(propias.mensaje)recuperacion.push(propias.mensaje);
    $('aviso-recuperacion').textContent=recuperacion.join(' ');$('aviso-recuperacion').hidden=!recuperacion.length;
    const prueba=recetas.filter(r=>r.datosDePrueba===true).length;
    for(const id of ['etiqueta-prueba-inicio','etiqueta-prueba-recetas','etiqueta-prueba-compras']){$(id).hidden=prueba===0;$(id).textContent=prueba===recetas.length?'Datos de prueba':'Incluye datos de prueba';}
    $('aviso-catalogo').textContent=`${prueba?`${prueba} recetas de prueba. `:''}Las cantidades y la nutrición son estimaciones del paquete aportado; algunas requieren revisión editorial. Las imágenes son ilustrativas generadas con IA.`;
    $('ayuda-catalogo').textContent='Registrá cantidades para comprobar suficiencia. Tengo todo conserva presencia sin inventar cantidades: confirmalas para cocinar.';
    editor=crearEditorRecetas({dialog:$('receta-propia-dialogo'),catalogo:ingredientes,motor,guardar:guardarRecetaPropia,borrar:borrarRecetaPropia,descartar:descartarBorrador});
    prepararCategorias();conectarControles();$('continuar-borrador').hidden=!recetasUsuario.borrador;actualizar();$('estado').hidden=true;$('aplicacion').hidden=false;$('abrir-compras').disabled=false;
  }catch(error){$('estado').textContent=`No pudimos cargar Avanzi: ${error.message} Revisá los archivos con Live Server. No se modificaron tus datos guardados.`;}
}
iniciar();
