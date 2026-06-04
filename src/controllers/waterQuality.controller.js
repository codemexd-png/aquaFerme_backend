const pool = require('../config/db');

const addMeasurement = async (req, res) => {
    const { pond_id, measurement_date, oxygen_level_mg_l, temperature_c, water_color } = req.body;
    const user_id = req.user.id;

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
        console.error('Erreur addMeasurement:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getMeasurements = async (req, res) => {
    const { pond_id } = req.query;
    try {
        let query, params;
        if (pond_id) {
            query = `SELECT wq.*, p.name AS pond_name
                     FROM water_quality wq
                     LEFT JOIN ponds p ON p.id = wq.pond_id
                     WHERE wq.pond_id = $1
                     ORDER BY wq.measurement_date DESC, wq.id DESC`;
            params = [pond_id];
        } else {
            query = `SELECT wq.*, p.name AS pond_name
                     FROM water_quality wq
                     LEFT JOIN ponds p ON p.id = wq.pond_id
                     ORDER BY wq.measurement_date DESC, wq.id DESC
                     LIMIT 500`;
            params = [];
        }
        const result = await pool.query(query, params);
        res.json({ measurements: result.rows });
    } catch (error) {
        console.error('Erreur getMeasurements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { addMeasurement, getMeasurements };