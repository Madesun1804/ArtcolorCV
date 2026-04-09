const axios = require('axios');

const BASE_URL = process.env.ASAAS_SANDBOX === 'false'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'access_token': process.env.ASAAS_API_KEY, 'Content-Type': 'application/json' }
});

// Busca ou cria cliente no Asaas
async function obterOuCriarCliente({ nome, email, cpfCnpj, telefone }) {
  // Busca por CPF/CNPJ primeiro
  if (cpfCnpj) {
    const busca = await api.get('/customers', { params: { cpfCnpj } });
    if (busca.data.totalCount > 0) return busca.data.data[0];
  }
  const { data } = await api.post('/customers', { name: nome, email, cpfCnpj, phone: telefone });
  return data;
}

// Cria cobrança (Pix, boleto ou cartão)
async function criarCobranca({ clienteId, valor, descricao, metodo, vencimento, cartao }) {
  const body = {
    customer: clienteId,
    billingType: metodo,           // PIX | BOLETO | CREDIT_CARD
    value: valor,
    description: descricao,
    dueDate: vencimento,           // YYYY-MM-DD
    externalReference: descricao,
  };

  if (metodo === 'CREDIT_CARD' && cartao) {
    body.creditCard = cartao.dados;
    body.creditCardHolderInfo = cartao.titular;
  }

  const { data } = await api.post('/payments', body);
  return data;
}

// Busca QR Code Pix de uma cobrança
async function obterPixQrCode(pagamentoId) {
  const { data } = await api.get(`/payments/${pagamentoId}/pixQrCode`);
  return data;
}

// Consulta status de um pagamento
async function consultarPagamento(pagamentoId) {
  const { data } = await api.get(`/payments/${pagamentoId}`);
  return data;
}

module.exports = { obterOuCriarCliente, criarCobranca, obterPixQrCode, consultarPagamento };
