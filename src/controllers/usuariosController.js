// usuariosController.js — CRUD de usuários + login + perfil
//
// Conceitos da UC3 exercitados aqui:
// - Bloco A / Aula 12 e 13: SQLite no Node com prepared statements (?)
// - Bloco C / Aula 2: SQL Injection — usar ? em vez de concatenar string
// - Bloco C / Aula 3: bcrypt.hash (cadastro) e bcrypt.compare (login)
// - Bloco B / Aula 2 (alternativa do slide 33): autenticação por JWT
// - Bloco C / Aula 1: Confidencialidade — nunca devolver `senha` no JSON

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../data/db.js';
import { processarUploadImagem } from '../middlewares/uploadImagem.js';

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIPOS_USUARIO_VALIDOS = ['cliente', 'admin'];

function ehErroEmailDuplicado(erro) {
  return erro?.code === '23505' || erro?.message?.includes('UNIQUE constraint failed');
}

// GET /usuarios — lista todos. Exige autenticação (ver usuariosRoutes.js).
// ALTERAÇÃO: usuários comuns recebem uma versão reduzida (sem telefone/foto)
// dos demais usuários. Apenas admins recebem a lista completa.
export async function listar(req, res) {
  try {
    const db = await getDatabase();
    const ehAdmin = req.usuarioTipo === 'admin';

    const colunas = ehAdmin
      ? 'id, nome, email, telefone, foto, tipoUsuario'
      : 'id, nome';

    const usuarios = await db.all(`SELECT ${colunas} FROM usuarios ORDER BY id`);
    res.json(usuarios);
  } catch (erro) {
    console.error('[usuarios.listar]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar usuários.' });
  }
}

// GET /usuarios/:id
// ALTERAÇÃO: antes, qualquer usuário autenticado podia ver dados completos
// (nome, email, telefone, foto) de qualquer outro usuário só trocando o :id
// na URL (falha de IDOR). Agora só o próprio usuário ou um admin tem acesso
// aos dados completos.
export async function buscarPorId(req, res) {
  const { id } = req.params;
  const idAlvo = Number(id);

  if (!Number.isInteger(idAlvo)) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }

  const ehAdmin = req.usuarioTipo === 'admin';
  const ehProprioUsuario = idAlvo === req.usuarioId;

  if (!ehProprioUsuario && !ehAdmin) {
    return res.status(403).json({ mensagem: 'Acesso não permitido.' });
  }

  try {
    const db = await getDatabase();
    const usuario = await db.get(
      'SELECT id, nome, email, telefone, foto, tipoUsuario FROM usuarios WHERE id = ?',
      [idAlvo]
    );

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }
    res.json(usuario);
  } catch (erro) {
    console.error('[usuarios.buscarPorId]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar usuário.' });
  }
}

// POST /usuarios — cadastro público
// ALTERAÇÃO: o cliente não pode mais escolher o próprio tipoUsuario.
// Antes, qualquer pessoa podia se cadastrar enviando "tipoUsuario": "admin"
// no body e ganhar privilégios administrativos (falha de escalonamento
// de privilégio). Agora o valor é sempre fixado como 'cliente' no servidor.
// Caso seja necessário criar um admin, isso deve ser feito por uma rota
// separada, protegida, exigindo que quem chama já seja admin.
export async function criar(req, res) {
  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({ mensagem: 'Campos obrigatórios ausentes.' });
  }

  // validação simples — exemplo didático para o aluno entender que toda
  // entrada do usuário precisa passar por verificação no servidor.
  if (typeof senha !== 'string' || senha.length < 6) {
    return res.status(400).json({
      mensagem: 'A senha deve ter pelo menos 6 caracteres.'
    });
  }

  // ALTERAÇÃO: validação de e-mail também no cadastro (antes só existia
  // em atualizar). Evita registros com formato de e-mail inválido.
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ mensagem: 'E-mail inválido.' });
  }

  // tipoUsuario nunca vem do cliente — sempre fixo no cadastro público.
  const tipoUsuarioSeguro = 'cliente';

  try {
    const db = await getDatabase();

    // bcrypt.hash → guarda HASH, não a senha em texto puro (UC3 Bloco C / Aula 3)
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const resultado = await db.run(
      `
      INSERT INTO usuarios (
        nome,
        email,
        telefone,
        senha,
        tipoUsuario
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nome,
        email,
        telefone,
        senhaHash,
        tipoUsuarioSeguro
      ]
    );

    res.status(201).json({
      id: resultado.lastID,
      nome,
      email,
      telefone,
      foto: null,
      tipoUsuario: tipoUsuarioSeguro
    });
  } catch (erro) {
    // a coluna email tem UNIQUE no CREATE TABLE — tratamos o erro
    // de violação dessa restrição como 409 Conflict.
    if (ehErroEmailDuplicado(erro)) {
      return res.status(409).json({ mensagem: 'Este e-mail já está cadastrado.' });
    }
    console.error('[usuarios.criar]', erro);
    res.status(500).json({ mensagem: 'Erro ao salvar usuário.' });
  }
}

// PUT /usuarios/:id — atualização parcial. Só o próprio usuário pode editar.
export async function atualizar(req, res) {
  const idAlvo = Number(req.params.id);

  // pilar Integridade (UC3 Bloco C / Aula 1):
  // ninguém edita dados de outra pessoa.
  if (!Number.isInteger(idAlvo)) {
    return res.status(400).json({
      mensagem: 'ID inválido.'
    });
  }

  // ninguém pode editar outro usuário
  if (idAlvo !== req.usuarioId) {
    return res.status(403).json({
      mensagem: 'Você só pode editar o próprio usuário.'
    });
  }

  const {
    nome,
    email,
    telefone,
    senha
  } = req.body;

  try {
    let novaFotoUpload = null;

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const upload = await processarUploadImagem(req, res, {
        pasta: 'perfil',
        campo: 'foto'
      });

      novaFotoUpload = upload?.publicUrl ?? null;
    }

    const db = await getDatabase();

    const atual = await db.get(
      'SELECT * FROM usuarios WHERE id = ?',
      [idAlvo]
    );

    if (!atual) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.'
      });
    }

    // validação de e-mail
    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          mensagem: 'E-mail inválido.'
        });
      }
    }

    const novoNome = nome ?? atual.nome;
    const novoEmail = email ?? atual.email;
    const novoTelefone = telefone ?? atual.telefone;

    const novaFoto =
      novaFotoUpload ??
      req.body?.foto ??
      atual.foto;


    let novaSenha = atual.senha;

    if (senha) {
      if (typeof senha !== 'string' || senha.length < 6) {
        return res.status(400).json({
          mensagem: 'A senha deve ter pelo menos 6 caracteres.'
        });
      }

      novaSenha = await bcrypt.hash(senha, SALT_ROUNDS);
    }

    await db.run(
      `
      UPDATE usuarios
      SET
        nome = ?,
        email = ?,
        telefone = ?,
        senha = ?,
        foto = ?
      WHERE id = ?
      `,
      [
        novoNome,
        novoEmail,
        novoTelefone,
        novaSenha,
        novaFoto,
        idAlvo
      ]
    );

    res.json({
      id: idAlvo,
      nome: novoNome,
      email: novoEmail,
      telefone: novoTelefone,
      foto: novaFoto
    });

  } catch (erro) {
    if (
      erro?.message === 'A imagem deve ter no máximo 5MB.' ||
      erro?.message === 'Apenas arquivos de imagem são permitidos.'
    ) {
      return res.status(400).json({
        mensagem: erro.message
      });
    }

    if (ehErroEmailDuplicado(erro)) {
      return res.status(409).json({
        mensagem: 'Este e-mail já está cadastrado.'
      });
    }

    console.error('[usuarios.atualizar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao atualizar usuário.'
    });
  }
}

// DELETE /usuarios/:id — só o próprio usuário pode se remover.
export async function remover(req, res) {
  const idAlvo = Number(req.params.id);

  if (idAlvo !== req.usuarioId) {
    return res.status(403).json({
      mensagem: 'Você só pode remover o próprio usuário.'
    });
  }

  try {
    const db = await getDatabase();
    // ON DELETE CASCADE no CREATE TABLE de tarefas já apaga as tarefas
    // vinculadas — assim demonstramos relacionamento + FK na prática.
    const resultado = await db.run('DELETE FROM usuarios WHERE id = ?', [idAlvo]);

    if (resultado.changes === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (erro) {
    console.error('[usuarios.remover]', erro);
    res.status(500).json({ mensagem: 'Erro ao remover usuário.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Autenticação — login + perfil
// ────────────────────────────────────────────────────────────────────────────

// POST /usuarios/login
// body: { email, senha }
// resposta: { token, usuario: { id, nome, email } }
//
// Fluxo:
// 1) busca o usuário pelo email (prepared statement — protege contra
//    SQL Injection, UC3 Bloco C / Aula 2);
// 2) compara a senha digitada com o hash salvo (bcrypt.compare);
// 3) se OK, gera um JWT assinado com JWT_SECRET (slide 33 da UC3 —
//    JWT como alternativa a session do Bloco B).
export async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Informe email e senha.' });
  }

  try {
    const db = await getDatabase();
    const usuario = await db.get(
      `
      SELECT
        id,
        nome,
        email,
        senha,
        foto,
        tipoUsuario
      FROM usuarios
      WHERE email = ?
      `,
      [email]
    );

    // mensagem genérica de propósito: não revela se foi o e-mail ou a senha.
    // Isso dificulta força bruta direcionada (UC3 Bloco C / Aula 2).
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);
    if (!senhaConfere) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    // O "payload" é o que vai dentro do token. NUNCA coloque senha aqui —
    // o payload é apenas codificado em base64, não é criptografado.
    // ALTERAÇÃO: tipoUsuario incluído no payload. Necessário para que o
    // middleware autenticarJWT consiga propagar req.usuarioTipo e os
    // controllers possam diferenciar cliente/admin (ex: listar, buscarPorId).
    const token = jwt.sign(
      { usuarioId: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        foto: usuario.foto ?? null,
        tipoUsuario: usuario.tipoUsuario
      }
    });
  } catch (erro) {
    console.error('[usuarios.login]', erro);
    res.status(500).json({ mensagem: 'Erro ao autenticar.' });
  }
}

// GET /usuarios/perfil — rota protegida pelo middleware autenticarJWT.
// Devolve os dados do usuário a partir do token.
export async function perfil(req, res) {
  try {
    const db = await getDatabase();

    const usuario = await db.get(
      `
      SELECT
        id,
        nome,
        email,
        telefone,
        foto,
        tipoUsuario
      FROM usuarios
      WHERE id = ?
      `,
      [req.usuarioId]
    );

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.'
      });
    }

    res.json(usuario);

  } catch (erro) {

    console.error('[usuarios.perfil]', erro);

    res.status(500).json({
      mensagem: 'Erro ao buscar perfil.'
    });
  }
}
