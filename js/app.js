// js/app.js - Archivo principal de la PWA (versión simplificada)
class TransporteApp {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        console.log('🚍 Transporte BA PWA iniciada');
        
        // Manejar la instalación de la PWA
        this.setupInstallPrompt();
        
        // Verificar si el navegador soporta PWA
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado');
            } catch (error) {
                console.log('Error registrando SW:', error);
            }
        }

        this.loadApp();
    }

    setupInstallPrompt() {
        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('🎯 Evento beforeinstallprompt disparado');
            e.preventDefault();
            this.deferredPrompt = e;
        });

        // Escuchar cuando la app es instalada
        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 PWA instalada en el dispositivo');
            this.hideInstallOptions();
        });
    }

    hideInstallOptions() {
        const installSection = document.getElementById('installSection');
        if (installSection) {
            installSection.style.display = 'none';
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            // Intentar instalación automática
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ Usuario aceptó instalar la PWA');
                this.hideInstallOptions();
                return;
            }
        }
        
        // Si no funciona la automática, mostrar instrucciones
        this.showInstallInstructions();
    }

    showInstallInstructions() {
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
        const app = document.getElementById('app');
        app.innerHTML = `
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
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.hideInstallOptions();
        }
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
    window.app = new TransporteApp();
});
