const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { analizarFacturaConDeepSeek } = require('../services/deepseek');

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Cambiar a multer.any() para aceptar cualquier campo de archivo
const uploadAny = multer({ storage }).any();

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
router.post('/', uploadAny, async (req, res) => {
  try {
    console.log('Archivos recibidos:', req.files);
    // Buscar el archivo en los posibles campos
    let archivo = null;
    if (req.files && req.files.length > 0) {
      archivo = req.files.find(f => f.fieldname === 'pdf') || req.files.find(f => f.fieldname === 'file') || req.files[0];
    }
    if (!archivo) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    req.file = archivo; // Para compatibilidad con el resto del código
    await procesarFactura(req, res);
  } catch (error) {
    console.error('Error en subida de factura:', error);
    res.status(500).json({ error: 'Error al subir la factura', details: error.message });
  }
});

// Lógica de procesamiento de factura extraída a función aparte
async function procesarFactura(req, res) {
  console.log('Archivo a procesar:', req.file);
  const textoFactura = await extraerTextoPDF(req.file.path);
  console.log('Texto extraído del PDF:', textoFactura);

  let analysis = null;
  let analysisError = null;
  let validationInfo = null;

  try {
    console.log('Antes de llamar a DeepSeek');
    const resultado = await analizarFacturaConDeepSeek(textoFactura);
    console.log('Después de llamar a DeepSeek:', resultado);

    // Si el resultado es un string, intentar parsearlo como JSON
    if (typeof resultado === 'string') {
      try {
        analysis = JSON.parse(resultado);
      } catch (e) {
        analysis = resultado;
      }
    } else {
      analysis = resultado;
    }

    // Si el análisis incluye información de validación
    if (analysis && typeof analysis === 'object' && 'productos' in analysis) {
      validationInfo = {
        sumaTotal: analysis.sumaTotal,
        importeReal: analysis.importeReal,
        diferencia: analysis.diferencia,
        tieneDiscrepancia: analysis.diferencia > 0.01
      };
      // Usar solo los productos para el análisis
      analysis = analysis.productos;
    }

  } catch (err) {
    analysisError = err.message || 'Error desconocido en análisis';
    console.error('Error al analizar factura:', err);
  }

  // Palabras clave para ignorar productos no válidos
  const palabrasIgnorar = [
    '%', 'iva', 'total', 'subtotal', 'cuota', 'base', 'tarjeta', 'bancaria',
    'importe', 'pago', 'cambio', 'descuento', 'recargo', 'redondeo', 'promoción',
    'devolución', 'saldo', 'aportación', 'donación', 'recibido', 'vuelto',
    'entregado', 'cliente', 'número', 'nro', 'n°'
  ];
  // Calcular el monto total sumando solo productos válidos
  let montoTotal = 0;
  if (Array.isArray(analysis)) {
    montoTotal = analysis.reduce((acc, prod) => {
      const nombre = (prod.nombre || prod.producto || prod.name || '').toLowerCase();
      const precio = parseFloat(prod.precio || prod.price) || 0;
      // Filtrar productos no válidos
      if (
        !nombre ||
        palabrasIgnorar.some(palabra => nombre.includes(palabra)) ||
        precio <= 0 ||
        precio > 500
      ) {
        return acc;
      }
      return acc + precio;
    }, 0);
  }
  // Tomar user_id y date del body, o usar valores por defecto
  const userId = req.body.user_id || 1; // Cambia esto según tu lógica de autenticación
  const fechaFactura = req.body.date ? new Date(req.body.date) : new Date();
  // Construir la URL del archivo
  const fileUrl = '/uploads/' + req.file.filename;
  // Insertar en la base de datos
  const result = await pool.query(
    `INSERT INTO invoices (
      user_id,
      file_url,
      date,
      amount,
      file_name,
      analysis,
      pdf_texto,
      analysis_error
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      userId,
      fileUrl,
      fechaFactura,
      montoTotal,
      req.file.filename,
      analysis ? JSON.stringify(analysis) : null,
      textoFactura,
      analysisError
    ]
  );

  res.json({
    success: true,
    message: 'Factura subida y analizada correctamente',
    data: result.rows[0],
    validation: validationInfo
  });
}

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

    // Primero obtener la información de la factura
    const factura = await pool.query('SELECT file_name FROM invoices WHERE id = $1', [id]);
    
    if (factura.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Borrar el archivo físico
    const filePath = path.join(__dirname, '../uploads', factura.rows[0].file_name);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.error('Error al borrar archivo físico:', err);
      // Continuamos aunque falle el borrado del archivo
    }

    // Borrar de la base de datos
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    // Obtener el nuevo total de facturas
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM invoices');
    const totalFacturas = parseInt(totalResult.rows[0].total);

    res.json({
      success: true,
      message: 'Factura borrada correctamente',
      totalFacturas
    });

  } catch (error) {
    console.error('Error al borrar factura:', error);
    res.status(500).json({ 
      error: 'Error al borrar la factura',
      details: error.message 
    });
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

// Función para extraer texto de un PDF
async function extraerTextoPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

module.exports = router;