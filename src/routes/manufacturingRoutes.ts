/**
 * J2K CNC Manufacturing Routes
 * Bridges local CNC sensor data with ERPNext Manufacturing module.
 *
 * GET  /api/manufacturing/status              - connection status
 * GET  /api/manufacturing/work-orders         - active work orders from ERPNext
 * GET  /api/manufacturing/work-orders/:id     - single work order
 * GET  /api/manufacturing/work-orders/:id/efficiency  - AI efficiency analysis
 * GET  /api/manufacturing/work-orders/:id/optimize    - AI optimisation tips
 * POST /api/manufacturing/job-cards/:id/sync-cnc      - push CNC sensor data to job card
 * GET  /api/manufacturing/work-centers        - ERPNext work centres
 * GET  /api/manufacturing/work-centers/performance    - AI work centre analysis
 */

import { Router, Request, Response } from 'express';
import { J2KManufacturingService } from '../services/j2kManufacturing';
import { DatabaseManager } from '../database/schema';

export function createManufacturingRoutes(
  db: DatabaseManager,
  j2k: J2KManufacturingService
): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({
      success: true,
      erpnextConfigured: j2k['erpnext'].isConfigured,
      aiConfigured: j2k.isConfigured,
      warehouse: process.env.J2K_WAREHOUSE || 'Main Warehouse',
      workCenter: process.env.J2K_WORK_CENTER || 'CNC Work Center',
    });
  });

  router.get('/work-orders', async (_req: Request, res: Response) => {
    try {
      const orders = await j2k.getActiveWorkOrders();
      res.json({ success: true, data: orders, count: orders.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/work-orders/:id', async (req: Request, res: Response) => {
    try {
      const wo = await j2k.getWorkOrder(req.params.id);
      res.json({ success: true, data: wo });
    } catch (err) {
      res.status(404).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/work-orders/:id/efficiency', async (req: Request, res: Response) => {
    try {
      const wo = await j2k.getWorkOrder(req.params.id);
      const jobCards = await j2k.getJobCardsForWorkOrder(req.params.id);
      const cncData = db.getCNCData(500).filter(d => d.machine_id === wo.work_center);

      const result = await j2k.analyzeProductionEfficiency(wo, jobCards, cncData);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/work-orders/:id/optimize', async (req: Request, res: Response) => {
    try {
      const wo = await j2k.getWorkOrder(req.params.id);
      const [jobCards, bom] = await Promise.all([
        j2k.getJobCardsForWorkOrder(req.params.id),
        j2k.getBOM(wo.bom_no),
      ]);

      const result = await j2k.optimizeWorkOrder(wo, bom, jobCards);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.post('/job-cards/:id/sync-cnc', async (req: Request, res: Response) => {
    try {
      const machineId = req.body.machine_id as string;
      const limit = parseInt(req.body.limit) || 100;
      const cncData = machineId
        ? db.getCNCData(limit).filter(d => d.machine_id === machineId)
        : db.getCNCData(limit);

      const result = await j2k.syncCNCDataToJobCard(req.params.id, cncData);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/work-centers', async (_req: Request, res: Response) => {
    try {
      const wcs = await j2k.getWorkCenters();
      res.json({ success: true, data: wcs, count: wcs.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/work-centers/performance', async (_req: Request, res: Response) => {
    try {
      const wcs = await j2k.getWorkCenters();
      const cncData = db.getCNCData(200);
      const analysis = await j2k.analyzeWorkCenterPerformance(wcs, cncData);
      res.json({ success: true, analysis });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
