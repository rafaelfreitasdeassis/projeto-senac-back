// servicosController.js

import { getDatabase } from '../data/db.js';

// GET /servicos
export async function listar(req, res) {
  try {
    const db = await getDatabase();

    const servicos = await db.all(
      'SELECT id, nome, descricao, preco FROM servicos ORDER BY nome'
    );

    res.json(servicos);

  } catch (erro) {
    console.error('[servicos.listar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao buscar serviços.'
    });
  }
}

// GET /servicos/:id
export async function buscarPorId(req, res) {
  const { id } = req.params;

  try {
    const db = await getDatabase();

    const servico = await db.get(
      'SELECT id, nome, descricao, preco FROM servicos WHERE id = ?',
      [id]
    );

    if (!servico) {
      return res.status(404).json({
        mensagem: 'Serviço não encontrado.'
      });
    }

    res.json(servico);

  } catch (erro) {
    console.error('[servicos.buscarPorId]', erro);

    res.status(500).json({
      mensagem: 'Erro ao buscar serviço.'
    });
  }
}

// POST /servicos
export async function criar(req, res) {

  const {
    nome,
    descricao,
    preco
  } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      mensagem: 'Nome do serviço é obrigatório.'
    });
  }

  if (preco == null || isNaN(preco)) {
    return res.status(400).json({
      mensagem: 'Preço inválido.'
    });
  }

  try {

    const db = await getDatabase();

    const resultado = await db.run(
      `
      INSERT INTO servicos (
        nome,
        descricao,
        preco
      )
      VALUES (?, ?, ?)
      `,
      [
        nome.trim(),
        descricao?.trim() || null,
        preco
      ]
    );

    res.status(201).json({
      id: resultado.lastID,
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      preco
    });

  } catch (erro) {

    console.error('[servicos.criar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao criar serviço.'
    });
  }
}

// PUT /servicos/:id
export async function atualizar(req, res) {

  const { id } = req.params;

  const {
    nome,
    descricao,
    preco
  } = req.body;

  try {

    const db = await getDatabase();

    const atual = await db.get(
      'SELECT id, nome, descricao, preco FROM servicos WHERE id = ?',
      [id]
    );

    if (!atual) {
      return res.status(404).json({
        mensagem: 'Serviço não encontrado.'
      });
    }

    const novoNome = nome ?? atual.nome;
    const novaDescricao = descricao ?? atual.descricao;
    const novoPreco = preco ?? atual.preco;

    await db.run(
      `
      UPDATE servicos
      SET
        nome = ?,
        descricao = ?,
        preco = ?
      WHERE id = ?
      `,
      [
        novoNome,
        novaDescricao,
        novoPreco,
        id
      ]
    );

    res.json({
      id: Number(id),
      nome: novoNome,
      descricao: novaDescricao,
      preco: novoPreco
    });

  } catch (erro) {

    console.error('[servicos.atualizar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao atualizar serviço.'
    });
  }
}

// DELETE /servicos/:id
export async function remover(req, res) {

  const { id } = req.params;

  try {

    const db = await getDatabase();

    const resultado = await db.run(
      'DELETE FROM servicos WHERE id = ?',
      [id]
    );

    if (resultado.changes === 0) {
      return res.status(404).json({
        mensagem: 'Serviço não encontrado.'
      });
    }

    res.json({
      mensagem: 'Serviço removido com sucesso.'
    });

  } catch (erro) {

    console.error('[servicos.remover]', erro);

    res.status(500).json({
      mensagem: 'Erro ao remover serviço.'
    });
  }
}