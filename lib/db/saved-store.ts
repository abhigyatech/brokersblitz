import { readJsonFile, writeJsonFile } from './json-store';

interface SavedEntry {
  userId: string;
  propertyIds: string[];
  updatedAt: string;
}

function loadSaved(): SavedEntry[] {
  return readJsonFile<SavedEntry[]>('saved.json', []);
}

function persistSaved(entries: SavedEntry[]): void {
  writeJsonFile('saved.json', entries);
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

