# 🤖 CNC ePR AI Cloud System

AI-Powered CNC Machine Monitoring and Electronic Production Record Management System with Google Sheets Integration.

## Features

- 📊 **CNC Machine Monitoring**: Real-time tracking of CNC machine data (speed, temperature, coordinates, status)
- 📝 **Electronic Production Records (ePR)**: Complete production tracking with quality metrics
- 🔄 **Google Sheets Integration**: Automatic synchronization of all data to Google Sheets
- 🤖 **AI-Powered Analytics**:
  - Intelligent data analysis and insights
  - Anomaly detection
  - Predictive maintenance recommendations
  - Quality assessment and optimization suggestions
- 🌐 **Web Interface**: Modern, responsive dashboard for data management
- 🔌 **RESTful API**: Complete API for integration with existing systems

## Technology Stack

- **Backend**: Node.js with TypeScript, Express.js
- **Database**: SQLite (better-sqlite3)
- **AI**: OpenAI GPT-4
- **Integration**: Google Sheets API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud Project with Sheets API enabled
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `GOOGLE_SPREADSHEET_ID`: Your Google Sheets ID
- `GOOGLE_SHEETS_CREDENTIALS_PATH`: Path to Google service account credentials
- `OPENAI_API_KEY`: Your OpenAI API key (optional)

3. **Set up Google Sheets**:
   - Create a new Google Spreadsheet
   - Create a service account in Google Cloud Console
   - Download credentials JSON file to `./credentials/google-credentials.json`
   - Share the spreadsheet with the service account email

4. **Start the server**:
```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

5. **Access the application**:
   - Web Interface: http://localhost:3000
   - API Documentation: http://localhost:3000/
   - Health Check: http://localhost:3000/health

## API Endpoints

### CNC Machine Data

- `GET /api/cnc?limit=100` - Get CNC machine data
- `POST /api/cnc` - Record new CNC data
- `GET /api/cnc/analyze?limit=50&machine_id=xxx` - AI analysis of CNC data
- `GET /api/cnc/anomalies?limit=100` - Detect anomalies
- `GET /api/cnc/maintenance/:machineId` - Predictive maintenance

### Electronic Production Records

- `GET /api/epr?limit=100` - Get EPR records
- `POST /api/epr` - Create new production record
- `PUT /api/epr/:id` - Update record
- `POST /api/epr/:id/complete` - Complete record with AI analysis
- `GET /api/epr/:id/analyze` - Get AI analysis for specific record

### Data Synchronization

- `POST /api/sync/cnc` - Sync CNC data to Google Sheets
- `POST /api/sync/epr` - Sync EPR records to Google Sheets
- `POST /api/sync/all` - Sync all data
- `GET /api/sync/status` - Get sync status

## Example Usage

### Recording CNC Data

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

### Creating Production Record

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
    "notes": "First batch of Q1 2024"
  }'
```

### AI Analysis

```bash
# Analyze CNC performance
curl http://localhost:3000/api/cnc/analyze?limit=50

# Detect anomalies
curl http://localhost:3000/api/cnc/anomalies

# Predictive maintenance
curl http://localhost:3000/api/cnc/maintenance/CNC-001
```

### Sync to Google Sheets

```bash
curl -X POST http://localhost:3000/api/sync/all
```

## Database Schema

### CNC Machine Data
- Machine identification and status
- Operation parameters (speed, feed rate, temperature)
- 3D coordinates (X, Y, Z)
- Program information
- Sync tracking

### EPR Records
- Production order details
- Part information
- Machine and operator tracking
- Quality metrics
- AI analysis results
- Sync tracking

## AI Capabilities

1. **Performance Analysis**: Comprehensive analysis of machine efficiency and performance trends
2. **Anomaly Detection**: Automatic detection of unusual patterns or potential issues
3. **Predictive Maintenance**: Forecasting maintenance needs based on historical data
4. **Quality Assessment**: AI-powered analysis of production quality and defect patterns
5. **Optimization Recommendations**: Suggestions for improving efficiency and reducing defects

## Google Sheets Integration

The system automatically creates and manages two sheets:
- **CNC_Data**: All CNC machine data with timestamps
- **EPR_Records**: Complete production records with AI analysis

Data can be synced manually via API or automatically on a schedule.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
cnc-epr-ai-cloud/
├── src/
│   ├── database/
│   │   └── schema.ts          # Database models and operations
│   ├── services/
│   │   ├── googleSheets.ts    # Google Sheets integration
│   │   └── aiAnalyzer.ts      # AI analysis services
│   ├── routes/
│   │   ├── cncRoutes.ts       # CNC API endpoints
│   │   ├── eprRoutes.ts       # EPR API endpoints
│   │   └── syncRoutes.ts      # Sync API endpoints
│   └── server.ts              # Main application
├── public/
│   └── index.html             # Web interface
├── data/                      # SQLite database (auto-created)
├── credentials/               # Google credentials (create manually)
└── package.json
```

## Security Notes

- Never commit `.env` or credentials files
- Use service accounts for Google Sheets access
- Implement authentication for production use
- Restrict API access with proper CORS settings
- Keep API keys secure

## License

MIT

## Support

For issues and questions, please contact your system administrator.
