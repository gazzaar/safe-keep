export type DBType = 'pg' | 'MySql' | 'mongodb' | 'sqlite';
export type Operations = 'backup' | 'restore';

export interface NetworkDBConfig {
  dbType: DBType;
  dbHost: string;
  dbPort: number;
  dbPassword: string;
  dbName: string;
  dbUser: string;
  backupFilePath: string;
}

export interface SqliteDBConfig {
  dbType: 'sqlite';
  dbPath: string;
  backupFilePath: string;
}

export type DatabaseConfig = NetworkDBConfig | SqliteDBConfig;
