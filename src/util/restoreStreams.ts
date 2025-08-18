import { spawn } from 'child_process';
import { createGunzip } from 'node:zlib';
import fs from 'fs';
import { NetworkDBConfig } from '../types';

export async function restore(options: NetworkDBConfig) {
  const { dbType, dbHost, dbUser, dbName, dbPassword, backupFilePath, dbPort } =
    options;

  if (!dbHost || !dbUser || !dbName || !backupFilePath) {
    throw new Error('Missing required database connection parameters');
  }

  let command: string;
  let args: string[] = [];
  let env = { ...process.env };

  switch (dbType) {
    case 'pg':
      command = 'psql';
      args = [
        '-h',
        dbHost,
        '-U',
        dbUser,
        '-p',
        dbPort.toString(),
        '-d',
        dbName,
      ];
      if (dbPassword) {
        env.PGPASSWORD = dbPassword;
      }
      break;

    case 'MySql':
      command = 'mysql';
      args = [
        '-h',
        dbHost,
        '-u',
        dbUser,
        '-P',
        dbPort.toString(),
        '--password=' + dbPassword,
        dbName,
      ];
      break;

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }

  return new Promise<void>((resolve, reject) => {
    const fileReadStream = fs.createReadStream(backupFilePath);
    const gunzip = createGunzip();
    let hasError = false;
    let startTime = new Date();

    const child = spawn(command, args, { env });

    child.on('error', (error) => {
      console.error(`💥 Process error: ${error.message}`);
      hasError = true;
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });

    child.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`⚠️ ${command}: ${message}`);
      }
    });

    fileReadStream.on('data', (data) => {
      console.log('⌛ Restoring...');
    });

    fileReadStream.on('error', (error) => {
      console.error(`❌ Failed to read backup file: ${error.message}`);
      hasError = true;
      child.kill();
      reject(new Error(`Failed to read backup file: ${error.message}`));
    });

    gunzip.on('error', (error) => {
      console.error(`💥 Decompression error: ${error.message}`);
      hasError = true;
      child.kill();
      reject(new Error(`Failed to decompress file: ${error.message}`));
    });

    fileReadStream.pipe(gunzip).pipe(child.stdin);

    child.on('close', (code, signal) => {
      if (hasError) return;

      if (code === 0) {
        const endTime = new Date();
        const duration = (
          (endTime.getTime() - startTime.getTime()) /
          1000
        ).toFixed(2);

        console.log('✅ Database restored successfully!');
        console.log(`📊 Restore completed in ${duration} seconds`);
        resolve();
      } else if (signal) {
        hasError = true;
        reject(new Error(`Restore process was killed with signal: ${signal}`));
      } else {
        hasError = true;
        reject(new Error(`Restore failed with exit code: ${code}`));
      }
    });
  });
}
