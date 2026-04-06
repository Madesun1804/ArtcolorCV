/**
 * Atualiza as imagens dos produtos no banco para usar SVG.
 * Execute com: node src/db/fix-images.js
 */
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../../artcolor.db');
const db = new Database(dbPath);

const updates = [
  { slug: 'fachada-acm',                  img: '/uploads/placeholder-acm.svg' },
  { slug: 'letreiro-neon-led',            img: '/uploads/placeholder-neon.svg' },
  { slug: 'envelopamento-veicular-completo', img: '/uploads/placeholder-envelopamento.svg' },
  { slug: 'placa-acrilico',               img: '/uploads/placeholder-acrilico.svg' },
  { slug: 'banner-lona',                  img: '/uploads/placeholder-banner.svg' },
];

const stmt = db.prepare('UPDATE produtos SET imagem_principal = ? WHERE slug = ?');
updates.forEach(({ slug, img }) => {
  const info = stmt.run(img, slug);
  console.log(`${slug}: ${info.changes ? '✅ atualizado' : '⚠️ não encontrado'}`);
});

db.close();
console.log('Concluído.');
