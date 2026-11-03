'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MessageSquare,
  MessageCircle,
  Mic,
  Send,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Lock,
  Headphones,
  Copy,
  Check,
  Bot,
  ExternalLink,
  ChevronRight,
  Store,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react';
import { generateWhatsAppQRMatrix } from '@/lib/qr';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  options?: Array<{
    key: string;
    label: string;
    url?: string;
  }>;
  showDatePicker?: boolean;
  propertyContext?: any;
  action?: {
    type: 'whatsapp' | 'call' | 'link';
    label: string;
    url: string;
  };
}

interface BlitzChatbotProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const WHATSAPP_DISPLAY_NUMBER = '+91 72723 57771';
const WHATSAPP_RAW_NUMBER = '917272357771';

export default function BlitzChatbot({
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
}: BlitzChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleChat = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePropertyContext, setActivePropertyContext] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [selectedVisitDate, setSelectedVisitDate] = useState<string>('');
  const [selectedVisitSlot, setSelectedVisitSlot] = useState<string>('10:30 AM - 12:00 PM (Morning)');
  const [isSchedulingVisit, setIsSchedulingVisit] = useState(false);

  const [showInlineAuth, setShowInlineAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'bot',
      text: 'Namaste! I am your BrokersBlitz AI Assistant with Pan India real estate advisory.\n\nHow may I help you today? Inquire about properties, schedule on-site walkthroughs, or chat directly on WhatsApp at +91 72723 57771.',
      time: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const qrMatrix = useMemo(() => {
    return generateWhatsAppQRMatrix(`https://wa.me/${WHATSAPP_RAW_NUMBER}?text=Hi%20BrokersBlitz`);
  }, []);

  const [minBookingDate, setMinBookingDate] = useState<string>('');

  useEffect(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setMinBookingDate(dateStr);
    setSelectedVisitDate(dateStr);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading, showInlineAuth, isSchedulingVisit]);

  useEffect(() => {
    const handleEnquireEvent = async (e: any) => {
      const data = e.detail;
      if (!isOpen) toggleChat();
      setIsSpeedDialOpen(false);
      setIsWhatsAppModalOpen(false);
      setActivePropertyContext(data);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userAutoMessage: Message = {
        id: `user-auto-${Date.now()}`,
        sender: 'user',
        text: `Enquiry: Property ID ${data.propertyId || 'Ref'} • Store: ${data.brokerStoreCode || 'Partner'} • ${data.propertyTitle}`,
        time: timeStr,
      };

      setMessages((prev) => [...prev, userAutoMessage]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/bot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: 'enquire',
            propertyContext: data,
          }),
        });
        const resData = await res.json();
        if (resData.success && resData.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-auto-${Date.now()}`,
              sender: 'bot',
              text: resData.reply,
              options: resData.options,
              propertyContext: data,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              action: resData.action,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-fb-${Date.now()}`,
            sender: 'bot',
            text: `Inquiry recorded for "${data.propertyTitle}". Our WhatsApp Support desk at ${WHATSAPP_DISPLAY_NUMBER} is ready to schedule your property walkthrough.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: {
              type: 'whatsapp',
              label: `Chat on WhatsApp (${WHATSAPP_DISPLAY_NUMBER})`,
              url: `https://wa.me/${WHATSAPP_RAW_NUMBER}`,
            },
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('blitzbot:enquire', handleEnquireEvent);
    return () => window.removeEventListener('blitzbot:enquire', handleEnquireEvent);
  }, [isOpen, toggleChat]);

  const handleCopyNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(WHATSAPP_DISPLAY_NUMBER);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2500);
    }
  };

  const handleOptionClick = (key: string, url?: string) => {
    if (key === 'visit') {
      setIsSchedulingVisit(true);
      const userMsg: Message = {
        id: `user-opt-${Date.now()}`,
        sender: 'user',
        text: 'I would like to book a site visit walkthrough.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `bot-calendar-${Date.now()}`,
          sender: 'bot',
          text: 'Great! Please pick your preferred date and time slot for the inspection walkthrough below:',
          showDatePicker: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (key === 'store' && url) {
      window.open(url, '_blank');
    } else if (key === 'whatsapp' && url) {
      window.open(url, '_blank');
    } else if (key === 'question') {
      handleSendMessage('What are the legal approvals, payment schedule, and possession timeline for this property?');
    }
  };

  const handleConfirmVisitSchedule = async () => {
    if (!currentUser) {
      setShowInlineAuth(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-auth-req-${Date.now()}`,
          sender: 'bot',
          text: `To secure your visit pass for ${selectedVisitDate} (${selectedVisitSlot}), please log in or complete quick registration in the box below.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    executeBooking(selectedVisitDate, selectedVisitSlot, currentUser);
  };

  const executeBooking = async (date: string, slot: string, user: any) => {
    setIsLoading(true);
    setIsSchedulingVisit(false);
    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'book_visit',
          date,
          slot,
          propertyContext: activePropertyContext,
          buyerPhone: user.phone,
          buyerName: user.fullName,
        }),
      });
      const data = await res.json();
      if (data.booked && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-booked-${Date.now()}`,
            sender: 'bot',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: data.action,
          },
        ]);
        setShowInlineAuth(false);
      } else if (data.requireAuth) {
        setShowInlineAuth(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-book-err-${Date.now()}`,
          sender: 'bot',
          text: `We logged your visit request for ${date} at ${slot}. Please connect via WhatsApp Support at ${WHATSAPP_DISPLAY_NUMBER} to receive your direct pass.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: {
            type: 'whatsapp',
            label: `WhatsApp Support (${WHATSAPP_DISPLAY_NUMBER})`,
            url: `https://wa.me/${WHATSAPP_RAW_NUMBER}`,
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: authIdentifier,
            password: authPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || 'Authentication failed. Please verify credentials.');
          return;
        }
        setCurrentUser(data.user);
        setShowInlineAuth(false);
        executeBooking(selectedVisitDate, selectedVisitSlot, data.user);
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: authFullName,
            phone: authPhone,
            email: authEmail,
            password: authPassword,
            role: 'buyer',
            dpdpConsent: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || 'Registration failed. Please check your details.');
          return;
        }
        setCurrentUser(data.user);
        setShowInlineAuth(false);
        executeBooking(selectedVisitDate, selectedVisitSlot, data.user);
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          propertyContext: activePropertyContext,
        }),
      });
      const data = await res.json();

      if (data.requireAuth) {
        setShowInlineAuth(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-auth-${Date.now()}`,
            sender: 'bot',
            text: data.message || 'Please log in with your buyer credentials to continue.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: data.reply,
            options: data.options,
            showDatePicker: data.showDatePicker,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: data.action,
          },
        ]);
      } else {
        fallbackReply(query);
      }
    } catch {
      fallbackReply(query);
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackReply = (query: string) => {
    const q = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let text = `Our team is here to assist across Pan India. Connect directly on WhatsApp Support at ${WHATSAPP_DISPLAY_NUMBER}.`;
    let action: Message['action'] = {
      type: 'whatsapp',
      label: `Chat on WhatsApp (${WHATSAPP_DISPLAY_NUMBER})`,
      url: `https://wa.me/${WHATSAPP_RAW_NUMBER}?text=Hi%20BrokersBlitz`,
    };

    if (q.includes('visit') || q.includes('schedule')) {
      text = `Site visits can be confirmed directly via WhatsApp Support at ${WHATSAPP_DISPLAY_NUMBER}. Send your preferred date and time to lock your slot.`;
    } else if (q.includes('rera')) {
      text = 'RERA registration numbers on BrokersBlitz are self-reported by listing brokers. Please cross-verify on official state portals (e.g. MahaRERA, K-RERA) before executing contracts.';
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-fb-${Date.now()}`,
        sender: 'bot',
        text,
        time: timeStr,
        action,
      },
    ]);
  };

  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && !isWhatsAppModalOpen && (
        <div
          className="relative flex flex-col items-end gap-3"
          onMouseEnter={() => setIsSpeedDialOpen(true)}
          onMouseLeave={() => setIsSpeedDialOpen(false)}
        >
          {isSpeedDialOpen && (
            <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsWhatsAppModalOpen(true)}>
                <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1B17] text-[#1A1A1A] dark:text-white text-xs font-bold shadow-lg border border-[#1A1A1A]/10 dark:border-white/10 opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  WhatsApp Support
                </span>

                <button
                  type="button"
                  aria-label="Open WhatsApp Support"
                  className="w-12 h-12 rounded-full bg-gradient-to-b from-[#29eb71] to-[#20ba59] text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(37,211,102,0.5),0_8px_10px_-6px_rgba(37,211,102,0.3)] hover:brightness-105 hover:scale-110 active:scale-95 border border-white/20 transition-all duration-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </button>

              </div>

              <div
                className="flex items-center gap-2 group cursor-pointer"
                onClick={() => {
                  toggleChat();
                  setIsSpeedDialOpen(false);
                }}
              >
                <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1B17] text-[#1A1A1A] dark:text-white text-xs font-bold shadow-lg border border-[#1A1A1A]/10 dark:border-white/10 opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Chat Support
                </span>
                <button
                  type="button"
                  aria-label="Open AI Assistant"
                  className="w-12 h-12 rounded-full bg-[#DF6400] text-white flex items-center justify-center shadow-xl hover:bg-[#C75700] hover:scale-110 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            aria-expanded={isSpeedDialOpen}
            aria-label={isSpeedDialOpen ? "Close support menu" : "Open support menu"}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#DF6400] text-white shadow-[0_10px_25px_-5px_rgba(223,100,0,0.5),0_8px_10px_-6px_rgba(223,100,0,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(223,100,0,0.65)] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF6400] focus-visible:ring-offset-2 transition-all duration-300 ease-out group"
          >
            <Headphones
              className={`w-6 h-6 text-white transition-all duration-300 ease-out ${isSpeedDialOpen
                ? "rotate-90 scale-95"
                : "animate-bounce group-hover:animate-none group-hover:rotate-[-8deg] group-hover:scale-110"
                }`}
            />
          </button>

        </div>
      )}

      {isWhatsAppModalOpen && (
        <div className="w-[340px] sm:w-[380px] bg-white dark:bg-[#111B21] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#128C7E]/10 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#075E54] dark:bg-[#202C33] text-white p-4 flex items-center justify-between border-b border-black/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold tracking-tight text-white">BrokersBlitz WhatsApp</h3>
                <span className="text-[10px] text-[#25D366] font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-ping" />
                  Online • Replies in ~2 mins
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close WhatsApp card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-center bg-[#ECE5DD]/25 dark:bg-[#111B21]">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Scan with your phone to start chatting immediately
            </p>

            <div className="relative w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-md border border-black/5 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&margin=0&color=11-27-33&data=${encodeURIComponent(`whatsapp://send?phone=${WHATSAPP_RAW_NUMBER}&text=${encodeURIComponent('Hi BrokersBlitz, I am interested in Indian properties and would like assistance.')}`)}`}
                alt="Scan WhatsApp QR code"
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#25D366] to-[#128C7E] border-2 border-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 font-mono text-xs font-semibold tracking-wide">
              <span>{WHATSAPP_DISPLAY_NUMBER}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent('Hi BrokersBlitz, I am interested in Indian properties and would like assistance.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-xs hover:brightness-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(37,211,102,0.3)] transition-all"
              >
                <span>Open Web / App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyNumber}
                className="h-10 px-3 rounded-xl bg-white dark:bg-[#202C33] border border-black/10 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2A3942] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                {copiedNumber ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsWhatsAppModalOpen(false);
                if (!isOpen) toggleChat();
              }}
              className="w-full pt-1.5 text-center text-xs text-[#128C7E] dark:text-[#25D366] font-semibold hover:underline flex items-center justify-center gap-1 transition-colors"
            >
              <span>Need instant help? Consult our AI Property Advisor</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-[#1A1816] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#DF6400]/15 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-[#FFF8F3] via-white to-[#FFF3E8] dark:from-[#241F1A] dark:via-[#1E1B18] dark:to-[#2A231C] px-4 py-3.5 flex items-center justify-between border-b border-[#DF6400]/15 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#DF6400] to-[#f58428] shadow-md shadow-[#DF6400]/25 text-white">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#1E1B18]" />
                </span>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight text-[#1A1A1A] dark:text-white">BrokersBlitz Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#DF6400]/10 text-[#DF6400] text-[9px] font-black uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block mt-0.5">
                  Pan-India Advisory • Always Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  toggleChat();
                  setIsWhatsAppModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="Switch to WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#25D366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={toggleChat}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF8F5] dark:bg-[#12100E] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 max-w-[88%] leading-relaxed ${m.sender === 'user'
                    ? 'bg-gradient-to-r from-[#DF6400] to-[#E9741A] text-white font-medium rounded-2xl rounded-tr-sm shadow-sm'
                    : 'bg-white dark:bg-[#1E1B18] text-[#1A1A1A] dark:text-[#E9EDEF] border border-black/5 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-sm whitespace-pre-line'
                    }`}
                >
                  <p>{m.text}</p>

                  {m.options && m.options.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/10 space-y-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Recommended Actions:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {m.options.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleOptionClick(opt.key, opt.url)}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#282420] hover:bg-[#DF6400] hover:text-white text-[11px] font-bold text-center border border-black/5 dark:border-white/10 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 truncate group"
                          >
                            {opt.key === 'visit' && <Calendar className="w-3.5 h-3.5 text-[#DF6400] group-hover:text-white shrink-0" />}
                            {opt.key === 'store' && <Store className="w-3.5 h-3.5 text-blue-500 group-hover:text-white shrink-0" />}
                            {opt.key === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white shrink-0" />}
                            {opt.key === 'question' && <MessageSquare className="w-3.5 h-3.5 text-amber-500 group-hover:text-white shrink-0" />}
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.showDatePicker && (
                    <div className="mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/10 space-y-2.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300">
                          Select Walkthrough Date:
                        </label>
                        <input
                          type="date"
                          min={minBookingDate}
                          value={selectedVisitDate}
                          onChange={(e) => setSelectedVisitDate(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#282420] border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white font-mono outline-none focus:ring-2 focus:ring-[#DF6400]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300">
                          Preferred Inspection Slot:
                        </label>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            '10:30 AM - 12:00 PM (Morning Slot)',
                            '02:30 PM - 04:00 PM (Afternoon Slot)',
                            '04:30 PM - 06:00 PM (Evening Sunset Slot)',
                          ].map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedVisitSlot(slot)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold text-left transition-all border flex items-center gap-2 ${selectedVisitSlot === slot
                                ? 'bg-[#DF6400] text-white border-[#DF6400] shadow-sm'
                                : 'bg-gray-50 dark:bg-[#282420] text-[#1A1A1A] dark:text-white border-black/5 dark:border-white/10 hover:border-[#DF6400]'
                                }`}
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                              <span>{slot}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmVisitSchedule}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Walkthrough for {selectedVisitDate}</span>
                      </button>
                    </div>
                  )}

                  {m.action && (
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10">
                      <a
                        href={m.action.url}
                        target={m.action.type === 'whatsapp' ? '_blank' : '_self'}
                        rel={m.action.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition-all active:scale-95 ${m.action.type === 'whatsapp'
                          ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white hover:brightness-105'
                          : 'bg-gradient-to-r from-[#DF6400] to-[#E9741A] text-white hover:brightness-105 shadow-[#DF6400]/25'
                          }`}
                      >
                        {m.action.type === 'whatsapp' ? (
                          <MessageCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>{m.action.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1.5">{m.time}</span>
              </div>
            ))}

            {showInlineAuth && (
              <div className="bg-white dark:bg-[#1E1B18] border border-[#DF6400]/40 rounded-2xl p-3.5 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2 text-xs font-black text-[#1A1A1A] dark:text-white">
                    <div className="w-6 h-6 rounded-lg bg-[#DF6400]/15 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-[#DF6400]" />
                    </div>
                    <span>Buyer Authentication</span>
                  </div>
                  <button
                    onClick={() => setShowInlineAuth(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-[#151311] rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`py-1 rounded-lg transition-all ${authMode === 'login'
                      ? 'bg-[#DF6400] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`py-1 rounded-lg transition-all ${authMode === 'signup'
                      ? 'bg-[#DF6400] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                      }`}
                  >
                    Quick Sign Up
                  </button>
                </div>

                {authError && (
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-semibold flex items-center gap-1.5 border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleInlineAuthSubmit} className="space-y-2">
                  {authMode === 'login' ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                          Email or Mobile
                        </label>
                        <input
                          type="text"
                          required
                          value={authIdentifier}
                          onChange={(e) => setAuthIdentifier(e.target.value)}
                          placeholder="e.g. 9820144520 or buyer@example.com"
                          className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          placeholder="e.g. Aditya Sharma"
                          className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                            Mobile
                          </label>
                          <input
                            type="tel"
                            required
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="98XXXXXXXX"
                            className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="name@email.com"
                            className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 dark:bg-[#151311] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-[#DF6400] to-[#E9741A] text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm ${authLoading ? 'animate-pulse' : ''}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {authLoading
                        ? 'Verifying...'
                        : authMode === 'login'
                          ? 'Sign In & Lock Slot'
                          : 'Register & Lock Slot'}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#1E1B18] border border-black/5 dark:border-white/10 px-3.5 py-2.5 rounded-2xl rounded-tl-sm w-36 shadow-xs animate-pulse">
                <div className="w-2 h-2 rounded-full bg-[#DF6400] animate-pulse" />
                <div className="h-2 w-16 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-full animate-pulse" />
                <div className="h-2 w-6 bg-[#DF6400]/40 rounded-full animate-pulse" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 border-t border-black/5 dark:border-white/10 bg-white dark:bg-[#1A1816] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {[
              'Book Site Visit',
              'Commercial Offices',
              'Luxury Penthouses',
              'RERA Verification Hint',
              'List as Broker',
            ].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handleSendMessage(pill)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-gray-100 dark:bg-[#25221F] hover:bg-[#DF6400] hover:text-white dark:hover:bg-[#DF6400] text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/10 transition-all active:scale-95 shadow-2xs"
              >
                {pill}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#1A1816] border-t border-black/5 dark:border-white/10 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/20'
                : 'bg-gray-100 dark:bg-[#25221F] text-gray-500 dark:text-gray-400 hover:text-[#DF6400] border-black/5 dark:border-white/10'
                }`}
              title={isListening ? 'Listening... click to stop' : 'Click to talk'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Ask anything or schedule inspection..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-gray-100 dark:bg-[#25221F] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#DF6400] focus:bg-white dark:focus:bg-[#151311] outline-none transition-all"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#DF6400] to-[#E9741A] text-white hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 transition-all shadow-md shadow-[#DF6400]/25"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
