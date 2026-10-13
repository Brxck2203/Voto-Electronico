import {loadDatabase} from '../server/store.js'
import {demoElectors,demoAdmin} from '../server/seed.js'
const db=loadDatabase()
console.log(`JSON: ${db.organizations.length} organización(es), ${db.elections.length} elecciones, ${db.electors.length} votantes, ${db.participation.length} participaciones, ${db.votes.length} papeletas`)
console.log('GESTIÓN DE PRUEBA:', demoAdmin.email, '(contraseña en docs/CUENTAS_DEMO.md)')
console.log('VOTANTES FICTICIOS (no usar datos reales):')
for(const [cedula,name,code] of demoElectors)console.log(`${cedula} | ${name} | ${code}`)
