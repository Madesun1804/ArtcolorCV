const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '../../artcolor.db'));

// Adiciona coluna vendas se não existir
try {
  db.exec('ALTER TABLE produtos ADD COLUMN vendas INTEGER DEFAULT 0');
  console.log('✅ Coluna vendas adicionada.');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  Coluna vendas já existe.');
  } else throw e;
}

// Define vendas para os 2 produtos destaque
db.prepare("UPDATE produtos SET vendas = 47 WHERE slug = 'fachada-acm'").run();
db.prepare("UPDATE produtos SET vendas = 31 WHERE slug = 'letreiro-neon-led'").run();

const rows = db.prepare('SELECT id, nome, vendas FROM produtos ORDER BY vendas DESC').all();
console.log('Produtos:');
rows.forEach(r => console.log(`  [${r.id}] ${r.nome} — ${r.vendas} vendas`));

db.close();
