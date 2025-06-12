import React, { useState, useEffect } from "react";
import { Box, Input, Button, useColorModeValue, IconButton, Text, Spinner, Alert, AlertIcon, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Divider } from "@chakra-ui/react";
import { FiShoppingCart, FiSearch } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";

export default function MiniTienda({ onNuevaFactura }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [factura, setFactura] = useState(null);

  // Colores Chakra UI
  const bgMain = useColorModeValue("gray.50", "gray.900");
  const colorMain = useColorModeValue("gray.800", "gray.100");
  const bgHeader = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.100", "gray.700");
  const inputFocusBg = useColorModeValue("white", "gray.600");
  const sidebarBg = useColorModeValue("white", "gray.800");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");
  const catSelectedBg = useColorModeValue("teal.100", "teal.700");
  const catSelectedColor = useColorModeValue("teal.700", "white");
  const prodCardBg = useColorModeValue("white", "gray.800");
  const prodImgBg = useColorModeValue("gray.100", "gray.700");
  const facturaBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("public/data/mercadona_products.json")
    
      .then(res => {
        if (!res.ok) throw new Error("No se pudo obtener el JSON del backend");
        return res.json();
      })
      .then(data => {
        console.log("Productos recibidos:", data);
        const cats = [
          ...new Set(
            data.map(p => {
              let cat = p.productCategory || p.category || "";
              cat = (cat && cat.trim()) ? cat.trim() : "Sin categoría";
              return cat;
            })
          )
        ];
        setProductos(data);
        setCategorias(cats);
        setCategoriaSeleccionada(cats[0] || "");
        setLoading(false);
      })
      .catch(err => {
        setError("No se pudo cargar el archivo de productos: " + err.message);
        setLoading(false);
      });
  }, []);

  const productosFiltrados = productos.filter(
    (p) => {
      let cat = p.productCategory || p.category || "";
      cat = (cat && cat.trim()) ? cat.trim() : "Sin categoría";
      return (
        cat === categoriaSeleccionada &&
        p.name.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
  );

  return (
    <Box
      minH="100vh"
      bg={bgMain}
      color={colorMain}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        px={6}
        py={4}
        bg={bgHeader}
        boxShadow="md"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box fontWeight="bold" fontSize="2xl" color="teal.500">
          Facturas IA - MiniTienda
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Input
            placeholder="Buscar productos"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            width="250px"
            bg={inputBg}
            border="none"
            _focus={{ bg: inputFocusBg }}
          />
          <Box position="relative">
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <IconButton
                  icon={<FiShoppingCart />} 
                  aria-label="Carrito" 
                  variant="ghost"
                />
              </PopoverTrigger>
              <PopoverContent minW="260px">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold">Carrito</PopoverHeader>
                <PopoverBody>
                  {carrito.length === 0 ? (
                    <Text color="gray.500">El carrito está vacío.</Text>
                  ) : (
                    <Box>
                      {carrito.map((prod, idx) => (
                        <Box key={idx} mb={2}>
                          <Text fontWeight="semibold">{prod.name}</Text>
                          <Text fontSize="sm" color="gray.500">{prod.price}</Text>
                          {idx < carrito.length - 1 && <Divider my={2} />}
                        </Box>
                      ))}
                      <Divider my={2} />
                      <Box fontWeight="bold" mb={2}>
                        Total: {carrito.reduce((acc, p) => acc + (parseFloat((p.price || '0').replace(',', '.'))), 0).toFixed(2)} €
                      </Box>
                      <Button colorScheme="teal" w="full" size="sm" onClick={() => {
                        const total = carrito.reduce((acc, p) => acc + (parseFloat((p.price || '0').replace(',', '.'))), 0);
                        // Calcular análisis por categoría
                        const categories = {};
                        carrito.forEach(prod => {
                          // Usar prod.category si es string, si es URL, puedes mapearlo a nombre si lo prefieres
                          let cat = prod.productCategory || prod.category || 'Sin categoría';
                          if (typeof cat === 'string' && cat.startsWith('http')) cat = 'Sin categoría';
                          const price = parseFloat((prod.price || '0').replace(',', '.'));
                          if (!categories[cat]) categories[cat] = 0;
                          categories[cat] += price;
                        });
                        const now = new Date();
                        const analysis = JSON.stringify({
                          total: parseFloat(total.toFixed(2)),
                          categories
                        });
                        const facturaObj = {
                          fecha: now.toLocaleString(),
                          date: now.toISOString(),
                          productos: carrito,
                          total: total.toFixed(2),
                          amount: parseFloat(total.toFixed(2)),
                          id: Date.now(),
                          analysis
                        };
                        setFactura(facturaObj);
                        setCarrito([]);
                        if (onNuevaFactura) onNuevaFactura(facturaObj);
                        // Guardar en localStorage
                        const facturasGuardadas = JSON.parse(localStorage.getItem('facturasMinitienda') || '[]');
                        localStorage.setItem('facturasMinitienda', JSON.stringify([...facturasGuardadas, facturaObj]));
                        window.dispatchEvent(new Event('facturasMinitiendaActualizada'));
                      }}>
                        Finalizar compra
                      </Button>
                    </Box>
                  )}
                </PopoverBody>
              </PopoverContent>
            </Popover>
            {carrito.length > 0 && (
              <Box
                position="absolute"
                top="-1"
                right="-1"
                bg="red.400"
                color="white"
                borderRadius="full"
                fontSize="xs"
                px={2}
                py={0.5}
                minW="20px"
                textAlign="center"
                zIndex={1}
              >
                {carrito.length}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main */}
      <Box display="flex" flex="1" overflow="hidden">
        {/* Sidebar de categorías */}
        <Box
          w="260px"
          bg={sidebarBg}
          borderRight="1px solid"
          borderColor={sidebarBorder}
          py={6}
          px={4}
          overflowY="auto"
        >
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" h="100%"><Spinner size="lg" /></Box>
          ) : error ? (
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          ) : categorias.length === 0 ? (
            <Text color="gray.400">
              No hay categorías disponibles.<br />
              {productos.length === 0
                ? "No se han encontrado productos en la tienda."
                : "Revisa que los productos tengan categoría en el JSON."}
            </Text>
          ) : (
            categorias.map((cat) => (
              <Box
                key={cat}
                py={2}
                px={3}
                borderRadius="md"
                cursor="pointer"
                fontWeight={categoriaSeleccionada === cat ? "bold" : "normal"}
                bg={categoriaSeleccionada === cat ? catSelectedBg : "transparent"}
                color={categoriaSeleccionada === cat ? catSelectedColor : "inherit"}
                _dark={{
                  bg: categoriaSeleccionada === cat ? "teal.700" : "transparent",
                  color: categoriaSeleccionada === cat ? "white" : "inherit",
                }}
                mb={1}
                onClick={() => setCategoriaSeleccionada(cat)}
                transition="all 0.2s"
              >
                {cat}
              </Box>
            ))
          )}
        </Box>

        {/* Grid de productos */}
        <Box flex="1" p={8} overflowY="auto">
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" h="100%"><Spinner size="lg" /></Box>
          ) : error ? (
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          ) : productos.length === 0 ? (
            <Text color="gray.400" fontSize="xl">
              No hay productos disponibles.<br />
              Asegúrate de que el backend responde correctamente y que el archivo JSON tiene productos.
            </Text>
          ) : (
            <>
              <Box fontSize="2xl" fontWeight="bold" mb={6}>
                {categoriaSeleccionada}
              </Box>
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))"
                gap={6}
              >
                {productosFiltrados.length === 0 ? (
                  <Text color="gray.400" gridColumn="1/-1">
                    No hay productos en esta categoría.
                  </Text>
                ) : (
                  productosFiltrados.map((prod, idx) => (
                    <Box
                      key={idx}
                      bg={prodCardBg}
                      borderRadius="xl"
                      boxShadow="md"
                      p={4}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      transition="transform 0.15s"
                      _hover={{ transform: "scale(1.03)", boxShadow: "xl" }}
                    >
                      <Box
                        as="img"
                        src={prod.image}
                        alt={prod.name}
                        boxSize="120px"
                        objectFit="contain"
                        mb={3}
                        borderRadius="md"
                        bg={prodImgBg}
                      />
                      <Box fontWeight="semibold" textAlign="center" mb={1}>
                        {prod.name}
                      </Box>
                      <Box fontSize="sm" color="gray.500" mb={2}>
                        {prod.description}
                      </Box>
                      <Box fontWeight="bold" color="teal.600" mb={2}>
                        {prod.price}
                      </Box>
                      <Button
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                        w="full"
                        mt="auto"
                        onClick={() => setCarrito([...carrito, prod])}
                      >
                        Añadir al carro
                      </Button>
                    </Box>
                  ))
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Mostrar factura generada */}
      {factura && (
        <Box maxW="600px" mx="auto" mt={8} p={6} bg={facturaBg} borderRadius="lg" boxShadow="md">
          <Box fontWeight="bold" fontSize="xl" mb={2} color="teal.600">Factura generada</Box>
          <Box fontSize="sm" color="gray.500" mb={2}>Fecha: {factura.fecha}</Box>
          <Divider mb={4} />
          {factura.productos.map((prod, idx) => (
            <Box key={idx} display="flex" justifyContent="space-between" mb={2}>
              <Box>{prod.name}</Box>
              <Box>{prod.price} €</Box>
            </Box>
          ))}
          <Divider my={4} />
          <Box display="flex" justifyContent="space-between" fontWeight="bold" fontSize="lg">
            <Box>Total</Box>
            <Box>{factura.total} €</Box>
          </Box>
        </Box>
      )}
    </Box>
  );
} 