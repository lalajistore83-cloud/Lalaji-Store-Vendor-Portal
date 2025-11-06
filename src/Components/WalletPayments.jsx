import { useState, useEffect } from 'react';
import {
  WalletIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getEarnings, getPayouts, getPayoutAnalytics, getPayoutDetails, requestPayout } from '../utils/api';

const WalletPayments = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [payouts, setPayouts] = useState([]); // Ensure it's always an array
  const [payoutAnalytics, setPayoutAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAllData();
  }, [currentPage, filterStatus, searchTerm, dateFilter, startDate, endDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEarnings(),
        fetchPayouts(),
        fetchPayoutAnalytics()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const data = await getEarnings();
      console.log('Earnings data fetched:', data);
      
      // Map API response to component state structure
      const mappedData = {
        availableBalance: data?.data?.pending?.amount || 0,
        pendingBalance: data?.data?.today?.potentialEarnings || 0,
        totalEarnings: data?.data?.lifetime?.totalEarnings || 0,
        thisMonthEarnings: data?.data?.thisMonth?.earnings || 0
      };
      
      setEarningsData(mappedData);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      // Set empty/zero data when API fails
      setEarningsData({
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0
      });
    }
  };

  const fetchPayouts = async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      // Add date filtering params
      if (dateFilter && dateFilter !== 'all') {
        params.period = dateFilter;
      }
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const data = await getPayouts(params);
      console.log('Payouts data fetched:', data);
      
      // Extract payouts array from API response (data.data.payouts)
      const payoutsData = data?.data?.payouts || [];
      
      // Map API response to match component structure
      const mappedPayouts = payoutsData.map(payout => ({
        _id: payout._id,
        amount: payout.totalAmount || payout.summary?.vendorEarning || 0,
        status: payout.payment?.status || payout.status || 'pending',
        requestDate: payout.createdAt,
        completedDate: payout.payment?.processedAt || payout.processedAt,
        processedAt: payout.processedAt,
        method: payout.payment?.method === 'bank_transfer' ? 'Bank Transfer' : 'Bank Transfer',
        accountDetails: 'Account on file',
        transactionId: payout.payment?.transactionId,
        processedBy: payout.payment?.processedBy?.name,
        orders: payout.orders || [],
        summary: payout.summary,
        period: payout.period,
        totalOrders: payout.totalOrders,
        notes: payout.notes
      }));
      
      setPayouts(mappedPayouts);
      setTotalPages(data?.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Error fetching payouts:', err);
      // Set empty array when API fails - no dummy data
      setPayouts([]);
      setTotalPages(1);
    }
  };

  const fetchPayoutAnalytics = async () => {
    try {
      const data = await getPayouts(); // Using getPayouts as it includes summary
      
      // Map API summary to analytics structure (from data.data.summary)
      const summary = data?.data?.summary;
      const mappedAnalytics = {
        totalPayouts: summary?.totalPayouts || 0,
        totalPayoutAmount: summary?.totalEarnings || summary?.completedAmount || 0,
        averagePayoutAmount: summary?.totalPayouts > 0 
          ? (summary?.totalEarnings / summary?.totalPayouts) 
          : 0,
        pendingPayouts: summary?.pendingAmount || 0,
        totalCommission: summary?.totalCommission || 0,
        totalOrders: summary?.totalOrders || 0
      };
      
      setPayoutAnalytics(mappedAnalytics);
    } catch (err) {
      console.error('Error fetching payout analytics:', err);
      // Set empty/zero data when API fails
      setPayoutAnalytics({
        totalPayouts: 0,
        totalPayoutAmount: 0,
        averagePayoutAmount: 0,
        pendingPayouts: 0,
        totalCommission: 0,
        totalOrders: 0
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    setSuccessMessage('Data refreshed successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleViewDetails = async (payoutId) => {
    try {
      setLoading(true);
      const response = await getPayoutDetails(payoutId);
      console.log('Payout details fetched:', response);
      
      // Extract payout from API response (data.payout structure)
      const payoutData = response?.data?.payout || response?.payout;
      
      if (payoutData) {
        // Map API response to match component structure
        const mappedPayout = {
          _id: payoutData._id,
          amount: payoutData.summary?.vendorEarning || payoutData.totalAmount || 0,
          status: payoutData.payment?.status || 'pending',
          requestDate: payoutData.createdAt,
          completedDate: payoutData.payment?.processedAt,
          method: payoutData.payment?.method === 'bank_transfer' ? 'Bank Transfer' : 'Bank Transfer',
          accountDetails: 'Account on file',
          transactionId: payoutData.payment?.transactionId,
          processedBy: payoutData.payment?.processedBy?.name,
          // Map orders array - handle both structures (nested order object or direct fields)
          orders: payoutData.orders?.map(o => ({
            orderNumber: o.orderNumber || o.order?.orderNumber,
            orderValue: o.orderValue || o.order?.pricing?.subtotal,
            commission: o.commission,
            vendorEarning: o.vendorEarning,
            createdAt: o.createdAt || o.order?.createdAt,
            orderId: o.orderId || o.order?._id
          })) || [],
          summary: payoutData.summary,
          period: payoutData.period,
          notes: payoutData.notes
        };
        
        setSelectedPayout(mappedPayout);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching payout details:', err);
      setError('Failed to load payout details');
      setTimeout(() => setError(null), 3000);
      // Try to find in existing payouts as fallback
      const payout = payouts.find(p => p._id === payoutId);
      if (payout) {
        // Map the orders from the list view structure too
        const mappedPayout = {
          ...payout,
          orders: payout.orders?.map(o => ({
            orderNumber: o.orderNumber,
            orderValue: o.orderValue,
            commission: o.commission,
            vendorEarning: o.vendorEarning,
            createdAt: o.createdAt,
            orderId: o.orderId
          })) || []
        };
        setSelectedPayout(mappedPayout);
        setShowDetailsModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    try {
      const amount = parseFloat(payoutAmount);
      if (amount < 100 || isNaN(amount)) {
        setError('Minimum payout amount is ₹100');
        setTimeout(() => setError(null), 3000);
        return;
      }

      if (amount > (earningsData?.availableBalance || 0)) {
        setError('Insufficient balance');
        setTimeout(() => setError(null), 3000);
        return;
      }

      setLoading(true);
      await requestPayout(amount);
      
      setSuccessMessage('Payout request submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      setShowPayoutModal(false);
      setPayoutAmount('');
      
      // Refresh data
      await fetchAllData();
    } catch (err) {
      setError(err.message || 'Failed to submit payout request');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // Default to 'pending' if status is undefined or null
    const statusValue = status || 'pending';
    
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const icons = {
      completed: <CheckCircleIcon className="h-3 w-3" />,
      pending: <ClockIcon className="h-3 w-3" />,
      processing: <ArrowPathIcon className="h-3 w-3 animate-spin" />,
      failed: <XCircleIcon className="h-3 w-3" />,
      rejected: <XCircleIcon className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${styles[statusValue] || styles.pending}`}>
        {icons[statusValue] || icons.pending}
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Ensure payouts is an array before filtering
  const filteredPayouts = (Array.isArray(payouts) ? payouts : []).filter(payout => {
    const matchesSearch = payout._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.accountDetails?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payout.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your earnings and payout requests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards - Compact Design */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-green-100 rounded">
              <WalletIcon className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Pending Payout</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                ₹{(earningsData?.availableBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-yellow-100 rounded">
              <ClockIcon className="h-3.5 w-3.5 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Today's Orders</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                ₹{(earningsData?.pendingBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-blue-100 rounded">
              <BanknotesIcon className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Earnings</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                ₹{(earningsData?.totalEarnings || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-purple-100 rounded">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">This Month</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                ₹{(earningsData?.thisMonthEarnings || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters Row */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col sm:flex-row gap-1.5">
              <div className="relative border border-zinc-200 rounded-md flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by payout ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-8 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full sm:w-36 border border-zinc-200 rounded-md py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="block w-full sm:w-36 border border-zinc-200 rounded-md py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                <DocumentArrowDownIcon className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
            
            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Payout ID
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {payout._id?.slice(-8) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(payout.amount)}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarDaysIcon className="h-3 w-3 mr-1" />
                        {formatDate(payout.requestDate)}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                      {payout.method || 'Bank Transfer'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewDetails(payout._id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-2 py-4 text-center text-xs text-gray-500">
                    No payout records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayouts.length > 0 && (
          <div className="px-2 py-1.5 border-t border-gray-200 flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-xs text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex gap-1.5 ml-auto">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowPayoutModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden  transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-4 pb-3 sm:p-5">
                <h3 className="text-base font-medium text-gray-900 mb-3">Request Payout</h3>
                
                <div className="space-y-2.5">
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Available Balance: <span className="font-medium text-green-600">{formatCurrency(earningsData?.availableBalance || 0)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Minimum payout amount: ₹100
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        min="100"
                        max={earningsData?.availableBalance || 0}
                        step="1"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="block w-full pl-7 py-2 rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-2.5 rounded-lg">
                    <div className="text-sm text-blue-700 font-medium">
                      Payout Details:
                    </div>
                    <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                      <div>• Processing time: 1-3 business days</div>
                      <div>• No processing fee for payouts above ₹500</div>
                      <div>• Payouts below ₹500 have a ₹10 processing fee</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-2.5 sm:px-5 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={handlePayoutRequest}
                  disabled={!payoutAmount || parseFloat(payoutAmount) < 100 || parseFloat(payoutAmount) > (earningsData?.availableBalance || 0)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent  px-3 py-1.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Payout
                </button>
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount('');
                  }}
                  className="mt-2 w-full inline-flex justify-center rounded-md border border-gray-300  px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/50  overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDetailsModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden  transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-4 pb-3 sm:p-5">
                <h3 className="text-base font-medium text-gray-900 mb-3">Payout Details</h3>
                
                <div className="space-y-2.5">
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <div className="text-xs text-gray-500">Payout ID</div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">
                          {selectedPayout._id?.slice(-8) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="mt-0.5">
                          {getStatusBadge(selectedPayout.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="text-base font-semibold text-gray-900 mt-0.5">
                          {formatCurrency(selectedPayout.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Method</div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">
                          {selectedPayout.method || 'Bank Transfer'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <div className="text-xs text-gray-500">Request Date</div>
                        <div className="text-sm text-gray-900 mt-0.5">
                          {formatDate(selectedPayout.requestDate)}
                        </div>
                      </div>
                      {selectedPayout.completedDate && (
                        <div>
                          <div className="text-xs text-gray-500">Completed Date</div>
                          <div className="text-sm text-gray-900 mt-0.5">
                            {formatDate(selectedPayout.completedDate)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedPayout.transactionId && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="text-xs text-gray-500">Transaction ID</div>
                          <div className="text-xs font-mono text-gray-900 mt-0.5">
                            {selectedPayout.transactionId}
                          </div>
                        </div>
                        {selectedPayout.processedBy && (
                          <div>
                            <div className="text-xs text-gray-500">Processed By</div>
                            <div className="text-sm text-gray-900 mt-0.5">
                              {selectedPayout.processedBy}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPayout.period && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500 mb-1.5">Payout Period</div>
                      <div className="text-xs text-gray-900">
                        <span className="font-medium capitalize">{selectedPayout.period.type}</span>
                        {' - '}
                        {new Date(selectedPayout.period.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' to '}
                        {new Date(selectedPayout.period.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  )}

                  {selectedPayout.summary && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500 mb-1.5">Payout Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Total Orders:</span>
                          <span className="ml-1 font-medium text-gray-900">{selectedPayout.summary.totalOrders}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Order Value:</span>
                          <span className="ml-1 font-medium text-gray-900">₹{selectedPayout.summary.totalOrderValue?.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission:</span>
                          <span className="ml-1 font-medium text-red-600">-₹{selectedPayout.summary.totalCommission?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission Rate:</span>
                          <span className="ml-1 font-medium text-gray-900">{(selectedPayout.summary.commissionRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Your Earnings:</span>
                          <span className="ml-1 font-semibold text-green-600 text-sm">₹{selectedPayout.summary.vendorEarning?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPayout.orders && selectedPayout.orders.length > 0 && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500 mb-1.5">Included Orders ({selectedPayout.orders.length})</div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {selectedPayout.orders.map((order, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded text-xs border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="font-medium text-gray-900">{order.orderNumber}</span>
                                {order.createdAt && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-blue-600">₹{order.orderValue?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Commission: ₹{order.commission?.toFixed(2)}</span>
                              <span className="text-green-600 font-medium">Earning: ₹{order.vendorEarning?.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPayout.accountDetails && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500">Account Details</div>
                      <div className="text-sm text-gray-900 mt-0.5">
                        {selectedPayout.accountDetails}
                      </div>
                    </div>
                  )}

                  {selectedPayout.notes && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500">Notes</div>
                      <div className="text-sm text-gray-900 mt-0.5">
                        {selectedPayout.notes}
                      </div>
                    </div>
                  )}

                  {selectedPayout.remarks && (
                    <div className="border-t border-gray-200 pt-2.5">
                      <div className="text-xs text-gray-500">Remarks</div>
                      <div className="text-sm text-gray-900 mt-0.5">
                        {selectedPayout.remarks}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-2.5 sm:px-5 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300  px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto"
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

export default WalletPayments;
