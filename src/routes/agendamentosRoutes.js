
import { Router } from 'express';
import * as controller from '../controllers/agendamentosController.js';
import { autenticarJWT } from '../middlewares/autenticacao.js';

const router = Router();

router.use(autenticarJWT);                             // todas as rotas exigem autenticação

router.get(  '/',  controller.listar );                 // GET /agendamentos

router.get(  '/:id',  controller.buscarPorId );        // GET /agendamentos/:id

router.post(  '/',  controller.criar );                // POST /agendamentos

router.put(  '/:id',  controller.atualizar );          // PUT /agendamentos/:id

router.delete(  '/:id',  controller.remover);          // DELETE /agendamentos/:id

export default router;

