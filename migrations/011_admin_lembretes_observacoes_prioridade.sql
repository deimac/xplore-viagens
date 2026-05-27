-- =============================================
-- Evolucao de lembretes admin: observacoes + prioridade
-- =============================================

ALTER TABLE admin_lembretes
ADD COLUMN observacoes TEXT NULL AFTER titulo,
ADD COLUMN prioridade ENUM('normal', 'media', 'alta') NOT NULL DEFAULT 'normal' AFTER origem;

CREATE INDEX idx_admin_lembretes_prioridade ON admin_lembretes (prioridade);