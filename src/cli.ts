import fs from 'fs';
import { input, password, select } from '@inquirer/prompts';
import { DatabaseConfig, DBType, Operations } from './types';
import { handleDBType } from './databases/handleDBType';
import { createBackupFilePath } from './util/getFileOptions';

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

async function getBackupConfig(): Promise<DatabaseConfig | undefined> {
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

    if (dbType === 'sqlite') {
      throw new Error('sqlite not implement yet');
      const dbPath = await input({
        message: 'Database file path:',
        validate: (value) => {
          if (!value.trim()) return 'Database path is required';

          // TODO: Use Path later
          if (!fs.existsSync(value.trim())) {
            return `File does not exist: ${value}`;
          }

          return true;
        },
      });

      // TODO: implement sqlite
      return undefined;
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

      const backupFilePath = (await createBackupFilePath(dbName)) as string;

      return {
        dbType,
        dbHost,
        dbPort: +dbPort,
        dbPassword,
        dbName,
        dbUser,
        backupFilePath,
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

async function start() {
  const operation = await selectOperation();
  if (operation === 'backup') {
    const config = await getBackupConfig();
    if (config) {
      await handleDBType(config);
    }
  }
}
start();
