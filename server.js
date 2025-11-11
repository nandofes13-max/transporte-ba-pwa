// server.js - Backend completo para Transporte BA PWA
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración API Transporte BA
const API_CONFIG = {
  BASE_URL: 'https://apitransporte.buenosaires.gob.ar',
  CLIENT_ID: process.env.CLIENT_ID || '1488a5089c9d4fc3852d46ddb850a28a',
  CLIENT_SECRET: process.env.CLIENT_SECRET || '799d511d89674AD893D1e2587Dc748c2'
};

// Middleware
app.use(cors());
app.use(express.json());

// 🆕 MIDDLEWARE PARA CONTROL DE CACHE
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|html|json|svg)$/) || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log('🚫 Cache deshabilitado para:', req.path);
  }
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static('.'));

// ===== UTILIDADES =====
async function makeAPIRequest(endpoint) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}?client_id=${API_CONFIG.CLIENT_ID}&client_secret=${API_CONFIG.CLIENT_SECRET}`;
  
  console.log(`🌐 [BACKEND] Haciendo request a: ${endpoint}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [BACKEND] Datos recibidos: ${data.length || 'object'} elementos`);
    
    return data;
  } catch (error) {
    console.error(`❌ [BACKEND] Error en ${endpoint}:`, error.message);
    throw error;
  }
}

// ===== ENDPOINTS DE TRANSPORTE =====

// Health check mejorado
app.get('/health', (req, res) => {
  res.json({ 
    message: '🚍 Backend Transporte BA funcionando',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    features: ['colectivos', 'subtes', 'trenes', 'ecobici']
  });
});

// 🚍 COLECTIVOS - Posiciones en tiempo real
app.get('/api/colectivos/posiciones', async (req, res) => {
  try {
    console.log('🚍 [API] Solicitando posiciones de colectivos...');
    
    const data = await makeAPIRequest('/colectivos/vehiclePositionsSimple');
    
    // Filtrar por ubicación si se proporciona
    const { lat, lng, radio = 5 } = req.query;
    let colectivosFiltrados = data;
    
    if (lat && lng) {
      const radioKm = parseFloat(radio);
      colectivosFiltrados = data.filter(colectivo => {
        const distancia = calcularDistancia(
          parseFloat(lat), parseFloat(lng),
          colectivo.latitude, colectivo.longitude
        );
        return distancia <= radioKm;
      }).slice(0, 100); // Limitar para performance
    }
    
    res.json({
      success: true,
      data: colectivosFiltrados,
      total: data.length,
      filtrados: colectivosFiltrados.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/colectivos/posiciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo posiciones de colectivos',
      details: error.message
    });
  }
});

// 🚍 COLECTIVOS - Paradas (placeholder para futuro)
app.get('/api/colectivos/paradas', async (req, res) => {
  try {
    console.log('📍 [API] Solicitando paradas de colectivos...');
    
    // Por ahora devolvemos un mensaje - implementar cuando tengamos el endpoint correcto
    res.json({
      success: true,
      message: 'Función de paradas en desarrollo',
      data: [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/colectivos/paradas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo paradas de colectivos'
    });
  }
});

// 🚇 SUBTES - Estaciones
app.get('/api/subtes/estaciones', async (req, res) => {
  try {
    console.log('🚇 [API] Solicitando estaciones de subte...');
    
    // Intentar diferentes endpoints
    const endpoints = ['/subtes/estaciones', '/subtes'];
    let data = null;
    
    for (const endpoint of endpoints) {
      try {
        data = await makeAPIRequest(endpoint);
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!data) {
      // Datos de ejemplo como fallback
      data = [
        { nombre: "Plaza de Mayo", linea: "A", lat: -34.6086, lon: -58.3710 },
        { nombre: "Congreso", linea: "A", lat: -34.6096, lon: -58.3925 },
        { nombre: "Catedral", linea: "D", lat: -34.6078, lon: -58.3734 },
        { nombre: "Obelisco", linea: "B", lat: -34.6037, lon: -58.3816 },
        { nombre: "Retiro", linea: "C", lat: -34.5915, lon: -58.3732 }
      ];
    }
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/subtes/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo estaciones de subte'
    });
  }
});

// 🚆 TRENES - Estaciones  
app.get('/api/trenes/estaciones', async (req, res) => {
  try {
    console.log('🚆 [API] Solicitando estaciones de tren...');
    
    // Datos de ejemplo hasta que encontremos el endpoint correcto
    const estacionesEjemplo = [
      { nombre: "Retiro", linea: "Mitre", lat: -34.5918, lon: -58.3730 },
      { nombre: "Constitución", linea: "Roca", lat: -34.6257, lon: -58.3807 },
      { nombre: "Once", linea: "Sarmiento", lat: -34.6092, lon: -58.4077 },
      { nombre: "Liniers", linea: "Sarmiento", lat: -34.6425, lon: -58.5233 }
    ];
    
    res.json({
      success: true,
      data: estacionesEjemplo,
      message: 'Datos de ejemplo - endpoint oficial en investigación',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/trenes/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo estaciones de tren'
    });
  }
});

// 🚲 ECOBICI - Estaciones
app.get('/api/ecobici/estaciones', async (req, res) => {
  try {
    console.log('🚲 [API] Solicitando estaciones de Ecobici...');
    
    // Datos de ejemplo hasta que el endpoint oficial funcione
    const estacionesEjemplo = [
      { nombre: "Plaza de Mayo", lat: -34.6083, lon: -58.3712 },
      { nombre: "Congreso", lat: -34.6098, lon: -58.3925 },
      { nombre: "Palermo", lat: -34.5806, lon: -58.4257 },
      { nombre: "Recoleta", lat: -34.5875, lon: -58.3930 }
    ];
    
    res.json({
      success: true,
      data: estacionesEjemplo,
      message: 'Datos de ejemplo - endpoint oficial en investigación',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/ecobici/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo estaciones de Ecobici'
    });
  }
});

// ===== FUNCIONES UTILITARIAS =====
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ===== ENDPOINTS LEGACY (mantener compatibilidad) =====
app.get('/api/paradas-cercanas', async (req, res) => {
  try {
    const { lat, lng, radio = 1 } = req.query;
    console.log('📍 [LEGACY] Buscando paradas cercanas:', { lat, lng, radio });
    
    res.json({
      ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radio: parseInt(radio),
      paradas: [],
      message: 'Usar /api/colectivos/paradas para la nueva versión',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en /api/paradas-cercanas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`🚫 Cache control activado para archivos estáticos`);
  console.log(`🔑 API Keys: ${API_CONFIG.CLIENT_ID ? 'Configuradas' : 'Usando valores por defecto'}`);
});
