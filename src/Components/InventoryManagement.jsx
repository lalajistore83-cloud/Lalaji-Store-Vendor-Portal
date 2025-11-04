import { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { getVendorProducts, updateVendorProductStock } from '../utils/api';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editValues, setEditValues] = useState({
    quantity: '',
    operation: 'add'
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Get unique categories from inventory
  const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    fetchInventory();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await getVendorProducts();
      console.log('Vendor Products Response:', response);
      
      // Handle both response formats: direct array or response.data
      const productsData = Array.isArray(response) ? response : (response.success && response.data ? response.data : []);
      
      if (productsData && productsData.length > 0) {
        // Transform vendor products to inventory format
        const inventoryData = productsData.map(vp => {
          const product = vp.product;
          const currentStock = vp.inventory?.stock || 0;
          const minThreshold = vp.inventory?.lowStockThreshold || 10;
          
          // Get primary image
          const primaryImage = product.images?.find(img => img.isPrimary)?.url || 
                              product.images?.[0]?.url || '';
          
          // Calculate unit price from analytics or product pricing
          const unitPrice = vp.pricing?.sellingPrice || 
                           product.pricing?.sellingPrice || 
                           (vp.analytics?.totalRevenue && vp.analytics?.totalSold ? 
                             Math.round(vp.analytics.totalRevenue / vp.analytics.totalSold) : 0);
          
          // Format weight display
          const weightDisplay = product.weight?.value && product.weight?.unit 
            ? `${product.weight.value}${product.weight.unit}`
            : (product.weight && product.unit ? `${product.weight}${product.unit}` : '');
          
          return {
            id: vp._id,
            vendorProductId: vp._id,
            productId: product._id,
            name: product.name || 'Unknown Product',
            sku: product.sku || 'N/A',
            category: product.category?.name || product.category || 'Uncategorized',
            subcategory: product.subcategory?.name || product.subcategory || '',
            brand: product.brand || 'N/A',
            currentStock: currentStock,
            minThreshold: minThreshold,
            maxCapacity: vp.inventory?.maxCapacity || 500,
            unitPrice: unitPrice,
            totalValue: currentStock * unitPrice,
            lastRestocked: vp.inventory?.lastRestocked || vp.updatedAt || vp.createdAt,
            status: vp.status === 'out_of_stock' ? 'out_of_stock' : 
                   (currentStock === 0 ? 'out_of_stock' :
                   currentStock <= minThreshold ? 'low_stock' : 'in_stock'),
            location: vp.inventory?.location || 'Warehouse',
            supplier: product.supplier || product.brand || 'N/A',
            image: primaryImage,
            weight: product.weight?.value || product.weight || 0,
            unit: product.weight?.unit || product.unit || 'unit',
            weightDisplay: weightDisplay,
            totalSold: vp.analytics?.totalSold || 0,
            totalRevenue: vp.analytics?.totalRevenue || 0
          };
        });
        
        console.log('Transformed Inventory Data:', inventoryData);
        setInventory(inventoryData);
      } else {
        setInventory([]);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStockAdjustment = async (product) => {
    try {
      const quantity = parseInt(editValues.quantity);
      if (!quantity || quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      const operation = editValues.operation;

      // Validate remove operation
      if (operation === 'subtract' && quantity > product.currentStock) {
        setError(`Cannot remove ${quantity} units. Only ${product.currentStock} available.`);
        return;
      }

      // Call API to update stock
      const response = await updateVendorProductStock(product.vendorProductId, {
        quantity,
        operation,
        reason: operation === 'add' ? 'Manual stock addition' : 'Manual stock removal'
      });

      if (response.success) {
        // Update local state with new stock
        const newStock = response.data.newStock;
        
        setInventory(inventory.map(item => 
          item.id === product.id 
            ? { 
                ...item, 
                currentStock: newStock,
                totalValue: newStock * item.unitPrice,
                status: getStockStatus(newStock, item.minThreshold)
              }
            : item
        ));

        setEditingProductId(null);
        setEditValues({ quantity: '', operation: 'add' });
        
        // Show success message
        setSuccessMessage(`Stock updated successfully! New stock: ${newStock}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err.message || 'Failed to update stock');
      setTimeout(() => setError(null), 5000);
    }
  };

  const getStockStatus = (currentStock, minThreshold) => {
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minThreshold) return 'low_stock';
    return 'in_stock';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'low_stock':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock':
        return <ClockIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };

    const labels = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStockPercentage = (current, max) => {
    return Math.min(100, (current / max) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStock = filterStock === 'all' || item.status === filterStock;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const inventoryStats = {
    totalItems: inventory.length,
    inStock: inventory.filter(item => item.status === 'in_stock').length,
    lowStock: inventory.filter(item => item.status === 'low_stock').length,
    outOfStock: inventory.filter(item => item.status === 'out_of_stock').length,
    totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages - Fixed at top */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="rounded-lg bg-green-50 p-4 border border-green-200 shadow-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
              <div className="text-sm text-green-700">{successMessage}</div>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 shadow-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
              <div className="text-sm text-red-700">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Track and manage your product inventory levels
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <button 
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg 
              className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Export Report
          </button>
          <button className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
            <ArchiveBoxIcon className="h-3.5 w-3.5 mr-1.5" />
            Bulk Update
          </button>
        </div>
      </div>
{/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div 
          onClick={() => setFilterStock('all')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStock === 'all' 
              ? 'border-blue-500 shadow-md' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <CubeIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-base font-semibold text-gray-900">{inventoryStats.totalItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStock(filterStock === 'in_stock' ? 'all' : 'in_stock')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStock === 'in_stock' 
              ? 'border-green-500 shadow-md' 
              : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">In Stock</dt>
                  <dd className="text-base font-semibold text-gray-900">{inventoryStats.inStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStock(filterStock === 'low_stock' ? 'all' : 'low_stock')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStock === 'low_stock' 
              ? 'border-yellow-500 shadow-md' 
              : 'border-gray-200 hover:border-yellow-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-base font-semibold text-gray-900">{inventoryStats.lowStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStock(filterStock === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStock === 'out_of_stock' 
              ? 'border-red-500 shadow-md' 
              : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <ClockIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-base font-semibold text-gray-900">{inventoryStats.outOfStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <TagIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-base font-semibold text-gray-900">₹{inventoryStats.totalValue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-48 relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="truncate">
                  {filterCategory === 'all' ? 'All Categories' : filterCategory}
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  categoryDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {categoryDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                <div
                  onClick={() => {
                    setFilterCategory('all');
                    setCategoryDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                    All Categories
                  </div>
                </div>
                {categories.map((category) => (
                  <div
                    key={category}
                    onClick={() => {
                      setFilterCategory(category);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                      filterCategory === category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterCategory !== 'all' || filterStock !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterStock('all');
              }}
              className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      

      {/* Inventory Table */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Restocked
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchTerm || filterCategory !== 'all' || filterStock !== 'all' 
                      ? 'No products match your filters' 
                      : 'No products in inventory. Add products to get started.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-xs font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.sku}</div>
                          {item.weightDisplay && (
                            <div className="text-xs text-gray-400">{item.weightDisplay}</div>
                          )}
                        </div>
                      </div>
                    </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                      <span className="text-xs text-gray-900">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">{item.currentStock}</div>
                    <div className="text-xs text-gray-500">Min: {item.minThreshold} | Max: {item.maxCapacity}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.status === 'in_stock' ? 'bg-green-500' :
                          item.status === 'low_stock' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${getStockPercentage(item.currentStock, item.maxCapacity)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getStockPercentage(item.currentStock, item.maxCapacity).toFixed(0)}% capacity
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">₹{item.totalValue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">@₹{item.unitPrice} each</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                    {formatDate(item.lastRestocked)}
                  </td>
                  <td className="px-4 py-3">
                    {editingProductId === item.id ? (
                      // Inline Edit Mode
                      <div className="flex items-center gap-2">
                        <select
                          value={editValues.operation}
                          onChange={(e) => setEditValues({...editValues, operation: e.target.value})}
                          className="text-xs border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="add">Add (+)</option>
                          <option value="subtract">Remove (-)</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues({...editValues, quantity: e.target.value})}
                          placeholder="Qty"
                          className="w-20 text-xs border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleStockAdjustment(item)}
                          disabled={!editValues.quantity}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingProductId(null);
                            setEditValues({ quantity: '', operation: 'add' });
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProductId(item.id);
                            setEditValues({ quantity: '', operation: 'add' });
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                        >
                          <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Update Stock
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default InventoryManagement;
