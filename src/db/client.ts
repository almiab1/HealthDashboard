import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import 'dotenv/config';

// Crear el pool de conexión
const connection = await mysql.createPool({
  uri: process.env.DATABASE_URL
});

export const db = drizzle(connection, { schema, mode: 'default' });
