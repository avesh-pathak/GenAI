const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const DocumentProcessor = require('./services/documentProcessor');
const AIService = require('./services/aiService');
const RiskAnalyzer = require('./services/riskAnalyzer');
const DocumentComparison = require('./services/documentComparison');
const LegalTemplates = require('./services/legalTemplates');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const documentProcessor = new DocumentProcessor();
const aiService = new AIService();
const riskAnalyzer = new RiskAnalyzer();
const documentComparison = new DocumentComparison();
const legalTemplates = new LegalTemplates();
const upload = require('./services/fileUpload');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Document upload and analysis endpoint
app.post('/api/analyze', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text from document
    const extractedText = await documentProcessor.extractText(filePath, req.file.mimetype);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from document' });
    }

    // Analyze document with AI
    const analysis = await aiService.analyzeDocument(extractedText, fileName);
    
    // Perform risk assessment
    const riskAssessment = await riskAnalyzer.assessRisks(extractedText, analysis);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        simplifiedClauses: analysis.simplifiedClauses,
        recommendations: analysis.recommendations,
        riskAssessment: riskAssessment
      },
      documentText: extractedText // Include the document text for chat functionality
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze document',
      details: error.message 
    });
  }
});

// Chat endpoint for document Q&A
app.post('/api/chat', async (req, res) => {
  try {
    const { question, documentText, analysis } = req.body;
    
    if (!question || !documentText) {
      return res.status(400).json({ error: 'Question and document text are required' });
    }

    console.log('🤖 Processing chat question:', question);
    console.log('📄 Document text length:', documentText.length);
    console.log('📊 Analysis available:', !!analysis);

    const response = await aiService.answerQuestion(question, documentText, analysis);
    
    console.log('✅ Chat response generated successfully');
    
    res.json({
      success: true,
      answer: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      followUpQuestions: response.followUpQuestions,
      keyInsights: response.keyInsights
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide a fallback response
    res.json({
      success: true,
      answer: "I apologize, but I'm having trouble processing your question right now. Please try rephrasing your question or ask about a specific clause in the document.",
      confidence: "low",
      sources: [],
      followUpQuestions: [
        "Can you rephrase your question?",
        "What specific clause would you like me to explain?",
        "Are there any terms you don't understand?"
      ],
      keyInsights: ["Please try asking a more specific question about the document"]
    });
  }
});

// Get document templates
app.get('/api/templates', (req, res) => {
  const templates = legalTemplates.getAllTemplates();
  res.json({ templates });
});

// Document comparison endpoint
app.post('/api/compare', upload.fields([
  { name: 'document1', maxCount: 1 },
  { name: 'document2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.document1 || !req.files.document2) {
      return res.status(400).json({ error: 'Two documents are required for comparison' });
    }

    const doc1 = req.files.document1[0];
    const doc2 = req.files.document2[0];

    // Extract text from both documents
    const [doc1Text, doc2Text] = await Promise.all([
      documentProcessor.extractText(doc1.path, doc1.mimetype),
      documentProcessor.extractText(doc2.path, doc2.mimetype)
    ]);

    if (!doc1Text || !doc2Text) {
      return res.status(400).json({ error: 'Could not extract text from one or both documents' });
    }

    // Compare documents
    const comparison = await documentComparison.compareDocuments(
      doc1Text, doc2Text, doc1.originalname, doc2.originalname
    );

    // Clean up uploaded files
    fs.unlinkSync(doc1.path);
    fs.unlinkSync(doc2.path);

    res.json(comparison);

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ 
      error: 'Failed to compare documents',
      details: error.message 
    });
  }
});

// Get sample documents for testing
app.get('/api/samples', (req, res) => {
  const samples = [
    {
      id: 'rental-agreement',
      name: 'Sample Rental Agreement',
      description: 'A standard residential lease agreement',
      path: '/sample-documents/sample-rental-agreement.txt'
    },
    {
      id: 'loan-agreement',
      name: 'Sample Loan Agreement',
      description: 'A personal loan contract',
      path: '/sample-documents/sample-loan-agreement.txt'
    }
  ];
  
  res.json({ samples });
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-analysis', (analysisId) => {
    socket.join(analysisId);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 LegalEase AI server running on port ${PORT}`);
  console.log(`📱 Access the application at http://localhost:${PORT}`);
});

module.exports = app;
