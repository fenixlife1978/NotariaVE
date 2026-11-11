import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from 'docx';
import saveAs from 'file-saver';
import { SarenCriteriaConfig } from '../types/legal';

// Helper to convert mm to twips (1 inch = 25.4 mm = 1440 twips => 1 mm = 56.6929 twips)
function mmToTwip(mm: number): number {
  return Math.round(mm * 56.6929);
}

export async function exportToWordDocx(
  title: string,
  fullText: string,
  criteria: SarenCriteriaConfig,
  fileName: string = 'documento_notarial_saren.docx'
): Promise<void> {
  const leftTwips = mmToTwip(criteria.leftMarginMm || 40); // 40mm = 4cm
  const topTwips = mmToTwip(criteria.topMarginMm || 40);
  const rightTwips = mmToTwip(criteria.rightMarginMm || 20);
  const bottomTwips = mmToTwip(criteria.bottomMarginMm || 25);

  const fontName = criteria.fontFamily || 'Times New Roman';
  const fontSizeHalfPoints = (criteria.fontSizePt || 12) * 2; // docx uses half-points

  // Split text by paragraphs
  const rawParagraphs = fullText.split('\n');

  const docParagraphs: Paragraph[] = [];

  // Title header
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400, line: 360 }, // 1.5 line spacing
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: fontName,
          size: fontSizeHalfPoints + 2,
        }),
      ],
    })
  );

  for (const rawP of rawParagraphs) {
    const trimmed = rawP.trim();
    if (!trimmed) {
      docParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [],
        })
      );
      continue;
    }

    const isHeaderLine =
      trimmed.startsWith('CIUDADANO:') ||
      trimmed.startsWith('NOTARIO PÚBLICO') ||
      trimmed.startsWith('REGISTRADOR MERCANTIL') ||
      trimmed.startsWith('SU DESPACHO.-') ||
      trimmed.startsWith('TÍTULO ') ||
      trimmed.startsWith('DECLARACIÓN JURADA');

    const isSignatureLine = trimmed.includes('_____') || trimmed.includes('EL OTORGANTE') || trimmed.includes('EL ADQUIRENTE');

    if (isHeaderLine) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 180, after: 120, line: 360 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              font: fontName,
              size: fontSizeHalfPoints,
            }),
          ],
        })
      );
    } else if (isSignatureLine) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120, line: 360 },
          children: [
            new TextRun({
              text: trimmed,
              font: fontName,
              size: fontSizeHalfPoints - 2,
            }),
          ],
        })
      );
    } else {
      // Standard Legal Body Paragraph
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            firstLine: 720, // 0.5 inch / 1.27 cm legal indent
          },
          spacing: {
            before: 120,
            after: 120,
            line: 360, // 1.5 spacing
          },
          children: [
            new TextRun({
              text: trimmed,
              font: fontName,
              size: fontSizeHalfPoints,
            }),
          ],
        })
      );
    }
  }

  // Create Document with Legal Paper Dimensions (8.5 x 14 in)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // 8.5 inches
              height: 20160, // 14.0 inches (Legal Paper)
            },
            margin: {
              top: topTwips,
              bottom: bottomTwips,
              left: leftTwips,
              right: rightTwips,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  // @ts-ignore
  const saver = (saveAs as any).default || saveAs;
  saver(blob, fileName);
}
