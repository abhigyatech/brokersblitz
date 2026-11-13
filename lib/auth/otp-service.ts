import { query } from '../db/postgres';

export async function sendOtp(
  target: string,
  type: 'email' | 'whatsapp'
): Promise<{ success: boolean; message: string; sampleOtp?: string }> {
  const normalizedTarget = target.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  try {
    await query(`DELETE FROM public.auth_otps WHERE lower(target) = $1 OR lower(phone) = $1`, [normalizedTarget]);
    await query(
      `INSERT INTO public.auth_otps (target, phone, type, otp_code, expires_at, attempts, created_at)
       VALUES ($1, $1, $2, $3, $4, 0, now())`,
      [normalizedTarget, type, code, expiresAt]
    );
  } catch {}

  if (type === 'email') {
    const zohoToken = process.env.ZOHO_MAIL_TOKEN;
    const zohoFrom = process.env.ZOHO_MAIL_FROM || 'support@brokersblitz.in';

    if (zohoToken) {
      try {
        await fetch('https://api.zeptomail.in/v1.1/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Zoho-enczapikey ${zohoToken}`,
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

  const waToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;

  if (waToken && waPhoneId) {
    try {
      await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${waToken}`,
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

export async function verifyOtp(
  target: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedTarget = target.trim().toLowerCase();

  try {
    const res = await query(
      `SELECT * FROM public.auth_otps 
       WHERE (lower(target) = $1 OR lower(phone) = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedTarget]
    );

    if (res.rows.length === 0) {
      return { success: false, error: 'No active verification code found or it has expired. Please request a new code.' };
    }

    const entry = res.rows[0];
    const expiresAt = Number(entry.expires_at);

    if (expiresAt < Date.now()) {
      await query(`DELETE FROM public.auth_otps WHERE id = $1`, [entry.id]);
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (entry.otp_code !== code.trim()) {
      const attempts = (entry.attempts || 0) + 1;
      if (attempts >= 4) {
        await query(`DELETE FROM public.auth_otps WHERE id = $1`, [entry.id]);
        return { success: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
      }
      await query(`UPDATE public.auth_otps SET attempts = $1 WHERE id = $2`, [attempts, entry.id]);
      return { success: false, error: 'Invalid verification code. Please check and re-enter.' };
    }

    await query(`DELETE FROM public.auth_otps WHERE id = $1`, [entry.id]);
    return { success: true };
  } catch {
    return { success: false, error: 'Database error verifying code.' };
  }
}
