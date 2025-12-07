import { DatabaseManager } from '../database/schema';
import { writeFileSync } from 'fs';

// Export database data to CSV files for manual Google Sheets import
const db = new DatabaseManager();

// Export CNC Data
const cncData = db.getCNCData(1000);
const cncHeaders = [
  'ID', 'Machine ID', 'Machine Name', 'Status', 'Operation Type',
  'Speed (RPM)', 'Feed Rate', 'Temperature', 'X', 'Y', 'Z',
  'Program Name', 'Timestamp', 'Date/Time'
];

const cncRows = cncData.map(d => [
  d.id,
  d.machine_id,
  d.machine_name,
  d.status,
  d.operation_type,
  d.speed_rpm,
  d.feed_rate,
  d.temperature,
  d.coordinates_x,
  d.coordinates_y,
  d.coordinates_z,
  d.program_name,
  d.timestamp,
  new Date(d.timestamp).toISOString()
]);

const cncCSV = [cncHeaders, ...cncRows]
  .map(row => row.map(cell => `"${cell}"`).join(','))
  .join('\n');

writeFileSync('./CNC_Data.csv', cncCSV);
console.log(`✓ Exported ${cncRows.length} CNC records to CNC_Data.csv`);

// Export EPR Records
const eprData = db.getEPRRecords(1000);
const eprHeaders = [
  'ID', 'Production Order', 'Part Number', 'Part Name', 'Quantity',
  'Machine ID', 'Operator', 'Start Time', 'End Time', 'Status',
  'Quality Score', 'Defect Count', 'Notes', 'AI Analysis', 'Date/Time'
];

const eprRows = eprData.map(r => [
  r.id,
  r.production_order,
  r.part_number,
  r.part_name,
  r.quantity,
  r.machine_id,
  r.operator_name,
  r.start_time,
  r.end_time || '',
  r.status,
  r.quality_score || '',
  r.defect_count,
  r.notes,
  r.ai_analysis || '',
  new Date(r.start_time).toISOString()
]);

const eprCSV = [eprHeaders, ...eprRows]
  .map(row => row.map(cell => `"${cell}"`).join(','))
  .join('\n');

writeFileSync('./EPR_Records.csv', eprCSV);
console.log(`✓ Exported ${eprRows.length} EPR records to EPR_Records.csv`);

db.close();

console.log('\n📊 CSV files created successfully!');
console.log('\nTo import to Google Sheets:');
console.log('1. Open your Google Spreadsheet');
console.log('2. Create a sheet named "CNC_Data"');
console.log('3. File → Import → Upload → Select CNC_Data.csv');
console.log('4. Create a sheet named "EPR_Records"');
console.log('5. File → Import → Upload → Select EPR_Records.csv');
