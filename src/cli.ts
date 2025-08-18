import fs from 'fs';
import os from 'os';
import path from 'path';
import { input, password, select, search } from '@inquirer/prompts';
import { DatabaseConfig, DBType, NetworkDBConfig, Operations } from './types';
import { handleDBType } from './databases/handleDBType';
import { createBackupFilePath } from './util/getFileOptions';
import { formatFileSize } from './util/formatFileSize';
import { extractDbTypeFromFilename } from './util/extractDBType';

async function selectOperation(): Promise<Operations | undefined> {
  try {
    const operation: Operations = await select({
      message: 'Select operation type',
      choices: [
        { name: 'Backup', value: 'backup' },
        { name: 'Restore', value: 'restore' },
      ],
    });
    return operation;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`⚠️ Error: ${err.message}`);
      process.exit(1);
    }
  }
  return undefined;
}

async function getDBConnectionConfig(): Promise<
  Omit<NetworkDBConfig, 'backupFilePath'> | undefined
> {
  const defaultPorts = {
    pg: '5432',
    MySql: '3306',
    mongodb: '27017',
  };

  try {
    const dbType: DBType = await select({
      message: 'Select database type',
      choices: [
        {
          name: 'PostgreSQL',
          value: 'pg',
        },
        {
          name: 'MySql',
          value: 'MySql',
        },

        {
          name: 'MongoDB',
          value: 'mongodb',
        },

        {
          name: 'SQLite',
          value: 'sqlite',
        },
      ],
    });

    if (dbType === 'sqlite' || dbType === 'mongodb') {
      // TODO: support other databases
      throw new Error(`${dbType} is not supported yet`);
    } else {
      const dbUser = await input({
        message: 'Enter database user ',
        required: true,
        validate: (value: string) => {
          if (value.trim() === '') {
            return '⚠️ User must be not empty!';
          }
          return true;
        },
      });

      const dbHost = await input({
        message: 'Enter hostname (default: localhost)',
        default: 'localhost',
        required: true,
        validate: (value: string) => {
          if (value.trim() === '') {
            return '⚠️ Hostname must be not empty!';
          }
          return true;
        },
      });

      const dbPort = await input({
        message: `Enter port number: (default ${defaultPorts[dbType]})`,
        default: defaultPorts[dbType],
        required: true,
        validate: (value) => {
          const port = parseInt(value.trim(), 10);

          if (isNaN(port) || port < 1 || port > 65535) {
            return `⚠️ port must be a number between 1 and 65535`;
          }

          return true;
        },
      });

      const dbPassword = await password({
        message: 'Enter your Database password:',
        mask: true,
        validate: (value) => {
          if (value.trim().length <= 2) {
            return 'password must be more than 4 chcaracters';
          }
          return true;
        },
      });

      const dbName = await input({
        message: 'Enter your database name:',
        required: true,
        validate: (value) => {
          if (value.trim() === '') {
            return '⚠️ Database name must be not empty!';
          }
          return true;
        },
      });

      return {
        dbType,
        dbHost,
        dbPort: +dbPort,
        dbPassword,
        dbName,
        dbUser,
      };
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'ExitPromptError') {
        console.log('Operation cancelled by user');
        process.exit(0);
      }
      console.error(`⚠️ Error: ${err.message}`);
    }
  }
  return undefined;
}

async function getBackupConfig(): Promise<DatabaseConfig | undefined> {
  try {
    const dbConnectionConfig = await getDBConnectionConfig();
    if (!dbConnectionConfig)
      throw new Error('Database configuration is not correct');

    const { dbType, dbName, dbPort, dbUser, dbPassword, dbHost } =
      dbConnectionConfig;

    const backupFilePath = (await createBackupFilePath(
      dbName,
      dbType,
    )) as string;

    return {
      dbType,
      dbHost,
      dbPort,
      dbPassword,
      dbName,
      dbUser,
      backupFilePath,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'ExitPromptError') {
        console.log('Operation cancelled by user');
        process.exit(0);
      }
      console.error(`⚠️ Error: ${err.message}`);
    }
  }
  return undefined;
}

async function selectBackupFile(): Promise<DatabaseConfig | undefined> {
  try {
    const dbConnectionConfig = await getDBConnectionConfig();
    if (!dbConnectionConfig)
      throw new Error('Database configuration is not correct');

    const { dbType, dbName, dbPort, dbUser, dbPassword, dbHost } =
      dbConnectionConfig;
    const backupDir = path.join(os.homedir(), 'BACKUP');

    if (!fs.existsSync(backupDir)) {
      throw new Error('No Backup Directory');
    }

    const backupFilePath = await search({
      message: `Search for a ${dbType} backup file:`,
      source: async (input) => {
        const allFiles = fs
          .readdirSync(backupDir)
          .filter((file) => {
            const fileDbType = extractDbTypeFromFilename(file);
            return file.endsWith('.sql.gz') && fileDbType === dbType;
          })
          .map((file) => {
            const fullPath = path.join(backupDir, file);
            const stats = fs.statSync(fullPath);

            const dbName = file.split('-')[0];
            const dateStr = file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || 'unknown';

            return {
              name: `${file} (${formatFileSize(stats.size)})`,
              value: fullPath,
              description: `Database: ${dbName} | Created: ${stats.mtime.toLocaleString()}`,
              searchableText: `${file} ${dbName} ${dateStr}`,
            };
          })
          .sort(
            (a, b) =>
              fs.statSync(b.value).mtime.getTime() -
              fs.statSync(a.value).mtime.getTime(),
          );

        if (allFiles.length === 0) {
          return [
            { name: 'No backup files found', value: null, disabled: true },
          ];
        }

        if (!input) {
          return allFiles.slice(0, 10);
        }

        const filtered = allFiles.filter((file) =>
          file.searchableText.toLowerCase().includes(input.toLowerCase()),
        );

        if (filtered.length === 0) {
          return [
            {
              name: `No backup files matching "${input}"`,
              value: null,
              disabled: true,
            },
          ];
        }

        return filtered;
      },
    });

    if (!backupFilePath) throw new Error('No backup file found');

    return {
      dbType,
      dbUser,
      dbHost,
      dbPassword,
      dbPort,
      dbName,
      backupFilePath,
    };
  } catch (err) {
    if (err instanceof Error)
      if (err instanceof Error) {
        if (err.name === 'ExitPromptError') {
          console.log('Operation cancelled by user');
          process.exit(0);
        }
        console.error(`⚠️ Error: ${err.message}`);
      }
  }
  return undefined;
}

async function start() {
  const operation = await selectOperation();
  if (operation === 'backup') {
    const config = await getBackupConfig();
    if (config) {
      await handleDBType(config, operation);
    }
  } else {
    const config = await selectBackupFile();
    if (config) {
      await handleDBType(config, 'restore');
    }
  }
}
start();
