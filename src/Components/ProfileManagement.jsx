import { useState, useEffect } from 'react';
import {
  UserIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BanknotesIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  XMarkIcon,
  DocumentTextIcon,
  CreditCardIcon,
  TruckIcon,
  PhotoIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { DocumentIcon } from '@heroicons/react/24/solid';
import { getVendorProfile, updateVendorProfile } from '../utils/api';

const ProfileManagement = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [storeImages, setStoreImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phoneNumber: '',

    // Business Information
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    businessOwnerName: '',
    contactPersonName: '',
    mobileNumber: '',
    alternateNumber: '',

    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',

    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',

    // Delivery Settings
    deliveryModel: 'lalaji_network'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [documents, setDocuments] = useState({
    gst: null,
    pan: null,
    aadhar: null,
    license: null
  });

  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [fullScreenTitle, setFullScreenTitle] = useState('');

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const businessTypes = [
    'Retail Store',
    'Wholesale',
    'Restaurant',
    'Cafe',
    'Grocery Store',
    'Supermarket',
    'Pharmacy',
    'Electronics Store',
    'Clothing Store',
    'Other'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle ESC key to close full screen modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && fullScreenImage) {
        closeFullScreen();
      }
    };

    if (fullScreenImage) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [fullScreenImage]);

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getVendorProfile();
      console.log('Vendor Profile Response:', response);

      const profileData = response.data || response;
      setProfile(profileData);

      // Set form data from profile
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        businessName: profileData.vendorInfo?.businessName || '',
        businessType: profileData.vendorInfo?.businessType || '',
        gstNumber: profileData.vendorInfo?.gstNumber || '',
        panNumber: profileData.vendorInfo?.panNumber || '',
        businessOwnerName: profileData.vendorInfo?.businessOwnerName || '',
        contactPersonName: profileData.vendorInfo?.contactPersonName || '',
        mobileNumber: profileData.vendorInfo?.mobileNumber || '',
        alternateNumber: profileData.vendorInfo?.alternateNumber || '',
        address: profileData.vendorInfo?.businessAddress?.address || '',
        city: profileData.vendorInfo?.businessAddress?.city || '',
        state: profileData.vendorInfo?.businessAddress?.state || '',
        pincode: profileData.vendorInfo?.businessAddress?.pincode || '',
        bankName: profileData.vendorInfo?.bankDetails?.bankName || '',
        accountNumber: profileData.vendorInfo?.bankDetails?.accountNumber || '',
        ifscCode: profileData.vendorInfo?.bankDetails?.ifsc || '',
        accountHolderName: profileData.vendorInfo?.bankDetails?.accountHolderName || '',
        upiId: profileData.vendorInfo?.bankDetails?.upiId || '',
        deliveryModel: profileData.vendorInfo?.deliveryModel || 'lalaji_network'
      });

      // Set store images
      setStoreImages(profileData.vendorInfo?.storeImages || []);
      setImagesToDelete([]);
      setNewImages([]);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage(null);

      // Step 1: Upload new store images first if any
      let uploadedImageUrls = [];
      if (newImages.length > 0) {
        try {
          console.log('Uploading new store images...');
          const uploadedUrls = await uploadStoreImages(newImages.map(img => img.file));
          uploadedImageUrls = uploadedUrls;
          console.log('Uploaded image URLs:', uploadedImageUrls);
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          setError('Failed to upload images. Please try again.');
          setTimeout(() => setError(null), 5000);
          return;
        }
      }

      // Step 2: Upload verification documents if any
      let uploadedDocUrls = {};
      const docTypes = Object.keys(documents);
      for (const docType of docTypes) {
        if (documents[docType]) {
          try {
            console.log(`Uploading ${docType} document...`);
            const urls = await uploadDocuments(docType, [documents[docType]]);
            if (urls && urls.length > 0) {
              uploadedDocUrls[docType] = urls[0];
            }
          } catch (uploadErr) {
            console.error(`${docType} document upload error:`, uploadErr);
            setError(`Failed to upload ${docType} document. Please try again.`);
            setTimeout(() => setError(null), 5000);
            return;
          }
        }
      }

      // Step 3: Upload QR code if any
      let uploadedQrUrl = profile?.vendorInfo?.bankDetails?.qrUpload || null;
      if (qrCodeFile) {
        try {
          console.log('Uploading QR code...');
          const qrFormData = new FormData();
          qrFormData.append('bankQR', qrCodeFile);
          
          const token = localStorage.getItem('vendor_token');
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendor/documents-cloudinary`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: qrFormData
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload QR code');
          }

          const data = await response.json();
          console.log('QR code upload response:', data);
          
          if (data.data && data.data.length > 0) {
            // Find the bankQR upload in the response
            const qrUpload = data.data.find(doc => doc.type === 'bankQR');
            if (qrUpload) {
              uploadedQrUrl = qrUpload.url;
            }
          }
        } catch (uploadErr) {
          console.error('QR code upload error:', uploadErr);
          setError(uploadErr.message || 'Failed to upload QR code. Please try again.');
          setTimeout(() => setError(null), 5000);
          return;
        }
      }

      // Step 4: Combine existing and newly uploaded images
      const updatedStoreImages = [...storeImages, ...uploadedImageUrls];

      // Step 5: Update verification documents array with new uploads
      let updatedVerificationDocs = [...(profile?.vendorInfo?.verificationDocuments || [])];
      for (const docType of Object.keys(uploadedDocUrls)) {
        const existingIndex = updatedVerificationDocs.findIndex(doc => doc.type === docType);
        if (existingIndex !== -1) {
          // Replace existing document
          updatedVerificationDocs[existingIndex] = {
            ...updatedVerificationDocs[existingIndex],
            url: uploadedDocUrls[docType],
            status: 'pending' // Reset to pending when document is updated
          };
        } else {
          // Add new document
          updatedVerificationDocs.push({
            type: docType,
            url: uploadedDocUrls[docType],
            status: 'pending'
          });
        }
      }

      // Build the update payload - preserve all existing fields and only update changed ones
      const updateData = {
        name: formData.name,
        email: formData.email,
        vendorInfo: {
          // Start with all existing vendorInfo to preserve fields like isVerified, deliveryModel, etc.
          ...profile?.vendorInfo,

          // Update business information
          businessName: formData.businessName,
          businessType: formData.businessType || profile?.vendorInfo?.businessType,
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber,
          businessOwnerName: formData.businessOwnerName,
          contactPersonName: formData.contactPersonName,
          mobileNumber: formData.mobileNumber,
          email: formData.email, // Add email to vendorInfo as well
          alternateNumber: formData.alternateNumber,

          // Update business address - preserve coordinates
          businessAddress: {
            coordinates: profile?.vendorInfo?.businessAddress?.coordinates || {
              latitude: 0,
              longitude: 0
            },
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },

          // Update bank details - include uploaded QR
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifsc: formData.ifscCode,
            accountHolderName: formData.accountHolderName,
            upiId: formData.upiId,
            qrUpload: uploadedQrUrl
          },

          // Preserve these important fields
          documents: profile?.vendorInfo?.documents || [],
          storeImages: updatedStoreImages, // Include both existing and newly uploaded images
          deliveryModel: formData.deliveryModel, // Update delivery model from form
          vendorDeliveryId: profile?.vendorInfo?.vendorDeliveryId,
          isVerified: profile?.vendorInfo?.isVerified,
          verificationStatus: profile?.vendorInfo?.verificationStatus,
          verificationDocuments: updatedVerificationDocs // Include updated documents
        }
      };

      console.log('Sending update data:', JSON.stringify(updateData, null, 2));

      const response = await updateVendorProfile(updateData);
      console.log('Update response:', response);

      setProfile(response.data || response);
      setIsEditing(false);
      setEditSection(null);
      setSuccessMessage('Profile updated successfully!');

      // Clear new images after successful upload
      newImages.forEach(img => URL.revokeObjectURL(img.preview));
      setNewImages([]);
      setImagesToDelete([]);
      
      // Clear documents and QR code states
      setDocuments({
        gst: null,
        pan: null,
        aadhar: null,
        license: null
      });
      setQrCodeFile(null);
      if (qrCodePreview) {
        URL.revokeObjectURL(qrCodePreview);
      }
      setQrCodePreview(null);

      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh profile data to get latest from server
      await fetchProfile(true);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Helper function to upload store images
  const uploadStoreImages = async (files) => {
    const token = localStorage.getItem('vendor_token');
    const formData = new FormData();

    // Append each file to FormData with field name 'storeImages'
    files.forEach((file) => {
      formData.append('storeImages', file);
    });

    try {
      // Try Cloudinary endpoint first (more reliable)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendor/documents-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload images');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Extract uploaded image URLs from response
      // The backend returns uploaded documents with their URLs
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(doc => doc.url);
      }

      return [];
    } catch (error) {
      console.error('Upload store images error:', error);
      throw error;
    }
  };

  // Helper function to upload verification documents
  const uploadDocuments = async (docType, files) => {
    const token = localStorage.getItem('vendor_token');
    const formData = new FormData();

    // Map document types to backend field names
    const fieldNameMap = {
      'gst': 'gstDocument',
      'pan': 'panDocument',
      'aadhar': 'aadharDocument',
      'license': 'licenseDocument'
    };

    const fieldName = fieldNameMap[docType] || `${docType}Document`;

    // Append each file to FormData with the correct backend field name
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendor/documents-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload documents');
      }

      const data = await response.json();
      console.log('Document upload response:', data);

      // Extract uploaded document URLs from response
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(doc => doc.url);
      }

      return [];
    } catch (error) {
      console.error('Upload documents error:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditSection(null);
    setActiveTab('basic');
    // Reset form data to profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        businessName: profile.vendorInfo?.businessName || '',
        businessType: profile.vendorInfo?.businessType || '',
        gstNumber: profile.vendorInfo?.gstNumber || '',
        panNumber: profile.vendorInfo?.panNumber || '',
        businessOwnerName: profile.vendorInfo?.businessOwnerName || '',
        contactPersonName: profile.vendorInfo?.contactPersonName || '',
        mobileNumber: profile.vendorInfo?.mobileNumber || '',
        alternateNumber: profile.vendorInfo?.alternateNumber || '',
        address: profile.vendorInfo?.businessAddress?.address || '',
        city: profile.vendorInfo?.businessAddress?.city || '',
        state: profile.vendorInfo?.businessAddress?.state || '',
        pincode: profile.vendorInfo?.businessAddress?.pincode || '',
        bankName: profile.vendorInfo?.bankDetails?.bankName || '',
        accountNumber: profile.vendorInfo?.bankDetails?.accountNumber || '',
        ifscCode: profile.vendorInfo?.bankDetails?.ifsc || '',
        accountHolderName: profile.vendorInfo?.bankDetails?.accountHolderName || '',
        upiId: profile.vendorInfo?.bankDetails?.upiId || '',
        deliveryModel: profile.vendorInfo?.deliveryModel || 'lalaji_network'
      });
      setStoreImages(profile.vendorInfo?.storeImages || []);
      setImagesToDelete([]);
      setNewImages([]);
      setDocuments({
        gst: null,
        pan: null,
        aadhar: null,
        license: null
      });
      setQrCodeFile(null);
      setQrCodePreview(null);
    }
  };

  const handleImageDelete = (imageUrl) => {
    setImagesToDelete([...imagesToDelete, imageUrl]);
    setStoreImages(storeImages.filter(img => img !== imageUrl));
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const newImagePreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewImages([...newImages, ...newImagePreviews]);
  };

  const handleImageRemove = (index) => {
    const updatedImages = [...newImages];
    URL.revokeObjectURL(updatedImages[index].preview);
    updatedImages.splice(index, 1);
    setNewImages(updatedImages);
  };

  const handleDocumentUpload = (docType, file) => {
    if (file) {
      setDocuments({
        ...documents,
        [docType]: file
      });
    }
  };

  const handleQrCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrCodeFile(file);
      setQrCodePreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError(null);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
      
      // Upload immediately
      const formData = new FormData();
      formData.append('avatar', file);
      
      const token = localStorage.getItem('vendor_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      console.log('Avatar upload response:', data);

      // Update profile with new avatar
      setProfile(prev => ({
        ...prev,
        avatar: data.data?.avatarUrl || data.data?.user?.avatar
      }));

      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
      setTimeout(() => setError(null), 5000);
      
      // Revoke preview on error
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
    }
  };

  const openFullScreen = (imageUrl, title) => {
    setFullScreenImage(imageUrl);
    setFullScreenTitle(title);
  };

  const closeFullScreen = () => {
    setFullScreenImage(null);
    setFullScreenTitle('');
  };

  const startEdit = (section) => {
    setEditSection(section);
    setIsEditing(true);
  };

  const handleFileUpload = (docKey, file) => {
    if (file) {
      setDocuments({
        ...documents,
        [docKey]: file
      });
      setSuccessMessage(`${docKey} uploaded successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setError(null);
      // Add your password update API call here
      // await updatePassword(passwordData);

      setSuccessMessage('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password');
      setTimeout(() => setError(null), 5000);
    }
  };

  const getVerificationBadge = (status) => {
    if (status === 'approved' || status === true) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Pending
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryModelBadge = (model) => {
    if (model === 'self_delivery') {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
          <TruckIcon className="h-3 w-3 mr-1" />
          Self-Delivery
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
        <TruckIcon className="h-3 w-3 mr-1" />
        Lalaji Network
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
    <div className="space-y-4">
      {/* Success/Error Messages */}
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
                <XMarkIcon className="h-4 w-4" />
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
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Profile Management</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage your account and business information
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center rounded-lg bg-blue-600 border border-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </button>
              <button
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
                className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon
                  className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </>
          ) : (
            <div className="inline-flex items-center rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-800">
              <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
              Editing Mode - Make changes and save
            </div>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-white">
                {profile?.avatar || avatarPreview ? (
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-white" />
                )}
              </div>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <button 
                onClick={() => document.getElementById('avatar-upload').click()}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 border-2 border-white transition-colors"
                title="Change profile picture"
              >
                <CameraIcon className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">{profile?.name}</h3>
                  <p className="text-sm text-gray-600">{profile?.vendorInfo?.businessName}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {profile?.vendorInfo?.isVerified ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {profile?.vendorInfo?.deliveryModel && getDeliveryModelBadge(profile.vendorInfo.deliveryModel)}
                    {profile?.isActive && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">Vendor ID</p>
                  <p className="text-xs font-mono font-semibold text-gray-900">
                    {profile?.vendorInfo?.vendorDeliveryId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-xs font-medium text-gray-900 truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PhoneIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-xs font-medium text-gray-900">{profile?.phoneNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-xs font-medium text-gray-900">{profile?.vendorInfo?.businessAddress?.city}, {profile?.vendorInfo?.businessAddress?.state}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <IdentificationIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-xs font-medium text-gray-900">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Document Verification</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {profile?.vendorInfo?.verificationDocuments?.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-2 border border-zinc-200 rounded bg-gray-50">
              <div className="flex items-center min-w-0">
                <DocumentTextIcon className="h-3.5 w-3.5 text-gray-400 mr-1 shrink-0" />
                <span className="text-xs font-medium text-gray-700 capitalize truncate">{doc.type}</span>
              </div>
              <div className="ml-1 shrink-0">
                {getVerificationBadge(doc.status)}
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 px-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-3 px-1 border-b-2 font-medium text-xs ${activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`py-3 px-1 border-b-2 font-medium text-xs ${activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Business
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`py-3 px-1 border-b-2 font-medium text-xs ${activeTab === 'bank'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Bank Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-1 border-b-2 font-medium text-xs ${activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Documents
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPersonName}
                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Alternate Number</label>
                  <input
                    type="tel"
                    value={formData.alternateNumber}
                    onChange={(e) => setFormData({ ...formData, alternateNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Details Tab */}
          {activeTab === 'business' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Owner</label>
                  <input
                    type="text"
                    value={formData.businessOwnerName}
                    onChange={(e) => setFormData({ ...formData, businessOwnerName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Business Type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 mt-3">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Delivery Settings</h4>
                
                {/* Delivery Model Toggle Switch */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label htmlFor="delivery-toggle" className="block text-sm font-medium text-gray-900 mb-1">
                        Delivery Model
                      </label>
                      <p className="text-xs text-gray-500">
                        {formData.deliveryModel === 'self_delivery' 
                          ? 'You handle your own deliveries with your delivery team' 
                          : 'Lalaji Network handles all deliveries for you'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        type="button"
                        id="delivery-toggle"
                        onClick={() => isEditing && setFormData({ 
                          ...formData, 
                          deliveryModel: formData.deliveryModel === 'lalaji_network' ? 'self_delivery' : 'lalaji_network' 
                        })}
                        disabled={!isEditing}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          formData.deliveryModel === 'self_delivery' ? 'bg-blue-600' : 'bg-gray-300'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="switch"
                        aria-checked={formData.deliveryModel === 'self_delivery'}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white  ring-0 transition duration-200 ease-in-out ${
                            formData.deliveryModel === 'self_delivery' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Delivery Model Labels */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className={`flex items-center space-x-2 ${formData.deliveryModel === 'lalaji_network' ? 'opacity-100' : 'opacity-50'}`}>
                      <TruckIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-900">Lalaji Network</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${formData.deliveryModel === 'self_delivery' ? 'opacity-100' : 'opacity-50'}`}>
                      <UserIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-gray-900">Self Delivery</span>
                    </div>
                  </div>
                  
                  {/* Info Message */}
                  {formData.deliveryModel === 'self_delivery' && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> With self-delivery, you'll need to manage your own delivery team and assign orders to them.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Other Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Delivery Model</label>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-md">
                      {formData.deliveryModel === 'self_delivery' ? (
                        <>
                          <UserIcon className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-gray-900">Self Delivery</span>
                        </>
                      ) : (
                        <>
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-900">Lalaji Network</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Verification Status</label>
                    <input
                      type="text"
                      value={profile?.vendorInfo?.verificationStatus || 'N/A'}
                      disabled
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-sm text-gray-500 capitalize cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="SBIN0001234"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="name@upi"
                  />
                </div>
              </div>

              {(profile?.vendorInfo?.bankDetails?.qrUpload || qrCodePreview || isEditing) && (
                <div className=" pt-3 mt-3">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Payment QR Code</h4>
                  <div className="flex items-start gap-3">
                    {/* QR Code Display */}
                    {(qrCodePreview || profile?.vendorInfo?.bankDetails?.qrUpload) && (
                      <div className="relative group">
                        <div className="w-48 h-48 border rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={qrCodePreview || profile.vendorInfo.bankDetails.qrUpload}
                            alt="QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {qrCodePreview && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                            New QR Code
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openFullScreen(qrCodePreview || profile.vendorInfo.bankDetails.qrUpload, 'Payment QR Code')}
                          className="absolute inset-0 bg-black/40 bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <div className="text-white text-xs font-medium flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Full Screen
                          </div>
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button in Edit Mode */}
                    {isEditing && (
                      <label className="flex-1">
                        <div className="flex flex-col items-center justify-center w-full h-48 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-600 text-center">
                            {qrCodePreview || profile?.vendorInfo?.bankDetails?.qrUpload 
                              ? 'Click to replace QR Code' 
                              : 'Click to upload QR Code'}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['gst', 'pan', 'aadhar', 'license'].map((docType) => {
                  const existingDoc = profile?.vendorInfo?.verificationDocuments?.find(doc => doc.type === docType);
                  const newDoc = documents[docType];
                  
                  return (
                    <div key={docType} className="border border-zinc-300 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-gray-900 capitalize">{docType}</h4>
                        {existingDoc && getVerificationBadge(existingDoc.status)}
                      </div>
                      
                      {/* Display existing or new document */}
                      {(existingDoc?.url || newDoc) && (
                        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-gray-50 mb-2 relative group">
                          {newDoc ? (
                            <div className="relative">
                              <div className="h-32 flex items-center justify-center bg-blue-50">
                                <DocumentIcon className="h-12 w-12 text-blue-400" />
                              </div>
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                                New Upload
                              </div>
                              <div className="absolute bottom-1 left-1 right-1 bg-white bg-opacity-90 p-1 text-xs truncate">
                                {newDoc.name}
                              </div>
                            </div>
                          ) : existingDoc?.url.toLowerCase().endsWith('.pdf') ? (
                            <div className="h-32 flex flex-col items-center justify-center">
                              <DocumentIcon className="h-12 w-12 text-gray-400" />
                              <a
                                href={existingDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <>
                              <img
                                src={existingDoc?.url}
                                alt={`${docType} document`}
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => openFullScreen(existingDoc?.url, `${docType.toUpperCase()} Document`)}
                                className="absolute inset-0 bg-black/40 bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <div className="text-white text-xs font-medium flex items-center">
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Full Screen
                                </div>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Upload button in edit mode */}
                      {isEditing && (
                        <label className="block">
                          <div className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <CloudArrowUpIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-600">
                              {newDoc || existingDoc ? 'Replace Document' : 'Upload Document'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentUpload(docType, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-300 bg-white py-1.5 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-blue-600 py-1.5 px-3 text-xs font-medium text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
      {/* Store Images */}
      {(storeImages.length > 0 || newImages.length > 0 || isEditing) && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Store Images</h3>
            {isEditing && (
              <label className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded border border-blue-200 cursor-pointer hover:bg-blue-100">
                <PhotoIcon className="h-3.5 w-3.5 mr-1" />
                Add Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {/* Existing Images */}
            {storeImages.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
                <img
                  src={image}
                  alt={`Store ${index + 1}`}
                  className="h-full w-full object-cover hover:scale-110 transition-transform duration-200 cursor-pointer"
                  onClick={() => openFullScreen(image, `Store Image ${index + 1}`)}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDelete(image);
                    }}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullScreen(image, `Store Image ${index + 1}`);
                    }}
                    className="absolute inset-0 bg-black/40 bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <div className="text-white text-xs font-medium flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </div>
                  </button>
                )}
              </div>
            ))}

            {/* New Images Preview */}
            {newImages.map((img, index) => (
              <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-blue-300 bg-blue-50 group">
                <img
                  src={img.preview}
                  alt={`New ${index + 1}`}
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => openFullScreen(img.preview, `New Store Image ${index + 1}`)}
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                  New
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageRemove(index);
                  }}
                  className="absolute top-1 right-1 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPasswordModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden  transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handlePasswordChange}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Password</label>
                      <div className="mt-1 relative">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="block w-full rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                        >
                          {showPassword.current ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Password</label>
                      <div className="mt-1 relative">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="block w-full rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        >
                          {showPassword.new ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <div className="mt-1 relative">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="block w-full rounded-md border-gray-300  focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        >
                          {showPassword.confirm ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent  px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300  px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
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

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-90 p-4"
          onClick={closeFullScreen}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-white">
              <h3 className="text-lg font-semibold">{fullScreenTitle}</h3>
              <button
                onClick={closeFullScreen}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Image Container */}
            <div 
              className="flex-1 flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullScreenImage}
                alt={fullScreenTitle}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Footer with Actions */}
            <div className="flex items-center justify-center mt-4 space-x-4">
              <a
                href={fullScreenImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Open in New Tab
              </a>
              <a
                href={fullScreenImage}
                download
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
              <button
                onClick={closeFullScreen}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Close (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;
