ALTER TABLE cw_pecas
ADD COLUMN item_pessoal_volta INT NOT NULL DEFAULT 1 AFTER bagagem_despachada,
ADD COLUMN bagagem_mao_volta INT NOT NULL DEFAULT 0 AFTER item_pessoal_volta,
ADD COLUMN bagagem_despachada_volta INT NOT NULL DEFAULT 0 AFTER bagagem_mao_volta;