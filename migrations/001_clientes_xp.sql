-- Migration: Adicionar password_hash à tabela clientes + índice único no CPF
-- Executar manualmente no MySQL antes de iniciar a área do cliente

-- Coluna password_hash (nullable, para login por email/senha)
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email;

-- Índice único no CPF (permite NULL, mas impede duplicatas quando preenchido)
-- MySQL permite múltiplos NULL em UNIQUE index
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf);

-- Índice único composto em xp_codigos_usados para impedir reuso
CREATE UNIQUE INDEX IF NOT EXISTS idx_codigos_usados_unico ON xp_codigos_usados (id_codigo, id_cliente);

-- Índice para performance do extrato
CREATE INDEX IF NOT EXISTS idx_movimentacoes_cliente_data ON xp_movimentacoes (id_cliente, created_at);