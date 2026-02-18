/**
 * ERPNext REST API Client
 * Connects to ERPNext core system for medication/healthcare data.
 *
 * Architecture:
 *   ERPNext (core ERP) <--REST--> This AI Bridge <---> AI Layer
 *
 * Auth: API Key + Secret (ERPNext token-based auth)
 * Docs: https://frappeframework.com/docs/user/en/api/rest
 */

export interface ERPNextConfig {
  baseUrl: string;       // e.g. https://your-erp.frappe.cloud
  apiKey: string;        // from ERPNext > User > API Access
  apiSecret: string;
}

export interface ERPNextItem {
  name: string;          // item code (PK)
  item_name: string;
  item_group: string;
  description: string;
  stock_uom: string;
  is_stock_item: number;
  disabled: number;
  // Healthcare/Medication specific
  generic_name?: string;
  drug_strength?: string;
  drug_form?: string;    // tablet, capsule, injection, syrup ...
  controlled_substance?: number;
  reorder_level?: number;
  reorder_qty?: number;
}

export interface ERPNextStockBalance {
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  valuation_rate: number;
  stock_value: number;
}

export interface ERPNextPrescription {
  name: string;
  patient: string;
  patient_name: string;
  practitioner: string;
  encounter_date: string;
  medications: ERPNextPrescriptionItem[];
  status: string;
}

export interface ERPNextPrescriptionItem {
  drug: string;
  drug_name: string;
  dosage: string;
  dosage_form: string;
  period: string;
  period_based_on: string;
  quantity: number;
  instructions: string;
}

export interface ERPNextPatient {
  name: string;
  patient_name: string;
  dob: string;
  sex: string;
  blood_group: string;
  allergies?: string;
  chronic_conditions?: string;
}

export interface ERPNextStockEntry {
  name: string;
  stock_entry_type: string;   // Material Issue / Material Receipt / Transfer
  posting_date: string;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    batch_no?: string;
    expiry_date?: string;
  }>;
}

export interface ERPNextBatchExpiry {
  item_code: string;
  item_name: string;
  batch_id: string;
  expiry_date: string;
  qty: number;
  warehouse: string;
}

export class ERPNextClient {
  private config: ERPNextConfig;
  private authHeader: string;

  constructor(config?: ERPNextConfig) {
    this.config = config || {
      baseUrl: process.env.ERPNEXT_BASE_URL || '',
      apiKey: process.env.ERPNEXT_API_KEY || '',
      apiSecret: process.env.ERPNEXT_API_SECRET || '',
    };

    // ERPNext token auth: "token apiKey:apiSecret"
    this.authHeader = `token ${this.config.apiKey}:${this.config.apiSecret}`;
  }

  get isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.apiKey && this.config.apiSecret);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('ERPNext not configured. Set ERPNEXT_BASE_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET in .env');
    }

    const url = `${this.config.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext API error ${response.status}: ${text}`);
    }

    const json = await response.json() as { data?: T; message?: T };
    // ERPNext wraps responses in { data: ... } or { message: ... }
    return (json.data ?? json.message ?? json) as T;
  }

  // ─── Generic Resource API ───────────────────────────────────────────────────

  async getList<T>(
    doctype: string,
    fields: string[] = ['name'],
    filters: Array<[string, string, string]> = [],
    limit = 100
  ): Promise<T[]> {
    const params = new URLSearchParams({
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: String(limit),
    });
    return this.request<T[]>('GET', `/api/resource/${encodeURIComponent(doctype)}?${params}`);
  }

  async getDoc<T>(doctype: string, name: string): Promise<T> {
    return this.request<T>('GET', `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
  }

  async createDoc<T>(doctype: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', `/api/resource/${encodeURIComponent(doctype)}`, data);
  }

  async updateDoc<T>(doctype: string, name: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>('PUT', `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, data);
  }

  async callMethod<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
    const params = new URLSearchParams(
      Object.entries(args).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    );
    return this.request<T>('GET', `/api/method/${method}?${params}`);
  }

  // ─── Medication / Healthcare Domain Methods ──────────────────────────────────

  async getMedicationItems(limit = 200): Promise<ERPNextItem[]> {
    return this.getList<ERPNextItem>(
      'Item',
      ['name', 'item_name', 'item_group', 'description', 'stock_uom',
       'generic_name', 'drug_strength', 'drug_form', 'controlled_substance',
       'reorder_level', 'reorder_qty', 'disabled'],
      [['item_group', 'like', '%Medication%'], ['disabled', '=', '0']],
      limit
    );
  }

  async getStockBalance(warehouse?: string): Promise<ERPNextStockBalance[]> {
    const filters: Array<[string, string, string]> = [];
    if (warehouse) filters.push(['warehouse', '=', warehouse]);

    return this.callMethod<ERPNextStockBalance[]>(
      'erpnext.stock.utils.get_stock_balance',
      warehouse ? { warehouse } : {}
    );
  }

  async getLowStockItems(warehouse?: string): Promise<ERPNextStockBalance[]> {
    // Uses ERPNext Report API for Itemwise Recommended Reorder Level
    const params = new URLSearchParams({
      report_name: 'Itemwise Recommended Reorder Level',
      filters: JSON.stringify({ warehouse: warehouse || '' }),
    });
    return this.request<ERPNextStockBalance[]>(
      'GET',
      `/api/method/frappe.desk.query_report.run?${params}`
    );
  }

  async getActivePrescriptions(limit = 50): Promise<ERPNextPrescription[]> {
    const list = await this.getList<{ name: string }>(
      'Patient Encounter',
      ['name'],
      [['docstatus', '=', '1']],
      limit
    );

    // Fetch full documents in parallel (up to 10 at a time)
    const results: ERPNextPrescription[] = [];
    for (let i = 0; i < Math.min(list.length, 10); i++) {
      try {
        const doc = await this.getDoc<ERPNextPrescription>('Patient Encounter', list[i].name);
        results.push(doc);
      } catch {
        // skip docs that can't be fetched
      }
    }
    return results;
  }

  async getPatient(patientId: string): Promise<ERPNextPatient> {
    return this.getDoc<ERPNextPatient>('Patient', patientId);
  }

  async getExpiringBatches(daysAhead = 90): Promise<ERPNextBatchExpiry[]> {
    const today = new Date();
    const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const toISO = (d: Date) => d.toISOString().split('T')[0];

    return this.getList<ERPNextBatchExpiry>(
      'Batch',
      ['name as batch_id', 'item', 'item_name', 'expiry_date', 'batch_qty as qty'],
      [
        ['expiry_date', '>=', toISO(today)],
        ['expiry_date', '<=', toISO(future)],
        ['batch_qty', '>', '0'],
      ],
      200
    );
  }

  async getRecentStockMovements(itemCode?: string, limit = 100): Promise<ERPNextStockEntry[]> {
    const filters: Array<[string, string, string]> = [['docstatus', '=', '1']];
    if (itemCode) filters.push(['items.item_code', '=', itemCode]);

    return this.getList<ERPNextStockEntry>(
      'Stock Entry',
      ['name', 'stock_entry_type', 'posting_date'],
      filters,
      limit
    );
  }

  // ─── Health Check ────────────────────────────────────────────────────────────

  async ping(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const result = await this.callMethod<{ message: string }>(
        'frappe.utils.ping'
      );
      return { connected: true, version: result?.message };
    } catch (err) {
      return { connected: false, error: (err as Error).message };
    }
  }
}
