// server.js - Backend para la API de Transporte BA
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 🆕 MIDDLEWARE PARA CONTROL DE CACHE
app.use((req, res, next) => {
  // Headers para evitar cache en archivos críticos
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    message: '🚍 Backend Transporte BA funcionando',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
});

// Ruta para paradas cercanas
app.get('/api/paradas-cercanas', async (req, res) => {
  try {
    const { lat, lng, radio = 1 } = req.query;
    
    console.log('📍 Buscando paradas cercanas:', { lat, lng, radio });
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Se requieren lat y lng' });
    }

    // SIMULACIÓN - Reemplazar con API real cuando tengas credenciales
    const paradasSimuladas = [
      {
        id: '1',
        linea: '152',
        direccion: 'Av. Corrientes y Av. Pueyrredón',
        distancia: '250m',
        coordenadas: { lat: -34.6037, lng: -58.3816 }
      },
      {
        id: '2', 
        linea: '29',
        direccion: 'Av. Santa Fe y Av. Pueyrredón', 
        distancia: '400m',
        coordenadas: { lat: -34.5880, lng: -58.4104 }
      },
      {
        id: '3',
        linea: '59',
        direccion: 'Av. Córdoba y Florida',
        distancia: '600m', 
        coordenadas: { lat: -34.5955, lng: -58.3737 }
      }
    ];

    res.json({
      ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radio: parseInt(radio),
      paradas: paradasSimuladas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en /api/paradas-cercanas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para tiempos de llegada
app.get('/api/tiempos-llegada/:paradaId', async (req, res) => {
  try {
    const { paradaId } = req.params;
    
    console.log('⏱️ Solicitando tiempos para parada:', paradaId);
    
    // Simulación de tiempos de llegada
    const tiemposSimulados = [
      { 
        linea: '152', 
        tiempo: '5 min', 
        distancia: '2.3 km',
        vehiculo: 'ABC123'
      },
      { 
        linea: '152', 
        tiempo: '12 min', 
        distancia: '5.1 km',
        vehiculo: 'DEF456'
      },
      { 
        linea: '29', 
        tiempo: '8 min', 
        distancia: '3.7 km',
        vehiculo: 'GHI789'
      }
    ];

    res.json({
      paradaId,
      tiempos: tiemposSimulados,
      actualizado: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en /api/tiempos-llegada:', error);
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
});
