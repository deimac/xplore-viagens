-- Campos financeiros adicionais para pecas com milhas.

ALTER TABLE cw_pecas
ADD COLUMN qtd_milhas INT NULL AFTER tipo_financeiro,
ADD COLUMN valor_milheiro DECIMAL(10, 2) NULL AFTER qtd_milhas;