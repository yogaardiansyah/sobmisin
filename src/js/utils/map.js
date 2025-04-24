// src/js/utils/map.js
import CONFIG from '../config/config.js';

// Pastikan Leaflet (L) tersedia global (dari <script> tag)
if (typeof L === 'undefined') {
     console.error("Leaflet library (L) not found. Make sure it's loaded before this script.");
}

const MapUtils = {
    _defaultCenter: CONFIG.DEFAULT_MAP_CENTER,
    _defaultZoom: CONFIG.DEFAULT_MAP_ZOOM,
    _tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // Default OSM
    _tileLayerAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

     // Opsional: MapTiler Layer (perlu API key di config.js dan STUDENT.txt)
     // _tileLayerUrlMapTiler: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${CONFIG.MAPTILER_API_KEY}`,
     // _tileLayerAttributionMapTiler: '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',


    initMap(containerId, options = {}) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            throw new Error(`Map container with id "${containerId}" not found.`);
        }
        // Bersihkan container jika peta sebelumnya ada
         mapContainer.innerHTML = '';

        const mapOptions = {
            center: options.center || this._defaultCenter,
            zoom: options.zoom || this._defaultZoom,
            ...options // Allow overriding other Leaflet options
        };

        const map = L.map(containerId, mapOptions);

        // Tambahkan Tile Layer (wajib ada minimal satu)
        L.tileLayer(this._tileLayerUrl, {
            attribution: this._tileLayerAttribution,
            maxZoom: 19, // Sesuaikan sesuai kebutuhan
        }).addTo(map);

        // Opsional: Tambahkan Layer Control jika ada > 1 layer
        // const baseLayers = {
        //     "OpenStreetMap": L.tileLayer(this._tileLayerUrl, { attribution: this._tileLayerAttribution }),
        //     "MapTiler Streets": L.tileLayer(this._tileLayerUrlMapTiler, { attribution: this._tileLayerAttributionMapTiler }) // Contoh
        // };
        // if (CONFIG.MAPTILER_API_KEY && Object.keys(baseLayers).length > 1) { // Hanya jika ada key & > 1 layer
        //    L.control.layers(baseLayers).addTo(map);
        //    baseLayers["MapTiler Streets"].addTo(map); // Default ke MapTiler jika ada
        // } else {
        //    baseLayers["OpenStreetMap"].addTo(map); // Default OSM
        // }

        console.log(`Map initialized in #${containerId}`);
         // Handle resize issues if map container visibility changes
         setTimeout(() => map.invalidateSize(), 100); // Adjust size after potential layout shifts
        return map;
    },

    addMarkers(map, stories) {
        if (!map) {
            console.error("Map instance is required to add markers.");
            return;
        }
         if (typeof L === 'undefined') throw new Error("Leaflet not loaded");

        console.log(`Adding ${stories.length} markers to the map.`);
        stories.forEach(story => {
            if (story.lat && story.lon) {
                const marker = L.marker([story.lat, story.lon]).addTo(map);
                marker.bindPopup(`
                    <b>${story.name}</b><br>
                    ${story.description.substring(0, 50)}...<br>
                    <img src="${story.photoUrl}" alt="Thumb ${story.name}" width="50" style="margin-top: 5px;">
                `); // Popup content (Kriteria 3)
            }
        });
    },

    initLocationPickerMap(containerId, onClickCallback) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");
        const map = this.initMap(containerId, { scrollWheelZoom: false }); // Nonaktifkan zoom scroll agar tidak sengaja ter-zoom saat scroll halaman

        let tempMarker = null; // Untuk menyimpan marker sementara

        map.on('click', (e) => {
            const coords = e.latlng; // Dapatkan koordinat dari event klik
            console.log('Map clicked at:', coords);

            // Hapus marker lama jika ada
            if (tempMarker) {
                map.removeLayer(tempMarker);
            }

            // Tambahkan marker baru di lokasi klik
            tempMarker = L.marker(coords).addTo(map)
                .bindPopup(`Selected Location: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
                .openPopup();

            // Panggil callback yang diberikan dengan koordinat
            if (typeof onClickCallback === 'function') {
                onClickCallback({ lat: coords.lat, lng: coords.lng });
            }
        });

         // Tambahkan instruksi ke peta (opsional)
         const info = L.control();
         info.onAdd = function () {
             this._div = L.DomUtil.create('div', 'map-info'); // create a div with a class "map-info"
             this.update();
             return this._div;
         };
         info.update = function () {
             this._div.innerHTML = 'Click on the map to pick a location';
         };
         info.addTo(map);

        console.log(`Location picker map initialized in #${containerId}`);
        return map;
    }
};

export default MapUtils;