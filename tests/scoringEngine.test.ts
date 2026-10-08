import {
  DEFAULT_VENDORS,
  DEFAULT_WEIGHTS,
  validateInputs,
  calculateVendorScores,
  computeScenarioDiff,
  generateDeterministicRecommendation,
} from '../src/services/scoringEngine';
import { CriteriaWeights, Vendor } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- TEST 1: Default Baseline Deterministic Calculations ---');
const validation = validateInputs(DEFAULT_VENDORS, DEFAULT_WEIGHTS);
assert(validation.isValid, 'Default data and weights must be valid');
assert(validation.totalWeight === 100, 'Total default weight must equal 100');

const scores = calculateVendorScores(DEFAULT_VENDORS, DEFAULT_WEIGHTS);
assert(scores.length === 5, 'Must calculate scores for all 5 default vendors');

// Verify rank ordering
assert(scores[0].name === 'Delta Components', 'Delta Components must rank #1');
assert(scores[0].overallScore === 88.80, `Delta Components score must be 88.80 (got ${scores[0].overallScore})`);
assert(scores[0].isRecommended === true, 'Delta Components must be marked isRecommended');

assert(scores[1].name === 'Beta Industrial', 'Beta Industrial must rank #2');
assert(scores[1].overallScore === 87.90, `Beta Industrial score must be 87.90 (got ${scores[1].overallScore})`);
assert(scores[1].isAlternative === true, 'Beta Industrial must be marked isAlternative');

assert(scores[2].name === 'Epsilon Manufacturing', 'Epsilon Manufacturing must rank #3');
assert(scores[2].overallScore === 84.00, `Epsilon Manufacturing score must be 84.00 (got ${scores[2].overallScore})`);

assert(scores[3].name === 'Gamma Materials', 'Gamma Materials must rank #4');
assert(scores[3].overallScore === 81.75, `Gamma Materials score must be 81.75 (got ${scores[3].overallScore})`);

assert(scores[4].name === 'Alpha Supplies', 'Alpha Supplies must rank #5');
assert(scores[4].overallScore === 81.15, `Alpha Supplies score must be 81.15 (got ${scores[4].overallScore})`);

console.log('\n--- TEST 2: Validation Edge Cases ---');
// Weight != 100
const invalidWeights: CriteriaWeights = { cost: 30, quality: 30, delivery: 20, reliability: 15, sustainability: 10 }; // 105%
const vWeight = validateInputs(DEFAULT_VENDORS, invalidWeights);
assert(!vWeight.isValid, 'Weight totaling 105% must fail validation');
assert(vWeight.errors.some(e => e.includes('105%')), 'Error message must mention current total');

// Blank Vendor Name
const vendorsWithBlank: Vendor[] = [
  ...DEFAULT_VENDORS.slice(0, 2),
  { id: 'v-blank', name: '   ', criteria: { cost: 80, quality: 80, delivery: 80, reliability: 80, sustainability: 80 } }
];
const vBlank = validateInputs(vendorsWithBlank, DEFAULT_WEIGHTS);
assert(!vBlank.isValid, 'Blank vendor name must fail validation');

// Duplicate Vendor Name
const vendorsWithDuplicate: Vendor[] = [
  ...DEFAULT_VENDORS.slice(0, 2),
  { id: 'v-dup', name: 'alpha supplies', criteria: { cost: 80, quality: 80, delivery: 80, reliability: 80, sustainability: 80 } }
];
const vDup = validateInputs(vendorsWithDuplicate, DEFAULT_WEIGHTS);
assert(!vDup.isValid, 'Duplicate vendor name must fail validation');

// Minimum 2 vendors required
const singleVendor = [DEFAULT_VENDORS[0]];
const vSingle = validateInputs(singleVendor, DEFAULT_WEIGHTS);
assert(!vSingle.isValid, 'Single vendor must fail validation');

// Score out of bounds (> 100)
const outOfBounds: Vendor[] = [
  { ...DEFAULT_VENDORS[0], criteria: { ...DEFAULT_VENDORS[0].criteria, cost: 115 } },
  DEFAULT_VENDORS[1],
];
const vBounds = validateInputs(outOfBounds, DEFAULT_WEIGHTS);
assert(!vBounds.isValid, 'Score of 115 must fail validation');

console.log('\n--- TEST 3: Scenario Sensitivity & Shift Detection ---');
// Switch to Cost-dominant weights: Cost 60%, Quality 15%, Delivery 10%, Reliability 10%, Sustainability 5%
const costHeavyWeights: CriteriaWeights = { cost: 60, quality: 15, delivery: 10, reliability: 10, sustainability: 5 };
const costScores = calculateVendorScores(DEFAULT_VENDORS, costHeavyWeights);
assert(costScores[0].name === 'Gamma Materials', `Gamma Materials should take #1 on 60% Cost (got ${costScores[0].name})`);

const scenarioDiff = computeScenarioDiff(
  DEFAULT_WEIGHTS,
  costHeavyWeights,
  scores[0].name,
  scores[0].overallScore,
  costScores[0].name,
  costScores[0].overallScore
);

assert(scenarioDiff !== null, 'Scenario diff must not be null');
assert(scenarioDiff!.changed === true, 'Recommendation shift must be detected as true');
assert(scenarioDiff!.previousWinner === 'Delta Components', 'Previous winner should be Delta Components');
assert(scenarioDiff!.newWinner === 'Gamma Materials', 'New winner should be Gamma Materials');
assert(scenarioDiff!.primaryCause.includes('Cost'), 'Primary cause must cite Cost weight change');

console.log('\n--- TEST 4: Rule-based Recommendation Fallback ---');
const rec = generateDeterministicRecommendation(scores, DEFAULT_WEIGHTS, scenarioDiff);
assert(rec.success === true, 'Recommendation generation should succeed');
assert(rec.recommendedVendor === 'Delta Components', 'Winner should be Delta Components');
assert(rec.bestAlternative.name === 'Beta Industrial', 'Best alternative should be Beta Industrial');
assert(rec.majorStrengths.length > 0, 'Strengths must be populated');
assert(rec.majorWeaknesses.length > 0, 'Weaknesses must be populated');
assert(rec.whyRankedHighest.length > 20, 'Why ranked highest text must be detailed');
assert(rec.weightSensitivity.length > 20, 'Weight sensitivity text must be detailed');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
