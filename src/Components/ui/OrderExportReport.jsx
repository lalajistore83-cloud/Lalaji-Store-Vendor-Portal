import { useState, useRef, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const ExportReport = ({ 
  filteredOrders, 
  orderStats, 
  filterDate, 
  customDateRange,
  formatDate,
  onSuccess,
  onError 
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Export Report Handler
  const handleExport = async (format) => {
    setShowExportDropdown(false);
    setExporting(true);
    
    try {
      // Get current filter info for filename
      const filterInfo = filterDate === 'today' ? 'today' : 
                         filterDate === 'yesterday' ? 'yesterday' :
                         filterDate === 'week' ? 'last7days' :
                         filterDate === 'month' ? 'last30days' :
                         filterDate === 'custom' ? `${customDateRange.startDate}_to_${customDateRange.endDate}` : 'all';
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `orders_report_${filterInfo}_${timestamp}`;

      if (format === 'csv') {
        exportToCSV(filename);
      } else if (format === 'excel') {
        exportToExcel(filename);
      } else if (format === 'pdf') {
        exportToPDF(filename);
      }

      onSuccess?.(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Error exporting report:', err);
      onError?.(`Failed to export report: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Helper function to escape CSV values
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // If value contains comma, newline, or double quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Format phone number for CSV (preserve as text)
  const formatPhoneForCSV = (phone) => {
    if (!phone || phone === 'N/A') return 'N/A';
    // Add tab character to force Excel to treat as text
    return `\t${phone}`;
  };

  // Export to CSV
  const exportToCSV = (filename) => {
    const headers = [
      'Order ID',
      'Order Number',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Delivery Address',
      'Items Count',
      'Items Details',
      'Total Amount',
      'Order Status',
      'Payment Status',
      'Payment Method',
      'Delivery Partner',
      'Delivery Person',
      'Delivery Phone'
    ];

    const rows = filteredOrders.map(order => {
      const customerPhone = order.customer.phone || 'N/A';
      const deliveryPhone = order.delivery?.deliveryBoyPhone || 'N/A';
      const deliveryPartner = order.delivery?.partner === 'lalaji_network' ? 'Lalaji Network' : 
        order.delivery?.partner === 'vendor_self' ? 'Self Delivery' : 'Not Assigned';
      const itemsDetails = order.items.map(item => `${item.name} x${item.quantity}`).join('; ');
      
      // Format date consistently for CSV
      const orderDateFormatted = order.orderDate ? 
        new Date(order.orderDate).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : 'N/A';
      
      return [
        escapeCSVValue(order.id),
        escapeCSVValue(order.orderNumber || order.id),
        `"${orderDateFormatted}"`,
        escapeCSVValue(order.customer.name || ''),
        formatPhoneForCSV(customerPhone),
        escapeCSVValue(order.customer.email || 'N/A'),
        escapeCSVValue(order.address || ''),
        order.items.length,
        escapeCSVValue(itemsDetails),
        order.totalAmount,
        escapeCSVValue(order.status),
        escapeCSVValue(order.paymentStatus),
        escapeCSVValue(order.rawOrder?.payment?.method || 'COD'),
        escapeCSVValue(deliveryPartner),
        escapeCSVValue(order.delivery?.deliveryBoyName || 'Not Assigned'),
        formatPhoneForCSV(deliveryPhone)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    downloadFile(BOM + csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
  };

  // Export to Excel (using HTML table format that Excel can read)
  const exportToExcel = (filename) => {
    const tableHead = `
      <tr style="background-color: #4F46E5; color: white; font-weight: bold;">
        <th>Order ID</th>
        <th>Order Number</th>
        <th>Order Date</th>
        <th>Customer Name</th>
        <th>Customer Phone</th>
        <th>Customer Email</th>
        <th>Delivery Address</th>
        <th>Items Count</th>
        <th>Items Details</th>
        <th>Total Amount (&#8377;)</th>
        <th>Order Status</th>
        <th>Payment Status</th>
        <th>Payment Method</th>
        <th>Delivery Partner</th>
        <th>Delivery Person</th>
        <th>Delivery Phone</th>
      </tr>
    `;

    const tableRows = filteredOrders.map((order, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#F9FAFB' : 'white'};">
        <td>${order.id}</td>
        <td>${order.orderNumber || order.id}</td>
        <td>${formatDate(order.orderDate)}</td>
        <td>${order.customer.name}</td>
        <td style="mso-number-format:'\@';">${order.customer.phone || 'N/A'}</td>
        <td>${order.customer.email || 'N/A'}</td>
        <td>${order.address}</td>
        <td>${order.items.length}</td>
        <td>${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}</td>
        <td style="text-align: right;">&#8377;${order.totalAmount.toLocaleString()}</td>
        <td>${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</td>
        <td>${order.paymentStatus}</td>
        <td>${order.rawOrder?.payment?.method?.toUpperCase() || 'COD'}</td>
        <td>${order.delivery?.partner === 'lalaji_network' ? 'Lalaji Network' : 
              order.delivery?.partner === 'vendor_self' ? 'Self Delivery' : 'Not Assigned'}</td>
        <td>${order.delivery?.deliveryBoyName || 'Not Assigned'}</td>
        <td style="mso-number-format:'\@';">${order.delivery?.deliveryBoyPhone || 'N/A'}</td>
      </tr>
    `).join('');

    // Add summary row
    const summaryRow = `
      <tr style="background-color: #E5E7EB; font-weight: bold;">
        <td colspan="9">Total Orders: ${filteredOrders.length}</td>
        <td style="text-align: right;">&#8377;${orderStats.totalRevenue.toLocaleString()}</td>
        <td colspan="6">Pending: ${orderStats.pending} | Delivered: ${orderStats.delivered}</td>
      </tr>
    `;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Orders Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; }
          th { background-color: #4F46E5; color: white; }
        </style>
      </head>
      <body>
        <h2>Orders Report - ${filterDate === 'today' ? "Today's Orders" : filterDate === 'all' ? 'All Orders' : `${filterDate} orders`}</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>${tableHead}</thead>
          <tbody>${tableRows}${summaryRow}</tbody>
        </table>
      </body>
      </html>
    `;

    downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8');
  };

  // Export to PDF (using browser print functionality with styled HTML)
  const exportToPDF = (filename) => {
    const printWindow = window.open('', '_blank');
    
    const tableRows = filteredOrders.map((order, index) => `
      <tr style="background:${index % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td>${order.orderNumber || order.id}</td>
        <td>${formatDate(order.orderDate)}</td>
        <td>${order.customer.name}<br/><small>${order.customer.phone}</small></td>
        <td>${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}</td>
        <td style="text-align:right">₹${order.totalAmount.toLocaleString()}</td>
        <td>${order.status}</td>
        <td>${order.paymentStatus}</td>
        <td>${order.delivery?.deliveryBoyName || 'Not Assigned'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orders Report - ${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { margin-bottom: 5px; }
          p { color: #666; font-size: 12px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #4F46E5; color: white; }
        </style>
      </head>
      <body>
        <h2>Orders Report</h2>
        <p>Generated: ${new Date().toLocaleString()} | Total: ${filteredOrders.length} orders | Revenue: ₹${orderStats.totalRevenue.toLocaleString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Delivery</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  // Helper function to download file
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative" ref={exportDropdownRef}>
      <button 
        onClick={() => setShowExportDropdown(!showExportDropdown)}
        disabled={exporting || filteredOrders.length === 0}
        className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <DocumentArrowDownIcon className="h-3.5 w-3.5 mr-1.5" />
            Export Report
            <ChevronDownIcon className={`h-3 w-3 ml-1 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      
      {showExportDropdown && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-2 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Export as Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export as PDF
            </button>
          </div>
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-xs text-gray-500">
              {filteredOrders.length} orders will be exported
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportReport;
