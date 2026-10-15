# Procedencia y permiso de reutilización

Los SVG son recursos originales del proyecto. Las composiciones representan ingredientes y los respaldos son genéricos; ninguno es una fotografía del plato. Se conservan aquí procedencias y permisos, incluidos recursos históricos. El uso visual vigente está en [DISEÑO.md](../DISEÑO.md). Los apartados históricos no ordenan restaurar fondos, fuentes ni adornos anteriores.

| Archivo | Contenido |
| --- | --- |
| `ramita.svg` | Recurso histórico, no usado hoy: ramita de dos hojas con curvas y trazo ligeramente irregulares. |
| `arroz-verduras.svg` | Arroz y zanahoria. |
| `tortilla-papas.svg` | Huevo y papa. |
| `pasta-tomate.svg` | Tomate y hebras de pasta. |
| `ensalada-garbanzos.svg` | Garbanzos y limón. |
| `huevos-espinaca.svg` | Huevo y hoja de espinaca. |

Permiso: se entregan al titular del proyecto para usar, modificar y redistribuir dentro de la app, sin atribución obligatoria.

Las capturas adjuntas de la app y Jamie Oliver y el Renoir se revisaron como referencias visuales. No se incorporaron al proyecto ni se copiaron sus logos, textos o fotografías. Del Renoir se tomó la dirección de color; de la captura del catálogo, el espacio entre tarjetas y la jerarquía de lectura.

Fuentes actuales: Alfa Slab One y Fraunces locales, con licencias registradas en `../fuentes/FUENTES.md`, y sistema para lectura. No se hacen solicitudes a servicios externos. Se retiraron `mesa.svg` e `ingredientes.svg` de la revisión anterior.

## Dibujos de la despensa

Los trece archivos `despensa/*.svg` son recursos vectoriales originales locales. Huevo, papa, tomate, limón, espinaca, arroz, pasta, garbanzos y zanahoria reutilizan los trazos de sus composiciones de recetas. Ajo, cebolla, aceite y sal se dibujaron para esta entrega con el mismo estilo. Se aplica el mismo permiso de uso, modificación y redistribución indicado arriba.

Las fuentes y licencias vigentes se registran en [fuentes/FUENTES.md](../fuentes/FUENTES.md). Georgia queda como alternativa, no como fuente principal de la marca.

## Histórico: propuesta tinta y marfil de Avanzi

Se modificaron solo los colores de los SVG originales: trazos verde oscuro y rellenos marfil, conservando geometrías y los dos ingredientes de las recetas. No se copiaron imágenes de las plantillas adjuntas.

Fotografía de papel pendiente: “Wrinkled Paper Texture Free Creative Commons (6816216700).jpg”, D. Sharon Pruitt / Pink Sherbet Photography, CC BY 2.0.
Fuente solicitada: https://commons.wikimedia.org/wiki/File:Wrinkled_Paper_Texture_Free_Creative_Commons_(6816216700).jpg
Licencia: https://creativecommons.org/licenses/by/2.0/
La página y el archivo directo devolvieron HTTP 403. No se incorporó ni modificó esa fotografía, ni se creó una textura sustituta. El fondo de esta entrega es marfil liso. Ese estado pendiente se resolvió en la entrega descrita abajo; hoy el papel ya no se usa como fondo.

## Histórico: fotografía de papel incorporada, hoy sin uso visual

Archivo local: `papel-arrugado.jpg` (90.107 bytes, 1280 × 853 píxeles). Copia adjuntada por el usuario para incorporar la fotografía solicitada tras el bloqueo de descarga. Autoría y licencia según la referencia proporcionada: D. Sharon Pruitt / Pink Sherbet Photography, CC BY 2.0.

Fuente: https://commons.wikimedia.org/wiki/File:Wrinkled_Paper_Texture_Free_Creative_Commons_(6816216700).jpg
Licencia: https://creativecommons.org/licenses/by/2.0/

Se conserva el JPG recibido sin modificar sus píxeles ni comprimirlo nuevamente: ya pesa unos 88 KiB. Presentación aplicada en aquella entrega, retirada en la unificación posterior: desaturación, opacidad del 12 %, fondo marfil y ajuste al tamaño de pantalla con recorte proporcional. La imagen es decorativa; controles y tarjetas conservan fondos lisos. Crédito accesible desde Créditos visuales en el pie. Esta entrada sustituye el estado pendiente de la entrada anterior.

## Ilustraciones coloreadas de recetas · recursos de la beta conservados

`detalle/*.svg` son variantes nuevas de los SVG originales actuales: se cambiaron rellenos a colores de alimentos y se ajustó el encuadre para aprovechar el espacio. Conservan los trazos y el mismo permiso de reutilización del proyecto. En aquella entrega no se recuperó código anterior ni se modificaron los recursos de las demás pantallas. Después, la unificación pasó a reutilizar estas variantes en las tarjetas. No representan una fotografía del plato.

`bolsa.svg`: icono vectorial original local creado para Añadir a compras. Es decorativo y usa el mismo permiso de uso, modificación y redistribución indicado para los SVG del proyecto.

`carrito.svg`: icono vectorial original local creado para la acción compacta de añadir un ingrediente a compras. Usa el mismo permiso del proyecto; no se descargó de terceros.

## Lo que tengo · Recursos coloreados individuales

Los trece SVG de `lo-que-tengo/` son variantes de los dibujos propios de `despensa/`: aceite, ajo, arroz, cebolla, espinaca, garbanzo, huevo, limon, papa, pasta, sal, tomate y zanahoria. Autoría: dibujos originales preparados para Avanzi en este proyecto. Se conservaron los trazos y se modificaron rellenos y colores para reconocer los alimentos: tomate rojo, limón amarillo, hojas verdes y tonos naturales. Fondo transparente; no incluyen textos, controles ni fondos recortados de referencias.

Fuente: los archivos locales `despensa/*.svg` descritos arriba. Se aplica el mismo permiso de uso, modificación y redistribución dentro de la app, sin atribución obligatoria. No se descargaron recursos ni se usaron herramientas de generación de imágenes; no hay costos ni servicios remotos. Las variantes se usan actualmente en catálogo, recuadro de Lo que tengo y compras. Recetas y detalle usan las composiciones de `detalle/`.

El papel no se muestra en ninguna pantalla. El archivo histórico y su crédito se conservan; no existe una instrucción vigente de volver a aplicarlo.

`lupa.svg`: icono decorativo de búsqueda, vector original local escrito para esta app. Se aplica el mismo permiso de uso, modificación y redistribución del proyecto. El boceto B se usó solo como referencia de composición; no se incorporó su imagen completa ni se recortaron sus alimentos, textos, controles o fondos.

## Histórico: unificación de vistas previa al paquete de 39 recetas

En aquella versión las tarjetas reutilizaban `detalle/*.svg`. En la integración actual las 39 recetas usan los WebP propios del paquete, con respaldo local si fallan. La checklist reutiliza `lo-que-tengo/*.svg`. Los archivos vectoriales y sus permisos anteriores no cambiaron. La fotografía de papel y los adornos marginales dejaron de usarse; no quedan reglas CSS que los carguen. Las fuentes locales conservan su registro en `../fuentes/FUENTES.md`.

### Nueva ilustración de marca · archivo pendiente

Referencia aportada por el usuario: “Trío fresco de tomate, mozzarella y albahaca.png”. Generada con ChatGPT, según la indicación del usuario. El usuario aportó la ilustración para usarla como acento junto al texto Avanzi.

La imagen es visible en el chat, pero el PNG original no está disponible como archivo descargable en el entorno. El recurso sigue pendiente: no se incorporó ni optimizó, ni se generó una sustituta. La cabecera usa solo el texto Avanzi mientras se recibe el archivo. Si una tarea posterior autoriza su incorporación y aporta el archivo, registrar aquí nombre del recurso local, dimensiones, tamaño y modificaciones de optimización conservando transparencia.

## Recursos por defecto

| Archivo | Contenido y uso |
| --- | --- |
| `por-defecto/receta.svg` | Cuenco y cuchara: ilustración genérica de cocina para tarjetas y detalle cuando falta o falla el SVG de la receta. No representa el plato ni una fotografía. |
| `por-defecto/ingrediente.svg` | Bolsa con hojas: ilustración genérica decorativa para catálogo, seleccionados y compras cuando falta o falla el dibujo del ingrediente. El nombre identifica al ingrediente. |

Autoría y fuente: SVG originales escritos para Avanzi en esta modificación, con los trazos y colores del proyecto aprobado. Fondos transparentes. No se descargaron recursos ni se usó un servicio de generación de imágenes. Se aplica el permiso del proyecto: uso, modificación y redistribución dentro de la app, sin atribución obligatoria. Los SVG anteriores no fueron modificados.

## Imágenes IA del paquete corregido de 39 recetas · 2026-10-15

Se incorporaron los 39 WebP suministrados por el usuario en Avanzi_Paquete_Unificado_Corregido_39_Recetas.zip. Fuente y autoría declaradas: imágenes generadas con IA (OpenAI) para estas recetas, aportadas por el usuario para integrarlas. No se generaron nuevas imágenes ni se descargaron fotografías. Se conservan los archivos originales de 1000 × 1000 px, sin recortes ni recomprimir; su checksum coincide con el inventario aportado. La app las identifica como **ilustrativas generadas con IA**, no como fotografías verificadas del plato.

Los nombres, la correspondencia por ID, tamaños y hashes están en [inventario_imagenes_ia.csv](../datos/auditoria/inventario_imagenes_ia.csv). La fuente declarada de los textos de recetas es Public Domain Recipes, con Unlicense según cada registro; esto no se usa como licencia de una fotografía ajena. Los textos originales y la auditoría nutricional se conservan en datos/auditoria; la revisión editorial y de procedencia independiente sigue pendiente.

| ID de receta | Recurso local |
| --- | --- |
| `pdr-creamy-mashed-potatoes` | `creamy-mashed-potatoes.webp` |
| `pdr-aglio-e-olio` | `espaguetis-ajo-aceite.webp` |
| `pdr-spanish-tortilla` | `spanish-tortilla.webp` |
| `pdr-shakshouka` | `shakshouka.webp` |
| `pdr-oatmeal-pancakes` | `oatmeal-pancakes.webp` |
| `pdr-basic-waffles` | `basic-waffles-01.webp` |
| `pdr-pasta-arrabbiata` | `pasta-arrabbiata.webp` |
| `pdr-ratatouille` | `ratatouille.webp` |
| `pdr-turkish-red-lentil-soup` | `sopa-lentejas-rojas-turca.webp` |
| `pdr-breakfast-wrap` | `wrap-desayuno.webp` |
| `pdr-french-toast` | `french-toast.webp` |
| `pdr-pasta-alla-norma` | `pasta-alla-norma.webp` |
| `pdr-spaghetti-all-amatriciana` | `spaghetti-all-amatriciana.webp` |
| `pdr-simple-pasta-cream-sauce` | `pasta-salsa-crema.webp` |
| `pdr-carbonara` | `carbonara.webp` |
| `pdr-cooked-chickpeas` | `garbanzos-cocidos.webp` |
| `pdr-ginger-garlic-broccoli` | `brocoli-jengibre-ajo.webp` |
| `pdr-indian-tea` | `te-indio-masala-chai.webp` |
| `pdr-stracciatella-soup` | `stracciatella-soup.webp` |
| `pdr-air-fryer-zucchini` | `zucchini-frita-horno.webp` |
| `pdr-cacio-e-pepe` | `cacio-e-pepe.webp` |
| `pdr-cinque-pi` | `cinque-pi.webp` |
| `pdr-baked-pasta-with-broccoli` | `baked-pasta-with-broccoli.webp` |
| `pdr-spaghetti-and-meatballs` | `espaguetis-albondigas.webp` |
| `pdr-chicken-pasta-casserole` | `chicken-pasta-casserole.webp` |
| `pdr-baked-mostaccioli` | `baked-mostaccioli.webp` |
| `pdr-pasta-navy-style` | `pasta-navy-style.webp` |
| `pdr-red-lentil-dahl` | `dhal-lenteja-roja.webp` |
| `pdr-egyptian-lentils` | `lentejas-egipcias-koshary.webp` |
| `pdr-refried-beans` | `refried-beans.webp` |
| `pdr-basic-meatballs` | `albondigas-basicas.webp` |
| `pdr-chicken-paprikash` | `pollo-paprikash.webp` |
| `pdr-honey-garlic-chicken` | `pollo-miel-ajo.webp` |
| `pdr-meatloaf` | `meatloaf.webp` |
| `pdr-pancake` | `pancake.webp` |
| `pdr-oaty-pancakes` | `panqueques-avena.webp` |
| `pdr-danish-pancake` | `danish-pancake.webp` |
| `pdr-oats` | `avena.webp` |
| `pdr-swedish-pancakes` | `swedish-pancakes.webp` |
