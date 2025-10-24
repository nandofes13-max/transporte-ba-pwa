// js/app.js - Archivo con logs de diagnóstico
class TransporteApp {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        console.log('🚍 Transporte BA PWA iniciada');
        console.log('📱 Display mode:', window.matchMedia('(display-mode: standalone)').matches);
        console.log('🔧 Service Worker support:', 'serviceWorker' in navigator);
        
        // Manejar la instalación de la PWA
        this.setupInstallPrompt();
        
        // Verificar si el navegador soporta PWA
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado');
            } catch (error) {
                console.log('❌ Error registrando SW:', error);
            }
        }

        this.loadApp();
    }

    setupInstallPrompt() {
        console.log('🔧 Configurando eventos de instalación...');
        
        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('🎯 Evento beforeinstallprompt DISPARADO');
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('✅ deferredPrompt guardado');
            
            // 🆕 MOSTRAR EL BANNER AUTOMÁTICAMENTE
            this.showInstallBanner();
        });

        // Escuchar cuando la app es instalada
        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 PWA instalada en el dispositivo');
            this.hideInstallOptions();
        });

        console.log('📝 Eventos de instalación configurados');
    }

    showInstallBanner() {
        console.log('🟠 Mostrando banner de instalación');
        const installBanner = document.getElementById('installBanner');
        if (installBanner && this.deferredPrompt) {
            installBanner.classList.remove('hidden');
            console.log('✅ Banner de instalación visible');
        }
    }

    hideInstallOptions() {
        console.log('🔒 Ocultando opciones de instalación');
        const installSection = document.getElementById('installSection');
        if (installSection) {
            installSection.style.display = 'none';
            console.log('✅ Sección de instalación ocultada');
        }
    }

    async installApp() {
        console.log('🖱️ Botón Instalar clickeado');
        console.log('📦 deferredPrompt disponible:', !!this.deferredPrompt);
        
        if (this.deferredPrompt) {
            console.log('🚀 Intentando instalación automática...');
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('📋 Resultado instalación:', outcome);
            
            if (outcome === 'accepted') {
                console.log('✅ Usuario aceptó instalar la PWA');
                this.hideInstallOptions();
                return;
            }
        }
        
        console.log('📚 Mostrando instrucciones manuales');
        this.showInstallInstructions();
    }

    showInstallInstructions() {
        console.log('📖 Mostrando instrucciones de instalación');
        const results = document.getElementById('results');
        results.innerHTML = `
            <div class="install-instructions">
                <h3>📱 Para instalar la App:</h3>
                <div class="instruction-step">
                    <strong>Chrome/Edge en Android:</strong>
                    <p>1. Menú (⋮) → "Agregar a pantalla de inicio"</p>
                    <p>2. Confirmar "Agregar"</p>
                </div>
                <div class="instruction-step">
                    <strong>Safari en iPhone:</strong>
                    <p>1. Botón compartir (📤) → "Agregar a inicio"</p>
                    <p>2. Click "Agregar" en la esquina superior derecha</p>
                </div>
                <button onclick="app.closeInstructions()" class="btn-primary">Entendido</button>
            </div>
        `;
    }

    closeInstructions() {
        const results = document.getElementById('results');
        results.innerHTML = '';
    }

    loadApp() {
        console.log('🔄 Cargando interfaz de la app...');
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        console.log('📱 ¿App ya instalada?:', isInstalled);
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Banner de instalación automática -->
            <div id="installBanner" class="install-banner hidden">
                <div class="install-content">
                    <span>📱 Instalar App Transporte BA</span>
                    <button onclick="app.installApp()" class="btn-install">Instalar</button>
                </div>
            </div>

            <div class="header">
                <h1>🚍 Transporte BA</h1>
                <p>Tu asistente de transporte público</p>
            </div>

            <div class="main-content">
                <!-- Sección de instalación SIEMPRE visible -->
                <div id="installSection" class="install-section">
                    <h3>📱 Instalar App</h3>
                    <p>Para mejor experiencia, instala la app en tu dispositivo:</p>
                    <button onclick="app.installApp()" class="btn-install-manual">
                        Instalar App
                    </button>
                    <p class="install-note">Se creará un acceso directo en tu pantalla de inicio</p>
                </div>

                <button onclick="app.getLocation()" class="btn-primary">
                    📍 Buscar transporte cercano
                </button>
                <div id="results" class="results"></div>
            </div>
        `;

        // Ocultar sección de instalación si ya está instalada
        if (isInstalled) {
            console.log('🔍 App ya está instalada, ocultando sección...');
            this.hideInstallOptions();
        } else {
            console.log('🔍 App NO instalada, mostrando sección de instalación');
        }
        
        console.log('✅ Interfaz cargada completamente');
    }

    async getLocation() {
        const results = document.getElementById('results');
        results.innerHTML = '<p>📍 Obteniendo ubicación...</p>';

        try {
            results.innerHTML = `
                <div class="feature-coming">
                    <h3>🚧 Funcionalidad en desarrollo</h3>
                    <p>Geolocalización y API de transporte se implementarán próximamente</p>
                </div>
            `;
        } catch (error) {
            results.innerHTML = '<p>❌ Error obteniendo ubicación</p>';
        }
    }
}

// Inicializar la app cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM completamente cargado, iniciando app...');
    window.app = new TransporteApp();
});

console.log('🧩 Script app.js cargado (antes de DOMContentLoaded)');
