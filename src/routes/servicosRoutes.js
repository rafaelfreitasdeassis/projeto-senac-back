// servicosRoutes.js — mapeia verbos HTTP do recurso /servicos para o controller
//
// Todas as rotas aqui são PROTEGIDAS: precisam de um JWT válido no header
// Authorization. O middleware autenticarJWT popula req.usuarioId para que
// os controllers saibam quem é o usuário logado.

import { Router } from 'express';
import * as controller from '../controllers/servicosController.js';
import { autenticarJWT } from '../middlewares/autenticacao.js';

const router = Router();

router.use(autenticarJWT);

router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);

export default router;


