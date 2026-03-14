-- Xplore TV – Vitrine Digital para TV
CREATE TABLE IF NOT EXISTS `xplore_tv_itens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tipo` ENUM(
        'imagem',
        'video',
        'marca',
        'contato'
    ) NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `ordem` INT NOT NULL DEFAULT 0,
    `duracao_ms` INT NOT NULL DEFAULT 8000,
    `transicao` ENUM('fade', 'slide') NOT NULL DEFAULT 'fade',
    `orientacao` ENUM(
        'horizontal',
        'vertical',
        'ambos'
    ) NOT NULL DEFAULT 'horizontal',
    `payload` TEXT NULL,
    `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;