const AIService = require('./aiService');
const RiskAnalyzer = require('./riskAnalyzer');

class DocumentComparison {
  constructor() {
    this.aiService = new AIService();
    this.riskAnalyzer = new RiskAnalyzer();
  }

  async compareDocuments(doc1Text, doc2Text, doc1Name, doc2Name) {
    try {
      // Analyze both documents
      const [doc1Analysis, doc2Analysis] = await Promise.all([
        this.aiService.analyzeDocument(doc1Text, doc1Name),
        this.aiService.analyzeDocument(doc2Text, doc2Name)
      ]);

      // Perform risk assessment for both documents
      const [doc1Risk, doc2Risk] = await Promise.all([
        this.riskAnalyzer.assessRisks(doc1Text, doc1Analysis),
        this.riskAnalyzer.assessRisks(doc2Text, doc2Analysis)
      ]);

      // Add risk assessment to the analysis
      doc1Analysis.riskAssessment = doc1Risk;
      doc2Analysis.riskAssessment = doc2Risk;

      // Get detailed comparison
      const comparison = await this.aiService.compareDocuments(doc1Analysis, doc2Analysis);

      return {
        success: true,
        documents: {
          doc1: { name: doc1Name, analysis: doc1Analysis },
          doc2: { name: doc2Name, analysis: doc2Analysis }
        },
        comparison: comparison
      };

    } catch (error) {
      console.error('Document comparison error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Compare specific aspects of documents
  async compareAspects(doc1Analysis, doc2Analysis, aspects = ['financial', 'legal', 'operational']) {
    const comparison = {
      aspects: {},
      overall: 'neutral'
    };

    for (const aspect of aspects) {
      comparison.aspects[aspect] = this.compareAspect(doc1Analysis, doc2Analysis, aspect);
    }

    // Calculate overall comparison
    comparison.overall = this.calculateOverallComparison(comparison.aspects);

    return comparison;
  }

  compareAspect(doc1Analysis, doc2Analysis, aspect) {
    const doc1Risk = doc1Analysis.riskAssessment?.categories[aspect]?.level || 'low';
    const doc2Risk = doc2Analysis.riskAssessment?.categories[aspect]?.level || 'low';

    const riskLevels = { low: 1, medium: 2, high: 3 };
    const doc1Score = riskLevels[doc1Risk];
    const doc2Score = riskLevels[doc2Risk];

    let winner = 'neutral';
    if (doc1Score < doc2Score) winner = 'doc1';
    else if (doc2Score < doc1Score) winner = 'doc2';

    return {
      doc1Risk,
      doc2Risk,
      winner,
      difference: Math.abs(doc1Score - doc2Score)
    };
  }

  calculateOverallComparison(aspects) {
    const scores = { doc1: 0, doc2: 0, neutral: 0 };
    
    Object.values(aspects).forEach(aspect => {
      scores[aspect.winner]++;
    });

    const maxScore = Math.max(...Object.values(scores));
    const winner = Object.keys(scores).find(key => scores[key] === maxScore);
    
    return winner;
  }

  // Generate comparison report
  generateComparisonReport(comparison) {
    const report = {
      summary: comparison.comparison.summary,
      keyFindings: [],
      recommendations: comparison.comparison.recommendations,
      riskAnalysis: this.analyzeRiskComparison(comparison.documents),
      financialImpact: this.analyzeFinancialImpact(comparison.documents),
      legalImplications: this.analyzeLegalImplications(comparison.documents)
    };

    // Extract key findings from differences
    comparison.comparison.keyDifferences.forEach(diff => {
      report.keyFindings.push({
        aspect: diff.aspect,
        impact: diff.impact,
        recommendation: this.getRecommendationForDifference(diff)
      });
    });

    return report;
  }

  analyzeRiskComparison(documents) {
    const doc1Risks = documents.doc1.analysis.riskAssessment;
    const doc2Risks = documents.doc2.analysis.riskAssessment;

    return {
      overall: {
        doc1: doc1Risks.overall,
        doc2: doc2Risks.overall,
        safer: doc1Risks.overall === 'low' ? 'doc1' : doc2Risks.overall === 'low' ? 'doc2' : 'similar'
      },
      categories: Object.keys(doc1Risks.categories).map(category => ({
        category,
        doc1: doc1Risks.categories[category].level,
        doc2: doc2Risks.categories[category].level
      }))
    };
  }

  analyzeFinancialImpact(documents) {
    const doc1Financial = documents.doc1.analysis.riskAssessment.categories.financial;
    const doc2Financial = documents.doc2.analysis.riskAssessment.categories.financial;

    return {
      doc1Risk: doc1Financial.level,
      doc2Risk: doc2Financial.level,
      recommendation: doc1Financial.score < doc2Financial.score ? 
        'Document 1 has lower financial risk' : 
        doc2Financial.score < doc1Financial.score ? 
        'Document 2 has lower financial risk' : 
        'Both documents have similar financial risk levels'
    };
  }

  analyzeLegalImplications(documents) {
    const doc1Legal = documents.doc1.analysis.riskAssessment.categories.legal;
    const doc2Legal = documents.doc2.analysis.riskAssessment.categories.legal;

    return {
      doc1Risk: doc1Legal.level,
      doc2Risk: doc2Legal.level,
      recommendation: doc1Legal.score < doc2Legal.score ? 
        'Document 1 has fewer legal restrictions' : 
        doc2Legal.score < doc1Legal.score ? 
        'Document 2 has fewer legal restrictions' : 
        'Both documents have similar legal implications'
    };
  }

  getRecommendationForDifference(difference) {
    const impact = difference.impact.toLowerCase();
    
    if (impact.includes('better') || impact.includes('advantage')) {
      return 'Consider this as a positive factor in your decision';
    } else if (impact.includes('worse') || impact.includes('disadvantage')) {
      return 'This may be a concern - review carefully';
    } else {
      return 'Evaluate based on your specific needs and circumstances';
    }
  }
}

module.exports = DocumentComparison;
