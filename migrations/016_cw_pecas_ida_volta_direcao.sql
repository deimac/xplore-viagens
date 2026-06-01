-- Suporte completo para ida/volta dentro da mesma peca.

ALTER TABLE cw_pecas
ADD COLUMN tem_volta TINYINT(1) NOT NULL DEFAULT 0 AFTER titulo,
ADD COLUMN origem_volta VARCHAR(120) NULL AFTER classe,
ADD COLUMN destino_volta VARCHAR(120) NULL AFTER origem_volta,
ADD COLUMN data_saida_volta DATETIME NULL AFTER data_chegada,
ADD COLUMN data_chegada_volta DATETIME NULL AFTER data_saida_volta,
ADD COLUMN duracao_minutos_volta INT NULL AFTER duracao_minutos,
ADD COLUMN qtd_conexoes_volta INT NOT NULL DEFAULT 0 AFTER qtd_conexoes,
ADD COLUMN companhias_volta VARCHAR(255) NULL AFTER companhias,
ADD COLUMN classe_volta VARCHAR(40) NULL AFTER classe;

ALTER TABLE cw_segmentos
ADD COLUMN direcao ENUM('ida', 'volta') NOT NULL DEFAULT 'ida' AFTER peca_id;