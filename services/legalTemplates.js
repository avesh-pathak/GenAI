class LegalTemplates {
  constructor() {
    this.templates = {
      'rental-agreement': {
        name: 'Rental Agreement',
        description: 'Standard residential lease agreement',
        commonClauses: [
          'Security deposit terms',
          'Rent amount and due date',
          'Lease term and renewal',
          'Maintenance responsibilities',
          'Pet policy',
          'Utilities and services',
          'Late fees and penalties',
          'Termination conditions'
        ],
        redFlags: [
          'Excessive security deposit',
          'Automatic renewal clauses',
          'Unlimited late fees',
          'Restrictive pet policies',
          'Unclear maintenance responsibilities'
        ],
        keyQuestions: [
          'What is the security deposit amount and when is it returned?',
          'When is rent due and what are the late fees?',
          'Who is responsible for maintenance and repairs?',
          'Are pets allowed and what are the restrictions?',
          'What happens if I need to break the lease early?'
        ]
      },
      'loan-contract': {
        name: 'Loan Contract',
        description: 'Personal or business loan agreement',
        commonClauses: [
          'Principal amount and interest rate',
          'Payment schedule and terms',
          'Late fees and default rates',
          'Collateral requirements',
          'Prepayment penalties',
          'Default and acceleration clauses',
          'Collection costs and attorney fees',
          'Governing law and jurisdiction'
        ],
        redFlags: [
          'Excessive interest rates',
          'Balloon payments',
          'Prepayment penalties',
          'Personal guarantees',
          'Acceleration clauses',
          'Confession of judgment'
        ],
        keyQuestions: [
          'What is the total amount I will pay over the life of the loan?',
          'What happens if I miss a payment?',
          'Can I pay off the loan early without penalty?',
          'What collateral is required?',
          'What are the consequences of default?'
        ]
      },
      'terms-of-service': {
        name: 'Terms of Service',
        description: 'Website or app terms of service',
        commonClauses: [
          'User obligations and restrictions',
          'Intellectual property rights',
          'Privacy and data collection',
          'Liability limitations',
          'Dispute resolution',
          'Termination rights',
          'Content policies',
          'Service availability'
        ],
        redFlags: [
          'Binding arbitration clauses',
          'Class action waivers',
          'Excessive liability limitations',
          'Unlimited data collection',
          'One-sided termination rights'
        ],
        keyQuestions: [
          'How is my personal data collected and used?',
          'What are my rights if the service is terminated?',
          'How are disputes resolved?',
          'What content is prohibited?',
          'What happens to my data if I delete my account?'
        ]
      },
      'employment-contract': {
        name: 'Employment Contract',
        description: 'Job offer or employment agreement',
        commonClauses: [
          'Job title and responsibilities',
          'Salary and benefits',
          'Work schedule and location',
          'Non-compete agreements',
          'Confidentiality obligations',
          'Termination conditions',
          'Intellectual property rights',
          'Dispute resolution'
        ],
        redFlags: [
          'Overly broad non-compete clauses',
          'Unlimited confidentiality obligations',
          'At-will termination without cause',
          'Assignment of all intellectual property',
          'Mandatory arbitration'
        ],
        keyQuestions: [
          'What are my specific job responsibilities?',
          'What benefits am I entitled to?',
          'What restrictions apply after I leave?',
          'How can my employment be terminated?',
          'Who owns work I create during employment?'
        ]
      },
      'purchase-agreement': {
        name: 'Purchase Agreement',
        description: 'Real estate or goods purchase contract',
        commonClauses: [
          'Purchase price and payment terms',
          'Property or goods description',
          'Closing date and conditions',
          'Inspection and due diligence',
          'Title and ownership transfer',
          'Warranties and representations',
          'Default and remedies',
          'Closing costs and fees'
        ],
        redFlags: [
          'Unclear property description',
          'Excessive closing costs',
          'Limited inspection rights',
          'One-sided default remedies',
          'Unclear title transfer process'
        ],
        keyQuestions: [
          'What exactly am I purchasing?',
          'What are all the costs involved?',
          'What happens if the inspection reveals problems?',
          'When will I receive clear title?',
          'What are my rights if the seller defaults?'
        ]
      }
    };
  }

  getTemplate(documentType) {
    return this.templates[documentType] || this.templates['general-contract'];
  }

  getAllTemplates() {
    return Object.keys(this.templates).map(key => ({
      id: key,
      ...this.templates[key]
    }));
  }

  getCommonClauses(documentType) {
    const template = this.getTemplate(documentType);
    return template.commonClauses || [];
  }

  getRedFlags(documentType) {
    const template = this.getTemplate(documentType);
    return template.redFlags || [];
  }

  getKeyQuestions(documentType) {
    const template = this.getTemplate(documentType);
    return template.keyQuestions || [];
  }

  // Generate template-specific analysis prompts
  generateAnalysisPrompt(documentType, documentText) {
    const template = this.getTemplate(documentType);
    
    return `
Analyze this ${template.name.toLowerCase()} document with special attention to:

Common Clauses to Look For:
${template.commonClauses.map(clause => `- ${clause}`).join('\n')}

Red Flags to Identify:
${template.redFlags.map(flag => `- ${flag}`).join('\n')}

Key Questions to Address:
${template.keyQuestions.map(question => `- ${question}`).join('\n')}

Document Text: ${documentText.substring(0, 8000)}

Provide a comprehensive analysis focusing on these specific aspects for this type of document.
`;
  }

  // Generate document-specific recommendations
  generateRecommendations(documentType, analysis) {
    const template = this.getTemplate(documentType);
    const recommendations = [];

    // Add template-specific recommendations
    recommendations.push(`Review all ${template.name.toLowerCase()} clauses carefully`);
    
    // Add risk-based recommendations
    if (analysis.riskAssessment.overall === 'high') {
      recommendations.push('Consider consulting with a legal professional due to high-risk clauses');
    }

    // Add document-type specific recommendations
    switch (documentType) {
      case 'rental-agreement':
        recommendations.push('Take photos of the property condition before moving in');
        recommendations.push('Understand your rights regarding security deposit return');
        break;
      case 'loan-contract':
        recommendations.push('Calculate the total cost of the loan including all fees');
        recommendations.push('Understand the consequences of late payments');
        break;
      case 'terms-of-service':
        recommendations.push('Review the privacy policy and data collection practices');
        recommendations.push('Understand how to terminate your account');
        break;
      case 'employment-contract':
        recommendations.push('Negotiate any restrictive clauses before signing');
        recommendations.push('Understand your intellectual property rights');
        break;
      case 'purchase-agreement':
        recommendations.push('Conduct thorough due diligence before closing');
        recommendations.push('Understand all closing costs and fees');
        break;
    }

    return recommendations;
  }

  // Validate document completeness
  validateDocumentCompleteness(documentType, analysis) {
    const template = this.getTemplate(documentType);
    const missing = [];
    const present = [];

    template.commonClauses.forEach(clause => {
      const clauseLower = clause.toLowerCase();
      const textLower = analysis.documentText?.toLowerCase() || '';
      
      if (textLower.includes(clauseLower.split(' ')[0])) {
        present.push(clause);
      } else {
        missing.push(clause);
      }
    });

    return {
      completeness: (present.length / template.commonClauses.length) * 100,
      present,
      missing,
      recommendation: missing.length > 0 ? 
        'Document may be missing important clauses' : 
        'Document appears to contain standard clauses'
    };
  }
}

module.exports = LegalTemplates;
