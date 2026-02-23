import { DatabaseManager } from '../database/schema';

const db = new DatabaseManager();

console.log('\n╔════════════════════════════════════════╗');
console.log('║       📋 JOB ORDERS (EPR Records)     ║');
console.log('╚════════════════════════════════════════╝\n');

const orders = db.getEPRRecords(100);

if (orders.length === 0) {
  console.log('❌ No job orders found.');
  console.log('💡 Create one with: npm run create-job-order\n');
  db.close();
  process.exit(0);
}

console.log(`📊 Total Orders: ${orders.length}\n`);

// Group by status
const byStatus = orders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('📈 Status Summary:');
Object.entries(byStatus).forEach(([status, count]) => {
  const icon = status === 'completed' ? '✅' :
               status === 'in_progress' ? '⏳' :
               status === 'failed' ? '❌' : '🔍';
  console.log(`   ${icon} ${status}: ${count}`);
});
console.log('');

// Show recent orders
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Recent Job Orders (Latest 10):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

orders.slice(0, 10).forEach((order, index) => {
  const statusIcon = order.status === 'completed' ? '✅' :
                     order.status === 'in_progress' ? '⏳' :
                     order.status === 'failed' ? '❌' : '🔍';

  console.log(`${index + 1}. ${statusIcon} ${order.production_order}`);
  console.log(`   Part: ${order.part_name} (${order.part_number})`);
  console.log(`   Quantity: ${order.quantity} | Machine: ${order.machine_id} | Operator: ${order.operator_name}`);

  if (order.quality_score) {
    console.log(`   Quality: ${order.quality_score}% | Defects: ${order.defect_count}`);
  }

  if (order.notes) {
    console.log(`   Notes: ${order.notes}`);
  }

  const startDate = new Date(order.start_time).toLocaleString();
  console.log(`   Started: ${startDate}`);

  if (order.end_time) {
    const endDate = new Date(order.end_time).toLocaleString();
    const duration = Math.round((order.end_time - order.start_time) / 3600000);
    console.log(`   Completed: ${endDate} (${duration}h)`);
  }

  console.log('');
});

// Unsynced count
const unsynced = db.getUnsyncedEPRRecords();
if (unsynced.length > 0) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📤 ${unsynced.length} orders pending sync to Google Sheets`);
  console.log('   Run: npm run sync');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

db.close();
