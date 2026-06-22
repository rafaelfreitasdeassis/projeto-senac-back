-- USUÁRIOS
INSERT INTO usuarios (nome, email, telefone, senha, foto, tipoUsuario)
VALUES
('João Silva', 'joao@email.com', '(11) 99999-1111', '123456', 'https://picsum.photos/200?1', 'cliente'),
('Maria Oliveira', 'maria@email.com', '(11) 99999-2222', '123456', 'https://picsum.photos/200?2', 'cliente'),
('Carlos Santos', 'carlos@email.com', '(11) 99999-3333', '123456', 'https://picsum.photos/200?3', 'cliente'),
('Ana Costa', 'ana@email.com', '(11) 99999-4444', '123456', 'https://picsum.photos/200?4', 'funcionario');

-- PETS
INSERT INTO pets (nome, raca, porte, peso, usuarioId)
VALUES
('Rex', 'Labrador', 'Grande', 28.50, 1),
('Mel', 'Poodle', 'Pequeno', 6.20, 1),
('Thor', 'Pastor Alemão', 'Grande', 35.00, 2),
('Luna', 'Shih Tzu', 'Pequeno', 5.80, 2),
('Nina', 'Vira-lata', 'Médio', 12.40, 3);

-- SERVIÇOS
INSERT INTO servicos (nome, descricao, preco)
VALUES
('Banho', 'Banho completo para pets', 50.00),
('Tosa', 'Tosa higiênica e estética', 70.00),
('Consulta Veterinária', 'Consulta clínica geral', 120.00),
('Vacinação', 'Aplicação de vacinas', 90.00),
('Corte de Unhas', 'Corte e lixamento das unhas', 25.00);

-- AGENDAS (horários disponíveis)
INSERT INTO agendas (data, hora, ativo)
VALUES
('2026-07-01', '09:00', true),
('2026-07-01', '10:00', true),
('2026-07-01', '11:00', true),
('2026-07-01', '14:00', true),
('2026-07-01', '15:00', true),
('2026-07-02', '09:00', true),
('2026-07-02', '10:00', true),
('2026-07-02', '14:00', true);

-- AGENDAMENTOS
INSERT INTO agendamentos (
    idPet,
    idServico,
    data,
    hora,
    status,
    observacao
)
VALUES
(1, 1, '2026-07-01', '09:00', 'agendado', 'Primeiro banho do pet'),
(2, 2, '2026-07-01', '10:00', 'confirmado', 'Tosa completa'),
(3, 3, '2026-07-01', '14:00', 'agendado', 'Consulta de rotina'),
(4, 4, '2026-07-02', '09:00', 'concluido', 'Vacina anual'),
(5, 5, '2026-07-02', '10:00', 'cancelado', 'Cliente não compareceu');
