import crypto from 'crypto';
import { query } from '../db/postgres';
import { findUserById, StoredUser } from '../auth/user-store';
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

const DEFAULT_CONFIG: ReferralConfig = {
  referrerRewardCredits: 50,
  refereeRewardCredits: 50,
  expiryDays: 30,
  isEnabled: true,
  updatedAt: '2026-11-04T12:00:00.000Z',
  updatedBy: 'admin@brokersblitz.in',
};

export async function getReferralConfig(): Promise<ReferralConfig> {
  try {
    const res = await query(
      `SELECT value FROM public.platform_settings WHERE key = 'referral_config' LIMIT 1`
    );
    if (res.rows.length === 0) return DEFAULT_CONFIG;
    const cfg = res.rows[0].value;
    return {
      referrerRewardCredits: Number(cfg.referrerRewardCredits) || DEFAULT_CONFIG.referrerRewardCredits,
      refereeRewardCredits: Number(cfg.refereeRewardCredits) || DEFAULT_CONFIG.refereeRewardCredits,
      expiryDays: Number(cfg.expiryDays) || DEFAULT_CONFIG.expiryDays,
      isEnabled: typeof cfg.isEnabled === 'boolean' ? cfg.isEnabled : DEFAULT_CONFIG.isEnabled,
      updatedAt: cfg.updatedAt || DEFAULT_CONFIG.updatedAt,
      updatedBy: cfg.updatedBy || DEFAULT_CONFIG.updatedBy,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function updateReferralConfig(
  params: {
    referrerRewardCredits?: number;
    refereeRewardCredits?: number;
    expiryDays?: number;
    isEnabled?: boolean;
  },
  adminEmail: string
): Promise<ReferralConfig> {
  const current = await getReferralConfig();
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

  try {
    await query(
      `INSERT INTO public.platform_settings (key, value, updated_at)
       VALUES ('referral_config', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(updated)]
    );
  } catch {}

  return updated;
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

export async function findReferrerByCode(rawCode: string): Promise<StoredUser | null> {
  if (!rawCode) return null;
  const target = normalizeReferralCode(rawCode);

  try {
    const res = await query(
      `SELECT * FROM public.profiles
       WHERE (is_locked IS FALSE OR is_locked IS NULL)
         AND (
           upper(coalesce(referral_code, '')) = $1
           OR upper(coalesce(store_code, '')) = $1
           OR upper(regexp_replace(coalesce(store_code, ''), '[^a-zA-Z0-9]', '', 'g')) = $1
         )
       LIMIT 1`,
      [target]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: String(row.id),
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      passwordHash: row.password_hash || '',
      passwordSalt: row.password_salt || '',
      agencyName: row.agency_name,
      storeCode: row.store_code,
      referralCode: row.referral_code,
      referredBy: row.referred_by,
      reraNumber: row.rera_number,
      operatingCity: row.city_of_operation,
      experienceYears: Number(row.experience_years) || 1,
      avatar: row.avatar_url,
      isLocked: Boolean(row.is_locked),
      dpdpConsent: Boolean(row.dpdp_consent),
      dpdpConsentDate: row.dpdp_consent_date ? new Date(row.dpdp_consent_date).toISOString() : new Date().toISOString(),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function validateReferralCode(
  rawCode: string,
  currentUserId?: string
): Promise<{ valid: boolean; error?: string; referrer?: StoredUser }> {
  const code = normalizeReferralCode(rawCode);
  if (!code) {
    return { valid: false, error: 'Referral code cannot be empty.' };
  }

  const referrer = await findReferrerByCode(code);
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

export async function getAllReferrals(): Promise<ReferralRecord[]> {
  try {
    const res = await query(
      `SELECT r.*,
              pref.full_name as ref_name, pref.email as ref_email, pref.phone as ref_phone, pref.role as ref_role,
              pror.full_name as ror_name
       FROM public.referrals r
       LEFT JOIN public.profiles pref ON r.referee_id = pref.id::text
       LEFT JOIN public.profiles pror ON r.referrer_id = pror.id::text
       ORDER BY r.created_at DESC`
    );

    return res.rows.map((row) => ({
      id: row.id,
      referrerId: row.referrer_id,
      referrerName: row.ror_name || 'Partner',
      referrerCode: row.code,
      refereeId: row.referee_id,
      refereeName: row.ref_name || 'Invited User',
      refereeEmail: row.ref_email || '',
      refereePhone: row.ref_phone || '',
      refereeRole: row.ref_role || 'buyer',
      referrerCredits: Number(row.reward_credits) || 50,
      refereeCredits: Number(row.reward_credits) || 50,
      expiryDays: 30,
      status: (row.status || 'COMPLETED') as 'COMPLETED' | 'PENDING' | 'REJECTED',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
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
  const config = await getReferralConfig();
  if (!config.isEnabled) {
    return { success: false, error: 'Referral program is currently paused.' };
  }

  const referee = await findUserById(refereeId);
  if (!referee) {
    return { success: false, error: 'Referred user not found.' };
  }

  const validation = await validateReferralCode(rawReferralCode, refereeId);
  if (!validation.valid || !validation.referrer) {
    return { success: false, error: validation.error || 'Invalid referral code.' };
  }

  const referrer = validation.referrer;

  const existingRes = await query(
    `SELECT id FROM public.referrals WHERE referee_id = $1 AND status = 'COMPLETED' LIMIT 1`,
    [refereeId]
  );
  if (existingRes.rows.length > 0) {
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

  const recId = `ref-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const codeToSave = referrer.referralCode || referrer.storeCode || rawReferralCode.toUpperCase();

  await query(
    `INSERT INTO public.referrals (
      id, code, referrer_id, referee_id, status, reward_credits,
      reward_granted_at, expires_at, created_at
    ) VALUES (
      $1, $2, $3, $4, 'COMPLETED', $5,
      now(), now() + interval '${expiryDays} days', now()
    )`,
    [recId, codeToSave, referrer.id, referee.id, referrerCredits]
  );

  await query(`UPDATE public.profiles SET referred_by = $1 WHERE id::text = $2`, [referrer.id, refereeId]);

  const record: ReferralRecord = {
    id: recId,
    referrerId: referrer.id,
    referrerName: referrer.fullName,
    referrerCode: codeToSave,
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

  return {
    success: true,
    record,
    referrerCredits,
    refereeCredits,
    expiryDays,
  };
}

export async function getUserReferralInfo(userId: string): Promise<{
  referralCode: string;
  shareUrl: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  pendingCredits: number;
  history: ReferralRecord[];
}> {
  const user = await findUserById(userId);
  const code = user?.referralCode || user?.storeCode || (user ? user.fullName.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() + 'REF' : 'REF');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brokersblitz.in';
  const shareUrl = `${baseUrl}/signup?ref=${code}`;

  try {
    const all = await getAllReferrals();
    const myReferrals = all.filter((r) => r.referrerId === userId);
    const totalCreditsEarned = myReferrals
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.referrerCredits, 0);

    return {
      referralCode: code,
      shareUrl,
      totalReferrals: myReferrals.length,
      totalCreditsEarned,
      pendingCredits: 0,
      history: myReferrals,
    };
  } catch {
    return {
      referralCode: code,
      shareUrl,
      totalReferrals: 0,
      totalCreditsEarned: 0,
      pendingCredits: 0,
      history: [],
    };
  }
}

export async function getAdminReferralOverview(): Promise<{
  config: ReferralConfig;
  referrals: ReferralRecord[];
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    totalCreditsDistributed: number;
  };
}> {
  const [config, referrals] = await Promise.all([
    getReferralConfig(),
    getAllReferrals(),
  ]);
  const totalCompleted = referrals.filter((r) => r.status === 'COMPLETED').length;
  const totalCreditsDistributed = referrals
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.referrerCredits + r.refereeCredits, 0);

  return {
    config,
    referrals,
    stats: {
      totalReferrals: referrals.length,
      completedReferrals: totalCompleted,
      totalCreditsDistributed,
    },
  };
}
