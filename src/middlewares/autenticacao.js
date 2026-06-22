// autenticacao.js — middleware que protege rotas com JWT
//
// Fluxo (slide 33 da UC3 — JWT como alternativa a session):
// 1. O cliente faz POST /usuarios/login e recebe um token assinado.
// 2. Em toda requisição seguinte, ele envia:
//      Authorization: Bearer <token>
// 3. Este middleware verifica a assinatura do token usando JWT_SECRET.
//    Se OK, popula req.usuarioId e deixa a requisição seguir.
//    Se não, responde 401.

import jwt from 'jsonwebtoken';

export function autenticarJWT(req, res, next) {
  // cabeçalho esperado: "Authorization: Bearer eyJhbGciOi..."
  const headerAuth = req.headers.authorization;

  if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não enviado.' });
  }

  const token = headerAuth.split(' ')[1];        // separa "Bearer" do token em si

  try {
    // jwt.verify lança exceção se o token estiver inválido, expirado
    // ou se o segredo for outro. O payload original volta intacto.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // disponibiliza dados do usuário logado para os controllers
    req.usuarioId = payload.usuarioId;
    req.usuarioNome = payload.nome;
    
    req.usuarioTipo = payload.tipoUsuario;            // Propaga o tipo de usuário (cliente/admin), para checagens de autorização (ex: buscarPorId, listar)

    return next();
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}
