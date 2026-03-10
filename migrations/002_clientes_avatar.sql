-- Migration: adicionar avatar_url em clientes para foto de perfil (Google/Facebook)

SET
    @col_exists := (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'clientes'
            AND COLUMN_NAME = 'avatar_url'
    );

SET
    @ddl := IF(
        @col_exists = 0,
        'ALTER TABLE clientes ADD COLUMN avatar_url TEXT NULL AFTER email',
        'SELECT 1'
    );

PREPARE stmt FROM @ddl;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;