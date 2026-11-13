import crypto from 'crypto';
import { hashPassword } from './crypto';
import { query } from '../db/postgres';

export type UserRole = 'buyer' | 'broker' | 'admin';

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
  agencyName?: string;
  storeCode?: string;
  referralCode?: string;
  referredBy?: string;
  reraNumber?: string;
  operatingCity?: string;
  experienceYears?: number;
  avatar?: string;
  isLocked?: boolean;
  dpdpConsent: boolean;
  dpdpConsentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSession {
  token: string;
  userId: string;
  expiresAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'brokersblitz_secret_session_key_2026';

function mapProfileToUser(row: any): StoredUser {
  return {
    id: String(row.id),
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    role: (row.role || 'buyer') as UserRole,
    passwordHash: row.password_hash || '',
    passwordSalt: row.password_salt || '',
    agencyName: row.agency_name || undefined,
    storeCode: row.store_code || undefined,
    referralCode: row.referral_code || undefined,
    referredBy: row.referred_by || undefined,
    reraNumber: row.rera_number || undefined,
    operatingCity: row.city_of_operation || undefined,
    experienceYears: row.experience_years ? Number(row.experience_years) : undefined,
    avatar: row.avatar_url || undefined,
    isLocked: Boolean(row.is_locked),
    dpdpConsent: Boolean(row.dpdp_consent),
    dpdpConsentDate: row.dpdp_consent_date ? new Date(row.dpdp_consent_date).toISOString() : new Date().toISOString(),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function generateUserReferralCode(user: { fullName: string; storeCode?: string; phone?: string; id?: string }): string {
  if (user.storeCode) {
    return user.storeCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
  const namePart = user.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'REF';
  const cleanId = (user.id || '0000').replace(/[^a-zA-Z0-9]/g, '');
  const phonePart = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-4) : cleanId.slice(-4).toUpperCase();
  return `${namePart}${phonePart.padEnd(4, '0')}`;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  try {
    const res = await query('SELECT * FROM public.profiles ORDER BY created_at DESC');
    return res.rows.map(mapProfileToUser);
  } catch {
    return [];
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  if (!email) return null;
  try {
    const res = await query('SELECT * FROM public.profiles WHERE lower(email) = lower($1) LIMIT 1', [email.trim()]);
    if (res.rows.length === 0) return null;
    return mapProfileToUser(res.rows[0]);
  } catch {
    return null;
  }
}

export async function findUserByPhone(phone: string): Promise<StoredUser | null> {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, '').slice(-10);
  try {
    const res = await query('SELECT * FROM public.profiles WHERE right(regexp_replace(phone, \'[^0-9]\', \'\', \'g\'), 10) = $1 LIMIT 1', [cleaned]);
    if (res.rows.length === 0) return null;
    return mapProfileToUser(res.rows[0]);
  } catch {
    return null;
  }
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (!id) return null;
  try {
    const res = await query('SELECT * FROM public.profiles WHERE id::text = $1 LIMIT 1', [id.trim()]);
    if (res.rows.length === 0) return null;
    return mapProfileToUser(res.rows[0]);
  } catch {
    return null;
  }
}

export async function createNewUser(params: {
  fullName: string;
  email: string;
  phone: string;
  role: 'buyer' | 'broker';
  password: string;
  agencyName?: string;
  storeCode?: string;
  referralCode?: string;
  referredBy?: string;
  reraNumber?: string;
  operatingCity?: string;
  experienceYears?: number;
  dpdpConsent: boolean;
}): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedPhone = params.phone.replace(/[^0-9]/g, '').slice(-10);

  if (normalizedPhone.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  if (!params.dpdpConsent) {
    return {
      success: false,
      error: 'Compulsory consent to Terms of Service, Fraud Prevention and DPDP Act is required to proceed.',
    };
  }

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    return { success: false, error: 'This email address is already registered. Please log in instead.' };
  }

  const existingPhone = await findUserByPhone(normalizedPhone);
  if (existingPhone) {
    return { success: false, error: 'This mobile number is already registered. Please log in instead.' };
  }

  const { hash, salt } = hashPassword(params.password);
  const referralCode =
    params.referralCode?.trim() ||
    generateUserReferralCode({
      fullName: params.fullName,
      storeCode: params.storeCode,
      phone: normalizedPhone,
    });

  try {
    const res = await query(
      `INSERT INTO public.profiles (
        email, phone, full_name, role, password_hash, password_salt,
        agency_name, store_code, referral_code, referred_by,
        rera_number, city_of_operation, experience_years,
        dpdp_consent, dpdp_consent_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, now(), now(), now()
      ) RETURNING *`,
      [
        normalizedEmail,
        normalizedPhone,
        params.fullName.trim(),
        params.role,
        hash,
        salt,
        params.agencyName?.trim() || null,
        params.storeCode?.trim() || null,
        referralCode,
        params.referredBy?.trim() || null,
        params.reraNumber?.trim() || null,
        params.operatingCity?.trim() || null,
        params.experienceYears || 1,
        params.dpdpConsent,
      ]
    );

    const created = mapProfileToUser(res.rows[0]);
    return { success: true, user: created };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error creating user.' };
  }
}

export async function createAdminUser(
  adminEmail: string,
  params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }
): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
  const requestingAdmin = await findUserByEmail(adminEmail);
  if (!requestingAdmin || requestingAdmin.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Only existing administrators can create admin accounts.' };
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail.endsWith('@brokersblitz.in')) {
    return {
      success: false,
      error: 'Security Policy Violation: Administrator email must belong to the @brokersblitz.in corporate domain.',
    };
  }

  const normalizedPhone = params.phone.replace(/[^0-9]/g, '').slice(-10);

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    return { success: false, error: 'This admin email is already registered.' };
  }

  const existingPhone = await findUserByPhone(normalizedPhone);
  if (existingPhone) {
    return { success: false, error: 'This mobile number is already in use.' };
  }

  const { hash, salt } = hashPassword(params.password);

  try {
    const res = await query(
      `INSERT INTO public.profiles (
        email, phone, full_name, role, password_hash, password_salt,
        agency_name, dpdp_consent, dpdp_consent_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'admin', $4, $5,
        'BrokersBlitz Headquarters', true, now(), now(), now()
      ) RETURNING *`,
      [normalizedEmail, normalizedPhone, params.fullName.trim(), hash, salt]
    );

    return { success: true, user: mapProfileToUser(res.rows[0]) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create administrator profile.' };
  }
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`${userId}:${expiresAt}`).digest('hex');
  const token = `bbs.${userId}.${expiresAt}.${signature}`;

  try {
    await query(
      `INSERT INTO public.active_sessions (token, user_id, expires_at, created_at)
       VALUES ($1, $2::uuid, $3, now())
       ON CONFLICT (token) DO NOTHING`,
      [token, userId, expiresAt]
    );
  } catch {}

  return token;
}

export async function verifySession(token: string): Promise<StoredUser | null> {
  if (!token) return null;

  if (token.startsWith('bbs.')) {
    const parts = token.split('.');
    if (parts.length === 4) {
      const [, userId, expiresAtStr, signature] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);
      if (!isNaN(expiresAt) && expiresAt > Date.now()) {
        const expected = crypto.createHmac('sha256', SESSION_SECRET).update(`${userId}:${expiresAt}`).digest('hex');
        if (expected === signature) {
          const user = await findUserById(userId);
          if (user && !user.isLocked) {
            return user;
          }
        }
      }
      return null;
    }
  }

  try {
    const res = await query(
      `SELECT s.user_id FROM public.active_sessions s WHERE s.token = $1 AND s.expires_at > $2 LIMIT 1`,
      [token, Date.now()]
    );
    if (res.rows.length === 0) return null;
    return await findUserById(res.rows[0].user_id);
  } catch {
    return null;
  }
}

export const getSessionUser = verifySession;

export async function deleteSession(token: string): Promise<void> {
  try {
    await query(`DELETE FROM public.active_sessions WHERE token = $1`, [token]);
  } catch {}
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await query(`DELETE FROM public.active_sessions WHERE user_id::text = $1`, [userId]);
  } catch {}
}

export async function eraseUserPersonalData(userId: string): Promise<{ success: boolean; error?: string }> {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.role === 'admin') {
    return { success: false, error: 'Primary administrator accounts cannot be erased directly.' };
  }

  try {
    await query(
      `UPDATE public.profiles SET
        full_name = 'Deleted User [DPDP Erased]',
        email = $1,
        phone = '0000000000',
        password_hash = 'ERASED',
        password_salt = 'ERASED',
        agency_name = NULL,
        rera_number = NULL,
        is_locked = true,
        dpdp_consent = false,
        updated_at = now()
      WHERE id::text = $2`,
      [`erased.${userId}@anonymized.brokersblitz.in`, userId]
    );

    await deleteAllUserSessions(userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to erase user profile data.' };
  }
}

export async function getAllBrokers(): Promise<StoredUser[]> {
  try {
    const res = await query(
      `SELECT * FROM public.profiles WHERE role = 'broker' AND (is_locked IS FALSE OR is_locked IS NULL) ORDER BY created_at DESC`
    );
    return res.rows.map(mapProfileToUser);
  } catch {
    return [];
  }
}

export async function getAllBuyers(): Promise<StoredUser[]> {
  try {
    const res = await query(
      `SELECT * FROM public.profiles WHERE role = 'buyer' ORDER BY created_at DESC`
    );
    return res.rows.map(mapProfileToUser);
  } catch {
    return [];
  }
}

export async function toggleUserLock(userId: string): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.role === 'admin') {
    return { success: false, error: 'Administrator accounts cannot be locked.' };
  }

  try {
    const res = await query(
      `UPDATE public.profiles SET is_locked = NOT coalesce(is_locked, false), updated_at = now() WHERE id::text = $1 RETURNING *`,
      [userId]
    );
    return { success: true, user: mapProfileToUser(res.rows[0]) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle account status.' };
  }
}

export async function getPlatformUsersStats() {
  try {
    const brokersRes = await query(`SELECT count(*) as total, count(*) FILTER (WHERE is_locked IS TRUE) as locked FROM public.profiles WHERE role = 'broker'`);
    const buyersRes = await query(`SELECT count(*) as total, count(*) FILTER (WHERE is_locked IS TRUE) as locked FROM public.profiles WHERE role = 'buyer'`);

    const totalBrokers = parseInt(brokersRes.rows[0]?.total || '0', 10);
    const lockedBrokers = parseInt(brokersRes.rows[0]?.locked || '0', 10);
    const totalBuyers = parseInt(buyersRes.rows[0]?.total || '0', 10);
    const lockedBuyers = parseInt(buyersRes.rows[0]?.locked || '0', 10);

    return {
      totalBrokers,
      totalBuyers,
      activeBrokers: totalBrokers - lockedBrokers,
      lockedBrokers,
      activeBuyers: totalBuyers - lockedBuyers,
      lockedBuyers,
    };
  } catch {
    return {
      totalBrokers: 0,
      totalBuyers: 0,
      activeBrokers: 0,
      lockedBrokers: 0,
      activeBuyers: 0,
      lockedBuyers: 0,
    };
  }
}
