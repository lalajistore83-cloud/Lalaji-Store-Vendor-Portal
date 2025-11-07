import { useState, useRef, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  PhotoIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../Components/MapStyles.css';
import L from 'leaflet';
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
    latitude: '',
    longitude: '',
    
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
  const [mapPosition, setMapPosition] = useState([20.5937, 78.9629]); // Default to India center
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fix for Leaflet default markers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

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

  // Map-related functions
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setSelectedLocation([lat, lng]);
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        
        // Reverse geocoding to get address details
        reverseGeocode(lat, lng);
      },
    });

    return selectedLocation === null ? null : (
      <Marker position={selectedLocation} />
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        const address = data.address;
        setFormData(prev => ({
          ...prev,
          address: data.display_name || '',
          city: address.city || address.town || address.village || '',
          state: address.state || '',
          pincode: address.postcode || ''
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = [latitude, longitude];
          setMapPosition(newPosition);
          setSelectedLocation(newPosition);
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your current location. Please select manually on the map.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
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
        if (!formData.latitude || !formData.longitude) {
          setError('Please select your store location on the map');
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
          pincode: formData.pincode,
          coordinates: {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
          }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label htmlFor="businessOwnerName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Owner Name *
              </label>
              <input
                id="businessOwnerName"
                name="businessOwnerName"
                type="text"
                required
                value={formData.businessOwnerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Owner full name"
              />
            </div>

            <div>
              <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name *
              </label>
              <input
                id="contactPersonName"
                name="contactPersonName"
                type="text"
                required
                value={formData.contactPersonName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact person name"
              />
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Business Mobile Number
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="alternateNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Alternate Number
              </label>
              <input
                id="alternateNumber"
                name="alternateNumber"
                type="tel"
                value={formData.alternateNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91xxxxxxxxxx"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter complete business address"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State"
                />
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Select Store Location on Map *
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <MapPinIcon className="h-4 w-4" />
                  Use Current Location
                </button>
              </div>
              
              <div className="border border-gray-300 rounded-lg overflow-hidden ">
                <div className="h-80 w-full relative">
                  <MapContainer
                    center={mapPosition}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    key={mapPosition.join(',')} // Force re-render when position changes
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker />
                  </MapContainer>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  Click on the map to select your store location. The address fields will be automatically filled based on your selection.
                </p>
              </div>
              
              {selectedLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Location Selected
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1 ml-4">
                    Coordinates: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Delivery Model *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative flex cursor-pointer rounded-lg border-zinc-200 border p-4 focus:outline-none hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryModel"
                    value="lalaji_network"
                    checked={formData.deliveryModel === 'lalaji_network'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryModel === 'lalaji_network' 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {formData.deliveryModel === 'lalaji_network' && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Lalaji Network Delivery
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Use our delivery network
                      </p>
                    </div>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-lg border border-zinc-200 p-4 focus:outline-none hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryModel"
                    value="self_delivery"
                    checked={formData.deliveryModel === 'self_delivery'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryModel === 'self_delivery' 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {formData.deliveryModel === 'self_delivery' && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Self Delivery
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Handle your own deliveries
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number *
                </label>
                <input
                  id="panNumber"
                  name="panNumber"
                  type="text"
                  required
                  maxLength={10}
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  maxLength={15}
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="22AAAAA0000A1Z5 (Optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name *
              </label>
              <input
                id="accountHolderName"
                name="accountHolderName"
                type="text"
                required
                value={formData.accountHolderName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="As per bank records"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account Number *
                </label>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bank account number"
                />
              </div>

              <div>
                <label htmlFor="ifsc" className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code *
                </label>
                <input
                  id="ifsc"
                  name="ifsc"
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifsc}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="SBIN0001234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name *
              </label>
              <input
                id="bankName"
                name="bankName"
                type="text"
                required
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bank name"
              />
            </div>

            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                id="upiId"
                name="upiId"
                type="text"
                value={formData.upiId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="yourname@upi (Optional)"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Document Upload Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'panDocument', label: 'PAN Card', required: true },
                { key: 'aadharDocument', label: 'Aadhar Card', required: true },
                { key: 'gstDocument', label: 'GST Certificate', required: false },
                { key: 'licenseDocument', label: 'Business License', required: false }
              ].map(doc => (
                <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {doc.label} {doc.required && '*'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    {files[doc.key] ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <DocumentIcon className="h-6 w-6 text-blue-500" />
                          <span className="text-sm font-medium text-green-700">File Uploaded</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-900 truncate mb-1" title={files[doc.key].name}>
                            {files[doc.key].name.length > 25 ? `${files[doc.key].name.substring(0, 25)}...` : files[doc.key].name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(files[doc.key].size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <label
                          htmlFor={doc.key}
                          className="cursor-pointer text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Upload {doc.label}
                          <input
                            id={doc.key}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, doc.key)}
                            className="sr-only"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Store Images Upload */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <label
                  htmlFor="storeImages"
                  className="cursor-pointer text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Upload store images (Multiple files allowed)
                  <input
                    id="storeImages"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'storeImages')}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 10MB each)</p>
              </div>
              {files.storeImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Uploaded Files ({files.storeImages.length})
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {files.storeImages.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <PhotoIcon className="h-5 w-5 text-green-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 truncate" title={file.name}>
                              {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('storeImages', index)}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0"
                          title="Remove file"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center max-w-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BuildingStorefrontIcon className="h-9 w-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Vendor Portal</h1>
                <p className="text-blue-100">Lalaji Business Network</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">Join India's Fastest Growing Business Network</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Quick verification process</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Instant order management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Real-time analytics dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Integrated payment solutions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="w-full max-w-2xl mx-auto">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <BuildingStorefrontIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vendor Registration</h2>
                  <p className="text-sm text-gray-600">Join the Lalaji Business Network</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl  p-6 lg:p-8">
              {/* Compact Progress Steps */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {steps[currentStep - 1].title}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Step {currentStep} of {steps.length}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  ></div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between text-xs text-gray-500">
                  {steps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`flex items-center ${
                        step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${
                        step.id <= currentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.id}
                      </div>
                      <span className="hidden sm:block">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    {steps[currentStep - 1].description}
                  </p>
                </div>

                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>

                  {currentStep === 5 ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Submit Registration
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default Register;
