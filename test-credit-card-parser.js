import XLSX from 'xlsx';
import fs from 'fs';

const filePath = '/Users/ofergrosfeld/Downloads/פירוט חיובים לכרטיס מאסטרקארד 4565 - 02.06.26.xlsx';

try {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  console.log('📊 Sheet name:', firstSheetName);

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  console.log(`\n📄 Total rows: ${jsonData.length}`);

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.some(cell =>
      String(cell).includes('תאריך') ||
      String(cell).includes('שם בית עסק') ||
      String(cell).includes('סכום חיוב')
    )) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error('❌ Could not find header row');
    process.exit(1);
  }

  console.log(`\n✅ Found header at row ${headerRowIndex + 1}`);
  console.log('Headers:', jsonData[headerRowIndex]);

  const headers = jsonData[headerRowIndex].map(h => String(h || '').toLowerCase());

  // Find column indices
  const dateCol = headers.findIndex(h => h.includes('תאריך'));
  const merchantCol = headers.findIndex(h => h.includes('בית עסק') || h.includes('שם'));
  const amountCol = headers.findIndex(h => h.includes('חיוב'));
  const categoryCol = headers.findIndex(h => h.includes('ענף'));

  console.log(`\n📍 Column indices:`);
  console.log(`  Date: ${dateCol}`);
  console.log(`  Merchant: ${merchantCol}`);
  console.log(`  Amount: ${amountCol}`);
  console.log(`  Category: ${categoryCol}`);

  const transactions = [];

  // Parse data rows
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const dateValue = row[dateCol];
    const merchant = row[merchantCol];
    const amount = row[amountCol];

    if (!dateValue || !merchant || !amount) continue;

    // Parse date
    let dateStr;
    if (dateValue instanceof Date) {
      dateStr = dateValue.toISOString().split('T')[0];
    } else if (typeof dateValue === 'string') {
      const match = dateValue.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) {
          year = '20' + year;
        }
        dateStr = `${year}-${month}-${day}`;
      } else {
        continue;
      }
    } else {
      continue;
    }

    // Parse amount
    const amountNum = typeof amount === 'number'
      ? amount
      : parseFloat(String(amount).replace(/[^\d.-]/g, ''));

    if (isNaN(amountNum) || amountNum === 0) continue;

    const category = categoryCol >= 0 ? row[categoryCol] : undefined;

    transactions.push({
      date: dateStr,
      merchant: String(merchant).trim(),
      amount: Math.abs(amountNum),
      category: category ? String(category).trim() : undefined,
    });
  }

  console.log(`\n✅ Successfully parsed ${transactions.length} transactions\n`);

  // Show first 15 transactions
  console.log('📋 Sample transactions (first 15):');
  console.log('─'.repeat(80));
  transactions.slice(0, 15).forEach((t, idx) => {
    const cat = t.category ? `[${t.category}]` : '';
    console.log(`${idx + 1}. ${t.date} | ₪${t.amount.toFixed(2)} | ${t.merchant} ${cat}`);
  });

  // Show category distribution
  const categoryCount = {};
  transactions.forEach(t => {
    const cat = t.category || 'Unknown';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  console.log('\n\n📊 Category distribution:');
  console.log('─'.repeat(80));
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} transactions`);
    });

  // Show date range
  const dates = transactions.map(t => new Date(t.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  console.log(`\n\n📅 Date range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

  // Show total amount
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(`\n💰 Total amount: ₪${total.toFixed(2)}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
