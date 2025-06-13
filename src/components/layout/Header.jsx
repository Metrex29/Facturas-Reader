import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  PhoneIcon,
  PlayCircleIcon,
} from "@heroicons/react/20/solid";
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const products = [
  {
    name: "Gráficos",
    description: "Mira tus estadisticas de facturas.",
    href: "#",
    icon: ChartPieIcon,
  },
  {
    name: "Precios actualizados del Mercadona",
    description: "Analiza los precios de los productos del mercado.",
    href: "#",
    icon: CursorArrowRaysIcon,
  },
];

const callsToAction = [
  { name: "Watch demo", href: "#", icon: PlayCircleIcon },
  { name: "Contact sales", href: "#", icon: PhoneIcon },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  // Ocultar header en rutas públicas o si no hay usuario
  const hiddenRoutes = ['/', '/login', '/signup'];
  if (!user || hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-900 transition-colors duration-200">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        {/* Izquierda: Logo/Inicio/Perfil */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <Link to="/dashboard" className="text-blue-700 dark:text-blue-400 font-bold text-lg hover:text-blue-900 dark:hover:text-blue-300 transition">
            Inicio
          </Link>
          {user && (
            user.foto_perfil ? (
              <img
                alt="Foto de perfil"
                src={`http://localhost:3001${user.foto_perfil}?t=${user.foto_perfil ? new Date().getTime() : ''}`}
                className="h-10 w-10 rounded-full object-cover border shadow-sm"
                style={{ background: '#f3f4f6' }}
              />
            ) : user.nombre ? (
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-lg border shadow-sm">
                {user.nombre[0].toUpperCase()}
              </div>
            ) : null
          )}
        </div>
        {/* Centro: Links principales centrados */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-x-12">
            <Link to="/dashboard" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">Dashboard</Link>
            <Link to="/account" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">Mi Cuenta</Link>
            <a href="https://github.com/Metrex29" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">mi Github</a>
          </div>
        </div>
        {/* Derecha: Botón de tema */}
        <div className="flex items-center gap-4 min-w-[100px] justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Cambiar tema"
          >
            {isDarkMode ? <FaSun color="#FFD600" /> : <FaMoon />}
          </button>
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">
                    Analisis
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 flex-none group-data-open:rotate-180"
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 space-y-2">
                    {[...products, ...callsToAction].map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </DisclosurePanel>
                </Disclosure>
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Marketplace
                </a>
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Company
                </a>
              </div>
              <div className="py-6">
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}