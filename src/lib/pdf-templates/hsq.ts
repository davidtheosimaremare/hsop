import type { HsqTemplateData } from "./types";
import { getBaseStyles, formatRupiah, formatAddress } from "./styles";

export function renderHsqTemplate(data: HsqTemplateData): string {
  const paymentBadge =
    data.paymentMethod === "TOP"
      ? `<span class="badge badge-top">Term of Payment${data.topDays ? ` — NET ${data.topDays}` : ""}</span>`
      : data.paymentMethod === "TRANSFER"
        ? `<span class="badge badge-transfer">Transfer Bank</span>`
        : `<span class="badge badge-cash">Cash / Payment Gateway</span>`;

  const docTitle = data.revisionLabel
    ? `PENAWARAN <small style="font-size:11pt">(${data.revisionLabel})</small>`
    : "PENAWARAN";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="center">${item.no}</td>
        <td>
          <div class="item-name">${item.name}</div>
          <div class="item-sku">${item.sku}</div>
          ${item.brand ? `<div class="item-brand">${item.brand}</div>` : ""}
          ${item.notes ? `<div class="item-note">* ${item.notes}</div>` : ""}
        </td>
        <td class="center">${item.qty}</td>
        <td class="center">${item.unit}</td>
        <td class="right">${formatRupiah(item.unitPrice)}</td>
        ${item.discount ? `<td class="center">${item.discount}%</td>` : `<td class="center muted">-</td>`}
        <td class="right"><strong>${formatRupiah(item.subtotal)}</strong></td>
      </tr>
    `
    )
    .join("");

  const discountRow =
    data.discountTotal && data.discountTotal > 0
      ? `<div class="totals-row">
          <span class="tlabel">Diskon</span>
          <span class="tval" style="color:#16a34a">- ${formatRupiah(data.discountTotal)}</span>
        </div>`
      : "";

  const shippingRow =
    data.shipping && data.shipping > 0
      ? `<div class="totals-row">
          <span class="tlabel">Ongkos Kirim</span>
          <span class="tval">${formatRupiah(data.shipping)}</span>
        </div>`
      : "";

  const notesSection = data.notes
    ? `<div class="notes-section">
        <div class="notes-title">Catatan</div>
        <p>${data.notes}</p>
      </div>`
    : "";

  const customerAddr = data.customerAddress ? formatAddress(data.customerAddress) : "-";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Penawaran ${data.documentNo}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="doc-header">
    <div>
      ${data.company.logoUrl ? `<img src="${data.company.logoUrl}" alt="Logo" class="company-logo" />` : `<div class="company-name">${data.company.name}</div>`}
      <div class="company-sub">
        ${data.company.address}<br/>
        Telp: ${data.company.phone} &nbsp;|&nbsp; ${data.company.email}
        ${data.company.npwp ? `<br/>NPWP: ${data.company.npwp}` : ""}
      </div>
    </div>
    <div class="doc-title-block">
      <div class="doc-type-label">${docTitle}</div>
      <div class="doc-number">${data.documentNo}</div>
      ${data.revisionLabel ? `<div class="doc-revision">REVISI ${data.revisionLabel}</div>` : ""}
    </div>
  </div>

  <!-- META GRID -->
  <div class="meta-grid">
    <div class="meta-block">
      <div class="meta-block-label">Kepada Yth.</div>
      <div class="meta-row"><span class="meta-key">Nama</span><span class="meta-val">${data.customerName}</span></div>
      <div class="meta-row"><span class="meta-key">Alamat</span><span class="meta-val">${customerAddr}</span></div>
      ${data.customerPhone ? `<div class="meta-row"><span class="meta-key">Telepon</span><span class="meta-val">${data.customerPhone}</span></div>` : ""}
      ${data.customerEmail ? `<div class="meta-row"><span class="meta-key">Email</span><span class="meta-val">${data.customerEmail}</span></div>` : ""}
    </div>
    <div class="meta-block">
      <div class="meta-block-label">Detail Dokumen</div>
      <div class="meta-row"><span class="meta-key">Tanggal</span><span class="meta-val">${data.date}</span></div>
      ${data.validUntil ? `<div class="meta-row"><span class="meta-key">Berlaku s/d</span><span class="meta-val highlight">${data.validUntil}</span></div>` : ""}
      <div class="meta-row"><span class="meta-key">Pembayaran</span><span class="meta-val">${paymentBadge}</span></div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="center" style="width:30px">No</th>
        <th>Deskripsi Barang</th>
        <th class="center" style="width:40px">Qty</th>
        <th class="center" style="width:40px">Sat.</th>
        <th class="right" style="width:90px">Harga Satuan</th>
        <th class="center" style="width:45px">Disc</th>
        <th class="right" style="width:90px">Jumlah</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-block">
    <div class="totals-inner">
      <div class="totals-row">
        <span class="tlabel">Subtotal</span>
        <span class="tval">${formatRupiah(data.subtotal)}</span>
      </div>
      ${discountRow}
      ${shippingRow}
      <div class="totals-row grand">
        <span class="tlabel">TOTAL</span>
        <span class="tval">${formatRupiah(data.grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- NOTES -->
  ${notesSection}

  <!-- SIGNATURES -->
  <div class="signature-grid">
    <div class="signature-box">
      <div class="signature-title">Disiapkan oleh</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.preparedBy || "Admin"}</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Disetujui oleh</div>
      <div class="signature-line"></div>
      <div class="signature-name">_______________</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Penerima</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.customerName}</div>
    </div>
  </div>

  <!-- PAGE FOOTER -->
  <div class="doc-footer">
    <span>${data.company.name} &mdash; Dokumen ini dibuat secara otomatis oleh sistem</span>
    <span>SQ &bull; ${data.documentNo}</span>
  </div>

</div>
</body>
</html>`;
}
