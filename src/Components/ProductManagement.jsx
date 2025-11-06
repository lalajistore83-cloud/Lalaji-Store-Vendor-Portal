import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  TagIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { addProduct, updateProduct, deleteProduct, selectProduct, getAvailableProducts, getProductsByVendor } from '../utils/product';
import { getCategories, getSubcategories } from '../utils/category';
import { auth } from '../utils/auth';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'select'
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [selectionData, setSelectionData] = useState({
    productId: '',
    stock: '',
    notes: ''
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableProductsLoading, setAvailableProductsLoading] = useState(false);
  const [selectedProductForSelection, setSelectedProductForSelection] = useState(null);
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotalPages, setAvailableTotalPages] = useState(0);

  // Status counts for cards
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    out_of_stock: 0,
    totalValue: 0
  });

  // Categories and subcategories from API
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    stock: '',
    images: [],
    status: 'active',
    sku: '',
    weight: '',
    weightUnit: 'kg',
    dimensions: '',
    // Advanced Pricing
    costPrice: '',
    suggestedMRP: '',
    minSellingPrice: '',
    // Additional Details
    shortDescription: '',
    manufacturingDate: '',
    expiryDate: '',
    perishable: false,
    // Nutritional Info (per 100g)
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    tags: [],
    ingredients: [],
    // SEO
    seoTitle: '',
    seoDescription: ''
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch status counts on mount
  useEffect(() => {
    fetchStatusCounts();
  }, []);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
      // Refresh status counts when products change (but not on every page change)
      if (currentPage === 1) {
        fetchStatusCounts();
      }
    }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, filterStatus, filterCategory]);

  // Fetch available products when modal is in select mode
  useEffect(() => {
    if (showModal && modalMode === 'select') {
      const debounceTimer = setTimeout(() => {
        fetchAvailableProducts();
      }, availableSearchTerm ? 500 : 0);

      return () => clearTimeout(debounceTimer);
    }
  }, [showModal, modalMode, availablePage, availableSearchTerm]);

  const fetchCategories = async () => {
    try {
      console.log('fetchCategories - Fetching categories from API');
      const response = await getCategories();
      console.log('fetchCategories - API Response:', response);

      if (response?.success && response?.data) {
        setCategories(response.data);
        console.log('fetchCategories - Categories set:', response.data);
      } else {
        console.warn('fetchCategories - Unexpected response format:', response);
        setCategories([]);
      }
    } catch (err) {
      console.error('fetchCategories - Error:', err);
      setError('Failed to load categories');
      setCategories([]);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      console.log('fetchSubcategories - Fetching subcategories for category:', categoryId);
      const response = await getSubcategories(categoryId);
      console.log('fetchSubcategories - API Response:', response);

      if (response?.success && response?.data) {
        setSubcategories(response.data);
        console.log('fetchSubcategories - Subcategories set:', response.data);
      } else {
        console.warn('fetchSubcategories - Unexpected response format:', response);
        setSubcategories([]);
      }
    } catch (err) {
      console.error('fetchSubcategories - Error:', err);
      setSubcategories([]);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      // Get vendor ID from auth
      const user = auth.getUser();
      if (!user?._id) {
        console.error('fetchStatusCounts - No vendor ID found in user');
        return;
      }

      // Fetch all products to calculate counts
      const allResponse = await getProductsByVendor(user._id, { limit: 1 });

      // Calculate total value by fetching all products (or use a summary endpoint if available)
      const allProductsResponse = await getProductsByVendor(user._id, { limit: 1000 });
      const totalValue = allProductsResponse?.data?.reduce((sum, vp) => sum + (vp.product?.pricing?.sellingPrice || 0), 0) || 0;

      setStatusCounts({
        total: allResponse?.total || 0,
        active: allResponse?.total || 0,
        inactive: 0,
        out_of_stock: 0,
        totalValue: totalValue
      });
    } catch (err) {
      console.error('fetchStatusCounts - Error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get vendor ID from auth
      const user = auth.getUser();
      if (!user?._id) {
        console.error('fetchProducts - No vendor ID found in user');
        setError('Vendor ID not found');
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      // Build query parameters for API
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: filterCategory
      };

      console.log('fetchProducts - Calling getProductsByVendor with vendorId:', user._id, 'params:', params);
      const response = await getProductsByVendor(user._id, params);
      console.log('fetchProducts - API Response:', response);

      // Handle API response structure: { success, count, total, pagination: { page, pages }, data: [...] }
      if (response?.success && response?.data) {
        setProducts(response.data);
        setTotalProducts(response.total || 0);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        // Fallback for unexpected response format
        console.warn('fetchProducts - Unexpected response format:', response);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('fetchProducts - Error:', err);
      setError(err.message);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      setAvailableProductsLoading(true);
      setError(null);

      const params = {
        page: availablePage,
        limit: 10,
        search: availableSearchTerm
      };

      console.log('fetchAvailableProducts - Calling API with params:', params);

      const response = await getAvailableProducts(params);

      console.log('fetchAvailableProducts - Full API Response:', response);

      if (response?.success && response?.data) {
        console.log('fetchAvailableProducts - Success! Products count:', response.data.length);
        setAvailableProducts(response.data);
        setAvailableTotalPages(response.pagination?.pages || 1);
      } else {
        console.warn('fetchAvailableProducts - Unexpected response format:', response);
        setAvailableProducts([]);
        setAvailableTotalPages(1);
        setError('Unable to load available products. Please try again.');
      }
    } catch (err) {
      console.error('fetchAvailableProducts - Error:', err);
      console.error('fetchAvailableProducts - Error message:', err.message);
      console.error('fetchAvailableProducts - Error stack:', err.stack);
      setAvailableProducts([]);
      setAvailableTotalPages(1);
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setAvailableProductsLoading(false);
    }
  };

  const handleOpenSelectProduct = () => {
    setModalMode('select');
    setShowModal(true);
    setSelectedProductForSelection(null);
    setSelectionData({
      productId: '',
      stock: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'select') {
        // Handle product selection
        if (!selectedProductForSelection) {
          setError('Please select a product');
          return;
        }

        await selectProduct({
          productId: selectedProductForSelection._id || selectedProductForSelection.id,
          stock: parseInt(selectionData.stock),
          notes: selectionData.notes
        });
      } else if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (vendorProduct) => {
    setModalMode('edit');
    setEditingProduct(vendorProduct);

    // Extract product data from VendorProduct model structure
    const productData = vendorProduct.product || {};
    setFormData({
      name: productData.name || '',
      description: productData.description || '',
      price: (productData.pricing?.sellingPrice || '').toString(),
      category: vendorProduct.category?.name || productData.category?.name || vendorProduct.category || '',
      stock: vendorProduct.inventory?.stock || '',
      images: productData.images || [],
      status: vendorProduct.status || 'active',
      sku: productData.sku || '',
      weight: productData.weight?.value || '',
      dimensions: productData.dimensions || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      subcategory: '',
      stock: '',
      images: [],
      status: 'active',
      sku: '',
      weight: '',
      weightUnit: 'kg',
      dimensions: '',
      // Advanced Pricing
      costPrice: '',
      suggestedMRP: '',
      minSellingPrice: '',
      // Additional Details
      shortDescription: '',
      manufacturingDate: '',
      expiryDate: '',
      perishable: false,
      // Nutritional Info
      calories: '',
      protein: '',
      carbohydrates: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: '',
      tags: [],
      ingredients: [],
      // SEO
      seoTitle: '',
      seoDescription: ''
    });
    setEditingProduct(null);
    setModalMode('add');
    setSelectedProductForSelection(null);
    setSelectionData({
      productId: '',
      stock: '',
      notes: ''
    });
    setAvailableSearchTerm('');
    setAvailablePage(1);
  };

  // Reset to page 1 when search or filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  // Products are already filtered and paginated by the API
  // No need for client-side filtering
  const currentProducts = products;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'out_of_stock':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      out_of_stock: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      out_of_stock: 'Out of Stock'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - Super Compact */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage your product inventory and listings
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex gap-2">
          <button
            onClick={handleOpenSelectProduct}
            className="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white  hover:bg-green-500"
          >
            <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
            Select Product
          </button>
          <button
            onClick={() => {
              setModalMode('add');
              setShowModal(true);
            }}
            className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white  hover:bg-blue-500"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Status Cards - Super Compact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Items */}
        <button
          onClick={() => {
            setFilterStatus('all');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-lg  p-3 hover:shadow transition-all text-left ${
            filterStatus === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Items</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.total}</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-2">
              <CubeIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </button>

        {/* In Stock */}
        <button
          onClick={() => {
            setFilterStatus('active');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-lg  p-3 hover:shadow transition-all text-left ${
            filterStatus === 'active' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">In Stock</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.active}</p>
            </div>
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </button>

        {/* Low Stock */}
        <button
          onClick={() => {
            setFilterStatus('inactive');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-lg  p-3 hover:shadow transition-all text-left ${
            filterStatus === 'inactive' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Low Stock</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.inactive}</p>
            </div>
            <div className="bg-yellow-100 rounded-lg p-2">
              <XCircleIcon className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </button>

        {/* Out of Stock */}
        <button
          onClick={() => {
            setFilterStatus('out_of_stock');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-lg  p-3 hover:shadow transition-all text-left ${
            filterStatus === 'out_of_stock' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.out_of_stock}</p>
            </div>
            <div className="bg-red-100 rounded-lg p-2">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Filters - Super Compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-4 text-gray-400 pl-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-8 py-1.5 focus:border-blue-500 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border-gray-300 py-1.5 px-2 focus:border-blue-500 focus:ring-blue-500 text-xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-md border-gray-300 py-1.5 px-2 focus:border-blue-500 focus:ring-blue-500 text-xs"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category._id || category.id} value={category._id || category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* View Toggle Buttons */}
          <div className="ml-auto inline-flex rounded-md border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white '
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-3.5 w-3.5 mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white '
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-3.5 w-3.5 mr-1" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Products View - List or Cards */}
      {viewMode === 'list' ? (
        /* List View - Table - Super Compact */
        <div className="bg-white  rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Approval
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((vendorProduct) => {
                  // VendorProduct model structure from /vendor-products/vendor/:vendorId endpoint
                  const productData = vendorProduct.product || {};
                  const price = productData.pricing?.sellingPrice || 0;
                  const stock = vendorProduct.inventory?.stock || 0;
                  const status = vendorProduct.status || 'active';

                  return (
                  <tr key={vendorProduct._id || vendorProduct.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {productData.images && productData.images.length > 0 ? (
                            <img
                              className="h-8 w-8 rounded-md object-cover"
                              src={productData.images[0]?.url || productData.images[0]}
                              alt={productData.images[0]?.altText || productData.name}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                              <PhotoIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">{productData.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{productData.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-900">
                          {vendorProduct.category?.name || productData.category?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      ₹{price}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <CubeIcon className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{stock}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getStatusBadge(status)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        vendorProduct.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vendorProduct.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => handleEdit(vendorProduct)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendorProduct._id || vendorProduct.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination - Super Compact */}
          <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-2 relative inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalProducts)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalProducts}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md  -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-2.5 py-1 border text-xs font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Card View - Grid - Super Compact */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentProducts.map((vendorProduct) => {
              // VendorProduct model structure from /vendor-products/vendor/:vendorId endpoint
              const productData = vendorProduct.product || {};
              const price = productData.pricing?.sellingPrice || 0;
              const stock = vendorProduct.inventory?.stock || 0;
              const status = vendorProduct.status || 'active';

              return (
                <div key={vendorProduct._id || vendorProduct.id} className="bg-white  rounded-lg overflow-hidden hover:shadow transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-32 bg-gray-100">
                    {productData.images && productData.images.length > 0 ? (
                      <img
                        className="w-full h-full object-cover"
                        src={productData.images[0]?.url || productData.images[0]}
                        alt={productData.images[0]?.altText || productData.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(status)}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-2.5">
                    <div className="mb-2">
                      <h3 className="text-xs font-semibold text-gray-900 mb-0.5 truncate">{productData.name || 'N/A'}</h3>
                      <p className="text-xs text-gray-500">{productData.sku || 'N/A'}</p>
                    </div>

                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-600">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {vendorProduct.category?.name || productData.category?.name || 'N/A'}
                        </span>
                        <span className="text-sm font-bold text-gray-900">₹{price}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-600">
                          <CubeIcon className="h-3 w-3 mr-1" />
                          Stock:
                        </span>
                        <span className="text-xs text-gray-500">{stock}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Available:</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          vendorProduct.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vendorProduct.isAvailable ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1.5 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(vendorProduct)}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center justify-center px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendorProduct._id || vendorProduct.id)}
                        className="inline-flex items-center justify-center px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-red-600 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Card View - Super Compact */}
          <div className="bg-white  rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-2 relative inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalProducts)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalProducts}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md  -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-2.5 py-1 border text-xs font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit/Select Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className={`relative bg-white rounded-lg text-left overflow-hidden  transform transition-all w-full ${modalMode === 'select' ? 'max-w-4xl' : 'max-w-7xl'}`}>
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-8 pt-4 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {modalMode === 'select' ? 'Select Product' : editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>

                  {modalMode === 'select' ? (
                    <div className="space-y-4">
                      {/* Search Available Products */}
                      <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
                        <input
                          type="text"
                          placeholder="Search available products..."
                          value={availableSearchTerm}
                          onChange={(e) => {
                            setAvailableSearchTerm(e.target.value);
                            setAvailablePage(1);
                          }}
                          className="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      {/* Available Products List */}
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {availableProductsLoading ? (
                          <div className="flex flex-col items-center justify-center h-32 space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-500">Loading available products...</p>
                          </div>
                        ) : error ? (
                          <div className="text-center py-8 px-4">
                            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                            <button
                              type="button"
                              onClick={() => fetchAvailableProducts()}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Try again
                            </button>
                          </div>
                        ) : availableProducts.length === 0 ? (
                          <div className="text-center py-8 px-4">
                            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">No available products found</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {availableSearchTerm
                                ? 'Try adjusting your search terms'
                                : 'All approved products have been added to your inventory'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {availableProducts.map((product) => (
                              <div
                                key={product._id || product.id}
                                onClick={() => setSelectedProductForSelection(product)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                  selectedProductForSelection?._id === product._id || selectedProductForSelection?.id === product.id
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : ''
                                }`}
                              >
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0">
                                    {product.images && product.images.length > 0 ? (
                                      <img
                                        className="h-16 w-16 rounded-lg object-cover"
                                        src={product.images[0]?.url || product.images[0]}
                                        alt={product.images[0]?.altText || product.name}
                                      />
                                    ) : (
                                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                                    <div className="mt-2 flex items-center space-x-4 text-sm">
                                      <span className="text-gray-600">
                                        <TagIcon className="inline h-4 w-4 mr-1" />
                                        {product.category?.name || product.category || 'N/A'}
                                      </span>
                                      <span className="text-gray-600">SKU: {product.sku}</span>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {selectedProductForSelection?._id === product._id || selectedProductForSelection?.id === product.id ? (
                                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pagination for Available Products */}
                      {availableTotalPages > 1 && (
                        <div className="flex justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setAvailablePage(Math.max(1, availablePage - 1))}
                            disabled={availablePage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {availablePage} of {availableTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAvailablePage(Math.min(availableTotalPages, availablePage + 1))}
                            disabled={availablePage === availableTotalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}

                      {/* Stock and Notes Form */}
                      {selectedProductForSelection && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Initial Stock</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={selectionData.stock}
                              onChange={(e) => setSelectionData({...selectionData, stock: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter initial stock quantity"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                              rows={3}
                              value={selectionData.notes}
                              onChange={(e) => setSelectionData({...selectionData, notes: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Add any notes about this product..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Essential Information Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-green-600 rounded-lg p-1.5 mr-2.5">
                            <CubeIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Essential Information</h3>
                            <p className="text-xs text-gray-500">Required fields to create your product</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          {/* Product Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="Enter product name"
                            />
                          </div>

                          {/* SKU (Auto-generated option) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="e.g., APL-ORG-001"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const randomSKU = `SKU-${Date.now().toString().slice(-6)}`;
                                  setFormData({...formData, sku: randomSKU});
                                }}
                                className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 whitespace-nowrap transition-colors"
                              >
                                Auto
                              </button>
                            </div>
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={formData.category}
                              onChange={(e) => {
                                const selectedCategory = e.target.value;
                                setFormData({...formData, category: selectedCategory, subcategory: ''});

                                // Fetch subcategories for the selected category
                                if (selectedCategory) {
                                  // Find the category object to get its ID
                                  const categoryObj = categories.find(cat => cat._id === selectedCategory || cat.id === selectedCategory);
                                  if (categoryObj) {
                                    fetchSubcategories(categoryObj._id || categoryObj.id);
                                  }
                                } else {
                                  setSubcategories([]);
                                }
                              }}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select category</option>
                              {categories.map(category => (
                                <option key={category._id || category.id} value={category._id || category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Subcategory */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Subcategory
                            </label>
                            <select
                              value={formData.subcategory}
                              onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              disabled={!formData.category || subcategories.length === 0}
                            >
                              <option value="">Select subcategory</option>
                              {subcategories.map(subcategory => (
                                <option key={subcategory._id || subcategory.id} value={subcategory._id || subcategory.id}>
                                  {subcategory.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Selling Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Selling Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Weight */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Weight</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.weight}
                              onChange={(e) => setFormData({...formData, weight: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Weight Unit */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Weight Unit</label>
                            <select
                              value={formData.weightUnit}
                              onChange={(e) => setFormData({...formData, weightUnit: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                            >
                              <option value="kg">Kilogram (kg)</option>
                              <option value="g">Gram (g)</option>
                              <option value="mg">Milligram (mg)</option>
                              <option value="lb">Pound (lb)</option>
                              <option value="oz">Ounce (oz)</option>
                              <option value="l">Liter (L)</option>
                              <option value="ml">Milliliter (ml)</option>
                              <option value="piece">Piece</option>
                              <option value="dozen">Dozen</option>
                              <option value="pack">Pack</option>
                            </select>
                          </div>

                          {/* Dimensions */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Dimensions</label>
                            <input
                              type="text"
                              value={formData.dimensions}
                              onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="L x W x H"
                            />
                          </div>

                          {/* Product Images */}
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Product Images</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files);
                                  setFormData({...formData, images: files});
                                }}
                                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors"
                              />
                              {formData.images.length > 0 && (
                                <span className="text-xs text-gray-600 whitespace-nowrap">{formData.images.length} file{formData.images.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Product Description - Full Width */}
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Product Description</label>
                            <textarea
                              rows={2}
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                              placeholder="Brief description of your product..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advanced Pricing Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-gray-600 rounded-lg p-1.5 mr-2.5">
                            <TagIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Advanced Pricing</h3>
                            <p className="text-xs text-gray-500">Discounts and master pricing controls</p>
                          </div>
                          <span className="ml-auto text-xs text-gray-400">0% complete</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Cost Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Cost Price</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                                className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Suggested MRP */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Suggested MRP</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.suggestedMRP}
                                onChange={(e) => setFormData({...formData, suggestedMRP: e.target.value})}
                                className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Min Selling Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Min Selling Price</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.minSellingPrice}
                                onChange={(e) => setFormData({...formData, minSellingPrice: e.target.value})}
                                className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-gray-600 rounded-lg p-1.5 mr-2.5">
                            <ClockIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Additional Details</h3>
                            <p className="text-xs text-gray-500">Nutritional info, ingredients, dates</p>
                          </div>
                          <span className="ml-auto text-xs text-gray-400">0% complete</span>
                        </div>

                        <div className="space-y-3">
                          {/* Short Description, Manufacturing Date, Expiry Date, Perishable */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Short Description</label>
                              <input
                                type="text"
                                value={formData.shortDescription}
                                onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Brief summary..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Manufacturing Date</label>
                              <input
                                type="date"
                                value={formData.manufacturingDate}
                                onChange={(e) => setFormData({...formData, manufacturingDate: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiry Date</label>
                              <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center cursor-pointer pb-2">
                                <input
                                  type="checkbox"
                                  checked={formData.perishable}
                                  onChange={(e) => setFormData({...formData, perishable: e.target.checked})}
                                  className="rounded border-gray-300 text-blue-600  focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-xs font-medium text-gray-700">Perishable</span>
                              </label>
                            </div>
                          </div>

                          {/* Nutritional Info (per 100g) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nutritional Info (per 100g)</label>
                            <div className="grid grid-cols-6 gap-3">
                              <input
                                type="number"
                                min="0"
                                value={formData.calories}
                                onChange={(e) => setFormData({...formData, calories: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Calories"
                              />
                              <input
                                type="number"
                                min="0"
                                value={formData.protein}
                                onChange={(e) => setFormData({...formData, protein: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Protein"
                              />
                              <input
                                type="number"
                                min="0"
                                value={formData.carbohydrates}
                                onChange={(e) => setFormData({...formData, carbohydrates: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Carbohydrates"
                              />
                              <input
                                type="number"
                                min="0"
                                value={formData.fat}
                                onChange={(e) => setFormData({...formData, fat: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Fat"
                              />
                              <input
                                type="number"
                                min="0"
                                value={formData.fiber}
                                onChange={(e) => setFormData({...formData, fiber: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Fiber"
                              />
                              <input
                                type="number"
                                min="0"
                                value={formData.sugar}
                                onChange={(e) => setFormData({...formData, sugar: e.target.value})}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Sugar"
                              />
                            </div>
                          </div>

                          {/* Tags and Ingredients */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tags</label>
                              <input
                                type="text"
                                placeholder="Add tag..."
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Ingredients</label>
                              <input
                                type="text"
                                placeholder="Add ingredient..."
                                className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SEO & Optimization Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-green-600 rounded-lg p-1.5 mr-2.5">
                            <MagnifyingGlassIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">SEO & Optimization</h3>
                            <p className="text-xs text-gray-500">Search optimization (Free delivery included)</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* SEO Title */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">SEO Title</label>
                            <input
                              type="text"
                              value={formData.seoTitle}
                              onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="SEO optimized title"
                            />
                          </div>

                          {/* SEO Description */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">SEO Description</label>
                            <textarea
                              rows={2}
                              value={formData.seoDescription}
                              onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                              className="block w-full px-3 py-2 rounded-md border border-gray-300  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                              placeholder="SEO meta description..."
                              maxLength={160}
                            />
                            <div className="mt-1 text-xs text-gray-500 text-right">
                              {formData.seoDescription.length}/160
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-2.5">
                            <h4 className="text-xs font-semibold text-blue-900">Approval Process</h4>
                            <p className="text-xs text-blue-700 mt-0.5">
                              Your product will be submitted for approval by the admin. Once approved, you can select it and add inventory through "Select Product" to start selling.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white px-8 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    {modalMode === 'add' && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          formData.name && formData.sku && formData.category && formData.price ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="font-medium text-xs">Essential: {formData.name && formData.sku && formData.category && formData.price ? '100%' : '0%'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="inline-flex justify-center items-center rounded-md border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalMode === 'select' && !selectedProductForSelection}
                      className="inline-flex justify-center items-center rounded-md px-5 py-2 bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
                    >
                      {modalMode === 'select' ? 'Select Product' : editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </div>
              </form>
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

export default ProductManagement;
