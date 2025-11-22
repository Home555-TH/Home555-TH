# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Sheets Integration

#### A. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

#### B. Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details
4. Click "Create and Continue"
5. Skip granting access (click "Continue")
6. Click "Done"

#### C. Generate Credentials
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select JSON format
5. Download the JSON file
6. Save it as `credentials/google-credentials.json`

#### D. Create Google Spreadsheet
1. Create a new Google Spreadsheet
2. Copy the Spreadsheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
   - Copy `YOUR_SPREADSHEET_ID`
3. Share the spreadsheet with the service account email:
   - Find the email in the credentials JSON: `client_email`
   - Share the spreadsheet with this email (Editor access)

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and fill in:
nano .env
```

Required configuration:
```env
PORT=3000
NODE_ENV=development

# Google Sheets (REQUIRED for sync features)
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/google-credentials.json
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-from-url

# OpenAI (OPTIONAL - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Database (auto-created)
DATABASE_PATH=./data/cnc-epr.db
```

### 4. Start the Application

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm run build
npm start
```

### 5. Access the Application

- **Web Interface**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## Testing Without Google Sheets

You can test the application without Google Sheets integration:

1. Don't set `GOOGLE_SPREADSHEET_ID` in `.env`
2. The app will work normally but sync features will be disabled
3. All data will be stored locally in SQLite database

## Testing Without AI Features

You can test without OpenAI:

1. Don't set `OPENAI_API_KEY` in `.env`
2. AI endpoints will return informative messages
3. All other features work normally

## Quick Test

### 1. Record CNC Data (Web Interface)
- Open http://localhost:3000/
- Fill in the "CNC Machine Data" form
- Click "Record CNC Data"

### 2. Create Production Record
- Fill in the "Electronic Production Record" form
- Click "Start Production"

### 3. View Data
- Click "Refresh" buttons to see recent data
- Data appears in the display sections below

### 4. Sync to Google Sheets (if configured)
- Check "Sync Status" at the top
- Click "Sync All to Google Sheets"
- Verify data appears in your Google Spreadsheet

### 5. Test AI Features (if configured)
- Click "Analyze CNC Data" for performance insights
- Click "Detect Anomalies" for issue detection

## API Testing with curl

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

### Get CNC Data:
```bash
curl http://localhost:3000/api/cnc?limit=10
```

### Create Production Record:
```bash
curl -X POST http://localhost:3000/api/epr \
  -H "Content-Type: application/json" \
  -d '{
    "production_order": "PO-2024-001",
    "part_number": "PN-12345",
    "part_name": "Engine Block",
    "quantity": 100,
    "machine_id": "CNC-001",
    "operator_name": "John Doe",
    "notes": "First batch"
  }'
```

### Sync to Google Sheets:
```bash
curl -X POST http://localhost:3000/api/sync/all
```

### AI Analysis:
```bash
curl http://localhost:3000/api/cnc/analyze?limit=50
curl http://localhost:3000/api/cnc/anomalies
```

## Troubleshooting

### Google Sheets Error: "Unable to parse credentials"
- Verify the JSON file path in `.env`
- Ensure the credentials file is valid JSON
- Check file permissions

### Google Sheets Error: "The caller does not have permission"
- Share the spreadsheet with the service account email
- Grant "Editor" access
- Wait a few minutes for permissions to propagate

### AI Features Not Working
- Verify `OPENAI_API_KEY` is set correctly
- Check if you have API credits
- Test with a simple curl: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Port Already in Use
- Change `PORT` in `.env` to a different value (e.g., 3001)
- Or stop the process using port 3000

### Database Locked
- Only one process can access SQLite database at a time
- Stop other instances of the application
- Delete `data/cnc-epr.db` and restart (will lose data)

## Next Steps

1. **Customize the Schema**: Modify `src/database/schema.ts` to add custom fields
2. **Add Authentication**: Implement user authentication for production use
3. **Set Up Automated Sync**: Add scheduled sync tasks using cron or similar
4. **Deploy to Cloud**: Use services like Heroku, AWS, or Google Cloud
5. **Integrate with CNC Machines**: Connect to actual CNC machine APIs for real-time data

## Support

For issues and questions, please check:
- README.md for detailed documentation
- API documentation at http://localhost:3000/api
- Source code comments for implementation details
