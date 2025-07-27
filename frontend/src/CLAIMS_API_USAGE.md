# Claims API Usage Guide - FastAPI Backend Integration

This guide shows you how to efficiently work with your FastAPI backend for claims processing.

## Backend Structure Overview

Your FastAPI backend runs on **port 8000** with these main endpoints:
- `POST /claims/` - Submit new claim (automatically processed by AI)
- `GET /claims/` - List claims with pagination
- `GET /claims/{claim_id}` - Get specific claim
- `PUT /claims/{claim_id}` - Update claim status
- `GET /providers/{provider_id}` - Get provider details
- `GET /policies/` - List insurance policies
- `GET /patients/` - List patients

## Quick Start Examples

### 1. Submit a Claim (Automatically Processed by AI)

```jsx
import { useClaims } from '../services/useClaimsApi';

function ClaimSubmissionComponent() {
  const { submitClaim, loading, error } = useClaims();

  const handleSubmit = async () => {
    try {
      const claimData = {
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
      };
      
      // Your backend automatically processes the claim with AI
      const result = await submitClaim(claimData);
      console.log('Claim submitted and processed:', result);
      
      // The result will include AI processing results:
      // - Updated status (Approved/Denied/Pending)
      // - Reason code and description
      // - AI analysis results
      
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Processing...' : 'Submit Claim'}
    </button>
  );
}
```

### 2. List and Filter Claims

```jsx
const { fetchClaims, claims } = useClaims();

// Get all claims with pagination
await fetchClaims({ skip: 0, limit: 20 });

// Client-side filtering (since your backend doesn't support status filtering yet)
await fetchClaims({ 
  skip: 0, 
  limit: 100,
  status: 'Approved'  // This will be filtered on the frontend
});

console.log('Retrieved claims:', claims);
```

### 3. Update Claim Status

```jsx
const { updateClaimStatus } = useClaims();

// Update a claim status manually
await updateClaimStatus(
  'claim-id-here', 
  'Approved', 
  'MANUAL_REVIEW', 
  'Manually approved after review'
);
```

### 4. Working with Related Data

```jsx
import { apiService } from '../services/api';

// Get provider information
const provider = await apiService.getProvider('provider-id');

// Get patient information
const patient = await apiService.getPatient('patient-id');

// Get insurance policy
const policy = await apiService.getInsurancePolicy('policy-id');

// Get all patients for a policy
const policyPatients = await apiService.getPatientsByPolicy('policy-id');
```

## Form Validation

```jsx
import { FormUtils, CLAIM_FORM_FIELDS } from '../services/claimsFormUtils';

// Validate form data
const formData = {
  provider_id: "invalid-id",
  summary: "", // Missing required field
  // ... other fields
};

const validation = FormUtils.validateForm(formData);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
  // Shows: { provider_id: ['Must be a valid UUID format'], summary: ['Claim Summary is required'] }
}
```

## Bulk Operations with CSV

```jsx
import { BulkUtils } from '../services/claimsFormUtils';

// Generate CSV template for users
const csvTemplate = BulkUtils.generateCSVTemplate();
console.log(csvTemplate);

// Parse uploaded CSV
const csvText = `provider_id,risk_id,summary,patient_id,policy_id
c0a19ac4-96ba-4c5f-8e44-425d3173b0d6,1084bc4d-dd50-4eb4-a7da-591dc0f9bd76,Therapy session,461caa86-be43-4b30-b67a-182fb964c546,3d3eef35-4bd4-4e62-a20c-58b8a85e9000`;

const claims = BulkUtils.parseCSVToClaims(csvText);

// Validate bulk data
const validation = BulkUtils.validateBulkClaims(claims);
console.log(`${validation.validCount} valid, ${validation.invalidCount} invalid`);

// Submit valid claims
if (validation.validCount > 0) {
  await submitBatchClaims(validation.valid.map(item => item.claim));
}
```

## Direct API Usage

```jsx
import { apiService } from '../services/api';

// Submit single claim
const result = await apiService.submitClaim({
  provider_id: "c0a19ac4-96ba-4c5f-8e44-425d3173b0d6",
  risk_id: "1084bc4d-dd50-4eb4-a7da-591dc0f9bd76",
  status: "Submitted",
  submission_date: "2025-07-20T23:20:00",
  summary: "Went to a therapist for depression counselling and anti-depressant meds",
  ex_gratia_flag: false,
  appeal_case_flag: false,
  reason_code: null,
  reason_description: null,
  patient_id: "461caa86-be43-4b30-b67a-182fb964c546",
  policy_id: "3d3eef35-4bd4-4e62-a20c-58b8a85e9000"
});

// Get specific claim
const claim = await apiService.getClaim('claim-id');

// Update claim status
await apiService.updateClaimStatus('claim-id', 'Approved', 'AUTO_APPR', 'Automatically approved');
```

## Error Handling

```jsx
const { submitClaim, error, clearError } = useClaims();

useEffect(() => {
  if (error) {
    // Handle error (show notification, etc.)
    console.error('Claims error:', error);
    
    // Clear error after handling
    setTimeout(clearError, 5000);
  }
}, [error, clearError]);
```

## Health Monitoring

```jsx
import { useApiHealth } from '../services/useClaimsApi';

function HealthIndicator() {
  const { isHealthy, checking, checkHealth, lastCheck } = useApiHealth();

  useEffect(() => {
    // Check health on mount
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className={`health-indicator ${isHealthy ? 'healthy' : 'unhealthy'}`}>
      API Status: {checking ? 'Checking...' : (isHealthy ? 'Healthy' : 'Down')}
      {lastCheck && <small>Last check: {lastCheck.toLocaleTimeString()}</small>}
    </div>
  );
}
```

## Tips for Efficiency

1. **Use the custom hooks** (`useClaims`, `useApiHealth`) for automatic state management
2. **Leverage validation** before API calls to catch errors early
3. **Use batch operations** when dealing with multiple claims
4. **Cache results** by not calling `fetchClaims()` unnecessarily  
5. **Use the sample data** generator for testing and examples
6. **Handle errors gracefully** with the built-in error states

## Complete Form Component

See `ClaimSubmissionForm.jsx` for a complete example of a form that:
- Uses all validation features
- Handles loading and error states
- Supports sample data loading
- Provides real-time field validation
- Formats data correctly for the API

This setup gives you the most efficient and robust way to work with claims data in your application!
