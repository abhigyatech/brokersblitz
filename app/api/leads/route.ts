import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, getLeadsByBroker, createLead } from '../../../lib/db/leads-store';
import { getSessionUser } from '../../../lib/auth/user-store';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    const user = sessionToken ? getSessionUser(sessionToken) : null;

    const { searchParams } = new URL(req.url);
    const brokerQuery = searchParams.get('broker');

    if (brokerQuery) {
      const leads = getLeadsByBroker(brokerQuery);
      return NextResponse.json({ success: true, count: leads.length, leads });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'admin') {
      const leads = getAllLeads();
      return NextResponse.json({ success: true, count: leads.length, leads });
    }

    const brokerStoreCode = user.agencyName ? user.agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') : user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const brokerLeads = getLeadsByBroker(brokerStoreCode);
    return NextResponse.json({ success: true, count: brokerLeads.length, leads: brokerLeads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.propertyId || !body.buyerName || !body.buyerPhone) {
      return NextResponse.json(
        { success: false, error: 'Property ID, name and phone number are required' },
        { status: 400 }
      );
    }

    const newLead = createLead({
      propertyId: body.propertyId,
      propertyTitle: body.propertyTitle || 'Property Inquiry',
      propertyPrice: body.propertyPrice || '₹0',
      brokerId: body.brokerId || 'brk-active',
      brokerStoreCode: body.brokerStoreCode || 'broker',
      buyerName: body.buyerName.trim(),
      buyerPhone: body.buyerPhone.trim(),
      buyerEmail: body.buyerEmail ? body.buyerEmail.trim() : undefined,
      message: body.message || 'Direct inquiry submitted from BrokersBlitz platform.',
      preferredDate: body.preferredDate,
      timeSlot: body.timeSlot,
      source: body.source || 'web',
      status: 'new',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry and site visit request recorded successfully.',
        lead: newLead,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

