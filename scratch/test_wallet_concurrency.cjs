const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  getOrCreateWallet,
  creditPaidBalance,
  deductCredits,
  getWalletStatement,
  verifyTransactionIntegrity,
  withWalletLock
} = require('/Users/professional/Developer/Personal/brokers-blitz/lib/wallet/wallet-service');

async function runWalletTests() {
  console.log('--- STARTING WALLET CONCURRENCY & INTEGRITY TEST SUITE ---');

  const testBrokerId = 'test-broker-concurrency-' + Date.now();

  console.log('\n[TEST 1] Initializing Test Wallet & Verifying Non-Negative Baseline');
  let statement = getWalletStatement(testBrokerId);
  assert.strictEqual(statement.wallet.totalBalance, 0, 'Initial balance must be 0');
  assert.strictEqual(statement.wallet.paidBalance, 0, 'Initial paid balance must be 0');
  assert.strictEqual(statement.wallet.freeBalance, 0, 'Initial bonus balance must be 0');
  console.log('PASS: Initial baseline zero balance confirmed.');

  console.log('\n[TEST 2] Recharging Wallet with Pro Pack (1,000 paid + 300 bonus credits)');
  const orderId = 'order_test_' + Date.now();
  const paymentId = 'pay_test_' + Date.now();
  const rechargeRes = await creditPaidBalance(
    testBrokerId,
    1000,
    {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      bonusCredits: 300,
      packId: 'pro',
      invoiceAmount: 5000
    }
  );
  assert.strictEqual(rechargeRes.wallet.totalBalance, 1300, 'Balance after Pro pack recharge must be 1300');
  assert.strictEqual(rechargeRes.wallet.paidBalance, 1000, 'Paid balance must be 1000');
  assert.strictEqual(rechargeRes.wallet.freeBalance, 300, 'Bonus balance must be 300');
  console.log('PASS: Wallet recharged accurately. Total: 1300 credits.');

  console.log('\n[TEST 3] Testing Idempotency: Re-submitting Identical Payment / Order');
  const duplicateRes = await creditPaidBalance(
    testBrokerId,
    1000,
    {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      bonusCredits: 300,
      packId: 'pro',
      invoiceAmount: 5000
    }
  );
  assert.strictEqual(duplicateRes.wallet.totalBalance, 1300, 'Balance must remain 1300, duplicate payment rejected');
  console.log('PASS: Idempotency enforced. Duplicate order rejected cleanly.');

  console.log('\n[TEST 4] High-Concurrency Race Condition Test: 10 Simultaneous Debits of 100 credits');
  statement = getWalletStatement(testBrokerId);
  assert.strictEqual(statement.wallet.totalBalance, 1300);

  const debitPromises = [];
  for (let i = 0; i < 10; i++) {
    debitPromises.push(
      deductCredits(
        testBrokerId,
        100,
        'LISTING_ACTIVE_CHARGE',
        `Concurrent test listing #${i}`,
        { propertyId: `prop-concurrent-${i}` }
      )
    );
  }
  const results = await Promise.all(debitPromises);
  const successCount = results.filter((r) => r && r.wallet).length;
  assert.strictEqual(successCount, 10, 'All 10 debits should succeed atomically');

  statement = getWalletStatement(testBrokerId);
  assert.strictEqual(statement.wallet.totalBalance, 300, 'Remaining balance must be exactly 1300 - 1000 = 300');
  console.log(`PASS: Sequential promise lock processed all 10 concurrent requests without race conditions. Balance: ${statement.wallet.totalBalance}`);

  console.log('\n[TEST 5] Over-Debit Protection (Prevent Negative Balance)');
  let overDebitFailed = false;
  try {
    await deductCredits(
      testBrokerId,
      500,
      'LISTING_ACTIVE_CHARGE',
      'Should fail due to insufficient credits',
      { propertyId: 'prop-fail' }
    );
  } catch (err) {
    overDebitFailed = true;
  }
  assert.strictEqual(overDebitFailed, true, 'Over-debit must be rejected with error');
  statement = getWalletStatement(testBrokerId);
  assert.strictEqual(statement.wallet.totalBalance, 300, 'Balance must remain unaffected');
  console.log('PASS: Over-debit prevented cleanly. Balance protected at 300 credits.');

  console.log('\n[TEST 6] Ledger Audit & Checksum Chaining Verification');
  const transactions = statement.transactions;
  assert.ok(transactions.length >= 11, 'Ledger must record recharge and all 10 debits');
  
  for (let i = 0; i < transactions.length; i++) {
    const entry = transactions[i];
    assert.ok(entry.checksum && entry.checksum.length === 64, 'Each entry must have a valid SHA-256 HMAC checksum');
    const valid = verifyTransactionIntegrity(entry, i > 0 ? transactions[i - 1] : undefined);
    assert.ok(valid, `Entry ${entry.id} must pass cryptographic integrity check`);
  }
  console.log(`PASS: Cryptographic ledger integrity verified across all ${transactions.length} entries with continuous SHA-256 HMAC checksum chaining.`);

  console.log('\n--- ALL WALLET AUDIT TESTS PASSED WITH 100% INTEGRITY ---');
}

runWalletTests().catch((err) => {
  console.error('FAIL: Test error:', err);
  process.exit(1);
});
