const pool = require('../config/db');

const addOperation = async (req, res) => {
    const { pond_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes } = req.body;
    const user_id = req.user.id;

    if (!pond_id || !operation_type || !operation_date || !fish_count) {
        return res.status(400).json({ error: 'Les champs pond_id, operation_type, operation_date et fish_count sont obligatoires' });
    }
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
        console.error('Erreur addOperation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getOperations = async (req, res) => {
    const { pond_id } = req.query;
    try {
        let query, params;
        if (pond_id) {
            query = `
                SELECT fo.*,
                    p.name  AS pond_name,
                    tp.name AS target_pond_name
                FROM fish_operations fo
                LEFT JOIN ponds p  ON p.id  = fo.pond_id
                LEFT JOIN ponds tp ON tp.id = fo.target_pond_id
                WHERE fo.pond_id = $1
                ORDER BY fo.operation_date DESC, fo.id DESC`;
            params = [pond_id];
        } else {
            query = `
                SELECT fo.*,
                    p.name  AS pond_name,
                    tp.name AS target_pond_name
                FROM fish_operations fo
                LEFT JOIN ponds p  ON p.id  = fo.pond_id
                LEFT JOIN ponds tp ON tp.id = fo.target_pond_id
                ORDER BY fo.operation_date DESC, fo.id DESC
                LIMIT 500`;
            params = [];
        }
        const result = await pool.query(query, params);
        res.json({ operations: result.rows });
    } catch (error) {
        console.error('Erreur getOperations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { addOperation, getOperations };
