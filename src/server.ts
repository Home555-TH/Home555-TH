import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { DatabaseManager } from './database/schema';
import { GoogleSheetsService } from './services/googleSheets';
import { AIAnalyzer } from './services/aiAnalyzer';
import { ERPNextClient } from './services/erpnext';
import { MedicationAIService } from './services/medicationAI';
import { J2KManufacturingService } from './services/j2kManufacturing';
import { QuotationAIService } from './services/quotationAI';
import { MasterDataMigrationService } from './services/masterDataMigration';
import { createCNCRoutes } from './routes/cncRoutes';
import { createEPRRoutes } from './routes/eprRoutes';
import { createSyncRoutes } from './routes/syncRoutes';
import { createMedicationRoutes } from './routes/medicationRoutes';
import { createManufacturingRoutes } from './routes/manufacturingRoutes';
import { createQuotationRoutes } from './routes/quotationRoutes';
import { createMasterDataRoutes } from './routes/masterDataRoutes';

// Load environment variables
dotenv.config();

// Initialize services
const db = new DatabaseManager();
const sheetsService = new GoogleSheetsService();
const aiAnalyzer = new AIAnalyzer();
const erpnext = new ERPNextClient();
const medicationAI = new MedicationAIService();
const j2k = new J2KManufacturingService(erpnext);
const quotationAI = new QuotationAIService(erpnext);
const masterDataMigration = new MasterDataMigrationService(erpnext);

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
      ai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      erpnext: process.env.ERPNEXT_BASE_URL ? 'configured' : 'not configured',
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Legacy CNC + EPR (local SQLite)
app.use('/api/cnc',  createCNCRoutes(db, aiAnalyzer));
app.use('/api/epr',  createEPRRoutes(db, aiAnalyzer));
app.use('/api/sync', createSyncRoutes(db, sheetsService));

// ERPNext-powered modules
app.use('/api/medication',   createMedicationRoutes(db, erpnext, medicationAI));
app.use('/api/manufacturing', createManufacturingRoutes(db, j2k));
app.use('/api/quotation',    createQuotationRoutes(erpnext, quotationAI));
app.use('/api/master-data',  createMasterDataRoutes(masterDataMigration));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'CNC ePR AI Cloud System + ERPNext Integration',
    version: '2.0.0',
    description: 'AI-Powered ERP Bridge: ERPNext core + AI modules for Medication, Manufacturing (J2K CNC), Quotation & Master Data',
    modules: {
      // ── Legacy local modules ──────────────────────────────────────────────
      cnc: {
        list:        'GET  /api/cnc?limit=100',
        create:      'POST /api/cnc',
        analyze:     'GET  /api/cnc/analyze?limit=50&machine_id=xxx',
        anomalies:   'GET  /api/cnc/anomalies?limit=100',
        maintenance: 'GET  /api/cnc/maintenance/:machineId',
      },
      epr: {
        list:     'GET  /api/epr?limit=100',
        create:   'POST /api/epr',
        update:   'PUT  /api/epr/:id',
        complete: 'POST /api/epr/:id/complete',
        analyze:  'GET  /api/epr/:id/analyze',
      },
      sync: {
        syncCNC: 'POST /api/sync/cnc',
        syncEPR: 'POST /api/sync/epr',
        syncAll: 'POST /api/sync/all',
        status:  'GET  /api/sync/status',
      },
      // ── ERPNext medication module ─────────────────────────────────────────
      medication: {
        status:          'GET  /api/medication/status',
        items:           'GET  /api/medication/items?limit=200',
        stock:           'GET  /api/medication/stock?warehouse=xxx',
        stockAnalysis:   'GET  /api/medication/stock/analysis',
        expiry:          'GET  /api/medication/expiry?days=90',
        reorder:         'GET  /api/medication/reorder',
        prescriptions:   'GET  /api/medication/prescriptions?limit=50',
        interactions:    'GET  /api/medication/prescriptions/:id/interactions',
        dosage:          'GET  /api/medication/prescriptions/:id/dosage',
        patientInsights: 'GET  /api/medication/patients/:id/insights',
        history:         'GET  /api/medication/history?type=interaction&limit=20',
      },
      // ── J2K CNC manufacturing (ERPNext Manufacturing module) ──────────────
      manufacturing: {
        status:            'GET  /api/manufacturing/status',
        workOrders:        'GET  /api/manufacturing/work-orders',
        workOrder:         'GET  /api/manufacturing/work-orders/:id',
        efficiency:        'GET  /api/manufacturing/work-orders/:id/efficiency',
        optimize:          'GET  /api/manufacturing/work-orders/:id/optimize',
        syncCNCToJobCard:  'POST /api/manufacturing/job-cards/:id/sync-cnc',
        workCenters:       'GET  /api/manufacturing/work-centers',
        wcPerformance:     'GET  /api/manufacturing/work-centers/performance',
      },
      // ── AI-powered quotation ──────────────────────────────────────────────
      quotation: {
        status:     'GET  /api/quotation/status',
        open:       'GET  /api/quotation/open',
        pipeline:   'GET  /api/quotation/pipeline',
        single:     'GET  /api/quotation/:id',
        analyze:    'GET  /api/quotation/:id/analyze',
        pricing:    'GET  /api/quotation/:id/pricing?margin=25',
        draft:      'POST /api/quotation/draft   { customer_name, requirements }',
        leadTime:   'POST /api/quotation/lead-time   { items: [...] }',
      },
      // ── Master data migration ─────────────────────────────────────────────
      masterData: {
        doctypes:  'GET  /api/master-data/doctypes',
        export:    'POST /api/master-data/export/:doctype   { records: [...] }',
        import:    'GET  /api/master-data/import/:doctype?limit=500&fields=name,...',
        validate:  'POST /api/master-data/validate/:doctype   { records: [...] }',
        diff:      'POST /api/master-data/diff/:doctype   { records, compare_fields }',
        csv:       'POST /api/master-data/csv/:doctype   { headers, rows }',
      },
    },
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
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
      console.log('\n=====================================================');
      console.log('  CNC ePR AI Cloud System v2.0 + ERPNext Bridge');
      console.log('=====================================================');
      console.log(`Server      : http://localhost:${PORT}/`);
      console.log(`API docs    : http://localhost:${PORT}/api`);
      console.log(`Health      : http://localhost:${PORT}/health`);
      console.log('-----------------------------------------------------');
      console.log('Modules     : CNC | EPR | Medication | Manufacturing');
      console.log('            : Quotation | Master Data Migration');
      console.log(`ERPNext     : ${process.env.ERPNEXT_BASE_URL || 'not configured'}`);
      console.log(`AI (OpenAI) : ${process.env.OPENAI_API_KEY ? 'ready' : 'not configured'}`);
      console.log('=====================================================\n');
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
