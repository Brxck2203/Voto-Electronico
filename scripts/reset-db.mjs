import {createInitialDatabase} from '../server/seed.js'
import {saveDatabase,dbPath} from '../server/store.js'
if(process.argv[2]!=='--confirmar'){
 console.error('ATENCIÓN: este comando reemplaza todos los votos y configuraciones en JSON. Para confirmar: npm run db:reset -- --confirmar')
 process.exit(1)
}
saveDatabase(createInitialDatabase());console.log('Base de demostración recreada:',dbPath)
