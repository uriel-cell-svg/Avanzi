# Diseño aprobado de Avanzi

Referencia vigente: «Lo que tengo · Recuadro de seleccionados», opción B, y su unificación con Recetas, detalle y compras. La selección visible es binaria y las compras usan subtareas. Las cantidades permanecen en recetas, compras y nutrición. La lógica vive en módulos locales; la presentación, en index.html, estilos.css y app.js.

## Identidad compartida

- Fondo blanco, texto negro suave, composición limpia y compacta. Ilustraciones coloreadas de alimentos sobre transparencia, con superficies suaves limitadas a las zonas ilustradas y al recuadro de seleccionados.
- La cabecera usa el logotipo oficial aportado por el usuario, con espátula y temporizador de tomate. El PNG original y la copia recortada se conservan intactos; la versión visible tiene el fondo transparente y mantiene las proporciones. El trío tomate/mozzarella/albahaca permanece como referencia histórica sin uso.
- Alfa Slab One local para la marca y títulos h1/h2, incluido el título del detalle. Fraunces local para h3/h4, nombres de tarjetas, pestañas y algunos contadores. Sistema para lectura, ingredientes, pasos y controles. Georgia es alternativa de respaldo, no la fuente principal de marca. No añadir fuentes ni servicios remotos. Licencias: [fuentes/FUENTES.md](./fuentes/FUENTES.md).
- Bolsa negra arriba con contador rojo de compras pendientes y nombre accesible «Lista de compras». Pestañas «Lo que tengo» y «Recetas», activa subrayada en verde. Cabecera y fondo estables al navegar.
- Botones y campos comparten estilos. Botones de al menos 44 px de altura, buscadores/selectores de 48 px; las áreas de las tarjetas y etiquetas amplían el alcance de las casillas. Foco verde visible y estados con texto o símbolos, no solo color.
- No restaurar papel arrugado, adornos marginales, degradados decorativos, sombras fuertes ni frases de bienvenida retiradas. Evitar capas de CSS contradictorias.

### Colores actuales

| Uso | Color |
| --- | --- |
| Fondo | #ffffff |
| Texto principal / marca | #171d18 / #111111 |
| Acciones y selección de categoría | #13522b |
| Disponibilidad y foco | #226437 |
| Faltantes | #922b35 |
| Selección suave | #e8f3e6 |
| Recuadro de seleccionados | #fff2d6 |
| Zona ilustrada de tarjeta | #fff4e1 |
| Texto secundario / borde general | #4e5b4f / #dce4d8 |
| Contador de compras | #bd2420 con número blanco |

Estos valores describen el CSS aprobado; no autorizan extender fondos de acento a toda la interfaz.

## Lo que tengo

- Pantalla inicial: «¿Qué tenés en casa?», sin subtítulo. Etiqueta breve de datos de prueba solo cuando corresponde.
- Recuadro crema «Lo que tengo · N». Muestra todos los seleccionados, incluso con filtros activos: dibujo, nombre y × accesible. Vacío: solo título. Muchos seleccionados: una fila horizontal desplazable de altura acotada.
- Buscador con lupa y etiqueta accesible, categorías como botones en una fila desplazable. «Todos» y solo categorías presentes del catálogo de 200: Legumbres, Cereales, Verduras, Frutas, Carnes y Otros. La búsqueda y las categorías no alteran selección ni contador total.
- Desde «Editar lo que tengo» en un detalle, se limpian filtros y los ingredientes de esa receta aparecen primero con borde terracota. El orden se quita al volver normalmente a la pestaña.
- Catálogo estable: los ingredientes seleccionados no se mueven ni desaparecen. Cuatro columnas en computadora, dos hasta 650 px y una hasta 300 px. Dibujo protagonista, nombre visible, tarjeta verde suave y ✓ al seleccionar. Casilla real operable por teclado: tocarla alterna presencia sin abrir un formulario de cantidad.
- «Vaciar despensa» aparece junto al título de «Lo que tengo» y pide confirmación. Conserva los alimentos fijados y las compras completadas. El pie en el flujo del documento mantiene el contador, el menú accesible ⋮ con «Tengo todo» y el botón principal «Ver qué puedo cocinar». Una chincheta discreta en cada tarjeta permite fijar o desfijar. No tapar contenido ni teclado con una barra fija.
- Ayuda desplegable para las explicaciones; errores de guardado siempre visibles.

## Recetas

- Título, etiqueta de prueba cuando corresponde, búsqueda «Buscar receta o ingrediente» con lupa y etiqueta accesible; filtro «Mostrar» y botones horizontales de categoría como en Lo que tengo. Categorías: Todas, Rápidas, Veggie, Pastas, Carnes y Desayunos. Sin selector manual de orden.
- Tres grupos con contadores pequeños: «Ya tenés todo, ¡a cocinar!» (0 ingredientes ausentes), «Ya casi» (1–3) y «Con algunas compras más» (más de 3). Orden por faltantes, tiempo y nombre.
- Tarjetas blancas redondeadas: borde verde e «Ingredientes disponibles» si completas; borde rojizo y franja bordó con número de faltantes si incompletas. Nombre, tiempo con reloj, porciones con grupo, faltantes, prueba cuando corresponda y «Ver preparación».
- Las 39 recetas muestran sus WebP locales, identificadas como imágenes ilustrativas generadas con IA. Se conservan dibujos y respaldos anteriores; proporciones contenidas, sin recortes. Tres columnas en escritorio, dos hasta 1000 px y una hasta 650 px.
- «Crear receta» comparte la cabecera de sección. El editor usa diálogo blanco desplazable, buscador único de ingredientes con resultados ilustrados por nombre/alias; cada ingrediente elegido muestra dibujo, nombre, cantidad y unidad. Los pasos siguen reordenables. Solo las recetas propias muestran «Editar receta» y «Borrar receta» con confirmación integrada, «Cancelar» y «Eliminar receta»; hay un solo borrador recuperable. Las fotos locales se identifican como aportadas por el usuario.
- Vacíos específicos sin filtros; «Sin coincidencias» con búsqueda/filtro. Ayuda general plegable, sin explicación repetida en cada tarjeta completa.

## Detalle

- Diálogo blanco con desplazamiento interno, cabecera y «Cerrar» siempre accesibles. Escape y cierre devuelven el foco; «Editar lo que tengo» cierra y enfoca el buscador de ingredientes.
- Arriba: título, tiempo y porciones. En escritorio, título y metadatos comparten fila; debajo hay dos columnas compactas de ingredientes. En celular se apilan.
- Sin casillas de disponibilidad. Nombre y cantidad en verde con ✓ si el ingrediente está presente, en rojo con + si falta. Leyenda «✓ Lo tenés · + Te falta», sin repetir la cantidad faltante. Porciones y Preparaciones conservan campos compactos.
- Acciones individuales de bajo peso: bolsa + «Añadir a compras», o «En tu lista» y «Quitar». Se acomodan al lado o debajo del nombre sin reducir su legibilidad.
- Acción principal «Añadir receta a compras» incorpora sus necesidades sin duplicarlas. Si ya está completa, se mantiene el estado de suficiencia; si ya está incluida, se informa. Acceso secundario «Editar lo que tengo». Las acciones individuales conservan menor peso visual.
- «Sobre estos datos» reúne aclaraciones; etiqueta de prueba y avisos de guardado permanecen visibles fuera de ese desplegable.
- En el medio, WebP ilustrativa del paquete (320 px de alto en escritorio, 230 en celular), con leyenda IA; el respaldo conserva su zona baja. Después, preparación completa numerada y tabla compacta de estimaciones nutricionales para total y porción, con ayuda desplegable. No presentar estas imágenes generadas como fotos verificadas del plato.

## Perfil y sugerencias

- «Mi perfil» permanece en la navegación; «Para vos» y «Favoritos» aparecen como categorías horizontales de «Recetas», con acentos plateado y dorado. El perfil muestra primero nombre, objetivo y tipo de alimentación; los datos para estimaciones quedan en un desplegable opcional.
- «Para vos» reutiliza las tarjetas de recetas, ilustraciones y el diálogo de preparación. Cada sugerencia añade hasta dos motivos breves. Sin objetivo muestra un acceso a «Mi perfil», sin bloquear las demás categorías; el tipo de alimentación es opcional. Las tarjetas incluyen una estrella accesible y la estimación del perfil usa una tarjeta de borde verde con tres tonos suaves para macronutrientes.
- Errores del perfil visibles junto al formulario, confirmación antes de eliminar y retorno del foco. No se agregan colores ni ilustraciones nuevos.

## Lista de compras

- Panel blanco a la derecha en computadora, ancho completo en celular. Cierre accesible durante el desplazamiento y retorno de foco al acceso de bolsa.
- Pendientes arriba: una fila por ingrediente con casilla principal circular, dibujo, nombre, total pendiente y × accesible. Debajo, subtareas por receta con casilla cuadrada y cantidad; las completadas se tachan. La casilla principal cambia todas las subtareas.
- «Compras completadas (N)» plegable reúne ingredientes sin subtareas pendientes. Cada casilla permanece recuperable tras recargar; desmarcar devuelve su cantidad al pendiente. El contador superior solo cuenta ingredientes pendientes.
- «Agrupar por categoría» ordena opcionalmente Por ingrediente con los grupos existentes del catálogo. El estado inicial es la lista simple; no cambia subtareas ni cantidades.
- El selector «Por ingrediente» / «Por receta» muestra las mismas subtareas. Por receta, cada bloque plegable presenta dibujo, nombre, cantidad y casilla de cada ingrediente, además de «Marcar todos» y «Eliminar receta». Las compras completadas de recetas retiradas quedan recuperables en «Sin receta». «Vaciar lista» conserva confirmación/cancelación. Debajo, «Después de comprar» muestra recetas posibles si se cubren las subtareas abiertas.
- Nota breve sobre cantidades, ayuda «Sobre esta lista» y avisos de guardado visibles. Las reglas reversibles de la checklist se conservan según AGENTS y README.

## Recursos y fallos de carga

Las rutas y el contrato exacto están en [DATOS.md](./DATOS.md); procedencia en [imagenes/FUENTES.md](./imagenes/FUENTES.md). Conservar dibujos individuales existentes cuando carguen; los demás ingredientes usan SVG locales por familia visual. Si falla también esa imagen, usar el SVG por defecto: cuenco/cuchara para recetas, bolsa/hojas para ingredientes. Son respaldos decorativos, no fotografías ni representaciones del plato.

La recuperación se aplica a tarjeta, detalle, catálogo, recuadro y compras, con cada candidata intentada una vez por imagen. Si falla el respaldo, ocultar la imagen rota conservando dimensiones, nombres y controles; el detalle indica «Sin ilustración». No introducir saltos de tamaño, reintentos indefinidos ni cambios de selección por un fallo visual.

## Criterios de comprobación

Para una futura modificación visual: revisar 320, 360, 390, 768 y 1440 px, ausencia de desbordamiento de página (se permiten las filas horizontales previstas), contraste, foco, áreas táctiles, nombres largos, ambos estados de disponibilidad, diálogos y avisos. Tomar capturas del código renderizado. Resultados de las comprobaciones efectivamente ejecutadas: CAMBIOS.md; no confundir estos criterios con pruebas históricas.
