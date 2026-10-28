export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  return classes
    .flatMap(c => {
      if (!c) return [];
      if (typeof c === 'string') return c.split(' ');
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([_, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Sanitizes a project code or ref for safe use in file downloads (replacing '/' and invalid chars with '_').
 */
export function sanitizeFilenameCode(code?: string): string {
  if (!code) return 'report';
  return code.replace(/[\/\\:*?"<>|]/g, '_').trim();
}

/**
 * Auto-generates the Income Tax statutory reference number:
 * SMA/V-01/IT/BBSR-NNNN/YY
 * Hardcoded city is BBSR (CCIT Bhubaneswar registered valuer jurisdiction).
 * E.g., serial 1 -> SMA/V-01/IT/BBSR-0001/26
 */
export function autoGenerateTaxCircleRef(serialOrProjectCode?: number | string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  let serial = '0001';

  if (typeof serialOrProjectCode === 'number') {
    serial = String(serialOrProjectCode).padStart(4, '0');
  } else if (typeof serialOrProjectCode === 'string') {
    const parts = serialOrProjectCode.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart)) {
      serial = lastPart.padStart(4, '0');
    }
  }

  return `SMA/V-01/IT/BBSR-${serial}/${yy}`;
}
