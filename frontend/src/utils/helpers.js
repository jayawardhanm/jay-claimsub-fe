import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { REASON_CODES, STATUS_COLORS } from '../services/api';

// Date formatting utilities
export const formatDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

// Status utilities
export const getStatusStyle = (status) => {
  return STATUS_COLORS[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    icon: '❓',
  };
};

export const getStatusBadgeClasses = (status) => {
  const style = getStatusStyle(status);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${style.border}`;
};

// Confidence score utilities
export const getConfidenceColor = (score) => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const getConfidenceBarColor = (score) => {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const formatConfidenceScore = (score) => {
  return `${Math.round(score * 100)}%`;
};

// Reason code utilities
export const getReasonDescription = (reasonCode) => {
  return REASON_CODES[reasonCode] || reasonCode;
};

export const getReasonCodeColor = (reasonCode) => {
  const colors = {
    AUTO_APPR: 'text-green-600',
    HIGH_RISK_PROVIDER: 'text-red-600',
    AMOUNT_EXCEEDED: 'text-orange-600',
    FRAUD_SUSPECTED: 'text-red-600',
    MANUAL_REVIEW: 'text-yellow-600',
    DOC_REQUIRED: 'text-blue-600',
    POLICY_VIOLATION: 'text-red-600',
    PATIENT_ELIGIBILITY: 'text-orange-600',
    COVERAGE_EXPIRED: 'text-red-600',
    PRE_AUTH_REQUIRED: 'text-blue-600',
    DUPLICATE_CLAIM: 'text-yellow-600',
    AGE_RESTRICTION: 'text-orange-600',
    RIDER_VIOLATION: 'text-red-600',
  };
  return colors[reasonCode] || 'text-gray-600';
};

// Risk factor utilities
export const formatRiskFactor = (factor) => {
  return factor
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getRiskFactorColor = (factor) => {
  const riskColors = {
    high_risk: 'bg-red-100 text-red-800',
    medium_risk: 'bg-yellow-100 text-yellow-800',
    low_risk: 'bg-green-100 text-green-800',
    fraud_indicator: 'bg-red-100 text-red-800',
    verification_needed: 'bg-blue-100 text-blue-800',
    routine_procedure: 'bg-green-100 text-green-800',
    verified_provider: 'bg-green-100 text-green-800',
    new_provider: 'bg-yellow-100 text-yellow-800',
    high_amount: 'bg-orange-100 text-orange-800',
  };
  
  return riskColors[factor] || 'bg-gray-100 text-gray-800';
};

// Validation utilities
export const validateClaimId = (claimId) => {
  if (!claimId) return { isValid: false, error: 'Claim ID is required' };
  if (claimId.length < 3) return { isValid: false, error: 'Claim ID must be at least 3 characters' };
  if (!/^[A-Z0-9_-]+$/i.test(claimId)) return { isValid: false, error: 'Claim ID contains invalid characters' };
  return { isValid: true };
};

export const validateApiKey = (apiKey) => {
  if (!apiKey) return { isValid: false, error: 'API key is required' };
  if (apiKey.length < 10) return { isValid: false, error: 'API key is too short' };
  return { isValid: true };
};

export const validateUrl = (url) => {
  if (!url) return { isValid: false, error: 'URL is required' };
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Export utilities
export const exportToCSV = (data, filename = 'claims_export') => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data, filename = 'claims_export') => {
  if (!data) return;

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Search and filter utilities
export const filterClaims = (claims, filters) => {
  return claims.filter(claim => {
    if (filters.status && getClaimFieldValue(claim, 'decision') !== filters.status) return false;
    if (filters.reasonCode && claim.reason_code !== filters.reasonCode) return false;
    if (filters.claimId && !getClaimFieldValue(claim, 'id').toLowerCase().includes(filters.claimId.toLowerCase())) return false;
    if (filters.dateFrom && new Date(claim.processedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(claim.processedAt) > new Date(filters.dateTo)) return false;
    if (filters.minConfidence && claim.confidence_score < filters.minConfidence) return false;
    if (filters.maxConfidence && claim.confidence_score > filters.maxConfidence) return false;
    return true;
  });
};

// Helper function to get claim field value with fallback mapping
const getClaimFieldValue = (claim, fieldName) => {
  switch (fieldName) {
    case 'id':
      return claim.claim_id || claim.id;
    case 'decision':
      return claim.status || claim.decision;
    default:
      return claim[fieldName];
  }
};

export const sortClaims = (claims, sortBy, sortOrder = 'asc') => {
  return [...claims].sort((a, b) => {
    let aValue = getClaimFieldValue(a, sortBy);
    let bValue = getClaimFieldValue(b, sortBy);

    // Handle different data types
    if (sortBy === 'processedAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === 'confidence_score') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

// Performance utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Copy utilities
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return { success: true };
    } catch (fallbackError) {
      return { success: false, error: 'Failed to copy to clipboard' };
    }
  }
};

// Number formatting utilities
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};



// Format percentage values
export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Calculate claims metrics for insurance analytics
export const calculateClaimsMetrics = (claims) => {
  if (!claims || claims.length === 0) {
    return {
      totalClaims: 0,
      totalAmount: 0,
      averageAmount: 0,
      approvalRate: 0,
      avgProcessingTime: 0,
      fraudRate: 0,
    };
  }

  const totalClaims = claims.length;
  const totalAmount = claims.reduce((sum, claim) => sum + (parseFloat(claim.claim_amount || claim.amount) || 0), 0);
  const approvedClaims = claims.filter(claim => 
    (claim.status || claim.decision || '').toLowerCase() === 'approved'
  ).length;
  
  const fraudulentClaims = claims.filter(claim => 
    (claim.fraud_score || 0) > 0.7 || 
    (claim.risk_factors && claim.risk_factors.includes('fraud'))
  ).length;

  const processingTimes = claims
    .map(claim => parseFloat(claim.processing_time || 0))
    .filter(time => time > 0);

  return {
    totalClaims,
    totalAmount,
    averageAmount: totalAmount / totalClaims,
    approvalRate: approvedClaims / totalClaims,
    avgProcessingTime: processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0,
    fraudRate: fraudulentClaims / totalClaims,
  };
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set ${key} to localStorage:`, error);
    return false;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
    return false;
  }
};

// Error utilities
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

export const isNetworkError = (error) => {
  return !error.response && error.request;
};

export const isServerError = (error) => {
  return error.response && error.response.status >= 500;
};

export const isClientError = (error) => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};
