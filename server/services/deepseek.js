const axios = require('axios');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
console.log('DEEPSEEK_API_KEY usada:', DEEPSEEK_API_KEY);
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Función para extraer productos de texto de factura de forma local
function extraerProductosLocal(textoFactura) {
  console.log('Usando extracción local de productos');
  const productos = [];
  const lineas = textoFactura.split('\n');
  
  // Palabras clave para ignorar líneas
  const palabrasIgnorar = [
    'total', 'iva', 'i.v.a', 'i v a', 'pago', 'tarjeta', 'efectivo', 'cambio', 'importe',
    'subtotal', 'descuento', 'recargo', 'bancaria', 'cajero', 'caja',
    'cuota', 'base imponible', 'imponible'
  ];

  // Extraer el importe total de la factura (buscar después de "TOTAL (€)")
  let importeTotal = null;
  for (let linea of lineas) {
    if (linea.includes('TOTAL (€)')) {
      const match = linea.match(/(\d+[.,]\d{2})/);
      if (match) {
        importeTotal = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }
  }

  let sumaProductos = 0;
  let productosProcesados = new Set(); // Para evitar duplicados

  // Buscar bloque de productos entre cabecera y TOTAL
  let bloqueProductos = '';
  let dentroDeTabla = false;
  for (let linea of lineas) {
    if (!dentroDeTabla && linea.toLowerCase().includes('descrip')) {
      dentroDeTabla = true;
      continue;
    }
    if (dentroDeTabla) {
      if (/total/i.test(linea)) break;
      if (linea.trim() === '' || palabrasIgnorar.some(p => linea.toLowerCase().includes(p))) continue;
      bloqueProductos += linea + '\n';
    }
  }

  // --- NUEVO: Preprocesar productos con peso en líneas separadas ---
  // Unir líneas tipo: NOMBRE\nPESO y PRECIO
  let lineasBloque = bloqueProductos.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let lineasUnidas = [];
  for (let i = 0; i < lineasBloque.length; i++) {
    // Si la línea siguiente es del tipo "X,XXX kgY,YY €/kgZ,ZZ", unirla a la actual
    if (i + 1 < lineasBloque.length && /\d+[.,]\d+\s*kg.*€/i.test(lineasBloque[i + 1])) {
      lineasUnidas.push(lineasBloque[i] + ' ' + lineasBloque[i + 1]);
      i++; // Saltar la siguiente
    } else {
      lineasUnidas.push(lineasBloque[i]);
    }
  }
  bloqueProductos = lineasUnidas.join(' ');

  // 1. Procesar productos con peso (kg) primero
  const productosUnicos = new Set();
  const regexPeso = /(\d+)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 %.,/-]+?)\s*(\d+[.,]\d{3})\s*kg\s*(\d+[.,]\d{2})\s*€\/kg\s*(\d+[.,]\d{2})/g;
  let match;
  while ((match = regexPeso.exec(bloqueProductos)) !== null) {
    let cantidad = parseInt(match[1]);
    let nombre = match[2].trim();
    let peso = parseFloat(match[3].replace(',', '.'));
    let precioPorKg = parseFloat(match[4].replace(',', '.'));
    let precioTotal = parseFloat(match[5].replace(',', '.'));
    // Limpieza robusta del nombre
    nombre = nombre.replace(/^[,\s]+/, '');
    nombre = nombre.replace(/\d+[.,]\d{2}$/, '').replace(/^\d+\s*/, '').trim();
    nombre = nombre.replace(/^[,\s]+/, '');
    if (nombre.length > 40) continue;
    if (!nombre || nombre.length < 2) continue;
    const clave = `${nombre.toLowerCase().replace(/\s+/g, '')}-${precioTotal.toFixed(2)}`;
    if (productosUnicos.has(clave)) continue;
    productosUnicos.add(clave);
    if (precioTotal > 0 && precioTotal < 500) {
      const categoria = categorizarProducto(nombre);
      productos.push({ 
        producto: nombre, 
        categoria, 
        cantidad, 
        precio_unitario: precioPorKg,
        precio: precioTotal,
        peso: peso
      });
      sumaProductos += precioTotal;
    }
  }

  // 2. Productos con cantidad, nombre y dos precios (unitario y total)
  const regexDoblePrecio = /(\d+)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 %.,/-]+?)\s*(\d{1,4}[.,]\d{2})\s*(\d{1,4}[.,]\d{2})/g;
  while ((match = regexDoblePrecio.exec(bloqueProductos)) !== null) {
    let cantidad = parseInt(match[1]);
    let nombre = match[2].trim();
    let precio_unitario = parseFloat(match[3].replace(',', '.'));
    let precio = parseFloat(match[4].replace(',', '.'));
    // Limpieza robusta del nombre
    nombre = nombre.replace(/^[,\s]+/, '');
    nombre = nombre.replace(/\d+[.,]\d{2}$/, '').replace(/^\d+\s*/, '').trim();
    nombre = nombre.replace(/^[,\s]+/, '');
    if (nombre.length > 40) continue;
    if (!nombre || nombre.length < 2) continue;
    if (nombre.toLowerCase().includes('kg') || nombre.toLowerCase().includes('€/kg')) continue;
    const clave = `${nombre.toLowerCase().replace(/\s+/g, '')}-${precio.toFixed(2)}`;
    if (productosUnicos.has(clave)) continue;
    productosUnicos.add(clave);
    if (precio > 0 && precio < 500) {
      const categoria = categorizarProducto(nombre);
      productos.push({ producto: nombre, categoria, cantidad, precio_unitario, precio });
      sumaProductos += precio;
    }
  }

  // 3. Productos con cantidad, nombre y un solo precio (la mayoría)
  const regexSimple = /(\d+)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 %.,/-]+?)(\d{1,4}[.,]\d{2})/g;
  while ((match = regexSimple.exec(bloqueProductos)) !== null) {
    let cantidad = parseInt(match[1]);
    let nombre = match[2].trim();
    let precio = parseFloat(match[3].replace(',', '.'));
    // Limpieza robusta del nombre
    nombre = nombre.replace(/^[,\s]+/, '');
    nombre = nombre.replace(/\d+[.,]\d{2}$/, '').replace(/^\d+\s*/, '').trim();
    nombre = nombre.replace(/^[,\s]+/, '');
    if (nombre.length > 40) continue;
    if (!nombre || nombre.length < 2) continue;
    if (nombre.toLowerCase().includes('kg') || nombre.toLowerCase().includes('€/kg')) continue;
    const clave = `${nombre.toLowerCase().replace(/\s+/g, '')}-${(precio * cantidad).toFixed(2)}`;
    if (productosUnicos.has(clave)) continue;
    productosUnicos.add(clave);
    if (precio > 0 && precio < 500) {
      const categoria = categorizarProducto(nombre);
      productos.push({ producto: nombre, categoria, cantidad, precio_unitario: precio, precio: precio * cantidad });
      sumaProductos += precio * cantidad;
    }
  }

  // Al final, recalcula sumaProductos sumando todos los productos
  sumaProductos = productos.reduce((acc, p) => acc + (parseFloat(p.precio) || 0), 0);

  // Si hay diferencia, añade el ajuste
  if (importeTotal && Math.abs(sumaProductos - importeTotal) > 0.01) {
    const diferencia = +(importeTotal - sumaProductos).toFixed(2);
    productos.push({
      producto: "Ajuste (productos no identificados)",
      categoria: "Otros",
      cantidad: 1,
      precio_unitario: diferencia,
      precio: diferencia
    });
    sumaProductos += diferencia;
  }

  // Redondear sumaProductos
  sumaProductos = +(sumaProductos).toFixed(2);

  return {
    productos: productos,
    sumaTotal: sumaProductos,
    importeReal: importeTotal,
    diferencia: importeTotal ? +(sumaProductos - importeTotal).toFixed(2) : null
  };
}

// Función para categorizar productos por palabras clave
function categorizarProducto(nombre) {
  const n = nombre.toLowerCase();
  if (/manzana|banana|plátano|pera|naranja|limón|fruta|verdura|tomate|lechuga|zanahoria|patata|cebolla/.test(n)) return "Frutas y Verduras";
  if (/pollo|ternera|cerdo|cordero|carne|chuleta|bistec|solomillo|costilla|lomo|filete|hamburguesa/.test(n)) return "Carnes";
  if (/pescado|merluza|salmón|atun|atún|bacalao|sardina|anchoa|trucha|marisco|gamba|langostino|calamar|pulpo/.test(n)) return "Pescados y Mariscos";
  if (/leche|queso|yogur|mantequilla|nata|huevo/.test(n)) return "Lácteos y Huevos";
  if (/pan|boll[eo]|galleta|bizcocho|pastel|tarta|croissant/.test(n)) return "Panadería y Repostería";
  if (/arroz|pasta|macarron|espagueti|fideo|cuscus|lenteja|garbanzo|judia|alubia/.test(n)) return "Cereales y Legumbres";
  if (/azucar|sal|aceite|vinagre|especia|salsa|mayonesa|ketchup|mostaza/.test(n)) return "Condimentos y Salsas";
  if (/suavizante|detergente|limpiador|lejía|lavavajillas|jabón|desinfectante|multiusos|limpieza/.test(n)) return "Higiene";
  if (/papel higienico|servilleta|pañuelo|bastoncillo|algodón/.test(n)) return "Higiene";
  if (/champú|gel|desodorante|crema|loción|maquillaje|afeitar|cuchilla|cepillo|pasta dental|dental|higiene/.test(n)) return "Higiene";
  if (/gato|perro|mascota|pienso|arena de gatos/.test(n)) return "Mascotas";
  if (/cafe|té|infusion|cacao|chocolate/.test(n)) return "Bebidas";
  if (/mueble|silla|mesa|sofá|cama|colchón|almohada|hogar|cocina|baño/.test(n)) return "Hogar";
  if (/electrodomestico|microondas|nevera|frigorifico|lavadora|secadora|horno|tostadora|batidora|licuadora|plancha/.test(n)) return "Electrónica";
  if (/camisa|pantalón|falda|vestido|ropa|zapato|zapatilla|bota|calcetín|abrigo|chaqueta|jersey|sudadera|ropa interior/.test(n)) return "Ropa";
  if (/transporte|gasolina|diesel|combustible|billete|bus|metro|tren|taxi|uber/.test(n)) return "Transporte";
  if (/cine|teatro|concierto|espectáculo|ocio|entrada|evento/.test(n)) return "Ocio";
  if (/medicamento|paracetamol|ibuprofeno|aspirina|farmacia|salud|vitamina|suplemento/.test(n)) return "Salud";
  if (/libro|cuaderno|bolígrafo|lápiz|goma|mochila|educación|estudio|clase|escuela|universidad/.test(n)) return "Educación";
  return "Otros";
}

async function analizarFacturaConDeepSeek(textoFactura) {
  console.log('Texto extraído del PDF:', textoFactura);

  // 1. Intentar primero el parser local
  const resultadoLocal = extraerProductosLocal(textoFactura);
  if (
    resultadoLocal.importeReal && resultadoLocal.sumaTotal &&
    Math.abs(resultadoLocal.importeReal - resultadoLocal.sumaTotal) <= 0.01
  ) {
    // Si la suma coincide, usar el resultado local
    return JSON.stringify(resultadoLocal.productos);
  }

  // 2. Si la suma NO coincide, intentar DeepSeek
  const prompt = `
Eres un asistente experto en extraer productos de tickets de supermercado, especialmente de Mercadona España.
Analiza el siguiente texto extraído de un ticket PDF.
ATENCIÓN: Los productos pueden estar pegados, sin saltos de línea, en el texto. Cada producto sigue el patrón: cantidad (número al inicio), nombre del producto (puede contener números y letras), y precio decimal (por ejemplo, 1,10 o 2.30) al final de cada producto.
Separa y extrae cada producto aunque estén pegados, detectando el inicio de cada producto por la cantidad (número al inicio de cada bloque de producto).
EXCLUYE cualquier línea que contenga palabras como: TOTAL, SUBTOTAL, IVA, PAGO, CAMBIO, TARJETA, EFECTIVO, DEVOLUCIÓN, REDONDEO, PROMOCIÓN, DESCUENTO, SALDO, APORTACIÓN, DONACIÓN, RECIBIDO, VUELTO, ENTREGADO, CLIENTE, NÚMERO, NRO, N°.
EXTRA solo productos comprados, con:
- "producto": nombre del producto (incluye cualquier número entero suelto que forme parte del nombre, por ejemplo, 'MÁQUINA PRECISION 5' debe ser el nombre completo, no 'MÁQUINA PRECISION')
- "categoria": una de: Alimentación, Frutas y Verduras, Higiene, Hogar, Electrónica, Ropa, Transporte, Ocio, Salud, Educación, Otros
- "precio": el precio en euros (número decimal, sin símbolo €)
No separes los números enteros del nombre del producto si están antes del precio decimal.
Devuelve SOLO un array JSON como este ejemplo:
[
  { "producto": "Manzanas", "categoria": "Frutas y Verduras", "precio": 2.50 },
  { "producto": "Champú", "categoria": "Higiene", "precio": 3.00 }
]
No incluyas totales, subtotales, IVA, ni líneas de pago. Si tienes dudas, prioriza la coherencia y sentido común.
Texto del ticket:
${textoFactura}
`;
  try {
    // Intentar verificar la conexión a internet con una petición simple
    await axios.get('https://www.google.com', { timeout: 5000 });
    // Si hay conexión, intentar usar DeepSeek
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Eres un experto en facturas de supermercado." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );
      // Obtener el análisis de DeepSeek
      const analysis = response.data.choices[0].message.content;
      console.log('Análisis recibido de DeepSeek:', analysis);
      // Limpiar y parsear el JSON
      let cleanAnalysis = analysis
        .replace(/```json|```/g, '').trim();
      let jsonData = JSON.parse(cleanAnalysis);
      return JSON.stringify(jsonData);
    } catch (deepseekError) {
      console.error('Error al conectar con DeepSeek, devolviendo resultado local:', deepseekError.message);
      return JSON.stringify(resultadoLocal.productos);
    }
  } catch (connectionError) {
    console.error('Error de conexión a internet, devolviendo resultado local:', connectionError.message);
    return JSON.stringify(resultadoLocal.productos);
  }
}

module.exports = { analizarFacturaConDeepSeek };

