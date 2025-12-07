# Google Sheets Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `CNC-ePR-System`
4. Click "Create"

### Step 2: Enable Google Sheets API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - **Service account name**: `cnc-epr-service`
   - **Service account ID**: (auto-generated)
4. Click "Create and Continue"
5. Skip the optional steps (click "Continue" and "Done")

### Step 4: Generate Credentials JSON

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. **Save the downloaded file** as `google-credentials.json` in the `credentials/` folder

The file should look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "cnc-epr-service@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### Step 5: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click "+ Blank" to create new spreadsheet
3. Name it: **CNC ePR Production Data**
4. **Important**: Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```
   Copy the `YOUR_SPREADSHEET_ID_HERE` part

### Step 6: Share Spreadsheet with Service Account

1. In your Google Spreadsheet, click the "Share" button
2. Paste the **client_email** from your credentials JSON file:
   - Example: `cnc-epr-service@your-project.iam.gserviceaccount.com`
3. Select "Editor" permissions
4. **Uncheck** "Notify people"
5. Click "Share"

### Step 7: Configure Environment

Create or update the `.env` file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Sheets API Configuration (REQUIRED)
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/google-credentials.json
GOOGLE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID_HERE

# OpenAI API Configuration (Optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database Configuration (auto-created)
DATABASE_PATH=./data/cnc-epr.db
```

Replace `YOUR_SPREADSHEET_ID_HERE` with the ID you copied in Step 5.

## Verify Setup

Run this command to test your Google Sheets connection:

```bash
npm run dev
```

You should see:
```
✓ Google Sheets service initialized
🚀 CNC ePR AI Cloud System
Server running on port 3000
```

If you see errors, check:
1. Credentials file path is correct
2. Spreadsheet ID is correct
3. Service account email has access to the spreadsheet

## Sample Data Template

The system will automatically create these sheets in your spreadsheet:

### Sheet 1: CNC_Data
Columns: ID | Machine ID | Machine Name | Status | Operation Type | Speed (RPM) | Feed Rate | Temperature | X | Y | Z | Program Name | Timestamp | Date/Time

### Sheet 2: EPR_Records
Columns: ID | Production Order | Part Number | Part Name | Quantity | Machine ID | Operator | Start Time | End Time | Status | Quality Score | Defect Count | Notes | AI Analysis | Date/Time

## Manual Data Import (Optional)

If you want to manually create sample data in Google Sheets:

### Sample CNC Data Row:
```
550e8400-e29b-41d4-a716-446655440000 | CNC-001 | Haas VF-2 | running | Milling | 3000 | 100.5 | 45.2 | 125.50 | 200.25 | 50.00 | PART_001.nc | 1701234567890 | 2024-11-29 10:30:00
```

### Sample EPR Record Row:
```
550e8400-e29b-41d4-a716-446655440001 | PO-2024-001 | PN-12345 | Engine Block | 100 | CNC-001 | John Doe | 1701234567890 | 1701245367890 | completed | 95.5 | 2 | Standard production run | Good quality metrics | 2024-11-29 10:30:00
```

## Troubleshooting

### Error: "Unable to parse credentials"
- Check the credentials file path in `.env`
- Ensure the JSON file is valid

### Error: "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Wait 1-2 minutes for permissions to propagate
- Check that you granted "Editor" access

### Error: "Spreadsheet not found"
- Verify the Spreadsheet ID in `.env`
- Make sure the spreadsheet exists and is accessible

### Connection successful but no sheets created
- The sheets are created on first data sync
- Run: `curl -X POST http://localhost:3000/api/sync/all`

## Next Steps

Once configured:
1. Start the webapp: `npm run dev`
2. Generate sample data: `npm run generate-data`
3. Sync to Google Sheets: Visit http://localhost:3000 and click "Sync All"
4. Check your Google Spreadsheet - data should appear!
