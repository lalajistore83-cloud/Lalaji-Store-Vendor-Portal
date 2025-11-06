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
  BarChart,
  PieChart
} from '@mui/x-charts';
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
      const response = await getAnalytics(timeRange);
      console.log('Analytics response:', response);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      setAnalytics(null);
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Error loading analytics: {error}
        </p>
      </div>
    );
  }

  if (!analytics || !analytics.overview) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          No analytics data available
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Track your business performance</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CurrencyRupeeIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                      analytics.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.revenueChange >= 0 ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(analytics.overview.revenueChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {analytics.overview.totalOrders}
                    </div>
                    <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                      analytics.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.ordersChange >= 0 ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(analytics.overview.ordersChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(analytics.overview.avgOrderValue)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                      analytics.overview.avgOrderChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.avgOrderChange >= 0 ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(analytics.overview.avgOrderChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      {analytics.overview.totalCustomers}
                    </div>
                    <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                      analytics.overview.customersChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.overview.customersChange >= 0 ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart('revenue')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeChart === 'revenue' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart('orders')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeChart === 'orders' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          <div className="w-full h-64">
            <LineChart
              dataset={analytics.revenue}
              xAxis={[{
                dataKey: 'date',
                valueFormatter: (value) => formatDate(value),
                scaleType: 'point'
              }]}
              yAxis={[{
                valueFormatter: activeChart === 'revenue' ? 
                  (value) => formatCurrency(value) : 
                  (value) => value.toString()
              }]}
              series={[{
                dataKey: activeChart,
                color: '#3B82F6',
                label: activeChart === 'revenue' ? 'Revenue' : 'Orders',
                area: true
              }]}
              width={undefined}
              height={256}
            />
          </div>
        </div>

        {/* Category Revenue Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
          <div className="w-full h-64">
            <PieChart
              series={[{
                data: analytics.categoryRevenue.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.name,
                  color: item.color
                })),
                innerRadius: 40,
                outerRadius: 80,
                paddingAngle: 2,
                cornerRadius: 5,
                highlightScope: { faded: 'global', highlighted: 'item' }
              }]}
              width={undefined}
              height={256}
            />
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.topProducts.map((product, index) => (
              <div key={product.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Orders Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Hour</h3>
          <div className="w-full h-64">
            <BarChart
              dataset={analytics.hourlyOrders}
              xAxis={[{
                dataKey: 'hour',
                scaleType: 'band'
              }]}
              yAxis={[{
                valueFormatter: (value) => value.toString()
              }]}
              series={[{
                dataKey: 'orders',
                color: '#3B82F6',
                label: 'Orders'
              }]}
              width={undefined}
              height={256}
            />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Best Performance</h4>
            <p className="text-xs text-gray-500 mt-1">
              Peak orders between 6-7 PM. Consider promoting during these hours.
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Opportunity</h4>
            <p className="text-xs text-gray-500 mt-1">
              Morning hours (6-9 AM) show potential for breakfast category growth.
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-medium text-gray-900">Trending</h4>
            <p className="text-xs text-gray-500 mt-1">
              Organic products showing 25% higher conversion rates this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
