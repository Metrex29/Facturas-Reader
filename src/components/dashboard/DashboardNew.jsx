import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
// Comentamos temporalmente esta importación hasta tener el proveedor configurado
// import { PostgresProvider } from '../../../database/providers/PostgresProvider';
import UploadInvoice from './UploadInvoice';
import ViewInvoices from './ViewInvoices';
import { invoicesApi } from '../../services/api/invoices';
import MiniTienda from '../MiniTienda';

// Importaciones de Chakra UI
import { Box, Flex, Grid, GridItem, Text, Icon, HStack, useColorModeValue } from '@chakra-ui/react';

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
    // Si no está en la lista, devolver la categoría original (respetando mayúsculas)
    return categoria.trim();
  };

  // Verificar si hay facturas para procesar
  if (!facturas || facturas.length === 0) {
    console.log("No hay facturas para analizar");
    return { gastosPorCategoria, gastosPorMes, gastoTotal, gastosPorCategoriaYMes };
  }

  // Procesar cada factura
  facturas.forEach((factura, i) => {
    // Obtener el importe real de la factura
    let importeReal = 0;
    try {
      // Intentar obtener el importe real de diferentes fuentes
      if (factura.amount) {
        importeReal = parseFloat(factura.amount);
      } else if (factura.validation_info) {
        const validation = JSON.parse(factura.validation_info);
        if (validation.importeReal) {
          importeReal = validation.importeReal;
        } else if (validation.precioDelNombre) {
          importeReal = validation.precioDelNombre;
        }
      }
    } catch (e) {
      console.error(`Error al obtener importe real de factura ${i}:`, e);
    }

    // Sumar al total general
    gastoTotal += importeReal;

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

    // Sumar por mes
    gastosPorMes[mes] = (gastosPorMes[mes] || 0) + importeReal;

    // Procesar productos para categorías si hay análisis
    if (factura.analysis) {
      let productos = [];
      try {
        if (typeof factura.analysis === 'object' && factura.analysis !== null) {
          productos = Array.isArray(factura.analysis) ? factura.analysis : [factura.analysis];
        } else {
          let clean = factura.analysis.replace(/```json|```/g, '').trim();
          productos = JSON.parse(clean);
        }
      } catch (e) {
        console.error(`Error al procesar análisis de factura ${i}:`, e);
        return;
      }

      if (!Array.isArray(productos)) return;

      // Calcular la proporción del importe real para cada producto
      const sumaProductos = productos.reduce((acc, prod) => {
        const precio = parseFloat(prod.precio || prod.price || 0);
        return acc + (isNaN(precio) ? 0 : precio);
      }, 0);

      const factorAjuste = sumaProductos > 0 ? importeReal / sumaProductos : 0;

      // Procesar cada producto
      productos.forEach((prod) => {
        const precioOriginal = parseFloat(prod.precio || prod.price || 0);
        if (isNaN(precioOriginal) || precioOriginal <= 0) return;

        // Ajustar el precio según el importe real
        const precioAjustado = precioOriginal * factorAjuste;
        
        // Obtener y normalizar la categoría
        const categoriaValue = prod.categoria || prod.category || 'Otros';
        const categoriaNormalizada = normalizarCategoria(categoriaValue);

        // Sumar por categoría
        gastosPorCategoria[categoriaNormalizada] = (gastosPorCategoria[categoriaNormalizada] || 0) + precioAjustado;

        // Análisis combinado por categoría y mes
        if (!gastosPorCategoriaYMes[mes]) {
          gastosPorCategoriaYMes[mes] = {};
        }
        gastosPorCategoriaYMes[mes][categoriaNormalizada] = 
          (gastosPorCategoriaYMes[mes][categoriaNormalizada] || 0) + precioAjustado;
      });
    }
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
  chart: { toolbar: { show: false }, background: 'transparent' },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: false },
  yaxis: {
    show: true,
    color: "#A3AED0",
    labels: {
      show: true,
      style: { colors: ["#A3AED0"], fontSize: "12px", fontWeight: "500" }
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
  plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } },
  background: 'transparent',
};

const lineChartOptionsBase = {
  chart: { toolbar: { show: false }, background: 'transparent' },
  tooltip: { theme: "dark" },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth" },
  yaxis: {
    labels: {
      style: { colors: ["#A3AED0"], fontSize: "12px", fontWeight: "500" }
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
  colors: ["#4318FF", "#39B8FF"],
  background: 'transparent',
};

const DashboardNew = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [error, setError] = useState(null);
  const [facturasMinitienda, setFacturasMinitienda] = useState([]);

  const labelColor = useColorModeValue('#222', '#F3F4F6');
  const gridColor = useColorModeValue('rgba(163, 174, 208, 0.3)', '#222c3c');
  const borderColorBox = useColorModeValue('#E5E7EB', '#23272F');
  const borderStyleBox = '1px solid';

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

  // 1. Cargar facturas de MiniTienda desde localStorage
  useEffect(() => {
    const cargarFacturasLocal = () => {
      const facturasLocal = JSON.parse(localStorage.getItem('facturasMinitienda') || '[]');
      setFacturasMinitienda(facturasLocal);
    };
    cargarFacturasLocal();
    const handleStorage = (event) => {
      if (event.key === 'facturasMinitienda') {
        cargarFacturasLocal();
      }
    };
    const handleCustom = () => cargarFacturasLocal();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('facturasMinitiendaActualizada', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('facturasMinitiendaActualizada', handleCustom);
    };
  }, []);

  // 2. Combinar facturas para gráficas
  const todasLasFacturas = [
    ...(userData?.invoices || []),
    ...facturasMinitienda
  ];

  // 3. Procesar facturas para gráficas
  useEffect(() => {
    if (todasLasFacturas.length > 0) {
      const datosActualizados = procesarAnalisisFacturas(todasLasFacturas);
      setDatosGraficas(datosActualizados);
    }
  }, [userData, facturasMinitienda]);

  // Procesar datos reales para las gráficas
  // Usamos un estado separado para los datos procesados para asegurar la actualización de las gráficas
  const [datosGraficas, setDatosGraficas] = useState({ gastosPorCategoria: {}, gastosPorMes: {}, gastoTotal: 0 });
  
  const { gastosPorCategoria, gastosPorMes, gastoTotal } = datosGraficas;

  // Preparar datos para la gráfica de barras (por categoría)
  const categorias = Array.isArray(Object.keys(gastosPorCategoria)) ? Object.keys(gastosPorCategoria).sort((a, b) => gastosPorCategoria[b] - gastosPorCategoria[a]) : [];
  const datosCategorias = Array.isArray(categorias) ? categorias.map(cat => parseFloat(gastosPorCategoria[cat]?.toFixed(2) || 0)) : [];
  
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

  // Paleta de colores pastel para categorías adicionales
  const pastelPalette = [
    '#A3AED0', '#B5EAD7', '#FFDAC1', '#E2F0CB', '#C7CEEA', '#FFB7B2', '#B5B9FF', '#F3B0C3', '#B2F7EF', '#FF9AA2',
    '#FFB347', '#B4F8C8', '#FBE7C6', '#B2A4FF', '#F6DFEB', '#B6E2D3', '#F7D6E0', '#B5EAD7', '#E2F0CB', '#C7CEEA'
  ];

  // Función para abreviar nombres de categorías
  const abreviarCategoria = (nombre) => {
    if (!nombre) return '';
    const map = {
      'Frutas y Verduras': 'Frutas/Verd.',
      'Cereales y Legumbres': 'Cereales/Leg.',
      'Lácteos y Huevos': 'Lácteos/Huevos',
      'Alimentación': 'Alim.',
      'Electrónica': 'Electrón.',
      'Otros': 'Otros',
      'Carnes': 'Carnes',
      'Bebidas': 'Bebidas',
      'Higiene': 'Higiene',
      'Hogar': 'Hogar',
      'Ropa': 'Ropa',
      'Transporte': 'Transp.',
      'Ocio': 'Ocio',
      'Salud': 'Salud',
      'Educación': 'Educ.'
    };
    return map[nombre] || (nombre.length > 14 ? nombre.slice(0, 12) + '.' : nombre);
  };

  // Abreviar nombres para la gráfica y la leyenda
  const categoriasAbreviadas = Array.isArray(categorias) ? categorias.map(abreviarCategoria) : [];

  // Asignar colores a las categorías, usando la paleta pastel si no está en coloresCategorias
  const coloresGrafica = categorias.map((cat, idx) =>
    coloresCategorias[cat] || pastelPalette[idx % pastelPalette.length]
  );
  
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
      categories: categoriasAbreviadas.length > 0 ? categoriasAbreviadas : ["Sin datos"],
      labels: {
        show: true,
        style: { colors: [labelColor], fontSize: "14px", fontWeight: "500" },
        rotate: -30,
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
    legend: {
      show: true,
      labels: {
        colors: [labelColor],
        useSeriesColors: false,
        formatter: function(val) {
          return abreviarCategoria(val);
        }
      }
    },
    grid: {
      ...barChartOptionsBase.grid,
      borderColor: gridColor
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
  const meses = Array.isArray(Object.keys(gastosPorMes)) ? Object.keys(gastosPorMes).sort() : [];
  const datosMeses = Array.isArray(meses) ? meses.map(mes => parseFloat(gastosPorMes[mes]?.toFixed(2) || 0)) : [];
  
  // Formatear nombres de meses para mejor visualización
  const nombresMeses = Array.isArray(meses) ? meses.map(mes => {
    const [año, numMes] = mes.split('-');
    const fecha = new Date(parseInt(año), parseInt(numMes) - 1, 1);
    return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }) : [];
  
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
        style: { colors: [labelColor], fontSize: "12px", fontWeight: "500" },
        rotate: -45,
        rotateAlways: meses.length > 4
      },
      axisBorder: {
        show: true,
        color: gridColor
      },
      axisTicks: {
        show: true,
        color: gridColor
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
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }
    },
    markers: {
      size: 5,
      colors: ["#4318FF"],
      strokeColors: labelColor,
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
      },
      borderColor: gridColor,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    chart: {
      ...lineChartOptionsBase.chart,
      background: 'transparent',
      foreColor: labelColor,
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    yaxis: {
      ...lineChartOptionsBase.yaxis,
      labels: {
        style: { colors: [labelColor], fontSize: "12px", fontWeight: "500" }
      },
      axisBorder: {
        show: true,
        color: gridColor
      },
      axisTicks: {
        show: true,
        color: gridColor
      }
    },
    stroke: {
      ...lineChartOptionsBase.stroke,
      colors: ["#4318FF"],
      width: 3,
      curve: 'smooth'
    },
    fill: {
      ...lineChartOptionsBase.fill,
      colors: ["#4318FF"],
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0.2
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.04
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.88
        }
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
      title: 'Mi MiniTienda (Beta) ',
      description: 'Simula una compra en una tienda <br><span style="color:#000;"><b>BETA</b></span>',
      icon: '🛒',
      link: '/minitienda'
    },
    {
      id: 'settings',
      title: 'Mi Cuenta',
      description: 'Configura tus preferencias personales',
      icon: '⚙️'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-gray-800 border-l-4 border-red-500 dark:border-red-400 rounded-md">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">Intenta recargar la página o verifica que el servidor esté en funcionamiento.</p>
          </div>
        )}
        <div className="flex items-center mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bienvenido, {user?.nombre || "Usuario"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {userData?.last_login && `Último acceso: ${new Date(userData.last_login).toLocaleDateString()}`}
            </p>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3">
            {user ? (
              user.foto_perfil ? (
                <img
                  src={`http://localhost:3001${user.foto_perfil}?t=${user.foto_perfil ? new Date().getTime() : ''}`}
                  alt="Foto de perfil"
                  className="w-12 h-12 rounded-full object-cover border shadow-sm dark:shadow-none"
                  style={{ background: '#f3f4f6' }}
                />
              ) : (
                <span className="text-2xl text-gray-900 dark:text-white">{user?.nombre ? user.nombre[0].toUpperCase() : ''}</span>
              )
            ) : null}
          </div>
        </div>

        {/* Mini Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
          <Box 
            bg="white" 
            _dark={{ bg: "#111827" }} 
            borderRadius="lg" 
            color="gray.900" 
            border={borderStyleBox}
            borderColor={borderColorBox}
            _hover={{ boxShadow: 'none' }}
            transition="none"
          >
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
              growth={"+23%"}
            />
          </Box>
          <Box 
            bg="white" 
            _dark={{ bg: "#111827" }} 
            borderRadius="lg" 
            color="gray.900" 
            border={borderStyleBox}
            borderColor={borderColorBox}
            _hover={{ boxShadow: 'none' }}
            transition="none"
          >
            <MiniStatistics
              name="Gasto Total"
              value={`${gastoTotal.toFixed(2)} €`}
              growth={"0%"}
            />
          </Box>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Box 
            bg="white" 
            _dark={{ bg: "#0b1437" }} 
            borderRadius="lg" 
            p={4}
            border={borderStyleBox}
            borderColor={borderColorBox}
            _hover={{ boxShadow: 'none' }}
            transition="none"
          >
            <Text fontSize="xl" fontWeight="semibold" mb={4} color="gray.900" _dark={{ color: "white" }}>
              Evolución de Gastos Mensuales
            </Text>
            <Box h="300px" display="flex" alignItems="center" justifyContent="center">
              {datosMeses.length === 0 ? (
                <Text color="gray.400" _dark={{ color: "gray.400" }} textAlign="center">
                  No hay datos para mostrar
                </Text>
              ) : (
                <LineChart chartData={lineChartData} chartOptions={lineChartOptions} />
              )}
            </Box>
          </Box>
          <Box 
            bg="white" 
            _dark={{ bg: "#0b1437" }} 
            borderRadius="lg" 
            p={4}
            border={borderStyleBox}
            borderColor={borderColorBox}
            _hover={{ boxShadow: 'none' }}
            transition="none"
          >
            <Text fontSize="xl" fontWeight="semibold" mb={4} color="gray.900" _dark={{ color: "white" }}>
              Gastos por Categoría
            </Text>
            <Box h="400px" display="flex" alignItems="center" justifyContent="center" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              {datosCategorias.length === 0 ? (
                <Text color="gray.400" _dark={{ color: "gray.400" }} textAlign="center">
                  No hay datos para mostrar
                </Text>
              ) : (
                <BarChart chartData={barChartData} chartOptions={barChartOptions} />
              )}
            </Box>
          </Box>
        </div>

       

        {/* Dashboard Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardOptions.map((option) => (
            option.id === 'settings' ? (
              <Link to="/account" key={option.id} style={{ textDecoration: 'none' }}>
                <Box
                  bg="white"
                  _dark={{ bg: "gray.900" }}
                  borderRadius="lg"
                  p={6}
                  cursor="pointer"
                  border={borderStyleBox}
                  borderColor={borderColorBox}
                  _hover={{ boxShadow: 'none' }}
                  transition="none"
                >
                  <Box fontSize="4xl" mb={4}>{option.icon}</Box>
                  <Text fontSize="xl" fontWeight="semibold" color="gray.800" _dark={{ color: "white" }} mb={2}>
                    {option.title}
                  </Text>
                  <Text
                    color="gray.600"
                    _dark={{ color: "gray.300" }}
                    dangerouslySetInnerHTML={{ __html: option.description }}
                  />
                </Box>
              </Link>
            ) : option.link ? (
              <Link to={option.link} key={option.id} style={{ textDecoration: 'none' }}>
                <Box
                  bg="white"
                  _dark={{ bg: "gray.900" }}
                  borderRadius="lg"
                  p={6}
                  cursor="pointer"
                  border={borderStyleBox}
                  borderColor={borderColorBox}
                  _hover={{ boxShadow: 'none' }}
                  transition="none"
                >
                  <Box fontSize="4xl" mb={4}>{option.icon}</Box>
                  <Text fontSize="xl" fontWeight="semibold" color="gray.800" _dark={{ color: "white" }} mb={2}>
                    {option.title}
                  </Text>
                  <Text
                    color="gray.600"
                    _dark={{ color: "gray.300" }}
                    dangerouslySetInnerHTML={{ __html: option.description }}
                  />
                </Box>
              </Link>
            ) : (
              <Box
                key={option.id}
                bg="white"
                _dark={{ bg: "gray.900" }}
                borderRadius="lg"
                p={6}
                cursor="pointer"
                border={borderStyleBox}
                borderColor={borderColorBox}
                _hover={{ boxShadow: 'none' }}
                transition="none"
                onClick={option.onClick}
              >
                <Box fontSize="4xl" mb={4}>{option.icon}</Box>
                <Text fontSize="xl" fontWeight="semibold" color="gray.800" _dark={{ color: "white" }} mb={2}>
                  {option.title}
                </Text>
                <Text
                  color="gray.600"
                  _dark={{ color: "gray.300" }}
                  dangerouslySetInnerHTML={{ __html: option.description }}
                />
              </Box>
            )
          ))}
        </div>

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
        <ViewInvoices 
          onClose={() => setShowViewModal(false)} 
          onDelete={handleDeleteInvoice}
          invoices={[
            ...(userData?.invoices || []),
            ...facturasMinitienda
          ]}
        />
      )}


    </div>
  );
};

export default DashboardNew;