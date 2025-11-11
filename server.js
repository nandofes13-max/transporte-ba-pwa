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
async function makeAPIRequest(endpoint, params = {}) {
  const baseParams = `client_id=${API_CONFIG.CLIENT_ID}&client_secret=${API_CONFIG.CLIENT_SECRET}`;
  const additionalParams = new URLSearchParams(params).toString();
  const urlParams = additionalParams ? `${baseParams}&${additionalParams}` : baseParams;
  
  const url = `${API_CONFIG.BASE_URL}${endpoint}?${urlParams}`;
  
  console.log(`🌐 [BACKEND] Haciendo request a: ${endpoint}`);
  console.log(`📋 [BACKEND] Parámetros:`, params);
  
  try {
    const response = await fetch(url, {
      timeout: 10000 // 10 segundos timeout
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [BACKEND] Datos recibidos: ${Array.isArray(data) ? data.length + ' elementos' : 'objeto'}`);
    
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
    version: '1.2.0',
    features: ['colectivos', 'subtes', 'trenes', 'ecobici', 'paradas']
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
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚍 COLECTIVOS - Paradas (ENDOPOINT REAL)
app.get('/api/colectivos/paradas', async (req, res) => {
  try {
    console.log('📍 [API] Solicitando paradas de colectivos...');
    
    // Usar el endpoint real de la API según documentación
    const data = await makeAPIRequest('/colectivos/stops');
    
    // Filtrar por ubicación si se proporciona
    const { lat, lng, radio = 2 } = req.query;
    let paradasFiltradas = data;
    
    if (lat && lng && data && data.length > 0) {
      const radioKm = parseFloat(radio);
      paradasFiltradas = data.filter(parada => {
        if (!parada.latitude || !parada.longitude) return false;
        const distancia = calcularDistancia(
          parseFloat(lat), parseFloat(lng),
          parseFloat(parada.latitude), parseFloat(parada.longitude)
        );
        return distancia <= radioKm;
      });
    }
    
    res.json({
      success: true,
      data: paradasFiltradas || [],
      total: data ? data.length : 0,
      filtrados: paradasFiltradas ? paradasFiltradas.length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/colectivos/paradas:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚍 COLECTIVOS - Líneas de colectivos
app.get('/api/colectivos/lineas', async (req, res) => {
  try {
    console.log('🟢 [API] Solicitando líneas de colectivos...');
    
    const data = await makeAPIRequest('/colectivos/routes');
    
    res.json({
      success: true,
      data: data || [],
      total: data ? data.length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/colectivos/lineas:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚇 SUBTES - Estaciones y estado
app.get('/api/subtes/estaciones', async (req, res) => {
  try {
    console.log('🚇 [API] Solicitando estaciones de subte...');
    
    const data = await makeAPIRequest('/subtes/stations');
    
    res.json({
      success: true,
      data: data || [],
      total: data ? data.length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/subtes/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚇 SUBTES - Estado del servicio
app.get('/api/subtes/estado', async (req, res) => {
  try {
    console.log('🟡 [API] Solicitando estado del subte...');
    
    const data = await makeAPIRequest('/subtes/serviceStatus');
    
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/subtes/estado:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚆 TRENES - Estaciones  
app.get('/api/trenes/estaciones', async (req, res) => {
  try {
    console.log('🚆 [API] Solicitando estaciones de tren...');
    
    const data = await makeAPIRequest('/trenes/stations');
    
    res.json({
      success: true,
      data: data || [],
      total: data ? data.length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/trenes/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚆 TRENES - Estado del servicio
app.get('/api/trenes/estado', async (req, res) => {
  try {
    console.log('🟡 [API] Solicitando estado de trenes...');
    
    const data = await makeAPIRequest('/trenes/serviceStatus');
    
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/trenes/estado:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
    });
  }
});

// 🚲 ECOBICI - Estaciones
app.get('/api/ecobici/estaciones', async (req, res) => {
  try {
    console.log('🚲 [API] Solicitando estaciones de Ecobici...');
    
    const data = await makeAPIRequest('/ecobici/stations');
    
    // Filtrar por ubicación si se proporciona
    const { lat, lng, radio = 2 } = req.query;
    let estacionesFiltradas = data;
    
    if (lat && lng && data && data.length > 0) {
      const radioKm = parseFloat(radio);
      estacionesFiltradas = data.filter(estacion => {
        if (!estacion.latitude || !estacion.longitude) return false;
        const distancia = calcularDistancia(
          parseFloat(lat), parseFloat(lng),
          parseFloat(estacion.latitude), parseFloat(estacion.longitude)
        );
        return distancia <= radioKm;
      });
    }
    
    res.json({
      success: true,
      data: estacionesFiltradas || [],
      total: data ? data.length : 0,
      filtrados: estacionesFiltradas ? estacionesFiltradas.length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en /api/ecobici/estaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'API falló',
      details: error.message
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
    
    // Usar el endpoint real
    const paradas = await makeAPIRequest('/colectivos/stops');
    let paradasFiltradas = paradas || [];
    
    if (lat && lng && paradas) {
      const radioKm = parseFloat(radio);
      paradasFiltradas = paradas.filter(parada => {
        if (!parada.latitude || !parada.longitude) return false;
        const distancia = calcularDistancia(
          parseFloat(lat), parseFloat(lng),
          parseFloat(parada.latitude), parseFloat(parada.longitude)
        );
        return distancia <= radioKm;
      });
    }
    
    res.json({
      ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radio: parseInt(radio),
      paradas: paradasFiltradas,
      total: paradasFiltradas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en /api/paradas-cercanas:', error);
    res.status(500).json({ 
      error: 'API falló',
      details: error.message
    });
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
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   🚍 /api/colectivos/posiciones - Posiciones en tiempo real`);
  console.log(`   📍 /api/colectivos/paradas - Paradas de colectivos`);
  console.log(`   🟢 /api/colectivos/lineas - Líneas de colectivos`);
  console.log(`   🚇 /api/subtes/estaciones - Estaciones de subte`);
  console.log(`   🟡 /api/subtes/estado - Estado del servicio de subte`);
  console.log(`   🚆 /api/trenes/estaciones - Estaciones de tren`);
  console.log(`   🟡 /api/trenes/estado - Estado del servicio de trenes`);
  console.log(`   🚲 /api/ecobici/estaciones - Estaciones de Ecobici`);
});
