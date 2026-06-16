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

function ehErroEmailDuplicado(erro) {
  return erro?.code === '23505' || erro?.message?.includes('UNIQUE constraint failed');
}

// GET /usuarios — lista todos (sem o campo senha)
export async function listar(req, res) {
  try {
    const db = await getDatabase();
    const pets = await db.all(
      'SELECT id, nome, raca, porte, peso, usuarioId FROM pet ORDER BY id'
    );
    res.json(pets);
  } catch (erro) {
    console.error('[pet.listar]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pet.' });
  }
}

// GET /usuarios/:id
export async function buscarPorId(req, res) {
  const { id } = req.params;
  try {
    const db = await getDatabase();
    const pets = await db.get(
      'SELECT id, nome, raca, porte, peso, usuarioId FROM pet WHERE id = ?',
      [id]
    );

    if (!pets) {
      return res.status(404).json({ mensagem: 'Pet não encontrado.' });
    }
    res.json(pets);
  } catch (erro) {
    console.error('[pets.buscarPorId]', erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pet.' });
  }
}

// POST /usuarios — cadastro público
export async function criar(req, res) {
  const { nome, raca, porte, peso, usuarioId } = req.body;

  if (!nome || !raca || !porte || !usuarioId ) {
    return res.status(400).json({ mensagem: 'Campos obrigatórios ausentes.' });
  }

}

