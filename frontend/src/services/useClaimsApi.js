import { useState, useCallback } from 'react';
import { apiService, ClaimUtils } from './api';

// Custom hook for managing claims
export const useClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Submit a single claim
  const submitClaim = useCallback(async (claimData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate claim data
      const validation = ClaimUtils.validateClaim(claimData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await apiService.submitClaim(claimData);
      
      // Add to local state if successful
      setClaims(prevClaims => [result, ...prevClaims]);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit multiple claims at once
  const submitBatchClaims = useCallback(async (claimsArray) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate all claims
      const validationErrors = [];
      claimsArray.forEach((claim, index) => {
        const validation = ClaimUtils.validateClaim(claim);
        if (!validation.isValid) {
          validationErrors.push(`Claim ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
      }

      const result = await apiService.submitBatchClaims(claimsArray);
      
      // Add to local state if successful
      if (result.claims) {
        setClaims(prevClaims => [...result.claims, ...prevClaims]);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process a single claim (update status only since backend processes automatically)
  const updateClaimStatus = useCallback(async (claimId, status, reasonCode, reasonDescription) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.updateClaimStatus(claimId, status, reasonCode, reasonDescription);
      
      // Update local state
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.claim_id === claimId || claim.id === claimId 
            ? { ...claim, ...result } 
            : claim
        )
      );
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process/update claim status (renamed from processClaim for clarity)
  const processClaim = useCallback(async (claimId, status = 'Under Review') => {
    return updateClaimStatus(claimId, status, null, 'Processing claim');
  }, [updateClaimStatus]);

  // Fetch claims with filters
  const fetchClaims = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getClaims(filters);
      setClaims(result.claims || result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process multiple claims (client-side batch processing)
  const processBatchClaims = useCallback(async (claimIds) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = [];
      const errors = [];

      for (const claimId of claimIds) {
        try {
          const result = await updateClaimStatus(claimId, 'Under Review', null, 'Batch processing');
          results.push(result);
        } catch (error) {
          errors.push({ claimId, error: error.message });
        }
      }

      return {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateClaimStatus]);

  // Get claim statistics
  const getClaimStats = useCallback(() => {
    const stats = {
      total: claims.length,
      submitted: 0,
      pending: 0,
      approved: 0,
      denied: 0,
      underReview: 0
    };

    claims.forEach(claim => {
      switch (claim.status) {
        case 'Submitted':
          stats.submitted++;
          break;
        case 'Pending':
          stats.pending++;
          break;
        case 'Approved':
          stats.approved++;
          break;
        case 'Denied':
          stats.denied++;
          break;
        case 'Under Review':
          stats.underReview++;
          break;
        default:
          break;
      }
    });

    return stats;
  }, [claims]);

  return {
    claims,
    loading,
    error,
    clearError,
    submitClaim,
    submitBatchClaims,
    processClaim,
    processBatchClaims,
    fetchClaims,
    updateClaimStatus,
    getClaimStats,
    setClaims
  };
};

// Custom hook for API health monitoring
export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    
    try {
      await apiService.healthCheck();
      setIsHealthy(true);
      setLastCheck(new Date());
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    isHealthy,
    checking,
    lastCheck,
    checkHealth
  };
};
