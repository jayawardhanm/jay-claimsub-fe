import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { formatDate, getStatusBadgeClasses } from '../utils/helpers';
import { apiService } from '../services/api';

const Dashboard = () => {
  const { state, actions } = useApp();
  const { error } = state;
  
  // State for claim search
  const [searchClaimId, setSearchClaimId] = useState('');
  const [searchedClaim, setSearchedClaim] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  // State for lightweight stats
  const [stats, setStats] = useState({
    totalClaims: 0,
    approvedCount: 0,
    deniedCount: 0,
    pendingCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Load only basic stats without loading all claims
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        // Get just 5 claims to check if API is working, not for stats calculation
        const result = await apiService.getClaims({ limit: 5 });
        const claims = result.claims || result;
        
        // For now, just show that we have some claims
        // In the future, you could add a dedicated stats endpoint to your backend
        setStats({
          totalClaims: claims.length > 0 ? 'Available' : 0,
          approvedCount: claims.filter(claim => claim.status === 'Approved').length,
          deniedCount: claims.filter(claim => claim.status === 'Denied').length,
          pendingCount: claims.filter(claim => ['Submitted', 'Pending', 'Under Review'].includes(claim.status)).length,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Set default stats if API fails
        setStats({
          totalClaims: 'N/A',
          approvedCount: 'N/A',
          deniedCount: 'N/A',
          pendingCount: 'N/A',
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Quick stats data
  const statCards = [
    {
      title: 'Total Claims',
      value: stats.totalClaims,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Approved',
      value: stats.approvedCount,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      percentage: stats.totalClaims > 0 ? `${Math.round((stats.approvedCount / stats.totalClaims) * 100)}%` : '0%',
    },
    {
      title: 'Denied',
      value: stats.deniedCount,
      icon: XCircleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      percentage: stats.totalClaims > 0 ? `${Math.round((stats.deniedCount / stats.totalClaims) * 100)}%` : '0%',
    },
    {
      title: 'Pending',
      value: stats.pendingCount,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      percentage: stats.totalClaims > 0 ? `${Math.round((stats.pendingCount / stats.totalClaims) * 100)}%` : '0%',
    },
  ];

  const handleRefresh = async () => {
    setStatsLoading(true);
    try {
      // Just refresh the lightweight stats
      const result = await apiService.getClaims({ limit: 5 });
      const claims = result.claims || result;
      
      setStats({
        totalClaims: claims.length > 0 ? 'Available' : 0,
        approvedCount: claims.filter(claim => claim.status === 'Approved').length,
        deniedCount: claims.filter(claim => claim.status === 'Denied').length,
        pendingCount: claims.filter(claim => ['Submitted', 'Pending', 'Under Review'].includes(claim.status)).length,
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearchClaim = async (e) => {
    e.preventDefault();
    if (!searchClaimId.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchedClaim(null);

    try {
      const claim = await apiService.getClaim(searchClaimId.trim());
      setSearchedClaim(claim);
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchClaimId('');
    setSearchedClaim(null);
    setSearchError(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Claims Dashboard
            </h1>
            <p className="text-gray-600">
              View and monitor insurance claims from your backend
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={statsLoading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>{statsLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={actions.clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.percentage && (
                    <span className={`ml-2 text-sm font-medium ${stat.textColor}`}>
                      {stat.percentage}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Claim Search Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Search Claim by ID</h3>
          <p className="text-sm text-gray-600 mt-1">Enter a claim ID to retrieve specific claim details</p>
        </div>
        
        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSearchClaim} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="searchClaimId" className="block text-sm font-medium text-gray-700 mb-1">
                  Claim ID
                </label>
                <input
                  type="text"
                  id="searchClaimId"
                  value={searchClaimId}
                  onChange={(e) => setSearchClaimId(e.target.value)}
                  placeholder="Enter claim ID (e.g., claim_123)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={searchLoading}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={searchLoading || !searchClaimId.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchLoading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  )}
                  <span>{searchLoading ? 'Searching...' : 'Search'}</span>
                </button>
                {(searchedClaim || searchError) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="btn-secondary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Search Error */}
          {searchError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800">{searchError}</p>
              </div>
            </div>
          )}

          {/* Search Result */}
          {searchedClaim && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Claim Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Claim ID</label>
                  <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {searchedClaim.claim_id || searchedClaim.id || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={getStatusBadgeClasses(searchedClaim.status)}>
                      {searchedClaim.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Patient ID</label>
                  <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {searchedClaim.patient_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Policy ID</label>
                  <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {searchedClaim.policy_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Provider ID</label>
                  <p className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {searchedClaim.provider_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submission Date</label>
                  <p className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {searchedClaim.submission_date ? formatDate(searchedClaim.submission_date) : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600">Summary</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border mt-1">
                    {searchedClaim.summary || 'No summary available'}
                  </p>
                </div>
                {searchedClaim.reason_code && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Reason</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border mt-1">
                      <span className="font-medium">{searchedClaim.reason_code}</span>
                      {searchedClaim.reason_description && (
                        <span className="text-gray-600"> - {searchedClaim.reason_description}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No result message when search is complete but no claim found */}
          {!searchLoading && !searchError && !searchedClaim && searchClaimId && (
            <div className="text-center py-8 text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Enter a claim ID and click "Search" to retrieve claim details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
