// Prueba de interfaz opcional: Playwright ya instalado en el entorno de verificación.
// AVANZI_PLAYWRIGHT puede apuntar a una instalación externa; no es dependencia de Avanzi.
const {chromium}=require(process.env.AVANZI_PLAYWRIGHT||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),url=process.env.AVANZI_URL||'http://127.0.0.1:8015';
const out=process.env.AVANZI_CAPTURAS||'/tmp/avanzi-integracion/capturas';fs.mkdirSync(out,{recursive:true});
const K='que-cocino.despensa.v1',C='que-cocino.compras.v1';
const real=JSON.parse(fs.readFileSync(root+'/datos/recetas.json')).recetas;
const fixtures=['Omelette temporal','Tortilla temporal'].map((nombre,i)=>({id:`prueba-${i}`,nombre,porciones:1,tiempoMinutos:10,datosDePrueba:true,ingredientes:[{ingredienteId:'huevo',cantidad:3,unidad:'unidad'}],pasos:['Instrucción temporal; no se entrega en el catálogo.']}));
let runningBrowser;
(async()=>{
 const browser=runningBrowser=await chromium.launch({executablePath:process.env.AVANZI_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];let checks=0;
 const ok=(name)=>{checks++;console.log('PASS '+name);};
 async function start({fixture=false,storage=null,width=390}={}){
  const context=await browser.newContext({viewport:{width,height:900}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  if(fixture)await p.route('**/datos/recetas.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixtures)}));
  if(storage)await p.addInitScript(({storage})=>{if(!sessionStorage.getItem('test-init')){for(const [k,v] of Object.entries(storage))localStorage.setItem(k,v);sessionStorage.setItem('test-init','1');}},{storage});
  await p.goto(url);await p.locator('#aplicacion').waitFor({state:'visible'});return {context,p};
 }
 const saved=p=>p.evaluate(K=>JSON.parse(localStorage.getItem(K)),K);
 const close=async(p,id)=>{await p.locator('#'+id).click();};
 async function stock(p,n){
  if(await p.locator('#compras').isVisible())await close(p,'cerrar-compras');
  if(await p.locator('#detalle').isVisible())await close(p,'cerrar-detalle');
  await p.locator('#tab-despensa').click();await p.locator('#buscar-ingredientes').fill('huevo');
  await p.locator('[data-foco="editar-huevo"]').click();await p.locator('#cantidad-valor').fill(String(n));await p.locator('#cantidad-unidad').selectOption('unidad');await p.locator('#form-cantidad').getByRole('button',{name:'Guardar cantidad',exact:true}).click();await p.locator('#cantidad-dialogo').waitFor({state:'hidden'});
 }
 async function detail(p,id){if(await p.locator('#compras').isVisible())await close(p,'cerrar-compras');await p.locator('#tab-recetas').click();await p.locator(`.tarjeta[data-receta="${id}"] button`).click();}
 async function add(p,id){await detail(p,id);await p.locator('#todos-faltantes').click();await close(p,'cerrar-detalle');}
 const eggrow=p=>p.locator('#items-compras article[data-ingrediente="huevo"]');
 async function buy(p,n){await p.locator('[data-foco="compra-huevo"]').click();await p.locator('#cantidad-valor').fill(String(n));await p.locator('#form-cantidad').getByRole('button',{name:'Confirmar compra',exact:true}).click();}
 let {p,context}=await start({fixture:true});
 await add(p,'prueba-0');await add(p,'prueba-1');await p.locator('#abrir-compras').click();
 assert.match(await eggrow(p).innerText(),/6 unidades/);assert.equal(await eggrow(p).count(),1);assert.equal((await saved(p)).inventario.length,0);ok('A/C: dos recetas, seis huevos, fila única; añadir no aumenta inventario');
 await stock(p,2);await p.locator('#abrir-compras').click();assert.match(await eggrow(p).innerText(),/4 unidades/);ok('B: inventario parcial descontado una vez');
 await stock(p,0);await p.locator('#abrir-compras').click();await buy(p,4);await p.locator('#cantidad-dialogo').waitFor({state:'hidden'});
 assert.match(await eggrow(p).innerText(),/2 unidades/);assert.equal((await saved(p)).inventario.find(i=>i.ingredienteId==='huevo').cantidad,4);assert.equal(await p.locator('[data-foco="compra-huevo"]').evaluate(e=>e===document.activeElement),true);ok('D: compra parcial y retorno de foco');
 await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});await p.locator('#abrir-compras').click();assert.match(await eggrow(p).innerText(),/2 unidades/);assert.equal((await saved(p)).planes.length,2);ok('H: recarga conserva inventario, planes y compra parcial');
 await p.locator('#plan-compras summary').click();const plans=p.locator('.plan-receta');await plans.filter({hasText:'Tortilla temporal'}).getByRole('button',{name:'Quitar receta',exact:true}).click();assert.equal(await p.locator('#contador-compras').textContent(),'0');ok('E: quitar receta disminuye necesidad sin quitar inventario');
 await p.locator('.plan-receta input').first().fill('2');await p.locator('.plan-receta').getByRole('button',{name:'Aplicar',exact:true}).click();assert.match(await eggrow(p).innerText(),/2 unidades/);ok('F: cambio de porciones recalcula');
 await eggrow(p).locator('summary').click();const necesidad=eggrow(p).locator('.editar-necesidad');await necesidad.locator('input').fill('8');await necesidad.getByRole('button',{name:'Guardar',exact:true}).click();assert.match(await eggrow(p).innerText(),/4 unidades/);
 await eggrow(p).getByRole('button',{name:/Quitar vínculo/}).click();assert.equal(await p.locator('#contador-compras').textContent(),'0');ok('Editar cantidades y quitar vínculo');
 await close(p,'cerrar-compras');await add(p,'prueba-0');await p.locator('#abrir-compras').click();await p.locator('#comprados > summary').click();await p.locator('[data-foco="eliminar-huevo"]').click();assert.equal((await saved(p)).inventario.find(i=>i.ingredienteId==='huevo').cantidad,4);ok('Eliminar fila cubierta no modifica inventario');
 await context.close();
 // Fallo de la única escritura: todos los cambios quedan temporales, sin perder pendientes al recargar.
 ({p,context}=await start({fixture:true}));await add(p,'prueba-0');await p.locator('#abrir-compras').click();const before=await saved(p);
 await p.evaluate(K=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===K)throw new DOMException('Cuota','QuotaExceededError');return original.call(this,k,v);};},K);
 await buy(p,2);assert.equal(await p.locator('#cantidad-dialogo').isVisible(),true);assert.match(await p.locator('#error-cantidad').innerText(),/solo en esta sesión/);assert.deepEqual(await saved(p),before);
 await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});await p.locator('#abrir-compras').click();assert.match(await eggrow(p).innerText(),/3 unidades/);ok('Fallo de almacenamiento visible en diálogo y recuperación completa tras recarga');await context.close();
 // Datos antiguos sin sobrescritura al abrir, correspondencias explícitas, sin inventar números.
 const legacy={[K]:'["huevo","aceite"]',[C]:'[{"id":"huevo","recetas":["tortilla-papas"]}]'};
 ({p,context}=await start({storage:legacy}));assert.match(await p.locator('#aviso-recuperacion').innerText(),/Confirmá las cantidades/);assert.equal(await p.evaluate(K=>localStorage.getItem(K),K),legacy[K]);
 await p.locator('#referencias-anteriores summary').click();await p.locator('.referencia-anterior select').selectOption('aceite-vegetal');await p.locator('.referencia-anterior button').click();assert.equal((await saved(p)).inventario.find(i=>i.ingredienteId==='huevo').cantidad,null);ok('Compatibilidad: selección y compras anteriores por confirmar, correspondencia elegida por usuario');await context.close();
 // Catálogo real, visual y accesibilidad.
 ({p,context}=await start());assert.equal(await p.locator('#ingredientes input').count(),200);assert.equal(await p.locator('#categorias-inicio button').count(),7);
 await p.locator('#buscar-ingredientes').fill('LIMÓN');assert.ok(await p.locator('#ingredientes input').count()>0);await p.locator('#buscar-ingredientes').fill('');
 for(let n=0;n<5;n++){await p.locator('#tab-recetas').click();await p.locator('#tab-despensa').click();}
 assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');ok('200 ingredientes, seis categorías, búsqueda sin tildes y navegación estable');
 await stock(p,2);await p.locator('#buscar-ingredientes').fill('');await p.locator('#categorias-inicio').getByRole('button',{name:'Verduras',exact:true}).click();assert.equal(await p.locator('#cantidad-seleccion').textContent(),'1');await p.locator('#categorias-inicio').getByRole('button',{name:'Todos',exact:true}).click();
 await p.locator('#tab-recetas').click();assert.equal(await p.locator('.tarjeta').count(),39);
 for(const c of ['rapidas','veggie','pastas','carnes','desayunos','todas']){await p.locator('#categoria-recetas').selectOption(c);const ids=await p.locator('.tarjeta').evaluateAll(es=>es.map(e=>e.dataset.receta));assert.deepEqual(ids.sort(),real.filter(r=>c==='todas'||r.categorias.includes(c)).map(r=>r.id).sort());}
 await p.locator('#busqueda').fill('zzzzzz');assert.equal(await p.locator('.tarjeta').count(),0);assert.equal(await p.getByText('Sin coincidencias',{exact:true}).count(),3);await p.locator('#busqueda').fill('');
 await p.locator('#filtro').selectOption('completas');assert.equal(await p.locator('.tarjeta').count(),0);await p.locator('#filtro').selectOption('todas');ok('39 recetas, seis categorías, búsqueda y filtros de disponibilidad');
 await p.locator('.visual-receta img').evaluateAll(imgs=>Promise.all(imgs.map(async img=>{img.loading='eager';await img.decode();})));assert.equal(await p.locator('.visual-receta img').evaluateAll(es=>es.every(e=>e.naturalWidth===1000)),true);ok('39 WebP locales cargadas, ruta asociada por ID');
 for(const r of real){await detail(p,r.id);assert.equal(await p.locator('.detalle-preparacion li').count(),r.pasos.length);assert.equal(await p.locator('.nutricion tbody tr').count(),4);assert.ok((await p.locator('.detalle-imagen img').getAttribute('src')).endsWith(r.imagen.ruta));await p.keyboard.press('Escape');assert.equal(await p.locator(`.tarjeta[data-receta="${r.id}"] button`).evaluate(e=>e===document.activeElement),true);}
 ok('39 detalles: instrucciones completas, tabla nutricional, Escape y retorno de foco');
 await add(p,'pdr-spanish-tortilla');await add(p,'pdr-french-toast');
 await p.locator('#tab-despensa').click();await p.locator('#buscar-ingredientes').fill('huevo');await p.locator('[data-foco="editar-huevo"]').click();await p.keyboard.press('Escape');assert.equal(await p.locator('[data-foco="editar-huevo"]').evaluate(e=>e===document.activeElement),true);await p.locator('#buscar-ingredientes').fill('');
 for(const [nombre,width,height] of [['celular',390,844],['computadora',1440,1000],['estrecho',320,844]]){
  await p.setViewportSize({width,height});await p.locator('#tab-despensa').click();await p.evaluate(()=>scrollTo(0,0));await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await p.locator('.editar-cantidad').evaluateAll(es=>es.every(e=>e.offsetHeight>=44)));
  if(nombre!=='estrecho')await p.screenshot({path:`${out}/${nombre}-lo-que-tengo.png`});
  await p.locator('#tab-recetas').click();await p.evaluate(()=>scrollTo(0,0));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(nombre!=='estrecho')await p.screenshot({path:`${out}/${nombre}-recetas.png`});
  await detail(p,'pdr-spanish-tortilla');assert.equal(await p.locator('#detalle').evaluate(e=>e.scrollWidth>e.clientWidth),false);if(nombre!=='estrecho')await p.screenshot({path:`${out}/${nombre}-detalle.png`});
  await p.locator('#detalle').evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok((await p.locator('#cerrar-detalle').boundingBox()).y>=0);if(nombre==='celular')await p.screenshot({path:`${out}/celular-nutricion.png`});await p.keyboard.press('Escape');
  await p.locator('#abrir-compras').click();assert.equal(await p.locator('#compras').evaluate(e=>e.scrollWidth>e.clientWidth),false);if(nombre!=='estrecho')await p.screenshot({path:`${out}/${nombre}-compras.png`});await p.keyboard.press('Escape');assert.equal(await p.locator('#abrir-compras').evaluate(e=>e===document.activeElement),true);
 }
 ok('Diseño a 320/390/1440, controles de 44px, sin desbordes, cierre visible y capturas reales');
 await p.locator('#tab-despensa').click();await p.locator('#acciones-despensa > summary').click();await p.locator('#nada').click();await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});assert.equal(await p.locator('#cantidad-seleccion').textContent(),'0');ok('Selección vacía y recarga');
 await context.close();
 // Regresiones de etiquetas, respaldos, datos inválidos y cantidad desconocida.
 for(const variante of ['true','false','ausente','mixto','invalido']){
  const cx=await browser.newContext(),pg=await cx.newPage();const temp=structuredClone(fixtures);
  if(variante==='false')temp.forEach(r=>r.datosDePrueba=false);
  if(variante==='ausente')temp.forEach(r=>delete r.datosDePrueba);
  if(variante==='mixto')temp[1].datosDePrueba=false;
  if(variante==='invalido')temp[0].datosDePrueba='true';
  await pg.route('**/datos/recetas.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(temp)}));await pg.goto(url);
  if(variante==='invalido'){await pg.waitForFunction(()=>document.getElementById('estado').textContent.includes('datosDePrueba'));assert.equal(await pg.evaluate(K=>localStorage.getItem(K),K),null);}
  else {await pg.locator('#aplicacion').waitFor({state:'visible'});assert.equal(await pg.locator('#etiqueta-prueba-inicio').isVisible(),['true','mixto'].includes(variante));await pg.locator('#tab-recetas').click();const metas=await pg.locator('.tarjeta .meta').allTextContents();assert.equal(metas.filter(t=>t.includes('Datos de prueba')).length,variante==='true'?2:variante==='mixto'?1:0);}
  await cx.close();
 }
 ok('Regresión datosDePrueba: true, false, omitido, mixto e inválido sin escribir');
 ({p,context}=await start({fixture:true}));await p.route('**/imagenes/por-defecto/**',r=>r.fulfill({status:404,body:''}));
 await p.reload();await p.locator('#aplicacion').waitFor({state:'visible'});await p.locator('#buscar-ingredientes').fill('aceite de coco');
 await p.waitForFunction(()=>[...document.querySelectorAll('#ingredientes img')].every(i=>i.dataset.estadoImagen==='sin-imagen'));
 assert.equal(await p.locator('#ingredientes img').evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility==='hidden'&&!e.hasAttribute('src'))),true);
 assert.equal(await p.locator('#ingredientes').getByRole('button',{name:'Editar cantidad de Aceite de coco',exact:true}).isVisible(),true);
 await detail(p,'prueba-0');await p.waitForFunction(()=>document.querySelector('.detalle-imagen img').dataset.estadoImagen==='sin-imagen');assert.equal(await p.locator('.detalle-imagen figcaption').innerText(),'Sin ilustración');assert.equal(await p.locator('#todos-faltantes').isVisible(),true);await context.close();ok('Respaldo también fallido: sin icono roto, nombres y controles disponibles');
 // Un fallo de carga no escribe almacenamiento.
 const failed=await browser.newContext(),q=await failed.newPage();await q.addInitScript(({K})=>{localStorage.setItem(K,'["huevo"]');window.writes=0;const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.writes++;return orig.call(this,k,v);};},{K});await q.route('**/datos/ingredientes.json',r=>r.fulfill({status:500,body:'error'}));await q.goto(url);await q.waitForFunction(()=>document.getElementById('estado').textContent.includes('No pudimos'));assert.equal(await q.evaluate(()=>window.writes),0);assert.equal(await q.evaluate(K=>localStorage.getItem(K),K),'["huevo"]');ok('Fallo de catálogo sin escrituras');await failed.close();
 const blocked=await browser.newContext(),bp=await blocked.newPage();await bp.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Acceso denegado','SecurityError');}});});await bp.goto(url);await bp.locator('#aplicacion').waitFor({state:'visible'});assert.match(await bp.locator('#aviso-recuperacion').innerText(),/No pudimos recuperar/);await bp.locator('#tab-recetas').click();assert.equal(await bp.locator('.tarjeta').count(),39);await blocked.close();ok('Almacenamiento bloqueado por navegador permite explorar sin sobrescribir');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultados.json',JSON.stringify({checks,errors},null,2));await browser.close();console.log(`${checks} grupos de pruebas de interfaz aprobados.`);
})().catch(async e=>{console.error(e);await runningBrowser?.close();process.exitCode=1;});
