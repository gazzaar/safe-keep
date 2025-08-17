import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import {
  extractOperationVersion,
  areVersionsCompatible,
} from '../../util/getVersions';
import { NetworkDBConfig } from '../../types';
import { backup } from '../../util/backupStreams';

export async function mysqlConnect(configs: NetworkDBConfig) {
  const { dbHost, dbPassword, dbPort, dbName, dbUser } = configs;

  const connection = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    port: +dbPort,
    database: dbName,
    password: dbPassword,
  });

  try {
    const [rows] = await connection.query('SELECT version()');
    const dbVersion = rows[0]['version()'];
    const dumpVersion = execSync('mysqldump --version', {
      encoding: 'utf8',
    });
    const mysqldumpVersion = extractOperationVersion(dumpVersion);
    if (!areVersionsCompatible(dbVersion, mysqldumpVersion)) {
      throw new Error(
        `Versions missmatch: Database: ${dbVersion}, pg_dump: ${mysqldumpVersion}`,
      );
    }

    await backup(configs);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await connection.end();
  }
}
