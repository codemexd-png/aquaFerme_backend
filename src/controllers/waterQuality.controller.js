const pool = require('../config/db');

// Enregistre un nouveau relevé de qualité d'eau pour un étang.
const addMeasurement = async (req, res) => {
    const { pond_id, measurement_date, oxygen_level_mg_l, temperature_c, water_color } = req.body;
    const user_id = req.user.id;

    // Validation des champs obligatoires
    if (!pond_id || !measurement_date) {
        return res.status(400).json({ error: 'Les champs pond_id et measurement_date sont obligatoires' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO water_quality (pond_id, user_id, measurement_date, oxygen_level_mg_l, temperature_c, water_color)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [pond_id, user_id, measurement_date, oxygen_level_mg_l || null, temperature_c || null, water_color || null]
        );

        res.status(201).json({ measurement: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du relevé :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Retourne l'historique des relevés de qualité d'eau d'un étang.
// Le paramètre pond_id est obligatoire (passé en query string : ?pond_id=1).
const getMeasurements = async (req, res) => {
    const { pond_id } = req.query;

    if (!pond_id) {
        return res.status(400).json({ error: 'Le paramètre pond_id est obligatoire' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM water_quality WHERE pond_id = $1 ORDER BY measurement_date DESC`,
            [pond_id]
        );

        res.json({ measurements: result.rows });
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { addMeasurement, getMeasurements };
