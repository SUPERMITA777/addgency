import sharp from 'sharp';

/**
 * Applies a diagonal, semi-transparent watermark pattern (tile style) over an image.
 * Uses sharp's tile option for maximum performance.
 * 
 * @param inputBuffer - Original image buffer
 * @param watermarkText - Text to overlay
 */
export async function applyImageWatermark(inputBuffer: Buffer, watermarkText: string): Promise<Buffer> {
  // Create a 250x250 SVG tile that displays the watermark text diagonally
  // Opacity is set to 0.3 (30%) as requested
  const tileSvg = Buffer.from(`
    <svg width="250" height="250" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark {
          fill: rgba(128, 128, 128, 0.3);
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          text-anchor: middle;
        }
      </style>
      <text x="125" y="125" class="watermark" transform="rotate(-45 125 125)">${watermarkText}</text>
    </svg>
  `);

  return sharp(inputBuffer)
    .composite([{ input: tileSvg, tile: true, blend: 'over' }])
    .toBuffer();
}
