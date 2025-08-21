import fs from 'fs/promises';
import path from 'path';

/**
 * Load a JSON file.  If the file does not exist, the defaultValue is written and returned.
 * @param {string} filePath
 * @param {any} defaultValue
 */
export async function load(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      await save(filePath, defaultValue);
      return defaultValue;
    }
    throw e;
  }
}

/**
 * Atomically save data to a JSON file.  Writes to a temporary file then renames.
 * @param {string} filePath
 * @param {any} data
 */
export async function save(filePath, data) {
  const tmp = `${filePath}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}