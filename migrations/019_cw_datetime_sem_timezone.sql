-- Garante que campos de data/hora do workspace de cotacoes
-- sejam DATETIME (sem conversao automatica de timezone).

ALTER TABLE cw_pecas
MODIFY COLUMN data_saida DATETIME NULL,
MODIFY COLUMN data_chegada DATETIME NULL,
MODIFY COLUMN data_saida_volta DATETIME NULL,
MODIFY COLUMN data_chegada_volta DATETIME NULL;

ALTER TABLE cw_segmentos
MODIFY COLUMN saida DATETIME NULL,
MODIFY COLUMN chegada DATETIME NULL;