import OpenAI from 'openai';
import { CNCMachineData, EPRRecord } from '../database/schema';

export class AIAnalyzer {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not configured. AI features will be disabled.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeCNCData(data: CNCMachineData[]): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return 'AI analysis unavailable: API key not configured';
    }

    try {
      const summary = this.summarizeCNCData(data);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert CNC machine analyst. Analyze the provided machine data and provide insights on:
1. Machine performance and efficiency
2. Potential issues or anomalies
3. Recommendations for optimization
4. Predictive maintenance suggestions`
          },
          {
            role: 'user',
            content: `Analyze this CNC machine data:\n\n${summary}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'No analysis generated';
    } catch (error) {
      console.error('AI analysis error:', error);
      return 'AI analysis failed: ' + (error as Error).message;
    }
  }

  async analyzeEPRRecord(record: EPRRecord, relatedCNCData?: CNCMachineData[]): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return 'AI analysis unavailable: API key not configured';
    }

    try {
      const context = `
Production Order: ${record.production_order}
Part: ${record.part_name} (${record.part_number})
Quantity: ${record.quantity}
Machine: ${record.machine_id}
Operator: ${record.operator_name}
Status: ${record.status}
Quality Score: ${record.quality_score || 'N/A'}
Defects: ${record.defect_count}
Notes: ${record.notes}

${relatedCNCData ? `Related CNC Data:\n${this.summarizeCNCData(relatedCNCData)}` : ''}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert production analyst. Analyze electronic production records and provide:
1. Quality assessment
2. Efficiency analysis
3. Root cause analysis for defects
4. Recommendations for improvement`
          },
          {
            role: 'user',
            content: `Analyze this production record:\n\n${context}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      return response.choices[0].message.content || 'No analysis generated';
    } catch (error) {
      console.error('AI analysis error:', error);
      return 'AI analysis failed: ' + (error as Error).message;
    }
  }

  async detectAnomalies(data: CNCMachineData[]): Promise<{
    hasAnomalies: boolean;
    anomalies: string[];
    recommendations: string[];
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        hasAnomalies: false,
        anomalies: [],
        recommendations: ['AI anomaly detection unavailable: API key not configured']
      };
    }

    try {
      const summary = this.summarizeCNCData(data);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at detecting anomalies in CNC machine operations.
Analyze the data and respond in JSON format with:
{
  "hasAnomalies": boolean,
  "anomalies": ["anomaly description 1", ...],
  "recommendations": ["recommendation 1", ...]
}`
          },
          {
            role: 'user',
            content: `Detect anomalies in this CNC data:\n\n${summary}`
          }
        ],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        hasAnomalies: result.hasAnomalies || false,
        anomalies: result.anomalies || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return {
        hasAnomalies: false,
        anomalies: [],
        recommendations: ['Anomaly detection failed: ' + (error as Error).message]
      };
    }
  }

  async predictMaintenanceNeeds(machineId: string, historicalData: CNCMachineData[]): Promise<{
    maintenanceNeeded: boolean;
    confidence: number;
    estimatedDays: number;
    reasoning: string;
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        maintenanceNeeded: false,
        confidence: 0,
        estimatedDays: 0,
        reasoning: 'AI prediction unavailable: API key not configured'
      };
    }

    try {
      const machineData = historicalData.filter(d => d.machine_id === machineId);
      const summary = this.summarizeCNCData(machineData);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a predictive maintenance expert for CNC machines.
Analyze historical data and predict maintenance needs. Respond in JSON format with:
{
  "maintenanceNeeded": boolean,
  "confidence": number (0-1),
  "estimatedDays": number,
  "reasoning": "explanation"
}`
          },
          {
            role: 'user',
            content: `Predict maintenance needs for machine ${machineId}:\n\n${summary}`
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        maintenanceNeeded: result.maintenanceNeeded || false,
        confidence: result.confidence || 0,
        estimatedDays: result.estimatedDays || 0,
        reasoning: result.reasoning || 'No prediction available'
      };
    } catch (error) {
      console.error('Maintenance prediction error:', error);
      return {
        maintenanceNeeded: false,
        confidence: 0,
        estimatedDays: 0,
        reasoning: 'Prediction failed: ' + (error as Error).message
      };
    }
  }

  private summarizeCNCData(data: CNCMachineData[]): string {
    if (data.length === 0) return 'No data available';

    const summary = data.slice(0, 10).map(d =>
      `Machine: ${d.machine_name} | Status: ${d.status} | Speed: ${d.speed_rpm} RPM | Temp: ${d.temperature}°C | Program: ${d.program_name}`
    ).join('\n');

    const stats = {
      total: data.length,
      avgSpeed: (data.reduce((sum, d) => sum + d.speed_rpm, 0) / data.length).toFixed(2),
      avgTemp: (data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(2),
      statuses: data.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return `Statistics:
Total Records: ${stats.total}
Average Speed: ${stats.avgSpeed} RPM
Average Temperature: ${stats.avgTemp}°C
Status Distribution: ${JSON.stringify(stats.statuses)}

Sample Data (latest 10):
${summary}`;
  }
}
