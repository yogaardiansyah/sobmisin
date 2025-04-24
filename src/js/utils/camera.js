// src/js/utils/camera.js
const CameraUtils = {
    _stream: null, // Store the active stream

    async startCamera(videoElement) {
        if (!videoElement) {
            throw new Error("Video element is required to start the camera.");
        }
        if (this._stream) {
            console.warn("Camera stream already active. Stopping previous stream.");
            this.stopStream(); // Stop existing stream before starting new one
        }

        try {
            const constraints = {
                video: {
                    // facingMode: 'user' // Prefer front camera
                    // facingMode: { exact: "environment" } // Prefer back camera
                    width: { ideal: 640 }, // Request a reasonable size
                    height: { ideal: 480 }
                },
                audio: false // No audio needed
            };
            this._stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this._stream;
            videoElement.onloadedmetadata = () => {
                videoElement.play();
            };
             console.log("Camera stream started successfully.");
            return true; // Indicate success
        } catch (err) {
            console.error("Error accessing media devices.", err);
            this._stream = null; // Ensure stream is null on error
             // Provide more specific error messages based on err.name
             if (err.name === 'NotAllowedError') {
                 throw new Error("Camera permission denied. Please allow access in your browser settings.");
             } else if (err.name === 'NotFoundError') {
                 throw new Error("No camera found on this device.");
             } else {
                 throw new Error(`Could not start camera: ${err.message}`);
             }
        }
    },

     async captureImageBlob(videoElement) {
        if (!this._stream || !videoElement || videoElement.readyState < videoElement.HAVE_METADATA) {
             console.error("Camera not ready or stream not active for capture.");
             throw new Error("Camera is not ready to capture.");
         }

        const canvas = document.createElement('canvas');
        // Set canvas dimensions to match video stream for best quality
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');

        // Draw the current video frame onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Return a Promise that resolves with the Blob
        return new Promise((resolve, reject) => {
             canvas.toBlob(blob => {
                 if (blob) {
                     console.log(`Image captured as Blob, size: ${Math.round(blob.size / 1024)} KB`);
                     resolve(blob);
                 } else {
                     reject(new Error("Failed to create Blob from canvas."));
                 }
             }, 'image/jpeg', 0.9); // Get as JPEG blob with 90% quality
        });
    },

    stopStream() {
        if (this._stream) {
            console.log("Stopping camera stream...");
            this._stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Track stopped: ${track.kind}`);
            });
            this._stream = null; // Clear the stored stream reference
            console.log("Camera stream stopped.");
        } else {
             // console.log("No active camera stream to stop.");
        }
    }
};

export default CameraUtils;