import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { auth } from '../utils/auth';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    
    // Business Information
    businessName: '',
    businessOwnerName: '',
    contactPersonName: '',
    mobileNumber: '',
    alternateNumber: '',
    
    // Business Address
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Legal Information
    gstNumber: '',
    panNumber: '',
    
    // Bank Details
    accountNumber: '',
    ifsc: '',
    accountHolderName: '',
    bankName: '',
    upiId: '',
    
    // Delivery Model
    deliveryModel: 'lalaji_network'
  });

  const [files, setFiles] = useState({
    gstDocument: null,
    panDocument: null,
    aadharDocument: null,
    licenseDocument: null,
    storeImages: []
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const steps = [
    { id: 1, title: 'Personal Details', description: 'Basic account information' },
    { id: 2, title: 'Business Information', description: 'Your business details' },
    { id: 3, title: 'Address & Location', description: 'Business address details' },
    { id: 4, title: 'Legal & Banking', description: 'GST, PAN, and bank details' },
    { id: 5, title: 'Documents Upload', description: 'Upload required documents' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleFileChange = (e, fieldName) => {
    const files = Array.from(e.target.files);
    
    if (fieldName === 'storeImages') {
      setFiles(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], ...files]
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        [fieldName]: files[0]
      }));
    }
  };

  const removeFile = (fieldName, index = null) => {
    if (fieldName === 'storeImages' && index !== null) {
      setFiles(prev => ({
        ...prev,
        storeImages: prev.storeImages.filter((_, i) => i !== index)
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.phoneNumber || !formData.password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.businessName || !formData.businessOwnerName || !formData.contactPersonName) {
          setError('Please fill in all required business information');
          return false;
        }
        break;
      case 3:
        if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
          setError('Please fill in all address fields');
          return false;
        }
        if (!/^\d{6}$/.test(formData.pincode)) {
          setError('Please enter a valid 6-digit pincode');
          return false;
        }
        break;
      case 4:
        if (!formData.accountNumber || !formData.ifsc || !formData.accountHolderName || !formData.bankName) {
          setError('Please fill in all bank details');
          return false;
        }
        break;
      case 5:
        if (!files.gstDocument || !files.panDocument || !files.aadharDocument) {
          setError('Please upload all required documents');
          return false;
        }
        if (files.storeImages.length === 0) {
          setError('Please upload at least one store image');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add basic form data
      submitData.append('name', formData.name);
      submitData.append('phoneNumber', formData.phoneNumber.startsWith('+') ? formData.phoneNumber : `+91${formData.phoneNumber}`);
      submitData.append('password', formData.password);
      submitData.append('authMethod', 'password');
      
      if (formData.email && formData.email.trim()) {
        submitData.append('email', formData.email.trim());
      }

      // Create vendorInfo object
      const vendorInfo = {
        businessName: formData.businessName,
        businessOwnerName: formData.businessOwnerName,
        contactPersonName: formData.contactPersonName,
        mobileNumber: formData.mobileNumber || formData.phoneNumber,
        alternateNumber: formData.alternateNumber,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        businessAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        bankDetails: {
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          upiId: formData.upiId
        },
        deliveryModel: formData.deliveryModel,
        isVerified: false,
        verificationStatus: 'pending'
      };

      // Add vendorInfo as JSON string (required by multipart/form-data)
      submitData.append('vendorInfo', JSON.stringify(vendorInfo));

      // Add document files with correct field names expected by backend
      if (files.gstDocument) {
        submitData.append('gstDocument', files.gstDocument);
      }
      if (files.panDocument) {
        submitData.append('panDocument', files.panDocument);
      }
      if (files.aadharDocument) {
        submitData.append('aadharDocument', files.aadharDocument);
      }
      if (files.licenseDocument) {
        submitData.append('licenseDocument', files.licenseDocument);
      }

      // Add store images
      files.storeImages.forEach(file => {
        submitData.append('storeImages', file);
      });

      await auth.register(submitData);
      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your vendor account has been created and is pending verification. 
              You will be notified once your account is approved.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md  text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+91xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name *
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label htmlFor="businessOwnerName" className="block text-sm font-medium text-gray-700">
                Business Owner Name *
              </label>
              <input
                id="businessOwnerName"
                name="businessOwnerName"
                type="text"
                required
                value={formData.businessOwnerName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter business owner name"
              />
            </div>

            <div>
              <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700">
                Contact Person Name *
              </label>
              <input
                id="contactPersonName"
                name="contactPersonName"
                type="text"
                required
                value={formData.contactPersonName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                Business Mobile Number
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+91xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="alternateNumber" className="block text-sm font-medium text-gray-700">
                Alternate Number
              </label>
              <input
                id="alternateNumber"
                name="alternateNumber"
                type="tel"
                value={formData.alternateNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+91xxxxxxxxxx"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Business Address *
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                required
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter complete business address"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="City name"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="State name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                Pincode *
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="6-digit pincode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Delivery Model *
              </label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="lalaji_network"
                    name="deliveryModel"
                    type="radio"
                    value="lalaji_network"
                    checked={formData.deliveryModel === 'lalaji_network'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="lalaji_network" className="ml-3 block text-sm font-medium text-gray-700">
                    Lalaji Network Delivery
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="self_delivery"
                    name="deliveryModel"
                    type="radio"
                    value="self_delivery"
                    checked={formData.deliveryModel === 'self_delivery'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="self_delivery" className="ml-3 block text-sm font-medium text-gray-700">
                    Self Delivery
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter GST number"
                />
              </div>

              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <input
                  id="panNumber"
                  name="panNumber"
                  type="text"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter PAN number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                Bank Account Number *
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                required
                value={formData.accountNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter account number"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ifsc" className="block text-sm font-medium text-gray-700">
                  IFSC Code *
                </label>
                <input
                  id="ifsc"
                  name="ifsc"
                  type="text"
                  required
                  value={formData.ifsc}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Bank Name *
                </label>
                <input
                  id="bankName"
                  name="bankName"
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter bank name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700">
                Account Holder Name *
              </label>
              <input
                id="accountHolderName"
                name="accountHolderName"
                type="text"
                required
                value={formData.accountHolderName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter account holder name"
              />
            </div>

            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                UPI ID
              </label>
              <input
                id="upiId"
                name="upiId"
                type="text"
                value={formData.upiId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter UPI ID"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Document Upload Fields */}
            {[
              { key: 'gstDocument', label: 'GST Certificate', required: true },
              { key: 'panDocument', label: 'PAN Card', required: true },
              { key: 'aadharDocument', label: 'Aadhar Card', required: true },
              { key: 'licenseDocument', label: 'Business License', required: false }
            ].map(doc => (
              <div key={doc.key}>
                <label className="block text-sm font-medium text-gray-700">
                  {doc.label} {doc.required && '*'}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {files[doc.key] ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{files[doc.key].name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor={doc.key}
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload {doc.label}</span>
                            <input
                              id={doc.key}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, doc.key)}
                              className="sr-only"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Store Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Store Images *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="storeImages"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload store images</span>
                      <input
                        id="storeImages"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'storeImages')}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                </div>
              </div>
              {files.storeImages.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.storeImages.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('storeImages', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-x-3 mb-8">
          <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <BuildingStorefrontIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Registration</h2>
            <p className="text-sm text-gray-600">Join the Lalaji Business Network</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4  sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                    <div className="flex items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        step.id < currentStep ? 'bg-blue-600' : 
                        step.id === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <span className="text-white text-sm font-medium">{step.id}</span>
                      </div>
                      <span className="ml-4 text-sm font-medium text-gray-900 hidden sm:block">
                        {step.title}
                      </span>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="absolute top-4 left-8 -ml-px mt-0.5 h-0.5 w-full bg-gray-300" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {steps[currentStep - 1].title}
              </h3>
              <p className="text-sm text-gray-600">
                {steps[currentStep - 1].description}
              </p>
            </div>

            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="py-2 px-4 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep === 5 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 border border-transparent rounded-md  text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 border border-transparent rounded-md  text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
