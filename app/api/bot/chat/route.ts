import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllProperties, getPropertyById, searchProperties } from '@/lib/db/properties-store';
import { createLead } from '@/lib/db/leads-store';
import { verifySession } from '@/lib/auth/user-store';
import { callOpenAIChatCompletion, callSarvamChat } from '@/lib/ai/ai-llm-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.message || '').trim();
    const actionType = body.actionType || '';
    const propertyContext = body.propertyContext;
    const selectedSlot = body.slot || body.selectedSlot || '';
    const selectedDate = body.date || body.selectedDate || '';

    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    const sessionUser = token ? verifySession(token) : null;

    if (actionType === 'enquire' && propertyContext) {
      const propId = propertyContext.propertyId;
      const dbProp = propId ? getPropertyById(propId) : null;

      const title = dbProp?.title || propertyContext.propertyTitle || 'Property';
      const price = dbProp?.formattedPrice || propertyContext.propertyPrice || 'Price on request';
      const locality = dbProp?.locality || propertyContext.propertyLocality || '';
      const city = dbProp?.city || propertyContext.propertyCity || '';
      const brokerName = dbProp?.broker?.name || propertyContext.brokerName || 'Authorized Advisor';
      const brokerAgency = dbProp?.broker?.agency || propertyContext.brokerAgency || 'Real Estate Partners';
      const brokerStore = dbProp?.broker?.storeCode || propertyContext.brokerStoreCode || 'store';
      const rera = dbProp?.reraId || 'Self-Reported';
      const area = dbProp ? `${dbProp.carpetAreaSqft.toLocaleString('en-IN')} sq.ft` : '';
      const beds = dbProp?.bedrooms ? `${dbProp.bedrooms} BHK` : '';

      const specsLine = [beds, area, locality, city].filter(Boolean).join(' • ');

      const reply = `Namaste! Here are the verified details for this listing:\n\nProperty ID: ${propId || 'BB-REF'}\nTitle: ${title}\nPrice: ${price}\nSpecs: ${specsLine}\nBroker: ${brokerName} (${brokerAgency})\nBroker Store: /broker/${brokerStore}\nRERA ID: ${rera} (Self-reported by broker. Independent state portal verification advised)\n\nAre you interested in this property? Choose what you would like to do next:`;

      const options = [
        { key: 'visit', label: 'Book Site Visit' },
        { key: 'store', label: 'Visit Broker Store', url: `/broker/${brokerStore}` },
        {
          key: 'whatsapp',
          label: 'Chat on WhatsApp',
          url: `https://wa.me/917272357771?text=${encodeURIComponent(
            `Hi BrokersBlitz, I am interested in Property ID: ${propId} (${title}) listed by ${brokerName} (${brokerStore}).`
          )}`,
        },
        { key: 'question', label: 'Ask a Question' },
      ];

      return NextResponse.json({
        success: true,
        type: 'enquiry_specs',
        reply,
        options,
        propertyDetails: {
          id: propId,
          title,
          price,
          locality,
          city,
          brokerName,
          brokerAgency,
          brokerStore,
          image: dbProp?.primaryImage || '',
        },
        brokerStore,
        propertyId: propId,
        action: {
          type: 'whatsapp',
          label: 'Chat on WhatsApp (+91 72723 57771)',
          url: `https://wa.me/917272357771?text=${encodeURIComponent(
            `Hi BrokersBlitz, inquiring about Property ID: ${propId} (${title}) listed by ${brokerName} (Store: ${brokerStore}).`
          )}`,
        },
      });
    }

    if (actionType === 'book_visit' || (query.toLowerCase().includes('schedule') && (selectedSlot || selectedDate))) {
      if (!sessionUser) {
        return NextResponse.json({
          success: false,
          requireAuth: true,
          message: 'To confirm your site visit appointment with the broker, please log in with your buyer account or register below.',
          propertyContext,
          slot: selectedSlot,
          date: selectedDate,
        });
      }

      const dateText = selectedDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const slotText = selectedSlot || '11:00 AM - 12:30 PM (Morning Slot)';
      const propId = propertyContext?.propertyId || 'prop-general';
      const propTitle = propertyContext?.propertyTitle || 'Property Site Visit';
      const propPrice = propertyContext?.propertyPrice || '';
      const brkId = propertyContext?.brokerId || 'brk-assigned';
      const brkStore = propertyContext?.brokerStoreCode || 'broker';

      const lead = createLead({
        propertyId: propId,
        propertyTitle: propTitle,
        propertyPrice: propPrice,
        brokerId: brkId,
        brokerStoreCode: brkStore,
        buyerName: sessionUser.fullName,
        buyerPhone: sessionUser.phone,
        buyerEmail: sessionUser.email,
        message: `Site visit scheduled for ${dateText} at ${slotText} via BlitzBot AI`,
        preferredDate: dateText,
        timeSlot: slotText,
        source: 'blitzbot',
        status: 'confirmed',
      });

      return NextResponse.json({
        success: true,
        booked: true,
        leadId: lead.id,
        reply: `Visit Confirmed! (Ref ID: ${lead.id})\n\nBuyer: ${sessionUser.fullName} (${sessionUser.phone})\nProperty: ${propTitle}\nScheduled Date: ${dateText}\nTime Slot: ${slotText}\nAssigned Broker: ${propertyContext?.brokerName || 'Senior Realty Advisor'} (${brkStore})\n\nOur WhatsApp Support desk will message you with property entry directions and broker direct line.`,
        action: {
          type: 'whatsapp',
          label: 'Open WhatsApp Support (+91 72723 57771)',
          url: `https://wa.me/917272357771?text=${encodeURIComponent(
            `Hi BrokersBlitz, site visit confirmed for ${propTitle} on ${dateText} (${slotText}). Booking Reference ID: ${lead.id}. Buyer: ${sessionUser.fullName}.`
          )}`,
        },
      });
    }

    if (!query) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const q = query.toLowerCase();

    if (q.includes('visit') || q.includes('schedule') || q.includes('appointment')) {
      if (propertyContext) {
        if (!sessionUser) {
          return NextResponse.json({
            success: false,
            requireAuth: true,
            message: `Please log in to your buyer account or register below to schedule an inspection visit for "${propertyContext.propertyTitle}".`,
            propertyContext,
          });
        }

        return NextResponse.json({
          success: true,
          showDatePicker: true,
          reply: `Welcome back, ${sessionUser.fullName}! Please select your preferred inspection date and time slot for "${propertyContext.propertyTitle}":`,
        });
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const sarvamKey = process.env.SARVAM_API_KEY;

    if (openaiKey && openaiKey.trim() !== '') {
      const allProps = getAllProperties().slice(0, 10);
      const inventorySummary = allProps
        .map((p) => `${p.title} (${p.categoryLabel}, ${p.formattedPrice}) in ${p.locality}, ${p.city} [Broker: ${p.broker.name}, Code: ${p.broker.storeCode || p.broker.id}]`)
        .join('\n');

      const systemPrompt = `You are BlitzBot, an expert AI assistant for BrokersBlitz (Brokers Blitz) - India's modern digital real estate portal.
WhatsApp Support Number: +91 72723 57771.
Knowledge base context:
- Coverage: Pan India (Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad, Goa, Chennai).
- Current Featured Properties:
${inventorySummary}
- Guidelines:
1. Always communicate in professional, concise, polished Indian English.
2. If asked about listings, suggest properties matching their budget, city, or category.
3. Every property features a self-reported RERA registration number; inform buyers to cross-verify on official state portals (MahaRERA, K-RERA, HRERA, etc.).
4. When users enquire or want to schedule a visit, offer them site inspection options or WhatsApp Support at +91 72723 57771.
5. If brokers want to join, direct them to register at /signup with role 'broker' providing their RERA number.
6. Do not use raw emojis. Keep responses clear and structured.`;

      const aiReply = await callOpenAIChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        openaiKey
      );

      if (aiReply) {
        return NextResponse.json({
          success: true,
          reply: aiReply,
          action: {
            type: 'link',
            variant: 'primary',
            label: 'Search Listings',
            url: '/search',
          },
        });
      }
    }

    if (sarvamKey && sarvamKey.trim() !== '') {
      const sarvamReply = await callSarvamChat(
        query,
        sarvamKey,
        'You are BlitzBot, an expert AI assistant for BrokersBlitz real estate in India. WhatsApp Support: +91 72723 57771. Answer questions politely and concisely in professional Indian English. Mention Pan India coverage and state RERA cross-verification.'
      );

      if (sarvamReply) {
        return NextResponse.json({
          success: true,
          reply: sarvamReply,
          action: {
            type: 'link',
            variant: 'primary',
            label: 'Search Listings',
            url: '/search',
          },
        });
      }
    }

    if (q.includes('mumbai') || q.includes('bengaluru') || q.includes('bangalore') || q.includes('pune') || q.includes('delhi') || q.includes('gurugram') || q.includes('noida') || q.includes('hyderabad') || q.includes('goa') || q.includes('chennai')) {
      let detectedCity = 'Mumbai';
      if (q.includes('bengaluru') || q.includes('bangalore')) detectedCity = 'Bengaluru';
      if (q.includes('pune')) detectedCity = 'Pune';
      if (q.includes('delhi') || q.includes('noida') || q.includes('gurugram')) detectedCity = 'Delhi NCR';
      if (q.includes('hyderabad')) detectedCity = 'Hyderabad';
      if (q.includes('goa')) detectedCity = 'Goa';
      if (q.includes('chennai')) detectedCity = 'Chennai';

      const matches = searchProperties({ city: detectedCity }).slice(0, 3);
      if (matches.length > 0) {
        const listText = matches
          .map((p) => `• ${p.title} (${p.formattedPrice}) in ${p.locality} [RERA: ${p.reraId}]`)
          .join('\n');
        return NextResponse.json({
          success: true,
          reply: `Here are available verified properties in ${detectedCity}:\n\n${listText}\n\nWould you like to schedule an inspection walkthrough or explore all listings in ${detectedCity}?`,
          action: {
            type: 'link',
            variant: 'primary',
            label: `View all properties in ${detectedCity}`,
            url: `/search?city=${encodeURIComponent(detectedCity)}`,
          },
        });
      }
    }

    if (q.includes('commercial') || q.includes('office') || q.includes('it park') || q.includes('retail') || q.includes('shop')) {
      const commMatches = searchProperties({ category: 'commercial_office' }).slice(0, 3);
      const listText = commMatches.map((p) => `• ${p.title} (${p.formattedPrice}) in ${p.city}`).join('\n');
      return NextResponse.json({
        success: true,
        reply: `Here are premier commercial spaces currently listed:\n\n${listText}\n\nTap below to explore our corporate commercial portfolio.`,
        action: {
          type: 'link',
          variant: 'primary',
          label: 'View Commercial Inventory',
          url: '/search?category=commercial_office',
        },
      });
    }

    if (q.includes('villa') || q.includes('penthouse') || q.includes('luxury')) {
      const luxuryMatches = getAllProperties()
        .filter((p) => p.category === 'villa' || p.category === 'penthouse')
        .slice(0, 3);
      const listText = luxuryMatches.map((p) => `• ${p.title} (${p.formattedPrice}) in ${p.city}`).join('\n');
      return NextResponse.json({
        success: true,
        reply: `Here are curated high-value luxury residences:\n\n${listText}`,
        action: {
          type: 'link',
          variant: 'primary',
          label: 'View Luxury Villas & Penthouses',
          url: '/search?category=villa',
        },
      });
    }

    if (q.includes('rera') || q.includes('verify') || q.includes('legal') || q.includes('compliance')) {
      return NextResponse.json({
        success: true,
        reply: `Every property listing on BrokersBlitz displays the broker's self-reported state RERA registration ID (MahaRERA, K-RERA, HRERA, TS RERA, Goa RERA, TN RERA).\n\nBuyers are strongly advised to independently cross-verify these credentials on official state government portals before executing any financial transaction.`,
        action: {
          type: 'link',
          variant: 'primary',
          label: 'Review Compliance Terms',
          url: '/terms',
        },
      });
    }

    if (q.includes('broker') || q.includes('list') || q.includes('join') || q.includes('agent')) {
      return NextResponse.json({
        success: true,
        reply: `Licensed real estate brokers can create their dedicated digital store page on BrokersBlitz with 1-click sharing on WhatsApp, verified RERA badge, and instant lead capture.\n\nReady to get started? Register as a Broker today.`,
        action: {
          type: 'link',
          variant: 'primary',
          label: 'Register as Broker',
          url: '/signup?role=broker',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reply: `Namaste! I am your BrokersBlitz AI Assistant with Pan India coverage.\n\nI can help you explore properties by city, budget, or configuration, schedule on-site inspections, or connect directly on WhatsApp at +91 72723 57771.\n\nHow may I assist your real estate journey today?`,
      action: {
        type: 'whatsapp',
        label: 'Chat on WhatsApp (+91 72723 57771)',
        url: 'https://wa.me/917272357771?text=Hi%20BrokersBlitz',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}