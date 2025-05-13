
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
        const mapInstance = this._mapInstances[containerId];
        const container = document.getElementById(containerId);

        if (mapInstance) {
            console.log(`MapUtils: Cleaning up ACTIVE map instance in #${containerId}`);
            try {
                mapInstance.remove();
                delete this._mapInstances[containerId];
            } catch (e) {
                console.warn(`MapUtils: Error removing active map instance in #${containerId}:`, e);
            }
        } else if (container && container._leaflet_id) {
            console.warn(`MapUtils: Container #${containerId} has _leaflet_id but no active instance. Attempting DOM cleanup.`);
        }


        if (!mapInstance && !(container && container._leaflet_id)) {
        }
    },

    cleanupAllMaps() {
        console.log('MapUtils: Cleaning up ALL active map instances...');
        Object.keys(this._mapInstances).forEach(id => {
            const mapInstance = this._mapInstances[id];
            if (mapInstance) {
                try {
                    console.log(`MapUtils: Removing map in #${id} during cleanupAllMaps.`);
                    mapInstance.remove();
                } catch (e) {
                    console.warn(`MapUtils: Error removing map in #${id} during cleanupAllMaps:`, e);
                }
            }
        });
        this._mapInstances = {};
        console.log('MapUtils: All map instances removed from internal tracking.');
    },

    initMap(containerId, options = {}) {
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");

        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            throw new Error(`Map container with id "${containerId}" not found.`);
        }

        if (this._mapInstances[containerId]) {
            console.warn(`MapUtils: Active instance for #${containerId} found. Cleaning up first.`);
            this.cleanupMap(containerId);
        } else if (mapContainer._leaflet_id) {
            console.warn(`MapUtils: Container #${containerId} has _leaflet_id but no active instance in tracking. Forcing DOM cleanup.`);
            mapContainer.innerHTML = '';
            delete mapContainer._leaflet_id;
        }


        if (!mapContainer.style.height || mapContainer.style.height === '0px') {
            mapContainer.style.height = '400px';
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

        let map;
        try {
            console.log(`MapUtils: Initializing new map in #${containerId}`);
            map = L.map(containerId, mapOptions);
            this._mapInstances[containerId] = map;

            const osmLayer = L.tileLayer(this._osmLayerUrl, {
                attribution: this._osmLayerAttribution, maxZoom: 19,
            });

            const baseLayers = { "OpenStreetMap": osmLayer };

            const mapTilerApiKeyExists = CONFIG.MAPTILER_API_KEY && CONFIG.MAPTILER_API_KEY !== 'YOUR_MAPTILER_API_KEY_HERE';
            if (mapTilerApiKeyExists) {
                const mapTilerLayer = L.tileLayer(this._mapTilerStreetsV2Url, {
                    attribution: this._mapTilerAttribution, maxZoom: 19,
                });
                baseLayers["MapTiler Streets"] = mapTilerLayer;
            }
            osmLayer.addTo(map);

            if (Object.keys(baseLayers).length > 1) {
                L.control.layers(baseLayers).addTo(map);
            }


            console.log(`MapUtils: Map initialized successfully in #${containerId}`);
            
            setTimeout(() => {
                if (this._mapInstances[containerId] && this._mapInstances[containerId].invalidateSize) {
                    this._mapInstances[containerId].invalidateSize();
                }
            }, 150);

            return map;
        } catch (error) {
            console.error(`MapUtils: Failed to initialize map in #${containerId}:`, error);
            if (map && this._mapInstances[containerId]) {
                delete this._mapInstances[containerId];
            }
            throw error;
        }
    },

    
    addMarkers(map, stories) {
        if (!map) {
            console.error("Map instance is required to add markers."); return;
        }
        if (typeof L === 'undefined') throw new Error("Leaflet not loaded");

        stories.forEach(story => {
            if (story.lat && story.lon) {
                const marker = L.marker([story.lat, story.lon]).addTo(map);
                marker.bindPopup(`
                    <b>${story.name || 'Story'}</b><br>
                    ${story.description ? story.description.substring(0, 50) : 'No description'}...<br>
                    <img src="${story.photoUrl}" alt="Thumb ${story.name}" width="50" style="margin-top: 5px; border-radius: 3px;">
                `);
            }
        });
    },

    initLocationPickerMap(containerId, onClickCallback) {
        const map = this.initMap(containerId, { 
            scrollWheelZoom: true, 
            dragging: true 
        });

        const layerControlContainer = map.getContainer().querySelector('.leaflet-control-layers');
        if (layerControlContainer) {
            layerControlContainer.remove();
        }

        let tempMarker = null;

        map.on('click', (e) => {
            const coords = e.latlng;
            if (tempMarker) {
                map.removeLayer(tempMarker);
            }
            tempMarker = L.marker(coords).addTo(map)
                .bindPopup(`Selected: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
                .openPopup();

            if (typeof onClickCallback === 'function') {
                onClickCallback({ lat: coords.lat, lng: coords.lng });
            }
        });

        const info = L.control({position: 'bottomleft'});
        info.onAdd = function () {
            this._div = L.DomUtil.create('div', 'map-info-picker');
            this.update();
            return this._div;
        };
        info.update = function () {
            this._div.innerHTML = 'Click on the map to pick a location';
        };
        info.addTo(map);
        
        setTimeout(() => {
             if (this._mapInstances[containerId] && this._mapInstances[containerId].invalidateSize) {
                this._mapInstances[containerId].invalidateSize();
             }
        }, 150);

        console.log(`MapUtils: Location picker map initialized in #${containerId}`);
        return map;
    }
};

export default MapUtils;