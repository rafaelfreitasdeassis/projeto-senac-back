
// agendamentosController.js

import { getDatabase } from '../data/db.js';

// GET /agendamentos
export async function listar(req, res) {
  try {
    const db = await getDatabase();

    const agendamentos = await db.all(
      `
      SELECT
        a.id,
        a.idPet,
        p.nome AS pet,
        a.idServico,
        s.nome AS servico,
        a.data_agendamento,
        a.observacao
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
      INNER JOIN servicos s ON s.id = a.idServico
      WHERE p.usuarioId = ?
      ORDER BY a.data_agendamento DESC
      `,
      [req.usuarioId]
    );

    res.json(agendamentos);

  } catch (erro) {
    console.error('[agendamentos.listar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao buscar agendamentos.'
    });
  }
}

// GET /agendamentos/:id
export async function buscarPorId(req, res) {
  const { id } = req.params;

  try {
    const db = await getDatabase();

    const agendamento = await db.get(
      `
      SELECT
        a.id,
        a.idPet,
        p.nome AS pet,
        a.idServico,
        s.nome AS servico,
        a.data_agendamento,
        a.observacao
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
      INNER JOIN servicos s ON s.id = a.idServico
      WHERE a.id = ?
        AND p.usuarioId = ?
      `,
      [id, req.usuarioId]
    );

    if (!agendamento) {
      return res.status(404).json({
        mensagem: 'Agendamento não encontrado.'
      });
    }

    res.json(agendamento);

  } catch (erro) {
    console.error('[agendamentos.buscarPorId]', erro);

    res.status(500).json({
      mensagem: 'Erro ao buscar agendamento.'
    });
  }
}

// POST /agendamentos
export async function criar(req, res) {
  const {
    idPet,
    idServico,
    data_agendamento,
    observacao
  } = req.body;

  if (!idPet || !idServico) {
    return res.status(400).json({
      mensagem: 'Pet e serviço são obrigatórios.'
    });
  }

  try {
    const db = await getDatabase();

    const pet = await db.get(
      'SELECT id FROM pets WHERE id = ? AND usuarioId = ?',
      [idPet, req.usuarioId]
    );

    if (!pet) {
      return res.status(403).json({
        mensagem: 'Pet não encontrado ou não pertence ao usuário.'
      });
    }

    const resultado = await db.run(
      `
      INSERT INTO agendamentos (
        idPet,
        idServico,
        data_agendamento,
        observacao
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        idPet,
        idServico,
        data_agendamento || null,
        observacao || null
      ]
    );

    res.status(201).json({
      id: resultado.lastID,
      idPet,
      idServico,
      data_agendamento,
      observacao
    });

  } catch (erro) {
    console.error('[agendamentos.criar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao criar agendamento.'
    });
  }
}

// PUT /agendamentos/:id
export async function atualizar(req, res) {
  const { id } = req.params;

  const {
    idServico,
    data_agendamento,
    observacao
  } = req.body;

  try {
    const db = await getDatabase();

    const atual = await db.get(
      `
      SELECT a.*
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
      WHERE a.id = ?
        AND p.usuarioId = ?
      `,
      [id, req.usuarioId]
    );

    if (!atual) {
      return res.status(404).json({
        mensagem: 'Agendamento não encontrado.'
      });
    }

    const novoServico = idServico ?? atual.idServico;
    const novaData = data_agendamento ?? atual.data_agendamento;
    const novaObservacao = observacao ?? atual.observacao;

    await db.run(
      `
      UPDATE agendamentos
      SET
        idServico = ?,
        data_agendamento = ?,
        observacao = ?
      WHERE id = ?
      `,
      [
        novoServico,
        novaData,
        novaObservacao,
        id
      ]
    );

    res.json({
      id: Number(id),
      idPet: atual.idPet,
      idServico: novoServico,
      data_agendamento: novaData,
      observacao: novaObservacao
    });

  } catch (erro) {
    console.error('[agendamentos.atualizar]', erro);

    res.status(500).json({
      mensagem: 'Erro ao atualizar agendamento.'
    });
  }
}

// DELETE /agendamentos/:id
export async function remover(req, res) {
  const { id } = req.params;

  try {
    const db = await getDatabase();

    const resultado = await db.run(
      `
      DELETE FROM agendamentos
      WHERE id IN (
        SELECT a.id
        FROM agendamentos a
        INNER JOIN pets p ON p.id = a.idPet
        WHERE a.id = ?
          AND p.usuarioId = ?
      )
      `,
      [id, req.usuarioId]
    );

    if (resultado.changes === 0) {
      return res.status(404).json({
        mensagem: 'Agendamento não encontrado.'
      });
    }

    res.json({
      mensagem: 'Agendamento removido com sucesso.'
    });

  } catch (erro) {
    console.error('[agendamentos.remover]', erro);

    res.status(500).json({
      mensagem: 'Erro ao remover agendamento.'
    });
  }
}
