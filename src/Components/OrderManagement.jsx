import { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { getOrders, updateOrderStatus, getVendorProfile, getAvailableDeliveryBoys, assignDeliveryBoy, getAllDeliveryTeam } from '../utils/api';
import notificationService from '../utils/notificationService';
import OrderNotificationPopup from './OrderNotificationPopup';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [availableDeliveryBoys, setAvailableDeliveryBoys] = useState([]);
  const [allDeliveryTeam, setAllDeliveryTeam] = useState([]);
  const [showAssignDelivery, setShowAssignDelivery] = useState(false);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');
  const [assigningDelivery, setAssigningDelivery] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const statusDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchVendorProfile();
    setupSSEConnection();
    requestNotificationPermission();

    // Cleanup on unmount
    return () => {
      notificationService.disconnect();
    };
  }, []);

  // Setup SSE connection for real-time updates
  const setupSSEConnection = () => {
    console.log('🔧🔧🔧 SETUP SSE CONNECTION CALLED! 🔧🔧🔧');
    
    // Request notification permission first
    notificationService.requestNotificationPermission();

    // Connect to SSE
    const vendorData = JSON.parse(localStorage.getItem('vendor_user') || '{}');
    console.log('📋 Vendor data from localStorage:', vendorData);
    console.log('📋 Vendor ID:', vendorData._id);
    
    if (vendorData._id) {
      console.log('✅ Vendor ID found, calling notificationService.connect...');
      notificationService.connect(vendorData._id);
    } else {
      console.error('❌ No vendor ID found in localStorage!');
      console.error('❌ localStorage vendor_user:', localStorage.getItem('vendor_user'));
    }

    // Listen for connection status
    const removeConnectedListener = notificationService.addListener('connected', () => {
      setSseConnected(true);
      console.log('✅ Real-time notifications enabled');
    });

    const removeDisconnectedListener = notificationService.addListener('disconnected', () => {
      setSseConnected(false);
      console.log('❌ Real-time notifications disabled');
    });

    // Listen for new orders
    const removeNewOrderListener = notificationService.addListener('new_order', (order) => {
      console.log('🆕 New order notification:', order);
      
      // Add to notification queue
      setNotificationQueue(prev => [...prev, order]);
      
      // Refresh orders list
      fetchOrders(true);
      
      // Show success message
      setSuccessMessage(`New order received! Order #${order.orderNumber || order._id?.slice(-8)}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    });

    // Listen for order updates
    const removeOrderUpdateListener = notificationService.addListener('order_updated', (order) => {
      console.log('🔄 Order updated:', order);
      
      // Refresh orders list
      fetchOrders(true);
    });

    // Store cleanup functions
    return () => {
      removeConnectedListener();
      removeDisconnectedListener();
      removeNewOrderListener();
      removeOrderUpdateListener();
    };
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    const permission = await notificationService.requestNotificationPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
    } else if (permission === 'denied') {
      console.warn('❌ Notification permission denied');
    }
  };

  // Remove notification from queue
  const removeNotification = (orderId) => {
    setNotificationQueue(prev => prev.filter(order => order._id !== orderId));
  };

  // View order from notification
  const viewOrderFromNotification = (order) => {
    // Find the full order in the orders list
    const fullOrder = orders.find(o => o.id === order._id);
    if (fullOrder) {
      setSelectedOrder(fullOrder);
      setShowOrderDetails(true);
    }
    removeNotification(order._id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await getOrders();
      console.log('Orders API Response:', response);
      
      // Handle different response formats
      let ordersData = [];
      
      if (response && response.success && response.data) {
        // Response format: { success: true, data: [...] }
        ordersData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        // Direct array response
        ordersData = response;
      } else if (response && typeof response === 'object') {
        // Check if response itself has order properties
        ordersData = [response];
      }
      
      // Transform orders to match expected format
      const transformedOrders = ordersData.map(order => ({
        id: order._id || order.id,
        orderNumber: order.orderNumber || order.id || 'N/A',
        customer: {
          name: order.customerInfo?.name || order.customer?.name || 'Unknown',
          phone: order.customerInfo?.phone || order.customer?.phone || 'N/A',
          email: order.customerInfo?.email || order.customer?.email || 'N/A'
        },
        items: order.items?.map(item => ({
          name: item.name || 'Unknown Product',
          quantity: item.quantity || 0,
          price: item.price || 0,
          total: item.total || (item.price * item.quantity) || 0,
          image: item.image,
          sku: item.sku,
          status: item.status || 'pending'
        })) || [],
        totalAmount: order.pricing?.total || order.totalAmount || 0,
        status: order.status || 'pending',
        paymentStatus: order.payment?.status || order.paymentStatus || 'pending',
        orderDate: order.createdAt || order.orderDate,
        deliveryDate: order.delivery?.scheduledDate || order.deliveryDate,
        address: order.deliveryAddress?.address 
          ? `${order.deliveryAddress.address}${order.deliveryAddress.city ? ', ' + order.deliveryAddress.city : ''}${order.deliveryAddress.state ? ', ' + order.deliveryAddress.state : ''}${order.deliveryAddress.pincode ? ' - ' + order.deliveryAddress.pincode : ''}`
          : order.address || 'N/A',
        deliveryInstructions: order.specialInstructions || order.deliveryInstructions || '',
        delivery: {
          partner: order.delivery?.deliveryPartner || 'pending',
          deliveryBoy: order.delivery?.deliveryBoy,
          deliveryBoyName: order.delivery?.deliveryBoy?.name || 'Not Assigned',
          deliveryBoyPhone: order.delivery?.deliveryBoy?.phoneNumber || order.delivery?.deliveryBoy?.phone,
          estimatedTime: order.delivery?.estimatedTime,
          trackingNumber: order.delivery?.trackingInfo?.trackingNumber,
          currentLocation: order.delivery?.trackingInfo?.currentLocation,
          deliveredAt: order.delivery?.deliveredAt
        },
        vendors: order.vendors?.map(v => ({
          vendor: v.vendor,
          vendorName: v.vendor?.name || 'Unknown Vendor',
          vendorBusinessName: v.vendor?.vendorInfo?.businessName,
          deliveryModel: v.vendor?.vendorInfo?.deliveryModel,
          items: v.items,
          status: v.status,
          subtotal: v.subtotal
        })) || [],
        rawOrder: order // Keep original order for reference
      }));
      
      console.log('Transformed Orders:', transformedOrders);
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      // Set empty array on error
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVendorProfile = async () => {
    try {
      const response = await getVendorProfile();
      if (response && response.success && response.data) {
        setVendorProfile(response.data);
      }
    } catch (err) {
      console.error('Error fetching vendor profile:', err);
    }
  };

  const fetchAvailableDeliveryBoys = async () => {
    try {
      const response = await getAllDeliveryTeam();
      if (response && response.success && response.data) {
        // Get all delivery team members
        const allTeam = response.data.deliveryBoys || [];
        setAllDeliveryTeam(allTeam);
        
        // Filter only available ones for quick access
        const available = allTeam.filter(db => db.deliveryBoyInfo?.isAvailable !== false && db.isActive);
        setAvailableDeliveryBoys(available);
      }
    } catch (err) {
      console.error('Error fetching delivery boys:', err);
      setAllDeliveryTeam([]);
      setAvailableDeliveryBoys([]);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedDeliveryBoy) {
      setError('Please select a delivery boy');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setAssigningDelivery(true);
      setError(null);
      
      const response = await assignDeliveryBoy(selectedOrder.id, selectedDeliveryBoy);
      
      if (response && response.success) {
        setSuccessMessage('Delivery boy assigned successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Refresh orders and close modal
        await fetchOrders(true);
        setShowAssignDelivery(false);
        setSelectedDeliveryBoy('');
        
        // Update selected order to show new delivery boy
        const updatedOrder = orders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
    } catch (err) {
      console.error('Error assigning delivery boy:', err);
      setError(err.message || 'Failed to assign delivery boy');
      setTimeout(() => setError(null), 5000);
    } finally {
      setAssigningDelivery(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const response = await updateOrderStatus(orderId, newStatus);
      
      if (response && response.success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Show success message
        setSuccessMessage(`Order status updated to ${newStatus} successfully!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Refresh orders from server to get latest data
        fetchOrders(true);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
      setTimeout(() => setError(null), 5000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery':
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'packed':
      case 'processing':
        return <TruckIcon className="h-5 w-5 text-indigo-500" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-teal-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'returned':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-blue-100 text-blue-800',
      shipped: 'bg-blue-100 text-blue-800',
      packed: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-indigo-100 text-indigo-800',
      confirmed: 'bg-teal-100 text-teal-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      shipped: 'Shipped',
      packed: 'Packed',
      processing: 'Processing',
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      returned: 'Returned'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      completed: 'Paid',
      processing: 'Processing',
      pending: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded',
      partially_refunded: 'Partially Refunded'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.id || order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer?.phone || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || order.paymentStatus === filterPayment;
    
    // Date filtering
    let matchesDate = true;
    if (filterDate !== 'all') {
      const orderDate = new Date(order.orderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filterDate) {
        case 'today':
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          matchesDate = orderDate >= today && orderDate <= todayEnd;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59, 999);
          matchesDate = orderDate >= yesterday && orderDate <= yesterdayEnd;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = orderDate >= monthAgo;
          break;
        case 'custom':
          if (customDateRange.startDate && customDateRange.endDate) {
            const startDate = new Date(customDateRange.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customDateRange.endDate);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = orderDate >= startDate && orderDate <= endDate;
          }
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => ['processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    todayRevenue: orders
      .filter(o => {
        const today = new Date().toDateString();
        return new Date(o.orderDate).toDateString() === today && o.status === 'delivered';
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
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
      {/* Order Notification Popups - Stacked */}
      {notificationQueue.map((order, index) => (
        <div 
          key={order._id} 
          style={{ 
            position: 'fixed',
            top: `${80 + (index * 10)}px`,
            right: '16px',
            zIndex: 100 - index
          }}
        >
          <OrderNotificationPopup
            order={order}
            onClose={() => removeNotification(order._id)}
            onView={viewOrderFromNotification}
          />
        </div>
      ))}

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
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
            {/* SSE Connection Status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              sseConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <WifiIcon className={`h-3.5 w-3.5 ${sseConnected ? 'animate-pulse' : ''}`} />
              <span>{sseConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Track and manage your incoming orders {sseConnected && '• Real-time updates enabled'}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <button 
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon 
              className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-3.5 w-3.5 mr-1.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div 
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'pending' 
              ? 'border-yellow-500 shadow-md' 
              : 'border-gray-200 hover:border-yellow-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'confirmed' ? 'all' : 'confirmed')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'confirmed' 
              ? 'border-teal-500 shadow-md' 
              : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-teal-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Confirmed</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.confirmed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'processing' ? 'all' : 'processing')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'processing' 
              ? 'border-blue-500 shadow-md' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <TruckIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.processing}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'delivered' ? 'all' : 'delivered')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'delivered' 
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
                  <dt className="text-xs font-medium text-gray-500 truncate">Delivered</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.delivered}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <BanknotesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Today&apos;s Revenue</dt>
                  <dd className="text-base font-semibold text-gray-900">₹{orderStats.todayRevenue.toLocaleString()}</dd>
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
                placeholder="Search by order ID, customer name or phone..."
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

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-48 relative" ref={statusDropdownRef}>
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <div className="flex items-center">
                <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="truncate">
                  {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  statusDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {statusDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                <div
                  onClick={() => {
                    setFilterStatus('all');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  All Status
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('pending');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'pending' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Pending
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('confirmed');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'confirmed' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Confirmed
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('processing');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'processing' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Processing
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('packed');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'packed' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Packed
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('shipped');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'shipped' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Shipped
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('out_for_delivery');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'out_for_delivery' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Out for Delivery
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('delivered');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'delivered' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Delivered
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('cancelled');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'cancelled' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Cancelled
                </div>
                <div
                  onClick={() => {
                    setFilterStatus('returned');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'returned' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Returned
                </div>
              </div>
            )}
          </div>

          {/* Payment Filter */}
          <div className="w-full sm:w-48">
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="completed">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="w-full sm:w-48 relative" ref={dateDropdownRef}>
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="truncate">
                  {filterDate === 'all' ? 'All Time' : 
                   filterDate === 'today' ? 'Today' :
                   filterDate === 'yesterday' ? 'Yesterday' :
                   filterDate === 'week' ? 'Last 7 Days' :
                   filterDate === 'month' ? 'Last 30 Days' :
                   filterDate === 'custom' ? 'Custom Range' : 'All Time'}
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  dateDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {dateDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-auto">
                <div
                  onClick={() => {
                    setFilterDate('all');
                    setDateDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  All Time
                </div>
                <div
                  onClick={() => {
                    setFilterDate('today');
                    setDateDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'today' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Today
                </div>
                <div
                  onClick={() => {
                    setFilterDate('yesterday');
                    setDateDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'yesterday' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Yesterday
                </div>
                <div
                  onClick={() => {
                    setFilterDate('week');
                    setDateDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'week' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Last 7 Days
                </div>
                <div
                  onClick={() => {
                    setFilterDate('month');
                    setDateDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'month' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Last 30 Days
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <div
                  onClick={() => {
                    setFilterDate('custom');
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterDate === 'custom' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Custom Range
                </div>
                {filterDate === 'custom' && (
                  <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customDateRange.startDate}
                          onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                          className="block w-full rounded border-gray-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customDateRange.endDate}
                          onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                          className="block w-full rounded border-gray-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (customDateRange.startDate && customDateRange.endDate) {
                            setDateDropdownOpen(false);
                          }
                        }}
                        disabled={!customDateRange.startDate || !customDateRange.endDate}
                        className="w-full mt-2 inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPayment('all');
                setFilterDate('all');
                setCustomDateRange({ startDate: '', endDate: '' });
              }}
              className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all' || filterPayment !== 'all'
                      ? 'No orders match your filters'
                      : 'No orders yet. Orders will appear here once customers start placing them.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">#{order.orderNumber || order.id}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <CalendarDaysIcon className="h-3 w-3 mr-1" />
                            {formatDate(order.orderDate)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            {order.customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        <span className="text-xs text-gray-900">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                        >
                          <EyeIcon className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </button>
                        
                        {/* Show Assign Delivery button for self-delivery vendors */}
                        {vendorProfile?.vendorInfo?.deliveryModel === 'self_delivery' && 
                         !order.delivery?.deliveryBoy &&
                         ['packed', 'processing', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={async () => {
                              setSelectedOrder(order);
                              await fetchAvailableDeliveryBoys();
                              setShowAssignDelivery(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-purple-600 border border-purple-700 rounded hover:bg-purple-700"
                          >
                            <UserIcon className="h-3.5 w-3.5 mr-1" />
                            Assign Delivery
                          </button>
                        )}
                        
                        {order.status === 'pending' && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusUpdate(order.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Update Status</option>
                            <option value="confirmed">Confirm Order</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        )}
                        {order.status === 'confirmed' && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusUpdate(order.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Update Status</option>
                            <option value="processing">Start Processing</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        )}
                        {order.status === 'processing' && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusUpdate(order.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Update Status</option>
                            <option value="packed">Mark as Packed</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        )}
                        {order.status === 'packed' && (
                          <div className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded">
                            <TruckIcon className="h-3.5 w-3.5 mr-1" />
                            Waiting for Delivery Pickup
                          </div>
                        )}
                        {order.status === 'shipped' && (
                          <div className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded">
                            <TruckIcon className="h-3.5 w-3.5 mr-1" />
                            In Transit
                          </div>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <div className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded">
                            <TruckIcon className="h-3.5 w-3.5 mr-1" />
                            Out for Delivery
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowOrderDetails(false)}
          ></div>
            
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Order #{selectedOrder.orderNumber || selectedOrder.id}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Placed on {formatDate(selectedOrder.orderDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="bg-gray-50 px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Status</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Order Status</span>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusIcon(selectedOrder.status)}
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Payment Status</span>
                      <div className="mt-1">
                        {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Payment Method</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                          {selectedOrder.rawOrder?.payment?.method 
                            ? selectedOrder.rawOrder.payment.method.toUpperCase()
                            : 'COD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selectedOrder.customer.name}</div>
                        <div className="text-xs text-gray-500">{selectedOrder.customer.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-sm text-gray-900">{selectedOrder.address}</span>
                    </div>
                    {selectedOrder.deliveryInstructions && (
                      <div className="flex items-start">
                        <svg className="h-4 w-4 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                          <div className="text-xs font-medium text-gray-700">Delivery Instructions</div>
                          <div className="text-sm text-gray-600 mt-0.5">{selectedOrder.deliveryInstructions}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center flex-1">
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
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.sku && `SKU: ${item.sku} • `}
                              ₹{item.price} × {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{item.total.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="pt-3 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{selectedOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Delivery Information</h4>
                  <div className="space-y-3">
                    {/* Delivery Partner Type */}
                    <div className="flex items-start">
                      <TruckIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Delivery Partner</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedOrder.delivery?.partner === 'lalaji_network' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 110 2 1 1 0 010-2z" />
                              </svg>
                              Lalaji Network
                            </span>
                          ) : selectedOrder.delivery?.partner === 'vendor_self' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 110 2 1 1 0 010-2z" />
                              </svg>
                              Vendor Self-Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Pending Assignment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Boy Info */}
                    {selectedOrder.delivery?.deliveryBoy && (
                      <div className="flex items-start">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Delivery Person</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedOrder.delivery.deliveryBoyName}
                          </div>
                          {selectedOrder.delivery.deliveryBoyPhone && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              <PhoneIcon className="h-3 w-3 inline mr-1" />
                              {selectedOrder.delivery.deliveryBoyPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Scheduled Delivery */}
                    {selectedOrder.deliveryDate && (
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <div className="text-xs text-gray-500">Scheduled Delivery</div>
                          <div className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.deliveryDate)}</div>
                        </div>
                      </div>
                    )}

                    {/* Tracking Number */}
                    {selectedOrder.delivery?.trackingNumber && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-500">Tracking Number</div>
                          <div className="text-sm font-medium text-gray-900">{selectedOrder.delivery.trackingNumber}</div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Status Message */}
                    {!selectedOrder.delivery?.deliveryBoy && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Delivery Assignment Status</p>
                            <p className="text-xs text-blue-800 mt-1">
                              {selectedOrder.status === 'pending' ? (
                                'Delivery partner will be assigned automatically when you confirm this order.'
                              ) : selectedOrder.status === 'confirmed' ? (
                                'Delivery partner will be assigned when order is marked as packed.'
                              ) : selectedOrder.delivery?.partner === 'lalaji_network' ? (
                                'Lalaji Network delivery partner will be assigned automatically based on location.'
                              ) : selectedOrder.delivery?.partner === 'vendor_self' ? (
                                'Assign a delivery person from your team to handle this delivery.'
                              ) : (
                                'Delivery partner assignment in progress...'
                              )}
                            </p>
                            {/* Show Assign Button for Self-Delivery Vendors */}
                            {vendorProfile?.vendorInfo?.deliveryModel === 'self_delivery' && 
                             selectedOrder.delivery?.partner === 'vendor_self' &&
                             ['packed', 'processing', 'confirmed'].includes(selectedOrder.status) && (
                              <button
                                onClick={async () => {
                                  await fetchAvailableDeliveryBoys();
                                  setShowAssignDelivery(true);
                                }}
                                className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                              >
                                <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                                Assign Delivery Person
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Boy Assignment Success */}
                    {selectedOrder.delivery?.deliveryBoy && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">Delivery Partner Assigned</p>
                            <p className="text-xs text-green-800 mt-1">
                              {selectedOrder.delivery.partner === 'lalaji_network' 
                                ? 'Order assigned to Lalaji Network delivery partner for efficient delivery.'
                                : 'Order assigned to your self-delivery team member.'}
                              {selectedOrder.status === 'packed' && (
                                <span className="block mt-1 font-medium">
                                  📦 Order is ready for pickup. Delivery partner will update status from here.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Info for orders after packed status */}
                    {['shipped', 'out_for_delivery', 'delivered'].includes(selectedOrder.status) && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Delivery in Progress</p>
                            <p className="text-xs text-blue-800 mt-1">
                              The delivery partner is managing this order. Status updates will be handled by the delivery team.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Information */}
                {selectedOrder.vendors && selectedOrder.vendors.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Vendor Information</h4>
                    <div className="space-y-2">
                      {selectedOrder.vendors.map((vendor, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vendor.vendorBusinessName || vendor.vendorName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Delivery Model: {vendor.deliveryModel === 'self_delivery' ? (
                                  <span className="text-purple-600 font-medium">Self-Delivery</span>
                                ) : vendor.deliveryModel === 'lalaji_network' ? (
                                  <span className="text-blue-600 font-medium">Lalaji Network</span>
                                ) : (
                                  <span className="text-gray-600">Not Set</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Status</div>
                              <div className="text-sm font-medium">
                                {vendor.status ? (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    vendor.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    vendor.status === 'packed' ? 'bg-blue-100 text-blue-800' :
                                    vendor.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                  </span>
                                ) : 'Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                <div>
                  {selectedOrder.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'confirmed');
                          setShowOrderDetails(false);
                        }}
                        className="inline-flex items-center rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                        Confirm Order
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'cancelled');
                          setShowOrderDetails(false);
                        }}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        <XCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                        Cancel Order
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'processing');
                          setShowOrderDetails(false);
                        }}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <TruckIcon className="h-3.5 w-3.5 mr-1.5" />
                        Start Processing
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'cancelled');
                          setShowOrderDetails(false);
                        }}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        <XCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                        Cancel Order
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedOrder.id, 'packed');
                        setShowOrderDetails(false);
                      }}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                      Mark as Packed
                    </button>
                  )}
                  {selectedOrder.status === 'packed' && (
                    <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg">
                      <TruckIcon className="h-3.5 w-3.5 mr-1.5" />
                      Order Packed - Waiting for Delivery Boy Pickup
                    </div>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg">
                      <TruckIcon className="h-3.5 w-3.5 mr-1.5" />
                      Order in Transit - Delivery Boy Managing
                    </div>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && (
                    <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <TruckIcon className="h-3.5 w-3.5 mr-1.5" />
                      Out for Delivery - Delivery Boy Managing
                    </div>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                      Order Delivered Successfully
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

      )}
      {showAssignDelivery && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={() => setShowAssignDelivery(false)}
              aria-hidden="true"
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full z-10">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Assign Delivery Person
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select a delivery person from your team for Order #{selectedOrder.orderNumber || selectedOrder.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignDelivery(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="bg-gray-50 px-6 py-4 max-h-[60vh] overflow-y-auto">
                {allDeliveryTeam.length === 0 ? (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">No delivery persons in your team</p>
                    <p className="text-xs text-gray-500">
                      Please add delivery persons to your team first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Delivery Person ({allDeliveryTeam.length} team members)
                      </label>
                      <div className="flex gap-2 text-xs">
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Available
                        </span>
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                          Busy
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {allDeliveryTeam.map((deliveryBoy) => {
                        const isAvailable = deliveryBoy.deliveryBoyInfo?.isAvailable !== false && deliveryBoy.isActive;
                        const isCurrentlyAssigned = deliveryBoy.deliveryBoyInfo?.currentOrderId;
                        const canSelect = isAvailable && !isCurrentlyAssigned;
                        
                        return (
                          <div
                            key={deliveryBoy._id}
                            onClick={() => canSelect && setSelectedDeliveryBoy(deliveryBoy._id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              selectedDeliveryBoy === deliveryBoy._id
                                ? 'border-purple-500 bg-purple-50'
                                : canSelect
                                ? 'border-gray-200 bg-white hover:border-purple-300 cursor-pointer'
                                : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                  selectedDeliveryBoy === deliveryBoy._id
                                    ? 'bg-purple-600'
                                    : isAvailable
                                    ? 'bg-green-100'
                                    : 'bg-gray-300'
                                }`}>
                                  <UserIcon className={`h-5 w-5 ${
                                    selectedDeliveryBoy === deliveryBoy._id
                                      ? 'text-white'
                                      : isAvailable
                                      ? 'text-green-600'
                                      : 'text-gray-600'
                                  }`} />
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      {deliveryBoy.name}
                                    </p>
                                    {/* Status Indicator */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isAvailable 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                        isAvailable ? 'bg-green-500' : 'bg-red-500'
                                      }`}></span>
                                      {isAvailable ? 'Available' : 'Busy'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <PhoneIcon className="h-3 w-3 mr-1" />
                                    {deliveryBoy.phoneNumber}
                                  </p>
                                  {deliveryBoy.deliveryBoyInfo?.vehicleType && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      🛵 {deliveryBoy.deliveryBoyInfo.vehicleType}
                                      {deliveryBoy.deliveryBoyInfo.vehicleNumber && 
                                        ` - ${deliveryBoy.deliveryBoyInfo.vehicleNumber}`}
                                    </p>
                                  )}
                                  {/* Show current assignment if busy */}
                                  {isCurrentlyAssigned && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                      <p className="text-yellow-800 font-medium flex items-center">
                                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Currently delivering order
                                      </p>
                                      <p className="text-yellow-700 mt-0.5">
                                        Order ID: #{isCurrentlyAssigned.toString().slice(-8)}
                                      </p>
                                    </div>
                                  )}
                                  {!deliveryBoy.isActive && (
                                    <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-xs">
                                      <p className="text-gray-600">
                                        ⚠️ Account inactive
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {selectedDeliveryBoy === deliveryBoy._id && canSelect && (
                                <CheckCircleIcon className="h-6 w-6 text-purple-600 shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Summary at bottom */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900 flex items-center">
                        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {availableDeliveryBoys.length} of {allDeliveryTeam.length} delivery persons are available for assignment
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => setShowAssignDelivery(false)}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={assigningDelivery}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDelivery}
                  disabled={!selectedDeliveryBoy || assigningDelivery || allDeliveryTeam.length === 0}
                  className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigningDelivery ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                      Assign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
