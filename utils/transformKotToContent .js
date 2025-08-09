const KOT_CSS = `
<style>
   * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        padding: 8px;
        margin: 0;
        font-size: 13px;
        background-color: white;
        width: 80mm;
        max-width: 300px;
        color: #000;
      }

      .kot-wrapper {
        width: 100%;
        margin: 0 auto;
        padding: 12px;
        background: white;
        border: 1px solid #000;
        border-radius: 4px;
      }

      .kot-header {
        text-align: center;
        margin-bottom: 15px;
        padding-bottom: 12px;
        border-bottom: 1px solid #000;
      }

      .kot-title {
        font-size: 16px;
        font-weight: bold;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .kot-subtitle {
        font-size: 11px;
        color: #555;
        margin-top: 4px;
      }

      .kot-number {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        margin: 16px 0;
      }

      .order-highlight {
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        margin: 10px 0;
        border: 1px dashed #000;
        padding: 6px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
      }

      th {
        background-color: #f5f5f5;
        color: #000;
        padding: 8px 6px;
        text-align: left;
        font-weight: 600;
        font-size: 12px;
        border-bottom: 1px solid #ccc;
      }

      td {
        padding: 8px 6px;
        border-bottom: 1px solid #ddd;
        font-size: 12px;
        vertical-align: top;
        color: #000;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }

      table td:first-child {
        text-align: center;
        font-weight: bold;
      }

      table td:nth-child(2) {
        font-weight: 600;
      }

      .kot-footer {
        text-align: center;
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px dashed #000;
        font-size: 11px;
        color: #333;
        font-weight: 500;
      }

      /* Dynamic class-based styles */
      .date-info {
        font-size: 12px;
        color: #444;
        margin: 4px 0;
      }

      .table-info {
        font-size: 12px;
        color: #222;
        margin: 4px 0;
        font-weight: 500;
      }

      .footer-info {
        font-size: 12px;
        text-align: center;
        color: #333;
        margin-top: 12px;
      }

      .arabic {
        direction: rtl;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      @media print {
        body {
          padding: 0;
          margin: 0;
          background: white;
        }

        .kot-wrapper {
          border: none;
          border-radius: 0;
          padding: 8px;
        }

        .kot-title {
          font-size: 14px;
        }
      }
</style>
`;

export const transformKotToContent = (kot) => {
  // Start with CSS and opening wrapper
  let html =
    KOT_CSS +
    `
    <div class="kot-wrapper">
      <div class="kot-header">
        <div class="kot-title">Kitchen Order</div>
        <div class="kot-subtitle">Prepare Items Below</div>
      </div>
  `;

  // KOT Number
  if (kot.kot_number) {
    html += `<div class="kot-number">${kot.kot_number}</div>`;
  }

  // Order Info
  if (kot.order_number) {
    html += `<div class="order-highlight">Order No: ${kot.order_number}</div>`;
  }

  // Table and other info
  if (kot.table) html += `<div class="table-info">Table: ${kot.table}</div>`;
  if (kot.created_at) html += `<div class="date-info">${kot.created_at}</div>`;
  if (kot.kitchen_station)
    html += `<div class="table-info">Station: ${kot.kitchen_station}</div>`;

  // Items Table
  if (kot.items?.length) {
    html += `
      <table>
        <thead>
          <tr><th>Qty</th><th>Item</th></tr>
        </thead>
        <tbody>
    `;

    kot.items.forEach((item) => {
      html += `
        <tr>
          <td>${item.qty}</td>
          <td>${item.item}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
  }

  // Footer
  if (kot.note) {
    html += `<div class="kot-footer">${kot.note}</div>`;
  }

  // Close wrapper
  html += `</div>`;

  return {
    type: "html",
    value: html,
  };
};
