-- 009: Xplore TV - Multiple Video Sections

CREATE TABLE IF NOT EXISTS `xplore_tv_videos` (
    `id` int NOT NULL AUTO_INCREMENT,
    `nome` varchar(255) NOT NULL DEFAULT 'Vídeo',
    `video_url` varchar(500) NOT NULL,
    `ativo` tinyint(1) NOT NULL DEFAULT 1,
    `ordem` int NOT NULL DEFAULT 0,
    `transicao` enum('fade', 'slide') NOT NULL DEFAULT 'fade',
    `orientacao` enum(
        'horizontal',
        'vertical',
        'ambos'
    ) NOT NULL DEFAULT 'ambos',
    `criado_em` timestamp DEFAULT CURRENT_TIMESTAMP,
    `atualizado_em` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Remove the singleton video section from xplore_tv_secoes
DELETE FROM `xplore_tv_secoes` WHERE `codigo` = 'video';

-- Remove any existing video items from xplore_tv_itens
DELETE FROM `xplore_tv_itens` WHERE `tipo` = 'video';