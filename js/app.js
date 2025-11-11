// js/app.js - Con inicialización mejorada del mapa
class TransporteApp {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.userLocation = null;
        this.deferredPrompt = null;
        
        // Configuración del backend
        this.API_BASE_URL = window.location.origin;
        
        // Sistema de capas
        this.layers = {
            'colectivos-realtime': { group: null, active: false, type: 'realtime' },
            'colectivos-paradas': { group: null, active: false, type: 'static' },
            'subtes-estaciones': { group: null, active: false, type: 'static' },
            'subtes-realtime': { group: null, active: false, type: 'realtime' },
            'trenes-estaciones': { group: null, active: false, type: 'static' },
            'ecobici-estaciones': { group: null, active: false, type: 'static' }
        };
        
        this.init();
    }

    async init() {
        console.log('🔍 [INIT] App iniciada');
        console.log('🔍 [INIT] Leaflet disponible:', typeof L !== 'undefined');
        
        // Inicializar el mapa inmediatamente
        this.initMap();
        
        // Luego el resto de la inicialización
        this.setupInstallPrompt();
        
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('✅ [SW] Service Worker registrado');
            } catch (error) {
                console.log('❌ [SW] Error registrando SW:', error);
            }
        }

        this.loadApp();
    }

    initMap() {
        console.log('🔍 [MAP] Inicializando mapa...');
        
        // Verificar que Leaflet esté cargado
        if (typeof L === 'undefined') {
            console.error('❌ [MAP] Leaflet no está cargado');
            this.showMessage('Error: El mapa no pudo cargarse. Recarga la página.', 10000);
            return;
        }
        
        try {
            // Crear el mapa con configuración básica
            this.map = L.map('map', {
                center: [-34.6037, -58.3816],
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            });

            // Añadir capa base de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            console.log('✅ [MAP] Mapa inicializado correctamente');
            
            // Configurar sistema de capas después de que el mapa esté listo
            this.setupLayersSystem();
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ [MAP] Error inicializando mapa:', error);
            this.showMessage('Error cargando el mapa: ' + error.message, 10000);
        }
    }

    // ... (el resto del código se mantiene igual hasta la función loadApp)

    loadApp() {
        console.log('🔍 [LOAD] Cargando aplicación...');
        this.showInstallButtonIfNeeded();
        console.log('🔍 [LOAD] App cargada completamente');
    }

    // ... (el resto del código se mantiene igual)
}

// Inicializar la app cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 [DOM] DOM completamente cargado');
    console.log('🔍 [LEAFLET] Leaflet disponible:', typeof L !== 'undefined');
    window.app = new TransporteApp();
});

// También verificar cuando la ventana se carga completamente
window.addEventListener('load', () => {
    console.log('🔄 [WINDOW] Ventana completamente cargada');
});
