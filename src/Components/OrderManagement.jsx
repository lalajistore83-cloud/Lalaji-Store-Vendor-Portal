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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getOrders, updateOrderStatus } from '../utils/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
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
          sku: item.sku
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
        deliveryBoy: order.delivery?.deliveryBoy,
        vendors: order.vendors,
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
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    todayRevenue: orders
      .filter(o => {
        const today = new Date().toDateString();
        return new Date(o.orderDate).toDateString() === today && o.status === 'completed';
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
          <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Track and manage your incoming orders
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
                  <dt className="text-xs font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.pending}</dd>
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
                  <dt className="text-xs font-medium text-gray-500 truncate">Processing</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.processing}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'completed' 
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
                  <dt className="text-xs font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-base font-semibold text-gray-900">{orderStats.completed}</dd>
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
                    setFilterStatus('completed');
                    setStatusDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    filterStatus === 'completed' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Completed
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
              <option value="paid">Paid</option>
              <option value="pending">Payment Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterStatus !== 'all' || filterPayment !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPayment('all');
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
                      <div className="flex justify-center gap-2">
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
                            <option value="processing">Start Processing</option>
                            <option value="completed">Mark Complete</option>
                            <option value="cancelled">Cancel</option>
                          </select>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setShowOrderDetails(false)}
            ></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
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
                  <div className="grid grid-cols-2 gap-4">
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
                {selectedOrder.deliveryDate && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Delivery Information</h4>
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-xs text-gray-500">Scheduled Delivery</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.deliveryDate)}</div>
                      </div>
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
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
