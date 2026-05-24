-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des étangs
CREATE TABLE IF NOT EXISTS ponds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pond_group VARCHAR(20) NOT NULL CHECK (pond_group IN ('A', 'B', 'C', 'D', 'Barrage')),
    area_m2 NUMERIC(10,2),
    max_capacity INTEGER,
    current_fish_count INTEGER DEFAULT 0
);

INSERT INTO ponds (name, pond_group, area_m2, max_capacity, current_fish_count)
VALUES
-- Étangs A : 900 m², capacité 2250
('A1', 'A', 900, 2250, 1800),
('A2', 'A', 900, 2250, 2100),
('A3', 'A', 900, 2250, 1500),
('A4', 'A', 900, 2250, 0),
('A5', 'A', 900, 2250, 0),
('A6', 'A', 900, 2250, 0),
('A7', 'A', 900, 2250, 0),

-- Étangs B : 600 m², capacité 1500
('B1', 'B', 600, 1500, 1200),
('B2', 'B', 600, 1500, 0),
('B3', 'B', 600, 1500, 0),
('B4', 'B', 600, 1500, 0),
('B5', 'B', 600, 1500, 0),

-- Étangs C : 150 m², capacité 375
('C1', 'C', 150, 375, 300),
('C2', 'C', 150, 375, 0),
('C3', 'C', 150, 375, 0),

-- Étangs D : 400 m², capacité 1000
('D1', 'D', 400, 1000, 0),
('D2', 'D', 400, 1000, 0),

-- Barrage
('Barrage principal', 'Barrage', 50000, 50000, 5000)
ON CONFLICT DO NOTHING;

-- Table des opérations sur les poissons
CREATE TABLE IF NOT EXISTS fish_operations (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('control', 'mortality', 'transfer', 'addition')),
    operation_date DATE NOT NULL,
    fish_count INTEGER NOT NULL,
    avg_weight_g NUMERIC(8,2),
    target_pond_id INTEGER REFERENCES ponds(id),
    notes TEXT
);

-- Table de la qualité de l'eau
CREATE TABLE IF NOT EXISTS water_quality (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    measurement_date DATE NOT NULL,
    oxygen_level_mg_l NUMERIC(5,2),
    temperature_c NUMERIC(5,2),
    water_color VARCHAR(50)
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    pond_id INTEGER REFERENCES ponds(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
    task_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger pour mettre à jour current_fish_count automatiquement
CREATE OR REPLACE FUNCTION update_fish_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.operation_type = 'addition' THEN
        UPDATE ponds SET current_fish_count = current_fish_count + NEW.fish_count WHERE id = NEW.pond_id;
    ELSIF NEW.operation_type = 'mortality' THEN
        UPDATE ponds SET current_fish_count = current_fish_count - NEW.fish_count WHERE id = NEW.pond_id;
    ELSIF NEW.operation_type = 'transfer' THEN
        UPDATE ponds SET current_fish_count = current_fish_count - NEW.fish_count WHERE id = NEW.pond_id;
        UPDATE ponds SET current_fish_count = current_fish_count + NEW.fish_count WHERE id = NEW.target_pond_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fish_count
AFTER INSERT ON fish_operations
FOR EACH ROW EXECUTE FUNCTION update_fish_count();