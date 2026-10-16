# Datos de Avanzi · integración de 39 recetas

Contrato de catálogo y persistencia vigente. La disponibilidad visible volvió a ser binaria; las cantidades siguen en recetas, compras y nutrición. Los nutrientes, rendimientos, ingredientes y equivalencias del paquete se conservan. `datos/recetas.json` incorpora únicamente la corrección auditada de siete tiempos del parche del 15-10-2026.

## Catálogos activos

- `datos/recetas.json`: objeto con `version`, `idioma`, `estado` y arreglo `recetas` de 39 registros. IDs `pdr-…` originales y únicos. La carga también acepta un arreglo de recetas para pruebas/compatibilidad del contenedor.
- `datos/ingredientes.json`: objeto con `version`, `idioma`, `baseNutricional`, `nota` y arreglo `ingredientes` de 200 registros. No se cargan los catálogos anteriores como colección adicional.
- `datos/equivalencias_g.json`: medidas y equivalencias aportadas. No se interpretan pesos de legumbres secas como rendimientos cocidos.
- `datos/compatibilidad.json`: referencias a los dibujos propios por ID y ajustes de clasificación. No duplica fichas nutricionales.
- `datos/auditoria/`: trazabilidad, originales en inglés e informes históricos del paquete. No son datos activos ni instrucciones que reemplacen el pedido del usuario.

### Recetas

`id` y `nombre` son textos no vacíos; ID único. `porciones` es entero positivo. `tiempoTotalMinutos` (o `tiempoMinutos` del contenedor anterior) puede ser positivo o desconocido (`null`/ausente); no se deduce de los pasos. Las 39 recetas actuales tienen tiempo total. Siete valores son estimaciones auditadas en `datos/auditoria/tiempos_estimados_7_2026-10-15.md` y tienen `revision.tiempoEstimado: true`. `pasos` es un arreglo no vacío de textos no vacíos, conservados en orden.

`datosDePrueba` sigue siendo opcional: true etiqueta; false/ausencia no etiquetan; otro tipo provoca error. Su ausencia no verifica nutrición, seguridad ni derechos. Las 39 recetas aportadas no llevan la etiqueta de prueba; conservan las advertencias editoriales y de estimación del paquete.

Cada línea de `ingredientes` contiene `ingredienteId` (se acepta `id` como nombre anterior de ese campo), `cantidad` numérica positiva y `unidad` no vacía. El ID debe existir en los metadatos. La nueva colección no necesita duplicar `nombre` en cada línea: el nombre se resuelve por ID. Las líneas repetidas de un ID se suman para calcular necesidades, respetando estado y unidad compatible; no se duplican filas por diferencias de texto.

Se conservan también `texto`, `textoOriginalEn`, `medidaOriginalEs`, `gramosComestibles`, `estadoAlimento`, `perfilNutricionalUsado`, `noUsarValoresSecosParaCocidos`, `incluidoEnCalculo`, `motivoExclusion`, `estimacionPeso`, confianza y notas de conversión, cuando existen. La nutrición usa estos campos del paquete; no se deduce masa ingerida a partir de la cantidad comprada de hojas de té.

`imagen.ruta` es local, sin segmentos `..`, dentro de `imagenes/`; admite SVG/WebP/PNG/JPG en minúsculas. Las 39 rutas WebP se preservan. `generadaConIA`/`tipo` y el inventario de imágenes permiten identificar las imágenes como ilustrativas. Si falta o falla una imagen propia se usa el respaldo local; si falla también, se oculta conservando dimensiones y controles.

`fuente` registra sitio, URL, autor, licencia declarada y archivo original. `fuente.archivoOriginal` es trazabilidad: sus textos están bajo `datos/auditoria/originales_en/`, no se usa ese campo como ruta de interfaz. `nutricion` guarda los resultados de referencia del paquete para cotejo; **la interfaz calcula con un único motor**, no suma de nuevo resultados ya precalculados. `revision`, `rendimientoEstimado` y referencias comparativas se conservan sin convertirlas en una garantía de validación.

### Ingredientes

ID único y nombre no vacío (`nombreEs`; se admite `nombre` al adaptar). Se conservan `nombreEn`, `aliasEs`, `aliasEn`, `por100g`, `grupo`, `esDeOrigenAnimal`, `densidadGPorMl`, `unidadPreferida` y `densidadEsAproximada`.

- Grupos exactos: `legumbres`, `cereales`, `verduras`, `frutas`, `carnes`, `otros`. La interfaz los muestra en español con inicial mayúscula y añade Todos.
- `por100g`: `kcal`, `proteinasG`, `carbohidratosG`, `grasasG`, números finitos no negativos. Un perfil incompleto no se considera cero: impide una estimación completa.
- Densidad positiva si existe. Sirve para relacionar ml con g, no para confundir volumen con masa.
- `dibujo` es opcional. Si está presente debe cumplir `^\./imagenes/despensa/[a-z0-9-]+\.svg$`. Las referencias a los dibujos anteriores están en compatibilidad. `compatibilidad.json` puede agrupar IDs en `familiasVisuales`: cada familia apunta a un SVG local de `imagenes/lo-que-tengo/`, sin alterar ID, grupo ni datos nutricionales. Los dibujos individuales tienen prioridad; los ingredientes sin familia explícita usan la familia de su grupo o el respaldo. Nombre y controles siempre visibles.

Correcciones de clasificación aisladas del archivo original: repollo se trata como Verduras y vegetal; chorizo como animal; dashi queda con origen animal sin confirmar, por lo que no se declara vegano. No se alteraron los valores por 100 g. «Pasta de curry» y «miso» no se detectan como fideos por contener la palabra pasta.

No se fusionan alimentos por similitud de nombre: diferentes tipos, estados o variedades pueden requerir fichas distintas. No se han creado ingredientes duplicados al importar el paquete. IDs nuevos deben ser estables y únicos; reutilizar el ID existente solo cuando se trate realmente del mismo ingrediente. Un alias sirve para buscar, no para unir inventarios automáticamente.

## Cantidades y unidades

`planificacion.mjs` centraliza requerimientos, conversiones y disponibilidad. Reutiliza la conversión g/ml del motor del paquete. La unidad canónica habitual es g; líquidos con densidad conocida, ml; huevos, unidades con 50 g comestibles por unidad según la equivalencia aportada. Solo estas equivalencias explícitas permiten convertir medidas caseras o unidades. Se excluyen como pesos de «una unidad» dos entradas ambiguas del paquete: carne picada vacuna = 1 y azúcar negra = 4; no son bases para convertir unidades alimentarias.

- g↔kg y ml↔l: conversiones métricas exactas.
- g↔ml: densidad del ingrediente, señalada como aproximada por la fuente cuando corresponde.
- Unidades, tazas o cucharas: equivalencia específica del paquete. No se inventan gramos de una papa o de una medida no documentada.
- Sin equivalencia fiable: la cantidad conserva su unidad y se compara solo con existencias en esa unidad; aparece como otra variante en la misma fila del ingrediente, no se suma como si fuese equivalente.
- Estado `base`: ficha tal como figura en catálogo; `cocido`: cantidad cocida/escurrida; `hebras`: té usado para infusionar. Los estados nunca se convierten mediante un rendimiento inventado.
- Té: las dos cucharadas siguen siendo una necesidad de compra. Sus hojas no se ingieren; los 0 g comestibles del motor no significan que no haya que conseguir té. No se restauran los 12 g descartados por la corrección del paquete.

El caso de garbanzos del paquete conserva un texto heredado que dice «secos», pero sus campos explícitos indican conserva cocida y perfil cocido. La interfaz utiliza estos campos estructurados y muestra **Garbanzos (cocidos)**; el JSON original queda intacto para auditoría.

Se mantienen decimales internamente; `≈` marca una presentación redondeada a dos decimales. Menos de 0,01 se informa como tal, nunca como cero. Un importe pendiente pequeño no se borra mediante redondeo visual.

## Presencia y subtareas de compras

La disponibilidad visible es binaria por `ingredienteId`: un ingrediente está presente si se marcó manualmente en Lo que tengo o si alguna subtarea de compra quedó completada. No se comparan cantidades de inventario con recetas. Las cantidades históricas del inventario se conservan sin reescribirlas al abrir y no se usan para descontar compras. Desmarcar una compra no retira una marca manual previa. Desmarcar el ingrediente en Lo que tengo reabre sus subtareas completadas para que su ausencia sea coherente en ambas vistas.

«Vaciar despensa» es una operación distinta del desmarcado individual: oculta la presencia manual de los IDs no fijados, sin reescribir `inventario`, `planes`, `manuales` ni `comprasRealizadas`. Una subtarea completada aún aporta disponibilidad y sigue marcada. Fijar un ingrediente lo selecciona; desfijarlo solo quita la protección, sin cambiar sus otras fuentes de disponibilidad. Los campos opcionales `fijados` y `presenciaManualOculta` faltan en snapshots anteriores y se leen como arreglos vacíos.

Cada asociación de `planes[].ingredientes[]` guarda una `clave` canónica y `completado?: boolean`. La identidad estable de subtarea combina `recetaId` + `clave`; las necesidades `manuales[]` usan su propio ID. La ausencia de `completado` en snapshots anteriores equivale a `false`: no se supone que una compra antigua quedó cubierta. `comprasRealizadas[]` permanece como historial, sin migración destructiva.

Una receta escala sus necesidades por `porciones / porcionesOriginales × preparaciones`. Repetir Añadir es idempotente. Por variante compatible, `pendiente = suma(cantidades de subtareas no completadas)`. Variantes sin equivalencia fiable no se suman; la UI agrupa las variantes bajo el mismo ingrediente. Marcar la casilla principal cambia todas sus subtareas; marcar una sola conserva las otras. Al quedar todas completadas, la fila pasa a Compras completadas, desde donde puede reabrirse incluso después de recargar.

Quitar una receta de la planificación retira sus vínculos y necesidades pendientes. Sus subtareas completadas se conservan como necesidades manuales completadas, con su cantidad y origen, sin modificar el inventario manual ni los recibos históricos. Las vistas «Por ingrediente» y «Por receta» leen el mismo snapshot y permiten reabrir esas subtareas. «Marcar todos» dentro de una receta cambia solo sus vínculos. Quitar un vínculo o una fila sigue retirando solo esas necesidades. Las compras completadas no crean automáticamente una cantidad nueva en inventario: su estado de compra es una fuente separada de presencia. «Después de comprar» simula la presencia que aportan las subtareas todavía pendientes, sin añadirlas al almacenamiento.

## Nutrición y categorías

`motor_avanzi.mjs`, proveniente del paquete, es el único calculador de calorías y macronutrientes. Suma `gramosComestibles × perfilPor100g / 100`, conserva los perfiles cocidos especiales y divide por las porciones confirmadas para el resultado individual. La interfaz escala también gramos comestibles al variar porciones/preparaciones.

Se muestran total y por porción solo cuando el cálculo está completo. Datos faltantes quedan desconocidos; no se presentan como cero. Las hojas no ingeridas quedan fuera del cálculo con su motivo explícito. No se estiman pérdidas de cocción ni absorción. Los valores y rendimientos inferidos/editoriales del paquete se identifican como estimaciones y conservan sus fuentes.

Clasificación automática: Rápidas con tiempo conocido <20; Veggie solo con todos los ingredientes declarados no animales; Pastas con fideos/pasta real; Carnes según grupo; Desayunos por `esDesayuno` o etiqueta editorial. No se infiere la aptitud de desayuno de un nutriente. Las recetas propias usan la misma función.

## Recetas propias, versión 1

`datos/recetas.json` sigue siendo solo el catálogo incorporado. La clave independiente `avanzi.recetas.usuario.v1` guarda `{version:1, recetas:[...], borrador:null|{...}}`. Cada receta propia tiene ID estable `usr-` + UUID v4, nombre (1–100 caracteres), porciones enteras positivas, tiempo de preparación y cocción enteros no negativos, total derivado, 1–80 ingredientes sin IDs repetidos y 1–60 pasos en orden (máximo 1200 caracteres por paso). `esDesayuno` es elección del creador. Se admiten unidades que `planificacion.mjs` puede canonizar para ese ingrediente y presentación; una unidad sin equivalencia no se finge convertible. No se aceptan URLs arbitrarias ni texto HTML para mostrar contenido del usuario.

Las recetas propias participan en el mismo recetario en memoria, `calcularNutrientes`, `clasificarReceta`, disponibilidad, búsqueda, filtros y planificación. La masa comestible se deriva solo de equivalencias documentadas; si falta peso o perfil confiable, la estimación queda incompleta y no se muestra un cero inventado. Los ingredientes cocidos sin perfil cocido verificado no heredan valores secos. Los datos nutricionales derivados no se duplican en el guardado. Un borrador puede ser parcial y no aparece en el catálogo hasta guardarlo como receta.

`imagenId` es `null` o un ID `foto-` + UUID. El Blob WebP se guarda en IndexedDB `avanzi-fotos-v1`, almacén `fotos`, nunca en localStorage ni en JSON público. No se admiten rutas elegidas por el usuario como imagen. Si la foto falta, falla o IndexedDB está deshabilitado, el nombre, los controles y el SVG local de respaldo siguen disponibles. Los `blob:` URL se liberan al reemplazar o borrar. No hay respaldo/sincronización entre dispositivos; exportación e importación con fotos están pendientes.

Al borrar una receta vinculada a compras, las necesidades incluidas se conservan como manuales sin vínculo y las compras confirmadas permanecen en inventario. Si una edición cambia los IDs/unidades de ingredientes vinculados, se solicita confirmación y se conservan las necesidades anteriores del mismo modo. Errores de guardado en la clave propia bloquean el cambio y conservan el formulario; datos propios corruptos bloquean escrituras para proteger asociaciones del snapshot antiguo.

## Estado persistente, versión 3

Mismo mecanismo local y misma clave `que-cocino.despensa.v1`, ahora con un objeto conjunto:

| Campo | Contenido |
| --- | --- |
| `version` | 3. |
| `inventario` | Registros con ingredienteId, estado, unidad, cantidad (o null heredado), clave de combinación, actualizadoEn y revisionManual. |
| `fijados` | Arreglo opcional de IDs de ingredientes protegidos al vaciar Lo que tengo. Ausente equivale a vacío. |
| `presenciaManualOculta` | Arreglo opcional de IDs cuya presencia manual se ocultó al vaciar. Conserva los registros de inventario y sus cantidades; no afecta compras completadas. Ausente equivale a vacío. |
| `planes` | recetaId, porciones, veces y asociaciones de ingredientes con `clave`, `completado` opcional y ajuste legado `cantidadBase`. |
| `manuales` | Necesidades sin receta activa; también admiten `completado` opcional. |
| `comprasRealizadas` | ID único de confirmación, ingrediente/estado/unidad, cantidad incorporada, fecha, revisión manual y marca de deshecha. |
| `transiciones` | Un evento por ID de receta que pasó de insuficiente a suficiente, con fecha. Sin monedas, niveles ni UI de recompensa. |
| `porRevisar` | Referencias anteriores sin correspondencia inequívoca; se conservan sin formulario de asignación. |
| `referenciasResueltas` | Campo opcional: referencias antiguas vinculadas automáticamente, con su origen y el ID actual; evita perder el registro original al resolverlas. |
| `legado` | Cuando procede, contenido anterior original de las dos claves, conservado para recuperación/auditoría. |

`clave` es la identidad de la combinación (ingrediente, estado, unidad), no otra cantidad. Las asociaciones guardan un respaldo de **necesidad**, no de pendiente, para conservar una compra si desaparece su receta. No hay otra copia activa del inventario ni una tabla de pendientes persistida.

Una sola llamada `localStorage.setItem` guarda el snapshot completo; un fallo conserva la versión anterior. La pestaña desactualizada se bloquea al detectar un cambio en las claves activas. El estado de cada casilla queda en el mismo snapshot que sus asociaciones; no se guardan totales derivados.

Los recibos antiguos, cantidades y revisiones manuales permanecen para recuperar datos previos, aunque la nueva vista no ofrece el formulario «Registrar compra». `transiciones` conserva IDs registrados, sin implementar recompensas. Una escritura exactamente simultánea en dos pestañas sigue sin poder garantizarse como transacción con localStorage.

### Compatibilidad y fallos

Antes de leer listas se cargan y validan catálogos/equivalencias. Si fallan, ninguna escritura. Un formato guardado inválido bloquea sobrescrituras. Referencias obsoletas se omiten individualmente con aviso, conservando las vigentes.

Se leen la despensa antigua (arreglo de IDs), las compras antiguas (arreglo o version: 2) y su operación provisional. Esta última se resuelve según qué selección efectivamente quedó guardada. Los IDs conocidos se recuperan con cantidad desconocida; no se les asigna 1 ni se supone suficiencia. Los IDs antiguos se vinculan solo si coinciden con un ID actual o con un único nombre/alias normalizado del catálogo. Nombres genéricos ambiguos como «aceite», «arroz» y «pasta» permanecen sin asignar. Las referencias no resueltas siguen en `porRevisar`; las resueltas se archivan en `referenciasResueltas`. La recuperación no escribe hasta una acción posterior del usuario. Las compras compradas antiguas también se conservan como necesidades por confirmar.

La clave `que-cocino.compras.v1` queda intacta como legado; si ya hay snapshot v3 se usa solo este. No se reescribe nada solo por abrir la app; la conversión se guarda con la primera acción y conserva los textos anteriores. No hay sincronización entre pestañas/dispositivos. Una futura cuenta puede trasladar este estado por IDs; no se incorporan servicios ahora.

## Ampliaciones que siguen pendientes

La propuesta anterior de `cantidadTexto` para «a gusto»/«un puñado» no se implementó como nuevo tipo de línea: las 39 recetas ya traen cantidades numéricas estimadas y se preservan. El editor de inventario no admite números inventados para cantidades desconocidas. Un próximo registro sin cantidad necesita una ampliación y una política explícita de suficiencia, no sustituir ausencia por cero.

Los campos bibliográficos de libro/páginas de PDF propuestos anteriormente no están implementados. La colección actual usa `fuente` y auditoría de Public Domain Recipes. No se crea importador de PDF, cuentas, sincronización, calendario, recompensas visibles ni consumo automático al cocinar.
