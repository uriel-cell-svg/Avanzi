# Avanzi · Beta con inventario y compras por cantidades

Avanzi conecta **39 recetas incorporadas, tus recetas propias, 200 ingredientes, Lo que tengo y Lista de compras**. Conserva la interfaz blanca y verde, las fuentes locales y las ilustraciones existentes. Las 39 imágenes WebP del paquete son **ilustrativas, generadas con IA**; no fotografías verificadas del resultado.

## Abrir la app

1. Extraé el ZIP completo y abrí la carpeta `Avanzi` en VS Code.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
3. Usá el mismo navegador, dirección y puerto de antes para recuperar tus datos.

La app no requiere Node.js, paquetes ni compilación. Usa módulos JavaScript locales que Live Server sirve directamente. No abrir el HTML con doble clic. No hay backend ni servicios remotos de fuentes, imágenes o nutrición.

## Lo que tengo

Buscá por nombre o alias y filtrá por **Legumbres, Cereales, Verduras, Frutas, Carnes u Otros**. Las categorías y el recuadro de seleccionados mantienen su comportamiento.

Tocá una tarjeta o **Editar cantidad** para indicar cantidad y unidad. Por ejemplo: 2 huevos, 500 ml de leche, 1 kg de harina o 600 g de papas. Guardar cero o desmarcar retira esa disponibilidad. El recuadro × hace lo mismo, sin borrar necesidades de compras.

Los alimentos secos y cocidos no se intercambian. En los ingredientes que las recetas usan cocidos, el editor permite elegir esa presentación. Los líquidos se muestran en ml/l y los huevos en unidades, usando las equivalencias del paquete. Las conversiones aproximadas se explican en el editor; `≈` indica redondeo de presentación, sin redondear el cálculo interno.

**Tengo todo** conserva una marca de presencia sin inventar cantidades para los ingredientes nuevos; es necesario confirmarlas antes de considerarlos suficientes. **Desmarcar todo** retira la disponibilidad, también con filtros activos. Ambas acciones siguen dentro de ⋮; Ayuda reúne las aclaraciones.

## Recetas

Se mantienen las tres secciones por ingredientes con cantidades insuficientes: **Ya tenés todo, ¡a cocinar!**, **Ya casi** (1–3) y **Con algunas compras más**. El orden es faltantes, tiempo y nombre. Las 39 recetas incorporadas tienen tiempo total; siete tiempos se estimaron y están señalados en `datos/auditoria/tiempos_estimados_7_2026-10-15.md`. «Rápidas» exige estrictamente menos de 20 minutos.

Buscá por receta o ingrediente, filtrá completas/faltantes y elegí **Todas, Rápidas, Veggie, Pastas, Carnes o Desayunos**. Rápidas requiere menos de 20 minutos; Veggie exige ingredientes declarados sin origen animal; Desayunos conserva la decisión editorial. Cada receta puede tener varias categorías.

**Ver preparación** conserva instrucciones completas y estados de ingredientes. Permite ajustar **porciones** y **preparaciones** (por ejemplo, dos veces la misma receta). Si la receta ya está incluida en compras, el cambio recalcula sus necesidades. Los pasos originales no se reescriben ni se alteran tiempos al escalar.

**Añadir a compras** registra un ingrediente de esa receta. **Añadir receta a compras** incluye todas sus necesidades, también las cubiertas, para poder descontar el inventario una sola vez al combinar recetas. Solo las cantidades faltantes quedan pendientes. Volver a incorporar la misma receta/ingrediente no lo duplica.

El detalle muestra energía, proteínas, carbohidratos y grasas para la receta completa y por porción. Son **estimaciones** del motor y los datos aportados, con equivalencias aproximadas; no ajustan pérdidas de cocción o absorción. Las hojas de té coladas se compran como insumo, pero no se computan como alimento ingerido. Un cálculo incompleto no presenta valores faltantes como cero ni subtotales como una receta completa.

### Crear tus recetas

En Recetas tocá **Crear receta**. Escribí nombre, porciones, minutos de preparación y cocción; elegí ingredientes del catálogo por nombre o alias, indicá cantidades y unidades, y agregá pasos en orden. Podés mover o quitar pasos y guardar un borrador si todavía no terminaste. El total de minutos se muestra mientras editás. **Desayunos** se marca si vos lo elegís; las demás categorías se calculan con las mismas reglas del catálogo. Editar, duplicar y borrar aparecen solo en el detalle de tus recetas. Si borrás una receta incluida en compras, Avanzi avisa y conserva sus necesidades como pendientes sin asociación; una compra confirmada permanece en Lo que tengo.

Podés añadir una foto desde archivos, galería o cámara si tu navegador ofrece esa opción. Se aceptan JPG, PNG y WebP de hasta 10 MB de origen; se reduce a un máximo aproximado de 1000 px y se guarda como WebP en **IndexedDB**. La foto y la receta solo están en ese navegador y dispositivo: GitHub Pages no las recibe ni las sincroniza. Si cambiás de navegador, dispositivo, origen de Live Server o borrás los datos del sitio, podrías perderlas. El respaldo portátil con fotos es una prioridad siguiente, todavía no implementada. Una foto ausente usa la ilustración local de respaldo.

## Compras inteligentes

Una fila por identificador de ingrediente, con cantidad pendiente y acceso a **Ver recetas y cantidades**. Las presentaciones o medidas incompatibles se conservan separadas dentro de la misma fila. El encabezado cuenta ingredientes pendientes, no cantidades ni recetas.

La regla es:

**A comprar = máximo(0, suma de necesidades incluidas − cantidad disponible)**

Ejemplo: 3 huevos para una receta + 3 para otra = 6; si tenés 2, comprás **4**, no 2. El inventario se descuenta una sola vez. Los orígenes de cada cantidad permanecen visibles al desplegar la fila.

- La casilla abre **Registrar compra**. Confirmá cuánto adquiriste: si faltan 6 huevos y comprás 4, quedan 4 disponibles y 2 pendientes. Repetir el envío de esa misma confirmación no vuelve a sumarlos.
- Cuando la necesidad está cubierta, pasa a **Comprados**. Esa sección también incluye lo cubierto con existencias anteriores; no implica una compra nueva.
- Desmarcar deshace compras registradas del ingrediente. Solo retira lo incorporado por esas compras si no hubo una edición manual posterior; nunca retira existencias anteriores. Cada confirmación también tiene **Deshacer esta compra**.
- × elimina todas las necesidades de esa fila sin modificar inventario. **Quitar vínculo** elimina solo la asociación con una receta.
- **Guardar** en una necesidad permite ajustar esa compra. Ese ajuste no cambia los ingredientes originales ni la nutrición de la receta: si reducís una necesidad, el detalle puede seguir indicando cantidades insuficientes.
- **Recetas incluidas** permite cambiar porciones/preparaciones o quitar una receta entera. **Vaciar lista** pide confirmación y conserva el inventario.

Añadir a compras **nunca significa tenerlo**. La disponibilidad de recetas incluidas reserva las existencias por orden de incorporación, considerando la receta completa, para no asignarlas dos veces. Las recetas no incluidas se evalúan individualmente. Si retirás vínculos o reducís necesidades, podés tener compras cubiertas y una receta todavía incompleta; no se añaden nuevos ingredientes sin tu acción.

**Después de comprar** usa el inventario real más las compras pendientes y excluye recetas ya completas o parcialmente cubiertas. No hay un calendario ni consumo automático al cocinar.

## Datos anteriores y guardado

Las selecciones antiguas se conservan como **cantidad por confirmar**, ya que antes no se guardaban cantidades. Las compras antiguas también se conservan como necesidades por confirmar. Los IDs antiguos sin una correspondencia inequívoca aparecen en **Referencias anteriores**, para que elijas el ingrediente actual; después confirmá su cantidad y presentación.

No se renombra ningún ID del paquete ni se adivina qué variedad de aceite o arroz tenías. Se conserva una copia del contenido anterior dentro del primer estado nuevo guardado.

Inventario, necesidades, porciones, confirmaciones y transiciones se guardan juntos en **una única escritura de localStorage**, con la clave existente `que-cocino.despensa.v1`. La clave `que-cocino.compras.v1` se lee al recuperar datos antiguos y queda intacta; deja de ser una segunda copia activa. Un fallo conserva el snapshot anterior completo; la app avisa qué es temporal y permite reintentar.

Tus recetas se guardan por separado en `avanzi.recetas.usuario.v1` (versión 1); el catálogo público de 39 recetas no se modifica. Las fotos solo se guardan como Blob en IndexedDB `avanzi-fotos-v1`; la receta contiene `imagenId`, nunca el archivo ni una URL remota. Una foto compartida por una receta publicada y su borrador se conserva mientras cualquiera de los dos la use. Si el guardado de recetas propias está dañado se bloquea su sobrescritura y también las escrituras del inventario para proteger planes vinculados. La app muestra un aviso. Borradores y recetas propias no se sincronizan entre pestañas.

Si falla la carga de un catálogo no se escribe almacenamiento. Si los datos guardados son inválidos, se bloquea su sobrescritura y se informa. Se conservan listas vacías y referencias vigentes cuando desaparecen otras. Una receta retirada puede dejar sus necesidades como compras sin asociación activa.

El guardado es local a ese navegador/origen. Si Avanzi detecta que otra pestaña cambió el inventario o las recetas propias, bloquea la escritura de la pestaña desactualizada y pide recargar. Esto evita sobrescribir cambios ya detectados, pero `localStorage` no permite garantizar una transacción entre dos pestañas que escriban exactamente al mismo tiempo. No hay cuentas ni sincronización entre dispositivos. No abrir una versión antigua de Avanzi sobre el mismo origen para editar estos datos nuevos.

Para publicar más adelante en GitHub Pages, los archivos se sirven juntos desde la raíz del proyecto o desde una subruta de repositorio: las rutas locales son relativas. Se comprobó la subruta con un servidor local, sin publicar. Una dirección de Pages distinta de la de Live Server constituye otro origen y no comparte sus datos locales.

## Prueba sencilla

1. Buscá Huevo en Lo que tengo y guardá **2 unidades**.
2. Abrí **Tortilla de papas** y **Tostadas francesas**, y añadí cada receta a compras.
3. En compras, desplegá Huevo: se muestran las necesidades de ambas recetas y se restan tus 2 huevos una sola vez.
4. Marcá la casilla, confirmá una compra parcial y revisá cómo baja el pendiente.
5. Recargá: inventario, porciones, necesidades y compra parcial deben permanecer.
6. En Recetas incluidas, quitá una receta. Su aporte desaparece; lo comprado sigue en Lo que tengo.

Para probar sin alterar tus listas habituales, usá otro perfil o puerto de Live Server.

## Archivos principales

| Archivo | Función |
| --- | --- |
| `index.html`, `estilos.css` | Pantallas aprobadas y controles adicionales de cantidades/porciones. |
| `app.js` | Orquestación de la interfaz, eventos y presentación. |
| `catalogo_avanzi.mjs` | Valida las recetas e ingredientes públicos y prepara sus metadatos visuales; no accede al DOM ni al almacenamiento. |
| `motor_avanzi.mjs` | Único motor nutricional del paquete y clasificación de recetas. |
| `planificacion.mjs` | Conversiones para inventario, necesidades por receta, agregación, disponibilidad y detección de transiciones. Sin DOM ni guardado. |
| `almacenamiento.mjs` | Validación del estado, compatibilidad anterior y escritura atómica. |
| `persistencia_navegador.mjs` | Envuelve `localStorage` y detecta pestañas desactualizadas antes de escribir; no modifica las claves ni el formato. |
| `datos/recetas.json`, `datos/ingredientes.json` | Catálogo de 39 recetas con el parche auditado de siete tiempos, y catálogo de 200 ingredientes sin cambios. |
| `datos/equivalencias_g.json` | Equivalencias aportadas, sin modificaciones. |
| `datos/compatibilidad.json` | Referencias a dibujos propios y correcciones documentadas de clasificación, sin tocar nutrientes. |
| `datos/auditoria/` | Fuentes y auditoría del paquete; no es un segundo catálogo activo. |
| `recetas_usuario.mjs`, `editor_recetas.mjs`, `fotos_usuario.mjs` | Validación y guardado de recetas propias, formulario y fotos locales. |
| `imagenes/`, `fuentes/` | Recursos locales y sus créditos/licencias. |
| `pruebas/` | Pruebas automáticas; no necesarias para abrir la app. |

Las interfaces entre módulos son deliberadamente pequeñas: `catalogo_avanzi.mjs` exporta `validarRecetas`, `validarIngredientes` y `prepararIngredientes` y recibe datos JSON, sin leer almacenamiento; `planificacion.mjs` recibe estado y motor y devuelve cálculos o una copia al separar necesidades; `almacenamiento.mjs` recibe un objeto con `getItem`/`setItem` para recuperar y guardar; `persistencia_navegador.mjs` entrega ese objeto protegido y una comprobación previa; `fotos_usuario.mjs` gestiona Blobs por `imagenId` y filtra qué IDs ya no tienen referencias. `app.js` conecta esos resultados con los controles y los avisos. Ningún módulo de datos importa `app.js`.

[DATOS.md](./DATOS.md) explica contratos y persistencia; [DISEÑO.md](./DISEÑO.md), presentación; [AGENTS.md](./AGENTS.md), reglas; [CAMBIOS.md](./CAMBIOS.md), resultados por entrega.

## Ejecutar las pruebas (opcional para desarrollo)

Con Node disponible, desde la carpeta del proyecto:

```sh
node pruebas/paquete.mjs
node --test pruebas/logica.mjs
node pruebas/tiempos_estimados.mjs
node --test pruebas/recetas_usuario.mjs
```

Las pruebas de navegador `pruebas/navegador.cjs` y `pruebas/editor_navegador.cjs` requieren una instalación **externa** de Playwright y Chromium y la app servida por HTTP. Se pueden indicar `AVANZI_PLAYWRIGHT`, `AVANZI_CHROMIUM`, `AVANZI_URL` y `AVANZI_CAPTURAS`. No instalar nada de esto para usar Avanzi con Live Server.

Los resultados de esta entrega están en CAMBIOS. Pendientes: Live Server del usuario, teléfonos reales, otros navegadores, lector de pantalla y revisión editorial/nutricional de los datos del paquete. Las siete estimaciones de tiempo no son mediciones. El respaldo portátil de recetas propias y fotos también queda pendiente. [ETAPAS_FUTURAS.md](./ETAPAS_FUTURAS.md) separa el diseño de perfil y recompensas de esta entrega.

## GitHub Desktop

Copiá el ZIP extraído al repositorio local, seleccioná una rama distinta de `main`, revisá Changes y hacé Commit. Cuando decidas subir tu rama, usá Publish branch o Push origin; no publica una web. En otra computadora: Fetch origin, elegir esa rama y Pull origin. Esta entrega no se publicó ni se incorporó a main.
