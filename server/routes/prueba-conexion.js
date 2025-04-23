const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/health', async (req, res) => {
  try {
    // Intentar ejecutar una consulta simple para verificar la conexión
    const result = await pool.query('SELECT 1');
    res.json({ 
      status: 'success', 
      message: 'Conexión a la base de datos establecida correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al verificar la conexión:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
});

module.exports = router;