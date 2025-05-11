import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';
import MapUtils from '../utils/map.js';
import CameraUtils from '../utils/camera.js';
import { qs } from '../utils/dom.js';
import Swal from 'sweetalert2';
import { openStoryDb, addStoriesToDb, getStoriesFromDb, getStoryByIdFromDb } from '../utils/idb-helper.js';
import CONFIG from '../config/config.js';

class StoryPresenter {
    constructor({ mainView, homePageView, addStoryPageView, detailPageView }) {
        this._mainView = mainView;
        this._homePageView = homePageView;
        this._addStoryPageView = addStoryPageView;
        this._detailPageView = detailPageView;

        this._selectedCoords = null;
        this._capturedImageBlob = null;

        openStoryDb().then(() => console.log('StoryDB initialized successfully.'))
                     .catch(err => console.error('Failed to initialize StoryDB:', err));
    }

    _cleanupAddStoryResourcesOnly() {
        CameraUtils.stopStream();
        if (this._capturedImageBlob) {
            try {
                URL.revokeObjectURL(this._capturedImageBlob);
            } catch(e) { console.warn("Error revoking object URL", e); }
            this._capturedImageBlob = null;
        }
        this._selectedCoords = null;
    }

    cleanupPageResources() {
        console.log("Cleaning up page resources...");
        this._cleanupAddStoryResourcesOnly();

        if (MapUtils && typeof MapUtils.cleanupAllMaps === 'function') {
            MapUtils.cleanupAllMaps();
        } else {
            console.warn("MapUtils.cleanupAllMaps not available.");
        }
        console.log("Page resource cleanup finished.");
    }

    async displayHomePage() {
        this.cleanupPageResources();
        this._mainView.showLoading();
        try {
            let stories = [];
            const isLoggedIn = AuthModel.isLoggedIn();

            try {
                const response = await StoryApiSource.getAllStories({ location: 1 });
                if (!response.error) {
                    stories = response.listStory;
                    await addStoriesToDb(stories);
                    console.log('Stories fetched from API and cached in IDB.');
                } else {
                    throw new Error(response.message || 'Failed to fetch stories from API');
                }
            } catch (apiError) {
                console.warn('API fetch failed, trying IndexedDB:', apiError.message);
                if (apiError.message.includes("token") || apiError.message.includes("logged in")) {
                    AuthModel.clearCredentials();
                    window.location.hash = "#/login";
                    Swal.fire('Session Expired', 'Please log in again.', 'warning');
                    return;
                }

                stories = await getStoriesFromDb();
                if (stories.length > 0) {
                    console.log('Stories loaded from IndexedDB.');
                    Swal.fire({
                        title: 'Offline Mode',
                        text: 'Showing cached stories.', icon: 'info',
                        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
                    });
                } else {
                    console.error('Failed to fetch stories from API and no cache available.');
                    this._mainView.showError('Could not load stories. Please check connection or log in.');
                    return;
                }
            }

            this._mainView.renderPage(
                () => this._homePageView.render(stories),
                () => {
                    setTimeout(() => {
                        this._setupHomePageMap(stories.filter(story => story.lat && story.lon));
                    }, 100);
                }
            );

        } catch (error) {
            console.error('Error displaying home page:', error);
            if (!window.location.hash.includes('/login')) {
                this._mainView.showError(error.message || 'Failed to load home page.');
            }
        }
    }

    _setupHomePageMap(storiesWithLocation) {
        const mapContainerId = 'storiesMap';
        const mapContainer = qs(`#${mapContainerId}`);

        if (!mapContainer) {
            console.warn(`#${mapContainerId} container not found during setup.`);
            return;
        }

        try {
            console.log(`Initializing map in #${mapContainerId}`);
            
            mapContainer.innerHTML = '';
            
            const homeMap = MapUtils.initMap(mapContainerId, {
                center: CONFIG.DEFAULT_MAP_CENTER,
                zoom: 10
            });

            if (!homeMap) {
                console.error("Map initialization failed!");
                return;
            }

            if (storiesWithLocation.length > 0) {
                MapUtils.addMarkers(homeMap, storiesWithLocation);
                try {
                    const bounds = L.latLngBounds(storiesWithLocation.map(s => [s.lat, s.lon]));
                    homeMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                } catch (boundsError) {
                    console.error("Error fitting map bounds:", boundsError);
                    homeMap.setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);
                }
            } else {
                console.log("No stories with location data found for home map.");
                mapContainer.innerHTML = '<p class="info-text" style="text-align: center; padding: 20px;">No story locations to display on map.</p>';
            }
        } catch (mapError) {
            console.error(`Failed to initialize home page map in #${mapContainerId}:`, mapError);
            if (mapContainer) {
                mapContainer.innerHTML = `<p class="error-message">Could not load map: ${mapError.message}</p>`;
            }
        }
    }

    displayAddStoryPage() {
        this.cleanupPageResources();
        this._mainView.renderPage(
            () => this._addStoryPageView.render(),
            () => {
                setTimeout(() => {
                    this._setupAddStoryPage();
                }, 100);
            }
        );
    }

    _setupAddStoryPage() {
        console.log("Setting up add story page features...");
        const form = qs('#addStoryForm');
        const cameraPreview = qs('#cameraPreview');
        const captureButton = qs('#captureButton');
        const retakeButton = qs('#retakeButton');
        const imagePreview = qs('#imagePreview');
        const mapContainerElement = qs('#locationPickerMap');
        const descriptionInput = qs('#description');
        const useLocationCheckbox = qs('#useLocation');
        const mapSection = qs('#mapSection');
        const cameraErrorDiv = qs('#cameraError');
        const coordDisplay = qs('#selectedCoords');

        if (!form || !cameraPreview || !captureButton || !retakeButton || !imagePreview || !descriptionInput || !useLocationCheckbox || !mapSection || !cameraErrorDiv || !coordDisplay) {
            console.error("One or more essential elements missing in Add Story page DOM.");
            this._mainView.showError("Failed to initialize Add Story page components.");
            return;
        }

        this._capturedImageBlob = null;
        const startCameraAndHandleError = () => {
            CameraUtils.startCamera(cameraPreview)
                .then(() => {
                    cameraErrorDiv.style.display = "none";
                    cameraErrorDiv.textContent = '';
                    captureButton.disabled = false;
                    captureButton.style.display = "inline-block";
                    retakeButton.style.display = "none";
                    imagePreview.style.display = "none";
                    cameraPreview.style.display = "block";
                })
                .catch((err) => {
                    console.error("Failed to start camera:", err);
                    cameraErrorDiv.textContent = `Error: ${err.message}. Please grant permission.`;
                    cameraErrorDiv.style.display = "block";
                    captureButton.disabled = true;
                    captureButton.style.display = 'inline-block';
                });
        };
        startCameraAndHandleError();

        captureButton.addEventListener('click', async () => {
            captureButton.disabled = true;
            try {
                const blob = await CameraUtils.captureImageBlob(cameraPreview);
                this._capturedImageBlob = blob;
                imagePreview.src = URL.createObjectURL(this._capturedImageBlob);
                imagePreview.style.display = "block";
                cameraPreview.style.display = "none";
                captureButton.style.display = "none";
                retakeButton.style.display = "inline-block";
                CameraUtils.stopStream();
            } catch (error) {
                console.error("Failed to capture image:", error);
                Swal.fire('Capture Error', error.message || 'Could not capture image.', 'error');
                captureButton.disabled = false;
            }
        });

        retakeButton.addEventListener('click', () => {
            if (this._capturedImageBlob) {
                URL.revokeObjectURL(imagePreview.src);
                this._capturedImageBlob = null;
            }
            imagePreview.style.display = "none";
            imagePreview.src = "";
            startCameraAndHandleError();
        });

        this._selectedCoords = null;
        const initMapForPicking = () => {
            if (!mapContainerElement) {
                console.error("Location picker map container element not found.");
                return;
            }
            
            mapContainerElement.innerHTML = '';
            
            try {
                console.log("Initializing location picker map...");
                const locationMap = MapUtils.initLocationPickerMap(
                    mapContainerElement.id,
                    (coords) => {
                        this._selectedCoords = coords;
                        console.log("Location selected:", coords);
                        if (coordDisplay) {
                            coordDisplay.textContent = `Selected: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
                        }
                    }
                );
            } catch (error) {
                console.error("Failed to initialize location picker map:", error);
                if (mapContainerElement) {
                    mapContainerElement.innerHTML = `<p class="error-message">Could not load map: ${error.message}</p>`;
                }
            }
        };

        useLocationCheckbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                mapSection.style.display = "block";
                setTimeout(() => {
                    initMapForPicking();
                }, 100);
            } else {
                mapSection.style.display = "none";
                this._selectedCoords = null;
                if (coordDisplay) {
                    coordDisplay.textContent = "Location not set";
                }
                MapUtils.cleanupMap(mapContainerElement.id);
            }
        });

        mapSection.style.display = useLocationCheckbox.checked ? "block" : "none";
        if (coordDisplay) coordDisplay.textContent = "Location not set";
        if (useLocationCheckbox.checked) {
            setTimeout(() => {
                initMapForPicking();
            }, 100);
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const description = descriptionInput.value.trim();
            const useLocation = useLocationCheckbox.checked;

            if (!description) {
                Swal.fire('Missing Description', 'Please provide a description for your story.', 'warning');
                return;
            }
            if (!this._capturedImageBlob) {
                Swal.fire('Missing Image', 'Please capture an image for your story.', 'warning');
                return;
            }
            if (useLocation && !this._selectedCoords) {
                Swal.fire('Missing Location', 'Please pick a location on the map or uncheck the location option.', 'warning');
                return;
            }
            if (this._capturedImageBlob.size > 1 * 1024 * 1024) {
                Swal.fire('Image Too Large', 'Image size cannot exceed 1MB.', 'warning');
                return;
            }

            const lat = useLocation ? this._selectedCoords.lat : undefined;
            const lon = useLocation ? this._selectedCoords.lng : undefined;

            const submitButton = form.querySelector('button[type="submit"]');
            const buttonText = submitButton.querySelector('.button-text');
            const buttonLoading = submitButton.querySelector('.button-loading');

            submitButton.disabled = true;
            if(buttonText) buttonText.style.display = 'none';
            if(buttonLoading) buttonLoading.style.display = 'inline-flex';

            try {
                const storyData = { description, photo: this._capturedImageBlob, lat, lon };
                const useGuest = !AuthModel.isLoggedIn();
                let response;

                if (useGuest) {
                    console.log('Adding story as guest:', storyData);
                    response = await StoryApiSource.addNewStoryGuest(storyData);
                } else {
                    console.log('Adding story as logged-in user:', storyData);
                    response = await StoryApiSource.addNewStory(storyData);
                }

                if (!response.error) {
                    Swal.fire({
                        title: 'Success!', text: 'Your story has been added.', icon: 'success',
                        timer: 1500, showConfirmButton: false
                    }).then(() => {
                        window.location.hash = "#/home";
                    });
                } else {
                    throw new Error(response.message || "Failed to add story due to server error.");
                }
            } catch (error) {
                console.error("Error adding story:", error);
                Swal.fire("Upload Failed", error.message || "An unexpected error occurred.", "error");
                submitButton.disabled = false;
                if(buttonText) buttonText.style.display = 'inline';
                if(buttonLoading) buttonLoading.style.display = 'none';
            }
        });
    }

    async displayDetailPage(storyId) {
        this.cleanupPageResources();
        this._mainView.showLoading();
        try {
            let story = null;
            const isLoggedIn = AuthModel.isLoggedIn();

            try {
                if (isLoggedIn) {
                    const response = await StoryApiSource.getStoryDetail(storyId);
                    if (!response.error) {
                        story = response.story;
                        console.log('Story detail fetched from API.');
                    } else {
                        throw new Error(response.message || `Failed to fetch story ${storyId} from API`);
                    }
                } else {
                    throw new Error("Login required or offline mode.");
                }
            } catch (apiError) {
                console.warn(`API fetch/access failed for story ${storyId}, trying IndexedDB:`, apiError.message);
                if (apiError.message.includes("token") || apiError.message.includes("logged in")) {
                    AuthModel.clearCredentials();
                    window.location.hash = "#/login";
                    Swal.fire('Session Expired', 'Please log in again.', 'warning');
                    return;
                }

                story = await getStoryByIdFromDb(storyId);
                if (story) {
                    console.log(`Story ${storyId} loaded from IndexedDB.`);
                    Swal.fire({
                        title: 'Offline Mode', text: 'Showing cached story details.', icon: 'info',
                        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
                    });
                } else {
                    console.error(`Failed to get story ${storyId} from API and not found in cache.`);
                    this._mainView.showError(`Could not load story details for ID ${storyId}. It might require login or is unavailable offline.`);
                    return;
                }
            }

            if (story) {
                this._mainView.renderPage(
                    () => this._detailPageView.render(story),
                    () => {
                        setTimeout(() => {
                            this._setupDetailPageMap(story);
                        }, 100);
                    }
                );
            } else {
                throw new Error(`Story with ID ${storyId} could not be loaded.`);
            }

        } catch (error) {
            console.error(`Error displaying detail page for story ${storyId}:`, error);
            if (!window.location.hash.includes('/login')) {
                this._mainView.showError(error.message || 'Failed to load story details.');
            }
        }
    }

    _setupDetailPageMap(story) {
        const mapContainerId = 'detailStoryMap';
        const mapContainer = qs(`#${mapContainerId}`);

        if (!mapContainer) {
            console.warn(`#${mapContainerId} container not found during setup.`);
            return;
        }

        if (story && story.lat && story.lon) {
            try {
                console.log(`Initializing map in #${mapContainerId}`);
                
                mapContainer.innerHTML = '';
                mapContainer.style.display = 'block';
                
                const detailMap = MapUtils.initMap(mapContainerId, {
                    center: [story.lat, story.lon],
                    zoom: 15,
                    scrollWheelZoom: false,
                    dragging: true,
                    touchZoom: true,
                    doubleClickZoom: true,
                });

                if (!detailMap) {
                    console.error("Detail map initialization failed!");
                    return;
                }

                L.marker([story.lat, story.lon]).addTo(detailMap)
                    .bindPopup(`<b>${story.name || 'Story Location'}</b>`)
                    .openPopup();

                const layerControl = detailMap.zoomControl?.getContainer()?.parentElement?.querySelector('.leaflet-control-layers');
                if (layerControl) layerControl.remove();

            } catch (mapError) {
                console.error(`Failed to initialize detail page map in #${mapContainerId}:`, mapError);
                if (mapContainer) {
                    mapContainer.innerHTML = `<p class="error-message">Could not load map: ${mapError.message}</p>`;
                }
            }
        } else {
            const detailMapContainerSection = qs('#detailStoryMapContainer');
            if (detailMapContainerSection) {
                const existingNoLocationMsg = detailMapContainerSection.querySelector('.no-location-info');
                if(!existingNoLocationMsg) {
                    const msgElement = document.createElement('p');
                    msgElement.className = 'no-location-info';
                    msgElement.textContent = 'Location data is not available for this story.';
                    detailMapContainerSection.appendChild(msgElement);
                }
                if(mapContainer) mapContainer.style.display = 'none';
            }
            console.log("Detail map not initialized: No location data or container not found.");
        }
    }
}

export default StoryPresenter;