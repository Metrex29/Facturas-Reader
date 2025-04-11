import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import UploadInvoice from './UploadInvoice';
import ViewInvoices from './ViewInvoices';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setUserData(data);
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

  // In your JSX, add this before the closing div
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

export default Dashboard;