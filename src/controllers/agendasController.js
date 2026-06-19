

import { getDatabase } from '../data/db.js';

// POST /agendas/gerar-mes
export async function gerarMes(req, res) {
  const { ano, mes } = req.body;

  if (!ano || !mes) {
    return res.status(400).json({
      mensagem: 'Ano e mês são obrigatórios.'
    });
  }

  try {
    const db = await getDatabase();

    const horarios = [
      '08:00', '09:00', '10:00', '11:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    const diasNoMes = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      for (const hora of horarios) {
        await db.run(
          `
          INSERT INTO agendas (data, hora, ativo)
          VALUES (?, ?, 1)
          `,
          [data, hora]
        );
      }
    }

    res.status(201).json({
      mensagem: 'Agenda do mês gerada com sucesso.'
    });

  } catch (erro) {
    console.error('[agendas.gerarMes]', erro);
    res.status(500).json({ mensagem: 'Erro ao gerar agenda.' });
  }
}

// LIBERAR HORÁRIO
export async function liberar(req, res) {
  const { data, hora } = req.body;

  try {
    const db = await getDatabase();

    await db.run(
      `
      UPDATE agendas
      SET ativo = 1
      WHERE data = ? AND hora = ?
      `,
      [data, hora]
    );

    res.json({ mensagem: 'Horário liberado.' });

  } catch (erro) {
    console.error('[agendas.liberar]', erro);
    res.status(500).json({ mensagem: 'Erro ao liberar horário.' });
  }
}

// BLOQUEAR HORÁRIO CRIADO/EXISTENTE
export async function bloquear(req, res) {
  const { data, hora } = req.body;

  try {
    const db = await getDatabase();

    await db.run(
      `
      UPDATE agendas
      SET ativo = 0
      WHERE data = ? AND hora = ?
      `,
      [data, hora]
    );

    res.json({ mensagem: 'Horário bloqueado.' });

  } catch (erro) {
    console.error('[agendas.bloquear]', erro);
    res.status(500).json({ mensagem: 'Erro ao bloquear horário.' });
  }
}

// LISTAR AGENDA DO MÊS
export async function listar(req, res) {
  const { ano, mes } = req.query;

  try {
    const db = await getDatabase();

    const agendas = await db.all(
      `
      SELECT *
      FROM agendas
      WHERE strftime('%Y', data) = ?
        AND strftime('%m', data) = ?
      ORDER BY data, hora
      `,
      [
        String(ano),
        String(mes).padStart(2, '0')
      ]
    );

    res.json(agendas);

  } catch (erro) {
    console.error('[agendas.listar]', erro);
    res.status(500).json({ mensagem: 'Erro ao listar agenda.' });
  }
}

// 
