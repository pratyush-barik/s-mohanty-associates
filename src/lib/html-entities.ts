/**
 * html-entities.ts — Utility functions to decode HTML entities (e.g. &amp;, &lt;, &gt;, &#39;)
 * from strings and nested objects so that data autofilled into web UI, forms,
 * database fields, and PDF renderers is clean and displays real characters (&, <, >, ', etc.).
 */

export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') return str;
  let decoded = str;
  let prev = '';
  let iterations = 0;

  while (decoded !== prev && iterations < 5) {
    prev = decoded;
    iterations++;
    decoded = decoded
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#38;/g, '&')
      .replace(/&#x26;/gi, '&')
      .replace(/&#34;/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&#60;/g, '<')
      .replace(/&#x3c;/gi, '<')
      .replace(/&#62;/g, '>')
      .replace(/&#x3e;/gi, '>');
  }

  return decoded;
}

export function decodeHtmlEntitiesDeep<T>(val: T): T {
  if (typeof val === 'string') {
    return decodeHtmlEntities(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(item => decodeHtmlEntitiesDeep(item)) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = decodeHtmlEntitiesDeep(v);
    }
    return res;
  }
  return val;
}
