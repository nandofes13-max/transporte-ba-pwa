// js/app.js - Con orden corregido de funciones
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

    setupLayersSystem() {
        console.log('🔧 [LAYERS] Configurando sistema de capas...');
        
        // Inicializar grupos de capas
        Object.keys(this.layers).forEach(layerId => {
            this.layers[layerId].group = L.layerGroup().addTo(this.map);
        });
        
        // Cargar preferencias guardadas
        this.loadLayerPreferences();
        
        console.log('✅ [LAYERS] Sistema de capas configurado');
    }

    // ===== PREFERENCIAS - MOVIDA ARRIBA DE setupEventListeners =====
    saveLayerPreferences() {
        const preferences = {};
        Object.keys(this.layers).forEach(layerId => {
            preferences[layerId] = this.layers[layerId].active;
        });
        localStorage.setItem('transportLayers', JSON.stringify(preferences));
        console.log('💾 [PREF] Preferencias guardadas:', preferences);
    }

    loadLayerPreferences() {
        const saved = localStorage.getItem('transportLayers');
        if (saved) {
            const preferences = JSON.parse(saved);
            console.log('💾 [PREF] Preferencias cargadas:', preferences);
            
            Object.keys(preferences).forEach(layerId => {
                if (this.layers[layerId]) {
                    this.layers[layerId].active = preferences[layerId];
                    const checkbox = document.getElementById(`layer-${layerId}`);
                    if (checkbox) checkbox.checked = preferences[layerId];
                    
                    if (preferences[layerId]) {
                        console.log(`🔧 [PREF] Cargando capa guardada: ${layerId}`);
                        this.loadLayerData(layerId);
                    }
                }
            });
        } else {
            console.log('💾 [PREF] No hay preferencias guardadas');
        }
    }

    // ===== FUNCIÓN DE MENSAJES - MOVIDA ARRIBA =====
    showMessage(message, duration = 3000) {
        console.log(`💬 [MSG] ${message}`);
        
        let messageEl = document.getElementById('app-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'app-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, duration);
    }

    setupEventListeners() {
        console.log('🔍 [EVENTS] Configurando event listeners');
        
        // Botones principales - CON CORRECCIÓN DE NULL CHECKS
        const locateBtn = document.getElementById('locateBtn');
        const installBtn = document.getElementById('installBtn');
        
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                console.log('🖱️ [BTN] Botón ubicación clickeado');
                this.centerOnUserLocation();
            });
        } else {
            console.error('❌ [EVENTS] Botón locateBtn no encontrado');
        }

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                console.log('🖱️ [BTN] Botón instalar clickeado');
                this.installApp();
            });
        }

        // Sistema de capas
        const togglePanelBtn = document.getElementById('toggle-panel');
        const toggleLayersBtn = document.getElementById('toggle-layers');
        
        if (togglePanelBtn) {
            togglePanelBtn.addEventListener('click', () => {
                this.toggleLayersPanel();
            });
        }

        if (toggleLayersBtn) {
            toggleLayersBtn.addEventListener('click', () => {
                this.toggleLayersPanel();
            });
        }

        // Checkboxes de capas
        document.querySelectorAll('.layer-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layerId = e.target.dataset.layer;
                this.toggleLayer(layerId, e.target.checked);
            });
        });

        // Controles adicionales
        const refreshBtn = document.getElementById('refresh-data');
        const clearBtn = document.getElementById('clear-all');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAllLayers();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllLayers();
            });
        }
        
        console.log('✅ [EVENTS] Event listeners configurados');
    }

    // ===== FUNCIÓN DE UBICACIÓN =====
    async centerOnUserLocation() {
        console.log('🔍 [LOCATION] Obteniendo ubicación...');
        
        const locateBtn = document.getElementById('locateBtn');
        if (!locateBtn) {
            console.error('❌ [LOCATION] Botón locateBtn no encontrado');
            return;
        }
        
        // Guardar texto original
        const originalText = locateBtn.innerHTML;
        locateBtn.innerHTML = '📍 Obteniendo ubicación...';
        locateBtn.disabled = true;

        try {
            console.log('📍 [LOCATION] Solicitando permisos de geolocalización...');
            
            const position = await this.getCurrentPosition();
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log('📍 [LOCATION] GPS obtenido:', { latitude, longitude, accuracy });
            
            if (accuracy > 1000) {
                console.log('⚠️ [LOCATION] Precisión GPS pobre, usando fallback...');
                await this.useIPGeolocationFallback();
            } else {
                this.userLocation = { lat: latitude, lng: longitude };
                this.centerMapOnLocation(latitude, longitude, 15);
                console.log('✅ [LOCATION] Ubicación GPS centrada');
                this.showMessage(`📍 Ubicación encontrada (precisión: ${Math.round(accuracy)}m)`);
            }
            
        } catch (error) {
            console.error('❌ [LOCATION] Error GPS:', error);
            this.showMessage('❌ No se pudo obtener la ubicación GPS');
            
            try {
                console.log('🌐 [LOCATION] Intentando geolocalización por IP...');
                await this.useIPGeolocationFallback();
            } catch (ipError) {
                console.error('❌ [LOCATION] Error fallback IP:', ipError);
                this.handleLocationError(error);
            }
        } finally {
            // Restaurar botón
            locateBtn.innerHTML = originalText;
            locateBtn.disabled = false;
        }
    }

    async useIPGeolocationFallback() {
        console.log('🌐 [LOCATION] Usando geolocalización por IP...');
        
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('Error en API IP');
            
            const data = await response.json();
            console.log('📍 [LOCATION] IP geolocation:', data);
            
            if (data.latitude && data.longitude) {
                this.userLocation = { lat: data.latitude, lng: data.longitude };
                this.centerMapOnLocation(data.latitude, data.longitude, 12);
                console.log('✅ [LOCATION] Ubicación por IP centrada');
                this.showMessage('📍 Ubicación aproximada por IP');
            } else {
                throw new Error('No se pudo obtener ubicación por IP');
            }
        } catch (error) {
            console.log('🏙️ [LOCATION] Usando ubicación por defecto (Buenos Aires)');
            this.userLocation = { lat: -34.6037, lng: -58.3816 };
            this.centerMapOnLocation(-34.6037, -58.3816, 13);
            console.log('✅ [LOCATION] Ubicación por defecto centrada');
            this.showMessage('📍 Usando ubicación por defecto (Buenos Aires)');
        }
    }

    centerMapOnLocation(lat, lng, zoom = 15) {
        if (!this.map) {
            console.error('❌ [LOCATION] Mapa no inicializado');
            return;
        }
        
        this.map.setView([lat, lng], zoom);
        
        // Crear o actualizar marcador de ubicación
        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            this.userMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '📍',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            })
            .addTo(this.map)
            .bindPopup('📍 Tu ubicación actual')
            .openPopup();
        }
        
        console.log('✅ [LOCATION] Mapa centrado en:', { lat, lng, zoom });
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve, 
                reject, 
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // 15 segundos
                    maximumAge: 60000
                }
            );
        });
    }

    handleLocationError(error) {
        let message = 'Error desconocido al obtener la ubicación';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permiso de ubicación denegado. Permite el acceso a la ubicación para usar esta función.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Información de ubicación no disponible.';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado al obtener la ubicación.';
                break;
        }

        this.showMessage(`❌ Error de ubicación: ${message}`, 5000);
    }

    // ... (el resto de las funciones de capas y API van aquí)

    // ===== GESTIÓN DE CAPAS =====
    toggleLayersPanel() {
        const panel = document.getElementById('layers-panel');
        const toggleBtn = document.getElementById('toggle-layers');
        
        if (!panel || !toggleBtn) return;
        
        panel.classList.toggle('collapsed');
        
        if (panel.classList.contains('collapsed')) {
            toggleBtn.innerHTML = '▶';
        } else {
            toggleBtn.innerHTML = '◀';
        }
    }

    toggleLayer(layerId, isActive) {
        console.log(`🔧 [LAYER] ${isActive ? 'Activando' : 'Desactivando'} capa: ${layerId}`);
        
        this.layers[layerId].active = isActive;
        
        if (isActive) {
            this.loadLayerData(layerId);
        } else {
            this.clearLayer(layerId);
        }
        
        // Guardar preferencias
        this.saveLayerPreferences();
    }

    async loadLayerData(layerId) {
        console.log(`🚀 [API] Cargando datos para capa: ${layerId}`);
        
        try {
            switch (layerId) {
                case 'colectivos-realtime':
                    await this.loadColectivosRealtime();
                    break;
                case 'colectivos-paradas':
                    await this.loadColectivosParadas();
                    break;
                case 'subtes-estaciones':
                    await this.loadSubtesEstaciones();
                    break;
                case 'subtes-realtime':
                    await this.loadSubtesRealtime();
                    break;
                case 'trenes-estaciones':
                    await this.loadTrenesEstaciones();
                    break;
                case 'ecobici-estaciones':
                    await this.loadEcobiciEstaciones();
                    break;
                default:
                    console.warn(`⚠️ [LAYER] Capa desconocida: ${layerId}`);
            }
            
            console.log(`✅ [LAYER] Carga completada para: ${layerId}`);
            
        } catch (error) {
            console.error(`❌ [LAYER] Error cargando capa ${layerId}:`, error);
            this.showMessage(`❌ API falló - ${this.getLayerName(layerId)} no disponible`, 5000);
            
            // Desactivar la capa automáticamente
            this.layers[layerId].active = false;
            const checkbox = document.getElementById(`layer-${layerId}`);
            if (checkbox) checkbox.checked = false;
            this.saveLayerPreferences();
        }
    }

    clearLayer(layerId) {
        if (this.layers[layerId].group) {
            this.layers[layerId].group.clearLayers();
            console.log(`🗑️ [LAYER] Capa ${layerId} limpiada`);
        }
    }

    async refreshAllLayers() {
        console.log('🔄 [LAYERS] Actualizando todas las capas activas...');
        
        for (const [layerId, layer] of Object.entries(this.layers)) {
            if (layer.active) {
                console.log(`🔄 [LAYERS] Actualizando capa: ${layerId}`);
                await this.loadLayerData(layerId);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        console.log('✅ [LAYERS] Todas las capas actualizadas');
    }

    clearAllLayers() {
        console.log('🗑️ [LAYERS] Limpiando todas las capas...');
        
        Object.keys(this.layers).forEach(layerId => {
            this.clearLayer(layerId);
            const checkbox = document.getElementById(`layer-${layerId}`);
            if (checkbox) checkbox.checked = false;
            this.layers[layerId].active = false;
        });
        
        this.saveLayerPreferences();
        console.log('✅ [LAYERS] Todas las capas limpiadas');
    }

    // ===== FUNCIONES AUXILIARES =====
    getLayerName(layerId) {
        const names = {
            'colectivos-realtime': 'Colectivos en tiempo real',
            'colectivos-paradas': 'Paradas de colectivos',
            'subtes-estaciones': 'Estaciones de subte',
            'subtes-realtime': 'Subtes en tiempo real',
            'trenes-estaciones': 'Estaciones de tren',
            'ecobici-estaciones': 'Estaciones de Ecobici'
        };
        return names[layerId] || layerId;
    }

    // ===== FUNCIONES EXISTENTES (mantenidas) =====
    async installApp() {
        console.log('🔍 [INSTALL] Iniciando proceso de instalación');
        
        if (this.deferredPrompt) {
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ [INSTALL] Usuario aceptó instalar la PWA');
                    this.hideInstallButton();
                    return;
                }
            } catch (error) {
                console.error('❌ [INSTALL] Error en instalación automática:', error);
            }
            
            this.deferredPrompt = null;
        }
        
        this.showInstallInstructions();
        this.hideInstallButton();
    }

    showInstallInstructions() {
        alert('Para una mejor experiencia utilice el navegador Google Chrome');
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.remove('visible');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });

        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 [PWA] App instalada en el dispositivo');
            this.hideInstallButton();
        });
    }

    showInstallButtonIfNeeded() {
        const installBtn = document.getElementById('installBtn');
        if (!installBtn) return;
        
        const shouldShow = !this.isAppInstalled() && !this.isDesktop();
        
        if (shouldShow) {
            installBtn.classList.add('visible');
        } else {
            installBtn.classList.remove('visible');
        }
    }

    isAppInstalled() {
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
        if (window.navigator.standalone) return true;
        if (document.referrer.includes('android-app://')) return true;
        return false;
    }

    isDesktop() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
        return !isMobile && !isTablet;
    }

    loadApp() {
        console.log('🔍 [LOAD] Cargando aplicación...');
        this.showInstallButtonIfNeeded();
        console.log('🔍 [LOAD] App cargada completamente');
    }
}

// Inicializar la app cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 [DOM] DOM completamente cargado');
    console.log('🔍 [LEAFLET] Leaflet disponible:', typeof L !== 'undefined');
    window.app = new TransporteApp();
});

window.addEventListener('load', () => {
    console.log('🔄 [WINDOW] Ventana completamente cargada');
});
