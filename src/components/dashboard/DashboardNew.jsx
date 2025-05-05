import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
// Comentamos temporalmente esta importación hasta tener el proveedor configurado
// import { PostgresProvider } from '../../../database/providers/PostgresProvider';
import UploadInvoice from './UploadInvoice';
import ViewInvoices from './ViewInvoices';

// Importaciones de Chakra UI
import { Box, Flex, Grid, GridItem, Text, Icon, useColorModeValue } from '@chakra-ui/react';

// Importaciones de componentes adaptados de Horizon UI
import { Card, MiniStatistics, LineChart, BarChart, Mastercard } from './HorizonAdapters';

// Iconos
import { ArrowUpIcon } from '@heroicons/react/20/solid';

// Comentamos temporalmente esta línea hasta tener el proveedor configurado
// const dbProvider = new PostgresProvider();
// Usaremos datos de ejemplo por ahora

// Datos de ejemplo para los gráficos
const lineChartData = [
  {
    name: "Gastos Mensuales",
    data: [50, 64, 48, 66, 49, 68],
  },
  {
    name: "Ingresos",
    data: [30, 40, 24, 46, 20, 46],
  },
];

const lineChartOptions = {
  chart: {
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    theme: "dark",
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
  },
  xaxis: {
    categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    labels: {
      style: {
        colors: "#A3AED0",
        fontSize: "12px",
        fontWeight: "500",
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#A3AED0",
        fontSize: "12px",
        fontWeight: "500",
      },
    },
  },
  legend: {
    show: false,
  },
  grid: {
    strokeDashArray: 5,
  },
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
      stops: [],
    },
    colors: ["#4318FF", "#39B8FF"],
  },
  colors: ["#4318FF", "#39B8FF"],
};

const barChartData = [
  {
    name: "Gastos por Categoría",
    data: [400, 370, 330, 390, 320, 350, 360, 320, 380],
  },
];

const barChartOptions = {
  chart: {
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    style: {
      fontSize: "12px",
    },
    onDatasetHover: {
      style: {
        fontSize: "12px",
      },
    },
    theme: "dark",
  },
  xaxis: {
    categories: ["Alimentos", "Transporte", "Servicios", "Ocio", "Salud", "Educación", "Ropa", "Hogar", "Otros"],
    show: false,
    labels: {
      show: true,
      style: {
        colors: "#A3AED0",
        fontSize: "12px",
        fontWeight: "500",
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    show: true,
    color: "black",
    labels: {
      show: true,
      style: {
        colors: "#A3AED0",
        fontSize: "12px",
        fontWeight: "500",
      },
    },
  },
  grid: {
    borderColor: "rgba(163, 174, 208, 0.3)",
    show: true,
    yaxis: {
      lines: {
        show: true,
      },
    },
    row: {
      opacity: 0.5,
    },
    column: {
      opacity: 0.5,
    },
    padding: {
      left: 0,
      right: 0,
      top: 15,
      bottom: 15,
    },
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
          {
            offset: 0,
            color: "#4318FF",
            opacity: 1,
          },
          {
            offset: 100,
            color: "rgba(67, 24, 255, 1)",
            opacity: 0.28,
          },
        ],
      ],
    },
  },
  dataLabels: {
    enabled: false,
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: "40px",
    },
  },
};

const DashboardNew = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Colores para Chakra UI
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = "secondaryGray.600";
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  useEffect(() => {
    // Simulamos la carga de datos del usuario
    const fetchUserData = async () => {
      try {
        // Datos de ejemplo
        setUserData({
          total_uploads: 12,
          last_login: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
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
      title: 'Mis Facturas',
      description: 'Gestiona tus facturas personales',
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                value="$1,234"
                growth="+5%"
              />
            </Box>
            <Box>
              <MiniStatistics
                name="Facturas Pendientes"
                value="3"
              />
            </Box>
            <Box>
              <MiniStatistics
                name="Ahorro Estimado"
                value="$321"
                growth="+10%"
              />
            </Box>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Box className="bg-white rounded-lg shadow-md p-4">
              <Text className="text-xl font-semibold mb-4">Gastos vs Ingresos</Text>
              <Box h="300px">
                <LineChart chartData={lineChartData} chartOptions={lineChartOptions} />
              </Box>
            </Box>
            <Box className="bg-white rounded-lg shadow-md p-4">
              <Text className="text-xl font-semibold mb-4">Gastos por Categoría</Text>
              <Box h="300px">
                <BarChart chartData={barChartData} chartOptions={barChartOptions} />
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
                onClick={option.onClick || (() => setSelectedOption(option.id))}
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

          {/* Mastercard Component */}
          <div className="mt-6">
            <Box maxW="400px" mx="auto">
              <Mastercard
                number="**** **** **** 1234"
                exp="09/24"
                cvv="***"
              />
            </Box>
          </div>
        </motion.div>
      </div>
      
      {showUploadModal && (
        <UploadInvoice onClose={() => setShowUploadModal(false)} />
      )}
      
      {showViewModal && (
        <ViewInvoices onClose={() => setShowViewModal(false)} />
      )}
    </div>
  );
};

export default DashboardNew;