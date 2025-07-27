# Frontend Requirements for Insurance Claim AI Processing System

## 🎯 **Project Overview**
Build a modern, professional web frontend for an AI-powered insurance claim processing system. The frontend should provide claim management, AI analysis viewing, and administrative capabilities for insurance professionals.

## 🏗️ **Backend System Details**

### **API Endpoints Available:**
- **Base URL**: `http://localhost:8080`
- **Authentication**: API key header (`api-key: your_api_key_here`)

### **Main Endpoints:**
1. **POST** `/api/v1/claims/process`
   - **Body**: `{"claim_id": "string"}`
   - **Response**: Complete claim analysis with AI decision
   - **Purpose**: Process a single claim through AI analysis

2. **POST** `/api/v1/claims/process-pending`
   - **Body**: Empty
   - **Response**: Array of processed claims
   - **Purpose**: Batch process all pending claims

3. **GET** `/health`
   - **Response**: `{"status": "ok"}`
   - **Purpose**: Health check

### **API Response Format:**
```json
{
  "decision": "Approved|Denied|Pending",
  "reason_code": "AUTO_APPR|HIGH_RISK_PROVIDER|FRAUD_SUSPECTED|etc",
  "reason_description": "Detailed explanation",
  "confidence_score": 0.85,
  "risk_factors": ["factor1", "factor2"],
  "policy_analysis": "Policy validation details...",
  "patient_analysis": "Patient eligibility details...",
  "financial_analysis": "Financial breakdown...",
  "medical_necessity": "Medical assessment...",
  "fraud_indicators": "Fraud detection results...",
  "rider_analysis": "Insurance rider evaluation...",
  "analysis": "Complete AI reasoning..."
}
```

### **Reason Codes:**
- `AUTO_APPR`: Automatically approved
- `HIGH_RISK_PROVIDER`: Provider flagged for risks
- `AMOUNT_EXCEEDED`: Claim amount too high
- `FRAUD_SUSPECTED`: Potential fraud detected
- `MANUAL_REVIEW`: Requires manual review
- `DOC_REQUIRED`: Additional documentation needed
- `POLICY_VIOLATION`: Policy terms violated
- `PATIENT_ELIGIBILITY`: Patient eligibility issues
- `COVERAGE_EXPIRED`: Policy expired
- `PRE_AUTH_REQUIRED`: Pre-authorization needed
- `DUPLICATE_CLAIM`: Duplicate claim detected
- `AGE_RESTRICTION`: Age-related restrictions
- `RIDER_VIOLATION`: Insurance rider violations

## 🎨 **Frontend Requirements**

### **Technology Stack Preferences:**
- **Framework**: React.js (preferred) or Vue.js
- **Styling**: Tailwind CSS or Material-UI
- **State Management**: Context API or Redux Toolkit
- **HTTP Client**: Axios or Fetch API
- **Icons**: Lucide React or React Icons
- **Charts**: Chart.js or Recharts (for analytics)

### **Design Theme:**
- **Style**: Professional insurance/medical dashboard
- **Colors**: Blue/white theme with status colors (green=approved, red=denied, yellow=pending)
- **Layout**: Clean, responsive, easy-to-scan information
- **Typography**: Modern, readable fonts (Inter, Roboto, or similar)

## 📱 **Required Pages/Components**

### **1. Main Dashboard**
- **Purpose**: Overview of claim processing activity
- **Features**:
  - Quick stats cards (total claims, approved %, pending count, processing time)
  - Recent claims table with status indicators
  - Quick process claim input field
  - Batch process button for pending claims
  - Real-time status updates

### **2. Process Single Claim**
- **Features**:
  - Claim ID input field with validation
  - "Process Claim" button
  - Loading spinner during API call
  - Results display with:
    - Large status badge (Approved/Denied/Pending)
    - Confidence score with progress bar
    - Reason code and description
    - Expandable detailed analysis sections
    - Risk factors list with icons
    - Copy results button
    - Print/export option

### **3. Batch Processing**
- **Features**:
  - "Process All Pending" button
  - Progress indicator for batch operations
  - Results table showing all processed claims
  - Filter and sort options
  - Export batch results to CSV/Excel

### **4. Claim History/Search**
- **Features**:
  - Search by claim ID
  - Filter by status, date, reason code
  - Sortable table with claim details
  - Click to view full analysis
  - Export functionality

### **5. Analytics Dashboard (Optional but Impressive)**
- **Features**:
  - Approval rate charts over time
  - Reason code distribution pie chart
  - Processing time metrics
  - Provider risk analysis
  - Confidence score trends

### **6. Settings/Configuration**
- **Features**:
  - API key configuration
  - Backend URL setting
  - Theme customization
  - Export settings

## 🔧 **Technical Specifications**

### **API Integration:**
```javascript
// Example API calls needed
const API_BASE = 'http://localhost:8080';
const API_KEY = 'your_api_key_here';

// Process single claim
const processClaim = async (claimId) => {
  const response = await fetch(`${API_BASE}/api/v1/claims/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY
    },
    body: JSON.stringify({ claim_id: claimId })
  });
  return response.json();
};

// Process pending claims
const processPendingClaims = async () => {
  const response = await fetch(`${API_BASE}/api/v1/claims/process-pending`, {
    method: 'POST',
    headers: {
      'api-key': API_KEY
    }
  });
  return response.json();
};
```

### **Error Handling:**
- Network errors with retry options
- API key validation
- Invalid claim ID handling
- Rate limiting awareness
- User-friendly error messages

### **Loading States:**
- Skeleton screens for loading data
- Progress indicators for long operations
- Disabled states during processing

## 🎯 **Key Features to Implement**

### **1. Claim Processing Interface**
- Clean form for claim ID input
- Real-time validation
- One-click processing
- Clear success/error feedback

### **2. Results Display**
- Color-coded status indicators
- Confidence score visualization
- Expandable analysis sections
- Risk factor badges
- Reason code explanations

### **3. Batch Operations**
- Progress tracking
- Cancellation support
- Results summary
- Individual result viewing

### **4. Data Visualization**
- Status distribution charts
- Confidence score histograms
- Processing time trends
- Success rate over time

### **5. User Experience**
- Responsive design (mobile-friendly)
- Keyboard shortcuts
- Search functionality
- Export capabilities
- Print-friendly views

## 📊 **Sample Data for Testing**

### **Test Claim IDs to Use:**
- `CLAIM001` - Should return approved status
- `CLAIM002` - Should return denied status  
- `CLAIM003` - Should return pending status

### **Mock Response for Development:**
```json
{
  "decision": "Approved",
  "reason_code": "AUTO_APPR",
  "reason_description": "All validations passed, low risk, policy active",
  "confidence_score": 0.92,
  "risk_factors": ["routine_procedure", "verified_provider"],
  "policy_analysis": "Policy is active and covers the procedure",
  "patient_analysis": "Patient is eligible with valid coverage",
  "financial_analysis": "Amount within policy limits",
  "medical_necessity": "Procedure medically necessary",
  "fraud_indicators": "No fraud indicators detected",
  "rider_analysis": "No additional riders required",
  "analysis": "This claim meets all approval criteria..."
}
```

## 🎨 **UI/UX Guidelines**

### **Dashboard Layout:**
```
+--------------------------------------------------+
|  [Logo] Insurance AI Claim Processor      [User] |
+--------------------------------------------------+
| [Stats Cards: Total | Approved | Denied | Pend] |
+--------------------------------------------------+
| Process Claim: [Input Field] [Process Button]   |
+--------------------------------------------------+
| Recent Claims Table                              |
| ID | Status | Date | Amount | Confidence | View |
+--------------------------------------------------+
| [Process All Pending] [View History] [Analytics]|
+--------------------------------------------------+
```

### **Results Display:**
```
+--------------------------------------------------+
| Claim ID: CLAIM001                    [Back] [⋮] |
+--------------------------------------------------+
| [APPROVED] ✅    Confidence: ████████░░ 92%     |
+--------------------------------------------------+
| Reason: AUTO_APPR - All validations passed      |
+--------------------------------------------------+
| Risk Factors: [routine] [verified_provider]     |
+--------------------------------------------------+
| ▼ Detailed Analysis                              |
| ▼ Policy Analysis                                |
| ▼ Financial Breakdown                            |
| ▼ Medical Assessment                             |
+--------------------------------------------------+
```

### **Color Scheme:**
- **Primary**: Blue (#2563eb)
- **Success/Approved**: Green (#10b981)
- **Error/Denied**: Red (#ef4444)
- **Warning/Pending**: Yellow (#f59e0b)
- **Background**: Light gray (#f8fafc)
- **Text**: Dark gray (#1f2937)

## 📁 **Suggested Project Structure**
```
insurance-claim-frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── ClaimProcessor.jsx
│   │   ├── ResultsDisplay.jsx
│   │   ├── BatchProcessor.jsx
│   │   ├── ClaimHistory.jsx
│   │   └── Analytics.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── helpers.js
│   ├── styles/
│   │   └── globals.css
│   └── App.jsx
├── public/
└── package.json
```

## 🔥 **Bonus Features** (Make it Stand Out)
1. **Real-time Processing**: WebSocket updates for long-running operations
2. **Drag & Drop**: Upload CSV files with multiple claim IDs
3. **Dark Mode**: Professional dark theme toggle
4. **Notifications**: Toast notifications for completed operations
5. **Keyboard Shortcuts**: Power user features
6. **Audit Trail**: Track all processing history
7. **Role-based Access**: Different views for different user types
8. **Mobile App**: React Native version

## 📝 **Development Notes**
- The backend runs on `localhost:8080` (not 8000)
- API key authentication is required for most endpoints
- Responses are comprehensive with detailed AI analysis
- Error handling should be robust for network issues
- Consider adding offline capability for basic viewing

## 🚀 **Getting Started Command**
Once you have the code, the typical setup should be:
```bash
npm install
npm start
# Frontend will run on http://localhost:3000
# Backend should be running on http://localhost:8080
```

---

**This specification provides everything needed to build a professional, feature-rich frontend for the insurance claim AI processing system. The resulting application should be suitable for real-world insurance company use.**
