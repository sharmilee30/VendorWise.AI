import { normalizeAiReply } from '../server/aiReply';

let failures = 0;
function check(name: string, condition: boolean) {
  if (condition) console.log(`✅ PASSED: ${name}`);
  else {
    console.error(`❌ FAILED: ${name}`);
    failures++;
  }
}

console.log('--- AI reply guardrails ---');

const goodReply = {
  executiveSummary: 'Summary.',
  recommendedVendor: 'Delta Components',
  whyRankedHighest: 'Because.',
  majorStrengths: ['a', 'b'],
  majorWeaknesses: ['c'],
  bestAlternative: { name: 'Beta Industrial', justification: 'Backup.' },
  weightSensitivity: 'Sensitive.',
};

{
  const r = normalizeAiReply(goodReply, 'Delta Components', 'Beta Industrial');
  check('A well-formed reply passes through unchanged', r.whyRankedHighest === 'Because.' && r.majorStrengths.length === 2);
}
{
  const hijacked = { ...goodReply, recommendedVendor: 'Alpha Supplies', bestAlternative: { name: 'Gamma Materials', justification: 'x' } };
  const r = normalizeAiReply(hijacked, 'Delta Components', 'Beta Industrial');
  check('Recommended vendor is pinned to the app ranking, not the model', r.recommendedVendor === 'Delta Components');
  check('Backup vendor is pinned to the app ranking, not the model', r.bestAlternative.name === 'Beta Industrial');
  check('Backup justification text is still kept', r.bestAlternative.justification === 'x');
}
{
  const bad: any = {
    whyRankedHighest: { evil: true },
    majorStrengths: 'not a list',
    majorWeaknesses: [1, null, { a: 1 }, 'ok'],
    weightSensitivity: 42,
    executiveSummary: ['array'],
    bestAlternative: 'nope',
  };
  const r = normalizeAiReply(bad, 'Delta Components', 'Beta Industrial');
  check('Wrong-typed text fields are dropped (empty string)', r.whyRankedHighest === '' && r.weightSensitivity === '' && r.executiveSummary === '');
  check('A non-list is replaced by an empty list', r.majorStrengths.length === 0);
  check('Non-string list items are removed, strings kept', r.majorWeaknesses.length === 1 && r.majorWeaknesses[0] === 'ok');
  check('A malformed bestAlternative still yields the ranked backup name', r.bestAlternative.name === 'Beta Industrial' && r.bestAlternative.justification === '');
}
{
  const r = normalizeAiReply({ ...goodReply, whyRankedHighest: 'x'.repeat(5000), majorStrengths: Array.from({ length: 20 }, () => 'y'.repeat(900)) }, 'D', 'B');
  check('Long text is capped', r.whyRankedHighest.length <= 1500);
  check('Lists are capped in count and item length', r.majorStrengths.length <= 6 && r.majorStrengths.every((s) => s.length <= 400));
}
{
  const r = normalizeAiReply({ ...goodReply, whyRankedHighest: 'ok\u0000\u0007text\nnext line' }, 'D', 'B');
  check('Control characters are removed but line breaks are kept', r.whyRankedHighest === 'oktext\nnext line');
}
for (const garbage of [null, undefined, 'string', 42, [], [1, 2]]) {
  const r = normalizeAiReply(garbage, 'Delta Components', 'Beta Industrial');
  check(`Garbage reply (${JSON.stringify(garbage)}) yields safe defaults`, r.recommendedVendor === 'Delta Components' && r.majorStrengths.length === 0);
}
{
  const r = normalizeAiReply(goodReply, 'Delta Components', '');
  check('Missing runner-up falls back to N/A', r.bestAlternative.name === 'N/A');
}

if (failures > 0) {
  console.error(`\n💥 ${failures} AI REPLY TEST(S) FAILED`);
  process.exit(1);
}
console.log('\n🎉 ALL AI REPLY TESTS PASSED!');
