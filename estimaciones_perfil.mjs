/** Referencias para adultos; no sustituye una evaluación individual. */
const PAL={sedentario:1.4,ligero:1.53,moderado:1.76,activo:1.99,'muy-activo':2.25};
const redondear=n=>Math.round(n);
export function estimarPerfil(perfil) {
  if(!perfil)return {energia:null,proteinas:null,carbohidratos:null,grasas:null,motivo:'Sin perfil'};
  const peso=perfil.pesoKg;
  const proteinas=Number.isInteger(perfil.edad)&&perfil.edad>=19&&Number.isFinite(peso)&&peso>0
    ? perfil.objetivo==='ganar'&&perfil.entrenaFuerza===true
      ? {min:redondear(1.4*peso),max:redondear(2*peso),tipo:'ejercicio'}
      : {min:redondear(.8*peso),max:redondear(.8*peso),tipo:'general'}
    : null;
  const apto=perfil.usarEstimacion===true&&Number.isInteger(perfil.edad)&&perfil.edad>=19&&perfil.edad<=78&&
    Number.isFinite(peso)&&peso>0&&Number.isFinite(perfil.alturaCm)&&perfil.alturaCm>0&&
    Object.hasOwn(PAL,perfil.actividad)&&['mas-5','menos-161'].includes(perfil.coeficiente);
  if(!apto)return {energia:null,proteinas,carbohidratos:null,grasas:null,motivo:'Faltan datos o la fórmula no corresponde a este perfil'};
  const reposo=10*peso+6.25*perfil.alturaCm-5*perfil.edad+(perfil.coeficiente==='mas-5'?5:-161);
  const diario=reposo*PAL[perfil.actividad];
  if(reposo<=0||diario<=0)return {energia:null,proteinas,carbohidratos:null,grasas:null,motivo:'La fórmula no produjo un resultado válido'};
  return {energia:{reposo:redondear(reposo),diario:redondear(diario),factor:PAL[perfil.actividad]},proteinas,
    carbohidratos:{min:redondear(diario*.45/4),max:redondear(diario*.65/4)},
    grasas:{min:redondear(diario*.20/9),max:redondear(diario*.35/9)},motivo:null};
}
