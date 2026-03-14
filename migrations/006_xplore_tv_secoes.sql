-- 006: Xplore TV Pivot - Seções estáticas e flags de publicação (mostrarNoSite / mostrarNaTv)

-- 1. Flags de publicação em heroSlides
ALTER TABLE `heroSlides`
ADD COLUMN `mostrarNoSite` TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN `mostrarNaTv` TINYINT(1) NOT NULL DEFAULT 1;

-- 2. Flags de publicação em viagens
ALTER TABLE `viagens`
ADD COLUMN `mostrarNoSite` TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN `mostrarNaTv` TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Flags de publicação em properties (hospedagens)
ALTER TABLE `properties`
ADD COLUMN `mostrarNoSite` TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN `mostrarNaTv` TINYINT(1) NOT NULL DEFAULT 0;

-- 4. Flags de publicação em ofertas_voo (voos premium)
ALTER TABLE `ofertas_voo`
ADD COLUMN `mostrarNoSite` TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN `mostrarNaTv` TINYINT(1) NOT NULL DEFAULT 0;

-- 5. Tabela de seções do Xplore TV
CREATE TABLE IF NOT EXISTS `xplore_tv_secoes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(50) NOT NULL UNIQUE,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `ordem` INT NOT NULL DEFAULT 0,
    `transicao` ENUM('fade', 'slide') NOT NULL DEFAULT 'fade',
    `orientacao` ENUM(
        'horizontal',
        'vertical',
        'ambos'
    ) NOT NULL DEFAULT 'ambos',
    `duracao_secao_ms` INT NOT NULL DEFAULT 30000,
    `duracao_item_ms` INT NOT NULL DEFAULT 8000,
    `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 6. Seed das seções iniciais
INSERT INTO
    `xplore_tv_secoes` (
        `codigo`,
        `nome`,
        `ativo`,
        `ordem`,
        `duracao_secao_ms`,
        `duracao_item_ms`
    )
VALUES (
        'slider',
        'Slider de Imagens',
        TRUE,
        0,
        40000,
        8000
    ),
    (
        'viagens',
        'Viagens',
        TRUE,
        1,
        30000,
        10000
    ),
    (
        'hospedagens',
        'Hospedagens',
        TRUE,
        2,
        30000,
        10000
    ),
    (
        'voos_premium',
        'Voos Premium',
        TRUE,
        3,
        25000,
        8000
    ),
    (
        'contato_empresa',
        'Contato da Empresa',
        TRUE,
        4,
        15000,
        15000
    );