import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '' // Use proxy in development
  : process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.REACT_APP_API_KEY || 'your_api_key_here';

// Initialize localStorage with correct values if not set or if using old port 8080
const initializeApiConfig = () => {
  const storedBaseUrl = localStorage.getItem('apiBaseUrl');
  
  // If no stored URL or if it's using the old port 8080, update it
  if (!storedBaseUrl || storedBaseUrl.includes(':8080')) {
    const correctBaseUrl = process.env.NODE_ENV === 'development' 
      ? '' // Use proxy in development
      : 'http://localhost:8000';
    localStorage.setItem('apiBaseUrl', correctBaseUrl);
  }
  
  // Ensure API key is set
  if (!localStorage.getItem('apiKey')) {
    localStorage.setItem('apiKey', API_KEY);
  }
};

// Initialize configuration
initializeApiConfig();

// Create axios instance with default config
const api = axios.create({
  baseURL: localStorage.getItem('apiBaseUrl') || API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'api-key': localStorage.getItem('apiKey') || API_KEY,
  },
  timeout: 30000, // 30 seconds
  withCredentials: false, // Set to false for CORS
});

// Request interceptor for adding auth headers
api.interceptors.request.use(
  (config) => {
    // Get API key from localStorage if available
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      config.headers['api-key'] = storedApiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          throw new Error('Invalid API key. Please check your credentials.');
        case 403:
          throw new Error('Access forbidden. Please check your permissions.');
        case 404:
          throw new Error('Endpoint not found. Please check the API URL.');
        case 405:
          throw new Error('Method not allowed. The backend endpoint may not support this HTTP method.');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data?.message || `HTTP ${status}: ${error.message}`);
      }
    } else if (error.request) {
      // Network error - could be CORS or connection issue
      if (error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
        throw new Error('CORS error: Please ensure the backend server is running and configured to allow requests from this origin. Check the proxy configuration.');
      }
      throw new Error('Network error. Please check your connection and ensure the backend is running.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

// API Service Functions
export const apiService = {
  // Health check (using claims endpoint as health check)
  async healthCheck() {
    try {
      const response = await api.get('/claims/', { params: { limit: 1 } });
      return { status: 'healthy', data: response.data };
    } catch (error) {
      throw error;
    }
  },

  // Submit a new claim with complete data
  async submitClaim(claimData) {
    try {
      // Validate required fields
      const requiredFields = ['provider_id', 'risk_id', 'patient_id', 'policy_id', 'summary'];
      const missingFields = requiredFields.filter(field => !claimData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Set default values for optional fields
      const completeClaimData = {
        status: 'Submitted',
        submission_date: new Date().toISOString(),
        ex_gratia_flag: false,
        appeal_case_flag: false,
        reason_code: null,
        reason_description: null,
        ...claimData
      };

      const response = await api.post('/claims/', completeClaimData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get claim by ID
  async getClaim(claimId) {
    try {
      const response = await api.get(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all claims with optional filters
  async getClaims(filters = {}) {
    try {
      const params = {};
      
      // Add pagination parameters
      if (filters.skip !== undefined) params.skip = filters.skip;
      if (filters.limit !== undefined) params.limit = filters.limit;
      
      // For other filters, we'll need to handle them client-side since your backend
      // doesn't seem to support status/provider filtering yet
      const response = await api.get('/claims/', { params });
      
      let claims = response.data.claims || response.data;
      
      // Client-side filtering for unsupported backend filters
      if (filters.status) {
        claims = claims.filter(claim => claim.status === filters.status);
      }
      if (filters.provider_id) {
        claims = claims.filter(claim => claim.provider_id === filters.provider_id);
      }
      if (filters.patient_id) {
        claims = claims.filter(claim => claim.patient_id === filters.patient_id);
      }
      if (filters.policy_id) {
        claims = claims.filter(claim => claim.policy_id === filters.policy_id);
      }
      
      return { claims };
    } catch (error) {
      throw error;
    }
  },

  // Update claim status
  async updateClaimStatus(claimId, status, reasonCode = null, reasonDescription = null) {
    try {
      const updateData = {
        status,
        reason_code: reasonCode,
        reason_description: reasonDescription
      };

      const response = await api.put(`/claims/${claimId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Process a claim (update status to "Under Review")
  async processClaim(claimId) {
    try {
      return await this.updateClaimStatus(claimId, 'Under Review', null, 'Claim is being processed');
    } catch (error) {
      throw error;
    }
  },

  // Process all pending claims (get claims with "Submitted" status and process them)
  async processPendingClaims() {
    try {
      // Get all claims first
      const allClaims = await this.getClaims({ limit: 100 });
      const claims = allClaims.claims || allClaims;
      
      // Filter for pending/submitted claims
      const pendingClaims = claims.filter(claim => 
        claim.status === 'Submitted' || claim.status === 'Pending'
      );

      if (pendingClaims.length === 0) {
        return [];
      }

      // Process each pending claim
      const results = [];
      for (const claim of pendingClaims) {
        try {
          const result = await this.processClaim(claim.claim_id || claim.id);
          results.push({
            claim_id: claim.claim_id || claim.id,
            success: true,
            result: result,
            originalStatus: claim.status
          });
        } catch (error) {
          results.push({
            claim_id: claim.claim_id || claim.id,
            success: false,
            error: error.message,
            originalStatus: claim.status
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  },

  // Batch submit multiple claims (implement client-side since backend doesn't support it)
  async submitBatchClaims(claimsArray) {
    try {
      if (!Array.isArray(claimsArray) || claimsArray.length === 0) {
        throw new Error('Claims array is required and cannot be empty');
      }

      // Process claims sequentially to avoid overwhelming the server
      const results = [];
      const errors = [];

      for (let i = 0; i < claimsArray.length; i++) {
        try {
          const result = await this.submitClaim(claimsArray[i]);
          results.push({ index: i, success: true, data: result });
        } catch (error) {
          errors.push({ index: i, success: false, error: error.message, data: claimsArray[i] });
        }
      }

      return {
        total: claimsArray.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
    } catch (error) {
      throw error;
    }
  },

  // Provider-related endpoints
  async getProvider(providerId) {
    try {
      const response = await api.get(`/providers/${providerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Risk rating endpoints
  async getRiskRating(riskId) {
    try {
      const response = await api.get(`/risks/${riskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Insurance Policy endpoints
  async createInsurancePolicy(policyData) {
    try {
      const response = await api.post('/policies/', policyData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getInsurancePolicies(skip = 0, limit = 100) {
    try {
      const response = await api.get('/policies/', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getInsurancePolicy(policyId) {
    try {
      const response = await api.get(`/policies/${policyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Patient endpoints
  async createPatient(patientData) {
    try {
      const response = await api.post('/patients/', patientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getPatients(skip = 0, limit = 100) {
    try {
      const response = await api.get('/patients/', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getPatient(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getPatientsByPolicy(policyId) {
    try {
      const response = await api.get(`/policies/${policyId}/patients`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Test API connection
  async testConnection() {
    try {
      await this.healthCheck();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Update API configuration
  updateConfig(baseUrl, apiKey) {
    api.defaults.baseURL = baseUrl;
    api.defaults.headers['api-key'] = apiKey;
    
    // Store in localStorage
    localStorage.setItem('apiBaseUrl', baseUrl);
    localStorage.setItem('apiKey', apiKey);
  },

  // Get current configuration
  getConfig() {
    return {
      baseUrl: localStorage.getItem('apiBaseUrl') || API_BASE_URL,
      apiKey: localStorage.getItem('apiKey') || API_KEY,
    };
  },
};

// Claim data validation and utilities
export const ClaimUtils = {
  // Create a new claim object with default values
  createClaim: (claimData = {}) => ({
    provider_id: '',
    risk_id: '',
    status: 'Submitted',
    submission_date: new Date().toISOString(),
    summary: '',
    ex_gratia_flag: false,
    appeal_case_flag: false,
    reason_code: null,
    reason_description: null,
    patient_id: '',
    policy_id: '',
    ...claimData
  }),

  // Validate claim data structure
  validateClaim: (claimData) => {
    const errors = [];
    const requiredFields = ['provider_id', 'risk_id', 'patient_id', 'policy_id', 'summary'];
    
    requiredFields.forEach(field => {
      if (!claimData[field] || (typeof claimData[field] === 'string' && claimData[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    // Validate UUIDs format (basic check)
    const uuidFields = ['provider_id', 'risk_id', 'patient_id', 'policy_id'];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    uuidFields.forEach(field => {
      if (claimData[field] && !uuidRegex.test(claimData[field])) {
        errors.push(`${field} must be a valid UUID`);
      }
    });

    // Validate status
    const validStatuses = ['Submitted', 'Pending', 'Approved', 'Denied', 'Under Review'];
    if (claimData.status && !validStatuses.includes(claimData.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate boolean fields
    const booleanFields = ['ex_gratia_flag', 'appeal_case_flag'];
    booleanFields.forEach(field => {
      if (claimData[field] !== undefined && typeof claimData[field] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    });

    // Validate date format
    if (claimData.submission_date) {
      const date = new Date(claimData.submission_date);
      if (isNaN(date.getTime())) {
        errors.push('submission_date must be a valid ISO date string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format claim data for display
  formatClaimForDisplay: (claim) => ({
    ...claim,
    submission_date: claim.submission_date ? new Date(claim.submission_date).toLocaleDateString() : '',
    statusBadge: STATUS_COLORS[claim.status] || STATUS_COLORS.Pending,
    reasonText: claim.reason_code ? REASON_CODES[claim.reason_code] || claim.reason_description : ''
  }),

  // Sample claim data for testing
  getSampleClaim: () => ({
    provider_id: "c0a19ac4-96ba-4c5f-8e44-425d3173b0d6",
    risk_id: "1084bc4d-dd50-4eb4-a7da-591dc0f9bd76",
    status: "Submitted",
    submission_date: new Date().toISOString(),
    summary: "Went to a therapist for depression counselling and anti-depressant meds",
    ex_gratia_flag: false,
    appeal_case_flag: false,
    reason_code: null,
    reason_description: null,
    patient_id: "461caa86-be43-4b30-b67a-182fb964c546",
    policy_id: "3d3eef35-4bd4-4e62-a20c-58b8a85e9000"
  })
};
export const REASON_CODES = {
  AUTO_APPR: 'Automatically approved - All validation criteria met',
  HIGH_RISK_PROVIDER: 'Provider flagged for high risk activities',
  AMOUNT_EXCEEDED: 'Claim amount exceeds policy limits',
  FRAUD_SUSPECTED: 'Potential fraudulent activity detected',
  MANUAL_REVIEW: 'Requires manual review by claims adjuster',
  DOC_REQUIRED: 'Additional documentation required',
  POLICY_VIOLATION: 'Violates policy terms and conditions',
  PATIENT_ELIGIBILITY: 'Patient eligibility verification failed',
  COVERAGE_EXPIRED: 'Policy coverage has expired',
  PRE_AUTH_REQUIRED: 'Pre-authorization required for this procedure',
  DUPLICATE_CLAIM: 'Duplicate claim submission detected',
  AGE_RESTRICTION: 'Age-related coverage restrictions apply',
  RIDER_VIOLATION: 'Violates insurance rider requirements',
};

// Status colors for UI
export const STATUS_COLORS = {
  Approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: '✅',
  },
  Denied: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: '❌',
  },
  Pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: '⏳',
  },
};

// Mock data for development/testing
export const mockClaimResult = {
  decision: 'Approved',
  reason_code: 'AUTO_APPR',
  reason_description: 'All validations passed, low risk, policy active',
  confidence_score: 0.92,
  risk_factors: ['routine_procedure', 'verified_provider'],
  policy_analysis: 'Policy is active and covers the requested procedure. No exclusions apply.',
  patient_analysis: 'Patient is eligible with valid coverage. No restrictions found.',
  financial_analysis: 'Claim amount of $1,250 is within policy limits and deductible has been met.',
  medical_necessity: 'Procedure is medically necessary based on diagnosis and treatment plan.',
  fraud_indicators: 'No fraud indicators detected. Provider and patient have clean history.',
  rider_analysis: 'No additional riders required. Standard coverage applies.',
  analysis: 'This claim meets all approval criteria with high confidence. The procedure is covered under the current policy, the provider is verified and in good standing, and the patient meets all eligibility requirements. Financial analysis confirms the amount is reasonable and within limits.',
};

export default api;
