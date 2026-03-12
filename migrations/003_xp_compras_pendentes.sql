-- =============================================
-- XP Compras Pendentes – geradas automaticamente
-- ao registrar um resgate, aguardando admin
-- completar valor pago e XP da nova compra.
-- =============================================


CREATE TABLE IF NOT EXISTS xp_compras_pendentes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT NOT NULL,
  id_movimentacao_resgate INT NOT NULL COMMENT 'FK para xp_movimentacoes (débito que originou)',
  id_movimentacao_compra  INT NULL     COMMENT 'FK para xp_movimentacoes (crédito gerado ao concluir)',
  id_users_criador        INT NOT NULL COMMENT 'Admin que criou o resgate',
  id_users_conclusao      INT NULL     COMMENT 'Admin que concluiu/cancelou',

  status ENUM('pendente','concluida','cancelada') NOT NULL DEFAULT 'pendente',

-- Dados herdados do resgate (sugeridos)
id_tipo_movimentacao_credito INT NULL COMMENT 'Tipo de crédito sugerido para a compra',
xp_resgate INT NOT NULL COMMENT 'XP debitados no resgate (valor absoluto)',
valor_resgate DECIMAL(10, 2) NULL COMMENT 'Valor de referência do resgate',
data_compra DATE NULL,
codigo_ref VARCHAR(30) NULL,
descricao_resgate VARCHAR(255) NULL,

-- Dados finais preenchidos pelo admin ao concluir
xp_compra INT NULL COMMENT 'XP creditados pela nova compra',
valor_compra DECIMAL(10, 2) NULL COMMENT 'Valor pago na nova compra',
descricao_compra VARCHAR(255) NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
concluida_em TIMESTAMP NULL,
cancelada_em TIMESTAMP NULL,

-- Constraints
CONSTRAINT fk_pendente_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id),
CONSTRAINT fk_pendente_resgate FOREIGN KEY (id_movimentacao_resgate) REFERENCES xp_movimentacoes (id),
CONSTRAINT fk_pendente_compra FOREIGN KEY (id_movimentacao_compra) REFERENCES xp_movimentacoes (id),
CONSTRAINT fk_pendente_criador FOREIGN KEY (id_users_criador) REFERENCES users (id),
CONSTRAINT fk_pendente_conclusao FOREIGN KEY (id_users_conclusao) REFERENCES users (id),
CONSTRAINT fk_pendente_tipo_cred FOREIGN KEY (id_tipo_movimentacao_credito) REFERENCES xp_tipos_movimentacao (id),

-- Impede duas pendências abertas para o mesmo resgate
CONSTRAINT uq_pendente_resgate UNIQUE (id_movimentacao_resgate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices operacionais
CREATE INDEX idx_pendente_status ON xp_compras_pendentes (status);

CREATE INDEX idx_pendente_cliente ON xp_compras_pendentes (id_cliente);