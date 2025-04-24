// src/js/utils/view-transition.js
export const runViewTransition = (updateCallback) => {
    // Cek apakah browser mendukung View Transitions API
    if (!document.startViewTransition) {
        console.warn('View Transitions API not supported, updating DOM directly.');
        updateCallback(); // Jalankan callback update DOM secara langsung
        return;
    }

    // Gunakan View Transitions API
    document.startViewTransition(() => {
         try {
            updateCallback(); // Lakukan perubahan DOM di dalam callback ini
         } catch (error) {
            console.error("Error during view transition update:", error);
            // Handle error, maybe revert DOM changes or show an error message
         }
    });
};