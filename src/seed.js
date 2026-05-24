// Ce script insère des données de test réalistes dans toutes les tables de la base.
// À lancer UNE SEULE FOIS après avoir créé les tables avec schema.sql.
// Commande : node src/seed.js
//
// Ce script crée :
//   - 3 utilisateurs : ibrahim (admin), grace (manager), lyly (manager)
//   - 5 étangs      : A1, A2, B1, B2, Barrage
//   - 8 opérations poissons (le trigger met à jour current_fish_count automatiquement)
//   - 10 relevés de qualité de l'eau
//   - 10 tâches (8 pending, 2 completed)
//
// Mot de passe pour tous les utilisateurs : projet_ecole_stage
// Les mots de passe sont hashés avec bcrypt avant d'être stockés en base.

const pool = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seed = async () => {
    try {
        console.log('Début du seed...');

        // ───────────────────────────────────────────
        // USERS
        // ───────────────────────────────────────────
        const passwordHash = await bcrypt.hash('projet_ecole_stage', 10);

        await pool.query(`
            INSERT INTO users (username, password_hash, role) VALUES
            ('ibrahim',  '${passwordHash}', 'admin'),
            ('grace',    '${passwordHash}', 'manager'),
            ('lyly',     '${passwordHash}', 'manager')
            ON CONFLICT (username) DO NOTHING
        `);
        console.log('✓ Utilisateurs créés');

        // ───────────────────────────────────────────
        // PONDS (étangs)
        // ───────────────────────────────────────────
        await pool.query(`
            INSERT INTO ponds (name, pond_group, area_m2, max_capacity, current_fish_count) VALUES
            ('Étang A1', 'A', 500.00,  2000, 0),
            ('Étang A2', 'A', 450.00,  1800, 0),
            ('Étang B1', 'B', 600.00,  2500, 0),
            ('Étang B2', 'B', 550.00,  2200, 0),
            ('Barrage',  'Barrage', 1200.00, 5000, 0)
            ON CONFLICT DO NOTHING
        `);
        console.log('✓ Étangs créés');

        // Récupérer les IDs
        const users = (await pool.query('SELECT id, username FROM users')).rows;
        const ponds = (await pool.query('SELECT id, name FROM ponds')).rows;

        const ibrahim = users.find(u => u.username === 'ibrahim').id;
        const grace   = users.find(u => u.username === 'grace').id;
        const lyly    = users.find(u => u.username === 'lyly').id;

        const etangA1 = ponds.find(p => p.name === 'Étang A1').id;
        const etangA2 = ponds.find(p => p.name === 'Étang A2').id;
        const etangB1 = ponds.find(p => p.name === 'Étang B1').id;
        const etangB2 = ponds.find(p => p.name === 'Étang B2').id;

        // ───────────────────────────────────────────
        // FISH OPERATIONS
        // Le trigger met à jour current_fish_count automatiquement
        // ───────────────────────────────────────────
        await pool.query(`
            INSERT INTO fish_operations (pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes) VALUES
            ($1, $5, 'addition',  '2026-05-01', 800, 95.0,  NULL, 'Ajout initial de tilapias'),
            ($2, $5, 'addition',  '2026-05-01', 600, 90.0,  NULL, 'Ajout initial de tilapias'),
            ($3, $6, 'addition',  '2026-05-03', 700, 100.0, NULL, 'Ajout de carpes'),
            ($1, $6, 'control',   '2026-05-10', 800, 110.5, NULL, 'Contrôle mensuel — croissance normale'),
            ($2, $7, 'mortality', '2026-05-12', 15,  NULL,  NULL, 'Mortalité due à la chaleur'),
            ($3, $7, 'control',   '2026-05-15', 700, 115.0, NULL, 'Contrôle — bonne croissance'),
            ($1, $5, 'transfer',  '2026-05-18', 100, 120.0, $4,   'Transfert vers B2 pour densifier'),
            ($4, $6, 'addition',  '2026-05-20', 300, 85.0,  NULL, 'Nouveau lot de tilapias')
        `, [etangA1, etangA2, etangB1, etangB2, ibrahim, grace, lyly]);
        console.log('✓ Opérations poissons créées');

        // ───────────────────────────────────────────
        // WATER QUALITY
        // ───────────────────────────────────────────
        await pool.query(`
            INSERT INTO water_quality (pond_id, user_id, measurement_date, oxygen_level_mg_l, temperature_c, water_color) VALUES
            ($1, $5, '2026-05-05', 7.2, 25.5, 'verte claire'),
            ($2, $5, '2026-05-05', 6.8, 26.0, 'verte'),
            ($3, $6, '2026-05-05', 7.5, 24.8, 'transparente'),
            ($1, $7, '2026-05-12', 6.5, 27.0, 'verte foncée'),
            ($2, $7, '2026-05-12', 5.9, 28.5, 'marron claire'),
            ($3, $5, '2026-05-12', 7.1, 25.0, 'verte claire'),
            ($1, $6, '2026-05-19', 7.4, 26.5, 'verte claire'),
            ($2, $6, '2026-05-19', 6.2, 27.5, 'verte'),
            ($3, $7, '2026-05-19', 7.8, 24.5, 'transparente'),
            ($4, $5, '2026-05-21', 7.0, 26.0, 'verte claire')
        `, [etangA1, etangA2, etangB1, etangB2, ibrahim, grace, lyly]);
        console.log('✓ Relevés qualité de l\'eau créés');

        // ───────────────────────────────────────────
        // TASKS
        // $1=lyly $2=grace $3=etangA1 $4=etangA2 $5=etangB1 $6=etangB2
        // ───────────────────────────────────────────
        await pool.query(`
            INSERT INTO tasks (user_id, pond_id, title, description, priority, task_date, status) VALUES
            ($1, $3, 'Nourrir les poissons A1',      'Donner 3kg de granulés matin et soir',         'haute',   '2026-05-23', 'pending'),
            ($1, $4, 'Nourrir les poissons A2',      'Donner 2.5kg de granulés',                     'haute',   '2026-05-23', 'pending'),
            ($2, $5, 'Mesure qualité eau B1',        'Oxygène, température et couleur',              'haute',   '2026-05-23', 'pending'),
            ($1, $3, 'Contrôle croissance A1',       'Peser 20 poissons aléatoirement',              'moyenne', '2026-05-24', 'pending'),
            ($2, $4, 'Traitement eau A2',            'Ajouter chaux si pH trop bas',                 'moyenne', '2026-05-24', 'pending'),
            ($1, $5, 'Nourrir les poissons B1',      'Donner 4kg de granulés',                       'haute',   '2026-05-24', 'pending'),
            ($2, $6, 'Contrôle filet B2',            'Vérifier l''intégrité du filet de protection', 'basse',   '2026-05-25', 'pending'),
            ($1, NULL,'Réunion équipe hebdomadaire', 'Bilan de la semaine avec Ibrahim et Grace',    'moyenne', '2026-05-26', 'pending'),
            ($1, $3, 'Nourrir les poissons A1',      'Donner 3kg de granulés matin et soir',         'haute',   '2026-05-20', 'completed'),
            ($2, $4, 'Mesure qualité eau A2',        'Relevé hebdomadaire effectué',                 'haute',   '2026-05-19', 'completed')
        `, [lyly, grace, etangA1, etangA2, etangB1, etangB2]);
        console.log('✓ Tâches créées');

        console.log('\nSeed terminé avec succès !');
        console.log('Identifiants de connexion :');
        console.log('  username: ibrahim | password: projet_ecole_stage');
        console.log('  username: grace   | password: projet_ecole_stage');
        console.log('  username: lyly    | password: projet_ecole_stage');

        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du seed :', error.message);
        process.exit(1);
    }
};

seed();
