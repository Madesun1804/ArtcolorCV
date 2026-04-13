const express = require('express');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { obterOuCriarCliente, criarCobranca, obterPixQrCode, consultarPagamento } = require('../services/asaas');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

function gerarNumeroPedido() {
  return 'ART' + Date.now().toString().slice(-8);
}

function dataVencimento(dias = 3) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

// POST /api/pagamento/criar
// Cria pedido no DB + cobrança no Asaas
router.post('/criar', authMiddleware, async (req, res) => {
  const { itens, frete, enderecoEntrega, metodo, cliente, cartao } = req.body;

  if (!itens?.length || !metodo || !enderecoEntrega) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  const metodosValidos = ['PIX', 'BOLETO', 'CREDIT_CARD'];
  if (!metodosValidos.includes(metodo)) {
    return res.status(400).json({ erro: 'Método de pagamento inválido.' });
  }

  const db = getDb();

  try {
    // Calcula valores
    const subtotal = itens.reduce((s, i) => s + (i.preco * i.quantidade), 0);
    const valorFrete = frete?.preco || 0;
    const total = subtotal + valorFrete;

    // Cria pedido no banco
    const numero = gerarNumeroPedido();
    const pedidoResult = db.prepare(`
      INSERT INTO pedidos
        (numero, usuario_id, status, subtotal, frete, total, endereco_entrega,
         metodo_pagamento, frete_servico, frete_prazo, cep_entrega)
      VALUES (?, ?, 'aguardando_pagamento', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      numero, req.usuario.id, subtotal, valorFrete, total,
      JSON.stringify(enderecoEntrega), metodo,
      frete?.nome || null, frete?.prazo || null,
      enderecoEntrega.cep || null
    );

    const pedidoId = pedidoResult.lastInsertRowid;

    // Insere itens do pedido
    const insertItem = db.prepare(`
      INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, preco_unitario, quantidade, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    itens.forEach(i => insertItem.run(pedidoId, i.id, i.nome, i.preco, i.quantidade, i.preco * i.quantidade));

    // Cria ou recupera cliente no Asaas
    const clienteAsaas = await obterOuCriarCliente({
      nome:     cliente.nome,
      email:    cliente.email,
      cpfCnpj:  cliente.cpfCnpj,
      telefone: cliente.telefone
    });

    // Cria cobrança
    const descricao = `Pedido ${numero} — Artcolor`;
    const cobranca = await criarCobranca({
      clienteId: clienteAsaas.id,
      valor:     total,
      descricao,
      metodo,
      vencimento: dataVencimento(3),
      cartao
    });

    // Atualiza pedido com ID do pagamento
    db.prepare(`
      UPDATE pedidos SET pagamento_id = ?, pagamento_link = ?, atualizado_em = datetime('now','localtime')
      WHERE id = ?
    `).run(cobranca.id, cobranca.invoiceUrl || null, pedidoId);

    // Monta resposta conforme método
    const resposta = { numero, pedidoId, total, metodo, pagamentoId: cobranca.id };

    if (metodo === 'PIX') {
      try {
        const pix = await obterPixQrCode(cobranca.id);
        resposta.pix = { qrCode: pix.encodedImage, payload: pix.payload, expiracao: pix.expirationDate };
      } catch (pixErr) {
        console.warn('[Pagamento] QR Code Pix indisponível:', pixErr.response?.data || pixErr.message);
        // Fallback: envia link da fatura para o cliente pagar
        resposta.pix = { invoiceUrl: cobranca.invoiceUrl };
      }
    } else if (metodo === 'BOLETO') {
      resposta.boleto = { url: cobranca.bankSlipUrl, linha: cobranca.nossoNumero };
    } else if (metodo === 'CREDIT_CARD') {
      resposta.cartao = { status: cobranca.status };
    }

    res.json(resposta);

  } catch (e) {
    console.error('[Pagamento]', e.response?.data || e.message);
    res.status(500).json({ erro: 'Erro ao processar pagamento. Tente novamente.' });
  }
});

// POST /api/pagamento/webhook — recebe notificações do Asaas
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const evento = JSON.parse(req.body);
    if (!evento?.payment?.id) return res.sendStatus(200);

    const db = getDb();
    const { id: pagamentoId, status } = evento.payment;

    const mapa = {
      CONFIRMED:  'pago',
      RECEIVED:   'pago',
      OVERDUE:    'vencido',
      REFUNDED:   'reembolsado',
      CANCELLED:  'cancelado',
    };

    const novoStatus = mapa[status];
    if (novoStatus) {
      db.prepare(`
        UPDATE pedidos SET status = ?, pagamento_status = ?, atualizado_em = datetime('now','localtime')
        WHERE pagamento_id = ?
      `).run(novoStatus, status, pagamentoId);
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('[Webhook]', e.message);
    res.sendStatus(500);
  }
});

// GET /api/pagamento/status/:pedidoId
router.get('/status/:pedidoId', authMiddleware, async (req, res) => {
  const db = getDb();
  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?')
    .get(req.params.pedidoId, req.usuario.id);

  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  let statusAsaas = null;
  if (pedido.pagamento_id) {
    try {
      const pag = await consultarPagamento(pedido.pagamento_id);
      statusAsaas = pag.status;
    } catch (_) {}
  }

  res.json({ status: pedido.status, statusAsaas, total: pedido.total });
});

module.exports = router;
