import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { DatabaseManager } from './database/schema';
import { GoogleSheetsService } from './services/googleSheets';
import { AIAnalyzer } from './services/aiAnalyzer';
import { createCNCRoutes } from './routes/cncRoutes';
import { createEPRRoutes } from './routes/eprRoutes';
import { createSyncRoutes } from './routes/syncRoutes';

// Load environment variables
dotenv.config();

// Initialize services
const db = new DatabaseManager();
const sheetsService = new GoogleSheetsService();
const aiAnalyzer = new AIAnalyzer();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      database: 'connected',
      googleSheets: process.env.GOOGLE_SPREADSHEET_ID ? 'configured' : 'not configured',
      ai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// API Routes
app.use('/api/cnc', createCNCRoutes(db, aiAnalyzer));
app.use('/api/epr', createEPRRoutes(db, aiAnalyzer));
app.use('/api/sync', createSyncRoutes(db, sheetsService));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'CNC ePR AI Cloud System',
    version: '1.0.0',
    description: 'AI-Powered CNC ePR Cloud System with Google Sheets Integration',
    endpoints: {
      health: 'GET /health',
      cnc: {
        list: 'GET /api/cnc?limit=100',
        create: 'POST /api/cnc',
        analyze: 'GET /api/cnc/analyze?limit=50&machine_id=xxx',
        anomalies: 'GET /api/cnc/anomalies?limit=100',
        maintenance: 'GET /api/cnc/maintenance/:machineId'
      },
      epr: {
        list: 'GET /api/epr?limit=100',
        create: 'POST /api/epr',
        update: 'PUT /api/epr/:id',
        complete: 'POST /api/epr/:id/complete',
        analyze: 'GET /api/epr/:id/analyze'
      },
      sync: {
        syncCNC: 'POST /api/sync/cnc',
        syncEPR: 'POST /api/sync/epr',
        syncAll: 'POST /api/sync/all',
        status: 'GET /api/sync/status'
      }
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Initialize Google Sheets on startup
async function initializeServices() {
  try {
    if (process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SHEETS_CREDENTIALS_PATH) {
      await sheetsService.initializeSpreadsheet();
      console.log('Google Sheets service initialized');
    } else {
      console.warn('Google Sheets not configured. Set GOOGLE_SPREADSHEET_ID and GOOGLE_SHEETS_CREDENTIALS_PATH to enable sync.');
    }
  } catch (error) {
    console.error('Failed to initialize Google Sheets:', error);
    console.log('Server will continue without Google Sheets integration');
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();

    app.listen(PORT, () => {
      console.log('\n===========================================');
      console.log('🚀 CNC ePR AI Cloud System');
      console.log('===========================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Web Interface: http://localhost:${PORT}/`);
      console.log(`API documentation: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('===========================================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

startServer();
