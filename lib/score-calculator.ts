export interface AnalysisScores {
  seoScore?: number | null;
  performanceScore?: number | null;
  accessibilityScore?: number | null;
  bestPracticesScore?: number | null;
}

export interface CalculatedScores {
  overall: number;
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  content: number; // Derived from other scores
}

export class ScoreCalculator {
  /**
   * Calculate overall score from individual scores
   */
  static calculateOverallScore(scores: AnalysisScores): number {
    const validScores = [
      scores.seoScore,
      scores.performanceScore,
      scores.accessibilityScore,
      scores.bestPracticesScore,
    ].filter((score) => score !== null && score !== undefined) as number[];

    if (validScores.length === 0) return 0;

    const average =
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return Math.round(average);
  }

  /**
   * Calculate content score (derived from other scores)
   */
  static calculateContentScore(scores: AnalysisScores): number {
    const seo = scores.seoScore || 0;
    const accessibility = scores.accessibilityScore || 0;

    // Content score is primarily based on SEO and accessibility
    // with some weight from performance and security
    const performance = scores.performanceScore || 0;
    const security = scores.bestPracticesScore || 0;

    const contentScore =
      seo * 0.4 + accessibility * 0.3 + performance * 0.2 + security * 0.1;
    return Math.round(contentScore);
  }

  /**
   * Get all calculated scores for an analysis
   */
  static getAllScores(scores: AnalysisScores): CalculatedScores {
    return {
      overall: this.calculateOverallScore(scores),
      seo: scores.seoScore || 0,
      performance: scores.performanceScore || 0,
      accessibility: scores.accessibilityScore || 0,
      security: scores.bestPracticesScore || 0,
      content: this.calculateContentScore(scores),
    };
  }

  /**
   * Get the primary score and type for display
   */
  static getPrimaryScore(scores: AnalysisScores): {
    score: number;
    type: string;
  } {
    const calculatedScores = this.getAllScores(scores);

    // Find the highest score among the main categories
    const mainScores = [
      { type: "seo", score: calculatedScores.seo },
      { type: "performance", score: calculatedScores.performance },
      { type: "accessibility", score: calculatedScores.accessibility },
      { type: "security", score: calculatedScores.security },
    ];

    const highest = mainScores.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    return {
      score: highest.score,
      type: highest.type,
    };
  }

  /**
   * Validate score ranges (0-100)
   */
  static validateScore(score: number | null | undefined): number {
    if (score === null || score === undefined) return 0;
    if (score < 0) return 0;
    if (score > 100) return 100;
    return Math.round(score);
  }

  /**
   * Get score color based on value
   */
  static getScoreColor(score: number): string {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  }

  /**
   * Get score background color based on value
   */
  static getScoreBgColor(score: number): string {
    if (score >= 90) return "bg-green-500/10 border-green-500/20";
    if (score >= 70) return "bg-yellow-500/10 border-yellow-500/20";
    if (score >= 50) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  }

  /**
   * Get score status (excellent, good, fair, poor)
   */
  static getScoreStatus(score: number): string {
    if (score >= 90) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "fair";
    return "poor";
  }
}
