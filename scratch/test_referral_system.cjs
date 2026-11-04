const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  getReferralConfig,
  updateReferralConfig,
  validateReferralCode,
  processReferralReward,
  getUserReferralInfo,
  getAdminReferralOverview,
  findReferrerByCode
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/referral/referral-service');

const {
  createNewUser,
  findUserById,
  getAllUsers
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/auth/user-store');

const {
  getWalletStatement
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/wallet/wallet-service');

async function runReferralTestSuite() {
  console.log('--- STARTING REFERRAL CODE SYSTEM AUDIT & E2E TESTS ---');

  console.log('\n[TEST 1] Verifying Default Referral Configuration (50 Credits, 1 Month Expiry)');
  const config = getReferralConfig();
  assert.strictEqual(config.referrerRewardCredits, 50, 'Default referrer reward must be 50 credits');
  assert.strictEqual(config.refereeRewardCredits, 50, 'Default referee reward must be 50 credits');
  assert.strictEqual(config.expiryDays, 30, 'Default expiry must be 30 days (1 month)');
  assert.strictEqual(config.isEnabled, true, 'Referral program must be enabled by default');
  console.log('PASS: Default configuration verified: 50 credits to both, 30 days validity.');

  console.log('\n[TEST 2] Testing Admin Configuration Updates');
  const updated = updateReferralConfig(
    {
      referrerRewardCredits: 75,
      refereeRewardCredits: 75,
      expiryDays: 45
    },
    'admin@brokersblitz.in'
  );
  assert.strictEqual(updated.referrerRewardCredits, 75);
  assert.strictEqual(updated.refereeRewardCredits, 75);
  assert.strictEqual(updated.expiryDays, 45);
  assert.strictEqual(updated.updatedBy, 'admin@brokersblitz.in');
  console.log('PASS: Admin configuration update verified.');

  const restored = updateReferralConfig(
    {
      referrerRewardCredits: 50,
      refereeRewardCredits: 50,
      expiryDays: 30,
      isEnabled: true
    },
    'admin@brokersblitz.in'
  );
  assert.strictEqual(restored.referrerRewardCredits, 50);
  assert.strictEqual(restored.expiryDays, 30);
  console.log('PASS: Reset back to standard 50 credits & 30 days.');

  console.log('\n[TEST 3] Testing Referral Code Resolution (Case-Insensitive & Formats)');
  const indoreBroker = findReferrerByCode('INDORE1001');
  assert.ok(indoreBroker, 'INDORE1001 must resolve to Sanjay Verma');
  assert.strictEqual(indoreBroker.fullName, 'Sanjay Verma');

  const indoreLower = findReferrerByCode('indore1001');
  assert.ok(indoreLower, 'Lowercase indore1001 must also resolve');
  assert.strictEqual(indoreLower.id, indoreBroker.id);

  const apexBroker = findReferrerByCode('APEX-PRIME');
  assert.ok(apexBroker, 'APEX-PRIME must resolve to Rajesh Mehta');

  const apexStripped = findReferrerByCode('APEXPRIME');
  assert.ok(apexStripped, 'APEXPRIME must also resolve to Rajesh Mehta');
  console.log('PASS: Referral code resolution validated across case and hyphens.');

  console.log('\n[TEST 4] Testing Referral Validation Guardrails');
  const invalidVal = validateReferralCode('NONEXISTENT_CODE_999');
  assert.strictEqual(invalidVal.valid, false, 'Non-existent code must be rejected');

  const selfVal = validateReferralCode('INDORE1001', indoreBroker.id);
  assert.strictEqual(selfVal.valid, false, 'Self-referral must be rejected');
  assert.ok(selfVal.error.includes('own referral code'));
  console.log('PASS: Invalid codes and self-referrals strictly rejected.');

  console.log('\n[TEST 5] End-to-End Registration With Referral Reward Execution');
  const referrerId = indoreBroker.id;
  const initialReferrerWallet = getWalletStatement(referrerId);
  const initialReferrerFree = initialReferrerWallet.wallet.freeBalance;
  const initialReferrerTotal = initialReferrerWallet.wallet.totalBalance;

  const testStamp = Date.now();
  const testPhone = '97' + String(testStamp).slice(-8);
  const testEmail = `referred.user.${testStamp}@example.com`;

  const regRes = createNewUser({
    fullName: 'Test Referred Buyer',
    email: testEmail,
    phone: testPhone,
    role: 'buyer',
    password: 'Password@2026',
    referredBy: referrerId,
    dpdpConsent: true
  });
  assert.ok(regRes.success && regRes.user, 'New user registration must succeed');
  const newUserId = regRes.user.id;

  const rewardRes = await processReferralReward(newUserId, 'INDORE1001');
  assert.ok(rewardRes.success, 'Referral reward execution must succeed');
  assert.strictEqual(rewardRes.referrerCredits, 50, 'Referrer must receive 50 credits');
  assert.strictEqual(rewardRes.refereeCredits, 50, 'Referee must receive 50 credits');
  assert.strictEqual(rewardRes.expiryDays, 30, 'Expiry must be 30 days');

  const afterReferrerWallet = getWalletStatement(referrerId);
  assert.strictEqual(
    afterReferrerWallet.wallet.freeBalance,
    initialReferrerFree + 50,
    'Referrer free balance must increase by exactly 50'
  );
  assert.strictEqual(
    afterReferrerWallet.wallet.totalBalance,
    initialReferrerTotal + 50,
    'Referrer total balance must increase by exactly 50'
  );

  const afterRefereeWallet = getWalletStatement(newUserId);
  assert.strictEqual(afterRefereeWallet.wallet.freeBalance, 50, 'Referee free balance must be 50');
  assert.strictEqual(afterRefereeWallet.wallet.totalBalance, 50, 'Referee total balance must be 50');

  const refereeGrant = afterRefereeWallet.grants.find((g) => g.remainingAmount === 50);
  assert.ok(refereeGrant, 'Promotional grant of 50 credits must exist for referee');
  const expMs = new Date(refereeGrant.expiresAt).getTime();
  const diffDays = Math.round((expMs - Date.now()) / (24 * 3600 * 1000));
  assert.ok(diffDays >= 29 && diffDays <= 31, 'Grant expiry must be ~30 days (1 month)');

  console.log('PASS: Both Referrer and Referee successfully credited 50 credits with 30-day expiry.');

  console.log('\n[TEST 6] Testing Double-Reward Prevention (Idempotency)');
  const duplicateReward = await processReferralReward(newUserId, 'INDORE1001');
  assert.strictEqual(duplicateReward.success, false, 'Duplicate reward execution must be rejected');
  assert.ok(duplicateReward.error.includes('already awarded'));

  const finalReferrerWallet = getWalletStatement(referrerId);
  assert.strictEqual(
    finalReferrerWallet.wallet.totalBalance,
    initialReferrerTotal + 50,
    'Referrer balance must not increase again on duplicate call'
  );
  console.log('PASS: Duplicate referral execution blocked cleanly.');

  console.log('\n[TEST 7] Testing User & Admin Referral Insights Endpoints');
  const userReferralInfo = getUserReferralInfo(referrerId);
  assert.ok(userReferralInfo.referralCode, 'User referral code must exist');
  assert.ok(userReferralInfo.totalReferrals >= 1, 'Total referrals must reflect new referral');
  assert.ok(userReferralInfo.totalCreditsEarned >= 50, 'Total credits earned must reflect 50');
  assert.ok(userReferralInfo.referralLink.includes('signup?ref='), 'Referral link must be formatted');

  const adminOverview = getAdminReferralOverview();
  assert.ok(adminOverview.totalReferralsCount >= 1, 'Admin overview must record referrals');
  assert.ok(adminOverview.totalCreditsDistributed >= 100, 'Admin overview must record credits distributed (50+50=100)');
  console.log('PASS: User insights and Admin platform overview validated.');

  console.log('\n--- ALL REFERRAL SYSTEM AUDIT TESTS COMPLETED WITH 100% SUCCESS ---');
}

runReferralTestSuite().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
