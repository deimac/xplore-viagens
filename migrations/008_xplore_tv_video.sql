-- 008: Xplore TV - Seção de Vídeo

INSERT INTO
    `xplore_tv_secoes` (
        `codigo`,
        `nome`,
        `ativo`,
        `ordem`,
        `transicao`,
        `orientacao`,
        `duracao_secao_ms`,
        `duracao_item_ms`,
        `full_screen`
    )
VALUES (
        'video',
        'Vídeo',
        FALSE,
        5,
        'fade',
        'ambos',
        30000,
        30000,
        TRUE
    );