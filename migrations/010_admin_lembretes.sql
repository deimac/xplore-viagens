-- =============================================
-- Admin Lembretes / Tarefas rápidas do dashboard
-- Captura operacional de demandas, retornos e cotações
-- =============================================

CREATE TABLE IF NOT EXISTS admin_lembretes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    origem VARCHAR(50) NULL,
    prazo DATE NULL,
    status ENUM('pendente', 'concluida') NOT NULL DEFAULT 'pendente',
    id_users_criador INT NOT NULL,
    id_users_conclusao INT NULL,
    concluida_em TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_lembretes_criador FOREIGN KEY (id_users_criador) REFERENCES users (id),
    CONSTRAINT fk_admin_lembretes_conclusao FOREIGN KEY (id_users_conclusao) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_admin_lembretes_status ON admin_lembretes (status);

CREATE INDEX idx_admin_lembretes_prazo ON admin_lembretes (prazo);

CREATE INDEX idx_admin_lembretes_criador ON admin_lembretes (id_users_criador);