import { query } from '../db/postgres';

export interface ChatbotConfig {
  enabled: boolean;
  showAiAssistant: boolean;
  showWhatsApp: boolean;
  whatsappNumber: string;
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  enabled: true,
  showAiAssistant: true,
  showWhatsApp: true,
  whatsappNumber: '+91 72723 57771',
  updatedAt: '2026-11-01T00:00:00.000Z',
  updatedBy: 'admin@brokersblitz.in',
};

export async function getChatbotConfig(): Promise<ChatbotConfig> {
  try {
    const res = await query(
      `SELECT value FROM public.platform_settings WHERE key = 'chatbot_config' LIMIT 1`
    );
    if (res.rows.length === 0) {
      return DEFAULT_CHATBOT_CONFIG;
    }
    const config = res.rows[0].value;
    return {
      enabled: typeof config.enabled === 'boolean' ? config.enabled : DEFAULT_CHATBOT_CONFIG.enabled,
      showAiAssistant: typeof config.showAiAssistant === 'boolean' ? config.showAiAssistant : DEFAULT_CHATBOT_CONFIG.showAiAssistant,
      showWhatsApp: typeof config.showWhatsApp === 'boolean' ? config.showWhatsApp : DEFAULT_CHATBOT_CONFIG.showWhatsApp,
      whatsappNumber: config.whatsappNumber || DEFAULT_CHATBOT_CONFIG.whatsappNumber,
      updatedAt: config.updatedAt || DEFAULT_CHATBOT_CONFIG.updatedAt,
      updatedBy: config.updatedBy || DEFAULT_CHATBOT_CONFIG.updatedBy,
    };
  } catch {
    return DEFAULT_CHATBOT_CONFIG;
  }
}

export async function updateChatbotConfig(
  updates: {
    enabled?: boolean;
    showAiAssistant?: boolean;
    showWhatsApp?: boolean;
    whatsappNumber?: string;
  },
  adminEmail?: string
): Promise<ChatbotConfig> {
  const current = await getChatbotConfig();
  const nextConfig: ChatbotConfig = {
    enabled: typeof updates.enabled === 'boolean' ? updates.enabled : current.enabled,
    showAiAssistant: typeof updates.showAiAssistant === 'boolean' ? updates.showAiAssistant : current.showAiAssistant,
    showWhatsApp: typeof updates.showWhatsApp === 'boolean' ? updates.showWhatsApp : current.showWhatsApp,
    whatsappNumber: updates.whatsappNumber?.trim() || current.whatsappNumber,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || current.updatedBy,
  };

  try {
    await query(
      `INSERT INTO public.platform_settings (key, value, updated_at)
       VALUES ('chatbot_config', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(nextConfig)]
    );
  } catch {}

  return nextConfig;
}
