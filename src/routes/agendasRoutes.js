
import { Router } from 'express';
import * as controller from '../controllers/agendasController.js';
import { autenticarJWT } from '../middlewares/autenticacao.js';

const router = Router();

router.use(autenticarJWT);                        // Todas as rotas exigem autenticação

router.get(  '/',  controller.listar );                  // GET /agendas?ano=2025&mes=6

router.post(  '/gerar-mes',  controller.gerarMes );     // POST /agendas/gerar-mes

router.put(  '/liberar',  controller.liberar );         // PUT /agendas/liberar

router.put(  '/bloquear',  controller.bloquear );       // PUT /agendas/bloquear

export default router;

