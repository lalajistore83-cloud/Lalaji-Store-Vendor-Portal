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
  ChevronDownIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { getVendorProducts, updateVendorProductStock, createVendorProduct, getCategories, bulkUpdateVendorProductStock } from '../utils/api';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('lalaji'); // 'lalaji' or 'own'
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
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkOperation, setBulkOperation] = useState('add');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    brand: '',
    basePrice: '',
    weight: '',
    unit: 'kg',
    initialStock: 0,
    lowStockThreshold: 10,
    images: []
  });
  
  const categoryDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get unique categories from inventory
  const inventoryCategories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, [activeTab]);

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

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setNewProduct({ ...newProduct, category: categoryId, subcategory: '' });
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    setSubcategories(selectedCategory?.subcategories || []);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + newProduct.images.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }
    setNewProduct({ ...newProduct, images: [...newProduct.images, ...files] });
  };

  const removeImage = (index) => {
    const updatedImages = newProduct.images.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, images: updatedImages });
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredInventory.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredInventory.map(item => item.vendorProductId)));
    }
  };

  const handleBulkUpdate = async () => {
    try {
      setBulkUpdating(true);
      setError(null);

      if (selectedProducts.size === 0) {
        setError('Please select at least one product');
        return;
      }

      const quantity = parseInt(bulkQuantity);
      if (!quantity || quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      // Prepare updates array
      const updates = Array.from(selectedProducts).map(vendorProductId => ({
        vendorProductId,
        operation: bulkOperation,
        quantity
      }));

      const response = await bulkUpdateVendorProductStock(updates);

      if (response.success) {
        setSuccessMessage(
          `Bulk update completed! ${response.data.successful.length} products updated successfully.`
        );
        setShowBulkUpdateModal(false);
        setSelectedProducts(new Set());
        setBulkQuantity('');
        fetchInventory(true);
      } else {
        setError(response.message || 'Some updates failed');
      }
    } catch (err) {
      console.error('Error bulk updating:', err);
      setError(err.message || 'Failed to bulk update products');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      setAddingProduct(true);
      setError(null);

      // Validation
      if (!newProduct.name || !newProduct.description || !newProduct.category || 
          !newProduct.subcategory || !newProduct.brand || !newProduct.basePrice || 
          !newProduct.weight || !newProduct.unit) {
        setError('Please fill all required fields');
        return;
      }

      if (newProduct.images.length === 0) {
        setError('Please add at least one product image');
        return;
      }

      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('shortDescription', newProduct.shortDescription);
      formData.append('category', newProduct.category);
      formData.append('subcategory', newProduct.subcategory);
      formData.append('brand', newProduct.brand);
      formData.append('basePrice', newProduct.basePrice);
      formData.append('weight', newProduct.weight);
      formData.append('unit', newProduct.unit);
      formData.append('initialStock', newProduct.initialStock);
      formData.append('lowStockThreshold', newProduct.lowStockThreshold);
      
      // Add images
      newProduct.images.forEach((image, index) => {
        formData.append('images', image);
        if (index === 0) formData.append('primaryImageIndex', '0');
      });

      const response = await createVendorProduct(formData);
      
      if (response.success) {
        setSuccessMessage('Product added successfully to your inventory! You can now manage its stock.');
        setShowAddProductModal(false);
        setNewProduct({
          name: '',
          description: '',
          shortDescription: '',
          category: '',
          subcategory: '',
          brand: '',
          basePrice: '',
          weight: '',
          unit: 'kg',
          initialStock: 0,
          lowStockThreshold: 10,
          images: []
        });
        fetchInventory();
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // For 'lalaji' tab, get only Lalaji Store products (where vendor selected them)
      // For 'own' tab, get vendor's own created products
      const response = await getVendorProducts({ 
        sourceFilter: activeTab === 'lalaji' ? 'selected' : 'own' 
      });
      
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
            totalRevenue: vp.analytics?.totalRevenue || 0,
            isOwnProduct: activeTab === 'own',
            approvalStatus: product.approvalStatus?.status || 'pending'
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
          <div className="rounded-lg bg-green-50 p-4 border border-green-200 ">
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
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 ">
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
          {activeTab === 'own' && (
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
            >
              <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
              Add Product
            </button>
          )}
          <button className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Export Report
          </button>
          <button 
            onClick={() => setShowBulkUpdateModal(true)}
            disabled={selectedProducts.size === 0}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArchiveBoxIcon className="h-3.5 w-3.5 mr-1.5" />
            Bulk Update {selectedProducts.size > 0 && `(${selectedProducts.size})`}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('lalaji')}
            className={`${
              activeTab === 'lalaji'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium`}
          >
            <div className="flex items-center gap-2">
              <CubeIcon className="h-4 w-4" />
              Lalaji Store Products
              {activeTab === 'lalaji' && inventory.length > 0 && (
                <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {inventory.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('own')}
            className={`${
              activeTab === 'own'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium`}
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              My Store Products
              {activeTab === 'own' && inventory.length > 0 && (
                <span className="bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                  {inventory.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>
{/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div 
          onClick={() => setFilterStock('all')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStock === 'all' 
              ? 'border-blue-500 ' 
              : 'border-gray-200 hover:border-blue-300 hover:'
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
              ? 'border-green-500 ' 
              : 'border-gray-200 hover:border-green-300 hover:'
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
              ? 'border-yellow-500 ' 
              : 'border-gray-200 hover:border-yellow-300 hover:'
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
              ? 'border-red-500 ' 
              : 'border-gray-200 hover:border-red-300 hover:'
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
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg  max-h-60 overflow-auto">
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
                {inventoryCategories.map((category) => (
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
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredInventory.length && filteredInventory.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
                  <td colSpan="9" className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchTerm || filterCategory !== 'all' || filterStock !== 'all' 
                      ? 'No products match your filters' 
                      : 'No products in inventory. Add products to get started.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(item.vendorProductId)}
                        onChange={() => toggleProductSelection(item.vendorProductId)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Add New Product
                  </h3>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddProductModal(false)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add your own product to sell in your store. It will be added directly to your inventory.
                </p>
              </div>

              {/* Modal Content */}
              <div className="max-h-96 overflow-y-auto px-4 py-3">
                <div className="space-y-3">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="e.g., Fresh Organic Apples"
                      className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      rows={3}
                      placeholder="Detailed product description..."
                      className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Subcategory *
                      </label>
                      <select
                        value={newProduct.subcategory}
                        onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                        disabled={!newProduct.category}
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map(sub => (
                          <option key={sub._id} value={sub._id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Brand & Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                        placeholder="e.g., Organic Farms"
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={newProduct.basePrice}
                        onChange={(e) => setNewProduct({...newProduct, basePrice: e.target.value})}
                        placeholder="0"
                        min="0"
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Weight & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Weight/Quantity *
                      </label>
                      <input
                        type="number"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <select
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="l">Liter (l)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>

                  {/* Initial Stock & Low Stock Threshold */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={newProduct.initialStock}
                        onChange={(e) => setNewProduct({...newProduct, initialStock: parseInt(e.target.value) || 0})}
                        placeholder="0"
                        min="0"
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Low Stock Alert
                      </label>
                      <input
                        type="number"
                        value={newProduct.lowStockThreshold}
                        onChange={(e) => setNewProduct({...newProduct, lowStockThreshold: parseInt(e.target.value) || 10})}
                        placeholder="10"
                        min="0"
                        className="block w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product Images * (Max 4)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {newProduct.images.map((img, index) => (
                        <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                      {newProduct.images.length < 4 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50"
                        >
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Add Image</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">First image will be the primary image</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-4 gap-2">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={addingProduct}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingProduct ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Product
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  disabled={addingProduct}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Bulk Update Stock
                  </h3>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setShowBulkUpdateModal(false)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Update stock for {selectedProducts.size} selected product{selectedProducts.size !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Modal Content */}
              <div className="px-4 py-4">
                <div className="space-y-4">
                  {/* Operation Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operation
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setBulkOperation('add')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                          bulkOperation === 'add'
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <PlusIcon className="h-4 w-4 mx-auto mb-1" />
                        Add Stock
                      </button>
                      <button
                        onClick={() => setBulkOperation('subtract')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                          bulkOperation === 'subtract'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <MinusIcon className="h-4 w-4 mx-auto mb-1" />
                        Remove Stock
                      </button>
                      <button
                        onClick={() => setBulkOperation('set')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                          bulkOperation === 'set'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <AdjustmentsHorizontalIcon className="h-4 w-4 mx-auto mb-1" />
                        Set Stock
                      </button>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bulkOperation === 'add' && 'This quantity will be added to each selected product'}
                      {bulkOperation === 'subtract' && 'This quantity will be removed from each selected product'}
                      {bulkOperation === 'set' && 'Stock will be set to this quantity for each selected product'}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium">Summary</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} will be updated
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-4 gap-2">
                <button
                  type="button"
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdating || !bulkQuantity}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkUpdating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Update Stock
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkUpdateModal(false)}
                  disabled={bulkUpdating}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;
