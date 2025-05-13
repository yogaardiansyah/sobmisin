import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';
import MapUtils from '../utils/map.js';
import CameraUtils from '../utils/camera.js';
import { qs } from '../utils/dom.js';
import Swal from 'sweetalert2';
import {
    openStoryDb, addStoriesToDb, getStoriesFromDb, getStoryByIdFromDb,
    addFavoriteStoryToDb, removeFavoriteStoryFromDb, getFavoriteStoriesFromDb, isStoryFavoriteInDb
} from '../utils/idb-helper.js';
import CONFIG from '../config/config.js';

class StoryPresenter {
    _boundAddStorySubmitHandler = null;
    _boundHandleFavoriteToggle = null;

    constructor({ mainView, homePageView, addStoryPageView, detailPageView, favoriteStoriesPageView }) {
        this._mainView = mainView;
        this._homePageView = homePageView;
        this._addStoryPageView = addStoryPageView;
        this._detailPageView = detailPageView;
        this._favoriteStoriesPageView = favoriteStoriesPageView;

        this._selectedCoords = null;
        this._capturedImageBlob = null;
        this._currentStories = [];

        openStoryDb().then(() => console.log('StoryPresenter: StoryDB connection initialized.'))
                     .catch(err => console.error('StoryPresenter: Failed to initialize StoryDB connection:', err));
        
        this._boundHandleFavoriteToggle = this._handleFavoriteToggle.bind(this);
    }

    _cleanupAddStoryResourcesOnly() {
        CameraUtils.stopStream();
        if (this._capturedImageBlob) {
            try { URL.revokeObjectURL(this._capturedImageBlob); } catch(e) { }
            this._capturedImageBlob = null;
        }
        this._selectedCoords = null;
    }

    _cleanupAddStoryFormListener() {
        const form = qs('#addStoryForm');
        if (form && this._boundAddStorySubmitHandler) {
            form.removeEventListener('submit', this._boundAddStorySubmitHandler);
            console.log('StoryPresenter: AddStory form submit listener removed.');
            this._boundAddStorySubmitHandler = null;
        }
    }

    cleanupPageResources() {
        console.log("StoryPresenter: Cleaning up page resources...");
        this._cleanupAddStoryResourcesOnly();
        this._cleanupAddStoryFormListener();

        if (MapUtils && typeof MapUtils.cleanupAllMaps === 'function') {
            MapUtils.cleanupAllMaps();
        } else {
            console.warn("StoryPresenter: MapUtils.cleanupAllMaps not available.");
        }
        
        const mainContent = qs('#mainContent');
        if (mainContent && this._boundHandleFavoriteToggle) {
            mainContent.removeEventListener('click', this._boundHandleFavoriteToggle);
            console.log("StoryPresenter: Favorite toggle listener removed from mainContent.");
        }
        console.log("StoryPresenter: Page resource cleanup finished.");
    }
    
    async _getStoryById(storyId) {
        let story = this._currentStories.find(s => s.id === storyId);
        if (story) return story;

        story = await getStoryByIdFromDb(storyId);
        if (story) {
            this._currentStories.push(story);
            return story;
        }
        
        if (AuthModel.isLoggedIn()) {
            try {
                console.warn(`StoryPresenter: Story ${storyId} not in local caches, attempting API fetch.`);
                const response = await StoryApiSource.getStoryDetail(storyId);
                if (!response.error && response.story) {
                    this._currentStories.push(response.story);
                    return response.story;
                }
            } catch (apiError) {
                console.error(`StoryPresenter: Failed to fetch story ${storyId} from API:`, apiError);
            }
        }
        console.warn(`StoryPresenter: Story with ID ${storyId} could not be found.`);
        return null;
    }

    async _handleFavoriteToggle(event) {
        const favoriteButton = event.target.closest('.button-favorite');
        if (!favoriteButton) return;

        event.preventDefault();
        event.stopPropagation();

        const storyId = favoriteButton.dataset.storyId;
        if (!storyId) {
            console.warn("StoryPresenter: Favorite button clicked without story-id.");
            return;
        }

        if (!AuthModel.isLoggedIn()) {
            Swal.fire('Login Required', 'Please log in to manage your favorite stories.', 'info')
                .then(() => { window.location.hash = '#/login'; });
            return;
        }

        favoriteButton.disabled = true;
        const icon = favoriteButton.querySelector('i');
        const text = favoriteButton.querySelector('span');

        try {
            const isCurrentlyFavorite = await isStoryFavoriteInDb(storyId);
            let storyData;

            if (isCurrentlyFavorite) {
                await removeFavoriteStoryFromDb(storyId);
                Swal.fire({ title: 'Unsaved!', text: 'Story removed from favorites.', icon: 'info', timer: 1500, showConfirmButton: false });
                if (icon) icon.classList.replace('fas', 'far');
                if (text) text.textContent = 'Save';
                favoriteButton.classList.remove('favorited');
                favoriteButton.setAttribute('aria-pressed', 'false');
                favoriteButton.setAttribute('aria-label', `Save story to favorites`);

                if (window.location.hash === '#/favorites') {
                    const storyItemElement = qs(`#story-item-${storyId}`);
                    if (storyItemElement) {
                        storyItemElement.remove();
                        const list = qs('#favoriteStoriesList');
                        if (list && list.children.length === 0) {
                            list.innerHTML = '<p class="empty-state">You have no favorite stories left.</p>';
                        }
                    }
                }
            } else {
                storyData = await this._getStoryById(storyId);
                if (storyData) {
                    await addFavoriteStoryToDb(storyData);
                    Swal.fire({ title: 'Saved!', text: 'Story added to favorites.', icon: 'success', timer: 1500, showConfirmButton: false });
                    if (icon) icon.classList.replace('far', 'fas');
                    if (text) text.textContent = 'Unsave';
                    favoriteButton.classList.add('favorited');
                    favoriteButton.setAttribute('aria-pressed', 'true');
                    favoriteButton.setAttribute('aria-label', `Remove story from favorites`);
                } else {
                    Swal.fire('Error', 'Could not find story details to save. The story might be unavailable.', 'error');
                    return;
                }
            }
        } catch (error) {
            console.error("StoryPresenter: Error toggling favorite:", error);
            Swal.fire('Error', `Could not update favorite status: ${error.message}`, 'error');
            const stillIsFavorite = await isStoryFavoriteInDb(storyId);
            if (icon) icon.className = `fa-heart ${stillIsFavorite ? 'fas' : 'far'}`;
            if (text) text.textContent = stillIsFavorite ? 'Unsave' : 'Save';
            if (stillIsFavorite) favoriteButton.classList.add('favorited'); else favoriteButton.classList.remove('favorited');
            favoriteButton.setAttribute('aria-pressed', stillIsFavorite ? 'true' : 'false');
            favoriteButton.setAttribute('aria-label', `${stillIsFavorite ? 'Remove' : 'Save'} story ${stillIsFavorite ? 'from' : 'to'} favorites`);
        } finally {
            favoriteButton.disabled = false;
        }
    }
    
    _setupFavoriteButtonListeners() {
        const mainContent = qs('#mainContent');
        if (mainContent) {
            if (this._boundHandleFavoriteToggle) {
                mainContent.removeEventListener('click', this._boundHandleFavoriteToggle);
            }
            mainContent.addEventListener('click', this._boundHandleFavoriteToggle);
            console.log("StoryPresenter: Favorite toggle listener added to mainContent.");
        }
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
                    stories = response.listStory || [];
                    this._currentStories = stories;
                    if (isLoggedIn && stories.length > 0) await addStoriesToDb(stories);
                    console.log('StoryPresenter: Stories fetched from API.');
                } else {
                    throw new Error(response.message || 'Failed to fetch stories from API');
                }
            } catch (apiError) {
                console.warn('StoryPresenter: API fetch failed, trying IndexedDB:', apiError.message);
                if (isLoggedIn && (apiError.message.includes("token") || apiError.message.includes("Missing authentication"))) {
                    AuthModel.clearCredentials();
                    window.location.hash = "#/login";
                    Swal.fire('Session Expired', 'Please log in again.', 'warning');
                    return;
                }
                stories = await getStoriesFromDb();
                this._currentStories = stories;
                if (stories.length > 0) {
                    console.log('StoryPresenter: Stories loaded from IndexedDB.');
                    Swal.fire({ title: 'Offline Mode', text: 'Showing cached stories.', icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                } else {
                    console.error('StoryPresenter: Failed to fetch stories and no cache available.');
                    this._mainView.showError('Could not load stories. Please check connection or log in.');
                    return;
                }
            }
            
            const favoriteStatus = {};
            if (isLoggedIn) {
                for (const story of stories) {
                    if (story && story.id) {
                        favoriteStatus[story.id] = await isStoryFavoriteInDb(story.id);
                    }
                }
            }

            this._mainView.renderPage(
                () => this._homePageView.render(stories, favoriteStatus, isLoggedIn),
                () => {
                    setTimeout(() => {
                        this._setupHomePageMap(stories.filter(story => story && story.lat && story.lon));
                        if (isLoggedIn) this._setupFavoriteButtonListeners();
                    }, 150);
                }
            );

        } catch (error) {
            console.error('StoryPresenter: Error displaying home page:', error);
            if (AuthModel.isLoggedIn() && !window.location.hash.includes('/login')) {
                this._mainView.showError(error.message || 'Failed to load home page.');
            }
        }
    }

    _setupHomePageMap(storiesWithLocation) {
        const mapContainerId = 'storiesMap';
        const mapContainer = qs(`#${mapContainerId}`);
        if (!mapContainer) { console.warn(`#${mapContainerId} container not found.`); return; }
        try {
            const homeMap = MapUtils.initMap(mapContainerId, { center: CONFIG.DEFAULT_MAP_CENTER, zoom: 10 });
            if (!homeMap) { console.error("Home map init failed!"); return; }
            if (storiesWithLocation.length > 0) {
                MapUtils.addMarkers(homeMap, storiesWithLocation);
                try {
                    const bounds = L.latLngBounds(storiesWithLocation.map(s => [s.lat, s.lon]));
                    homeMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                } catch (boundsError) { homeMap.setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM); }
            } else {
                mapContainer.innerHTML = '<p class="info-text centered-text">No story locations to display.</p>';
            }
        } catch (mapError) {
            console.error(`Failed to init home map:`, mapError);
            if (mapContainer) mapContainer.innerHTML = `<p class="error-message">Could not load map: ${mapError.message}</p>`;
        }
    }

    displayAddStoryPage() {
        this.cleanupPageResources();
        this._mainView.renderPage(
            () => this._addStoryPageView.render(),
            () => {
                setTimeout(() => { this._setupAddStoryPage(); }, 150);
            }
        );
    }

    _setupAddStoryPage() {
        console.log("StoryPresenter: Setting up add story page features...");
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
        const submitButton = form ? form.querySelector('button[type="submit"]') : null;

        if (!form || !cameraPreview || !captureButton || !retakeButton || !imagePreview || 
            !descriptionInput || !useLocationCheckbox || !mapSection || !cameraErrorDiv || 
            !coordDisplay || !submitButton) {
            console.error("StoryPresenter: Essential elements missing in Add Story page DOM.");
            this._mainView.showError("Failed to initialize Add Story page components.");
            return;
        }

        this._cleanupAddStoryFormListener(); 

        this._capturedImageBlob = null;
        const startCameraAndHandleError = () => { 
            CameraUtils.startCamera(cameraPreview)
                .then(() => {
                    cameraErrorDiv.style.display = "none"; cameraErrorDiv.textContent = '';
                    captureButton.disabled = false; captureButton.style.display = "inline-block";
                    retakeButton.style.display = "none"; imagePreview.style.display = "none";
                    cameraPreview.style.display = "block";
                })
                .catch((err) => {
                    console.error("Failed to start camera:", err);
                    cameraErrorDiv.textContent = `Error: ${err.message}. Please grant permission.`;
                    cameraErrorDiv.style.display = "block"; captureButton.disabled = true;
                });
        };
        startCameraAndHandleError();

        captureButton.addEventListener('click', async () => { 
            captureButton.disabled = true;
            try {
                const blob = await CameraUtils.captureImageBlob(cameraPreview);
                this._capturedImageBlob = blob;
                imagePreview.src = URL.createObjectURL(this._capturedImageBlob);
                imagePreview.style.display = "block"; cameraPreview.style.display = "none";
                captureButton.style.display = "none"; retakeButton.style.display = "inline-block";
                CameraUtils.stopStream();
            } catch (error) {
                console.error("Failed to capture image:", error);
                Swal.fire('Capture Error', error.message || 'Could not capture image.', 'error');
                captureButton.disabled = false;
            }
        });
        retakeButton.addEventListener('click', () => { 
            if (this._capturedImageBlob) { URL.revokeObjectURL(imagePreview.src); this._capturedImageBlob = null; }
            imagePreview.style.display = "none"; imagePreview.src = "";
            startCameraAndHandleError();
        });

        this._selectedCoords = null;
        const initMapForPicking = () => { 
            if (!mapContainerElement) { console.error("Location picker map container not found."); return; }
            try {
                MapUtils.initLocationPickerMap( mapContainerElement.id, (coords) => {
                        this._selectedCoords = coords;
                        if (coordDisplay) coordDisplay.textContent = `Selected: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
                    }
                );
            } catch (error) {
                console.error("Failed to initialize location picker map:", error);
                if (mapContainerElement) mapContainerElement.innerHTML = `<p class="error-message">Could not load map: ${error.message}</p>`;
            }
        };
        useLocationCheckbox.addEventListener('change', (event) => { 
            if (event.target.checked) {
                mapSection.style.display = "block";
                setTimeout(() => { initMapForPicking(); }, 100); 
            } else {
                mapSection.style.display = "none"; this._selectedCoords = null;
                if (coordDisplay) coordDisplay.textContent = "Location not set";
                if (mapContainerElement) MapUtils.cleanupMap(mapContainerElement.id);
            }
        });
        mapSection.style.display = useLocationCheckbox.checked ? "block" : "none";
        if (coordDisplay) coordDisplay.textContent = "Location not set";
        if (useLocationCheckbox.checked) { setTimeout(() => { initMapForPicking(); }, 100); }


        this._boundAddStorySubmitHandler = async (event) => {
            event.preventDefault();
            const description = descriptionInput.value.trim();
            const useLocation = useLocationCheckbox.checked;

            if (!description) { Swal.fire('Input Required', 'Please provide a description.', 'warning'); return; }
            if (!this._capturedImageBlob) { Swal.fire('Input Required', 'Please capture an image.', 'warning'); return; }
            if (useLocation && !this._selectedCoords) { Swal.fire('Input Required', 'Pick a location or uncheck the option.', 'warning'); return; }
            if (this._capturedImageBlob.size > 1 * 1024 * 1024) { Swal.fire('File Too Large', 'Image size cannot exceed 1MB.', 'warning'); return; }

            const lat = useLocation ? this._selectedCoords.lat : undefined;
            const lon = useLocation ? this._selectedCoords.lng : undefined;

            const buttonText = submitButton.querySelector('.button-text');
            const buttonLoading = submitButton.querySelector('.button-loading');

            submitButton.disabled = true;
            if(buttonText) buttonText.style.display = 'none';
            if(buttonLoading) buttonLoading.style.display = 'inline-flex';

            try {
                const storyData = { description, photo: this._capturedImageBlob, lat, lon };
                const isGuestPost = !AuthModel.isLoggedIn();
                let response;
                if (isGuestPost) {
                    response = await StoryApiSource.addNewStoryGuest(storyData);
                } else {
                    response = await StoryApiSource.addNewStory(storyData);
                }

                if (!response.error) {
                    Swal.fire({ title: 'Success!', text: 'Your story has been added.', icon: 'success', timer: 1500, showConfirmButton: false })
                        .then(() => { window.location.hash = "#/home"; });
                } else {
                    throw new Error(response.message || "Failed to add story.");
                }
            } catch (error) {
                console.error("StoryPresenter: Error adding story:", error);
                Swal.fire("Upload Failed", error.message || "An unexpected error occurred.", "error");
            } finally {
                submitButton.disabled = false;
                if(buttonText) buttonText.style.display = 'inline';
                if(buttonLoading) buttonLoading.style.display = 'none';
            }
        };
        form.addEventListener('submit', this._boundAddStorySubmitHandler);
        console.log('StoryPresenter: AddStory form submit listener added.');
    }

    async displayDetailPage(storyId) {
        this.cleanupPageResources();
        this._mainView.showLoading();
        try {
            let story = null;
            const isLoggedIn = AuthModel.isLoggedIn();
            try {
                const response = await StoryApiSource.getStoryDetail(storyId);
                if (!response.error && response.story) {
                    story = response.story;
                } else { throw new Error(response.message || `Failed to fetch story ${storyId}`); }
            } catch (apiError) {
                console.warn(`API fetch failed for story ${storyId}, trying IDB:`, apiError.message);
                if (isLoggedIn && (apiError.message.includes("token") || apiError.message.includes("Missing authentication"))) {
                    AuthModel.clearCredentials(); window.location.hash = "#/login";
                    Swal.fire('Session Expired', 'Please log in again.', 'warning'); return;
                }
                story = await getStoryByIdFromDb(storyId);
                if (!story) {
                    this._mainView.showError(`Could not load story ID ${storyId}. Not in API or cache.`); return;
                }
                Swal.fire({ title: 'Offline Mode', text: 'Showing cached details.', icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
            
            let isFavorite = false;
            if (story && isLoggedIn) { isFavorite = await isStoryFavoriteInDb(story.id); }

            this._currentStories = story ? [story] : [];
            this._mainView.renderPage(
                () => this._detailPageView.render(story, isFavorite, isLoggedIn),
                () => {
                    setTimeout(() => {
                        if (story) this._setupDetailPageMap(story);
                        if (isLoggedIn) this._setupFavoriteButtonListeners();
                    }, 150);
                }
            );
        } catch (error) {
            console.error(`Error displaying detail page ${storyId}:`, error);
            if (AuthModel.isLoggedIn()) this._mainView.showError(error.message || 'Failed to load story details.');
        }
    }

    _setupDetailPageMap(story) {
        const mapContainerId = 'detailStoryMap';
        const mapContainer = qs(`#${mapContainerId}`);
        if (!mapContainer) { return; }

        if (story && story.lat && story.lon) {
            try {
                const detailMap = MapUtils.initMap(mapContainerId, { center: [story.lat, story.lon], zoom: 15, scrollWheelZoom: false });
                if (!detailMap) { console.error("Detail map init failed!"); return; }
                L.marker([story.lat, story.lon]).addTo(detailMap).bindPopup(`<b>${story.name || 'Story Location'}</b>`).openPopup();
                const layerControl = detailMap.getContainer().querySelector('.leaflet-control-layers');
                if (layerControl) layerControl.remove();
            } catch (mapError) {
                console.error(`Failed to init detail map:`, mapError);
                if (mapContainer) mapContainer.innerHTML = `<p class="error-message">Could not load map: ${mapError.message}</p>`;
            }
        }
    }

    async displayFavoriteStoriesPage() {
        this.cleanupPageResources();
        if (!AuthModel.isLoggedIn()) {
             Swal.fire('Login Required', 'Please log in to view favorites.', 'info').then(() => window.location.hash = '#/login');
             return;
        }
        this._mainView.showLoading();
        try {
            const favoriteStories = await getFavoriteStoriesFromDb();
            this._currentStories = favoriteStories;
            const favoriteStatus = {};
            favoriteStories.forEach(story => { if(story && story.id) favoriteStatus[story.id] = true; });

            this._mainView.renderPage(
                () => this._favoriteStoriesPageView.render(favoriteStories, favoriteStatus),
                () => { if (AuthModel.isLoggedIn()) this._setupFavoriteButtonListeners(); }
            );
        } catch (error) {
            console.error('Error displaying favorites:', error);
            this._mainView.showError(error.message || 'Failed to load favorites.');
        }
    }
}

export default StoryPresenter;