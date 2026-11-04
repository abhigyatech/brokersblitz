import fs from 'fs';
import path from 'path';
import { WhatsAppButton, WhatsAppListSection } from './types';

const META_GRAPH_VERSION = 'v21.0';

export function getWhatsAppCredentials(): { phoneId: string; token: string } {
  let phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  let token = process.env.WHATSAPP_ACCESS_TOKEN || '';

  if (!phoneId || !token) {
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const mToken = envContent.match(/WHATSAPP_ACCESS_TOKEN=(.*)/);
        const mPhone = envContent.match(/WHATSAPP_PHONE_NUMBER_ID=(.*)/);
        if (mToken && !token) token = mToken[1].trim().replace(/^['\"]|['\"]$/g, '');
        if (mPhone && !phoneId) phoneId = mPhone[1].trim().replace(/^['\"]|['\"]$/g, '');
      }
    } catch {}
  }

  return { phoneId, token };
}

export async function sendTextMessage(to: string, bodyText: string): Promise<boolean> {
  const { phoneId, token } = getWhatsAppCredentials();

  if (!phoneId || !token) {
    console.error('[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return false;
  }

  const cleanTo = to.replace(/[^0-9]/g, '');

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: { body: bodyText },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendTextMessage ${res.status} to ${cleanTo}]:`, errText);
      return false;
    }

    const resJson = await res.json();
    console.log(`[WhatsApp Message Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp Network Error sendTextMessage to ${cleanTo}]:`, err.message);
    return false;
  }
}

export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: WhatsAppButton[]
): Promise<boolean> {
  const { phoneId, token } = getWhatsAppCredentials();

  if (!phoneId || !token) {
    console.error('[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return false;
  }

  const cleanTo = to.replace(/[^0-9]/g, '');
  const formattedButtons = buttons.slice(0, 3).map((btn) => ({
    type: 'reply',
    reply: {
      id: btn.id,
      title: btn.title.slice(0, 20),
    },
  }));

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText.slice(0, 1024) },
          action: { buttons: formattedButtons },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendButtonMessage ${res.status} to ${cleanTo}]:`, errText);

      const fallbackText = `${bodyText}\n\nQuick Options:\n` +
        buttons.map((b, i) => `${i + 1}. ${b.title} (Send "${b.title}")`).join('\n');
      return sendTextMessage(cleanTo, fallbackText);
    }

    const resJson = await res.json();
    console.log(`[WhatsApp Buttons Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp Network Error sendButtonMessage to ${cleanTo}]:`, err.message);
    const fallbackText = `${bodyText}\n\nQuick Options:\n` +
      buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
    return sendTextMessage(cleanTo, fallbackText);
  }
}

export async function sendListMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: WhatsAppListSection[]
): Promise<boolean> {
  const { phoneId, token } = getWhatsAppCredentials();

  if (!phoneId || !token) {
    console.error('[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return false;
  }

  const cleanTo = to.replace(/[^0-9]/g, '');

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: { type: 'text', text: headerText.slice(0, 60) },
          body: { text: bodyText.slice(0, 1024) },
          action: {
            button: buttonText.slice(0, 20),
            sections: sections.map((sec) => ({
              title: sec.title.slice(0, 24),
              rows: sec.rows.slice(0, 10).map((r) => ({
                id: r.id,
                title: r.title.slice(0, 24),
                description: r.description ? r.description.slice(0, 72) : undefined,
              })),
            })),
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendListMessage ${res.status} to ${cleanTo}]:`, errText);

      let fallbackText = `*${headerText}*\n${bodyText}\n\nPlease reply with your choice:\n`;
      sections.forEach((sec) => {
        sec.rows.forEach((r) => {
          fallbackText += `• *${r.title}*${r.description ? ` (${r.description})` : ''}\n`;
        });
      });
      return sendTextMessage(cleanTo, fallbackText);
    }

    const resJson = await res.json();
    console.log(`[WhatsApp List Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp Network Error sendListMessage to ${cleanTo}]:`, err.message);
    let fallbackText = `*${headerText}*\n${bodyText}\n\nPlease reply with your choice:\n`;
    sections.forEach((sec) => {
      sec.rows.forEach((r) => {
        fallbackText += `• *${r.title}*\n`;
      });
    });
    return sendTextMessage(cleanTo, fallbackText);
  }
}

export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const { token } = getWhatsAppCredentials();
  if (!token) return null;

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      },
    });

    if (!metaRes.ok) {
      console.error(`[WhatsApp Media URL Error ${metaRes.status}]:`, await metaRes.text());
      return null;
    }

    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;
    const mimeType = metaData.mime_type || 'audio/ogg';

    if (!mediaUrl) return null;

    let downloadRes = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      },
      redirect: 'manual',
    });

    if (downloadRes.status >= 300 && downloadRes.status < 400) {
      const redirectUrl = downloadRes.headers.get('location');
      if (redirectUrl) {
        downloadRes = await fetch(redirectUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'curl/7.64.1',
          },
        });
      }
    }

    if (!downloadRes.ok) {
      console.error(`[WhatsApp Media Download Error ${downloadRes.status}]:`, await downloadRes.text());
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
    };
  } catch (err: any) {
    console.error('[WhatsApp Media Download Exception]:', err.message);
    return null;
  }
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const { phoneId, token } = getWhatsAppCredentials();
  if (!phoneId || !token) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
