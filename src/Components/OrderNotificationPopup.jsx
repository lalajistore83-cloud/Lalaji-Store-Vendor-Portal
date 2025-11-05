import { useEffect, useState } from 'react';
import { ShoppingBagIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

const OrderNotificationPopup = ({ order, onClose, onView }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleView = () => {
    setIsVisible(false);
    setTimeout(() => onView(order), 300);
  };

  return (
    <div
      className={`fixed top-20 right-4 z-[100] transition-all duration-300 ease-out ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px', width: '90vw' }}
    >
      <div className="bg-white rounded-xl  border-2 border-green-400 overflow-hidden animate-bounce-subtle">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                <ShoppingBagIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">New Order Received! 🎉</h3>
                <p className="text-green-100 text-xs">Just now</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Order Number</p>
              <p className="text-sm font-bold text-gray-900">
                #{order.orderNumber || order._id?.slice(-8)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-lg font-bold text-green-600">
                ₹{order.totalAmount?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">
                {order.customer?.name || order.user?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium text-gray-900">
                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className="font-medium text-gray-900">
                {order.payment?.method?.toUpperCase() || 'COD'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={handleView}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700  transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              View Details
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50  transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-green-500 transition-all duration-[10000ms] ease-linear"
            style={{ width: isVisible ? '0%' : '100%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default OrderNotificationPopup;
