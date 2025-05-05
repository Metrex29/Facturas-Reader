// esbuild.config.js
// Este archivo configura esbuild para tratar todos los archivos .js en horizon-ui-chakra como JSX

module.exports = {
  // Configuración para que esbuild trate los archivos .js en horizon-ui-chakra como JSX
  jsx: {
    // Tratar todos los archivos .js en horizon-ui-chakra como JSX
    parse: {
      syntax: 'jsx',
    },
    // Asegurarse de que los archivos .js sean procesados como JSX
    loader: {
      '.js': 'jsx',
    },
  },
  // Configuración adicional para asegurar compatibilidad con React
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
};