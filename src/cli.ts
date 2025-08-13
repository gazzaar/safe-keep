import { input, password, select } from '@inquirer/prompts';
import { ConfigType, DBConfig, DBType, Operations } from './types';
import { pgBackup } from './databases/postgresql';

async function selectOperation(): Promise<Operations | undefined> {
  try {
    const operation: Operations = await select({
      message: 'Enter operation type',
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

async function getBackupConfig(): Promise<ConfigType | undefined> {
  try {
    const dbType: DBType = await select({
      message: 'Enter database type',
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
      message: 'Enter port number: (default 5432)',
      default: '5432',
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
      // validate: (value) => {
      //   if (value.trim().length <= 4) {
      //     return 'password must be more than 4 chcaracters';
      //   }
      //   return true;
      // },
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

    return { dbType, dbHost, dbPort: +dbPort, dbPassword, dbName, dbUser };
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
    await pgBackup(config as DBConfig);
  }
}
start();
