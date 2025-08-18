import { execSync } from 'child_process';
import { Client } from 'pg';
import { NetworkDBConfig } from '../../types';
import { backup } from '../../util/backupStreams';
import {
  areVersionsCompatible,
  extractOperationVersion,
  extractPostgreSQLVersion,
} from '../../util/getVersions';
import { restore } from '../../util/restoreStreams';

export async function pgConnect(
  configs: NetworkDBConfig,
  operationType: string,
) {
  let { dbHost, dbPassword, dbPort, dbName, dbUser } = configs;

  const targetDBName = dbName;

  if (operationType === 'restore') {
    dbName = 'postgres';
  }

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

    if (operationType === 'backup') {
      await backup(configs);
    }
    if (operationType === 'restore') {
      const SQL = `CREATE DATABASE ${targetDBName};`;
      await client.query(SQL);

      const restoreConfig = {
        ...configs,
        dbName: targetDBName,
      };

      await restore(restoreConfig);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('⚠️ Error:', err.message);
    }
  } finally {
    client.end();
  }
}
