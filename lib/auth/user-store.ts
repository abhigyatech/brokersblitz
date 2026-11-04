import fs from 'fs';
import path from 'path';
import { hashPassword, generateSessionToken } from './crypto';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    const defaultPass = hashPassword('BrokersBlitz@2026');
    const defaultUsers: StoredUser[] = [
      {
        id: 'user-admin-01',
        fullName: 'Platform Operations Admin',
        email: 'admin@brokersblitz.in',
        phone: '7272357771',
        role: 'admin',
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        agencyName: 'BrokersBlitz Headquarters',
        dpdpConsent: true,
        dpdpConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-broker-demo',
        fullName: 'Rajesh Mehta',
        email: 'broker@apexrealty.in',
        phone: '9820144520',
        role: 'broker',
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        agencyName: 'Apex Prime Realty MMR',
        reraNumber: 'A51900010482',
        operatingCity: 'Mumbai',
        dpdpConsent: true,
        dpdpConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-buyer-demo',
        fullName: 'Rahul Sharma',
        email: 'buyer@investors.in',
        phone: '9876543210',
        role: 'buyer',
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        dpdpConsent: true,
        dpdpConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function generateUserReferralCode(user: { fullName: string; storeCode?: string; phone?: string; id?: string }): string {
  if (user.storeCode) {
    return user.storeCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
  const namePart = user.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'REF';
  const phonePart = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-4) : (user.id || Math.random().toString(36)).slice(-4).toUpperCase();
  return `${namePart}${phonePart}`;
}

export function getAllUsers(): StoredUser[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users: StoredUser[] = JSON.parse(raw);
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
    return [];
  }
}

export function saveUsers(users: StoredUser[]) {
  ensureDataFiles();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
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
  ensureDataFiles();
  const token = generateSessionToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions: ActiveSession[] = JSON.parse(raw);
    const validSessions = sessions.filter((s) => s.expiresAt > Date.now());
    validSessions.push({ token, userId, expiresAt });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(validSessions, null, 2), 'utf-8');
  } catch {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([{ token, userId, expiresAt }], null, 2), 'utf-8');
  }

  return token;
}

export function verifySession(token: string): StoredUser | null {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions: ActiveSession[] = JSON.parse(raw);
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
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions: ActiveSession[] = JSON.parse(raw);
    const filtered = sessions.filter((s) => s.token !== token);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch {}
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
