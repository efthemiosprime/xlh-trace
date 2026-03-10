import { generateTreePDFBlob } from './pdfExport.js';

const SUBJECT = 'XLH Family Tree - Inheritance Report';
const BODY =
  'Please find attached the XLH Family Tree inheritance report showing X-linked hypophosphatemia inheritance patterns.\n\n' +
  '(Note: If the PDF was not automatically attached, it has been downloaded to your device — please attach it manually.)';

/**
 * Share the family tree PDF via the native share sheet (mobile/modern desktop)
 * or fall back to downloading the PDF + opening a mailto: link.
 * @param {SVGElement} svgElement
 */
export async function shareTreePDF(svgElement) {
  const blob = await generateTreePDFBlob(svgElement);
  if (!blob) return;

  const file = new File([blob], 'xlh-family-tree.pdf', { type: 'application/pdf' });

  // Primary path: Web Share API with file support
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: SUBJECT,
        text: BODY,
      });
      return;
    } catch (err) {
      // User cancelled or share failed — fall through to fallback
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: download PDF + open mailto
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'xlh-family-tree.pdf';
  a.click();
  URL.revokeObjectURL(url);

  const mailto = `mailto:?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
  window.open(mailto, '_blank');
}
