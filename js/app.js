// js/app.js - Archivo principal de la PWA
class TransporteApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚍 Transporte BA PWA iniciada');
        
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

    loadApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
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
