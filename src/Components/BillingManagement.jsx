import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  PrinterIcon,
  DocumentTextIcon,
  XMarkIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  UserIcon,
  PhoneIcon,
  ReceiptPercentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { getVendorProducts, createBill, getBills } from '../utils/api';
import { printBill } from './PrintBill';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Box, Paper, Grid } from '@mui/material';

// Chart color palette
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder = "Select...", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs text-left hover:bg-blue-50 transition-colors ${
                  value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const BillingManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [discount, setDiscount] = useState({ type: 'none', value: 0 });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitPayments, setSplitPayments] = useState([
    { method: 'cash', amount: 0 }
  ]);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [showBillHistory, setShowBillHistory] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'history' or 'analytics'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");


  useEffect(() => {
    // Check URL params for tab
    const tabParam = searchParams.get('tab');
    if (tabParam === 'history') {
      setActiveTab('history');
    } else if (tabParam === 'new') {
      setActiveTab('billing');
    } else if (tabParam === 'analytics') {
      setActiveTab('analytics');
      calculateAnalytics();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch both Lalaji and own products
      const [lalajiResponse, ownResponse] = await Promise.all([
        getVendorProducts({ sourceFilter: 'selected' }),
        getVendorProducts({ sourceFilter: 'own' })
      ]);
    console.log('Lalaji Products Response:', lalajiResponse);
      const lalajiData = Array.isArray(lalajiResponse) ? lalajiResponse : (lalajiResponse.success ? lalajiResponse.data : []);
      const ownData = Array.isArray(ownResponse) ? ownResponse : (ownResponse.success ? ownResponse.data : []);

      const allProducts = [...lalajiData, ...ownData].map(vp => {
        // Calculate price with GST
        let finalPrice = 0;
        
        if (vp.pricing?.sellingPrice) {
          // Use vendor's selling price if available
          finalPrice = vp.pricing.sellingPrice;
        } else if (vp.product?.pricing?.breakdown?.totalAmount) {
          // Use product's total amount (base price + GST)
          finalPrice = Math.round(vp.product.pricing.breakdown.totalAmount);
        } else if (vp.product?.pricing?.basePrice) {
          // Calculate: base price + GST
          const basePrice = vp.product.pricing.basePrice;
          const gstAmount = vp.product.pricing.gst?.amount || 0;
          finalPrice = Math.round(basePrice + gstAmount);
        } else if (vp.customProduct?.basePrice) {
          // For custom products, use base price
          finalPrice = vp.customProduct.basePrice;
        }

        return {
          vendorProductId: vp._id,
          productId: vp.product?._id,
          name: vp.product?.name || vp.customProduct?.name || 'Unknown Product',
          sku: vp.product?.sku || vp.customProduct?.sku || 'N/A',
          price: finalPrice,
          basePrice: vp.product?.pricing?.basePrice || vp.customProduct?.basePrice || 0,
          gstAmount: vp.product?.pricing?.gst?.amount || 0,
          gstRate: vp.product?.pricing?.gst?.rate || 0,
          currentStock: vp.inventory?.stock || 0,
          image: vp.product?.images?.[0]?.url || vp.customProduct?.images?.[0]?.url || '',
          category: vp.product?.category?.name || vp.customProduct?.category || 'Uncategorized',
          isOwnProduct: !vp.product,
          weight: vp.product?.weight?.value || vp.customProduct?.weight || 0,
          unit: vp.product?.weight?.unit || vp.customProduct?.unit || 'unit'
        };
      }).filter(p => p.currentStock > 0 && p.price > 0); // Only show in-stock items with valid price

      setProducts(allProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await getBills();
      if (response.success) {
        setBills(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
    }
  };

  const calculateAnalytics = () => {
    setAnalyticsLoading(true);
    
    try {
      // Total revenue and bills
      const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
      const totalBills = bills.length;
      const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

      // Total items sold
      const totalItemsSold = bills.reduce((sum, bill) => 
        sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );

      // Payment method breakdown
      const paymentMethods = {};
      bills.forEach(bill => {
        const method = bill.paymentMethod;
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, revenue: 0 };
        }
        paymentMethods[method].count++;
        paymentMethods[method].revenue += bill.total;
      });

      // Product sales analysis
      const productSales = {};
      bills.forEach(bill => {
        bill.items.forEach(item => {
          const key = item.vendorProductId || item.productName;
          if (!productSales[key]) {
            productSales[key] = {
              name: item.productName,
              sku: item.sku,
              quantitySold: 0,
              revenue: 0,
              timesOrdered: 0
            };
          }
          productSales[key].quantitySold += item.quantity;
          productSales[key].revenue += item.total;
          productSales[key].timesOrdered++;
        });
      });

      // Sort products by revenue
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Discount analysis
      const totalDiscount = bills.reduce((sum, bill) => sum + (bill.discount?.amount || 0), 0);
      const billsWithDiscount = bills.filter(bill => bill.discount?.amount > 0).length;

      // Time-based analysis
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayBills = bills.filter(bill => new Date(bill.createdAt) >= today);
      const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - 7);
      const weekBills = bills.filter(bill => new Date(bill.createdAt) >= thisWeekStart);
      const weekRevenue = weekBills.reduce((sum, bill) => sum + bill.total, 0);

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthBills = bills.filter(bill => new Date(bill.createdAt) >= thisMonthStart);
      const monthRevenue = monthBills.reduce((sum, bill) => sum + bill.total, 0);

      // Daily sales chart data (last 7 days)
      const dailySales = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const dayBills = bills.filter(bill => {
          const billDate = new Date(bill.createdAt);
          return billDate >= date && billDate < nextDate;
        });
        
        dailySales.push({
          date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          revenue: dayBills.reduce((sum, bill) => sum + bill.total, 0),
          bills: dayBills.length
        });
      }

      // Customer analysis
      const customerData = {};
      bills.forEach(bill => {
        const phone = bill.customer.phone || 'walk-in';
        if (!customerData[phone]) {
          customerData[phone] = {
            name: bill.customer.name,
            phone: bill.customer.phone,
            totalOrders: 0,
            totalSpent: 0
          };
        }
        customerData[phone].totalOrders++;
        customerData[phone].totalSpent += bill.total;
      });

      const topCustomers = Object.values(customerData)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      setAnalyticsData({
        overview: {
          totalRevenue,
          totalBills,
          averageBillValue,
          totalItemsSold,
          totalDiscount,
          billsWithDiscount
        },
        timeBased: {
          todayRevenue,
          todayBills: todayBills.length,
          weekRevenue,
          weekBills: weekBills.length,
          monthRevenue,
          monthBills: monthBills.length
        },
        paymentMethods,
        topProducts,
        dailySales,
        topCustomers
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
      setError('Failed to calculate analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.vendorProductId === product.vendorProductId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        setError(`Only ${product.currentStock} units available in stock`);
        return;
      }
      setCart(cart.map(item =>
        item.vendorProductId === product.vendorProductId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setError(null);
  };

  const updateQuantity = (vendorProductId, newQuantity) => {
    const product = cart.find(item => item.vendorProductId === vendorProductId);
    
    if (newQuantity > product.currentStock) {
      setError(`Only ${product.currentStock} units available`);
      return;
    }
    
    if (newQuantity <= 0) {
      removeFromCart(vendorProductId);
      return;
    }

    setCart(cart.map(item =>
      item.vendorProductId === vendorProductId
        ? { ...item, quantity: newQuantity }
        : item
    ));
    setError(null);
  };

  const removeFromCart = (vendorProductId) => {
    setCart(cart.filter(item => item.vendorProductId !== vendorProductId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', email: '' });
    setDiscount({ type: 'none', value: 0 });
    setPaymentMethod('cash');
    setSplitPayments([{ method: 'cash', amount: 0 }]);
  };

  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: 0 }]);
  };

  const removeSplitPayment = (index) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const updateSplitPayment = (index, field, value) => {
    const updated = [...splitPayments];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setSplitPayments(updated);
  };

  const calculateSplitTotal = () => {
    return splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getRemainingAmount = () => {
    const total = calculateTotal();
    const paid = calculateSplitTotal();
    return Math.max(0, total - paid);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      return Math.min(discount.value, subtotal);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleGenerateBill = async () => {
    try {
      setProcessing(true);
      setError(null);

      if (cart.length === 0) {
        setError('Please add items to cart');
        return;
      }

      if (!customerInfo.name) {
        setError('Please enter customer name');
        return;
      }

      // Validate split payments
      if (paymentMethod === 'split') {
        const splitTotal = calculateSplitTotal();
        const billTotal = calculateTotal();
        
        if (Math.abs(splitTotal - billTotal) > 0.01) {
          setError(`Split payments (₹${splitTotal}) must equal bill total (₹${billTotal})`);
          return;
        }
        
        // Check if all split payments have valid amounts
        if (splitPayments.some(p => !p.amount || p.amount <= 0)) {
          setError('All split payment amounts must be greater than 0');
          return;
        }
      }

      const billData = {
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || undefined
        },
        items: cart.map(item => ({
          vendorProductId: item.vendorProductId,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: calculateSubtotal(),
        discount: {
          type: discount.type,
          value: discount.value,
          amount: calculateDiscount()
        },
        total: calculateTotal(),
        paymentMethod: paymentMethod,
        splitPayments: paymentMethod === 'split' ? splitPayments : undefined,
        paymentStatus: 'paid'
      };

      const response = await createBill(billData);

      if (response.success) {
        setSuccessMessage(`Bill #${response.data.billNumber} generated successfully!`);
        clearCart();
        fetchProducts(); // Refresh to update stock
        fetchBills(); // Refresh bill history
        
        // Auto-print if needed
        if (window.confirm('Bill generated! Do you want to print it?')) {
          printBill(response.data);
        }
      } else {
        setError(response.message || 'Failed to generate bill');
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      setError(err.message || 'Failed to generate bill');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(p => p.category))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
              <div className="text-xs text-green-700">{successMessage}</div>
              <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="rounded-lg bg-red-50 p-3 border border-red-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-2" />
              <div className="text-xs text-red-700">{error}</div>
              <button onClick={() => setError(null)} className="ml-auto text-red-600">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Billing & POS</h1>
          <p className="mt-0.5 text-xs text-gray-500">Generate bills for walk-in customers</p>
        </div>
        <div className="mt-2 sm:mt-0 flex space-x-2">
          <button
            onClick={() => {
              setActiveTab('billing');
              setSearchParams({ tab: 'new' });
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              activeTab === 'billing'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ShoppingCartIcon className="h-3 w-3 inline mr-1" />
            New Bill
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSearchParams({ tab: 'history' });
              fetchBills();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <DocumentTextIcon className="h-3 w-3 inline mr-1" />
            Bill History
          </button>
          <button
            onClick={() => {
              setActiveTab('analytics');
              setSearchParams({ tab: 'analytics' });
              calculateAnalytics();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChartBarIcon className="h-3 w-3 inline mr-1" />
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'billing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Side - Product Selection */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <CustomDropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories.map(cat => ({
                      value: cat,
                      label: cat === 'all' ? 'All Categories' : cat
                    }))}
                    placeholder="Select Category"
                  />
                </div>
              </div>
              
              {/* Active Filters Display */}
              {(searchTerm || selectedCategory !== 'all') && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                  <span className="text-[10px] text-gray-500">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="hover:text-blue-900"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px]">
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="hover:text-green-900"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="text-[10px] text-gray-500 hover:text-gray-700 underline ml-auto"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-xs font-medium text-gray-900 mb-2">
                Available Products ({filteredProducts.length})
                {selectedCategory !== 'all' && (
                  <span className="text-gray-500 font-normal"> in {selectedCategory}</span>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-sm text-gray-500">No products found</p>
                    {(searchTerm || selectedCategory !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                  <div
                    key={product.vendorProductId}
                    onClick={() => addToCart(product)}
                    className="border border-gray-200 rounded-lg p-2 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-[10px] text-gray-500">{product.sku} • Stock: {product.currentStock}</p>
                        <div className="mt-0.5">
                          <p className="text-xs font-semibold text-blue-600">₹{product.price}</p>
                          {product.gstRate > 0 && (
                            <p className="text-[10px] text-gray-400">
                              (₹{product.basePrice} + {product.gstRate}% GST)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Cart & Billing */}
          <div className="space-y-3">
            {/* Customer Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-xs font-medium text-gray-900 mb-2">Customer Info</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Name *"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Phone (Optional)"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-gray-900">Cart ({cart.length})</h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[10px] text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto mb-3">
                {cart.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.vendorProductId} className="border border-gray-200 rounded-lg p-1.5">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900">{item.name}</h4>
                          <p className="text-[10px] text-gray-500">₹{item.price} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.vendorProductId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.vendorProductId, item.quantity - 1)}
                          className="p-0.5 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.vendorProductId, parseInt(e.target.value) || 0)}
                          className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-xs"
                        />
                        <button
                          onClick={() => updateQuantity(item.vendorProductId, item.quantity + 1)}
                          className="p-0.5 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                        <span className="ml-auto text-xs font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount */}
              <div className="border-t border-gray-200 pt-2 mb-2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1.5">              
                     Discount
                </label>
                            
                <div className="flex gap-1.5">
                  <CustomDropdown
                    value={discount.type}              
                    onChange={(value) => {
                    setDiscount({ ...discount, type: value });
                    setDiscountError("");
                  }}
                  options={[
                    { value: "none", label: "None" },
                    { value: "percentage", label: "%" },
                    { value: "fixed", label: "₹" }
                  ]}
                  className="w-24"
                  />
              
                  {discount.type !== "none" && (
                    <div className="flex-1 flex flex-col">
                      {/* INPUT */}
                      <input
                        type="number"
                        value={discount.value}
                        onFocus={(e) => {
                          if (e.target.value === "0") {
                            setDiscount({ ...discount, value: "" });
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "" || e.target.value === null) {
                            setDiscount({ ...discount, value: 0 });
                          }
                        }}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                        
                          if (rawVal === "") {
                            setDiscount({ ...discount, value: "" });
                            return;
                          }
                        
                          const val = Number(rawVal);
                        
                          if (val < 0) {
                            setDiscountError("You cannot enter negative values.");
                            setDiscount({ ...discount, value: 0 });
                            return;
                          }
                        
                          if (discount.type === "percentage" && val > 100) {
                            setDiscountError("You cannot put discount over 100%.");
                            setDiscount({ ...discount, value: 100 });
                            return;
                          }
                        
                          // ✅ valid
                          setDiscountError("");
                          setDiscount({ ...discount, value: val });
                        }}
                        placeholder="Discount Value"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          discountError ? "border-red-500" : "border-gray-300"
                        }`}
                      />
              
                      {discountError && (
                        <p className="text-red-500 text-[10px] mt-1">
                          {discountError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-gray-200 pt-2 mb-2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Payment Method</label>
                <CustomDropdown
                  value={paymentMethod}
                  onChange={(value) => {
                    setPaymentMethod(value);
                    if (value === 'split' && splitPayments.length === 0) {
                      setSplitPayments([{ method: 'cash', amount: 0 }]);
                    }
                  }}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'card', label: 'Card' },
                    { value: 'upi', label: 'UPI' },
                    { value: 'online', label: 'Online' },
                    { value: 'split', label: 'Split Payment' }
                  ]}
                />
              </div>

              {/* Split Payment Details */}
              {paymentMethod === 'split' && (
                <div className="border-t border-gray-200 pt-2 mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-medium text-gray-700">Split Payments</label>
                    <button
                      onClick={addSplitPayment}
                      className="text-[10px] text-blue-600 hover:text-blue-700"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {splitPayments.map((payment, index) => (
                      <div key={index} className="flex gap-1.5 items-center">
                        <CustomDropdown
                          value={payment.method}
                          onChange={(value) => updateSplitPayment(index, 'method', value)}
                          options={[
                            { value: 'cash', label: 'Cash' },
                            { value: 'card', label: 'Card' },
                            { value: 'upi', label: 'UPI' },
                            { value: 'online', label: 'Online' }
                          ]}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={payment.amount || ''}
                          onChange={(e) => updateSplitPayment(index, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="flex-1 px-1.5 py-1 text-[10px] border border-gray-300 rounded"
                        />
                        {splitPayments.length > 1 && (
                          <button
                            onClick={() => removeSplitPayment(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px]">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className={`font-medium ${Math.abs(calculateSplitTotal() - calculateTotal()) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{calculateSplitTotal()}
                    </span>
                  </div>
                  {getRemainingAmount() > 0 && (
                    <div className="mt-0.5 flex justify-between text-[10px]">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-orange-600">₹{getRemainingAmount()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal()}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">-₹{calculateDiscount()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1.5">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{calculateTotal()}</span>
                </div>
              </div>

              {/* Generate Bill Button */}
              <button
                onClick={handleGenerateBill}
                disabled={processing || cart.length === 0}
                className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-4 w-4" />
                    Generate Bill
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* Bill History Tab */
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-900">Recent Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Bill No.</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-3 py-6 text-center text-xs text-gray-500">
                      No bills generated yet
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">#{bill.billNumber}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        <div>{bill.customer.name}</div>
                        <div className="text-[10px] text-gray-500">{bill.customer.phone}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{bill.items.length} items</td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900">₹{bill.total}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {bill.paymentMethod === 'split' ? (
                          <div>
                            <span className="font-medium capitalize">Split</span>
                            {bill.splitPayments && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {bill.splitPayments.map((p, i) => (
                                  <div key={i}>{p.method}: ₹{p.amount}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="capitalize">{bill.paymentMethod}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => printBill(bill)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Print Bill"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        /* Analytics Tab */
        analyticsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : analyticsData ? (
          <div className="space-y-3">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Total Revenue</p>
                    <p className="text-lg font-bold text-gray-900">₹{analyticsData.overview.totalRevenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{analyticsData.overview.totalBills} bills</p>
                  </div>
                  <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Avg Bill Value</p>
                    <p className="text-lg font-bold text-gray-900">₹{analyticsData.overview.averageBillValue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{analyticsData.overview.totalItemsSold} items sold</p>
                  </div>
                  <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Today's Revenue</p>
                    <p className="text-lg font-bold text-gray-900">₹{analyticsData.timeBased.todayRevenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{analyticsData.timeBased.todayBills} bills</p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Total Discount</p>
                    <p className="text-lg font-bold text-gray-900">₹{analyticsData.overview.totalDiscount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{analyticsData.overview.billsWithDiscount} bills</p>
                  </div>
                  <ReceiptPercentIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Time Period Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-3">
                <h3 className="text-xs font-medium text-blue-900 mb-2">This Week</h3>
                <p className="text-xl font-bold text-blue-900">₹{analyticsData.timeBased.weekRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-blue-700 mt-0.5">{analyticsData.timeBased.weekBills} bills</p>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-3">
                <h3 className="text-xs font-medium text-green-900 mb-2">This Month</h3>
                <p className="text-xl font-bold text-green-900">₹{analyticsData.timeBased.monthRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-green-700 mt-0.5">{analyticsData.timeBased.monthBills} bills</p>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3">
                <h3 className="text-xs font-medium text-purple-900 mb-2">All Time</h3>
                <p className="text-xl font-bold text-purple-900">₹{analyticsData.overview.totalRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-purple-700 mt-0.5">{analyticsData.overview.totalBills} bills</p>
              </div>
            </div>

            {/* Advanced Charts Grid - 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Trend Chart - Area Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analyticsData.dailySales}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bills Count Chart - Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Bills Generated (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analyticsData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [value, 'Bills']}
                  />
                  <Bar dataKey="bills" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Distribution - Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={Object.entries(analyticsData.paymentMethods).map(([method, data]) => ({
                      name: method.charAt(0).toUpperCase() + method.slice(1),
                      value: data.revenue,
                      count: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analyticsData.paymentMethods).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value, name, props) => [`₹${value.toFixed(2)} (${props.payload.count} bills)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue vs Bills Comparison - Dual Axis Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue vs Bills Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analyticsData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue (₹)" dot={{ fill: '#3B82F6', r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="bills" stroke="#10B981" strokeWidth={2} name="Bills Count" dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products Performance - Horizontal Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 10 Products by Revenue</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={analyticsData.topProducts} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#6B7280" width={115} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`₹${value.toFixed(2)}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Revenue (₹)" />
                  <Bar dataKey="quantitySold" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Performance Radar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 5 Products Performance</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={analyticsData.topProducts.slice(0, 5).map(p => ({
                  product: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
                  revenue: p.revenue,
                  quantity: p.quantitySold,
                  orders: p.timesOrdered * 10 // Scale for visibility
                }))}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="product" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar name="Revenue" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Radar name="Quantity" dataKey="quantity" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Radar name="Orders (x10)" dataKey="orders" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-xs font-medium text-gray-900 mb-3">Top Customers</h3>
              <div className="space-y-2">
                {analyticsData.topCustomers.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No customer data yet</p>
                ) : (
                  analyticsData.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{customer.name}</p>
                          <p className="text-[10px] text-gray-500">{customer.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xs font-semibold text-gray-900">₹{customer.totalSpent.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500">{customer.totalOrders} orders</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No analytics data available</p>
            <p className="text-xs text-gray-400 mt-1">Generate some bills to see analytics</p>
          </div>
        )
      ) : null}
    </div>
  );
};

export default BillingManagement;
