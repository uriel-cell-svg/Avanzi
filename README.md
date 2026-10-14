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

## Detalle editable

El detalle muestra cantidades, unidades y pasos. En **Marcá lo que tenés**, las casillas modifican la despensa real y actualizan tarjetas, contadores y compras. Se cierra con **Cerrar** o Escape y devuelve el foco al acceso a la receta; si los filtros la ocultan, vuelve a la pestaña Recetas.

Un ingrediente faltante se puede **Añadir a la lista de compras** o quitar con **En tu lista · Quitar**. **Añadir todos los faltantes** reúne los ingredientes únicos y asocia esta receta con ellos. Si un ingrediente ya estaba en compras desde otra receta, también podés usar **Añadir desde esta receta** para registrar ese origen. Cuando no falta ninguno, el botón general está desactivado y se explica por qué.

**Añadir a compras nunca significa tener el ingrediente.** No se ofrecen compras para ingredientes ya disponibles.

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
