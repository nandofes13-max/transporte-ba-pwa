// js/app.js - Con botón visible en móviles no-Chrome
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
        console.log('🔍 [INIT] Es desktop:', this.isDesktop());
        
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
        
        // 🆕 SI NO HAY DEFERREDPROMPT, MOSTRAR INSTRUCCIONES DE INSTALACIÓN MANUAL
        console.log('🔍 [INSTALL] Mostrando instrucciones de instalación manual...');
        this.showInstallInstructions();
        console.log('🔍 [INSTALL] Ocultando botón...');
        this.hideInstallButton();
    }

    // 🆕 FUNCIÓN PARA INSTRUCCIONES DE INSTALACIÓN MANUAL
    showInstallInstructions() {
        alert('Para instalar la aplicación:\n\n' +
              'En Chrome/Edge:\n' +
              '1. Menú (⋮) → "Agregar a pantalla de inicio"\n' +
              '2. Confirmar "Agregar"\n\n' +
              'En Safari:\n' + 
              '1. Botón compartir (📤) → "Agregar a inicio"\n' +
              '2. Click "Agregar"');
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
            // PRIMERO: Intentar GPS de alta precisión
            const position = await this.getCurrentPosition();
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log('📍 [LOCATION] GPS obtenido:', latitude, longitude, 'Precisión:', accuracy, 'm');
            
            // Si la precisión es mala (>1000m), usar fallback
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
            
            // FALLBACK: Usar geolocalización por IP
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

    // FUNCIÓN DE FALLBACK POR IP
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
            // ÚLTIMO FALLBACK: Buenos Aires centro
            console.log('🏙️ [LOCATION] Usando ubicación por defecto (Buenos Aires)');
            this.userLocation = { lat: -34.6037, lng: -58.3816 };
            this.centerMapOnLocation(-34.6037, -58.3816);
            console.log('✅ [LOCATION] Ubicación por defecto centrada');
        }
    }

    // FUNCIÓN PARA CENTRAR MAPA (reutilizable)
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
