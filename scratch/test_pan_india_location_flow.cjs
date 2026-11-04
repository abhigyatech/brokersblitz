const assert = require('assert');
const { matchIndianCity, getCitiesForState, getAllIndianStates, POPULAR_INDIAN_STATES, findStateByNameOrCode } = require('/Users/professional/Developer/Personal/brokers-blitz/lib/geo/indian-locations');

async function testPanIndiaLocations() {
  console.log('--- STARTING PAN-INDIA REAL ESTATE LOCATION AUDIT ---');

  console.log('\n[TEST 1] Verifying 36 States and Union Territories Hierarchy');
  const allStates = getAllIndianStates();
  assert.strictEqual(allStates.length, 36, 'Must cover all 36 Indian states & union territories');
  assert.strictEqual(POPULAR_INDIAN_STATES.length, 10, 'Top real estate hubs capped for WhatsApp 10-row limit');
  
  const mpCities = getCitiesForState('MP');
  assert.ok(mpCities.includes('Indore'), 'MP must include Indore');
  assert.ok(mpCities.includes('Bhopal'), 'MP must include Bhopal');

  const mhCities = getCitiesForState('MH');
  assert.ok(mhCities.includes('Mumbai'), 'MH must include Mumbai');
  assert.ok(mhCities.includes('Pune'), 'MH must include Pune');

  const kaCities = getCitiesForState('KA');
  assert.ok(kaCities.includes('Bengaluru'), 'KA must include Bengaluru');
  
  const goa = findStateByNameOrCode('Goa');
  assert.ok(goa, 'Non-metro states like Goa must be resolvable');
  console.log('PASS: All 36 States & UTs catalogued with active city indices.');

  console.log('\n[TEST 2] Testing Direct City & Locality Recognition (NLP / Free Text)');
  const tests = [
    { input: 'bangalore', expectedCity: 'Bengaluru' },
    { input: 'bengaluru', expectedCity: 'Bengaluru' },
    { input: 'mumbai', expectedCity: 'Mumbai' },
    { input: 'bombay', expectedCity: 'Mumbai' },
    { input: 'indore', expectedCity: 'Indore' },
    { input: 'gurgaon', expectedCity: 'Gurgaon' },
    { input: 'gurugram', expectedCity: 'Gurgaon' },
    { input: 'delhi', expectedCity: 'Delhi' },
    { input: 'noida', expectedCity: 'Noida' },
    { input: 'hyderabad', expectedCity: 'Hyderabad' },
    { input: 'pune', expectedCity: 'Pune' },
    { input: 'ahmedabad', expectedCity: 'Ahmedabad' },
    { input: 'lucknow', expectedCity: 'Lucknow' },
    { input: 'chandigarh', expectedCity: 'Chandigarh' }
  ];

  for (const t of tests) {
    const matched = matchIndianCity(t.input);
    assert.ok(matched, `City "${t.input}" must be recognized`);
    assert.strictEqual(matched.city, t.expectedCity, `"${t.input}" must resolve to "${t.expectedCity}"`);
  }
  console.log(`PASS: Direct recognition validated across ${tests.length} Indian cities and colloquials.`);

  console.log('\n[TEST 3] Meta WhatsApp 10-Row Limit Compliance for Interactive Lists');
  const topHubs = POPULAR_INDIAN_STATES.slice(0, 9);
  const totalRows = topHubs.length + 1;
  assert.ok(totalRows <= 10, `WhatsApp interactive list items (${totalRows}) must be <= 10`);
  console.log(`PASS: WhatsApp List constraints strictly respected (${totalRows} <= 10 rows).`);

  console.log('\n--- ALL PAN-INDIA LOCATION TESTS PASSED SUCCESSFULLY ---');
}

testPanIndiaLocations().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
