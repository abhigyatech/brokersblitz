import { NextRequest, NextResponse } from 'next/server';
import {
  sendTextMessage,
  sendButtonMessage,
  downloadMedia,
  markMessageAsRead,
} from '@/lib/whatsapp/meta-client';
import {
  getOrCreateSession,
  updateSession,
  setSessionStep,
  resetDraftListing,
  isMessageProcessed,
  markMessageProcessed,
} from '@/lib/whatsapp/session-store';
import {
  transcribeAudioWithWhisper,
  extractPropertyFromVoiceTranscript,
  formatDraftSummaryCard,
  applyCorrectionToDraft,
} from '@/lib/whatsapp/voice-to-listing';
import {
  handleBrokerLoginOrRegistration,
  promptBrokerLogin,
  sendBrokerMainMenu,
} from '@/lib/whatsapp/handlers/customFlow';
import { handleListingFlow } from '@/lib/whatsapp/handlers/defaultFlow/list';
import { executeListingPublish } from '@/lib/whatsapp/handlers/defaultFlow/list/step6Confirmation';
import { handleBuyerInquiry } from '@/lib/whatsapp/handlers/buyerFlow';
import { getLeadsByBroker } from '@/lib/db/leads-store';
import { getPropertiesByBroker } from '@/lib/db/properties-store';
import { getOrCreateWallet } from '@/lib/wallet/wallet-service';
import { findUserById, findUserByPhone } from '@/lib/auth/user-store';

function getBrokerInfo(session: any, from: string) {
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);
  const user = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);
  if (user && user.role === 'broker') {
    return {
      name: user.fullName,
      agency: user.agencyName || 'BrokersBlitz Network',
      storeCode: user.storeCode,
      rera: user.reraNumber,
    };
  }
  if (session.brokerName) {
    return {
      name: session.brokerName,
      agency: session.agencyName || 'BrokersBlitz Network',
      storeCode: session.brokerCode,
    };
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'brokersblitz_secret_verify_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored_no_message' }, { status: 200 });
    }

    const from = message.from;
    const messageId = message.id;
    const messageType = message.type;
    const userName = contact?.profile?.name || 'User';

    if (messageId && isMessageProcessed(messageId)) {
      return NextResponse.json({ status: 'ignored_duplicate', messageId }, { status: 200 });
    }
    if (messageId) {
      markMessageProcessed(messageId);
    }

    markMessageAsRead(messageId).catch(() => {});

    let textBody = '';
    let interactiveButtonId = '';
    let interactiveListId = '';

    if (messageType === 'text') {
      textBody = message.text?.body || '';
    } else if (messageType === 'interactive') {
      interactiveButtonId = message.interactive?.button_reply?.id || '';
      interactiveListId = message.interactive?.list_reply?.id || '';
      textBody = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
    }

    const actionId = interactiveButtonId || interactiveListId;
    const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);

    console.log(`[WhatsApp Inbound] From: ${from} (${userName}) | Type: ${messageType} | Text: "${textBody}" | ActionId: "${actionId}"`);

    const session = getOrCreateSession(from, userName);

    if (session.role !== 'broker') {
      const existingUser = findUserByPhone(cleanPhone);
      if (existingUser && existingUser.role === 'broker') {
        updateSession(from, {
          role: 'broker',
          brokerId: existingUser.id,
          brokerCode: existingUser.storeCode || `wa-${cleanPhone}`,
          brokerName: existingUser.fullName,
          agencyName: existingUser.agencyName || 'Independent Broker Network',
        });
      }
    }

    if (messageType === 'audio' || messageType === 'voice') {
      const mediaId = message.audio?.id || message.voice?.id;
      const mimeType = message.audio?.mime_type || message.voice?.mime_type || 'audio/ogg';

      await sendTextMessage(from, '🎙️ Processing your audio voice note via BrokersBlitz AI engine...');

      let transcript = '';
      if (mediaId) {
        const media = await downloadMedia(mediaId);
        if (media && media.buffer) {
          const transcribed = await transcribeAudioWithWhisper(media.buffer, mimeType);
          if (transcribed) {
            transcript = transcribed;
          }
        }
      }

      if (!transcript) {
        await sendButtonMessage(
          from,
          `⚠️ *AUDIO NOT CLEAR / TRANSCRIPTION FAILED*\n------------------------------\nWe couldn't clearly capture your audio recording. This can happen with loud background noise or weak microphone input.\n\nPlease choose an option:`,
          [
            { id: 'broker_action_voice', title: '🎙️ Try Voice Note' },
            { id: 'broker_action_list', title: '📝 Guided Listing' },
            { id: 'buyer_action_restart', title: '🔍 Search Catalog' },
          ]
        );
        return NextResponse.json({ success: false, reason: 'transcription_failed' }, { status: 200 });
      }

      const brokerUser = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);
      const brokerCity = brokerUser?.operatingCity || (session.agencyName?.includes('Mumbai') ? 'Mumbai' : 'Indore');

      const extractedDraft = await extractPropertyFromVoiceTranscript(transcript, brokerCity);

      updateSession(from, {
        currentStep: 'voice_draft_confirm',
        draftListing: extractedDraft,
      });

      const brokerInfo = getBrokerInfo(session, from);
      const summaryCard = formatDraftSummaryCard(extractedDraft, brokerInfo);

      if (session.role === 'broker' || brokerUser) {
        await sendButtonMessage(from, summaryCard, [
          { id: 'voice_pub_yes', title: '✅ Publish Listing' },
          { id: 'draft_edit_menu', title: '✏️ Edit Details' },
          { id: 'voice_pub_no', title: '❌ Discard Draft' },
        ]);
      } else {
        const unauthPrompt = `${summaryCard}\n\n🔐 *BROKER LOGIN REQUIRED TO PUBLISH*\nTo broadcast this listing, please link your broker account:\n• Reply *LOGIN: <BrokerCode>* (e.g. *LOGIN: INDORE1001*)\n• Or reply *LOGIN: <RegisteredMobile>*\n• Or reply *REGISTER: <Name>, <Agency>, <City>*`;
        await sendButtonMessage(from, unauthPrompt, [
          { id: 'broker_action_login', title: '🔐 Broker Login' },
          { id: 'draft_edit_menu', title: '✏️ Edit Details' },
          { id: 'voice_pub_no', title: '❌ Discard Draft' },
        ]);
      }

      return NextResponse.json({ success: true, action: 'voice_processed' }, { status: 200 });
    }

    if (actionId === 'draft_edit_menu') {
      await sendButtonMessage(
        from,
        `✏️ *WHAT WOULD YOU LIKE TO CORRECT?*\n------------------------------\nTap a field below or reply directly with your correction (e.g. "Price 50 lakh" or "3 BHK"):`,
        [
          { id: 'edit_field_price', title: '💰 Edit Price' },
          { id: 'edit_field_bhk', title: '🛋️ Edit BHK' },
          { id: 'edit_field_locality', title: '📍 Edit Locality' },
        ]
      );
      return NextResponse.json({ success: true, action: 'edit_menu' }, { status: 200 });
    }

    if (actionId === 'edit_field_price') {
      setSessionStep(from, 'edit_draft_price');
      await sendTextMessage(
        from,
        `💰 *EDIT ASKING PRICE*\nPlease reply with the revised asking price in Lakhs or Crores:\n(e.g., "50 Lakhs" or "1.2 Crore" or "25,000 rent")`
      );
      return NextResponse.json({ success: true, action: 'edit_price_prompt' }, { status: 200 });
    }

    if (actionId === 'edit_field_bhk') {
      setSessionStep(from, 'edit_draft_bhk');
      await sendButtonMessage(
        from,
        `🛋️ *EDIT CONFIGURATION*\nSelect the correct BHK configuration for this property:`,
        [
          { id: 'edit_bhk_1', title: '1 BHK 🚪' },
          { id: 'edit_bhk_2', title: '2 BHK 🚪' },
          { id: 'edit_bhk_3', title: '3 BHK 🚪' },
        ]
      );
      return NextResponse.json({ success: true, action: 'edit_bhk_prompt' }, { status: 200 });
    }

    if (actionId === 'edit_field_locality') {
      setSessionStep(from, 'edit_draft_locality');
      await sendTextMessage(
        from,
        `📍 *EDIT LOCALITY*\nPlease reply with the exact locality, colony, or landmark (e.g., "Scheme 78" or "Vijay Nagar"):`
      );
      return NextResponse.json({ success: true, action: 'edit_locality_prompt' }, { status: 200 });
    }

    if (
      session.draftListing &&
      (session.currentStep === 'edit_draft_price' ||
        session.currentStep === 'edit_draft_bhk' ||
        session.currentStep === 'edit_draft_locality' ||
        session.currentStep === 'voice_draft_confirm' ||
        session.currentStep === 'step6_confirm') &&
      (textBody || actionId.startsWith('edit_bhk_'))
    ) {
      const input = actionId.startsWith('edit_bhk_')
        ? `${actionId.replace('edit_bhk_', '')} BHK`
        : textBody;

      const correction = applyCorrectionToDraft(session.draftListing, input);
      if (correction.updated) {
        updateSession(from, {
          currentStep: 'voice_draft_confirm',
          draftListing: correction.draft,
        });

        const brokerInfo = getBrokerInfo(session, from);
        const updatedCard = formatDraftSummaryCard(correction.draft, brokerInfo);

        await sendButtonMessage(
          from,
          `✅ *${correction.fieldName?.toUpperCase()} UPDATED SUCCESSFULLY!*\n------------------------------\n${updatedCard}`,
          [
            { id: 'voice_pub_yes', title: '✅ Publish Listing' },
            { id: 'draft_edit_menu', title: '✏️ Edit Details' },
            { id: 'voice_pub_no', title: '❌ Discard Draft' },
          ]
        );
        return NextResponse.json({ success: true, action: 'draft_corrected' }, { status: 200 });
      }
    }

    if (actionId === 'voice_pub_yes' || actionId === 'list_pub_yes') {
      if (session.draftListing) {
        if (session.role !== 'broker') {
          await promptBrokerLogin(
            from,
            'Your property draft is saved! Please verify your broker account to broadcast this listing to buyers:'
          );
          return NextResponse.json({ success: true, action: 'login_prompted' }, { status: 200 });
        }
        await executeListingPublish(from, session.draftListing, userName);
      } else {
        await sendTextMessage(from, 'No active listing draft found. Send a fresh voice note or type "LIST" anytime!');
      }
      return NextResponse.json({ success: true, action: 'voice_published' }, { status: 200 });
    }

    if (actionId === 'voice_pub_no' || actionId === 'list_pub_no') {
      resetDraftListing(from);
      await sendTextMessage(from, '❌ Listing draft discarded. Send another voice note or type "LIST" whenever you are ready.');
      return NextResponse.json({ success: true, action: 'voice_discarded' }, { status: 200 });
    }

    if (new RegExp('(?:BROKER|LOGIN|REGISTER):\\s*', 'i').test(textBody)) {
      await handleBrokerLoginOrRegistration(from, textBody, userName);
      return NextResponse.json({ success: true, action: 'broker_auth_processed' }, { status: 200 });
    }

    if (actionId === 'broker_action_login') {
      await promptBrokerLogin(from);
      return NextResponse.json({ success: true, action: 'broker_login_prompted' }, { status: 200 });
    }

    if (actionId === 'broker_action_voice') {
      const voiceInstructions = `🎙️ *VOICE-TO-LISTING (Zero-Form Entry)*\n\nNo need to fill any 20-field forms! Just send a raw 30-second audio voice note right now describing your property.\n\n*Example:* Speak naturally in Hindi, Hinglish or English:\n_"Bhai scheme 78 me second floor pe 3BHK flat hai, 1500 sq ft, demand 50 lakh negotiable, lift aur car parking hai, urgent bechna hai."_\n\nGo ahead, tap the mic icon below and record your property details! 🎙️`;
      await sendTextMessage(from, voiceInstructions);
      return NextResponse.json({ success: true, action: 'voice_instructions' }, { status: 200 });
    }

    if (actionId === 'broker_action_leads') {
      const brokerCode = session.brokerCode || session.agencyName || '';
      const leads = getLeadsByBroker(brokerCode);

      if (leads.length === 0) {
        await sendTextMessage(
          from,
          `📥 *LEADS INBOX*\nNo pending enquiries right now for *${session.agencyName || session.brokerName}*.\n\nNew verified buyer leads from your listings will appear here instantly with direct WhatsApp connect buttons!`
        );
      } else {
        let leadsMsg = `📥 *YOUR ACTIVE BUYER LEADS (${leads.length})*\n------------------------------\n`;
        leads.slice(0, 5).forEach((ld: any, i: number) => {
          leadsMsg += `${i + 1}. *${ld.buyerName}* (${ld.buyerPhone})\n   • *Property:* ${ld.propertyTitle}\n   • *Status:* ${ld.status.toUpperCase()}\n   • *Note:* ${ld.message || 'Direct site visit request'}\n\n`;
        });
        await sendTextMessage(from, leadsMsg);
      }
      return NextResponse.json({ success: true, action: 'leads_viewed' }, { status: 200 });
    }

    if (
      actionId.startsWith('list_') ||
      actionId.startsWith('bhk_') ||
      actionId.startsWith('city_') ||
      actionId.startsWith('sub_') ||
      actionId === 'broker_action_list' ||
      session.currentStep === 'step4_locality' ||
      session.currentStep === 'step5_price' ||
      session.currentStep === 'step6_confirm' ||
      /^list(\s+property)?$/i.test(textBody.trim())
    ) {
      const handled = await handleListingFlow({
        from,
        id: messageId,
        timestamp: message.timestamp,
        type: messageType,
        text: textBody,
        interactiveButtonId,
        interactiveListId,
        userName,
      });

      if (handled) {
        return NextResponse.json({ success: true, action: 'listing_flow' }, { status: 200 });
      }
    }

    if (
      actionId.startsWith('buyer_') ||
      session.currentStep.startsWith('buyer_') ||
      session.currentStep === 'booking_visit'
    ) {
      await handleBuyerInquiry(from, textBody, userName, actionId);
      return NextResponse.json({ success: true, action: 'buyer_action' }, { status: 200 });
    }

    if (
      session.role === 'broker' &&
      /(inventory|my properties|my listings|all listings)/i.test(textBody.trim())
    ) {
      const brokerCode = session.brokerCode || session.agencyName || session.brokerName || '';
      const props = getPropertiesByBroker(brokerCode);

      if (props.length === 0) {
        await sendButtonMessage(
          from,
          `🏠 *YOUR INVENTORY (0 Listings)*\n------------------------------\nYou don't have any published properties yet.\n\nSend a 30-sec audio voice note right now or tap below to list your first property for free!`,
          [
            { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
            { id: 'broker_action_list', title: '📝 List Property' },
          ]
        );
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brokersblitz.in';
        let invMsg = `🏠 *YOUR ACTIVE INVENTORY (${props.length} Properties)*\n------------------------------\n`;
        props.slice(0, 4).forEach((p, idx) => {
          invMsg += `${idx + 1}. *${p.title}*\n   • *Price:* ${p.formattedPrice}\n   • *Status:* ${(p.status || 'active').toUpperCase()}\n   • *Views:* ${p.viewsCount} | *Enquiries:* ${p.leadsCount}\n   • *Link:* ${baseUrl}/property/${p.slug}\n\n`;
        });
        invMsg += `Send another voice note anytime to add more inventory!`;
        await sendButtonMessage(from, invMsg, [
          { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
          { id: 'broker_action_leads', title: '📥 View Leads' },
        ]);
      }
      return NextResponse.json({ success: true, action: 'inventory_viewed' }, { status: 200 });
    }

    if (
      session.role === 'broker' &&
      /(wallet|credits|credit|balance|passbook)/i.test(textBody.trim())
    ) {
      const brokerId = session.brokerId || `broker-wa-${cleanPhone}`;
      const wallet = getOrCreateWallet(brokerId);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brokersblitz.in';

      const walletMsg = `💳 *YOUR WALLET & CREDIT BALANCE*\n------------------------------\n• *Total Available Balance:* ${wallet.totalBalance} Credits\n• *Paid Credits:* ${wallet.paidBalance} (Never expires)\n• *Bonus Credits:* ${wallet.freeBalance} (Platform grants)\n------------------------------\n• *Listing Policy:* First 5 listings are free for 15 days. Afterwards, active listings cost 2 credits/day.\n• *Passbook & Recharge:* ${baseUrl}/dashboard?tab=wallet`;

      await sendButtonMessage(from, walletMsg, [
        { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
        { id: 'broker_action_list', title: '📝 List Property' },
        { id: 'broker_action_leads', title: '📥 View Leads' },
      ]);
      return NextResponse.json({ success: true, action: 'wallet_viewed' }, { status: 200 });
    }

    if (
      session.role === 'broker' &&
      textBody.length > 25 &&
      /(bhk|sqft|sq\s*ft|lakh|cr|crore|demand|floor|flat|urgent)/i.test(textBody) &&
      !/(looking for|want|need|search|chahiye|dikhao|kya rate)/i.test(textBody)
    ) {
      const brokerCity = session.agencyName?.includes('Mumbai') ? 'Mumbai' : 'Indore';
      const extracted = await extractPropertyFromVoiceTranscript(textBody, brokerCity);

      updateSession(from, {
        currentStep: 'voice_draft_confirm',
        draftListing: extracted,
      });

      const brokerInfo = getBrokerInfo(session, from);
      const summaryCard = formatDraftSummaryCard(extracted, brokerInfo);

      await sendButtonMessage(from, summaryCard, [
        { id: 'voice_pub_yes', title: '✅ Publish Listing' },
        { id: 'draft_edit_menu', title: '✏️ Edit Details' },
        { id: 'voice_pub_no', title: '❌ Discard Draft' },
      ]);
      return NextResponse.json({ success: true, action: 'text_listing_extracted' }, { status: 200 });
    }

    if (session.role === 'broker' && /^(menu|hi|hello|broker|start)$/i.test(textBody.trim())) {
      await sendBrokerMainMenu(from, session.brokerName);
      return NextResponse.json({ success: true, action: 'broker_menu' }, { status: 200 });
    }

    await handleBuyerInquiry(from, textBody, userName, actionId);
    return NextResponse.json({ success: true, action: 'buyer_inquiry' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 });
  }
}
