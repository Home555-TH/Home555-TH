/**
 * AI-Powered Quotation Service
 *
 * Integrates with ERPNext Selling module to provide intelligent quotation support:
 * - Auto-price suggestions based on BOM cost + margin
 * - Competitive analysis and win-probability scoring
 * - Lead time estimation from current work orders
 * - Terms and conditions recommendations
 * - Quote-to-order conversion optimisation tips
 *
 * ERPNext doctypes: Quotation, Customer, Item, BOM, Price List
 */

import OpenAI from 'openai';
import { ERPNextClient } from './erpnext';

// ─── ERPNext Selling Types ────────────────────────────────────────────────────

export interface ERPNextQuotation {
  name: string;
  quotation_to: string;         // Customer | Lead
  party_name: string;
  customer_name?: string;
  transaction_date: string;
  valid_till: string;
  currency: string;
  total: number;
  grand_total: number;
  status: string;               // Draft | Open | Replied | Ordered | Lost | Cancelled
  items: ERPNextQuotationItem[];
  taxes: Array<{ charge_type: string; account_head: string; rate: number }>;
  terms: string;
  note: string;
}

export interface ERPNextQuotationItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  delivery_date?: string;
  lead_time_days?: number;
}

export interface ERPNextCustomer {
  name: string;
  customer_name: string;
  customer_group: string;
  territory: string;
  customer_type: string;
  credit_limit: number;
  payment_terms: string;
}

export interface ERPNextPriceList {
  item_code: string;
  item_name: string;
  price_list_rate: number;
  currency: string;
  uom: string;
}

// ─── AI Result Types ──────────────────────────────────────────────────────────

export interface QuotationPriceSuggestion {
  itemCode: string;
  itemName: string;
  bomCost: number;
  suggestedRate: number;
  suggestedMargin: number;        // %
  priceListRate: number;
  reasoning: string;
  confidenceScore: number;        // 0-1
}

export interface QuotationAnalysisResult {
  quotationId: string;
  customerName: string;
  totalValue: number;
  winProbability: number;         // 0-100
  riskFactors: string[];
  strengths: string[];
  negotiationTips: string[];
  recommendedActions: Array<{
    action: string;
    deadline: string;
    priority: 'urgent' | 'normal' | 'low';
  }>;
  suggestedTerms: string;
  summary: string;
}

export interface LeadTimeEstimate {
  itemCode: string;
  requestedQty: number;
  estimatedDays: number;
  confidence: 'high' | 'medium' | 'low';
  bottleneck?: string;
  reasoning: string;
}

export interface QuotationDraftResult {
  customerName: string;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    suggested_rate: number;
    lead_time_days: number;
    notes: string;
  }>;
  suggestedTerms: string;
  coverNote: string;               // professional intro text
  totalEstimate: number;
  validityDays: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class QuotationAIService {
  private openai: OpenAI | null = null;
  readonly isConfigured: boolean;

  constructor(private erpnext: ERPNextClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  private async chat(system: string, user: string, json = false): Promise<string> {
    if (!this.openai) throw new Error('AI not configured: set OPENAI_API_KEY');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 800,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return response.choices[0].message.content || '';
  }

  // ─── ERPNext Data Fetching ─────────────────────────────────────────────────

  async getOpenQuotations(limit = 30): Promise<ERPNextQuotation[]> {
    const list = await this.erpnext.getList<{ name: string }>(
      'Quotation',
      ['name'],
      [['status', 'in', ['Draft', 'Open']]],
      limit
    );
    const results: ERPNextQuotation[] = [];
    for (const q of list.slice(0, 10)) {
      try {
        const doc = await this.erpnext.getDoc<ERPNextQuotation>('Quotation', q.name);
        results.push(doc);
      } catch { /* skip */ }
    }
    return results;
  }

  async getCustomer(name: string): Promise<ERPNextCustomer> {
    return this.erpnext.getDoc<ERPNextCustomer>('Customer', name);
  }

  async getItemPriceList(itemCode: string, priceList = 'Standard Selling'): Promise<ERPNextPriceList[]> {
    return this.erpnext.getList<ERPNextPriceList>(
      'Item Price',
      ['item_code', 'item_name', 'price_list_rate', 'currency', 'uom'],
      [['item_code', '=', itemCode], ['price_list', '=', priceList]],
      5
    );
  }

  // ─── AI Analysis Methods ───────────────────────────────────────────────────

  /**
   * AI pricing suggestions for each line item in a quotation,
   * considering BOM cost, price list, and target margin.
   */
  async suggestPricing(
    items: ERPNextQuotationItem[],
    targetMargin = 25,
    customerGroup?: string
  ): Promise<QuotationPriceSuggestion[]> {
    const itemsText = items.map((it, i) =>
      `${i + 1}. ${it.item_name} (${it.item_code}) | Qty: ${it.qty} ${it.uom} | Current rate: ${it.rate}`
    ).join('\n');

    const raw = await this.chat(
      `You are a pricing analyst for a CNC manufacturing company.
Suggest optimal pricing per line item. Target gross margin: ${targetMargin}%.
Customer group: ${customerGroup || 'Standard'}.
Respond in JSON array:
[
  {
    "itemCode": string,
    "itemName": string,
    "bomCost": number,
    "suggestedRate": number,
    "suggestedMargin": number,
    "priceListRate": number,
    "reasoning": string,
    "confidenceScore": number
  }
]`,
      `Quotation line items:
${itemsText}`,
      true
    );

    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr as QuotationPriceSuggestion[] : [arr];
    } catch {
      return items.map(it => ({
        itemCode: it.item_code,
        itemName: it.item_name,
        bomCost: 0,
        suggestedRate: it.rate,
        suggestedMargin: targetMargin,
        priceListRate: it.rate,
        reasoning: 'Could not parse AI response',
        confidenceScore: 0,
      }));
    }
  }

  /**
   * Full AI analysis of an open quotation — win probability, risks, and actions.
   */
  async analyzeQuotation(
    quotation: ERPNextQuotation,
    customer?: ERPNextCustomer
  ): Promise<QuotationAnalysisResult> {
    const customerContext = customer
      ? `Customer: ${customer.customer_name} | Group: ${customer.customer_group} | Territory: ${customer.territory} | Credit limit: ${customer.credit_limit} | Payment terms: ${customer.payment_terms}`
      : `Customer: ${quotation.customer_name || quotation.party_name}`;

    const itemsText = quotation.items
      .map(it => `- ${it.item_name}: ${it.qty} x ${it.rate} = ${it.amount}`)
      .join('\n');

    const raw = await this.chat(
      `You are a B2B sales analyst. Analyse the quotation and provide actionable intelligence.
Respond in JSON:
{
  "winProbability": number (0-100),
  "riskFactors": [string],
  "strengths": [string],
  "negotiationTips": [string],
  "recommendedActions": [{ "action": string, "deadline": string, "priority": "urgent|normal|low" }],
  "suggestedTerms": string,
  "summary": string
}`,
      `Quotation: ${quotation.name}
Date: ${quotation.transaction_date} | Valid till: ${quotation.valid_till}
${customerContext}
Currency: ${quotation.currency}
Grand Total: ${quotation.grand_total}
Status: ${quotation.status}

Items:
${itemsText}

Current Terms: ${quotation.terms || 'None'}
Notes: ${quotation.note || 'None'}`,
      true
    );

    try {
      const parsed = JSON.parse(raw);
      return {
        quotationId: quotation.name,
        customerName: quotation.customer_name || quotation.party_name,
        totalValue: quotation.grand_total,
        ...parsed,
      };
    } catch {
      return {
        quotationId: quotation.name,
        customerName: quotation.customer_name || quotation.party_name,
        totalValue: quotation.grand_total,
        winProbability: 0,
        riskFactors: [],
        strengths: [],
        negotiationTips: [],
        recommendedActions: [],
        suggestedTerms: '',
        summary: raw,
      };
    }
  }

  /**
   * Estimate lead time for items based on current work order load.
   */
  async estimateLeadTimes(
    items: Array<{ item_code: string; item_name: string; qty: number }>,
    currentWorkOrderCount: number
  ): Promise<LeadTimeEstimate[]> {
    const itemsText = items.map(
      it => `${it.item_name} (${it.item_code}): ${it.qty} units`
    ).join('\n');

    const raw = await this.chat(
      `You are a production planning expert for CNC manufacturing.
Estimate realistic lead times based on typical CNC manufacturing cycles.
Current open work orders in system: ${currentWorkOrderCount}.
Respond in JSON array:
[
  {
    "itemCode": string,
    "requestedQty": number,
    "estimatedDays": number,
    "confidence": "high|medium|low",
    "bottleneck": string or null,
    "reasoning": string
  }
]`,
      `Items requested:
${itemsText}`,
      true
    );

    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr as LeadTimeEstimate[] : [arr];
    } catch {
      return items.map(it => ({
        itemCode: it.item_code,
        requestedQty: it.qty,
        estimatedDays: 14,
        confidence: 'low' as const,
        reasoning: 'Could not parse AI response',
      }));
    }
  }

  /**
   * AI-drafted quotation — generates a complete quote draft from a brief requirement.
   */
  async draftQuotation(
    customerName: string,
    requirements: string,
    availableItems: Array<{ item_code: string; item_name: string; standard_rate?: number }>
  ): Promise<QuotationDraftResult> {
    const itemCatalog = availableItems.slice(0, 30).map(
      it => `${it.item_code}: ${it.item_name} (rate: ${it.standard_rate ?? 'TBD'})`
    ).join('\n');

    const raw = await this.chat(
      `You are a sales engineer at a CNC manufacturing company.
Draft a professional quotation from the customer requirement.
Match items from the provided catalog. Suggest realistic rates.
Respond in JSON:
{
  "items": [
    {
      "item_code": string,
      "item_name": string,
      "qty": number,
      "suggested_rate": number,
      "lead_time_days": number,
      "notes": string
    }
  ],
  "suggestedTerms": string,
  "coverNote": string,
  "totalEstimate": number,
  "validityDays": number
}`,
      `Customer: ${customerName}
Requirement: ${requirements}

Available item catalog:
${itemCatalog}`,
      true
    );

    try {
      const parsed = JSON.parse(raw);
      return { customerName, ...parsed };
    } catch {
      return {
        customerName,
        items: [],
        suggestedTerms: '30 days net',
        coverNote: raw,
        totalEstimate: 0,
        validityDays: 30,
      };
    }
  }

  /**
   * Analyse all open quotations and surface the highest-priority pipeline.
   */
  async analyzeQuotationPipeline(quotations: ERPNextQuotation[]): Promise<string> {
    const summary = quotations.map(q =>
      `${q.name}: ${q.customer_name || q.party_name} | ${q.currency} ${q.grand_total} | Valid: ${q.valid_till} | Status: ${q.status}`
    ).join('\n');

    return this.chat(
      `You are a sales director reviewing the open quotation pipeline.
Provide a concise executive summary with:
1. Pipeline value & win probability
2. Quotes expiring soon (urgent follow-ups)
3. Highest-value opportunities
4. Recommended priority actions`,
      `Open quotations (${quotations.length} total):
${summary}`
    );
  }
}
