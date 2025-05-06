const CameraUtils = {
    _stream: null,

    async startCamera(videoElement) {
        if (!videoElement) {
            throw new Error("Video element is required to start the camera.");
        }
        if (this._stream) {
            console.warn("Camera stream already active. Stopping previous stream.");
            this.stopStream();
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            this._stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this._stream;
            videoElement.onloadedmetadata = () => {
                videoElement.play();
            };
             console.log("Camera stream started successfully.");
            return true;
        } catch (err) {
            console.error("Error accessing media devices.", err);
            this._stream = null;
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
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');

        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve, reject) => {
             canvas.toBlob(blob => {
                 if (blob) {
                     console.log(`Image captured as Blob, size: ${Math.round(blob.size / 1024)} KB`);
                     resolve(blob);
                 } else {
                     reject(new Error("Failed to create Blob from canvas."));
                 }
             }, 'image/jpeg', 0.9);
        });
    },

    stopStream() {
        if (this._stream) {
            console.log("Stopping camera stream...");
            this._stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Track stopped: ${track.kind}`);
            });
            this._stream = null;
            console.log("Camera stream stopped.");
        } else {
        }
    }
};

export default CameraUtils;