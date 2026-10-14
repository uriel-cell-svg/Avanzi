# Procedencia y permiso de reutilización

Los dibujos SVG son recursos vectoriales originales escritos para este proyecto y muestran ingredientes, no el plato terminado. Se describen abajo los recursos y permisos, incluidos los recursos históricos y la nueva ilustración de marca solicitada por el usuario.

| Archivo | Contenido |
| --- | --- |
| `ramita.svg` | Marca propia: ramita de dos hojas con curvas y trazo ligeramente irregulares. |
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

La nueva fuente local y su licencia se registran en `../fuentes/FUENTES.md`; Georgia se conserva solo en la marca y como alternativa.

## Propuesta tinta y marfil de Avanzi

Se modificaron solo los colores de los SVG originales: trazos verde oscuro y rellenos marfil, conservando geometrías y los dos ingredientes de las recetas. No se copiaron imágenes de las plantillas adjuntas.

Fotografía de papel pendiente: “Wrinkled Paper Texture Free Creative Commons (6816216700).jpg”, D. Sharon Pruitt / Pink Sherbet Photography, CC BY 2.0.
Fuente solicitada: https://commons.wikimedia.org/wiki/File:Wrinkled_Paper_Texture_Free_Creative_Commons_(6816216700).jpg
Licencia: https://creativecommons.org/licenses/by/2.0/
La página y el archivo directo devolvieron HTTP 403. No se incorporó ni modificó esa fotografía, ni se creó una textura sustituta. El fondo de esta entrega es marfil liso. Cuando el usuario adjunte el original, faltará optimizarlo y registrar los cambios antes de aplicarlo.

## Fotografía incorporada

Archivo local: `papel-arrugado.jpg` (90.107 bytes, 1280 × 853 píxeles). Copia adjuntada por el usuario para incorporar la fotografía solicitada tras el bloqueo de descarga. Autoría y licencia según la referencia proporcionada: D. Sharon Pruitt / Pink Sherbet Photography, CC BY 2.0.

Fuente: https://commons.wikimedia.org/wiki/File:Wrinkled_Paper_Texture_Free_Creative_Commons_(6816216700).jpg
Licencia: https://creativecommons.org/licenses/by/2.0/

Se conserva el JPG recibido sin modificar sus píxeles ni comprimirlo nuevamente: ya pesa unos 88 KiB. Cambios de presentación mediante CSS: desaturación, opacidad del 12 %, fondo marfil y ajuste al tamaño de pantalla con recorte proporcional. La imagen es decorativa; controles y tarjetas conservan fondos lisos. Crédito accesible desde Créditos visuales en el pie. Esta entrada sustituye el estado pendiente de la entrada anterior.

## Ilustraciones coloreadas exclusivas del detalle

`detalle/*.svg` son variantes nuevas de los SVG originales actuales: se cambiaron rellenos a colores de alimentos y se ajustó el encuadre para aprovechar el espacio. Conservan los trazos y el mismo permiso de reutilización del proyecto. No se recuperó código anterior ni se modificaron los recursos usados en catálogo y despensa. No representan una fotografía del plato.

`bolsa.svg`: icono vectorial original local creado para Añadir a compras. Es decorativo y usa el mismo permiso de uso, modificación y redistribución indicado para los SVG del proyecto.

## Lo que tengo · Recursos coloreados individuales

Los trece SVG de `lo-que-tengo/` son variantes de los dibujos propios de `despensa/`: aceite, ajo, arroz, cebolla, espinaca, garbanzo, huevo, limon, papa, pasta, sal, tomate y zanahoria. Autoría: dibujos originales preparados para Avanzi en este proyecto. Se conservaron los trazos y se modificaron rellenos y colores para reconocer los alimentos: tomate rojo, limón amarillo, hojas verdes y tonos naturales. Fondo transparente; no incluyen textos, controles ni fondos recortados de referencias.

Fuente: los archivos locales `despensa/*.svg` descritos arriba. Se aplica el mismo permiso de uso, modificación y redistribución dentro de la app, sin atribución obligatoria. No se descargaron recursos ni se usaron herramientas de generación de imágenes; no hay costos ni servicios remotos. Las variantes se usan solo en el catálogo y el recuadro de Lo que tengo; los dibujos de recetas, detalle y compras se conservan.

El papel no se muestra en Lo que tengo. Se conserva el archivo y su crédito porque las otras pantallas mantienen su presentación anterior.

`lupa.svg`: icono decorativo de búsqueda, vector original local escrito para esta app. Se aplica el mismo permiso de uso, modificación y redistribución del proyecto. El boceto B se usó solo como referencia de composición; no se incorporó su imagen completa ni se recortaron sus alimentos, textos, controles o fondos.

## Unificación de vistas

Las tarjetas de Recetas reutilizan `detalle/*.svg` para mostrar los mismos dos ingredientes con sus colores. La checklist reutiliza `lo-que-tengo/*.svg`. Los archivos vectoriales y sus permisos anteriores no cambiaron. La fotografía de papel y los adornos marginales dejaron de usarse; no quedan reglas CSS que los carguen. Las fuentes locales conservan su registro en `../fuentes/FUENTES.md`.

### Nueva ilustración de marca · archivo pendiente

Referencia aportada por el usuario: “Trío fresco de tomate, mozzarella y albahaca.png”. Generada con ChatGPT, según la indicación del usuario. El usuario aportó la ilustración para usarla como acento junto al texto Avanzi.

La imagen es visible en el chat, pero el PNG original no está disponible como archivo descargable en el entorno. En esta versión preliminar no se incorporó ni optimizó, ni se generó una sustituta. La cabecera usa solo el texto Avanzi mientras se recibe el archivo. Al incorporarlo, registrar aquí nombre del recurso local, dimensiones, tamaño y modificaciones de optimización conservando transparencia.

## Recursos por defecto

| Archivo | Contenido y uso |
| --- | --- |
| `por-defecto/receta.svg` | Cuenco y cuchara: ilustración genérica de cocina para tarjetas y detalle cuando falta o falla el SVG de la receta. No representa el plato ni una fotografía. |
| `por-defecto/ingrediente.svg` | Bolsa con hojas: ilustración genérica decorativa para catálogo, seleccionados y compras cuando falta o falla el dibujo del ingrediente. El nombre identifica al ingrediente. |

Autoría y fuente: SVG originales escritos para Avanzi en esta modificación, con los trazos y colores del proyecto aprobado. Fondos transparentes. No se descargaron recursos ni se usó un servicio de generación de imágenes. Se aplica el permiso del proyecto: uso, modificación y redistribución dentro de la app, sin atribución obligatoria. Los SVG anteriores no fueron modificados.
