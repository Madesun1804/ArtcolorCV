const axios = require('axios');

const BASE_URL = process.env.ME_SANDBOX === 'false'
  ? 'https://melhorenvio.com.br/api/v2'
  : 'https://sandbox.melhorenvio.com.br/api/v2';

const CEP_ORIGEM = '85760000'; // Capanema - PR

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.ME_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Artcolor Comunicação Visual (admin@artcolor.com.br)',
  }
});

// Calcula opções de frete para um CEP destino
async function calcularFrete({ cepDestino, peso = 1, altura = 10, largura = 30, comprimento = 30 }) {
  const cep = cepDestino.replace(/\D/g, '');

  // Entrega local: Capanema e cidades vizinhas (CEPs 85760xxx–85799xxx)
  const prefixo = parseInt(cep.slice(0, 5));
  const isLocal = prefixo >= 85760 && prefixo <= 85799;

  const opcoes = [];

  if (isLocal) {
    opcoes.push({
      id: 'local',
      nome: 'Entrega Local',
      empresa: 'Artcolor',
      prazo: '1–2 dias úteis',
      preco: 15.00,
      logo: null
    });
  }

  // Consulta Melhor Envio para envio nacional
  try {
    const { data } = await api.post('/me/shipment/calculate', {
      from: { postal_code: CEP_ORIGEM },
      to:   { postal_code: cep },
      package: { height: altura, width: largura, length: comprimento, weight: peso },
      options: { receipt: false, own_hand: false },
      services: '1,2,3,4,17'  // PAC, SEDEX, SEDEX 10, SEDEX Hoje, Mini Envios
    });

    data.forEach(s => {
      if (s.error || !s.price) return;
      opcoes.push({
        id: String(s.id),
        nome: s.name,
        empresa: s.company?.name || '',
        prazo: `${s.delivery_time} dia${s.delivery_time !== 1 ? 's' : ''} úteis`,
        preco: parseFloat(s.price),
        logo: s.company?.picture || null
      });
    });
  } catch (e) {
    console.warn('[MelhorEnvio] Erro ao calcular frete:', e.message);
  }

  return opcoes.sort((a, b) => a.preco - b.preco);
}

module.exports = { calcularFrete };
