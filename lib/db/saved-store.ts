import { query } from './postgres';

export async function getSavedPropertyIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const res = await query(
      `SELECT property_id::text FROM public.saved_properties WHERE user_id::text = $1`,
      [userId]
    );
    return res.rows.map((r) => r.property_id);
  } catch {
    return [];
  }
}

export async function toggleSavedProperty(
  userId: string,
  propertyId: string
): Promise<{ isSaved: boolean; propertyIds: string[] }> {
  if (!userId || !propertyId) {
    return { isSaved: false, propertyIds: [] };
  }

  try {
    const existing = await query(
      `SELECT id FROM public.saved_properties WHERE user_id::text = $1 AND property_id::text = $2 LIMIT 1`,
      [userId, propertyId]
    );

    let isSaved = false;
    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM public.saved_properties WHERE user_id::text = $1 AND property_id::text = $2`,
        [userId, propertyId]
      );
      isSaved = false;
    } else {
      await query(
        `INSERT INTO public.saved_properties (user_id, property_id, created_at)
         VALUES ($1::uuid, $2::uuid, now())
         ON CONFLICT (user_id, property_id) DO NOTHING`,
        [userId, propertyId]
      );
      isSaved = true;
    }

    const propertyIds = await getSavedPropertyIds(userId);
    return { isSaved, propertyIds };
  } catch {
    return { isSaved: false, propertyIds: [] };
  }
}
