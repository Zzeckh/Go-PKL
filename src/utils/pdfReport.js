import PDFDocument from 'pdfkit';

const MARGIN = 40;
const PAGE_WIDTH = 595.28;   // A4 pt
const PAGE_HEIGHT = 841.89;  // A4 pt
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - 60; // ruang disisakan buat footer

/* ── Format helpers ── */
export const safeFilename = (str) =>
  (str || 'laporan')
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

export const formatDateID = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatTimeID = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_LABELS = {
  hadir: 'Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  alpha: 'Alpha',
  pending: 'Menunggu Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};
export const labelStatus = (s) => STATUS_LABELS[s] || s || '-';

/**
 * Render + stream sebuah laporan PDF tabel ke response.
 * columns: [{ key, label, width, align? }]
 * rows: [{ [key]: value }]
 */
export function streamPdfReport(res, filename, { title, subtitle, metaLines = [], columns, rows, emptyMessage }) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let y = MARGIN;

  /* ── Header dokumen ── */
  doc.fillColor('#152A42').font('Helvetica-Bold').fontSize(16).text('GO PKL', MARGIN, y);
  y = doc.y;
  doc.fillColor('#5B7A94').font('Helvetica').fontSize(8)
    .text('SISTEM MONITORING PRAKTIK KERJA LAPANGAN', MARGIN, y, { characterSpacing: 0.4 });
  y = doc.y + 10;

  doc.fillColor('#152A42').font('Helvetica-Bold').fontSize(13).text(title, MARGIN, y);
  y = doc.y;

  if (subtitle) {
    doc.fillColor('#5B7A94').font('Helvetica').fontSize(9).text(subtitle, MARGIN, y + 2);
    y = doc.y;
  }

  y += 8;
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).lineWidth(1).strokeColor('#DADEE8').stroke();
  y += 10;

  metaLines.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fillColor('#152A42').fontSize(8.5).text(`${label}: `, MARGIN, y, { continued: true });
    doc.font('Helvetica').fillColor('#152A42').fontSize(8.5).text(String(value));
    y = doc.y + 2;
  });
  y += 8;

  /* ── Tabel ── */
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

  const drawTableHeaderRow = () => {
    doc.rect(MARGIN, y, tableWidth, 22).fill('#152A42');
    let x = MARGIN;
    columns.forEach((col) => {
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
        .text(col.label, x + 4, y + 7, { width: col.width - 8, align: col.align || 'left' });
      x += col.width;
    });
    y += 22;
  };

  drawTableHeaderRow();

  if (!rows.length) {
    doc.fillColor('#8A96A8').font('Helvetica-Oblique').fontSize(9)
      .text(emptyMessage || 'Tidak ada data.', MARGIN, y + 12, { width: tableWidth, align: 'center' });
  } else {
    rows.forEach((row, idx) => {
      const cellHeights = columns.map((col) => {
        const text = row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== ''
          ? String(row[col.key])
          : '-';
        doc.font('Helvetica').fontSize(8);
        return doc.heightOfString(text, { width: col.width - 8 });
      });
      const rowHeight = Math.max(...cellHeights, 14) + 8;

      // Pindah halaman jika baris ini tidak muat, header tabel diulang
      if (y + rowHeight > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN;
        drawTableHeaderRow();
      }

      if (idx % 2 === 1) {
        doc.rect(MARGIN, y, tableWidth, rowHeight).fill('#F1F4F8');
      }

      let x = MARGIN;
      columns.forEach((col) => {
        const text = row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== ''
          ? String(row[col.key])
          : '-';
        doc.fillColor('#152A42').font('Helvetica').fontSize(8)
          .text(text, x + 4, y + 4, { width: col.width - 8, align: col.align || 'left' });
        x += col.width;
      });

      doc.moveTo(MARGIN, y + rowHeight).lineTo(MARGIN + tableWidth, y + rowHeight)
        .strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      y += rowHeight;
    });
  }

  /* ── Footer + nomor halaman di setiap halaman ── */
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7.5).fillColor('#8A96A8').font('Helvetica')
      .text('Dokumen ini dihasilkan oleh sistem GO PKL.', MARGIN, PAGE_HEIGHT - 35, {
        width: CONTENT_WIDTH - 120,
      });
    doc.fontSize(7.5).fillColor('#8A96A8').font('Helvetica')
      .text(`Halaman ${i - range.start + 1} dari ${range.count}`, MARGIN, PAGE_HEIGHT - 35, {
        width: CONTENT_WIDTH,
        align: 'right',
      });
  }

  doc.end();
}
