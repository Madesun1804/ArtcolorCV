/**
 * Atualiza (ou cria) o usuário admin com as credenciais corretas.
 * Execute com: node src/db/update-admin.js
 */
const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../../../artcolor.db');
const db = new Database(dbPath);

const senhaHash = bcrypt.hashSync('artcolor2026', 10);

const existente = db.prepare("SELECT id FROM usuarios WHERE tipo = 'admin'").get();

if (existente) {
  db.prepare(`
    UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, ativo = 1 WHERE id = ?
  `).run('Admin', 'admin@artcolor.com.br', senhaHash, existente.id);
  console.log('✅ Admin atualizado: Admin / artcolor2026');
} else {
  db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, tipo, email_verificado, ativo)
    VALUES (?, ?, ?, 'admin', 1, 1)
  `).run('Admin', 'admin@artcolor.com.br', senhaHash);
  console.log('✅ Admin criado: Admin / artcolor2026');
}

db.close();
