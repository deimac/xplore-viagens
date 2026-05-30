-- Workspace de Cotacoes (admin)
-- Dominio operacional independente do formulario publico de orcamento.

CREATE TABLE IF NOT EXISTS cw_cotacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(320) NULL,
    cliente_telefone VARCHAR(50) NULL,
    origem VARCHAR(120) NULL,
    destino VARCHAR(120) NULL,
    data_ida DATE NULL,
    data_volta DATE NULL,
    pax_adultos INT NOT NULL DEFAULT 1,
    pax_criancas INT NOT NULL DEFAULT 0,
    pax_bebes INT NOT NULL DEFAULT 0,
    observacoes TEXT NULL,
    status ENUM(
        'rascunho',
        'em_pesquisa',
        'em_montagem',
        'proposta_enviada',
        'fechada',
        'cancelada'
    ) NOT NULL DEFAULT 'rascunho',
    id_users_criador INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cw_cotacoes_status (status),
    INDEX idx_cw_cotacoes_criado_em (criado_em),
    CONSTRAINT fk_cw_cotacoes_user FOREIGN KEY (id_users_criador) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_pecas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotacao_id INT NOT NULL,
    titulo VARCHAR(255) NULL,
    origem VARCHAR(120) NULL,
    destino VARCHAR(120) NULL,
    data_saida DATETIME NULL,
    data_chegada DATETIME NULL,
    duracao_minutos INT NULL,
    qtd_conexoes INT NOT NULL DEFAULT 0,
    companhias VARCHAR(255) NULL,
    bagagem VARCHAR(255) NULL,
    classe VARCHAR(40) NULL,
    tipo_financeiro ENUM('milhas', 'pagante', 'misto') NOT NULL DEFAULT 'pagante',
    custo DECIMAL(10, 2) NULL,
    venda DECIMAL(10, 2) NULL,
    fonte VARCHAR(80) NULL,
    estrategia TEXT NULL,
    status ENUM('pesquisa', 'favorita') NOT NULL DEFAULT 'pesquisa',
    sort_order INT NOT NULL DEFAULT 0,
    origem_dados ENUM('manual', 'texto', 'print') NOT NULL DEFAULT 'manual',
    observacoes TEXT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cw_pecas_cotacao (cotacao_id),
    INDEX idx_cw_pecas_status (status),
    CONSTRAINT fk_cw_pecas_cotacao FOREIGN KEY (cotacao_id) REFERENCES cw_cotacoes (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_segmentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    peca_id INT NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    aeroporto_origem VARCHAR(10) NULL,
    aeroporto_destino VARCHAR(10) NULL,
    cidade_origem VARCHAR(120) NULL,
    cidade_destino VARCHAR(120) NULL,
    saida DATETIME NULL,
    chegada DATETIME NULL,
    companhia VARCHAR(120) NULL,
    numero_voo VARCHAR(20) NULL,
    classe VARCHAR(40) NULL,
    bagagem VARCHAR(120) NULL,
    duracao_conexao_minutos INT NULL,
    INDEX idx_cw_segmentos_peca (peca_id),
    CONSTRAINT fk_cw_segmentos_peca FOREIGN KEY (peca_id) REFERENCES cw_pecas (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_cenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotacao_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT NULL,
    status ENUM(
        'rascunho',
        'selecionado_proposta'
    ) NOT NULL DEFAULT 'rascunho',
    sort_order INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cw_cenarios_cotacao (cotacao_id),
    CONSTRAINT fk_cw_cenarios_cotacao FOREIGN KEY (cotacao_id) REFERENCES cw_cotacoes (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_cenario_pecas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cenario_id INT NOT NULL,
    peca_id INT NOT NULL,
    grupo ENUM('ida', 'volta', 'outro') NOT NULL DEFAULT 'outro',
    ordem INT NOT NULL DEFAULT 0,
    INDEX idx_cw_cp_cenario (cenario_id),
    INDEX idx_cw_cp_peca (peca_id),
    CONSTRAINT fk_cw_cp_cenario FOREIGN KEY (cenario_id) REFERENCES cw_cenarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_cw_cp_peca FOREIGN KEY (peca_id) REFERENCES cw_pecas (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_propostas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotacao_id INT NOT NULL,
    titulo VARCHAR(255) NULL,
    validade_data DATE NULL,
    snapshot_json LONGTEXT NOT NULL,
    gerada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_users_gerador INT NOT NULL,
    INDEX idx_cw_propostas_cotacao (cotacao_id),
    CONSTRAINT fk_cw_propostas_cotacao FOREIGN KEY (cotacao_id) REFERENCES cw_cotacoes (id) ON DELETE CASCADE,
    CONSTRAINT fk_cw_propostas_user FOREIGN KEY (id_users_gerador) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cw_arquivos_origem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotacao_id INT NOT NULL,
    peca_id INT NULL,
    tipo ENUM('print', 'texto') NOT NULL,
    url TEXT NULL,
    conteudo_texto LONGTEXT NULL,
    provedor_ia VARCHAR(80) NULL,
    status ENUM(
        'pendente',
        'processado',
        'erro'
    ) NOT NULL DEFAULT 'pendente',
    erro_msg TEXT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cw_arq_cotacao (cotacao_id),
    INDEX idx_cw_arq_peca (peca_id),
    CONSTRAINT fk_cw_arq_cotacao FOREIGN KEY (cotacao_id) REFERENCES cw_cotacoes (id) ON DELETE CASCADE,
    CONSTRAINT fk_cw_arq_peca FOREIGN KEY (peca_id) REFERENCES cw_pecas (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;