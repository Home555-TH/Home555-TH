import Database from 'better-sqlite3';
import { join } from 'path';

export interface CNCMachineData {
  id: string;
  machine_id: string;
  machine_name: string;
  status: 'running' | 'idle' | 'maintenance' | 'error';
  operation_type: string;
  speed_rpm: number;
  feed_rate: number;
  temperature: number;
  coordinates_x: number;
  coordinates_y: number;
  coordinates_z: number;
  program_name: string;
  timestamp: number;
  synced_to_sheets: number;
}

export interface EPRRecord {
  id: string;
  production_order: string;
  part_number: string;
  part_name: string;
  quantity: number;
  machine_id: string;
  operator_name: string;
  start_time: number;
  end_time: number | null;
  status: 'in_progress' | 'completed' | 'failed' | 'quality_check';
  quality_score: number | null;
  defect_count: number;
  notes: string;
  ai_analysis: string | null;
  synced_to_sheets: number;
}

// ─── Medication / ERPNext Cache Types ─────────────────────────────────────────

export interface MedicationAnalysisRecord {
  id: string;
  analysis_type: string;           // interaction | dosage | expiry | reorder | patient | stock
  reference_id: string;            // ERPNext doc name (prescription, patient, etc.)
  reference_name: string;          // human-readable name
  result_json: string;             // JSON-serialised AI result
  alert_count: number;
  created_at: number;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || process.env.DATABASE_PATH || './data/cnc-epr.db';
    this.db = new Database(path);
    this.initializeTables();
  }

  private initializeTables() {
    // Create CNC Machine Data table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cnc_machine_data (
        id TEXT PRIMARY KEY,
        machine_id TEXT NOT NULL,
        machine_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('running', 'idle', 'maintenance', 'error')),
        operation_type TEXT NOT NULL,
        speed_rpm REAL NOT NULL,
        feed_rate REAL NOT NULL,
        temperature REAL NOT NULL,
        coordinates_x REAL NOT NULL,
        coordinates_y REAL NOT NULL,
        coordinates_z REAL NOT NULL,
        program_name TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced_to_sheets INTEGER DEFAULT 0
      );
    `);

    // Create EPR Records table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS epr_records (
        id TEXT PRIMARY KEY,
        production_order TEXT NOT NULL,
        part_number TEXT NOT NULL,
        part_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        machine_id TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'failed', 'quality_check')),
        quality_score REAL,
        defect_count INTEGER DEFAULT 0,
        notes TEXT,
        ai_analysis TEXT,
        synced_to_sheets INTEGER DEFAULT 0
      );
    `);

    // Create medication analysis cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS medication_analysis (
        id TEXT PRIMARY KEY,
        analysis_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        reference_name TEXT NOT NULL,
        result_json TEXT NOT NULL,
        alert_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cnc_machine_id ON cnc_machine_data(machine_id);
      CREATE INDEX IF NOT EXISTS idx_cnc_timestamp ON cnc_machine_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cnc_synced ON cnc_machine_data(synced_to_sheets);

      CREATE INDEX IF NOT EXISTS idx_epr_production_order ON epr_records(production_order);
      CREATE INDEX IF NOT EXISTS idx_epr_machine_id ON epr_records(machine_id);
      CREATE INDEX IF NOT EXISTS idx_epr_status ON epr_records(status);
      CREATE INDEX IF NOT EXISTS idx_epr_synced ON epr_records(synced_to_sheets);

      CREATE INDEX IF NOT EXISTS idx_med_analysis_type ON medication_analysis(analysis_type);
      CREATE INDEX IF NOT EXISTS idx_med_reference_id ON medication_analysis(reference_id);
      CREATE INDEX IF NOT EXISTS idx_med_created_at ON medication_analysis(created_at);
    `);
  }

  // CNC Machine Data methods
  insertCNCData(data: Omit<CNCMachineData, 'synced_to_sheets'>) {
    const stmt = this.db.prepare(`
      INSERT INTO cnc_machine_data
      (id, machine_id, machine_name, status, operation_type, speed_rpm, feed_rate,
       temperature, coordinates_x, coordinates_y, coordinates_z, program_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      data.id, data.machine_id, data.machine_name, data.status, data.operation_type,
      data.speed_rpm, data.feed_rate, data.temperature, data.coordinates_x,
      data.coordinates_y, data.coordinates_z, data.program_name, data.timestamp
    );
  }

  getCNCData(limit = 100): CNCMachineData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM cnc_machine_data
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as CNCMachineData[];
  }

  getUnsyncedCNCData(): CNCMachineData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM cnc_machine_data
      WHERE synced_to_sheets = 0
      ORDER BY timestamp ASC
    `);
    return stmt.all() as CNCMachineData[];
  }

  markCNCDataAsSynced(ids: string[]) {
    const stmt = this.db.prepare(`
      UPDATE cnc_machine_data
      SET synced_to_sheets = 1
      WHERE id = ?
    `);

    const updateMany = this.db.transaction((ids: string[]) => {
      for (const id of ids) {
        stmt.run(id);
      }
    });

    updateMany(ids);
  }

  // EPR Record methods
  insertEPRRecord(data: Omit<EPRRecord, 'synced_to_sheets'>) {
    const stmt = this.db.prepare(`
      INSERT INTO epr_records
      (id, production_order, part_number, part_name, quantity, machine_id, operator_name,
       start_time, end_time, status, quality_score, defect_count, notes, ai_analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      data.id, data.production_order, data.part_number, data.part_name, data.quantity,
      data.machine_id, data.operator_name, data.start_time, data.end_time, data.status,
      data.quality_score, data.defect_count, data.notes, data.ai_analysis
    );
  }

  getEPRRecords(limit = 100): EPRRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM epr_records
      ORDER BY start_time DESC
      LIMIT ?
    `);
    return stmt.all(limit) as EPRRecord[];
  }

  getUnsyncedEPRRecords(): EPRRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM epr_records
      WHERE synced_to_sheets = 0
      ORDER BY start_time ASC
    `);
    return stmt.all() as EPRRecord[];
  }

  markEPRRecordsAsSynced(ids: string[]) {
    const stmt = this.db.prepare(`
      UPDATE epr_records
      SET synced_to_sheets = 1
      WHERE id = ?
    `);

    const updateMany = this.db.transaction((ids: string[]) => {
      for (const id of ids) {
        stmt.run(id);
      }
    });

    updateMany(ids);
  }

  updateEPRRecord(id: string, updates: Partial<EPRRecord>) {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);

    const stmt = this.db.prepare(`
      UPDATE epr_records
      SET ${fields}
      WHERE id = ?
    `);

    return stmt.run(...values, id);
  }

  // ─── Medication Analysis Cache ─────────────────────────────────────────────

  insertMedicationAnalysis(record: MedicationAnalysisRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO medication_analysis
      (id, analysis_type, reference_id, reference_name, result_json, alert_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      record.id, record.analysis_type, record.reference_id, record.reference_name,
      record.result_json, record.alert_count, record.created_at
    );
  }

  getMedicationAnalyses(type?: string, limit = 50): MedicationAnalysisRecord[] {
    if (type) {
      const stmt = this.db.prepare(`
        SELECT * FROM medication_analysis WHERE analysis_type = ?
        ORDER BY created_at DESC LIMIT ?
      `);
      return stmt.all(type, limit) as MedicationAnalysisRecord[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM medication_analysis ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as MedicationAnalysisRecord[];
  }

  getLatestMedicationAnalysis(type: string, referenceId: string): MedicationAnalysisRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM medication_analysis
      WHERE analysis_type = ? AND reference_id = ?
      ORDER BY created_at DESC LIMIT 1
    `);
    return (stmt.get(type, referenceId) as MedicationAnalysisRecord) || null;
  }

  close() {
    this.db.close();
  }
}
