class RiskAnalyzer {
  constructor() {
    this.riskPatterns = {
      high: [
        'automatic renewal',
        'binding arbitration',
        'class action waiver',
        'liquidated damages',
        'personal guarantee',
        'non-compete',
        'confidentiality',
        'indemnification',
        'force majeure',
        'termination without cause',
        'late fees',
        'penalty',
        'forfeiture',
        'waiver of rights'
      ],
      medium: [
        'dispute resolution',
        'governing law',
        'jurisdiction',
        'severability',
        'entire agreement',
        'modification',
        'assignment',
        'notice requirements',
        'cure period',
        'default'
      ],
      low: [
        'definitions',
        'recitals',
        'signature blocks',
        'exhibits',
        'schedules',
        'table of contents'
      ]
    };

    this.financialRiskTerms = [
      'interest rate',
      'penalty',
      'late fee',
      'default rate',
      'collection costs',
      'attorney fees',
      'court costs',
      'liquidated damages',
      'security deposit',
      'rent increase'
    ];

    this.liabilityRiskTerms = [
      'indemnify',
      'hold harmless',
      'liability',
      'damages',
      'negligence',
      'gross negligence',
      'willful misconduct',
      'strict liability',
      'product liability',
      'professional liability'
    ];
  }

  async assessRisks(documentText, analysis) {
    try {
      const risks = {
        overall: 'low',
        categories: {
          financial: this.assessFinancialRisks(documentText),
          legal: this.assessLegalRisks(documentText),
          operational: this.assessOperationalRisks(documentText),
          privacy: this.assessPrivacyRisks(documentText)
        },
        redFlags: this.identifyRedFlags(documentText),
        recommendations: this.generateRiskRecommendations(documentText, analysis)
      };

      // Calculate overall risk level
      risks.overall = this.calculateOverallRisk(risks.categories, risks.redFlags);

      return risks;
    } catch (error) {
      console.error('Risk assessment error:', error);
      return this.createFallbackRiskAssessment();
    }
  }

  assessFinancialRisks(text) {
    const textLower = text.toLowerCase();
    const risks = [];
    let riskScore = 0;

    // Check for high-risk financial terms
    this.financialRiskTerms.forEach(term => {
      if (textLower.includes(term)) {
        risks.push({
          term: term,
          risk: 'medium',
          description: this.getFinancialRiskDescription(term)
        });
        riskScore += 1;
      }
    });

    // Check for penalty clauses
    const penaltyPattern = /penalty.*?(\$[\d,]+|\d+%)/gi;
    const penaltyMatches = text.match(penaltyPattern);
    if (penaltyMatches) {
      risks.push({
        term: 'penalty clauses',
        risk: 'high',
        description: `Document contains penalty clauses: ${penaltyMatches.join(', ')}`,
        amount: penaltyMatches
      });
      riskScore += 3;
    }

    // Check for automatic renewals
    if (textLower.includes('automatic renewal') || textLower.includes('auto-renew')) {
      risks.push({
        term: 'automatic renewal',
        risk: 'high',
        description: 'Contract may renew automatically without explicit consent'
      });
      riskScore += 2;
    }

    return {
      level: this.getRiskLevel(riskScore),
      score: riskScore,
      risks: risks
    };
  }

  assessLegalRisks(text) {
    const textLower = text.toLowerCase();
    const risks = [];
    let riskScore = 0;

    // Check for binding arbitration
    if (textLower.includes('binding arbitration') || textLower.includes('arbitration clause')) {
      risks.push({
        term: 'binding arbitration',
        risk: 'high',
        description: 'Disputes must be resolved through arbitration, limiting court access'
      });
      riskScore += 3;
    }

    // Check for class action waivers
    if (textLower.includes('class action waiver') || textLower.includes('waive class action')) {
      risks.push({
        term: 'class action waiver',
        risk: 'high',
        description: 'Cannot join class action lawsuits against the other party'
      });
      riskScore += 3;
    }

    // Check for liability limitations
    if (textLower.includes('limitation of liability') || textLower.includes('liability cap')) {
      risks.push({
        term: 'liability limitation',
        risk: 'medium',
        description: 'Other party\'s liability may be limited'
      });
      riskScore += 2;
    }

    // Check for indemnification clauses
    if (textLower.includes('indemnify') || textLower.includes('hold harmless')) {
      risks.push({
        term: 'indemnification',
        risk: 'high',
        description: 'May be required to pay for other party\'s legal costs and damages'
      });
      riskScore += 3;
    }

    return {
      level: this.getRiskLevel(riskScore),
      score: riskScore,
      risks: risks
    };
  }

  assessOperationalRisks(text) {
    const textLower = text.toLowerCase();
    const risks = [];
    let riskScore = 0;

    // Check for termination clauses
    if (textLower.includes('termination without cause') || textLower.includes('terminate at will')) {
      risks.push({
        term: 'termination without cause',
        risk: 'medium',
        description: 'Contract can be terminated without specific reason'
      });
      riskScore += 2;
    }

    // Check for non-compete clauses
    if (textLower.includes('non-compete') || textLower.includes('noncompete')) {
      risks.push({
        term: 'non-compete clause',
        risk: 'high',
        description: 'May restrict future business or employment opportunities'
      });
      riskScore += 3;
    }

    // Check for confidentiality requirements
    if (textLower.includes('confidential') || textLower.includes('proprietary')) {
      risks.push({
        term: 'confidentiality',
        risk: 'medium',
        description: 'Must keep certain information confidential'
      });
      riskScore += 1;
    }

    return {
      level: this.getRiskLevel(riskScore),
      score: riskScore,
      risks: risks
    };
  }

  assessPrivacyRisks(text) {
    const textLower = text.toLowerCase();
    const risks = [];
    let riskScore = 0;

    // Check for data collection
    if (textLower.includes('collect data') || textLower.includes('personal information')) {
      risks.push({
        term: 'data collection',
        risk: 'medium',
        description: 'Personal data may be collected and used'
      });
      riskScore += 1;
    }

    // Check for data sharing
    if (textLower.includes('share data') || textLower.includes('third party')) {
      risks.push({
        term: 'data sharing',
        risk: 'medium',
        description: 'Data may be shared with third parties'
      });
      riskScore += 2;
    }

    return {
      level: this.getRiskLevel(riskScore),
      score: riskScore,
      risks: risks
    };
  }

  identifyRedFlags(text) {
    const textLower = text.toLowerCase();
    const redFlags = [];

    // High-risk patterns
    const highRiskPatterns = [
      { pattern: /waive.*rights?/gi, description: 'Waiver of legal rights' },
      { pattern: /binding.*arbitration/gi, description: 'Mandatory arbitration clause' },
      { pattern: /class.*action.*waiver/gi, description: 'Cannot join class actions' },
      { pattern: /liquidated.*damages/gi, description: 'Pre-determined penalty amounts' },
      { pattern: /personal.*guarantee/gi, description: 'Personal liability for business debts' },
      { pattern: /automatic.*renewal/gi, description: 'Contract renews automatically' },
      { pattern: /termination.*without.*cause/gi, description: 'Can be terminated without reason' }
    ];

    highRiskPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(text)) {
        redFlags.push({
          type: 'high',
          description: description,
          recommendation: 'Review carefully and consider legal advice'
        });
      }
    });

    return redFlags;
  }

  generateRiskRecommendations(documentText, analysis) {
    const recommendations = [];

    // General recommendations
    recommendations.push({
      priority: 'high',
      category: 'general',
      recommendation: 'Read the entire document carefully before signing',
      reason: 'Legal documents contain binding terms that affect your rights'
    });

    // Financial recommendations
    if (this.containsFinancialTerms(documentText)) {
      recommendations.push({
        priority: 'high',
        category: 'financial',
        recommendation: 'Understand all payment terms, penalties, and fees',
        reason: 'Financial obligations are legally binding and can have significant impact'
      });
    }

    // Legal recommendations
    if (this.containsLegalRisks(documentText)) {
      recommendations.push({
        priority: 'high',
        category: 'legal',
        recommendation: 'Consider consulting with a legal professional',
        reason: 'Complex legal terms may limit your rights or create unexpected obligations'
      });
    }

    // Privacy recommendations
    if (this.containsPrivacyTerms(documentText)) {
      recommendations.push({
        priority: 'medium',
        category: 'privacy',
        recommendation: 'Review data collection and sharing policies',
        reason: 'Understand how your personal information will be used'
      });
    }

    return recommendations;
  }

  calculateOverallRisk(categories, redFlags) {
    const totalScore = Object.values(categories).reduce((sum, category) => sum + category.score, 0);
    const redFlagCount = redFlags.length;

    if (totalScore >= 10 || redFlagCount >= 3) {
      return 'high';
    } else if (totalScore >= 5 || redFlagCount >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getRiskLevel(score) {
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  getFinancialRiskDescription(term) {
    const descriptions = {
      'interest rate': 'Rate at which interest accrues on outstanding amounts',
      'penalty': 'Additional charges for non-compliance',
      'late fee': 'Fee charged for late payments',
      'default rate': 'Higher interest rate applied when in default',
      'collection costs': 'Costs of collecting overdue amounts',
      'attorney fees': 'Legal fees that may be recoverable',
      'court costs': 'Costs of legal proceedings',
      'liquidated damages': 'Pre-determined penalty amounts',
      'security deposit': 'Upfront payment held as security',
      'rent increase': 'Potential increase in rental amounts'
    };
    return descriptions[term] || 'Financial term that may affect your obligations';
  }

  containsFinancialTerms(text) {
    return this.financialRiskTerms.some(term => text.toLowerCase().includes(term));
  }

  containsLegalRisks(text) {
    const legalTerms = ['arbitration', 'waiver', 'indemnify', 'liability', 'damages'];
    return legalTerms.some(term => text.toLowerCase().includes(term));
  }

  containsPrivacyTerms(text) {
    const privacyTerms = ['data', 'personal information', 'privacy', 'confidential'];
    return privacyTerms.some(term => text.toLowerCase().includes(term));
  }

  createFallbackRiskAssessment() {
    return {
      overall: 'medium',
      categories: {
        financial: { level: 'medium', score: 2, risks: [] },
        legal: { level: 'medium', score: 2, risks: [] },
        operational: { level: 'low', score: 1, risks: [] },
        privacy: { level: 'low', score: 1, risks: [] }
      },
      redFlags: [],
      recommendations: [
        {
          priority: 'high',
          category: 'general',
          recommendation: 'Review document carefully and seek professional advice if needed',
          reason: 'Legal documents contain important terms that affect your rights and obligations'
        }
      ]
    };
  }
}

module.exports = RiskAnalyzer;
