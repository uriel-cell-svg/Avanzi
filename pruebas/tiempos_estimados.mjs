import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../datos/recetas.json', import.meta.url),'utf8'));
assert.equal(data.recetas.length,39);
const ids=new Set(data.recetas.map(r=>r.id));assert.equal(ids.size,39);
for (const r of data.recetas) {
 assert(Number.isInteger(r.tiempoTotalMinutos) && r.tiempoTotalMinutos>0,`${r.id}: tiempo total faltante`);
}
const esperados = { 'pdr-creamy-mashed-potatoes':45,'pdr-aglio-e-olio':20,'pdr-stracciatella-soup':25,'pdr-pasta-navy-style':35,'pdr-refried-beans':25,'pdr-basic-meatballs':45,'pdr-honey-garlic-chicken':55};
for (const [id, total] of Object.entries(esperados)) {
 const r=data.recetas.find(r=>r.id===id);assert(r);
 assert.equal(r.tiempoPreparacionMinutos+r.tiempoCoccionMinutos,total);
 assert.equal(r.tiempoTotalMinutos,total);
 assert.equal(r.revision.tiempoEstimado,true);
}
assert.equal(data.recetas.find(r=>r.id==='pdr-aglio-e-olio').tiempoTotalMinutos<20,false);
console.log('OK: 39 recetas con tiempo total y 7 tiempos estimados auditados.');
