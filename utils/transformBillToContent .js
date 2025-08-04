export const transformBillToContent = (bill) => {
  const content = [];
  
  // Header section
  content.push({
    type: 'text',
    value: bill.restaurant_name,
    style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }
  });
  
  content.push({
    type: 'text',
    value: bill.restaurant_address,
    style: { textAlign: 'center' }
  });
  
  content.push({
    type: 'text',
    value: `Contact: ${bill.contact_number} | Email: ${bill.email}`,
    style: { textAlign: 'center', fontSize: '10px' }
  });
  
  // Order info
  content.push({ type: 'divider' });
  content.push({
    type: 'text',
    value: `Order #${bill.order_number} | ${bill.created_at}`
  });
  
  if (bill.table && bill.table !== '[DEFAULT]') {
    content.push({
      type: 'text',
      value: `Table: ${bill.table}`
    });
  }
  
  // Items table
  content.push({ type: 'divider' });
  content.push({
    type: 'table',
    tableHeader: ['Qty', 'Item', 'Price', 'Total'],
    tableHeaderStyle: { fontWeight: 'bold' },
    tableBody: bill.items.map(item => [
      item.qty.toString(), 
      item.item, 
      item.price.toFixed(2),
      item.total.toFixed(2)
    ])
  });
  
  // Total section
  content.push({ type: 'divider' });
  
  const totalRows = [
    ['Subtotal', '', '', bill.total_price.toFixed(2)]
  ];
  
  if (bill.delivery_fee) {
    totalRows.unshift(['Delivery Fee', '', '', bill.delivery_fee.toFixed(2)]);
  }
  
  totalRows.push(['Total', '', '', bill.total_price.toFixed(2)]);
  
  content.push({
    type: 'table',
    tableBody: totalRows,
    tableBodyStyle: { fontWeight: 'bold' }
  });
  
  // Footer message
  if (bill.message) {
    content.push({ type: 'divider' });
    content.push({
      type: 'text',
      value: bill.message,
      style: { textAlign: 'center', fontStyle: 'italic' }
    });
  }
  
  return content;
};
