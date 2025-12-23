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
    <div className="space-y-4">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-xs text-gray-600 mt-0.5">Track your business performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <CalendarDaysIcon className="h-3 w-3 mr-1.5" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CurrencyRupeeIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      ₹3,222.45
                    </div>
                    <div className="ml-2 flex items-baseline text-xs font-semibold text-green-600">
                      <ArrowUpIcon className="h-3 w-3 shrink-0 self-center text-green-500" />
                      <span className="sr-only">Increased by</span>
                      9.1%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      12
                    </div>
                    <div className="ml-2 flex items-baseline text-xs font-semibold text-green-600">
                      <ArrowUpIcon className="h-3 w-3 shrink-0 self-center text-green-500" />
                      <span className="sr-only">Increased by</span>
                      500%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      ₹268.54
                    </div>
                    <div className="ml-2 flex items-baseline text-xs font-semibold text-red-600">
                      <ArrowDownIcon className="h-3 w-3 shrink-0 self-center text-red-500" />
                      <span className="sr-only">Decreased by</span>
                      6.8%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-semibold text-gray-900">
                      1
                    </div>
                    <div className="ml-2 flex items-baseline text-xs font-semibold text-gray-500">
                      0%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
            <div className="px-3 py-4 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm leading-6 font-medium text-gray-900">Revenue Trend</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveChart('revenue')}
                    className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded-md ${
                      activeChart === 'revenue' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveChart('orders')}
                    className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded-md ${
                      activeChart === 'orders' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Orders
                  </button>
                </div>
              </div>
              <div className="w-full h-48">
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
                  height={192}
                />
              </div>
            </div>
          </div>

          {/* Category Revenue Pie Chart */}
          <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
            <div className="px-3 py-4 sm:p-4">
              <h3 className="text-sm leading-6 font-medium text-gray-900 mb-3">Revenue by Category</h3>
              <div className="w-full h-48">
                <PieChart
                  series={[{
                    data: analytics.categoryRevenue.map((item, index) => ({
                      id: index,
                      value: item.value,
                      label: item.name,
                      color: item.color
                    })),
                    innerRadius: 30,
                    outerRadius: 70,
                    paddingAngle: 2,
                    cornerRadius: 5,
                    highlightScope: { faded: 'global', highlighted: 'item' }
                  }]}
                  width={undefined}
                  height={192}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      {/* Additional Charts Row */}
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Top Products Table */}
          <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
            <div className="px-3 py-4 sm:p-4">
              <h3 className="text-sm leading-6 font-medium text-gray-900 mb-3">Top Selling Products</h3>
              <div className="flow-root">
                <ul className="-my-3 divide-y divide-gray-200">
                  {analytics.topProducts.map((product, index) => (
                    <li key={product.name} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0">
                          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sales} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-900">
                            {formatCurrency(product.revenue)}
                          </p>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${product.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Hourly Orders Chart */}
          <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
            <div className="px-3 py-4 sm:p-4">
              <h3 className="text-sm leading-6 font-medium text-gray-900 mb-3">Orders by Hour</h3>
              <div className="w-full h-48">
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
                  height={192}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {/* Key Insights */}
      <div className="mt-4">
        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
          <div className="px-3 py-4 sm:p-4">
            <h3 className="text-sm leading-6 font-medium text-gray-900 mb-3">Key Insights</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="border-l-4 border-green-500 pl-3">
                <h4 className="text-xs font-medium text-gray-900">Best Performance</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Peak orders between 6-7 PM. Consider promoting during these hours.
                </p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-3">
                <h4 className="text-xs font-medium text-gray-900">Opportunity</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Morning hours (6-9 AM) show potential for breakfast category growth.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-3">
                <h4 className="text-xs font-medium text-gray-900">Trending</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Organic products showing 25% higher conversion rates this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
