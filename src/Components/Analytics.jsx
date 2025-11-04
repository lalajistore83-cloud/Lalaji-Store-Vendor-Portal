import { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getAnalytics } from '../utils/api';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeChart, setActiveChart] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
      // Mock data for demonstration
      setAnalytics({
        overview: {
          totalRevenue: 45600,
          revenueChange: 12.5,
          totalOrders: 156,
          ordersChange: 8.3,
          avgOrderValue: 292,
          avgOrderChange: 4.2,
          totalCustomers: 89,
          customersChange: 15.7
        },
        revenue: [
          { date: '2024-01-09', revenue: 5400, orders: 18, customers: 12 },
          { date: '2024-01-10', revenue: 6200, orders: 22, customers: 15 },
          { date: '2024-01-11', revenue: 4800, orders: 16, customers: 11 },
          { date: '2024-01-12', revenue: 7100, orders: 25, customers: 18 },
          { date: '2024-01-13', revenue: 6800, orders: 23, customers: 16 },
          { date: '2024-01-14', revenue: 8200, orders: 28, customers: 20 },
          { date: '2024-01-15', revenue: 7100, orders: 24, customers: 17 }
        ],
        topProducts: [
          { name: 'Organic Apples', sales: 145, revenue: 17400, percentage: 25 },
          { name: 'Fresh Milk', sales: 132, revenue: 7920, percentage: 20 },
          { name: 'Whole Wheat Bread', sales: 98, revenue: 4410, percentage: 15 },
          { name: 'Free Range Eggs', sales: 87, revenue: 6960, percentage: 12 },
          { name: 'Organic Bananas', sales: 76, revenue: 6080, percentage: 10 }
        ],
        categoryRevenue: [
          { name: 'Fruits & Vegetables', value: 18500, color: '#10B981' },
          { name: 'Dairy Products', value: 12300, color: '#3B82F6' },
          { name: 'Bakery', value: 8900, color: '#F59E0B' },
          { name: 'Beverages', value: 5900, color: '#EF4444' }
        ],
        hourlyOrders: [
          { hour: '6 AM', orders: 2 },
          { hour: '7 AM', orders: 5 },
          { hour: '8 AM', orders: 12 },
          { hour: '9 AM', orders: 18 },
          { hour: '10 AM', orders: 25 },
          { hour: '11 AM', orders: 22 },
          { hour: '12 PM', orders: 28 },
          { hour: '1 PM', orders: 24 },
          { hour: '2 PM', orders: 19 },
          { hour: '3 PM', orders: 15 },
          { hour: '4 PM', orders: 18 },
          { hour: '5 PM', orders: 23 },
          { hour: '6 PM', orders: 32 },
          { hour: '7 PM', orders: 28 },
          { hour: '8 PM', orders: 15 },
          { hour: '9 PM', orders: 8 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

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
        <div className="text-sm text-red-700">Error loading analytics: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your business performance and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      analytics.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.revenueChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(analytics.overview.revenueChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics.overview.totalOrders}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      analytics.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.ordersChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(analytics.overview.ordersChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analytics.overview.avgOrderValue)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      analytics.overview.avgOrderChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.avgOrderChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(analytics.overview.avgOrderChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics.overview.totalCustomers}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      analytics.overview.customersChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.customersChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(analytics.overview.customersChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart('revenue')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeChart === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart('orders')}
                className={`px-3 py-1 rounded-md text-sm ${
                  activeChart === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
              />
              <YAxis 
                tickFormatter={activeChart === 'revenue' ? formatCurrency : undefined}
              />
              <Tooltip 
                labelFormatter={formatDate}
                formatter={[
                  activeChart === 'revenue' ? formatCurrency : (value) => value,
                  activeChart === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey={activeChart} 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Revenue Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.categoryRevenue}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {analytics.categoryRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={[formatCurrency, 'Revenue']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.topProducts.map((product, index) => (
              <div key={product.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Best Performance</h4>
            <p className="text-sm text-gray-600 mt-1">
              Peak orders between 6-7 PM. Consider promoting products during these hours.
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Opportunity</h4>
            <p className="text-sm text-gray-600 mt-1">
              Morning hours (6-9 AM) show potential for breakfast category growth.
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Trending</h4>
            <p className="text-sm text-gray-600 mt-1">
              Organic products showing 25% higher conversion rates this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
