# 🏛️ LegalEase AI - Legal Document Simplification Platform

> **Transform complex legal jargon into clear, understandable language using Google's Gemini AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://ai.google.dev/)

## 🎯 Problem Statement

Legal documents—such as rental agreements, loan contracts, and terms of service—are often filled with complex, impenetrable jargon that is incomprehensible to the average person. This creates a significant information asymmetry, where individuals may unknowingly agree to unfavorable terms, exposing them to financial and legal risks.

## 🚀 Solution Overview

LegalEase AI is a comprehensive platform that uses Google's Gemini AI to:

- **Simplify** complex legal language into clear, understandable terms
- **Identify** potential red flags and high-risk clauses
- **Assess** financial, legal, and operational risks
- **Provide** interactive Q&A about document contents
- **Generate** actionable recommendations
- **Compare** multiple documents side-by-side

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Document Processing**: Supports PDF, DOC, DOCX, and TXT files
- **Smart Recognition**: Automatically identifies document types
- **Risk Assessment**: Multi-dimensional risk analysis (financial, legal, operational, privacy)
- **Clause Simplification**: Breaks down complex legal language

### 💬 Interactive Chat Assistant
- **Real-time Q&A**: Ask specific questions about your document
- **Context-aware**: Understands document content and analysis
- **Follow-up Suggestions**: Proposes related questions
- **Confidence Scoring**: Indicates answer reliability

### 📊 Comprehensive Reporting
- **Executive Summary**: 2-3 sentence document overview
- **Key Points**: Most important information highlighted
- **Simplified Clauses**: Complex terms explained in plain language
- **Risk Indicators**: Visual risk level indicators
- **Actionable Recommendations**: Next steps for users
- **Interactive Glossary**: In-context definitions of legal terms

### Modern User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Drag & Drop Upload**: Intuitive file upload interface
- **Visual Risk Indicators**: Color-coded risk levels
- **Interactive Cards**: Organized information display
- **Smooth Animations**: Professional user experience

### 🔍 Advanced Features
- **Document Comparison**: Side-by-side analysis of multiple documents
- **Template Recognition**: Identifies common document types
- **Red Flag Detection**: Highlights concerning clauses
- **Mobile Responsive**: Works on all devices

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js**
- **Google Gemini AI** for document analysis
- **Multer** for file uploads
- **pdf-parse** and **mammoth** for document processing
- **socket.io** for real-time communication
- **Helmet** for security headers
- **express-rate-limit** for rate limiting
- **dotenv** for environment variables

### Frontend
- **HTML5**
- **CSS3** with Flexbox and Grid
- **Vanilla JavaScript** (ES6+)
- **Font Awesome** for icons

## 🚀 Quick Start

### Prerequisites
- Node.js (v16.0.0 or higher)
- npm (Node Package Manager)
- A Google Gemini API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd legalease-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create and configure the environment file:**
    Create a file named `.env` in the root of the project and add the following variables:

    ```
    # Your Google Gemini API Key
    GEMINI_API_KEY=your_google_gemini_api_key

    # The port for the server to run on
    PORT=3002

    # The environment (development or production)
    NODE_ENV=development
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    This will start the server in development mode using `nodemon`, which will automatically restart the server when file changes are detected.

5.  **Access the application:**
    Open your browser and go to `http://localhost:3002`.

## 📁 Project Structure

```
.
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── script.js          # Frontend JavaScript
├── services/              # Backend services
│   ├── aiService.js       # Google Gemini AI integration
│   ├── documentProcessor.js # Document parsing and processing
│   ├── riskAnalyzer.js    # Risk assessment algorithms
│   ├── documentComparison.js # Document comparison logic
│   ├── legalTemplates.js  # Legal document templates
│   └── fileUpload.js      # File upload configuration
├── .env                   # Environment variables
├── config.js              # Configuration settings
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 API Endpoints

-   `POST /api/analyze`: Upload a document for analysis.
-   `POST /api/chat`: Ask a question about the analyzed document.
-   `GET /api/templates`: Get a list of available legal templates.
-   `POST /api/compare`: Compare two uploaded documents.
-   `GET /api/samples`: Get a list of sample documents for testing.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a pull request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
