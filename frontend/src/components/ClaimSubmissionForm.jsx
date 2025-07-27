import React, { useState, useEffect } from 'react';
import { useClaims } from '../services/useClaimsApi';
import { FormUtils, CLAIM_FORM_FIELDS } from '../services/claimsFormUtils';
import { ClaimUtils } from '../services/api';

const ClaimSubmissionForm = () => {
  const { submitClaim, loading, error, clearError } = useClaims();
  const [formData, setFormData] = useState(FormUtils.getInitialFormData());
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSubmitSuccess(false);

    // Validate form
    const validation = FormUtils.validateForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      // Convert form data to API format
      const apiData = FormUtils.formatFormDataForApi(formData);
      
      // Submit claim
      await submitClaim(apiData);
      
      // Reset form and show success
      setFormData(FormUtils.getInitialFormData());
      setFormErrors({});
      setSubmitSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Claim submission failed:', err);
    }
  };

  // Load sample data
  const loadSampleData = () => {
    const sampleData = FormUtils.loadSampleData();
    setFormData(sampleData);
    setFormErrors({});
  };

  // Render form field
  const renderField = (fieldName, config) => {
    const fieldError = formErrors[fieldName];
    const hasError = fieldError && fieldError.length > 0;

    switch (config.type) {
      case 'textarea':
        return (
          <div key={fieldName} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 mb-1">
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={fieldName}
              name={fieldName}
              value={formData[fieldName] || ''}
              onChange={handleChange}
              placeholder={config.placeholder}
              className={`input-field ${hasError ? 'border-red-500' : ''}`}
              rows={3}
              required={config.required}
            />
            {config.description && (
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            )}
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={fieldName} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 mb-1">
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={fieldName}
              name={fieldName}
              value={formData[fieldName] || ''}
              onChange={handleChange}
              className={`input-field ${hasError ? 'border-red-500' : ''}`}
              required={config.required}
            >
              <option value="">Select {config.label}</option>
              {config.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldName} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name={fieldName}
                checked={formData[fieldName] || false}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                {config.label}
              </span>
            </label>
            {config.description && (
              <p className="text-xs text-gray-500 ml-6">{config.description}</p>
            )}
            {hasError && (
              <p className="text-red-500 text-xs ml-6">{fieldError[0]}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={fieldName} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 mb-1">
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={config.type}
              id={fieldName}
              name={fieldName}
              value={formData[fieldName] || ''}
              onChange={handleChange}
              placeholder={config.placeholder}
              className={`input-field ${hasError ? 'border-red-500' : ''}`}
              required={config.required}
            />
            {config.description && (
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            )}
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{fieldError[0]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit New Claim</h2>
        <button
          type="button"
          onClick={loadSampleData}
          className="btn-secondary text-sm"
        >
          Load Sample Data
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          Claim submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.entries(CLAIM_FORM_FIELDS).map(([fieldName, config]) =>
          renderField(fieldName, config)
        )}

        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData(FormUtils.getInitialFormData());
              setFormErrors({});
              clearError();
            }}
            className="btn-secondary"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimSubmissionForm;
