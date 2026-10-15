# Actualización nutricional de ocho recetas — 15/10/2026

Se conserva una colección única de 39 recetas, 200 ingredientes y 39 imágenes IA WebP. **Todos los valores nutricionales son aproximados**. Esta corrección resuelve la posibilidad de cálculo por porción; no constituye una validación clínica ni analítica.

Las recetas originales en inglés se conservan en `auditoria/originales_en/`. Los enlaces complementarios se usaron para contrastar rendimientos y técnicas, no para copiar textos completos.

| Receta | Rendimiento adoptado | Kcal/porción estimadas | Motivo |
|---|---:|---:|---|
| Waffles clásicos | 20 | 252.7 | Actualizacion del rendimiento y nutrientes. La fuente original indica 19–20 waffles; se usa 20 unidades como rendimiento nominal y 1 waffle por porcion. |
| Pasta con carne picada y tomate | 2 | 922.5 | Actualizacion del rendimiento y nutrientes. La fuente original indica aproximadamente dos porciones abundantes para adultos. |
| Porotos refritos | 2 | 386.2 | Actualizacion del rendimiento y nutrientes. La fuente original indica aproximadamente dos porciones para adultos. Perfil nutricional cocido para porotos enlatados. |
| Té especiado con leche y jengibre | 4 | 59.7 | Actualizacion del rendimiento y nutrientes. Se ignoran completamente los 12 g erróneamente asignados al té negro. Se conservan las 2 cucharadas como insumo de infusion no consumido y se añade 1 litro de agua del procedimiento original. |
| Pasta arrabbiata | 5 | 482.1 | Actualizacion del rendimiento y nutrientes. 5 porciones estimadas (100 g pasta seca por racion) sobre 500 g pasta y 800 g tomate del original. Condimentos y aceite orientativos. Modelo de referencia BBC Food: 400 g de pasta para 4. |
| Espaguetis cacio e pepe | 4 | 395.4 | Actualizacion del rendimiento y nutrientes. 4 porciones de 80 g de pasta seca; 100 g pecorino y 3 g pimienta por receta. Cantidades antes orientativas, respaldadas como variante moderada por recetas italianas de 400 g pasta/4 porciones; rendimiento y tiempo estimados. |
| Panqueques daneses finos | 6 | 393.6 | Actualizacion del rendimiento y nutrientes. 6 porciones estimadas de 3 panqueques finos, cerca de 18 unidades; uso orientativo de fuente danesa (375 g harina, 4 huevos, 18 unidades). Corregido azúcar: 1½ cda ~19 g, no 6 g. Estimados 10 g de manteca de coccion; tiempo estimado. |
| Avena cocida con banana, frutas y pasta de maní | 1 | 331.4 | Actualizacion del rendimiento y nutrientes. Versión editorial de una porcion: 40 g avena arrollada (aprox. media taza), 240 ml agua (una taza, como sugiere el original), 60 g banana, 50 g frutas, 0,5 g canela, 0,5 g sal, 15 g pasta de maní. Todos los toppings se cuentan, sin cantidades ambiguas. |

## Referencias comparativas (fuentes externas)

- Arrabbiata: BBC Food, `https://www.bbc.co.uk/food/recipes/pennealarrabiatapast_83813` (referencia de 100 g pasta seca/persona).
- Cacio e pepe: Italy Food, `https://italyfood.com.au/recipes/cacio-e-pepe/` (porciones y combinación de ingredientes); receta de Avanzi mantiene la cantidad previa.
- Panqueques daneses: Nordic Food & Living, `https://nordicfoodliving.com/danish-pancakes/` (375 g harina + 4 huevos, 18 panqueques, tamaño variable).
- Avena: receta original de Public Domain Recipes `https://publicdomainrecipes.com/oats/` (½ taza de avena, agua en proporción por volumen); contraste con `https://www.theguardian.com/food/2018/oct/20/porridge-pancakes-recipe-waste-not-tom-hunt`.

## Alcance y limitaciones

- **Waffles:** rendimiento publicado de 19–20 unidades. Avanzi toma 20 waffles para que se calcule una unidad individual; si salen 19, el valor por waffle cambia ligeramente.
- **Pasta con carne picada y porotos refritos:** la fuente indica dos porciones abundantes y dos porciones, respectivamente. El producto con porotos usa nutrición de legumbre cocida.
- **Té:** no se contabilizan como alimento ingerido las hojas de té usadas para la infusión (2 cucharadas; no 12 g). El agua figura en los ingredientes como 1000 ml, 0 kcal; el azúcar opcional que el usuario pueda agregar no se calcula.
- **Arrabbiata, cacio e pepe, panqueques daneses y avena:** los rendimientos y algunas cantidades son decisiones editoriales explícitas. Dejar posibilidad de ajuste en Avanzi.
- **Panqueques daneses:** azúcar corregido de 6 g a aprox. 19 g. Además se contabilizan 10 g estimados de manteca para la sartén; no incluyen toppings como mermelada o almíbar.
- **Avena:** esta es una **variante concreta con toppings** y su cálculo los incluye todos; si el usuario los omite, deben recalcularse los nutrientes.
- **Todas las recetas:** no se corrigen pérdidas por cocción ni absorción de agua/aceite; publicación requiere revisión nutricional.

## Resultado de pruebas

Ejecutar `node pruebas_motor.mjs` en la raíz del paquete.
