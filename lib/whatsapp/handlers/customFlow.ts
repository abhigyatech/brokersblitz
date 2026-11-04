import { sendButtonMessage, sendTextMessage } from '@/lib/whatsapp/meta-client';
import { updateSession, getOrCreateSession } from '@/lib/whatsapp/session-store';
import { getAllBrokers, getAllUsers, saveUsers, StoredUser, findUserByPhone } from '@/lib/auth/user-store';
import { getOrCreateWallet } from '@/lib/wallet/wallet-service';
import { formatDraftSummaryCard } from '../voice-to-listing';

export async function promptBrokerLogin(from: string, customNotice?: string): Promise<boolean> {
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);
  const existing = findUserByPhone(cleanPhone);

  if (existing && existing.role === 'broker') {
    updateSession(from, {
      role: 'broker',
      brokerId: existing.id,
      brokerCode: existing.storeCode || `wa-${cleanPhone}`,
      brokerName: existing.fullName,
      agencyName: existing.agencyName || 'Independent Broker Network',
    });
    return sendBrokerMainMenu(from, existing.fullName);
  }

  let text = `*BROKERSBLITZ BROKER PARTNER GATEWAY* 🏢\n------------------------------\n`;
  if (customNotice) {
    text += `${customNotice}\n------------------------------\n`;
  }
  text += `To list properties and receive direct buyer leads, connect your verified broker profile:\n\n`;
  text += `*1. Fast Login (Existing Broker):* 🔑\n`;
  text += `Reply with your Partner Code, Registered Mobile, or Email:\n`;
  text += `*LOGIN: <Code/Mobile>* (e.g. *LOGIN: APEX-PRIME* or *LOGIN: 9820144520*)\n\n`;
  text += `*2. New Broker Onboarding:* 📝\n`;
  text += `Reply in one line to register:\n`;
  text += `*REGISTER: <Your Name>, <Agency Name>, <Operating City>*\n`;
  text += `(e.g. *REGISTER: Sanjay Verma, Prime Advisory, Indore*)\n\n`;
  text += `*Partner Privileges:* 🌟\n`;
  text += `• 🎙️ Zero-Form Voice Listings (Send 30-sec audio notes)\n`;
  text += `• 🎁 First 5 property listings free for 15 days\n`;
  text += `• 📥 Direct WhatsApp buyer enquiries inbox`;

  return sendTextMessage(from, text);
}

export async function handleBrokerLoginOrRegistration(
  from: string,
  rawText: string,
  userName?: string
): Promise<boolean> {
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);
  const text = rawText.trim();

  const regMatch = text.match(new RegExp('REGISTER:\\s*(.+)', 'i'));
  if (regMatch) {
    const parts = regMatch[1].split(',').map((p) => p.trim());
    const brokerName = parts[0] || userName || 'Partner Broker';
    const agencyName = parts[1] || `${brokerName} Realty`;
    const operatingCity = parts[2] || 'Indore';
    const storeCode = agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') || `wa-${cleanPhone}`;

    const allUsers = getAllUsers();
    let user = allUsers.find((u) => u.phone.slice(-10) === cleanPhone);

    if (!user) {
      user = {
        id: `broker-wa-${Date.now()}`,
        fullName: brokerName,
        email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
        phone: cleanPhone,
        role: 'broker',
        passwordHash: 'whatsapp_verified',
        passwordSalt: 'salt',
        agencyName,
        storeCode,
        operatingCity,
        dpdpConsent: true,
        dpdpConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allUsers.push(user);
    } else {
      if (user.role !== 'admin') {
        user.role = 'broker';
        user.fullName = brokerName;
        user.agencyName = agencyName;
        user.operatingCity = operatingCity;
        user.storeCode = storeCode;
        user.updatedAt = new Date().toISOString();
      }
    }

    saveUsers(allUsers);

    updateSession(from, {
      role: 'broker',
      brokerId: user.id,
      brokerCode: user.storeCode,
      brokerName: user.fullName,
      agencyName: user.agencyName,
      currentStep: 'idle',
    });

    const wallet = getOrCreateWallet(user.id);

    const welcomeMsg = `*PARTNER BROKER REGISTRATION SUCCESSFUL!* 🎉\n------------------------------\n• 👤 *Broker Name:* ${user.fullName}\n• 🏢 *Agency:* ${user.agencyName}\n• 📍 *City:* ${user.operatingCity}\n• 🌐 *Partner Store:* brokersblitz.in/broker/${user.storeCode}\n• 💳 *Available Credits:* ${wallet.totalBalance} Credits\n• 🎁 *Promotional Offer:* First 5 property listings are 100% free for 15 days.\n------------------------------\nYou are now ready to list properties! Tap below or send a 30-sec audio voice note right now:`;

    await sendButtonMessage(from, welcomeMsg, [
      { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
      { id: 'broker_action_list', title: '📝 List Property' },
      { id: 'broker_action_leads', title: '📥 View Leads' },
    ]);
    return true;
  }

  const match = text.match(new RegExp('(?:BROKER|LOGIN):\\s*([A-Za-z0-9_@.-]+)', 'i'));
  if (!match) return false;

  const input = match[1].trim();
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanInputPhone = input.replace(/[^0-9]/g, '').slice(-10);

  const allBrokers = getAllBrokers();
  let matchedBroker = allBrokers.find((b) => {
    const sc = (b.storeCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const agency = (b.agencyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const bPhone = b.phone.replace(/[^0-9]/g, '').slice(-10);
    const email = b.email.toLowerCase();
    const id = b.id.toLowerCase();

    return (
      sc === normalized ||
      (cleanInputPhone.length === 10 && bPhone === cleanInputPhone) ||
      email === input.toLowerCase() ||
      id === normalized ||
      agency.includes(normalized)
    );
  });

  const allUsers = getAllUsers();

  if (!matchedBroker) {
    if (input.toUpperCase().startsWith('INDORE') || input.toUpperCase().startsWith('MUMBAI') || input.length >= 4) {
      let existing = allUsers.find((u) => u.phone.slice(-10) === cleanPhone);
      if (!existing) {
        existing = {
          id: `broker-wa-${Date.now()}`,
          fullName: userName || `Partner Broker (${input.toUpperCase()})`,
          email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
          phone: cleanPhone,
          role: 'broker',
          passwordHash: 'whatsapp_verified',
          passwordSalt: 'salt',
          agencyName: `Agency ${input.toUpperCase()}`,
          storeCode: input.toLowerCase(),
          operatingCity: input.toUpperCase().includes('MUMBAI') ? 'Mumbai' : 'Indore',
          dpdpConsent: true,
          dpdpConsentDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        allUsers.push(existing);
      } else {
        if (existing.role !== 'admin') {
          existing.role = 'broker';
          existing.storeCode = input.toLowerCase();
          existing.agencyName = existing.agencyName || `Agency ${input.toUpperCase()}`;
        }
      }
      saveUsers(allUsers);
      matchedBroker = existing;
    } else {
      await sendTextMessage(
        from,
        `No broker account found for "${input}".\n\nPlease check your partner code, mobile, or email and try again (e.g. *LOGIN: APEX-PRIME*), or reply *REGISTER: <Name>, <Agency>, <City>* to create a new profile.`
      );
      return true;
    }
  }

  if (matchedBroker) {
    matchedBroker.phone = cleanPhone;
    saveUsers(allUsers);
  }

  updateSession(from, {
    role: 'broker',
    brokerId: matchedBroker.id,
    brokerCode: matchedBroker.storeCode || matchedBroker.id,
    brokerName: matchedBroker.fullName,
    agencyName: matchedBroker.agencyName || 'Independent Broker Network',
    currentStep: 'idle',
  });

  const session = getOrCreateSession(from);
  const wallet = getOrCreateWallet(matchedBroker.id);

  if (session.draftListing && session.currentStep === 'voice_draft_confirm') {
    const summaryCard = formatDraftSummaryCard(session.draftListing, {
      name: matchedBroker.fullName,
      agency: matchedBroker.agencyName || 'BrokersBlitz Network',
      storeCode: matchedBroker.storeCode,
      rera: matchedBroker.reraNumber,
    });

    const authGreeting = `*BROKER LOGIN VERIFIED!* ✅\nWelcome back, *${matchedBroker.fullName}* (${matchedBroker.agencyName}).\n\nYour pending listing draft has been linked to your verified broker profile:\n\n${summaryCard}`;

    await sendButtonMessage(from, authGreeting, [
      { id: 'voice_pub_yes', title: '✅ Publish Listing' },
      { id: 'draft_edit_menu', title: '✏️ Edit Details' },
      { id: 'voice_pub_no', title: '❌ Discard Draft' },
    ]);
    return true;
  }

  const welcomeMessage = `*BROKER LOGIN VERIFIED!* ✅\n------------------------------\n• 👤 *Partner Name:* ${matchedBroker.fullName}\n• 🏢 *Agency:* ${matchedBroker.agencyName || 'BrokersBlitz Network'}\n• 🌐 *Store Code:* ${matchedBroker.storeCode || 'indore1001'}\n• 📜 *RERA:* ${matchedBroker.reraNumber || 'Verified Real Estate Advisor'}\n• 💳 *Wallet Balance:* ${wallet.totalBalance} Credits\n• 🎁 *Promotional Offer:* First 5 property listings free for 15 days.\n------------------------------\nYou are logged in! Send a 30-sec audio voice note to list a property in seconds, or choose an option below:`;

  await sendButtonMessage(from, welcomeMessage, [
    { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
    { id: 'broker_action_list', title: '📝 List Property' },
    { id: 'broker_action_leads', title: '📥 View Leads' },
  ]);

  return true;
}

export const handleBrokerRegistration = handleBrokerLoginOrRegistration;

export async function sendBrokerMainMenu(from: string, brokerName: string = 'Partner Broker'): Promise<boolean> {
  const session = getOrCreateSession(from);
  const brokerId = session.brokerId || `broker-wa-${from.replace(/[^0-9]/g, '').slice(-10)}`;
  const wallet = getOrCreateWallet(brokerId);

  const menuText = `*BROKERSBLITZ BROKER PORTAL* 🏢\nWelcome back, *${brokerName}*! 👋\n\n• 🏢 *Agency:* ${session.agencyName || 'BrokersBlitz Network'}\n• 💳 *Wallet Balance:* ${wallet.totalBalance} Listing Credits\n\nSend a 30-sec audio voice note to list any property instantly with Zero-Form entry, or choose an action:`;

  return sendButtonMessage(from, menuText, [
    { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
    { id: 'broker_action_list', title: '📝 List Property' },
    { id: 'broker_action_leads', title: '📥 View Leads' },
  ]);
}
