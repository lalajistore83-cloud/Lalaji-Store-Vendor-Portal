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
import { addProduct, updateProduct, deleteProduct, getProductsByVendor, getVendorSubmittedProducts } from '../utils/product';
import { getCategories, getSubcategories } from '../utils/category';
import { auth } from '../utils/auth';

// Custom Dropdown Component
const CustomDropdown = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select", 
  required = false,
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="block w-full px-3 py-2 text-sm text-left rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg  max-h-60 overflow-hidden">
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [submittedProducts, setSubmittedProducts] = useState([]); // New state for vendor-submitted products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'

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
    basePrice: '',
    category: '',
    subcategory: '',
    stock: '',
    images: [],
    status: 'pending_approval',
    sku: '',
    brand: '',
    unit: '',
    weight: '',
    weightUnit: 'kg',
    dimensions: '',
    // Pricing Information (matching Product schema)
    discountPercentage: '',
    discountAmount: '',
    minimumSellingPrice: '',
    // Additional Details
    shortDescription: '',
    manufacturingDate: '',
    expiryDate: '',
    perishable: false,
    storageTemp: '',
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
    seoDescription: '',
    // Missing Product Schema Fields
    barcode: '',
    shelfLife: '',
    shelfLifeUnit: 'days',
    storageInstructions: '',
    certifications: [],
    allergens: [],
    origin: {
      country: '',
      state: '',
      city: ''
    },
    // Delivery settings
    deliveryCategory: 'standard',
    weightCategory: 'medium',
    specialHandling: [],
    // Dimensions breakdown
    dimensionLength: '',
    dimensionWidth: '',
    dimensionHeight: '',
    dimensionUnit: 'cm'
  });

  // State for GST calculation
  const [gstInfo, setGstInfo] = useState({
    rate: 0,
    amount: 0,
    totalPrice: 0,
    applicable: false,
    hsnCode: ''
  });

  // Dropdown options
  const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'l', label: 'Liter (l)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'piece', label: 'Piece' },
    { value: 'pack', label: 'Pack' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'bundle', label: 'Bundle' },
    { value: 'box', label: 'Box' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'pouch', label: 'Pouch' }
  ];

  const weightUnitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'l', label: 'Liter (l)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'piece', label: 'Piece' },
    { value: 'pack', label: 'Pack' }
  ];

  const shelfLifeUnitOptions = [
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' }
  ];

  const storageTemperatureOptions = [
    { value: 'room_temperature', label: 'Room Temperature' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'frozen', label: 'Frozen' }
  ];

  const deliveryCategoryOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'express', label: 'Express' },
    { value: 'cold_chain', label: 'Cold Chain' },
    { value: 'fragile', label: 'Fragile' }
  ];

  const weightCategoryOptions = [
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'heavy', label: 'Heavy' }
  ];

  const dimensionUnitOptions = [
    { value: 'cm', label: 'Centimeter (cm)' },
    { value: 'mm', label: 'Millimeter (mm)' },
    { value: 'inch', label: 'Inch' }
  ];

  const certificationOptions = [
    { value: 'organic', label: 'Organic' },
    { value: 'non_gmo', label: 'Non-GMO' },
    { value: 'gluten_free', label: 'Gluten Free' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
    { value: 'fair_trade', label: 'Fair Trade' }
  ];

  const specialHandlingOptions = [
    { value: 'fragile', label: 'Fragile' },
    { value: 'perishable', label: 'Perishable' },
    { value: 'temperature_controlled', label: 'Temperature Controlled' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'hazardous', label: 'Hazardous' }
  ];

  // Convert categories and subcategories to dropdown format
  const categoryOptions = categories.map(cat => ({
    value: cat._id || cat.id,
    label: cat.name
  }));

  const subcategoryOptions = subcategories.map(subcat => ({
    value: subcat._id || subcat.id,
    label: subcat.name
  }));

  // Function to calculate GST based on subcategory
  const calculateGST = async (basePrice, subcategoryId) => {
    if (!basePrice || !subcategoryId) {
      setGstInfo({
        rate: 0,
        amount: 0,
        totalPrice: parseFloat(basePrice) || 0,
        applicable: false,
        hsnCode: ''
      });
      return;
    }

    try {
      // Find the subcategory in the local subcategories array to get GST rate
      const selectedSubcategory = subcategories.find(subcat => subcat._id === subcategoryId || subcat.id === subcategoryId);
      
      if (selectedSubcategory && selectedSubcategory.gst) {
        const price = parseFloat(basePrice);
        const gstRate = selectedSubcategory.gst.rate || 18; // Default to 18% if not specified
        const gstAmount = (price * gstRate) / 100;
        const totalPrice = price + gstAmount;

        setGstInfo({
          rate: gstRate,
          amount: Math.round(gstAmount * 100) / 100,
          totalPrice: Math.round(totalPrice * 100) / 100,
          applicable: true,
          hsnCode: ''
        });
      } else {
        // Fallback to default values if subcategory GST not found
        const price = parseFloat(basePrice);
        const gstRate = 18; // Default GST rate
        const gstAmount = (price * gstRate) / 100;
        const totalPrice = price + gstAmount;

        setGstInfo({
          rate: gstRate,
          amount: Math.round(gstAmount * 100) / 100,
          totalPrice: Math.round(totalPrice * 100) / 100,
          applicable: true,
          hsnCode: ''
        });
      }
    } catch (error) {
      console.error('Error calculating GST:', error);
      // Fallback calculation
      const price = parseFloat(basePrice) || 0;
      const gstRate = 18; // Default GST rate
      const gstAmount = (price * gstRate) / 100;
      const totalPrice = price + gstAmount;

      setGstInfo({
        rate: gstRate,
        amount: Math.round(gstAmount * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        applicable: true,
        hsnCode: ''
      });
    }
  };

  // Effect to recalculate GST when basePrice or subcategory changes
  useEffect(() => {
    if (formData.basePrice && formData.subcategory) {
      calculateGST(formData.basePrice, formData.subcategory);
    } else {
      setGstInfo({
        rate: 0,
        amount: 0,
        totalPrice: parseFloat(formData.basePrice) || 0,
        applicable: false,
        hsnCode: ''
      });
    }
  }, [formData.basePrice, formData.subcategory, subcategories]);

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
      const allResponse = await getProductsByVendor(user._id, { limit: 1000 });
      
      // Also fetch submitted products for pending verification count
      let submittedCount = 0;
      try {
        const submittedResponse = await getVendorSubmittedProducts({ limit: 1000 });
        if (submittedResponse?.success && submittedResponse?.data) {
          submittedCount = submittedResponse.data.length;
        }
      } catch (submittedErr) {
        console.error('fetchStatusCounts - Error fetching submitted products:', submittedErr);
      }

      if (allResponse?.success && allResponse?.data) {
        const products = allResponse.data;
        
        // Calculate counts based on the new API structure and inventory status
        const active = products.filter(p => 
          p.status === 'active' && 
          (p.inventory?.isInStock !== false) &&
          (p.inventory?.stock === undefined || p.inventory.stock > 0)
        ).length;
        
        const inactive = products.filter(p => 
          p.status === 'inactive' || 
          p.inventory?.isLowStock === true ||
          (p.inventory?.stock !== undefined && 
           p.inventory?.lowStockThreshold !== undefined &&
           p.inventory.stock <= p.inventory.lowStockThreshold &&
           p.inventory.stock > 0)
        ).length;
        
        const outOfStock = products.filter(p => 
          p.status === 'out_of_stock' || 
          !p.inventory?.isInStock ||
          (p.inventory?.stock !== undefined && p.inventory.stock === 0)
        ).length;
        
        const totalValue = products.reduce((sum, p) => sum + (p.pricing?.basePrice || 0), 0);
        
        // Count pending verification products (products with certain statuses + submitted products)
        const pendingVerification = products.filter(p => 
          p.status === 'pending_verification' || 
          p.status === 'pending_approval' || 
          p.status === 'draft'
        ).length + submittedCount;

        setStatusCounts({
          total: products.length,
          active: active,
          inactive: inactive,
          out_of_stock: outOfStock,
          pending_verification: pendingVerification,
          totalValue: totalValue
        });
      }
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
        setSubmittedProducts([]);
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

      // Only send certain status filters to the API
      // Handle complex filters (out_of_stock, inactive) client-side
      if (filterStatus && 
          filterStatus !== 'all' && 
          filterStatus !== 'out_of_stock' && 
          filterStatus !== 'inactive') {
        params.status = filterStatus;
      }

      console.log('fetchProducts - Calling getProductsByVendor with vendorId:', user._id, 'params:', params);
      const response = await getProductsByVendor(user._id, params);
      console.log('fetchProducts - API Response:', response);

      // If we're on pending verification filter, also fetch submitted products
      if (filterStatus === 'pending_verification') {
        try {
          console.log('fetchProducts - Also fetching vendor submitted products');
          const submittedResponse = await getVendorSubmittedProducts(params);
          console.log('fetchProducts - Submitted products response:', submittedResponse);
          
          if (submittedResponse?.success && submittedResponse?.data) {
            setSubmittedProducts(submittedResponse.data);
          } else {
            setSubmittedProducts([]);
          }
        } catch (submittedErr) {
          console.error('fetchProducts - Error fetching submitted products:', submittedErr);
          setSubmittedProducts([]);
        }
      } else {
        setSubmittedProducts([]);
      }

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
      setSubmittedProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        // Create comprehensive product data structure based on Product schema
        const productData = {
          // Basic Product Information
          name: formData.name,
          description: formData.description,
          shortDescription: formData.shortDescription,
          
          // Product Identification
          sku: formData.sku,
          barcode: formData.barcode,
          
          // Categorization
          category: formData.category,
          subcategory: formData.subcategory,
          brand: formData.brand,
          tags: formData.tags,
          
          // Product Images
          images: formData.images,
          
          // Pricing Information (masterPricing for backend)
          pricing: {
            basePrice: parseFloat(formData.basePrice) || 0,
            discount: {
              percentage: parseFloat(formData.discountPercentage) || 0,
              amount: parseFloat(formData.discountAmount) || 0
            }
          },
          
          // Master pricing
          masterPricing: {
            minimumSellingPrice: parseFloat(formData.minimumSellingPrice) || 0
          },
          
          // Units and Measurements
          unit: formData.unit,
          weight: {
            value: parseFloat(formData.weight) || 0,
            unit: formData.weightUnit
          },
          dimensions: {
            length: parseFloat(formData.dimensionLength) || null,
            width: parseFloat(formData.dimensionWidth) || null,
            height: parseFloat(formData.dimensionHeight) || null,
            unit: formData.dimensionUnit
          },
          
          // Product Attributes
          attributes: {
            // Expiry and Freshness
            expiryDate: formData.expiryDate || null,
            manufacturingDate: formData.manufacturingDate || null,
            shelfLife: formData.shelfLife ? {
              value: parseInt(formData.shelfLife),
              unit: formData.shelfLifeUnit
            } : null,
            
            // Food-specific attributes
            nutritionalInfo: {
              calories: parseFloat(formData.calories) || null,
              protein: parseFloat(formData.protein) || null,
              carbohydrates: parseFloat(formData.carbohydrates) || null,
              fat: parseFloat(formData.fat) || null,
              fiber: parseFloat(formData.fiber) || null,
              sugar: parseFloat(formData.sugar) || null,
              sodium: parseFloat(formData.sodium) || null
            },
            
            // Storage and handling
            storageInstructions: formData.storageInstructions,
            temperature: formData.storageTemp,
            
            // Certifications and labels
            certifications: formData.certifications,
            
            // Origin and sourcing
            origin: {
              country: formData.origin.country,
              state: formData.origin.state,
              city: formData.origin.city
            },
            
            // Additional attributes
            ingredients: formData.ingredients,
            allergens: formData.allergens,
            isPerishable: formData.perishable
          },
          
          // SEO and Search
          seo: {
            metaTitle: formData.seoTitle,
            metaDescription: formData.seoDescription
          },
          
          // Delivery and Logistics
          masterDelivery: {
            category: formData.deliveryCategory,
            weightCategory: formData.weightCategory,
            specialHandling: formData.specialHandling
          }
        };

        await addProduct(productData);
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
      basePrice: (productData.pricing?.basePrice || '').toString(),
      category: vendorProduct.category?.name || productData.category?.name || vendorProduct.category || '',
      stock: vendorProduct.inventory?.stock || '',
      images: productData.images || [],
      status: vendorProduct.status || 'active',
      sku: productData.sku || '',
      weight: productData.weight?.value || '',
      dimensions: productData.dimensions || '',
      discountPercentage: (productData.pricing?.discount?.percentage || '').toString(),
      discountAmount: (productData.pricing?.discount?.amount || '').toString(),
      minimumSellingPrice: (productData.masterPricing?.minimumSellingPrice || '').toString()
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      category: '',
      subcategory: '',
      stock: '',
      images: [],
      status: 'pending_approval',
      sku: '',
      brand: '',
      unit: '',
      weight: '',
      weightUnit: 'kg',
      dimensions: '',
      // Pricing Information (matching Product schema)
      discountPercentage: '',
      discountAmount: '',
      minimumSellingPrice: '',
      // Additional Details
      shortDescription: '',
      manufacturingDate: '',
      expiryDate: '',
      perishable: false,
      storageTemp: '',
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
      seoDescription: '',
      // Missing Product Schema Fields
      barcode: '',
      shelfLife: '',
      shelfLifeUnit: 'days',
      storageInstructions: '',
      certifications: [],
      allergens: [],
      origin: {
        country: '',
        state: '',
        city: ''
      },
      // Delivery settings
      deliveryCategory: 'standard',
      weightCategory: 'medium',
      specialHandling: [],
      // Dimensions breakdown
      dimensionLength: '',
      dimensionWidth: '',
      dimensionHeight: '',
      dimensionUnit: 'cm'
    });
    setEditingProduct(null);
    setModalMode('add');
    // Reset GST info
    setGstInfo({
      rate: 0,
      amount: 0,
      totalPrice: 0,
      applicable: false,
      hsnCode: ''
    });
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
  // Apply additional client-side filtering and combine product types
  let currentProducts = products;

  // Special handling for pending verification - combine with submitted products
  if (filterStatus === 'pending_verification') {
    currentProducts = [
      // Filter regular vendor products to only show pending ones
      ...products.filter(product => 
        product.status === 'pending_approval' || 
        product.status === 'pending_verification' ||
        product.approvalStatus?.status === 'pending' ||
        product.approvalStatus?.status === 'under_review'
      ), 
      // Add submitted products (these are already pending by definition)
      ...submittedProducts
    ];
  } 
  // Special handling for out of stock - filter by inventory
  else if (filterStatus === 'out_of_stock') {
    currentProducts = products.filter(product => 
      product.status === 'out_of_stock' || 
      !product.inventory?.isInStock ||
      (product.inventory?.stock !== undefined && product.inventory.stock === 0)
    );
  }
  // Special handling for active - filter by status and stock
  else if (filterStatus === 'active') {
    currentProducts = products.filter(product => 
      product.status === 'active' && 
      (product.inventory?.isInStock !== false) &&
      (product.inventory?.stock === undefined || product.inventory.stock > 0)
    );
  }
  // Special handling for inactive/low stock
  else if (filterStatus === 'inactive') {
    currentProducts = products.filter(product => 
      product.status === 'inactive' || 
      product.inventory?.isLowStock === true ||
      (product.inventory?.stock !== undefined && 
       product.inventory?.lowStockThreshold !== undefined &&
       product.inventory.stock <= product.inventory.lowStockThreshold &&
       product.inventory.stock > 0)
    );
  }

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
      out_of_stock: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      out_of_stock: 'Out of Stock',
      pending_approval: 'Pending Approval'
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Total Items */}
        <button
          onClick={() => {
            setFilterStatus('all');
            setCurrentPage(1);
          }}
          className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all text-left ${
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
          className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-all text-left ${
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
          className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-yellow-300 transition-all text-left ${
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
          className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-all text-left ${
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

        {/* Pending Verification */}
        <button
          onClick={() => {
            setFilterStatus('pending_verification');
            setCurrentPage(1);
          }}
          className={`bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-all text-left ${
            filterStatus === 'pending_verification' ? 'ring-2 ring-purple-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Pending Verification</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{statusCounts.pending_verification || 0}</p>
            </div>
            <div className="bg-purple-100 rounded-lg p-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Filters - Compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <CustomDropdown
            label="Status"
            value={filterStatus}
            onChange={handleStatusChange}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'out_of_stock', label: 'Out of Stock' },
              { value: 'pending_verification', label: 'Pending Verification' }
            ]}
            placeholder="Select Status"
          />

          {/* Category Filter */}
          <CustomDropdown
            label="Category"
            value={filterCategory}
            onChange={handleCategoryChange}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(category => ({
                value: category._id || category.id,
                label: category.name
              }))
            ]}
            placeholder="Select Category"
          />
        </div>

        {/* View Toggle Buttons */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {totalProducts} products
          </div>
          <div className="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-3.5 w-3.5 mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                  // Use the API response structure directly
                  const price = vendorProduct.pricing?.breakdown?.totalAmount || vendorProduct.pricing?.basePrice || 0;
                  const stock = vendorProduct.inventory?.stock || 0;
                  const status = vendorProduct.status || 'active';
                  
                  // Check if this is a pending verification product
                  // This includes both selected products with pending status and submitted products
                  const isSubmittedProduct = vendorProduct.isSubmitted || vendorProduct.submissionType === 'vendor_submitted';
                  const isPendingVerification = filterStatus === 'pending_verification' || 
                                              status === 'pending_approval' || 
                                              status === 'pending_verification' ||
                                              vendorProduct.approvalStatus?.status === 'pending' ||
                                              vendorProduct.approvalStatus?.status === 'under_review' ||
                                              isSubmittedProduct;

                  return (
                  <tr key={vendorProduct.id || vendorProduct._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {vendorProduct.images && vendorProduct.images.length > 0 ? (
                            <img
                              className="h-8 w-8 rounded-md object-cover"
                              src={vendorProduct.images[0]?.url || vendorProduct.images[0]}
                              alt={vendorProduct.images[0]?.altText || vendorProduct.name}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                              <PhotoIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">{vendorProduct.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{vendorProduct.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-900">
                          {vendorProduct.category?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {isPendingVerification ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">-</span>
                          <span className="text-xs text-gray-400">(pending)</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium">₹{Math.round(price)}</span>
                          <span className="text-xs text-gray-500">(incl. all taxes)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isPendingVerification ? (
                        <div className="flex items-center">
                          <CubeIcon className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">-</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CubeIcon className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{stock}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getStatusBadge(isPendingVerification ? 'pending_approval' : status)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {isPendingVerification ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          Under Review
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          vendorProduct.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vendorProduct.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex justify-end space-x-1.5">
                        <button className="text-gray-600 hover:text-gray-900">
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                        {isPendingVerification && (
                          <button className="text-blue-600 hover:text-blue-900" title="Edit Draft">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
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
              // Use the API response structure directly
              const price = vendorProduct.pricing?.breakdown?.totalAmount || vendorProduct.pricing?.basePrice || 0;
              const stock = vendorProduct.inventory?.stock || 0;
              const status = vendorProduct.status || 'active';
              
              // Check if this is a pending verification product
              const isPendingVerification = status === 'pending_approval' || vendorProduct.approvalStatus?.status === 'pending';

              return (
                <div key={vendorProduct.id || vendorProduct._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden  transition-">
                  {/* Product Image */}
                  <div className="relative h-32 bg-gray-100">
                    {vendorProduct.images && vendorProduct.images.length > 0 ? (
                      <img
                        className="w-full h-full object-cover"
                        src={vendorProduct.images[0]?.url || vendorProduct.images[0]}
                        alt={vendorProduct.images[0]?.altText || vendorProduct.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(isPendingVerification ? 'pending_approval' : status)}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-2.5">
                    <div className="mb-2">
                      <h3 className="text-xs font-semibold text-gray-900 mb-0.5 truncate">{vendorProduct.name || 'N/A'}</h3>
                      <p className="text-xs text-gray-500">{vendorProduct.sku || 'N/A'}</p>
                    </div>

                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-600">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {vendorProduct.category?.name || 'N/A'}
                        </span>
                        <div className="text-right">
                          {isPendingVerification ? (
                            <div>
                              <div className="text-sm text-gray-500">-</div>
                              <div className="text-xs text-gray-400">(pending)</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-bold text-gray-900">₹{Math.round(price)}</div>
                              <div className="text-xs text-gray-500">(incl. all taxes)</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-600">
                          <CubeIcon className="h-3 w-3 mr-1" />
                          Stock:
                        </span>
                        <span className="text-xs text-gray-500">{isPendingVerification ? '-' : stock}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Status:</span>
                        {isPendingVerification ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                            Under Review
                          </span>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            vendorProduct.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendorProduct.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center pt-2 border-t border-gray-200 gap-2">
                      <button className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                      {isPendingVerification && (
                        <button className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Card View - Super Compact */}
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
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
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="relative bg-white rounded-lg text-left overflow-hidden transform transition-all w-full max-w-7xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-8 pt-4 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>

                  <div className="space-y-3">
                      {/* Basic Information Section */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-blue-600 rounded p-1 mr-2">
                            <CubeIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {/* Product Name */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter product name"
                            />
                          </div>

                          {/* Brand */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Brand <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.brand}
                              onChange={(e) => setFormData({...formData, brand: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Brand name"
                            />
                          </div>

                          {/* SKU */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="SKU-001"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const randomSKU = `SKU-${Date.now().toString().slice(-6)}`;
                                  setFormData({...formData, sku: randomSKU});
                                }}
                                className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Auto
                              </button>
                            </div>
                          </div>

                          {/* Barcode */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Barcode
                            </label>
                            <input
                              type="text"
                              value={formData.barcode}
                              onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="123456789012"
                            />
                          </div>

                          {/* Unit */}
                          <div className="col-span-1">
                            <CustomDropdown
                              label="Unit"
                              value={formData.unit}
                              onChange={(value) => setFormData({...formData, unit: value})}
                              options={unitOptions}
                              placeholder="Select unit"
                              required={true}
                            />
                          </div>

                          {/* Weight Value */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Weight <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={formData.weight}
                              onChange={(e) => setFormData({...formData, weight: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Weight Unit */}
                          <div className="col-span-1">
                            <CustomDropdown
                              label="Weight Unit"
                              value={formData.weightUnit}
                              onChange={(value) => setFormData({...formData, weightUnit: value})}
                              options={weightUnitOptions}
                              required={true}
                            />
                          </div>

                          {/* Category */}
                          <div className="col-span-2">
                            <CustomDropdown
                              label="Category"
                              value={formData.category}
                              onChange={(value) => {
                                setFormData({...formData, category: value, subcategory: ''});
                                if (value) {
                                  const categoryObj = categories.find(cat => cat._id === value || cat.id === value);
                                  if (categoryObj) {
                                    fetchSubcategories(categoryObj._id || categoryObj.id);
                                  }
                                } else {
                                  setSubcategories([]);
                                }
                              }}
                              options={categoryOptions}
                              placeholder="Select category"
                              required={true}
                            />
                          </div>

                          {/* Subcategory */}
                          <div className="col-span-2">
                            <CustomDropdown
                              label="Subcategory"
                              value={formData.subcategory}
                              onChange={(value) => setFormData({...formData, subcategory: value})}
                              options={subcategoryOptions}
                              placeholder="Select subcategory"
                              required={true}
                              disabled={!formData.category || subcategories.length === 0}
                            />
                          </div>

                          {/* Base Price */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Base Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 text-xs">₹</span>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                                className="block w-full pl-6 pr-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* GST Info Display */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              GST ({gstInfo.rate}%)
                            </label>
                            <div className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded">
                              ₹{gstInfo.amount}
                            </div>
                          </div>

                          {/* Total Price Display */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Total Price
                            </label>
                            <div className="px-2 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded font-medium text-blue-800">
                              ₹{gstInfo.totalPrice}
                            </div>
                          </div>

                          {/* Shelf Life */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Shelf Life
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                min="0"
                                value={formData.shelfLife}
                                onChange={(e) => setFormData({...formData, shelfLife: e.target.value})}
                                className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <div className="w-20">
                                <CustomDropdown
                                  label=""
                                  value={formData.shelfLifeUnit}
                                  onChange={(value) => setFormData({...formData, shelfLifeUnit: value})}
                                  options={shelfLifeUnitOptions}
                                  className="mt-0"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Description - Full Width */}
                          <div className="col-span-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                              placeholder="Detailed product description..."
                            />
                          </div>

                          {/* Short Description */}
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
                            <input
                              type="text"
                              value={formData.shortDescription}
                              onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Brief summary..."
                            />
                          </div>

                          {/* Product Images */}
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Product Images</label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files);
                                setFormData({...formData, images: files});
                              }}
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        </div>
                      </div> 

                      {/* Product Attributes */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-purple-600 rounded p-1 mr-2">
                            <ClockIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">Product Attributes</h3>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {/* Manufacturing Date */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturing Date</label>
                            <input
                              type="date"
                              value={formData.manufacturingDate}
                              onChange={(e) => setFormData({...formData, manufacturingDate: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Expiry Date */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input
                              type="date"
                              value={formData.expiryDate}
                              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Storage Temperature */}
                          <div className="col-span-1">
                            <CustomDropdown
                              label="Storage Temp"
                              value={formData.storageTemp}
                              onChange={(value) => setFormData({...formData, storageTemp: value})}
                              options={storageTemperatureOptions}
                              placeholder="Select temperature"
                            />
                          </div>

                          {/* Perishable */}
                          <div className="col-span-1 flex items-end">
                            <label className="flex items-center cursor-pointer pb-1.5">
                              <input
                                type="checkbox"
                                checked={formData.perishable}
                                onChange={(e) => setFormData({...formData, perishable: e.target.checked})}
                                className="rounded border-gray-300 text-blue-600 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-1.5 text-xs font-medium text-gray-700">Perishable</span>
                            </label>
                          </div>

                          {/* Delivery Category */}
                          <div className="col-span-1">
                            <CustomDropdown
                              label="Delivery Type"
                              value={formData.deliveryCategory}
                              onChange={(value) => setFormData({...formData, deliveryCategory: value})}
                              options={deliveryCategoryOptions}
                            />
                          </div>

                          {/* Weight Category */}
                          <div className="col-span-1">
                            <CustomDropdown
                              label="Weight Category"
                              value={formData.weightCategory}
                              onChange={(value) => setFormData({...formData, weightCategory: value})}
                              options={weightCategoryOptions}
                            />
                          </div>

                          {/* Storage Instructions - Full Width */}
                          <div className="col-span-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Storage Instructions</label>
                            <textarea
                              rows={2}
                              value={formData.storageInstructions}
                              onChange={(e) => setFormData({...formData, storageInstructions: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                              placeholder="Special storage requirements..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dimensions and Origin Section */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-indigo-600 rounded p-1 mr-2">
                            <CubeIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">Dimensions & Origin</h3>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {/* Dimensions */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Length</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensionLength}
                              onChange={(e) => setFormData({...formData, dimensionLength: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensionWidth}
                              onChange={(e) => setFormData({...formData, dimensionWidth: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensionHeight}
                              onChange={(e) => setFormData({...formData, dimensionHeight: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                          </div>

                          <div className="col-span-1">
                            <CustomDropdown
                              label="Unit"
                              value={formData.dimensionUnit}
                              onChange={(value) => setFormData({...formData, dimensionUnit: value})}
                              options={dimensionUnitOptions}
                            />
                          </div>

                          {/* Origin */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                            <input
                              type="text"
                              value={formData.origin.country}
                              onChange={(e) => setFormData({...formData, origin: {...formData.origin, country: e.target.value}})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="India"
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                            <input
                              type="text"
                              value={formData.origin.state}
                              onChange={(e) => setFormData({...formData, origin: {...formData.origin, state: e.target.value}})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Maharashtra"
                            />
                          </div>

                          {/* City */}
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={formData.origin.city}
                              onChange={(e) => setFormData({...formData, origin: {...formData.origin, city: e.target.value}})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Mumbai"
                            />
                          </div>

                          {/* Certifications */}
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Certifications</label>
                            <div className="grid grid-cols-4 gap-1">
                              {['organic', 'non_gmo', 'gluten_free', 'vegan', 'vegetarian', 'halal', 'kosher', 'fair_trade'].map(cert => (
                                <label key={cert} className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.certifications.includes(cert)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({...formData, certifications: [...formData.certifications, cert]});
                                      } else {
                                        setFormData({...formData, certifications: formData.certifications.filter(c => c !== cert)});
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                  />
                                  <span className="ml-1 text-xs text-gray-700 capitalize">{cert.replace('_', ' ')}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Special Handling */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Special Handling</label>
                            <div className="grid grid-cols-2 gap-1">
                              {['fragile', 'perishable', 'temperature_controlled', 'refrigerated', 'hazardous'].map(handling => (
                                <label key={handling} className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.specialHandling.includes(handling)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({...formData, specialHandling: [...formData.specialHandling, handling]});
                                      } else {
                                        setFormData({...formData, specialHandling: formData.specialHandling.filter(h => h !== handling)});
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                  />
                                  <span className="ml-1 text-xs text-gray-700 capitalize">{handling.replace('_', ' ')}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Allergens */}
                          <div className="col-span-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Allergens (comma separated)</label>
                            <input
                              type="text"
                              value={formData.allergens.join(', ')}
                              onChange={(e) => setFormData({...formData, allergens: e.target.value.split(',').map(allergen => allergen.trim()).filter(allergen => allergen)})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="nuts, dairy, soy, gluten"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nutritional Information */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-orange-600 rounded p-1 mr-2">
                            <CheckCircleIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">Nutritional Info (per 100g)</h3>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.calories}
                            onChange={(e) => setFormData({...formData, calories: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Calories"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.protein}
                            onChange={(e) => setFormData({...formData, protein: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Protein (g)"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.carbohydrates}
                            onChange={(e) => setFormData({...formData, carbohydrates: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Carbs (g)"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.fat}
                            onChange={(e) => setFormData({...formData, fat: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Fat (g)"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.fiber}
                            onChange={(e) => setFormData({...formData, fiber: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Fiber (g)"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.sugar}
                            onChange={(e) => setFormData({...formData, sugar: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Sugar (g)"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.sodium}
                            onChange={(e) => setFormData({...formData, sodium: e.target.value})}
                            className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Sodium (mg)"
                          />
                        </div>
                      </div>

                      {/* Tags and Ingredients */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-indigo-600 rounded p-1 mr-2">
                            <TagIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">Tags & Ingredients</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                            <input
                              type="text"
                              value={formData.tags.join(', ')}
                              onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="organic, fresh, natural"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
                            <input
                              type="text"
                              value={formData.ingredients.join(', ')}
                              onChange={(e) => setFormData({...formData, ingredients: e.target.value.split(',').map(ing => ing.trim()).filter(ing => ing)})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="flour, sugar, salt"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SEO Section */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="bg-green-600 rounded p-1 mr-2">
                            <MagnifyingGlassIcon className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">SEO Information</h3>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">SEO Title</label>
                            <input
                              type="text"
                              value={formData.seoTitle}
                              onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="SEO optimized title"
                              maxLength={60}
                            />
                            <div className="text-xs text-gray-400 mt-0.5">{formData.seoTitle.length}/60</div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">SEO Description</label>
                            <textarea
                              rows={2}
                              value={formData.seoDescription}
                              onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                              className="block w-full px-2 py-1.5 text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                              placeholder="SEO meta description..."
                              maxLength={160}
                            />
                            <div className="text-xs text-gray-400 mt-0.5">{formData.seoDescription.length}/160</div>
                          </div>
                        </div>
                      </div>

                      {/* Submission Note */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                        <div className="flex items-start">
                          <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-xs font-semibold text-blue-900">Approval Process</h4>
                            <p className="text-xs text-blue-700 mt-0.5">
                              Your product will be submitted for approval. Once approved, you can select it and add inventory to start selling.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="bg-white px-8 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    {modalMode === 'add' && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          formData.name && formData.sku && formData.category && formData.subcategory && formData.price && formData.brand && formData.unit && formData.weight && formData.weightUnit && formData.description ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="font-medium text-xs">Required: {
                          formData.name && formData.sku && formData.category && formData.subcategory && formData.price && formData.brand && formData.unit && formData.weight && formData.weightUnit && formData.description ? '100%' : 
                          Math.round(([formData.name, formData.sku, formData.category, formData.subcategory, formData.price, formData.brand, formData.unit, formData.weight, formData.weightUnit, formData.description].filter(Boolean).length / 10) * 100)
                        }%</span>
                        {gstInfo.applicable && (
                          <span className="ml-2 text-blue-600">
                            GST: {gstInfo.rate}% (₹{gstInfo.amount})
                          </span>
                        )}
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
                      disabled={false}
                      className="inline-flex justify-center items-center rounded-md px-5 py-2 bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
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
