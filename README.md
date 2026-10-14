# Avanzi · Recetas, despensa y compras

Proyecto para la facultad, sin fines de lucro. Ayuda a decidir qué cocinar con lo que tenés y reúne ingredientes por conseguir. Las cinco recetas son datos de prueba. Se comprueba presencia de ingredientes, **no cantidades suficientes ni seguridad alimentaria**.

## Abrir con Live Server

1. Extraé el ZIP completo en una carpeta. Conservá las carpetas `datos`, `imagenes` y `fuentes`.
2. En VS Code: **Archivo → Abrir carpeta**, y seleccioná esa carpeta.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

No hace falta Node.js, instalar paquetes ni compilar. No abras el archivo haciendo doble clic: el JSON necesita un servidor como Live Server. Las fuentes y dibujos son locales, sin servicios externos.

Si reemplazás una versión anterior, usá la misma dirección y puerto de Live Server para recuperar los datos de ese navegador. Una carpeta distinta puede abrirse en otro puerto: los datos de localStorage no se comparten entre direcciones, puertos o navegadores.

## Mi despensa

La app empieza en esta pestaña. Marcá ingredientes; los dibujos son decorativos y los nombres siempre están visibles. Buscá sin distinguir mayúsculas o tildes y elegí una categoría. Solo aparecen categorías con ingredientes. Buscar y filtrar no modifica tu selección; el contador muestra toda la despensa.

**Tengo todo** y **Desmarcar todo** actúan sobre todos los ingredientes, aunque estén ocultos por búsqueda o categoría. Si el ingrediente ya tiene fila en compras, marcarlo lo mueve a Comprados y desmarcarlo lo devuelve a Pendientes. No se crean filas nuevas automáticamente.

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

El acceso superior cuenta **solo pendientes**. Cada fila tiene casilla, dibujo, nombre y × para eliminar. Los orígenes de receta se conservan internamente sin mostrarlos; no se duplican ingredientes compartidos.

- Marcar la casilla añade el ingrediente a Mi despensa y mueve la fila a **Comprados (N)**, con el nombre tachado. La sección se puede plegar y desplegar.
- Desmarcar devuelve la fila a Pendientes y retira de la despensa solamente la disponibilidad que incorporó esa compra. Si ya lo tenías, se conserva.
- × elimina la fila y sus asociaciones, sin quitar ni añadir nada a la despensa.
- Vaciar lista pide confirmación y conserva la despensa.

Una fila pendiente es una tarea de compra: puede seguir pendiente aunque ya tengas el ingrediente, cuando lo tenías antes y desmarcás la compra. Esto evita que deshacer una tarea borre una selección previa.

**Regla de coordinación con Mi despensa:** una edición manual toma prioridad. Si hay una fila, marcar desde Mi despensa la mueve a Comprados; desmarcar la devuelve a Pendientes. Esa acción manual quita a la compra la propiedad de la selección: deshacer la compra después no retira una disponibilidad elegida manualmente. Tengo todo y Desmarcar todo aplican esta regla a todas las filas, sin eliminarlas ni crear otras.

Si un ingrediente comprado deja de estar disponible, su fila se reabre como pendiente. Volver a añadirlo desde una receta no lo duplica y conserva los orígenes anteriores. Añadir a compras nunca significa tenerlo.

Debajo se muestran recetas que todavía están incompletas y quedarían completas con la **despensa real más las compras pendientes**. Se excluyen las ya completas y las parcialmente cubiertas. No se suman cantidades ni se calculan precios. La nota recuerda revisar cantidades; el resto está en Sobre esta lista. Los errores de guardado siguen visibles.

Las casillas y los botones tienen nombres accesibles; el foco sigue al ingrediente al cambiar de sección, y Comprados se abre cuando hace falta para mantenerlo visible. Cerrar o Escape devuelve el foco al acceso superior.

## Guardado y compatibilidad

Se conservan las claves `que-cocino.despensa.v1` y `que-cocino.compras.v1`. La despensa sigue siendo un arreglo de IDs. Las compras antiguas (`[{id, recetas}]`) se leen sin perder filas o asociaciones. No se reescriben solo por abrir la app; cuando hace falta guardar un cambio se usa el nuevo formato.

Las compras ahora contienen un objeto con `version: 2` e `items`. Cada item conserva `id`, `recetas`, `comprado` e `incorporadoPorCompra`. Este último registra si la casilla de compras incorporó la disponibilidad, para deshacerla con seguridad. Una fila antigua que ya estaba disponible se conserva como comprada, con propiedad falsa, en vez de desaparecer.

Para cambiar disponibilidad y estado de compra juntos, se guarda provisionalmente el estado anterior y la operación deseada en la misma clave de compras. Después se guarda la despensa y se confirma la lista. Si una escritura falla, se muestra un aviso y las pantallas pueden reflejar cambios temporales. Al recargar se usa el estado anterior si la despensa no confirmó la operación; si la confirmó, se recuperan la fila nueva y su propiedad desde la operación provisional. Así tampoco se pierde la posibilidad de deshacer una compra si falla la última escritura.

No hay claves nuevas ni migraciones que borren listas. Un error de carga del catálogo no escribe almacenamiento. Las referencias antiguas se limpian sin perder ingredientes vigentes; se permiten filas sin receta de origen. Un JSON inválido o una versión desconocida muestra un aviso sin sobrescribir automáticamente los datos anteriores.

Las listas se conservan parciales o vacías al recargar en el mismo navegador y dirección. No se sincronizan entre dispositivos o pestañas abiertas simultáneamente. Borrar los datos del navegador borra las listas.

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
5. Marcá las casillas de Papa y Cebolla en la lista. La tortilla ahora debe estar completa.
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

## Evolución del guardado coordinado

La protección de versiones anteriores se conserva mediante el registro provisional descrito arriba. El nuevo comportamiento guarda tanto la disponibilidad como el estado de la fila y quién incorporó el ingrediente. Las pruebas históricas con Ya lo compré corresponden a la interacción anterior; hoy se compra marcando una casilla y la fila se conserva.

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

## Pruebas de la lista con casillas

Se probaron datos antiguos sin cambios al abrir, marcar/desmarcar, disponibilidad anterior que no debe retirarse, eliminación de filas compradas y pendientes, ingredientes compartidos y asociaciones, recarga, listas vacías, confirmación de vaciado, sincronización manual y global desde Mi despensa, reapertura sin duplicación y posibilidades totales/parciales. Se verificó que las recetas completas no aparezcan entre las posibilidades.

Diez escenarios de marcar/desmarcar con guardado normal, fallo solo de despensa, fallo de compras, fallo de ambas y fallo de la última confirmación recuperaron la fila, su estado y su reversibilidad. Se comprobó también una acción posterior que reintenta guardar sin pérdida; carga de catálogo fallida sin escrituras; formatos inválidos sin sobrescritura; referencias antiguas; y regresión del campo datosDePrueba opcional.

Se revisaron teclado, foco al mover filas, plegar/desplegar Comprados, Escape, controles de al menos 44 píxeles y ausencia de desplazamiento horizontal a 320, 390 y 1440 píxeles. Las capturas son del código renderizado. Pendiente: tu Live Server, otros navegadores, lector de pantalla y teléfonos reales.

Prueba sencilla: añadí los faltantes de una receta. En compras, marcá uno: debe pasar a Comprados y aparecer en la despensa. Desmarcalo: debe volver a Pendientes y retirarse de la despensa si esa compra lo incorporó. Marcá otra vez y eliminá la fila con ×: debe seguir en la despensa. Recargá y comprobá que el estado se conserva.
