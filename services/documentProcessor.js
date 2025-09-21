const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentProcessor {
  constructor() {
    this.supportedFormats = {
      'application/pdf': this.extractFromPDF,
      'application/msword': this.extractFromDoc,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractFromDocx,
      'text/plain': this.extractFromText
    };
  }

  async extractText(filePath, mimeType) {
    try {
      const extractor = this.supportedFormats[mimeType];
      if (!extractor) {
        throw new Error(`Unsupported file format: ${mimeType}`);
      }

      const text = await extractor(filePath);
      return this.cleanText(text);
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromDoc(filePath) {
    // For .doc files, we'll need a different approach
    // This is a simplified version - in production, you might want to use a more robust solution
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  // Extract document structure and metadata
  extractDocumentStructure(text) {
    const structure = {
      sections: [],
      clauses: [],
      definitions: [],
      parties: [],
      dates: [],
      amounts: []
    };

    // Extract sections (common patterns)
    const sectionPattern = /(?:SECTION|ARTICLE|PART)\s+([IVX\d]+)[\s\-\:]+([^\n]+)/gi;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      structure.sections.push({
        number: match[1],
        title: match[2].trim()
      });
    }

    // Extract clauses (numbered items)
    const clausePattern = /(?:\([a-z]\)|\([0-9]+\)|\([ivx]+\)|^\d+\.)\s+([^\n]+)/gim;
    while ((match = clausePattern.exec(text)) !== null) {
      structure.clauses.push(match[1].trim());
    }

    // Extract definitions
    const definitionPattern = /"([^"]+)"\s*means?\s+([^\.]+)/gi;
    while ((match = definitionPattern.exec(text)) !== null) {
      structure.definitions.push({
        term: match[1],
        definition: match[2].trim()
      });
    }

    // Extract dates
    const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
    while ((match = datePattern.exec(text)) !== null) {
      structure.dates.push(match[0]);
    }

    // Extract monetary amounts
    const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
    while ((match = amountPattern.exec(text)) !== null) {
      structure.amounts.push(match[0]);
    }

    return structure;
  }

  // Identify document type based on content
  identifyDocumentType(text) {
    const indicators = {
      'rental-agreement': [
        'lease', 'tenant', 'landlord', 'rent', 'security deposit', 'premises',
        'rental agreement', 'lease agreement'
      ],
      'loan-contract': [
        'loan', 'borrower', 'lender', 'principal', 'interest rate', 'payment',
        'loan agreement', 'promissory note'
      ],
      'terms-of-service': [
        'terms of service', 'user agreement', 'acceptable use', 'privacy policy',
        'liability', 'disclaimer', 'website terms'
      ],
      'employment-contract': [
        'employment', 'employee', 'employer', 'salary', 'benefits', 'job description',
        'employment agreement', 'offer letter'
      ],
      'purchase-agreement': [
        'purchase', 'buyer', 'seller', 'purchase price', 'closing date',
        'purchase agreement', 'sales contract'
      ]
    };

    const textLower = text.toLowerCase();
    const scores = {};

    for (const [type, keywords] of Object.entries(indicators)) {
      scores[type] = keywords.reduce((score, keyword) => {
        return score + (textLower.includes(keyword) ? 1 : 0);
      }, 0);
    }

    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    );

    return bestMatch[1] > 0 ? bestMatch[0] : 'unknown';
  }
}

module.exports = DocumentProcessor;
