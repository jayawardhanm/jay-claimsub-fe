import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';

// Initial state
const initialState = {
  // UI state
  loading: false,
  error: null,
  
  // Data state
  claims: [],
  currentClaim: null,
  recentClaims: [],
  
  // Statistics
  stats: {
    totalClaims: 0,
    approvedCount: 0,
    deniedCount: 0,
    pendingCount: 0,
    approvalRate: 0,
    avgProcessingTime: 0,
  },
  
  // Settings
  settings: {
    apiBaseUrl: 'http://localhost:8000',
    apiKey: 'your_api_key_here',
    theme: 'light',
    autoRefresh: false,
    refreshInterval: 30000,
  },
  
  // Batch processing
  batchProcessing: {
    inProgress: false,
    progress: 0,
    results: [],
    errors: [],
  },
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Claims
  ADD_CLAIM: 'ADD_CLAIM',
  UPDATE_CLAIM: 'UPDATE_CLAIM',
  SET_CURRENT_CLAIM: 'SET_CURRENT_CLAIM',
  SET_RECENT_CLAIMS: 'SET_RECENT_CLAIMS',
  
  // Statistics
  UPDATE_STATS: 'UPDATE_STATS',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  
  // Batch processing
  START_BATCH_PROCESSING: 'START_BATCH_PROCESSING',
  UPDATE_BATCH_PROGRESS: 'UPDATE_BATCH_PROGRESS',
  FINISH_BATCH_PROCESSING: 'FINISH_BATCH_PROCESSING',
  ADD_BATCH_RESULT: 'ADD_BATCH_RESULT',
  ADD_BATCH_ERROR: 'ADD_BATCH_ERROR',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ActionTypes.ADD_CLAIM:
      const newClaim = {
        id: action.payload.claimId,
        ...action.payload.result,
        processedAt: new Date().toISOString(),
      };
      return {
        ...state,
        claims: [newClaim, ...state.claims],
        recentClaims: [newClaim, ...state.recentClaims.slice(0, 9)],
        currentClaim: newClaim,
      };
      
    case ActionTypes.SET_CURRENT_CLAIM:
      return { ...state, currentClaim: action.payload };
      
    case ActionTypes.SET_RECENT_CLAIMS:
      return { ...state, recentClaims: action.payload };
      
    case ActionTypes.UPDATE_STATS:
      return { ...state, stats: { ...state.stats, ...action.payload } };
      
    case ActionTypes.UPDATE_SETTINGS:
      const newSettings = { ...state.settings, ...action.payload };
      // Update API service configuration
      if (action.payload.apiBaseUrl || action.payload.apiKey) {
        apiService.updateConfig(
          newSettings.apiBaseUrl,
          newSettings.apiKey
        );
      }
      return { ...state, settings: newSettings };
      
    case ActionTypes.START_BATCH_PROCESSING:
      return {
        ...state,
        batchProcessing: {
          inProgress: true,
          progress: 0,
          results: [],
          errors: [],
        },
      };
      
    case ActionTypes.UPDATE_BATCH_PROGRESS:
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          progress: action.payload,
        },
      };
      
    case ActionTypes.ADD_BATCH_RESULT:
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          results: [...state.batchProcessing.results, action.payload],
        },
      };
      
    case ActionTypes.ADD_BATCH_ERROR:
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          errors: [...state.batchProcessing.errors, action.payload],
        },
      };
      
    case ActionTypes.FINISH_BATCH_PROCESSING:
      return {
        ...state,
        batchProcessing: {
          ...state.batchProcessing,
          inProgress: false,
          progress: 100,
        },
      };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('claimProcessorSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    
    // Load recent claims from localStorage
    const savedClaims = localStorage.getItem('recentClaims');
    if (savedClaims) {
      try {
        const claims = JSON.parse(savedClaims);
        dispatch({ type: ActionTypes.SET_RECENT_CLAIMS, payload: claims });
      } catch (error) {
        console.error('Failed to load recent claims:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('claimProcessorSettings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Save recent claims to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recentClaims', JSON.stringify(state.recentClaims));
    
    // Update statistics
    const stats = calculateStats(state.recentClaims);
    dispatch({ type: ActionTypes.UPDATE_STATS, payload: stats });
  }, [state.recentClaims]);

  // Calculate statistics from claims data
  function calculateStats(claims) {
    if (!claims.length) {
      return {
        totalClaims: 0,
        approvedCount: 0,
        deniedCount: 0,
        pendingCount: 0,
        approvalRate: 0,
        avgProcessingTime: 0,
      };
    }

    const totalClaims = claims.length;
    const approvedCount = claims.filter(c => c.decision === 'Approved').length;
    const deniedCount = claims.filter(c => c.decision === 'Denied').length;
    const pendingCount = claims.filter(c => c.decision === 'Pending').length;
    const approvalRate = totalClaims > 0 ? (approvedCount / totalClaims) * 100 : 0;

    return {
      totalClaims,
      approvedCount,
      deniedCount,
      pendingCount,
      approvalRate: Math.round(approvalRate * 100) / 100,
      avgProcessingTime: 2.3, // Mock data - in real app, calculate from processing times
    };
  }

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    
    addClaim: (claimId, result) => dispatch({ 
      type: ActionTypes.ADD_CLAIM, 
      payload: { claimId, result } 
    }),
    
    setCurrentClaim: (claim) => dispatch({ 
      type: ActionTypes.SET_CURRENT_CLAIM, 
      payload: claim 
    }),
    
    setRecentClaims: (claims) => dispatch({
      type: ActionTypes.SET_RECENT_CLAIMS,
      payload: claims
    }),
    
    updateSettings: (settings) => dispatch({ 
      type: ActionTypes.UPDATE_SETTINGS, 
      payload: settings 
    }),
    
    startBatchProcessing: () => dispatch({ type: ActionTypes.START_BATCH_PROCESSING }),
    updateBatchProgress: (progress) => dispatch({ 
      type: ActionTypes.UPDATE_BATCH_PROGRESS, 
      payload: progress 
    }),
    addBatchResult: (result) => dispatch({ 
      type: ActionTypes.ADD_BATCH_RESULT, 
      payload: result 
    }),
    addBatchError: (error) => dispatch({ 
      type: ActionTypes.ADD_BATCH_ERROR, 
      payload: error 
    }),
    finishBatchProcessing: () => dispatch({ type: ActionTypes.FINISH_BATCH_PROCESSING }),
    
    // Async actions
    async processClaim(claimId) {
      try {
        this.setLoading(true);
        this.clearError();
        
        const result = await apiService.processClaim(claimId);
        this.addClaim(claimId, result);
        
        return result;
      } catch (error) {
        this.setError(error.message);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },
    
    async loadClaims(filters = {}) {
      try {
        this.setLoading(true);
        this.clearError();
        
        const result = await apiService.getClaims(filters);
        const claims = result.claims || result;
        this.setRecentClaims(claims);
        
        return claims;
      } catch (error) {
        this.setError(error.message);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },
    
    async processPendingClaims() {
      try {
        this.startBatchProcessing();
        this.setLoading(true);
        this.clearError();
        
        const results = await apiService.processPendingClaims();
        
        // Simulate progress updates
        for (let i = 0; i < results.length; i++) {
          this.addBatchResult(results[i]);
          this.updateBatchProgress(((i + 1) / results.length) * 100);
          
          // Add small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.finishBatchProcessing();
        return results;
      } catch (error) {
        this.addBatchError(error.message);
        this.setError(error.message);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },
    
    async testConnection() {
      try {
        this.setLoading(true);
        this.clearError();
        
        const result = await apiService.testConnection();
        return result;
      } catch (error) {
        this.setError(error.message);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },
  };

  const contextValue = {
    state,
    actions,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };
