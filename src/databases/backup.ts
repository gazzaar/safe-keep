import { DatabaseConfig } from '../types';
import { pgConnect } from './postgresql/pgConnect';

export async function backup(config: DatabaseConfig) {
  switch (config.dbType) {
    case 'pg':
      await pgConnect(config);
      break;

    case 'MySql':
      // TODO: MySql function here
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
