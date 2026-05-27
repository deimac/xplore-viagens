-- Migration 012: Add sort_order column to admin_lembretes for manual reordering
ALTER TABLE admin_lembretes
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER prioridade;