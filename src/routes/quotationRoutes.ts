/**
 * AI-Powered Quotation Routes
 *
 * GET  /api/quotation/status              - service status
 * GET  /api/quotation/open                - all open quotations from ERPNext
 * GET  /api/quotation/pipeline            - AI pipeline analysis
 * GET  /api/quotation/:id                 - single quotation
 * GET  /api/quotation/:id/analyze         - AI win probability & actions
 * GET  /api/quotation/:id/pricing         - AI pricing suggestions
 * POST /api/quotation/draft               - AI-generate a new quote draft
 * POST /api/quotation/lead-time           - estimate lead times for items
 */

import { Router, Request, Response } from 'express';
import { QuotationAIService } from '../services/quotationAI';
import { ERPNextClient } from '../services/erpnext';

export function createQuotationRoutes(
  erpnext: ERPNextClient,
  quotationAI: QuotationAIService
): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({
      success: true,
      erpnextConfigured: erpnext.isConfigured,
      aiConfigured: quotationAI.isConfigured,
    });
  });

  router.get('/open', async (_req: Request, res: Response) => {
    try {
      const quotations = await quotationAI.getOpenQuotations();
      res.json({ success: true, data: quotations, count: quotations.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/pipeline', async (_req: Request, res: Response) => {
    try {
      const quotations = await quotationAI.getOpenQuotations(30);
      const analysis = await quotationAI.analyzeQuotationPipeline(quotations);
      res.json({ success: true, analysis, count: quotations.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const quotation = await erpnext.getDoc<import('../services/quotationAI').ERPNextQuotation>(
        'Quotation', req.params.id
      );
      res.json({ success: true, data: quotation });
    } catch (err) {
      res.status(404).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/:id/analyze', async (req: Request, res: Response) => {
    try {
      const quotation = await erpnext.getDoc<import('../services/quotationAI').ERPNextQuotation>(
        'Quotation', req.params.id
      );

      let customer: import('../services/quotationAI').ERPNextCustomer | undefined;
      try {
        if (quotation.party_name) {
          customer = await quotationAI.getCustomer(quotation.party_name);
        }
      } catch { /* optional */ }

      const result = await quotationAI.analyzeQuotation(quotation, customer);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get('/:id/pricing', async (req: Request, res: Response) => {
    try {
      const quotation = await erpnext.getDoc<import('../services/quotationAI').ERPNextQuotation>(
        'Quotation', req.params.id
      );
      const margin = parseFloat(req.query.margin as string) || 25;

      let customerGroup: string | undefined;
      try {
        const c = await quotationAI.getCustomer(quotation.party_name);
        customerGroup = c.customer_group;
      } catch { /* optional */ }

      const suggestions = await quotationAI.suggestPricing(quotation.items, margin, customerGroup);
      res.json({ success: true, data: suggestions });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/quotation/draft
   * Body: { customer_name, requirements, item_codes?: string[] }
   */
  router.post('/draft', async (req: Request, res: Response) => {
    try {
      const { customer_name, requirements } = req.body;
      if (!customer_name || !requirements) {
        return res.status(400).json({
          success: false,
          error: 'customer_name and requirements are required',
        });
      }

      // Fetch available items from ERPNext
      const items = await erpnext.getList<{ name: string; item_name: string }>(
        'Item',
        ['name', 'item_name', 'standard_rate'],
        [['disabled', '=', '0'], ['is_sales_item', '=', '1']],
        50
      );

      const draft = await quotationAI.draftQuotation(
        customer_name,
        requirements,
        items as Array<{ item_code: string; item_name: string; standard_rate?: number }>
      );

      res.json({ success: true, data: draft });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/quotation/lead-time
   * Body: { items: [{ item_code, item_name, qty }] }
   */
  router.post('/lead-time', async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'items array required' });
      }

      const openOrders = await erpnext.getList(
        'Work Order',
        ['name'],
        [['status', 'in', ['Submitted', 'In Process']]],
        100
      );

      const estimates = await quotationAI.estimateLeadTimes(items, openOrders.length);
      res.json({ success: true, data: estimates, openWorkOrders: openOrders.length });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
