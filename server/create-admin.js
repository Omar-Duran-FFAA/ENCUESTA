import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const rl = createInterface({ input, output });
try {
  console.log('Crear administrador del sistema ACE 2026');
  const username = (await rl.question('Nombre de usuario (mínimo 4): ')).trim().toLowerCase();
  const password = await rl.question('Contraseña (mínimo 12 caracteres; se verá al escribir, usa una terminal privada): ');
  // Nota: readline.question muestra los caracteres tecleados en algunos terminales.
  // Para seguridad, crear desde un entorno privado sin capturas de pantalla.
  if (!/^[a-z0-9._-]{4,80}$/.test(username)) throw new Error('Usuario inválido: utiliza 4 a 80 letras, números, puntos, guiones o _.');
  if (password.length < 12) throw new Error('Usa una contraseña de 12 caracteres o más.');
  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO admins(username,password_hash) VALUES($1,$2)', [username, hash]);
  console.log('✔ Administrador creado. Entra en /admin.');
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
