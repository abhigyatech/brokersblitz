import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { readJsonFile as readJsonFileStore, writeJsonFile as writeJsonFileStore } from '../db/json-store';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');
const GRANTS_FILE = path.join(DATA_DIR, 'wallet_grants.json');
const LEDGER_FILE = path.join(DATA_DIR, 'wallet_ledger.json');
const LEDGER_SECRET = process.env.SESSION_SECRET || 'BrokersBlitz_Ledger_Secret_2026';

const walletLocks = new Map<string, Promise<any>>();

export function withWalletLock<T>(brokerId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = walletLocks.get(brokerId) || Promise.resolve();
  const nextLock = currentLock
    .catch(() => {})
    .then(async () => {
      return await fn();
    });

  const cleanupPromise = nextLock
    .catch(() => {})
    .finally(() => {
      if (walletLocks.get(brokerId) === cleanupPromise) {
        walletLocks.delete(brokerId);
      }
    });

  walletLocks.set(brokerId, cleanupPromise);

  return nextLock;
}

function ensureWalletFiles() {}

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

function readJsonFile<T>(filePath: string): T {
  const baseName = path.basename(filePath);
  return readJsonFileStore<T>(baseName, [] as unknown as T);
}

function safeWriteJsonFile<T>(filePath: string, data: T): void {
  const baseName = path.basename(filePath);
  writeJsonFileStore(baseName, data);
}

export function verifyTransactionIntegrity(txn: WalletTransaction, prevTxn?: WalletTransaction): boolean {
  const expected = computeChecksum({
    id: txn.id,
    brokerId: txn.brokerId,
    amount: txn.amount,
    balanceAfter: txn.balanceAfter,
    createdAt: txn.createdAt,
    status: txn.status,
    prevChecksum: txn.prevChecksum || prevTxn?.checksum,
  });
  return expected === txn.checksum;
}

export function getOrCreateWallet(brokerId: string): BrokerWallet {
  ensureWalletFiles();
  const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
  let wallet = wallets.find((w) => w.brokerId === brokerId);

  if (!wallet) {
    const now = new Date().toISOString();
    wallet = {
      id: `wlt-${crypto.randomBytes(8).toString('hex')}`,
      brokerId,
      paidBalance: 0,
      freeBalance: 0,
      totalBalance: 0,
      currency: 'INR',
      status: 'active',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    wallets.push(wallet);
    safeWriteJsonFile(WALLETS_FILE, wallets);
  }

  return syncWalletBalances(brokerId);
}

export function syncAllActiveGrants(): void {
  ensureWalletFiles();
  const grants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
  const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
  const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);
  const nowMs = Date.now();
  let grantsModified = false;
  let walletsModified = false;
  let ledgerModified = false;

  for (const g of grants) {
    if (g.status === 'active') {
      const expMs = new Date(g.expiresAt).getTime();
      if (expMs <= nowMs && g.remainingAmount > 0) {
        const expiredAmount = g.remainingAmount;
        g.status = 'expired';
        g.remainingAmount = 0;
        g.updatedAt = new Date().toISOString();
        grantsModified = true;

        const wallet = wallets.find((w) => w.brokerId === g.brokerId);
        if (wallet) {
          const balanceBefore = wallet.paidBalance + wallet.freeBalance;
          wallet.freeBalance = Math.max(0, wallet.freeBalance - expiredAmount);
          wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
          wallet.updatedAt = new Date().toISOString();
          walletsModified = true;

          const txnId = `txn-${crypto.randomBytes(8).toString('hex')}`;
          const refId = generateReferenceId('EXPIRY');
          const nowIso = new Date().toISOString();
          const prevChecksum = ledger.length > 0 ? ledger[ledger.length - 1].checksum : undefined;

          ledger.push({
            id: txnId,
            referenceId: refId,
            brokerId: g.brokerId,
            walletId: wallet.id,
            type: 'EXPIRY',
            amount: -expiredAmount,
            paidDelta: 0,
            freeDelta: -expiredAmount,
            balanceBefore,
            balanceAfter: wallet.totalBalance,
            status: 'SUCCESS',
            description: `Promotional free credits expired (${expiredAmount} credits)`,
            metadata: { grantId: g.id, expiredAmount },
            prevChecksum,
            checksum: computeChecksum({
              id: txnId,
              brokerId: g.brokerId,
              amount: -expiredAmount,
              balanceAfter: wallet.totalBalance,
              createdAt: nowIso,
              status: 'SUCCESS',
              prevChecksum,
            }),
            createdAt: nowIso,
          });
          ledgerModified = true;
        }
      }
    }
  }

  if (grantsModified) safeWriteJsonFile(GRANTS_FILE, grants);
  if (walletsModified) safeWriteJsonFile(WALLETS_FILE, wallets);
  if (ledgerModified) safeWriteJsonFile(LEDGER_FILE, ledger);
}

export function syncWalletBalances(brokerId: string): BrokerWallet {
  ensureWalletFiles();
  const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
  const grants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
  const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);

  let wallet = wallets.find((w) => w.brokerId === brokerId);
  if (!wallet) {
    const now = new Date().toISOString();
    wallet = {
      id: `wlt-${crypto.randomBytes(8).toString('hex')}`,
      brokerId,
      paidBalance: 0,
      freeBalance: 0,
      totalBalance: 0,
      currency: 'INR',
      status: 'active',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    wallets.push(wallet);
  }

  const nowMs = Date.now();
  let totalFree = 0;
  let expiredAmount = 0;
  const grantsModified: PromotionalGrant[] = [];

  for (const g of grants) {
    if (g.brokerId !== brokerId) continue;

    if (g.status === 'active') {
      const expMs = new Date(g.expiresAt).getTime();
      if (expMs <= nowMs && g.remainingAmount > 0) {
        expiredAmount += g.remainingAmount;
        g.status = 'expired';
        g.remainingAmount = 0;
        g.updatedAt = new Date().toISOString();
        grantsModified.push(g);
      } else if (g.remainingAmount > 0) {
        totalFree += g.remainingAmount;
      }
    }
  }

  if (expiredAmount > 0) {
    const balanceBefore = wallet.paidBalance + wallet.freeBalance;
    const balanceAfter = wallet.paidBalance + totalFree;
    const nowIso = new Date().toISOString();
    const txnId = `txn-${crypto.randomBytes(8).toString('hex')}`;
    const refId = generateReferenceId('EXPIRY');
    const prevChecksum = ledger.length > 0 ? ledger[ledger.length - 1].checksum : undefined;

    const expiryTxn: WalletTransaction = {
      id: txnId,
      referenceId: refId,
      brokerId,
      walletId: wallet.id,
      type: 'EXPIRY',
      amount: -expiredAmount,
      paidDelta: 0,
      freeDelta: -expiredAmount,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: `Promotional free credits expired (${expiredAmount} credits)`,
      metadata: { expiredAmount },
      prevChecksum,
      checksum: computeChecksum({
        id: txnId,
        brokerId,
        amount: -expiredAmount,
        balanceAfter,
        createdAt: nowIso,
        status: 'SUCCESS',
        prevChecksum,
      }),
      createdAt: nowIso,
    };

    ledger.push(expiryTxn);
    safeWriteJsonFile(LEDGER_FILE, ledger);
  }

  if (grantsModified.length > 0) {
    safeWriteJsonFile(GRANTS_FILE, grants);
  }

  wallet.paidBalance = Math.max(0, wallet.paidBalance);
  wallet.freeBalance = Math.max(0, totalFree);
  wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
  wallet.updatedAt = new Date().toISOString();
  safeWriteJsonFile(WALLETS_FILE, wallets);

  return wallet;
}

export async function creditPaidBalance(
  brokerId: string,
  amount: number,
  metadata: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    packId?: string;
    bonusCredits?: number;
    bonusExpiryDays?: number;
    invoiceAmount?: number;
  }
): Promise<{ wallet: BrokerWallet; transaction: WalletTransaction }> {
  return withWalletLock(brokerId, async () => {
    ensureWalletFiles();
    const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);

    const existingTxn = ledger.find(
      (t) => t.metadata?.razorpayPaymentId && t.metadata.razorpayPaymentId === metadata.razorpayPaymentId
    );
    if (existingTxn) {
      const wallet = getOrCreateWallet(brokerId);
      return { wallet, transaction: existingTxn };
    }

    const wallet = syncWalletBalances(brokerId);
    const balanceBefore = wallet.totalBalance;
    const paidDelta = Math.max(0, Math.round(amount));
    let freeDelta = 0;

    if (metadata.bonusCredits && metadata.bonusCredits > 0) {
      freeDelta = Math.round(metadata.bonusCredits);
      const grants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
      const days = metadata.bonusExpiryDays || 30;
      const expDate = new Date(Date.now() + days * 86400000).toISOString();
      const nowIso = new Date().toISOString();

      grants.push({
        id: `grt-${crypto.randomBytes(8).toString('hex')}`,
        brokerId,
        initialAmount: freeDelta,
        remainingAmount: freeDelta,
        expiresAt: expDate,
        reason: `Recharge Bonus (${metadata.packId || 'Standard Pack'})`,
        grantedBy: 'system',
        grantedByName: 'Razorpay Recharge Engine',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      safeWriteJsonFile(GRANTS_FILE, grants);
    }

    wallet.paidBalance += paidDelta;
    wallet.freeBalance += freeDelta;
    wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
    wallet.version += 1;
    const nowIso = new Date().toISOString();
    wallet.updatedAt = nowIso;

    const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
    const wIdx = wallets.findIndex((w) => w.brokerId === brokerId);
    if (wIdx >= 0) wallets[wIdx] = wallet;
    else wallets.push(wallet);
    safeWriteJsonFile(WALLETS_FILE, wallets);

    const txnId = `txn-${crypto.randomBytes(8).toString('hex')}`;
    const refId = generateReferenceId('RECHARGE');
    const totalCredited = paidDelta + freeDelta;
    const balanceAfter = wallet.totalBalance;
    const prevChecksum = ledger.length > 0 ? ledger[ledger.length - 1].checksum : undefined;

    const transaction: WalletTransaction = {
      id: txnId,
      referenceId: refId,
      brokerId,
      walletId: wallet.id,
      type: 'RECHARGE',
      amount: totalCredited,
      paidDelta,
      freeDelta,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: `Wallet recharge via Razorpay (+${paidDelta} Paid${freeDelta > 0 ? `, +${freeDelta} Bonus` : ''})`,
      metadata: {
        ...metadata,
        currency: 'INR',
      },
      prevChecksum,
      checksum: computeChecksum({
        id: txnId,
        brokerId,
        amount: totalCredited,
        balanceAfter,
        createdAt: nowIso,
        status: 'SUCCESS',
        prevChecksum,
      }),
      createdAt: nowIso,
    };

    ledger.push(transaction);
    safeWriteJsonFile(LEDGER_FILE, ledger);

    return { wallet, transaction };
  });
}

export async function grantFreeCredits(
  brokerId: string,
  amount: number,
  expiryDays: number,
  reason: string,
  adminId: string,
  adminName: string
): Promise<{ wallet: BrokerWallet; transaction: WalletTransaction; grant: PromotionalGrant }> {
  if (amount <= 0) {
    throw new Error('Grant amount must be greater than zero');
  }
  if (expiryDays <= 0) {
    throw new Error('Expiry days must be at least 1 day');
  }

  return withWalletLock(brokerId, async () => {
    ensureWalletFiles();
    const wallet = syncWalletBalances(brokerId);
    const balanceBefore = wallet.totalBalance;
    const now = new Date();
    const nowIso = now.toISOString();
    const expDate = new Date(now.getTime() + expiryDays * 86400000).toISOString();

    const grantId = `grt-${crypto.randomBytes(8).toString('hex')}`;
    const grant: PromotionalGrant = {
      id: grantId,
      brokerId,
      initialAmount: amount,
      remainingAmount: amount,
      expiresAt: expDate,
      reason: reason.trim() || 'Admin Goodwill Grant',
      grantedBy: adminId,
      grantedByName: adminName,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const grants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
    grants.push(grant);
    safeWriteJsonFile(GRANTS_FILE, grants);

    wallet.freeBalance += amount;
    wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
    wallet.version += 1;
    wallet.updatedAt = nowIso;

    const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
    const wIdx = wallets.findIndex((w) => w.brokerId === brokerId);
    if (wIdx >= 0) wallets[wIdx] = wallet;
    else wallets.push(wallet);
    safeWriteJsonFile(WALLETS_FILE, wallets);

    const txnId = `txn-${crypto.randomBytes(8).toString('hex')}`;
    const refId = generateReferenceId('FREE_CREDIT_GRANT');
    const balanceAfter = wallet.totalBalance;
    const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);
    const prevChecksum = ledger.length > 0 ? ledger[ledger.length - 1].checksum : undefined;

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
      description: reason ? `${reason} (+${amount} Credits, valid ${expiryDays} days)` : `Promotional free credits granted by Admin (${amount} Credits, valid ${expiryDays} days)`,
      metadata: {
        grantId,
        expiryDays,
        expiresAt: expDate,
        reason: grant.reason,
        adminId,
        adminName,
      },
      prevChecksum,
      checksum: computeChecksum({
        id: txnId,
        brokerId,
        amount,
        balanceAfter,
        createdAt: nowIso,
        status: 'SUCCESS',
        prevChecksum,
      }),
      createdAt: nowIso,
    };

    ledger.push(transaction);
    safeWriteJsonFile(LEDGER_FILE, ledger);

    return { wallet, transaction, grant };
  });
}

export async function deductCredits(
  brokerId: string,
  amount: number,
  type: TransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ wallet: BrokerWallet; transaction: WalletTransaction }> {
  if (amount <= 0) {
    throw new Error('Deduction amount must be greater than zero');
  }

  return withWalletLock(brokerId, async () => {
    ensureWalletFiles();
    const wallet = syncWalletBalances(brokerId);

    if (wallet.status !== 'active') {
      throw new Error(`Wallet is ${wallet.status}. Please contact administration.`);
    }

    if (wallet.totalBalance < amount) {
      throw new Error(`Insufficient wallet credits. Required: ${amount}, Available: ${wallet.totalBalance}`);
    }

    const balanceBefore = wallet.totalBalance;
    let needed = amount;
    let freeDeducted = 0;
    let paidDeducted = 0;

    const grants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
    const activeGrants = grants
      .filter((g) => g.brokerId === brokerId && g.status === 'active' && g.remainingAmount > 0)
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

    for (const g of activeGrants) {
      if (needed <= 0) break;
      const canTake = Math.min(g.remainingAmount, needed);
      g.remainingAmount -= canTake;
      needed -= canTake;
      freeDeducted += canTake;
      if (g.remainingAmount === 0) {
        g.status = 'exhausted';
      }
      g.updatedAt = new Date().toISOString();
    }

    if (needed > 0) {
      paidDeducted = needed;
      needed = 0;
    }

    safeWriteJsonFile(GRANTS_FILE, grants);

    wallet.paidBalance = Math.max(0, wallet.paidBalance - paidDeducted);
    wallet.freeBalance = Math.max(0, wallet.freeBalance - freeDeducted);
    wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
    wallet.version += 1;
    const nowIso = new Date().toISOString();
    wallet.updatedAt = nowIso;

    const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
    const wIdx = wallets.findIndex((w) => w.brokerId === brokerId);
    if (wIdx >= 0) wallets[wIdx] = wallet;
    else wallets.push(wallet);
    safeWriteJsonFile(WALLETS_FILE, wallets);

    const txnId = `txn-${crypto.randomBytes(8).toString('hex')}`;
    const refId = generateReferenceId(type);
    const balanceAfter = wallet.totalBalance;
    const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);
    const prevChecksum = ledger.length > 0 ? ledger[ledger.length - 1].checksum : undefined;

    const transaction: WalletTransaction = {
      id: txnId,
      referenceId: refId,
      brokerId,
      walletId: wallet.id,
      type,
      amount: -amount,
      paidDelta: -paidDeducted,
      freeDelta: -freeDeducted,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description,
      metadata: {
        ...metadata,
        paidDeducted,
        freeDeducted,
      },
      prevChecksum,
      checksum: computeChecksum({
        id: txnId,
        brokerId,
        amount: -amount,
        balanceAfter,
        createdAt: nowIso,
        status: 'SUCCESS',
        prevChecksum,
      }),
      createdAt: nowIso,
    };

    ledger.push(transaction);
    safeWriteJsonFile(LEDGER_FILE, ledger);

    return { wallet, transaction };
  });
}

export function getWalletStatement(
  brokerId: string,
  filters?: {
    type?: string;
    search?: string;
    limit?: number;
  }
): {
  wallet: BrokerWallet;
  grants: PromotionalGrant[];
  transactions: WalletTransaction[];
  nearestExpiry: { amount: number; expiresAt: string; daysLeft: number } | null;
} {
  const wallet = syncWalletBalances(brokerId);
  const allGrants = readJsonFile<PromotionalGrant[]>(GRANTS_FILE);
  const allLedger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);

  const brokerGrants = allGrants
    .filter((g) => g.brokerId === brokerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let txns = allLedger
    .filter((t) => t.brokerId === brokerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filters?.type && filters.type !== 'all') {
    const fType = filters.type.toUpperCase();
    if (fType === 'RECHARGE' || fType === 'RECHARGES') {
      txns = txns.filter((t) => t.type === 'RECHARGE');
    } else if (fType === 'GRANT' || fType === 'GRANTS') {
      txns = txns.filter((t) => t.type === 'FREE_CREDIT_GRANT');
    } else if (fType === 'DEBIT' || fType === 'DEBITS') {
      txns = txns.filter((t) => t.amount < 0 && t.type !== 'EXPIRY');
    } else if (fType === 'EXPIRY' || fType === 'EXPIRIES') {
      txns = txns.filter((t) => t.type === 'EXPIRY');
    }
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    txns = txns.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.referenceId.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
  }

  if (filters?.limit && filters.limit > 0) {
    txns = txns.slice(0, filters.limit);
  }

  const activeGrants = brokerGrants
    .filter((g) => g.status === 'active' && g.remainingAmount > 0)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

  let nearestExpiry: { amount: number; expiresAt: string; daysLeft: number } | null = null;
  if (activeGrants.length > 0) {
    const first = activeGrants[0];
    const diffMs = new Date(first.expiresAt).getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));
    nearestExpiry = {
      amount: first.remainingAmount,
      expiresAt: first.expiresAt,
      daysLeft,
    };
  }

  return {
    wallet,
    grants: brokerGrants,
    transactions: txns,
    nearestExpiry,
  };
}

export function getAdminPlatformWalletSummary(): {
  totalPaidCirculation: number;
  totalFreeCirculation: number;
  totalCirculation: number;
  totalRechargesVolume: number;
  totalTransactionsCount: number;
  walletsCount: number;
  recentLedger: WalletTransaction[];
} {
  syncAllActiveGrants();
  ensureWalletFiles();
  const wallets = readJsonFile<BrokerWallet[]>(WALLETS_FILE);
  const ledger = readJsonFile<WalletTransaction[]>(LEDGER_FILE);

  let totalPaid = 0;
  let totalFree = 0;
  let rechargesVolume = 0;

  for (const w of wallets) {
    totalPaid += Math.max(0, w.paidBalance);
    totalFree += Math.max(0, w.freeBalance);
  }

  for (const t of ledger) {
    if (t.type === 'RECHARGE' && t.status === 'SUCCESS') {
      rechargesVolume += t.paidDelta || t.amount;
    }
  }

  const recentLedger = [...ledger]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);

  return {
    totalPaidCirculation: totalPaid,
    totalFreeCirculation: totalFree,
    totalCirculation: totalPaid + totalFree,
    totalRechargesVolume: rechargesVolume,
    totalTransactionsCount: ledger.length,
    walletsCount: wallets.length,
    recentLedger,
  };
}
