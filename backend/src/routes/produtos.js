const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/produtos  (listagem com filtros)
router.get('/', (req, res) => {
  const db = getDb();
  const { categoria, busca, destaque, pagina = 1, limite = 12, precoMin, precoMax, material, ordenar } = req.query;
  const offset = (parseInt(pagina) - 1) * parseInt(limite);

  let where = 'WHERE p.ativo = 1';
  const params = [];

  if (categoria) {
    where += ' AND c.slug = ?';
    params.push(categoria);
  }
  if (busca) {
    where += ' AND (p.nome LIKE ? OR p.descricao_curta LIKE ? OR p.tags LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  if (material) {
    where += ' AND p.tags LIKE ?';
    params.push(`%${material}%`);
  }
  if (precoMin) {
    where += ' AND COALESCE(p.preco_promocional, p.preco) >= ?';
    params.push(parseFloat(precoMin));
  }
  if (precoMax) {
    where += ' AND COALESCE(p.preco_promocional, p.preco) <= ?';
    params.push(parseFloat(precoMax));
  }
  if (destaque === 'true') {
    where += ' AND p.destaque = 1';
  }

  const total = db.prepare(`
    SELECT COUNT(*) as n FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ${where}
  `).get(...params);

  const produtos = db.prepare(`
    SELECT p.id, p.nome, p.slug, p.descricao_curta, p.preco, p.preco_promocional,
           p.imagem_principal, p.estoque, p.destaque, p.tags, p.vendas,
           c.nome as categoria_nome, c.slug as categoria_slug
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ${where}
    ORDER BY ${ordenar === 'vendas' ? 'p.vendas DESC' : 'p.destaque DESC, p.id ASC'}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limite), offset);

  res.json({
    produtos,
    paginacao: {
      total: total.n,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      totalPaginas: Math.ceil(total.n / parseInt(limite))
    }
  });
});

// GET /api/produtos/destaque  (para a home)
router.get('/destaque', (req, res) => {
  const db = getDb();
  const produtos = db.prepare(`
    SELECT p.id, p.nome, p.slug, p.descricao_curta, p.preco, p.preco_promocional,
           p.imagem_principal, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = 1 AND p.destaque = 1
    LIMIT 6
  `).all();
  res.json(produtos);
});

// GET /api/produtos/:slug  (produto individual)
router.get('/:slug', (req, res) => {
  const db = getDb();
  const produto = db.prepare(`
    SELECT p.*, c.nome as categoria_nome, c.slug as categoria_slug
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.slug = ? AND p.ativo = 1
  `).get(req.params.slug);

  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  // Avaliações aprovadas
  const avaliacoes = db.prepare(`
    SELECT a.nota, a.titulo, a.texto, a.criado_em, u.nome as usuario_nome
    FROM avaliacoes a
    JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.produto_id = ? AND a.aprovada = 1
    ORDER BY a.criado_em DESC
  `).all(produto.id);

  const mediaNota = avaliacoes.length
    ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null;

  res.json({ ...produto, avaliacoes, media_nota: mediaNota });
});

// GET /api/categorias
router.get('/meta/categorias', (req, res) => {
  const db = getDb();
  const categorias = db.prepare(
    'SELECT * FROM categorias ORDER BY ordem ASC'
  ).all();
  res.json(categorias);
});

module.exports = router;
