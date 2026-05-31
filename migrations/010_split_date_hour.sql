-- Up migration: separa data e hora em campos distintos para cotacoes e segmentos
ALTER TABLE cotacoes
ADD COLUMN data_saida DATE,
ADD COLUMN hora_saida VARCHAR(5),
ADD COLUMN data_chegada DATE,
ADD COLUMN hora_chegada VARCHAR(5);

UPDATE cotacoes
SET
    data_saida = DATE(dataSaida),
    hora_saida = TIME_FORMAT(dataSaida, '%H:%i'),
    data_chegada = DATE(dataChegada),
    hora_chegada = TIME_FORMAT(dataChegada, '%H:%i');

ALTER TABLE cotacoes
DROP COLUMN dataSaida,
DROP COLUMN dataChegada;

ALTER TABLE segmentos
ADD COLUMN data_saida DATE,
ADD COLUMN hora_saida VARCHAR(5),
ADD COLUMN data_chegada DATE,
ADD COLUMN hora_chegada VARCHAR(5);

UPDATE segmentos
SET
    data_saida = DATE(saida),
    hora_saida = TIME_FORMAT(saida, '%H:%i'),
    data_chegada = DATE(chegada),
    hora_chegada = TIME_FORMAT(chegada, '%H:%i');

ALTER TABLE segmentos DROP COLUMN saida, DROP COLUMN chegada;