import { WhatsAppUserSession, DraftListingData, ListingStep, BuyerSearchPreferences } from './types';
import { findUserByPhone } from '../auth/user-store';
import { query } from '../db/postgres';

export async function getOrCreateSession(phone: string, userName?: string): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

  try {
    const res = await query(
      `SELECT data FROM public.whatsapp_sessions WHERE phone = $1 LIMIT 1`,
      [cleanPhone]
    );

    if (res.rows.length > 0) {
      const session = res.rows[0].data as WhatsAppUserSession;
      const lastActiveTime = session.lastActive ? new Date(session.lastActive).getTime() : 0;
      if (Date.now() - lastActiveTime > 2 * 60 * 60 * 1000) {
        session.currentStep = 'idle';
      }
      session.lastActive = new Date().toISOString();
      await query(
        `UPDATE public.whatsapp_sessions SET data = $1::jsonb, updated_at = now() WHERE phone = $2`,
        [JSON.stringify(session), cleanPhone]
      );
      return session;
    }
  } catch {}

  const existingUser = await findUserByPhone(cleanPhone);
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

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(newSession)]
    );
  } catch {}

  return newSession;
}

export async function updateSession(
  phone: string,
  updates: Partial<WhatsAppUserSession>
): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const current = await getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    ...updates,
    lastActive: new Date().toISOString(),
  };

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(merged)]
    );
  } catch {}

  return merged;
}

export async function setSessionStep(phone: string, step: ListingStep): Promise<WhatsAppUserSession> {
  return updateSession(phone, { currentStep: step });
}

export async function updateDraftListing(
  phone: string,
  data: Partial<DraftListingData>
): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const current = await getOrCreateSession(phone);

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

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(merged)]
    );
  } catch {}

  return merged;
}

export async function resetDraftListing(phone: string): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const current = await getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    currentStep: 'idle',
    draftListing: undefined,
    activeDraftId: undefined,
    lastActive: new Date().toISOString(),
  };

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(merged)]
    );
  } catch {}

  return merged;
}

export async function updateBuyerPreferences(
  phone: string,
  data: Partial<BuyerSearchPreferences>
): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const current = await getOrCreateSession(phone);

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

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(merged)]
    );
  } catch {}

  return merged;
}

export async function resetBuyerPreferences(phone: string): Promise<WhatsAppUserSession> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const current = await getOrCreateSession(phone);

  const merged: WhatsAppUserSession = {
    ...current,
    currentStep: 'idle',
    buyerPreferences: undefined,
    lastActive: new Date().toISOString(),
  };

  try {
    await query(
      `INSERT INTO public.whatsapp_sessions (phone, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (phone) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [cleanPhone, JSON.stringify(merged)]
    );
  } catch {}

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
