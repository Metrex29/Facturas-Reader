import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname} className="relative w-full overflow-hidden">
        <Outlet />
      </div>
    </AnimatePresence>
  );
};

export default AuthLayout;