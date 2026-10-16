/**
 * bank-input-constraints.ts — Standardized input sanitizers and calculation helpers
 * for all Bank & FIS Valuation Report builders and PDF generators.
 *
 * Enforces:
 * 1. Strict positive numeric constraints (no negative values, no letters in number fields).
 * 2. Proper handling of 'NA' where applicable.
 * 3. Exact decimal math to prevent floating point imprecision.
 * 4. Safe parsing preventing NaN and runaway calculations.
 */

/**
 * Sanitize input to only accept positive floats (digits and at most one decimal point).
 * Strips negative signs and any non-numeric/non-decimal characters.
 */
export const sanitizePositiveFloat = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str.toUpperCase() === 'NA') return '';
  // Strip negative signs and non-numeric characters except '.'
  let cleaned = str.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

/**
 * Sanitize input to accept positive floats or 'NA' (allows typing 'N' or 'NA').
 * Strips negative signs and invalid characters.
 */
export const sanitizePositiveFloatWithNA = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  return sanitizePositiveFloat(str);
};

/**
 * Sanitize input to only accept positive integers.
 * Strips negative signs, decimals, and non-digit characters.
 */
export const sanitizePositiveInt = (val: string | number | undefined | null, maxLen?: number): string => {
  if (val === undefined || val === null) return '';
  let cleaned = String(val).replace(/[^0-9]/g, '');
  if (maxLen && cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }
  return cleaned;
};

/**
 * Sanitize input to only accept positive integers or 'NA'.
 */
export const sanitizePositiveIntWithNA = (val: string | number | undefined | null, maxLen?: number): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  return sanitizePositiveInt(str, maxLen);
};

/**
 * Sanitize percentage values: positive float between 0 and 100, with optional '%' suffix.
 * Strictly prevents negative values.
 */
export const sanitizePercentage = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  const hasPercent = str.includes('%');
  let cleaned = str.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  if (!cleaned) return hasPercent ? '%' : '';
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 100) {
    cleaned = '100';
  }
  return hasPercent ? `${cleaned}%` : cleaned;
};

/**
 * Sanitize positive numerical range (e.g. "100-200" or "1500-2000" or "6000-8000").
 * Strips leading negative signs and ensures only positive numbers on both sides of hyphen.
 */
export const sanitizePositiveRange = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  // Strip any leading minus signs or whitespace
  let cleaned = str.replace(/^[-\s]+/g, '');
  // Keep only digits, dots, spaces, and hyphens
  cleaned = cleaned.replace(/[^0-9.\s-]/g, '');
  // Keep at most one hyphen for the range separator
  const parts = cleaned.split('-');
  if (parts.length > 2) {
    cleaned = parts[0] + '-' + parts.slice(1).join('').replace(/-/g, '');
  }
  return cleaned;
};

/**
 * Sanitize age / future life fields (e.g. "1 Year", "59 Years", or "NA").
 * Eliminates leading negative signs and keeps clean alphanumeric characters and spaces.
 */
export const sanitizeYearsWithNA = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  let cleaned = str.replace(/^[-\s]+/g, '');
  cleaned = cleaned.replace(/[^0-9a-zA-Z\s]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

/**
 * Sanitize dimensions / height / storeys (e.g. "GF", "G+1", "10 ft", "90'-0\"", "NA").
 * Strictly prohibits negative values.
 */
export const sanitizeDimensionWithNA = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  let cleaned = str.replace(/^[-\s]+/g, '');
  cleaned = cleaned.replace(/[^0-9a-zA-Z\s+.'"/\\-]/g, '');
  return cleaned;
};

/**
 * Safe float parser returning non-negative finite number, never NaN.
 */
export const parseSafeFloat = (val: any, fallback: number = 0): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : Math.max(0, val);
  }
  const str = String(val).trim();
  if (str.toUpperCase() === 'NA') return fallback;
  const cleaned = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) || !isFinite(num) ? fallback : Math.max(0, num);
};

/**
 * Safe integer parser returning non-negative integer, never NaN.
 */
export const parseSafeInt = (val: any, fallback: number = 0): number => {
  return Math.round(parseSafeFloat(val, fallback));
};

/**
 * Exact decimal addition to avoid floating point imprecision without premature roundoff.
 */
export const sumDecimals = (values: (string | number | undefined | null)[]): number => {
  let sum = 0;
  let maxDecimals = 0;
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim().replace(/[^0-9.]/g, '');
    if (!s) continue;
    const num = parseFloat(s);
    if (isNaN(num)) continue;
    if (s.includes('.')) {
      const dec = s.split('.')[1].length;
      if (dec > maxDecimals) maxDecimals = dec;
    }
    sum += num;
  }
  if (maxDecimals > 0) {
    const factor = Math.pow(10, Math.min(maxDecimals, 8));
    return Math.round(sum * factor) / factor;
  }
  return Math.round(sum);
};

/**
 * Formats a clean exact decimal without unnecessary trailing zeroes.
 */
export const formatExactDecimal = (n: number): string => {
  if (n <= 0 || isNaN(n) || !isFinite(n)) return '';
  return String(n);
};

/**
 * Exact decimal multiplication to avoid IEEE-754 floating point imprecision.
 */
export const multiplyExactDecimals = (a: any, b: any): number => {
  const numA = parseSafeFloat(a);
  const numB = parseSafeFloat(b);
  if (numA <= 0 || numB <= 0) return 0;
  const strA = String(a).trim().replace(/[^0-9.]/g, '');
  const strB = String(b).trim().replace(/[^0-9.]/g, '');
  const decA = strA.includes('.') ? strA.split('.')[1].length : 0;
  const decB = strB.includes('.') ? strB.split('.')[1].length : 0;
  const totalDecimals = decA + decB;
  const rawProduct = numA * numB;
  if (totalDecimals > 0) {
    const factor = Math.pow(10, Math.min(totalDecimals, 8));
    return Math.round(rawProduct * factor) / factor;
  }
  return Math.round(rawProduct);
};

/**
 * Calculates a percentage value safely: (base * percent) / 100.
 */
export const calculatePercentageValue = (base: any, percent: any): number => {
  const baseNum = parseSafeFloat(base);
  const pctNum = parseSafeFloat(percent);
  if (baseNum <= 0 || pctNum <= 0) return 0;
  return Math.round((baseNum * pctNum) / 100);
};
