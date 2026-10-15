// Chromium es una herramienta de prueba externa; Avanzi no lo necesita para funcionar.
const {chromium}=require(process.env.AVANZI_PLAYWRIGHT||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.AVANZI_URL||'http://127.0.0.1:8030/';
const capturas=process.env.AVANZI_CAPTURAS_NUEVAS;
const r=(id,n,cantidad)=>({id,nombre:n,porciones:1,tiempoMinutos:10,pasos:['Cocinar.'],ingredientes:[{ingredienteId:'huevo',cantidad,unidad:'unidad'}]});
const temporal={recetas:[r('prueba-uno','Prueba uno',3),r('prueba-dos','Prueba dos',2)]};

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AVANZI_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errores=[];
  p.on('pageerror',e=>errores.push(e.message));
  await p.route('**/datos/recetas.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(temporal)}));
  await p.goto(url);await p.locator('#aplicacion').waitFor({state:'visible'});
  await p.locator('#buscar-ingredientes').fill('huevó');
  const tarjeta=p.locator('#ingredientes .tarjeta-ingrediente').filter({has:p.locator('input[value="huevo"]')});
  await tarjeta.locator('input[type=checkbox]').check();
  assert.equal(await tarjeta.locator('input[type=checkbox]').isChecked(),true);
  await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});
  await p.locator('#buscar-ingredientes').fill('huevo');
  assert.equal(await tarjeta.locator('input[type=checkbox]').isChecked(),true);
  await tarjeta.locator('input[type=checkbox]').uncheck();
  assert.equal(await tarjeta.locator('input[type=checkbox]').isChecked(),false);
  if(capturas){fs.mkdirSync(capturas,{recursive:true});await p.screenshot({path:`${capturas}/lo-que-tengo-celular.png`,fullPage:true});}
  console.log('PASS selección binaria, búsqueda sin tildes y recarga');

  await p.locator('#tab-recetas').click();
  for(const id of ['prueba-uno','prueba-dos']){
   await p.locator(`.tarjeta[data-receta="${id}"]`).getByRole('button',{name:/Ver preparación/}).click();
   await p.locator('#todos-faltantes').click();await p.locator('#cerrar-detalle').click();
  }
  await p.locator('#abrir-compras').click();
  const fila=p.locator('#items-compras article[data-ingrediente=huevo]');
  assert.match(await fila.innerText(),/5 unidades/);
  const subtareas=fila.locator('.subtarea-compra input');assert.equal(await subtareas.count(),2);
  await subtareas.first().check();assert.match(await fila.innerText(),/2 unidades/);
  await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});await p.locator('#abrir-compras').click();
  assert.equal(await fila.locator('.subtarea-compra input').first().isChecked(),true);
  await fila.locator('.compra-etiqueta input').check();
  assert.match(await p.locator('#comprados summary').innerText(),/Compras completadas \(1\)/);
  await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});await p.locator('#abrir-compras').click();
  await p.locator('#comprados summary').click();
  await p.locator('#comprados .subtarea-compra input').first().evaluate(e=>e.click());
  assert.match(await fila.innerText(),/3 unidades/);
  assert.equal(await p.locator('#contador-compras').innerText(),'1');
  if(capturas)await p.locator('#compras').screenshot({path:`${capturas}/compras-celular.png`});
  console.log('PASS subtareas individuales y generales, completadas recuperables, recarga');
  await p.locator('#cerrar-compras').click();await p.locator('#tab-recetas').click();
  await p.locator('#crear-receta').click();const editor=p.locator('#receta-propia-dialogo');
  await editor.getByLabel('Nombre de la receta').fill('Mi omelette');
  await editor.getByLabel('Porciones').fill('1');
  await editor.getByLabel('Preparación (minutos)').fill('5');
  await editor.getByLabel('Cocción (minutos)').fill('5');
  await editor.getByLabel('Buscar ingrediente por nombre o alias').fill('huévo');
  await editor.locator('.editor-resultados').getByRole('button',{name:'Huevo',exact:true}).click();
  await editor.locator('.editor-fila input[type=number]').fill('2');
  await editor.locator('.editor-fila select').selectOption('unidad');
  await editor.locator('textarea').fill('Batir y cocinar.');
  await editor.getByRole('button',{name:'Guardar receta'}).click();await editor.waitFor({state:'hidden'});
  assert.equal(await p.locator('.tarjeta').filter({hasText:'Mi omelette'}).count(),1);
  await p.locator('.tarjeta').filter({hasText:'Mi omelette'}).getByRole('button',{name:/Ver preparación/}).click();
  await p.locator('#detalle').getByRole('button',{name:'Editar receta'}).click();await editor.waitFor({state:'visible'});
  await editor.getByLabel('Nombre de la receta').fill('Mi omelette editado');
  await editor.getByRole('button',{name:'Guardar cambios'}).click();await editor.waitFor({state:'hidden'});
  assert.equal(await p.locator('.tarjeta').filter({hasText:'Mi omelette editado'}).count(),1);
  console.log('PASS búsqueda dinámica, creación y edición de receta propia');

  await p.locator('#crear-receta').click();
  await editor.getByLabel('Nombre de la receta').fill('Mi borrador');
  await editor.getByRole('button',{name:'Guardar borrador'}).click();await editor.waitFor({state:'hidden'});
  assert.equal(await p.locator('#continuar-borrador').isVisible(),true);
  p.once('dialog',d=>d.dismiss());await p.locator('#crear-receta').click();
  assert.equal(await editor.isVisible(),false);
  await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});
  await p.locator('#tab-recetas').click();await p.locator('#continuar-borrador').click();
  assert.equal(await editor.getByLabel('Nombre de la receta').inputValue(),'Mi borrador');
  p.once('dialog',d=>d.accept());await editor.getByRole('button',{name:'Descartar borrador'}).click();
  await editor.waitFor({state:'hidden'});assert.equal(await p.locator('#continuar-borrador').isVisible(),false);
  console.log('PASS un borrador, confirmación para reemplazar y descarte explícito');

  for(const width of [320,360,390,768,1440]){
   await p.setViewportSize({width,height:844});
   for(const tab of ['despensa','recetas']){
    await p.locator(`#tab-${tab}`).click();
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${tab}`);
   }
   await p.locator('#crear-receta').click();
   assert.equal(await editor.evaluate(e=>e.scrollWidth>e.clientWidth),false,`editor ${width}`);
   await editor.getByRole('button',{name:'Cerrar'}).click();
   await p.locator('#abrir-compras').click();
   assert.equal(await p.locator('#compras').evaluate(e=>e.scrollWidth>e.clientWidth),false,`compras ${width}`);
   assert.ok(await p.locator('#items-compras .subtarea-compra').first().evaluate(e=>e.getBoundingClientRect().height>=44));
   await p.keyboard.press('Escape');await p.locator('#compras').waitFor({state:'hidden'});
  }
  await p.locator('.tarjeta').first().getByRole('button',{name:/Ver preparación/}).click();
  await p.keyboard.press('Escape');await p.locator('#detalle').waitFor({state:'hidden'});
  assert.ok((await p.evaluate(()=>document.activeElement?.getAttribute('aria-label')||'')).startsWith('Ver preparación'));
  assert.deepEqual(errores,[]);
  console.log('PASS anchos 320/360/390/768/1440, Escape, foco, subtareas de 44 px y sin desbordes');
  await context.close();
  const real=await browser.newContext(),q=await real.newPage(),fallos=[];
  q.on('pageerror',e=>fallos.push(e.message));
  await q.goto(url);await q.locator('#aplicacion').waitFor({state:'visible'});await q.locator('#tab-recetas').click();
  assert.equal(await q.locator('.tarjeta').count(),39);
  const imagenes=await q.evaluate(async()=>{
   const datos=await (await fetch('./datos/recetas.json')).json();
   return Promise.all(datos.recetas.map(async r=>({id:r.id,ok:(await fetch('./'+r.imagen.ruta.replace(/^\.\//,''))).ok})));
  });
  assert.equal(imagenes.length,39);assert.ok(imagenes.every(x=>x.ok));assert.deepEqual(fallos,[]);
  for(const card of await q.locator('.tarjeta').all()){
   await card.getByRole('button',{name:/Ver preparación/}).click();
   assert.equal(await q.locator('#detalle .detalle-preparacion li').count()>0,true);
   assert.equal(await q.locator('#detalle .nutricion').isVisible(),true);
   await q.locator('#cerrar-detalle').click();
  }
  console.log('PASS 39 recetas, imágenes locales, preparaciones y nutrición desde la ruta actual');
  await real.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
