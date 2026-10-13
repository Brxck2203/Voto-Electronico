import { passHash, sha } from './store.js'
// Solo cuentas FICTICIAS. Nunca usar esta semilla para elecciones oficiales.
export const demoElectors = [
  ['101000001','Elena Vargas','A91B2C3D4E5F60718293ABCD'],
  ['101000002','Juan Rivera','B12C3D4E5F60718293ABCDEF'],
  ['101000003','Alejandra Pérez','C23D4E5F60718293ABCDEF01'],
  ['101000004','Laura Jiménez','D34E5F60718293ABCDEF0123'],
  ['101000005','Miguel Torres','E45F60718293ABCDEF012345'],
  ['101000006','Paola Castro','F56A718293ABCDEF01234567'],
  ['101000007','Andrés Morales','A67B8293ABCDEF0123456789'],
  ['101000008','Daniela Solís','B78C93ABCDEF0123456789AB'],
  ['101000009','Ricardo Chaves','C89DABCDEF0123456789ABCD'],
  ['101000010','Valeria Soto','D90EBCDEF0123456789ABCDEF'],
]
export const demoAdmin = {email:'tribunal@demo.local', password:'Tribunal2026!'}
const id = (n) => n.toLowerCase().replace(/\W/g, '-')
const candidate = (name, n) => ({ id:`cand-${n}`, nombre:name, agrupacion:n%2 ? 'Unión' : 'Horizonte', propuesta: n%2 ? 'Participación y formación continua.' : 'Transparencia y modernización de la organización.' })
export function createInitialDatabase(now = Date.now()) {
  const orgId = 'asociacion-horizonte-demo'
  const ballotA = {id:'presidencia',name:'Presidencia',min:1,max:1, options:[candidate('Sofía Mora',1),candidate('Diego Vargas',2),candidate('Ana Rodríguez',3)]}
  const ballotB = {id:'tesoreria',name:'Tesorería',min:1,max:1,options:[candidate('Luis Fernández',4),candidate('Mariana Solano',5)]}
  return {
    version:1,
    organizations:[{id:orgId,name:'Asociación Horizonte'}],
    admins:[{id:'admin1',email:demoAdmin.email,name:'Tribunal · Coordinación',orgId,passwordHash:passHash(demoAdmin.password)}],
    electors:demoElectors.map(([cedula,name,code],i)=>({id:`elector-${i+1}`,name,orgId,cedulaHash:sha(cedula),codeHash:sha(code)})),
    elections:[
      {id:'eleccion-demo',orgId,name:'Junta directiva 2026 · Demostración',purpose:'Ejercicio académico de elección de presidencia y tesorería.',status:'PUBLICADO',weighting:'IGUALITARIO',sessionSeconds:180,openAt:now-3600000,closeAt:now+365*86400000,ballots:[ballotA,ballotB], roll:demoElectors.map((_,i)=>({electorId:`elector-${i+1}`,weight:1})),rollFrozenCount:demoElectors.length,orderVersion:1},
      {id:'borrador-demo',orgId,name:'Elección de prueba · Borrador',purpose:'Ejemplo para configurar y publicar desde Gestión.',status:'BORRADOR',weighting:'IGUALITARIO',sessionSeconds:180,openAt:now+4*86400000,closeAt:now+5*86400000,ballots:[{id:'puesto-demo',name:'Representante',min:1,max:1,options:[candidate('Carmen Solís',6),candidate('Javier Mora',7)]}],roll:demoElectors.map((_,i)=>({electorId:`elector-${i+1}`,weight:1})),rollFrozenCount:demoElectors.length,orderVersion:0}
    ],
    participation:[],
    votes:[],
    acts:[]
  }
}
