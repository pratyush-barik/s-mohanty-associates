/**
 * optimize-valuer-images.mjs
 * Optimizes the processed PNGs to reasonable sizes for web + PDF use.
 * Keeps transparency but reduces file size.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ASSETS_DIR = join(root, 'public', 'assets', 'valuer');

async function optimize(filename, maxWidth, maxHeight) {
  const inputPath = join(ASSETS_DIR, filename);
  const buf = readFileSync(inputPath);
  const meta = await sharp(buf).metadata();
  console.log(`📄 ${filename}: ${meta.width}x${meta.height}`);

  // Resize down if too large (maintaining aspect ratio), keep alpha, optimize PNG
  const result = await sharp(buf)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  writeFileSync(inputPath, result);
  console.log(`  ✅ Optimized: ${(result.length / 1024).toFixed(1)} KB`);
}

(async () => {
  // Signature: max 1200x400 (wide, not too tall)
  await optimize('valuer-signature.png', 1200, 400);
  // Stamp: max 600x600 (circular stamp)
  await optimize('valuer-stamp.png', 600, 600);
  console.log('\nDone.');
})();
