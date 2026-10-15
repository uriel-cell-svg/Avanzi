# Historial de Avanzi

Este archivo conserva cambios y resultados informados en entregas anteriores. **El historial no es una lista de instrucciones vigentes ni acredita nuevas ejecuciones de pruebas.** Expresiones como «hoy», «última», «esta entrega» o «pendiente» dentro del archivo histórico se refieren a aquella versión.

Las reglas actuales están en [AGENTS.md](./AGENTS.md), el diseño aprobado en [DISEÑO.md](./DISEÑO.md), el formato en [DATOS.md](./DATOS.md) y el uso en [README.md](./README.md).

## 2026-10-15 · Siete tiempos auditados y recetas propias

- Se reemplazó solo `datos/recetas.json` por el del parche aportado. Las 39 recetas tienen tiempo total; siete son estimaciones documentadas en `datos/auditoria/tiempos_estimados_7_2026-10-15.{md,csv}`. Ingredientes, nutrientes e imágenes no se modificaron. «Rápidas» sigue siendo `< 20`, nunca `≤ 20`.
- «Crear receta» permite borrador, ingredientes del catálogo, porciones, tiempo, pasos ordenables, foto opcional, edición, duplicado y borrado con confirmación. Las recetas propias se guardan en una clave versionada separada y se integran al mismo motor de nutrición, clasificación, disponibilidad y compras. No se incorporó una segunda implementación de esos cálculos.
- Las fotos se validan y reducen a WebP local en IndexedDB; la receta guarda solo `imagenId`. El formulario informa fallos y puede conservar la receta sin foto. Borrar una receta planificada conserva la necesidad como compra sin asociación y no retira inventario adquirido.
- Pruebas ejecutadas: suite del paquete; 34 pruebas existentes de lógica; prueba de los 39 tiempos y siete estimaciones; 9 pruebas nuevas de recetas propias; 20 grupos existentes de Chromium y 11 grupos nuevos del editor. Los recorridos nuevos incluyen borrador, búsqueda por alias/tilde, edición, duplicado, compra parcial, borrado vinculado, foto y recarga, foto ausente/dañada/grande, IndexedDB deshabilitado, datos corruptos y anchos 320/390/1440 px. No se probó en un teléfono físico, otro navegador ni lector de pantalla.
- [ETAPAS_FUTURAS.md](./ETAPAS_FUTURAS.md) diseña perfil y recompensas por separado; no se programaron. El respaldo portátil de recetas propias y fotos sigue pendiente.

## 2026-10-15 · Integración efectiva: 39 recetas e inventario por cantidades

Esta entrega implementa el nuevo pedido sobre la beta existente. Sustituye la restricción de solo documentar nutrientes y la comparación por presencia. Conserva la identidad visual, las fuentes, pestañas, recuadro, búsquedas, filtros, instrucciones completas, respaldos y protección del guardado.

### Qué cambió

- Se incorporaron las 39 recetas, los 200 ingredientes, equivalencias y 39 WebP locales del paquete corregido. Los tres JSON principales y todos los WebP conservan los bytes del paquete. Sus fuentes y auditoría quedan en datos/auditoria; no se carga una segunda colección.
- app.js adapta los catálogos y conecta controles de inventario, porciones/preparaciones, compras y nutrición. HTML añade el filtro de categoría, editor de cantidades y controles necesarios; CSS extiende la identidad compartida sin cambiar fuentes ni colores.
- motor_avanzi.mjs conserva el cálculo nutricional del paquete. La detección de pastas deja de confundir pasta de curry/miso con fideos. compatibilidad.json registra dibujos previos y correcciones separadas de clasificación: repollo, chorizo y dashi; no cambia nutrientes.
- planificacion.mjs reúne conversiones, necesidades por receta, compras parciales, disponibilidad conjunta y detección de transiciones sin recompensas visuales. No guarda una cantidad a comprar derivada.
- almacenamiento.mjs guarda un snapshot v3 atómico en la clave existente de despensa. Lee formatos previos y operaciones provisionales; preserva cantidades desconocidas, compras y una copia del contenido legado. La clave de compras antigua permanece intacta, sin una segunda copia activa.
- Las reglas estables y documentos de uso/datos/diseño se actualizaron al alcance efectivamente implementado. Se incluyeron pruebas automáticas sin introducir dependencias para ejecutar la app.

### Regla de compras comprobada

Necesidades de 3 huevos + 3 huevos generan una sola fila de 6. Con 2 disponibles, el pendiente es 4. Repetir Añadir no lo duplica; aumentar porciones o preparaciones sí escala intencionalmente. Comprar 4 de 6 actualiza inventario a 4 y deja 2 pendientes. Quitar receta o vínculo reduce necesidades; eliminar una fila nunca retira alimentos disponibles.

Los datos antiguos no se interpretan como cantidades suficientes: conservan presencia y piden confirmación. Las correspondencias ambiguas se resuelven por elección del usuario. Para recetas incluidas, la disponibilidad reserva inventario en orden de incorporación sin asignarlo dos veces. Si se retiran vínculos o se editan necesidades a la baja, el detalle puede seguir indicando faltantes: sigue comprobando la receta completa.

### Pruebas ejecutadas en esta entrega

- Suite original del paquete, adaptando solo rutas de importación/datos: aprobada. Aceites, densidades, garbanzos/porotos cocidos, té excluido de ingestión, desconocidos, categorías y ocho correcciones editoriales conservadas.
- **34 pruebas automáticas de lógica aprobadas** (node --test pruebas/logica.mjs), incluidos A–H, agregación por ID, doble clic, porciones/preparaciones, unidades compatibles e incompatibles, secos/cocidos, té, edición y eliminación, compras reversibles, reserva conjunta y transiciones únicas tras recarga.
- En esas pruebas se comprobó además que las 39 recetas quedan completas al registrar sus cantidades, se guardan y recuperan; **156 pares de totales/porción** (4 nutrientes × 39 recetas) coinciden con el paquete dentro del redondeo de 0,11. Desconocido nunca se convierte en cero.
- Compatibilidad: formatos anteriores, operaciones provisionales de guardado anteriores, compras antiguas completadas, listas vacías, recetas retiradas, referencias obsoletas, formatos inválidos sin sobrescritura y fallo atómico con reintento. Ya no hay segunda escritura que pueda dejar inventario y compras en estados distintos.
- **20 grupos de pruebas de interfaz aprobados en Chromium**, con servidor HTTP local: A/C, B, D, H, E, F; edición y retirada de asociaciones; eliminar sin retirar inventario; error visible en diálogo y recarga; migración/correspondencia explícita; búsqueda, categorías y navegación; 39 imágenes; 39 detalles, instrucciones y nutrición; teclado/Escape/foco; selección vacía; datosDePrueba true/false/ausente/mixto/inválido; respaldo también fallido; fallo de catálogo sin escrituras; acceso a localStorage bloqueado sin impedir explorar.
- Revisados 320, 390 y 1440 px: sin desbordamiento horizontal de página/diálogos, controles comprobados de al menos 44 px y cierre visible al desplazar. Capturas reales renovadas en celular/computadora. Los colores principales conservan contraste de texto superior a 4,5:1.
- Sintaxis de los módulos comprobada. Los JSON, hashes de las 39 imágenes y archivos tipográficos se cotejaron con las fuentes; no se alteraron los datos corregidos ni las fuentes aprobadas.

Las pruebas con Omelette/Tortilla de 3 huevos usan fixtures temporales; no se añaden al catálogo de 39 recetas. La suite histórica que suponía solo presencia, cinco recetas, categorías antiguas o cantidades inexistentes queda superada por los nuevos requisitos, no se presenta como una ejecución aprobada sobre esta versión. Sus conductas todavía vigentes se verifican con las nuevas pruebas.

### Limitaciones y pendientes

- Siete recetas no informan tiempo total: se muestra desconocido y no entran en Rápidas por suposición. Las estimaciones nutricionales y equivalencias aportadas requieren revisión editorial; no equivalen a verificación clínica.
- Los datos previos sin cantidad necesitan confirmación; referencias ambiguas no se asignan a una variedad automáticamente. Se conserva el legado. No usar una app antigua para editar un snapshot nuevo.
- Sin equivalencia fiable no se mezclan unidades ni estados; una fila puede mostrar varias variantes. No se inventa rendimiento de seco a cocido.
- No hay cuentas, sincronización entre pestañas/dispositivos, calendario, editor de recetas, consumo automático al cocinar ni recompensas visuales. La transición queda preparada y persistida una vez por ID; borrar deliberadamente el almacenamiento local también borra ese historial.
- Pendientes: prueba del usuario en Live Server, teléfonos reales, otros navegadores, lector de pantalla y revisión independiente de fuentes/nutrición. No se publicó ni se incorporaron cambios a main.

## 2026-10-15 · Documentación para preparar recetas reales

Entrega exclusivamente documental, basada en Avanzi con recursos de respaldo. Se simplificó AGENTS, se separaron diseño y datos, y se trasladaron aquí los bloques de historial y pruebas del README. Los créditos documentales distinguen recursos actuales de usos históricos, sin modificar archivos de imágenes, fuentes ni licencias.

Se documentó el contrato real de los validadores y una propuesta separada, todavía no implementada, para cantidades textuales, fotografías, fuentes bibliográficas, páginas de PDF y macronutrientes publicados. No se añadieron recetas reales, nutrientes, cálculos, recursos ni la ilustración de marca pendiente.

### Comprobaciones de esta entrega

- **91 comprobaciones aprobadas**: ejecutadas contra las funciones reales validarRecetas y validarIngredientes, cargadas en memoria sin arrancar la interfaz ni escribir localStorage. Incluyen catálogos actuales, campos obligatorios, tipos, datosDePrueba true/false/ausente/mixto/inválido, cantidades, porciones, tiempo, nombres coherentes, IDs repetidos o inexistentes, categorías y dibujo opcional/rutas inválidas. Los ejemplos JSON de DATOS se analizaron; sus dos extractos actuales se probaron con los validadores. El ejemplo nutricional solo tiene sintaxis comprobada: su soporte sigue siendo una propuesta.
- **Lectura del código**: se cotejaron el reemplazo de nombres por metadatos en iniciar, las rutas y respaldos, el renderizado numérico de cantidades, los grupos de disponibilidad y las reglas de persistencia con la documentación. Esto no equivale a volver a probar la interfaz.
- **Integridad**: los 51 archivos no Markdown existentes conservan su SHA-256 inicial: HTML, CSS, JavaScript, JSON, imágenes, archivos tipográficos y licencias. Solo se modificaron cuatro documentos (AGENTS, README y los dos FUENTES) y se añadieron DISEÑO, DATOS y CAMBIOS.
- **Documentación**: 33 enlaces locales comprobados, siete categorías contrastadas con el código y diez bloques históricos del README preservados íntegros, salvo su nivel de encabezado. Se revisaron las decisiones obsoletas para distinguirlas del estado vigente.
- **Sintaxis**: node --check app.js aprobado; Node se usó como herramienta externa de verificación, no como dependencia de la app.
- **Entrega**: ZIP completo con comprobación de integridad y comparación de su contenido con los archivos del proyecto. Sin herramientas temporales ni datos de prueba adicionales.

No se ejecutaron nuevas pruebas de navegador, interfaz, contraste o persistencia en esta entrega documental. Los resultados de esas pruebas de otras entregas están archivados abajo. Continúan pendientes Live Server del usuario, teléfonos reales, otros navegadores y lector de pantalla. Las ampliaciones propuestas requerirán implementación y pruebas nuevas cuando se soliciten.

## Histórico: restricciones resueltas en la entrega documental anterior

| Indicación histórica | Situación actual |
| --- | --- |
| Aplicar el diseño solo a una pantalla. | La identidad blanca de Lo que tengo ya se comparte con Recetas, detalle y compras. Conservarla según DISEÑO. |
| Usar papel arrugado, ramita o las frases de bienvenida. | Presentaciones retiradas. Los créditos históricos no ordenan restaurarlas. |
| Incorporar el trío de tomate, mozzarella y albahaca. | Recurso pendiente, no incorporado. La marca actual es Avanzi como texto. No sustituirlo ni generarlo por esta tarea. |
| Exigir datosDePrueba: true o una ilustración para cada ingrediente. | El booleano es opcional; dibujo también. Aplicar el contrato de DATOS. |
| Prohibir cualquier trabajo sobre nutrientes o PDF. | Se autoriza documentar nutrientes publicados y referencias a páginas de fuentes. No se implementan visualización, cálculos ni importación de PDF en esta entrega. |
| Editar disponibilidad en el detalle; botón Ya lo compré; retirar filas al comprarlas. | Interacciones sustituidas: detalle de lectura y checklist con Comprados, propiedad reversible y guardado coordinado. |
| Ofrecer tres órdenes elegibles de recetas. | La versión actual clasifica en tres grupos y ordena por faltantes, tiempo y nombre; no tiene selector manual. |
| No tocar ningún código durante una revisión anterior. | Era una restricción de aquella tarea. Esta entrega también es solo documental por pedido expreso; futuros cambios necesitan su alcance propio. |

## Archivo trasladado del README · pruebas históricas

Los bloques siguientes se conservan con sus resultados y lenguaje originales. Las menciones a casillas en detalle, «Mi despensa», «Ya lo compré», retirada automática de compras, fondos antiguos o ilustraciones pendientes describen versiones anteriores, no acciones que deba realizar la app actual. Las cantidades de casos son las informadas entonces; no se suman como nuevas pruebas.

### Pruebas históricas de versiones anteriores

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


### Evolución del guardado coordinado

La protección de versiones anteriores se conserva mediante el registro provisional descrito arriba. El nuevo comportamiento guarda tanto la disponibilidad como el estado de la fila y quién incorporó el ingrediente. Las pruebas históricas con Ya lo compré corresponden a la interacción anterior; hoy se compra marcando una casilla y la fila se conserva.


### Histórico: propuesta limitada al detalle de receta

El detalle usa fondo blanco sin papel, texto negro pimienta, verde albahaca y pequeños acentos rojo tomate. En computadora, información e ingredientes están en dos columnas; en celular, se apilan. La imagen va en el medio y la preparación numerada debajo. Cerrar permanece visible durante el desplazamiento interno. Se conservan las fuentes actuales y todas las acciones.

La foto adecuada no pudo verificarse y descargarse porque el destino consultado devolvió 403. Se muestra provisionalmente la ilustración original de los ingredientes, identificada como tal, sin cambiar los dibujos de las tarjetas. No se generaron imágenes ni se usó una fotografía de otro plato.

Pasaron las pruebas del flujo existente y del guardado coordinado (24 combinaciones y casos adicionales). También casillas, añadir/quitar compras, añadir todos, botón desactivado para receta completa, foco, Escape y cierre visible al desplazar en celular. Se capturó la tortilla de papas con disponibilidad parcial y completa en computadora y celular. Se comprobó contraste de los colores de texto sobre blanco, controles de al menos 44 píxeles y ausencia de desbordamiento horizontal. Pendiente: foto reutilizable del plato, otros navegadores, lectores de pantalla y teléfonos reales.


### Última simplificación de ingredientes del detalle

Se probaron añadir y quitar, añadir todos, selección de despensa sin cambios al añadir compras, editar despensa y actualizar la receta al volver, retirada automática de compras al marcar disponibilidad, persistencia al recargar, receta completa sin botón desactivado, aviso de almacenamiento fuera del desplegable, teclado, Escape y retorno de foco. Se generaron capturas con la misma tortilla y selección anterior, además del estado completo. No hay desplazamiento horizontal a 320, 390 y 1440 píxeles; botones de al menos 44 píxeles. Pendientes: Live Server del usuario, otros navegadores, lector de pantalla y dispositivos reales. Las pruebas anteriores que editaban casillas dentro del detalle describen versiones históricas; en la versión actual la edición se realiza en Mi despensa.


### Campo opcional datosDePrueba

`datosDePrueba` puede omitirse o tener `false`: la receta carga sin etiqueta de prueba. Con `true`, tarjetas y detalle muestran los avisos correspondientes. Cualquier otro tipo (incluidos null, texto y números) muestra un error de validación que indica el campo y la receta. El aviso general cuenta las recetas de prueba en catálogos mixtos; no presupone que todas lo sean. La ausencia de etiqueta no garantiza verificación nutricional, seguridad alimentaria ni derechos de reutilización.

El catálogo entregado conserva sus cinco recetas y valores `true`; no se añadieron recetas reales ni nutrientes. Las pruebas de true, false, campo ausente, catálogo mixto y tipos inválidos se realizan con datos temporales.

Resultados de esta modificación: pasaron en Chromium los seis casos de aceptación (catálogo actual, true, false, campo ausente, catálogo mixto y tipo inválido). Para tipos inválidos se probaron texto, número, null, objeto y lista. Los avisos se comprobaron en cabecera, contador, tarjetas y detalle; los errores identifican el campo y la receta, sin modificar almacenamiento. En un catálogo mixto se comprobó además búsqueda y añadir compras sin alterar disponibilidad. También se repitieron las pruebas del detalle simplificado, editar despensa, actualización, persistencia, teclado, foco y errores de guardado. Los datos temporales se sirvieron solo al navegador de pruebas; el JSON entregado y el CSS permanecen idénticos. Pendiente: comprobar esta entrega con Live Server en tu computadora y otros navegadores.


### Recuperación de referencias antiguas

Si un identificador guardado ya no existe en el catálogo, se descarta solo ese ingrediente y se conservan los demás. En compras se conservan las asociaciones a recetas que todavía existen. Un ingrediente vigente cuya receta desapareció permanece pendiente, con el texto Sin receta asociada, y puede quitarse o marcarse Ya lo compré.

Se informa brevemente cuando se descartaron referencias antiguas. La limpieza se guarda únicamente después de cargar y validar los catálogos. Un error de carga no escribe ni reemplaza los datos guardados. Si falla guardar la limpieza, las referencias se omiten durante la sesión y se avisa que los datos almacenados anteriores siguen intactos. Las claves y el guardado coordinado no cambian. Los errores de JSON o estructura inválida siguen usando el manejo de errores existente.

Se reprodujo antes de corregir: sal junto con un ID antiguo recuperaba cero seleccionados; una compra con receta antigua hacía recuperar cero compras incluso con otro ingrediente válido. Pasaron los seis casos solicitados con datos temporales: ingrediente añadido, ID antiguo en despensa, receta eliminada, ingrediente eliminado, selecciones vacías/recarga y fallos de carga sin escrituras. También persistencia de compras sin asociación, Ya lo compré, error al guardar la limpieza, reconciliación y catálogo incoherente. Se repitieron las pruebas del guardado coordinado y del campo datosDePrueba opcional. El catálogo entregado y el diseño permanecen iguales. Pendiente: esta entrega en tu Live Server y otros navegadores.


### Pruebas de la lista con casillas

Se probaron datos antiguos sin cambios al abrir, marcar/desmarcar, disponibilidad anterior que no debe retirarse, eliminación de filas compradas y pendientes, ingredientes compartidos y asociaciones, recarga, listas vacías, confirmación de vaciado, sincronización manual y global desde Mi despensa, reapertura sin duplicación y posibilidades totales/parciales. Se verificó que las recetas completas no aparezcan entre las posibilidades.

Diez escenarios de marcar/desmarcar con guardado normal, fallo solo de despensa, fallo de compras, fallo de ambas y fallo de la última confirmación recuperaron la fila, su estado y su reversibilidad. Se comprobó también una acción posterior que reintenta guardar sin pérdida; carga de catálogo fallida sin escrituras; formatos inválidos sin sobrescritura; referencias antiguas; y regresión del campo datosDePrueba opcional.

Se revisaron teclado, foco al mover filas, plegar/desplegar Comprados, Escape, controles de al menos 44 píxeles y ausencia de desplazamiento horizontal a 320, 390 y 1440 píxeles. Las capturas son del código renderizado. Pendiente: tu Live Server, otros navegadores, lector de pantalla y teléfonos reales.

Prueba sencilla: añadí los faltantes de una receta. En compras, marcá uno: debe pasar a Comprados y aparecer en la despensa. Desmarcalo: debe volver a Pendientes y retirarse de la despensa si esa compra lo incorporó. Marcá otra vez y eliminá la fila con ×: debe seguir en la despensa. Recargá y comprobá que el estado se conserva.


### Histórico: Recuadro de seleccionados

Se aplica solo a Lo que tengo: blanco, Avanzi en negro, selección y acciones verdes, pequeños indicadores rojos y trece dibujos locales coloreados sobre transparencia. La tipografía aprobada, recetas, datos, IDs, almacenamiento y reglas de compras se conservan. Esta fue la revisión previa limitada a Lo que tengo; la última unificación, descrita al final, extiende su identidad a Recetas, detalle y compras.

Se recibió luego el boceto B y se ajustó la propuesta existente: marca más protagonista, pestaña subrayada, contador rojo sobre la bolsa, recuadro crema compacto, categorías en una fila desplazable y barra inferior con contador, ⋮ y acción principal. Los dibujos siguen siendo variantes de los SVG propios existentes; no se recortaron ilustraciones del boceto ni se generaron imágenes. El acabado con volumen de la referencia queda pendiente de recursos individuales apropiados. No se añadieron queso ni categorías ficticias: se usa el catálogo actual. La acción inferior está en el flujo del documento para evitar superposiciones; el recuadro usa desplazamiento horizontal y mantiene una altura acotada.

Pruebas aprobadas en Chromium: selección y desmarcado desde tarjetas y recuadro, orden estable del catálogo, búsquedas sin tildes/mayúsculas, categorías, recuadro completo con filtros, recarga parcial/vacía y 13 seleccionados con desplazamiento horizontal. Se comprobó teclado (Space, Enter, Escape y flechas), foco tras desmarcar, menú y Ayuda, controles de al menos 44 píxeles y ausencia de desplazamiento horizontal de página a 320, 390 y 1440 píxeles. Los contrastes de texto comprobados superan 4,5:1.

También pasaron resultados, búsqueda de recetas, detalle y Editar lo que tengo, sincronización manual con compras, asociaciones compartidas, propiedad reversible de compra, listas vacías/datos antiguos, referencias obsoletas y errores visibles. Diez escenarios de marcar/desmarcar con guardado normal o fallos de despensa, compras, ambas o confirmación final conservaron fila y reversibilidad al recargar. Los fallos de carga no escriben almacenamiento; los formatos inválidos no se sobrescriben automáticamente. Se repitieron true, false, campo ausente, catálogo mixto y cinco tipos inválidos de datosDePrueba; las recetas entregadas no se alteraron.

Se abrió además el proyecto desde un servidor HTTP local real: cargaron JSON, fuentes y dibujos sin errores JavaScript, archivos fallidos ni peticiones a servicios externos. Las capturas corresponden al código implementado. Se comprobó una ventana móvil reducida sin barra superpuesta; queda pendiente el teclado virtual de un teléfono real, otros navegadores, lector de pantalla y tu Live Server. Los JSON, fuentes y dibujos originales de las otras pantallas conservan sus comprobaciones SHA-256. Las herramientas de prueba y las capturas quedan fuera del código de la app, sin dependencias nuevas.

Validación del ajuste al boceto recibido: pasaron nuevamente selección desde ambas zonas, búsqueda/categorías, recarga parcial y vacía, trece seleccionados, foco/teclado, resultados y detalle. También compras, asociaciones, compatibilidad y diez escenarios de escritura normal o fallida. Las capturas nuevas muestran los cuatro ingredientes de la referencia que ya existen en el catálogo: tomate, huevo, aceite y espinaca. Se conservó el orden original del catálogo.


### Diseño unificado · referencia aprobada

Lo que tengo sigue siendo la referencia de composición y funcionamiento. Recetas, detalle y compras usan ahora el mismo fondo blanco, texto negro suave, acciones verdes, foco visible, campos compactos y bordes discretos. Se retiraron del HTML las dos frases de bienvenida y del CSS las texturas/adornos: no se ocultan mediante estilos distintos según pestaña.

Las tarjetas reutilizan los dos alimentos de los SVG coloreados existentes del detalle. Compras reutiliza los dibujos individuales coloreados de Lo que tengo. No se modificaron los SVG, fuentes ni JSON. Se conserva la clasificación 0 / 1–3 / más de 3, sus desempates y filtros. Hay contadores pequeños junto a los títulos y Sin coincidencias cuando una búsqueda o filtro deja una sección vacía. Se retiró la explicación repetida de cada receta completa; las cantidades e instrucciones siguen completas en el detalle. Las aclaraciones generales están en Ayuda, con etiquetas de prueba y errores fuera del desplegable.

Se tocó JavaScript únicamente para presentar los contadores, mensajes, etiquetas y rutas a dibujos existentes, y retirar la clase que cambiaba el aspecto por pestaña. Las 28 funciones restantes y los cálculos, validaciones y guardado conservan su código. Se comprobaron por comparación los JSON, fuentes y todos los dibujos SVG originales. Las claves y las selecciones guardadas no cambian.

**Ilustración de marca pendiente de archivo:** la imagen de tomate, mozzarella y albahaca se ve en el mensaje del usuario, pero su PNG original no está disponible como archivo descargable en este entorno. La cabecera muestra por ahora Avanzi como texto, sin sustituir la imagen por otra. Para incorporarla y optimizarla con transparencia hace falta recibir el PNG como archivo o dentro de un ZIP. La ilustración fue generada con ChatGPT según el usuario; su procedencia se documenta en imagenes/FUENTES.md. La verificación de tamaños, proporción y legibilidad de esa ilustración queda pendiente.

Pruebas aprobadas en Chromium: diez cambios de pestaña con cabecera y fondo estables; búsqueda sin tildes/mayúsculas; filtros; tres secciones y sus contadores; mensajes de búsqueda vacía; detalle sin casillas, con estados y pasos completos; añadir/quitar individual y todos los faltantes; Editar lo que tengo; checklist reversible y recetas posibles después de comprar; recarga parcial/vacía. También menú ⋮, selección desde las dos zonas, filtros activos y trece seleccionados con desplazamiento horizontal.

Se repitieron compatibilidad con datos antiguos, asociaciones compartidas, referencias obsoletas, datos inválidos y fallos de carga sin escrituras. Diez escenarios de marcar/desmarcar con guardado normal o fallos de despensa, compras, ambas y confirmación final conservaron estado y reversibilidad tras recargar. Se repitieron true, false, campo ausente, catálogo mixto y cinco tipos inválidos de datosDePrueba.

Se comprobó teclado, foco al actualizar, Escape y retorno de foco, cierre visible durante el desplazamiento interno, controles de al menos 44 píxeles y ausencia de desbordes a 320, 390 y 1440 píxeles. Las capturas preliminares son del proyecto abierto en un servidor HTTP local real, sin errores JavaScript ni archivos fallidos en los flujos probados. Quedan pendientes el PNG de marca y su evaluación sobre blanco a ambos tamaños, tu Live Server, teléfonos reales, otros navegadores y lector de pantalla. Las herramientas están fuera del proyecto y no son dependencias de la app.


### Ilustraciones opcionales y respaldo · última modificación

Se puede añadir una receta al JSON sin crear un dibujo específico. Avanzi conserva la convención actual: busca `imagenes/detalle/<id-de-receta>.svg`; si no existe o falla, usa `imagenes/por-defecto/receta.svg`. El detalle lo identifica como **Ilustración genérica de cocina**, sin presentarlo como fotografía o representación del plato.

En `datos/ingredientes.json`, **id, nombre y categoria siguen siendo obligatorios**. Podés omitir la propiedad `dibujo`; Avanzi usa `imagenes/por-defecto/ingrediente.svg`. Si la incluís, debe seguir siendo una ruta local como `./imagenes/despensa/huevo.svg`. No uses null, números o una cadena vacía para indicar ausencia: omití la propiedad. Solo se admiten las categorías existentes y los identificadores deben ser únicos y corresponder a los de las recetas.

Cuando hay un dibujo definido, primero se intenta la variante coloreada de Lo que tengo; si falta, se conserva el original, y después se intenta el recurso por defecto. Esa misma recuperación se usa en catálogo, recuadro y compras. Cada ruta se intenta una sola vez por imagen. Si también falla el respaldo, la imagen queda invisible conservando su espacio: el nombre, las casillas, las acciones y los pasos siguen disponibles. En el detalle se indica **Sin ilustración**. No hay bucles de reintentos ni cambios de selección causados por imágenes.

Cambios: `app.js` concentra la recuperación en una función y permite omitir dibujo; `estilos.css` añade únicamente la regla que oculta una imagen fallida sin cambiar sus dimensiones; `imagenes/por-defecto/` contiene dos SVG propios. Se actualizaron README, AGENTS y procedencia. El HTML, los JSON entregados, las fuentes y los recursos anteriores se conservaron. Las funciones de disponibilidad, clasificación, compras y almacenamiento no cambiaron. No se añadieron recetas reales, nutrientes ni la marca pendiente.

Pasaron los seis casos pedidos con datos temporales: receta nueva sin SVG propio en tarjeta/detalle; ingrediente sin dibujo en catálogo/seleccionados/compras; rutas inexistentes con cada candidata intentada una sola vez; respaldo también inexistente sin iconos rotos, con nombres/controles y tamaños conservados; ilustraciones actuales sin solicitar respaldos; y selección, compras reversibles y recarga parcial/vacía. También se conservó el SVG original cuando faltó solo su variante coloreada.

Se verificó que omitir dibujo no debilita ID, nombre ni categoría. Se rechazaron ID vacío/duplicado, nombre vacío, categoría desconocida, dibujo null/numérico, ruta externa y cadena vacía, sin escribir almacenamiento ante una carga inválida. El detalle etiqueta el recurso genérico y mantiene pasos completos. Se comprobó foco al comprar, navegación con teclado, Escape y ausencia de bucles tras terminar las cargas.

Se repitieron las pruebas de guardado coordinado (diez escenarios normales o fallidos), compatibilidad/referencias antiguas, datosDePrueba opcional, búsqueda/categorías y selección desde ambas zonas. El proyecto se abrió además con servidor HTTP real: navegación repetida, clasificación/filtros, detalle y checklist, controles de 44 píxeles y 320/390/1440 sin desbordes. Las funciones de cálculo y guardado, el HTML, los JSON, fuentes y SVG previos siguen idénticos a la base aprobada.

Las capturas muestran el código implementado con catálogos temporales enviados solo al navegador, sin incluir esos datos en el ZIP. Las herramientas de prueba quedan fuera del proyecto. Pendiente: tu Live Server, teléfonos reales, otros navegadores y lector de pantalla. La marca pendiente no se incorporó en este pedido.
# 2026-10-15 · Estabilización de recetas propias y persistencia

Antes de modificar se creó la rama de respaldo `backup/pre-estabilizacion-2026-10-15` con el commit `e276d39`; el trabajo continúa en `estabilizacion-avanzi`. El catálogo, el diseño, las claves y los formatos guardados no cambiaron.

- Se reprodujo un borrado real: al guardar una foto distinta en el borrador de una receta publicada, se eliminaba de IndexedDB la foto que seguía usando la receta publicada. Ahora solo se limpia un Blob después del guardado y cuando ninguna receta ni borrador lo referencia.
- Se añadió detección de cambios entre pestañas para las dos claves activas. Una pestaña obsoleta muestra un aviso y no sobrescribe lo que otra ya guardó. `localStorage` carece de compare-and-swap atómico; dos escrituras exactamente simultáneas siguen siendo un límite de esta arquitectura.
- Al cambiar o borrar una receta propia vinculada a compras, la conversión de sus necesidades en entradas manuales se concentra en `planificacion.mjs`. Si falla el segundo guardado, se intenta restaurar el snapshot anterior. Si también falla la restauración, Avanzi bloquea más escrituras y pide recargar, sin presentar el estado temporal como confirmado.
- La validación y adaptación del catálogo público pasaron de `app.js` a `catalogo_avanzi.mjs`, sin alterar sus reglas. `persistencia_navegador.mjs` contiene la detección de pestañas; `app.js` conserva la coordinación y el DOM. No se introdujo ninguna dependencia circular.

**Pruebas ejecutadas en esta entrega:** `node pruebas/paquete.mjs` (39 recetas, 200 ingredientes y 39 estimaciones), `node --test pruebas/logica.mjs pruebas/recetas_usuario.mjs pruebas/persistencia_navegador.mjs` (49/49), `node pruebas/tiempos_estimados.mjs` (39 tiempos y siete estimaciones auditadas). Chromium: 20 grupos de interfaz, 11 del editor y tres regresiones nuevas (foto publicada/borrador con recarga, pestaña obsoleta y fallo intermedio con restauración). Los 33 grupos de navegador se repitieron también bajo `/avanzi/` para simular GitHub Pages en subruta; las 39 imágenes WebP y los módulos cargaron allí. No se publicó ni se hizo push. Pendientes: dispositivos reales, otros navegadores y concurrencia exactamente simultánea entre pestañas.
# 2026-10-15 · Selección simple y compras recuperables

La versión estabilizada sigue siendo la base. Lo que tengo alterna presencia al tocar la tarjeta, sin pedir cantidades. Las cantidades anteriores permanecen en el snapshot local, pero ya no se usan para decidir disponibilidad ni descontar compras. Las recetas y nutrientes mantienen sus cantidades. No cambiaron los 39 registros de recetas, 200 ingredientes, IDs, claves, fotografías ni imágenes del paquete.

`planificacion.mjs` guarda `completado` en cada vínculo de receta/ingrediente y necesidad manual. La lista suma solamente las subtareas pendientes, permite completar cada una o todas las de un ingrediente y mueve a «Compras completadas» los ingredientes sin pendientes. Desmarcar recupera la subtarea y su cantidad tras recargar. Las compras anteriores se conservan como historial y, cuando hay recibos antiguos sin estado de subtarea, se muestra un aviso para revisarlas; no se supone que estén completadas. El editor ahora usa un único buscador por nombre/alias y ofrece cantidad/unidad después de elegir; retira «Presentación» y «Duplicar receta». Un borrador se continúa, reemplaza con confirmación o descarta expresamente. Se conserva el guardado de fotos en IndexedDB y la protección ante fallos o pestañas desactualizadas.

**Pruebas ejecutadas:** 57/57 pruebas Node de lógica, recetas propias, persistencia y ocho casos nuevos de presencia/subtareas; verificación del paquete de 39 recetas, 200 ingredientes, 39 estimaciones y siete tiempos auditados. Chromium pasó seis grupos de flujo (incluidas 39 imágenes, detalles, nutrición, Escape, foco y anchos 320/360/390/768/1440) y tres regresiones de foto/persistencia, tanto en raíz como bajo `/avanzi/`. Los scripts de navegador para el antiguo formulario de cantidades se conservaron en `pruebas/historicas/`; sus comandos anteriores ejecutan las suites actuales. No se probó un teléfono físico ni el teclado virtual real.
