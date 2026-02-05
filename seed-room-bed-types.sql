-- Populando tipos de quartos
INSERT IGNORE INTO
    room_types (name, slug)
VALUES (
        'Quarto Individual',
        'individual'
    ),
    ('Quarto Duplo', 'duplo'),
    ('Quarto Triplo', 'triplo'),
    ('Quarto Família', 'familia'),
    ('Suíte', 'suite'),
    (
        'Suíte Master',
        'suite-master'
    ),
    (
        'Quarto com Varanda',
        'varanda'
    ),
    (
        'Quarto com Vista Mar',
        'vista-mar'
    ),
    (
        'Dormitório Compartilhado',
        'compartilhado'
    );

-- Populando tipos de camas
INSERT IGNORE INTO
    bed_types (name, slug, sleeps_count)
VALUES (
        'Cama de Solteiro',
        'solteiro',
        1
    ),
    ('Cama de Casal', 'casal', 2),
    ('Cama King', 'king', 2),
    ('Cama Queen', 'queen', 2),
    ('Beliche', 'beliche', 2),
    ('Sofá-cama', 'sofa-cama', 1),
    (
        'Colchão no Chão',
        'colchao-chao',
        1
    );

-- Verificar o que foi inserido
SELECT 'Room Types:' as '', COUNT(*) as total FROM room_types;

SELECT * FROM room_types ORDER BY name;

SELECT 'Bed Types:' as '', COUNT(*) as total FROM bed_types;

SELECT * FROM bed_types ORDER BY sleeps_count DESC, name;