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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getVendorProducts, createBill, getBills } from '../utils/api';
import { printBill } from './PrintBill';

const BillingManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'history'

  useEffect(() => {
    // Check URL params for tab
    const tabParam = searchParams.get('tab');
    if (tabParam === 'history') {
      setActiveTab('history');
    } else if (tabParam === 'new') {
      setActiveTab('billing');
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        </div>
      </div>

      {activeTab === 'billing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Side - Product Selection */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-xs font-medium text-gray-900 mb-2">Available Products ({filteredProducts.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => (
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
                ))}
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
                <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Discount</label>
                <div className="flex gap-1.5">
                  <select
                    value={discount.type}
                    onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="none">None</option>
                    <option value="percentage">%</option>
                    <option value="fixed">₹</option>
                  </select>
                  {discount.type !== 'none' && (
                    <input
                      type="number"
                      value={discount.value}
                      onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                      placeholder="Value"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-gray-200 pt-2 mb-2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (e.target.value === 'split' && splitPayments.length === 0) {
                      setSplitPayments([{ method: 'cash', amount: 0 }]);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                  <option value="split">Split Payment</option>
                </select>
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
                        <select
                          value={payment.method}
                          onChange={(e) => updateSplitPayment(index, 'method', e.target.value)}
                          className="flex-1 px-1.5 py-1 text-[10px] border border-gray-300 rounded"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                          <option value="online">Online</option>
                        </select>
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
      ) : (
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
      )}
    </div>
  );
};

export default BillingManagement;
