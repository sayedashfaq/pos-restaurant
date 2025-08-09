const BILL_CSS = `
 <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            background: #f0f0f0;
            padding: 20px;
            line-height: 1.2;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        .receipt {
            width: 300px;
            background: #fff;
            border: 2px solid #000;
            margin: 0 auto;
            padding-right: 4px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }

        .receipt-content {
            padding-top: 10px;
            padding-bottom: 5px;
            padding-right: 40px;
            padding-left: 5px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }

        .restaurant-name {
             font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .restaurant-name-ar {
            font-size: 20px;
            margin-bottom: 8px;
            direction: rtl;
        }

        .contact-info {
            font-size: 14px;
            margin-bottom: 3px;
        }

        .divider {
            text-align: center;
            margin: 10px 0;
            font-weight: bold;
        }

        .bill-info {
            margin-bottom: 15px;
            font-size: 13px;
        }

        .info-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            align-items: center;
        }

        .info-label {
            font-weight: bold;
        }

        .item-list {
            margin-bottom: 15px;
        }

        .item {
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #000;
        }

        .item:last-child {
            border-bottom: none;
        }

        .item-name {
            font-weight: bold;
            margin-bottom: 2px;
            text-align: left;
        }

        .item-name-ar {
            font-size: 12px;
            direction: rtl;
            text-align: right;
            margin-bottom: 3px;
        }

        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
        }

        .qty-price {
            white-space: nowrap;
        }

        .totals {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-bottom: 15px;
        }

        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 13px;
        }

        .grand-total {
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
            font-weight: bold;
            font-size: 17px;
        }

        .footer {
            text-align: center;
            border-top: 2px solid #000;
            padding-top: 10px;
            font-size: 10px;
        }

        .qr-placeholder {
            width: 60px;
            height: 60px;
            border: 2px solid #000;
            margin: 10px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 10px;
        }

        .extra-small {
            font-size: 11px;
        }

        .small-text {
            font-size: 14px;
        }

        .bold {
            font-weight: bold;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 10px;
        }

        .logo-image {
            width: 120px;
            height: 60px;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTIwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSIyMCIgZmlsbD0iIzAwMDAwMCIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSIxMCIgZmlsbD0iIzAwMDAwMCIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSI1IiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSI4IiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iYm9sZCI+QUwgRkFOQVI8L3RleHQ+Cjx0ZXh0IHg9IjcwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSI4IiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iYm9sZCI+2YXYt9i52YUg2KfZhNmB2YbYp9ixPC90ZXh0Pgo8L3N2Zz4K') no-repeat center;
            background-size: contain;
            margin: 0 auto;
            border: 2px solid #000;
            display: block;
        }

        .logo-fallback {
            font-size: 8px;
            line-height: 1;
            margin-bottom: 5px;
            font-family: monospace;
            letter-spacing: 0;
            text-align: center;
            border: 2px solid #000;
            padding: 8px;
            background: #fff;
        }

        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #000;
            color: #fff;
            border: none;
            padding: 15px 20px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 1000;
        }

        .print-btn:hover {
            background: #333;
        }

        @media print {
            body { 
                background: #fff; 
                padding: 0; 
            }
            .print-btn { 
                display: none; 
            }
            .receipt { 
                box-shadow: none; 
                border: none;
                width: 80mm;
                margin: 0;
            }
           .logo-image {
                width: 160px;
                height: auto;
                display: block;
                margin: 0 auto;
                border: 2px solid #000;
            }

            .logo-fallback {
                display: block !important;
                background: #fff !important;
            }
        }
    </style>
`;
export const transformBillToContent = (bill) => {
  // Start with CSS and opening HTML structure
  let html =
    BILL_CSS +
    `
    <div class="receipt">
      <div class="receipt-content">
        <div class="header">
  `;

  // Add Logo if available
  if (bill.logo_url) {
    html += `
      <div class="logo-container">
        <img src="${bill.logo_url}" class="logo-image" alt="Restaurant Logo" />
      </div>
    `;
  } else {
    // Fallback logo if no image available
    html += `
      <div class="logo-container">
        <div class="logo-fallback">${
          bill.restaurant_name || "RESTAURANT LOGO"
        }</div>
      </div>
    `;
  }

  // Restaurant Information
  if (bill.restaurant_name) {
    html += `<div class="restaurant-name">${bill.restaurant_name}</div>`;
  }
  if (bill.restaurant_name_ar) {
    html += `<div class="restaurant-name-ar">${bill.restaurant_name_ar}</div>`;
  }
  if (bill.restaurant_address) {
    html += `<div class="contact-info">${bill.restaurant_address}</div>`;
  }
  if (bill.contact_number) {
    html += `<div class="contact-info">${bill.contact_number}</div>`;
  }
  if (bill.email) {
    html += `<div class="contact-info">${bill.email}</div>`;
  }

  // Close header and start bill info section
  html += `
        </div>
        <div class="bill-info">
  `;

  // Order Information
  if (bill.order_number) {
    html += `
      <div class="info-line">
        <span class="info-label">ORD#:</span>
        <span>${bill.order_number}</span>
      </div>
    `;
  }
  if (bill.created_at) {
    html += `
      <div class="info-line">
        <span class="info-label">DATE:</span>
        <span>${bill.created_at}</span>
      </div>
    `;
  }
  if (bill.table) {
    html += `
      <div class="info-line">
        <span class="info-label">TABLE:</span>
        <span>${bill.table}</span>
      </div>
    `;
  }
  if (bill.customer_name) {
    html += `
      <div class="info-line">
        <span class="info-label">CUSTOMER:</span>
        <span>${bill.customer_name}</span>
      </div>
    `;
  }
  if (bill.order_type) {
    html += `
      <div class="info-line">
        <span class="info-label">ORDER TYPE:</span>
        <span>${bill.order_type}</span>
      </div>
    `;
  }
  if (bill.platform_name) {
    html += `
      <div class="info-line">
        <span class="info-label">PLATFORM:</span>
        <span>${bill.platform_name}</span>
      </div>
    `;
  }
  if (bill.counter_name) {
    html += `
      <div class="info-line">
        <span class="info-label">COUNTER:</span>
        <span>${bill.counter_name}</span>
      </div>
    `;
  }

  // Items Section
  html += `
        </div>
        <div class="divider">=============================</div>
        <div class="item-list">
  `;

  if (bill.items && bill.items.length) {
    bill.items.forEach((item) => {
      html += `
        <div class="item">
          <div class="item-name">${item.item}</div>
          ${
            item.item_ar
              ? `<div class="item-name-ar">${item.item_ar}</div>`
              : ""
          }
          <div class="item-details">
            <span>${item.qty}x ${item.price}</span>
            <span class="qty-price">${item.total} QAR</span>
          </div>
        </div>
      `;
    });
  }

  // Totals Section
  html += `
        </div>
        <div class="totals">
          <div class="total-line">
            <span>SUBTOTAL:</span>
            <span>${bill.subtotal} QAR</span>
          </div>
  `;

  if (bill.delivery_fee) {
    html += `
      <div class="total-line">
        <span>DELIVERY FEE:</span>
        <span>${bill.delivery_fee} QAR</span>
      </div>
    `;
  }

  html += `
          <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>${bill.total_price} QAR</span>
          </div>
        </div>
        <div class="footer">
          <div class="divider">===============================</div>
          <div class="small-text bold">THANK YOU FOR DINING WITH US!</div>
          <div class="small-text bold">شكراً لزيارتكم</div>
        </div>
      </div>
    </div>
  `;

  return {
    type: "html",
    value: html,
  };
};
