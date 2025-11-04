import { useState, useEffect } from 'react';
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
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { getInventory, updateStock, addStockMovement } from '../utils/api';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'add',
    quantity: '',
    reason: ''
  });

  const categories = [
    'Fruits & Vegetables',
    'Dairy Products',
    'Bakery',
    'Meat & Seafood',
    'Beverages',
    'Snacks',
    'Personal Care',
    'Household'
  ];

  const stockReasons = {
    add: [
      'New Stock Received',
      'Return from Customer',
      'Manual Adjustment',
      'Damaged Stock Recovery',
      'Other'
    ],
    remove: [
      'Damaged/Expired',
      'Sold Out',
      'Return to Supplier',
      'Manual Adjustment',
      'Other'
    ]
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data || []);
    } catch (err) {
      setError(err.message);
      // Mock data for demonstration
      setInventory([
        {
          id: 1,
          name: 'Organic Apples',
          sku: 'APL-001',
          category: 'Fruits & Vegetables',
          currentStock: 150,
          minThreshold: 20,
          maxCapacity: 300,
          unitPrice: 120,
          totalValue: 18000,
          lastRestocked: '2024-01-10T10:00:00Z',
          status: 'in_stock',
          location: 'A-1-01',
          supplier: 'Fresh Farms Ltd'
        },
        {
          id: 2,
          name: 'Fresh Milk',
          sku: 'MLK-001',
          category: 'Dairy Products',
          currentStock: 45,
          minThreshold: 30,
          maxCapacity: 200,
          unitPrice: 60,
          totalValue: 2700,
          lastRestocked: '2024-01-12T08:00:00Z',
          status: 'in_stock',
          location: 'B-2-05',
          supplier: 'Dairy Plus'
        },
        {
          id: 3,
          name: 'Whole Wheat Bread',
          sku: 'BRD-001',
          category: 'Bakery',
          currentStock: 15,
          minThreshold: 25,
          maxCapacity: 100,
          unitPrice: 45,
          totalValue: 675,
          lastRestocked: '2024-01-08T16:00:00Z',
          status: 'low_stock',
          location: 'C-1-12',
          supplier: 'Fresh Bakery'
        },
        {
          id: 4,
          name: 'Premium Coffee',
          sku: 'COF-001',
          category: 'Beverages',
          currentStock: 0,
          minThreshold: 10,
          maxCapacity: 80,
          unitPrice: 250,
          totalValue: 0,
          lastRestocked: '2024-01-05T12:00:00Z',
          status: 'out_of_stock',
          location: 'D-3-08',
          supplier: 'Coffee Masters'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    try {
      const adjustment = {
        productId: selectedProduct.id,
        type: stockAdjustment.type,
        quantity: parseInt(stockAdjustment.quantity),
        reason: stockAdjustment.reason
      };

      await addStockMovement(adjustment);
      
      // Update local state
      const newStock = stockAdjustment.type === 'add' 
        ? selectedProduct.currentStock + adjustment.quantity
        : selectedProduct.currentStock - adjustment.quantity;

      setInventory(inventory.map(item => 
        item.id === selectedProduct.id 
          ? { 
              ...item, 
              currentStock: Math.max(0, newStock),
              totalValue: Math.max(0, newStock) * item.unitPrice,
              status: getStockStatus(Math.max(0, newStock), item.minThreshold)
            }
          : item
      ));

      setShowStockModal(false);
      setStockAdjustment({ type: 'add', quantity: '', reason: '' });
      setSelectedProduct(null);
    } catch (err) {
      setError(err.message);
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
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'low_stock':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'out_of_stock':
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
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
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your product inventory levels
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
            Export Report
          </button>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <ArchiveBoxIcon className="h-4 w-4 mr-2" />
            Bulk Update
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{inventoryStats.totalItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{inventoryStats.inStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{inventoryStats.lowStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{inventoryStats.outOfStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{inventoryStats.totalValue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <button className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Restocked
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                      <div className="text-xs text-gray-400">Location: {item.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.currentStock}</div>
                    <div className="text-xs text-gray-500">Min: {item.minThreshold} | Max: {item.maxCapacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === 'in_stock' ? 'bg-green-500' :
                          item.status === 'low_stock' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${getStockPercentage(item.currentStock, item.maxCapacity)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getStockPercentage(item.currentStock, item.maxCapacity).toFixed(0)}% capacity
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <div className="ml-2">{getStatusBadge(item.status)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{item.totalValue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">@₹{item.unitPrice} each</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(item.lastRestocked)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setStockAdjustment({ type: 'add', quantity: '', reason: '' });
                          setShowStockModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Add Stock"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setStockAdjustment({ type: 'remove', quantity: '', reason: '' });
                          setShowStockModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Remove Stock"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowStockModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {stockAdjustment.type === 'add' ? 'Add Stock' : 'Remove Stock'} - {selectedProduct.name}
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Current Stock: <span className="font-medium">{selectedProduct.currentStock}</span></div>
                    <div className="text-sm text-gray-600">SKU: <span className="font-medium">{selectedProduct.sku}</span></div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                    <select
                      value={stockAdjustment.type}
                      onChange={(e) => setStockAdjustment({...stockAdjustment, type: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="add">Add Stock</option>
                      <option value="remove">Remove Stock</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={stockAdjustment.type === 'remove' ? selectedProduct.currentStock : undefined}
                      value={stockAdjustment.quantity}
                      onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <select
                      value={stockAdjustment.reason}
                      onChange={(e) => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select reason</option>
                      {stockReasons[stockAdjustment.type].map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                  
                  {stockAdjustment.quantity && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-700">
                        New stock level will be: <span className="font-medium">
                          {stockAdjustment.type === 'add' 
                            ? selectedProduct.currentStock + parseInt(stockAdjustment.quantity || 0)
                            : Math.max(0, selectedProduct.currentStock - parseInt(stockAdjustment.quantity || 0))
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleStockAdjustment}
                  disabled={!stockAdjustment.quantity || !stockAdjustment.reason}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stockAdjustment.type === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setStockAdjustment({ type: 'add', quantity: '', reason: '' });
                    setSelectedProduct(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
