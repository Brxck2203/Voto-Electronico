import { spawn } from 'node:child_process'
const children=[]
const start=(name,args)=>{const p=spawn(process.execPath,args,{stdio:'inherit',env:process.env,windowsHide:false});children.push(p);p.on('error',e=>console.error(name,e.message));p.on('exit',code=>{if(code&&!stopping){console.error(`${name} terminó con código ${code}.`);stop()}})}
let stopping=false
function stop(){if(stopping)return;stopping=true;for(const p of children)if(p.exitCode===null) p.kill()}
process.on('SIGINT',stop);process.on('SIGTERM',stop)
start('Servidor JSON',['server/index.js'])
start('Vite',['node_modules/vite/bin/vite.js','--host','127.0.0.1'])
