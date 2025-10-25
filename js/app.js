// js/app.js - Frontend actualizado para usar el backend
class TransporteApp {
    constructor() {
        this.backendURL = 'https://transporte-ba-pwa.onrender.com';
        this.init();
    }

    async init() {
        console.log('🚍 Transporte BA PWA iniciada');
        console.log('📍 Backend URL:', this.backendURL);
        
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
        results.innerHTML = '<div class="loading">📍 Obteniendo ubicación...</div>';

        try {
            // Obtener ubicación del usuario
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            console.log('📍 Ubicación obtenida:', latitude, longitude);
            
            // Buscar paradas cercanas en el backend
            await this.buscarParadasCercanas(latitude, longitude);
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.handleLocationError(error);
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

    async buscarParadasCercanas(lat, lng) {
        const results = document.getElementById('results');
        results.innerHTML = '<div class="loading">🔍 Buscando paradas cercanas...</div>';

        try {
            // Llamar a TU backend
            const response = await fetch(
                `${this.backendURL}/api/paradas-cercanas?lat=${lat}&lng=${lng}&radio=1`
            );

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const data = await response.json();
            console.log('🚍 Datos recibidos:', data);
            
            this.mostrarParadas(data);
            
        } catch (error) {
            console.error('❌ Error buscando paradas:', error);
            results.innerHTML = `
                <div class="error">
                    <h3>❌ Error de conexión</h3>
                    <p>No se pudieron cargar las paradas. Intenta nuevamente.</p>
                    <button onclick="app.getLocation()" class="btn-primary">Reintentar</button>
                </div>
            `;
        }
    }

    mostrarParadas(data) {
        const results = document.getElementById('results');
        
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
                <h3>📍 Ubicación actual</h3>
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
        const results = document.getElementById('results');
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
                <button onclick="app.getLocation()" class="btn-back">← Volver</button>
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
        document.getElementById('results').innerHTML = html;
    }

    handleLocationError(error) {
        const results = document.getElementById('results');
        
        let message = 'Error desconocido al obtener la ubicación';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permiso de ubicación denegado. Permite el acceso a la ubicación para usar esta función.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Información de ubicación no disponible.';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado al obtener la ubicación.';
                break;
        }

        results.innerHTML = `
            <div class="error">
                <h3>❌ Error de ubicación</h3>
                <p>${message}</p>
                <button onclick="app.getLocation()" class="btn-primary">Intentar nuevamente</button>
            </div>
        `;
    }
}

// Inicializar la app cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TransporteApp();
});
