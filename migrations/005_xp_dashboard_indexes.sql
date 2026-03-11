-- Migration: Índices de performance para dashboard XP Club
-- Os índices de data_movimentacao e data_uso aceleram as consultas de período.
-- O índice antigo idx_movimentacoes_cliente_data apontava para created_at (errado).

-- Movimentações: filtro por período e por tipo+período
ALTER TABLE xp_movimentacoes
ADD INDEX idx_xp_mov_data_movimentacao (data_movimentacao),
ADD INDEX idx_xp_mov_tipo_data (
    id_tipo_movimentacao,
    data_movimentacao
),
ADD INDEX idx_xp_mov_cliente_data_mov (id_cliente, data_movimentacao);

-- Códigos usados: filtro por data_uso no período
ALTER TABLE xp_codigos_usados
ADD INDEX idx_xp_codigos_usados_data_uso (data_uso);

-- Códigos: filtro por ativo + data_expiracao
ALTER TABLE xp_codigos
ADD INDEX idx_xp_codigos_ativo_expiracao (ativo, data_expiracao);