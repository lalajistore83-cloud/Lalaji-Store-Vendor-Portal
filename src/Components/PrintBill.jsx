export const printBill = (bill) => {
  const printWindow = window.open('', '_blank');

  const billHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Receipt #${bill.billNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        color: #111;
        line-height: 1.3;
        max-width: 80mm;
        width: 80mm;
        margin: 0 auto;
        padding: 4mm;
        background: #fff;
      }
      
      html {
        width: 80mm;
        max-width: 80mm;
      }

      @media print {
        @page { 
          size: 80mm auto; 
          margin: 0; 
        }
        body { 
          margin: 0; 
          padding: 4mm;
          width: 80mm;
          max-width: 80mm;
        }
        .no-print { display: none; }
        .receipt-container {
          border: none;
          padding: 0;
        }
        .print-button { display: none; }
      }

      .receipt-container {
        padding: 3mm;
        border: 1px solid #ccc;
        max-width: 80mm;
        width: 80mm;
      }

      /* Header */
      .receipt-header {
        text-align: center;
        border-bottom: 1px solid #000;
        padding-bottom: 8px;
        margin-bottom: 10px;
      }

      .store-logo {
        font-size: 18px;
        font-weight: 700;
        color: #000;
        border: 2px solid #000;
        border-radius: 8px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 8px;
      }

      .store-name {
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .store-info {
        font-size: 8.5px;
        color: #555;
        margin-top: 4px;
      }

      /* Meta Info */
      .receipt-meta {
        text-align: center;
        margin: 10px 0;
        padding: 6px;
        background: #f6f6f6;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }

      .receipt-number {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        font-size: 11px;
      }

      .receipt-date {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8.5px;
        color: #666;
      }

      /* Customer */
      .customer-section {
        margin: 10px 0;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 8px;
      }

      .section-title {
        font-size: 9px;
        font-weight: 700;
        margin-bottom: 4px;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
      }

      .customer-info div {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        margin: 3px 0;
      }

      .customer-info .label {
        color: #555;
        font-weight: 500;
      }

      .customer-info .value {
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Items */
      .items-section {
        margin: 12px 0;
      }

      .items-header {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .item-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px dashed #ddd;
        padding: 4px 0;
      }

      .item-name {
        font-size: 9.5px;
        font-weight: 500;
        flex: 1;
      }

      .item-details {
        font-size: 8px;
        color: #666;
      }

      .item-total {
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9.5px;
      }

      /* Totals */
      .totals-section {
        border-top: 1px solid #000;
        margin-top: 10px;
        padding-top: 6px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        margin: 3px 0;
        font-family: 'JetBrains Mono', monospace;
      }

      .total-row .label {
        color: #555;
      }

      .grand-total {
        font-weight: 700;
        font-size: 12px;
        border-top: 1px solid #000;
        margin-top: 6px;
        padding-top: 4px;
      }

      /* Payment */
      .payment-section {
        margin-top: 10px;
        border-top: 1px solid #ccc;
        padding-top: 6px;
      }

      .payment-row {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        margin: 3px 0;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Footer */
      .footer-section {
        text-align: center;
        margin-top: 12px;
        border-top: 1px solid #000;
        padding-top: 8px;
      }

      .thank-you {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .footer-note {
        font-size: 8px;
        color: #666;
        margin-top: 4px;
      }

      .print-button {
        position: fixed;
        top: 15px;
        right: 15px;
        padding: 10px 18px;
        border: none;
        background: #111;
        color: white;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }

      @media screen {
        body { 
          background: #f3f4f6; 
          padding: 20px;
          width: auto;
          max-width: 80mm;
        }
        html {
          width: auto;
        }
      }
    </style>
  </head>
  <body>
    <script>
      // Force proper page size on load
      window.onload = function() {
        // Set the page to thermal receipt size
        const style = document.createElement('style');
        style.textContent = '@page { size: 80mm auto; margin: 0; }';
        document.head.appendChild(style);
      };
      
      // Override print to ensure correct settings
      const originalPrint = window.print;
      window.print = function() {
        // Small delay to ensure styles are applied
        setTimeout(() => originalPrint.call(window), 100);
      };
    </script>
    <button class="print-button no-print" onclick="window.print()">Print Receipt</button>

    <div class="receipt-container">
      <div class="receipt-header">
        <div class="store-logo">L</div>
        <div class="store-name">Lalaji Store</div>
        <div class="store-info">
          Street Address, City<br>
          Phone: +91-XXXXXXXXXX<br>
          Email: info@lalajistore.com
        </div>
      </div>

      <div class="receipt-meta">
        <div class="receipt-number">Receipt #${bill.billNumber}</div>
        <div class="receipt-date">${new Date(bill.createdAt).toLocaleString('en-IN')}</div>
      </div>

      <div class="customer-section">
        <div class="section-title">Customer Details</div>
        <div class="customer-info">
          <div><span class="label">Name</span><span class="value">${bill.customer.name}</span></div>
          ${bill.customer.phone ? `<div><span class="label">Phone</span><span class="value">${bill.customer.phone}</span></div>` : ''}
          ${bill.customer.email ? `<div><span class="label">Email</span><span class="value">${bill.customer.email}</span></div>` : ''}
        </div>
      </div>

      <div class="items-section">
        <div class="items-header"><span>Item</span><span>Amount</span></div>
        ${bill.items.map((item, i) => `
          <div class="item-row">
            <div>
              <div class="item-name">${i + 1}. ${item.productName}</div>
              <div class="item-details">${item.quantity} × ₹${item.price.toFixed(2)}</div>
            </div>
            <div class="item-total">₹${item.total.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <div class="totals-section">
        <div class="total-row"><span class="label">Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
        ${bill.discount && bill.discount.amount > 0 ? `
          <div class="total-row"><span class="label">Discount</span><span>-₹${bill.discount.amount.toFixed(2)}</span></div>` : ''}
        <div class="total-row grand-total"><span>Total Payable</span><span>₹${bill.total.toFixed(2)}</span></div>
      </div>

      <div class="payment-section">
        ${bill.paymentMethod === 'split' && bill.splitPayments ? bill.splitPayments.map(p => `
          <div class="payment-row"><span>${p.method.toUpperCase()}</span><span>₹${p.amount.toFixed(2)}</span></div>
        `).join('') : `
          <div class="payment-row"><span>Paid via ${bill.paymentMethod.toUpperCase()}</span><span>₹${bill.total.toFixed(2)}</span></div>
        `}
      </div>

      <div class="footer-section">
        <div class="thank-you">Thank You!</div>
        <div class="footer-note">Please retain this receipt for reference</div>
        <div class="footer-note">All sales are final. No returns without receipt.</div>
      </div>
    </div>
  </body>
  </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();
};
