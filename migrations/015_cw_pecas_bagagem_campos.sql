-- Separa bagagem da peça em quantidades inteiras por tipo.

ALTER TABLE cw_pecas
    ADD COLUMN item_pessoal INT NOT NULL DEFAULT 1 AFTER classe,
    ADD COLUMN bagagem_mao INT NOT NULL DEFAULT 0 AFTER item_pessoal,
    ADD COLUMN bagagem_despachada INT NOT NULL DEFAULT 0 AFTER bagagem_mao;

ALTER TABLE cw_pecas DROP COLUMN bagagem;
