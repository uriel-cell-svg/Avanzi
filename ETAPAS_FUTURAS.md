# Etapas posteriores

El perfil, las sugerencias, el agotamiento de ingredientes y las jornadas con monedas ya están implementados. La tienda de mascotas y las demás etapas pendientes requieren otro pedido.

## Etapa 2 · perfil voluntario y sugerencias (implementada)

Contrato, fórmulas, fuentes y límites: [DATOS.md](./DATOS.md) y [NUTRICION_PERFIL.md](./NUTRICION_PERFIL.md). El perfil no es obligatorio para usar jornadas de compras.

## Etapa 3 · recompensas implementadas; tienda y mascota pendientes

Las jornadas registran IDs de nuevas necesidades, recetas candidatas y movimientos de monedas en el snapshot de compras. Las reglas y límites actuales están en [DATOS.md](./DATOS.md). El historial de compras anteriores no se reutiliza. No hay compras de mascotas todavía.

1. `datos/mascotas.json` futuro: ID, nombre, precio, recurso local, tipo estático/animado, autor, origen y licencia. No incluir recursos sin permiso verificado. Comprar solo si alcanza el saldo, restarlo exactamente una vez y persistir la mascota activa.
2. Mascota discreta y optativa: cargar animación solo al estar visible, pausar con la página en segundo plano y respetar `prefers-reduced-motion` con versión estática. Probar cuotas, fallos de guardado, compras simultáneas, idempotencia, accesibilidad y rendimiento móvil antes de extender la interfaz.
