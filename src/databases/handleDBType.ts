import { DatabaseConfig } from '../types';
import { mysqlConnect } from './mysql/mysqlConnect';
import { pgConnect } from './postgresql/pgConnect';

export async function handleDBType(config: DatabaseConfig) {
  switch (config.dbType) {
    case 'pg':
      await pgConnect(config);
      break;

    case 'MySql':
      await mysqlConnect(config);
      break;

    case 'mongodb':
      // TODO: mongodb function here
      break;

    case 'sqlite':
      // TODO: sqlite function here
      break;
    default:
      const exhaustiveCheck: never = config;
      throw new Error(`Unsupported database type`);
  }
}
