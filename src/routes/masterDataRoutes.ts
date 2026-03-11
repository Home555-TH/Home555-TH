/**
 * Master Data Migration / Docking Routes
 *
 * POST /api/master-data/export/:doctype         - push local records to ERPNext
 * POST /api/master-data/import/:doctype         - pull from ERPNext to local JSON
 * POST /api/master-data/validate/:doctype       - dry-run validation
 * POST /api/master-data/diff/:doctype           - diff local vs ERPNext
 * POST /api/master-data/csv/:doctype            - import from CSV text body
 *
 * Supported doctypes: Item | Customer | Supplier | Work Center | BOM | Warehouse | Item Price
 */

import { Router, Request, Response } from 'express';
import {
  MasterDataMigrationService,
  MigrationDoctype,
} from '../services/masterDataMigration';

const VALID_DOCTYPES: MigrationDoctype[] = [
  'Item', 'Customer', 'Supplier', 'Work Center', 'BOM', 'Warehouse', 'Item Price',
];

function parseDoctype(raw: string): MigrationDoctype | null {
  // accept both 'item' and 'Item', 'work-center' and 'Work Center'
  const normalised = raw.replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') as MigrationDoctype;
  return VALID_DOCTYPES.includes(normalised) ? normalised : null;
}

export function createMasterDataRoutes(
  migration: MasterDataMigrationService
): Router {
  const router = Router();

  // List supported doctypes
  router.get('/doctypes', (_req, res) => {
    res.json({ success: true, doctypes: VALID_DOCTYPES });
  });

  /**
   * POST /api/master-data/export/:doctype
   * Body: { records: [...], upsert?: boolean }
   */
  router.post('/export/:doctype', async (req: Request, res: Response) => {
    const doctype = parseDoctype(req.params.doctype);
    if (!doctype) {
      return res.status(400).json({
        success: false,
        error: `Unknown doctype. Use one of: ${VALID_DOCTYPES.join(', ')}`,
      });
    }

    const records: Record<string, unknown>[] = req.body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'records[] array required in body' });
    }

    try {
      const result = await migration.exportToERPNext(doctype, records, req.body.upsert === true);
      res.json({
        success: true,
        report: migration.formatReport(result),
        result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * GET /api/master-data/import/:doctype?limit=500&fields=name,item_name
   */
  router.get('/import/:doctype', async (req: Request, res: Response) => {
    const doctype = parseDoctype(req.params.doctype);
    if (!doctype) {
      return res.status(400).json({
        success: false,
        error: `Unknown doctype. Use one of: ${VALID_DOCTYPES.join(', ')}`,
      });
    }

    try {
      const fields = req.query.fields
        ? String(req.query.fields).split(',').map(f => f.trim())
        : ['name'];
      const limit = parseInt(req.query.limit as string) || 500;

      const result = await migration.importFromERPNext(doctype, fields, [], limit);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/master-data/validate/:doctype
   * Body: { records: [...] }
   */
  router.post('/validate/:doctype', async (req: Request, res: Response) => {
    const doctype = parseDoctype(req.params.doctype);
    if (!doctype) {
      return res.status(400).json({
        success: false,
        error: `Unknown doctype. Use one of: ${VALID_DOCTYPES.join(', ')}`,
      });
    }

    const records: Record<string, unknown>[] = req.body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'records[] array required in body' });
    }

    try {
      const result = await migration.validateMigration(doctype, records);
      res.json({
        success: true,
        report: migration.formatReport(result),
        result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/master-data/diff/:doctype
   * Body: { records: [...], compare_fields: [...] }
   */
  router.post('/diff/:doctype', async (req: Request, res: Response) => {
    const doctype = parseDoctype(req.params.doctype);
    if (!doctype) {
      return res.status(400).json({
        success: false,
        error: `Unknown doctype. Use one of: ${VALID_DOCTYPES.join(', ')}`,
      });
    }

    const records: Record<string, unknown>[] = req.body.records;
    const compareFields: string[] = req.body.compare_fields || ['name'];

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'records[] required' });
    }

    try {
      const diffs = await migration.diffWithERPNext(doctype, records, compareFields);
      const summary = {
        new: diffs.filter(d => d.status === 'new').length,
        changed: diffs.filter(d => d.status === 'changed').length,
        unchanged: diffs.filter(d => d.status === 'unchanged').length,
      };
      res.json({ success: true, summary, diffs });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/master-data/csv/:doctype
   * Body: { headers: ["col1","col2",...], rows: [["val1","val2",...], ...], upsert?: boolean }
   */
  router.post('/csv/:doctype', async (req: Request, res: Response) => {
    const doctype = parseDoctype(req.params.doctype);
    if (!doctype) {
      return res.status(400).json({
        success: false,
        error: `Unknown doctype. Use one of: ${VALID_DOCTYPES.join(', ')}`,
      });
    }

    const { headers, rows, upsert } = req.body;
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'headers[] and rows[][] required' });
    }

    try {
      const records = migration.parseCsvRows(doctype, headers, rows);
      const result = await migration.exportToERPNext(doctype, records, upsert === true);
      res.json({
        success: true,
        report: migration.formatReport(result),
        result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
