const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'artcolor.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    -- Categorias
    CREATE TABLE IF NOT EXISTS categorias (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL,
      slug      TEXT NOT NULL UNIQUE,
      descricao TEXT,
      ordem     INTEGER DEFAULT 0
    );

    -- Produtos
    CREATE TABLE IF NOT EXISTS produtos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      nome              TEXT NOT NULL,
      slug              TEXT NOT NULL UNIQUE,
      descricao         TEXT,
      descricao_curta   TEXT,
      preco             REAL NOT NULL,
      preco_promocional REAL,
      categoria_id      INTEGER REFERENCES categorias(id),
      imagem_principal  TEXT,
      estoque           INTEGER DEFAULT 0,
      ativo             INTEGER DEFAULT 1,
      destaque          INTEGER DEFAULT 0,
      tags              TEXT DEFAULT '[]',
      vendas            INTEGER DEFAULT 0,
      criado_em         TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Usuários
    CREATE TABLE IF NOT EXISTS usuarios (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nome             TEXT NOT NULL,
      email            TEXT NOT NULL UNIQUE,
      senha_hash       TEXT NOT NULL,
      telefone         TEXT,
      cpf_cnpj         TEXT,
      tipo             TEXT DEFAULT 'cliente',
      email_verificado INTEGER DEFAULT 0,
      ativo            INTEGER DEFAULT 1,
      criado_em        TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Endereços
    CREATE TABLE IF NOT EXISTS enderecos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
      apelido     TEXT DEFAULT 'Principal',
      cep         TEXT,
      logradouro  TEXT,
      numero      TEXT,
      complemento TEXT,
      bairro      TEXT,
      cidade      TEXT,
      estado      TEXT,
      principal   INTEGER DEFAULT 0
    );

    -- Pedidos
    CREATE TABLE IF NOT EXISTS pedidos (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      numero           TEXT NOT NULL UNIQUE,
      usuario_id       INTEGER REFERENCES usuarios(id),
      status           TEXT DEFAULT 'aguardando_pagamento',
      subtotal         REAL NOT NULL,
      frete            REAL DEFAULT 0,
      desconto         REAL DEFAULT 0,
      total            REAL NOT NULL,
      endereco_entrega TEXT,
      metodo_pagamento TEXT,
      observacoes      TEXT,
      pagamento_id     TEXT,
      pagamento_status TEXT,
      pagamento_link   TEXT,
      frete_servico    TEXT,
      frete_prazo      TEXT,
      cep_entrega      TEXT,
      criado_em        TEXT DEFAULT (datetime('now','localtime')),
      atualizado_em    TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Itens do pedido
    CREATE TABLE IF NOT EXISTS itens_pedido (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id       INTEGER NOT NULL REFERENCES pedidos(id),
      produto_id      INTEGER REFERENCES produtos(id),
      nome_produto    TEXT NOT NULL,
      preco_unitario  REAL NOT NULL,
      quantidade      INTEGER NOT NULL,
      subtotal        REAL NOT NULL
    );

    -- Avaliações
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL REFERENCES produtos(id),
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      pedido_id  INTEGER REFERENCES pedidos(id),
      nota       INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
      titulo     TEXT,
      texto      TEXT,
      aprovada   INTEGER DEFAULT 0,
      criado_em  TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Migrações para colunas adicionadas após criação inicial
  const migrations = [
    'ALTER TABLE produtos ADD COLUMN vendas INTEGER DEFAULT 0',
    'ALTER TABLE pedidos ADD COLUMN pagamento_id TEXT',
    'ALTER TABLE pedidos ADD COLUMN pagamento_status TEXT',
    'ALTER TABLE pedidos ADD COLUMN pagamento_link TEXT',
    'ALTER TABLE pedidos ADD COLUMN frete_servico TEXT',
    'ALTER TABLE pedidos ADD COLUMN frete_prazo TEXT',
    'ALTER TABLE pedidos ADD COLUMN cep_entrega TEXT',
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* coluna já existe */ }
  }

  console.log('✅ Banco de dados inicializado.');
  seedIfEmpty(db);
}

function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) as n FROM produtos').get();
  if (count.n > 0) return;

  console.log('🌱 Inserindo dados iniciais...');

  // Categorias
  const insertCat = db.prepare(`
    INSERT INTO categorias (nome, slug, descricao, ordem) VALUES (?, ?, ?, ?)
  `);
  insertCat.run('Fachadas em ACM', 'fachadas-acm', 'Fachadas e painéis em ACM de alta durabilidade', 1);
  insertCat.run('Neon LED', 'neon-led', 'Letreiros e luminosos em Neon LED', 2);
  insertCat.run('Envelopamento', 'envelopamento', 'Envelopamento veicular e de superfícies', 3);
  insertCat.run('Acrílico', 'acrilico', 'Placas e letras caixa em acrílico', 4);
  insertCat.run('Impressos', 'impressos', 'Banners, lonas e materiais impressos', 5);

  // 5 produtos teste
  const insertProd = db.prepare(`
    INSERT INTO produtos
      (nome, slug, descricao, descricao_curta, preco, preco_promocional, categoria_id, imagem_principal, estoque, destaque, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProd.run(
    'Fachada em ACM',
    'fachada-acm',
    'Fachada comercial em chapa ACM (Alumínio Composto) com acabamento premium. Ideal para lojas, clínicas e escritórios. Resistente a intempéries, UV e corrosão. Inclui estrutura de fixação e instalação.',
    'Fachada comercial em ACM com acabamento premium e instalação inclusa.',
    850.00, null, 1,
    'https://madesun1804.github.io/ArtcolorCV/assets/fachada-acm.png',
    10, 1,
    '["fachada","acm","comercial","painel"]'
  );

  insertProd.run(
    'Letreiro Neon LED',
    'letreiro-neon-led',
    'Letreiro personalizado em Neon LED flexível. Escolha a cor, o texto e o tamanho. Baixo consumo de energia, alta durabilidade (50.000h) e efeito visual impactante. Perfeito para fachadas, eventos e decoração.',
    'Letreiro personalizado em Neon LED com alta durabilidade e baixo consumo.',
    1200.00, 980.00, 2,
    'https://madesun1804.github.io/ArtcolorCV/assets/letreiro-neon-led.jpg',
    8, 1,
    '["neon","led","luminoso","letreiro","personalizado"]'
  );

  insertProd.run(
    'Envelopamento Veicular Completo',
    'envelopamento-veicular-completo',
    'Envelopamento total do veículo com vinil de alta qualidade. Protege a pintura original, valoriza o visual e serve como mídia publicitária. Aplicado por profissionais certificados com garantia de 2 anos.',
    'Envelopamento total com vinil premium, protege a pintura e valoriza o veículo.',
    2500.00, null, 3,
    '/uploads/placeholder-envelopamento.svg',
    5, 0,
    '["envelopamento","vinil","carro","publicidade"]'
  );

  insertProd.run(
    'Placa em Acrílico',
    'placa-acrilico',
    'Placa em acrílico cristal ou colorido, cortada a laser com precisão milimétrica. Disponível em diversas espessuras e acabamentos: polido, jateado ou impresso. Tamanhos sob medida.',
    'Placa em acrílico cortada a laser, diversas cores e espessuras.',
    320.00, 280.00, 4,
    '/uploads/placeholder-acrilico.svg',
    20, 0,
    '["placa","acrilico","laser","sinalização"]'
  );

  insertProd.run(
    'Banner em Lona',
    'banner-lona',
    'Banner impresso em lona de alta resolução (440g/m²). Cores vibrantes e duráveis, resistente ao sol e à chuva. Impressão em 4 cores com acabamento em ilhoses e reforço nas bordas. Entrega rápida.',
    'Banner impresso em lona 440g, resistente ao sol e chuva, com ilhoses.',
    89.90, null, 5,
    '/uploads/placeholder-banner.svg',
    50, 0,
    '["banner","lona","impressão","publicidade"]'
  );

  // Admin padrão
  const bcrypt = require('bcryptjs');
  const senhaHash = bcrypt.hashSync('artcolor2026', 10);
  db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, tipo, email_verificado)
    VALUES (?, ?, ?, 'admin', 1)
  `).run('Admin', 'admin@artcolor.com.br', senhaHash);

  console.log('✅ Dados iniciais inseridos.');
  console.log('   Admin: Admin / artcolor2026');
}

module.exports = { getDb, initDb };
