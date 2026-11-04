import { sendTextMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep } from '@/lib/whatsapp/session-store';

export async function promptPrice(from: string, isRent: boolean): Promise<boolean> {
  setSessionStep(from, 'step5_price');

  if (isRent) {
    return sendTextMessage(
      from,
      '💰 Please enter the expected *Monthly Rent* in rupees (e.g., 25000 or 15k):'
    );
  }

  return sendTextMessage(
    from,
    '💰 Please enter the expected *Total Selling Price* (e.g., "75 Lakhs" or "1.2 Crore" or "7500000"):'
  );
}

export function parsePriceInput(input: string, isRent: boolean): number {
  const text = input.toLowerCase().replace(/,/g, '').trim();

  const crMatch = text.match(/([0-9.]+)\s*(cr|crore|karod)/i);
  if (crMatch) {
    return Math.round(parseFloat(crMatch[1]) * 10000000);
  }

  const lakhMatch = text.match(/([0-9.]+)\s*(lakh|lakhs|lac|lacs)/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  const kMatch = text.match(/([0-9.]+)\s*(k|thousand|hazar)/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  const rawDigits = text.replace(/[^0-9]/g, '');
  if (rawDigits.length >= 3) {
    const val = parseInt(rawDigits, 10);
    return isRent ? val : val < 1000 ? val * 100000 : val;
  }

  return isRent ? 25000 : 5000000;
}
