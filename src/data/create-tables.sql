-- Arquivo de apoio para os alunos enxergarem o SQL das tabelas base.
-- Quando for criar uma tabela nova manualmente:
-- 1) escreva o CREATE TABLE aqui como rascunho e referencia;
-- 2) copie a mesma estrutura para src/data/db.js;
-- 3) suba o projeto para o backend executar o CREATE TABLE IF NOT EXISTS.


-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    nome TEXT NOT NULL,

    telefone TEXT NOT NULL
        CHECK (length(telefone) >= 10),

    foto_url TEXT,

    tipo_usuario TEXT NOT NULL DEFAULT 'TUTOR'
        CHECK (tipo_usuario IN ('TUTOR', 'ADMIN')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA DE PETS
-- =====================================================

CREATE TABLE pets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    nome TEXT NOT NULL,

    especie TEXT NOT NULL
        CHECK (especie IN ('CACHORRO', 'GATO')),

    sexo TEXT NOT NULL
        CHECK (sexo IN ('MACHO', 'FEMEA')),

    raca TEXT,

    porte TEXT
        CHECK (porte IN ('PEQUENO', 'MEDIO', 'GRANDE')),

    peso NUMERIC(10,2)
        CHECK (peso > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA DE SERVIÇOS
-- =====================================================

CREATE TABLE servicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome TEXT NOT NULL UNIQUE,

    descricao TEXT,

    preco NUMERIC(10,2)
        CHECK (preco >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SERVIÇOS PADRÃO
-- =====================================================

INSERT INTO servicos (nome, descricao, preco)
VALUES
(
    'BANHO',
    'Banho completo com shampoo e secagem',
    40.00
),
(
    'TOSA_HIGIENICA',
    'Tosa das áreas íntimas, patas e rosto',
    25.00
),
(
    'BANHO_E_TOSA_COMPLETA',
    'Banho completo acompanhado de tosa geral',
    70.00
);

-- =====================================================
-- TABELA DE AGENDAMENTOS
-- =====================================================

CREATE TABLE agendamentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    pet_id BIGINT NOT NULL
        REFERENCES pets(id)
        ON DELETE CASCADE,

    servico_id BIGINT NOT NULL
        REFERENCES servicos(id)
        ON DELETE RESTRICT,

    data_agendamento TIMESTAMPTZ NOT NULL,

    valor NUMERIC(10,2)
        CHECK (valor >= 0),

    status TEXT NOT NULL DEFAULT 'AGENDAMENTO_PENDENTE'
        CHECK (
            status IN (
                'AGENDAMENTO_PENDENTE',
                'AGENDAMENTO_CONCLUIDO',
                'AGENDAMENTO_CANCELADO'
            )
        ),

    observacao TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_pets_usuario
ON pets(usuario_id);

CREATE INDEX idx_agendamentos_pet
ON agendamentos(pet_id);

CREATE INDEX idx_agendamentos_servico
ON agendamentos(servico_id);

CREATE INDEX idx_agendamentos_data
ON agendamentos(data_agendamento);

-- =====================================================
-- CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.usuarios (
        id,
        nome
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nome',
            'Novo Usuário'
        )
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS USUÁRIOS
-- =====================================================

CREATE POLICY "Usuario visualiza seu perfil"
ON usuarios
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuario atualiza seu perfil"
ON usuarios
FOR UPDATE
USING (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PETS
-- =====================================================

CREATE POLICY "Usuario visualiza seus pets"
ON pets
FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuario cadastra seus pets"
ON pets
FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuario atualiza seus pets"
ON pets
FOR UPDATE
USING (usuario_id = auth.uid());

CREATE POLICY "Usuario remove seus pets"
ON pets
FOR DELETE
USING (usuario_id = auth.uid());

-- =====================================================
-- POLÍTICAS AGENDAMENTOS
-- =====================================================

CREATE POLICY "Usuario visualiza seus agendamentos"
ON agendamentos
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM pets
        WHERE pets.id = agendamentos.pet_id
        AND pets.usuario_id = auth.uid()
    )
);

CREATE POLICY "Usuario cria agendamentos"
ON agendamentos
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM pets
        WHERE pets.id = agendamentos.pet_id
        AND pets.usuario_id = auth.uid()
    )
);

CREATE POLICY "Usuario atualiza seus agendamentos"
ON agendamentos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM pets
        WHERE pets.id = agendamentos.pet_id
        AND pets.usuario_id = auth.uid()
    )
);

CREATE POLICY "Usuario remove seus agendamentos"
ON agendamentos
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM pets
        WHERE pets.id = agendamentos.pet_id
        AND pets.usuario_id = auth.uid()
    )
);

-- =====================================================
-- POLÍTICAS SERVIÇOS
-- =====================================================

CREATE POLICY "Todos podem visualizar servicos"
ON servicos
FOR SELECT
USING (true);
```

```sql
-- =====================================================
-- POLÍTICAS DE ADMINISTRADOR
-- =====================================================

-- Administrador visualiza todos os usuários

CREATE POLICY "Admin visualiza todos os usuarios"
ON usuarios
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

-- Administrador atualiza qualquer usuário

CREATE POLICY "Admin atualiza usuarios"
ON usuarios
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

-- =====================================================
-- PETS
-- =====================================================

CREATE POLICY "Admin visualiza todos os pets"
ON pets
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin atualiza todos os pets"
ON pets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin remove pets"
ON pets
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

-- =====================================================
-- AGENDAMENTOS
-- =====================================================

CREATE POLICY "Admin visualiza todos os agendamentos"
ON agendamentos
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin atualiza todos os agendamentos"
ON agendamentos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin remove agendamentos"
ON agendamentos
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

-- =====================================================
-- SERVIÇOS
-- =====================================================

CREATE POLICY "Admin cria servicos"
ON servicos
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin atualiza servicos"
ON servicos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);

CREATE POLICY "Admin remove servicos"
ON servicos
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND tipo_usuario = 'ADMIN'
    )
);
```

