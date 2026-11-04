import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hashPassword, generateSessionToken } from './crypto';
import { readJsonFile, writeJsonFile } from '../db/json-store';

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

const DEFAULT_PASS_HASH = 'd63596aa9cd2542a8d0bc37c5318b4e785ac7bfc45496d736ac297de8f344dc8cd40c09a7cd1c901cc543d091f0f14844c346352943257a60986f21a334a2fc6';
const DEFAULT_PASS_SALT = '355fb0cdf63948838fd8d826e2f964f1';

function getDefaultSeedUsers(): StoredUser[] {
  return [
    {
      id: 'user-admin-01',
      fullName: 'Platform Operations Admin',
      email: 'admin@brokersblitz.in',
      phone: '7272357771',
      role: 'admin',
      passwordHash: DEFAULT_PASS_HASH,
      passwordSalt: DEFAULT_PASS_SALT,
      agencyName: 'BrokersBlitz Headquarters',
      referralCode: 'PLATF7771',
      dpdpConsent: true,
      dpdpConsentDate: '2026-11-01T11:35:52.213Z',
      createdAt: '2026-11-01T11:35:52.217Z',
      updatedAt: '2026-11-04T11:15:00.000Z',
    },
    {
      id: 'broker-indore-01',
      fullName: 'Sanjay Verma',
      email: 'sanjay@primeadvisory.in',
      phone: '9988776655',
      role: 'broker',
      passwordHash: DEFAULT_PASS_HASH,
      passwordSalt: DEFAULT_PASS_SALT,
      agencyName: 'Prime Advisory Indore',
      storeCode: 'indore1001',
      referralCode: 'INDORE1001',
      reraNumber: 'MP/RERA/IND/2021/0458',
      operatingCity: 'Indore',
      experienceYears: 9,
      isLocked: false,
      dpdpConsent: true,
      dpdpConsentDate: '2026-11-01T10:00:00.000Z',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-04T11:15:00.000Z',
    },
    {
      id: 'broker-mumbai-01',
      fullName: 'Rajesh Mehta',
      email: 'rajesh@apexprime.in',
      phone: '9820144520',
      role: 'broker',
      passwordHash: DEFAULT_PASS_HASH,
      passwordSalt: DEFAULT_PASS_SALT,
      agencyName: 'Apex Prime Realty MMR',
      storeCode: 'apex-prime',
      referralCode: 'APEXPRIME',
      reraNumber: 'A51900010482',
      operatingCity: 'Mumbai',
      experienceYears: 16,
      isLocked: false,
      dpdpConsent: true,
      dpdpConsentDate: '2026-11-01T10:00:00.000Z',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    },
    {
      id: 'user-buyer-demo',
      fullName: 'Rahul Sharma',
      email: 'buyer@investors.in',
      phone: '9876543210',
      role: 'buyer',
      passwordHash: DEFAULT_PASS_HASH,
      passwordSalt: DEFAULT_PASS_SALT,
      referralCode: 'RAHUL3210',
      dpdpConsent: true,
      dpdpConsentDate: '2026-11-01T11:35:52.217Z',
      createdAt: '2026-11-01T11:35:52.217Z',
      updatedAt: '2026-11-01T11:35:52.217Z',
    },
  ];
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

export function getAllUsers(): StoredUser[] {
  try {
    const users = readJsonFile<StoredUser[]>('users.json', getDefaultSeedUsers());
    let modified = false;
    for (const u of users) {
      if (!u.referralCode) {
        u.referralCode = generateUserReferralCode(u);
        modified = true;
      }
    }
    if (modified) {
      saveUsers(users);
    }
    return users;
  } catch {
    return getDefaultSeedUsers();
  }
}

export function saveUsers(users: StoredUser[]) {
  writeJsonFile('users.json', users);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function findUserByPhone(phone: string): StoredUser | undefined {
  const cleaned = phone.replace(/[^0-9]/g, '').slice(-10);
  const users = getAllUsers();
  return users.find((u) => u.phone.replace(/[^0-9]/g, '').slice(-10) === cleaned);
}

export function findUserById(id: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

export function createNewUser(params: {
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
}): { success: boolean; error?: string; user?: StoredUser } {
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

  if (findUserByEmail(normalizedEmail)) {
    return { success: false, error: 'This email address is already registered. Please log in instead.' };
  }

  if (findUserByPhone(normalizedPhone)) {
    return { success: false, error: 'This mobile number is already registered. Please log in instead.' };
  }

  const { hash, salt } = hashPassword(params.password);
  const referralCode = params.referralCode?.trim() || generateUserReferralCode({
    fullName: params.fullName,
    storeCode: params.storeCode,
    phone: normalizedPhone,
  });

  const newUser: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: params.role,
    passwordHash: hash,
    passwordSalt: salt,
    agencyName: params.agencyName?.trim(),
    storeCode: params.storeCode?.trim(),
    referralCode,
    referredBy: params.referredBy?.trim(),
    reraNumber: params.reraNumber?.trim(),
    operatingCity: params.operatingCity?.trim(),
    dpdpConsent: true,
    dpdpConsentDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  return { success: true, user: newUser };
}

export function createAdminUser(
  adminEmail: string,
  params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }
): { success: boolean; error?: string; user?: StoredUser } {
  const requestingAdmin = findUserByEmail(adminEmail);
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

  if (findUserByEmail(normalizedEmail)) {
    return { success: false, error: 'This admin email is already registered.' };
  }

  if (findUserByPhone(normalizedPhone)) {
    return { success: false, error: 'This mobile number is already in use.' };
  }

  const { hash, salt } = hashPassword(params.password);
  const newAdmin: StoredUser = {
    id: `admin-${Date.now()}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: 'admin',
    passwordHash: hash,
    passwordSalt: salt,
    agencyName: 'BrokersBlitz Headquarters',
    dpdpConsent: true,
    dpdpConsentDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const users = getAllUsers();
  users.push(newAdmin);
  saveUsers(users);

  return { success: true, user: newAdmin };
}

export function createSession(userId: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`${userId}:${expiresAt}`).digest('hex');
  const token = `bbs.${userId}.${expiresAt}.${signature}`;

  try {
    const sessions = readJsonFile<ActiveSession[]>('sessions.json', []);
    const validSessions = sessions.filter((s) => s.expiresAt > Date.now());
    validSessions.push({ token, userId, expiresAt });
    writeJsonFile('sessions.json', validSessions);
  } catch {}

  return token;
}

export function verifySession(token: string): StoredUser | null {
  if (!token) return null;

  if (token.startsWith('bbs.')) {
    const parts = token.split('.');
    if (parts.length === 4) {
      const [, userId, expiresAtStr, signature] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);
      if (!isNaN(expiresAt) && expiresAt > Date.now()) {
        const expected = crypto.createHmac('sha256', SESSION_SECRET).update(`${userId}:${expiresAt}`).digest('hex');
        if (expected === signature) {
          const user = findUserById(userId);
          if (user && !user.isLocked) {
            return user;
          }
        }
      }
      return null;
    }
  }

  try {
    const sessions = readJsonFile<ActiveSession[]>('sessions.json', []);
    const session = sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;
    const user = findUserById(session.userId);
    return user || null;
  } catch {
    return null;
  }
}

export const getSessionUser = verifySession;

export function deleteSession(token: string) {
  try {
    const sessions = readJsonFile<ActiveSession[]>('sessions.json', []);
    const filtered = sessions.filter((s) => s.token !== token);
    writeJsonFile('sessions.json', filtered);
  } catch {}
}

export function deleteAllUserSessions(userId: string) {
  try {
    const sessions = readJsonFile<ActiveSession[]>('sessions.json', []);
    const filtered = sessions.filter((s) => s.userId !== userId);
    writeJsonFile('sessions.json', filtered);
  } catch {}
}

export function eraseUserPersonalData(userId: string): { success: boolean; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.role === 'admin') {
    return { success: false, error: 'Primary administrator accounts cannot be erased directly.' };
  }

  user.fullName = 'Deleted User [DPDP Erased]';
  user.email = `erased.${userId}@anonymized.brokersblitz.in`;
  user.phone = '0000000000';
  user.passwordHash = 'ERASED';
  user.passwordSalt = 'ERASED';
  user.agencyName = undefined;
  user.reraNumber = undefined;
  user.isLocked = true;
  user.dpdpConsent = false;
  user.updatedAt = new Date().toISOString();

  saveUsers(users);
  deleteAllUserSessions(userId);

  return { success: true };
}

export function getAllBrokers(): StoredUser[] {
  return getAllUsers().filter((u) => u.role === 'broker');
}

export function getAllBuyers(): StoredUser[] {
  return getAllUsers().filter((u) => u.role === 'buyer');
}

export function toggleUserLock(userId: string): { success: boolean; error?: string; user?: StoredUser } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.role === 'admin') {
    return { success: false, error: 'Administrator accounts cannot be locked.' };
  }
  user.isLocked = !user.isLocked;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);
  return { success: true, user };
}

export function getPlatformUsersStats() {
  const users = getAllUsers();
  const brokers = users.filter((u) => u.role === 'broker');
  const buyers = users.filter((u) => u.role === 'buyer');
  const lockedBrokers = brokers.filter((b) => b.isLocked);
  const lockedBuyers = buyers.filter((b) => b.isLocked);
  return {
    totalBrokers: brokers.length,
    totalBuyers: buyers.length,
    activeBrokers: brokers.length - lockedBrokers.length,
    lockedBrokers: lockedBrokers.length,
    activeBuyers: buyers.length - lockedBuyers.length,
    lockedBuyers: lockedBuyers.length,
  };
}
