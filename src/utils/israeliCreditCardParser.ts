import * as XLSX from 'xlsx';

export interface CreditCardTransaction {
  date: string; // ISO date
  merchant: string;
  amount: number; // in ILS
  category?: string;
}

/**
 * Parse Israeli credit card statement (Excel format)
 * Supports: One Zero, CAL, Isracard, etc.
 */
export function parseIsraeliCreditCard(file: File): Promise<CreditCardTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        }) as any[][];

        const transactions: CreditCardTransaction[] = [];

        // Find header row (looks for 'תאריך' or 'שם בית עסק' or 'סכום')
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.some((cell: any) =>
            String(cell).includes('תאריך') ||
            String(cell).includes('שם בית עסק') ||
            String(cell).includes('סכום חיוב')
          )) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not find header row in credit card statement');
        }

        const headers = jsonData[headerRowIndex].map((h: any) => String(h || '').toLowerCase());

        // Find column indices
        const dateCol = headers.findIndex((h: string) => h.includes('תאריך'));
        const merchantCol = headers.findIndex((h: string) => h.includes('בית עסק') || h.includes('שם'));
        const amountCol = headers.findIndex((h: string) => h.includes('חיוב'));
        const categoryCol = headers.findIndex((h: string) => h.includes('ענף'));

        // Parse data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const dateValue = row[dateCol];
          const merchant = row[merchantCol];
          const amount = row[amountCol];

          // Skip if missing critical data
          if (!dateValue || !merchant || !amount) continue;

          // Parse date
          let dateStr: string;
          if (dateValue instanceof Date) {
            dateStr = dateValue.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string') {
            // Try to parse various date formats
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
              continue; // Skip invalid dates
            }
          } else {
            continue;
          }

          // Parse amount
          const amountNum = typeof amount === 'number'
            ? amount
            : parseFloat(String(amount).replace(/[^\d.-]/g, ''));

          if (isNaN(amountNum) || amountNum === 0) continue;

          // Get category if available
          const category = categoryCol >= 0 ? row[categoryCol] : undefined;

          transactions.push({
            date: dateStr,
            merchant: String(merchant).trim(),
            amount: Math.abs(amountNum), // Use absolute value
            category: category ? String(category).trim() : undefined,
          });
        }

        console.log(`✅ Parsed ${transactions.length} transactions from credit card statement`);
        resolve(transactions);
      } catch (error) {
        console.error('Error parsing credit card file:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Convert credit card transactions to expense import format
 */
export function formatForExpenseImport(transactions: CreditCardTransaction[]): string {
  return transactions
    .map(t => {
      const date = t.date; // YYYY-MM-DD format
      const merchant = t.merchant;
      const amount = t.amount.toFixed(2);
      const category = t.category ? `[${t.category}]` : '';
      return `${date} ${merchant} ${amount} ₪ ${category}`.trim();
    })
    .join('\n');
}
