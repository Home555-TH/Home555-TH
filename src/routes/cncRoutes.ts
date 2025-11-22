import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/schema';
import { AIAnalyzer } from '../services/aiAnalyzer';

export function createCNCRoutes(db: DatabaseManager, aiAnalyzer: AIAnalyzer): Router {
  const router = Router();

  // Get all CNC data
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const data = db.getCNCData(limit);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Add new CNC machine data
  router.post('/', async (req: Request, res: Response) => {
    try {
      const data = {
        id: uuidv4(),
        machine_id: req.body.machine_id,
        machine_name: req.body.machine_name,
        status: req.body.status,
        operation_type: req.body.operation_type,
        speed_rpm: parseFloat(req.body.speed_rpm),
        feed_rate: parseFloat(req.body.feed_rate),
        temperature: parseFloat(req.body.temperature),
        coordinates_x: parseFloat(req.body.coordinates_x),
        coordinates_y: parseFloat(req.body.coordinates_y),
        coordinates_z: parseFloat(req.body.coordinates_z),
        program_name: req.body.program_name,
        timestamp: Date.now()
      };

      db.insertCNCData(data);
      res.json({ success: true, data, message: 'CNC data recorded successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  });

  // Get AI analysis of CNC data
  router.get('/analyze', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const machineId = req.query.machine_id as string;

      let data = db.getCNCData(limit);
      if (machineId) {
        data = data.filter(d => d.machine_id === machineId);
      }

      const analysis = await aiAnalyzer.analyzeCNCData(data);
      res.json({ success: true, analysis, dataPoints: data.length });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Detect anomalies
  router.get('/anomalies', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const data = db.getCNCData(limit);

      const result = await aiAnalyzer.detectAnomalies(data);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Predict maintenance needs
  router.get('/maintenance/:machineId', async (req: Request, res: Response) => {
    try {
      const { machineId } = req.params;
      const data = db.getCNCData(500);

      const prediction = await aiAnalyzer.predictMaintenanceNeeds(machineId, data);
      res.json({ success: true, machineId, prediction });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
