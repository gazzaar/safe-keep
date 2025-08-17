import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export async function createBackupFilePath(dbName: string): Promise<string> {
  const backupPath = expandTilde('~/BACKUP/');
  const fileName = createFileName(dbName);
  const fullPath = path.join(backupPath, fileName);

  // Ensure the directory exists
  ensureDirectory(path.dirname(fullPath));

  return fullPath;
}

const createFileName = (dbName: string) => {
  const date = new Date();
  return `${dbName}-${date.toISOString().split('T')[0]}.sql.gz`;
};

function expandTilde(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    const homeDir = os.homedir();
    if (!homeDir) {
      throw new Error('Unable to determine home directory');
    }
    return path.join(homeDir, inputPath.slice(1));
  }
  return inputPath;
}

function ensureDirectory(dirPath: string): void {
  if (!dirPath) {
    throw new Error('Directory path is empty or invalid');
  }

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.accessSync(dirPath, fs.constants.W_OK);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to create directory '${dirPath}': ${message}`);
  }
}
