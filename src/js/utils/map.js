import CONFIG from '../config/config.js';

if (typeof L === 'undefined') {
    console.error("Leaflet library (L) not found. Make sure it's loaded before this script.");
}

const MapUtils = {
    _mapInstances: {},
    
    _defaultCenter: CONFIG.DEFAULT_MAP_CENTER,
    _defaultZoom: CONFIG.DEFAULT_MAP_ZOOM,

    _osmLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    _osmLayerAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

    _mapTilerStreetsV2Url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${CONFIG.MAPTILER_API_KEY}`,
    _mapTilerAttribution: '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',

    cleanupMap(containerId) {
        if (this._mapInstances[containerId]) {
            console.log(`Cleaning up map instance in #${containerId}`);
            this._mapInstances[containerId].remove();
            delete this._mapInstances[containerId];
            
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                container.removeAttribute('data-leaflet-internal-id');
                if (container._leaflet_id !== undefined) {
                    delete container._leaflet_id;
                }
            }
            return true;
        }
        return false;
    },

    cleanupAllMaps() {
        console.log('Cleaning up all map instances');
        Object.keys(this._mapInstances).forEach(id => {
            this.cleanupMap(id);
        });
    },

    initMap(containerId, options = {}) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");

        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            throw new Error(`Map container with id "${containerId}" not found.`);
        }

        this.cleanupMap(containerId);

        if (!mapContainer.style.height || mapContainer.style.height === '0px') {
            mapContainer.style.height = '400px';
            console.log(`Set default height for map container #${containerId}`);
        }

        const mapOptions = {
            ...options,
            center: options.center || this._defaultCenter,
            zoom: options.zoom || this._defaultZoom,
            dragging: options.dragging !== undefined ? options.dragging : true,
            touchZoom: options.touchZoom !== undefined ? options.touchZoom : true,
            scrollWheelZoom: options.scrollWheelZoom !== undefined ? options.scrollWheelZoom : true,
            doubleClickZoom: options.doubleClickZoom !== undefined ? options.doubleClickZoom : true
        };

        if (!Array.isArray(mapOptions.center) || mapOptions.center.length !== 2) {
            throw new Error("Invalid map center provided.");
        }

        if (typeof mapOptions.zoom !== 'number') {
            throw new Error("Invalid map zoom level.");
        }

        try {
            const map = L.map(containerId, mapOptions);
            
            this._mapInstances[containerId] = map;

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
                console.warn("MapTiler API Key not found or is placeholder. Skipping MapTiler layer.");
            }

            osmLayer.addTo(map);

            if (Object.keys(baseLayers).length > 1) {
                L.control.layers(baseLayers).addTo(map);
                console.log("Layer control added to map.");
            }

            console.log(`Map initialized in #${containerId}`);
            
            setTimeout(() => {
                map.invalidateSize();
                console.log(`Map dragging enabled: ${map.dragging.enabled()}`);
            }, 300);

            return map;
        } catch (error) {
            console.error(`Failed to initialize map in #${containerId}:`, error);
            throw error;
        }
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

        const map = this.initMap(containerId, { 
            scrollWheelZoom: true, 
            dragging: true 
        });

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

        setTimeout(() => {
            map.invalidateSize();
            console.log(`Location picker map dragging enabled: ${map.dragging.enabled()}`);
        }, 300);

        console.log(`Location picker map initialized in #${containerId}`);
        return map;
    }
};

export default MapUtils;