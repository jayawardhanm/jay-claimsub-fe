import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import {
  getStatusBadgeClasses,
  formatConfidenceScore,
  formatDate,
  formatTimeAgo,
  filterClaims,
  sortClaims,
  exportToCSV,
  exportToJSON,
  debounce,
} from '../utils/helpers';
import ClaimProcessor from './ClaimProcessor';

const ClaimHistory = () => {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    reasonCode: '',
    dateFrom: '',
    dateTo: '',
    minConfidence: '',
    maxConfidence: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'processedAt',
    direction: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showProcessor, setShowProcessor] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filteredClaims, setFilteredClaims] = useState([]);

  const { recentClaims } = state;

  // Debounced search function
  const debouncedSearch = debounce((term) => {
    const searchFilters = {
      ...filters,
      claimId: term,
    };
    const filtered = filterClaims(recentClaims, searchFilters);
    const sorted = sortClaims(filtered, sortConfig.key, sortConfig.direction);
    setFilteredClaims(sorted);
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, filters, sortConfig, recentClaims]);

  // Load claims when component mounts
  useEffect(() => {
    const loadInitialClaims = async () => {
      try {
        await actions.loadClaims({ limit: 50 }); // Load up to 50 recent claims
      } catch (error) {
        console.error('Failed to load claims:', error);
      }
    };

    // Only load if we don't have claims already
    if (recentClaims.length === 0) {
      loadInitialClaims();
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      reasonCode: '',
      dateFrom: '',
      dateTo: '',
      minConfidence: '',
      maxConfidence: '',
    });
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    try {
      await actions.loadClaims({ limit: 50 });
    } catch (error) {
      console.error('Failed to refresh claims:', error);
    }
  };

  const handleViewClaim = (claim) => {
    actions.setCurrentClaim(claim);
    setSelectedClaim(claim);
    setShowProcessor(true);
  };

  const handleExportCSV = () => {
    if (filteredClaims.length === 0) return;

    const exportData = filteredClaims.map(claim => ({
      claim_id: claim.claim_id || claim.id,
      status: claim.status || claim.decision,
      confidence_score: claim.confidence_score,
      reason_code: claim.reason_code,
      reason_description: claim.reason_description,
      risk_factors: claim.risk_factors?.join('; ') || '',
      processed_at: claim.processedAt,
      policy_analysis: claim.policy_analysis,
      patient_analysis: claim.patient_analysis,
      financial_analysis: claim.financial_analysis,
    }));

    exportToCSV(exportData, 'claims_history');
  };

  const handleExportJSON = () => {
    if (filteredClaims.length === 0) return;
    exportToJSON(filteredClaims, 'claims_history');
  };

  const getUniqueReasonCodes = () => {
    const codes = recentClaims.map(claim => claim.reason_code).filter(Boolean);
    return [...new Set(codes)];
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Claims History
        </h1>
        <p className="text-gray-600">
          Search, filter, and view all processed claims
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Claim ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={state.loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              <span>{state.loading ? 'Loading...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-blue-100 text-blue-700' : ''}`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredClaims.length === 0}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filteredClaims.length === 0}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Denied">Denied</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason Code
                </label>
                <select
                  value={filters.reasonCode}
                  onChange={(e) => handleFilterChange('reasonCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Reason Codes</option>
                  {getUniqueReasonCodes().map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Confidence
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minConfidence}
                  onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Confidence
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.maxConfidence}
                  onChange={(e) => handleFilterChange('maxConfidence', parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center space-x-2"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredClaims.length} of {recentClaims.length} claims
        </p>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Claim ID {getSortIcon('id')}
                </th>
                <th 
                  onClick={() => handleSort('decision')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status {getSortIcon('decision')}
                </th>
                <th 
                  onClick={() => handleSort('confidence_score')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Confidence {getSortIcon('confidence_score')}
                </th>
                <th 
                  onClick={() => handleSort('reason_code')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Reason {getSortIcon('reason_code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
                <th 
                  onClick={() => handleSort('processedAt')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Processed {getSortIcon('processedAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {recentClaims.length === 0 
                      ? 'No claims have been processed yet.'
                      : 'No claims match your search criteria.'
                    }
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim, index) => (
                  <tr key={claim.claim_id || claim.id || index} className="hover:bg-gray-50 table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {claim.claim_id || claim.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClasses(claim.status || claim.decision)}>
                        {claim.status || claim.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatConfidenceScore(claim.confidence_score || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {claim.reason_code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {claim.risk_factors?.slice(0, 2).map((factor, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded"
                          >
                            {factor.replace(/_/g, ' ')}
                          </span>
                        )) || (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                        {claim.risk_factors?.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{claim.risk_factors.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatTimeAgo(claim.processedAt)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(claim.processedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewClaim(claim)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Details Modal */}
      {showProcessor && (
        <ClaimProcessor
          isOpen={showProcessor}
          onClose={() => setShowProcessor(false)}
        />
      )}
    </div>
  );
};

export default ClaimHistory;
