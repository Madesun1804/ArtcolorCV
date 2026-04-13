const axios = require('axios');

// Proteção: só vai para produção se ASAAS_SANDBOX for explicitamente 'false'
// E a chave de produção NÃO contém '_hmlg_'
const isSandbox = process.env.ASAAS_SANDBOX !== 'false'
  || (process.env.ASAAS_API_KEY || '').includes('_hmlg_');

const BASE_URL = isSandbox
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3';

if (isSandbox) console.log('[Asaas] Modo SANDBOX ativo.');

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
  const payload = { name: nome, email, cpfCnpj };
  // Tenta criar com telefone; se inválido, Asaas retorna erro e tentamos sem
  if (telefone) {
    const fone = telefone.replace(/\D/g, '');
    if (fone.length >= 10) payload.mobilePhone = fone;
  }
  let data;
  try {
    ({ data } = await api.post('/customers', payload));
  } catch (e) {
    if (e.response?.data?.errors?.some(err => /phone/i.test(err.code || ''))) {
      delete payload.mobilePhone;
      ({ data } = await api.post('/customers', payload));
    } else throw e;
  }
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
