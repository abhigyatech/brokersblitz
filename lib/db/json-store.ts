import fs from 'fs';
import path from 'path';

const MEMORY_CACHE = new Map<string, any>();

function getTmpPath(filename: string): string {
  const tmpDir = path.join('/tmp', 'brokersblitz_data');
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  } catch {}
  return path.join(tmpDir, filename);
}

function getLocalPath(filename: string): string {
  return path.join(process.cwd(), 'data', filename);
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  if (MEMORY_CACHE.has(filename)) {
    return MEMORY_CACHE.get(filename);
  }

  const tmpFile = getTmpPath(filename);
  try {
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf-8');
      const parsed = JSON.parse(raw);
      MEMORY_CACHE.set(filename, parsed);
      return parsed;
    }
  } catch {}

  const localFile = getLocalPath(filename);
  try {
    if (fs.existsSync(localFile)) {
      const raw = fs.readFileSync(localFile, 'utf-8');
      const parsed = JSON.parse(raw);
      MEMORY_CACHE.set(filename, parsed);
      return parsed;
    }
  } catch {}

  MEMORY_CACHE.set(filename, defaultValue);
  return defaultValue;
}

export function writeJsonFile<T>(filename: string, data: T): void {
  MEMORY_CACHE.set(filename, data);

  const localFile = getLocalPath(filename);
  const localDir = path.dirname(localFile);
  let writtenLocally = false;

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localFile, JSON.stringify(data, null, 2), 'utf-8');
    writtenLocally = true;
  } catch {}

  if (!writtenLocally || process.env.VERCEL) {
    try {
      const tmpFile = getTmpPath(filename);
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }
}

