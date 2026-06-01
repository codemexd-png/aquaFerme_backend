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
    assigned_to INTEGER REFERENCES users(id),
    pond_id INTEGER REFERENCES ponds(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
    task_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table alimentation journalière
CREATE TABLE IF NOT EXISTS daily_feed (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES ponds(id),
    feed_given_kg DECIMAL(10,2) NOT NULL,
    feed_total_kg DECIMAL(10,2) NOT NULL,
    feed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table stock aliments
CREATE TABLE IF NOT EXISTS feed_stock (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    alert_threshold_kg DECIMAL(10,2) DEFAULT 50,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des ventes
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    quartier VARCHAR(100),
    contact VARCHAR(50),
    commande TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'en_attente' CHECK (status IN ('waiting', 'delivered')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table tokens notifications push
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
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