import { randomBytes, randomUUID } from 'node:crypto'
import { cleanCedula, checkPassword, loadDatabase, saveDatabase, sha } from './store.js'

class ApiError extends Error { constructor(message, status=400){super(message);this.status=status} }
const reject=(msg,code=400)=>{throw new ApiError(msg,code)}
const adminSessions = new Map(), voterSessions=new Map(), failedAttempts=new Map()
const safeId=(s)=>typeof s==='string' && /^[A-Za-z0-9_-]{1,100}$/.test(s)
const electionOf=(db,id)=>{
  if(!safeId(id)) reject('Identificador de elección inválido.')
  const e=db.elections.find(x=>x.id===id); if(!e)reject('Elección no encontrada.',404); return e
}
const phase=(e,now=Date.now())=>e.status==='FINALIZADO' || (e.status==='PUBLICADO' && now>=e.closeAt)?'CERRADO':e.status==='BORRADOR'?'BORRADOR':now<e.openAt?'PROGRAMADO':'ABIERTO'
const active=e=>e.status==='PUBLICADO' && Date.now()>=e.openAt && Date.now()<e.closeAt
const safeBallots=e=>(e.ballots||[]).map(b=>({id:b.id,name:b.name,min:b.min,max:b.max,options:b.options.map(o=>({id:o.id,nombre:o.nombre,agrupacion:o.agrupacion,propuesta:o.propuesta}))}))
const electionSummary=(e)=>({id:e.id,name:e.name,purpose:e.purpose,phase:phase(e)})
const adminFor=(db,token)=>{const t=adminSessions.get(token);if(!t||t.expiresAt<=Date.now()){adminSessions.delete(token);reject('Acceso de gestión no autorizado. Inicie sesión.',401)}const admin=db.admins.find(x=>x.id===t.adminId);if(!admin)reject('Cuenta administrativa no válida.',401);return admin}
const privateElection=(db,admin,id)=>{const e=electionOf(db,id);if(e.orgId!==admin.orgId)reject('Esta elección no pertenece a la organización.',403);return e}
const ballotRules=ballots=>Array.isArray(ballots)&&ballots.length>0&&ballots.length<=20&&new Set(ballots.map(b=>b.id)).size===ballots.length&&ballots.every(b=>safeId(b.id)&&typeof b.name==='string'&&b.name.trim()&&Array.isArray(b.options)&&b.options.length>0&&b.options.length<=60&&Number.isInteger(b.min)&&Number.isInteger(b.max)&&b.min>=0&&b.max>=1&&b.min<=b.max&&b.max<=b.options.length&&new Set(b.options.map(o=>o.id)).size===b.options.length&&b.options.every(o=>safeId(o.id)&&typeof o.nombre==='string'&&o.nombre.trim()))
const ensureAdminChange=(e)=>{if(e.status==='FINALIZADO'||(e.status==='PUBLICADO'&&Date.now()>=e.openAt))reject('CONFIGURACION_BLOQUEADA: la jornada ya comenzó.',409)}
const round2=n=>Math.round(n*100)/100
function finalizeIfClosed(db,e){
  if(e.status==='FINALIZADO')return db.acts.find(a=>a.electionId===e.id)
  if(e.status!=='PUBLICADO'||Date.now()<e.closeAt)reject('RESULTADOS_NO_DISPONIBLES: espere el cierre.',403)
  const parts=db.participation.filter(p=>p.electionId===e.id)
  const ballots=e.ballots.map(b=>{
    const records=db.votes.filter(v=>v.electionId===e.id&&v.ballotId===b.id)
    const rows=b.options.map(o=>({id:o.id,name:o.nombre,votes:records.filter(v=>v.choices.includes(o.id)).length,weight:round2(records.filter(v=>v.choices.includes(o.id)).reduce((sum,v)=>sum+v.weight,0))})).sort((a,b)=>b.weight-a.weight)
    const totalWeight=rows.reduce((s,r)=>s+r.weight,0)
    return {id:b.id,name:b.name,totalVotes:records.length,rows:rows.map(r=>({...r,percentage:totalWeight?round2(r.weight/totalWeight*100):0})),blank:records.filter(v=>!v.choices.length).length}
  })
  const eligible=e.rollFrozenCount ?? e.roll.length,participation=parts.length
  const alerts=ballots.filter(b=>b.totalVotes!==participation).map(b=>`${b.name}: ${b.totalVotes} papeletas frente a ${participation} participaciones`)
  const act={electionId:e.id,name:e.name,status:'FINALIZADO',eligible,participation,abstentions:eligible-participation,participationPercentage:eligible?round2(participation/eligible*100):0,abstentionPercentage:eligible?round2((eligible-participation)/eligible*100):0,ballots,totalBlank:ballots.reduce((s,b)=>s+b.blank,0),weighting:e.weighting,reconciliation:{valid:!alerts.length,alerts},generatedAt:Date.now()}
  db.acts.push(act); e.status='FINALIZADO';saveDatabase(db);return act
}
function voterStart(db,payload,ip){
  const id=payload.electionId, cedula=cleanCedula(payload.cedula), code=String(payload.credential||'').trim().toUpperCase()
  if(!/^\d{9,12}$/.test(cedula)||! /^[A-Z0-9]{12,64}$/.test(code))reject('Cédula o código electoral inválidos.')
  const key=ip||'local',now=Date.now(), recent=(failedAttempts.get(key)||[]).filter(ts=>now-ts<60000)
  if(recent.length>=12)reject('Demasiados intentos. Espere un minuto.',429)
  const generic=()=>{failedAttempts.set(key,[...recent,now]);reject('Cédula o código electoral incorrectos.',403)}
  const e=electionOf(db,id);if(!active(e))reject('La jornada no está abierta.',403)
  const user=db.electors.find(u=>u.cedulaHash===sha(cedula)&&u.orgId===e.orgId)
  if(!user||user.codeHash!==sha(code)||!e.roll.some(r=>r.electorId===user.id))generic()
  if(db.participation.some(p=>p.electionId===id&&p.electorId===user.id))reject('YA_EMITIDO: esta persona ya votó.',409)
  failedAttempts.delete(key)
  const token=randomBytes(32).toString('hex'),expiresAt=Math.min(Date.now()+e.sessionSeconds*1000,e.closeAt)
  voterSessions.set(sha(token),{electionId:id,electorId:user.id,expiresAt})
  return {token,expiresAt}
}
function voterCast(db,payload){
  const {electionId,sessionToken,selections}=payload
  if(!safeId(electionId)||typeof sessionToken!=='string'||! /^[0-9a-f]{64}$/.test(sessionToken))reject('Sesión inválida.',401)
  const t=voterSessions.get(sha(sessionToken));if(!t||t.electionId!==electionId||t.expiresAt<=Date.now())reject('SESION_VENCIDA.',401)
  const e=electionOf(db,electionId);if(!active(e))reject('FUERA_DE_PERIODO.',403)
  if(!e.roll.some(r=>r.electorId===t.electorId))reject('NO_HABILITADO.',403)
  if(db.participation.some(p=>p.electionId===electionId&&p.electorId===t.electorId))reject('YA_EMITIDO.',409)
  if(!selections||typeof selections!=='object'||Array.isArray(selections)||Object.keys(selections).length!==e.ballots.length)reject('Faltan papeletas.')
  const roll=e.roll.find(r=>r.electorId===t.electorId),weight=e.weighting==='PONDERADO'?Number(roll.weight):1
  if(!Number.isFinite(weight)||weight<=0)reject('Ponderación inválida.')
  for(const b of e.ballots){const selected=selections[b.id];if(!Array.isArray(selected)||selected.length<b.min||selected.length>b.max||new Set(selected).size!==selected.length||selected.some(id=>!b.options.some(o=>o.id===id)))reject(`Papeleta inválida: ${b.name}`)}
  // Un único proceso Node maneja todas las peticiones sin await en esta región crítica.
  // La escritura atómica al JSON guarda participación + todas las papeletas juntas.
  db.participation.push({electionId,electorId:t.electorId,status:'EMITIDO'})
  for(const b of e.ballots)db.votes.push({id:randomUUID(),electionId,ballotId:b.id,choices:[...selections[b.id]],weight})
  saveDatabase(db);voterSessions.delete(sha(sessionToken))
  return {status:'VOTO_REGISTRADO',electionId}
}
export function createApi({database=loadDatabase}={}){
  // peticiones POST del mismo origen; la cookie del tribunal no se expone a JavaScript.
  return function handle(name,payload={},context={}){
    const db=database(),cookie=context.cookie||'',adminToken=/(?:^|;\s*)voto_admin=([a-f0-9]{64})/.exec(cookie)?.[1]
    if(name==='health')return {status:'ok',mode:'json-local'}
    if(name==='listPublicElections')return {elections:db.elections.filter(e=>['PUBLICADO','FINALIZADO'].includes(e.status)).map(electionSummary)}
    if(name==='getPublicElection') {const e=electionOf(db,payload.electionId);if(!['PUBLICADO','FINALIZADO'].includes(e.status))reject('Elección no publicada.',403);return {id:e.id,name:e.name,purpose:e.purpose,phase:phase(e),openAt:e.openAt,closeAt:e.closeAt,ballots:safeBallots(e)}}
    if(name==='startCedulaVoting')return voterStart(db,payload,context.ip)
    if(name==='castCedulaVote')return voterCast(db,payload)
    if(name==='getPublicResults')return finalizeIfClosed(db,electionOf(db,payload.electionId))
    if(name==='adminLogin'){
      const email=String(payload.email||'').trim().toLowerCase(),admin=db.admins.find(a=>a.email.toLowerCase()===email)
      if(!admin||!checkPassword(payload.password||'',admin.passwordHash))reject('Correo o contraseña incorrectos.',401)
      const token=randomBytes(32).toString('hex');adminSessions.set(token,{adminId:admin.id,expiresAt:Date.now()+6*3600000})
      return {user:{uid:admin.id,displayName:admin.name,role:'tribunal'},__cookie:`voto_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=21600`}
    }
    if(name==='adminLogout') {if(adminToken)adminSessions.delete(adminToken);return {ok:true,__cookie:'voto_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}}
    if(name==='adminSession'){try{const a=adminFor(db,adminToken);return {uid:a.id,displayName:a.name,role:'tribunal'}}catch{return {user:null}}}
    const admin=adminFor(db,adminToken)
    const own=db.elections.filter(e=>e.orgId===admin.orgId)
    if(name==='getPortal')return {user:{uid:admin.id,displayName:admin.name,role:'tribunal',organization:db.organizations.find(o=>o.id===admin.orgId)?.name||admin.orgId},elections:own.map(electionSummary)}
    if(name==='getElection'){const e=privateElection(db,admin,payload.electionId);return {id:e.id,name:e.name,purpose:e.purpose,status:e.status,phase:phase(e),openAt:e.openAt,closeAt:e.closeAt,ballots:safeBallots(e),isAdmin:true,sessionSeconds:e.sessionSeconds,weighting:e.weighting}}
    if(name==='getParticipation'){const e=privateElection(db,admin,payload.electionId),eligible=e.roll.length,emitted=db.participation.filter(p=>p.electionId===e.id).length;return {eligible,emitted,pending:eligible-emitted}}
    if(name==='getResults')return finalizeIfClosed(db,privateElection(db,admin,payload.electionId))
    if(name==='adminCreateElection'){
      if(!String(payload.name||'').trim()||!String(payload.purpose||'').trim())reject('Nombre y propósito obligatorios.')
      const electionId='e-'+randomUUID();db.elections.push({id:electionId,orgId:admin.orgId,name:payload.name.trim(),purpose:payload.purpose.trim(),status:'BORRADOR',sessionSeconds:180,weighting:'IGUALITARIO',openAt:Date.now()+86400000,closeAt:Date.now()+2*86400000,ballots:[],roll:db.electors.filter(u=>u.orgId===admin.orgId).map(u=>({electorId:u.id,weight:1})),rollFrozenCount:null,orderVersion:0});saveDatabase(db);return {electionId}
    }
    if(name==='adminConfigureElection'){
      const e=privateElection(db,admin,payload.electionId);ensureAdminChange(e)
      const openAt=Number(payload.openAt),closeAt=Number(payload.closeAt),sessionSeconds=Number(payload.sessionSeconds)
      if(!String(payload.name||'').trim()||!String(payload.purpose||'').trim()||!Number.isFinite(openAt)||openAt<=Date.now()||!Number.isFinite(closeAt)||closeAt<=openAt||!Number.isInteger(sessionSeconds)||sessionSeconds<=0||!['IGUALITARIO','PONDERADO'].includes(payload.weighting)||!ballotRules(payload.ballots))reject('Configuración incompleta o no válida.')
      Object.assign(e,{name:payload.name.trim(),purpose:payload.purpose.trim(),openAt,closeAt,sessionSeconds,weighting:payload.weighting,ballots:structuredClone(payload.ballots),status:'BORRADOR',rollFrozenCount:null});saveDatabase(db);return {status:'BORRADOR'}
    }
    if(name==='adminPublish'){
      const e=privateElection(db,admin,payload.electionId);ensureAdminChange(e)
      if(e.status!=='BORRADOR'||!ballotRules(e.ballots)||!e.roll.length||e.openAt<=Date.now()||e.closeAt<=e.openAt)reject('La elección aún no puede publicarse. Revise fecha, padrón y opciones.')
      for(const b of e.ballots){ // Orden pseudoaleatorio antes de publicar, fijado para todos.
        for(let j=b.options.length-1;j>0;j--){const k=randomBytes(4).readUInt32BE()% (j+1);[b.options[j],b.options[k]]=[b.options[k],b.options[j]]}
      }
      e.status='PUBLICADO';e.rollFrozenCount=e.roll.length;e.orderVersion=(e.orderVersion||0)+1;saveDatabase(db);return {status:'PUBLICADO'}
    }
    reject('Operación no reconocida.',404)
  }
}
export { ApiError }
