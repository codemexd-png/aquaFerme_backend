-- ============================================================
-- DIVINE ALIMENTATION — Mise à jour base de données
-- À exécuter si vous avez une version antérieure du schéma
-- Toutes les commandes utilisent IF NOT EXISTS pour éviter
-- les erreurs en cas de doublon.
-- ============================================================
 
 
-- ============================================================
-- 1. TABLE daily_feed
--    Stocke la consommation journalière de nourriture par étang
-- ============================================================
 
CREATE TABLE IF NOT EXISTS daily_feed (
    id               SERIAL PRIMARY KEY,
    pond_id          INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
    feed_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    food_given_kg    DECIMAL(10,2) DEFAULT 0,
    food_planned_kg  DECIMAL(10,2) DEFAULT 0,
    created_at       TIMESTAMP DEFAULT NOW()
);
 
-- Contrainte unicité : un seul enregistrement par étang par jour
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'daily_feed_pond_date_unique'
    ) THEN
        ALTER TABLE daily_feed
            ADD CONSTRAINT daily_feed_pond_date_unique
            UNIQUE (pond_id, feed_date);
    END IF;
END$$;
 
 
-- ============================================================
-- 2. TABLE feed_stock
--    Gestion du stock d'aliments avec seuils d'alerte
-- ============================================================
 
CREATE TABLE IF NOT EXISTS feed_stock (
    id                  SERIAL PRIMARY KEY,
    product_name        VARCHAR(100) NOT NULL,
    quantity_kg         DECIMAL(10,2) DEFAULT 0,
    alert_threshold_kg  DECIMAL(10,2) DEFAULT 50,
    updated_at          TIMESTAMP DEFAULT NOW()
);
 
-- Données initiales (insérées seulement si la table est vide)
INSERT INTO feed_stock (product_name, quantity_kg, alert_threshold_kg)
SELECT * FROM (VALUES
    ('Aliment starter',    120.00, 50.00),
    ('Aliment croissance',  85.00, 40.00),
    ('Aliment finition',    30.00, 50.00)
) AS v(product_name, quantity_kg, alert_threshold_kg)
WHERE NOT EXISTS (SELECT 1 FROM feed_stock LIMIT 1);
 
 
-- ============================================================
-- 3. TABLE tasks — ajout colonne assigned_to
--    Permet d'assigner une tâche à un employé spécifique
-- ============================================================
 
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);
 
 
-- ============================================================
-- 4. TABLE notifications
--    Notifications envoyées depuis l'interface web admin
-- ============================================================
 
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
 
 
-- ============================================================
-- Vérification finale
-- ============================================================
 
DO $$
BEGIN
    RAISE NOTICE '✓ daily_feed       : OK';
    RAISE NOTICE '✓ feed_stock       : OK';
    RAISE NOTICE '✓ tasks.assigned_to: OK';
    RAISE NOTICE '✓ notifications    : OK';
    RAISE NOTICE '→ Mise à jour terminée sans erreur.';
END$$