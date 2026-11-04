'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  X,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WalletTransaction {
  id: string;
  brokerId: string;
  type:
    | 'RECHARGE'
    | 'FREE_CREDIT_GRANT'
    | 'PROMOTIONAL_CREDIT'
    | 'LISTING_ACTIVE_CHARGE'
    | 'LISTING_BOOST'
    | 'LEAD_UNLOCK'
    | 'DEBIT_LISTING'
    | 'DEBIT_FEATURE'
    | 'DEBIT_LEAD'
    | 'EXPIRY'
    | 'REFUND'
    | string;
  amount: number;
  paidDelta: number;
  freeDelta: number;
  balanceAfter: number;
  paidBalanceAfter: number;
  freeBalanceAfter: number;
  description: string;
  referenceId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  checksum: string;
}

interface PromotionalGrant {
  id: string;
  amount: number;
  remainingAmount: number;
  grantedAt: string;
  expiresAt: string;
  reason: string;
}

interface BrokerWalletData {
  brokerId: string;
  brokerName: string;
  paidBalance: number;
  freeBalance: number;
  totalBalance: number;
  promotionalGrants: PromotionalGrant[];
}

interface StatementData {
  brokerId: string;
  brokerName: string;
  openingBalance: number;
  closingBalance: number;
  paidBalance: number;
  freeBalance: number;
  totalCredits: number;
  activePromotionalGrants: PromotionalGrant[];
  nearestExpiringGrant: PromotionalGrant | null;
  generatedAt: string;
  transactions: WalletTransaction[];
}

interface BrokerWalletViewProps {
  brokerId: string;
  brokerName: string;
  onToast: (msg: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BrokerWalletView({ brokerId, brokerName, onToast }: BrokerWalletViewProps) {
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('pack_growth');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const packs = [
    { id: 'pack_starter', name: 'Starter Pack', amount: 500, credits: 500, bonus: 0, popular: false },
    { id: 'pack_growth', name: 'Growth Booster', amount: 1000, credits: 1100, bonus: 100, popular: true },
    { id: 'pack_pro', name: 'Pro Broker', amount: 2500, credits: 2800, bonus: 300, popular: false },
    { id: 'pack_elite', name: 'Elite Enterprise', amount: 5000, credits: 6000, bonus: 1000, popular: false },
  ];

  const fetchStatement = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/wallet/statement');
      const data = await res.json();
      if (data.success && data.statement) {
        setStatement(data.statement);
      }
    } catch {
      onToast('Failed to load wallet statement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  const handleInitiateRecharge = async () => {
    try {
      setModalError(null);
      setIsProcessingPayment(true);

      let payload: { packId?: string; customAmount?: number } = {};
      if (selectedPackId === 'custom') {
        const parsed = parseInt(customAmount, 10);
        if (isNaN(parsed) || parsed < 1) {
          const err = 'Please enter an amount of at least ₹1';
          setModalError(err);
          onToast(err);
          setIsProcessingPayment(false);
          return;
        }
        payload = { customAmount: parsed };
      } else {
        payload = { packId: selectedPackId };
      }

      const orderRes = await fetch('/api/wallet/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Order creation failed');
      }

      const keyId = orderData.keyId;
      const orderId = orderData.order?.id || orderData.orderId;
      const amountInPaise = orderData.order?.amount || orderData.amountInPaise;
      const currency = orderData.order?.currency || orderData.currency || 'INR';
      const isMock = orderData.order?.isMock ?? orderData.isMock;
      const pack = orderData.pack;

      if (isMock || (keyId && keyId.includes('Mock'))) {
        const verifyRes = await fetch('/api/wallet/recharge/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_sig_valid',
            packId: payload.packId,
            customAmount: payload.customAmount,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          onToast(verifyData.message || 'Recharge successful!');
          setIsRechargeModalOpen(false);
          fetchStatement();
        } else {
          throw new Error(verifyData.error || 'Payment verification failed');
        }
        setIsProcessingPayment(false);
        return;
      }

      const hasScript = await loadRazorpayScript();
      if (!hasScript || !window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
      }

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency,
        name: 'Brokers Blitz',
        description: `Wallet Credit Recharge - ${pack?.name || 'Credits'}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/wallet/recharge/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packId: payload.packId,
                customAmount: payload.customAmount,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onToast(verifyData.message || 'Recharge successful!');
              setIsRechargeModalOpen(false);
              fetchStatement();
            } else {
              setModalError(verifyData.error || 'Verification failed');
              onToast(verifyData.error || 'Verification failed');
            }
          } catch {
            const err = 'Network error during payment verification';
            setModalError(err);
            onToast(err);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: brokerName,
        },
        theme: {
          color: '#DF6400',
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setIsProcessingPayment(false);
        const err = `Payment Failed: ${response.error?.description || 'Transaction declined'}`;
        setModalError(err);
        onToast(err);
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setModalError(err.message || 'Payment initiation failed');
      onToast(err.message || 'Payment initiation failed');
    }
  };

  const handleExportCSV = () => {
    if (!statement || !statement.transactions.length) {
      onToast('No transactions to export');
      return;
    }

    const headers = ['Transaction ID', 'Date & Time', 'Type', 'Description', 'Amount', 'Balance After', 'Status', 'Reference ID'];
    const rows = statement.transactions.map((tx) => [
      `"${tx.id}"`,
      `"${new Date(tx.createdAt).toLocaleString('en-IN')}"`,
      `"${tx.type}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.amount > 0 ? '+' : ''}${tx.amount}"`,
      `"${tx.balanceAfter}"`,
      `"${tx.status}"`,
      `"${tx.referenceId || tx.razorpayPaymentId || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brokers_blitz_wallet_statement_${brokerId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Statement downloaded as CSV');
  };

  const filteredTransactions = (statement?.transactions || []).filter((tx) => {
    if (filterType !== 'all') {
      if (filterType === 'recharge' && tx.type !== 'RECHARGE') return false;
      if (filterType === 'promotional' && tx.type !== 'FREE_CREDIT_GRANT' && (tx.type as string) !== 'PROMOTIONAL_CREDIT') return false;
      if (filterType === 'debit' && (tx.amount >= 0 || tx.type === 'EXPIRY')) return false;
      if (filterType === 'expiry' && tx.type !== 'EXPIRY') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const nearestExpiryDays = statement?.nearestExpiringGrant
    ? Math.max(0, Math.ceil((new Date(statement.nearestExpiringGrant.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
            Broker Credits & Wallet
          </h2>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
            Manage your listing credits, promotional grants, Razorpay recharges, and compliant double-entry ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStatement}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] text-[#1A1A1A] dark:text-white transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] text-xs font-bold text-[#1A1A1A] dark:text-white transition-colors"
          >
            <Download className="w-4 h-4 text-[#DF6400]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRechargeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-black shadow-md shadow-[#DF6400]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Credits</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#DF6400]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Total Credits</span>
            <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white">
            {statement ? statement.totalCredits.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Available for listings and features
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Paid Credits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {statement ? statement.paidBalance.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Purchased via Razorpay • Never expires
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Promotional Credits</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {statement ? statement.freeBalance.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Admin goodwill & rewards • Expiring
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Next Expiry Alert</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          {statement?.nearestExpiringGrant ? (
            <div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {statement.nearestExpiringGrant.remainingAmount} <span className="text-xs font-bold">Credits</span>
              </div>
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                Expires in {nearestExpiryDays} day{nearestExpiryDays === 1 ? '' : 's'} ({new Date(statement.nearestExpiringGrant.expiresAt).toLocaleDateString('en-IN')})
              </p>
            </div>
          ) : (
            <div>
              <div className="text-base sm:text-lg font-bold text-[#5C5852] dark:text-[#A8A29A]">
                No Expiry Pending
              </div>
              <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
                All credits currently active
              </p>
            </div>
          )}
        </div>
      </div>

      {nearestExpiryDays !== null && nearestExpiryDays <= 7 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Promotional Credits Expiring Soon: </span>
              {statement?.nearestExpiringGrant?.remainingAmount} free credits will expire on{' '}
              {new Date(statement!.nearestExpiringGrant!.expiresAt).toLocaleDateString('en-IN')}. Utilize them for new listings before expiry!
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">
              Wallet Passbook & Transaction History
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
              Complete record of all your credit recharges, bonus grants, and daily listing charges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5852]" />
              <input
                type="text"
                placeholder="Search passbook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] w-40 sm:w-52"
              />
            </div>

            <div className="flex items-center bg-[#F4F0EA] dark:bg-[#141210] p-1 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 text-[11px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'recharge', label: 'Recharges' },
                { id: 'promotional', label: 'Bonus Credits' },
                { id: 'debit', label: 'Deductions' },
                { id: 'expiry', label: 'Expiries' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === tab.id
                      ? 'bg-white dark:bg-[#1E1B17] text-[#DF6400] shadow-xs'
                      : 'text-[#5C5852] dark:text-[#A8A29A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] dark:text-[#A8A29A] font-mono text-[10px] uppercase">
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Details / Reference</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Balance After</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5C5852] dark:text-[#A8A29A]">
                    No transactions found in this view.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.amount > 0;
                  const typeLabel =
                    tx.type === 'RECHARGE'
                      ? 'Recharge'
                      : tx.type === 'FREE_CREDIT_GRANT' || (tx.type as string) === 'PROMOTIONAL_CREDIT'
                      ? 'Bonus Credit'
                      : tx.type === 'LISTING_ACTIVE_CHARGE'
                      ? 'Listing Fee (2/day)'
                      : tx.type === 'LISTING_BOOST'
                      ? 'Spotlight Boost'
                      : tx.type === 'LEAD_UNLOCK'
                      ? 'Lead Unlock'
                      : tx.type === 'EXPIRY'
                      ? 'Credit Expired'
                      : 'Deduction';

                  return (
                    <tr key={tx.id} className="hover:bg-[#F4F0EA]/50 dark:hover:bg-[#141210]/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#5C5852] dark:text-[#A8A29A] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            tx.type === 'RECHARGE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'FREE_CREDIT_GRANT' || (tx.type as string) === 'PROMOTIONAL_CREDIT'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : tx.type === 'EXPIRY'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-orange-500/10 text-[#DF6400]'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {typeLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1A1A1A] dark:text-white line-clamp-1">{tx.description}</div>
                        {(tx.referenceId || tx.razorpayPaymentId) && (
                          <div className="text-[10px] font-mono text-[#5C5852] dark:text-[#A8A29A]">
                            Ref: {tx.referenceId || tx.razorpayPaymentId}
                          </div>
                        )}
                      </td>

                      <td className={`py-3 px-3 text-right font-black font-mono whitespace-nowrap ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1A1A1A] dark:text-white'
                      }`}>
                        {isCredit ? `+${tx.amount}` : tx.amount}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {tx.balanceAfter}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isRechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/15 dark:border-white/15 shadow-2xl p-5 sm:p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Recharge Wallet Credits</h3>
                  <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">Instant credit activation via Razorpay</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsRechargeModalOpen(false);
                  setModalError(null);
                }}
                className="p-1 rounded-lg text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
                Select Credit Pack
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packs.map((pack) => {
                  const isSelected = selectedPackId === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackId(pack.id);
                        setCustomAmount('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-[#DF6400] bg-[#DF6400]/5 ring-1 ring-[#DF6400]'
                          : 'border-[#1A1A1A]/10 dark:border-white/10 bg-[#F4F0EA]/50 dark:bg-[#141210]/50 hover:border-[#DF6400]/50'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-[#DF6400] text-white text-[9px] font-black uppercase">
                          Popular
                        </span>
                      )}
                      <div className="text-xs font-black text-[#1A1A1A] dark:text-white">{pack.name}</div>
                      <div className="text-lg font-black text-[#DF6400] mt-1">₹{pack.amount.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] font-bold text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
                        {pack.credits.toLocaleString('en-IN')} Credits
                        {pack.bonus > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                            (+{pack.bonus} free)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPackId('custom')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                    selectedPackId === 'custom'
                      ? 'border-[#DF6400] bg-[#DF6400]/5 ring-1 ring-[#DF6400]'
                      : 'border-[#1A1A1A]/10 dark:border-white/10 bg-[#F4F0EA]/50 dark:bg-[#141210]/50 hover:border-[#DF6400]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-[#1A1A1A] dark:text-white">Custom Recharge Amount</div>
                      <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">₹1 = 1 Non-expiring Credit (Min ₹1)</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#DF6400]">Flexible</span>
                  </div>

                  {selectedPackId === 'custom' && (
                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C5852]">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 50"
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setModalError(null);
                          }}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <Zap className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <span>
                Recharged credits are non-expiring and can be used immediately across all property listings and store promotions.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1A1A1A]/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsRechargeModalOpen(false);
                  setModalError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleInitiateRecharge}
                className="px-5 py-2.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-black shadow-md shadow-[#DF6400]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

