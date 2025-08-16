import { select, input } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FileOptions } from '../types';

export async function getFileOptions(): Promise<FileOptions> {
  try {
    const backupFileFormat = await select({
      message: 'Select backup file format:',
      choices: [
        { name: 'plain', value: 'plain' },
        { name: 'custom', value: 'custom' },
        { name: 'tar', value: 'tar' },
      ],
    });

    const backupFilePath = await input({
      message: 'Specify output file path:',
      required: true,
      validate: (value) => {
        if (value.trim() === '') {
          return '⚠️ File path must be not empty!';
        }
        if (
          (backupFileFormat == 'plain' && path.extname(value) !== '.sql') ||
          (backupFileFormat == 'tar' && path.extname(value) !== '.tar') ||
          (backupFileFormat == 'custom' &&
            path.extname(value) !== '.dump' &&
            path.extname(value) !== '.backup')
        ) {
          return 'File extension is not correct';
        }
        return true;
      },
    });

    const resolvedBackupFilePath = expandTilde(backupFilePath);

    return { backupFileFormat, resolvedBackupFilePath };
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to get file options: ${err.message}`);
    }
    throw new Error('Unknown error occurred while getting file options');
  }
}

// Cross platforms
function expandTilde(inputPath: string): string {
  try {
    let processedPath = inputPath;

    if (processedPath.startsWith('~')) {
      const homeDir = os.homedir();
      if (!homeDir) {
        throw new Error('Unable to determine home directory');
      }
      processedPath = path.join(homeDir, processedPath.slice(1));
    }

    const dirPath = path.normalize(processedPath);
    if (!dirPath) {
      throw new Error('Invalid path provided');
    }

    const directoryPath = path.dirname(dirPath);
    const validatedDirPath = ensureDirectory(directoryPath);

    return path.join(validatedDirPath, path.basename(inputPath));
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Path expansion failed: ${err.message}`);
    }
    throw new Error('Unknown error during path expansion');
  }
}

// Check if the dir exists or create it
function ensureDirectory(dirPath: string): string {
  if (!dirPath) {
    throw new Error('Directory path is empty or invalid');
  }

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(
        `Failed to create directory '${dirPath}': ${err.message}`,
      );
    }
    throw new Error(`Failed to create directory '${dirPath}': Unknown error`);
  }
}
