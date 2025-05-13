const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Obtener todas las facturas de un usuario
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear una nueva factura
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { user_id, date, amount, description } = req.body;
    const file = req.file;
    
    // Validaciones
    if (!user_id) {
      return res.status(400).json({ 
        message: 'El ID de usuario es requerido',
        error: 'Falta el ID de usuario'
      });
    }
    
    if (!file) {
      return res.status(400).json({ 
        message: 'No se ha proporcionado ningún archivo',
        error: 'Falta el archivo'
      });
    }
    
    // Validar el tipo de archivo (opcional)
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        message: `Tipo de archivo no válido: ${file.mimetype}. Solo se permiten archivos PDF.`,
        error: 'formato_invalido'
      });
    }
    
    // Validar el tamaño del archivo (máximo 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ 
        message: `El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo permitido es 10MB.`,
        error: 'tamaño_excedido'
      });
    }
    
    console.log(`Procesando archivo: ${file.originalname}, tipo: ${file.mimetype}, tamaño: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Crear la URL del archivo guardado
    const filePath = `/uploads/${file.filename}`;
    
    const result = await pool.query(
      'INSERT INTO invoices (user_id, date, amount, description, file_name, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, date, amount, description, file.originalname, filePath]
    );
    
    console.log('Factura creada exitosamente con ID:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear factura:', err);
    res.status(500).json({ 
      message: 'Error del servidor al procesar la factura', 
      error: err.message 
    });
  }
});

// Actualizar una factura
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    const result = await pool.query(
      'UPDATE invoices SET amount = $1, description = $2 WHERE id = $3 RETURNING *',
      [amount, description, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Factura no encontrada' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar una factura
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Factura no encontrada' });
    } else {
      res.json({ message: 'Factura eliminada exitosamente' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Mantener endpoint de compatibilidad para aplicaciones que aún usan la ruta /upload-blob
router.post('/upload-blob', upload.single('file'), async (req, res) => {
  try {
    const { user_id, date, amount, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
    }
    
    // Validar que user_id esté presente
    if (!user_id) {
      return res.status(400).json({ message: 'El ID de usuario es requerido' });
    }
    
    // Crear la URL del archivo guardado
    const filePath = `/uploads/${file.filename}`;
    
    console.log(`Procesando archivo: ${file.originalname}, tamaño: ${file.size} bytes`);
    
    try {
      const result = await pool.query(
        'INSERT INTO invoices (user_id, date, amount, description, file_name, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user_id, date, amount, description, file.originalname, filePath]
      );
      
      console.log('Factura creada exitosamente con ID:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (dbError) {
      console.error('Error en la operación de base de datos:', dbError);
      return res.status(500).json({ message: 'Error al guardar el archivo en la base de datos', error: dbError.message });
    }
  } catch (err) {
    console.error('Error al subir archivo:', err);
    res.status(500).json({ message: 'Error del servidor al procesar el archivo', error: err.message });
  }
});

// Obtener una factura por ID
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT file_url, file_name FROM invoices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    const { file_url, file_name } = result.rows[0];
    
    if (!file_url) {
      return res.status(404).json({ message: 'El archivo no existe' });
    }
    
    // Extraer el nombre del archivo de la URL
    const filename = file_url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Enviar el archivo como respuesta
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error al obtener archivo:', err);
    res.status(500).json({ message: 'Error del servidor al recuperar el archivo' });
  }
});

// Endpoint para obtener un archivo directamente por nombre de archivo
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

module.exports = router;