// src/js/utils/map.js
import CONFIG from '../config/config.js';

// Pastikan Leaflet (L) tersedia global (dari <script> tag)
if (typeof L === 'undefined') {
    console.error("Leaflet library (L) not found. Make sure it's loaded before this script.");
}

const MapUtils = {
    _defaultCenter: CONFIG.DEFAULT_MAP_CENTER,
    _defaultZoom: CONFIG.DEFAULT_MAP_ZOOM,

    // Layer 1: OpenStreetMap (Default)
    _osmLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    _osmLayerAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

    // Layer 2: MapTiler Streets v2 (optional)
    _mapTilerStreetsV2Url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${CONFIG.MAPTILER_API_KEY}`,
    _mapTilerAttribution: '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',

    initMap(containerId, options = {}) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            throw new Error(`Map container with id "${containerId}" not found.`);
        }
        mapContainer.innerHTML = ''; // Bersihkan container

        const mapOptions = {
            ...options,
            center: options.center || this._defaultCenter,
            zoom: options.zoom || this._defaultZoom,
        };

        if (!Array.isArray(mapOptions.center) || mapOptions.center.length !== 2) {
            throw new Error("Invalid map center provided.");
        }
        if (typeof mapOptions.zoom !== 'number') {
            throw new Error("Invalid map zoom level.");
        }

        const map = L.map(containerId, mapOptions);

        const osmLayer = L.tileLayer(this._osmLayerUrl, {
            attribution: this._osmLayerAttribution,
            maxZoom: 19,
        });

        const baseLayers = {
            "OpenStreetMap": osmLayer,
        };

        const mapTilerApiKeyExists = CONFIG.MAPTILER_API_KEY && CONFIG.MAPTILER_API_KEY !== 'YOUR_MAPTILER_API_KEY_HERE';
        if (mapTilerApiKeyExists) {
            const mapTilerLayer = L.tileLayer(this._mapTilerStreetsV2Url, {
                attribution: this._mapTilerAttribution,
                maxZoom: 19,
            });
            baseLayers["MapTiler Streets"] = mapTilerLayer;
            console.log("MapTiler layer added to options.");
        } else {
            console.warn("MapTiler API Key not found or is placeholder in config.js. MapTiler layer disabled.");
        }

        osmLayer.addTo(map);

        if (Object.keys(baseLayers).length > 1) {
            L.control.layers(baseLayers).addTo(map);
            console.log("Layer control added to map.");
        }

        console.log(`Map initialized in #${containerId}`);
        setTimeout(() => map.invalidateSize(), 100);
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
                `);
            }
        });
    },

    initLocationPickerMap(containerId, onClickCallback) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");

        const map = this.initMap(containerId, { scrollWheelZoom: false });

        // Remove layer control for simplicity
        const layerControl = map.zoomControl?.getContainer()?.parentElement?.querySelector('.leaflet-control-layers');
        if (layerControl) {
            layerControl.remove();
            console.log("Layer control removed from location picker map for simplicity.");
        }

        let tempMarker = null;

        map.on('click', (e) => {
            const coords = e.latlng;
            console.log('Map clicked at:', coords);

            if (tempMarker) {
                map.removeLayer(tempMarker);
            }

            tempMarker = L.marker(coords).addTo(map)
                .bindPopup(`Selected Location: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
                .openPopup();

            if (typeof onClickCallback === 'function') {
                onClickCallback({ lat: coords.lat, lng: coords.lng });
            }
        });

        const info = L.control();
        info.onAdd = function () {
            this._div = L.DomUtil.create('div', 'map-info');
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
