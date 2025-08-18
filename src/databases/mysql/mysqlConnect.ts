import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import {
  extractOperationVersion,
  areVersionsCompatible,
} from '../../util/getVersions';
import { NetworkDBConfig } from '../../types';
import { backup } from '../../util/backupStreams';
import { restore } from '../../util/restoreStreams';

export async function mysqlConnect(
  configs: NetworkDBConfig,
  operationType: string,
) {
  let { dbHost, dbPassword, dbPort, dbName, dbUser } = configs;

  const targetDBName = dbName;

  if (operationType === 'restore') {
    dbName = 'mysql';
  }
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
        `Versions missmatch: Database: ${dbVersion}, mysqldump: ${mysqldumpVersion}`,
      );
    }

    if (operationType === 'backup') {
      await backup(configs);
    }

    if (operationType === 'restore') {
      const SQL = `CREATE DATABASE IF NOT EXISTS "${targetDBName}";`;
      await connection.query(SQL);

      const restoreConfig = {
        ...configs,
        dbName: targetDBName,
      };

      await restore(restoreConfig);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await connection.end();
  }
}
