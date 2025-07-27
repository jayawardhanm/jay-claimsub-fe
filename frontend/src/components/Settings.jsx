import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { validateApiKey, validateUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

const Settings = () => {
  const { state, actions } = useApp();
  const [formData, setFormData] = useState({
    apiBaseUrl: '',
    apiKey: '',
    theme: 'light',
    autoRefresh: false,
    refreshInterval: 30000,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    setFormData(state.settings);
  }, [state.settings]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    const urlValidation = validateUrl(formData.apiBaseUrl);
    if (!urlValidation.isValid) {
      errors.apiBaseUrl = urlValidation.error;
    }

    const keyValidation = validateApiKey(formData.apiKey);
    if (!keyValidation.isValid) {
      errors.apiKey = keyValidation.error;
    }

    if (formData.refreshInterval < 5000) {
      errors.refreshInterval = 'Refresh interval must be at least 5 seconds';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    actions.updateSettings(formData);
    toast.success('Settings saved successfully!');
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before testing connection');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Temporarily update API configuration for testing
      const originalConfig = state.settings;
      actions.updateSettings(formData);

      const result = await actions.testConnection();
      
      if (result.success) {
        setConnectionStatus({ success: true, message: 'Connection successful!' });
        toast.success('Connection test successful!');
      } else {
        setConnectionStatus({ success: false, message: result.message });
        toast.error(`Connection failed: ${result.message}`);
        // Restore original settings if test failed
        actions.updateSettings(originalConfig);
      }
    } catch (error) {
      const errorMessage = error.message || 'Connection test failed';
      setConnectionStatus({ success: false, message: errorMessage });
      toast.error(`Connection failed: ${errorMessage}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      apiBaseUrl: 'http://localhost:8000',
      apiKey: 'your_api_key_here',
      theme: 'light',
      autoRefresh: false,
      refreshInterval: 30000,
    };
    setFormData(defaultSettings);
    setValidationErrors({});
    setConnectionStatus(null);
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your application preferences and API settings</p>
      </div>

      <div className="space-y-6">
        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">API Configuration</h2>
          </div>

          <div className="space-y-4">
            {/* API Base URL */}
            <div>
              <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-gray-700 mb-1">
                API Base URL
              </label>
              <input
                type="url"
                id="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={(e) => handleInputChange('apiBaseUrl', e.target.value)}
                placeholder="http://localhost:8000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.apiBaseUrl ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.apiBaseUrl && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.apiBaseUrl}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The base URL where your backend API is running
              </p>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                    validationErrors.apiKey ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.apiKey && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.apiKey}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Your API key for authenticating with the backend service
              </p>
            </div>

            {/* Connection Test */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Connection Status</span>
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                >
                  {testingConnection ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
              
              {connectionStatus && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  connectionStatus.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {connectionStatus.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    connectionStatus.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {connectionStatus.message}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application Preferences */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Preferences</h2>

          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                id="theme"
                value={formData.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose your preferred theme (Dark theme coming soon)
              </p>
            </div>

            {/* Auto Refresh */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
                  Auto Refresh
                </label>
                <p className="text-sm text-gray-500">
                  Automatically refresh dashboard data
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={formData.autoRefresh}
                  onChange={(e) => handleInputChange('autoRefresh', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Refresh Interval */}
            {formData.autoRefresh && (
              <div>
                <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  id="refreshInterval"
                  min="5"
                  max="300"
                  value={formData.refreshInterval / 1000}
                  onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value) * 1000)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.refreshInterval ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.refreshInterval && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.refreshInterval}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  How often to refresh data (minimum 5 seconds)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="btn-secondary"
          >
            Reset to Defaults
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Setup Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure your backend is running on the specified URL</li>
            <li>• Use the "Test Connection" button to verify your settings</li>
            <li>• The API key should match the one configured in your backend</li>
            <li>• Enable auto-refresh for real-time dashboard updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
