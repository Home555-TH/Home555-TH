import { DatabaseManager } from '../database/schema';
import { v4 as uuidv4 } from 'uuid';

// Sample data generator for CNC ePR system
export class SampleDataGenerator {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  generateCNCData(count: number = 50) {
    const machines = [
      { id: 'CNC-001', name: 'Haas VF-2' },
      { id: 'CNC-002', name: 'DMG Mori NLX2500' },
      { id: 'CNC-003', name: 'Mazak Integrex i-200' },
      { id: 'CNC-004', name: 'Okuma MB-5000H' },
      { id: 'CNC-005', name: 'Fanuc Robodrill' }
    ];

    const operations = ['Milling', 'Turning', 'Drilling', 'Boring', 'Threading'];
    const statuses: Array<'running' | 'idle' | 'maintenance' | 'error'> = ['running', 'idle', 'maintenance', 'error'];
    const programs = ['PART_001.nc', 'PART_002.nc', 'PART_003.nc', 'ENGINE_BLOCK.nc', 'SHAFT_TURN.nc'];

    console.log(`Generating ${count} CNC data records...`);

    for (let i = 0; i < count; i++) {
      const machine = machines[Math.floor(Math.random() * machines.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Adjust parameters based on status
      const baseSpeed = status === 'running' ? 2500 + Math.random() * 2000 : Math.random() * 500;
      const baseTemp = status === 'running' ? 40 + Math.random() * 15 : 20 + Math.random() * 10;

      const data = {
        id: uuidv4(),
        machine_id: machine.id,
        machine_name: machine.name,
        status: status,
        operation_type: operations[Math.floor(Math.random() * operations.length)],
        speed_rpm: Math.round(baseSpeed),
        feed_rate: Math.round((50 + Math.random() * 150) * 10) / 10,
        temperature: Math.round(baseTemp * 10) / 10,
        coordinates_x: Math.round((Math.random() * 300 - 150) * 100) / 100,
        coordinates_y: Math.round((Math.random() * 300 - 150) * 100) / 100,
        coordinates_z: Math.round((Math.random() * 200 - 50) * 100) / 100,
        program_name: programs[Math.floor(Math.random() * programs.length)],
        timestamp: Date.now() - (count - i) * 60000 // Spread over time
      };

      this.db.insertCNCData(data);
    }

    console.log(`✓ Generated ${count} CNC data records`);
  }

  generateEPRRecords(count: number = 20) {
    const parts = [
      { number: 'PN-12345', name: 'Engine Block' },
      { number: 'PN-23456', name: 'Transmission Shaft' },
      { number: 'PN-34567', name: 'Piston Head' },
      { number: 'PN-45678', name: 'Crankshaft' },
      { number: 'PN-56789', name: 'Camshaft' },
      { number: 'PN-67890', name: 'Valve Body' },
      { number: 'PN-78901', name: 'Cylinder Head' },
      { number: 'PN-89012', name: 'Brake Rotor' }
    ];

    const machines = ['CNC-001', 'CNC-002', 'CNC-003', 'CNC-004', 'CNC-005'];
    const operators = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown'];
    const statuses: Array<'in_progress' | 'completed' | 'failed' | 'quality_check'> =
      ['in_progress', 'completed', 'failed', 'quality_check'];

    console.log(`Generating ${count} EPR records...`);

    for (let i = 0; i < count; i++) {
      const part = parts[Math.floor(Math.random() * parts.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const quantity = Math.floor(Math.random() * 200) + 50;
      const defectCount = status === 'failed' ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 5);
      const qualityScore = status === 'completed' ? 85 + Math.random() * 15 :
                          status === 'failed' ? 50 + Math.random() * 30 : null;

      const startTime = Date.now() - (count - i) * 3600000; // Spread over hours
      const endTime = status === 'completed' || status === 'failed' ?
        startTime + (2 + Math.random() * 4) * 3600000 : null;

      const notes = [
        'Standard production run',
        'High priority order',
        'Rush order - expedited',
        'Quality control sample',
        'Prototype batch',
        'Customer specification changes',
        'Rework from previous batch'
      ];

      const record = {
        id: uuidv4(),
        production_order: `PO-2024-${String(1000 + i).padStart(4, '0')}`,
        part_number: part.number,
        part_name: part.name,
        quantity: quantity,
        machine_id: machines[Math.floor(Math.random() * machines.length)],
        operator_name: operators[Math.floor(Math.random() * operators.length)],
        start_time: startTime,
        end_time: endTime,
        status: status,
        quality_score: qualityScore ? Math.round(qualityScore * 10) / 10 : null,
        defect_count: defectCount,
        notes: notes[Math.floor(Math.random() * notes.length)],
        ai_analysis: null
      };

      this.db.insertEPRRecord(record);
    }

    console.log(`✓ Generated ${count} EPR records`);
  }

  generateAll(cncCount: number = 50, eprCount: number = 20) {
    console.log('\n🎲 Generating sample data...\n');
    this.generateCNCData(cncCount);
    this.generateEPRRecords(eprCount);
    console.log('\n✅ Sample data generation complete!\n');
  }
}

// CLI script to generate data
if (require.main === module) {
  const db = new DatabaseManager();
  const generator = new SampleDataGenerator(db);

  const cncCount = parseInt(process.argv[2]) || 50;
  const eprCount = parseInt(process.argv[3]) || 20;

  generator.generateAll(cncCount, eprCount);
  db.close();
}
