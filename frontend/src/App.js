import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import ClaimProcessor from './components/ClaimProcessor';
import ClaimHistory from './components/ClaimHistory';
import Settings from './components/Settings';
import ClaimSubmissionForm from './components/ClaimSubmissionForm';
import BackendTestComponent from './components/BackendTestComponent';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Navigation />
          
          {/* Main Content */}
          <div className="lg:pl-64">
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/process" element={<ClaimProcessorPage />} />
                <Route path="/submit" element={<ClaimSubmissionPage />} />
                <Route path="/history" element={<ClaimHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/test" element={<BackendTestPage />} />
              </Routes>
            </main>
          </div>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AppProvider>
  );
}

// Wrapper component for the ClaimProcessor page
function ClaimProcessorPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Process Claims
        </h1>
        <p className="text-gray-600">
          Process individual claims with detailed AI analysis
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <ClaimProcessor isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
}

// Wrapper component for the ClaimSubmissionForm page
function ClaimSubmissionPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit New Claim
        </h1>
        <p className="text-gray-600">
          Submit a new insurance claim for processing
        </p>
      </div>
      <ClaimSubmissionForm />
    </div>
  );
}

// Wrapper component for Backend Testing
function BackendTestPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Backend Integration Test
        </h1>
        <p className="text-gray-600">
          Test the connection and functionality of all backend endpoints
        </p>
      </div>
      <BackendTestComponent />
    </div>
  );
}

export default App;
