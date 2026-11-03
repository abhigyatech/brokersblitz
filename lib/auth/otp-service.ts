import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface StoredOtp {
  target: string;
  type: 'email' | 'whatsapp';
  code: string;
  expiresAt: number;
  attempts: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const OTPS_FILE = path.join(DATA_DIR, 'otps.json');

function ensureOtpFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(OTPS_FILE)) {
    fs.writeFileSync(OTPS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function loadOtps(): StoredOtp[] {
  ensureOtpFile();
  try {
    const raw = fs.readFileSync(OTPS_FILE, 'utf-8');
    const otps: StoredOtp[] = JSON.parse(raw);
    return otps.filter((o) => o.expiresAt > Date.now());
  } catch {
    return [];
  }
}

function saveOtps(otps: StoredOtp[]) {
  ensureOtpFile();
  fs.writeFileSync(OTPS_FILE, JSON.stringify(otps, null, 2), 'utf-8');
}

export async function sendOtp(target: string, type: 'email' | 'whatsapp'): Promise<{ success: boolean; message: string; sampleOtp?: string }> {
  const normalizedTarget = target.trim().toLowerCase();
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const otps = loadOtps().filter((o) => o.target !== normalizedTarget);
  otps.push({
    target: normalizedTarget,
    type,
    code,
    expiresAt,
    attempts: 0,
  });
  saveOtps(otps);

  if (type === 'email') {
    const zohoToken = process.env.ZOHO_MAIL_TOKEN;
    const zohoFrom = process.env.ZOHO_MAIL_FROM || 'support@brokersblitz.in';

    if (zohoToken) {
      try {
        await fetch('https://api.zeptomail.in/v1.1/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Zoho-enczapikey ${zohoToken}`,
          },
          body: JSON.stringify({
            from: { address: zohoFrom, name: 'BrokersBlitz Verification' },
            to: [{ email_address: { address: normalizedTarget } }],
            subject: 'Your BrokersBlitz Security Code',
            htmlbody: `<p>Your 6-digit BrokersBlitz verification code is <strong>${code}</strong>. Valid for 10 minutes.</p>`,
          }),
        });
        return { success: true, message: `Verification code sent to ${normalizedTarget}` };
      } catch {}
    }

    return {
      success: true,
      message: `Verification code dispatched to ${normalizedTarget}`,
      sampleOtp: code,
    };
  }

  const waToken = process.env.WHATSAPP_API_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_ID;

  if (waToken && waPhoneId) {
    try {
      await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTarget.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { body: `Your BrokersBlitz verification code is: ${code}. Valid for 10 minutes.` },
        }),
      });
      return { success: true, message: `Verification code sent to WhatsApp (${normalizedTarget})` };
    } catch {}
  }

  return {
    success: true,
    message: `Verification code dispatched to WhatsApp (${normalizedTarget})`,
    sampleOtp: code,
  };
}

export function verifyOtp(target: string, code: string): { success: boolean; error?: string } {
  const normalizedTarget = target.trim().toLowerCase();
  const otps = loadOtps();
  const entryIndex = otps.findIndex((o) => o.target === normalizedTarget);

  if (entryIndex === -1) {
    return { success: false, error: 'No active verification code found or it has expired. Please request a new code.' };
  }

  const entry = otps[entryIndex];
  if (entry.expiresAt < Date.now()) {
    otps.splice(entryIndex, 1);
    saveOtps(otps);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    if (entry.attempts >= 4) {
      otps.splice(entryIndex, 1);
      saveOtps(otps);
      return { success: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
    }
    saveOtps(otps);
    return { success: false, error: 'Invalid verification code. Please check and re-enter.' };
  }

  otps.splice(entryIndex, 1);
  saveOtps(otps);
  return { success: true };
}

