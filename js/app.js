// js/app.js - Con detección de app instalada
class TransporteApp {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.userLocation = null;
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        console.log('🔍 [INIT] App iniciada');
        console.log('🔍 [INIT] Service Worker support:', 'serviceWorker' in navigator);
        console.log('🔍 [INIT] App instalada:', this.isAppInstalled());
        
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

    // 🆕 FUNCIÓN PARA DETECTAR SI LA APP ESTÁ INSTALADA
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
        
        // 🆕 VERIFICAR SI LA APP YA ESTÁ INSTALADA
        if (this.isAppInstalled()) {
            console.log('📱 [APP] La app ya está instalada - ocultando botón de instalación');
            this.hideInstallButton();
        }
        
        // Inicializar el mapa inmediatamente
        this.initMap();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('🔍 [LOAD] App cargada completamente');
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

    setupEventListeners() {
        console.log('🔍 [EVENTS] Configurando event listeners');
        
        document.getElementById('locateBtn').addEventListener('click', () => {
            console.log('🖱️ [BTN] Botón ubicación clickeado');
            this.centerOnUserLocation();
        });

        document.getElementById('installBtn').addEventListener('click', () => {
            console.log('🖱️ [BTN] Botón instalar clickeado');
            this.installApp();
        });
        
        console.log('✅ [EVENTS] Event listeners configurados');
    }

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
        
        // Si llegamos aquí, la instalación automática falló
        console.log('🔍 [INSTALL] Mostrando mensaje de Chrome...');
        this.showChromeMessage();
        console.log('🔍 [INSTALL] Ocultando botón...');
        this.hideInstallButton();
    }

    showChromeMessage() {
        console.log('🔍 [ALERT] Mostrando alerta de Chrome');
        alert('Por favor utiliza Google Chrome para una mejor experiencia');
    }

    hideInstallButton() {
        console.log('🔍 [HIDE] Intentando ocultar botón de instalación');
        const installBtn = document.getElementById('installBtn');
        console.log('🔍 [HIDE] Botón encontrado:', !!installBtn);
        
        if (installBtn) {
            console.log('🔍 [HIDE] Estilo actual del botón:', installBtn.style.display);
            installBtn.style.display = 'none';
            console.log('🔍 [HIDE] Estilo después de ocultar:', installBtn.style.display);
            console.log('✅ [HIDE] Botón ocultado');
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
            const { latitude, longitude } = position.coords;
            
            console.log('📍 [LOCATION] Ubicación obtenida:', latitude, longitude);
            this.userLocation = { lat: latitude, lng: longitude };
            
            this.map.setView([latitude, longitude], 15);
            
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
            console.log('✅ [LOCATION] Ubicación centrada en mapa');
            
        } catch (error) {
            console.error('❌ [LOCATION] Error obteniendo ubicación:', error);
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
