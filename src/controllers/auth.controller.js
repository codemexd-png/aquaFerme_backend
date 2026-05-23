
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Ce fichier contient les fonctions qui gèrent la logique d'authentification, comme le login et la récupération des infos utilisateur.

// Cette fonction vérifie les identifiants de l'utilisateur, et s'ils sont corrects, elle génère un token JWT et le renvoie au frontend.
const login = async (req, res) => {

    // On récupère le nom d'utilisateur et le mot de passe depuis le corps de la requête
    const { username, password } = req.body;

    try {
        // On cherche l'utilisateur dans la base de données par son nom d'utilisateur
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        // On vérifie si l'utilisateur existe et si le mot de passe est correct
        if (user && await bcrypt.compare(password, user.password_hash)) {
            // On génère un token JWT
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Identifiants invalides' });
        }
    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Cette fonction récupère les informations de l'utilisateur connecté à partir du token JWT et les renvoie au frontend.
const userInfo = async (req, res) => {

    try {
        // On récupère l'ID de l'utilisateur à partir du token JWT (stocké dans req.user par le middleware verifyToken)
        const userId = req.user.id;

        // On cherche l'utilisateur dans la base de données par son ID
        const result = await pool.query('SELECT id, username ,role  FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];// On renvoie les informations de l'utilisateur au frontend
        
        // Si l'utilisateur existe, on renvoie ses infos, sinon on renvoie une erreur 404
        if (user)
        {
            res.json({ user });
        } else {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { login, userInfo };