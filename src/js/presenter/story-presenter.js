// src/js/presenter/story-presenter.js
import StoryApiSource from "../data/story-api-source.js";
import MapUtils from "../utils/map.js";
import CameraUtils from "../utils/camera.js";
import AuthModel from "../model/auth-model.js";
import Swal from "sweetalert2";

class StoryPresenter {
  constructor({ mainView, homePageView, addStoryPageView, detailPageView }) {
    this._mainView = mainView;
    this._homePageView = homePageView;
    this._addStoryPageView = addStoryPageView;
    this._detailPageView = detailPageView;

    this._mapInstanceHome = null;
    this._mapInstanceAdd = null;
    this._mapInstanceDetail = null;
    this._selectedCoords = null;
    this._capturedImageBlob = null;
  }

  // --- Resource Cleanup ---
  // Moved cleanup logic together for clarity

  _cleanupAddStoryResourcesOnly() {
    // Renamed to avoid confusion with the map part handled in cleanupPageResources
    console.log("Cleaning up add story specific resources (camera, blob)...");
    CameraUtils.stopStream();
    if (this._capturedImageBlob) {
      URL.revokeObjectURL(this._capturedImageBlob);
      this._capturedImageBlob = null;
    }
    this._selectedCoords = null; // Reset selected coords as well
  }

  cleanupPageResources() {
    console.log("Attempting cleanup of all page resources...");
    this._cleanupAddStoryResourcesOnly(); // Clean up camera etc.

    // Clean up home map if it exists
    if (this._mapInstanceHome) {
      console.log("Cleaning up home map instance.");
      try {
        this._mapInstanceHome.remove();
      } catch (e) {
        console.warn("Error removing home map instance:", e);
      }
      this._mapInstanceHome = null;
    }

    // Clean up add story map if it exists
    if (this._mapInstanceAdd) {
      console.log("Cleaning up add-story map instance.");
       try {
        this._mapInstanceAdd.remove();
      } catch (e) {
        console.warn("Error removing add-story map instance:", e);
      }
      this._mapInstanceAdd = null;
    }

    // Clean up detail map if it exists
    if (this._mapInstanceDetail) {
      console.log("Cleaning up detail map instance.");
       try {
        this._mapInstanceDetail.remove();
      } catch (e) {
        console.warn("Error removing detail map instance:", e);
      }
      this._mapInstanceDetail = null;
    }
    console.log("Page resource cleanup finished.");
  }

  // --- Home Page Logic ---
  async displayHomePage() {
    this.cleanupPageResources(); // <-- CALL CLEANUP FIRST
    this._mainView.showLoading();
    try {
      const response = await StoryApiSource.getAllStories({ location: 1 });
      if (!response.error) {
        this._mainView.renderPage(
          () => this._homePageView.render(response.listStory),
          () => this._setupHomeFeatures(response.listStory) // Pass stories here
        );
      } else {
        this._mainView.showError(response.message || "Failed to fetch stories.");
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      // ... (keep error handling)
      if (
        error.message.includes("token") ||
        error.message.includes("logged in")
      ) {
        AuthModel.clearCredentials();
        window.location.hash = "#/login";
        this._mainView.showError("Session expired. Please log in again.");
      } else {
        this._mainView.showError(error.message || "Could not connect to the server.");
      }
    } finally {
        // Ensure loading is hidden even if renderPage fails before setup
        // Or handle loading hiding within renderPage/showError more reliably
        // For now, let's assume renderPage handles hiding loading on success/error display
    }
  }

  _setupHomeFeatures(stories) { // Accept stories as argument
    console.log("Setting up home features...");
    const mapContainer = document.getElementById("storiesMap");

    if (mapContainer) {
        // Safety check: Ensure no lingering instance (though cleanupPageResources should handle it)
        if (this._mapInstanceHome) {
            console.warn("Home map instance found during setup, removing again.");
            try {
                this._mapInstanceHome.remove();
            } catch(e) { console.error("Error removing lingering home map:", e); }
            this._mapInstanceHome = null;
        }

      try {
        // Initialize a new map
        console.log("Initializing home map...");
        this._mapInstanceHome = MapUtils.initMap("storiesMap");
        const storiesWithLocation = stories.filter((story) => story.lat && story.lon);

        if (storiesWithLocation.length > 0) {
          MapUtils.addMarkers(this._mapInstanceHome, storiesWithLocation);
          // Use try-catch for fitBounds as it can fail if markers are invalid
          try {
              const bounds = L.latLngBounds(storiesWithLocation.map((s) => [s.lat, s.lon]));
              this._mapInstanceHome.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 }); // Added maxZoom
          } catch (boundsError) {
              console.error("Error fitting map bounds:", boundsError);
              // Fallback to default view if bounds fail
              this._mapInstanceHome.setView(MapUtils._defaultCenter, MapUtils._defaultZoom);
          }
        } else {
          console.log("No stories with location data found for home map.");
          // Optionally display a message within the map container
           mapContainer.innerHTML = '<p style="text-align: center; padding: 20px;">No locations to display.</p>';
        }
      } catch (error) {
        console.error("Failed to initialize home map:", error);
        mapContainer.innerHTML = `<p>Error loading map: ${error.message}</p>`;
      }
    } else {
      console.warn("#storiesMap container not found during setup");
    }
  }

  // --- Add Story Page Logic ---
  displayAddStoryPage() {
    this.cleanupPageResources(); // <-- CALL CLEANUP FIRST
    // No need to call _cleanupAddStoryResources separately anymore here
    this._mainView.renderPage(
      () => this._addStoryPageView.render(),
      () => this._setupAddStoryFeatures()
    );
  }

  _setupAddStoryFeatures() {
    console.log("Setting up add story features...");
    // ... (get elements as before) ...
    const form = document.getElementById("addStoryForm");
    const cameraPreview = document.getElementById("cameraPreview");
    const captureButton = document.getElementById("captureButton");
    const retakeButton = document.getElementById("retakeButton");
    const imagePreview = document.getElementById("imagePreview");
    const mapContainer = document.getElementById("locationPickerMap"); // The actual map div
    const descriptionInput = document.getElementById("description");
    const useLocationCheckbox = document.getElementById("useLocation");
    const mapSection = document.getElementById("mapSection"); // The container section
    const cameraErrorDiv = document.getElementById("cameraError");
    const coordDisplay = document.getElementById("selectedCoords"); // Get coord display element

    if ( /* ... check all elements ... */
      !form || !cameraPreview || !captureButton || !retakeButton || !imagePreview ||
      !mapContainer || !descriptionInput || !useLocationCheckbox || !mapSection ||
      !cameraErrorDiv || !coordDisplay
    ) {
      console.error("One or more elements missing in add story page.");
      this._mainView.showError("Failed to load add story page components.");
      return;
    }

    // --- Camera Logic (keep as is) ---
    const startCameraAndHandleError = () => { /* ... keep implementation ... */
         CameraUtils.startCamera(cameraPreview)
        .then(() => {
          cameraErrorDiv.style.display = "none";
          captureButton.style.display = "inline-block";
          retakeButton.style.display = "none";
          imagePreview.style.display = "none";
          cameraPreview.style.display = "block";
        })
        .catch((err) => {
          console.error("Failed to start camera:", err);
          cameraErrorDiv.textContent = `Could not access camera: ${err.message}. Please grant permission.`;
          cameraErrorDiv.style.display = "block";
          captureButton.style.display = "none";
        });
    };
    startCameraAndHandleError();

    captureButton.onclick = async () => { /* ... keep implementation ... */
        try {
        this._capturedImageBlob = await CameraUtils.captureImageBlob(cameraPreview);
        if (this._capturedImageBlob) {
          imagePreview.src = URL.createObjectURL(this._capturedImageBlob);
          imagePreview.style.display = "block";
          cameraPreview.style.display = "none";
          captureButton.style.display = "none";
          retakeButton.style.display = "inline-block";
          CameraUtils.stopStream();
        }
      } catch (error) {
        console.error("Failed to capture image:", error);
        Swal.fire("Error", "Error capturing image.", "error");
      }
    };

    retakeButton.onclick = () => { /* ... keep implementation ... */
        imagePreview.style.display = "none";
      imagePreview.src = "";
      if (this._capturedImageBlob) {
        URL.revokeObjectURL(this._capturedImageBlob);
        this._capturedImageBlob = null;
      }
      cameraPreview.style.display = "block";
      captureButton.style.display = "inline-block";
      retakeButton.style.display = "none";
      startCameraAndHandleError();
    };

    // --- Map Logic ---
    const initMapForPicking = () => {
      // Safety check
      if (this._mapInstanceAdd) {
        console.warn("Add-story map instance found during initMapForPicking, removing.");
         try {
            this._mapInstanceAdd.remove();
         } catch(e) { console.error("Error removing lingering add-story map:", e); }
        this._mapInstanceAdd = null;
      }

      try {
        console.log("Initializing location picker map...");
        this._mapInstanceAdd = MapUtils.initLocationPickerMap(
          "locationPickerMap",
          (coords) => {
            this._selectedCoords = coords;
            console.log("Location selected:", coords);
            if (coordDisplay) { // Check if element exists
              coordDisplay.textContent = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;
            }
          }
        );
        // Ensure map size is correct after potentially being hidden
        setTimeout(() => {
            if (this._mapInstanceAdd) this._mapInstanceAdd.invalidateSize()
        }, 150);
      } catch (error) {
        console.error("Failed to initialize location picker map:", error);
        // Ensure mapContainer refers to the actual map div here
        const actualMapDiv = document.getElementById('locationPickerMap');
        if(actualMapDiv) actualMapDiv.innerHTML = `<p>Error loading map: ${error.message}</p>`;
      }
    };

    useLocationCheckbox.onchange = (event) => {
      if (event.target.checked) {
        mapSection.style.display = "block";
        // Only initialize if it hasn't been initialized yet in this view
        if (!this._mapInstanceAdd) {
            initMapForPicking();
        } else {
             // If already initialized, just ensure size is correct
             setTimeout(() => {
                if (this._mapInstanceAdd) this._mapInstanceAdd.invalidateSize()
            }, 100);
        }
      } else {
        mapSection.style.display = "none";
        this._selectedCoords = null;
        if (coordDisplay) { // Check if element exists
          coordDisplay.textContent = "Location not set";
        }
        // Optional: Remove the map instance if location is unchecked to save resources,
        // but it will need re-initialization if checked again.
        // if (this._mapInstanceAdd) {
        //     console.log("Removing add-story map as location unchecked.");
        //     this._mapInstanceAdd.remove();
        //     this._mapInstanceAdd = null;
        // }
      }
    };
    // Initial state based on checkbox (it should be unchecked by default in HTML)
    mapSection.style.display = useLocationCheckbox.checked ? "block" : "none";
    if (coordDisplay) coordDisplay.textContent = "Location not set"; // Set initial text

    // --- Form Submission (keep as is) ---
    form.onsubmit = async (event) => { /* ... keep implementation ... */
        event.preventDefault();
        const description = descriptionInput.value.trim();
        const useLocation = useLocationCheckbox.checked;

        // Validasi (keep as is)
        if (!description) { /* ... */ return; }
        if (!this._capturedImageBlob) { /* ... */ return; }
        if (useLocation && !this._selectedCoords) { /* ... */ return; }
        if (this._capturedImageBlob.size > 1 * 1024 * 1024) { /* ... */ return; }

        const lat = useLocation ? this._selectedCoords.lat : null;
        const lon = useLocation ? this._selectedCoords.lng : null;

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        Swal.fire({ /* ... keep Swal options ... */ });

        try {
            const useGuest = !AuthModel.isLoggedIn();
            const storyData = { description, photo: this._capturedImageBlob, lat, lon };
            let response;

            if (useGuest) { /* ... */ response = await StoryApiSource.addNewStoryGuest(storyData); }
            else { /* ... */ response = await StoryApiSource.addNewStory(storyData); }

            Swal.close();

            if (!response.error) {
                Swal.fire("Success!", "Story added successfully!", "success");
                // Cleanup is handled by navigating away via hash change,
                // which will trigger cleanupPageResources on the next page load.
                window.location.hash = "#/home";
            } else {
                 Swal.fire("Error!", response.message || "Failed to add story.", "error");
                 submitButton.disabled = false;
                 submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Story';
            }
        } catch (error) {
            Swal.close();
            console.error("Error adding story:", error);
            Swal.fire("Error!", error.message || "An error occurred while adding the story.", "error");
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Add Story';
        }
    };
  }


  // --- Detail Page Logic ---
  async displayDetailPage(storyId) {
    this.cleanupPageResources(); // <-- CALL CLEANUP FIRST
    this._mainView.showLoading();
    try {
      const response = await StoryApiSource.getStoryDetail(storyId);
      if (!response.error && response.story) {
        this._mainView.renderPage(
          () => this._detailPageView.render(response.story),
          () => this._setupDetailFeatures(response.story)
        );
      } else {
        this._mainView.showError(response.message || "Failed to fetch story details.");
        // Optionally redirect if story not found after showing error
        // setTimeout(() => window.location.hash = '#/home', 3000);
      }
    } catch (error) {
      console.error("Error fetching story detail:", error);
       // ... (keep error handling)
      if (
        error.message.includes("token") ||
        error.message.includes("logged in")
      ) {
        AuthModel.clearCredentials();
        window.location.hash = "#/login";
        this._mainView.showError("Session expired. Please log in again.");
      } else {
        this._mainView.showError(error.message || "Could not connect to the server.");
      }
    } finally {
        // See comment in displayHomePage about loading indicator handling
    }
  }

  _setupDetailFeatures(story) {
    console.log("Setting up detail page features...");
    if (story.lat && story.lon) {
      const mapContainer = document.getElementById("detailStoryMap");
      if (mapContainer) {
        // Safety check
        if (this._mapInstanceDetail) {
            console.warn("Detail map instance found during setup, removing again.");
             try {
                this._mapInstanceDetail.remove();
             } catch(e) { console.error("Error removing lingering detail map:", e); }
            this._mapInstanceDetail = null;
        }

        try {
          console.log("Initializing detail map...");
          // Initialize map centered on the story
          this._mapInstanceDetail = MapUtils.initMap("detailStoryMap", {
            center: [story.lat, story.lon],
            zoom: 15, // Zoom closer for detail
            scrollWheelZoom: false, // Make it less interactive if desired
          });
          // Add only the marker for this story
          MapUtils.addMarkers(this._mapInstanceDetail, [story]);

           // Optional: Disable interactions for a static view
          // this._mapInstanceDetail.dragging.disable();
          // this._mapInstanceDetail.touchZoom.disable();
          // this._mapInstanceDetail.doubleClickZoom.disable();
          // this._mapInstanceDetail.boxZoom.disable();
          // this._mapInstanceDetail.keyboard.disable();
          // if (this._mapInstanceDetail.tap) this._mapInstanceDetail.tap.disable();
          // mapContainer.style.cursor='default';
           // Ensure map size is correct
           setTimeout(() => {
                if (this._mapInstanceDetail) this._mapInstanceDetail.invalidateSize()
            }, 150);

        } catch (error) {
          console.error("Failed to initialize detail map:", error);
          mapContainer.innerHTML = `<p>Error loading map: ${error.message}</p>`;
        }
      } else {
        console.warn("#detailStoryMap container not found during setup");
      }
    } else {
        // Handle case where story has no location in the setup phase as well
        const mapContainerElement = document.getElementById("detailStoryMapContainer"); // The section container
        if (mapContainerElement) {
            const existingNoLocation = mapContainerElement.querySelector('.no-location-info');
            if(!existingNoLocation) { // Avoid adding duplicate messages if render already did it
                 mapContainerElement.innerHTML += '<p class="no-location-info">Location data is not available for this story.</p>';
            }
             // Ensure the map div itself (if it exists from template) is empty or hidden
             const mapDiv = document.getElementById("detailStoryMap");
             if (mapDiv) mapDiv.style.display = 'none';
        }
    }
  }
}

export default StoryPresenter;