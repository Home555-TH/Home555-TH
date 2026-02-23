# 🚀 Quick Start Guide (No Coding Required)

## For Production Users - Simple Steps

---

## ✨ What You Need

1. ✅ Internet connection
2. ✅ Web browser (Chrome, Firefox, Safari)
3. ✅ Google account
4. ❌ NO coding skills needed!

---

## 📊 Method 1: Google Sheets Only (Recommended)

### **Step 1: Open Your Spreadsheet**

**Link:** https://docs.google.com/spreadsheets/d/16yoBflfGl2rVVS93GEfUK4d0RNBTu4hVaUh66espBOQ/edit

You'll see 2 sheets:
- **CNC_Data** = Machine monitoring data
- **EPR_Records** = Job orders & production records

---

### **Step 2: Add New Job Order**

1. Go to **EPR_Records** sheet
2. Scroll to empty row at bottom
3. Fill in columns:

| Column | What to enter | Example |
|--------|---------------|---------|
| B | Production Order | PO-2024-001 |
| C | Part Number | PN-12345 |
| D | Part Name | Engine Block |
| E | Quantity | 50 |
| F | Machine ID | CNC-001 |
| G | Operator Name | John Smith |
| J | Status | in_progress |
| M | Notes | Customer: ABC Corp |

4. **Done!** - Auto-saved

---

### **Step 3: Update When Complete**

When job is finished:
1. Find the row
2. Update these columns:
   - **Column J**: Change to `completed`
   - **Column K**: Add quality score (0-100)
   - **Column L**: Add defect count
   - **Column M**: Add completion notes

---

### **Step 4: View Reports**

**Filter data:**
```
1. Click header row
2. Click Data → Create a filter
3. Click ▼ on column header
4. Select what you want to see
```

**Count orders:**
```
Total orders: =COUNTA(B2:B100)
Completed: =COUNTIF(J2:J100,"completed")
```

**Average quality:**
```
=AVERAGE(K2:K100)
```

**Create charts:**
```
1. Select data
2. Insert → Chart
3. Choose chart type
```

---

## 🌐 Method 2: Web Interface (If IT Setup)

### **Access System:**
```
Open browser → http://localhost:3000
(or IP address from IT team)
```

### **What You'll See:**

**1. Form: CNC Machine Data**
- Enter machine status, speed, temperature
- Click "Record CNC Data"

**2. Form: Production Record**
- Enter order details, part info
- Click "Start Production"

**3. Recent Data**
- View latest records
- Click "Refresh" to update

**4. Sync Button**
- Click "Sync All to Google Sheets"
- Data automatically sent to Google Sheets

---

## 📱 Mobile Access

**Google Sheets on Phone:**
1. Download "Google Sheets" app
2. Open your spreadsheet
3. Edit and view data
4. Auto-syncs with team

---

## 🎯 Real-World Examples

### **Example 1: Customer Orders**
```
Customer calls: "Order 100 gears in 5 days"

✅ What to do:
1. Open Google Sheets → EPR_Records
2. Add new row:
   - Order: PO-2024-050
   - Part: Gear - 100 pcs
   - Machine: CNC-002
   - Status: in_progress
3. Save
4. Notify production team
```

### **Example 2: Check Progress**
```
Boss asks: "Where is order ABC?"

✅ How to check:
1. Open Google Sheets → EPR_Records
2. Press Ctrl+F, type "ABC"
3. Look at Status column
4. Answer: "60% complete, 40 units remaining"
```

### **Example 3: Quality Report**
```
Need monthly quality report

✅ How to do:
1. Open EPR_Records
2. Filter: Status = "completed"
3. Calculate:
   - Count: =COUNTA(B2:B50)
   - Avg Quality: =AVERAGE(K2:K50)
   - Total Defects: =SUM(L2:L50)
4. Create chart
5. Export as PDF
```

---

## 🔧 Troubleshooting

### **Can't open Google Sheets:**
- Check internet connection
- Refresh page (F5)
- Try different browser

### **Can't edit data:**
- Check if you have edit permission
- Ask IT for access
- Someone else might be editing same row

### **Lost data:**
- Google Sheets auto-saves everything
- View history: File → Version history
- Restore previous version if needed

---

## ✅ Daily Checklist

### **Morning:**
- [ ] Open Google Sheets
- [ ] Check today's orders
- [ ] Prepare machines
- [ ] Brief production team

### **During Day:**
- [ ] Update progress every 2-3 hours
- [ ] Record any issues
- [ ] Check quality

### **Evening:**
- [ ] Mark completed orders
- [ ] Record quality scores
- [ ] Count production
- [ ] Report to supervisor

---

## 📚 Common Formulas

```
Count all: =COUNTA(B2:B100)
Count if: =COUNTIF(J2:J100,"completed")
Sum: =SUM(E2:E100)
Average: =AVERAGE(K2:K100)
Max: =MAX(E2:E100)
Min: =MIN(E2:E100)
```

---

## 💡 Key Points

### **What You DO:**
- ✅ Use Google Sheets (like Excel)
- ✅ Fill in data
- ✅ Update status
- ✅ View reports

### **What You DON'T Need:**
- ❌ Write code
- ❌ Install software
- ❌ Setup servers
- ❌ Manage databases

---

## 📞 Need Help?

- **Google Sheets help:** https://support.google.com/docs
- **System issues:** Contact your IT support
- **YouTube tutorials:** Search "Google Sheets basics"

---

## 🎓 More Documentation

- 📄 `คู่มือใช้งาน-ไม่ต้อง-Coding.md` - Full Thai guide
- 📄 `JOB_ORDER_GUIDE.md` - Job order management
- 📄 `README.md` - Complete system documentation

---

**Remember:** This system is designed for easy use - no programming skills needed! 🚀
