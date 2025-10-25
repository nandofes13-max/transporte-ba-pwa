// js/app.js - Frontend con mapa OpenStreetMap
class TransporteApp {
    constructor() {
        this.backendURL = 'https://transporte-ba-pwa.onrender.com';
        this.map = null;
        this.userMarker = null;
        this.userLocation = null;
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        console.log('🚍 Transporte BA PWA iniciada');
        
        // Configurar eventos de instalación PWA
        this.setupInstallPrompt();
        
        // Verificar Service Worker
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado');
            } catch (error) {
                console.log('❌ Error registrando SW:', error);
            }
        }

        // Inicializar la aplicación
        this.loadApp();
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('🎯 PWA lista para instalación');
            e.preventDefault();
            this.deferredPrompt = e;
        });

        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 PWA instalada en el dispositivo');
            this.hideInstallButton();
        });
    }

    loadApp() {
        console.log('🗺️ Cargando aplicación con mapa...');
        
        // Inicializar el mapa inmediatamente
        this.initMap();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Obtener y centrar en la ubicación del usuario
        this.centerOnUserLocation();
    }

    initMap() {
        // Inicializar el mapa de OpenStreetMap
        this.map = L.map('map').setView([-34.6037, -58.3816], 13); // Buenos Aires por defecto

        // Capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        console.log('🗺️ Mapa inicializado');
    }

    setupEventListeners() {
        // Botón de centrar en ubicación
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.centerOnUserLocation();
        });

        // Botón de buscar transporte
        document.getElementById('transportBtn').addEventListener('click', () => {
            this.showTransportSearch();
        });

        // Botón de instalar app
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installApp();
        });
    }

    async centerOnUserLocation() {
        const locateBtn = document.getElementById('locateBtn');
        locateBtn.innerHTML = '📍 Obteniendo ubicación...';
        locateBtn.disabled = true;

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            console.log('📍 Ubicación obtenida:', latitude, longitude);
            this.userLocation = { lat: latitude, lng: longitude };
            
            // Centrar mapa en la ubicación del usuario
            this.map.setView([latitude, longitude], 15);
            
            // Agregar o actualizar marcador
            if (this.userMarker) {
                this.userMarker.setLatLng([latitude, longitude]);
            } else {
                this.userMarker = L.marker([latitude, longitude])
                    .addTo(this.map)
                    .bindPopup('📍 Tu ubicación actual')
                    .openPopup();
            }
            
            locateBtn.innerHTML = '📍 Centrar en mi ubicación';
            locateBtn.disabled = false;
            
        } catch (error) {
            console.error('❌ Error obteniendo ubicación:', error);
            this.handleLocationError(error);
            
            locateBtn.innerHTML = '📍 Centrar en mi ubicación';
            locateBtn.disabled = false;
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
                timeout: 15000,
                maximumAge: 60000
            });
        });
    }

    showTransportSearch() {
        if (!this.userLocation) {
            alert('Primero necesitamos obtener tu ubicación para buscar transporte cercano.');
            this.centerOnUserLocation();
            return;
        }

        // Ocultar mapa y mostrar interfaz de transporte
        document.getElementById('map-container').classList.add('hidden');
        document.getElementById('transport-container').classList.remove('hidden');
        
        // Cargar la interfaz de transporte
        this.loadTransportInterface();
    }

    loadTransportInterface() {
        const transportContainer = document.getElementById('transport-container');
        transportContainer.innerHTML = `
            <div class="transport-header">
                <button onclick="app.showMap()" class="btn-back">←</button>
                <h2>🚍 Buscar Transporte</h2>
            </div>
            
            <div class="main-content">
                <button onclick="app.buscarTransporteCercano()" class="btn-primary">
                    🔍 Buscar transporte cercano
                </button>
                <div id="transport-results" class="results"></div>
            </div>
        `;
    }

    showMap() {
        // Volver al mapa
        document.getElementById('transport-container').classList.add('hidden');
        document.getElementById('map-container').classList.remove('hidden');
    }

    async buscarTransporteCercano() {
        if (!this.userLocation) {
            alert('No tenemos tu ubicación. Centrando en tu ubicación...');
            await this.centerOnUserLocation();
            return;
        }

        const results = document.getElementById('transport-results');
        results.innerHTML = '<div class="loading">🔍 Buscando transporte cercano...</div>';

        try {
            const response = await fetch(
                `${this.backendURL}/api/paradas-cercanas?lat=${this.userLocation.lat}&lng=${this.userLocation.lng}&radio=1`
            );

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const data = await response.json();
            this.mostrarResultadosTransporte(data);
            
        } catch (error) {
            console.error('❌ Error buscando transporte:', error);
            results.innerHTML = `
                <div class="error">
                    <h3>❌ Error de conexión</h3>
                    <p>No se pudieron cargar las paradas. Intenta nuevamente.</p>
                    <button onclick="app.buscarTransporteCercano()" class="btn-primary">Reintentar</button>
                </div>
            `;
        }
    }

    mostrarResultadosTransporte(data) {
        const results = document.getElementById('transport-results');
        
        if (!data.paradas || data.paradas.length === 0) {
            results.innerHTML = `
                <div class="no-results">
                    <h3>🔍 No se encontraron paradas</h3>
                    <p>Intenta en otra ubicación o aumenta el radio de búsqueda.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="ubicacion-info">
                <h3>📍 Tu ubicación</h3>
                <p>Lat: ${data.ubicacion.lat.toFixed(4)}, Lng: ${data.ubicacion.lng.toFixed(4)}</p>
                <p>Radio: ${data.radio} km</p>
            </div>
            <div class="paradas-list">
                <h3>🚍 Paradas cercanas</h3>
        `;

        data.paradas.forEach(parada => {
            html += `
                <div class="parada-item">
                    <div class="parada-linea">Línea ${parada.linea}</div>
                    <div class="parada-direccion">${parada.direccion}</div>
                    <div class="parada-distancia">${parada.distancia}</div>
                    <button onclick="app.verTiemposLlegada('${parada.id}')" class="btn-tiempos">
                        Ver tiempos de llegada
                    </button>
                </div>
            `;
        });

        html += `</div>`;
        results.innerHTML = html;
    }

    async verTiemposLlegada(paradaId) {
        const results = document.getElementById('transport-results');
        results.innerHTML = '<div class="loading">⏱️ Consultando tiempos de llegada...</div>';

        try {
            const response = await fetch(
                `${this.backendURL}/api/tiempos-llegada/${paradaId}`
            );

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const data = await response.json();
            this.mostrarTiemposLlegada(data);
            
        } catch (error) {
            console.error('❌ Error obteniendo tiempos:', error);
            results.innerHTML = `
                <div class="error">
                    <h3>❌ Error de conexión</h3>
                    <p>No se pudieron cargar los tiempos de llegada.</p>
                    <button onclick="app.verTiemposLlegada('${paradaId}')" class="btn-primary">Reintentar</button>
                </div>
            `;
        }
    }

    mostrarTiemposLlegada(data) {
        let html = `
            <div class="tiempos-header">
                <button onclick="app.buscarTransporteCercano()" class="btn-back">← Volver</button>
                <h3>⏱️ Tiempos de llegada</h3>
                <p>Parada: ${data.paradaId}</p>
            </div>
            <div class="tiempos-list">
        `;

        data.tiempos.forEach(tiempo => {
            html += `
                <div class="tiempo-item">
                    <div class="tiempo-linea">Línea ${tiempo.linea}</div>
                    <div class="tiempo-estimado">${tiempo.tiempo}</div>
                    <div class="tiempo-distancia">${tiempo.distancia}</div>
                    <div class="tiempo-vehiculo">${tiempo.vehiculo}</div>
                </div>
            `;
        });

        html += `</div>`;
        document.getElementById('transport-results').innerHTML = html;
    }

    async installApp() {
        if (this.deferredPrompt) {
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ Usuario aceptó instalar la PWA');
                    this.hideInstallButton();
                } else {
                    console.log('❌ Usuario rechazó instalar la PWA');
                }
                
                this.deferredPrompt = null;
            } catch (error) {
                console.error('❌ Error en instalación:', error);
                this.showInstallInstructions();
            }
        } else {
            this.showInstallInstructions();
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.style.display = 'none';
    }

    showInstallInstructions() {
        alert(`📱 Para instalar la App:

Chrome/Edge en Android:
1. Menú (⋮) → "Agregar a pantalla de inicio"
2. Confirmar "Agregar"

Safari en iPhone:
1. Botón compartir (📤) → "Agregar a inicio"
2. Click "Agregar" en la esquina superior derecha`);
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
    window.app = new TransporteApp();
});
