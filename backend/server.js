require('dotenv').config();

// ── Fallbacks de desenvolvimento/sandbox ──────────────────────────────────────
// ATENÇÃO: estas chaves são EXCLUSIVAMENTE de sandbox (homologação).
// Não processam dinheiro real. Para produção, configure as variáveis no Railway.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'artcolor_jwt_secret_2026_troque_em_producao';
  console.warn('[AVISO] JWT_SECRET não definido. Usando valor padrão.');
}
// Sandbox Asaas — chave hmlg, aponta para sandbox.asaas.com
if (!process.env.ASAAS_API_KEY) {
  process.env.ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNlYjE4NGE1LWEyMTMtNDljOC1iNGUxLWQ0OGRlYzQ1MmMwNzo6JGFhY2hfZmM5NDBhODctMzVhMS00MGZlLThlOTItNjA0Yzk3ZjJmM2Zm';
}
// Sandbox Melhor Envio — token de homologação
if (!process.env.ME_TOKEN) {
  process.env.ME_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiJhYzNiYTdkOGUyNjE0N2Y5OWNlZWY0ZTA5OGNkYTk3MTZiNjFhM2MyODkyZGNmZmU3Mjc0NTlkYmI0ZjMxNmRkMWM1YWI0MDk1MDc4ZDQ5NyIsImlhdCI6MTc3NjEwNjYyMy4xMzk2ODUsIm5iZiI6MTc3NjEwNjYyMy4xMzk2ODgsImV4cCI6MTgwNzY0MjYyMy4xMzExOTksInN1YiI6ImExODkyZDYxLTljYWMtNDViOS1hNzhlLTJjZWIzZGQ5OWU1NiIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiXX0.oS9sDG6iRpwPP884EgC8-po6FEe0cLRhEVT8NdLt-qfexTxUTBMdLys4zCHWA3RNqX4neLH6VOa6zHcLZx4cIW_b-n_2OTeteMpOsefZaMJJhVGMMEM8awBW7HIy2Rk8z2lXz0C8zYUVCq2-PHOY8cwM1hJfwvtlBszyVckNFqyqnUaTeJjpJqcG-PPEzxaY10l4ZL-aEYcIKqfzSYDPkhElexg-n1o4rgilY-V5jypUBYp2hch1iqLYXpop1tpEXEcy7Xou90bClQBVSO_lyIIr28a4ms3Pij4j5fUpUX55Ad788VYzv98b9-YU3NrLTrrlJYJ4R8h6EvvH6VgiM368E0KFwSvzWsChXvR3kfKctQE_bdbTaQ-Z00-P3FdLpB9xzCrunfB_i7dKzr_ST1O-e7WzZeZtcsTJ4269GZQY50WK8gGFSUqQHs_JNngyvZ6MSCzfDLV7qp_rkTbU7UkZdIb46-7MgXBxT6kCvCm68JRqQQu76ibIITI4YG17ERgqBwCT-iq3bTBScD-oUX9qGOUwG8pByuUFbQDI7jLWpTYaLycjSJGn8Ikxt_pHJkPoFCcxCyobvyqIf82rAB8YMnk3YdI2VR3_2vWp4ZazTbLpsQEsFbOo6x-dP9j4VsKKtfNg5KFdZ5hPxpY22syyHwbrSGZUwbEAbvhYD24';
}
// Garante que sandbox está sempre ativo enquanto não configurado explicitamente
if (!process.env.ASAAS_SANDBOX) process.env.ASAAS_SANDBOX = 'true';
if (!process.env.ME_SANDBOX)    process.env.ME_SANDBOX    = 'true';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDb } = require('./src/db/database');

const authRoutes     = require('./src/routes/auth');
const produtosRoutes = require('./src/routes/produtos');
const pedidosRoutes  = require('./src/routes/pedidos');
const usuarioRoutes  = require('./src/routes/usuario');
const adminRoutes    = require('./src/routes/admin');
const freteRoutes    = require('./src/routes/frete');
const pagamentoRoutes = require('./src/routes/pagamento');

const app = express();

// ── Segurança básica ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://madesun1804.github.io',
    'https://artcolorcv-production.up.railway.app',
  ],
  credentials: true
}));

// Rate limiting geral
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { erro: 'Muitas requisições. Tente novamente em breve.' }
}));

// Rate limiting rigoroso para auth
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos.' }
}));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Arquivos estáticos (imagens de produtos) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rotas da API ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/produtos',  produtosRoutes);
app.use('/api/pedidos',   pedidosRoutes);
app.use('/api/usuario',   usuarioRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/frete',     freteRoutes);
app.use('/api/pagamento', pagamentoRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV, versao: '1.0.0' });
});

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// ── Erro global ────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ── Inicializar ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

initDb();

app.listen(PORT, () => {
  console.log(`\n✅ Servidor Artcolor rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV}`);
  console.log(`   API:      http://localhost:${PORT}/api/health\n`);
});
