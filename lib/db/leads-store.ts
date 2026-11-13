import { Lead } from '../../data/types';
import { query } from './postgres';

function mapRowToLead(row: any): Lead {
  return {
    id: String(row.id),
    propertyId: String(row.property_id || ''),
    propertyTitle: row.property_title || row.prop_title || 'Property Inquiry',
    propertyPrice: row.property_price || undefined,
    brokerId: String(row.broker_id || ''),
    brokerStoreCode: row.broker_store_code || row.store_code || '',
    buyerName: row.buyer_name || '',
    buyerPhone: row.buyer_phone || '',
    buyerEmail: row.buyer_email || undefined,
    message: row.message || '',
    preferredDate: row.preferred_visit_date ? new Date(row.preferred_visit_date).toISOString().split('T')[0] : undefined,
    timeSlot: row.time_slot || undefined,
    source: (row.source || 'web') as 'blitzbot' | 'whatsapp' | 'web',
    status: (row.status || 'new') as 'new' | 'confirmed' | 'rescheduled' | 'cancelled',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  try {
    const res = await query(
      `SELECT l.*, p.title as prop_title, pr.store_code
       FROM public.leads l
       LEFT JOIN public.properties p ON l.property_id = p.id
       LEFT JOIN public.profiles pr ON l.broker_id = pr.id
       ORDER BY l.created_at DESC`
    );
    return res.rows.map(mapRowToLead);
  } catch {
    return [];
  }
}

export async function getLeadsByBroker(storeCodeOrId: string): Promise<Lead[]> {
  if (!storeCodeOrId) return [];
  const normalized = storeCodeOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    const res = await query(
      `SELECT l.*, p.title as prop_title, pr.store_code
       FROM public.leads l
       LEFT JOIN public.properties p ON l.property_id = p.id
       LEFT JOIN public.profiles pr ON l.broker_id = pr.id
       WHERE l.broker_id::text = $1
          OR lower(regexp_replace(coalesce(l.broker_store_code, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
          OR lower(regexp_replace(coalesce(pr.store_code, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
          OR lower(regexp_replace(coalesce(pr.agency_name, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
       ORDER BY l.created_at DESC`,
      [storeCodeOrId, normalized]
    );
    return res.rows.map(mapRowToLead);
  } catch {
    return [];
  }
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
  const source = data.source === 'blitzbot' ? 'blitzbot' : data.source === 'whatsapp' ? 'whatsapp' : 'web';
  const visitDate = data.preferredDate ? new Date(data.preferredDate) : null;

  try {
    const res = await query(
      `INSERT INTO public.leads (
        property_id, broker_id, buyer_name, buyer_phone, buyer_email,
        message, preferred_visit_date, source, status, property_title,
        property_price, broker_store_code, time_slot, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5,
        $6, $7, $8, 'new', $9,
        $10, $11, $12, now(), now()
      ) RETURNING *`,
      [
        data.propertyId,
        data.brokerId,
        data.buyerName,
        data.buyerPhone,
        data.buyerEmail || null,
        data.message || '',
        visitDate,
        source,
        data.propertyTitle || null,
        data.propertyPrice || null,
        data.brokerStoreCode || null,
        data.timeSlot || null,
      ]
    );
    return mapRowToLead(res.rows[0]);
  } catch {
    return {
      ...data,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<Lead | null> {
  try {
    const res = await query(
      `UPDATE public.leads SET status = $1::lead_status, updated_at = now() WHERE id::text = $2 RETURNING *`,
      [status, id]
    );
    if (res.rows.length === 0) return null;
    return mapRowToLead(res.rows[0]);
  } catch {
    return null;
  }
}

export async function saveLeads(leads: Lead[]): Promise<void> {
  for (const l of leads) {
    try {
      await updateLeadStatus(l.id, l.status);
    } catch {}
  }
}
