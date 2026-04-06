# Como Rodar o Backend da Artcolor

## 1. Instalar o Node.js

Acesse: https://nodejs.org
Baixe a versão **LTS** (recomendada) e instale normalmente.
Após instalar, reinicie o terminal/computador.

---

## 2. Instalar as dependências do backend

Abra o **Prompt de Comando** (cmd) ou **PowerShell** e execute:

```
cd "C:\Users\augus\OneDrive\Documentos\Claude\Projects\Artcolor\backend"
npm install
```

Aguarde terminar o download das bibliotecas (pode levar 1-2 minutos).

---

## 3. Iniciar o servidor

Ainda na pasta `backend/`, execute:

```
npm run dev
```

Você verá a mensagem:
```
✅ Servidor Artcolor rodando em http://localhost:4000
```

O banco de dados SQLite será criado automaticamente na primeira execução,
com os 5 produtos de teste e o usuário admin já cadastrados.

---

## 4. Rodar o site

Em outro terminal (ou no próprio VS Code), na pasta raiz do projeto:

```
cd "C:\Users\augus\OneDrive\Documentos\Claude\Projects\Artcolor"
python -m http.server 3000
```

Acesse no navegador: http://localhost:3000

---

## Credenciais de acesso

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin  | admin@artcolor.com.br | admin123 |

---

## Estrutura dos servidores

| Servidor | Porta | Finalidade |
|----------|-------|------------|
| Python (site) | 3000 | Páginas HTML, CSS, JS |
| Node.js (API) | 4000 | Backend, banco de dados |

---

## Arquivos importantes

```
Artcolor/
├── backend/              ← Servidor Node.js (API)
│   ├── server.js         ← Ponto de entrada
│   ├── artcolor.db       ← Banco de dados (criado automaticamente)
│   └── src/
│       ├── routes/       ← Rotas da API
│       ├── middleware/   ← Autenticação
│       └── db/           ← Banco de dados e seed
│
├── admin/                ← Painel administrativo
├── painel/               ← Painel do usuário
├── login.html            ← Página de login/cadastro
├── produto.html          ← Página de produto individual
├── checkout.html         ← Página de finalização de pedido
├── produtos.html         ← Loja (busca produtos na API)
└── index.html            ← Site principal
```

---

## API — Endpoints disponíveis

```
GET  http://localhost:4000/api/health           → Verificar se o servidor está rodando
GET  http://localhost:4000/api/produtos         → Listar produtos
GET  http://localhost:4000/api/produtos/:slug   → Produto individual
GET  http://localhost:4000/api/produtos/meta/categorias → Categorias

POST http://localhost:4000/api/auth/register    → Cadastro
POST http://localhost:4000/api/auth/login       → Login
GET  http://localhost:4000/api/auth/me          → Usuário logado

GET  http://localhost:4000/api/pedidos/meus     → Pedidos do usuário (requer login)
POST http://localhost:4000/api/pedidos          → Criar pedido (requer login)

GET  http://localhost:4000/api/admin/dashboard  → Dashboard admin (requer admin)
```
