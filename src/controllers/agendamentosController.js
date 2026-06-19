
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
        a.data,
        a.hora,
        a.status,
        a.observacao,
        p.nome AS pet,
        s.nome AS servico
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
      INNER JOIN servicos s ON s.id = a.idServico
      WHERE p.usuarioId = ?
      ORDER BY a.data DESC, a.hora DESC
      `,
      [req.usuarioId]
    );

    res.json(agendamentos);

  } catch (erro) {
    console.error('[agendamentos.listar]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar agendamentos.' });
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
        a.data,
        a.hora,
        a.status,
        a.observacao,
        a.idPet,
        a.idServico
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
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
    res.status(500).json({ mensagem: 'Erro ao buscar agendamento.' });
  }
}


// POST /agendamentos
export async function criar(req, res) {
  const {
    idPet,
    idServico,
    data,
    hora,
    observacao
  } = req.body;

  if (!idPet || !idServico || !data || !hora) {
    return res.status(400).json({
      mensagem: 'Pet, serviço, data e hora são obrigatórios.'
    });
  }

  try {
    const db = await getDatabase();

    // 🔐 1. verificar se o pet pertence ao usuário
    const pet = await db.get(
      'SELECT id FROM pets WHERE id = ? AND usuarioId = ?',
      [idPet, req.usuarioId]
    );

    if (!pet) {
      return res.status(403).json({
        mensagem: 'Pet inválido ou não pertence ao usuário.'
      });
    }

    // 📅 2. verificar se horário está disponível
    const agenda = await db.get(
      `
      SELECT *
      FROM agendas
      WHERE data = ?
        AND hora = ?
        AND ativo = 1
      `,
      [data, hora]
    );

    if (!agenda) {
      return res.status(409).json({
        mensagem: 'Horário não está disponível.'
      });
    }

    // ❌ 3. evitar duplicidade de agendamento
    const conflito = await db.get(
      `
      SELECT id
      FROM agendamentos
      WHERE data = ?
        AND hora = ?
        AND status = 'agendado'
      `,
      [data, hora]
    );

    if (conflito) {
      return res.status(409).json({
        mensagem: 'Esse horário já foi reservado.'
      });
    }

    // ✅ 4. inserir agendamento
    const resultado = await db.run(
      `
      INSERT INTO agendamentos (
        idPet,
        idServico,
        data,
        hora,
        observacao
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        idPet,
        idServico,
        data,
        hora,
        observacao || null
      ]
    );

    // 🔒 5. bloquear horário na agenda
    await db.run(
      `
      UPDATE agendas
      SET ativo = 0
      WHERE data = ? AND hora = ?
      `,
      [data, hora]
    );

    res.status(201).json({
      id: resultado.lastID,
      idPet,
      idServico,
      data,
      hora,
      observacao
    });

  } catch (erro) {
    console.error('[agendamentos.criar]', erro);
    res.status(500).json({ mensagem: 'Erro ao criar agendamento.' });
  }
}


// PUT /agendamentos/:id
export async function atualizar(req, res) {
  const { id } = req.params;

  const {
    idServico,
    data,
    hora,
    observacao,
    status
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

    const novaData = data ?? atual.data;
    const novaHora = hora ?? atual.hora;

    const conflito = await db.get(
      `
      SELECT id
      FROM agendamentos
      WHERE data = ?
        AND hora = ?
        AND id != ?
        AND status = 'agendado'
      `,
      [novaData, novaHora, id]
    );

    if (conflito) {
      return res.status(409).json({
        mensagem: 'Horário já está ocupado.'
      });
    }

    await db.run(
      `
      UPDATE agendamentos
      SET
        idServico = ?,
        data = ?,
        hora = ?,
        observacao = ?,
        status = ?
      WHERE id = ?
      `,
      [
        idServico ?? atual.idServico,
        novaData,
        novaHora,
        observacao ?? atual.observacao,
        status ?? atual.status,
        id
      ]
    );

    res.json({ mensagem: 'Agendamento atualizado com sucesso.' });

  } catch (erro) {
    console.error('[agendamentos.atualizar]', erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar agendamento.' });
  }
}


// DELETE /agendamentos/:id
export async function remover(req, res) {
  const { id } = req.params;

  try {
    const db = await getDatabase();

    const agendamento = await db.get(
      `
      SELECT a.*
      FROM agendamentos a
      INNER JOIN pets p ON p.id = a.idPet
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

    // 🔓 liberar horário novamente
    await db.run(
      `
      UPDATE agendas
      SET ativo = 1
      WHERE data = ? AND hora = ?
      `,
      [agendamento.data, agendamento.hora]
    );

    await db.run(
      'DELETE FROM agendamentos WHERE id = ?',
      [id]
    );

    res.json({ mensagem: 'Agendamento removido com sucesso.' });

  } catch (erro) {
    console.error('[agendamentos.remover]', erro);
    res.status(500).json({ mensagem: 'Erro ao remover agendamento.' });
  }
}
