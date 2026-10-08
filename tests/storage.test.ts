export {};

// Minimal browser stubs so the storage helpers can run under Node.
const store = new Map<string, string>();
let throwOnWrite = false;
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    if (throwOnWrite) throw new Error('QuotaExceededError');
    store.set(k, v);
  },
  removeItem: (k: string) => store.delete(k),
};
(globalThis as any).window = { location: { search: '' } };

const { loadJson, saveJson, isWeights, isVendorList, isSnapshotList, isOneOf } = await import('../src/utils/storage');

let failures = 0;
function check(name: string, condition: boolean) {
  if (condition) console.log(`✅ PASSED: ${name}`);
  else {
    console.error(`❌ FAILED: ${name}`);
    failures++;
  }
}

const goodWeights = { cost: 30, quality: 30, delivery: 20, reliability: 15, sustainability: 5 };
const goodVendor = { id: 'v1', name: 'A', criteria: { cost: 1, quality: 2, delivery: 3, reliability: 4, sustainability: 5 } };

console.log('--- Safe localStorage helpers (warnings below are expected) ---');

check('Missing key returns fallback', loadJson('nope', 42) === 42);

store.set('w', JSON.stringify(goodWeights));
check('Valid saved weights are loaded', loadJson<{ cost: number } | null>('w', null, isWeights)?.cost === 30);

store.set('bad-json', '{not json');
check('Corrupt JSON returns fallback instead of throwing', loadJson('bad-json', 'fallback') === 'fallback');

store.set('w2', JSON.stringify({ cost: 'lots' }));
check('Wrong-shaped weights return fallback', loadJson('w2', 'fallback', isWeights) === 'fallback');

store.set('v', JSON.stringify([goodVendor]));
check('Valid vendor list is loaded', loadJson<unknown[]>('v', [], isVendorList).length === 1);
store.set('v2', JSON.stringify([{ id: 1 }]));
check('Invalid vendor list returns fallback', loadJson<unknown[]>('v2', [], isVendorList).length === 0);

check('Snapshot validator accepts valid list', isSnapshotList([{ id: 's', weights: goodWeights }]));
check('Snapshot validator rejects junk', !isSnapshotList([{ id: 's' }]));

const isPage = isOneOf(['dashboard', 'ai'] as const);
check('isOneOf accepts allowed value', isPage('ai'));
check('isOneOf rejects unknown value', !isPage('<script>'));

saveJson('round', { a: 1 });
check('saveJson/loadJson round-trips', loadJson<{ a: number }>('round', { a: 0 }).a === 1);

throwOnWrite = true;
let threw = false;
try {
  saveJson('x', 1);
} catch {
  threw = true;
}
check('saveJson does not throw when storage is full', !threw);

if (failures > 0) {
  console.error(`\n💥 ${failures} STORAGE TEST(S) FAILED`);
  process.exit(1);
}
console.log('\n🎉 ALL STORAGE TESTS PASSED!');
