import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
const port=4497; const proc=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port)},stdio:'ignore'});
try{
 let ok=false; for(let i=0;i<30;i++){try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok){ok=true;break}}catch{}await sleep(50)}
 if(!ok)throw Error('server did not start');
 const base=`http://127.0.0.1:${port}`;
 const stats=await (await fetch(base+'/api/stats')).json();if(stats.transactionCount!==60||stats.totalSales<=0)throw Error('stats invalid');
 const tx=await (await fetch(base+'/api/transactions?status=Completed')).json();if(tx.total<1||tx.transactions.some(x=>x.status!=='Completed'))throw Error('filter failed');
 const missing=await fetch(base+'/api/transactions?status=bad');if(missing.status!==400)throw Error('validation failed');
 const failure=await fetch(base+'/api/fail');if(failure.status!==503)throw Error('failure endpoint');
 console.log('PASS health, stats, transaction status filter, invalid filter, failed API (5 checks)');
}finally{proc.kill();}
