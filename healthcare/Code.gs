/**
 * 🏥 Healthcare Tracking System - ดูแลคุณแม่ก่อน/หลังผ่าตัด
 * Surgery Date: 28/02/2568 (28 Feb 2025)
 * Condition: Thyroid + Mass removal + Lung treatment
 *
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheets > Extensions > Apps Script
 * 2. Copy code นี้ทั้งหมดไปวาง
 * 3. Save และ Run > doGet() ครั้งแรกเพื่อ authorize
 * 4. Deploy > New deployment > Web app
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  SURGERY_DATE: new Date(2025, 1, 28), // 28 Feb 2025 (month is 0-indexed)
  PATIENT_NAME: 'คุณแม่',
  SHEETS: {
    HEALTH: 'ข้อมูลสุขภาพ',
    EXERCISE: 'การออกกำลังกาย',
    APPOINTMENTS: 'ตารางนัดหมาย',
    MEALS: 'อาหาร',
    MEAL_PLANS: 'เมนูแนะนำ',
    GROCERY: 'รายการซื้อของ',
    FRIDGE: 'ของในตู้เย็น',
    CONDIMENTS: 'เครื่องปรุง'
  }
};

// ==================== WEB APP ====================
function doGet() {
  initializeSheets();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('🏥 Healthcare Tracking - ดูแลคุณแม่')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================== SHEET INITIALIZATION ====================
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // สร้าง Sheet ข้อมูลสุขภาพ
  createSheetIfNotExists(ss, CONFIG.SHEETS.HEALTH, [
    'วันที่', 'เวลา', 'ความดันบน', 'ความดันล่าง', 'ชีพจร',
    'น้ำหนัก(กก.)', 'อุณหภูมิ(°C)', 'ระดับออกซิเจน(%)', 'อาการ', 'หมายเหตุ'
  ]);

  // สร้าง Sheet การออกกำลังกาย
  createSheetIfNotExists(ss, CONFIG.SHEETS.EXERCISE, [
    'วันที่', 'เวลา', 'ประเภท', 'ระยะเวลา(นาที)', 'ความเข้มข้น', 'ความรู้สึก', 'หมายเหตุ'
  ]);

  // สร้าง Sheet ตารางนัดหมาย
  createSheetIfNotExists(ss, CONFIG.SHEETS.APPOINTMENTS, [
    'วันที่', 'เวลา', 'แพทย์', 'แผนก', 'โรงพยาบาล', 'หัตถการ/รายละเอียด', 'สถานะ', 'หมายเหตุ'
  ]);

  // สร้าง Sheet อาหาร
  createSheetIfNotExists(ss, CONFIG.SHEETS.MEALS, [
    'วันที่', 'มื้อ', 'เมนู', 'ส่วนประกอบ', 'แคลอรี่', 'โปรตีน(ก.)', 'หมายเหตุ'
  ]);

  // สร้าง Sheet เมนูแนะนำ (AI)
  createSheetIfNotExists(ss, CONFIG.SHEETS.MEAL_PLANS, [
    'ชื่อเมนู', 'ประเภท', 'ส่วนประกอบ', 'แคลอรี่', 'โปรตีน(ก.)', 'เหมาะสำหรับ', 'วิธีทำ'
  ]);
  initializeMealPlans(ss);

  // สร้าง Sheet รายการซื้อของ
  createSheetIfNotExists(ss, CONFIG.SHEETS.GROCERY, [
    'วันที่ต้องซื้อ', 'รายการ', 'หมวด', 'จำนวน', 'หน่วย', 'สถานะ', 'ซื้อเมื่อ', 'หมายเหตุ'
  ]);

  // สร้าง Sheet ของในตู้เย็น
  createSheetIfNotExists(ss, CONFIG.SHEETS.FRIDGE, [
    'รายการ', 'หมวด', 'จำนวน', 'หน่วย', 'วันหมดอายุ', 'ซื้อเมื่อ', 'สถานะ'
  ]);

  // สร้าง Sheet เครื่องปรุง
  createSheetIfNotExists(ss, CONFIG.SHEETS.CONDIMENTS, [
    'รายการ', 'หมวด', 'จำนวน', 'หน่วย', 'วันหมดอายุ', 'สถานะ', 'หมายเหตุ'
  ]);
  initializeCondiments(ss);

  // เพิ่มนัดหมายผ่าตัด
  addSurgeryAppointment(ss);
}

function createSheetIfNotExists(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285f4')
      .setFontColor('white')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ==================== MEAL PLANS (AI Recommended) ====================
function initializeMealPlans(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MEAL_PLANS);
  if (sheet.getLastRow() <= 1) {
    const meals = [
      // เมนูก่อนผ่าตัด - เน้นเสริมภูมิคุ้มกัน
      ['ข้าวต้มปลา', 'เช้า', 'ข้าวหอมมะลิ, ปลากะพง, ขิง, ต้นหอม, กระเทียม', 250, 20, 'ก่อนผ่าตัด', 'ต้มข้าวจนเปื่อย ใส่ปลาสดๆ ปรุงรสเบาๆ'],
      ['ไข่ตุ๋นผัก', 'เช้า', 'ไข่ 2 ฟอง, แครอท, ฟักทอง, ซุปไก่', 180, 14, 'ก่อนผ่าตัด', 'ตีไข่กับซุป นึ่งจนสุก'],
      ['สลัดอกไก่', 'กลางวัน', 'อกไก่ย่าง, ผักสลัด, มะเขือเทศ, น้ำมันมะกอก', 300, 35, 'ก่อนผ่าตัด', 'ย่างอกไก่ หั่นบางๆ คลุกผัก'],
      ['ซุปฟักทอง', 'กลางวัน', 'ฟักทอง, นมไขมันต่ำ, ขิง', 150, 5, 'ก่อนผ่าตัด', 'ต้มฟักทองจนเปื่อย ปั่นละเอียด'],
      ['ปลานึ่งมะนาว', 'เย็น', 'ปลากะพง, มะนาว, กระเทียม, พริก, ขึ้นฉ่าย', 200, 30, 'ก่อนผ่าตัด', 'นึ่งปลาสด ราดน้ำมะนาว'],
      ['แกงจืดเต้าหู้', 'เย็น', 'เต้าหู้ไข่, หมูสับ, ผักกาดขาว, แครอท', 180, 15, 'ก่อนผ่าตัด', 'ต้มน้ำซุป ใส่เต้าหู้และผัก'],

      // เมนูหลังผ่าตัด - เน้นอ่อนนุ่ม ย่อยง่าย
      ['โจ๊กไก่ฉีก', 'เช้า', 'ข้าวหอมมะลิ, อกไก่ฉีก, ขิง, ต้นหอม', 220, 18, 'หลังผ่าตัด', 'ต้มข้าวจนเปื่อยมาก ใส่ไก่ฉีกละเอียด'],
      ['ซุปไก่ใส', 'เช้า', 'อกไก่, แครอท, ขึ้นฉ่าย, ขิง', 120, 15, 'หลังผ่าตัด', 'ต้มไก่กับผักจนเปื่อย กรองน้ำซุปใส'],
      ['มันบดผสมไข่', 'กลางวัน', 'มันฝรั่ง, ไข่ต้ม, นมไขมันต่ำ', 200, 12, 'หลังผ่าตัด', 'ต้มมันจนเปื่อย บดกับไข่ต้ม'],
      ['ปลานึ่งบด', 'กลางวัน', 'ปลากะพง, ฟักทองนึ่ง', 180, 25, 'หลังผ่าตัด', 'นึ่งปลา บดละเอียดกับฟักทอง'],
      ['ข้าวต้มหมูบด', 'เย็น', 'ข้าว, หมูสับ, ขิง, ต้นหอม', 230, 16, 'หลังผ่าตัด', 'ต้มข้าวเปื่อยมาก หมูสับละเอียด'],
      ['ซุปผักรวม', 'เย็น', 'แครอท, ฟักทอง, มันฝรั่ง, ขึ้นฉ่าย', 100, 3, 'หลังผ่าตัด', 'ต้มผักจนเปื่อย ปั่นละเอียด'],

      // ของว่าง
      ['สมูทตี้กล้วยโยเกิร์ต', 'ว่าง', 'กล้วยหอม, โยเกิร์ต, น้ำผึ้ง', 150, 5, 'ทุกช่วง', 'ปั่นรวมกัน'],
      ['แอปเปิ้ลอบ', 'ว่าง', 'แอปเปิ้ล, อบเชย, น้ำผึ้ง', 100, 1, 'ทุกช่วง', 'หั่นแอปเปิ้ล อบจนนิ่ม'],
      ['เต้าฮวยนมสด', 'ว่าง', 'เต้าฮวย, นมสดไขมันต่ำ, ขิง', 120, 6, 'ทุกช่วง', 'เต้าฮวยอุ่น ราดนมสด']
    ];
    sheet.getRange(2, 1, meals.length, meals[0].length).setValues(meals);
  }
}

// ==================== CONDIMENTS (เครื่องปรุง) ====================
function initializeCondiments(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CONDIMENTS);
  if (sheet.getLastRow() <= 1) {
    const condiments = [
      ['ซอสถั่วเหลือง (โซเดียมต่ำ)', 'ซอส', 1, 'ขวด', '', 'ต้องมี', 'เลือกแบบลดโซเดียม'],
      ['น้ำปลา (โซเดียมต่ำ)', 'ซอส', 1, 'ขวด', '', 'ต้องมี', 'ใช้แต่น้อย'],
      ['น้ำมันมะกอก', 'น้ำมัน', 1, 'ขวด', '', 'ต้องมี', 'Extra Virgin'],
      ['น้ำมันงา', 'น้ำมัน', 1, 'ขวด', '', 'ต้องมี', 'สำหรับปรุงรส'],
      ['น้ำผึ้งแท้', 'หวาน', 1, 'ขวด', '', 'ต้องมี', 'ใช้แทนน้ำตาล'],
      ['ขิงสด', 'สมุนไพร', 200, 'กรัม', '', 'ต้องมี', 'ช่วยย่อย ลดคลื่นไส้'],
      ['กระเทียมสด', 'สมุนไพร', 100, 'กรัม', '', 'ต้องมี', 'เสริมภูมิคุ้มกัน'],
      ['ต้นหอม', 'ผัก', 1, 'กำ', '', 'ต้องมี', ''],
      ['ผักชี', 'ผัก', 1, 'กำ', '', 'ต้องมี', ''],
      ['พริกไทยดำ', 'เครื่องเทศ', 1, 'ขวด', '', 'ต้องมี', 'บดสด'],
      ['เกลือทะเล', 'เครื่องปรุง', 1, 'ถุง', '', 'ต้องมี', 'ใช้แต่น้อย'],
      ['น้ำมะนาว', 'ซอส', 3, 'ลูก', '', 'ต้องมี', 'บีบสดๆ'],
      ['ซุปก้อนไก่ (โซเดียมต่ำ)', 'ซุป', 1, 'กล่อง', '', 'ต้องมี', 'หรือทำซุปเอง'],
      ['อบเชย', 'เครื่องเทศ', 1, 'ขวด', '', 'แนะนำ', 'สำหรับของหวาน'],
      ['ขมิ้น', 'สมุนไพร', 1, 'ถุง', '', 'แนะนำ', 'ต้านอักเสบ']
    ];
    sheet.getRange(2, 1, condiments.length, condiments[0].length).setValues(condiments);
  }
}

// ==================== SURGERY APPOINTMENT ====================
function addSurgeryAppointment(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  const data = sheet.getDataRange().getValues();

  // Check if surgery appointment exists
  const surgeryExists = data.some(row =>
    row[5] && row[5].toString().includes('ผ่าตัดต่อมไทรอยด์')
  );

  if (!surgeryExists) {
    sheet.appendRow([
      '28/02/2568', '08:00', 'แพทย์ผ่าตัด', 'ศัลยกรรม', 'โรงพยาบาล',
      'ผ่าตัดต่อมไทรอยด์ + ก้อนเนื้อ + รักษาจุดที่ปอด', 'รอดำเนินการ',
      'งดน้ำงดอาหารก่อนผ่าตัด 8 ชม.'
    ]);

    // Highlight surgery row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 8).setBackground('#ffcccb');
  }
}

// ==================== DATA OPERATIONS ====================

// บันทึกข้อมูลสุขภาพ
function saveHealthData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.HEALTH);
  sheet.appendRow([
    data.date, data.time, data.systolic, data.diastolic, data.pulse,
    data.weight, data.temperature, data.oxygen, data.symptoms, data.notes
  ]);
  SpreadsheetApp.flush(); // บันทึกทันที
  return { success: true, message: 'บันทึกข้อมูลสุขภาพเรียบร้อย' };
}

// บันทึกการออกกำลังกาย
function saveExercise(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.EXERCISE);
  sheet.appendRow([
    data.date, data.time, data.type, data.duration, data.intensity, data.feeling, data.notes
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: 'บันทึกการออกกำลังกายเรียบร้อย' };
}

// บันทึกนัดหมาย
function saveAppointment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  sheet.appendRow([
    data.date, data.time, data.doctor, data.department, data.hospital,
    data.procedure, data.status || 'รอดำเนินการ', data.notes
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: 'บันทึกนัดหมายเรียบร้อย' };
}

// บันทึกอาหาร
function saveMeal(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MEALS);
  sheet.appendRow([
    data.date, data.mealType, data.menu, data.ingredients, data.calories, data.protein, data.notes
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: 'บันทึกอาหารเรียบร้อย' };
}

// บันทึกรายการซื้อของ
function saveGroceryItem(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GROCERY);
  sheet.appendRow([
    data.buyDate, data.item, data.category, data.quantity, data.unit,
    data.status || 'ต้องซื้อ', '', data.notes
  ]);
  return { success: true, message: 'เพิ่มรายการซื้อของเรียบร้อย' };
}

// อัพเดทสถานะซื้อของ
function updateGroceryStatus(rowIndex, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GROCERY);
  sheet.getRange(rowIndex + 2, 6).setValue(status); // Column F = Status
  if (status === 'ซื้อแล้ว') {
    sheet.getRange(rowIndex + 2, 7).setValue(new Date()); // Column G = Purchase date
  }
  return { success: true };
}

// บันทึกของในตู้เย็น
function saveFridgeItem(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FRIDGE);
  sheet.appendRow([
    data.item, data.category, data.quantity, data.unit, data.expiry, data.purchaseDate, 'มี'
  ]);
  return { success: true, message: 'เพิ่มของในตู้เย็นเรียบร้อย' };
}

// ==================== DATA RETRIEVAL ====================

// ดึงข้อมูลสุขภาพ
function getHealthData(limit) {
  return getSheetData(CONFIG.SHEETS.HEALTH, limit || 30);
}

// ดึงการออกกำลังกาย
function getExerciseData(limit) {
  return getSheetData(CONFIG.SHEETS.EXERCISE, limit || 30);
}

// ดึงนัดหมาย
function getAppointments() {
  return getSheetData(CONFIG.SHEETS.APPOINTMENTS, 50);
}

// ดึงอาหาร
function getMeals(limit) {
  return getSheetData(CONFIG.SHEETS.MEALS, limit || 30);
}

// ดึงเมนูแนะนำ (ไม่ต้อง reverse - เป็น static data)
function getMealPlans() {
  return getSheetData(CONFIG.SHEETS.MEAL_PLANS, 100, false);
}

// ดึงรายการซื้อของ
function getGroceryList() {
  return getSheetData(CONFIG.SHEETS.GROCERY, 100);
}

// ดึงของในตู้เย็น
function getFridgeItems() {
  return getSheetData(CONFIG.SHEETS.FRIDGE, 100);
}

// ดึงเครื่องปรุง (ไม่ต้อง reverse - เป็น static data)
function getCondiments() {
  return getSheetData(CONFIG.SHEETS.CONDIMENTS, 50, false);
}

function getSheetData(sheetName, limit, reverseOrder = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  let rows = data.slice(1);

  // เก็บ original index ก่อน reverse
  rows = rows.map((row, index) => ({ row, originalIndex: index }));

  // เรียงจากใหม่ไปเก่า (ข้อมูลล่าสุดอยู่บนสุด)
  if (reverseOrder) {
    rows = rows.reverse();
  }

  // จำกัดจำนวน
  rows = rows.slice(0, limit);

  return rows.map(item => {
    const obj = { _rowIndex: item.originalIndex };
    headers.forEach((header, i) => {
      let value = item.row[i];
      // แปลง Date object เป็น string
      if (value instanceof Date) {
        value = formatThaiDate(value);
      }
      obj[header] = value;
    });
    return obj;
  });
}

// ==================== DASHBOARD DATA ====================
function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation

  const surgeryDate = new Date(2025, 1, 28); // 28 Feb 2025
  surgeryDate.setHours(0, 0, 0, 0);

  const daysUntilSurgery = Math.round((surgeryDate - today) / (1000 * 60 * 60 * 24));

  // Get latest health data
  const healthData = getHealthData(1);
  const latestHealth = healthData[0] || {};

  // Get upcoming appointments
  const appointments = getAppointments();
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = parseThaiDate(apt['วันที่']);
    return aptDate >= today;
  }).slice(0, 5);

  // Get grocery items to buy
  const groceryList = getGroceryList();
  const toBuy = groceryList.filter(item => item['สถานะ'] === 'ต้องซื้อ');

  // Get today's meals
  const meals = getMeals(10);
  const todayStr = formatThaiDate(today);
  const todayMeals = meals.filter(m => m['วันที่'] === todayStr);

  return {
    patientName: CONFIG.PATIENT_NAME,
    surgeryDate: '28/02/2568',
    daysUntilSurgery: daysUntilSurgery,
    phase: daysUntilSurgery > 0 ? 'ก่อนผ่าตัด' : 'หลังผ่าตัด',
    latestHealth: latestHealth,
    upcomingAppointments: upcomingAppointments,
    groceryToBuy: toBuy.length,
    todayMeals: todayMeals
  };
}

// ==================== GROCERY PLANNING ====================
function generateGroceryList(days) {
  // สร้างรายการซื้อของสำหรับ X วัน
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GROCERY);

  const buyDate = new Date();
  buyDate.setDate(buyDate.getDate() + (days || 3));
  const buyDateStr = formatThaiDate(buyDate);

  const essentials = [
    { item: 'ไข่ไก่', category: 'โปรตีน', quantity: 10, unit: 'ฟอง' },
    { item: 'อกไก่', category: 'โปรตีน', quantity: 500, unit: 'กรัม' },
    { item: 'ปลากะพง', category: 'โปรตีน', quantity: 400, unit: 'กรัม' },
    { item: 'เต้าหู้ไข่', category: 'โปรตีน', quantity: 2, unit: 'แพ็ค' },
    { item: 'ผักกาดขาว', category: 'ผัก', quantity: 1, unit: 'หัว' },
    { item: 'แครอท', category: 'ผัก', quantity: 3, unit: 'หัว' },
    { item: 'ฟักทอง', category: 'ผัก', quantity: 500, unit: 'กรัม' },
    { item: 'ขึ้นฉ่าย', category: 'ผัก', quantity: 1, unit: 'กำ' },
    { item: 'มะเขือเทศ', category: 'ผัก', quantity: 4, unit: 'ลูก' },
    { item: 'กล้วยหอม', category: 'ผลไม้', quantity: 6, unit: 'ลูก' },
    { item: 'แอปเปิ้ล', category: 'ผลไม้', quantity: 4, unit: 'ลูก' },
    { item: 'โยเกิร์ตไขมันต่ำ', category: 'นม', quantity: 4, unit: 'ถ้วย' },
    { item: 'นมสดไขมันต่ำ', category: 'นม', quantity: 1, unit: 'ลิตร' },
    { item: 'ข้าวหอมมะลิ', category: 'แป้ง', quantity: 1, unit: 'กก.' },
    { item: 'มันฝรั่ง', category: 'แป้ง', quantity: 3, unit: 'หัว' }
  ];

  essentials.forEach(item => {
    sheet.appendRow([
      buyDateStr, item.item, item.category, item.quantity, item.unit, 'ต้องซื้อ', '', ''
    ]);
  });

  return { success: true, message: `สร้างรายการซื้อของสำหรับวันที่ ${buyDateStr} เรียบร้อย (${essentials.length} รายการ)` };
}

// ==================== UTILITY FUNCTIONS ====================
function formatThaiDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

// แปลงค่าวันที่ให้เป็น string เสมอ
function toDateString(dateValue) {
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    return formatThaiDate(dateValue);
  }
  if (typeof dateValue === 'string') {
    return dateValue;
  }
  if (typeof dateValue === 'number') {
    return formatThaiDate(new Date(dateValue));
  }
  return String(dateValue);
}

function parseThaiDate(dateStr) {
  if (!dateStr) return new Date();

  // ถ้าเป็น Date object อยู่แล้ว
  if (dateStr instanceof Date) {
    return dateStr;
  }

  // ถ้าเป็น string
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]) - 543, parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }

  // ถ้าเป็นตัวเลข (timestamp)
  if (typeof dateStr === 'number') {
    return new Date(dateStr);
  }

  return new Date();
}

function getCurrentDateTime() {
  const now = new Date();
  return {
    date: formatThaiDate(now),
    time: now.toTimeString().slice(0, 5)
  };
}

// ==================== DELETE OPERATIONS ====================
function deleteHealthRecord(rowIndex) {
  return deleteRow(CONFIG.SHEETS.HEALTH, rowIndex);
}

function deleteExerciseRecord(rowIndex) {
  return deleteRow(CONFIG.SHEETS.EXERCISE, rowIndex);
}

function deleteAppointment(rowIndex) {
  return deleteRow(CONFIG.SHEETS.APPOINTMENTS, rowIndex);
}

function deleteMeal(rowIndex) {
  return deleteRow(CONFIG.SHEETS.MEALS, rowIndex);
}

function deleteGroceryItem(rowIndex) {
  return deleteRow(CONFIG.SHEETS.GROCERY, rowIndex);
}

function deleteFridgeItem(rowIndex) {
  return deleteRow(CONFIG.SHEETS.FRIDGE, rowIndex);
}

function deleteRow(sheetName, rowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.deleteRow(rowIndex + 2); // +2 because of header and 0-index
  return { success: true };
}
