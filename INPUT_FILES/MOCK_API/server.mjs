import http from 'node:http';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../DATA/transactions.json', import.meta.url),'utf8'));
const PORT = Number(process.env.PORT || 4177);
const statuses = ['Completed','Pending','Refunded','Processing'];
const reply = (res,code,obj) => {res.writeHead(code,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,OPTIONS'});res.end(JSON.stringify(obj));};
http.createServer((req,res)=>{
 const url = new URL(req.url, 'http://localhost');
 if(req.method==='OPTIONS') return reply(res,204,{});
 if(req.method!=='GET') return reply(res,405,{error:'Method not allowed'});
 if(url.pathname==='/health') return reply(res,200,{status:'ok',service:'jyoti-sales-api'});
 if(url.pathname==='/api/stats') return reply(res,200,{totalSales:data.filter(x=>x.status==='Completed').reduce((s,x)=>s+x.amount,0),activeOrders:data.filter(x=>['Pending','Processing'].includes(x.status)).length,transactionCount:data.length,currency:'INR'});
 if(url.pathname==='/api/transactions') {
   const status=url.searchParams.get('status')||'All'; const q=(url.searchParams.get('q')||'').toLowerCase().trim();
   if(status!=='All'&&!statuses.includes(status))return reply(res,400,{error:'Invalid status filter'});
   const rows=data.filter(x=>(status==='All'||x.status===status)&&(!q||[x.transactionId,x.customer,x.product].some(t=>t.toLowerCase().includes(q))));
   return reply(res,200,{total:rows.length,transactions:rows});
 }
 if(url.pathname==='/api/fail')return reply(res,503,{error:'Temporary upstream error'});
 reply(res,404,{error:'Route not found'});
}).listen(PORT, '0.0.0.0', () => console.log('API listening on ' + PORT));
