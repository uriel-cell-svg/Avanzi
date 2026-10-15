# Reglas de trabajo de Avanzi

## Documentos y alcance

- Trabajar en cambios pequeños y comprobables, dentro del pedido vigente. Explicar cambios, resultados y límites en español sencillo.
- [DISEÑO.md](./DISEÑO.md) describe la estética aprobada; [DATOS.md](./DATOS.md), el contrato actual y la propuesta futura, separados. [README.md](./README.md) explica uso y comprobación; [CAMBIOS.md](./CAMBIOS.md) conserva el historial, que no agrega requisitos nuevos.
- Las restricciones particulares de entregas anteriores están identificadas en CAMBIOS; no tratarlas como prohibiciones permanentes ni como autorización para nuevas funciones. Perfil personal y recompensas siguen solo diseñados en ETAPAS_FUTURAS.md.

## Tecnología y datos

- HTML, CSS y JavaScript puros, JSON y recursos locales; Live Server, rutas relativas y ninguna compilación. Sin frameworks, backend, servicios de pago ni dependencias externas para ejecutar la app.
- El catálogo incorporado se carga exclusivamente desde datos/recetas.json y los metadatos desde datos/ingredientes.json; las recetas del usuario tienen una clave local separada y versionada. No duplicar catálogos en JavaScript ni ocultar errores con datos sustitutos. Insertar textos del usuario como texto, no HTML.
- Mantener identificadores estables y relaciones por ID, no por nombre. Conservar compatibilidad con los JSON existentes; documentar cualquier ampliación antes de implementarla.
- datosDePrueba es opcional y booleano si existe. Etiquetar solo true y distinguir catálogos mixtos. Ausencia o false no acreditan nutrición, seguridad ni permisos de reutilización.
- No inventar nutrientes, cantidades, conversiones o equivalencias. Desconocido no es cero. Una propuesta en DATOS no significa soporte implementado.
- La disponibilidad comprueba cantidades, estados y unidades compatibles por ID. Sumar necesidades antes de restar inventario una sola vez. No contar compras pendientes como disponibles ni mezclar secos/cocidos. Conservar búsqueda, clasificación, filtros y desempates.

## Accesibilidad y recursos

- Interfaz en español, adaptable; etiquetas y nombres accesibles, contraste suficiente, foco visible, navegación con teclado y áreas cómodas para tocar. No comunicar estados solo con color.
- Conservar Escape, cierre accesible, desplazamiento interno de diálogos y devolución de foco; mantener el foco tras actualizar controles.
- Errores de carga y guardado visibles en la pantalla o diálogo de la acción, fuera de ayudas plegables. Distinguir cambios temporales de datos guardados.
- Recursos locales propios o con permiso; registrar procedencia y modificaciones en imagenes/FUENTES.md y licencias de fuentes en fuentes/FUENTES.md. No presentar ilustraciones como fotografías del plato.
- Conservar imágenes válidas y respaldos acotados en tarjetas, detalle, catálogo, seleccionados y compras. Si falla también el respaldo, ocultar la imagen conservando espacio, nombre y controles; sin bucles. Detalles visuales en DISEÑO.

## Cantidades, nutrición y persistencia

- Un solo motor nutricional: motor_avanzi.mjs del paquete. Conservar perfiles corregidos, rendimientos y equivalencias aportadas; distinguir desconocido de cero, estimación de medición y total de valor por porción. Hojas de té no ingeridas quedan fuera de nutrición, no fuera de la necesidad de compra.
- No modificar silenciosamente los JSON originales del paquete. La excepción vigente es el parche auditado de siete tiempos; no alteró nutrientes ni ingredientes. Registrar ajustes de clasificación/compatibilidad por separado. Desayunos es editorial; Veggie no debe incluir origen animal desconocido; no confundir pasta de curry con fideos.
- planificacion.mjs contiene la lógica pura de cantidades y la separación de necesidades de recetas retiradas; catalogo_avanzi.mjs valida/adapta el catálogo público; app.js coordina eventos y presenta; almacenamiento.mjs recupera y guarda el snapshot; persistencia_navegador.mjs detecta pestañas obsoletas. No duplicar motores o cálculos por pantalla. Módulos locales compatibles con Live Server y GitHub Pages bajo subruta, sin compilación.
- Conservar las claves que-cocino.despensa.v1 y que-cocino.compras.v1 y los IDs del paquete. El snapshot v3 conjunto se guarda atómicamente en la primera; la segunda queda intacta como legado. No volver al guardado dividido que permite divergencias.
- Leer formatos anteriores y operaciones provisionales sin perder selecciones/compras ni inventar cantidades. Presencia antigua = cantidad por confirmar; correspondencias ambiguas = revisión explícita. Conservar el contenido legado. Datos inválidos bloquean sobrescrituras y fallos de catálogo no escriben almacenamiento.
- Añadir receta/ingrediente es idempotente. Porciones y preparaciones escalan necesidades; quitar receta, fila o asociación recalcula sin retirar inventario. No persistir cantidades derivadas a comprar. Conservar asociaciones y compras sin receta activa.
- Confirmar compra suma solo la cantidad adquirida y su ID de operación evita repetición. La compra parcial deja pendiente el resto. Deshacer respeta existencias previas y modificaciones manuales posteriores.
- Reservar inventario por orden de incorporación para no asignarlo dos veces al conjunto. Los vínculos parciales no autorizan añadir ingredientes automáticamente. La disponibilidad del detalle sigue comprobando la receta completa.
- Registrar como máximo una transición de insuficiente a suficiente por ID de receta, persistida para no repetir al marcar/desmarcar. No añadir recompensas visuales, cuentas o servicios sin otro pedido.
- Las recetas propias usan `recetas_usuario.mjs` para validar y guardar en `avanzi.recetas.usuario.v1`; las fotos WebP se guardan solo en IndexedDB `avanzi-fotos-v1`. No guardar Blobs ni URL en localStorage. Bloquear sobrescrituras cuando la recuperación propia sea corrupta. Conservar planes, necesidades y compras confirmadas al editar o borrar una receta propia vinculada.
- Borrar una foto solo después de guardar el documento y comprobar que ni una receta publicada ni el borrador la referencian. Ante un cambio detectado en otra pestaña, pedir recarga antes de escribir; no presentar esta protección como sincronización ni como transacción atómica entre pestañas.

## Verificación y Git

- Revisar estado de Git antes y después; preservar trabajo existente. Usar el checkout disponible, sin worktrees salvo pedido explícito. No publicar, subir ni incorporar cambios a main sin autorización.
- Verificar lo afectado y sus dependencias: carga/validación, búsqueda/filtros, grupos y desempates, detalle, selección, compras y persistencia parcial/vacía. Para almacenamiento, incluir formatos antiguos, referencias obsoletas, fallos individuales/combinados y recarga.
- Usar datos temporales fuera de los catálogos entregados. Para cambios visuales, comprobar teclado, foco, contraste, celular/computadora, desbordes y capturas reales. No atribuir a una entrega pruebas históricas no repetidas.
- En entregas solo documentales, cotejar con el código y verificar integridad de la aplicación. Informar pruebas ejecutadas y pendientes, y preparar el ZIP cuando se pida. No incluir herramientas temporales, credenciales ni archivos de Git.
