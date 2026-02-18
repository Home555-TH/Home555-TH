/**
 * Medication API Routes
 *
 * Bridges ERPNext core data with AI-powered analysis.
 *
 * All /api/medication/* endpoints:
 *   - Pull live data from ERPNext
 *   - Run AI analysis (GPT-4)
 *   - Cache results locally (SQLite)
 *   - Return structured JSON
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ERPNextClient } from '../services/erpnext';
import { MedicationAIService } from '../services/medicationAI';
import { DatabaseManager } from '../database/schema';

export function createMedicationRoutes(
  db: DatabaseManager,
  erpnext: ERPNextClient,
  medicationAI: MedicationAIService
): Router {
  const router = Router();

  // ─── Health / Connection Status ─────────────────────────────────────────────

  /**
   * GET /api/medication/status
   * Check ERPNext connection and AI availability.
   */
  router.get('/status', async (_req: Request, res: Response) => {
    const erpStatus = erpnext.isConfigured
      ? await erpnext.ping()
      : { connected: false, error: 'ERPNext not configured' };

    res.json({
      success: true,
      erpnext: erpStatus,
      ai: {
        configured: medicationAI.isConfigured,
        status: medicationAI.isConfigured ? 'ready' : 'disabled — set OPENAI_API_KEY',
      },
    });
  });

  // ─── Medication Items ────────────────────────────────────────────────────────

  /**
   * GET /api/medication/items?limit=200
   * List all medication items from ERPNext.
   */
  router.get('/items', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 200;
      const items = await erpnext.getMedicationItems(limit);
      res.json({ success: true, data: items, count: items.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Stock ───────────────────────────────────────────────────────────────────

  /**
   * GET /api/medication/stock?warehouse=Main+Pharmacy
   * Current stock balance from ERPNext.
   */
  router.get('/stock', async (req: Request, res: Response) => {
    try {
      const warehouse = req.query.warehouse as string | undefined;
      const balances = await erpnext.getStockBalance(warehouse);
      res.json({ success: true, data: balances, count: balances.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * GET /api/medication/stock/analysis
   * AI analysis of overall medication stock health.
   */
  router.get('/stock/analysis', async (req: Request, res: Response) => {
    try {
      const [items, balances] = await Promise.all([
        erpnext.getMedicationItems(),
        erpnext.getStockBalance(),
      ]);

      const analysis = await medicationAI.analyzeOverallStock(items, balances);

      const record = {
        id: uuidv4(),
        analysis_type: 'stock',
        reference_id: 'all',
        reference_name: 'Overall Stock Analysis',
        result_json: JSON.stringify({ analysis }),
        alert_count: 0,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, analysis, itemCount: items.length, stockRecords: balances.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Expiry Risk ─────────────────────────────────────────────────────────────

  /**
   * GET /api/medication/expiry?days=90
   * AI-assessed expiry risk for batches expiring within N days.
   */
  router.get('/expiry', async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const batches = await erpnext.getExpiringBatches(days);

      if (batches.length === 0) {
        return res.json({ success: true, message: `No batches expiring within ${days} days`, data: null });
      }

      const result = await medicationAI.assessExpiryRisk(batches);

      const record = {
        id: uuidv4(),
        analysis_type: 'expiry',
        reference_id: `within_${days}_days`,
        reference_name: `Expiry Risk (${days} days)`,
        result_json: JSON.stringify(result),
        alert_count: result.items.filter(i => i.riskLevel === 'critical').length,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, data: result, batchesChecked: batches.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Reorder Forecast ────────────────────────────────────────────────────────

  /**
   * GET /api/medication/reorder
   * AI-powered reorder recommendations based on current stock vs ERPNext reorder levels.
   */
  router.get('/reorder', async (_req: Request, res: Response) => {
    try {
      const [items, balances] = await Promise.all([
        erpnext.getMedicationItems(),
        erpnext.getStockBalance(),
      ]);

      const forecast = await medicationAI.forecastReorders(balances, items);

      const record = {
        id: uuidv4(),
        analysis_type: 'reorder',
        reference_id: 'forecast',
        reference_name: 'Reorder Forecast',
        result_json: JSON.stringify(forecast),
        alert_count: forecast.recommendations.filter(r => r.urgency === 'immediate').length,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, data: forecast });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Prescriptions ───────────────────────────────────────────────────────────

  /**
   * GET /api/medication/prescriptions?limit=50
   * Active prescriptions from ERPNext Healthcare module.
   */
  router.get('/prescriptions', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const prescriptions = await erpnext.getActivePrescriptions(limit);
      res.json({ success: true, data: prescriptions, count: prescriptions.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * GET /api/medication/prescriptions/:id/interactions
   * Check drug interactions for a specific prescription.
   */
  router.get('/prescriptions/:id/interactions', async (req: Request, res: Response) => {
    try {
      const prescription = await erpnext.getDoc<import('../services/erpnext').ERPNextPrescription>(
        'Patient Encounter', req.params.id
      );

      const result = await medicationAI.checkDrugInteractions(prescription);

      const record = {
        id: uuidv4(),
        analysis_type: 'interaction',
        reference_id: req.params.id,
        reference_name: `${prescription.patient_name} — ${prescription.encounter_date}`,
        result_json: JSON.stringify(result),
        alert_count: result.interactions.filter(i => i.severity === 'critical').length,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, data: result, prescription: req.params.id });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * GET /api/medication/prescriptions/:id/dosage
   * AI dosage safety analysis for a specific prescription.
   */
  router.get('/prescriptions/:id/dosage', async (req: Request, res: Response) => {
    try {
      const prescription = await erpnext.getDoc<import('../services/erpnext').ERPNextPrescription>(
        'Patient Encounter', req.params.id
      );

      let patient: import('../services/erpnext').ERPNextPatient | undefined;
      try {
        patient = await erpnext.getPatient(prescription.patient);
      } catch {
        // patient details optional
      }

      const result = await medicationAI.analyzeDosages(prescription, patient);

      const alertCount = result.filter(r => r.assessment === 'alert').length;
      const record = {
        id: uuidv4(),
        analysis_type: 'dosage',
        reference_id: req.params.id,
        reference_name: `${prescription.patient_name} — Dosage Analysis`,
        result_json: JSON.stringify(result),
        alert_count: alertCount,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, data: result, alertCount });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Patient ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/medication/patients/:id/insights
   * Full AI review of patient's medication history across all encounters.
   */
  router.get('/patients/:id/insights', async (req: Request, res: Response) => {
    try {
      const [patient, prescriptions] = await Promise.all([
        erpnext.getPatient(req.params.id),
        erpnext.getActivePrescriptions(100),
      ]);

      const patientPrescriptions = prescriptions.filter(
        p => p.patient === req.params.id
      );

      const result = await medicationAI.analyzePatientMedications(patient, patientPrescriptions);

      const record = {
        id: uuidv4(),
        analysis_type: 'patient',
        reference_id: req.params.id,
        reference_name: patient.patient_name,
        result_json: JSON.stringify(result),
        alert_count: result.alerts.length,
        created_at: Date.now(),
      };
      db.insertMedicationAnalysis(record);

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ─── Analysis History ────────────────────────────────────────────────────────

  /**
   * GET /api/medication/history?type=interaction&limit=20
   * Retrieve cached AI analysis results.
   */
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const records = db.getMedicationAnalyses(type, limit);

      const parsed = records.map(r => ({
        ...r,
        result: (() => {
          try { return JSON.parse(r.result_json); } catch { return r.result_json; }
        })(),
      }));

      res.json({ success: true, data: parsed, count: parsed.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
