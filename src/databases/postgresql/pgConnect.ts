import { execSync } from 'child_process';
import { Client } from 'pg';
import { NetworkDBConfig } from '../../types';
import { backup } from '../../util/backupStreams';
import {
  areVersionsCompatible,
  extractOperationVersion,
  extractPostgreSQLVersion,
} from '../../util/getVersions';

export async function pgConnect(args: NetworkDBConfig) {
  const { dbHost, dbPassword, dbPort, dbName, dbUser } = args;
  const client = new Client({
    user: dbUser,
    host: dbHost,
    password: dbPassword,
    port: dbPort,
    database: dbName,
  });

  try {
    await client.connect();
    console.log('✨ Connected successfuly');
    const { rows } = await client.query('SELECT version();');
    const dbVersion = extractPostgreSQLVersion(rows[0].version);
    const pgDump = execSync('pg_dump --version', { encoding: 'utf8' });
    const pgDumpVersion = extractOperationVersion(pgDump);
    if (!areVersionsCompatible(dbVersion, pgDumpVersion)) {
      throw new Error(
        `Versions missmatch: Database: ${dbVersion}, pg_dump: ${pgDumpVersion}`,
      );
    }

    await backup(args);
  } catch (err) {
    if (err instanceof Error) {
      console.error('⚠️ Error:', err.message);
    }
  } finally {
    client.end();
  }
}
