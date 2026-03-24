import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * DOM → A4 PDF (single page, scaled to fit — stable with Vite + React).
 */
export async function downloadElementAsPdf(element, filename) {
  if (!element) {
    throw new Error("Receipt element missing");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  let imgW = maxW;
  let imgH = (canvas.height * imgW) / canvas.width;
  if (imgH > maxH) {
    imgH = maxH;
    imgW = (canvas.width * imgH) / canvas.height;
  }

  const x = (pageW - imgW) / 2;
  const y = margin + (maxH - imgH) / 2;
  pdf.addImage(imgData, "JPEG", x, y, imgW, imgH, undefined, "FAST");
  pdf.save(filename);
}
