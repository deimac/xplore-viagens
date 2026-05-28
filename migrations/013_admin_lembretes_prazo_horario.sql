-- Migration 013: Add due time field to admin_lembretes
ALTER TABLE admin_lembretes
ADD COLUMN prazo_horario VARCHAR(5) NULL AFTER prazo;