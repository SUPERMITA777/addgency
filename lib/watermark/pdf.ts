import { PDFDocument, rgb, degrees } from 'pdf-lib';

/**
 * Adds a diagonal, semi-transparent watermark on every page of a PDF document.
 * 
 * @param inputBuffer - Original PDF file buffer
 * @param watermarkText - Text to display as watermark
 */
export async function applyPdfWatermark(inputBuffer: Buffer, watermarkText: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(inputBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 36;

    // Draw repeating watermarks diagonally across the page to ensure coverage
    for (let x = 50; x < width; x += 250) {
      for (let y = 50; y < height; y += 250) {
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.2, // 20% opacity as requested
          rotate: degrees(-45),
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
