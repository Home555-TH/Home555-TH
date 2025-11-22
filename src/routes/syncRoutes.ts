import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/schema';
import { GoogleSheetsService } from '../services/googleSheets';

export function createSyncRoutes(db: DatabaseManager, sheetsService: GoogleSheetsService): Router {
  const router = Router();

  // Manual sync of CNC data to Google Sheets
  router.post('/cnc', async (req: Request, res: Response) => {
    try {
      const unsyncedData = db.getUnsyncedCNCData();

      if (unsyncedData.length === 0) {
        return res.json({ success: true, message: 'No data to sync', synced: 0 });
      }

      const syncedIds = await sheetsService.syncCNCData(unsyncedData);
      db.markCNCDataAsSynced(syncedIds);

      res.json({
        success: true,
        message: 'CNC data synced successfully',
        synced: syncedIds.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Manual sync of EPR records to Google Sheets
  router.post('/epr', async (req: Request, res: Response) => {
    try {
      const unsyncedRecords = db.getUnsyncedEPRRecords();

      if (unsyncedRecords.length === 0) {
        return res.json({ success: true, message: 'No records to sync', synced: 0 });
      }

      const syncedIds = await sheetsService.syncEPRRecords(unsyncedRecords);
      db.markEPRRecordsAsSynced(syncedIds);

      res.json({
        success: true,
        message: 'EPR records synced successfully',
        synced: syncedIds.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Sync both CNC and EPR data
  router.post('/all', async (req: Request, res: Response) => {
    try {
      const unsyncedCNC = db.getUnsyncedCNCData();
      const unsyncedEPR = db.getUnsyncedEPRRecords();

      let cncSynced = 0;
      let eprSynced = 0;

      if (unsyncedCNC.length > 0) {
        const syncedIds = await sheetsService.syncCNCData(unsyncedCNC);
        db.markCNCDataAsSynced(syncedIds);
        cncSynced = syncedIds.length;
      }

      if (unsyncedEPR.length > 0) {
        const syncedIds = await sheetsService.syncEPRRecords(unsyncedEPR);
        db.markEPRRecordsAsSynced(syncedIds);
        eprSynced = syncedIds.length;
      }

      res.json({
        success: true,
        message: 'All data synced successfully',
        cncSynced,
        eprSynced,
        total: cncSynced + eprSynced
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get sync status
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const unsyncedCNC = db.getUnsyncedCNCData();
      const unsyncedEPR = db.getUnsyncedEPRRecords();

      res.json({
        success: true,
        status: {
          cncPending: unsyncedCNC.length,
          eprPending: unsyncedEPR.length,
          totalPending: unsyncedCNC.length + unsyncedEPR.length
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
