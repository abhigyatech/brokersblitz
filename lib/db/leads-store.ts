import { Lead } from '../../data/types';
import { readJsonFile, writeJsonFile } from './json-store';

export function getAllLeads(): Lead[] {
  return readJsonFile<Lead[]>('leads.json', []);
}

export function saveLeads(leads: Lead[]): void {
  writeJsonFile('leads.json', leads);
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

