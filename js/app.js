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

    async installApp() {
        if (!this.deferredPrompt) {
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
    }

    loadApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Banner de instalación -->
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
