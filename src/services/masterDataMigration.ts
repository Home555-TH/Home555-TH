/**
 * Master Data Migration / Docking Service
 *
 * Handles bidirectional master data synchronisation between:
 *   Local SQLite (legacy / CNC system)  ↔  ERPNext (core ERP)
 *
 * Supported doctypes for migration:
 *   - Items (medications, CNC parts, raw materials)
 *   - Customers
 *   - Suppliers
 *   - Work Centers (CNC machine definitions)
 *   - BOMs (Bill of Materials)
 *   - Warehouses
 *   - Price Lists
 *
 * Migration modes:
 *   - EXPORT  : local CSV/JSON  →  ERPNext (initial load)
 *   - IMPORT  : ERPNext         →  local cache
 *   - VALIDATE: dry-run check before committing
 *   - DIFF    : show what has changed since last sync
 */

import { ERPNextClient } from './erpnext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MigrationDoctype =
  | 'Item'
  | 'Customer'
  | 'Supplier'
  | 'Work Center'
  | 'BOM'
  | 'Warehouse'
  | 'Item Price';

export type MigrationMode = 'export' | 'import' | 'validate' | 'diff';

export interface MigrationRecord {
  doctype: MigrationDoctype;
  name: string;
  action: 'create' | 'update' | 'skip' | 'error';
  message: string;
}

export interface MigrationResult {
  doctype: MigrationDoctype;
  mode: MigrationMode;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  records: MigrationRecord[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface MigrationJob {
  id: string;
  doctype: MigrationDoctype;
  mode: MigrationMode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: MigrationResult;
  createdAt: number;
}

// ─── Field Mappings ───────────────────────────────────────────────────────────
// Map legacy / CSV field names to ERPNext field names

const FIELD_MAPS: Record<string, Record<string, string>> = {
  Item: {
    code:          'item_code',
    name:          'item_name',
    group:         'item_group',
    unit:          'stock_uom',
    description:   'description',
    type:          'item_group',
    active:        'disabled',   // inverted: active=1 → disabled=0
    reorder_pt:    'reorder_level',
    reorder_qty:   'reorder_qty',
  },
  Customer: {
    code:          'name',
    name:          'customer_name',
    group:         'customer_group',
    territory:     'territory',
    type:          'customer_type',
    credit:        'credit_limit',
  },
  Supplier: {
    code:          'name',
    name:          'supplier_name',
    group:         'supplier_group',
    country:       'country',
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class MasterDataMigrationService {
  constructor(private erpnext: ERPNextClient) {}

  /**
   * Map a raw record (CSV row / legacy object) to ERPNext fields.
   */
  mapFields(
    doctype: MigrationDoctype,
    raw: Record<string, unknown>
  ): Record<string, unknown> {
    const map = FIELD_MAPS[doctype];
    if (!map) return raw;

    const mapped: Record<string, unknown> = {};
    for (const [src, dest] of Object.entries(map)) {
      if (raw[src] !== undefined) {
        if (dest === 'disabled' && src === 'active') {
          mapped[dest] = raw[src] ? 0 : 1;
        } else {
          mapped[dest] = raw[src];
        }
      }
    }
    // also keep unmapped fields
    for (const [k, v] of Object.entries(raw)) {
      if (!map[k]) mapped[k] = v;
    }
    return mapped;
  }

  /**
   * EXPORT: push an array of local records into ERPNext.
   * Skips records that already exist (by name).
   */
  async exportToERPNext(
    doctype: MigrationDoctype,
    records: Record<string, unknown>[],
    upsert = false
  ): Promise<MigrationResult> {
    const start = Date.now();
    const result: MigrationResult = {
      doctype,
      mode: 'export',
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      records: [],
      startedAt: new Date(start).toISOString(),
      completedAt: '',
      durationMs: 0,
    };

    for (const raw of records) {
      const mapped = this.mapFields(doctype, raw);
      const name = String(mapped.name || mapped.item_code || mapped.customer_name || '');

      try {
        // Check if exists
        let exists = false;
        try {
          await this.erpnext.getDoc(doctype, name);
          exists = true;
        } catch { /* not found = create */ }

        if (exists && !upsert) {
          result.skipped++;
          result.records.push({ doctype, name, action: 'skip', message: 'Already exists' });
          continue;
        }

        if (exists && upsert) {
          await this.erpnext.updateDoc(doctype, name, mapped);
          result.updated++;
          result.records.push({ doctype, name, action: 'update', message: 'Updated' });
        } else {
          await this.erpnext.createDoc(doctype, { ...mapped, doctype });
          result.created++;
          result.records.push({ doctype, name, action: 'create', message: 'Created' });
        }
      } catch (err) {
        result.errors++;
        result.records.push({
          doctype,
          name,
          action: 'error',
          message: (err as Error).message,
        });
      }
    }

    result.completedAt = new Date().toISOString();
    result.durationMs = Date.now() - start;
    return result;
  }

  /**
   * IMPORT: fetch master data from ERPNext into a local JSON structure.
   * Used to seed local cache or for offline reporting.
   */
  async importFromERPNext(
    doctype: MigrationDoctype,
    fields: string[] = ['name'],
    filters: Array<[string, string, string]> = [],
    limit = 500
  ): Promise<{ doctype: MigrationDoctype; count: number; data: unknown[] }> {
    const data = await this.erpnext.getList(doctype, fields, filters, limit);
    return { doctype, count: data.length, data };
  }

  /**
   * VALIDATE: dry-run — check records against ERPNext without writing.
   * Returns what would be created / updated / skipped.
   */
  async validateMigration(
    doctype: MigrationDoctype,
    records: Record<string, unknown>[]
  ): Promise<MigrationResult> {
    const start = Date.now();
    const result: MigrationResult = {
      doctype,
      mode: 'validate',
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      records: [],
      startedAt: new Date(start).toISOString(),
      completedAt: '',
      durationMs: 0,
    };

    for (const raw of records) {
      const mapped = this.mapFields(doctype, raw);
      const name = String(mapped.name || mapped.item_code || mapped.customer_name || '');

      // Check required fields
      const missing: string[] = [];
      if (!name) missing.push('name/item_code');

      if (missing.length > 0) {
        result.errors++;
        result.records.push({
          doctype, name: name || '(unknown)',
          action: 'error',
          message: `Missing required fields: ${missing.join(', ')}`,
        });
        continue;
      }

      try {
        await this.erpnext.getDoc(doctype, name);
        result.updated++;
        result.records.push({ doctype, name, action: 'update', message: '[DRY-RUN] Would update' });
      } catch {
        result.created++;
        result.records.push({ doctype, name, action: 'create', message: '[DRY-RUN] Would create' });
      }
    }

    result.completedAt = new Date().toISOString();
    result.durationMs = Date.now() - start;
    return result;
  }

  /**
   * DIFF: compare local records against ERPNext and return differences.
   */
  async diffWithERPNext(
    doctype: MigrationDoctype,
    localRecords: Record<string, unknown>[],
    compareFields: string[]
  ): Promise<Array<{
    name: string;
    status: 'new' | 'changed' | 'unchanged' | 'deleted';
    localValues: Record<string, unknown>;
    erpnextValues: Record<string, unknown>;
    changedFields: string[];
  }>> {
    const results = [];

    for (const raw of localRecords) {
      const mapped = this.mapFields(doctype, raw);
      const name = String(mapped.name || mapped.item_code || '');

      try {
        const remote = await this.erpnext.getDoc<Record<string, unknown>>(doctype, name);
        const changedFields: string[] = [];

        for (const field of compareFields) {
          if (String(mapped[field] ?? '') !== String(remote[field] ?? '')) {
            changedFields.push(field);
          }
        }

        results.push({
          name,
          status: changedFields.length > 0 ? 'changed' : 'unchanged',
          localValues: Object.fromEntries(compareFields.map(f => [f, mapped[f]])),
          erpnextValues: Object.fromEntries(compareFields.map(f => [f, remote[f]])),
          changedFields,
        } as const);
      } catch {
        results.push({
          name,
          status: 'new' as const,
          localValues: Object.fromEntries(compareFields.map(f => [f, mapped[f]])),
          erpnextValues: {},
          changedFields: [],
        });
      }
    }

    return results;
  }

  /**
   * Bulk import items from CSV rows (header-mapped).
   * Headers are automatically normalised to ERPNext field names.
   */
  parseCsvRows(
    doctype: MigrationDoctype,
    headers: string[],
    rows: string[][]
  ): Record<string, unknown>[] {
    return rows.map(row => {
      const raw: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        raw[h.trim().toLowerCase().replace(/\s+/g, '_')] = row[i]?.trim() ?? '';
      });
      return this.mapFields(doctype, raw);
    });
  }

  /**
   * Generate a migration summary report.
   */
  formatReport(result: MigrationResult): string {
    const lines = [
      `=== Migration Report ===`,
      `Doctype  : ${result.doctype}`,
      `Mode     : ${result.mode}`,
      `Started  : ${result.startedAt}`,
      `Duration : ${result.durationMs}ms`,
      ``,
      `Total    : ${result.total}`,
      `Created  : ${result.created}`,
      `Updated  : ${result.updated}`,
      `Skipped  : ${result.skipped}`,
      `Errors   : ${result.errors}`,
      ``,
    ];

    if (result.errors > 0) {
      lines.push('--- Errors ---');
      result.records
        .filter(r => r.action === 'error')
        .forEach(r => lines.push(`  ${r.name}: ${r.message}`));
    }

    return lines.join('\n');
  }
}
