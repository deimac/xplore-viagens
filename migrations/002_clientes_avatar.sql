-- Migration: adicionar avatar_url em clientes para foto de perfil (Google/Facebook)

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL AFTER email;