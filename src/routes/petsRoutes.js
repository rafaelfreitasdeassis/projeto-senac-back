

import { Router } from 'express';
import * as controller from '../controllers/petsController.js';
import { autenticarJWT } from '../middlewares/autenticacao.js';

const router = Router();

router.use(autenticarJWT);    // Todas as rotas de pets exigem autenticação


router.get( '/', controller.listar );                                 // GET /pets

router.get( '/usuario/:usuarioId',  controller.listarPorUsuario );    // GET /pets/usuario/:usuarioId

router.get( '/:id',  controller.buscarPorId );                        // GET /pets/:id

router.post( '/',  controller.criar );                               // POST /pets

router.put( '/:id',  controller.atualizar );                         // PUT /pets/:id

router.delete( '/:id',  controller.remover );                        // DELETE /pets/:id


export default router;


