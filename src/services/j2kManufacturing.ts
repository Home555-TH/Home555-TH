/**
 * J2K CNC Manufacturing Service
 *
 * Integrates J2K CNC machines with ERPNext Manufacturing module.
 *
 * Flow:
 *   Local CNC sensors → this service → ERPNext Work Orders / Job Cards
 *   ERPNext BOM / Work Orders → AI analysis → optimisation insights
 *
 * ERPNext doctypes used:
 *   - Work Order        (production runs)
 *   - Job Card          (per-operation tracking)
 *   - BOM               (Bill of Materials)
 *   - Work Center       (CNC machine definitions)
 *   - Stock Entry       (material consumption / finished goods)
 *   - Quality Inspection (quality checks)
 */

import OpenAI from 'openai';
import { ERPNextClient } from './erpnext';
import { CNCMachineData, EPRRecord } from '../database/schema';

// ─── ERPNext Manufacturing Types ──────────────────────────────────────────────

export interface ERPNextWorkOrder {
  name: string;
  production_item: string;
  item_name: string;
  bom_no: string;
  qty: number;
  produced_qty: number;
  status: string;       // Draft | Submitted | In Process | Completed | Stopped
  planned_start_date: string;
  planned_end_date: string;
  work_center: string;
  wip_warehouse: string;
  fg_warehouse: string;
}

export interface ERPNextJobCard {
  name: string;
  work_order: string;
  operation: string;
  workstation: string;
  employee: string;
  time_logs: Array<{
    from_time: string;
    to_time: string;
    time_in_mins: number;
  }>;
  status: string;       // Open | Work In Progress | Complete
  total_time_in_mins: number;
  for_quantity: number;
  process_loss_qty: number;
}

export interface ERPNextBOM {
  name: string;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  operations: Array<{
    operation: string;
    workstation: string;
    time_in_mins: number;
    operating_cost: number;
  }>;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
  total_cost: number;
  operating_cost: number;
  raw_material_cost: number;
}

export interface ERPNextWorkCenter {
  name: string;
  work_center_name: string;
  description: string;
  hour_rate: number;
  capacity: number;
  holiday_list: string;
}

// ─── AI Result Types ──────────────────────────────────────────────────────────

export interface ProductionEfficiencyResult {
  workOrderId: string;
  itemName: string;
  overallEfficiency: number;        // 0-100
  oee: {                             // Overall Equipment Effectiveness
    availability: number;
    performance: number;
    quality: number;
    score: number;
  };
  bottlenecks: string[];
  recommendations: string[];
  summary: string;
}

export interface WorkOrderOptimizationResult {
  workOrderId: string;
  currentLeadTime: number;          // days
  optimizedLeadTime: number;        // days (AI suggestion)
  machineUtilization: number;       // %
  suggestions: Array<{
    area: string;
    action: string;
    expectedSaving: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  summary: string;
}

export interface CNCToJobCardSyncResult {
  jobCardId: string;
  machineId: string;
  synced: boolean;
  dataPoints: number;
  averageRPM: number;
  averageTemp: number;
  anomaliesDetected: number;
  statusMessage: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class J2KManufacturingService {
  private openai: OpenAI | null = null;
  readonly isConfigured: boolean;
  private warehouse: string;
  private workCenter: string;

  constructor(private erpnext: ERPNextClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
    this.warehouse = process.env.J2K_WAREHOUSE || 'Main Warehouse';
    this.workCenter = process.env.J2K_WORK_CENTER || 'CNC Work Center';
  }

  private async chat(system: string, user: string, json = false): Promise<string> {
    if (!this.openai) throw new Error('AI not configured: set OPENAI_API_KEY');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 700,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return response.choices[0].message.content || '';
  }

  // ─── ERPNext Work Order Methods ────────────────────────────────────────────

  async getActiveWorkOrders(limit = 50): Promise<ERPNextWorkOrder[]> {
    return this.erpnext.getList<ERPNextWorkOrder>(
      'Work Order',
      ['name', 'production_item', 'item_name', 'bom_no', 'qty', 'produced_qty',
       'status', 'planned_start_date', 'planned_end_date', 'work_center'],
      [['status', 'in', ['Submitted', 'In Process']]],
      limit
    );
  }

  async getWorkOrder(name: string): Promise<ERPNextWorkOrder> {
    return this.erpnext.getDoc<ERPNextWorkOrder>('Work Order', name);
  }

  async getJobCardsForWorkOrder(workOrderName: string): Promise<ERPNextJobCard[]> {
    return this.erpnext.getList<ERPNextJobCard>(
      'Job Card',
      ['name', 'work_order', 'operation', 'workstation', 'status',
       'total_time_in_mins', 'for_quantity', 'process_loss_qty'],
      [['work_order', '=', workOrderName]],
      50
    );
  }

  async getBOM(bomNo: string): Promise<ERPNextBOM> {
    return this.erpnext.getDoc<ERPNextBOM>('BOM', bomNo);
  }

  async getWorkCenters(): Promise<ERPNextWorkCenter[]> {
    return this.erpnext.getList<ERPNextWorkCenter>(
      'Work Center',
      ['name', 'work_center_name', 'hour_rate', 'capacity'],
      [],
      50
    );
  }

  /**
   * Create a Job Card entry in ERPNext from local CNC machine data.
   * Links sensor data to the ERPNext manufacturing workflow.
   */
  async syncCNCDataToJobCard(
    jobCardName: string,
    cncData: CNCMachineData[]
  ): Promise<CNCToJobCardSyncResult> {
    if (cncData.length === 0) {
      return {
        jobCardId: jobCardName,
        machineId: '',
        synced: false,
        dataPoints: 0,
        averageRPM: 0,
        averageTemp: 0,
        anomaliesDetected: 0,
        statusMessage: 'No CNC data to sync',
      };
    }

    const avgRPM = cncData.reduce((s, d) => s + d.speed_rpm, 0) / cncData.length;
    const avgTemp = cncData.reduce((s, d) => s + d.temperature, 0) / cncData.length;
    const anomalies = cncData.filter(d => d.status === 'error' || d.temperature > 85).length;

    // Append a comment to the Job Card with machine stats
    const comment = `J2K CNC Sync | Machine: ${cncData[0].machine_name} | ` +
      `Records: ${cncData.length} | Avg RPM: ${avgRPM.toFixed(0)} | ` +
      `Avg Temp: ${avgTemp.toFixed(1)}°C | Anomalies: ${anomalies}`;

    try {
      await this.erpnext.callMethod('frappe.client.set_value', {
        doctype: 'Job Card',
        name: jobCardName,
        fieldname: 'remarks',
        value: comment,
      });

      return {
        jobCardId: jobCardName,
        machineId: cncData[0].machine_id,
        synced: true,
        dataPoints: cncData.length,
        averageRPM: Math.round(avgRPM),
        averageTemp: parseFloat(avgTemp.toFixed(1)),
        anomaliesDetected: anomalies,
        statusMessage: 'Synced successfully to ERPNext Job Card',
      };
    } catch (err) {
      return {
        jobCardId: jobCardName,
        machineId: cncData[0].machine_id,
        synced: false,
        dataPoints: cncData.length,
        averageRPM: Math.round(avgRPM),
        averageTemp: parseFloat(avgTemp.toFixed(1)),
        anomaliesDetected: anomalies,
        statusMessage: `ERPNext sync failed: ${(err as Error).message}`,
      };
    }
  }

  // ─── AI Analysis Methods ───────────────────────────────────────────────────

  /**
   * AI production efficiency analysis combining ERPNext work order data
   * with local CNC sensor readings.
   */
  async analyzeProductionEfficiency(
    workOrder: ERPNextWorkOrder,
    jobCards: ERPNextJobCard[],
    cncData: CNCMachineData[]
  ): Promise<ProductionEfficiencyResult> {
    const totalPlanned = jobCards.reduce((s, j) => s + (j.for_quantity || 0), 0);
    const totalLoss = jobCards.reduce((s, j) => s + (j.process_loss_qty || 0), 0);
    const totalMins = jobCards.reduce((s, j) => s + (j.total_time_in_mins || 0), 0);
    const errorCount = cncData.filter(d => d.status === 'error').length;
    const avgTemp = cncData.length
      ? (cncData.reduce((s, d) => s + d.temperature, 0) / cncData.length).toFixed(1)
      : 'N/A';

    const raw = await this.chat(
      `You are a manufacturing efficiency expert specialising in CNC production.
Analyse the provided work order and sensor data. Respond in JSON:
{
  "overallEfficiency": number (0-100),
  "oee": { "availability": number, "performance": number, "quality": number, "score": number },
  "bottlenecks": [string],
  "recommendations": [string],
  "summary": string
}`,
      `Work Order: ${workOrder.name}
Item: ${workOrder.item_name}
Planned Qty: ${workOrder.qty} | Produced: ${workOrder.produced_qty}
Status: ${workOrder.status}
Start: ${workOrder.planned_start_date} | End: ${workOrder.planned_end_date}

Job Cards: ${jobCards.length}
Total production time: ${totalMins} mins
Total planned qty: ${totalPlanned}
Total process loss: ${totalLoss}

CNC Sensor Data:
Total readings: ${cncData.length}
Average temperature: ${avgTemp}°C
Error events: ${errorCount}`,
      true
    );

    try {
      const parsed = JSON.parse(raw);
      return { workOrderId: workOrder.name, itemName: workOrder.item_name, ...parsed };
    } catch {
      return {
        workOrderId: workOrder.name,
        itemName: workOrder.item_name,
        overallEfficiency: 0,
        oee: { availability: 0, performance: 0, quality: 0, score: 0 },
        bottlenecks: [],
        recommendations: [],
        summary: raw,
      };
    }
  }

  /**
   * AI optimisation suggestions for a specific work order.
   */
  async optimizeWorkOrder(
    workOrder: ERPNextWorkOrder,
    bom: ERPNextBOM,
    jobCards: ERPNextJobCard[]
  ): Promise<WorkOrderOptimizationResult> {
    const operations = bom.operations.map(
      o => `${o.operation} @ ${o.workstation}: ${o.time_in_mins} mins`
    ).join('\n');

    const completedCards = jobCards.filter(j => j.status === 'Complete');
    const avgActualMins = completedCards.length
      ? completedCards.reduce((s, j) => s + j.total_time_in_mins, 0) / completedCards.length
      : 0;

    const plannedDays = workOrder.planned_start_date && workOrder.planned_end_date
      ? Math.ceil(
          (new Date(workOrder.planned_end_date).getTime() - new Date(workOrder.planned_start_date).getTime())
          / (1000 * 60 * 60 * 24)
        )
      : 0;

    const raw = await this.chat(
      `You are a lean manufacturing specialist. Suggest work order optimisations.
Respond in JSON:
{
  "currentLeadTime": number,
  "optimizedLeadTime": number,
  "machineUtilization": number,
  "suggestions": [
    { "area": string, "action": string, "expectedSaving": string, "priority": "high|medium|low" }
  ],
  "summary": string
}`,
      `Work Order: ${workOrder.name}
Item: ${workOrder.item_name} | BOM: ${bom.name}
Qty: ${workOrder.qty}
Planned lead time: ${plannedDays} days

BOM Operations:
${operations}

BOM Cost:
Raw Material: ${bom.raw_material_cost}
Operating: ${bom.operating_cost}
Total: ${bom.total_cost}

Actual avg job card time: ${avgActualMins.toFixed(0)} mins
Job cards completed: ${completedCards.length} / ${jobCards.length}`,
      true
    );

    try {
      const parsed = JSON.parse(raw);
      return { workOrderId: workOrder.name, ...parsed };
    } catch {
      return {
        workOrderId: workOrder.name,
        currentLeadTime: plannedDays,
        optimizedLeadTime: plannedDays,
        machineUtilization: 0,
        suggestions: [],
        summary: raw,
      };
    }
  }

  /**
   * AI summary of CNC machine performance mapped to ERPNext work centres.
   */
  async analyzeWorkCenterPerformance(
    workCenters: ERPNextWorkCenter[],
    localCNCData: CNCMachineData[]
  ): Promise<string> {
    const wcSummary = workCenters.map(
      wc => `${wc.work_center_name}: rate=${wc.hour_rate}/hr, capacity=${wc.capacity}`
    ).join('\n');

    const cncSummary = localCNCData.slice(0, 20).map(
      d => `${d.machine_name}: ${d.status} | ${d.speed_rpm} RPM | ${d.temperature}°C`
    ).join('\n');

    return this.chat(
      `You are a manufacturing operations analyst. Assess work centre performance.`,
      `ERPNext Work Centres:
${wcSummary}

Live CNC Machine Readings:
${cncSummary}`
    );
  }
}
