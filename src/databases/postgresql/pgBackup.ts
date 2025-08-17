import { spawn } from 'child_process';
import fs from 'fs';
import { NetworkDBConfig } from '../../types';

type PostgresBackupOptions = Omit<NetworkDBConfig, 'dbType'>;

export async function backupPg(options: PostgresBackupOptions) {
  const { dbHost, dbUser, dbName, backupFilePath, backupFileFormat } = options;

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(backupFilePath);
    const child = spawn('pg_dump', [
      '-h',
      dbHost,
      '-U',
      dbUser,
      '-d',
      dbName,
      '-F',
      backupFileFormat,
    ]);

    let startTime: Date;

    child.on('spawn', () => {
      startTime = new Date();
      console.log(`🚀 pg_dump process started`);
    });

    child.on('error', (error) => {
      console.error(`💥 Process error: ${error.message}`);
      reject(error);
    });

    child.stdout.pipe(fileStream);

    child.stderr.on('data', (data) => {
      console.error(`⚠️ Backup error: ${data}`);
    });

    child.stdout.on('data', (data) => {
      console.log(`�� Backup in progress...`);
    });

    fileStream.on('error', (error) => {
      console.error(`�� File writing error: ${error.message}`);
      reject(error);
    });

    fileStream.on('finish', () => {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const durationSeconds = (duration / 1000).toFixed(2);
      console.log(`✅ Backup completed successfully!`);
      console.log(`📊 Backup Summary:`);
      console.log(`   Start time: ${startTime.toLocaleTimeString()}`);
      console.log(`   End time: ${endTime.toLocaleTimeString()}`);
      console.log(`   Duration: ${durationSeconds} seconds`);
      console.log(`   Status: SUCCESS`);
      console.log(`   File: ${backupFilePath}`);
      resolve();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`📦 pg_dump process completed successfully`);
      } else {
        reject(new Error(`Backup failed with code ${code}`));
      }
    });
  });
}
