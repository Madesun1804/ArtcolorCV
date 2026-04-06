const express = require('express');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function gerarNumeroPedido() {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ART-${ano}-${rand}`;
}

// POST /api/pedidos  (criar pedido — requer login)
router.post('/', authMiddleware, (req, res) => {
  const { itens, endereco_entrega, metodo_pagamento, observacoes } = req.body;

  if (!itens || !itens.length) {
    return res.status(400).json({ erro: 'O carrinho está vazio.' });
  }
  if (!endereco_entrega) {
    return res.status(400).json({ erro: 'Endereço de entrega é obrigatório.' });
  }
  if (!metodo_pagamento) {
    return res.status(400).json({ erro: 'Método de pagamento é obrigatório.' });
  }

  const db = getDb();

  // Verificar estoque e calcular subtotal
  let subtotal = 0;
  const itensValidados = [];

  for (const item of itens) {
    const produto = db.prepare(
      'SELECT id, nome, preco, preco_promocional, estoque FROM produtos WHERE id = ? AND ativo = 1'
    ).get(item.produto_id);

    if (!produto) {
      return res.status(400).json({ erro: `Produto ID ${item.produto_id} não encontrado.` });
    }
    if (produto.estoque < item.quantidade) {
      return res.status(400).json({ erro: `Estoque insuficiente para "${produto.nome}".` });
    }

    const preco = produto.preco_promocional || produto.preco;
    itensValidados.push({
      produto_id: produto.id,
      nome_produto: produto.nome,
      preco_unitario: preco,
      quantidade: item.quantidade,
      subtotal: preco * item.quantidade
    });
    subtotal += preco * item.quantidade;
  }

  const frete = subtotal >= 500 ? 0 : 25.00; // frete grátis acima de R$500
  const total = subtotal + frete;
  const numero = gerarNumeroPedido();

  const criarPedido = db.transaction(() => {
    const pedidoResult = db.prepare(`
      INSERT INTO pedidos (numero, usuario_id, subtotal, frete, total, endereco_entrega, metodo_pagamento, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_pagamento')
    `).run(
      numero,
      req.usuario.id,
      subtotal,
      frete,
      total,
      JSON.stringify(endereco_entrega),
      metodo_pagamento,
      observacoes || null
    );

    const pedidoId = pedidoResult.lastInsertRowid;

    for (const item of itensValidados) {
      db.prepare(`
        INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, preco_unitario, quantidade, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(pedidoId, item.produto_id, item.nome_produto, item.preco_unitario, item.quantidade, item.subtotal);

      // Baixar estoque
      db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?')
        .run(item.quantidade, item.produto_id);
    }

    return pedidoId;
  });

  const pedidoId = criarPedido();
  console.log(`[PEDIDO] Novo pedido ${numero} — usuário ${req.usuario.email}`);

  res.status(201).json({
    mensagem: 'Pedido criado com sucesso!',
    numero,
    subtotal,
    frete,
    total,
    status: 'aguardando_pagamento'
  });
});

// GET /api/pedidos/meus  (pedidos do usuário logado)
router.get('/meus', authMiddleware, (req, res) => {
  const db = getDb();
  const pedidos = db.prepare(`
    SELECT id, numero, status, subtotal, frete, total, metodo_pagamento, criado_em
    FROM pedidos
    WHERE usuario_id = ?
    ORDER BY criado_em DESC
  `).all(req.usuario.id);

  res.json(pedidos);
});

// GET /api/pedidos/:numero  (detalhe de um pedido — dono ou admin)
router.get('/:numero', authMiddleware, (req, res) => {
  const db = getDb();
  const pedido = db.prepare('SELECT * FROM pedidos WHERE numero = ?').get(req.params.numero);

  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  // Apenas o dono ou admin pode ver
  if (pedido.usuario_id !== req.usuario.id && req.usuario.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  const itens = db.prepare(
    'SELECT * FROM itens_pedido WHERE pedido_id = ?'
  ).all(pedido.id);

  res.json({
    ...pedido,
    endereco_entrega: JSON.parse(pedido.endereco_entrega || '{}'),
    itens
  });
});

module.exports = router;
