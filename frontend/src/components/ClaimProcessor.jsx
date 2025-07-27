import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import {
  validateClaimId,
  getStatusStyle,
  formatConfidenceScore,
  getConfidenceColor,
  getConfidenceBarColor,
  getReasonDescription,
  formatRiskFactor,
  getRiskFactorColor,
  copyToClipboard,
  formatDate,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const ClaimProcessor = ({ isOpen, onClose }) => {
  const { state, actions } = useApp();
  const [claimId, setClaimId] = useState('');
  const [validation, setValidation] = useState({ isValid: true });
  const [expandedSections, setExpandedSections] = useState({
    policy: false,
    patient: false,
    financial: false,
    medical: false,
    fraud: false,
    rider: false,
    analysis: false,
  });

  const { loading, currentClaim } = state;

  useEffect(() => {
    if (currentClaim) {
      setClaimId(currentClaim.id || '');
    }
  }, [currentClaim]);

  const handleClaimIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    setClaimId(value);
    setValidation(validateClaimId(value));
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    
    const validationResult = validateClaimId(claimId);
    if (!validationResult.isValid) {
      setValidation(validationResult);
      return;
    }

    try {
      await actions.processClaim(claimId);
      toast.success('Claim processed successfully!');
    } catch (error) {
      toast.error(`Failed to process claim: ${error.message}`);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCopyResults = async () => {
    if (!currentClaim) return;

    const resultsText = `
Claim ID: ${currentClaim.id}
Decision: ${currentClaim.decision}
Confidence Score: ${formatConfidenceScore(currentClaim.confidence_score)}
Reason: ${currentClaim.reason_code} - ${currentClaim.reason_description}
Risk Factors: ${currentClaim.risk_factors?.join(', ') || 'None'}
Processed: ${formatDate(currentClaim.processedAt)}

Policy Analysis:
${currentClaim.policy_analysis}

Patient Analysis:
${currentClaim.patient_analysis}

Financial Analysis:
${currentClaim.financial_analysis}

Medical Necessity:
${currentClaim.medical_necessity}

Fraud Indicators:
${currentClaim.fraud_indicators}

Rider Analysis:
${currentClaim.rider_analysis}

Complete Analysis:
${currentClaim.analysis}
    `.trim();

    const result = await copyToClipboard(resultsText);
    if (result.success) {
      toast.success('Results copied to clipboard!');
    } else {
      toast.error('Failed to copy results');
    }
  };

  const handlePrint = () => {
    if (!currentClaim) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Claim Analysis - ${currentClaim.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .status { padding: 5px 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .approved { background-color: #d1fae5; color: #065f46; }
            .denied { background-color: #fee2e2; color: #991b1b; }
            .pending { background-color: #fef3c7; color: #92400e; }
            .section { margin: 20px 0; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .risk-factor { display: inline-block; background-color: #f3f4f6; padding: 2px 8px; margin: 2px; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Insurance Claim Analysis Report</h1>
            <p><strong>Claim ID:</strong> ${currentClaim.id}</p>
            <p><strong>Generated:</strong> ${formatDate(new Date())}</p>
          </div>
          
          <div class="section">
            <h2>Decision Summary</h2>
            <div class="status ${currentClaim.decision.toLowerCase()}">
              ${currentClaim.decision.toUpperCase()}
            </div>
            <p><strong>Confidence Score:</strong> ${formatConfidenceScore(currentClaim.confidence_score)}</p>
            <p><strong>Reason:</strong> ${currentClaim.reason_code} - ${currentClaim.reason_description}</p>
            <p><strong>Risk Factors:</strong> ${currentClaim.risk_factors?.map(f => `<span class="risk-factor">${formatRiskFactor(f)}</span>`).join(' ') || 'None'}</p>
          </div>

          <div class="section">
            <h3>Policy Analysis</h3>
            <p>${currentClaim.policy_analysis}</p>
          </div>

          <div class="section">
            <h3>Patient Analysis</h3>
            <p>${currentClaim.patient_analysis}</p>
          </div>

          <div class="section">
            <h3>Financial Analysis</h3>
            <p>${currentClaim.financial_analysis}</p>
          </div>

          <div class="section">
            <h3>Medical Necessity</h3>
            <p>${currentClaim.medical_necessity}</p>
          </div>

          <div class="section">
            <h3>Fraud Indicators</h3>
            <p>${currentClaim.fraud_indicators}</p>
          </div>

          <div class="section">
            <h3>Rider Analysis</h3>
            <p>${currentClaim.rider_analysis}</p>
          </div>

          <div class="section">
            <h3>Complete Analysis</h3>
            <p>${currentClaim.analysis}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  const statusStyle = currentClaim ? getStatusStyle(currentClaim.decision) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Claim Processor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Process Form */}
        <form onSubmit={handleProcess} className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="claimId" className="block text-sm font-medium text-gray-700 mb-1">
                Claim ID
              </label>
              <input
                type="text"
                id="claimId"
                value={claimId}
                onChange={handleClaimIdChange}
                placeholder="Enter claim ID (e.g., CLAIM001)"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !validation.isValid ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {!validation.isValid && (
                <p className="mt-1 text-sm text-red-600">{validation.error}</p>
              )}
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !validation.isValid || !claimId.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span>Process</span>
              </button>
            </div>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600">Processing claim...</p>
          </div>
        )}

        {/* Results */}
        {currentClaim && !loading && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Claim Analysis Results
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyResults}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Status and Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    {currentClaim.decision === 'Approved' && <CheckCircleIcon className="h-8 w-8 text-green-600" />}
                    {currentClaim.decision === 'Denied' && <XCircleIcon className="h-8 w-8 text-red-600" />}
                    {currentClaim.decision === 'Pending' && <ClockIcon className="h-8 w-8 text-yellow-600" />}
                    <div>
                      <div className={`text-2xl font-bold ${statusStyle?.text || 'text-gray-900'}`}>
                        {currentClaim.decision}
                      </div>
                      <div className="text-sm text-gray-600">
                        Claim ID: {currentClaim.id}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                      <span className={`font-bold ${getConfidenceColor(currentClaim.confidence_score)}`}>
                        {formatConfidenceScore(currentClaim.confidence_score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                      <div
                        className={`h-3 rounded-full ${getConfidenceBarColor(currentClaim.confidence_score)}`}
                        style={{ width: `${currentClaim.confidence_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason and Risk Factors */}
              <div className="mt-4">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Reason: </span>
                  <span className="text-gray-900">
                    {currentClaim.reason_code} - {getReasonDescription(currentClaim.reason_code)}
                  </span>
                </div>

                {currentClaim.risk_factors && currentClaim.risk_factors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Risk Factors:</span>
                    <div className="flex flex-wrap gap-2">
                      {currentClaim.risk_factors.map((factor, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskFactorColor(factor)}`}
                        >
                          {formatRiskFactor(factor)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Analysis Sections */}
            <div className="space-y-4">
              {[
                { key: 'policy', title: 'Policy Analysis', content: currentClaim.policy_analysis },
                { key: 'patient', title: 'Patient Analysis', content: currentClaim.patient_analysis },
                { key: 'financial', title: 'Financial Analysis', content: currentClaim.financial_analysis },
                { key: 'medical', title: 'Medical Necessity', content: currentClaim.medical_necessity },
                { key: 'fraud', title: 'Fraud Indicators', content: currentClaim.fraud_indicators },
                { key: 'rider', title: 'Rider Analysis', content: currentClaim.rider_analysis },
                { key: 'analysis', title: 'Complete Analysis', content: currentClaim.analysis },
              ].map((section) => (
                <div key={section.key} className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{section.title}</span>
                    {expandedSections[section.key] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedSections[section.key] && (
                    <div className="px-4 pb-4 text-gray-700 leading-relaxed">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
              Processed: {formatDate(currentClaim.processedAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimProcessor;
