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
  WalletIcon,
  ArchiveBoxIcon,
  UserIcon,
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
import ProductManagement from "./Components/ProductManagement";
import OrderManagement from "./Components/OrderManagement";
import InventoryManagement from "./Components/InventoryManagement";
import WalletPayments from "./Components/WalletPayments";
import Analytics from "./Components/Analytics";
import ProfileManagement from "./Components/ProfileManagement";
import { auth } from "./utils/auth";

const VendorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Get user data from auth utility and localStorage
    const loadUserData = () => {
      const userData = auth.getUser();
      if (userData) {
        setUser(userData);
      } else {
        // Try to get from localStorage as backup
        const storedUser = localStorage.getItem('vendor_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
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

  const navigation = [
    {
      section: "GENERAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
        { name: "Products", href: "/products", icon: CubeIcon },
        { name: "Inventory", href: "/inventory", icon: ArchiveBoxIcon },
        { name: "Orders", href: "/orders", icon: ShoppingBagIcon },
        { name: "Wallet", href: "/wallet", icon: WalletIcon },
        { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
        { name: "Profile", href: "/profile", icon: UserIcon },
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
          <div className="fixed inset-y-0 left-0 z-50 w-80 shadow-xl">
            <SidebarContent
              navigation={navigation}
              onClose={() => setSidebarOpen(false)}
              isActive={isActive}
              handleLogout={handleLogout}
              collapsed={false}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-14' : 'lg:w-56'
      }`}>
        <SidebarContent
          navigation={navigation}
          isActive={isActive}
          handleLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={false}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-14' : 'lg:pl-56'
      }`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-12 items-center justify-between px-6">
            <div className="flex items-center gap-x-4">
              <button
                type="button"
                className="-m-2 p-2 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full rounded-lg border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-['Gilroy']"
                />
              </div>

              {/* Notifications */}
              <button
                type="button"
                className="relative rounded-full bg-white p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center gap-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
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
const SidebarContent = ({ navigation, onClose, isActive, handleLogout, collapsed, onToggleCollapse, isMobile }) => {
  return (
    <div className="flex h-full flex-col gap-y-5 overflow-y-auto bg-white shadow-sm">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-x-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <BuildingStorefrontIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 font-['Gilroy']">Vendor Portal</span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <BuildingStorefrontIcon className="h-4 w-4 text-white" />
          </div>
        )}
        {isMobile && (
          <button
            type="button"
            className="-m-2 p-2 text-gray-700 hover:text-gray-900"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        {!isMobile && (
          <button
            type="button"
            className="-m-2 p-2 text-gray-700 hover:text-gray-900"
            onClick={onToggleCollapse}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col px-4 pb-3">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          {navigation.map((section, sectionIdx) => (
            <li key={sectionIdx}>
              {!collapsed && (
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2 font-['Gilroy'] tracking-wide">
                  {section.section}
                </div>
              )}
              <ul role="list" className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={isMobile ? onClose : undefined}
                      className={`group flex gap-x-2 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200 font-['Gilroy'] ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                          isActive(item.href) ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}

          {/* Logout button */}
          <li className="mt-auto">
            <button
              onClick={handleLogout}
              className={`group flex w-full gap-x-2 rounded-md p-2 text-sm leading-6 font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 transition-all duration-200 font-['Gilroy']`}
              title={collapsed ? 'Sign out' : undefined}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-700 transition-colors duration-200" />
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
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryManagement />
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
