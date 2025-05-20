import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
// Comentamos temporalmente esta importación hasta tener el proveedor configurado
// import { PostgresProvider } from '../../../database/providers/PostgresProvider';
import UploadInvoice from './UploadInvoice';
import ViewInvoices from './ViewInvoices';
import { invoicesApi } from '../../services/api/invoices';

// Importaciones de Chakra UI
import { Box, Flex, Grid, GridItem, Text, Icon } from '@chakra-ui/react';

// Importaciones de componentes adaptados de Horizon UI
import { Card, MiniStatistics, LineChart, BarChart } from './HorizonAdapters';

// Iconos
import { ArrowUpIcon } from '@heroicons/react/20/solid';

// Comentamos temporalmente esta línea hasta tener el proveedor configurado
// const dbProvider = new PostgresProvider();
// Usaremos datos de ejemplo por ahora

function procesarAnalisisFacturas(facturas) {
  console.log("Facturas recibidas para análisis:", facturas);
  // Inicializar estructuras
  const gastosPorCategoria = {};
  const gastosPorMes = {};
  const gastosPorCategoriaYMes = {}; // Para análisis combinado
  let gastoTotal = 0;

  // Categorías principales para normalizar
  const categoriasNormalizadas = {
    'alimentacion': 'Alimentación',
    'alimentos': 'Alimentación',
    'comida': 'Alimentación',
    'bebida': 'Alimentación',
    'frutas': 'Frutas y Verduras',
    'verduras': 'Frutas y Verduras',
    'fruta': 'Frutas y Verduras',
    'verdura': 'Frutas y Verduras',
    'higiene': 'Higiene',
    'limpieza': 'Higiene',
    'aseo': 'Higiene',
    'hogar': 'Hogar',
    'casa': 'Hogar',
    'muebles': 'Hogar',
    'electronica': 'Electrónica',
    'electrónica': 'Electrónica',
    'tecnologia': 'Electrónica',
    'tecnología': 'Electrónica',
    'ropa': 'Ropa',
    'vestimenta': 'Ropa',
    'calzado': 'Ropa',
    'transporte': 'Transporte',
    'gasolina': 'Transporte',
    'combustible': 'Transporte',
    'ocio': 'Ocio',
    'entretenimiento': 'Ocio',
    'salud': 'Salud',
    'farmacia': 'Salud',
    'medicamentos': 'Salud',
    'educacion': 'Educación',
    'educación': 'Educación',
    'libros': 'Educación',
    'otros': 'Otros'
  };

  // Función para normalizar categorías
  const normalizarCategoria = (categoria) => {
    if (!categoria) return 'Otros';
    
    const categoriaLower = categoria.toLowerCase().trim();
    
    // Buscar coincidencias exactas o parciales
    for (const [clave, valor] of Object.entries(categoriasNormalizadas)) {
      if (categoriaLower === clave || categoriaLower.includes(clave)) {
        return valor;
      }
    }
    
    return 'Otros'; // Categorizar como 'Otros' si no hay coincidencia
  };

  // Verificar si hay facturas para procesar
  if (!facturas || facturas.length === 0) {
    console.log("No hay facturas para analizar");
    return { gastosPorCategoria, gastosPorMes, gastoTotal, gastosPorCategoriaYMes };
  }

  // Procesar cada factura
  facturas.forEach((factura, i) => {
    if (!factura.analysis) {
      console.log(`Factura ${i} sin análisis, saltando...`);
      return;
    }
    
    let productos = [];
    try {
      // Verificar si el análisis ya es un objeto (puede ocurrir si ya fue parseado)
      if (typeof factura.analysis === 'object' && factura.analysis !== null) {
        productos = Array.isArray(factura.analysis) ? factura.analysis : [factura.analysis];
        console.log(`Factura ${i} ya tiene análisis como objeto con ${productos.length} productos`);
      } else {
        // Limpiar el string JSON de la factura
        let clean = factura.analysis
          .replace(/```json|```/g, '')
          .trim();
        
        // Intentar parsear el JSON
        productos = JSON.parse(clean);
        console.log(`Factura ${i} procesada con ${productos.length} productos`);
      }
    } catch (e) {
      console.error(`Error al procesar factura ${i}:`, e);
      return; // Saltamos esta factura si hay error
    }

    // Verificar que productos sea un array
    if (!Array.isArray(productos)) {
      console.error(`Factura ${i}: el análisis no es un array válido`);
      return;
    }

    // Obtener fecha de la factura para análisis por mes
    let fechaFactura = new Date();
    if (factura.date) {
      try {
        fechaFactura = new Date(factura.date);
      } catch (e) {
        console.error(`Error al procesar fecha de factura ${i}:`, e);
      }
    }
    const mes = `${fechaFactura.getFullYear()}-${(fechaFactura.getMonth()+1).toString().padStart(2,'0')}`;

    // Procesar cada producto de la factura
    productos.forEach((prod) => {
      // Obtener precio unitario y cantidad
      const precioUnitario = parseFloat(prod.precio_unitario || prod.price || prod.precio || 0);
      const cantidad = parseFloat(prod.cantidad || 1);
      let precioTotal = 0;
      if (!isNaN(precioUnitario) && !isNaN(cantidad)) {
        precioTotal = precioUnitario * cantidad;
      } else {
        // Fallback: intentar con precio/price si no hay unitario
        const precioValue = parseFloat(prod.precio || prod.price || 0);
        precioTotal = isNaN(precioValue) ? 0 : precioValue;
      }
      if (precioTotal <= 0) return;
      // Obtener la categoría (puede estar como 'categoria' o 'category')
      const categoriaValue = prod.categoria || prod.category || 'Otros';
      // Normalizar la categoría
      const categoriaNormalizada = normalizarCategoria(categoriaValue);
      // Sumar por categoría normalizada
      gastosPorCategoria[categoriaNormalizada] = (gastosPorCategoria[categoriaNormalizada] || 0) + precioTotal;
      // Sumar al total
      gastoTotal += precioTotal;
      // Sumar por mes
      gastosPorMes[mes] = (gastosPorMes[mes] || 0) + precioTotal;
      // Análisis combinado por categoría y mes
      if (!gastosPorCategoriaYMes[mes]) {
        gastosPorCategoriaYMes[mes] = {};
      }
      gastosPorCategoriaYMes[mes][categoriaNormalizada] = 
        (gastosPorCategoriaYMes[mes][categoriaNormalizada] || 0) + precioTotal;
    });
  });

  console.log("Análisis completado:", {
    categorías: Object.keys(gastosPorCategoria).length,
    meses: Object.keys(gastosPorMes).length,
    gastoTotal
  });

  return { 
    gastosPorCategoria, 
    gastosPorMes, 
    gastoTotal,
    gastosPorCategoriaYMes
  };
}

const barChartOptionsBase = {
  chart: { toolbar: { show: false } },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: false },
  yaxis: {
    show: true,
    color: "black",
    labels: {
      show: true,
      style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" }
    }
  },
  grid: {
    borderColor: "rgba(163, 174, 208, 0.3)",
    show: true,
    yaxis: { lines: { show: true } },
    row: { opacity: 0.5 },
    column: { opacity: 0.5 },
    padding: { left: 0, right: 0, top: 15, bottom: 15 }
  },
  fill: {
    type: "gradient",
    gradient: {
      type: "vertical",
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.9,
      colorStops: [
        [
          { offset: 0, color: "#4318FF", opacity: 1 },
          { offset: 100, color: "rgba(67, 24, 255, 1)", opacity: 0.28 }
        ]
      ]
    }
  },
  plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } }
};

const lineChartOptionsBase = {
  chart: { toolbar: { show: false } },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth" },
  yaxis: {
    labels: {
      style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" }
    }
  },
  legend: { show: false },
  grid: { strokeDashArray: 5 },
  fill: {
    type: "gradient",
    gradient: {
      shade: "light",
      type: "vertical",
      shadeIntensity: 0.5,
      gradientToColors: undefined,
      inverseColors: true,
      opacityFrom: 0.8,
      opacityTo: 0,
      stops: []
    },
    colors: ["#4318FF", "#39B8FF"]
  },
  colors: ["#4318FF", "#39B8FF"]
};

const DashboardNew = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.id) return;
    // Cargamos los datos reales del usuario
    const fetchUserData = async () => {
      try {
        const invoices = await invoicesApi.getUserInvoices(user.id);
        
        // Calculamos el total de facturas subidas
        const totalUploads = invoices.length;
        
        // Actualizamos los datos del usuario
        setUserData({
          total_uploads: totalUploads,
          last_login: new Date().toISOString(),
          invoices: invoices
        });
        setError(null); // Limpiamos cualquier error previo
      } catch (error) {
        console.error('Error fetching user data:', error);
        // En caso de error, establecemos valores por defecto
        setUserData({
          total_uploads: 0,
          last_login: new Date().toISOString(),
          invoices: []
        });
        // Guardamos el mensaje de error para mostrarlo al usuario
        setError('No se pudieron cargar las facturas. Comprueba que el servidor esté funcionando en el puerto 3001.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const dashboardOptions = [
    {
      id: 'upload',
      title: 'Subir Facturas',
      description: `Sube tus facturas en PDF ${userData?.total_uploads ? `(Has subido ${userData.total_uploads} facturas)` : ''}`,
      icon: '📤',
      onClick: () => setShowUploadModal(true)
    },
    {
      id: 'view',
      title: 'Ver Facturas',
      description: 'Visualiza todas tus facturas subidas',
      icon: '📋',
      onClick: () => setShowViewModal(true)
    },
    {
      id: 'analyze',
      title: 'Mi Análisis',
      description: 'Revisa tus estadísticas personales',
      icon: '📊'
    },
    {
      id: 'settings',
      title: 'Mi Cuenta',
      description: 'Configura tus preferencias personales',
      icon: '⚙️'
    }
  ];

  // Procesar datos reales para las gráficas
  // Usamos un estado separado para los datos procesados para asegurar la actualización de las gráficas
  const [datosGraficas, setDatosGraficas] = useState({ gastosPorCategoria: {}, gastosPorMes: {}, gastoTotal: 0 });
  
  // Efecto para procesar los datos cuando userData cambia
  useEffect(() => {
    if (userData && userData.invoices) {
      console.log('Procesando facturas para gráficas:', userData.invoices.length, 'facturas');
      // Verificar si hay análisis en las facturas
      const facturasConAnalisis = userData.invoices.filter(f => f.analysis);
      console.log('Facturas con análisis:', facturasConAnalisis.length);
      
      const datosActualizados = procesarAnalisisFacturas(userData.invoices);
      setDatosGraficas(datosActualizados);
      console.log('Datos de gráficas actualizados:', datosActualizados);
    }
  }, [userData]);
  
  const { gastosPorCategoria, gastosPorMes, gastoTotal } = datosGraficas;

  // Preparar datos para la gráfica de barras (por categoría)
  const categorias = Object.keys(gastosPorCategoria).sort((a, b) => gastosPorCategoria[b] - gastosPorCategoria[a]);
  const datosCategorias = categorias.map(cat => parseFloat(gastosPorCategoria[cat].toFixed(2)));
  
  // Colores personalizados para categorías
  const coloresCategorias = {
    'Alimentación': '#4318FF',
    'Frutas y Verduras': '#05CD99',
    'Higiene': '#FFB547',
    'Hogar': '#EE5D50',
    'Electrónica': '#39B8FF',
    'Ropa': '#6AD2FF',
    'Transporte': '#E31A1A',
    'Ocio': '#01B574',
    'Salud': '#FF9AD5',
    'Educación': '#FFCE20',
    'Otros': '#A3AED0'
  };
  
  // Asignar colores a las categorías
  const coloresGrafica = categorias.map(cat => coloresCategorias[cat] || '#A3AED0');
  
  const barChartData = [
    {
      name: "Gastos por Categoría",
      data: Array.isArray(datosCategorias) ? datosCategorias : [],
    },
  ];
  
  const barChartOptions = {
    ...barChartOptionsBase,
    colors: coloresGrafica,
    xaxis: {
      categories: categorias.length > 0 ? categorias : ["Sin datos"],
      labels: {
        show: true,
        style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
        rotate: -45,
        rotateAlways: categorias.length > 5
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function(value) {
          return value.toFixed(2) + " €";
        }
      }
    },
    plotOptions: {
      ...barChartOptionsBase.plotOptions,
      bar: {
        ...barChartOptionsBase.plotOptions.bar,
        distributed: true,
        columnWidth: "60%"
      }
    }
  };

  // Preparar datos para la gráfica de líneas (por mes)
  const meses = Object.keys(gastosPorMes).sort();
  const datosMeses = meses.map(mes => parseFloat(gastosPorMes[mes].toFixed(2)));
  
  // Formatear nombres de meses para mejor visualización
  const nombresMeses = meses.map(mes => {
    const [año, numMes] = mes.split('-');
    const fecha = new Date(parseInt(año), parseInt(numMes) - 1, 1);
    return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  });
  
  const lineChartData = [
    {
      name: "Gastos Mensuales",
      data: Array.isArray(datosMeses) ? datosMeses : [],
    },
  ];
  
  const lineChartOptions = {
    ...lineChartOptionsBase,
    xaxis: {
      categories: nombresMeses.length > 0 ? nombresMeses : ["Sin datos"],
      labels: {
        style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
        rotate: -45,
        rotateAlways: meses.length > 4
      }
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function(value) {
          return value.toFixed(2) + " €";
        }
      },
      x: {
        show: true
      }
    },
    markers: {
      size: 5,
      colors: ["#4318FF"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    grid: {
      ...lineChartOptionsBase.grid,
      row: {
        colors: ["transparent", "transparent"],
        opacity: 0.5
      }
    }
  };

  // Función para borrar una factura y actualizar el dashboard
  const handleDeleteInvoice = async (invoiceId) => {
    try {
      // Llamar a la API para borrar la factura
      await invoicesApi.deleteInvoice(invoiceId);
      // Actualizar el estado local eliminando la factura borrada
      const nuevasFacturas = userData.invoices.filter(f => f.id !== invoiceId);
      setUserData({
        ...userData,
        total_uploads: nuevasFacturas.length,
        invoices: nuevasFacturas,
        last_update: new Date().toISOString()
      });
    } catch (error) {
      setError('Error al borrar la factura. Intenta de nuevo.');
      console.error('Error al borrar factura:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="mt-2 text-sm">Intenta recargar la página o verifica que el servidor esté en funcionamiento.</p>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user.email}
              </h1>
              <p className="mt-2 text-gray-600">
                {userData?.last_login && `Último acceso: ${new Date(userData.last_login).toLocaleDateString()}`}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <span className="text-2xl">{user.email[0].toUpperCase()}</span>
            </div>
          </div>

          {/* Mini Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
            <Box>
              <MiniStatistics
                startContent={
                  <Box
                    className="rounded-full p-3"
                    style={{ backgroundColor: 'rgba(67, 24, 255, 0.1)' }}
                  >
                    <Icon as={ArrowUpIcon} color="brand.500" w={6} h={6} />
                  </Box>
                }
                name="Facturas Subidas"
                value={userData?.total_uploads || "0"}
                growth="+23%"
              />
            </Box>
            <Box>
              <MiniStatistics
                name="Gasto Total"
                value={`${gastoTotal.toFixed(2)} €`}
                growth="0%"
              />
            </Box>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Box className="bg-white rounded-lg shadow-md p-4">
              <Text className="text-xl font-semibold mb-4">Evolución de Gastos Mensuales</Text>
              <Box h="300px" display="flex" alignItems="center" justifyContent="center">
                {datosMeses.length === 0 ? (
                  <Text color="gray.400" textAlign="center">No hay datos para mostrar</Text>
                ) : (
                  <LineChart chartData={lineChartData} chartOptions={lineChartOptions} />
                )}
              </Box>
            </Box>
            <Box className="bg-white rounded-lg shadow-md p-4">
              <Text className="text-xl font-semibold mb-4">Gastos por Categoría</Text>
              <Box h="300px" display="flex" alignItems="center" justifyContent="center">
                {datosCategorias.length === 0 ? (
                  <Text color="gray.400" textAlign="center">No hay datos para mostrar</Text>
                ) : (
                  <BarChart chartData={barChartData} chartOptions={barChartOptions} />
                )}
              </Box>
            </Box>
          </div>

          {/* Dashboard Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardOptions.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={option.onClick}
              >
                <div className="text-4xl mb-4">{option.icon}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {option.title}
                </h2>
                <p className="text-gray-600">
                  {option.description}
                </p>
              </motion.div>
            ))}
          </div>


        </motion.div>
      </div>
      
      {showUploadModal && (
        <UploadInvoice 
          onClose={() => {
            setShowUploadModal(false);
            // Actualizamos los datos después de subir una factura
            const refreshUserData = async () => {
              try {
                console.log('Actualizando datos después de subir factura...');
                const invoices = await invoicesApi.getUserInvoices(user.id);
                console.log('Facturas obtenidas del servidor:', invoices.length);
                
                // Verificamos si hay análisis en las facturas
                const facturasConAnalisis = invoices.filter(f => f.analysis);
                console.log('Facturas con análisis:', facturasConAnalisis.length);
                
                // Forzamos una actualización completa del estado con un nuevo objeto
                // para asegurar que React detecte el cambio
                setUserData({
                  ...userData,
                  total_uploads: invoices.length,
                  invoices: [...invoices], // Creamos un nuevo array para forzar la actualización
                  last_update: new Date().toISOString() // Añadimos timestamp para forzar actualización
                });
                console.log('Dashboard actualizado con nuevas facturas:', invoices.length);
              } catch (error) {
                console.error('Error refreshing user data:', error);
                setError('Error al actualizar los datos. Intenta recargar la página.');
              }
            };
            refreshUserData();
          }} 
        />
      )}
      
      {showViewModal && (
        <ViewInvoices onClose={() => {
          setShowViewModal(false);
          // ... refresco de datos ...
        }} onDelete={handleDeleteInvoice} />
      )}
    </div>
  );
};

export default DashboardNew;