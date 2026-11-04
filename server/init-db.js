import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

try {
  const sql = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
  await pool.query(sql);
  console.log('✔ Tablas y índices creados/verificados en PostgreSQL.');
} catch (error) {
  console.error('No se pudo inicializar la base de datos:', error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
