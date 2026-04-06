const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/usuario/perfil
router.get('/perfil', authMiddleware, (req, res) => {
  const db = getDb();
  const usuario = db.prepare(
    'SELECT id, nome, email, telefone, cpf_cnpj, criado_em FROM usuarios WHERE id = ?'
  ).get(req.usuario.id);

  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
});

// PUT /api/usuario/perfil
router.put('/perfil', authMiddleware, (req, res) => {
  const { nome, telefone, cpf_cnpj } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  const db = getDb();
  db.prepare(
    'UPDATE usuarios SET nome = ?, telefone = ?, cpf_cnpj = ? WHERE id = ?'
  ).run(nome, telefone || null, cpf_cnpj || null, req.usuario.id);

  res.json({ mensagem: 'Perfil atualizado com sucesso!' });
});

// PUT /api/usuario/senha
router.put('/senha', authMiddleware, (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias.' });
  }
  if (nova_senha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  const db = getDb();
  const usuario = db.prepare('SELECT senha_hash FROM usuarios WHERE id = ?').get(req.usuario.id);

  if (!bcrypt.compareSync(senha_atual, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'Senha atual incorreta.' });
  }

  const novaHash = bcrypt.hashSync(nova_senha, 10);
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(novaHash, req.usuario.id);

  res.json({ mensagem: 'Senha alterada com sucesso!' });
});

// GET /api/usuario/enderecos
router.get('/enderecos', authMiddleware, (req, res) => {
  const db = getDb();
  const enderecos = db.prepare(
    'SELECT * FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC'
  ).all(req.usuario.id);
  res.json(enderecos);
});

// POST /api/usuario/enderecos
router.post('/enderecos', authMiddleware, (req, res) => {
  const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal } = req.body;

  if (!logradouro || !numero || !cidade || !estado || !cep) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios do endereço.' });
  }

  const db = getDb();

  if (principal) {
    db.prepare('UPDATE enderecos SET principal = 0 WHERE usuario_id = ?').run(req.usuario.id);
  }

  const result = db.prepare(`
    INSERT INTO enderecos (usuario_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.usuario.id, apelido || 'Principal', cep, logradouro, numero,
    complemento || null, bairro || null, cidade, estado, principal ? 1 : 0
  );

  res.status(201).json({ mensagem: 'Endereço salvo!', id: result.lastInsertRowid });
});

// DELETE /api/usuario/enderecos/:id
router.delete('/enderecos/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM enderecos WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuario.id);
  res.json({ mensagem: 'Endereço removido.' });
});

module.exports = router;
