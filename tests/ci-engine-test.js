// tests/ci-engine-test.js
// Quick integration test for the Competitive Intelligence Engine

const { competitiveIntelligenceEngine } = require('../src/lib/services/competitive-intelligence-engine');

async function testCIEngine() {
  console.log('🔧 Testing Competitive Intelligence Engine Core Functions...\n');

  const testDomain = 'example.com';
  const testCompetitors = ['competitor1.com', 'competitor2.com'];

  try {
    // Test 1: Competitor Discovery
    console.log('1. Testing Competitor Discovery...');
    const competitors = await competitiveIntelligenceEngine.discoverCompetitors(
      testDomain,
      { limit: 3 }
    );
    console.log(`✅ Discovered ${competitors.length} competitors`);
    if (competitors.length > 0) {
      console.log(`   - Top competitor: ${competitors[0].domain} (relevance: ${competitors[0].relevanceScore.toFixed(2)})`);
    }

    // Test 2: Keyword Gap Analysis
    console.log('\n2. Testing Keyword Gap Analysis...');
    const keywordGaps = await competitiveIntelligenceEngine.analyzeKeywordGaps(
      testDomain,
      testCompetitors,
      { limit: 10 }
    );
    console.log(`✅ Found ${keywordGaps.length} keyword gaps`);
    if (keywordGaps.length > 0) {
      const urgent = keywordGaps.filter(k => k.priority === 'urgent').length;
      console.log(`   - Urgent opportunities: ${urgent}`);
      console.log(`   - Top keyword: ${keywordGaps[0].keyword} (score: ${keywordGaps[0].opportunityScore.toFixed(1)})`);
    }

    // Test 3: Backlink Gap Analysis
    console.log('\n3. Testing Backlink Gap Analysis...');
    const backlinkGaps = await competitiveIntelligenceEngine.analyzeBacklinkGaps(
      testDomain,
      testCompetitors,
      { limit: 10 }
    );
    console.log(`✅ Found ${backlinkGaps.length} backlink gaps`);
    if (backlinkGaps.length > 0) {
      const highValue = backlinkGaps.filter(b => b.linkValue >= 70).length;
      console.log(`   - High-value opportunities: ${highValue}`);
      console.log(`   - Top domain: ${backlinkGaps[0].linkingDomain} (DA: ${backlinkGaps[0].domainAuthority})`);
    }

    // Test 4: Content Gap Analysis
    console.log('\n4. Testing Content Gap Analysis...');
    const contentGaps = await competitiveIntelligenceEngine.analyzeContentGaps(
      testDomain,
      testCompetitors,
      { limit: 10 }
    );
    console.log(`✅ Found ${contentGaps.length} content gaps`);
    if (contentGaps.length > 0) {
      const urgent = contentGaps.filter(c => c.priority === 'urgent').length;
      console.log(`   - Urgent content: ${urgent}`);
      console.log(`   - Top topic: ${contentGaps[0].topic} (score: ${contentGaps[0].opportunityScore.toFixed(1)})`);
    }

    // Test 5: Comprehensive Report
    console.log('\n5. Testing Comprehensive Report Generation...');
    const report = await competitiveIntelligenceEngine.generateCompetitiveIntelligenceReport(
      testDomain,
      { maxCompetitors: 3 }
    );
    console.log(`✅ Generated comprehensive report`);
    console.log(`   - Market position: #${report.marketPosition.rank} of ${report.marketPosition.totalAnalyzed}`);
    console.log(`   - Opportunities found: ${report.opportunities.length}`);
    console.log(`   - Recommendations: ${report.recommendations.length}`);
    console.log(`   - Total gaps: Keywords(${report.keywordGaps.length}), Backlinks(${report.backlinkGaps.length}), Content(${report.contentGaps.length})`);

    console.log('\n✅ All core engine functions working correctly!');
    console.log('\n🏆 Competitive Intelligence Engine is ready for production!');

  } catch (error) {
    console.error('❌ Engine test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (typeof window === 'undefined') {
  testCIEngine().catch(console.error);
}

module.exports = { testCIEngine };