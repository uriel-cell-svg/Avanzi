# Avanzi · Beta con selección simple y compras por subtareas

Avanzi conecta **39 recetas incorporadas, tus recetas propias, 200 ingredientes, Lo que tengo y Lista de compras**. Conserva la interfaz blanca y verde, las fuentes locales y las ilustraciones existentes. Las 39 imágenes WebP del paquete son **ilustrativas, generadas con IA**; no fotografías verificadas del resultado.

## Abrir la app

1. Extraé el ZIP completo y abrí la carpeta `Avanzi` en VS Code.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
3. Usá el mismo navegador, dirección y puerto de antes para recuperar tus datos.

La app no requiere Node.js, paquetes ni compilación. Usa módulos JavaScript locales que Live Server sirve directamente. No abrir el HTML con doble clic. No hay backend ni servicios remotos de fuentes, imágenes o nutrición.

## Lo que tengo

Buscá por nombre o alias y filtrá por **Legumbres, Cereales, Verduras, Frutas, Carnes u Otros**. Tocá una tarjeta para indicar que tenés el ingrediente; tocala de nuevo para desmarcarlo. El recuadro superior comparte la misma selección y permite quitar ingredientes con ×. La disponibilidad de recetas se basa en **presencia**, no en cantidad suficiente.

Si desmarcás un ingrediente cuya presencia provenía de subtareas compradas, esas subtareas vuelven a pendientes. La marca manual de Lo que tengo y las compras completadas se guardan por separado.

**Tengo todo** y **Desmarcar todo** actúan sobre todo el catálogo, incluso si hay filtros activos. Las cantidades antiguas se conservan en los datos locales para no perder información, pero ya no se piden ni determinan la disponibilidad.

El catálogo usa dibujos individuales cuando existen y dibujos por familia para los demás ingredientes. Las referencias antiguas con un único nombre o alias coincidente se relacionan automáticamente. Las ambiguas se conservan en los datos locales sin alterar la selección ni la lista; un aviso indica cuántas quedaron sin correspondencia.

## Recetas

Se mantienen las tres secciones por ingredientes ausentes: **Ya tenés todo, ¡a cocinar!**, **Ya casi** (1–3) y **Con algunas compras más**. El orden es faltantes, tiempo y nombre. Las 39 recetas incorporadas tienen tiempo total; siete tiempos se estimaron y están señalados en `datos/auditoria/tiempos_estimados_7_2026-10-15.md`. «Rápidas» exige estrictamente menos de 20 minutos.

Buscá por receta o ingrediente, filtrá completas/faltantes y elegí **Todas, Rápidas, Veggie, Pastas, Carnes o Desayunos**. Rápidas requiere menos de 20 minutos; Veggie exige ingredientes declarados sin origen animal; Desayunos conserva la decisión editorial. Cada receta puede tener varias categorías.

**Ver preparación** conserva instrucciones completas y estados de ingredientes. Permite ajustar **porciones** y **preparaciones** (por ejemplo, dos veces la misma receta). Si la receta ya está incluida en compras, el cambio recalcula sus necesidades. Los pasos originales no se reescriben ni se alteran tiempos al escalar.

**Añadir a compras** registra una subtarea de esa receta; **Añadir receta a compras** incorpora todas sus necesidades. Repetir la acción no duplica el vínculo. Las cantidades de las recetas siguen siendo útiles para comprar y para la estimación nutricional.

El detalle muestra energía, proteínas, carbohidratos y grasas para la receta completa y por porción. Son **estimaciones** del motor y los datos aportados, con equivalencias aproximadas; no ajustan pérdidas de cocción o absorción. Las hojas de té coladas se compran como insumo, pero no se computan como alimento ingerido. Un cálculo incompleto no presenta valores faltantes como cero ni subtotales como una receta completa.

### Crear tus recetas

En Recetas tocá **Crear receta**. Escribí nombre, porciones, minutos de preparación y cocción; elegí ingredientes del catálogo por nombre o alias, indicá cantidades y unidades, y agregá pasos en orden. Podés mover o quitar pasos y guardar un único borrador si todavía no terminaste. Si ya existe, Avanzi pide confirmación antes de empezar otro; también podés continuarlo o descartarlo. El total de minutos se muestra mientras editás. **Desayunos** se marca si vos lo elegís; las demás categorías se calculan con las mismas reglas del catálogo. Editar y borrar aparecen solo para tus recetas; la opción Duplicar se retiró. Si borrás una receta incluida en compras, Avanzi avisa y conserva sus necesidades como pendientes sin asociación; una compra confirmada permanece en Lo que tengo.

Podés añadir una foto desde archivos, galería o cámara si tu navegador ofrece esa opción. Se aceptan JPG, PNG y WebP de hasta 10 MB de origen; se reduce a un máximo aproximado de 1000 px y se guarda como WebP en **IndexedDB**. La foto y la receta solo están en ese navegador y dispositivo: GitHub Pages no las recibe ni las sincroniza. Si cambiás de navegador, dispositivo, origen de Live Server o borrás los datos del sitio, podrías perderlas. El respaldo portátil con fotos es una prioridad siguiente, todavía no implementada. Una foto ausente usa la ilustración local de respaldo.

## Compras por subtareas

Cada ingrediente aparece una sola vez. Debajo, cada receta vinculada tiene una subtarea con su cantidad y una casilla. El total pendiente suma **solo las subtareas abiertas**; no descuenta cantidades de Lo que tengo. Por ejemplo, 3 huevos para una receta y 2 para otra dan 5 pendientes. Si marcás la subtarea de 3, quedan 2.

La casilla principal completa o reabre todas las subtareas de ese ingrediente. Cuando todas están marcadas, la fila pasa al desplegable **Compras completadas**. Podés desmarcar cualquiera, también después de recargar, y su cantidad vuelve al pendiente. Una subtarea completada indica una compra cubierta; es un estado distinto de marcar manualmente un ingrediente en Lo que tengo. Las cantidades sin equivalencia fiable se muestran separadas dentro de la misma fila.

× elimina las necesidades de ese ingrediente sin modificar la selección manual. **Recetas incluidas** permite cambiar porciones/preparaciones o retirar una receta: se recalculan cantidades y se conservan las casillas que siguen vinculadas. **Vaciar lista** requiere confirmación. La lista no añade ingredientes por su cuenta.

## Datos anteriores y guardado

La clave `que-cocino.despensa.v1` conserva el snapshot de inventario, recetas vinculadas, subtareas y registros de compras anteriores en una única escritura. Las cantidades de inventario y recibos previos se mantienen intactos como datos históricos; la vista nueva los interpreta como presencia y no los resta del total de compras. Una casilla anterior sin estado `completado` empieza pendiente para evitar dar por hecha una compra sin confirmación. La clave antigua `que-cocino.compras.v1` queda intacta para la recuperación del legado. Los IDs tampoco cambian.

Las recetas propias siguen en `avanzi.recetas.usuario.v1`, y sus fotos WebP en IndexedDB `avanzi-fotos-v1`. Guardar un borrador con otra foto no borra la foto publicada. Si un dato guardado está dañado o falla un guardado, Avanzi avisa y protege la copia anterior. Si otra pestaña guardó cambios, pide recargar antes de escribir; `localStorage` no puede garantizar una transacción entre escrituras exactamente simultáneas.

Los datos son locales a la dirección y el navegador usados. Live Server y GitHub Pages pueden tener orígenes distintos y no comparten almacenamiento. Todas las rutas son relativas; la app funciona también bajo una subruta de repositorio en Pages. No se publicó desde esta entrega.

## Prueba sencilla

1. Tocá Huevo en Lo que tengo y recargá: debe seguir seleccionado.
2. Desmarcalo. Abrí dos recetas con Huevo y usá **Añadir receta a compras** en ambas.
3. En Lista de compras, marcá solo una subtarea de Huevo: el total pendiente debe bajar por la cantidad de esa receta.
4. Marcá la casilla principal: Huevo pasa a **Compras completadas**. Recargá, abrí ese apartado y desmarcá una subtarea: reaparece el pendiente.

Para probar sin alterar tus datos habituales, usá otro perfil o puerto de Live Server.

## Archivos principales

| Archivo | Función |
| --- | --- |
| `index.html`, `estilos.css` | Pantallas, selección binaria y compras por subtareas. |
| `app.js` | Orquestación de la interfaz, eventos y presentación. |
| `catalogo_avanzi.mjs` | Valida las recetas e ingredientes públicos y prepara sus metadatos visuales; no accede al DOM ni al almacenamiento. |
| `motor_avanzi.mjs` | Único motor nutricional del paquete y clasificación de recetas. |
| `planificacion.mjs` | Presencia, necesidades por receta, subtareas recuperables, cantidades de compras y detección de transiciones. Sin DOM ni guardado. |
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
