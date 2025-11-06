import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { auth } from '../utils/auth';

const Verification = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        // Initialize auth and get user data
        const isAuth = await auth.initializeAuth();
        if (isAuth && auth.user) {
          setUser(auth.user);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, []);

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      // Fetch updated user profile
      await auth.getProfile();
      setUser(auth.user);
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If verified, redirect to dashboard
  if (user.vendorInfo?.isVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      case 'pending_resubmission':
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Verification in Progress',
          message: 'Your vendor application is being reviewed by our team. This process typically takes 1-2 business days.',
          color: 'text-blue-600'
        };
      case 'rejected':
        return {
          title: 'Application Rejected',
          message: 'Your vendor application has been rejected. Please review the feedback below and resubmit your application with the required corrections.',
          color: 'text-red-600'
        };
      case 'pending_resubmission':
        return {
          title: 'Resubmission Required',
          message: 'Additional information or documentation is required. Please review the feedback and resubmit your application.',
          color: 'text-yellow-600'
        };
      default:
        return {
          title: 'Under Review',
          message: 'Your application is being processed.',
          color: 'text-gray-600'
        };
    }
  };

  const status = user.vendorInfo?.verificationStatus || 'pending';
  const statusInfo = getStatusMessage(status);
  const rejectionReason = user.vendorInfo?.rejectionReason;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-x-3 mb-8">
          <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <BuildingStorefrontIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Portal</h2>
            <p className="text-sm text-gray-600">Lalaji Business Network</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            {getStatusIcon(status)}
            
            <h3 className={`mt-4 text-lg font-medium ${statusInfo.color}`}>
              {statusInfo.title}
            </h3>
            
            <p className="mt-2 text-sm text-gray-600">
              {statusInfo.message}
            </p>

            {rejectionReason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Rejection Reason:
                </h4>
                <p className="text-sm text-red-700">
                  {rejectionReason}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <button
                onClick={refreshStatus}
                disabled={refreshing}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </button>

              {(status === 'rejected' || status === 'pending_resubmission') && (
                <Link
                  to="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Resubmit Application
                </Link>
              )}

              <button
                onClick={auth.logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Application Details */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Application Details</h4>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Business Name:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {user.vendorInfo?.businessName || 'Not provided'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Submitted:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Status:</dt>
                <dd className={`text-sm font-medium capitalize ${statusInfo.color}`}>
                  {status.replace('_', ' ')}
                </dd>
              </div>
              {user.vendorInfo?.rejectedAt && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Rejected On:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(user.vendorInfo.rejectedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Help Section */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
            <p className="text-xs text-gray-600 mb-3">
              If you have questions about your application status, please contact our support team.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                📧 Email: vendor-support@lalaji.com
              </p>
              <p className="text-xs text-gray-500">
                📞 Phone: +91 9421742289
              </p>
              <p className="text-xs text-gray-500">
                🕒 Support Hours: 9:00 AM - 6:00 PM (Mon-Sat)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
