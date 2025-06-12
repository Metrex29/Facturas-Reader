import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DashboardNew from "./components/dashboard/DashboardNew";
import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import Hero from "./components/layout/Hero";
import AnonymousUploadPage from "./pages/AnonymousUploadPage";
import AccountPage from "./pages/AccountPage";
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
// Importamos el tema de Chakra UI para asegurar que se aplique correctamente
import theme from '../horizon-ui-chakra/src/theme/theme';
// Importamos React para usar React.Suspense si es necesario
import React from 'react';
import MiniTienda from "./components/MiniTienda";

function App() {
  // Envolvemos la aplicación en un bloque try-catch para capturar errores de renderizado
  try {
    return (
      <ThemeProvider>
        <AuthProvider>
          <ChakraProvider theme={theme}>
            <CSSReset /> {/* Asegura que los estilos de Chakra UI se apliquen correctamente */}
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Hero />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/dashboard" element={<DashboardNew />} />
                    <Route path="/upload-anonymous" element={<AnonymousUploadPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/minitienda" element={<MiniTienda />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </ChakraProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('Error al renderizar la aplicación:', error);
    // Renderizado de fallback en caso de error
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error al cargar la aplicación</h1>
        <p className="text-gray-700 mb-4">Ha ocurrido un problema al inicializar la aplicación. Por favor, intenta recargar la página.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recargar página
        </button>
      </div>
    );
  }
}

export default App;


