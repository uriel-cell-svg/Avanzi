# Reglas de trabajo

- Trabajar en cambios pequeños y comprobables. Revisar el estado de Git antes y después.
- Usar el checkout existente: las tareas en la nube ya están aisladas. No crear worktrees salvo pedido explícito.
- Esta versión usa solo HTML, CSS y JavaScript puros y datos JSON, sin frameworks, backend, servicios pagos ni dependencias externas.
- Debe funcionar con Live Server, sin Node.js ni compilación. Usar rutas relativas.
- Mantener la interfaz en español, adaptable a computadora y celular: marfil cálido, verde salvia y azulado, pequeños acentos rosa y durazno, texto oscuro, tarjetas tipográficas con menos recuadros y secciones Mi despensa y Recetas. Bienvenida: «Algo rico empieza con lo que tenés».
- Cargar recetas exclusivamente desde datos/recetas.json. Identificar como datos de prueba únicamente las recetas con datosDePrueba: true; el campo es opcional y solo admite booleanos cuando está presente. No duplicarlas en JavaScript ni ocultar errores de carga.
- Cada receta incluye identificador, nombre, ingredientes con identificadores, cantidades y unidades, porciones, tiempo y pasos.
- La despensa empieza vacía. Permitir marcar ingredientes, Tengo todo y Desmarcar todo.
- Comparar presencia de ingredientes y mostrar los faltantes. Aclarar que aún no se comprueban cantidades.
- Buscar por nombre o ingrediente ignorando mayúsculas y tildes. Filtrar todas, completas y faltantes. Mostrar detalle e instrucciones.
- Guardar y recuperar la selección con localStorage, incluida la selección vacía. Manejar datos inválidos y fallos de almacenamiento sin bloquear la app.
- Comprobar carga, búsqueda, filtros, detalle, faltantes y persistencia parcial y vacía. Informar pruebas ejecutadas y pendientes; mostrar capturas cuando sea posible.
- No añadir nutrientes, precios, PDF, perfil, planificador, recetas propias ni mascota. No inventar datos nutricionales.
- Explicar cambios y pruebas en español sencillo para alguien que nunca programó.
- No publicar ni incorporar cambios a main sin autorización. Esperar la devolución del usuario.

- Agrupar recetas en completas (0), Ya casi (1–3) y Con algunas compras más (>3). Contar identificadores únicos. Orden fijo por faltantes, tiempo y nombre; no añadir selectores de orden contradictorios.
- Mostrar tiempo, porciones, disponibilidad, nombres de faltantes y botón Ver preparación en cada tarjeta.
- Usar imágenes propias o con permiso, locales, con procedencia en imagenes/FUENTES.md. No copiar recursos de Jamie Oliver. Si no hay fotos apropiadas, usar ilustraciones identificadas sin representar otro plato como la receta.
- Mantener contraste, etiquetas, foco visible, navegación con teclado y cierre del detalle con Escape y devolución del foco.
- No añadir conservación ni otras funciones fuera del alcance. Entregar capturas de ambas pestañas en computadora y celular, un ZIP completo y una prueba sencilla para Live Server.

- Conservar las funciones y el formato del JSON de recetas; los metadatos de despensa se cargan desde datos/ingredientes.json. Bienvenida compacta, especialmente en celular; simplificar textos decorativos.
- Marca qué cocino con ramita propia local de dos hojas, trazo discreto e irregular, sin emojis.
- No usar imágenes generadas ni repetir una imagen de plato en todas las tarjetas. Priorizar fotografías apropiadas con permiso; alternativa: dibujos específicos de ingredientes y tarjetas tipográficas. Registrar procedencia en imagenes/FUENTES.md.
- No inclinar textos o botones, no añadir degradados decorativos, texturas que dificulten leer, sombras excesivas ni animaciones innecesarias.

- Usar Fraunces local para títulos; conservar la marca. Registrar licencia y origen en fuentes/FUENTES.md. Sin servicios externos de fuentes.
- Dibujos de receta aproximadamente 40 % más grandes, sin recortes. Cada ingrediente de despensa tiene SVG decorativo y nombre siempre visible.
- datos/ingredientes.json contiene id, nombre, categoria y dibujo. Relacionar con recetas por id y mantener los identificadores existentes y la clave de localStorage.
- Categoría muestra Todos y solo categorías no vacías en el orden solicitado. Filtrar no cambia selección ni contador global. Tengo todo y Desmarcar todo afectan toda la despensa y deben aclararlo.
- Validar carga y formato del JSON de ingredientes; mostrar error claro sin sobrescribir la selección guardada.

- Despensa inicial con búsqueda sin tildes/mayúsculas, categorías y Ver qué puedo cocinar al pie a la derecha. Filtrar no cambia selecciones.
- Tarjetas completas con borde verde y Tenés todo; incompletas con borde y franja bordó rojiza con número de faltantes. Conservar dibujos visibles. Aclarar presencia, no cantidades suficientes ni seguridad alimentaria.
- Detalle con disponibilidad de lectura sin casillas, leyenda ✓ En tu despensa · + Te falta y acceso Editar mi despensa; compras no implica disponibilidad. Añadir individual o todos los faltantes; botón desactivado si no faltan ingredientes.
- Compras por identificador único y asociaciones internas. Casilla reversible, pendientes arriba, Comprados plegable abajo, × elimina sin cambiar despensa y contador solo de pendientes.
- Posibilidades después de comprar: unión de despensa y lista, solo recetas todavía incompletas cubiertas totalmente. Recalcular al quitar. Nunca trasladar a completas antes de tener los ingredientes realmente.
- Validar almacenamiento de ambas listas y conservar claves/identificadores anteriores. Manejar errores sin bloqueo ni recetas de respaldo. No sumar cantidades ni calcular precios.
- Probar primero despensa/agrupación, después detalle/compras y finalmente posibilidades. Casos 0/1/3/4, asociaciones compartidas, cobertura parcial/total, persistencia parcial/vacía, teclado, Escape y devolución de foco, computadora y celular. Datos temporales solo en pruebas si hacen falta.
- Mantener paleta, Fraunces, marca y SVG locales. No copiar marca, fotografías, publicidad, cuentas o premium de referencias. Entregar ZIP completo y capturas de despensa, resultados, detalle y compras.

- Ingredientes del detalle: nombre y cantidad verdes si disponibles, rojos si faltantes, símbolos decorativos sin recuadro y texto accesible de estado. No repetir Tenés/Te falta al final.
- Añadir a compras con icono de bolsa decorativo; En tu lista y Quitar si añadido. Añadir todos los faltantes solo si hay pendientes de añadir; receta completa muestra Tenés todos los ingredientes.
- Mantener errores de guardado siempre visibles; aclaraciones en Sobre estos datos y nota única Revisá las cantidades antes de cocinar. Mi despensa conserva casillas y guardado coordinado.

- Ajustar avisos por receta y catálogo mixto. false o ausencia no implican verificación nutricional, seguridad ni derechos. Probar con datos temporales sin cambiar el catálogo entregado.

- Recuperar listas con referencias antiguas sin descartar los IDs vigentes. Conservar compras de ingredientes existentes aunque no queden recetas de origen. Limpiar solo referencias obsoletas y avisar; fallos de carga no deben escribir almacenamiento. Mantener claves y guardado coordinado.

- Compras: guardar comprado e incorporadoPorCompra. Deshacer retira solo lo incorporado por la compra. Una edición manual de Mi despensa toma prioridad: actualiza estado de fila y libera la propiedad de la compra. Los botones globales sincronizan filas existentes sin crearlas ni eliminarlas.
- Leer el formato antiguo de compras y conservar filas/asociaciones. Formato nuevo version: 2 con items y registro provisional de operación durante escrituras coordinadas; usar las mismas claves. Fallos deben conservar fila y reversibilidad tras recarga, sin migraciones destructivas.
- Posibilidades = despensa real más filas pendientes, nunca comprados ausentes ni recetas ya completas. Mantener ayudas plegables, errores visibles, foco tras mover filas y capturas celular/computadora.
