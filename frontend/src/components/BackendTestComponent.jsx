import React, { useState } from 'react';
import { apiService } from '../services/api';

const BackendTestComponent = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    setTestResult('Testing backend connections...\n\n');

    try {
      // Test 1: Health check (via claims endpoint)
      try {
        await apiService.healthCheck();
        setTestResult(prev => prev + '✅ Health check: PASSED\n');
      } catch (error) {
        setTestResult(prev => prev + `❌ Health check: FAILED - ${error.message}\n`);
      }

      // Test 2: Submit a claim
      try {
        const sampleClaim = {
          provider_id: "c0a19ac4-96ba-4c5f-8e44-425d3173b0d6",
          risk_id: "1084bc4d-dd50-4eb4-a7da-591dc0f9bd76",
          status: "Submitted",
          submission_date: new Date().toISOString(),
          summary: "Test claim for backend integration",
          ex_gratia_flag: false,
          appeal_case_flag: false,
          reason_code: null,
          reason_description: null,
          patient_id: "461caa86-be43-4b30-b67a-182fb964c546",
          policy_id: "3d3eef35-4bd4-4e62-a20c-58b8a85e9000"
        };

        const result = await apiService.submitClaim(sampleClaim);
        setTestResult(prev => prev + `✅ Submit claim: PASSED - Claim ID: ${result.claim_id || result.id}\n`);
      } catch (error) {
        setTestResult(prev => prev + `❌ Submit claim: FAILED - ${error.message}\n`);
      }

      // Test 3: Get claims
      try {
        const claims = await apiService.getClaims({ limit: 5 });
        setTestResult(prev => prev + `✅ Get claims: PASSED - Found ${claims.claims?.length || 0} claims\n`);
      } catch (error) {
        setTestResult(prev => prev + `❌ Get claims: FAILED - ${error.message}\n`);
      }

      // Test 4: Test provider endpoint
      try {
        await apiService.getProvider("c0a19ac4-96ba-4c5f-8e44-425d3173b0d6");
        setTestResult(prev => prev + '✅ Get provider: PASSED\n');
      } catch (error) {
        setTestResult(prev => prev + `❌ Get provider: FAILED - ${error.message}\n`);
      }

      // Test 5: Test policies endpoint
      try {
        const policies = await apiService.getInsurancePolicies(0, 5);
        setTestResult(prev => prev + `✅ Get policies: PASSED - Found ${policies?.length || 0} policies\n`);
      } catch (error) {
        setTestResult(prev => prev + `❌ Get policies: FAILED - ${error.message}\n`);
      }

      // Test 6: Test patients endpoint
      try {
        const patients = await apiService.getPatients(0, 5);
        setTestResult(prev => prev + `✅ Get patients: PASSED - Found ${patients?.length || 0} patients\n`);
      } catch (error) {
        setTestResult(prev => prev + `❌ Get patients: FAILED - ${error.message}\n`);
      }

      setTestResult(prev => prev + '\n🎉 Backend integration test completed!');

    } catch (error) {
      setTestResult(prev => prev + `\n💥 Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Backend Integration Test</h2>
      
      <div className="mb-4">
        <button
          onClick={testEndpoints}
          disabled={loading}
          className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Testing...' : 'Test Backend Endpoints'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {testResult}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Expected Backend URLs:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• POST /claims/ - Submit new claim</li>
          <li>• GET /claims/ - List claims</li>
          <li>• GET /claims/&#123;claim_id&#125; - Get specific claim</li>
          <li>• PUT /claims/&#123;claim_id&#125; - Update claim</li>
          <li>• GET /providers/&#123;provider_id&#125; - Get provider</li>
          <li>• GET /policies/ - List policies</li>
          <li>• GET /patients/ - List patients</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Make sure your FastAPI server is running on http://localhost:8000
        </p>
      </div>
    </div>
  );
};

export default BackendTestComponent;
