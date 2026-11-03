import fs from 'fs';
import path from 'path';

interface SavedEntry {
  userId: string;
  propertyIds: string[];
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');

function ensureSavedFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SAVED_FILE)) {
    fs.writeFileSync(SAVED_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function loadSaved(): SavedEntry[] {
  ensureSavedFile();
  try {
    const raw = fs.readFileSync(SAVED_FILE, 'utf-8');
    return JSON.parse(raw) as SavedEntry[];
  } catch {
    return [];
  }
}

function persistSaved(entries: SavedEntry[]): void {
  ensureSavedFile();
  fs.writeFileSync(SAVED_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export function getSavedPropertyIds(userId: string): string[] {
  const entries = loadSaved();
  const entry = entries.find((e) => e.userId === userId);
  return entry ? entry.propertyIds : [];
}

export function toggleSavedProperty(userId: string, propertyId: string): { isSaved: boolean; propertyIds: string[] } {
  const entries = loadSaved();
  const index = entries.findIndex((e) => e.userId === userId);

  let propertyIds: string[] = [];
  let isSaved = false;

  if (index === -1) {
    propertyIds = [propertyId];
    isSaved = true;
    entries.push({
      userId,
      propertyIds,
      updatedAt: new Date().toISOString(),
    });
  } else {
    const current = entries[index].propertyIds;
    if (current.includes(propertyId)) {
      propertyIds = current.filter((id) => id !== propertyId);
      isSaved = false;
    } else {
      propertyIds = [...current, propertyId];
      isSaved = true;
    }
    entries[index].propertyIds = propertyIds;
    entries[index].updatedAt = new Date().toISOString();
  }

  persistSaved(entries);
  return { isSaved, propertyIds };
}

