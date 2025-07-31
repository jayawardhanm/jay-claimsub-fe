import React, { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { formatNumber, formatCurrency } from '../utils/helpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler
);

const Analytics = () => {
  const { state } = useApp();
  const { recentClaims } = state;
  
  // State for filters and data
  const [timeRange, setTimeRange] = useState('30'); // days
  const [refreshing, setRefreshing] = useState(false);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  
  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Load additional analytics data
  useEffect(() => {
    const loadAdvancedAnalytics = async () => {
      try {
        // Simulate loading advanced analytics from backend
        const data = {
          fraudScore: 0.15, // 15% fraud rate
          avgProcessingTime: 2.3, // hours
          costSavings: 125000, // dollars
          automationRate: 0.87, // 87% automated
          customerSatisfaction: 4.2, // out of 5
          complianceScore: 0.96, // 96% compliant
        };
        setAdvancedAnalytics(data);
      } catch (error) {
        console.error('Failed to load advanced analytics:', error);
      }
    };

    loadAdvancedAnalytics();
  }, [timeRange]);

  // Comprehensive analytics data processing
  const analyticsData = useMemo(() => {
    if (!recentClaims.length) return null;

    // Filter claims by time range
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    const filteredClaims = recentClaims.filter(claim => 
      new Date(claim.processedAt || claim.submission_date) >= cutoffDate
    );

    // Basic status analysis
    const statusCounts = {
      'Approved': 0,
      'Denied': 0,
      'Pending': 0,
      'Under Review': 0
    };

    // Financial analysis
    let totalClaimAmount = 0;
    let approvedAmount = 0;
    let deniedAmount = 0;
    
    // Risk analysis
    const riskFactors = {};
    const fraudIndicators = {};
    
    // Provider analysis
    const providerStats = {};
    
    // Reason code analysis
    const reasonCodes = {};
    
    // Confidence score ranges
    const confidenceRanges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0
    };

    // Processing time analysis
    const processingTimes = [];
    
    // Geographic distribution (if available)
    const geographicData = {};
    
    // Claim type analysis
    const claimTypes = {};

    // Daily/weekly volume for trend analysis
    const dailyVolume = {};
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
      dailyVolume[dateStr] = { approved: 0, denied: 0, pending: 0, total: 0 };
    }

    // Process each claim
    filteredClaims.forEach(claim => {
      // Status counting
      const status = claim.status || claim.decision || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Financial analysis
      const amount = parseFloat(claim.claim_amount || claim.amount || 0);
      totalClaimAmount += amount;
      
      if (status === 'Approved') {
        approvedAmount += amount;
      } else if (status === 'Denied') {
        deniedAmount += amount;
      }

      // Risk factors analysis
      if (claim.risk_factors && Array.isArray(claim.risk_factors)) {
        claim.risk_factors.forEach(factor => {
          riskFactors[factor] = (riskFactors[factor] || 0) + 1;
        });
      }

      // Fraud indicators
      if (claim.fraud_score > 0.5) {
        fraudIndicators['High Risk'] = (fraudIndicators['High Risk'] || 0) + 1;
      } else if (claim.fraud_score > 0.3) {
        fraudIndicators['Medium Risk'] = (fraudIndicators['Medium Risk'] || 0) + 1;
      } else {
        fraudIndicators['Low Risk'] = (fraudIndicators['Low Risk'] || 0) + 1;
      }

      // Provider analysis
      const providerId = claim.provider_id || 'Unknown';
      if (!providerStats[providerId]) {
        providerStats[providerId] = { total: 0, approved: 0, denied: 0, totalAmount: 0 };
      }
      providerStats[providerId].total++;
      providerStats[providerId].totalAmount += amount;
      if (status === 'Approved') providerStats[providerId].approved++;
      if (status === 'Denied') providerStats[providerId].denied++;

      // Reason codes
      if (claim.reason_code) {
        reasonCodes[claim.reason_code] = (reasonCodes[claim.reason_code] || 0) + 1;
      }

      // Confidence score ranges
      const score = claim.confidence_score || 0;
      if (score <= 0.2) confidenceRanges['0-20%']++;
      else if (score <= 0.4) confidenceRanges['21-40%']++;
      else if (score <= 0.6) confidenceRanges['41-60%']++;
      else if (score <= 0.8) confidenceRanges['61-80%']++;
      else confidenceRanges['81-100%']++;

      // Processing time
      if (claim.processing_time) {
        processingTimes.push(parseFloat(claim.processing_time));
      }

      // Geographic data
      if (claim.state || claim.region) {
        const location = claim.state || claim.region;
        geographicData[location] = (geographicData[location] || 0) + 1;
      }

      // Claim types
      const type = claim.claim_type || claim.type || 'General';
      claimTypes[type] = (claimTypes[type] || 0) + 1;

      // Daily volume
      try {
        const claimDate = new Date(claim.processedAt || claim.submission_date).toISOString().split('T')[0];
        if (dailyVolume[claimDate]) {
          dailyVolume[claimDate].total++;
          if (status === 'Approved') dailyVolume[claimDate].approved++;
          else if (status === 'Denied') dailyVolume[claimDate].denied++;
          else dailyVolume[claimDate].pending++;
        }
      } catch (e) {
        // Invalid date, skip
      }
    });

    return {
      statusCounts,
      reasonCodes,
      confidenceRanges,
      dailyVolume,
      last30Days,
      totalClaimAmount,
      approvedAmount,
      deniedAmount,
      riskFactors,
      fraudIndicators,
      providerStats,
      processingTimes,
      geographicData,
      claimTypes,
      totalClaims: filteredClaims.length,
      approvalRate: filteredClaims.length > 0 ? (statusCounts['Approved'] / filteredClaims.length) : 0,
      avgClaimAmount: filteredClaims.length > 0 ? (totalClaimAmount / filteredClaims.length) : 0,
      avgProcessingTime: processingTimes.length > 0 ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) : 0,
    };
  }, [recentClaims, timeRange]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger data reload
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  if (!analyticsData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and analytics for insurance claims</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Process some claims to see comprehensive analytics and insights here.</p>
        </div>
      </div>
    );
  }

  // Chart data configurations
  const statusPieData = {
    labels: Object.keys(analyticsData.statusCounts),
    datasets: [
      {
        data: Object.values(analyticsData.statusCounts),
        backgroundColor: [
          '#10b981', // Green for Approved
          '#ef4444', // Red for Denied
          '#f59e0b', // Yellow for Pending
          '#6366f1', // Indigo for Under Review
        ],
        borderColor: [
          '#059669',
          '#dc2626',
          '#d97706',
          '#4f46e5',
        ],
        borderWidth: 2,
      },
    ],
  };

  const financialBarData = {
    labels: ['Total Claims', 'Approved Amount', 'Denied Amount', 'Pending Amount'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [
          analyticsData.totalClaimAmount,
          analyticsData.approvedAmount,
          analyticsData.deniedAmount,
          analyticsData.totalClaimAmount - analyticsData.approvedAmount - analyticsData.deniedAmount,
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
        borderColor: ['#2563eb', '#059669', '#dc2626', '#d97706'],
        borderWidth: 1,
      },
    ],
  };

  const riskFactorsData = {
    labels: Object.keys(analyticsData.riskFactors).slice(0, 8),
    datasets: [
      {
        label: 'Risk Factor Frequency',
        data: Object.values(analyticsData.riskFactors).slice(0, 8),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    ],
  };

  const fraudRadarData = {
    labels: Object.keys(analyticsData.fraudIndicators),
    datasets: [
      {
        label: 'Fraud Risk Distribution',
        data: Object.values(analyticsData.fraudIndicators),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
      },
    ],
  };

  const trendLineData = {
    labels: analyticsData.last30Days,
    datasets: [
      {
        label: 'Approved',
        data: analyticsData.last30Days.map(date => analyticsData.dailyVolume[date]?.approved || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Denied',
        data: analyticsData.last30Days.map(date => analyticsData.dailyVolume[date]?.denied || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Pending',
        data: analyticsData.last30Days.map(date => analyticsData.dailyVolume[date]?.pending || 0),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const claimTypesData = {
    labels: Object.keys(analyticsData.claimTypes).slice(0, 6),
    datasets: [
      {
        data: Object.values(analyticsData.claimTypes).slice(0, 6),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
        ],
      },
    ],
  };

  // Key performance indicators
  const kpis = [
    {
      title: 'Total Claims',
      value: analyticsData.totalClaims,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Approval Rate',
      value: `${(analyticsData.approvalRate * 100).toFixed(1)}%`,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+2.3%',
      changeType: 'positive',
    },
    {
      title: 'Avg Claim Amount',
      value: `$${formatNumber(analyticsData.avgClaimAmount)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-5.1%',
      changeType: 'negative',
    },
    {
      title: 'Avg Processing Time',
      value: `${analyticsData.avgProcessingTime.toFixed(1)}h`,
      icon: ClockIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '-8.2%',
      changeType: 'positive',
    },
    {
      title: 'Fraud Detection Rate',
      value: advancedAnalytics ? `${(advancedAnalytics.fraudScore * 100).toFixed(1)}%` : 'N/A',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '+0.3%',
      changeType: 'negative',
    },
    {
      title: 'Automation Rate',
      value: advancedAnalytics ? `${(advancedAnalytics.automationRate * 100).toFixed(0)}%` : 'N/A',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Cost Savings',
      value: advancedAnalytics ? `$${formatNumber(advancedAnalytics.costSavings)}` : 'N/A',
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+22%',
      changeType: 'positive',
    },
    {
      title: 'Compliance Score',
      value: advancedAnalytics ? `${(advancedAnalytics.complianceScore * 100).toFixed(0)}%` : 'N/A',
      icon: BuildingOfficeIcon,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      change: '+1.2%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics for insurance claims processing</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Time Range Filter */}
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <div className="flex items-baseline mt-2">
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  {kpi.change && (
                    <span className={`ml-2 text-sm font-medium flex items-center ${
                      kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.changeType === 'positive' ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {kpi.change}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Claims Status Distribution */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Status Distribution</h3>
          <div className="h-64">
            <Pie data={statusPieData} options={pieOptions} />
          </div>
        </div>

        {/* Financial Analysis */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Impact Analysis</h3>
          <div className="h-64">
            <Bar data={financialBarData} options={chartOptions} />
          </div>
        </div>

        {/* Fraud Risk Assessment */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Risk Assessment</h3>
          <div className="h-64">
            <Radar data={fraudRadarData} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  grid: {
                    color: '#f3f4f6',
                  },
                },
              },
            }} />
          </div>
        </div>

        {/* Claim Types Distribution */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Types Distribution</h3>
          <div className="h-64">
            <Doughnut data={claimTypesData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Risk Factors Analysis */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risk Factors</h3>
        <div className="h-64">
          <Bar data={riskFactorsData} options={chartOptions} />
        </div>
      </div>

      {/* Claims Processing Trends */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Processing Trends (Last 30 Days)</h3>
        <div className="h-80">
          <Line data={trendLineData} options={{
            ...chartOptions,
            scales: {
              ...chartOptions.scales,
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  maxTicksLimit: 10,
                },
              },
            },
          }} />
        </div>
      </div>

      {/* Provider Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Provider Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Claims
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analyticsData.providerStats)
                .sort(([,a], [,b]) => b.total - a.total)
                .slice(0, 10)
                .map(([providerId, stats]) => {
                  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) : 0;
                  const riskScore = approvalRate < 0.5 ? 'High' : approvalRate < 0.8 ? 'Medium' : 'Low';
                  return (
                    <tr key={providerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {providerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>{(approvalRate * 100).toFixed(1)}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${approvalRate * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatNumber(stats.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          riskScore === 'High' ? 'bg-red-100 text-red-800' :
                          riskScore === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {riskScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
