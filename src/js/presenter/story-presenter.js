// src/js/presenter/story-presenter.js
import StoryApiSource from '../data/story-api-source.js';
import MapUtils from '../utils/map.js';
import CameraUtils from '../utils/camera.js';
import AuthModel from '../model/auth-model.js';

class StoryPresenter {
    constructor({ mainView, homePageView, addStoryPageView }) {
        this._mainView = mainView;
        this._homePageView = homePageView; // View specific for home page rendering
        this._addStoryPageView = addStoryPageView; // View specific for add story page rendering

        this._mapInstanceHome = null;
        this._mapInstanceAdd = null;
        this._selectedCoords = null; // Store coords from map click
        this._capturedImageBlob = null; // Store captured image blob
    }

    // --- Home Page Logic ---
    async displayHomePage() {
        this._mainView.showLoading();
        try {
            const response = await StoryApiSource.getAllStories({ location: 1 }); // Get stories with location
            if (!response.error) {
                this._mainView.renderPage(
                    () => this._homePageView.render(response.listStory), // Pass stories to home page view
                    () => this._setupHomeFeatures(response.listStory) // Callback after render
                );
            } else {
                this._mainView.showError(response.message || 'Failed to fetch stories.');
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
             // Check if it's an auth error (e.g., token expired)
            if (error.message.includes('token') || error.message.includes('logged in')) {
                AuthModel.clearCredentials(); // Clear invalid credentials
                window.location.hash = '#/login'; // Redirect to login
                 this._mainView.showError('Session expired. Please log in again.');
            } else {
                this._mainView.showError(error.message || 'Could not connect to the server.');
            }
        }
    }

    _setupHomeFeatures(stories) {
        console.log('Setting up home features...');
        const mapContainer = document.getElementById('storiesMap');
        if (mapContainer) {
            try {
                 this._mapInstanceHome = MapUtils.initMap('storiesMap');
                 const storiesWithLocation = stories.filter(story => story.lat && story.lon);
                 if (storiesWithLocation.length > 0) {
                    MapUtils.addMarkers(this._mapInstanceHome, storiesWithLocation);
                     // Fit map bounds to markers
                     const bounds = L.latLngBounds(storiesWithLocation.map(s => [s.lat, s.lon]));
                     this._mapInstanceHome.fitBounds(bounds, { padding: [50, 50] }); // Add padding
                 } else {
                     console.log("No stories with location data found.");
                 }
            } catch (error) {
                console.error("Failed to initialize home map:", error);
                mapContainer.innerHTML = '<p>Error loading map.</p>';
            }
        } else {
             console.warn('#storiesMap container not found');
        }
    }

    // --- Add Story Page Logic ---
    displayAddStoryPage() {
         this._cleanupAddStoryResources(); // Clean up previous instances if any
         this._mainView.renderPage(
             () => this._addStoryPageView.render(), // Render the add story form
             () => this._setupAddStoryFeatures() // Callback to initialize camera/map
         );
    }

     _setupAddStoryFeatures() {
        console.log('Setting up add story features...');
        const form = document.getElementById('addStoryForm');
        const cameraPreview = document.getElementById('cameraPreview');
        const captureButton = document.getElementById('captureButton');
        const retakeButton = document.getElementById('retakeButton');
        const imagePreview = document.getElementById('imagePreview');
        const mapContainer = document.getElementById('locationPickerMap');
        const descriptionInput = document.getElementById('description');
         const useLocationCheckbox = document.getElementById('useLocation');
         const mapSection = document.getElementById('mapSection');

        if (!form || !cameraPreview || !captureButton || !imagePreview || !mapContainer || !descriptionInput || !retakeButton || !useLocationCheckbox || !mapSection) {
            console.error('One or more elements missing in add story page.');
            this._mainView.showError('Failed to load add story page components.');
            return;
        }

        // --- Camera Logic ---
        CameraUtils.startCamera(cameraPreview)
            .then(() => {
                captureButton.style.display = 'block';
                retakeButton.style.display = 'none';
                imagePreview.style.display = 'none';
                cameraPreview.style.display = 'block';
            })
            .catch(err => {
                console.error("Failed to start camera:", err);
                cameraPreview.innerHTML = `<p>Could not access camera. Please grant permission. ${err.message}</p>`;
                captureButton.style.display = 'none';
            });

        captureButton.onclick = async () => {
            try {
                this._capturedImageBlob = await CameraUtils.captureImageBlob(cameraPreview);
                if (this._capturedImageBlob) {
                    imagePreview.src = URL.createObjectURL(this._capturedImageBlob);
                    imagePreview.style.display = 'block';
                    cameraPreview.style.display = 'none';
                    captureButton.style.display = 'none';
                    retakeButton.style.display = 'block';
                    CameraUtils.stopStream(); // Stop stream AFTER capture
                }
            } catch (error) {
                console.error("Failed to capture image:", error);
                alert('Error capturing image.');
            }
        };

        retakeButton.onclick = () => {
             CameraUtils.startCamera(cameraPreview) // Restart camera
                 .then(() => {
                     imagePreview.style.display = 'none';
                     imagePreview.src = ''; // Clear previous image
                     if (this._capturedImageBlob) {
                        URL.revokeObjectURL(this._capturedImageBlob); // Release memory
                        this._capturedImageBlob = null;
                     }
                     cameraPreview.style.display = 'block';
                     captureButton.style.display = 'block';
                     retakeButton.style.display = 'none';
                 })
                 .catch(err => {
                     console.error("Failed to restart camera:", err);
                     alert('Could not restart camera.');
                 });
         };


        // --- Map Logic ---
         const initMapForPicking = () => {
             if (!this._mapInstanceAdd) { // Initialize only once
                 try {
                     this._mapInstanceAdd = MapUtils.initLocationPickerMap('locationPickerMap', (coords) => {
                         this._selectedCoords = coords;
                         console.log('Location selected:', coords);
                         // Optionally update UI to show selected coords
                         const coordDisplay = document.getElementById('selectedCoords');
                         if (coordDisplay) {
                             coordDisplay.textContent = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;
                         }
                     });
                 } catch (error) {
                     console.error("Failed to initialize location picker map:", error);
                     mapContainer.innerHTML = '<p>Error loading map for location picking.</p>';
                 }
             } else {
                 // Ensure map size is correct if it was hidden
                 this._mapInstanceAdd.invalidateSize();
             }
         }

         useLocationCheckbox.onchange = (event) => {
             if (event.target.checked) {
                 mapSection.style.display = 'block';
                 initMapForPicking(); // Initialize map when shown
             } else {
                 mapSection.style.display = 'none';
                 this._selectedCoords = null; // Clear coords if checkbox unchecked
                 const coordDisplay = document.getElementById('selectedCoords');
                  if (coordDisplay) {
                      coordDisplay.textContent = 'Location not set';
                  }
             }
         };

         // Initially hide map section
         mapSection.style.display = 'none';


        // --- Form Submission ---
        form.onsubmit = async (event) => {
            event.preventDefault();
            const description = descriptionInput.value.trim();
            const useLocation = useLocationCheckbox.checked;

            if (!description) {
                alert('Description cannot be empty.');
                return;
            }
            if (!this._capturedImageBlob) {
                alert('Please capture an image first.');
                return;
            }
            if (useLocation && !this._selectedCoords) {
                alert('Please click on the map to select a location or uncheck the location option.');
                return;
            }

            // Check image size (max 1MB)
            if (this._capturedImageBlob.size > 1 * 1024 * 1024) {
                alert('Image size exceeds 1MB limit.');
                return;
            }

            const lat = useLocation ? this._selectedCoords.lat : null;
            const lon = useLocation ? this._selectedCoords.lng : null;

            this._mainView.showLoading(); // Show global loading indicator
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Uploading...';


            try {
                // Decide whether to use guest or authenticated endpoint
                // For simplicity, let's assume we always use the authenticated endpoint if logged in
                 const useGuest = !AuthModel.isLoggedIn(); // Example logic: use guest if not logged in

                 const storyData = {
                     description,
                     photo: this._capturedImageBlob,
                     lat: lat,
                     lon: lon,
                 };

                 let response;
                 if (useGuest) {
                     console.log("Adding story as guest...");
                     response = await StoryApiSource.addNewStoryGuest(storyData);
                 } else {
                     console.log("Adding story as logged in user...");
                     response = await StoryApiSource.addNewStory(storyData);
                 }


                // const response = await StoryApiSource.addNewStory({
                //     description,
                //     photo: this._capturedImageBlob,
                //     lat,
                //     lon,
                // });

                if (!response.error) {
                    alert('Story added successfully!');
                    this._cleanupAddStoryResources(); // Clean up camera/map/blob
                    window.location.hash = '#/home'; // Navigate back home
                } else {
                    this._mainView.showError(response.message || 'Failed to add story.'); // Show error in main view
                    submitButton.disabled = false;
                    submitButton.textContent = 'Add Story';
                }
            } catch (error) {
                console.error('Error adding story:', error);
                 this._mainView.showError(error.message || 'An error occurred while adding the story.');
                 submitButton.disabled = false;
                 submitButton.textContent = 'Add Story';
            }
            // No finally block for loading/button here, as navigation happens on success
        };
    }

     _cleanupAddStoryResources() {
         console.log('Cleaning up add story resources...');
         CameraUtils.stopStream(); // Ensure stream is stopped
         if (this._capturedImageBlob) {
             URL.revokeObjectURL(this._capturedImageBlob); // Revoke object URL
             this._capturedImageBlob = null;
         }
         if (this._mapInstanceAdd) {
             this._mapInstanceAdd.remove(); // Remove Leaflet map instance
             this._mapInstanceAdd = null;
         }
         this._selectedCoords = null;
     }

     // Call cleanup when navigating away (handled by router/main presenter potentially)
     cleanupPageResources() {
         this._cleanupAddStoryResources(); // Make sure resources are freed
         if (this._mapInstanceHome) {
             this._mapInstanceHome.remove();
             this._mapInstanceHome = null;
         }
     }
}

export default StoryPresenter;