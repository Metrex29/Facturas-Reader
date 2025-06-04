export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-8 border-t border-gray-700 w-full">
      <div className="mx-auto max-w-7xl px-4 py-2 md:flex md:items-center md:justify-between lg:px-6">
        <div className="flex justify-center space-x-6">
          <a
            href="https://github.com/Metrex29"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/carlos-pic%C3%B3n-4aa40b280/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            LinkedIn
          </a>
          <a
            href="mailto:carlosraulpiconmosquera@gmail.com"
            className="text-gray-400 hover:text-white"
          >
            Email
          </a>
        </div>
        <p className="mt-2 text-center text-xs leading-5 text-gray-500 md:mt-0">
          &copy; {new Date().getFullYear()} Facturas IA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}