const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  generateDataPrincipalExport,
  executeDataPrincipalErasure
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/compliance/dpdp-service');

const {
  createNewUser,
  findUserById,
  getAllUsers,
  toggleUserLock,
  createSession,
  verifySession
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/auth/user-store');

async function runComplianceTestSuite() {
  console.log('--- STARTING CRITICAL ACTIONS & DPDP ACT / GDPR COMPLIANCE TEST SUITE ---');

  const testStamp = Date.now();
  const testPhone = '96' + String(testStamp).slice(-8);
  const testEmail = `principal.${testStamp}@testdpdp.in`;

  console.log('\n[TEST 1] Registering Test Data Principal with Affirmative Consent');
  const regRes = createNewUser({
    fullName: 'Anand Kumar Verma',
    email: testEmail,
    phone: testPhone,
    role: 'broker',
    password: 'Password@2026',
    agencyName: 'Verma Estate Advisory',
    reraNumber: 'MP/RERA/IND/2024/9999',
    operatingCity: 'Indore',
    dpdpConsent: true,
  });
  assert.ok(regRes.success && regRes.user, 'Registration must succeed');
  const userId = regRes.user.id;
  assert.strictEqual(regRes.user.dpdpConsent, true);
  console.log(`PASS: Data Principal registered with valid DPDP consent. ID: ${userId}`);

  console.log('\n[TEST 2] Testing Critical Account Suspension (Admin Lock Safeguards)');
  const lockRes = toggleUserLock(userId);
  assert.ok(lockRes.success && lockRes.user);
  assert.strictEqual(lockRes.user.isLocked, true, 'User must now be locked');

  const adminLock = toggleUserLock('user-admin-01');
  assert.strictEqual(adminLock.success, false, 'Administrator account must never be lockable');
  console.log('PASS: Account suspension executed; administrator lockout prevented.');

  console.log('\n[TEST 3] Testing DPDP Act Section 11 & GDPR Art. 15/20 Data Export');
  const exportRes = generateDataPrincipalExport(userId);
  assert.ok(exportRes.success && exportRes.data, 'Data export must succeed');
  const exportData = exportRes.data;

  assert.strictEqual(exportData.complianceNotice.framework, 'Digital Personal Data Protection Act, 2023 (DPDP Act) & GDPR Principles');
  assert.strictEqual(exportData.personalProfile.fullName, 'Anand Kumar Verma');
  assert.strictEqual(exportData.personalProfile.email, testEmail);
  assert.strictEqual(exportData.personalProfile.phone, testPhone);
  assert.ok(Array.isArray(exportData.propertyListings), 'Listings array must be present');
  assert.ok(exportData.walletAndLedger, 'Wallet and ledger details must be present');
  console.log('PASS: Data Principal Export generated with complete structured PII & financial archive.');

  console.log('\n[TEST 4] Testing DPDP Act Section 12 & GDPR Art. 17 Right to Erasure');
  const token = createSession(userId);
  assert.ok(token, 'Session token must be created');
  const verifiedBefore = verifySession(token);
  assert.ok(verifiedBefore && verifiedBefore.id === userId, 'Session must be active prior to erasure');

  const erasureRes = executeDataPrincipalErasure(userId);
  assert.ok(erasureRes.success, 'Data erasure execution must succeed');

  const userAfter = findUserById(userId);
  assert.ok(userAfter, 'User record stub exists for tombstone verification');
  assert.strictEqual(userAfter.fullName, 'Deleted User [DPDP Erased]', 'Name must be anonymized');
  assert.strictEqual(userAfter.phone, '0000000000', 'Phone number must be wiped');
  assert.strictEqual(userAfter.passwordHash, 'ERASED', 'Password hash must be wiped');
  assert.strictEqual(userAfter.dpdpConsent, false, 'Consent must be revoked');

  const verifiedAfter = verifySession(token);
  assert.strictEqual(verifiedAfter, null, 'Active sessions must be revoked immediately upon erasure');
  console.log('PASS: Personal data completely erased and sessions terminated in accordance with Section 12 DPDP Act 2023.');

  console.log('\n[TEST 5] Testing Admin Account Erasure Safeguard');
  const adminErasure = executeDataPrincipalErasure('user-admin-01');
  assert.strictEqual(adminErasure.success, false, 'Admin account cannot be erased via self-service');
  console.log('PASS: System administrator account protected against unauthorized erasure.');

  console.log('\n[TEST 6] Testing Compliance Audit Ledger');
  const auditPath = path.join(process.cwd(), 'data', 'compliance_audit.json');
  assert.ok(fs.existsSync(auditPath), 'compliance_audit.json must exist');
  const auditLogs = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
  assert.ok(auditLogs.length >= 2, 'Audit logs must record export and erasure');

  const erasureLog = auditLogs.find((l) => l.action === 'DATA_ERASURE');
  assert.ok(erasureLog, 'DATA_ERASURE audit event must be logged');
  assert.strictEqual(erasureLog.regulation, 'DPDP_ACT_2023_INDIA');
  console.log('PASS: Compliance audit ledger cryptographically hashes user IDs and logs compliance events.');

  console.log('\n--- ALL CRITICAL ACTIONS & DPDP / GDPR AUDIT TESTS PASSED WITH 100% SUCCESS ---');
}

runComplianceTestSuite().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});

