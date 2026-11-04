import fs from 'fs';
import path from 'path';
import { WhatsAppUserSession, DraftListingData, ListingStep, BuyerSearchPreferences } from './types';
import { findUserByPhone } from '../auth/user-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'whatsapp_sessions.json');

function ensureSessionFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

function readSessions(): Record<string, WhatsAppUserSession> {
  ensureSessionFile();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, WhatsAppUserSession>): void {
  ensureSessionFile();
  const temp = `${SESSIONS_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(sessions, null, 2), 'utf-8');
  fs.renameSync(temp, SESSIONS_FILE);
}

export function getOrCreateSession(phone: string, userName?: string): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();

  if (sessions[cleanPhone]) {
    const lastActiveTime = sessions[cleanPhone].lastActive ? new Date(sessions[cleanPhone].lastActive).getTime() : 0;
    if (Date.now() - lastActiveTime > 2 * 60 * 60 * 1000) {
      sessions[cleanPhone].currentStep = 'idle';
    }
    sessions[cleanPhone].lastActive = new Date().toISOString();
    writeSessions(sessions);
    return sessions[cleanPhone];
  }

  const existingUser = findUserByPhone(cleanPhone);
  const isBroker = existingUser?.role === 'broker';

  const newSession: WhatsAppUserSession = {
    phone: cleanPhone,
    role: isBroker ? 'broker' : 'buyer',
    brokerId: existingUser?.id,
    brokerCode: existingUser?.storeCode || (existingUser?.agencyName ? existingUser.agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') : undefined),
    brokerName: existingUser?.fullName || userName || 'Partner Broker',
    agencyName: existingUser?.agencyName || 'Independent Broker Network',
    currentStep: 'idle',
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = newSession;
  writeSessions(sessions);
  return newSession;
}

export function updateSession(
  phone: string,
  updates: Partial<WhatsAppUserSession>
): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    ...updates,
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

export function setSessionStep(phone: string, step: ListingStep): WhatsAppUserSession {
  return updateSession(phone, { currentStep: step });
}

export function updateDraftListing(
  phone: string,
  data: Partial<DraftListingData>
): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);

  const existingDraft = current.draftListing || {};
  const updatedDraft: DraftListingData = {
    ...existingDraft,
    ...data,
  };

  const merged: WhatsAppUserSession = {
    ...current,
    draftListing: updatedDraft,
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

export function resetDraftListing(phone: string): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    currentStep: 'idle',
    draftListing: undefined,
    activeDraftId: undefined,
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

export function updateBuyerPreferences(
  phone: string,
  data: Partial<BuyerSearchPreferences>
): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);

  const existingPrefs = current.buyerPreferences || {};
  const updatedPrefs: BuyerSearchPreferences = {
    ...existingPrefs,
    ...data,
    lastSearchedAt: new Date().toISOString(),
  };

  const merged: WhatsAppUserSession = {
    ...current,
    buyerPreferences: updatedPrefs,
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

export function resetBuyerPreferences(phone: string): WhatsAppUserSession {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    currentStep: 'idle',
    buyerPreferences: undefined,
    lastActive: new Date().toISOString(),
  };

  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

const processedMessageIds = new Map<string, number>();

export function isMessageProcessed(messageId?: string): boolean {
  if (!messageId) return false;
  const processedAt = processedMessageIds.get(messageId);
  if (!processedAt) return false;
  if (Date.now() - processedAt > 15 * 60 * 1000) {
    processedMessageIds.delete(messageId);
    return false;
  }
  return true;
}

export function markMessageProcessed(messageId?: string): void {
  if (!messageId) return;
  processedMessageIds.set(messageId, Date.now());
  if (processedMessageIds.size > 2000) {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [id, time] of processedMessageIds.entries()) {
      if (time < cutoff) processedMessageIds.delete(id);
    }
  }
}
