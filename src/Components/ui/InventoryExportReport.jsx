import { useState, useRef, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const InventoryExportReport = ({ 
  inventory, 
  inventoryStats,
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return status;
    }
  };

  // Export Report Handler
  const handleExport = async (format) => {
    setShowExportDropdown(false);
    setExporting(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `inventory_report_${timestamp}`;

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
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Export to CSV
  const exportToCSV = (filename) => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Current Stock',
      'Min Threshold',
      'Max Capacity',
      'Status',
      'Unit Price (₹)',
      'Total Value (₹)',
      'Last Restocked'
    ];

    const rows = inventory.map(item => [
      escapeCSVValue(item.name || ''),
      escapeCSVValue(item.sku || ''),
      escapeCSVValue(item.category || ''),
      item.currentStock || 0,
      item.minThreshold || 0,
      item.maxCapacity || 0,
      escapeCSVValue(getStatusText(item.status)),
      item.unitPrice || 0,
      item.totalValue || 0,
      escapeCSVValue(formatDate(item.lastRestocked))
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const BOM = '\uFEFF';
    downloadFile(BOM + csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
  };

  // Export to Excel (using HTML table format that Excel can read)
  const exportToExcel = (filename) => {
    const tableHead = `
      <tr style="background-color: #4F46E5; color: white; font-weight: bold;">
        <th>Product Name</th>
        <th>SKU</th>
        <th>Category</th>
        <th>Current Stock</th>
        <th>Min Threshold</th>
        <th>Max Capacity</th>
        <th>Status</th>
        <th>Unit Price (&#8377;)</th>
        <th>Total Value (&#8377;)</th>
        <th>Last Restocked</th>
      </tr>
    `;

    const tableRows = inventory.map((item, index) => {
      const statusColor = item.status === 'in_stock' ? '#C6EFCE' : 
                         item.status === 'low_stock' ? '#FFEB9C' : '#FFC7CE';
      return `
        <tr style="background-color: ${index % 2 === 0 ? '#F9FAFB' : 'white'};">
          <td>${item.name || ''}</td>
          <td>${item.sku || ''}</td>
          <td>${item.category || ''}</td>
          <td style="text-align: left;">${item.currentStock || 0}</td>
          <td style="text-align: left;">${item.minThreshold || 0}</td>
          <td style="text-align: left;">${item.maxCapacity || 0}</td>
          <td style=>${getStatusText(item.status)}</td>
          <td style="text-align: left;">&#8377;${(item.unitPrice || 0).toLocaleString()}</td>
          <td style="text-align: left;">&#8377;${(item.totalValue || 0).toLocaleString()}</td>
          <td>${formatDate(item.lastRestocked)}</td>
        </tr>
      `;
    }).join('');

    // Add summary row
    const summaryRow = `
      <tr style="background-color: #E5E7EB; font-weight: bold;">
        <td colspan="7">Total Products: ${inventory.length} | In Stock: ${inventoryStats?.inStock || 0} | Low Stock: ${inventoryStats?.lowStock || 0} | Out of Stock: ${inventoryStats?.outOfStock || 0}</td>
        <td colspan="2" style="text-align: right;">Total Value: &#8377;${(inventoryStats?.totalValue || 0).toLocaleString()}</td>
        <td></td>
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
                <x:Name>Inventory Report</x:Name>
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
        <h2>Inventory Report</h2>
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
    
    const tableRows = inventory.map((item, index) => {
      const statusColor = item.status === 'in_stock' ? '#C6EFCE' : 
                         item.status === 'low_stock' ? '#FFEB9C' : '#FFC7CE';
      return `
        <tr style="background:${index % 2 === 0 ? '#f9f9f9' : '#fff'}">
          <td>${item.name || ''}</td>
          <td>${item.sku || ''}</td>
          <td>${item.category || ''}</td>
          <td style="text-align:left">${item.currentStock || 0}</td>
          <td style=>${getStatusText(item.status)}</td>
          <td style="text-align:left">₹${(item.unitPrice || 0).toLocaleString()}</td>
          <td style="text-align:left">₹${(item.totalValue || 0).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${filename}</title>
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
        <h2>Inventory Report</h2>
        <p>Generated: ${new Date().toLocaleString()} | Total: ${inventory.length} products | Total Value: ₹${(inventoryStats?.totalValue || 0).toLocaleString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Unit Price</th>
              <th>Total Value</th>
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
        disabled={exporting || inventory.length === 0}
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
              {inventory.length} products will be exported
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryExportReport;
