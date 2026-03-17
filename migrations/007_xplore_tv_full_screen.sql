-- Adiciona campo full_screen às seções do Xplore TV
-- Quando TRUE, a seção exibe itens em tela cheia (um por vez, comportamento atual).
-- Quando FALSE, exibe um layout composto (carrossel com cards) para viagens e hospedagens.
ALTER TABLE xplore_tv_secoes
ADD COLUMN full_screen BOOLEAN NOT NULL DEFAULT FALSE;

-- Seções que devem sempre exibir em tela cheia (slider, contato e voos):
UPDATE xplore_tv_secoes
SET
    full_screen = TRUE
WHERE
    codigo IN (
        'slider',
        'contato_empresa',
        'voos_premium'
    );