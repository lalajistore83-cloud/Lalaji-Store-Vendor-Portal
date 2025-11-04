import { useState, useEffect } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  TruckIcon,
  WalletIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { getDashboardData, getVendorStats } from '../utils/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [vendorStats, setVendorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashData, statsData] = await Promise.all([
          getDashboardData(),
          getVendorStats()
        ]);
        setDashboardData(dashData);
        setVendorStats(statsData);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">Error loading dashboard: {error}</div>
      </div>
    );
  }

  // Mock data for demonstration
  const stats = [
    {
      name: 'Total Products',
      value: '156',
      change: '+12%',
      changeType: 'increase',
      icon: CubeIcon,
      color: 'blue'
    },
    {
      name: 'Active Orders',
      value: '23',
      change: '+5',
      changeType: 'increase',
      icon: ShoppingCartIcon,
      color: 'green'
    },
    {
      name: 'Revenue Today',
      value: '₹8,540',
      change: '+18%',
      changeType: 'increase',
      icon: CurrencyRupeeIcon,
      color: 'purple'
    },
    {
      name: 'Wallet Balance',
      value: '₹12,450',
      change: '-2%',
      changeType: 'decrease',
      icon: WalletIcon,
      color: 'orange'
    }
  ];

  const revenueData = [
    { name: 'Mon', revenue: 4000, orders: 24 },
    { name: 'Tue', revenue: 3000, orders: 18 },
    { name: 'Wed', revenue: 5000, orders: 32 },
    { name: 'Thu', revenue: 4500, orders: 28 },
    { name: 'Fri', revenue: 6000, orders: 40 },
    { name: 'Sat', revenue: 7000, orders: 45 },
    { name: 'Sun', revenue: 5500, orders: 35 }
  ];

  const orderStatusData = [
    { name: 'Completed', value: 45, color: '#10B981' },
    { name: 'Processing', value: 30, color: '#3B82F6' },
    { name: 'Pending', value: 15, color: '#F59E0B' },
    { name: 'Cancelled', value: 10, color: '#EF4444' }
  ];

  const topProducts = [
    { name: 'Organic Apples', sales: 145, revenue: '₹2,890', stock: 89 },
    { name: 'Fresh Bananas', sales: 132, revenue: '₹1,980', stock: 156 },
    { name: 'Organic Milk', sales: 98, revenue: '₹1,470', stock: 45 },
    { name: 'Brown Bread', sales: 87, revenue: '₹1,218', stock: 78 },
    { name: 'Free Range Eggs', sales: 76, revenue: '₹1,140', stock: 234 }
  ];

  const recentOrders = [
    {
      id: 'ORD-001',
      customer: 'Rajesh Kumar',
      items: 3,
      amount: '₹450',
      status: 'processing',
      time: '10 mins ago'
    },
    {
      id: 'ORD-002',
      customer: 'Priya Sharma',
      items: 5,
      amount: '₹780',
      status: 'completed',
      time: '25 mins ago'
    },
    {
      id: 'ORD-003',
      customer: 'Amit Singh',
      items: 2,
      amount: '₹320',
      status: 'pending',
      time: '1 hour ago'
    },
    {
      id: 'ORD-004',
      customer: 'Sunita Devi',
      items: 4,
      amount: '₹650',
      status: 'processing',
      time: '2 hours ago'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Full Analytics
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'increase' ? (
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Weekly Revenue</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeTab === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={activeTab === 'revenue' ? 'revenue' : 'orders'} 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {topProducts.map((product, index) => (
              <div key={product.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{product.revenue}</p>
                  <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{order.amount}</p>
                    <p className="text-sm text-gray-500">{order.items} items</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {getStatusBadge(order.status)}
                  <span className="text-xs text-gray-500">{order.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              View all orders →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
