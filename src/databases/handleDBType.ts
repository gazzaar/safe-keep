import { DatabaseConfig } from '../types';
import { mysqlConnect } from './mysql/mysqlConnect';
import { pgConnect } from './postgresql/pgConnect';

export async function handleDBType(
  config: DatabaseConfig,
  operationType: string,
) {
  switch (config.dbType) {
    case 'pg':
      await pgConnect(config, operationType);
      break;

    case 'MySql':
      await mysqlConnect(config, operationType);
      break;

    case 'mongodb':
      // TODO: mongodb function here
      throw new Error(`Unsupported database type`);
      break;

    case 'sqlite':
      // TODO: sqlite function here

      throw new Error(`Unsupported database type`);
      break;
    default:
      const exhaustiveCheck: never = config;
      throw new Error(`Unsupported database type`);
  }
}
