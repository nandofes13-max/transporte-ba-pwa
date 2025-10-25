// js/app.js - Versión simplificada sin búsqueda de transporte
class TransporteApp {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.userLocation = null;
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        console.log('🚍 App iniciada');
        
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

    async installApp() {
        if (this.deferredPrompt) {
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ Usuario aceptó instalar la PWA');
                    this.hideInstallButton();
                    return;
                } else {
                    console.log('❌ Usuario rechazó instalar la PWA');
                }
                
            } catch (error) {
                console.error('❌ Error en instalación:', error);
            }
            
            this.deferredPrompt = null;
        }
        
        // Si llegamos aquí, la instalación automática falló
        this.showChromeMessage();
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.style.display = 'none';
    }

    showChromeMessage() {
        alert('📱 Por favor utiliza Google Chrome para una mejor experiencia y instalación de la aplicación.');
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
