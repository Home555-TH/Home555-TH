import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/schema';
import { AIAnalyzer } from '../services/aiAnalyzer';

export function createEPRRoutes(db: DatabaseManager, aiAnalyzer: AIAnalyzer): Router {
  const router = Router();

  // Get all EPR records
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const records = db.getEPRRecords(limit);
      res.json({ success: true, data: records, count: records.length });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Create new EPR record
  router.post('/', async (req: Request, res: Response) => {
    try {
      const record = {
        id: uuidv4(),
        production_order: req.body.production_order,
        part_number: req.body.part_number,
        part_name: req.body.part_name,
        quantity: parseInt(req.body.quantity),
        machine_id: req.body.machine_id,
        operator_name: req.body.operator_name,
        start_time: Date.now(),
        end_time: null,
        status: 'in_progress' as const,
        quality_score: null,
        defect_count: 0,
        notes: req.body.notes || '',
        ai_analysis: null
      };

      db.insertEPRRecord(record);
      res.json({ success: true, data: record, message: 'EPR record created successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  });

  // Update EPR record
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.status) updates.status = req.body.status;
      if (req.body.end_time !== undefined) updates.end_time = req.body.end_time;
      if (req.body.quality_score !== undefined) updates.quality_score = parseFloat(req.body.quality_score);
      if (req.body.defect_count !== undefined) updates.defect_count = parseInt(req.body.defect_count);
      if (req.body.notes !== undefined) updates.notes = req.body.notes;

      db.updateEPRRecord(id, updates);
      res.json({ success: true, message: 'EPR record updated successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  });

  // Complete EPR record with AI analysis
  router.post('/:id/complete', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const records = db.getEPRRecords(1000);
      const record = records.find(r => r.id === id);

      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      // Get related CNC data
      const cncData = db.getCNCData(1000).filter(d => d.machine_id === record.machine_id);

      // Generate AI analysis
      const aiAnalysis = await aiAnalyzer.analyzeEPRRecord(record, cncData);

      // Update record
      db.updateEPRRecord(id, {
        status: req.body.status || 'completed',
        end_time: Date.now(),
        quality_score: parseFloat(req.body.quality_score) || null,
        defect_count: parseInt(req.body.defect_count) || 0,
        notes: req.body.notes || record.notes,
        ai_analysis: aiAnalysis
      });

      res.json({ success: true, message: 'EPR record completed with AI analysis', aiAnalysis });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get AI analysis for specific record
  router.get('/:id/analyze', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const records = db.getEPRRecords(1000);
      const record = records.find(r => r.id === id);

      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      const cncData = db.getCNCData(1000).filter(d => d.machine_id === record.machine_id);
      const analysis = await aiAnalyzer.analyzeEPRRecord(record, cncData);

      res.json({ success: true, analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
