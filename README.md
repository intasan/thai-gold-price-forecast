# GoldSense — Thai Gold Collection Dashboard

ระบบที่รันได้จริงด้วย Node.js 24 + SQLite ดึงข้อมูลจาก Thai Gold API และเก็บ publication โดยไม่เพิ่มระเบียนซ้ำจากการ refresh

```sh
npm start
```

เปิด http://localhost:3000 แล้วเลือกอัปเดต ต้องเข้าถึง endpoint จริงได้ กรณี upstream ขัดข้องจะแสดงข้อมูลเก่าหรือยังไม่มีข้อมูล ไม่เติมค่าจำลอง

## หลักฐานรอบนี้

- [ภาพ Dashboard จริง](evidence/dashboard-actual.jpg)
- [HTTP + SQL verification](evidence/live-verification.txt)
- [Requirement, Data Flow, Data Model และข้อจำกัด](docs/VERIFIED_SCOPE.md)

มีข้อมูลจริง 1 publication ในรอบนี้ ยังไม่มีประวัติที่เพียงพอหรือ chronological holdout จึงไม่แสดง forecast, MAE หรือ RMSE ไม่ถือเป็นระบบพยากรณ์ที่ผ่านการประเมิน

`DB_FILE` เปลี่ยนที่จัดเก็บได้ ค่าเริ่มต้น `data/gold.db`; ใช้ตาราง `observations` ใหม่ ข้อมูล legacy ไม่ถูกลบอัตโนมัติ ไฟล์ ZIP และเอกสารวิเคราะห์เดิมเป็น historical reference ไม่ใช่ baseline runtime ปัจจุบัน
