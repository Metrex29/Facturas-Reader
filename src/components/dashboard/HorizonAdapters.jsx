// Este archivo contiene adaptadores para los componentes de Horizon UI Chakra
// para que funcionen correctamente con las rutas de importación en nuestro proyecto

import React from 'react';
import { Box, Flex, Text, Icon, useColorModeValue } from '@chakra-ui/react';

// Importamos iconos necesarios para los componentes
import { RiMastercardFill } from 'react-icons/ri';

// Importamos los componentes originales de Horizon UI
// Usamos las rutas alias configuradas en vite.config.js para evitar problemas de importación
import OriginalCard from 'components/card/Card';
import OriginalMiniStatistics from 'components/card/MiniStatistics';
import OriginalMastercard from 'components/card/Mastercard';
import OriginalLineChart from 'components/charts/LineChart';
import OriginalBarChart from 'components/charts/BarChart';

// Fallback para componentes que no se puedan cargar
const FallbackComponent = ({ name, error }) => {
  console.error(`Error al cargar el componente ${name}:`, error);
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="red.50">
      <Text color="red.500">Error al cargar el componente {name}</Text>
    </Box>
  );
};

// Adaptador para Card
export const Card = (props) => {
  try {
    return <OriginalCard {...props} />;
  } catch (error) {
    return <FallbackComponent name="Card" error={error} />;
  }
};

// Adaptador para MiniStatistics
export const MiniStatistics = (props) => {
  try {
    return <OriginalMiniStatistics {...props} />;
  } catch (error) {
    return <FallbackComponent name="MiniStatistics" error={error} />;
  }
};

// Adaptador para Mastercard
export const Mastercard = (props) => {
  try {
    // Pasamos el icono RiMastercardFill como una propiedad global para que esté disponible en el componente
    return <OriginalMastercard {...props} RiMastercardFill={RiMastercardFill} />;
  } catch (error) {
    return <FallbackComponent name="Mastercard" error={error} />;
  }
};

// Adaptador para LineChart
export const LineChart = (props) => {
  try {
    return <OriginalLineChart {...props} />;
  } catch (error) {
    return <FallbackComponent name="LineChart" error={error} />;
  }
};

// Adaptador para BarChart
export const BarChart = (props) => {
  try {
    return <OriginalBarChart {...props} />;
  } catch (error) {
    return <FallbackComponent name="BarChart" error={error} />;
  }
};

// Exportamos todos los componentes adaptados
export default {
  Card,
  MiniStatistics,
  Mastercard,
  LineChart,
  BarChart
};