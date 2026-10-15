# Etapas posteriores · diseño, sin implementación

Estas tareas **no están programadas en esta entrega**. Mantenerlas separadas del editor de recetas y del snapshot de inventario/compras. Requieren revisión y aprobación antes de empezar.

## Etapa 2 · perfil voluntario y comparación nutricional

1. Definir una clave local versionada exclusiva del perfil, independiente de `avanzi.recetas.usuario.v1` y `que-cocino.despensa.v1`. Permitir no crear perfil y borrar todos sus datos. No transmitirlos ni usar telemetría.
2. Campos: edad adulta en años, peso en kg, estatura en cm, nivel de actividad, parámetro fisiológico que la fórmula Mifflin–St Jeor requiere y preferencia «Solo ver nutrientes», «Mantener hábitos», «Ganar masa muscular» o «Reducir peso». No inferir el coeficiente de sexo/género declarado. Explicar el límite de la fórmula y permitir omitir el cálculo cuando el parámetro no sea adecuado o no se quiera informar.
3. Calcular gasto **en reposo** mediante Mifflin–St Jeor para adultos; calcular gasto diario aplicando un factor de actividad publicado y documentado. Separar ambos valores en el resultado. Para objetivos, proponer rangos conservadores y orientativos; no fijar déficits restrictivos automáticamente ni prometer pérdida de peso.
4. Mostrar la comparación con los nutrientes de una receta sin cambiar `calcularNutrientes`, la receta ni el inventario. Si la nutrición de la receta es incompleta, decirlo y no convertir desconocidos en cero. Nunca bloquear una receta ni calificar alimentos como buenos/malos.
5. Avisar que el estimador no se aplica sin evaluación profesional a menores, embarazo o lactancia y puede no ser apropiado ante condiciones médicas particulares. Probar edades límite, campos vacíos, borrado, privacidad, estimaciones incompletas y ausencia de perfil.

## Etapa 3 · recompensas, tienda y mascota opcional

1. Definir un evento único de transición de una **receta vinculada a un plan** desde insuficiente a completa como resultado de una **compra confirmada**. Reutilizar la transición de disponibilidad existente como señal, pero verificar origen de compra, estado previo/posterior y día antes de premiar. Añadir a la lista o alternar casillas no es recompensa.
2. Usar IDs de evento estables e idempotentes y un registro local transaccional para saldo, historial y mascotas. Una compra parcial que no completa la receta no premia; recarga, deshacer o volver a marcar tampoco duplica premio. Definir y documentar límite diario y regla proporcional; revisar abusos mediante recetas propias triviales antes de activar premios.
3. `datos/mascotas.json` futuro: ID, nombre, precio, recurso local, tipo estático/animado, autor, origen y licencia. No incluir recursos sin permiso verificado. Comprar solo si alcanza el saldo, restarlo exactamente una vez y persistir la mascota activa.
4. Mascota discreta y optativa: cargar animación solo al estar visible, pausar con la página en segundo plano y respetar `prefers-reduced-motion` con versión estática. Probar cuotas, fallos de guardado, compras simultáneas, idempotencia, accesibilidad y rendimiento móvil antes de extender la interfaz.
