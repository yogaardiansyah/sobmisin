const AddStoryPage = {
    render() {
        return `
            <div class="container add-story-container">
                <h2>Add New Story</h2>
                <form id="addStoryForm" class="add-story-form" novalidate>
                    <fieldset class="form-section camera-section">
                        <legend>Capture Image</legend>
                        <div class="camera-area">
                             <video id="cameraPreview" playsinline autoplay muted aria-label="Camera Preview"></video>
                             <img id="imagePreview" alt="Captured image preview" style="display: none;" />
                        </div>
                        <div id="cameraError" class="error-message camera-error" style="display: none;"></div> <!-- DIV ERROR KAMERA -->
                        <div class="camera-controls">
                            <button type="button" id="captureButton" class="button button-primary"><i class="fas fa-camera"></i> Capture</button>
                            <button type="button" id="retakeButton" class="button" style="display: none;"><i class="fas fa-redo"></i> Retake</button>
                        </div>
                         <p class="info-text">Maximum image size: 1MB</p>
                    </fieldset>
                    <fieldset class="form-section">
                         <legend>Story Details</legend>
                        <div class="form-group">
                            <label for="description">Description:</label>
                            <textarea id="description" name="description" rows="4" required aria-required="true"></textarea>
                        </div>
                    </fieldset>
                     <fieldset class="form-section location-section">
                         <legend>Location (Optional)</legend>
                         <div class="form-group form-group-checkbox">
                             <input type="checkbox" id="useLocation" name="useLocation">
                             <label for="useLocation">Add location to story</label>
                         </div>
                         <div id="mapSection" style="display: none;">
                             <p>Click on the map to set the story location.</p>
                             <div id="locationPickerMap" class="map-picker"></div>
                              <p id="selectedCoords" class="info-text">Location not set</p>
                         </div>
                     </fieldset>
                    <button type="submit" class="button button-success">
                         <span class="button-text"><i class="fas fa-plus"></i> Add Story</span>
                         <span class="button-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i> Uploading...</span>
                    </button>
                </form>
            </div>
        `;1
    }
};

export default AddStoryPage;