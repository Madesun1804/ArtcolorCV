const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '../../artcolor.db'));

const colunas = [
  ['pagamento_id',     'TEXT'],
  ['pagamento_status', 'TEXT'],
  ['pagamento_link',   'TEXT'],
  ['frete_servico',    'TEXT'],
  ['frete_prazo',      'TEXT'],
  ['cep_entrega',      'TEXT'],
];

colunas.forEach(([col, tipo]) => {
  try {
    db.exec(`ALTER TABLE pedidos ADD COLUMN ${col} ${tipo}`);
    console.log(`✅ Coluna ${col} adicionada.`);
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log(`ℹ️  ${col} já existe.`);
    } else throw e;
  }
});

db.close();
console.log('Migração concluída.');
