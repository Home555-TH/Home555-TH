import { DatabaseManager } from '../database/schema';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createJobOrder() {
  const db = new DatabaseManager();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   📋 CREATE NEW JOB ORDER (ePR)       ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Get job order details
    const productionOrder = await question('Production Order Number (e.g., JO-2024-001): ');
    const partNumber = await question('Part Number (e.g., PN-12345): ');
    const partName = await question('Part Name (e.g., Engine Block): ');
    const quantity = await question('Quantity: ');
    const machineId = await question('Machine ID (e.g., CNC-001): ');
    const operatorName = await question('Operator Name: ');
    const notes = await question('Notes (optional): ');

    // Create the job order
    const jobOrder = {
      id: uuidv4(),
      production_order: productionOrder,
      part_number: partNumber,
      part_name: partName,
      quantity: parseInt(quantity),
      machine_id: machineId,
      operator_name: operatorName,
      start_time: Date.now(),
      end_time: null,
      status: 'in_progress' as const,
      quality_score: null,
      defect_count: 0,
      notes: notes || '',
      ai_analysis: null
    };

    db.insertEPRRecord(jobOrder);

    console.log('\n✅ Job Order Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Order Number: ${jobOrder.production_order}`);
    console.log(`🔧 Part: ${jobOrder.part_name} (${jobOrder.part_number})`);
    console.log(`📊 Quantity: ${jobOrder.quantity}`);
    console.log(`🤖 Machine: ${jobOrder.machine_id}`);
    console.log(`👤 Operator: ${jobOrder.operator_name}`);
    console.log(`📝 Status: ${jobOrder.status}`);
    console.log(`🆔 Job ID: ${jobOrder.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show sync status
    const unsyncedRecords = db.getUnsyncedEPRRecords();
    console.log(`💾 Total unsynced records: ${unsyncedRecords.length}`);
    console.log('📤 Run "npm run sync" to push to Google Sheets\n');

  } catch (error) {
    console.error('❌ Error creating job order:', error);
  } finally {
    db.close();
    rl.close();
  }
}

// CLI mode
if (require.main === module) {
  createJobOrder();
}

export { createJobOrder };
