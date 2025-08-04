export const transformKotToContent = (kot) => {
  const content = [];
  
  content.push({
    type: 'text',
    value: 'KITCHEN ORDER TICKET',
    style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }
  });
  
  content.push({
    type: 'text',
    value: kot.kitchen_station,
    style: { fontWeight: 'bold', textAlign: 'center' }
  });
  
  content.push({ type: 'divider' });
  
  content.push({
    type: 'text',
    value: `KOT #${kot.kot_number} | Order #${kot.order_number}`
  });
  
  content.push({
    type: 'text',
    value: `Table: ${kot.table}`
  });
  
  content.push({
    type: 'text',
    value: `Time: ${kot.created_at}`
  });
  
  content.push({ type: 'divider' });
  
  // Items list
  content.push({
    type: 'table',
    tableHeader: ['Qty', 'Item'],
    tableHeaderStyle: { fontWeight: 'bold' },
    tableBody: kot.items.map(item => [
      item.qty.toString(),
      item.item
    ])
  });
  
  content.push({ type: 'divider' });
  
  content.push({
    type: 'text',
    value: kot.note || '--- KOT END ---',
    style: { textAlign: 'center' }
  });
  
  return content;
};