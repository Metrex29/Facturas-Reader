// Simulación de cliente PostgreSQL para el navegador
// Esta es una solución temporal hasta que implementes un backend real

// Datos de ejemplo para desarrollo
const mockDatabase = {
  users: [
    { id: '123e4567-e89b-12d3-a456-426614174000', email: 'usuario@ejemplo.com', nombre: 'Usuario Ejemplo', passwd: 'password123' }
  ],
  user_profiles: [
    { id: 1, user_id: '123e4567-e89b-12d3-a456-426614174000', last_login: new Date().toISOString(), total_uploads: 5 }
  ],
  invoices: [
    { 
      id: 1, 
      user_id: '123e4567-e89b-12d3-a456-426614174000', 
      file_url: 'facturas/ejemplo.pdf', 
      date: '2023-05-15', 
      amount: 150.75, 
      description: 'Factura de ejemplo' 
    }
  ]
};

// Función para simular consultas
// Actualizar la función query para manejar consultas SQL básicas
export const query = async (text, params) => {
  console.log('Query:', text, params);
  
  // Simulación básica de consultas SQL
  if (text.includes('INSERT INTO users')) {
    const [userId, email, password, nombre] = params;
    const newUser = { id: userId, email, passwd: password, nombre };
    
    if (!mockDatabase.users) {
      mockDatabase.users = [];
    }
    
    // Verificar si el usuario ya existe
    const existingUser = mockDatabase.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }
    
    mockDatabase.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  
  if (text.includes('SELECT * FROM users WHERE email')) {
    // Para login/signIn
    if (params.length === 2) {
      const [email, password] = params;
      const user = mockDatabase.users.find(u => u.email === email && u.passwd === password);
      if (!user) {
        throw new Error('Credenciales incorrectas');
      }
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    } 
    // Para verificar si existe el email
    else if (params.length === 1) {
      const [email] = params;
      const user = mockDatabase.users.find(u => u.email === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
  }
  
  // Consulta genérica
  return { rows: [], rowCount: 0 };
};

// Simulación de la API de PostgreSQL
export const postgres = {
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        order: (orderColumn, { ascending = true } = {}) => {
          console.log(`SELECT ${columns} FROM ${table} WHERE ${column} = ${value} ORDER BY ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
          
          // Filtrar datos del mock según la consulta
          const filteredData = mockDatabase[table]?.filter(row => row[column] === value) || [];
          
          // Ordenar datos
          const sortedData = [...filteredData].sort((a, b) => {
            if (ascending) {
              return a[orderColumn] > b[orderColumn] ? 1 : -1;
            } else {
              return a[orderColumn] < b[orderColumn] ? 1 : -1;
            }
          });
          
          return Promise.resolve({ rows: sortedData, rowCount: sortedData.length });
        },
      }),
      execute: () => {
        console.log(`SELECT ${columns} FROM ${table}`);
        return Promise.resolve({ rows: mockDatabase[table] || [], rowCount: mockDatabase[table]?.length || 0 });
      }
    }),
    insert: (data) => ({
      select: () => {
        console.log(`INSERT INTO ${table}`, data);
        
        // Crear nuevo ID
        const newId = (mockDatabase[table]?.length || 0) + 1;
        const newRow = { id: newId, ...data };
        
        // Añadir a la base de datos mock
        if (!mockDatabase[table]) {
          mockDatabase[table] = [];
        }
        mockDatabase[table].push(newRow);
        
        return Promise.resolve({ rows: [newRow], rowCount: 1 });
      }
    }),
    update: (data) => ({
      eq: (column, value) => ({
        select: () => {
          console.log(`UPDATE ${table} SET ... WHERE ${column} = ${value}`);
          
          // Encontrar y actualizar el registro
          const index = mockDatabase[table]?.findIndex(row => row[column] === value);
          if (index !== -1 && index !== undefined) {
            mockDatabase[table][index] = { ...mockDatabase[table][index], ...data };
            return Promise.resolve({ rows: [mockDatabase[table][index]], rowCount: 1 });
          }
          
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
      })
    }),
    delete: () => ({
      eq: (column, value) => {
        console.log(`DELETE FROM ${table} WHERE ${column} = ${value}`);
        
        // Encontrar y eliminar el registro
        const index = mockDatabase[table]?.findIndex(row => row[column] === value);
        if (index !== -1 && index !== undefined) {
          const deleted = mockDatabase[table].splice(index, 1);
          return Promise.resolve({ rows: deleted, rowCount: deleted.length });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
    })
  })
};