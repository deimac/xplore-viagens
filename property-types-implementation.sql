-- Implementação de Tipos de Propriedade
-- Execução sequencial obrigatória

-- 1) Criar tabela property_types
CREATE TABLE property_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 2) Alterar tabela properties - adicionar coluna property_type_id
ALTER TABLE properties ADD COLUMN property_type_id INT NULL;

-- 3) Criar índice para property_type_id
CREATE INDEX idx_properties_property_type_id ON properties (property_type_id);

-- 4) Criar foreign key
ALTER TABLE properties
ADD CONSTRAINT fk_properties_property_type_id FOREIGN KEY (property_type_id) REFERENCES property_types (id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 5) Inserir tipos básicos (seed)
INSERT INTO
    property_types (name, slug)
VALUES ('Casa', 'casa'),
    ('Apartamento', 'apartamento'),
    ('Chalé', 'chale'),
    ('Pousada', 'pousada'),
    ('Hotel', 'hotel');