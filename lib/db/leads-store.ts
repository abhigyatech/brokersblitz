import fs from 'fs';
import path from 'path';
import { Lead } from '../../data/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function ensureLeadsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllLeads(): Lead[] {
  ensureLeadsFile();
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  ensureLeadsFile();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

export function getLeadsByBroker(storeCodeOrId: string): Lead[] {
  const leads = getAllLeads();
  const normalized = storeCodeOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return leads.filter((l) => {
    const code = l.brokerStoreCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = l.brokerId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return code === normalized || id === normalized;
  });
}

export function createLead(data: Omit<Lead, 'id' | 'createdAt'>): Lead {
  const leads = getAllLeads();
  const newLead: Lead = {
    ...data,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  leads.unshift(newLead);
  saveLeads(leads);
  return newLead;
}

export function updateLeadStatus(id: string, status: Lead['status']): Lead | null {
  const leads = getAllLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;
  leads[index].status = status;
  saveLeads(leads);
  return leads[index];
}

