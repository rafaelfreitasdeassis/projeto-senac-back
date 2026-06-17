-- Arquivo de apoio para os alunos enxergarem o SQL das tabelas base.
-- Quando for criar uma tabela nova manualmente:
-- 1) escreva o CREATE TABLE aqui como rascunho e referencia;
-- 2) copie a mesma estrutura para src/data/db.js;
-- 3) suba o projeto para o backend executar o CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS usuarios (
        id        INTEGER PRIMARY KEY GENERATED ALWAYS as IDENTITY,
        nome      TEXT NOT NULL,
        email     TEXT NOT NULL UNIQUE,
        telefone  TEXT,
        senha     TEXT NOT NULL,
        foto      TEXT,
        tipoUsuario TEXT NOT NULL

      );

CREATE TABLE IF NOT EXISTS pets (
        id         INTEGER PRIMARY KEY GENERATED ALWAYS as IDENTITY,
        nome     TEXT NOT NULL,
        raca  TEXT,
        porte TEXT,
        peso NUMERIC(10,2),
                usuarioId  INTEGER NOT NULL,
        FOREIGN KEY (usuarioId) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS servicos (
        id         INTEGER PRIMARY KEY GENERATED ALWAYS as IDENTITY,
        nome     TEXT NOT NULL,
        descricao  TEXT,
        preco NUMERIC(10,2)
      );

CREATE TABLE IF NOT EXISTS servicoPet (
        idPet         INTEGER NOT NULL,
        idServico     INTEGER NOT NULL,
        IdData INTEGER
      );
