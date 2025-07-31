export const convertJsonToHtml = (content) => {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        width: 58mm;
        font-family: Arial, sans-serif;
        padding: 0;
        margin: 0;
        font-size: 12px;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        background-color: #000;
        color: #fff;
        padding: 3px;
        text-align: left;
      }
      td {
        padding: 3px;
        border-bottom: 1px dashed #ddd;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 5px 0;
      }
      .bold { font-weight: bold; }
    </style>
  </head>
  <body>
  `;

  content.forEach(item => {
    const style = cssObjectToString(item.style || {});
    
    switch(item.type) {
      case 'text':
        html += `<div style="${style}">${item.value}</div>`;
        break;
        
      case 'table':
        html += `<table style="${style}">`;
        
        // Table header
        if (item.tableHeader) {
          html += `<thead><tr>`;
          item.tableHeader.forEach(header => {
            const headerStyle = cssObjectToString(item.tableHeaderStyle || {});
            html += `<th style="${headerStyle}">${header}</th>`;
          });
          html += `</tr></thead>`;
        }
        
        // Table body
        html += `<tbody>`;
        item.tableBody.forEach(row => {
          html += `<tr>`;
          row.forEach((cell, i) => {
            const cellStyle = cssObjectToString(item.tableBodyStyle || {});
            // Right-align numeric columns, left-align text columns
            const alignment = i === 0 || i >= 2 ? 'text-align: right;' : '';
            html += `<td style="${alignment} ${cellStyle}">${cell}</td>`;
          });
          html += `</tr>`;
        });
        html += `</tbody></table>`;
        break;
        
      case 'divider':
        html += `<hr class="divider" style="${style}">`;
        break;
    }
  });

  html += `</body></html>`;
  return html;
};

const cssObjectToString = (styleObj) => {
  return Object.entries(styleObj)
    .map(([key, value]) => {
      // Convert fontSize to font-size
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join(' ');
};