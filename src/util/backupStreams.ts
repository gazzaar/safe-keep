import { spawn } from 'child_process';
import { createGzip } from 'node:zlib';
import fs from 'fs';
import { NetworkDBConfig } from '../types';

export async function backup(options: NetworkDBConfig) {
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
      command = 'pg_dump';
      args = [
        '-h',
        dbHost,
        '-U',
        dbUser,
        '-p',
        dbPort.toString(),
        '-d',
        dbName,
        '-F',
        'plain',
      ];

      if (dbPassword) {
        env.PGPASSWORD = dbPassword;
      }

      break;

    case 'MySql':
      command = 'mysqldump';
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
    const fileStream = fs.createWriteStream(backupFilePath);
    const gzip = createGzip();
    let startTime: Date;
    let hasError = false;

    const child = spawn(command, args, { env });

    child.on('spawn', () => {
      startTime = new Date();
      console.log(`🚀 Starting ${dbType} backup...`);
    });

    child.on('error', (error) => {
      console.error(`💥 Process error: ${error.message}`);
      hasError = true;
      fileStream.destroy();
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });

    child.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`⚠️ ${command}: ${message}`);
      }
    });

    child.stdout.on('data', (data) => {
      console.log(`⌛ Backup in progress...`);
    });

    child.stdout.pipe(gzip);
    gzip.pipe(fileStream);

    gzip.on('error', (error) => {
      console.error(`💥 Compression error: ${error.message}`);
      hasError = true;
      child.kill();
      reject(new Error(`Failed to compress backup: ${error.message}`));
    });

    fileStream.on('error', (error) => {
      console.error(`💥 File writing error: ${error.message}`);
      hasError = true;
      child.kill();
      reject(new Error(`Failed to write backup file: ${error.message}`));
    });

    fileStream.on('finish', () => {
      if (!hasError) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const durationSeconds = (duration / 1000).toFixed(2);

        console.log(`✅ Backup completed successfully!`);
        console.log(`📊 Backup Summary:`);
        console.log(`   Database: ${dbName} (${dbType})`);
        console.log(`   Start time: ${startTime.toLocaleTimeString()}`);
        console.log(`   End time: ${endTime.toLocaleTimeString()}`);
        console.log(`   Duration: ${durationSeconds} seconds`);
        console.log(`   File: ${backupFilePath}`);

        resolve();
      }
    });

    child.on('close', (code, signal) => {
      if (hasError) return;

      if (code === 0) {
        gzip.end();
      } else if (signal) {
        hasError = true;
        reject(new Error(`Backup process was killed with signal: ${signal}`));
      } else {
        hasError = true;
        reject(new Error(`Backup failed with exit code: ${code}`));
      }
    });
  });
}
