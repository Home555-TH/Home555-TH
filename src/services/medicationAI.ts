/**
 * AI-Powered Medication Analysis Service
 *
 * Uses GPT-4 to provide:
 * - Drug interaction detection
 * - Dosage safety analysis
 * - Stock expiry risk assessment
 * - Reorder demand forecasting
 * - Patient medication history insights
 *
 * Data flows FROM ERPNext → this service → AI insights
 */

import OpenAI from 'openai';
import type {
  ERPNextItem,
  ERPNextStockBalance,
  ERPNextPrescription,
  ERPNextBatchExpiry,
  ERPNextPatient,
} from './erpnext';

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface DrugInteractionResult {
  hasCriticalInteractions: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    recommendation: string;
  }>;
  safeSummary: string;
}

export interface DosageAnalysisResult {
  drug: string;
  prescribed: string;
  assessment: 'safe' | 'review_needed' | 'alert';
  reasoning: string;
  recommendation: string;
}

export interface StockExpiryRiskResult {
  totalAtRisk: number;
  items: Array<{
    item_code: string;
    item_name: string;
    batch_id: string;
    expiry_date: string;
    qty: number;
    riskLevel: 'critical' | 'high' | 'medium';
    daysToExpiry: number;
    action: string;
  }>;
  summary: string;
}

export interface ReorderForecastResult {
  recommendations: Array<{
    item_code: string;
    item_name: string;
    current_qty: number;
    reorder_level: number;
    recommended_order_qty: number;
    urgency: 'immediate' | 'soon' | 'plan';
    reasoning: string;
  }>;
  totalItemsToReorder: number;
  summary: string;
}

export interface MedicationInsightResult {
  patientId: string;
  patientName: string;
  totalMedications: number;
  insights: string;
  alerts: string[];
  recommendations: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class MedicationAIService {
  private openai: OpenAI | null = null;
  readonly isConfigured: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      console.warn('MedicationAI: OpenAI API key not set — AI features disabled.');
      this.isConfigured = false;
    }
  }

  private notConfiguredError(feature: string): never {
    throw new Error(`${feature} unavailable: set OPENAI_API_KEY in .env`);
  }

  private async chat(system: string, user: string, json = false): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      this.notConfiguredError('AI analysis');
    }

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 800,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });

    return response.choices[0].message.content || '';
  }

  // ─── Drug Interaction Check ─────────────────────────────────────────────────

  async checkDrugInteractions(
    prescription: ERPNextPrescription
  ): Promise<DrugInteractionResult> {
    const drugs = prescription.medications.map(
      m => `${m.drug_name} ${m.dosage} ${m.dosage_form}`
    );

    const raw = await this.chat(
      `You are a clinical pharmacist expert. Analyze drug interactions.
Respond in JSON:
{
  "hasCriticalInteractions": boolean,
  "interactions": [
    {
      "drug1": string,
      "drug2": string,
      "severity": "critical|moderate|minor",
      "description": string,
      "recommendation": string
    }
  ],
  "safeSummary": string
}`,
      `Check interactions for these drugs prescribed to patient ${prescription.patient_name}:
${drugs.map((d, i) => `${i + 1}. ${d}`).join('\n')}`
    );

    try {
      return JSON.parse(raw) as DrugInteractionResult;
    } catch {
      return {
        hasCriticalInteractions: false,
        interactions: [],
        safeSummary: raw,
      };
    }
  }

  // ─── Dosage Safety Analysis ─────────────────────────────────────────────────

  async analyzeDosages(
    prescription: ERPNextPrescription,
    patient?: ERPNextPatient
  ): Promise<DosageAnalysisResult[]> {
    const patientContext = patient
      ? `Patient: ${patient.patient_name}, DOB: ${patient.dob}, Sex: ${patient.sex}, Blood Group: ${patient.blood_group}, Allergies: ${patient.allergies || 'None'}, Chronic conditions: ${patient.chronic_conditions || 'None'}`
      : `Patient: ${prescription.patient_name}`;

    const medsText = prescription.medications
      .map(m => `- ${m.drug_name}: ${m.dosage} ${m.dosage_form}, ${m.period}, Instructions: ${m.instructions || 'none'}`)
      .join('\n');

    const raw = await this.chat(
      `You are a clinical pharmacist. Assess dosage safety for each medication.
Respond in JSON array:
[
  {
    "drug": string,
    "prescribed": string,
    "assessment": "safe|review_needed|alert",
    "reasoning": string,
    "recommendation": string
  }
]`,
      `${patientContext}
Prescribed medications:
${medsText}`
    );

    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr as DosageAnalysisResult[] : [arr];
    } catch {
      return prescription.medications.map(m => ({
        drug: m.drug_name,
        prescribed: `${m.dosage} ${m.dosage_form}`,
        assessment: 'review_needed' as const,
        reasoning: 'Could not parse AI response',
        recommendation: raw,
      }));
    }
  }

  // ─── Stock Expiry Risk ──────────────────────────────────────────────────────

  async assessExpiryRisk(
    batches: ERPNextBatchExpiry[]
  ): Promise<StockExpiryRiskResult> {
    const today = new Date();

    const enriched = batches.map(b => {
      const expiry = new Date(b.expiry_date);
      const daysToExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...b, daysToExpiry };
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry);

    const batchSummary = enriched.slice(0, 20).map(b =>
      `${b.item_name} | Batch: ${b.batch_id} | Qty: ${b.qty} | Expires: ${b.expiry_date} (${b.daysToExpiry} days)`
    ).join('\n');

    const raw = await this.chat(
      `You are a pharmacy inventory manager. Assess expiry risk and recommend actions.
Respond in JSON:
{
  "totalAtRisk": number,
  "items": [
    {
      "item_code": string,
      "item_name": string,
      "batch_id": string,
      "expiry_date": string,
      "qty": number,
      "riskLevel": "critical|high|medium",
      "daysToExpiry": number,
      "action": string
    }
  ],
  "summary": string
}`,
      `Expiring medication batches (sorted by soonest expiry):
${batchSummary}

Today's date: ${today.toISOString().split('T')[0]}`
    );

    try {
      return JSON.parse(raw) as StockExpiryRiskResult;
    } catch {
      return {
        totalAtRisk: enriched.filter(b => b.daysToExpiry <= 30).length,
        items: enriched.map(b => ({
          ...b,
          riskLevel: b.daysToExpiry <= 7 ? 'critical' : b.daysToExpiry <= 30 ? 'high' : 'medium',
          action: b.daysToExpiry <= 7 ? 'Immediate disposal/return review' : 'Monitor closely',
        })) as StockExpiryRiskResult['items'],
        summary: raw,
      };
    }
  }

  // ─── Reorder Forecast ───────────────────────────────────────────────────────

  async forecastReorders(
    stockBalances: ERPNextStockBalance[],
    medicationItems: ERPNextItem[]
  ): Promise<ReorderForecastResult> {
    // Build a map of item metadata for reorder levels
    const itemMeta = new Map(medicationItems.map(i => [i.name, i]));

    const stockText = stockBalances
      .filter(s => itemMeta.has(s.item_code))
      .map(s => {
        const meta = itemMeta.get(s.item_code);
        return `${s.item_name} | Current: ${s.qty} ${s.stock_uom ?? ''} | Reorder Level: ${meta?.reorder_level ?? 'N/A'} | Reorder Qty: ${meta?.reorder_qty ?? 'N/A'}`;
      })
      .join('\n');

    const raw = await this.chat(
      `You are a pharmacy supply chain analyst. Forecast reorder needs based on current stock vs reorder levels.
Respond in JSON:
{
  "recommendations": [
    {
      "item_code": string,
      "item_name": string,
      "current_qty": number,
      "reorder_level": number,
      "recommended_order_qty": number,
      "urgency": "immediate|soon|plan",
      "reasoning": string
    }
  ],
  "totalItemsToReorder": number,
  "summary": string
}`,
      `Current medication stock levels:
${stockText || 'No stock data available'}`
    );

    try {
      return JSON.parse(raw) as ReorderForecastResult;
    } catch {
      return {
        recommendations: [],
        totalItemsToReorder: 0,
        summary: raw,
      };
    }
  }

  // ─── Patient Medication Insights ────────────────────────────────────────────

  async analyzePatientMedications(
    patient: ERPNextPatient,
    prescriptions: ERPNextPrescription[]
  ): Promise<MedicationInsightResult> {
    const allMeds = prescriptions.flatMap(p =>
      p.medications.map(m => `${m.drug_name} ${m.dosage} (${p.encounter_date})`)
    );

    const insights = await this.chat(
      `You are a clinical pharmacist reviewing a patient's complete medication history.
Provide a structured clinical review covering:
1. Overall medication burden
2. Potential cumulative risks
3. Adherence recommendations
4. Drug interactions across encounters
5. Any high-priority alerts`,
      `Patient: ${patient.patient_name}
DOB: ${patient.dob} | Sex: ${patient.sex}
Blood Group: ${patient.blood_group}
Known Allergies: ${patient.allergies || 'None'}
Chronic Conditions: ${patient.chronic_conditions || 'None'}

Medication history (${allMeds.length} medications across ${prescriptions.length} encounters):
${allMeds.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    );

    // Extract bullet-point alerts and recommendations
    const alertLines = insights.split('\n')
      .filter(l => l.toLowerCase().includes('alert') || l.toLowerCase().includes('warning') || l.toLowerCase().includes('critical'))
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);

    const recLines = insights.split('\n')
      .filter(l => l.toLowerCase().includes('recommend') || l.toLowerCase().includes('suggest'))
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);

    return {
      patientId: patient.name,
      patientName: patient.patient_name,
      totalMedications: allMeds.length,
      insights,
      alerts: alertLines.length ? alertLines : [],
      recommendations: recLines.length ? recLines : [],
    };
  }

  // ─── General Medication Stock Analysis ──────────────────────────────────────

  async analyzeOverallStock(
    items: ERPNextItem[],
    stockBalances: ERPNextStockBalance[]
  ): Promise<string> {
    const topItems = stockBalances.slice(0, 30).map(s =>
      `${s.item_name}: ${s.qty} units @ ${s.warehouse}`
    ).join('\n');

    return this.chat(
      `You are a pharmacy director reviewing overall medication inventory.
Provide executive-level insights on:
1. Inventory health
2. Critical shortages
3. Overstock risks
4. Cost optimization opportunities
5. Operational recommendations`,
      `Total medication SKUs: ${items.length}
Total stock records: ${stockBalances.length}

Top items by stock:
${topItems}`
    );
  }
}
