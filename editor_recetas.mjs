/** Formulario DOM para recetas propias; todo texto aportado se inserta como texto. */
const el=(tag,text,clase)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(clase)n.className=clase;return n;};
const campo=(texto,tipo,valor,opciones={})=>{
  const label=el('label',texto),input=el('input');input.type=tipo;input.value=valor??'';
  for(const [k,v] of Object.entries(opciones))input[k]=v;
  label.append(input);return {label,input};
};
const normalizar=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');

export function crearEditorRecetas({dialog,catalogo,motor,dibujoIngrediente,guardar,borrar,descartar,cerrar}) {
  let actual=null,origen=null;
  const formulario=el('form');formulario.id='form-receta-propia';formulario.noValidate=true;
  const aviso=el('p');aviso.id='error-receta-propia';aviso.setAttribute('role','status');aviso.setAttribute('aria-live','polite');
  const titulo=el('h2');titulo.id='titulo-receta-propia';
  const cabecera=el('div',undefined,'dialogo-cabecera');
  const cerrarBoton=el('button','×','secundario editor-cerrar');cerrarBoton.type='button';cerrarBoton.setAttribute('aria-label','Cerrar');cerrarBoton.onclick=()=>dialog.close();cabecera.append(titulo,cerrarBoton);
  dialog.append(cabecera,aviso,formulario);
  dialog.addEventListener('close',()=>{origen?.focus?.();cerrar?.();});
  const mostrarError=mensaje=>{aviso.textContent=mensaje;aviso.hidden=!mensaje;if(mensaje)aviso.focus();};
  aviso.tabIndex=-1;
  function abrir(receta=null,{duplicar=false,borrador=false}={}) {
    origen=document.activeElement;
    actual=receta?structuredClone(receta):null;
    titulo.textContent=borrador?'Continuar borrador':duplicar?'Duplicar receta':receta?'Editar receta':'Crear receta';
    formulario.replaceChildren();mostrarError('');
    const identificador=(!receta||duplicar)?null:receta.id;
    const nombre=campo('Nombre de la receta','text',receta?.nombre||'',{required:true,maxLength:100});
    const porciones=campo('Porciones','number',receta?.porciones??2,{required:true,min:'1',max:'1000',step:'1'});
    const prep=campo('Prep.','number',receta?.tiempoPreparacionMinutos??0,{required:true,min:'0',max:'1440',step:'1'});prep.input.setAttribute('aria-label','Preparación (minutos)');
    const coccion=campo('Cocción','number',receta?.tiempoCoccionMinutos??0,{required:true,min:'0',max:'1440',step:'1'});coccion.input.setAttribute('aria-label','Cocción (minutos)');
    const tiempos=el('div',undefined,'editor-grid');tiempos.append(porciones.label,prep.label,coccion.label);
    const total=el('p',undefined,'meta editor-total');const actualizarTotal=()=>{
      const a=prep.input.valueAsNumber,b=coccion.input.valueAsNumber;
      total.textContent=`Total · ${Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0?a+b:'—'} min`;
    };prep.input.oninput=coccion.input.oninput=actualizarTotal;actualizarTotal();
    const desayuno=el('label',undefined,'editor-check'),check=el('input');check.type='checkbox';check.checked=receta?.esDesayuno===true;desayuno.append(check,el('span','Desayuno'));
    formulario.append(nombre.label,tiempos,total,desayuno,el('h3','Ingredientes'));
    const buscador=campo('Buscar ingrediente','search','');buscador.label.classList.add('editor-buscador');buscador.input.setAttribute('aria-label','Buscar ingrediente por nombre o alias');buscador.input.placeholder='Nombre o alias';formulario.append(buscador.label);
    const resultados=el('div',undefined,'editor-resultados');resultados.setAttribute('role','group');resultados.setAttribute('aria-label','Resultados de ingredientes');formulario.append(resultados);
    const filas=el('div',undefined,'editor-filas');formulario.append(filas);
    const opcionesOrdenadas=[...catalogo].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
    function filaIngrediente(item) {
      const cont=el('div',undefined,'editor-fila');
      const ficha=catalogo.find(i=>i.id===item.ingredienteId);
      const detalles=el('details',undefined,'editor-ingrediente-detalles'),resumen=el('summary',undefined,'editor-ingrediente-identidad');
      const nombre=el('strong',ficha?.nombre||item.ingredienteId),medida=el('span',undefined,'editor-medida');
      if(ficha)resumen.append(dibujoIngrediente(ficha));resumen.append(nombre,medida);detalles.append(resumen);
      const cantidad=campo('Cantidad','number',item.cantidad??'',{required:true,min:'0.000001',step:'any'});
      const estado=item.estadoAlimento||'base';
      const unidadLabel=el('label','Unidad'),unidad=el('select');unidadLabel.append(unidad);
      for(const v of motor.opcionesUnidades(item.ingredienteId,estado)){const o=el('option',v==='unidad'?'unidades':v);o.value=v;unidad.append(o);}
      unidad.value=[...unidad.options].some(o=>o.value===item.unidad)?item.unidad:motor.unidadBase(item.ingredienteId,estado);
      const campos=el('div',undefined,'editor-ingrediente-campos');campos.append(cantidad.label,unidadLabel);
      const listo=el('button','Listo','secundario editor-ingrediente-listo');listo.type='button';listo.onclick=()=>{if(cantidad.input.valueAsNumber>0){detalles.open=false;resumen.focus();}else cantidad.input.focus();};
      campos.append(listo);detalles.append(campos);
      const actualizarMedida=()=>{const valor=cantidad.input.valueAsNumber;medida.textContent=valor>0?`${cantidad.input.value} ${unidad.selectedOptions[0]?.textContent||unidad.value}`:'Cantidad pendiente';};
      cantidad.input.addEventListener('input',actualizarMedida);unidad.addEventListener('change',actualizarMedida);actualizarMedida();
      detalles.open=!(cantidad.input.valueAsNumber>0);
      const quitar=el('button','×','secundario editor-ingrediente-quitar');quitar.type='button';quitar.setAttribute('aria-label',`Quitar ${nombre.textContent}`);quitar.onclick=()=>{cont.remove();buscador.input.focus();mostrarResultados();};
      cont.append(detalles,quitar);filas.append(cont);
      cont._leer=()=>({ingredienteId:item.ingredienteId,cantidad:cantidad.input.valueAsNumber,unidad:unidad.value,estadoAlimento:estado});
      return cont;
    }
    function mostrarResultados(){
      resultados.replaceChildren();const q=normalizar(buscador.input.value.trim());if(!q)return;
      const elegidos=new Set([...filas.children].map(f=>f._leer().ingredienteId));
      for(const i of opcionesOrdenadas.filter(i=>!elegidos.has(i.id)&&normalizar([i.nombre,...(i.aliasEs||[])].join(' ')).includes(q)).slice(0,12)){
        const elegir=el('button',undefined,'secundario editor-resultado');elegir.type='button';elegir.append(dibujoIngrediente(i),el('span',i.nombre));elegir.onclick=()=>{const fila=filaIngrediente({ingredienteId:i.id,estadoAlimento:'base'});buscador.input.value='';mostrarResultados();fila.querySelector('input').focus();};resultados.append(elegir);
      }
      if(!resultados.children.length)resultados.append(el('p','Sin coincidencias','meta'));
    }
    buscador.input.oninput=mostrarResultados;
    (receta?.ingredientes||[]).forEach(filaIngrediente);
    formulario.append(el('h3','Preparación'));
    const pasos=el('div',undefined,'editor-pasos');formulario.append(pasos);
    function filaPaso(texto=''){
      const cont=el('div',undefined,'editor-paso'),label=el('label','Paso'),area=el('textarea');area.value=texto;area.maxLength=1200;area.rows=3;label.append(area);
      const arriba=el('button','Subir paso','secundario'),abajo=el('button','Bajar paso','secundario'),quitar=el('button','Quitar paso','secundario');
      for(const b of [arriba,abajo,quitar])b.type='button';
      arriba.onclick=()=>{if(cont.previousElementSibling){pasos.insertBefore(cont,cont.previousElementSibling);area.focus();}};
      abajo.onclick=()=>{if(cont.nextElementSibling){pasos.insertBefore(cont.nextElementSibling,cont);area.focus();}};
      quitar.onclick=()=>{const destino=cont.nextElementSibling||cont.previousElementSibling;cont.remove();(destino?.querySelector('textarea')||agregarPaso).focus();};
      cont.append(label,arriba,abajo,quitar);pasos.append(cont);cont._leer=()=>area.value;
    }
    const agregarPaso=el('button','Agregar paso','secundario');agregarPaso.type='button';agregarPaso.onclick=()=>{filaPaso();pasos.lastElementChild.querySelector('textarea').focus();};
    (receta?.pasos?.length?receta.pasos:['']).forEach(filaPaso);formulario.append(agregarPaso,el('h3','Foto opcional'));
    const foto=campo('Elegir foto JPG, PNG o WebP','file','',{accept:'image/jpeg,image/png,image/webp',capture:'environment'});foto.input.value='';
    const quitarFoto=el('label',undefined,'editor-check'),quitarCheck=el('input');quitarCheck.type='checkbox';quitarFoto.append(quitarCheck,el('span','Quitar foto actual'));
    const notaFoto=el('p','Solo en este dispositivo · máximo 10 MB.','meta');
    formulario.append(foto.label,notaFoto);if(receta?.imagenId&&!duplicar)formulario.append(quitarFoto);
    const acciones=el('div',undefined,'editor-acciones');
    const publicar=el('button',receta&&!duplicar&&!borrador?'Guardar cambios':'Guardar receta');publicar.type='submit';
    const draft=el('button','Guardar borrador','secundario');draft.type='button';
    const leer=()=>({id:identificador,nombre:nombre.input.value,porciones:porciones.input.valueAsNumber,
      tiempoPreparacionMinutos:prep.input.valueAsNumber,tiempoCoccionMinutos:coccion.input.valueAsNumber,
      esDesayuno:check.checked,ingredientes:[...filas.children].map(f=>f._leer()),pasos:[...pasos.children].map(p=>p._leer()),
      imagenId:duplicar?null:receta?.imagenId||null});
    async function ejecutar(esBorrador){mostrarError('');publicar.disabled=draft.disabled=true;
      try{const resultado=await guardar(leer(),foto.input.files[0]||null,quitarCheck.checked,esBorrador,duplicar);
        if(resultado?.ok)dialog.close();else mostrarError(resultado?.mensaje||'No se pudo guardar la receta.');
      }catch(error){mostrarError(error.message);}finally{publicar.disabled=draft.disabled=false;}}
    formulario.onsubmit=e=>{e.preventDefault();ejecutar(false);};draft.onclick=()=>ejecutar(true);
    acciones.append(publicar,draft);
    if(borrador){const descartarBoton=el('button','Descartar borrador','secundario');descartarBoton.type='button';descartarBoton.onclick=async()=>{
      if(!confirm('¿Descartar este borrador? La receta terminada, si existe, se conserva.'))return;
      const r=await descartar();if(r.ok)dialog.close();else mostrarError(r.mensaje);
    };acciones.append(descartarBoton);}
    if(receta&&!duplicar&&!borrador){const eliminar=el('button','Borrar receta','secundario');eliminar.type='button';eliminar.onclick=async()=>{
      if(!confirm(`¿Borrar «${receta.nombre}»? Si está en compras, sus necesidades quedarán sin asociación; lo comprado seguirá en Lo que tengo.`))return;
      const r=await borrar(receta);if(r.ok)dialog.close();else mostrarError(r.mensaje);
    };acciones.append(eliminar);}
    formulario.append(acciones);dialog.showModal();dialog.scrollTop=0;nombre.input.focus();
  }
  return {abrir};
}
