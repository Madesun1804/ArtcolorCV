const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  const db = getDb();
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  const result = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, telefone, email_verificado)
    VALUES (?, ?, ?, ?, 1)
  `).run(nome, email.toLowerCase().trim(), senhaHash, telefone || null);

  const usuario = db.prepare('SELECT id, nome, email, tipo FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
  const token = gerarToken(usuario);

  console.log(`[AUTH] Novo cadastro: ${email}`);
  res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!', token, usuario });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET não definido nas variáveis de ambiente!');
      return res.status(500).json({ erro: 'Configuração do servidor incompleta.' });
    }

    const db = getDb();
    const login = email.trim();
    const usuario = login.includes('@')
      ? db.prepare('SELECT * FROM usuarios WHERE email = ?').get(login.toLowerCase())
      : db.prepare('SELECT * FROM usuarios WHERE nome = ? COLLATE NOCASE').get(login);

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
    }
    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desativada. Entre em contato com o suporte.' });
    }

    const token = gerarToken(usuario);
    console.log(`[AUTH] Login: ${email}`);
    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }
    });
  } catch (e) {
    console.error('[AUTH] Erro no login:', e.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const usuario = db.prepare(
    'SELECT id, nome, email, telefone, cpf_cnpj, tipo, criado_em FROM usuarios WHERE id = ?'
  ).get(req.usuario.id);

  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
});

// POST /api/auth/logout  (o token é descartado no frontend)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ mensagem: 'Logout realizado com sucesso.' });
});

module.exports = router;
