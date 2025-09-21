// Google Gemini AI Integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class AIService {
  constructor() {
    // Initialize Google Gemini AI
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxTokens,
        temperature: config.gemini.temperature,
      }
    });
  }

  async analyzeDocument(text, fileName) {
    try {
      const documentType = this.identifyDocumentType(text);
      
      const prompt = this.createAnalysisPrompt(text, documentType, fileName);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('Raw Gemini response:', analysisText);
      
      // Clean and parse the JSON response from Gemini
      const cleanedText = this.cleanJsonResponse(analysisText);
      console.log('Cleaned response:', cleanedText);
      
      const analysis = JSON.parse(cleanedText);
      return analysis;

    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      console.error('Error details:', error.message);
      
      // Try to extract any useful information from the response
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();
        
        // Try to create a basic analysis from the text response
        return this.createBasicAnalysisFromText(analysisText, text, fileName);
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError);
        return this.createFallbackAnalysis(text, fileName);
      }
    }
  }

  createAnalysisPrompt(text, documentType, fileName) {
    return `
You are a legal document analysis AI. Analyze the following legal document and provide a comprehensive analysis.

Document: ${fileName}
Type: ${documentType}
Content: ${text.substring(0, 8000)}

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text. Start your response with { and end with }.

Required JSON structure:
{
  "summary": "A 2-3 sentence summary of what this document is about",
  "documentType": "${documentType}",
  "keyPoints": [
    "List 5-7 most important points from the document"
  ],
  "simplifiedClauses": [
    {
      "original": "Original complex clause text",
      "simplified": "Clear, simple explanation",
      "importance": "high",
      "category": "payment"
    }
  ],
  "recommendations": [
    "List 3-5 actionable recommendations for the user"
  ],
  "redFlags": [
    "List any concerning or unusual clauses"
  ],
  "nextSteps": [
    "What the user should do next"
  ]
}

Focus on making the language accessible to non-lawyers while maintaining legal accuracy. Respond with valid JSON only.
`;
  }

  async answerQuestion(question, documentText, analysis) {
    try {
      console.log('🤖 Processing question with Gemini AI:', question);
      
      const prompt = `
You are an expert legal assistant specializing in document analysis. Answer the user's question based on the provided document analysis and text.

DOCUMENT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ORIGINAL DOCUMENT TEXT:
${documentText.substring(0, 6000)}

USER QUESTION: ${question}

INSTRUCTIONS:
1. Provide a clear, accurate answer based on the document content
2. Reference specific sections, clauses, or page numbers when possible
3. If the question cannot be answered from the document, explain why
4. Suggest relevant follow-up questions the user might have
5. Rate your confidence in the answer

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text. Start your response with { and end with }.

Required JSON structure:
{
  "answer": "Detailed, helpful answer to the question with specific references",
  "confidence": "high|medium|low",
  "sources": ["Specific clauses, sections, or page numbers referenced"],
  "followUpQuestions": ["2-3 related questions the user might want to ask"],
  "keyInsights": ["Important insights or warnings related to the question"]
}

Respond with valid JSON only.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answerText = response.text();
      
      console.log('📥 Raw Gemini chat response:', answerText);
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(answerText);
      console.log('🧹 Cleaned chat response:', cleanedText);
      
      const parsedResponse = JSON.parse(cleanedText);
      
      // Enhance the response with additional context
      return this.enhanceChatResponse(parsedResponse, question, analysis);

    } catch (error) {
      console.error('Gemini question answering error:', error);
      console.error('Error details:', error.message);
      
      // Try to provide a basic response even if JSON parsing fails
      try {
        const result = await this.model.generateContent(`
Answer this question about the legal document: "${question}"

Document context: ${documentText.substring(0, 2000)}

Provide a helpful answer in plain text (no JSON formatting needed).
`);
        const response = await result.response;
        const answerText = response.text();
        
        return {
          answer: answerText,
          confidence: "medium",
          sources: ["Document analysis"],
          followUpQuestions: [
            "Can you explain this in more detail?",
            "What are the implications of this?",
            "Are there any risks I should know about?"
          ],
          keyInsights: ["This response is based on document analysis"]
        };
      } catch (fallbackError) {
        console.error('Fallback chat also failed:', fallbackError);
        return {
          answer: "I'm sorry, I'm having trouble processing your question right now. Please try again or contact support.",
          confidence: "low",
          sources: [],
          followUpQuestions: [
            "Can you rephrase your question?",
            "Would you like me to explain a specific clause?",
            "Do you need help understanding any legal terms?"
          ],
          keyInsights: []
        };
      }
    }
  }

  identifyDocumentType(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('lease') || textLower.includes('tenant') || textLower.includes('landlord')) {
      return 'rental-agreement';
    } else if (textLower.includes('loan') || textLower.includes('borrower') || textLower.includes('lender')) {
      return 'loan-contract';
    } else if (textLower.includes('terms of service') || textLower.includes('user agreement')) {
      return 'terms-of-service';
    } else if (textLower.includes('employment') || textLower.includes('employee') || textLower.includes('salary')) {
      return 'employment-contract';
    } else if (textLower.includes('purchase') || textLower.includes('buyer') || textLower.includes('seller')) {
      return 'purchase-agreement';
    }
    
    return 'general-contract';
  }

  // Clean JSON response from Gemini AI (removes markdown code blocks)
  cleanJsonResponse(text) {
    if (!text) return '{}';
    
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // If still no valid JSON, try to find JSON object
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      } else {
        // Return empty valid JSON if nothing found
        return '{}';
      }
    }
    
    return cleaned;
  }

  // Enhance chat response with additional context and insights
  enhanceChatResponse(response, question, analysis) {
    // Add document type context
    if (analysis.documentType) {
      response.documentType = analysis.documentType;
    }

    // Add risk context if relevant
    if (analysis.riskAssessment && analysis.riskAssessment.overall) {
      response.riskContext = `This document has a ${analysis.riskAssessment.overall} risk level.`;
    }

    // Enhance follow-up questions based on document type
    if (analysis.documentType === 'rental-agreement') {
      response.followUpQuestions = response.followUpQuestions || [];
      response.followUpQuestions.push("What are my rights as a tenant?");
      response.followUpQuestions.push("What happens if I need to break the lease early?");
    } else if (analysis.documentType === 'loan-contract') {
      response.followUpQuestions = response.followUpQuestions || [];
      response.followUpQuestions.push("What are the total costs of this loan?");
      response.followUpQuestions.push("What happens if I miss a payment?");
    }

    // Add key insights from the analysis
    if (analysis.keyPoints && analysis.keyPoints.length > 0) {
      response.keyInsights = response.keyInsights || [];
      response.keyInsights.push("Review the key points section for important information");
    }

    // Add recommendations context
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      response.keyInsights = response.keyInsights || [];
      response.keyInsights.push("Consider the recommendations provided in the analysis");
    }

    return response;
  }

  createBasicAnalysisFromText(aiResponse, originalText, fileName) {
    // Try to extract useful information from AI response even if not JSON
    const documentType = this.identifyDocumentType(originalText);
    
    return {
      summary: aiResponse.substring(0, 200) + "...",
      documentType: documentType,
      keyPoints: [
        "AI analysis completed with text response",
        "Review the summary above for key information",
        "Consider consulting with a legal professional",
        "Pay attention to dates, amounts, and obligations"
      ],
      simplifiedClauses: [
        {
          original: "AI provided text-based analysis",
          simplified: aiResponse.substring(0, 100) + "...",
          importance: "medium",
          category: "analysis"
        }
      ],
      recommendations: [
        "Review the AI analysis above",
        "Ask specific questions using the chat feature",
        "Consider getting legal advice before signing",
        "Keep a copy for your records"
      ],
      redFlags: [],
      nextSteps: [
        "Review the analysis provided",
        "Use the chat feature for specific questions",
        "Consider professional legal review"
      ],
      rawResponse: aiResponse // Include the raw response for reference
    };
  }

  createFallbackAnalysis(text, fileName) {
    // Simple fallback analysis when AI service is unavailable
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).length;
    
    return {
      summary: `This appears to be a legal document (${fileName}) with approximately ${wordCount} words and ${sentences} sentences.`,
      documentType: this.identifyDocumentType(text),
      keyPoints: [
        "Document contains legal language and terms",
        "Review all sections carefully before signing",
        "Consider consulting with a legal professional",
        "Pay attention to dates, amounts, and obligations",
        "Look for termination and cancellation clauses"
      ],
      simplifiedClauses: [
        {
          original: "Document contains complex legal language",
          simplified: "This document uses formal legal terms that may be difficult to understand",
          importance: "high",
          category: "general"
        }
      ],
      recommendations: [
        "Read the entire document carefully",
        "Ask questions about any unclear sections",
        "Consider getting legal advice before signing",
        "Keep a copy for your records"
      ],
      redFlags: [],
      nextSteps: [
        "Review the document thoroughly",
        "Seek clarification on unclear terms",
        "Consider professional legal review"
      ]
    };
  }

  // Generate document comparison
  async compareDocuments(doc1Analysis, doc2Analysis) {
    try {
      const prompt = `
You are a legal document comparison expert. Analyze differences between documents objectively.

Compare these two legal document analyses and highlight key differences:

Document 1: ${JSON.stringify(doc1Analysis, null, 2)}
Document 2: ${JSON.stringify(doc2Analysis, null, 2)}

Provide comparison in JSON format:
{
  "summary": "Brief comparison summary",
  "keyDifferences": [
    {
      "aspect": "What aspect differs",
      "doc1": "Document 1 details",
      "doc2": "Document 2 details",
      "impact": "What this difference means"
    }
  ],
  "recommendations": ["Which document is better and why"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const comparisonText = response.text();
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(comparisonText);
      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('Gemini document comparison error:', error);
      return {
        summary: "Unable to compare documents at this time",
        keyDifferences: [],
        recommendations: ["Please review both documents carefully"]
      };
    }
  }
}

module.exports = AIService;
