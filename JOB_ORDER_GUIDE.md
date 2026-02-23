# 📋 Job Order Management Guide

## What is a Job Order?

In your CNC ePR system, **Job Orders** are managed through **EPR (Electronic Production Records)**. Each EPR record represents a production job with:

- **Production Order Number** - Unique identifier (e.g., JO-2024-001)
- **Part Information** - What to manufacture
- **Quantity** - How many units
- **Machine Assignment** - Which CNC machine
- **Operator** - Who's responsible
- **Status Tracking** - Progress monitoring
- **Quality Metrics** - Defects, quality scores

---

## 🚀 How to Create Job Orders

### **Method 1: Interactive CLI Tool**

```bash
npm run create-job-order
```

This will prompt you for:
1. Production Order Number
2. Part Number & Name
3. Quantity
4. Machine ID
5. Operator Name
6. Notes

✅ Creates job order and shows confirmation

---

### **Method 2: Quick Sample Orders**

```bash
npm run create-sample-jobs
```

Creates 3 sample job orders:
- JO-2024-101: Precision Gear Assembly (50 units)
- JO-2024-102: Drive Shaft (75 units)
- JO-2024-103: Mounting Bracket (100 units)

---

### **Method 3: Using the API**

When the webapp is running (`npm run dev`):

```bash
curl -X POST http://localhost:3000/api/epr \
  -H "Content-Type: application/json" \
  -d '{
    "production_order": "JO-2024-001",
    "part_number": "PN-12345",
    "part_name": "Engine Block",
    "quantity": 50,
    "machine_id": "CNC-001",
    "operator_name": "John Smith",
    "notes": "Priority order"
  }'
```

---

### **Method 4: Through Web Interface**

1. Start webapp: `npm run dev`
2. Open: http://localhost:3000
3. Fill in "Electronic Production Record" form
4. Click "Start Production"

---

## 📊 View Job Orders

### **View in Database**

```bash
npm run view-orders
```

### **View in Google Sheets**

1. Open your spreadsheet
2. Go to "EPR_Records" sheet
3. Filter by status, operator, or machine

### **View via API**

```bash
# Get all job orders
curl http://localhost:3000/api/epr?limit=10

# Get specific order (replace ID)
curl http://localhost:3000/api/epr
```

---

## ✏️ Update Job Order Status

### **Complete a Job Order**

```bash
curl -X POST http://localhost:3000/api/epr/{order-id}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "quality_score": 95.5,
    "defect_count": 2,
    "notes": "Completed successfully"
  }'
```

### **Update Job Order**

```bash
curl -X PUT http://localhost:3000/api/epr/{order-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "quality_check",
    "defect_count": 3
  }'
```

---

## 📈 Job Order Statuses

- **in_progress** - Currently being manufactured
- **completed** - Successfully finished
- **failed** - Production failed
- **quality_check** - Under quality inspection

---

## 🔄 Sync to Google Sheets

After creating job orders:

```bash
# Sync all new orders
npm run sync

# Or via API
curl -X POST http://localhost:3000/api/sync/epr
```

Your job orders will appear in Google Sheets "EPR_Records" tab!

---

## 📝 Job Order Fields

| Field | Description | Example |
|-------|-------------|---------|
| production_order | Unique order number | JO-2024-001 |
| part_number | Part SKU/number | PN-12345 |
| part_name | Part description | Engine Block |
| quantity | Units to produce | 50 |
| machine_id | Assigned CNC machine | CNC-001 |
| operator_name | Operator name | John Smith |
| start_time | Start timestamp | Auto-set |
| end_time | Completion time | Set when done |
| status | Current status | in_progress |
| quality_score | Quality rating (0-100) | 95.5 |
| defect_count | Number of defects | 2 |
| notes | Additional notes | Priority order |
| ai_analysis | AI insights | Auto-generated |

---

## 🎯 Common Workflows

### **Create → Monitor → Complete**

```bash
# 1. Create job order
npm run create-job-order

# 2. Check status
npm run view-orders

# 3. Complete via API when done
curl -X POST http://localhost:3000/api/epr/{id}/complete \
  -d '{"quality_score": 98, "defect_count": 1}'

# 4. Sync to Google Sheets
npm run sync
```

### **Bulk Job Creation**

Edit `src/utils/quickJobOrder.ts` to add your orders, then:

```bash
npm run create-sample-jobs
```

---

## 🔍 Search & Filter

In Google Sheets:
- Filter by operator: `=FILTER(EPR_Records!A:O, EPR_Records!G:G="John Smith")`
- Find in-progress: `=FILTER(EPR_Records!A:O, EPR_Records!J:J="in_progress")`
- Count by machine: `=COUNTIF(EPR_Records!F:F, "CNC-001")`

---

## 💡 Tips

1. **Use consistent naming:**
   - Orders: JO-YYYY-NNN
   - Parts: PN-XXXXX

2. **Track everything:**
   - Always add notes
   - Update status regularly
   - Record defects

3. **Leverage AI:**
   - Add OpenAI key for automatic analysis
   - Get quality insights
   - Anomaly detection

4. **Sync regularly:**
   - Keep Google Sheets updated
   - Share with team
   - Cloud backup

---

## 🆘 Troubleshooting

**Can't create order:**
- Check database exists: `ls data/cnc-epr.db`
- Verify machine IDs are valid

**Order not in Google Sheets:**
- Run: `npm run sync`
- Check sync status: `curl http://localhost:3000/api/sync/status`

**Need to edit order:**
- Use UPDATE API endpoint
- Or edit directly in database/Google Sheets

---

## 📚 Related Documentation

- `README.md` - Full system documentation
- `START_HERE.md` - Quick start guide
- `GOOGLE_SHEETS_SETUP.md` - Cloud sync setup

---

**Ready to create your first job order?** Run: `npm run create-job-order` 🚀
