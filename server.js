const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const dbFile=process.env.DB_FILE||path.join(__dirname,'data','gold.db');
fs.mkdirSync(path.dirname(dbFile),{recursive:true});
const db=new DatabaseSync(dbFile); db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS observations(source TEXT NOT NULL, published_date TEXT NOT NULL,published_time TEXT NOT NULL, retrieved_at TEXT NOT NULL,goldbar_buy REAL NOT NULL,goldbar_sell REAL NOT NULL, ornament_sell REAL, PRIMARY KEY(source,published_date,published_time));`);
const SOURCE=process.env.THAI_GOLD_API_URL||'https://api.chnwt.dev/thai-gold-api/latest';
let lastError=null,inflight=null;
const number=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)&&n>0?n:null};
async function sync(){if(inflight)return inflight;inflight=(async()=>{try{
const response=await fetch(SOURCE,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Upstream HTTP '+response.status);
const data=await response.json(),x=data.response||data.data||data,bar=x.price?.gold_bar||x.price?.goldBar||{},orn=x.price?.gold||{};
const row={source:SOURCE,published_date:x.update_date,published_time:x.update_time,retrieved_at:new Date().toISOString(),goldbar_buy:number(bar.buy),goldbar_sell:number(bar.sell),ornament_sell:number(orn.sell)};
if(typeof row.published_date!=='string'||!row.published_date.trim()||typeof row.published_time!=='string'||!row.published_time.trim()||row.goldbar_buy===null||row.goldbar_sell===null)throw Error('Missing publication timestamp or valid bar prices');
db.prepare('INSERT INTO observations VALUES (@source,@published_date,@published_time,@retrieved_at,@goldbar_buy,@goldbar_sell,@ornament_sell) ON CONFLICT(source,published_date,published_time) DO UPDATE SET goldbar_buy=excluded.goldbar_buy,goldbar_sell=excluded.goldbar_sell,ornament_sell=excluded.ornament_sell').run(row);
lastError=null;return row;
}catch(e){lastError=e.message;return null}finally{inflight=null}})();return inflight}
const server=http.createServer(async(req,res)=>{const json=(status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value))};
try{const u=new URL(req.url,'http://localhost');if(req.method!=='GET')return json(405,{error:'Method not allowed'});
if(u.pathname==='/api/health')return json(200,{ok:true,source:SOURCE,last_error:lastError});
if(u.pathname==='/api/latest'){const live=await sync(),last=db.prepare('SELECT * FROM observations ORDER BY retrieved_at DESC LIMIT 1').get();return json(200,{ok:!!live,live:live?{...live,update_date:live.published_date,update_time:live.published_time}:null,last:last?{...last,update_date:last.published_date,update_time:last.published_time}:null,error:lastError})}
if(u.pathname==='/api/history'){const days=Number(u.searchParams.get('days')||365);if(!Number.isInteger(days)||days<1||days>3650)return json(400,{error:'days must be an integer between 1 and 3650'});const rows=db.prepare("SELECT *, published_date AS update_date,published_time AS update_time,retrieved_at AS observed_at FROM observations WHERE retrieved_at>=? ORDER BY retrieved_at").all(new Date(Date.now()-days*86400000).toISOString());return json(200,{source:SOURCE,days,rows})}
if(u.pathname==='/api/stats'){const count=db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;return json(200,{count,mae:null,rmse:null,forecast:null,evaluation_status:'not_evaluated',reason:'Prospective collection only. No verified historical series, chronological holdout or trained forecast is available.'})}
if(u.pathname!=='/')return json(404,{error:'Not found'});res.writeHead(200,{'content-type':'text/html; charset=utf-8','x-content-type-options':'nosniff'});fs.createReadStream(path.join(__dirname,'public/index.html')).pipe(res);
}catch(e){json(500,{error:'Internal server error'});console.error(e.message)}});
if(require.main===module){const index=process.argv.indexOf('--port');server.listen(Number(process.env.PORT||(index>=0?process.argv[index+1]:3000)),'0.0.0.0',()=>console.log('GoldSense started'));}
module.exports={server,db,sync};
