import { ClaimUtils } from './api';

// Form field configurations for claim submission
export const CLAIM_FORM_FIELDS = {
  provider_id: {
    label: 'Provider ID',
    type: 'text',
    required: true,
    placeholder: 'e.g., c0a19ac4-96ba-4c5f-8e44-425d3173b0d6',
    validation: {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      message: 'Must be a valid UUID format'
    }
  },
  risk_id: {
    label: 'Risk ID',
    type: 'text',
    required: true,
    placeholder: 'e.g., 1084bc4d-dd50-4eb4-a7da-591dc0f9bd76',
    validation: {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      message: 'Must be a valid UUID format'
    }
  },
  patient_id: {
    label: 'Patient ID',
    type: 'text',
    required: true,
    placeholder: 'e.g., 461caa86-be43-4b30-b67a-182fb964c546',
    validation: {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      message: 'Must be a valid UUID format'
    }
  },
  policy_id: {
    label: 'Policy ID',
    type: 'text',
    required: true,
    placeholder: 'e.g., 3d3eef35-4bd4-4e62-a20c-58b8a85e9000',
    validation: {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      message: 'Must be a valid UUID format'
    }
  },
  summary: {
    label: 'Claim Summary',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the medical service or treatment...',
    validation: {
      minLength: 10,
      maxLength: 1000,
      message: 'Summary must be between 10 and 1000 characters'
    }
  },
  status: {
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'Submitted', label: 'Submitted' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Under Review', label: 'Under Review' }
    ],
    defaultValue: 'Submitted'
  },
  submission_date: {
    label: 'Submission Date',
    type: 'datetime-local',
    required: false,
    defaultValue: () => new Date().toISOString().slice(0, 16)
  },
  ex_gratia_flag: {
    label: 'Ex Gratia Payment',
    type: 'checkbox',
    required: false,
    defaultValue: false,
    description: 'Payment made without legal obligation'
  },
  appeal_case_flag: {
    label: 'Appeal Case',
    type: 'checkbox',
    required: false,
    defaultValue: false,
    description: 'This is an appeal of a previous decision'
  }
};

// Form validation utilities
export const FormUtils = {
  // Validate a single field
  validateField: (fieldName, value, config) => {
    const errors = [];
    
    // Required field check
    if (config.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${config.label} is required`);
      return errors;
    }
    
    // Skip further validation if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return errors;
    }
    
    // Pattern validation
    if (config.validation?.pattern && !config.validation.pattern.test(value)) {
      errors.push(config.validation.message || `${config.label} format is invalid`);
    }
    
    // Length validation
    if (config.validation?.minLength && value.length < config.validation.minLength) {
      errors.push(`${config.label} must be at least ${config.validation.minLength} characters`);
    }
    
    if (config.validation?.maxLength && value.length > config.validation.maxLength) {
      errors.push(`${config.label} must not exceed ${config.validation.maxLength} characters`);
    }
    
    return errors;
  },

  // Validate entire form
  validateForm: (formData) => {
    const errors = {};
    let hasErrors = false;
    
    Object.keys(CLAIM_FORM_FIELDS).forEach(fieldName => {
      const fieldConfig = CLAIM_FORM_FIELDS[fieldName];
      const fieldErrors = FormUtils.validateField(fieldName, formData[fieldName], fieldConfig);
      
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        hasErrors = true;
      }
    });
    
    return {
      isValid: !hasErrors,
      errors
    };
  },

  // Get initial form data with defaults
  getInitialFormData: () => {
    const formData = {};
    
    Object.keys(CLAIM_FORM_FIELDS).forEach(fieldName => {
      const config = CLAIM_FORM_FIELDS[fieldName];
      
      if (config.defaultValue !== undefined) {
        formData[fieldName] = typeof config.defaultValue === 'function' 
          ? config.defaultValue() 
          : config.defaultValue;
      } else {
        formData[fieldName] = config.type === 'checkbox' ? false : '';
      }
    });
    
    return formData;
  },

  // Convert form data to API format
  formatFormDataForApi: (formData) => {
    const apiData = { ...formData };
    
    // Convert datetime-local to ISO string
    if (apiData.submission_date && typeof apiData.submission_date === 'string') {
      apiData.submission_date = new Date(apiData.submission_date).toISOString();
    }
    
    // Ensure boolean fields are properly typed
    apiData.ex_gratia_flag = Boolean(apiData.ex_gratia_flag);
    apiData.appeal_case_flag = Boolean(apiData.appeal_case_flag);
    
    // Add default values for API-required fields not in form
    apiData.reason_code = apiData.reason_code || null;
    apiData.reason_description = apiData.reason_description || null;
    
    return apiData;
  },

  // Load sample data into form
  loadSampleData: () => {
    const sampleClaim = ClaimUtils.getSampleClaim();
    
    // Convert ISO date to datetime-local format for form input
    if (sampleClaim.submission_date) {
      sampleClaim.submission_date = new Date(sampleClaim.submission_date).toISOString().slice(0, 16);
    }
    
    return sampleClaim;
  }
};

// Bulk operations utilities
export const BulkUtils = {
  // Parse CSV data to claims array
  parseCSVToClaims: (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const claims = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1}: Column count mismatch`);
      }
      
      const claim = {};
      headers.forEach((header, index) => {
        claim[header] = values[index];
      });
      
      // Convert string boolean values
      if (claim.ex_gratia_flag) {
        claim.ex_gratia_flag = claim.ex_gratia_flag.toLowerCase() === 'true';
      }
      if (claim.appeal_case_flag) {
        claim.appeal_case_flag = claim.appeal_case_flag.toLowerCase() === 'true';
      }
      
      claims.push(claim);
    }
    
    return claims;
  },

  // Generate CSV template
  generateCSVTemplate: () => {
    const headers = Object.keys(CLAIM_FORM_FIELDS);
    const sampleData = ClaimUtils.getSampleClaim();
    
    const csvHeaders = headers.join(',');
    const csvSample = headers.map(header => {
      const value = sampleData[header];
      if (typeof value === 'boolean') return value.toString();
      if (value === null || value === undefined) return '';
      return value.toString();
    }).join(',');
    
    return `${csvHeaders}\n${csvSample}`;
  },

  // Validate bulk claims data
  validateBulkClaims: (claims) => {
    const results = {
      valid: [],
      invalid: [],
      totalCount: claims.length,
      validCount: 0,
      invalidCount: 0
    };
    
    claims.forEach((claim, index) => {
      const validation = ClaimUtils.validateClaim(claim);
      
      if (validation.isValid) {
        results.valid.push({ index, claim });
        results.validCount++;
      } else {
        results.invalid.push({ 
          index, 
          claim, 
          errors: validation.errors 
        });
        results.invalidCount++;
      }
    });
    
    return results;
  }
};

const claimsFormUtilities = {
  CLAIM_FORM_FIELDS,
  FormUtils,
  BulkUtils
};

export default claimsFormUtilities;
