// petsController.js — CRUD de pets
//
// Ponto importante de segurança (UC3 Bloco C / Aula 1 — pilar Confidencialidade):
// toda operação aqui é restrita ao usuário logado. O usuarioId NÃO vem do
// body — vem do token (req.usuarioId). Assim, ninguém consegue listar,
// alterar ou apagar pets de outra pessoa.

import { getDatabase } from '../data/db.js';


// GET /pets — só as do usuário logado
export async function listar(req, res) {
  try {
    const db = await getDatabase();
    const pets = await db.all(
      'SELECT id, raca, nome, porte, peso, usuarioId FROM pets WHERE usuarioId = ? ORDER BY id DESC',
      [req.usuarioId]
    );
    res.json(pets);
  } catch (erro) {
    console.error('[pets.listar]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pets.' });
  }
}

// GET /pets/:id — só se o pet for do usuário logado
export async function buscarPorId(req, res) {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    const pets = await db.get(
      'SELECT id, raca, nome, porte, peso, usuarioId FROM pets WHERE id = ? AND usuarioId = ?',
      [id, req.usuarioId]
    );

    if (!pets) {
      return res.status(404).json({ mensagem: 'Pet não encontrado.' });
    }
    res.json(normalizarpetsaida(pets));
  } catch (erro) {
    console.error('[pets.buscarPorId]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pet.' });
  }
}

// GET /pets/usuario/:usuarioId
// Uso didático — mostra como filtrar por chave estrangeira.
// Por segurança, só o próprio usuário pode listar as próprias pets
// por esse endpoint.
export async function listarPorUsuario(req, res) {
  const usuarioIdSolicitado = Number(req.params.usuarioId);

  if (usuarioIdSolicitado !== req.usuarioId) {
    return res.status(403).json({
      mensagem: 'Você só pode listar os próprios pets.'
    });
  }

  try {
    const db = await getDatabase();
    const pets = await db.all(
      'SELECT id, raca, nome, porte, peso, usuarioId FROM pets WHERE usuarioId = ? ORDER BY id DESC',
      [usuarioIdSolicitado]
    );
    res.json(pets.map(normalizarpetsaida));
  } catch (erro) {
    console.error('[pets.listarPorUsuario]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pets do usuário.' });
  }
}

// POST /pets — body { nome }. usuarioId vem do token.
export async function criar(req, res) {
  const { raca, nome, porte, peso } = req.body;

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ mensagem: 'Informe um nome válido.' });
  }

  try {
    const db = await getDatabase();
    const resultado = await db.run(
      'INSERT INTO pets (raca, nome, porte, peso, usuarioId) VALUES (?, ?, ?, ?)',
      [raca.trim(), nome?.trim() || null, statusFinal, req.usuarioId]
    );

    res.status(201).json({
      id: resultado.lastID,
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      status: statusFinal,
      usuarioId: req.usuarioId
    });
  } catch (erro) {
    console.error('[pets.criar]', erro);
    res.status(500).json({ mensagem: 'Erro ao criar pets.' });
  }
}

// PUT /pets/:id — atualização parcial. Só permite mexer na própria pets.
export async function atualizar(req, res) {
  const { id } = req.params;
  const { raca, nome, porte, peso, usuarioId } = req.body;

  try {
    const db = await getDatabase();
    const atual = await db.get(
      'SELECT id, raca, nome, porte, peso, usuarioId FROM pets WHERE id = ? AND usuarioId = ?',
      [id, req.usuarioId]
    );

    if (!atual) {
      return res.status(404).json({ mensagem: 'pets não encontrada.' });
    }

    // operador ?? mantém o valor atual quando o campo não vem no body
    const novoTitulo = titulo ?? atual.titulo;
    const novaDescricao = descricao ?? atual.descricao;
    let novoStatus = atual.status;
    if (typeof concluida === 'boolean') {
      novoStatus = concluida ? 'Concluido' : 'Novo';
    }
    if (typeof status === 'string') {
      novoStatus = normalizarStatus(status, atual.status);
    }

    await db.run(
      'UPDATE pets SET titulo = ?, descricao = ?, status = ? WHERE id = ?',
      [novoTitulo, novaDescricao, novoStatus, id]
    );

    res.json({
      id: Number(id),
      titulo: novoTitulo,
      descricao: novaDescricao,
      status: novoStatus,
      usuarioId: req.usuarioId
    });
  } catch (erro) {
    console.error('[pets.atualizar]', erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar pets.' });
  }
}

// DELETE /pets/:id
export async function remover(req, res) {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    const resultado = await db.run(
      'DELETE FROM pets WHERE id = ? AND usuarioId = ?',
      [id, req.usuarioId]
    );

    if (resultado.changes === 0) {
      return res.status(404).json({ mensagem: 'pets não encontrada.' });
    }
    res.json({ mensagem: 'pets removida com sucesso.' });
  } catch (erro) {
    console.error('[pets.remover]', erro);
    res.status(500).json({ mensagem: 'Erro ao remover pets.' });
  }
}
