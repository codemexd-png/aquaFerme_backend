const pool = require('../config/db');

// Crée une nouvelle opération sur les poissons dans un étang.
// Le trigger SQL met à jour automatiquement current_fish_count dans ponds après l'INSERT.
const addOperation = async (req, res) => {
    const { pond_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes } = req.body;
    const user_id = req.user.id;

    // Validation des champs obligatoires
    if (!pond_id || !operation_type || !operation_date || !fish_count) {
        return res.status(400).json({ error: 'Les champs pond_id, operation_type, operation_date et fish_count sont obligatoires' });
    }

    // Validation : target_pond_id est obligatoire si operation_type est 'transfer'
    if (operation_type === 'transfer' && !target_pond_id) {
        return res.status(400).json({ error: 'target_pond_id est obligatoire pour un transfert' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO fish_operations (pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g || null, target_pond_id || null, notes || null]
        );

        res.status(201).json({ operation: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de la création de l\'opération :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Retourne l'historique des opérations d'un étang.
// Le paramètre pond_id est obligatoire (passé en query string : ?pond_id=1).
const getOperations = async (req, res) => {
    const { pond_id } = req.query;

    if (!pond_id) {
        return res.status(400).json({ error: 'Le paramètre pond_id est obligatoire' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM fish_operations WHERE pond_id = $1 ORDER BY operation_date DESC`,
            [pond_id]
        );

        res.json({ operations: result.rows });
    } catch (error) {
        console.error('Erreur lors de la récupération des opérations :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { addOperation, getOperations };
