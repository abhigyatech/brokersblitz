'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Phone,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface ChatbotConfig {
  enabled: boolean;
  showAiAssistant: boolean;
  showWhatsApp: boolean;
  whatsappNumber: string;
  updatedAt: string;
  updatedBy?: string;
}

interface AdminChatbotControlViewProps {
  onToast: (msg: string) => void;
}

export default function AdminChatbotControlView({ onToast }: AdminChatbotControlViewProps) {
  const [config, setConfig] = useState<ChatbotConfig>({
    enabled: true,
    showAiAssistant: true,
    showWhatsApp: true,
    whatsappNumber: '+91 72723 57771',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@brokersblitz.in',
  });

  const [formEnabled, setFormEnabled] = useState(true);
  const [formShowAi, setFormShowAi] = useState(true);
  const [formShowWhatsApp, setFormShowWhatsApp] = useState(true);
  const [formWhatsAppNumber, setFormWhatsAppNumber] = useState('+91 72723 57771');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/chatbot/settings');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setFormEnabled(data.config.enabled);
        setFormShowAi(data.config.showAiAssistant);
        setFormShowWhatsApp(data.config.showWhatsApp);
        setFormWhatsAppNumber(data.config.whatsappNumber || '+91 72723 57771');
      }
    } catch {
      onToast('Failed to load chatbot settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/chatbot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: formEnabled,
          showAiAssistant: formShowAi,
          showWhatsApp: formShowWhatsApp,
          whatsappNumber: formWhatsAppNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        onToast(data.error || 'Failed to update chatbot settings.');
        return;
      }

      setConfig(data.config);
      onToast('Chatbot visibility and channel settings saved successfully.');
    } catch {
      onToast('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormEnabled(config.enabled);
    setFormShowAi(config.showAiAssistant);
    setFormShowWhatsApp(config.showWhatsApp);
    setFormWhatsAppNumber(config.whatsappNumber || '+91 72723 57771');
    onToast('Reverted uncommitted changes.');
  };

  const isActuallyVisible = formEnabled && (formShowAi || formShowWhatsApp);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1A1A1A]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#DF6400] to-[#f58428] text-white flex items-center justify-center shadow-md shadow-[#DF6400]/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
                Chatbot & Assistant Controls
              </h1>
              <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
                Control customer-facing chatbot visibility and configure available support channels across the entire platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchConfig}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#1A1A1A] dark:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#282420] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#1A1A1A]/10 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#1A1A1A] dark:text-white">
                      Chatbot Widget Visibility
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        formEnabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formEnabled ? 'Active / Visible' : 'Disabled / Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                    Master toggle to enable or disable the floating support assistant across all public pages (Home, Search, Property Details, Broker Storefronts, and Broker Directory).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-13 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#DF6400]"></div>
                </label>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${!formEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
                    Active Assistant Channels
                  </h3>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
                    Choose which support channels are accessible to visitors when the chatbot is open.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#151311] border border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                          AI Real Estate Assistant
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#DF6400]/10 text-[#DF6400] text-[9px] font-black uppercase">
                          AI Chat
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-0.5 leading-relaxed">
                        Interactive property advisor. Answers buyer questions, details locality insights, and automates on-site walkthrough scheduling.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formShowAi}
                      onChange={(e) => setFormShowAi(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DF6400]"></div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#151311] border border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                          Official WhatsApp Support
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                          WhatsApp
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-0.5 leading-relaxed">
                        Displays QR code modal and provides direct wa.me link for clients who prefer messaging on WhatsApp.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formShowWhatsApp}
                      onChange={(e) => setFormShowWhatsApp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#151311] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                    Official WhatsApp Support Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formWhatsAppNumber}
                      onChange={(e) => setFormWhatsAppNumber(e.target.value)}
                      placeholder="+91 72723 57771"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-mono font-bold text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#DF6400]"
                    />
                  </div>
                  <p className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
                    Incoming inquiries and QR code deep links will direct clients to this phone number.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#5C5852] dark:text-[#A8A29A] hover:bg-[#FAF8F5] dark:hover:bg-[#282420] transition-colors"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-bold shadow-md shadow-[#DF6400]/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#DF6400]" />
              <span>Live Visitor Experience Preview</span>
            </h3>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#151311] border border-[#1A1A1A]/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1A1A1A] dark:text-white">Widget Status:</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isActuallyVisible
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isActuallyVisible ? 'Visible Online' : 'Hidden from Visitors'}
                </span>
              </div>

              <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
                {!formEnabled ? (
                  <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                    <EyeOff className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>The chatbot launcher is turned OFF. No button or assistant modal will appear anywhere on the website.</span>
                  </div>
                ) : formShowAi && formShowWhatsApp ? (
                  <div className="space-y-1.5 text-xs text-[#1A1A1A] dark:text-white">
                    <span className="font-bold text-[#DF6400] block">Dual-Channel Speed Dial Mode:</span>
                    <span>Visitors see the floating button with headphones icon. Hovering/clicking presents both "WhatsApp Support" and "Chat Support (AI)" options.</span>
                  </div>
                ) : formShowAi && !formShowWhatsApp ? (
                  <div className="space-y-1.5 text-xs text-[#1A1A1A] dark:text-white">
                    <span className="font-bold text-[#DF6400] block">Direct AI Assistant Mode:</span>
                    <span>Visitors see a direct AI chat button. Clicking directly opens the conversational AI assistant. All WhatsApp buttons and references are hidden.</span>
                  </div>
                ) : !formShowAi && formShowWhatsApp ? (
                  <div className="space-y-1.5 text-xs text-[#1A1A1A] dark:text-white">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Direct WhatsApp Mode:</span>
                    <span>Visitors see the official WhatsApp launcher button. Clicking directly opens the WhatsApp QR code and web link modal. AI assistant is hidden.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                    <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Both AI and WhatsApp channels are disabled. The chatbot widget will automatically remain hidden from visitors.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Active Configuration</span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]/5 dark:border-white/5">
                  <span className="text-[#5C5852] dark:text-[#A8A29A]">Master Toggle:</span>
                  <span className="font-bold text-[#1A1A1A] dark:text-white">{config.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]/5 dark:border-white/5">
                  <span className="text-[#5C5852] dark:text-[#A8A29A]">AI Assistant:</span>
                  <span className="font-bold text-[#1A1A1A] dark:text-white">{config.showAiAssistant ? 'Visible' : 'Hidden'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]/5 dark:border-white/5">
                  <span className="text-[#5C5852] dark:text-[#A8A29A]">WhatsApp Support:</span>
                  <span className="font-bold text-[#1A1A1A] dark:text-white">{config.showWhatsApp ? 'Visible' : 'Hidden'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5C5852] dark:text-[#A8A29A]">Last Updated:</span>
                  <span className="font-mono text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
                    {new Date(config.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
