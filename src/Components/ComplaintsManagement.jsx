import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserIcon,
  ShoppingBagIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { getVendorComplaints, getComplaintDetails, getComplaintsStats } from '../utils/complaintsApi';

const ComplaintsManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    highPriority: 0
  });

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined
      };

      // Try to fetch from API, fall back to mock data if API fails
      try {
        const response = await getVendorComplaints(params);
        console.log('Fetched complaints:', response);
        setComplaints(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
        
        // Calculate stats from the fetched complaints
        const fetchedComplaints = response.data || [];
        setStats({
          total: response.total || fetchedComplaints.length,
          pending: fetchedComplaints.filter(c => ['submitted', 'acknowledged', 'under_review'].includes(c.status)).length,
          resolved: fetchedComplaints.filter(c => c.status === 'resolved').length,
          highPriority: fetchedComplaints.filter(c => c.priority === 'high').length
        });
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        
        // Mock data fallback
        const mockComplaints = [
          {
            _id: '1',
            complaintNumber: 'CMP12345001',
            title: 'Product Quality Issue',
            description: 'Received damaged vegetables in my order. The tomatoes were rotten and vegetables were not fresh.',
            issueType: 'product_quality',
            status: 'submitted',
            priority: 'high',
            customer: {
              _id: 'customer1',
              name: 'Rajesh Kumar',
              phone: '+91 9876543210',
              email: 'rajesh@example.com'
            },
            order: {
              _id: 'order1',
              orderNumber: 'ORD123456',
              pricing: { total: 450 }
            },
            affectedItem: {
              product: {
                _id: 'product1',
                name: 'Fresh Tomatoes',
                images: ['/api/placeholder/300/200']
              },
              vendor: 'vendor1',
              quantity: 2
            },
            createdAt: new Date().toISOString(),
            assignedTo: null
          },
          {
            _id: '2',
            complaintNumber: 'CMP12345002',
            title: 'Wrong Item Delivered',
            description: 'I ordered Basmati rice but received regular rice instead.',
            issueType: 'wrong_item',
            status: 'acknowledged',
            priority: 'medium',
            customer: {
              _id: 'customer2',
              name: 'Priya Sharma',
              phone: '+91 9876543211',
              email: 'priya@example.com'
            },
            order: {
              _id: 'order2',
              orderNumber: 'ORD123457',
              pricing: { total: 280 }
            },
            affectedItem: {
              product: {
                _id: 'product2',
                name: 'Basmati Rice 5kg',
                images: []
              },
              vendor: 'vendor1',
              quantity: 1
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            assignedTo: {
              _id: 'support1',
              name: 'Support Team'
            }
          },
          {
            _id: '3',
            complaintNumber: 'CMP12345003',
            title: 'Missing Items',
            description: 'Two items were missing from my grocery order.',
            issueType: 'missing_item',
            status: 'resolved',
            priority: 'low',
            customer: {
              _id: 'customer3',
              name: 'Amit Patel',
              phone: '+91 9876543212',
              email: 'amit@example.com'
            },
            order: {
              _id: 'order3',
              orderNumber: 'ORD123458',
              pricing: { total: 150 }
            },
            affectedItem: {
              product: {
                _id: 'product3',
                name: 'Mixed Groceries',
                images: []
              },
              vendor: 'vendor1',
              quantity: 2
            },
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            resolution: {
              type: 'refund_issued',
              description: 'Refund processed for missing items',
              resolvedAt: new Date(Date.now() - 86400000).toISOString()
            }
          }
        ];

        setComplaints(mockComplaints);
        setStats({
          total: mockComplaints.length,
          pending: mockComplaints.filter(c => ['submitted', 'acknowledged', 'under_review'].includes(c.status)).length,
          resolved: mockComplaints.filter(c => c.status === 'resolved').length,
          highPriority: mockComplaints.filter(c => c.priority === 'high').length
        });
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch complaints');
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const handleViewDetails = async (complaint) => {
    try {
      // Try to fetch detailed complaint data from API
      try {
        const response = await getComplaintDetails(complaint._id);
        console.log('Fetched complaint details:', response);
        setSelectedComplaint(response.data || complaint);
      } catch (apiError) {
        console.warn('Failed to fetch detailed complaint data, using existing data:', apiError);
        setSelectedComplaint(complaint);
      }
      
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error viewing complaint details:', err);
      setSelectedComplaint(complaint);
      setShowDetailsModal(true);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800'
    };

    const icons = {
      submitted: <ClockIcon className="h-3 w-3" />,
      acknowledged: <CheckCircleIcon className="h-3 w-3" />,
      under_review: <ExclamationTriangleIcon className="h-3 w-3" />,
      in_progress: <ArrowPathIcon className="h-3 w-3" />,
      resolved: <CheckCircleIcon className="h-3 w-3" />,
      closed: <XCircleIcon className="h-3 w-3" />,
      escalated: <ExclamationTriangleIcon className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${styles[status] || styles.submitted}`}>
        {icons[status] || icons.submitted}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${styles[priority] || styles.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getIssueTypeIcon = (issueType) => {
    const icons = {
      product_quality: <CubeIcon className="h-3 w-3" />,
      wrong_item: <ExclamationTriangleIcon className="h-3 w-3" />,
      missing_item: <XCircleIcon className="h-3 w-3" />,
      damaged_product: <ExclamationTriangleIcon className="h-3 w-3" />,
      delivery_delayed: <ClockIcon className="h-3 w-3" />,
      delivery_not_received: <XCircleIcon className="h-3 w-3" />
    };

    return icons[issueType] || <DocumentTextIcon className="h-3 w-3" />;
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

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.affectedItem?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
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
          <h1 className="text-xl font-bold text-gray-900">Complaints & Issues</h1>
          <p className="text-xs text-gray-500">
            Manage customer complaints and order issues
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center rounded-md bg-white border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="ml-1 hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-2">
          <div className="flex">
            <XCircleIcon className="h-4 w-4 text-red-400" />
            <p className="ml-2 text-xs text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center">
            <div className="shrink-0">
              <DocumentTextIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center">
            <div className="shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center">
            <div className="shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Resolved</p>
              <p className="text-lg font-semibold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center">
            <div className="shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">High Priority</p>
              <p className="text-lg font-semibold text-red-600">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full border rounded-md border-gray-300 pl-8 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full sm:w-32 border rounded-md border-gray-300 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full sm:w-32 border rounded-md border-gray-300 py-1.5 text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-6 w-6 bg-gray-100 rounded flex items-center justify-center">
                          {getIssueTypeIcon(complaint.issueType)}
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">
                            {complaint.complaintNumber}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {complaint.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {complaint.customer.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {complaint.customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <div className="text-xs font-medium text-blue-600">
                          {complaint.order.orderNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getPriorityBadge(complaint.priority)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <EyeIcon className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center">
                    <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-xs font-medium text-gray-900">No complaints found</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No customer complaints at this time.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left  transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-4 pb-2 sm:p-4 sm:pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium leading-6 text-gray-900">
                    Complaint Details
                  </h3>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="max-h-96 overflow-y-auto px-4 sm:px-4">
                <div className="space-y-2">
                  {/* Header Info - Complaint ID, Status, Priority */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs font-medium text-gray-600">Complaint ID</div>
                        <div className="text-xs font-bold text-gray-900">{selectedComplaint.complaintNumber}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600">Status</div>
                        <div className="mt-0.5">{getStatusBadge(selectedComplaint.status)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600">Priority</div>
                        <div className="mt-0.5">{getPriorityBadge(selectedComplaint.priority)}</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-100">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Issue:</span> {selectedComplaint.issueType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Created:</span> {formatDate(selectedComplaint.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Order Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />Customer
                      </div>
                      <div className="text-xs font-medium text-gray-900">{selectedComplaint.customer?.name || selectedComplaint.customerInfo?.name}</div>
                      <div className="text-xs text-gray-500">{selectedComplaint.customer?.email || selectedComplaint.customerInfo?.email}</div>
                      <div className="text-xs text-gray-500">{selectedComplaint.customer?.phone || selectedComplaint.customerInfo?.phone}</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                        <ShoppingBagIcon className="h-3 w-3 mr-1" />Order
                      </div>
                      <div className="text-xs font-medium text-blue-600">{selectedComplaint.order?.orderNumber || selectedComplaint.orderNumber}</div>
                      {selectedComplaint.order?.pricing && (
                        <div className="text-xs text-gray-900 font-medium mt-1">₹{selectedComplaint.order.pricing.total}</div>
                      )}
                      {selectedComplaint.order?.deliveryAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedComplaint.order.deliveryAddress.city}, {selectedComplaint.order.deliveryAddress.state}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Affected Product */}
                  {selectedComplaint.affectedItem && (
                    <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-orange-900 mb-1">Affected Product</div>
                      <div className="flex gap-2">
                        {selectedComplaint.affectedItem.product?.images?.[0] && (
                          <img 
                            src={selectedComplaint.affectedItem.product.images[0].url || selectedComplaint.affectedItem.product.images[0]} 
                            alt="Product"
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {selectedComplaint.affectedItem.product?.name || selectedComplaint.affectedItem.productName}
                          </div>
                          <div className="text-xs text-gray-600">
                            SKU: {selectedComplaint.affectedItem.product?.sku || selectedComplaint.affectedItem.productSku}
                          </div>
                          <div className="text-xs text-orange-700 font-medium">Qty: {selectedComplaint.affectedItem.quantity}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Issue Description */}
                  <div className="bg-white border border-gray-200 p-2 rounded-lg">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Complaint Details</div>
                    <div className="text-xs font-medium text-gray-900 mb-1">{selectedComplaint.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{selectedComplaint.description}</div>
                  </div>

                  {/* SLA & Analytics */}
                  {(selectedComplaint.sla || selectedComplaint.analytics) && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedComplaint.sla && (
                        <div className="bg-white border border-gray-200 p-2 rounded-lg">
                          <div className="text-xs font-semibold text-gray-700 mb-1">SLA Status</div>
                          <div className={`text-xs font-medium ${selectedComplaint.sla.isBreached ? 'text-red-600' : 'text-green-600'}`}>
                            {selectedComplaint.sla.isBreached ? '⚠️ Breached' : '✓ Within SLA'}
                          </div>
                          {selectedComplaint.sla.expectedResolutionTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expected: {formatDate(selectedComplaint.sla.expectedResolutionTime)}
                            </div>
                          )}
                          {selectedComplaint.analytics?.resolutionTime && (
                            <div className="text-xs text-gray-600 mt-1">
                              Resolved in: {selectedComplaint.analytics.resolutionTime} mins
                            </div>
                          )}
                        </div>
                      )}
                      {selectedComplaint.analytics && (
                        <div className="bg-white border border-gray-200 p-2 rounded-lg">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Source</div>
                          <div className="text-xs text-gray-900 capitalize">{selectedComplaint.analytics.source || 'N/A'}</div>
                          {selectedComplaint.analytics.deviceInfo?.platform && (
                            <div className="text-xs text-gray-500 mt-1 truncate" title={selectedComplaint.analytics.deviceInfo.platform}>
                              {selectedComplaint.analytics.deviceInfo.platform}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Images Gallery */}
                  {selectedComplaint.affectedItem?.product?.images && selectedComplaint.affectedItem.product.images.length > 1 && (
                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Product Images ({selectedComplaint.affectedItem.product.images.length})</div>
                      <div className="grid grid-cols-4 gap-1">
                        {selectedComplaint.affectedItem.product.images.map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                            <img
                              src={image.url || image}
                              alt={image.altText || `Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complaint Attachments */}
                  {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-red-900 mb-2">Customer Attachments ({selectedComplaint.attachments.length})</div>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedComplaint.attachments.map((attachment, index) => (
                          <div key={index} className="aspect-square bg-white rounded overflow-hidden border border-red-200">
                            <img
                              src={attachment.url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Details */}
                  {selectedComplaint.resolution && selectedComplaint.resolution.description && (
                    <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-green-900 mb-1">✓ Resolution</div>
                      <div className="text-xs text-green-800 mb-1">{selectedComplaint.resolution.description}</div>
                      {selectedComplaint.resolution.refundAmount > 0 && (
                        <div className="text-xs font-medium text-green-700">Refund: ₹{selectedComplaint.resolution.refundAmount}</div>
                      )}
                      {selectedComplaint.resolution.compensationAmount > 0 && (
                        <div className="text-xs font-medium text-green-700">Compensation: ₹{selectedComplaint.resolution.compensationAmount}</div>
                      )}
                      {selectedComplaint.resolution.resolvedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          Resolved: {formatDate(selectedComplaint.resolution.resolvedAt)}
                        </div>
                      )}
                      {selectedComplaint.resolution.resolutionNotes && (
                        <div className="text-xs text-green-700 mt-1 italic">{selectedComplaint.resolution.resolutionNotes}</div>
                      )}
                    </div>
                  )}

                  {/* Status History */}
                  {selectedComplaint.statusHistory && selectedComplaint.statusHistory.length > 0 && (
                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Status History</div>
                      <div className="space-y-1">
                        {selectedComplaint.statusHistory.map((history, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start gap-2 pb-1 border-b border-gray-100 last:border-0">
                            <span className="font-medium text-gray-900 min-w-20">{history.status.replace(/_/g, ' ')}</span>
                            <span className="text-gray-400">•</span>
                            <span className="flex-1">{formatDate(history.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Escalation Info */}
                  {selectedComplaint.escalation?.isEscalated && (
                    <div className="bg-red-50 border border-red-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-red-900 mb-1">⚠️ Escalated</div>
                      <div className="text-xs text-red-700">
                        Level: {selectedComplaint.escalation.escalationLevel}
                        {selectedComplaint.escalation.escalationReason && (
                          <span> - {selectedComplaint.escalation.escalationReason}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {selectedComplaint.order?.items && selectedComplaint.order.items.length > 0 && (
                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Order Items ({selectedComplaint.order.items.length})</div>
                      <div className="space-y-1">
                        {selectedComplaint.order.items.map((item, index) => (
                          <div key={index} className="flex gap-2 text-xs pb-1 border-b border-gray-100 last:border-0">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{item.name}</div>
                              <div className="text-gray-500">Qty: {item.quantity} • ₹{item.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-2 sm:flex sm:flex-row-reverse sm:px-4">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-xs font-medium text-white  hover:bg-blue-700 sm:ml-2 sm:w-auto"
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

export default ComplaintsManagement;
