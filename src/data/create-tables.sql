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

CREATE TABLE IF NOT EXISTS servico_pet (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    idPet INTEGER NOT NULL,
    idServico INTEGER NOT NULL,

    data_agendamento DATE,

    observacao TEXT,

    FOREIGN KEY (idPet)
        REFERENCES pets(id)
        ON DELETE CASCADE,

    FOREIGN KEY (idServico)
        REFERENCES servicos(id)
        ON DELETE CASCADE
);