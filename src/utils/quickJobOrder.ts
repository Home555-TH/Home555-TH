import { DatabaseManager } from '../database/schema';
import { v4 as uuidv4 } from 'uuid';

// Quick job order creation with predefined data
interface JobOrderInput {
  productionOrder: string;
  partNumber: string;
  partName: string;
  quantity: number;
  machineId: string;
  operatorName: string;
  notes?: string;
}

function createQuickJobOrder(input: JobOrderInput) {
  const db = new DatabaseManager();

  const jobOrder = {
    id: uuidv4(),
    production_order: input.productionOrder,
    part_number: input.partNumber,
    part_name: input.partName,
    quantity: input.quantity,
    machine_id: input.machineId,
    operator_name: input.operatorName,
    start_time: Date.now(),
    end_time: null,
    status: 'in_progress' as const,
    quality_score: null,
    defect_count: 0,
    notes: input.notes || '',
    ai_analysis: null
  };

  db.insertEPRRecord(jobOrder);
  console.log(`✅ Job Order ${jobOrder.production_order} created successfully!`);

  db.close();
  return jobOrder;
}

// Example usage - create sample job orders
if (require.main === module) {
  console.log('\n📋 Creating Sample Job Orders...\n');

  // Job Order 1
  createQuickJobOrder({
    productionOrder: 'JO-2024-101',
    partNumber: 'PN-GEAR-001',
    partName: 'Precision Gear Assembly',
    quantity: 50,
    machineId: 'CNC-001',
    operatorName: 'John Smith',
    notes: 'High priority - Customer ABC'
  });

  // Job Order 2
  createQuickJobOrder({
    productionOrder: 'JO-2024-102',
    partNumber: 'PN-SHAFT-002',
    partName: 'Drive Shaft',
    quantity: 75,
    machineId: 'CNC-002',
    operatorName: 'Jane Doe',
    notes: 'Standard production batch'
  });

  // Job Order 3
  createQuickJobOrder({
    productionOrder: 'JO-2024-103',
    partNumber: 'PN-BRACKET-003',
    partName: 'Mounting Bracket',
    quantity: 100,
    machineId: 'CNC-003',
    operatorName: 'Mike Johnson',
    notes: 'Rush order - Ship by end of week'
  });

  console.log('\n✅ All job orders created!\n');
  console.log('💡 Tips:');
  console.log('   - View orders: npm run view-orders');
  console.log('   - Sync to Google Sheets: npm run sync');
  console.log('   - Start webapp: npm run dev\n');
}

export { createQuickJobOrder };
