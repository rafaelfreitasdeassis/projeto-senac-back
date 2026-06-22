// index.js — ponto de entrada da aplicação
// responsabilidade: subir o servidor Express, registrar middlewares globais
// e montar as rotas dos recursos.

// 1) dotenv precisa ser carregado ANTES de qualquer coisa que use process.env
import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';


import agendamentosRoutes from './src/routes/agendamentosRoutes.js';
import agendasRoutes from './src/routes/agendasRoutes.js';
import petsRoutes from './src/routes/petsRoutes.js';
import servicosRoutes from './src/routes/servicosRoutes.js';
import usuariosRoutes from './src/routes/usuariosRoutes.js';

const app = express();

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';


// ────────────────────────────────────────────────────────────────────────────
// Middlewares globais
// ────────────────────────────────────────────────────────────────────────────

// helmet: adiciona cabeçalhos HTTP de segurança (X-Frame-Options,
// Strict-Transport-Security, X-Content-Type-Options etc.) — UC3 Bloco C.
app.use(helmet());

// CORS simples para o projeto base.
// Em produção, defina CORS_ORIGIN com a URL do frontend publicado.
app.use(cors({ origin: CORS_ORIGIN }));

// parser nativo do Express para JSON no corpo das requisições
app.use(express.json());

// ────────────────────────────────────────────────────────────────────────────
// Rotas
// ────────────────────────────────────────────────────────────────────────────

// cada grupo de rotas é montado sob um prefixo
// /usuarios cobre: cadastro, login, perfil e o CRUD de usuários.


app.use('/agendamentos', agendamentosRoutes);
app.use('/agendas', agendasRoutes);
app.use('/pets', petsRoutes);
app.use('/servicos', servicosRoutes);
app.use('/usuarios', usuariosRoutes);

// rota raiz só para health-check rápido no navegador
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
recursos: [
  'POST /usuarios',
  'POST /usuarios/login',
  'GET  /usuarios/perfil',

  'GET  /pets',
  'GET  /servicos',
  'GET  /agendamentos',
  'GET  /agendas'
]
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Tratamento de erros — fallback genérico (não vaza stacktrace ao cliente)
// ────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[erro nao tratado]', err);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

// ────────────────────────────────────────────────────────────────────────────
// Sobe o servidor
// ────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
