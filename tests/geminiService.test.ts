import { generateGeminiRecommendation } from '../server/geminiService';
import {
  DEFAULT_VENDORS,
  DEFAULT_WEIGHTS,
  calculateVendorScores,
} from '../src/services/scoringEngine';

async function testGeminiService() {
  console.log('--- Testing Gemini Service Fallback Handling ---');
  const scored = calculateVendorScores(DEFAULT_VENDORS, DEFAULT_WEIGHTS);

  const payload = {
    companyContext: 'Nova Manufacturing Ltd.',
    criteriaWeights: DEFAULT_WEIGHTS,
    rankedVendors: scored.map(v => ({
      rank: v.rank,
      name: v.name,
      overallScore: v.overallScore,
      criteria: v.criteria,
      isRecommended: v.isRecommended,
    })),
    scenarioDiff: null,
  };

  // Run against a controlled environment, regardless of the developer's real .env
  const originalKey = process.env.GEMINI_API_KEY;

  // 1. Test when no API key is provided
  delete process.env.GEMINI_API_KEY;
  const resultWithoutKey = await generateGeminiRecommendation(payload);
  console.log('Result without key:', {
    success: resultWithoutKey.success,
    isAiGenerated: resultWithoutKey.isAiGenerated,
    winner: resultWithoutKey.recommendedVendor,
    hasError: Boolean(resultWithoutKey.error),
    error: resultWithoutKey.error,
  });

  if (
    resultWithoutKey.recommendedVendor === 'Delta Components' &&
    resultWithoutKey.bestAlternative.name === 'Beta Industrial' &&
    resultWithoutKey.majorStrengths.length > 0
  ) {
    console.log('✅ PASS: Graceful fallback produces complete structured recommendation');
  } else {
    console.error('❌ FAIL: Expected fallback to populate complete structured fields');
    process.exit(1);
  }

  // 2. Test when an invalid key is configured (real API rejects it, or network is down:
  //    either way the service must fall back instead of throwing)
  process.env.GEMINI_API_KEY = 'INVALID_KEY_123';
  const resultWithInvalidKey = await generateGeminiRecommendation(payload);
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
  console.log('Result with invalid key:', {
    success: resultWithInvalidKey.success,
    isAiGenerated: resultWithInvalidKey.isAiGenerated,
    winner: resultWithInvalidKey.recommendedVendor,
    hasError: Boolean(resultWithInvalidKey.error),
    error: resultWithInvalidKey.error,
  });

  if (
    resultWithInvalidKey.isAiGenerated === false &&
    resultWithInvalidKey.recommendedVendor === 'Delta Components' &&
    resultWithInvalidKey.error?.includes('AI explanation is temporarily unavailable')
  ) {
    console.log('✅ PASS: Service failure returned exact prompt requirement message');
  } else {
    console.error('❌ FAIL: Expected exact error message format');
    process.exit(1);
  }

  console.log('\n🎉 ALL GEMINI SERVICE TESTS PASSED!');
}

testGeminiService();
