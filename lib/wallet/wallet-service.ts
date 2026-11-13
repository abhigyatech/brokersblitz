import crypto from 'crypto';
import { query } from '../db/postgres';

export type UserWalletStatus = 'active' | 'frozen' | 'suspended';

export interface BrokerWallet {
  id: string;
  brokerId: string;
  paidBalance: number;
  freeBalance: number;
  totalBalance: number;
  currency: string;
  status: UserWalletStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionalGrant {
  id: string;
  brokerId: string;
  initialAmount: number;
  remainingAmount: number;
  expiresAt: string;
  reason: string;
  grantedBy: string;
  grantedByName?: string;
  status: 'active' | 'exhausted' | 'expired' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'RECHARGE'
  | 'FREE_CREDIT_GRANT'
  | 'LEAD_UNLOCK'
  | 'LISTING_BOOST'
  | 'LISTING_ACTIVE_CHARGE'
  | 'EXPIRY'
  | 'REFUND'
  | 'ADMIN_ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  referenceId: string;
  brokerId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  paidDelta: number;
  freeDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED';
  description: string;
  metadata?: Record<string, any>;
  checksum: string;
  prevChecksum?: string;
  createdAt: string;
}

const LEDGER_SECRET = process.env.SESSION_SECRET || 'BrokersBlitz_Ledger_Secret_2026';

function computeChecksum(data: {
  id: string;
  brokerId: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  status: string;
  prevChecksum?: string;
}): string {
  const prev = data.prevChecksum || 'genesis';
  const payload = `${data.id}:${data.brokerId}:${data.amount}:${data.balanceAfter}:${data.createdAt}:${data.status}:${prev}`;
  return crypto.createHmac('sha256', LEDGER_SECRET).update(payload).digest('hex');
}

function generateReferenceId(type: TransactionType): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const prefix =
    type === 'RECHARGE'
      ? 'RCH'
      : type === 'FREE_CREDIT_GRANT'
      ? 'GRT'
      : type === 'LEAD_UNLOCK'
      ? 'LDU'
      : type === 'LISTING_ACTIVE_CHARGE'
      ? 'LAC'
      : type === 'EXPIRY'
      ? 'EXP'
      : 'TXN';
  return `${prefix}-${dateStr}-${rand}`;
}

function mapRowToWallet(row: any): BrokerWallet {
  const paid = Number(row.paid_balance) || 0;
  const free = Number(row.free_balance) || 0;
  return {
    id: String(row.id),
    brokerId: row.broker_id,
    paidBalance: paid,
    freeBalance: free,
    totalBalance: paid + free,
    currency: row.currency || 'INR',
    status: 'active',
    version: 1,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getOrCreateWallet(brokerId: string): Promise<BrokerWallet> {
  const selectRes = await query(
    `SELECT * FROM public.broker_wallets WHERE broker_id = $1 LIMIT 1`,
    [brokerId]
  );

  if (selectRes.rows.length === 0) {
    const insertRes = await query(
      `INSERT INTO public.broker_wallets (broker_id, paid_balance, free_balance, total_balance, currency, created_at, updated_at)
       VALUES ($1, 0, 0, 0, 'INR', now(), now())
       ON CONFLICT (broker_id) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [brokerId]
    );
    return mapRowToWallet(insertRes.rows[0]);
  }

  return syncWalletBalances(brokerId);
}

export async function syncWalletBalances(brokerId: string): Promise<BrokerWallet> {
  await query(
    `UPDATE public.promotional_grants
     SET is_expired = TRUE, remaining_amount = 0
     WHERE broker_id = $1 AND expires_at < now() AND is_expired IS FALSE`,
    [brokerId]
  );

  const activeGrantsRes = await query(
    `SELECT coalesce(sum(remaining_amount), 0) as free_total
     FROM public.promotional_grants
     WHERE broker_id = $1 AND is_expired IS FALSE AND expires_at >= now()`,
    [brokerId]
  );

  const freeTotal = Number(activeGrantsRes.rows[0]?.free_total) || 0;

  const updateRes = await query(
    `UPDATE public.broker_wallets
     SET free_balance = $1,
         total_balance = paid_balance + $1,
         updated_at = now()
     WHERE broker_id = $2
     RETURNING *`,
    [freeTotal, brokerId]
  );

  if (updateRes.rows.length === 0) {
    const insertRes = await query(
      `INSERT INTO public.broker_wallets (broker_id, paid_balance, free_balance, total_balance, currency, created_at, updated_at)
       VALUES ($1, 0, $2, $2, 'INR', now(), now())
       RETURNING *`,
      [brokerId, freeTotal]
    );
    return mapRowToWallet(insertRes.rows[0]);
  }

  return mapRowToWallet(updateRes.rows[0]);
}

export async function grantFreeCredits(
  brokerId: string,
  amount: number,
  expiryDays: number,
  reason: string,
  grantedBy: string = 'system',
  grantedByName?: string
): Promise<{
  id: string;
  brokerId: string;
  initialAmount: number;
  remainingAmount: number;
  expiresAt: string;
  reason: string;
  grantedBy: string;
  grantedByName?: string;
  status: 'active' | 'exhausted' | 'expired' | 'revoked';
  createdAt: string;
  updatedAt: string;
  wallet: BrokerWallet;
  transaction: WalletTransaction;
  grant: PromotionalGrant;
}> {
  const wallet = await getOrCreateWallet(brokerId);
  const grantId = `grt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const refId = generateReferenceId('FREE_CREDIT_GRANT');

  await query(
    `INSERT INTO public.promotional_grants (
      id, broker_id, type, amount, remaining_amount, granted_at, expires_at, is_expired, reason, reference_id
    ) VALUES (
      $1, $2, 'PROMOTIONAL', $3, $3, now(), $4, false, $5, $6
    )`,
    [grantId, brokerId, amount, expiresAt.toISOString(), reason, refId]
  );

  const balanceBefore = wallet.totalBalance;
  const balanceAfter = balanceBefore + amount;

  const txnId = `txn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const nowIso = now.toISOString();

  const checksum = computeChecksum({
    id: txnId,
    brokerId,
    amount,
    balanceAfter,
    createdAt: nowIso,
    status: 'SUCCESS',
  });

  await query(
    `INSERT INTO public.wallet_ledger (
      id, broker_id, type, amount, paid_delta, free_delta,
      balance_before, balance_after, status, description,
      metadata, checksum, created_at
    ) VALUES (
      $1, $2, 'FREE_CREDIT_GRANT', $3, 0, $3,
      $4, $5, 'SUCCESS', $6,
      $7::jsonb, $8, now()
    )`,
    [
      txnId,
      brokerId,
      amount,
      balanceBefore,
      balanceAfter,
      reason,
      JSON.stringify({ grantId, grantedBy, grantedByName, expiryDays }),
      checksum,
    ]
  );

  const updatedWallet = await syncWalletBalances(brokerId);

  const grant: PromotionalGrant = {
    id: grantId,
    brokerId,
    initialAmount: amount,
    remainingAmount: amount,
    expiresAt: expiresAt.toISOString(),
    reason,
    grantedBy,
    grantedByName,
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const transaction: WalletTransaction = {
    id: txnId,
    referenceId: refId,
    brokerId,
    walletId: wallet.id,
    type: 'FREE_CREDIT_GRANT',
    amount,
    paidDelta: 0,
    freeDelta: amount,
    balanceBefore,
    balanceAfter,
    status: 'SUCCESS',
    description: reason,
    metadata: { grantId, grantedBy, grantedByName, expiryDays },
    checksum,
    createdAt: nowIso,
  };

  return {
    ...grant,
    wallet: updatedWallet,
    transaction,
    grant,
  };
}

export async function creditPaidBalance(
  brokerId: string,
  amount: number,
  descriptionOrOptions: string | Record<string, any>,
  maybeMetadata?: Record<string, any>
): Promise<WalletTransaction & { wallet: BrokerWallet; transaction: WalletTransaction }> {
  const wallet = await getOrCreateWallet(brokerId);
  const balanceBefore = wallet.totalBalance;
  const balanceAfter = balanceBefore + amount;

  const description =
    typeof descriptionOrOptions === 'string'
      ? descriptionOrOptions
      : `Wallet recharge of ${amount} paid credits`;
  const metadata =
    typeof descriptionOrOptions === 'object'
      ? descriptionOrOptions
      : maybeMetadata || {};

  await query(
    `UPDATE public.broker_wallets
     SET paid_balance = paid_balance + $1,
         total_balance = total_balance + $1,
         total_recharged = coalesce(total_recharged, 0) + $1,
         updated_at = now()
     WHERE broker_id = $2`,
    [amount, brokerId]
  );

  const txnId = `txn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const nowIso = new Date().toISOString();
  const refId = generateReferenceId('RECHARGE');

  const checksum = computeChecksum({
    id: txnId,
    brokerId,
    amount,
    balanceAfter,
    createdAt: nowIso,
    status: 'SUCCESS',
  });

  await query(
    `INSERT INTO public.wallet_ledger (
      id, broker_id, type, amount, paid_delta, free_delta,
      balance_before, balance_after, status, description,
      metadata, checksum, created_at
    ) VALUES (
      $1, $2, 'RECHARGE', $3, $3, 0,
      $4, $5, 'SUCCESS', $6,
      $7::jsonb, $8, now()
    )`,
    [txnId, brokerId, amount, balanceBefore, balanceAfter, description, JSON.stringify(metadata || {}), checksum]
  );

  const updatedWallet = await syncWalletBalances(brokerId);

  const txn: WalletTransaction = {
    id: txnId,
    referenceId: refId,
    brokerId,
    walletId: wallet.id,
    type: 'RECHARGE',
    amount,
    paidDelta: amount,
    freeDelta: 0,
    balanceBefore,
    balanceAfter,
    status: 'SUCCESS',
    description,
    metadata,
    checksum,
    createdAt: nowIso,
  };

  return {
    ...txn,
    wallet: updatedWallet,
    transaction: txn,
  };
}

export async function deductCredits(
  brokerId: string,
  amount: number,
  type: TransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; transaction?: WalletTransaction }> {
  const wallet = await syncWalletBalances(brokerId);
  if (wallet.totalBalance < amount) {
    return {
      success: false,
      error: `Insufficient wallet balance. Required: ${amount} credits, Available: ${wallet.totalBalance} credits.`,
    };
  }

  let remainingToDeduct = amount;
  let freeDelta = 0;
  let paidDelta = 0;

  const grantsRes = await query(
    `SELECT * FROM public.promotional_grants
     WHERE broker_id = $1 AND is_expired IS FALSE AND remaining_amount > 0 AND expires_at >= now()
     ORDER BY expires_at ASC`,
    [brokerId]
  );

  for (const g of grantsRes.rows) {
    if (remainingToDeduct <= 0) break;
    const gRem = Number(g.remaining_amount);
    const take = Math.min(gRem, remainingToDeduct);
    const newRem = gRem - take;
    await query(
      `UPDATE public.promotional_grants SET remaining_amount = $1, is_expired = ($1 = 0) WHERE id = $2`,
      [newRem, g.id]
    );
    freeDelta += take;
    remainingToDeduct -= take;
  }

  if (remainingToDeduct > 0) {
    paidDelta = remainingToDeduct;
    await query(
      `UPDATE public.broker_wallets
       SET paid_balance = greatest(0, paid_balance - $1),
           total_spent = coalesce(total_spent, 0) + $1,
           updated_at = now()
       WHERE broker_id = $2`,
      [paidDelta, brokerId]
    );
  }

  const updatedWallet = await syncWalletBalances(brokerId);
  const txnId = `txn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const nowIso = new Date().toISOString();
  const balanceBefore = wallet.totalBalance;
  const balanceAfter = updatedWallet.totalBalance;

  const checksum = computeChecksum({
    id: txnId,
    brokerId,
    amount: -amount,
    balanceAfter,
    createdAt: nowIso,
    status: 'SUCCESS',
  });

  await query(
    `INSERT INTO public.wallet_ledger (
      id, broker_id, type, amount, paid_delta, free_delta,
      balance_before, balance_after, status, description,
      metadata, checksum, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, 'SUCCESS', $9,
      $10::jsonb, $11, now()
    )`,
    [
      txnId,
      brokerId,
      type,
      -amount,
      -paidDelta,
      -freeDelta,
      balanceBefore,
      balanceAfter,
      description,
      JSON.stringify(metadata || {}),
      checksum,
    ]
  );

  return {
    success: true,
    transaction: {
      id: txnId,
      referenceId: generateReferenceId(type),
      brokerId,
      walletId: wallet.id,
      type,
      amount: -amount,
      paidDelta: -paidDelta,
      freeDelta: -freeDelta,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description,
      metadata,
      checksum,
      createdAt: nowIso,
    },
  };
}

export async function getWalletStatement(
  brokerId: string,
  options?: { type?: string; search?: string; limit?: number }
): Promise<{
  wallet: BrokerWallet;
  ledger: WalletTransaction[];
  activeGrants: PromotionalGrant[];
  transactions: WalletTransaction[];
  grants: PromotionalGrant[];
  nearestExpiry: { amount: number; expiresAt: string } | null;
}> {
  const wallet = await syncWalletBalances(brokerId);
  const limit = options?.limit || 50;

  const ledgerRes = await query(
    `SELECT * FROM public.wallet_ledger WHERE broker_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [brokerId, limit]
  );

  const grantsRes = await query(
    `SELECT * FROM public.promotional_grants
     WHERE broker_id = $1 AND is_expired IS FALSE AND remaining_amount > 0 AND expires_at >= now()
     ORDER BY expires_at ASC`,
    [brokerId]
  );

  const ledger: WalletTransaction[] = ledgerRes.rows.map((r) => ({
    id: r.id,
    referenceId: r.id,
    brokerId: r.broker_id,
    walletId: wallet.id,
    type: r.type as TransactionType,
    amount: Number(r.amount),
    paidDelta: Number(r.paid_delta) || 0,
    freeDelta: Number(r.free_delta) || 0,
    balanceBefore: Number(r.balance_before),
    balanceAfter: Number(r.balance_after),
    status: (r.status || 'SUCCESS') as 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED',
    description: r.description,
    metadata: r.metadata,
    checksum: r.checksum,
    prevChecksum: r.prev_checksum,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }));

  const activeGrants: PromotionalGrant[] = grantsRes.rows.map((g) => ({
    id: g.id,
    brokerId: g.broker_id,
    initialAmount: Number(g.amount),
    remainingAmount: Number(g.remaining_amount),
    expiresAt: g.expires_at ? new Date(g.expires_at).toISOString() : new Date().toISOString(),
    reason: g.reason,
    grantedBy: 'system',
    status: 'active',
    createdAt: g.granted_at ? new Date(g.granted_at).toISOString() : new Date().toISOString(),
    updatedAt: g.granted_at ? new Date(g.granted_at).toISOString() : new Date().toISOString(),
  }));

  const nearestExpiry =
    activeGrants.length > 0
      ? { amount: activeGrants[0].remainingAmount, expiresAt: activeGrants[0].expiresAt }
      : null;

  return {
    wallet,
    ledger,
    activeGrants,
    transactions: ledger,
    grants: activeGrants,
    nearestExpiry,
  };
}

export async function getAdminPlatformWalletSummary(): Promise<{
  totalBrokersWithWallets: number;
  totalPlatformBalance: number;
  totalPaidInCirculation: number;
  totalFreeInCirculation: number;
  totalCirculation: number;
  totalPaidCirculation: number;
  totalFreeCirculation: number;
  totalRechargesVolume: number;
  walletsCount: number;
  activeGrantsCount: number;
  ledgerTransactionsCount: number;
  recentLedger: WalletTransaction[];
  allGrants: PromotionalGrant[];
}> {
  try {
    const walletsAgg = await query(
      `SELECT count(*) as count,
              coalesce(sum(paid_balance), 0) as paid_sum,
              coalesce(sum(free_balance), 0) as free_sum
       FROM public.broker_wallets`
    );

    const grantsAgg = await query(
      `SELECT count(*) as count FROM public.promotional_grants WHERE is_expired IS FALSE AND expires_at >= now()`
    );

    const ledgerCountRes = await query(`SELECT count(*) as count FROM public.wallet_ledger`);

    const recentLedgerRes = await query(
      `SELECT * FROM public.wallet_ledger ORDER BY created_at DESC LIMIT 50`
    );

    const allGrantsRes = await query(
      `SELECT * FROM public.promotional_grants ORDER BY granted_at DESC LIMIT 50`
    );

    const totalBrokersWithWallets = parseInt(walletsAgg.rows[0]?.count || '0', 10);
    const totalPaidInCirculation = Number(walletsAgg.rows[0]?.paid_sum) || 0;
    const totalFreeInCirculation = Number(walletsAgg.rows[0]?.free_sum) || 0;
    const totalPlatformBalance = totalPaidInCirculation + totalFreeInCirculation;
    const activeGrantsCount = parseInt(grantsAgg.rows[0]?.count || '0', 10);
    const ledgerTransactionsCount = parseInt(ledgerCountRes.rows[0]?.count || '0', 10);

    const recentLedger: WalletTransaction[] = recentLedgerRes.rows.map((r) => ({
      id: r.id,
      referenceId: r.id,
      brokerId: r.broker_id,
      walletId: '',
      type: r.type as TransactionType,
      amount: Number(r.amount),
      paidDelta: Number(r.paid_delta) || 0,
      freeDelta: Number(r.free_delta) || 0,
      balanceBefore: Number(r.balance_before),
      balanceAfter: Number(r.balance_after),
      status: r.status as 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED',
      description: r.description,
      metadata: r.metadata,
      checksum: r.checksum,
      prevChecksum: r.prev_checksum,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));

    const allGrants: PromotionalGrant[] = allGrantsRes.rows.map((g) => ({
      id: g.id,
      brokerId: g.broker_id,
      initialAmount: Number(g.amount),
      remainingAmount: Number(g.remaining_amount),
      expiresAt: g.expires_at ? new Date(g.expires_at).toISOString() : new Date().toISOString(),
      reason: g.reason,
      grantedBy: 'system',
      status: g.is_expired ? 'expired' : 'active',
      createdAt: g.granted_at ? new Date(g.granted_at).toISOString() : new Date().toISOString(),
      updatedAt: g.granted_at ? new Date(g.granted_at).toISOString() : new Date().toISOString(),
    }));

    return {
      totalBrokersWithWallets,
      totalPlatformBalance,
      totalPaidInCirculation,
      totalFreeInCirculation,
      totalCirculation: totalPlatformBalance,
      totalPaidCirculation: totalPaidInCirculation,
      totalFreeCirculation: totalFreeInCirculation,
      totalRechargesVolume: 0,
      walletsCount: totalBrokersWithWallets,
      activeGrantsCount,
      ledgerTransactionsCount,
      recentLedger,
      allGrants,
    };
  } catch {
    return {
      totalBrokersWithWallets: 0,
      totalPlatformBalance: 0,
      totalPaidInCirculation: 0,
      totalFreeInCirculation: 0,
      totalCirculation: 0,
      totalPaidCirculation: 0,
      totalFreeCirculation: 0,
      totalRechargesVolume: 0,
      walletsCount: 0,
      activeGrantsCount: 0,
      ledgerTransactionsCount: 0,
      recentLedger: [],
      allGrants: [],
    };
  }
}
