import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  StopIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import {
  getStatusBadgeClasses,
  formatConfidenceScore,
  formatDate,
  exportToCSV,
  exportToJSON,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const BatchProcessor = ({ isOpen, onClose }) => {
  const { state, actions } = useApp();
  const [showResults, setShowResults] = useState(false);

  const { loading, batchProcessing } = state;
  const { inProgress, progress, results, errors } = batchProcessing;

  useEffect(() => {
    if (results.length > 0 && !inProgress) {
      setShowResults(true);
    }
  }, [results, inProgress]);

  const handleStartBatchProcessing = async () => {
    try {
      setShowResults(false);
      await actions.processPendingClaims();
      toast.success(`Batch processing completed! Processed ${results.length} claims.`);
    } catch (error) {
      toast.error(`Batch processing failed: ${error.message}`);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const exportData = results.map(claim => ({
      claim_id: claim.id || claim.claim_id,
      decision: claim.decision,
      confidence_score: claim.confidence_score,
      reason_code: claim.reason_code,
      reason_description: claim.reason_description,
      risk_factors: claim.risk_factors?.join('; ') || '',
      processed_at: claim.processedAt || new Date().toISOString(),
    }));

    exportToCSV(exportData, 'batch_claims_results');
    toast.success('Results exported to CSV!');
  };

  const handleExportJSON = () => {
    if (results.length === 0) return;

    exportToJSON(results, 'batch_claims_results');
    toast.success('Results exported to JSON!');
  };

  const getStatusStats = () => {
    const approved = results.filter(r => r.decision === 'Approved').length;
    const denied = results.filter(r => r.decision === 'Denied').length;
    const pending = results.filter(r => r.decision === 'Pending').length;
    
    return { approved, denied, pending, total: results.length };
  };

  if (!isOpen) return null;

  const stats = getStatusStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Batch Claims Processor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            Process multiple pending claims simultaneously using AI analysis. 
            This will process all claims currently in the pending queue.
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Batch Processing</h3>
              <p className="text-sm text-gray-600">
                {inProgress 
                  ? 'Processing claims...' 
                  : results.length > 0 
                    ? `Last batch: ${results.length} claims processed`
                    : 'Ready to process pending claims'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              {!inProgress ? (
                <button
                  onClick={handleStartBatchProcessing}
                  disabled={loading}
                  className="btn-success flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Start Processing</span>
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-not-allowed"
                >
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {inProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Processed {results.length} claims
              </div>
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-2">Processing Errors</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {showResults && results.length > 0 && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-sm text-blue-700">Total Processed</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-900">{stats.denied}</div>
                <div className="text-sm text-red-700">Denied</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Processing Results
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Claim ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Decision
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Factors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((claim, index) => (
                      <tr key={claim.id || claim.claim_id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {claim.id || claim.claim_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={getStatusBadgeClasses(claim.decision)}>
                            {claim.decision}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatConfidenceScore(claim.confidence_score || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {claim.reason_code}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {claim.risk_factors?.slice(0, 3).map((factor, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded"
                              >
                                {factor.replace(/_/g, ' ')}
                              </span>
                            )) || (
                              <span className="text-sm text-gray-400">None</span>
                            )}
                            {claim.risk_factors?.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{claim.risk_factors.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
              Batch processing completed at {formatDate(new Date())}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!inProgress && results.length === 0 && (
          <div className="text-center py-12">
            <DocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Batch Processing Results
            </h3>
            <p className="text-gray-600 mb-4">
              Start a batch processing job to see results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessor;
