const express = require('express');
const { calcularFrete } = require('../services/melhorenvio');

const router = express.Router();

// POST /api/frete/calcular
// body: { cep, peso?, altura?, largura?, comprimento? }
router.post('/calcular', async (req, res) => {
  const { cep, peso, altura, largura, comprimento } = req.body;

  if (!cep || cep.replace(/\D/g, '').length !== 8) {
    return res.status(400).json({ erro: 'CEP inválido.' });
  }

  try {
    const opcoes = await calcularFrete({ cepDestino: cep, peso, altura, largura, comprimento });
    if (!opcoes.length) {
      return res.status(422).json({ erro: 'Nenhuma opção de frete disponível para este CEP.' });
    }
    res.json({ opcoes });
  } catch (e) {
    console.error('[Frete]', e.message);
    res.status(500).json({ erro: 'Erro ao calcular frete.' });
  }
});

module.exports = router;
