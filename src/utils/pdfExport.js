import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function sanitizeFilename(value, fallback = 'export') {
  const normalized = String(value || fallback)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

export async function exportElementAsPdf(element, fileTitle, options = {}) {
  if (!element) {
    return { error: 'Nothing to export.' };
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: options.scale || 2,
      useCORS: true,
      logging: false,
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let remainingHeight = imgHeight;
    let offsetY = 0;

    pdf.addImage(imageData, 'PNG', 0, offsetY, imgWidth, imgHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      offsetY = remainingHeight - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, offsetY, imgWidth, imgHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
    }

    const filename = `${sanitizeFilename(fileTitle, 'calculation')}.pdf`;
    pdf.save(filename);

    return { error: null };
  } catch (error) {
    return { error: error?.message || 'Failed to create PDF file.' };
  }
}
