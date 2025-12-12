import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { 
  getAllDeliveryTeam, 
  addDeliveryBoy, 
  updateDeliveryBoyStatus, 
  removeDeliveryBoy 
} from '../utils/api';

const DeliveryTeamManagement = () => {
  const [deliveryTeam, setDeliveryTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [vendorDeliveryId, setVendorDeliveryId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');

  // Country codes list
  const countryCodes = [
    { code: '+91', country: 'IN', name: 'India' },
    { code: '+1', country: 'US', name: 'USA' },
    { code: '+44', country: 'GB', name: 'UK' },
    { code: '+971', country: 'AE', name: 'UAE' },
    { code: '+966', country: 'SA', name: 'Saudi Arabia' },
    { code: '+65', country: 'SG', name: 'Singapore' },
    { code: '+61', country: 'AU', name: 'Australia' },
    { code: '+49', country: 'DE', name: 'Germany' },
    { code: '+33', country: 'FR', name: 'France' },
    { code: '+81', country: 'JP', name: 'Japan' },
    { code: '+86', country: 'CN', name: 'China' },
    { code: '+977', country: 'NP', name: 'Nepal' },
    { code: '+880', country: 'BD', name: 'Bangladesh' },
    { code: '+94', country: 'LK', name: 'Sri Lanka' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    
    // Personal Information
    fullName: '',
    mobileNumber: '',
    alternateNumber: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Identification
    panNumber: '',
    aadharNumber: '',
    
    // Experience
    experienceYears: '',
    
    // Vehicle Information
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    
    // Bank Details
    accountNumber: '',
    accountHolderName: '',
    ifsc: '',
    upiId: '',
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },

    // Documents
    documents: {
      aadhar: null,
      pan: null,
      driving_license: null,
      vehicle_rc: null,
      bank_passbook: null,
      vehicle_photo: null,
      profile_photo: null
    }
  });

  useEffect(() => {
    fetchDeliveryTeam();
  }, []);

  const fetchDeliveryTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllDeliveryTeam();
      
      if (response && response.success && response.data) {
        setDeliveryTeam(response.data.deliveryBoys || []);
        setVendorDeliveryId(response.data.vendorDeliveryId || null);
      }
    } catch (err) {
      console.error('Error fetching delivery team:', err);
      setError(err.message || 'Failed to load delivery team');
      setDeliveryTeam([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryBoy = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Create FormData for multipart/form-data upload
      const formDataToSend = new FormData();

      // Add all text fields with country code prepended to phone numbers
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', `${countryCode}${formData.phoneNumber}`);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('mobileNumber', `${countryCode}${formData.mobileNumber || formData.phoneNumber}`);
      
      if (formData.alternateNumber) formDataToSend.append('alternateNumber', `${countryCode}${formData.alternateNumber}`);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.city) formDataToSend.append('city', formData.city);
      if (formData.state) formDataToSend.append('state', formData.state);
      if (formData.pincode) formDataToSend.append('pincode', formData.pincode);
      if (formData.panNumber) formDataToSend.append('panNumber', formData.panNumber);
      if (formData.aadharNumber) formDataToSend.append('aadharNumber', formData.aadharNumber);
      if (formData.experienceYears) formDataToSend.append('experienceYears', formData.experienceYears);
      
      formDataToSend.append('vehicleType', formData.vehicleType);
      formDataToSend.append('vehicleNumber', formData.vehicleNumber);
      
      if (formData.licenseNumber) formDataToSend.append('licenseNumber', formData.licenseNumber);
      if (formData.accountHolderName) formDataToSend.append('accountHolderName', formData.accountHolderName);
      if (formData.accountNumber) formDataToSend.append('accountNumber', formData.accountNumber);
      if (formData.ifsc) formDataToSend.append('ifsc', formData.ifsc);
      if (formData.upiId) formDataToSend.append('upiId', formData.upiId);
      
      // Add emergency contact
      if (formData.emergencyContact.name) {
        formDataToSend.append('emergencyContact[name]', formData.emergencyContact.name);
        formDataToSend.append('emergencyContact[phone]', formData.emergencyContact.phone);
        formDataToSend.append('emergencyContact[relation]', formData.emergencyContact.relation);
      }
      
      // Add document files
      const documentTypes = ['aadhar', 'pan', 'driving_license', 'vehicle_rc', 'bank_passbook', 'vehicle_photo', 'profile_photo'];
      documentTypes.forEach(docType => {
        if (formData.documents[docType]) {
          formDataToSend.append(docType, formData.documents[docType]);
        }
      });
      
      const response = await addDeliveryBoy(formDataToSend);
      
      if (response && response.success) {
        setSuccessMessage(response.message || 'Delivery person added successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowAddModal(false);
        resetForm();
        fetchDeliveryTeam();
      }
    } catch (err) {
      console.error('Error adding delivery person:', err);
      setError(err.message || 'Failed to add delivery person');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUpdateStatus = async (deliveryBoyId, isAvailable) => {
    try {
      setError(null);
      const response = await updateDeliveryBoyStatus(deliveryBoyId, {
        isAvailable: !isAvailable
      });
      
      if (response && response.success) {
        setSuccessMessage(`Delivery person status updated successfully!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchDeliveryTeam();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemoveDeliveryBoy = async (deliveryBoyId) => {
    if (!confirm('Are you sure you want to remove this delivery person from your team?')) {
      return;
    }

    try {
      setError(null);
      const response = await removeDeliveryBoy(deliveryBoyId);
      
      if (response && response.success) {
        setSuccessMessage('Delivery person removed successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchDeliveryTeam();
      }
    } catch (err) {
      console.error('Error removing delivery person:', err);
      setError(err.message || 'Failed to remove delivery person');
      setTimeout(() => setError(null), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      // Basic Information
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      
      // Personal Information
      fullName: '',
      mobileNumber: '',
      alternateNumber: '',
      
      // Address Information
      address: '',
      city: '',
      state: '',
      pincode: '',
      
      // Identification
      panNumber: '',
      aadharNumber: '',
      
      // Experience
      experienceYears: '',
      
      // Vehicle Information
      vehicleType: '',
      vehicleNumber: '',
      licenseNumber: '',
      
      // Bank Details
      accountNumber: '',
      accountHolderName: '',
      ifsc: '',
      upiId: '',
      
      // Emergency Contact
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      },

      // Documents
      documents: {
        aadhar: null,
        pan: null,
        driving_license: null,
        vehicle_rc: null,
        bank_passbook: null,
        vehicle_photo: null,
        profile_photo: null
      }
    });
    setCountryCode('+91');
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    // Handle file uploads
    if (type === 'file') {
      if (files && files[0]) {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [name]: files[0]
          }
        }));
      }
      return;
    }
    
    // Handle emergency contact nested fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredTeam = deliveryTeam.filter(member => {
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phoneNumber || '').includes(searchTerm) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'available' && member.deliveryBoyInfo?.isAvailable !== false && member.isActive) ||
      (filterStatus === 'busy' && member.deliveryBoyInfo?.isAvailable === false) ||
      (filterStatus === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const teamStats = {
    total: deliveryTeam.length,
    available: deliveryTeam.filter(m => m.deliveryBoyInfo?.isAvailable !== false && m.isActive).length,
    busy: deliveryTeam.filter(m => m.deliveryBoyInfo?.isAvailable === false).length,
    inactive: deliveryTeam.filter(m => !m.isActive).length
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
      {/* Success Message */}
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
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
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
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Delivery Team Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage your self-delivery team members
          </p>
          {vendorDeliveryId && (
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 border border-blue-200">
                <span className="text-xs font-medium text-blue-700 mr-2">Team Code:</span>
                <span className="text-xs font-mono font-semibold text-blue-900">{vendorDeliveryId}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(vendorDeliveryId);
                  setSuccessMessage('Team code copied to clipboard!');
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 border border-gray-300"
                title="Copy team code"
              >
                <DocumentTextIcon className="h-3.5 w-3.5 mr-1" />
                Copy
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Delivery Person
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
        <div 
          onClick={() => setFilterStatus('all')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'all' 
              ? 'border-blue-500 ' 
              : 'border-gray-200 hover:border-blue-300 hover:'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Team</dt>
                  <dd className="text-lg font-semibold text-gray-900">{teamStats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'available' ? 'all' : 'available')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'available' 
              ? 'border-green-500 ' 
              : 'border-green-200 hover:border-green-300 hover:'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Available</dt>
                  <dd className="text-lg font-semibold text-gray-900">{teamStats.available}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'busy' ? 'all' : 'busy')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'busy' 
              ? 'border-yellow-500 ' 
              : 'border-yellow-200 hover:border-yellow-300 hover:'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <TruckIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">On Delivery</dt>
                  <dd className="text-lg font-semibold text-gray-900">{teamStats.busy}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
          className={`bg-white overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
            filterStatus === 'inactive' 
              ? 'border-gray-500 ' 
              : 'border-gray-200 hover:border-gray-300 hover:'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Inactive</dt>
                  <dd className="text-lg font-semibold text-gray-900">{teamStats.inactive}</dd>
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
                placeholder="Search by name, phone or email..."
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="busy">On Delivery</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Team Table */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions``
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all'
                      ? 'No delivery persons match your filters'
                      : 'No delivery team members yet. Add your first team member to get started.'}
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-medium text-sm">
                            {member.name?.charAt(0).toUpperCase() || 'D'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {member._id?.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <PhoneIcon className="h-3 w-3 mr-1.5" />
                          {member.phoneNumber || 'N/A'}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <EnvelopeIcon className="h-3 w-3 mr-1.5" />
                          {member.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-900">
                          {member.deliveryBoyInfo?.vehicleType || 'Not specified'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.deliveryBoyInfo?.vehicleNumber || 'No vehicle number'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div>
                          {member.isActive ? (
                            member.deliveryBoyInfo?.isAvailable !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></div>
                                On Delivery
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1.5"></div>
                              Inactive
                            </span>
                          )}
                        </div>
                        {member.isActive && (
                          <button
                            onClick={() => handleUpdateStatus(member._id, member.deliveryBoyInfo?.isAvailable)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Toggle Status
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleRemoveDeliveryBoy(member._id)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Delivery Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={() => setShowAddModal(false)}
            ></div>
            
            <div className="relative bg-white rounded-lg text-left overflow-hidden  transform transition-all sm:my-8 sm:max-w-2xl sm:w-full z-10">
              <form onSubmit={handleAddDeliveryBoy}>
                <div className="bg-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        Add Delivery Person
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add a new member to your delivery team
                      </p>
                      {vendorDeliveryId && (
                        <div className="mt-2 inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 border border-green-200">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-xs text-green-700">
                            Will be automatically assigned to Team: <span className="font-mono font-semibold">{vendorDeliveryId}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600 ml-4"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Rajesh Sharma"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <div className="flex">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {countryCodes.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.country})
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              placeholder="9876543210"
                              required
                              className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="e.g., rajesh.sharma@example.com"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Minimum 6 characters"
                              required
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Alternate Number
                          </label>
                          <div className="flex">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {countryCodes.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.country})
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              name="alternateNumber"
                              value={formData.alternateNumber}
                              onChange={handleInputChange}
                              placeholder="Optional"
                              className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Identification */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Identification</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            PAN Number *
                          </label>
                          <input
                            type="text"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., ABCDE1234F"
                            required
                            maxLength="10"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Aadhar Number *
                          </label>
                          <input
                            type="text"
                            name="aadharNumber"
                            value={formData.aadharNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., 1234 5678 9012"
                            required
                            maxLength="12"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Experience (Years) *
                          </label>
                          <input
                            type="number"
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleInputChange}
                            placeholder="e.g., 2"
                            required
                            min="0"
                            max="50"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Information</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Vehicle Type *
                          </label>
                          <select
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleInputChange}
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Type</option>
                            <option value="two_wheeler">Two Wheeler (Bike/Scooter)</option>
                            <option value="three_wheeler">Three Wheeler (Auto)</option>
                            <option value="four_wheeler">Four Wheeler (Car/Van)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Vehicle Number *
                          </label>
                          <input
                            type="text"
                            name="vehicleNumber"
                            value={formData.vehicleNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., MH12AB1234"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            License Number *
                          </label>
                          <input
                            type="text"
                            name="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., MH1220190012345"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleInputChange}
                            placeholder="e.g., Rajesh Sharma"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., 123456789012"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            IFSC Code *
                          </label>
                          <input
                            type="text"
                            name="ifsc"
                            value={formData.ifsc}
                            onChange={handleInputChange}
                            placeholder="e.g., SBIN0001234"
                            required
                            maxLength="11"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            placeholder="e.g., 9876543210@paytm"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Address</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="e.g., 123 Main Street, Near City Mall"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="e.g., Mumbai"
                              required
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              placeholder="e.g., Maharashtra"
                              required
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Pincode *
                            </label>
                            <input
                              type="text"
                              name="pincode"
                              value={formData.pincode}
                              onChange={handleInputChange}
                              placeholder="e.g., 400001"
                              required
                              maxLength="6"
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contact Name *
                          </label>
                          <input
                            type="text"
                            name="emergencyContact.name"
                            value={formData.emergencyContact.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Suresh Kumar"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contact Phone *
                          </label>
                          <input
                            type="tel"
                            name="emergencyContact.phone"
                            value={formData.emergencyContact.phone}
                            onChange={handleInputChange}
                            placeholder="e.g., 9123456789"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Relation *
                          </label>
                          <select
                            name="emergencyContact.relation"
                            value={formData.emergencyContact.relation}
                            onChange={handleInputChange}
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Relation</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Document Upload Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Documents Upload (Required)</h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <DocumentTextIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <h5 className="text-sm font-semibold text-red-900 mb-1">
                              Document Verification Required
                            </h5>
                            <p className="text-xs text-red-700">
                              All documents marked with <span className="text-red-600 font-semibold">*</span> are mandatory for registration.
                              The delivery person will be verified only after uploading Aadhar Card, PAN Card, and Driving License.
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              <span className="font-semibold">Max file size:</span> 5MB per document | <span className="font-semibold">Formats:</span> JPG, PNG, PDF
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aadhar Card <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="aadhar"
                            accept="image/*,application/pdf"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG, PDF</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PAN Card <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="pan"
                            accept="image/*,application/pdf"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG, PDF</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driving License <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="driving_license"
                            accept="image/*,application/pdf"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG, PDF</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle RC <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="vehicle_rc"
                            accept="image/*,application/pdf"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG, PDF</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Passbook <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="bank_passbook"
                            accept="image/*,application/pdf"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG, PDF</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Photo <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="vehicle_photo"
                            accept="image/*"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG only</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Photo <span className="text-red-600 font-semibold">*</span>
                          </label>
                          <input
                            type="file"
                            name="profile_photo"
                            accept="image/*"
                            onChange={handleInputChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size: 5MB | JPG, PNG only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Add Delivery Person
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTeamManagement;
