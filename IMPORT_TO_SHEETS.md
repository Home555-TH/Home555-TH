# 📊 Import Data to Your Google Spreadsheet

Your spreadsheet: https://docs.google.com/spreadsheets/d/16yoBflfGl2rVVS93GEfUK4d0RNBTu4hVaUh66espBOQ/edit

## Quick Steps (2 minutes)

### 1. Download the CSV Files

You have two files ready:
- `CNC_Data.csv` - 100 CNC machine records
- `EPR_Records.csv` - 30 production records

Download these files from your project directory.

### 2. Open Your Google Spreadsheet

Click here: https://docs.google.com/spreadsheets/d/16yoBflfGl2rVVS93GEfUK4d0RNBTu4hVaUh66espBOQ/edit

### 3. Import CNC Data

1. Click the **+** button at the bottom-left to create a new sheet
2. Rename it to: **CNC_Data**
3. Click **File** → **Import**
4. Click **Upload** tab
5. Drag and drop or select **CNC_Data.csv**
6. Import location: Select **"Replace current sheet"**
7. Click **Import data**

You should see 100 rows of CNC machine data with columns:
- ID, Machine ID, Machine Name, Status, Operation Type
- Speed (RPM), Feed Rate, Temperature, X, Y, Z
- Program Name, Timestamp, Date/Time

### 4. Import EPR Records

1. Create another new sheet (click **+**)
2. Rename it to: **EPR_Records**
3. Click **File** → **Import**
4. Upload **EPR_Records.csv**
5. Import location: **"Replace current sheet"**
6. Click **Import data**

You should see 30 rows of production records with columns:
- ID, Production Order, Part Number, Part Name, Quantity
- Machine ID, Operator, Start Time, End Time, Status
- Quality Score, Defect Count, Notes, AI Analysis, Date/Time

## ✅ Done!

Your Google Spreadsheet now has:
- ✓ 100 CNC machine records in `CNC_Data` sheet
- ✓ 30 production records in `EPR_Records` sheet
- ✓ Total: 130 records ready for analysis

## View the Data

Sample CNC record:
- Machine: Haas VF-2 (CNC-001)
- Status: Running
- Speed: 3000 RPM
- Temperature: 45.2°C
- Operation: Milling

Sample EPR record:
- Part: Engine Block (PN-12345)
- Order: PO-2024-1000
- Quantity: 100 units
- Status: Completed
- Quality Score: 95.5%

## What's Next?

### Option A: View and Analyze in Google Sheets
- Sort and filter the data
- Create charts and pivot tables
- Share with your team
- Use Google Sheets formulas for analysis

### Option B: Set Up Live Sync (Advanced)
Follow `GOOGLE_SHEETS_SETUP.md` to:
1. Create Google Cloud service account
2. Download credentials JSON
3. Configure automatic synchronization
4. Enable real-time updates from the webapp

---

**Your CNC ePR system data is ready to use in Google Sheets!** 🎉
