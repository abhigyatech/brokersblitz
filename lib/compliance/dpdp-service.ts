import crypto from 'crypto';
import { query } from '../db/postgres';
import { findUserById, eraseUserPersonalData } from '../auth/user-store';
import { getPropertiesByBroker } from '../db/properties-store';
import { getWalletStatement } from '../wallet/wallet-service';
import { getAllReferrals } from '../referral/referral-service';

export interface ComplianceAuditLog {
  id: string;
  userIdHash: string;
  action: 'DATA_EXPORT' | 'CONSENT_WITHDRAWAL' | 'DATA_ERASURE';
  regulation: 'DPDP_ACT_2023_INDIA' | 'GDPR_ARTICLE_17';
  status: 'COMPLETED' | 'REJECTED';
  timestamp: string;
  details: string;
}

async function logComplianceAction(
  userId: string,
  action: 'DATA_EXPORT' | 'CONSENT_WITHDRAWAL' | 'DATA_ERASURE',
  details: string
): Promise<void> {
  const userIdHash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 16);
  const auditId = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  try {
    await query(
      `INSERT INTO public.compliance_audit_logs (
        id, user_id_hash, action, regulation, status, timestamp, details
      ) VALUES ($1, $2, $3, 'DPDP_ACT_2023_INDIA', 'COMPLETED', now(), $4)`,
      [auditId, userIdHash, action, details]
    );
  } catch {}
}

export async function generateDataPrincipalExport(userId: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, error: 'User profile not found.' };
  }

  const userProperties = await getPropertiesByBroker(userId);
  const walletStatement = await getWalletStatement(userId);
  const allReferrals = await getAllReferrals();
  const userReferrals = allReferrals.filter(
    (r) => r.referrerId === userId || r.refereeId === userId
  );

  const exportPayload = {
    complianceNotice: {
      framework: 'Digital Personal Data Protection Act, 2023 (DPDP Act) & GDPR Principles',
      dataFiduciary: 'BrokersBlitz Technologies Pvt. Ltd.',
      purpose: 'Right to Access & Data Portability (Section 11, DPDP Act 2023)',
      exportTimestamp: new Date().toISOString(),
      dataPrincipalIdHash: crypto.createHash('sha256').update(userId).digest('hex'),
    },
    personalProfile: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      agencyName: user.agencyName || null,
      reraNumber: user.reraNumber || null,
      operatingCity: user.operatingCity || null,
      dpdpConsentStatus: user.dpdpConsent ? 'ACTIVE' : 'WITHDRAWN',
      consentTimestamp: user.dpdpConsentDate,
      accountCreated: user.createdAt,
    },
    propertyListings: userProperties.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      purpose: p.purpose,
      price: p.price,
      locality: p.locality,
      city: p.city,
      status: p.status,
      createdAt: p.createdAt,
    })),
    walletAndLedger: {
      currentBalance: walletStatement.wallet.totalBalance,
      paidBalance: walletStatement.wallet.paidBalance,
      promotionalBonusBalance: walletStatement.wallet.freeBalance,
      transactions: walletStatement.ledger.map((t) => ({
        referenceId: t.referenceId,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        description: t.description,
        timestamp: t.createdAt,
      })),
      activePromotionalGrants: walletStatement.activeGrants.map((g) => ({
        grantId: g.id,
        initialAmount: g.initialAmount,
        remainingAmount: g.remainingAmount,
        expiresAt: g.expiresAt,
        status: g.status,
      })),
    },
    referralProgram: {
      referralCode: user.referralCode || null,
      participatedRecords: userReferrals.map((r) => ({
        referralId: r.id,
        role: r.referrerId === userId ? 'INVITER' : 'INVITED_MEMBER',
        creditsAwarded: r.referrerId === userId ? r.referrerCredits : r.refereeCredits,
        status: r.status,
        timestamp: r.createdAt,
      })),
    },
  };

  await logComplianceAction(userId, 'DATA_EXPORT', 'Data Principal downloaded full personal data archive');

  return { success: true, data: exportPayload };
}

export async function executeDataPrincipalErasure(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, error: 'User profile not found.' };
  }

  if (user.role === 'admin') {
    return { success: false, error: 'Administrator accounts cannot be erased via self-service.' };
  }

  const res = await eraseUserPersonalData(userId);
  if (!res.success) {
    return res;
  }

  await logComplianceAction(
    userId,
    'DATA_ERASURE',
    'Personal data erased in accordance with Section 12 of the DPDP Act 2023 and GDPR Article 17'
  );

  return { success: true };
}
