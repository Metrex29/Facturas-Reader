import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
};

export default AuthLayout;