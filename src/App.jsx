import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  TagIcon,
  UsersIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  UserIcon,
  TruckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";

// Import pages and components
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProductManagement from "./Components/ProductManagement";
import SelectProducts from "./Components/SelectProducts";
import OrderManagement from "./Components/OrderManagement";
import InventoryManagement from "./Components/InventoryManagement";
import BillingManagement from "./Components/BillingManagement";
import WalletPayments from "./Components/WalletPayments";
import Analytics from "./Components/Analytics";
import ProfileManagement from "./Components/ProfileManagement";
import DeliveryTeamManagement from "./Components/DeliveryTeamManagement";
import ComplaintsManagement from "./Components/ComplaintsManagement";
import { auth } from "./utils/auth";

const VendorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [deliveryModel, setDeliveryModel] = useState('lalaji_network');
  const [isTogglingDelivery, setIsTogglingDelivery] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const location = useLocation();

  useEffect(() => {
    // Get user data from auth utility and localStorage
    const loadUserData = () => {
      const userData = auth.getUser();
      if (userData) {
        setUser(userData);
        // Check verification status
        const verified = userData.vendorInfo?.isVerified || false;
        const status = userData.vendorInfo?.verificationStatus || 'pending';
        setIsVerified(verified);
        setVerificationStatus(status);
        
        // Set delivery model from user data
        if (userData.vendorInfo?.deliveryModel) {
          setDeliveryModel(userData.vendorInfo.deliveryModel);
        }
      } else {
        // Try to get from localStorage as backup
        const storedUser = localStorage.getItem('vendor_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Check verification status
            const verified = parsedUser.vendorInfo?.isVerified || false;
            const status = parsedUser.vendorInfo?.verificationStatus || 'pending';
            setIsVerified(verified);
            setVerificationStatus(status);
            
            // Set delivery model from stored user data
            if (parsedUser.vendorInfo?.deliveryModel) {
              setDeliveryModel(parsedUser.vendorInfo.deliveryModel);
            }
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
      }
    };

    loadUserData();

    // Listen for storage changes (when user logs in from another tab)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.logout();
      window.location.href = "/login"; // Force page reload to clear state
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      window.location.href = "/login";
    }
  };

  const handleToggleDelivery = async () => {
    if (isTogglingDelivery) return;
    
    try {
      setIsTogglingDelivery(true);
      const newDeliveryModel = deliveryModel === 'lalaji_network' ? 'self_delivery' : 'lalaji_network';
      
      // Update via API
      const token = localStorage.getItem('vendor_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorInfo: {
            ...user?.vendorInfo,
            deliveryModel: newDeliveryModel
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryModel(newDeliveryModel);
        
        // Update user data in state and localStorage
        const updatedUser = { ...user, vendorInfo: { ...user?.vendorInfo, deliveryModel: newDeliveryModel } };
        setUser(updatedUser);
        localStorage.setItem('vendor_user', JSON.stringify(updatedUser));
      } else {
        throw new Error('Failed to update delivery model');
      }
    } catch (error) {
      console.error('Toggle delivery error:', error);
      alert('Failed to update delivery model. Please try again.');
    } finally {
      setIsTogglingDelivery(false);
    }
  };

  const navigation = [
    {
      section: "QUICK ACTIONS",
      items: [
        { name: "New Bill", href: "/billing?tab=new", icon: CreditCardIcon, requiresVerification: true, highlight: true },
      ]
    },
    {
      section: "GENERAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: HomeIcon, requiresVerification: false },
        { name: "Products", href: "/products", icon: CubeIcon, requiresVerification: true },
        { name: "Select Products", href: "/select-products", icon: TagIcon, requiresVerification: false },
        { name: "Inventory", href: "/inventory", icon: ArchiveBoxIcon, requiresVerification: true },
        { name: "Bill History", href: "/billing?tab=history", icon: DocumentTextIcon, requiresVerification: true },
        { name: "Orders", href: "/orders", icon: ShoppingBagIcon, requiresVerification: true },
        { name: "Complaints", href: "/complaints", icon: ChatBubbleLeftRightIcon, requiresVerification: true },
        { name: "Delivery Team", href: "/delivery-team", icon: TruckIcon, requiresVerification: true },
        { name: "Payouts", href: "/wallet", icon: BanknotesIcon, requiresVerification: true },
        { name: "Analytics", href: "/analytics", icon: ChartBarIcon, requiresVerification: true },
        { name: "Profile", href: "/profile", icon: UserIcon, requiresVerification: false },
      ]
    }
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 ">
            <SidebarContent
              navigation={navigation}
              onClose={() => setSidebarOpen(false)}
              isActive={isActive}
              handleLogout={handleLogout}
              collapsed={false}
              isMobile={true}
              deliveryModel={deliveryModel}
              onToggleDelivery={handleToggleDelivery}
              isTogglingDelivery={isTogglingDelivery}
              isVerified={isVerified}
              verificationStatus={verificationStatus}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-14' : 'lg:w-56'
      } border-r border-gray-200 bg-white`}>
        <SidebarContent
          navigation={navigation}
          isActive={isActive}
          handleLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={false}
          deliveryModel={deliveryModel}
          onToggleDelivery={handleToggleDelivery}
          isTogglingDelivery={isTogglingDelivery}
          isVerified={isVerified}
          verificationStatus={verificationStatus}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-14' : 'lg:pl-56'
      }`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-x-4">
              <button
                type="button"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-x-2">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center gap-x-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-['Gilroy']">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900 font-['Gilroy']">
                      {user?.name || 'Vendor Name'}
                    </p>
                    <p className="text-xs text-gray-500 font-['Gilroy']">
                      {user?.email || 'vendor@example.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1">
          <div className="mx-auto max-w-full px-6 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar component
const SidebarContent = ({ navigation, onClose, isActive, handleLogout, collapsed, onToggleCollapse, isMobile, deliveryModel, onToggleDelivery, isTogglingDelivery, isVerified = false, verificationStatus = 'pending' }) => {
  
  const handleNavigationClick = (item, e) => {
    if (item.requiresVerification && !isVerified) {
      e.preventDefault();
      alert(`Verification Required\n\nTo access ${item.name}, please complete your vendor verification process. You can start by selecting products to prepare your inventory.`);
      return false;
    }
    
    if (isMobile && onClose) {
      onClose();
    }
    return true;
  };
  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex h-14 shrink-0 items-center px-3 border-b border-gray-200">
        {!collapsed && (
          <>
            <div className="flex items-center gap-x-2 flex-1">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BuildingStorefrontIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-base font-medium text-gray-900 font-['Gilroy']">Lalaji</span>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500 font-['Gilroy'] -mt-0.5">Vendor Portal</p>
                </div>
              </div>
            </div>
            {!isMobile && (
              <button
                type="button"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all shrink-0"
                onClick={onToggleCollapse}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}
          </>
        )}
        {collapsed && !isMobile && (
          <div className="flex items-center justify-center w-full h-full relative">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative"
              onClick={onToggleCollapse}
              title={`Expand sidebar${!isVerified ? ' • Account Unverified' : ''}`}
            >
              <Bars3Icon className="h-5 w-5" />
              {!isVerified && (
                <div className="absolute -top-0.5 -right-0.5">
                  <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                </div>
              )}
            </button>
          </div>
        )}
        {isMobile && (
          <>
            <div className="flex items-center gap-x-2 flex-1">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BuildingStorefrontIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-base font-medium text-gray-900 font-['Gilroy']">Lalaji</span>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500 font-['Gilroy'] -mt-0.5">Vendor Portal</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all shrink-0"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col py-3 overflow-y-auto">
        <ul role="list" className="flex flex-1 flex-col gap-y-1 px-2">
          {navigation.map((section, sectionIdx) => (
            <li key={sectionIdx}>
              {!collapsed && (
                <div className="text-xs font-medium text-gray-400 mb-2 px-2 font-['Gilroy'] tracking-wide uppercase">
                  {section.section}
                </div>
              )}
              <ul role="list" className="space-y-0.5">
                {section.items.map((item) => {
                  const isLocked = item.requiresVerification && !isVerified;
                  const itemActive = isActive(item.href);
                  const isHighlight = item.highlight;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        to={isLocked ? '#' : item.href}
                        onClick={(e) => handleNavigationClick(item, e)}
                        className={`group flex items-center gap-x-2 rounded-lg p-2 text-sm font-medium transition-all duration-200 font-['Gilroy'] relative ${
                          itemActive && !isLocked
                            ? 'bg-blue-600 text-white'
                            : isLocked
                            ? 'text-gray-400 cursor-not-allowed opacity-60'
                            : isHighlight
                            ? 'text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 '
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? (isLocked ? `${item.name} (Verification Required)` : item.name) : undefined}
                      >
                        <div className="relative">
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                              itemActive && !isLocked 
                                ? 'text-white' 
                                : isLocked
                                ? 'text-gray-400'
                                : isHighlight
                                ? 'text-white'
                                : 'text-gray-500 group-hover:text-blue-600'
                            }`}
                          />
                          {isLocked && (
                            <LockClosedIcon className="absolute -top-0.5 -right-0.5 h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span className="truncate">{item.name}</span>
                            {isLocked && (
                              <ExclamationTriangleIcon className="h-3 w-3 text-amber-500 ml-1" />
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}

          {/* Delivery Model Toggle */}
          <li className="mt-auto mb-2 px-0">
            {!collapsed ? (
              <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-x-1.5">
                    <TruckIcon className={`h-4 w-4 ${
                      deliveryModel === 'lalaji_network' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                    <span className="text-xs font-medium text-gray-700 font-['Gilroy']">Delivery Mode</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900 font-['Gilroy']">
                      {deliveryModel === 'lalaji_network' ? 'Lalaji Network' : 'Self Delivery'}
                    </p>
                  </div>
                  <button
                    onClick={onToggleDelivery}
                    disabled={isTogglingDelivery}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      deliveryModel === 'self_delivery' ? 'bg-green-600' : 'bg-blue-600'
                    } ${isTogglingDelivery ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={`Switch to ${deliveryModel === 'lalaji_network' ? 'Self Delivery' : 'Lalaji Network'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        deliveryModel === 'self_delivery' ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onToggleDelivery}
                disabled={isTogglingDelivery}
                className={`w-full flex justify-center p-2 rounded-lg transition-all ${
                  deliveryModel === 'lalaji_network' 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'bg-green-50 hover:bg-green-100'
                } ${isTogglingDelivery ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Delivery: ${deliveryModel === 'lalaji_network' ? 'Lalaji Network' : 'Self Delivery'} - Click to toggle`}
              >
                <TruckIcon className={`h-5 w-5 ${
                  deliveryModel === 'lalaji_network' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </button>
            )}
          </li>

          {/* Logout button */}
          <li className="px-0">
            <button
              onClick={handleLogout}
              className={`group flex w-full gap-x-2 rounded-lg p-2 text-sm font-medium transition-all duration-200 font-['Gilroy'] ${
                collapsed 
                  ? 'justify-center hover:bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
              title={collapsed ? 'Sign out' : undefined}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-red-600 transition-colors duration-200" />
              {!collapsed && (
                <span className="truncate">Sign out</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use the new initialize method for better startup authentication
        const authStatus = await auth.initializeAuth();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <VendorLayout>{children}</VendorLayout>;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-products"
            element={
              <ProtectedRoute>
                <SelectProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-team"
            element={
              <ProtectedRoute>
                <DeliveryTeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
