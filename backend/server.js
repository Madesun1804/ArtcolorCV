require('dotenv').config();
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
app.use(helmet({ contentSecurityPolicy: false }));

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

// ── Debug temporário (remover após resolver) ────────────────────────────────────
app.get('/api/debug-env', (req, res) => {
  res.json({
    JWT_SECRET_set: !!process.env.JWT_SECRET,
    JWT_SECRET_len: process.env.JWT_SECRET?.length || 0,
    TEST_VAR: process.env.TEST_VAR || 'nao_definida',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    total_env_keys: Object.keys(process.env).length,
  });
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
