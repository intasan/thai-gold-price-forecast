require('dotenv').config();
const express=require('express'), path=require('path'), Database=require('better-sqlite3');
const app=express(), PORT=process.env.PORT||3000;
const db=new Database(process.env.DB_FILE||'data/gold.db');
db.pragma('journal_mode=WAL');
db.exec(`CREATE TABLE IF NOT EXISTS gold_prices(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 source TEXT NOT NULL,
 observed_at TEXT NOT NULL,
 update_date TEXT,
 update_time TEXT,
 goldbar_buy REAL,
 goldbar_sell REAL,
 ornament_buy REAL,
 ornament_sell REAL,
 spot REAL,
 thb REAL,
 change REAL,
 UNIQUE(source,observed_at)
);`);
app.use(express.json()); app.use(express.static(path.join(__dirname,'public')));
const num=v=>v==null?null:Number(String(v).replace(/,/g,'').replace(/[^\d.-]/g,''));
async function fetchLatest(){
 const url=process.env.THAI_GOLD_API_URL||'https://api.chnwt.dev/thai-gold-api/latest';
 const r=await fetch(url,{headers:{'user-agent':'GoldSense-coursework/2.0'}});
 if(!r.ok) throw new Error('Thai Gold API HTTP '+r.status);
 const j=await r.json(), x=j.response||j.data||j, p=x.price||{}, bar=p.gold_bar||p.goldBar||{}, orn=p.gold||{}, observed=new Date().toISOString();
 return {source:'thai-gold-api / goldtraders.or.th',observed_at:observed,update_date:x.update_date||null,update_time:x.update_time||null,goldbar_buy:num(bar.buy),goldbar_sell:num(bar.sell),ornament_buy:num(orn.buy),ornament_sell:num(orn.sell),spot:num(x.spot),thb:num(x.thb),change:num(x.change)};
}
function save(row){db.prepare(`INSERT OR IGNORE INTO gold_prices (source,observed_at,update_date,update_time,goldbar_buy,goldbar_sell,ornament_buy,ornament_sell,spot,thb,change) VALUES (@source,@observed_at,@update_date,@update_time,@goldbar_buy,@goldbar_sell,@ornament_buy,@ornament_sell,@spot,@thb,@change)`).run(row);}
async function sync(){try{const row=await fetchLatest();save(row);return row}catch(e){console.error('[sync]',e.message);return null}}
app.get('/api/latest',async(req,res)=>{try{const row=await sync();const dbrow=db.prepare('SELECT * FROM gold_prices ORDER BY id DESC LIMIT 1').get();res.json({ok:!!row,live:row||null,last:dbrow||null})}catch(e){res.status(502).json({ok:false,error:e.message})}});
app.get('/api/history',(req,res)=>{const days=Math.min(Math.max(Number(req.query.days||365),1),3650);const rows=db.prepare(`SELECT * FROM gold_prices WHERE datetime(observed_at)>=datetime('now',?) ORDER BY observed_at ASC`).all(`-${days} days`);res.json({source:'Thai Gold API / Gold Traders Association',days,rows});});
app.get('/api/stats',(req,res)=>{const rows=db.prepare(`SELECT goldbar_sell FROM gold_prices WHERE goldbar_sell IS NOT NULL ORDER BY observed_at ASC`).all();if(rows.length<2)return res.json({count:rows.length,mae:null,rmse:null,forecast:null});const vals=rows.map(r=>r.goldbar_sell),n=vals.length,xs=vals.map((_,i)=>i),mx=(n-1)/2,my=vals.reduce((a,b)=>a+b,0)/n;let a=0,b=0;for(let i=0;i<n;i++){a+=(xs[i]-mx)*(vals[i]-my);b+=(xs[i]-mx)**2}const slope=b?a/b:0,intercept=my-slope*mx,pred=vals.map((_,i)=>intercept+slope*i);let ae=0,se=0;for(let i=0;i<n;i++){const e=vals[i]-pred[i];ae+=Math.abs(e);se+=e*e}res.json({count:n,mae:ae/n,rmse:Math.sqrt(se/n),forecast:intercept+slope*n,slope});});
app.get('/api/health',(q,s)=>s.json({ok:true,time:new Date().toISOString()}));
app.listen(PORT,()=>{console.log(`GoldSense running http://localhost:${PORT}`);sync();setInterval(sync,60000)});
