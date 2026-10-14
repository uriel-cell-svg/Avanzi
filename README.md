# Qué cocino · Recetas, despensa y compras

Proyecto para la facultad, sin fines de lucro. Ayuda a decidir qué cocinar con lo que tenés y reúne ingredientes por conseguir. Las cinco recetas son datos de prueba. Se comprueba presencia de ingredientes, **no cantidades suficientes ni seguridad alimentaria**.

## Abrir con Live Server

1. Extraé el ZIP completo en una carpeta. Conservá las carpetas `datos`, `imagenes` y `fuentes`.
2. En VS Code: **Archivo → Abrir carpeta**, y seleccioná esa carpeta.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

No hace falta Node.js, instalar paquetes ni compilar. No abras el archivo haciendo doble clic: el JSON necesita un servidor como Live Server. Las fuentes y dibujos son locales, sin servicios externos.

Si reemplazás una versión anterior, usá la misma dirección y puerto de Live Server para recuperar los datos de ese navegador. Una carpeta distinta puede abrirse en otro puerto: los datos de localStorage no se comparten entre direcciones, puertos o navegadores.

## Mi despensa

La app empieza en esta pestaña. Marcá ingredientes; los dibujos son decorativos y los nombres siempre están visibles. Buscá sin distinguir mayúsculas o tildes y elegí una categoría. Solo aparecen categorías con ingredientes. Buscar y filtrar no modifica tu selección; el contador muestra toda la despensa.

**Tengo todo** y **Desmarcar todo** actúan sobre todos los ingredientes, aunque estén ocultos por búsqueda o categoría. Si marcás un ingrediente disponible, también se retira de compras. Desmarcarlo no lo añade automáticamente a compras.

El botón **Ver qué puedo cocinar**, al pie a la derecha, abre los resultados. Las pestañas siguen disponibles. Si cambiás la despensa, los resultados se recalculan.

## Resultados

Hay tres secciones, con contador y mensaje cuando están vacías:

| Sección | Ingredientes únicos faltantes |
| --- | --- |
| Ya tenés todo, ¡a cocinar! | 0 |
| Ya casi | 1 a 3 |
| Con algunas compras más | Más de 3 |

El orden dentro de cada sección es menor número de faltantes, menor tiempo y nombre. El selector manual de orden se retiró para no contradecir la agrupación. Podés buscar por nombre o ingrediente y filtrar recetas completas o incompletas; los contadores reflejan los resultados visibles.

Las tarjetas completas tienen borde verde y texto **Tenés todo**. Las incompletas tienen borde y franja bordó con el número de faltantes. Todas conservan dibujos, nombres de faltantes, tiempo, porciones y acceso a **Ver preparación**.

## Detalle de receta

El detalle muestra cantidades, unidades y pasos. No tiene casillas: ✓ indica En tu despensa y + indica Te falta. Los símbolos son estados, no controles. La disponibilidad se cambia en Mi despensa mediante **Editar mi despensa**, que cierra el diálogo y lleva el foco al buscador. Al volver a abrir la receta se muestra la selección actualizada.

Junto a los faltantes, **Añadir a compras** incorpora el ingrediente con su receta de origen; nunca lo marca disponible. Cuando está añadido se muestra **En tu lista** y **Quitar**, que lo retira globalmente de compras. Si todavía hay faltantes pendientes de añadir, se muestra **Añadir todos los faltantes**. Si todos están ya en compras, se informa; si la receta está completa, aparece **Tenés todos los ingredientes**.

La nota visible recuerda **Revisá las cantidades antes de cocinar**. **Sobre estos datos** contiene las aclaraciones adicionales. Los errores de guardado permanecen visibles fuera de ese desplegable. Cerrar o Escape devuelve el foco al acceso a la receta.

## Lista de compras

El acceso superior muestra el número de ingredientes únicos y abre un panel lateral, adaptable a celular. Cada ingrediente muestra las recetas desde las que lo añadiste.

- **Quitar** retira el ingrediente y todos sus orígenes.
- **Vaciar lista** pide confirmación dentro del panel. Podés cancelar.
- **Ya lo compré** lo marca en la despensa y lo retira de compras.

No se duplican ingredientes compartidos ni se suman cantidades entre recetas. Consultá las cantidades en cada preparación; no se calculan precios.

En **Con tu despensa y estas compras podrías preparar…** aparecen solo recetas todavía incompletas cuyos faltantes están cubiertos por la lista. Las ya completas y las que requieren algo más se excluyen. Quitar ingredientes recalcula las posibilidades. Estas recetas no pasan a completas hasta marcar los ingredientes realmente disponibles.

El panel se cierra con **Cerrar** o Escape y devuelve el foco al acceso superior. Las posibilidades dependen de realizar las compras y revisar las cantidades.

## Guardado y errores

La despensa usa la clave anterior `que-cocino.despensa.v1`; los identificadores no cambiaron. Compras se guarda por separado en `que-cocino.compras.v1`, como ingredientes con sus identificadores de recetas de origen. Ambas listas conservan selecciones parciales y vacías al recargar.

Se validan los datos recuperados. Si compras tiene datos inválidos, empieza vacía y se conserva la despensa válida. Los errores de almacenamiento muestran un aviso sin impedir usar la app, aunque los cambios podrían perderse al recargar. Borrar los datos del navegador borra estas listas. No se sincronizan entre dispositivos o pestañas abiertas simultáneamente.

Si falla el JSON de recetas o ingredientes, se muestra un error claro y no se reemplazan los datos por recetas duplicadas ni se sobrescribe la selección guardada. Revisá el archivo indicado y recargá con Live Server.

## Archivos

| Archivo o carpeta | Función |
| --- | --- |
| `index.html` | Pantallas, buscadores, controles y diálogos. |
| `estilos.css` | Diseño marfil, salvia y acentos suaves; estados bordó y verde; adaptación móvil. |
| `app.js` | Carga y validación, selección, agrupación, búsqueda, detalle editable, compras y guardado. |
| `datos/recetas.json` | Única fuente de las cinco recetas de prueba; sin cambios en esta entrega. |
| `datos/ingredientes.json` | Nombres, categorías y dibujos, relacionados por identificador; sin cambios. |
| `imagenes/` | Dibujos SVG originales de marca, recetas y despensa; permisos en `FUENTES.md`. |
| `fuentes/` | Fraunces local y su licencia SIL OFL; origen en `FUENTES.md`. |
| `AGENTS.md` | Reglas de futuros cambios. |
| `README.md` | Estas instrucciones. |

## Prueba sencilla

1. Desmarcá todo y marcá Aceite, Sal, Huevo y Espinaca.
2. Pulsá **Ver qué puedo cocinar**: los huevos con espinaca deben aparecer en **Ya tenés todo**.
3. Abrí la tortilla de papas y pulsá **Añadir todos los faltantes**.
4. Cerrá el detalle y abrí compras: deben aparecer Papa y Cebolla; la tortilla debe figurar entre las posibilidades después de comprar, pero todavía no entre las completas.
5. Pulsá **Ya lo compré** para ambos. La tortilla ahora debe estar completa.
6. Recargá: la selección permanece y compras está vacía.

## Pruebas de esta entrega

Se ejecutaron en Chromium con servidor HTTP local:

- Casos con 0, 1, 3 y 4 faltantes; agrupación, contadores, mensajes vacíos y desempates por tiempo/nombre.
- Doce combinaciones de búsqueda y filtros de recetas; búsqueda de despensa sin tildes, categorías y recarga parcial.
- Detalle editable; añadir a compras sin modificar despensa; botón desactivado cuando no hay faltantes; quitar desde detalle.
- Ingrediente compartido sin duplicación y con dos recetas de origen; cobertura total frente a parcial; recálculo al quitar; exclusión de recetas ya completas.
- Ya lo compré; retirada desde detalle y despensa; desmarcar sin añadir automáticamente; confirmación y cancelación de vaciado.
- Persistencia parcial y vacía de ambas listas; datos de compras inválidos; errores simulados de almacenamiento y de carga JSON.
- Teclado, foco después de editar, Escape y devolución del foco desde ambos diálogos.
- Ambas pestañas y diálogos a 1440, 390 y 320 píxeles sin desplazamiento horizontal; dibujos y fuente local cargados. Sin errores JavaScript en los flujos probados.

Para líneas repetidas y empate de tiempo se interceptó el JSON solo en pruebas temporales. No se alteraron artificialmente las recetas entregadas. Las herramientas de prueba están fuera del proyecto y no son dependencias de la app.

Pendiente: esta entrega en tu Live Server, otros navegadores, lector de pantalla y teléfonos reales. Las capturas móviles del detalle muestran su zona inicial: ingredientes y pasos adicionales se consultan desplazándose dentro del diálogo.

## Guardar en GitHub sin tocar main

1. Copiá los archivos descargados a la carpeta del repositorio en tu computadora.
2. En GitHub Desktop creá o seleccioná una rama de trabajo distinta de `main`.
3. Revisá **Changes**, escribí un resumen y hacé **Commit** en esa rama.
4. **Publish branch** o **Push origin** guarda código en GitHub; no publica una web.

Para traerlo a otra computadora, cloná el repositorio o hacé **Fetch origin**, seleccioná esa rama y usá **Pull origin** si aparece. Abrí la carpeta en VS Code y usá Live Server. No hagas merge a main ni actives GitHub Pages hasta autorizarlo.

## Alcance

Sin backend, dependencias, nutrientes, precios, perfil, planificador, recetas propias, mascota ni funciones premium. No se publicó ni se incorporaron cambios a main.

## Corrección del guardado coordinado

Al marcar un ingrediente disponible, se guarda primero la despensa. Solo si ese guardado tiene éxito se persiste su retirada de compras. `guardarDespensa()` y `guardarCompras()` devuelven `true` o `false`. La corrección también cubre Tengo todo y protege las escrituras posteriores de compras cuando hay una retirada temporal pendiente.

Si falla el almacenamiento, la pantalla puede reflejar el cambio durante la sesión, pero se avisa qué no quedó guardado. El aviso aparece también dentro del detalle o panel activo. Si falla la despensa, la lista guardada de compras conserva el ingrediente. Si falla solo compras, la despensa ya guardada conserva la disponibilidad y la reconciliación retira compras redundantes al recargar. La marca, los identificadores y las claves de almacenamiento no se cambiaron.

Se probaron los cuatro escenarios (normal, fallo solo de despensa, fallo solo de compras y fallo de ambos), desde despensa, detalle y Ya lo compré, con selección previa parcial y vacía: 24 combinaciones, todas con recarga. También Tengo todo, Desmarcar todo, retorno de éxito/fallo, una acción posterior de compras tras un fallo y un reintento exitoso. Se repitió el flujo de agrupación, búsqueda, categorías, detalle, compras compartidas, posibilidades, teclado y persistencia. Todas estas pruebas pasaron en Chromium. Queda comprobar esta entrega en tu Live Server y otros navegadores.

## Propuesta limitada al detalle de receta

El detalle usa fondo blanco sin papel, texto negro pimienta, verde albahaca y pequeños acentos rojo tomate. En computadora, información e ingredientes están en dos columnas; en celular, se apilan. La imagen va en el medio y la preparación numerada debajo. Cerrar permanece visible durante el desplazamiento interno. Se conservan las fuentes actuales y todas las acciones.

La foto adecuada no pudo verificarse y descargarse porque el destino consultado devolvió 403. Se muestra provisionalmente la ilustración original de los ingredientes, identificada como tal, sin cambiar los dibujos de las tarjetas. No se generaron imágenes ni se usó una fotografía de otro plato.

Pasaron las pruebas del flujo existente y del guardado coordinado (24 combinaciones y casos adicionales). También casillas, añadir/quitar compras, añadir todos, botón desactivado para receta completa, foco, Escape y cierre visible al desplazar en celular. Se capturó la tortilla de papas con disponibilidad parcial y completa en computadora y celular. Se comprobó contraste de los colores de texto sobre blanco, controles de al menos 44 píxeles y ausencia de desbordamiento horizontal. Pendiente: foto reutilizable del plato, otros navegadores, lectores de pantalla y teléfonos reales.

## Última simplificación de ingredientes del detalle

Se probaron añadir y quitar, añadir todos, selección de despensa sin cambios al añadir compras, editar despensa y actualizar la receta al volver, retirada automática de compras al marcar disponibilidad, persistencia al recargar, receta completa sin botón desactivado, aviso de almacenamiento fuera del desplegable, teclado, Escape y retorno de foco. Se generaron capturas con la misma tortilla y selección anterior, además del estado completo. No hay desplazamiento horizontal a 320, 390 y 1440 píxeles; botones de al menos 44 píxeles. Pendientes: Live Server del usuario, otros navegadores, lector de pantalla y dispositivos reales. Las pruebas anteriores que editaban casillas dentro del detalle describen versiones históricas; en la versión actual la edición se realiza en Mi despensa.

## Campo opcional datosDePrueba

`datosDePrueba` puede omitirse o tener `false`: la receta carga sin etiqueta de prueba. Con `true`, tarjetas y detalle muestran los avisos correspondientes. Cualquier otro tipo (incluidos null, texto y números) muestra un error de validación que indica el campo y la receta. El aviso general cuenta las recetas de prueba en catálogos mixtos; no presupone que todas lo sean. La ausencia de etiqueta no garantiza verificación nutricional, seguridad alimentaria ni derechos de reutilización.

El catálogo entregado conserva sus cinco recetas y valores `true`; no se añadieron recetas reales ni nutrientes. Las pruebas de true, false, campo ausente, catálogo mixto y tipos inválidos se realizan con datos temporales.

Resultados de esta modificación: pasaron en Chromium los seis casos de aceptación (catálogo actual, true, false, campo ausente, catálogo mixto y tipo inválido). Para tipos inválidos se probaron texto, número, null, objeto y lista. Los avisos se comprobaron en cabecera, contador, tarjetas y detalle; los errores identifican el campo y la receta, sin modificar almacenamiento. En un catálogo mixto se comprobó además búsqueda y añadir compras sin alterar disponibilidad. También se repitieron las pruebas del detalle simplificado, editar despensa, actualización, persistencia, teclado, foco y errores de guardado. Los datos temporales se sirvieron solo al navegador de pruebas; el JSON entregado y el CSS permanecen idénticos. Pendiente: comprobar esta entrega con Live Server en tu computadora y otros navegadores.

## Recuperación de referencias antiguas

Si un identificador guardado ya no existe en el catálogo, se descarta solo ese ingrediente y se conservan los demás. En compras se conservan las asociaciones a recetas que todavía existen. Un ingrediente vigente cuya receta desapareció permanece pendiente, con el texto Sin receta asociada, y puede quitarse o marcarse Ya lo compré.

Se informa brevemente cuando se descartaron referencias antiguas. La limpieza se guarda únicamente después de cargar y validar los catálogos. Un error de carga no escribe ni reemplaza los datos guardados. Si falla guardar la limpieza, las referencias se omiten durante la sesión y se avisa que los datos almacenados anteriores siguen intactos. Las claves y el guardado coordinado no cambian. Los errores de JSON o estructura inválida siguen usando el manejo de errores existente.

Se reprodujo antes de corregir: sal junto con un ID antiguo recuperaba cero seleccionados; una compra con receta antigua hacía recuperar cero compras incluso con otro ingrediente válido. Pasaron los seis casos solicitados con datos temporales: ingrediente añadido, ID antiguo en despensa, receta eliminada, ingrediente eliminado, selecciones vacías/recarga y fallos de carga sin escrituras. También persistencia de compras sin asociación, Ya lo compré, error al guardar la limpieza, reconciliación y catálogo incoherente. Se repitieron las pruebas del guardado coordinado y del campo datosDePrueba opcional. El catálogo entregado y el diseño permanecen iguales. Pendiente: esta entrega en tu Live Server y otros navegadores.
