import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { CNCMachineData, EPRRecord } from '../database/schema';

export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;
  private auth;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || './credentials/google-credentials.json';
      const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets authentication:', error);
      throw error;
    }
  }

  async initializeSpreadsheet() {
    try {
      // Create or verify CNC Data sheet
      await this.createSheetIfNotExists('CNC_Data', [
        'ID', 'Machine ID', 'Machine Name', 'Status', 'Operation Type',
        'Speed (RPM)', 'Feed Rate', 'Temperature', 'X', 'Y', 'Z',
        'Program Name', 'Timestamp', 'Date/Time'
      ]);

      // Create or verify EPR Records sheet
      await this.createSheetIfNotExists('EPR_Records', [
        'ID', 'Production Order', 'Part Number', 'Part Name', 'Quantity',
        'Machine ID', 'Operator', 'Start Time', 'End Time', 'Status',
        'Quality Score', 'Defect Count', 'Notes', 'AI Analysis', 'Date/Time'
      ]);

      console.log('Google Sheets initialized successfully');
    } catch (error) {
      console.error('Failed to initialize spreadsheet:', error);
      throw error;
    }
  }

  private async createSheetIfNotExists(sheetName: string, headers: string[]) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = response.data.sheets?.some(
        sheet => sheet.properties?.title === sheetName
      );

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: sheetName }
              }
            }]
          }
        });

        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers]
          }
        });
      }
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async syncCNCData(data: CNCMachineData[]): Promise<string[]> {
    if (data.length === 0) return [];

    try {
      const values = data.map(record => [
        record.id,
        record.machine_id,
        record.machine_name,
        record.status,
        record.operation_type,
        record.speed_rpm,
        record.feed_rate,
        record.temperature,
        record.coordinates_x,
        record.coordinates_y,
        record.coordinates_z,
        record.program_name,
        record.timestamp,
        new Date(record.timestamp).toISOString()
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'CNC_Data!A2',
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      console.log(`Synced ${data.length} CNC records to Google Sheets`);
      return data.map(d => d.id);
    } catch (error) {
      console.error('Error syncing CNC data:', error);
      throw error;
    }
  }

  async syncEPRRecords(records: EPRRecord[]): Promise<string[]> {
    if (records.length === 0) return [];

    try {
      const values = records.map(record => [
        record.id,
        record.production_order,
        record.part_number,
        record.part_name,
        record.quantity,
        record.machine_id,
        record.operator_name,
        record.start_time,
        record.end_time || '',
        record.status,
        record.quality_score || '',
        record.defect_count,
        record.notes,
        record.ai_analysis || '',
        new Date(record.start_time).toISOString()
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'EPR_Records!A2',
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      console.log(`Synced ${records.length} EPR records to Google Sheets`);
      return records.map(r => r.id);
    } catch (error) {
      console.error('Error syncing EPR records:', error);
      throw error;
    }
  }

  async getAllCNCData(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'CNC_Data!A2:N'
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error fetching CNC data from sheets:', error);
      return [];
    }
  }

  async getAllEPRRecords(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EPR_Records!A2:O'
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error fetching EPR records from sheets:', error);
      return [];
    }
  }
}
