# 🚀 Quick Start - CNC ePR AI Cloud System

## Option 1: Quick Demo (No Setup Required - 2 minutes)

This gets you running immediately with local data only (no Google Sheets or AI).

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm run dev
```

### Step 3: Open Web Interface
Open your browser to: **http://localhost:3000**

### Step 4: Generate Sample Data
In a new terminal:
```bash
npm run generate-data
```

### Step 5: Test It Out!
- Refresh the web interface
- You'll see sample CNC data and EPR records
- Try adding new data through the forms
- Click "Refresh" to see updates

**That's it!** The system is running with local SQLite database.

---

## Option 2: Full Setup with Google Sheets (10 minutes)

Get the complete experience with cloud sync and AI features.

### Prerequisites
- Google account
- OpenAI API key (optional, for AI features)

### Step-by-Step

1. **Follow Google Sheets Setup**
   - Read `GOOGLE_SHEETS_SETUP.md`
   - Create Google Cloud project (5 min)
   - Get credentials JSON file
   - Create spreadsheet and share it

2. **Configure Environment**
   ```bash
   # Edit .env file and add:
   GOOGLE_SPREADSHEET_ID=your-id-here
   GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/google-credentials.json
   ```

3. **Add OpenAI Key (Optional)**
   ```bash
   # In .env file, add:
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **Start the Server**
   ```bash
   npm run dev
   ```

5. **Sync to Google Sheets**
   - Open http://localhost:3000
   - Click "Sync All to Google Sheets"
   - Check your Google Spreadsheet!

---

## What Can You Do?

### 📊 CNC Machine Monitoring
- Record real-time machine data (speed, temperature, position)
- Track machine status (running, idle, maintenance, error)
- View historical data

### 📝 Production Records (ePR)
- Create production orders
- Track parts and quantities
- Monitor quality and defects
- Assign operators and machines

### 🔄 Google Sheets Sync
- One-click sync to cloud
- Automatic sheet creation
- Real-time data backup
- Easy sharing with team

### 🤖 AI Features (with OpenAI API key)
- Performance analysis
- Anomaly detection
- Predictive maintenance
- Quality recommendations

---

## API Testing

### Record CNC Data:
```bash
curl -X POST http://localhost:3000/api/cnc \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "CNC-001",
    "machine_name": "Haas VF-2",
    "status": "running",
    "operation_type": "Milling",
    "speed_rpm": 3000,
    "feed_rate": 100.5,
    "temperature": 45.2,
    "coordinates_x": 125.50,
    "coordinates_y": 200.25,
    "coordinates_z": 50.00,
    "program_name": "PART_001.nc"
  }'
```

### Get Data:
```bash
curl http://localhost:3000/api/cnc?limit=10
curl http://localhost:3000/api/epr?limit=10
```

### Sync to Sheets:
```bash
curl -X POST http://localhost:3000/api/sync/all
```

### AI Analysis (requires OpenAI API key):
```bash
curl http://localhost:3000/api/cnc/analyze
curl http://localhost:3000/api/cnc/anomalies
```

---

## File Structure

```
📁 Home555-TH/
├── 📄 START_HERE.md                    ← You are here!
├── 📄 GOOGLE_SHEETS_SETUP.md           ← Google Sheets instructions
├── 📄 SETUP_GUIDE.md                   ← Detailed setup guide
├── 📄 README.md                        ← Full documentation
│
├── 📁 src/
│   ├── 📁 database/
│   │   └── schema.ts                   ← Database models
│   ├── 📁 services/
│   │   ├── googleSheets.ts             ← Sheets integration
│   │   └── aiAnalyzer.ts               ← AI features
│   ├── 📁 routes/
│   │   ├── cncRoutes.ts                ← CNC endpoints
│   │   ├── eprRoutes.ts                ← ePR endpoints
│   │   └── syncRoutes.ts               ← Sync endpoints
│   ├── 📁 utils/
│   │   └── sampleDataGenerator.ts      ← Generate test data
│   └── server.ts                       ← Main app
│
├── 📁 public/
│   └── index.html                      ← Web interface
│
├── 📁 data/                             ← SQLite database (auto-created)
├── 📁 credentials/                      ← Put Google credentials here
└── 📄 .env                              ← Configuration
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Change PORT in .env file
PORT=3001
```

### Can't connect to server
```bash
# Check if server is running
curl http://localhost:3000/health
```

### Sample data not showing
```bash
# Re-generate data
npm run generate-data

# Refresh browser
```

### Google Sheets not working
- Check `GOOGLE_SHEETS_SETUP.md`
- Verify credentials file exists
- Confirm spreadsheet is shared with service account

---

## Next Steps

1. ✅ Get the demo running (Option 1)
2. 📊 Add Google Sheets integration (Option 2)
3. 🤖 Enable AI features with OpenAI API key
4. 🔧 Customize for your production environment
5. 🚀 Deploy to cloud (Heroku, AWS, Google Cloud)

---

## Need Help?

- 📖 **Full Documentation**: `README.md`
- 🔧 **Setup Guide**: `SETUP_GUIDE.md`
- ☁️ **Google Sheets**: `GOOGLE_SHEETS_SETUP.md`
- 🌐 **API Docs**: http://localhost:3000/api (when running)

---

**Ready to start? Run:**
```bash
npm install && npm run dev
```

Then open: **http://localhost:3000** 🎉
