import { Client } from 'pg';
import { NetworkDBConfig } from '../types';

const SQL = `
CREATE TABLE IF NOT EXISTS example (
    id INTEGER PRIMARY KEY
);
`;
export async function pgConnect(args: NetworkDBConfig) {
  const {
    dbHost,
    dbPort,
    dbPassword,
    dbName,
    dbUser,
    backupFileFormat,
    backupFilePath,
  } = args;
  const client = new Client({
    user: dbUser,
    host: dbHost,
    password: dbPassword,
    port: dbPort,
    database: dbName,
  });

  try {
    await client.connect();
    console.log('✨connected successfuly');
    await client.query(SQL);
    // TODO: perfom backup here
  } catch (err) {
    if (err instanceof Error) {
      console.error('⚠️ Error:', err.message);
    }
  } finally {
    await client.end();
    console.log('Finished');
  }
}
