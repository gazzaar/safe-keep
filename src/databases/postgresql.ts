import { Client } from 'pg';
import { DBConfig } from '../types';

const SQL = `
CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS test (
    course_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
`;

export async function pgBackup(args: DBConfig) {
  const { dbHost, dbPort, dbPassword, dbName, dbUser } = args;
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
    console.log('✨Tested  ');
  } catch (err) {
    if (err instanceof Error) {
      console.error('⚠️ Error:', err.message);
    }
  } finally {
    await client.end();
  }
}
