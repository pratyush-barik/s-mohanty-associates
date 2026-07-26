/**
 * Convert a number to Indian Rupee words (Lakhs/Crores system).
 * Example: 17136000 → "Rupees One Crore Seventy One Lakhs Thirty Six Thousand Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n: number): string {
  if (n === 0) return '';
  if (n < 100) return twoDigits(n);
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
}

export function numberToWords(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;

  if (isNaN(n) || n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numberToWords(-n);

  // Indian numbering: Crore, Lakh, Thousand, Hundred
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = Math.floor(n % 1000);

  let result = '';

  if (crore > 0) {
    result += twoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += twoDigits(lakh) + ' Lakhs ';
  }
  if (thousand > 0) {
    result += twoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += threeDigits(remainder);
  }

  return result.trim();
}

export function rupeesInWords(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(n) || n === 0) return 'Rupees Zero Only';

  const integerPart = Math.floor(n);
  const paisePart = Math.round((n - integerPart) * 100);

  let word = `Rupees ${numberToWords(integerPart)}`;
  if (paisePart > 0) {
    word += ` and ${twoDigits(paisePart)} Paise`;
  }
  return `${word} Only`;
}

/**
 * Format a number in Indian comma style: 1,71,36,000
 */
export function formatIndianCurrency(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : Number(num);
  if (isNaN(n)) return '0';
  
  const parts = n.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let str = integerPart;
  if (str.length <= 3) {
    const formattedInt = str;
    return decimalPart === '00' ? formattedInt : `${formattedInt}.${decimalPart}`;
  }

  let lastThree = str.substring(str.length - 3);
  const remaining = str.substring(0, str.length - 3);
  if (remaining.length > 0) {
    lastThree = ',' + lastThree;
  }
  const formattedInt = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return decimalPart === '00' ? formattedInt : `${formattedInt}.${decimalPart}`;
}
