/** Fotos locales de recetas propias. Nunca se envían a un servidor. */
const BASE='avanzi-fotos-v1', ALMACEN='fotos';
const TIPOS=['image/jpeg','image/png','image/webp'];
const MAX_ORIGEN=10*1024*1024;
/** Una foto se borra solo si el documento ya guardado no la referencia. */
export function fotosSinReferencias(candidatas, documento) {
  const enUso=new Set([...(documento?.recetas||[]).map(r=>r.imagenId),documento?.borrador?.imagenId].filter(Boolean));
  return [...new Set(candidatas.filter(Boolean))].filter(id=>!enUso.has(id));
}
export function validarArchivoFoto(file) {
  if(!file || !TIPOS.includes(file.type))throw new Error('Elegí una imagen JPG, PNG o WebP.');
  if(file.size<=0 || file.size>MAX_ORIGEN)throw new Error('La foto original debe ocupar como máximo 10 MB.');
}
function abrirBase() {
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(new Error('Este navegador no permite guardar fotos locales.'));return;}
    const req=indexedDB.open(BASE,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(ALMACEN))req.result.createObjectStore(ALMACEN);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('No se pudo abrir el almacén de fotos.'));
    req.onblocked=()=>reject(new Error('Otra pestaña bloquea el almacén de fotos.'));
  });
}
async function operar(modo,accion) {
  const db=await abrirBase();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(ALMACEN,modo),req=accion(tx.objectStore(ALMACEN));
    let valor;
    req.onsuccess=()=>{valor=req.result;};
    tx.oncomplete=()=>resolve(valor);
    tx.onerror=()=>reject(tx.error||new Error('No se pudo guardar la foto.'));
    tx.onabort=()=>reject(tx.error||new Error('Se interrumpió el guardado de la foto.'));
  });}finally{db.close();}
}
export const obtenerFoto=id=>operar('readonly',store=>store.get(id));
export const guardarFoto=(id,blob)=>operar('readwrite',store=>store.put(blob,id));
export const borrarFoto=id=>operar('readwrite',store=>store.delete(id));

export async function optimizarFoto(file) {
  validarArchivoFoto(file);
  let bitmap, url, img;
  try {
    // createImageBitmap aplica la orientación EXIF cuando el navegador la soporta.
    if(globalThis.createImageBitmap)bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
    else {
      url=URL.createObjectURL(file);
      img=await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error('La imagen está dañada.'));el.src=url;});
    }
    const ancho=bitmap?.width||img.naturalWidth,alto=bitmap?.height||img.naturalHeight;
    if(!ancho||!alto||ancho*alto>1e8)throw new Error('La imagen está dañada o es demasiado grande para procesarla.');
    const escala=Math.min(1,1000/Math.max(ancho,alto));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(ancho*escala));canvas.height=Math.max(1,Math.round(alto*escala));
    canvas.getContext('2d').drawImage(bitmap||img,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.8));
    if(!blob||blob.type!=='image/webp')throw new Error('Este navegador no pudo convertir la foto a WebP.');
    return blob;
  }catch(error){throw new Error(error?.message||'No se pudo leer la foto.');}
  finally{bitmap?.close?.();if(url)URL.revokeObjectURL(url);}
}
