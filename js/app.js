// js/app.js - Archivo principal de la PWA
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
            // Prevenir que el navegador muestre el prompt automático
            e.preventDefault();
            // Guardar el evento para usarlo después
            this.deferredPrompt = e;
            // Mostrar nuestro banner personalizado
            this.showInstallBanner();
        });

        // Escuchar cuando la app es instalada
        window.addEventListener('appinstalled', (evt) => {
            console.log('🎉 PWA instalada en el dispositivo');
            this.hideInstallBanner();
            this.hideManualInstall();
            this.deferredPrompt = null;
        });
    }

    showInstallBanner() {
        const installBanner = document.getElementById('installBanner');
        if (installBanner && this.deferredPrompt) {
            installBanner.classList.remove('hidden');
            
            // Ajustar el padding del header
            const header = document.querySelector('.header');
            if (header) {
                header.style.paddingTop = '4rem';
            }
            
            // Ocultar el botón manual si el banner está visible
            this.hideManualInstall();
        }
    }

    hideInstallBanner() {
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.classList.add('hidden');
            
            // Restaurar el padding del header
            const header = document.querySelector('.header');
            if (header) {
                header.style.paddingTop = '1rem';
            }
        }
    }

    showManualInstall() {
        const manualInstall = document.getElementById('manualInstall');
        const installBanner = document.getElementById('installBanner');
    
        // Solo mostrar manual si el banner automático no está visible
        // y la PWA no está instalada
        if (manualInstall && 
            installBanner.classList.contains('hidden') &&
            !window.matchMedia('(display-mode: standalone)').matches) {
            manualInstall.classList.remove('hidden');
        }
    }

    hideManualInstall() {
        const manualInstall = document.getElementById('manualInstall');
        if (manualInstall) {
            manualInstall.classList.add('hidden');
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            // Si no hay prompt diferido, guiar al usuario manualmente
            this.showInstallInstructions();
            return;
        }

        // Mostrar el prompt de instalación
        this.deferredPrompt.prompt();
        
        // Esperar a que el usuario responda
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ Usuario aceptó instalar la PWA');
        } else {
            console.log('❌ Usuario rechazó instalar la PWA');
        }
        
        // Limpiar la referencia
        this.deferredPrompt = null;
        this.hideInstallBanner();
        this.hideManualInstall();
    }

    showInstallInstructions() {
        const results = document.getElementById('results');
        results.innerHTML = `
            <div class="install-instructions">
                <h3>📱 Cómo instalar la App</h3>
                <p><strong>En Chrome/Edge:</strong> Menú → "Agregar a pantalla de inicio"</p>
                <p><strong>En Safari:</strong> Compartir → "Agregar a inicio"</p>
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
                <!-- Botón manual de instalación -->
                <div id="manualInstall" class="manual-install hidden">
                    <button onclick="app.installApp()" class="btn-install-manual">
                        📱 Instalar como App
                    </button>
                </div>

                <button onclick="app.getLocation()" class="btn-primary">
                    📍 Buscar transporte cercano
                </button>
                <div id="results" class="results"></div>
            </div>
        `;

        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 La app ya está instalada');
            this.hideInstallBanner();
            this.hideManualInstall();
        } else {
            // Mostrar botón manual después de 3 segundos si no hay banner automático
            setTimeout(() => {
                this.showManualInstall();
            }, 3000);
        }
    }

    async getLocation() {
        const results = document.getElementById('results');
        results.innerHTML = '<p>📍 Obteniendo ubicación...</p>';

        try {
            // Aquí implementaremos la geolocalización
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
