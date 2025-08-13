export type DBType = 'pg' | 'MySql' | 'mongodb' | 'sqlite';
export type Operations = 'backup' | 'restore';

export interface ConfigType {
  dbType: DBType;
  dbHost: string;
  dbPort: number;
  dbPassword: string;
  dbName: string;
  dbUser: string;
}

export type DBConfig = Omit<ConfigType, 'dbType'>;
