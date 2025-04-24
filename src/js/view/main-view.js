// src/js/view/main-view.js
import { runViewTransition } from '../utils/view-transition.js';
import createLoadingIndicator from './components/loading-indicator.js'; // Optional advanced loader

class MainView {
    constructor(mainElement) {
        if (!mainElement) {
            throw new Error('Main element is required for MainView');
        }
        this._mainElement = mainElement;
    }

    // Fungsi untuk merender konten ke main element dengan transisi
    renderPage(pageRenderer, presenterCallback = null) {
        runViewTransition(() => {
            // Hapus event listeners dari konten lama jika perlu (Mencegah memory leak)
            // Ini lebih kompleks; pendekatan mudah adalah mengandalkan garbage collection
            // atau framework jika digunakan.
            this._mainElement.innerHTML = ''; // Kosongkan dulu

            try {
                 const pageContent = pageRenderer(); // Panggil fungsi render page (misal, LoginPage.render())

                 if (pageContent instanceof HTMLElement) {
                     this._mainElement.appendChild(pageContent);
                 } else if (typeof pageContent === 'string') {
                     this._mainElement.innerHTML = pageContent;
                 } else {
                     console.error('Page renderer did not return valid content (HTML string or Element)');
                     this.showError('Failed to load page content.');
                     return; // Hentikan eksekusi jika konten tidak valid
                 }

                 // Panggil callback presenter SETELAH DOM diupdate
                 if (presenterCallback && typeof presenterCallback === 'function') {
                    // Beri sedikit waktu agar DOM benar-benar siap (terutama untuk map init)
                     setTimeout(() => {
                         try {
                            presenterCallback();
                         } catch(callbackError) {
                             console.error("Error in presenter callback after render:", callbackError);
                             this.showError(`Error setting up page features: ${callbackError.message}`);
                         }
                     }, 0); // Timeout 0 untuk eksekusi setelah render cycle saat ini
                 }
            } catch (renderError) {
                 console.error("Error rendering page:", renderError);
                 this.showError(`Failed to render page: ${renderError.message}`);
            }


        });
    }

    showLoading() {
        // Gunakan transisi view saat menampilkan loading juga
         runViewTransition(() => {
             this._mainElement.innerHTML = ''; // Clear previous content
             // this._mainElement.appendChild(createLoadingIndicator()); // Jika pakai komponen
             this._mainElement.innerHTML = '<div class="loading-indicator global-loading">Loading...</div>'; // Simple version
         });
    }

    showError(message) {
         // Error bisa ditampilkan di dalam main content atau di area notifikasi khusus
         // Untuk simplicity, kita tampilkan di main content
          runViewTransition(() => {
              this._mainElement.innerHTML = `<div class="container error-container"><h2>Error</h2><p class="error-message">${message}</p><a href="#/home">Go Home</a></div>`;
          });
    }

     // Helper untuk membersihkan error (jika error ditampilkan di area spesifik)
     clearError() {
         const errorContainer = this._mainElement.querySelector('.error-container');
         if (errorContainer) {
            errorContainer.remove();
         }
     }
}

export default MainView;