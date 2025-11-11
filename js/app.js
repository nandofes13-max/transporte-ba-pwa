// js/app.js - Con sistema de capas usando BACKEND PROPIO
class TransporteApp {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.userLocation = null;
        this.deferredPrompt = null;
        
        // Configuración del backend
        this.API_BASE_URL = window.location.origin; // Usa el mismo dominio
        
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
        console.log('🔍 [INIT] Service Worker support:', 'serviceWorker' in navigator);
        console.log('🔍 [INIT] App instalada:', this.isAppInstalled());
        console.log('🔍 [INIT] Es desktop:', this.isDesktop());
        console.log('🔍 [BACKEND] URL base:', this.API_BASE_URL);
        
        // Configurar eventos de instalación PWA
        this.setupInstallPrompt();
        
        // Verificar Service Worker
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('✅ [SW] Service Worker registrado');
            } catch (error) {
                console.log('❌ [SW] Error registrando SW:', error);
            }
        }

        // Inicializar la aplicación
        this.loadApp();
    }

    // FUNCIÓN PARA DETECTAR SI ES DESKTOP
    isDesktop() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
        
        console.log('🔍 [DEVICE] Mobile:', isMobile, 'Tablet:', isTablet, 'Desktop:', !isMobile && !isTablet);
        return !isMobile && !isTablet;
    }

    // FUNCIÓN PARA DETECTAR SI LA APP ESTÁ INSTALADA
    isAppInstalled() {
        // Método 1: Verificar display-mode (estándar PWA)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 [DETECT] App detectada por display-mode: standalone');
            return true;
        }
        
        // Método 2: iOS Safari
        if (window.navigator.standalone) {
            console.log('📱 [DETECT] App detectada por navigator.standalone');
            return true;
        }
        
        // Método 3: Android Chrome
        if (document.referrer.includes('android-app://')) {
            console.log('📱 [DETECT] App detectada por referrer android');
            return true;
        }
        
        return false;
    }

    setupInstallPrompt() {
        console.log('🔍 [SETUP] Configurando eventos de instalación');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('🎯 [PWA] Evento beforeinstallprompt DISPARADO');
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('🔍 [PWA] deferredPrompt guardado:', !!this.deferredPrompt);
        });

        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 [PWA] App instalada en el dispositivo');
            this.hideInstallButton();
        });
    }

    loadApp() {
        console.log('🔍 [LOAD] Cargando aplicación con mapa...');
        
        // EL BOTÓN ESTÁ OCULTO POR CSS - SOLO SE MUESTRA SI ES NECESARIO
        this.showInstallButtonIfNeeded();
        
        // Inicializar el mapa inmediatamente
        this.initMap();
        
        // Configurar sistema de capas
        this.setupLayersSystem();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('🔍 [LOAD] App cargada completamente');
    }

    // FUNCIÓN PARA MOSTRAR BOTÓN SOLO SI ES NECESARIO
    showInstallButtonIfNeeded() {
        const installBtn = document.getElementById('installBtn');
        if (!installBtn) return;
        
        // 🆕 MOSTRAR EN MÓVILES AUNQUE NO SEA CHROME
        const shouldShow = !this.isAppInstalled() && !this.isDesktop();
        
        console.log('🔍 [SHOW-BTN] Mostrar botón?:', shouldShow, 
                   'Instalada:', this.isAppInstalled(), 
                   'Desktop:', this.isDesktop());
        
        if (shouldShow) {
            installBtn.classList.add('visible');
            console.log('✅ [SHOW-BTN] Botón mostrado');
        } else {
            installBtn.classList.remove('visible');
            console.log('🚫 [SHOW-BTN] Botón ocultado');
        }
    }

    initMap() {
        console.log('🔍 [MAP] Inicializando mapa...');
        this.map = L.map('map').setView([-34.6037, -58.3816], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        console.log('✅ [MAP] Mapa inicializado');
    }

    // ===== SISTEMA DE CAPAS =====
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

    setupEventListeners() {
        console.log('🔍 [EVENTS] Configurando event listeners');
        
        // Botones principales
        document.getElementById('locateBtn').addEventListener('click', () => {
            console.log('🖱️ [BTN] Botón ubicación clickeado');
            this.centerOnUserLocation();
        });

        document.getElementById('installBtn').addEventListener('click', () => {
            console.log('🖱️ [BTN] Botón instalar clickeado');
            this.installApp();
        });

        // Sistema de capas
        document.getElementById('toggle-panel').addEventListener('click', () => {
            this.toggleLayersPanel();
        });

        document.getElementById('toggle-layers').addEventListener('click', () => {
            this.toggleLayersPanel();
        });

        // Checkboxes de capas
        document.querySelectorAll('.layer-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layerId = e.target.dataset.layer;
                this.toggleLayer(layerId, e.target.checked);
            });
        });

        // Controles adicionales
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.refreshAllLayers();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllLayers();
        });
        
        console.log('✅ [EVENTS] Event listeners configurados');
    }

    // ===== GESTIÓN DE CAPAS =====
    toggleLayersPanel() {
        const panel = document.getElementById('layers-panel');
        const toggleBtn = document.getElementById('toggle-layers');
        
        panel.classList.toggle('collapsed');
        
        if (panel.classList.contains('collapsed')) {
            toggleBtn.innerHTML = '▶';
        } else {
            toggleBtn.innerHTML = '◀';
        }
    }

    toggleLayer(layerId, isActive) {
        console.log(`🔧 [LAYER] ${isActive ? 'Activando' : 'Desactivando'} capa: ${layerId}`);
        console.log(`🔧 [LAYER] Estado actual:`, this.layers[layerId]);
        
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
        console.log(`🔧 [LAYER] Estado de la capa:`, this.layers[layerId]);
        
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
            // Mostrar mensaje de error específico
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
                // Pequeña pausa entre requests para no saturar
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        console.log('✅ [LAYERS] Todas las capas actualizadas');
    }

    clearAllLayers() {
        console.log('🗑️ [LAYERS] Limpiando todas las capas...');
        
        Object.keys(this.layers).forEach(layerId => {
            this.clearLayer(layerId);
            // Desmarcar checkboxes
            const checkbox = document.getElementById(`layer-${layerId}`);
            if (checkbox) checkbox.checked = false;
            this.layers[layerId].active = false;
        });
        
        this.saveLayerPreferences();
        console.log('✅ [LAYERS] Todas las capas limpiadas');
    }

    // ===== API CALLS - BACKEND PROPIO =====
    async makeBackendRequest(endpoint, params = {}) {
        const url = new URL(`${this.API_BASE_URL}${endpoint}`);
        
        // Agregar parámetros a la URL
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        console.log(`🌐 [BACKEND] Haciendo request a: ${endpoint}`);
        console.log(`🔗 [BACKEND] URL completa: ${url.toString()}`);
        
        try {
            const response = await fetch(url.toString());
            console.log(`📡 [BACKEND] Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Error desconocido del backend');
            }
            
            console.log(`✅ [BACKEND] Datos recibidos:`, result.data);
            console.log(`📊 [BACKEND] Tipo de datos: ${typeof result.data}, Es array: ${Array.isArray(result.data)}`);
            
            if (Array.isArray(result.data)) {
                console.log(`🔢 [BACKEND] Cantidad de elementos: ${result.data.length}`);
            }
            
            return result.data;
            
        } catch (error) {
            console.error(`❌ [BACKEND] Error en request:`, error);
            throw new Error('API falló');
        }
    }

    async loadColectivosRealtime() {
        console.log('🚍 [COLECTIVOS] Cargando colectivos en tiempo real...');
        
        // Usar la ubicación actual para filtrar si está disponible
        const params = {};
        if (this.userLocation) {
            params.lat = this.userLocation.lat;
            params.lng = this.userLocation.lng;
            params.radio = 3; // 3km de radio
        }
        
        const data = await this.makeBackendRequest('/api/colectivos/posiciones', params);
        const layer = this.layers['colectivos-realtime'].group;
        
        layer.clearLayers();
        
        console.log(`📍 [COLECTIVOS] ${data.length} colectivos recibidos`);
        
        // Filtrar por vista actual del mapa para performance
        const bounds = this.map.getBounds();
        const colectivosCercanos = data.filter(colectivo => 
            bounds.contains([colectivo.latitude, colectivo.longitude])
        ).slice(0, 50);
        
        console.log(`📍 [COLECTIVOS] ${colectivosCercanos.length} colectivos en vista actual`);
        
        colectivosCercanos.forEach(colectivo => {
            const enMovimiento = colectivo.speed > 5;
            
            L.marker([colectivo.latitude, colectivo.longitude], {
                icon: L.divIcon({
                    className: `colectivo-marker ${enMovimiento ? 'en-movimiento' : ''}`,
                    html: '🚍',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            })
            .addTo(layer)
            .bindPopup(`
                <div class="popup-colectivo">
                    <strong>🚍 Línea ${colectivo.route_short_name}</strong><br>
                    <em>${colectivo.trip_headsign}</em><br>
                    <strong>Velocidad:</strong> ${colectivo.speed ? Math.round(colectivo.speed) + ' km/h' : 'Detenido'}<br>
                    <strong>Estado:</strong> ${enMovimiento ? '🟢 En movimiento' : '🟡 Detenido'}
                </div>
            `);
        });
        
        console.log(`✅ [COLECTIVOS] ${colectivosCercanos.length} colectivos mostrados`);
        this.showMessage(`${colectivosCercanos.length} colectivos mostrados en el mapa`);
    }

    async loadColectivosParadas() {
        console.log('📍 [PARADAS] Cargando paradas de colectivos...');
        
        const data = await this.makeBackendRequest('/api/colectivos/paradas');
        const layer = this.layers['colectivos-paradas'].group;
        
        layer.clearLayers();
        
        console.log(`📍 [PARADAS] ${data.length} paradas recibidas`);
        
        if (data && data.length > 0) {
            // Procesar paradas reales
            data.forEach(parada => {
                const lat = parada.lat || parada.latitude;
                const lng = parada.lon || parada.longitude;
                const nombre = parada.nombre || parada.name || 'Parada de Colectivo';
                const linea = parada.linea || parada.route_short_name || '';
                
                if (lat && lng) {
                    L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'parada-marker',
                            html: '📍',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    })
                    .addTo(layer)
                    .bindPopup(`
                        <strong>📍 ${nombre}</strong><br>
                        ${linea ? `<em>Línea ${linea}</em><br>` : ''}
                        <small>Parada de colectivo</small>
                    `);
                }
            });
            
            console.log(`✅ [PARADAS] ${data.length} paradas mostradas`);
            this.showMessage(`${data.length} paradas de colectivos mostradas`);
        } else {
            console.log('📍 [PARADAS] No hay datos de paradas disponibles');
            this.showMessage('No hay datos de paradas disponibles en este momento');
        }
    }

    async loadSubtesEstaciones() {
        console.log('🚇 [SUBTES] Cargando estaciones de subte...');
        
        const data = await this.makeBackendRequest('/api/subtes/estaciones');
        const layer = this.layers['subtes-estaciones'].group;
        
        layer.clearLayers();
        
        console.log(`🚇 [SUBTES] ${data.length} estaciones recibidas`);
        
        data.forEach(estacion => {
            // Adaptar a diferentes estructuras de datos del backend
            const lat = estacion.lat || estacion.latitude;
            const lng = estacion.lon || estacion.lng || estacion.longitude;
            const nombre = estacion.nombre || estacion.name || 'Estación de Subte';
            const linea = estacion.linea || estacion.line || 'A';
            
            if (lat && lng) {
                L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'subte-marker',
                        html: '🚇',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                })
                .addTo(layer)
                .bindPopup(`
                    <strong>🚇 ${nombre}</strong><br>
                    <em>Línea ${linea}</em>
                `);
            }
        });
        
        console.log(`✅ [SUBTES] ${data.length} estaciones de subte mostradas`);
        this.showMessage(`${data.length} estaciones de subte mostradas`);
    }

    async loadSubtesRealtime() {
        console.log('🚇 [SUBTE-RT] Cargando subtes en tiempo real...');
        this.showMessage('Subtes en tiempo real - disponible pronto');
        console.log('🚇 [SUBTE-RT] Función de subtes tiempo real pendiente');
    }

    async loadTrenesEstaciones() {
        console.log('🚆 [TRENES] Cargando estaciones de tren...');
        
        const data = await this.makeBackendRequest('/api/trenes/estaciones');
        const layer = this.layers['trenes-estaciones'].group;
        
        layer.clearLayers();
        
        console.log(`🚆 [TRENES] ${data.length} estaciones recibidas`);
        
        data.forEach(estacion => {
            const lat = estacion.lat || estacion.latitude;
            const lng = estacion.lon || estacion.longitude;
            const nombre = estacion.nombre || estacion.name || 'Estación de Tren';
            const linea = estacion.linea || estacion.line || 'General';
            
            if (lat && lng) {
                L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'tren-marker',
                        html: '🚆',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                })
                .addTo(layer)
                .bindPopup(`
                    <strong>🚆 ${nombre}</strong><br>
                    <em>Línea ${linea}</em>
                `);
            }
        });
        
        console.log(`✅ [TRENES] ${data.length} estaciones de tren mostradas`);
        this.showMessage(`${data.length} estaciones de tren mostradas`);
    }

    async loadEcobiciEstaciones() {
        console.log('🚲 [ECOBICI] Cargando estaciones de Ecobici...');
        
        const data = await this.makeBackendRequest('/api/ecobici/estaciones');
        const layer = this.layers['ecobici-estaciones'].group;
        
        layer.clearLayers();
        
        console.log(`🚲 [ECOBICI] ${data.length} estaciones recibidas`);
        
        data.forEach(estacion => {
            const lat = estacion.lat || estacion.latitude;
            const lng = estacion.lon || estacion.longitude;
            const nombre = estacion.nombre || estacion.name || 'Estación Ecobici';
            
            if (lat && lng) {
                L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'ecobici-marker',
                        html: '🚲',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                })
                .addTo(layer)
                .bindPopup(`
                    <strong>🚲 ${nombre}</strong><br>
                    <em>Ecobici Station</em>
                `);
            }
        });
        
        console.log(`✅ [ECOBICI] ${data.length} estaciones de bicicleta mostradas`);
        this.showMessage(`${data.length} estaciones de Ecobici mostradas`);
    }

    // ===== PREFERENCIAS =====
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

    // ===== FUNCIÓN DE MENSAJES =====
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
        console.log('🔍 [INSTALL] deferredPrompt disponible:', !!this.deferredPrompt);
        
        if (this.deferredPrompt) {
            console.log('🚀 [INSTALL] Intentando instalación automática...');
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log('📋 [INSTALL] Resultado instalación:', outcome);
                
                if (outcome === 'accepted') {
                    console.log('✅ [INSTALL] Usuario aceptó instalar la PWA');
                    this.hideInstallButton();
                    return;
                } else {
                    console.log('❌ [INSTALL] Usuario rechazó instalar la PWA');
                }
                
            } catch (error) {
                console.error('❌ [INSTALL] Error en instalación automática:', error);
            }
            
            this.deferredPrompt = null;
            console.log('🔍 [INSTALL] deferredPrompt limpiado');
        }
        
        console.log('🔍 [INSTALL] Mostrando instrucciones de instalación manual...');
        this.showInstallInstructions();
        console.log('🔍 [INSTALL] Ocultando botón...');
        this.hideInstallButton();
    }

    showInstallInstructions() {
        alert('Para una mejor experiencia utilice el navegador Google Chrome');
    }

    hideInstallButton() {
        console.log('🔍 [HIDE] Intentando ocultar botón de instalación');
        const installBtn = document.getElementById('installBtn');
        console.log('🔍 [HIDE] Botón encontrado:', !!installBtn);
        
        if (installBtn) {
            installBtn.classList.remove('visible');
            console.log('✅ [HIDE] Botón ocultado via CSS class');
        } else {
            console.log('❌ [HIDE] No se encontró el botón installBtn');
        }
    }

    async centerOnUserLocation() {
        console.log('🔍 [LOCATION] Obteniendo ubicación...');
        const locateBtn = document.getElementById('locateBtn');
        locateBtn.innerHTML = '📍 Obteniendo ubicación...';
        locateBtn.disabled = true;

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log('📍 [LOCATION] GPS obtenido:', latitude, longitude, 'Precisión:', accuracy, 'm');
            
            if (accuracy > 1000) {
                console.log('⚠️ [LOCATION] Precisión GPS pobre, usando fallback...');
                await this.useIPGeolocationFallback();
            } else {
                this.userLocation = { lat: latitude, lng: longitude };
                this.centerMapOnLocation(latitude, longitude);
                console.log('✅ [LOCATION] Ubicación GPS centrada');
            }
            
        } catch (error) {
            console.error('❌ [LOCATION] Error GPS:', error);
            
            try {
                await this.useIPGeolocationFallback();
            } catch (ipError) {
                console.error('❌ [LOCATION] Error fallback IP:', ipError);
                this.handleLocationError(error);
            }
        } finally {
            locateBtn.innerHTML = '📍 Centrar en mi ubicación';
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
                this.centerMapOnLocation(data.latitude, data.longitude);
                console.log('✅ [LOCATION] Ubicación por IP centrada');
            } else {
                throw new Error('No se pudo obtener ubicación por IP');
            }
        } catch (error) {
            console.log('🏙️ [LOCATION] Usando ubicación por defecto (Buenos Aires)');
            this.userLocation = { lat: -34.6037, lng: -58.3816 };
            this.centerMapOnLocation(-34.6037, -58.3816);
            console.log('✅ [LOCATION] Ubicación por defecto centrada');
        }
    }

    centerMapOnLocation(lat, lng) {
        this.map.setView([lat, lng], 15);
        
        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            this.userMarker = L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup('📍 Tu ubicación actual')
                .openPopup();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    handleLocationError(error) {
        let message = 'Error desconocido al obtener la ubicación';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permiso de ubicación denegado. Permite el acceso a la ubicación para usar el mapa.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Información de ubicación no disponible.';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado al obtener la ubicación.';
                break;
        }

        alert(`❌ Error de ubicación: ${message}`);
    }
}

// Inicializar la app cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 [DOM] DOM completamente cargado');
    window.app = new TransporteApp();
});

console.log('🧩 [SCRIPT] app.js cargado (antes de DOMContentLoaded)');
