export type DBType = 'pg' | 'MySql' | 'mongodb' | 'sqlite';
export type Operations = 'backup' | 'restore';

export interface NetworkDBConfig {
  dbType: DBType;
  dbHost: string;
  dbPort: number;
  dbPassword: string;
  dbName: string;
  dbUser: string;
}

export interface SqliteDBConfig {
  dbType: 'sqlite';
  dbPath: string;
}

export type DatabaseConfig = NetworkDBConfig | SqliteDBConfig;
