# คู่มือการตั้งค่า AppSheet สำหรับระบบประเมินไม้สด
# Fresh Wood Assessment System for Production

## ภาพรวมระบบ (System Overview)

ระบบประเมินไม้สดสำหรับการผลิต ประกอบด้วย 7 ตาราง:

| ตาราง | คำอธิบาย | จำนวนข้อมูลตัวอย่าง |
|-------|----------|---------------------|
| Wood_Inventory | รายการไม้สดในคลัง | 10 รายการ |
| Wood_Assessment | การประเมินคุณภาพไม้ | 8 รายการ |
| Production_Batches | ชุดการผลิต | 10 รายการ |
| Assessment_Criteria | เกณฑ์การประเมิน | 8 รายการ |
| Wood_Types | ประเภทไม้ | 10 ประเภท |
| Suppliers | ซัพพลายเออร์ | 10 ราย |
| Users | ผู้ใช้งาน | 12 คน |

---

## ขั้นตอนที่ 1: สร้าง Google Sheets

### 1.1 อัปโหลด CSV ไปยัง Google Drive
1. ไปที่ [Google Drive](https://drive.google.com)
2. สร้างโฟลเดอร์ใหม่ชื่อ `Wood_Assessment_App`
3. อัปโหลดไฟล์ CSV ทั้งหมดจากโฟลเดอร์ `appsheet/`:
   - Wood_Inventory.csv
   - Wood_Assessment.csv
   - Production_Batches.csv
   - Assessment_Criteria.csv
   - Wood_Types.csv
   - Suppliers.csv
   - Users.csv

### 1.2 แปลง CSV เป็น Google Sheets
1. เปิดแต่ละไฟล์ CSV ใน Google Drive
2. ไปที่ **File → Save as Google Sheets**
3. ทำซ้ำสำหรับทุกไฟล์

### 1.3 รวมเป็น Spreadsheet เดียว (แนะนำ)
1. สร้าง Google Sheets ใหม่ชื่อ `Wood_Assessment_Database`
2. สร้าง Sheet ย่อยสำหรับแต่ละตาราง:
   - Sheet 1: Wood_Inventory
   - Sheet 2: Wood_Assessment
   - Sheet 3: Production_Batches
   - Sheet 4: Assessment_Criteria
   - Sheet 5: Wood_Types
   - Sheet 6: Suppliers
   - Sheet 7: Users
3. Copy/Paste ข้อมูลจากแต่ละ CSV ไปยัง Sheet ที่สร้าง

---

## ขั้นตอนที่ 2: สร้างแอป AppSheet

### 2.1 เข้าสู่ AppSheet
1. ไปที่ [appsheet.com](https://www.appsheet.com)
2. ลงชื่อเข้าใช้ด้วย Google Account
3. คลิก **Create** → **App** → **Start with existing data**

### 2.2 เชื่อมต่อข้อมูล
1. เลือก **Google Sheets** เป็นแหล่งข้อมูล
2. เลือกไฟล์ `Wood_Assessment_Database`
3. เลือก Sheet `Wood_Inventory` เป็นตารางหลัก
4. คลิก **Create App**

### 2.3 เพิ่มตารางที่เหลือ
1. ไปที่ **Data** → **Tables** → **Add Table**
2. เลือก **Google Sheets** และเพิ่มทีละ Sheet:
   - Wood_Assessment
   - Production_Batches
   - Assessment_Criteria
   - Wood_Types
   - Suppliers
   - Users

---

## ขั้นตอนที่ 3: ตั้งค่าคอลัมน์ (Column Settings)

### 3.1 Wood_Inventory
| คอลัมน์ | Type | Key | Required | Notes |
|---------|------|-----|----------|-------|
| Wood_ID | Text | ✓ | ✓ | Primary Key |
| Wood_Type | Enum | | ✓ | ไม้สดท่อน, ไม้สดแปรรูป, ไม้สดแผ่น |
| Wood_Species | Ref | | ✓ | → Wood_Types[Type_Name_TH] |
| Received_Date | Date | | ✓ | |
| Quantity_Pcs | Number | | ✓ | |
| Total_Volume_M3 | Decimal | | | |
| Unit_Price_THB | Price | | | |
| Total_Cost_THB | Price | | | Formula: [Quantity_Pcs]*[Unit_Price_THB] |
| Storage_Location | Text | | | |
| Moisture_Content_Pct | Percent | | | |
| Status | Enum | | ✓ | พร้อมประเมิน, กำลังประเมิน, ประเมินแล้ว, พร้อมผลิต |
| Supplier_Name | Ref | | | → Suppliers[Supplier_Name] |
| Photo_URL | Image | | | |

### 3.2 Wood_Assessment
| คอลัมน์ | Type | Key | Required | Notes |
|---------|------|-----|----------|-------|
| Assessment_ID | Text | ✓ | ✓ | Primary Key |
| Wood_ID | Ref | | ✓ | → Wood_Inventory[Wood_ID] |
| Assessment_Date | Date | | ✓ | Initial: TODAY() |
| Assessor_Name | Ref | | ✓ | → Users[Full_Name] |
| Moisture_Content_Pct | Percent | | | |
| Density_KgM3 | Number | | | |
| Grain_Pattern | Enum | | | เส้นตรง, เส้นหยัก, เส้นสลับ |
| Color_Grade | Enum | | | A+, A, B, C |
| Defect_Count | Number | | | |
| Straightness_Score | Number | | | 1-10 |
| Surface_Quality_Score | Number | | | 1-10 |
| Hardness_Score | Number | | | 1-10 |
| Overall_Grade | Enum | | | A, A-, B+, B, B-, C+, C |
| Recommended_Use | Text | | | |
| Assessment_Status | Enum | | | รอประเมิน, กำลังประเมิน, เสร็จสิ้น |
| Approval_Status | Enum | | | รอประเมิน, รออนุมัติ, อนุมัติ, ไม่อนุมัติ |
| Approver_Name | Ref | | | → Users[Full_Name] |

### 3.3 Production_Batches
| คอลัมน์ | Type | Key | Required | Notes |
|---------|------|-----|----------|-------|
| Batch_ID | Text | ✓ | ✓ | Primary Key |
| Wood_ID | Ref | | ✓ | → Wood_Inventory[Wood_ID] |
| Assessment_ID | Ref | | | → Wood_Assessment[Assessment_ID] |
| Production_Order | Text | | ✓ | |
| Product_Type | Enum | | ✓ | เฟอร์นิเจอร์, ก่อสร้าง, ตกแต่ง, บรรจุภัณฑ์, พาเลท |
| Product_Name | Text | | ✓ | |
| Target_Quantity | Number | | ✓ | |
| Completed_Quantity | Number | | | |
| Start_Date | Date | | | |
| Target_End_Date | Date | | | |
| Operator_Name | Ref | | | → Users[Full_Name] |
| Status | Enum | | ✓ | วางแผน, รอวัตถุดิบ, รอประเมิน, กำลังผลิต, เสร็จสิ้น |
| Quality_Pass_Pct | Percent | | | |
| Waste_Pct | Percent | | | |

---

## ขั้นตอนที่ 4: สร้าง Views

### 4.1 Dashboard View
1. ไปที่ **UX** → **Views** → **New View**
2. ตั้งชื่อ: `Dashboard`
3. View type: **Dashboard**
4. เพิ่ม Views ย่อย:
   - สรุปสต็อกไม้ (Chart)
   - รายการรอประเมิน (Table)
   - สถานะการผลิต (Chart)

### 4.2 Wood Inventory View
1. View type: **Card**
2. Display: Wood_ID, Wood_Species, Status
3. Sort by: Received_Date (Descending)
4. Group by: Status

### 4.3 Assessment Form View
1. View type: **Form**
2. For Table: Wood_Assessment
3. ตั้งค่า Auto-generated fields:
   - Assessment_ID: UNIQUEID()
   - Assessment_Date: TODAY()
   - Assessor_Name: USEREMAIL()

### 4.4 Production View
1. View type: **Deck**
2. Display: Batch_ID, Product_Name, Status
3. Color by: Status

---

## ขั้นตอนที่ 5: ตั้งค่า Actions

### 5.1 เริ่มประเมินไม้
```
Action Name: Start Assessment
For Table: Wood_Inventory
Action Type: Data: set the values of some columns
Set Columns:
  - Status = "กำลังประเมิน"
Condition: [Status] = "พร้อมประเมิน"
```

### 5.2 อนุมัติการประเมิน
```
Action Name: Approve Assessment
For Table: Wood_Assessment
Action Type: Data: set the values of some columns
Set Columns:
  - Approval_Status = "อนุมัติ"
  - Approval_Date = TODAY()
  - Approver_Name = USEREMAIL()
Condition: [Approval_Status] = "รออนุมัติ"
Only if: User Role = Manager/Director
```

### 5.3 เริ่มการผลิต
```
Action Name: Start Production
For Table: Production_Batches
Action Type: Data: set the values of some columns
Set Columns:
  - Status = "กำลังผลิต"
  - Start_Date = TODAY()
Condition: AND([Status] = "รอวัตถุดิบ", ISNOTBLANK([Assessment_ID]))
```

### 5.4 เสร็จสิ้นการผลิต
```
Action Name: Complete Production
For Table: Production_Batches
Action Type: Data: set the values of some columns
Set Columns:
  - Status = "เสร็จสิ้น"
  - Actual_End_Date = TODAY()
Condition: [Status] = "กำลังผลิต"
```

---

## ขั้นตอนที่ 6: ตั้งค่า Workflows (Automation)

### 6.1 แจ้งเตือนเมื่อมีไม้ใหม่เข้าคลัง
```
Event: Adds only
Table: Wood_Inventory
Action: Send notification
To: ผู้ประเมิน
Subject: "ไม้ใหม่เข้าคลัง: [Wood_ID]"
Body: "มีไม้ [Wood_Species] จำนวน [Quantity_Pcs] ชิ้น เข้าคลังวันที่ [Received_Date] กรุณาทำการประเมิน"
```

### 6.2 แจ้งเตือนเมื่อประเมินเสร็จ
```
Event: Updates only
Table: Wood_Assessment
Condition: [_THISROW_BEFORE].[Assessment_Status] <> "เสร็จสิ้น" AND [Assessment_Status] = "เสร็จสิ้น"
Action: Send notification
To: ผู้จัดการ
Subject: "การประเมินเสร็จสิ้น: [Assessment_ID]"
Body: "ไม้ [Wood_ID] ได้รับเกรด [Overall_Grade] แนะนำใช้สำหรับ [Recommended_Use]"
```

### 6.3 แจ้งเตือนเมื่อการผลิตเสร็จ
```
Event: Updates only
Table: Production_Batches
Condition: [_THISROW_BEFORE].[Status] <> "เสร็จสิ้น" AND [Status] = "เสร็จสิ้น"
Action: Send notification
To: ผู้จัดการ
Subject: "การผลิตเสร็จสิ้น: [Batch_ID]"
Body: "สินค้า [Product_Name] จำนวน [Completed_Quantity] [Unit] ผลิตเสร็จแล้ว คุณภาพผ่าน [Quality_Pass_Pct]%"
```

---

## ขั้นตอนที่ 7: ตั้งค่าความปลอดภัย

### 7.1 Security Filters
```yaml
# Wood_Inventory - ทุกคนดูได้
Security Filter: TRUE

# Wood_Assessment - เฉพาะผู้ประเมินและผู้จัดการ
Security Filter:
  OR(
    USEREMAIL() = [Assessor_Name].[Email],
    LOOKUP(USEREMAIL(), "Users", "Email", "Role") IN LIST("ผู้จัดการ", "ผู้อำนวยการ")
  )

# Production_Batches - เฉพาะช่างและผู้จัดการ
Security Filter:
  OR(
    USEREMAIL() = [Operator_Name].[Email],
    LOOKUP(USEREMAIL(), "Users", "Email", "Can_Produce")
  )
```

### 7.2 User Roles
1. ไปที่ **Security** → **Users**
2. เพิ่ม User จาก Users sheet
3. กำหนด Role:
   - **Admin**: วิชัย ผู้จัดการ, สมศักดิ์ ผอ.
   - **Assessor**: สมชาย, สมหญิง, วิภา
   - **Operator**: อนุชา, สมศักดิ์ ช่าง, วินัย, มานะ, ศรีนวล
   - **Viewer**: จิตรา, ประยุทธ์

---

## ขั้นตอนที่ 8: สูตรคำนวณที่ใช้บ่อย

### 8.1 คำนวณคะแนนรวม (Overall Score)
```
=AVERAGE(
  [Straightness_Score],
  [Surface_Quality_Score],
  [Hardness_Score]
) * (10 - MIN([Defect_Count], 10)) / 10
```

### 8.2 กำหนดเกรดอัตโนมัติ
```
=IFS(
  [Overall_Score] >= 8.5, "A",
  [Overall_Score] >= 7.5, "A-",
  [Overall_Score] >= 7.0, "B+",
  [Overall_Score] >= 6.0, "B",
  [Overall_Score] >= 5.0, "B-",
  [Overall_Score] >= 4.0, "C+",
  TRUE, "C"
)
```

### 8.3 คำนวณกำไร
```
=[Selling_Price_THB] - [Total_Cost_THB]
```

### 8.4 คำนวณอัตราความสำเร็จการผลิต
```
=[Completed_Quantity] / [Target_Quantity] * 100
```

---

## ขั้นตอนที่ 9: Deploy แอป

### 9.1 ทดสอบแอป
1. คลิก **Preview** ที่มุมขวาบน
2. ทดสอบทุก View และ Action
3. ตรวจสอบ Workflows

### 9.2 Deploy
1. ไปที่ **Deploy** → **Deployment Check**
2. แก้ไข Issues ทั้งหมด
3. คลิก **Move app to deployed state**

### 9.3 แชร์แอป
1. ไปที่ **Users** → **Add users**
2. เพิ่ม Email ของผู้ใช้
3. กำหนด Role ให้แต่ละคน

---

## การใช้งานบนมือถือ

### Android
1. ดาวน์โหลด AppSheet จาก Google Play Store
2. ลงชื่อเข้าใช้ด้วย Google Account
3. แอปจะแสดงขึ้นมาอัตโนมัติ

### iOS
1. ดาวน์โหลด AppSheet จาก App Store
2. ลงชื่อเข้าใช้ด้วย Google Account
3. แอปจะแสดงขึ้นมาอัตโนมัติ

---

## โครงสร้างความสัมพันธ์ (ER Diagram)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Suppliers     │────→│  Wood_Inventory  │←────│    Wood_Types    │
└─────────────────┘     └────────┬─────────┘     └──────────────────┘
                                 │
                                 ↓
                        ┌────────────────────┐
                        │  Wood_Assessment   │←──── Assessment_Criteria
                        └────────┬───────────┘
                                 │
                                 ↓
                        ┌────────────────────┐
                        │ Production_Batches │
                        └────────────────────┘
                                 ↑
                                 │
                        ┌────────────────────┐
                        │       Users        │
                        └────────────────────┘
```

---

## สรุป

ระบบประเมินไม้สดนี้ช่วยให้คุณ:

✅ **บันทึกไม้เข้าคลัง** - ติดตามไม้สดทุกล็อตที่รับเข้ามา
✅ **ประเมินคุณภาพไม้** - ให้คะแนนและเกรดตามเกณฑ์มาตรฐาน
✅ **วางแผนการผลิต** - เชื่อมโยงไม้กับใบสั่งผลิต
✅ **ติดตามสถานะ** - ดูสถานะแบบ Real-time บนมือถือ
✅ **รายงานอัตโนมัติ** - แจ้งเตือนและรายงานผ่าน Notification

---

**สอบถามเพิ่มเติม**: ติดต่อทีมพัฒนาระบบ
