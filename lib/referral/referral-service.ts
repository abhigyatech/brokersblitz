import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAllUsers, saveUsers, findUserById, StoredUser } from '../auth/user-store';
import { grantFreeCredits } from '../wallet/wallet-service';

export interface ReferralConfig {
  referrerRewardCredits: number;
  refereeRewardCredits: number;
  expiryDays: number;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerCode: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  refereeRole: string;
  referrerCredits: number;
  refereeCredits: number;
  expiryDays: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'referral_config.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

const DEFAULT_CONFIG: ReferralConfig = {
  referrerRewardCredits: 50,
  refereeRewardCredits: 50,
  expiryDays: 30,
  isEnabled: true,
  updatedAt: '2026-11-04T12:00:00.000Z',
  updatedBy: 'admin@brokersblitz.in',
};

function ensureReferralFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }

  if (!fs.existsSync(REFERRALS_FILE)) {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(filePath: string, data: T): void {
  const tmpFile = `${filePath}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, filePath);
}

export function getReferralConfig(): ReferralConfig {
  ensureReferralFiles();
  return safeReadJson<ReferralConfig>(CONFIG_FILE, DEFAULT_CONFIG);
}

export function updateReferralConfig(
  params: {
    referrerRewardCredits?: number;
    refereeRewardCredits?: number;
    expiryDays?: number;
    isEnabled?: boolean;
  },
  adminEmail: string
): ReferralConfig {
  ensureReferralFiles();
  const current = getReferralConfig();

  const updated: ReferralConfig = {
    referrerRewardCredits:
      typeof params.referrerRewardCredits === 'number' && params.referrerRewardCredits >= 0
        ? Math.round(params.referrerRewardCredits)
        : current.referrerRewardCredits,
    refereeRewardCredits:
      typeof params.refereeRewardCredits === 'number' && params.refereeRewardCredits >= 0
        ? Math.round(params.refereeRewardCredits)
        : current.refereeRewardCredits,
    expiryDays:
      typeof params.expiryDays === 'number' && params.expiryDays >= 1
        ? Math.round(params.expiryDays)
        : current.expiryDays,
    isEnabled: typeof params.isEnabled === 'boolean' ? params.isEnabled : current.isEnabled,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || current.updatedBy,
  };

  safeWriteJson(CONFIG_FILE, updated);
  return updated;
}

export function getAllReferrals(): ReferralRecord[] {
  ensureReferralFiles();
  return safeReadJson<ReferralRecord[]>(REFERRALS_FILE, []);
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

export function findReferrerByCode(rawCode: string): StoredUser | null {
  if (!rawCode) return null;
  const target = normalizeReferralCode(rawCode);
  const users = getAllUsers();

  for (const u of users) {
    if (u.isLocked) continue;

    if (u.referralCode && normalizeReferralCode(u.referralCode) === target) {
      return u;
    }

    if (u.storeCode && normalizeReferralCode(u.storeCode) === target) {
      return u;
    }

    const strippedStore = u.storeCode ? u.storeCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
    const strippedTarget = target.replace(/[^A-Z0-9]/g, '');
    if (strippedStore && strippedStore === strippedTarget) {
      return u;
    }
  }

  return null;
}

export function validateReferralCode(
  rawCode: string,
  currentUserId?: string
): { valid: boolean; error?: string; referrer?: StoredUser } {
  const code = normalizeReferralCode(rawCode);
  if (!code) {
    return { valid: false, error: 'Referral code cannot be empty.' };
  }

  const referrer = findReferrerByCode(code);
  if (!referrer) {
    return { valid: false, error: 'Invalid referral code. No active partner found with this code.' };
  }

  if (referrer.isLocked) {
    return { valid: false, error: 'This partner account is currently suspended.' };
  }

  if (currentUserId && referrer.id === currentUserId) {
    return { valid: false, error: 'You cannot use your own referral code.' };
  }

  return { valid: true, referrer };
}

export async function processReferralReward(
  refereeId: string,
  rawReferralCode: string
): Promise<{
  success: boolean;
  error?: string;
  record?: ReferralRecord;
  referrerCredits?: number;
  refereeCredits?: number;
  expiryDays?: number;
}> {
  ensureReferralFiles();
  const config = getReferralConfig();

  if (!config.isEnabled) {
    return { success: false, error: 'Referral program is currently paused.' };
  }

  const referee = findUserById(refereeId);
  if (!referee) {
    return { success: false, error: 'Referred user not found.' };
  }

  const validation = validateReferralCode(rawReferralCode, refereeId);
  if (!validation.valid || !validation.referrer) {
    return { success: false, error: validation.error || 'Invalid referral code.' };
  }

  const referrer = validation.referrer;
  const referrals = getAllReferrals();

  const alreadyProcessed = referrals.some(
    (r) => r.refereeId === refereeId && r.status === 'COMPLETED'
  );
  if (alreadyProcessed) {
    return { success: false, error: 'Referral bonus already awarded for this account.' };
  }

  const referrerCredits = config.referrerRewardCredits;
  const refereeCredits = config.refereeRewardCredits;
  const expiryDays = config.expiryDays;

  if (referrerCredits > 0) {
    await grantFreeCredits(
      referrer.id,
      referrerCredits,
      expiryDays,
      `Referral Bonus: Referred ${referee.fullName}`,
      'system-referral',
      'BrokersBlitz Referral Engine'
    );
  }

  if (refereeCredits > 0) {
    await grantFreeCredits(
      referee.id,
      refereeCredits,
      expiryDays,
      `Welcome Referral Bonus: Invited by ${referrer.fullName}`,
      'system-referral',
      'BrokersBlitz Referral Engine'
    );
  }

  const record: ReferralRecord = {
    id: `ref-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    referrerId: referrer.id,
    referrerName: referrer.fullName,
    referrerCode: referrer.referralCode || referrer.storeCode || rawReferralCode.toUpperCase(),
    refereeId: referee.id,
    refereeName: referee.fullName,
    refereeEmail: referee.email,
    refereePhone: referee.phone,
    refereeRole: referee.role,
    referrerCredits,
    refereeCredits,
    expiryDays,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  };

  referrals.unshift(record);
  safeWriteJson(REFERRALS_FILE, referrals);

  const users = getAllUsers();
  const uIdx = users.findIndex((u) => u.id === refereeId);
  if (uIdx >= 0) {
    users[uIdx].referredBy = referrer.id;
    saveUsers(users);
  }

  return {
    success: true,
    record,
    referrerCredits,
    refereeCredits,
    expiryDays,
  };
}

export function getUserReferralInfo(userId: string): {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  config: ReferralConfig;
  referrals: ReferralRecord[];
} {
  ensureReferralFiles();
  const config = getReferralConfig();
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);

  let referralCode = user?.referralCode || '';
  if (!referralCode && user) {
    if (user.storeCode) {
      referralCode = user.storeCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else {
      const namePart = user.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'REF';
      const phonePart = user.phone ? user.phone.slice(-4) : user.id.slice(-4).toUpperCase();
      referralCode = `${namePart}${phonePart}`;
    }
  }

  const allReferrals = getAllReferrals();
  const userReferrals = allReferrals.filter(
    (r) => r.referrerId === userId && r.status === 'COMPLETED'
  );

  const totalCreditsEarned = userReferrals.reduce((sum, r) => sum + (r.referrerCredits || 0), 0);
  const referralLink = `https://brokersblitz.in/signup?ref=${encodeURIComponent(referralCode)}`;

  return {
    referralCode,
    referralLink,
    totalReferrals: userReferrals.length,
    totalCreditsEarned,
    config,
    referrals: userReferrals,
  };
}

export function getAdminReferralOverview(): {
  config: ReferralConfig;
  totalReferralsCount: number;
  totalCreditsDistributed: number;
  referrals: ReferralRecord[];
} {
  ensureReferralFiles();
  const config = getReferralConfig();
  const referrals = getAllReferrals();

  let totalCreditsDistributed = 0;
  for (const r of referrals) {
    if (r.status === 'COMPLETED') {
      totalCreditsDistributed += (r.referrerCredits || 0) + (r.refereeCredits || 0);
    }
  }

  return {
    config,
    totalReferralsCount: referrals.length,
    totalCreditsDistributed,
    referrals,
  };
}

