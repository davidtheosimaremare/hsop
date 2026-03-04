import type { HdoTemplateData } from "./types";
import { getBaseStyles, formatAddress } from "./styles";

export function renderHdoTemplate(data: HdoTemplateData): string {
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
        <td class="center"><strong>${item.qty}</strong></td>
        <td class="center">${item.unit}</td>
        <td>${item.notes || "-"}</td>
      </tr>
    `
    )
    .join("");

  const shippingAddr = formatAddress(data.shippingAddress);

  const trackingBlock = data.trackingNumber
    ? `<div class="meta-row">
        <span class="meta-key">No. Resi</span>
        <span class="meta-val highlight" style="font-family:monospace">${data.trackingNumber}</span>
      </div>
      ${data.courier ? `<div class="meta-row"><span class="meta-key">Ekspedisi</span><span class="meta-val">${data.courier}</span></div>` : ""}`
    : "";

  const notesSection = data.shippingNotes
    ? `<div class="notes-section"><div class="notes-title">Instruksi Pengiriman</div><p>${data.shippingNotes}</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Surat Jalan ${data.documentNo}</title>
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
      </div>
    </div>
    <div class="doc-title-block">
      <div class="doc-type-label">SURAT JALAN</div>
      <div class="doc-number">${data.documentNo}</div>
    </div>
  </div>

  <!-- META GRID -->
  <div class="meta-grid">
    <div class="meta-block">
      <div class="meta-block-label">Dikirimkan Kepada</div>
      <div class="meta-row"><span class="meta-key">Nama</span><span class="meta-val">${data.customerName}</span></div>
      ${data.shippingAddress.recipient ? `<div class="meta-row"><span class="meta-key">Penerima</span><span class="meta-val">${data.shippingAddress.recipient}</span></div>` : ""}
      <div class="meta-row"><span class="meta-key">Alamat</span><span class="meta-val">${shippingAddr}</span></div>
      ${data.shippingAddress.phone ? `<div class="meta-row"><span class="meta-key">Telepon</span><span class="meta-val">${data.shippingAddress.phone}</span></div>` : ""}
    </div>
    <div class="meta-block">
      <div class="meta-block-label">Detail Pengiriman</div>
      <div class="meta-row"><span class="meta-key">Tgl. Kirim</span><span class="meta-val">${data.date}</span></div>
      <div class="meta-row"><span class="meta-key">Ref. Pesanan</span><span class="meta-val">${data.hsoRef}</span></div>
      ${trackingBlock}
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="center" style="width:30px">No</th>
        <th>Nama Barang</th>
        <th class="center" style="width:50px">Qty</th>
        <th class="center" style="width:45px">Sat.</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  ${notesSection}

  <!-- CHECKLIST BOX -->
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;margin-bottom:14px;font-size:8pt;">
    <div style="font-weight:700;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.5px;color:#166534;margin-bottom:6px;">Konfirmasi Penerimaan Barang</div>
    <p style="color:#15803d;">Saya yang bertanda tangan di bawah ini menyatakan telah menerima barang-barang di atas dalam kondisi baik dan lengkap.</p>
  </div>

  <!-- SIGNATURES -->
  <div class="signature-grid">
    <div class="signature-box">
      <div class="signature-title">Pengirim</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.preparedBy || "Admin Gudang"}</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Kurir / Driver</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.courier || "_______________"}</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Penerima</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.shippingAddress.recipient || data.customerName}</div>
    </div>
  </div>

  <div class="doc-footer">
    <span>${data.company.name} &mdash; Dokumen ini dibuat secara otomatis oleh sistem</span>
    <span>HDO &bull; ${data.documentNo}</span>
  </div>

</div>
</body>
</html>`;
}
