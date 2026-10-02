# GoldSense — Thai Gold 96.5%

ระบบเว็บสำหรับวิเคราะห์ราคาทองคำไทย 96.5% สำหรับงานเรียน โดยเชื่อมข้อมูลราคาล่าสุด เก็บข้อมูลด้วย SQLite แสดงกราฟย้อนหลัง และมี Linear Regression baseline สำหรับการพยากรณ์

## Features
- ราคาทองแท่ง 96.5% รับซื้อ / ขายออก
- ราคาทองรูปพรรณ
- Auto refresh ทุก 60 วินาที
- SQLite database
- Historical chart 30 วัน / 3 เดือน / 6 เดือน / 1 ปี
- Linear Regression baseline
- MAE / RMSE
- Responsive dashboard

## Tech Stack
Node.js, Express.js, SQLite (better-sqlite3), HTML, CSS, JavaScript, Chart.js

## Data Source
Thai Gold API ซึ่งดึงข้อมูลราคาทองจาก goldtraders.or.th / สมาคมค้าทองคำ

## Run
```bash
npm install
npm start
```
เปิด `http://localhost:3000`

> หมายเหตุ: ข้อมูลย้อนหลัง 1 ปีจะสะสมตั้งแต่เริ่มระบบ หากต้องการชุดข้อมูลย้อนหลังเต็มช่วง ต้องนำข้อมูล historical dataset มาเติมเพิ่มเติมก่อนประเมินโมเดล
