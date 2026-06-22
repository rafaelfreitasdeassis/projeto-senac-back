// usuariosRoutes.js — mapeia verbos HTTP do recurso /usuarios para o controller
//
// Regras de acesso:
// - POST   /usuarios          → PÚBLICO  (cadastro de novo usuário)
// - POST   /usuarios/login    → PÚBLICO  (autentica e devolve um JWT)
// - GET    /usuarios/perfil   → protegido (dados do usuário do token)
// - GET    /usuarios          → protegido (lista geral, didático)
// - GET    /usuarios/:id      → protegido
// - PUT    /usuarios/:id      → protegido + só o próprio usuário pode editar
// - DELETE /usuarios/:id      → protegido + só o próprio usuário pode remover
//
// IMPORTANTE — ordem das rotas:
// O Express resolve as rotas na ordem em que são registradas. Por isso
// /usuarios/perfil precisa vir ANTES de /usuarios/:id, senão o Express
// trataria "perfil" como um valor de :id e nunca chamaria a função certa.

import { Router } from 'express';
import * as controller from '../controllers/usuariosController.js';
import { autenticarJWT } from '../middlewares/autenticacao.js';

const router = Router();

// rotas públicas
router.post('/', controller.criar);            // cadastro
router.post('/login', controller.login);       // login → devolve JWT

// rotas protegidas (precisam do header Authorization: Bearer <token>)
router.get('/perfil', autenticarJWT, controller.perfil);   // antes de /:id
router.get('/', autenticarJWT, controller.listar);
router.get('/:id', autenticarJWT, controller.buscarPorId);
router.put('/:id', autenticarJWT, controller.atualizar);
router.delete('/:id', autenticarJWT, controller.remover);

export default router;
