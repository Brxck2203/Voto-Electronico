import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApi, ApiError } from './api.js'
import { rootDir } from './store.js'

const handle = createApi()
const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || '8787')
const publicDir = path.join(rootDir, 'dist')
const mimes = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'}
const json = (res,status,body,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',...extra});res.end(JSON.stringify(body))}
const server=http.createServer((req,res)=>{
  const pathname=(req.url||'').split('?')[0]
  if(pathname.startsWith('/api/')){
    if(req.method!=='POST')return json(res,405,{error:'Utilice POST.'})
    const origin=req.headers.origin
    if(origin && !/^http:\/\/(127\.0\.0\.1|localhost):(5173|8787)$/.test(origin))return json(res,403,{error:'Origen no permitido.'})
    let body='',aborted=false
    req.on('data',chunk=>{body+=chunk;if(body.length>100000&&!aborted){aborted=true;json(res,413,{error:'Solicitud demasiado grande.'});req.destroy()}})
    req.on('end',()=>{
      if(aborted)return
      try {
        const payload=body?JSON.parse(body):{}
        const result=handle(decodeURIComponent(pathname.slice(5)),payload,{cookie:req.headers.cookie||'',ip:req.socket.remoteAddress})
        const {__cookie,...content}=result
        json(res,200,content,__cookie?{'Set-Cookie':__cookie}:{})
      } catch(error) {json(res,error instanceof ApiError?error.status:400,{error:error instanceof ApiError?error.message:'No se pudo procesar la solicitud.'});if(!(error instanceof ApiError))console.error('[API]',error)}
    })
    return
  }
  if(req.method!=='GET')return json(res,405,{error:'Método no permitido.'})
  if(!fs.existsSync(publicDir))return json(res,404,{error:'Para desarrollar use npm run dev. Para servir la versión compilada ejecute npm run build antes de npm start.'})
  let rel=decodeURIComponent(pathname)
  if(rel==='/'||!path.extname(rel))rel='/index.html'
  const file=path.resolve(publicDir,'.'+rel)
  if(!file.startsWith(publicDir+path.sep)&&file!==path.join(publicDir,'index.html'))return json(res,403,{error:'Ruta no permitida.'})
  fs.readFile(file,(error,data)=>{if(error){json(res,404,{error:'Archivo no encontrado.'});return}res.writeHead(200,{'Content-Type':mimes[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data)})
})
server.listen(port,host,()=>console.log(`API JSON local: http://${host}:${port} · Datos: data/database.json`))
