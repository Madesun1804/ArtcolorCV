const express = require('express');
const { getDb } = require('../db/database');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// ── Dashboard ──────────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
router.get('/dashboard', adminMiddleware, (req, res) => {
  const db = getDb();

  const totalPedidos   = db.prepare("SELECT COUNT(*) as n FROM pedidos").get().n;
  const pedidosPagos   = db.prepare("SELECT COUNT(*) as n FROM pedidos WHERE status != 'aguardando_pagamento' AND status != 'cancelado'").get().n;
  const receitaTotal   = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM pedidos WHERE status != 'cancelado' AND status != 'aguardando_pagamento'").get().v;
  const totalClientes  = db.prepare("SELECT COUNT(*) as n FROM usuarios WHERE tipo = 'cliente'").get().n;
  const estoqueAlerta  = db.prepare("SELECT COUNT(*) as n FROM produtos WHERE estoque <= 3 AND ativo = 1").get().n;

  const pedidosRecentes = db.prepare(`
    SELECT p.numero, p.status, p.total, p.criado_em, u.nome as cliente
    FROM pedidos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY p.criado_em DESC LIMIT 5
  `).all();

  res.json({ totalPedidos, pedidosPagos, receitaTotal, totalClientes, estoqueAlerta, pedidosRecentes });
});

// ── Pedidos ────────────────────────────────────────────────────────────────────

// GET /api/admin/pedidos
router.get('/pedidos', adminMiddleware, (req, res) => {
  const db = getDb();
  const { status, pagina = 1 } = req.query;
  const limite = 20;
  const offset = (parseInt(pagina) - 1) * limite;

  let where = '';
  const params = [];
  if (status) { where = 'WHERE p.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as n FROM pedidos p ${where}`).get(...params).n;
  const pedidos = db.prepare(`
    SELECT p.*, u.nome as cliente_nome, u.email as cliente_email
    FROM pedidos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    ${where}
    ORDER BY p.criado_em DESC
    LIMIT ? OFFSET ?
  `).all(...params, limite, offset);

  res.json({ pedidos, total, totalPaginas: Math.ceil(total / limite) });
});

// PUT /api/admin/pedidos/:id/status
router.put('/pedidos/:id/status', adminMiddleware, (req, res) => {
  const { status } = req.body;
  const statusValidos = ['aguardando_pagamento', 'pago', 'em_producao', 'enviado', 'entregue', 'cancelado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  const db = getDb();
  const result = db.prepare(
    "UPDATE pedidos SET status = ?, atualizado_em = datetime('now','localtime') WHERE id = ?"
  ).run(status, req.params.id);

  if (!result.changes) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  console.log(`[ADMIN] Pedido #${req.params.id} → ${status}`);
  res.json({ mensagem: 'Status atualizado!' });
});

// ── Produtos ───────────────────────────────────────────────────────────────────

// GET /api/admin/produtos
router.get('/produtos', adminMiddleware, (req, res) => {
  const db = getDb();
  const produtos = db.prepare(`
    SELECT p.*, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `).all();
  res.json(produtos);
});

// POST /api/admin/produtos
router.post('/produtos', adminMiddleware, (req, res) => {
  const { nome, slug, descricao, descricao_curta, preco, preco_promocional, categoria_id, imagem_principal, estoque, destaque, tags } = req.body;

  if (!nome || !preco) {
    return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
  }

  const slugFinal = slug || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO produtos (nome, slug, descricao, descricao_curta, preco, preco_promocional, categoria_id, imagem_principal, estoque, destaque, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nome, slugFinal, descricao || null, descricao_curta || null,
    parseFloat(preco), preco_promocional ? parseFloat(preco_promocional) : null,
    categoria_id || null, imagem_principal || null,
    parseInt(estoque) || 0, destaque ? 1 : 0,
    JSON.stringify(tags || [])
  );

  res.status(201).json({ mensagem: 'Produto criado!', id: result.lastInsertRowid });
});

// PUT /api/admin/produtos/:id
router.put('/produtos/:id', adminMiddleware, (req, res) => {
  const { nome, slug, descricao, descricao_curta, preco, preco_promocional, categoria_id, imagem_principal, estoque, destaque, ativo, tags } = req.body;

  const db = getDb();
  const result = db.prepare(`
    UPDATE produtos SET
      nome = ?, slug = ?, descricao = ?, descricao_curta = ?,
      preco = ?, preco_promocional = ?, categoria_id = ?,
      imagem_principal = ?, estoque = ?, destaque = ?, ativo = ?, tags = ?
    WHERE id = ?
  `).run(
    nome, slug, descricao || null, descricao_curta || null,
    parseFloat(preco), preco_promocional ? parseFloat(preco_promocional) : null,
    categoria_id || null, imagem_principal || null,
    parseInt(estoque) || 0, destaque ? 1 : 0, ativo !== false ? 1 : 0,
    JSON.stringify(tags || []),
    req.params.id
  );

  if (!result.changes) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json({ mensagem: 'Produto atualizado!' });
});

// DELETE /api/admin/produtos/:id  (desativa, não exclui)
router.delete('/produtos/:id', adminMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ mensagem: 'Produto desativado.' });
});

// ── Usuários ───────────────────────────────────────────────────────────────────

// GET /api/admin/usuarios
router.get('/usuarios', adminMiddleware, (req, res) => {
  const db = getDb();
  const usuarios = db.prepare(`
    SELECT id, nome, email, telefone, tipo, ativo, criado_em,
           (SELECT COUNT(*) FROM pedidos WHERE usuario_id = usuarios.id) as total_pedidos
    FROM usuarios
    ORDER BY criado_em DESC
  `).all();
  res.json(usuarios);
});

// PUT /api/admin/usuarios/:id/ativo
router.put('/usuarios/:id/ativo', adminMiddleware, (req, res) => {
  const { ativo } = req.body;
  const db = getDb();
  db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(ativo ? 1 : 0, req.params.id);
  res.json({ mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'}.` });
});

// ── Categorias ─────────────────────────────────────────────────────────────────

// GET /api/admin/categorias
router.get('/categorias', adminMiddleware, (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM categorias ORDER BY ordem ASC').all();
  res.json(cats);
});

// POST /api/admin/categorias
router.post('/categorias', adminMiddleware, (req, res) => {
  const { nome, slug, descricao, ordem } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  const db = getDb();
  const slugFinal = slug || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const result = db.prepare(
    'INSERT INTO categorias (nome, slug, descricao, ordem) VALUES (?, ?, ?, ?)'
  ).run(nome, slugFinal, descricao || null, parseInt(ordem) || 0);
  res.status(201).json({ mensagem: 'Categoria criada!', id: result.lastInsertRowid });
});

module.exports = router;
