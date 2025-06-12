const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Endpoint para servir el JSON de productos
router.get('/mercadona-products', (req, res) => {
  // Usar ruta absoluta para evitar problemas de ejecución
  const filePath = path.resolve(process.cwd(), 'data', 'mercadona_products.json');
  console.log('Intentando leer:', filePath); // Log para depuración
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo el archivo:', err);
      return res.status(500).json({ error: 'No se pudo leer el archivo' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Error al parsear el JSON' });
    }
  });
});

module.exports = router; 