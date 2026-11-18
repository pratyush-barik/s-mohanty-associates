/**
 * process-valuer-images.mjs
 * Removes white/near-white background from signature and stamp images,
 * upscales them 2x, and saves as PNG with transparency.
 *
 * Usage: node scripts/process-valuer-images.mjs
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const INPUT_SIG   = join(root, 'temp', '1.jpeg');
const INPUT_STAMP = join(root, 'temp', '2.jpeg');
const OUTPUT_DIR  = join(root, 'public', 'assets', 'valuer');
const OUT_SIG     = join(OUTPUT_DIR, 'valuer-signature.png');
const OUT_STAMP   = join(OUTPUT_DIR, 'valuer-stamp.png');

mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Remove white/near-white background from an image, then upscale.
 * White-removal threshold: pixels with R>230 AND G>230 AND B>230 → transparent.
 * For the stamp (which may be colored), we use a looser threshold and only remove
 * near-pure-white (R>240 AND G>240 AND B>240).
 */
async function processImage(inputPath, outputPath, threshold = 230, upscale = 2.5) {
  console.log(`Processing: ${inputPath}`);

  // 1. Load and convert to raw RGBA buffer for pixel manipulation
  const inputBuf = readFileSync(inputPath);
  const { data, info } = await sharp(inputBuf)
    .ensureAlpha()           // add alpha channel if missing
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)

  // 2. Walk pixels and make white/near-white transparent
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Near-white → transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0; // alpha = 0 (fully transparent)
    } else {
      // Partial transparency for near-white (anti-aliasing smoothing)
      const whiteness = Math.min(r, g, b);
      if (whiteness > threshold - 30) {
        // Scale alpha 0..255 based on how non-white the pixel is
        const alpha = Math.round(255 * (1 - (whiteness - (threshold - 30)) / 30));
        data[i + 3] = Math.min(data[i + 3], alpha);
      }
    }
  }

  // 3. Create sharp image from modified raw buffer
  const processedSharp = sharp(data, {
    raw: { width, height, channels },
  });

  // 4. Upscale (Lanczos for quality)
  const finalBuf = await processedSharp
    .resize(
      Math.round(width * upscale),
      Math.round(height * upscale),
      { kernel: 'lanczos3' }
    )
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(outputPath, finalBuf);
  const stats = {
    original: `${width}x${height}`,
    upscaled: `${Math.round(width * upscale)}x${Math.round(height * upscale)}`,
    size: `${(finalBuf.length / 1024).toFixed(1)} KB`,
  };
  console.log(`  ✅ Saved → ${outputPath}`);
  console.log(`  📐 ${stats.original} → ${stats.upscaled} (${stats.size})`);
  return outputPath;
}

(async () => {
  try {
    console.log('\n🖊  Processing Signature (temp/1.jpeg) …');
    await processImage(INPUT_SIG, OUT_SIG, 230, 2.5);

    console.log('\n🔵  Processing Stamp (temp/2.jpeg) …');
    // Stamp may have colored elements – use higher threshold to only remove pure white
    await processImage(INPUT_STAMP, OUT_STAMP, 245, 2.5);

    console.log('\n✅  Done! Both images saved to public/assets/valuer/');
    console.log('   • valuer-signature.png  (bg-removed, 2.5x upscaled)');
    console.log('   • valuer-stamp.png      (bg-removed, 2.5x upscaled)');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
